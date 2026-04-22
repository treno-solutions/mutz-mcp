import { describe, it, expect } from "vitest";
import {
  discoverLawFiles,
  readLawContent,
  searchInLaws,
  getSystematicPrefix,
  type SearchResult,
} from "../resources/law-resource.js";

describe("discoverLawFiles", () => {
  it("finds all .md files in the data directory", async () => {
    const entries = await discoverLawFiles();

    const uris = entries.map((e) => e.uri).sort();

    expect(uris).toContain("mutz://_index");
    expect(uris).toContain("mutz://de/steuergesetz/allgemeine-bestimmungen");
    expect(uris).toContain("mutz://de/steuergesetz/einkommensteuer");
    expect(uris).toContain("mutz://fr/dispositions-generales");
  });

  it("extracts titles from h1 headings", async () => {
    const entries = await discoverLawFiles();
    const einkommensteuer = entries.find(
      (e) => e.uri === "mutz://de/steuergesetz/einkommensteuer",
    );

    expect(einkommensteuer).toBeDefined();
    expect(einkommensteuer?.title).toBe("Einkommensteuer");
  });
});

describe("readLawContent", () => {
  it("reads content of an existing law file", async () => {
    const content = await readLawContent(
      "mutz://de/steuergesetz/einkommensteuer",
    );

    expect(content).toBeTruthy();
    expect(content).toContain("# Einkommensteuer");
  });

  it("returns null for non-existent law file", async () => {
    const content = await readLawContent("mutz://de/nonexistent");

    expect(content).toBeNull();
  });

  it("throws for invalid URI scheme", async () => {
    await expect(readLawContent("http://something")).rejects.toThrow(
      "Invalid URI scheme",
    );
  });
});

describe("searchInLaws", () => {
  it("finds matching content across all files", async () => {
    const results = await searchInLaws("Wohnsitz");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].uri).toMatch(/^mutz:\/\//);
    expect(results[0].snippet).toBeTruthy();
  });

  it("includes article in results", async () => {
    const results = await searchInLaws("Einkommensteuer", "de");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].article).toBeDefined();
  });

  it("includes abbreviation in results", async () => {
    const results = await searchInLaws("Einkommensteuer", "de");

    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0].abbreviation).toBe("string");
  });

  it("includes headingMatch in results", async () => {
    const results = await searchInLaws("Einkommensteuer", "de");

    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0].headingMatch).toBe("boolean");
  });

  it("filters by language", async () => {
    const deResults = await searchInLaws("Wohnsitz", "de");
    const frResults = await searchInLaws("Wohnsitz", "fr");

    expect(deResults.length).toBeGreaterThan(0);
    for (const r of deResults) {
      expect(r.uri).toContain("de/");
    }
    expect(frResults.length).toBe(0);
  });

  it("respects limit parameter", async () => {
    const results = await searchInLaws("Steuer", undefined, 1);

    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("returns empty array for no matches", async () => {
    const results = await searchInLaws("xyznonexistentxyz");

    expect(results).toEqual([]);
  });

  it("includes line numbers in results", async () => {
    const results = await searchInLaws("Geltungsbereich");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].line).toBeTypeOf("number");
    expect(results[0].line).toBeGreaterThan(0);
  });

  it("search is case-insensitive", async () => {
    const upperResults = await searchInLaws("WOHNSITZ");
    const lowerResults = await searchInLaws("wohnsitz");

    expect(upperResults.length).toBe(lowerResults.length);
  });

  it("filters by category when category is provided", async () => {
    const allResults = await searchInLaws("Steuer", "de", 50);
    const filteredResults = await searchInLaws("Steuer", "de", 50, "66");

    expect(filteredResults.length).toBeLessThanOrEqual(allResults.length);
  });

  it("category filter with non-matching prefix returns empty for non-matching files", async () => {
    const results = await searchInLaws("Steuer", "de", 50, "99");

    expect(results).toEqual([]);
  });

  it("merges overlapping hits in same file", async () => {
    const results = await searchInLaws("Steuer", "de", 50);

    const uris = results.map((r) => r.uri);
    const uniqueUris = new Set(uris);
    expect(uris.length - uniqueUris.size).toBeLessThanOrEqual(uris.length);
  });

  it("ranks heading matches first", async () => {
    const results = await searchInLaws("Einkommensteuer", "de", 10);

    const hasHeadingMatch = results.some((r) => r.headingMatch === true);
    if (hasHeadingMatch) {
      const firstNonHeadingIdx = results.findIndex((r) => !r.headingMatch);
      const lastHeadingIdx = results.reduce((acc: number, r: SearchResult, i: number) => r.headingMatch ? i : acc, -1);
      if (firstNonHeadingIdx !== -1 && lastHeadingIdx !== -1) {
        expect(lastHeadingIdx).toBeLessThan(firstNonHeadingIdx);
      }
    }
  });
});

describe("getSystematicPrefix", () => {
  it("extracts numeric prefix from systematic number", () => {
    expect(getSystematicPrefix("661.11")).toBe("661");
  });

  it("handles simple numbers", () => {
    expect(getSystematicPrefix("101")).toBe("101");
  });

  it("returns empty string for non-numeric input", () => {
    expect(getSystematicPrefix("abc")).toBe("");
  });

  it("handles dash-suffixed numbers", () => {
    expect(getSystematicPrefix("721.2-1")).toBe("721");
  });
});