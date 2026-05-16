if GetResourceState('corex-zombies') ~= 'started' then
    return
end

CreateThread(function()
    Wait(math.random(500, 3000))
    while true do
        local ok, count = pcall(function()
            return exports['corex-zombies']:GetZombieCount()
        end)
        if ok and type(count) == 'number' then
            TriggerServerEvent('corex-admin:server:reportZombieCount', math.floor(count))
        end
        Wait(5000)
    end
end)

local processed = {}

CreateThread(function()
    Wait(math.random(500, 3000))
    while true do
        Wait(400)

        local list
        local ok = pcall(function()
            list = exports['corex-zombies']:GetActiveZombies()
        end)
        if not ok or type(list) ~= 'table' then goto continue end

        local myPed = PlayerPedId()
        if not myPed or myPed == 0 then goto continue end

        for _, z in pairs(list) do
            local ped = z and z.entity
            if ped and ped ~= 0 and not processed[ped]
               and DoesEntityExist(ped) and IsPedDeadOrDying(ped, true) then

                local killer = GetPedSourceOfDeath(ped)
                if killer == myPed then
                    processed[ped] = GetGameTimer()
                    TriggerServerEvent('corex-admin:server:reportZombieKill')
                elseif killer ~= 0 then
                    processed[ped] = GetGameTimer()
                end
            end
        end

        ::continue::
    end
end)

CreateThread(function()
    while true do
        Wait(10000)
        for ped in pairs(processed) do
            if not DoesEntityExist(ped) then
                processed[ped] = nil
            end
        end
    end
end)
