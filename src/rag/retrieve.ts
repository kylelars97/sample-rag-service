import { QDRANT_COLLECTION } from "../config.js";
import { getQdrantClient } from "../vector/qdrantClient.js";

function extractFactText(payload: Record<string, unknown> | null | undefined): string {
  if (payload != null && typeof payload.text === "string") {
    return payload.text;
  }
  return "";
}

export async function searchFacts(
  queryEmbedding: readonly number[]
): Promise<readonly string[]> {
  const client = getQdrantClient();
  const results = await client.search(QDRANT_COLLECTION, {
    vector: [...queryEmbedding],
    limit: 5,
  });
  return results.map((r) => extractFactText(r.payload));
}
