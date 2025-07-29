import { ethers } from 'ethers';
import { SignJWT, jwtVerify } from 'jose';

// Types
export interface KeyPair {
    privateKey: string;
    publicKey: string;
    did: string;
}

export interface Identity {
    did: string;
    name: string;
    keyPair: KeyPair;
    signer: ethers.Wallet;
}

export interface VLEIIssuer {
    did: string;
    signer: ethers.Wallet;
}

export interface VLEICredential {
    '@context': string[];
    type: string[];
    issuer: { id: string };
    issuanceDate: string;
    credentialSubject: {
        id: string;
        lei: string;
        entityName: string;
        role: string;
        entityDID: string;
    };
}

export interface VLEIVerificationResult {
    isValid: boolean;
    issuer?: string;
    subject?: string;
    lei?: string;
    entityName?: string;
    role?: string;
    entityDID?: string;
    issuanceDate?: string;
    error?: string;
}

/**
 * Generate a new cryptographic key pair and DID
 */
export function newKeyPair(): KeyPair {
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const publicKey = wallet.publicKey;
    const did = `did:ethr:${wallet.address}`;

    return {
        privateKey,
        publicKey,
        did
    };
}

/**
 * Create an identity with a key pair and metadata
 */
export function createIdentity(name: string, keyPair?: KeyPair): Identity {
    const pair = keyPair || newKeyPair();
    const signer = new ethers.Wallet(pair.privateKey);

    return {
        did: pair.did,
        name,
        keyPair: pair,
        signer
    };
}

/**
 * Create an issuer identity for vLEI credentials
 */
export function createIssuer(name: string, keyPair?: KeyPair): VLEIIssuer {
    const identity = createIdentity(name, keyPair);
    return {
        did: identity.did,
        signer: identity.signer
    };
}

/**
 * Create a vLEI credential
 */
export async function createVLEI(
    issuer: VLEIIssuer,
    representativeDID: string,
    legalEntityDID: string,
    lei: string,
    entityName: string,
    role: string
): Promise<string> {
    const credential: VLEICredential = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://www.gleif.org/vc/v1'
        ],
        type: ['VerifiableCredential', 'vLEICredential'],
        issuer: { id: issuer.did },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            id: representativeDID,
            lei,
            entityName,
            role,
            entityDID: legalEntityDID
        }
    };

    // Create JWT using the issuer's private key
    const privateKey = new TextEncoder().encode(issuer.signer.privateKey);
    const jwt = await new SignJWT({ vc: credential })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(issuer.did)
        .setSubject(representativeDID)
        .sign(privateKey);

    return jwt;
}

/**
 * Create a signer from a private key
 */
export function createSigner(privateKey: string): ethers.Wallet {
    return new ethers.Wallet(privateKey);
}

/**
 * Validate a vLEI credential
 */
export async function validateVLEI(
    vleiJwt: string,
    issuerPrivateKey?: string
): Promise<VLEIVerificationResult> {
    try {
        if (!issuerPrivateKey) {
            // For demo purposes, we'll just decode and validate the structure
            const [, payloadBase64] = vleiJwt.split('.');
            if (!payloadBase64) {
                return {
                    isValid: false,
                    error: 'Invalid JWT format'
                };
            }

            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
            const vc = payload.vc as VLEICredential;

            // Validate vLEI-specific fields
            if (!vc.credentialSubject.lei) {
                return {
                    isValid: false,
                    error: 'Missing LEI field'
                };
            }

            if (!vc.credentialSubject.entityName) {
                return {
                    isValid: false,
                    error: 'Missing entity name'
                };
            }

            if (!vc.credentialSubject.role) {
                return {
                    isValid: false,
                    error: 'Missing role field'
                };
            }

            if (!vc.credentialSubject.entityDID) {
                return {
                    isValid: false,
                    error: 'Missing entity DID'
                };
            }

            return {
                isValid: true,
                issuer: vc.issuer.id,
                subject: vc.credentialSubject.id,
                lei: vc.credentialSubject.lei,
                entityName: vc.credentialSubject.entityName,
                role: vc.credentialSubject.role,
                entityDID: vc.credentialSubject.entityDID,
                issuanceDate: vc.issuanceDate
            };
        }

        // Verify JWT signature if private key is provided
        const privateKey = new TextEncoder().encode(issuerPrivateKey);
        const { payload } = await jwtVerify(vleiJwt, privateKey);
        const vc = (payload as any).vc as VLEICredential;

        return {
            isValid: true,
            issuer: vc.issuer.id,
            subject: vc.credentialSubject.id,
            lei: vc.credentialSubject.lei,
            entityName: vc.credentialSubject.entityName,
            role: vc.credentialSubject.role,
            entityDID: vc.credentialSubject.entityDID,
            issuanceDate: vc.issuanceDate
        };
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown validation error'
        };
    }
}

/**
 * Verify that a representative has a specific role for an entity
 */
export async function verifyRepresentativeRole(
    representativeDID: string,
    entityDID: string,
    expectedRole: string,
    vleiJwt: string,
    issuerPrivateKey?: string
): Promise<boolean> {
    const validationResult = await validateVLEI(vleiJwt, issuerPrivateKey);

    if (!validationResult.isValid) {
        return false;
    }

    return (
        validationResult.subject === representativeDID &&
        validationResult.entityDID === entityDID &&
        validationResult.role === expectedRole
    );
}

/**
 * Generate a complete vLEI workflow for testing
 */
export async function generateVLEIWorkflow(
    issuerName: string,
    entityName: string,
    representativeName: string,
    lei: string,
    role: string
): Promise<{
    issuer: VLEIIssuer;
    entity: Identity;
    representative: Identity;
    vleiJwt: string;
}> {
    // Create identities
    const issuer = createIssuer(issuerName);
    const entity = createIdentity(entityName);
    const representative = createIdentity(representativeName);

    // Generate vLEI credential
    const vleiJwt = await createVLEI(
        issuer,
        representative.did,
        entity.did,
        lei,
        entityName,
        role
    );

    return {
        issuer,
        entity,
        representative,
        vleiJwt
    };
}
