import { describe, it, expect } from "vitest";
import { extractFactsFromTree } from "../src/ingest/factExtractor.js";
import { parseMarkdown } from "../src/ingest/markdownParser.js";
import type { Root } from "mdast";

describe("extractFactsFromTree", () => {
  it("extractFactsFromTree_SimpleParagraph_ReturnsFact", () => {
    const md = "GLOP is a unified planetary system.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.length).toBeGreaterThan(0);
    expect(facts[0].text).toContain("GLOP");
  });

  it("extractFactsFromTree_HeadingWithBody_ReturnsFactsFromBoth", () => {
    const md = "# Overview\n\nGLOP is a unified planetary system.\n\n## Governance\n\nGLOP is managed by the Core Consensus Engine.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.length).toBeGreaterThanOrEqual(2);
  });

  it("extractFactsFromTree_ListItems_ReturnsFactsFromItems", () => {
    const md = "## Features\n\n- Feature one is great.\n- Feature two is better.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.some((f) => f.text.includes("Feature one"))).toBe(true);
    expect(facts.some((f) => f.text.includes("Feature two"))).toBe(true);
  });

  it("extractFactsFromTree_EmptyInput_ReturnsEmptyArray", () => {
    const md = "";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts).toEqual([]);
  });

  it("extractFactsFromTree_FactsHaveIds_ReturnsFactsWithValidIds", () => {
    const md = "Some content here.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    for (const fact of facts) {
      expect(fact.id).toBeTruthy();
    }
  });

  it("extractFactsFromTree_FactsHaveSourceSection_IncludesHeading", () => {
    const md = "# Title\n\nContent under title.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const withSection = facts.find((f) => f.sourceSection !== undefined);
    expect(withSection).toBeDefined();
  });

  it("extractFactsFromTree_HeadingSection_AddsTagFromHeading", () => {
    const md = "# Overview\n\nGLOP is a unified planetary system.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const withTag = facts.find((f) => f.tags !== undefined && f.tags.length > 0);
    expect(withTag).toBeDefined();
    expect(withTag!.tags).toContain("overview");
  });

  it("extractFactsFromTree_NestedHeading_UseMostRecentHeadingAsTag", () => {
    const md = "# Top\n\n## Subsection\n\nSome detail here.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const detailFact = facts.find((f) => f.text.includes("detail"));
    expect(detailFact).toBeDefined();
    expect(detailFact!.tags).toContain("subsection");
  });

  it("extractFactsFromTree_NoHeading_TagsAreUndefined", () => {
    const md = "A fact without any heading.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts[0].tags).toBeUndefined();
  });

  it("extractFactsFromTree_MultiSentenceParagraph_SplitsIntoSeparateFacts", () => {
    const md = "First sentence. Second sentence. Third sentence.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.length).toBeGreaterThanOrEqual(3);
    expect(facts[0].text).toContain("First sentence");
    expect(facts[1].text).toContain("Second sentence");
  });

  it("extractFactsFromTree_Blockquote_SkipsBlockquotes", () => {
    const md = "# Section\n\n> This is a quote.\n\nActual content.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const quoteFact = facts.find((f) => f.text.includes("quote"));
    const contentFact = facts.find((f) => f.text.includes("Actual content"));
    expect(contentFact).toBeDefined();
    expect(facts.every((f) => f.text.includes("quote"))).toBe(false);
  });
});
