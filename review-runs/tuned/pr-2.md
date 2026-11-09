- **High — `app/src/loans.js:55`: Email disclosure is not audited (R2).** Calling `overdueReport(createDb(), iryna, "2026-10-08")` now returns emails for members 5, 2 and 1 without recording any access: the function never calls `logAccess`, unlike `memberCard`. Import `logAccess` and record the reader, member and report purpose once per distinct disclosed member; test the resulting audit entries, including multiple overdue loans for one member.

- **Medium — `app/src/loans.js:59`: Server-formatted money violates the API contract (R4).** The seed report for `2026-10-08` now includes `feeText: "110,00 грн"` alongside `feeKopecks: 11000`. Monetary API values must remain integer kopecks with `…Kopecks` names. Remove `feeText` and format `feeKopecks` in the consuming presentation layer.

- **Medium — `app/src/loans.js:54`: Repeated member scans regress report complexity (R15).** `db.findMember` uses `members.find`; the new code calls it twice per overdue loan, replacing one member-map construction and constant-time name lookups. With 10,000 members and 10,000 overdue loans belonging to the last member, this performs 200,000,000 member comparisons instead of 10,000 map insertions and 10,000 name lookups; existing book lookup and sorting costs are unchanged. Build a map of member records once and retrieve each row's member once, then reuse its name and email.

- **Medium — `app/src/loans.js:55`: The public output change lacks a changelog entry (R6).** Every returned report row gains `email` and `feeText`, but the diff leaves `app/CHANGELOG.md` documenting only the previous fields. Add an entry describing the final public output contract, including `email` and its missing-member behavior, after resolving the money-formatting issue.

**Merge recommendation:** Request changes.

**Tests:** Not run; static review only, and the diff was not applied. The changed test asserts one email value but does not verify access logging or the lookup regression; the base already has an access-denied test for this existing function.
