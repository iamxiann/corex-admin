local isOpen   = false
local curMode  = nil

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

    setOpen(true, 'admin')
end

local function openReport()
    setOpen(true, 'report')
end

local function closePanel()
    if not isOpen then return end
    setOpen(false, nil)
end

function CorexAdminIsOpen() return isOpen end
function CorexAdminMode()   return curMode end

RegisterCommand(Config.Command, openAdmin, false)
TriggerEvent('chat:addSuggestion', '/' .. Config.Command, 'Open the COREX admin panel')

RegisterCommand('report', openReport, false)
TriggerEvent('chat:addSuggestion', '/report', 'File a report for staff to review')

RegisterNUICallback('close', function(_, cb)
    closePanel()
    cb({ ok = true })
end)

RegisterCommand(Config.Command .. '-reset', function()
    isOpen = false
    curMode = nil
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
    lib.notify({ type = 'inform', description = 'Admin NUI focus released.' })
end, false)
TriggerEvent('chat:addSuggestion', '/' .. Config.Command .. '-reset', 'Force-release admin NUI focus (recovery)')

AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() and isOpen then
        SetNuiFocus(false, false)
    end
end)
