import { PrivateAccount } from '@/ui/wallet/accounts';
import { encodeAddress, getSigner, TrexSuite } from '../erc3643';
import { KeyPurpose } from '../keys';
import { ethers, id } from 'ethers';
import { ClaimTypes } from '../claims';

export const claimsSigningKeyDSL = (signingKey: PrivateAccount) => {


    const signClaim = async (chainId: string, userIdentityAddress: string, claimTopic: string, claimData: any) => {

        const claimIssuerSigningKey = await getSigner(signingKey, chainId)

        const abiByteString = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [userIdentityAddress, claimTopic, claimData]);
        const signature = await claimIssuerSigningKey.signMessage(
            ethers.getBytes(
                ethers.keccak256(
                    abiByteString,
                ),
            ),
        );
        return signature
    }

    const signKYCClaim = async (chainId: string, userIdentityAddress: string, claimData: any) => {
        return await signClaim(chainId, userIdentityAddress, id(ClaimTypes.KYC), claimData)
    }

    return {
        signKYCClaim,
    }
}