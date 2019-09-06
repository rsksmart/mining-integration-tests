const config = require('../config');
const Curl = require('node-libcurl').Curl;
const randomHex = require('randomhex');
const btclib = require('bitcoinjs-lib');
const expect = require('chai').expect;
const submitMethodCases = require('./submit-method-cases').submitMethodCases;
var rlp = require('rlp');
const createKeccakHash = require('keccak');
const CURL_DEFAULT_HTTP_VERSION = "1.1";
const CPV_JUMP_FACTOR = 7;
const CPV_JUMP = 64;
const MAX_NUMBER_OF_UNCLES = 3;

const curlHttpVersions = {
  "1.0": Curl.http.VERSION_1_0,
  "1.1": Curl.http.VERSION_1_1,
  "NONE": Curl.http.VERSION_NONE
}

var addLeadingZeros = (totalLength, s) => {
  let lenS = s.toString(16).length;
  for (lenS; lenS < totalLength; lenS++) {
    s = "0" + s.toString(16);
  }
  return s;
}

async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  })
}

async function promiseRequest(options, body) {
  return new Promise((resolve, reject) => {
    const curl = new Curl();

    curl.setOpt(Curl.option.URL, options.host);
    curl.setOpt(Curl.option.PORT, options.port);
    curl.setOpt(Curl.option.POST, 1);
    curl.setOpt(Curl.option.HTTPHEADER, [options.headers.join('; ')]);
    curl.setOpt(Curl.option.USERPWD, options.auth);
    curl.setOpt(Curl.option.POSTFIELDS, body);
    curl.setOpt(Curl.option.HTTP_VERSION, options.httpversion || curlHttpVersions[CURL_DEFAULT_HTTP_VERSION])

    curl.on('end', (statusCode, body, responseHeaders) => {
      curl.close();
      resolve(body);
    });

    curl.on('error', (e) => {
      curl.close();
      reject(e);
    });

    curl.perform();
  });
}

function rskdPromiseRequest(method, params, poolContext) {
  const body = {
    jsonrpc: "2.0",
    method: method,
    params: params || [],
    id: 1
  }

  const postBody = JSON.stringify(body);

  const headers = poolContext.headers.slice(0); // copy array
  headers.push("Content-Length: " + postBody.length);

  const options = {
    host: config.rskd.url,
    port: config.rskd.rpcport,
    auth: config.rskd.user + ":" + config.rskd.pass,
    method: 'POST',
    headers: headers,
    httpversion: curlHttpVersions[poolContext.httpversion]
  };

  return promiseRequest(options, postBody);
}


function bitcoindPromiseRequest(method, params, poolContext) {
  const body = {
    jsonrpc: "2.0",
    method: method,
    params: params || [],
    id: 1
  }

  const postBody = JSON.stringify(body);

  const headers = poolContext.headers.slice(0); // copy array
  headers.push("Content-Length: " + postBody.length);

  const options = {
    host: config.bitcoind.url,
    port: config.bitcoind.rpcport,
    auth: config.bitcoind.user + ":" + config.bitcoind.pass,
    method: 'POST',
    headers: headers,
    httpversion: curlHttpVersions[poolContext.httpversion]
  };

  return promiseRequest(options, postBody);
}
async function getBlockTemplate() {
  const body = {
    jsonrpc: "2.0",
    method: "getblocktemplate",
    params: [],
    id: 1
  }

  const postBody = JSON.stringify(body);

  const options = {
    host: config.bitcoind.url,
    port: config.bitcoind.rpcport,
    auth: config.bitcoind.user + ":" + config.bitcoind.pass,
    method: "POST",
    headers: [
      "Content-Type: application/json",
      "Content-Length: " + postBody.length
    ]
  };
  const promiseBlockTemplate = await promiseRequest(options, postBody);
  return promiseBlockTemplate;
}

function getRskWork(poolContext) {
  return rskdPromiseRequest("mnr_getWork", [], poolContext);
}

function rskJsonRpcRequestMiningModule(method, params, poolContext) {
  methodWithPreffix = method;
  if (!methodWithPreffix.startsWith("mnr_"))
    methodWithPreffix = "mnr_" + methodWithPreffix;
  return rskdPromiseRequest(methodWithPreffix, params, poolContext);
}

function getRskBlockByNumber(blockNumber, poolContext) {
  return rskdPromiseRequest("eth_getBlockByNumber", [blockNumber, true], poolContext);
}

function getRskBlockByHash(blockHash, poolContext) {
  return rskdPromiseRequest("eth_getBlockByHash", [blockHash, true], poolContext);
}

function buildBlock(vtxs, gbt) {
  let block = new btclib.Block();

  block.prevHash = Buffer.from(gbt.previousblockhash, 'hex');
  block.merkleRoot = Buffer.from(btclib.Block.calculateMerkleRoot(vtxs), 'hex');
  block.timestamp = Buffer.from(randomHex(4).substr(2, 10), 'hex');
  block.bits = 0x1749500d; // hardcoded, no special meaning since we don't test against the bitcoin network
  block.transactions = vtxs;

  return block;
}

function buildCoinbase(gbt, rskwork) {
  const extraNonce1 = randomHex(4).substr(2);
  const extraNonce2 = randomHex(4).substr(2);
  const blockHashForMergedMining = rskwork.blockHashForMergedMining.substr(2);
  const coinbase1 = "02000000010000000000000000000000000000000000000000000000000000000000000000ffffffff28";
  const coinbase2 = "6f6e312f50726f6a65637420425443506f6f6c2f010000000000000000000000ffffffff03c862a804000000001976a914c0174e89bd93eacd1d5a1af4ba1802d412afc08688ac0000000000000000266a24aa21a9edf315b8139d4920109434e248fd6b58d5623b2bde1617816df4f27cbe460eaf6500000000000000002952534b424c4f434b3a" + blockHashForMergedMining + "00000000";
  return btclib.Transaction.fromHex(coinbase1 + extraNonce1 + extraNonce2 + coinbase2);
}

function buildTransactions(gbt, rskwork) {
  return [buildCoinbase(gbt, rskwork)];
}

function mineValidBlock(gbt, rskwork) {
  let block, vtxs;
  const target = Buffer.from(rskwork.target.substr(2), 'hex')

  do {
    vtxs = buildTransactions(gbt, rskwork);
    block = buildBlock(vtxs, gbt, rskwork);
    blockHash = block.getHash().reverse();
  } while (blockHash.compare(target) > 0)

  return block;
}

function getHashFromBitcoinBlockHeader(bitcoinMergeMiningHeader) {
  Buffer.from('ff', 'hex');
  let block = btclib.Block.fromHex(bitcoinMergeMiningHeader);
  return block.getId();
}

let lastWork = null;
async function prepareRskWork(poolContext, expectNewWork = false) {
  let work = JSON.parse(await getRskWork(poolContext)).result;
  while (expectNewWork && lastWork && (work.blockHashForMergedMining == lastWork.blockHashForMergedMining)) {
    await sleep(100);
    work = JSON.parse(await getRskWork(poolContext)).result;
  }
  lastWork = work;
  return work;
}

async function buildAndMergeMineBlock(poolContext, expectNewWork = false) {
  const gbt = JSON.parse(await getBlockTemplate()).result;
  const rskwork = await prepareRskWork(poolContext, expectNewWork);
  const block = mineValidBlock(gbt, rskwork);
  return block;
}

function validateMergeMinedBlockResponse(response) {
  expect(response).to.have.property('id');
  expect(response).to.have.property('result');
  expect(response.result).to.have.property('blockImportedResult');
  expect(response.result).to.have.property('blockHash');
  expect(response.result).to.have.property('blockIncludedHeight');
}

function validateMergeMinedErrorResponse(response) {
  expect(response).to.have.property('id');
  expect(response).to.have.property('error');
  expect(response.error).to.have.property('message');
  expect(response.error).to.have.property('code');
}

async function getCPVByte(poolContext, height) {
  let response = JSON.parse(await rskdPromiseRequest("eth_getBlockByNumber", ["0x" + height, true], poolContext));
  let btcHash = getHashFromBitcoinBlockHeader(response.result.bitcoinMergedMiningHeader.substring(2));
  let lastByte = btcHash.substring(btcHash.length - 2);
  return lastByte;
}

async function getCPV(poolContext, height) {
  let cpvArray = [];
  const bestBlockHeight = height - 1;
  for (let i = 0; i < CPV_JUMP_FACTOR; i++) {
    let byteHeight = Math.floor(bestBlockHeight / CPV_JUMP) * CPV_JUMP - i * CPV_JUMP;
    cpvArray.push(await getCPVByte(poolContext, byteHeight.toString(16)));
  }
  return cpvArray.join("");
}

async function mineBlockResponse(poolContext) {
  const method = "submitBitcoinBlock";
  const block = await buildAndMergeMineBlock(poolContext);
  const params = submitMethodCases[method].extractSubmitParameters(block);
  const hasUncle = 1===Math.floor(100000*Math.random())%2;
  if(hasUncle){
    const block2 = await buildAndMergeMineBlock(poolContext);
    const params2 = submitMethodCases[method].extractSubmitParameters(block2);
    await rskJsonRpcRequestMiningModule(method, params2, poolContext);  
  }
  const response = JSON.parse(await rskJsonRpcRequestMiningModule(method, params, poolContext));
  validateMergeMinedBlockResponse(response);
  return response.result;
}

async function getUncleCount(poolContext, blockHeight, numberOfBlocks) {
  let unclesCount = 0;
  if (numberOfBlocks < blockHeight) {
    for (i = 0; i<numberOfBlocks; i++) {
      rskBlockByNumberResponse = JSON.parse(await getRskBlockByNumber("0x" + (blockHeight - 1 - i).toString(16), poolContext));
      unclesCount += rskBlockByNumberResponse.result.uncles.length;
    }
  }
  if (unclesCount > 255) {
    unclesCount = 255;
  }
  return unclesCount;
}


const RSK_RESULT_CODES = {
  IMPORTED_BEST: "0x494d504f525445445f42455354",
  IMPORTED_NOT_BEST: "0x494d504f525445445f4e4f545f42455354",
  EXIST: "0x4558495354",
  NO_PARENT: "0x4e4f5f504152454e54",
  INVALID_BLOCK: "0x494e56414c49445f424c4f434b"
}

module.exports = {
  getBlockTemplate,
  getRskWork,
  rskJsonRpcRequestMiningModule,
  RSK_RESULT_CODES,
  mineValidBlock,
  buildAndMergeMineBlock,
  validateMergeMinedBlockResponse,
  validateMergeMinedErrorResponse,
  getRskBlockByHash,
  getRskBlockByNumber,
  rskdPromiseRequest,
  getHashFromBitcoinBlockHeader,
  getCPV,
  bitcoindPromiseRequest,
  addLeadingZeros,
  mineBlockResponse,
  getUncleCount
}