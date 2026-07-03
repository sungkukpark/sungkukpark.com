import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FactionEmblem, UnitPortrait } from "../components/GameImage";
import { MP_COALITIONS } from "../factions";
import { loadUnitsIndex } from "../data";
import { useLocale } from "../i18n/LocaleContext";
import { tCategory, tCoalition, tFaction } from "../i18n/messages";
import { legacyDisplayName, type UnitSummary, type UnitsIndex } from "../types";

export function UnitsListPage() {
  const { locale, m } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const faction = searchParams.get("faction") ?? "";
  const category = searchParams.get("category") ?? "infantry";
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<UnitsIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnitsIndex()
      .then(setIndex)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, []);

  const filtered = useMemo(() => {
    if (!index || !faction) return [] as UnitSummary[];
    const q = query.trim().toLowerCase();
    return index.units
      .filter((u) => {
        if (u.faction !== faction || u.category !== category) return false;
        if (!q) return true;
        const name = legacyDisplayName(u, locale).toLowerCase();
        return name.includes(q) || u.unitKey.toLowerCase().includes(q);
      })
      .sort((a, b) =>
        legacyDisplayName(a, locale).localeCompare(legacyDisplayName(b, locale), locale),
      );
  }, [index, faction, category, query, locale]);

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
    if (!faction) return;
    setSearchParams({ faction, category: c });
  };

  const factionLabel = faction ? tFaction(locale, faction) : "";

  return (
    <section className="panel">
      <div className="panel-head">
        <p className="badge">
          {m.list.dataTag}: {index.dataTag}
        </p>
        {faction && (
          <div className="faction-banner">
            <FactionEmblem faction={faction} label={factionLabel} size="md" />
            <span>{factionLabel}</span>
          </div>
        )}
      </div>

      <h2>{m.list.faction}</h2>
      <div className="faction-picker">
        {MP_COALITIONS.map((coalition) => (
          <div
            key={coalition.id}
            className={`coalition-chips coalition-chips--${coalition.id}`}
          >
            <span className="coalition-chip-label">{tCoalition(locale, coalition.id)}</span>
            <div className="chip-row" role="group" aria-label={tCoalition(locale, coalition.id)}>
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

      {!faction && <p className="empty">{m.list.selectFaction}</p>}

      {faction && (
        <>
          <h2>{m.list.category}</h2>
          <div className="chip-row" role="tablist" aria-label={m.list.category}>
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
            <ul className="unit-card-list">
              {filtered.map((u) => {
                const name = legacyDisplayName(u, locale);
                return (
                  <li key={u.id}>
                    <Link
                      className="unit-card"
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
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
