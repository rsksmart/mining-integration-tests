const utils = require('./lib/mining-utils.js');

(async function main(){

    await utils.bitcoinGenerateBlocks (101);
})(); 