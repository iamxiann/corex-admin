export type PageId =
  | "overview"
  | "players"
  | "inventory"
  | "bans"
  | "reports"
  | "world"
  | "logs"
  | "staff";

export const pageLabels: Record<PageId, string> = {
  overview:  "Overview",
  players:   "Players",
  inventory: "Inventory",
  bans:      "Bans",
  reports:   "Reports",
  world:     "World",
  logs:      "Logs",
  staff:     "Staff",
};
