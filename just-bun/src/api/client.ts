import { treaty } from "@elysiajs/eden";
import { DeployRequest, DeployResponse, ChainService } from "./chain";
import { Api } from "./api";

export class Client implements ChainService {
    constructor(private readonly url: string) {
    }

    async erc20() {
        const client = treaty<Api>(this.url);
        const result = await client.api.erc20.get();
        return result.data!;
    }
    async deploy(request: DeployRequest): Promise<DeployResponse> {
        const client = treaty<Api>(this.url);
        console.log("deploying", request, "to", this.url);
        const response = await client.api.chain.post(request);
        if (response.status !== 200 || !response.data) {
            throw new Error(`Failed to deploy: ${response.status}`);
        }
        return response.data!;
    }

    // async create(request: BFFCreateTokenRequest): Promise<Try<BFFCreateTokenResponse>> {
    //     const client = treaty<NanoApi>(this.url);

    //     const header = await this.makeHeader(request);

    //     const response = await client.bff.token.post(request, { headers: header });
    //     if (response.status !== 200 || !response.data) {
    //         return fail(`Failed to create token: ${response.status}`);
    //     }
    //     return success(response.data);
    // }
}

export const client = (url: string = window.location.origin): Client => {
    // const makeHeader = (request: any) => mkHeader(user, request)
    return new Client(url);
}