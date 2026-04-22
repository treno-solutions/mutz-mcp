# AGENTS.md

## Projekt

mutz-mcp — MCP Server für Berner Steuergesetz-Texte und Schweizer Kontenplan (KMU).

## Befehle (MCP Server — Root)

- `npm run check` — TypeScript + ESLint + Tests (vor jedem Commit ausführen)
- `npm run build` — Kompilieren nach dist/ + Daten kopieren (categories.json, kontenplan.json, data/)
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
- `src/server.ts` — MCP Server Setup, Instructions mit Antwort-Regeln
- `src/resources/`
  - `index.ts` — ResourceTemplate (`mutz://{+path}`) und statische Resources
  - `law-resource.ts` — Suchlogik mit Artikel-Erkennung, Dedup/Ranking, Synonymerweiterung
  - `categories.json` — Ordnungsnummer-Kategorien (bilingual, aus Belex API)
- `src/tools/`
  - `search-laws.ts` — `search_laws` / `search_laws_fr` (bilingual, category-Filter)
  - `search-kontenplan.ts` — `search_kontenplan` / `search_kontenplan_fr` (bilingual, area-Filter)
  - `list-categories.ts` — `list_laws_categories` / `list_laws_categories_fr`
- `src/kontenplan/`
  - `index.ts` — Kontenplan-Suche mit Synonymerweiterung
  - `resources.ts` — `mutz://de/kontenplan` und `mutz://fr/kontenplan` Resources
  - `types.ts` — `KontenplanAccount` und `Kontenplan` Interfaces
- `src/thesaurus/`
  - `index.ts` — Synonym-Erweiterungslogik (Stoppwörter-Filterung)
  - `openthesaurus.ts` — OpenThesaurus API Client (3s Timeout, Best-Effort)
- `src/utils/config.ts` — Konfiguration (BELEX_DATA_DIR, BELEX_KONTENPLAN)

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
- Externe API-Calls (OpenThesaurus) sind Best-Effort: Fehler/Timeouts dürfen nie die Hauptsuche blockieren
- Synonymerweiterung nur aktiviert für Steuern (`category=66`) und Kontenplan