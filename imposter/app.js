/* Imposter Evaru? — a pass-and-play party game with Telugu word packs. */
(function () {
  "use strict";

  var PACKS = window.PACKS;
  var CUSTOM_ID = "custom";
  var COLORS = ["#f5b82e", "#ff8a5c", "#7fd6a2", "#7cc4ff", "#f59bd0", "#c7a6ff", "#ffd877", "#9be27a", "#ff6b81", "#5ee0d0", "#ffb86b", "#b5c7ff"];
  var STORE = "imposterEvaru.v1";

  /* ---------- persistent state ---------- */
  var defaults = {
    players: ["Amma", "Nanna", "Akka", "Thammudu"],
    packs: ["movies", "characters", "heroes", "food", "relations", "moments", "festivals", "wedding", "places"],
    imposters: 1,
    mode: "classic", // classic | hard | undercover
    timer: 180,
    telugu: true,
    sound: true,
    custom: "",
    scores: {},
    used: {},
    rounds: 0
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
  var $app = document.getElementById("app");
  var $modal = document.getElementById("modal");
  var $sheet = document.getElementById("sheet");
  var $toast = document.getElementById("toast");

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rnd(n) {
    if (window.crypto && crypto.getRandomValues) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
    return Math.floor(Math.random() * n);
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[rnd(a.length)]; }
  function initial(name) { var n = String(name).trim(); return n ? n.charAt(0).toUpperCase() : "?"; }
  function color(i) { return COLORS[i % COLORS.length]; }
  function avatar(name, i, cls) { return '<div class="avatar ' + (cls || "") + '" style="background:' + color(i) + '">' + esc(initial(name)) + "</div>"; }
  function maxImposters(n) { return Math.max(1, Math.floor((n - 1) / 2)); }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
  function toast(msg) {
    $toast.textContent = msg; $toast.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(function () { $toast.classList.remove("show"); }, 2200);
  }
  window.toast = toast;

  var actx;
  function beep(freqs, dur) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime;
      freqs.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * dur);
        g.gain.exponentialRampToValueAtTime(0.25, t + i * dur + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (i + 1) * dur);
        o.connect(g); g.connect(actx.destination);
        o.start(t + i * dur); o.stop(t + (i + 1) * dur + 0.05);
      });
    } catch (e) { }
  }

  function customPack() {
    var words = S.custom.split(/\n|,/).map(function (w) { return w.trim(); }).filter(Boolean)
      .map(function (w) { var p = w.split("|"); return [p[0].trim(), (p[1] || "").trim()]; });
    return { id: CUSTOM_ID, emoji: "✍️", name: "My Words", te: "నా పదాలు", words: words };
  }
  function allPacks() { return PACKS.concat([customPack()]); }
  function packById(id) { var a = allPacks(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }

  /* ---------- round ---------- */
  var R = null; // current round
  var screen = "home";
  var timerInt = null;

  function cleanPlayers() { return S.players.map(function (p) { return String(p).trim(); }).filter(Boolean); }

  function startRound() {
    var players = cleanPlayers();
    if (players.length < 3) { toast("Need at least 3 players"); return; }
    var lower = players.map(function (p) { return p.toLowerCase(); });
    if (new Set(lower).size !== lower.length) { toast("Two players have the same name"); return; }
    var packs = S.packs.map(packById).filter(function (p) { return p && p.words.length >= 2; });
    if (!packs.length) { toast(S.packs.indexOf(CUSTOM_ID) >= 0 ? "Add at least 2 words in My Words" : "Pick at least one category"); return; }
    S.players = players;

    var pack = pick(packs);
    var used = S.used[pack.id] || [];
    var fresh = pack.words.filter(function (w) { return used.indexOf(w[0]) < 0; });
    if (!fresh.length) { used = []; fresh = pack.words; }
    var word = pick(fresh);
    used.push(word[0]); S.used[pack.id] = used;
    var others = pack.words.filter(function (w) { return w[0] !== word[0]; });
    var decoy = pick(others);

    var n = players.length;
    var k = Math.min(S.imposters, maxImposters(n));
    var imps = shuffle(players.map(function (_, i) { return i; })).slice(0, k);

    R = {
      players: players, pack: pack, word: word, decoy: decoy, imps: imps, mode: S.mode,
      idx: 0, open: false, starter: rnd(n), dir: rnd(2) ? "clockwise ↻" : "anti-clockwise ↺",
      left: S.timer, running: false, voted: null, phase: "pass", guess: null, outcome: null, gained: {}
    };
    S.rounds++;
    save();
    go("pass");
  }

  function isImp(i) { return R.imps.indexOf(i) >= 0; }

  /* ---------- navigation ---------- */
  function go(s) {
    screen = s;
    if (s !== "discuss") stopTimer();
    render();
    window.scrollTo(0, 0);
    keepAwake(s === "pass" || s === "discuss" || s === "vote");
  }
  function keepAwake(on) { try { window.ImposterAndroid && ImposterAndroid.keepAwake(on); } catch (e) { } }

  function render() {
    var html = ({ home: vHome, setup: vSetup, pass: vPass, discuss: vDiscuss, vote: vVote, result: vResult, scores: vScores })[screen]();
    $app.innerHTML = '<div class="screen">' + html + "</div>";
    if (screen === "discuss") syncTimer();
  }

  /* ---------- views ---------- */
  function logoSvg() {
    return '<svg class="logo" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a1f2f"/><stop offset="1" stop-color="#2a0b12"/></linearGradient><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#f5a623"/></linearGradient></defs>' +
      '<rect width="512" height="512" rx="120" fill="url(#lg)"/>' +
      '<g fill="#3fae6a"><path d="M96 70 q20 60 40 0z"/><path d="M176 70 q20 60 40 0z"/><path d="M296 70 q20 60 40 0z"/><path d="M376 70 q20 60 40 0z"/></g><g fill="#f39a1d"><circle cx="156" cy="80" r="13"/><circle cx="256" cy="84" r="15"/><circle cx="356" cy="80" r="13"/></g>' +
      '<path d="M180 210 q0-80 80-80 q84 0 84 76 q0 50-52 74 q-26 12-26 44 v14" fill="none" stroke="url(#gg)" stroke-width="54" stroke-linecap="round"/>' +
      '<circle cx="266" cy="410" r="34" fill="#e0283c"/><circle cx="266" cy="410" r="12" fill="#ffd877" opacity=".6"/></svg>';
  }

  function vHome() {
    var hasScores = Object.keys(S.scores).length > 0;
    return '<div class="hero">' + logoSvg() +
      '<div class="torana"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
      '<h1>Imposter <span>Evaru?</span></h1><div class="te">ఇంపోస్టర్ ఎవరు?</div>' +
      "<p>The family party game of secret words — Telugu movies, food, festivals, relatives and more. One of you doesn’t know the word… find them!</p></div>" +
      '<div class="grow"></div>' +
      '<button class="btn" data-act="setup">🎲 &nbsp;New Game · ఆట మొదలు</button>' +
      '<div class="row"><button class="btn ghost" data-act="how">📜 How to play</button>' +
      (hasScores ? '<button class="btn ghost" data-act="scores">🏆 Scores</button>' : "") + "</div>" +
      '<p class="dim center">' + allPacks().length + " categories · " + PACKS.reduce(function (a, p) { return a + p.words.length; }, 0) + " words · works offline</p>";
  }

  function vSetup() {
    var players = S.players;
    var n = cleanPlayers().length;
    var maxI = maxImposters(Math.max(3, n));
    if (S.imposters > maxI) S.imposters = maxI;
    var plist = players.map(function (p, i) {
      return '<div class="player">' + avatar(p, i) + '<input value="' + esc(p) + '" data-pi="' + i + '" maxlength="18" />' +
        '<button class="x" data-act="delp" data-i="' + i + '" aria-label="Remove">✕</button></div>';
    }).join("");
    var chips = allPacks().map(function (p) {
      var on = S.packs.indexOf(p.id) >= 0;
      var sub = p.id === CUSTOM_ID ? (p.words.length ? p.words.length + " words" : "Add your own") : p.words.length + " words";
      return '<button class="chip' + (on ? " on" : "") + '" data-act="pack" data-id="' + p.id + '"><span class="e">' + p.emoji + "</span><span><b>" + esc(p.name) + "</b><small>" + sub + "</small></span></button>";
    }).join("");
    function seg(key, opts) {
      return '<div class="seg">' + opts.map(function (o) {
        return '<button class="' + (S[key] === o[0] ? "on" : "") + '" data-act="set" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + "</button>";
      }).join("") + "</div>";
    }
    var modeHelp = { classic: "Imposter knows they’re the imposter and sees the category.", hard: "Imposter knows they’re the imposter — but no category!", undercover: "Imposter secretly gets a different word from the same category and doesn’t know it." }[S.mode];
    return '<div class="top"><button class="iconbtn" data-act="home">←</button><h2>New Game</h2><button class="iconbtn" data-act="how">?</button></div>' +
      '<div class="card"><h3>Players · ఆటగాళ్ళు <small>' + n + " players</small></h3>" +
      '<div class="players">' + plist + "</div>" +
      '<div class="addrow"><input id="newp" placeholder="Add a name (e.g. Babai)" maxlength="18" enterkeyhint="done" /><button class="btn small" data-act="addp">Add</button></div></div>' +
      '<div class="card"><h3>Categories <small><a data-act="allpacks" style="color:var(--gold2)">' + (S.packs.length >= allPacks().length - 1 ? "Clear" : "Select all") + '</a> · <a data-act="editcustom" style="color:var(--gold2)">✎ My words</a></small></h3>' +
      '<div class="chips">' + chips + "</div></div>" +
      '<div class="card"><h3>Settings</h3>' +
      '<div class="opt"><span class="lbl">Imposters<small>Max ' + maxI + " for " + Math.max(n, 3) + " players</small></span>" +
      '<div class="stepper"><button data-act="imp" data-d="-1">−</button><b>' + S.imposters + '</b><button data-act="imp" data-d="1">+</button></div></div>' +
      '<div class="opt"><span class="lbl">Mode<small>' + modeHelp + "</small></span>" + seg("mode", [["classic", "Classic"], ["hard", "Hard"], ["undercover", "Undercover"]]) + "</div>" +
      '<div class="opt"><span class="lbl">Discussion timer</span>' + seg("timer", [[0, "Off"], [60, "1 min"], [120, "2 min"], [180, "3 min"], [300, "5 min"]]) + "</div>" +
      '<div class="opt row between"><span class="lbl" style="margin:0">Show Telugu script<small>తెలుగు లిపిలో కూడా చూపించు</small></span><button class="switch' + (S.telugu ? " on" : "") + '" data-act="toggle" data-k="telugu"></button></div>' +
      '<div class="opt row between"><span class="lbl" style="margin:0">Sounds & vibration</span><button class="switch' + (S.sound ? " on" : "") + '" data-act="toggle" data-k="sound"></button></div>' +
      "</div>" +
      '<div class="sticky"><button class="btn" data-act="start">▶ &nbsp;Start Round</button></div>';
  }

  function vPass() {
    var i = R.idx, name = R.players[i];
    var dots = R.players.map(function (_, j) { return "<i class=\"" + (j < i ? "done" : j === i ? "cur" : "") + "\"></i>"; }).join("");
    var head = '<div class="top"><button class="iconbtn" data-act="quit">✕</button><h2>Secret cards</h2><span class="dim">' + (i + 1) + "/" + R.players.length + "</span></div>";
    if (R.phase === "pass") {
      return head + '<div class="passwrap"><div class="progress">' + dots + "</div>" +
        avatar(name, i, "big-av") +
        '<div><div class="muted">Pass the phone to</div><h1>' + esc(name) + '</h1><div class="te muted">ఫోన్ ' + esc(name) + " కి ఇవ్వండి</div></div>" +
        '<p class="dim">Don’t let anyone else see the screen! 🙈</p></div>' +
        '<button class="btn" data-act="iam">I’m ' + esc(name) + " — show my card</button>";
    }
    return head + '<div class="passwrap"><div class="muted">' + esc(name) + ", tap the card</div>" + cardHtml(i) + "</div>" +
      (R.open ? '<button class="btn" data-act="hide">' + (i + 1 < R.players.length ? "Hide & pass to " + esc(R.players[i + 1]) + " →" : "Hide — everyone’s ready! ✅") + "</button>"
        : '<button class="btn ghost" data-act="flip">👆 Tap to reveal</button>');
  }

  function wordBlock(w, pack) {
    return '<div class="cat">' + pack.emoji + " " + esc(pack.name) + '</div><div class="word">' + esc(w[0]) + "</div>" +
      (S.telugu && w[1] ? '<div class="wordte te">' + esc(w[1]) + "</div>" : "") +
      (w[2] ? '<div class="hint">' + esc(w[2]) + "</div>" : "");
  }

  function cardHtml(i) {
    var back;
    if (isImp(i) && R.mode === "undercover") {
      back = '<div class="face back">' + wordBlock(R.decoy, R.pack) + "</div>";
    } else if (isImp(i)) {
      var mates = R.imps.filter(function (j) { return j !== i; }).map(function (j) { return esc(R.players[j]); });
      back = '<div class="face back imp"><div class="emoji">🤫</div><div class="word">You are the IMPOSTER!</div>' +
        (S.telugu ? '<div class="wordte te">నువ్వే ఇంపోస్టర్!</div>' : "") +
        (R.mode === "classic" ? '<div class="hint">Category: <b>' + R.pack.emoji + " " + esc(R.pack.name) + "</b></div>" : '<div class="hint">No category for you. Good luck! 😈</div>') +
        (mates.length ? '<div class="hint">Your partner: <b>' + mates.join(", ") + "</b></div>" : "") +
        '<div class="hint">Blend in & guess the secret word.</div></div>';
    } else {
      back = '<div class="face back">' + wordBlock(R.word, R.pack) + "</div>";
    }
    return '<div class="flip' + (R.open ? " open" : "") + '" data-act="flip"><div class="inner">' +
      '<div class="face front"><div class="q">?<b>.</b></div><div class="muted">Tap to see your secret</div><div class="dim te">నీ రహస్య పదం</div></div>' + back + "</div></div>";
  }

  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }

  function vDiscuss() {
    var st = R.players[R.starter];
    var ring = "";
    if (S.timer) {
      var C = 2 * Math.PI * 104;
      ring = '<div class="timer"><svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="104" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="14"/>' +
        '<circle id="arc" cx="120" cy="120" r="104" fill="none" stroke="#f5b82e" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg>' +
        '<div class="t"><div><span id="tt">' + fmt(R.left) + '</span><small id="ts">discuss</small></div></div></div>' +
        '<div class="row"><button class="btn ghost" data-act="pause" id="pausebtn">' + (R.running ? "⏸ Pause" : "▶ Resume") + '</button><button class="btn ghost" data-act="more">+30s</button></div>';
    }
    return '<div class="top"><button class="iconbtn" data-act="quit">✕</button><h2>Discussion · చర్చ</h2></div>' +
      '<div class="card starter">' + avatar(st, R.starter) + '<div style="margin-top:8px"><b>' + esc(st) + "</b> starts! Go " + R.dir + "</div>" +
      '<div class="dim">Category: ' + (R.mode === "hard" ? "secret 🤐" : R.pack.emoji + " " + esc(R.pack.name)) + "</div></div>" + ring +
      '<div class="card"><h3>How this round works</h3><ol class="tips"><li>Each person says <b>one word or clue</b> about the secret word.</li><li>Don’t be too obvious — the imposter is listening! 👂</li><li>Go round once or twice, then argue & accuse 😄</li></ol></div>' +
      '<div class="sticky"><button class="btn red" data-act="tovote">🗳️ &nbsp;Time to Vote</button></div>';
  }

  function syncTimer() {
    if (!S.timer) return;
    var arc = document.getElementById("arc");
    if (!arc) return;
    var C = 2 * Math.PI * 104;
    arc.setAttribute("stroke-dashoffset", String(C * (1 - Math.max(0, R.left) / Math.max(S.timer, R.left, 1))));
    arc.setAttribute("stroke", R.left <= 10 ? "#e0283c" : "#f5b82e");
    document.getElementById("tt").textContent = fmt(R.left);
    document.getElementById("ts").textContent = R.left <= 0 ? "time’s up!" : R.running ? "discuss" : "paused";
    var pb = document.getElementById("pausebtn");
    if (pb) pb.textContent = R.running ? "⏸ Pause" : "▶ Resume";
  }
  function startTimer() {
    if (!S.timer) return;
    stopTimer();
    R.running = true;
    var last = Date.now();
    timerInt = setInterval(function () {
      var now = Date.now(); R.left -= (now - last) / 1000; last = now;
      if (R.left <= 10 && R.left > 0 && Math.ceil(R.left) !== R.lastTick) { R.lastTick = Math.ceil(R.left); beep([880], 0.08); }
      if (R.left <= 0) {
        R.left = 0; stopTimer(); R.running = false;
        vibrate([300, 120, 300, 120, 500]); beep([660, 520, 400], 0.25);
        toast("⏰ Time’s up! సమయం అయిపోయింది — vote now");
      }
      syncTimer();
    }, 250);
  }
  function stopTimer() { if (timerInt) clearInterval(timerInt); timerInt = null; }

  function vVote() {
    var grid = R.players.map(function (p, i) {
      return '<button class="vote' + (R.voted === i ? " sel" : "") + '" data-act="pickvote" data-i="' + i + '">' + avatar(p, i) + esc(p) + "</button>";
    }).join("");
    return '<div class="top"><button class="iconbtn" data-act="back-discuss">←</button><h2>Who is the imposter?</h2></div>' +
      '<p class="muted center" style="margin:0">Everyone points on 3… 1, 2, 3! 👉<br><span class="te dim">ఇంపోస్టర్ ఎవరు? అందరూ ఒకేసారి చూపించండి</span></p>' +
      '<div class="votegrid">' + grid + "</div>" +
      '<div class="sticky"><button class="btn red" data-act="reveal"' + (R.voted == null ? " disabled" : "") + ">" +
      (R.voted == null ? "Tap the player with most votes" : "Reveal " + esc(R.players[R.voted]) + "! 😱") + "</button></div>";
  }

  function award(team, pts) {
    R.gained = {};
    R.players.forEach(function (p, i) {
      if ((team === "imp") === isImp(i)) { S.scores[p] = (S.scores[p] || 0) + pts; R.gained[p] = pts; }
      else if (!(p in S.scores)) S.scores[p] = 0;
    });
    save();
  }

  function guessOptions() {
    if (R.options) return R.options;
    var others = shuffle(R.pack.words.filter(function (w) { return w[0] !== R.word[0]; })).slice(0, 7);
    R.options = shuffle(others.concat([R.word]));
    return R.options;
  }

  function impNames() { return R.imps.map(function (j) { return esc(R.players[j]); }).join(" & "); }

  function vResult() {
    var v = R.voted, vn = esc(R.players[v]);
    var caught = isImp(v);
    var html = "";
    if (caught && R.guess == null) {
      var opts = guessOptions().map(function (w, k) {
        return '<button data-act="guess" data-k="' + k + '">' + esc(w[0]) + (S.telugu && w[1] ? "<small class=\"te\">" + esc(w[1]) + "</small>" : "") + "</button>";
      }).join("");
      return '<div class="verdict"><div class="emoji">🎯</div><h1>Caught!</h1><div class="te">దొరికిపోయావ్!</div>' +
        "<p><b>" + vn + "</b> was " + (R.imps.length > 1 ? "an" : "the") + " imposter!</p></div>" +
        '<div class="card"><h3>Last chance, ' + vn + "!</h3>" +
        '<p class="muted" style="margin-top:0">Guess the secret word. Get it right and the imposter' + (R.imps.length > 1 ? "s" : "") + " still win!</p>" +
        '<div class="guessgrid">' + opts + "</div></div>";
    }
    var title, te, emoji, sub;
    if (R.outcome === "civ") { emoji = "🎉"; title = "Keka! Family wins!"; te = "కేక! మనవాళ్ళు గెలిచారు!"; sub = vn + " was caught and couldn’t guess the word."; }
    else if (R.outcome === "impguess") { emoji = "🦊"; title = "Sneaky imposter!"; te = "అబ్బా! భలే తెలివి!"; sub = vn + " was caught… but guessed the word!"; }
    else { emoji = "😈"; title = "Ayyo! Imposter escaped!"; te = "అయ్యో! ఇంపోస్టర్ తప్పించుకున్నారు!"; sub = vn + " was innocent! The imposter was <b>" + impNames() + "</b>."; }
    if (R.outcome !== "imp" && R.imps.length > 1) sub += " Imposters: <b>" + impNames() + "</b>.";
    html += '<div class="verdict"><div class="emoji">' + emoji + "</div><h1>" + title + '</h1><div class="te">' + te + "</div><p>" + sub + "</p></div>";
    html += '<div class="reveal-word"><div class="dim" style="color:#7a4a3a">' + R.pack.emoji + " " + esc(R.pack.name) + ' · the secret word was</div><div class="word">' + esc(R.word[0]) + "</div>" +
      (S.telugu && R.word[1] ? '<div class="wordte te">' + esc(R.word[1]) + "</div>" : "") +
      (R.mode === "undercover" ? '<div class="dim" style="color:#7a4a3a;margin-top:6px">Imposter’s word: <b>' + esc(R.decoy[0]) + "</b></div>" : "") + "</div>";
    html += scoreList(true);
    html += '<div class="sticky"><button class="btn" data-act="start">🔁 &nbsp;Next Round</button>' +
      '<div class="row" style="margin-top:10px"><button class="btn ghost" data-act="setup">⚙️ Change setup</button><button class="btn ghost" data-act="home">🏠 Home</button></div></div>';
    return html;
  }

  function scoreList(showGain) {
    var names = Object.keys(S.scores).sort(function (a, b) { return S.scores[b] - S.scores[a]; });
    if (!names.length) return '<p class="muted center">No scores yet — play a round!</p>';
    var medals = ["🥇", "🥈", "🥉"];
    var top = S.scores[names[0]];
    return '<div class="card"><h3>Scoreboard <small>' + S.rounds + " rounds</small></h3><div class=\"scores\">" + names.map(function (n, k) {
      var i = (R && R.players.indexOf(n) >= 0) ? R.players.indexOf(n) : S.players.indexOf(n);
      var g = showGain && R && R.gained[n];
      var imp = showGain && R && isImp(R.players.indexOf(n));
      return '<div class="score"><span class="medal">' + (S.scores[n] > 0 && S.scores[n] === top ? "👑" : (medals[k] || "")) + "</span>" + avatar(n, i < 0 ? k : i) +
        '<span class="n">' + esc(n) + "</span>" + (imp ? '<span class="tag">imposter</span>' : "") +
        (g ? '<span class="plus">+' + g + "</span>" : "") + '<span class="p">' + S.scores[n] + "</span></div>";
    }).join("") + "</div></div>";
  }

  function vScores() {
    return '<div class="top"><button class="iconbtn" data-act="home">←</button><h2>Scoreboard 🏆</h2></div>' + scoreList(false) +
      '<p class="dim center">Family wins: +1 each · Imposter escapes: +2 · Caught but guesses the word: +1</p>' +
      '<div class="sticky"><button class="btn" data-act="setup">🎲 Play</button><button class="btn ghost" style="margin-top:10px" data-act="resetscores">Reset scores</button></div>';
  }

  /* ---------- modals ---------- */
  var modalOpen = false;
  function openModal(html) { $sheet.innerHTML = html; $modal.classList.remove("hidden"); modalOpen = true; }
  function closeModal() { $modal.classList.add("hidden"); modalOpen = false; }
  $modal.addEventListener("click", function (e) { if (e.target === $modal) closeModal(); });

  function howTo() {
    openModal("<h2>📜 How to play</h2><ol>" +
      "<li><b>Add players</b> sitting in a circle and pick categories.</li>" +
      "<li><b>Pass the phone.</b> Everyone secretly sees the same word — except the <b>imposter</b>, who only knows they’re the imposter.</li>" +
      "<li><b>Give clues.</b> Starting with the chosen player, each person says one word related to the secret word. Not too obvious!</li>" +
      "<li><b>Vote.</b> Everyone points at who they think the imposter is. Tap the player with the most votes.</li>" +
      "<li>If the imposter is caught they get <b>one last guess</b> at the word. Guess right and they still win!</li></ol>" +
      "<h2 style=\"margin-top:14px\">🎭 Modes</h2><ul><li><b>Classic</b> — imposter sees the category.</li><li><b>Hard</b> — imposter gets nothing at all.</li>" +
      "<li><b>Undercover</b> — imposter gets a <i>different</i> word from the same category and doesn’t even know they’re the imposter! 🤯</li></ul>" +
      '<p class="muted">Example: word is <b>Pulihora</b>. Good clues: “temple”, “yellow”, “Sunday”. Bad clue: “tamarind rice” 😅</p>' +
      '<div class="acts"><button class="btn" data-act="close">Sare! Got it 👍</button></div>');
  }

  function editCustom() {
    openModal("<h2>✍️ My Words</h2><p class=\"muted\">One per line (or comma separated). Add Telugu after a <b>|</b> — e.g. <span class=\"te\">Ammamma’s Pickle | అమ్మమ్మ ఊరగాయ</span>. Great for family inside jokes!</p>" +
      '<textarea id="customtxt" placeholder="Bujji Babu&#10;Chinna Mama\'s Bike&#10;Our Kakinada Trip">' + esc(S.custom) + "</textarea>" +
      '<div class="acts"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="savecustom">Save</button></div>');
  }

  function confirmQuit() {
    openModal("<h2>Quit this round?</h2><p class=\"muted\">The secret word will be lost. Scores are kept.</p>" +
      '<div class="acts"><button class="btn ghost" data-act="close">Keep playing</button><button class="btn red" data-act="doquit">Quit</button></div>');
  }

  /* ---------- events ---------- */
  function readPlayerInputs() {
    var ins = $app.querySelectorAll("input[data-pi]");
    for (var i = 0; i < ins.length; i++) S.players[+ins[i].getAttribute("data-pi")] = ins[i].value;
  }
  function addPlayer() {
    var inp = document.getElementById("newp");
    var v = inp && inp.value.trim();
    if (!v) { inp && inp.focus(); return; }
    readPlayerInputs();
    if (S.players.length >= 20) { toast("Max 20 players"); return; }
    if (S.players.some(function (p) { return p.trim().toLowerCase() === v.toLowerCase(); })) { toast(v + " is already playing"); return; }
    S.players.push(v); save(); render();
    var n = document.getElementById("newp"); if (n) n.focus();
  }

  document.addEventListener("input", function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute("data-pi")) { S.players[+e.target.getAttribute("data-pi")] = e.target.value; save(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute("data-pi") && screen === "setup") render();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "newp") { e.preventDefault(); addPlayer(); }
  });

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    var a = el.getAttribute("data-act");
    if (screen === "setup") readPlayerInputs();
    switch (a) {
      case "home": go("home"); break;
      case "setup": go("setup"); break;
      case "scores": go("scores"); break;
      case "how": howTo(); break;
      case "close": closeModal(); break;
      case "addp": addPlayer(); break;
      case "delp":
        S.players.splice(+el.getAttribute("data-i"), 1); save(); render(); break;
      case "pack": {
        var id = el.getAttribute("data-id"), k = S.packs.indexOf(id);
        if (id === CUSTOM_ID && k < 0) { S.packs.push(id); save(); render(); editCustom(); break; }
        if (k >= 0) S.packs.splice(k, 1); else S.packs.push(id);
        save(); render(); break;
      }
      case "allpacks":
        S.packs = S.packs.length >= allPacks().length - 1 ? [] : PACKS.map(function (p) { return p.id; });
        save(); render(); break;
      case "editcustom": editCustom(); break;
      case "savecustom":
        S.custom = document.getElementById("customtxt").value;
        if (customPack().words.length < 2) { var ci = S.packs.indexOf(CUSTOM_ID); if (ci >= 0) S.packs.splice(ci, 1); toast("Add at least 2 words"); }
        save(); closeModal(); render(); break;
      case "imp": {
        var mx = maxImposters(Math.max(3, cleanPlayers().length));
        S.imposters = Math.min(mx, Math.max(1, S.imposters + +el.getAttribute("data-d")));
        save(); render(); break;
      }
      case "set": {
        var key = el.getAttribute("data-k"), val = el.getAttribute("data-v");
        S[key] = key === "timer" ? +val : val; save(); render(); break;
      }
      case "toggle": { var tk = el.getAttribute("data-k"); S[tk] = !S[tk]; save(); render(); break; }
      case "start": closeModal(); startRound(); break;
      case "iam": R.phase = "card"; R.open = false; render(); break;
      case "flip":
        if (!R.open) { R.open = true; vibrate(30); beep([520, 780], 0.09); render(); } break;
      case "hide":
        R.open = false; R.idx++; R.phase = "pass";
        if (R.idx >= R.players.length) { R.left = S.timer; go("discuss"); startTimer(); beep([400, 600, 800], 0.12); }
        else render();
        break;
      case "pause": if (R.running) { stopTimer(); R.running = false; syncTimer(); } else if (R.left > 0) startTimer(); break;
      case "more": R.left += 30; if (!R.running) startTimer(); syncTimer(); break;
      case "tovote": go("vote"); break;
      case "back-discuss": go("discuss"); if (R.left > 0 && S.timer) startTimer(); break;
      case "pickvote": R.voted = +el.getAttribute("data-i"); vibrate(15); render(); break;
      case "reveal":
        if (isImp(R.voted)) { R.guess = null; beep([500, 700, 900], 0.12); }
        else { R.outcome = "imp"; award("imp", 2); vibrate([200, 100, 200]); beep([500, 380, 260], 0.22); }
        go("result"); break;
      case "guess": {
        var k2 = +el.getAttribute("data-k"), w = guessOptions()[k2];
        R.guess = w[0];
        var right = w[0] === R.word[0];
        var btns = $app.querySelectorAll("[data-act=guess]");
        for (var b = 0; b < btns.length; b++) { btns[b].disabled = true; if (guessOptions()[b][0] === R.word[0]) btns[b].className = "right"; }
        if (!right) el.className = "wrong";
        if (right) { R.outcome = "impguess"; award("imp", 1); beep([500, 380, 260], 0.2); }
        else { R.outcome = "civ"; award("civ", 1); vibrate([80, 60, 80]); beep([523, 659, 784, 1046], 0.13); }
        setTimeout(function () { render(); window.scrollTo(0, 0); }, 1100);
        break;
      }
      case "quit": confirmQuit(); break;
      case "doquit": closeModal(); R = null; go("home"); break;
      case "resetscores": S.scores = {}; S.rounds = 0; save(); render(); toast("Scores reset"); break;
    }
  });

  /* Android back button: return true if handled. */
  window.appBack = function () {
    if (modalOpen) { closeModal(); return true; }
    if (screen === "home") return false;
    if (screen === "setup" || screen === "scores" || screen === "result") { go("home"); return true; }
    if (screen === "vote") { go("discuss"); if (R.left > 0 && S.timer) startTimer(); return true; }
    confirmQuit(); return true;
  };

  render();
})();
