import type { EmbeddedFact } from "../types.ts";
import { QDRANT_COLLECTION } from "../config.ts";
import { getQdrantClient, ensureCollection } from "../vector/qdrantClient.ts";

export async function indexFacts(facts: readonly EmbeddedFact[]): Promise<void> {
  await ensureCollection();
  const client = getQdrantClient();
  await client.upsert(QDRANT_COLLECTION, {
    points: facts.map((fact) => ({
      id: fact.id,
      vector: [...fact.embedding],
      payload: {
        text: fact.text,
        ...(fact.sourceSection !== undefined ? { sourceSection: fact.sourceSection } : {}),
        ...(fact.tags !== undefined ? { tags: [...fact.tags] } : {}),
      },
    })),
  });
}