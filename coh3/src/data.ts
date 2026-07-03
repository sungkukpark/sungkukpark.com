const BASE = import.meta.env.BASE_URL;

export async function loadUnitsIndex(): Promise<import("./types").UnitsIndex> {
  const res = await fetch(`${BASE}data/units.index.json`);
  if (!res.ok) throw new Error(`Failed to load unit index (${res.status})`);
  return res.json();
}

export async function loadUnitDetail(
  faction: string,
  category: string,
  unitKey: string,
): Promise<import("./types").UnitDetail> {
  const res = await fetch(`${BASE}data/units/${faction}/${category}/${unitKey}.json`);
  if (!res.ok) throw new Error(`Failed to load unit (${res.status})`);
  return res.json();
}
