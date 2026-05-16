local META_JOINED_AT = 'last_joined_at'

local sessionStart = {}

local function nowUnix() return os.time() end

local function captureJoin(src)
    if type(src) ~= 'number' or src <= 0 then return end
    sessionStart[src] = nowUnix()

    local ok = pcall(exports['corex-core'].SetMetaData, exports['corex-core'], src, META_JOINED_AT, sessionStart[src])
    if not ok and COREX and COREX.Debug then
        COREX.Debug.Warn('[corex-admin] failed to persist join time for src ' .. src)
    end
end

AddEventHandler('corex:server:playerReady', function(src)
    captureJoin(tonumber(src))
end)

AddEventHandler('playerDropped', function()
    sessionStart[source] = nil
end)

---@param src number
---@return number
function GetSessionStart(src)
    if sessionStart[src] then return sessionStart[src] end
    local ok, saved = pcall(exports['corex-core'].GetMetaData, exports['corex-core'], src, META_JOINED_AT)
    if ok and type(saved) == 'number' and saved > 0 then
        sessionStart[src] = saved
        return saved
    end

    sessionStart[src] = nowUnix()
    return sessionStart[src]
end

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

---@param src number
---@return string playtimeLabel, string joinedAgoLabel
function GetPlaytimeAndJoined(src)
    local start = GetSessionStart(src)
    return FormatPlaytime(nowUnix() - start), FormatTimeAgo(start)
end
