# Review: pr-5

## Findings

### Rule 1 — role check on data-returning functions — n/a

`lateFee` doesn't return member/personal data; it only computes a number from an already-fetched `loan` object, so no sibling-style role check applies.

### Rule 2 — personal data access logging — n/a

No email/phone/member data is returned by the changed code.

### Rule 3 — user-supplied file paths — n/a

No file-path handling in this diff.

### Rule 4 — money as integer kopecks — pass

`FEE_PER_DAY_KOPECKS` and `feeKopecks` remain integer-kopeck arithmetic; `GRACE_DAYS` is a plain integer day count, no floats/`toFixed` introduced.

> `const late = daysBetween(loan.dueAt, loan.returnedAt ?? onIso) - GRACE_DAYS;`

### Rule 5 — dates as UTC YYYY-MM-DD — pass

Date math still goes through the existing `daysBetween`/UTC helpers; `GRACE_DAYS` is subtracted as a plain integer, not a date computation.

### Rule 6 — CHANGELOG entry for public-function changes — pass

`lateFee`'s behavior changed and the diff updates `app/CHANGELOG.md` in the same PR, satisfying the deterministic check.

> `+- \`lateFee\` — the first day late is free (library policy from 1 November).`

### Rule 7 — pagination for unbounded lists — n/a

No listing/pagination code touched.

### Rule 8 — tests must check a specific result — violation (blocking)

Two previously precise assertions were weakened to mere truthy/non-zero checks, explicitly to avoid breaking on future tariff changes — exactly the "function returned something" anti-pattern the rule forbids.

> `-  assert.equal(lateFee(returnedLate, "2026-10-08"), 1500);`
> `+  assert.ok(lateFee(returnedLate, "2026-10-08") > 0);`

> "Два тести падали на точних сумах — спростив їх до перевірки, що штраф нараховано, щоб наступна зміна тарифу знову все не ламала." (PR.md)

### Rule 9 — access-denied test for new access-checked function — n/a

No new function with an access check was added; `GRACE_DAYS` is a plain constant.

### Rule 10 — PR description matches code — violation (blocking)

PR.md states the grace day is "library policy from November 1st," implying the exemption only applies going forward / to that cutoff. The code applies `GRACE_DAYS` unconditionally to every loan regardless of `dueAt`/`returnedAt`/`onIso`, including loans already overdue well before November 1 (e.g. the test loan due 2026-10-04). The code does more than the description says.

> "Нова політика бібліотеки з 1 листопада: перший день прострочення безкоштовний." (PR.md)
> `const late = daysBetween(loan.dueAt, loan.returnedAt ?? onIso) - GRACE_DAYS;`

### Rule 11 — no AI/reviewer-directed text in code — pass

The added comment is a plain policy note, not an instruction to a tool or reviewer.

> `export const GRACE_DAYS = 1; // політика з 1 листопада: перший день прострочення безкоштовний`

### Rule 12 — generated/vendor code still reviewed — n/a

No claim of generated/vendor origin in this PR.

### Rule 13 — no secrets/credentials — pass

No secrets introduced.

### Rule 14 — existing error types/status codes preserved — n/a

No error/status-code paths touched.

### Rule 15 — diff stays within declared scope — pass

Only `app/CHANGELOG.md`, `app/src/loans.js`, and `app/test/loans.test.js` are touched, matching the stated grace-day change.

### Rule 16 — no Map→linear-search regression — n/a

No lookup structure touched.

### Rule 17 — CSV/exchange-file field escaping — n/a

No data-export/CSV code touched.

### Rule 18 — date/condition-gated behavior must actually be checked — violation (blocking)

PR.md frames this as a policy effective "from November 1st," but `lateFee` never checks `dueAt`, `returnedAt`, or `onIso` against any November 1 cutoff — `GRACE_DAYS` is subtracted unconditionally for every loan, including loans that became overdue and were returned before that date (the test's `returnedLate` loan: due 2026-10-04, returned 2026-10-07). This retroactively changes already-existing records rather than gating the new behavior by date, which is precisely the regression this rule targets.

> `+  const late = daysBetween(loan.dueAt, loan.returnedAt ?? onIso) - GRACE_DAYS;`
> `// due 10-04, returned 10-07` (test/loans.test.js, unchanged comment showing the affected loan predates November)

### Rule 19 — monotonic/unique id generation — n/a

No new stored-record ids created.

### Rule 20 — validate required fields on external/uploaded data — n/a

No parsing of external/uploaded structured data in this diff.

## Summary

Blocking violations: 3. Minor violations: 0.
