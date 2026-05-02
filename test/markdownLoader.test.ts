import { describe, it, expect } from "vitest";
import { loadMarkdown } from "../src/ingest/markdownLoader.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

describe("loadMarkdown", () => {
  it("loadMarkdown_ReadsExistingFile_ReturnsContent", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "md-test-"));
    const tmpFile = path.join(tmpDir, "test.md");
    await fs.writeFile(tmpFile, "# Hello\n\nWorld");
    const content = await loadMarkdown(tmpFile);
    expect(content).toBe("# Hello\n\nWorld");
    await fs.rm(tmpDir, { recursive: true });
  });

  it("loadMarkdown_FileNotFound_ThrowsError", async () => {
    await expect(loadMarkdown("/nonexistent/path.md")).rejects.toThrow();
  });

  it("loadMarkdown_EmptyFile_ReturnsEmptyString", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "md-test-"));
    const tmpFile = path.join(tmpDir, "empty.md");
    await fs.writeFile(tmpFile, "");
    const content = await loadMarkdown(tmpFile);
    expect(content).toBe("");
    await fs.rm(tmpDir, { recursive: true });
  });
});
