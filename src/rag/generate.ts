import { OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL } from "../config.ts";

export async function generateAnswer(
  question: string,
  facts: readonly string[]
): Promise<string> {
  const prompt = `You are a factual assistant.

Use ONLY the facts below to answer.

FACTS:
${facts.join("\n")}

QUESTION:
${question}

If the facts do not contain the answer, say you don't know.`;

  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Generation failed: ${res.statusText}`);
  }

  const { response } = (await res.json()) as { response: string };
  return response;
}