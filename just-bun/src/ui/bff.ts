import { uuidv4 } from "@/lib/uuid";

export type State = {
    chains: {
        name: string;
        id: string,
        createdAt: number,
        contracts: {
            name: string;
            type: "erc20" | "erc3643";
            address: string;
            createdAt: number
        }[];
    }[];
}

export type BlockchainState = {
    chainId: string;
    evmState: any[];
}

// store evm chain state against a key of:
// index a state-<chain>-<contract-addr>:
// 

const chainKey = (chainId: string) => `evmstate-${chainId}`;

const stateForChain = (chainId: string) => {
    const state = localStorage.getItem(chainKey(chainId));
    return state ? JSON.parse(state) : {
        chainId,
        evmState: []
    };
}

export const contractStateForChain = (chainId: string, contractAddress: string) => {
    const state = stateForChain(chainId);
    return state.contracts.find(c => c.address === contractAddress);
}

export const evmStateForChain = (chainId: string) => {
    const evmChain = stateForChain(chainId).evmState
    if (evmChain.length === 0) {
        return undefined;
    }
    return evmChain[0];
}

export const contractForAddress = (chainId: string, contractAddress: string) => {
    const chain = chainForId(chainId);
    return chain ? chain.contracts.find(c => c.address === contractAddress) : undefined;
}

/**
 * TODO - take the SHA-256 of the previous state for a check
 * @param chainId 
 * @param newState 
 */
export const updateEvmStateForContract = (chainId: string, newState: any) => {
    const chainState = stateForChain(chainId);
    chainState.evmState.unshift(newState);
    localStorage.setItem(chainKey(chainId), JSON.stringify(chainState));
}

const state = (): State => {
    const stateStr = localStorage.getItem("state");
    return stateStr ? JSON.parse(stateStr) : { chains: [] };
};

const saveState = (state: State) => {
    localStorage.setItem("state", JSON.stringify(state));
};

const updateState = (updater: (state: State) => State) => {
    const st8 = state();
    const newState = updater(st8);
    saveState(newState);
};


export function onDeployContract(chainId: string, type: "erc20" | "erc3643", contractName: string, address: string) {
    const newContract = { name: contractName, type, address, createdAt: Date.now() }

    updateState(state => ({
        ...state,
        chains: state.chains.map(chain => chain.id === chainId ? { ...chain, contracts: [...chain.contracts, newContract] } : chain)
    }));
}

export function onAddChain(chainName: string) {
    const newChain = { name: chainName, id: uuidv4(), createdAt: Date.now(), contracts: [] };
    updateState(state => ({
        ...state,
        chains: [...state.chains, newChain]
    }));
}

export const listChains = () => state().chains

export function chainForId(id: string) {
    return state().chains.find(chain => chain.id === id) || undefined;
}

export function listContracts(chainId: string) {
    const chain = chainForId(chainId);
    return chain ? chain.contracts : [];
}