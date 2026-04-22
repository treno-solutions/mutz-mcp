import { z } from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchKontenplan } from "../kontenplan/index.js";

const AREA_LABELS = {
  A: { de: "Aktiven", fr: "Actifs" },
  B: { de: "Passiven", fr: "Passifs" },
  C: { de: "Ertrag", fr: "Produits" },
  D: { de: "Aufwand", fr: "Charges" },
  E: { de: "Abschluss", fr: "Clôture" },
} as const;

const LABELS = {
  de: {
    title: "Kontenplan durchsuchen",
    description:
      "Durchsucht den Schweizer Kontenplan (KMU) nach Kontonummer, Name oder Gruppe. Gibt passende Konten mit Beschreibung, Klassifikationsbereich und Hierarchie zurück.",
    query: "Suchbegriff: Kontonummer, Kontobezeichnung oder Gruppierung",
    area: "Bereich filtern: A=Aktiven, B=Passiven, C=Ertrag, D=Aufwand, E=Abschluss",
    limit: "Maximale Anzahl Ergebnisse (default: 20)",
    noResults: (query: string) => `Keine Konten gefunden für "${query}".`,
    resultHeader: (count: number, query: string) =>
      `${count} Konto${count === 1 ? "" : "konten"} für "${query}":`,
    tax: "Steuerrelevant",
    income: "Erfolgsrechnung",
  },
  fr: {
    title: "Rechercher dans le plan comptable",
    description:
      "Recherche dans le plan comptable suisse (PME) par numéro de compte, nom ou groupe. Retourne les comptes correspondants avec description, section et hiérarchie.",
    query: "Terme de recherche : numéro de compte, nom ou groupe",
    area: "Filtrer par section : A=Actifs, B=Passifs, C=Produits, D=Charges, E=Clôture",
    limit: "Nombre maximal de résultats (par défaut : 20)",
    noResults: (query: string) => `Aucun compte trouvé pour "${query}".`,
    resultHeader: (count: number, query: string) =>
      `${count} compte${count > 1 ? "s" : ""} pour "${query}" :`,
    tax: "Fiscal",
    income: "Compte de résultat",
  },
} as const;

export function registerKontenplanTools(server: McpServer): void {
  for (const [lang, labels] of Object.entries(LABELS)) {
    const suffix = lang === "de" ? "" : `_${lang}`;
    server.registerTool(
      `search_kontenplan${suffix}`,
      {
        title: labels.title,
        description: labels.description,
        inputSchema: {
          query: z.string().describe(labels.query),
          area: z
            .enum(["A", "B", "C", "D", "E"])
            .optional()
            .describe(labels.area),
          limit: z
            .number()
            .min(1)
            .max(50)
            .optional()
            .default(20)
            .describe(labels.limit),
        },
      },
      async (args) => {
        const l = lang as "de" | "fr";
        const results = await searchKontenplan(
          args.query,
          l,
          args.area,
          args.limit,
        );

        if (results.length === 0) {
          return {
            content: [{ type: "text" as const, text: labels.noResults(args.query) }],
          };
        }

        const lines = results.map((a) => {
          const name = l === "fr" ? (a.name.fr || a.name.de) : (a.name.de || a.name.fr);
          const hierarchy = (l === "fr" ? a.group.fr : a.group.de).join(" > ");
          const areaLabel = AREA_LABELS[a.area as keyof typeof AREA_LABELS][l];
          const suffixParts: string[] = [];
          if (a.currency !== "CHF") {
            suffixParts.push(a.currency);
          }
          if (a.hasTax) {
            suffixParts.push(labels.tax);
          }
          if (a.isIncome) {
            suffixParts.push(labels.income);
          }
          const suffixStr = suffixParts.length > 0 ? ` [${suffixParts.join(", ")}]` : "";
          return `- **${a.nr}** ${name} (${areaLabel}) — ${hierarchy}${suffixStr} | *Schweizer Kontenplan KMU*`;
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `${labels.resultHeader(results.length, args.query)}\n\n${lines.join("\n")}`,
            },
          ],
        };
      },
    );
  }
}