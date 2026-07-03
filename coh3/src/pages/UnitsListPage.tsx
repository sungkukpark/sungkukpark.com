import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FactionEmblem, UnitPortrait } from "../components/GameImage";
import { StatBar } from "../components/StatBar";
import { MP_COALITIONS } from "../factions";
import {
  CATEGORY_ALL,
  coalitionFullySelected,
  coalitionPartiallySelected,
  isAllFactionsSelected,
  isFactionSelected,
  parseFactionsParam,
  parseSortOrderParam,
  serializeFactionsParam,
  toggleCoalitionInSelection,
  toggleFactionInSelection,
  type FactionSelection,
  type SortOrder,
  normalizeCategoryParam,
  unitMatchesCategory,
  unitMatchesFactions,
} from "../filters";
import { loadUnitsIndex } from "../data";
import { useLocale } from "../i18n/LocaleContext";
import { formatStatDisplay, maxStatInUnits, statValue, type StatKey } from "../stats";
import { tCategory, tCoalition, tFaction, tStat } from "../i18n/messages";
import { legacyDisplayName, type UnitSummary, type UnitsIndex } from "../types";

const STAT_CONTROL_KEYS: StatKey[] = [
  "damage",
  "penetration",
  "range",
  "dps",
  "health",
  "costMp",
  "costPop",
];

export function UnitsListPage() {
  const { locale, m } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const factionSelection = parseFactionsParam(searchParams.get("faction"));
  const category = normalizeCategoryParam(searchParams.get("category"));
  const sortOrder = parseSortOrderParam(searchParams.get("order"));
  const [query, setQuery] = useState("");
  const [sortStat, setSortStat] = useState<StatKey>("damage");
  const [index, setIndex] = useState<UnitsIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnitsIndex()
      .then(setIndex)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, []);

  const updateListParams = (patch: {
    factions?: FactionSelection;
    category?: string;
    order?: SortOrder;
  }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const factions = patch.factions !== undefined ? patch.factions : factionSelection;
      const cat = patch.category ?? category;
      const order = patch.order ?? sortOrder;
      next.set("faction", serializeFactionsParam(factions));
      next.set("category", cat);
      if (order === "desc") next.delete("order");
      else next.set("order", order);
      return next;
    });
  };

  const categoryPool = useMemo(() => {
    if (!index) return [] as UnitSummary[];
    return index.units.filter(
      (u) =>
        unitMatchesFactions(u.faction, factionSelection) &&
        unitMatchesCategory(u.category, category),
    );
  }, [index, factionSelection, category]);

  const maxByCompareKey = useMemo(() => {
    const out: Partial<Record<StatKey, number>> = {};
    for (const key of STAT_CONTROL_KEYS) {
      out[key] = maxStatInUnits(categoryPool, key);
    }
    return out;
  }, [categoryPool]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return categoryPool
      .filter((u) => {
        if (!q) return true;
        const name = legacyDisplayName(u, locale).toLowerCase();
        if (!name.includes(q) && !u.unitKey.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a.combat ? statValue(a.combat, sortStat) : -1;
        const bv = b.combat ? statValue(b.combat, sortStat) : -1;
        if (bv !== av) return sortOrder === "desc" ? bv - av : av - bv;
        return legacyDisplayName(a, locale).localeCompare(legacyDisplayName(b, locale), locale);
      });
  }, [categoryPool, query, locale, sortStat, sortOrder]);

  const compareMax = maxByCompareKey[sortStat] ?? 1;

  if (error) {
    return (
      <p className="error">
        {m.list.loadError} ({error})
      </p>
    );
  }

  if (!index) return <p className="muted">{m.list.loading}</p>;

  const setCategory = (c: string) => {
    updateListParams({ category: c });
  };

  const selectedFactionCount =
    factionSelection === null ? MP_COALITIONS.flatMap((c) => c.factions).length : factionSelection.length;

  const singleSelectedFaction =
    factionSelection !== null && factionSelection.length === 1 ? factionSelection[0] : null;

  const showFactionOnUnitCards = selectedFactionCount > 1;

  const emptyBecauseNoFactions =
    factionSelection !== null && factionSelection.length === 0;

  return (
    <section className="panel">
      <div className="panel-head">
        <p className="badge">
          {m.list.dataTag}: {index.dataTag}
        </p>
        {singleSelectedFaction && (
          <div className="faction-banner">
            <FactionEmblem
              faction={singleSelectedFaction}
              label={tFaction(locale, singleSelectedFaction)}
              size="md"
            />
            <span>{tFaction(locale, singleSelectedFaction)}</span>
          </div>
        )}
        {!isAllFactionsSelected(factionSelection) && !singleSelectedFaction && selectedFactionCount > 0 && (
          <div className="faction-banner faction-banner--multi">
            <span>{m.list.factionSelectionCount(selectedFactionCount)}</span>
          </div>
        )}
      </div>

      <h2>{m.list.faction}</h2>
      <div className="chip-row chip-row--faction-all" role="group" aria-label={m.list.faction}>
        <button
          type="button"
          className={isAllFactionsSelected(factionSelection) ? "chip active" : "chip"}
          aria-pressed={isAllFactionsSelected(factionSelection)}
          onClick={() => updateListParams({ factions: null })}
        >
          {m.list.factionAll}
        </button>
      </div>
      <div className="faction-picker">
        {MP_COALITIONS.map((coalition) => {
          const coalitionOn = coalitionFullySelected(factionSelection, coalition.id);
          const coalitionPartial = coalitionPartiallySelected(factionSelection, coalition.id);
          return (
            <div
              key={coalition.id}
              className={`coalition-chips coalition-chips--${coalition.id}`}
            >
              <button
                type="button"
                className={[
                  "coalition-chip-label",
                  "coalition-chip-label--select",
                  coalitionOn ? "active" : "",
                  coalitionPartial ? "partial" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={coalitionOn}
                onClick={() =>
                  updateListParams({
                    factions: toggleCoalitionInSelection(factionSelection, coalition.id),
                  })
                }
              >
                {tCoalition(locale, coalition.id)}
              </button>
              <div className="chip-row" role="group" aria-label={tCoalition(locale, coalition.id)}>
                {coalition.factions.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={isFactionSelected(factionSelection, f) ? "chip active" : "chip"}
                    aria-pressed={isFactionSelected(factionSelection, f)}
                    onClick={() =>
                      updateListParams({
                        factions: toggleFactionInSelection(factionSelection, f),
                      })
                    }
                  >
                    {tFaction(locale, f)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <h2>{m.list.category}</h2>
      <div className="chip-row" role="tablist" aria-label={m.list.category}>
        <button
          type="button"
          role="tab"
          aria-selected={category === CATEGORY_ALL}
          className={category === CATEGORY_ALL ? "chip active" : "chip"}
          onClick={() => setCategory(CATEGORY_ALL)}
        >
          {m.list.categoryAll}
        </button>
        {index.categories.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={c === category}
            className={c === category ? "chip active" : "chip"}
            onClick={() => setCategory(c)}
          >
            {tCategory(locale, c)}
          </button>
        ))}
      </div>

      <div className="stat-controls">
        <label className="stat-control">
          <span>{m.list.sortBy}</span>
          <select value={sortStat} onChange={(e) => setSortStat(e.target.value as StatKey)}>
            {STAT_CONTROL_KEYS.map((k) => (
              <option key={k} value={k}>
                {tStat(locale, k)}
              </option>
            ))}
          </select>
        </label>
        <label className="stat-control">
          <span>{m.list.sortOrder}</span>
          <select
            value={sortOrder}
            onChange={(e) => updateListParams({ order: e.target.value as SortOrder })}
          >
            <option value="desc">{m.list.sortDesc}</option>
            <option value="asc">{m.list.sortAsc}</option>
          </select>
        </label>
        <p className="muted stat-control-hint">{m.list.sortByHint}</p>
      </div>

      <label className="search">
        <span className="sr-only">{m.list.searchAria}</span>
        <input
          type="search"
          placeholder={m.list.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <p className="muted">{m.list.unitCount(filtered.length)}</p>

      {emptyBecauseNoFactions ? (
        <p className="empty">{m.list.noFactionsSelected}</p>
      ) : filtered.length === 0 ? (
        <p className="empty">{m.list.noUnits}</p>
      ) : (
        <ul className="unit-card-list unit-card-list--compare">
          {filtered.map((u) => {
            const name = legacyDisplayName(u, locale);
            const val = u.combat ? statValue(u.combat, sortStat) : 0;
            return (
              <li key={u.id}>
                <Link
                  className="unit-card unit-card--with-stat"
                  to={`/units/${u.faction}/${u.category}/${encodeURIComponent(u.unitKey)}`}
                >
                  <div className="unit-card-media">
                    <UnitPortrait
                      iconName={u.iconName}
                      symbolIconName={u.symbolIconName}
                      alt=""
                      size="sm"
                    />
                    {showFactionOnUnitCards && (
                      <FactionEmblem
                        faction={u.faction}
                        label={tFaction(locale, u.faction)}
                        size="sm"
                      />
                    )}
                  </div>
                  <span className="unit-card-body">
                    <span className="unit-card-title">{name}</span>
                    <span className="mono">{u.unitKey}</span>
                    {u.combat && (
                      <StatBar
                        size="sm"
                        statKey={sortStat}
                        value={val}
                        max={compareMax}
                        format={(v) => formatStatDisplay(sortStat, v)}
                        showShare
                      />
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
