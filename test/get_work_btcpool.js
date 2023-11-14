
const axios = require('axios');
const expect = require('chai').expect;
const http = require('http');
const helper = require('../helper');
const config = require('../config');


describe('Testing getWork for btckpool', () => {
  const postBody = {
    jsonrpc: "2.0",
    method: "mnr_getWork",
    params: [],
    id: 1
  };

  const headers = [
    "Content-Type: application/json",
    `Content-Length: ${postBody.length}`,
    "Authorization: Basic dXNlcjpwYXNz",
    "Host: localhost:4444",
    "User-Agent: curl",
    "Accept: */*"
  ];

  const axiosOptions = {
    method: 'post',
    url: config.rskd.url,
    port: config.rskd.rpcport,
    headers: headers,
    data: postBody,
    auth: {
      username: 'admin',
      password: 'admin'
    },
    httpAgent: new http.Agent({ keepAlive: true }),
  };

  it('response looks ok', async function() {
    try {
      const response = await axios(axiosOptions);

      const obj = response.data;
      // console.log(JSON.stringify(response.data, null, 2))
      expect(response.status).to.equal(200);
      expect(response.headers).to.have.property('version', 'HTTP/1.1');
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