import React from "react";
import { Link, useParams } from "react-router-dom";
import { client } from "@/api/client";
import { StoredChain } from "@/api/chains";
import { Button } from "@/ui/components/ui/button";

export default function Chain() {
    const { id: chainId } = useParams<{ id: string }>();


    const [contracts, setContracts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [chain, setChain] = React.useState<StoredChain | null>(null);

    React.useEffect(() => {
        if (!chainId) return;

        let mounted = true;
        setLoading(true);
        client().chainForId(chainId).then((c) => {
            if (c) {
                setChain(c);
            }
        });

        client().listContracts(undefined, chainId).then((result) => {
            if (mounted) setContracts(result || []);
            setLoading(false);
        });
        return () => { mounted = false; };
    }, [chainId]);

    if (loading) {
        return <div>Loading chain...</div>;
    } else if (!chain) {
        return <div>Chain not found for id: {chainId}</div>;
    }

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold">{chain.name}</h2>
            <div className="text-gray-500">({chain.chainId})</div>
            <div className="text-gray-500">Creator: {chain.creatorAddress}</div>

            <div className="text-gray-500">Created: {new Date(chain.created).toLocaleString()}</div>

            <h3 className="mt-6 mb-2 text-2xl font-semibold">Contracts</h3>
            {loading ? (
                <div className="text-gray-500">Loading contracts...</div>
            ) : contracts?.length === 0 ? (
                <div className="text-gray-500">No contracts yet.</div>
            ) : (
                <ul className="list-disc ml-6">
                    {contracts?.map((c, i) => (
                        <li key={i} className="group">
                            <div className="text-bold text-2xl p-1">
                                <Link className="hover:underline text-secondary-600" to={`/chain/${chain.chainId}/contract/${c.contractAddress}`}>{c.name}</Link>
                                <span className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"> ({c.contractType}, added {new Date(c.created).toLocaleString()})</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <Button
                className="mt-4"
                variant="theme"
                onClick={() => window.location.assign(`/chain/${chain.chainId}/add`)}
            >
                Add Contract
            </Button>
        </div>
    );
}
