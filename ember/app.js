/* Ember — habit tracker. Vanilla JS, offline-first, data stays on the device. */
'use strict';

/* ================= Constants ================= */
const STORE = 'ember.v1';
const NATIVE = window.EmberAndroid || null; // present inside the Android app
const VERSION = '1.4.0';
const COLORS = ['#F2685B', '#F28C38', '#E9B23F', '#93C83F', '#34C38F', '#26B5B0', '#3FA2F2', '#6F7CF2', '#A26EF2', '#E8609E'];
const OLD_COLORS = ['#FF6B6B', '#FF8A3D', '#FFC23D', '#A6E35A', '#3DDC97', '#2CC7C9', '#4DA8FF', '#7C7CFF', '#B26BFF', '#FF6BC1'];
const HABIT_ICONS = ['droplet', 'flower-2', 'book-open', 'dumbbell', 'footprints', 'bike', 'waves', 'activity',
  'pen-line', 'notebook-pen', 'moon', 'bed', 'sun', 'sunrise', 'smartphone', 'laptop',
  'code', 'brain', 'target', 'timer', 'alarm-clock', 'salad', 'apple', 'carrot',
  'glass-water', 'coffee', 'pill', 'heart', 'hand-heart', 'smile', 'sprout', 'leaf',
  'sparkles', 'piggy-bank', 'guitar', 'music', 'palette', 'camera', 'languages', 'graduation-cap',
  'headphones', 'mountain', 'cigarette-off', 'ban', 'shower-head', 'phone', 'flame', 'star'];
const EMOJIS = ['💧', '🧘', '📖', '💪', '🏃', '🚶', '✍️', '😴', '📵', '🥗', '🙏', '🧠', '🎯', '🧹', '☀️', '💰',
  '🎸', '🎨', '💊', '🦷', '🍎', '🚭', '🚴', '🏊', '🤸', '📝', '⏰', '❤️', '🌱', '💻', '🗣️', '🎧',
  '🛏️', '🚿', '🍵', '🌊', '🔥', '⭐', '🥦', '🧃', '🎹', '📚', '🧗', '🏋️', '🐶', '🌞', '🫶', '🚀'];
const CHEERS = ['Nice!', 'Boom!', 'Nailed it!', 'Yes!', 'Crushed it!', 'Love it!', 'Another vote cast!', 'Look at you go!', 'Done and dusted!', 'Keep it burning!'];
const TIME_DEFAULT = { morning: '07:30', afternoon: '13:00', evening: '21:00', anytime: '10:00' };
const EMOJI_ICON = {
  '💧': 'droplet', '🧘': 'flower-2', '📖': 'book-open', '💪': 'dumbbell', '🏃': 'footprints', '🚶': 'footprints', '✍️': 'pen-line',
  '😴': 'moon', '📵': 'smartphone', '🥗': 'salad', '🙏': 'hand-heart', '🧠': 'brain', '🎯': 'target', '🧹': 'sparkles', '☀️': 'sun',
  '💰': 'piggy-bank', '🎸': 'guitar', '🎨': 'palette', '💊': 'pill', '🦷': 'smile', '🍎': 'apple', '🚭': 'cigarette-off', '🚴': 'bike',
  '🏊': 'waves', '🤸': 'activity', '📝': 'notebook-pen', '⏰': 'alarm-clock', '❤️': 'heart', '🌱': 'sprout', '💻': 'laptop',
  '🗣️': 'languages', '🎧': 'headphones', '🛏️': 'bed', '🚿': 'shower-head', '🧴': 'droplet', '🍵': 'coffee', '📞': 'phone',
  '🌊': 'waves', '🔥': 'flame', '⭐': 'star',
};
const TIMES = [
  { id: 'morning', label: 'Morning', icon: 'sunrise' },
  { id: 'afternoon', label: 'Afternoon', icon: 'sun' },
  { id: 'evening', label: 'Evening', icon: 'moon' },
  { id: 'anytime', label: 'Anytime', icon: 'infinity' },
];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MILESTONES = [3, 7, 14, 21, 30, 50, 66, 100, 150, 200, 250, 365, 500, 1000];
const STRENGTH_ALPHA = 0.07; // exponential smoothing per scheduled day

const TEMPLATES = [
  { name: 'Drink water', icon: 'droplet', emoji: '💧', color: '#3FA2F2', target: 8, unit: 'glasses', time: 'anytime', freq: { type: 'daily' }, identity: 'takes care of my body', stack: 'wake up', tiny: 'Drink one glass' },
  { name: 'Meditate', icon: 'flower-2', emoji: '🧘', color: '#A26EF2', goal: 'time', target: 10, unit: 'min', time: 'morning', freq: { type: 'daily' }, identity: 'stays calm under pressure', stack: 'brush my teeth', tiny: 'Take 3 slow breaths' },
  { name: 'Read', icon: 'book-open', emoji: '📖', color: '#E9B23F', target: 1, time: 'evening', freq: { type: 'daily' }, identity: 'is always learning', stack: 'get into bed', tiny: 'Read one page' },
  { name: 'Workout', icon: 'dumbbell', emoji: '💪', color: '#F2685B', target: 1, time: 'anytime', freq: { type: 'weekly', times: 4 }, identity: 'does the hard things', stack: 'finish work', tiny: 'Put on workout clothes' },
  { name: 'Walk 10 minutes', icon: 'footprints', emoji: '🚶', color: '#34C38F', target: 1, time: 'afternoon', freq: { type: 'daily' }, identity: 'moves every day', stack: 'eat lunch', tiny: 'Walk to the end of the street' },
  { name: 'Journal', icon: 'pen-line', emoji: '✍️', color: '#E8609E', target: 1, time: 'evening', freq: { type: 'daily' }, identity: 'reflects and grows', stack: 'finish dinner', tiny: 'Write one sentence' },
  { name: 'Sleep by 11 PM', icon: 'moon', emoji: '😴', color: '#6F7CF2', target: 1, time: 'evening', freq: { type: 'daily' }, identity: 'protects my energy', stack: 'set my alarm', tiny: 'Phone on the charger, outside the bedroom' },
  { name: 'No phone first hour', icon: 'smartphone', emoji: '📵', color: '#26B5B0', target: 1, time: 'morning', freq: { type: 'daily' }, identity: 'owns my attention', stack: 'wake up', tiny: 'No phone for the first 5 minutes' },
  { name: 'Gratitude', icon: 'hand-heart', emoji: '🙏', color: '#F28C38', target: 3, unit: 'things', time: 'morning', freq: { type: 'daily' }, identity: 'notices the good', stack: 'sit down for breakfast', tiny: 'Name one good thing' },
  { name: 'Deep work', icon: 'target', emoji: '🎯', color: '#93C83F', goal: 'time', target: 45, unit: 'min', time: 'morning', freq: { type: 'days', days: [1, 2, 3, 4, 5] }, identity: 'does focused, meaningful work', stack: 'open my laptop', tiny: 'Two focused minutes, notifications off' },
  { name: 'Eat greens', icon: 'salad', emoji: '🥗', color: '#93C83F', target: 1, time: 'afternoon', freq: { type: 'daily' }, identity: 'fuels my body well', stack: 'plate my lunch', tiny: 'One bite of vegetables' },
  { name: 'Tidy up', icon: 'sparkles', emoji: '🧹', color: '#26B5B0', target: 1, time: 'evening', freq: { type: 'daily' }, identity: 'keeps a calm space', stack: 'brush my teeth at night', tiny: 'Put away one thing' },
  { name: 'Morning sunlight', icon: 'sunrise', emoji: '☀️', color: '#E9B23F', target: 1, time: 'morning', freq: { type: 'daily' }, identity: 'starts the day with energy', stack: 'make my tea', tiny: 'Step outside for one minute' },
  { name: 'Save money', icon: 'piggy-bank', emoji: '💰', color: '#34C38F', target: 1, time: 'anytime', freq: { type: 'daily' }, identity: 'builds wealth patiently', stack: 'get paid or make a purchase', tiny: 'Skip one impulse buy' },
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
const ICONS = window.ICONS || {};
const ic = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.sparkle || ''}</svg>`;
const glyph = h => h.icon && ICONS[h.icon] ? ic(h.icon) : `<span>${esc(h.emoji || '⭐')}</span>`;
const tile = (h, size = '') => `<div class="tile ${size}" style="--c:${h.color}">${glyph(h)}</div>`;

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
  return { v: 1, habits: [], logs: {}, settings: { name: '', theme: 'dark', weekStart: 1, reminder: { on: false, time: '20:30' }, morning: { on: false, time: '07:30' } }, onboarded: false, dismissed: {} };
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
// v1.2 design: line icons instead of emoji, refined colour palette
(function migrate() {
  for (const h of S.habits) {
    if (!h.icon && EMOJI_ICON[h.emoji]) h.icon = EMOJI_ICON[h.emoji];
    const i = OLD_COLORS.indexOf(String(h.color).toUpperCase());
    if (i >= 0) h.color = COLORS[i];
  }
})();
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(S)); }
  catch (e) { toast('Couldn’t save — storage is blocked or full'); }
}

const UI = { tab: 'today', date: today(), justDone: null, sheet: null, installEvt: null, rings: {}, onbPicks: null, iconPng: {} };

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
const goalOf = h => h.goal || (h.target > 1 ? 'count' : 'check');
const isTimed = h => goalOf(h) === 'time';
// Minutes logged so far, including a timer that is running right now
function liveCount(h, k) {
  const t = S.timer;
  if (t && t.id === h.id && t.k === k) return t.base + (t.running ? (Date.now() - t.start) / 60000 : 0);
  return countOf(h, k);
}
const fmtClock = min => { const sec = Math.max(0, Math.ceil(min * 60 - 0.001)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
const fmtMins = m => m < 1 && m > 0 ? `${Math.round(m * 60)}s` : `${Math.floor(m)}`;
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
  if (isTimed(h) && !isDone(h, k)) { openTimer(id); return; }
  if (isTimed(h) && S.timer && S.timer.id === id) timerStop(false);
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
      setTimeout(() => { confetti(h.color); toast(`🏆 ${st}-${isWeekly(h) ? 'week' : 'day'} streak · ${h.name}!`); }, 250);
      return;
    }
  }
  if (after.due && after.ok === after.due && before.ok < before.due) {
    setTimeout(() => { confetti(); toast(k === today() ? '🎉 Perfect day — every promise kept!' : 'That day is now complete ✨'); buzz([20, 60, 30]); }, 250);
  } else if (nowDone && k === today()) {
    const st = streak(h), cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    toast(st > 1 ? `${cheer} 🔥 ${st}-${isWeekly(h) ? 'week' : 'day'} streak` : `${cheer} ${h.name} ✓`);
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
  if (L[k] === 'skip') toast('Rest day logged — your streak is safe');
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
    id: uid(), name: t.name.trim(), icon: t.icon || '', emoji: t.emoji || '⭐', color: t.color || COLORS[1],
    goal: t.goal || ((t.target | 0) > 1 ? 'count' : 'check'),
    target: Math.max(1, t.target | 0 || 1), unit: (t.unit || '').trim(),
    time: t.time || 'anytime',
    freq: t.freq.type === 'days' ? { type: 'days', days: [...t.freq.days] }
      : t.freq.type === 'weekly' ? { type: 'weekly', times: t.freq.times || 3 } : { type: 'daily' },
    identity: (t.identity || '').trim(), stack: (t.stack || '').trim(), tiny: (t.tiny || '').trim(),
    remind: t.remind || '',
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
  t.innerHTML = `${ic('circle-check', 'sm')}<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
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
      id: h.id, name: h.name, emoji: h.emoji, icon: widgetIcon(h), color: h.color, target: h.target, unit: h.unit, time: h.time,
      freq: h.freq, created: h.created, stack: h.stack, tiny: h.tiny, remind: h.remind || '',
      goal: goalOf(h), count: isTimed(h) ? Math.floor(countOf(h, t)) : countOf(h, t), skip: isSkip(h, t),
      weekDone: weekly ? weekCount(h, t) - (done ? 1 : 0) : 0,
      streakBase: weekly ? streak(h) : streak(h) - (done && scheduled(h, t) ? 1 : 0),
    };
  });
  return { date: t, weekStart: S.settings.weekStart, theme: document.documentElement.dataset.theme, name: S.settings.name, habits };
}
// Widgets can't draw SVG, so each habit icon is rasterised once to a small PNG.
function widgetIcon(h) {
  if (!h.icon || !ICONS[h.icon]) return '';
  const k = h.icon + '|' + h.color;
  if (UI.iconPng[k] != null) return UI.iconPng[k] === 'pending' ? '' : UI.iconPng[k];
  UI.iconPng[k] = 'pending';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="${h.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[h.icon]}</svg>`;
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 96;
      c.getContext('2d').drawImage(img, 0, 0, 96, 96);
      UI.iconPng[k] = c.toDataURL('image/png').split(',')[1];
    } catch (e) { UI.iconPng[k] = ''; }
    clearTimeout(UI.iconSyncT); UI.iconSyncT = setTimeout(nativeSync, 50);
  };
  img.onerror = () => { UI.iconPng[k] = ''; };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return '';
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
    if (c >= h.target) delete L[a.date]; else L[a.date] = isTimed(h) ? h.target : h.target > 1 ? c + 1 : 1;
    if (S.timer && S.timer.id === h.id) { S.timer = null; nativeTimerStop(h.id); }
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
  if (st > 0) meta.push(`<span class="streak">${ic('flame', 'xs')}${st}${isWeekly(h) ? 'w' : ''}</span>`);
  if (skip) meta.push('<span>Rest day</span>');
  else if (isWeekly(h)) meta.push(`<span>${weekCount(h, k)} of ${h.freq.times} this week</span>`);
  else if (isTimed(h)) {
    const run = S.timer && S.timer.id === h.id && S.timer.k === k;
    meta.push(run && S.timer.running ? `<span class="live"><i class="live-dot"></i><span data-tm="${h.id}">${fmtClock(h.target - liveCount(h, k))} left</span></span>`
      : `<span>${done ? h.target : fmtMins(liveCount(h, k))} of ${h.target} min${run ? ' · paused' : ''}</span>`);
  }
  else if (h.target > 1) meta.push(`<span>${c} of ${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</span>`);
  if (!skip && !done && h.stack && !isWeekly(h) && h.target <= 1 && !isTimed(h)) meta.push(`<span class="ell">After I ${esc(h.stack)}</span>`);
  else if (!skip && !done && !st && h.tiny && h.target <= 1 && !isWeekly(h)) meta.push(`<span class="ell">Start tiny: ${esc(h.tiny)}</span>`);
  if (NATIVE && h.remind && !done && !skip) meta.push(`<span class="ell" style="display:inline-flex;align-items:center;gap:3px">${ic('bell', 'xs')}${fmtTime(h.remind)}</span>`);
  if (!meta.length) meta.push(`<span>${done ? 'Completed' : freqText(h)}</span>`);
  const timed = isTimed(h);
  const counter = (h.target > 1 || timed) && !done;
  const lc = timed ? liveCount(h, k) : c, lp = Math.min(1, lc / h.target);
  const running = timed && S.timer && S.timer.id === h.id && S.timer.k === k && S.timer.running;
  const btn = !counter ? ic('check')
    : timed ? `${running ? `<span class="cnt tl" data-tl="${h.id}">${fmtClock(h.target - lc)}</span>` : `<span class="play">${ic('play', 'sm')}</span>`}<span class="mini">${tring(h.id, lp, 40, 2.5, h.color)}</span>`
    : `<span class="cnt">${c}</span><span class="mini">${ring(Math.min(1, c / h.target), 40, 2.5, h.color, null, { noAnim: true })}</span>`;
  return `<div class="habit ${done ? 'is-done' : ''} ${skip ? 'is-skip' : ''} ${UI.justDone === h.id ? 'pop' : ''}"
      style="--c:${h.color}" data-action="open" data-id="${h.id}" role="button" tabindex="0">
    ${tile(h)}
    <div class="h-body">
      <div class="h-name">${esc(h.name)}</div>
      <div class="h-meta">${meta.join('<i class="dot"></i>')}</div>
      ${counter && !skip ? `<div class="h-bar"><i ${timed ? `data-tp="${h.id}"` : ''} style="width:${(lp * 100).toFixed(1)}%"></i></div>` : ''}
    </div>
    <button class="h-check ${counter ? 'counter' : ''}" data-action="check" data-id="${h.id}" aria-label="${done ? 'Undo' : timed ? 'Start timer for' : 'Complete'} ${esc(h.name)}">${btn}</button>
  </div>`;
}

function weekStrip() {
  const t = today(), ws = weekStartKey(UI.date), curWs = weekStartKey(t);
  let days = '';
  for (let i = 0; i < 7; i++) {
    const k = addDays(ws, i), fut = k > t, p = fut ? { pct: 0 } : dayProgress(k);
    days += `<button class="day ${k === t ? 'is-today' : ''} ${k === UI.date ? 'is-sel' : ''}"
        data-action="date" data-k="${k}" ${fut ? 'disabled' : ''} aria-label="${fmtDate(k)}">
      <span class="dl">${DOW[dow(k)].slice(0, 1)}</span>
      <span class="dn">${!fut ? ring(p.pct, 36, 2.5, 'var(--accent)', null, { noAnim: true }) : ''}<span>${parse(k).getDate()}</span></span>
    </button>`;
  }
  return `<div class="week">
    <button class="wk-nav" data-action="week" data-dir="-1" aria-label="Previous week">${ic('chevron-left', 'sm')}</button>
    <div class="week-days">${days}</div>
    <button class="wk-nav" data-action="week" data-dir="1" aria-label="Next week" ${ws >= curWs ? 'disabled' : ''}>${ic('chevron-right', 'sm')}</button>
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
function weekToDate() {
  const t = today(); let due = 0, ok = 0;
  for (let k = weekStartKey(t); k <= t; k = addDays(k, 1)) { const p = dayProgress(k); due += p.due; ok += p.ok; }
  return due ? ok / due : null;
}

function viewToday() {
  const list = active();
  const k = UI.date, t = today(), isToday = k === t;
  const name = S.settings.name ? `, ${esc(S.settings.name)}` : '';
  const head = `<header class="top">
    <div><div class="eyebrow">${fmtDate(t, true)}</div><h1 class="t-display">${greeting()}${name}</h1></div>
    <button class="icon-btn accent-btn" data-action="new" aria-label="New habit">${ic('plus')}</button>
  </header>`;
  if (!list.length) {
    return head + `<div class="card empty">
      <div class="e-art">${ic('flame')}</div><div class="t-title">Start with one small habit</div>
      <p>Pick something so small it feels almost too easy. Consistency first — intensity can come later.</p>
      <button class="btn primary" data-action="new">${ic('plus', 'sm')}Create a habit</button>
    </div>` + principleCard();
  }
  const p = dayProgress(k);
  const left = p.due - p.ok;
  const bestActive = Math.max(0, ...list.map(streak));
  let title, sub;
  if (!p.due) { title = 'Nothing scheduled'; sub = 'A free day. Rest is part of the system.'; }
  else if (p.ok === p.due) { title = isToday ? 'Every habit complete' : 'Day complete'; sub = 'This is what becoming someone looks like.'; }
  else if (p.ok === 0) { title = `${p.due} habit${p.due > 1 ? 's' : ''} ${isToday ? 'today' : 'that day'}`; sub = isToday ? 'Start with the easiest one — momentum beats motivation.' : 'Tap any habit to log it for that day.'; }
  else { title = `${p.ok} of ${p.due} complete`; sub = `${left} to go. Keep the chain alive.`; }
  const wtd = weekToDate();

  const summary = `<section class="card">
    <div class="summary">
      <div class="ring-wrap">${ring(p.pct, 84, 8, 'var(--accent)', 'hero')}
        <div class="ring-label"><div class="big">${Math.round(p.pct * 100)}<small>%</small></div></div></div>
      <div class="s-body"><div class="s-title">${title}</div><div class="s-sub">${sub}</div></div>
    </div>
    <div class="kv">
      <div><div class="v">${ic('flame', 'xs')}${bestActive}</div><div class="l">Best streak</div></div>
      <div><div class="v">${perfectDays(30)}</div><div class="l">Perfect days · 30d</div></div>
      <div><div class="v">${pctTxt(wtd)}</div><div class="l">This week</div></div>
    </div>
  </section>`;

  const viewing = !isToday ? `<div class="viewing"><span>Logging ${fmtDate(k)}</span><button data-action="date" data-k="${t}">Back to today</button></div>` : '';

  let notice = '';
  if (isToday) {
    const miss = missedYesterday();
    if (miss.length && S.dismissed.nmt !== t) {
      notice = `<div class="notice"><div class="ni">${ic('shield', 'sm')}</div><div class="nb"><b>Never miss twice</b>
        ${miss.slice(0, 3).map(h => esc(h.name)).join(', ')}${miss.length > 3 ? ` and ${miss.length - 3} more` : ''} slipped last time. Today, even the two-minute version counts.</div>
        <button class="x" data-action="dismiss" data-what="nmt" aria-label="Dismiss">${ic('x', 'sm')}</button></div>`;
    } else if (NATIVE && NATIVE.setReminders && !S.dismissed.remind && !S.settings.reminder.on && !S.settings.morning.on && !list.some(h => h.remind)) {
      notice = `<div class="notice"><div class="ni">${ic('bell', 'sm')}</div><div class="nb"><b>Let Ember nudge you</b>A morning kickoff, an evening streak saver and per-habit reminders you can tick off right from the notification.
        <div><button class="btn sm primary" data-action="enable-reminders">Turn on reminders</button></div></div>
        <button class="x" data-action="dismiss" data-what="remind" aria-label="Dismiss">${ic('x', 'sm')}</button></div>`;
    } else if (UI.installEvt && !S.dismissed.install) {
      notice = `<div class="notice"><div class="ni">${ic('download', 'sm')}</div><div class="nb"><b>Install Ember</b>Full-screen and offline, right from your home screen.
        <div><button class="btn sm primary" data-action="install">Install app</button></div></div>
        <button class="x" data-action="dismiss" data-what="install" aria-label="Dismiss">${ic('x', 'sm')}</button></div>`;
    }
  }

  let groups = '';
  for (const tm of TIMES) {
    const hs = list.filter(h => h.time === tm.id && scheduled(h, k) && (!isWeekly(h) || !weekMet(h, k) || isDone(h, k)));
    if (!hs.length) continue;
    const ok = hs.filter(h => satisfied(h, k)).length;
    groups += `<section class="section"><div class="section-head"><h3>${ic(tm.icon)}${tm.label}</h3><span class="count">${ok}/${hs.length}</span></div>
      <div class="habits">${hs.map(h => habitCard(h, k)).join('')}</div></section>`;
  }
  const met = list.filter(h => isWeekly(h) && scheduled(h, k) && weekMet(h, k) && !isDone(h, k));
  if (met.length) {
    groups += `<section class="section"><div class="section-head"><h3>${ic('calendar-check')}Weekly goal reached</h3><span class="count">${met.length}</span></div>
      <div class="habits">${met.map(h => habitCard(h, k)).join('')}</div></section>`;
  }
  const notToday = list.filter(h => !scheduled(h, k) && k >= h.created);
  const restNote = notToday.length ? `<p class="rest-note">${ic('moon', 'xs')}Off ${isToday ? 'today' : 'this day'}: ${notToday.map(h => esc(h.name)).join(', ')}</p>` : '';
  return head + summary + weekStrip() + viewing + notice + groups + restNote + principleCard();
}
function principleCard() {
  const [tag, q] = principleOfDay();
  return `<section class="principle"><div class="tag">${ic('sparkle', 'xs')}Principle · ${tag}</div><div class="q">${q}</div></section>`;
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
  const head = `<header class="top"><div><div class="eyebrow">Last 30 days</div><h1 class="t-display">Progress</h1></div></header>`;
  if (!list.length) return head + `<div class="card empty"><div class="e-art">${ic('chart-column')}</div><div class="t-title">Nothing to measure yet</div><p>Add a habit and your consistency, streaks and habit strength will build up here.</p><button class="btn primary" data-action="new">${ic('plus', 'sm')}Create a habit</button></div>`;
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

  const wd = Array.from({ length: 7 }, () => ({ due: 0, ok: 0 }));
  for (let i = 1; i <= 56; i++) {
    const k = addDays(t, -i), p = dayProgress(k);
    wd[dow(k)].due += p.due; wd[dow(k)].ok += p.ok;
  }
  const wdr = wd.map((x, i) => ({ i, r: x.due >= 3 ? x.ok / x.due : null })).filter(x => x.r != null);
  const ins = [];
  if (wdr.length >= 4) {
    const sorted = [...wdr].sort((a, b) => b.r - a.r);
    const hi = sorted[0], lo = sorted[sorted.length - 1];
    ins.push(['trophy', `<b>${DOW[hi.i]}s are your strongest day</b> at ${pctTxt(hi.r)}. Whatever your routine is that day — copy it.`]);
    if (hi.r - lo.r > .1) ins.push(['compass', `<b>${DOW[lo.i]}s are the weak spot</b> at ${pctTxt(lo.r)}. Plan the two-minute versions the night before.`]);
  }
  const scored = list.map(h => ({ h, r: rate(h, 30) })).filter(x => x.r != null);
  if (scored.length >= 2) {
    const s = [...scored].sort((a, b) => b.r - a.r);
    const top = s[0], low = s[s.length - 1];
    ins.push(['trending-up', `<b>${esc(top.h.name)}</b> is your most reliable habit at ${pctTxt(top.r)}. It’s becoming part of who you are.`]);
    if (low.r < .6 && low.h.id !== top.h.id) ins.push(['sprout', `<b>${esc(low.h.name)}</b> is at ${pctTxt(low.r)}. Try shrinking it${low.h.tiny ? ` to “${esc(low.h.tiny)}”` : ''} or stacking it after something you never skip.`]);
  }
  if (!ins.length) ins.push(['info', 'Insights appear after a couple of weeks of tracking. Keep showing up — the data is building.']);
  const insights = `<div class="list-card">${ins.map(([i, h]) => `<div class="insight"><div class="ii">${ic(i)}</div><div>${h}</div></div>`).join('')}</div>`;

  const rows = list.map(h => {
    const r = rate(h, 30), s = strength(h);
    return `<button class="prow" data-action="open" data-id="${h.id}" style="--c:${h.color}">
      ${tile(h, 'sm')}
      <div class="pb"><div class="pn"><span>${esc(h.name)}</span><span>${Math.round(s * 100)}% · ${strengthLabel(s)}</span></div>
      <div class="track"><i style="width:${(s * 100).toFixed(1)}%"></i></div></div>
    </button>`;
  }).join('');

  return head + `<section class="card score">
      ${ring(cons, 92, 9, 'var(--accent)', 'cons')}
      <div><div class="num">${Math.round(cons * 100)}<small>%</small></div><div class="lbl">Consistency score</div>
      ${delta != null ? `<span class="delta ${delta >= 0 ? 'up' : 'down'}">${ic(delta >= 0 ? 'trending-up' : 'trending-down', 'xs')}${delta >= 0 ? '+' : '−'}${Math.abs(delta)} pts vs prior 30 days</span>` : ''}</div>
    </section>
    <div class="kpis">
      <div class="kpi"><div class="v">${Math.round(strengthAvg * 100)}%</div><div class="l">Avg. strength</div></div>
      <div class="kpi"><div class="v">${perfectDays(30)}</div><div class="l">Perfect days</div></div>
      <div class="kpi"><div class="v">${best}</div><div class="l">Longest streak</div></div>
    </div>
    <section class="section"><div class="section-head"><h3>Last 14 days</h3><span class="count">${total} check-ins total</span></div>
      <div class="card"><div class="bars">${bars}</div></div></section>
    <section class="section"><div class="section-head"><h3>Activity</h3><span class="count">20 weeks</span></div>
      <div class="card">${globalHeatmap(20)}
      <div class="legend">Less <i class="hm-c"></i><i class="hm-c l1"></i><i class="hm-c l2"></i><i class="hm-c l3"></i><i class="hm-c l4"></i> More</div></div></section>
    <section class="section"><div class="section-head"><h3>Insights</h3></div>${insights}</section>
    <section class="section"><div class="section-head"><h3>Habit strength</h3></div><div class="list-card">${rows}</div></section>`;
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
  const head = `<header class="top"><div><div class="eyebrow">${list.length} active</div><h1 class="t-display">Habits</h1></div>
    <button class="icon-btn accent-btn" data-action="new" aria-label="New habit">${ic('plus')}</button></header>`;
  const row = (h, i, n, isArch) => `<div class="mrow">
    ${tile(h, 'sm')}
    <div class="mb" data-action="open" data-id="${h.id}"><div class="mn">${esc(h.name)}</div><div class="ms">${freqText(h)} · ${TIMES.find(t => t.id === h.time).label}${h.target > 1 ? ` · ${h.target} ${esc(h.unit)}` : ''}</div></div>
    <div class="acts">${isArch
      ? `<button class="mini-btn" data-action="unarchive" data-id="${h.id}" aria-label="Restore">${ic('archive-restore')}</button><button class="mini-btn" data-action="delete" data-id="${h.id}" aria-label="Delete">${ic('trash-2')}</button>`
      : `<button class="mini-btn" data-action="move" data-dir="-1" data-id="${h.id}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${ic('arrow-up')}</button>
         <button class="mini-btn" data-action="move" data-dir="1" data-id="${h.id}" ${i === n - 1 ? 'disabled' : ''} aria-label="Move down">${ic('arrow-down')}</button>
         <button class="mini-btn" data-action="edit" data-id="${h.id}" aria-label="Edit">${ic('pencil')}</button>`}</div>
  </div>`;
  let html = head;
  if (list.length) html += `<div class="list-card">${list.map((h, i) => row(h, i, list.length)).join('')}</div>`;
  else html += `<div class="card empty"><div class="e-art">${ic('sprout')}</div><div class="t-title">No habits yet</div><p>Pick one from the ideas below, or create your own.</p></div>`;
  if (list.length >= 6) html += `<div class="warn">${ic('info', 'sm')}<div>You’re tracking ${list.length} habits. Fewer habits, done consistently, tend to stick better — consider archiving the ones that already feel automatic.</div></div>`;
  if (arch.length) html += `<section class="section"><div class="section-head"><h3>Archived</h3><span class="count">${arch.length}</span></div><div class="list-card">${arch.map((h, i) => row(h, i, arch.length, true)).join('')}</div></section>`;
  const names = new Set(S.habits.map(h => h.name.toLowerCase()));
  const ideas = TEMPLATES.map((t, i) => ({ t, i })).filter(x => !names.has(x.t.name.toLowerCase()));
  if (ideas.length) html += `<section class="section"><div class="section-head"><h3>Ideas</h3><span class="count">Tap to customise</span></div>
    <div class="ideas">${ideas.map(x => `<button class="idea" data-action="template" data-i="${x.i}">${tile(x.t, 'sm')}${esc(x.t.name)}</button>`).join('')}</div></section>`;
  return html;
}

/* ---------- Settings ---------- */
function viewSettings() {
  const s = S.settings;
  const seg = (name, val, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(val) === String(v) ? 'on' : ''}" data-action="setting" data-k="${name}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const si = (icon, c) => `<span class="si" style="--c:${c}">${ic(icon)}</span>`;
  const installed = matchMedia('(display-mode: standalone)').matches;
  return `<header class="top"><div><div class="eyebrow">Settings</div><h1 class="t-display">You</h1></div></header>
  <div class="set-group"><h3>Profile</h3><div class="set-card">
    <div class="set-row">${si('user-round', '#3FA2F2')}<span class="st">Name</span><input class="input" id="set-name" value="${esc(s.name)}" placeholder="Your name" maxlength="24" autocomplete="given-name"></div>
  </div></div>
  <div class="set-group"><h3>Preferences</h3><div class="set-card">
    <div class="set-row">${si('palette', '#A26EF2')}<span class="st">Appearance</span>${seg('theme', s.theme, [['system', 'Auto'], ['dark', 'Dark'], ['light', 'Light']])}</div>
    <div class="set-row">${si('calendar', '#34C38F')}<span class="st">Week starts on</span>${seg('weekStart', s.weekStart, [[1, 'Mon'], [0, 'Sun']])}</div>
  </div></div>
  ${NATIVE ? `<div class="set-group"><h3>Reminders</h3><div class="set-card">
    ${UI.notifOff ? `<button class="set-row" data-action="notif-settings">${si('bell', '#F2685B')}<span class="st" style="color:var(--bad)">Notifications are off<small>Tap to allow them in Android settings.</small></span>${ic('chevron-right', 'sm chev')}</button>` : ''}
    <div class="set-row">${si('sunrise', '#E9B23F')}<span class="st">Morning kickoff<small>Today’s plan, first thing.</small></span>${seg('morning', s.morning.on ? 'on' : 'off', [['off', 'Off'], ['on', 'On']])}</div>
    ${s.morning.on ? `<div class="set-row">${si('clock', '#E9B23F')}<span class="st">Time</span><input class="input" type="time" id="set-morning" value="${esc(s.morning.time)}" style="max-width:160px;padding:0 12px"></div>` : ''}
    <div class="set-row">${si('flame', '#F28C38')}<span class="st">Evening streak saver<small>Only when habits are still open.</small></span>${seg('reminder', s.reminder.on ? 'on' : 'off', [['off', 'Off'], ['on', 'On']])}</div>
    ${s.reminder.on ? `<div class="set-row">${si('clock', '#F28C38')}<span class="st">Time</span><input class="input" type="time" id="set-remind" value="${esc(s.reminder.time)}" style="max-width:160px;padding:0 12px"></div>` : ''}
    <button class="set-row" data-action="test-notif">${si('bell', '#6F7CF2')}<span class="st">Send a test notification<small>See how a habit reminder looks.</small></span>${ic('chevron-right', 'sm chev')}</button>
  </div><p class="hint" style="margin:8px 4px 0">Set a reminder for each habit in its editor — you can tick it off straight from the notification.</p></div>` : ''}
  ${NATIVE ? `<div class="set-group"><h3>Home screen widgets</h3><div class="set-card">
    <button class="set-row" data-action="pin-widget" data-w="today">${si('list-checks', '#6F7CF2')}<span class="st">Today list<small>Check off habits from your home screen.</small></span><span class="btn sm">Add</span></button>
    <button class="set-row" data-action="pin-widget" data-w="ring">${si('layout-grid', '#6F7CF2')}<span class="st">Progress ring<small>Today’s progress and best streak.</small></span><span class="btn sm">Add</span></button>
  </div><p class="hint" style="margin:8px 4px 0">Or long-press your home screen → Widgets → Ember.</p></div>` : ''}
  ${NATIVE ? '' : `<div class="set-group"><h3>App</h3><div class="set-card">
    ${installed ? `<div class="set-row">${si('circle-check', '#34C38F')}<span class="st">Installed<small>Ember is running as an app on this device.</small></span></div>`
      : `<button class="set-row" data-action="install">${si('download', '#3FA2F2')}<span class="st">Install on home screen<small>${UI.installEvt ? 'Full-screen and offline, like a native app.' : 'In Chrome: ⋮ menu → Add to Home screen.'}</small></span>${ic('chevron-right', 'sm chev')}</button>`}
  </div></div>`}
  <div class="set-group"><h3>Data</h3><div class="set-card">
    <button class="set-row" data-action="export">${si('download', '#34C38F')}<span class="st">Export backup<small>Save all habits and history to a file.</small></span>${ic('chevron-right', 'sm chev')}</button>
    <button class="set-row" data-action="import">${si('upload', '#3FA2F2')}<span class="st">Import backup<small>Restore from an Ember backup file.</small></span>${ic('chevron-right', 'sm chev')}</button>
    <button class="set-row" data-action="reset">${si('trash-2', '#F2685B')}<span class="st" style="color:var(--bad)">Erase all data<small>Delete every habit and its history.</small></span></button>
  </div><p class="hint" style="margin:8px 4px 0">Your data stays private on this device.</p></div>
  <div class="set-group"><h3>The method</h3><div class="science">
    <div class="sci">${ic('user-round')}<div><b>Identity first</b><p>Each habit carries an identity — “I am someone who…”. Outcomes fade; identity sticks. Every check-in is evidence.</p></div></div>
    <div class="sci">${ic('feather')}<div><b>Two-minute version</b><p>Write the tiniest version of each habit. On bad days, do just that — showing up keeps the identity alive.</p></div></div>
    <div class="sci">${ic('link')}<div><b>Habit stacking</b><p>Anchor new habits to existing ones: “After I pour my coffee, I will meditate.” A clear cue beats willpower.</p></div></div>
    <div class="sci">${ic('shield')}<div><b>Never miss twice</b><p>Ember flags a miss the next day. One slip is normal; two in a row is where habits break.</p></div></div>
    <div class="sci">${ic('moon')}<div><b>Rest days</b><p>Mark planned rest as a skip. Your streak is protected and your stats stay honest.</p></div></div>
    <div class="sci">${ic('trending-up')}<div><b>Habit strength</b><p>A smoothed score that rises with consistency and dips gently on misses, so one bad day never erases months of work. Habits often take around two months to feel automatic.</p></div></div>
  </div></div>
  <p class="foot">Ember ${VERSION}</p>`;
}

/* ---------- Onboarding ---------- */
function viewOnboarding() {
  if (!UI.onbPicks) UI.onbPicks = new Set();
  const n = UI.onbPicks.size;
  const picks = TEMPLATES.map((t, i) => `<button class="pick ${UI.onbPicks.has(i) ? 'on' : ''}" style="--c:${t.color}" data-action="onb-pick" data-i="${i}">
    ${tile(t, 'sm')}<span class="ck">${ic('check')}</span><span class="n">${esc(t.name)}</span><span class="t">${esc(t.tiny)}</span></button>`).join('');
  return `<div class="onb">
    <div class="logo"><svg viewBox="0 0 24 24"><path d="M12 2c1.3 4.3 6.5 6.8 6.5 12.7A6.4 6.4 0 0 1 12 21a6.4 6.4 0 0 1-6.5-6.3c0-2.6 1.1-4.3 2.4-5.7.3 2.1 1.4 3.4 2.8 3.9C10 9.6 10.7 5.5 12 2Z"/></svg></div>
    <h1>Small habits,<br><span class="accent">kept alive daily.</span></h1>
    <p class="lead">Become the person you want to be — one small, repeatable action at a time.</p>
    <div class="field"><label for="onb-name">What should we call you?</label>
      <input class="input" id="onb-name" placeholder="First name" maxlength="24" autocomplete="given-name" value="${esc(S.settings.name)}"></div>
    <div class="field"><label>Choose where to start</label>
      <p class="help" style="margin:-2px 2px 12px">We recommend one to three. Fewer habits, done every day, beat many done sometimes.</p>
      <div class="picks">${picks}</div>
      ${n > 4 ? `<div class="warn">${ic('info', 'sm')}<div>That’s ${n} habits — ambitious. Consider starting with three and adding more once they feel easy.</div></div>` : ''}
    </div>
    <div class="onb-foot"><button class="btn primary block" data-action="onb-start">${n ? `Continue with ${n} habit${n > 1 ? 's' : ''}` : 'Start with a blank slate'}</button></div>
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
  keepAwake(false);
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
  const unit = isWeekly(h) ? 'wk' : (st === 1 ? 'day' : 'days');
  const why = [];
  if (h.identity) why.push(`<div class="li">${ic('user-round', 'sm')}<div><small>Identity</small>I am someone who ${esc(h.identity)}.</div></div>`);
  if (h.stack) why.push(`<div class="li">${ic('link', 'sm')}<div><small>Cue</small>After I ${esc(h.stack)}, I will ${esc(h.name.toLowerCase())}.</div></div>`);
  if (h.tiny) why.push(`<div class="li">${ic('feather', 'sm')}<div><small>Two-minute version</small>${esc(h.tiny)}</div></div>`);
  if (h.remind && NATIVE) why.push(`<div class="li">${ic('bell', 'sm')}<div><small>Reminder</small>Every scheduled day at ${fmtTime(h.remind)}</div></div>`);
  const c = countOf(h, k), skip = isSkip(h, k), done = isDone(h, k);
  const dayLbl = k === t ? 'today' : fmtDate(k);
  const ctl = isTimed(h)
    ? (done ? `<button class="btn" style="flex:1" data-action="check" data-id="${h.id}">${ic('check', 'sm')}${h.target} min · completed</button>`
      : `<button class="btn primary" style="flex:1" data-action="timer" data-id="${h.id}">${ic('play', 'sm')}${c > 0 ? `Continue · ${fmtMins(c)}/${h.target} min` : `Start ${h.target}-min timer`}</button>`)
    : h.target > 1
    ? `<div class="stepper"><button data-action="dec" data-id="${h.id}" aria-label="Decrease">${ic('chevron-left', 'sm')}</button><span class="sv">${c}<small> / ${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</small></span><button data-action="inc" data-id="${h.id}" aria-label="Increase">${ic('plus', 'sm')}</button></div>`
    : `<button class="btn ${done ? '' : 'primary'}" style="flex:1" data-action="check" data-id="${h.id}">${done ? `${ic('check', 'sm')}Completed ${dayLbl}` : `Mark done ${k === t ? 'today' : `· ${dayLbl}`}`}</button>`;
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
    <div class="d-head">${tile(h, 'lg')}<div class="dh-body"><h2>${esc(h.name)}</h2><p>${freqText(h)} · ${TIMES.find(x => x.id === h.time).label}${h.target > 1 ? ` · ${h.target} ${esc(h.unit)}` : ''}</p></div>
      <button class="icon-btn" data-action="close-sheet" aria-label="Close">${ic('x', 'sm')}</button></div>
    ${why.length ? `<div class="list-card">${why.join('')}</div>` : ''}
    <div class="today-ctl">${ctl}
      <button class="btn" data-action="skip" data-id="${h.id}" ${k > t ? 'disabled' : ''} style="${skip ? 'color:var(--accent);border-color:var(--accent)' : ''}">${ic('moon', 'sm')}${skip ? 'Resting' : 'Rest day'}</button></div>
    <div class="stats">
      <div class="stat"><div class="v">${st}<small>${unit}</small></div><div class="l">Current streak</div></div>
      <div class="stat"><div class="v">${best}<small>${isWeekly(h) ? 'wk' : 'days'}</small></div><div class="l">Best streak</div></div>
      <div class="stat"><div class="v">${pctTxt(r)}</div><div class="l">Last 30 days</div></div>
      <div class="stat"><div class="v">${totalDone(h)}</div><div class="l">Total check-ins</div></div>
      <div class="stat wide">${ring(s, 60, 6, h.color, 'str-' + h.id)}<div class="info"><div class="v">${Math.round(s * 100)}%<span class="badge">${strengthLabel(s)}</span></div>
        <p>Habit strength rises with every check-in and dips gently on misses. Around two months of consistency usually makes it automatic.</p></div></div>
    </div>
    <section class="section"><div class="section-head"><h3>History</h3><span class="count">Tap a day to edit</span></div>
      <div class="card" style="padding:14px">${heatmap(cell, 18)}</div></section>
    <div class="btn-row" style="margin-top:20px">
      <button class="btn" data-action="edit" data-id="${h.id}">${ic('pencil', 'sm')}Edit</button>
      <button class="btn" data-action="archive" data-id="${h.id}">${ic('archive', 'sm')}Archive</button>
      <button class="btn danger" data-action="delete" data-id="${h.id}" aria-label="Delete" style="flex:0 0 50px;padding:0">${ic('trash-2', 'sm')}</button>
    </div>
  </div>`;
}
function openHabit(id) { const h = byId(id); if (h) openSheet(habitSheet(h), 'habit', id); }

/* ---------- Editor ---------- */
let D = null; // draft
function draftFrom(src) {
  return {
    id: src.id || null, name: src.name || '', icon: src.icon || (EMOJI_ICON[src.emoji] || 'star'),
    emoji: src.emoji || Object.keys(EMOJI_ICON).find(e => EMOJI_ICON[e] === src.icon) || '⭐',
    style: src.icon || !src.id ? 'icon' : 'emoji', remind: src.remind || '',
    color: src.color || COLORS[1],
    goal: src.goal || ((src.target || 1) > 1 ? 'count' : 'check'),
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
  const tpl = D.isNew ? `<div class="field" style="margin-top:0"><label>Start from an idea</label><div class="chips scroll">${TEMPLATES.map((t, i) => `<button class="chip" data-action="e-tpl" data-i="${i}" style="--c:${t.color}"><span style="color:${t.color};display:flex">${ic(t.icon, 'sm')}</span>${esc(t.name)}</button>`).join('')}</div></div>` : '';
  return `<div class="sheet-title"><h2 class="t-title">${D.isNew ? 'New habit' : 'Edit habit'}</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${ic('x', 'sm')}</button></div>
    ${tpl}
    <div class="preview" style="margin-top:${D.isNew ? 20 : 0}px">${tile({ ...D, icon: D.style === 'icon' ? D.icon : '' })}<div style="min-width:0"><div class="pv-n" id="pv-n">${esc(D.name) || 'Untitled habit'}</div><div class="pv-s">${freqText(D)} · ${TIMES.find(t => t.id === D.time).label}</div></div></div>
    <div class="field"><label for="e-name">Name</label><input class="input" id="e-name" data-f="name" value="${esc(D.name)}" placeholder="e.g. Read 10 pages" maxlength="40" autocomplete="off"></div>
    <div class="field"><label>Icon</label>
      <div class="seg" style="margin-bottom:10px"><button class="${D.style === 'icon' ? 'on' : ''}" data-action="e-style" data-v="icon">Icons</button><button class="${D.style === 'emoji' ? 'on' : ''}" data-action="e-style" data-v="emoji">Emoji</button></div>
      <div class="icons-grid" style="--c:${D.color}">${D.style === 'icon'
        ? HABIT_ICONS.map(n => `<button class="${n === D.icon ? 'on' : ''}" data-action="e-icon" data-v="${n}" aria-label="${n}">${ic(n)}</button>`).join('')
        : EMOJIS.map(e => `<button class="emo ${e === D.emoji ? 'on' : ''}" data-action="e-emoji" data-v="${e}">${e}</button>`).join('')}</div></div>
    <div class="field"><label>Colour</label><div class="colors">${COLORS.map(c => `<button class="${c === D.color ? 'on' : ''}" style="--sw:${c}" data-action="e-color" data-v="${c}" aria-label="Colour ${c}"></button>`).join('')}</div></div>
    <div class="field"><label>Goal</label>
      <div class="seg"><button class="${D.goal === 'check' ? 'on' : ''}" data-action="e-goal" data-v="check">Once</button><button class="${D.goal === 'count' ? 'on' : ''}" data-action="e-goal" data-v="count">Number</button><button class="${D.goal === 'time' ? 'on' : ''}" data-action="e-goal" data-v="time">${ic('timer', 'sm')}Timed</button></div>
      ${D.goal === 'time' ? `<div style="display:flex;gap:12px;margin-top:10px;align-items:center">
        <div class="stepper"><button data-action="e-mins" data-d="-1" aria-label="Fewer minutes">${ic('chevron-left', 'sm')}</button><span class="sv">${D.target}<small> min</small></span><button data-action="e-mins" data-d="1" aria-label="More minutes">${ic('plus', 'sm')}</button></div>
        <span class="t-cap">Completes when the timer finishes</span></div>
        <div class="chips" style="margin-top:10px">${[5, 10, 15, 20, 30, 45, 60].map(m => `<button class="chip ${D.target === m ? 'on' : ''}" data-action="e-minset" data-v="${m}">${m} min</button>`).join('')}</div>` : ''}
      ${D.goal === 'count' ? `<div style="display:flex;gap:8px;margin-top:10px;align-items:center">
        <div class="stepper"><button data-action="e-target" data-d="-1" aria-label="Decrease">${ic('chevron-left', 'sm')}</button><span class="sv">${D.target}</span><button data-action="e-target" data-d="1" aria-label="Increase">${ic('plus', 'sm')}</button></div>
        <input class="input" data-f="unit" value="${esc(D.unit)}" placeholder="Unit — glasses, pages…" maxlength="16" style="flex:1"></div>` : ''}
    </div>
    <div class="field"><label>Frequency</label>
      <div class="seg">${[['daily', 'Daily'], ['days', 'Specific days'], ['weekly', 'Weekly goal']].map(([v, l]) => `<button class="${f.type === v ? 'on' : ''}" data-action="e-freq" data-v="${v}">${l}</button>`).join('')}</div>
      ${f.type === 'days' ? `<div class="chips" style="margin-top:10px;justify-content:space-between">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button class="chip round ${f.days.includes(d) ? 'on' : ''}" data-action="e-day" data-v="${d}">${DOW[d].slice(0, 2)}</button>`).join('')}</div>` : ''}
      ${f.type === 'weekly' ? `<div style="display:flex;gap:12px;margin-top:10px;align-items:center"><div class="stepper"><button data-action="e-times" data-d="-1" aria-label="Decrease">${ic('chevron-left', 'sm')}</button><span class="sv">${f.times}×</span><button data-action="e-times" data-d="1" aria-label="Increase">${ic('plus', 'sm')}</button></div><span class="t-cap">per week, any days</span></div>` : ''}
    </div>
    <div class="field"><label>Time of day</label><div class="chips">${TIMES.map(t => `<button class="chip ${D.time === t.id ? 'on' : ''}" data-action="e-time" data-v="${t.id}">${ic(t.icon)}${t.label}</button>`).join('')}</div></div>
    ${NATIVE ? `<div class="field"><label>Reminder</label>
      <div class="seg"><button class="${D.remind ? '' : 'on'}" data-action="e-remind" data-v="off">Off</button><button class="${D.remind ? 'on' : ''}" data-action="e-remind" data-v="on">Remind me</button></div>
      ${D.remind ? `<div style="display:flex;gap:12px;margin-top:10px;align-items:center"><input class="input" type="time" id="e-remind-time" value="${esc(D.remind)}" style="max-width:160px;padding:0 12px"><span class="t-cap">Tick it off right from the notification</span></div>` : ''}
    </div>` : ''}
    <div class="stick-card"><div class="sc-head">${ic('wand-sparkles', 'sm')}Make it stick</div>
      <p class="help" style="margin:4px 0 0">Optional, but these three answers are what separate habits that last from ones that fade.</p>
      <div class="field"><label>Identity</label><div class="prefix" style="--pl:160px"><span>I am someone who</span><input class="input" data-f="identity" value="${esc(D.identity)}" placeholder="reads every day" maxlength="60"></div>
        <p class="help">Who does this habit prove you are?</p></div>
      <div class="field"><label>Cue</label><div class="prefix" style="--pl:64px"><span>After I</span><input class="input" data-f="stack" value="${esc(D.stack)}" placeholder="pour my morning coffee" maxlength="60"></div>
        <p class="help">Anchor it to something you already do every day.</p></div>
      <div class="field"><label>Two-minute version</label><input class="input" data-f="tiny" value="${esc(D.tiny)}" placeholder="Read one page" maxlength="60">
        <p class="help">The smallest version you can do on your worst day.</p></div>
    </div>
    <div class="edit-foot"><button class="btn primary block" data-action="e-save">${D.isNew ? 'Create habit' : 'Save changes'}</button></div>`;
}
function saveDraft() {
  const name = D.name.trim();
  if (!name) { toast('Give your habit a name'); const el = document.getElementById('e-name'); el && el.focus(); return; }
  if (D.freq.type === 'days' && !D.freq.days.length) { toast('Pick at least one day'); return; }
  if (D.goal === 'time') D.unit = 'min';
  if (D.goal === 'check') D.target = 1;
  const freq = D.freq.type === 'days' ? { type: 'days', days: [...D.freq.days].sort() } : D.freq.type === 'weekly' ? { type: 'weekly', times: D.freq.times } : { type: 'daily' };
  let h;
  const icon = D.style === 'icon' ? D.icon : '';
  if (D.isNew) { h = addHabit({ ...D, icon, freq }); }
  else {
    h = byId(D.id); if (!h) return;
    Object.assign(h, { name, icon, emoji: D.emoji, remind: D.remind, color: D.color, goal: D.goal, target: Math.max(1, D.target), unit: D.unit.trim(), time: D.time, freq, identity: D.identity.trim(), stack: D.stack.trim(), tiny: D.tiny.trim() });
  }
  save();
  const wasNew = D.isNew; D = null;
  if (wasNew) {
    closeSheet(); UI.tab = 'today'; UI.date = today(); render();
    toast(`${h.name} added — start tiny`);
  } else { render(); openHabit(h.id); toast('Changes saved'); }
}

/* ================= Timer ================= */
function tring(id, pct, size, stroke, color) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
    <circle class="ring-fg t" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" style="stroke:${color}"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})" data-tr="${id}" data-c="${c}"/>
  </svg>`;
}
function openTimer(id) {
  const h = byId(id); if (!h) return;
  if (UI.date > today()) return;
  openSheet(timerSheet(h), 'timer', id);
  keepAwake(!!(S.timer && S.timer.id === id && S.timer.running));
}
function refreshTimer() {
  if (!UI.sheet || UI.sheet.kind !== 'timer') return;
  const h = byId(UI.sheet.data), wrap = document.querySelector('.sheet-wrap');
  if (h && wrap) wrap.querySelector('.sheet-body').innerHTML = timerSheet(h);
}
function timerSheet(h) {
  const t = S.timer, mine = t && t.id === h.id;
  const k = mine ? t.k : UI.date;
  const v = liveCount(h, k), pct = Math.min(1, v / h.target), done = isDone(h, k) && !mine;
  const running = mine && t.running;
  const st = streak(h);
  const center = done
    ? `<div class="t-done">${ic('check')}</div><div class="tsub">${h.target} min complete${st > 1 ? ` · 🔥 ${st}-day streak` : ''}</div>`
    : `<div class="tclock" data-tl="${h.id}">${fmtClock(h.target - v)}</div><div class="tsub">${running ? 'remaining' : v > 0 ? 'paused' : `${h.target} minute${h.target > 1 ? 's' : ''}`}</div>`;
  const hint = h.tiny && !done ? `<p class="t-hint">${ic('feather', 'xs')}Short on time? “${esc(h.tiny)}” still counts.</p>` : '';
  return `<div class="timer" style="--c:${h.color}">
    <div class="d-head">${tile(h)}<div class="dh-body"><h2>${esc(h.name)}</h2><p>${k === today() ? 'Today' : fmtDate(k)} · ${h.target}-minute session</p></div>
      <button class="icon-btn" data-action="close-sheet" aria-label="Close">${ic('x', 'sm')}</button></div>
    <div class="t-ring ${running ? 'is-running' : ''} ${done ? 'is-done' : ''}">${tring(h.id, done ? 1 : pct, 248, 12, h.color)}<div class="t-center">${center}</div></div>
    ${done ? `<div class="t-ctl"><button class="btn" data-action="t-again">${ic('rotate-ccw', 'sm')}Go again</button><button class="btn primary" data-action="close-sheet">Close</button></div>`
      : `<div class="t-ctl">
        <button class="t-btn" data-action="t-reset" aria-label="Reset" ${v > 0 ? '' : 'disabled'}>${ic('rotate-ccw')}</button>
        <button class="t-btn main" data-action="t-toggle" aria-label="${running ? 'Pause' : 'Start'}">${ic(running ? 'pause' : 'play', 'lg')}</button>
        <button class="t-btn" data-action="t-done" aria-label="Mark complete">${ic('check')}</button>
      </div>
      <p class="t-cap">${running ? (NATIVE ? 'You can leave the app — Ember will ping you when time’s up.' : 'Keep this tab open — Ember will chime when time’s up.') : v > 0 ? `${fmtMins(v)} of ${h.target} min done · tap play to continue` : 'Tap play to start. Check marks it done early.'}</p>`}
    ${hint}
  </div>`;
}
function timerStart(id) {
  const h = byId(id); if (!h) return;
  const k = UI.date; if (k > today()) return;
  if (S.timer && S.timer.id !== id) timerStop(true);
  unlockAudio();
  const base = S.timer && S.timer.id === id ? liveCount(h, S.timer.k) : (isDone(h, k) ? 0 : countOf(h, k));
  S.timer = { id, k: S.timer && S.timer.id === id ? S.timer.k : k, base, start: Date.now(), running: true };
  save(); buzz(15);
  nativeTimerStart(h, Date.now() + (h.target - base) * 60000);
  keepAwake(true); tick(); render(); refreshTimer();
}
function timerPause() {
  const t = S.timer; if (!t || !t.running) return;
  const h = byId(t.id); const v = liveCount(h, t.k);
  logMin(h, t.k, v); t.base = v; t.running = false; save();
  nativeTimerStop(t.id); keepAwake(false); buzz(10); render(); refreshTimer();
}
// Stop the active timer, keeping the minutes done so far (or discarding them)
function timerStop(keep) {
  const t = S.timer; if (!t) return;
  const h = byId(t.id);
  if (h && keep) logMin(h, t.k, liveCount(h, t.k));
  S.timer = null; save(); nativeTimerStop(t.id); keepAwake(false);
}
function timerReset(id) {
  const h = byId(id); if (!h) return;
  const k = S.timer && S.timer.id === id ? S.timer.k : UI.date;
  if (S.timer && S.timer.id === id) timerStop(false);
  logMin(h, k, 0); save(); buzz(10); render(); refreshTimer();
}
function timerComplete(id, auto) {
  const h = byId(id); if (!h) return;
  const k = S.timer && S.timer.id === id ? S.timer.k : UI.date;
  const before = dayProgress(k);
  if (S.timer && S.timer.id === id) { S.timer = null; nativeTimerStop(id); }
  logMin(h, k, h.target); save();
  keepAwake(false); UI.justDone = id;
  if (auto) chime();
  buzz([40, 70, 40, 70, 90]);
  render(); refreshTimer(); refreshSheet();
  const after = dayProgress(k), st = streak(h);
  setTimeout(() => {
    confetti(h.color);
    if (after.due && after.ok === after.due && before.ok < before.due) toast('🎉 Perfect day — every promise kept!');
    else toast(`⏱️ ${h.target} min of ${h.name.toLowerCase()} — done!${st > 1 ? ` 🔥 ${st}-day streak` : ''}`);
  }, 200);
}
function logMin(h, k, v) {
  const L = logOf(h);
  if (v <= 0) delete L[k]; else L[k] = Math.min(h.target * 3, Math.round(v * 100) / 100);
  if (k < h.created && L[k]) h.created = k;
}
// One shared ticker updates every live clock/ring and finishes the timer on time
function tick() {
  if (UI.ticker) return;
  UI.ticker = setInterval(() => {
    const t = S.timer;
    if (!t || !t.running) { clearInterval(UI.ticker); UI.ticker = null; return; }
    const h = byId(t.id); if (!h) { S.timer = null; save(); return; }
    const v = liveCount(h, t.k), rem = h.target - v, pct = Math.min(1, v / h.target);
    if (rem <= 0) { timerComplete(h.id, true); return; }
    document.querySelectorAll(`[data-tl="${h.id}"]`).forEach(el => { el.textContent = fmtClock(rem); });
    document.querySelectorAll(`[data-tm="${h.id}"]`).forEach(el => { el.textContent = `${fmtClock(rem)} left`; });
    document.querySelectorAll(`[data-tp="${h.id}"]`).forEach(el => { el.style.width = (pct * 100).toFixed(1) + '%'; });
    document.querySelectorAll(`[data-tr="${h.id}"]`).forEach(el => { el.style.strokeDashoffset = +el.dataset.c * (1 - pct); });
  }, 250);
}
// On launch / resume: finish a timer that ran out while the app was closed
function timerResumeCheck() {
  const t = S.timer; if (!t) return;
  const h = byId(t.id);
  if (!h || isDone(h, t.k) && !t.running) { S.timer = null; save(); return; }
  if (t.running && liveCount(h, t.k) >= h.target) timerComplete(h.id, false);
  else if (t.running) tick();
}
function nativeTimerStart(h, end) { try { NATIVE && NATIVE.timerStart && NATIVE.timerStart(h.id, end, `${h.name} · ${h.target} min`); } catch (e) { } }
function nativeTimerStop(id) { try { NATIVE && NATIVE.timerStop && NATIVE.timerStop(id); } catch (e) { } }
function keepAwake(on) { try { NATIVE && NATIVE.keepAwake && NATIVE.keepAwake(!!on); } catch (e) { } }
function unlockAudio() {
  try {
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return;
    UI.audio = UI.audio || new A();
    if (UI.audio.state === 'suspended') UI.audio.resume();
  } catch (e) { }
}
function chime() {
  try {
    const a = UI.audio; if (!a) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + i * 0.13;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.2, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
      o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + 0.75);
    });
  } catch (e) { }
}
window.emberOpenTimer = id => { if (byId(id)) { UI.tab = 'today'; UI.date = today(); render(); openTimer(id); } };

/* ================= Theme ================= */
function applyTheme() {
  const pref = S.settings.theme;
  const dark = pref === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches : pref !== 'light';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = dark ? '#0C0C0E' : '#F6F6F3';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (S.settings.theme === 'system') applyTheme(); });

/* ================= Confetti ================= */
function confetti(color) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.getElementById('confetti'), ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const palette = color ? [color, '#FFA45C', '#F4F4F5', '#FF7A3D'] : ['#FF7A3D', '#FFA45C', '#F4F4F5', '#E9B23F', '#6F7CF2', '#34C38F'];
  const parts = Array.from({ length: 110 }, () => ({
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
    save(); render(); toast('Backup restored');
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
    if (k === 'reminder' || k === 'morning') {
      S.settings[k].on = v === 'on'; save(); syncReminder(); render();
      if (v === 'on') { askNotif(); toast(k === 'morning' ? `☀️ Morning kickoff at ${fmtTime(S.settings.morning.time)}` : `🔥 Streak saver at ${fmtTime(S.settings.reminder.time)}`); }
      return;
    }
    S.settings[k] = v; save(); render();
  },
  export: exportData,
  'enable-reminders': () => {
    S.settings.morning.on = true; S.settings.reminder.on = true; S.dismissed.remind = true;
    save(); syncReminder(); askNotif(); render();
    toast(`🔔 Reminders on — ${fmtTime(S.settings.morning.time)} & ${fmtTime(S.settings.reminder.time)}`);
  },
  'test-notif': () => {
    askNotif();
    try { NATIVE.testNotification(); } catch (e) { }
    setTimeout(checkNotif, 400);
    toast(UI.notifOff ? 'Notifications are off — allow them first' : '🔔 Sent! Check your notification shade');
  },
  'notif-settings': () => { try { NATIVE.openNotificationSettings(); } catch (e) { } },
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
    if (S.habits.length) toast('You’re all set — start small'); else openEditor(null, true);
  },
  // editor
  'e-tpl': el => { const keep = D.isNew; D = draftFrom(TEMPLATES[+el.dataset.i]); D.isNew = keep; rerenderEditor(); },
  'e-icon': el => { D.icon = el.dataset.v; rerenderEditor(); },
  'e-emoji': el => { D.emoji = el.dataset.v; rerenderEditor(); },
  'e-style': el => { D.style = el.dataset.v; rerenderEditor(); },
  'e-remind': el => { D.remind = el.dataset.v === 'on' ? (D.remind || TIME_DEFAULT[D.time] || '09:00') : ''; if (D.remind) askNotif(); rerenderEditor(); },
  'e-color': el => { D.color = el.dataset.v; rerenderEditor(); },
  'e-goal': el => {
    const g = el.dataset.v, prev = D.goal; D.goal = g;
    if (g === 'check') D.target = 1;
    else if (g === 'count') { D.target = prev === 'count' ? D.target : 8; if (D.unit === 'min') D.unit = ''; }
    else D.target = prev === 'time' ? D.target : 10;
    rerenderEditor();
  },
  'e-mins': el => { D.target = Math.max(1, Math.min(240, D.target + +el.dataset.d)); rerenderEditor(); },
  'e-minset': el => { D.target = +el.dataset.v; rerenderEditor(); },
  timer: el => openTimer(el.dataset.id),
  't-toggle': () => { const t = S.timer, id = UI.sheet && UI.sheet.data; if (t && t.id === id && t.running) timerPause(); else timerStart(id); },
  't-reset': () => { const id = UI.sheet && UI.sheet.data; timerReset(id); },
  't-done': () => { const id = UI.sheet && UI.sheet.data; timerComplete(id, false); },
  't-again': () => { const id = UI.sheet && UI.sheet.data, h = byId(id); if (h) { delete logOf(h)[UI.date]; save(); render(); timerStart(id); } },
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
    if (f === 'name') { const pv = document.getElementById('pv-n'); if (pv) pv.textContent = e.target.value || 'Untitled habit'; }
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 'set-name') { S.settings.name = e.target.value.trim(); save(); }
  if (e.target.id === 'set-remind' && e.target.value) { S.settings.reminder.time = e.target.value; save(); syncReminder(); toast(`🔥 Streak saver at ${fmtTime(e.target.value)}`); }
  if (e.target.id === 'set-morning' && e.target.value) { S.settings.morning.time = e.target.value; save(); syncReminder(); toast(`☀️ Morning kickoff at ${fmtTime(e.target.value)}`); }
  if (e.target.id === 'e-remind-time' && D && e.target.value) { D.remind = e.target.value; }
});

/* ================= Day rollover & PWA ================= */
let lastDay = today();
function checkRollover() {
  const t = today();
  if (t !== lastDay) { if (UI.date === lastDay) UI.date = t; lastDay = t; render(); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkRollover(); timerResumeCheck(); } });
setInterval(checkRollover, 60 * 1000);

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); UI.installEvt = e; if (S.onboarded) render(); });
window.addEventListener('appinstalled', () => { UI.installEvt = null; toast('Ember installed'); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }

function syncReminder() {
  if (!NATIVE) return;
  const r = S.settings.reminder, m = S.settings.morning;
  try {
    if (NATIVE.setReminders) NATIVE.setReminders(JSON.stringify({ evening: { on: !!r.on, time: r.time }, morning: { on: !!m.on, time: m.time } }));
    else { const [hh, mm] = r.time.split(':').map(Number); NATIVE.setReminder(!!r.on, hh, mm); }
  } catch (e) { }
  checkNotif();
}
function askNotif() { try { NATIVE && NATIVE.requestNotifications && NATIVE.requestNotifications(); } catch (e) { } }
function checkNotif() {
  let off = false;
  try { off = !!(NATIVE && NATIVE.notificationsEnabled && !NATIVE.notificationsEnabled()); } catch (e) { }
  if (off !== !!UI.notifOff) { UI.notifOff = off; if (UI.tab === 'settings') render(); }
}
window.emberNotifChanged = () => setTimeout(checkNotif, 300);
function fmtTime(t) {
  const [h, m] = String(t).split(':').map(Number);
  const d = new Date(); d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
// Android back button: close sheet → go to Today → exit
window.emberBack = function () {
  if (UI.sheet) { closeSheet(true); return true; }
  if (S.onboarded && UI.tab !== 'today') { UI.tab = 'today'; render(); window.scrollTo(0, 0); return true; }
  if (UI.date !== today()) { UI.date = today(); render(); return true; }
  return false;
};
window.checkRollover = () => { checkRollover(); checkNotif(); timerResumeCheck(); };
window.toast = toast;

emberSyncFromNative();
render();
timerResumeCheck();
syncReminder();
