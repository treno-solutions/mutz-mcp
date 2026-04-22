import { describe, it, expect } from "vitest";
import { config } from "./config.js";

describe("config", () => {
  it("has serverName", () => {
    expect(config.serverName).toBe("mutz-mcp");
  });

  it("has serverVersion", () => {
    expect(config.serverVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("dataDir is an absolute path", () => {
    expect(config.dataDir).toMatch(/^\//);
  });

  it("dataDir contains data", () => {
    expect(config.dataDir).toMatch(/data$/);
  });
});