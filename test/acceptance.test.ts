import { assertEquals, assert } from "@std/assert";

interface PromptCase {
  readonly prompt: string;
  readonly expectedResponse: string;
}

interface QueryResult {
  readonly answer: string;
  readonly facts: readonly string[];
}

interface TestCaseResult {
  readonly prompt: string;
  readonly expected: string;
  readonly actual: string;
  readonly passed: boolean;
}

const PROMPTS_PATH = new URL("../test/prompts.json", import.meta.url).pathname;
const RAG_SERVICE_URL = Deno.env.get("RAG_SERVICE_URL") ?? "http://localhost:3000";
const MATCH_RATIO_THRESHOLD = 0.4;
const PASS_RATE_THRESHOLD = 0.6;

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

function extractExpectedTerms(expectedResponse: string): readonly string[] {
  return expectedResponse
    .split(/[\s,;.()]+/)
    .filter((w) => w.length > 3)
    .map((w) => w.toLowerCase());
}

function computeMatchRatio(answer: string, expectedTerms: readonly string[]): number {
  const answerLower = answer.toLowerCase();
  const matchedTerms = expectedTerms.filter((term) => answerLower.includes(term));
  return matchedTerms.length / Math.max(expectedTerms.length, 1);
}

Deno.test("HealthEndpoint_WhenServiceRunning_RespondsOk", async () => {
  const healthy = await checkHealth();
  assert(healthy, "RAG service health check failed — is the service running?");
});

Deno.test("PromptsFile_WhenLoaded_ContainsAllTestCases", async () => {
  const prompts = await loadPrompts();
  assert(prompts.length >= 10, `Expected at least 10 prompts, got ${prompts.length}`);
  for (const p of prompts) {
    assert(typeof p.prompt === "string" && p.prompt.length > 0, "Prompt must be non-empty string");
    assert(typeof p.expectedResponse === "string" && p.expectedResponse.length > 0, "expectedResponse must be non-empty string");
  }
});

Deno.test("QueryEndpoint_WhenQueried_ReturnsValidStructure", async () => {
  const prompts = await loadPrompts();
  const first = prompts[0];
  const result = await queryRagService(first.prompt);
  assert("answer" in result, "Result must have 'answer' field");
  assert("facts" in result, "Result must have 'facts' field");
  assertEquals(typeof result.answer, "string");
  assert(Array.isArray(result.facts));
});

Deno.test("QueryEndpoint_WhenQueried_AnswerContainsRelevantContent", async () => {
  const prompts = await loadPrompts();
  const results: TestCaseResult[] = [];

  for (const tc of prompts) {
    const result = await queryRagService(tc.prompt);
    const expectedTerms = extractExpectedTerms(tc.expectedResponse);
    const matchRatio = computeMatchRatio(result.answer, expectedTerms);
    const passed = matchRatio >= MATCH_RATIO_THRESHOLD;

    results.push({
      prompt: tc.prompt,
      expected: tc.expectedResponse,
      actual: result.answer,
      passed,
    });
  }

  const passCount = results.filter((r) => r.passed).length;
  const passRate = passCount / prompts.length;
  const failedCases = results
    .filter((r) => !r.passed)
    .map((r) => `  Q: ${r.prompt}\n  Expected: ${r.expected}\n  Got: ${r.actual}`)
    .join("\n");

  assert(
    passRate >= PASS_RATE_THRESHOLD,
    `Only ${passCount}/${prompts.length} prompts had acceptable answers ` +
    `(pass rate: ${(passRate * 100).toFixed(1)}%, threshold: 60%). ` +
    `Failed cases:\n${failedCases}`,
  );
});

Deno.test("QueryEndpoint_WhenQueried_ReturnsFacts", async () => {
  const prompts = await loadPrompts();
  const result = await queryRagService(prompts[0].prompt);
  assert(result.facts.length > 0, "RAG service should return at least one fact");
});