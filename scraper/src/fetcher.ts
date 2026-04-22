import type { Language, LawIndex, SystematicCategory, TextOfLawResponse } from "./types.js";

const BASE_URL = "https://www.belex.sites.be.ch/api";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class Fetcher {
  private delay;
  private lastRequestTime = 0;

  constructor(delay = 1000) {
    this.delay = delay;
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.delay) {
      await sleep(this.delay - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  private async fetchJson<T>(url: string): Promise<T> {
    await this.throttle();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}: ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async fetchSystematicCategories(lang: Language): Promise<SystematicCategory[]> {
    const url = `${BASE_URL}/${lang}/systematic_categories`;
    return this.fetchJson<SystematicCategory[]>(url);
  }

  async fetchLightweightIndex(lang: Language): Promise<LawIndex> {
    const url = `${BASE_URL}/${lang}/texts_of_law/lightweight_index`;
    return this.fetchJson<LawIndex>(url);
  }

  async fetchTextOfLaw(
    lang: Language,
    systematicNumber: string,
  ): Promise<TextOfLawResponse> {
    const url = `${BASE_URL}/${lang}/texts_of_law/${encodeURIComponent(systematicNumber)}`;
    return this.fetchJson<TextOfLawResponse>(url);
  }
}