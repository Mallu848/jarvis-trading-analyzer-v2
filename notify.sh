#!/bin/bash
# notify.sh — drop this in every project root
# Usage: bash notify.sh "Your message here"

TOKEN="${JARVIS_TOKEN:-YOUR_BOT_TOKEN_HERE}"
CHAT_ID="${JARVIS_CHAT_ID:-YOUR_CHAT_ID_HERE}"
MESSAGE="$1"

if [ -z "$MESSAGE" ]; then
  echo "Usage: bash notify.sh 'Your message'"
  exit 1
fi

curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d chat_id="${CHAT_ID}" \
  -d text="${MESSAGE}" \
  -d parse_mode="Markdown" \
  > /dev/null

echo "✅ Notified: $MESSAGE"
