import { ethers } from "ethers";
import { createVerifiableCredentialJwt, type JwtCredentialPayload } from "did-jwt-vc";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// ---------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------

export type KeyPair = {
    privateKey: string;
    publicKey: string;
    address: string;
};

export type Issuer = {
    did: string;
    signer: KeyPair;
    alg: string;
};


// ---------------------------------------------
// STEP 1: Generate Key Pair
// ---------------------------------------------

export function generateKeypair(): KeyPair {
    const wallet = ethers.Wallet.createRandom();
    return {
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        address: wallet.address,
    };
}

// ---------------------------------------------
// STEP 2: Create DID
// ---------------------------------------------

export const newDiD = (): string => `did:vlei:${crypto.randomUUID()}`;

// ---------------------------------------------
// STEP 3: Create Issuer
// ---------------------------------------------

export function createIssuer(did: string, signer: KeyPair): Issuer {
    return {
        did,
        signer,
        alg: "ES256K", // ECDSA over secp256k1 (used by ethers wallets)
    };
}

// ---------------------------------------------
// STEP 4: Build vLEI Credential Payload
// ---------------------------------------------

export function buildVLEIPayload(
    subjectDid: string,
    issuerDid: string,
    role: string,
    legalName: string,
    lei: string
): JwtCredentialPayload {
    return {
        sub: subjectDid,
        nbf: Math.floor(Date.now() / 1000),
        vc: {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential", "LegalEntityvLEI"],
            credentialSubject: {
                id: subjectDid,
                lei,
                legalName,
                role,
                represents: issuerDid,
            },
        },
    };
}

// ---------------------------------------------
// STEP 5: Sign Credential (vLEI Issuance)
// ---------------------------------------------

export async function signCredential(
    payload: JwtCredentialPayload,
    issuer: Issuer
): Promise<string> {
    const wallet = new ethers.Wallet(issuer.signer.privateKey);
    const signerFn = async (data: string | Uint8Array): Promise<string> => {
        const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        const sig = await wallet.signMessage(dataBytes);
        return sig;
    };

    const issuedJwt = await createVerifiableCredentialJwt(payload, {
        did: issuer.did,
        signer: signerFn,
        alg: issuer.alg,
    });

    return issuedJwt;
}

// ---------------------------------------------
// STEP 6: Verify Credential
// ---------------------------------------------

export async function verifyCredential(
    jwt: string,
    publicKeyHex: string
): Promise<JWTPayload> {
    const publicKey = await ethers.computePublicKey(publicKeyHex, true);

    const result = await jwtVerify(jwt, async (header, token) => {
        const recoveredAddress = ethers.verifyMessage(token.payload.iss || '', jwt);
        const pubKey = ethers.computePublicKey(recoveredAddress, true);
        return ethers.recoverPublicKey(ethers.hashMessage(jwt), jwt);
    });

    return result.payload;
} 
