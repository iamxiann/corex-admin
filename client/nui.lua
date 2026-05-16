local function relay(name)
    RegisterNUICallback(name, function(body, cb)

        local args = (body and body.args) or {}
        local ok, res = pcall(lib.callback.await, 'corex-admin:' .. name, false, table.unpack(args, 1, #args))
        if not ok then
            cb({ ok = false, error = tostring(res) })
            return
        end
        cb(res or { ok = false, error = 'no_response' })
    end)
end

relay('players')
relay('player')
relay('overview')
relay('items')
relay('bans')
relay('actions.recent')
relay('me')

relay('action.kick')
relay('action.warn')
relay('action.revive')
relay('action.teleport')
relay('action.spectate')
relay('action.giveMoney')
relay('action.setMoney')
relay('action.giveItem')
relay('action.removeItem')
relay('action.announce')

relay('bans.create')
relay('bans.lift')
relay('bans.extend')

relay('reports.list')
relay('reports.count')
relay('reports.submit')
relay('reports.resolve')
