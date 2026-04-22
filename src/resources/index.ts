import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { discoverLawFiles, readLawContent } from "./law-resource.js";

export function registerResources(server: McpServer): void {
  server.registerResource(
    "mutz-index",
    "mutz://index",
    {
      title: "Mutz Gesetzestexte - Übersicht",
      description: "Übersicht aller verfügbaren Gesetzestexte des Kanton Bern",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const entries = await discoverLawFiles();
      const lines = entries.map(
        (e) => `- [${e.title}](${e.uri})`,
      );
      const content = `# Mutz Gesetzestexte - Übersicht\n\n${lines.join("\n")}`;

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    },
  );

  server.registerResource(
    "mutz-law",
    new ResourceTemplate("mutz://{path}", { list: undefined }),
    {
      title: "Gesetzestext",
      description: "Ein einzelner Gesetzestext nach Pfad (z.B. de/steuergesetz/einkommensteuer)",
    },
    async (uri, variables) => {
      const pathValue = variables["path"] ?? "";
      const lawUri = `mutz://${pathValue}`;
      const content = await readLawContent(lawUri);

      if (!content) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: `# Nicht gefunden\n\nGesetzestext unter \`${lawUri}\` konnte nicht gefunden werden.`,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    },
  );

  void discoverLawFiles().then((entries) => {
    for (const entry of entries) {
      server.registerResource(
        entry.uri.replace("mutz://", "").replace(/\//g, "-"),
        entry.uri,
        {
          title: entry.title,
          description: entry.description,
          mimeType: "text/markdown",
        },
        async (uri) => {
          const content = await readLawContent(entry.uri);
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: "text/markdown",
                text: content ?? `# Nicht gefunden\n\nGesetzestext unter \`${entry.uri}\` konnte nicht gefunden werden.`,
              },
            ],
          };
        },
      );
    }
  });
}