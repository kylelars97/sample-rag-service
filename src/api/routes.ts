import type { FastifyInstance } from "fastify";
import { runRagQuery } from "../rag/query.js";

export function registerRoutes(server: FastifyInstance): void {
  server.post("/query", async (request, reply) => {
    const body = request.body as { prompt?: string };
    if (!body.prompt || typeof body.prompt !== "string") {
      return reply.status(400).send({ error: "prompt is required" });
    }
    const result = await runRagQuery(body.prompt);
    return result;
  });
}