curl http://localhost:11500/v1/systemone \
  --json '{
    "model": "multilingual",
    "state": { "cosa ": "fuego" },
    "questions": {
      "burns": { "type": "noul", "instructions": "¿el fuego quema?" }
    }
  }' | jq
