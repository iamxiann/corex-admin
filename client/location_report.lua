local LAST_SENT = ''
local last_send_at = 0

CreateThread(function()

    Wait(math.random(2000, 6000))

    while true do
        local ped = PlayerPedId()
        if ped and ped ~= 0 and DoesEntityExist(ped) then
            local coords = GetEntityCoords(ped)

            local streetHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
            local label = ''
            if streetHash and streetHash ~= 0 then
                label = GetStreetNameFromHashKey(streetHash) or ''
            end

            if label == '' then
                local zone = GetNameOfZone(coords.x, coords.y, coords.z)
                if zone and zone ~= '' then
                    label = GetLabelText(zone) or zone
                end
            end

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
