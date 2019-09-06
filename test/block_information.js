const expect = require('chai').expect;
const utils = require('../lib/mining-utils.js');
const amountOfBlocksToMine = 450;
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

            it('should get information of hashForMergedMining key CPV is correctly calculated if armadillo enabled', async () => {
                let CPVcalculated = await utils.getCPV(context, rskBlockResponseHeight451By[byMethods[byMethod]].result.number);
                let CPVfromResponse = rskBlockResponseHeight451By[byMethods[byMethod]].result.hashForMergedMining.substring(42, 56);
                expect(CPVfromResponse).to.equal(CPVcalculated);
            });

            it('should get information of hashForMergedMining key uncleCount byte is  correctly calculated if armadillo enabled', async () => {
                const uncleCountCalculated = await utils.getUncleCount(context, amountOfBlocksToMine + 1, numberOfUncles);
                let uncleCountFromResponse = parseInt(rskBlockResponseHeight451By[byMethods[byMethod]].result.hashForMergedMining.substring(56, 58), 16);
                expect(uncleCountFromResponse).to.equal(uncleCountCalculated);
            });
        });
    }
});
