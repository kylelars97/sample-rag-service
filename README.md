# sample-rag-service

A local Retrieval-Augmented Generation (RAG) service that extracts atomic facts from Markdown documents, embeds them, indexes them in Qdrant, and uses a local LLM via Ollama to generate grounded answers.

## Quick Start

```sh
# 1. Install dependencies
npm install

# 2. Start Qdrant
docker compose -f docker/docker-compose.yml up -d

# 3. Install Ollama and pull models
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3
ollama pull nomic-embed-text

# 4. Configure environment
cp .env.example .env

# 5. Ingest seed data
npm run ingest

# 6. Start the server
npm start
```

Query the API:

```sh
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is GLOP?"}'
```

Health check:

```sh
curl http://localhost:3000/
```

## Environment Variables

| Variable             | Default                     | Required | Description                                                                 |
| -------------------- | --------------------------- | -------- | --------------------------------------------------------------------------- |
| `OLLAMA_BASE_URL`    | `http://localhost:11434`    | No       | URL of the Ollama API server                                                |
| `OLLAMA_CHAT_MODEL`  | `llama3`                    | No       | Ollama model used for chat/generation                                       |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text`          | No       | Ollama model used for embedding text into vectors                           |
| `QDRANT_URL`         | `http://localhost:6333`     | No       | URL of the Qdrant vector database instance                                  |
| `QDRANT_COLLECTION`  | `facts`                     | No       | Name of the Qdrant collection to store and query fact embeddings            |
| `PORT`               | `3000`                      | No       | Port the Fastify HTTP server listens on                                     |
| `SEED_DATA_PATH`     | `data/glop.md`             | No       | Path to the Markdown file ingested by `npm run ingest`                     |

All variables have sensible defaults for local development, so copying `.env.example` to `.env` is enough to get started.

## Scripts

| Script              | Description                     |
| ------------------- | ------------------------------- |
| `npm start`         | Start the server                |
| `npm run dev`       | Start server with watch reload   |
| `npm run ingest`   | Ingest seed markdown into Qdrant |
| `npm run build`    | Compile TypeScript               |
| `npm run test`     | Run tests                        |
| `npm run typecheck` | Type-check without compiling    |