import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadKontenplan } from "./index.js";

const AREA_LABELS = {
  A: { de: "Aktiven", fr: "Actifs" },
  B: { de: "Passiven", fr: "Passifs" },
  C: { de: "Ertrag", fr: "Produits" },
  D: { de: "Aufwand", fr: "Charges" },
  E: { de: "Abschluss", fr: "Clôture" },
} as const;

async function formatKontenplan(lang: "de" | "fr"): Promise<string> {
  const lines: string[] = [];
  const title = lang === "fr"
    ? "# Plan comptable suisse (PME)"
    : "# Schweizer Kontenplan (KMU)";
  lines.push(title);
  lines.push("");

  const plan = await loadKontenplan();
  const areas: Record<string, string[]> = {};

  for (const account of plan.accounts) {
    const name = lang === "fr" ? (account.name.fr || account.name.de) : (account.name.de || account.name.fr);
    (areas[account.area] ??= []).push(`- **${account.nr}** ${name}`);
  }

  for (const [areaKey, accountLines] of Object.entries(areas)) {
    const areaLabel = AREA_LABELS[areaKey as keyof typeof AREA_LABELS][lang];
    lines.push(`## ${areaLabel}`);
    lines.push("");
    lines.push(...accountLines);
    lines.push("");
  }

  return lines.join("\n");
}

export function registerKontenplanResources(server: McpServer): void {
  server.registerResource(
    "kontenplan-de",
    "mutz://de/kontenplan",
    {
      title: "Schweizer Kontenplan (KMU)",
      description: "Kontenplan nach Schweizer KMU-Standard, auf Deutsch",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const content = await formatKontenplan("de");
      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text: content }],
      };
    },
  );

  server.registerResource(
    "kontenplan-fr",
    "mutz://fr/kontenplan",
    {
      title: "Plan comptable suisse (PME)",
      description: "Plan comptable selon le standard PME suisse, en français",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const content = await formatKontenplan("fr");
      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text: content }],
      };
    },
  );
}