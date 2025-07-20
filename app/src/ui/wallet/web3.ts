import { ethers, id } from 'ethers';
import MyToken from "contracts/erc20/out/MyToken.sol/MyToken.json";
import AtomicSwap from "contracts/swap/AtomicSwap.json";
import { client } from '@/api/client';
import { Account } from './accounts';
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

export const isAnvilAccount = (account: Account): boolean => {
    return ANVIL_ACCOUNTS.some(anvilAccount => anvilAccount.address === account.address);
};

export const fundAccount = async (account: Account, chainId: string, amount: string = "1000000000000000000") => {
    const provider = await providerForChain(chainId);

    // Use the first Anvil account as the funder
    const funder = new ethers.Wallet(ANVIL_ACCOUNTS[0].privateKey, provider);

    console.log(`Funding account ${account.address} with ${amount} wei from ${funder.address}`);

    const tx = await funder.sendTransaction({
        to: account.address,
        value: amount
    });

    console.log("Funding transaction hash:", tx.hash);
    await tx.wait();
    console.log("Account funded successfully");

    return tx.hash;
};

export const erc20Template = () => {
    const abi = MyToken.abi;
    const bytecode = MyToken.bytecode.object;
    return { abi, bytecode };
}

export const atomicSwapTemplate = () => {
    const abi = AtomicSwap.abi;
    const bytecode = AtomicSwap.bytecode.object;
    return { abi, bytecode };
}

export const hasWallet = async () => {
    const metamask = (window as any).ethereum;
    if (!metamask) {
        return false;
    }
    try {
        const provider = new ethers.BrowserProvider(metamask);
        const signer = await provider.getSigner();
        return !!signer.getAddress();
    } catch (e) {
        return false;
    }
}

export const browserProvider = async () => {
    const metamask = (window as any).ethereum;
    if (!metamask) {
        throw new Error("Metamask not found");
    }
    return new ethers.BrowserProvider(metamask);
}

export const deployERC20 = async (
    account: Account,
    chainId: string,
    name: string,
    symbol: string,
    initialSupply: number): Promise<StoredContract | ErrorResponse> => {
    const provider = await providerForChain(chainId);

    // Check if account has enough ETH, fund if needed (skip for Anvil accounts)
    if (!isAnvilAccount(account)) {
        const balance = await provider.getBalance(account.address);
        if (balance < ethers.parseEther("0.1")) {
            console.log("Account has insufficient ETH, funding...");
            await fundAccount(account, chainId);
        }
    }

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
    if (!isAnvilAccount(account)) {
        const balance = await provider.getBalance(account.address);
        if (balance < ethers.parseEther("0.1")) {
            console.log("Account has insufficient ETH, funding...");
            await fundAccount(account, chainId);
        }
    }

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
    const contract = new ethers.Contract(swapContractAddress, atomicSwapTemplate().abi, wallet);

    console.log(`Executing swap: ${tokenA.amount} of token ${tokenA.address} for ${tokenB.amount} of token ${tokenB.address} with party ${partyB}`);

    const tx = await contract.swap(partyB, tokenA.address, tokenA.amount, tokenB.address, tokenB.amount);
    console.log("Swap transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Swap receipt:", receipt);

    return tx.hash;
}

const providerForChain = async (chainId: string) => {
    const rpcUrl = window.location.origin + "/api/proxy/" + chainId;
    return new ethers.JsonRpcProvider(rpcUrl);
}

const getERC20 = async (
    chainId: string,
    contractAddress: string
) => {
    const provider = await providerForChain(chainId);

    // Get the ERC20 contract ABI (we only need the balanceOf function)
    const template = erc20Template();
    return new ethers.Contract(contractAddress, template.abi, provider);
}


export const getBalance = async (
    chainId: string,
    contractAddress: string,
    account: Account,
): Promise<string> => {
    console.log(`Getting balance for contract ${contractAddress} on chain ${chainId} for account ${account.address}`);

    // First check if the contract exists
    // const provider = await providerForChain(chainId);
    // const code = await provider.getCode(contractAddress);
    // if (code === "0x") {
    //     throw new Error(`No contract found at address ${contractAddress}`);
    // }

    const contract = await getERC20(chainId, contractAddress);
    const balance = await contract.balanceOf(account.address);
    console.log("balance", balance);
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



