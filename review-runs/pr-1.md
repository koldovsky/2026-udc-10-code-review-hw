# PR-1 review

1. **Medium — `app/src/loans.js:32` — First page skips the first page of loans.**
   With the seeded database, `listLoansPage(db, iryna, { page: 1, pageSize: 20 })` returns no items despite seven loans; smaller pages permanently skip the first `pageSize` records when callers start at the documented default of page 1.
   **Rule:** R10.
   **Fix:** Validate positive integer page numbers, calculate `(page - 1) * pageSize`, and assert returned loan IDs for first, subsequent, and final pages.

2. **Medium — `app/src/loans.js:30` — Page size has no upper bound.**
   A caller can request arbitrarily large integer `pageSize` values; with enough loans, a request returns that many records and defeats the bounded pagination required for the growing staff list.
   **Rule:** R7.
   **Fix:** Require a positive integer page size and reject or clamp values above an explicit maximum.

3. **Medium — `app/src/loans.js:30` — New public function lacks a changelog entry.**
   The diff exports `listLoansPage` with a new options and response contract, but leaves `app/CHANGELOG.md` unchanged, so the new API is undocumented in the required release record.
   **Rule:** R6.
   **Fix:** Add an entry describing the signature, page numbering, size limit, response fields, and access behavior.

4. **Medium — `app/test/loans.test.js:15` — New access-controlled entry point has no denial test.**
   The only new test calls `listLoansPage` as a librarian; no test calls it with a missing user, so removal of its delegated authentication check would leave the new function's denial behavior untested.
   **Rule:** R9.
   **Fix:** Add a test asserting rejection for a missing user; also verify member results remain restricted to that member's loans.

**Merge recommendation:** Request changes.

**Tests:** Not run; static review only, without applying the diff or modifying the application.
