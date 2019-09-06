const config = require('../config.json');

const host = config.rskd.url + ":" + config.rskd.rpcport;

const poolContexts = {
  ckpool: {
    headers: [
      "Content-Type: application/json",
      `Host: ${host}`,
      "Accept: */*"
    ],
    httpversion: "1.1"
  },
  btcpool: {
    headers: [
      "Content-Type: application/json",
      `Host: ${host}`,
      "User-Agent: curl",
      "Accept: */*"
    ],
    httpversion: "1.0"
  },
  eloipool: {
    headers: [
      "Content-type: application/json",
      `Host: ${host}`,
      "Accept-Encoding: identity",
      "User-Agent: AuthServiceProxy/0.1"
    ],
    httpversion: "1.1"
  }
}
 
module.exports = {
  poolContexts
}