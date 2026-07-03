import { useState, type ReactNode } from "react";
import { factionEmblemUrl, unitPortraitUrl } from "../icons";

type GameImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: ReactNode;
};

export function GameImage({ src, alt, className, fallback }: GameImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className={`img-fallback ${className ?? ""}`} aria-hidden={!alt}>
        {fallback ?? "◆"}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function FactionEmblem({
  faction,
  label,
  size = "md",
}: {
  faction: string;
  label: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  return (
    <GameImage
      className={`faction-emblem faction-emblem--${size}`}
      src={factionEmblemUrl(faction)}
      alt={label}
      fallback={<span className="emblem-fallback">{label.slice(0, 1)}</span>}
    />
  );
}

export function UnitPortrait({
  iconName,
  symbolIconName,
  alt,
  size = "md",
}: {
  iconName?: string;
  symbolIconName?: string;
  alt: string;
  size?: "sm" | "md" | "lg";
}) {
  const src = unitPortraitUrl({ iconName, symbolIconName });
  return (
    <GameImage
      className={`unit-portrait unit-portrait--${size}`}
      src={src}
      alt={alt}
      fallback={<span className="portrait-fallback">▣</span>}
    />
  );
}
