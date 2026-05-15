import { useMemo, useState, useRef, useEffect } from "react";
import {
  Search, MoreHorizontal, Hand, Shield, Crosshair, HeartPulse,
  Coins, Eye, AlertTriangle, CheckSquare, Square, X, Ban,
  ChevronDown, Megaphone, Plus, KeyRound, MapPin, Wifi, ShieldAlert,
  Check, Send, Skull, Activity, Loader,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { StatusDot, statusLabel, statusColor } from "@/components/StatusDot";
import { PageHeader } from "@/components/PageHeader";
import { players as mockPlayers, type Player, type LifecycleState } from "@/lib/data";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

type Props = {
  onSelect: (p: Player) => void;
  onAction: (a: string, p: Player) => void;
  onAnnounce: () => void;
};

const fmt = (n: number) => n.toLocaleString("en-US");

function pingTone(p: number) {
  if (p < 50) return "text-emerald-400";
  if (p < 100) return "text-zinc-400";
  return "text-amber-400";
}

export function PlayersPage({ onSelect, onAction, onAnnounce }: Props) {
  const [q, setQ] = useState("");
  const [lifeFilter, setLifeFilter] = useState<LifecycleState | "all">("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkOpen, setBulkOpen] = useState<null | "warn" | "ban" | "money" | "announce">(null);
  // Live data — fetched on mount. mockPlayers is the dev fallback (empty in prod
  // bundle), so the table doesn't flash empty before the real list arrives.
  const [allPlayers, setAllPlayers] = useState<Player[]>(mockPlayers);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      api.getPlayers()
        .then((list) => { if (alive) setAllPlayers(list); })
        .catch(() => {});
    tick();
    // Mugshots are populated by the client a few seconds after a player loads.
    // Polling lets newly-arrived portraits replace the initials without the
    // admin having to refresh.
    const id = window.setInterval(tick, 5000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    return allPlayers
      .filter((p) =>
        (!q || p.name.toLowerCase().includes(lower) || String(p.id).includes(lower) || p.identifier.toLowerCase().includes(lower) || p.zone.toLowerCase().includes(lower))
        && (lifeFilter === "all" || p.lifecycle === lifeFilter)
      );
  }, [q, lifeFilter, allPlayers]);

  const toggle = (id: number) => {
    setSelected((s) => {
      const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const selectedPlayers = filtered.filter((p) => selected.has(p.id));
  const activeCount   = allPlayers.filter((p) => p.lifecycle === "active").length;
  const warnedCount   = allPlayers.filter((p) => p.warnings > 0).length;
  const bannedHistory = allPlayers.filter((p) => p.bans > 0).length;

  return (
    <>
      <PageHeader
        title="Players"
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <StatChip dot="bg-emerald-400" label={`${activeCount} active`} />
            <StatChip icon={ShieldAlert} tone="warn"   label={`${warnedCount} warned`} />
            <StatChip icon={Ban}         tone="danger" label={`${bannedHistory} with ban history`} />
          </span>
        }
        actions={
          <button onClick={onAnnounce} className="motion-soft flex h-8 items-center gap-1.5 rounded-md border border-zinc-300 bg-zinc-100 px-3 text-[12px] font-medium text-zinc-900 hover:bg-white">
            <Megaphone className="h-3.5 w-3.5" strokeWidth={2.25} />
            Announce
          </button>
        }
      />

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex h-9 flex-1 min-w-[280px] max-w-md items-center gap-2 rounded-md border border-[#2a2a32] bg-[#141418] px-3 focus-within:border-[#46464e]">
          <Search className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID, license, or zone…" className="w-full bg-transparent text-[12.5px] text-zinc-200 outline-none placeholder:text-zinc-600" />
          {q ? (
            <button onClick={() => setQ("")} className="font-mono text-[10.5px] text-zinc-500 hover:text-zinc-300">
              clear
            </button>
          ) : (
            <kbd className="rounded border border-[#2a2a32] bg-[#1d1d23] px-1 py-0 font-mono text-[10px] text-zinc-500">/</kbd>
          )}
        </div>
        <LifeFilter value={lifeFilter} onChange={setLifeFilter} />
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-md border border-[#252529] bg-[#141418] px-2 py-1 text-[10.5px] text-zinc-500 md:inline-flex">
            <span>Hover any row for quick actions</span>
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px] tabular text-zinc-500">
            <span className="text-zinc-300">{filtered.length}</span>
            <span className="text-zinc-700">/</span>
            <span>{allPlayers.length}</span>
          </span>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onWarn={() => setBulkOpen("warn")}
          onBan={() => setBulkOpen("ban")}
          onMoney={() => setBulkOpen("money")}
          onAnnounce={() => setBulkOpen("announce")}
          onClear={() => setSelected(new Set())}
        />
      )}

      <section className="overflow-hidden rounded-xl border border-[#252529] bg-[#121216]">
        <div className="grid grid-cols-[36px_32px_minmax(0,1.6fr)_96px_minmax(0,1fr)_minmax(0,1fr)_72px_96px_minmax(0,1.1fr)] items-center gap-4 border-b border-[#1d1d23] bg-[#18181c] px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
          <button onClick={toggleAll} className="flex justify-center" aria-label="Select all">
            {selected.size === filtered.length && filtered.length > 0
              ? <CheckSquare className="h-3.5 w-3.5 text-zinc-300" strokeWidth={2} />
              : <Square className="h-3.5 w-3.5 text-zinc-600" strokeWidth={2} />}
          </button>
          <span className="text-center">#</span>
          <span>Player</span>
          <span>State</span>
          <span>Cash</span>
          <span>Bank</span>
          <span>Ping</span>
          <span>Played</span>
          <span>Zone</span>
        </div>

        <div className="divide-y divide-[#1d1d22]">
          {filtered.map((p) => (
            <PlayerRow
              key={p.id}
              p={p}
              selected={selected.has(p.id)}
              onToggle={() => toggle(p.id)}
              onSelect={() => onSelect(p)}
              onAction={(a) => onAction(a, p)}
            />
          ))}
        </div>

        <footer className="flex items-center justify-between border-t border-[#1d1d23] px-3 py-2 text-[10.5px] text-zinc-600">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono">click any row to open · or hover for quick actions</span>
        </footer>
      </section>

      {/* Bulk dialogs */}
      {bulkOpen && (
        <BulkDialog
          kind={bulkOpen}
          targets={selectedPlayers}
          onClose={() => setBulkOpen(null)}
          onConfirm={() => { setBulkOpen(null); setSelected(new Set()); }}
        />
      )}
    </>
  );
}

function StatChip({ icon: Icon, dot, tone, label }: {
  icon?: typeof Hand;
  dot?: string;
  tone?: "warn" | "danger";
  label: string;
}) {
  const toneCls =
    tone === "warn"   ? "text-amber-300/90 ring-amber-500/15 bg-amber-500/[0.06]" :
    tone === "danger" ? "text-rose-300/90  ring-rose-500/15  bg-rose-500/[0.06]"  :
                        "text-zinc-300     ring-[#2a2a32]    bg-[#1a1a1f]";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11.5px] ring-1 ring-inset",
      toneCls,
    )}>
      {dot && <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)} />}
      {Icon && <Icon className="h-3 w-3" strokeWidth={2.25} />}
      <span className="font-medium tabular">{label}</span>
    </span>
  );
}

function LifeFilter({ value, onChange }: { value: LifecycleState | "all"; onChange: (v: LifecycleState | "all") => void }) {
  const items: Array<{ v: LifecycleState | "all"; label: string; icon: typeof Activity; tone: string }> = [
    { v: "all",        label: "All",        icon: Activity,    tone: "text-zinc-400" },
    { v: "active",     label: "Active",     icon: Activity,    tone: "text-emerald-400" },
    { v: "dead",       label: "Dead",       icon: Skull,       tone: "text-rose-400" },
    { v: "spectating", label: "Spectating", icon: Eye,         tone: "text-blue-400" },
    { v: "loading",    label: "Loading",    icon: Loader,      tone: "text-amber-400" },
  ];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const current = items.find((i) => i.v === value) ?? items[0];
  const CurrIcon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-soft flex h-9 items-center gap-2 rounded-md border bg-[#141418] px-2.5 text-[12px]",
          open ? "border-[#46464e]" : "border-[#2a2a32] hover:border-[#383841]",
        )}
      >
        <span className="text-zinc-500">State</span>
        <span className="text-zinc-700">·</span>
        <CurrIcon className={cn("h-3 w-3", current.tone)} strokeWidth={2.25} />
        <span className="text-zinc-100">{current.label}</span>
        <ChevronDown className={cn("h-3 w-3 text-zinc-500 transition-transform", open && "rotate-180")} strokeWidth={2} />
      </button>
      {open && (
        <ul className="absolute left-0 top-[42px] z-30 min-w-[180px] overflow-hidden rounded-lg border border-[#33333c] bg-[#16161a] p-1 shadow-2xl">
          {items.map((i) => {
            const Icon = i.icon;
            const active = i.v === value;
            return (
              <li key={i.v}>
                <button
                  type="button"
                  onClick={() => { onChange(i.v); setOpen(false); }}
                  className={cn(
                    "motion-soft flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px]",
                    active ? "bg-[#252529] text-zinc-50" : "text-zinc-300 hover:bg-[#1d1d24] hover:text-zinc-100",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", i.tone)} strokeWidth={2.25} />
                  <span className="flex-1">{i.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2.25} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BulkBar({ count, onWarn, onBan, onMoney, onAnnounce, onClear }: {
  count: number;
  onWarn: () => void; onBan: () => void; onMoney: () => void; onAnnounce: () => void; onClear: () => void;
}) {
  return (
    <div className="motion-soft mb-3 flex items-center gap-2 rounded-md border border-zinc-700/40 bg-[#1d1d24] px-3 py-2">
      <span className="text-[12px] text-zinc-200">
        <span className="font-medium">{count}</span> selected
      </span>
      <span className="text-zinc-700">·</span>
      <BulkButton icon={Megaphone} onClick={onAnnounce}>DM</BulkButton>
      <BulkButton icon={Coins} onClick={onMoney}>Give money</BulkButton>
      <BulkButton icon={Hand} tone="warn" onClick={onWarn}>Warn all</BulkButton>
      <BulkButton icon={Ban} tone="danger" onClick={onBan}>Ban all</BulkButton>
      <button onClick={onClear} className="ml-auto flex items-center gap-1 text-[11.5px] text-zinc-500 hover:text-zinc-300">
        <X className="h-3 w-3" strokeWidth={2} />
        Clear
      </button>
    </div>
  );
}

function BulkButton({ icon: Icon, children, tone, onClick }: { icon: typeof Hand; children: React.ReactNode; tone?: "warn" | "danger"; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "motion-soft flex h-6 items-center gap-1.5 rounded-md border border-[#33333c] bg-[#1d1d23] px-2 text-[11.5px] hover:border-[#383841] hover:bg-[#13131a]",
      tone === "warn" && "hover:border-amber-500/40 hover:text-amber-300",
      tone === "danger" && "hover:border-rose-500/40 hover:text-rose-300",
      !tone && "text-zinc-300 hover:text-zinc-50",
    )}>
      <Icon className="h-3 w-3" strokeWidth={2} />
      {children}
    </button>
  );
}

function PlayerRow({ p, selected, onToggle, onSelect, onAction }: {
  p: Player; selected: boolean;
  onToggle: () => void; onSelect: () => void; onAction: (a: string) => void;
}) {
  // Strip "license:" prefix and truncate cleanly
  const shortId = p.identifier.replace(/^license:/, "").slice(0, 14);
  return (
    <div
      className={cn(
        "group/row motion-soft relative grid cursor-pointer grid-cols-[36px_32px_minmax(0,1.6fr)_96px_minmax(0,1fr)_minmax(0,1fr)_72px_96px_minmax(0,1.1fr)] items-center gap-4 px-4 py-3",
        selected ? "bg-[#201d2a]" : "hover:bg-[#18181c]",
      )}
      onClick={onSelect}
    >
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="flex justify-center">
        {selected
          ? <CheckSquare className="h-3.5 w-3.5 text-zinc-100" strokeWidth={2} />
          : <Square className="h-3.5 w-3.5 text-zinc-700 group-hover/row:text-zinc-400" strokeWidth={2} />}
      </button>
      <div className="text-center font-mono text-[11.5px] tabular text-zinc-500">{p.id}</div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          <Avatar name={p.name} id={p.id} mugshot={p.mugshot} loadingHint={!p.mugshot} size="md" />
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-[2.5px]",
            selected ? "ring-[#201d2a]" : "ring-[#121216] group-hover/row:ring-[#18181c]",
            statusColor(p.lifecycle),
          )} />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-zinc-50">{p.name}</span>
            {p.isStaff && (
              <span className="rounded-sm bg-emerald-500/[0.08] px-1.5 py-0 font-mono text-[9.5px] font-semibold tracking-tight text-emerald-400 ring-1 ring-emerald-500/20">
                STAFF
              </span>
            )}
            {p.warnings > 0 && (
              <span
                title={`${p.warnings} active warning(s)`}
                className="inline-flex h-4 items-center gap-0.5 rounded-sm bg-amber-500/[0.08] px-1 font-mono text-[9.5px] font-semibold tabular text-amber-300 ring-1 ring-amber-500/20"
              >
                <ShieldAlert className="h-2.5 w-2.5" strokeWidth={2.25} />
                {p.warnings}
              </span>
            )}
            {p.bans > 0 && (
              <span
                title={`${p.bans} past ban(s)`}
                className="inline-flex h-4 items-center rounded-sm bg-rose-500/[0.08] px-1 font-mono text-[9.5px] font-semibold tabular text-rose-300 ring-1 ring-rose-500/20"
              >
                {p.bans}× B
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 font-mono text-[10.5px] text-zinc-600">
            <KeyRound className="h-2.5 w-2.5" strokeWidth={2} />
            <span className="tabular tracking-tight">{shortId}…</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <StatusDot state={p.lifecycle} />
        <span className="text-[12px] text-zinc-400">{statusLabel(p.lifecycle)}</span>
      </div>

      <div className="font-mono text-[12.5px] tabular text-zinc-100">${fmt(p.cash)}</div>
      <div className="font-mono text-[12.5px] tabular text-zinc-100">${fmt(p.bank)}</div>

      <div className="flex items-baseline gap-1 font-mono">
        <Wifi className={cn("h-3 w-3 self-center", pingTone(p.ping))} strokeWidth={2.25} />
        <span className={cn("text-[12.5px] tabular", pingTone(p.ping))}>{p.ping}</span>
        <span className="text-[9.5px] text-zinc-700">ms</span>
      </div>

      <div className="font-mono text-[11.5px] tabular text-zinc-400">{p.playtime}</div>

      <div className="flex min-w-0 items-center gap-1 text-zinc-400">
        <MapPin className="h-3 w-3 shrink-0 text-zinc-600" strokeWidth={2} />
        <span className="truncate text-[12px]">{p.zone}</span>
      </div>

      {/* Inline hover actions — each with a clear text label */}
      <div className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/row:pointer-events-auto group-hover/row:opacity-100">
        <div className="flex items-center gap-0.5 rounded-lg border border-[#383841] bg-[#16161a] p-1 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm">
          <ActionPill icon={Eye}        label="Spectate" onClick={(e) => { e.stopPropagation(); onAction("spectate"); }} />
          <ActionPill icon={Crosshair}  label="TP"       title="Teleport to player" onClick={(e) => { e.stopPropagation(); onAction("tp"); }} />
          <Divider />
          <ActionPill icon={HeartPulse} label="Revive"   tone="good" onClick={(e) => { e.stopPropagation(); onAction("revive"); }} />
          <ActionPill icon={Coins}      label="Money"    tone="good" title="Give money" onClick={(e) => { e.stopPropagation(); onAction("money"); }} />
          <ActionPill icon={Plus}       label="Item"     tone="good" title="Give item" onClick={(e) => { e.stopPropagation(); onAction("give_item"); }} />
          <Divider />
          <ActionPill icon={Hand}       label="Warn"     tone="warn"  onClick={(e) => { e.stopPropagation(); onAction("warn"); }} />
          <ActionPill icon={Shield}     label="Kick"     tone="warn"  onClick={(e) => { e.stopPropagation(); onAction("kick"); }} />
          <ActionPill icon={AlertTriangle} label="Ban"   tone="danger" onClick={(e) => { e.stopPropagation(); onAction("ban"); }} />
          <Divider />
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="motion-soft flex h-6 items-center gap-1 rounded-md bg-zinc-100 px-2 text-[10.5px] font-semibold text-zinc-900 hover:bg-white"
            title="Open full profile"
          >
            Open
            <MoreHorizontal className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-3.5 w-px bg-[#383841]" />;
}

function ActionPill({ icon: Icon, label, tone, title, onClick }: {
  icon: typeof Hand;
  label: string;
  tone?: "good" | "warn" | "danger";
  title?: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const toneCls =
    tone === "good"   ? "text-emerald-300/90 hover:bg-emerald-500/10 hover:text-emerald-200" :
    tone === "warn"   ? "text-amber-300/90  hover:bg-amber-500/10  hover:text-amber-200"   :
    tone === "danger" ? "text-rose-300/90   hover:bg-rose-500/10   hover:text-rose-200"    :
                        "text-zinc-300      hover:bg-[#252529]     hover:text-zinc-50";
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      className={cn(
        "motion-soft flex h-6 items-center gap-1 rounded-md px-1.5 font-medium",
        "text-[10.5px] leading-none tracking-tight",
        toneCls,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.25} />
      {label}
    </button>
  );
}

const dialogMeta = {
  warn: {
    icon: Hand,
    accent: "amber" as const,
    title: "Warn players",
    desc: "Log a formal warning. The player gets an in-game notice and 1 warning is added to their record.",
    confirmLabel: "Issue warning",
    confirmIcon: Hand,
  },
  ban: {
    icon: Ban,
    accent: "rose" as const,
    title: "Ban players",
    desc: "Player is disconnected immediately, then blocked from rejoining for the selected duration.",
    confirmLabel: "Ban now",
    confirmIcon: Ban,
  },
  money: {
    icon: Coins,
    accent: "emerald" as const,
    title: "Give money",
    desc: "Add the amount to each player's cash or bank balance. Logged as an admin transaction.",
    confirmLabel: "Send funds",
    confirmIcon: Coins,
  },
  announce: {
    icon: Send,
    accent: "blue" as const,
    title: "Send DM",
    desc: "Sends a private in-game message. Only the selected players will see it, in chat tagged [Admin].",
    confirmLabel: "Send message",
    confirmIcon: Send,
  },
};

function BulkDialog({ kind, targets, onClose, onConfirm }: {
  kind: "warn" | "ban" | "money" | "announce";
  targets: Player[];
  onClose: () => void; onConfirm: () => void;
}) {
  const meta = dialogMeta[kind];
  const Icon = meta.icon;
  const accentBg =
    meta.accent === "amber"   ? "bg-amber-500/10 ring-amber-500/20 text-amber-300" :
    meta.accent === "rose"    ? "bg-rose-500/10  ring-rose-500/20  text-rose-300"  :
    meta.accent === "emerald" ? "bg-emerald-500/10 ring-emerald-500/20 text-emerald-300" :
                                "bg-blue-500/10  ring-blue-500/20  text-blue-300";
  const confirmCls =
    meta.accent === "amber"   ? "bg-amber-500 text-zinc-950 hover:bg-amber-400" :
    meta.accent === "rose"    ? "bg-rose-500 text-white hover:bg-rose-400" :
    meta.accent === "emerald" ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400" :
                                "bg-zinc-100 text-zinc-900 hover:bg-white";

  const [moneyType, setMoneyType]   = useState<"cash" | "bank">("cash");
  const [moneyAmount, setMoneyAmount] = useState(1000);
  const [banDuration, setBanDuration] = useState<"1h" | "24h" | "7d" | "30d" | "permanent">("7d");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const charLimit = 280;

  const ConfirmIcon = meta.confirmIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px] overflow-hidden rounded-xl border border-[#33333c] bg-[#16161a] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]">
        {/* Header with icon medallion */}
        <header className="flex items-start gap-3 border-b border-[#272730] bg-[#18181c] px-4 py-3.5">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", accentBg)}>
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-medium text-zinc-50">{meta.title}</h3>
              <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tabular ring-1 ring-inset", accentBg)}>
                {targets.length} {targets.length === 1 ? "player" : "players"}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-500">
              {meta.desc}
            </p>
          </div>
          <button onClick={onClose} className="motion-soft -mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-[#252529] hover:text-zinc-200" aria-label="Close">
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </header>

        <div className="space-y-4 p-4">
          {kind === "money" && (
            <>
              <Field label="Account">
                <div className="flex gap-1.5">
                  <ChoicePill icon={Coins} active={moneyType === "cash"} onClick={() => setMoneyType("cash")}>Cash</ChoicePill>
                  <ChoicePill icon={Coins} active={moneyType === "bank"} onClick={() => setMoneyType("bank")}>Bank</ChoicePill>
                </div>
              </Field>
              <Field label="Amount per player">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 items-center rounded-md border border-[#2f2f38] bg-[#18181c] focus-within:border-[#46464e]">
                    <span className="pl-2.5 font-mono text-[12.5px] text-zinc-500">$</span>
                    <input
                      type="number"
                      value={moneyAmount}
                      onChange={(e) => setMoneyAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-32 bg-transparent px-2 py-1.5 font-mono text-[13px] tabular text-zinc-100 outline-none"
                    />
                  </div>
                  <div className="flex gap-1">
                    {[100, 1000, 10_000].map((q) => (
                      <button key={q} onClick={() => setMoneyAmount(q)} className="motion-soft rounded-md border border-[#2f2f38] bg-[#18181c] px-2 py-1 font-mono text-[11px] tabular text-zinc-400 hover:border-[#383841] hover:text-zinc-200">
                        ${q.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-1.5 font-mono text-[10.5px] tabular text-zinc-600">
                  Total payout: <span className="text-emerald-400">${(moneyAmount * targets.length).toLocaleString()}</span>
                </div>
              </Field>
            </>
          )}
          {kind === "ban" && (
            <>
              <Field label="Duration">
                <div className="flex flex-wrap gap-1.5">
                  {(["1h","24h","7d","30d","permanent"] as const).map((d) => (
                    <ChoicePill key={d} active={banDuration === d} onClick={() => setBanDuration(d)}>
                      {d}
                    </ChoicePill>
                  ))}
                </div>
              </Field>
              <Field label="Reason" required>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. RDM × 4 — rule 3.2 — clip attached"
                  rows={3}
                  className="w-full resize-none rounded-md border border-[#2f2f38] bg-[#18181c] px-2.5 py-2 text-[12.5px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#46464e]"
                />
              </Field>
            </>
          )}
          {kind === "warn" && (
            <Field label="Reason" required>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. combat in safe zone — rule 4.1"
                rows={3}
                className="w-full resize-none rounded-md border border-[#2f2f38] bg-[#18181c] px-2.5 py-2 text-[12.5px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#46464e]"
              />
            </Field>
          )}
          {kind === "announce" && (
            <Field label="Message" required>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, charLimit))}
                  placeholder="e.g. Reminder: red zone resets in 5 minutes."
                  rows={4}
                  className="w-full resize-none rounded-md border border-[#2f2f38] bg-[#18181c] px-2.5 py-2 pr-14 text-[12.5px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#46464e]"
                />
                <span className={cn(
                  "absolute bottom-2 right-2.5 font-mono text-[10px] tabular",
                  message.length > charLimit - 20 ? "text-amber-400" : "text-zinc-600",
                )}>
                  {message.length}/{charLimit}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[
                  "Join discord.gg/corex",
                  "Server restart in 5m",
                  "Red zone opens in 10m",
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setMessage(preset)}
                    className="motion-soft rounded-md border border-[#272730] bg-[#18181c] px-2 py-0.5 text-[10.5px] text-zinc-500 hover:border-[#383841] hover:text-zinc-300"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Target preview — with avatars */}
          <Field label="Recipients">
            <div className="rounded-lg border border-[#272730] bg-[#101013] p-2">
              {targets.length === 0 ? (
                <div className="flex items-center gap-2 px-1 py-2 text-[11.5px] text-zinc-500">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" strokeWidth={2} />
                  No players selected. Close this dialog and pick at least one from the table.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {targets.slice(0, 8).map((t) => (
                    <span key={t.id} className="inline-flex items-center gap-1.5 rounded-md bg-[#16161a] py-0.5 pl-0.5 pr-2 ring-1 ring-[#272730]">
                      <Avatar name={t.name} id={t.id} mugshot={t.mugshot} size="xs" />
                      <span className="font-mono text-[10px] text-zinc-500">#{t.id}</span>
                      <span className="text-[11.5px] text-zinc-200">{t.name.split(" ")[0]}</span>
                    </span>
                  ))}
                  {targets.length > 8 && (
                    <span className="inline-flex items-center rounded-md bg-[#16161a] px-2 py-1 font-mono text-[10.5px] text-zinc-500 ring-1 ring-[#272730]">
                      +{targets.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </Field>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-[#272730] bg-[#101013] px-3 py-2.5">
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] tabular text-zinc-600">
            <kbd className="rounded border border-[#33333c] bg-[#18181c] px-1 py-0 text-[9.5px]">esc</kbd>
            <span>to cancel</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="motion-soft h-8 rounded-md border border-[#2f2f38] bg-[#18181c] px-3 text-[12px] text-zinc-300 hover:border-[#383841] hover:text-zinc-100">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={targets.length === 0 || (kind === "announce" && !message.trim()) || ((kind === "warn" || kind === "ban") && !reason.trim())}
              className={cn(
                "motion-soft flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-40",
                confirmCls,
              )}
            >
              <ConfirmIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
              {meta.confirmLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-3">
      <div className="pt-2 text-[11.5px] font-medium text-zinc-400">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ChoicePill({ children, active, onClick, icon: Icon }: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: typeof Coins;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "motion-soft flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px]",
        active
          ? "border-zinc-500 bg-[#252529] text-zinc-50 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
          : "border-[#2f2f38] bg-[#18181c] text-zinc-400 hover:border-[#383841] hover:text-zinc-200",
      )}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={2.25} />}
      <span className="font-mono tabular">{children}</span>
    </button>
  );
}
