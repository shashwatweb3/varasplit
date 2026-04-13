# VaraSplit Architecture

## Contract

- One Sails program with one service: `vara_split`
- Program owns a `RefCell<VaraSplitState>`
- Service owns all business logic and emitted events
- Group balances are tracked as signed integers per member
- Settlement is derived on demand from balances and persisted only as an emitted event plus command reply

## Frontend

- Next.js App Router app under `frontend/`
- Tailwind CSS v4 for styling
- Framer Motion for page transitions, modal animation, balance motion, and settlement celebration
- Lower-level `@gear-js/api` + `sails-js` browser-only integration to avoid App Router server issues
- Local optimistic state layer for instant UI feedback while queries refetch

## Wallet Strategy

- Extension-based wallet connection through Polkadot/Vara-compatible extensions
- UI distinguishes loading, missing extension, disconnected, and ready states
- Signed calls stay behind one-tap buttons
- Voucher or signless support is left as a config extension point, not hardcoded into the contract

## Settlement Model

- Input: signed member balances
- Output: deterministic transfer list from debtors to creditors
- Reset: all balances set to zero after settlement
- Share card uses the returned transfer list and total amount
