init:
	which foundryup || (echo "foundryup not found, installing..." && curl -L https://foundry.paradigm.xyz | bash)
start: init
	foundryup

compile: init
	forge init erc20-demo
	cp ./MyToken.sol erc20-demo/src/
	cd erc20-demo && forge install OpenZeppelin/openzeppelin-contracts && forge build
	mkdir -p ../src/contracts/erc20
	cp MyToken.sol ../src/contracts/erc20/MyToken.sol
	cp erc20-demo/out/MyToken.sol/MyToken.json ../src/contracts/erc20/MyToken.json
	mv erc20-demo/lib/openzeppelin-contracts  ../src/contracts/openzeppelin-contracts
	rm -rf erc20-demo

