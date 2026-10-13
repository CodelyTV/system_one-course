curl https://ai-gateway.vercel.sh/v1/decisions \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  --json '{
    "model": "openai/gpt-6-luna-decisions",
    "input": "fire",
    "questions": [
      { "type": "predicate", "name": "burns", "instructions": "Does it burn?" }
    ]
  }' | jq
