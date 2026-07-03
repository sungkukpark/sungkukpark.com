import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadUnitDetail } from "../data";
import { useLocale } from "../i18n/LocaleContext";
import { tCategory, tFaction } from "../i18n/messages";
import { type UnitDetail } from "../types";

export function UnitDetailPage() {
  const { locale, m } = useLocale();
  const { faction, category, unitKey } = useParams();
  const [detail, setDetail] = useState<UnitDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!faction || !category || !unitKey) return;
    setDetail(null);
    setError(null);
    loadUnitDetail(faction, category, decodeURIComponent(unitKey))
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [faction, category, unitKey]);

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

  return (
    <article className="unit-detail">
      <p className="breadcrumb">
        <Link to="/">{m.detail.hub}</Link>
        {" · "}
        <Link to={`/units?faction=${faction}&category=${category}`}>
          {tFaction(locale, faction)} / {tCategory(locale, category)}
        </Link>
      </p>
      <h2>{displayName}</h2>
      <p className="mono">{detail.unitKey}</p>
      <p className="badge">
        {m.detail.dataTag}: {detail.dataTag}
      </p>

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
