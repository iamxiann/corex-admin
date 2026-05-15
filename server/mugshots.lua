-- corex-admin · mugshot persistence
--
-- Persists each player's portrait to their corex-core metadata under the key
-- `mugshot_b64`. corex-core auto-saves metadata to the DB every 5 minutes and
-- on player drop — so the portrait survives reconnects and server restarts.
--
-- Read path: `GetCachedMugshot(src)` first checks the in-memory cache, then
-- falls back to the saved metadata. The admin panel never blocks on
-- generation; if a player just joined and hasn't sent their portrait yet,
-- the avatar simply renders initials until the next API refresh picks up
-- the saved data.

local METADATA_KEY = 'mugshot_b64'

---@type table<string, string>  identifier → base64 (in-memory hot cache)
local cache = {}

---Persist a fresh capture sent by the client.
RegisterNetEvent('corex-admin:server:mugshotReady', function(b64)
    local src = source
    if type(b64) ~= 'string' or #b64 < 64 then return end
    if #b64 > 200000 then return end                       -- sanity: ~150 KB is the realistic ceiling

    local player = exports['corex-core']:GetPlayer(src)
    if not player or not player.identifier then return end

    cache[player.identifier] = b64
    exports['corex-core']:SetMetaData(src, METADATA_KEY, b64)
end)

---Returns the cached/saved mugshot for an online player. Never generates.
---@param src number
---@return string base64 ('' if none saved yet)
function GetCachedMugshot(src)
    if type(src) ~= 'number' or src <= 0 then return '' end
    local player = exports['corex-core']:GetPlayer(src)
    if not player or not player.identifier then return '' end

    -- Hot cache first
    local hit = cache[player.identifier]
    if hit and #hit > 64 then return hit end

    -- Metadata fallback (rehydrate cache on first read after restart)
    local saved = exports['corex-core']:GetMetaData(src, METADATA_KEY)
    if type(saved) == 'string' and #saved > 64 then
        cache[player.identifier] = saved
        return saved
    end
    return ''
end

---Compatibility shims for older api.lua call sites; the new policy is
---"never block, never trigger generation from the panel".
function AwaitMugshot(src)   return GetCachedMugshot(src) end
function RequestMugshot(_)   -- no-op: client captures on its own lifecycle events
end
