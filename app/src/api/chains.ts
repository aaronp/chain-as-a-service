import { Elysia, Static, t } from 'elysia';

// Chain schema for POST requests
export const ChainSchema = t.Object({
    name: t.String(), // chain name
    creatorAddress: t.String(), // creator address
});
export type Chain = Static<typeof ChainSchema>;

// Stored chain with created time and chainId
export const StoredChainSchema = t.Intersect([
    ChainSchema,
    t.Object({
        created: t.Number(), // timestamp (ms since epoch)
        chainId: t.String(), // unique chain id
    })
]);
export type StoredChain = Static<typeof StoredChainSchema>;

// Response for GET /chains
export const ChainsListResponseSchema = t.Object({
    chains: t.Array(StoredChainSchema),
});
export type ChainsListResponse = Static<typeof ChainsListResponseSchema>;

// Generate a simple unique chainId (could be improved)
function makeChainId(name: string, creatorAddress: string): string {
    // Simple hash: name + creatorAddress + timestamp
    return (
        name + ':' + creatorAddress + ':' + Date.now()
    ).split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString(16);
}

// In-memory chain registry store
export function makeChainRegistryStore() {
    const chains: StoredChain[] = [];
    return {
        add(chain: Chain) {
            if (chains.some(c => c.name === chain.name)) {
                return null; // duplicate name
            }
            const stored: StoredChain = {
                ...chain,
                created: Date.now(),
                chainId: makeChainId(chain.name, chain.creatorAddress),
            };
            chains.push(stored);
            return stored;
        },
        list() {
            return chains;
        },
        getByName(name: string) {
            return chains.find(c => c.name === name);
        }
    };
}

export const chainContext = new Elysia({ name: 'chainContext' })
    .state('chainRegistry', makeChainRegistryStore());

export const chainRoutes = new Elysia({
    name: 'Chains',
    prefix: '/chains',
    detail: {
        tags: ['chains'],
        description: 'Chain registry',
    },
})
    .use(chainContext)
    // List chains
    .get('/', ({ store }) => {
        return { chains: store.chainRegistry.list() };
    }, {
        response: { 200: ChainsListResponseSchema },
    })
    // Add a chain
    .post('/', ({ body, store }) => {
        const stored = store.chainRegistry.add(body);
        if (!stored) {
            return new Response(JSON.stringify({ error: 'Chain name already exists' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return stored;
    }, {
        body: ChainSchema,
        response: { 200: StoredChainSchema },
        detail: {
            tags: ['chains'],
            description: 'Register a new chain',
        },
    });
