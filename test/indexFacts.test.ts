import { describe, it, expect, vi } from "vitest";
import { indexFacts } from "../src/ingest/indexFacts.js";
import type { EmbeddedFact } from "../src/types.js";

const mockUpsert = vi.fn().mockResolvedValue(undefined);

vi.mock("../src/vector/qdrantClient.js", () => ({
  getQdrantClient: () => ({
    upsert: mockUpsert,
    getCollection: vi.fn().mockRejectedValue(new Error("not found")),
    createCollection: vi.fn().mockResolvedValue(undefined),
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

  it("indexFacts_WithSourceSection_IncludesSourceSectionInPayload", async () => {
    mockUpsert.mockClear();
    const embeddedFacts: readonly EmbeddedFact[] = [
      {
        id: "1",
        text: "Fact with section",
        sourceSection: "Overview",
        tags: ["overview"],
        embedding: new Array(768).fill(0.1),
      },
    ];
    await indexFacts(embeddedFacts);
    const upsertCall = mockUpsert.mock.calls[0];
    const points = upsertCall[1].points;
    expect(points[0].payload.sourceSection).toBe("Overview");
    expect(points[0].payload.tags).toEqual(["overview"]);
  });

  it("indexFacts_WithoutTags_OmitsTagsFromPayload", async () => {
    mockUpsert.mockClear();
    const embeddedFacts: readonly EmbeddedFact[] = [
      {
        id: "2",
        text: "Fact without tags",
        embedding: new Array(768).fill(0.1),
      },
    ];
    await indexFacts(embeddedFacts);
    const upsertCall = mockUpsert.mock.calls[0];
    const points = upsertCall[1].points;
    expect(points[0].payload.text).toBe("Fact without tags");
    expect(points[0].payload).not.toHaveProperty("sourceSection");
    expect(points[0].payload).not.toHaveProperty("tags");
  });

  it("indexFacts_MultipleFacts_UpsertsAllPoints", async () => {
    mockUpsert.mockClear();
    const embeddedFacts: readonly EmbeddedFact[] = [
      { id: "a", text: "First fact", embedding: new Array(768).fill(0.1) },
      { id: "b", text: "Second fact", embedding: new Array(768).fill(0.2) },
    ];
    await indexFacts(embeddedFacts);
    const upsertCall = mockUpsert.mock.calls[0];
    const points = upsertCall[1].points;
    expect(points.length).toBe(2);
    expect(points[0].id).toBe("a");
    expect(points[1].id).toBe("b");
  });
});
