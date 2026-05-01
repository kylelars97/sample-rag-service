import { v4 as uuidv4 } from "uuid";
import type { Root, Content } from "mdast";
import type { Fact } from "../types.js";

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

    if ("children" in node) {
      for (const child of (node as { children: Content[] }).children) {
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
    ...(sourceSection !== undefined ? { sourceSection } : {}),
  };
}

function extractHeadingText(node: Content): string {
  if (node.type !== "heading") return "";
  const parts: string[] = [];
  for (const child of node.children) {
    if (child.type === "text") {
      parts.push(child.value);
    } else if ("children" in child) {
      for (const sub of (child as { children: Content[] }).children) {
        if (sub.type === "text") {
          parts.push(sub.value);
        }
      }
    }
  }
  return parts.join("");
}

function extractParagraphText(node: Content): string {
  if (node.type !== "paragraph") return "";
  const parts: string[] = [];
  for (const child of node.children) {
    if (child.type === "text") {
      parts.push(child.value);
    } else if (child.type === "strong" || child.type === "emphasis") {
      for (const sub of child.children) {
        if (sub.type === "text") {
          parts.push(sub.value);
        }
      }
    }
  }
  return parts.join("");
}

function splitSentences(text: string): readonly string[] {
  return text
    .split(/(?<=[.!?])\s+/u)
    .filter((s) => s.trim().length > 0);
}