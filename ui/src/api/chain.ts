import { treaty } from '@elysiajs/eden';
import { Elysia, Static, t } from 'elysia';

export const DeployRequestSchema = t.Object({
    contractType: t.UnionEnum(['ERC20', 'ERC3643'])
});
export type DeployRequest = Static<typeof DeployRequestSchema>;

export const DeployResponseSchema = t.Object({
    result: t.String(),
});
export type DeployResponse = Static<typeof DeployResponseSchema>;


export type ChainService = {
    deploy: (request: DeployRequest) => Promise<DeployResponse>;
}
export class ChainImpl implements ChainService {
    deploy(request: DeployRequest): Promise<DeployResponse> {
        console.log("ACTUALLY deploying", request);
        return Promise.resolve({ result: "deploying " + request.contractType })
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
    .get("/", ({ service }) => service.deploy({ contractType: "ERC20" }))
    .post(
        '/',
        async ({ body, service }: { body: DeployRequest, service: ChainService }) => service.deploy(body),
        {
            body: DeployRequestSchema,
            response: {
                200: DeployResponseSchema,
                400: t.Object({
                    error: t.String(),
                }),
            },
            detail: {
                tags: ["chain"],
                description: "Chain commands",
            },
        },
    );

