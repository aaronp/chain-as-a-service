import { ExecuteRequest } from "../exec";

/**
 * The execute business logic 
 * @param request The request to execute
 * @returns 
 */
export const execute = async (request: ExecuteRequest) => {
    const { commandLine, timeout } = request;

    const [cmd, ...allArgs] = commandLine.split(' ');
    const args = allArgs.filter(arg => arg.trim() !== "").map(arg => arg.replace(/\n/g, ''));
    let stdout = '', stderr = '', code = null;
    console.log("executing ", cmd, "w/", args.length, "args:");
    for (const [i, arg] of args.entries()) {
        console.log(i, " :", arg);
    }
    console.log("WHOLE LINE:", JSON.stringify(args));
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