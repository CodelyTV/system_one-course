curl https://api.openai.com/v1/decisions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  --json '{
    "model": "gpt-6-luna",
    "input": "fire",
    "questions": [
      { "type": "predicate", "name": "burns", "instructions": "Does it burn?" }
    ]
  }' | jq
