import { Bell, Search } from "lucide-react";
import { pageLabels, type PageId } from "@/lib/nav";

type Props = {
  onOpenPalette: () => void;
  onlineCount: number;
  reportsOpen: number;
  currentPage: PageId;
  onOpenReports: () => void;
};

export function Topbar({ onOpenPalette, reportsOpen, currentPage, onOpenReports }: Props) {
  return (
    <header className="relative z-10 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-[#252529] bg-[#18181c]/80 px-5 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-4">
        <nav className="flex items-center gap-1.5 text-[12px] text-zinc-500">
          <span className="text-zinc-300">{pageLabels[currentPage]}</span>
        </nav>
      </div>

      <button
        onClick={onOpenPalette}
        className="motion-soft group flex h-7 w-full max-w-[440px] items-center gap-2 rounded-md border border-[#2a2a32] bg-[#1d1d23] px-2.5 text-left text-zinc-500 hover:border-[#33333c] hover:bg-[#121215]"
      >
        <Search className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-400" strokeWidth={2} />
        <span className="flex-1 text-[12px]">Search players, actions, IDs…</span>
        <kbd className="rounded border border-[#33333c] bg-[#1d1d22] px-1.5 py-[1px] font-mono text-[10px] tracking-tight text-zinc-400">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenReports}
          className="motion-soft relative flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2 text-[11.5px] text-zinc-400 hover:border-[#2c2c33] hover:bg-[#18181c] hover:text-zinc-200"
          title="Open reports"
        >
          <Bell className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="hidden md:inline">Reports</span>
          {reportsOpen > 0 && (
            <span className="flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-rose-500/20 px-1 font-mono text-[9.5px] font-semibold text-rose-300 ring-1 ring-rose-500/30">
              {reportsOpen}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
