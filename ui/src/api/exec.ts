import { Elysia, Static, t } from 'elysia';
import { execute } from './impl/execute';

export const ExecuteRequestSchema = t.Object({
    commandLine: t.String(),
    timeout: t.Optional(t.Number()),
    env: t.Optional(t.Record(t.String(), t.String())),
});
export type ExecuteRequest = Static<typeof ExecuteRequestSchema>;

export const ExecuteResponseSchema = t.Object({
    stdout: t.String(),
    stderr: t.String(),
    code: t.Number(),
});
export type ExecuteResponse = Static<typeof ExecuteResponseSchema>;



export const execContext = new Elysia({ name: "execContext" })
    .derive({ as: "global" }, ({ }) => {
        return { exec: execute };
    });


export const execRoute = new Elysia({
    name: "Execute",
    prefix: "/exec",
    detail: {
        tags: ["exec"],
        description:
            "Execute commands",
    },
}).use(execContext)
    .get("/", ({ exec }) => exec({ commandLine: "pwd", timeout: 10000 }))
    .post(
        '/',
        async ({ body, exec }: { body: ExecuteRequest, exec: (request: ExecuteRequest) => Promise<ExecuteResponse> }) => exec(body),
        {
            body: ExecuteRequestSchema,
            response: {
                200: ExecuteResponseSchema,
                400: t.Object({
                    error: t.String(),
                }),
            },
            detail: {
                tags: ["exec"],
                description: "Execute commands",
            },
        },
    );

