/**
 * Game art URLs — same CDN layout as coh3-stats (getIconsPathOnCDN).
 * Faction emblems are served from coh3stats.com `/icons/general/` (see coh3-stats public/).
 */
export const COH3_ASSETS_CDN = "https://cdn.coh3stats.com";
export const COH3_STATS_ORIGIN = "https://coh3stats.com";

const FACTION_EMBLEM_PATH: Record<string, string> = {
  afrika_korps: "/icons/general/dak.webp",
  british: "/icons/general/british.webp",
  british_africa: "/icons/general/british.webp",
  american: "/icons/general/american.webp",
  german: "/icons/general/german.webp",
};

/** Faction emblem (coh3-stats getFactionIcon paths on site origin). */
export function factionEmblemUrl(faction: string): string {
  const path = FACTION_EMBLEM_PATH[faction] ?? "/icons/general/infantry_icn.png";
  return `${COH3_STATS_ORIGIN}${path}`;
}

/**
 * Unit / ability icon from game `icon_name` (often `races/...` without prefix).
 */
export function gameIconUrl(iconPath: string | undefined | null): string | null {
  if (!iconPath?.trim()) return null;

  let normalized = iconPath.replace(/\\/g, "/").trim();
  if (!normalized.startsWith("icons/")) {
    normalized = `icons/${normalized}`;
  }
  if (normalized.endsWith(".png")) {
    normalized = normalized.replace(/\.png$/i, ".webp");
  } else if (!/\.(webp|jpg|jpeg|gif)$/i.test(normalized)) {
    normalized += ".webp";
  }

  const urlPath = `/export/${normalized}`.replace(/\/+/g, "/");
  return `${COH3_ASSETS_CDN}${urlPath}`;
}

export function unitPortraitUrl(unit: {
  iconName?: string;
  symbolIconName?: string;
}): string | null {
  return gameIconUrl(unit.iconName) ?? gameIconUrl(unit.symbolIconName);
}
