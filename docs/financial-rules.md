# Financial rules (initial version)

- Authoritative money values use integer minor units (`bigint` in PostgreSQL, integer in TypeScript). Convert to a decimal only for display.
- Transaction direction is explicit. `income` increases income totals; `expense` contributes to gross expenses; `refund` reduces the net expense metric; `transfer` is excluded from income and expenses.
- The current lightweight ledger summary treats all loaded expenses as gross and subtracts refunds. Reports should expose gross expense and net expense separately when their semantics are implemented.
- Account balance calculations must start with opening balances and apply posted transactions using account-specific rules. Consolidated transfer pairs net to zero; credit balances are liabilities and are not available cash.
- Safe-to-spend is `max(0, available cash - protected commitments - safety buffer)`. Missing data must remain unknown rather than silently becoming zero.
- Budget remaining is `limit - eligible net spending`; negative values indicate an overrun. Zone thresholds: green above 20% remaining, yellow from 5% through 20%, red below 5% or over limit. Thresholds need product review before release.
- A forecast is an estimate, never a guaranteed balance. No forecast is currently produced by the app.
- Goal contribution rows are the future source of truth for progress; goal targets do not imply funds have been transferred to a separate account.
