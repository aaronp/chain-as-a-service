import { ethers, id } from 'ethers';
import MyToken from "contracts/erc20/out/MyToken.sol/MyToken.json";
import { client } from '@/api/client';
import { Account } from './accounts';
import { StoredContract } from '@/api/contracts';
import { ErrorResponse } from '@/api/error';

// const erc20dir = path.resolve(process.cwd(), "contracts/erc20");
// const abiPath = path.resolve(erc20dir, "out/MyToken.sol/MyToken.json"); // TODO: make this dynamic


export const erc20Template = () => {
    const abi = MyToken.abi;
    const bytecode = MyToken.bytecode.object;
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
    const provider = providerForChain(chainId);
    const wallet = new ethers.Wallet(account.privateKey, provider);

    const address = await wallet.getAddress();
    console.log("address", address);

    const signer = await provider.getSigner();

    const template = erc20Template();
    const { signedTx, unsignedTx } = await prepareERC20Deploy(signer, template.abi, template.bytecode, name, symbol, initialSupply);
    console.log(signedTx, unsignedTx);

    // Submit the signed transaction
    // ethers v6: use provider.broadcastTransaction for raw signed tx
    console.log("broadcasting transaction", signedTx);
    const txResponse = await provider.broadcastTransaction(signedTx);
    console.log("txResponse", txResponse);
    console.log("deployed contract", {
        hash: txResponse.blockHash,
        block: txResponse.blockNumber
    });

    const receipt = await provider.waitForTransaction(txResponse.hash);
    console.log("receipt", receipt);
    if (!receipt?.contractAddress) {
        throw new Error("No receipt");
    }
    const contractAddress = receipt.contractAddress;
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




export const prepareERC20Deploy = async (
    signer: ethers.Signer,
    abi: any,
    bytecode: string,
    name: string,
    symbol: string,
    initialSupply: number) => {


    // Get contract ABI & bytecode
    console.log("creating factory with abi", JSON.stringify(abi).slice(0, 10), "... and bytecode", bytecode.slice(0, 100));
    const factory = new ethers.ContractFactory(abi, bytecode, signer);

    console.log("getting deploy transaction for factory", factory);

    // Populate unsigned deployment tx
    const unsignedTx = await factory.getDeployTransaction(name, symbol, initialSupply);
    console.log("unsigned tx", unsignedTx);
    // Sign (but don’t send) the tx
    const signedTx = await signer.signTransaction(unsignedTx);
    return {
        signedTx,
        unsignedTx,
    };

    // // Send signed tx to backend
    // const res = await fetch('/erc20/send-signed', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ signedTx }),
    // });
    // const data = await res.json();
    // console.log('Deployed contract at:', data.contractAddress);
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
    const contract = await getERC20(chainId, contractAddress);
    const balance = await contract.balanceOf(account.address);
    return balance.toString();
}

export const transferTokens = async (
    account: Account,
    contractAddress: string,
    chainId: string,
    toAddress: string,
    amount: string
): Promise<string> => {
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



