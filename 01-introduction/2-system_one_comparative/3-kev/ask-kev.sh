curl http://localhost:8009/v1/systemone \
  --json '{
    "model": "kev-latest",
    "state": { "thing": "fire" },
    "questions": {
      "burns": { "type": "noul", "instructions": "Does it burn?" }
    }
  }' | jq
