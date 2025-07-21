# Chain As-A-Service

This project demonstrates creating EVM "chain as a service".

The off-chain REST services are served under `/api` used by the UI.

The project is fully self-sufficient, but using web3 technologies (so you can swap out this 'chain as a service' for any EVM compatible chain)


## DvD swaps

There is an AtomicSwap contract used for DvD deliver of ERC20 tokens. The flow is:


User One:
1. call 'Approve' on your ERC20 tokent to allow the AtomicSwap to transfer tokens
2. send an off-chain message to the counterparty, notifying them of the swap (e.g., signalling 'I want to trade X of token A for Y of your token B')

User Two:
1. read the unread swap message
2. call 'Approve' on their ERC20 token for the AtomicSwap contract
3. Invoke the 'swap' operation (could be done be either user)

4. (housekeeping) markt their message as read, send an optional notification that the swap was made.
