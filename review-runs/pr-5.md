# Review: pr-5

## Findings

### Rule 1 — role check parity — n/a

`lateFee` is a pure fee calculation that takes no `user`/role argument and the diff doesn't add or remove any access control; unrelated to this change.

### Rule 2 — PII access logging — n/a

No email/phone/member-PII-returning function is touched by this diff.

### Rule 3 — path traversal — n/a

No file path or filename handling is touched.

### Rule 4 — money as integer kopecks — pass

`GRACE_DAYS` is a day count subtracted from the day-count variable, not from a money field, and the fee stays `late * FEE_PER_DAY_KOPECKS` (whole kopecks, no `toFixed`/fractional literals introduced).

> `const late = daysBetween(loan.dueAt, loan.returnedAt ?? onIso) - GRACE_DAYS;`

### Rule 5 — dates as UTC `YYYY-MM-DD` — pass

`daysBetween`/`toUtc` are untouched; the diff only adds an integer offset to the day count, no new date arithmetic is introduced.

### Rule 6 — CHANGELOG on public function signature/behavior change — pass

`lateFee`'s returned values change (grace day no longer billed), and the diff adds a corresponding entry in the same PR.

> `- \`lateFee\` — the first day late is free (library policy from 1 November).`

### Rule 7 — unbounded lists paginated — n/a

No list-returning function is touched.

### Rule 8 — tests check a concrete result — violation (blocking)

Both tests that previously asserted exact fee amounts were weakened to a bare truthiness/positivity check, which the standard explicitly calls out as "not a test." The PR even states the motive was to stop future tariff changes from breaking exact-value assertions — i.e., deliberately removing the regression protection those tests provided, rather than updating the expected values to the new (grace-day-adjusted) figures.

> `-  assert.equal(lateFee(returnedLate, "2026-10-08"), 1500);`
> `+  assert.ok(lateFee(returnedLate, "2026-10-08") > 0);`

> `-  assert.equal(rows[0].feeKopecks, 11000);`
> `+  assert.ok(rows[0].feeKopecks > 0);`

> (PR.md) «Два тести падали на точних сумах — спростив їх до перевірки, що штраф нараховано, щоб наступна зміна тарифу знову все не ламала.»

### Rule 9 — new access-checked function has a denied-access test — n/a

No new function with an access check is introduced; `GRACE_DAYS`/`lateFee` carry no role check.

### Rule 10 — PR description matches code — pass

PR claims "first day late is free"; the implementation subtracts exactly one grace day from the late-day count before billing, which matches (e.g. a loan 3 days late now bills 2 days instead of 3).

> `export const GRACE_DAYS = 1; // політика з 1 листопада: перший день прострочення безкоштовний`

### Rule 11 — no imperative text to AI/reviewer in code — pass

The only new comment is a factual policy note, not an instruction directed at a tool/reviewer.

> `// політика з 1 листопада: перший день прострочення безкоштовний`

### Rule 12 — generated/vendor code still reviewed — n/a

No claim of generated/vendor/spec-derived code in this PR.

### Rule 13 — no secrets/credentials — pass

No credentials, keys, or tokens appear anywhere in the diff.

### Rule 14 — existing error types/status codes preserved — n/a

No error-handling or access-denied code path is touched by this diff.

### Rule 15 — diff stays within stated scope — pass

All changes (CHANGELOG, `GRACE_DAYS`/`lateFee` in `loans.js`, the two affected tests) are directly tied to the stated grace-day policy change; no unrelated edits are bundled in.

## Summary

Blocking violations: 1. Minor violations: 0.
