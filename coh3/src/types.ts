export const FACTION_LABELS: Record<string, string> = {
  american: "US Forces",
  german: "Wehrmacht",
  british: "British Forces",
  afrika_korps: "Afrika Korps",
  british_africa: "British (Africa)",
};

export const CATEGORY_LABELS: Record<string, string> = {
  infantry: "Infantry",
  vehicles: "Vehicles",
  team_weapons: "Team weapons",
  emplacements: "Emplacements",
  aircraft: "Aircraft",
};

export const OPEN_DATA_URL = "https://coh3stats.com/other/open-data";

export type UnitSummary = {
  id: string;
  faction: string;
  category: string;
  unitKey: string;
  displayName: string;
  pbgid?: number;
};

export type UnitsIndex = {
  dataTag: string;
  generatedAt: string;
  factions: string[];
  categories: string[];
  units: UnitSummary[];
};

export type SpecRow = { key: string; value: string };
export type SpecSection = { title: string; rows: SpecRow[] };

export type UnitDetail = {
  id: string;
  faction: string;
  category: string;
  unitKey: string;
  displayName: string;
  dataTag: string;
  sections: SpecSection[];
  raw: unknown;
};
