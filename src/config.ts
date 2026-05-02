export const OLLAMA_BASE_URL = Deno.env.get("OLLAMA_BASE_URL") ?? "http://localhost:11434";

export const OLLAMA_CHAT_MODEL = Deno.env.get("OLLAMA_CHAT_MODEL") ?? "llama3";

export const OLLAMA_EMBED_MODEL = Deno.env.get("OLLAMA_EMBED_MODEL") ?? "nomic-embed-text";

export const QDRANT_URL = Deno.env.get("QDRANT_URL") ?? "http://localhost:6333";

export const QDRANT_COLLECTION = Deno.env.get("QDRANT_COLLECTION") ?? "facts";

export const EMBEDDING_DIMENSION = 768;

export const PORT = parseInt(Deno.env.get("PORT") ?? "3000", 10);

export const SEED_DATA_PATH = Deno.env.get("SEED_DATA_PATH") ?? "data/glop.md";