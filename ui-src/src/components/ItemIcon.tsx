import { useEffect, useState } from "react";
import {
  Crosshair, Target, Zap, Beef, GlassWater, Pill, Bandage,
  Hammer, ScrollText, Bike, Wrench, Sword,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { rarityMeta, type Item } from "@/lib/data";
import { IS_NUI } from "@/lib/nui";
import { useItem } from "@/lib/itemsCatalog";

// Lucide fallback when the catalog has no image filename for an item.
const categoryIcon: Record<Item["category"], typeof Crosshair> = {
  pistol:     Crosshair,
  smg:        Target,
  rifle:      Crosshair,
  shotgun:    Zap,
  ammo:       Sword,
  consumable: Bandage,
  food:       Beef,
  drink:      GlassWater,
  medical:    Pill,
  material:   Hammer,
  blueprint:  ScrollText,
  vehicle:    Bike,
};

// In NUI, we point straight at corex-inventory's html/images/ folder via the
// cfx-nui-<resource> scheme — the documented way to fetch a sibling resource's
// `files {}` from CEF. Any item added to corex-inventory's items.lua works
// automatically — no rebuild, no file copy in corex-admin.
// In dev (browser), we fall back to the bundled copies under public/items/.
const INV_HOST = 'https://cfx-nui-corex-inventory/html/images/';

/**
 * Build the <img src> for an item. `image` is the EXACT filename from
 * corex-inventory's items.lua (e.g. "Ceramic_Pistol.png"). Returns null if
 * we have nothing to render — caller should show the lucide fallback.
 */
export function imageFor(item: Pick<Item, "id" | "image">): string | null {
  const filename = item.image || `${item.id}.png`;
  if (!filename) return null;
  if (IS_NUI) return INV_HOST + filename;
  // Dev mode (browser preview): the cfx-nui-* protocol is CEF-only, so this
  // path returns null and the caller falls back to the lucide category icon.
  // We do NOT bundle item PNGs — corex-inventory owns the icon source.
  return null;
}

export function categoryFallbackIcon(category: Item["category"]): typeof Crosshair {
  return categoryIcon[category] ?? Wrench;
}

type Props = {
  item: Item;
  size?: "sm" | "md" | "lg";
  showRarityRing?: boolean;
  className?: string;
};

export function ItemIcon({ item, size = "md", showRarityRing = true, className }: Props) {
  // Resolve against the live catalog so the `image` field is always current,
  // even if the caller passed a stale Item snapshot from mock data.
  const live = useItem(item.id) ?? item;
  const FallbackIcon = categoryIcon[live.category ?? item.category] ?? Wrench;
  const r = rarityMeta[live.rarity ?? item.rarity];
  const sz = { sm: "h-7 w-7", md: "h-10 w-10", lg: "h-12 w-12" }[size];
  const iconSize = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" }[size];
  const imgPad = { sm: "p-0.5", md: "p-1", lg: "p-1" }[size];
  const src = imageFor(live);

  // Reset the "errored" flag when src changes — without this, the first failed
  // URL (often a stale guess before the catalog arrives) sticks forever and we
  // render the lucide fallback even after the real `image` field is known.
  const [errored, setErrored] = useState(false);
  useEffect(() => { setErrored(false); }, [src]);

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-md ring-1 ring-inset",
        sz,
        r.bg,
        showRarityRing ? r.ring : "ring-[#2f2f38]",
        className,
      )}
      title={`${live.label ?? item.label} · ${r.label.toLowerCase()}`}
    >
      {errored || !src ? (
        <FallbackIcon className={cn(iconSize, r.color)} strokeWidth={1.75} />
      ) : (
        <img
          src={src}
          alt={live.label ?? item.label}
          loading="lazy"
          draggable={false}
          onError={() => setErrored(true)}
          className={cn("h-full w-full object-contain", imgPad)}
        />
      )}
    </span>
  );
}
