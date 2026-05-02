# sample-rag-service

Local Markdown-to-Facts RAG service using TypeScript, Fastify, Qdrant, and Ollama.

Instead of chunking raw text, this system extracts atomic factual statements from Markdown documents, embeds them, indexes them in a vector database, and uses a local LLM to generate grounded answers.

## Setup

1. Install dependencies:

```sh
npm install
```

2. Start Qdrant via Docker:

```sh
docker compose -f docker/docker-compose.yml up -d
```

3. Install Ollama and pull models:

```sh
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3
ollama pull nomic-embed-text
```

4. Copy `.env.example` to `.env` and adjust values if needed:

```sh
cp .env.example .env
```

## Usage

### Ingest markdown into the vector database

```sh
npm run ingest
```

### Start the server

```sh
npm start
```

For development with watch mode:

```sh
npm run dev
```

### Query the API

```sh
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is GLOP?"}'
```

### Health check

```sh
curl http://localhost:3000/
```

## Scripts

| Script            | Description                        |
| ----------------- | ---------------------------------- |
| `npm start`       | Start the server                   |
| `npm run dev`     | Start server with watch reload      |
| `npm run ingest`  | Ingest seed markdown into Qdrant    |
| `npm run build`   | Compile TypeScript                  |
| `npm run test`    | Run tests                           |
| `npm run typecheck` | Type-check without compiling     |

## Configuration

See `.env.example` for all available environment variables:

| Variable             | Default                       | Description                  |
| -------------------- | ----------------------------- | ---------------------------- |
| `OLLAMA_BASE_URL`    | `http://localhost:11434`      | Ollama API endpoint          |
| `OLLAMA_CHAT_MODEL`  | `llama3`                      | Chat model name               |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text`            | Embedding model name          |
| `QDRANT_URL`         | `http://localhost:6333`        | Qdrant API endpoint           |
| `QDRANT_COLLECTION`  | `facts`                       | Qdrant collection name        |
| `PORT`               | `3000`                        | Server listen port            |
| `SEED_DATA_PATH`     | `data/glop.md`               | Path to seed markdown file    |
