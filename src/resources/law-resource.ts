import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { config } from "../utils/config.js";

export interface LawEntry {
  uri: string;
  path: string;
  title: string;
  description: string;
}

const MUTZ_SCHEME = "mutz://";

const ARTICLE_HEADING_RE = /^### Art\. (\S+)/u;
const ABBR_RE = /^\*\((.+?)\)\*$/u;

function mdPathToUri(filePath: string): string {
  const rel = relative(config.dataDir, filePath);
  const withoutExt = rel.replace(/\.md$/, "");
  const normalized = withoutExt.split(sep).join("/");
  return `${MUTZ_SCHEME}${normalized}`;
}

function uriToFilePath(uri: string): string {
  if (!uri.startsWith(MUTZ_SCHEME)) {
    throw new Error(`Invalid URI scheme: ${uri}`);
  }
  const pathPart = uri.slice(MUTZ_SCHEME.length);
  return join(config.dataDir, `${pathPart}.md`);
}

function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

export async function discoverLawFiles(): Promise<LawEntry[]> {
  const entries: LawEntry[] = [];

  async function walk(dir: string): Promise<void> {
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      return;
    }

    for (const file of files) {
      const fullPath = join(dir, file);
      const fileStat = await stat(fullPath);

      if (fileStat.isDirectory()) {
        await walk(fullPath);
      } else if (file.endsWith(".md")) {
        const content = await readFile(fullPath, "utf-8");
        const uri = mdPathToUri(fullPath);
        const relPath = relative(config.dataDir, fullPath);
        const title = extractTitle(content, relPath);

        entries.push({
          uri,
          path: fullPath,
          title,
          description: title,
        });
      }
    }
  }

  await walk(config.dataDir);
  return entries;
}

export async function readLawContent(uri: string): Promise<string | null> {
  const filePath = uriToFilePath(uri);
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export interface SearchResult {
  uri: string;
  title: string;
  abbreviation: string;
  article: string;
  snippet: string;
  line: number;
  headingMatch: boolean;
}

interface RawHit {
  lineIndex: number;
  article: string;
  headingMatch: boolean;
}

interface MergedGroup {
  uri: string;
  title: string;
  abbreviation: string;
  startLine: number;
  endLine: number;
  article: string;
  headingMatch: boolean;
}

function extractSystematicNumber(filePath: string): string {
  const rel = relative(config.dataDir, filePath);
  const parts = rel.split(sep);
  const fileName = parts.length >= 2 ? parts[parts.length - 1] : parts[0];
  return fileName.replace(/\.md$/, "").split("-")[0] ?? "";
}

export function getSystematicPrefix(sysNum: string): string {
  const match = sysNum.match(/^(\d+)/);
  return match ? match[1] : "";
}

function extractAbbreviation(lines: string[]): string {
  for (const line of lines) {
    const m = line.match(ABBR_RE);
    if (m) {
      return m[1];
    }
  }
  return "";
}

function findArticleAt(lines: string[], hitLine: number): string {
  for (let i = hitLine; i >= 0; i--) {
    const m = lines[i].match(ARTICLE_HEADING_RE);
    if (m) {
      return `Art. ${m[1]}`;
    }
  }
  return "";
}

const CONTEXT_LINES = 3;

const SYNONYM_THRESHOLD = 2;
const SYNONYM_CATEGORIES = new Set(["66"]);

async function searchInEntries(
  entries: LawEntry[],
  lowerQuery: string,
  lang: string | undefined,
  category: string | undefined,
  limit: number,
): Promise<SearchResult[]> {
  const allHits: { entry: LawEntry; hits: RawHit[]; lines: string[]; abbr: string }[] = [];

  for (const entry of entries) {
    if (lang) {
      const relPath = relative(config.dataDir, entry.path);
      const langPrefix = `${lang}${sep}`;
      const langPrefixFwd = `${lang}/`;
      if (!relPath.startsWith(langPrefix) && !relPath.startsWith(langPrefixFwd)) {
        continue;
      }
    }

    if (category) {
      const sysNum = extractSystematicNumber(entry.path);
      const prefix = getSystematicPrefix(sysNum);
      if (!prefix.startsWith(category)) {
        continue;
      }
    }

    const content = await readFile(entry.path, "utf-8");
    const lines = content.split("\n");
    const abbr = extractAbbreviation(lines);
    const hits: RawHit[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        const article = findArticleAt(lines, i);
        const headingMatch = ARTICLE_HEADING_RE.test(lines[i]);
        hits.push({ lineIndex: i, article, headingMatch });
      }
    }

    if (hits.length > 0) {
      allHits.push({ entry, hits, lines, abbr });
    }
  }

  allHits.sort((a, b) => {
    const aHasHeading = a.hits.some((h) => h.headingMatch) ? 0 : 1;
    const bHasHeading = b.hits.some((h) => h.headingMatch) ? 0 : 1;
    return aHasHeading - bHasHeading;
  });

  const results: SearchResult[] = [];

  for (const { entry, hits, lines, abbr } of allHits) {
    const groups: MergedGroup[] = [];
    let current: MergedGroup | null = null;

    for (const hit of hits) {
      const snippetStart = Math.max(0, hit.lineIndex - CONTEXT_LINES);
      const snippetEnd = Math.min(lines.length, hit.lineIndex + CONTEXT_LINES + 1);

      if (current && snippetStart <= current.endLine) {
        current.endLine = Math.max(current.endLine, snippetEnd);
        current.headingMatch = current.headingMatch || hit.headingMatch;
        if (!current.article && hit.article) {
          current.article = hit.article;
        }
      } else {
        current = {
          uri: entry.uri,
          title: entry.title,
          abbreviation: abbr,
          startLine: snippetStart,
          endLine: snippetEnd,
          article: hit.article,
          headingMatch: hit.headingMatch,
        };
        groups.push(current);
      }
    }

    for (const group of groups) {
      const snippet = lines.slice(group.startLine, group.endLine).join("\n");
      results.push({
        uri: group.uri,
        title: group.title,
        abbreviation: group.abbreviation,
        article: group.article,
        snippet,
        line: group.startLine + 1,
        headingMatch: group.headingMatch,
      });

      if (results.length >= limit) {
        return results;
      }
    }
  }

  return results;
}

export async function searchInLaws(
  query: string,
  lang?: string,
  limit = 10,
  category?: string,
): Promise<SearchResult[]> {
  const entries = await discoverLawFiles();
  const lowerQuery = query.toLowerCase();

  const results = await searchInEntries(entries, lowerQuery, lang, category, limit);

  if (results.length <= SYNONYM_THRESHOLD && (!category || SYNONYM_CATEGORIES.has(category))) {
    try {
      const { fetchSynonyms } = await import("../thesaurus/openthesaurus.js");
      const words = query.split(/[\s,;.]+/).filter((w) => w.length >= 3);
      const allSynonyms: string[] = [];

      for (const word of words) {
        try {
          const synonyms = await fetchSynonyms(word);
          allSynonyms.push(...synonyms);
        } catch {
          continue;
        }
      }

      const seenUris = new Set(results.map((r) => r.uri));
      const remainingLimit = limit - results.length;

      if (allSynonyms.length > 0 && remainingLimit > 0) {
        for (const synonym of allSynonyms) {
          if (results.length >= limit) break;

          const synonymResults = await searchInEntries(
            entries,
            synonym.toLowerCase(),
            lang,
            category,
            remainingLimit,
          );

          for (const r of synonymResults) {
            if (!seenUris.has(r.uri)) {
              seenUris.add(r.uri);
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