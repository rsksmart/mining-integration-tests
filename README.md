# Mining integration tests

### Prerequisites

1. bitcoind
2. rsk node
3. `node` and `npm`

### Running the tests

1. Verify the rsk node config has "server" enabled and "client" disabled. Both settings are present under the "miner" section
```
miner {
    server.enabled = true
    client.enabled = false
    minGasPrice = 0
}
```
2. Run bitcoind and the rsk node
3. Modify `config.json` to match the corresponding url, port and credentials for the bitcoind and rsk node instances
4. Run `btc-generate-blocks.sh` to generate blocks for the bitcoind instance (check the script if you need to change the node's credentials or url)
5. Run `npm install`
6. Run `npm test`


test
