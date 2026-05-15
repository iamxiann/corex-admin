-- corex-admin · NUI <-> server bridge
-- For every server lib.callback name (e.g. 'corex-admin:players'), we expose a
-- matching NUI callback (e.g. 'players'). The React app fetches via
--   fetch(`https://corex-admin/players`)
-- and we relay to the server with lib.callback.await, returning the JSON.
--
-- This keeps the NUI layer thin: no business logic, just a transparent proxy.

local function relay(name)
    RegisterNUICallback(name, function(body, cb)
        -- body.args is a JSON array → 1-indexed Lua table. `table.unpack` expands
        -- it into the positional parameters the server callback expects.
        local args = (body and body.args) or {}
        local ok, res = pcall(lib.callback.await, 'corex-admin:' .. name, false, table.unpack(args, 1, #args))
        if not ok then
            cb({ ok = false, error = tostring(res) })
            return
        end
        cb(res or { ok = false, error = 'no_response' })
    end)
end

-- Read endpoints
relay('players')
relay('player')
relay('overview')
relay('items')
relay('bans')
relay('actions.recent')
relay('me')

-- Mutation endpoints — note the dotted names match the server registrations
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
