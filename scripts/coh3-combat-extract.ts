/**
 * Lightweight combat stat extraction from raw coh3-data JSON (build-time only).
 * Weapon resolution aligned with coh3-stats getSbpsWeapons (ebp hardpoint → weapon template).
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
  damageType: string;
  penetrationNear: number;
  rangeMax: number;
  reloadSec: number;
  aoeOuterRadius: number;
  enableAutoTargetSearch: boolean;
};

type HardpointWeaponRef = {
  ebpId: string;
  initializeOnCreate: boolean;
  receivesAttack: boolean;
};

function num(val: unknown, fallback = 0): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string" && val !== "" && !Number.isNaN(Number(val))) return Number(val);
  return fallback;
}

function relicBool(val: unknown, defaultVal: boolean): boolean {
  if (val === "True" || val === true) return true;
  if (val === "False" || val === false) return false;
  return defaultVal;
}

function refId(ref: unknown): string {
  if (typeof ref === "string") return ref.split(/[/\\]/).filter(Boolean).pop() ?? "";
  if (ref && typeof ref === "object") {
    const o = ref as Record<string, unknown>;
    if (typeof o.instance_reference === "string") return refId(o.instance_reference);
    if (typeof o.pbg === "string") return refId(o.pbg);
    if (typeof o.ebp === "string") return refId(o.ebp);
  }
  return "";
}

function walkExtensions(
  raw: unknown,
  onBag: (bag: Record<string, unknown>, template: string) => void,
): void {
  const root = raw as {
    extensions?: Array<{ exts?: Record<string, unknown>; squadexts?: Record<string, unknown> }>;
  };
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
  const damage = wb.damage as { max?: unknown; min?: unknown; damage_type?: string } | undefined;
  const penetration = wb.penetration as { near?: unknown; mid?: unknown; far?: unknown } | undefined;
  const range = wb.range as {
    max?: unknown;
    min?: unknown;
    distance?: { near?: unknown; mid?: unknown; far?: unknown };
  } | undefined;
  const reload = wb.reload as
    | { duration?: { min?: unknown; max?: unknown } | unknown }
    | undefined;
  const area = wb.area_effect as { area_info?: { outer_radius?: unknown } } | undefined;
  const behaviour = wb.behaviour as { enable_auto_target_search?: unknown } | undefined;

  const damageMax = num(damage?.max);
  const damageType = typeof damage?.damage_type === "string" ? damage.damage_type : "";

  let penetrationNear = num(penetration?.near, -1);
  let penetrationMid = num(penetration?.mid, -1);
  let penetrationFar = num(penetration?.far, -1);
  const rangeMin = num(range?.min);
  let rangeMax = num(range?.max);
  if (penetrationNear === -1) penetrationNear = rangeMin > 0 ? rangeMin : 0;
  if (penetrationFar === -1) penetrationFar = rangeMax > 0 ? rangeMax : penetrationNear;
  if (penetrationMid === -1) penetrationMid = (penetrationNear + penetrationFar) / 2;

  const dist = range?.distance;
  if (rangeMax === 0 && dist) {
    rangeMax = Math.max(num(dist.near), num(dist.mid), num(dist.far), rangeMin);
  }

  let reloadSec = 0;
  const duration = reload?.duration;
  if (duration && typeof duration === "object" && !Array.isArray(duration)) {
    const d = duration as { min?: unknown; max?: unknown };
    reloadSec = num(d.max) || num(d.min);
  } else {
    reloadSec = num(duration);
  }

  if (damageMax === 0 && penetrationNear === 0 && rangeMax === 0) return null;

  return {
    damageMax,
    damageType,
    penetrationNear,
    rangeMax,
    reloadSec,
    aoeOuterRadius: num(area?.area_info?.outer_radius),
    enableAutoTargetSearch: relicBool(behaviour?.enable_auto_target_search, true),
  };
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

function weaponTemplateIdFromEbps(entity: Record<string, unknown> | undefined): string {
  if (!entity) return "";
  let weaponId = "";
  walkExtensions(entity, (bag, template) => {
    if (template.includes("weapon_ext")) {
      weaponId = refId(bag.weapon);
    }
  });
  return weaponId;
}

function unitTypesFromEbps(entity: Record<string, unknown>): string[] {
  const types: string[] = [];
  walkExtensions(entity, (bag, template) => {
    if (!template.includes("type_ext")) return;
    const list = bag.unit_type_list as Array<{ unit_type?: string }> | undefined;
    if (!Array.isArray(list)) return;
    for (const row of list) {
      if (row.unit_type) types.push(row.unit_type);
    }
  });
  return types;
}

function combatHardpointRefs(entity: Record<string, unknown>): HardpointWeaponRef[] {
  const refs: HardpointWeaponRef[] = [];
  walkExtensions(entity, (bag, template) => {
    if (!template.includes("combat_ext")) return;
    const hardpoints = bag.hardpoints as Array<{ hardpoint?: Record<string, unknown> }> | undefined;
    if (!Array.isArray(hardpoints)) return;
    for (const entry of hardpoints) {
      const hp = entry.hardpoint;
      if (!hp) continue;
      const table = hp.weapon_table as Array<{ weapon?: Record<string, unknown> }> | undefined;
      if (!Array.isArray(table)) continue;
      for (const row of table) {
        const slot = row.weapon;
        if (!slot || typeof slot !== "object") continue;
        const inner = (slot as Record<string, unknown>).weapon as Record<string, unknown> | undefined;
        const weaponNode = inner ?? (slot as Record<string, unknown>);
        const attach = weaponNode.weapon_entity_attachment as Record<string, unknown> | undefined;
        const entityAttach = attach?.entity_attach_data as Record<string, unknown> | undefined;
        const ebpId = refId(entityAttach?.ebp);
        if (!ebpId) continue;
        refs.push({
          ebpId,
          initializeOnCreate: relicBool(hp.initialize_weapons_on_creation, true),
          receivesAttack: relicBool(hp.receives_attack_commands, true),
        });
        break;
      }
    }
  });
  return refs;
}

function shouldSkipVehicleHardpoint(ref: HardpointWeaponRef, slice: WeaponSlice): boolean {
  if (!ref.initializeOnCreate) return true;
  if (!ref.receivesAttack && !slice.enableAutoTargetSearch) return true;
  return false;
}

function isDamageDealingWeapon(slice: WeaponSlice): boolean {
  if (slice.damageType === "explosive") {
    return slice.aoeOuterRadius > 0;
  }
  return slice.damageMax > 0;
}

function resolveWeaponSlice(
  weaponHolderEbps: Record<string, unknown>,
  weapons: Map<string, WeaponSlice>,
): WeaponSlice | undefined {
  const templateId = weaponTemplateIdFromEbps(weaponHolderEbps);
  if (!templateId) return undefined;
  return weapons.get(templateId);
}

function weaponSlicesFromEntity(
  entity: Record<string, unknown>,
  ebps: Map<string, Record<string, unknown>>,
  weapons: Map<string, WeaponSlice>,
): WeaponSlice[] {
  const types = unitTypesFromEbps(entity);
  const isVehicle = types.includes("vehicles") || types.includes("vehicle");

  const out: WeaponSlice[] = [];

  for (const ref of combatHardpointRefs(entity)) {
    const holder = getEbpsEntity(ebps, ref.ebpId);
    const slice = holder ? resolveWeaponSlice(holder, weapons) : undefined;
    if (!slice || !isDamageDealingWeapon(slice)) continue;
    if (isVehicle && shouldSkipVehicleHardpoint(ref, slice)) continue;
    out.push(slice);
  }

  const directTemplateId = weaponTemplateIdFromEbps(entity);
  if (directTemplateId) {
    const direct = weapons.get(directTemplateId);
    if (direct && isDamageDealingWeapon(direct)) out.push(direct);
  }

  return out;
}

function loadoutEntries(sbpsRaw: unknown): Array<{ id: string; num: number }> {
  const entries: Array<{ id: string; num: number }> = [];
  walkExtensions(sbpsRaw, (bag, template) => {
    if (!template.includes("squad_loadout_ext")) return;
    const list = bag.unit_list as Array<{ loadout_data?: { type?: unknown; num?: number } }>;
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      const id = refId(entry.loadout_data?.type);
      if (!id) continue;
      entries.push({ id, num: num(entry.loadout_data?.num, 1) });
    }
  });
  return entries;
}

function loadoutEntityIds(sbpsRaw: unknown): string[] {
  return loadoutEntries(sbpsRaw).map((e) => e.id);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function entityResourceCosts(entity: Record<string, unknown> | undefined): {
  manpower: number;
  fuel: number;
  munition: number;
  entityPop: number;
} {
  let manpower = 0;
  let fuel = 0;
  let munition = 0;
  let entityPop = 0;
  if (!entity) return { manpower, fuel, munition, entityPop };

  walkExtensions(entity, (bag, template) => {
    if (template.includes("cost_ext")) {
      const timeCost = bag.time_cost as Record<string, unknown> | undefined;
      const cost = timeCost?.cost as Record<string, unknown> | undefined;
      manpower = num(cost?.manpower, manpower);
      fuel = num(cost?.fuel, fuel);
      munition = num(cost?.munition, munition);
      const pop = num(cost?.popcap);
      if (pop > 0) entityPop = pop;
    }
    if (template.includes("population_ext")) {
      entityPop = num(bag.personnel_pop, entityPop);
    }
  });
  return { manpower, fuel, munition, entityPop };
}

function spawnerCostAdjustment(
  unitKey: string,
  ebps: Map<string, Record<string, unknown>>,
): { manpower: number; fuel: number; popcap: number } {
  let manpower = 0;
  let fuel = 0;
  let popcap = 0;
  for (const entity of ebps.values()) {
    walkExtensions(entity, (bag, template) => {
      if (!template.includes("spawner_ext")) return;
      const items = bag.spawn_items as Array<{ spawn_item?: Record<string, unknown> }> | undefined;
      if (!Array.isArray(items)) return;
      for (const row of items) {
        const spawnItem = row.spawn_item;
        if (!spawnItem) continue;
        const squadId = refId(spawnItem.squad);
        if (squadId !== unitKey) continue;
        const adj = spawnItem.item_cost_adjustment as Record<string, unknown> | undefined;
        manpower = num(adj?.manpower, manpower);
        fuel = num(adj?.fuel, fuel);
        popcap = num(adj?.popcap, popcap);
      }
    });
  }
  return { manpower, fuel, popcap };
}

function squadProductionCost(
  sbpsRaw: unknown,
  unitKey: string,
  ebps: Map<string, Record<string, unknown>>,
): { costMp: number; costFuel: number; costPop: number } {
  const squadPop = squadPopulationPop(sbpsRaw);
  const adj = spawnerCostAdjustment(unitKey, ebps);
  const loadouts = loadoutEntries(sbpsRaw);

  let costMp = adj.manpower;
  let costFuel = adj.fuel;
  let costPop = squadPop + adj.popcap;

  for (const { id, num: count } of loadouts) {
    const entity = getEbpsEntity(ebps, id);
    const costs = entityResourceCosts(entity);
    costMp += costs.manpower * count;
    costFuel += costs.fuel * count;
    costPop += costs.entityPop * count;
  }

  return { costMp: round1(costMp), costFuel: round1(costFuel), costPop: round1(costPop) };
}

function crewSizeFromEbps(entity: Record<string, unknown> | undefined): number {
  if (!entity) return 1;
  let crew = 0;
  walkExtensions(entity, (bag, template) => {
    if (!template.includes("recrewable_ext")) return;
    const raceList = bag.race_list as Array<{ race_data?: { info?: { min_capture_crew_size?: unknown } } }>;
    if (!Array.isArray(raceList) || !raceList[0]?.race_data?.info) return;
    crew = num(raceList[0].race_data.info.min_capture_crew_size, crew);
  });
  return crew > 0 ? crew : 1;
}

function computeSquadHealth(
  sbpsRaw: unknown,
  category: string,
  ebps: Map<string, Record<string, unknown>>,
): number {
  const loadouts = loadoutEntries(sbpsRaw);

  if (category === "vehicles" || category === "aircraft") {
    const id = loadouts[0]?.id;
    const entity = id ? getEbpsEntity(ebps, id) : undefined;
    return ebpsHealthArmor(entity).health;
  }

  if (category === "team_weapons" && loadouts.length > 1) {
    const def = loadouts[1];
    const entity = getEbpsEntity(ebps, def.id);
    const hp = ebpsHealthArmor(entity).health;
    const crew = crewSizeFromEbps(entity);
    return hp * def.num * crew;
  }

  if (category === "emplacements") {
    let total = 0;
    for (const { id, num: count } of loadouts) {
      const entity = getEbpsEntity(ebps, id);
      const hp = ebpsHealthArmor(entity).health;
      const crew = crewSizeFromEbps(entity);
      total += hp * count * crew;
    }
    return total;
  }

  let total = 0;
  for (const { id, num: count } of loadouts) {
    const entity = getEbpsEntity(ebps, id);
    const hp = ebpsHealthArmor(entity).health;
    const crew = crewSizeFromEbps(entity);
    total += hp * count * crew;
  }
  return total;
}

function selectPrimaryWeapon(slices: WeaponSlice[], category: string): WeaponSlice | null {
  if (slices.length === 0) return null;
  if (category === "team_weapons" || category === "emplacements") {
    return slices.reduce((best, slice) =>
      slice.penetrationNear > best.penetrationNear ||
      (slice.penetrationNear === best.penetrationNear && slice.damageMax > best.damageMax)
        ? slice
        : best,
    );
  }
  return slices[0];
}

function collectWeaponSlices(
  sbpsRaw: unknown,
  ebps: Map<string, Record<string, unknown>>,
  weapons: Map<string, WeaponSlice>,
  category: string,
): WeaponSlice[] {
  const entries = loadoutEntries(sbpsRaw);
  const targetEntries = category === "team_weapons" ? entries : entries;

  const all: WeaponSlice[] = [];
  for (const { id } of targetEntries) {
    const entity = getEbpsEntity(ebps, id);
    if (!entity) continue;
    all.push(...weaponSlicesFromEntity(entity, ebps, weapons));
  }
  return all;
}

function ebpsHealthArmor(entity: Record<string, unknown> | undefined): {
  health: number;
  armor: number;
  sight: number;
} {
  let health = 0;
  let armor = 0;
  let sight = 0;
  if (!entity) return { health, armor, sight };

  walkExtensions(entity, (bag, template) => {
    if (template.includes("health_ext")) {
      health = num(bag.hitpoints, health);
      const layout = bag.armor_layout_option as Record<string, unknown> | undefined;
      const front = num(layout?.front_armor);
      const infantryArmor = num(layout?.armor);
      armor = front || infantryArmor || num(bag.front_armor, armor);
    }
    if (template.includes("sight_ext")) {
      const pkg = bag.sight_package as Record<string, unknown> | undefined;
      sight = num(pkg?.outer_radius, sight);
    }
  });
  return { health, armor, sight };
}

function squadPopulationPop(sbpsRaw: unknown): number {
  let pop = 0;
  walkExtensions(sbpsRaw, (bag, template) => {
    if (template.includes("squad_population_ext")) {
      pop = num(bag.personnel_pop, pop);
    }
  });
  return pop;
}

export function extractCombatStats(
  sbpsRaw: unknown,
  category: string,
  unitKey: string,
  ebps: Map<string, Record<string, unknown>>,
  weapons: Map<string, WeaponSlice>,
): UnitCombatStats | null {
  const loadouts = loadoutEntityIds(sbpsRaw);
  let entityId = loadouts[0];
  if (category === "team_weapons" && loadouts[1]) entityId = loadouts[1];

  const entity = entityId ? getEbpsEntity(ebps, entityId) : undefined;
  const vitals = ebpsHealthArmor(entity);
  const production = squadProductionCost(sbpsRaw, unitKey, ebps);
  const weaponSlices = collectWeaponSlices(sbpsRaw, ebps, weapons, category);
  const weapon = selectPrimaryWeapon(weaponSlices, category);

  const costMp = production.costMp;
  const costFuel = production.costFuel;
  const costPop = production.costPop;
  const health = computeSquadHealth(sbpsRaw, category, ebps) || vitals.health;

  const damage = weapon?.damageMax ?? 0;
  const penetration = weapon?.penetrationNear ?? 0;
  const range = weapon?.rangeMax ?? 0;
  const reload = weapon?.reloadSec ?? 0;
  const dps = reload > 0 && damage > 0 ? round1(damage / reload) : 0;

  const hasSignal =
    costMp > 0 ||
    costFuel > 0 ||
    costPop > 0 ||
    health > 0 ||
    vitals.sight > 0 ||
    vitals.armor > 0 ||
    (weapon !== null && (range > 0 || penetration > 0 || damage > 0));

  if (!hasSignal) return null;

  return {
    costMp,
    costFuel,
    costPop,
    health,
    range,
    penetration,
    damage,
    dps,
    armor: vitals.armor,
    sight: vitals.sight,
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
