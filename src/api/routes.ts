import type { FastifyInstance } from "fastify";
import { runRagQuery } from "../rag/query.js";

export function registerRoutes(server: FastifyInstance): void {
  server.get("/", async (_request, reply) => {
    return reply.send({ status: "ok" });
  });

  server.post("/query", async (request, reply) => {
    const prompt = extractPrompt(request.body);
    if (prompt === undefined) {
      return reply.status(400).send({ error: "prompt is required" });
    }
    const result = await runRagQuery(prompt);
    return result;
  });
}

function extractPrompt(body: unknown): string | undefined {
  if (typeof body === "object" && body !== null && "prompt" in body) {
    const { prompt } = body as { prompt: unknown };
    return typeof prompt === "string" && prompt.length > 0 ? prompt : undefined;
  }
  return undefined;
}
