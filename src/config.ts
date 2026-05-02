export const OLLAMA_BASE_URL: string =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export const OLLAMA_CHAT_MODEL: string =
  process.env.OLLAMA_CHAT_MODEL ?? "llama3";

export const OLLAMA_EMBED_MODEL: string =
  process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

export const QDRANT_URL: string =
  process.env.QDRANT_URL ?? "http://localhost:6333";

export const QDRANT_COLLECTION: string =
  process.env.QDRANT_COLLECTION ?? "facts";

export const EMBEDDING_DIMENSION: number = 768;

export const SEED_DATA_PATH: string =
  process.env.SEED_DATA_PATH ?? "data/glop.md";
