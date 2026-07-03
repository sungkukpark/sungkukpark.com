import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { loadUnitsIndex } from "../data";
import {
  CATEGORY_LABELS,
  FACTION_LABELS,
  type UnitSummary,
  type UnitsIndex,
} from "../types";

export function UnitsListPage() {
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
    return index.units.filter((u) => {
      if (u.faction !== faction || u.category !== category) return false;
      if (!q) return true;
      return (
        u.displayName.toLowerCase().includes(q) || u.unitKey.toLowerCase().includes(q)
      );
    });
  }, [index, faction, category, query]);

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!index) return <p className="muted">Loading…</p>;

  const setFaction = (f: string) => {
    setSearchParams({ faction: f, category });
  };

  const setCategory = (c: string) => {
    if (!faction) return;
    setSearchParams({ faction, category: c });
  };

  return (
    <section>
      <p className="badge">Data tag: {index.dataTag}</p>

      <h2>Faction</h2>
      <div className="chip-row" role="toolbar" aria-label="Faction">
        {index.factions.map((f) => (
          <button
            key={f}
            type="button"
            className={f === faction ? "chip active" : "chip"}
            onClick={() => setFaction(f)}
          >
            {FACTION_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      {!faction && (
        <p className="empty">Select a faction to browse units.</p>
      )}

      {faction && (
        <>
          <h2>Category</h2>
          <div className="chip-row" role="tablist" aria-label="Category">
            {index.categories.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={c === category}
                className={c === category ? "chip active" : "chip"}
                onClick={() => setCategory(c)}
              >
                {CATEGORY_LABELS[c] ?? c}
              </button>
            ))}
          </div>

          <label className="search">
            <span className="sr-only">Search units</span>
            <input
              type="search"
              placeholder="Search name or id…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <p className="muted">
            {filtered.length} unit{filtered.length === 1 ? "" : "s"}
          </p>

          {filtered.length === 0 ? (
            <p className="empty">No units in this category.</p>
          ) : (
            <ul className="unit-list">
              {filtered.map((u) => (
                <li key={u.id}>
                  <Link
                    to={`/units/${u.faction}/${u.category}/${encodeURIComponent(u.unitKey)}`}
                  >
                    {u.displayName}
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
