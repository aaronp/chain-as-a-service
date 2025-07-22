import React, { useState, useEffect } from "react";
import { StoredContract } from "@/api/contracts";
import { PrivateAccount as Account } from "@/ui/wallet/accounts";
import { erc20, transferTokens } from "@/ui/wallet/web3";
import { retryUntil } from "@/lib/retryUntil";
import { createPortal } from "react-dom";
import { Button } from "@/ui/components/ui/button";
import ChooseAccount from "../account/ChooseAccount";
import { StoredAccount } from "@/api/accounts";
import SwapCard from "./SwapCard";
import { client } from "@/api/client";

interface ERC20CardProps {
    contract: StoredContract;
    account: Account;
}

export default function ERC20Card({ contract, account }: ERC20CardProps) {
    const [balance, setBalance] = useState<string | null>(null);
    const [allocation, setAllocation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [destinationAccount, setDestinationAccount] = useState<StoredAccount | null>(null);
    const [swapContract, setSwapContract] = useState<StoredContract | null>(null);
    const [transferAmount, setTransferAmount] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferError, setTransferError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [transferResult, setTransferResult] = useState<string | null>(null);
    const [swapModalOpen, setSwapModalOpen] = useState(false);

    const refreshBalance = () => {
        setLoading(true);
        setError(null);

        retryUntil(
            () => erc20(account, contract.chainId, contract.contractAddress),
            2000, // max 2 seconds
            500   // 500ms delay between retries
        )
            .then(async (ercContract) => {

                ercContract.balance(account.address).then((balance) => {
                    setBalance(balance);
                    setLoading(false);
                });

                let swap = swapContract;
                if (!swap) {
                    client().listContractsForChain(contract.chainId).then((all) => {
                        const found = all.find((c: StoredContract) => c.contractType === "ATOMICSWAP");

                        if (found?.contractAddress) {
                            ercContract.allowance(account.address, found?.contractAddress).then((allowance) => {
                                setAllocation(allowance);
                            });
                        }
                    })
                } else {
                    ercContract.allowance(account.address, swap?.contractAddress).then((allowance) => {
                        setAllocation(allowance);
                    });
                }
            })
            .catch((error) => {
                console.error("Error getting balance after retries:", error);
                setError(error.message || "Failed to get balance");
                setLoading(false);
            });
    };

    useEffect(() => {

        client().listContractsForChain(contract.chainId).then((contracts) => {
            const swapContract = contracts.find((c: StoredContract) => c.contractType === "ATOMICSWAP");
            if (swapContract) {
                setSwapContract(swapContract);
            }

            refreshBalance();
        });


    }, [contract.chainId, contract.contractAddress, account]);


    const closeTransferModal = () => {
        setTransferModalOpen(false);
        setDestinationAccount(null);
        setTransferAmount("");
        setTransferError(null);
    };

    const handleTransfer = async () => {
        if (!destinationAccount || !transferAmount.trim()) {
            setTransferError("Please enter both destination address and amount");
            return;
        }

        setTransferLoading(true);
        setTransferError(null);

        try {
            const result = await transferTokens(account, contract.contractAddress, contract.chainId, destinationAccount.address, transferAmount);
            console.log("Transfer result:", result);

            // Close transfer modal and reset form
            closeTransferModal();

            // Store the result and show success modal
            setTransferResult(result);
            setShowSuccessModal(true);

            // Auto-hide success modal after 1 second and refresh balance
            setTimeout(() => {
                setShowSuccessModal(false);
                setTransferResult(null);
                refreshBalance();
            }, 2000);

        } catch (error: any) {
            setTransferError(error.message || "Transfer failed");
        } finally {
            setTransferLoading(false);
        }
    };


    const closeSwapModal = () => {
        setSwapModalOpen(false);
    };

    const successModalContent = showSuccessModal && (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Transfer Successful!</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Transaction hash: {transferResult?.slice(0, 10)}...{transferResult?.slice(-8)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {showSuccessModal && createPortal(successModalContent, document.body)}
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



                {allocation && <div className="mb-2 bg-green-500">
                    <span className="text-xs text-muted-foreground">Allocation</span>
                    <span className="text-xs font-mono text-card-foreground break-all">
                        {allocation} {contract.symbol}
                    </span>
                </div>}



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
                            <div className="flex flex-row gap-2">
                                {swapContract != null && <SwapCard swapContract={swapContract} account={account} sourceTargetContract={contract.contractAddress} />}
                                <Button
                                    variant="theme"
                                    onClick={() => setTransferModalOpen(true)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-3 h-3 ml-1"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5L19.5 12L4.5 4.5L7.5 12L4.5 19.5Z" />
                                    </svg>
                                    <span className="pl-1">Transfer</span>
                                </Button>
                            </div>
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
                                <ChooseAccount onAccountSelected={setDestinationAccount} />
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
                            <Button
                                variant="outline"
                                onClick={closeTransferModal}
                                disabled={transferLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="theme"
                                onClick={handleTransfer}
                                disabled={transferLoading || !destinationAccount || !transferAmount.trim()}
                            >
                                {transferLoading ? "Transferring..." : "Transfer"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Swap Modal */}
            {swapModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6 w-full max-w-2xl border relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={closeSwapModal}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                    </div>
                </div>
            )}
        </>
    );
} 