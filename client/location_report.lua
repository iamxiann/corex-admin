-- corex-admin · location reporter
--
-- The server can't ask GTA "what street are you on?" — `GetStreetNameAtCoord`
-- is a client-only native. So each client periodically resolves its own
-- area name and pushes it to the server. The admin panel then reads it
-- from the per-source cache in server/world.lua.
--
-- Cadence: 5 seconds. Streets are stable on that timescale and the payload
-- is tiny (a short string), so we don't bother with delta-only reporting.

local LAST_SENT = ''
local last_send_at = 0

CreateThread(function()
    -- Stagger so a full server doesn't all transmit on the same frame.
    Wait(math.random(2000, 6000))

    while true do
        local ped = PlayerPedId()
        if ped and ped ~= 0 and DoesEntityExist(ped) then
            local coords = GetEntityCoords(ped)
            -- GetStreetNameAtCoord returns (streetHash, crossingHash). The
            -- crossing is often nil/zero, so we only use the first hash.
            local streetHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
            local label = ''
            if streetHash and streetHash ~= 0 then
                label = GetStreetNameFromHashKey(streetHash) or ''
            end
            -- Fall back to a region name (Sandy Shores / Paleto / Vinewood ...)
            -- so the admin sees something even when the player is off-road.
            if label == '' then
                local zone = GetNameOfZone(coords.x, coords.y, coords.z)
                if zone and zone ~= '' then
                    label = GetLabelText(zone) or zone
                end
            end

            -- Only ping the server when the label actually changed OR more
            -- than 30s have passed (heartbeat — keeps the cache fresh after
            -- a corex-admin restart).
            local now = GetGameTimer()
            if label ~= '' and (label ~= LAST_SENT or (now - last_send_at) > 30000) then
                TriggerServerEvent('corex-admin:server:reportLocation', label)
                LAST_SENT = label
                last_send_at = now
            end
        end
        Wait(5000)
    end
end)
