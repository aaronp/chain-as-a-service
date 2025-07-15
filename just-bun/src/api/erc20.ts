import { treaty } from '@elysiajs/eden';
import { Elysia, Static, t } from 'elysia';
import { deployContract } from './impl/deployContract';
import { ErrorResponseSchema } from './error';
import { getBalance } from './impl/getBalance';

export const GetBalanceRequestSchema = t.Object({
    previousState: t.Optional(t.Any({ description: "The EVM state at the time of deployment" })),
    address: t.String(),
});
export type GetBalanceRequest = Static<typeof GetBalanceRequestSchema>;

export const GetBalanceResponseSchema = t.Object({
    balance: t.Number(),
});
export type GetBalanceResponse = Static<typeof GetBalanceResponseSchema>;


export type ERC20Service = {
    balance: (request: GetBalanceRequest) => Promise<GetBalanceResponse | { error: string }>;
}
export class ERC20Impl implements ERC20Service {
    async balance(request: GetBalanceRequest): Promise<GetBalanceResponse | { error: string }> {
        return await getBalance(request);
    }
}

export const context = new Elysia({ name: "erc20Context" })
    .derive({ as: "global" }, ({ }) => {
        return { service: new ERC20Impl() };
    });


export const ERC20Routes = new Elysia({
    name: "ERC20",
    prefix: "/erc20",
    detail: {
        tags: ["erc20"],
        description:
            "ERC20 commands",
    },
}).use(context)
    .post(
        '/',
        async ({ body, service }: { body: GetBalanceRequest, service: ERC20Service }) => service.balance(body),
        {
            body: GetBalanceRequestSchema,
            response: {
                200: GetBalanceResponseSchema,
                400: ErrorResponseSchema,
            },
            detail: {
                tags: ["erc20"],
                description: "Interact with ERC20 contracts",
            },
        },
    );

