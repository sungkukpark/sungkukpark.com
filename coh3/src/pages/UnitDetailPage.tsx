import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FactionEmblem, UnitPortrait } from "../components/GameImage";
import { StatBarGroup } from "../components/StatBar";
import { loadUnitDetail, loadUnitsIndex } from "../data";
import { useLocale } from "../i18n/LocaleContext";
import { tCategory, tFaction, tStat } from "../i18n/messages";
import { STAT_KEYS, maxStatInUnits, type StatKey } from "../stats";
import { type UnitDetail, type UnitsIndex } from "../types";

export function UnitDetailPage() {
  const { locale, m } = useLocale();
  const { faction, category, unitKey } = useParams();
  const [detail, setDetail] = useState<UnitDetail | null>(null);
  const [index, setIndex] = useState<UnitsIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    loadUnitsIndex().then(setIndex).catch(() => setIndex(null));
  }, []);

  useEffect(() => {
    if (!faction || !category || !unitKey) return;
    setDetail(null);
    setError(null);
    loadUnitDetail(faction, category, decodeURIComponent(unitKey))
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [faction, category, unitKey]);

  const categoryPool = useMemo(() => {
    if (!index || !faction || !category) return [];
    return index.units.filter((u) => u.faction === faction && u.category === category);
  }, [index, faction, category]);

  const maxByKey = useMemo(() => {
    const out: Partial<Record<StatKey, number>> = {};
    for (const key of STAT_KEYS) {
      out[key] = maxStatInUnits(categoryPool, key);
    }
    return out;
  }, [categoryPool]);

  if (!faction || !category || !unitKey) {
    return <p className="error">{m.detail.invalidUrl}</p>;
  }

  if (error) {
    return (
      <p className="error">
        {m.detail.loadError} ({error}).{" "}
        <Link to={`/units?faction=${faction}&category=${category}`}>{m.detail.backToList}</Link>
      </p>
    );
  }

  if (!detail) return <p className="muted">{m.detail.loading}</p>;

  const bundle = detail.localized[locale] ?? detail.localized.en;
  const displayName = bundle?.displayName ?? detail.unitKey;
  const factionLabel = tFaction(locale, faction);
  const categoryLabel = tCategory(locale, category);

  return (
    <article className="unit-detail panel">
      <p className="breadcrumb">
        <Link to="/">{m.detail.hub}</Link>
        {" · "}
        <Link to={`/units?faction=${faction}&category=${category}`}>
          {factionLabel} / {categoryLabel}
        </Link>
      </p>

      <header className="unit-hero">
        <UnitPortrait
          iconName={detail.iconName}
          symbolIconName={detail.symbolIconName}
          alt={displayName}
          size="lg"
        />
        <div className="unit-hero-text">
          <div className="unit-hero-meta">
            <FactionEmblem faction={faction} label={factionLabel} size="sm" />
            <span className="badge">{categoryLabel}</span>
          </div>
          <h2>{displayName}</h2>
          <p className="mono">{detail.unitKey}</p>
          <p className="badge subtle">
            {m.detail.dataTag}: {detail.dataTag}
          </p>
        </div>
      </header>

      {detail.combat && (
        <section className="combat-stats-panel">
          <h3>{m.detail.combatTitle}</h3>
          <StatBarGroup
            stats={detail.combat}
            maxByKey={maxByKey}
            keys={[...STAT_KEYS]}
            labelForKey={(k) => tStat(locale, k)}
          />
        </section>
      )}

      <label className="raw-toggle">
        <input
          type="checkbox"
          checked={showRaw}
          onChange={(e) => setShowRaw(e.target.checked)}
        />
        {m.detail.showRaw}
      </label>

      {showRaw ? (
        <pre className="raw-json">{JSON.stringify(detail.raw, null, 2)}</pre>
      ) : (
        bundle.sections.map((section) => (
          <section key={section.title} className="spec-section">
            <h3>{section.title}</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">{m.detail.field}</th>
                  <th scope="col">{m.detail.value}</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">{row.key}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}

      {!showRaw && bundle.sections.length === 0 && (
        <p className="empty">{m.detail.noSections}</p>
      )}
    </article>
  );
}
