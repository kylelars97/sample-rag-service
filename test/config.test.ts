import { assertEquals } from "@std/assert";
import {
  OLLAMA_BASE_URL,
  OLLAMA_CHAT_MODEL,
  OLLAMA_EMBED_MODEL,
  QDRANT_URL,
  QDRANT_COLLECTION,
  EMBEDDING_DIMENSION,
  PORT,
  SEED_DATA_PATH,
} from "../src/config.ts";

Deno.test("config_DefaultValues_ReturnsExpectedDefaults", () => {
  assertEquals(OLLAMA_BASE_URL, "http://localhost:11434");
  assertEquals(OLLAMA_CHAT_MODEL, "llama3");
  assertEquals(OLLAMA_EMBED_MODEL, "nomic-embed-text");
  assertEquals(QDRANT_URL, "http://localhost:6333");
  assertEquals(QDRANT_COLLECTION, "facts");
  assertEquals(EMBEDDING_DIMENSION, 768);
  assertEquals(PORT, 3000);
  assertEquals(SEED_DATA_PATH, "data/glop.md");
});

Deno.test("config_EnvOverrides_ReturnsOverriddenValues", async () => {
  const originalOllama = Deno.env.get("OLLAMA_BASE_URL");
  const originalChat = Deno.env.get("OLLAMA_CHAT_MODEL");
  const originalPort = Deno.env.get("PORT");
  const originalSeed = Deno.env.get("SEED_DATA_PATH");

  Deno.env.set("OLLAMA_BASE_URL", "http://custom:11434");
  Deno.env.set("OLLAMA_CHAT_MODEL", "custom-model");
  Deno.env.set("PORT", "4000");
  Deno.env.set("SEED_DATA_PATH", "data/custom.md");

  try {
    const mod = await import("../src/config.ts?_t=" + Date.now());
    assertEquals(mod.OLLAMA_BASE_URL, "http://custom:11434");
    assertEquals(mod.OLLAMA_CHAT_MODEL, "custom-model");
    assertEquals(mod.PORT, 4000);
    assertEquals(mod.SEED_DATA_PATH, "data/custom.md");
  } finally {
    if (originalOllama !== undefined) {
      Deno.env.set("OLLAMA_BASE_URL", originalOllama);
    } else {
      Deno.env.delete("OLLAMA_BASE_URL");
    }
    if (originalChat !== undefined) {
      Deno.env.set("OLLAMA_CHAT_MODEL", originalChat);
    } else {
      Deno.env.delete("OLLAMA_CHAT_MODEL");
    }
    if (originalPort !== undefined) {
      Deno.env.set("PORT", originalPort);
    } else {
      Deno.env.delete("PORT");
    }
    if (originalSeed !== undefined) {
      Deno.env.set("SEED_DATA_PATH", originalSeed);
    } else {
      Deno.env.delete("SEED_DATA_PATH");
    }
  }
});