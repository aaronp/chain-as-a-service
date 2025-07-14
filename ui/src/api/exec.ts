import { Elysia, Static, t } from 'elysia';

export const ExecuteRequestSchema = t.Object({
    commandLine: t.String(),
    timeout: t.Optional(t.Number()),
});
export type ExecuteRequest = Static<typeof ExecuteRequestSchema>;

export const ExecuteResponseSchema = t.Object({
    stdout: t.String(),
    stderr: t.String(),
    code: t.Number(),
});
export type ExecuteResponse = Static<typeof ExecuteResponseSchema>;


/**
 * The execute business logic 
 * @param request The request to execute
 * @returns 
 */
const exec = async (request: ExecuteRequest) => {
    const { commandLine, timeout } = request;
    console.log("executing ", request);
    const [cmd, ...args] = commandLine.split(' ');
    let stdout = '', stderr = '', code = null;
    try {
        const proc = Bun.spawn([
            cmd,
            ...args
        ], {
            stdout: 'pipe',
            stderr: 'pipe',
        });
        const timer = setTimeout(() => proc.kill(), timeout);
        stdout = await new Response(proc.stdout).text();
        stderr = await new Response(proc.stderr).text();
        code = await proc.exited;
        clearTimeout(timer);
    } catch (e: any) {
        stderr = String(e);
        code = -1;
    }
    return { stdout, stderr, code };
}

export const execContext = new Elysia({ name: "execContext" })
    .derive({ as: "global" }, ({ }) => {
        return { exec };
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
    .get("/", () => exec({ commandLine: "pwd", timeout: 10000 }))
    .post(
        '/',
        async ({ body }: { body: ExecuteRequest }) => exec(body),
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

