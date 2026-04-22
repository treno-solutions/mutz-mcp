import { describe, it, expect } from "vitest";
import { convertHtmlToMarkdown } from "./converter.js";

const SAMPLE_HTML = `<div class='document'>
<h1 class='systematic_number'>324.1</h1>
<h1 class='title'>Gesetz betreffend die Einführung des Bundesgesetzes<br/>über Ordnungsbussen im Strassenverkehr</h1>
<div class='enactment'>vom 12.09.1971 (Stand 01.01.2003)</div>
<div class='ingress_author'>Der Grosse Rat des Kantons Bern,</div>
<div class='ingress_foundation'><p>auf Grund von Artikel 68bis der Kantonsverfassung<sup>1</sup>;</p></div>
<div class='ingress_action'>beschliesst:</div>
<div class='article'>
  <div class='article_number'><span class='article_symbol'>Art.</span> <span class='number'>1</span></div>
  <div class='article_title'><span class='title_text'>Ordnungsbussen im Strassenverkehr</span></div>
</div>
<div class='paragraph'>
  <span class='number'>1</span>
  <p><span class='text_content'>Die Ordnungsbussen im Strassenverkehr gemäss Bundesgesetz werden erhoben.</span></p>
</div>
<div class='paragraph_post'></div>
<div class='article'>
  <div class='article_number'><span class='article_symbol'>Art.</span> <span class='number'>2</span></div>
  <div class='article_title'><span class='title_text'>Andere Ordnungsbussen</span></div>
</div>
<div class='paragraph'>
  <span class='number'>1</span>
  <p><span class='text_content'>Bei bestimmten anderen geringfügigen Übertretungen können Ordnungsbussen erhoben werden.</span></p>
</div>
<div class='paragraph_post'></div>
<div class='egress_sign_off_date'>Bern, 19. Mai 1971</div>
<div class='egress_sign_off_signature'><p>Der Grossratspräsident: F. B.</p><p>Der Staatsschreiber: H. M.</p></div>
<div class='egress_ags_source'>BSG 324.1</div>
</div>
<div class='footnotes' id=''>
<ol>
<li><a class='footnote' href='#'>[1]</a> <span class='footnote_text'>Art. 68bis VBV am 01.01.1979 aufgehoben.</span></li>
</ol>
</div>
<div id='modification_table'>
<h1>Änderungstabelle - nach Beschluss</h1>
<table>
<tr><th>Beschluss</th><th>Inkrafttreten</th><th>Element</th><th>Änderung</th></tr>
<tr><td>12.09.1971</td><td>01.01.1973</td><td>Erlass</td><td>Erstfassung</td></tr>
</table>
</div>`;

describe("convertHtmlToMarkdown", () => {
  it("includes systematic number as h1", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Testgesetz", "vom 01.01.2000");
    expect(result).toContain("# 324.1");
  });

  it("includes title as h2", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Testgesetz", "vom 01.01.2000");
    expect(result).toContain("## Testgesetz");
  });

  it("includes dates string", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Testgesetz", "vom 01.01.2000");
    expect(result).toContain("vom 01.01.2000");
  });

  it("converts articles with title", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Test", "vom 01.01.2000");
    expect(result).toContain("### Art. 1 Ordnungsbussen im Strassenverkehr");
    expect(result).toContain("### Art. 2 Andere Ordnungsbussen");
  });

  it("converts paragraphs with number and text", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Test", "vom 01.01.2000");
    expect(result).toContain("1 Die Ordnungsbussen im Strassenverkehr");
  });

  it("includes ingress content", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Test", "vom 01.01.2000");
    expect(result).toContain("Der Grosse Rat des Kantons Bern");
    expect(result).toContain("beschliesst:");
  });

  it("includes egress (sign-off) with separator", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Test", "vom 01.01.2000");
    expect(result).toContain("Bern, 19. Mai 1971");
    expect(result).toContain("Der Grossratspräsident: F. B.");
  });

  it("includes AGS source in italics", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Test", "vom 01.01.2000");
    expect(result).toContain("*BSG 324.1*");
  });

  it("includes footnotes section", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Test", "vom 01.01.2000");
    expect(result).toContain("## Fussnoten");
    expect(result).toContain("Art. 68bis VBV am 01.01.1979 aufgehoben");
  });

  it("includes modification table", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Test", "vom 01.01.2000");
    expect(result).toContain("## Änderungstabelle");
    expect(result).toContain("12.09.1971");
    expect(result).toContain("Erstfassung");
  });

  it("formats inline footnote references as bold", () => {
    const result = convertHtmlToMarkdown(SAMPLE_HTML, "324.1", "Test", "vom 01.01.2000");
    expect(result).toContain("**[1]**");
  });

  it("handles empty html gracefully", () => {
    const result = convertHtmlToMarkdown("", "000", "Empty Law", "");
    expect(result).toContain("# 000");
    expect(result).toContain("## Empty Law");
  });

  it("handles html without document div", () => {
    const result = convertHtmlToMarkdown("<p>Just some text</p>", "000", "No Document", "");
    expect(result).toContain("# 000");
    expect(result).toContain("konvertiert werden");
  });
});