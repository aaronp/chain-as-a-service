import { treaty } from '@elysiajs/eden';
import { Elysia, Static, t } from 'elysia';
import { deployContract } from './impl/deployContract';
import { ErrorResponseSchema } from './error';
import { getBalance } from './impl/getBalance';
import { erc20Template } from './impl/erc20Template';

/**
 * Get the balance of an ERC20 contract
 */
export const GetBalanceRequestSchema = t.Object({
    previousState: t.Optional(t.Any({ description: "The EVM state at the time of deployment" })),
    address: t.String(),
});
export type GetBalanceRequest = Static<typeof GetBalanceRequestSchema>;

export const GetBalanceResponseSchema = t.Object({
    balance: t.Number(),
});
export type GetBalanceResponse = Static<typeof GetBalanceResponseSchema>;

/**
 * Get the template for an ERC20 contract
 */
export const GetTemplateResponseSchema = t.Object({
    abi: t.Any(),
    bytecode: t.String({ description: "The bytecode of the ERC20 contract" }),
});
export type GetTemplateResponse = Static<typeof GetTemplateResponseSchema>;

/**
 * Service API
 */

export type ERC20Service = {
    balance: (request: GetBalanceRequest) => Promise<GetBalanceResponse | { error: string }>;
    template: () => Promise<GetTemplateResponse | { error: string }>;
}
export class ERC20Impl implements ERC20Service {
    async balance(request: GetBalanceRequest): Promise<GetBalanceResponse | { error: string }> {
        const { result } = await getBalance(request);
        return result;
    }
    async template(): Promise<GetTemplateResponse | { error: string }> {
        return await erc20Template();
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
    .get('/', async ({ service }: { service: ERC20Service }) => {
        const result = await service.template();
        return result;
    },
        {
            response: {
                200: GetTemplateResponseSchema,
                400: ErrorResponseSchema,
            },
            detail: {
                tags: ["erc20"],
                description: "Get the template for an ERC20 contract",
            },
        })
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

