import { describe, it, expect } from "vitest";
import { entriesToSummaries } from "./writer.js";
import type { LawIndexEntry } from "./types.js";

describe("entriesToSummaries", () => {
  it("filters out abrogated entries by default", () => {
    const entries: LawIndexEntry[] = [
      { id: 1, systematic_number: "324.1", systematic_category_id: 105, title: "Active Law", abrogated: false, structured_document_id: 413 },
      { id: 2, systematic_number: "661.11", systematic_category_id: 203, title: "Abrogated Law", abrogated: true, structured_document_id: 500 },
    ];

    const summaries = entriesToSummaries(entries, false);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].systematicNumber).toBe("324.1");
  });

  it("includes abrogated entries when flag is set", () => {
    const entries: LawIndexEntry[] = [
      { id: 1, systematic_number: "324.1", systematic_category_id: 105, title: "Active Law", abrogated: false, structured_document_id: 413 },
      { id: 2, systematic_number: "661.11", systematic_category_id: 203, title: "Abrogated Law", abrogated: true, structured_document_id: 500 },
    ];

    const summaries = entriesToSummaries(entries, true);
    expect(summaries).toHaveLength(2);
  });

  it("maps entry fields correctly", () => {
    const entries: LawIndexEntry[] = [
      { id: 1, systematic_number: "324.1", systematic_category_id: 105, title: "Test Law", abrogated: false, structured_document_id: 413 },
    ];

    const summaries = entriesToSummaries(entries, false);
    expect(summaries[0]).toEqual({
      systematicNumber: "324.1",
      title: "Test Law",
      abrogated: false,
    });
  });
});