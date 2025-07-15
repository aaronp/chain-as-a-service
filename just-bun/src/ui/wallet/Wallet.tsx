import React, { useState } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import detectEthereumProvider from "@metamask/detect-provider";
import WalletConnect from "@walletconnect/client";

// Minimal Wallet UI
function WalletInner() {
    const { ready, authenticated, user, login, logout } = usePrivy();
    const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null);
    const [wcAddress, setWcAddress] = useState<string | null>(null);
    const [wc, setWc] = useState<any>(null);

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

    // WalletConnect connect (v1, minimal)
    async function connectWalletConnect() {
        const connector = new WalletConnect({
            bridge: "https://bridge.walletconnect.org"
        });
        if (!connector.connected) {
            await connector.createSession();
        }
        connector.on("connect", (error: any, payload: any) => {
            if (error) throw error;
            const { accounts } = payload.params[0];
            setWcAddress(accounts[0]);
        });
        setWc(connector);
    }

    function disconnectWalletConnect() {
        if (wc) wc.killSession();
        setWcAddress(null);
        setWc(null);
    }

    return (
        <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8, maxWidth: 400 }}>
            <h3>Wallet Connection</h3>
            {/* Privy */}
            <div style={{ marginBottom: 8 }}>
                <b>Privy:</b>
                {ready && authenticated ? (
                    <>
                        <div>Connected: {user?.wallet?.address}</div>
                        <button onClick={logout}>Disconnect</button>
                    </>
                ) : (
                    <button onClick={login}>Connect Privy</button>
                )}
            </div>
            {/* MetaMask */}
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
            {/* WalletConnect */}
            <div>
                <b>WalletConnect:</b>
                {wcAddress ? (
                    <>
                        <div>Connected: {wcAddress}</div>
                        <button onClick={disconnectWalletConnect}>Disconnect</button>
                    </>
                ) : (
                    <button onClick={connectWalletConnect}>Connect WalletConnect</button>
                )}
            </div>
        </div>
    );
}

// Wrap with PrivyProvider for Privy support
export default function Wallet() {
    return (
        <PrivyProvider appId={"YOUR_PRIVY_APP_ID"}>
            <WalletInner />
        </PrivyProvider>
    );
}
