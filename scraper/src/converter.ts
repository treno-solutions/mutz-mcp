import { parse } from "node-html-parser";
import type { HTMLElement } from "node-html-parser";

function isClass(el: HTMLElement, className: string): boolean {
  const classAttr = el.getAttribute("class") ?? "";
  return classAttr.split(/\s+/).includes(className);
}

function findWithClass(root: HTMLElement, className: string): HTMLElement | null {
  const elements = root.querySelectorAll(`.${className}`);
  if (elements.length === 0) {
    return null;
  }
  return elements[0];
}

function textContent(el: HTMLElement): string {
  return el.textContent.replace(/\s+/g, " ").trim();
}

function convertArticle(el: HTMLElement): string {
  const numberEl = findWithClass(el, "article_number");
  const titleEl = findWithClass(el, "article_title");

  const number = numberEl ? textContent(numberEl).replace(/^Art\.\s*/, "") : "";
  const title = titleEl ? textContent(titleEl) : "";

  if (number && title) {
    return `### Art. ${number} ${title}`;
  }
  if (number) {
    return `### Art. ${number}`;
  }
  return "";
}

function convertParagraph(el: HTMLElement): string {
  const numberEl = el.querySelector(".number");
  const textEl = el.querySelector(".text_content") ?? el.querySelector("p");

  const number = numberEl ? textContent(numberEl) : "";
  const text = textEl ? textContent(textEl) : "";

  if (number && text) {
    return `${number} ${text}`;
  }
  if (text) {
    return text;
  }
  return "";
}

function convertIngress(el: HTMLElement): string {
  return textContent(el);
}

function convertFootnotesSection(html: string): string {
  const root = parse(html);
  const footnotesDiv = root.querySelector(".footnotes");
  if (!footnotesDiv) {
    return "";
  }

  const items = footnotesDiv.querySelectorAll("li");
  if (items.length === 0) {
    return "";
  }

  const lines: string[] = [];
  for (const li of items) {
    const numberEls = li.querySelectorAll("a.footnote");
    const textEls = li.querySelectorAll(".footnote_text");

    const number = numberEls[0]?.textContent?.trim() ?? "";
    const text = textEls[0] ? textContent(textEls[0]) : "";

    if (number && text) {
      lines.push(`${number}. ${text}`);
    }
  }

  if (lines.length === 0) {
    return "";
  }

  return `\n---\n\n## Fussnoten\n\n${lines.join("\n\n")}\n`;
}

function convertModificationTable(html: string): string {
  const root = parse(html);
  const modDiv = root.querySelector("#modification_table");
  if (!modDiv) {
    return "";
  }

  const tables = modDiv.querySelectorAll("table");
  if (tables.length === 0) {
    return "";
  }

  const sections: string[] = [];

  const h1s = modDiv.querySelectorAll("h1");
  for (let i = 0; i < tables.length; i++) {
    const heading = h1s[i]?.textContent?.trim() ?? (i === 0 ? "nach Beschluss" : "nach Artikel");

    const rows = tables[i].querySelectorAll("tr");
    if (rows.length === 0) {
      continue;
    }

    const lines: string[] = [];

    const headerCells = rows[0].querySelectorAll("th");
    const headers = headerCells.map((cell) => textContent(cell));
    lines.push(`| ${headers.join(" | ")} |`);
    lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r].querySelectorAll("td");
      const values = cells.map((cell) => textContent(cell));
      lines.push(`| ${values.join(" | ")} |`);
    }

    sections.push(`### ${heading}\n\n${lines.join("\n")}`);
  }

  return sections.join("\n\n");
}

function processInlineFootnotes(content: string): string {
  return content.replace(/\[(\d+)\]/g, "**[$1]**");
}

export function convertHtmlToMarkdown(
  html: string,
  systematicNumber: string,
  title: string,
  datesStr: string,
): string {
  const root = parse(html);

  const documentDiv = findWithClass(root, "document");
  if (!documentDiv) {
    return `# ${systematicNumber}\n\n## ${title}\n\n*Vollständiger Text konnte nicht konvertiert werden.*\n`;
  }

  const parts: string[] = [];
  const contentElements = documentDiv.childNodes;

  for (const el of contentElements) {
    if (el.nodeType !== 1) {
      continue;
    }

    const elem = el as HTMLElement;

    if (isClass(elem, "systematic_number")) {
      continue;
    }

    if (isClass(elem, "title")) {
      continue;
    }

    if (isClass(elem, "abbreviation")) {
      const abbr = textContent(elem);
      if (abbr) {
        parts.push(`*${abbr}*`);
      }
    } else if (isClass(elem, "enactment")) {
      continue;
    } else if (isClass(elem, "ingress_author")) {
      const text = convertIngress(elem);
      if (text) {
        parts.push(text);
      }
    } else if (isClass(elem, "ingress_foundation")) {
      const paragraphs = elem.querySelectorAll("p");
      for (const p of paragraphs) {
        const text = textContent(p);
        if (text) {
          parts.push(text);
        }
      }
    } else if (isClass(elem, "ingress_action")) {
      const text = convertIngress(elem);
      if (text) {
        parts.push(text);
      }
    } else if (isClass(elem, "article")) {
      const article = convertArticle(elem);
      if (article) {
        parts.push(article);
      }
    } else if (isClass(elem, "paragraph")) {
      const para = convertParagraph(elem);
      if (para) {
        parts.push(para);
      }
    } else if (isClass(elem, "paragraph_post")) {
      continue;
    } else if (isClass(elem, "egress_sign_off_date")) {
      const text = textContent(elem);
      if (text) {
        parts.push(`\n---\n\n${text}`);
      }
    } else if (isClass(elem, "egress_sign_off_signature")) {
      const lines = elem.querySelectorAll("p");
      for (const line of lines) {
        const text = textContent(line);
        if (text) {
          parts.push(text);
        }
      }
    } else if (isClass(elem, "egress_sign_off_remarks")) {
      continue;
    } else if (isClass(elem, "egress_ags_source")) {
      const text = textContent(elem);
      if (text) {
        parts.push(`*${text}*`);
      }
    } else {
      const text = textContent(elem);
      if (text.length > 0) {
        parts.push(text);
      }
    }
  }

  let markdown = `# ${systematicNumber}\n\n## ${title}\n\n`;

  if (datesStr) {
    markdown += `${datesStr}\n\n`;
  }

  markdown += parts.join("\n\n");
  markdown += "\n";

  const footnotes = convertFootnotesSection(html);
  if (footnotes) {
    markdown += footnotes;
  }

  const modTable = convertModificationTable(html);
  if (modTable) {
    markdown += `\n---\n\n## Änderungstabelle\n\n${modTable}\n`;
  }

  markdown = processInlineFootnotes(markdown);
  markdown = markdown
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^ +$/gm, "")
    .trimEnd();

  markdown += "\n";

  return markdown;
}