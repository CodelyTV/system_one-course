curl https://ai-gateway.vercel.sh/typesafe/v1/systemone \
  -H "Authorization: Bearer $VERCEL_AI_GATEWAY_API_KEY" \
  --json '{
    "model": "typesafe-ai/jev",
    "state": { "thing": "fire" },
    "questions": {
      "burns": { "type": "noul", "instructions": "Does it burn?" }
    }
  }' | jq
