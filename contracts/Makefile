init:
	which foundryup || (echo "foundryup not found, installing..." && curl -L https://foundry.paradigm.xyz | bash)
start: init
	foundryup

compile:
	forge init erc20-demo
	cp ./MyToken.sol erc20-demo/src/
	cd erc20-demo && forge install OpenZeppelin/openzeppelin-contracts && forge build

build:
	foundryup
	foundry build

deploy: build
	foundryup
	foundry deploy --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
