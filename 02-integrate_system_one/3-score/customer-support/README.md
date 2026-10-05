# Customer support

Intercom-like inbox for the Codely Retail customer support conversations, with an MCP server so an AI can read them.

All the conversations come from [`data/conversations.json`](data/conversations.json) (108 conversations).

## Commands

```bash
npm install
npm run start      # inbox on http://localhost:3100 (PORT to change it)
npm run mcp        # MCP server over stdio
npm run typecheck
```

It needs Node.js 24 or later: Node runs the TypeScript files directly.

## HTTP API

- `GET /api/conversations?status=open,pending` — conversations, newest first. All statuses if `status` is omitted.
- `GET /api/conversations/:id` — one conversation.

## MCP server

`.mcp.json` in the project root registers it as `customer-support`. Tools:

- `list_conversations({ statuses? })` — conversations with their customer and messages, newest first.
- `get_conversation({ id })` — one conversation.

The `customer-support-prioritize` skill (`.agents/skills/customer-support-prioritize/`) uses this MCP server and Jev to rank the conversations by priority.
