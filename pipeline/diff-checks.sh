#!/usr/bin/env bash
# Deterministic checks from docs/review-standard.md, run on a unified diff of app/.
# Usage: git diff BASE...HEAD -- app | bash pipeline/diff-checks.sh
#        bash pipeline/diff-checks.sh < review-queue/pr-N/change.diff
# Exit 1 if any blocking check fails. Prints GitHub annotations (::error / ::warning).
set -uo pipefail

diff="$(cat)"
fail=0

# Added/removed lines tagged with their file: "<file>\t<+|->\t<text>"
lines="$(printf '%s\n' "$diff" | awk '
  /^\+\+\+ / { f = $2; sub(/^b\//, "", f); next }
  /^--- /    { next }
  /^[+-]/    { printf "%s\t%s\t%s\n", f, substr($0, 1, 1), substr($0, 2) }
')"
files="$(printf '%s\n' "$diff" | awk '/^\+\+\+ / { f = $2; sub(/^b\//, "", f); print f } /^--- a\// { f = $2; sub(/^a\//, "", f); print f }' | sort -u)"

added_in()   { printf '%s\n' "$lines" | awk -F'\t' -v re="$1" '$2 == "+" && $1 ~ re { print $1 ": " $3 }'; }
removed_in() { printf '%s\n' "$lines" | awk -F'\t' -v re="$1" '$2 == "-" && $1 ~ re { print $1 ": " $3 }'; }
error() { echo "::error title=$1::$2"; fail=1; }
warn()  { echo "::warning title=$1::$2"; }

# Rule 6: a changed export in src/ needs a CHANGELOG entry in the same PR.
if printf '%s\n' "$lines" | awk -F'\t' '$1 ~ /^app\/src\// && $3 ~ /^export /' | grep -q .; then
  grep -qx 'app/CHANGELOG.md' <<<"$files" \
    || error "rule 6: CHANGELOG" "exports in app/src changed but app/CHANGELOG.md is not in the diff"
fi

# Rule 4: no money formatting in src/.
hits="$(added_in '^app/src/' | grep -E 'toFixed|грн|/ ?100([^0-9]|$)')"
[[ -z "$hits" ]] || error "rule 4: money formatting in src/" "$(head -3 <<<"$hits" | tr '\n' ' ')"

# Rule 5: date math in UTC only.
hits="$(added_in '^app/src/' | grep -E '\.(get|set)(Date|Month|FullYear|Hours)\(|new Date\([0-9a-zA-Z_]+, ')"
[[ -z "$hits" ]] || error "rule 5: local-time date math" "$(head -3 <<<"$hits" | tr '\n' ' ')"

# Rule 8: exact assertions must not be replaced by weaker ones.
exact='assert\.(equal|strictEqual|deepEqual|deepStrictEqual|throws|rejects)\('
removed="$(removed_in '^app/test/' | grep -cE "$exact")"
added="$(added_in '^app/test/' | grep -cE "$exact")"
if (( removed > added )); then
  error "rule 8: tests weakened" "$removed exact assertions removed, $added added in app/test"
fi
hits="$(added_in '^app/test/' | grep -E '\.(skip|todo)\(|\{ ?(skip|todo): ?true')"
[[ -z "$hits" ]] || error "rule 8: tests skipped" "$(head -3 <<<"$hits" | tr '\n' ' ')"

# Rule 11: text in code addressed to reviewers / AI / CI.
hits="$(added_in '^app/' | grep -iE '(note|notice|instructions?|message)s? (for|to) (ai|llm|bots?|reviewers?|copilot|claude)|ai (code )?reviewers?|do not (report|flag|review)|ignore (all |any |the )?(previous|above|prior|rules?)')"
[[ -z "$hits" ]] || error "rule 11: text addressed to reviewers/tools" "$(head -3 <<<"$hits" | tr '\n' ' ')"

# Rule 13: no npm dependencies, no third-party imports.
hits="$(added_in '^app/package\.json$' | grep -E '"(dev|peer|optional)?[dD]ependencies"')"
[[ -z "$hits" ]] || error "rule 13: npm dependency" "$hits"
hits="$(added_in '^app/' | grep -E "(from|import\() *[\"'][^\"'./][^\"']*[\"']" | grep -vE "[\"']node:")"
[[ -z "$hits" ]] || error "rule 13: third-party import" "$(head -3 <<<"$hits" | tr '\n' ' ')"

# Rule 9 (advisory): new export in src/ without any new test.
if added_in '^app/src/' | grep -qE ': export (async )?function ' && ! added_in '^app/test/' | grep -qE '^[^:]+: *test\('; then
  warn "rule 9: no new tests" "new exported function in app/src but no new test( in app/test"
fi

(( fail )) && exit 1
echo "diff checks: ok"
