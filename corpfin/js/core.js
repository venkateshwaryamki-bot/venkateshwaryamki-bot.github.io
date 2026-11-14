/* CorpFin Ace — core helpers (formula renderer, number formats, storage, SRS). */
(function () {
  const CF = (window.CF = window.CF || {});
  CF.units = []; // filled by data/u*.js

  /* ---------- DOM ---------- */
  CF.$ = (sel, root = document) => root.querySelector(sel);
  CF.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  CF.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Formula mini-markup ----------
     {a}/{b}  -> stacked fraction      _x or _{xy} -> subscript      ^x or ^{xy} -> superscript
     Plain braces {..} group without printing.  Text is escaped.  */
  function parseGroup(s, i) { // s[i] === '{'
    let depth = 0, j = i;
    for (; j < s.length; j++) {
      if (s[j] === "{") depth++;
      else if (s[j] === "}") { depth--; if (depth === 0) break; }
    }
    return [s.slice(i + 1, j), j + 1];
  }
  function tex(s) {
    let out = "", i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === "{") {
        const [g, k] = parseGroup(s, i);
        if (s[k] === "/" && s[k + 1] === "{") {
          const [g2, k2] = parseGroup(s, k + 1);
          out += `<span class="fr"><span>${tex(g)}</span><span>${tex(g2)}</span></span>`;
          i = k2;
        } else { out += tex(g); i = k; }
      } else if (c === "_" || c === "^") {
        const tag = c === "_" ? "sub" : "sup";
        if (s[i + 1] === "{") { const [g, k] = parseGroup(s, i + 1); out += `<${tag}>${tex(g)}</${tag}>`; i = k; }
        else { out += `<${tag}>${CF.esc(s[i + 1] || "")}</${tag}>`; i += 2; }
      } else { out += CF.esc(c); i++; }
    }
    return out;
  }
  CF.tex = tex;
  CF.M = (s, cls = "") => `<div class="m ${cls}">${tex(s)}</div>`;
  CF.Mi = (s) => `<span class="m-inline" style="font-family:var(--f-math);font-size:1.08em">${tex(s)}</span>`;

  /* ---------- Numbers ---------- */
  const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
  CF.n = (x, d = 2) => {
    if (!isFinite(x)) return "—";
    const f = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: d });
    return f.format(Math.abs(x) < 1e-9 ? 0 : x);
  };
  CF.nf = (x, d = 2) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }).format(x);
  CF.rs = (x, d = 0) => (x < 0 ? "−₹" : "₹") + CF.n(Math.abs(x), d);
  CF.pct = (x, d = 2) => CF.nf(x * 100, d) + "%";
  CF.inr = inr;

  /* ---------- Time value ---------- */
  CF.pvf = (r, t) => 1 / Math.pow(1 + r, t);
  CF.pvifa = (r, n) => (r === 0 ? n : (1 - Math.pow(1 + r, -n)) / r);
  CF.fvf = (r, t) => Math.pow(1 + r, t);
  CF.fvifa = (r, n) => (r === 0 ? n : (Math.pow(1 + r, n) - 1) / r);
  CF.npv = (r, c0, cfs) => cfs.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i + 1), 0) - c0;
  CF.irr = (c0, cfs) => { // bisection between -99% and 500%
    let lo = -0.99, hi = 5;
    if (CF.npv(lo, c0, cfs) * CF.npv(hi, c0, cfs) > 0) return NaN;
    for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; (CF.npv(mid, c0, cfs) > 0) ? (lo = mid) : (hi = mid); }
    return (lo + hi) / 2;
  };
  CF.r3 = (x) => Math.round(x * 1000) / 1000; // exam-table style 3-decimal factor

  /* ---------- Random ---------- */
  CF.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  CF.rstep = (a, b, step) => a + step * Math.floor(Math.random() * (Math.floor((b - a) / step) + 1));
  CF.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  CF.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- Storage (safe) ---------- */
  const KEY = "corpfin.v1";
  const blank = () => ({ xp: 0, streak: { last: null, count: 0 }, days: {}, cards: {}, quiz: {}, drill: {}, done: {}, notes: {}, exams: [], examDate: "", theme: "" });
  let mem = blank();
  try { const raw = localStorage.getItem(KEY); if (raw) mem = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
  CF.S = mem;
  CF.save = () => { try { localStorage.setItem(KEY, JSON.stringify(CF.S)); } catch (e) { /* ignore */ } };
  CF.resetAll = () => { CF.S = blank(); CF.save(); };
  CF.today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  CF.dayNum = (iso) => Math.floor(new Date(iso + "T00:00:00").getTime() / 86400000);
  CF.touch = (xp = 0) => {
    const S = CF.S, t = CF.today();
    if (S.streak.last !== t) {
      const gap = S.streak.last ? CF.dayNum(t) - CF.dayNum(S.streak.last) : 99;
      S.streak.count = gap === 1 ? S.streak.count + 1 : 1;
      S.streak.last = t;
    }
    S.xp += xp; S.days[t] = (S.days[t] || 0) + xp;
    CF.save();
  };

  /* ---------- Spaced repetition (SM-2 flavoured, day granularity) ---------- */
  CF.srs = {
    state(id) { return CF.S.cards[id] || null; },
    isDue(id) { const s = CF.S.cards[id]; return !s || s.due <= CF.dayNum(CF.today()); },
    isNew(id) { return !CF.S.cards[id]; },
    preview(id, g) { // returns interval in days for grade g (0 again,1 hard,2 good,3 easy)
      const s = CF.S.cards[id] || { ease: 2.5, ivl: 0, reps: 0 };
      if (g === 0) return 0;
      if (s.reps === 0) return [0, 1, 1, 3][g];
      if (s.reps === 1) return [0, 2, 3, 6][g];
      const e = s.ease;
      return Math.max(1, Math.round(s.ivl * [0, 1.2, e, e * 1.3][g]));
    },
    grade(id, g) {
      const s = CF.S.cards[id] || { ease: 2.5, ivl: 0, reps: 0, lapses: 0 };
      const ivl = this.preview(id, g);
      if (g === 0) { s.reps = 0; s.lapses = (s.lapses || 0) + 1; s.ease = Math.max(1.3, s.ease - 0.2); }
      else { s.reps += 1; s.ease = Math.max(1.3, s.ease + [0, -0.15, 0, 0.15][g]); }
      s.ivl = ivl; s.due = CF.dayNum(CF.today()) + ivl; s.last = CF.today();
      CF.S.cards[id] = s; CF.save();
      return ivl;
    },
  };

  /* ---------- Icons (inline SVG, stroke = currentColor) ---------- */
  const P = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21V5"/><path d="M9 7h6"/>',
    cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 012 2v12"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 2-2.5 2-2.5 4"/><path d="M12 17h.01"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/><path d="M7.5 15h9"/>',
    sigma: '<path d="M18 5H6l6 7-6 7h12"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16l4-5 3 3 5-7"/>',
    flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-3 2-4 2-7 1 1 2 2 3 4 0-3 0-5 0-7z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
    brain: '<path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 003 3V4z"/><path d="M15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-3 3V4z"/>',
    repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  CF.icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;

  /* ---------- Block builders used by unit content ---------- */
  CF.B = {
    p: (html) => ({ t: "p", html }),
    h: (text) => ({ t: "h", text }),
    list: (items, ordered) => ({ t: "list", items, ordered }),
    f: (name, m, opts = {}) => ({ t: "f", name, m, where: opts.where, why: opts.why }),
    ex: (q, steps, opts = {}) => ({ t: "ex", q, steps, title: opts.title }),
    trap: (items) => ({ t: "callout", kind: "trap", title: "Common traps", items }),
    tip: (title, items) => ({ t: "callout", kind: "tip", title, items }),
    exam: (items) => ({ t: "callout", kind: "exam", title: "Exam angle", items }),
    table: (head, rows) => ({ t: "table", head, rows }),
    cmp: (cols) => ({ t: "cmp", cols }),
    check: (q, o, a, e) => ({ t: "check", q, o, a, e }),
  };
})();
