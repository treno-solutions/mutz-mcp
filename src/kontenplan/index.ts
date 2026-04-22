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

export async function searchKontenplan(
  query: string,
  lang?: string,
  area?: string,
  limit = 20,
): Promise<KontenplanAccount[]> {
  const plan = await loadKontenplan();
  const lowerQuery = query.toLowerCase();
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