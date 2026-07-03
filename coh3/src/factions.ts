/** Multiplayer factions grouped by CoH3 coalition (display order). */
export const MP_COALITIONS = [
  {
    id: "allies" as const,
    factions: ["american", "british_africa"] as const,
  },
  {
    id: "axis" as const,
    factions: ["german", "afrika_korps"] as const,
  },
] as const;

export type CoalitionId = (typeof MP_COALITIONS)[number]["id"];

export const MP_FACTION_ORDER = MP_COALITIONS.flatMap((c) => [...c.factions]);

export function coalitionForFaction(faction: string): CoalitionId | undefined {
  for (const c of MP_COALITIONS) {
    if ((c.factions as readonly string[]).includes(faction)) return c.id;
  }
  return undefined;
}
