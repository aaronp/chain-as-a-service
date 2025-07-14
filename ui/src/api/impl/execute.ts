import { ExecuteRequest } from "../exec";
import path from "path";

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
    console.log(">>>>\n", cmd, args.join(" "), "\n");
    const dir = request.dir ? path.resolve(request.dir) : process.cwd();
    console.log("executing ", cmd, "w/", JSON.stringify(args), "in", dir, " (current dir is:", process.cwd(), ")");
    try {
        const proc = Bun.spawn([
            cmd,
            ...args
        ], {
            stdout: 'pipe',
            stderr: 'pipe',
            env: { ...request.env, ...process.env },
            cwd: dir
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