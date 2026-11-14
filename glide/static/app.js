/* Glide — phone trackpad client.
 * Turns touch gestures into compact messages sent over a WebSocket:
 *   ["m",dx,dy] move · ["s",dx,dy] scroll · ["c",btn] click · ["d"/"u",btn] press/release
 *   ["z",n] zoom · ["t",text] type · ["k",key] key · ["x",combo] shortcut · ["p",id] ping
 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* ------------------------------------------------------------------ settings */
  const DEFAULTS = {
    speed: 1.6, accel: 0.9, scroll: 1.2,
    natural: true, inertia: true, tap: true, haptics: true, glow: true, lefty: false, volkeys: false, layout: "horizontal",
  };
  const cfg = Object.assign({}, DEFAULTS, store.get("glide.cfg", {}));
  const saveCfg = () => store.set("glide.cfg", cfg);

  /* ------------------------------------------------------------------ pairing */
  // Browser mode: the page is served by the computer and the key is in the URL.
  // Android app: the page is bundled; paired computers are remembered here and
  // re-found on the network (UDP discovery) if their IP address changes.
  const NATIVE = !!window.GlideNative;
  document.body.classList.toggle("native", NATIVE);

  let pcs = NATIVE ? store.get("glide.pcs", []) : [];   // [{token, host, port, id, name, os}]
  let curToken = NATIVE ? store.get("glide.cur", null) : null;
  let found = [];                                        // last discovery results
  const savePcs = () => { store.set("glide.pcs", pcs); store.set("glide.cur", curToken); };
  const currentPc = () => pcs.find((p) => p.token === curToken) || null;

  let webToken = null;
  if (!NATIVE) {
    const params = new URLSearchParams(location.search);
    webToken = params.get("k");
    if (webToken) store.set("glide.k", webToken);
    else webToken = store.get("glide.k", null);
  }

  // USB cable (Android app): the computer forwards its port to this phone's localhost via
  // `adb reverse`. When the current computer is reachable that way, the cable always wins.
  let usbToken = null, usbPort = 8765, transport = "wifi";
  const IS_LOCAL_PAGE = !NATIVE && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  function target() {
    if (!NATIVE) {
      return webToken ? { url: `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`, token: webToken, usb: IS_LOCAL_PAGE } : null;
    }
    const pc = currentPc();
    if (!pc) return null;
    if (usbToken === pc.token) return { url: `ws://127.0.0.1:${usbPort}/ws`, token: pc.token, usb: true };
    return pc.host ? { url: `ws://${pc.host}:${pc.port}/ws`, token: pc.token, usb: false } : { wait: true };
  }

  /* ------------------------------------------------------------------ connection */
  const statusEl = $("status"), statusText = $("statusText");
  let ws = null, online = false, retry = 0, hostName = "", hostOS = "";
  let pingTimer = 0, pingSent = 0, rtt = 0, failures = 0, reTimer = 0;

  function setStatus(state, text) {
    statusEl.dataset.state = state;
    statusText.innerHTML = text;
    document.body.classList.toggle("online", state === "online");
  }

  function connect() {
    clearTimeout(reTimer);
    const t = target();
    if (!t) { showPairing(); setStatus("offline", "Not paired"); return; }
    if (t.wait) {   // paired over USB only, cable unplugged: wait for cable or discovery
      failures = Math.max(failures, 2); scheduleReconnect(); return;
    }
    setStatus("connecting", retry ? "Reconnecting…" : "Connecting…");
    let sock;
    try { sock = new WebSocket(`${t.url}?k=${encodeURIComponent(t.token)}`); }
    catch { scheduleReconnect(); return; }
    ws = sock;

    sock.onopen = () => {
      if (sock !== ws) return;
      online = true; retry = 0; failures = 0;
      transport = t.usb ? "usb" : "wifi";
      setStatus("online", "Connected");
      ping(); clearInterval(pingTimer); pingTimer = setInterval(ping, 2000);
      if (NATIVE) hidePairing();
    };
    sock.onmessage = (e) => {
      if (sock !== ws) return;
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === "hello") {
        hostName = m.host || "Computer"; hostOS = m.os || "";
        $("about").textContent = `Connected to ${hostName} · ${hostOS} · Glide ${m.v}`;
        const pc = currentPc();
        if (pc) { pc.id = m.id || pc.id; pc.name = hostName; pc.os = hostOS; savePcs(); }
        renderStatus();
      } else if (m.t === "pong") {
        rtt = Math.round(performance.now() - pingSent);
        renderStatus();
      }
    };
    sock.onclose = () => {
      if (sock !== ws) return;
      if (t.usb && NATIVE) { usbToken = null; transport = "wifi"; retry = 0; }   // cable pulled: fall back to Wi-Fi now
      const wasOnline = online;
      online = false; clearInterval(pingTimer);
      if (!wasOnline) failures++;
      scheduleReconnect();
    };
    sock.onerror = () => { try { sock.close(); } catch {} };
  }

  function reconnectNow() {
    const old = ws; ws = null;
    if (old) { try { old.close(); } catch {} }
    online = false; clearInterval(pingTimer);
    retry = 0; failures = 0; rtt = 0; hostName = "";
    connect();
  }

  function scheduleReconnect() {
    // The computer may have a new IP: look for it on the network.
    if (NATIVE && failures >= 2 && failures % 2 === 0) discover();
    const wait = Math.min(4000, 400 * 2 ** retry++);
    setStatus(failures >= 4 ? "offline" : "connecting", failures >= 4 ? "Can't reach computer" : "Reconnecting…");
    reTimer = setTimeout(connect, wait);
  }

  /* ------------------------------------------------------------------ discovery (app) */
  let discovering = false;
  function discover() {
    if (!NATIVE || discovering) return;
    discovering = true; $("btnRescan").classList.add("spin");
    try { window.GlideNative.discover(); } catch { discovering = false; }
  }
  window.glideDiscovered = (list) => {
    discovering = false; $("btnRescan").classList.remove("spin");
    found = Array.isArray(list) ? list.filter((d) => d && d.id && d.host) : [];
    let moved = false;
    for (const d of found) {
      const pc = pcs.find((p) => p.id === d.id);
      if (pc && (pc.host !== d.host || pc.port !== d.port)) { pc.host = d.host; pc.port = d.port; moved = pc.token === curToken; }
      if (pc) pc.name = d.name || pc.name;
    }
    savePcs(); renderPcs();
    if (moved && !online) { toast("Found your computer at its new address"); reconnectNow(); }
  };

  /* ------------------------------------------------------------------ USB cable (app) */
  let usbProbing = false;
  function usbCheck() {
    if (!NATIVE || usbProbing || transport === "usb" || document.hidden) return;
    usbProbing = true;
    try { window.GlideNative.usbProbe(8765); } catch { usbProbing = false; }
  }
  window.glideUsb = (info) => {
    usbProbing = false;
    if (!info || !info.k) { if (transport !== "usb") usbToken = null; return; }
    // A computer is on the cable. Pair with it automatically (the cable is the proof)
    // and switch to it - plugging in is a clear signal of intent.
    let pc = pcs.find((p) => p.token === info.k) || pcs.find((p) => info.id && p.id === info.id);
    if (pc) { pc.token = info.k; pc.id = info.id; pc.name = info.name || pc.name; }
    else { pc = { token: info.k, host: null, port: info.port || 8765, id: info.id, name: info.name, os: info.os }; pcs.push(pc); }
    usbToken = info.k; usbPort = info.port || 8765;
    const switching = transport !== "usb" || curToken !== info.k;
    curToken = info.k; savePcs(); renderPcs();
    if (switching) { toast("USB cable connected"); buzz(14); reconnectNow(); }
  };
  if (NATIVE) setInterval(usbCheck, 2500);

  /* ------------------------------------------------------------------ pairing screen */
  const pairing = $("pairing"), pcList = $("pcList");
  const PC_ICON = '<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/></svg>';

  function showPairing() {
    pairing.hidden = false;
    $("btnPairClose").hidden = !(online && currentPc());
    renderPcs(); discover();
  }
  function hidePairing() { pairing.hidden = true; }

  function renderPcs() {
    if (!NATIVE) return;
    const rows = [];
    const seen = new Set();
    for (const d of found) {
      const pc = pcs.find((p) => p.id === d.id);
      seen.add(d.id);
      rows.push({ name: d.name, sub: `${d.os || "Computer"} · ${d.host}`, pc, disc: d });
    }
    for (const pc of pcs) {
      if (pc.token === usbToken) rows.unshift({ name: pc.name || "Computer", sub: "Connected by USB cable", pc, usb: true });
      else if (!pc.id || !seen.has(pc.id)) rows.push({ name: pc.name || pc.host, sub: pc.host ? `Saved · ${pc.host}` : "Saved · USB", pc, away: true });
    }
    pcList.innerHTML = "";
    if (!rows.length) {
      pcList.innerHTML = `<li class="empty">${discovering ? "Looking for computers…" : "No computers found. Make sure Glide is running."}</li>`;
      return;
    }
    for (const r of rows) {
      const li = document.createElement("li");
      if (r.pc && r.pc.token === curToken) li.className = "current";
      if (r.pc && r.pc.token === usbToken && !r.usb) continue;
      const tag = r.usb ? '<span class="tag usb">USB</span>' : r.pc ? (r.away ? '<span class="tag away">Saved</span>' : '<span class="tag paired">Paired</span>') : '<span class="tag new">New</span>';
      li.innerHTML = `<span class="pc-ic">${PC_ICON}</span><span class="pc-txt"><div class="pc-name">${escapeHtml(r.name || "Computer")}</div><div class="pc-sub">${escapeHtml(r.sub)}</div></span>${tag}${r.pc ? '<button class="forget" aria-label="Forget">×</button>' : ""}`;
      li.addEventListener("click", (e) => {
        if (e.target.closest(".forget")) {
          pcs = pcs.filter((p) => p !== r.pc);
          if (curToken === r.pc.token) { curToken = null; reconnectNow(); }
          savePcs(); renderPcs(); return;
        }
        buzz(6);
        if (r.pc) { curToken = r.pc.token; savePcs(); renderPcs(); reconnectNow(); }
        else { toast(`Scan the QR code shown on ${r.name || "your computer"} to pair`); openScanner(); }
      });
      pcList.appendChild(li);
    }
  }

  function pairFromLink(text) {
    let u;
    try { u = new URL(String(text).trim()); } catch { u = null; }
    const k = u && u.searchParams.get("k");
    if (!u || !k || !/^https?:$/.test(u.protocol)) { toast("That isn't a Glide pairing code"); buzz([10, 60, 10]); return false; }
    const port = +u.port || 80;
    let pc = pcs.find((p) => p.token === k);
    if (pc) { pc.host = u.hostname; pc.port = port; }
    else { pc = { token: k, host: u.hostname, port, id: null, name: u.hostname }; pcs.push(pc); }
    curToken = k; savePcs(); buzz(16);
    toast("Paired — connecting…");
    reconnectNow();
    return true;
  }

  if (NATIVE) {
    statusEl.addEventListener("click", showPairing);
    $("btnComputers").addEventListener("click", () => { closeSheets(); showPairing(); });
    $("btnRescan").addEventListener("click", () => { buzz(5); discover(); renderPcs(); });
    $("btnPairClose").addEventListener("click", hidePairing);
    $("btnScan").addEventListener("click", openScanner);
    $("linkForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (pairFromLink($("linkInput").value)) { $("linkInput").value = ""; $("linkInput").blur(); }
    });
  }

  /* ------------------------------------------------------------------ QR scanner (app) */
  const scanner = $("scanner"), video = $("scanVideo");
  const scanCanvas = document.createElement("canvas");
  const scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true });
  let stream = null, scanRaf = 0;

  function loadJsQR() {
    if (window.jsQR) return Promise.resolve();
    return new Promise((ok, fail) => {
      const sc = document.createElement("script"); sc.src = "jsQR.js"; sc.onload = ok; sc.onerror = fail;
      document.head.appendChild(sc);
    });
  }

  async function openScanner() {
    scanner.hidden = false;
    try {
      await loadJsQR();
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
    } catch {
      closeScanner(); toast("Camera unavailable — paste the pairing link instead"); return;
    }
    if (scanner.hidden) { closeScanner(); return; }
    video.srcObject = stream;
    try { await video.play(); } catch {}
    scanLoop();
  }

  function scanLoop() {
    if (!stream) return;
    if (video.readyState >= 2 && video.videoWidth) {
      const w = 560, h = Math.round((video.videoHeight * w) / video.videoWidth);
      if (scanCanvas.width !== w) { scanCanvas.width = w; scanCanvas.height = h; }
      scanCtx.drawImage(video, 0, 0, w, h);
      const img = scanCtx.getImageData(0, 0, w, h);
      const code = window.jsQR(img.data, w, h, { inversionAttempts: "attemptBoth" });
      if (code && code.data) { closeScanner(); pairFromLink(code.data); return; }
    }
    scanRaf = requestAnimationFrame(scanLoop);
  }

  function closeScanner() {
    cancelAnimationFrame(scanRaf);
    if (stream) { for (const tr of stream.getTracks()) tr.stop(); stream = null; }
    video.srcObject = null;
    scanner.hidden = true;
  }
  $("btnScanClose").addEventListener("click", closeScanner);

  /* ------------------------------------------------------------------ toast */
  let toastTimer = 0;
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function ping() { if (online) { pingSent = performance.now(); send(["p", 1]); } }

  function renderStatus() {
    if (!online) return;
    const name = hostName ? escapeHtml(hostName) : "Connected";
    const via = transport === "usb" ? '<span class="via usb">USB</span>' : (NATIVE ? '<span class="via">Wi-Fi</span>' : "");
    setStatus("online", `${via}${name}${rtt ? ` <span class="ms">· ${rtt} ms</span>` : ""}`);
  }

  function escapeHtml(s) { return s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`); }

  function send(msg) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
  }

  // Motion is coalesced: if the socket is backed up, deltas merge instead of queueing.
  let pmx = 0, pmy = 0, psx = 0, psy = 0, flushQueued = false;
  function queueMove(dx, dy) { pmx += dx; pmy += dy; flush(); }
  function queueScroll(dx, dy) { psx += dx; psy += dy; flush(); }
  function flush() {
    if (!ws || ws.readyState !== 1) { pmx = pmy = psx = psy = 0; return; }
    if (ws.bufferedAmount > 2048) {
      if (!flushQueued) { flushQueued = true; requestAnimationFrame(() => { flushQueued = false; flush(); }); }
      return;
    }
    if (pmx || pmy) { send(["m", +pmx.toFixed(2), +pmy.toFixed(2)]); pmx = pmy = 0; }
    if (psx || psy) { send(["s", +psx.toFixed(2), +psy.toFixed(2)]); psx = psy = 0; }
  }

  function buzz(ms) {
    if (!cfg.haptics) return;
    if (NATIVE) {
      const pattern = Array.isArray(ms) ? ms : [ms];
      let at = 0;
      pattern.forEach((d, i) => { if (i % 2 === 0) setTimeout(() => window.GlideNative.haptic(d), at); at += d; });
    } else if (navigator.vibrate) navigator.vibrate(ms);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && target() && (!ws || ws.readyState > 1)) { retry = 0; connect(); }
  });

  /* ------------------------------------------------------------------ pointer curve */
  // Speed-dependent gain: slow movements stay precise, fast flicks cross the screen.
  function gain(px, dt) {
    const v = px / Math.max(dt, 4);                        // px per ms
    const boost = Math.min(Math.max(v - 0.12, 0) * 1.5, 3.2);
    return cfg.speed * (1 + cfg.accel * boost);
  }

  /* ------------------------------------------------------------------ touch glow */
  const pad = $("pad"), canvas = $("fx"), ctx = canvas.getContext("2d");
  const hint = $("hint");
  let dpr = 1, cw = 0, ch = 0;
  const trails = new Map();    // pointerId -> [{x,y,t}]
  const ripples = [];          // {x,y,t,color}
  let fxRunning = false;

  function resize() {
    const r = pad.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(pad);

  function startFx() { if (!fxRunning && cfg.glow) { fxRunning = true; requestAnimationFrame(drawFx); } }

  function drawFx(now) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = "lighter";
    let alive = false;

    for (const [id, pts] of trails) {
      while (pts.length && now - pts[0].t > 260) pts.shift();
      const live = pointers.has(id);
      if (!pts.length) { if (!live) trails.delete(id); continue; }
      alive = true;
      // fading trail
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], k = 1 - (now - b.t) / 260;
        ctx.strokeStyle = `rgba(150,170,255,${0.5 * k})`;
        ctx.lineWidth = 2 + 10 * k; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      if (live) {
        const p = pts[pts.length - 1];
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 70);
        g.addColorStop(0, dragging ? "rgba(95,224,242,0.55)" : "rgba(184,166,255,0.5)");
        g.addColorStop(0.35, dragging ? "rgba(95,224,242,0.14)" : "rgba(120,150,255,0.14)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 70, 0, 7); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, 7); ctx.fill();
      }
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i], k = (now - r.t) / 480;
      if (k >= 1) { ripples.splice(i, 1); continue; }
      alive = true;
      const e = 1 - (1 - k) ** 3;
      ctx.strokeStyle = `rgba(${r.color},${0.75 * (1 - k)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(r.x, r.y, 12 + 46 * e, 0, 7); ctx.stroke();
    }

    if (alive || pointers.size) requestAnimationFrame(drawFx);
    else { fxRunning = false; ctx.clearRect(0, 0, cw, ch); }
  }

  function ripple(x, y, color = "184,166,255") {
    if (!cfg.glow) return;
    ripples.push({ x, y, t: performance.now(), color }); startFx();
  }

  /* ------------------------------------------------------------------ gesture engine */
  const pointers = new Map();  // id -> {x, y, t}
  let g = null;                // current gesture state
  let dragging = false, holdTimer = 0, inertiaRaf = 0;

  const TAP_MS = 240, TAP_SLOP = 9, HOLD_MS = 420;

  function local(e) {
    const r = pad.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function centroid() {
    let x = 0, y = 0;
    for (const p of pointers.values()) { x += p.x; y += p.y; }
    const n = pointers.size || 1;
    return { x: x / n, y: y / n };
  }

  function spread() {
    const ps = [...pointers.values()];
    if (ps.length < 2) return 0;
    return Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
  }

  function resetMulti(keepSamples = false) {
    const c = centroid();
    g.cx = c.x; g.cy = c.y; g.spread0 = g.spread = spread();
    if (!keepSamples) { g.travel = 0; g.samples = []; }
  }

  pad.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    try { pad.setPointerCapture(e.pointerId); } catch {}
    const p = local(e);
    pointers.set(e.pointerId, { x: p.x, y: p.y, t: e.timeStamp });
    trails.set(e.pointerId, [{ x: p.x, y: p.y, t: performance.now() }]);
    stopInertia();
    pad.classList.add("active");
    hint.classList.add("gone");
    startFx();

    if (pointers.size === 1) {
      g = { t0: e.timeStamp, max: 1, moved: 0, mode: "move", zoomAcc: 0, swiped: false };
      resetMulti();
      clearTimeout(holdTimer);
      if (!dragging) holdTimer = setTimeout(startDrag, HOLD_MS);
    } else if (g) {
      clearTimeout(holdTimer);
      g.max = Math.max(g.max, pointers.size);
      if (!dragging) g.mode = pointers.size === 2 ? "two" : "three";
      resetMulti();
    }
  });

  pad.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev || !g) return;
    const p = local(e);
    const dx = p.x - prev.x, dy = p.y - prev.y, dt = e.timeStamp - prev.t;
    prev.x = p.x; prev.y = p.y; prev.t = e.timeStamp;
    const tr = trails.get(e.pointerId); if (tr) tr.push({ x: p.x, y: p.y, t: performance.now() });
    g.moved += Math.hypot(dx, dy);
    if (g.moved > TAP_SLOP) clearTimeout(holdTimer);

    if (g.mode === "move" || dragging) {
      if (pointers.size === 1 || dragging) {
        const k = gain(Math.hypot(dx, dy), dt);
        queueMove(dx * k, dy * k);
      }
      return;
    }

    const c = centroid();
    const cdx = c.x - g.cx, cdy = c.y - g.cy;
    g.cx = c.x; g.cy = c.y;

    if (g.mode === "two" && pointers.size === 2) {
      const s = spread();
      const ds = s - g.spread; g.spread = s;
      g.travel += Math.hypot(cdx, cdy);
      // Decide pinch vs scroll once: pinch when fingers spread faster than they travel.
      if (!g.kind && (Math.abs(s - g.spread0) > 28 || g.travel > 14)) {
        g.kind = Math.abs(s - g.spread0) > g.travel * 1.4 ? "pinch" : "scroll";
      }
      if (g.kind === "scroll") {
        const dir = cfg.natural ? -1 : 1;
        const sx = cdx * dir * cfg.scroll * 1.6, sy = cdy * dir * cfg.scroll * 1.6;
        queueScroll(sx, sy);
        g.samples.push({ sx, sy, t: e.timeStamp });
        if (g.samples.length > 8) g.samples.shift();
      } else if (g.kind === "pinch") {
        g.zoomAcc += ds / 38;
        const n = g.zoomAcc | 0;
        if (n) { send(["z", n]); g.zoomAcc -= n; buzz(4); }
      }
    } else if (g.mode === "three" && pointers.size >= 3 && !g.swiped) {
      g.sx = (g.sx || 0) + cdx; g.sy = (g.sy || 0) + cdy;
      if (Math.abs(g.sx) > 70 && Math.abs(g.sx) > Math.abs(g.sy) * 1.5) {
        send(["x", g.sx < 0 ? "back" : "forward"]); g.swiped = true; buzz(14);
      } else if (Math.abs(g.sy) > 70 && Math.abs(g.sy) > Math.abs(g.sx) * 1.5) {
        send(["x", g.sy < 0 ? "overview" : "desktop"]); g.swiped = true; buzz(14);
      }
    }
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (!g) return;

    if (pointers.size > 0) {
      // A finger lifted mid-gesture: re-anchor so the centroid doesn't jump.
      if (g.mode === "move" && !dragging) return;
      resetMulti(true);
      return;
    }

    clearTimeout(holdTimer);
    pad.classList.remove("active");
    const dur = e.timeStamp - g.t0;
    const isTap = g.moved < TAP_SLOP * g.max && dur < (g.max === 1 ? TAP_MS : TAP_MS + 60);

    if (dragging) {
      endDrag();
    } else if (isTap && e.type !== "pointercancel") {
      if (g.max === 1 && cfg.tap) { send(["c", "l"]); buzz(6); ripple(p.x, p.y); }
      else if (g.max === 2) { send(["c", "r"]); buzz([6, 40, 6]); ripple(p.x, p.y, "95,224,242"); }
      else if (g.max >= 3) { send(["c", "m"]); buzz(10); ripple(p.x, p.y, "255,196,107"); }
    } else if (g.mode === "two" && g.kind === "scroll" && cfg.inertia) {
      startInertia(g.samples, e.timeStamp);
    }
    g = null;
  }
  pad.addEventListener("pointerup", endPointer);
  pad.addEventListener("pointercancel", endPointer);
  pad.addEventListener("lostpointercapture", endPointer);

  function startDrag() {
    if (!g || pointers.size !== 1 || g.moved > TAP_SLOP) return;
    dragging = true;
    send(["d", "l"]);
    buzz(22);
    pad.classList.add("dragging");
    const p = [...pointers.values()][0];
    ripple(p.x, p.y, "95,224,242");
  }
  function endDrag() {
    dragging = false;
    send(["u", "l"]);
    buzz(8);
    pad.classList.remove("dragging");
  }

  /* ------------------------------------------------------------------ scroll momentum */
  function velocityFrom(samples, now) {
    const recent = samples.filter((s) => now - s.t < 90);
    if (recent.length < 2) return { vx: 0, vy: 0 };
    const span = Math.max(recent[recent.length - 1].t - recent[0].t, 16);
    let sx = 0, sy = 0;
    for (const s of recent.slice(1)) { sx += s.sx; sy += s.sy; }
    return { vx: sx / span, vy: sy / span };
  }

  function startInertia(samples, now) {
    let { vx, vy } = velocityFrom(samples, now);
    if (Math.hypot(vx, vy) < 0.25) return;
    let last = performance.now();
    const step = (t) => {
      const dt = Math.min(t - last, 40); last = t;
      const decay = Math.pow(0.9955, dt);      // ~ iOS-like deceleration
      vx *= decay; vy *= decay;
      if (Math.hypot(vx, vy) < 0.03) { inertiaRaf = 0; return; }
      queueScroll(vx * dt, vy * dt);
      inertiaRaf = requestAnimationFrame(step);
    };
    inertiaRaf = requestAnimationFrame(step);
  }
  function stopInertia() { if (inertiaRaf) { cancelAnimationFrame(inertiaRaf); inertiaRaf = 0; } }

  /* ------------------------------------------------------------------ scroll strip */
  const strip = $("strip"), track = strip.querySelector(".strip-track");
  let stripY = null, stripOffset = 0, stripSamples = [];
  strip.addEventListener("pointerdown", (e) => {
    e.preventDefault(); stopInertia();
    try { strip.setPointerCapture(e.pointerId); } catch {}
    stripY = e.clientY; stripSamples = []; strip.classList.add("active"); buzz(4);
  });
  strip.addEventListener("pointermove", (e) => {
    if (stripY === null) return;
    const dy = e.clientY - stripY; stripY = e.clientY;
    const dir = cfg.natural ? -1 : 1;
    const sy = dy * dir * cfg.scroll * 2.2;
    queueScroll(0, sy);
    stripSamples.push({ sx: 0, sy, t: e.timeStamp }); if (stripSamples.length > 8) stripSamples.shift();
    stripOffset = (stripOffset + dy) % 40;
    track.style.transform = `translateY(${stripOffset}px)`;
  });
  const stripEnd = (e) => {
    if (stripY === null) return;
    stripY = null; strip.classList.remove("active");
    if (cfg.inertia) startInertia(stripSamples, e.timeStamp);
  };
  strip.addEventListener("pointerup", stripEnd);
  strip.addEventListener("pointercancel", stripEnd);

  /* ------------------------------------------------------------------ physical buttons */
  for (const btn of document.querySelectorAll(".mbtn")) {
    const name = btn.dataset.btn;
    let id = null;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (id !== null) return;
      id = e.pointerId;
      try { btn.setPointerCapture(id); } catch {}
      btn.classList.add("down");
      send(["d", name]); buzz(8);
    });
    const release = (e) => {
      if (e.pointerId !== id) return;
      id = null; btn.classList.remove("down");
      send(["u", name]);
    };
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
  }

  /* ------------------------------------------------------------------ sheets */
  const scrim = $("scrim");
  let openSheet = null;
  function toggleSheet(sheet, btn) {
    const opening = openSheet !== sheet;
    closeSheets();
    if (!opening) return;
    openSheet = sheet;
    sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false");
    btn.classList.add("on"); scrim.classList.add("show");
    if (sheet.id === "sheetKeyboard") setTimeout(() => typer.focus(), 60);
  }
  function closeSheets() {
    for (const s of document.querySelectorAll(".sheet")) { s.classList.remove("open"); s.setAttribute("aria-hidden", "true"); }
    for (const b of document.querySelectorAll(".icon-btn")) b.classList.remove("on");
    scrim.classList.remove("show"); openSheet = null;
    typer.blur();
  }
  $("btnKeyboard").addEventListener("click", () => toggleSheet($("sheetKeyboard"), $("btnKeyboard")));
  $("btnSettings").addEventListener("click", () => toggleSheet($("sheetSettings"), $("btnSettings")));
  scrim.addEventListener("click", closeSheets);

  // Swipe a sheet down by its grab handle to close.
  for (const sheet of document.querySelectorAll(".sheet")) {
    let y0 = null;
    const grab = sheet.querySelector(".grab");
    sheet.addEventListener("touchstart", (e) => { if (e.target === grab || sheet.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener("touchend", (e) => {
      if (y0 !== null && e.changedTouches[0].clientY - y0 > 70 && document.activeElement?.type !== "range") closeSheets();
      y0 = null;
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ keyboard */
  // The input holds a zero-width sentinel so Backspace on an "empty" field still fires.
  const typer = $("typer");
  const SENT = "​";
  let typed = "";
  typer.value = SENT;

  function syncTyped() {
    let v = typer.value;
    if (!v.startsWith(SENT)) {           // sentinel deleted => user pressed backspace on empty
      send(["k", "backspace"]);
      v = SENT + v.replace(/​/g, "");
      typer.value = v;
    }
    const now = v.slice(1);
    let i = 0;
    while (i < now.length && i < typed.length && now[i] === typed[i]) i++;
    for (let n = typed.length - i; n > 0; n--) send(["k", "backspace"]);
    const added = now.slice(i);
    if (added) send(["t", added]);
    typed = now;
  }
  typer.addEventListener("input", (e) => { if (!e.isComposing) syncTyped(); });
  typer.addEventListener("compositionend", syncTyped);
  typer.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); send(["k", "enter"]);
      typer.value = SENT; typed = ""; buzz(6);
    }
  });

  for (const b of document.querySelectorAll("[data-key],[data-combo]")) {
    b.addEventListener("pointerdown", (e) => e.preventDefault());   // keep the soft keyboard open
    b.addEventListener("click", () => {
      if (b.dataset.key) {
        send(["k", b.dataset.key]);
        if (b.dataset.key === "enter" || b.dataset.key === "backspace") { typer.value = SENT; typed = ""; }
      } else send(["x", b.dataset.combo]);
      buzz(5);
    });
  }

  /* ------------------------------------------------------------------ settings UI */
  const sliders = [["sSpeed", "oSpeed", "speed", (v) => `${v.toFixed(1)}×`],
                   ["sAccel", "oAccel", "accel", (v) => (v ? `${Math.round(v * 50)}%` : "Off")],
                   ["sScroll", "oScroll", "scroll", (v) => `${v.toFixed(1)}×`]];
  const toggles = [["tNatural", "natural"], ["tInertia", "inertia"], ["tTap", "tap"],
                   ["tHaptics", "haptics"], ["tGlow", "glow"], ["tLefty", "lefty"], ["tVolume", "volkeys"]];

  function paintSlider(el) {
    const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty("--fill", `${pct}%`);
  }
  function loadUI() {
    for (const [sid, oid, key, fmt] of sliders) {
      const el = $(sid); el.value = cfg[key]; $(oid).textContent = fmt(+cfg[key]); paintSlider(el);
    }
    for (const [tid, key] of toggles) $(tid).checked = !!cfg[key];
    document.body.classList.toggle("lefty", cfg.lefty);
    applyOrientation();
  }
  for (const [sid, oid, key, fmt] of sliders) {
    $(sid).addEventListener("input", (e) => {
      cfg[key] = +e.target.value; $(oid).textContent = fmt(cfg[key]); paintSlider(e.target); saveCfg();
    });
  }
  for (const [tid, key] of toggles) {
    $(tid).addEventListener("change", (e) => {
      cfg[key] = e.target.checked; saveCfg();
      if (key === "lefty") document.body.classList.toggle("lefty", cfg.lefty);
      if (key === "volkeys" && NATIVE) window.GlideNative.setVolumeKeys(cfg.volkeys);
      buzz(5);
    });
  }
  $("btnReset").addEventListener("click", () => { Object.assign(cfg, DEFAULTS); saveCfg(); loadUI(); buzz(10); });

  /* ------------------------------------------------------------------ layout: horizontal / vertical / auto */
  // The app turns the screen itself; in a browser we ask the person to turn the phone
  // (and lock the orientation when full screen allows it).
  const LAYOUTS = ["horizontal", "vertical", "auto"];
  if ("horizontal" in cfg) {           // carry over the older on/off setting
    if (cfg.horizontal === false) cfg.layout = "vertical";
    delete cfg.horizontal; saveCfg();
  }
  if (!LAYOUTS.includes(cfg.layout)) cfg.layout = "horizontal";

  function applyOrientation() {
    const L = cfg.layout;
    document.body.classList.toggle("want-landscape", L === "horizontal");
    document.body.classList.toggle("want-portrait", L === "vertical");
    for (const b of document.querySelectorAll(".seg [data-layout]")) b.setAttribute("aria-checked", String(b.dataset.layout === L));
    const sideways = L === "horizontal";
    $("rotateTitle").textContent = sideways ? "Turn your phone sideways" : "Turn your phone upright";
    $("rotateText").textContent = sideways
      ? "You picked the horizontal layout, which works like a laptop trackpad."
      : "You picked the vertical layout, for holding the phone upright.";
    $("btnRotateSwitch").textContent = sideways ? "Use the vertical layout instead" : "Use the horizontal layout instead";
    if (NATIVE) {
      try {
        if (typeof window.GlideNative.setOrientation === "function") window.GlideNative.setOrientation(L);
        else if (typeof window.GlideNative.setLandscape === "function") window.GlideNative.setLandscape(L === "horizontal");
      } catch {}
    } else if (document.fullscreenElement && screen.orientation && screen.orientation.lock) {
      if (L === "auto") { try { screen.orientation.unlock(); } catch {} }
      else screen.orientation.lock(L === "horizontal" ? "landscape" : "portrait").catch(() => {});
    }
  }

  function setLayout(L, announce) {
    if (!LAYOUTS.includes(L) || L === cfg.layout) return;
    cfg.layout = L; saveCfg(); applyOrientation(); buzz(8);
    if (announce) toast(L === "horizontal" ? "Horizontal layout" : L === "vertical" ? "Vertical layout" : "Auto layout: follows your phone");
  }

  for (const b of document.querySelectorAll(".seg [data-layout]")) {
    b.addEventListener("click", () => setLayout(b.dataset.layout, false));
  }
  // Top-bar button: flip between horizontal and vertical (from Auto, flip away from how it's held now).
  $("btnRotate").addEventListener("click", () => {
    const now = cfg.layout === "auto" ? (matchMedia("(orientation: landscape)").matches ? "horizontal" : "vertical") : cfg.layout;
    setLayout(now === "horizontal" ? "vertical" : "horizontal", true);
  });
  $("btnRotateSwitch").addEventListener("click", () => setLayout(cfg.layout === "horizontal" ? "vertical" : "horizontal", true));

  const fsBtn = $("btnFullscreen");
  const root = document.documentElement;
  if (NATIVE || (!root.requestFullscreen && !root.webkitRequestFullscreen)) fsBtn.hidden = true;
  fsBtn.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else {
      const req = (root.requestFullscreen || root.webkitRequestFullscreen).call(root, { navigationUI: "hide" });
      if (cfg.layout !== "auto" && req && req.then) {
        req.then(() => screen.orientation && screen.orientation.lock &&
          screen.orientation.lock(cfg.layout === "horizontal" ? "landscape" : "portrait")).catch(() => {});
      }
    }
    closeSheets();
  });

  /* ------------------------------------------------------------------ misc */
  // Block browser gestures (pinch-zoom, long-press menus, rubber banding).
  for (const ev of ["gesturestart", "gesturechange", "contextmenu", "dblclick"]) {
    document.addEventListener(ev, (e) => e.preventDefault());
  }
  document.addEventListener("touchmove", (e) => {
    if (!e.target.closest(".sheet")) e.preventDefault();
  }, { passive: false });

  // Keep the screen awake where the browser allows it (secure contexts only).
  async function wake() { try { if (navigator.wakeLock) await navigator.wakeLock.request("screen"); } catch {} }
  document.addEventListener("pointerdown", wake, { once: true });

  // Safety: if the page is hidden mid-drag, release everything.
  window.addEventListener("pagehide", () => { if (dragging) endDrag(); });

  /* ------------------------------------------------------------------ Android hooks */
  // Hardware volume keys as mouse buttons (when enabled in settings).
  window.glideHardware = (btn, down) => { send([down ? "d" : "u", btn]); if (down) buzz(8); };
  // System back button: close the top-most layer; return true if handled.
  window.glideBack = () => {
    if (!scanner.hidden) { closeScanner(); return true; }
    if (openSheet) { closeSheets(); return true; }
    if (!pairing.hidden && currentPc() && online) { hidePairing(); return true; }
    return false;
  };
  window.glideResume = () => { usbCheck(); if (target() && (!ws || ws.readyState > 1)) { retry = 0; connect(); } };

  loadUI();
  if (NATIVE) { try { window.GlideNative.setVolumeKeys(!!cfg.volkeys); } catch {} }
  if (IS_LOCAL_PAGE && !webToken) {
    // Opened as http://localhost:8765 over a USB cable (adb reverse): fetch the key same-origin.
    fetch("/usb-key", { cache: "no-store" }).then((r) => r.json())
      .then((j) => { webToken = j.k; store.set("glide.k", webToken); })
      .catch(() => {}).finally(connect);
  } else connect();
  usbCheck();
})();
