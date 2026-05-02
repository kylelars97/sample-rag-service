import { embedText } from "../ingest/embedFacts.js";
import { searchFacts } from "./retrieve.js";
import { generateAnswer } from "./generate.js";
import type { QueryResult } from "../types.js";

export async function runRagQuery(prompt: string): Promise<QueryResult> {
  const queryEmbedding = await embedText(prompt);
  const factTexts = await searchFacts(queryEmbedding);
  const answer = await generateAnswer(prompt, factTexts);
  return { answer, facts: factTexts };
}
