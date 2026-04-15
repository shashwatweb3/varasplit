# WorkPayoutProof

Standalone VaraSplit contract for the Work & Payouts module.

## Deploy

1. Build the optimized Wasm from this crate.
2. Deploy the generated `work_payout_proof.opt.wasm` to Vara testnet.
3. Copy the deployed program id into the frontend environment:

```bash
NEXT_PUBLIC_WORK_PAYOUT_PROGRAM_ID=0x...
```

The existing `VaraSplitEscrow` program id remains unchanged.

## Payout Model

`FundPayout` uses Gear/Vara message-with-value. The payer signs a contract message with the exact `total_amount` attached; the contract reads it from `msg::value()`.

`FinalizePayout` verifies the payout is funded, creates claimable payout records, mints the `ProofInvoice`, and stores the explorer reference.

`ClaimPayout` lets each recipient claim exactly one payout record from the invoice. The contract marks the record as claimed before sending value with `msg::send`, rolls back the claimed flag if the send fails, and prevents double claims.
