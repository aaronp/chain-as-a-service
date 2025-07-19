import React, { useState, useEffect } from "react";
import { client } from "@/api/client";
import { StoredContract } from "@/api/contracts";
import { StoredChain } from "@/api/chains";
import { useAccount } from "@/ui/account/AccountContext";
import ContractCard from "./ContractCard";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function Wallet() {
    const [contracts, setContracts] = useState<StoredContract[]>([]);
    const [chains, setChains] = useState<StoredChain[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());
    const { currentAccount } = useAccount();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contractsData, chainsData] = await Promise.all([
                    client().listContracts(),
                    client().listChains()
                ]);

                if (contractsData && Array.isArray(contractsData)) {
                    setContracts(contractsData);
                }

                if (chainsData && Array.isArray(chainsData)) {
                    setChains(chainsData);

                    const chainIds = chainsData.map((chain) => chain.chainId);
                    setExpandedChains(new Set(chainIds));
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleChainExpanded = (chainId: string) => {
        const newExpanded = new Set(expandedChains);
        if (newExpanded.has(chainId)) {
            newExpanded.delete(chainId);
        } else {
            newExpanded.add(chainId);
        }
        setExpandedChains(newExpanded);
    };

    const getContractsForChain = (chainId: string) => {
        return contracts.filter(contract => contract.chainId === chainId);
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center text-muted-foreground">Loading wallet...</div>
            </div>
        );
    }

    if (!currentAccount) {
        return (
            <div className="p-8">
                <div className="text-center text-muted-foreground">
                    Please select an account to view your wallet.
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
                <p className="text-muted-foreground mt-2">
                    Account: {currentAccount.name} ({currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-8)})
                </p>
            </div>

            {chains.length === 0 ? (
                <div className="text-center text-muted-foreground">
                    No chains found. Create a chain first to see contracts.
                </div>
            ) : (
                <div className="space-y-4">
                    {chains.map((chain) => {
                        const chainContracts = getContractsForChain(chain.chainId);
                        const isExpanded = expandedChains.has(chain.chainId);
                        const hasContracts = chainContracts.length > 0;

                        return (
                            <div key={chain.chainId} className="border border-border rounded-lg bg-card">
                                <button
                                    onClick={() => toggleChainExpanded(chain.chainId)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <div>
                                            <h2 className="text-lg font-semibold text-foreground">{chain.name}</h2>
                                            <p className="text-sm text-muted-foreground">
                                                {chainContracts.length} contract{chainContracts.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-border p-4">
                                        {hasContracts ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {chainContracts.map((contract) => (
                                                    <ContractCard
                                                        key={contract.contractAddress}
                                                        contract={contract}
                                                        account={currentAccount}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted-foreground py-8">
                                                No contracts on this chain yet.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
