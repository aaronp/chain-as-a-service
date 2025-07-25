import { id, ethers } from "ethers";



export const ClaimTypes = {
    KYC: 'CLAIM_TOPIC'
}


const textAsHex = (text: string) => ethers.hexlify(ethers.toUtf8Bytes(text))



export type ClaimData = {
    data: string;
    issuer: string;
    topic: string;
    scheme: number;
    identity: string;
    signature: string;
};

export const createKYCClaim = (userIdentityAddress: string, claimIssuerAddress: string, userClaim: string): ClaimData => {
    return {
        data: textAsHex(userClaim),
        issuer: claimIssuerAddress,
        topic: id(ClaimTypes.KYC),
        scheme: 1,
        identity: userIdentityAddress,
        signature: '',
    };
}