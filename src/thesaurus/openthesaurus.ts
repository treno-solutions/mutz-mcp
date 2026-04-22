const OPENTHESAURUS_URL = "https://www.openthesaurus.de/synonyme/search";
const TIMEOUT_MS = 3000;
const MAX_SYNONYMS_PER_WORD = 5;

interface OpenThesaurusTerm {
  term: string;
  level?: string;
}

interface OpenThesaurusSynset {
  id: number;
  categories: string[];
  terms: OpenThesaurusTerm[];
}

interface OpenThesaurusResponse {
  synsets: OpenThesaurusSynset[];
}

const RELEVANT_CATEGORIES = new Set([
  "Ökonomie",
  "Wirtschaft",
  "Finanzen",
  "Steuern",
  "Recht",
  "Bookkeeping",
]);

export async function fetchSynonyms(word: string): Promise<string[]> {
  const url = `${OPENTHESAURUS_URL}?q=${encodeURIComponent(word)}&format=application/json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return [];
    }

    let data: OpenThesaurusResponse;
    try {
      data = (await response.json()) as OpenThesaurusResponse;
    } catch {
      return [];
    }

    if (!Array.isArray(data.synsets)) {
      return [];
    }

    const synonyms: string[] = [];

    for (const synset of data.synsets) {
      const hasRelevantCategory =
        !Array.isArray(synset.categories) ||
        synset.categories.length === 0 ||
        synset.categories.some((c) => RELEVANT_CATEGORIES.has(c));

      if (!hasRelevantCategory) {
        continue;
      }

      if (!Array.isArray(synset.terms)) {
        continue;
      }

      for (const term of synset.terms) {
        if (term.level === "umgangssprachlich" || term.level === "derb") {
          continue;
        }

        const normalized = term.term.toLowerCase();
        if (normalized !== word.toLowerCase() && !synonyms.includes(term.term)) {
          synonyms.push(term.term);
        }

        if (synonyms.length >= MAX_SYNONYMS_PER_WORD) {
          break;
        }
      }

      if (synonyms.length >= MAX_SYNONYMS_PER_WORD) {
        break;
      }
    }

    return synonyms;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}