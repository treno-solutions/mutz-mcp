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

interface SearchResult {
  uri: string;
  title: string;
  snippet: string;
  line: number;
}

export async function searchInLaws(
  query: string,
  lang?: string,
  limit = 10,
): Promise<SearchResult[]> {
  const entries = await discoverLawFiles();
  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const entry of entries) {
    if (lang) {
      const relPath = relative(config.dataDir, entry.path);
      const langPrefix = `${lang}${sep}`;
      const langPrefixFwd = `${lang}/`;
      if (!relPath.startsWith(langPrefix) && !relPath.startsWith(langPrefixFwd)) {
        continue;
      }
    }

    const content = await readFile(entry.path, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 3);
        const snippet = lines.slice(start, end).join("\n");

        results.push({
          uri: entry.uri,
          title: entry.title,
          snippet,
          line: i + 1,
        });

        if (results.length >= limit) {
          return results;
        }
      }
    }
  }

  return results;
}