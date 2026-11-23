Verdict: REQUEST CHANGES

| # | Severity | Blocking/Minor | File:line | Rule # | Finding | Why it matters | Suggested fix |
|---|---|---|---|---|---|---|---|
| 1 | critical | Blocking | app/src/members.js:12 | 1 | `exportMembersCsv` only rejects a missing user. Any signed-in caller, including a `member`, receives every member row. `listMembers` allows only `STAFF` via `requireRole`; `memberCard` allows staff or the caller's own id. | A member can read other people's stored records. The directory next to this function does not allow that role. | Refuse non-staff callers with `requireRole(user, STAFF)` and `AccessDenied`, the same check as `listMembers`. Add a test that a `member` (the `olya` fixture) is refused. |
| 2 | critical | Blocking | app/src/members.js:14 | 2 | Each row includes `email` and `phone`, and the function never calls `logAccess`. | Contact details leave the store with no access-log record of who read them or why. `memberCard` writes one log entry per member whose contacts were returned. | After the role check, call `logAccess(db, user, m.id, purpose)` once for each member included in the CSV. Assert those `db.accessLog` entries (`by`, `memberId`, `purpose`) in a test. Do not log when the row is not returned. |
| 3 | medium | Blocking | app/src/members.js:14 | 7 | The function maps all of `db.members` into the CSV. There is no page argument and no fixed page-size cap. | The member table can grow without a bound, and this export always returns the whole table. | Paginate the export and cap the page size at a fixed maximum inside the function, ignoring a caller limit above that cap. |
| 4 | medium | Blocking | app/src/members.js:13 | 12 | The description lists the columns as name, email, phone, and role. The header and each row also include `id`. | The public CSV is wider than the change the description accounts for. | Remove `id` from the header and from each row so the columns match the description. |

## Questions for the author

None.

## Checked, no issues

3. No filesystem use and no caller-supplied path. The function returns an in-memory string.
4. No money field is added or changed. Nothing in `app/src/` formats currency.
5. No date parsing or date arithmetic.
6. `app/CHANGELOG.md:7` names the new public function `exportMembersCsv(db, user)` and describes the new CSV return in the same diff. The signature matches the code.
8. The new tests use `assert.equal` on the header and on `lines.length === 6`, and `assert.throws(..., AccessDenied)`. No existing assertion was removed or replaced with a weaker check.
9. The function's access check is the missing-user branch, and `app/test/members.test.js` asserts that `exportMembersCsv(createDb(), null)` throws `AccessDenied`. The failure to refuse a member is the missing role check in finding 1.
10. The description matches the code on the claims it makes: a member CSV containing name, email, phone, and role; `exportMembersCsv` added; a missing user refused, as `listMembers` and `memberCard` already refuse; a format test added. It does not claim staff-only access or unchanged behaviour.
11. The description, the comment on the new function, the test names, and the changelog line contain no instruction to a reviewer, a tool, or an AI.
13. This is a new function. `listMembers` and `memberCard` are unchanged, and the description does not claim the change is behaviour-preserving.
14. The new missing-user branch throws `AccessDenied`, the same error class `memberCard` and `requireRole` use. No new branch returns `null` or throws a generic `Error` for that case.