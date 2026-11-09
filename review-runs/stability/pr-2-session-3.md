## Findings

1. **Medium — Email disclosures bypass the access log.** `app/src/loans.js:54` (new line).
   - Calling `overdueReport(createDb(), { id: 3, role: "librarian" }, "2026-10-08")` returns emails for members 5, 2, and 1, but leaves `db.accessLog` empty.
   - Unlike `memberCard`, this function neither imports nor calls `logAccess`; its existing role check does not record contact-data access.
   - **R2:** Call `logAccess(db, user, memberId, "overdue-report")` once per disclosed member, deduplicating members with multiple overdue loans.

2. **Medium — The API now returns formatted currency.** `app/src/loans.js:58` (new line).
   - For the seeded loan 6 on `2026-10-08`, the added field returns `feeText: "110,00 грн"`, embedding display formatting and a currency label in the public result.
   - **R4:** Remove `feeText`, keep integer `feeKopecks`, and format the amount in the consumer.

3. **Medium — Member resolution introduces repeated linear scans.** `app/src/loans.js:53–54` (new lines).
   - `db.findMember` uses `members.find`; both added calls scan the array independently for each overdue loan.
   - With 1,000 members and 1,000 overdue rows referring to members near the end of the array, member resolution can perform approximately 2,000,000 member comparisons; the base builds 1,000 map entries and performs 1,000 map lookups.
   - Member-resolution work therefore grows from O(M + K) to O(M × K), independently of the unchanged book lookups and sorting.
   - **R15:** Build one member-by-ID map and retrieve each row's member once.

4. **Medium — The changed public output contract lacks a changelog entry.** `app/src/loans.js:54` (new line; also line 58).
   - Consumers now receive `email` and `feeText`, but the PR does not change `app/CHANGELOG.md`, whose report entry lists only the original five fields.
   - **R6:** Add an entry describing the final public output change, including the email field and its audit behavior.

**Merge recommendation:** Request changes.

**Tests:** Not run; static review only, as instructed. The diff was not applied and the application was not modified. The existing access-denied test remains present; the added email assertion does not verify access logging.

