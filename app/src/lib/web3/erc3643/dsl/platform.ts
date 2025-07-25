import { PrivateAccount as Account, createNewAccount, newAccount, PrivateAccount } from '@/ui/wallet/accounts';
import { deployTrexSuite, newPersona, SetupAccounts, setupAccounts } from '@/lib/web3/erc3643/deploy';

export const platform = () => {

    /**
     * @param chainId the chain to deploy to 
     * @param accounts the roles used to deploy the platform
     * @returns the deployed platform
     */
    const deploy = async (chainId: string, accounts: SetupAccounts) => {

        const trex = await deployTrexSuite(chainId, accounts);
        console.log('trex', trex);

        return trex;
    }

    return {
        deploy,
    }
}