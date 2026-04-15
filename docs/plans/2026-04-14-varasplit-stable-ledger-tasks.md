# VaraSplit Stable Ledger Task Plan

## Goal

Implement the stable ledger spec without trap-based validation, regenerate IDL/client artifacts, and align the frontend with generated `sails-js` calls and numeric/address ABI types.

## Preconditions

- Spec is complete in `2026-04-14-varasplit-stable-ledger-spec.md`.
- Architecture is complete in `2026-04-14-varasplit-stable-ledger-architecture.md`.
- Existing unrelated frontend workspace changes are left untouched.

## Ordered Tasks

1. Update contract state and DTOs with `invoices`, `Invoice`, and `[u8; 32]` public account fields.
2. Add `VaraSplitError` and convert every public route to `Result`.
3. Replace `assert!`, `assert_eq!`, `expect`, direct indexing, and panic-prone math with checked helpers.
4. Implement settlement invoice storage and `get_invoice`.
5. Update `gtest` coverage for success paths and validation failures.
6. Run `cargo clean`.
7. Run `cargo build --release`.
8. Run `cargo sails idl`.
9. Regenerate or verify typed clients produced by the repo build path.
10. Update frontend adapter/types so addresses use `Uint8Array`, group ids use `BigInt`, and amounts use `BigInt`.
11. Verify create, query, expense, payment confirmation, settlement, and invoice flows.

## Dependencies

- `sails-rs = 0.10.3` as pinned by the workspace.
- Existing `build.rs` and client crate generation flow.
- Frontend generated Sails client availability after IDL refresh.

## Verification Steps

- `cargo clean`
- `cargo build --release`
- `cargo sails idl`
- `cargo test`
- Frontend static validation using existing package scripts if present.

## Review Checkpoints

- No `unwrap`, `expect`, assertion macros, or direct vector indexing in exported service paths.
- Every exported route returns `Result`.
- All arithmetic that can overflow or underflow uses checked math.
- Invoice is stored before balances are reset.
- Frontend does not hand-build SCALE payloads.

## Rollback Notes

- Revert the contract, tests, generated IDL/client, and frontend adapter changes together because the public ABI changes as a unit.
