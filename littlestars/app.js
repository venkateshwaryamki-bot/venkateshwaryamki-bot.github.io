/* Little Stars — learn to write ABC & 123 the right way, play, and earn stars.
 * Runs as a web app and inside the Android APK (which adds a native voice + haptics bridge: window.LSNative). */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const app = $('#app');
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NATIVE = window.LSNative || null;

/* ================================================================== content */
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
  upper: { title: 'ABC', name: 'Big Letters', items: UPPER, c: 'var(--coral)', l: 'var(--coral-l)' },
  lower: { title: 'abc', name: 'Small Letters', items: LOWER, c: 'var(--sky)', l: 'var(--sky-l)' },
  num: { title: '123', name: 'Numbers', items: NUMBERS, c: 'var(--tang)', l: 'var(--tang-l)' },
};
const AVATARS = [['🐯', '#fff0d6'], ['🐼', '#eceff6'], ['🐰', '#ffe9f0'], ['🦊', '#ffe6d6'], ['🐨', '#e8edf7'], ['🐸', '#e1f6e1'],
  ['🦁', '#fff2cc'], ['🐵', '#f4e6d8'], ['🐶', '#f3e9dc'], ['🐱', '#fff0e0'], ['🐧', '#e1f1ff'], ['🦄', '#f3e6ff']];
const avBg = (a) => (AVATARS.find((x) => x[0] === a) || AVATARS[0])[1];
const RANKS = [
  { at: 0, e: '🥚', n: 'Little Egg' }, { at: 10, e: '🐣', n: 'Baby Chick' }, { at: 30, e: '🐥', n: 'Happy Birdie' },
  { at: 60, e: '🐰', n: 'Busy Bunny' }, { at: 100, e: '🦊', n: 'Clever Fox' }, { at: 160, e: '🐼', n: 'Smart Panda' },
  { at: 240, e: '🦁', n: 'Brave Lion' }, { at: 340, e: '🦄', n: 'Magic Unicorn' }, { at: 460, e: '🚀', n: 'Rocket Star' },
  { at: 600, e: '👑', n: 'Super Star King' },
];
const STICKERS = ['🌈', '🍭', '🚂', '🐳', '🌻', '🎂', '🦖', '🚁', '🍉', '🐙', '🎠', '🏰', '🦋', '🍩', '🚜', '🐢', '🎸', '🌙', '🦒', '🍦', '⛵', '🐝', '🎪', '🪐', '🦩', '🍕', '🏆', '🐲', '💎', '🌟'];
const STICKER_EVERY = 15;
const CRAYONS = ['#6c4cf1', '#ff5277', '#ff9a3c', '#22b37f', '#2a9ae0', '#2b2350'];
const MODES = {
  easy: { label: '✏️ Trace', hint: 'Follow the road from the green dot' },
  dots: { label: '••• Dots', hint: 'Join the dots in the right order' },
  magic: { label: '✨ Memory', hint: 'Watch, then write it by yourself — bonus star!' },
};
const PRAISE = { 3: ['Superstar!', 'Perfect!', 'Amazing!', 'Fantastic!'], 2: ['Great job!', 'Very good!', 'Well done!'], 1: ['Good try!', 'Nice work!', 'You did it!'] };
const GAMES = [
  { id: 'balloon', e: '🎈', t: 'Balloon Pop', s: 'Pop the right one', l: 'var(--coral-l)', ask: true },
  { id: 'count', e: '🍎', t: 'Count & Tap', s: 'How many?', l: 'var(--tang-l)' },
  { id: 'picture', e: '🐘', t: 'Picture Match', s: 'Starts with…', l: 'var(--sky-l)' },
  { id: 'next', e: '🧩', t: 'What’s Next?', s: 'Finish the pattern', l: 'var(--mint-l)' },
  { id: 'pair', e: '🔠', t: 'Big & Small', s: 'Match A with a', l: 'var(--sun-l)' },
];
const ROUNDS = 8;

/* ================================================================== state */
const KEY = 'littlestars.v1';
let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.profiles)) return Object.assign({ sound: true, voice: true, mode: 'easy' }, s); } catch (e) { /* ignore */ }
  return { profiles: [], current: null, sound: true, voice: true, mode: 'easy' };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
function me() { return S.profiles.find((p) => p.id === S.current) || null; }
function dayStr(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
const today = () => dayStr(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
function rankOf(stars) { let r = RANKS[0]; for (const x of RANKS) if (stars >= x.at) r = x; return r; }
function nextRank(stars) { return RANKS.find((x) => x.at > stars) || null; }
function stickerCount(stars) { return Math.min(STICKERS.length, Math.floor(stars / STICKER_EVERY)); }
function boardPos(p) { return S.profiles.slice().sort((a, b) => b.stars - a.stars).findIndex((x) => x.id === p.id) + 1; }
function streakOf(p) { return p.streakDay === today() || p.streakDay === yesterday() ? (p.streak || 0) : 0; }
function starsRow(n, max = 3) { let s = ''; for (let i = 0; i < max; i++) s += i < n ? '<b>★</b>' : '★'; return s; }

/** Give stars to the current child; returns celebrations (rank up / new sticker) to show. */
function addStars(n) {
  const p = me(); if (!p || n <= 0) return [];
  const before = p.stars;
  p.stars += n;
  if (p.lastDay !== today()) { p.lastDay = today(); p.days = (p.days || 0) + 1; }
  save();
  const out = [];
  const r0 = rankOf(before), r1 = rankOf(p.stars);
  if (r1 !== r0) out.push({ type: 'rank', rank: r1 });
  for (let i = stickerCount(before); i < stickerCount(p.stars); i++) out.push({ type: 'sticker', sticker: STICKERS[i] });
  return out;
}

/* ================================================================== sound + touch feel */
let AC = null;
function actx() {
  if (!S.sound) return null;
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
/** Soft marimba-like note. */
function note(freq, dur = 0.35, vol = 0.16, delay = 0, type = 'sine') {
  const a = actx(); if (!a) return;
  const t = a.currentTime + delay;
  const g = a.createGain(); g.connect(a.destination);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.connect(g); o.start(t); o.stop(t + dur + 0.05);
  const g2 = a.createGain(); g2.connect(a.destination);
  g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.005); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.25);
  const o2 = a.createOscillator(); o2.frequency.setValueAtTime(freq * 4, t); o2.connect(g2); o2.start(t); o2.stop(t + dur);
}
function slide(f1, f2, dur, vol = 0.12, type = 'triangle') {
  const a = actx(); if (!a) return;
  const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  tap() { note(880, 0.12, 0.1); buzz(8); },
  pop() { slide(900, 1800, 0.08, 0.12, 'sine'); note(1320, 0.15, 0.08, 0.03); buzz(15); },
  good() { note(784, 0.25, 0.15); note(1175, 0.35, 0.13, 0.09); buzz(20); },
  soft() { slide(330, 250, 0.25, 0.09); buzz(30); },
  stroke() { note(1047, 0.3, 0.12); note(1568, 0.4, 0.08, 0.06); buzz(12); },
  star(i) { note([1047, 1319, 1568][i] || 1568, 0.5, 0.16); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, 0.45, 0.14, i * 0.1)); buzz(40); },
};
function buzz(ms) { try { if (NATIVE && NATIVE.haptic) NATIVE.haptic(ms); } catch (e) { /* ignore */ } }

/* ================================================================== voice */
let VOICE = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices(); if (!vs.length) return;
  VOICE = vs.find((v) => /en[-_]IN/i.test(v.lang)) ||
    vs.find((v) => /^en/i.test(v.lang) && /female|samantha|karen|moira|tessa|zira|google uk english female|google us/i.test(v.name)) ||
    vs.find((v) => /^en/i.test(v.lang)) || null;
}
if (!NATIVE && 'speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text) {
  if (!S.voice) return;
  if (NATIVE && NATIVE.speak) { try { NATIVE.speak(text); } catch (e) { /* ignore */ } return; }
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (VOICE) { u.voice = VOICE; u.lang = VOICE.lang; } else u.lang = 'en-IN';
    u.rate = 0.85; u.pitch = 1.2;
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
function hush() { if (NATIVE && NATIVE.stop) { try { NATIVE.stop(); } catch (e) { /* ignore */ } } else if ('speechSynthesis' in window) speechSynthesis.cancel(); }
/** How a symbol is read aloud. */
function spoken(ch) {
  if (/^\d+$/.test(ch)) return NUM_WORDS[+ch] || ch;
  const up = ch.toUpperCase(), name = up === 'A' ? 'ay' : up;
  return ch === up ? name : 'small ' + name;
}
function describe(ch) { return /^\d+$/.test(ch) ? NUM_WORDS[+ch] : `${spoken(ch)} for ${WORDS[ch.toUpperCase()][0]}`; }

/* ================================================================== art */
function starPath(cx, cy, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); }
  return d + 'Z';
}
const STAR_D = starPath(60, 66, 50, 25);
/** Twinkle, the star buddy. mood: happy | wow */
function mascot(mood = 'happy', cls = '') {
  const mouth = mood === 'wow' ? '<ellipse cx="60" cy="80" rx="6" ry="7" fill="#2b2350"/><ellipse cx="60" cy="83" rx="3.5" ry="3" fill="#ff7b93"/>'
    : '<path d="M50 77 Q60 89 70 77" fill="#ff7b93" stroke="#2b2350" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>';
  return `<svg class="mascot ${cls}" viewBox="0 0 120 120" aria-hidden="true">
    <ellipse cx="60" cy="114" rx="30" ry="4" fill="rgba(43,35,80,.12)"/>
    <path d="${STAR_D}" fill="#ffb81f" stroke="#ffb81f" stroke-width="14" stroke-linejoin="round"/>
    <path d="${STAR_D}" fill="#ffcc3d" stroke="#ffcc3d" stroke-width="8" stroke-linejoin="round" transform="translate(0 -2)"/>
    <path d="M38 40 Q46 30 56 30" stroke="#fff3c4" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g class="eye"><ellipse cx="48" cy="66" rx="5.5" ry="7.5" fill="#2b2350"/><circle cx="50" cy="63" r="2.2" fill="#fff"/></g>
    <g class="eye"><ellipse cx="72" cy="66" rx="5.5" ry="7.5" fill="#2b2350"/><circle cx="74" cy="63" r="2.2" fill="#fff"/></g>
    <ellipse cx="39" cy="77" rx="6" ry="4" fill="#ff8fa3" opacity=".75"/><ellipse cx="81" cy="77" rx="6" ry="4" fill="#ff8fa3" opacity=".75"/>
    ${mouth}</svg>`;
}
const LOGO = `<svg class="logo" viewBox="0 0 380 120" aria-label="Little Stars">
  <g font-family="Fredoka, sans-serif" font-weight="700" text-anchor="middle" paint-order="stroke" stroke-linejoin="round">
    <text x="116" y="80" font-size="64" fill="#ff6b81" stroke="#fff" stroke-width="12">Little</text>
    <text x="290" y="80" font-size="64" fill="#6c4cf1" stroke="#fff" stroke-width="12">Stars</text>
  </g>
  <path d="${starPath(368, 22, 13, 6)}" fill="#ffc542" stroke="#ffc542" stroke-width="5" stroke-linejoin="round"/>
  <path d="${starPath(26, 96, 10, 4.5)}" fill="#3fb6f2" stroke="#3fb6f2" stroke-width="3" stroke-linejoin="round"/>
</svg>`;
const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  speak: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  redo: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v5h5"/></svg>',
  watch: '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
};
const backBtn = () => `<button class="icon-btn" data-back aria-label="Back">${ICON.back}</button>`;

/* ================================================================== confetti */
const cv = $('#confetti'); const cx = cv.getContext('2d');
let bits = [], confRaf = 0;
function confetti(count = 120) {
  cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
  const colors = ['#ff6b81', '#6c4cf1', '#ffc542', '#3fb6f2', '#2ecc9a', '#ff9a4d'];
  for (let i = 0; i < count; i++) {
    bits.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 160, y: innerHeight * 0.42, vx: (Math.random() - 0.5) * 17, vy: -Math.random() * 16 - 5,
      r: Math.random() * 5 + 4, c: pick(colors), a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, life: 1, star: Math.random() < 0.25 });
  }
  if (!confRaf) confRaf = requestAnimationFrame(tickConf);
}
function tickConf() {
  const d = devicePixelRatio; cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
  bits = bits.filter((b) => b.y < innerHeight + 30 && b.life > 0);
  for (const b of bits) {
    b.vy += 0.42; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.a += b.va; b.life -= 0.006;
    cx.save(); cx.translate(b.x, b.y); cx.rotate(b.a); cx.fillStyle = b.c; cx.globalAlpha = Math.min(1, b.life * 2);
    if (b.star) { cx.scale(b.r / 25, b.r / 25); cx.translate(-60, -66); cx.fill(new Path2D(STAR_D)); } else cx.fillRect(-b.r, -b.r / 2, b.r * 2, b.r);
    cx.restore();
  }
  confRaf = bits.length ? requestAnimationFrame(tickConf) : 0;
  if (!bits.length) cx.clearRect(0, 0, innerWidth, innerHeight);
}

/* ================================================================== popups */
const popRoot = $('#popup-root');
function popup(html, onMount) {
  closePopup();
  popRoot.innerHTML = `<div class="overlay"><div class="pop">${html}</div></div>`;
  const el = $('.pop', popRoot);
  el.classList.add('arming'); setTimeout(() => el.classList.remove('arming'), 900);  // no accidental taps while still drawing
  if (onMount) onMount(el);
  return el;
}
function closePopup() { popRoot.innerHTML = ''; }
function celebrate(list, done) {
  if (!list.length) { done && done(); return; }
  const [c, ...rest] = list;
  sfx.win(); confetti(160);
  const html = c.type === 'rank'
    ? `<div class="hero"><span class="big">${c.rank.e}</span></div><h2>New rank!</h2><p>You are now a <b>${c.rank.n}</b>!</p><div class="acts"><button class="btn lg" data-ok>Yay! 🎉</button></div>`
    : `<div class="hero"><span class="big">${c.sticker}</span></div><h2>New sticker!</h2><p>It’s in your sticker book.</p><div class="acts"><button class="btn lg coral" data-ok>Cool! ✨</button></div>`;
  say(c.type === 'rank' ? `Hooray! You are now a ${c.rank.n}!` : 'Wow! You got a new sticker!');
  popup(html, (el) => { $('[data-ok]', el).onclick = () => { sfx.tap(); closePopup(); celebrate(rest, done); }; });
}

/* ================================================================== router */
let cleanups = [], backFn = null;
function onCleanup(f) { cleanups.push(f); }
function go(name, ...args) {
  cleanups.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
  cleanups = []; backFn = null;
  closePopup(); hush();
  SCREENS[name](...args);
  window.scrollTo(0, 0);
}
function setBack(fn) {
  backFn = fn;
  const b = $('[data-back]', app);
  if (b) b.onclick = () => { sfx.tap(); fn(); };
}
/** Android back button (native) and browser back both step "up" one screen. */
window.lsBack = function () {
  if (popRoot.innerHTML) { closePopup(); return true; }
  if (backFn) { backFn(); return true; }
  return false;
};
if (!NATIVE) {
  history.replaceState({ ls: 0 }, ''); history.pushState({ ls: 1 }, '');
  addEventListener('popstate', () => { history.pushState({ ls: 1 }, ''); window.lsBack(); });
}

/* ================================================================== daily adventure */
let ADV = false;
function daily(p) {
  if (p.daily && p.daily.day === today()) return p.daily;
  const tried = (k, c) => (p.tries[k + ':' + c] || 0) > 0;
  const fresh = (k) => SETS[k].items.find((c) => !tried(k, c));
  const weak = [];
  for (const k of Object.keys(SETS)) for (const c of SETS[k].items) if (tried(k, c) && (p.best[k + ':' + c] || 0) < 3) weak.push({ set: k, ch: c, b: p.best[k + ':' + c] || 0 });
  weak.sort((a, b) => a.b - b.b);
  const anyOf = (k) => pick(SETS[k].items);
  const upperNew = fresh('upper');
  const review = weak.find((w) => w.ch !== upperNew);
  const items = [
    { t: 'trace', set: 'upper', ch: upperNew || anyOf('upper') },
    { t: 'game', g: pick(['balloon', 'picture', 'pair']), kind: pick(['abc', '123']) },
    { t: 'trace', set: 'num', ch: fresh('num') || anyOf('num') },
    review ? { t: 'trace', set: review.set, ch: review.ch } : { t: 'trace', set: 'lower', ch: fresh('lower') || anyOf('lower') },
    { t: 'game', g: pick(['count', 'next']) },
  ];
  p.daily = { day: today(), items, done: 0 };
  save();
  return p.daily;
}
function runAdventure() {
  const p = me(); const d = daily(p);
  if (d.done >= d.items.length) { finishAdventure(); return; }
  ADV = true;
  const it = d.items[d.done];
  if (it.t === 'trace') go('trace', it.set, SETS[it.set].items.indexOf(it.ch));
  else go('play_' + it.g, it.kind || 'abc');
}
/** Called when any activity finishes; returns {label, run} for the "continue" button. */
function afterActivity(defaultLabel, defaultRun) {
  if (!ADV) return { label: defaultLabel, run: defaultRun };
  const p = me(); const d = daily(p);
  d.done = Math.min(d.items.length, d.done + 1); save();
  return d.done >= d.items.length ? { label: 'Finish 🏁', run: finishAdventure } : { label: 'Next ➜', run: runAdventure };
}
function finishAdventure() {
  ADV = false;
  const p = me();
  if (p.streakDay !== today()) {
    p.streak = p.streakDay === yesterday() ? (p.streak || 0) + 1 : 1;
    p.streakDay = today();
  }
  save();
  const parties = addStars(5);
  go('home');
  sfx.win(); confetti(220);
  say(`Hooray! You finished today’s adventure! Five bonus stars! See you tomorrow!`);
  popup(`<div class="hero">${mascot('wow', 'cheer')}</div><h2>Adventure done!</h2>
    <p>+5 bonus stars ⭐ &nbsp;·&nbsp; 🔥 ${p.streak} day${p.streak > 1 ? 's' : ''} in a row</p>
    <div class="acts"><button class="btn lg mint" data-ok>Yay!</button></div>`, (el) => {
    $('[data-ok]', el).onclick = () => { sfx.tap(); closePopup(); celebrate(parties, () => go('home')); };
  });
}

/* ================================================================== screens */
const SCREENS = {};

SCREENS.who = function () {
  ADV = false;
  const kids = S.profiles.map((p) => `<button class="card kid" data-id="${p.id}"><div class="avatar" style="--bg:${avBg(p.avatar)}">${p.avatar}</div>
    <div class="nm">${esc(p.name)}</div><div class="st">${rankOf(p.stars).e} ⭐ ${p.stars}</div></button>`).join('');
  app.innerHTML = `<div class="screen">
    <div class="brand">${LOGO}<div class="sub">Write · Play · Shine</div></div>
    <div class="talk" style="justify-content:center;margin-top:14px">${mascot()}<div class="bubble">${S.profiles.length ? 'Who is learning today?' : 'Hi! I’m Twinkle. Let’s make your star card!'}</div></div>
    <div class="kids">${kids}<button class="card kid add" data-add><div class="avatar">＋</div><div class="nm">Add child</div></button></div>
    <div class="toggles">
      <button class="toggle ${S.sound ? '' : 'off'}" data-t="sound">🔊 Sounds <span class="sw"></span></button>
      <button class="toggle ${S.voice ? '' : 'off'}" data-t="voice">🗣️ Voice <span class="sw"></span></button>
    </div>
    ${NATIVE ? '' : '<div style="text-align:center;margin-top:18px"><a class="btn sky" href="LittleStars.apk" download style="text-decoration:none">📱 Get the Android app</a></div>'}
    <div class="foot">Works offline · No ads · Progress stays on this device</div>
  </div>`;
  $$('.kid[data-id]', app).forEach((b) => b.onclick = () => { sfx.tap(); S.current = b.dataset.id; save(); say(`Hello ${me().name}!`); go('home'); });
  $('[data-add]', app).onclick = () => { sfx.tap(); go('newKid'); };
  $$('[data-t]', app).forEach((b) => b.onclick = () => { S[b.dataset.t] = !S[b.dataset.t]; save(); b.classList.toggle('off', !S[b.dataset.t]); sfx.tap(); });
  setTimeout(() => say(S.profiles.length ? 'Who is learning today?' : 'Hi! I am Twinkle. Let us make your star card!'), 400);
};

SCREENS.newKid = function () {
  let av = AVATARS[S.profiles.length % AVATARS.length][0];
  app.innerHTML = `<div class="screen">
    <div class="topbar">${backBtn()}<h1>New star card</h1><div class="sp"></div></div>
    <div class="card form">
      <h2>What’s your name?</h2>
      <input class="field" id="nm" maxlength="16" placeholder="Type a name" autocomplete="off" />
      <h2 style="margin-top:22px">Pick a buddy</h2>
      <div class="avgrid">${AVATARS.map(([a, bg]) => `<button data-av="${a}" style="--bg:${bg}" class="${a === av ? 'on' : ''}">${a}</button>`).join('')}</div>
      <button class="btn lg mint block" id="go">Let’s go! 🚀</button>
    </div></div>`;
  setBack(() => go('who'));
  $$('[data-av]', app).forEach((b) => b.onclick = () => { av = b.dataset.av; $$('[data-av]', app).forEach((x) => x.classList.toggle('on', x === b)); sfx.pop(); });
  const nm = $('#nm');
  $('#go').onclick = () => {
    const name = nm.value.trim();
    if (!name) { nm.focus(); nm.style.borderColor = 'var(--coral)'; sfx.soft(); return; }
    const p = { id: 'k' + Date.now().toString(36), name, avatar: av, stars: 0, best: {}, tries: {}, games: {}, days: 0, streak: 0, created: Date.now() };
    S.profiles.push(p); S.current = p.id; save();
    sfx.win(); confetti(); say(`Welcome ${name}! Let us learn and play!`);
    go('home');
  };
  nm.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#go').click(); });
};

SCREENS.home = function () {
  ADV = false;
  const p = me(); if (!p) return go('who');
  const r = rankOf(p.stars), nx = nextRank(p.stars);
  const d = daily(p);
  const streak = streakOf(p);
  const doneCount = (k) => SETS[k].items.filter((c) => (p.best[k + ':' + c] || 0) > 0).length;
  const nodeIcon = (it) => it.t === 'trace' ? `<span style="font-family:Andika;font-size:.95em;color:${'#2b2350'}">${it.ch}</span>` : GAMES.find((g) => g.id === it.g).e;
  const nodes = d.items.map((it, i) => `<div class="node ${i < d.done ? 'done' : i === d.done ? 'now' : ''}">${nodeIcon(it)}</div>`).join('');
  const allDone = d.done >= d.items.length;
  const greet = allDone ? `You finished today’s adventure, ${p.name}! 🎉` : d.done ? `Let’s keep going, ${p.name}!` : `Hi ${p.name}! Ready for today’s adventure?`;
  const pos = S.profiles.length > 1 ? `<span class="pill"><span class="ic star">${['🥇', '🥈', '🥉'][boardPos(p) - 1] || '🏅'}</span>#${boardPos(p)}</span>` : '';
  app.innerHTML = `<div class="screen">
    <div class="homehead">
      <button class="me-chip" data-switch><span class="avatar" style="--bg:${avBg(p.avatar)}">${p.avatar}</span><span class="nm">${esc(p.name)}</span></button>
      <div class="grow"></div>
      <span class="pill"><span class="ic fire">🔥</span>${streak}</span>
      <span class="pill"><span class="ic star">⭐</span>${p.stars}</span>${pos}
    </div>
    <div class="homegrid"><div>
      <div class="talk hello">${mascot(allDone ? 'wow' : 'happy')}<div class="bubble">${greet}</div></div>
      <div class="card quest">
        <div class="qh"><h3>Today’s Adventure</h3><span class="tag">${Math.min(d.done, 5)} / 5</span></div>
        <div class="path">${nodes}</div>
        ${allDone ? '<button class="btn lg sun block" data-adv>Play again for fun ↻</button>' : `<button class="btn lg sun block" data-adv>${d.done ? 'Continue ▶' : 'Start ▶'}</button>`}
      </div>
      <button class="card rankbar" data-trophy style="margin-top:18px">
        <span class="re">${r.e}</span>
        <span class="rt"><b>${r.n}</b><small>${nx ? `${nx.at - p.stars} more ⭐ to ${nx.e} ${nx.n}` : 'Top rank reached! 👑'}</small>
          <span class="prog" style="display:block"><i style="width:${nx ? ((p.stars - r.at) / (nx.at - r.at)) * 100 : 100}%"></i></span></span>
        <span class="chev">›</span>
      </button>
    </div><div>
      <div class="sec"><span class="badge" style="background:var(--grape-l)">✏️</span><h2>Learn to write</h2></div>
      <div class="learn">${Object.entries(SETS).map(([k, s]) => `<button class="card lcard" data-set="${k}" style="--c:${s.c};--l:${s.l}"><span class="blob"></span>
        <div class="glyph">${s.title}</div><div class="t">${s.name}</div><div class="bar"><i style="width:${(doneCount(k) / s.items.length) * 100}%"></i></div></button>`).join('')}</div>
      <div class="sec"><span class="badge" style="background:var(--mint-l)">🎮</span><h2>Play &amp; learn</h2></div>
      <div class="games">${GAMES.map((g) => `<button class="card gcard" data-g="${g.id}" style="--l:${g.l}"><span class="art">${g.e}</span><span class="t">${g.t}</span>
        <span class="stars">${starsRow(p.games[g.id] || 0)}</span></button>`).join('')}</div>
    </div></div>
  </div>`;
  $$('[data-set]', app).forEach((b) => b.onclick = () => { sfx.tap(); go('grid', b.dataset.set); });
  $$('[data-g]', app).forEach((b) => b.onclick = () => { sfx.tap(); startGame(b.dataset.g); });
  $('[data-trophy]', app).onclick = () => { sfx.tap(); go('trophy'); };
  $('[data-switch]', app).onclick = () => { sfx.tap(); go('who'); };
  $('[data-adv]', app).onclick = () => {
    sfx.tap();
    if (allDone) { p.daily = null; save(); const nd = daily(p); nd.done = 0; nd.replay = true; save(); }
    runAdventure();
  };
  setBack(() => go('who'));
  setTimeout(() => say(greet.replace(/’/g, "'")), 350);
};
function startGame(id) {
  const g = GAMES.find((x) => x.id === id);
  if (!g.ask) return go('play_' + id);
  say('Letters or numbers?');
  popup(`<div class="hero"><span class="big">${g.e}</span></div><h2>${g.t}</h2><p>What shall we pop?</p>
    <div class="acts"><button class="btn lg coral" data-k="abc">ABC</button><button class="btn lg sun" data-k="123">123</button></div>`, (el) => {
    $$('[data-k]', el).forEach((k) => k.onclick = () => { sfx.tap(); go('play_' + id, k.dataset.k); });
  });
}

SCREENS.grid = function (setKey) {
  ADV = false;
  const p = me(); const set = SETS[setKey];
  const firstNew = set.items.find((c) => !(p.tries[setKey + ':' + c]));
  app.innerHTML = `<div class="screen">
    <div class="topbar">${backBtn()}<h1>${set.name}</h1><span class="pill"><span class="ic star">⭐</span>${p.stars}</span></div>
    <div class="modes" style="width:max-content">${Object.entries(MODES).map(([k, m]) => `<button data-m="${k}" class="${S.mode === k ? 'on' : ''}">${m.label}</button>`).join('')}</div>
    <div class="modehint" id="mh">${MODES[S.mode].hint}</div>
    <div class="grid">${set.items.map((c, i) => {
      const b = p.best[setKey + ':' + c] || 0;
      return `<button class="card cell ${b === 3 ? 'perfect' : ''}" data-i="${i}" style="--c:${set.c}">${c === firstNew ? '<span class="new">NEW</span>' : ''}<span class="ch">${c}</span><span class="stars">${starsRow(b)}</span></button>`;
    }).join('')}</div>
  </div>`;
  setBack(() => go('home'));
  $$('[data-m]', app).forEach((b) => b.onclick = () => {
    S.mode = b.dataset.m; save(); sfx.tap();
    $$('[data-m]', app).forEach((x) => x.classList.toggle('on', x === b));
    $('#mh').textContent = MODES[S.mode].hint; say(MODES[S.mode].hint.replace('—', ','));
  });
  $$('[data-i]', app).forEach((b) => b.onclick = () => { sfx.tap(); go('trace', setKey, +b.dataset.i); });
};

/* ================================================================== tracing engine */
const SVGNS = 'http://www.w3.org/2000/svg';
const measurer = (() => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.style.position = 'absolute';
  const pth = document.createElementNS(SVGNS, 'path'); s.appendChild(pth); document.body.appendChild(s); return pth; })();
const sampleCache = {};
/** Points every ~2 units along each stroke of a glyph, in glyph units. */
function glyphSamples(ch) {
  if (sampleCache[ch]) return sampleCache[ch];
  const out = GLYPHS[ch].map((d) => {
    measurer.setAttribute('d', d);
    const len = measurer.getTotalLength();
    const n = Math.max(2, Math.ceil(len / 2) + 1);
    const pts = [];
    for (let i = 0; i < n; i++) { const q = measurer.getPointAtLength((len * i) / (n - 1)); pts.push([q.x, q.y]); }
    return pts;
  });
  sampleCache[ch] = out;
  return out;
}

SCREENS.trace = function (setKey, idx) {
  const p = me(); const set = SETS[setKey];
  const ch = set.items[idx];
  const key = setKey + ':' + ch;
  const mode = S.mode || 'easy';
  const isNum = setKey === 'num';
  const word = isNum ? null : WORDS[ch.toUpperCase()];
  const pic = isNum ? (+ch === 0 ? '⭕' : COUNT_EMO[+ch % COUNT_EMO.length]) : word[1];
  const label = isNum ? `<b>${ch}</b> &nbsp;${NUM_WORDS[+ch]}` : `<b>${ch}</b> for ${word[0]}`;
  const paths = GLYPHS[ch].map((d) => new Path2D(d));
  const samples = glyphSamples(ch);
  const nS = samples.length;
  const TOL = mode === 'magic' ? 14 : 11, LOOK = 9;
  let color = S.crayon && CRAYONS.includes(S.crayon) ? S.crayon : CRAYONS[0];

  app.innerHTML = `<div class="screen fit trace">
    <div class="topbar">${backBtn()}<div class="word"><span class="pic">${pic}</span><span class="w">${label}</span></div>
      <button class="icon-btn" data-say aria-label="Hear it">${ICON.speak}</button></div>
    <div class="stage">
      <button class="icon-btn side" data-prev aria-label="Previous">${ICON.prev}</button>
      <div class="board" id="board">
        <canvas class="road" id="rc"></canvas><canvas id="dc"></canvas><canvas id="ic"></canvas>
        <div class="arrow hide" id="arrow"><svg viewBox="0 0 30 30"><path d="M8 6 L22 15 L8 24" fill="none" stroke="#2ecc9a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div class="startdot hide" id="sd">1</div>
        <div class="hand" id="hand">👆</div>
        <div class="steps">${'<i></i>'.repeat(nS)}</div>
      </div>
      <button class="icon-btn side" data-next aria-label="Next">${ICON.next}</button>
    </div>
    <div class="tools">
      <div class="crayons">${CRAYONS.map((c) => `<button class="crayon ${c === color ? 'on' : ''}" data-c="${c}" style="--c:${c}" aria-label="Crayon"></button>`).join('')}</div>
      <button class="icon-btn" data-watch aria-label="Watch me">${ICON.watch}</button>
      <button class="icon-btn" data-redo aria-label="Start again">${ICON.redo}</button>
    </div>
  </div>`;
  setBack(() => { if (ADV) { ADV = false; go('home'); } else go('grid', setKey); });

  const board = $('#board'), rc = $('#rc'), dc = $('#dc'), ic = $('#ic');
  const rctx = rc.getContext('2d'), dctx = dc.getContext('2d'), ictx = ic.getContext('2d');
  const sd = $('#sd'), arrow = $('#arrow'), hand = $('#hand');
  let W = 300, H = 300, dpr = 1, u = 3, tx = 0, ty = 0;
  let ink = [];                 // [{c, pts:[[ux,uy]...]}] in glyph units
  let curInk = null, activeId = null, lastU = null;
  let cur = 0; const ptr = new Array(nS).fill(0);
  let inkTotal = 0, inkGood = 0, misses = 0, gained = 0;
  let busy = false, finished = false, lastSpark = 0, demoRaf = 0;

  const toPx = (x, y) => [tx + x * u, ty + y * u];
  function layout() {
    const stage = $('.stage', app);
    const sideW = innerWidth > 560 ? 150 : 0;
    // square on tablets / landscape, a little taller on portrait phones so letters can be bigger
    W = Math.floor(Math.max(220, Math.min(stage.clientWidth - sideW, 760)));
    H = Math.floor(Math.max(220, Math.min(stage.clientHeight - 6, W * 1.3)));
    if (H < W) W = H;
    dpr = Math.min(3, devicePixelRatio || 1);
    board.style.width = W + 'px'; board.style.height = H + 'px';
    for (const c of [rc, dc, ic]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    u = Math.min(W / 98, H / 104); tx = W / 2 - 50 * u; ty = H / 2 - 60 * u;
    drawRoad(); drawDone(); drawInk(); placeStart();
  }
  function inUnits(ctx) { ctx.setTransform(dpr * u, 0, 0, dpr * u, dpr * tx, dpr * ty); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  function drawRoad() {
    const g = rctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, rc.width, rc.height);
    inUnits(g);
    // writing lines (top, middle dashed; base line solid)
    const line = (y, col, w, dash) => { g.setLineDash(dash || []); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(-tx / u + 6, y); g.lineTo((W - tx) / u - 6, y); g.stroke(); };
    line(20, '#ddd5fb', 0.6, [2.5, 2.5]); line(50, '#ddd5fb', 0.6, [2.5, 2.5]); line(80, '#ffb4c2', 0.9); g.setLineDash([]);
    if (mode === 'dots') {
      g.fillStyle = '#a28ff7';
      samples.forEach((pts, i) => { for (let j = 0; j < pts.length; j += 2) { g.beginPath(); g.arc(pts[j][0], pts[j][1], i === cur ? 1.9 : 1.6, 0, 7); g.fill(); } });
      return;
    }
    for (const p2 of paths) { g.strokeStyle = '#ddd3fc'; g.lineWidth = 17; g.stroke(p2); }
    for (const p2 of paths) { g.strokeStyle = '#f5f1ff'; g.lineWidth = 13; g.stroke(p2); }
    g.setLineDash([2.6, 3.4]); g.strokeStyle = '#b9a8f6'; g.lineWidth = 1.3;
    for (const p2 of paths) g.stroke(p2);
    g.setLineDash([]);
  }
  function drawDone() {
    const g = dctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, dc.width, dc.height);
    inUnits(g);
    for (let i = 0; i < cur && i < nS; i++) { g.strokeStyle = color + '40'; g.lineWidth = 15; g.stroke(paths[i]); }
  }
  function strokeInk(g, s) {
    g.strokeStyle = s.c; g.fillStyle = s.c; g.lineWidth = 9.5;
    if (s.pts.length === 1) { g.beginPath(); g.arc(s.pts[0][0], s.pts[0][1], 4.75, 0, 7); g.fill(); return; }
    g.beginPath(); g.moveTo(s.pts[0][0], s.pts[0][1]);
    for (let i = 1; i < s.pts.length; i++) g.lineTo(s.pts[i][0], s.pts[i][1]);
    g.stroke();
  }
  function drawInk() { const g = ictx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, ic.width, ic.height); inUnits(g); ink.forEach((s) => strokeInk(g, s)); }
  function placeStart() {
    $$('.steps i', board).forEach((el, i) => el.classList.toggle('on', i < cur));
    if (cur >= nS) { sd.classList.add('hide'); arrow.classList.add('hide'); return; }
    const pts = samples[cur];
    const [x, y] = toPx(pts[0][0], pts[0][1]);
    sd.textContent = cur + 1; sd.style.left = x + 'px'; sd.style.top = y + 'px';
    sd.classList.remove('hide');
    if (pts.length > 6) {
      const k = Math.min(pts.length - 1, 9), k0 = Math.max(0, k - 2);
      const [ax, ay] = toPx(pts[k][0], pts[k][1]);
      const ang = Math.atan2(pts[k][1] - pts[k0][1], pts[k][0] - pts[k0][0]);
      arrow.style.left = ax + 'px'; arrow.style.top = ay + 'px'; arrow.style.transform = `rotate(${ang}rad)`;
      arrow.classList.toggle('hide', mode === 'magic');
    } else arrow.classList.add('hide');
    if (mode === 'dots') drawRoad();
  }

  /* --- demo: a finger shows how to write it, stroke by stroke */
  function demo(then) {
    if (busy) return;
    busy = true; cancelAnimationFrame(demoRaf);
    rc.classList.remove('hide');
    const g = ictx; let s = 0, t0 = performance.now();
    const durOf = (pts) => Math.min(1500, Math.max(500, pts.length * 22));
    hand.classList.add('on');
    const step = (now) => {
      if (s >= nS) {
        hand.classList.remove('on'); busy = false; drawInk();
        if (mode === 'magic') setTimeout(() => { if (!finished) rc.classList.add('hide'); }, 900);
        then && then(); return;
      }
      const pts = samples[s], k = Math.min(1, (now - t0) / durOf(pts));
      const n = Math.max(1, Math.round(k * (pts.length - 1)));
      drawInk(); inUnits(g);
      for (let i = 0; i <= s; i++) {
        const P = i < s ? samples[i] : pts.slice(0, n + 1);
        g.strokeStyle = 'rgba(255,184,31,.9)'; g.lineWidth = 6; g.beginPath(); g.moveTo(P[0][0], P[0][1]); P.forEach((q) => g.lineTo(q[0], q[1])); g.stroke();
      }
      const [hx, hy] = toPx(pts[n][0], pts[n][1]);
      hand.style.transform = `translate(${hx}px, ${hy}px)`;
      if (k >= 1) { s++; t0 = now + 250; }
      demoRaf = requestAnimationFrame(step);
    };
    demoRaf = requestAnimationFrame(step);
  }

  /* --- following the road */
  function feedPoint(x, y) {
    // neatness: is this ink near any part of the letter?
    inkTotal++;
    let near = false;
    for (const pts of samples) { for (const q of pts) { const dx = q[0] - x, dy = q[1] - y; if (dx * dx + dy * dy <= TOL * TOL * 1.3) { near = true; break; } } if (near) break; }
    if (near) inkGood++;
    if (cur >= nS) return;
    const pts = samples[cur]; const from = ptr[cur]; const lim = Math.min(pts.length - 1, from + LOOK);
    let best = -1;
    for (let j = from; j <= lim; j++) { const dx = pts[j][0] - x, dy = pts[j][1] - y; if (dx * dx + dy * dy <= TOL * TOL) best = j; }
    if (best < 0) return;
    gained += best + 1 - from; ptr[cur] = best + 1;
    if (ptr[cur] >= pts.length - 1) strokeDone();
  }
  function strokeDone() {
    cur++;
    sfx.stroke();
    drawDone(); placeStart();
    if (cur >= nS) setTimeout(finish, 350);
    else if (mode !== 'magic') say(pick(['Good!', 'Yes!', 'Now number ' + (cur + 1), 'Great!']));
  }
  function toUnits(e) { const r = ic.getBoundingClientRect(); return [((e.clientX - r.left) * (W / r.width) - tx) / u, ((e.clientY - r.top) * (H / r.height) - ty) / u]; }
  function sparkle(e) {
    const now = performance.now(); if (now - lastSpark < 90) return; lastSpark = now;
    const el = document.createElement('div'); el.className = 'spark'; el.textContent = pick(['✨', '⭐', '💫']);
    el.style.left = e.clientX - 10 + 'px'; el.style.top = e.clientY - 10 + 'px';
    el.style.setProperty('--dx', (Math.random() - 0.5) * 80 + 'px'); el.style.setProperty('--dy', -Math.random() * 60 - 20 + 'px');
    document.body.appendChild(el); setTimeout(() => el.remove(), 700);
  }
  ic.addEventListener('pointerdown', (e) => {
    if (finished || busy || activeId !== null) return;
    e.preventDefault(); actx();
    activeId = e.pointerId; try { ic.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    const pt = toUnits(e);
    curInk = { c: color, pts: [pt] }; ink.push(curInk); lastU = pt; gained = 0;
    inUnits(ictx); strokeInk(ictx, curInk);
    feedPoint(pt[0], pt[1]);
  });
  ic.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeId || !curInk) return;
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
    inUnits(ictx); ictx.strokeStyle = curInk.c; ictx.lineWidth = 9.5;
    for (const ev of evs) {
      const pt = toUnits(ev);
      ictx.beginPath(); ictx.moveTo(lastU[0], lastU[1]); ictx.lineTo(pt[0], pt[1]); ictx.stroke();
      // walk in small steps so fast fingers still follow the road
      const dx = pt[0] - lastU[0], dy = pt[1] - lastU[1], steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2));
      for (let i = 1; i <= steps; i++) feedPoint(lastU[0] + (dx * i) / steps, lastU[1] + (dy * i) / steps);
      curInk.pts.push(pt); lastU = pt;
    }
    sparkle(e);
  });
  const end = (e) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    const s = curInk; curInk = null;
    if (finished || !s) return;
    // a long scribble that barely moved along the road = wrong start or wrong direction
    let inkLen = 0; for (let i = 1; i < s.pts.length; i++) inkLen += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
    if (inkLen > 12 && gained * 2 < inkLen * 0.4 && cur < nS) {
      misses++;
      sfx.soft();
      board.classList.remove('wiggle'); void board.offsetWidth; board.classList.add('wiggle');
      say(`Start at the green dot, and follow the arrow!`);
      if (mode === 'magic' && misses >= 2) { rc.classList.remove('hide'); setTimeout(() => { if (!finished) rc.classList.add('hide'); }, 1600); }
    }
  };
  ic.addEventListener('pointerup', end); ic.addEventListener('pointercancel', end);

  function reset() {
    ink = []; cur = 0; ptr.fill(0); inkTotal = inkGood = misses = 0; finished = false;
    drawDone(); drawInk(); placeStart();
  }

  /* --- finishing + stars */
  function finish() {
    if (finished) return;
    finished = true;
    rc.classList.remove('hide');
    const neat = inkTotal ? inkGood / inkTotal : 1;
    const stars = neat >= 0.85 && misses <= 1 ? 3 : neat >= 0.65 && misses <= 3 ? 2 : 1;
    const bonus = mode === 'magic' && stars === 3 ? 1 : 0;
    window.__lastTrace = { neat, misses, stars };
    p.best[key] = Math.max(p.best[key] || 0, stars);
    p.tries[key] = (p.tries[key] || 0) + 1;
    p.lastPlayed = Date.now();
    const parties = addStars(stars + bonus);
    const next = afterActivity('Next ➜', () => go('trace', setKey, (idx + 1) % set.items.length));
    // picture of what the child wrote
    const snapC = document.createElement('canvas'); snapC.width = snapC.height = 220;
    const sg = snapC.getContext('2d'); sg.fillStyle = '#f8f5ff'; sg.fillRect(0, 0, 220, 220); const side = Math.min(dc.width, dc.height), ox = (dc.width - side) / 2, oy = (dc.height - side) / 2;
    for (const c of [dc, ic]) sg.drawImage(c, ox, oy, side, side, 0, 0, 220, 220);
    const snap = snapC.toDataURL('image/png');
    const praise = pick(PRAISE[stars]);
    const show = (animate) => {
      const el = popup(`<div class="hero">${mascot(stars === 3 ? 'wow' : 'happy', stars === 3 ? 'cheer' : '')}</div>
        <h2>${praise}</h2>
        <div class="bigstars">${[0, 1, 2].map((i) => `<span class="${!animate && i < stars ? 'on' : ''}">⭐</span>`).join('')}</div>
        <img class="snap" src="${snap}" alt="What you wrote">
        <p>${bonus ? '✨ Memory bonus! ' : ''}+${stars + bonus} star${stars + bonus > 1 ? 's' : ''}</p>
        <div class="acts"><button class="btn ghost" data-again>↻ Again</button><button class="btn lg" data-nx>${next.label}</button></div>`, (el) => {
        $('[data-again]', el).onclick = () => { sfx.tap(); go('trace', setKey, idx); };
        $('[data-nx]', el).onclick = () => { sfx.tap(); next.run(); };
      });
      if (animate) $$('.bigstars span', el).forEach((s, i) => { if (i < stars) setTimeout(() => { s.classList.add('on'); sfx.star(i); }, 350 + i * 380); });
    };
    show(true);
    setTimeout(() => {
      if (stars === 3) confetti();
      say(`${praise} ${describe(ch)}!`);
      if (parties.length) setTimeout(() => celebrate(parties, () => show(false)), 1500);
    }, 350 + stars * 380);
  }

  /* --- buttons */
  $$('[data-c]', app).forEach((b) => b.onclick = () => { color = S.crayon = b.dataset.c; save(); sfx.pop(); $$('[data-c]', app).forEach((x) => x.classList.toggle('on', x === b)); drawDone(); });
  $('[data-redo]', app).onclick = () => { sfx.tap(); reset(); if (mode === 'magic') demo(); };
  $('[data-watch]', app).onclick = () => { sfx.tap(); say('Watch me!'); demo(); };
  $('[data-say]', app).onclick = () => { sfx.tap(); say(describe(ch)); };
  $('[data-prev]', app).onclick = () => { sfx.tap(); go('trace', setKey, (idx - 1 + set.items.length) % set.items.length); };
  $('[data-next]', app).onclick = () => { sfx.tap(); go('trace', setKey, (idx + 1) % set.items.length); };

  const onResize = () => { if (!busy) layout(); };
  addEventListener('resize', onResize);
  onCleanup(() => { removeEventListener('resize', onResize); cancelAnimationFrame(demoRaf); });

  fontsReady.then(() => {
    layout();
    const firstTime = !(p.tries[key] > 0);
    if (mode === 'magic') { say(`Watch carefully, then write ${describe(ch)} by yourself!`); setTimeout(() => demo(), 600); }
    else if (firstTime && mode === 'easy') { say(`${describe(ch)}. Watch me first!`); setTimeout(() => demo(() => say('Your turn! Start at the green dot.')), 900); }
    else say(`${mode === 'dots' ? 'Join the dots for' : 'Trace'} ${describe(ch)}. Start at the green dot!`);
  });
};

/* ================================================================== games */
function gameFrame(id, title, body) {
  app.innerHTML = `<div class="screen fit">
    <div class="gtop">${backBtn()}<div class="track"><i id="trk"></i></div><span class="pill"><span class="ic star">⭐</span>${me().stars}</span></div>
    ${body}</div>`;
  setBack(() => { ADV = false; go('home'); });
  let score = 0, misses = 0;
  return {
    right() { score++; $('#trk').style.width = (score / ROUNDS) * 100 + '%'; sfx.good(); return score >= ROUNDS; },
    wrong() { misses++; sfx.soft(); },
    end(again) {
      const stars = misses <= 1 ? 3 : misses <= 4 ? 2 : 1;
      const p = me(); p.games[id] = Math.max(p.games[id] || 0, stars); save();
      const parties = addStars(stars);
      const next = afterActivity('Play again ↻', again);
      sfx.win(); confetti(180);
      const praise = pick(PRAISE[stars]);
      say(`${praise} You finished ${title}!`);
      const show = () => popup(`<div class="hero">${mascot('wow', 'cheer')}</div><h2>${praise}</h2>
        <div class="bigstars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">⭐</span>`).join('')}</div>
        <p>+${stars} star${stars > 1 ? 's' : ''}</p>
        <div class="acts"><button class="btn ghost" data-home>🏠 Home</button><button class="btn lg mint" data-nx>${next.label}</button></div>`, (el) => {
        $('[data-home]', el).onclick = () => { sfx.tap(); ADV = false; go('home'); };
        $('[data-nx]', el).onclick = () => { sfx.tap(); next.run(); };
      });
      show();
      if (parties.length) setTimeout(() => celebrate(parties, show), 1300);
    },
  };
}
const GRASS = '<svg class="grass" viewBox="0 0 400 56" preserveAspectRatio="none"><path fill="#9fdea9" d="M0 24 C80 6 160 30 240 18 S360 4 400 16 V56 H0z"/><path fill="#86d293" d="M0 40 C100 26 220 46 300 34 S380 28 400 34 V56 H0z"/></svg>';

SCREENS.play_balloon = function (kind) {
  const pool = kind === '123' ? NUMBERS.slice(1) : UPPER;
  const f = gameFrame('balloon', 'Balloon Pop', `
    <div class="ask">Pop the <span class="target" id="tg"></span></div>
    <div class="sky-field" id="fb">${GRASS}</div>`);
  const fb = $('#fb'), tg = $('#tg');
  const COLORS = ['#ff6b81', '#6c4cf1', '#ffb31a', '#22b37f', '#2a9ae0', '#ff8a3d'];
  let target = null, balloons = [], raf = 0, last = performance.now(), spawnT = 0, since = 0, over = false;
  function newTarget() { let t; do { t = pick(pool); } while (t === target); target = t; tg.textContent = t; since = 0; say(`Pop the ${spoken(t)}!`); }
  function spawn() {
    const W = fb.clientWidth, H = fb.clientHeight;
    const c = Math.random() < 0.4 || since >= 2 ? target : pick(pool);
    since = c === target ? 0 : since + 1;
    const el = document.createElement('div'); el.className = 'balloon';
    el.innerHTML = `<div class="b" style="--c:${pick(COLORS)}">${c}</div>`;
    const b = { el, c, x: 10 + Math.random() * Math.max(10, W - 116), y: H + 10, v: 42 + Math.random() * 28 + Math.min(W, 900) * 0.02, sway: Math.random() * 6, dead: false };
    el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); tapB(b); });
    fb.appendChild(el); balloons.push(b);
  }
  function tapB(b) {
    if (b.dead || over) return;
    if (b.c === target) {
      b.dead = true; b.el.classList.add('popped'); sfx.pop();
      const burst = document.createElement('div'); burst.className = 'burst'; burst.textContent = '✨';
      burst.style.left = b.x + 28 + 'px'; burst.style.top = b.y + 30 + 'px'; fb.appendChild(burst); setTimeout(() => burst.remove(), 600);
      setTimeout(() => b.el.remove(), 300);
      if (f.right()) { over = true; setTimeout(() => f.end(() => go('play_balloon', kind)), 500); } else setTimeout(newTarget, 450);
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

SCREENS.play_count = function () {
  const f = gameFrame('count', 'Count and Tap', `
    <div class="ask" id="q">How many?</div>
    <div class="card tray" id="objs"></div>
    <div class="choices" id="ch"></div>`);
  let lastN = 0;
  function round() {
    let n; do { n = 1 + rnd(10); } while (n === lastN); lastN = n;
    const e = pick(COUNT_EMO);
    $('#q').innerHTML = `How many <span style="font-size:1.3em">${e}</span> ?`;
    say('How many? Tap each one to count!');
    let counted = 0;
    $('#objs').innerHTML = Array.from({ length: n }, () => `<button class="obj">${e}</button>`).join('');
    $$('.obj', app).forEach((o) => o.onclick = () => {
      if (o.classList.contains('counted')) return;
      counted++; o.classList.add('counted'); o.insertAdjacentHTML('beforeend', `<span class="n">${counted}</span>`);
      note(523 * Math.pow(1.06, counted * 2), 0.25, 0.12); say(NUM_WORDS[counted]);
    });
    const opts = new Set([n]);
    while (opts.size < 3) { const d = n + (rnd(2) ? 1 : -1) * (1 + rnd(3)); if (d >= 1 && d <= 10) opts.add(d); }
    $('#ch').innerHTML = shuffle([...opts]).map((x) => `<button class="choice" data-v="${x}">${x}</button>`).join('');
    $$('#ch .choice', app).forEach((b) => b.onclick = () => {
      if (+b.dataset.v === n) {
        b.classList.add('right'); $$('#ch .choice', app).forEach((x) => x.style.pointerEvents = 'none');
        say(`Yes! ${NUM_WORDS[n]}!`); confetti(40);
        if (f.right()) setTimeout(() => f.end(() => go('play_count')), 900); else setTimeout(round, 1300);
      } else { b.classList.add('wrong'); f.wrong(); say('Let us count again!'); }
    });
  }
  round();
};

SCREENS.play_picture = function () {
  const f = gameFrame('picture', 'Picture Match', `
    <div class="ask">Which one starts with…</div>
    <div class="hero-letter" id="L"></div>
    <div class="choices" id="ch"></div>`);
  const order = shuffle(UPPER); let i = 0;
  function round() {
    const L = order[i++ % order.length];
    $('#L').textContent = L + L.toLowerCase();
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

SCREENS.play_next = function () {
  const f = gameFrame('next', 'What Comes Next', `
    <div class="ask" id="q">What is missing?</div>
    <div class="seq" id="seq"></div>
    <div class="choices" id="ch"></div>`);
  function round() {
    const list = rnd(2) ? UPPER : NUMBERS.slice(1);
    const start = rnd(list.length - 3);
    const seq = list.slice(start, start + 4);
    const miss = rnd(2) ? 3 : 1 + rnd(2);
    const ans = seq[miss];
    const q = miss === 3 ? 'What comes next?' : 'What is missing?';
    $('#q').textContent = q; say(q);
    $('#seq').innerHTML = seq.map((c, k) => k === miss ? '<span class="q">?</span>' : `<span>${c}</span>`).join('');
    const opts = new Set([ans]);
    while (opts.size < 3) opts.add(pick(list));
    $('#ch').innerHTML = shuffle([...opts]).map((x) => `<button class="choice" data-v="${x}">${x}</button>`).join('');
    $$('#ch .choice', app).forEach((b) => b.onclick = () => {
      if (b.dataset.v === ans) {
        b.classList.add('right'); $$('#ch .choice', app).forEach((x) => x.style.pointerEvents = 'none');
        const qEl = $('#seq .q'); qEl.textContent = ans; qEl.classList.remove('q');
        say(seq.map(spoken).join(', ')); confetti(40);
        if (f.right()) setTimeout(() => f.end(() => go('play_next')), 1500); else setTimeout(round, 2200);
      } else { b.classList.add('wrong'); f.wrong(); say('Not that one. Try again!'); }
    });
  }
  round();
};

SCREENS.play_pair = function () {
  const f = gameFrame('pair', 'Big and Small', `
    <div class="ask">Find the small letter for</div>
    <div class="hero-letter" id="L"></div>
    <div class="choices" id="ch"></div>`);
  const order = shuffle(UPPER); let i = 0;
  function round() {
    const L = order[i++ % order.length], l = L.toLowerCase();
    $('#L').textContent = L;
    say(`Find small ${spoken(L)}!`);
    const others = shuffle(LOWER.filter((x) => x !== l)).slice(0, 3);
    $('#ch').innerHTML = shuffle([l, ...others]).map((x) => `<button class="choice" data-v="${x}">${x}</button>`).join('');
    $$('#ch .choice', app).forEach((b) => b.onclick = () => {
      if (b.dataset.v === l) {
        b.classList.add('right'); $$('#ch .choice', app).forEach((x) => x.style.pointerEvents = 'none');
        say(`Yes! Big ${spoken(L)}, small ${spoken(L)}!`); confetti(40);
        if (f.right()) setTimeout(() => f.end(() => go('play_pair')), 1100); else setTimeout(round, 1500);
      } else { b.classList.add('wrong'); f.wrong(); say(`That is ${spoken(b.dataset.v)}. Try again!`); }
    });
  }
  round();
};

/* ================================================================== my stars */
SCREENS.trophy = function () {
  const p = me(); const r = rankOf(p.stars); const nx = nextRank(p.stars);
  const pct = nx ? ((p.stars - r.at) / (nx.at - r.at)) * 100 : 100;
  const have = stickerCount(p.stars);
  const sorted = S.profiles.slice().sort((a, b) => b.stars - a.stars);
  app.innerHTML = `<div class="screen">
    <div class="topbar">${backBtn()}<h1>My Stars</h1><div class="sp"></div></div>
    <div class="card rankcard">
      <div class="re">${r.e}</div><div class="rn">${esc(p.name)} is a ${r.n}!</div>
      <div class="rs">⭐ ${p.stars} stars &nbsp;·&nbsp; 🔥 ${streakOf(p)} day streak</div>
      <div class="prog"><i style="width:${pct}%"></i></div>
      <div class="rs">${nx ? `${nx.at - p.stars} more ⭐ to become a ${nx.e} ${nx.n}` : 'You reached the top rank! 👑'}</div>
    </div>
    <div class="sec"><span class="badge" style="background:var(--sun-l)">🪜</span><h2>Star ranks</h2></div>
    <div class="ladder">${RANKS.map((x) => `<div class="${p.stars >= x.at ? (x === r ? 'cur' : '') : 'lock'}"><b>${x.e}</b>${x.n}<br>⭐ ${x.at}</div>`).join('')}</div>
    <div class="sec"><span class="badge" style="background:var(--coral-l)">🏅</span><h2>Star board</h2></div>
    <div class="leader">${sorted.map((k, i) => `<div class="card row ${k.id === p.id ? 'me' : ''}"><span class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span>
      <span class="avatar" style="--bg:${avBg(k.avatar)}">${k.avatar}</span><span class="nm">${esc(k.name)}</span><span class="sc">${rankOf(k.stars).e} ⭐ ${k.stars}</span></div>`).join('')}</div>
    ${S.profiles.length < 2 ? '<div class="card note" style="margin-top:12px">👫 Add a brother, sister or friend on the first screen to race on the star board!</div>' : ''}
    <div class="sec"><span class="badge" style="background:var(--mint-l)">🎁</span><h2>Sticker book · ${have}/${STICKERS.length}</h2></div>
    <div class="stickers">${STICKERS.map((s, i) => i < have ? `<div>${s}</div>` : `<div class="lock">⭐${(i + 1) * STICKER_EVERY}</div>`).join('')}</div>
    <div style="text-align:center;margin-top:26px"><button class="btn ghost" data-parent>👪 For grown-ups</button></div>
  </div>`;
  setBack(() => go('home'));
  say(`${p.name}, you have ${p.stars} stars. You are a ${r.n}!`);
  $('[data-parent]', app).onclick = () => { sfx.tap(); parentGate(() => go('report')); };
};

function parentGate(ok) {
  const a = 3 + rnd(6), b = 2 + rnd(7);
  const opts = shuffle([a + b, a + b + 1 + rnd(3), Math.max(1, a + b - 1 - rnd(3))]);
  popup(`<div class="hero"><span class="big">👪</span></div><h2>For grown-ups</h2><p>What is ${a} + ${b}?</p>
    <div class="acts">${opts.map((o) => `<button class="btn ghost" data-v="${o}">${o}</button>`).join('')}</div>
    <div class="acts"><button class="btn coral" data-x>Cancel</button></div>`, (el) => {
    $$('[data-v]', el).forEach((x) => x.onclick = () => { closePopup(); if (+x.dataset.v === a + b) ok(); else sfx.soft(); });
    $('[data-x]', el).onclick = closePopup;
  });
}

SCREENS.report = function () {
  const p = me();
  const block = (k) => {
    const s = SETS[k];
    const cells = s.items.map((c) => { const b = p.best[k + ':' + c] || 0; return `<span class="s${b}">${c}</span>`; }).join('');
    return `<div class="sec"><h2>${s.title} · ${s.name}</h2></div><div class="card note"><div class="rep">${cells}</div></div>`;
  };
  const weak = [];
  for (const k of Object.keys(SETS)) for (const c of SETS[k].items) if ((p.tries[k + ':' + c] || 0) > 0 && (p.best[k + ':' + c] || 0) < 2) weak.push(c);
  const tried = Object.keys(p.tries).length;
  const total = Object.values(SETS).reduce((a, s) => a + s.items.length, 0);
  app.innerHTML = `<div class="screen">
    <div class="topbar">${backBtn()}<h1>${esc(p.name)}’s progress</h1><div class="sp"></div></div>
    <div class="card note">
      ⭐ <b>${p.stars}</b> stars · ${rankOf(p.stars).e} ${rankOf(p.stars).n}<br>
      📅 Played on <b>${p.days || 0}</b> day(s) · 🔥 streak <b>${streakOf(p)}</b><br>
      ✏️ Practised <b>${tried}</b> of ${total} letters &amp; numbers<br>
      🎮 ${GAMES.map((g) => `${g.e} ${'⭐'.repeat(p.games[g.id] || 0) || '–'}`).join(' &nbsp; ')}<br>
      ${weak.length ? `🔁 Needs more practice: <b style="font-family:Andika;font-size:1.2em">${weak.join(' ')}</b>` : '👍 Nothing flagged for extra practice yet.'}
    </div>
    <div class="legend"><span><i style="background:#efebf8"></i>Not tried</span><span><i style="background:#ffe0c7"></i>1★</span><span><i style="background:#fff0b0"></i>2★</span><span><i style="background:#c4f2dc"></i>3★</span></div>
    ${block('upper')}${block('lower')}${block('num')}
    <div class="sec"><h2>How Little Stars teaches</h2></div>
    <div class="card note">
      • <b>Correct letter formation.</b> Every letter is taught with its stroke order and direction — the green dot shows where to start, the arrow shows which way. Stars only come by following the strokes in order.<br>
      • <b>Watch → Trace → Write.</b> First a finger demo, then tracing (road or dots), then <i>Memory</i> mode where the child writes from recall.<br>
      • <b>Say it, see it, write it.</b> Each letter is spoken with a picture word (A for Apple) to link sound, shape and meaning.<br>
      • <b>Short daily adventure.</b> 5 bite-size activities mixing a new letter, a number, a review of a weak letter and two games. About 10 minutes is ideal at this age.<br>
      • <b>Encouragement only.</b> Mistakes get a gentle hint, never a buzzer or a lost star.
    </div>
    <div class="toggles">
      <button class="toggle" data-rename>✏️ Rename</button>
      <button class="toggle" data-reset>🔄 Reset progress</button>
      <button class="toggle" data-del>🗑️ Remove child</button>
    </div>
  </div>`;
  setBack(() => go('trophy'));
  $('[data-rename]', app).onclick = () => { const n = prompt('New name', p.name); if (n && n.trim()) { p.name = n.trim().slice(0, 16); save(); go('report'); } };
  $('[data-reset]', app).onclick = () => { if (confirm(`Reset all stars and progress for ${p.name}?`)) { Object.assign(p, { stars: 0, best: {}, tries: {}, games: {}, days: 0, streak: 0, streakDay: null, daily: null }); save(); go('report'); } };
  $('[data-del]', app).onclick = () => { if (confirm(`Remove ${p.name} and all their stars?`)) { S.profiles = S.profiles.filter((x) => x.id !== p.id); S.current = null; save(); go('who'); } };
};

/* ================================================================== boot */
const fontsReady = (document.fonts && document.fonts.load)
  ? Promise.all([document.fonts.load('700 40px "Andika"'), document.fonts.load('600 20px "Fredoka"')]).catch(() => {}).then(() => new Promise((r) => setTimeout(r, 30)))
  : Promise.resolve();
addEventListener('pointerdown', () => actx(), { once: true });
fontsReady.then(() => { if (me()) go('home'); else go('who'); });

if (!NATIVE && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
