import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAnswer } from "../src/rag/generate.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("generateAnswer", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("generateAnswer_WithFacts_ReturnsAnswer", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: "GLOP is a unified planetary system." }),
    });
    const facts = ["GLOP is a unified planetary system."];
    const result = await generateAnswer("What is GLOP?", facts);
    expect(result).toContain("GLOP");
  });

  it("generateAnswer_FailedFetch_ThrowsError", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Server Error" });
    await expect(
      generateAnswer("What is GLOP?", ["fact"])
    ).rejects.toThrow();
  });
});