import { assertEquals, assertRejects, assert } from "@std/assert";
import { stub } from "@std/testing/mock";
import { embedText, embedFacts } from "../src/ingest/embedFacts.ts";
import type { Fact, EmbeddedFact } from "../src/types.ts";

Deno.test("embedText_CallsOllama_ReturnsEmbedding", async () => {
  const fakeEmbedding = new Array(768).fill(0.1);
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ embedding: fakeEmbedding }))));
  try {
    const result = await embedText("hello world");
    assertEquals(result, fakeEmbedding);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("embedText_SendsCorrectUrlAndModel_PostsToApi", async () => {
  const fakeEmbedding = new Array(768).fill(0.1);
  let calledUrl = "";
  let calledBody = "";
  const fetchStub = stub(globalThis, "fetch", (input: URL | RequestInfo, init?: RequestInit) => {
    calledUrl = input as string;
    calledBody = init?.body as string;
    return Promise.resolve(new Response(JSON.stringify({ embedding: fakeEmbedding })));
  });
  try {
    await embedText("test input");
    assertEquals(calledUrl, "http://localhost:11434/api/embeddings");
    const body = JSON.parse(calledBody);
    assertEquals(body.model, "nomic-embed-text");
    assertEquals(body.prompt, "test input");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("embedText_FailedFetch_ThrowsError", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(null, { status: 400, statusText: "Bad Request" })));
  try {
    await assertRejects(() => embedText("hello"));
  } finally {
    fetchStub.restore();
  }
});

Deno.test("embedText_MalformedJsonResponse_ThrowsError", async () => {
  const fetchStub = stub(globalThis, "fetch", () => {
    throw new Error("Malformed JSON");
  });
  try {
    await assertRejects(() => embedText("broken"));
  } finally {
    fetchStub.restore();
  }
});

Deno.test("embedFacts_MultipleFacts_ReturnsEmbeddedFacts", async () => {
  const fakeEmbedding = new Array(768).fill(0.2);
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ embedding: fakeEmbedding }))));
  try {
    const facts: readonly Fact[] = [
      { id: "1", text: "Fact one" },
      { id: "2", text: "Fact two" },
    ];
    const result: readonly EmbeddedFact[] = await embedFacts(facts);
    assertEquals(result.length, 2);
    assertEquals(result[0].embedding, fakeEmbedding);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("embedFacts_EmptyArray_ReturnsEmptyArray", async () => {
  const result: readonly EmbeddedFact[] = await embedFacts([]);
  assertEquals(result, []);
});

Deno.test("embedFacts_PreservesFactFields_ReturnsAllFields", async () => {
  const fakeEmbedding = new Array(768).fill(0.3);
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ embedding: fakeEmbedding }))));
  try {
    const facts: readonly Fact[] = [
      { id: "1", text: "Fact one", sourceSection: "Intro", tags: ["intro"] },
    ];
    const result = await embedFacts(facts);
    assertEquals(result[0].id, "1");
    assertEquals(result[0].text, "Fact one");
    assertEquals(result[0].sourceSection, "Intro");
    assertEquals(result[0].tags, ["intro"]);
    assertEquals(result[0].embedding, fakeEmbedding);
  } finally {
    fetchStub.restore();
  }
});