import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

interface CategoryName {
  de: string;
  fr: string;
}

type CategoryMap = Record<string, CategoryName>;

const __dirname = dirname(fileURLToPath(import.meta.url));
const categoriesPath = join(__dirname, "..", "resources", "categories.json");

let cachedCategories: CategoryMap | null = null;

async function loadCategories(): Promise<CategoryMap> {
  if (cachedCategories) {
    return cachedCategories;
  }
  const raw = await readFile(categoriesPath, "utf-8");
  cachedCategories = JSON.parse(raw) as CategoryMap;
  return cachedCategories;
}

const LABELS = {
  de: {
    title: "Gesetzeskategorien anzeigen",
    description:
      "Zeigt alle Ordnungsnummer-Kategorien der Berner Gesetzessammlung. " +
      "Nutze diese Info um den 'category'-Parameter bei search_laws effektiv einzusetzen. " +
      "Hauptkategorien: 1=Staat/Behörden, 2=Zivilrecht, 3=Strafrecht, 4=Kirche/Kultur, 5=Polizei, 6=Finanzen/Steuern, 7=Bau/Verkehr, 8=Gesundheit/Soziales, 9=Wirtschaft.",
    intro: "# Gesetzeskategorien (Ordnungsnummern)\n\n",
  },
  fr: {
    title: "Afficher les catégories de lois",
    description:
      "Affiche les catégories de numéros systématiques de la collection de lois bernoises. " +
      "Utilisez cette information pour le paramètre 'category' de search_laws. " +
      "Catégories principales : 1=État/autorités, 2=Droit privé, 3=Droit pénal, 4=Église/culture, 5=Police, 6=Finances/impôts, 7=Constructions/transports, 8=Santé/social, 9=Économie.",
    intro: "# Catégories de lois (numéros systématiques)\n\n",
  },
} as const;

async function formatTree(lang: "de" | "fr"): Promise<string> {
  const categoryMap = await loadCategories();
  const lines: string[] = [];

  const topKeys = Object.keys(categoryMap).filter((k) => /^[1-9]$/.test(k));
  for (const topKey of topKeys) {
    const topName = categoryMap[topKey][lang] || categoryMap[topKey].de;
    lines.push(`## ${topKey} — ${topName}`);

    const subKeys = Object.keys(categoryMap)
      .filter((k) => new RegExp(`^${topKey}[0-9]$`).test(k))
      .sort((a, b) => Number(a) - Number(b));
    for (const subKey of subKeys) {
      const subName = categoryMap[subKey][lang] || categoryMap[subKey].de;
      lines.push(`- **${subKey}** ${subName}`);

      const detailKeys = Object.keys(categoryMap)
        .filter((k) => new RegExp(`^${subKey}[0-9]$`).test(k))
        .sort((a, b) => Number(a) - Number(b));
      for (const detailKey of detailKeys) {
        const detailName = categoryMap[detailKey][lang] || categoryMap[detailKey].de;
        lines.push(`  - **${detailKey}** ${detailName}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function registerListCategoriesTools(server: McpServer): void {
  for (const [lang, labels] of Object.entries(LABELS)) {
    const suffix = lang === "de" ? "" : `_${lang}`;
    server.registerTool(
      `list_laws_categories${suffix}`,
      {
        title: labels.title,
        description: labels.description,
        inputSchema: {},
      },
      async (): Promise<{ content: { type: "text"; text: string }[] }> => {
        const l = lang as "de" | "fr";
        const tree = await formatTree(l);
        return {
          content: [{ type: "text" as const, text: `${labels.intro}${tree}` }],
        };
      },
    );
  }
}