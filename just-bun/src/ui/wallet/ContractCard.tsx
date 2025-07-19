import React, { useState, useEffect } from "react";
import { StoredContract } from "@/api/contracts";
import { Account } from "@/ui/wallet/accounts";
import { getBalance } from "@/ui/wallet/web3";
import { retryUntil } from "@/lib/retryUntil";

interface ContractCardProps {
    contract: StoredContract;
    account: Account;
}

export default function ContractCard({ contract, account }: ContractCardProps) {
    const [balance, setBalance] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        retryUntil(
            () => getBalance(contract.chainId, contract.contractAddress, account),
            2000, // max 2 seconds
            500   // 500ms delay between retries
        )
            .then((balance) => {
                if (mounted) {
                    setBalance(balance);
                    setLoading(false);
                }
            })
            .catch((error) => {
                if (mounted) {
                    console.error("Error getting balance after retries:", error);
                    setError(error.message || "Failed to get balance");
                    setLoading(false);
                }
            });

        return () => { mounted = false; };
    }, [contract.chainId, contract.contractAddress, account]);

    return (
        <div className="p-4 border border-border rounded-lg bg-card shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-semibold text-card-foreground">{contract.name}</h3>
                    <p className="text-sm text-muted-foreground">{contract.symbol}</p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <p className="text-sm font-medium">{contract.contractType}</p>
                </div>
            </div>

            <div className="mb-2">
                <span className="text-xs text-muted-foreground">Address</span>
                <p className="text-xs font-mono text-card-foreground break-all">
                    {contract.contractAddress}
                </p>
            </div>

            <div className="border-t border-border pt-2">
                <span className="text-xs text-muted-foreground">Balance</span>
                {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}
                {!loading && !error && balance !== null && (
                    <p className="text-lg font-bold text-primary">
                        {balance} {contract.symbol}
                    </p>
                )}
            </div>
        </div>
    );
} 