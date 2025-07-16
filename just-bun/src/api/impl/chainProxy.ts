import { withAnvil } from './anvil';

/**
 * Forwards a JSON-RPC request to the local anvil instance using withAnvil.
 * @param body The JSON-RPC request body
 * @param initialState The initial state for withAnvil
 * @param options Additional options: method, subpath, path
 * @returns The response from anvil
 */
export async function chainProxyHandler(body: any, initialState?: any, options?: { method?: string, subpath?: string, path?: string }) {
    const method = options?.method || 'POST';
    let url = 'http://127.0.0.1:8545';
    if (options?.subpath) {
        url += '/' + options.subpath.replace(/^\/+/, '');
    }
    // Use withAnvil to ensure anvil is running, then forward the request
    return withAnvil(initialState, async () => {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            return { error: 'Failed to proxy to anvil', status: res.status, text: await res.text() };
        }
        return await res.json();
    });
} 