import { assertEquals, assertRejects } from "@std/assert";
import { loadMarkdown } from "../src/ingest/markdownLoader.ts";

Deno.test("loadMarkdown_ReadsExistingFile_ReturnsContent", async () => {
  const tmpDir = await Deno.makeTempDir({ prefix: "md-test-" });
  const tmpFile = `${tmpDir}/test.md`;
  await Deno.writeTextFile(tmpFile, "# Hello\n\nWorld");
  const content = await loadMarkdown(tmpFile);
  assertEquals(content, "# Hello\n\nWorld");
  await Deno.remove(tmpDir, { recursive: true });
});

Deno.test("loadMarkdown_FileNotFound_ThrowsError", async () => {
  await assertRejects(() => loadMarkdown("/nonexistent/path.md"));
});

Deno.test("loadMarkdown_EmptyFile_ReturnsEmptyString", async () => {
  const tmpDir = await Deno.makeTempDir({ prefix: "md-test-" });
  const tmpFile = `${tmpDir}/empty.md`;
  await Deno.writeTextFile(tmpFile, "");
  const content = await loadMarkdown(tmpFile);
  assertEquals(content, "");
  await Deno.remove(tmpDir, { recursive: true });
});