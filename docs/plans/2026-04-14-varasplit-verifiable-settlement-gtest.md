# VaraSplit Verifiable Settlement Gtest Report

## Scope

- Settlement no longer zeroes balances or mints an invoice.
- Payment confirmation records verified contract payments and rejects invalid payment states.
- Finalization mints the invoice NFT only after all balances are zero and all planned payments are confirmed.

## Command

```bash
cargo test
```

## Result

Passed.

```text
running 9 tests
test create_add_and_settle_group_flow_works ... ok
test confirm_payment_records_full_matching_payment ... ok
test confirm_payment_rejects_amounts_above_outstanding_debt ... ok
test confirm_payment_rejects_double_confirmation ... ok
test finalize_settlement_rejects_incomplete_payments ... ok
test settle_group_mints_only_one_invoice_nft ... ok
test remainder_is_split_deterministically ... ok
test non_member_payer_is_rejected ... ok
test duplicate_members_are_rejected_without_trapping ... ok

test result: ok. 9 passed; 0 failed
```

## Notes

- `confirm_payment` requires the settlement plan to be started, the caller to match `from`, the payment to match the planned amount exactly, and no prior confirmation for that pair.
- `finalize_settlement` rejects incomplete balances/payments and prevents duplicate invoice minting.
