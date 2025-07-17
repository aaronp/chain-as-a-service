import { Elysia, Static, t } from 'elysia';

// Contract schema for POST requests
export const ContractSchema = t.Object({
    chainId: t.String(), // chain id
    issuerAddress: t.String(), // issuer address
    contractAddress: t.String(), // contract address
    contractType: t.String(), // contract type (e.g. erc20)
    name: t.String(),
    symbol: t.String(),
});
export type Contract = Static<typeof ContractSchema>;

// Contract with created time for storage/response
export const StoredContractSchema = t.Intersect([
    ContractSchema,
    t.Object({
        created: t.Number(), // timestamp (ms since epoch)
    })
]);
export type StoredContract = Static<typeof StoredContractSchema>;

// Response for GET /contracts
export const ContractsListResponseSchema = t.Object({
    contracts: t.Array(StoredContractSchema),
});
export type ContractsListResponse = Static<typeof ContractsListResponseSchema>;


const asStoredContract = (contract: Contract): StoredContract => {
    const c = contract;
    c.contractType = c.contractType.toUpperCase().replace(/[^A-Z0-9]/g, '')
    return {
        ...c,
        created: Date.now(),
    };
}
// In-memory contract registry store
export function makeRegistryStore() {
    const contracts: StoredContract[] = [];
    return {
        add(contract: Contract) {
            const stored: StoredContract = asStoredContract(contract);
            contracts.push(stored);
            return stored;
        },
        list() {
            return contracts;
        },
    };
}


export const contractContext = new Elysia({ name: 'contractContext' })
    .state('registry', makeRegistryStore());

export const contractRoutes = new Elysia({
    name: 'Contracts',
    prefix: '/contracts',
    detail: {
        tags: ['contracts'],
        description: 'Contract registry',
    },
})
    .use(contractContext)
    // List contracts
    .get('/', ({ store }) => {
        return { contracts: store.registry.list() };
    }, {
        response: { 200: ContractsListResponseSchema },
    })
    // Add a contract
    .post('/', ({ body, store }) => {
        const stored = store.registry.add(body);
        return stored;
    }, {
        body: ContractSchema,
        response: { 200: StoredContractSchema },
        detail: {
            tags: ['contracts'],
            description: 'Register a new contract',
        },
    });
