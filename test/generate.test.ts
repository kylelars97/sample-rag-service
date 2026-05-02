import { assertEquals, assertRejects } from "@std/assert";
import { stub } from "@std/testing/mock";
import { generateAnswer } from "../src/rag/generate.ts";

Deno.test("generateAnswer_WithFacts_ReturnsAnswer", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ response: "GLOP is a unified planetary system." }))));
  try {
    const facts = ["GLOP is a unified planetary system."];
    const result = await generateAnswer("What is GLOP?", facts);
    assertEquals(result.includes("GLOP"), true);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("generateAnswer_FailedFetch_ThrowsError", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(null, { status: 500, statusText: "Server Error" })));
  try {
    await assertRejects(() => generateAnswer("What is GLOP?", ["fact"]));
  } finally {
    fetchStub.restore();
  }
});

Deno.test("generateAnswer_EmptyFactsList_ReturnsAnswer", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ response: "I don't know." }))));
  try {
    const result = await generateAnswer("What is GLOP?", []);
    assertEquals(result.includes("don't know"), true);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("generateAnswer_WithFacts_SendsPromptContainingFacts", async () => {
  let calledBody = "";
  const fetchStub = stub(globalThis, "fetch", (_input: URL | RequestInfo, init?: RequestInit) => {
    calledBody = init?.body as string;
    return Promise.resolve(new Response(JSON.stringify({ response: "Answer" })));
  });
  try {
    const facts = ["Fact A.", "Fact B."];
    await generateAnswer("What?", facts);
    const body = JSON.parse(calledBody);
    assertEquals(body.prompt.includes("Fact A."), true);
    assertEquals(body.prompt.includes("Fact B."), true);
    assertEquals(body.prompt.includes("What?"), true);
    assertEquals(body.model, "llama3");
    assertEquals(body.stream, false);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("generateAnswer_SendsCorrectUrl_PostsToGenerateApi", async () => {
  let calledUrl = "";
  const fetchStub = stub(globalThis, "fetch", (_input: URL | RequestInfo, _init?: RequestInit) => {
    calledUrl = _input as string;
    return Promise.resolve(new Response(JSON.stringify({ response: "Answer" })));
  });
  try {
    await generateAnswer("Q?", ["F."]);
    assertEquals(calledUrl, "http://localhost:11434/api/generate");
  } finally {
    fetchStub.restore();
  }
});