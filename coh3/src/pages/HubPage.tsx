import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadUnitsIndex } from "../data";
import { CATEGORY_LABELS, FACTION_LABELS, type UnitsIndex } from "../types";

export function HubPage() {
  const [index, setIndex] = useState<UnitsIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnitsIndex()
      .then(setIndex)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, []);

  if (error) {
    return <p className="error">Could not load unit index. Run ingest and rebuild. ({error})</p>;
  }

  if (!index) return <p className="muted">Loading data manifest…</p>;

  return (
    <section>
      <p className="badge">Game data tag: {index.dataTag}</p>
      <p className="muted">{index.units.length} units indexed</p>
      <h2>Choose a faction</h2>
      <ul className="faction-grid">
        {index.factions.map((faction) => {
          const count = index.units.filter((u) => u.faction === faction).length;
          return (
            <li key={faction}>
              <Link
                className="faction-card"
                to={`/units?faction=${encodeURIComponent(faction)}&category=infantry`}
              >
                <strong>{FACTION_LABELS[faction] ?? faction}</strong>
                <span>{count} units</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <h2>Categories</h2>
      <p className="muted">Pick a faction first, then refine by category on the list page.</p>
      <ul className="tag-list">
        {index.categories.map((cat) => (
          <li key={cat}>{CATEGORY_LABELS[cat] ?? cat}</li>
        ))}
      </ul>
    </section>
  );
}
