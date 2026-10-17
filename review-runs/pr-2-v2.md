# Review: pr-2

## Findings

### Rule 1 — Role check — pass (blocking)

`overdueReport` still gates on STAFF, consistent with sibling functions in the same module (`listMembers`, `memberCard` also use `requireRole(..., STAFF)`).

> `  requireRole(user, STAFF);`

### Rule 2 — Personal data access logging — violation (blocking)

The report now returns each member's `email` but never calls `logAccess(db, user, memberId, purpose)`. Compare with `memberCard` in `src/members.js`, which logs every read of email/phone. No such call was added here.

> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Rule 4 — Money formatting in src/ — violation (blocking)

A human-formatted, comma-decimal UAH string is now produced inside `src/loans.js`, not left to the client.

> `+      feeText: (lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн",`

### Rule 6 — CHANGELOG entry for signature/return-shape change — violation (blocking)

`overdueReport`'s return shape gained two new fields (`email`, `feeText`), but the diff only touches `app/src/loans.js` and `app/test/loans.test.js` — `app/CHANGELOG.md` is untouched.

> `diff --git a/app/src/loans.js b/app/src/loans.js` / `diff --git a/app/test/loans.test.js b/app/test/loans.test.js` (no `app/CHANGELOG.md` entry in the diff)

### Rule 8 — Test checks concrete value — pass

The new assertion checks an exact, specific value rather than mere truthiness.

> `+  assert.equal(rows[0].email, "marko@example.invalid");`

### Rule 9 — New access-checked function has a denied-access test — n/a

`overdueReport` is an existing function (pre-existing `requireRole` check), not a new one introduced by this diff.

### Rule 10 — PR description matches code — pass

PR.md states the report now returns name and email for staff only; the code does exactly that (role check retained, both fields added).

> "Звіт і так лише для персоналу, тож email тут доречний."

### Rule 11 — No AI/reviewer-directed imperative text in code — n/a

No such comments appear anywhere in the diff.

### Rule 12 — Generated/vendor-claimed code still reviewed — n/a

No such provenance claim is made for this change.

### Rule 13 — No secrets/credentials — n/a

No secrets or credentials appear in the diff.

### Rule 14 — Existing error types/status codes preserved — n/a

No error-handling code is touched by this diff.

### Rule 15 — Diff stays within stated scope — violation (minor)

PR.md describes only adding name/email per row ("Тепер для кожного рядка беремо учасника і віддаємо ім'я та email"); the diff additionally introduces an unrelated, undeclared `feeText` formatting field.

> `+      feeText: (lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн",`

### Rule 16 — Pre-built lookup replaced by repeated linear search in a loop — violation (blocking)

The one-time `Map` built before the loop is removed and replaced with `db.findMember(id)`, which does a linear `Array.find` over `db.members` — called twice per row (name and email) inside the `.map()` loop.

> `-  const names = new Map(db.members.map((m) => [m.id, m.name]));`
> `+      member: db.findMember(l.memberId)?.name ?? "—",`
> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Rule 17 — Data-interchange field escaping — n/a

No CSV/TSV or similar interchange-format output is touched.

### Rule 18 — Date/condition-gated behavior actually checked in code — n/a

PR.md makes no claim of a date- or condition-gated rollout.

### Rule 19 — New IDs from counter/uniqueness check, not length — n/a

No new identifier generation is introduced by this diff.

### Rule 20 — Validation of required fields in parsed external data — n/a

No parsing of external/uploaded structured data occurs in this diff.

## Summary

Blocking violations: 4. Minor violations: 1.
