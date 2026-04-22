import { z } from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchInLaws } from "../resources/law-resource.js";

const LABELS = {
  de: {
    title: "Gesetzestexte durchsuchen",
    description:
      "Durchsucht alle Gesetzestexte des Kanton Bern nach einem Begriff. Gibt Treffer mit Pfad und Kontext-Snippet zurück.",
    query: "Suchbegriff (case-insensitive)",
    lang: "Sprachfilter: 'de' für Deutsch, 'fr' für Französisch",
    category: "Ordnungsnummer-Filter (z.B. '66' für Steuern, '72' für Bauen, '62' für Finanzen)",
    limit: "Maximale Anzahl Ergebnisse (default: 10)",
    noResults: (query: string) => `Keine Treffer für "${query}" gefunden.`,
    resultHeader: (count: number, query: string) => `${count} Treffer für "${query}":`,
    line: (line: number) => `Zeile: ${line}`,
  },
  fr: {
    title: "Rechercher dans les textes de loi",
    description:
      "Recherche un terme dans tous les textes de loi du canton de Berne. Retourne les résultats avec le chemin et un extrait du contexte.",
    query: "Terme de recherche (insensible à la casse)",
    lang: "Filtre de langue : 'de' pour l'allemand, 'fr' pour le français",
    category: "Filtre par numéro systématique (ex. '66' pour les impôts, '72' pour la construction, '62' pour les finances)",
    limit: "Nombre maximal de résultats (par défaut : 10)",
    noResults: (query: string) => `Aucun résultat pour "${query}".`,
    resultHeader: (count: number, query: string) => `${count} résultat${count > 1 ? "s" : ""} pour "${query}" :`,
    line: (line: number) => `Ligne : ${line}`,
  },
} as const;

export function registerLawTools(server: McpServer): void {
  for (const [lang, labels] of Object.entries(LABELS)) {
    const suffix = lang === "de" ? "" : `_${lang}`;
    server.registerTool(
      `search_laws${suffix}`,
      {
        title: labels.title,
        description: labels.description,
        inputSchema: {
          query: z.string().describe(labels.query),
          category: z
            .string()
            .optional()
            .describe(labels.category),
          limit: z
            .number()
            .min(1)
            .max(50)
            .optional()
            .default(10)
            .describe(labels.limit),
        },
      },
      async (args): Promise<{ content: { type: "text"; text: string }[] }> => {
        const l = lang as "de" | "fr";
        const results = await searchInLaws(
          args.query,
          l,
          args.limit,
          args.category,
        );

        if (results.length === 0) {
          return {
            content: [{ type: "text" as const, text: labels.noResults(args.query) }],
          };
        }

        const text = results
          .map(
            (r) => {
              const heading = r.abbreviation
                ? `${r.title} (${r.abbreviation})`
                : r.title;
              const articleTag = r.article || "";
              const location = [articleTag, `URI: ${r.uri}`].filter(Boolean).join(" | ");
              return `## ${heading}\n${location}\n\n\`\`\`\n${r.snippet}\n\`\`\``;
            },
          )
          .join("\n\n---\n\n");

        return {
          content: [
            { type: "text" as const, text: `${labels.resultHeader(results.length, args.query)}\n\n${text}` },
          ],
        };
      },
    );
  }
}