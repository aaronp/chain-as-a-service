import { client } from "@/api/client";
import { useAccount } from "@/ui/account/AccountContext";
import { getBalance } from "@/ui/wallet/web3";
import React from "react";
import { Link, useParams } from "react-router-dom";


export default function Contract() {
    const { chainId, address: contractId } = useParams<{ chainId: string; address: string }>();

    const [contract, setContract] = React.useState<any | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [contractError, setContractError] = React.useState<string | null>(null);
    const { currentAccount } = useAccount();
    const [balance, setBalance] = React.useState<string | null>(null);
    const [balanceLoading, setBalanceLoading] = React.useState(false);
    const [balanceError, setBalanceError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!chainId || !contractId) return;

        let mounted = true;
        setLoading(true);
        setContractError(null);

        client().contractForAddress(chainId, contractId)
            .then((result) => {
                if (mounted) {
                    setContract(result || null);
                    setLoading(false);
                }
            })
            .catch((error) => {
                if (mounted) {
                    console.error("Error loading contract:", error);
                    setContractError(error.message || "Failed to load contract");
                    setLoading(false);
                }
            });

        return () => { mounted = false; };
    }, [chainId, contractId]);

    React.useEffect(() => {
        if (!currentAccount || !chainId || !contractId) return;

        let mounted = true;
        setBalanceLoading(true);
        setBalanceError(null);

        getBalance(chainId, contractId, currentAccount)
            .then((balance) => {
                console.log("balance", balance);
                if (mounted) {
                    setBalance(balance);
                    setBalanceLoading(false);
                }
            })
            .catch((error) => {
                if (mounted) {
                    console.error("Error getting balance:", error);
                    setBalanceError(error.message || "Failed to get balance");
                    setBalanceLoading(false);
                }
            });

        return () => { mounted = false; };
    }, [chainId, contractId, currentAccount]);

    if (loading) {
        return <div className="p-8">Loading contract...</div>;
    }

    if (contractError) {
        return (
            <div className="p-8">
                <Link to={`/chain/${chainId}`} className="text-blue-600 hover:underline">Back to chain</Link>
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="text-red-800 font-medium">Error Loading Contract</h3>
                    <p className="text-red-600 mt-1">{contractError}</p>
                </div>
            </div>
        );
    }

    if (!contract || contract.error) {
        return (
            <div className="p-8">
                <Link to={`/chain/${chainId}`} className="text-blue-600 hover:underline">Back to chain</Link>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="text-yellow-800 font-medium">Contract Not Found</h3>
                    <p className="text-yellow-600 mt-1">
                        Contract not found for address: {contractId} on chain: {chainId}
                    </p>
                    {contract?.error && (
                        <p className="text-red-600 mt-2">{contract.error}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <Link to={`/chain/${chainId}`} className="text-blue-600 hover:underline">Back to chain</Link>
            <h2 className="text-3xl font-bold">{contract.name}</h2>
            <div className="flex flex-col gap-2 pt-2">
                <div className="text-gray-500">Address: <span className="font-mono">{contract.contractAddress}</span></div>
                <div className="text-gray-500">Type: {contract.contractType}</div>
                <div className="text-gray-500">Created: {new Date(contract.created).toLocaleString()}</div>
            </div>

            <div className="mt-4">
                <h3 className="text-lg font-semibold">{currentAccount?.name} Balance</h3>
                {balanceLoading && <div className="text-gray-500">Loading balance...</div>}
                {balanceError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{balanceError}</p>
                    </div>
                )}
                {!balanceLoading && !balanceError && balance !== null && (
                    <span className="text-2xl font-bold text-primary">{balance} {contract.symbol}</span>
                )}
            </div>
        </div>
    );
}
