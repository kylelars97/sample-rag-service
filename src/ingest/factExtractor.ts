import type { Root, Content } from "mdast";
import type { Fact } from "../types.ts";
import { OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL } from "../config.ts";

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
    id: crypto.randomUUID(),
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

interface LLMFact {
  readonly text: string;
  readonly sourceSection?: string;
  readonly tags?: readonly string[];
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((el) => typeof el === "string");
}

function isLLMFact(item: unknown): item is LLMFact {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  if (typeof obj.text !== "string") return false;
  if (obj.sourceSection !== undefined && typeof obj.sourceSection !== "string") return false;
  if (obj.tags !== undefined && !isStringArray(obj.tags)) return false;
  return true;
}

function parseLLMResponse(response: string): readonly Fact[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(response);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const facts: Fact[] = [];
  for (const item of parsed) {
    if (!isLLMFact(item)) continue;
    facts.push({
      id: crypto.randomUUID(),
      text: item.text,
      ...(item.sourceSection !== undefined ? { sourceSection: item.sourceSection } : {}),
      ...(item.tags !== undefined ? { tags: item.tags } : {}),
    });
  }
  return facts;
}

export async function extractFactsWithLLM(text: string): Promise<readonly Fact[]> {
  const prompt = `Convert the following text into atomic factual statements.
Each fact must be:
- single idea
- self-contained
- non-overlapping

Return a JSON array of objects with "text" (required), "sourceSection" (optional), and "tags" (optional array of strings).

TEXT:
${text}

Return JSON array of facts.`;

  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_CHAT_MODEL, prompt, stream: false }),
  });

  if (!res.ok) {
    throw new Error(`LLM fact extraction failed: ${res.statusText}`);
  }

  const { response } = (await res.json()) as { response: string };

  return parseLLMResponse(response);
}