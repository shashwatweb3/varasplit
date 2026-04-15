# VaraSplit Stable Ledger Architecture

## Summary

VaraSplit remains a single standard Sails program with one exported service. This release hardens the public contract by replacing traps with typed `Result` errors, adding persistent invoices, and keeping the generated IDL as the only supported frontend contract.

## Program And Service Boundaries

- Program: `Program`
- Constructor: `create() -> Self`
- Service: `vara_split`
- Public business logic lives behind `#[service(events = VaraSplitEvent)]`.
- No raw `gstd` message payload interface is introduced.

## State Ownership

`Program` owns `RefCell<VaraSplitState>`.

`VaraSplitState` owns:

- `groups: BTreeMap<u64, Group>`
- `invoices: BTreeMap<u64, Invoice>`
- `group_id_counter: u64`

`Group` owns group-local members, balances, and expense history. `Invoice` is stored separately by group id so the latest settlement can be read after balances are reset.

## Message Flow

- Create group: validate name and unique members, allocate checked group id, initialize balances, store group, emit event, return view.
- Add expense: validate group, caller, payer, amount, and description; split amount across members; update signed balances through checked math; append expense; emit event; return view.
- Confirm payment: validate group, caller, members, amount, and debtor-to-creditor direction; reduce the matching debt by checked balance updates; emit event; return view.
- Settle group: validate group and caller membership; compute transfers from balances; create invoice; store invoice; reset balances; emit event; return settlement.
- Read routes borrow state immutably and return typed errors for missing data.

No delayed messages, waitlist behavior, reservations, or async reply orchestration are needed.

## Routing And Public Interface

Existing public routes that must remain stable:

- `create_group`
- `add_expense`
- `confirm_payment`
- `settle_group`
- `get_group`
- `get_balances`
- `get_settlement_plan`

New routes introduced by this release:

- `get_invoice`

Any intentionally deprecated routes:

- None.

Whether any method signature or reply shape changes are proposed:

- Yes. Public methods now return `Result<_, VaraSplitError>`.
- `settle_group` reply includes `invoice`.
- Public account fields use `[u8; 32]` to align with decoded SS58 addresses represented as `Uint8Array` in the frontend.

## Event Contract

Existing events that must remain stable:

- `GroupCreated`
- `ExpenseAdded`
- `PaymentConfirmed`
- `GroupSettled`

Any new event surface introduced by this release:

- None.

Whether any existing event payload changes are proposed:

- Account fields move to `[u8; 32]` in line with route DTOs.

Whether event versioning is required:

- No, this is treated as an unreleased MVP workspace.

## Generated Client Or IDL Impact

- This release requires IDL regeneration.
- The Rust client crate consumes the generated IDL through the repo build flow.
- The frontend must consume the generated Sails JS client only.
- Old and new generated clients do not need to coexist.

## Contract Version And Status Surface

- No explicit version route is added in this release.
- No `Active` or `ReadOnly` lifecycle state is added.
- Old-version writes do not need to be disabled because no production cutover is in scope.

## Off-Chain Components

- Frontend address strings are decoded with `decodeAddress` before contract calls.
- Decoded addresses are passed as `Uint8Array`.
- `u64` group ids are passed as `BigInt`.
- `u128` amounts are passed as `BigInt`.
- The program id remains config-driven.
- No indexer changes are required.

## Release And Cutover Plan

- Build and test contract locally.
- Regenerate IDL and typed clients.
- Align frontend adapter with the new generated client.
- Run local gtest validation.
- Run frontend type/lint checks where available.

Frontend switch strategy:

- Replace any manual adapter payload logic with generated client calls after IDL refresh.

Indexer switch strategy:

- None.

Whether the old version remains queryable:

- Not applicable for this unreleased local MVP.

Whether writes to the old version are disabled:

- Not applicable.

## Failure And Recovery Paths

- Roll back by reverting the contract, generated client, IDL, and frontend adapter changes together.
- If IDL generation succeeds but frontend alignment fails, keep the Rust contract changes and finish adapter regeneration before deployment.
- If tests expose an ABI mismatch, treat the generated IDL as source of truth and update frontend call types.

## Open Questions

- None blocking implementation.
