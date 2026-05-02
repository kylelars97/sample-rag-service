import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchFacts } from "../src/rag/retrieve.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

vi.mock("../src/vector/qdrantClient.js", () => ({
  getQdrantClient: () => ({
    search: vi.fn().mockResolvedValue([
      { payload: { text: "GLOP is a planet." }, score: 0.9 },
    ]),
  }),
}));

describe("searchFacts", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("searchFacts_QueryEmbedding_ReturnsFactTexts", async () => {
    const queryEmbedding: readonly number[] = new Array(768).fill(0.5);
    const results = await searchFacts(queryEmbedding);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toContain("GLOP");
  });
});
