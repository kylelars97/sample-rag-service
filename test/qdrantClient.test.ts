import { assertEquals, assert } from "@std/assert";
import { ensureCollection, _setQdrantClient } from "../src/vector/qdrantClient.ts";

Deno.test("ensureCollection_CollectionDoesNotExist_CreatesCollection", async () => {
  let createCalled = false;
  const mockClient = {
    getCollection: () => Promise.reject(new Error("not found")),
    createCollection: () => {
      createCalled = true;
      return Promise.resolve(undefined);
    },
  };
  _setQdrantClient(mockClient as never);
  try {
    await ensureCollection();
    assert(createCalled);
  } finally {
    _setQdrantClient(null);
  }
});

Deno.test("ensureCollection_CollectionAlreadyExists_SkipsCreation", async () => {
  let createCalled = false;
  const mockClient = {
    getCollection: () => Promise.resolve({}),
    createCollection: () => {
      createCalled = true;
      return Promise.resolve(undefined);
    },
  };
  _setQdrantClient(mockClient as never);
  try {
    await ensureCollection();
    assert(!createCalled);
  } finally {
    _setQdrantClient(null);
  }
});