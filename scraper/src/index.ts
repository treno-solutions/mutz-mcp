import { resolve } from "node:path";
import { Fetcher } from "./fetcher.js";
import { convertHtmlToMarkdown } from "./converter.js";
import {
  writeLawFile,
  writeIndexFile,
  writeRootIndex,
  entriesToSummaries,
  readExistingIndex,
} from "./writer.js";
import type { Language, LawIndexEntry, ScraperOptions } from "./types.js";

const LANGUAGES: Language[] = ["de", "fr"];

function parseArgs(args: string[]): ScraperOptions {
  const options: ScraperOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--lang":
        options.lang = args[++i] as Language;
        break;
      case "--out":
        options.outDir = args[++i];
        break;
      case "--delay":
        options.delay = parseInt(args[++i], 10);
        break;
      case "--include-abrogated":
        options.includeAbrogated = true;
        break;
    }
  }

  return options;
}

async function scrapeLanguage(
  lang: Language,
  fetcher: Fetcher,
  outDir: string,
  includeAbrogated: boolean,
): Promise<{ systematicNumber: string; title: string; abrogated: boolean }[]> {
  console.log(`[${lang}] Fetching law index...`);
  const index = await fetcher.fetchLightweightIndex(lang);

  const allEntries: LawIndexEntry[] = [];
  for (const entries of Object.values(index)) {
    allEntries.push(...entries);
  }

  const entries = includeAbrogated
    ? allEntries
    : allEntries.filter((e) => !e.abrogated);

  console.log(
    `[${lang}] Found ${allEntries.length} laws (${entries.length} in force, ${allEntries.length - entries.length} abrogated)`,
  );

  const summaries = entriesToSummaries(entries, includeAbrogated);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const num = i + 1;

    console.log(`[${lang}] [${num}/${entries.length}] Fetching ${entry.systematic_number}: ${entry.title}`);

    try {
      const response = await fetcher.fetchTextOfLaw(lang, entry.systematic_number);
      const law = response.text_of_law;
      const html = law.selected_version.xhtml_tol;

      if (!html) {
        console.warn(`[${lang}] [${num}/${entries.length}] No xhtml_tol for ${entry.systematic_number}, skipping`);
        continue;
      }

      const markdown = convertHtmlToMarkdown(
        html,
        law.systematic_number,
        law.title,
        law.text_of_law_dates_str,
      );

      await writeLawFile(outDir, lang, entry.systematic_number, markdown);
    } catch (error: unknown) {
      console.error(
        `[${lang}] [${num}/${entries.length}] Error fetching ${entry.systematic_number}: ${String(error)}`,
      );
    }
  }

  console.log(`[${lang}] Writing index file...`);
  await writeIndexFile(outDir, lang, summaries);
  console.log(`[${lang}] Done. ${entries.length} laws scraped.`);

  return summaries;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const outDir = resolve(options.outDir ?? process.env.BELEX_DATA_DIR ?? "./data");
  const delay = options.delay ?? 1000;
  const includeAbrogated = options.includeAbrogated ?? false;
  const langs: Language[] = options.lang ? [options.lang] : LANGUAGES;

  console.log("Belex Scraper");
  console.log(`Output directory: ${outDir}`);
  console.log(`Languages: ${langs.join(", ")}`);
  console.log(`Delay: ${delay}ms`);
  console.log(`Include abrogated: ${includeAbrogated}`);
  console.log();

  const fetcher = new Fetcher(delay);
  const allLaws: Record<Language, { systematicNumber: string; title: string; abrogated: boolean }[]> = {
    de: [],
    fr: [],
  };

  for (const lang of langs) {
    allLaws[lang] = await scrapeLanguage(lang, fetcher, outDir, includeAbrogated);
  }

  for (const lang of LANGUAGES) {
    if (allLaws[lang].length === 0) {
      const existing = await readExistingIndex(outDir, lang);
      if (existing.length > 0) {
        allLaws[lang] = existing;
      }
    }
  }

  console.log("\nWriting root index...");
  await writeRootIndex(outDir, allLaws);
  console.log("Done!");
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});