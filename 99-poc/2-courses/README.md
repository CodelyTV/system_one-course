# How to start the project
Execute the following commands:
* `docker compose up`: This will start the database (postgres + pgvector + pg-jev) and Laya (a local model server compatible with the Jev API). pg-jev also calls Jev through Vercel AI Gateway, so export `VERCEL_AI_GATEWAY_API_KEY` first.
* `ollama serve`: This will start the models server.
* `ollama pull qwen3-embedding:4b`: To pull the embeddings model.
* `ollama pull llama3.1:8b`: To pull the course suggestions model.
* `pnpm install`: To install the dependencies.
* `pnpm create-courses`: To create the courses with their embeddings.
* `pnpm laya-mlx`: To start Laya MLX (Laya on Apple Silicon) outside Docker.
* `pnpm kev`: To start [Kev](https://github.com/jaredpalmer/kev) (Kev-4B by default, set `KEV_MODEL=jaredpalmer/kev-0.8b` for the small one) outside Docker. Export the same `KEV_MODEL` for `compare-searches`, and `KEV_THRESHOLD` to change the `jev()` threshold of Kev (default `0.5`).
* Postgres reaches Laya MLX and Kev through `host.docker.internal`. If your Docker runtime maps that host to a different address (for example, Dory), export `DOCKER_HOST_GATEWAY` (for Dory: `192.168.127.254`).
* `pnpm compare-searches "<prompt>"`: To compare the embeddings search with the pg-jev search through Laya, Laya MLX, Kev and Jev.
