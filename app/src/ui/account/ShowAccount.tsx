import React, { useEffect, useState } from "react";
import { client } from "@/api/client";

interface ShowAccountProps {
    accountAddress: string;
    className?: string;
}

export default function ShowAccount({ accountAddress, className }: ShowAccountProps) {
    const [account, setAccount] = useState<{ name: string; address: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        client()
            .getAccountByAddress(accountAddress)
            .then((acc) => {
                if (mounted) setAccount(acc ?? null);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [accountAddress]);

    if (loading) return <span className={className}>Loading...</span>;

    if (account) {
        return (
            <span className={className} title={account.address}>
                {account.name} <span className="text-xs text-muted-foreground font-mono">({account.address.slice(0, 8)}...{account.address.slice(-6)})</span>
            </span>
        );
    }

    return (
        <span className={className} title={accountAddress}>
            <span className="text-xs text-muted-foreground font-mono">{accountAddress}</span>
        </span>
    );
}
