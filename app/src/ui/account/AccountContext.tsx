import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { loadAccounts } from "../wallet/accounts";
import { Account } from "@/api/accounts";

const CURRENT_ACCOUNT_KEY = "currentAccountName";

export function setCurrentAccountName(name: string | null) {
    if (name) {
        localStorage.setItem(CURRENT_ACCOUNT_KEY, name);
    } else {
        localStorage.removeItem(CURRENT_ACCOUNT_KEY);
    }
}

export function getCurrentAccountName(): string | null {
    return localStorage.getItem(CURRENT_ACCOUNT_KEY);
}

interface AccountContextType {
    currentAccount: Account | null;
    setCurrentAccount: (account: Account | null) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function useAccount() {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error("useAccount must be used within an AccountProvider");
    }
    return context;
}

interface AccountProviderProps {
    children: ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
    const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        const accountMap = loadAccounts();
        setAccounts(Object.values(accountMap));
        const currentAccountName = getCurrentAccountName();
        if (currentAccountName) {
            setCurrentAccount(accountMap[currentAccountName]);
        }
    }, []);

    const handleSetCurrentAccount = (account: Account | null) => {
        setCurrentAccount(account);
        setCurrentAccountName(account?.name || null);
    };

    return (
        <AccountContext.Provider value={{ currentAccount, setCurrentAccount: handleSetCurrentAccount }}>
            {children}
        </AccountContext.Provider>
    );
} 