import { describe, it, expect, vi, beforeEach } from "vitest";
import { runIngest } from "../src/ingest/index.js";

vi.mock("../src/ingest/markdownLoader.js", () => ({
  loadMarkdown: vi.fn().mockResolvedValue("# Test\n\nA test fact."),
}));

vi.mock("../src/ingest/markdownParser.js", () => ({
  parseMarkdown: vi.fn().mockReturnValue({
    type: "root",
    children: [
      { type: "heading", depth: 1, children: [{ type: "text", value: "Test" }] },
      { type: "paragraph", children: [{ type: "text", value: "A test fact." }] },
    ],
  }),
}));

vi.mock("../src/ingest/factExtractor.js", () => ({
  extractFactsFromTree: vi.fn().mockReturnValue([
    { id: "1", text: "A test fact.", sourceSection: "Test", tags: ["test"] },
  ]),
}));

vi.mock("../src/ingest/embedFacts.js", () => ({
  embedFacts: vi.fn().mockResolvedValue([
    { id: "1", text: "A test fact.", sourceSection: "Test", tags: ["test"], embedding: new Array(768).fill(0.1) },
  ]),
}));

vi.mock("../src/ingest/indexFacts.js", () => ({
  indexFacts: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/config.js", () => ({
  SEED_DATA_PATH: "data/glop.md",
  OLLAMA_BASE_URL: "http://localhost:11434",
  OLLAMA_CHAT_MODEL: "llama3",
  OLLAMA_EMBED_MODEL: "nomic-embed-text",
  QDRANT_URL: "http://localhost:6333",
  QDRANT_COLLECTION: "facts",
  EMBEDDING_DIMENSION: 768,
}));

describe("runIngest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runIngest_DefaultPath_ProcessesPipeline", async () => {
    await expect(runIngest()).resolves.not.toThrow();
  });

  it("runIngest_CustomPath_ProcessesPipeline", async () => {
    const { loadMarkdown } = await import("../src/ingest/markdownLoader.js");
    await runIngest("custom/path.md");
    expect(loadMarkdown).toHaveBeenCalledWith("custom/path.md");
  });

  it("runIngest_CallsAllStages_InOrder", async () => {
    const { loadMarkdown } = await import("../src/ingest/markdownLoader.js");
    const { parseMarkdown } = await import("../src/ingest/markdownParser.js");
    const { extractFactsFromTree } = await import("../src/ingest/factExtractor.js");
    const { embedFacts } = await import("../src/ingest/embedFacts.js");
    const { indexFacts } = await import("../src/ingest/indexFacts.js");

    await runIngest();

    expect(loadMarkdown).toHaveBeenCalled();
    expect(parseMarkdown).toHaveBeenCalled();
    expect(extractFactsFromTree).toHaveBeenCalled();
    expect(embedFacts).toHaveBeenCalled();
    expect(indexFacts).toHaveBeenCalled();
  });
});