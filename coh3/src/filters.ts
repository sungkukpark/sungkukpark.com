export const FACTION_ALL = "all";
export const CATEGORY_ALL = "all";

export function normalizeFactionParam(raw: string | null): string {
  if (raw === null || raw === "") return FACTION_ALL;
  return raw;
}

export function normalizeCategoryParam(raw: string | null): string {
  if (raw === null || raw === "") return CATEGORY_ALL;
  return raw;
}

export function unitMatchesFaction(unitFaction: string, filter: string): boolean {
  return filter === FACTION_ALL || unitFaction === filter;
}

export function unitMatchesCategory(unitCategory: string, filter: string): boolean {
  return filter === CATEGORY_ALL || unitCategory === filter;
}

export function listUnitsQuery(faction: string, category: string): string {
  const f = faction || FACTION_ALL;
  const c = category || CATEGORY_ALL;
  return `faction=${encodeURIComponent(f)}&category=${encodeURIComponent(c)}`;
}
