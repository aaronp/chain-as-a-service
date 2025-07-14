export type State = {
    chains: {
        name: string;
        id: string,
        createdAt: number,
        contracts: {
            name: string;
            address: string;
            createdAt: number;
        }[];
    }[];
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

export function onAddChain(chainName: string) {
    const newChain = { name: chainName, id: crypto.randomUUID(), createdAt: Date.now(), contracts: [] };
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