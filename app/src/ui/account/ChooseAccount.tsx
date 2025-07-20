import React, { useState, useEffect, useRef } from "react";
import { client } from "@/api/client";
import { StoredAccount } from "@/api/accounts";
import { useAccount } from "./AccountContext";
import { Button } from "../components/ui/button";
import { ChevronDown, Search, Plus, User } from "lucide-react";

interface ChooseAccountProps {
    onAccountSelect?: (account: StoredAccount) => void;
    onAccountSelected?: (address: string) => void;
    className?: string;
    placeholder?: string;
}

export default function ChooseAccount({
    onAccountSelect,
    onAccountSelected,
    className = "",
    placeholder = "Select or create account..."
}: ChooseAccountProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [accounts, setAccounts] = useState<StoredAccount[]>([]);
    const [filterText, setFilterText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { currentAccount, setCurrentAccount } = useAccount();

    // Load accounts from API
    useEffect(() => {
        const loadAccounts = async () => {
            setLoading(true);
            setError(null);
            try {
                const accountsData = await client().listAccounts();
                setAccounts(accountsData || []);
            } catch (err) {
                console.error("Error loading accounts:", err);
                setError("Failed to load accounts");
            } finally {
                setLoading(false);
            }
        };

        loadAccounts();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter accounts based on search text
    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(filterText.toLowerCase()) ||
        account.address.toLowerCase().includes(filterText.toLowerCase())
    );

    // Check if filter text matches any existing account
    const exactMatch = accounts.find(account =>
        account.name.toLowerCase() === filterText.toLowerCase()
    );

    const handleAccountSelect = (account: StoredAccount) => {
        // Convert StoredAccount to the Account type expected by context
        const accountForContext = {
            name: account.name,
            address: account.address,
            privateKey: "", // API accounts don't have private keys
        };

        setCurrentAccount(accountForContext);
        onAccountSelect?.(account);
        onAccountSelected?.(account.address);
        setIsOpen(false);
        setFilterText("");
    };

    const handleCreateAccount = async () => {
        if (!filterText.trim() || exactMatch) return;

        setLoading(true);
        setError(null);

        try {
            // For now, we'll create a placeholder account
            // In a real implementation, you might want to generate a proper keypair
            const newAccount = await client().registerAccount({
                name: filterText.trim(),
                address: `0x${Math.random().toString(16).slice(2, 42)}`, // Placeholder address
                publicKey: `0x${Math.random().toString(16).slice(2, 66)}`, // Placeholder public key
                additionalData: {}
            });

            if ('error' in newAccount) {
                setError(newAccount.error);
                return;
            }

            // Add to local state
            setAccounts(prev => [...prev, newAccount]);

            // Select the new account
            handleAccountSelect(newAccount);
        } catch (err) {
            console.error("Error creating account:", err);
            setError("Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    const getDisplayText = () => {
        if (currentAccount) {
            return `${currentAccount.name} (${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)})`;
        }
        return placeholder;
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between"
                disabled={loading}
            >
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="truncate">{getDisplayText()}</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search accounts..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="w-full pl-8 pr-2 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="px-2 py-1 text-xs text-destructive bg-destructive/10">
                            {error}
                        </div>
                    )}

                    {/* Loading state */}
                    {loading && (
                        <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                            Loading...
                        </div>
                    )}

                    {/* Account list */}
                    <div className="max-h-40 overflow-y-auto">
                        {filteredAccounts.length === 0 && filterText && !loading ? (
                            <div className="px-2 py-2 text-sm text-muted-foreground">
                                No accounts found
                            </div>
                        ) : (
                            filteredAccounts.map((account) => (
                                <button
                                    key={account.name}
                                    onClick={() => handleAccountSelect(account)}
                                    className="w-full px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                                >
                                    <User className="h-4 w-4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{account.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono truncate">
                                            {account.address}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Create new account option */}
                    {filterText && !exactMatch && !loading && (
                        <div className="border-t border-border">
                            <button
                                onClick={handleCreateAccount}
                                className="w-full px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Create "{filterText}"</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
