#!/bin/sh
curl -H "Content-type: text/plain" -u "admin:admin" \
    -d '{"jsonrpc": "2.0", "method": "generate", "params": [101]}' \
    http://bitcoind01:32591/
