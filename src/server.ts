import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./utils/config.js";
import { registerResources } from "./resources/index.js";
import { registerTools } from "./tools/index.js";

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: config.serverName,
      version: config.serverVersion,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
      instructions:
        "Mutz MCP Server: Gesetzestexte des Kanton Bern. " +
        "Nutze 'search_laws' um nach Begriffen zu suchen, oder rufe Resources auf um bestimmte Gesetzestexte zu lesen. " +
        "Die Gesetzestexte sind in Deutsch (de/) und Französisch (fr/) verfügbar.",
    },
  );

  registerResources(server);
  registerTools(server);

  return server;
}