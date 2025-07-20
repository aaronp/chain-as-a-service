install:
	which foundryup || (echo "foundryup not found, installing..." && curl -L https://foundry.paradigm.xyz | bash)
init: install
	foundryup

compile: init
	forge init erc20-demo
	cp ./MyToken.sol erc20-demo/src/
	cd erc20-demo && forge install OpenZeppelin/openzeppelin-contracts && forge build
	# mkdir -p ../src/contracts/erc20
	# cp MyToken.sol ../src/contracts/erc20/MyToken.sol
	# cp erc20-demo/out/MyToken.sol/MyToken.json ../src/contracts/erc20/MyToken.json
	# mv erc20-demo/lib/openzeppelin-contracts  ../src/contracts/openzeppelin-contracts
	# rm -rf erc20-demo

compile-atomic-swap: init
	forge init atomic-swap
	cp ./AtomicSwap.sol atomic-swap/src/
	cd atomic-swap && forge install OpenZeppelin/openzeppelin-contracts && forge build

deploy-atomic-swap: compile-atomic-swap
	cd atomic-swap && forge create AtomicSwap --rpc-url $RPC_URL --private-key $PRIVATE_KEY --constructor-args $PARTY_B_ADDRESS $TOKEN_A_ADDRESS $AMOUNT_A $TOKEN_B_ADDRESS $AMOUNT_B --verify --etherscan-api-key $ETHERSCAN_API_KEY