import { client } from "@/api/client";
import React from "react";
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

    const [contract, setContract] = React.useState<any | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let mounted = true;
        setLoading(true);
        client().contractForAddress(chainId, contractId).then((result) => {
            if (mounted) setContract(result || null);
            setLoading(false);
        });
        return () => { mounted = false; };
    }, [chainId, contractId]);

    if (loading) {
        return <div>Loading contract...</div>;
    }

    if (!contract || contract.error) {
        return <div>Contract not found for address: {contractId} on chain: {chainId}</div>;
    }

    return (
        <div className="p-8">
            <Link to={`/chain/${chainId}`} className="text-blue-600 hover:underline">Back to chain</Link>
            <h2 className="text-3xl font-bold">{contract.name}</h2>
            <div className="text-gray-500">Address: <span className="font-mono">{contract.contractAddress}</span></div>
            <div className="text-gray-500">Type: {contract.contractType}</div>
            <div className="text-gray-500">Created: {new Date(contract.created).toLocaleString()}</div>
        </div>
    );
}
