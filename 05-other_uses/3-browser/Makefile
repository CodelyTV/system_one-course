start:
	@if lsof -nP -iTCP:3300 -sTCP:LISTEN >/dev/null 2>&1; then echo "Port 3300 is already in use: stop the other Jev Browser server first" >&2; exit 1; fi
	@[ -d node_modules ] || npm install
	@npx playwright install chromium
	node --env-file-if-exists=.env.local src/server.ts

test:
	npm run test
