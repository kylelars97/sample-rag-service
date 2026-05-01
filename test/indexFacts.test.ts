import { describe, it, expect, vi } from "vitest";
import { indexFacts } from "../src/ingest/indexFacts.js";
import type { EmbeddedFact } from "../src/types.js";

vi.mock("../src/vector/qdrantClient.js", () => ({
  getQdrantClient: () => ({
    upsert: vi.fn().mockResolvedValue(undefined),
  }),
  ensureCollection: vi.fn().mockResolvedValue(undefined),
}));

describe("indexFacts", () => {
  it("indexFacts_EmbeddedFacts_UpsertsToQdrant", async () => {
    const embeddedFacts: readonly EmbeddedFact[] = [
      {
        id: "abc",
        text: "Test fact",
        embedding: new Array(768).fill(0.1),
      },
    ];
    await expect(indexFacts(embeddedFacts)).resolves.not.toThrow();
  });
});