import { describe, it, expect } from "vitest";
import { Fetcher } from "./fetcher.js";

describe("Fetcher", () => {
  it("constructs with default delay", () => {
    const fetcher = new Fetcher();
    expect(fetcher).toBeDefined();
  });

  it("constructs with custom delay", () => {
    const fetcher = new Fetcher(500);
    expect(fetcher).toBeDefined();
  });
});