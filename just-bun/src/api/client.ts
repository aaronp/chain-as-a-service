
export class Client {
    constructor(private readonly url: string) {
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