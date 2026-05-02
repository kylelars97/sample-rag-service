import { loadMarkdown } from "./markdownLoader.js";
import { parseMarkdown } from "./markdownParser.js";
import { extractFactsFromTree } from "./factExtractor.js";
import { embedFacts } from "./embedFacts.js";
import { indexFacts } from "./indexFacts.js";
import { SEED_DATA_PATH } from "../config.js";

export async function runIngest(filePath: string = SEED_DATA_PATH): Promise<void> {
  const md = await loadMarkdown(filePath);
  const tree = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const embeddedFacts = await embedFacts(facts);
  await indexFacts(embeddedFacts);
  console.log(`Ingested ${embeddedFacts.length} facts from ${filePath}`);
}
