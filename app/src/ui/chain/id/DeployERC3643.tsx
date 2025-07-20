import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { edenTreaty } from "@elysiajs/eden";
import { client } from "@/api/client";
import { Button } from "@/ui/components/ui/button";

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
            console.log(response);
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
        <div className="p-4 max-w-md bg-card rounded-lg shadow-lg border border-border">
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
            <div className="flex justify-start gap-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    variant="theme"
                    onClick={onDeployERC20}
                    disabled={loading || !name.trim() || !symbol.trim()}
                >
                    {loading ? "Creating..." : "Create"}
                </Button>
            </div>
        </div>
    );
}
