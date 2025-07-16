import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { edenTreaty } from "@elysiajs/eden";
import { client } from "@/api/client";
import { evmStateForChain, onDeployContract, updateEvmStateForContract } from "../../bff";

const api = edenTreaty('/api');

export default function DeployERC20() {
    const { id } = useParams(); // chain id
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [decimals, setDecimals] = useState(18);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deployResult, setDeployResult] = useState<any>(null);

    async function onDeployERC20() {
        setLoading(true);
        setError(null);
        setDeployResult(null);
        try {
            const state = evmStateForChain(id!)

            const response = await client(window.location.origin).deploy({
                contractType: "ERC20",
                name,
                symbol,
                decimals,
                previousState: state
            });
            console.log(response);

            onDeployContract(id!, "erc20", name, response.contractAddress);
            updateEvmStateForContract(id!, response.state);

            setDeployResult(response);
            navigate(`/chain/${id}/contract/${response.contractAddress}`);
        } catch (e: any) {
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
            <label className="block mb-2 font-medium" htmlFor="token-name">Token Name</label>
            <input
                id="token-name"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="MyToken"
                autoFocus
            />
            <label className="block mb-2 font-medium" htmlFor="token-symbol">Symbol</label>
            <input
                id="token-symbol"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="MTK"
            />
            <label className="block mb-2 font-medium" htmlFor="token-decimals">Decimals</label>
            <input
                id="token-decimals"
                type="number"
                min={0}
                max={255}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={decimals}
                onChange={e => setDecimals(Number(e.target.value))}
            />
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {deployResult && (
                <div className="text-green-700 bg-green-100 rounded p-2 mb-2 break-all">
                    <strong>Deployment Result:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">{JSON.stringify(deployResult, null, 2)}</pre>
                </div>
            )}
            <div className="flex justify-end gap-2">
                <button
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={onDeployERC20}
                    disabled={loading || !name.trim() || !symbol.trim()}
                >
                    {loading ? "Creating..." : "Create"}
                </button>
            </div>
        </div>
    );
}
