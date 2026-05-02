import { describe, it, expect } from "vitest";
import { extractFactsFromTree } from "../src/ingest/factExtractor.js";
import { parseMarkdown } from "../src/ingest/markdownParser.js";
import type { Root } from "mdast";

describe("extractFactsFromTree", () => {
  it("extractFactsFromTree_SimpleParagraph_ReturnsFact", async () => {
    const md = "GLOP is a unified planetary system.";
    const tree: Root = await parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.length).toBeGreaterThan(0);
    expect(facts[0].text).toContain("GLOP");
  });

  it("extractFactsFromTree_HeadingWithBody_ReturnsFactsFromBoth", async () => {
    const md = "# Overview\n\nGLOP is a unified planetary system.\n\n## Governance\n\nGLOP is managed by the Core Consensus Engine.";
    const tree: Root = await parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.length).toBeGreaterThanOrEqual(2);
  });

  it("extractFactsFromTree_ListItems_ReturnsFactsFromItems", async () => {
    const md = "## Features\n\n- Feature one is great.\n- Feature two is better.";
    const tree: Root = await parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.some((f) => f.text.includes("Feature one"))).toBe(true);
    expect(facts.some((f) => f.text.includes("Feature two"))).toBe(true);
  });

  it("extractFactsFromTree_EmptyInput_ReturnsEmptyArray", async () => {
    const md = "";
    const tree: Root = await parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts).toEqual([]);
  });

  it("extractFactsFromTree_FactsHaveIds_ReturnsFactsWithValidIds", async () => {
    const md = "Some content here.";
    const tree: Root = await parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    for (const fact of facts) {
      expect(fact.id).toBeTruthy();
    }
  });

  it("extractFactsFromTree_FactsHaveSourceSection_IncludesHeading", async () => {
    const md = "# Title\n\nContent under title.";
    const tree: Root = await parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const withSection = facts.find((f) => f.sourceSection !== undefined);
    expect(withSection).toBeDefined();
  });
});
