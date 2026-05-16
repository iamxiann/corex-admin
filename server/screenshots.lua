local SCREENSHOT_TIMEOUT = 10

---@param targetSrc number
---@return string|nil bytes
function CaptureScreenshotBytes(targetSrc)
    if GetResourceState('screenshot-basic') ~= 'started' then
        print('^3[corex-admin]^7 CaptureScreenshotBytes: screenshot-basic not started')
        return nil
    end
    if not GetPlayerName(targetSrc) then
        print('^3[corex-admin]^7 CaptureScreenshotBytes: target offline (src=' .. tostring(targetSrc) .. ')')
        return nil
    end

    local p = promise.new()
    local resolved = false
    local function safeResolve(v) if not resolved then resolved = true; p:resolve(v) end end

    exports['screenshot-basic']:requestClientScreenshot(targetSrc, {
        encoding = 'jpg',
        quality  = 0.7,
    }, function(err, dataUri)
        if err then
            print('^3[corex-admin]^7 screenshot-basic returned error: ' .. tostring(err))
            safeResolve(nil); return
        end
        if type(dataUri) ~= 'string' then
            safeResolve(nil); return
        end
        local _, _, b64 = dataUri:find('^data:image/[^;]+;base64,(.+)$')
        if not b64 then b64 = dataUri end
        local decoded = DecodeBase64(b64)
        if not decoded or #decoded < 200 then
            print('^3[corex-admin]^7 screenshot decode failed or empty (size=' .. tostring(decoded and #decoded or 0) .. ')')
            safeResolve(nil); return
        end

        if decoded:sub(1, 3) ~= '\xFF\xD8\xFF' then
            print('^3[corex-admin]^7 screenshot bytes are not a valid JPEG (skipping attachment)')
            safeResolve(nil); return
        end
        safeResolve(decoded)
    end)

    SetTimeout(SCREENSHOT_TIMEOUT * 1000, function() safeResolve(nil) end)
    return Citizen.Await(p)
end

local B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local B64_INDEX = {}
for i = 1, #B64_ALPHABET do B64_INDEX[B64_ALPHABET:sub(i,i)] = i - 1 end

function DecodeBase64(input)
    if type(input) ~= 'string' then return nil end
    input = input:gsub('[^A-Za-z0-9+/=]', '')
    local out = {}
    local i, n = 1, #input
    while i <= n do
        local c1 = B64_INDEX[input:sub(i,   i)]   or 0
        local c2 = B64_INDEX[input:sub(i+1, i+1)] or 0
        local c3 = B64_INDEX[input:sub(i+2, i+2)] or 0
        local c4 = B64_INDEX[input:sub(i+3, i+3)] or 0
        out[#out+1] = string.char(((c1 << 2) | (c2 >> 4)) & 0xFF)
        if input:sub(i+2, i+2) ~= '=' then
            out[#out+1] = string.char((((c2 & 0x0F) << 4) | ((c3 >> 2) & 0x0F)) & 0xFF)
        end
        if input:sub(i+3, i+3) ~= '=' then
            out[#out+1] = string.char((((c3 & 0x03) << 6) | c4) & 0xFF)
        end
        i = i + 4
    end
    return table.concat(out)
end

local ACTION_TITLE = {
    kick        = { verb = 'Kick',        color = 0xF59E0B },
    ban         = { verb = 'Ban',         color = 0xEF4444 },
    warn        = { verb = 'Warning',     color = 0xF59E0B },
    revive      = { verb = 'Revive',      color = 0x10B981 },
    teleport    = { verb = 'Teleport',    color = 0x60A5FA },
    spectate    = { verb = 'Spectate',    color = 0x60A5FA },
    give_money  = { verb = 'Give money',  color = 0x10B981 },
    set_money   = { verb = 'Set money',   color = 0x71717A },
    give_item   = { verb = 'Give item',   color = 0x10B981 },
    remove_item = { verb = 'Remove item', color = 0xEF4444 },
    announce    = { verb = 'Announce',    color = 0x60A5FA },
}

local function safe(v, fallback)
    if v == nil then return fallback or '—' end
    local s = tostring(v)
    if s == '' then return fallback or '—' end
    if #s > 1000 then return s:sub(1, 997) .. '…' end
    return s
end

local function shapeDescription(action, payload)
    if type(payload) ~= 'table' then return nil end

    if action == 'give_money' or action == 'set_money' then
        local kind = (payload.kind or 'cash'):upper()
        local amt  = tonumber(payload.amount) or 0
        if action == 'set_money' then
            return ('Set **%s** balance to **$%s**'):format(kind, tostring(amt))
        end
        return ('%s **$%s** on **%s**'):format(amt >= 0 and 'Added' or 'Removed', tostring(math.abs(amt)), kind)
    end

    if action == 'give_item' then
        return ('Gave **%dx %s**'):format(tonumber(payload.count) or 1, tostring(payload.item or '?'))
    end
    if action == 'remove_item' then
        return ('Removed **%dx %s**'):format(tonumber(payload.count) or 1, tostring(payload.item or '?'))
    end

    if action == 'warn' or action == 'kick' or action == 'ban' then
        local r = payload.reason
        if type(r) == 'string' and #r > 0 then
            local trimmed = (#r > 800) and (r:sub(1, 797) .. '…') or r
            local extra = ''
            if action == 'ban' and payload.duration then
                extra = ('\n**Duration:** `%s`'):format(payload.duration)
            end
            return ('> %s%s'):format(trimmed:gsub('\n', '\n> '), extra)
        end
        return nil
    end

    if action == 'announce' then
        local m = payload.message
        if type(m) == 'string' and #m > 0 then
            local trimmed = (#m > 800) and (m:sub(1, 797) .. '…') or m
            local audience = (type(payload.targets) == 'number') and ('to %d player(s)'):format(payload.targets) or 'to everyone'
            return ('Broadcast %s:\n> %s'):format(audience, trimmed:gsub('\n', '\n> '))
        end
        return nil
    end

    if action == 'teleport' then return 'Teleported to the target.'  end
    if action == 'spectate' then return 'Started spectating the target.' end
    if action == 'revive'   then return 'Restored health and vitals.'    end
    return nil
end

local function buildEmbed(action, actorName, targetName, payload, ok, hasImage)
    local m = ACTION_TITLE[action] or { verb = action, color = 0x6B7280 }
    local title = m.verb
    local color = ok and m.color or 0xEF4444
    if not ok then title = 'FAILED · ' .. m.verb end

    local fields = {
        { name = 'Admin', value = safe(actorName), inline = true },
    }
    if targetName and targetName ~= '—' and targetName ~= '' then
        fields[#fields + 1] = { name = 'Target', value = safe(targetName), inline = true }
    end

    local embed = {
        title     = title,
        color     = color,
        fields    = fields,
        timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),
        footer    = { text = 'corex-admin' },
    }
    local desc = shapeDescription(action, payload)
    if desc and desc ~= '' then embed.description = desc end
    if hasImage then embed.image = { url = 'attachment://evidence.jpg' } end
    return embed
end

---@param action string
---@param actorName string
---@param targetName string
---@param payload table
---@param ok boolean
---@param screenshotBytes string|nil  raw jpg bytes
function PostActionToDiscord(action, actorName, targetName, payload, ok, screenshotBytes)
    if not Config.LogToDiscord or Config.DiscordWebhook == '' then return end

    local function postPlain()
        local embed = buildEmbed(action, actorName, targetName, payload, ok, false)
        local body = json.encode({
            username = Config.DiscordWebhookName,
            embeds   = { embed },
        })
        PerformHttpRequest(Config.DiscordWebhook, function(status)
            if status ~= 200 and status ~= 204 then
                print('^3[corex-admin]^7 Discord webhook (plain) returned ' .. tostring(status))
            end
        end, 'POST', body, { ['Content-Type'] = 'application/json' })
    end

    if not screenshotBytes then
        postPlain()
        return
    end

    local embed = buildEmbed(action, actorName, targetName, payload, ok, true)
    local payloadJson = json.encode({
        username = Config.DiscordWebhookName,
        embeds   = { embed },
    })

    local boundary = '----corex-admin-' .. tostring(math.random(1, 1e9))
    local body = table.concat({
        '--', boundary, '\r\n',
        'Content-Disposition: form-data; name="payload_json"\r\n',
        'Content-Type: application/json\r\n\r\n',
        payloadJson, '\r\n',
        '--', boundary, '\r\n',
        'Content-Disposition: form-data; name="files[0]"; filename="evidence.jpg"\r\n',
        'Content-Type: image/jpeg\r\n\r\n',
        screenshotBytes, '\r\n',
        '--', boundary, '--\r\n',
    })

    PerformHttpRequest(Config.DiscordWebhook, function(status, responseBody)
        if status == 200 or status == 204 then return end
        print(('^3[corex-admin]^7 Discord webhook (multipart) returned %s — retrying without image. body=%s'):format(
            tostring(status),
            tostring(responseBody and responseBody:sub(1, 200) or '')
        ))

        postPlain()
    end, 'POST', body, {
        ['Content-Type'] = 'multipart/form-data; boundary=' .. boundary,
    })
end
