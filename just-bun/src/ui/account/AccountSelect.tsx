import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Account, loadAccounts } from "../wallet/accounts";

interface AccountSelectProps {
    onSelectAccount: (account: Account) => void;
}

export default function AccountSelect({ onSelectAccount }: AccountSelectProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selected, setSelected] = useState<string>("");
    const navigate = useNavigate();

    useEffect(() => {
        const loaded = loadAccounts();
        setAccounts(Object.values(loaded));
    }, []);

    useEffect(() => {
        if (accounts.length === 1) {
            onSelectAccount(accounts[0]);
        }
    }, [accounts, onSelectAccount]);

    if (accounts.length === 0) {
        // No accounts: show create link
        const origin = encodeURIComponent(window.location.pathname + window.location.search);
        return (
            <div>
                <span>No accounts found. </span>
                <a
                    href={`/account?origin=${origin}`}
                    className="text-blue-600 hover:underline"
                >
                    Create account
                </a>
            </div>
        );
    }

    if (accounts.length === 1) {
        // Only one account: show name and auto-select
        return <div>Account: <span className="font-semibold">{accounts[0].name}</span></div>;
    }

    // Multiple accounts: show dropdown
    return (
        <div>
            <label htmlFor="account-select" className="block mb-1 font-medium">Select Account</label>
            <select
                id="account-select"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={selected}
                onChange={e => {
                    setSelected(e.target.value);
                    const acc = accounts.find(a => a.name === e.target.value);
                    if (acc) onSelectAccount(acc);
                }}
            >
                <option value="" disabled>Select an account</option>
                {accounts.map(acc => (
                    <option key={acc.name} value={acc.name}>{acc.name}</option>
                ))}
            </select>
        </div>
    );
}
