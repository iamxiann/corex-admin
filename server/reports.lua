-- corex-admin · reports

local REPORT_CATEGORIES = {
    cheating = true, harassment = true, rdm = true, bug = true, other = true,
}

CreateThread(function()
    if GetResourceState('oxmysql') ~= 'started' then
        print('^1[corex-admin]^7 oxmysql not started — reports disabled.')
        return
    end
    MySQL.query.await([[
        CREATE TABLE IF NOT EXISTS `corex_reports` (
            `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `reporter_id`   VARCHAR(60)  NOT NULL,
            `reporter_name` VARCHAR(64)  NOT NULL,
            `target_name`   VARCHAR(64)  NOT NULL DEFAULT '',
            `target_id`     VARCHAR(60)  NOT NULL DEFAULT '?',
            `category`      VARCHAR(32)  NOT NULL,
            `description`   TEXT         NOT NULL,
            `status`        ENUM('open','in_progress','resolved','dismissed') NOT NULL DEFAULT 'open',
            `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `resolved_at`   TIMESTAMP    NULL,
            `resolved_by`   VARCHAR(64)  NULL,
            PRIMARY KEY (`id`),
            KEY `idx_status`  (`status`),
            KEY `idx_created` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
end)

-- Explicit global assignment via _G so any lua54 strict-globals config can't
-- accidentally swallow the definitions. server/main.lua expects these names.

_G.ReportsList = function(filter)
    filter = filter or 'open'
    local rows
    if filter == 'all' then
        rows = MySQL.query.await('SELECT * FROM corex_reports ORDER BY created_at DESC LIMIT 200')
    elseif filter == 'resolved' then
        rows = MySQL.query.await("SELECT * FROM corex_reports WHERE status IN ('resolved','dismissed') ORDER BY created_at DESC LIMIT 200")
    else
        rows = MySQL.query.await("SELECT * FROM corex_reports WHERE status = 'open' ORDER BY created_at DESC LIMIT 200")
    end
    return rows or {}
end

_G.ReportsCount = function()
    local n = MySQL.scalar.await("SELECT COUNT(*) FROM corex_reports WHERE status = 'open'")
    return tonumber(n) or 0
end

_G.ReportsSubmit = function(src, category, description, targetName, targetId)
    if type(category)   ~= 'string'  or not REPORT_CATEGORIES[category]          then return nil, 'bad_category'    end
    if type(description) ~= 'string' or #description < 10 or #description > 1000 then return nil, 'bad_description' end
    targetName = (type(targetName) == 'string' and #targetName > 0) and targetName:sub(1, 64) or ''
    targetId   = (type(targetId)   == 'string' and #targetId   > 0) and targetId:sub(1, 60)   or '?'

    local player = exports['corex-core']:GetPlayer(src)
    if not player then return nil, 'unknown_reporter' end

    local id = MySQL.insert.await([[
        INSERT INTO corex_reports (reporter_id, reporter_name, target_name, target_id, category, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ]], {
        player.identifier or '?',
        player.name or GetPlayerName(src) or '?',
        targetName,
        targetId,
        category,
        description,
    })

    -- Notify on-duty admins so they see it immediately.
    local players = exports['corex-core']:GetPlayers() or {}
    for adminSrc in pairs(players) do
        local s = tonumber(adminSrc)
        if s and IsAdmin(s) then
            TriggerClientEvent('corex:notify', s,
                ('New report — %s'):format(category), 'warning', 6000, 'Reports')
        end
    end

    if Config.LogToConsole then
        print(('^3[corex-admin]^7 report #%s from %s · category=%s'):format(id, player.name or '?', category))
    end
    return id
end

_G.ReportsResolve = function(actorSrc, reportId, newStatus)
    if not IsAdmin(actorSrc) then return false, 'permission_denied' end
    reportId = tonumber(reportId); if not reportId then return false, 'bad_id' end
    if newStatus ~= 'resolved' and newStatus ~= 'dismissed' then return false, 'bad_status' end
    local actorName = GetActor(actorSrc)
    local affected = MySQL.update.await([[
        UPDATE corex_reports
        SET status = ?, resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
        WHERE id = ? AND status = 'open'
    ]], { newStatus, actorName, reportId })
    return affected and affected > 0
end
