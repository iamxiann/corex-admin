-- corex-admin · zombie count + per-kill reporter
--
-- Two streams to the server:
--   1. `reportZombieCount` — periodic snapshot of THIS client's local pool,
--      summed by the aggregator (server/world.lua) for the Overview tile.
--   2. `reportZombieKill`  — fires ONCE per zombie THIS PLAYER ACTUALLY
--      KILLED. We re-derive the killer client-side instead of trusting the
--      `corex:client:zombieKill` event from corex-zombies — that event also
--      fires for ambient deaths and kills by NEARBY players, which would
--      inflate the per-player count.
--
-- ONE-SHOT PED TRACKER: every ped we've already "processed" (credited or
-- determined to be someone else's kill) is added to `processed[ped]`. The
-- entry is only removed when the entity stops existing (corpse despawn,
-- handle freed). This prevents the previous re-credit-every-2s bug where
-- a single kill was counted 10+ times over the corpse's lifetime.

if GetResourceState('corex-zombies') ~= 'started' then
    return
end

-- ----- count snapshot -----------------------------------------------------

CreateThread(function()
    Wait(math.random(500, 3000))   -- stagger so a full server doesn't all report on the same frame
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

-- ----- per-kill credit ----------------------------------------------------

-- `processed[ped]` is set to `os.time()` the moment we either credit the
-- player for the kill OR decide it's someone else's. Once set, this ped is
-- skipped on every subsequent loop. We never "expire" entries on time —
-- only the GC pass (below) removes them, and only after the entity actually
-- stops existing. That kills the re-credit-every-N-seconds inflation.
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

                -- GetPedSourceOfDeath returns 0 if the killer info hasn't
                -- networked yet — leave `processed[ped]` unset so we try
                -- again on the next loop. Once we get a non-zero killer
                -- (ours or anyone else's), we mark it processed and never
                -- touch it again.
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

-- GC pass: drop processed entries whose ped no longer exists. Runs every
-- ~10 seconds — fine-grained timing isn't important, we just don't want the
-- table to leak forever on a long-running session.
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
