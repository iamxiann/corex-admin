import { Beef, GlassWater, HeartPulse, Bug, Droplet, Snowflake, Wind, Thermometer } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: number;       // 0-100
  tone?: "vital" | "status";
  inverted?: boolean;  // for stats where high = bad (infection, bleeding, sick, cold, poison)
  className?: string;
};

// Icon per vital. The drawer passes a static label string so we map by name —
// keeps the StatBar API tiny (no `icon` prop on every caller) while still
// giving each row a recognisable glyph.
const ICONS: Record<string, typeof Beef> = {
  Hunger:    Beef,
  Thirst:    GlassWater,
  Stress:    Wind,
  Infection: Bug,
  Bleeding:  Droplet,
  Sick:      Thermometer,
  Cold:      Snowflake,
  Poison:    HeartPulse,
};

export function StatBar({ label, value, tone = "vital", inverted, className }: Props) {
  // Vitals come from corex-survival as floating-point meters (e.g. 98.5999).
  // Admins want whole numbers — clamp to [0, 100] and round.
  const display = Math.max(0, Math.min(100, Math.round(value)));

  // For vitals (hunger/thirst): high = good. For inverted: high = bad.
  // We display a bar with semantic color based on whether the player is in trouble.
  const inTrouble = inverted ? display > 50 : display < 35;
  const warn      = inverted ? display > 25 : display < 60;

  const barColor =
    tone === "status" || inverted
      ? display === 0
        ? "bg-zinc-700/40"
        : inTrouble
        ? "bg-rose-500/70"
        : warn
        ? "bg-amber-500/70"
        : "bg-zinc-500/70"
      : inTrouble
      ? "bg-rose-500/70"
      : warn
      ? "bg-amber-500/70"
      : "bg-emerald-500/70";

  const valueColor =
    tone === "status" || inverted
      ? display === 0
        ? "text-zinc-500"
        : inTrouble
        ? "text-rose-300"
        : warn
        ? "text-amber-300"
        : "text-zinc-300"
      : inTrouble
      ? "text-rose-300"
      : warn
      ? "text-amber-300"
      : "text-emerald-300";

  const Icon = ICONS[label];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex w-[80px] shrink-0 items-center gap-1.5 text-[11px] text-zinc-500">
        {Icon && <Icon className="h-3 w-3 shrink-0 text-zinc-600" strokeWidth={1.75} />}
        <span>{label}</span>
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1d1d23]">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${display}%` }} />
      </div>
      <span className={cn("w-8 text-right font-mono text-[11px] tabular", valueColor)}>{display}</span>
    </div>
  );
}
