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

  it("ensureCollection_CollectionAlreadyExists_SkipsCreation", async () => {
    vi.resetModules();
    const mockGetCollection = vi.fn().mockResolvedValue({});
    const mockCreateCollection = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@qdrant/js-client-rest", () => ({
      QdrantClient: vi.fn().mockImplementation(() => ({
        getCollection: mockGetCollection,
        createCollection: mockCreateCollection,
      })),
    }));
    const { ensureCollection: freshEnsure } = await import("../src/vector/qdrantClient.js");
    await freshEnsure();
    expect(mockGetCollection).toHaveBeenCalled();
    expect(mockCreateCollection).not.toHaveBeenCalled();
    vi.doUnmock("@qdrant/js-client-rest");
  });
});
