import { Elysia, Static, t } from 'elysia';

export const DeployRequestSchema = t.Object({
    contractType: t.String()
});
export type DeployRequest = Static<typeof DeployRequestSchema>;

export const DeployResponseSchema = t.Object({
    stdout: t.String(),
    stderr: t.String(),
    code: t.Number(),
});
export type DeployResponse = Static<typeof DeployResponseSchema>;


/**
 * The deploy business logic 
 * @param request The request to deploy
 * @returns 
 */
const exec = async (request: DeployRequest) => {
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
    name: "Deploy",
    prefix: "/exec",
    detail: {
        tags: ["exec"],
        description:
            "Deploy commands",
    },
}).use(execContext)
    .get("/", () => exec({ commandLine: "pwd", timeout: 10000 }))
    .post(
        '/',
        async ({ body }: { body: DeployRequest }) => exec(body),
        {
            body: DeployRequestSchema,
            response: {
                200: DeployResponseSchema,
                400: t.Object({
                    error: t.String(),
                }),
            },
            detail: {
                tags: ["exec"],
                description: "Deploy commands",
            },
        },
    );

