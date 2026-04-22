import { resolve } from "node:path";

export const config = {
  dataDir: resolve(process.env.BELEX_DATA_DIR ?? "./data"),
  serverName: "mutz-mcp",
  serverVersion: "0.1.0",
};