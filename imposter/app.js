/* Who's the Imposter? — Telugu Family Edition. A pass-and-play party game. */
(function () {
  "use strict";

  var PACKS = window.PACKS;
  var CUSTOM_ID = "custom";
  var STORE = "whosTheImposter.v2";
  var COLORS = ["#F8C95C", "#FF9F7A", "#86E8A8", "#8FC6FF", "#F6A6D0", "#C7AEFF", "#FFE08A", "#9FE6AA", "#FF8FA3", "#7FE3D8", "#FFC07A", "#B5C4FF"];

  /* ---------- icons ---------- */
  var IC = {
    film: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7.5 4v16M16.5 4v16M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21"/>',
    mask: '<path d="M3.5 6.5c2.8 1.2 5.7 1.2 8.5 0 2.8 1.2 5.7 1.2 8.5 0V11c0 5-4 8.5-8.5 8.5S3.5 16 3.5 11z"/><path d="M7.5 11h2.5M14 11h2.5M9.5 15c1.6 1 3.4 1 5 0"/>',
    star: '<path d="M12 3.2l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9z"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.8 2.4 2.8 4 2.8s3-1 4-2.8M9 9.5h.01M15 9.5h.01"/>',
    clapper: '<path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 10l-.6-3.5L18.8 4l.6 3.5z"/><path d="M8.2 5.4l2 3.4M13.2 4.6l2 3.4"/>',
    music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7.5c0-1.5 1-1.5 1-3M12 7.5c0-1.5 1-1.5 1-3M16 7.5c0-1.5 1-1.5 1-3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.2 14.6c2.7.2 4.8 2 5.3 5"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5.5h4V20"/>',
    lamp: '<path d="M3 13.5c0 3.3 4 5.5 9 5.5s9-2.2 9-5.5z"/><path d="M12 3.5c2 2.2 2 4.6 0 6.3-2-1.7-2-4.1 0-6.3z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    ring: '<circle cx="12" cy="14.5" r="6.5"/><path d="M9 3.5h6l-1.6 3.5h-2.8z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 8.5h.01M15.5 15.5h.01M15.5 8.5h.01M8.5 15.5h.01M12 12h.01" stroke-width="3"/>',
    tv: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 3l4 4 4-4"/>',
    cap: '<path d="M2 9.5l10-5 10 5-10 5z"/><path d="M6 11.5v4.8c3.3 2.4 8.7 2.4 12 0v-4.8M22 9.5v5"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8 21h8"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    play: '<path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.5-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8z" fill="currentColor"/>',
    sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    vote: '<path d="M4 13h16v7H4z"/><path d="M8 13V4.5h8V13M10.3 8.8l1.5 1.5 3-3"/>',
    spy: '<path d="M2.5 11.5h19M5.5 11.5l1.8-5.6a1 1 0 0 1 1.3-.6L12 6.5l3.4-1.2a1 1 0 0 1 1.3.6l1.8 5.6"/><circle cx="7.5" cy="16.5" r="3"/><circle cx="16.5" cy="16.5" r="3"/><path d="M10.5 16.2c1-.6 2-.6 3 0"/>',
    rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8.5"/><path d="M20 3.5v5h-5"/>',
    rotateccw: '<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5"/><path d="M4 3.5v5h5"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/>',
    x: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'
  };
  function icon(n, cls) { return '<svg class="i ' + (cls || "") + '" viewBox="0 0 24 24">' + (IC[n] || "") + "</svg>"; }
  var LOGO = '<svg class="mark" viewBox="0 0 512 512"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8C95C"/><stop offset="1" stop-color="#EF7D3C"/></linearGradient></defs>' +
    '<rect width="512" height="512" rx="128" fill="url(#lg)"/><g fill="none" stroke="#1b1206" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M86 246h340"/><path d="M146 246l40-118a20 20 0 0 1 26-12l44 16 44-16a20 20 0 0 1 26 12l40 118" fill="#1b1206"/>' +
    '<circle cx="176" cy="342" r="56"/><circle cx="336" cy="342" r="56"/><path d="M232 338c16-10 32-10 48 0"/></g></svg>';

  /* ---------- persistent state ---------- */
  var defaults = {
    players: ["Amma", "Nanna", "Akka", "Anna", "Ammamma"],
    packs: ["movies", "characters", "heroes", "food", "relations", "moments", "festivals", "wedding", "places"],
    imposters: 1, mode: "classic", timer: 180, voting: "group", lastGuess: true, hints: true,
    sound: true, haptics: true, custom: "", scores: {}, used: {}, rounds: 0, history: [], seenIntro: false
  };
  var S = load();
  function load() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (e) { s = {}; }
    for (var k in defaults) if (!(k in s)) s[k] = JSON.parse(JSON.stringify(defaults[k]));
    return s;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { } }

  /* ---------- helpers ---------- */
  var $app = document.getElementById("app"), $modal = document.getElementById("modal"), $sheet = document.getElementById("sheet"), $toast = document.getElementById("toast");
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rnd(n) { if (window.crypto && crypto.getRandomValues) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; } return Math.floor(Math.random() * n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[rnd(a.length)]; }
  function initial(n) { n = String(n).trim(); return n ? n.charAt(0).toUpperCase() : "?"; }
  function avatar(name, i, cls) { return '<div class="av ' + (cls || "") + '" style="background:' + COLORS[(i < 0 ? 0 : i) % COLORS.length] + '">' + esc(initial(name)) + "</div>"; }
  function maxImposters(n) { return Math.max(1, Math.floor((n - 1) / 2)); }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function grad(p) { return "linear-gradient(135deg," + p.c1 + "," + p.c2 + ")"; }
  function vibrate(p) { if (!S.haptics) return; try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }
  function toast(msg) { $toast.textContent = msg; $toast.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(function () { $toast.classList.remove("show"); }, 2400); }

  var actx;
  function tone(freqs, dur, type) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime;
      freqs.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = type || "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * dur);
        g.gain.exponentialRampToValueAtTime(0.18, t + i * dur + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (i + 1) * dur);
        o.connect(g); g.connect(actx.destination);
        o.start(t + i * dur); o.stop(t + (i + 1) * dur + 0.05);
      });
    } catch (e) { }
  }

  function customPack() {
    var words = S.custom.split(/\n|,/).map(function (w) { return w.trim(); }).filter(Boolean).map(function (w) {
      var p = w.split("|"); return p[1] ? [p[0].trim(), p[1].trim()] : [p[0].trim()];
    });
    return { id: CUSTOM_ID, name: "My Words", icon: "pen", c1: "#E4DED6", c2: "#8E8799", desc: "Your family's inside jokes", words: words };
  }
  function allPacks() { return PACKS.concat([customPack()]); }
  function packById(id) { var a = allPacks(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function cleanPlayers() { return S.players.map(function (p) { return String(p).trim(); }).filter(Boolean); }
  function selectedPacks() { return S.packs.map(packById).filter(function (p) { return p && p.words.length >= 2; }); }

  /* ---------- confetti ---------- */
  var cv = document.getElementById("confetti"), cctx = cv.getContext("2d"), parts = [], craf = null;
  function confetti() {
    var dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = ["#F8C95C", "#EF7D3C", "#35C98A", "#8FC6FF", "#F6A6D0", "#C7AEFF", "#ffffff"];
    for (var i = 0; i < 140; i++) parts.push({ x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .35, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 4, c: cols[i % cols.length], a: Math.random() * 6, va: (Math.random() - .5) * .3, life: 0 });
    if (!craf) loop();
  }
  function loop() {
    cctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function (p) { return p.life < 220 && p.y < innerHeight + 40; });
    parts.forEach(function (p) {
      p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life++;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.a); cctx.fillStyle = p.c; cctx.globalAlpha = Math.max(0, 1 - p.life / 220);
      cctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); cctx.restore();
    });
    craf = parts.length ? requestAnimationFrame(loop) : (cctx.clearRect(0, 0, innerWidth, innerHeight), null);
  }

  /* ---------- round ---------- */
  var R = null, screen = "home", timerInt = null, spinT = null;

  function startRound() {
    var players = cleanPlayers();
    if (players.length < 3) { toast("Add at least 3 players to start"); go("players"); return; }
    var lower = players.map(function (p) { return p.toLowerCase(); });
    if (new Set(lower).size !== lower.length) { toast("Two players have the same name"); go("players"); return; }
    var packs = selectedPacks();
    if (!packs.length) { toast("Choose at least one category"); go("categories"); return; }
    S.players = players;
    var pack = pick(packs);
    var used = S.used[pack.id] || [];
    var fresh = pack.words.filter(function (w) { return used.indexOf(w[0]) < 0; });
    if (!fresh.length) { used = []; fresh = pack.words; }
    var word = pick(fresh);
    used.push(word[0]); S.used[pack.id] = used;
    var decoy = pick(pack.words.filter(function (w) { return w[0] !== word[0]; }));
    var n = players.length, k = Math.min(S.imposters, maxImposters(n));
    R = {
      players: players, pack: pack, word: word, decoy: decoy, mode: S.mode,
      imps: shuffle(players.map(function (_, i) { return i; })).slice(0, k),
      idx: 0, phase: "pass", seen: false, starter: rnd(n), cw: rnd(2) === 0,
      left: S.timer, running: false, voted: null, votes: null, bIdx: 0, bPhase: "pass", bSel: null, tied: null,
      revealed: false, outcome: null, gained: {}, options: null
    };
    save();
    go("pass");
  }
  function isImp(i) { return R.imps.indexOf(i) >= 0; }
  function impNames() { return R.imps.map(function (j) { return "<b>" + esc(R.players[j]) + "</b>"; }).join(" and "); }

  /* ---------- navigation ---------- */
  function go(s) {
    screen = s;
    if (s !== "discuss") stopTimer();
    clearTimeout(spinT);
    render();
    window.scrollTo(0, 0);
    var inRound = ["pass", "starter", "discuss", "vote", "ballot", "tally"].indexOf(s) >= 0;
    try { window.ImposterAndroid && ImposterAndroid.keepAwake(inRound); } catch (e) { }
    if (s === "starter") runSpin();
  }
  var VIEWS = {};
  function render() {
    $app.innerHTML = '<div class="screen">' + VIEWS[screen]() + "</div>";
    if (screen === "discuss") syncTimer();
  }
  function top(title, left, right) { return '<div class="top">' + (left || "") + "<h2>" + title + "</h2>" + (right || "") + "</div>"; }
  function backBtn(act) { return '<button class="ib" data-act="' + act + '" aria-label="Back">' + icon("back") + "</button>"; }
  function quitBtn() { return '<button class="ib" data-act="quit" aria-label="Quit round">' + icon("close") + "</button>"; }

  /* ---------- home ---------- */
  VIEWS.home = function () {
    var players = cleanPlayers(), packs = selectedPacks();
    var words = packs.reduce(function (a, p) { return a + p.words.length; }, 0);
    var names = players.slice(0, 3).join(", ") + (players.length > 3 ? " +" + (players.length - 3) : "");
    var stack = '<div class="stack">' + players.slice(0, 4).map(function (p, i) { return avatar(p, i); }).join("") + "</div>";
    var modeName = { classic: "Classic", hard: "Hard", undercover: "Undercover" }[S.mode];
    var k = Math.min(S.imposters, maxImposters(Math.max(3, players.length)));
    return '<div class="top"><div class="brand grow">' + LOGO + "<div><b>Who's the Imposter?</b><span>Telugu Family Edition</span></div></div>" +
      '<button class="ib" data-act="how" aria-label="How to play">' + icon("help") + "</button></div>" +
      '<div class="hero"><div class="pill"><i></i>PARTY GAME · 3–20 PLAYERS</div>' +
      "<h1>One of you is<br><em>faking it.</em></h1>" +
      "<p>Everyone gets the same secret word — except the imposter. Give clues, read faces, and vote them out.</p></div>" +
      '<div class="list">' +
      li("players", "users", "#8FC6FF", "#3A74D0", "Players", players.length ? plural(players.length, "player") + " · " + esc(names) : "Add players", players.length ? stack : "") +
      li("categories", "film", "#F8C95C", "#EF7D3C", "Categories", (packs.length === 1 ? "1 category" : packs.length + " categories") + " · " + words + " words", "") +
      li("settings", "sliders", "#C7AEFF", "#8253EE", "Game settings", modeName + " · " + plural(k, "imposter") + " · " + (S.timer ? S.timer / 60 + " min timer" : "no timer"), "") +
      "</div>" +
      '<div class="quick"><button class="btn ghost" data-act="how">' + icon("bulb") + "Rules</button>" +
      '<button class="btn ghost" data-act="scores">' + icon("trophy") + "Scores</button></div>" +
      '<div class="footer"><button class="btn" data-act="start">' + icon("play") + "Start Game</button></div>";
  };
  function li(act, ic, c1, c2, title, sub, extra) {
    return '<button class="li" data-act="' + act + '"><span class="ic" style="background:linear-gradient(135deg,' + c1 + "," + c2 + ');color:#1b1206">' + icon(ic) + "</span>" +
      '<span class="tx"><b>' + title + "</b><span>" + sub + "</span></span>" + extra + '<span class="chev">' + icon("chev") + "</span></button>";
  }

  /* ---------- players ---------- */
  VIEWS.players = function () {
    var rows = S.players.map(function (p, i) {
      return '<div class="player"><span class="num">' + (i + 1) + "</span>" + avatar(p, i) + '<input value="' + esc(p) + '" data-pi="' + i + '" maxlength="16" aria-label="Player name" />' +
        '<button class="ib" data-act="delp" data-i="' + i + '" aria-label="Remove">' + icon("trash") + "</button></div>";
    }).join("");
    return top("Players", backBtn("home"), '<span class="count">' + cleanPlayers().length + " / 20</span>") +
      '<p class="muted">Add everyone in the order you’re sitting — the phone is passed around the circle.</p>' +
      '<div class="players">' + rows + "</div>" +
      '<div class="addrow"><input id="newp" placeholder="Add a player" maxlength="16" enterkeyhint="done" autocomplete="off" />' +
      '<button class="btn" data-act="addp" aria-label="Add player">' + icon("plus") + "</button></div>" +
      (S.players.length ? '<button class="link" data-act="clearp" style="align-self:center;color:var(--dim)">Remove all players</button>' : "") +
      '<div class="footer"><button class="btn" data-act="home">' + icon("check") + "Done</button></div>";
  };

  /* ---------- categories ---------- */
  VIEWS.categories = function () {
    var allOn = PACKS.every(function (p) { return S.packs.indexOf(p.id) >= 0; });
    var tiles = allPacks().map(function (p) {
      var on = S.packs.indexOf(p.id) >= 0;
      var cnt = p.id === CUSTOM_ID ? (p.words.length ? plural(p.words.length, "word") : "Tap to add words") : plural(p.words.length, "word");
      return '<button class="tile ' + (on ? "on" : "off") + '" data-act="pack" data-id="' + p.id + '">' +
        '<span class="ic" style="background:' + grad(p) + '">' + icon(p.icon) + '</span><span class="tick">' + icon("check") + "</span>" +
        "<span><b>" + esc(p.name) + "</b><small>" + esc(p.desc) + '</small><small style="color:var(--dim)">' + cnt + "</small></span>" +
        (p.id === CUSTOM_ID && p.words.length ? '<span class="edit link" data-act="editcustom">Edit</span>' : "") + "</button>";
    }).join("");
    var n = selectedPacks().length;
    return top("Categories", backBtn("home"), '<button class="link" data-act="allpacks">' + (allOn ? "Clear all" : "Select all") + "</button>") +
      '<p class="muted">Each round uses a random category from your selection.</p>' +
      '<div class="tiles">' + tiles + "</div>" +
      '<div class="footer"><button class="btn" data-act="home">' + icon("check") + "Done · " + n + " selected</button></div>";
  };

  /* ---------- settings ---------- */
  VIEWS.settings = function () {
    var n = Math.max(3, cleanPlayers().length), mx = maxImposters(n);
    if (S.imposters > mx) S.imposters = mx;
    function seg(key, opts) {
      return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (S[key] === o[0] ? "on" : "") + '" data-act="set" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>";
    }
    function sw(key, title, sub) {
      return '<div class="set"><div class="lbl"><span><b>' + title + "</b><small>" + sub + '</small></span><button class="switch' + (S[key] ? " on" : "") + '" data-act="toggle" data-k="' + key + '" aria-label="' + title + '"></button></div></div>';
    }
    var modes = [["classic", "Classic", "The imposter knows they’re the imposter and sees the category."],
      ["hard", "Hard", "The imposter knows they’re the imposter, but gets no category at all."],
      ["undercover", "Undercover", "The imposter secretly gets a different word from the same category — and doesn’t know they’re the imposter."]];
    return top("Game settings", backBtn("home")) +
      '<div class="eyebrow">Gameplay</div><div class="group">' +
      '<div class="set"><div class="lbl"><span><b>Imposters</b><small>Up to ' + mx + " with " + n + ' players</small></span><div class="stepper"><button data-act="imp" data-d="-1" aria-label="Fewer">−</button><b>' + S.imposters + '</b><button data-act="imp" data-d="1" aria-label="More">+</button></div></div></div>' +
      '<div class="set"><div class="lbl"><span><b>Mode</b></span></div><div class="ctl modes">' + modes.map(function (m) {
        return '<button class="mode' + (S.mode === m[0] ? " on" : "") + '" data-act="set" data-k="mode" data-v="' + m[0] + '"><span class="radio"></span><span><b>' + m[1] + "</b><small>" + m[2] + "</small></span></button>";
      }).join("") + "</div></div>" +
      '<div class="set"><div class="lbl"><span><b>Discussion timer</b><small>Counts down while you give clues</small></span></div><div class="ctl">' + seg("timer", [[0, "Off"], [60, "1m"], [120, "2m"], [180, "3m"], [300, "5m"]]) + "</div></div>" +
      '<div class="set"><div class="lbl"><span><b>Voting</b><small>' + (S.voting === "group" ? "Everyone points at once, then you tap the chosen player." : "Pass the phone — each player votes privately.") + '</small></span></div><div class="ctl">' + seg("voting", [["group", "Point together"], ["secret", "Secret ballot"]]) + "</div></div>" +
      sw("lastGuess", "Imposter’s last chance", "A caught imposter can still win by guessing the word") +
      sw("hints", "Word descriptions", "Show a short explanation under words like “Pulihora”") +
      "</div>" +
      '<div class="eyebrow" style="margin-top:6px">Feedback</div><div class="group">' +
      sw("sound", "Sound effects", "Reveal, countdown and result sounds") +
      sw("haptics", "Vibration", "Buzz on reveal and when time runs out") +
      "</div>" +
      '<div class="footer"><button class="btn" data-act="home">' + icon("check") + "Done</button></div>";
  };

  /* ---------- card passing ---------- */
  VIEWS.pass = function () {
    var i = R.idx, name = R.players[i];
    var dots = '<div class="dots">' + R.players.map(function (_, j) { return '<i class="' + (j < i ? "done" : j === i ? "cur" : "") + '"></i>'; }).join("") + "</div>";
    var head = top("Secret cards", quitBtn(), '<span class="count">' + (i + 1) + " of " + R.players.length + "</span>");
    if (R.phase === "pass") {
      return head + '<div class="stage">' + dots + avatar(name, i, "big-av") +
        '<div><div class="eyebrow">Pass the phone to</div><h1 style="margin-top:6px">' + esc(name) + "</h1></div>" +
        '<div class="notice">' + icon("eyeoff") + "Keep the screen hidden from others</div></div>" +
        '<div class="footer"><button class="btn" data-act="iam">I’m ' + esc(name) + "</button></div>";
    }
    var last = i + 1 >= R.players.length;
    return head + '<div class="stage">' + cardHtml(i) + '<p class="dim">Press and hold the card. Release to hide it.</p></div>' +
      '<div class="footer"><button class="btn" id="nextcard" data-act="hide"' + (R.seen ? "" : " disabled") + ">" +
      (last ? icon("check") + "Everyone’s ready" : "Next: " + esc(R.players[i + 1]) + icon("chev")) + "</button></div>";
  };

  function cardHtml(i) {
    var p = R.pack, secret;
    function wordFace(w) {
      return '<div class="face secret" style="--pg:' + grad(p) + '"><span class="ic">' + icon(p.icon) + '</span><div class="cat">' + esc(p.name) + '</div><div class="word">' + esc(w[0]) + "</div>" +
        (S.hints && w[1] ? '<div class="hint">' + esc(w[1]) + "</div>" : "") + "</div>";
    }
    if (isImp(i) && R.mode === "undercover") secret = wordFace(R.decoy);
    else if (isImp(i)) {
      var mates = R.imps.filter(function (j) { return j !== i; }).map(function (j) { return esc(R.players[j]); });
      secret = '<div class="face secret imp"><span class="ic">' + icon("spy") + '</span><div class="cat">Your role</div><div class="word">You’re the Imposter</div>' +
        '<div class="hint">Blend in and work out the secret word.</div>' +
        (R.mode === "classic" ? '<div class="tag">Category: <b>' + esc(p.name) + "</b></div>" : '<div class="tag">No category this time</div>') +
        (mates.length ? '<div class="tag">Fellow imposter: <b>' + mates.join(", ") + "</b></div>" : "") + "</div>";
    } else secret = wordFace(R.word);
    return '<div class="card" id="card"><div class="face cover"><span class="hold">' + icon("eye") + "</span><b>Hold to reveal</b><span>" + esc(R.players[i]) + "’s secret card</span></div>" + secret + "</div>";
  }

  function bindCard() {
    var card = document.getElementById("card");
    if (!card) return;
    function show(e) { e.preventDefault(); if (card.classList.contains("show")) return; card.classList.add("show"); vibrate(20); tone([660], 0.07); R.seen = true; }
    function hide() {
      if (!card.classList.contains("show")) return;
      card.classList.remove("show");
      var b = document.getElementById("nextcard"); if (b) b.disabled = false;
    }
    card.addEventListener("pointerdown", show);
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { card.addEventListener(ev, hide); });
    card.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

  /* ---------- who starts ---------- */
  VIEWS.starter = function () {
    return top("Who starts?", quitBtn()) +
      '<div class="stage"><div class="eyebrow">First clue comes from</div><div class="spin" id="spin">…</div>' +
      '<div class="dir" id="dir" style="visibility:hidden">' + icon(R.cw ? "rotate" : "rotateccw") + "Then go " + (R.cw ? "clockwise" : "anticlockwise") + "</div></div>" +
      '<div class="footer"><button class="btn" id="spindone" data-act="todiscuss" disabled>Start discussion</button></div>';
  };
  function runSpin() {
    var el = document.getElementById("spin"), k = 0, delays = [];
    for (var d = 60; d < 360; d *= 1.17) delays.push(d);
    var start = rnd(R.players.length);
    (function step() {
      if (screen !== "starter") return;
      if (k >= delays.length) {
        el.textContent = R.players[R.starter]; el.classList.add("land");
        document.getElementById("dir").style.visibility = "visible";
        document.getElementById("spindone").disabled = false;
        tone([523, 784], 0.12); vibrate(30);
        return;
      }
      el.textContent = R.players[(start + k) % R.players.length]; tone([300 + k * 12], 0.03, "triangle");
      spinT = setTimeout(step, delays[k++]);
    })();
  }

  /* ---------- discussion ---------- */
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  VIEWS.discuss = function () {
    var st = R.players[R.starter], timer = "";
    if (S.timer) {
      var C = 2 * Math.PI * 108;
      timer = '<div class="timer" id="timer"><svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="108" fill="none" stroke="#1e1929" stroke-width="12"/>' +
        '<defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8C95C"/><stop offset="1" stop-color="#EF7D3C"/></linearGradient></defs>' +
        '<circle id="arc" cx="120" cy="120" r="108" fill="none" stroke="url(#tg)" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + C + '"/></svg>' +
        '<div class="t"><b id="tt">' + fmt(R.left) + '</b><span id="ts">remaining</span></div></div>' +
        '<div class="row"><button class="btn ghost" data-act="pause" id="pausebtn"></button><button class="btn ghost" data-act="more">' + icon("plus") + "30 sec</button></div>";
    }
    return top("Discussion", quitBtn()) +
      '<div class="infocard">' + avatar(st, R.starter) + '<div class="tx"><b>' + esc(st) + " goes first</b><span>Then " + (R.cw ? "clockwise" : "anticlockwise") + " · " +
      (R.mode === "hard" ? "Category is secret" : esc(R.pack.name)) + "</span></div></div>" + timer +
      (S.timer ? "" : '<div class="group" style="padding:16px"><ul class="tips"><li><i>1</i>Each player says one word or short clue about the secret word.</li><li><i>2</i>Not too obvious — the imposter is listening.</li><li><i>3</i>Go around once or twice, then debate who’s faking it.</li></ul></div>') +
      '<div class="footer"><button class="btn red" data-act="tovote">' + icon("vote") + "Go to voting</button></div>";
  };
  function syncTimer() {
    if (!S.timer || !document.getElementById("arc")) return;
    var C = 2 * Math.PI * 108;
    document.getElementById("arc").setAttribute("stroke-dashoffset", String(C * (1 - Math.max(0, R.left) / Math.max(S.timer, R.left, 1))));
    document.getElementById("timer").classList.toggle("urgent", R.left <= 10);
    document.getElementById("tt").textContent = fmt(R.left);
    document.getElementById("ts").textContent = R.left <= 0 ? "time’s up" : R.running ? "remaining" : "paused";
    document.getElementById("pausebtn").innerHTML = R.running ? icon("pause") + "Pause" : icon("play") + "Resume";
  }
  function startTimer() {
    if (!S.timer || !R || R.left <= 0) return;
    stopTimer(); R.running = true;
    var last = Date.now();
    timerInt = setInterval(function () {
      var now = Date.now(); R.left -= (now - last) / 1000; last = now;
      if (R.left <= 10 && R.left > 0 && Math.ceil(R.left) !== R.tick) { R.tick = Math.ceil(R.left); tone([880], 0.06); }
      if (R.left <= 0) {
        R.left = 0; stopTimer();
        vibrate([300, 120, 300, 120, 500]); tone([660, 520, 392], 0.22, "triangle");
        toast("Time’s up! Time to vote.");
      }
      syncTimer();
    }, 200);
  }
  function stopTimer() { if (timerInt) clearInterval(timerInt); timerInt = null; if (R) R.running = false; }

  /* ---------- voting ---------- */
  function voteGrid(sel, only, exclude) {
    return '<div class="votegrid">' + R.players.map(function (p, i) {
      if (only && only.indexOf(i) < 0) return "";
      return '<button class="vote' + (sel === i ? " sel" : "") + '" data-act="pickvote" data-i="' + i + '"' + (exclude === i ? " disabled" : "") + ">" + avatar(p, i) + esc(p) + "</button>";
    }).join("") + "</div>";
  }
  VIEWS.vote = function () {
    var tie = R.tied;
    return top(tie ? "Tie-breaker" : "Vote", tie ? quitBtn() : backBtn("back-discuss")) +
      '<p class="muted">' + (tie ? "It’s a tie. Talk it out and choose one of these players." : "On the count of three, everyone points at their suspect. Tap the player with the most votes.") + "</p>" +
      voteGrid(R.voted, tie) +
      '<div class="footer"><button class="btn red" data-act="lockvote"' + (R.voted == null ? " disabled" : "") + ">" +
      (R.voted == null ? "Select a player" : "Vote out " + esc(R.players[R.voted])) + "</button></div>";
  };
  VIEWS.ballot = function () {
    var i = R.bIdx, name = R.players[i];
    var head = top("Secret ballot", quitBtn(), '<span class="count">' + (i + 1) + " of " + R.players.length + "</span>");
    if (R.bPhase === "pass") {
      return head + '<div class="stage">' + avatar(name, i, "big-av") + '<div><div class="eyebrow">Pass the phone to</div><h1 style="margin-top:6px">' + esc(name) + "</h1></div>" +
        '<div class="notice">' + icon("eyeoff") + "Votes stay hidden until the end</div></div>" +
        '<div class="footer"><button class="btn" data-act="bready">I’m ' + esc(name) + " — vote</button></div>";
    }
    return head + '<p class="muted">' + esc(name) + ", who do you think is the imposter?</p>" + voteGrid(R.bSel, null, i) +
      '<div class="footer"><button class="btn red" data-act="bcast"' + (R.bSel == null ? " disabled" : "") + ">" + icon("vote") + "Cast secret vote</button></div>";
  };
  VIEWS.tally = function () {
    var counts = R.players.map(function (_, i) { return R.votes.filter(function (v) { return v === i; }).length; });
    var max = Math.max.apply(null, counts);
    var order = R.players.map(function (_, i) { return i; }).sort(function (a, b) { return counts[b] - counts[a]; });
    var tied = order.filter(function (i) { return counts[i] === max; });
    var bars = order.filter(function (i) { return counts[i] > 0; }).map(function (i) {
      return '<div class="bar' + (counts[i] === max ? " top" : "") + '"><span class="fill" style="width:' + (counts[i] / R.players.length * 100) + '%"></span>' + avatar(R.players[i], i) +
        '<span class="n">' + esc(R.players[i]) + '</span><span class="c">' + plural(counts[i], "vote") + "</span></div>";
    }).join("");
    R.tallyTied = tied;
    return top("Vote results", quitBtn()) + '<div class="bars">' + bars + "</div>" +
      '<div class="footer">' + (tied.length > 1
        ? '<p class="muted center">It’s a tie between ' + tied.map(function (i) { return esc(R.players[i]); }).join(", ") + '.</p><button class="btn" data-act="tiebreak">Break the tie</button>'
        : '<button class="btn red" data-act="lockvote-tally">Vote out ' + esc(R.players[tied[0]]) + "</button>") + "</div>";
  };

  /* ---------- reveal ---------- */
  VIEWS.reveal = function () {
    var v = R.voted, name = esc(R.players[v]);
    if (!R.revealed) {
      return top("The verdict", quitBtn()) + '<div class="stage">' + avatar(R.players[v], v, "big-av") +
        '<div class="suspense">The group voted out<br><b style="font-size:34px">' + name + "</b></div>" +
        '<p class="muted">Were they the imposter?</p></div>' +
        '<div class="footer"><button class="btn" data-act="dorevealrole">' + icon("eye") + "Reveal role</button></div>";
    }
    var caught = isImp(v);
    return top("The verdict", quitBtn()) + '<div class="verdict"><div class="badge ' + (caught ? "win" : "lose") + '">' + icon(caught ? "spy" : "x") + "</div>" +
      "<h1>" + (caught ? name + (R.imps.length > 1 ? " was an imposter!" : " was the imposter!") : name + " was innocent") + "</h1>" +
      "<p>" + (caught ? (S.lastGuess ? "Not over yet — " + name + " gets one chance to guess the secret word." : "Great detective work.") : "The real imposter " + (R.imps.length > 1 ? "were " : "was ") + impNames() + ".") + "</p></div>" +
      '<div class="footer"><button class="btn" data-act="afterreveal">' + (caught && S.lastGuess ? "Imposter’s last guess" : "See results") + "</button></div>";
  };

  function guessOptions() {
    if (!R.options) R.options = shuffle(shuffle(R.pack.words.filter(function (w) { return w[0] !== R.word[0]; })).slice(0, 7).concat([R.word]));
    return R.options;
  }
  VIEWS.guess = function () {
    var name = esc(R.players[R.voted]);
    return top("Last chance") + '<div class="verdict" style="padding-top:4px"><div class="badge neutral">' + icon("spy") + "</div><h1>" + name + ", what’s the word?</h1>" +
      "<p>Pick correctly and the imposters steal the win.</p></div>" +
      '<div class="guessgrid">' + guessOptions().map(function (w, k) { return '<button data-act="guess" data-k="' + k + '">' + esc(w[0]) + "</button>"; }).join("") + "</div>";
  };

  function finish(outcome) {
    R.outcome = outcome;
    var team = outcome === "civ" ? "civ" : "imp", pts = outcome === "imp" ? 2 : 1;
    R.gained = {};
    R.players.forEach(function (p, i) {
      if (!(p in S.scores)) S.scores[p] = 0;
      if ((team === "imp") === isImp(i)) { S.scores[p] += pts; R.gained[p] = pts; }
    });
    S.rounds++;
    S.history.unshift({ w: R.word[0], p: R.pack.id, i: R.imps.map(function (j) { return R.players[j]; }), o: outcome, t: Date.now() });
    S.history = S.history.slice(0, 30);
    save();
    go("result");
    if (outcome === "civ") { confetti(); tone([523, 659, 784, 1046], 0.12, "triangle"); vibrate([60, 50, 60]); }
    else { tone([440, 349, 262], 0.2, "triangle"); vibrate([200, 100, 200]); }
  }

  VIEWS.result = function () {
    var o = R.outcome, title, sub, cls;
    if (o === "civ") { cls = "win"; title = "The family wins!"; sub = "The imposter was caught and couldn’t guess the word."; }
    else if (o === "guess") { cls = "lose"; title = "Imposter steals it!"; sub = "Caught — but they guessed the secret word."; }
    else { cls = "lose"; title = "The imposter got away"; sub = esc(R.players[R.voted]) + " was innocent. The imposter " + (R.imps.length > 1 ? "were " : "was ") + impNames() + "."; }
    if (o !== "imp" && R.imps.length > 1) sub += " Imposters: " + impNames() + ".";
    return '<div class="verdict"><div class="badge ' + cls + '">' + icon(o === "civ" ? "shield" : "spy") + "</div><h1>" + title + "</h1><p>" + sub + "</p></div>" +
      '<div class="wordbox" style="--pg:' + grad(R.pack) + '"><div class="eyebrow">' + esc(R.pack.name) + ' · secret word</div><div class="word">' + esc(R.word[0]) + "</div>" +
      (S.hints && R.word[1] ? '<div class="hint">' + esc(R.word[1]) + "</div>" : "") +
      (R.mode === "undercover" ? '<div class="decoy">Imposter’s word was <b>' + esc(R.decoy[0]) + "</b></div>" : "") + "</div>" +
      '<div class="section-h"><div class="eyebrow">Leaderboard</div><span class="dim">Round ' + S.rounds + "</span></div>" + board(true) +
      '<div class="footer"><button class="btn" data-act="start">' + icon("rotate") + "Next round</button>" +
      '<div class="row"><button class="btn ghost" data-act="scores">' + icon("trophy") + 'Scores</button><button class="btn ghost" data-act="home">' + icon("home") + "Home</button></div></div>";
  };

  function board(showGain) {
    var names = Object.keys(S.scores).sort(function (a, b) { return S.scores[b] - S.scores[a] || a.localeCompare(b); });
    if (!names.length) return '<div class="empty">No rounds played yet. Start a game to get on the board.</div>';
    var rank = 0, prev = null;
    return '<div class="board">' + names.map(function (n, k) {
      if (S.scores[n] !== prev) { rank = k + 1; prev = S.scores[n]; }
      var pi = S.players.indexOf(n), ri = R ? R.players.indexOf(n) : -1;
      var g = showGain && R && R.gained[n];
      var imp = showGain && R && ri >= 0 && isImp(ri);
      return '<div class="score' + (rank === 1 && S.scores[n] > 0 ? " first" : "") + '"><span class="rank">' + rank + "</span>" + avatar(n, pi >= 0 ? pi : k) +
        '<span class="n">' + esc(n) + "</span>" + (imp ? '<span class="tag">Imposter</span>' : "") + (g ? '<span class="plus">+' + g + "</span>" : "") +
        '<span class="p">' + S.scores[n] + "</span></div>";
    }).join("") + "</div>";
  }

  VIEWS.scores = function () {
    var hist = S.history.slice(0, 12).map(function (h) {
      var p = packById(h.p) || PACKS[0];
      return '<div class="hrow"><span class="ic" style="background:' + grad(p) + '">' + icon(p.icon) + '</span><span class="tx"><b>' + esc(h.w) + "</b><span>Imposter: " + esc(h.i.join(", ")) + "</span></span>" +
        '<span class="res ' + (h.o === "civ" ? "c" : "i") + '">' + (h.o === "civ" ? "Family won" : "Imposter won") + "</span></div>";
    }).join("");
    return top("Scoreboard", backBtn("home"), S.rounds ? '<button class="link" data-act="resetscores">Reset</button>' : "") +
      board(false) +
      '<div class="group" style="padding:14px 16px"><ul class="tips"><li><i>+1</i>Each family member when the imposter is caught</li><li><i>+2</i>Each imposter who escapes the vote</li><li><i>+1</i>Each imposter when a caught imposter guesses the word</li></ul></div>' +
      (hist ? '<div class="section-h"><div class="eyebrow">Recent rounds</div></div><div class="hist">' + hist + "</div>" : "") +
      '<div class="footer"><button class="btn" data-act="start">' + icon("play") + "Play a round</button></div>";
  };

  /* ---------- sheets ---------- */
  var modalOpen = false;
  function openModal(html) { $sheet.innerHTML = html; $modal.classList.remove("hidden"); modalOpen = true; }
  function closeModal() { $modal.classList.add("hidden"); modalOpen = false; }
  $modal.addEventListener("click", function (e) { if (e.target === $modal) closeModal(); });

  function howTo() {
    openModal("<h2>How to play</h2><p>A bluffing game for 3 to 20 players and one phone.</p><ol class=\"steps\">" +
      "<li><i>1</i><div><b>Get your secret card</b><span>Pass the phone around. Everyone holds the card to see the same secret word — except the imposter.</span></div></li>" +
      "<li><i>2</i><div><b>Give one clue each</b><span>Starting with the chosen player, say one word linked to the secret. Too obvious and the imposter learns it; too vague and you look suspicious.</span></div></li>" +
      "<li><i>3</i><div><b>Debate and vote</b><span>Point at your suspect together, or use a secret ballot.</span></div></li>" +
      "<li><i>4</i><div><b>The last guess</b><span>A caught imposter can still win by naming the secret word.</span></div></li></ol>" +
      '<div class="group" style="margin-top:18px;padding:14px 16px"><b>Example</b><p style="margin-top:4px">Word: <b style="color:var(--text)">Pulihora</b>. Good clues: “temple”, “yellow”, “tangy”. Too easy: “tamarind rice”.</p></div>' +
      '<div class="acts"><button class="btn" data-act="close">Got it</button></div>');
  }
  function editCustom() {
    openModal("<h2>My Words</h2><p>One word or phrase per line. Add an optional description after a | sign, for example: <b style=\"color:var(--text)\">Grandpa’s scooter | The old blue Chetak</b></p>" +
      '<textarea id="customtxt" placeholder="Grandpa’s scooter&#10;Our Vizag trip&#10;Uncle’s famous jokes">' + esc(S.custom) + "</textarea>" +
      '<div class="acts"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="savecustom">Save</button></div>');
  }
  function confirmQuit() {
    openModal("<h2>End this round?</h2><p>The secret word will be lost. Scores from earlier rounds are kept.</p>" +
      '<div class="acts"><button class="btn ghost" data-act="close">Keep playing</button><button class="btn red" data-act="doquit">End round</button></div>');
  }

  /* ---------- events ---------- */
  function readPlayers() {
    var ins = $app.querySelectorAll("input[data-pi]");
    for (var i = 0; i < ins.length; i++) S.players[+ins[i].getAttribute("data-pi")] = ins[i].value;
  }
  function addPlayer() {
    var inp = document.getElementById("newp"), v = inp && inp.value.trim();
    if (!v) { inp && inp.focus(); return; }
    readPlayers();
    if (S.players.length >= 20) { toast("20 players is the maximum"); return; }
    if (S.players.some(function (p) { return p.trim().toLowerCase() === v.toLowerCase(); })) { toast(v + " is already in the game"); return; }
    S.players.push(v); save(); render();
    var n = document.getElementById("newp"); if (n) n.focus();
  }
  document.addEventListener("input", function (e) { if (e.target.hasAttribute && e.target.hasAttribute("data-pi")) { S.players[+e.target.getAttribute("data-pi")] = e.target.value; save(); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.id === "newp") { e.preventDefault(); addPlayer(); } });

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    var a = el.getAttribute("data-act");
    if (screen === "players") readPlayers();
    switch (a) {
      case "home": if (screen === "players") { S.players = cleanPlayers(); save(); } go("home"); break;
      case "players": case "categories": case "settings": case "scores": go(a); break;
      case "how": howTo(); break;
      case "close": closeModal(); break;
      case "addp": addPlayer(); break;
      case "delp": S.players.splice(+el.getAttribute("data-i"), 1); save(); render(); break;
      case "clearp": S.players = []; save(); render(); break;
      case "pack": {
        var id = el.getAttribute("data-id"), k = S.packs.indexOf(id);
        if (id === CUSTOM_ID && k < 0 && customPack().words.length < 2) { editCustom(); break; }
        if (k >= 0) S.packs.splice(k, 1); else S.packs.push(id);
        save(); render(); break;
      }
      case "editcustom": editCustom(); break;
      case "allpacks": {
        var allOn = PACKS.every(function (p) { return S.packs.indexOf(p.id) >= 0; });
        S.packs = allOn ? [] : PACKS.map(function (p) { return p.id; }).concat(customPack().words.length >= 2 ? [CUSTOM_ID] : []);
        save(); render(); break;
      }
      case "savecustom": {
        S.custom = document.getElementById("customtxt").value;
        var ci = S.packs.indexOf(CUSTOM_ID), cn = customPack().words.length;
        if (cn >= 2) { if (ci < 0) S.packs.push(CUSTOM_ID); toast("Saved " + plural(cn, "word")); }
        else { if (ci >= 0) S.packs.splice(ci, 1); toast("Add at least 2 words to use this category"); }
        save(); closeModal(); render(); break;
      }
      case "imp": {
        var mx = maxImposters(Math.max(3, cleanPlayers().length));
        S.imposters = Math.min(mx, Math.max(1, S.imposters + +el.getAttribute("data-d"))); save(); render(); break;
      }
      case "set": { var key = el.getAttribute("data-k"), val = el.getAttribute("data-v"); S[key] = key === "timer" ? +val : val; save(); render(); break; }
      case "toggle": { var tk = el.getAttribute("data-k"); S[tk] = !S[tk]; save(); render(); break; }
      case "start": closeModal(); startRound(); break;
      case "iam": R.phase = "card"; R.seen = false; render(); bindCard(); break;
      case "hide":
        R.idx++; R.phase = "pass"; R.seen = false;
        if (R.idx >= R.players.length) go("starter"); else render();
        break;
      case "todiscuss": R.left = S.timer; go("discuss"); startTimer(); syncTimer(); break;
      case "pause": if (R.running) stopTimer(); else startTimer(); syncTimer(); break;
      case "more": R.left += 30; if (!R.running) startTimer(); syncTimer(); break;
      case "tovote":
        stopTimer(); R.voted = null; R.tied = null;
        if (S.voting === "secret") { R.votes = []; R.bIdx = 0; R.bPhase = "pass"; R.bSel = null; go("ballot"); } else go("vote");
        break;
      case "back-discuss": go("discuss"); startTimer(); syncTimer(); break;
      case "pickvote": {
        var vi = +el.getAttribute("data-i");
        if (screen === "ballot") R.bSel = vi; else R.voted = vi;
        vibrate(12); render(); break;
      }
      case "bready": R.bPhase = "choose"; R.bSel = null; render(); break;
      case "bcast":
        R.votes.push(R.bSel); R.bIdx++; R.bPhase = "pass"; R.bSel = null; tone([520], 0.06);
        if (R.bIdx >= R.players.length) go("tally"); else render();
        break;
      case "tiebreak": R.tied = R.tallyTied; R.voted = null; go("vote"); break;
      case "lockvote-tally": R.voted = R.tallyTied[0]; R.revealed = false; go("reveal"); break;
      case "lockvote": R.revealed = false; go("reveal"); break;
      case "dorevealrole":
        R.revealed = true; render();
        if (isImp(R.voted)) { tone([392, 523, 659], 0.1, "triangle"); vibrate([40, 40, 40]); } else { tone([330, 262], 0.2, "triangle"); vibrate(200); }
        break;
      case "afterreveal":
        if (!isImp(R.voted)) finish("imp");
        else if (S.lastGuess) go("guess");
        else finish("civ");
        break;
      case "guess": {
        var w = guessOptions()[+el.getAttribute("data-k")], right = w[0] === R.word[0];
        var btns = $app.querySelectorAll("[data-act=guess]");
        for (var b = 0; b < btns.length; b++) { btns[b].disabled = true; if (guessOptions()[b][0] === R.word[0]) btns[b].className = "right"; }
        if (!right) el.className = "wrong";
        vibrate(30);
        setTimeout(function () { finish(right ? "guess" : "civ"); }, 1200);
        break;
      }
      case "quit": confirmQuit(); break;
      case "doquit": closeModal(); stopTimer(); R = null; go("home"); break;
      case "resetscores":
        openModal('<h2>Reset scores?</h2><p>This clears the leaderboard and round history.</p><div class="acts"><button class="btn ghost" data-act="close">Cancel</button><button class="btn red" data-act="doreset">Reset</button></div>');
        break;
      case "doreset": S.scores = {}; S.rounds = 0; S.history = []; save(); closeModal(); render(); toast("Scores reset"); break;
    }
  });

  /* Android back button: return true if handled. */
  window.appBack = function () {
    if (modalOpen) { closeModal(); return true; }
    if (screen === "home") return false;
    if (["players", "categories", "settings", "scores", "result"].indexOf(screen) >= 0) {
      if (screen === "players") { readPlayers(); S.players = cleanPlayers(); save(); }
      go("home"); return true;
    }
    if (screen === "vote" && !R.tied) { go("discuss"); startTimer(); syncTimer(); return true; }
    if (screen === "guess") return true;
    confirmQuit(); return true;
  };

  render();
  if (!S.seenIntro) { S.seenIntro = true; save(); setTimeout(howTo, 400); }
})();
