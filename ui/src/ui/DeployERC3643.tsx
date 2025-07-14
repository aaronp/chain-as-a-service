import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { edenTreaty } from "@elysiajs/eden";
import { client } from "@/api/client";

const api = edenTreaty('/api');

export default function DeployERC3643() {
    const { id } = useParams(); // chain id
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [decimals, setDecimals] = useState(18);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onDeployERC20() {
        setLoading(true);
        setError(null);
        try {
            const response = await client(window.location.origin).deploy({
                contractType: "ERC3643",
                name,
                symbol,
                decimals,
            });
            alert(response.result);
            navigate(`/chain/${id}`);
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
            <h2 className="text-xl font-semibold mb-4">Deploy ERC3643 Token</h2>
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
