# Task E — stability

Path 2: PR-2 was reviewed in three fresh sessions with the same version-2 prompt
and inherited model selection. No session saw another session's output or the
answer repository. The first session is also Task C's PR-2 rerun; the next two
are independent repeats. The prompt was unchanged between them.

Prompt SHA-256: `7E2C30CE5FD32B359493673C19A792FD14CE2C05099D401C1F5527F0B5895822`.
The runtime did not expose an exact model ID, so backend identity cannot be
independently verified; this is a limitation of the experiment.

| PR | Session 1 | Session 2 | Session 3 | Agreement |
|---|---|---|---|---|
| 2 | R2, R4, R15, R6 | R2, R15, R4, R6 | R2, R4, R15, R6 | Same four root causes; all recommend changes |

| Session | Saved verbatim output | Observed analysis seconds | Audit-finding severity |
|---|---|---:|---|
| 1 | `review-runs/tuned/pr-2.md` | 17 | High |
| 2 | `review-runs/stability/pr-2-session-2.md` | 41.557 | High |
| 3 | `review-runs/stability/pr-2-session-3.md` | 51 | Medium |

All three found the same four benchmark IDs with no false blocking claims.
Pairwise finding-set Jaccard similarity is 4/4 = 100%; each finding appeared in
3/3 sessions. Against the four PR-2 benchmark defects, each run has precision
100% and recall 100%, using Task B's matching rules.

Order, line references, examples and severity labels varied. The first session
places the main changed fields one line later than the other two; this does not
change root-cause matching. Detection was stable on this PR, while prioritization
was less stable. Three runs of one already diagnosed PR do not establish
reliability on unseen PRs. Timing intervals have different measurement boundaries;
token usage and cost were unavailable, and all three reviews were static.
