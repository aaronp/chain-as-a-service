This project contains examples for key pieces of blockchain infrastructure, such as:

 * Running an EVM chain as a service
 * Demonstrating atomic swaps (DVD) of tokens 
 * Deploying Securities (ERC-3643) contracts
 * [vLEI / KERI](https://aaronp.github.io/chain-as-a-service/vlei/about.html) for verified identities

# Chain as a service

This is available under '/app', can can be run using `make dev`.

The off-chain REST services are served under `/api` used by the UI.

The project is fully self-sufficient, but using web3 technologies (so you can swap out this 'chain as a service' for any EVM compatible chain)


# Versions

## 0.0.1

Basic UI, untested (it worked once) containerisation. Everything's in-memory

The ERC-20 flow works:
 * create e.g. USD and GBP tokens
 * deploy an atomic swap contract
 * use the atomic swap contract in a workflow which notifies a recipient to approve

The ERC-3643 tests are passing - we can create the t-rex suite and mint tokens:
`make test`

Next:
 * register trex contracts (don't keep redeploying, but use existing registered ones)
 * build out DSL to use in tests for high-level actions of the actors
 * 0.0.2 will have e2e tests for minting ERC-3643s (and maybe transferring if it's easy)

## 0.0.2

Added vLEI / KERI PoC
(see [here](https://aaronp.github.io/chain-as-a-service/vlei/about.html))