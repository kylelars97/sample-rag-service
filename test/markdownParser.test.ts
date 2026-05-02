import { assertEquals, assert } from "@std/assert";
import { parseMarkdown } from "../src/ingest/markdownParser.ts";

Deno.test("parseMarkdown_ParsesSimpleHeading_ReturnsTreeWithHeading", () => {
  const md = "# Hello World";
  const tree = parseMarkdown(md);
  assertEquals(tree.type, "root");
  assert(tree.children.length > 0);
});

Deno.test("parseMarkdown_ParsesParagraphAndHeading_ReturnsBothNodes", () => {
  const md = "# Title\n\nSome paragraph text.";
  const tree = parseMarkdown(md);
  assertEquals(tree.type, "root");
  assert(tree.children.length >= 2);
});

Deno.test("parseMarkdown_ParsesEmptyString_ReturnsEmptyRoot", () => {
  const md = "";
  const tree = parseMarkdown(md);
  assertEquals(tree.type, "root");
});

Deno.test("parseMarkdown_ParsesList_ReturnsListNode", () => {
  const md = "- item one\n- item two";
  const tree = parseMarkdown(md);
  const hasList = tree.children.some((c) => c.type === "list");
  assert(hasList);
});

Deno.test("parseMarkdown_ParsesInlineFormatting_ReturnsTextContent", () => {
  const md = "This is **bold** and *italic* text.";
  const tree = parseMarkdown(md);
  assert(tree.children.length > 0);
});

Deno.test("parseMarkdown_ParsesHeadingsWithMultipleLevels_ReturnsAllHeadings", () => {
  const md = "# H1\n\n## H2\n\n### H3\n\nContent.";
  const tree = parseMarkdown(md);
  const headings = tree.children.filter((c) => c.type === "heading");
  assertEquals(headings.length, 3);
});

Deno.test("parseMarkdown_ParsesNestedLists_ReturnsListStructure", () => {
  const md = "- item one\n  - nested item\n- item two";
  const tree = parseMarkdown(md);
  const hasList = tree.children.some((c) => c.type === "list");
  assert(hasList);
});