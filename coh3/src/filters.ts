import { MP_COALITIONS, type CoalitionId } from "./factions";

export const FACTION_ALL = "all";
export const CATEGORY_ALL = "all";

const COALITION_IDS: CoalitionId[] = ["allies", "axis"];

export function isCoalitionFactionFilter(filter: string): filter is CoalitionId {
  return (COALITION_IDS as readonly string[]).includes(filter);
}

/** Factions included in the current filter, or `null` when all factions match. */
export function factionsForFactionFilter(filter: string): readonly string[] | null {
  if (filter === FACTION_ALL) return null;
  const coalition = MP_COALITIONS.find((c) => c.id === filter);
  if (coalition) return coalition.factions;
  return [filter];
}

export function normalizeFactionParam(raw: string | null): string {
  if (raw === null || raw === "") return FACTION_ALL;
  return raw;
}

export function normalizeCategoryParam(raw: string | null): string {
  if (raw === null || raw === "") return CATEGORY_ALL;
  return raw;
}

export function unitMatchesFaction(unitFaction: string, filter: string): boolean {
  const allowed = factionsForFactionFilter(filter);
  if (allowed === null) return true;
  return allowed.includes(unitFaction);
}

export function unitMatchesCategory(unitCategory: string, filter: string): boolean {
  return filter === CATEGORY_ALL || unitCategory === filter;
}

export function listUnitsQuery(faction: string, category: string): string {
  const f = faction || FACTION_ALL;
  const c = category || CATEGORY_ALL;
  return `faction=${encodeURIComponent(f)}&category=${encodeURIComponent(c)}`;
}
