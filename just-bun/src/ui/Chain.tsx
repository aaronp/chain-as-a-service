import React from "react";
import { chainForId, listContracts } from "./bff";

export default function Chain() {
    // Get the last segment from the URL path as the chainId
    const chainId = React.useMemo(() => {
        const segments = window.location.pathname.split("/").filter(Boolean);
        return segments[segments.length - 1] || "";
    }, []);

    const chain = chainForId(chainId);

    if (!chain) {
        return <div>Chain not found for id: {chainId}</div>;
    }

    const contracts = listContracts(chainId);


    return (
        <div>
            <h2>{chain.name}</h2>
            <div className="text-gray-500">({chain.id})</div>
            <div>Created: {new Date(chain.createdAt).toLocaleString()}</div>

            <h3 className="mt-6 text-lg font-semibold">Contracts</h3>
            {contracts?.length === 0 ? (
                <div className="text-gray-500">No contracts yet.</div>
            ) : (
                <ul className="list-disc ml-6">
                    {contracts?.map((c, i) => (
                        <li key={i}>
                            <span className="font-mono">{c.name}</span> @ <span className="font-mono">{c.address}</span> (added {new Date(c.createdAt).toLocaleString()})
                        </li>
                    ))}
                </ul>
            )}
            <button
                className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.assign(`/chain/${chain.id}/add`)}
            >
                Add Contract
            </button>
        </div>
    );
}
