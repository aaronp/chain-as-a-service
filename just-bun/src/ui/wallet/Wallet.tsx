import React, { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";

export default function Wallet() {
    const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null);

    // MetaMask connect
    async function connectMetaMask() {
        const provider: any = await detectEthereumProvider();
        if (provider && provider.request) {
            const accounts = await provider.request({ method: "eth_requestAccounts" });
            setMetaMaskAddress(accounts[0]);
        } else {
            alert("MetaMask not found");
        }
    }

    return (
        <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8, maxWidth: 400 }}>
            <h3>Wallet Connection</h3>
            <div style={{ marginBottom: 8 }}>
                <b>MetaMask:</b>
                {metaMaskAddress ? (
                    <>
                        <div>Connected: {metaMaskAddress}</div>
                        <button onClick={() => setMetaMaskAddress(null)}>Disconnect</button>
                    </>
                ) : (
                    <button onClick={connectMetaMask}>Connect MetaMask</button>
                )}
            </div>
        </div>
    );
}
