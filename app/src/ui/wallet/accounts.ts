import { Account } from "@/api/accounts";
import { client } from "@/api/client";
import { ethers } from "ethers";

export interface PrivateAccount {
    name: string;
    address: string;
    privateKey: string;
}

export interface AccountMap {
    [name: string]: PrivateAccount;
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

export async function createNewAccount(name: string) {
    const result = await newAccount(name);
    return result.private;
}

export async function newAccount(name: string) {
    const wallet = ethers.Wallet.createRandom();
    const newAccount = { name, address: wallet.address, privateKey: wallet.privateKey };
    const a = { name, address: wallet.address, publicKey: wallet.publicKey }
    await client().registerAccount(a);

    return {
        private: newAccount, public: a
    };
}

export function saveAccounts(accounts: AccountMap) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
