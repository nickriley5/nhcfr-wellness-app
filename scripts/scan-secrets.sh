#!/usr/bin/env bash
set -euo pipefail

MODE="${1:---staged}"

FILES=()
if [[ "${MODE}" == "--all" ]]; then
  while IFS= read -r line; do
    FILES+=("${line}")
  done < <(git ls-files)
else
  while IFS= read -r line; do
    FILES+=("${line}")
  done < <(git diff --cached --name-only --diff-filter=ACMR)
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  exit 0
fi

BLOCKED_FILES=(
  ".env"
  ".env.local"
  "utils/localSecrets.ts"
)

ALLOWLIST_KEYS_IN=(
  "firebase.ts"
  "android/app/google-services.json"
  "ios/FirefighterWellnessApp/GoogleService-Info.plist"
)

PATTERNS=(
  "AIza[0-9A-Za-z_-]{35}"
  "sk-(?!YOUR|your)[A-Za-z0-9_-]{20,}"
  "sk-ant-(?!YOUR|your)[A-Za-z0-9_-]{20,}"
  "(NUTRITIONIX_APP_KEY|NUTRITIONIX_APP_ID|USDA_API_KEY|FATSECRET_CONSUMER_KEY|FATSECRET_CONSUMER_SECRET)\\s*[:=]\\s*['\"][A-Za-z0-9]{20,}['\"]"
)

contains_path() {
  local needle="$1"
  shift
  for item in "$@"; do
    if [[ "${item}" == "${needle}" ]]; then
      return 0
    fi
  done
  return 1
}

violations=0

for file in "${FILES[@]}"; do
  if [[ ! -f "${file}" ]]; then
    continue
  fi

  if contains_path "${file}" "${BLOCKED_FILES[@]}"; then
    echo "❌ Secret file staged: ${file}"
    violations=1
    continue
  fi

  allow_ai_key=false
  if contains_path "${file}" "${ALLOWLIST_KEYS_IN[@]}"; then
    allow_ai_key=true
  fi

  for pattern in "${PATTERNS[@]}"; do
    # Skip Google API key regex on known Firebase config files
    if [[ "${allow_ai_key}" == true && "${pattern}" == "AIza[0-9A-Za-z_-]{35}" ]]; then
      continue
    fi

    if rg -n --pcre2 -I "${pattern}" "${file}" >/dev/null 2>&1; then
      echo "❌ Possible secret detected in ${file}"
      rg -n --pcre2 -I "${pattern}" "${file}" || true
      violations=1
    fi
  done
done

if [[ ${violations} -ne 0 ]]; then
  echo
  echo "Commit blocked: potential secrets found."
  echo "If this is a false positive, redact or move it to .env/local secrets."
  exit 1
fi

echo "✅ Secret scan passed (${MODE})."
