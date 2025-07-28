import {
    createVerifiableCredentialJwt,
    verifyCredential
} from 'did-jwt-vc'
import type { JwtCredentialPayload } from 'did-jwt-vc'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { ES256KSigner } from 'did-jwt'

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
 * Validates a vLEI credential
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