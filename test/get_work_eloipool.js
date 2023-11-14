const expect = require('chai').expect;
const axios = require('axios');
const http = require('http');
const helper = require('../helper');
const config = require('../config');

describe.only('Testing getWork for eloipool', () => {
  const postBody = {
    jsonrpc: "2.0",
    method: "mnr_getWork",
    params: [],
    id: 1
  };

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(postBody).length,
    'Host': 'localhost:4444',
    'Authorization': 'Basic Og==',
    'Accept-Encoding': 'identity',
    'User-Agent': 'AuthServiceProxy/0.1'
  };

  const axiosOptions = {
    method: 'POST',
    url: config.rskd.url,
    port: config.rskd.rpcport,
    headers: headers,
    data: postBody,
    // auth: {
    //   username: '',
    //   password: ''
    // },
    // httpAgent: new http.Agent({ keepAlive: true }),
  };

  it('response looks ok', async function() {
    try {
      let n = 1;
      console.log (n++);
      console.log(axiosOptions)
      const response = await axios(axiosOptions);
      console.log (n++);
      console.log (response)
      const obj = response.data;

      console.log (n++);
      expect(response.status).to.equal(200);
      expect(response.headers.version).to.equal('HTTP/1.1');
      expect(obj).to.have.property('result');
      expect(obj.result).to.have.property('blockHashForMergedMining');
      console.log (n++);
      expect(helper.isHex(obj.result.blockHashForMergedMining)).to.be.true;
      expect(obj.result).to.have.property('target');
      expect(helper.isHex(obj.result.target)).to.be.true;
      expect(obj.result).to.have.property('feesPaidToMiner');
      console.log (n++);
      expect(obj.result).to.have.property('notify');
      expect(typeof obj.result.notify).to.equal('boolean');
      expect(obj.result).to.have.property('parentBlockHash');
      console.log (n++);
      expect(helper.isHex(obj.result.parentBlockHash)).to.be.true;
    } catch (error) {
      throw new Error(error);
    }
  });
});