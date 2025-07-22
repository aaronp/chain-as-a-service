import React, { useState, useEffect } from "react";
import { StoredContract } from "@/api/contracts";
import { client } from "@/api/client";
import { approveSwap } from "@/ui/wallet/web3";
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
import ChooseAccount from "../account/ChooseAccount";
import { PrivateAccount } from "@/ui/wallet/accounts";
import { StoredAccount } from "@/api/accounts";
import Metadata from "../chain/erc20/Metadata";

interface SwapCardProps {
    contract: StoredContract;
    account: PrivateAccount;
}

export default function SwapCard({ contract, account }: SwapCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    const [allContracts, setAllContracts] = useState<StoredContract[]>([]);
    const [selectedSourceContract, setSelectedSourceContract] = useState<string>("");
    const [selectedTargetContract, setSelectedTargetContract] = useState<string>("");
    const [amount, setAmount] = useState("");
    const [forAmount, setForAmount] = useState("");
    const [withAccount, setWithAccount] = useState<StoredAccount | null>(null);
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

        if (!selectedTargetContract || !amount || !forAmount || !withAccount) {
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

            const swapResponse = await approveSwap(
                currentAccount,
                contract.chainId,
                contract.contractAddress,
                {
                    address: selectedSourceContract,
                    amount: amount
                }
            );

            client().messages(account).send(withAccount.address, {
                type: "swap",
                chainId: contract.chainId,
                amount: amount,
                swapContractAddress: contract.contractAddress,
                sourceContractAddress: selectedSourceContract,
                counterparty: {
                    amount: forAmount,
                    tokenContractAddress: selectedTargetContract,
                    recipientAddress: withAccount.address
                },
            });



            setSuccess(`Swap executed successfully! Transaction hash: ${JSON.stringify(swapResponse)}`);
            setAmount("");
            setForAmount("");
            setWithAccount(null);
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
        setWithAccount(null);
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
                            Swap
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="!w-[60vw] !max-w-[60vw] bg-white dark:bg-card">
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
                            <div className="flex items-end">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        className="w-32 border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                        placeholder="0.0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="ml-2">
                                    <label className="block text-sm font-medium mb-2">
                                        Token
                                    </label>
                                    <select
                                        className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                        value={selectedSourceContract}
                                        onChange={(e) => {
                                            setSelectedSourceContract(e.target.value);
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
                                <div className="flex-1" />
                            </div>

                            {/* Second row: "for" label */}
                            <div className="flex justify-start">
                                {selectedSourceContract && withAccount?.address && <Metadata
                                    chainId={contract.chainId}
                                    contractAddress={selectedSourceContract}
                                    allowanceOwnerAddress={account.address}
                                    allowanceSpenderAddress={withAccount.address}
                                />}
                            </div>

                            {/* Second row: "for" label */}
                            <div className="flex justify-start">
                                <span className="text-lg font-medium text-muted-foreground">from {account.name} for</span>
                            </div>

                            {/* Third row: To token and amount */}
                            <div className="flex items-end">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        className="w-32 border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                        placeholder="0.0"
                                        value={forAmount}
                                        onChange={(e) => setForAmount(e.target.value)}
                                    />
                                </div>
                                <div className="ml-2">
                                    <label className="block text-sm font-medium mb-2">
                                        Token
                                    </label>
                                    <select
                                        className="w-full border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                        value={selectedTargetContract}
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
                                <div className="flex-1" />
                            </div>

                            {/* Fourth row: With account */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    With:
                                </label>
                                <ChooseAccount onAccountSelected={setWithAccount} />
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
                                    variant="theme"
                                    onClick={handleSwap}
                                    disabled={loading || !amount || !selectedTargetContract || !forAmount || !withAccount}
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
