# Digital Signing with Entity Authority (via vLEI)

See vLEI write-up [here](https://docs.google.com/document/d/1ZOHBsIW1_PZFQL7IiEZvkxfRO9sHc0dF4wi7P4KW1w0/edit?usp=sharing)

🎯 Goal
1. Allow a user to sign a document or message, and allow a verifier to:
2. Confirm the user's identity
3. Confirm the user is authorized to act on behalf of a legal entity
4. Confirm the entity is valid and globally recognized (via LEI)

🧱 Actors
| Actor | Description | 
|-------|-------------|
|Issuer|Issues a vLEI credential to the representative
|Legal Entity | Has an LEI and DID
|Representative | Has a DID and a role VC (e.g., CFO of ACME Ltd)
|Verifier | Verifies a signed payload and the credential chain

## Implementation

This project implements vLEI (verifiable Legal Entity Identifier) credentials using the [did-jwt-vc](https://github.com/decentralized-identity/did-jwt-vc) library. The implementation provides high-level functions for creating and validating vLEI credentials.

### Core Functions

#### `createVLEI(issuer, representativeDID, legalEntityDID, lei, entityName, role)`
Creates a vLEI credential for a representative of a legal entity.

**Parameters:**
- `issuer`: VLEIIssuer object with DID and signer
- `representativeDID`: DID of the representative
- `legalEntityDID`: DID of the legal entity
- `lei`: Legal Entity Identifier
- `entityName`: Name of the legal entity
- `role`: Role of the representative (e.g., "CFO", "CEO")

**Returns:** JWT string of the vLEI credential

#### `validateVLEI(vleiJwt, resolver)`
Validates a vLEI credential.

**Parameters:**
- `vleiJwt`: The JWT string of the vLEI credential
- `resolver`: DID resolver for verification

**Returns:** VLEIVerificationResult with validation status

#### `createResolver(rpcUrl, registry)`
Creates a DID resolver for Ethereum-based DIDs.

#### `createSigner(privateKey)`
Creates a signer for DID operations from a hex private key.

### Usage Example

```typescript
import { createVLEI, validateVLEI, createResolver, createSigner } from './index'

// Set up issuer
const issuer = {
  did: "did:ethr:0x1234567890123456789012345678901234567890",
  signer: createSigner("your-private-key-here")
}

// Create vLEI credential
const vleiJwt = await createVLEI(
  issuer,
  "did:ethr:0xrepresentative",
  "did:ethr:0xentity",
  "529900WXKG14MWNYUQ33",
  "ACME Corporation",
  "CFO"
)

// Validate credential
const resolver = createResolver("https://mainnet.infura.io/v3/YOUR_PROJECT_ID", "0xregistry")
const result = await validateVLEI(vleiJwt, resolver)
```

### Running the Demo

```bash
bun run example.ts
```

### Running Tests

```bash
bun test
```

## vLEI Credential Structure

The vLEI credential follows the W3C Verifiable Credentials standard with the following structure:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.gleif.org/vc/v1"
  ],
  "type": ["VerifiableCredential", "vLEICredential"],
  "issuer": { "id": "did:ethr:0xissuer" },
  "issuanceDate": "2024-01-01T00:00:00.000Z",
  "credentialSubject": {
    "id": "did:ethr:0xrepresentative",
    "lei": "529900WXKG14MWNYUQ33",
    "entityName": "ACME Corporation",
    "role": "CFO",
    "entityDID": "did:ethr:0xentity"
  }
}
```

## Use Cases

1. **Digital signing with entity authority** - Verify that a signer is authorized to act on behalf of a legal entity
2. **KYC/AML compliance** - Streamline identity verification processes
3. **Regulatory reporting** - Ensure compliance with financial regulations
4. **Cross-border transactions** - Facilitate international business operations
5. **Supply chain verification** - Verify entity relationships in supply chains

# PoC

🧩 PoC Structure
1. vLEI Issuance (Simulated)
   - Generate a DID for the Legal Entity
   - Generate a DID for the Representative
   - Create vLEI credential linking representative to entity
2. vLEI Validation
   - Verify credential signature
   - Validate vLEI-specific fields
   - Check entity authorization