import * as fs from "node:fs/promises";

export async function loadMarkdown(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}
