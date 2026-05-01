import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root } from "mdast";

export async function parseMarkdown(md: string): Promise<Root> {
  const tree = unified().use(remarkParse).parse(md);
  return tree as Root;
}