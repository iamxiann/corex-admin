// corex-admin · mock data — DEV ONLY
//
// Components import from `data.ts`. In dev mode that file re-exports the
// arrays below. In production (`bun run build`), the conditional dead-code
// eliminates the re-export and this entire module gets tree-shaken out of
// the final bundle. So no fake data ever ships to the FiveM NUI.

import type {
  Player, Ban, Item, AdminAction, ZoneInfo, ZombieStats, WeatherInfo,
  LogEntry, StaffMember, InventorySlot, LifecycleState,
} from "./data";

// ----- Items catalog (mirrors corex-inventory/shared/items.lua) ----------

export const items: Item[] = [
  // Pistols
  { id: "weapon_pistol",        label: "Pistol",         weight: 1.2, size: { w: 2, h: 1 }, stackable: false, category: "pistol", rarity: "common" },
  { id: "weapon_pistol_mk2",    label: "Pistol MK2",     weight: 1.3, size: { w: 2, h: 1 }, stackable: false, category: "pistol", rarity: "uncommon" },
  { id: "weapon_ceramicpistol", label: "Ceramic Pistol", weight: 1.0, size: { w: 2, h: 1 }, stackable: false, category: "pistol", rarity: "common" },
  { id: "weapon_doubleaction",  label: "Double Action",  weight: 1.5, size: { w: 2, h: 1 }, stackable: false, category: "pistol", rarity: "uncommon" },
  { id: "weapon_tecpistol",     label: "Tec Pistol",     weight: 1.4, size: { w: 2, h: 1 }, stackable: false, category: "pistol", rarity: "rare" },
  { id: "weapon_combatpistol",  label: "Combat Pistol",  weight: 1.2, size: { w: 2, h: 1 }, stackable: false, category: "pistol", rarity: "common" },
  { id: "weapon_appistol",      label: "AP Pistol",      weight: 1.3, size: { w: 2, h: 1 }, stackable: false, category: "pistol", rarity: "uncommon" },
  { id: "weapon_snspistol",     label: "SNS Pistol",     weight: 0.8, size: { w: 1, h: 1 }, stackable: false, category: "pistol", rarity: "common" },
  { id: "weapon_heavypistol",   label: "Heavy Pistol",   weight: 1.6, size: { w: 2, h: 1 }, stackable: false, category: "pistol", rarity: "uncommon" },
  { id: "weapon_vintagepistol", label: "Vintage Pistol", weight: 1.1, size: { w: 2, h: 1 }, stackable: false, category: "pistol", rarity: "rare" },
  // SMGs
  { id: "weapon_smg",       label: "SMG",        weight: 2.5, size: { w: 2, h: 2 }, stackable: false, category: "smg", rarity: "uncommon" },
  { id: "weapon_smg_mk2",   label: "SMG MK2",    weight: 2.6, size: { w: 2, h: 2 }, stackable: false, category: "smg", rarity: "rare" },
  { id: "weapon_combatpdw", label: "Combat PDW", weight: 2.8, size: { w: 2, h: 2 }, stackable: false, category: "smg", rarity: "epic" },
  { id: "weapon_microsmg",  label: "Micro SMG",  weight: 2.0, size: { w: 2, h: 1 }, stackable: false, category: "smg", rarity: "common" },
  { id: "weapon_minismg",   label: "Mini SMG",   weight: 1.8, size: { w: 2, h: 1 }, stackable: false, category: "smg", rarity: "common" },
  // Rifles
  { id: "weapon_assaultrifle",     label: "Assault Rifle",     weight: 3.5, size: { w: 3, h: 2 }, stackable: false, category: "rifle", rarity: "rare" },
  { id: "weapon_assaultrifle_mk2", label: "Assault Rifle MK2", weight: 3.8, size: { w: 3, h: 2 }, stackable: false, category: "rifle", rarity: "epic" },
  { id: "weapon_carbinerifle",     label: "Carbine Rifle",     weight: 3.3, size: { w: 3, h: 2 }, stackable: false, category: "rifle", rarity: "rare" },
  // Shotguns
  { id: "weapon_pumpshotgun",    label: "Pump Shotgun", weight: 4.0, size: { w: 3, h: 2 }, stackable: false, category: "shotgun", rarity: "uncommon" },
  { id: "weapon_sawnoffshotgun", label: "Sawn-off",     weight: 3.0, size: { w: 2, h: 1 }, stackable: false, category: "shotgun", rarity: "common" },
  // Ammo
  { id: "pistol_ammo",  label: "Pistol Ammo",  weight: 0.10, size: { w: 1, h: 1 }, stackable: true, maxStack: 250, category: "ammo", rarity: "common" },
  { id: "rifle_ammo",   label: "Rifle Ammo",   weight: 0.15, size: { w: 1, h: 1 }, stackable: true, maxStack: 250, category: "ammo", rarity: "uncommon" },
  { id: "smg_ammo",     label: "SMG Ammo",     weight: 0.10, size: { w: 1, h: 1 }, stackable: true, maxStack: 250, category: "ammo", rarity: "common" },
  { id: "shotgun_ammo", label: "Shotgun Ammo", weight: 0.20, size: { w: 1, h: 1 }, stackable: true, maxStack: 100, category: "ammo", rarity: "common" },
  // Consumables / food / drinks
  { id: "bread",        label: "Bread",        weight: 0.3, size: { w: 1, h: 1 }, stackable: true, maxStack: 20, category: "consumable", rarity: "common" },
  { id: "bandage",      label: "Bandage",      weight: 0.1, size: { w: 1, h: 1 }, stackable: true, maxStack: 10, category: "consumable", rarity: "common" },
  { id: "medkit",       label: "Medkit",       weight: 0.8, size: { w: 2, h: 1 }, stackable: true, maxStack:  5, category: "consumable", rarity: "rare" },
  { id: "canned_food",  label: "Canned Food",  weight: 0.4, size: { w: 1, h: 1 }, stackable: true, maxStack: 15, category: "food", rarity: "common" },
  { id: "raw_meat",     label: "Raw Meat",     weight: 0.5, size: { w: 1, h: 1 }, stackable: true, maxStack: 10, category: "food", rarity: "common" },
  { id: "cooked_meat",  label: "Cooked Meat",  weight: 0.4, size: { w: 1, h: 1 }, stackable: true, maxStack: 10, category: "food", rarity: "uncommon" },
  { id: "clean_water",  label: "Clean Water",  weight: 0.5, size: { w: 1, h: 1 }, stackable: true, maxStack: 15, category: "drink", rarity: "common" },
  { id: "dirty_water",  label: "Dirty Water",  weight: 0.5, size: { w: 1, h: 1 }, stackable: true, maxStack: 15, category: "drink", rarity: "common" },
  { id: "energy_drink", label: "Energy Drink", weight: 0.3, size: { w: 1, h: 1 }, stackable: true, maxStack: 10, category: "drink", rarity: "uncommon" },
  // Medical
  { id: "antidote",    label: "Antidote",    weight: 0.3, size: { w: 1, h: 1 }, stackable: true, maxStack:  5, category: "medical", rarity: "rare" },
  { id: "painkillers", label: "Painkillers", weight: 0.1, size: { w: 1, h: 1 }, stackable: true, maxStack: 10, category: "medical", rarity: "uncommon" },
  { id: "antibiotics", label: "Antibiotics", weight: 0.2, size: { w: 1, h: 1 }, stackable: true, maxStack:  5, category: "medical", rarity: "rare" },
  // Materials
  { id: "cloth",       label: "Cloth",       weight: 0.1, size: { w: 1, h: 1 }, stackable: true, maxStack: 30, category: "material", rarity: "common" },
  { id: "herbs",       label: "Herbs",       weight: 0.1, size: { w: 1, h: 1 }, stackable: true, maxStack: 20, category: "material", rarity: "uncommon" },
  { id: "scrap_metal", label: "Scrap Metal", weight: 0.6, size: { w: 1, h: 1 }, stackable: true, maxStack: 15, category: "material", rarity: "common" },
  { id: "chemicals",   label: "Chemicals",   weight: 0.3, size: { w: 1, h: 1 }, stackable: true, maxStack: 10, category: "material", rarity: "rare" },
  { id: "duct_tape",   label: "Duct Tape",   weight: 0.2, size: { w: 1, h: 1 }, stackable: true, maxStack: 10, category: "material", rarity: "uncommon" },
  // Vehicles
  { id: "rental_bicycle",   label: "Bicycle", weight:  8.0, size: { w: 2, h: 2 }, stackable: false, category: "vehicle", rarity: "common" },
  { id: "portable_vehicle", label: "Vehicle", weight: 12.0, size: { w: 2, h: 2 }, stackable: false, category: "vehicle", rarity: "rare" },
  // Blueprints
  { id: "blueprint_medkit",      label: "Blueprint: Medkit",      weight: 0.1, size: { w: 1, h: 1 }, stackable: false, category: "blueprint", rarity: "epic" },
  { id: "blueprint_antidote",    label: "Blueprint: Antidote",    weight: 0.1, size: { w: 1, h: 1 }, stackable: false, category: "blueprint", rarity: "legendary" },
  { id: "blueprint_pistol_ammo", label: "Blueprint: Pistol Ammo", weight: 0.1, size: { w: 1, h: 1 }, stackable: false, category: "blueprint", rarity: "rare" },
  { id: "blueprint_smg_ammo",    label: "Blueprint: SMG Ammo",    weight: 0.1, size: { w: 1, h: 1 }, stackable: false, category: "blueprint", rarity: "rare" },
];

// ----- Pseudo-random helpers (for player generator) ----------------------

function rand(seed: number) { const x = Math.sin(seed) * 10000; return x - Math.floor(x); }

const firstNames = ["Mohammed","Khalid","Saud","Faisal","Yousef","Abdullah","Omar","Salman","Turki","Bandar","Majed","Rakan","Nawaf","Mishal","Hassan","Talal","Sultan","Ziad","Ibrahim","Waleed","Amer","Hatim","Naif","Anas","Bader","Adel","Mazen","Rayan","Hamad","Tarek"];
const lastNames  = ["Al-Saud","Al-Otaibi","Al-Qahtani","Al-Ghamdi","Al-Shahri","Al-Zahrani","Al-Harbi","Al-Sharif","Al-Mutairi","Al-Subaie","Al-Mansour","Al-Anzi","Al-Rashid","Al-Dosari","Al-Hajri","Al-Maliki","Al-Faraj","Al-Tamimi","Al-Marri","Al-Asiri"];
const zones      = ["Sandy Shores","Paleto Bay","Grapeseed","Mt Chiliad","Cassidy Creek","Galilee","Senora Desert","Raton Canyon","Tongva Hills","Vinewood Hills","Vespucci Beach","Pacific Bluffs","Banham Canyon","Davis","Strawberry"];

const startingKits: Array<Array<{ id: string; count?: number }>> = [
  [{ id: "bandage", count: 3 }, { id: "clean_water", count: 2 }, { id: "canned_food", count: 1 }, { id: "weapon_pistol" }, { id: "pistol_ammo", count: 60 }],
  [{ id: "medkit", count: 1 }, { id: "cooked_meat", count: 2 }, { id: "energy_drink", count: 1 }, { id: "weapon_microsmg" }, { id: "smg_ammo", count: 90 }],
  [{ id: "bandage", count: 5 }, { id: "painkillers", count: 4 }, { id: "antibiotics", count: 1 }, { id: "weapon_pumpshotgun" }, { id: "shotgun_ammo", count: 24 }],
  [{ id: "weapon_assaultrifle" }, { id: "rifle_ammo", count: 120 }, { id: "antidote", count: 1 }, { id: "duct_tape", count: 3 }, { id: "scrap_metal", count: 6 }],
  [{ id: "raw_meat", count: 4 }, { id: "dirty_water", count: 5 }, { id: "cloth", count: 12 }, { id: "weapon_snspistol" }, { id: "pistol_ammo", count: 30 }],
  [{ id: "weapon_combatpdw" }, { id: "smg_ammo", count: 200 }, { id: "blueprint_medkit", count: 1 }, { id: "herbs", count: 8 }, { id: "chemicals", count: 2 }, { id: "medkit", count: 2 }],
];

export const players: Player[] = Array.from({ length: 32 }, (_, i) => {
  const seed = (i + 1) * 11.13;
  const fn = firstNames[Math.floor(rand(seed) * firstNames.length)];
  const ln = lastNames[Math.floor(rand(seed + 1) * lastNames.length)];
  const lifeRoll = rand(seed + 2);
  const lifecycle: LifecycleState =
    lifeRoll > 0.96 ? "dead" :
    lifeRoll > 0.92 ? "spectating" :
    lifeRoll > 0.06 ? "active" : "loading";
  const ping = Math.floor(20 + rand(seed + 3) * 130);
  const cash = Math.floor(rand(seed + 4) * 5000);
  const bank = Math.floor(rand(seed + 5) * 25000);
  const playtimeH = Math.floor(rand(seed + 6) * 600 + 4);
  const playtimeM = Math.floor(rand(seed + 7) * 60);
  const joinedAgoM = Math.floor(rand(seed + 8) * 240 + 1);
  const kit = startingKits[Math.floor(rand(seed + 9) * startingKits.length)];
  const inventory: InventorySlot[] = kit.map((k) => ({ itemId: k.id, count: k.count ?? 1 }));
  const extras = Math.floor(rand(seed + 10) * 4);
  for (let j = 0; j < extras; j++) {
    const pool = items.filter((it) => it.category !== "blueprint" && it.category !== "vehicle");
    const it = pool[Math.floor(rand(seed + 11 + j) * pool.length)];
    inventory.push({ itemId: it.id, count: it.stackable ? Math.floor(rand(seed + 12 + j) * (it.maxStack ?? 5)) + 1 : 1 });
  }
  return {
    id: i + 1,
    identifier: `license:${Math.floor(rand(seed + 20) * 1e16).toString(16).padStart(16, "0")}`,
    name: `${fn} ${ln}`,
    cash, bank, ping, lifecycle,
    zone: lifecycle === "loading" ? "—" : zones[Math.floor(rand(seed + 21) * zones.length)],
    playtime: `${playtimeH}h ${playtimeM}m`,
    joinedAgo: joinedAgoM < 60 ? `${joinedAgoM}m ago` : `${Math.floor(joinedAgoM / 60)}h ${joinedAgoM % 60}m ago`,
    stats: {
      hunger:    Math.floor(rand(seed + 30) * 100),
      thirst:    Math.floor(rand(seed + 31) * 100),
      stress:    Math.floor(rand(seed + 32) * 100),
      infection: Math.floor(rand(seed + 33) * 60),
      bleeding:  rand(seed + 34) > 0.85 ? Math.floor(rand(seed + 35) * 50 + 20) : 0,
      sick:      rand(seed + 36) > 0.88 ? Math.floor(rand(seed + 37) * 80) : 0,
      cold:      rand(seed + 38) > 0.7  ? Math.floor(rand(seed + 39) * 60) : 0,
      poison:    rand(seed + 40) > 0.93 ? Math.floor(rand(seed + 41) * 70 + 10) : 0,
    },
    warnings: rand(seed + 50) > 0.78 ? Math.floor(rand(seed + 51) * 3 + 1) : 0,
    bans:     rand(seed + 52) > 0.9  ? Math.floor(rand(seed + 53) * 2 + 1) : 0,
    skillPoints: Math.floor(rand(seed + 54) * 12),
    isStaff: rand(seed + 55) > 0.91,
    inventory,
  };
});

export const recentActions: AdminAction[] = [
  { id: "a1", type: "warn",       targetName: "Khalid Al-Otaibi", targetId: 5,  by: "you",          at: new Date(Date.now() - 18_000).toISOString(),        detail: "rule 3.2 — combat in safe zone",       reversible: true },
  { id: "a2", type: "give_money", targetName: "Saud Al-Ghamdi",   targetId: 12, by: "you",          at: new Date(Date.now() - 3 * 60_000).toISOString(),   detail: "$5,000 bank · compensation",           reversible: true },
  { id: "a3", type: "give_item",  targetName: "Faisal Al-Mutairi",targetId: 19, by: "Admin.Yousef", at: new Date(Date.now() - 8 * 60_000).toISOString(),   detail: "medkit × 3",                           reversible: true },
  { id: "a4", type: "teleport",   targetName: "Omar Al-Shahri",   targetId: 23, by: "Admin.Mazen",  at: new Date(Date.now() - 14 * 60_000).toISOString(),  detail: "→ Sandy Shores PD",                    reversible: false },
  { id: "a5", type: "revive",     targetName: "Hamad Al-Tamimi",  targetId: 22, by: "you",          at: new Date(Date.now() - 22 * 60_000).toISOString(),  detail: "dead → active",                        reversible: false },
  { id: "a6", type: "ban",        targetName: "Ibrahim Al-Harbi", targetId: 31, by: "Admin.Yousef", at: new Date(Date.now() - 41 * 60_000).toISOString(),  detail: "cheating · aimbot · permanent",        reversible: true },
];

export const bans: Ban[] = [
  { id: "b1", player: "Ibrahim Al-Harbi", identifier: "license:8a1bd2f4910c", by: "Admin.Yousef", at: new Date(Date.now() - 41 * 60_000).toISOString(),    reason: "Cheating — aimbot",          duration: "perma", status: "active" },
  { id: "b2", player: "Tarek Al-Anzi",    identifier: "license:9012ad4f2b91", by: "you",          at: new Date(Date.now() - 3 * 3600_000).toISOString(),   reason: "RDM × 4 in safe zone",       duration: "7d",    expiresAt: new Date(Date.now() + 4 * 86400_000).toISOString(), status: "active" },
  { id: "b3", player: "Salem Al-Mansour", identifier: "license:71ed02bfac38", by: "Admin.Yousef", at: new Date(Date.now() - 2 * 86400_000).toISOString(),  reason: "Toxicity in voice",          duration: "30d",   expiresAt: new Date(Date.now() + 28 * 86400_000).toISOString(),status: "active" },
];

export const zonesData: ZoneInfo[] = [
  { id: "rz_1", label: "Sandy Shores Airfield", type: "redzone",  enabled: true,  playersInside: 4, refillIn: "12m" },
  { id: "rz_2", label: "Paleto Bay PD",         type: "redzone",  enabled: true,  playersInside: 2, refillIn: "38m" },
  { id: "rz_3", label: "Humane Labs",           type: "redzone",  enabled: false, playersInside: 0, refillIn: "—" },
  { id: "sz_1", label: "Trader's Outpost",      type: "safezone", enabled: true,  playersInside: 8, refillIn: "—" },
];

export const zombieStats: ZombieStats = {
  alive: 0, killedToday: 0, hordeNext: "—",
  byType: [],
};

export const weather: WeatherInfo = { current: "—", next: "—", changeIn: "—" };

export const logs: LogEntry[] = [
  { id: "l1", ts: new Date(Date.now() - 60_000).toISOString(), level: "info", area: "auth", message: "Player Mohammed Al-Hajri (#1) connected" },
];

export const staff: StaffMember[] = [];

export const onlineHistory: number[] = [];
