import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildServer } from "../src/api/server.js";

const mockRunRagQuery = vi.fn();
vi.mock("../src/rag/query.js", () => ({
  runRagQuery: (...args: readonly unknown[]) => mockRunRagQuery(...args),
}));

describe("buildServer", () => {
  it("buildServer_CreatesServer_ReturnsFastifyInstance", () => {
    const server = buildServer();
    expect(server).toBeDefined();
  });
});

describe("GET / health check", () => {
  it("healthCheckEndpoint_SendsGetRequest_ReturnsStatusOk", async () => {
    const server = buildServer();
    const response = await server.inject({
      method: "GET",
      url: "/",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { status: string };
    expect(body.status).toBe("ok");
  });
});

describe("/query route", () => {
  it("queryRoute_ValidPrompt_ReturnsAnswerAndFacts", async () => {
    mockRunRagQuery.mockResolvedValueOnce({
      answer: "GLOP is a unified planetary system.",
      facts: ["GLOP is a unified planetary system."],
    });
    const server = buildServer();
    const response = await server.inject({
      method: "POST",
      url: "/query",
      payload: { prompt: "What is GLOP?" },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { answer: string; facts: readonly string[] };
    expect(body.answer).toContain("GLOP");
    expect(body.facts.length).toBeGreaterThan(0);
  });

  it("queryRoute_MissingPrompt_Returns400", async () => {
    const server = buildServer();
    const response = await server.inject({
      method: "POST",
      url: "/query",
      payload: {},
    });
    expect(response.statusCode).toBe(400);
  });

  it("queryRoute_EmptyPrompt_Returns400", async () => {
    const server = buildServer();
    const response = await server.inject({
      method: "POST",
      url: "/query",
      payload: { prompt: "" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("queryRoute_NonStringPrompt_Returns400", async () => {
    const server = buildServer();
    const response = await server.inject({
      method: "POST",
      url: "/query",
      payload: { prompt: 123 },
    });
    expect(response.statusCode).toBe(400);
  });
});
