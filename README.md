# 🚀 VaraSplit

> Not just payments — proof.

VaraSplit is an on-chain coordination system that turns group settlements and payouts into **verifiable, programmable financial workflows**.

Instead of informal tracking, screenshots, or trust-based settlements, VaraSplit ensures everything is:
- Transparent
- Wallet-based
- On-chain verifiable

---

## 🌍 Why VaraSplit?

We’re moving from:

❌ Informal settlements  
→ “Did you pay?”  
→ “I think I transferred…”  
→ No proof  

to:

✅ Programmable + verifiable systems  
→ Auto-calculated settlements  
→ Wallet-based payments  
→ On-chain proof  

---

## ⚙️ What It Does

### 🧾 Group Settlements
- Create a group
- Add members (wallet addresses)
- Add shared expenses
- Auto-generate settlement plan
- Pay → Claim → Close
- Generate on-chain proof (invoice)

---

### 💼 Work & Payouts *(In Progress)*
- Create payout (freelance, bounty, salary)
- Assign recipients
- Lock funds
- Release with proof
- Claim securely

---

## 🔔 Action Center

A real-time notification system that shows:

- Pending payments  
- Claimable funds  
- Proof-ready records  

No need to chase people — the system tells you what to do.

---

## 🏗 Architecture

User
↓
Next.js Frontend (Vercel)
↓
Injected Wallet (Polkadot / SubWallet)
↓
Signed Transactions
↓
Vara Smart Contracts (Gear)
├── VaraSplitEscrow
└── WorkPayoutProof
↓
On-chain State
↓
UI (Action Center + Proof Views)


---

## 🔐 Smart Contracts

### VaraSplitEscrow
Handles:
- Group creation
- Expense tracking
- Settlement calculation
- Escrow deposits
- Claim payouts
- Invoice NFT (proof)

---

### WorkPayoutProof
Handles:
- Payout creation
- Multi-recipient payments
- Claim-based payouts
- Proof generation (invoice)

---

## 📄 Proof System

Every completed settlement generates:

- On-chain invoice (NFT-style record)
- Wallet-linked identities
- Final balances
- Claim status
- Transaction reference

No fake screenshots.  
Only **verifiable proof**.

---

## 🔁 Flow

### Group Flow
1. Create group  
2. Add members  
3. Add expenses  
4. Generate settlement plan  
5. Members deposit/pay  
6. Finalize  
7. Claim payouts  
8. Generate proof  

---

### Payout Flow
1. Create payout  
2. Add recipients  
3. Fund payout  
4. Finalize  
5. Recipients claim  
6. Proof generated  

---

## 🧠 Built With

- **Vara Network** (Smart Contracts)
- **Gear Protocol**
- **Next.js** (Frontend)
- **Polkadot.js / SubWallet** (Wallet)
- **Vercel** (Deployment)

---

## 🤖 Built Using AI (Agentic Framework)

This project was built using Vara’s **Agentic Framework (Vara Skills)**:

- Faster iteration
- Structured contract + frontend flow
- Real product built from idea → deployment

AI acted as a **builder multiplier**, not just an assistant.

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/shashwatweb3/varasplit.git
cd varasplit
