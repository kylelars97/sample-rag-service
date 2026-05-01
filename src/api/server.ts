import Fastify from "fastify";
import { registerRoutes } from "./routes.js";

export function buildServer() {
  const server = Fastify({ logger: false });
  registerRoutes(server);
  return server;
}