-- corex-admin · client entry
-- One NUI surface, two modes:
--   `/admin`  → permission-gated full admin panel
--   `/report` → public report form (any player can open)
-- Both share the same focus state so we never end up with two panels fighting
-- for the cursor.
--
-- If the NUI itself crashes (e.g. a React error mid-render), we MUST still be
-- able to re-open the panel. The previous version locked `isOpen = true` and
-- only flipped it back via an in-NUI "close" callback — when JS crashed that
-- callback never fired and /admin became a permanent no-op. We now treat
-- `isOpen` as a soft hint and always honour /admin (it just resets the NUI
-- back to a clean visible state).

local isOpen   = false
local curMode  = nil   -- 'admin' | 'report' | nil

local function setOpen(open, mode)
    isOpen  = open
    curMode = open and mode or nil
    SetNuiFocus(open, open)
    SetNuiFocusKeepInput(false)
    SendNUIMessage({ type = 'visibility', payload = { open = open, mode = mode } })
end

local function openAdmin()
    local res = lib.callback.await('corex-admin:canOpen', false)
    if not res or not res.ok then
        lib.notify({ type = 'error', description = 'You do not have admin permission.' })
        return
    end
    -- Force a clean visible state every time. If a previous NUI crash left
    -- isOpen stuck at true with focus released, /admin still re-opens cleanly.
    setOpen(true, 'admin')
end

local function openReport()
    setOpen(true, 'report')
end

local function closePanel()
    if not isOpen then return end
    setOpen(false, nil)
end

-- exposed so other client files can read state if needed
function CorexAdminIsOpen() return isOpen end
function CorexAdminMode()   return curMode end

RegisterCommand(Config.Command, openAdmin, false)
TriggerEvent('chat:addSuggestion', '/' .. Config.Command, 'Open the COREX admin panel')

RegisterCommand('report', openReport, false)
TriggerEvent('chat:addSuggestion', '/report', 'File a report for staff to review')

-- React → "I'm done, close me"
RegisterNUICallback('close', function(_, cb)
    closePanel()
    cb({ ok = true })
end)

-- Safety net: if NUI focus gets stuck (rare CEF bug, or a JS crash that
-- skipped the close callback) the panel can become un-focusable. The
-- `/admin-reset` command force-releases focus and clears our local flag.
RegisterCommand(Config.Command .. '-reset', function()
    isOpen = false
    curMode = nil
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
    lib.notify({ type = 'inform', description = 'Admin NUI focus released.' })
end, false)
TriggerEvent('chat:addSuggestion', '/' .. Config.Command .. '-reset', 'Force-release admin NUI focus (recovery)')

-- Stop cleanup: make sure focus isn't stuck on resource restart.
AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() and isOpen then
        SetNuiFocus(false, false)
    end
end)
