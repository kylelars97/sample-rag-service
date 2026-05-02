import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractFactsFromTree, extractFactsWithLLM } from "../src/ingest/factExtractor.js";
import { parseMarkdown } from "../src/ingest/markdownParser.js";
import type { Root } from "mdast";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

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
    expect(quoteFact).toBeUndefined();
  });

  it("extractFactsFromTree_InlineCode_ExtractsCodeText", () => {
    const md = "Use the `extractFacts` function to process markdown.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const codeFact = facts.find((f) => f.text.includes("extractFacts"));
    expect(codeFact).toBeDefined();
  });

  it("extractFactsFromTree_LinkText_ExtractsLinkLabel", () => {
    const md = "Read the [documentation](https://example.com) for details.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const linkFact = facts.find((f) => f.text.includes("documentation"));
    expect(linkFact).toBeDefined();
  });

  it("extractFactsFromTree_Strikethrough_ExtractsDeletedText", () => {
    const md = "This is ~~removed text~~ kept text.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const deletedFact = facts.find((f) => f.text.includes("removed text"));
    expect(deletedFact).toBeDefined();
  });

  it("extractFactsFromTree_CodeBlock_SkipsCodeBlocks", () => {
    const md = "# Section\n\n```\nconst x = 1;\n```\n\nActual content.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const codeLineFact = facts.find((f) => f.text.includes("const x"));
    const contentFact = facts.find((f) => f.text.includes("Actual content"));
    expect(contentFact).toBeDefined();
    expect(codeLineFact).toBeUndefined();
  });

  it("extractFactsFromTree_HorizontalRule_SkipsThematicBreaks", () => {
    const md = "# Section\n\nFirst fact.\n\n---\n\nSecond fact.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.length).toBeGreaterThanOrEqual(2);
    expect(facts.every((f) => !f.text.includes("---"))).toBe(true);
  });

  it("extractFactsFromTree_HeadingWithInlineCode_ExtractsHeadingText", () => {
    const md = "# The `extractFacts` function\n\nSome content.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const codeSectionFact = facts.find((f) => f.sourceSection === "The extractFacts function");
    expect(codeSectionFact).toBeDefined();
  });

  it("extractFactsFromTree_OrderedList_ExtractsListItems", () => {
    const md = "## Steps\n\n1. First step is important.\n2. Second step follows.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.some((f) => f.text.includes("First step"))).toBe(true);
    expect(facts.some((f) => f.text.includes("Second step"))).toBe(true);
  });

  it("extractFactsFromTree_ExclamationSplit_SplitsIntoFacts", () => {
    const md = "GLOP is amazing! It never sleeps.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.length).toBeGreaterThanOrEqual(2);
    expect(facts.some((f) => f.text.includes("amazing"))).toBe(true);
  });

  it("extractFactsFromTree_QuestionSplit_SplitsIntoFacts", () => {
    const md = "What is GLOP? A unified planetary system.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.length).toBeGreaterThanOrEqual(2);
    expect(facts.some((f) => f.text.includes("unified"))).toBe(true);
  });

  it("extractFactsFromTree_BoldInline_ExtractsTextContent", () => {
    const md = "# Intro\n\nGLOP is **absolutely** unified.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const boldFact = facts.find((f) => f.text.includes("absolutely"));
    expect(boldFact).toBeDefined();
  });

  it("extractFactsFromTree_HTMLBlock_SkipsHtmlNodes", () => {
    const md = "# Section\n\n<div>Some HTML content</div>\n\nVisible content.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const visibleFact = facts.find((f) => f.text.includes("Visible content"));
    expect(visibleFact).toBeDefined();
  });

  it("extractFactsFromTree_DeeplyNestedInline_ExtractsAllText", () => {
    const md = "# Deep\n\nThis is **bold *italic `code`* text** here.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    expect(facts.length).toBeGreaterThan(0);
    expect(facts[0].text).toContain("code");
  });

  it("extractFactsFromTree_MultipleHeadings_TracksSectionChanges", () => {
    const md = "# Alpha\n\nAlpha fact.\n\n## Beta\n\nBeta fact.\n\n# Gamma\n\nGamma fact.";
    const tree: Root = parseMarkdown(md);
    const facts = extractFactsFromTree(tree);
    const alphaFact = facts.find((f) => f.text.includes("Alpha fact"));
    const betaFact = facts.find((f) => f.text.includes("Beta fact"));
    const gammaFact = facts.find((f) => f.text.includes("Gamma fact"));
    expect(alphaFact?.sourceSection).toBe("Alpha");
    expect(betaFact?.sourceSection).toBe("Beta");
    expect(gammaFact?.sourceSection).toBe("Gamma");
  });
});

describe("extractFactsWithLLM", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("extractFactsWithLLM_ValidResponse_ReturnsFacts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: JSON.stringify([
          { text: "GLOP is a unified planetary system.", sourceSection: "Overview", tags: ["overview"] },
          { text: "GLOP is managed by the Core Consensus Engine.", sourceSection: "Governance", tags: ["governance"] },
        ]),
      }),
    });
    const facts = await extractFactsWithLLM("GLOP is a unified planetary system. GLOP is managed by the Core Consensus Engine.");
    expect(facts.length).toBe(2);
    expect(facts[0].text).toContain("GLOP");
    expect(facts[0]).toHaveProperty("id");
  });

  it("extractFactsWithLLM_SendsCorrectUrlAndModel_PostsToGenerateApi", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: JSON.stringify([{ text: "A fact." }]),
      }),
    });
    await extractFactsWithLLM("Some text");
    const callUrl = mockFetch.mock.calls[0][0] as string;
    const callOpts = mockFetch.mock.calls[0][1] as RequestInit;
    expect(callUrl).toBe("http://localhost:11434/api/generate");
    const body = JSON.parse(callOpts.body as string);
    expect(body.model).toBe("llama3");
    expect(body.stream).toBe(false);
    expect(body.prompt).toContain("Some text");
  });

  it("extractFactsWithLLM_FailedFetch_ThrowsError", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Service Unavailable" });
    await expect(extractFactsWithLLM("text")).rejects.toThrow();
  });

  it("extractFactsWithLLM_MalformedJsonResponse_ReturnsEmptyArray", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: "not valid json [[" }),
    });
    const facts = await extractFactsWithLLM("text");
    expect(facts).toEqual([]);
  });

  it("extractFactsWithLLM_ResponseWithMissingFields_UsesDefaults", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: JSON.stringify([{ text: "A fact without section." }]),
      }),
    });
    const facts = await extractFactsWithLLM("text");
    expect(facts.length).toBe(1);
    expect(facts[0].text).toBe("A fact without section.");
    expect(facts[0].sourceSection).toBeUndefined();
    expect(facts[0].tags).toBeUndefined();
  });

  it("extractFactsWithLLM_EmptyArrayResponse_ReturnsEmptyArray", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: "[]" }),
    });
    const facts = await extractFactsWithLLM("text");
    expect(facts).toEqual([]);
  });

  it("extractFactsWithLLM_NonArrayResponse_ReturnsEmptyArray", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: JSON.stringify({ text: "not an array" }) }),
    });
    const facts = await extractFactsWithLLM("text");
    expect(facts).toEqual([]);
  });
});
