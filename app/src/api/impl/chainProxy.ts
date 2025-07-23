
/**
 * Forwards a JSON-RPC request to the local anvil instance using withAnvil.
 * @param port The port to use for the local anvil instance
 * @param body The JSON-RPC request body
 * @param options Additional options: method, subpath, path
 * @returns The response from anvil
 */
export async function chainProxyHandler(port: number, body: any, options: { method: string, subpath: string, path: string }) {
    const method = options.method;
    let url = `http://127.0.0.1:${port}`;
    if (options.subpath) {
        url += '/' + options.subpath.replace(/^\/+/, '');
    }
    console.log(`  ANVIL >> ${method} ${url} `);

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        return { error: 'Failed to proxy to anvil', status: res.status, text: await res.text() };
    }
    const response = await res.json();
    console.log(`  ANVIL << ${method} ${url}`);
    return response;
} 