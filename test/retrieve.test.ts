import { assertEquals } from "@std/assert";
import { _setQdrantClient } from "../src/vector/qdrantClient.ts";
import { searchFacts } from "../src/rag/retrieve.ts";

const defaultEmbedding: readonly number[] = new Array(768).fill(0.5);

Deno.test("searchFacts_QueryEmbedding_ReturnsFactTexts", async () => {
  const mockClient = {
    search: () =>
      Promise.resolve([{ payload: { text: "GLOP is a planet." }, score: 0.9 }]),
  };
  _setQdrantClient(mockClient as never);
  try {
    const results = await searchFacts(defaultEmbedding);
    assertEquals(results.length > 0, true);
    assertEquals(results[0].includes("GLOP"), true);
  } finally {
    _setQdrantClient(null);
  }
});

Deno.test("searchFacts_EmbeddingLength_AcceptsVectors", async () => {
  const shortEmbedding: readonly number[] = [0.1, 0.2, 0.3];
  const mockClient = {
    search: () =>
      Promise.resolve([{ payload: { text: "GLOP is a planet." }, score: 0.9 }]),
  };
  _setQdrantClient(mockClient as never);
  try {
    const results = await searchFacts(shortEmbedding);
    assertEquals(Array.isArray(results), true);
  } finally {
    _setQdrantClient(null);
  }
});

Deno.test("searchFacts_EmptyResults_ReturnsEmptyArray", async () => {
  const mockClient = {
    search: () => Promise.resolve([]),
  };
  _setQdrantClient(mockClient as never);
  try {
    const results = await searchFacts(defaultEmbedding);
    assertEquals(results, []);
  } finally {
    _setQdrantClient(null);
  }
});

Deno.test("searchFacts_NullPayload_ReturnsEmptyStringForNullAndTextForValid", async () => {
  const mockClient = {
    search: () =>
      Promise.resolve([
        { payload: null, score: 0.5 },
        { payload: { text: "Valid fact." }, score: 0.8 },
      ]),
  };
  _setQdrantClient(mockClient as never);
  try {
    const results = await searchFacts(defaultEmbedding);
    assertEquals(results[0], "");
    assertEquals(results[1], "Valid fact.");
  } finally {
    _setQdrantClient(null);
  }
});

Deno.test("searchFacts_PayloadWithMissingTextField_ReturnsEmptyString", async () => {
  const mockClient = {
    search: () =>
      Promise.resolve([{ payload: { otherField: "not text" }, score: 0.5 }]),
  };
  _setQdrantClient(mockClient as never);
  try {
    const results = await searchFacts(defaultEmbedding);
    assertEquals(results[0], "");
  } finally {
    _setQdrantClient(null);
  }
});