import { describe, it, expect, vi, beforeEach } from "vitest";
import { runRagQuery } from "../src/rag/query.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

vi.mock("../src/vector/qdrantClient.js", () => ({
  getQdrantClient: () => ({
    search: vi.fn().mockResolvedValue([
      { payload: { text: "GLOP is a planet." }, score: 0.95 },
    ]),
  }),
  ensureCollection: vi.fn().mockResolvedValue(undefined),
}));

describe("runRagQuery", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("runRagQuery_FullPipeline_ReturnsAnswerAndFacts", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ embedding: new Array(768).fill(0.5) }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: "GLOP is a unified planetary system.",
        }),
      });
    const result = await runRagQuery("What is GLOP?");
    expect(result.facts.length).toBeGreaterThan(0);
  });
});