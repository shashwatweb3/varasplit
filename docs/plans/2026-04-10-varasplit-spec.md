# VaraSplit Spec

## Goal

Ship a mobile-first Vara dApp for simple shared-expense tracking with four actions:

1. Create a group
2. Add an expense
3. View balances automatically
4. Settle the full ledger in one click

## Product Constraints

- Optimize for non-crypto users: minimal steps, large controls, plain language
- Keep the v1 smart contract surface narrow and predictable
- Favor a fast MVP over broader accounting features
- Prefer gasless-friendly architecture, but do not block MVP delivery on sponsor infrastructure

## Contract Requirements

- Program name: `VaraSplit`
- State:
  - `group_id_counter: u64`
  - `groups: BTreeMap<u64, Group>`
- `Group` stores:
  - `name`
  - `members`
  - `balances`
  - `expenses`
- Commands:
  - `create_group`
  - `add_expense`
  - `settle_group`
- Queries:
  - `get_group`
  - `get_balances`
  - `get_settlement_plan`
- Events:
  - `GroupCreated`
  - `ExpenseAdded`
  - `GroupSettled`

## UX Requirements

- Home screen with immediate CTA
- Group creation flow with multiple member addresses
- Group dashboard with balances, expense history, add-expense modal, and settle CTA
- Settlement share card with X sharing link

## MVP Settlement Semantics

The v1 contract settles the group ledger by computing creditor/debtor transfers, emitting the settlement plan, and resetting balances to zero. It does not force cross-account token transfers because that requires a separate escrow or sponsor payment design.
