import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadUnitDetail } from "../data";
import { CATEGORY_LABELS, FACTION_LABELS, type UnitDetail } from "../types";

export function UnitDetailPage() {
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
    return <p className="error">Invalid unit URL.</p>;
  }

  if (error) {
    return (
      <p className="error">
        {error}.{" "}
        <Link to={`/units?faction=${faction}&category=${category}`}>Back to list</Link>
      </p>
    );
  }

  if (!detail) return <p className="muted">Loading unit…</p>;

  return (
    <article className="unit-detail">
      <p className="breadcrumb">
        <Link to="/">Hub</Link>
        {" · "}
        <Link to={`/units?faction=${faction}&category=${category}`}>
          {FACTION_LABELS[faction] ?? faction} / {CATEGORY_LABELS[category] ?? category}
        </Link>
      </p>
      <h2>{detail.displayName}</h2>
      <p className="mono">{detail.unitKey}</p>
      <p className="badge">Data tag: {detail.dataTag}</p>

      <label className="raw-toggle">
        <input
          type="checkbox"
          checked={showRaw}
          onChange={(e) => setShowRaw(e.target.checked)}
        />
        Show raw JSON
      </label>

      {showRaw ? (
        <pre className="raw-json">{JSON.stringify(detail.raw, null, 2)}</pre>
      ) : (
        detail.sections.map((section) => (
          <section key={section.title} className="spec-section">
            <h3>{section.title}</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  <th scope="col">Value</th>
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

      {detail.sections.length === 0 && !showRaw && (
        <p className="empty">No extension sections parsed. Use raw JSON.</p>
      )}
    </article>
  );
}
