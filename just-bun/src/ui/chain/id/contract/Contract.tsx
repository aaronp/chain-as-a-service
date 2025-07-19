import { client } from "@/api/client";
import { useAccount } from "@/ui/account/AccountContext";
import { getBalance } from "@/ui/wallet/web3";
import React from "react";
import { Link, useParams } from "react-router-dom";


export default function Contract() {
    const { chainId, address: contractId } = useParams<{ chainId: string; address: string }>();

    const [contract, setContract] = React.useState<any | null>(null);
    const [loading, setLoading] = React.useState(true);
    const { currentAccount } = useAccount();
    const [balance, setBalance] = React.useState<string | null>(null);
    React.useEffect(() => {
        if (!chainId || !contractId) return;

        let mounted = true;
        setLoading(true);
        client().contractForAddress(chainId, contractId).then((result) => {
            if (mounted) setContract(result || null);
            setLoading(false);
        });

        if (currentAccount) {

            getBalance(chainId, contractId, currentAccount!).then((balance) => {
                if (mounted) setBalance(balance);
            });
        }

        return () => { mounted = false; };
    }, [chainId, contractId]);

    if (loading) {
        return <div>Loading contract...</div>;
    }

    if (!contract || contract.error) {
        return <>
            <div>Contract not found for address: {contractId} on chain: {chainId}</div>
            {contract?.error && <div className="text-red-500">{contract.error}</div>}
        </>
    }

    return (
        <div className="p-8">
            <Link to={`/chain/${chainId}`} className="text-blue-600 hover:underline">Back to chain</Link>
            <h2 className="text-3xl font-bold">{contract.name}</h2>
            <div className="text-gray-500">Address: <span className="font-mono">{contract.contractAddress}</span></div>
            <div className="text-gray-500">Type: {contract.contractType}</div>
            <div className="text-gray-500">Created: {new Date(contract.created).toLocaleString()}</div>
            <div className="text-gray-500">Balance: {balance}</div>
        </div>
    );
}
