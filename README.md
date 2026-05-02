# sample-rag-service

A local Retrieval-Augmented Generation (RAG) service that extracts atomic facts from Markdown documents, embeds them, indexes them in Qdrant, and uses a local LLM via Ollama to generate grounded answers.

## Quick Start

The fastest way to get started is to use the setup script:

```sh
./scripts/setup.sh
```

This installs Deno, starts Qdrant, installs Ollama with required models, configures `.env`, ingests seed data, and starts the server — all in one go.

You can also run individual steps:

```sh
./scripts/setup.sh qdrant   # Start Qdrant only
./scripts/setup.sh ollama   # Install Ollama and pull models
./scripts/setup.sh ingest   # Ingest seed data
./scripts/setup.sh start    # Start the server
```

<details>
<summary>Manual setup</summary>

```sh
# 1. Install Deno
curl -fsSL https://deno.land/install.sh | sh

# 2. Start Qdrant
docker compose -f docker/docker-compose.yml up -d

# 3. Install Ollama and pull models
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3
ollama pull nomic-embed-text

# 4. Configure environment
cp .env.example .env

# 5. Ingest seed data
deno task ingest

# 6. Start the server
deno task start
```

</details>

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
| `PORT`               | `3000`                      | No       | Port the Deno HTTP server listens on                                        |
| `SEED_DATA_PATH`     | `data/glop.md`             | No       | Path to the Markdown file ingested by `deno task ingest`                   |
| `RAG_SERVICE_URL`   | `http://localhost:3000`     | No       | URL of the RAG service for acceptance tests                                |

All variables have sensible defaults for local development, so copying `.env.example` to `.env` is enough to get started.

## Tasks

| Task                      | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `deno task start`         | Start the server                               |
| `deno task dev`           | Start server with watch reload                 |
| `deno task ingest`        | Ingest seed markdown into Qdrant               |
| `deno task test`          | Run unit tests                                 |
| `deno task test:shell`    | Run shell script tests                         |
| `deno task test:acceptance`| Run acceptance tests against live RAG service  |

## Acceptance Testing

Acceptance tests validate the RAG service end-to-end using the prompts defined in `test/prompts.json`. Each prompt has an expected response, and the tests verify that the service returns answers containing the key information.

### Prerequisites

1. Start infrastructure services:

   ```sh
   docker compose -f docker/docker-compose.yml up -d qdrant ollama
   ```

2. Pull the Ollama chat model (if not already pulled):

   ```sh
   ollama pull llama3
   ```

3. Ingest seed data and start the server:

   ```sh
   deno task ingest
   deno task start
   ```

### Run Acceptance Tests

```sh
deno task test:acceptance
```

This sends each prompt from `test/prompts.json` to the running RAG service and checks that the answers contain relevant terms from the expected responses. A 60% pass rate threshold is applied to account for LLM output variability.

### Rhesis Integration (Advanced)

For LLM-as-judge evaluation using Rhesis, start the full Rhesis stack:

```sh
docker compose -f docker/docker-compose.yml up -d
```

This starts Rhesis (backend, worker, frontend, PostgreSQL, Redis) alongside Qdrant and Ollama. The Rhesis frontend is available at `http://localhost:3001`.

Then run the Python acceptance script:

```sh
pip install rhesis-sdk
python acceptance/run_acceptance.py
```

This uses the Rhesis SDK with Ollama (`llama3`) as the observe LLM to judge whether each answer contains the expected information.
