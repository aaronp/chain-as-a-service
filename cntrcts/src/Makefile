compileAtomicSwap:
	forge build --contracts src/AtomicSwap.sol --out ../../app/contracts

compileToken:
	forge build --contracts src/Token.sol --out ../../app/contracts

compile: compileAtomicSwap compileToken

clean:
	rm -rf out/
	rm -rf cache/
	rm -rf ../../app/contracts
