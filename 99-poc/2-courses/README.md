# How to start the project
Execute the following commands:
* `docker compose up`: This will start the database (postgres + pgvector + pg-jev) and Laya (the local model server that pg-jev uses).
* `ollama serve`: This will start the models server.
* `ollama pull qwen3-embedding:4b`: To pull the embeddings model.
* `ollama pull llama3.1:8b`: To pull the course suggestions model.
* `pnpm install`: To install the dependencies.
* `pnpm create-courses`: To create the courses with their embeddings.
* `pnpm compare-searches "<prompt>"`: To compare the embeddings search with the pg-jev search.
