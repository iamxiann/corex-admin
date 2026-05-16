local clientZombieCounts = {}
local lastReport         = {}
local killedToday        = 0
local lastResetDate      = os.date('%Y-%m-%d')

local function rolloverIfNeeded()
    local today = os.date('%Y-%m-%d')
    if today ~= lastResetDate then
        killedToday = 0
        lastResetDate = today
    end
end

RegisterNetEvent('corex-admin:server:reportZombieCount', function(count)
    local src = source
    if type(count) ~= 'number' or count < 0 or count > 1000 then return end
    clientZombieCounts[src] = math.floor(count)
    lastReport[src] = os.time()
end)

RegisterNetEvent('corex-admin:server:reportZombieKill', function()
    local src = source
    if not src or src <= 0 then return end
    rolloverIfNeeded()
    killedToday = killedToday + 1

    local current = exports['corex-core']:GetMetaData(src, 'zombies_killed') or 0
    if type(current) ~= 'number' then current = tonumber(current) or 0 end
    exports['corex-core']:SetMetaData(src, 'zombies_killed', current + 1)
end)

local playerLocations = {}

RegisterNetEvent('corex-admin:server:reportLocation', function(label)
    local src = source
    if type(label) ~= 'string' or #label == 0 then return end
    if #label > 64 then label = label:sub(1, 64) end
    playerLocations[src] = label
end)

---@param src number
---@return string|nil
function GetReportedLocation(src)
    return playerLocations[src]
end

AddEventHandler('playerDropped', function()
    local src = source
    clientZombieCounts[src] = nil
    lastReport[src] = nil
    playerLocations[src] = nil
end)

local function ZombiesAlive()
    local total = 0
    local now = os.time()
    for src, count in pairs(clientZombieCounts) do
        if (now - (lastReport[src] or 0)) <= 15 then
            total = total + count
        end
    end
    return total
end

local function RedZonesSummary()
    if GetResourceState('corex-redzones') ~= 'started' then
        return { activeCount = 0, totalCount = 0, playersInside = 0 }
    end

    local ok, manifest = pcall(exports['corex-redzones'].GetZoneManifest, exports['corex-redzones'])
    if not ok or type(manifest) ~= 'table' then
        return { activeCount = 0, totalCount = 0, playersInside = 0 }
    end

    local inside = 0
    local players = exports['corex-core']:GetPlayers() or {}
    for src in pairs(players) do
        local n = tonumber(src)
        if n and IsPlayerInRedZone(n) then inside = inside + 1 end
    end

    return {
        activeCount   = #manifest,
        totalCount    = #manifest,
        playersInside = inside,
    }
end

function IsPlayerInRedZone(src)
    if GetResourceState('corex-redzones') ~= 'started' then return false end

    local ok, manifest = pcall(exports['corex-redzones'].GetZoneManifest, exports['corex-redzones'])
    if not ok or type(manifest) ~= 'table' then return false end

    local ped = GetPlayerPed(src)
    if not ped or ped == 0 then return false end
    local pc = GetEntityCoords(ped)
    if not pc or pc.x ~= pc.x then return false end

    for _, z in ipairs(manifest) do
        if z.coords and z.radius then
            local dx = pc.x - (z.coords.x or 0)
            local dy = pc.y - (z.coords.y or 0)
            if (dx * dx + dy * dy) <= (z.radius * z.radius) then
                return true, z.name or z.id
            end
        end
    end
    return false
end

function GetPlayerRedZoneName(src)
    local inside, name = IsPlayerInRedZone(src)
    if inside then return name end
    return nil
end

local WEATHER_LABEL = {
    EXTRASUNNY  = 'Clear',     CLEAR       = 'Clear',
    CLOUDS      = 'Cloudy',    SMOG        = 'Smoggy',
    FOGGY       = 'Foggy',     OVERCAST    = 'Overcast',
    RAIN        = 'Rainy',     THUNDER     = 'Thunder',
    CLEARING    = 'Clearing',  NEUTRAL     = 'Clear',
    SNOW        = 'Snow',      BLIZZARD    = 'Blizzard',
    SNOWLIGHT   = 'Light snow', XMAS       = 'Xmas snow',
    HALLOWEEN   = 'Halloween',
}

local function prettyWeather(code)
    if type(code) ~= 'string' then return '—' end
    return WEATHER_LABEL[code:upper()] or code:sub(1, 1) .. code:sub(2):lower()
end

local function WeatherSummary()
    if GetResourceState('corex-weather') ~= 'started' then
        return { current = '—', next = '—', changeIn = '—' }
    end
    local ok, current = pcall(exports['corex-weather'].GetCurrentWeather, exports['corex-weather'])
    if not ok or type(current) ~= 'string' then
        return { current = '—', next = '—', changeIn = '—' }
    end
    return {
        current  = prettyWeather(current),

        next     = '—',
        changeIn = '—',
    }
end

function ApiGetWorldStats()
    return {
        zombies = {
            alive       = ZombiesAlive(),
            killedToday = killedToday,
            hordeNext   = '—',
        },
        redzones = RedZonesSummary(),
        weather  = WeatherSummary(),
    }
end
