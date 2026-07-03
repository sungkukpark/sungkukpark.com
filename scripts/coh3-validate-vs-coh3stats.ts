/**
 * Cross-check sungkukpark.com combat extract vs coh3-stats mapCustomizableUnit.
 * Run: pnpm coh3:validate-stats (after coh3:ingest)
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const COH3_STATS = path.join(REPO_ROOT, "..", "coh3-stats");
const INDEX_PATH = path.join(REPO_ROOT, "coh3/public/data/units.index.json");

type OurCombat = {
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

type RefUnit = {
  id: string;
  faction: string;
  unit_type: string;
  cost_mp: number;
  cost_fuel: number;
  cost_pop: number;
  health: number;
  armor: number;
  sight_range: number;
  range: number;
  penetration: number;
  dps_n: number;
};

function close(a: number, b: number, tol: number): boolean {
  if (a === b) return true;
  return Math.abs(a - b) <= tol;
}

function factionKey(f: string): string {
  if (f === "british_africa") return "british_africa";
  if (f === "afrika_korps") return "afrika_korps";
  return f;
}

async function loadReference(): Promise<Map<string, RefUnit>> {
  const mappingsPath = pathToFileURL(path.join(COH3_STATS, "src/unitStats/mappings.ts")).href;
  const dpsPath = pathToFileURL(path.join(COH3_STATS, "src/unitStats/dpsCommon.ts")).href;
  const { getMappings } = await import(mappingsPath);
  const { mapCustomizableUnit } = await import(dpsPath);

  const { weaponData, ebpsData, sbpsData } = await getMappings("en");
  const map = new Map<string, RefUnit>();

  for (const sbps of sbpsData) {
    const unit = mapCustomizableUnit(sbps, ebpsData, weaponData);
    if (!unit.screen_name || unit.screen_name === "No text found") continue;
    if (!sbps.ui?.symbolIconName) continue;
    if (sbps.faction === "british") continue;

    const key = `${factionKey(sbps.faction)}/${sbps.unitType}/${sbps.id}`;
    map.set(key, {
      id: sbps.id,
      faction: factionKey(sbps.faction),
      unit_type: sbps.unitType,
      cost_mp: unit.cost_mp,
      cost_fuel: unit.cost_fuel,
      cost_pop: unit.cost_pop,
      health: unit.health,
      armor: unit.armor,
      sight_range: unit.sight_range,
      range: unit.range,
      penetration: unit.penetration,
      dps_n: unit.dps_n,
    });
  }
  return map;
}

type Mismatch = {
  unitKey: string;
  field: string;
  ours: number;
  ref: number;
};

function compare(ours: OurCombat, ref: RefUnit): Mismatch[] {
  const out: Mismatch[] = [];
  const checks: Array<[string, number, number, number]> = [
    ["costMp", ours.costMp, ref.cost_mp, 1],
    ["costFuel", ours.costFuel, ref.cost_fuel, 1],
    ["costPop", ours.costPop, ref.cost_pop, 0],
    ["health", ours.health, ref.health, 1],
    ["armor", ours.armor, ref.armor, 1],
    ["sight", ours.sight, ref.sight_range, 0.5],
    ["range", ours.range, ref.range, 1],
    ["penetration", ours.penetration, ref.penetration, 1],
  ];
  for (const [field, a, b, tol] of checks) {
    if (!close(a, b, tol)) out.push({ unitKey: ref.id, field, ours: a, ref: b });
  }
  return out;
}

async function main() {
  const index = JSON.parse(await readFile(INDEX_PATH, "utf8")) as {
    units: Array<{
      faction: string;
      category: string;
      unitKey: string;
      combat?: OurCombat;
    }>;
  };

  console.log("Loading coh3-stats reference (network)…");
  const refMap = await loadReference();
  console.log(`Reference units: ${refMap.size}`);

  const mismatches: Mismatch[] = [];
  let missingRef = 0;
  let missingCombat = 0;
  let matched = 0;

  for (const u of index.units) {
    const key = `${u.faction}/${u.category}/${u.unitKey}`;
    const ref = refMap.get(key);
    if (!ref) {
      missingRef++;
      continue;
    }
    if (!u.combat) {
      missingCombat++;
      continue;
    }
    matched++;
    mismatches.push(...compare(u.combat, ref));
  }

  const byField = new Map<string, number>();
  for (const m of mismatches) {
    byField.set(m.field, (byField.get(m.field) ?? 0) + 1);
  }

  console.log(`Compared: ${matched}, missing ref: ${missingRef}, missing our combat: ${missingCombat}`);
  console.log("Mismatches by field:", Object.fromEntries(byField));
  console.log(`Total mismatches: ${mismatches.length}`);

  const sample = mismatches.slice(0, 25);
  if (sample.length) {
    console.log("\nSample mismatches:");
    for (const m of sample) {
      console.log(`  ${m.unitKey} ${m.field}: ours=${m.ours} ref=${m.ref}`);
    }
  }

  const suspiciousZeros = index.units.filter((u) => {
    if (!u.combat) return false;
    const key = `${u.faction}/${u.category}/${u.unitKey}`;
    const ref = refMap.get(key);
    if (!ref) return false;
    if (ref.penetration > 0 && u.combat.penetration === 0) return true;
    if (ref.range > 0 && u.combat.range === 0) return true;
    if (ref.health > 0 && u.combat.health === 0) return true;
    if (ref.cost_mp > 0 && u.combat.costMp === 0) return true;
    return false;
  });

  console.log(`\nSuspicious zeros (ref non-zero, ours zero): ${suspiciousZeros.length}`);
  for (const u of suspiciousZeros.slice(0, 15)) {
    const ref = refMap.get(`${u.faction}/${u.category}/${u.unitKey}`)!;
    console.log(`  ${u.unitKey} pen ${u.combat!.penetration}/${ref.penetration} mp ${u.combat!.costMp}/${ref.cost_mp}`);
  }

  if (mismatches.length > 50 || suspiciousZeros.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
