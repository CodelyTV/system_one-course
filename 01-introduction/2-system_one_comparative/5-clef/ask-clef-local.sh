curl http://localhost:8787/v1/systemone \
  --json '{
    "model": "clef-flash",
    "state": { "thing": "fire" },
    "questions": {
      "burns": { "type": "noul", "instructions": "Does it burn?" }
    }
  }' | jq
