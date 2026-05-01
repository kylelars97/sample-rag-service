import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../src/ingest/markdownParser.js";

describe("parseMarkdown", () => {
  it("parseMarkdown_ParsesSimpleHeading_ReturnsTreeWithHeading", async () => {
    const md = "# Hello World";
    const tree = await parseMarkdown(md);
    expect(tree.type).toBe("root");
    expect(tree.children.length).toBeGreaterThan(0);
  });

  it("parseMarkdown_ParsesParagraphAndHeading_ReturnsBothNodes", async () => {
    const md = "# Title\n\nSome paragraph text.";
    const tree = await parseMarkdown(md);
    expect(tree.type).toBe("root");
    expect(tree.children.length).toBeGreaterThanOrEqual(2);
  });

  it("parseMarkdown_ParsesEmptyString_ReturnsEmptyRoot", async () => {
    const md = "";
    const tree = await parseMarkdown(md);
    expect(tree.type).toBe("root");
  });
});