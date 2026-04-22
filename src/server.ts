import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./utils/config.js";
import { registerResources } from "./resources/index.js";
import { registerLawTools, registerKontenplanTools, registerListCategoriesTools } from "./tools/index.js";
import { registerKontenplanResources } from "./kontenplan/resources.js";

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
        "Mutz MCP Server: Gesetzestexte des Kanton Bern und Schweizer Kontenplan. " +
        "Nutze 'search_laws' / 'search_laws_fr' um nach Begriffen zu suchen (mit optionalem 'category'-Filter nach Ordnungsnummer, z.B. '66' für Steuern), " +
        "'list_laws_categories' / 'list_laws_categories_fr' um verfügbare Kategorien zu sehen, " +
        "'search_kontenplan' / 'search_kontenplan_fr' für Kontoplan-Suche, " +
        "oder rufe Resources auf um bestimmte Gesetzestexte zu lesen. " +
        "Verfügbar in Deutsch (de) und Französisch (fr).",
    },
  );

  registerResources(server);
  registerLawTools(server);
  registerKontenplanTools(server);
  registerKontenplanResources(server);
  registerListCategoriesTools(server);

  return server;
}