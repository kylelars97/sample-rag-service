import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchFacts } from "../src/rag/retrieve.js";

const mockSearch = vi.fn();

vi.mock("../src/vector/qdrantClient.js", () => ({
  getQdrantClient: () => ({ search: mockSearch }),
}));

const defaultEmbedding: readonly number[] = new Array(768).fill(0.5);

describe("searchFacts", () => {
  beforeEach(() => {
    mockSearch.mockReset();
    mockSearch.mockResolvedValue([
      { payload: { text: "GLOP is a planet." }, score: 0.9 },
    ]);
  });

  it("searchFacts_QueryEmbedding_ReturnsFactTexts", async () => {
    const results = await searchFacts(defaultEmbedding);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toContain("GLOP");
  });

  it("searchFacts_EmbeddingLength_AcceptsVectors", async () => {
    const shortEmbedding: readonly number[] = [0.1, 0.2, 0.3];
    const results = await searchFacts(shortEmbedding);
    expect(Array.isArray(results)).toBe(true);
  });

  it("searchFacts_EmptyResults_ReturnsEmptyArray", async () => {
    mockSearch.mockResolvedValue([]);
    const results = await searchFacts(defaultEmbedding);
    expect(results).toEqual([]);
  });

  it("searchFacts_NullPayload_ReturnsEmptyStringForNullAndTextForValid", async () => {
    mockSearch.mockResolvedValue([
      { payload: null, score: 0.5 },
      { payload: { text: "Valid fact." }, score: 0.8 },
    ]);
    const results = await searchFacts(defaultEmbedding);
    expect(results[0]).toBe("");
    expect(results[1]).toBe("Valid fact.");
  });

  it("searchFacts_PayloadWithMissingTextField_ReturnsEmptyString", async () => {
    mockSearch.mockResolvedValue([
      { payload: { otherField: "not text" }, score: 0.5 },
    ]);
    const results = await searchFacts(defaultEmbedding);
    expect(results[0]).toBe("");
  });
});
