#!/usr/bin/env bash
# Glide launcher for macOS / Linux. Creates a private virtualenv on first run.
set -e
cd "$(dirname "$0")"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/python -m pip install -q -r requirements.txt
exec .venv/bin/python glide.py "$@"
