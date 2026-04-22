import { fetchSynonyms } from "./openthesaurus.js";

const MIN_WORD_LENGTH = 3;

const STOP_WORDS_DE = new Set([
  "der", "die", "das", "und", "oder", "als", "bei", "mit", "von", "für",
  "auf", "aus", "in", "an", "im", "ist", "ein", "eine", "einer", "einem",
  "des", "den", "dem", "sich", "auch", "noch", "nach", "über", "vor", "zur",
  "zum", "durch", "zwischen", "wie", "was", "wer", "wo", "wann", "warum",
]);

export async function expandQueryWithSynonyms(
  query: string,
): Promise<string[]> {
  const words = query
    .split(/[\s,;.]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= MIN_WORD_LENGTH && !STOP_WORDS_DE.has(w.toLowerCase()));

  if (words.length === 0) {
    return [];
  }

  const allSynonyms: string[] = [];

  for (const word of words) {
    const synonyms = await fetchSynonyms(word);
    allSynonyms.push(...synonyms);
  }

  return [...new Set(allSynonyms)];
}

export async function expandSearchTerms(
  query: string,
): Promise<string[]> {
  const originalWords = query
    .split(/[\s,;.]+/)
    .filter((w) => w.length > 0);

  const synonyms = await expandQueryWithSynonyms(query);

  return [...new Set([...originalWords, ...synonyms])];
}