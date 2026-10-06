curl https://api.openai.com/v1/decisions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  --json '{
    "model": "gpt-6-luna",
    "state": { "thing": "fire" },
    "questions": {
      "burns": { "type": "noul", "instructions": "Does it burn?" }
    }
  }' | jq
