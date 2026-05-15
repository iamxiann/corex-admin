import { PageHeader } from "@/components/PageHeader";
import { staff, type StaffMember } from "@/lib/data";
import { cn } from "@/lib/cn";

const rankTone: Record<StaffMember["rank"], string> = {
  "Head Admin":   "text-amber-300 bg-amber-500/[0.08] ring-amber-500/20",
  "Senior Admin": "text-zinc-100 bg-zinc-700/30 ring-zinc-600/30",
  "Admin":        "text-zinc-200 bg-zinc-800/50 ring-zinc-700/40",
  "Moderator":    "text-zinc-300 bg-zinc-800/40 ring-zinc-700/30",
  "Helper":       "text-zinc-400 bg-zinc-800/30 ring-zinc-700/30",
};

const statusMeta: Record<StaffMember["status"], { tone: string; label: string }> = {
  "on-duty":       { tone: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20", label: "ON-DUTY" },
  "investigating": { tone: "bg-amber-500/10 text-amber-300 ring-amber-500/20",       label: "INVESTIGATING" },
  "off-duty":      { tone: "bg-zinc-700/20 text-zinc-400 ring-zinc-600/30",          label: "OFF-DUTY" },
};

export function StaffPage() {
  const onDuty = staff.filter((s) => s.status !== "off-duty").length;
  const total  = staff.length;
  const actionsToday = staff.reduce((s, m) => s + m.actionsToday, 0);

  return (
    <>
      <PageHeader
        title="Staff"
        description={`${onDuty} of ${total} on duty · ${actionsToday} admin actions today.`}
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((m) => (
          <article key={m.id} className="motion-soft group overflow-hidden rounded-xl border border-[#252529] bg-[#121216] hover:border-[#33333c]">
            <header className="flex items-start gap-3 p-3.5">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2832] text-[12px] font-semibold text-zinc-100 ring-1 ring-white/[0.06]">
                  {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                {m.status !== "off-duty" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#121216]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-zinc-50">{m.name}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={cn("rounded-sm px-1.5 py-0 font-mono text-[9.5px] font-semibold uppercase tracking-tight ring-1 ring-inset", rankTone[m.rank])}>
                    {m.rank}
                  </span>
                  <span className={cn("rounded-sm px-1.5 py-0 font-mono text-[9.5px] font-semibold uppercase tracking-tight ring-1 ring-inset", statusMeta[m.status].tone)}>
                    {statusMeta[m.status].label}
                  </span>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-2 divide-x divide-[#1d1d23] border-t border-[#1d1d23]">
              <div className="px-3 py-2">
                <div className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">Today</div>
                <div className="mt-0.5 font-mono text-[14px] font-medium tabular text-zinc-50">
                  {m.actionsToday} <span className="text-[10px] font-normal text-zinc-500">actions</span>
                </div>
              </div>
              <div className="px-3 py-2">
                <div className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">This week</div>
                <div className="mt-0.5 font-mono text-[14px] font-medium tabular text-zinc-50">
                  {m.hoursThisWeek}<span className="text-[10px] font-normal text-zinc-500">h on duty</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
