const expect = require('chai').expect;
const axios = require('axios');
const http = require('http');
const helper = require('../helper');
const config = require('../config');

describe('Testing getWork for ckpool', () => {
  const postBody = {
    jsonrpc: "2.0",
    method: "mnr_getWork",
    params: [],
    id: 1
  };

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(postBody).length,
    'Authorization': 'Basic Og==',
    'Host': 'localhost:4444',
    'Accept': '*/*'
  };

  const axiosOptions = {
    method: 'post',
    url: config.rskd.url,
    headers: headers,
    data: postBody,
    httpAgent: new http.Agent({ keepAlive: true }),
  };

  it('response looks ok', async function() {
    try {
      const response = await axios(axiosOptions);

      const obj = response.data;

      expect(response.status).to.equal(200);
      expect(response.headers.version).to.equal('HTTP/1.1');
      expect(obj).to.have.property('result');
      expect(obj.result).to.have.property('blockHashForMergedMining');
      expect(helper.isHex(obj.result.blockHashForMergedMining)).to.be.true;
      expect(obj.result).to.have.property('target');
      expect(helper.isHex(obj.result.target)).to.be.true;
      expect(obj.result).to.have.property('feesPaidToMiner');
      expect(obj.result).to.have.property('notify');
      expect(typeof obj.result.notify).to.equal('boolean');
      expect(obj.result).to.have.property('parentBlockHash');
      expect(helper.isHex(obj.result.parentBlockHash)).to.be.true;
    } catch (error) {
      throw new Error(error);
    }
  });
});