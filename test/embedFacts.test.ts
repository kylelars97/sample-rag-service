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

  it("embedText_SendsCorrectUrlAndModel_PostsToApi", async () => {
    const fakeEmbedding = new Array(768).fill(0.1);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: fakeEmbedding }),
    });
    await embedText("test input");
    const callUrl = mockFetch.mock.calls[0][0] as string;
    const callOpts = mockFetch.mock.calls[0][1] as RequestInit;
    expect(callUrl).toBe("http://localhost:11434/api/embeddings");
    const body = JSON.parse(callOpts.body as string);
    expect(body.model).toBe("nomic-embed-text");
    expect(body.prompt).toBe("test input");
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

  it("embedFacts_EmptyArray_ReturnsEmptyArray", async () => {
    const result: readonly EmbeddedFact[] = await embedFacts([]);
    expect(result).toEqual([]);
  });

  it("embedFacts_PreservesFactFields_ReturnsAllFields", async () => {
    const fakeEmbedding = new Array(768).fill(0.3);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ embedding: fakeEmbedding }),
    });
    const facts: readonly Fact[] = [
      { id: "1", text: "Fact one", sourceSection: "Intro", tags: ["intro"] },
    ];
    const result = await embedFacts(facts);
    expect(result[0].id).toBe("1");
    expect(result[0].text).toBe("Fact one");
    expect(result[0].sourceSection).toBe("Intro");
    expect(result[0].tags).toEqual(["intro"]);
    expect(result[0].embedding).toEqual(fakeEmbedding);
  });
});
