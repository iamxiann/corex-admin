import { cn } from "@/lib/cn";
import type { LifecycleState } from "@/lib/data";

const map: Record<LifecycleState, { color: string; label: string }> = {
  "loading":    { color: "bg-amber-400",  label: "Loading" },
  "active":     { color: "bg-emerald-400", label: "Active" },
  "dead":       { color: "bg-rose-500",   label: "Dead" },
  "spectating": { color: "bg-blue-400",   label: "Spectating" },
};

export function StatusDot({ state, className }: { state: LifecycleState; className?: string }) {
  return (
    <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", map[state].color, className)} aria-label={map[state].label} />
  );
}

export function statusLabel(s: LifecycleState) { return map[s].label; }

export function statusColor(s: LifecycleState) { return map[s].color; }
