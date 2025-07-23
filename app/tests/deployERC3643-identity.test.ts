import { ensureServerRunning, TEST_URL } from './testServer';
import { PrivateAccount as Account, createNewAccount } from '@/ui/wallet/accounts';
import { deployTrustedClaimIssuerRegistry } from '@/lib/web3/erc3643';

// @ts-expect-error Bun global
test('deploy an ERC3643 identity contract', async () => {

    const proc = await ensureServerRunning();

    const wallet = await createNewAccount('Test Account ' + new Date().getTime());

    const result = await deployTrustedClaimIssuerRegistry(wallet, 'test-chain-1');
    if ('error' in result) throw new Error(result.error);
    if (!result.contractAddress) throw new Error('No contract address returned');
    if (!result.chainId) throw new Error('No chainId returned');
    if (!result.issuerAddress) throw new Error('No issuer address returned');
}); 