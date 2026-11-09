/* Ember — habit tracker. Vanilla JS, offline-first, data stays on the device. */
'use strict';

/* ================= Constants ================= */
const STORE = 'ember.v1';
const NATIVE = window.EmberAndroid || null; // present inside the Android app
const VERSION = '1.0.0';
const COLORS = ['#FF6B6B', '#FF8A3D', '#FFC23D', '#A6E35A', '#3DDC97', '#2CC7C9', '#4DA8FF', '#7C7CFF', '#B26BFF', '#FF6BC1'];
const EMOJIS = ['💧', '🧘', '📖', '💪', '🏃', '🚶', '✍️', '😴', '📵', '🥗', '🙏', '🧠', '🎯', '🧹', '☀️', '💰',
  '🎸', '🎨', '💊', '🦷', '🍎', '🚭', '🚴', '🏊', '🤸', '📝', '⏰', '❤️', '🌱', '💻', '🗣️', '🎧',
  '🛏️', '🚿', '🧴', '🍵', '📞', '🌊', '🔥', '⭐'];
const TIMES = [
  { id: 'morning', label: 'Morning', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { id: 'evening', label: 'Evening', icon: '🌙' },
  { id: 'anytime', label: 'Anytime', icon: '✨' },
];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MILESTONES = [3, 7, 14, 21, 30, 50, 66, 100, 150, 200, 250, 365, 500, 1000];
const STRENGTH_ALPHA = 0.07; // exponential smoothing per scheduled day

const TEMPLATES = [
  { name: 'Drink water', emoji: '💧', color: '#4DA8FF', target: 8, unit: 'glasses', time: 'anytime', freq: { type: 'daily' }, identity: 'takes care of my body', stack: 'wake up', tiny: 'Drink one glass' },
  { name: 'Meditate', emoji: '🧘', color: '#B26BFF', target: 1, time: 'morning', freq: { type: 'daily' }, identity: 'stays calm under pressure', stack: 'brush my teeth', tiny: 'Take 3 slow breaths' },
  { name: 'Read', emoji: '📖', color: '#FFC23D', target: 1, time: 'evening', freq: { type: 'daily' }, identity: 'is always learning', stack: 'get into bed', tiny: 'Read one page' },
  { name: 'Workout', emoji: '💪', color: '#FF6B6B', target: 1, time: 'anytime', freq: { type: 'weekly', times: 4 }, identity: 'does the hard things', stack: 'finish work', tiny: 'Put on workout clothes' },
  { name: 'Walk 10 minutes', emoji: '🚶', color: '#3DDC97', target: 1, time: 'afternoon', freq: { type: 'daily' }, identity: 'moves every day', stack: 'eat lunch', tiny: 'Walk to the end of the street' },
  { name: 'Journal', emoji: '✍️', color: '#FF6BC1', target: 1, time: 'evening', freq: { type: 'daily' }, identity: 'reflects and grows', stack: 'finish dinner', tiny: 'Write one sentence' },
  { name: 'Sleep by 11 PM', emoji: '😴', color: '#7C7CFF', target: 1, time: 'evening', freq: { type: 'daily' }, identity: 'protects my energy', stack: 'set my alarm', tiny: 'Phone on the charger, outside the bedroom' },
  { name: 'No phone first hour', emoji: '📵', color: '#2CC7C9', target: 1, time: 'morning', freq: { type: 'daily' }, identity: 'owns my attention', stack: 'wake up', tiny: 'No phone for the first 5 minutes' },
  { name: 'Gratitude', emoji: '🙏', color: '#FF8A3D', target: 3, unit: 'things', time: 'morning', freq: { type: 'daily' }, identity: 'notices the good', stack: 'sit down for breakfast', tiny: 'Name one good thing' },
  { name: 'Deep work', emoji: '🎯', color: '#A6E35A', target: 1, time: 'morning', freq: { type: 'days', days: [1, 2, 3, 4, 5] }, identity: 'does focused, meaningful work', stack: 'open my laptop', tiny: 'Two focused minutes, notifications off' },
  { name: 'Eat greens', emoji: '🥗', color: '#A6E35A', target: 1, time: 'afternoon', freq: { type: 'daily' }, identity: 'fuels my body well', stack: 'plate my lunch', tiny: 'One bite of vegetables' },
  { name: 'Tidy up', emoji: '🧹', color: '#2CC7C9', target: 1, time: 'evening', freq: { type: 'daily' }, identity: 'keeps a calm space', stack: 'brush my teeth at night', tiny: 'Put away one thing' },
  { name: 'Morning sunlight', emoji: '☀️', color: '#FFC23D', target: 1, time: 'morning', freq: { type: 'daily' }, identity: 'starts the day with energy', stack: 'make my tea', tiny: 'Step outside for one minute' },
  { name: 'Save money', emoji: '💰', color: '#3DDC97', target: 1, time: 'anytime', freq: { type: 'daily' }, identity: 'builds wealth patiently', stack: 'get paid or make a purchase', tiny: 'Skip one impulse buy' },
];

const PRINCIPLES = [
  ['Identity', 'Every check-in is a vote for the person you are becoming. You don’t need a majority today — just one more vote.'],
  ['Never miss twice', 'Missing once is an accident. Missing twice is the start of a new pattern. Protect tomorrow.'],
  ['Two-minute rule', 'Make it so small you can’t say no. You can only improve a habit that exists.'],
  ['Patience', 'Habits take around two months on average to feel automatic — and it varies a lot. Trust the curve, not the day.'],
  ['Habit stacking', 'Tie the new habit to something you already do. “After I ___, I will ___” beats “sometime today”.'],
  ['Environment', 'Make the good choice the easy choice. Put the book on the pillow, the shoes by the door.'],
  ['Consistency', 'Intensity is impressive. Consistency is transformative. A small rep today beats a perfect rep someday.'],
  ['Rest', 'Rest days are part of the plan. Skipping on purpose isn’t failing — it’s strategy.'],
  ['Celebrate', 'Celebrate the small win right away. The good feeling is what wires a habit in.'],
  ['Zoom out', 'Progress is rarely a straight line. Judge the month, not the morning.'],
  ['Start', 'Motivation usually shows up after you start, not before. Begin badly — just begin.'],
  ['Promises', 'Self-trust is built by keeping small promises to yourself. Make them small enough to keep.'],
  ['Focus', 'Fewer habits, done daily, beat many habits done sometimes. Add the next one when this one feels easy.'],
  ['Bad days', 'The bad days count double. That’s where the identity is really forged.'],
  ['Visibility', 'What gets tracked gets noticed, and what gets noticed gets better.'],
];

/* ================= Icons ================= */
const I = {
  tick: '<svg class="tick" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M13.5 6.5l4 4"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  archive: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10h14V9M10 13h4"/></svg>',
  restore: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6"/><path d="M4 4v4.6h4.6"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 2.5c1.2 4 6 6.4 6 12A6 6 0 0 1 12 20.5a6 6 0 0 1-6-6c0-2.4 1-4 2.2-5.3.3 2 1.3 3.2 2.6 3.6C10.2 9.4 10.8 5.7 12 2.5Z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
};

/* ================= Date helpers (local time, YYYY-MM-DD keys) ================= */
const pad = n => String(n).padStart(2, '0');
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return key(d); };
const today = () => key(new Date());
const dow = k => parse(k).getDay();
const weekStartKey = k => addDays(k, -((dow(k) - S.settings.weekStart + 7) % 7));
const fmtDate = (k, long) => {
  const d = parse(k);
  return long
    ? d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
    : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};

/* ================= State ================= */
function defaultState() {
  return { v: 1, habits: [], logs: {}, settings: { name: '', theme: 'dark', weekStart: 1, reminder: { on: false, time: '20:00' } }, onboarded: false, dismissed: {} };
}
function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const s = JSON.parse(raw);
      const d = defaultState();
      return Object.assign(d, s, { settings: Object.assign(d.settings, s.settings || {}), dismissed: s.dismissed || {} });
    }
  } catch (e) { /* storage unavailable — run in memory */ }
  return defaultState();
}
let S = load();
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(S)); }
  catch (e) { toast('Couldn’t save — storage is blocked or full'); }
}

const UI = { tab: 'today', date: today(), justDone: null, sheet: null, installEvt: null, rings: {}, onbPicks: null };

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = id => S.habits.find(h => h.id === id);
const active = () => S.habits.filter(h => !h.archived).sort((a, b) => a.order - b.order);
const archived = () => S.habits.filter(h => h.archived).sort((a, b) => a.order - b.order);
const pctTxt = x => x == null ? '—' : Math.round(x * 100) + '%';

/* ================= Habit logic ================= */
const logOf = h => S.logs[h.id] || (S.logs[h.id] = {});
const getV = (h, k) => (S.logs[h.id] || {})[k];
const countOf = (h, k) => { const v = getV(h, k); return typeof v === 'number' ? v : 0; };
const isDone = (h, k) => countOf(h, k) >= h.target;
const isSkip = (h, k) => getV(h, k) === 'skip';
const isWeekly = h => h.freq.type === 'weekly';
function scheduled(h, k) {
  if (k < h.created) return false;
  if (h.freq.type === 'days') return h.freq.days.includes(dow(k));
  return true;
}
function weekCount(h, k) {
  const ws = weekStartKey(k); let c = 0;
  for (let i = 0; i < 7; i++) if (isDone(h, addDays(ws, i))) c++;
  return c;
}
const weekMet = (h, k) => weekCount(h, k) >= h.freq.times;
// Is the habit "satisfied" for this day (for progress)?
const satisfied = (h, k) => isWeekly(h) ? (isDone(h, k) || weekMet(h, k)) : isDone(h, k);

function dayProgress(k) {
  let due = 0, ok = 0;
  for (const h of active()) {
    if (!scheduled(h, k) || isSkip(h, k)) continue;
    due++; if (satisfied(h, k)) ok++;
  }
  return { due, ok, pct: due ? ok / due : 0 };
}

function streak(h) {
  const t = today();
  if (isWeekly(h)) {
    let ws = weekStartKey(t), cur = 0;
    if (!weekMet(h, ws)) ws = addDays(ws, -7);
    while (addDays(ws, 6) >= h.created && weekMet(h, ws)) { cur++; ws = addDays(ws, -7); }
    return cur;
  }
  let k = t, cur = 0;
  if (scheduled(h, k) && !isDone(h, k)) k = addDays(k, -1); // today is still open
  for (let guard = 0; k >= h.created && guard < 5000; guard++, k = addDays(k, -1)) {
    if (!scheduled(h, k)) continue;
    if (isDone(h, k)) cur++;
    else if (!isSkip(h, k)) break;
  }
  return cur;
}
function bestStreak(h) {
  const t = today(); let best = 0, run = 0;
  if (isWeekly(h)) {
    const cw = weekStartKey(t);
    for (let ws = weekStartKey(h.created); ws <= cw; ws = addDays(ws, 7)) {
      if (weekMet(h, ws)) best = Math.max(best, ++run);
      else if (ws !== cw) run = 0;
    }
    return best;
  }
  for (let k = h.created; k <= t; k = addDays(k, 1)) {
    if (!scheduled(h, k)) continue;
    if (isDone(h, k)) best = Math.max(best, ++run);
    else if (!isSkip(h, k) && k !== t) run = 0;
  }
  return best;
}
// Completion rate over the last n days (pending today and rest days excluded)
function rate(h, n = 30) {
  const t = today(); let start = addDays(t, -(n - 1));
  if (start < h.created) start = h.created;
  let tot = 0, ok = 0;
  if (isWeekly(h)) {
    const cw = weekStartKey(t);
    for (let ws = weekStartKey(start); ws <= cw; ws = addDays(ws, 7)) {
      const c = weekCount(h, ws);
      if (ws === cw && c < h.freq.times) continue;
      tot++; ok += Math.min(1, c / h.freq.times);
    }
    return tot ? ok / tot : null;
  }
  for (let k = start; k <= t; k = addDays(k, 1)) {
    if (!scheduled(h, k) || isSkip(h, k)) continue;
    if (isDone(h, k)) { ok++; tot++; } else if (k !== t) tot++;
  }
  return tot ? ok / tot : null;
}
// Habit strength: an exponential moving average. Rises slowly with consistency,
// falls slowly with misses — one bad day never wipes out months of work.
function strength(h) {
  const t = today(); let s = 0;
  if (isWeekly(h)) {
    const cw = weekStartKey(t);
    for (let ws = weekStartKey(h.created); ws <= cw; ws = addDays(ws, 7)) {
      const c = weekCount(h, ws);
      if (ws === cw && c < h.freq.times) break;
      s = s * 0.75 + 0.25 * Math.min(1, c / h.freq.times);
    }
    return s;
  }
  for (let k = h.created; k <= t; k = addDays(k, 1)) {
    if (!scheduled(h, k) || isSkip(h, k)) continue;
    const c = countOf(h, k);
    if (k === t && c < h.target) continue;
    s = s * (1 - STRENGTH_ALPHA) + STRENGTH_ALPHA * Math.min(1, c / h.target);
  }
  return s;
}
const totalDone = h => Object.keys(S.logs[h.id] || {}).filter(k => isDone(h, k)).length;
function freqText(h) {
  const f = h.freq;
  if (f.type === 'weekly') return `${f.times}× a week`;
  if (f.type === 'days') {
    const d = [...f.days].sort();
    if (d.length === 7) return 'Every day';
    if (d.join() === '1,2,3,4,5') return 'Weekdays';
    if (d.join() === '0,6') return 'Weekends';
    return d.map(i => DOW[i]).join(', ');
  }
  return 'Every day';
}
const strengthLabel = s => s < .15 ? 'Seedling' : s < .4 ? 'Sprouting' : s < .7 ? 'Growing' : s < .9 ? 'Strong' : 'Automatic';

/* ================= Mutations ================= */
function check(id, k = UI.date) {
  const h = byId(id); if (!h || k > today()) return;
  const L = logOf(h), before = dayProgress(k), v = L[k];
  const c = typeof v === 'number' ? v : 0;
  if (c >= h.target) delete L[k];
  else L[k] = h.target > 1 ? c + 1 : 1;
  if (k < h.created && L[k]) h.created = k;
  save();
  const nowDone = isDone(h, k);
  if (nowDone) { UI.justDone = id; buzz(18); }
  else if (h.target > 1 && L[k]) buzz(8);
  render();
  refreshSheet();
  const after = dayProgress(k);
  if (nowDone && k === today()) {
    const st = streak(h);
    if (MILESTONES.includes(st)) {
      setTimeout(() => { confetti(h.color); toast(`${h.emoji} ${st}-${isWeekly(h) ? 'week' : 'day'} streak on ${h.name}!`); }, 250);
      return;
    }
  }
  if (after.due && after.ok === after.due && before.ok < before.due) {
    setTimeout(() => { confetti(); toast(k === today() ? 'Perfect day. Every promise kept. 🔥' : 'That day is now perfect ✨'); buzz([20, 60, 30]); }, 250);
  }
}
function setCount(id, n, k = UI.date) {
  const h = byId(id); if (!h || k > today()) return;
  const L = logOf(h); const wasDone = isDone(h, k);
  n = Math.max(0, Math.min(h.target * 3, n));
  if (n === 0) delete L[k]; else L[k] = n;
  save();
  if (!wasDone && isDone(h, k)) { UI.justDone = id; buzz(18); } else buzz(8);
  render(); refreshSheet();
}
function toggleSkip(id, k = UI.date) {
  const h = byId(id); if (!h) return;
  const L = logOf(h);
  if (L[k] === 'skip') delete L[k]; else L[k] = 'skip';
  save(); buzz(10); render(); refreshSheet();
  if (L[k] === 'skip') toast('Rest day logged — your streak is safe 🌙');
}
function toggleCell(id, k) {
  const h = byId(id); if (!h || k > today()) return;
  const L = logOf(h);
  if (isDone(h, k)) delete L[k]; else L[k] = h.target;
  if (k < h.created) h.created = k;
  save(); buzz(10); render(); refreshSheet();
}
function addHabit(t) {
  const h = {
    id: uid(), name: t.name.trim(), emoji: t.emoji || '⭐', color: t.color || COLORS[1],
    target: Math.max(1, t.target | 0 || 1), unit: (t.unit || '').trim(),
    time: t.time || 'anytime',
    freq: t.freq.type === 'days' ? { type: 'days', days: [...t.freq.days] }
      : t.freq.type === 'weekly' ? { type: 'weekly', times: t.freq.times || 3 } : { type: 'daily' },
    identity: (t.identity || '').trim(), stack: (t.stack || '').trim(), tiny: (t.tiny || '').trim(),
    created: t.created || today(), archived: false,
    order: S.habits.length ? Math.max(...S.habits.map(x => x.order)) + 1 : 0,
  };
  S.habits.push(h);
  return h;
}
function move(id, dir) {
  const list = active(); const i = list.findIndex(h => h.id === id); const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i].order, list[j].order] = [list[j].order, list[i].order];
  save(); render();
}

/* ================= Small UI helpers ================= */
function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
let toastTimer;
function toast(msg, action, fn) {
  const t = document.getElementById('toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { t.classList.remove('show'); fn(); };
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), action ? 5000 : 2800);
}
function ring(pct, size, stroke, color, id, opts = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const from = id && UI.rings[id] != null ? UI.rings[id] : (opts.noAnim ? pct : 0);
  const grad = color === 'grad';
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    ${grad ? `<defs><linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5E62"/><stop offset=".5" stop-color="#FF7A45"/><stop offset="1" stop-color="#FFB547"/></linearGradient></defs>` : ''}
    <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
    <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"
      style="stroke:${grad ? `url(#g-${id})` : color}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - from)}"
      ${pct <= 0 ? 'opacity="0"' : ''} transform="rotate(-90 ${size / 2} ${size / 2})"
      data-ring="${id || ''}" data-c="${c}" data-to="${pct}"/>
  </svg>`;
}
function animateRings(root = document) {
  const els = root.querySelectorAll('[data-ring]');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    els.forEach(el => {
      const c = +el.dataset.c, to = +el.dataset.to;
      el.style.strokeDashoffset = c * (1 - to);
      if (el.dataset.ring) UI.rings[el.dataset.ring] = to;
    });
  }));
}
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Good night';
}
function principleOfDay() {
  const d = parse(today()); const n = Math.floor(d / 864e5);
  return PRINCIPLES[((n % PRINCIPLES.length) + PRINCIPLES.length) % PRINCIPLES.length];
}

/* ================= Views ================= */
function render() {
  applyTheme();
  const v = document.getElementById('view');
  const showOnb = !S.onboarded;
  document.body.classList.toggle('no-tabs', showOnb);
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === UI.tab));
  v.innerHTML = showOnb ? viewOnboarding()
    : UI.tab === 'today' ? viewToday()
      : UI.tab === 'progress' ? viewProgress()
        : UI.tab === 'habits' ? viewHabits() : viewSettings();
  animateRings(v);
  UI.justDone = null;
  nativeSync();
}
function nativeSync() {
  if (!NATIVE) return;
  try {
    const p = dayProgress(today());
    NATIVE.setStatus(today(), p.due - p.ok);
    NATIVE.setBars(document.documentElement.dataset.theme === 'light');
    if (NATIVE.setWidgetData) NATIVE.setWidgetData(JSON.stringify(widgetPayload()));
  } catch (e) { }
}
// Snapshot of today for the home-screen widgets (see WidgetData.java)
function widgetPayload() {
  const t = today();
  const order = TIMES.map(x => x.id);
  const habits = active().slice().sort((a, b) => order.indexOf(a.time) - order.indexOf(b.time) || a.order - b.order).map(h => {
    const weekly = isWeekly(h), done = isDone(h, t);
    return {
      id: h.id, name: h.name, emoji: h.emoji, color: h.color, target: h.target, unit: h.unit, time: h.time,
      freq: h.freq, created: h.created, stack: h.stack, tiny: h.tiny,
      count: countOf(h, t), skip: isSkip(h, t),
      weekDone: weekly ? weekCount(h, t) - (done ? 1 : 0) : 0,
      streakBase: weekly ? streak(h) : streak(h) - (done && scheduled(h, t) ? 1 : 0),
    };
  });
  return { date: t, weekStart: S.settings.weekStart, theme: document.documentElement.dataset.theme, habits };
}
// Apply habit taps made on the home-screen widget while the app was closed
function emberSyncFromNative() {
  if (!NATIVE || !NATIVE.takeActions) return;
  let acts = [];
  try { acts = JSON.parse(NATIVE.takeActions() || '[]'); } catch (e) { return; }
  if (!Array.isArray(acts) || !acts.length) return;
  for (const a of acts) {
    const h = byId(a.id); if (!h || !a.date || a.date > today()) continue;
    const L = logOf(h), v = L[a.date], c = typeof v === 'number' ? v : 0;
    if (c >= h.target) delete L[a.date]; else L[a.date] = h.target > 1 ? c + 1 : 1;
  }
  save();
  if (document.getElementById('view').childElementCount) render();
}
window.emberSyncFromNative = emberSyncFromNative;

/* ---------- Today ---------- */
function habitCard(h, k) {
  const done = isDone(h, k), skip = isSkip(h, k), c = countOf(h, k);
  const st = streak(h);
  const meta = [];
  if (st > 0) meta.push(`<span class="fire">🔥 ${st}${isWeekly(h) ? 'w' : ''}</span>`);
  if (isWeekly(h)) meta.push(`<span>${weekCount(h, k)}/${h.freq.times} this week</span>`);
  if (skip) meta.push('<span>Rest day</span>');
  else if (h.target > 1) meta.push(`<span>${c}/${h.target} ${esc(h.unit)}</span>`);
  if (!skip && h.stack && !done) meta.push(`<span class="ell">After I ${esc(h.stack)}</span>`);
  else if (!skip && !st && !done && h.tiny) meta.push(`<span class="ell">Tiny: ${esc(h.tiny)}</span>`);
  if (!meta.length) meta.push(`<span>${freqText(h)}</span>`);
  const metaHtml = meta.join('<i class="sep"></i>');
  let btn;
  if (h.target > 1) {
    btn = `${done ? I.tick : `<span class="cnt">${c}<small>/${h.target}</small></span>`}
      <span class="mini">${ring(Math.min(1, c / h.target), 50, 3, h.color, null, { noAnim: true })}</span>`;
  } else btn = I.tick;
  return `<div class="habit ${done ? 'is-done' : ''} ${skip ? 'is-skip' : ''} ${UI.justDone === h.id ? 'pop' : ''}"
      style="--c:${h.color}" data-action="open" data-id="${h.id}" role="button" tabindex="0">
    <div class="h-icon">${h.emoji}</div>
    <div class="h-body">
      <div class="h-name">${esc(h.name)}</div>
      <div class="h-meta">${metaHtml}</div>
      ${h.target > 1 && !done && !skip ? `<div class="h-bar"><i style="width:${Math.min(100, c / h.target * 100)}%"></i></div>` : ''}
    </div>
    <button class="h-check" data-action="check" data-id="${h.id}" aria-label="${done ? 'Undo' : 'Complete'} ${esc(h.name)}">${btn}</button>
  </div>`;
}

function weekStrip() {
  const t = today(), ws = weekStartKey(UI.date), curWs = weekStartKey(t);
  let days = '';
  for (let i = 0; i < 7; i++) {
    const k = addDays(ws, i), fut = k > t, p = fut ? { due: 0, ok: 0, pct: 0 } : dayProgress(k);
    const perfect = p.due > 0 && p.ok === p.due;
    days += `<button class="day ${k === t ? 'is-today' : ''} ${k === UI.date ? 'is-sel' : ''} ${perfect ? 'is-perfect' : ''}"
        data-action="date" data-k="${k}" ${fut ? 'disabled' : ''} aria-label="${fmtDate(k)}">
      <span class="dl">${DOW[dow(k)].slice(0, 1)}</span>
      <span class="dn">${!perfect && !fut ? ring(p.pct, 32, 3, 'var(--accent)', null, { noAnim: true }) : ''}<span>${parse(k).getDate()}</span></span>
    </button>`;
  }
  return `<div class="week">
    <button class="wk-nav" data-action="week" data-dir="-1" aria-label="Previous week">${I.left}</button>
    <div class="week-days">${days}</div>
    <button class="wk-nav" data-action="week" data-dir="1" aria-label="Next week" ${ws >= curWs ? 'disabled' : ''}>${I.right}</button>
  </div>`;
}

function missedYesterday() {
  const t = today();
  return active().filter(h => {
    if (isWeekly(h) || isDone(h, t) || isSkip(h, t) || !scheduled(h, t)) return false;
    let k = addDays(t, -1);
    for (let i = 0; i < 7 && k >= h.created; i++, k = addDays(k, -1)) {
      if (!scheduled(h, k)) continue;
      return !isDone(h, k) && !isSkip(h, k);
    }
    return false;
  });
}

function viewToday() {
  const list = active();
  const k = UI.date, t = today(), isToday = k === t;
  const name = S.settings.name ? `, ${esc(S.settings.name)}` : '';
  const head = `<header class="top">
    <div><div class="eyebrow">${fmtDate(t, true)}</div><h1>${greeting()}${name}</h1></div>
    <button class="icon-btn" data-action="tab" data-tab="settings" aria-label="Settings">${I.gear}</button>
  </header>`;
  if (!list.length) {
    return head + `<div class="card empty">
      <div class="art">🔥</div><h2>Light your first ember</h2>
      <p>Start with one habit so small it feels almost too easy. Consistency first, intensity later.</p>
      <button class="btn primary" data-action="new">Create a habit</button>
    </div>` + principleCard();
  }
  const p = dayProgress(k);
  const left = p.due - p.ok;
  const bestActive = Math.max(0, ...list.map(streak));
  let big, small;
  if (!p.due) { big = 'Nothing scheduled.'; small = 'A free day — rest is part of the system.'; }
  else if (p.ok === p.due) { big = isToday ? 'Perfect day. Every promise kept.' : 'Perfect day.'; small = 'This is what becoming someone looks like.'; }
  else if (p.ok === 0) { big = isToday ? 'Start with the easiest one.' : `${left} left that day.`; small = isToday ? 'Momentum beats motivation. One tap.' : 'Tap any habit to log it for that day.'; }
  else { big = `${left} to go. Keep the chain alive.`; small = `${p.ok} of ${p.due} done${isToday ? ' so far' : ''}.`; }

  const hero = `<section class="card hero">
    <div class="hero-ring">${ring(p.pct, 116, 11, 'grad', 'hero')}
      <div class="ring-label"><div><div class="pct">${Math.round(p.pct * 100)}<small>%</small></div><div class="sub">${p.ok}/${p.due} done</div></div></div>
    </div>
    <div class="hero-copy">
      <div class="big">${big}</div>
      <div class="small">${small}</div>
      <div class="pills"><span class="pill">🔥 ${bestActive} best streak</span>${perfectDays(30) ? `<span class="pill">⭐ ${perfectDays(30)} perfect /30d</span>` : ''}</div>
    </div>
  </section>`;

  const viewing = !isToday ? `<div class="viewing"><span>Logging ${fmtDate(k)}</span><button data-action="date" data-k="${t}">Back to today</button></div>` : '';

  let banner = '';
  if (isToday) {
    const miss = missedYesterday();
    if (miss.length && S.dismissed.nmt !== t) {
      banner = `<div class="banner"><span class="bi">🛡️</span><div><b>Never miss twice</b>
        ${miss.slice(0, 3).map(h => esc(h.name)).join(', ')}${miss.length > 3 ? ` +${miss.length - 3}` : ''} slipped last time. Today, even the tiny version counts.</div>
        <button class="x" data-action="dismiss" data-what="nmt" aria-label="Dismiss">${I.close}</button></div>`;
    } else if (UI.installEvt && !S.dismissed.install) {
      banner = `<div class="banner"><span class="bi">📲</span><div><b>Install Ember</b>Add it to your home screen for a full-screen app that works offline.
        <div><button class="btn sm primary" data-action="install">Install app</button></div></div>
        <button class="x" data-action="dismiss" data-what="install" aria-label="Dismiss">${I.close}</button></div>`;
    }
  }

  let groups = '';
  for (const tm of TIMES) {
    const hs = list.filter(h => h.time === tm.id && scheduled(h, k) && (!isWeekly(h) || !weekMet(h, k) || isDone(h, k)));
    if (!hs.length) continue;
    const ok = hs.filter(h => satisfied(h, k)).length;
    groups += `<section class="section"><div class="section-head"><h3>${tm.icon} ${tm.label}</h3><span class="count">${ok}/${hs.length}</span></div>
      <div class="habits">${hs.map(h => habitCard(h, k)).join('')}</div></section>`;
  }
  const met = list.filter(h => isWeekly(h) && scheduled(h, k) && weekMet(h, k) && !isDone(h, k));
  if (met.length) {
    groups += `<section class="section"><div class="section-head"><h3>✅ Weekly goal reached</h3><span class="count">${met.length}</span></div>
      <div class="habits">${met.map(h => habitCard(h, k)).join('')}</div></section>`;
  }
  const notToday = list.filter(h => !scheduled(h, k) && k >= h.created);
  const restNote = notToday.length ? `<p class="hint" style="text-align:center;margin-top:16px">Not scheduled ${isToday ? 'today' : 'this day'}: ${notToday.map(h => h.emoji).join(' ')}</p>` : '';
  return head + hero + weekStrip() + viewing + banner + groups + restNote + principleCard();
}
function principleCard() {
  const [tag, q] = principleOfDay();
  return `<section class="principle"><div class="mark">“</div><div class="tag">Today’s principle · ${tag}</div><div class="q">${q}</div></section>`;
}
function perfectDays(n) {
  const t = today(); let c = 0;
  for (let i = 0; i < n; i++) {
    const k = addDays(t, -i); const p = dayProgress(k);
    if (p.due && p.ok === p.due) c++;
  }
  return c;
}

/* ---------- Progress ---------- */
function globalHeatmap(weeks) {
  return heatmap(k => {
    const p = dayProgress(k);
    const l = !p.due ? '' : p.ok === p.due ? 'l4' : p.pct >= .66 ? 'l3' : p.pct >= .33 ? 'l2' : p.pct > 0 ? 'l1' : '';
    return `<i class="hm-c ${l} ${k === today() ? 'today' : ''}" title="${k}"></i>`;
  }, weeks);
}
function heatmap(cell, weeks) {
  const t = today(); const start = addDays(weekStartKey(t), -7 * (weeks - 1));
  let cells = '', months = '', lastM = -1;
  for (let w = 0; w < weeks; w++) {
    const ws = addDays(start, 7 * w), m = parse(addDays(ws, 6)).getMonth();
    months += `<span>${m !== lastM && w < weeks - 1 ? MONTHS[m] : ''}</span>`; lastM = m;
    for (let d = 0; d < 7; d++) {
      const k = addDays(ws, d);
      cells += k > t ? '<i class="hm-c fut"></i>' : cell(k);
    }
  }
  return `<div class="hm" style="--w:${weeks}"><div class="hm-m">${months}</div><div class="hm-g">${cells}</div></div>`;
}
function viewProgress() {
  const list = active();
  const head = `<header class="top"><div><div class="eyebrow">Last 30 days</div><h1>Progress</h1></div></header>`;
  if (!list.length) return head + `<div class="card empty"><div class="art">📈</div><h2>Nothing to measure yet</h2><p>Add a habit and your consistency, streaks and strength will grow here.</p><button class="btn primary" data-action="new">Create a habit</button></div>`;
  const t = today();
  const rates = list.map(h => rate(h, 30)).filter(r => r != null);
  const cons = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const prevRates = list.map(h => rateWindow(h, 60, 31)).filter(r => r != null);
  const prev = prevRates.length ? prevRates.reduce((a, b) => a + b, 0) / prevRates.length : null;
  const delta = prev == null ? null : Math.round((cons - prev) * 100);
  const strengthAvg = list.reduce((a, h) => a + strength(h), 0) / list.length;
  const total = list.reduce((a, h) => a + totalDone(h), 0);
  const best = Math.max(0, ...list.map(bestStreak));

  let bars = '';
  for (let i = 13; i >= 0; i--) {
    const k = addDays(t, -i), p = dayProgress(k);
    bars += `<div class="bar ${k === t ? 'is-today' : ''}"><div class="col"><i class="${p.pct < .5 ? 'low' : ''}" style="height:${Math.max(p.due ? 4 : 0, p.pct * 100)}%"></i></div><span>${DOW[dow(k)].slice(0, 1)}</span></div>`;
  }

  // Weekday insight over the last 8 weeks
  const wd = Array.from({ length: 7 }, () => ({ due: 0, ok: 0 }));
  for (let i = 1; i <= 56; i++) {
    const k = addDays(t, -i), p = dayProgress(k);
    wd[dow(k)].due += p.due; wd[dow(k)].ok += p.ok;
  }
  const wdr = wd.map((x, i) => ({ i, r: x.due >= 3 ? x.ok / x.due : null })).filter(x => x.r != null);
  let insights = '';
  if (wdr.length >= 4) {
    const sorted = [...wdr].sort((a, b) => b.r - a.r);
    const hi = sorted[0], lo = sorted[sorted.length - 1];
    insights += `<div class="insight"><span class="ii">🏆</span><div><b>${DOW[hi.i]}s are your strongest day</b> (${pctTxt(hi.r)}). Whatever your routine is that day — copy it.</div></div>`;
    if (hi.r - lo.r > .1) insights += `<div class="insight"><span class="ii">🧭</span><div><b>${DOW[lo.i]}s are the weak spot</b> (${pctTxt(lo.r)}). Plan the two-minute versions the night before.</div></div>`;
  }
  const scored = list.map(h => ({ h, r: rate(h, 30) })).filter(x => x.r != null);
  if (scored.length >= 2) {
    const s = [...scored].sort((a, b) => b.r - a.r);
    const top = s[0], low = s[s.length - 1];
    insights += `<div class="insight"><span class="ii">${top.h.emoji}</span><div><b>${esc(top.h.name)}</b> is your most reliable habit at ${pctTxt(top.r)}. It’s becoming part of who you are.</div></div>`;
    if (low.r < .6 && low.h.id !== top.h.id) insights += `<div class="insight"><span class="ii">🌱</span><div><b>${esc(low.h.name)}</b> is at ${pctTxt(low.r)}. Try shrinking it${low.h.tiny ? ` to “${esc(low.h.tiny)}”` : ''} or stacking it after something you never skip.</div></div>`;
  }
  if (!insights) insights = `<div class="insight"><span class="ii">🔭</span><div>Insights appear after a couple of weeks of tracking. Keep showing up — the data is building.</div></div>`;

  const rows = list.map(h => {
    const r = rate(h, 30), s = strength(h);
    return `<button class="prow" data-action="open" data-id="${h.id}" style="--c:${h.color}">
      <div class="h-icon">${h.emoji}</div>
      <div class="pb"><div class="pn"><span>${esc(h.name)}</span><span>🔥 ${streak(h)} · ${pctTxt(r)}</span></div>
      <div class="track"><i style="width:${(s * 100).toFixed(1)}%"></i></div></div>
    </button>`;
  }).join('');

  return head + `<section class="card score">
      ${ring(cons, 104, 10, 'grad', 'cons')}
      <div><div class="num">${Math.round(cons * 100)}<small>%</small></div><div class="lbl">Consistency score</div>
      ${delta != null ? `<span class="pill delta">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} pts vs previous 30d</span>` : ''}</div>
    </section>
    <div class="kpis">
      <div class="kpi"><div class="v">${Math.round(strengthAvg * 100)}%</div><div class="l">Avg habit strength</div></div>
      <div class="kpi"><div class="v">${perfectDays(30)}</div><div class="l">Perfect days</div></div>
      <div class="kpi"><div class="v">${best}</div><div class="l">Longest streak</div></div>
    </div>
    <section class="section"><div class="section-head"><h3>Last 14 days</h3><span class="count">${total} check-ins all time</span></div>
      <div class="card"><div class="bars">${bars}</div></div></section>
    <section class="section"><div class="section-head"><h3>Your year in embers</h3></div>
      <div class="card">${globalHeatmap(20)}
      <div class="legend">Less <i class="hm-c"></i><i class="hm-c l1"></i><i class="hm-c l2"></i><i class="hm-c l3"></i><i class="hm-c l4"></i> Perfect</div></div></section>
    <section class="section"><div class="section-head"><h3>Insights</h3></div>${insights}</section>
    <section class="section"><div class="section-head"><h3>Habit strength</h3><span class="count">bar = strength</span></div>${rows}</section>`;
}
function rateWindow(h, fromAgo, toAgo) {
  const t = today(); let tot = 0, ok = 0;
  if (isWeekly(h)) return null;
  for (let i = fromAgo; i >= toAgo; i--) {
    const k = addDays(t, -i);
    if (!scheduled(h, k) || isSkip(h, k)) continue;
    tot++; if (isDone(h, k)) ok++;
  }
  return tot >= 5 ? ok / tot : null;
}

/* ---------- Habits (manage) ---------- */
function viewHabits() {
  const list = active(), arch = archived();
  const head = `<header class="top"><div><div class="eyebrow">${list.length} active</div><h1>Your habits</h1></div>
    <button class="icon-btn" data-action="new" aria-label="New habit"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></header>`;
  const row = (h, i, n, isArch) => `<div class="mrow" style="--c:${h.color}">
    <div class="h-icon">${h.emoji}</div>
    <div class="mb" data-action="open" data-id="${h.id}"><div class="mn">${esc(h.name)}</div><div class="ms">${freqText(h)} · ${TIMES.find(t => t.id === h.time).label}${h.target > 1 ? ` · ${h.target} ${esc(h.unit)}` : ''}</div></div>
    <div class="acts">${isArch
      ? `<button class="mini-btn" data-action="unarchive" data-id="${h.id}" aria-label="Restore">${I.restore}</button><button class="mini-btn" data-action="delete" data-id="${h.id}" aria-label="Delete">${I.trash}</button>`
      : `<button class="mini-btn" data-action="move" data-dir="-1" data-id="${h.id}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${I.up}</button>
         <button class="mini-btn" data-action="move" data-dir="1" data-id="${h.id}" ${i === n - 1 ? 'disabled' : ''} aria-label="Move down">${I.down}</button>
         <button class="mini-btn" data-action="edit" data-id="${h.id}" aria-label="Edit">${I.edit}</button>`}</div>
  </div>`;
  let html = head;
  if (list.length) html += list.map((h, i) => row(h, i, list.length)).join('');
  else html += `<div class="card empty"><div class="art">🌱</div><h2>No habits yet</h2><p>Pick one from the ideas below or create your own.</p></div>`;
  if (list.length >= 6) html += `<div class="warn">💡 You’re tracking ${list.length} habits. Research on behaviour change suggests fewer habits, done consistently, stick better. Consider archiving the ones that feel automatic.</div>`;
  if (arch.length) html += `<section class="section"><div class="section-head"><h3>Archived</h3><span class="count">${arch.length}</span></div>${arch.map((h, i) => row(h, i, arch.length, true)).join('')}</section>`;
  const names = new Set(S.habits.map(h => h.name.toLowerCase()));
  const ideas = TEMPLATES.map((t, i) => ({ t, i })).filter(x => !names.has(x.t.name.toLowerCase()));
  if (ideas.length) html += `<section class="section"><div class="section-head"><h3>Ideas</h3><span class="count">tap to customise</span></div>
    <div class="ideas">${ideas.map(x => `<button class="idea" data-action="template" data-i="${x.i}"><span class="e">${x.t.emoji}</span>${esc(x.t.name)}</button>`).join('')}</div></section>`;
  return html;
}

/* ---------- Settings ---------- */
function viewSettings() {
  const s = S.settings;
  const seg = (name, val, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(val) === String(v) ? 'on' : ''}" data-action="setting" data-k="${name}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const installed = matchMedia('(display-mode: standalone)').matches;
  return `<header class="top"><div><div class="eyebrow">Settings</div><h1>You</h1></div></header>
  <div class="set-group"><h3>Profile</h3><div class="set-card">
    <div class="set-row"><span class="si">👋</span><span class="st">Your name</span><input class="input" id="set-name" value="${esc(s.name)}" placeholder="Name" maxlength="24" autocomplete="given-name"></div>
  </div></div>
  <div class="set-group"><h3>Preferences</h3><div class="set-card">
    <div class="set-row"><span class="si">🎨</span><span class="st">Theme</span>${seg('theme', s.theme, [['system', 'Auto'], ['dark', 'Dark'], ['light', 'Light']])}</div>
    <div class="set-row"><span class="si">📅</span><span class="st">Week starts</span>${seg('weekStart', s.weekStart, [[1, 'Mon'], [0, 'Sun']])}</div>
  </div></div>
  ${NATIVE ? `<div class="set-group"><h3>Reminder</h3><div class="set-card">
    <div class="set-row"><span class="si">🔔</span><span class="st">Daily nudge<small>Only if habits are still open that day.</small></span>${seg('reminder', s.reminder.on ? 'on' : 'off', [['off', 'Off'], ['on', 'On']])}</div>
    ${s.reminder.on ? `<div class="set-row"><span class="si">⏰</span><span class="st">Time</span><input class="input" type="time" id="set-remind" value="${esc(s.reminder.time)}" style="max-width:160px;padding:0 12px"></div>` : ''}
  </div><p class="hint" style="margin:8px 4px 0">Tip: set it for the evening — late enough to know what’s left, early enough to do the tiny version.</p></div>` : ''}
  ${NATIVE ? `<div class="set-group"><h3>Home screen widgets</h3><div class="set-card">
    <button class="set-row" data-action="pin-widget" data-w="today"><span class="si">📋</span><span class="st">Today list<small>Tick habits off right from your home screen.</small></span><span class="btn sm">Add</span></button>
    <button class="set-row" data-action="pin-widget" data-w="ring"><span class="si">⭕</span><span class="st">Progress ring<small>Today’s % and your best streak, at a glance.</small></span><span class="btn sm">Add</span></button>
  </div><p class="hint" style="margin:8px 4px 0">Or long-press your home screen → Widgets → Ember. Widgets follow your theme.</p></div>` : ''}
  ${NATIVE ? '' : `<div class="set-group"><h3>App</h3><div class="set-card">
    ${installed ? `<div class="set-row"><span class="si">✅</span><span class="st">Installed<small>Ember is running as an app on this device.</small></span></div>`
      : `<button class="set-row" data-action="install"><span class="si">📲</span><span class="st">Install on home screen<small>${UI.installEvt ? 'Full-screen, offline, like a native app.' : 'In Chrome: ⋮ menu → “Add to Home screen” or “Install app”.'}</small></span></button>`}
  </div></div>`}
  <div class="set-group"><h3>Your data</h3><div class="set-card">
    <button class="set-row" data-action="export"><span class="si">💾</span><span class="st">Export backup<small>Download all habits and history as a file.</small></span></button>
    <button class="set-row" data-action="import"><span class="si">📂</span><span class="st">Import backup<small>Restore from an Ember backup file.</small></span></button>
    <button class="set-row" data-action="reset"><span class="si">🗑️</span><span class="st" style="color:#FF6B6B">Erase everything<small>Deletes all habits and history on this device.</small></span></button>
  </div><p class="hint" style="margin:8px 4px 0">Everything stays private on this phone. Export a backup now and then.</p></div>
  <div class="set-group"><h3>The method behind Ember</h3><div class="science">
    <div class="sci"><b>🪪 Identity first</b><p>Each habit carries an identity — “I am someone who…”. Outcomes fade; identity sticks. Every check-in is evidence.</p></div>
    <div class="sci"><b>🤏 Two-minute version</b><p>Write the tiniest version of each habit. On bad days, do just that. Showing up keeps the identity alive.</p></div>
    <div class="sci"><b>🔗 Habit stacking</b><p>Anchor new habits to existing ones: “After I pour my coffee, I will meditate.” A clear cue beats willpower.</p></div>
    <div class="sci"><b>🛡️ Never miss twice</b><p>Ember warns you after a miss. One slip is normal; the second in a row is where habits break.</p></div>
    <div class="sci"><b>🌙 Rest days</b><p>Mark planned rest as a skip. Your streak is protected and your stats stay honest.</p></div>
    <div class="sci"><b>📈 Habit strength</b><p>A smoothed score that rises with consistency and dips gently with misses — so one bad day never erases months of progress. Habits often take around two months to feel automatic, so watch this number climb.</p></div>
  </div></div>
  <p class="foot">Ember ${VERSION} · Made for showing up 🔥</p>`;
}

/* ---------- Onboarding ---------- */
function viewOnboarding() {
  if (!UI.onbPicks) UI.onbPicks = new Set();
  const n = UI.onbPicks.size;
  const picks = TEMPLATES.map((t, i) => `<button class="pick ${UI.onbPicks.has(i) ? 'on' : ''}" style="--c:${t.color}" data-action="onb-pick" data-i="${i}">
    <span class="e">${t.emoji}</span><span class="n">${esc(t.name)}</span><span class="t">Tiny: ${esc(t.tiny)}</span></button>`).join('');
  return `<div class="onb">
    <div class="logo"><svg viewBox="0 0 24 24"><path d="M12 2c1.3 4.3 6.5 6.8 6.5 12.7A6.4 6.4 0 0 1 12 21a6.4 6.4 0 0 1-6.5-6.3c0-2.6 1.1-4.3 2.4-5.7.3 2.1 1.4 3.4 2.8 3.9C10 9.6 10.7 5.5 12 2Z"/></svg></div>
    <h1>Small habits,<br><span class="grad-text">kept alive daily.</span></h1>
    <p class="lead">Ember helps you become the person you want to be — one tiny, repeatable action at a time.</p>
    <div class="field"><label for="onb-name">What should we call you?</label>
      <input class="input" id="onb-name" placeholder="Your first name" maxlength="24" autocomplete="given-name" value="${esc(S.settings.name)}"></div>
    <div class="field"><label>Pick where to start</label>
      <p class="help" style="margin:-2px 2px 12px">Start with 1–3. Fewer habits, done every day, beat many done sometimes. You can customise everything later.</p>
      <div class="picks">${picks}</div>
      ${n > 4 ? `<div class="warn">That’s ${n} habits. Ambitious! Consider starting with 3 and adding more once they feel easy.</div>` : ''}
    </div>
    <div class="onb-foot"><button class="btn primary block" data-action="onb-start">${n ? `Start with ${n} habit${n > 1 ? 's' : ''}` : 'Start with a blank slate'}</button></div>
  </div>`;
}

/* ================= Sheets ================= */
function openSheet(html, kind, data) {
  const root = document.getElementById('sheet-root');
  let wrap = root.querySelector('.sheet-wrap');
  if (!wrap) {
    root.innerHTML = `<div class="sheet-wrap"><div class="sheet-bd" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div><div class="sheet-body"></div></div></div>`;
    wrap = root.querySelector('.sheet-wrap');
    bindSheetDrag(wrap.querySelector('.sheet'));
    if (!NATIVE) { try { history.pushState({ sheet: true }, ''); } catch (e) { } }
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  } else {
    wrap.querySelector('.sheet').scrollTop = 0;
  }
  UI.sheet = { kind, data };
  wrap.querySelector('.sheet-body').innerHTML = html;
  animateRings(wrap);
}
function closeSheet(fromPop) {
  const root = document.getElementById('sheet-root');
  const wrap = root.querySelector('.sheet-wrap');
  if (!wrap) return;
  UI.sheet = null;
  wrap.classList.remove('open');
  wrap.querySelector('.sheet').style.transform = '';
  setTimeout(() => { if (wrap.parentNode && !wrap.classList.contains('open')) wrap.remove(); }, 380);
  if (!NATIVE && !fromPop && history.state && history.state.sheet) history.back();
}
window.addEventListener('popstate', () => { if (UI.sheet) closeSheet(true); });
function refreshSheet() {
  if (!UI.sheet || UI.sheet.kind !== 'habit') return;
  const wrap = document.querySelector('.sheet-wrap'); if (!wrap) return;
  const h = byId(UI.sheet.data); if (!h) return closeSheet();
  wrap.querySelector('.sheet-body').innerHTML = habitSheet(h);
  animateRings(wrap);
}
function bindSheetDrag(sheet) {
  let y0 = null, dy = 0;
  sheet.addEventListener('touchstart', e => {
    if (sheet.scrollTop > 0 || e.target.closest('input,textarea,.chips.scroll')) { y0 = null; return; }
    y0 = e.touches[0].clientY; dy = 0;
  }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (y0 == null) return;
    dy = e.touches[0].clientY - y0;
    if (dy > 0 && sheet.scrollTop <= 0) { sheet.classList.add('dragging'); sheet.style.transform = `translateY(${dy}px)`; }
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (y0 == null) return;
    sheet.classList.remove('dragging');
    if (dy > 110) closeSheet(); else sheet.style.transform = '';
    y0 = null;
  });
}

/* ---------- Habit detail ---------- */
function habitSheet(h) {
  const k = UI.date, t = today();
  const st = streak(h), best = bestStreak(h), r = rate(h, 30), s = strength(h);
  const unit = isWeekly(h) ? 'wk' : 'd';
  const why = [];
  if (h.identity) why.push(`<div class="why-row"><span class="wi">🪪</span><div><small>Identity</small>I am someone who ${esc(h.identity)}.</div></div>`);
  if (h.stack) why.push(`<div class="why-row"><span class="wi">🔗</span><div><small>Cue</small>After I ${esc(h.stack)}, I will ${esc(h.name.toLowerCase())}.</div></div>`);
  if (h.tiny) why.push(`<div class="why-row"><span class="wi">🤏</span><div><small>Bad day? Just do</small>${esc(h.tiny)}</div></div>`);
  const c = countOf(h, k), skip = isSkip(h, k), done = isDone(h, k);
  const dayLbl = k === t ? 'Today' : fmtDate(k);
  const ctl = h.target > 1
    ? `<div class="stepper"><button data-action="dec" data-id="${h.id}" aria-label="Minus">−</button><span class="sv">${c}<small>/${h.target} ${esc(h.unit)}</small></span><button data-action="inc" data-id="${h.id}" aria-label="Plus">+</button></div>`
    : `<button class="btn ${done ? '' : 'primary'}" style="flex:1" data-action="check" data-id="${h.id}">${done ? 'Undo' : `Done ${dayLbl === 'Today' ? 'today' : `· ${dayLbl}`}`}</button>`;
  const cell = k2 => {
    let cls = 'hm-c', style = '';
    const v = countOf(h, k2);
    if (isDone(h, k2)) cls += ' on';
    else if (v > 0) { cls += ' part'; style = `opacity:${.3 + .5 * v / h.target}`; }
    else if (isSkip(h, k2)) cls += ' skip';
    else if (k2 < h.created) cls += ' pre';
    else if (scheduled(h, k2)) cls += ' miss';
    else cls += ' off';
    if (k2 === t) cls += ' today';
    return `<i class="${cls}" style="${style}" data-action="cell" data-id="${h.id}" data-k="${k2}" title="${k2}"></i>`;
  };
  return `<div style="--c:${h.color}">
    <div class="d-head"><div class="h-icon">${h.emoji}</div><div style="flex:1;min-width:0"><h2>${esc(h.name)}</h2><p>${freqText(h)} · ${TIMES.find(x => x.id === h.time).label}${h.target > 1 ? ` · ${h.target} ${esc(h.unit)}` : ''}</p></div>
      <button class="icon-btn" data-action="close-sheet" aria-label="Close"><svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    ${why.length ? `<div class="why">${why.join('')}</div>` : ''}
    <div class="today-ctl">${ctl}
      <button class="btn ${skip ? 'primary' : ''}" data-action="skip" data-id="${h.id}" ${k > t ? 'disabled' : ''}>🌙 ${skip ? 'Resting' : 'Rest day'}</button></div>
    <div class="stats">
      <div class="stat"><div class="v">🔥 ${st}<small>${unit}</small></div><div class="l">Current streak</div></div>
      <div class="stat"><div class="v">${best}<small>${unit}</small></div><div class="l">Best streak</div></div>
      <div class="stat"><div class="v">${pctTxt(r)}</div><div class="l">Last 30 days</div></div>
      <div class="stat"><div class="v">${totalDone(h)}</div><div class="l">Total check-ins</div></div>
      <div class="stat wide">${ring(s, 64, 7, h.color, 'str-' + h.id)}<div class="info"><div class="v" style="font-size:20px">${Math.round(s * 100)}% · ${strengthLabel(s)}</div>
        <p>Habit strength rises with every check-in and dips gently on misses. Around two months of consistency usually makes it feel automatic.</p></div></div>
    </div>
    <section class="section"><div class="section-head"><h3>History</h3><span class="count">tap a day to toggle</span></div>
      <div class="card" style="padding:14px">${heatmap(cell, 18)}</div></section>
    <div class="btn-row" style="margin-top:20px">
      <button class="btn" data-action="edit" data-id="${h.id}">${I.edit} Edit</button>
      <button class="btn" data-action="archive" data-id="${h.id}">${I.archive} Archive</button>
      <button class="btn danger" data-action="delete" data-id="${h.id}" aria-label="Delete" style="flex:0 0 52px;padding:0">${I.trash}</button>
    </div>
  </div>`;
}
function openHabit(id) { const h = byId(id); if (h) openSheet(habitSheet(h), 'habit', id); }

/* ---------- Editor ---------- */
let D = null; // draft
function draftFrom(src) {
  return {
    id: src.id || null, name: src.name || '', emoji: src.emoji || '⭐', color: src.color || COLORS[1],
    target: src.target || 1, unit: src.unit || '', time: src.time || 'anytime',
    freq: { type: src.freq?.type || 'daily', days: src.freq?.days ? [...src.freq.days] : [1, 2, 3, 4, 5], times: src.freq?.times || 3 },
    identity: src.identity || '', stack: src.stack || '', tiny: src.tiny || '',
  };
}
function openEditor(src, isNew) {
  D = draftFrom(src || {});
  D.isNew = isNew;
  openSheet(editorHtml(), 'edit');
  if (isNew && !src) setTimeout(() => { const el = document.getElementById('e-name'); el && el.focus(); }, 420);
}
function rerenderEditor() {
  const sheet = document.querySelector('.sheet'); const top = sheet.scrollTop;
  sheet.querySelector('.sheet-body').innerHTML = editorHtml();
  sheet.scrollTop = top;
}
function editorHtml() {
  const f = D.freq;
  const tpl = D.isNew ? `<div class="field" style="margin-top:4px"><label>Quick start</label><div class="chips scroll">${TEMPLATES.map((t, i) => `<button class="chip" data-action="e-tpl" data-i="${i}">${t.emoji} ${esc(t.name)}</button>`).join('')}</div></div>` : '';
  return `<div class="sheet-title"><h2>${D.isNew ? 'New habit' : 'Edit habit'}</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close"><svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    ${tpl}
    <div class="preview" style="--c:${D.color}"><div class="h-icon">${D.emoji}</div><div style="min-width:0"><div class="pv-n" id="pv-n">${esc(D.name) || 'Your new habit'}</div><div class="pv-s">${freqText(D)} · ${TIMES.find(t => t.id === D.time).label}</div></div></div>
    <div class="field"><label for="e-name">Name</label><input class="input" id="e-name" data-f="name" value="${esc(D.name)}" placeholder="e.g. Read 10 pages" maxlength="40" autocomplete="off"></div>
    <div class="field"><label>Icon</label><div class="emojis">${EMOJIS.map(e => `<button class="${e === D.emoji ? 'on' : ''}" data-action="e-emoji" data-v="${e}">${e}</button>`).join('')}</div></div>
    <div class="field"><label>Colour</label><div class="colors">${COLORS.map(c => `<button class="${c === D.color ? 'on' : ''}" style="--sw:${c}" data-action="e-color" data-v="${c}" aria-label="Colour ${c}"></button>`).join('')}</div></div>
    <div class="field"><label>Goal</label>
      <div class="seg"><button class="${D.target <= 1 ? 'on' : ''}" data-action="e-goal" data-v="check">Just do it</button><button class="${D.target > 1 ? 'on' : ''}" data-action="e-goal" data-v="count">Reach a number</button></div>
      ${D.target > 1 ? `<div style="display:flex;gap:10px;margin-top:10px;align-items:center">
        <div class="stepper"><button data-action="e-target" data-d="-1">−</button><span class="sv">${D.target}</span><button data-action="e-target" data-d="1">+</button></div>
        <input class="input" data-f="unit" value="${esc(D.unit)}" placeholder="unit (glasses, pages…)" maxlength="16" style="flex:1"></div>` : ''}
    </div>
    <div class="field"><label>How often</label>
      <div class="seg">${[['daily', 'Every day'], ['days', 'Some days'], ['weekly', 'X per week']].map(([v, l]) => `<button class="${f.type === v ? 'on' : ''}" data-action="e-freq" data-v="${v}">${l}</button>`).join('')}</div>
      ${f.type === 'days' ? `<div class="chips" style="margin-top:10px;justify-content:space-between">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button class="chip round ${f.days.includes(d) ? 'on' : ''}" data-action="e-day" data-v="${d}">${DOW[d].slice(0, 2)}</button>`).join('')}</div>` : ''}
      ${f.type === 'weekly' ? `<div style="display:flex;gap:12px;margin-top:10px;align-items:center"><div class="stepper"><button data-action="e-times" data-d="-1">−</button><span class="sv">${f.times}×</span><button data-action="e-times" data-d="1">+</button></div><span class="muted" style="font-size:13px">any days you like, per week</span></div>` : ''}
    </div>
    <div class="field"><label>Time of day</label><div class="chips">${TIMES.map(t => `<button class="chip ${D.time === t.id ? 'on' : ''}" data-action="e-time" data-v="${t.id}">${t.icon} ${t.label}</button>`).join('')}</div></div>
    <div class="stick-card"><span class="flabel">✨ Make it stick</span>
      <p class="help" style="margin:0 2px">Optional — but these three answers are what separate habits that last from ones that fade.</p>
      <div class="field"><label>Identity</label><div class="prefix" style="--pl:168px"><span>I am someone who</span><input class="input" data-f="identity" value="${esc(D.identity)}" placeholder="reads every day" maxlength="60"></div>
        <p class="help">Who does this habit prove you are?</p></div>
      <div class="field"><label>Cue · habit stack</label><div class="prefix" style="--pl:66px"><span>After I</span><input class="input" data-f="stack" value="${esc(D.stack)}" placeholder="pour my morning coffee" maxlength="60"></div>
        <p class="help">Anchor it to something you already do every day.</p></div>
      <div class="field"><label>Two-minute version</label><input class="input" data-f="tiny" value="${esc(D.tiny)}" placeholder="Read one page" maxlength="60">
        <p class="help">The tiniest version you can do on your worst day.</p></div>
    </div>
    <div class="edit-foot"><button class="btn primary block" data-action="e-save">${D.isNew ? 'Create habit' : 'Save changes'}</button></div>`;
}
function saveDraft() {
  const name = D.name.trim();
  if (!name) { toast('Give your habit a name'); const el = document.getElementById('e-name'); el && el.focus(); return; }
  if (D.freq.type === 'days' && !D.freq.days.length) { toast('Pick at least one day'); return; }
  const freq = D.freq.type === 'days' ? { type: 'days', days: [...D.freq.days].sort() } : D.freq.type === 'weekly' ? { type: 'weekly', times: D.freq.times } : { type: 'daily' };
  let h;
  if (D.isNew) { h = addHabit({ ...D, freq }); }
  else {
    h = byId(D.id); if (!h) return;
    Object.assign(h, { name, emoji: D.emoji, color: D.color, target: Math.max(1, D.target), unit: D.unit.trim(), time: D.time, freq, identity: D.identity.trim(), stack: D.stack.trim(), tiny: D.tiny.trim() });
  }
  save();
  const wasNew = D.isNew; D = null;
  if (wasNew) {
    closeSheet(); UI.tab = 'today'; UI.date = today(); render();
    toast(`${h.emoji} ${h.name} added. Start tiny.`);
  } else { render(); openHabit(h.id); toast('Saved'); }
}

/* ================= Theme ================= */
function applyTheme() {
  const pref = S.settings.theme;
  const dark = pref === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches : pref !== 'light';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = dark ? '#0A0B10' : '#F6F3EE';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (S.settings.theme === 'system') applyTheme(); });

/* ================= Confetti ================= */
function confetti(color) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.getElementById('confetti'), ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const palette = color ? [color, '#FFB547', '#FFFFFF', '#FF7A45'] : ['#FF5E62', '#FF7A45', '#FFB547', '#FFE08A', '#FFFFFF', '#B26BFF', '#4DA8FF'];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 60, y: innerHeight * .35,
    vx: (Math.random() - .5) * 14, vy: -Math.random() * 15 - 4,
    w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
    c: palette[(Math.random() * palette.length) | 0], life: 0,
  }));
  let frame = 0;
  (function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += .38; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - frame / 150);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (++frame < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}

/* ================= Backup ================= */
function exportData() {
  if (NATIVE) { NATIVE.saveBackup(JSON.stringify({ app: 'ember', exported: new Date().toISOString(), ...S }, null, 2), `ember-backup-${today()}.json`); return; }
  const blob = new Blob([JSON.stringify({ app: 'ember', exported: new Date().toISOString(), ...S }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `ember-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Backup downloaded');
}
document.getElementById('import-file').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.habits) || typeof data.logs !== 'object') throw new Error('bad');
    if (!confirm(`Replace current data with this backup (${data.habits.length} habits)?`)) return;
    const d = defaultState();
    S = Object.assign(d, { habits: data.habits, logs: data.logs || {}, settings: Object.assign(d.settings, data.settings || {}), onboarded: true });
    save(); render(); toast('Backup restored ✨');
  } catch (err) { toast('That file isn’t an Ember backup'); }
});

/* ================= Events ================= */
const actions = {
  tab: el => { UI.tab = el.dataset.tab; if (UI.tab === 'today') UI.date = UI.date > today() ? today() : UI.date; render(); window.scrollTo({ top: 0 }); },
  new: () => openEditor(null, true),
  template: el => openEditor(TEMPLATES[+el.dataset.i], true),
  check: el => check(el.dataset.id),
  open: el => openHabit(el.dataset.id),
  date: el => { UI.date = el.dataset.k; render(); },
  week: el => {
    const t = today(); let k = addDays(UI.date, 7 * +el.dataset.dir);
    if (k > t) k = t;
    UI.date = k; render();
  },
  dismiss: el => { S.dismissed[el.dataset.what] = el.dataset.what === 'nmt' ? today() : true; save(); render(); },
  install: async () => {
    if (!UI.installEvt) { toast('Use Chrome’s ⋮ menu → Add to Home screen'); return; }
    UI.installEvt.prompt();
    try { await UI.installEvt.userChoice; } catch (e) { }
    UI.installEvt = null; render();
  },
  'close-sheet': () => closeSheet(),
  inc: el => { const h = byId(el.dataset.id); setCount(h.id, countOf(h, UI.date) + 1); },
  dec: el => { const h = byId(el.dataset.id); setCount(h.id, countOf(h, UI.date) - 1); },
  skip: el => toggleSkip(el.dataset.id),
  cell: el => toggleCell(el.dataset.id, el.dataset.k),
  edit: el => openEditor(byId(el.dataset.id), false),
  archive: el => {
    const h = byId(el.dataset.id); h.archived = true; save(); closeSheet(); render();
    toast(`${h.name} archived`, 'Undo', () => { h.archived = false; save(); render(); });
  },
  unarchive: el => { const h = byId(el.dataset.id); h.archived = false; save(); render(); toast(`${h.name} is back`); },
  delete: el => {
    const h = byId(el.dataset.id);
    if (!confirm(`Delete “${h.name}” and all its history? This can’t be undone.\n\nTip: Archive keeps the history.`)) return;
    S.habits = S.habits.filter(x => x.id !== h.id); delete S.logs[h.id];
    save(); closeSheet(); render(); toast('Habit deleted');
  },
  move: el => move(el.dataset.id, +el.dataset.dir),
  setting: el => {
    const k = el.dataset.k; let v = el.dataset.v;
    if (k === 'weekStart') v = +v;
    if (k === 'reminder') { S.settings.reminder.on = v === 'on'; save(); syncReminder(); render(); return; }
    S.settings[k] = v; save(); render();
  },
  export: exportData,
  'pin-widget': el => {
    let ok = false;
    try { ok = NATIVE && NATIVE.pinWidget && NATIVE.pinWidget(el.dataset.w); } catch (e) { }
    toast(ok ? 'Confirm on the pop-up to place the widget' : 'Long-press your home screen → Widgets → Ember');
  },
  import: () => document.getElementById('import-file').click(),
  reset: () => {
    if (!confirm('Erase all habits and history on this device?')) return;
    if (!confirm('Really erase everything? Consider exporting a backup first.')) return;
    S = defaultState(); UI.onbPicks = null; UI.tab = 'today'; save(); render();
  },
  'onb-pick': el => {
    const i = +el.dataset.i;
    UI.onbPicks.has(i) ? UI.onbPicks.delete(i) : UI.onbPicks.add(i);
    buzz(8);
    const y = window.scrollY; render(); window.scrollTo(0, y);
  },
  'onb-start': () => {
    const nm = document.getElementById('onb-name');
    S.settings.name = nm ? nm.value.trim() : '';
    [...UI.onbPicks].sort((a, b) => a - b).forEach(i => addHabit(TEMPLATES[i]));
    S.onboarded = true; UI.onbPicks = null; UI.tab = 'today'; save(); render();
    window.scrollTo(0, 0);
    if (S.habits.length) toast('Your first embers are lit 🔥'); else openEditor(null, true);
  },
  // editor
  'e-tpl': el => { const keep = D.isNew; D = draftFrom(TEMPLATES[+el.dataset.i]); D.isNew = keep; rerenderEditor(); },
  'e-emoji': el => { D.emoji = el.dataset.v; rerenderEditor(); },
  'e-color': el => { D.color = el.dataset.v; rerenderEditor(); },
  'e-goal': el => { D.target = el.dataset.v === 'count' ? Math.max(2, D.target > 1 ? D.target : 8) : 1; rerenderEditor(); },
  'e-target': el => { D.target = Math.max(2, Math.min(999, D.target + +el.dataset.d)); rerenderEditor(); },
  'e-freq': el => { D.freq.type = el.dataset.v; rerenderEditor(); },
  'e-day': el => { const d = +el.dataset.v; const s = new Set(D.freq.days); s.has(d) ? s.delete(d) : s.add(d); D.freq.days = [...s]; rerenderEditor(); },
  'e-times': el => { D.freq.times = Math.max(1, Math.min(7, D.freq.times + +el.dataset.d)); rerenderEditor(); },
  'e-time': el => { D.time = el.dataset.v; rerenderEditor(); },
  'e-save': saveDraft,
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el); }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.habit[role=button]')) { e.preventDefault(); openHabit(e.target.dataset.id); }
  if (e.key === 'Escape' && UI.sheet) closeSheet();
});
document.addEventListener('input', e => {
  if (e.target.id === 'onb-name') S.settings.name = e.target.value.trim();
  const f = e.target.dataset.f;
  if (f && D) {
    D[f] = e.target.value;
    if (f === 'name') { const pv = document.getElementById('pv-n'); if (pv) pv.textContent = e.target.value || 'Your new habit'; }
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 'set-name') { S.settings.name = e.target.value.trim(); save(); }
  if (e.target.id === 'set-remind' && e.target.value) { S.settings.reminder.time = e.target.value; save(); syncReminder(); toast(`Reminder set for ${e.target.value}`); }
});

/* ================= Day rollover & PWA ================= */
let lastDay = today();
function checkRollover() {
  const t = today();
  if (t !== lastDay) { if (UI.date === lastDay) UI.date = t; lastDay = t; render(); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkRollover(); });
setInterval(checkRollover, 60 * 1000);

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); UI.installEvt = e; if (S.onboarded) render(); });
window.addEventListener('appinstalled', () => { UI.installEvt = null; toast('Ember installed 🔥'); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }

function syncReminder() {
  if (!NATIVE) return;
  const r = S.settings.reminder, [hh, mm] = r.time.split(':').map(Number);
  try { NATIVE.setReminder(!!r.on, hh, mm); } catch (e) { }
}
// Android back button: close sheet → go to Today → exit
window.emberBack = function () {
  if (UI.sheet) { closeSheet(true); return true; }
  if (S.onboarded && UI.tab !== 'today') { UI.tab = 'today'; render(); window.scrollTo(0, 0); return true; }
  if (UI.date !== today()) { UI.date = today(); render(); return true; }
  return false;
};
window.checkRollover = checkRollover;
window.toast = toast;

emberSyncFromNative();
render();
syncReminder();
