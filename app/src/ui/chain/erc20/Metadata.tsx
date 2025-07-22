import React, { useEffect, useState } from "react";
import { erc20 } from "@/ui/wallet/web3";
import { retryUntil } from "@/lib/retryUntil";
import { useAccount } from "@/ui/account/AccountContext";
import ShowAccount from "@/ui/account/ShowAccount";

interface MetadataProps {
    chainId: string;
    contractAddress: string;
    allowanceOwnerAddress: string;
    allowanceSpenderAddress: string;
    // Optionally: swapContractAddress?: string // for allowance
}

export default function Metadata({ chainId, contractAddress, allowanceOwnerAddress, allowanceSpenderAddress }: MetadataProps) {
    const { currentAccount } = useAccount();
    const [name, setName] = useState<string | null>(null);
    const [symbol, setSymbol] = useState<string | null>(null);
    const [decimals, setDecimals] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [allowance, setAllowance] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);
    const [symbolError, setSymbolError] = useState<string | null>(null);
    const [decimalsError, setDecimalsError] = useState<string | null>(null);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [allowanceError, setAllowanceError] = useState<string | null>(null);

    // For demo, use contractAddress as the spender for allowance (could be a swap contract)
    const spenderAddress = contractAddress;

    useEffect(() => {
        let cancelled = false;
        async function fetchMetadata() {
            try {
                if (!currentAccount) {
                    throw new Error("No account selected");
                }
                const token = await erc20(currentAccount, chainId, contractAddress);
                // Name
                retryUntil(() => token.name(), 2000, 500)
                    .then((v) => !cancelled && setName(v))
                    .catch((e) => !cancelled && setNameError(e.message || "Error"));
                // Symbol
                retryUntil(() => token.symbol(), 2000, 500)
                    .then((v) => !cancelled && setSymbol(v))
                    .catch((e) => !cancelled && setSymbolError(e.message || "Error"));
                // Decimals
                retryUntil(() => token.decimals(), 2000, 500)
                    .then((v) => !cancelled && setDecimals(v.toString()))
                    .catch((e) => !cancelled && setDecimalsError(e.message || "Error"));
                // Balance
                retryUntil(() => token.balance(), 2000, 500)
                    .then((v) => !cancelled && setBalance(v.toString()))
                    .catch((e) => !cancelled && setBalanceError(e.message || "Error"));
                // Allowance (using contractAddress as spender for demo)
                retryUntil(() => token.allowance(allowanceOwnerAddress, allowanceSpenderAddress), 2000, 500)
                    .then((v) => !cancelled && setAllowance(v.toString()))
                    .catch((e) => !cancelled && setAllowanceError(e.message || "Error"));
            } catch (e: any) {
                setNameError(e.message || "Error");
                setSymbolError(e.message || "Error");
                setDecimalsError(e.message || "Error");
                setBalanceError(e.message || "Error");
                setAllowanceError(e.message || "Error");
            }
        }
        fetchMetadata();
        return () => {
            cancelled = true;
        };
    }, [chainId, contractAddress, allowanceOwnerAddress, allowanceSpenderAddress]);

    return (
        <div className="px-2 border border-border rounded-lg bg-card shadow-sm max-w-md">
            <div className="mt-2 text-xs text-muted-foreground">
                <div>{nameError ? <span className="text-red-500">{nameError}</span> : name ?? "..."}  (<span className="font-mono">{contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}</span>)</div>
                <div><ShowAccount accountAddress={allowanceOwnerAddress} /> balance: {balanceError ? <span className="text-red-500">{balanceError}</span> : balance ?? "..."}</div>
                <div><ShowAccount accountAddress={allowanceSpenderAddress} /> allowance: {allowanceError ? <span className="text-red-500">{allowanceError}</span> : allowance ?? "..."}</div>
            </div>
        </div>
    );
}
