-- corex-admin · session tracking
--
-- Two pieces of data the admin panel needs that aren't tracked anywhere
-- else in the framework:
--
--   1. `joinedAt`  → wall-clock timestamp the player JOINED this server
--                    (used to render "Joined 12m ago"). Persisted in
--                    corex-core metadata under `last_joined_at` so it
--                    survives reconnects.
--   2. `playtime`  → seconds played in the CURRENT session, derived live
--                    from joinedAt vs now.
--
-- Account creation date (the absolute "first ever join") lives in the
-- `players` table as `created_at`; we expose it via ApiGetAccountCreatedAt
-- for the rare admin who wants to see it.

local META_JOINED_AT = 'last_joined_at'

local sessionStart = {}    -- src → unix seconds when this session began

local function nowUnix() return os.time() end

local function captureJoin(src)
    if type(src) ~= 'number' or src <= 0 then return end
    sessionStart[src] = nowUnix()
    -- Mirror to metadata so the panel can read "joined Xm ago" even on a
    -- cold restart that loses our in-memory table.
    local ok = pcall(exports['corex-core'].SetMetaData, exports['corex-core'], src, META_JOINED_AT, sessionStart[src])
    if not ok and COREX and COREX.Debug then
        COREX.Debug.Warn('[corex-admin] failed to persist join time for src ' .. src)
    end
end

-- corex-core dispatches `corex:server:playerReady` once the player object
-- is fully loaded. That's the right moment to start the session clock —
-- it fires AFTER identifier resolution so we can safely write metadata.
AddEventHandler('corex:server:playerReady', function(src)
    captureJoin(tonumber(src))
end)

AddEventHandler('playerDropped', function()
    sessionStart[source] = nil
end)

---Return the unix seconds when the player joined the current session.
---Falls back to persisted metadata if our in-memory table is empty (e.g.
---admin panel was restarted but players stayed connected).
---@param src number
---@return number
function GetSessionStart(src)
    if sessionStart[src] then return sessionStart[src] end
    local ok, saved = pcall(exports['corex-core'].GetMetaData, exports['corex-core'], src, META_JOINED_AT)
    if ok and type(saved) == 'number' and saved > 0 then
        sessionStart[src] = saved
        return saved
    end
    -- Last resort: this player slipped through both events. Use now() so we
    -- at least get a sensible "just joined" instead of negative time.
    sessionStart[src] = nowUnix()
    return sessionStart[src]
end

---Pretty short playtime label ("3h 12m" / "12m" / "42s").
---@param seconds number
---@return string
function FormatPlaytime(seconds)
    seconds = math.max(0, math.floor(seconds or 0))
    if seconds < 60 then return seconds .. 's' end
    local mins = math.floor(seconds / 60)
    if mins < 60 then return mins .. 'm' end
    local hrs = math.floor(mins / 60)
    return ('%dh %dm'):format(hrs, mins % 60)
end

---Pretty relative-time label ("3m ago", "1h ago", "just now").
---@param unixSeconds number
---@return string
function FormatTimeAgo(unixSeconds)
    if type(unixSeconds) ~= 'number' or unixSeconds <= 0 then return '—' end
    local diff = nowUnix() - unixSeconds
    if diff < 5 then return 'just now' end
    if diff < 60 then return diff .. 's ago' end
    if diff < 3600 then return math.floor(diff / 60) .. 'm ago' end
    if diff < 86400 then return math.floor(diff / 3600) .. 'h ago' end
    return math.floor(diff / 86400) .. 'd ago'
end

---Convenience for api.lua — returns both labels in one go.
---@param src number
---@return string playtimeLabel, string joinedAgoLabel
function GetPlaytimeAndJoined(src)
    local start = GetSessionStart(src)
    return FormatPlaytime(nowUnix() - start), FormatTimeAgo(start)
end
