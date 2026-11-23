Verdict: REQUEST CHANGES

| # | Severity | Blocking/Minor | File:line | Rule # | Finding | Why it matters | Suggested fix |
|---|---|---|---|---|---|---|---|
| 1 | critical | Blocking | `app/src/loans.js:54` | 2 | `overdueReport` returns `email` on every overdue row and never calls `logAccess`. For `overdueReport(db, iryna, "2026-10-08")` the rows include `marko@example.invalid`, `taras@example.invalid`, and `olya@example.invalid` while `db.accessLog` stays empty. `memberCard` logs one read per member whose contact details are returned. | Email is personal data. A staff-only role check does not replace the access log, and no existing test asserts `db.accessLog` for this report, so the suite stays green. | Look up the member once. If that row actually includes an email, call `logAccess(db, user, memberId, purpose)` once per distinct member, not once per loan and not when the email is absent. Assert the log the way `app/test/members.test.js` asserts `[by, memberId, purpose]`. |
| 2 | high | Blocking | `app/src/loans.js:58` | 4 | Each row adds `feeText`, built as `(lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн"`. Loan 6 on `2026-10-08` (11000 kopecks) becomes `"110,00 грн"`. | Money leaves `app/src/` as a formatted string. Display grouping, a decimal comma, and the currency word belong in the client. `feeKopecks` is already the integer contract. | Drop `feeText`. Keep `feeKopecks` as the only money field. |
| 3 | high | Blocking | `app/src/loans.js:47` | 6 | The return value of public `overdueReport` gains `email` and `feeText`. The diff does not change `app/CHANGELOG.md`. The current entry still lists only `loanId`, `member`, `book`, `daysLate`, and `feeKopecks`. | Callers cannot see the new contract from the changelog, and the old sentence now describes a different return value. | Add a changelog entry that names `overdueReport` and the new returned keys (and omit `feeText` if that field is removed). |
| 4 | high | Blocking | `app/src/loans.js:53` | 15 | The id-to-name `Map` is removed. The map callback calls `db.findMember` twice per overdue loan (`name` on line 53, `email` on line 54). `findMember` is `members.find`. A report with L overdue loans and M members now scans members twice per loan. | The index this function already built is gone, so the report is asymptotically worse on a growing member list. `findBook` was already a per-loan scan; this diff adds two more and deletes the map that avoided them. | Build one map from member id to `{ name, email }` (or look up each member once) and read both fields from that. |
| 5 | medium | Minor | `app/src/loans.js:58` | 12 | `review-queue/pr-2/PR.md:4` says each row gains the member's name and email. The same return object also adds `feeText`, which the description never mentions. | The formatted fee is extra public behaviour. The concrete contract break is covered by rules 4 and 6; this row is the scope gap. | Remove `feeText`, or describe that field in the pull request if it is kept. |
| 6 | medium | Minor | `app/src/loans.js:54` | 14 | A loan whose `memberId` is not in `db.members` yields `email: null`, while `member` and `book` in the same object use `"—"`. | The caller can tell the sentinels apart: null can mean "no email" or "no member". No new error class is thrown. | Use the same missing-value sentinel as `member` and `book`, or document null as "no email" only after a member row was found. |

## Questions for the author

The overdue report still returns every loan still out past due, with no page size. This diff does not introduce that bound. Is the whole set the reminder export you want, or should a later change cap it?

## Checked, no issues

1. `overdueReport` still calls `requireRole(user, STAFF)` before returning rows, the same staff gate as before. Roles are not widened, and the error is still `AccessDenied`.
3. The diff does not read or write the filesystem and does not take a caller-supplied path.
5. Due dates still go through `daysBetween` / `toUtc`. There is no `new Date` on a date-only string, no local getter, and no `toLocaleDateString`.
7. The report was already an unbounded whole set. This diff changes row fields only, so the missing cap is a question, not a block.
8. The new assertion is `assert.equal(rows[0].email, "marko@example.invalid")`. Existing `loanId`, `member`, `daysLate`, and `feeKopecks` checks are unchanged. Nothing was deleted or replaced with a truthiness check.
9. This diff does not add or change the access check. The denial test "the overdue report is staff-only" still expects `AccessDenied` for a member caller.
10. The description's claims hold for the code it describes: each overdue row still has the member name, now also `email`, and `requireRole(user, STAFF)` still limits the report to librarians and admins.
11. The description, diff, comments, test name, and changelog contain no instruction to approve, skip a rule, or ignore a file.
13. The pull request is not presented as behaviour-preserving. Filter, sort, `feeKopecks`, and the staff denial match the previous function; a missing member name is still `"—"`.
16. Nothing is written to CSV, HTML, a log line, or a spreadsheet. `feeText` is a returned string, not an export cell.
17. The diff assigns no new record ids.
18. The diff does not parse a file, CSV row, or request body into stored records.