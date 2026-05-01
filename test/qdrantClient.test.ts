import { describe, it, expect, vi } from "vitest";
import { getQdrantClient, ensureCollection } from "../src/vector/qdrantClient.js";

vi.mock("@qdrant/js-client-rest", () => {
  const mockClient = {
    getCollection: vi.fn().mockRejectedValue(new Error("not found")),
    createCollection: vi.fn().mockResolvedValue(undefined),
    getCollections: vi.fn().mockResolvedValue({ collections: [] }),
  };
  return { QdrantClient: vi.fn().mockImplementation(() => mockClient) };
});

describe("getQdrantClient", () => {
  it("getQdrantClient_ReturnsClientObject_ReturnsClient", () => {
    const client = getQdrantClient();
    expect(client).toBeDefined();
  });
});

describe("ensureCollection", () => {
  it("ensureCollection_CollectionDoesNotExist_CreatesCollection", async () => {
    await expect(ensureCollection()).resolves.not.toThrow();
  });
});