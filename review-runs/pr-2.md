## Findings

1. **Medium — email disclosure is not audited** (`app/src/loans.js:55`, new line; **R2**): `overdueReport(createDb(), { id: 3, role: "librarian" }, "2026-10-08")` returns emails for members 5, 2 and 1 while `db.accessLog` remains empty; unlike `memberCard`, this function never calls `logAccess`. Import and call `logAccess(db, user, memberId, "overdue-report")` once per disclosed member, deduplicating members with multiple overdue loans, and assert the audit entries in tests.

2. **Medium — API returns formatted money** (`app/src/loans.js:59`, new line; **R4**): the same report returns `feeText: "110,00 грн"` for loan 6, adding a server-formatted monetary field without a `Kopecks` suffix. Remove `feeText`, retain integer `feeKopecks`, and format money in the presentation layer.

3. **Medium — public output contract changed without a changelog entry** (`app/src/loans.js:55`, new line; **R6**): callers now receive `email` and `feeText`, but the diff contains no `app/CHANGELOG.md` update and its existing report entry lists only the old fields. Add an entry documenting the final output contract, including the new email field and audit behavior.

**Merge recommendation:** Request changes; all three findings block merging.

**Tests:** Not run; static review only, without applying the diff. The changed test checks the email value but does not assert access logging; the existing staff-only denial test remains intact.
