export async function loadMarkdown(filePath: string): Promise<string> {
  return Deno.readTextFile(filePath);
}