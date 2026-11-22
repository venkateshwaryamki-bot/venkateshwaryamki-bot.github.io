/* Little Stars — trace, play & learn for nursery / LKG kids. No build step, no network needed. */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const app = $('#app');
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ------------------------------------------------------------------ data */
const WORDS = {
  A: ['Apple', '🍎'], B: ['Ball', '⚽'], C: ['Cat', '🐱'], D: ['Dog', '🐶'], E: ['Elephant', '🐘'],
  F: ['Fish', '🐟'], G: ['Grapes', '🍇'], H: ['House', '🏠'], I: ['Ice cream', '🍦'], J: ['Juice', '🧃'],
  K: ['Kite', '🪁'], L: ['Lion', '🦁'], M: ['Mango', '🥭'], N: ['Nose', '👃'], O: ['Orange', '🍊'],
  P: ['Parrot', '🦜'], Q: ['Queen', '👸'], R: ['Rabbit', '🐰'], S: ['Sun', '☀️'], T: ['Tiger', '🐯'],
  U: ['Umbrella', '☂️'], V: ['Van', '🚐'], W: ['Watch', '⌚'], X: ['X-mas tree', '🎄'], Y: ['Yo-yo', '🪀'], Z: ['Zebra', '🦓'],
};
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const COUNT_EMO = ['🍎', '🐥', '⭐', '🎈', '🍌', '🐟', '🌸', '🚗', '🍓', '🦋', '🐞', '🧁'];
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER = UPPER.map((c) => c.toLowerCase());
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const SETS = {
  upper: { title: 'ABC', name: 'Big Letters', items: UPPER, color: '#ff6fa5', tile: 'pink' },
  lower: { title: 'abc', name: 'Small Letters', items: LOWER, color: '#4cb8ff', tile: 'blue' },
  num: { title: '123', name: 'Numbers', items: NUMBERS, color: '#f39c12', tile: 'yellow' },
};
const AVATARS = ['🐯', '🐼', '🐰', '🦊', '🐨', '🐸', '🦁', '🐵', '🐶', '🐱', '🐧', '🦄'];
const RANKS = [
  { at: 0, e: '🥚', n: 'Little Egg' },
  { at: 10, e: '🐣', n: 'Baby Chick' },
  { at: 30, e: '🐥', n: 'Happy Birdie' },
  { at: 60, e: '🐰', n: 'Busy Bunny' },
  { at: 100, e: '🦊', n: 'Clever Fox' },
  { at: 160, e: '🐼', n: 'Smart Panda' },
  { at: 240, e: '🦁', n: 'Brave Lion' },
  { at: 340, e: '🦄', n: 'Magic Unicorn' },
  { at: 460, e: '🚀', n: 'Rocket Star' },
  { at: 600, e: '👑', n: 'Super Star King' },
];
const STICKERS = ['🌈', '🍭', '🚂', '🐳', '🌻', '🎂', '🦖', '🚁', '🍉', '🐙', '🎠', '🏰', '🦋', '🍩', '🚜', '🐢', '🎸', '🌙', '🦒', '🍦', '⛵', '🐝', '🎪', '🪐', '🦩', '🍕', '🏆', '🐲', '💎', '🌟'];
const STICKER_EVERY = 15;
const CRAYONS = ['#7c5cff', '#ff4f8b', '#ff9a3c', '#2fbf71', '#2b9be0', '#3a2e5c'];
const MODES = {
  easy: { label: '✏️ Easy', hint: 'Colour inside the letter!' },
  dots: { label: '••• Dots', hint: 'Follow the dots!' },
  magic: { label: '✨ Magic', hint: 'Look… then write it yourself!' },
};
const PRAISE = {
  3: ['Superstar!', 'Wow, perfect!', 'Amazing!', 'Fantastic!'],
  2: ['Great job!', 'Very good!', 'Well done!'],
  1: ['Good try!', 'Nice work!', 'Keep going!'],
};

/* ----------------------------------------------------------------- state */
const KEY = 'littlestars.v1';
let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.profiles)) return Object.assign({ sound: true, voice: true, mode: 'easy' }, s); } catch (e) { /* ignore */ }
  return { profiles: [], current: null, sound: true, voice: true, mode: 'easy' };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
function me() { return S.profiles.find((p) => p.id === S.current) || null; }
function rankOf(stars) { let r = RANKS[0]; for (const x of RANKS) if (stars >= x.at) r = x; return r; }
function nextRank(stars) { return RANKS.find((x) => x.at > stars) || null; }
function stickerCount(stars) { return Math.min(STICKERS.length, Math.floor(stars / STICKER_EVERY)); }
function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function boardPos(p) { const sorted = S.profiles.slice().sort((a, b) => b.stars - a.stars); return sorted.findIndex((x) => x.id === p.id) + 1; }

/** Give stars to the current child; returns a list of celebrations (rank up, sticker). */
function addStars(n) {
  const p = me(); if (!p || n <= 0) return [];
  const before = p.stars;
  p.stars += n;
  if (p.lastDay !== today()) { p.lastDay = today(); p.days = (p.days || 0) + 1; }
  save();
  const out = [];
  const r0 = rankOf(before), r1 = rankOf(p.stars);
  if (r1 !== r0) out.push({ type: 'rank', rank: r1 });
  const s0 = stickerCount(before), s1 = stickerCount(p.stars);
  for (let i = s0; i < s1; i++) out.push({ type: 'sticker', sticker: STICKERS[i] });
  return out;
}

/* ----------------------------------------------------------------- sound */
let AC = null;
function actx() {
  if (!S.sound) return null;
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(freq, dur, type = 'sine', vol = 0.18, delay = 0, slideTo = 0) {
  const a = actx(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  tap() { tone(620, 0.07, 'triangle', 0.12); },
  pop() { tone(1200, 0.12, 'square', 0.08, 0, 180); tone(500, 0.08, 'triangle', 0.12, 0.02); },
  good() { tone(660, 0.12, 'triangle', 0.18); tone(990, 0.2, 'triangle', 0.18, 0.1); },
  bad() { tone(260, 0.22, 'triangle', 0.14, 0, 170); },
  star(i) { tone(700 + i * 220, 0.22, 'sine', 0.2); tone(1400 + i * 440, 0.12, 'sine', 0.06); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.18, i * 0.12)); tone(1319, 0.5, 'sine', 0.14, 0.5); },
  draw() { tone(300 + Math.random() * 200, 0.03, 'sine', 0.02); },
};

/* ---------------------------------------------------------------- speech */
let VOICE = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices(); if (!vs.length) return;
  VOICE = vs.find((v) => /en[-_]IN/i.test(v.lang)) ||
    vs.find((v) => /^en/i.test(v.lang) && /female|samantha|karen|moira|tessa|zira|google uk english female|google us/i.test(v.name)) ||
    vs.find((v) => /^en/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text) {
  if (!S.voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (VOICE) { u.voice = VOICE; u.lang = VOICE.lang; } else u.lang = 'en-IN';
    u.rate = 0.85; u.pitch = 1.2;
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
/** How a symbol should be read out loud. */
function spoken(ch) {
  if (/^\d+$/.test(ch)) return NUM_WORDS[+ch] || ch;
  const up = ch.toUpperCase();
  const name = up === 'A' ? 'ay' : up;
  return ch === up ? name : 'small ' + name;
}
function describe(ch) {
  if (/^\d+$/.test(ch)) return `${NUM_WORDS[+ch]}`;
  const [w] = WORDS[ch.toUpperCase()];
  return `${spoken(ch)} for ${w}`;
}

/* -------------------------------------------------------------- confetti */
const cv = $('#confetti'); const cx = cv.getContext('2d');
let bits = [], confRaf = 0;
function confetti(count = 120) {
  cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
  const colors = ['#ff6fa5', '#7c5cff', '#ffc93c', '#4cb8ff', '#39d98a', '#ff9a3c'];
  for (let i = 0; i < count; i++) {
    bits.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 4, r: Math.random() * 6 + 4, c: pick(colors), a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, life: 1 });
  }
  if (!confRaf) confRaf = requestAnimationFrame(tickConf);
}
function tickConf() {
  const d = devicePixelRatio; cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
  bits = bits.filter((b) => b.y < innerHeight + 30 && b.life > 0);
  for (const b of bits) {
    b.vy += 0.45; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.a += b.va; b.life -= 0.006;
    cx.save(); cx.translate(b.x, b.y); cx.rotate(b.a); cx.fillStyle = b.c; cx.globalAlpha = Math.min(1, b.life * 2);
    cx.fillRect(-b.r, -b.r / 2, b.r * 2, b.r); cx.restore();
  }
  confRaf = bits.length ? requestAnimationFrame(tickConf) : 0;
  if (!bits.length) cx.clearRect(0, 0, innerWidth, innerHeight);
}

/* ---------------------------------------------------------------- popups */
const popRoot = $('#popup-root');
function popup(html, onMount) {
  closePopup();
  popRoot.innerHTML = `<div class="overlay"><div class="pop">${html}</div></div>`;
  const el = $('.pop', popRoot);
  el.classList.add('arming'); setTimeout(() => el.classList.remove('arming'), 900);
  if (onMount) onMount(el);
  return el;
}
function closePopup() { popRoot.innerHTML = ''; }
/** Show rank-up / sticker celebrations one after another, then run done(). */
function celebrate(list, done) {
  if (!list.length) { done && done(); return; }
  const [c, ...rest] = list;
  sfx.win(); confetti(160);
  const html = c.type === 'rank'
    ? `<div class="big-emo">${c.rank.e}</div><h2>New rank!</h2><p>You are now a <b>${c.rank.n}</b>!</p><div class="acts"><button class="btn big" data-ok>Yay! 🎉</button></div>`
    : `<div class="big-emo">${c.sticker}</div><h2>New sticker!</h2><p>A new sticker for your sticker book!</p><div class="acts"><button class="btn big pink" data-ok>Cool! ✨</button></div>`;
  say(c.type === 'rank' ? `Hooray! You are now a ${c.rank.n}!` : 'You got a new sticker!');
  popup(html, (el) => { $('[data-ok]', el).onclick = () => { sfx.tap(); closePopup(); celebrate(rest, done); }; });
}
function starsRow(n, max = 3) { let s = ''; for (let i = 0; i < max; i++) s += i < n ? '<b>★</b>' : '★'; return s; }

/* ---------------------------------------------------------------- router */
let cleanups = [];
let backFn = null;
function onCleanup(f) { cleanups.push(f); }
function go(name, ...args) {
  cleanups.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
  cleanups = []; backFn = null;
  closePopup();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  SCREENS[name](...args);
  window.scrollTo(0, 0);
}
function setBack(fn) {
  backFn = fn;
  const b = $('[data-back]', app);
  if (b) b.onclick = () => { sfx.tap(); fn(); };
}
// Hardware / gesture back button goes "up" one screen instead of leaving the app.
history.replaceState({ ls: 0 }, ''); history.pushState({ ls: 1 }, '');
addEventListener('popstate', () => {
  history.pushState({ ls: 1 }, '');
  if (popRoot.innerHTML) { closePopup(); return; }
  if (backFn) backFn();
});

const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  speak: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  clear: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
};
const backBtn = () => `<button class="round" data-back aria-label="Back">${ICON.back}</button>`;

/* --------------------------------------------------------------- screens */
const SCREENS = {};

/* Who's playing? */
SCREENS.who = function () {
  const kids = S.profiles.map((p) => {
    const r = rankOf(p.stars);
    return `<button class="kid" data-id="${p.id}"><div class="av">${p.avatar}</div><div class="nm">${esc(p.name)}</div><div class="st">⭐ ${p.stars} · ${r.e}</div></button>`;
  }).join('');
  app.innerHTML = `<div class="screen">
    <div class="hero"><h1 class="logo"><span class="l1">Little</span> <span class="l2">Stars</span> <span class="star">⭐</span></h1>
    <div class="tag">Trace · Play · Learn ABC &amp; 123</div></div>
    <div class="bubble"><div class="mascot">🦉</div><div class="say">${S.profiles.length ? 'Who is playing today?' : 'Hello! Let’s make your star card!'}</div></div>
    <div class="kids">${kids}<button class="kid add" data-add><div class="av">＋</div><div class="nm">Add child</div></button></div>
    <div class="settings">
      <button class="toggle ${S.sound ? '' : 'off'}" data-t="sound">🔊 Sounds</button>
      <button class="toggle ${S.voice ? '' : 'off'}" data-t="voice">🗣️ Voice</button>
    </div>
    <div class="foot">Works offline · progress is saved on this device</div>
  </div>`;
  $$('.kid[data-id]', app).forEach((b) => b.onclick = () => { sfx.tap(); S.current = b.dataset.id; save(); const p = me(); say(`Hello ${p.name}!`); go('home'); });
  $('[data-add]', app).onclick = () => { sfx.tap(); go('newKid'); };
  $$('[data-t]', app).forEach((b) => b.onclick = () => { S[b.dataset.t] = !S[b.dataset.t]; save(); sfx.tap(); go('who'); });
  if (!S.profiles.length) setTimeout(() => say('Hello! Let us make your star card!'), 400);
};

/* New child */
SCREENS.newKid = function () {
  let av = AVATARS[S.profiles.length % AVATARS.length];
  app.innerHTML = `<div class="screen">
    <div class="bar">${backBtn()}<h1>New Star Card</h1><div class="spacer"></div></div>
    <div class="panel">
      <h2>What’s your name?</h2>
      <input class="field" id="nm" maxlength="16" placeholder="Name" autocomplete="off" />
      <h2 style="margin-top:20px">Pick your buddy!</h2>
      <div class="avgrid">${AVATARS.map((a) => `<button data-av="${a}" class="${a === av ? 'on' : ''}">${a}</button>`).join('')}</div>
      <button class="btn big green" id="go" style="width:100%">Let’s go! 🚀</button>
    </div></div>`;
  setBack(() => go('who'));
  $$('[data-av]', app).forEach((b) => b.onclick = () => { av = b.dataset.av; $$('[data-av]', app).forEach((x) => x.classList.toggle('on', x === b)); sfx.pop(); });
  const nm = $('#nm');
  $('#go').onclick = () => {
    const name = nm.value.trim();
    if (!name) { nm.focus(); nm.style.borderColor = '#ff6fa5'; sfx.bad(); return; }
    const p = { id: 'k' + Date.now().toString(36), name, avatar: av, stars: 0, best: {}, tries: {}, games: {}, days: 0, created: Date.now() };
    S.profiles.push(p); S.current = p.id; save();
    sfx.win(); confetti(); say(`Welcome ${name}! Let us learn and play!`);
    go('home');
  };
  nm.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#go').click(); });
};

/* Home */
SCREENS.home = function () {
  const p = me(); if (!p) return go('who');
  const r = rankOf(p.stars);
  const done = (k) => SETS[k].items.filter((c) => (p.best[k + ':' + c] || 0) > 0).length;
  const tile = (k) => { const s = SETS[k]; const d = done(k); return `<button class="tile ${s.tile}" data-set="${k}"><div class="big">${s.title}</div><div class="t">Trace ${s.name}</div><div class="s">${d} / ${s.items.length} done</div><div class="bar-p"><i style="width:${(d / s.items.length) * 100}%"></i></div></button>`; };
  const pos = S.profiles.length > 1 ? `<span class="chip">${['🥇', '🥈', '🥉'][boardPos(p) - 1] || '🏅'} #${boardPos(p)}</span>` : '';
  app.innerHTML = `<div class="screen">
    <div class="homehead">
      <button class="who" data-switch><span class="av">${p.avatar}</span><span class="nm">${esc(p.name)}</span></button>
      <div class="grow"></div>
      <span class="chip">⭐ ${p.stars}</span><span class="chip">${r.e} ${r.n}</span>${pos}
    </div>
    <div class="bubble"><div class="mascot">🦉</div><div class="say">${pick(['What shall we do today?', 'Let’s practise writing!', 'Ready to earn stars?', 'You are doing great!'])}</div></div>
    <div class="tiles">
      ${tile('upper')}${tile('lower')}${tile('num')}
      <button class="tile green" data-games><div class="emo">🎈🧩</div><div class="t">Fun Games</div><div class="s">Pop, count, match &amp; more</div></button>
      <button class="tile" data-trophy><div class="emo">🏆</div><div class="t">My Stars</div><div class="s">Rank, stickers &amp; star board</div></button>
    </div>
  </div>`;
  $$('[data-set]', app).forEach((b) => b.onclick = () => { sfx.tap(); go('grid', b.dataset.set); });
  $('[data-games]', app).onclick = () => { sfx.tap(); go('games'); };
  $('[data-trophy]', app).onclick = () => { sfx.tap(); go('trophy'); };
  $('[data-switch]', app).onclick = () => { sfx.tap(); go('who'); };
  setBack(() => go('who'));
};

/* Letter / number grid */
SCREENS.grid = function (setKey) {
  const p = me(); const set = SETS[setKey];
  const cells = set.items.map((c, i) => {
    const b = p.best[setKey + ':' + c] || 0;
    return `<button class="cell ${b ? 'done' : ''}" data-i="${i}" style="--c:${set.color}"><span class="ch">${c}</span><span class="stars">${starsRow(b)}</span></button>`;
  }).join('');
  app.innerHTML = `<div class="screen">
    <div class="bar">${backBtn()}<h1>Trace ${set.name}</h1><span class="chip">⭐ ${p.stars}</span></div>
    <div class="modes">${Object.entries(MODES).map(([k, m]) => `<button data-m="${k}" class="${S.mode === k ? 'on' : ''}">${m.label}</button>`).join('')}</div>
    <div class="grid">${cells}</div>
  </div>`;
  setBack(() => go('home'));
  $$('[data-m]', app).forEach((b) => b.onclick = () => { S.mode = b.dataset.m; save(); sfx.tap(); $$('[data-m]', app).forEach((x) => x.classList.toggle('on', x === b)); say(MODES[S.mode].hint); });
  $$('[data-i]', app).forEach((b) => b.onclick = () => { sfx.tap(); go('trace', setKey, +b.dataset.i); });
};

/* ------------------------------------------------------- tracing engine */
const GLYPH_FONT = '"Andika", "Fredoka", sans-serif';
/** Draw `ch` into ctx (in an S×S box). extra = outline thickness added around the glyph. */
function glyphMetrics(ctx, ch, size) {
  let fs = size * 0.78;
  ctx.font = `700 ${fs}px ${GLYPH_FONT}`;
  const w = ctx.measureText(ch).width;
  if (w > size * 0.84) fs *= (size * 0.84) / w;
  ctx.font = `700 ${fs}px ${GLYPH_FONT}`;
  const cap = ctx.measureText('H').actualBoundingBoxAscent || fs * 0.68;
  const xh = ctx.measureText('x').actualBoundingBoxAscent || fs * 0.48;
  const base = size * 0.47 + cap * 0.5;
  return { fs, base, cap, xh };
}
function drawGlyph(ctx, ch, size, extra, style) {
  const m = glyphMetrics(ctx, ch, size);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = style; ctx.strokeStyle = style;
  ctx.fillText(ch, size / 2, m.base);
  if (extra > 0) { ctx.lineWidth = extra; ctx.strokeText(ch, size / 2, m.base); }
  return m;
}
function maskOf(drawFn, N) {
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d', { willReadFrequently: true });
  drawFn(g);
  const d = g.getImageData(0, 0, N, N).data;
  const m = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
  return m;
}

SCREENS.trace = function (setKey, idx) {
  const p = me(); const set = SETS[setKey];
  const ch = set.items[idx];
  const mode = S.mode || 'easy';
  const isNum = setKey === 'num';
  const word = isNum ? null : WORDS[ch.toUpperCase()];
  const label = isNum ? `${ch} — ${NUM_WORDS[+ch]}` : `${ch} for ${word[0]}`;
  const emo = isNum ? (+ch === 0 ? '⭕' : COUNT_EMO[+ch % COUNT_EMO.length].repeat(Math.min(+ch, 5))) : word[1];
  let color = S.crayon || CRAYONS[0];

  app.innerHTML = `<div class="screen trace">
    <div class="bar">${backBtn()}<div class="tword"><span class="e">${emo}</span><span class="w">${esc(label)}</span></div>
      <button class="round" data-say aria-label="Hear it">${ICON.speak}</button></div>
    <div class="stage">
      <button class="round" data-prev aria-label="Previous">${ICON.prev}</button>
      <div class="board" id="board"><canvas class="guide" id="gc"></canvas><canvas id="ic"></canvas><div class="meter"><i id="meter"></i></div></div>
      <button class="round" data-next aria-label="Next">${ICON.next}</button>
    </div>
    <div class="tools">
      <div class="crayons">${CRAYONS.map((c) => `<button data-c="${c}" style="--c:${c}" class="${c === color ? 'on' : ''}" aria-label="Crayon"></button>`).join('')}</div>
      <button class="round" data-clear aria-label="Clear">${ICON.clear}</button>
      ${mode === 'magic' ? `<button class="round" data-peek aria-label="Peek">${ICON.eye}</button>` : ''}
      <button class="btn green big" data-done>Done ✓</button>
    </div>
  </div>`;
  setBack(() => go('grid', setKey));

  const board = $('#board'), gc = $('#gc'), ic = $('#ic'), meter = $('#meter');
  const gctx = gc.getContext('2d'), ictx = ic.getContext('2d');
  const N = 140; // analysis resolution
  let size = 300, dpr = 1;
  let strokes = [];  // [{c, pts:[[x,y] normalised]}]
  let cur = null, activeId = null;
  let tMask, dMask, tCount = 1;
  let finished = false, magicTimer = 0, lastSpark = 0, lastTick = 0;

  function layout() {
    const stage = $('.stage', app);
    const arrows = innerWidth > 560 ? 150 : 0;
    size = Math.floor(Math.max(200, Math.min(stage.clientWidth - arrows, stage.clientHeight - 4, 720)));
    dpr = Math.min(3, devicePixelRatio || 1);
    board.style.width = board.style.height = size + 'px';
    for (const c of [gc, ic]) { c.width = c.height = Math.round(size * dpr); }
    drawGuide(); redrawInk();
  }
  function drawGuide() {
    const g = gctx; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, size, size);
    const m = glyphMetrics(g, ch, size);
    // notebook writing lines
    g.lineWidth = 2; g.strokeStyle = '#d8cffa';
    const line = (y, dash) => { g.setLineDash(dash ? [10, 10] : []); g.beginPath(); g.moveTo(16, y); g.lineTo(size - 16, y); g.stroke(); };
    line(m.base - m.cap, true); line(m.base - m.xh, true); g.strokeStyle = '#ffb3cd'; g.lineWidth = 3; line(m.base, false); g.setLineDash([]);
    const thick = m.fs * 0.05;
    if (mode === 'dots') {
      // dotted letter: dots laid out inside the glyph shape
      const o = document.createElement('canvas'); o.width = o.height = Math.round(size * dpr);
      const oc = o.getContext('2d'); oc.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGlyph(oc, ch, size, thick, '#000');
      oc.globalCompositeOperation = 'source-in';
      const step = Math.max(9, m.fs * 0.055), r = step * 0.3;
      oc.fillStyle = '#9b86ff'; oc.beginPath();
      for (let y = step / 2; y < size; y += step) for (let x = step / 2; x < size; x += step) { oc.moveTo(x + r, y); oc.arc(x, y, r, 0, 7); }
      oc.fill();
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(o, 0, 0);
    } else {
      // soft filled letter with an outline ring
      const o = document.createElement('canvas'); o.width = o.height = Math.round(size * dpr);
      const oc = o.getContext('2d'); oc.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGlyph(oc, ch, size, thick + 8, '#c9bcff');
      oc.globalCompositeOperation = 'destination-out'; drawGlyph(oc, ch, size, thick, '#000');
      oc.globalCompositeOperation = 'destination-over'; drawGlyph(oc, ch, size, thick, '#efeaff');
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(o, 0, 0);
    }
    // analysis masks (resolution independent)
    tMask = maskOf((c) => { c.scale(N / size, N / size); drawGlyph(c, ch, size, 0, '#000'); }, N);
    dMask = maskOf((c) => { c.scale(N / size, N / size); drawGlyph(c, ch, size, m.fs * 0.24, '#000'); }, N);
    tCount = Math.max(1, tMask.reduce((a, b) => a + b, 0));
    brush = m.fs * 0.125;
  }
  let brush = 30;
  function strokePath(c, s, scale) {
    c.strokeStyle = s.c; c.fillStyle = s.c; c.lineWidth = brush * scale; c.lineCap = 'round'; c.lineJoin = 'round';
    const pts = s.pts;
    if (pts.length === 1) { c.beginPath(); c.arc(pts[0][0] * size * scale, pts[0][1] * size * scale, brush * scale / 2, 0, 7); c.fill(); return; }
    c.beginPath(); c.moveTo(pts[0][0] * size * scale, pts[0][1] * size * scale);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * size * scale, pts[i][1] * size * scale);
    c.stroke();
  }
  function redrawInk() {
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0); ictx.clearRect(0, 0, size, size);
    for (const s of strokes) strokePath(ictx, s, 1);
  }
  function evaluate() {
    const u = maskOf((c) => { for (const s of strokes) strokePath(c, s, N / size); }, N);
    let hit = 0, ink = 0, inside = 0;
    for (let i = 0; i < N * N; i++) {
      if (u[i]) { ink++; if (dMask[i]) inside++; if (tMask[i]) hit++; }
    }
    const coverage = hit / tCount;
    const precision = ink ? inside / ink : 0;
    return { coverage, precision };
  }
  function updateMeter() {
    const { coverage, precision } = evaluate();
    meter.style.width = Math.min(100, (coverage / 0.85) * 100) + '%';
    return { coverage, precision };
  }

  function pos(e) { const r = ic.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }
  function sparkle(e) {
    const now = performance.now(); if (now - lastSpark < 90) return; lastSpark = now;
    const s = document.createElement('div'); s.className = 'spark'; s.textContent = pick(['✨', '⭐', '💫']);
    s.style.left = e.clientX - 11 + 'px'; s.style.top = e.clientY - 11 + 'px';
    s.style.setProperty('--dx', (Math.random() - 0.5) * 80 + 'px'); s.style.setProperty('--dy', -Math.random() * 60 - 20 + 'px');
    document.body.appendChild(s); setTimeout(() => s.remove(), 700);
  }
  ic.addEventListener('pointerdown', (e) => {
    if (finished || activeId !== null) return;
    e.preventDefault(); actx();
    activeId = e.pointerId; try { ic.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    cur = { c: color, pts: [pos(e)] }; strokes.push(cur);
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0); strokePath(ictx, cur, 1);
    if (mode === 'magic') gc.classList.add('hide');
  });
  ic.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeId || !cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs.length ? evs : [e]) {
      const pt = pos(ev), last = cur.pts[cur.pts.length - 1];
      ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ictx.strokeStyle = cur.c; ictx.lineWidth = brush; ictx.lineCap = 'round';
      ictx.beginPath(); ictx.moveTo(last[0] * size, last[1] * size); ictx.lineTo(pt[0] * size, pt[1] * size); ictx.stroke();
      cur.pts.push(pt);
    }
    sparkle(e);
    const now = performance.now(); if (now - lastTick > 120) { lastTick = now; sfx.draw(); }
  });
  const end = (e) => {
    if (e.pointerId !== activeId) return;
    activeId = null; cur = null;
    const r = updateMeter();
    if (r.coverage >= 0.86 && r.precision >= 0.7) setTimeout(() => { if (activeId === null) finish(); }, 450);
  };
  ic.addEventListener('pointerup', end); ic.addEventListener('pointercancel', end);

  function finish() {
    if (finished) return;
    const { coverage, precision } = evaluate();
    if (!strokes.length || coverage < 0.25) {
      board.classList.remove('wiggle'); void board.offsetWidth; board.classList.add('wiggle');
      sfx.bad(); say(strokes.length ? `Keep going! Trace all of ${spoken(ch)}.` : `Use your finger to trace ${spoken(ch)}!`);
      if (mode === 'magic') peek();
      return;
    }
    finished = true;
    // how much of the letter was traced × how neatly the ink stayed on the letter
    const q = Math.min(1, coverage / 0.85) * Math.pow(precision, 0.8);
    window.__lastTrace = { coverage, precision, q };
    const stars = q >= 0.78 ? 3 : q >= 0.55 ? 2 : 1;
    const bonus = mode === 'magic' && stars === 3 ? 1 : 0;
    const key = setKey + ':' + ch;
    const prevBest = p.best[key] || 0;
    p.best[key] = Math.max(prevBest, stars);
    p.tries[key] = (p.tries[key] || 0) + 1;
    p.lastPlayed = Date.now();
    const parties = addStars(stars + bonus);
    showResult(stars, bonus, parties);
  }
  function showResult(stars, bonus, parties) {
    const praise = pick(PRAISE[stars]);
    const snap = ic.toDataURL('image/png');
    const el = popup(`<h2>${praise}</h2>
      <div class="bigstars"><span>⭐</span><span>⭐</span><span>⭐</span></div>
      <img class="mini" src="${snap}" alt="Your writing" style="background:#f8f5ff">
      <p>${bonus ? '✨ Magic bonus: +1 star! ' : ''}You got <b>${stars + bonus}</b> star${stars + bonus > 1 ? 's' : ''}!</p>
      <div class="acts"><button class="btn white" data-again>↻ Again</button><button class="btn big" data-nx>Next ➜</button></div>`, (el) => {
      $('[data-again]', el).onclick = () => { sfx.tap(); go('trace', setKey, idx); };
      $('[data-nx]', el).onclick = () => { sfx.tap(); nextItem(); };
    });
    const spans = $$('.bigstars span', el);
    spans.forEach((s, i) => { if (i < stars) setTimeout(() => { s.classList.add('on'); sfx.star(i); }, 350 + i * 380); });
    setTimeout(() => {
      if (stars === 3) { confetti(); }
      say(`${praise} ${isNum ? describe(ch) : describe(ch)}!`);
      if (parties.length) setTimeout(() => celebrate(parties, () => showResult2(stars, bonus)), 1500);
    }, 350 + stars * 380);
  }
  // re-show result card (without re-awarding) after celebrations
  function showResult2(stars, bonus) {
    popup(`<h2>${pick(PRAISE[stars])}</h2><div class="bigstars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">⭐</span>`).join('')}</div>
      <p>You got <b>${stars + bonus}</b> star${stars + bonus > 1 ? 's' : ''}!</p>
      <div class="acts"><button class="btn white" data-again>↻ Again</button><button class="btn big" data-nx>Next ➜</button></div>`, (el) => {
      $('[data-again]', el).onclick = () => { sfx.tap(); go('trace', setKey, idx); };
      $('[data-nx]', el).onclick = () => { sfx.tap(); nextItem(); };
    });
  }
  function nextItem() { go('trace', setKey, (idx + 1) % set.items.length); }
  function peek() { gc.classList.remove('hide'); clearTimeout(magicTimer); magicTimer = setTimeout(() => gc.classList.add('hide'), 1400); }

  $$('[data-c]', app).forEach((b) => b.onclick = () => { color = S.crayon = b.dataset.c; save(); sfx.pop(); $$('[data-c]', app).forEach((x) => x.classList.toggle('on', x === b)); });
  $('[data-clear]', app).onclick = () => { sfx.tap(); strokes = []; redrawInk(); meter.style.width = '0'; if (mode === 'magic') peek(); };
  $('[data-done]', app).onclick = () => { sfx.tap(); finish(); };
  $('[data-say]', app).onclick = () => { sfx.tap(); say(describe(ch)); };
  $('[data-prev]', app).onclick = () => { sfx.tap(); go('trace', setKey, (idx - 1 + set.items.length) % set.items.length); };
  $('[data-next]', app).onclick = () => { sfx.tap(); nextItem(); };
  const peekBtn = $('[data-peek]', app); if (peekBtn) peekBtn.onclick = () => { sfx.tap(); peek(); };

  const onResize = () => { if (!finished) layout(); };
  addEventListener('resize', onResize);
  onCleanup(() => { removeEventListener('resize', onResize); clearTimeout(magicTimer); });

  fontsReady.then(() => {
    layout();
    say(`${mode === 'magic' ? 'Look carefully. Now write' : 'Trace'} ${describe(ch)}`);
    if (mode === 'magic') magicTimer = setTimeout(() => gc.classList.add('hide'), 2600);
  });
};

/* ------------------------------------------------------------------ games */
const GAMES = [
  { id: 'balloon', e: '🎈', t: 'Balloon Pop', s: 'Pop the right letter or number', tile: 'pink', pick: true },
  { id: 'count', e: '🍎', t: 'Count & Tap', s: 'How many can you see?', tile: 'orange' },
  { id: 'picture', e: '🐘', t: 'Picture Match', s: 'Which one starts with…?', tile: 'blue' },
  { id: 'next', e: '🧩', t: 'What Comes Next?', s: 'Finish the pattern', tile: 'green' },
  { id: 'pair', e: '🔠', t: 'Big & Small', s: 'Match A with a', tile: 'yellow' },
];
const ROUNDS = 8;

SCREENS.games = function () {
  const p = me();
  app.innerHTML = `<div class="screen">
    <div class="bar">${backBtn()}<h1>Fun Games</h1><span class="chip">⭐ ${p.stars}</span></div>
    <div class="tiles">${GAMES.map((g) => `<button class="tile ${g.tile}" data-g="${g.id}"><div class="emo">${g.e}</div><div class="t">${g.t}</div><div class="s">${g.s}</div><div class="s" style="margin-top:6px">${starsRow(p.games[g.id] || 0).replace(/<b>★<\/b>/g, '⭐').replace(/★/g, '☆')}</div></button>`).join('')}</div>
  </div>`;
  setBack(() => go('home'));
  $$('[data-g]', app).forEach((b) => b.onclick = () => {
    sfx.tap();
    const g = GAMES.find((x) => x.id === b.dataset.g);
    if (g.pick) {
      say('Letters or numbers?');
      popup(`<div class="big-emo">${g.e}</div><h2>${g.t}</h2><p>What do you want to pop?</p>
        <div class="acts"><button class="btn big pink" data-k="abc">ABC</button><button class="btn big yellow" data-k="123">123</button></div>`, (el) => {
        $$('[data-k]', el).forEach((k) => k.onclick = () => { sfx.tap(); go('play_' + g.id, k.dataset.k); });
      });
    } else go('play_' + g.id);
  });
};

/** Shared game frame: progress dots + end-of-game scoring. */
function gameFrame(id, title, body) {
  app.innerHTML = `<div class="screen" style="height:100vh;height:100dvh;overflow:hidden">
    <div class="gamebar">${backBtn()}<div class="prog">${'<i></i>'.repeat(ROUNDS)}</div><span class="chip" id="gs">⭐ ${me().stars}</span></div>
    ${body}</div>`;
  setBack(() => go('games'));
  let score = 0, misses = 0;
  return {
    get score() { return score; },
    right() { score++; const d = $$('.prog i', app)[score - 1]; if (d) d.classList.add('on'); sfx.good(); return score >= ROUNDS; },
    wrong() { misses++; sfx.bad(); },
    end(again) {
      const stars = misses <= 1 ? 3 : misses <= 4 ? 2 : 1;
      const p = me(); p.games[id] = Math.max(p.games[id] || 0, stars); save();
      const parties = addStars(stars);
      sfx.win(); confetti(180);
      const praise = pick(PRAISE[stars]);
      say(`${praise} You finished ${title}!`);
      const show = () => {
        const el = popup(`<div class="big-emo">🏆</div><h2>${praise}</h2>
          <div class="bigstars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">⭐</span>`).join('')}</div>
          <p>You earned <b>${stars}</b> star${stars > 1 ? 's' : ''}!</p>
          <div class="acts"><button class="btn white" data-games>🎮 Games</button><button class="btn big green" data-again>Play again ↻</button></div>`, (el) => {
          $('[data-games]', el).onclick = () => { sfx.tap(); go('games'); };
          $('[data-again]', el).onclick = () => { sfx.tap(); again(); };
        });
        return el;
      };
      if (parties.length) setTimeout(() => celebrate(parties, show), 1200);
      show();
    },
  };
}

/* 🎈 Balloon Pop */
SCREENS.play_balloon = function (kind) {
  const pool = kind === '123' ? NUMBERS.slice(1) : UPPER;
  const f = gameFrame('balloon', 'Balloon Pop', `
    <div class="ask">Pop the <span class="target" id="tg"></span></div>
    <div class="field-b" id="fb"></div>`);
  const fb = $('#fb'), tg = $('#tg');
  const COLORS = ['#ff6fa5', '#7c5cff', '#ffb31a', '#2fbf71', '#2b9be0', '#ff7a45'];
  let target = null, balloons = [], raf = 0, last = performance.now(), spawnT = 0, sinceTarget = 0, over = false;
  function newTarget() {
    let t; do { t = pick(pool); } while (t === target);
    target = t; tg.textContent = t; sinceTarget = 0;
    say(`Pop the ${spoken(t)}!`);
  }
  function spawn() {
    const W = fb.clientWidth, H = fb.clientHeight;
    let c = Math.random() < 0.4 || sinceTarget >= 2 ? target : pick(pool);
    sinceTarget = c === target ? 0 : sinceTarget + 1;
    const el = document.createElement('div'); el.className = 'balloon';
    el.innerHTML = `<div class="b" style="--c:${pick(COLORS)}">${c}</div>`;
    const b = { el, c, x: 10 + Math.random() * Math.max(10, W - 120), y: H + 20, v: 40 + Math.random() * 30 + Math.min(W, 900) * 0.02, sway: Math.random() * 6, dead: false };
    el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); tapB(b); });
    fb.appendChild(el); balloons.push(b);
  }
  function tapB(b) {
    if (b.dead || over) return;
    if (b.c === target) {
      b.dead = true; b.el.classList.add('popped'); sfx.pop();
      const burst = document.createElement('div'); burst.className = 'burst'; burst.textContent = '💥';
      burst.style.left = b.x + 30 + 'px'; burst.style.top = b.y + 30 + 'px'; fb.appendChild(burst); setTimeout(() => burst.remove(), 600);
      setTimeout(() => b.el.remove(), 300);
      if (f.right()) { over = true; setTimeout(() => f.end(() => go('play_balloon', kind)), 500); }
      else setTimeout(newTarget, 450);
    } else {
      f.wrong(); b.el.classList.remove('nope'); void b.el.offsetWidth; b.el.classList.add('nope');
      say(`That is ${spoken(b.c)}. Find ${spoken(target)}!`);
    }
  }
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    spawnT -= dt;
    if (spawnT <= 0 && !over) { spawn(); spawnT = 1.05; }
    for (const b of balloons) {
      if (b.dead) continue;
      b.y -= b.v * dt; b.sway += dt * 2;
      b.el.style.transform = `translate(${b.x + Math.sin(b.sway) * 10}px, ${b.y}px)`;
      if (b.y < -200) { b.dead = true; b.el.remove(); }
    }
    balloons = balloons.filter((b) => !b.dead);
    raf = requestAnimationFrame(tick);
  }
  onCleanup(() => cancelAnimationFrame(raf));
  newTarget(); raf = requestAnimationFrame(tick);
};

/* 🍎 Count & Tap */
SCREENS.play_count = function () {
  const f = gameFrame('count', 'Count and Tap', `
    <div class="ask" id="q">How many?</div>
    <div class="objs" id="objs"></div>
    <div class="choices" id="ch"></div>`);
  let lastN = 0;
  function round() {
    let n; do { n = 1 + rnd(10); } while (n === lastN); lastN = n;
    const e = pick(COUNT_EMO);
    $('#q').innerHTML = `How many ${e} ?`;
    say('How many? Tap each one to count!');
    let counted = 0;
    $('#objs').innerHTML = Array.from({ length: n }, () => `<button class="obj">${e}</button>`).join('');
    $$('.obj', app).forEach((o) => o.onclick = () => {
      if (o.classList.contains('counted')) return;
      counted++; o.classList.add('counted'); o.insertAdjacentHTML('beforeend', `<span class="n">${counted}</span>`);
      sfx.tap(); say(NUM_WORDS[counted]);
    });
    const opts = new Set([n]);
    while (opts.size < 3) { const d = n + (rnd(2) ? 1 : -1) * (1 + rnd(3)); if (d >= 1 && d <= 10) opts.add(d); }
    $('#ch').innerHTML = shuffle([...opts]).map((x) => `<button class="choice" data-v="${x}">${x}</button>`).join('');
    $$('#ch .choice', app).forEach((b) => b.onclick = () => {
      if (+b.dataset.v === n) {
        b.classList.add('right'); $$('#ch .choice', app).forEach((x) => x.style.pointerEvents = 'none');
        say(`Yes! ${NUM_WORDS[n]}!`); confetti(40);
        if (f.right()) setTimeout(() => f.end(() => go('play_count')), 900); else setTimeout(round, 1300);
      } else { b.classList.add('wrong'); f.wrong(); say('Oops! Let us count again.'); }
    });
  }
  round();
};

/* 🐘 Picture Match */
SCREENS.play_picture = function () {
  const f = gameFrame('picture', 'Picture Match', `
    <div class="ask">Which one starts with…</div>
    <div class="bigletter" id="L"></div>
    <div class="choices" id="ch"></div>`);
  const order = shuffle(UPPER); let i = 0;
  function round() {
    const L = order[i++ % order.length];
    $('#L').textContent = L + ' ' + L.toLowerCase();
    say(`Which picture starts with ${spoken(L)}?`);
    const others = shuffle(UPPER.filter((x) => x !== L)).slice(0, 2);
    $('#ch').innerHTML = shuffle([L, ...others]).map((x) => `<button class="choice pic" data-v="${x}">${WORDS[x][1]}<small>${WORDS[x][0]}</small></button>`).join('');
    $$('#ch .choice', app).forEach((b) => b.onclick = () => {
      if (b.dataset.v === L) {
        b.classList.add('right'); $$('#ch .choice', app).forEach((x) => x.style.pointerEvents = 'none');
        say(`Yes! ${describe(L)}!`); confetti(40);
        if (f.right()) setTimeout(() => f.end(() => go('play_picture')), 1100); else setTimeout(round, 1600);
      } else { b.classList.add('wrong'); f.wrong(); say(`${WORDS[b.dataset.v][0]} starts with ${spoken(b.dataset.v)}. Try again!`); }
    });
  }
  round();
};

/* 🧩 What comes next? */
SCREENS.play_next = function () {
  const f = gameFrame('next', 'What Comes Next', `
    <div class="ask" id="q">What is missing?</div>
    <div class="seq" id="seq"></div>
    <div class="choices" id="ch"></div>`);
  function round() {
    const letters = rnd(2) === 0;
    const list = letters ? UPPER : NUMBERS.slice(1);
    const start = rnd(list.length - 4 + 1);
    const seq = list.slice(start, start + 4);
    const miss = rnd(2) ? 3 : 1 + rnd(2);
    const ans = seq[miss];
    $('#q').textContent = miss === 3 ? 'What comes next?' : 'What is missing?';
    say(miss === 3 ? 'What comes next?' : 'What is missing?');
    $('#seq').innerHTML = seq.map((c, k) => k === miss ? '<span class="q">?</span>' : `<span>${c}</span>`).join('');
    const opts = new Set([ans]);
    while (opts.size < 3) { const c = pick(list); if (!seq.includes(c) || c !== ans) opts.add(c); }
    $('#ch').innerHTML = shuffle([...opts]).map((x) => `<button class="choice" data-v="${x}">${x}</button>`).join('');
    $$('#ch .choice', app).forEach((b) => b.onclick = () => {
      if (b.dataset.v === ans) {
        b.classList.add('right'); $$('#ch .choice', app).forEach((x) => x.style.pointerEvents = 'none');
        $('#seq .q').textContent = ans; $('#seq .q').classList.remove('q');
        say(seq.map(spoken).join(', ')); confetti(40);
        if (f.right()) setTimeout(() => f.end(() => go('play_next')), 1500); else setTimeout(round, 2200);
      } else { b.classList.add('wrong'); f.wrong(); say('Not that one. Try again!'); }
    });
  }
  round();
};

/* 🔠 Big & Small */
SCREENS.play_pair = function () {
  const f = gameFrame('pair', 'Big and Small', `
    <div class="ask">Find the small letter for</div>
    <div class="bigletter" id="L"></div>
    <div class="choices" id="ch"></div>`);
  const order = shuffle(UPPER); let i = 0;
  function round() {
    const L = order[i++ % order.length];
    $('#L').textContent = L;
    say(`Find small ${spoken(L)}!`);
    const others = shuffle(LOWER.filter((x) => x !== L.toLowerCase())).slice(0, 3);
    $('#ch').innerHTML = shuffle([L.toLowerCase(), ...others]).map((x) => `<button class="choice" data-v="${x}">${x}</button>`).join('');
    $$('#ch .choice', app).forEach((b) => b.onclick = () => {
      if (b.dataset.v === L.toLowerCase()) {
        b.classList.add('right'); $$('#ch .choice', app).forEach((x) => x.style.pointerEvents = 'none');
        say(`Yes! Big ${spoken(L)}, small ${spoken(L)}!`); confetti(40);
        if (f.right()) setTimeout(() => f.end(() => go('play_pair')), 1100); else setTimeout(round, 1500);
      } else { b.classList.add('wrong'); f.wrong(); say(`That is ${spoken(b.dataset.v)}. Try again!`); }
    });
  }
  round();
};

/* ---------------------------------------------------------------- trophy */
SCREENS.trophy = function () {
  const p = me(); const r = rankOf(p.stars); const nx = nextRank(p.stars);
  const pct = nx ? ((p.stars - r.at) / (nx.at - r.at)) * 100 : 100;
  const have = stickerCount(p.stars);
  const sorted = S.profiles.slice().sort((a, b) => b.stars - a.stars);
  app.innerHTML = `<div class="screen">
    <div class="bar">${backBtn()}<h1>My Stars</h1><div class="spacer"></div></div>
    <div class="rankcard">
      <div class="re">${r.e}</div><div class="rn">${esc(p.name)} is a ${r.n}!</div>
      <div class="rs">⭐ ${p.stars} stars</div>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div class="rs">${nx ? `${nx.at - p.stars} more ⭐ to become a ${nx.e} ${nx.n}` : 'You reached the top rank! 👑'}</div>
    </div>
    <div class="section"><h3>🪜 Star ranks</h3><div class="ranks">${RANKS.map((x) => `<div class="${p.stars >= x.at ? (x === r ? 'cur' : '') : 'lock'}"><b>${x.e}</b>${x.n}<br>⭐${x.at}</div>`).join('')}</div></div>
    <div class="section"><h3>🏅 Star board</h3><div class="board-list">${sorted.map((k, i) => `<div class="row ${k.id === p.id ? 'me' : ''}"><span class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="av">${k.avatar}</span><span class="nm">${esc(k.name)}</span><span>${rankOf(k.stars).e} ⭐ ${k.stars}</span></div>`).join('')}</div>
      ${S.profiles.length < 2 ? '<p class="note" style="margin-top:10px">Add a brother, sister or friend on the first screen to race on the star board!</p>' : ''}</div>
    <div class="section"><h3>🎁 Sticker book (${have}/${STICKERS.length})</h3>
      <div class="stickers">${STICKERS.map((s, i) => i < have ? `<div>${s}</div>` : `<div class="lock">⭐${(i + 1) * STICKER_EVERY}</div>`).join('')}</div></div>
    <div class="section" style="text-align:center"><button class="btn white" data-parent>👪 Grown-ups: progress report</button></div>
  </div>`;
  setBack(() => go('home'));
  say(`${p.name}, you have ${p.stars} stars. You are a ${r.n}!`);
  $('[data-parent]', app).onclick = () => { sfx.tap(); parentGate(() => go('report')); };
};

/** Simple grown-up check so little fingers don't wander into settings. */
function parentGate(ok) {
  const a = 3 + rnd(6), b = 2 + rnd(7);
  const opts = shuffle([a + b, a + b + 1 + rnd(3), Math.max(1, a + b - 1 - rnd(3))]);
  popup(`<div class="big-emo">👪</div><h2>For grown-ups</h2><p>What is ${a} + ${b}?</p>
    <div class="acts">${opts.map((o) => `<button class="btn white" data-v="${o}">${o}</button>`).join('')}</div>
    <div class="acts"><button class="btn pink" data-x>Cancel</button></div>`, (el) => {
    $$('[data-v]', el).forEach((x) => x.onclick = () => { if (+x.dataset.v === a + b) { closePopup(); ok(); } else { sfx.bad(); closePopup(); } });
    $('[data-x]', el).onclick = closePopup;
  });
}

SCREENS.report = function () {
  const p = me();
  const block = (k) => {
    const s = SETS[k];
    const cells = s.items.map((c) => { const b = p.best[k + ':' + c] || 0; return `<span class="s${b}" title="${c}: ${b} stars, ${p.tries[k + ':' + c] || 0} tries">${c}</span>`; }).join('');
    return `<div class="section"><h3>${s.title} · ${s.name}</h3><div class="rep">${cells}</div></div>`;
  };
  const weak = [];
  for (const k of Object.keys(SETS)) for (const c of SETS[k].items) { const b = p.best[k + ':' + c] || 0; if ((p.tries[k + ':' + c] || 0) > 0 && b < 2) weak.push(c); }
  const tried = Object.keys(p.tries).length;
  const total = Object.values(SETS).reduce((a, s) => a + s.items.length, 0);
  app.innerHTML = `<div class="screen">
    <div class="bar">${backBtn()}<h1>${esc(p.name)}’s Report</h1><div class="spacer"></div></div>
    <div class="note">
      ⭐ <b>${p.stars}</b> stars · ${rankOf(p.stars).e} ${rankOf(p.stars).n} · played on <b>${p.days || 0}</b> day(s)<br>
      ✏️ Traced <b>${tried}</b> of ${total} letters &amp; numbers<br>
      🎮 Games: ${GAMES.map((g) => `${g.e} ${'⭐'.repeat(p.games[g.id] || 0) || '–'}`).join(' &nbsp; ')}<br>
      ${weak.length ? `🔁 Needs more practice: <b style="font-family:Andika">${weak.join(' ')}</b>` : '👍 Nothing flagged for extra practice yet.'}
    </div>
    <div class="legend"><span><i style="background:#eee9f8"></i>Not tried</span><span><i style="background:#ffd8b0"></i>1 star</span><span><i style="background:#fff0a8"></i>2 stars</span><span><i style="background:#b8f1d2"></i>3 stars</span></div>
    ${block('upper')}${block('lower')}${block('num')}
    <div class="section note">
      <b>Tips</b><br>• Easy mode: the child colours inside a big letter. Dots: follow dotted letters. Magic: the letter shows for a moment, then the child writes it from memory (bonus star!).<br>
      • Stars come from how much of the letter was traced and how neatly it stayed inside the lines.<br>
      • Short sessions (10–15 minutes) work best for little ones.
    </div>
    <div class="settings">
      <button class="toggle" data-rename>✏️ Rename</button>
      <button class="toggle" data-reset>🔄 Reset progress</button>
      <button class="toggle" data-del>🗑️ Remove child</button>
    </div>
  </div>`;
  setBack(() => go('trophy'));
  $('[data-rename]', app).onclick = () => { const n = prompt('New name', p.name); if (n && n.trim()) { p.name = n.trim().slice(0, 16); save(); go('report'); } };
  $('[data-reset]', app).onclick = () => { if (confirm(`Reset all stars and progress for ${p.name}?`)) { Object.assign(p, { stars: 0, best: {}, tries: {}, games: {}, days: 0 }); save(); go('report'); } };
  $('[data-del]', app).onclick = () => { if (confirm(`Remove ${p.name} and all their stars?`)) { S.profiles = S.profiles.filter((x) => x.id !== p.id); S.current = null; save(); go('who'); } };
};

/* ------------------------------------------------------------------ boot */
const fontsReady = (document.fonts && document.fonts.load)
  ? Promise.all([document.fonts.load('700 40px "Andika"'), document.fonts.load('600 20px "Fredoka"')]).catch(() => {}).then(() => new Promise((r) => setTimeout(r, 30)))
  : Promise.resolve();
// unlock audio on first touch (iOS)
addEventListener('pointerdown', () => actx(), { once: true });

if (me()) go('home'); else go('who');

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
