// corex-admin · items catalog provider
//
// Single source of truth for item metadata. On mount we fetch the LIVE catalog
// from the server (which itself pulls from `corex-inventory:GetFullCatalog`).
// This means: when a server owner adds a new item to corex-inventory/shared/
// items.lua, the admin panel picks it up automatically — no rebuild required.
//
// The static mock catalog is only used as initial state in dev mode (or during
// the first paint before the API resolves).

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { items as mockItems, type Item } from "./data";
import { api } from "./api";

type Catalog = Map<string, Item>;

const seed: Catalog = new Map(mockItems.map((i) => [i.id, i]));
const ItemsContext = createContext<Catalog>(seed);

export const useItemsCatalog = () => useContext(ItemsContext);

/** Resolve an item by id. Returns undefined if the catalog doesn't know it. */
export function useItem(id: string | null | undefined): Item | undefined {
  const catalog = useItemsCatalog();
  if (!id) return undefined;
  return catalog.get(id);
}

export function ItemsCatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(seed);

  useEffect(() => {
    let alive = true;
    api.getItems()
      .then((list) => {
        if (!alive || !Array.isArray(list) || list.length === 0) return;
        setCatalog(new Map(list.map((i) => [i.id, i])));
      })
      .catch(() => { /* keep mock seed */ });
    return () => { alive = false; };
  }, []);

  return <ItemsContext.Provider value={catalog}>{children}</ItemsContext.Provider>;
}
