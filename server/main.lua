local function deny()
    return { ok = false, error = 'permission_denied' }
end

lib.callback.register('corex-admin:players', function(source)
    if not IsAdmin(source) then return deny() end
    return { ok = true, data = ApiGetPlayers() }
end)

lib.callback.register('corex-admin:player', function(source, targetSrc)
    if not IsAdmin(source) then return deny() end
    return { ok = true, data = ApiGetPlayer(tonumber(targetSrc)) }
end)

lib.callback.register('corex-admin:overview', function(source)
    if not IsAdmin(source) then return deny() end
    return { ok = true, data = ApiGetOverview() }
end)

lib.callback.register('corex-admin:items', function(source)
    if not IsAdmin(source) then return deny() end
    return { ok = true, data = ApiGetItemsCatalog() }
end)

lib.callback.register('corex-admin:bans', function(source, filter)
    if not IsAdmin(source) then return deny() end
    return { ok = true, data = BansList(filter) }
end)

lib.callback.register('corex-admin:actions.recent', function(source, limit)
    if not IsAdmin(source) then return deny() end
    return { ok = true, data = ActionLogList(limit) }
end)

lib.callback.register('corex-admin:action.kick', function(source, target, reason)
    local ok, err = ActionKick(source, target, reason)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:action.warn', function(source, target, reason)
    local ok, err = ActionWarn(source, target, reason)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:action.revive', function(source, target)
    local ok, err = ActionRevive(source, target)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:action.teleport', function(source, target)
    local ok, err = ActionTeleport(source, target)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:action.spectate', function(source, target)
    local ok, err = ActionSpectate(source, target)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:action.giveMoney', function(source, target, kind, amount)
    local ok, err = ActionGiveMoney(source, target, kind, amount)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:action.setMoney', function(source, target, kind, amount)
    local ok, err = ActionSetMoney(source, target, kind, amount)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:action.giveItem', function(source, target, itemId, count)
    local ok, err = ActionGiveItem(source, target, itemId, count)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:action.removeItem', function(source, target, itemId, count)
    local ok, err = ActionRemoveItem(source, target, itemId, count)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:action.announce', function(source, message, targets)
    local ok, err = ActionAnnounce(source, message, targets)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:bans.create', function(source, target, duration, reason)
    local id, err = BansCreate(source, target, duration, reason)
    return { ok = id and true or false, error = err, data = id }
end)

lib.callback.register('corex-admin:bans.lift', function(source, banId)
    local ok, err = BansLift(source, banId)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:bans.extend', function(source, banId, addSeconds)
    local ok, err = BansExtend(source, banId, addSeconds)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:reports.list', function(source, filter)
    if not IsAdmin(source) then return deny() end
    return { ok = true, data = ReportsList(filter) }
end)

lib.callback.register('corex-admin:reports.count', function(source)
    if not IsAdmin(source) then return { ok = true, data = 0 } end
    return { ok = true, data = ReportsCount() }
end)

lib.callback.register('corex-admin:reports.submit', function(source, category, description)
    local id, err = ReportsSubmit(source, category, description)
    return { ok = id and true or false, error = err, data = id }
end)

lib.callback.register('corex-admin:reports.resolve', function(source, reportId, newStatus)
    local ok, err = ReportsResolve(source, reportId, newStatus)
    return { ok = ok, error = err }
end)

lib.callback.register('corex-admin:canOpen', function(source)
    local allowed = IsAdmin(source)
    return { ok = allowed }
end)

lib.callback.register('corex-admin:me', function(source)
    if not IsAdmin(source) then return { ok = false, error = 'permission_denied' } end
    local player = exports['corex-core']:GetPlayer(source)
    local name = (player and player.name) or GetPlayerName(source) or 'Admin'
    local mugshot = GetCachedMugshot(source) or ''
    local rank = 'Staff'
    if IsPlayerAceAllowed(source, 'corex.admin')   then rank = 'Admin'      end
    if IsPlayerAceAllowed(source, 'command.admin') then rank = 'Head Admin' end
    return {
        ok = true,
        data = {
            id       = source,
            name     = name,
            mugshot  = mugshot,
            rank     = rank,
            branding = {
                serverName = (Config.Branding and Config.Branding.ServerName) or 'CoreX',
                tagline    = (Config.Branding and Config.Branding.Tagline)    or '',
                logo       = (Config.Branding and Config.Branding.Logo)       or '',
                monogram   = (Config.Branding and Config.Branding.Monogram)   or 'CX',
            },
        },
    }
end)
