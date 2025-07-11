# Chain As-A-Service

This project runs an EVM on-demand with some input state plus message (e.g. transaction) to execute.

The actions include:


# Start

Starts the EVM in docker with some given volume mounts.

Records the privileged private keys to `./state/deployment.json`


# Operations


## Deploy

### Issue:
There is an issue where anvil only ever listens on 127.0.0.1, so can't accept REST requests from outside the docker container. 
Bummer.


### Work-Around:

Break-out deploy into:

1. deploy : gathers and writes the inputs (token, input params, etc) to ./scripts/deploy_config.json
2. deployExec : executes ./scripts/deploy.sh from within the docker container, which has mounted ☝️


## Transaction
