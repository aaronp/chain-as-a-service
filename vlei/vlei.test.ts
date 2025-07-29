import { describe, test, expect } from "bun:test";
import {
    newKeyPair,
    createIdentity,
    createIssuer,
    createVLEI,
    validateVLEI,
    verifyRepresentativeRole,
    generateVLEIWorkflow,
    createSigner,
    type KeyPair,
    type Identity,
    type VLEIIssuer,
    type VLEIVerificationResult
} from "./index";

describe("VLEI System Tests", () => {
    describe("newKeyPair", () => {
        test("should generate a valid key pair with DID", () => {
            const keyPair = newKeyPair();

            expect(keyPair).toBeDefined();
            expect(keyPair.privateKey).toBeDefined();
            expect(keyPair.publicKey).toBeDefined();
            expect(keyPair.did).toBeDefined();
            expect(keyPair.did).toMatch(/^did:ethr:0x[a-fA-F0-9]{40}$/);
            expect(keyPair.privateKey).toHaveLength(66); // 0x + 64 hex chars
            expect(keyPair.publicKey).toHaveLength(68); // 0x + 64 hex chars + 0x02 prefix
        });

        test("should generate unique key pairs", () => {
            const keyPair1 = newKeyPair();
            const keyPair2 = newKeyPair();

            expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
            expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
            expect(keyPair1.did).not.toBe(keyPair2.did);
        });
    });

    describe("createIdentity", () => {
        test("should create identity with generated key pair", () => {
            const identity = createIdentity("John Doe");

            expect(identity).toBeDefined();
            expect(identity.name).toBe("John Doe");
            expect(identity.did).toBeDefined();
            expect(identity.keyPair).toBeDefined();
            expect(identity.signer).toBeDefined();
            expect(identity.did).toMatch(/^did:ethr:0x[a-fA-F0-9]{40}$/);
        });

        test("should create identity with provided key pair", () => {
            const keyPair = newKeyPair();
            const identity = createIdentity("Jane Doe", keyPair);

            expect(identity.name).toBe("Jane Doe");
            expect(identity.keyPair).toBe(keyPair);
            expect(identity.did).toBe(keyPair.did);
        });
    });

    describe("createIssuer", () => {
        test("should create issuer identity", () => {
            const issuer = createIssuer("VLEI Authority");

            expect(issuer).toBeDefined();
            expect(issuer.did).toBeDefined();
            expect(issuer.signer).toBeDefined();
            expect(issuer.did).toMatch(/^did:ethr:0x[a-fA-F0-9]{40}$/);
        });

        test("should create issuer with provided key pair", () => {
            const keyPair = newKeyPair();
            const issuer = createIssuer("VLEI Authority", keyPair);

            expect(issuer.did).toBe(keyPair.did);
        });
    });

    describe("createVLEI", () => {
        test("should create a valid vLEI credential", async () => {
            const issuer = createIssuer("VLEI Authority");
            const representativeDID = "did:ethr:0x1234567890123456789012345678901234567890";
            const legalEntityDID = "did:ethr:0xfedcba0987654321fedcba0987654321fedcba09";
            const lei = "529900WXKG14MWNYUQ33";
            const entityName = "ACME Corporation";
            const role = "CTO";

            const vleiJwt = await createVLEI(
                issuer,
                representativeDID,
                legalEntityDID,
                lei,
                entityName,
                role
            );

            expect(vleiJwt).toBeDefined();
            expect(typeof vleiJwt).toBe("string");
            expect(vleiJwt.split(".")).toHaveLength(3); // JWT format
        });

        test("should create different JWTs for different credentials", async () => {
            const issuer = createIssuer("VLEI Authority");
            const representativeDID = "did:ethr:0x1234567890123456789012345678901234567890";
            const legalEntityDID = "did:ethr:0xfedcba0987654321fedcba0987654321fedcba09";
            const lei = "529900WXKG14MWNYUQ33";

            const vleiJwt1 = await createVLEI(
                issuer,
                representativeDID,
                legalEntityDID,
                lei,
                "ACME Corporation",
                "CTO"
            );

            const vleiJwt2 = await createVLEI(
                issuer,
                representativeDID,
                legalEntityDID,
                lei,
                "ACME Corporation",
                "CEO"
            );

            expect(vleiJwt1).not.toBe(vleiJwt2);
        });
    });

    describe("validateVLEI", () => {
        test("should validate a properly formatted vLEI credential", async () => {
            const issuer = createIssuer("VLEI Authority");
            const representativeDID = "did:ethr:0x1234567890123456789012345678901234567890";
            const legalEntityDID = "did:ethr:0xfedcba0987654321fedcba0987654321fedcba09";
            const lei = "529900WXKG14MWNYUQ33";
            const entityName = "ACME Corporation";
            const role = "CTO";

            const vleiJwt = await createVLEI(
                issuer,
                representativeDID,
                legalEntityDID,
                lei,
                entityName,
                role
            );

            const result = await validateVLEI(vleiJwt);

            expect(result.isValid).toBe(true);
            expect(result.issuer).toBe(issuer.did);
            expect(result.subject).toBe(representativeDID);
            expect(result.lei).toBe(lei);
            expect(result.entityName).toBe(entityName);
            expect(result.role).toBe(role);
            expect(result.entityDID).toBe(legalEntityDID);
            expect(result.issuanceDate).toBeDefined();
        });

        test("should reject invalid JWT format", async () => {
            const result = await validateVLEI("invalid.jwt.format");

            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });

        test("should validate with issuer private key for signature verification", async () => {
            const issuer = createIssuer("VLEI Authority");
            const representativeDID = "did:ethr:0x1234567890123456789012345678901234567890";
            const legalEntityDID = "did:ethr:0xfedcba0987654321fedcba0987654321fedcba09";
            const lei = "529900WXKG14MWNYUQ33";
            const entityName = "ACME Corporation";
            const role = "CTO";

            const vleiJwt = await createVLEI(
                issuer,
                representativeDID,
                legalEntityDID,
                lei,
                entityName,
                role
            );

            const result = await validateVLEI(vleiJwt, issuer.signer.privateKey);

            expect(result.isValid).toBe(true);
            expect(result.issuer).toBe(issuer.did);
            expect(result.subject).toBe(representativeDID);
            expect(result.lei).toBe(lei);
            expect(result.entityName).toBe(entityName);
            expect(result.role).toBe(role);
            expect(result.entityDID).toBe(legalEntityDID);
        });
    });

    describe("verifyRepresentativeRole", () => {
        test("should verify correct representative role", async () => {
            const issuer = createIssuer("VLEI Authority");
            const representativeDID = "did:ethr:0x1234567890123456789012345678901234567890";
            const legalEntityDID = "did:ethr:0xfedcba0987654321fedcba0987654321fedcba09";
            const lei = "529900WXKG14MWNYUQ33";
            const entityName = "ACME Corporation";
            const role = "CTO";

            const vleiJwt = await createVLEI(
                issuer,
                representativeDID,
                legalEntityDID,
                lei,
                entityName,
                role
            );

            const isValid = await verifyRepresentativeRole(
                representativeDID,
                legalEntityDID,
                role,
                vleiJwt
            );

            expect(isValid).toBe(true);
        });

        test("should reject incorrect representative", async () => {
            const issuer = createIssuer("VLEI Authority");
            const representativeDID = "did:ethr:0x1234567890123456789012345678901234567890";
            const legalEntityDID = "did:ethr:0xfedcba0987654321fedcba0987654321fedcba09";
            const lei = "529900WXKG14MWNYUQ33";
            const entityName = "ACME Corporation";
            const role = "CTO";

            const vleiJwt = await createVLEI(
                issuer,
                representativeDID,
                legalEntityDID,
                lei,
                entityName,
                role
            );

            const isValid = await verifyRepresentativeRole(
                "did:ethr:0xwrongrepresentative",
                legalEntityDID,
                role,
                vleiJwt
            );

            expect(isValid).toBe(false);
        });

        test("should reject incorrect role", async () => {
            const issuer = createIssuer("VLEI Authority");
            const representativeDID = "did:ethr:0x1234567890123456789012345678901234567890";
            const legalEntityDID = "did:ethr:0xfedcba0987654321fedcba0987654321fedcba09";
            const lei = "529900WXKG14MWNYUQ33";
            const entityName = "ACME Corporation";
            const role = "CTO";

            const vleiJwt = await createVLEI(
                issuer,
                representativeDID,
                legalEntityDID,
                lei,
                entityName,
                role
            );

            const isValid = await verifyRepresentativeRole(
                representativeDID,
                legalEntityDID,
                "CEO", // Wrong role
                vleiJwt
            );

            expect(isValid).toBe(false);
        });
    });

    describe("generateVLEIWorkflow", () => {
        test("should generate complete vLEI workflow", async () => {
            const workflow = await generateVLEIWorkflow(
                "VLEI Authority",
                "ACME Corporation",
                "Jane Doe",
                "529900WXKG14MWNYUQ33",
                "CTO"
            );

            expect(workflow).toBeDefined();
            expect(workflow.issuer).toBeDefined();
            expect(workflow.entity).toBeDefined();
            expect(workflow.representative).toBeDefined();
            expect(workflow.vleiJwt).toBeDefined();

            expect(workflow.issuer.did).toBeDefined();
            expect(workflow.entity.did).toBeDefined();
            expect(workflow.representative.did).toBeDefined();
            expect(workflow.entity.name).toBe("ACME Corporation");
            expect(workflow.representative.name).toBe("Jane Doe");
        });
    });

    describe("createSigner", () => {
        test("should create signer from private key", () => {
            const keyPair = newKeyPair();
            const signer = createSigner(keyPair.privateKey);

            expect(signer).toBeDefined();
            expect(signer.privateKey).toBe(keyPair.privateKey);
            expect(signer.address).toBe(keyPair.did.replace("did:ethr:", ""));
        });
    });

    describe("End-to-End Flow: Jane Doe as CTO of Acme Corp", () => {
        test("should verify that Jane Doe is the CTO of Acme Corp", async () => {
            // Step 1: Create all identities
            const issuer = createIssuer("VLEI Authority");
            const acmeCorp = createIdentity("Acme Corp");
            const janeDoe = createIdentity("Jane Doe");

            console.log("✅ Created identities:");
            console.log("  Issuer:", issuer.did);
            console.log("  Acme Corp:", acmeCorp.did);
            console.log("  Jane Doe:", janeDoe.did);

            // Step 2: Generate vLEI credential
            const lei = "529900WXKG14MWNYUQ33";
            const vleiJwt = await createVLEI(
                issuer,
                janeDoe.did,
                acmeCorp.did,
                lei,
                "Acme Corp",
                "CTO"
            );

            console.log("✅ Generated vLEI credential");
            console.log("  JWT:", vleiJwt.substring(0, 50) + "...");

            // Step 3: Validate the credential
            const validationResult = await validateVLEI(vleiJwt);
            expect(validationResult.isValid).toBe(true);
            expect(validationResult.subject).toBe(janeDoe.did);
            expect(validationResult.entityDID).toBe(acmeCorp.did);
            expect(validationResult.role).toBe("CTO");
            expect(validationResult.entityName).toBe("Acme Corp");
            expect(validationResult.lei).toBe(lei);

            console.log("✅ Validated vLEI credential:");
            console.log("  Subject:", validationResult.subject);
            console.log("  Entity:", validationResult.entityName);
            console.log("  Role:", validationResult.role);
            console.log("  LEI:", validationResult.lei);

            // Step 4: Verify Jane Doe's role
            const isJaneDoeCTO = await verifyRepresentativeRole(
                janeDoe.did,
                acmeCorp.did,
                "CTO",
                vleiJwt
            );

            expect(isJaneDoeCTO).toBe(true);

            console.log("✅ Verified: Jane Doe is CTO of Acme Corp");

            // Step 5: Verify that Jane Doe is NOT CEO (negative test)
            const isJaneDoeCEO = await verifyRepresentativeRole(
                janeDoe.did,
                acmeCorp.did,
                "CEO",
                vleiJwt
            );

            expect(isJaneDoeCEO).toBe(false);

            console.log("✅ Verified: Jane Doe is NOT CEO of Acme Corp");

            // Step 6: Verify that someone else is not CTO (negative test)
            const isSomeoneElseCTO = await verifyRepresentativeRole(
                "did:ethr:0x1234567890123456789012345678901234567890",
                acmeCorp.did,
                "CTO",
                vleiJwt
            );

            expect(isSomeoneElseCTO).toBe(false);

            console.log("✅ Verified: Other person is NOT CTO of Acme Corp");

            console.log("\n🎯 End-to-End Test PASSED: Jane Doe is verified as CTO of Acme Corp!");
        });
    });
});
