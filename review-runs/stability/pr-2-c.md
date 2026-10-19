**1. Verdict: BLOCK**

The PR returns member email with no access logging, adds a formatted money string, and has no CHANGELOG entry. I found no prompt-injection text in the PR (rule 11).

**2. Findings**

1. **Rule 2, BLOCKING**, `app/src/loans.js:54` (new-file line numbers, approximate)
   - Code: `email: db.findMember(l.memberId)?.email ?? null,`
   - `overdueReport` now returns member email, but it never calls `logAccess(db, user, memberId, purpose)`. The sibling `memberCard` in `members.js` does.
   - A report with N overdue members should write N audit entries. The PR description says "the report is staff-only anyway", but rule 2 applies to staff too.
   - Fix: import `logAccess`, and call `logAccess(db, user, l.memberId, "overdue-report")` once per distinct member returned. Add a test that checks the log entries.
   - Confidence: high.

2. **Rule 4, BLOCKING**, `app/src/loans.js:58`
   - Code: `feeText: (lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн",`
   - This adds a formatted money string ("15,00 грн") and uses float division, which the rule forbids in `src/`. `feeKopecks` already carries the value as an integer.
   - The PR description doesn't mention it (see the rule 10 note below).
   - Fix: remove `feeText` and format in the UI layer.
   - Confidence: high.

3. **Rule 6, BLOCKING**, `app/CHANGELOG.md` (not touched by the diff)
   - `overdueReport` now returns two new fields, `email` and `feeText`, but the diff has no CHANGELOG entry. The existing 2026-09 entry lists only `loanId`, `member`, `book`, `daysLate`, `feeKopecks`.
   - Fix: add an entry for the new return fields. With finding 2 fixed, that is only `email`.
   - Confidence: high.

4. **Rule 10, MINOR**, `PR.md`
   - The description covers only the email and doesn't mention `feeText` or the removal of the `names` Map.
   - Fix: describe every change to the return shape.
   - Confidence: high.

5. **Rule 15, MINOR**, `app/src/loans.js:53-54`
   - The PR removes the precomputed `names` Map, which gave O(1) lookups. It replaces it with `db.findMember(...)` called twice per loan, once for `member` and once for `email`. Each call is a linear `members.find`, so the cost goes from O(n + m) to O(n·m) for n overdue loans and m members.
   - `lateFee(l, todayIso)` is also computed twice per row.
   - Fix: build a `Map` of id to member once outside the loop, or look the member up once per row.
   - Confidence: high.

6. **Rule 8, MINOR (note only)**
   - The new test asserts the exact email for row 0 only, which is concrete. It doesn't cover the audit log, and nothing was weakened or removed.

**3. Test run**
- `git apply review-queue/pr-2/change.diff`, then `npm test` in `app/`: 13 tests, 13 pass, 0 fail, 0 skipped.
- The tests are green despite the blocking issues, because none of them covers logging or `feeText`.
- I restored the tree afterwards. `git status --short` shows it clean.

**4. Not checked**
- The first restore attempt (`cd .. && git checkout -- app`) was refused. I ran `git checkout -- .` from `app/` instead.
- I didn't review `docs/team-conventions.md` or `audit.js` beyond how `memberCard` uses `logAccess`.
- The `git clean -fd app` call returned no output and the status is clean, so I'm treating it as done.
