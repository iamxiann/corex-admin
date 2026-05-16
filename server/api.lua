local Corex

CreateThread(function()
    while not exports['corex-core']:IsReady() do Wait(100) end
    Corex = exports['corex-core']:GetCoreObject()
end)

local function pingOf(src)
    return GetPlayerPing(src) or 0
end

local function vitalsFromMeta(meta)
    return {
        hunger    = tonumber(meta.hunger)    or 100,
        thirst    = tonumber(meta.thirst)    or 100,
        stress    = tonumber(meta.stress)    or 0,
        infection = tonumber(meta.infection) or 0,
        bleeding  = tonumber(meta.bleeding)  or 0,
        sick      = tonumber(meta.sick)      or 0,
        cold      = tonumber(meta.cold)      or 0,
        poison    = tonumber(meta.poison)    or 0,
    }
end

local function mapInventory(invObj)
    local out = {}
    if not invObj or type(invObj.items) ~= 'table' then return out end
    for _, slot in ipairs(invObj.items) do
        out[#out + 1] = { itemId = slot.name, count = slot.count or 1 }
    end
    return out
end

local function getSkillPoints(src)
    if GetResourceState('corex-skills') ~= 'started' then return 0 end
    local ok, pts = pcall(exports['corex-skills'].GetSkillPoints, exports['corex-skills'], src)
    if not ok or type(pts) ~= 'number' then return 0 end
    return pts
end

local function getZoneLabel(src)
    local rzName = GetPlayerRedZoneName and GetPlayerRedZoneName(src)
    if rzName and rzName ~= '' then return ('Red zone · %s'):format(rzName) end

    if GetResourceState('corex-zones') == 'started' then
        local ok, name = pcall(exports['corex-zones'].GetPlayerZone, exports['corex-zones'], src)
        if ok and type(name) == 'string' and name ~= '' then
            return ('Safe zone · %s'):format(name)
        end
    end

    if GetReportedLocation then
        local reported = GetReportedLocation(src)
        if reported and reported ~= '' then return reported end
    end
    return 'Open world'
end

local function getInventoryGridSize()
    if GetResourceState('corex-inventory') ~= 'started' then return 24 end
    local ok, w = pcall(function() return exports['corex-inventory']:GetGridWidth() end)
    local ok2, h = pcall(function() return exports['corex-inventory']:GetGridHeight() end)
    local width  = (ok  and type(w) == 'number' and w > 0) and w or 8
    local height = (ok2 and type(h) == 'number' and h > 0) and h or 10
    return width * height
end

local function tryCall(fn, fallback, ...)
    local ok, res = pcall(fn, ...)
    if ok then return res end
    return fallback
end

local function buildPlayerSummary(src, player, includeMugshot)
    local money   = (type(player.money) == 'table') and player.money or { cash = 0, bank = 0 }
    local meta    = (type(player.metadata) == 'table') and player.metadata or {}

    local state = tryCall(function() return exports['corex-core']:GetPlayerState(src) end, 'active')
    if not state or state == '' then state = 'active' end

    local mappedInv = {}
    if GetResourceState('corex-inventory') == 'started' then
        local invObj = tryCall(function() return exports['corex-inventory']:GetInventory(src) end, nil)
        mappedInv = mapInventory(invObj)
    end

    local mugshot = tryCall(function() return GetCachedMugshot(src) end, '') or ''
    if includeMugshot and mugshot == '' then
        mugshot = tryCall(function() return AwaitMugshot(src) end, '') or ''
    elseif mugshot == '' then
        pcall(function() RequestMugshot(src) end)
    end

    local playtime, joinedAgo = '0s', 'just now'
    pcall(function() playtime, joinedAgo = GetPlaytimeAndJoined(src) end)

    return {
        id            = src,
        name          = player.name or GetPlayerName(src) or ('Player#' .. src),
        identifier    = player.identifier or '',
        lifecycle     = state,
        cash          = tonumber(money.cash) or 0,
        bank          = tonumber(money.bank) or 0,
        ping          = tryCall(function() return pingOf(src) end, 0),
        warnings      = tonumber(meta.warnings) or 0,
        bans          = tonumber(meta.ban_history) or 0,
        playtime      = playtime or '0s',
        joinedAgo     = joinedAgo or 'just now',
        zone          = tryCall(function() return getZoneLabel(src) end, 'Unknown'),
        isStaff       = meta[Config.StaffMetadataKey] and true or false,
        skillPoints   = tryCall(function() return getSkillPoints(src) end, 0),
        invSlots      = #mappedInv,
        invMaxSlots   = tryCall(function() return getInventoryGridSize() end, 80),
        mugshot       = mugshot,
        stats         = vitalsFromMeta(meta),
        inventory     = mappedInv,
        zombiesKilled = tonumber(meta.zombies_killed) or 0,
    }
end

function ApiGetPlayers()
    if not Corex then return {} end
    local result = {}
    local players = exports['corex-core']:GetPlayers() or {}
    local count = 0
    for src, p in pairs(players) do
        count = count + 1
        if count > Config.MaxPlayersPerFetch then break end
        local ok, summary = pcall(buildPlayerSummary, tonumber(src), p, false)
        if ok and summary then
            result[#result + 1] = summary
        else
            local n        = tonumber(src)
            local cachedMs = (GetCachedMugshot and GetCachedMugshot(n)) or ''
            local pmeta    = (p and type(p.metadata) == 'table') and p.metadata or {}
            local pmoney   = (p and type(p.money)    == 'table') and p.money    or {}
            print(('^3[corex-admin]^7 buildPlayerSummary failed for src=%s err=%s'):format(tostring(src), tostring(summary)))
            result[#result + 1] = {
                id          = n,
                name        = (p and p.name) or GetPlayerName(n) or ('Player#' .. src),
                identifier  = (p and p.identifier) or '',
                lifecycle   = exports['corex-core']:GetPlayerState(n) or 'loading',
                cash        = tonumber(pmoney.cash) or 0,
                bank        = tonumber(pmoney.bank) or 0,
                ping        = GetPlayerPing(n) or 0,
                warnings    = tonumber(pmeta.warnings) or 0,
                bans        = tonumber(pmeta.ban_history) or 0,
                playtime    = '—',
                joinedAgo   = '—',
                zone        = '—',
                isStaff     = pmeta[Config.StaffMetadataKey] and true or false,
                skillPoints = 0,
                invSlots    = 0,
                invMaxSlots = 80,
                mugshot     = cachedMs,
                stats       = {
                    hunger    = tonumber(pmeta.hunger)    or 0,
                    thirst    = tonumber(pmeta.thirst)    or 0,
                    stress    = tonumber(pmeta.stress)    or 0,
                    infection = tonumber(pmeta.infection) or 0,
                    bleeding  = tonumber(pmeta.bleeding)  or 0,
                    sick      = tonumber(pmeta.sick)      or 0,
                    cold      = tonumber(pmeta.cold)      or 0,
                    poison    = tonumber(pmeta.poison)    or 0,
                },
                inventory     = {},
                zombiesKilled = tonumber(pmeta.zombies_killed) or 0,
            }
        end
    end
    table.sort(result, function(a, b) return a.id < b.id end)
    return result
end

function ApiGetPlayer(targetSrc)
    if not Corex then return nil end
    local player = exports['corex-core']:GetPlayer(targetSrc)
    if not player then return nil end
    return buildPlayerSummary(targetSrc, player, true)   -- detail view: force mugshot
end

function ApiGetOverview()
    local players = exports['corex-core']:GetPlayers() or {}
    local total, active, dead, spectating, loading = 0, 0, 0, 0, 0
    for src in pairs(players) do
        total = total + 1
        local st = exports['corex-core']:GetPlayerState(tonumber(src)) or 'active'
        if st == 'active' then active = active + 1
        elseif st == 'dead' then dead = dead + 1
        elseif st == 'spectating' then spectating = spectating + 1
        else loading = loading + 1 end
    end

    local world = ApiGetWorldStats and ApiGetWorldStats() or {
        zombies  = { alive = 0, killedToday = 0, hordeNext = '—' },
        redzones = { activeCount = 0, totalCount = 0, playersInside = 0 },
        weather  = { current = '—', next = '—', changeIn = '—' },
    }

    return {
        players    = { total = total, active = active, dead = dead, spectating = spectating, loading = loading },
        maxPlayers = GetConvarInt('sv_maxclients', 32),
        uptime     = os.time(),
        zombies    = world.zombies,
        redzones   = world.redzones,
        weather    = world.weather,
        inventory  = { gridSize = getInventoryGridSize() },
    }
end

local function inferCategory(id, raw)
    if type(raw) == 'string' and #raw > 0 then return raw end
    if not id then return 'other' end
    local lc = id:lower()
    if lc:find('^weapon_') then
        if     lc:find('pistol')        then return 'pistol'
        elseif lc:find('smg') or lc:find('pdw') then return 'smg'
        elseif lc:find('rifle') or lc:find('carbine') then return 'rifle'
        elseif lc:find('shotgun')       then return 'shotgun'
        end
        return 'pistol'  -- generic weapon fallback
    end
    if lc:find('_ammo') or lc:find('ammopack') then return 'ammo' end
    if lc:find('^blueprint_')                  then return 'blueprint' end
    if lc:find('water') or lc:find('drink')    then return 'drink' end
    if lc:find('meat') or lc:find('food') or lc:find('bread') then return 'food' end
    if lc:find('bandage') or lc:find('medkit') or lc:find('pain') or lc:find('antib') or lc:find('antidote') then return 'medical' end
    if lc == 'rental_bicycle' or lc == 'portable_vehicle' or lc:find('bike') or lc:find('vehicle') then return 'vehicle' end
    return 'consumable'
end

function ApiGetItemsCatalog()
    if GetResourceState('corex-inventory') ~= 'started' then return {} end
    local catalog = exports['corex-inventory']:GetFullCatalog() or {}
    local list = {}
    for id, item in pairs(catalog) do
        list[#list + 1] = {
            id        = id,
            label     = item.label,
            weight    = item.weight,
            size      = item.size,
            stackable = item.stackable,
            maxStack  = item.maxStack,
            category  = inferCategory(id, item.category),
            rarity    = item.rarity or 'common',
            image     = item.image,
        }
    end
    return list
end
