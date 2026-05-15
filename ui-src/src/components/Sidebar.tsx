import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  Gavel,
  Globe2,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import type { PageId } from "@/lib/nav";

type NavItem = {
  id: PageId;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: string | null;
  badgeTone?: "warn" | "neutral";
};

// Only wired pages are shown. World/Logs/Staff stay in the codebase but
// hidden until they have real backends — better than showing fake data.
const nav: NavItem[] = [
  { id: "overview",  icon: LayoutDashboard, label: "Overview" },
  { id: "players",   icon: Users,           label: "Players" },
  { id: "inventory", icon: Package,         label: "Inventory" },
  { id: "bans",      icon: Gavel,           label: "Bans" },
  { id: "reports",   icon: Receipt,         label: "Reports" },
];
// Suppress unused import warnings for icons we keep around for future re-add.
void Globe2; void ShieldCheck;

type Props = {
  currentPage: PageId;
  onNavigate: (id: PageId) => void;
};

type Branding = { serverName: string; tagline: string; logo: string; monogram: string };
type Me = { id: number; name: string; mugshot: string; rank: string; branding: Branding };

const DEFAULT_BRANDING: Branding = {
  serverName: "CoreX",
  tagline:    "",
  logo:       "",
  monogram:   "CX",
};

export function Sidebar({ currentPage, onNavigate }: Props) {
  const [me, setMe] = useState<Me | null>(null);
  const [logoErrored, setLogoErrored] = useState(false);

  // Pull the actor's identity once when the panel mounts. The endpoint is
  // tiny so we don't bother polling — the sidebar footer is static for the
  // lifetime of an admin session.
  useEffect(() => {
    let alive = true;
    api.getMe().then((data) => { if (alive) setMe(data); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const branding = me?.branding ?? DEFAULT_BRANDING;
  // Show the configured logo as an <img>; on load failure fall back to the
  // 2-letter monogram. Same logic for the case where the owner intentionally
  // left Logo='' — we just render the monogram badge directly.
  const showLogoImg = branding.logo && !logoErrored;

  return (
    <aside className="relative z-10 flex h-full w-[232px] shrink-0 flex-col border-r border-[#2a2a32] bg-[#101014]/70 backdrop-blur-sm">
      <div className="px-3 pt-4">
        {/* Header tile — clean, no chevron, not a button. The original "switch
            server" affordance was misleading since this panel only ever
            controls one server. */}
        <div className="flex w-full items-center gap-2.5 rounded-lg border border-[#2a2a32] bg-[#18181c] px-2.5 py-2">
          <div className="relative">
            {showLogoImg ? (
              <img
                src={branding.logo}
                onError={() => setLogoErrored(true)}
                alt=""
                className="h-7 w-7 rounded-md object-cover ring-1 ring-white/[0.06]"
                draggable={false}
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b from-[#33333c] to-[#1d1d22] ring-1 ring-white/[0.06]">
                <span className="font-mono text-[10px] font-semibold tracking-tighter text-zinc-200">
                  {(branding.monogram || "CX").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#101014]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium text-zinc-100">{branding.serverName}</div>
            {branding.tagline && (
              <div className="truncate text-[10.5px] text-zinc-500">{branding.tagline}</div>
            )}
          </div>
        </div>
      </div>

      <nav className="mt-5 flex-1 overflow-y-auto px-2">
        <div className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600">
          Manage
        </div>
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "motion-soft group relative flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[12.5px]",
                    active
                      ? "bg-[#151518] text-zinc-50"
                      : "text-zinc-400 hover:bg-[#18181c] hover:text-zinc-200",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded-r-full bg-zinc-100" />
                  )}
                  <Icon className={cn("h-[15px] w-[15px] shrink-0", active ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300")} strokeWidth={1.75} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[10px] tabular tracking-tight",
                        item.badgeTone === "warn"
                          ? "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20"
                          : "bg-[#33333c] text-zinc-400",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[#1d1d22] p-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          {me ? (
            <Avatar name={me.name} id={me.id} mugshot={me.mugshot} size="sm" />
          ) : (
            <div className="h-7 w-7 shrink-0 rounded-full bg-[#1d1d22] ring-1 ring-white/[0.04]" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11.5px] font-medium text-zinc-200">
              {me?.name ?? "…"}
            </div>
            <div className="truncate text-[10px] text-zinc-500">
              {me?.rank ?? "Staff"}
            </div>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>
    </aside>
  );
}
