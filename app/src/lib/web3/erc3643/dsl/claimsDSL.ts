import { PrivateAccount } from '@/ui/wallet/accounts';
import { encodeAddress, TrexSuite } from '../erc3643';
import { KeyPurpose } from '../keys';

export const claimsDSL = (claimIssuer: PrivateAccount) => {


    const addSigningKey = async (trex: TrexSuite, claimIssuerSigningKeyAddress: string) => {

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
        addSigningKey,
    }
}