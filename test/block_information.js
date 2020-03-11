const expect = require('chai').expect;
const utils = require('../lib/mining-utils.js');
const amountOfBlocksToMine = 450;
const extraBlocksToMineForPapyrus = 9;
const numberOfUncles = 32;
const byMethods = { "Number": 0, "Hash": 1 };
const config = require('../config.json');
const host = config.rskd.url + ":" + config.rskd.rpcport;

const context = {
    headers: [
        "Content-Type: application/json",
        `Host: ${host}`,
        "Accept: */*"
    ],
    httpversion: "1.1"
};

describe('Tests for mining block information', () => {
    let rskBlockResponseHeight001By = [0, 1];
    let rskBlockResponseHeight451By = [0, 1];
    let rskBlockResponseHeight460By = [0, 1];
    let rskResponse;
    before(async function () {
        this.timeout(120000);
        await utils.bitcoindPromiseRequest("generate", [], context);
        await utils.rskdPromiseRequest("evm_reset", [], context);
        let responseBlockMined = await utils.mineBlockResponse(context);
        rskBlockResponseHeight001By[byMethods.Number] = JSON.parse(await utils.getRskBlockByNumber(responseBlockMined.blockIncludedHeight, context));
        rskBlockResponseHeight001By[byMethods.Hash] = JSON.parse(await utils.getRskBlockByHash(responseBlockMined.blockHash, context));

        for (let i = 0; i < amountOfBlocksToMine; i++) {
            responseBlockMined = await utils.mineBlockResponse(context);
        }
        rskBlockResponseHeight451By[byMethods.Number] = JSON.parse(await utils.getRskBlockByNumber(responseBlockMined.blockIncludedHeight, context));
        rskBlockResponseHeight451By[byMethods.Hash] = JSON.parse(await utils.getRskBlockByHash(responseBlockMined.blockHash, context));
        for (let i = 0; i < extraBlocksToMineForPapyrus; i++) {
            responseBlockMined = await utils.mineBlockResponse(context);
        }

        rskBlockResponseHeight460By[byMethods.Number] = JSON.parse(await utils.getRskBlockByNumber(responseBlockMined.blockIncludedHeight, context));
        rskBlockResponseHeight460By[byMethods.Hash] = JSON.parse(await utils.getRskBlockByHash(responseBlockMined.blockHash, context));
    });
    for (let byMethod in byMethods) {
        describe(`Tests for block information by ${byMethod}`, () => {
            it('should get information of hashForMergedMining key height is last 4 bytes if armadillo enabled', async () => {
                let hashForMergedMining = rskBlockResponseHeight001By[byMethods[byMethod]].result.hashForMergedMining;
                let blockHeight = rskBlockResponseHeight001By[byMethods[byMethod]].result.number;
                blockHeight = blockHeight.split("x")[1];
                blockHeight = utils.addLeadingZeros(8, blockHeight);
                let hashHeightPart = hashForMergedMining.substr(hashForMergedMining.length - 8);
                expect(hashHeightPart).to.not.equal(blockHeight);

                let hashForMergedMiningH451 = rskBlockResponseHeight451By[byMethods[byMethod]].result.hashForMergedMining;
                let blockHeight451 = rskBlockResponseHeight451By[byMethods[byMethod]].result.number;
                blockHeight451 = blockHeight451.substr(2);
                blockHeight451 = utils.addLeadingZeros(8, blockHeight451);
                expect(hashForMergedMiningH451).to.be.a('string').that.is.not.empty.and.not.equal("0x00");
                hashHeightPart = hashForMergedMiningH451.substr(hashForMergedMiningH451.length - 8);
                expect(hashHeightPart).to.equal(blockHeight451);
            });

            it('should get information of hashForMergedMining key height is last 4 bytes if armadillo enabled and papyrus activated', async () => {
                let hashForMergedMiningH460 = rskBlockResponseHeight460By[byMethods[byMethod]].result.hashForMergedMining;
                let blockHeight460 = rskBlockResponseHeight460By[byMethods[byMethod]].result.number;
                blockHeight460 = blockHeight460.substr(2);
                blockHeight460 = utils.addLeadingZeros(8, blockHeight460);
                expect(hashForMergedMiningH460).to.be.a('string').that.is.not.empty.and.not.equal("0x00");
                let hashHeightPart = hashForMergedMiningH460.substr(hashForMergedMiningH460.length - 8);
                expect(hashHeightPart).to.equal(blockHeight460);
            });

            it('should get information of hashForMergedMining key CPV is correctly calculated if armadillo enabled', async () => {
                let CPVcalculated = await utils.getCPV(context, rskBlockResponseHeight451By[byMethods[byMethod]].result.number);
                let CPVfromResponse = rskBlockResponseHeight451By[byMethods[byMethod]].result.hashForMergedMining.substring(42, 56);
                expect(CPVfromResponse).to.equal(CPVcalculated);
            });

            it('should get information of hashForMergedMining key CPV is correctly calculated if armadillo enabled and papyrus activated', async () => {
                let CPVcalculated = await utils.getCPV(context, rskBlockResponseHeight460By[byMethods[byMethod]].result.number);
                let CPVfromResponse = rskBlockResponseHeight460By[byMethods[byMethod]].result.hashForMergedMining.substring(42, 56);
                expect(CPVfromResponse).to.equal(CPVcalculated);
            });

            it('should get information of hashForMergedMining key uncleCount byte is correctly calculated if armadillo enabled', async () => {
                const uncleCountCalculated = await utils.getUncleCount(context, amountOfBlocksToMine + 1, numberOfUncles);
                let uncleCountFromResponse = parseInt(rskBlockResponseHeight451By[byMethods[byMethod]].result.hashForMergedMining.substring(56, 58), 16);
                expect(uncleCountFromResponse).to.equal(uncleCountCalculated);
            });

            it('should get information of hashForMergedMining key uncleCount byte is correctly calculated if armadillo enabled and papyrus activated', async () => {
                const uncleCountCalculated = await utils.getUncleCount(context, amountOfBlocksToMine + extraBlocksToMineForPapyrus + 1, numberOfUncles);
                let uncleCountFromResponse = parseInt(rskBlockResponseHeight460By[byMethods[byMethod]].result.hashForMergedMining.substring(56, 58), 16);
                expect(uncleCountFromResponse).to.equal(uncleCountCalculated);
            });
        });
    }
});

describe('Tests for cumulative difficulty', () => {
    let rskBlockResponse = [0, 1];
    let rskResponse;
    before(async function () {
        this.timeout(120000);
        await utils.bitcoindPromiseRequest("generate", [], context);
        await utils.rskdPromiseRequest("evm_reset", [], context);
        let responseBlockMined = await utils.mineBlockResponse(context,0);
    });
    for (let byMethod in byMethods) {
        describe(`Tests for block information by ${byMethod}`, () => {
            it('should get information on cummulative difficulty equals to block difficulty if no uncles', async () => {
                responseBlockMined = await utils.mineBlockResponse(context, 0);
                responseBlockMined = await utils.mineBlockResponse(context, 0);
                responseBlockMined = await utils.mineBlockResponse(context, 0);
                rskBlockResponse[byMethods.Number] = JSON.parse(await utils.getRskBlockByNumber(responseBlockMined.blockIncludedHeight, context));
                rskBlockResponse[byMethods.Hash] = JSON.parse(await utils.getRskBlockByHash(responseBlockMined.blockHash, context));
                let blockInfo = rskBlockResponse[byMethods[byMethod]];
                expect(blockInfo).has.property("result");
                expect(blockInfo.result).has.property("uncles");
                expect(blockInfo.result).has.property("cumulativeDifficulty");
                let cumulativeDifficulty = blockInfo.result.uncles.length + parseInt(blockInfo.result.difficulty);
                cumulativeDifficulty = "0x" + cumulativeDifficulty.toString(16);
                expect(blockInfo.result.uncles.length).to.be.equal(0);
                console.log(`uncle length ${blockInfo.result.uncles.length}`);
                expect(blockInfo.result.cumulativeDifficulty).to.be.equal(cumulativeDifficulty);
            });
            it('should get information on cummulative difficulty equals to block difficulty plus n uncles difficulties', async () => {
                responseBlockMined = await utils.mineBlockResponse(context, 5);
                responseBlockMined = await utils.mineBlockResponse(context, 1);
                responseBlockMined = await utils.mineBlockResponse(context, 1);
                rskBlockResponse[byMethods.Number] = JSON.parse(await utils.getRskBlockByNumber(responseBlockMined.blockIncludedHeight, context));
                rskBlockResponse[byMethods.Hash] = JSON.parse(await utils.getRskBlockByHash(responseBlockMined.blockHash, context));
                let blockInfo = rskBlockResponse[byMethods[byMethod]];
                expect(blockInfo).has.property("result");
                expect(blockInfo.result).has.property("uncles");
                expect(blockInfo.result).has.property("cumulativeDifficulty");
                let cumulativeDifficulty = blockInfo.result.uncles.length + parseInt(blockInfo.result.difficulty);
                cumulativeDifficulty = "0x" + cumulativeDifficulty.toString(16);
                expect(blockInfo.result.uncles.length).to.be.greaterThan(0);
                console.log(`uncle length ${blockInfo.result.uncles.length}`);
                expect(blockInfo.result.cumulativeDifficulty).to.be.equal(cumulativeDifficulty);
            });
        });

    }
});
