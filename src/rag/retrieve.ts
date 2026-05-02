import { QDRANT_COLLECTION } from "../config.js";
import { getQdrantClient } from "../vector/qdrantClient.js";

export async function searchFacts(
  queryEmbedding: readonly number[]
): Promise<readonly string[]> {
  const client = getQdrantClient();
  const results = await client.search(QDRANT_COLLECTION, {
    vector: [...queryEmbedding],
    limit: 5,
  });
  return results.map(
    (r: { payload?: Record<string, unknown> | null }) => {
      const payload = r.payload as Record<string, unknown> | null | undefined;
      return (payload?.text as string) ?? "";
    }
  );
}
