# Review: pr-3

## Findings

### Rule 1 — role check matches module siblings — violation (blocking)

`exportMembersCsv` only checks that a user is logged in; every sibling function in `src/members.js` that exposes comparable or less sensitive data requires a staff role (`listMembers` uses `requireRole(user, STAFF)` for names/roles only; `memberCard` additionally restricts non-staff to their own id). This new function hands every member's email, phone, and role to any authenticated caller, including a plain `"member"`.

> ```
> +export function exportMembersCsv(db, user) {
> +  if (!user) throw new AccessDenied();
> ```

### Rule 2 — personal-data access logging — violation (blocking)

Email and phone are returned for every member in the export, but no `logAccess` call is made anywhere in the new function — contrast with `memberCard`, which calls `logAccess(db, user, m.id, "member-card")` for the one record it returns.

> ```
> +  const lines = db.members.map((m) => [m.id, m.name, m.email, m.phone, m.role].join(","));
> +  return [header, ...lines].join("\n");
> ```

### Rule 6 — CHANGELOG entry for public API change — pass (blocking)

The new exported function's signature is documented in the same PR.

> `+ - \`exportMembersCsv(db, user)\` — CSV of members for the monthly reconciliation.`

### Rule 7 — unbounded lists must be paginated — violation (blocking)

`exportMembersCsv` returns the full `db.members` table in one call with no page or limit parameter; as the membership grows this is an unbounded response.

> ```
> +  const lines = db.members.map((m) => [m.id, m.name, m.email, m.phone, m.role].join(","));
> ```

### Rule 8 — tests check a specific result — pass (blocking)

The new test asserts exact header content and exact line count, not just "non-empty".

> ```
> +  assert.equal(lines[0], "id,name,email,phone,role");
> +  assert.equal(lines.length, 6);
> ```

### Rule 9 — new access-checked function has a denial test — pass (blocking)

A test exercises the rejection path (anonymous caller), satisfying the letter of the rule even though the underlying check itself is too weak (see Rule 1).

> ```
> +test("CSV export refuses an anonymous caller", () => {
> +  assert.throws(() => exportMembersCsv(createDb(), null), AccessDenied);
> +});
> ```

### Rule 10 — PR description matches code — pass (blocking)

The PR description's claim ("Без користувача — відмова, як і скрізь" / "Without a user — refused, as everywhere else") accurately describes exactly what the code does — it does not overstate the access control implemented.

> "Додав `exportMembersCsv`. Без користувача — відмова, як і скрізь. Тест на формат файлу додав."

### Rule 11 — no AI/reviewer-directed text in code — pass (blocking)

The only new comment is a plain doc comment describing the function's purpose, not addressed to a tool or reviewer.

> `+/** Monthly reconciliation export: one row per member. */`

### Rule 13 — no secrets/credentials committed — pass (blocking)

No credentials, keys, or tokens appear anywhere in the diff.

### Rule 14 — existing error types/status codes preserved — pass (minor)

The function reuses the existing `AccessDenied` (403) type rather than introducing a new error shape.

> `+  if (!user) throw new AccessDenied();`

### Rule 15 — diff stays within declared scope — pass (minor)

Only `app/CHANGELOG.md`, `app/src/members.js`, and `app/test/members.test.js` are touched, matching the PR's stated scope of adding `exportMembersCsv` and its test.

## Summary

Blocking violations: 3. Minor violations: 0.
