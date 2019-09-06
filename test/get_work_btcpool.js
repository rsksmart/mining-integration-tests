
const Curl = require( 'node-libcurl' ).Curl;
const expect = require('chai').expect;
const helper = require('../helper');
const config = require('../config');

describe('Testing getWork for btckpool', () => {

  const postBody = JSON.stringify({ jsonrpc: "2.0", method: "mnr_getWork", params: [], id:1 });

  const curl = new Curl();

  const headers = [
    "Content-Type: application/json",
    `Content-Length: ${postBody.length}`,
    "Authorization: Basic dXNlcjpwYXNz",
    "Host: localhost:4444",
    "User-Agent: curl",
    "Accept: */*"
  ];
  
   curl.setOpt(Curl.option.URL, config.rskd.url);
   //  enabling this you can see more information about the headers used
   //  curl.setOpt( Curl.option.VERBOSE, 1 ); 
   curl.setOpt( Curl.option.PORT, config.rskd.rpcport ); 
   curl.setOpt( Curl.option.POST, 1 );
   curl.setOpt( Curl.option.POSTFIELDS, postBody );
   curl.setOpt( Curl.option.HTTPHEADER, [headers.join('; ')]);
   // Btcpool is using  HTTP/1.0,  to change the default one (HTTP/1.1) to HTTP/1.0 we need to set this:
   curl.setOpt( Curl.option.HTTP_VERSION, 1 );  

   it('response looks ok', function(done) {
      curl.on( 'end', function( statusCode, body, responseHeaders ) {
         
        const obj = JSON.parse(body);

        expect(statusCode).to.be.equal(200);
        expect(responseHeaders).to.have.lengthOf(1);
        expect(responseHeaders[0]).to.not.be.null;
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