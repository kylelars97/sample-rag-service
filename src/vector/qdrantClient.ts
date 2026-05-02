import { QdrantClient } from "@qdrant/js-client-rest";
import {
  QDRANT_URL,
  QDRANT_COLLECTION,
  EMBEDDING_DIMENSION,
} from "../config.ts";

let clientInstance: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (clientInstance === null) {
    clientInstance = new QdrantClient({ url: QDRANT_URL });
  }
  return clientInstance;
}

export function _setQdrantClient(client: QdrantClient | null): void {
  clientInstance = client;
}

export async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();
  try {
    await client.getCollection(QDRANT_COLLECTION);
  } catch {
    await client.createCollection(QDRANT_COLLECTION, {
      vectors: { size: EMBEDDING_DIMENSION, distance: "Cosine" },
    });
  }
}