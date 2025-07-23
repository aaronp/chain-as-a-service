import { client } from '@/api/client';
import { ensureServerRunning, TEST_URL } from './testServer';
import { deployERC20 } from '@/lib/web3/web3';
import { PrivateAccount as Account, createNewAccount } from '@/ui/wallet/accounts';

// @ts-expect-error Bun global
test('deploy an ERC20 token on a chain', async () => {

    const proc = await ensureServerRunning();

    const deployOnChain = async (chainId: string) => {
        const wallet = await createNewAccount('Test Account ' + new Date().getTime());

        const result = await deployERC20(wallet, chainId, 'Test Token', 'TT', 1000000);
        if ('error' in result) throw new Error(result.error);
        if (!result.contractAddress) throw new Error('No contract address returned');
        if (!result.chainId) throw new Error('No chainId returned');
        if (!result.issuerAddress) throw new Error('No issuer address returned');
        if (!result.parameters.name) throw new Error('No name returned');
        if (!result.parameters.symbol) throw new Error('No symbol returned');
        return result.contractAddress;
    }

    try {

        // Create a random account for the chain creator
        const first = new Date().getTime();


        const chainOne = 'test-chain-' + first;
        const addrOne = await deployOnChain(chainOne);

        if (!(await client().listContracts()).find(c => c.contractAddress === addrOne)) {
            throw new Error('Contract not found');
        }

        const chainTwo = 'test-chain-' + (first + 1);
        const addrTwo = await deployOnChain(chainTwo);

        if (!(await client().listContracts()).find(c => c.contractAddress === addrTwo)) {
            throw new Error('Contract not found');
        }

    } finally {
        // if (proc) {
        //     proc.kill();
        // }
    }
}); 