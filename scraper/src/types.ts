export type Language = "de" | "fr";

export interface SystematicCategory {
  systematic_category: {
    id: number;
    systematic_number: string;
    name: string;
    children: SystematicCategory[];
  };
}

export interface LawIndexEntry {
  id: number;
  systematic_number: string;
  systematic_category_id: number;
  title: string;
  abrogated: boolean;
  structured_document_id: number;
}

export type LawIndex = Record<string, LawIndexEntry[]>;

export interface TextOfLawVersion {
  id: number;
  version_dates_str: string;
  structured_document_id: number;
  title: string;
  abbreviation: string;
  original_dates_str: string;
  pdf_link_tol: string | null;
  pdf_link_tol_size: number | null;
  pdf_link_annexes: string | null;
  pdf_link_tol_with_annexes: string | null;
  doc_link_tol: string | null;
  history_information_map: Record<string, unknown>;
  xhtml_tol: string;
  xhtml_cac_tol: string;
  xhtml_cac_unified_tol: string;
  materials: unknown[];
  external_links: unknown[];
  available_languages: {
    language: {
      id: number;
      iso639_1_code: string;
      name: string;
    };
  }[];
  annex_documents: unknown[];
}

export interface TextOfLaw {
  systematic_number: string;
  systematic_number_hl: string;
  title: string;
  title_hl: string;
  abbreviation: string;
  abbreviation_hl: string;
  enactment: string;
  date_of_decision: string;
  date_of_decision_multiple: boolean;
  publication_enactment: string;
  text_of_law_type_id: number;
  text_of_law_dates_str: string;
  pdf_link: string;
  canonical_link: string;
  abrogated: boolean;
  abrogated_dates_str: string | null;
  abrogated_dates_str_short: string | null;
  abrogated_scheduled: boolean;
  abrogated_scheduled_date_str: string | null;
  abrogated_scheduled_date_str_short: string | null;
  version_uid: string;
  snippet_msg: string | null;
  snippet: string | null;
  current_version: TextOfLawVersion;
  selected_version: TextOfLawVersion;
  old_versions: unknown[];
  future_versions: unknown[];
  change_documents: unknown[];
}

export interface TextOfLawResponse {
  text_of_law: TextOfLaw;
}

export interface ScraperOptions {
  lang?: Language;
  outDir?: string;
  delay?: number;
  includeAbrogated?: boolean;
}