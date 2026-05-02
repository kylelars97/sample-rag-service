import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("config defaults", () => {
  it("config_DefaultValues_ReturnsExpectedDefaults", async () => {
    const { OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBED_MODEL, QDRANT_URL, QDRANT_COLLECTION, EMBEDDING_DIMENSION, PORT, SEED_DATA_PATH } = await import("../src/config.js");
    expect(OLLAMA_BASE_URL).toBe("http://localhost:11434");
    expect(OLLAMA_CHAT_MODEL).toBe("llama3");
    expect(OLLAMA_EMBED_MODEL).toBe("nomic-embed-text");
    expect(QDRANT_URL).toBe("http://localhost:6333");
    expect(QDRANT_COLLECTION).toBe("facts");
    expect(EMBEDDING_DIMENSION).toBe(768);
    expect(PORT).toBe(3000);
    expect(SEED_DATA_PATH).toBe("data/glop.md");
  });
});

describe("config environment overrides", () => {
  const originals: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ["OLLAMA_BASE_URL", "OLLAMA_CHAT_MODEL", "OLLAMA_EMBED_MODEL", "QDRANT_URL", "QDRANT_COLLECTION", "PORT", "SEED_DATA_PATH"]) {
      originals[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, val] of Object.entries(originals)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
  });

  it("config_EnvOverrides_ReturnsOverriddenValues", async () => {
    process.env.OLLAMA_BASE_URL = "http://custom:11434";
    process.env.OLLAMA_CHAT_MODEL = "custom-model";
    process.env.PORT = "4000";
    process.env.SEED_DATA_PATH = "data/custom.md";
    vi.resetModules();
    const config = await import("../src/config.js");
    expect(config.OLLAMA_BASE_URL).toBe("http://custom:11434");
    expect(config.OLLAMA_CHAT_MODEL).toBe("custom-model");
    expect(config.PORT).toBe(4000);
    expect(config.SEED_DATA_PATH).toBe("data/custom.md");
  });
});