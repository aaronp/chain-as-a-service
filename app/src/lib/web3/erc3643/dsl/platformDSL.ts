import { PrivateAccount as Account, createNewAccount, newAccount, PrivateAccount } from '@/ui/wallet/accounts';
import { deployIdentityProxy, deployTrexSuite, newPersona, SetupAccounts, setupAccounts, UserToOnboard } from '@/lib/web3/erc3643/deploy';
import { TrexSuite } from '../erc3643';

export const platformDSL = (deployer: PrivateAccount) => {

    /**
     * @param chainId the chain to deploy to 
     * @param accounts the roles used to deploy the platform
     * @returns the deployed platform
     */
    const deploySuite = async (chainId: string, accounts: SetupAccounts) => {

        const trex = await deployTrexSuite(chainId, deployer, accounts);
        console.log('trex', trex);

        return trex;
    }

    return {
        deploySuite
    }
}