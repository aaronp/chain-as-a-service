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
