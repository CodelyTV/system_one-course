start:
	npm run db:up
	npm run db:wait
	trap 'docker compose down' EXIT; npm run dev

stop:
	-pkill -f "$(CURDIR)/node_modules/[.]bin/next dev"
	docker compose down

dev:
	npm run dev

db:
	npm run db:wait
	npm run db:schema
	npm run db:seed
