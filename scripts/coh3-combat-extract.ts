/**
 * Lightweight combat stat extraction from raw coh3-data JSON (build-time only).
 * Aligned with coh3-stats unit browser priorities; not a full DPS simulator.
 */

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

type WeaponSlice = {
  damageMax: number;
  penetrationNear: number;
  rangeMax: number;
  reloadSec: number;
};

function num(val: unknown, fallback = 0): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string" && val !== "" && !Number.isNaN(Number(val))) return Number(val);
  return fallback;
}

function refId(ref: unknown): string {
  if (typeof ref === "string") return ref.split(/[/\\]/).filter(Boolean).pop() ?? "";
  if (ref && typeof ref === "object") {
    const o = ref as Record<string, unknown>;
    if (typeof o.instance_reference === "string") return refId(o.instance_reference);
    if (typeof o.pbg === "string") return refId(o.pbg);
  }
  return "";
}

function walkExtensions(
  raw: unknown,
  onBag: (bag: Record<string, unknown>, template: string) => void,
): void {
  const root = raw as { extensions?: Array<{ exts?: Record<string, unknown>; squadexts?: Record<string, unknown> }> };
  if (!root.extensions) return;
  for (const ext of root.extensions) {
    const bag = ext.squadexts ?? ext.exts;
    if (!bag) continue;
    const tr = bag.template_reference as { value?: string } | undefined;
    onBag(bag, tr?.value ?? "");
  }
}

export function indexEntitiesByKey(root: unknown): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  function walk(node: unknown, pathParts: string[]): void {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
      const parts = [...pathParts, key];
      if (val && typeof val === "object" && "extensions" in (val as object)) {
        const entity = val as Record<string, unknown>;
        map.set(key, entity);
        map.set(parts.join("/"), entity);
      }
      walk(val, parts);
    }
  }
  walk(root, []);
  return map;
}

function getEbpsEntity(
  ebps: Map<string, Record<string, unknown>>,
  id: string,
): Record<string, unknown> | undefined {
  if (!id) return undefined;
  const hit = ebps.get(id);
  if (hit) return hit;
  for (const [key, entity] of ebps) {
    if (key === id || key.endsWith(`/${id}`)) return entity;
  }
  return undefined;
}

function parseWeaponBagFromSchema(wb: Record<string, unknown>): WeaponSlice | null {
  const damage = wb.damage as { max?: unknown; min?: unknown } | undefined;
  const penetration = wb.penetration as { near?: unknown } | undefined;
  const range = wb.range as { max?: unknown; min?: unknown } | undefined;
  const reload = wb.reload as
    | { duration?: { min?: unknown; max?: unknown } | unknown }
    | undefined;

  const damageMax = num(damage?.max);
  const penetrationNear = num(penetration?.near);
  const rangeMax = num(range?.max);

  let reloadSec = 0;
  const duration = reload?.duration;
  if (duration && typeof duration === "object" && !Array.isArray(duration)) {
    const d = duration as { min?: unknown; max?: unknown };
    reloadSec = num(d.max) || num(d.min);
  } else {
    reloadSec = num(duration);
  }

  if (damageMax === 0 && penetrationNear === 0 && rangeMax === 0) return null;
  return { damageMax, penetrationNear, rangeMax, reloadSec };
}

function isWeaponBagContainer(obj: unknown): boolean {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const keys = Object.keys(obj as object);
  return keys.length > 0 && keys[0] === "weapon_bag";
}

function traverseWeaponTree(
  node: unknown,
  onWeapon: (weaponKey: string, bag: Record<string, unknown>) => void,
): void {
  if (!node || typeof node !== "object" || Array.isArray(node)) return;
  for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
    if (isWeaponBagContainer(child)) {
      const wb = (child as { weapon_bag: Record<string, unknown> }).weapon_bag;
      onWeapon(key, wb);
    } else {
      traverseWeaponTree(child, onWeapon);
    }
  }
}

export function indexWeaponsByKey(weaponRoot: unknown): Map<string, WeaponSlice> {
  const map = new Map<string, WeaponSlice>();
  if (!weaponRoot || typeof weaponRoot !== "object") return map;

  for (const topVal of Object.values(weaponRoot as Record<string, unknown>)) {
    traverseWeaponTree(topVal, (weaponKey, wb) => {
      const slice = parseWeaponBagFromSchema(wb);
      if (slice) map.set(weaponKey, slice);
    });
  }
  return map;
}

function weaponIdsFromEbps(entity: Record<string, unknown>): string[] {
  const ids: string[] = [];
  walkExtensions(entity, (bag, template) => {
    if (template.includes("combat_ext")) {
      const hardpoints = bag.hardpoints as Array<{ hardpoint?: Record<string, unknown> }> | undefined;
      if (Array.isArray(hardpoints)) {
        for (const entry of hardpoints) {
          const hp = entry.hardpoint;
          const table = hp?.weapon_table as Array<{ weapon?: Record<string, unknown> }> | undefined;
          if (!Array.isArray(table)) continue;
          for (const row of table) {
            const weaponRow = row.weapon;
            if (!weaponRow || typeof weaponRow !== "object") continue;
            const w = weaponRow as Record<string, unknown>;
            const attach = w.weapon_entity_attachment as Record<string, unknown> | undefined;
            const entityAttach = attach?.entity_attach_data as Record<string, unknown> | undefined;
            const ebpRef = entityAttach?.ebp;
            const ebpId = refId(ebpRef);
            if (ebpId) ids.push(ebpId);
            const weaponRef = w.weapon ?? w.weapon_bag;
            const wid = refId(weaponRef);
            if (wid) ids.push(wid);
          }
        }
      }
    }
    if (template.includes("weapon_ext")) {
      const wid = refId(bag.weapon);
      if (wid) ids.push(wid);
    }
  });
  return ids;
}

function loadoutEntityIds(sbpsRaw: unknown): string[] {
  const ids: string[] = [];
  walkExtensions(sbpsRaw, (bag, template) => {
    if (!template.includes("squad_loadout_ext")) return;
    const list = bag.unit_list as Array<{ loadout_data?: { type?: unknown; num?: number } }>;
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      const id = refId(entry.loadout_data?.type);
      if (id) ids.push(id);
    }
  });
  return ids;
}

function primaryWeapon(
  sbpsRaw: unknown,
  ebps: Map<string, Record<string, unknown>>,
  weapons: Map<string, WeaponSlice>,
  category: string,
): WeaponSlice | null {
  const loadouts = loadoutEntityIds(sbpsRaw);
  const ordered =
    category === "team_weapons" && loadouts.length > 1
      ? [loadouts[1], ...loadouts.filter((_, i) => i !== 1)]
      : loadouts;

  let best: WeaponSlice | null = null;
  const consider = (slice: WeaponSlice | undefined) => {
    if (!slice) return;
    if (slice.damageMax === 0 && slice.rangeMax === 0 && slice.penetrationNear === 0) return;
    if (!best || slice.damageMax > best.damageMax || (slice.damageMax === best.damageMax && slice.rangeMax > best.rangeMax)) {
      best = slice;
    }
  };

  for (const eid of ordered) {
    if (!eid) continue;
    const entity = getEbpsEntity(ebps, eid);
    if (!entity) continue;
    for (const wid of weaponIdsFromEbps(entity)) {
      consider(weapons.get(wid));
    }
  }

  if (best) return best;

  for (const wid of weapons.keys()) {
    if (loadouts.some((eid) => wid.includes(eid) || eid.includes(wid))) {
      return weapons.get(wid) ?? null;
    }
  }
  return null;
}

function ebpsHealthArmor(entity: Record<string, unknown> | undefined): {
  health: number;
  armor: number;
  sight: number;
  costMp: number;
  costFuel: number;
} {
  let health = 0;
  let armor = 0;
  let sight = 0;
  let costMp = 0;
  let costFuel = 0;
  if (!entity) return { health, armor, sight, costMp, costFuel };

  walkExtensions(entity, (bag, template) => {
    if (template.includes("health_ext")) {
      health = num(bag.hitpoints, health);
      const layout = bag.armor_layout_option as Record<string, unknown> | undefined;
      armor = num(layout?.front_armor, armor) || num(bag.front_armor, armor);
    }
    if (template.includes("sight_ext")) {
      const pkg = bag.sight_package as Record<string, unknown> | undefined;
      sight = num(pkg?.outer_radius, sight);
    }
    if (template.includes("cost_ext") || template.includes("cost")) {
      costMp = num(bag.manpower, costMp);
      costFuel = num(bag.fuel, costFuel);
    }
  });
  return { health, armor, sight, costMp, costFuel };
}

function squadCosts(sbpsRaw: unknown): { pop: number; mp: number; fuel: number } {
  let pop = 0;
  let mp = 0;
  let fuel = 0;
  walkExtensions(sbpsRaw, (bag, template) => {
    if (template.includes("squad_population_ext")) {
      pop = num(bag.personnel_pop, pop);
      const upkeep = bag.upkeep_per_pop_per_minute_override as Record<string, unknown> | undefined;
      mp += num(upkeep?.manpower, 0) * pop;
    }
  });
  return { pop, mp, fuel };
}

export function extractCombatStats(
  sbpsRaw: unknown,
  category: string,
  ebps: Map<string, Record<string, unknown>>,
  weapons: Map<string, WeaponSlice>,
): UnitCombatStats | null {
  const loadouts = loadoutEntityIds(sbpsRaw);
  let entityId = loadouts[0];
  if (category === "team_weapons" && loadouts[1]) entityId = loadouts[1];

  const entity = entityId ? getEbpsEntity(ebps, entityId) : undefined;
  const { health, armor, sight, costMp: ebpsMp, costFuel: ebpsFuel } = ebpsHealthArmor(entity);
  const squad = squadCosts(sbpsRaw);
  const weapon = primaryWeapon(sbpsRaw, ebps, weapons, category);

  const costMp = ebpsMp || 0;
  const costFuel = ebpsFuel || 0;
  const costPop = squad.pop;

  const damage = weapon?.damageMax ?? 0;
  const penetration = weapon?.penetrationNear ?? 0;
  const range = weapon?.rangeMax ?? 0;
  const reload = weapon?.reloadSec ?? 0;
  const dps = reload > 0 ? damage / reload : damage > 0 ? damage : 0;

  const hasSignal =
    costMp > 0 ||
    costPop > 0 ||
    health > 0 ||
    range > 0 ||
    penetration > 0 ||
    damage > 0;

  if (!hasSignal) return null;

  return {
    costMp,
    costFuel,
    costPop,
    health: health > 0 ? health : 0,
    range,
    penetration,
    damage,
    dps,
    armor,
    sight,
  };
}

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
