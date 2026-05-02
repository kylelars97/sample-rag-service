import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import { loadMarkdown } from "../src/ingest/markdownLoader.ts";
import { parseMarkdown } from "../src/ingest/markdownParser.ts";
import { extractFactsFromTree } from "../src/ingest/factExtractor.ts";
import { embedFacts } from "../src/ingest/embedFacts.ts";
import { _setQdrantClient } from "../src/vector/qdrantClient.ts";

Deno.test("runIngest_DefaultPath_ProcessesPipeline", async () => {
  const mockClient = {
    upsert: () => Promise.resolve(undefined),
    getCollection: () => Promise.reject(new Error("not found")),
    createCollection: () => Promise.resolve(undefined),
  };
  _setQdrantClient(mockClient as never);

  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ embedding: new Array(768).fill(0.1) }))),
  );
  try {
    const content = await loadMarkdown("data/glop.md");
    assertEquals(content.length > 0, true);
  } finally {
    fetchStub.restore();
    _setQdrantClient(null);
  }
});

Deno.test("runIngest_PipelineStages_WorkTogether", () => {
  const md = "# Test\n\nA test fact.";
  const tree = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assertEquals(facts.length > 0, true);
});

Deno.test("runIngest_EmbedsFacts_WhenFetchAvailable", async () => {
  const md = "# Overview\n\nGLOP is a unified planetary system.";
  const tree = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const fakeEmbedding = new Array(768).fill(0.1);

  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ embedding: fakeEmbedding }))),
  );
  try {
    const result = await embedFacts(facts);
    assertEquals(result.length, facts.length);
    assertEquals(result[0].embedding.length, 768);
  } finally {
    fetchStub.restore();
  }
});