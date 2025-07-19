import React, { createContext, useContext, useState, ReactNode } from "react";
import { Account } from "../wallet/accounts";

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

    return (
        <AccountContext.Provider value={{ currentAccount, setCurrentAccount }}>
            {children}
        </AccountContext.Provider>
    );
} 