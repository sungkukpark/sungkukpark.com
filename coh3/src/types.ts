import type { Locale } from "./i18n/locale";

export const OPEN_DATA_URL = "https://coh3stats.com/other/open-data";
export type LocalizedString = { en: string; ko: string };

export function pickLocalized(map: LocalizedString, locale: Locale): string {
  return map[locale] || map.en;
}

/** @deprecated use pickLocalized on displayNames */
export function legacyDisplayName(
  unit: { displayName?: string; displayNames?: LocalizedString },
  locale: Locale,
): string {
  if (unit.displayNames) return pickLocalized(unit.displayNames, locale);
  return unit.displayName ?? "";
}

export type UnitSummary = {
  id: string;
  faction: string;
  category: string;
  unitKey: string;
  displayNames: LocalizedString;
  pbgid?: number;
};

export type UnitsIndex = {
  dataTag: string;
  generatedAt: string;
  locales: Locale[];
  factions: string[];
  categories: string[];
  units: UnitSummary[];
};

export type SpecRow = { key: string; value: string };
export type SpecSection = { title: string; rows: SpecRow[] };

export type UnitLocaleBundle = {
  displayName: string;
  sections: SpecSection[];
};

export type UnitDetail = {
  id: string;
  faction: string;
  category: string;
  unitKey: string;
  dataTag: string;
  localized: Record<Locale, UnitLocaleBundle>;
  raw: unknown;
};
