local TABLE_NAME = 'corex_admin_actions'

CreateThread(function()
    if GetResourceState('oxmysql') ~= 'started' then
        print('^1[corex-admin]^7 oxmysql not started — action log disabled.')
        return
    end
    MySQL.query.await([[
        CREATE TABLE IF NOT EXISTS `]] .. TABLE_NAME .. [[` (
            `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `actor_id`     VARCHAR(60)  NOT NULL DEFAULT '',
            `actor_name`   VARCHAR(64)  NOT NULL DEFAULT '',
            `actor_src`    INT          NULL,
            `action`       VARCHAR(32)  NOT NULL,
            `target_src`   INT          NULL,
            `target_name`  VARCHAR(64)  NULL,
            `target_id`    VARCHAR(60)  NULL,
            `detail`       VARCHAR(255) NULL,
            PRIMARY KEY (`id`),
            KEY `idx_created` (`created_at`),
            KEY `idx_action`  (`action`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
end)

local function formatDetail(action, payload)
    if type(payload) ~= 'table' then return '' end
    if action == 'give_money' or action == 'set_money' then
        local kind = payload.kind or 'cash'
        local amt  = payload.amount or 0
        local sign = (amt >= 0) and '+' or '-'
        return ('%s$%s on %s'):format(sign, math.abs(amt), kind)
    end
    if action == 'give_item' or action == 'remove_item' then
        return ('%dx %s'):format(payload.count or 1, payload.item or '?')
    end
    if action == 'warn' or action == 'kick' or action == 'ban' then
        local r = payload.reason
        if type(r) == 'string' and #r > 0 then
            return (#r > 80) and (r:sub(1, 77) .. '…') or r
        end
        return ''
    end
    if action == 'announce' then
        local m = payload.message
        if type(m) == 'string' and #m > 0 then
            return (#m > 80) and (m:sub(1, 77) .. '…') or m
        end
        return ''
    end
    if action == 'teleport' then
        return 'to player'
    end
    return ''
end

local function targetDisplay(targetSrc)
    if not targetSrc then return nil, nil end
    local n = tonumber(targetSrc); if not n or n <= 0 then return nil, nil end
    local name = GetPlayerName(n)
    if not name then return nil, nil end
    local ident
    local ok, player = pcall(exports['corex-core'].GetPlayer, exports['corex-core'], n)
    if ok and player then ident = player.identifier end
    return name, ident
end

---@param actorSrc number
---@param actorName string
---@param action string
---@param payload table?
function AppendActionLog(actorSrc, actorName, action, payload, targetSrc)
    if GetResourceState('oxmysql') ~= 'started' then return end
    local actorIdent = ''
    local ok, player = pcall(exports['corex-core'].GetPlayer, exports['corex-core'], actorSrc)
    if ok and player then actorIdent = player.identifier or '' end

    local tName, tIdent = targetDisplay(targetSrc or (type(payload) == 'table' and payload.target))
    local detail = formatDetail(action, payload)

    MySQL.insert(
        ('INSERT INTO %s (actor_id, actor_name, actor_src, action, target_src, target_name, target_id, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'):format(TABLE_NAME),
        { actorIdent, actorName or '?', actorSrc, action, targetSrc, tName, tIdent, detail }
    )
end

---@param limit number?
---@return table
function ActionLogList(limit)
    limit = tonumber(limit) or 30
    if limit < 1 then limit = 1 end
    if limit > 200 then limit = 200 end

    if GetResourceState('oxmysql') ~= 'started' then return {} end
    local rows = MySQL.query.await(
        ('SELECT id, created_at, actor_name, action, target_src, target_name, detail FROM %s ORDER BY id DESC LIMIT ?'):format(TABLE_NAME),
        { limit }
    ) or {}

    local out = {}
    for i, row in ipairs(rows) do
        local createdIso = row.created_at
        if type(createdIso) == 'string' then
            createdIso = createdIso:gsub(' ', 'T')
            if not createdIso:find('Z') then createdIso = createdIso .. 'Z' end
        elseif type(createdIso) == 'number' then
            createdIso = os.date('!%Y-%m-%dT%H:%M:%SZ', math.floor(createdIso / 1000))
        end

        out[i] = {
            id         = tostring(row.id),
            type       = row.action,
            by         = row.actor_name or '?',
            targetId   = row.target_src,
            targetName = row.target_name,
            at         = createdIso,
            detail     = row.detail or '',
            reversible = false,
        }
    end
    return out
end
