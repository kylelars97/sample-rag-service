import { assertEquals, assert } from "@std/assert";
import { createRouter } from "../src/api/server.ts";
import { _setQdrantClient } from "../src/vector/qdrantClient.ts";
import { stub } from "@std/testing/mock";
import type { QueryResult } from "../src/types.ts";

Deno.test("createRouter_CreatesRouter_ReturnsRouterMap", () => {
  const router = createRouter();
  assert(router !== undefined);
  assert(router.size > 0);
});

Deno.test("GET_Root_HealthCheck_ReturnsStatusOk", async () => {
  const router = createRouter();
  const handler = router.get("GET /");
  assert(handler !== undefined);
  const response = await handler!(new Request("http://localhost:3000/"));
  assertEquals(response.status, 200);
  const body = await response.json() as { status: string };
  assertEquals(body.status, "ok");
});

Deno.test("POST_Query_ValidPrompt_ReturnsAnswerAndFacts", async () => {
  const mockClient = {
    search: () =>
      Promise.resolve([{ payload: { text: "GLOP is a planet." }, score: 0.95 }]),
  };
  _setQdrantClient(mockClient as never);
  let fetchCallCount = 0;
  const fetchStub = stub(globalThis, "fetch", () => {
    fetchCallCount++;
    if (fetchCallCount === 1) {
      return Promise.resolve(new Response(JSON.stringify({ embedding: new Array(768).fill(0.5) })));
    }
    return Promise.resolve(new Response(JSON.stringify({ response: "GLOP is a unified planetary system." })));
  });
  try {
    const router = createRouter();
    const handler = router.get("POST /query");
    const req = new Request("http://localhost:3000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "What is GLOP?" }),
    });
    const response = await handler!(req);
    assertEquals(response.status, 200);
    const body = await response.json() as QueryResult;
    assert(body.answer.includes("GLOP"));
    assert(body.facts.length > 0);
  } finally {
    fetchStub.restore();
    _setQdrantClient(null);
  }
});

Deno.test("POST_Query_MissingPrompt_Returns400", async () => {
  const router = createRouter();
  const handler = router.get("POST /query");
  const req = new Request("http://localhost:3000/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const response = await handler!(req);
  assertEquals(response.status, 400);
});

Deno.test("POST_Query_EmptyPrompt_Returns400", async () => {
  const router = createRouter();
  const handler = router.get("POST /query");
  const req = new Request("http://localhost:3000/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "" }),
  });
  const response = await handler!(req);
  assertEquals(response.status, 400);
});

Deno.test("POST_Query_NonStringPrompt_Returns400", async () => {
  const router = createRouter();
  const handler = router.get("POST /query");
  const req = new Request("http://localhost:3000/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: 123 }),
  });
  const response = await handler!(req);
  assertEquals(response.status, 400);
});

Deno.test("POST_Query_RagQueryThrows_Returns500", async () => {
  const mockClient = {
    search: () => Promise.reject(new Error("search failed")),
  };
  _setQdrantClient(mockClient as never);
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ embedding: new Array(768).fill(0.5) }))));
  try {
    const router = createRouter();
    const handler = router.get("POST /query");
    const req = new Request("http://localhost:3000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "What is GLOP?" }),
    });
    const response = await handler!(req);
    assertEquals(response.status, 500);
  } finally {
    fetchStub.restore();
    _setQdrantClient(null);
  }
});