import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root } from "mdast";

export function parseMarkdown(md: string): Root {
  return unified().use(remarkParse).parse(md) as Root;
}