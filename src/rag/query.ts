import { embedText } from "../ingest/embedFacts.ts";
import { searchFacts } from "./retrieve.ts";
import { generateAnswer } from "./generate.ts";
import type { QueryResult } from "../types.ts";

export async function runRagQuery(prompt: string): Promise<QueryResult> {
  const queryEmbedding = await embedText(prompt);
  const factTexts = await searchFacts(queryEmbedding);
  const answer = await generateAnswer(prompt, factTexts);
  return { answer, facts: factTexts };
}