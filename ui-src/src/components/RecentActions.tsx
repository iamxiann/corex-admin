import {
  Hand, Shield, Crosshair, HeartPulse, Coins, Package,
  Eye, Undo2, Ban, Skull, CloudRain, Plus, Minus, ChevronRight,
  Megaphone, Activity,
} from "lucide-react";
import type { AdminAction } from "@/lib/data";
import { cn } from "@/lib/cn";

// Visual metadata per action type. Every action persisted in `corex_admin_actions`
// must have an entry here, otherwise the UI would crash trying to render an
// unknown row. The `fallback` entry guards against future server-side action
// types the panel hasn't been rebuilt to know about yet.
const meta: Record<string, { icon: typeof Hand; tone: string; verb: string }> = {
  warn:           { icon: Hand,         tone: "text-amber-400 bg-amber-500/10 ring-amber-500/15",     verb: "warned" },
  ban:            { icon: Ban,          tone: "text-rose-400 bg-rose-500/10 ring-rose-500/15",        verb: "banned" },
  kick:           { icon: Shield,       tone: "text-amber-400 bg-amber-500/10 ring-amber-500/15",     verb: "kicked" },
  give_money:     { icon: Coins,        tone: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/15", verb: "gave money to" },
  set_money:      { icon: Coins,        tone: "text-zinc-300 bg-zinc-700/15 ring-zinc-600/25",        verb: "set money on" },
  give_item:      { icon: Plus,         tone: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/15", verb: "gave item to" },
  remove_item:    { icon: Minus,        tone: "text-rose-300 bg-rose-500/10 ring-rose-500/15",        verb: "removed item from" },
  teleport:       { icon: Crosshair,    tone: "text-zinc-300 bg-zinc-700/15 ring-zinc-600/25",        verb: "teleported to" },
  revive:         { icon: HeartPulse,   tone: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/15", verb: "revived" },
  spectate:       { icon: Eye,          tone: "text-zinc-300 bg-zinc-700/15 ring-zinc-600/25",        verb: "spectated" },
  spawn_zombie:   { icon: Skull,        tone: "text-zinc-300 bg-zinc-700/15 ring-zinc-600/25",        verb: "spawned zombies" },
  clear_zombies:  { icon: Package,      tone: "text-zinc-300 bg-zinc-700/15 ring-zinc-600/25",        verb: "cleared zombies" },
  weather:        { icon: CloudRain,    tone: "text-zinc-300 bg-zinc-700/15 ring-zinc-600/25",        verb: "changed weather" },
  announce:       { icon: Megaphone,    tone: "text-blue-300 bg-blue-500/10 ring-blue-500/15",        verb: "announced" },
};

const FALLBACK = { icon: Activity, tone: "text-zinc-400 bg-zinc-700/15 ring-zinc-600/25", verb: "did" };

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 0)    return "just now";   // future timestamps (clock skew) — don't render "in 3s"
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function RecentActions({ actions, compact = false }: { actions: AdminAction[]; compact?: boolean }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#252529] bg-[#121216]">
      <header className="flex items-center justify-between border-b border-[#1d1d23] px-3.5 py-2.5">
        <h3 className="text-[12.5px] font-medium text-zinc-200">Recent admin actions</h3>
        <button className="text-[11px] text-zinc-500 hover:text-zinc-300">
          View all <ChevronRight className="ml-0.5 inline h-3 w-3" strokeWidth={2} />
        </button>
      </header>

      {actions.length === 0 ? (
        <div className="px-3 py-8 text-center text-[12px] text-zinc-500">
          No admin actions yet — the next kick, warning, or money change will land here.
        </div>
      ) : (
        <ol>
          {actions.slice(0, compact ? 5 : 7).map((a) => {
            // Fall back to a neutral icon/verb for unknown types so a single
            // unrecognised action can never crash the overview page.
            const M = meta[a.type] ?? FALLBACK;
            const Icon = M.icon;
            const mine = a.by === "you";
            return (
              <li key={a.id} className="motion-soft grid grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-2 border-b border-[#1d1d22] px-3 py-2.5 last:border-b-0 hover:bg-[#1d1d23]">
                <div className="flex justify-center pt-0.5">
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-inset", M.tone)}>
                    <Icon className="h-3 w-3" strokeWidth={2} />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] leading-snug text-zinc-300">
                    <span className={cn("font-medium", mine ? "text-zinc-100" : "text-zinc-300")}>
                      {mine ? "You" : a.by}
                    </span>{" "}
                    <span className="text-zinc-400">{M.verb}</span>
                    {a.targetName && (
                      <>
                        {" "}
                        <span className="font-medium text-zinc-100">{a.targetName}</span>
                        {a.targetId !== undefined && (
                          <span className="ml-1 font-mono text-[10.5px] text-zinc-600">#{a.targetId}</span>
                        )}
                      </>
                    )}
                  </div>
                  {a.detail && <div className="mt-0.5 truncate text-[11px] text-zinc-500">{a.detail}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] tabular text-zinc-600">{timeAgo(a.at)}</span>
                  {a.reversible && mine && (
                    <button className="motion-soft flex items-center gap-1 rounded-md border border-[#2f2f38] bg-[#1d1d23] px-1.5 py-0.5 text-[10.5px] text-zinc-400 hover:border-[#383841] hover:text-zinc-200">
                      <Undo2 className="h-2.5 w-2.5" strokeWidth={2} />
                      Undo
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
