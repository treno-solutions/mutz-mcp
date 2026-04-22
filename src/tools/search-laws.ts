import { z } from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchInLaws } from "../resources/law-resource.js";

export function registerTools(server: McpServer): void {
  server.registerTool(
    "search_laws",
    {
      title: "Gesetzestexte durchsuchen",
      description:
        "Durchsucht alle Gesetzestexte des Kanton Bern nach einem Begriff. Gibt Treffer mit Pfad und Kontext-Snippet zurück.",
      inputSchema: {
        query: z.string().describe("Suchbegriff (case-insensitive)"),
        lang: z
          .enum(["de", "fr"])
          .optional()
          .describe("Sprachfilter: 'de' für Deutsch, 'fr' für Französisch"),
        limit: z
          .number()
          .min(1)
          .max(50)
          .optional()
          .default(10)
          .describe("Maximale Anzahl Ergebnisse (default: 10)"),
      },
    },
    async (args): Promise<{ content: { type: "text"; text: string }[] }> => {
      const results = await searchInLaws(
        args.query,
        args.lang,
        args.limit,
      );

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Keine Treffer für "${args.query}" gefunden.`,
            },
          ],
        };
      }

      const text = results
        .map(
          (r) =>
            `## ${r.title}\nURI: ${r.uri}\nZeile: ${r.line}\n\n\`\`\`\n${r.snippet}\n\`\`\``,
        )
        .join("\n\n---\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `${results.length} Treffer für "${args.query}":\n\n${text}`,
          },
        ],
      };
    },
  );
}