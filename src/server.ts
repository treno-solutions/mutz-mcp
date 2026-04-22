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
        "Mutz MCP Server: Gesetzestexte des Kanton Bern und Schweizer Kontenplan.\n\n" +
        "Antwort-Regeln:\n" +
        "- Zitiere immer: Gesetzesnummer, Artikel und Abkürzung, z.B. «Art. 74 Abs. 2 StG (661.11)»\n" +
        "- Für Kontenplan-Antworten: Kontonummer, Name, Bereich, Hierarchie, z.B. «Konto 4200 Aufwand für Dienstleistungen (Aufwand, Erfolgsrechnung)»\n" +
        "- Nutze 'search_laws'/'search_laws_fr' mit category-Filter für gezielte Suche (z.B. category='66' für Steuern)\n" +
        "- Nutze 'list_laws_categories'/'list_laws_categories_fr' für verfügbare Kategorien\n" +
        "- Verweise auf die URI für den vollständigen Text\n" +
        "- Keine Halluzinationen — antworte nur mit Quellen aus den Tools\n" +
        "- Verfügbar in Deutsch (de) und Französisch (fr)",
    },
  );

  registerResources(server);
  registerLawTools(server);
  registerKontenplanTools(server);
  registerKontenplanResources(server);
  registerListCategoriesTools(server);

  return server;
}