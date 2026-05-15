-- corex-admin · mutating admin actions
-- Every function here re-validates the actor's permission. Never trust the NUI.

-- Actions that benefit from visual evidence — we grab a screenshot of the
-- target BEFORE executing (otherwise the player might be dropped already).
-- Configured server-side because some of these actions (kick/ban) need the
-- screenshot taken BEFORE the player is dropped from the server.
local SCREENSHOT_ACTIONS = {
    kick = true, ban = true, warn = true,
    -- Economy + inventory actions are also good to audit visually — they're
    -- often the ones that get disputed ("the admin gave my enemy money").
    give_money  = true,
    set_money   = true,
    give_item   = true,
    remove_item = true,
    revive      = true,
}

local function logAction(actorSrc, actorName, action, payload, ok, errOrResult, targetSrc, screenshotBytes)
    if Config.LogToConsole then
        print(('[corex-admin] %s (#%d) -> %s :: %s :: %s'):format(
            actorName, actorSrc, action,
            ok and 'OK' or 'FAIL',
            tostring(errOrResult)
        ))
    end
    -- Persist to in-game action log so the Overview "Recent admin actions"
    -- panel shows it. Only log successful actions — failed attempts pollute
    -- the timeline with noise that admins can't act on.
    if ok and AppendActionLog then
        local logTarget = targetSrc or (type(payload) == 'table' and payload.target) or nil
        AppendActionLog(actorSrc, actorName, action, payload, logTarget)
    end
    if Config.LogToDiscord and Config.DiscordWebhook ~= '' then
        local targetName = '—'
        if targetSrc and GetPlayerName(targetSrc) then
            targetName = ('%s (#%d)'):format(GetPlayerName(targetSrc), targetSrc)
        elseif payload and payload.target then
            targetName = tostring(payload.target)
        end
        PostActionToDiscord(action, ('%s (#%d)'):format(actorName, actorSrc), targetName, payload, ok, screenshotBytes)
    end
end

-- Convenience: capture screenshot if this action wants one + Discord is configured.
local function maybeCaptureScreenshot(action, targetSrc)
    if not SCREENSHOT_ACTIONS[action] then return nil end
    if not Config.LogToDiscord or Config.DiscordWebhook == '' then return nil end
    if not Config.CaptureEvidenceScreenshots then return nil end
    return CaptureScreenshotBytes(targetSrc)
end

local function gate(src)
    local allowed = IsAdmin(src)
    if not allowed then return false, 'permission_denied' end
    return true
end

-----------------------------------------------------------------------
-- Kick
-----------------------------------------------------------------------
function ActionKick(src, target, reason)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    target = tonumber(target); if not target then return false, 'bad_target' end
    if not GetPlayerName(target) then return false, 'target_offline' end

    local shot = maybeCaptureScreenshot('kick', target)
    DropPlayer(target, ('[Admin] ' .. (reason or 'no reason')))
    local actorName = GetActor(src)
    logAction(src, actorName, 'kick', { target = target, reason = reason }, true, target, target, shot)
    return true
end

-----------------------------------------------------------------------
-- Give / Set money (cash or bank)
-----------------------------------------------------------------------
function ActionGiveMoney(src, target, kind, amount)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    target = tonumber(target); amount = tonumber(amount)
    if not target or not amount then return false, 'bad_args' end
    if kind ~= 'cash' and kind ~= 'bank' then return false, 'bad_kind' end
    if math.abs(amount) > Config.MaxGiveMoney then return false, 'amount_too_large' end
    if not exports['corex-core']:GetPlayer(target) then return false, 'target_offline' end

    local shot = maybeCaptureScreenshot('give_money', target)
    if amount >= 0 then
        exports['corex-core']:AddMoney(target, kind, amount)
    else
        exports['corex-core']:RemoveMoney(target, kind, -amount)
    end
    TriggerClientEvent('corex:notify', target, ('Admin granted %s$%s on your %s')
        :format(amount >= 0 and '+' or '-', math.abs(amount), kind), 'success', 5000)

    local actorName = GetActor(src)
    logAction(src, actorName, 'give_money', { target = target, kind = kind, amount = amount }, true, 'ok', target, shot)
    return true
end

function ActionSetMoney(src, target, kind, amount)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    target = tonumber(target); amount = tonumber(amount)
    if not target or not amount or amount < 0 then return false, 'bad_args' end
    if kind ~= 'cash' and kind ~= 'bank' then return false, 'bad_kind' end
    if amount > Config.MaxGiveMoney then return false, 'amount_too_large' end
    if not exports['corex-core']:GetPlayer(target) then return false, 'target_offline' end

    local shot = maybeCaptureScreenshot('set_money', target)
    local current = exports['corex-core']:GetMoney(target, kind) or 0
    local delta = amount - current
    if delta > 0 then exports['corex-core']:AddMoney(target, kind, delta)
    elseif delta < 0 then exports['corex-core']:RemoveMoney(target, kind, -delta) end

    local actorName = GetActor(src)
    logAction(src, actorName, 'set_money', { target = target, kind = kind, amount = amount }, true, 'ok', target, shot)
    return true
end

-----------------------------------------------------------------------
-- Give / Remove item (via corex-inventory)
-----------------------------------------------------------------------
function ActionGiveItem(src, target, itemId, count)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    target = tonumber(target); count = tonumber(count) or 1
    if not target or not itemId then return false, 'bad_args' end
    if count <= 0 or count > Config.MaxGiveItemCount then return false, 'bad_count' end
    if GetResourceState('corex-inventory') ~= 'started' then return false, 'no_inventory' end
    if not exports['corex-core']:GetPlayer(target) then return false, 'target_offline' end

    local shot = maybeCaptureScreenshot('give_item', target)
    local added = exports['corex-inventory']:AddItem(target, itemId, count)
    local actorName = GetActor(src)
    logAction(src, actorName, 'give_item', { target = target, item = itemId, count = count }, added and true or false, tostring(added), target, shot)
    return added and true or false
end

function ActionRemoveItem(src, target, itemId, count)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    target = tonumber(target); count = tonumber(count) or 1
    if not target or not itemId then return false, 'bad_args' end
    if count <= 0 then return false, 'bad_count' end
    if GetResourceState('corex-inventory') ~= 'started' then return false, 'no_inventory' end

    local shot = maybeCaptureScreenshot('remove_item', target)
    local removed = exports['corex-inventory']:RemoveItem(target, itemId, count)
    local actorName = GetActor(src)
    logAction(src, actorName, 'remove_item', { target = target, item = itemId, count = count }, removed and true or false, tostring(removed), target, shot)
    return removed and true or false
end

-----------------------------------------------------------------------
-- Revive / Warn (lightweight wrappers — corex-death may extend later)
-----------------------------------------------------------------------
-- Admin "revive" doubles as a full-heal: works whether the target is alive
-- (in which case it just restores HP + clears bad vitals) or dead (then it
-- also flips lifecycleState back to 'active' so the death cycle releases).
function ActionRevive(src, target)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    target = tonumber(target); if not target then return false, 'bad_target' end
    if not exports['corex-core']:GetPlayer(target) then return false, 'target_offline' end

    local shot = maybeCaptureScreenshot('revive', target)
    -- Restore lifecycle first so any death-cycle gates release before we set
    -- HP (otherwise the player can be re-killed by survival's regen blocker).
    exports['corex-core']:SetPlayerState(target, 'active')
    -- Full HP + clear the meters that drive damage gates.
    TriggerClientEvent('corex:client:setHealth', target, 200)
    pcall(exports['corex-core'].SetMetaData, exports['corex-core'], target, 'hunger',    100)
    pcall(exports['corex-core'].SetMetaData, exports['corex-core'], target, 'thirst',    100)
    pcall(exports['corex-core'].SetMetaData, exports['corex-core'], target, 'stress',    0)
    pcall(exports['corex-core'].SetMetaData, exports['corex-core'], target, 'infection', 0)
    pcall(exports['corex-core'].SetMetaData, exports['corex-core'], target, 'bleeding',  0)
    pcall(exports['corex-core'].SetMetaData, exports['corex-core'], target, 'cold',      0)
    pcall(exports['corex-core'].SetMetaData, exports['corex-core'], target, 'sick',      0)
    pcall(exports['corex-core'].SetMetaData, exports['corex-core'], target, 'poison',    0)

    TriggerClientEvent('corex:notify', target, 'Admin restored your health', 'success', 4000, 'Admin')

    local actorName = GetActor(src)
    logAction(src, actorName, 'revive', { target = target }, true, 'ok', target, shot)
    return true
end

function ActionWarn(src, target, reason)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    target = tonumber(target); if not target then return false, 'bad_target' end
    if not exports['corex-core']:GetPlayer(target) then return false, 'target_offline' end

    local shot = maybeCaptureScreenshot('warn', target)
    local current = exports['corex-core']:GetMetaData(target, 'warnings') or 0
    exports['corex-core']:SetMetaData(target, 'warnings', current + 1)
    TriggerClientEvent('corex:notify', target,
        ('Admin warning: %s'):format(reason or 'no reason given'), 'warning', 8000, 'Admin')

    local actorName = GetActor(src)
    logAction(src, actorName, 'warn', { target = target, reason = reason }, true, 'ok', target, shot)
    return true
end

-----------------------------------------------------------------------
-- Teleport to player / Spectate
-----------------------------------------------------------------------
function ActionTeleport(src, target)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    target = tonumber(target); if not target then return false, 'bad_target' end
    if src == target then return false, 'cannot_target_self' end
    if not GetPlayerName(target) then return false, 'target_offline' end

    -- Server pulls the live target coords, then asks the actor's client to
    -- jump there. Server-authoritative coord lookup prevents a malicious
    -- client from teleporting itself anywhere via a forged ped id.
    local ped = GetPlayerPed(target)
    if not ped or ped == 0 then return false, 'target_no_ped' end
    local pc = GetEntityCoords(ped)
    if not pc or pc.x ~= pc.x then return false, 'target_no_coords' end

    TriggerClientEvent('corex-admin:client:teleportTo', src, {
        x = pc.x, y = pc.y, z = pc.z,
        heading = GetEntityHeading(ped) or 0.0,
    })

    local actorName = GetActor(src)
    logAction(src, actorName, 'teleport', { target = target }, true, 'ok', target)
    return true
end

function ActionSpectate(src, target)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    target = tonumber(target); if not target then return false, 'bad_target' end
    if src == target then return false, 'cannot_target_self' end
    if not GetPlayerName(target) then return false, 'target_offline' end

    -- We also resolve the target's coords server-side and ship them with
    -- the event. `GetPlayerFromServerId` on the actor's client returns -1
    -- when the target isn't in scope (too far on the map), so the client
    -- must first teleport to those coords to bring the ped into scope —
    -- without coords there's no reliable way to spectate someone on the
    -- other side of the map.
    local payload = {
        target = target,
        name   = GetPlayerName(target) or ('Player#' .. target),
        x = nil, y = nil, z = nil,
    }
    local targetPed = GetPlayerPed(target)
    if targetPed and targetPed ~= 0 then
        local pc = GetEntityCoords(targetPed)
        if pc and pc.x == pc.x then
            payload.x, payload.y, payload.z = pc.x, pc.y, pc.z
        end
    end

    TriggerClientEvent('corex-admin:client:spectate', src, payload)

    local actorName = GetActor(src)
    logAction(src, actorName, 'spectate', { target = target }, true, 'ok', target)
    return true
end

-----------------------------------------------------------------------
-- Server-wide announce
-----------------------------------------------------------------------
function ActionAnnounce(src, message, targets)
    local ok = gate(src); if not ok then return false, 'permission_denied' end
    if type(message) ~= 'string' or #message == 0 then return false, 'empty_message' end

    if type(targets) == 'table' and #targets > 0 then
        for _, t in ipairs(targets) do
            TriggerClientEvent('corex:notify', tonumber(t), message, 'info', 8000, 'Admin')
        end
    else
        TriggerClientEvent('corex:notify', -1, message, 'info', 8000, 'Admin')
    end

    local actorName = GetActor(src)
    logAction(src, actorName, 'announce', { targets = targets and #targets or 'all', message = message }, true, 'ok')
    return true
end
