import type { Locale } from "./locale";
import { STAT_KEYS, type StatKey } from "../stats";

const en = {
  lang: {
    en: "English",
    ko: "한국어",
    label: "Language",
  },
  layout: {
    hubLink: "COH3 analysis hub",
    title: "Unit reference",
    lede: "Multiplayer unit specs for strategy and analysis. Patch-pinned open data from COH3 Stats.",
    footerAttribution: "Unit data from",
    footerDisclaimer: "Not affiliated with Relic or SEGA.",
    footerIcons: "Icons from COH3 Stats (coh3stats.com / cdn.coh3stats.com).",
  },
  hub: {
    dataTag: "Game data tag",
    unitsIndexed: (n: number) => `${n} units indexed`,
    chooseFaction: "Choose a faction",
    categoriesTitle: "Categories",
    categoriesHint: "Pick a faction first, then refine by category on the list page.",
    loadIndexError: "Could not load unit index. Run ingest and rebuild.",
    loading: "Loading data manifest…",
  },
  list: {
    dataTag: "Data tag",
    faction: "Faction",
    category: "Category",
    searchPlaceholder: "Search name or id…",
    searchAria: "Search units",
    unitCount: (n: number) => `${n} unit${n === 1 ? "" : "s"}`,
    selectFaction: "Select a faction to browse units.",
    noUnits: "No units in this category.",
    loading: "Loading…",
    loadError: "Failed to load data.",
    compareTitle: "Compare in this list",
    sortBy: "Sort by",
    filterMin: "Minimum",
    statRange: "Range",
    statPenetration: "Penetration",
    statDamage: "Damage",
    compareMore: (n: number) => `+ ${n} more in list below`,
  },
  detail: {
    hub: "Hub",
    showRaw: "Show raw JSON",
    field: "Field",
    value: "Value",
    loading: "Loading unit…",
    invalidUrl: "Invalid unit URL.",
    loadError: "Failed to load unit.",
    backToList: "Back to list",
    noSections: "No extension sections parsed. Use raw JSON.",
    dataTag: "Data tag",
    combatTitle: "Combat stats (vs category max)",
  },
  faction: {
    american: "US Forces",
    german: "Wehrmacht",
    british_africa: "British Forces",
    afrika_korps: "Afrika Korps",
  },
  category: {
    infantry: "Infantry",
    vehicles: "Vehicles",
    team_weapons: "Team weapons",
    emplacements: "Emplacements",
    aircraft: "Aircraft",
  },
  coalition: {
    allies: "Allies",
    axis: "Axis",
  },
  stats: {
    costMp: "Manpower",
    costPop: "Population",
    health: "Health",
    range: "Range",
    penetration: "Penetration",
    damage: "Damage",
    dps: "DPS (est.)",
    armor: "Armor",
    sight: "Sight",
  },
} as const;

const ko: typeof en = {
  lang: {
    en: "English",
    ko: "한국어",
    label: "언어",
  },
  layout: {
    hubLink: "COH3 분석 허브",
    title: "유닛 레퍼런스",
    lede: "멀티플레이 기준 유닛 스펙. COH3 Stats 오픈 데이터를 패치 단위로 고정해 표시합니다.",
    footerAttribution: "유닛 데이터 출처:",
    footerDisclaimer: "Relic·SEGA와 무관한 팬 프로젝트입니다.",
    footerIcons: "아이콘: COH3 Stats (coh3stats.com / cdn.coh3stats.com).",
  },
  hub: {
    dataTag: "게임 데이터 태그",
    unitsIndexed: (n: number) => `유닛 ${n}개 색인됨`,
    chooseFaction: "진영 선택",
    categoriesTitle: "카테고리",
    categoriesHint: "먼저 진영을 고른 뒤, 목록 페이지에서 카테고리를 바꿀 수 있습니다.",
    loadIndexError: "유닛 목록을 불러오지 못했습니다. ingest 후 다시 빌드하세요.",
    loading: "데이터 불러오는 중…",
  },
  list: {
    dataTag: "데이터 태그",
    faction: "진영",
    category: "카테고리",
    searchPlaceholder: "이름 또는 ID 검색…",
    searchAria: "유닛 검색",
    unitCount: (n: number) => `유닛 ${n}개`,
    selectFaction: "유닛을 보려면 진영을 선택하세요.",
    noUnits: "이 카테고리에 유닛이 없습니다.",
    loading: "불러오는 중…",
    loadError: "데이터를 불러오지 못했습니다.",
    compareTitle: "목록 내 비교",
    sortBy: "정렬",
    filterMin: "최소",
    statRange: "사거리",
    statPenetration: "관통",
    statDamage: "피해",
    compareMore: (n: number) => `아래 목록에 ${n}개 더`,
  },
  detail: {
    hub: "허브",
    showRaw: "원본 JSON 보기",
    field: "필드",
    value: "값",
    loading: "유닛 불러오는 중…",
    invalidUrl: "잘못된 유닛 URL입니다.",
    loadError: "유닛을 불러오지 못했습니다.",
    backToList: "목록으로",
    noSections: "파싱된 확장 섹션이 없습니다. 원본 JSON을 사용하세요.",
    dataTag: "데이터 태그",
    combatTitle: "전투 스탯 (카테고리 최대 대비)",
  },
  faction: {
    american: "미군",
    german: "독일군",
    british_africa: "영국군",
    afrika_korps: "아프리카 군단",
  },
  category: {
    infantry: "보병",
    vehicles: "차량",
    team_weapons: "팀 무기",
    emplacements: "거점화기",
    aircraft: "항공",
  },
  coalition: {
    allies: "연합국",
    axis: "추축국",
  },
  stats: {
    costMp: "인력",
    costPop: "인구",
    health: "체력",
    range: "사거리",
    penetration: "관통",
    damage: "피해",
    dps: "DPS (추정)",
    armor: "장갑",
    sight: "시야",
  },
} as const;

export const messages: Record<Locale, typeof en> = { en, ko };

export type Messages = typeof en;

export { STAT_KEYS, type StatKey };

export function tFaction(locale: Locale, faction: string): string {
  const map = messages[locale].faction as Record<string, string>;
  return map[faction] ?? faction;
}

export function tCategory(locale: Locale, category: string): string {
  const map = messages[locale].category as Record<string, string>;
  return map[category] ?? category;
}

export function tCoalition(locale: Locale, id: "allies" | "axis"): string {
  return messages[locale].coalition[id];
}

export function tStat(locale: Locale, key: StatKey): string {
  return messages[locale].stats[key];
}
