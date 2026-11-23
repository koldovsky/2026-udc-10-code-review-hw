Verdict: REQUEST CHANGES

| # | Severity | Blocking/Minor | File:line | Rule # | Finding | Why it matters | Suggested fix |
|---|---|---|---|---|---|---|---|
| 1 | critical | Blocking | app/src/members.js:12 | 1 | `exportMembersCsv` returns every member's row to any signed-in caller. The only guard is `if (!user)`. In the same module `listMembers` allows only `STAFF` via `requireRole`, and `memberCard` allows a member to read only `user.id`. `exportMembersCsv(createDb(), { id: 1, role: "member" })` returns `taras@example.invalid`, `+380000000002`, and the librarian and admin rows. | Another person's stored contact data is readable without the role check this module uses. | Call `requireRole(user, STAFF)` before building the CSV. Add a test that a `role: "member"` caller throws `AccessDenied`. |
| 2 | critical | Blocking | app/src/members.js:14 | 2 | Each mapped row includes `m.email` and `m.phone`, and the function never calls `logAccess`. | Email and phone leave the store with no access-log record of who read which member. | Call `logAccess(db, user, m.id, purpose)` once per member whose contact fields are included. Assert `db.accessLog` has one `[by, memberId, purpose]` entry per returned member, and no entry when those fields are omitted. |
| 3 | high | Blocking | app/src/members.js:14 | 16 | Fields are joined with `,` and written unchanged. Seed member 1's phone `+380000000001` is a cell that starts with `+`. A name or email that contains a comma, quote, or newline, or that starts with `=`, `+`, `-`, or `@`, is written through the same way. | A spreadsheet treats a leading `+` as a formula, so the phone is parsed as a formula. An unquoted comma shifts every later column. | Encode each field for CSV and neutralize a leading `=`, `+`, `-`, or `@`. Cover a phone that starts with `+` and a name that contains a comma. |
| 4 | low | Minor | app/src/members.js:13 | 12 | The description lists name, email, phone, and role. The header and every row also include `id`. | The description does not account for that column. No separate leak or crash follows from the extra id alone. | Name `id` in `review-queue/pr-3/PR.md` and in the changelog sentence, or drop the column. |

## Questions for the author

The export returns every member in one string for the stated monthly reconciliation. Is that whole-set export intentional?

## Checked, no issues

3. The diff does not read or write the filesystem and does not take a caller-supplied path. `exportMembersCsv` reads `db.members` and returns a string.
4. No money field is added or changed.
5. No date is parsed and no date arithmetic is added.
6. `app/CHANGELOG.md` adds `exportMembersCsv(db, user)` under `2026-10`, matching the new export's name and parameters.
7. The new list is a whole-set reconciliation export with that purpose stated in the description, the comment, and the changelog, so the missing page cap is the question above.
8. The new tests assert the header with `assert.equal` and `lines.length` equal to 6, and `assert.throws` with `AccessDenied`. No existing assertion is removed or replaced with a weaker check.
9. The new function checks access itself for a missing user, and the diff asserts that `null` throws `AccessDenied`.
10. The description's claims hold: the CSV contains name, email, phone, and role; a missing user is refused; a format test was added. The extra `id` column is finding 4.
11. The description, the code comment, the test names, and the changelog line do not address a reviewer, a tool, or an AI.
13. `listMembers` and `memberCard` are unchanged. The pull request adds a function; it does not present the edit as behaviour-preserving.
14. The new missing-user branch throws `AccessDenied`, the same class `memberCard` uses for a missing user. The wider role set is finding 1.
15. The new code maps `db.members` once. There is no search repeated inside that callback.
17. The diff assigns no new record ids.
18. The diff does not parse external input into storage.