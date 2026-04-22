import { resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const config = {
  dataDir: resolve(process.env.BELEX_DATA_DIR ?? resolve(__dirname, "..", "data")),
  kontenplanPath: resolve(process.env.BELEX_KONTENPLAN ?? resolve(__dirname, "..", "kontenplan.json")),
  serverName: "mutz-mcp",
  serverVersion: "0.1.0",
};