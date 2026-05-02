import { registerRoutes } from "./routes.ts";
import { PORT } from "../config.ts";

export function createRouter(): Map<string, (req: Request) => Promise<Response>> {
  const routes = new Map<string, (req: Request) => Promise<Response>>();
  registerRoutes(routes);
  return routes;
}

export function startServer(port: number = PORT): void {
  const router = createRouter();
  Deno.serve({ port }, async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const handler = router.get(`${req.method} ${url.pathname}`);
    if (handler) {
      return handler(req);
    }
    if (url.pathname === "/" && req.method === "GET") {
      return Response.json({ status: "ok" });
    }
    return new Response("Not Found", { status: 404 });
  });
}

if (import.meta.main) {
  startServer();
  console.log(`Server listening on port ${PORT}`);
}