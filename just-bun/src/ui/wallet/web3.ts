import { ethers } from 'ethers';

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

// export const getWalletAddress = async () => {
//     const provider = await browserProvider();
//     const signer = await provider.getSigner();
//     return signer.getAddress();
// }

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