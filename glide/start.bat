@echo off
cd /d "%~dp0"
if not exist .venv ( python -m venv .venv || (echo Python 3 is required: https://python.org/downloads & pause & exit /b 1) )
.venv\Scripts\python -m pip install -q -r requirements.txt
.venv\Scripts\python glide.py %*
pause
