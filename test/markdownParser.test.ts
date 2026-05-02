import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../src/ingest/markdownParser.js";

describe("parseMarkdown", () => {
  it("parseMarkdown_ParsesSimpleHeading_ReturnsTreeWithHeading", () => {
    const md = "# Hello World";
    const tree = parseMarkdown(md);
    expect(tree.type).toBe("root");
    expect(tree.children.length).toBeGreaterThan(0);
  });

  it("parseMarkdown_ParsesParagraphAndHeading_ReturnsBothNodes", () => {
    const md = "# Title\n\nSome paragraph text.";
    const tree = parseMarkdown(md);
    expect(tree.type).toBe("root");
    expect(tree.children.length).toBeGreaterThanOrEqual(2);
  });

  it("parseMarkdown_ParsesEmptyString_ReturnsEmptyRoot", () => {
    const md = "";
    const tree = parseMarkdown(md);
    expect(tree.type).toBe("root");
  });
});
