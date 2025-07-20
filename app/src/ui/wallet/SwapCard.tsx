import React, { useState, useEffect } from "react";
import { StoredContract } from "@/api/contracts";
import { Account } from "@/ui/wallet/accounts";
import { client } from "@/api/client";
import { executeSwap } from "@/ui/wallet/web3";
import { useAccount } from "@/ui/account/AccountContext";
import { Button } from "@/ui/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/ui/components/ui/sheet";

interface SwapCardProps {
    contract: StoredContract;
    account: Account;
}

export default function SwapCard({ contract, account }: SwapCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    const [allContracts, setAllContracts] = useState<StoredContract[]>([]);
    const [selectedSourceContract, setSelectedSourceContract] = useState<string>("");
    const [selectedTargetContract, setSelectedTargetContract] = useState<string>("");
    const [amount, setAmount] = useState("");
    const [forAmount, setForAmount] = useState("");
    const [withAddress, setWithAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { currentAccount } = useAccount();

    // Load other contracts for the dropdown
    useEffect(() => {
        const loadContracts = async () => {
            try {
                const contracts = await client().listContractsForChain(contract.chainId);
                // Filter out the current contract and only show ERC20 contracts
                const allContracts = contracts.filter(c =>
                    c.contractAddress !== contract.contractAddress &&
                    c.contractType === "ERC20"
                );
                setAllContracts(allContracts);
            } catch (error) {
                console.error("Error loading contracts:", error);
            }
        };

        if (isOpen) {
            loadContracts();
        }
    }, [isOpen, contract.chainId, contract.contractAddress]);

    const handleSwap = async () => {
        if (!currentAccount) {
            setError("No account selected");
            return;
        }

        if (!selectedTargetContract || !amount || !forAmount || !withAddress) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const selectedContractData = allContracts.find(c => c.contractAddress === selectedTargetContract);
            if (!selectedContractData) {
                throw new Error("Selected contract not found");
            }

            const txHash = await executeSwap(
                currentAccount,
                contract.chainId,
                contract.contractAddress,
                withAddress,
                {
                    address: contract.contractAddress,
                    amount: amount
                },
                {
                    address: selectedContractData.contractAddress,
                    amount: forAmount
                }
            );

            setSuccess(`Swap executed successfully! Transaction hash: ${txHash}`);
            setAmount("");
            setForAmount("");
            setWithAddress("");
            setSelectedTargetContract("");
            setSelectedSourceContract("");
        } catch (err: any) {
            setError(err.message || "Failed to execute swap");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setAmount("");
        setForAmount("");
        setWithAddress("");
        setSelectedTargetContract("");
        setSelectedSourceContract("");
        setError(null);
        setSuccess(null);
    };

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
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="theme" >
                            Trade
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[600px] sm:w-[700px]">
                        <SheetHeader>
                            <SheetTitle>Swap {contract.symbol}</SheetTitle>
                            <SheetDescription>
                                Exchange {contract.symbol} for other tokens
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-4 mt-6">
                            {error && (
                                <div className="text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/20 rounded-md p-3">
                                    <strong>Error:</strong> {error}
                                </div>
                            )}

                            {success && (
                                <div className="text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/20 rounded-md p-3">
                                    <strong>Success:</strong> {success}
                                </div>
                            )}

                            {/* First row: From token and amount */}
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                        placeholder="0.0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">
                                        Token
                                    </label>
                                    <select
                                        className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                        value={selectedTargetContract}
                                        onChange={(e) => {
                                            setSelectedSourceContract("");
                                            setSelectedTargetContract(e.target.value);
                                        }}
                                    >
                                        <option value="">Select a token</option>
                                        {allContracts.map((contract) => (
                                            <option key={contract.contractAddress} value={contract.contractAddress}>
                                                {contract.name} ({contract.symbol})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Second row: "for" label */}
                            <div className="flex justify-start">
                                <span className="text-lg font-medium text-muted-foreground">from {account.name} for</span>
                            </div>

                            {/* Third row: To token and amount */}
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                        placeholder="0.0"
                                        value={forAmount}
                                        onChange={(e) => setForAmount(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">
                                        Token
                                    </label>
                                    <select
                                        className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                        value={selectedSourceContract}
                                        onChange={(e) => setSelectedTargetContract(e.target.value)}
                                    >
                                        <option value="">Select a token</option>
                                        {allContracts.map((contract) => (
                                            <option key={contract.contractAddress} value={contract.contractAddress}>
                                                {contract.name} ({contract.symbol})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Fourth row: With account */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    With:
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                    placeholder="0x..."
                                    value={withAddress}
                                    onChange={(e) => setWithAddress(e.target.value)}
                                />
                            </div>

                            {/* Bottom row: Button bar */}
                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        resetForm();
                                        setIsOpen(false);
                                    }}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSwap}
                                    disabled={loading || !amount || !selectedTargetContract || !forAmount || !withAddress}
                                    className="flex-1"
                                >
                                    {loading ? "Executing..." : "Trade"}
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
