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

  it("generateAnswer_EmptyFactsList_ReturnsAnswer", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: "I don't know." }),
    });
    const result = await generateAnswer("What is GLOP?", []);
    expect(result).toContain("don't know");
  });

  it("generateAnswer_WithFacts_SendsPromptContainingFacts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: "Answer" }),
    });
    const facts = ["Fact A.", "Fact B."];
    await generateAnswer("What?", facts);
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(callBody.prompt).toContain("Fact A.");
    expect(callBody.prompt).toContain("Fact B.");
    expect(callBody.prompt).toContain("What?");
    expect(callBody.model).toBe("llama3");
    expect(callBody.stream).toBe(false);
  });

  it("generateAnswer_SendsCorrectUrl_PostsToGenerateApi", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: "Answer" }),
    });
    await generateAnswer("Q?", ["F."]);
    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toBe("http://localhost:11434/api/generate");
  });
});
