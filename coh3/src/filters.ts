import { MP_COALITIONS, MP_FACTION_ORDER, type CoalitionId } from "./factions";

export const FACTION_ALL = "all";
export const CATEGORY_ALL = "all";

const COALITION_IDS: CoalitionId[] = ["allies", "axis"];

/** `null` = all MP factions selected. `[]` = none. Otherwise explicit subset. */
export type FactionSelection = string[] | null;

export type SortOrder = "asc" | "desc";

export function isCoalitionFactionFilter(filter: string): filter is CoalitionId {
  return (COALITION_IDS as readonly string[]).includes(filter);
}

function sortFactions(ids: readonly string[]): string[] {
  const order = new Map(MP_FACTION_ORDER.map((f, i) => [f, i]));
  return [...ids].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function selectionFromSet(set: Set<string>): FactionSelection {
  if (set.size === 0) return [];
  if (set.size === MP_FACTION_ORDER.length) return null;
  return sortFactions([...set]);
}

export function effectiveFactionSet(sel: FactionSelection): Set<string> {
  if (sel === null) return new Set(MP_FACTION_ORDER);
  return new Set(sel);
}

export function parseFactionsParam(raw: string | null): FactionSelection {
  if (raw === null || raw === "" || raw === FACTION_ALL) return null;
  if (isCoalitionFactionFilter(raw)) {
    const coalition = MP_COALITIONS.find((c) => c.id === raw)!;
    return [...coalition.factions];
  }
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const valid = parts.filter((p) => (MP_FACTION_ORDER as readonly string[]).includes(p));
  if (valid.length === 0) return [];
  if (valid.length === MP_FACTION_ORDER.length) return null;
  return sortFactions(valid);
}

export function serializeFactionsParam(sel: FactionSelection): string {
  if (sel === null) return FACTION_ALL;
  return sortFactions(sel).join(",");
}

export function parseSortOrderParam(raw: string | null): SortOrder {
  return raw === "asc" ? "asc" : "desc";
}

export function isAllFactionsSelected(sel: FactionSelection): boolean {
  return sel === null;
}

export function isFactionSelected(sel: FactionSelection, faction: string): boolean {
  return effectiveFactionSet(sel).has(faction);
}

export function coalitionFullySelected(sel: FactionSelection, coalitionId: CoalitionId): boolean {
  const coalition = MP_COALITIONS.find((c) => c.id === coalitionId)!;
  const set = effectiveFactionSet(sel);
  return coalition.factions.every((f) => set.has(f));
}

export function coalitionPartiallySelected(sel: FactionSelection, coalitionId: CoalitionId): boolean {
  const coalition = MP_COALITIONS.find((c) => c.id === coalitionId)!;
  const set = effectiveFactionSet(sel);
  const count = coalition.factions.filter((f) => set.has(f)).length;
  return count > 0 && count < coalition.factions.length;
}

export function toggleFactionInSelection(sel: FactionSelection, faction: string): FactionSelection {
  const set = effectiveFactionSet(sel);
  if (set.has(faction)) set.delete(faction);
  else set.add(faction);
  return selectionFromSet(set);
}

export function toggleCoalitionInSelection(
  sel: FactionSelection,
  coalitionId: CoalitionId,
): FactionSelection {
  const coalition = MP_COALITIONS.find((c) => c.id === coalitionId)!;
  const set = effectiveFactionSet(sel);
  const allIn = coalition.factions.every((f) => set.has(f));
  for (const f of coalition.factions) {
    if (allIn) set.delete(f);
    else set.add(f);
  }
  return selectionFromSet(set);
}

export function normalizeCategoryParam(raw: string | null): string {
  if (raw === null || raw === "") return CATEGORY_ALL;
  return raw;
}

export function unitMatchesFactions(unitFaction: string, sel: FactionSelection): boolean {
  if (sel === null) return true;
  if (sel.length === 0) return false;
  return sel.includes(unitFaction);
}

export function unitMatchesCategory(unitCategory: string, filter: string): boolean {
  return filter === CATEGORY_ALL || unitCategory === filter;
}

export function listUnitsQuery(
  factions: FactionSelection,
  category: string,
  order: SortOrder = "desc",
): string {
  const params = new URLSearchParams();
  params.set("faction", serializeFactionsParam(factions));
  params.set("category", category || CATEGORY_ALL);
  if (order !== "desc") params.set("order", order);
  return params.toString();
}
