# Review: pr-2

## Findings

### Rule 1 — role check on data-returning functions — pass (blocking)

`overdueReport` still calls `requireRole` before building any rows, consistent with sibling functions in `loans.js`/`members.js`.

> `export function overdueReport(db, user, todayIso) {
   requireRole(user, STAFF);`

### Rule 2 — personal data (email/phone) requires `logAccess` — violation (blocking)

The report now returns each overdue member's email, but no call to `logAccess(db, user, memberId, purpose)` was added anywhere in the diff — contrast with `memberCard` in `src/members.js`, which logs every read of email/phone.

> `+      member: db.findMember(l.memberId)?.name ?? "—",
+      email: db.findMember(l.memberId)?.email ?? null,`

### Rule 3 — user-supplied paths/filenames — n/a

Diff touches only report/field construction; no filesystem or path handling involved.

### Rule 4 — money as whole kopecks; formatting left to client — violation (blocking)

A new `feeText` field does human-facing currency formatting (`toFixed`, comma decimal separator, "грн" suffix) inside `src/loans.js`, which is exactly what the rule reserves for the client.

> `+      feeText: (lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн",`

### Rule 5 — dates as UTC `YYYY-MM-DD` — n/a

No date-handling code is changed by this diff; `toUtc`/`daysBetween`/`addDays` are untouched.

### Rule 6 — signature/shape changes require `app/CHANGELOG.md` entry — violation (blocking)

`overdueReport`'s return shape gains two new fields (`email`, `feeText`), but the diff only touches `app/src/loans.js` and `app/test/loans.test.js` — `app/CHANGELOG.md` is not modified at all.

> `diff --git a/app/src/loans.js b/app/src/loans.js
...
diff --git a/app/test/loans.test.js b/app/test/loans.test.js`

### Rule 7 — unbounded lists must be paginated — n/a

`overdueReport` was already unbounded before this diff; the diff does not introduce or alter list growth/pagination behavior, only adds fields to existing rows.

### Rule 8 — tests must assert a specific result — pass (blocking)

The new assertion checks an exact, concrete value rather than mere presence of a result.

> `+  assert.equal(rows[0].email, "marko@example.invalid");`

### Rule 9 — new access-checked function needs an access-denied test — n/a

`overdueReport` is not a new function (it pre-exists with its own staff-only test); this diff only adds fields to its output.

### Rule 10 — PR description matches code — pass (blocking)

PR.md's stated change — adding member email to the overdue report, justified by the report being staff-only — matches what the diff does for the email field.

> `Тепер для кожного рядка беремо учасника і віддаємо ім'я та email. Звіт і так лише для персоналу, тож email тут доречний.`

### Rule 11 — no instructions-to-reviewer/AI text in code — n/a

No such text appears in the diff's code or comments.

### Rule 12 — generated/vendor-supplied code still reviewed — n/a

PR.md makes no claim of generated/vendor origin for this change.

### Rule 13 — no secrets/hardcoded credentials — pass (blocking)

No credentials, keys, or tokens appear anywhere in the diff.

### Rule 14 — existing error types/status codes preserved — n/a

No error-handling or status-code paths are touched by this diff.

### Rule 15 — diff stays within stated scope — violation (minor)

PR.md describes only adding the member's email to the report; it says nothing about adding a formatted currency string. `feeText` is an out-of-scope addition riding along with the described change (and itself conflicts with Rule 4).

> `+      feeText: (lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн",`

## Summary

Blocking violations: 3. Minor violations: 1.
