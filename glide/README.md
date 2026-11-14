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

## Wired connection (USB-C cable)

You can connect over a USB-C to USB-C cable (or USB-C to USB-A) with no Wi-Fi at all.
**HDMI can't do this.** HDMI only sends video *out* of the laptop, and phones have no HDMI
input, so touch data can't travel back over it.

### Option 1: USB debugging (fastest, about 1 ms, Android)

1. On the phone, enable **Developer options**: Settings › About phone, then tap
   *Build number* 7 times.
2. Turn on **Settings › Developer options › USB debugging**.
3. Start Glide on the laptop and plug in the cable. Tap **Allow** on the phone's
   "Allow USB debugging?" prompt (tick *Always allow from this computer*).
4. Open the Glide app. It pairs over the cable by itself (no QR code needed) and shows a
   **USB** badge. Unplug the cable and it switches to Wi-Fi automatically.

Glide uses Google's `adb` tool for this. If `adb` isn't installed, Glide downloads the
official platform-tools (~7 MB) next to `glide.py` on first run. Use `--no-adb-download`
to prevent that, or `--adb /path/to/adb` to use your own. On Windows, some phones
(for example Samsung) also need the manufacturer's USB driver.

In a phone **browser** (no app) with USB debugging, open `http://localhost:8765` instead.

### Option 2: USB tethering (no developer settings)

1. Plug in the cable and turn on **Settings › Network › Hotspot & tethering › USB tethering**.
2. Open the Glide app. It finds the laptop over the cable network automatically.

Your laptop may then use the phone's mobile data for internet. Turn mobile data off if
you don't want that. iPhones can do the same with Personal Hotspot over the cable,
using the browser version.

## Layout: horizontal or vertical

Pick how you hold the phone in **Settings › Layout**:

- **Horizontal** (default): the phone sideways is one wide trackpad, like a laptop's. Left and
  right click areas are built into its bottom edge and a scroll zone runs along its right edge.
- **Vertical:** the phone upright, with a tall pad, a side scroll strip and big buttons below.
- **Auto:** follows however you're holding the phone.

The rotate button in the top bar flips between horizontal and vertical in one tap. The
Android app turns the screen itself and remembers your choice. In a phone browser, Glide
asks you to turn the phone if it's the wrong way round.

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
| Side strip (dotted right edge) | Scroll with one finger |
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
python glide.py --no-usb        # turn off USB-cable (adb) mode
python glide.py --adb PATH      # use a specific adb executable
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
  (stored in `~/.glide/token`). The pairing page and the USB key handoff are only served to
  the laptop itself or the phone on the cable. They check the Host header (so DNS-rebinding
  tricks fail) and send no CORS headers, so websites open on the laptop can't read the key.
  Anyone without the key is rejected. Traffic is unencrypted LAN HTTP, so use Glide on
  networks you trust.
