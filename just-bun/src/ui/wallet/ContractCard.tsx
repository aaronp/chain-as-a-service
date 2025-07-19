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
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [destinationAddress, setDestinationAddress] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferError, setTransferError] = useState<string | null>(null);

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

    const handleTransfer = async () => {
        if (!destinationAddress.trim() || !transferAmount.trim()) {
            setTransferError("Please enter both destination address and amount");
            return;
        }

        setTransferLoading(true);
        setTransferError(null);

        try {
            // TODO: Implement actual transfer logic here
            console.log("Transferring", transferAmount, contract.symbol, "to", destinationAddress);

            // Simulate transfer delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Close modal and reset form
            setTransferModalOpen(false);
            setDestinationAddress("");
            setTransferAmount("");
        } catch (error: any) {
            setTransferError(error.message || "Transfer failed");
        } finally {
            setTransferLoading(false);
        }
    };

    const closeTransferModal = () => {
        setTransferModalOpen(false);
        setDestinationAddress("");
        setTransferAmount("");
        setTransferError(null);
    };

    return (
        <>
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
                            <span className="text-xs text-muted-foreground">Balance</span>
                            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            {!loading && !error && balance !== null && (
                                <p className="text-lg font-bold text-primary">
                                    {balance} {contract.symbol}
                                </p>
                            )}
                        </div>
                        {!loading && !error && balance !== null && (
                            <button
                                onClick={() => setTransferModalOpen(true)}
                                className="px-3 py-1.5 text-xs font-medium bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-all duration-200 hover:scale-105 flex items-center gap-1"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-3 h-3"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                </svg>
                                Transfer
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Transfer Modal */}
            {transferModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6 w-full max-w-md border">
                        <h2 className="text-xl font-semibold mb-4">Transfer {contract.symbol}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Destination Address</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="0x..."
                                    value={destinationAddress}
                                    onChange={(e) => setDestinationAddress(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Amount</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="0.0"
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Available: {balance} {contract.symbol}
                                </p>
                            </div>
                        </div>

                        {transferError && (
                            <div className="text-red-600 dark:text-red-400 text-sm mt-2">{transferError}</div>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 transition-colors"
                                onClick={closeTransferModal}
                                disabled={transferLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                                onClick={handleTransfer}
                                disabled={transferLoading || !destinationAddress.trim() || !transferAmount.trim()}
                            >
                                {transferLoading ? "Transferring..." : "Transfer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 