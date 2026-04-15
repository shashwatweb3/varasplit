# VaraSplit Stable Ledger Spec

## Problem

The current VaraSplit contract can trap through assertion and expectation paths. That creates `wasm unreachable` failures for ordinary validation errors, and the public model does not persist settlement invoices after a group is settled.

## User Goal

Provide a stable Sails contract and dApp flow for shared expenses where all contract routes validate inputs defensively, return typed `Result` replies, and keep frontend ABI types aligned with the generated Sails client.

## In Scope

- Replace panic-based validation with typed errors.
- Keep one Sails program and one `vara_split` service.
- Store groups, invoices, and a monotonically increasing group id counter.
- Track expense balances per member.
- Confirm off-chain payments only when the payer owes the recipient in the current settlement graph.
- Settle a group by computing debtor-to-creditor transfers, storing an invoice, and resetting balances.
- Expose read routes for `get_group`, `get_invoice`, balances, and settlement preview.
- Regenerate IDL and typed Rust client through the repo build pipeline.
- Align the frontend adapter to use generated `sails-js` client calls only.

## Out of Scope

- Native token custody or automatic token transfer.
- Vouchers, signless sessions, or sponsored transactions.
- Multi-currency accounting.
- Group membership mutation after creation.
- Released-contract migration or live cutover support.

## Actors

- Group member: an account included in a group member list.
- Expense payer: a group member who paid an expense.
- Payment sender: a debtor who confirms an off-chain payment to a creditor.
- Any reader: may query public read routes.

## State Changes

Contract state is:

- `groups: BTreeMap<u64, Group>`
- `invoices: BTreeMap<u64, Invoice>`
- `group_id_counter: u64`

Required structs:

- `Group`
- `MemberBalance`
- `Expense`
- `SettlementTransfer`
- `Invoice`

Supporting reply structs:

- `GroupView`
- `GroupSettlement`

Supporting error enum:

- `VaraSplitError`

## Data Model

`Group`:

- `id: u64`
- `name: String`
- `members: Vec<[u8; 32]>`
- `balances: BTreeMap<[u8; 32], i128>`
- `expenses: Vec<Expense>`

`MemberBalance`:

- `member: [u8; 32]`
- `balance: i128`

`Expense`:

- `payer: [u8; 32]`
- `amount: u128`
- `share_per_member: u128`
- `remainder: u128`
- `description: String`
- `created_at: u64`

`SettlementTransfer`:

- `from: [u8; 32]`
- `to: [u8; 32]`
- `amount: u128`

`Invoice`:

- `group_id: u64`
- `transfers: Vec<SettlementTransfer>`
- `total_settled: u128`
- `settled_at: u64`

`GroupView`:

- `id: u64`
- `name: String`
- `members: Vec<[u8; 32]>`
- `balances: Vec<MemberBalance>`
- `expenses: Vec<Expense>`

`GroupSettlement`:

- `group_id: u64`
- `transfers: Vec<SettlementTransfer>`
- `total_settled: u128`
- `invoice: Invoice`

## Messages And Replies

All exported routes return `Result<_, VaraSplitError>`.

Strict user-facing function signatures:

- `CreateGroup(name: String, members: Vec<[u8;32]>) -> Result<GroupView, VaraSplitError>`
- `AddExpense(group_id: u64, payer: [u8;32], amount: u128, description: String) -> Result<GroupView, VaraSplitError>`
- `ConfirmPayment(group_id: u64, from: [u8;32], to: [u8;32], amount: u128) -> Result<GroupView, VaraSplitError>`
- `SettleGroup(group_id: u64) -> Result<GroupSettlement, VaraSplitError>`
- `GetInvoice(group_id: u64) -> Result<Invoice, VaraSplitError>`

Additional routes required by the current dApp and validation flow:

- `GetGroup(group_id: u64) -> Result<GroupView, VaraSplitError>`
- `GetBalances(group_id: u64) -> Result<Vec<MemberBalance>, VaraSplitError>`
- `GetSettlementPlan(group_id: u64) -> Result<Vec<SettlementTransfer>, VaraSplitError>`

Rust method names remain idiomatic Sails exports (`create_group`, `add_expense`, `confirm_payment`, `settle_group`, `get_invoice`, `get_group`, `get_balances`, `get_settlement_plan`). The generated Sails IDL and client are the ABI source of truth for frontend calls.

## Events

- `GroupCreated { group_id, name, members }`
- `ExpenseAdded { group_id, payer, amount, description }`
- `PaymentConfirmed { group_id, from, to, amount }`
- `GroupSettled { group_id, transfers, total_settled }`

Event emission failures return `VaraSplitError::EventEmissionFailed` instead of trapping.

## Validation Rules

- Group must exist for every group-scoped call.
- Members must exist for payer, payment sender, and payment recipient checks.
- Group creation rejects duplicate members.
- Group creation rejects fewer than two members.
- Group creation rejects an empty trimmed name.
- Expense creation rejects an empty trimmed description.
- Amount must be greater than zero.
- Arithmetic uses checked operations.
- `u128` amounts must fit in `i128` before balance mutation.
- Division by zero is impossible because groups require at least two members, but expense splitting still checks converted member count.
- Payment direction is valid only when `from` currently owes `to` in the computed settlement plan.
- Confirmed payment amount must not exceed outstanding debt from `from` to `to`.
- `from` and `to` must differ.
- Caller must be a group member for expense creation and settlement.
- Caller must equal `from` for payment confirmation.

## Settlement Logic

Settlement uses current signed member balances:

- Positive balances are creditors.
- Negative balances are debtors.
- Generate deterministic transfers by iterating group member order for debtors and creditors.
- Each transfer amount is the minimum of current debtor amount and creditor amount.
- Sum transfer amounts with checked addition.
- Store `Invoice` under `invoices[group_id]`.
- Reset all group member balances to zero after invoice creation.
- Return `GroupSettlement` containing the invoice and transfer list.

## Invariants

- Every group member has a balance entry.
- Public routes do not call `unwrap`, `expect`, direct indexing, or assertion macros.
- The sum of balances remains zero after each valid expense or payment confirmation.
- Settlement resets all balances for the group to zero.
- Latest invoice per group is retrievable after settlement.
- No successful path can overflow or underflow.

## Edge Cases

- Duplicate members are rejected before state mutation.
- Unknown group id returns `GroupNotFound`.
- Unknown member returns `MemberNotFound`.
- Zero amount returns `InvalidAmount`.
- Oversized amount that cannot fit `i128` returns `AmountTooLarge`.
- Group id counter overflow returns `GroupIdOverflow`.
- Empty settlement is allowed and stores an invoice with no transfers and `total_settled = 0`.
- Re-settling an already settled group overwrites the latest invoice with a zero-transfer invoice.

## Acceptance Criteria

- `getGroup` works through the generated frontend client.
- `createGroup` works and rejects duplicate members without `wasm unreachable`.
- `addExpense` works and updates balances deterministically.
- `confirmPayment` works for valid debtor-to-creditor payments and rejects invalid direction.
- `settleGroup` works, stores invoice, and resets balances.
- `getInvoice` works after settlement.
- Contract build and IDL generation complete successfully.
- Frontend uses decoded addresses as `Uint8Array`, `u64` as `BigInt`, and `u128` as `BigInt`.
- No hand-built SCALE payloads or non-Sails client calls remain in the frontend adapter.
