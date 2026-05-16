RegisterNetEvent('corex-admin:client:teleportTo', function(payload)
    if type(payload) ~= 'table' then return end
    local x = tonumber(payload.x)
    local y = tonumber(payload.y)
    local z = tonumber(payload.z)
    local h = tonumber(payload.heading) or 0.0
    if not x or not y or not z then return end

    local ped = PlayerPedId()
    if not ped or ped == 0 then return end

    DoScreenFadeOut(350)
    while not IsScreenFadedOut() do Wait(0) end

    SetEntityCoords(ped, x, y, z, false, false, false, false)
    SetEntityHeading(ped, h)

    local timeout = GetGameTimer() + 4000
    RequestCollisionAtCoord(x, y, z)
    while not HasCollisionLoadedAroundEntity(ped) and GetGameTimer() < timeout do
        RequestCollisionAtCoord(x, y, z)
        Wait(0)
    end

    DoScreenFadeIn(350)
end)

local isSpectating  = false
local origCoords    = nil
local spectatedSrc  = nil
local spectatedName = nil

local function showSpectateOverlay()

    lib.showTextUI(
        ('👁️  Spectating **%s**  \n[X] Stop'):format(spectatedName or ('#' .. tostring(spectatedSrc))),
        {
            position = 'top-center',
            icon = 'eye',
            style = {
                borderRadius = 8,
                backgroundColor = '#0e0e11',
                color = '#f4f4f5',
            },
        }
    )
end

local function hideSpectateOverlay()
    pcall(lib.hideTextUI)
end

local function StopSpectate()
    if not isSpectating then return end
    isSpectating = false

    local myPed = PlayerPedId()
    local me    = PlayerId()
    NetworkSetInSpectatorMode(false, myPed)
    SetPlayerInvincible(me, false)
    SetEntityVisible(myPed, true, false)
    SetEntityCollision(myPed, true, true)
    FreezeEntityPosition(myPed, false)

    if origCoords then
        SetEntityCoords(myPed, origCoords.x, origCoords.y, origCoords.z, false, false, false, false)
        origCoords = nil
    end
    spectatedSrc = nil
    spectatedName = nil
    hideSpectateOverlay()
    lib.notify({ type = 'inform', description = 'Stopped spectating.' })
end

RegisterCommand('corex-admin:stopSpectate', function()
    if isSpectating then StopSpectate() end
end, false)
RegisterKeyMapping('corex-admin:stopSpectate', 'Stop spectating (corex-admin)', 'keyboard', 'X')

RegisterCommand('unspectate', function()
    if isSpectating then StopSpectate()
    else lib.notify({ type = 'inform', description = 'Not currently spectating.' }) end
end, false)
TriggerEvent('chat:addSuggestion', '/unspectate', 'Stop spectating the current target')

RegisterNetEvent('corex-admin:client:spectate', function(payload)
    if type(payload) ~= 'table' then return end
    local targetServerId = tonumber(payload.target)
    if not targetServerId then return end

    if isSpectating and spectatedSrc == targetServerId then
        StopSpectate()
        return
    end

    if isSpectating then StopSpectate() end

    spectatedName = (type(payload.name) == 'string' and payload.name) or ('#' .. targetServerId)

    local myPed = PlayerPedId()
    local me    = PlayerId()
    origCoords = GetEntityCoords(myPed)

    SetEntityVisible(myPed, false, false)
    SetEntityCollision(myPed, false, true)
    SetPlayerInvincible(me, true)
    FreezeEntityPosition(myPed, true)

    local tx, ty, tz = tonumber(payload.x), tonumber(payload.y), tonumber(payload.z)
    if tx and ty and tz then

        SetEntityCoords(myPed, tx, ty, tz + 1.0, false, false, false, false)
        local until_ = GetGameTimer() + 4000
        RequestCollisionAtCoord(tx, ty, tz)
        while not HasCollisionLoadedAroundEntity(myPed) and GetGameTimer() < until_ do
            RequestCollisionAtCoord(tx, ty, tz)
            Wait(0)
        end
    end

    local targetPlayer = -1
    local targetPed    = 0
    local deadline     = GetGameTimer() + 4000
    while GetGameTimer() < deadline do
        targetPlayer = GetPlayerFromServerId(targetServerId)
        if targetPlayer ~= -1 then
            targetPed = GetPlayerPed(targetPlayer)
            if targetPed and targetPed ~= 0 and DoesEntityExist(targetPed) then
                break
            end
        end
        Wait(100)
    end

    if targetPlayer == -1 or not targetPed or targetPed == 0 then

        SetEntityVisible(myPed, true, false)
        SetEntityCollision(myPed, true, true)
        SetPlayerInvincible(me, false)
        FreezeEntityPosition(myPed, false)
        if origCoords then
            SetEntityCoords(myPed, origCoords.x, origCoords.y, origCoords.z, false, false, false, false)
            origCoords = nil
        end
        spectatedName = nil
        lib.notify({ type = 'error', description = 'Could not stream the target. They may have just disconnected.' })
        return
    end

    NetworkSetInSpectatorMode(true, targetPed)
    isSpectating = true
    spectatedSrc = targetServerId
    showSpectateOverlay()
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() and isSpectating then
        local myPed = PlayerPedId()
        NetworkSetInSpectatorMode(false, myPed)
        SetPlayerInvincible(PlayerId(), false)
        SetEntityVisible(myPed, true, false)
        SetEntityCollision(myPed, true, true)
        FreezeEntityPosition(myPed, false)
        hideSpectateOverlay()
    end
end)
