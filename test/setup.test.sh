#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SETUP_SCRIPT="$SCRIPT_DIR/../scripts/setup.sh"

pass=0
fail=0
incr_pass() { pass=$((pass + 1)); }
incr_fail() { fail=$((fail + 1)); }

assert_contains() {
  local label="$1" haystack="$2" needle="$3"
  if echo "$haystack" | grep -qF "$needle"; then
    echo "  PASS: $label"
    incr_pass
  else
    echo "  FAIL: $label"
    echo "    Expected to contain: $needle"
    echo "    Actual output: $haystack"
    incr_fail
  fi
}

assert_exit_code() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" -eq "$expected" ]; then
    echo "  PASS: $label"
    incr_pass
  else
    echo "  FAIL: $label"
    echo "    Expected exit code: $expected"
    echo "    Actual exit code: $actual"
    incr_fail
  fi
}

echo "=== setup.sh tests ==="

echo "Test: help flag shows usage"
output=$("$SETUP_SCRIPT" help 2>&1) || true
assert_contains "help contains 'Usage'" "$output" "Usage:"
assert_contains "help contains 'all'" "$output" "all"
assert_contains "help contains 'qdrant'" "$output" "qdrant"
assert_contains "help contains 'ollama'" "$output" "ollama"
assert_contains "help contains 'ingest'" "$output" "ingest"
assert_contains "help contains 'start'" "$output" "start"

echo "Test: --help flag shows usage"
output=$("$SETUP_SCRIPT" --help 2>&1) || true
assert_contains "--help contains 'Usage'" "$output" "Usage:"

echo "Test: -h flag shows usage"
output=$("$SETUP_SCRIPT" -h 2>&1) || true
assert_contains "-h contains 'Usage'" "$output" "Usage:"

echo "Test: unknown command exits with error"
output=$("$SETUP_SCRIPT" boguscommand 2>&1) && rc=$? || rc=$?
assert_exit_code "unknown command exits non-zero" 1 "$rc"
assert_contains "unknown command mentions error" "$output" "Unknown command"

echo "Test: script is executable"
if [ -x "$SETUP_SCRIPT" ]; then
  echo "  PASS: setup.sh is executable"
  incr_pass
else
  echo "  FAIL: setup.sh is not executable"
  incr_fail
fi

echo "Test: script has proper shebang"
first_line=$(head -1 "$SETUP_SCRIPT")
assert_contains "shebang line" "$first_line" "#!/usr/bin/env bash"

echo ""
echo "=== Results: $pass passed, $fail failed ==="
if [ "$fail" -gt 0 ]; then
  exit 1
fi
