// Player-facing report form. The same NUI bundle hosts both modes:
//   /admin   → full admin panel (this is App.tsx's main view)
//   /report  → just this form, centered on screen
// Lua side picks the mode by sending {type:'visibility', payload:{open:true, mode:'report'}}.

import { useEffect, useState } from "react";
import {
  X, Send, ShieldX, MessageSquareWarning, Crosshair, Bug, AlertOctagon, Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { closeNui } from "@/lib/nui";
import type { ReportCategory } from "@/lib/data";
import { cn } from "@/lib/cn";

const categories: Array<{ id: ReportCategory; label: string; desc: string; icon: typeof ShieldX; tone: string }> = [
  { id: "cheating",   label: "Cheating",   desc: "Aimbot, ESP, exploits, duping",       icon: ShieldX,              tone: "text-rose-400 ring-rose-500/30 bg-rose-500/[0.08]" },
  { id: "harassment", label: "Harassment", desc: "Toxic voice/chat, racism, slurs",     icon: MessageSquareWarning, tone: "text-orange-400 ring-orange-500/30 bg-orange-500/[0.08]" },
  { id: "rdm",        label: "RDM / VDM",  desc: "Random killing, vehicle ramming",     icon: Crosshair,            tone: "text-amber-400 ring-amber-500/30 bg-amber-500/[0.08]" },
  { id: "bug",        label: "Bug",        desc: "Stuck, missing item, broken script",  icon: Bug,                  tone: "text-violet-400 ring-violet-500/30 bg-violet-500/[0.08]" },
  { id: "other",      label: "Other",      desc: "Anything not in the categories above",icon: AlertOctagon,         tone: "text-zinc-300 ring-zinc-600/30 bg-zinc-700/20" },
];

export function ReportForm() {
  const [category, setCategory] = useState<ReportCategory>("cheating");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeNui(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const canSubmit = !submitting && description.trim().length >= 10;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true); setError(null);
    try {
      await api.reportSubmit(category, description.trim());
      setSuccess(true);
      setTimeout(closeNui, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" onClick={closeNui}>
        <div onClick={(e) => e.stopPropagation()} className="flex w-[min(50vw,520px)] flex-col items-center gap-3 rounded-2xl border border-emerald-700/40 bg-[#0e0e11] p-8 text-center shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <Check className="h-6 w-6 text-emerald-300" strokeWidth={2.25} />
          </div>
          <div className="text-[15px] font-medium text-zinc-100">Report sent</div>
          <div className="text-[12px] text-zinc-500">Staff will review it shortly. Thanks for keeping the server clean.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center" onClick={closeNui}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[min(55vw,640px)] max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-[#2f2f38] bg-[#0e0e11] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-[#272730] bg-[#18181c] px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-zinc-50">File a report</h2>
            <p className="mt-0.5 text-[11.5px] text-zinc-500">
              Submitted to on-duty staff. False reports may be punished — provide accurate detail.
            </p>
          </div>
          <button onClick={closeNui} className="motion-soft flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-[#252529] hover:text-zinc-200">
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Category */}
          <div>
            <div className="mb-2 text-[11.5px] font-medium text-zinc-300">Category <span className="text-rose-400">*</span></div>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "motion-soft flex items-start gap-2 rounded-md border px-2.5 py-2 text-left",
                      active
                        ? "border-zinc-500 bg-[#252529]"
                        : "border-[#2f2f38] bg-[#141418] hover:border-[#383841]",
                    )}
                  >
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ring-inset", c.tone)}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <div className={cn("text-[12px] font-medium", active ? "text-zinc-50" : "text-zinc-200")}>{c.label}</div>
                      <div className="text-[10.5px] text-zinc-500">{c.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11.5px] font-medium text-zinc-300">
                What happened? <span className="text-rose-400">*</span>
              </label>
              <span className={cn("font-mono text-[10px] tabular", description.length >= 10 ? "text-zinc-500" : "text-amber-400")}>
                {description.length} / 600 (min 10)
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 600))}
              rows={5}
              placeholder="Describe the incident: where, when, what exactly happened. Mention clips, times, locations. Be specific."
              className="w-full resize-none rounded-md border border-[#2f2f38] bg-[#141418] px-3 py-2 text-[12.5px] leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#46464e]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-rose-700/40 bg-rose-950/40 px-3 py-2 text-[11.5px] text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 border-t border-[#272730] bg-[#101013] px-4 py-3">
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] tabular text-zinc-600">
            <kbd className="rounded border border-[#33333c] bg-[#18181c] px-1 py-0 text-[9.5px]">esc</kbd>
            <span>to cancel</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={closeNui} disabled={submitting} className="motion-soft h-8 rounded-md border border-[#2f2f38] bg-[#18181c] px-3 text-[12px] text-zinc-300 hover:border-[#383841] hover:text-zinc-100 disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="motion-soft flex h-8 items-center gap-1.5 rounded-md bg-zinc-100 px-3 text-[12px] font-semibold text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2.25} />
              {submitting ? "Sending…" : "Submit report"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
