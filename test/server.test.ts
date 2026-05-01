import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildServer } from "../src/api/server.js";

vi.mock("../src/rag/query.js", () => ({
  runRagQuery: vi.fn().mockResolvedValue({
    answer: "GLOP is a unified planetary system.",
    facts: ["GLOP is a unified planetary system."],
  }),
}));

describe("buildServer", () => {
  it("buildServer_CreatesServer_ReturnsFastifyInstance", () => {
    const server = buildServer();
    expect(server).toBeDefined();
  });
});