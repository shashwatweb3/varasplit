# VaraSplit Invoice NFT Task Plan

## Goal

Implement NFT-based settlement invoices with safe Rust contract logic, regenerate ABI artifacts, and align the Next.js dApp with the new Sails interface.

## Preconditions

- Spec and architecture are complete.
- Previous stable-ledger work is treated as the baseline.
- Existing unrelated frontend generated folders remain untouched unless produced by validation.

## Ordered Tasks

1. Update contract state to `group_id_counter`, `token_counter`, `groups`, and `invoice_nfts`.
2. Replace `Invoice` with `InvoiceNFT` and remove `GetInvoice`.
3. Change `Group` balances from map to `Vec<MemberBalance>`.
4. Add `InvoiceAlreadyMinted` and `TokenIdOverflow` at the end of `VaraSplitError`.
5. Add `InvoiceNFTMinted` event.
6. Implement safe balance lookup/update helpers without direct indexing.
7. Implement `SettleGroup` NFT mint flow.
8. Update gtests for NFT minting and `GetInvoiceNFT`.
9. Run exactly `cargo clean`, `cargo build --release`, and `cargo sails idl`.
10. Update frontend IDL, adapter, and types for `InvoiceNFT`.
11. Run Rust tests and frontend lint/build.

## Dependencies

- Existing Sails 0.10.3 workspace.
- Polkadot extension wallet for browser signing.
- `sails-js` and `sails-js-parser` in the frontend.

## Verification Steps

- `cargo clean`
- `cargo build --release`
- `cargo sails idl`
- `cargo test`
- `npm run lint`
- `npm run build`

## Review Checkpoints

- Contract has no `unwrap`, `expect`, `panic`, assertions, or direct vector indexing in runtime code.
- Error enum order exactly matches the frozen order.
- IDL contains `[u8, 32]`, `result`, `InvoiceNFT`, and `GetInvoiceNFT`.
- Frontend calls `decodeAddress(address)` and passes the resulting `Uint8Array`.
- Frontend ABI numeric inputs use `BigInt`.

## Rollback Notes

- Revert contract, tests, generated client/IDL, and frontend adapter/types together because the ABI changes as a unit.
