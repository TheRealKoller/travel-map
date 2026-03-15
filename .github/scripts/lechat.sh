#!/usr/bin/env bash
# Reusable helper: call Mistral chat completions with LECHAT_API_KEY.
#
# Usage:
#   lechat.sh <system_prompt_file> <user_prompt_file> [max_tokens]
#
# Outputs the assistant message content to stdout.
# Exits non-zero on API or parse error.

set -euo pipefail

SYSTEM_FILE="${1:?system prompt file required}"
USER_FILE="${2:?user prompt file required}"
MAX_TOKENS="${3:-1500}"

if [[ -z "${LECHAT_API_KEY:-}" ]]; then
  echo "Error: LECHAT_API_KEY is not set" >&2
  exit 1
fi

SYSTEM_CONTENT=$(cat "$SYSTEM_FILE")
USER_CONTENT=$(cat "$USER_FILE")

# Build JSON payload with jq so special characters are escaped correctly
PAYLOAD=$(jq -n \
  --arg sys "$SYSTEM_CONTENT" \
  --arg usr "$USER_CONTENT" \
  --argjson max "$MAX_TOKENS" \
  '{
    model: "mistral-large-latest",
    max_tokens: $max,
    messages: [
      { role: "system", content: $sys },
      { role: "user",   content: $usr }
    ]
  }')

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "https://api.mistral.ai/v1/chat/completions" \
  -H "Authorization: Bearer ${LECHAT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Error: Mistral API returned HTTP $HTTP_CODE" >&2
  echo "$BODY" >&2
  exit 1
fi

echo "$BODY" | jq -r '.choices[0].message.content'
