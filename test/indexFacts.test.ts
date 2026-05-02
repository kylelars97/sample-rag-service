import { assertEquals, assert } from "@std/assert";
import { indexFacts } from "../src/ingest/indexFacts.ts";
import { _setQdrantClient } from "../src/vector/qdrantClient.ts";
import type { EmbeddedFact } from "../src/types.ts";

type UpsertPoints = { points: Array<{ id: string; payload: Record<string, unknown> }> };

function createCapturingMockClient(): { client: Record<string, unknown>; getUpsertArgs: () => UpsertPoints | null } {
  let upsertArgs: UpsertPoints | null = null;
  const client = {
    upsert: (_col: unknown, opts: UpsertPoints) => {
      upsertArgs = opts;
      return Promise.resolve(undefined);
    },
    getCollection: () => Promise.reject(new Error("not found")),
    createCollection: () => Promise.resolve(undefined),
  };
  return { client, getUpsertArgs: () => upsertArgs };
}

Deno.test("indexFacts_EmbeddedFacts_UpsertsToQdrant", async () => {
  const mockClient = {
    upsert: () => Promise.resolve(undefined),
    getCollection: () => Promise.reject(new Error("not found")),
    createCollection: () => Promise.resolve(undefined),
  };
  _setQdrantClient(mockClient as never);
  try {
    const embeddedFacts: readonly EmbeddedFact[] = [
      { id: "abc", text: "Test fact", embedding: new Array(768).fill(0.1) },
    ];
    await indexFacts(embeddedFacts);
  } finally {
    _setQdrantClient(null);
  }
});

Deno.test("indexFacts_WithSourceSection_IncludesSourceSectionInPayload", async () => {
  const mock = createCapturingMockClient();
  _setQdrantClient(mock.client as never);
  try {
    const embeddedFacts: readonly EmbeddedFact[] = [
      { id: "1", text: "Fact with section", sourceSection: "Overview", tags: ["overview"], embedding: new Array(768).fill(0.1) },
    ];
    await indexFacts(embeddedFacts);
    const upsertArgs = mock.getUpsertArgs();
    assert(upsertArgs !== null);
    assertEquals(upsertArgs.points[0].payload.sourceSection, "Overview");
    assertEquals(upsertArgs.points[0].payload.tags, ["overview"]);
  } finally {
    _setQdrantClient(null);
  }
});

Deno.test("indexFacts_WithoutTags_OmitsTagsFromPayload", async () => {
  const mock = createCapturingMockClient();
  _setQdrantClient(mock.client as never);
  try {
    const embeddedFacts: readonly EmbeddedFact[] = [
      { id: "2", text: "Fact without tags", embedding: new Array(768).fill(0.1) },
    ];
    await indexFacts(embeddedFacts);
    const upsertArgs = mock.getUpsertArgs();
    assert(upsertArgs !== null);
    assertEquals(upsertArgs.points[0].payload.text, "Fact without tags");
    assert(!("sourceSection" in upsertArgs.points[0].payload));
    assert(!("tags" in upsertArgs.points[0].payload));
  } finally {
    _setQdrantClient(null);
  }
});

Deno.test("indexFacts_MultipleFacts_UpsertsAllPoints", async () => {
  const mock = createCapturingMockClient();
  _setQdrantClient(mock.client as never);
  try {
    const embeddedFacts: readonly EmbeddedFact[] = [
      { id: "a", text: "First fact", embedding: new Array(768).fill(0.1) },
      { id: "b", text: "Second fact", embedding: new Array(768).fill(0.2) },
    ];
    await indexFacts(embeddedFacts);
    const upsertArgs = mock.getUpsertArgs();
    assert(upsertArgs !== null);
    assertEquals(upsertArgs.points.length, 2);
    assertEquals(upsertArgs.points[0].id, "a");
    assertEquals(upsertArgs.points[1].id, "b");
  } finally {
    _setQdrantClient(null);
  }
});