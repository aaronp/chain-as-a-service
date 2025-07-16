import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { edenTreaty } from "@elysiajs/eden";
import { client } from "@/api/client";
import { evmStateForChain, onDeployContract, updateEvmStateForContract } from "../../bff";
import { erc20Template, prepareERC20Deploy } from "@/ui/wallet/web3";
import AccountSelect from "@/ui/account/AccountSelect";
import { Account } from "@/ui/wallet/accounts";
import { ethers } from "ethers";

// const api = edenTreaty('/api');

export default function DeployERC20() {
    const { id } = useParams(); // chain id
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [account, setAccount] = useState<Account | null>(null);
    const [symbol, setSymbol] = useState("");
    const [initialSupply, setInitialSupply] = useState(1000);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deployResult, setDeployResult] = useState<any>(null);

    const canDeploy = !loading && name.trim() && symbol.trim() && account;

    async function onDeployERC20() {
        if (!account) {
            setError("No account selected");
            return;
        }
        setLoading(true);
        setError(null);
        setDeployResult(null);

        try {

            const rpcUrl = window.location.origin + "/api/proxy/" + id;
            console.log("rpcUrl", rpcUrl);
            const provider = new ethers.JsonRpcProvider(rpcUrl);
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
            // const txReceipt = await txResponse.wait();
            // console.log("txReceipt", txReceipt);
            setDeployResult({ txHash: txResponse.hash });

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


            onDeployContract(id!, "erc20", name, contractAddress);

            setDeployResult({ contractAddress, txHash: txResponse.hash });
            navigate(`/chain/${id}/contract/${contractAddress}`);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to deploy");
        } finally {
            setLoading(false);
        }
    }

    function onCancel() {
        navigate(`/chain/${id}`);
    }

    return (
        <div className="p-4 max-w-md mx-auto bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Deploy ERC20 Token</h2>
            <AccountSelect onSelectAccount={setAccount} />
            <label className="block mb-2 font-medium" htmlFor="token-name">Token Name</label>
            <input
                id="token-name"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name"
                autoFocus
            />
            <label className="block mb-2 font-medium" htmlFor="token-symbol">Symbol</label>
            <input
                id="token-symbol"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="Symbol"
            />
            <label className="block mb-2 font-medium" htmlFor="token-initial-supply">Initial Supply</label>
            <input
                id="token-initial-supply"
                type="number"
                min={0}
                max={255}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={initialSupply}
                onChange={e => setInitialSupply(Number(e.target.value))}
            />
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {deployResult && (
                <div className="text-green-700 bg-green-100 rounded p-2 mb-2 break-all">
                    <strong>Deployment Result:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">{JSON.stringify(deployResult, null, 2)}</pre>
                </div>
            )}
            <div className="flex justify-end gap-2 items-center">
                <button
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </button>
                <div className="relative group">
                    <button
                        className={`px-4 py-2 rounded text-white transition-colors ${!canDeploy
                            ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'}`}
                        onClick={onDeployERC20}
                        disabled={!canDeploy}
                    >
                        {loading ? "Creating..." : "Create"}
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <div><strong>canDeploy:</strong> {String(canDeploy)}</div>
                        <div><strong>loading:</strong> {String(loading)}</div>
                        <div><strong>name:</strong> {name || <span className='text-gray-400'>[empty]</span>}</div>
                        <div><strong>symbol:</strong> {symbol || <span className='text-gray-400'>[empty]</span>}</div>
                        <div><strong>account:</strong> {account ? (account.name || account.address || '[selected]') : <span className='text-gray-400'>[none]</span>}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
