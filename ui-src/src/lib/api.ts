// corex-admin · typed API client
//
// Every function here matches one server lib.callback (server/main.lua) and one
// NUI relay (client/nui.lua). The shape of `args` is preserved verbatim — the
// server unpacks the array as positional parameters.
//
// Components migrate from importing `players` (static) in data.ts to calling
// `api.getPlayers()` (live). Both paths work; pick whichever the page needs.

import { nuiFetch } from "./nui";
import {
  players as mockPlayers,
  bans as mockBans,
  items as mockItems,
  type Player,
  type Ban,
  type Item,
  type Report,
  type ReportCategory,
  type AdminAction,
} from "./data";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(name: string, args: unknown[] = [], mock?: () => T): Promise<T> {
  // IMPORTANT: send `args` as a real JSON array. When Lua decodes the JSON
  // body, an array becomes a 1-indexed Lua table that `table.unpack` can
  // expand into positional callback parameters. Sending an object (e.g.
  // {"0":..., "1":...}) decodes to string-keyed Lua keys and unpack returns nil.
  const res = await nuiFetch<Result<T>>(name, { args }, () => {
    if (!mock) throw new Error(`api(${name}): no dev mock`);
    return { ok: true, data: mock() };
  });
  if (!res.ok) throw new Error(res.error || name);
  return res.data;
}

// --------- READ ----------

export type ServerSummary = {
  players: { total: number; active: number; dead: number; spectating: number; loading: number };
  maxPlayers: number;
  uptime: number;
  zombies: { alive: number; killedToday: number; hordeNext: string };
  redzones: { activeCount: number; totalCount: number; playersInside: number };
  weather: { current: string; next: string; changeIn: string };
  inventory: { gridSize: number };
};

export const api = {
  getOverview: () =>
    call<ServerSummary>("overview", [], () => ({
      players: {
        total: mockPlayers.length,
        active: mockPlayers.filter((p) => p.lifecycle === "active").length,
        dead: mockPlayers.filter((p) => p.lifecycle === "dead").length,
        spectating: mockPlayers.filter((p) => p.lifecycle === "spectating").length,
        loading: mockPlayers.filter((p) => p.lifecycle === "loading").length,
      },
      maxPlayers: 32,
      uptime: Math.floor(Date.now() / 1000),
      zombies:  { alive: 0, killedToday: 0, hordeNext: "—" },
      redzones: { activeCount: 0, totalCount: 0, playersInside: 0 },
      weather:  { current: "—", next: "—", changeIn: "—" },
      inventory: { gridSize: 80 },
    })),

  getPlayers: () => call<Player[]>("players", [], () => mockPlayers),

  getPlayer: (id: number) =>
    call<Player | null>("player", [id], () => mockPlayers.find((p) => p.id === id) ?? null),

  getItems: () => call<Item[]>("items", [], () => mockItems),

  getBans: (filter: "active" | "expired" | "lifted" | "all" = "active") =>
    call<Ban[]>("bans", [filter], () =>
      filter === "all" ? mockBans : mockBans.filter((b) => b.status === filter),
    ),

  // Recent admin actions for the Overview "Recent admin actions" panel.
  // Server caps at 200 rows; the default is fine for the UI.
  getRecentActions: (limit = 30) =>
    call<AdminAction[]>("actions.recent", [limit], () => []),

  // Profile of the admin who opened the panel + server branding — feeds
  // the sidebar (header logo/name + footer admin chip) in one roundtrip.
  getMe: () =>
    call<{
      id: number; name: string; mugshot: string; rank: string;
      branding: { serverName: string; tagline: string; logo: string; monogram: string };
    }>("me", [], () => ({
      id: 1, name: "Admin", mugshot: "", rank: "Admin",
      branding: { serverName: "CoreX · Survival #1", tagline: "zombie", logo: "", monogram: "CX" },
    })),

  // --------- ACTIONS ----------

  kick:      (target: number, reason: string)                                     => call<boolean>("action.kick",       [target, reason],          () => true),
  warn:      (target: number, reason: string)                                     => call<boolean>("action.warn",       [target, reason],          () => true),
  revive:    (target: number)                                                     => call<boolean>("action.revive",     [target],                  () => true),
  teleport:  (target: number)                                                     => call<boolean>("action.teleport",   [target],                  () => true),
  spectate:  (target: number)                                                     => call<boolean>("action.spectate",   [target],                  () => true),
  giveMoney: (target: number, kind: "cash" | "bank", amount: number)              => call<boolean>("action.giveMoney",  [target, kind, amount],    () => true),
  setMoney:  (target: number, kind: "cash" | "bank", amount: number)              => call<boolean>("action.setMoney",   [target, kind, amount],    () => true),
  giveItem:  (target: number, itemId: string, count: number)                      => call<boolean>("action.giveItem",   [target, itemId, count],   () => true),
  removeItem:(target: number, itemId: string, count: number)                      => call<boolean>("action.removeItem", [target, itemId, count],   () => true),
  announce:  (message: string, targets?: number[])                                => call<boolean>("action.announce",   [message, targets ?? null],() => true),

  banCreate: (target: number, duration: string, reason: string)                   => call<number>("bans.create",        [target, duration, reason],() => Date.now()),
  banLift:   (banId: number)                                                      => call<boolean>("bans.lift",         [banId],                   () => true),
  banExtend: (banId: number, addSeconds: number)                                  => call<boolean>("bans.extend",       [banId, addSeconds],       () => true),

  // ---- Reports ----
  getReports: (filter: "open" | "resolved" | "all" = "open") =>
    call<Report[]>("reports.list", [filter], () => []),
  reportsCount: () => call<number>("reports.count", [], () => 0),
  reportSubmit: (category: ReportCategory, description: string) =>
    call<number>("reports.submit", [category, description], () => Date.now()),
  reportResolve: (id: number, status: "resolved" | "dismissed") =>
    call<boolean>("reports.resolve", [id, status], () => true),
};
