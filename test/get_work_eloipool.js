const expect = require('chai').expect;
const Curl = require( 'node-libcurl' ).Curl;
const helper = require('../helper');
const config = require('../config');

describe('Testing getWork for eloipool', () => {
 
  const postBody = JSON.stringify({ jsonrpc: "2.0", method: "mnr_getWork", params: [], id:1 });

  const curl = new Curl();

  const headers = [
    "Content-Type: application/json",
    `Content-Length: ${postBody.length}`,
    "Host: localhost:4444",
    "Authorization: Basic Og==",
    "Accept-Encoding: identity",
    "User-Agent: AuthServiceProxy/0.1"
  ];

  curl.setOpt(Curl.option.URL, config.rskd.url);
  //  enabling this you can see more information about the headers used
  //  curl.setOpt( Curl.option.VERBOSE, 1 ); 
  curl.setOpt( Curl.option.PORT, config.rskd.rpcport ); 
  curl.setOpt( Curl.option.POST, 1 );
  curl.setOpt( Curl.option.POSTFIELDS, postBody );
  curl.setOpt( Curl.option.HTTPHEADER, [headers.join('; ')]);

  it('response looks ok', function(done) {
    curl.on( 'end', function( statusCode, body, responseHeaders ) {
        
      const obj = JSON.parse(body);
      expect(statusCode).to.be.equal(200);
      expect(responseHeaders).to.have.lengthOf(1);
      expect(responseHeaders[0]).to.not.be.null;
      expect(responseHeaders[0].result).to.not.be.null;
      expect(responseHeaders[0].result.version).to.equal('HTTP/1.1');
      expect(obj).to.have.property('result');
      expect(obj.result).to.have.property('blockHashForMergedMining');
      expect(helper.isHex(obj.result.blockHashForMergedMining)).ok;
      expect(obj.result).to.have.property('target');
      expect(helper.isHex(obj.result.target)).ok;
      expect(obj.result).to.have.property('feesPaidToMiner');
      expect(obj.result).to.have.property('notify');
      expect(typeof obj.result.notify).to.be.equal('boolean');
      expect(obj.result).to.have.property('parentBlockHash');
      expect(helper.isHex(obj.result.parentBlockHash)).ok;

      done();
    });
  
    curl.on('error', function(e) { 
      throw new Error(e); 
    });

    curl.perform();
  });
});