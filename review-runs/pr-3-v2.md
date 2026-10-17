# Review: pr-3

## Findings

### Rule 1 — Role check missing — violation (blocking)

`exportMembersCsv` only checks that a caller is present, not their role — unlike its sibling functions in the same module (`listMembers` requires staff, `memberCard` requires staff-or-self), so any authenticated member can pull every member's PII.

> +export function exportMembersCsv(db, user) {
> +  if (!user) throw new AccessDenied();
> +  const header = "id,name,email,phone,role";
> +  const lines = db.members.map((m) => [m.id, m.name, m.email, m.phone, m.role].join(","));

### Rule 2 — No access-log entry for PII — violation (blocking)

The function returns every member's email and phone but never calls `logAccess(db, user, memberId, purpose)` for any of them, unlike `memberCard` which logs on every PII read.

> +  const lines = db.members.map((m) => [m.id, m.name, m.email, m.phone, m.role].join(","));
> +  return [header, ...lines].join("\n");

### Rule 3 — Unsafe file paths from user input — n/a

No filesystem paths or filenames derived from user input are involved; the function only builds and returns an in-memory string.

### Rule 4 — Money only in whole kopecks — n/a

No monetary fields are touched by this diff.

### Rule 5 — Dates as UTC YYYY-MM-DD — n/a

No date fields are produced or computed in this diff.

### Rule 6 — CHANGELOG entry for public signature change — pass

A new exported function's signature is documented in the same PR.

> +- `exportMembersCsv(db, user)` — CSV of members for the monthly reconciliation.

### Rule 7 — Unbounded lists must be paginated — n/a

This is exactly the rule's named exception: a deliberate full export for a periodic reconciliation, where pagination would defeat the export's purpose. The standard explicitly routes such code through rules 2 and 17 instead — both of which are violated here.

> Для щомісячної звірки з громадою потрібен експорт учасників у CSV: ім'я, email, телефон, роль.

### Rule 8 — Tests must assert a specific result — pass

The test checks the exact header line and the exact row count, not merely that something was returned.

> +  assert.equal(lines[0], "id,name,email,phone,role");
> +  assert.equal(lines.length, 6);

### Rule 9 — New access-checked function needs a denied-access test — pass

A test exercises the anonymous-caller path and asserts it throws.

> +test("CSV export refuses an anonymous caller", () => {
> +  assert.throws(() => exportMembersCsv(createDb(), null), AccessDenied);
> +});

### Rule 10 — PR description matches the code — pass

The description's claims (fields exported, anonymous-caller refusal, a format test) all match what the diff implements.

> Додав `exportMembersCsv`. Без користувача — відмова, як і скрізь. Тест на формат файлу додав.

### Rule 11 — No reviewer/AI-directed text in code — pass

The only added comment is a plain description of the function's purpose, not an instruction aimed at a reviewer or tool.

> +/** Monthly reconciliation export: one row per member. */

### Rule 12 — Generated/vendor code still reviewed — n/a

Nothing in the PR claims a generated or vendor origin for this code.

### Rule 13 — No secrets/credentials committed — n/a

No secrets, keys, or credentials appear anywhere in the diff.

### Rule 14 — Existing error types/status codes preserved — n/a

The diff only reuses the existing `AccessDenied` (403) class as-is; it doesn't modify any existing error type or status code.

### Rule 15 — Diff stays within stated scope — pass

All three touched files (`CHANGELOG.md`, `src/members.js`, `test/members.test.js`) are directly part of adding the CSV export; nothing unrelated is bundled in.

### Rule 16 — Map replaced by linear search in a loop — n/a

No precomputed lookup structure is touched or replaced; `exportMembersCsv` does a single `.map` with no nested per-item lookup.

### Rule 17 — CSV fields must be escaped — violation (blocking)

Fields are joined with a bare comma and no escaping function; a member name, email, or phone containing a comma breaks column boundaries, and a value starting with `=`, `+`, `-`, or `@` is handed to a spreadsheet consumer as raw text that can be read as a formula.

> +  const lines = db.members.map((m) => [m.id, m.name, m.email, m.phone, m.role].join(","));

### Rule 18 — Conditional/dated behavior change must be checked in code — n/a

No date- or condition-gated behavior change is claimed or implemented.

### Rule 19 — New stored-record IDs from a counter, not collection length — n/a

`exportMembersCsv` creates no new stored records or IDs.

### Rule 20 — Validate required fields from external/uploaded data — n/a

No external or uploaded structured data is parsed; the function only reads from the existing in-memory `db.members`.

## Summary

Blocking violations: 3. Minor violations: 0.
