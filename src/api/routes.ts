import { runRagQuery } from "../rag/query.ts";

type RouteHandler = (req: Request) => Promise<Response>;
type RouteMap = Map<string, RouteHandler>;

export function registerRoutes(routes: RouteMap): void {
  routes.set("GET /", async (_req: Request): Promise<Response> => {
    return Response.json({ status: "ok" });
  });

  routes.set("POST /query", async (req: Request): Promise<Response> => {
    const prompt = extractPrompt(await req.json());
    if (prompt === undefined) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }
    try {
      const result = await runRagQuery(prompt);
      return Response.json(result);
    } catch {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

function extractPrompt(body: unknown): string | undefined {
  if (typeof body === "object" && body !== null && "prompt" in body) {
    const { prompt } = body as { prompt: unknown };
    return typeof prompt === "string" && prompt.length > 0 ? prompt : undefined;
  }
  return undefined;
}