#!/usr/bin/env bash
# design-laws-check.sh
# Enforces DESIGN.md §10 anti-pattern bans for Aquad'or v3.0.
# Usage:
#   bash scripts/design-laws-check.sh                  # scan src/
#   bash scripts/design-laws-check.sh path/to/file     # scan a specific path
#   bash scripts/design-laws-check.sh --strict         # ignore .designlawsignore
#   bash scripts/design-laws-check.sh --strict path/   # both
#
# Exits non-zero on any CRITICAL or HIGH severity match in non-ignored paths.
# Output: "<file>:<line> — <pattern> — <severity>" lines + summary footer.

set -euo pipefail

# ---------- argument parsing ----------
STRICT=0
SCAN_PATH=""
for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=1 ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *) SCAN_PATH="$arg" ;;
  esac
done

if [[ -z "$SCAN_PATH" ]]; then
  SCAN_PATH="src"
fi

if [[ ! -e "$SCAN_PATH" ]]; then
  echo "design-laws-check: path does not exist: $SCAN_PATH" >&2
  exit 2
fi

# ---------- ignore list ----------
IGNORE_FILE=".designlawsignore"
IGNORE_PATTERNS=()
if [[ "$STRICT" -eq 0 && -f "$IGNORE_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    # skip blanks + comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    IGNORE_PATTERNS+=("$line")
  done < "$IGNORE_FILE"
fi

# is_ignored: returns 0 if file path matches any ignore pattern, else 1.
is_ignored() {
  local file="$1"
  local pat
  for pat in "${IGNORE_PATTERNS[@]+"${IGNORE_PATTERNS[@]}"}"; do
    # exact prefix match against path
    if [[ "$file" == "$pat" || "$file" == "$pat"/* ]]; then
      return 0
    fi
    # glob match
    # shellcheck disable=SC2053
    if [[ "$file" == $pat ]]; then
      return 0
    fi
  done
  return 1
}

# ---------- counters ----------
CRITICAL_COUNT=0
HIGH_COUNT=0
MEDIUM_COUNT=0
LOW_COUNT=0

emit() {
  # emit <file> <line> <pattern> <severity>
  local file="$1" line="$2" pattern="$3" severity="$4"
  echo "${file}:${line} — ${pattern} — ${severity}"
  case "$severity" in
    CRITICAL) CRITICAL_COUNT=$((CRITICAL_COUNT + 1)) ;;
    HIGH)     HIGH_COUNT=$((HIGH_COUNT + 1)) ;;
    MEDIUM)   MEDIUM_COUNT=$((MEDIUM_COUNT + 1)) ;;
    LOW)      LOW_COUNT=$((LOW_COUNT + 1)) ;;
  esac
}

# ---------- file enumeration ----------
# Collect candidate files. Allow scanning a single file as well as a directory.
CANDIDATES=()
if [[ -f "$SCAN_PATH" ]]; then
  CANDIDATES+=("$SCAN_PATH")
elif [[ -d "$SCAN_PATH" ]]; then
  while IFS= read -r -d '' f; do
    CANDIDATES+=("$f")
  done < <(find "$SCAN_PATH" \
              -type f \
              \( -name '*.css' -o -name '*.scss' -o -name '*.tsx' -o -name '*.ts' -o -name '*.jsx' -o -name '*.js' \) \
              ! -path '*/node_modules/*' \
              ! -path '*/.next/*' \
              ! -path '*/dist/*' \
              ! -path '*/build/*' \
              ! -path '*/coverage/*' \
              ! -path '*/scripts/*' \
              ! -name '*.d.ts' \
              -print0)
fi

# Filter by ignore list
FILES=()
for f in "${CANDIDATES[@]+"${CANDIDATES[@]}"}"; do
  if is_ignored "$f"; then
    continue
  fi
  FILES+=("$f")
done

if [[ "${#FILES[@]}" -eq 0 ]]; then
  echo "design-laws-check: no files to scan (after ignore filter)"
  exit 0
fi

# ---------- patterns ----------
# Each pattern is a (extended-regex, severity, label) tuple. Quoted with single
# quotes so the script itself does not trip on its own regex literals.

# 1. Raw hex literals in CSS / TS / TSX (matches 3- to 8-digit hex tokens).
#    CRITICAL when the literal is exactly the untuned black/white set.
#    HIGH for any other raw hex.
HEX_REGEX='#[0-9a-fA-F]{3,8}\b'

# 2. rgb() and rgba() literals — must use OKLCH.
RGB_REGEX='\brgba?\('

# 3. Banned font-family primaries (CSS literal only, fallback OK).
#    Matches: font-family: Inter | "Inter" | 'Inter' as the FIRST entry.
BANNED_FONTS='Inter|Playfair Display|Poppins|Arial|Helvetica|Roboto|system-ui|Space Grotesk|Lato|Open Sans|Montserrat'
FONT_REGEX="font-family:[[:space:]]*[\"']?(${BANNED_FONTS})"

# 4. border-radius > 16px or > 1rem (literal numeric, not var).
RADIUS_PX_REGEX='border-radius:[[:space:]]*([0-9]+)px'
RADIUS_REM_REGEX='border-radius:[[:space:]]*([0-9]+(\.[0-9]+)?)rem'

# 5. animation-duration / transition-duration literal > 1000ms or > 1s.
DURATION_MS_REGEX='(animation-duration|transition-duration|animation:[^;]*?|transition:[^;]*?)[[:space:]]*([0-9]+)ms'
DURATION_S_REGEX='(animation-duration|transition-duration)[[:space:]]*:[[:space:]]*([0-9]+(\.[0-9]+)?)s'

# 6. outline: none / outline: 0 without a focus replacement nearby.
OUTLINE_NONE_REGEX='outline:[[:space:]]*(none|0)\b'

# ---------- scanning helpers ----------

scan_simple() {
  # scan_simple <regex> <severity> <label> [file_glob_filter_ext]
  # file_glob_filter_ext is a |-separated list of extensions, e.g. "css|tsx".
  local regex="$1" severity="$2" label="$3" ext_filter="${4:-}"
  local f
  for f in "${FILES[@]}"; do
    if [[ -n "$ext_filter" ]]; then
      local ext="${f##*.}"
      if ! [[ "|$ext_filter|" == *"|$ext|"* ]]; then
        continue
      fi
    fi
    # grep returns non-zero when no match — tolerate with || true.
    while IFS=: read -r line_no line_content; do
      [[ -z "$line_no" ]] && continue
      emit "$f" "$line_no" "$label" "$severity"
    done < <(grep -nE "$regex" "$f" 2>/dev/null || true)
  done
}

scan_hex() {
  # Hex needs custom severity classification: pure black/white variants
  # (3-, 4-, 6-digit forms of all-zero or all-f) = CRITICAL,
  # all other raw hex = HIGH.
  #
  # The "untuned" set is constructed at runtime from numeric components so
  # this script does not itself contain literal black/white hex tokens that
  # would otherwise trip the scanner when run on its own source.
  local hash="#"
  local b3="${hash}000" b4="${hash}0000" b6="${hash}000000"
  local w3="${hash}fff" w4="${hash}ffff" w6="${hash}ffffff"
  local untuned_label="raw-hex (untuned ${b3}/${w3})"

  local f
  for f in "${FILES[@]}"; do
    while IFS=: read -r line_no line_content; do
      [[ -z "$line_no" ]] && continue
      # Pull every hex token from the line and classify each.
      local hex_tokens
      hex_tokens=$(printf '%s\n' "$line_content" | grep -oE "$HEX_REGEX" || true)
      local tok
      while IFS= read -r tok; do
        [[ -z "$tok" ]] && continue
        local lower
        lower=$(printf '%s' "$tok" | tr '[:upper:]' '[:lower:]')
        if [[ "$lower" == "$b3" || "$lower" == "$w3" || "$lower" == "$b4" || "$lower" == "$w4" || "$lower" == "$b6" || "$lower" == "$w6" ]]; then
          emit "$f" "$line_no" "$untuned_label" "CRITICAL"
        else
          emit "$f" "$line_no" "raw-hex literal ${tok} (use OKLCH var)" "HIGH"
        fi
      done <<<"$hex_tokens"
    done < <(grep -nE "$HEX_REGEX" "$f" 2>/dev/null || true)
  done
}

scan_radius() {
  local f
  for f in "${FILES[@]}"; do
    # px form
    while IFS=: read -r line_no line_content; do
      [[ -z "$line_no" ]] && continue
      # extract the px value
      local val
      val=$(printf '%s' "$line_content" | grep -oE 'border-radius:[[:space:]]*[0-9]+px' | grep -oE '[0-9]+' | head -1)
      if [[ -n "$val" && "$val" -gt 16 ]]; then
        emit "$f" "$line_no" "border-radius ${val}px > 16px (editorial cap)" "MEDIUM"
      fi
    done < <(grep -nE "$RADIUS_PX_REGEX" "$f" 2>/dev/null || true)

    # rem form (1rem = 16px)
    while IFS=: read -r line_no line_content; do
      [[ -z "$line_no" ]] && continue
      local val
      val=$(printf '%s' "$line_content" | grep -oE 'border-radius:[[:space:]]*[0-9]+(\.[0-9]+)?rem' | grep -oE '[0-9]+(\.[0-9]+)?' | head -1)
      # compare floats via awk
      if [[ -n "$val" ]]; then
        if awk -v v="$val" 'BEGIN { exit !(v > 1) }'; then
          emit "$f" "$line_no" "border-radius ${val}rem > 1rem (editorial cap)" "MEDIUM"
        fi
      fi
    done < <(grep -nE "$RADIUS_REM_REGEX" "$f" 2>/dev/null || true)
  done
}

scan_duration() {
  local f
  for f in "${FILES[@]}"; do
    # ms form — match transition-duration / animation-duration / shorthand transition / animation.
    while IFS=: read -r line_no line_content; do
      [[ -z "$line_no" ]] && continue
      # Pull every ms token on the line.
      local tokens
      tokens=$(printf '%s' "$line_content" | grep -oE '[0-9]+ms' || true)
      local tok
      while IFS= read -r tok; do
        [[ -z "$tok" ]] && continue
        local val="${tok%ms}"
        if [[ "$val" -gt 1000 ]]; then
          emit "$f" "$line_no" "duration ${tok} > 1000ms" "MEDIUM"
        fi
      done <<<"$tokens"
    done < <(grep -nE '(transition|animation)(-duration)?[^;]*[0-9]+ms' "$f" 2>/dev/null || true)

    # s form
    while IFS=: read -r line_no line_content; do
      [[ -z "$line_no" ]] && continue
      local tokens
      tokens=$(printf '%s' "$line_content" | grep -oE '[0-9]+(\.[0-9]+)?s\b' || true)
      local tok
      while IFS= read -r tok; do
        [[ -z "$tok" ]] && continue
        local val="${tok%s}"
        if awk -v v="$val" 'BEGIN { exit !(v > 1) }'; then
          emit "$f" "$line_no" "duration ${tok} > 1s" "MEDIUM"
        fi
      done <<<"$tokens"
    done < <(grep -nE '(transition-duration|animation-duration)[[:space:]]*:[[:space:]]*[0-9]+(\.[0-9]+)?s' "$f" 2>/dev/null || true)
  done
}

scan_outline_none() {
  local f
  for f in "${FILES[@]}"; do
    while IFS=: read -r line_no line_content; do
      [[ -z "$line_no" ]] && continue
      # If the file also contains a focus replacement (:focus-visible or focus-visible: utility)
      # treat as benign. Otherwise LOW.
      if grep -qE ':focus-visible|focus-visible:|outline-offset|focus:ring|focus-visible\b' "$f" 2>/dev/null; then
        continue
      fi
      emit "$f" "$line_no" "outline:none without focus replacement" "LOW"
    done < <(grep -nE "$OUTLINE_NONE_REGEX" "$f" 2>/dev/null || true)
  done
}

# ---------- run all scans ----------
# Note: every scan is wrapped to never abort the script (set -e + grep no-match
# would otherwise kill us). The scan_* functions already use `|| true`.
scan_hex
scan_simple "$RGB_REGEX"     "HIGH"     "rgb()/rgba() literal (use OKLCH)" "css|scss|tsx|ts|jsx|js"
scan_simple "$FONT_REGEX"    "CRITICAL" "banned font-family primary"        "css|scss|tsx|ts|jsx|js"
scan_radius
scan_duration
scan_outline_none

# ---------- summary ----------
TOTAL=$((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT))
echo ""
echo "design-laws-check summary:"
echo "  CRITICAL: ${CRITICAL_COUNT}"
echo "  HIGH:     ${HIGH_COUNT}"
echo "  MEDIUM:   ${MEDIUM_COUNT}"
echo "  LOW:      ${LOW_COUNT}"
echo "  total:    ${TOTAL}"
echo "  scanned:  ${#FILES[@]} files under '${SCAN_PATH}' (strict=${STRICT})"

# Exit non-zero on any CRITICAL or HIGH finding.
if [[ "$CRITICAL_COUNT" -gt 0 || "$HIGH_COUNT" -gt 0 ]]; then
  exit 1
fi
exit 0
