
/**
 * Forwards a JSON-RPC request to the local anvil instance using withAnvil.
 * @param body The JSON-RPC request body
 * @param initialState The initial state for withAnvil
 * @param options Additional options: method, subpath, path
 * @returns The response from anvil
 */
export async function chainProxyHandler(body: any, options: { method: string, subpath: string, path: string }) {
    const method = options.method;
    let url = 'http://127.0.0.1:8545';
    if (options.subpath) {
        url += '/' + options.subpath.replace(/^\/+/, '');
    }
    console.log(`  ANVIL >> ${method} ${url} with body ${JSON.stringify(body)}`);

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        return { error: 'Failed to proxy to anvil', status: res.status, text: await res.text() };
    }
    const response = await res.json();
    console.log(`  ANVIL << ${method} ${url} with body ${JSON.stringify(body)} returned ${JSON.stringify(response)}`);
    return response;
} 