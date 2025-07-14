import { Elysia, Static, t } from 'elysia';

export const DeployRequestSchema = t.Object({
    contractType: t.UnionEnum(['ERC20', 'ERC3643'])
});
export type DeployRequest = Static<typeof DeployRequestSchema>;

export const DeployResponseSchema = t.Object({
    result: t.String(),
});
export type DeployResponse = Static<typeof DeployResponseSchema>;


/**
 * The deploy business logic 
 * @param request The request to deploy
 * @returns 
 */
const deploy = async (request: DeployRequest) => {
    return { result: "deploying " + request.contractType }
}

export const context = new Elysia({ name: "chainContext" })
    .derive({ as: "global" }, ({ }) => {
        return { deploy };
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
    .get("/", () => deploy({ contractType: "ERC20" }))
    .post(
        '/',
        async ({ body }: { body: DeployRequest }) => deploy(body),
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

