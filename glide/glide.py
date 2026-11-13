#!/usr/bin/env python3
"""
Glide - use your phone as a wireless trackpad for your computer.

Run this on your laptop, then scan the QR code with your phone (same Wi-Fi).
The phone opens a touch trackpad in its browser; every gesture is streamed
over a WebSocket and turned into real mouse / keyboard input here.

Only the standard library is needed for networking. Input injection uses
`pynput` (pip install pynput). `qrcode` is optional but recommended.
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import hashlib
import hmac
import ipaddress
import json
import mimetypes
import os
import platform
import secrets
import socket
import struct
import sys
import time
import webbrowser
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

VERSION = "1.1.0"
DISCOVER_MSG = b"GLIDE_DISCOVER"
HERE = Path(__file__).resolve().parent
STATIC = HERE / "static"
CONFIG_DIR = Path.home() / ".glide"
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
SYSTEM = platform.system()  # 'Windows', 'Darwin', 'Linux'

# --------------------------------------------------------------------------- #
#  Terminal styling
# --------------------------------------------------------------------------- #

if SYSTEM == "Windows":
    os.system("")  # enables ANSI escape codes in the Windows console

USE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def c(text: str, code: str) -> str:
    return f"\033[{code}m{text}\033[0m" if USE_COLOR else text


def log(msg: str, kind: str = "info") -> None:
    stamp = time.strftime("%H:%M:%S")
    icon = {"info": c("●", "38;5;111"), "ok": c("●", "38;5;114"),
            "warn": c("●", "38;5;214"), "err": c("●", "38;5;203")}[kind]
    print(f"  {c(stamp, '2')}  {icon}  {msg}", flush=True)


# --------------------------------------------------------------------------- #
#  Input backend (pynput, with per-OS tuning)
# --------------------------------------------------------------------------- #

class InputBackend:
    """Translates trackpad messages into OS input events.

    Sub-pixel motion and scroll are accumulated so slow, precise finger
    movement is never lost to integer rounding.
    """

    def __init__(self) -> None:
        try:
            from pynput import keyboard, mouse
        except Exception as exc:  # pragma: no cover - depends on host OS
            print()
            log("Could not load pynput, which Glide needs to control the mouse.", "err")
            log(f"Reason: {exc}", "err")
            log("Install it with:  python -m pip install pynput", "err")
            if SYSTEM == "Linux":
                log("On Linux, Glide needs an X11 session (Wayland blocks synthetic input).", "err")
            sys.exit(1)

        self.mouse = mouse.Controller()
        self.kb = keyboard.Controller()
        self.Button = mouse.Button
        self.Key = keyboard.Key
        self._mx = 0.0
        self._my = 0.0
        self._sx = 0.0
        self._sy = 0.0
        self._held: set[str] = set()

        if SYSTEM == "Darwin":
            # Post pixel-precise scroll events instead of 10px steps.
            self.mouse._SCROLL_SPEED = 1
            self._scroll_unit = 1.0          # 1 unit == 1 px
        elif SYSTEM == "Windows":
            self._scroll_unit = 100.0 / 120  # 1 unit == 1/120 notch (smooth)
        else:
            self._scroll_unit = 48.0         # X11: one wheel click per ~48 px

        K = self.Key
        primary = K.cmd if SYSTEM == "Darwin" else K.ctrl
        self.primary = primary
        self.keys = {
            "enter": K.enter, "backspace": K.backspace, "tab": K.tab, "esc": K.esc,
            "space": K.space, "delete": K.delete, "up": K.up, "down": K.down,
            "left": K.left, "right": K.right, "home": K.home, "end": K.end,
            "pageup": K.page_up, "pagedown": K.page_down,
            "volup": K.media_volume_up, "voldown": K.media_volume_down,
            "mute": K.media_volume_mute, "play": K.media_play_pause,
            "next": K.media_next, "prev": K.media_previous,
        }
        # Shortcuts expressed per platform.
        alt = K.alt
        self.combos = {
            "back": [primary, "["] if SYSTEM == "Darwin" else [alt, K.left],
            "forward": [primary, "]"] if SYSTEM == "Darwin" else [alt, K.right],
            "copy": [primary, "c"], "paste": [primary, "v"], "cut": [primary, "x"],
            "undo": [primary, "z"], "selectall": [primary, "a"],
            "switch": [K.cmd, K.tab] if SYSTEM == "Darwin" else [alt, K.tab],
            "desktop": [K.cmd, "d"] if SYSTEM == "Windows" else (
                [K.f11] if SYSTEM == "Darwin" else [K.cmd, "d"]),
            "overview": [K.ctrl, K.up] if SYSTEM == "Darwin" else (
                [K.cmd, K.tab] if SYSTEM == "Windows" else [K.cmd]),
        }

    # -- mouse ---------------------------------------------------------------
    def move(self, dx: float, dy: float) -> None:
        self._mx += dx
        self._my += dy
        ix, iy = int(self._mx), int(self._my)
        if ix or iy:
            self._mx -= ix
            self._my -= iy
            self.mouse.move(ix, iy)

    def scroll(self, dx: float, dy: float) -> None:
        # dx/dy follow the web "wheel" convention: +dy scrolls content down.
        self._sx += dx / self._scroll_unit
        self._sy += dy / self._scroll_unit
        ix, iy = int(self._sx), int(self._sy)
        if not (ix or iy):
            return
        self._sx -= ix
        self._sy -= iy
        if SYSTEM == "Windows":
            self.mouse.scroll(ix / 120, -iy / 120)
        else:
            self.mouse.scroll(ix, -iy)

    def zoom(self, amount: float) -> None:
        steps = max(-6, min(6, round(amount)))
        if not steps:
            return
        with self.kb.pressed(self.primary):
            for _ in range(abs(steps)):
                self.mouse.scroll(0, 1 if steps > 0 else -1)

    def _btn(self, name: str):
        return {"l": self.Button.left, "r": self.Button.right,
                "m": self.Button.middle}.get(name, self.Button.left)

    def click(self, name: str, count: int = 1) -> None:
        self.mouse.click(self._btn(name), max(1, min(3, count)))

    def down(self, name: str) -> None:
        if name not in self._held:
            self._held.add(name)
            self.mouse.press(self._btn(name))

    def up(self, name: str) -> None:
        if name in self._held:
            self._held.discard(name)
            self.mouse.release(self._btn(name))

    def release_all(self) -> None:
        for name in list(self._held):
            self.up(name)

    # -- keyboard ------------------------------------------------------------
    def text(self, s: str) -> None:
        if s:
            self.kb.type(s[:2000])

    def key(self, name: str) -> None:
        k = self.keys.get(name)
        if k is not None:
            self.kb.tap(k)

    def combo(self, name: str) -> None:
        keys = self.combos.get(name)
        if not keys:
            return
        for k in keys:
            self.kb.press(k)
        for k in reversed(keys):
            self.kb.release(k)


# --------------------------------------------------------------------------- #
#  Minimal RFC 6455 WebSocket (server side) on top of asyncio streams
# --------------------------------------------------------------------------- #

class WebSocket:
    def __init__(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        self.reader = reader
        self.writer = writer
        self.closed = False

    async def recv(self) -> str | None:
        """Return the next text message, or None when the socket closes."""
        fragments: list[bytes] = []
        while True:
            head = await self.reader.readexactly(2)
            fin = head[0] & 0x80
            opcode = head[0] & 0x0F
            masked = head[1] & 0x80
            length = head[1] & 0x7F
            if length == 126:
                length = struct.unpack("!H", await self.reader.readexactly(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", await self.reader.readexactly(8))[0]
            if length > 1 << 20:
                raise ConnectionError("frame too large")
            mask = await self.reader.readexactly(4) if masked else b""
            data = await self.reader.readexactly(length)
            if masked:
                data = bytes(b ^ mask[i & 3] for i, b in enumerate(data))

            if opcode == 0x8:                       # close
                await self._send(0x8, data[:2])
                self.closed = True
                return None
            if opcode == 0x9:                       # ping -> pong
                await self._send(0xA, data)
                continue
            if opcode == 0xA:                       # pong
                continue
            fragments.append(data)
            if fin:
                return b"".join(fragments).decode("utf-8", "replace")

    async def _send(self, opcode: int, payload: bytes) -> None:
        n = len(payload)
        if n < 126:
            header = struct.pack("!BB", 0x80 | opcode, n)
        elif n < 1 << 16:
            header = struct.pack("!BBH", 0x80 | opcode, 126, n)
        else:
            header = struct.pack("!BBQ", 0x80 | opcode, 127, n)
        self.writer.write(header + payload)
        await self.writer.drain()

    async def send(self, text: str) -> None:
        if not self.closed:
            await self._send(0x1, text.encode())


# --------------------------------------------------------------------------- #
#  Server
# --------------------------------------------------------------------------- #

def lan_ip() -> str:
    """Best guess at the address phones on the same network can reach."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # no packet is actually sent
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def load_token(regenerate: bool) -> str:
    """A persistent pairing key so a saved home-screen app keeps working."""
    path = CONFIG_DIR / "token"
    if not regenerate and path.exists():
        tok = path.read_text().strip()
        if len(tok) >= 16:
            return tok
    tok = secrets.token_urlsafe(18)
    try:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        path.write_text(tok)
        if SYSTEM != "Windows":
            path.chmod(0o600)
    except OSError:
        pass
    return tok


class GlideServer:
    def __init__(self, port: int, token: str, host_ip: str):
        self.port = port
        self.token = token
        self.host_ip = host_ip
        self.input = InputBackend()
        self.clients: set[WebSocket] = set()
        self.pair_url = f"http://{host_ip}:{port}/?k={token}"
        # Public id derived from the key: lets paired phones recognise this computer
        # on the network (e.g. after its IP changes) without revealing the key.
        self.server_id = hashlib.sha256(token.encode()).hexdigest()[:16]

    def beacon(self) -> bytes:
        return json.dumps({"glide": 1, "id": self.server_id, "name": socket.gethostname(),
                           "port": self.port, "os": SYSTEM, "v": VERSION}).encode()

    # -- HTTP -----------------------------------------------------------------
    async def handle(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        sock = writer.get_extra_info("socket")
        if sock is not None:
            try:
                sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            except OSError:
                pass
        peer = writer.get_extra_info("peername") or ("?", 0)
        try:
            raw = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 10)
        except (asyncio.TimeoutError, asyncio.IncompleteReadError,
                asyncio.LimitOverrunError, ConnectionError):
            writer.close()
            return

        lines = raw.decode("latin-1").split("\r\n")
        try:
            method, target, _ = lines[0].split(" ", 2)
        except ValueError:
            writer.close()
            return
        headers = {}
        for line in lines[1:]:
            if ":" in line:
                k, v = line.split(":", 1)
                headers[k.strip().lower()] = v.strip()

        url = urlsplit(target)
        query = parse_qs(url.query)

        if url.path == "/ws" and headers.get("upgrade", "").lower() == "websocket":
            await self.websocket(reader, writer, headers, query, peer)
            return

        if method not in ("GET", "HEAD"):
            await self.respond(writer, 405, b"Method not allowed", "text/plain")
            return

        if url.path == "/pair":
            # Only the computer itself may see the pairing key.
            if not ipaddress.ip_address(peer[0]).is_loopback:
                await self.respond(writer, 403, b"Forbidden", "text/plain")
                return
            await self.respond(writer, 200, self.pair_page().encode(), "text/html; charset=utf-8")
            return

        path = "index.html" if url.path in ("/", "") else url.path.lstrip("/")
        file = (STATIC / path).resolve()
        if STATIC.resolve() not in file.parents or not file.is_file():
            await self.respond(writer, 404, b"Not found", "text/plain")
            return
        ctype = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
        if file.suffix == ".webmanifest":
            ctype = "application/manifest+json"
        if ctype.startswith("text/") or ctype.endswith(("javascript", "json", "svg+xml")):
            ctype += "; charset=utf-8"
        await self.respond(writer, 200, file.read_bytes(), ctype, head=(method == "HEAD"))

    async def respond(self, writer, status, body: bytes, ctype: str, head=False):
        reason = {200: "OK", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed"}[status]
        hdr = (f"HTTP/1.1 {status} {reason}\r\nContent-Type: {ctype}\r\n"
               f"Content-Length: {len(body)}\r\nCache-Control: no-cache\r\n"
               f"X-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n")
        try:
            writer.write(hdr.encode() + (b"" if head else body))
            await writer.drain()
        except ConnectionError:
            pass
        finally:
            writer.close()

    # -- WebSocket session ------------------------------------------------------
    async def websocket(self, reader, writer, headers, query, peer):
        key = headers.get("sec-websocket-key")
        given = (query.get("k") or [""])[0]
        if not key:
            await self.respond(writer, 403, b"Bad handshake", "text/plain")
            return
        if not hmac.compare_digest(given.encode(), self.token.encode()):
            log(f"Rejected {peer[0]} — wrong pairing key", "warn")
            await self.respond(writer, 403, b"Wrong pairing key", "text/plain")
            return

        accept = base64.b64encode(hashlib.sha1((key + WS_GUID).encode()).digest()).decode()
        writer.write((
            "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\n"
            f"Connection: Upgrade\r\nSec-WebSocket-Accept: {accept}\r\n\r\n").encode())
        await writer.drain()

        ws = WebSocket(reader, writer)
        self.clients.add(ws)
        device = headers.get("user-agent", "")
        log(f"{c('Connected', '38;5;114')}  {peer[0]}  {c(short_device(device), '2')}", "ok")
        await ws.send(json.dumps({"t": "hello", "host": socket.gethostname(), "id": self.server_id,
                                  "os": SYSTEM, "v": VERSION}))
        try:
            while True:
                msg = await ws.recv()
                if msg is None:
                    break
                await self.dispatch(ws, msg)
        except (asyncio.IncompleteReadError, ConnectionError, OSError):
            pass
        finally:
            self.clients.discard(ws)
            self.input.release_all()   # never leave a button stuck down
            log(f"Disconnected  {peer[0]}", "info")
            try:
                writer.close()
            except Exception:
                pass

    async def dispatch(self, ws: WebSocket, msg: str) -> None:
        try:
            m = json.loads(msg)
        except ValueError:
            return
        if not isinstance(m, list) or not m:
            return
        op, a = m[0], m[1:]
        I = self.input
        try:
            if op == "m":
                I.move(float(a[0]), float(a[1]))
            elif op == "s":
                I.scroll(float(a[0]), float(a[1]))
            elif op == "c":
                I.click(str(a[0]), int(a[1]) if len(a) > 1 else 1)
            elif op == "d":
                I.down(str(a[0]))
            elif op == "u":
                I.up(str(a[0]))
            elif op == "z":
                I.zoom(float(a[0]))
            elif op == "t":
                I.text(str(a[0]))
            elif op == "k":
                I.key(str(a[0]))
            elif op == "x":
                I.combo(str(a[0]))
            elif op == "p":
                await ws.send(json.dumps({"t": "pong", "id": a[0] if a else 0}))
        except (IndexError, TypeError, ValueError):
            pass
        except Exception as exc:  # OS refused the event (e.g. missing permission)
            log(f"Input error: {exc}", "err")

    # -- pairing page shown on the laptop ---------------------------------------
    def pair_page(self) -> str:
        svg = qr_svg(self.pair_url) or ""
        tpl = (STATIC / "pair.html").read_text(encoding="utf-8")
        return (tpl.replace("{{QR}}", svg)
                   .replace("{{URL}}", self.pair_url)
                   .replace("{{HOST}}", socket.gethostname()))


class Discovery(asyncio.DatagramProtocol):
    """Answers LAN broadcast probes from the Glide Android app."""

    def __init__(self, server: GlideServer):
        self.server = server
        self.transport = None

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        if data.strip() == DISCOVER_MSG:
            self.transport.sendto(self.server.beacon(), addr)


def short_device(ua: str) -> str:
    for name in ("iPhone", "iPad", "Android", "Windows", "Macintosh", "Linux"):
        if name in ua:
            return name
    return "browser"


def qr_svg(data: str) -> str | None:
    try:
        import qrcode
    except ImportError:
        return None
    qr = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(data)
    qr.make(fit=True)
    m = qr.get_matrix()
    n = len(m)
    rects = "".join(f'<rect x="{x}" y="{y}" width="1.02" height="1.02"/>'
                    for y, row in enumerate(m) for x, v in enumerate(row) if v)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" '
            f'shape-rendering="crispEdges">{rects}</svg>')


def qr_terminal(data: str) -> str | None:
    try:
        import qrcode
    except ImportError:
        return None
    qr = qrcode.QRCode(border=2)
    qr.add_data(data)
    qr.make(fit=True)
    m = qr.get_matrix()
    if len(m) % 2:
        m.append([False] * len(m[0]))
    out = []
    for y in range(0, len(m), 2):  # two QR rows per text line using half blocks
        line = ""
        for top, bot in zip(m[y], m[y + 1]):
            line += {(True, True): " ", (True, False): "▄",
                     (False, True): "▀", (False, False): "█"}[(top, bot)]
        out.append("    " + line)
    return "\n".join(out)


def banner(server: GlideServer) -> None:
    print()
    print("  " + c("◢◤ Glide", "1;38;5;147") + c(f"  v{VERSION} · phone → trackpad", "2"))
    print()
    q = qr_terminal(server.pair_url)
    if q:
        print(q)
        print()
    print(f"  {c('1', '38;5;147')}  Connect your phone to the same Wi-Fi as this computer")
    print(f"  {c('2', '38;5;147')}  Scan the QR code, or open:")
    print(f"       {c(server.pair_url, '4;38;5;117')}")
    print(f"  {c('3', '38;5;147')}  Tip: “Add to Home Screen” for a full-screen app")
    print()
    if SYSTEM == "Darwin":
        log("macOS: allow your terminal in System Settings › Privacy & Security › Accessibility", "warn")
    if SYSTEM == "Linux" and os.environ.get("XDG_SESSION_TYPE") == "wayland":
        log("Wayland session detected — mouse control needs an X11 session", "warn")
    log(f"Listening on port {server.port}  ·  Ctrl+C to quit")


async def main_async(args) -> None:
    host_ip = args.host or lan_ip()
    token = load_token(args.new_key)
    server = GlideServer(args.port, token, host_ip)
    try:
        srv = await asyncio.start_server(server.handle, "0.0.0.0", args.port)
    except OSError as exc:
        log(f"Port {args.port} is busy ({exc.strerror}). Try:  python glide.py --port 8766", "err")
        return
    try:
        loop = asyncio.get_running_loop()
        await loop.create_datagram_endpoint(lambda: Discovery(server), local_addr=("0.0.0.0", args.port))
    except OSError:
        log("Auto-discovery unavailable (UDP port busy) — pairing by QR still works", "warn")
    banner(server)
    if not args.no_browser:
        try:
            webbrowser.open(f"http://127.0.0.1:{args.port}/pair")
        except Exception:
            pass
    async with srv:
        await srv.serve_forever()


def main() -> None:
    ap = argparse.ArgumentParser(description="Use your phone as a trackpad for this computer.")
    ap.add_argument("--port", type=int, default=8765, help="port to listen on (default 8765)")
    ap.add_argument("--host", help="IP address to advertise in the QR code")
    ap.add_argument("--new-key", action="store_true", help="generate a new pairing key")
    ap.add_argument("--no-browser", action="store_true", help="don't open the pairing page")
    args = ap.parse_args()
    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        print()
        log("Bye 👋")


if __name__ == "__main__":
    main()
