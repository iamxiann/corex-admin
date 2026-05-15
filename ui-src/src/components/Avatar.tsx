import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  name: string;
  id: number;
  /** Live base64 mugshot from MugShotBase64. Falls back to initials when empty/missing. */
  mugshot?: string;
  /** When true and no mugshot yet, render a subtle pulse instead of static initials. */
  loadingHint?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

// Deterministic muted surface for the initials fallback (no fake photos)
const SURFACES = [
  "bg-[#1e2026] text-zinc-200",
  "bg-[#241f1f] text-zinc-200",
  "bg-[#1d2422] text-zinc-200",
  "bg-[#22201e] text-zinc-200",
  "bg-[#202024] text-zinc-200",
  "bg-[#1c2125] text-zinc-200",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function dataUri(base64: string): string {
  // MugShotBase64 returns raw base64 (no prefix). We normalize to a PNG data URI.
  if (base64.startsWith("data:")) return base64;
  return `data:image/png;base64,${base64}`;
}

export function Avatar({ name, id, mugshot, loadingHint, size = "md", className }: Props) {
  const [errored, setErrored] = useState(false);
  const surface = SURFACES[id % SURFACES.length];
  const sz = {
    xs: "h-5 w-5 text-[9px]",
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-[11px]",
    lg: "h-11 w-11 text-[13px]",
  }[size];
  const baseRing = "ring-1 ring-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.4)]";

  const hasMugshot = !!mugshot && mugshot.length > 32 && !errored;

  if (!hasMugshot) {
    return (
      <div
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium tracking-wide select-none",
          baseRing,
          surface,
          sz,
          className,
        )}
        aria-label={name}
      >
        <span className="relative z-10">{initialsOf(name)}</span>
        {loadingHint && (
          // Soft sweep across the avatar while we wait for the server to push
          // the freshly captured base64. Disappears once the mugshot lands.
          <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-[#1d1d23]",
        baseRing,
        sz,
        className,
      )}
      aria-label={name}
    >
      <img
        src={dataUri(mugshot!)}
        alt={name}
        onError={() => setErrored(true)}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
