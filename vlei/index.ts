import {
    createVerifiableCredentialJwt,
    verifyCredential
} from 'did-jwt-vc'
import type { JwtCredentialPayload } from 'did-jwt-vc'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { ES256KSigner } from 'did-jwt'
import { jwtVerify, importJWK } from 'jose'

// Types for vLEI credentials
export interface VLEICredentialSubject {
    id: string // DID of the representative
    lei: string // Legal Entity Identifier
    entityName: string // Name of the legal entity
    role: string // Role of the representative (e.g., "CFO", "CEO")
    entityDID: string // DID of the legal entity
}

export interface VLEICredentialPayload {
    sub: string
    vc: {
        '@context': string[]
        type: string[]
        issuer: { id: string }
        issuanceDate: string
        credentialSubject: VLEICredentialSubject
    }
}

export interface VLEIIssuer {
    did: string
    signer: any // ES256KSigner
}

export interface VLEIVerificationResult {
    isValid: boolean
    credential?: any
    error?: string
}

/**
 * Creates a vLEI credential for a representative of a legal entity
 * 
 * 
 * Individual Person (Representative)
 * ├── DID: did:ethr:0xabcdef... (John Smith's personal DID)
 * ├── Role: "CFO" 
 * └── Represents: Legal Entity
 *     ├── DID: did:ethr:0xfedcba... (ACME Corp's DID)
 *     ├── LEI: 529900WXKG14MWNYUQ33
 *     └── Name: "ACME Corporation"
 *
 * 
 * @param issuer - The issuer with DID and signer
 * @param representativeDID - DID of the representative
 * @param legalEntityDID - DID of the legal entity
 * @param lei - Legal Entity Identifier
 * @param entityName - Name of the legal entity
 * @param role - Role of the representative
 * @returns JWT string of the vLEI credential
 */
export async function createVLEI(
    issuer: VLEIIssuer,
    representativeDID: string,
    legalEntityDID: string,
    lei: string,
    entityName: string,
    role: string
): Promise<string> {
    const vleiPayload: VLEICredentialPayload = {
        sub: representativeDID,
        vc: {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://www.gleif.org/vc/v1'
            ],
            type: ['VerifiableCredential', 'vLEICredential'],
            issuer: {
                id: issuer.did
            },
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: representativeDID,
                lei,
                entityName,
                role,
                entityDID: legalEntityDID
            }
        }
    }

    return await createVerifiableCredentialJwt(vleiPayload, issuer)
}

/**
 * Validates a vLEI credential using on-chain DID resolution
 * @param vleiJwt - The JWT string of the vLEI credential
 * @param resolver - DID resolver for verification
 * @returns Verification result with validation status
 */
export async function validateVLEI(
    vleiJwt: string,
    resolver: Resolver
): Promise<VLEIVerificationResult> {
    try {
        const verifiedCredential = await verifyCredential(vleiJwt, resolver)

        // Additional vLEI-specific validation
        const credential = verifiedCredential.verifiableCredential
        if (!credential.type.includes('vLEICredential')) {
            return {
                isValid: false,
                error: 'Credential is not a vLEI credential'
            }
        }

        const subject = credential.credentialSubject
        if (!subject.lei || !subject.entityName || !subject.role || !subject.entityDID) {
            return {
                isValid: false,
                error: 'Missing required vLEI credential fields'
            }
        }

        return {
            isValid: true,
            credential: verifiedCredential
        }
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown verification error'
        }
    }
}

/**
 * Validates a vLEI credential using JWT verification only (no on-chain resolution)
 * This is useful for testing and scenarios where you don't need full DID resolution
 * @param vleiJwt - The JWT string of the vLEI credential
 * @param issuerPublicKey - The issuer's public key in hex format
 * @returns Verification result with validation status
 */
export async function validateVLEIJWT(
    vleiJwt: string,
    issuerPublicKey: string
): Promise<VLEIVerificationResult> {
    try {
        // Convert hex public key to JWK format
        const publicKeyBuffer = new Uint8Array(
            issuerPublicKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        )

        const ecPublicKeyJWK = {
            kty: "EC",
            crv: "secp256k1",
            x: "",
            y: "",
        }

        // Parse x and y from public key (assuming uncompressed 0x04 + x + y)
        if (publicKeyBuffer[0] === 0x04 && publicKeyBuffer.length === 65) {
            const x = publicKeyBuffer.slice(1, 33)
            const y = publicKeyBuffer.slice(33, 65)

            ecPublicKeyJWK.x = Buffer.from(x).toString("base64url")
            ecPublicKeyJWK.y = Buffer.from(y).toString("base64url")
        } else {
            return {
                isValid: false,
                error: 'Only uncompressed public keys are supported'
            }
        }

        // Import the JWK and verify the JWT
        const key = await importJWK(ecPublicKeyJWK, "ES256K")
        const { payload } = await jwtVerify(vleiJwt, key)

        // Validate vLEI-specific fields
        const vc = payload.vc as any
        if (!vc || !vc.type || !vc.type.includes('vLEICredential')) {
            return {
                isValid: false,
                error: 'Credential is not a vLEI credential'
            }
        }

        const subject = vc.credentialSubject
        if (!subject || !subject.lei || !subject.entityName || !subject.role || !subject.entityDID) {
            return {
                isValid: false,
                error: 'Missing required vLEI credential fields'
            }
        }

        return {
            isValid: true,
            credential: {
                payload,
                verifiableCredential: payload.vc
            }
        }
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown verification error'
        }
    }
}

/**
 * Creates a DID resolver for Ethereum-based DIDs
 * @param rpcUrl - Ethereum RPC URL
 * @param registry - DID registry address
 * @returns Configured resolver
 */
export function createResolver(rpcUrl: string, registry: string): Resolver {
    const providerConfig = {
        rpcUrl,
        registry
    }
    return new Resolver(getResolver(providerConfig))
}

/**
 * Creates a signer for DID operations
 * @param privateKey - Private key as hex string
 * @returns ES256KSigner
 */
export function createSigner(privateKey: string): any {
    // Convert hex string to Uint8Array
    const privateKeyBytes = new Uint8Array(
        privateKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    )
    return ES256KSigner(privateKeyBytes)
}