import { ensureServerRunning, TEST_URL } from './testServer';
import { PrivateAccount as Account, createNewAccount } from '@/ui/wallet/accounts';
import { deployTREXFactory } from '@/lib/web3/erc3643';

// @ts-expect-error Bun global
test('deploy an ERC3643 identity contract', async () => {

    const proc = await ensureServerRunning();

    const wallet = await createNewAccount('Test Account ' + new Date().getTime());

    const result = await deployTREXFactory(wallet, 'test-chain-1');
    // TODO


}); 