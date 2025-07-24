# ERC-3643: Roles & Contracts Overview

ERC-3643 (formerly T-REX Protocol) is an open-source standard for permissioned tokens, enabling compliant issuance, management, and transfer of digital securities. For more details, see the [official ERC-3643 page](https://tokeny.com/erc3643/).

---

## Roles

### 1. Issuer / Agent
- **Role:** The entity responsible for creating and managing the permissioned token.
- **Operations:**
  - Mint, burn, block, or force transfer tokens
  - Assign or revoke roles and permissions
  - Update compliance rules
  - Recover lost tokens
- **Contracts Interacted With:**
  - Token contract (ERC-3643 Token)
  - Compliance contracts (e.g., ModularCompliance, ICompliance)
  - Identity Registry contracts

### 2. Investor / Token Holder
- **Role:** The end user who holds and transfers permissioned tokens.
- **Operations:**
  - Hold and transfer tokens (subject to compliance)
  - Recover tokens (with proof of identity)
  - View portfolio and transaction history
- **Contracts Interacted With:**
  - Token contract
  - Identity Registry (for identity validation)

### 3. Compliance Agent
- **Role:** Manages and enforces compliance rules for token transfers.
- **Operations:**
  - Define and update compliance modules (e.g., whitelisting, transfer restrictions)
  - Approve or reject transfers based on rules
- **Contracts Interacted With:**
  - Compliance contracts (e.g., ModularCompliance, ICompliance)
  - Token contract

### 4. Identity Verifier / Trusted Issuer
- **Role:** Validates and attests to the identity of investors.
- **Operations:**
  - Register and update identities
  - Issue claims or credentials
- **Contracts Interacted With:**
  - Identity Registry
  - Trusted Issuers Registry

---

## Contracts

### 1. Token Contract (ERC-3643 Token)
- **Used By:** Issuer, Investor, Compliance Agent
- **Operations:**
  - Mint, burn, transfer, force transfer, block tokens
  - Query balances and transaction history
  - Enforce compliance on transfers
- **Reference:** [ERC-3643 Overview](https://tokeny.com/erc3643/)

### 2. Compliance Contracts (e.g., ModularCompliance, ICompliance)
- **Used By:** Issuer, Compliance Agent
- **Operations:**
  - Define and update compliance modules
  - Enforce transfer restrictions (e.g., whitelisting, country restrictions, limits)
- **Reference:** [ERC-3643 Compliance](https://tokeny.com/erc3643/)

### 3. Identity Registry
- **Used By:** Issuer, Investor, Identity Verifier
- **Operations:**
  - Register and update investor identities
  - Validate eligibility for transfers
- **Reference:** [ERC-3643 Identity](https://tokeny.com/erc3643/)

### 4. Trusted Issuers Registry
- **Used By:** Issuer, Identity Verifier
- **Operations:**
  - Register trusted identity verifiers
  - Manage attestation sources
- **Reference:** [ERC-3643 Trusted Issuers](https://tokeny.com/erc3643/)

---

For more information, see the [Tokeny ERC-3643 page](https://tokeny.com/erc3643/) and the [ERC-3643 GitHub repository](https://github.com/TokenySolutions/ERC3643).

---

## Example Scenarios

Below are common end-to-end flows for ERC-3643 permissioned tokens. Each scenario lists the high-level steps, the actor responsible, and how they interact with the ERC-3643 contracts.

### 1. Onboarding a New Investor
1. **Investor submits identity documents**  
   *Actor:* Investor → Identity Verifier  
   *Interaction:* Off-chain (KYC/AML process)
2. **Identity Verifier attests to investor's identity**  
   *Actor:* Identity Verifier  
   *Interaction:* Calls Identity Registry to register/update investor's identity
3. **Issuer mints tokens to investor**  
   *Actor:* Issuer  
   *Interaction:* Calls Token contract to mint tokens to investor's address (only possible if identity is valid and compliant)

### 2. Secondary Trading (Peer-to-Peer Transfer)
1. **Investor A initiates transfer to Investor B**  
   *Actor:* Investor A  
   *Interaction:* Calls Token contract to transfer tokens to Investor B
2. **Compliance check is performed**  
   *Actor:* Compliance Agent (automated via contract)  
   *Interaction:* Token contract queries Compliance contract to validate transfer (e.g., both parties are eligible, not blacklisted, within limits)
3. **Transfer is executed if compliant**  
   *Actor:* Token contract (automated)  
   *Interaction:* Tokens are transferred if compliance passes

### 3. Freezing an Account
1. **Issuer/Compliance Agent decides to freeze an account**  
   *Actor:* Issuer or Compliance Agent  
   *Interaction:* Calls Compliance contract or Token contract to block the investor's address
2. **Frozen account cannot transfer or receive tokens**  
   *Actor:* Token contract (enforced automatically)  
   *Interaction:* Compliance checks block all transfers involving the frozen address

### 4. Forcing a Transfer (e.g., Regulatory Action)
1. **Issuer/Agent initiates a forced transfer**  
   *Actor:* Issuer/Agent  
   *Interaction:* Calls Token contract's forceTransfer function to move tokens from one address to another, bypassing normal compliance
2. **Compliance Agent may log or review the action**  
   *Actor:* Compliance Agent  
   *Interaction:* (Optional) Off-chain or on-chain logging/review

### 5. Account Recovery (Lost Access)
1. **Investor proves identity to Issuer/Identity Verifier**  
   *Actor:* Investor → Issuer/Identity Verifier  
   *Interaction:* Off-chain (identity proof)
2. **Issuer/Agent updates registry and reassigns tokens**  
   *Actor:* Issuer/Agent  
   *Interaction:* Calls Identity Registry to update investor's address, then Token contract to transfer or re-mint tokens to new address

### 6. Proving Identity or Claims
1. **Investor requests proof of eligibility (e.g., for transfer or redemption)**  
   *Actor:* Investor  
   *Interaction:* Off-chain or via dApp UI
2. **System queries Identity Registry and Trusted Issuers Registry**  
   *Actor:* dApp/Smart Contract  
   *Interaction:* Reads from Identity Registry and Trusted Issuers Registry to verify claims/credentials
3. **Investor presents proof to third party**  
   *Actor:* Investor  
   *Interaction:* Off-chain or via dApp, using on-chain data as evidence

---
