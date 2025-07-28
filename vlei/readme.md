# Digital Signing with Entity Authority (via vLEI)

🎯 Goal
1. Allow a user to sign a document or message, and allow a verifier to:
2. Confirm the user’s identity
3. Confirm the user is authorized to act on behalf of a legal entity
4. Confirm the entity is valid and globally recognized (via LEI)


🧱 Actors
| Actor | Description | 
|-------|-------------|
|Issuer|Issues a vLEI credential to the representative
|Legal Entity | Has an LEI and DID
|Representative | Has a DID and a role VC (e.g., CFO of ACME Ltd)
|Verifier | Verifies a signed payload and the credential chain



# PoC

🧩 PoC Structure
1. vLEI Issuance (Simulated)
Generate a DID for the Legal Entity

Generate a DID for the Representative

Create a Verifiable Credential (VC):

json
Copy
Edit
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "LegalEntityvLEI"],
  "issuer": "did:example:gleif",
  "credentialSubject": {
    "id": "did:example:rep123",
    "lei": "5493001KJTIIGC8Y1R12",
    "legalName": "ACME Ltd",
    "role": "Chief Financial Officer",
    "represents": "did:example:acme"
  },
  "proof": {
    "type": "JwtProof2020",
    "jwt": "<signed-JWT>"
  }
}
2. Message Signing
The representative signs a message like:

bash
Copy
Edit
"I approve transfer of $5M from ACME Ltd to XYZ Corp."
Use did-jwt or @veramo/core to sign it with their DID key

3. Verification
The verifier checks:

Check	Method
✅ Signature is valid	Validate the JWT or JWS signature
✅ Signer is DID holder	Resolve DID Document, verify public key
✅ Signer has vLEI VC	Decode and validate Verifiable Credential
✅ vLEI VC is valid	Check issuer (GLEIF or simulated CA), expiration, signature
✅ Role & entity match	Confirm role and LEI match expected legal entity

🛠 Discrete Technical Steps
Here’s how you could implement this in a minimal TypeScript PoC:

🔐 Step 1: Generate DIDs
Use [@veramo/core] or [did:key]

ts
Copy
Edit
const { agent } = await createVeramoAgent(); // or generate keypair manually
const did = await agent.didManagerCreate();
📜 Step 2: Issue a VC (vLEI Credential)
Use [did-jwt-vc] or Veramo:

ts
Copy
Edit
import { createVerifiableCredentialJwt } from 'did-jwt-vc';

const vcJwt = await createVerifiableCredentialJwt({
  sub: repDid,
  nbf: Math.floor(Date.now() / 1000),
  vc: {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'LegalEntityvLEI'],
    credentialSubject: {
      lei: '5493001KJTIIGC8Y1R12',
      legalName: 'ACME Ltd',
      role: 'Chief Financial Officer',
      represents: acmeDid
    }
  }
}, issuer);
✍️ Step 3: Sign a Message
ts
Copy
Edit
const message = "I approve transfer of $5M from ACME Ltd to XYZ Corp.";

const signed = await agent.createVerifiablePresentation({
  presentation: {
    holder: repDid,
    verifiableCredential: [vcJwt],
    type: ['VerifiablePresentation'],
  },
  proofFormat: 'jwt',
  challenge: 'random-challenge',
});
🔍 Step 4: Verify Everything
ts
Copy
Edit
const result = await agent.verifyPresentation({
  presentation: signed,
  challenge: 'random-challenge',
});
console.log(result.verified); // true if all checks pass
🧪 Outcome
This simple PoC shows:

How a real person can digitally assert authority on behalf of a legal entity

How another party can verify the claim using only the credentials and DIDs — no central lookup or phone call required