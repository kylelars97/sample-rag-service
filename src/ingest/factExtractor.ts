import { v4 as uuidv4 } from "uuid";
import type { Root, Content } from "mdast";
import type { Fact } from "../types.js";

type NodeWithChildren = { readonly children: readonly Content[] };

const SKIP_TYPES: ReadonlySet<string> = new Set(["blockquote", "thematicBreak", "code", "html"]);

function hasChildren(node: Content): node is Content & NodeWithChildren {
  return "children" in node;
}

function collectTextChildren(children: readonly Content[]): string[] {
  const parts: string[] = [];
  for (const child of children) {
    if (child.type === "text" || child.type === "inlineCode") {
      parts.push(child.value);
    } else if (hasChildren(child)) {
      parts.push(...collectTextChildren(child.children));
    }
  }
  return parts;
}

export function extractFactsFromTree(tree: Root): readonly Fact[] {
  const facts: Fact[] = [];
  let currentSection: string | undefined;

  function processNode(node: Content): void {
    if (node.type === "heading") {
      currentSection = extractHeadingText(node);
      return;
    }

    if (node.type === "paragraph") {
      const text = extractParagraphText(node);
      if (text.trim().length > 0) {
        const sentences = splitSentences(text);
        for (const sentence of sentences) {
          if (sentence.trim().length === 0) continue;
          facts.push(createFact(sentence, currentSection));
        }
      }
      return;
    }

    if (node.type === "list") {
      for (const item of node.children) {
        for (const child of item.children) {
          if (child.type === "paragraph") {
            const text = extractParagraphText(child);
            if (text.trim().length > 0) {
              facts.push(createFact(text, currentSection));
            }
          }
        }
      }
      return;
    }

    if (SKIP_TYPES.has(node.type)) {
      return;
    }

    if (hasChildren(node)) {
      for (const child of node.children) {
        processNode(child);
      }
    }
  }

  for (const child of tree.children) {
    processNode(child);
  }

  return facts;
}

function createFact(text: string, sourceSection?: string): Fact {
  return {
    id: uuidv4(),
    text,
    ...(sourceSection !== undefined
      ? { sourceSection, tags: [sourceSection.toLowerCase()] }
      : {}),
  };
}

function extractHeadingText(node: Content): string {
  if (node.type !== "heading") return "";
  return collectTextChildren(node.children).join("");
}

function extractParagraphText(node: Content): string {
  if (node.type !== "paragraph") return "";
  return collectTextChildren(node.children).join("");
}

function splitSentences(text: string): readonly string[] {
  return text
    .split(/(?<=[.!?])\s+/u)
    .filter((s) => s.trim().length > 0);
}
