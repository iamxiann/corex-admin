-- corex-admin · bans (oxmysql)
-- Owns the `corex_bans` table: list/create/lift/extend, plus the connect filter
-- that drops players whose identifier has an active ban.

local DURATION_SECONDS = Config.BanDurations or {}

local function durationToExpires(duration)
    local sec = DURATION_SECONDS[duration]
    if not sec or sec < 0 then return nil end
    return os.date('!%Y-%m-%d %H:%M:%S', os.time() + sec)
end

-- Auto-create the table on resource start so first-time installers don't need to
-- copy/paste SQL. Idempotent.
CreateThread(function()
    if GetResourceState('oxmysql') ~= 'started' then
        print('^1[corex-admin]^7 oxmysql is not started — bans will not work.')
        return
    end
    MySQL.query.await([[
        CREATE TABLE IF NOT EXISTS `corex_bans` (
            `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `identifier`    VARCHAR(60)  NOT NULL,
            `player_name`   VARCHAR(64)  NOT NULL,
            `reason`        TEXT         NOT NULL,
            `duration`      VARCHAR(16)  NOT NULL DEFAULT 'perma',
            `banned_by`     VARCHAR(64)  NOT NULL,
            `banned_by_id`  VARCHAR(60)  NULL,
            `banned_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `expires_at`    TIMESTAMP    NULL,
            `status`        ENUM('active','expired','lifted') NOT NULL DEFAULT 'active',
            `lifted_at`     TIMESTAMP    NULL,
            `lifted_by`     VARCHAR(64)  NULL,
            PRIMARY KEY (`id`),
            KEY `idx_identifier` (`identifier`),
            KEY `idx_status`     (`status`),
            KEY `idx_expires`    (`expires_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
end)

---List bans, newest first. Filter is 'active'|'expired'|'lifted'|'all'.
function BansList(filter)
    filter = filter or 'active'
    local where = filter == 'all' and '' or 'WHERE status = ?'
    local args  = filter == 'all' and {}  or { filter }
    local rows = MySQL.query.await(('SELECT * FROM corex_bans %s ORDER BY banned_at DESC LIMIT 250'):format(where), args) or {}

    -- Auto-mark expired bans without waiting for a cron job
    local now = os.time()
    for _, row in ipairs(rows) do
        if row.status == 'active' and row.expires_at then
            local t = MySQL.scalar.await('SELECT UNIX_TIMESTAMP(?)', { row.expires_at }) or 0
            if t > 0 and t <= now then
                row.status = 'expired'
                MySQL.update('UPDATE corex_bans SET status = "expired" WHERE id = ?', { row.id })
            end
        end
    end
    return rows
end

---Create a ban + kick the player if online. Returns the new row id.
function BansCreate(actorSrc, targetSrc, duration, reason)
    if not IsAdmin(actorSrc) then return nil, 'permission_denied' end
    targetSrc = tonumber(targetSrc); if not targetSrc then return nil, 'bad_target' end

    local player = exports['corex-core']:GetPlayer(targetSrc)
    if not player then return nil, 'target_offline' end
    -- corex-core player object is flat (no PlayerData wrapper)
    local pName = player.name or GetPlayerName(targetSrc) or '?'
    local pIdent = player.identifier or '?'
    local actorName, actorIdent = GetActor(actorSrc)

    local expiresAt = durationToExpires(duration)
    local id = MySQL.insert.await([[
        INSERT INTO corex_bans (identifier, player_name, reason, duration, banned_by, banned_by_id, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ]], {
        pIdent,
        pName,
        reason or 'no reason',
        duration or 'perma',
        actorName,
        actorIdent,
        expiresAt,
    })

    -- Capture evidence BEFORE the player is dropped (after = no client to ask).
    local shot
    if Config.LogToDiscord and Config.DiscordWebhook ~= '' and Config.CaptureEvidenceScreenshots then
        shot = CaptureScreenshotBytes(targetSrc)
    end

    DropPlayer(targetSrc, ('[BANNED] %s — %s'):format(duration or 'perma', reason or 'no reason'))
    print(('^3[corex-admin]^7 banned %s (%s) duration=%s by %s'):format(
        pName, pIdent, duration or 'perma', actorName))

    if Config.LogToDiscord and Config.DiscordWebhook ~= '' then
        PostActionToDiscord(
            'ban',
            ('%s (#%d)'):format(actorName, actorSrc),
            ('%s (#%d)'):format(pName, targetSrc),
            { duration = duration, reason = reason, identifier = pIdent },
            true,
            shot
        )
    end
    return id
end

---Lift an active ban by id. Returns true on success.
function BansLift(actorSrc, banId)
    if not IsAdmin(actorSrc) then return false, 'permission_denied' end
    banId = tonumber(banId); if not banId then return false, 'bad_id' end
    local actorName = GetActor(actorSrc)
    local affected = MySQL.update.await([[
        UPDATE corex_bans
        SET status = 'lifted', lifted_at = CURRENT_TIMESTAMP, lifted_by = ?
        WHERE id = ? AND status = 'active'
    ]], { actorName, banId })
    return affected and affected > 0
end

---Extend an active ban by N seconds. Returns true on success.
function BansExtend(actorSrc, banId, addSeconds)
    if not IsAdmin(actorSrc) then return false, 'permission_denied' end
    banId = tonumber(banId); addSeconds = tonumber(addSeconds)
    if not banId or not addSeconds or addSeconds <= 0 then return false, 'bad_args' end

    local row = MySQL.single.await('SELECT expires_at FROM corex_bans WHERE id = ? AND status = "active"', { banId })
    if not row then return false, 'not_found' end

    local current = os.time()
    if row.expires_at then
        local t = MySQL.scalar.await('SELECT UNIX_TIMESTAMP(?)', { row.expires_at }) or current
        current = math.max(current, t)
    end
    local newExpires = os.date('!%Y-%m-%d %H:%M:%S', current + addSeconds)
    local affected = MySQL.update.await('UPDATE corex_bans SET expires_at = ? WHERE id = ?', { newExpires, banId })
    return affected and affected > 0
end

-- ---------- Connect filter: block banned identifiers ----------------------

AddEventHandler('playerConnecting', function(_, setKickReason, deferrals)
    deferrals.defer()
    local src = source
    Wait(0)
    local idents = GetPlayerIdentifiers(src) or {}
    local license
    for _, id in ipairs(idents) do
        if id:sub(1, 8) == 'license:' then license = id break end
    end
    if not license then
        deferrals.done()
        return
    end

    local row = MySQL.single.await([[
        SELECT id, reason, duration, expires_at
        FROM corex_bans
        WHERE identifier = ? AND status = 'active'
        ORDER BY banned_at DESC LIMIT 1
    ]], { license })

    if not row then
        deferrals.done()
        return
    end

    if row.expires_at then
        local t = MySQL.scalar.await('SELECT UNIX_TIMESTAMP(?)', { row.expires_at }) or 0
        if t > 0 and t <= os.time() then
            MySQL.update('UPDATE corex_bans SET status = "expired" WHERE id = ?', { row.id })
            deferrals.done()
            return
        end
    end

    local msg = ('[BANNED] %s — %s%s'):format(
        row.duration,
        row.reason,
        row.expires_at and (' — expires ' .. row.expires_at .. ' UTC') or ''
    )
    setKickReason(msg)
    deferrals.done(msg)
end)
