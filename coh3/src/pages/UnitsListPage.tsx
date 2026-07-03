import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { loadUnitsIndex } from "../data";
import { useLocale } from "../i18n/LocaleContext";
import { tCategory, tFaction } from "../i18n/messages";
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

  return (
    <section>
      <p className="badge">
        {m.list.dataTag}: {index.dataTag}
      </p>

      <h2>{m.list.faction}</h2>
      <div className="chip-row" role="toolbar" aria-label={m.list.faction}>
        {index.factions.map((f) => (
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
            <ul className="unit-list">
              {filtered.map((u) => (
                <li key={u.id}>
                  <Link
                    to={`/units/${u.faction}/${u.category}/${encodeURIComponent(u.unitKey)}`}
                  >
                    {legacyDisplayName(u, locale)}
                  </Link>
                  <span className="mono">{u.unitKey}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
