# Glide: your phone as a trackpad

Glide turns your phone into a wireless trackpad, mouse, and keyboard for your laptop.
It works on iPhone and Android with nothing to install on the phone. The laptop runs a
small server, and the phone opens the trackpad in its browser over your Wi-Fi.

## Quick start

1. Install **Python 3.9+** on your laptop (https://python.org/downloads).
2. Download this `glide` folder and start it:
   - **Windows:** double-click `start.bat`
   - **macOS:** double-click `start.command` (or run `./start.sh`)
   - **Linux:** `./start.sh`
3. A pairing page with a QR code opens on the laptop (the QR code also prints in the terminal).
   Scan it with your phone's camera. The phone and laptop must be on the **same Wi-Fi**.
4. Optional: in the phone's browser, choose **Add to Home Screen** to get a full-screen app icon.

## Android app (recommended on Android)

`Glide.apk` is a native Android app with the same trackpad, plus a few extras:

- **Auto-discovery:** computers running Glide on your Wi-Fi show up in a list. If your
  laptop's IP address changes, the app finds it again and reconnects on its own.
- **QR pairing in the app:** tap *Scan QR code*, or paste the pairing link.
- **Remembers several computers.** Tap the status pill to switch between them.
- **Crisp haptics** from the phone's haptic engine, and the **screen stays awake** while you use it.
- **Volume keys as mouse buttons** (optional, in Settings): Volume Down is left click, Volume Up is right click. Hold a key to drag.
- True full screen, with no browser bars.

To install, download `Glide.apk` to the phone, open it, and allow "Install unknown apps"
when Android asks. The first pairing needs the QR code. After that, just open the app.
To rebuild it, run `android/build.sh` (see the comments at the top of that file).

## Gestures

| Gesture | Action |
|---|---|
| Slide one finger | Move the pointer (speed-sensitive acceleration) |
| Tap | Left click (double-tap = double-click) |
| Two-finger tap | Right click |
| Three-finger tap | Middle click |
| Two-finger drag | Scroll, with momentum |
| Pinch | Zoom (Ctrl/⌘ + scroll) |
| Press and hold, then move | Drag (select text, move windows/files) |
| Three-finger swipe ← / → | Browser back / forward |
| Three-finger swipe ↑ / ↓ | Task view / show desktop |
| Side strip | Scroll with one finger |
| Left / Right buttons | Real press-and-hold buttons. Hold one while moving with another finger to drag. |

The **keyboard** button opens typing, arrow keys, shortcuts (copy, paste, undo, switch app)
and media controls (play/pause, next, volume). **Settings** has pointer speed, acceleration,
scroll speed, natural scrolling, momentum, haptics, and a left-handed layout. Settings are
saved on the phone.

## Platform notes

- **macOS:** the first time, allow your Terminal app in *System Settings → Privacy & Security →
  Accessibility*, then restart Glide. Without that, macOS ignores the input.
- **Windows:** when the firewall prompt appears, allow access on **Private networks**.
  Scrolling uses high-resolution wheel events, so it is smooth.
- **Linux:** needs an X11 session. Wayland blocks synthetic input.

## Options

```
python glide.py --port 8766     # use another port
python glide.py --host 192.168.1.20   # put a specific IP in the QR code
python glide.py --new-key       # make a new pairing key (unpairs old phones)
python glide.py --no-browser    # don't open the pairing page
```

## How it works

- `glide.py` is an asyncio HTTP and WebSocket server written with the Python standard
  library. It turns messages into OS input with `pynput`. It disables Nagle's algorithm
  for low latency and keeps sub-pixel remainders so slow, precise movement never gets lost.
- `static/` holds the phone app, written in plain HTML, CSS and JS. A pointer-events
  gesture engine handles tap, hold, two- and three-finger gestures, pinch, and momentum.
  If Wi-Fi stalls, motion is merged instead of queued, so the pointer never lags behind
  your finger. A canvas draws the touch-glow effect.
- **Security:** connections need a random pairing key that is embedded in the QR code
  (stored in `~/.glide/token`). The pairing page is only served to the laptop itself.
  Anyone without the key is rejected. Traffic is unencrypted LAN HTTP, so use Glide on
  networks you trust.
