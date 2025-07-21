import { StoredMessage, SwapContent } from "@/api/messages";
import { useEffect, useState } from "react";
import { approveSwap, erc20 } from "../wallet/web3";
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
            const targetToken = erc20(currentAccount, content.chainId, content.counterparty.tokenContractAddress);
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
            const result = await approveSwap(
                currentAccount,
                chainId,
                content.swapContractAddress,
                {
                    address: content.sourceContractAddress,
                    amount: content.amount
                }
            );
            setSuccess(result);
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
            <h2 className="font-bold text-lg mb-2">Swap Message</h2>

            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{JSON.stringify(content, null, 2)}</pre>

            <div className="flex flex-col gap-2">
                {sourceAsset && targetAsset && (
                    <div className="mb-2 text-sm text-muted-foreground">
                        swapping {content.counterparty.amount} {targetAsset.symbol} of {targetAsset.name} for {content.amount} {sourceAsset.symbol} of {sourceAsset.name} (current balance: {sourceAsset.accountBalance})
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