import { treaty } from "@elysiajs/eden";
import { Api } from "./api";
import { Contract } from "./contracts";
import { Chain, StoredChain } from "./chains";
import { Account, StoredAccount, UpdateAccount } from "./accounts";
import { Account as AccountType } from "./accounts";
import { Message, StoredMessage, MessagesListResponse, CreateMessageResponse, MessageContent } from "./messages";
import { PrivateAccount } from "@/ui/wallet/accounts";

export class MessagesClient {
    constructor(private readonly url: string, private readonly account: PrivateAccount) { }

    async getAll(): Promise<StoredMessage[] | { error: string; data?: any }> {
        const client = treaty<Api>(this.url);
        const response = await client.api.messages.get({ headers: { address: this.account.address } });
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to fetch messages: ${response.status}`, data: response.data };
        }
        return response.data.messages;
    }

    async getUnread(): Promise<StoredMessage[] | { error: string; data?: any }> {
        const client = treaty<Api>(this.url);
        const response = await client.api.messages.unread.get({ headers: { address: this.account.address } });
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to fetch unread messages: ${response.status}`, data: response.data };
        }
        return response.data.messages;
    }

    async count(): Promise<{ total: number, unread: number } | { error: string; data?: any }> {
        const client = treaty<Api>(this.url);
        const response = await client.api.messages.count.get({ headers: { address: this.account.address } });
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to fetch message count: ${response.status}`, data: response.data };
        }
        return response.data;
    }

    async send(toAddress: string, msg: MessageContent): Promise<CreateMessageResponse | { error: string; data?: any }> {
        const message = {
            senderAddress: this.account.address,
            recipientAddress: toAddress,
            content: msg
        }
        const client = treaty<Api>(this.url);
        const response = await client.api.messages.post(message);
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to send message: ${response.status}`, data: response.data };
        }
        return response.data;
    }

    async markAsRead(messageId: string): Promise<StoredMessage | { error: string; data?: any }> {
        const client = treaty<Api>(this.url);
        const response = await client.api.messages["mark-read"]({ messageId }).post();
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to mark message as read: ${response.status}`, data: response.data };
        }
        return response.data;
    }

    async delete(messageId: string): Promise<{ success: boolean } | { error: string; data?: any }> {
        const client = treaty<Api>(this.url);
        const response = await client.api.messages({ messageId }).delete();
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to delete message: ${response.status}`, data: response.data };
        }
        return response.data;
    }
}

export class Client {

    constructor(private readonly url: string) {
    }

    messages = (account: PrivateAccount) => new MessagesClient(this.url, account);


    async registerChain(request: Chain) {
        const client = treaty<Api>(this.url);
        const response = await client.api.chains.post(request);
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to register chain: ${response.status}`, data: response.data };
        }
        return response.data

    }
    async listChains() {
        const client = treaty<Api>(this.url);
        const response = await client.api.chains.get();
        return response.data?.chains || [];
    }

    async chainForId(chainId: string): Promise<StoredChain | undefined> {
        const chains = await this.listChains();
        return chains.find(c => c.chainId === chainId) || undefined;
    }

    async listContracts() {
        const client = treaty<Api>(this.url);
        const response = await client.api.contracts.get();
        return response.data?.contracts || [];
    }


    async listContractsForChain(chainId: string) {
        const client = treaty<Api>(this.url);
        const response = await client.api.contracts.get();
        return response.data?.contracts.filter(c => c.chainId === chainId) || [];
    }

    async contractForAddress(chainId: string, contractAddress: string) {
        // const chain = chainForId(chainId);
        // return chain ? chain.contracts.find(c => c.address === contractAddress) : undefined;
        const client = treaty<Api>(this.url);

        // const header = await this.makeHeader(request);

        const response = await client.api.contracts.get();
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to create token: ${response.status}`, data: response.data };
        }
        return response.data.contracts.find(c => c.chainId === chainId && c.contractAddress === contractAddress);
    }

    async registerContract(request: Contract) {
        const client = treaty<Api>(this.url);

        // const header = await this.makeHeader(request);

        const response = await client.api.contracts.post(request);
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to create token: ${response.status}`, data: response.data };
        }
        return response.data;
    }

    // Account methods
    async listAccounts() {
        const client = treaty<Api>(this.url);
        const response = await client.api.accounts.get();
        return response.data?.accounts || [];
    }

    async registerAccount(request: Account) {
        const client = treaty<Api>(this.url);
        const response = await client.api.accounts.post(request);
        if (response.status !== 200 || !response.data) {
            return { error: `Failed to register account: ${response.status}`, data: response.data };
        }
        return response.data;
    }

    async updateAccount(name: string, updates: UpdateAccount) {
        const response = await fetch(`${this.url}/api/accounts/${encodeURIComponent(name)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { error: `Failed to update account: ${response.status}`, data: errorData };
        }

        return await response.json();
    }

    async getAccountByName(name: string): Promise<StoredAccount | undefined> {
        const accounts = await this.listAccounts();
        return accounts.find(a => a.name === name) || undefined;
    }
}

export const client = (url: string = window.location.origin): Client => {
    // const makeHeader = (request: any) => mkHeader(user, request)
    return new Client(url);
}