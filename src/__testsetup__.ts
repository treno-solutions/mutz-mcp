import { join } from "node:path";

process.env.BELEX_DATA_DIR = join(import.meta.dirname, "__testfixtures__", "data");