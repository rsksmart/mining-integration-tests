#!/bin/bash

curl --data-binary '{"json_rpc": "2.0", "id": "1", "method": "generate", "params": [500]}' http://admin:admin@localhost:32591