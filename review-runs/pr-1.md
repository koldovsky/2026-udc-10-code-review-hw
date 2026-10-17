# Review: pr-1

## Findings

### Rule 1 — role check on data-returning function — pass (blocking)

`listLoansPage` doesn't duplicate a role check, but it returns data exclusively through the already role-checked `listLoans`, so staff/member filtering is preserved.

> `const all = listLoans(db, user);`
> `return { items: all.slice(start, start + pageSize), page, pageSize, total: all.length };`

### Rule 2 — PII access logging — n/a

Loans data here carries no email/phone fields; `logAccess` doesn't apply to this diff.

### Rule 3 — user-supplied paths/filenames — n/a

No filesystem access is involved.

### Rule 4 — money as integer kopecks — n/a

The diff doesn't touch `feeKopecks`/`lateFee` or any monetary field.

### Rule 5 — dates as UTC `YYYY-MM-DD` — n/a

No date fields or calculations are touched by this diff.

### Rule 6 — CHANGELOG entry for public API changes — violation (blocking)

`listLoansPage` is a brand-new exported function in `src/loans.js` (a new public function counts as a change per the rule), but the diff touches only `app/src/loans.js` and `app/test/loans.test.js` — there is no corresponding hunk against `app/CHANGELOG.md`.

> `+export function listLoansPage(db, user, { page = 1, pageSize = 20 } = {}) {`

### Rule 7 — unbounded lists must be paged with a bounded page size — violation (blocking)

The function pages the output but places no upper bound on the caller-supplied `pageSize`, so a caller can still request the whole 3000+-row list in a single "page," defeating the stated purpose of pagination.

> `export function listLoansPage(db, user, { page = 1, pageSize = 20 } = {}) {`
> `  const all = listLoans(db, user);`
> `  const start = page * pageSize;`
> `  return { items: all.slice(start, start + pageSize), page, pageSize, total: all.length };`

### Rule 8 — tests must check a specific result — violation (blocking)

The new test asserts only on `total`, `page`, and `pageSize` (the latter two are pure pass-throughs of the input), and never checks `res.items` — the actual paginated payload. This also means the test doesn't catch that `start = page * pageSize` is off-by-one for 1-indexed pages: with `page: 1, pageSize: 20` the code slices `all.slice(20, 40)`, which on a 7-item total returns an empty `items` array for what should be the first page — and the test still passes because it never looks at `items`.

> `test("paged list reports the total and the page it returned", () => {`
> `  const res = listLoansPage(createDb(), iryna, { page: 1, pageSize: 20 });`
> `  assert.equal(res.total, 7);`
> `  assert.equal(res.page, 1);`
> `  assert.equal(res.pageSize, 20);`
> `});`

### Rule 9 — denied-access test for new access-checked function — n/a

`listLoansPage` follows the same soft role-filtering model as `listLoans` (member vs. staff see different rows, nobody is hard-denied) rather than the hard-deny model of `overdueReport`/`requireRole`; consistent with `listLoans` itself (which also has no "denied" test, only filtering tests), no denied-access test is expected here.

### Rule 10 — PR description matches code — pass (blocking)

The description's claims match what the diff does: a new `listLoansPage` with page/pageSize/total, `listLoans` left untouched, and a test added.

> `Додав listLoansPage — сторінки, розмір сторінки, загальна кількість. Старий listLoans не чіпав, щоб нічого не зламати. Тест додав.`

### Rule 11 — no text addressed to tools/reviewers in code — pass (blocking)

The only new comment is a plain doc comment describing the return shape, not an instruction to a reviewer or AI.

> `/** Paged variant for the staff UI: { items, page, pageSize, total }. */`

### Rule 12 — generated/vendor-origin code still reviewed — n/a

No claim of generated or vendor-supplied origin appears in `PR.md` or the diff.

### Rule 13 — no secrets/credentials — pass (blocking)

No credentials, keys, or tokens appear anywhere in the diff.

### Rule 14 — existing error types/status codes preserved — n/a

The diff doesn't touch `AccessDenied` or any status-code path.

### Rule 15 — diff stays within stated scope — pass (minor)

Only `src/loans.js` (new function) and `test/loans.test.js` (import update + new test) are touched, matching the stated scope exactly.

> `+import { listLoans, listLoansPage, borrow, lateFee, overdueReport, addDays, daysBetween, LOAN_DAYS } from "../src/loans.js";`

## Summary

Blocking violations: 3. Minor violations: 0.
