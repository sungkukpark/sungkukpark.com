import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadUnitsIndex } from "../data";
import { useLocale } from "../i18n/LocaleContext";
import { tCategory, tFaction } from "../i18n/messages";
import { type UnitsIndex } from "../types";

export function HubPage() {
  const { locale, m } = useLocale();
  const [index, setIndex] = useState<UnitsIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnitsIndex()
      .then(setIndex)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, []);

  if (error) {
    return (
      <p className="error">
        {m.hub.loadIndexError} ({error})
      </p>
    );
  }

  if (!index) return <p className="muted">{m.hub.loading}</p>;

  return (
    <section>
      <p className="badge">
        {m.hub.dataTag}: {index.dataTag}
      </p>
      <p className="muted">{m.hub.unitsIndexed(index.units.length)}</p>
      <h2>{m.hub.chooseFaction}</h2>
      <ul className="faction-grid">
        {index.factions.map((faction) => {
          const count = index.units.filter((u) => u.faction === faction).length;
          return (
            <li key={faction}>
              <Link
                className="faction-card"
                to={`/units?faction=${encodeURIComponent(faction)}&category=infantry`}
              >
                <strong>{tFaction(locale, faction)}</strong>
                <span>{m.hub.unitsIndexed(count)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <h2>{m.hub.categoriesTitle}</h2>
      <p className="muted">{m.hub.categoriesHint}</p>
      <ul className="tag-list">
        {index.categories.map((cat) => (
          <li key={cat}>{tCategory(locale, cat)}</li>
        ))}
      </ul>
    </section>
  );
}
