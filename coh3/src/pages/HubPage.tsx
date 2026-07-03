import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FactionEmblem } from "../components/GameImage";
import { MP_COALITIONS } from "../factions";
import { loadUnitsIndex } from "../data";
import { useLocale } from "../i18n/LocaleContext";
import { tCategory, tCoalition, tFaction } from "../i18n/messages";
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
    <section className="panel">
      <div className="panel-head">
        <p className="badge">
          {m.hub.dataTag}: {index.dataTag}
        </p>
        <p className="muted">{m.hub.unitsIndexed(index.units.length)}</p>
      </div>
      <h2>{m.hub.chooseFaction}</h2>

      {MP_COALITIONS.map((coalition) => (
        <section
          key={coalition.id}
          className={`coalition-block coalition-block--${coalition.id}`}
          aria-labelledby={`coalition-${coalition.id}`}
        >
          <h3 id={`coalition-${coalition.id}`} className="coalition-title">
            {tCoalition(locale, coalition.id)}
          </h3>
          <ul className="faction-grid">
            {coalition.factions.map((faction) => {
              const count = index.units.filter((u) => u.faction === faction).length;
              const label = tFaction(locale, faction);
              return (
                <li key={faction}>
                  <Link
                    className="faction-card"
                    to={`/units?faction=${encodeURIComponent(faction)}&category=infantry`}
                  >
                    <FactionEmblem faction={faction} label={label} size="lg" />
                    <span className="faction-card-text">
                      <strong>{label}</strong>
                      <span className="muted">{m.hub.unitsIndexed(count)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

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
