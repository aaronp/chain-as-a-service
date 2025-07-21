import { StoredMessage, SwapContent } from "@/api/messages";
import { useEffect, useState } from "react";
import { approveSwap, erc20, executeSwap } from "../wallet/web3";
import { useAccount } from "../account/AccountContext";
import { client } from "@/api/client";
import { Button } from "@/ui/components/ui/button";

export default function SwapMessageContentPanel({ msg, content }: { msg: StoredMessage, content: SwapContent }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const { currentAccount } = useAccount();


    type Asset = {
        name: string,
        address: string,
        decimals: number,
        symbol: string;
        amount: string;
        accountBalance: string;
    }
    const [sourceAsset, setSourceAsset] = useState<Asset | null>(null);
    const [targetAsset, setTargetAsset] = useState<Asset | null>(null);

    useEffect(() => {
        if (currentAccount) {
            const sourceToken = erc20(currentAccount, content.chainId, content.sourceContractAddress);
            sourceToken.then((contract) => {
                Promise.all([
                    contract.symbol(),
                    contract.name(),
                    contract.decimals(),
                    contract.balance()
                ]).then(([symbol, name, decimals, balance]) => {
                    setSourceAsset({
                        name: name,
                        address: content.sourceContractAddress,
                        decimals: decimals,
                        symbol: symbol,
                        amount: balance,
                        accountBalance: balance
                    });
                });
            });

            const targetToken = erc20(currentAccount, content.chainId, content.counterparty.tokenContractAddress);
            targetToken.then((contract) => {
                Promise.all([
                    contract.symbol(),
                    contract.name(),
                    contract.decimals(),
                    contract.balance()
                ]).then(([symbol, name, decimals, balance]) => {
                    setTargetAsset({
                        name: name,
                        address: content.counterparty.tokenContractAddress,
                        decimals: decimals,
                        symbol: symbol,
                        amount: balance,
                        accountBalance: balance
                    });
                });
            });
        }
    }, [currentAccount]);

    const handleApprove = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            if (!currentAccount) {
                setError("No account selected");
                setLoading(false);
                return;
            }
            // Find the swap contract in the registry to get chainId
            const contracts = await client().listContracts();
            const swapContract = contracts.find((c: any) => c.contractAddress === content.swapContractAddress);
            if (!swapContract) {
                setError("Swap contract not found in registry");
                setLoading(false);
                return;
            }
            const chainId = swapContract.chainId;
            // Approve the token from the source contract for the swap contract
            const approveResult = await approveSwap(
                currentAccount,
                chainId,
                content.swapContractAddress,
                {
                    address: content.sourceContractAddress,
                    amount: content.amount
                }
            );

            console.log("approveResult:", approveResult);

            const swapResult = await executeSwap(
                currentAccount,
                chainId,
                content.swapContractAddress,
                content.counterparty.recipientAddress,
                {
                    address: content.sourceContractAddress,
                    amount: content.amount
                },
                {
                    address: content.counterparty.tokenContractAddress,
                    amount: content.counterparty.amount
                }
            );


            // const mailResponse = client().messages(account).send(withAccount.address, {
            //     type: "swap",
            //     chainId: content.chainId,
            //     amount: content.amount,
            //     swapContractAddress: contract.contractAddress,
            //     sourceContractAddress: selectedSourceContract,
            //     counterparty: {
            //         amount: forAmount,
            //         tokenContractAddress: selectedTargetContract,
            //         recipientAddress: withAccount.address
            //     },
            // });
            setSuccess(swapResult);
            setShowModal(true);
            setTimeout(() => setShowModal(false), 2000);
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex flex-col gap-2">
                {sourceAsset && targetAsset && (
                    <div className="mb-2 text-sm text-muted-foreground">
                        <div className="font-semibold text-lg pb-2">Swap:</div>
                        <div className="font-bold text-2xl">{content.counterparty.amount} {targetAsset.symbol}</div>
                        <div className="text-sm text-muted-foreground">(current balance: {targetAsset.accountBalance})</div>
                        <div className="text-semibold p-4">for</div>
                        <div className="font-bold text-2xl">{content.amount} {sourceAsset.symbol}</div>
                        <div className="text-sm text-muted-foreground">(current balance: {sourceAsset.accountBalance})</div>
                    </div>
                )}
            </div>
            <Button
                variant="theme"
                onClick={handleApprove}
                disabled={loading}
            >
                {loading ? "Approving..." : "Approve Swap"}
            </Button>
            {error && <div className="text-red-500 mt-2">{error}</div>}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white p-6 rounded shadow-lg">
                        <div className="font-bold mb-2">Approval Success</div>
                        <div className="break-all text-xs">{success}</div>
                    </div>
                </div>
            )}
        </div>
    );
} 