import React from "react";
import { StoredContract } from "@/api/contracts";
import { Account } from "@/ui/wallet/accounts";
import ERC20Card from "./ERC20Card";
import SwapCard from "./SwapCard";

interface ContractCardProps {
    contract: StoredContract;
    account: Account;
}

export default function ContractCard({ contract, account }: ContractCardProps) {
    // Use ERC20Card for ERC20 contracts
    if (contract.contractType === "ERC20") {
        return <ERC20Card contract={contract} account={account} />;
    } else if (contract.contractType === "ATOMICSWAP") {
        return <SwapCard contract={contract} account={account} />;
    }

    // Generic fallback for other contract types
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
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-xs text-muted-foreground">Contract Info</span>
                        <p className="text-sm text-muted-foreground">
                            {contract.contractType} contract
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 