import { assertEquals, assertRejects, assert } from "@std/assert";
import { stub } from "@std/testing/mock";
import { runRagQuery } from "../src/rag/query.ts";
import { _setQdrantClient } from "../src/vector/qdrantClient.ts";

Deno.test("runRagQuery_FullPipeline_ReturnsAnswerAndFacts", async () => {
  const mockClient = {
    search: () =>
      Promise.resolve([{ payload: { text: "GLOP is a planet." }, score: 0.95 }]),
  };
  _setQdrantClient(mockClient as never);
  let callCount = 0;
  const fetchStub = stub(globalThis, "fetch", () => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve(new Response(JSON.stringify({ embedding: new Array(768).fill(0.5) })));
    }
    return Promise.resolve(new Response(JSON.stringify({ response: "GLOP is a unified planetary system." })));
  });
  try {
    const result = await runRagQuery("What is GLOP?");
    assert(result.facts.length > 0);
  } finally {
    fetchStub.restore();
    _setQdrantClient(null);
  }
});

Deno.test("runRagQuery_EmbedFailure_ThrowsError", async () => {
  _setQdrantClient(null);
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(null, { status: 503, statusText: "Service Unavailable" })));
  try {
    await assertRejects(() => runRagQuery("What is GLOP?"));
  } finally {
    fetchStub.restore();
    _setQdrantClient(null);
  }
});

Deno.test("runRagQuery_GenerationFailure_ThrowsError", async () => {
  const mockClient = {
    search: () =>
      Promise.resolve([{ payload: { text: "GLOP is a planet." }, score: 0.95 }]),
  };
  _setQdrantClient(mockClient as never);
  let callCount = 0;
  const fetchStub = stub(globalThis, "fetch", () => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve(new Response(JSON.stringify({ embedding: new Array(768).fill(0.5) })));
    }
    return Promise.resolve(new Response(null, { status: 500, statusText: "Internal Server Error" }));
  });
  try {
    await assertRejects(() => runRagQuery("What is GLOP?"));
  } finally {
    fetchStub.restore();
    _setQdrantClient(null);
  }
});

Deno.test("runRagQuery_ReturnsResultWithCorrectShape", async () => {
  const mockClient = {
    search: () =>
      Promise.resolve([{ payload: { text: "GLOP is a planet." }, score: 0.95 }]),
  };
  _setQdrantClient(mockClient as never);
  let callCount = 0;
  const fetchStub = stub(globalThis, "fetch", () => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve(new Response(JSON.stringify({ embedding: new Array(768).fill(0.5) })));
    }
    return Promise.resolve(new Response(JSON.stringify({ response: "GLOP is a unified planetary system." })));
  });
  try {
    const result = await runRagQuery("What is GLOP?");
    assert("answer" in result);
    assert("facts" in result);
    assertEquals(typeof result.answer, "string");
    assert(Array.isArray(result.facts));
  } finally {
    fetchStub.restore();
    _setQdrantClient(null);
  }
});