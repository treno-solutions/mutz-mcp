/**
 * Schweizer Kontenplan (KMU) — Interface Definition
 *
 * This file defines the structure of the kontenplan.json chart of accounts.
 * The kontenplan.json file is included in this repository.
 */

export interface KontenplanAccount {
  /** Account number (e.g., "1000", "4200") */
  nr: string;
  /** Account name in German and French */
  name: {
    de: string;
    fr: string;
  };
  /** Classification area: A=Assets, B=Liabilities, C=Income, D=Expenses, E=Closing */
  area: string;
  /** Hierarchical group path in German and French */
  group: {
    de: string[];
    fr: string[];
  };
  /** ISO currency code (e.g., "CHF", "EUR", "USD") */
  currency: string;
  /** Whether this is an income statement account (vs balance sheet) */
  isIncome: boolean;
  /** Whether this account is tax-relevant */
  hasTax: boolean;
}

export interface Kontenplan {
  accounts: KontenplanAccount[];
}