import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { AccountMap, loadAccounts, saveAccounts } from "../wallet/accounts";
import { useTheme } from "../components/ui/sidebar";
import { Button } from "../components/ui/button";
import { useAccount } from "./AccountContext";

export default function Account() {
    const [accounts, setAccounts] = useState<AccountMap>({});
    const [newName, setNewName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const { theme } = useTheme();
    const { currentAccount, setCurrentAccount } = useAccount();

    useEffect(() => {
        setAccounts(loadAccounts());
    }, []);

    const handleAdd = () => {
        const name = newName.trim();
        if (!name) {
            setError("Name required");
            return;
        }
        if (accounts[name]) {
            setError("Name already exists");
            return;
        }
        const wallet = ethers.Wallet.createRandom();
        const updated = { ...accounts, [name]: { name, address: wallet.address, privateKey: wallet.privateKey } };
        setAccounts(updated);
        saveAccounts(updated);
        setNewName("");
        setError(null);
    };

    const handleDelete = (name: string) => {
        const updated = { ...accounts };
        delete updated[name];
        setAccounts(updated);
        saveAccounts(updated);
        setDeleteConfirm(null);
    };

    const confirmDelete = (name: string) => {
        setDeleteConfirm(name);
    };

    const cancelDelete = () => {
        setDeleteConfirm(null);
    };

    const handleSelectAccount = (account: any) => {
        setCurrentAccount(account);
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-card rounded-lg shadow-lg mt-8 border border-border">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-card-foreground">
                {/* <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> */}
                Accounts
            </h2>
            <div className="mb-4 flex gap-2">
                <input
                    className="flex-1 border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-white dark:bg-gray-100 text-gray-900 placeholder:text-gray-500 transition-colors"
                    placeholder="Account name"
                    value={newName}
                    onChange={e => { setNewName(e.target.value); setError(null); }}
                    onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
                />
                <Button
                    variant="theme"
                    aria-label="Add Account"
                    onClick={handleAdd}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add
                </Button>
            </div>
            {error && <div className="text-destructive mb-2">{error}</div>}
            <ul className="divide-y divide-border">
                {Object.entries(accounts).length === 0 ? (
                    <li className="text-muted-foreground py-2">No accounts yet.</li>
                ) : (
                    Object.entries(accounts).map(([name, { address }]) => (
                        <li key={name} className="flex items-center justify-between py-2 group">
                            <div className="flex items-center gap-2">
                                {deleteConfirm === name ? (
                                    <>
                                        <span className="pl-12 text-sm text-muted-foreground">Delete "{name}"?</span>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(name)}
                                        >
                                            Yes
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={cancelDelete}
                                        >
                                            No
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="ghost"
                                            aria-label={`Delete ${name}`}
                                            onClick={() => confirmDelete(name)}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m5 0H4" /></svg>
                                        </Button>
                                        <button
                                            className={`font-semibold text-card-foreground hover:underline cursor-pointer transition-colors ${currentAccount?.name === name ? 'text-blue-600 dark:text-blue-400' : ''
                                                }`}
                                            onClick={() => handleSelectAccount(accounts[name])}
                                        >
                                            {name}
                                            {/* {currentAccount?.name === name && (
                                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(current)</span>
                                            )} */}
                                        </button>
                                        <span className="text-xs text-muted-foreground font-mono">{address.slice(0, 8)}...{address.slice(-6)}</span>
                                    </>
                                )}
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
