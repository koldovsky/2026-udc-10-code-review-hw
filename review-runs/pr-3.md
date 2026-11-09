## Findings

1. **High — Missing staff authorization** — `app/src/members.js:12`.
   - Calling `exportMembersCsv(createDb(), { id: 1, role: "member" })` returns every member's email and phone, although `listMembers` requires staff and `memberCard` limits members to their own record.
   - **R1:** Replace the truthiness check with `requireRole(user, STAFF)` and add a member-denied test.

2. **Medium — Contact disclosure is not audited** — `app/src/members.js:14`.
   - A successful librarian export discloses all five seeded members' contact details while leaving `db.accessLog` empty.
   - **R2:** Call `logAccess(db, user, m.id, "members-csv")` once per exported member and assert the resulting audit entries.

3. **Medium — CSV fields are not escaped** — `app/src/members.js:14`.
   - A member named `Doe, Jane` produces six fields under a five-column header; embedded newlines create extra records and quotes are emitted unescaped.
   - **R10:** Encode CSV cells by quoting fields containing commas, quotes or line breaks and doubling embedded quotes; test those inputs.

4. **Medium — Export size has no bound** — `app/src/members.js:14`.
   - As `db.members` grows, every call serializes the entire collection into both an intermediate array and one response string, with no page-size limit.
   - **R7:** Add pagination with a validated, bounded page size and document the changed export contract in the changelog.

## Recommendation

**Do not merge** until these findings are fixed.

**Tests:** Not run; static review only, with no diff applied; the added anonymous-denial test does not cover rejection of an authenticated member.
