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
        <div className="p-8">
            <h2 className="text-3xl font-bold">{chain.name}</h2>
            <div className="text-gray-500">({chain.id})</div>
            <div className="text-gray-500">Created: {new Date(chain.createdAt).toLocaleString()}</div>

            <h3 className="mt-6 text-2xl font-semibold">Contracts</h3>
            {contracts?.length === 0 ? (
                <div className="text-gray-500">No contracts yet.</div>
            ) : (
                <ul className="list-disc ml-6">
                    {contracts?.map((c, i) => (
                        <li key={i}>

                            <div className="text-bold text-2xl">{c.name}</div>
                            <div className="font-mono text-gray-500">{c.address}</div>
                            <div className="text-gray-500"> (added {new Date(c.createdAt).toLocaleString()})</div>
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
