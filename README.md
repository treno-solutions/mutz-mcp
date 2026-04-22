# mutz-mcp

MCP Server für die Gesetzestexte des Kantons Bern und den Schweizer Kontenplan (KMU).

Bietet Volltextsuche in Berner Gesetzen, Kategorie-Filter nach Ordnungsnummern, semantische Synonymerweiterung via OpenThesaurus, und Kontenplan-Suche — bilingual Deutsch/Französisch.

## Installation

```bash
npm install
npm run build
```

Für die Gesetzestexte muss der Scraper ausgeführt werden (siehe unten).

## Gesetzestexte bereitstellen

Der Server benötigt Gesetzestexte als Markdown-Dateien. Der Pfad wird über `BELEX_DATA_DIR` konfiguriert (default: neben `dist/`, also `dist/data/`).

### Scraper ausführen

```bash
cd scraper
npm install
npm run scrape       # Beide Sprachen
npm run scrape:de    # Nur Deutsch
npm run scrape:fr    # Nur Französisch
```

Die Dateien werden standardmässig in `../data/` abgelegt.

### Erwartete Struktur

```
data/
├── de/                    # Deutsche Fassung
│   ├── _index.md          # Übersicht
│   ├── 661.11.md          # Steuergesetz
│   └── ...
└── fr/                    # Französische Fassung
    ├── _index.md
    ├── 661.11.md
    └── ...
```

Dateinamen folgen der Belex-Ordnungsnummer (z.B. `661.11.md` = Steuergesetz).

## Kontenplan

Der transformierte Schweizer Kontenplan (KMU) ist als `kontenplan.json` im Repository enthalten (179 Konten). Der Pfad wird über `BELEX_KONTENPLAN` konfiguriert (default: neben `dist/`).

## MCP Client Konfiguration

### LibreChat

```yaml
mutz:
  type: stdio
  command: node
  args:
    - "/app/mcp/mutz-mcp/dist/index.js"
```

### Claude Desktop

```json
{
  "mcpServers": {
    "mutz": {
      "command": "node",
      "args": ["/pfad/zu/mutz-mcp/dist/index.js"],
      "env": {
        "BELEX_DATA_DIR": "/pfad/zu/data",
        "BELEX_KONTENPLAN": "/pfad/zu/kontenplan.json"
      }
    }
  }
}
```

Ohne Env-Vars sucht der Server `data/` und `kontenplan.json` automatisch neben `dist/index.js`.

## MCP Capabilities

### Tools

| Tool | Beschreibung |
|------|-------------|
| `search_laws` | Durchsucht Gesetzestexte nach Begriff. Optional: `category`-Filter (z.B. `"66"` für Steuern). Synonymerweiterung via OpenThesaurus bei wenigen Treffern. |
| `search_laws_fr` | Französische Version von `search_laws`. |
| `search_kontenplan` | Durchsucht den Schweizer Kontenplan (KMU) nach Kontonummer, Name oder Gruppe. Optional: `area`-Filter (A= Aktiven, B=Passiven, C=Ertrag, D=Aufwand, E=Abschluss). Synonymerweiterung bei wenigen Treffern. |
| `search_kontenplan_fr` | Französische Version von `search_kontenplan`. |
| `list_laws_categories` | Zeigt die Ordnungsnummer-Kategorien der Berner Gesetzessammlung (z.B. `66` = Steuern, `72` = Bauen). |
| `list_laws_categories_fr` | Französische Version von `list_laws_categories`. |

### Resources

| URI | Beschreibung |
|-----|-------------|
| `mutz://index` | Übersicht aller Gesetzestexte |
| `mutz://{path}` | Einzelner Gesetzestext (z.B. `mutz://de/661.11`) |
| `mutz://de/kontenplan` | Schweizer Kontenplan (KMU) als Markdown |
| `mutz://fr/kontenplan` | Plan comptable suisse (PME) en Markdown |

### Kategorie-Filter

Die `search_laws`-Tools unterstützen einen `category`-Parameter, der die Suche auf bestimmte Ordnungsnummer-Bereiche einschränkt:

| Kategorie | Bereich |
|-----------|---------|
| `1` | Staat, Volk, Behörden |
| `2` | Zivilrecht, Zivilrechtspflege |
| `3` | Strafrecht, Strafvollzug |
| `4` | Kirche, Kultur, Ausbildung |
| `5` | Landesverteidigung, Polizei |
| `6` | Finanzen, Regalien |
| `66` | Steuern und Abgaben |
| `7` | Bauwesen, Energie, Verkehr |
| `8` | Gesundheit, Arbeit, Soziales |
| `9` | Volkswirtschaft |

Mit `list_laws_categories` werden alle verfügbaren Kategorien mit Untergruppen angezeigt.

### Synonymerweiterung

Wenn eine Suche weniger als 3 Ergebnisse liefert, fragt der Server automatisch [OpenThesaurus](https://www.openthesaurus.de) nach Synonymen und erweitert die Suche. Dies ist ein Best-Effort-Feature — bei Netzwerkfehlern wird die ursprüngliche Suche ohne Synonyme fortgesetzt.

Beispiel: Suche nach "Tesla" → Synonym "Fahrzeug" → Treffer in Abschreibungsregeln des Steuergesetzes.

Nur für Steuern (`category=66`) und Kontenplan aktiviert.

## Antwortformat

Die Tools liefern strukturierte Antworten mit Quellenangaben:

- **Gesetzessuche**: `## 661.11 — Steuergesetz (StG)` mit Artikel-Angabe `Art. 74` und URI
- **Kontenplan**: `**1000** Kasse (Aktiven) — Standard > Aktiven > ... | *Schweizer Kontenplan KMU*`

## Entwicklung

```bash
npm install
npm run check     # TypeScript + ESLint + Vitest
npm run build     # Kompilieren + Daten kopieren
npm run test      # Vitest
npm run lint      # ESLint
```

### Architektur

```
src/
├── index.ts              # Entry point, stdio Transport
├── server.ts             # MCP Server Setup, Instructions
├── resources/
│   ├── index.ts           # ResourceTemplate (mutz://{path}), Index
│   ├── law-resource.ts    # Suchlogik, Artikel-Erkennung, Synonyme
│   └── categories.json    # Ordnungsnummer-Kategorien (bilingual)
├── tools/
│   ├── search-laws.ts     # search_laws / search_laws_fr
│   ├── search-kontenplan.ts # search_kontenplan / search_kontenplan_fr
│   └── list-categories.ts # list_laws_categories / list_laws_categories_fr
├── kontenplan/
│   ├── index.ts           # Kontenplan-Suche mit Synonymen
│   ├── resources.ts       # mutz://de/kontenplan, mutz://fr/kontenplan
│   └── types.ts           # TypeScript Interfaces
├── thesaurus/
│   ├── index.ts           # Synonym-Erweiterungslogik
│   └── openthesaurus.ts  # OpenThesaurus API Client
└── utils/
    └── config.ts          # BELEX_DATA_DIR, BELEX_KONTENPLAN
```

### Scraper (`scraper/`)

Unabhängiges CLI-Tool, das die Belex-API nach Gesetzestexten abfragt und als Markdown speichert.

```bash
cd scraper
npm install
npm run scrape       # Beide Sprachen
npm run check        # TypeScript + ESLint + Vitest
```

## Lizenz

MIT © treno.solutions GmbH

Gesetzestexte: © Kanton Bern — [belex.sites.be.ch](https://belex.sites.be.ch)
Kontenplan: Schweizer Kontenplan KMU
OpenThesaurus: [CC BY-SA 4.0](https://www.openthesaurus.de)