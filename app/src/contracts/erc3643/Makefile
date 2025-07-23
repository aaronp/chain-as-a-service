# Makefile to copy ERC-3643 ABIs from poc/T-REX to this directory

TREX_DIR=../../../../poc/T-REX
SRC_DIR=$(TREX_DIR)/artifacts/contracts
DST_DIR=./

ABIS=\
	$(SRC_DIR)/token/Token.sol/Token.json \
	$(SRC_DIR)/token/IToken.sol/IToken.json \
	$(SRC_DIR)/compliance/modular/ModularCompliance.sol/ModularCompliance.json \
	$(SRC_DIR)/compliance/modular/IModularCompliance.sol/IModularCompliance.json \
	$(SRC_DIR)/registry/implementation/IdentityRegistry.sol/IdentityRegistry.json \
	$(SRC_DIR)/registry/implementation/ClaimTopicsRegistry.sol/ClaimTopicsRegistry.json \
	$(SRC_DIR)/registry/implementation/IdentityRegistryStorage.sol/IdentityRegistryStorage.json \
	$(SRC_DIR)/registry/implementation/TrustedIssuersRegistry.sol/TrustedIssuersRegistry.json

install:
	@if [ ! -d "$(SRC_DIR)" ]; then \
	  echo "Cloning T-REX repo..."; \
	  mkdir -p $(TREX_DIR); \
	  git clone https://github.com/TokenySolutions/T-REX.git $(TREX_DIR); \
	else \
	  echo "T-REX source already exists at $(SRC_DIR)"; \
	fi

copy-abis:
	@echo "Copying ERC-3643 ABIs to $(DST_DIR)"
	cp $(ABIS) $(DST_DIR)

.PHONY: copy-abis install 