import { client } from "@/api/client";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { type StoredChain } from "@/api/chains";
import AccountSelect from "../account/AccountSelect";
import { Account } from "@/ui/wallet/accounts";

export default function ChainDashboard() {
    const [modalOpen, setModalOpen] = useState(false);
    const [chainName, setChainName] = useState("");
    const [chains, setChains] = useState<StoredChain[]>([]);
    const [account, setAccount] = useState<Account | null>(null);

    const refreshChains = () => {
        client().listChains().then((chains: StoredChain[]) => {
            if (chains && Array.isArray(chains)) {
                setChains(chains);
            }
        });
    }

    useEffect(() => refreshChains(), []);

    const handleAdd = () => {
        if (account && chainName.trim()) {
            client().registerChain({
                name: chainName,
                creatorAddress: account.address

            })
            // setChains(listChains());
            refreshChains();
        }
        setChainName("");
        setModalOpen(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <h1 className="text-3xl font-bold">Chains</h1>
                <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label="Add Chain"
                    onClick={() => setModalOpen(true)}
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
                </button>
            </div>
            <div className="flex items-center gap-2 mb-8">
                <AccountSelect onSelectAccount={setAccount} />
            </div>
            {/* Modal Dialog */}
            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
                        <h2 className="text-xl font-semibold mb-4">Add Chain</h2>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Chain name"
                            value={chainName}
                            onChange={e => setChainName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                                onClick={() => { setModalOpen(false); setChainName(""); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleAdd}
                                disabled={!chainName.trim()}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Dashboard content (table/list) goes here */}
            <div className="mt-8">
                {chains.length === 0 ? (
                    <p className="text-gray-500">No chains added yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {chains.map((chain) => (
                            <li key={chain.chainId} className="py-2">
                                <Link className="text-blue-600 hover:underline" to={`/chain/${chain.chainId}`}>{chain.name}</Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
