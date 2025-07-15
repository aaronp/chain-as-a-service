import React from "react";
import { contractForAddress } from "../../../bff";
import { Link } from "react-router-dom";

export default function Contract() {
    // Parse /chain/:chainId/contract/:contractId from the URL
    const { chainId, contractId } = React.useMemo(() => {
        const segments = window.location.pathname.split("/").filter(Boolean);
        // Expect: ["chain", chainId, "contract", contractId]
        const chainIdx = segments.indexOf("chain");
        const contractIdx = segments.indexOf("contract");
        return {
            chainId: chainIdx !== -1 ? segments[chainIdx + 1] : "",
            contractId: contractIdx !== -1 ? segments[contractIdx + 1] : ""
        };
    }, []);

    const contract = contractForAddress(chainId, contractId);

    if (!contract) {
        return <div>Contract not found for address: {contractId} on chain: {chainId}</div>;
    }

    return (
        <div className="p-8">
            <Link to={`/chain/${chainId}`} className="text-blue-600 hover:underline">Back to chain</Link>
            <h2 className="text-3xl font-bold">{contract.name}</h2>
            <div className="text-gray-500">Address: <span className="font-mono">{contract.address}</span></div>
            <div className="text-gray-500">Type: {contract.type}</div>
            <div className="text-gray-500">Created: {new Date(contract.createdAt).toLocaleString()}</div>
        </div>
    );
}
