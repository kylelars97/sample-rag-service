import { assertEquals, assertRejects, assert } from "@std/assert";
import { extractFactsFromTree, extractFactsWithLLM } from "../src/ingest/factExtractor.ts";
import { parseMarkdown } from "../src/ingest/markdownParser.ts";
import type { Root } from "mdast";
import { stub } from "@std/testing/mock";

Deno.test("extractFactsFromTree_SimpleParagraph_ReturnsFact", () => {
  const md = "GLOP is a unified planetary system.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assert(facts.length > 0);
  assert(facts[0].text.includes("GLOP"));
});

Deno.test("extractFactsFromTree_HeadingWithBody_ReturnsFactsFromBoth", () => {
  const md = "# Overview\n\nGLOP is a unified planetary system.\n\n## Governance\n\nGLOP is managed by the Core Consensus Engine.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assert(facts.length >= 2);
});

Deno.test("extractFactsFromTree_ListItems_ReturnsFactsFromItems", () => {
  const md = "## Features\n\n- Feature one is great.\n- Feature two is better.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assert(facts.some((f) => f.text.includes("Feature one")));
  assert(facts.some((f) => f.text.includes("Feature two")));
});

Deno.test("extractFactsFromTree_EmptyInput_ReturnsEmptyArray", () => {
  const md = "";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assertEquals(facts, []);
});

Deno.test("extractFactsFromTree_FactsHaveIds_ReturnsFactsWithValidIds", () => {
  const md = "Some content here.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  for (const fact of facts) {
    assert(fact.id.length > 0);
  }
});

Deno.test("extractFactsFromTree_FactsHaveSourceSection_IncludesHeading", () => {
  const md = "# Title\n\nContent under title.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const withSection = facts.find((f) => f.sourceSection !== undefined);
  assert(withSection !== undefined);
});

Deno.test("extractFactsFromTree_HeadingSection_AddsTagFromHeading", () => {
  const md = "# Overview\n\nGLOP is a unified planetary system.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const withTag = facts.find((f) => f.tags !== undefined && f.tags.length > 0);
  assert(withTag !== undefined);
  assert(withTag!.tags!.includes("overview"));
});

Deno.test("extractFactsFromTree_NestedHeading_UseMostRecentHeadingAsTag", () => {
  const md = "# Top\n\n## Subsection\n\nSome detail here.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const detailFact = facts.find((f) => f.text.includes("detail"));
  assert(detailFact !== undefined);
  assert(detailFact!.tags!.includes("subsection"));
});

Deno.test("extractFactsFromTree_NoHeading_TagsAreUndefined", () => {
  const md = "A fact without any heading.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assertEquals(facts[0].tags, undefined);
});

Deno.test("extractFactsFromTree_MultiSentenceParagraph_SplitsIntoSeparateFacts", () => {
  const md = "First sentence. Second sentence. Third sentence.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assert(facts.length >= 3);
  assert(facts[0].text.includes("First sentence"));
  assert(facts[1].text.includes("Second sentence"));
});

Deno.test("extractFactsFromTree_Blockquote_SkipsBlockquotes", () => {
  const md = "# Section\n\n> This is a quote.\n\nActual content.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const quoteFact = facts.find((f) => f.text.includes("quote"));
  const contentFact = facts.find((f) => f.text.includes("Actual content"));
  assert(contentFact !== undefined);
  assertEquals(quoteFact, undefined);
});

Deno.test("extractFactsFromTree_InlineCode_ExtractsCodeText", () => {
  const md = "Use the `extractFacts` function to process markdown.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const codeFact = facts.find((f) => f.text.includes("extractFacts"));
  assert(codeFact !== undefined);
});

Deno.test("extractFactsFromTree_LinkText_ExtractsLinkLabel", () => {
  const md = "Read the [documentation](https://example.com) for details.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const linkFact = facts.find((f) => f.text.includes("documentation"));
  assert(linkFact !== undefined);
});

Deno.test("extractFactsFromTree_Strikethrough_ExtractsDeletedText", () => {
  const md = "This is ~~removed text~~ kept text.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const deletedFact = facts.find((f) => f.text.includes("removed text"));
  assert(deletedFact !== undefined);
});

Deno.test("extractFactsFromTree_CodeBlock_SkipsCodeBlocks", () => {
  const md = "# Section\n\n```\nconst x = 1;\n```\n\nActual content.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const codeLineFact = facts.find((f) => f.text.includes("const x"));
  const contentFact = facts.find((f) => f.text.includes("Actual content"));
  assert(contentFact !== undefined);
  assertEquals(codeLineFact, undefined);
});

Deno.test("extractFactsFromTree_HorizontalRule_SkipsThematicBreaks", () => {
  const md = "# Section\n\nFirst fact.\n\n---\n\nSecond fact.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assert(facts.length >= 2);
  assert(facts.every((f) => !f.text.includes("---")));
});

Deno.test("extractFactsFromTree_HeadingWithInlineCode_ExtractsHeadingText", () => {
  const md = "# The `extractFacts` function\n\nSome content.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const codeSectionFact = facts.find((f) => f.sourceSection === "The extractFacts function");
  assert(codeSectionFact !== undefined);
});

Deno.test("extractFactsFromTree_OrderedList_ExtractsListItems", () => {
  const md = "## Steps\n\n1. First step is important.\n2. Second step follows.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assert(facts.some((f) => f.text.includes("First step")));
  assert(facts.some((f) => f.text.includes("Second step")));
});

Deno.test("extractFactsFromTree_ExclamationSplit_SplitsIntoFacts", () => {
  const md = "GLOP is amazing! It never sleeps.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assert(facts.length >= 2);
  assert(facts.some((f) => f.text.includes("amazing")));
});

Deno.test("extractFactsFromTree_QuestionSplit_SplitsIntoFacts", () => {
  const md = "What is GLOP? A unified planetary system.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assert(facts.length >= 2);
  assert(facts.some((f) => f.text.includes("unified")));
});

Deno.test("extractFactsFromTree_BoldInline_ExtractsTextContent", () => {
  const md = "# Intro\n\nGLOP is **absolutely** unified.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const boldFact = facts.find((f) => f.text.includes("absolutely"));
  assert(boldFact !== undefined);
});

Deno.test("extractFactsFromTree_HTMLBlock_SkipsHtmlNodes", () => {
  const md = "# Section\n\n<div>Some HTML content</div>\n\nVisible content.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const visibleFact = facts.find((f) => f.text.includes("Visible content"));
  assert(visibleFact !== undefined);
});

Deno.test("extractFactsFromTree_DeeplyNestedInline_ExtractsAllText", () => {
  const md = "# Deep\n\nThis is **bold *italic `code`* text** here.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  assert(facts.length > 0);
  assert(facts[0].text.includes("code"));
});

Deno.test("extractFactsFromTree_MultipleHeadings_TracksSectionChanges", () => {
  const md = "# Alpha\n\nAlpha fact.\n\n## Beta\n\nBeta fact.\n\n# Gamma\n\nGamma fact.";
  const tree: Root = parseMarkdown(md);
  const facts = extractFactsFromTree(tree);
  const alphaFact = facts.find((f) => f.text.includes("Alpha fact"));
  const betaFact = facts.find((f) => f.text.includes("Beta fact"));
  const gammaFact = facts.find((f) => f.text.includes("Gamma fact"));
  assertEquals(alphaFact?.sourceSection, "Alpha");
  assertEquals(betaFact?.sourceSection, "Beta");
  assertEquals(gammaFact?.sourceSection, "Gamma");
});

Deno.test("extractFactsWithLLM_ValidResponse_ReturnsFacts", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          response: JSON.stringify([
            { text: "GLOP is a unified planetary system.", sourceSection: "Overview", tags: ["overview"] },
            { text: "GLOP is managed by the Core Consensus Engine.", sourceSection: "Governance", tags: ["governance"] },
          ]),
        }),
      ),
    ));
  try {
    const facts = await extractFactsWithLLM("GLOP is a unified planetary system. GLOP is managed by the Core Consensus Engine.");
    assertEquals(facts.length, 2);
    assert(facts[0].text.includes("GLOP"));
    assert("id" in facts[0]);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("extractFactsWithLLM_SendsCorrectUrlAndModel_PostsToGenerateApi", async () => {
  let calledUrl = "";
  let calledBody = "";
  const fetchStub = stub(globalThis, "fetch", (input: URL | RequestInfo, init?: RequestInit) => {
    calledUrl = input as string;
    calledBody = init?.body as string;
    return Promise.resolve(
      new Response(JSON.stringify({ response: JSON.stringify([{ text: "A fact." }]) })),
    );
  });
  try {
    await extractFactsWithLLM("Some text");
    assertEquals(calledUrl, "http://localhost:11434/api/generate");
    const body = JSON.parse(calledBody);
    assertEquals(body.model, "llama3");
    assertEquals(body.stream, false);
    assert(body.prompt.includes("Some text"));
  } finally {
    fetchStub.restore();
  }
});

Deno.test("extractFactsWithLLM_FailedFetch_ThrowsError", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(null, { status: 503, statusText: "Service Unavailable" })));
  try {
    await assertRejects(() => extractFactsWithLLM("text"));
  } finally {
    fetchStub.restore();
  }
});

Deno.test("extractFactsWithLLM_MalformedJsonResponse_ReturnsEmptyArray", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ response: "not valid json [[" }))));
  try {
    const facts = await extractFactsWithLLM("text");
    assertEquals(facts, []);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("extractFactsWithLLM_ResponseWithMissingFields_UsesDefaults", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify({ response: JSON.stringify([{ text: "A fact without section." }]) })),
    ));
  try {
    const facts = await extractFactsWithLLM("text");
    assertEquals(facts.length, 1);
    assertEquals(facts[0].text, "A fact without section.");
    assertEquals(facts[0].sourceSection, undefined);
    assertEquals(facts[0].tags, undefined);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("extractFactsWithLLM_EmptyArrayResponse_ReturnsEmptyArray", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ response: "[]" }))));
  try {
    const facts = await extractFactsWithLLM("text");
    assertEquals(facts, []);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("extractFactsWithLLM_NonArrayResponse_ReturnsEmptyArray", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify({ response: JSON.stringify({ text: "not an array" }) })),
    ));
  try {
    const facts = await extractFactsWithLLM("text");
    assertEquals(facts, []);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("extractFactsWithLLM_ItemsWithInvalidFields_AreSkipped", async () => {
  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          response: JSON.stringify([
            { text: "Valid fact." },
            { text: 123 },
            { sourceSection: "No text field" },
            { text: "Has bad tags", tags: ["good", 42] },
          ]),
        }),
      ),
    ));
  try {
    const facts = await extractFactsWithLLM("text");
    assertEquals(facts.length, 1);
    assertEquals(facts[0].text, "Valid fact.");
  } finally {
    fetchStub.restore();
  }
});