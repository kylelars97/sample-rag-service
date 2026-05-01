import { OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL } from "../config.js";
import type { Fact, EmbeddedFact } from "../types.js";

export async function embedText(text: string): Promise<readonly number[]> {
  const res: Response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) {
    throw new Error(`Embedding failed: ${res.statusText}`);
  }
  const data: { embedding: number[] } = (await res.json()) as {
    embedding: number[];
  };
  return data.embedding;
}

export async function embedFacts(
  facts: readonly Fact[]
): Promise<readonly EmbeddedFact[]> {
  const embedded: EmbeddedFact[] = [];
  for (const fact of facts) {
    const embedding: readonly number[] = await embedText(fact.text);
    embedded.push({ ...fact, embedding });
  }
  return embedded;
}