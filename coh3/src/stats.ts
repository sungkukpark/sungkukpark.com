export type UnitCombatStats = {
  costMp: number;
  costFuel: number;
  costPop: number;
  health: number;
  range: number;
  penetration: number;
  damage: number;
  dps: number;
  armor: number;
  sight: number;
};

export const STAT_KEYS = [
  "costMp",
  "costPop",
  "health",
  "range",
  "penetration",
  "damage",
  "dps",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export function statValue(stats: UnitCombatStats, key: StatKey): number {
  return stats[key];
}

export function maxStatInUnits(
  units: { combat?: UnitCombatStats }[],
  key: StatKey,
): number {
  let max = 0;
  for (const u of units) {
    if (!u.combat) continue;
    const v = statValue(u.combat, key);
    if (v > max) max = v;
  }
  return max || 1;
}
