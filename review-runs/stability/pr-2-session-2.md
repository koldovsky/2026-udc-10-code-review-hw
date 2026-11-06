# PR-2 review

1. **High — Email disclosure lacks an audit entry.** `app/src/loans.js:54` returns `email` without calling `logAccess`; `overdueReport(createDb(), { id: 3, role: "librarian" }, "2026-10-08")` exposes three members' email addresses while leaving `db.accessLog` empty. **R2:** import and call `logAccess(db, user, memberId, "overdue-report")` once per distinct disclosed member, including when several overdue loans belong to that member.

2. **Medium — Repeated linear member searches regress report complexity.** `app/src/loans.js:53–54` calls `db.findMember` twice per overdue loan; `app/src/db.js` implements it with `members.find`. For 10,000 members and 10,000 overdue loans belonging to the last member, this performs 200,000,000 member comparisons instead of building 10,000 map entries and doing 10,000 map lookups. The member lookup work grows from O(M + L) to O(M × L); existing book lookups are unchanged. **R15:** build one member map and retrieve each member once per row.

3. **Medium — The response adds server-formatted money.** `app/src/loans.js:58` returns `feeText: "110,00 грн"` for seed loan 6 on `2026-10-08`, adding a localized money string alongside `feeKopecks: 11000`. **R4:** remove `feeText` and leave display formatting to consumers.

4. **Medium — The changed public response is undocumented.** `app/src/loans.js:54` adds `email` to the exported `overdueReport` contract, but the diff contains no `app/CHANGELOG.md` update; its existing entry lists only the previous fields. **R6:** document the added email field and any other retained response changes in the same PR.

**Merge recommendation:** Request changes.

**Tests:** Not run; static review only, with no isolated test workspace supplied.

