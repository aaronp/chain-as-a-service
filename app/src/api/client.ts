import { treaty } from "@elysiajs/eden";
import { Api } from "./api";
import { Contract } from "./contracts";
import { Chain, StoredChain } from "./chains";

export class Client {

    constructor(private readonly url: string) {
    }

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
}

export const client = (url: string = window.location.origin): Client => {
    // const makeHeader = (request: any) => mkHeader(user, request)
    return new Client(url);
}