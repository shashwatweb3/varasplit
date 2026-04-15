# VaraSplit Invoice NFT Spec

## Problem

VaraSplit needs settlement invoices represented as on-chain NFT-like records while preserving a stable, typed Sails ABI and avoiding runtime traps.

## User Goal

Users can create groups, add expenses, confirm payments, settle balances, and receive an on-chain `InvoiceNFT` that can be queried and displayed in the dApp.

## In Scope

- Replace invoice-by-group storage with NFT invoice storage by token id.
- Add `token_counter: u64`.
- Keep `group_id_counter: u64`.
- Store `groups: BTreeMap<u64, Group>`.
- Store `invoice_nfts: BTreeMap<u64, InvoiceNFT>`.
- Use exact requested public data structs and error enum order.
- Keep every exported route returning `Result`.
- Emit `InvoiceNFTMinted` during settlement.
- Regenerate IDL and align frontend calls with generated Sails ABI.
- Display minted invoice NFT details after settlement.

## Out of Scope

- Full NFT standard integration, transfer routes, approvals, metadata URI, marketplace support, or royalty support.
- Native token custody.
- Voucher or signless transaction support.

## Actors

- Group creator: the caller of `CreateGroup`. For storage without adding a non-requested `creator` field, the contract requires the first member in `members` to equal `msg::source()`.
- Group member: any account in the group member list.
- Expense payer: group member who paid an expense.
- Payment sender: group debtor confirming an off-chain payment.
- Invoice NFT owner: group creator.

## State Changes

State:

- `group_id_counter: u64`
- `token_counter: u64`
- `groups: BTreeMap<u64, Group>`
- `invoice_nfts: BTreeMap<u64, InvoiceNFT>`

## Data Model

`Group`:

- `id: u64`
- `name: String`
- `members: Vec<[u8;32]>`
- `balances: Vec<MemberBalance>`
- `expenses: Vec<Expense>`

`MemberBalance`:

- `member: [u8;32]`
- `balance: i128`

`Expense`:

- `payer: [u8;32]`
- `amount: u128`
- `share_per_member: u128`
- `remainder: u128`
- `description: String`
- `created_at: u64`

`SettlementTransfer`:

- `from: [u8;32]`
- `to: [u8;32]`
- `amount: u128`

`InvoiceNFT`:

- `token_id: u64`
- `group_id: u64`
- `owner: [u8;32]`
- `transfers: Vec<SettlementTransfer>`
- `total_settled: u128`
- `settled_at: u64`

`GroupSettlement`:

- `group_id: u64`
- `transfers: Vec<SettlementTransfer>`
- `total_settled: u128`

`GroupView` mirrors `Group`.

## Error Enum

The `VaraSplitError` order is frozen:

1. `AmountTooLarge`
2. `BalanceOverflow`
3. `BalanceUnderflow`
4. `DuplicateMember`
5. `EventEmissionFailed`
6. `GroupIdOverflow`
7. `GroupNotFound`
8. `InvalidAmount`
9. `InvalidDescription`
10. `InvalidGroupName`
11. `InvalidMemberCount`
12. `InvalidPaymentDirection`
13. `MemberBalanceMissing`
14. `MemberCountOverflow`
15. `MemberNotFound`
16. `OnlyGroupMemberCanAddExpense`
17. `OnlyGroupMemberCanSettle`
18. `OnlySenderCanConfirmPayment`
19. `PaymentAmountExceedsDebt`
20. `SettlementOverflow`
21. `ShareOverflow`
22. `InvoiceAlreadyMinted`
23. `TokenIdOverflow`

## Messages And Replies

Commands:

- `CreateGroup(name: String, members: Vec<[u8;32]>) -> Result<GroupView, VaraSplitError>`
- `AddExpense(group_id: u64, payer: [u8;32], amount: u128, description: String) -> Result<GroupView, VaraSplitError>`
- `ConfirmPayment(group_id: u64, from: [u8;32], to: [u8;32], amount: u128) -> Result<GroupView, VaraSplitError>`
- `SettleGroup(group_id: u64) -> Result<GroupSettlement, VaraSplitError>`

Queries:

- `GetGroup(group_id: u64) -> Result<GroupView, VaraSplitError>`
- `GetBalances(group_id: u64) -> Result<Vec<MemberBalance>, VaraSplitError>`
- `GetSettlementPlan(group_id: u64) -> Result<Vec<SettlementTransfer>, VaraSplitError>`
- `GetInvoiceNFT(token_id: u64) -> Result<InvoiceNFT, VaraSplitError>`

## Events

- `GroupCreated { group_id, name, members }`
- `ExpenseAdded { group_id, payer, amount, description }`
- `PaymentConfirmed { group_id, from, to, amount }`
- `GroupSettled { group_id, transfers, total_settled }`
- `InvoiceNFTMinted { token_id, owner, group_id }`

## Validation Rules

- Group must exist for group-scoped calls.
- Members must exist for payer, payment sender, and payment recipient checks.
- Duplicate members are rejected.
- Group name and description must not be empty after trimming.
- `amount > 0`.
- Group creation requires at least two members.
- First member must equal caller, defining the group creator for invoice ownership.
- Division by zero is prevented by member count validation and checked conversion.
- Arithmetic uses checked operations.
- Amounts must fit into `i128` before balance mutation.
- Payment direction must match current debtor-to-creditor settlement plan.
- Payment amount must not exceed outstanding debt.
- Settlement must reject a second invoice mint for the same group with `InvoiceAlreadyMinted`.
- Token id counter increments with checked math.
- Public code does not use `unwrap`, `expect`, `panic`, assertions, or direct vector indexing.

## Settlement Flow

Inside `SettleGroup`:

1. Validate caller is a group member.
2. Reject if an invoice NFT already exists for the group.
3. Compute settlement transfers.
4. Calculate `total_settled`.
5. Read owner from the group creator, defined as first group member.
6. Allocate and increment `token_counter` safely.
7. Create `InvoiceNFT`.
8. Store it in `invoice_nfts`.
9. Emit `InvoiceNFTMinted`.
10. Reset balances to zero.
11. Emit `GroupSettled`.
12. Return `GroupSettlement`.

## Acceptance Criteria

- `createGroup` works.
- `addExpense` works.
- `confirmPayment` works.
- `settleGroup` works.
- NFT is minted on settlement.
- `GetInvoiceNFT` works.
- No wasm unreachable errors on validation failures.
- No enum mismatch between contract, IDL, generated client, and frontend.
