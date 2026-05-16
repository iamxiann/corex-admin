local METADATA_KEY = 'mugshot_b64'

---@type table<string, string>  identifier → base64 (in-memory hot cache)
local cache = {}

RegisterNetEvent('corex-admin:server:mugshotReady', function(b64)
    local src = source
    if type(b64) ~= 'string' or #b64 < 64 then return end
    if #b64 > 200000 then return end

    local player = exports['corex-core']:GetPlayer(src)
    if not player or not player.identifier then return end

    cache[player.identifier] = b64
    exports['corex-core']:SetMetaData(src, METADATA_KEY, b64)
end)

---@param src number
---@return string base64 ('' if none saved yet)
function GetCachedMugshot(src)
    if type(src) ~= 'number' or src <= 0 then return '' end
    local player = exports['corex-core']:GetPlayer(src)
    if not player or not player.identifier then return '' end

    local hit = cache[player.identifier]
    if hit and #hit > 64 then return hit end

    local saved = exports['corex-core']:GetMetaData(src, METADATA_KEY)
    if type(saved) == 'string' and #saved > 64 then
        cache[player.identifier] = saved
        return saved
    end
    return ''
end

function AwaitMugshot(src)   return GetCachedMugshot(src) end
function RequestMugshot(_)
end
