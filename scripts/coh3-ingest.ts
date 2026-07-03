/**
 * Download coh3-data from CDN, normalize units, write coh3/public/data/* and manifest.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_TAG_PATH = path.join(ROOT, "coh3", "data-tag.json");
const OUT_DATA = path.join(ROOT, "coh3", "public", "data");
const OUT_GENERATED = path.join(ROOT, "coh3", ".generated");

const CDN_BASE = "https://data.coh3stats.com/cohstats/coh3-data";

const INGEST_LOCALES = ["en", "ko"] as const;
type IngestLocale = (typeof INGEST_LOCALES)[number];

/** Multiplayer-playable races in coh3-data (matches coh3-stats unit browser). */
const PLAYER_FACTIONS = [
  "american",
  "german",
  "british_africa",
  "afrika_korps",
] as const;

const CATEGORIES = [
  "infantry",
  "vehicles",
  "team_weapons",
  "emplacements",
  "aircraft",
] as const;

type Faction = (typeof PLAYER_FACTIONS)[number];
type Category = (typeof CATEGORIES)[number];

type LocalizedString = { en: string; ko: string };

export type UnitSummary = {
  id: string;
  faction: Faction;
  category: Category;
  unitKey: string;
  displayNames: LocalizedString;
  iconName?: string;
  symbolIconName?: string;
  pbgid?: number;
};

export type SpecRow = { key: string; value: string };
export type SpecSection = { title: string; rows: SpecRow[] };

export type UnitLocaleBundle = {
  displayName: string;
  sections: SpecSection[];
};

export type UnitDetail = {
  id: string;
  faction: Faction;
  category: Category;
  unitKey: string;
  dataTag: string;
  iconName?: string;
  symbolIconName?: string;
  localized: Record<IngestLocale, UnitLocaleBundle>;
  raw: unknown;
};

type Manifest = {
  dataTag: string;
  ingestedAt: string;
  locales: IngestLocale[];
  files: Record<string, { bytes: number; sha256: string }>;
  unitCount: number;
  warnings: string[];
};

function cdnUrl(dataTag: string, dataFile: string): string {
  return `${CDN_BASE}/${dataTag}/data/${dataFile}`;
}

async function fetchJson<T>(url: string): Promise<{ data: T; bytes: number; sha256: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const data = JSON.parse(buf.toString("utf8")) as T;
  return { data, bytes: buf.length, sha256 };
}

type LocstringMap = Record<string, string>;

function resolveLocstring(val: unknown, loc: LocstringMap): string | null {
  if (val == null) return null;
  if (typeof val === "object" && val !== null && "locstring" in val) {
    const inner = (val as { locstring?: { value?: string | number } }).locstring?.value;
    if (inner == null) return null;
    return loc[String(inner)] ?? null;
  }
  return null;
}

function formatValue(val: unknown, loc: LocstringMap, depth = 0): string {
  if (val == null) return "";
  const fromLoc = resolveLocstring(val, loc);
  if (fromLoc != null) return fromLoc;
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  if (depth > 4) return "[object]";
  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    return val.map((v) => formatValue(v, loc, depth + 1)).join("; ");
  }
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    if ("instance_reference" in o && typeof o.instance_reference === "string") {
      return o.instance_reference;
    }
    if ("template_reference" in o) {
      const tr = o.template_reference as { value?: string };
      const rest = { ...o };
      delete rest.template_reference;
      const tail = formatValue(rest, loc, depth + 1);
      return tail ? `${tr.value ?? "?"} (${tail})` : (tr.value ?? "[template]");
    }
    const parts = Object.entries(o)
      .filter(([, v]) => v !== "" && v != null)
      .slice(0, 12)
      .map(([k, v]) => `${k}: ${formatValue(v, loc, depth + 1)}`);
    return parts.join(", ") || "[object]";
  }
  return String(val);
}

function extractUiIcons(unit: unknown): { iconName: string; symbolIconName: string } {
  let iconName = "";
  let symbolIconName = "";
  const root = unit as { extensions?: Array<{ squadexts?: Record<string, unknown> }> };
  if (!root.extensions) return { iconName, symbolIconName };

  for (const ext of root.extensions) {
    const sx = ext.squadexts;
    if (!sx) continue;
    const ref = sx.template_reference as { value?: string } | undefined;
    if (!ref?.value?.includes("squad_ui_ext")) continue;
    const raceList = sx.race_list as Array<{
      race_data?: { info?: { icon_name?: string; symbol_icon_name?: string } };
    }>;
    const info = raceList?.[0]?.race_data?.info;
    iconName = info?.icon_name?.trim() ?? "";
    symbolIconName = info?.symbol_icon_name?.trim() ?? "";
    break;
  }
  return { iconName, symbolIconName };
}

function extractDisplayName(unit: unknown, loc: LocstringMap, unitKey: string): string {
  const root = unit as { extensions?: Array<{ squadexts?: Record<string, unknown> }> };
  if (!root.extensions) return unitKey;
  for (const ext of root.extensions) {
    const sx = ext.squadexts;
    if (!sx) continue;
    const ref = sx.template_reference as { value?: string } | undefined;
    if (!ref?.value?.includes("squad_ui_ext")) continue;
    const raceList = sx.race_list as Array<{ race_data?: { info?: { screen_name?: unknown } } }>;
    const screen = raceList?.[0]?.race_data?.info?.screen_name;
    const name = resolveLocstring(screen, loc);
    if (name) return name;
  }
  return unitKey;
}

function walkExtensions(unit: unknown, loc: LocstringMap): SpecSection[] {
  const sections: SpecSection[] = [];
  const root = unit as {
    extensions?: Array<{ exts?: Record<string, unknown>; squadexts?: Record<string, unknown> }>;
  };
  if (!root.extensions?.length) return sections;

  for (const ext of root.extensions) {
    const bag = ext.squadexts ?? ext.exts;
    if (!bag) continue;
    const ref = bag.template_reference as { value?: string } | undefined;
    const title = ref?.value?.split("\\").pop() ?? "extension";
    const rows: SpecRow[] = [];
    for (const [key, val] of Object.entries(bag)) {
      if (key === "template_reference") continue;
      rows.push({ key, value: formatValue(val, loc) });
    }
    if (rows.length) sections.push({ title, rows });
  }
  return sections;
}

function unitId(faction: Faction, category: Category, unitKey: string): string {
  return `${faction}/${category}/${unitKey}`;
}

async function loadLocaleMaps(
  dataTag: string,
  record: (name: string, bytes: number, sha256: string) => void,
): Promise<Record<IngestLocale, LocstringMap>> {
  const maps = {} as Record<IngestLocale, LocstringMap>;
  for (const locale of INGEST_LOCALES) {
    const file = `locales/${locale}-locstring.json`;
    const { data, bytes, sha256 } = await fetchJson<LocstringMap>(cdnUrl(dataTag, file));
    record(file, bytes, sha256);
    maps[locale] = data;
  }
  return maps;
}

async function main() {
  const tagConfig = JSON.parse(await readFile(DATA_TAG_PATH, "utf8")) as { dataTag: string };
  const { dataTag } = tagConfig;
  const warnings: string[] = [];
  const manifestFiles: Manifest["files"] = {};

  const record = (name: string, bytes: number, sha256: string) => {
    manifestFiles[name] = { bytes, sha256 };
  };

  const locByLocale = await loadLocaleMaps(dataTag, record);

  const summaries: UnitSummary[] = [];

  await rm(OUT_DATA, { recursive: true, force: true });
  await mkdir(path.join(OUT_DATA, "units"), { recursive: true });
  await mkdir(OUT_GENERATED, { recursive: true });

  for (const faction of PLAYER_FACTIONS) {
    const file = `chunked/sbps/races/${faction}.json`;
    const url = cdnUrl(dataTag, file);
    const { data: raceData, bytes, sha256 } = await fetchJson<Record<string, Record<string, unknown>>>(
      url,
    );
    record(file, bytes, sha256);

    for (const category of CATEGORIES) {
      const bucket = raceData[category];
      if (!bucket || typeof bucket !== "object") continue;

      for (const unitKey of Object.keys(bucket)) {
        const raw = bucket[unitKey];
        if (!raw || typeof raw !== "object") continue;

        const displayNames: LocalizedString = {
          en: extractDisplayName(raw, locByLocale.en, unitKey),
          ko: extractDisplayName(raw, locByLocale.ko, unitKey),
        };

        if (displayNames.en === unitKey) {
          warnings.push(`missing displayName (en): ${faction}/${category}/${unitKey}`);
        }
        if (displayNames.ko === unitKey) {
          warnings.push(`missing displayName (ko): ${faction}/${category}/${unitKey}`);
        }

        const id = unitId(faction, category, unitKey);
        const pbgid = (raw as { pbgid?: number }).pbgid;
        const { iconName, symbolIconName } = extractUiIcons(raw);

        summaries.push({
          id,
          faction,
          category,
          unitKey,
          displayNames,
          ...(iconName ? { iconName } : {}),
          ...(symbolIconName ? { symbolIconName } : {}),
          ...(pbgid != null ? { pbgid } : {}),
        });

        const localized = {} as Record<IngestLocale, UnitLocaleBundle>;
        for (const locale of INGEST_LOCALES) {
          localized[locale] = {
            displayName: displayNames[locale],
            sections: walkExtensions(raw, locByLocale[locale]),
          };
        }

        const detail: UnitDetail = {
          id,
          faction,
          category,
          unitKey,
          dataTag,
          ...(iconName ? { iconName } : {}),
          ...(symbolIconName ? { symbolIconName } : {}),
          localized,
          raw,
        };

        const shardPath = path.join(OUT_DATA, "units", `${faction}`, `${category}`);
        await mkdir(shardPath, { recursive: true });
        await writeFile(
          path.join(shardPath, `${unitKey}.json`),
          JSON.stringify(detail),
          "utf8",
        );
      }
    }
  }

  summaries.sort((a, b) => a.displayNames.en.localeCompare(b.displayNames.en));

  const index = {
    dataTag,
    generatedAt: new Date().toISOString(),
    locales: [...INGEST_LOCALES],
    factions: PLAYER_FACTIONS,
    categories: CATEGORIES,
    units: summaries,
  };

  await writeFile(path.join(OUT_DATA, "units.index.json"), JSON.stringify(index, null, 0), "utf8");

  const manifest: Manifest = {
    dataTag,
    ingestedAt: new Date().toISOString(),
    locales: [...INGEST_LOCALES],
    files: manifestFiles,
    unitCount: summaries.length,
    warnings,
  };

  await writeFile(
    path.join(OUT_GENERATED, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log(
    `coh3 ingest: ${summaries.length} units, locales=${INGEST_LOCALES.join(",")}, dataTag=${dataTag}`,
  );
  if (warnings.length) {
    console.warn(`warnings: ${warnings.length} (see coh3/.generated/manifest.json)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
