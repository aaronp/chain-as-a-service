import { ensureServerRunning, TEST_URL } from './testServer';
import { deployERC20 } from '@/lib/web3/web3';
import { PrivateAccount as Account, createNewAccount } from '@/ui/wallet/accounts';

// @ts-expect-error Bun global
test('deploy an ERC20 token on a chain', async () => {

    const proc = await ensureServerRunning();

    try {

        // Create a random account for the chain creator
        const wallet = await createNewAccount('Test Account ' + new Date().getTime());
        const chainId = 'test-chain-' + new Date().getTime();

        const result = await deployERC20(wallet, chainId, 'Test Token', 'TT', 1000000);
        if ('error' in result) throw new Error(result.error);
        if (!result.contractAddress) throw new Error('No contract address returned');
        if (!result.chainId) throw new Error('No chainId returned');
        if (!result.issuerAddress) throw new Error('No issuer address returned');
        if (!result.name) throw new Error('No name returned');
        if (!result.symbol) throw new Error('No symbol returned');
        // Register the chain

    } finally {
        // if (proc) {
        //     proc.kill();
        // }
    }
}); 