Verdict: REQUEST CHANGES

| # | Severity | Blocking/Minor | File:line | Rule # | Finding | Why it matters | Suggested fix |
|---|---|---|---|---|---|---|---|
| 1 | critical | Blocking | app/src/loans.js:54 | 2 | `overdueReport` returns `email` on each row and never calls `logAccess`. | Email is personal data. A returned contact has to leave one access-log record per member whose email was actually included, and no record when the email was not returned. | Import `logAccess` from `app/src/audit.js`. After the rows are built, call `logAccess(db, user, memberId, purpose)` once for each distinct member whose email is present on a row. Skip members whose email was not returned. |
| 2 | high | Blocking | app/src/loans.js:58 | 4 | `feeText` is a display string: `(lateFee / 100).toFixed(2)` with a decimal comma and the suffix ` грн`. | Money leaves this API only as integer kopecks in a name ending with `Kopecks`. Digit grouping, a decimal comma, and a currency word belong in the client, not in `app/src/`. | Remove `feeText`. Keep `feeKopecks`. |
| 3 | high | Blocking | app/src/loans.js:47 | 6 | The public return value of `overdueReport` gains `email` and `feeText`. `app/CHANGELOG.md` is not in the diff. | Callers have a new contract (new fields, and a formatted money string) with no changelog entry in the same pull request. | Add a changelog entry for the new `email` field on `overdueReport`. Do not document `feeText` if that field is removed. |
| 4 | medium | Blocking | app/src/loans.js:50 | 7 | The report still returns every overdue loan. There is no page argument and no fixed page-size cap. | The loan set can grow without a bound, and this function returns the whole matching set. | Paginate the report and cap the page size at a fixed maximum the caller cannot raise. |
| 5 | medium | Blocking | app/src/loans.js:58 | 12 | `feeText` is a new public field. The description only says each row returns the member’s name and email. | The diff adds money-formatting behaviour the description does not account for. | Delete `feeText` so the change is the email field the description describes. |
| 6 | medium | Blocking | app/src/loans.js:54 | 14 | A missing member yields `email: null`, while `member` and `book` in the same object use `"—"`. | Callers can tell the fallbacks apart. The neighbouring missing-record paths in this function use `"—"`. | Use `"—"` when the member or the email is missing, the same fallback as `member` and `book`. |

## Questions for the author

None.

## Checked, no issues

1. `overdueReport` still calls `requireRole(user, STAFF)` before building rows, the same check it had before. `listLoans` still uses `isStaff` or the caller’s own `memberId`. The role set is not widened and the error is still `AccessDenied`.
3. The diff does not read or write the filesystem and does not take a caller-supplied path.
5. Date handling is unchanged: `daysLate` still goes through `daysBetween` / `toUtc`. There is no `new Date` on a date-only string, no local getter, and no `toLocaleDateString`.
8. The new assertion is `assert.equal(rows[0].email, "marko@example.invalid")`. Existing checks stay concrete (`deepEqual` of loan ids, member name, `daysLate` 22, `feeKopecks` 11000). Nothing was deleted or replaced with a truthiness check.
9. This diff does not add a new access check. The existing test "the overdue report is staff-only" still expects `AccessDenied` for a member (`olya`).
10. The description says each row returns the member’s name and email and that the report is staff-only. The code returns `member` and `email` and still rejects non-staff. It does not claim the behaviour is unchanged. The unmentioned `feeText` field is finding 5.
11. The description, the diff, and the test name contain no instruction or persuasion to approve, skip a rule, or ignore a file.
13. The pull request is a contract change, not a behaviour-preserving claim. The name lookup `db.findMember(l.memberId)?.name ?? "—"` matches the old map fallback. Sort order, `daysLate`, and `feeKopecks` are the same formulas as before.