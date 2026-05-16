local Corex

CreateThread(function()
    while not exports['corex-core']:IsReady() do Wait(100) end
    Corex = exports['corex-core']:GetCoreObject()
end)

local function hasAce(src)
    if not Config.UseAcePermissions then return false end
    for _, ace in ipairs(Config.AllowedAces) do
        if IsPlayerAceAllowed(src, ace) then return true end
    end
    return false
end

local function hasMetaFlag(src)
    if not Config.UseCorexMetadataFlag then return false end
    if not Corex then return false end
    local flag = exports['corex-core']:GetMetaData(src, Config.StaffMetadataKey)
    return flag == true or flag == 1 or flag == '1'
end

---@param src number FiveM player source id
---@return boolean allowed, string reason
function IsAdmin(src)
    if type(src) ~= 'number' or src <= 0 then return false, 'invalid_source' end
    if hasAce(src) then return true, 'ace' end
    if hasMetaFlag(src) then return true, 'metadata' end
    return false, 'denied'
end

---@param src number
---@return string name, string identifier
function GetActor(src)
    local player = Corex and exports['corex-core']:GetPlayer(src)
    if player then
        return player.name or GetPlayerName(src) or '?', player.identifier or '?'
    end
    return GetPlayerName(src) or '?', '?'
end
