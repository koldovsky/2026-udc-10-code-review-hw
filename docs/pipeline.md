# Review pipeline

## Behavior

`pipeline/ai-review.yml` is an inactive example, intentionally outside
`.github/workflows/`. It is not deployed by this homework.

1. `pull_request` runs `node --test` on the merge checkout with Node 22 and no dependency installation.
2. The AI job requires successful tests, skips drafts, forks and Dependabot, and runs on a separate fresh runner.
3. It checks out the exact base SHA, reads the trusted reviewer prompt and base app, and fetches the PR diff as data through GitHub's API.
4. A tool-free Responses API call produces an advisory comment labelled with the reviewed head SHA.
5. Missing API configuration is explicitly recorded as skipped; AI errors are advisory and never replace the required tests.
6. A human approves merging; configure branch protection to require `Required library tests`, never the advisory job.

To deploy in a separate fork, first merge the prompt into its trusted base, then
install the workflow there and configure `OPENAI_API_KEY` as a repository secret
and `AI_REVIEW_MODEL` as an available model ID in repository variables. This
homework does not require a key and made no paid API calls.

## Permissions and secrets

The workflow starts with no token permissions. Tests have `contents: read` only
and receive no API key. The separate AI job has `contents: read` and
`pull-requests: write` for its comment; it has no content-write capability and
checks out no PR code. Checkout credentials are not persisted. Fork PRs receive
tests only, with no AI job, API secret or attempt to post using a read-only token.
Dependencies are pinned to full action commit SHAs.

## Threat model

| Threat | Restriction in this workflow | Remaining limit |
|---|---|---|
| PR text tells the model to suppress findings or reveal credentials. | Trusted base prompt is in `instructions`; PR content is input data; no model tools or execution; credentials are never included in model input. | The model may still be manipulated into a bad review; humans inspect findings. |
| A PR changes its prompt or adds a malicious script. | AI reads the base SHA, never executes the head, and uses an inline workflow script. | Changes to the workflow itself require human review and protected ownership before deployment. Same-repository contributors with workflow-edit rights remain trusted. |
| A malicious test steals credentials or edits the repository. | Test runner has no API key, read-only contents permission and no persisted checkout credentials; AI uses a different runner. | Tests can run arbitrary code and access the network on their disposable runner. |
| A fork attempts to obtain secrets or a write token. | `pull_request`, no `pull_request_target`, and explicit same-repository AI condition. | Forks require manual AI review; do not enable sending secrets or write tokens to forks. |
| A large diff creates excessive cost or is silently truncated. | Reject diffs over 100 KB and total inputs over 200 KB, cap output at 6000 tokens, use API/job timeouts and cancel superseded runs. | Repeated same-repository runs still cost money; set provider budget limits. |
| A new commit makes the result obsolete. | Check head and base SHAs before and after generation, cancel older runs, label the comment with the head SHA. | A commit can race with posting; the visible SHA lets the human reject a stale comment. |
| Model output contains malicious Markdown or mass mentions. | Post it inside a text fence, replace backticks and neutralize `@` mentions; never execute output. | Advice itself may be wrong and must be verified. |
| Repository content is sent to an external provider. | Send only bounded PR evidence and base app; `store: false`; no credentials in payload. | A maintainer must authorize the provider for the repository's data before deployment. |

## Human responsibilities

Protect required checks and workflow/prompt changes, verify access-control and
privacy findings, investigate missing coverage, and approve merging. A green test
job and an AI comment are not proof of correctness. Skips and failures must never
be presented as a completed AI review.

## References

- [GitHub workflow permissions and job syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
- [GitHub runner compromise and fork restrictions](https://docs.github.com/en/actions/concepts/security/compromised-runners).
- [OpenAI text generation and Responses API](https://developers.openai.com/api/docs/guides/text).

Local validation passed: `npx --yes yaml valid < pipeline/ai-review.yml` returned
exit code 0, and `node --check` accepted the extracted inline JavaScript wrapped
in an async function. No workflow has been run on GitHub; provider access and
comment posting have not been exercised.
