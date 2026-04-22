import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Language, LawIndexEntry } from "./types.js";

interface LawSummary {
  systematicNumber: string;
  title: string;
  abrogated: boolean;
}

export async function writeLawFile(
  outDir: string,
  lang: Language,
  systematicNumber: string,
  content: string,
): Promise<string> {
  const filePath = join(outDir, lang, `${systematicNumber}.md`);
  await mkdir(join(outDir, lang), { recursive: true });
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

export async function writeIndexFile(
  outDir: string,
  lang: Language,
  laws: LawSummary[],
): Promise<string> {
  const lines: string[] = [];

  const langTitle = lang === "de" ? "Deutsche Fassung" : "Version française";
  lines.push(`# ${langTitle}\n`);
  lines.push("| Nr. | Titel | Status |");
  lines.push("|-----|-------|--------|");

  for (const law of laws) {
    const status = law.abrogated ? "aufgehoben" : "in Kraft";
    lines.push(`| ${law.systematicNumber} | ${law.title} | ${status} |`);
  }

  const filePath = join(outDir, lang, "_index.md");
  await mkdir(join(outDir, lang), { recursive: true });
  await writeFile(filePath, lines.join("\n"), "utf-8");
  return filePath;
}

export async function writeRootIndex(
  outDir: string,
  allLaws: Record<Language, LawSummary[]>,
): Promise<string> {
  const lines: string[] = [];
  lines.push("# Belex — Gesetzessammlung Kanton Bern\n");
  lines.push("Übersicht der verfügbaren Gesetzestexte.\n");

  for (const lang of ["de", "fr"] as Language[]) {
    const langLabel = lang === "de" ? "Deutsch" : "Français";
    lines.push(`## ${langLabel}\n`);
    lines.push(`[${langLabel}](${lang}/_index.md) — ${allLaws[lang].length} Gesetzestexte\n`);
  }

  const filePath = join(outDir, "_index.md");
  await writeFile(filePath, lines.join("\n"), "utf-8");
  return filePath;
}

export function entriesToSummaries(
  entries: LawIndexEntry[],
  includeAbrogated: boolean,
): LawSummary[] {
  return entries
    .filter((e) => includeAbrogated || !e.abrogated)
    .map((e) => ({
      systematicNumber: e.systematic_number,
      title: e.title,
      abrogated: e.abrogated,
    }));
}

export async function readExistingIndex(
  outDir: string,
  lang: Language,
): Promise<LawSummary[]> {
  const filePath = join(outDir, lang, "_index.md");
  let content: string;
  try {
    content = await readFile(filePath, "utf-8");
  } catch {
    return [];
  }

  const lines = content.split("\n");
  const summaries: LawSummary[] = [];

  for (const line of lines) {
    const match = line.match(/^\|\s*([\d.]+(?:-\d+)*)\s*\|\s*(.+?)\s*\|\s*(in Kraft|aufgehoben)\s*\|$/);
    if (match) {
      summaries.push({
        systematicNumber: match[1],
        title: match[2].trim(),
        abrogated: match[3] === "aufgehoben",
      });
    }
  }

  return summaries;
}