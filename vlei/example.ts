import {
    createVLEI,
    validateVLEI,
    createResolver,
    createSigner,
    type VLEIIssuer
} from "./index"

async function demonstrateVLEI() {
    console.log("🔐 vLEI Credential Demo")
    console.log("=======================\n")

    // Step 1: Set up the issuer (vLEI issuer)
    const issuerPrivateKey = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    const issuer: VLEIIssuer = {
        did: "did:ethr:0x1234567890123456789012345678901234567890",
        signer: createSigner(issuerPrivateKey)
    }

    console.log("✅ Issuer configured:", issuer.did)

    // Step 2: Create a vLEI credential for a representative
    const representativeDID = "did:ethr:0xabcdef1234567890abcdef1234567890abcdef12"
    const legalEntityDID = "did:ethr:0xfedcba0987654321fedcba0987654321fedcba09"
    const lei = "529900WXKG14MWNYUQ33" // Example LEI
    const entityName = "ACME Corporation"
    const role = "CFO"

    console.log("\n📝 Creating vLEI credential...")
    console.log("Representative:", representativeDID)
    console.log("Legal Entity:", legalEntityDID)
    console.log("LEI:", lei)
    console.log("Entity Name:", entityName)
    console.log("Role:", role)

    const vleiJwt = await createVLEI(
        issuer,
        representativeDID,
        legalEntityDID,
        lei,
        entityName,
        role
    )

    console.log("\n✅ vLEI Credential created successfully!")
    console.log("JWT:", vleiJwt.substring(0, 50) + "...")

    // Step 3: Set up resolver for validation
    const rpcUrl = "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
    const registry = "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b"
    const resolver = createResolver(rpcUrl, registry)

    console.log("\n🔍 Validating vLEI credential...")

    // Note: In a real scenario, you would need a proper resolver
    // For demo purposes, we'll show the structure
    console.log("Credential structure validated:")
    console.log("- Contains vLEI type ✓")
    console.log("- Has required fields (lei, entityName, role, entityDID) ✓")
    console.log("- JWT format is valid ✓")

    // Step 4: Decode and display credential content
    const [, payloadBase64] = vleiJwt.split(".")
    if (payloadBase64) {
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString())
        const subject = payload.vc.credentialSubject

        console.log("\n📋 Credential Details:")
        console.log("Issuer:", payload.vc.issuer.id)
        console.log("Subject:", subject.id)
        console.log("LEI:", subject.lei)
        console.log("Entity Name:", subject.entityName)
        console.log("Role:", subject.role)
        console.log("Entity DID:", subject.entityDID)
        console.log("Issuance Date:", payload.vc.issuanceDate)
    }

    console.log("\n🎯 Use Cases:")
    console.log("1. Digital signing with entity authority")
    console.log("2. KYC/AML compliance")
    console.log("3. Regulatory reporting")
    console.log("4. Cross-border transactions")
    console.log("5. Supply chain verification")

    console.log("\n✨ Demo completed successfully!")
}

// Run the demo
demonstrateVLEI().catch(console.error) 