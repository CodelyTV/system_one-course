CLEF_MLX := git+https://github.com/daoa0601/clef-mlx@40c9ee6ddce1864060f187fe4cc34bee3d642ab9
CLEF_MODEL := models/clef-flash-8bit

.PHONY: start

start: $(CLEF_MODEL)
	CLEF_MODEL=$(CLEF_MODEL) exec uv run mlx_server.py

$(CLEF_MODEL):
	uvx --from "$(CLEF_MLX)" clef-mlx convert --model Cloudflare/clef-flash --out $@ --text-only
