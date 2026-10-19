# Task E (bonus) — Path 2: stability

Same reviewer (`/review 2`, `claude-sonnet-5-5`, the Task C config), same PR (**PR-2**: email
and `feeText` added to the overdue report), three new independent sessions run in parallel,
each in its own sandbox that held only `app/`, the docs, the reviewer config and `pr-2`.
Outputs, verbatim: `review-runs/stability/pr-2-a.md`, `-b.md`, `-c.md`. PR-2 was chosen
because it has four defects of different kinds (privacy, money format, changelog,
performance) and one that is easy to under-rate (the repeated lookup). Defect IDs are the
answer key's, as in `docs/review-scorecard.md`.

| PR | Session 1 | Session 2 | Session 3 | What matches |
|---|---|---|---|---|
| PR-2 · 2-D2 (email returned, no `logAccess`) | found, BLOCKING (rule 2) · «never calls `logAccess(db, user, memberId, purpose)`» | found, BLOCKING (rule 2) · «it never calls `logAccess(db, user, memberId, purpose)`» | found, BLOCKING (rule 2) · «never calls `logAccess(db, user, memberId, purpose)`» | Identical finding, rule and severity; all three also noted the "staff-only anyway" excuse does not apply. |
| PR-2 · 2-D3 (`feeText` money string) | found, BLOCKING (rule 4) · «formatted money string ("110,00 грн")» | found, BLOCKING (rule 4) · «adds a formatted money string ("15,00 грн")» | found, BLOCKING (rule 4) · «adds a formatted money string ("15,00 грн")» | Identical. |
| PR-2 · 2-D4 (no CHANGELOG entry) | found, BLOCKING (rule 6) | found, BLOCKING (rule 6) | found, BLOCKING (rule 6) | Identical. |
| PR-2 · 2-D1 (repeated lookup) | found, MINOR (rule 15), med · «from O(n + m) to O(m·n)» | found, MINOR (rule 15), med · «it's O(n·m)» | found, MINOR (rule 15), **high** · «the cost goes from O(n + m) to O(n·m)» | Same finding and same MINOR severity every time, with the complexity named. Confidence differs: sessions 1–2 said they had not opened `db.js`; session 3 stated "linear `members.find`" as fact. |
| Rule 10 (description omits `feeText`) | BLOCKING | BLOCKING | **MINOR** | Real but not in the key; severity differs between sessions. |
| Rule 8 (no access-log test) | MINOR | labelled BLOCKING, yet the text says "not a separate rule 8 violation" | MINOR | The only inconsistent label (see below). |
| Verdict / tests | BLOCK / 13 pass | BLOCK / 13 pass | BLOCK / 13 pass | Identical; every session applied the diff and ran `npm test`. |

Scoring with the same rules as Task B/C: **TP = 4/4 in all three sessions, FN = 0, FP = 0.**
One borderline: session 2's «Rule 8 … BLOCKING» heading is contradicted by its own text; if
counted as a false alarm, its precision would be 4/5 = 0.80. Cost per session: about $0.13
and 38–41 s (a little more than the $0.12 of the single Task C run).

What varied without changing the substance:
- **Line numbers.** The `email` line was cited as `+16`, `~55` and `54`; the `feeText` line
  as `+20`, `~60` and `58`. Only the third is close to the real file lines. A reviewer's line
  numbers should be treated as approximate. The quoted code is what identifies a finding.
- **Wording of the fix** for rule 2: one `logAccess` per row, per member, or per *distinct*
  member. Only the last two match the rule ("one entry per member whose data is returned").
- **Self-reported gaps.** Two sessions admitted they never opened `db.js`; one read the code
  closely enough to call the lookup linear. Both are reasonable; the stated confidence
  followed what each had actually read.
- **Process noise.** All three hit a refused restore command on their first try and recovered.
  It did not change findings, but the cleanup is fiddly for the model.

**Conclusion:** on this PR the reviewer is stable where it matters. The four seeded defects
were found, with the same rules and severities, in all three sessions, and the verdict was
the same. What is not stable is the periphery: the severity of extras that are not in the
key (rule 10, rule 8), the confidence level, and the exact line numbers. For a pipeline this
suggests treating the AI comment as a list of candidates to confirm, not a score to
threshold, and not gating on its extra findings. Limits of this evidence: one PR, three
samples, all with the same prompt and model; a PR with a subtler defect (such as the
PR-1 offset bug) might show more spread. I did not test the other five PRs, so this says
nothing about their stability.
