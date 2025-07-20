import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { AccountMap, createNewAccount, loadAccounts, saveAccounts } from "../wallet/accounts";
import { useTheme } from "../components/ui/sidebar";
import { Button } from "../components/ui/button";
import { useAccount } from "./AccountContext";
import { createPortal } from "react-dom";
import { client } from "@/api/client";

export default function Account() {
    const [accounts, setAccounts] = useState<AccountMap>({});
    const [newName, setNewName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showCopiedModal, setShowCopiedModal] = useState(false);
    const { currentAccount, setCurrentAccount } = useAccount();

    /**
     * ATM our server restarts are all in-memory and lose data, so this 'hack' updates 
     * the remote accounts to match the local accounts.
     * @param localAccounts 
     */
    const reconcileAccounts = async (localAccounts: AccountMap) => {
        try {
            const remoteAccounts = await client().listAccounts();
            const remoteAccountNames = new Set(remoteAccounts.map(acc => acc.name));

            // Find local accounts that don't exist remotely and create them
            for (const [name, localAccount] of Object.entries(localAccounts)) {
                if (!remoteAccountNames.has(name)) {
                    client().registerAccount({
                        name: localAccount.name,
                        address: localAccount.address,
                        publicKey: "", // Local accounts don't have public keys
                        additionalData: {}
                    }).then(() => {
                        console.log(`Created remote account for: ${name}`);
                    }).catch(err => {
                        console.error(`Failed to create remote account for ${name}:`, err);
                    });
                }
            }
        } catch (err) {
            console.error("Error syncing accounts:", err);
        }
    };
    useEffect(() => {
        const syncAccounts = async () => {
            const localAccounts = loadAccounts();
            setAccounts(localAccounts);

            reconcileAccounts(localAccounts);
        };

        syncAccounts();
    }, []);

    const handleAdd = async () => {
        const name = newName.trim();
        if (!name) {
            setError("Name required");
            return;
        }
        if (accounts[name]) {
            setError("Name already exists");
            return;
        }

        const newAccount = await createNewAccount(name);

        const updated = { ...accounts, [name]: newAccount };
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

    const copyToClipboard = async (text: string) => {
        try {
            console.log('Copying to clipboard:', text);

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                console.log('Copied using modern clipboard API');
            } else {
                // Fallback: create a temporary input element
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                console.log('Copied using fallback method');
            }

            console.log('Setting modal to true');
            setShowCopiedModal(true);
            console.log('Modal should now be visible');
            setTimeout(() => {
                console.log('Setting modal to false');
                setShowCopiedModal(false);
            }, 1000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            // Still show the modal even if copy fails
            setShowCopiedModal(true);
            setTimeout(() => setShowCopiedModal(false), 2000);
        }
    };

    const modalContent = showCopiedModal && (
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
            <button
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200"
                onClick={() => setShowCopiedModal(false)}
            >
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Address Copied!</span>
                </div>
            </button>
        </div>
    );

    return (
        <>
            {showCopiedModal && createPortal(modalContent, document.body)}
            <div className="max-w-md bg-card rounded-lg shadow-lg mt-2 p-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-card-foreground">
                    {/* <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> */}
                    Accounts
                </h2>
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
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label="Copy address"
                                                onClick={() => copyToClipboard(address)}
                                                className="ml-1 p-1 h-6 w-6 hover:border hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </ul>

                <div className="mb-4 mt-2 flex gap-2">
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
            </div>
        </>
    );
}
