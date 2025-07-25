import React, { useState, useEffect } from "react";
import { client } from "@/api/client";
import { StoredContract } from "@/api/contracts";
import { StoredChain } from "@/api/chains";
import { useAccount } from "@/ui/account/AccountContext";
import ContractCard from "./ContractCard";
import { Button } from "@/ui/components/ui/button";
import { useTheme } from "@/ui/components/ui/sidebar";
import { Link } from "react-router-dom";

export default function Wallet() {
    const [contracts, setContracts] = useState<StoredContract[]>([]);
    const [chains, setChains] = useState<StoredChain[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
    const [selectedChainContracts, setSelectedChainContracts] = useState<StoredContract[]>([]);
    const [contractsLoading, setContractsLoading] = useState(false);
    const { currentAccount } = useAccount();
    const { theme } = useTheme();

    useEffect(() => {
        const fetchChains = async () => {
            try {
                const chainsData = await client().listChains();

                if (chainsData && Array.isArray(chainsData)) {
                    setChains(chainsData);

                    // Auto-select the first chain if available
                    if (chainsData.length > 0) {
                        setSelectedChainId(chainsData[0].chainId);
                    }
                }
            } catch (error) {
                console.error("Error fetching chains:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChains();
    }, []);

    // Load contracts when chain selection changes
    useEffect(() => {
        if (!selectedChainId) {
            setSelectedChainContracts([]);
            return;
        }

        const fetchContractsForChain = async () => {
            setContractsLoading(true);
            try {
                const contractsData = await client().listContracts(undefined, selectedChainId);

                if (contractsData && Array.isArray(contractsData)) {
                    const walletContractTypes = ["ERC20", "ERC3643"];
                    const walletContracts = contractsData.filter(contract => walletContractTypes.includes(contract.contractType));
                    setSelectedChainContracts(walletContracts);
                } else {
                    setSelectedChainContracts([]);
                }
            } catch (error) {
                console.error("Error fetching contracts for chain:", error);
                setSelectedChainContracts([]);
            } finally {
                setContractsLoading(false);
            }
        };

        fetchContractsForChain();
    }, [selectedChainId]);

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

    const selectedChain = chains.find(chain => chain.chainId === selectedChainId);

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
                <p className="text-muted-foreground mt-2">

                    Account: <Link to={`/account`}>{currentAccount.name} <span className="text-xs text-muted-foreground">({currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)})</span></Link>
                </p>
            </div>

            {chains.length === 0 ? (
                <div className="text-center text-muted-foreground">
                    No chains found. Create a chain first to see contracts.
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Chain Selection Row */}
                    <div>
                        <h2 className="text-lg font-semibold text-foreground mb-3">Chain:</h2>
                        <div className="flex flex-wrap gap-2">
                            {chains.map((chain) => {
                                const isSelected = selectedChainId === chain.chainId;

                                return (
                                    <Button
                                        key={chain.chainId}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedChainId(chain.chainId)}
                                        className={`flex items-center gap-2 ${isSelected
                                            ? theme === 'dark'
                                                ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                            : ''
                                            }`}
                                    >
                                        {chain.name}
                                        {isSelected && contractsLoading && (
                                            <span className="text-xs">...</span>
                                        )}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Chain Contracts */}
                    {selectedChain && (
                        <div>

                            {contractsLoading ? (
                                <div className="text-center text-muted-foreground py-8">
                                    Loading contracts...
                                </div>
                            ) : selectedChainContracts.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    No contracts on this chain yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {selectedChainContracts.map((contract) => (
                                        <ContractCard
                                            key={contract.contractAddress}
                                            contract={contract}
                                            account={currentAccount}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
