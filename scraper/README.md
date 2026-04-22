# Belex Scraper

Scraper für die Gesetzessammlung des Kanton Bern (belex.sites.be.ch).

Schreibt die Gesetzestexte als Markdown-Dateien in das Verzeichnis, das über `BELEX_DATA_DIR` konfiguriert ist (default: `./data`). Diese Dateien werden vom MCP-Server (`mutz-mcp`) als Resources bereitgestellt.

## Verwendung

```bash
# Alle Sprachen scrapen (de + fr)
npx tsx src/index.ts

# Nur Deutsch
npx tsx src/index.ts --lang de

# Nur Französisch
npx tsx src/index.ts --lang fr

# Custom output directory
npx tsx src/index.ts --out /path/to/data

# Custom delay (ms) zwischen Requests
npx tsx src/index.ts --delay 2000

# Auch aufgehobene Gesetze scrapen
npx tsx src/index.ts --include-abrogated
```

## Optionen

| Option | Beschreibung | Default |
|--------|-------------|---------|
| `--lang <de\|fr>` | Sprache | beide |
| `--out <dir>` | Output-Verzeichnis | `BELEX_DATA_DIR` oder `./data` |
| `--delay <ms>` | Delay zwischen API-Requests | `1000` |
| `--include-abrogated` | Auch aufgehobene Gesetze | `false` |

## API

Der Scraper nutzt die REST-API von belex.sites.be.ch:

| Endpoint | Beschreibung |
|----------|-------------|
| `GET /api/{lang}/systematic_categories` | Kategorie-Baum |
| `GET /api/{lang}/texts_of_law/lightweight_index` | Index aller Gesetze |
| `GET /api/{lang}/texts_of_law/{nr}` | Volltext eines Gesetzes |

## Output-Struktur

```
data/
├── _index.md              # Gesamtübersicht
├── de/
│   ├── _index.md          # Deutsche Übersicht
│   ├── 324.1.md           # Gesetzestext
│   ├── 661.11.md          # Steuergesetz
│   └── ...
└── fr/
    ├── _index.md          # Französische Übersicht
    ├── 324.1.md
    ├── 661.11.md
    └── ...
```

## Entwicklung

```bash
npm install
npm run check     # tsc + eslint + tests
npm run build     # Kompilieren nach dist/
npm run test      # Tests ausführen
npm run lint      # ESLint
```