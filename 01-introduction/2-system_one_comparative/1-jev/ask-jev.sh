curl https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  --json '{
    "model": "jev-latest",
    "state": { "thing": "fire" },
    "questions": {
      "burns": { "type": "noul", "instructions": "Does it burn?" }
    }
  }' | jq
