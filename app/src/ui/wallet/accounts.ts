import { client } from "@/api/client";
import { ethers } from "ethers";
import { Account } from "@/api/accounts";
// export interface Account {
//     name: string;
//     address: string;
//     privateKey: string;
// }

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

export async function createNewAccount(name: string) {
    const wallet = ethers.Wallet.createRandom();
    const newAccount = { name, address: wallet.address, privateKey: wallet.privateKey };
    await client().registerAccount({ name, address: wallet.address, publicKey: wallet.publicKey });
    return newAccount;
}

export function saveAccounts(accounts: AccountMap) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
