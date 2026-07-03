import type { StatKey } from "../stats";
import { formatStatDisplay, statBarMetrics } from "../stats";

export type StatBarSize = "sm" | "md" | "lg";

type StatBarProps = {
  value: number;
  max: number;
  label?: string;
  format?: (n: number) => string;
  size?: StatBarSize;
  showShare?: boolean;
  statKey?: StatKey;
};

export function StatBar({
  value,
  max,
  label,
  format,
  size = "md",
  showShare,
  statKey,
}: StatBarProps) {
  const { fillPct, sharePct, tier, isEmpty } = statBarMetrics(value, max);
  const text = format ? format(value) : String(Math.round(value * 10) / 10);
  const showShareLabel = showShare ?? size !== "sm";

  return (
    <div
      className={`stat-bar-wrap stat-bar-wrap--${size}${isEmpty ? " stat-bar-wrap--empty" : ""}`}
      aria-label={
        label
          ? `${label}: ${text}${showShareLabel && !isEmpty ? `, ${sharePct}% of category maximum` : ""}`
          : undefined
      }
    >
      {(label || size === "lg") && (
        <div className="stat-bar-head">
          {label && <span className="stat-bar-label">{label}</span>}
          <div className="stat-bar-numbers">
            <span className="stat-bar-value">{text}</span>
            {showShareLabel && !isEmpty && (
              <span className="stat-bar-share">{sharePct}%</span>
            )}
          </div>
        </div>
      )}
      {!label && size !== "lg" && (
        <span className="stat-bar-value stat-bar-value--inline">{text}</span>
      )}
      <div className="stat-bar-track" role="presentation">
        <div
          className={`stat-bar-fill stat-bar-fill--${tier}${statKey ? ` stat-bar-fill--key-${statKey}` : ""}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      {!label && size !== "lg" && showShareLabel && !isEmpty && (
        <span className="stat-bar-share stat-bar-share--inline">{sharePct}%</span>
      )}
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
    <div className="stat-bar-group stat-bar-group--detail">
      {keys.map((key) => (
        <StatBar
          key={key}
          statKey={key}
          size="lg"
          showShare
          label={labelForKey(key)}
          value={stats[key]}
          max={maxByKey[key] ?? stats[key] ?? 1}
          format={(v) => formatStatDisplay(key, v)}
        />
      ))}
    </div>
  );
}
