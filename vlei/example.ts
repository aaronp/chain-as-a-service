import {
    createVLEI,
    validateVLEI,
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

    console.log("\n🔍 Validating vLEI credential...")

    // Validate the credential
    const validationResult = await validateVLEI(vleiJwt)

    if (validationResult.isValid) {
        console.log("✅ Credential validation successful:")
        console.log("- JWT format is valid ✓")
        console.log("- Contains vLEI type ✓")
        console.log("- Has required fields (lei, entityName, role, entityDID) ✓")
        console.log("- Issuer:", validationResult.issuer)
        console.log("- Subject:", validationResult.subject)
        console.log("- LEI:", validationResult.lei)
        console.log("- Entity Name:", validationResult.entityName)
        console.log("- Role:", validationResult.role)
        console.log("- Entity DID:", validationResult.entityDID)
    } else {
        console.log("❌ Credential validation failed:", validationResult.error)
    }

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