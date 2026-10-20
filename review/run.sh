#!/usr/bin/env bash
# Run /review for one queued PR in a fresh headless Claude Code session.
# Usage (from repo root): review/run.sh N [out-dir]
# Report -> <out-dir>/pr-N.md (verbatim); time/tokens/cost -> $TMPDIR/ws10-review-meta/cost.log
set -euo pipefail

n="${1:?usage: review/run.sh N [out-dir]}"
out="${2:-review-runs}"
meta="${TMPDIR:-/tmp}/ws10-review-meta"

[[ -f "review-queue/pr-$n/change.diff" ]] || { echo "no review-queue/pr-$n" >&2; exit 1; }
if [[ -n "$(git status --porcelain -- app)" ]]; then
  echo "app/ has local changes; refusing to run" >&2
  exit 1
fi
mkdir -p "$out" "$meta"

# Auth only (gateway URL + key helper) from user settings; no user hooks/permissions.
auth="$meta/auth-settings.json"
jq '{env, apiKeyHelper} | with_entries(select(.value != null))' ~/.claude/settings.json > "$auth"

# Project settings only (the /review command) + auth, no MCP servers, no session saved.
# dontAsk + allowlist: read-only tools plus the apply/test/restore steps; anything else is denied.
claude -p "/review $n" \
  --model opus \
  --output-format json \
  --no-session-persistence \
  --setting-sources project \
  --settings "$auth" \
  --strict-mcp-config \
  --permission-mode dontAsk \
  --allowedTools "Read" "Grep" "Glob" \
    "Bash(git apply:*)" "Bash(git checkout -- app)" "Bash(git clean -fd app)" \
    "Bash(git status:*)" "Bash(git diff:*)" \
    "Bash(cd app)" "Bash(npm test:*)" "Bash(npm --prefix app test:*)" "Bash(node --test:*)" \
    "Bash(grep:*)" "Bash(cat:*)" "Bash(sed -n:*)" "Bash(head:*)" "Bash(tail:*)" "Bash(wc:*)" "Bash(echo:*)" \
  --disallowedTools "Read(../**)" "Read(//**/*answers*/**)" "Grep(../**)" "Glob(../**)" \
    "Bash(*answers*)" "Bash(*../*)" \
  > "$meta/pr-$n.json"

if [[ "$(jq -r .is_error "$meta/pr-$n.json")" == true ]]; then
  echo "run failed: $(jq -r .result "$meta/pr-$n.json")" >&2; git checkout -- app && git clean -fdq app; exit 1
fi
# The answer key sits next to this repo; fail the run if the reviewer even tried to touch it.
if grep -qi 'answers' <(jq -c '.permission_denials' "$meta/pr-$n.json"); then
  echo "reviewer tried to read the answer key; run discarded" >&2; git checkout -- app && git clean -fdq app; exit 1
fi
jq -r '.result' "$meta/pr-$n.json" > "$out/pr-$n.md"
jq -r --arg n "$n" '"pr-\($n) \(now | todate) duration_s=\(.duration_ms / 1000 | floor) turns=\(.num_turns) cost_usd=\(.total_cost_usd) in=\(.usage.input_tokens) out=\(.usage.output_tokens) cache_read=\(.usage.cache_read_input_tokens) cache_write=\(.usage.cache_creation_input_tokens)"' \
  "$meta/pr-$n.json" | tee -a "$meta/cost.log"

# Belt and braces: the reviewer restores app/ itself, but never leave a queued diff applied.
git checkout -- app && git clean -fdq app
