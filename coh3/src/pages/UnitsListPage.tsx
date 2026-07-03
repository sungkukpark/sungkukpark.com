import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FactionEmblem, UnitPortrait } from "../components/GameImage";
import { StatBar } from "../components/StatBar";
import { MP_COALITIONS } from "../factions";
import {
  CATEGORY_ALL,
  FACTION_ALL,
  isCoalitionFactionFilter,
  normalizeCategoryParam,
  normalizeFactionParam,
  unitMatchesCategory,
  unitMatchesFaction,
} from "../filters";
import { loadUnitsIndex } from "../data";
import { useLocale } from "../i18n/LocaleContext";
import { STAT_KEYS, formatStatDisplay, maxStatInUnits, statValue, type StatKey } from "../stats";
import { tCategory, tCoalition, tFaction, tStat } from "../i18n/messages";
import { legacyDisplayName, type UnitSummary, type UnitsIndex } from "../types";

const COMPARE_KEYS: StatKey[] = ["damage", "penetration", "range", "dps", "health", "costMp", "costPop"];

export function UnitsListPage() {
  const { locale, m } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const faction = normalizeFactionParam(searchParams.get("faction"));
  const category = normalizeCategoryParam(searchParams.get("category"));
  const [query, setQuery] = useState("");
  const [sortStat, setSortStat] = useState<StatKey>("damage");
  const [compareStat, setCompareStat] = useState<StatKey>("damage");
  const [index, setIndex] = useState<UnitsIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnitsIndex()
      .then(setIndex)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, []);

  const categoryPool = useMemo(() => {
    if (!index) return [] as UnitSummary[];
    return index.units.filter(
      (u) => unitMatchesFaction(u.faction, faction) && unitMatchesCategory(u.category, category),
    );
  }, [index, faction, category]);

  const maxByCompareKey = useMemo(() => {
    const out: Partial<Record<StatKey, number>> = {};
    for (const key of COMPARE_KEYS) {
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
        if (bv !== av) return bv - av;
        return legacyDisplayName(a, locale).localeCompare(legacyDisplayName(b, locale), locale);
      });
  }, [categoryPool, query, locale, sortStat]);

  const compareMax = maxByCompareKey[compareStat] ?? 1;

  if (error) {
    return (
      <p className="error">
        {m.list.loadError} ({error})
      </p>
    );
  }

  if (!index) return <p className="muted">{m.list.loading}</p>;

  const setFaction = (f: string) => {
    setSearchParams({ faction: f, category });
  };

  const setCategory = (c: string) => {
    setSearchParams({ faction, category: c });
  };

  const factionLabel = isCoalitionFactionFilter(faction)
    ? tCoalition(locale, faction)
    : faction === FACTION_ALL
      ? m.list.allFactionsLabel
      : tFaction(locale, faction);

  const showFactionEmblem =
    faction !== FACTION_ALL && !isCoalitionFactionFilter(faction);

  return (
    <section className="panel">
      <div className="panel-head">
        <p className="badge">
          {m.list.dataTag}: {index.dataTag}
        </p>
        {faction !== FACTION_ALL && (
          <div className="faction-banner">
            {showFactionEmblem && (
              <FactionEmblem faction={faction} label={factionLabel} size="md" />
            )}
            <span>{factionLabel}</span>
          </div>
        )}
      </div>

      <h2>{m.list.faction}</h2>
      <div className="chip-row chip-row--faction-all" role="group" aria-label={m.list.faction}>
        <button
          type="button"
          className={faction === FACTION_ALL ? "chip active" : "chip"}
          onClick={() => setFaction(FACTION_ALL)}
        >
          {m.list.factionAll}
        </button>
      </div>
      <div className="faction-picker">
        {MP_COALITIONS.map((coalition) => (
          <div
            key={coalition.id}
            className={`coalition-chips coalition-chips--${coalition.id}`}
          >
            <span className="coalition-chip-label">{tCoalition(locale, coalition.id)}</span>
            <div className="chip-row" role="group" aria-label={tCoalition(locale, coalition.id)}>
              <button
                type="button"
                className={faction === coalition.id ? "chip active" : "chip"}
                onClick={() => setFaction(coalition.id)}
              >
                {tCoalition(locale, coalition.id)}
              </button>
              {coalition.factions.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={f === faction ? "chip active" : "chip"}
                  onClick={() => setFaction(f)}
                >
                  {tFaction(locale, f)}
                </button>
              ))}
            </div>
          </div>
        ))}
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
            {STAT_KEYS.map((k) => (
              <option key={k} value={k}>
                {tStat(locale, k)}
              </option>
            ))}
          </select>
        </label>
        <label className="stat-control">
          <span>{m.list.compareTitle}</span>
          <select
            value={compareStat}
            onChange={(e) => setCompareStat(e.target.value as StatKey)}
          >
            {COMPARE_KEYS.map((k) => (
              <option key={k} value={k}>
                {tStat(locale, k)}
              </option>
            ))}
          </select>
        </label>
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

      {filtered.length === 0 ? (
        <p className="empty">{m.list.noUnits}</p>
      ) : (
        <>
          <section className="compare-panel" aria-label={m.list.compareTitle}>
            <h3>{m.list.compareTitle}</h3>
            <p className="muted compare-hint">
              {tStat(locale, compareStat)} · max {Math.round(compareMax * 10) / 10}
            </p>
            <ul className="compare-list">
              {filtered.slice(0, 24).map((u) => {
                const name = legacyDisplayName(u, locale);
                const val = u.combat ? statValue(u.combat, compareStat) : 0;
                return (
                  <li key={u.id} className="compare-row">
                    <Link
                      className="compare-row-link"
                      to={`/units/${u.faction}/${u.category}/${encodeURIComponent(u.unitKey)}`}
                    >
                      <UnitPortrait
                        iconName={u.iconName}
                        symbolIconName={u.symbolIconName}
                        alt=""
                        size="sm"
                      />
                      <span className="compare-row-name">{name}</span>
                    </Link>
                        <StatBar
                          size="md"
                          statKey={compareStat}
                          value={val}
                          max={compareMax}
                          format={(v) => formatStatDisplay(compareStat, v)}
                        />
                  </li>
                );
              })}
            </ul>
            {filtered.length > 24 && (
              <p className="muted">{m.list.compareMore(filtered.length - 24)}</p>
            )}
          </section>

          <ul className="unit-card-list">
            {filtered.map((u) => {
              const name = legacyDisplayName(u, locale);
              const val = u.combat ? statValue(u.combat, compareStat) : 0;
              return (
                <li key={u.id}>
                  <Link
                    className="unit-card unit-card--with-stat"
                    to={`/units/${u.faction}/${u.category}/${encodeURIComponent(u.unitKey)}`}
                  >
                    <UnitPortrait
                      iconName={u.iconName}
                      symbolIconName={u.symbolIconName}
                      alt=""
                      size="sm"
                    />
                    <span className="unit-card-body">
                      <span className="unit-card-title">{name}</span>
                      <span className="mono">{u.unitKey}</span>
                      {u.combat && (
                            <StatBar
                              size="sm"
                              statKey={compareStat}
                              label={tStat(locale, compareStat)}
                              value={val}
                              max={compareMax}
                              format={(v) => formatStatDisplay(compareStat, v)}
                              showShare={false}
                            />
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
