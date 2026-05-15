import { useMemo, useState } from "react";
import { Search, Info, AlertTriangle, AlertOctagon, ShieldCheck, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { logs as allLogs, type LogEntry } from "@/lib/data";
import { cn } from "@/lib/cn";

const levelMeta: Record<LogEntry["level"], { icon: typeof Info; tint: string; label: string }> = {
  info:     { icon: Info,           tint: "text-zinc-400 bg-[#1d1d23] ring-[#2f2f38]",        label: "INFO" },
  warn:     { icon: AlertTriangle,  tint: "text-amber-300 bg-amber-500/10 ring-amber-500/20", label: "WARN" },
  error:    { icon: AlertOctagon,   tint: "text-rose-300 bg-rose-500/10 ring-rose-500/20",    label: "ERROR" },
  admin:    { icon: ShieldCheck,    tint: "text-zinc-200 bg-[#1a1a1f] ring-[#33333c]",        label: "ADMIN" },
  security: { icon: Lock,           tint: "text-rose-300 bg-rose-500/10 ring-rose-500/20",    label: "SEC" },
};

export function LogsPage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<LogEntry["level"] | "all">("all");
  const [area, setArea] = useState<LogEntry["area"] | "all">("all");

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    return allLogs.filter((l) =>
      (!q || l.message.toLowerCase().includes(lower) || (l.actor?.toLowerCase().includes(lower) ?? false))
      && (level === "all" || l.level === level)
      && (area === "all" || l.area === area)
    );
  }, [q, level, area]);

  const areas: LogEntry["area"][] = ["auth","economy","combat","inventory","admin","system","zombies","redzone"];

  return (
    <>
      <PageHeader
        title="Logs"
        description={`${allLogs.length} entries in the last hour · tailing live.`}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex h-8 flex-1 min-w-[280px] max-w-md items-center gap-1.5 rounded-md border border-[#2a2a32] bg-[#141418] px-2.5">
          <Search className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages, actors…" className="w-full bg-transparent text-[12.5px] text-zinc-200 placeholder:text-zinc-600" />
        </div>
        <Select label="Level" value={level} onChange={(v) => setLevel(v as LogEntry["level"] | "all")} options={["all","info","warn","error","admin","security"]} />
        <Select label="Area" value={area} onChange={(v) => setArea(v as LogEntry["area"] | "all")} options={["all", ...areas]} />
        <div className="ml-auto flex items-center gap-2 font-mono text-[11px] tabular text-zinc-500">
          <span>{filtered.length}</span><span className="text-zinc-700">/</span><span>{allLogs.length}</span>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#252529] bg-[#121216] font-mono">
        <ol>
          {filtered.map((l) => {
            const m = levelMeta[l.level];
            const Icon = m.icon;
            return (
              <li key={l.id} className="motion-soft group grid grid-cols-[72px_64px_72px_minmax(0,1fr)_120px] items-center gap-3 border-b border-[#1d1d22] px-3 py-2 last:border-b-0 hover:bg-[#18181c]">
                <span className="text-[10.5px] tabular text-zinc-500">
                  {new Date(l.ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                </span>
                <span className={cn("inline-flex w-fit items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-tight ring-1 ring-inset", m.tint)}>
                  <Icon className="h-2.5 w-2.5" strokeWidth={2.25} />
                  {m.label}
                </span>
                <span className="text-[10.5px] uppercase tracking-[0.06em] text-zinc-500">{l.area}</span>
                <span className="truncate text-[12px] text-zinc-300 group-hover:text-zinc-100">{l.message}</span>
                <span className="truncate text-right text-[10.5px] text-zinc-500">
                  {l.actor && <>by {l.actor}</>}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-3 flex items-center justify-between text-[10.5px] text-zinc-600">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Tailing live</span>
        </div>
        <span className="font-mono">retention 30 days</span>
      </div>
    </>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="motion-soft flex h-8 items-center gap-1.5 rounded-md border border-[#2a2a32] bg-[#141418] px-2.5 text-[12px] text-zinc-400 hover:border-[#383841]">
      <span className="text-zinc-500">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="cursor-pointer bg-transparent text-zinc-200 outline-none [&>option]:bg-[#141418]">
        {options.map((o) => <option key={o} value={o}>{o === "all" ? "any" : o}</option>)}
      </select>
    </label>
  );
}
