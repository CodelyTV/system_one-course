---
name: customer-support-prioritize
description: Rank the Codely Retail customer support conversations by how urgent it is to answer them, using the customer-support MCP and TypeSafe's Jev score evaluation. Use when the user asks which support tickets or conversations to answer first, to prioritize, triage or score the support inbox.
disable-model-invocation: false
user-invocable: true
---

# Prioritize customer support conversations

Score every customer support conversation with Jev (`typesafe-ai/jev`) and tell which ones the team must answer first.

## Steps

### Step 1: Check the customer-support MCP

Call the `list_conversations` tool of the `customer-support` MCP server with `statuses: ["open", "pending"]` to confirm that it answers and to know how many conversations there are.

If the MCP server is not connected, tell the user to approve the `customer-support` server of `.mcp.json` (`/mcp`) and stop.

### Step 2: Score the conversations

Run the script from the project root:

```bash
node --env-file-if-exists=.env.local .agents/skills/customer-support-prioritize/scripts/prioritize-conversations.mts
```

The script connects to the same `customer-support` MCP server (it reads `.mcp.json`), gets the conversations with `list_conversations`, sends each one to Jev with a `score` question of five priority levels (Can wait, Low, Medium, High, Critical) and prints a Markdown table sorted by priority.

Options:

- `--statuses open,pending,snoozed` to choose the statuses (default `open,pending`).
- `--limit 10` to print only the first rows.

It needs `VERCEL_AI_GATEWAY_API_KEY` in the environment or in `.env.local`.

### Step 3: Report the result

1. Show the top 10 rows of the table.
2. For the top 3 conversations, call `get_conversation` of the `customer-support` MCP and explain in one sentence why each one is urgent and what the next action is.
3. Tell how many conversations are in each level.
4. Give the inbox link of each top conversation: `http://localhost:3100/#/<conversation id>`.
