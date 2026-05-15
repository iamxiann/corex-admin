-- corex-admin · client-side mugshot capture
--
-- Strategy:
--   1. Single-flight: only one capture in progress at a time, ever. Prevents
--      MugShotBase64's `Answers[id]:resolve` crash that fires when its NUI
--      callback receives an Id whose promise has already been cleaned up
--      (happens when two RegisterPedheadshot calls overlap).
--   2. Re-capture on every event that means "the visible ped just changed":
--        - corex:client:playerLoaded         (initial join / character load)
--        - corex-spawn:client:spawnPlayer    (every fresh spawn)
--        - corex-spawn:client:skinSaved      (clothing / appearance edit)
--        - corex-death:client:respawnFinished (post-death respawn)
--      We dedupe with a short cooldown so back-to-back events (e.g. spawn +
--      skinSaved firing 200ms apart) don't kick two captures.
--   3. The admin panel can still ask for a manual refresh via the
--      `generateMugshot` callback — also gated by single-flight.
--   4. We wait long enough after the trigger event for the ped's clothing /
--      props / face overlays to fully stream in. Capturing too early
--      produces a generic bald-default-ped portrait, which is the exact bug
--      we hit before this rewrite.

if GetResourceState('MugShotBase64') ~= 'started' then
    return
end

local inFlight        = false
local lastCaptureAt   = 0
local CAPTURE_COOLDOWN_MS = 4000   -- skip duplicate triggers within this window
local STREAM_WAIT_MS      = 6000   -- give clothing + props time to stream
local RETRY_WAIT_MS       = 4000   -- one retry if the first attempt was empty

local function tryCapture()
    local ped = PlayerPedId()
    if not DoesEntityExist(ped) then return nil end
    if IsEntityDead(ped) then return nil end
    if IsPedRagdoll(ped) then return nil end
    -- Don't capture mid-loading-screen — the model on screen at that moment
    -- is the freemode default, not the player's saved skin.
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

-- Initial character load
RegisterNetEvent('corex:client:playerLoaded', function()
    scheduleCapture('playerLoaded')
end)

-- Every fresh spawn (covers reconnect, character switch, server-triggered respawn).
-- corex-spawn fires this after the spawn camera releases.
RegisterNetEvent('corex-spawn:client:spawnPlayer', function()
    scheduleCapture('spawnPlayer')
end)

-- Clothing / appearance was saved by corex-spawn (user edited skin in shop, etc).
RegisterNetEvent('corex-spawn:client:skinSaved', function()
    scheduleCapture('skinSaved')
end)

-- Post-death respawn from corex-death — ped is fresh on the ground.
RegisterNetEvent('corex-death:client:respawnFinished', function()
    scheduleCapture('respawn')
end)

-- Admin manually requests a fresh capture. Single-flight gated; bypasses the
-- cooldown so a refresh button always works on demand.
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
