const expect = require('chai').expect;
const utils = require('../lib/mining-utils.js');
const submitMethodCases = require('../lib/submit-method-cases.js').submitMethodCases;
const poolContexts = require('../lib/pool-contexts.js').poolContexts;

for (const poolContext in poolContexts) {
  for (const method in submitMethodCases) {
    describe('Tests for ' + method + ' with headers used by ' + poolContext, () => {
      
      it('should receive an error response when sending an invalid block', async () => {
        const block = await utils.buildAndMergeMineBlock(poolContexts[poolContext], true);
        const invalidParams = submitMethodCases[method].extractInvalidSubmitParameters(block);
        
        const response = JSON.parse(await utils.rskJsonRpcRequestMiningModule(method, invalidParams, poolContexts[poolContext]))
    
        utils.validateMergeMinedErrorResponse(response);
      })
    
      it('should submit and receive IMPORTED_BEST as a result', async () => {
        const block = await utils.buildAndMergeMineBlock(poolContexts[poolContext]);
        const params = submitMethodCases[method].extractSubmitParameters(block);

        const response = JSON.parse(await utils.rskJsonRpcRequestMiningModule(method, params, poolContexts[poolContext]));
        utils.validateMergeMinedBlockResponse(response);

        expect(response.result.blockImportedResult).to.equal(utils.RSK_RESULT_CODES.IMPORTED_BEST);
      });

      it('should submit and receive IMPORTED_NOT_BEST as a result', async () => {
        // We'll try to emulate this situation
        // Tip-> A -> C
        //   `-> B
        // By submitting A and C we should get IMPORTED_BEST for each
        // When submitting B, we should get IMPORTED_NOT_BEST since C is ahead in the chain

        const blockA = await utils.buildAndMergeMineBlock(poolContexts[poolContext], true);
        const paramsA = submitMethodCases[method].extractSubmitParameters(blockA);

        const blockB = await utils.buildAndMergeMineBlock(poolContexts[poolContext]);
        const paramsB = submitMethodCases[method].extractSubmitParameters(blockB);

        const responseBlockA = JSON.parse(await utils.rskJsonRpcRequestMiningModule(method, paramsA, poolContexts[poolContext]));
        utils.validateMergeMinedBlockResponse(responseBlockA);
        expect(responseBlockA.result.blockImportedResult).to.equal(utils.RSK_RESULT_CODES.IMPORTED_BEST);

        const blockC = await  utils.buildAndMergeMineBlock(poolContexts[poolContext], true);
        const paramsC = submitMethodCases[method].extractSubmitParameters(blockC);

        const responseBlockC = JSON.parse(await utils.rskJsonRpcRequestMiningModule(method, paramsC, poolContexts[poolContext]));
        utils.validateMergeMinedBlockResponse(responseBlockC);
        expect(responseBlockC.result.blockImportedResult).to.equal(utils.RSK_RESULT_CODES.IMPORTED_BEST);

        const responseBlockB = JSON.parse(await utils.rskJsonRpcRequestMiningModule(method, paramsB, poolContexts[poolContext]));
        utils.validateMergeMinedBlockResponse(responseBlockB);
        expect(responseBlockB.result.blockImportedResult).to.equal(utils.RSK_RESULT_CODES.IMPORTED_NOT_BEST);
      });

      it('should submit two times and receive EXIST as a result', async () => {
        const block = await  utils.buildAndMergeMineBlock(poolContexts[poolContext], true);
        const params = submitMethodCases[method].extractSubmitParameters(block);

        const firstResponse = JSON.parse(await  utils.rskJsonRpcRequestMiningModule(method, params, poolContexts[poolContext]));
        utils.validateMergeMinedBlockResponse(firstResponse);
        expect(firstResponse.result.blockImportedResult).to.equal( utils.RSK_RESULT_CODES.IMPORTED_BEST);
        
        const secondResponse = JSON.parse(await  utils.rskJsonRpcRequestMiningModule(method, params, poolContexts[poolContext]));
        utils.validateMergeMinedBlockResponse(secondResponse);
        expect(secondResponse.result.blockImportedResult).to.equal(utils.RSK_RESULT_CODES.EXIST);
      })
    });
  }
}