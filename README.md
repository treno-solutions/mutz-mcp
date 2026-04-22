# mutz-mcp

MCP Server für die Gesetzestexte des Kanton Bern.

Stellt Steuergesetz-Texte als Markdown-Dateien über MCP Resources bereit und bietet eine Volltextsuche via `search_laws` Tool.

## Installation

```bash
npm install -g mutz-mcp
```

## Gesetzestexte bereitstellen

Der Server benötigt Gesetzestexte als Markdown-Dateien in einem Verzeichnis. Dieses Verzeichnis wird über die Umgebungsvariable `BELEX_DATA_DIR` konfiguriert (default: `./data`).

### Erwartete Struktur

```
data/
├── _index.md              # Übersicht aller Gesetze
├── de/                    # Deutsche Fassung
│   ├── steuergesetz/
│   │   ├── allgemeine-bestimmungen.md
│   │   ├── einkommensteuer.md
│   │   └── ...
│   └── ...
└── fr/                    # Französische Fassung
    ├── steuergesetz/
    │   ├── dispositions-generales.md
    │   ├── impot-sur-le-revenu.md
    │   └── ...
    └── ...
```

### Konventionen

- Jede Datei: `.md` Endung
- Jede Datei beginnt mit `# Überschrift` (wird als Titel im MCP Server verwendet)
- Dateiname = URI-Pfad: `de/steuergesetz/einkommensteuer.md` → `mutz://de/steuergesetz/einkommensteuer`

## Verwendung

### CLI

```bash
BELEX_DATA_DIR=/pfad/zu/daten mutz-mcp
```

### MCP Client Konfiguration (z.B. Claude Desktop)

```json
{
  "mcpServers": {
    "mutz": {
      "command": "mutz-mcp",
      "env": {
        "BELEX_DATA_DIR": "/pfad/zu/daten"
      }
    }
  }
}
```

### npx (ohne globale Installation)

```json
{
  "mcpServers": {
    "mutz": {
      "command": "npx",
      "args": ["-y", "mutz-mcp"],
      "env": {
        "BELEX_DATA_DIR": "/pfad/zu/daten"
      }
    }
  }
}
```

## MCP Capabilities

### Resources

| URI Pattern | Beschreibung |
|-------------|-------------|
| `mutz://index` | Übersicht aller verfügbaren Gesetzestexte |
| `mutz://{path}` | Einzelner Gesetzestext nach Pfad |
| `mutz://de/steuergesetz/einkommensteuer` | Beispiel: Einkommensteuer (DE) |

### Tools

| Tool | Beschreibung |
|------|-------------|
| `search_laws` | Durchsucht alle Gesetzestexte nach einem Begriff, mit optionalem Sprachfilter (`de`/`fr`) |

## Scraper

Siehe `scraper/` für den Belex Scraper, der die Gesetzestexte als Markdown-Dateien bereitstellt.

## Entwicklung

```bash
npm install
npm run check     # tsc + eslint + tests
npm run build     # Kompilieren nach dist/
npm run test      # Tests ausführen
npm run lint      # ESLint
```

## Lizenz

MIT © treno.solutions GmbH