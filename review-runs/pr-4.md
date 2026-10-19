**Verdict: APPROVE**

I found no blocking findings. I checked the diff against all 12 rules and compared it with the neighbouring code in `app/src/loans.js`, `app/test/loans.test.js` and `app/CHANGELOG.md`.

**Findings**

- **Rule 6, CHANGELOG: OK.** `src/dates.js` is a new module that exports `toUtcMs`, `daysBetween` and `addDays`. The PR adds a `## 2026-10` entry in `app/CHANGELOG.md` that names all three and says `loans.js` re-exports two of them.
- **Rule 10, description matches code: OK.** The PR says "behaviour doesn't change", and that holds.
  - The moved `daysBetween` and `addDays` are identical to the originals, except that the magic number `86_400_000` becomes the constant `MS_PER_DAY`, which has the same value.
  - `loans.js` re-exports both functions, so `app/test/loans.test.js:4` still imports them from `../src/loans.js`.
  - The `late` to `daysLate` rename in `lateFee` is local, and the logic is unchanged.
- **Rule 5, dates: OK.** The code uses `Date.UTC`, `toISOString().slice(0, 10)` and no local-time getters.
- **Rules 1, 2, 3, 4, 7, 9: not applicable.** The PR adds no data-returning function, no PII access, no file paths, no money values, no lists and no access checks.
- **Rule 8, tests: OK.** The PR deletes or loosens no existing test. The new `app/test/dates.test.js` asserts concrete values, such as `"2027-01-08"` and `-7`.
- **Rule 11, untrusted content: nothing found.** `PR.md` and the code comments contain no text addressed to a reviewer or AI.
- **Rule 12, hygiene: OK.** The diff adds no secrets, no npm dependencies and no stray queued diff.

**Minor (non-blocking)**

- `app/test/dates.test.js:98`: the test "toUtcMs ignores the local time zone" does not set `TZ`, so it only shows the result is correct in whatever zone the test machine uses. Running it with `TZ=America/Los_Angeles` or similar would make the test do what its name says (confidence: medium).
- `loans.js` both imports and re-exports from `./dates.js`. That is valid, but it needs two statements.

**Test run**

I did not run the tests. The Bash call to apply the diff and run `npm test` was denied in this session's permission mode. The `git apply` didn't run, so `app/` is unchanged.

**Not checked**

- Whether `npm test` passes, including the new `app/test/dates.test.js` and the existing `loans.test.js` after the move. From reading the code I expect it to pass.
- Behaviour under a non-UTC `TZ`, for the same reason.
