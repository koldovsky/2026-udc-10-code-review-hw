# Review: pr-4

## Findings

### Rule 1 — role check on data-returning functions — n/a (blocking)

`dates.js` only contains pure date-math helpers with no user/role parameter; it doesn't return member/loan data, so the role-check convention doesn't apply.

### Rule 2 — personal data access logging — n/a (blocking)

No email/phone or member data is touched by this diff.

### Rule 3 — user-supplied paths to filesystem — n/a (blocking)

No filesystem/path handling in this diff.

### Rule 4 — money as whole kopecks only — pass (blocking)

`FEE_PER_DAY_KOPECKS` and the `lateFee` multiplication are untouched except for a variable rename; no `toFixed`/decimal literals introduced.

> `-  const late = daysBetween(loan.dueAt, loan.returnedAt ?? onIso);
> -  return late > 0 ? late * FEE_PER_DAY_KOPECKS : 0;
> +  const daysLate = daysBetween(loan.dueAt, loan.returnedAt ?? onIso);
> +  return daysLate > 0 ? daysLate * FEE_PER_DAY_KOPECKS : 0;`

### Rule 5 — dates as YYYY-MM-DD, UTC computation — pass (blocking)

New `dates.js` module preserves the exact UTC-based implementation, and the new tests assert UTC behavior explicitly.

> `+export function toUtcMs(iso) {
> +  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
> +}`
> `+test("toUtcMs ignores the local time zone", () => {
> +  assert.equal(new Date(toUtcMs("2026-10-08")).toISOString(), "2026-10-08T00:00:00.000Z");
> +});`

### Rule 6 — CHANGELOG entry for public src/ signature changes — pass (blocking)

The diff introduces a newly-exported public function (`toUtcMs`, previously the private `toUtc` in `loans.js`) in a new `src/` module, and `app/CHANGELOG.md` is updated in the same PR describing exactly this move.

> `+## 2026-10
>
> +- \`src/dates.js\` — date helpers moved here from \`loans.js\` (\`toUtcMs\`, \`daysBetween\`, \`addDays\`); \`loans.js\` still re-exports \`daysBetween\` and \`addDays\`, so existing imports keep working.`

### Rule 7 — pagination for unbounded lists — n/a (blocking)

No list-returning functions are touched.

### Rule 8 — tests assert specific results — pass (blocking)

New tests in `test/dates.test.js` assert concrete expected values, not mere truthiness.

> `+test("addDays crosses month and year ends", () => {
> +  assert.equal(addDays("2026-12-25", 14), "2027-01-08");`

### Rule 9 — new access-checked function has a denied-access test — n/a (blocking)

No new function performs an access check; `dates.js` helpers take no `user` argument.

### Rule 10 — PR description matches the code — pass (blocking)

PR.md claims the helpers moved to a new module, `loans.js` re-exports them so imports don't break, a couple of variables were renamed for clarity, tests were added, and behavior is unchanged — all of which match the diff (`toUtc`/`late` → `toUtcMs`/`daysLate`, identical arithmetic, `export { addDays, daysBetween } from "./dates.js"`, new `dates.test.js`).

> PR.md: "`loans.js` реекспортує їх, тож імпорти не ламаються. Перейменував пару змінних для ясності, додав тести на хелпери. Поведінка не змінюється."

### Rule 11 — no imperative text to AI/reviewers in code — pass (blocking)

Comments in the new file are plain documentation, not instructions to a tool/reviewer.

> `+// Date helpers for YYYY-MM-DD strings, computed in UTC so the result does not
> +// depend on the machine's time zone.`

### Rule 12 — generated/vendor code still reviewed — n/a (blocking)

No claim of generated/vendor origin is made for this code.

### Rule 13 — no secrets/credentials — pass (blocking)

No credentials, keys, or tokens appear anywhere in the diff.

### Rule 14 — existing error types/status codes preserved — n/a (minor)

`auth.js` / `AccessDenied` (403) is not touched by this diff.

### Rule 15 — diff stays within stated scope — pass (minor)

All changes (helper extraction, re-export shim, one variable rename, new tests, changelog entry) match the PR's stated scope of a date-helper refactor; no unrelated changes are bundled in.

> `diff --git a/app/src/dates.js b/app/src/dates.js` / `diff --git a/app/test/dates.test.js b/app/test/dates.test.js` / `diff --git a/app/src/loans.js b/app/src/loans.js` (only extraction + rename) / `diff --git a/app/CHANGELOG.md b/app/CHANGELOG.md`

## Summary

Blocking violations: 0. Minor violations: 0.
