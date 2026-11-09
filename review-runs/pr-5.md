# PR-5 review

## Findings

1. **Medium — Apply the grace period only after the policy starts.**
   - **Location:** `app/src/loans.js:40`.
   - **Evidence:** The unconditional subtraction changes loan 4 (due `2026-10-04`, returned `2026-10-07`) from 1500 to 1000 kopecks, although the description and new comment say the policy starts on 1 November; an October one-day overdue loan likewise becomes free.
   - **Rule:** R10 — honor the policy's effective date.
   - **Fix:** Gate the grace period on the applicable effective date, using `returnedAt` for returned loans and `onIso` for outstanding loans; retain the previous fee before `2026-11-01` and test the boundary explicitly.

2. **Medium — Restore exact fee assertions.**
   - **Location:** `app/test/loans.test.js:40` and `app/test/loans.test.js:49`.
   - **Evidence:** Both replacements accept any positive fee, including 1 kopeck, so the October loan's incorrect 1000-kopek fee and the report's incorrect 10500-kopek fee pass instead of enforcing the existing 1500 and 11000 values.
   - **Rule:** R8 — tests must assert concrete results and must not be weakened to mask regressions.
   - **Fix:** Preserve exact pre-policy expectations and add exact checks for zero on the first overdue day and 500 kopecks on the second under the new policy.

## Recommendation

Request changes; both findings block merging.

## Tests

Static review only; no tests run, no diff applied, and no application files modified.
