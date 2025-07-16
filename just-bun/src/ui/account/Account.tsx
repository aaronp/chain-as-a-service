import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { AccountMap, loadAccounts, saveAccounts } from "../wallet/accounts";


export default function Account() {
    const [accounts, setAccounts] = useState<AccountMap>({});
    const [newName, setNewName] = useState("");
    const [error, setError] = useState<string | null>(null);

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
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded shadow mt-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                {/* <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> */}
                Accounts
            </h2>
            <div className="mb-4 flex gap-2">
                <input
                    className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Account name"
                    value={newName}
                    onChange={e => { setNewName(e.target.value); setError(null); }}
                    onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
                />
                <button
                    className="flex items-center gap-1 px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label="Add Account"
                    onClick={handleAdd}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add
                </button>
            </div>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <ul className="divide-y divide-gray-200">
                {Object.entries(accounts).length === 0 ? (
                    <li className="text-gray-500 py-2">No accounts yet.</li>
                ) : (
                    Object.entries(accounts).map(([name, { address }]) => (
                        <li key={name} className="flex items-center justify-between py-2 group">
                            <div>
                                {/* <button
                                    className="opacity-0 hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 p-1 w-6"
                                    aria-label={`Delete ${name}`}
                                    onClick={() => handleDelete(name)}
                                >
                                    <span className="text-xs">&nbsp;</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m5 0H4" /></svg>
                                </button> */}
                                <span className="font-semibold">{name}</span>
                                <span className="ml-2 text-xs text-gray-500 font-mono">{address.slice(0, 8)}...{address.slice(-6)}</span>
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
