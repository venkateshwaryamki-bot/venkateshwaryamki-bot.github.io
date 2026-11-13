@echo off
setlocal EnableDelayedExpansion
title Glide
cd /d "%~dp0"
set "HERE=%~dp0"

echo.
echo   Glide - starting...
echo.

rem --- 1. Opened from inside the ZIP? Windows runs it from a temporary folder. -----------
if /i not "!HERE:\Temp\=!"=="!HERE!" (
  echo   [X] Glide is running from inside the ZIP file, so it can't find its files.
  echo.
  echo       Fix: close this window, right-click the ZIP file, choose "Extract All...",
  echo       open the extracted "glide" folder and double-click start.bat again.
  goto :fail
)
if not exist "glide.py" (
  echo   [X] glide.py is missing. Make sure start.bat is inside the "glide" folder.
  goto :fail
)

rem --- 2. Find a real Python 3.9+ (skips the Microsoft Store placeholder) -----------------
call :findpy
if not defined PY (
  echo   Python is not installed yet. Installing it now - this takes a minute or two...
  echo.
  where winget >nul 2>&1
  if errorlevel 1 (
    echo   [X] Couldn't install Python automatically on this PC.
    echo.
    echo       Fix: install it from the page that is opening now. On the first screen,
    echo       TICK "Add python.exe to PATH", click Install Now, then run start.bat again.
    start "" "https://www.python.org/downloads/windows/"
    goto :fail
  )
  winget install -e --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements
  call :findpy
)
if not defined PY (
  echo.
  echo   [X] Python was installed, but Windows needs a fresh window to find it.
  echo       Fix: close this window and double-click start.bat again.
  goto :fail
)
echo   Using Python: !PY!

rem --- 3. Private environment with Glide's two libraries ---------------------------------
if not exist ".venv\Scripts\python.exe" (
  echo   First run: setting things up...
  !PY! -m venv .venv
)
set "RUN=.venv\Scripts\python.exe"
if not exist ".venv\Scripts\python.exe" (
  echo   Using your main Python instead of a private environment.
  set "RUN=!PY!"
)
!RUN! -m pip install -q --disable-pip-version-check -r requirements.txt
if errorlevel 1 (
  echo.
  echo   [X] Couldn't download Glide's libraries. Check the laptop is online, then try again.
  goto :fail
)

rem --- 4. Run ------------------------------------------------------------------------------
echo.
!RUN! glide.py %*
if errorlevel 1 goto :fail
exit /b 0

:findpy
set "PY="
py -3 -c "import sys; sys.exit(sys.version_info < (3, 9))" >nul 2>&1 && set "PY=py -3" && exit /b 0
python -c "import sys; sys.exit(sys.version_info < (3, 9))" >nul 2>&1 && set "PY=python" && exit /b 0
for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do (
  if exist "%%~D\python.exe" "%%~D\python.exe" -c "import sys; sys.exit(sys.version_info < (3, 9))" >nul 2>&1 && set PY="%%~D\python.exe"
)
exit /b 0

:fail
echo.
echo   Glide stopped. If you need help, take a photo of this window.
echo.
pause
exit /b 1
