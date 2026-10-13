curl "$AZURE_ENDPOINT/providers/microsoft/v1/systemone" \
  -H "api-key: $AZURE_API_KEY" \
  --json '{
    "model": "'"$AZURE_DEPLOYMENT_NAME"'",
    "state": { "thing": "fire" },
    "questions": {
      "burns": { "type": "noul", "instructions": "Does it burn?" }
    }
  }' | jq
