# Glide one-step installer for Windows.
# Paste into PowerShell:
#   irm https://raw.githubusercontent.com/venkateshwaryamki-bot/venkateshwaryamki-bot.github.io/ccr-450729e9-7pdmc1/glide/install.ps1 | iex
#
# Downloads Glide into %LOCALAPPDATA%\Glide, adds a "Glide" shortcut to the desktop and starts it.
# start.bat then installs Python (if missing) and Glide's two libraries on first run.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # makes downloads much faster in Windows PowerShell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Branch = 'ccr-450729e9-7pdmc1'
$ZipUrl = "https://github.com/venkateshwaryamki-bot/venkateshwaryamki-bot.github.io/archive/refs/heads/$Branch.zip"
$Dest   = Join-Path $env:LOCALAPPDATA 'Glide'

function Step($msg) { Write-Host "  > $msg" -ForegroundColor Cyan }

Write-Host ""
Write-Host "  Glide installer" -ForegroundColor Magenta
Write-Host ""

try {
    Step "Downloading Glide..."
    $work = Join-Path $env:TEMP ("glide-install-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $work | Out-Null
    $zip = Join-Path $work 'glide.zip'
    Invoke-WebRequest -Uri $ZipUrl -OutFile $zip -UseBasicParsing

    Step "Unpacking..."
    Expand-Archive -Path $zip -DestinationPath $work -Force
    $src = Get-ChildItem -Path $work -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'glide\glide.py') } | Select-Object -First 1
    if (-not $src) { throw "The download didn't contain the glide folder." }

    Step "Installing to $Dest ..."
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    # Copy over any older install; keeps its .venv so updates start quickly.
    Copy-Item -Path (Join-Path $src.FullName 'glide\*') -Destination $Dest -Recurse -Force
    Get-ChildItem -Path $Dest -Recurse -File | Unblock-File -ErrorAction SilentlyContinue
    Remove-Item -Path $work -Recurse -Force -ErrorAction SilentlyContinue

    Step "Adding a Glide shortcut to your desktop..."
    try {
        $desktop = [Environment]::GetFolderPath('Desktop')
        $shell = New-Object -ComObject WScript.Shell
        $lnk = $shell.CreateShortcut((Join-Path $desktop 'Glide.lnk'))
        $lnk.TargetPath = Join-Path $Dest 'start.bat'
        $lnk.WorkingDirectory = $Dest
        $lnk.Description = 'Use your phone as a trackpad'
        $lnk.Save()
    } catch {
        Write-Host "    (Couldn't create the shortcut - you can start Glide from $Dest\start.bat)" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "  Installed. Starting Glide now..." -ForegroundColor Green
    Write-Host "  Next time, just double-click the Glide icon on your desktop." -ForegroundColor Green
    Write-Host ""
    Start-Process -FilePath (Join-Path $Dest 'start.bat') -WorkingDirectory $Dest
}
catch {
    Write-Host ""
    Write-Host "  Install failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Check the laptop is online and try again. If it keeps failing, send a photo of this window." -ForegroundColor Red
}
