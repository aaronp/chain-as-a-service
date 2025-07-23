import { ethers } from 'ethers';
import Token from "@/contracts/Token.sol/Token.json";
import AtomicSwap from "@/contracts/AtomicSwap.sol/AtomicSwap.json";
import { client } from '@/api/client';
import { PrivateAccount as Account } from '../../ui/wallet/accounts';
import { StoredContract } from '@/api/contracts';
import { ErrorResponse } from '@/api/error';

// const erc20dir = path.resolve(process.cwd(), "contracts/erc20");
// const abiPath = path.resolve(erc20dir, "out/MyToken.sol/MyToken.json"); // TODO: make this dynamic

// Anvil's default pre-funded accounts
const ANVIL_ACCOUNTS = [
    {
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    },
    {
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    },
    {
        address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
    }
];

export const getAnvilAccount = (index: number = 0): Account => {
    if (index >= ANVIL_ACCOUNTS.length) {
        throw new Error(`Anvil account index ${index} out of range`);
    }
    const account = ANVIL_ACCOUNTS[index];
    return {
        name: `Anvil Account ${index + 1}`,
        address: account.address,
        privateKey: account.privateKey
    };
};

const isAnvilAccount = (address: string): boolean => {
    return ANVIL_ACCOUNTS.some(anvilAccount => anvilAccount.address === address);
};

export const fundAccount = async (address: string, chainId: string, amount: string = "1000000000000000000") => {
    const provider = await providerForChain(chainId);

    // Use the first Anvil account as the funder
    const funder = new ethers.Wallet(ANVIL_ACCOUNTS[0].privateKey, provider);

    console.log(`Funding account ${address} with ${amount} wei from ${funder.address}`);

    const tx = await funder.sendTransaction({
        to: address,
        value: amount
    });

    console.log("Funding transaction hash:", tx.hash);
    await tx.wait();
    console.log("Account funded successfully");

    return tx.hash;
};

export const ensureETH = async (address: string, chainId: string, minEth: string = "0.1") => {
    const provider = await providerForChain(chainId);
    if (!isAnvilAccount(address)) {
        console.log("Checking ETH balance for account", address);
        const balance = await provider.getBalance(address);
        if (balance < ethers.parseEther(minEth)) {
            console.log(`${address} has insufficient ETH for gas, funding...`);
            await fundAccount(address, chainId);
        } else {
            console.log(`${address} has ${balance} ETH, ok for gas`);
        }
    } else {
        console.log("Skipping ETH check for Anvil account", address);
    }
};

export const erc20Template = () => ({ abi: Token.abi, bytecode: Token.bytecode.object })

export const atomicSwapTemplate = () => ({ abi: AtomicSwap.abi, bytecode: AtomicSwap.bytecode.object })

export const deployERC20 = async (
    account: Account,
    chainId: string,
    name: string,
    symbol: string,
    initialSupply: number): Promise<StoredContract | ErrorResponse> => {
    const provider = await providerForChain(chainId);

    await ensureETH(account.address, chainId);

    const signer = new ethers.Wallet(account.privateKey, provider);

    const template = erc20Template();
    const factory = new ethers.ContractFactory(template.abi, template.bytecode, signer);

    console.log("Deploying ERC20 contract...");
    const contract = await factory.deploy(name, symbol, initialSupply);

    console.log("Waiting for deployment...");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("Contract deployed at:", contractAddress);

    const registerResult = await client().registerContract({
        chainId,
        issuerAddress: account.address,
        contractAddress,
        contractType: "ERC20",
        name,
        symbol,
    })
    return registerResult;
}

export const deployAtomicSwap = async (
    account: Account,
    chainId: string
): Promise<StoredContract | ErrorResponse> => {
    const provider = await providerForChain(chainId);

    // Check if account has enough ETH, fund if needed (skip for Anvil accounts)
    await ensureETH(account.address, chainId);

    const signer = new ethers.Wallet(account.privateKey, provider);

    const template = atomicSwapTemplate();
    const factory = new ethers.ContractFactory(template.abi, template.bytecode, signer);

    console.log("Deploying AtomicSwap contract...");
    const contract = await factory.deploy();

    console.log("Waiting for deployment...");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("AtomicSwap contract deployed at:", contractAddress);

    const registerResult = await client().registerContract({
        chainId,
        issuerAddress: account.address,
        contractAddress,
        contractType: "AtomicSwap",
        name: "AtomicSwap",
        symbol: "",
    })
    return registerResult;
}

export type SwapParams = {
    address: string;
    amount: string;
}


export const erc20 = async (account: Account, chainId: string, ercContractAddress: string) => {
    const provider = await providerForChain(chainId);
    const wallet = new ethers.Wallet(account.privateKey, provider);
    const tokenContract = new ethers.Contract(ercContractAddress, erc20Template().abi, wallet);

    return {
        symbol: async () => await tokenContract.symbol(),
        name: async () => await tokenContract.name(),
        decimals: async () => await tokenContract.decimals(),
        balance: async (address: string = account.address) => await tokenContract.balanceOf(address),
        allowance: async (owner: string, spender: string) => await tokenContract.allowance(owner, spender),
        approve: async (spenderAddress: string, amount: string) => await tokenContract.approve(spenderAddress, amount),
        transfer: async (toAddress: string, amount: string) => await tokenContract.transfer(toAddress, amount),
        transferFrom: async (fromAddress: string, toAddress: string, amount: string) => await tokenContract.transferFrom(fromAddress, toAddress, amount),
    }
}


export const approveSwap = async (
    account: Account,
    chainId: string,
    swapContractAddress: string,
    token: SwapParams
) => {
    console.log(`Approving swap on contract ${swapContractAddress} for ${token.amount} of ${token.address} on account ${chainId}/${account.address}`);

    const provider = await providerForChain(chainId);
    const wallet = new ethers.Wallet(account.privateKey, provider);


    await ensureETH(account.address, chainId);

    // Check balances and approve tokens for the swap contract
    const tokenContract = new ethers.Contract(token.address, erc20Template().abi, wallet);

    console.log("Approving token", token.address, "for swap contract", swapContractAddress, "with amount", token.amount);
    const approveTokenATx = await tokenContract.approve(swapContractAddress, token.amount);
    console.log("Approval transaction hash:", approveTokenATx.hash);

    const allowed = await tokenContract.allowance(account.address, swapContractAddress);
    console.log(token.address, "has approved", swapContractAddress, "for amount", allowed, " which should be ", token.amount);
    const result = await approveTokenATx.wait();

    /**
     * {
    "_type": "TransactionReceipt",
    "blockHash": "0x132ecd9c401acb3c1e86041f70195ea89daa0973b9aa7318c5c99a04417b69fe",
    "blockNumber": 6,
    "contractAddress": null,
    "cumulativeGasUsed": "29768",
    "from": "0xc6767A0AbaCCEAcE9bFd03789393c17Cbf3bE305",
    "gasPrice": "1524700648",
    "blobGasUsed": null,
    "blobGasPrice": "1",
    "gasUsed": "29768",
    "hash": "0x6f044979f5e9dafe9416f6c2ec058ae0663701d04f0765364d2c15d29dd3af1c",
    "index": 0,
    "logs": [
        {
            "_type": "log",
            "address": "0x01fe7F11FA0A3cE331f1E737Fb3e720c6445d9C9",
            "blockHash": "0x132ecd9c401acb3c1e86041f70195ea89daa0973b9aa7318c5c99a04417b69fe",
            "blockNumber": 6,
            "data": "0x0000000000000000000000000000000000000000000000000000000000000003",
            "index": 0,
            "topics": [
                "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
                "0x000000000000000000000000c6767a0abacceace9bfd03789393c17cbf3be305",
                "0x00000000000000000000000058841230e03fa2fec006c95c14786e50833676bc"
            ],
            "transactionHash": "0x6f044979f5e9dafe9416f6c2ec058ae0663701d04f0765364d2c15d29dd3af1c",
            "transactionIndex": 0
        }
    ],
    "logsBloom": "0x00000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000080200000000000000080000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000008000020000000000000000000000000000004000000000000000000000000000000001000000000000000000000000000000000000000000001000000000000000000010000000000000000000000000000000000000000000000000000000000000",
    "status": 1,
    "to": "0x01fe7F11FA0A3cE331f1E737Fb3e720c6445d9C9"
}
     */
    console.log("Approval result:", result);
    return result.logs[0].transactionHash;
}

export const executeSwap = async (
    account: Account,
    chainId: string,
    swapContractAddress: string,
    partyB: string,
    tokenA: SwapParams,
    tokenB: SwapParams
): Promise<string> => {
    console.log(`Executing swap on contract ${swapContractAddress}`);

    const provider = await providerForChain(chainId);
    const wallet = new ethers.Wallet(account.privateKey, provider);
    const swapContract = new ethers.Contract(swapContractAddress, atomicSwapTemplate().abi, wallet);

    await ensureETH(account.address, chainId);
    // await ensureETH(swapContractAddress, chainId);

    const accounts = await client().listAccounts();
    const partyBAccount = accounts.find(a => a.address == partyB);
    if (!partyBAccount) {
        throw new Error(`Party B account ${partyB} not found`);
    }

    const contracts = await client().listContractsForChain(chainId);
    const foundSwapContract = contracts.find(c => c.contractAddress == swapContractAddress);
    if (!foundSwapContract) {
        throw new Error(`Swap contract ${swapContractAddress} not found`);
    }
    if (foundSwapContract.contractType != "ATOMICSWAP") {
        throw new Error(`Swap contract ${swapContractAddress} is not an AtomicSwap contract, but a ${foundSwapContract.contractType}`);
    }

    const tokenAContract = contracts.find(c => c.contractAddress == tokenA.address);
    if (!tokenAContract) {
        throw new Error(`Token A contract ${tokenA.address} not found`);
    }
    if (tokenAContract.contractType != "ERC20") {
        throw new Error(`Token A contract ${tokenA.address} is not an ERC20 contract`);
    }

    const tokenBContract = contracts.find(c => c.contractAddress == tokenB.address);
    if (!tokenBContract) {
        throw new Error(`Token B contract ${tokenB.address} not found`);
    }
    if (tokenBContract.contractType != "ERC20") {
        throw new Error(`Token B contract ${tokenB.address} is not an ERC20 contract`);
    }

    // Debug: Check balances and allowances before swap
    console.log("=== DEBUG: Pre-swap checks ===");

    // Check Token A balance and allowance for party A
    const tokenAContractInstance = new ethers.Contract(tokenA.address, erc20Template().abi, provider);
    const tokenABalanceA = await tokenAContractInstance.balanceOf(account.address);
    const tokenAAllowanceA = await tokenAContractInstance.allowance(account.address, swapContractAddress);
    console.log(`Party A (${account.address}) Token A balance: ${tokenABalanceA}, allowance: ${tokenAAllowanceA}`);

    // Check Token B balance and allowance for party B
    const tokenBContractInstance = new ethers.Contract(tokenB.address, erc20Template().abi, provider);
    const tokenBBalanceB = await tokenBContractInstance.balanceOf(partyB);
    const tokenBAllowanceB = await tokenBContractInstance.allowance(partyB, swapContractAddress);
    console.log(`Party B (${partyB}) Token B balance: ${tokenBBalanceB}, allowance: ${tokenBAllowanceB}`);

    // Check if amounts are sufficient
    console.log(`Required Token A amount: ${tokenA.amount}, available: ${tokenABalanceA}, approved: ${tokenAAllowanceA}`);
    console.log(`Required Token B amount: ${tokenB.amount}, available: ${tokenBBalanceB}, approved: ${tokenBAllowanceB}`);

    if (tokenABalanceA < tokenA.amount) {
        throw new Error(`Insufficient Token A balance. Required: ${tokenA.amount}, Available: ${tokenABalanceA}`);
    }

    if (tokenAAllowanceA < tokenA.amount) {
        throw new Error(`Insufficient Token A allowance. Required: ${tokenA.amount}, Approved: ${tokenAAllowanceA}`);
    }

    if (tokenBBalanceB < tokenB.amount) {
        throw new Error(`Insufficient Token B balance. Required: ${tokenB.amount}, Available: ${tokenBBalanceB}`);
    }

    if (tokenBAllowanceB < tokenB.amount) {
        throw new Error(`Insufficient Token B allowance. Required: ${tokenB.amount}, Approved: ${tokenBAllowanceB}`);
    }

    console.log(`Executing swap: ${tokenA.amount} of token ${tokenA.address} for ${tokenB.amount} of token ${tokenB.address} with party ${partyB}`);

    // Execute the swap - FIXED: Parameters should match the contract function signature:
    // swap(address tokenA, uint256 amountA, address partyB, address tokenB, uint256 amountB)
    try {
        const tx = await swapContract.swap(tokenA.address, tokenA.amount, partyB, tokenB.address, tokenB.amount);
        console.log("Swap transaction hash:", tx.hash);

        const receipt = await tx.wait();
        console.log("Swap receipt:", receipt);

        return receipt.hash;
    } catch (error: any) {
        console.error("Swap execution failed:", error);

        // Try to decode the error if it's a contract error
        if (error.data) {
            console.error("Error data:", error.data);

            // Check if it's a require statement error
            if (error.data.startsWith('0x08c379a0')) {
                // This is a require statement error, try to decode it
                try {
                    const decodedError = ethers.AbiCoder.defaultAbiCoder().decode(
                        ['string'],
                        error.data.slice(10) // Remove the function selector
                    );
                    console.error("Decoded error message:", decodedError[0]);
                } catch (decodeError) {
                    console.error("Failed to decode error message:", decodeError);
                }
            }
        }

        throw error;
    }
}

export const approveTokensForSwap = async (
    account: Account,
    chainId: string,
    tokenContractAddress: string,
    swapContractAddress: string,
    amount: string
): Promise<string> => {
    console.log(`Approving swap contract ${swapContractAddress} to spend ${amount} tokens from ${account.address}`);

    const provider = await providerForChain(chainId);
    const wallet = new ethers.Wallet(account.privateKey, provider);
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Template().abi, wallet);

    // Check current allowance
    const currentAllowance = await tokenContract.allowance(account.address, swapContractAddress);
    console.log(`Current allowance: ${currentAllowance}`);

    if (currentAllowance >= amount) {
        console.log("Sufficient allowance already exists");
        return "Already approved";
    }

    console.log(`Approving ${amount} tokens for swap contract`);
    const tx = await tokenContract.approve(swapContractAddress, amount);
    console.log("Approval transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Approval receipt:", receipt);

    return tx.hash;
}

export const checkSwapReadiness = async (
    account: Account,
    chainId: string,
    swapContractAddress: string,
    partyB: string,
    tokenA: SwapParams,
    tokenB: SwapParams
): Promise<{
    tokenABalance: string;
    tokenAAllowance: string;
    tokenBBalance: string;
    tokenBAllowance: string;
    isReady: boolean;
    issues: string[];
}> => {
    const provider = await providerForChain(chainId);
    const tokenAContract = new ethers.Contract(tokenA.address, erc20Template().abi, provider);
    const tokenBContract = new ethers.Contract(tokenB.address, erc20Template().abi, provider);

    const tokenABalance = await tokenAContract.balanceOf(account.address);
    const tokenAAllowance = await tokenAContract.allowance(account.address, swapContractAddress);
    const tokenBBalance = await tokenBContract.balanceOf(partyB);
    const tokenBAllowance = await tokenBContract.allowance(partyB, swapContractAddress);

    const issues: string[] = [];

    if (tokenABalance < tokenA.amount) {
        issues.push(`Party A has insufficient Token A balance. Required: ${tokenA.amount}, Available: ${tokenABalance}`);
    }

    if (tokenAAllowance < tokenA.amount) {
        issues.push(`Party A has insufficient Token A allowance. Required: ${tokenA.amount}, Approved: ${tokenAAllowance}`);
    }

    if (tokenBBalance < tokenB.amount) {
        issues.push(`Party B has insufficient Token B balance. Required: ${tokenB.amount}, Available: ${tokenBBalance}`);
    }

    if (tokenBAllowance < tokenB.amount) {
        issues.push(`Party B has insufficient Token B allowance. Required: ${tokenB.amount}, Approved: ${tokenBAllowance}`);
    }

    return {
        tokenABalance: tokenABalance.toString(),
        tokenAAllowance: tokenAAllowance.toString(),
        tokenBBalance: tokenBBalance.toString(),
        tokenBAllowance: tokenBAllowance.toString(),
        isReady: issues.length === 0,
        issues
    };
}

export const hostUrl = () => {
    return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : window.location.origin;
}

const providerForChain = async (chainId: string) => {
    const rpcUrl = hostUrl() + "/api/proxy/" + chainId;
    return new ethers.JsonRpcProvider(rpcUrl);
}


export const getBalance = async (
    chainId: string,
    contractAddress: string,
    account: Account,
): Promise<string> => {
    const contract = await erc20(account, chainId, contractAddress);
    const balance = await contract.balance(account.address);
    return balance.toString();
}

export const transferTokens = async (
    account: Account,
    contractAddress: string,
    chainId: string,
    toAddress: string,
    amount: string
): Promise<string> => {
    console.log(`Transferring ${amount} tokens from ${account.address} to ${toAddress} on contract ${contractAddress}`);

    const provider = await providerForChain(chainId);
    const wallet = new ethers.Wallet(account.privateKey, provider);
    const contract = new ethers.Contract(contractAddress, erc20Template().abi, wallet);

    console.log(`Transferring ${amount} tokens from ${account.address} to ${toAddress}`);

    const tx = await contract.transfer(toAddress, amount);
    console.log("Transfer transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transfer receipt:", receipt);

    return tx.hash;
}
