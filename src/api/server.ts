import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { registerRoutes } from "./routes.js";
import { PORT } from "../config.js";

export function buildServer(): FastifyInstance {
  const server = Fastify({ logger: false });
  registerRoutes(server);
  return server;
}

export async function startServer(port: number = PORT): Promise<FastifyInstance> {
  const server = buildServer();
  await server.listen({ port });
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().then((server) => {
    const address = server.addresses()[0];
    console.log(`Server listening on ${address}`);
  });
}
