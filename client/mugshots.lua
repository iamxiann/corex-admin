if GetResourceState('MugShotBase64') ~= 'started' then
    return
end

local inFlight        = false
local lastCaptureAt   = 0
local CAPTURE_COOLDOWN_MS = 4000
local STREAM_WAIT_MS      = 6000
local RETRY_WAIT_MS       = 4000

local function tryCapture()
    local ped = PlayerPedId()
    if not DoesEntityExist(ped) then return nil end
    if IsEntityDead(ped) then return nil end
    if IsPedRagdoll(ped) then return nil end
    if IsScreenFadedOut() or IsScreenFadingOut() then return nil end
    local ok, mugshot = pcall(function()
        return exports['MugShotBase64']:GetMugShotBase64(ped, false)
    end)
    if not ok or type(mugshot) ~= 'string' or #mugshot < 64 then
        return nil
    end
    return mugshot
end

local function captureAndSend(reason)
    if inFlight then return end
    local now = GetGameTimer()
    if (now - lastCaptureAt) < CAPTURE_COOLDOWN_MS then return end

    inFlight = true
    Wait(STREAM_WAIT_MS)

    local data = tryCapture()
    if not data then
        Wait(RETRY_WAIT_MS)
        data = tryCapture()
    end

    if data then
        lastCaptureAt = GetGameTimer()
        TriggerServerEvent('corex-admin:server:mugshotReady', data)
    end

    inFlight = false
end

local function scheduleCapture(reason)
    CreateThread(function() captureAndSend(reason) end)
end

RegisterNetEvent('corex:client:playerLoaded', function()
    scheduleCapture('playerLoaded')
end)

RegisterNetEvent('corex-spawn:client:spawnPlayer', function()
    scheduleCapture('spawnPlayer')
end)

RegisterNetEvent('corex-spawn:client:skinSaved', function()
    scheduleCapture('skinSaved')
end)

RegisterNetEvent('corex-death:client:respawnFinished', function()
    scheduleCapture('respawn')
end)

lib.callback.register('corex-admin:client:generateMugshot', function()
    if inFlight then return '' end
    inFlight = true
    local data = tryCapture()
    inFlight = false
    if data then
        lastCaptureAt = GetGameTimer()
        TriggerServerEvent('corex-admin:server:mugshotReady', data)
    end
    return data or ''
end)
