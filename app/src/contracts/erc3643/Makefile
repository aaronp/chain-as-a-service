TREX_DIR=../../../../poc/T-REX
SRC_DIR=$(TREX_DIR)/artifacts/contracts
DST_DIR=./

install:
	@if [ ! -d "$(SRC_DIR)" ]; then \
	  echo "Cloning T-REX repo..."; \
	  mkdir -p $(TREX_DIR); \
	  git clone https://github.com/TokenySolutions/T-REX.git $(TREX_DIR); \
	  cd $(TREX_DIR); \
	  bun i; \
	  bunx hardhat compile; \
	  bunx hardhat test; \
	else \
	  echo "T-REX source already exists at $(SRC_DIR)"; \
	fi

copy-abis:
	@echo "Copying ERC-3643 ABIs to $(DST_DIR)"
	cp -r $(SRC_DIR) $(DST_DIR)

.PHONY: copy-abis install 