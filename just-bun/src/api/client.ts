import { treaty } from "@elysiajs/eden";
import { Api } from "./api";
import { Contract } from "./contracts";

export class Client {
    constructor(private readonly url: string) {
    }

    async register(request: Contract) {
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