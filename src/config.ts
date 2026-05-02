export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "llama3";

export const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

export const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";

export const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? "facts";

export const EMBEDDING_DIMENSION = 768;

export const PORT = parseInt(process.env.PORT ?? "3000", 10);

export const SEED_DATA_PATH = process.env.SEED_DATA_PATH ?? "data/glop.md";
