import { Elysia, Static, t } from 'elysia';

// Contract schema for POST requests
export const ContractSchema = t.Object({
    chainId: t.String(), // chain id
    issuerAddress: t.String(), // issuer address
    contractAddress: t.String(), // contract address
    contractType: t.String(), // contract type (e.g. erc20)
    abi: t.String({ default: {}, description: "ABI for the contract" }),
    bytecode: t.String({ default: "", description: "Bytecode for the contract" }),
    parameters: t.Any({ default: {}, description: "Parameters for the contract" }),
});
export type Contract = Static<typeof ContractSchema>;

// Contract with created time for storage/response
export const StoredContractSchema = t.Object({
    chainId: t.String(), // chain id
    issuerAddress: t.String(), // issuer address
    contractAddress: t.String(), // contract address
    contractType: t.String(), // contract type (e.g. erc20)
    parameters: t.Any({ default: {}, description: "Parameters for the contract" }),
    abi: t.String({ default: {}, description: "ABI for the contract" }),
    bytecode: t.String({ default: "", description: "Bytecode for the contract" }),
    created: t.Number(), // timestamp (ms since epoch)
});
export type StoredContract = Static<typeof StoredContractSchema>;

// Response for GET /contracts
export const ContractsListResponseSchema = t.Object({
    contracts: t.Array(StoredContractSchema),
});
export type ContractsListResponse = Static<typeof ContractsListResponseSchema>;

const normaliseContractType = (type: string) => type.toUpperCase().replace(/[^A-Z0-9]/g, '')

const asStoredContract = (contract: Contract): StoredContract => {
    const c = contract;
    c.contractType = normaliseContractType(c.contractType);
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
        list(type?: string, chain?: string) {
            const normalisedType = type ? normaliseContractType(type) : undefined;
            return contracts.filter(c => {
                let typeMatch = true;
                let chainMatch = true;
                if (normalisedType) {
                    typeMatch = c.contractType === normalisedType;
                }
                if (chain) {
                    chainMatch = c.chainId === chain;
                }
                return typeMatch && chainMatch;
            });
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
    .get('/', ({ store, query }) => {
        const { type, chain } = query;
        return { contracts: store.registry.list(type, chain) };
    }, {
        query: t.Object({
            type: t.Optional(t.String({ description: "Contract type (e.g. ERC20)" })),
            chain: t.Optional(t.String({ description: "Chain ID" })),
        }),
        response: { 200: ContractsListResponseSchema },
        detail: {
            tags: ['contracts'],
            description: 'Query contracts',
        },
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
