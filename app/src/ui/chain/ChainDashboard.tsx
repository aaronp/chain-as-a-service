import { client } from "@/api/client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { type StoredChain } from "@/api/chains";
import { Button } from "@/ui/components/ui/button";
import { useAccount } from "@/ui/account/AccountContext";

export default function ChainDashboard() {
    const [modalOpen, setModalOpen] = useState(false);
    const [chainName, setChainName] = useState("");
    const [chains, setChains] = useState<StoredChain[]>([]);
    const { currentAccount } = useAccount();

    const refreshChains = () => {
        client().listChains().then((chains: StoredChain[]) => {
            if (chains && Array.isArray(chains)) {
                setChains(chains);
            }
        });
    }

    useEffect(() => refreshChains(), []);

    const handleAdd = () => {
        if (currentAccount && chainName.trim()) {
            client().registerChain({
                name: chainName,
                creatorAddress: currentAccount.address

            })
            refreshChains();
        }
        setChainName("");
        setModalOpen(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <h1 className="text-3xl font-bold text-foreground">Chains</h1>
                <Button
                    variant="theme"
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Chain
                </Button>
            </div>
            {/* Modal Dialog */}
            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 w-full max-w-sm border">
                        <h2 className="text-xl font-semibold mb-4">Add Chain</h2>
                        <input
                            type="text"
                            className="w-full border border-input rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                            placeholder="Chain name"
                            value={chainName}
                            onChange={e => setChainName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => { setModalOpen(false); setChainName(""); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAdd}
                                disabled={!chainName.trim()}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Dashboard content (table/list) goes here */}
            <div className="mt-8">
                {chains.length === 0 ? (
                    <p className="text-muted-foreground">No chains added yet.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {chains.map((chain) => (
                            <li key={chain.chainId} className="py-2">
                                <Link className="text-primary hover:underline" to={`/chain/${chain.chainId}`}>{chain.name}</Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
