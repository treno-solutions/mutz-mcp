import { readFile } from "node:fs/promises";
import { config } from "../utils/config.js";
import type { Kontenplan, KontenplanAccount } from "./types.js";

export type { Kontenplan, KontenplanAccount };

let cachedKontenplan: Kontenplan | null = null;

export async function loadKontenplan(): Promise<Kontenplan> {
  if (cachedKontenplan) {
    return cachedKontenplan;
  }

  try {
    const raw = await readFile(config.kontenplanPath, "utf-8");
    cachedKontenplan = JSON.parse(raw) as Kontenplan;
    return cachedKontenplan;
  } catch {
    return { accounts: [] };
  }
}

const SYNONYM_THRESHOLD = 2;

function searchInPlan(
  plan: Kontenplan,
  lowerQuery: string,
  area: string | undefined,
  limit: number,
): KontenplanAccount[] {
  const results: KontenplanAccount[] = [];

  for (const account of plan.accounts) {
    if (results.length >= limit) {
      break;
    }

    if (area && account.area !== area) {
      continue;
    }

    const nameDe = account.name.de || "";
    const nameFr = account.name.fr || "";
    const groupDe = account.group.de.join(" ");
    const groupFr = account.group.fr.join(" ");
    const searchableText = `${account.nr} ${nameDe} ${nameFr} ${groupDe} ${groupFr} ${account.area}`.toLowerCase();

    if (searchableText.includes(lowerQuery)) {
      results.push(account);
    }
  }

  return results;
}

export async function searchKontenplan(
  query: string,
  lang?: string,
  area?: string,
  limit = 20,
): Promise<KontenplanAccount[]> {
  const plan = await loadKontenplan();
  const lowerQuery = query.toLowerCase();

  const results = searchInPlan(plan, lowerQuery, area, limit);

  if (results.length <= SYNONYM_THRESHOLD) {
    try {
      const { fetchSynonyms } = await import("../thesaurus/openthesaurus.js");
      const words = query.split(/[\s,;.]+/).filter((w) => w.length >= 3);
      const seenNrs = new Set(results.map((r) => r.nr));

      for (const word of words) {
        if (results.length >= limit) break;

        let synonyms: string[];
        try {
          synonyms = await fetchSynonyms(word);
        } catch {
          continue;
        }

        for (const synonym of synonyms) {
          if (results.length >= limit) break;

          const synonymResults = searchInPlan(plan, synonym.toLowerCase(), area, limit - results.length);

          for (const r of synonymResults) {
            if (!seenNrs.has(r.nr)) {
              seenNrs.add(r.nr);
              results.push(r);
              if (results.length >= limit) break;
            }
          }
        }
      }
    } catch {
      // Synonym expansion is best-effort; never fail the main search
    }
  }

  return results;
}