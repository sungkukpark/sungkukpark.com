import type { StatKey } from "../stats";

type StatBarProps = {
  value: number;
  max: number;
  label?: string;
  format?: (n: number) => string;
};

export function StatBar({ value, max, label, format }: StatBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const text = format ? format(value) : String(Math.round(value * 10) / 10);

  return (
    <div className="stat-bar-wrap">
      {label && <span className="stat-bar-label">{label}</span>}
      <div className="stat-bar-track" role="presentation">
        <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="stat-bar-value">{text}</span>
    </div>
  );
}

export function StatBarGroup({
  stats,
  maxByKey,
  keys,
  labelForKey,
}: {
  stats: Record<StatKey, number> | undefined;
  maxByKey: Partial<Record<StatKey, number>>;
  keys: StatKey[];
  labelForKey: (k: StatKey) => string;
}) {
  if (!stats) return null;
  return (
    <div className="stat-bar-group">
      {keys.map((key) => (
        <StatBar
          key={key}
          label={labelForKey(key)}
          value={stats[key]}
          max={maxByKey[key] ?? stats[key] ?? 1}
        />
      ))}
    </div>
  );
}
