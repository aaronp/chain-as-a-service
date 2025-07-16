import { ethers } from "ethers";

export interface Account {
    name: string;
    address: string;
    privateKey: string;
}

export interface AccountMap {
    [name: string]: Account;
}

const ACCOUNTS_KEY = "accounts";



export function loadAccounts(): AccountMap {
    try {
        const raw = localStorage.getItem(ACCOUNTS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function saveAccounts(accounts: AccountMap) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
