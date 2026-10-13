start:
	@if lsof -nP -iTCP:3200 -sTCP:LISTEN >/dev/null 2>&1; then echo "Port 3200 is already in use: stop the other game server first" >&2; exit 1; fi
	@[ -d node_modules ] || npm install
	node src/server.ts

pilot:
	node --env-file-if-exists=.env.local src/pilot.ts

test:
	npm run test
