# 📘 vLEI + KERI Lifecycle Guide

This document summarizes the lifecycle of issuing and managing **vLEIs** (Verifiable Legal Entity Identifiers) using the **KERI** (Key Event Receipt Infrastructure) protocol. It includes actor responsibilities, tools, flows, and cryptographic verifiability.

---

## 🧠 What Is KERI?

KERI is a decentralized key management protocol for:
- 🔐 **Self-certifying identifiers (AIDs)**
- 🔄 **Key rotation and delegation**
- 🧾 **Event logs (KELs)** with cryptographic integrity
- 🛰 **Witnesses** that echo and sign receipt of events

It avoids centralized DIDs or blockchains, yet enables secure, auditable identity control.

---

## 🧾 What Is a vLEI?

A vLEI is a **verifiable credential** tying a **Legal Entity Identifier (LEI)** to a digital identity, with:
- ✅ GLEIF-trusted issuance
- 👥 Role delegation (e.g., CFO, CEO)
- 🔎 Cryptographic verifiability through KERI

---

## 🪢 Lifecycle Flow

### 🔹 Step 1: Issue vLEI for ACME Ltd

| Who | What | How | Why |
|-----|------|-----|-----|
| QVI | Issue vLEI to ACME | - Generate ACME's KERI AID<br>- Sign inception and credential | ACME has trusted, portable identity |

---

### 🔹 Step 2: Appoint Jane Doe as CFO

| Who | What | How | Why |
|-----|------|-----|-----|
| ACME Ltd | Assign CFO role to Jane | - Create Jane’s KERI AID<br>- Delegate from ACME<br>- Issue role-based vLEI | Jane can prove her CFO role cryptographically |

---

### 🔹 Step 3: Verify Jane's Role

| Who | What | How | Why |
|-----|------|-----|-----|
| Verifier | Check Jane’s credentials | - Resolve AID<br>- Fetch KEL<br>- Validate delegation & signature | Confirm Jane is authorized CFO |

---

### 🔹 Step 4: Remove Jane Doe

| Who | What | How | Why |
|-----|------|-----|-----|
| ACME Ltd | Revoke CFO role | - Log revocation event<br>- Optionally rotate keys | Jane is no longer the CFO |

---

### 🔹 Step 5: Prove Jane is No Longer CFO

| Who | What | How | Why |
|-----|------|-----|-----|
| Verifier | Validate revocation | - Fetch Jane’s KEL<br>- Detect revocation or supersession | Jane’s credential is invalid — she’s removed |

---

## 🗃️ Maintaining Event Logs

| Actor | Maintains | How |
|-------|-----------|-----|
| GLEIF | Own KEL + QVI delegations | Signed events + witnesses |
| QVIs | Own KEL + issuance logs | Delegate to entities |
| Legal Entities | Own KEL | Delegate to officers |
| Witnesses | Store all logs | Echo and sign events |
| Verifiers | Fetch & check logs | Validate against trust chain |

---

## 🧪 Sample KERI Inception Event (JSON)

```json
{
  "v": "KERI10JSON0000fb_",
  "t": "icp",
  "d": "EgLQtr...8Bk",
  "i": "EgLQtr...8Bk",
  "s": "0",
  "kt": "1",
  "k": ["DaA9T...s8A"],
  "n": "EjY...w",
  "wt": "0",
  "w": [],
  "c": ["EO"]
}

## Trust Flow


GLEIF ──delegates──▶ QVI ──issues──▶ ACME (KERI ID)
                             │
                             ├─delegates──▶ Jane Doe (CFO KERI ID)
                             │                └─credential: role=CFO
                             └─revokes──▶ Jane Doe (CFO revoked)

Verifier ──verifies──▶ Jane's credential + KERI logs
                    └─ sees revocation event ⇒ not CFO
