import { PrivateAccount as Account, createNewAccount, newAccount, PrivateAccount } from '@/ui/wallet/accounts';
import { deployTrexSuite, newPersona, SetupAccounts, setupAccounts } from '@/lib/web3/erc3643/deploy';
import { encodeAddress, TrexSuite } from '../erc3643';

const KeyPurpose = {
    management: 1,
    execution: 2,
    signing: 3,
}

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

    /**
 * @param chainId the chain to deploy to 
 * @param accounts the roles used to deploy the platform
 * @returns the deployed platform
 */
    const addSigningKey = async (trex: TrexSuite, claimIssuer: PrivateAccount, claimIssuerSigningKeyAddress: string) => {

        const contract = await trex.suite.claimIssuerContract.getContract(claimIssuer);

        const key = encodeAddress(claimIssuerSigningKeyAddress);

        const purpose = KeyPurpose.signing;

        // Check if the key already exists for this purpose
        const keyExists = await contract.keyHasPurpose(key, purpose);

        if (!keyExists) {
            console.log('Adding key', key, 'for purpose', purpose);
            // Only add the key if it doesn't already exist
            await contract.addKey(key, purpose, 1);
            return true;
        } else {
            console.log('Key already exists for purpose', purpose);
            return false;
        }
    }


    return {
        deploy,
        addSigningKey,
    }
}