import { treaty } from '@elysiajs/eden';
import { Elysia, Static, t } from 'elysia';
import { deployContract } from './impl/deployContract';
import { ErrorResponseSchema } from './error';

export const DeployRequestSchema = t.Object({
    contractType: t.UnionEnum(['ERC20', 'ERC3643']),
    name: t.String(),
    symbol: t.String(),
    decimals: t.Number(),
});
export type DeployRequest = Static<typeof DeployRequestSchema>;

export const DeployResponseSchema = t.Object({
    contractAddress: t.String(),
    txHash: t.String(),
    deployerAddress: t.String(),
    state: t.Any({ description: "The EVM state at the time of deployment" })
});
export type DeployResponse = Static<typeof DeployResponseSchema>;


export type ChainService = {
    deploy: (request: DeployRequest) => Promise<DeployResponse | { error: string }>;
}
export class ChainImpl implements ChainService {
    deploy(request: DeployRequest): Promise<DeployResponse | { error: string }> {
        return deployContract(request);
    }
}

export const context = new Elysia({ name: "chainContext" })
    .derive({ as: "global" }, ({ }) => {
        return { service: new ChainImpl() };
    });


export const chainRoutes = new Elysia({
    name: "Chain",
    prefix: "/chain",
    detail: {
        tags: ["chain"],
        description:
            "Chain commands",
    },
}).use(context)
    .post(
        '/',
        async ({ body, service }: { body: DeployRequest, service: ChainService }) => service.deploy(body),
        {
            body: DeployRequestSchema,
            response: {
                200: DeployResponseSchema,
                400: ErrorResponseSchema,
            },
            detail: {
                tags: ["chain"],
                description: "Deploy a new contract to a chain",
            },
        },
    );

