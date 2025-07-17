import React from "react";
import { Link } from "react-router-dom";
import { client } from "@/api/client";
import { StoredChain } from "@/api/chains";

export default function Chain() {
    // Get the last segment from the URL path as the chainId
    const chainId = React.useMemo(() => {
        const segments = window.location.pathname.split("/").filter(Boolean);
        return segments[segments.length - 1] || "";
    }, []);


    const [contracts, setContracts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [chain, setChain] = React.useState<StoredChain | null>(null);

    React.useEffect(() => {
        let mounted = true;
        setLoading(true);
        client().chainForId(chainId).then((c) => {
            if (c) {
                setChain(c);
            }
        });

        client().listContractsForChain(chainId).then((result) => {
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
            <div className="text-gray-500">Created: {new Date(chain.created).toLocaleString()}</div>

            <h3 className="mt-6 text-2xl font-semibold">Contracts</h3>
            {loading ? (
                <div className="text-gray-500">Loading contracts...</div>
            ) : contracts?.length === 0 ? (
                <div className="text-gray-500">No contracts yet.</div>
            ) : (
                <ul className="list-disc ml-6">
                    {contracts?.map((c, i) => (
                        <li key={i}>
                            <div className="text-bold text-2xl">
                                <Link className="hover:underline text-blue-600" to={`/chain/${chain.chainId}/contract/${c.contractAddress}`}>{c.name}</Link>
                                <span className="text-gray-500"> (added {new Date(c.created).toLocaleString()})</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <button
                className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.assign(`/chain/${chain.chainId}/add`)}
            >
                Add Contract
            </button>
        </div>
    );
}
