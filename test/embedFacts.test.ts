import { describe, it, expect, vi, beforeEach } from "vitest";
import { embedText, embedFacts } from "../src/ingest/embedFacts.js";
import type { Fact, EmbeddedFact } from "../src/types.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("embedText", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("embedText_CallsOllama_ReturnsEmbedding", async () => {
    const fakeEmbedding = new Array(768).fill(0.1);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: fakeEmbedding }),
    });
    const result = await embedText("hello world");
    expect(result).toEqual(fakeEmbedding);
  });

  it("embedText_FailedFetch_ThrowsError", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Bad Request" });
    await expect(embedText("hello")).rejects.toThrow();
  });
});

describe("embedFacts", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("embedFacts_MultipleFacts_ReturnsEmbeddedFacts", async () => {
    const fakeEmbedding = new Array(768).fill(0.2);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ embedding: fakeEmbedding }),
    });
    const facts: readonly Fact[] = [
      { id: "1", text: "Fact one" },
      { id: "2", text: "Fact two" },
    ];
    const result: readonly EmbeddedFact[] = await embedFacts(facts);
    expect(result.length).toBe(2);
    expect(result[0].embedding).toEqual(fakeEmbedding);
  });
});
