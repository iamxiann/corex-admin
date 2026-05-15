-- corex-admin · client-side action handlers
--
-- These are the side-effect actions the admin panel needs the LOCAL client
-- to perform on the actor (not the target):
--   - teleportTo : move the admin's ped to the supplied coords
--   - spectate   : toggle spectator camera on the target player
--
-- The target-side effects (heal, kick, give item, etc.) are handled by
-- server-side events the corex-core stack already exposes. This file is
-- only the actor's local response.

-- ----- Teleport ----------------------------------------------------------

RegisterNetEvent('corex-admin:client:teleportTo', function(payload)
    if type(payload) ~= 'table' then return end
    local x = tonumber(payload.x)
    local y = tonumber(payload.y)
    local z = tonumber(payload.z)
    local h = tonumber(payload.heading) or 0.0
    if not x or not y or not z then return end

    local ped = PlayerPedId()
    if not ped or ped == 0 then return end

    -- Brief fade so the swap looks intentional instead of jarring. The 350ms
    -- out + 350ms in matches the standard FiveM teleport feel.
    DoScreenFadeOut(350)
    while not IsScreenFadedOut() do Wait(0) end

    SetEntityCoords(ped, x, y, z, false, false, false, false)
    SetEntityHeading(ped, h)
    -- Tell the streamer to load the new chunk before we fade back in,
    -- otherwise the admin lands in low-detail world for a beat.
    local timeout = GetGameTimer() + 4000
    RequestCollisionAtCoord(x, y, z)
    while not HasCollisionLoadedAroundEntity(ped) and GetGameTimer() < timeout do
        RequestCollisionAtCoord(x, y, z)
        Wait(0)
    end

    DoScreenFadeIn(350)
end)

-- ----- Spectate ----------------------------------------------------------
-- Toggle: the same callback ends a spectate session if one is already
-- active. Keeps the wiring simple — the admin clicks the button twice.
--
-- Long-range spectate: GTA networks player peds only within ~424m scope.
-- If the target is on the other side of the map, `GetPlayerFromServerId`
-- returns -1 and the legacy "stand closer" error fires. We work around
-- that by stealth-teleporting the admin to the target's server-resolved
-- coords first (invisible + frozen + no-collision), waiting a beat for
-- the ped to network in, then enabling spectator mode.

local isSpectating  = false
local origCoords    = nil
local spectatedSrc  = nil
local spectatedName = nil  -- shown on the overlay

local function showSpectateOverlay()
    -- ox_lib's persistent text panel — sits in the top-center area and
    -- doesn't grab NUI focus, so the admin can keep moving the camera
    -- around the target. The on-screen hint tells them how to bail out.
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

-- Hot-key bail-out: holding [X] while spectating ends the session. We use
-- RegisterCommand + RegisterKeyMapping so the player can rebind it in
-- FiveM's settings if they like; the default mapping is INPUT_PICKUP (E
-- press, mapped to X by default in many builds — RegisterKeyMapping uses
-- the keyboard letter directly).
RegisterCommand('corex-admin:stopSpectate', function()
    if isSpectating then StopSpectate() end
end, false)
RegisterKeyMapping('corex-admin:stopSpectate', 'Stop spectating (corex-admin)', 'keyboard', 'X')

-- Slash command alias for the rare case where the keybind is occupied by
-- another resource — the admin can always type /unspectate to bail.
RegisterCommand('unspectate', function()
    if isSpectating then StopSpectate()
    else lib.notify({ type = 'inform', description = 'Not currently spectating.' }) end
end, false)
TriggerEvent('chat:addSuggestion', '/unspectate', 'Stop spectating the current target')

-- Server sends `{ target = <serverId>, x, y, z }` (coords may be nil if the
-- target's ped was un-resolvable server-side).
RegisterNetEvent('corex-admin:client:spectate', function(payload)
    if type(payload) ~= 'table' then return end
    local targetServerId = tonumber(payload.target)
    if not targetServerId then return end

    -- Same target → toggle off.
    if isSpectating and spectatedSrc == targetServerId then
        StopSpectate()
        return
    end
    -- Different target while already spectating → switch.
    if isSpectating then StopSpectate() end

    spectatedName = (type(payload.name) == 'string' and payload.name) or ('#' .. targetServerId)

    local myPed = PlayerPedId()
    local me    = PlayerId()
    origCoords = GetEntityCoords(myPed)

    -- Stealth setup: invisible, no-collision, frozen-positioned so the
    -- admin's ped doesn't fall through the world while the target streams.
    SetEntityVisible(myPed, false, false)
    SetEntityCollision(myPed, false, true)
    SetPlayerInvincible(me, true)
    FreezeEntityPosition(myPed, true)

    -- Phase 1: warp to the target's coords if we have them. We DO NOT
    -- require GetPlayerFromServerId to succeed before warping — the warp
    -- is what brings the target into our scope.
    local tx, ty, tz = tonumber(payload.x), tonumber(payload.y), tonumber(payload.z)
    if tx and ty and tz then
        -- Slightly above the target so we don't end up inside their head.
        SetEntityCoords(myPed, tx, ty, tz + 1.0, false, false, false, false)
        local until_ = GetGameTimer() + 4000
        RequestCollisionAtCoord(tx, ty, tz)
        while not HasCollisionLoadedAroundEntity(myPed) and GetGameTimer() < until_ do
            RequestCollisionAtCoord(tx, ty, tz)
            Wait(0)
        end
    end

    -- Phase 2: wait for the target player to appear in our scope. Up to
    -- 4 seconds of polling — covers slow streaming on dense areas.
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
        -- Couldn't bring the target into scope — undo the stealth setup
        -- and restore the admin's original position.
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

-- Safety: if the admin disconnects mid-spectate we don't want to leak the
-- spectator camera onto their next session. cfx resets this for us, but on
-- a resource restart we still want to release the camera cleanly.
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
