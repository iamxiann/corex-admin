import { useState } from "react";
import {
  Skull, Trash2, Plus, CloudRain, Sun, CloudSnow, Cloud,
  Zap as Lightning, MapPin, Power, Clock, Users,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { zombieStats, zonesData, weather, type ZoneInfo } from "@/lib/data";
import { cn } from "@/lib/cn";

const weatherTypes = [
  { id: "clear",     label: "Clear",       icon: Sun },
  { id: "clouds",    label: "Clouds",      icon: Cloud },
  { id: "rain",      label: "Light Rain",  icon: CloudRain },
  { id: "thunder",   label: "Thunder",     icon: Lightning },
  { id: "snow",      label: "Snow",        icon: CloudSnow },
];

const zoneNames = ["Sandy Shores", "Paleto Bay", "Grapeseed", "Mt Chiliad", "Vinewood Hills", "Vespucci Beach"];

export function WorldPage() {
  return (
    <>
      <PageHeader
        title="World controls"
        description="Live tools that affect every player on the server. Use sparingly."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left column */}
        <div className="space-y-4">
          <ZombiesCard />
          <RedZonesCard />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <WeatherCard />
          <EventsCard />
        </div>
      </div>
    </>
  );
}

function ZombiesCard() {
  const [zone, setZone] = useState(zoneNames[0]);
  const [count, setCount] = useState(5);
  const [type, setType] = useState<string>("brute");
  return (
    <section className="overflow-hidden rounded-xl border border-[#252529] bg-[#121216]">
      <header className="flex items-center justify-between border-b border-[#1d1d23] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Skull className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          <h3 className="text-[13px] font-medium text-zinc-100">Zombies</h3>
        </div>
        <span className="font-mono text-[10.5px] tabular text-zinc-500">
          horde in {zombieStats.hordeNext}
        </span>
      </header>

      <div className="grid grid-cols-3 divide-x divide-[#1d1d23] border-b border-[#1d1d23]">
        <BigStat label="Alive now" value={zombieStats.alive.toString()} hint="across all zones" />
        <BigStat label="Killed today" value={zombieStats.killedToday.toLocaleString()} hint="all players" tone="emerald" />
        <BigStat label="Max global" value="150" hint="server cap" />
      </div>

      {/* By type breakdown */}
      <div className="border-b border-[#1d1d23] p-3">
        <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">By type</div>
        <div className="grid grid-cols-5 gap-2">
          {zombieStats.byType.map((t) => (
            <div key={t.id} className="rounded-md border border-[#1d1d23] bg-[#18181c] px-2 py-1.5">
              <div className="text-[10px] text-zinc-500">{t.label}</div>
              <div className="font-mono text-[14px] font-medium tabular text-zinc-100">{t.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 p-3.5">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">Spawn / clear</div>
        <div className="flex flex-wrap items-center gap-2">
          <Select label="Zone" value={zone} onChange={setZone} options={zoneNames} />
          <Select label="Type" value={type} onChange={setType} options={["brute","runner","grabber","electric","walker","random"]} />
          <label className="flex h-8 items-center gap-2 rounded-md border border-[#2f2f38] bg-[#141418] px-2.5">
            <span className="text-[11.5px] text-zinc-500">Count</span>
            <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-14 bg-transparent text-center font-mono text-[12.5px] tabular text-zinc-100 outline-none" />
          </label>
          <button className="motion-soft flex h-8 items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-500/[0.08] px-2.5 text-[12px] font-medium text-emerald-300 hover:border-emerald-600/60 hover:bg-emerald-500/[0.12]">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            Spawn
          </button>
          <button className="motion-soft flex h-8 items-center gap-1.5 rounded-md border border-rose-900/40 bg-rose-950/30 px-2.5 text-[12px] text-rose-300 hover:border-rose-800/60 hover:bg-rose-950/50">
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            Clear all in {zone}
          </button>
        </div>
      </div>
    </section>
  );
}

function RedZonesCard() {
  const [zones, setZones] = useState(zonesData);
  const toggle = (id: string) => {
    setZones((zs) => zs.map((z) => z.id === id ? { ...z, enabled: !z.enabled } : z));
  };
  return (
    <section className="overflow-hidden rounded-xl border border-[#252529] bg-[#121216]">
      <header className="flex items-center justify-between border-b border-[#1d1d23] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          <h3 className="text-[13px] font-medium text-zinc-100">Zones</h3>
        </div>
        <span className="font-mono text-[10.5px] tabular text-zinc-500">
          {zones.filter((z) => z.enabled).length} of {zones.length} active
        </span>
      </header>
      <ul className="divide-y divide-[#1d1d22]">
        {zones.map((z) => <ZoneRow key={z.id} zone={z} onToggle={() => toggle(z.id)} />)}
      </ul>
    </section>
  );
}

function ZoneRow({ zone: z, onToggle }: { zone: ZoneInfo; onToggle: () => void }) {
  return (
    <li className="motion-soft grid grid-cols-[14px_minmax(0,1fr)_88px_92px_92px_40px] items-center gap-3 px-3.5 py-2.5 hover:bg-[#1d1d23]">
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        !z.enabled ? "bg-zinc-700" : z.type === "redzone" ? "bg-rose-500" : "bg-emerald-400",
      )} />
      <div className="min-w-0">
        <div className="truncate text-[12.5px] font-medium text-zinc-100">{z.label}</div>
        <div className="font-mono text-[10.5px] uppercase tracking-tight text-zinc-600">{z.type}</div>
      </div>
      <span className={cn(
        "rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-tight ring-1 ring-inset",
        z.enabled ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" : "bg-zinc-700/20 text-zinc-400 ring-zinc-600/30",
      )}>
        {z.enabled ? "ENABLED" : "DISABLED"}
      </span>
      <div className="flex items-center gap-1 font-mono text-[11px] tabular text-zinc-400">
        <Users className="h-2.5 w-2.5 text-zinc-600" strokeWidth={2} />
        {z.playersInside} inside
      </div>
      <div className="flex items-center gap-1 font-mono text-[11px] tabular text-zinc-400">
        {z.type === "redzone" && (
          <>
            <Clock className="h-2.5 w-2.5 text-zinc-600" strokeWidth={2} />
            refill {z.refillIn}
          </>
        )}
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "motion-soft relative flex h-4 w-8 shrink-0 items-center rounded-full transition-colors",
          z.enabled ? "bg-emerald-500/40" : "bg-[#2a2a32]",
        )}
        aria-label="Toggle"
      >
        <span className={cn("absolute h-3 w-3 rounded-full bg-zinc-100 transition-all", z.enabled ? "left-[18px]" : "left-1")} />
      </button>
    </li>
  );
}

function WeatherCard() {
  const [active, setActive] = useState("clear");
  return (
    <section className="overflow-hidden rounded-xl border border-[#252529] bg-[#121216]">
      <header className="flex items-center justify-between border-b border-[#1d1d23] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          <h3 className="text-[13px] font-medium text-zinc-100">Weather</h3>
        </div>
        <span className="font-mono text-[10.5px] tabular text-zinc-500">
          changes in {weather.changeIn}
        </span>
      </header>

      <div className="border-b border-[#1d1d23] p-4 text-center">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">Current</div>
        <div className="mt-1 font-mono text-[20px] font-semibold tracking-tight text-zinc-50">{weather.current}</div>
        <div className="mt-0.5 font-mono text-[11px] tabular text-zinc-600">next: {weather.next}</div>
      </div>

      <div className="p-3">
        <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">Force weather</div>
        <div className="grid grid-cols-5 gap-1.5">
          {weatherTypes.map((w) => {
            const W = w.icon;
            const a = active === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setActive(w.id)}
                className={cn(
                  "motion-soft flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-[10.5px]",
                  a ? "border-zinc-600 bg-[#252529] text-zinc-100" : "border-[#2f2f38] bg-[#141418] text-zinc-400 hover:border-[#383841] hover:text-zinc-200",
                )}
              >
                <W className="h-3.5 w-3.5" strokeWidth={1.75} />
                {w.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EventsCard() {
  return (
    <section className="overflow-hidden rounded-xl border border-[#252529] bg-[#121216]">
      <header className="flex items-center justify-between border-b border-[#1d1d23] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Power className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          <h3 className="text-[13px] font-medium text-zinc-100">Server tools</h3>
        </div>
      </header>
      <div className="divide-y divide-[#1d1d22]">
        <ToolRow label="Restart server (soft)" hint="Players will be warned 1 minute before." tone="warn" />
        <ToolRow label="Save all players" hint="Force-save state to DB now." />
        <ToolRow label="Broadcast announcement" hint="Push a notification to every player." />
        <ToolRow label="Toggle PvP globally" hint="Affects all non-redzone areas." tone="warn" />
        <ToolRow label="Trigger horde migration" hint="Force the next horde cycle now." />
      </div>
    </section>
  );
}

function ToolRow({ label, hint, tone }: { label: string; hint: string; tone?: "warn" }) {
  return (
    <button className="motion-soft flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-[#1d1d23]">
      <div className="min-w-0">
        <div className={cn("text-[12.5px] font-medium", tone === "warn" ? "text-amber-300" : "text-zinc-200")}>
          {label}
        </div>
        <div className="text-[11px] text-zinc-500">{hint}</div>
      </div>
      <span className="font-mono text-[10.5px] text-zinc-600">→</span>
    </button>
  );
}

function BigStat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "emerald" }) {
  return (
    <div className="px-3.5 py-3">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">{label}</div>
      <div className={cn("mt-1 font-mono text-[20px] font-semibold tabular tracking-tight", tone === "emerald" ? "text-emerald-300" : "text-zinc-50")}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10.5px] text-zinc-600">{hint}</div>}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="motion-soft flex h-8 items-center gap-1.5 rounded-md border border-[#2f2f38] bg-[#141418] px-2.5 text-[12px] text-zinc-400 hover:border-[#383841]">
      <span className="text-zinc-500">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="cursor-pointer bg-transparent text-zinc-200 outline-none [&>option]:bg-[#141418]">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
