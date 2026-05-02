import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { registerRoutes } from "./routes.js";

export function buildServer(): FastifyInstance {
  const server = Fastify({ logger: false });
  registerRoutes(server);
  return server;
}
