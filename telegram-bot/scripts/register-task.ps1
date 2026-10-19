<#
.SYNOPSIS
  Registers (or updates) the Windows scheduled task that auto-starts the AIOS Telegram bot.

.DESCRIPTION
  Idempotent: running it again updates the existing task in place.
  Runs at logon for the current user, restarts on failure, never runs a second
  instance (the bot also holds its own bot.lock), and has no execution time limit.

.PARAMETER TaskName
  Scheduled task name. Default: AIOS-TelegramBot.

.PARAMETER NodePath
  Full path to node.exe. Default: the node found on PATH.

.PARAMETER Unregister
  Remove the task instead of registering it.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\register-task.ps1
  powershell -ExecutionPolicy Bypass -File scripts\register-task.ps1 -Unregister
  powershell -ExecutionPolicy Bypass -File scripts\register-task.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$TaskName = 'AIOS-TelegramBot',
    [string]$NodePath,
    [switch]$Unregister
)

$ErrorActionPreference = 'Stop'

if ($Unregister) {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        if ($PSCmdlet.ShouldProcess($TaskName, 'Unregister scheduled task')) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-Host "Removed scheduled task '$TaskName'."
        }
    } else {
        Write-Host "Scheduled task '$TaskName' does not exist; nothing to remove."
    }
    return
}

$botDir = Split-Path -Parent $PSScriptRoot
$botJs = Join-Path $botDir 'bot.js'
if (-not (Test-Path $botJs)) { throw "bot.js not found at $botJs" }
if (-not (Test-Path (Join-Path $botDir '.env'))) { throw ".env not found in $botDir. Copy .env.example and set TELEGRAM_BOT_TOKEN first." }
if (-not (Test-Path (Join-Path $botDir 'users.json'))) { throw "users.json not found in $botDir. Copy users.example.json first." }

if (-not $NodePath) {
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $cmd) { throw 'node.exe not found on PATH. Pass -NodePath.' }
    $NodePath = $cmd.Source
}
if (-not (Test-Path $NodePath)) { throw "node.exe not found at $NodePath" }

$action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$botJs`"" -WorkingDirectory $botDir
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -RestartCount 5 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
$verb = if ($existing) { 'Update' } else { 'Register' }
$done = if ($existing) { 'Updated' } else { 'Registered' }

if ($PSCmdlet.ShouldProcess($TaskName, "$verb scheduled task (node $botJs)")) {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
        -Settings $settings -Principal $principal `
        -Description 'Starts the AIOS Telegram bot at logon and restarts it on failure.' `
        -Force | Out-Null
    Write-Host "$done scheduled task '$TaskName' (runs at logon as $env:USERNAME)."
    Write-Host "Start now:  Start-ScheduledTask -TaskName $TaskName"
    Write-Host "Stop:       Stop-ScheduledTask  -TaskName $TaskName"
    Write-Host "Remove:     powershell -File scripts\register-task.ps1 -Unregister"
}
