# AGENTS.md

## Projekt

mutz-mcp — MCP Server für Berner Steuergesetz-Texte.

## Befehle (MCP Server — Root)

- `npm run check` — TypeScript + ESLint + Tests (vor jedem Commit ausführen)
- `npm run build` — Kompilieren nach dist/
- `npm run test` — Vitest Unit-Tests
- `npm run test:watch` — Vitest im Watch-Modus
- `npm run lint` — ESLint
- `npm run lint:fix` — ESLint mit Auto-Fix

## Befehle (Scraper — scraper/)

- `cd scraper && npm run check` — TypeScript + ESLint + Tests
- `cd scraper && npm run scrape` — Scraper starten (beide Sprachen)
- `cd scraper && npm run scrape:de` — Nur Deutsch
- `cd scraper && npm run scrape:fr` — Nur Französisch
- `cd scraper && npm run lint` — ESLint

## Architektur

### MCP Server (Root)

- `src/index.ts` — Entry point, stdio Transport
- `src/server.ts` — MCP Server Setup
- `src/resources/` — Markdown-Dateien als MCP Resources
- `src/tools/` — search_laws Such-Tool
- `src/utils/config.ts` — Konfiguration (BELEX_DATA_DIR)

### Scraper (scraper/)

- `scraper/src/index.ts` — CLI Entry point, orchestriert Scraping
- `scraper/src/fetcher.ts` — API Client (belex.sites.be.ch) mit Rate-Limit
- `scraper/src/converter.ts` — HTML → Markdown Konverter
- `scraper/src/writer.ts` — Schreibt .md Dateien + _index.md
- `scraper/src/types.ts` — API Response TypeScript Interfaces

## Konventionen

- TypeScript strict mode
- ESLint: typescript-eslint strict + stylistic
- Keine `console.log` im MCP Server (kommuniziert über stdio)
- Scraper darf `console.log` verwenden
- Kein `data/` Verzeichnis in git (Consumer muss selbst befüllen via Scraper)
- Kein Nicht-Null-Assertions (`!`)
- Explizite Rückgabetypen für alle Funktionen