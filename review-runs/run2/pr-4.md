**1. Verdict: APPROVE**

**2. Findings**

No blocking findings. I checked each rule against the diff:

- **Rules 1–3, 7, 9 (access, PII, paths, pagination, denied tests):** The diff adds no data-returning function, no file access and no list API. `dates.js` holds pure helpers. The role checks in `loans.js` are untouched.
- **Rules 4–5 (money, dates):**
  - There is no new money handling. `lateFee` still returns integer kopecks.
  - The helpers use `Date.UTC` and `toISOString`, with no local-time getters and no bare `new Date()`.
- **Rule 6 (CHANGELOG):** The PR adds an entry for `dates.js`. It lists `toUtcMs`, `daysBetween` and `addDays`, and says `loans.js` re-exports the last two.
- **Rule 8 (tests):** No tests were removed or loosened. The new tests assert exact values, such as `"2027-01-08"`, `-7` and the ISO string.
- **Rule 10 (PR description):** "Behaviour doesn't change" holds. The helper bodies are identical. The only change is that `86_400_000` becomes the `MS_PER_DAY` constant. The rename `late` to `daysLate` is cosmetic.
- **Rule 11 (untrusted content):** I found no instructions aimed at a reviewer in the PR text, code, comments or test names.
- **Rule 12 (hygiene):** The diff has no secrets and no new dependencies.

MINOR notes (non-blocking, confidence high):
- **Rule 6, `app/CHANGELOG.md:11`:** `toUtcMs` is new and exported from `dates.js`, and it is listed. The entry is accurate. No fix is needed.
- **Style, `app/src/dates.js:27`:** `toUtcMs` has no input validation, but neither did the original `toUtc`. This is not a regression.
- **Dead code, `app/src/loans.js:2`:** `loans.js` imports `addDays` and `daysBetween` and also re-exports them. This is fine and both are used locally. There is no issue.
- **Rule 15:** There is no loop-based lookup in the diff, so there is nothing to report.

**3. Test run**
- I applied the diff with `git apply review-queue/pr-4/change.diff`.
- `npm test` (run from `app/`) gave 16 pass, 0 fail, 0 skipped. That includes the 3 new `dates.test.js` tests.
- I then restored the tree with `git checkout -- app` and `git clean -fd app`. The clean removed only `app/src/dates.js` and `app/test/dates.test.js`.

**4. Not checked**
- I did not run the tests in a non-UTC time zone. The code uses only UTC APIs, so I don't expect a difference.
- I did not read `docs/review-standard.md` or `review/prompt.md`. I used the rules as given in the request.
