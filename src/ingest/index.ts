import { loadMarkdown } from "./markdownLoader.ts";
import { parseMarkdown } from "./markdownParser.ts";
import { extractFactsFromTree } from "./factExtractor.ts";
import { embedFacts } from "./embedFacts.ts";
import { indexFacts } from "./indexFacts.ts";
import { SEED_DATA_PATH } from "../config.ts";

export async function runIngest(filePath: string = SEED_DATA_PATH): Promise<void> {
  const md = await loadMarkdown(filePath);
  const tree = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const embeddedFacts = await embedFacts(facts);
  await indexFacts(embeddedFacts);
  console.log(`Ingested ${embeddedFacts.length} facts from ${filePath}`);
}