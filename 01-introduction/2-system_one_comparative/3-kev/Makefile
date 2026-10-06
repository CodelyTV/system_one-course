KEV_MODEL ?= jaredpalmer/kev-0.8b
KEV_DIR := .kev

.PHONY: start

start: $(KEV_DIR)
	cd $(KEV_DIR) && exec uv run --extra serve python -m kev.serve --run $(KEV_MODEL) --port 8009

$(KEV_DIR):
	git clone https://github.com/jaredpalmer/kev.git $(KEV_DIR)
	cd $(KEV_DIR) && uv sync --extra serve
