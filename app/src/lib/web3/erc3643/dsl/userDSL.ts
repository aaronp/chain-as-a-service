import { PrivateAccount } from '@/ui/wallet/accounts';
import { encodeAddress, TrexSuite } from '../erc3643';
import { KeyPurpose, KeyType } from '../keys';
import { getIdentityContract } from '../deploy';
import { ClaimData } from '../claims';

export const userDSL = (userAccount: PrivateAccount) => {

    const addSignedClaim = async (chainId: string, userIdentityAddress: string, claimData: ClaimData) => {
        const userIdentity = await getIdentityContract(userIdentityAddress, chainId, userAccount);
        return await userIdentity.addClaim(claimData.topic, claimData.scheme, claimData.issuer, claimData.signature, claimData.data, '');

        // const aliceAddClaimResult = await (await userIdentity.getContract(userPersona.personalAccount))
        //   .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, '');

    }

    const registerActionAccount = async (chainId: string, userIdentityAddress: string, actionAccountAddress: string) => {
        const userIdentity = await getIdentityContract(userIdentityAddress, chainId, userAccount);
        return await userIdentity.addKey(encodeAddress(actionAccountAddress), KeyPurpose.execution, KeyType.ECDSA);
    }


    return {
        registerActionAccount,
        addSignedClaim
    }
}