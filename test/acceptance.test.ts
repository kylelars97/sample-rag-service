import { assertEquals, assert } from "@std/assert";

interface PromptCase {
  readonly prompt: string;
  readonly expectedResponse: string;
}

interface QueryResult {
  readonly answer: string;
  readonly facts: readonly string[];
}

const PROMPTS_PATH = new URL("../test/prompts.json", import.meta.url).pathname;
const RAG_SERVICE_URL = Deno.env.get("RAG_SERVICE_URL") ?? "http://localhost:3000";

async function loadPrompts(): Promise<readonly PromptCase[]> {
  const text = await Deno.readTextFile(PROMPTS_PATH);
  return JSON.parse(text) as PromptCase[];
}

async function queryRagService(prompt: string): Promise<QueryResult> {
  const res = await fetch(`${RAG_SERVICE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    throw new Error(`RAG service returned ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<QueryResult>;
}

async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(RAG_SERVICE_URL);
    return res.ok;
  } catch {
    return false;
  }
}

Deno.test("Acceptance_RagService_HealthEndpoint_Responds", async () => {
  const healthy = await checkHealth();
  assert(healthy, "RAG service health check failed — is the service running?");
});

Deno.test("Acceptance_PromptsFile_ContainsAllTestCases", async () => {
  const prompts = await loadPrompts();
  assert(prompts.length >= 10, `Expected at least 10 prompts, got ${prompts.length}`);
  for (const p of prompts) {
    assert(typeof p.prompt === "string" && p.prompt.length > 0, "Prompt must be non-empty string");
    assert(typeof p.expectedResponse === "string" && p.expectedResponse.length > 0, "expectedResponse must be non-empty string");
  }
});

Deno.test("Acceptance_QueryEndpoint_ReturnsValidStructure", async () => {
  const prompts = await loadPrompts();
  const first = prompts[0];
  const result = await queryRagService(first.prompt);
  assert("answer" in result, "Result must have 'answer' field");
  assert("facts" in result, "Result must have 'facts' field");
  assertEquals(typeof result.answer, "string");
  assert(Array.isArray(result.facts));
});

Deno.test("Acceptance_QueryEndpoint_AnswerContainsRelevantContent", async () => {
  const prompts = await loadPrompts();
  const results: { prompt: string; expected: string; actual: string }[] = [];
  let passCount = 0;

  for (const tc of prompts) {
    const result = await queryRagService(tc.prompt);
    const answerLower = result.answer.toLowerCase();
    const expectedTerms = tc.expectedResponse
      .split(/[\s,;.()]+/)
      .filter((w) => w.length > 3)
      .map((w) => w.toLowerCase());

    const matchedTerms = expectedTerms.filter((term) => answerLower.includes(term));
    const matchRatio = matchedTerms.length / Math.max(expectedTerms.length, 1);
    const passed = matchRatio >= 0.4;

    results.push({
      prompt: tc.prompt,
      expected: tc.expectedResponse,
      actual: result.answer,
    });

    if (passed) passCount++;
  }

  const passRate = passCount / prompts.length;
  assert(
    passRate >= 0.6,
    `Only ${passCount}/${prompts.length} prompts had acceptable answers (pass rate: ${(passRate * 100).toFixed(1)}%, threshold: 60%). ` +
    `Failed cases:\n${results.filter((_, i) => {
      const r = results[i];
      const answerLower = r.actual.toLowerCase();
      const expectedTerms = r.expected.split(/[\s,;.()]+/).filter((w) => w.length > 3).map((w) => w.toLowerCase());
      const matchedTerms = expectedTerms.filter((term) => answerLower.includes(term));
      return matchedTerms.length / Math.max(expectedTerms.length, 1) < 0.4;
    }).map((r) => `  Q: ${r.prompt}\n  Expected: ${r.expected}\n  Got: ${r.actual}`).join("\n")}`,
  );
});

Deno.test("Acceptance_QueryEndpoint_ReturnsFacts", async () => {
  const prompts = await loadPrompts();
  const result = await queryRagService(prompts[0].prompt);
  assert(result.facts.length > 0, "RAG service should return at least one fact");
});