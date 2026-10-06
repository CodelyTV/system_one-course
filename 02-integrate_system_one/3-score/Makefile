start:
	@if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then echo "Port 3000 is already in use: stop the other dev server first" >&2; exit 1; fi
	@if lsof -nP -iTCP:3100 -sTCP:LISTEN >/dev/null 2>&1; then echo "Port 3100 is already in use: stop the other customer support inbox first" >&2; exit 1; fi
	npm run db:up
	npm run db:wait
	node customer-support/src/server.ts & SUPPORT_PID=$$!; trap 'kill $$SUPPORT_PID 2>/dev/null; docker compose down' EXIT; trap 'exit 130' INT TERM; npm run dev

dev:
	npm run dev

db:
	npm run db:wait
	npm run db:schema
	npm run db:seed

score-customer-support:
	node .agents/skills/customer-support-prioritize/scripts/prioritize-conversations.mts
