start:
	docker compose up

dev:
	npm run dev

db:
	npm run db:wait
	npm run db:schema
	npm run db:seed

.PHONY: claude-symlinks
claude-symlinks:
	@bash etc/scripts/generate-claude-symlinks.sh

.PHONY: junie-symlinks
junie-symlinks:
	@bash etc/scripts/generate-junie-symlinks.sh

.PHONY: cursor-symlinks
cursor-symlinks:
	@bash etc/scripts/generate-cursor-symlinks.sh
