import * as fs from "node:fs/promises";

export async function loadMarkdown(filePath: string): Promise<string> {
  const content: string = await fs.readFile(filePath, "utf-8");
  return content;
}