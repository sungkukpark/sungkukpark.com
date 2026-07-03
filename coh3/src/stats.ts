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

export function formatStatDisplay(key: StatKey, value: number): string {
  if (value === 0) return "—";
  return String(Math.round(value * 10) / 10);
}

export type StatBarTier = "low" | "mid" | "high";

/** Linear share of category max; visible min width for any non-zero value. */
export function statBarMetrics(
  value: number,
  max: number,
): { fillPct: number; sharePct: number; tier: StatBarTier; isEmpty: boolean } {
  if (value <= 0 || max <= 0) {
    return { fillPct: 0, sharePct: 0, tier: "low", isEmpty: true };
  }
  const ratio = Math.min(1, value / max);
  const sharePct = Math.round(ratio * 100);
  const fillPct = sharePct;
  let tier: StatBarTier = "low";
  if (ratio >= 0.66) tier = "high";
  else if (ratio >= 0.33) tier = "mid";
  return { fillPct, sharePct, tier, isEmpty: false };
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
