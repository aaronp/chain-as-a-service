import { ethers } from "ethers";
import { createVerifiableCredentialJwt, type JwtCredentialPayload } from "did-jwt-vc";
import { importJWK, jwtVerify, type JWTPayload } from "jose";

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

export const newVLEIDiD = (lei: string = crypto.randomUUID()): string => `did:vlei:${lei}`;
export const newEthrDiD = (address: string): string => `did:ethr:${address}`;
export const newWebDiD = (domain: string): string => `did:web:${domain}`;


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
    publicKeyHex: string // compressed or uncompressed secp256k1 public key in hex
): Promise<JWTPayload> {
    // Convert the hex public key to a JWK for jose
    const publicKeyBuffer = ethers.getBytes(publicKeyHex);
    const ecPublicKeyJWK = {
        kty: "EC",
        crv: "secp256k1",
        x: "",
        y: "",
    };

    // Parse x and y from public key (assuming uncompressed 0x04 + x + y)
    if (publicKeyBuffer[0] === 0x04 && publicKeyBuffer.length === 65) {
        const x = publicKeyBuffer.slice(1, 33);
        const y = publicKeyBuffer.slice(33, 65);

        ecPublicKeyJWK.x = Buffer.from(x).toString("base64url");
        ecPublicKeyJWK.y = Buffer.from(y).toString("base64url");
    } else {
        throw new Error("Only uncompressed public keys are supported");
    }

    const key = await importJWK(ecPublicKeyJWK, "ES256K");

    const { payload } = await jwtVerify(jwt, key);
    return payload;
}

