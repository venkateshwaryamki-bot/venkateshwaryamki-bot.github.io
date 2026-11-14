/* CorpFin Ace — app shell, router and views */
(function () {
  const { $, $$, esc, n, nf, icon, S: _S, M } = CF;
  const S = () => CF.S;
  let view = $("#view");
  function fresh() { const v = view.cloneNode(false); view.replaceWith(v); view = v; return v; }
  const unitById = (id) => CF.units.find((u) => u.id === id);
  const allLessons = () => CF.units.flatMap((u) => u.lessons.map((l) => Object.assign({ u: u.id }, l)));
  const lessonById = (id) => allLessons().find((l) => l.id === id);

  /* ---------- Theme ---------- */
  function applyTheme() { const t = S().theme; if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme"); }
  applyTheme();
  function themeButtons() {
    const t = S().theme || "";
    return `<div class="chips" role="group" aria-label="Theme">${[["", "System"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<button class="chip" data-theme-set="${v}" aria-pressed="${t === v}">${l}</button>`).join("")}</div>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme-set]"); if (!b) return;
    S().theme = b.dataset.themeSet; CF.save(); applyTheme();
    $$("[data-theme-set]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.themeSet === S().theme));
  });

  /* ---------- Toast ---------- */
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2200); }
  CF.toast = toast;
  function gain(xp, msg) { CF.touch(xp); if (msg) toast(msg); renderChrome(); }

  /* ---------- Navigation ---------- */
  const NAV = [
    { grp: "Study" },
    { h: "home", label: "Today", ic: "home" },
    { h: "learn", label: "Learn", ic: "book", match: /^(learn|u\d.*)$/ },
    { h: "cards", label: "Flashcards", ic: "cards", badge: () => dueCount() || "" },
    { grp: "Practice" },
    { h: "quiz", label: "Quiz", ic: "quiz" },
    { h: "drill", label: "Numericals", ic: "calc", match: /^drill/ },
    { h: "bank", label: "Question bank", ic: "folder" },
    { h: "exam", label: "Mock exam", ic: "clock" },
    { grp: "Tools" },
    { h: "labs", label: "Labs", ic: "flask", match: /^lab/ },
    { h: "formulas", label: "Formula sheet", ic: "sigma" },
    { h: "tables", label: "PV / FV tables", ic: "table" },
    { h: "progress", label: "Progress", ic: "chart" },
  ];
  const TABS = [
    { h: "home", label: "Today", ic: "home", match: /^home$/ },
    { h: "learn", label: "Learn", ic: "book", match: /^(learn|u\d.*)$/ },
    { h: "cards", label: "Cards", ic: "cards", match: /^cards$/ },
    { h: "practice", label: "Practice", ic: "target", match: /^(practice|quiz|drill.*|bank|exam)$/ },
    { h: "tools", label: "Tools", ic: "grid", match: /^(tools|lab.*|formulas|tables|progress)$/ },
  ];
  function current() { return (location.hash || "#home").slice(1) || "home"; }
  function renderChrome() {
    const cur = current();
    $("#sideNav").innerHTML = NAV.map((x) => x.grp ? `<div class="grp">${x.grp}</div>` : `<a href="#${x.h}" ${(x.match ? x.match.test(cur) : cur === x.h) ? 'aria-current="page"' : ""}>${icon(x.ic)}<span>${x.label}</span>${x.badge && x.badge() ? `<span class="badge accent">${x.badge()}</span>` : ""}</a>`).join("");
    $("#tabbar").innerHTML = TABS.map((x) => `<a href="#${x.h}" ${x.match.test(cur) ? 'aria-current="page"' : ""}>${icon(x.ic)}<span>${x.label}</span></a>`).join("");
    $("#sideFoot").innerHTML = `<div class="row" style="gap:14px"><span title="Study streak">${icon("flame").replace("<svg", '<svg style="width:16px;height:16px;vertical-align:-3px;color:var(--gold)"')} <b class="num">${S().streak.count}</b> day streak</span><span><b class="num">${n(S().xp)}</b> XP</span></div>${themeButtons()}`;
  }

  /* ---------- Metrics ---------- */
  function dueCount(u) { return CF.cards.filter((c) => (!u || c.u === u) && CF.S.cards[c.id] && CF.srs.isDue(c.id)).length; }
  function newCount(u) { return CF.cards.filter((c) => (!u || c.u === u) && !CF.S.cards[c.id]).length; }
  function mastery(uid) {
    const u = unitById(uid);
    const lf = u.lessons.filter((l) => S().done[l.id]).length / u.lessons.length;
    const qs = CF.quiz.filter((q) => q.u === uid);
    let qa = 0, qc = 0, qseen = 0; qs.forEach((q) => { const r = S().quiz[q.id]; if (r) { qa += r.n; qc += r.c; qseen++; } });
    const qscore = qa ? (qc / qa) * (qseen / qs.length) : 0;
    const gs = CF.gens.filter((g) => g.u === uid);
    let da = 0, dc = 0, dseen = 0; gs.forEach((g) => { const r = S().drill[g.id]; if (r) { da += r.a; dc += r.c; dseen++; } });
    const dscore = da ? (dc / da) * (dseen / gs.length) : 0;
    const cs = CF.cards.filter((c) => c.u === uid), cl = cs.filter((c) => (S().cards[c.id] || {}).ivl >= 3).length / cs.length;
    const total = 0.3 * lf + 0.25 * qscore + 0.25 * dscore + 0.2 * cl;
    return { total, lf, qscore, dscore, cl, qacc: qa ? qc / qa : null, dacc: da ? dc / da : null };
  }
  const ring = (p) => `<div class="ring" style="--p:${Math.round(p * 100)}" aria-label="${Math.round(p * 100)}% mastery">${Math.round(p * 100)}%</div>`;
  function nextLesson() { return allLessons().find((l) => !S().done[l.id]); }
  function weakDrills() {
    return CF.gens.map((g) => ({ g, r: S().drill[g.id] })).filter((x) => x.r && x.r.a >= 2 && x.r.c / x.r.a < 0.7).sort((a, b) => a.r.c / a.r.a - b.r.c / b.r.a);
  }

  /* ---------- Block rendering ---------- */
  let exSeq = 0;
  function renderBlock(b) {
    switch (b.t) {
      case "p": return `<p>${b.html}</p>`;
      case "h": return `<h2>${b.text}</h2>`;
      case "list": return b.ordered ? `<ol>${b.items.map((i) => `<li>${i}</li>`).join("")}</ol>` : `<ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
      case "f": return `<div class="formula"><div class="fname">${b.name}</div>${M(b.m)}${b.where ? `<div class="where">${b.where.map((w) => `<span>${w}</span>`).join("")}</div>` : ""}${b.why ? `<div class="why"><b>Why it makes sense:</b> ${b.why}</div>` : ""}</div>`;
      case "callout": return `<div class="callout ${b.kind}"><div class="t">${b.title}</div><ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;
      case "table": return `<div class="tbl-wrap"><table><thead><tr>${b.head.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      case "cmp": return `<div class="compare">${b.cols.map((c) => `<div><h4>${c.h}</h4><ul>${c.items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`).join("")}</div>`;
      case "ex": { const id = "ex" + exSeq++; return `<div class="worked" data-ex="${id}"><div class="wq"><span class="eyebrow">Worked example · try it first</span><div>${b.q}</div></div><div class="steps">${b.steps.map((s, i) => `<div class="step${i === b.steps.length - 1 ? " final" : ""}" hidden><div>${s}</div></div>`).join("")}</div><div class="ctl"><button class="btn small primary" data-step="next">Reveal step 1 of ${b.steps.length}</button><button class="btn small ghost" data-step="all">Show full solution</button></div></div>`; }
      case "check": return mcqHTML({ id: "chk", q: b.q, o: b.o, a: b.a, e: b.e }, "Check yourself");
      default: return "";
    }
  }
  function mcqHTML(q, eyebrow) {
    return `<div class="mcq card" data-a="${q.a}" data-qid="${q.id || ""}">${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ""}<div class="q">${q.q}</div><div class="opts">${q.o.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${"ABCD"[i]}</span><span>${o}</span></button>`).join("")}</div><div class="explain" hidden>${q.e}</div></div>`;
  }
  function wireMCQ(root, onAnswer) {
    root.addEventListener("click", (e) => {
      const b = e.target.closest(".opt"); if (!b || b.disabled) return;
      const box = b.closest(".mcq"), a = +box.dataset.a, i = +b.dataset.i;
      $$(".opt", box).forEach((o) => { o.disabled = true; if (+o.dataset.i === a) o.classList.add("right"); });
      if (i !== a) b.classList.add("wrong");
      const ex = $(".explain", box); ex.hidden = false; ex.insertAdjacentHTML("afterbegin", `<b style="color:var(--${i === a ? "good" : "bad"})">${i === a ? "Correct. " : "Not quite. "}</b>`);
      onAnswer && onAnswer(box, i === a);
    });
  }
  function wireWorked(root) {
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-step]"); if (!b) return;
      const w = b.closest(".worked"), hidden = $$(".step[hidden]", w);
      if (b.dataset.step === "all") hidden.forEach((s) => (s.hidden = false));
      else if (hidden.length) hidden[0].hidden = false;
      const left = $$(".step[hidden]", w).length, total = $$(".step", w).length;
      const nb = $('[data-step="next"]', w);
      if (!left) { $(".ctl", w).innerHTML = `<span class="badge good">${icon("check").replace("<svg", '<svg style="width:14px;height:14px"')} Solution complete — could you redo it without looking?</span>`; }
      else nb.textContent = `Reveal step ${total - left + 1} of ${total}`;
    });
  }

  /* ---------- Views ---------- */
  const V = {};
  const head = (title, sub, crumbs) => `<header class="ph">${crumbs ? `<nav class="crumbs">${crumbs}</nav>` : ""}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</header>`;

  V.home = () => {
    const nl = nextLesson(), due = dueCount(), nw = newCount(), weak = weakDrills()[0];
    const ed = S().examDate, days = ed ? CF.dayNum(ed) - CF.dayNum(CF.today()) : null;
    const plan = [];
    if (due) plan.push([`Review ${due} due flashcard${due > 1 ? "s" : ""}`, "#cards", "repeat"]);
    else if (nw) plan.push([`Learn 10 new flashcards (${nw} unseen)`, "#cards", "repeat"]);
    if (nl) plan.push([`Study: ${nl.title}`, "#" + nl.id, "book"]);
    plan.push(weak ? [`Fix a weak spot: ${weak.g.title} (${Math.round(weak.r.c / weak.r.a * 100)}% so far)`, "#drill-" + weak.g.id, "calc"] : ["Solve 5 mixed numericals (interleaved)", "#drill-mixed", "calc"]);
    plan.push(["Take a 10-question mixed quiz", "#quiz", "quiz"]);
    const hr = new Date().getHours(), hi = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    fresh().innerHTML = `<div class="wrap">
      <section class="hero">
        <div class="today">
          <span class="eyebrow" style="color:inherit;opacity:.7">EC506 · Corporate Finance</span>
          <h1>${hi}. ${days !== null && days >= 0 ? `${days} day${days === 1 ? "" : "s"} to your exam.` : "Let's make finance click."}</h1>
          <div class="stat-row">
            <div class="stat"><b>${S().streak.count}</b><span class="muted">day streak</span></div>
            <div class="stat"><b>${n(S().xp)}</b><span class="muted">XP earned</span></div>
            <div class="stat"><b>${due}</b><span class="muted">cards due</span></div>
          </div>
          <div class="row">${nl ? `<a class="btn" href="#${nl.id}">Continue: ${nl.title.length > 34 ? nl.title.slice(0, 32) + "…" : nl.title}</a>` : `<a class="btn" href="#exam">Take a mock exam</a>`}<a class="btn alt" href="#cards">Flashcards</a></div>
        </div>
        <div class="card stack">
          <div class="row between"><h3>Today's plan</h3><span class="eyebrow">~35 min</span></div>
          <div class="stack">${plan.map(([t, h, ic]) => `<a class="method" href="${h}" style="text-decoration:none;color:var(--ink)"><span class="ic">${icon(ic)}</span><span>${t}</span></a>`).join("")}</div>
          <hr class="hr"><label class="fld" for="examDate">Exam date<input type="date" id="examDate" value="${esc(ed || "")}"></label>
        </div>
      </section>
      <section class="stack">
        <div class="row between"><h2>Your syllabus</h2><a href="#progress" class="btn small ghost">Progress details ${icon("arrow").replace("<svg", '<svg style="width:14px;height:14px"')}</a></div>
        <div class="grid g3">${CF.units.map((u) => { const m = mastery(u.id); return `<a class="card unit-card" href="#${u.id}"><div class="row between"><span class="unit-num">UNIT ${u.num}</span>${ring(m.total)}</div><h3>${u.title}</h3><p class="muted" style="font-size:.88rem">${u.blurb}</p><span class="muted" style="font-size:.8rem">${u.lessons.filter((l) => S().done[l.id]).length}/${u.lessons.length} lessons · ${CF.gens.filter((g) => g.u === u.id).length} numerical types</span></a>`; }).join("")}</div>
      </section>
      <section class="card pad-lg stack-lg">
        <h2>How this app makes it stick</h2>
        <div class="grid g2">
          ${[["brain", "Active recall", "Every lesson ends in questions, and worked examples hide each step until you've tried it. Pulling an answer out of memory strengthens it far more than re-reading."],
             ["repeat", "Spaced repetition", "Flashcards come back just before you'd forget them: a few days, then a week, then a month. Rate honestly and the schedule adapts."],
             ["layers", "Interleaving", "Mixed quizzes and mixed numericals shuffle topics, so you learn to recognise which formula a question needs — the real exam skill."],
             ["calc", "Unlimited numericals", "Every numerical type is generated with fresh numbers and a full solution, so you can practise NPV or WACC until it's automatic."],
             ["flask", "See the maths move", "Labs turn formulas into pictures: drag the discount rate, the debt ratio or the payout and watch the result change."],
             ["pen", "Explain it simply", "Each lesson asks you to write the idea in your own words (the Feynman technique). If you can't explain it simply, revisit that part."],
          ].map(([ic, t, d]) => `<div class="method"><span class="ic">${icon(ic)}</span><div><b>${t}</b><p class="muted" style="font-size:.9rem">${d}</p></div></div>`).join("")}
        </div>
      </section>
    </div>`;
    $("#examDate").addEventListener("change", (e) => { S().examDate = e.target.value; CF.save(); V.home(); });
  };

  V.learn = () => {
    fresh().innerHTML = `<div class="wrap">${head("Learn", "Five units, in syllabus order. Each lesson: a hook, the core idea, formulas with intuition, worked examples you reveal step by step, common traps and a quick check.")}
      ${CF.units.map((u) => `<section class="stack"><div class="row between"><a href="#${u.id}" style="text-decoration:none;color:var(--ink)"><span class="unit-num">UNIT ${u.num}</span><h2>${u.title}</h2></a>${ring(mastery(u.id).total)}</div>${lessonList(u)}</section>`).join("")}</div>`;
  };
  function lessonList(u) {
    return `<div class="lesson-list">${u.lessons.map((l, i) => `<a class="lesson-item ${S().done[l.id] ? "done" : ""}" href="#${l.id}"><span class="idx">${S().done[l.id] ? "✓" : i + 1}</span><span><b>${l.title}</b><small>${l.mins} min</small></span>${icon("arrow").replace("<svg", '<svg style="width:16px;height:16px;color:var(--muted)"')}</a>`).join("")}</div>`;
  }
  V.unit = (uid) => {
    const u = unitById(uid), m = mastery(uid);
    const gens = CF.gens.filter((g) => g.u === uid), bank = CF.bank.filter((b) => b.u === uid);
    fresh().innerHTML = `<div class="wrap">${head(`Unit ${u.num}: ${u.title}`, u.blurb, `<a href="#learn">Learn</a> / <span>Unit ${u.num}</span>`)}
      <div class="callout tip"><div class="t">Course learning outcome</div><p>${u.clo}</p></div>
      <div class="grid g2">
        <div class="card stack"><div class="row between"><h3>Lessons</h3><span class="badge">${u.lessons.filter((l) => S().done[l.id]).length}/${u.lessons.length} done</span></div>${lessonList(u)}</div>
        <div class="stack">
          <div class="card stack"><div class="row between"><h3>Mastery</h3>${ring(m.total)}</div>
            ${[["Lessons completed", m.lf], ["Quiz (accuracy × coverage)", m.qscore], ["Numericals (accuracy × coverage)", m.dscore], ["Flashcards learned", m.cl]].map(([l, v]) => `<div class="stack" style="gap:4px"><div class="row between" style="font-size:.85rem"><span>${l}</span><span class="num">${Math.round(v * 100)}%</span></div><div class="bar"><i style="width:${v * 100}%"></i></div></div>`).join("")}</div>
          <div class="card stack"><h3>Practise this unit</h3><div class="row"><a class="btn small" href="#cards" data-deck="${uid}">Flashcards (${CF.cards.filter((c) => c.u === uid).length})</a><a class="btn small" href="#quiz" data-quiz="${uid}">Quiz (${CF.quiz.filter((q) => q.u === uid).length})</a>${gens.length ? `<a class="btn small" href="#drill" data-unit="${uid}">Numericals (${gens.length} types)</a>` : ""}${bank.length ? `<a class="btn small" href="#bank">Solved questions</a>` : ""}</div></div>
        </div>
      </div></div>`;
  };
  let preset = {};
  document.addEventListener("click", (e) => presetHandler(e));
  function presetHandler(e) { const a = e.target.closest("a[data-deck],a[data-quiz],a[data-unit]"); if (!a) return; preset = { deck: a.dataset.deck, quiz: a.dataset.quiz, unit: a.dataset.unit }; }

  V.lesson = (lid) => {
    const l = lessonById(lid), u = unitById(l.u), list = u.lessons, idx = list.findIndex((x) => x.id === lid);
    const nx = list[idx + 1] || (CF.units[CF.units.indexOf(u) + 1] || {}).lessons?.[0];
    exSeq = 0;
    fresh().innerHTML = `<div class="wrap narrow"><article class="lesson">
      ${head(l.title, "", `<a href="#learn">Learn</a> / <a href="#${u.id}">Unit ${u.num}</a> / <span>Lesson ${idx + 1} of ${list.length}</span>`)}
      <div class="row"><span class="badge">${l.mins} min</span>${S().done[lid] ? '<span class="badge good">Completed</span>' : ""}</div>
      <p class="hook">${l.hook}</p>
      <div class="prose" style="max-width:none">${l.blocks.map(renderBlock).join("")}</div>
      <section class="card stack"><span class="eyebrow">Explain it simply (Feynman technique)</span><p class="muted" style="font-size:.9rem">In 2–3 sentences, explain this lesson to a friend who has never studied finance. Gaps in your explanation show you what to revisit.</p><textarea id="note" placeholder="Write it in your own words…">${esc(S().notes[lid] || "")}</textarea></section>
      <div class="row between">
        <button class="btn primary" id="done">${S().done[lid] ? "Completed ✓ — mark again" : "Mark lesson complete (+20 XP)"}</button>
        ${nx ? `<a class="btn" href="#${nx.id}">Next: ${nx.title} ${icon("arrow").replace("<svg", '<svg style="width:15px;height:15px"')}</a>` : `<a class="btn" href="#exam">Take the mock exam</a>`}
      </div>
    </article></div>`;
    wireMCQ(view, (box, ok) => { if (ok) gain(3); });
    wireWorked(view);
    $("#note").addEventListener("input", (e) => { S().notes[lid] = e.target.value; CF.save(); });
    $("#done").addEventListener("click", () => { const first = !S().done[lid]; S().done[lid] = CF.today(); CF.save(); gain(first ? 20 : 0, first ? "Lesson complete · +20 XP" : "Saved"); V.lesson(lid); });
  };

  /* ---------- Flashcards ---------- */
  let fc = null;
  V.cards = () => {
    const deck = preset.deck || (fc && fc.deck) || ""; preset.deck = null;
    const scope = (c) => !deck || c.u === deck;
    fresh().innerHTML = `<div class="wrap narrow">${head("Flashcards", "Spaced repetition: look at the front, recall the answer out loud or on paper, flip, then rate how well you remembered. Shortcuts: <span class=kbd>Space</span> flip, <span class=kbd>1</span>–<span class=kbd>4</span> rate.")}
      <div class="chips" id="decks">${[["", "All units"], ...CF.units.map((u) => [u.id, "Unit " + u.num])].map(([v, l]) => `<button class="chip" data-d="${v}" aria-pressed="${deck === v}">${l}</button>`).join("")}</div>
      <div class="kpis"><div class="kpi"><small>Due now</small><b>${dueCount(deck)}</b></div><div class="kpi"><small>New</small><b>${newCount(deck)}</b></div><div class="kpi"><small>Learned (≥ 3-day interval)</small><b>${CF.cards.filter((c) => scope(c) && (S().cards[c.id] || {}).ivl >= 3).length}</b></div><div class="kpi"><small>Total</small><b>${CF.cards.filter(scope).length}</b></div></div>
      <div id="fcArea"></div></div>`;
    $("#decks").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; fc = { deck: b.dataset.d }; V.cards(); });
    const due = CF.shuffle(CF.cards.filter((c) => scope(c) && S().cards[c.id] && CF.srs.isDue(c.id)));
    const newOnes = CF.cards.filter((c) => scope(c) && !S().cards[c.id]).slice(0, 10);
    fc = { deck, q: due.concat(newOnes), done: 0, again: 0 };
    showCard();
  };
  function showCard() {
    const area = $("#fcArea"); if (!area) return;
    if (!fc.q.length) {
      area.innerHTML = `<div class="card empty">${icon("check").replace("<svg", '<svg style="width:40px;height:40px;color:var(--good)"')}<h3>${fc.done ? `Session done: ${fc.done} reviews` : "Nothing due right now"}</h3><p>${fc.done ? "Come back tomorrow — the cards you found hard will be waiting." : "All caught up. Learn new cards in another deck, or practise numericals."}</p><div class="row"><button class="btn primary" id="more">Study 10 more new cards</button><a class="btn" href="#drill">Practise numericals</a></div></div>`;
      $("#more").addEventListener("click", () => { fc.q = CF.cards.filter((c) => (!fc.deck || c.u === fc.deck) && !S().cards[c.id]).slice(0, 10); if (!fc.q.length) fc.q = CF.shuffle(CF.cards.filter((c) => !fc.deck || c.u === fc.deck)).slice(0, 10); showCard(); });
      return;
    }
    const c = fc.q[0], u = unitById(c.u), isNew = !S().cards[c.id];
    const lbl = (g) => { const d = CF.srs.preview(c.id, g); return d === 0 ? "<1 day" : d + (d === 1 ? " day" : " days"); };
    area.innerHTML = `<div class="stack">
      <div class="row between"><span class="eyebrow">Unit ${u.num} · ${isNew ? "new card" : "review"}</span><span class="muted num" style="font-size:.85rem">${fc.q.length} left</span></div>
      <div class="flash" id="flash"><div class="flash-inner" tabindex="0" role="button" aria-label="Flip card"><div class="face front"><div class="front-q">${c.f}</div><span class="muted" style="font-size:.85rem">Recall it, then tap to flip</span></div><div class="face back"><div class="eyebrow">${c.f}</div><div class="ans">${c.b}</div></div></div></div>
      <div class="rate" id="rate" hidden>${[["again", "Again"], ["", "Hard"], ["good", "Good"], ["", "Easy"]].map(([cl, l], g) => `<button class="btn ${cl}" data-g="${g}">${l}<small>${lbl(g)}</small></button>`).join("")}</div>
      <button class="btn primary" id="flipBtn">Show answer</button></div>`;
    const flip = () => { $("#flash").classList.add("flipped"); $("#rate").hidden = false; $("#flipBtn").hidden = true; };
    $(".flash-inner").addEventListener("click", flip);
    $("#flipBtn").addEventListener("click", flip);
    $("#rate").addEventListener("click", (e) => { const b = e.target.closest("[data-g]"); if (b) rate(+b.dataset.g); });
  }
  function rate(g) {
    const c = fc.q.shift(); CF.srs.grade(c.id, g); fc.done++;
    if (g === 0) { fc.q.splice(Math.min(3, fc.q.length), 0, c); }
    gain(g === 0 ? 1 : 2);
    showCard();
  }

  /* ---------- Quiz ---------- */
  let qz = null;
  V.quiz = () => {
    const u = preset.quiz || ""; preset.quiz = null;
    fresh().innerHTML = `<div class="wrap narrow">${head("Quiz", "Retrieval practice with instant feedback. Questions you've missed or never seen come up first.")}
      <div class="card stack"><span class="eyebrow">Topic</span><div class="chips" id="qu">${[["", "Mixed (all units)"], ...CF.units.map((x) => [x.id, "Unit " + x.num])].map(([v, l]) => `<button class="chip" data-v="${v}" aria-pressed="${u === v}">${l}</button>`).join("")}</div>
      <span class="eyebrow">Length</span><div class="chips" id="ql">${[5, 10, 20].map((v) => `<button class="chip" data-v="${v}" aria-pressed="${v === 10}">${v} questions</button>`).join("")}</div>
      <div><button class="btn primary" id="qs">Start quiz</button></div></div></div>`;
    let unit = u, len = 10;
    $("#qu").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; unit = b.dataset.v; $$("#qu .chip").forEach((x) => x.setAttribute("aria-pressed", x === b)); });
    $("#ql").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; len = +b.dataset.v; $$("#ql .chip").forEach((x) => x.setAttribute("aria-pressed", x === b)); });
    $("#qs").addEventListener("click", () => startQuiz(unit, len));
  };
  function pickQuestions(unit, len) {
    const pool = CF.quiz.filter((q) => !unit || q.u === unit);
    const w = (q) => { const r = S().quiz[q.id]; if (!r) return 2 + Math.random(); return (1 - r.c / r.n) * 2 + Math.random(); };
    return pool.map((q) => [w(q), q]).sort((a, b) => b[0] - a[0]).slice(0, len).map((x) => x[1]).sort(() => Math.random() - 0.5);
  }
  function startQuiz(unit, len) { qz = { qs: pickQuestions(unit, len), i: 0, score: 0, wrong: [] }; showQ(); }
  function showQ() {
    if (qz.i >= qz.qs.length) return quizDone();
    const q = qz.qs[qz.i], u = unitById(q.u);
    fresh().innerHTML = `<div class="wrap narrow"><div class="row between"><span class="eyebrow">Question ${qz.i + 1} of ${qz.qs.length} · Unit ${u.num}</span><span class="badge accent">Score ${qz.score}</span></div><div class="bar"><i style="width:${qz.i / qz.qs.length * 100}%"></i></div>${mcqHTML(q)}<div><button class="btn primary" id="nq" hidden>${qz.i + 1 === qz.qs.length ? "See results" : "Next question"}</button></div></div>`;
    wireMCQ(view, (box, ok) => {
      const r = S().quiz[q.id] || { n: 0, c: 0 }; r.n++; if (ok) r.c++; S().quiz[q.id] = r; CF.save();
      if (ok) { qz.score++; gain(5); } else { qz.wrong.push(q); gain(1); }
      $("#nq").hidden = false; $("#nq").focus();
    });
    $("#nq").addEventListener("click", () => { qz.i++; showQ(); });
  }
  function quizDone() {
    const pc = qz.score / qz.qs.length;
    fresh().innerHTML = `<div class="wrap narrow">${head(`${qz.score} / ${qz.qs.length} correct`, pc >= 0.8 ? "Excellent recall. The spaced-repetition deck will keep it fresh." : pc >= 0.5 ? "Solid start. Review the explanations below, then try again tomorrow." : "This is exactly where learning happens. Read the explanations, revisit the lessons, and retry.")}
      ${qz.wrong.length ? `<h2>Review what you missed</h2>${qz.wrong.map((q) => `<div class="card stack"><b>${q.q}</b><p><span class="badge good">Answer</span> ${q.o[q.a]}</p><p class="muted">${q.e}</p></div>`).join("")}` : ""}
      <div class="row"><button class="btn primary" id="again">New quiz</button><a class="btn" href="#cards">Flashcards</a><a class="btn" href="#drill">Numericals</a></div></div>`;
    $("#again").addEventListener("click", V.quiz);
  }

  /* ---------- Numericals ---------- */
  let dr = null;
  V.drill = (gid) => {
    if (gid) return startDrill(gid);
    const unit = preset.unit; preset.unit = null;
    const weak = weakDrills();
    fresh().innerHTML = `<div class="wrap">${head("Numericals", "Unlimited practice: every problem has fresh numbers and a full worked solution. Type your answer, check it, then study the steps. PV-factor problems use 3-decimal exam tables.")}
      <div class="grid g2">
        <button class="card topic-btn" data-g="mixed"><span><b>Mixed set (interleaved)</b><small>Random topics from every unit — trains you to pick the right method</small></span>${icon("layers").replace("<svg", '<svg style="width:22px;height:22px;color:var(--accent)"')}</button>
        <button class="card topic-btn" data-g="weak" ${weak.length ? "" : "disabled"}><span><b>Weakest topics</b><small>${weak.length ? weak.slice(0, 3).map((x) => x.g.title).join(" · ") : "Appears after a few attempts"}</small></span>${icon("target").replace("<svg", '<svg style="width:22px;height:22px;color:var(--bad)"')}</button>
      </div>
      ${CF.units.filter((u) => CF.gens.some((g) => g.u === u.id)).map((u) => `<section class="stack" ${unit && unit !== u.id ? 'style="opacity:.6"' : ""}><h2>Unit ${u.num}: ${u.title}</h2><div class="grid g2">${CF.gens.filter((g) => g.u === u.id).map((g) => { const r = S().drill[g.id]; return `<button class="topic-btn" data-g="${g.id}"><span><b>${g.title}</b><small>${g.desc}</small></span>${r ? `<span class="badge ${r.c / r.a >= 0.7 ? "good" : "bad"}">${r.c}/${r.a}</span>` : '<span class="badge">new</span>'}</button>`; }).join("")}</div></section>`).join("")}</div>`;
    view.addEventListener("click", (e) => { const b = e.target.closest(".topic-btn"); if (b && !b.disabled) location.hash = "#drill-" + b.dataset.g; });
    if (unit) { const s = $$("section", view).find((x) => !x.style.opacity); s && s.scrollIntoView({ block: "start" }); }
  };
  function startDrill(gid) {
    dr = { mode: gid, streak: 0, count: 0, right: 0 };
    nextProblem();
  }
  function nextProblem() {
    let g;
    if (dr.mode === "mixed") g = CF.pick(CF.gens);
    else if (dr.mode === "weak") { const w = weakDrills(); g = w.length ? CF.pick(w.slice(0, 4)).g : CF.pick(CF.gens); }
    else g = CF.genById(dr.mode);
    if (!g) { location.hash = "#drill"; return; }
    const p = g.make(); dr.p = p; dr.g = g; dr.tries = 0; dr.revealed = false;
    const u = unitById(g.u);
    const unitLbl = { pct: "%", rs: "₹", yrs: "years", days: "days", units: "units", num: "" }[p.kind];
    fresh().innerHTML = `<div class="wrap narrow">
      ${head(g.title, "", `<a href="#drill">Numericals</a> / <span>${dr.mode === "mixed" ? "Mixed set" : dr.mode === "weak" ? "Weakest topics" : "Unit " + u.num}</span>`)}
      <div class="row"><span class="badge">Unit ${u.num}</span><span class="badge accent">Solved ${dr.right}/${dr.count} this session</span>${dr.streak >= 2 ? `<span class="badge gold">${dr.streak} in a row</span>` : ""}</div>
      <div class="card stack"><span class="eyebrow">Given</span><div class="given">${p.given.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div><p><b>${p.ask}</b></p>
        <form id="af" class="answer-row" autocomplete="off"><label class="fld" for="ans">Your answer${unitLbl ? " (" + unitLbl + ")" : ""}<input id="ans" type="text" inputmode="decimal" placeholder="e.g. ${p.kind === "pct" ? "12.81" : p.kind === "rs" ? "11520" : "2.83"}"></label><button class="btn primary" type="submit">Check</button></form>
        <div id="res"></div>
        <div class="row"><button class="btn small ghost" id="hint">Hint</button><button class="btn small ghost" id="sol">Show solution</button></div>
        <div id="hintBox" class="explain" hidden>${p.hint}</div>
      </div>
      <div id="solBox" class="worked" hidden><div class="wq"><span class="eyebrow">Worked solution</span></div><div class="steps">${p.steps.map((s, i) => `<div class="step${i === p.steps.length - 1 ? " final" : ""}"><div>${s}</div></div>`).join("")}</div></div>
      <div class="row"><button class="btn primary" id="nxt">Next problem ${icon("arrow").replace("<svg", '<svg style="width:15px;height:15px"')}</button>${dr.mode !== "mixed" ? `<a class="btn" href="#drill-mixed">Switch to mixed set</a>` : ""}</div></div>`;
    $("#ans").focus({ preventScroll: true });
    $("#hint").addEventListener("click", () => ($("#hintBox").hidden = false));
    $("#sol").addEventListener("click", () => { $("#solBox").hidden = false; if (!dr.done) record(false); dr.revealed = true; });
    $("#nxt").addEventListener("click", nextProblem);
    dr.done = false;
    $("#af").addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = $("#ans").value.replace(/[₹,%\s]/g, "").replace(/[−–]/g, "-");
      if (raw === "" || isNaN(+raw)) { $("#res").innerHTML = `<div class="result no">Enter a number, e.g. ${p.kind === "pct" ? "12.5 for 12.5%" : "11520"}.</div>`; return; }
      const v = +raw, tol = Math.max((p.tol || 0) * Math.abs(p.ans), p.absTol || 0, p.kind === "pct" ? 0.02 : 0.005);
      const ok = Math.abs(v - p.ans) <= tol;
      dr.tries++;
      const shown = p.kind === "pct" ? nf(p.ans, 2) + "%" : p.kind === "rs" ? CF.rs(p.ans, 0) : nf(p.ans, p.dp ?? 2);
      if (ok) { $("#res").innerHTML = `<div class="result ok">Correct — ${shown}. ${dr.tries === 1 && !dr.revealed ? "+10 XP" : ""}</div>`; $("#solBox").hidden = false; if (!dr.done) record(dr.tries === 1 && !dr.revealed); $("#nxt").focus(); }
      else $("#res").innerHTML = `<div class="result no">${dr.tries === 1 ? "Not yet. Check your working or open the hint, then try again." : "Still off. Compare with the solution steps."}</div>`;
      if (!ok && dr.tries >= 2 && !dr.done) { record(false); }
    });
  }
  function record(ok) {
    dr.done = true; dr.count++;
    const r = S().drill[dr.g.id] || { a: 0, c: 0 }; r.a++; if (ok) { r.c++; dr.right++; dr.streak++; } else dr.streak = 0;
    S().drill[dr.g.id] = r; CF.save(); gain(ok ? 10 : 2);
  }

  /* ---------- Question bank ---------- */
  V.bank = () => {
    fresh().innerHTML = `<div class="wrap narrow">${head("Question bank", "Every question from your course question sets, fully solved. Try each one on paper first, then reveal the solution one step at a time.")}
      ${CF.bank.map((g) => `<section class="stack"><div><span class="unit-num">UNIT ${unitById(g.u).num} · ${g.source}</span><h2>${g.title}</h2></div>${g.items.map((it) => `<details class="card" ${""}><summary class="row between" style="cursor:pointer;list-style:none"><b>${it.title}</b>${S().done["bank-" + it.id] ? '<span class="badge good">solved</span>' : '<span class="badge">' + icon("arrow").replace("<svg", '<svg style="width:12px;height:12px"') + "</span>"}</summary><div class="stack" style="margin-top:12px"><div>${it.q}</div>
        <div class="worked"><div class="steps">${it.steps.map((s, i) => `<div class="step${i === it.steps.length - 1 ? " final" : ""}" hidden><div>${s}</div></div>`).join("")}</div><div class="ctl"><button class="btn small primary" data-step="next">Reveal step 1 of ${it.steps.length}</button><button class="btn small ghost" data-step="all">Show full solution</button></div></div>
        <div class="row between"><span class="muted" style="font-size:.88rem">Answer: <b>${it.answer}</b></span><button class="btn small" data-solved="${it.id}">${S().done["bank-" + it.id] ? "Solved ✓" : "I solved it myself (+15 XP)"}</button></div></div></details>`).join("")}</section>`).join("")}</div>`;
    wireWorked(view);
    view.addEventListener("click", (e) => { const b = e.target.closest("[data-solved]"); if (!b) return; const k = "bank-" + b.dataset.solved; if (!S().done[k]) { S().done[k] = CF.today(); CF.save(); gain(15, "+15 XP"); } b.textContent = "Solved ✓"; });
  };

  /* ---------- Mock exam ---------- */
  let ex = null, exTimer = null;
  V.exam = () => {
    clearInterval(exTimer);
    const hist = S().exams.slice(-5).reverse();
    fresh().innerHTML = `<div class="wrap narrow">${head("Mock exam", "A timed, mixed test: 15 concept MCQs and 5 numericals drawn from all units. No hints, no solutions until you submit.")}
      <div class="card stack"><div class="kpis"><div class="kpi"><small>Questions</small><b>20</b></div><div class="kpi"><small>Time</small><b>30 min</b></div><div class="kpi"><small>Marks</small><b>15 + 5 × 3</b></div></div><div><button class="btn primary" id="go">Start exam</button></div></div>
      ${hist.length ? `<div class="card stack"><h3>Recent attempts</h3><div class="tbl-wrap"><table><thead><tr><th>Date</th><th class="n">Score</th><th class="n">%</th></tr></thead><tbody>${hist.map((h) => `<tr><td>${h.date}</td><td class="n">${h.score}/${h.total}</td><td class="n">${Math.round(h.score / h.total * 100)}%</td></tr>`).join("")}</tbody></table></div></div>` : ""}</div>`;
    $("#go").addEventListener("click", startExam);
  };
  function startExam() {
    const mcq = [];
    CF.units.forEach((u) => mcq.push(...CF.shuffle(CF.quiz.filter((q) => q.u === u.id)).slice(0, 3)));
    const units = CF.shuffle(["u2", "u2", "u3", "u3", "u4", "u5"]).slice(0, 5);
    const nums = units.map((u) => { const g = CF.pick(CF.gens.filter((x) => x.u === u)); return { g, p: g.make() }; });
    ex = { items: CF.shuffle(mcq).map((q) => ({ t: "m", q })).concat(nums.map((x) => ({ t: "n", ...x }))), i: 0, ans: {}, end: Date.now() + 30 * 60000 };
    clearInterval(exTimer); exTimer = setInterval(tick, 1000); showExam();
  }
  function tick() { const el = $("#timer"); if (!el) { clearInterval(exTimer); return; } const s = Math.max(0, Math.round((ex.end - Date.now()) / 1000)); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; if (s <= 0) submitExam(); }
  function showExam() {
    const it = ex.items[ex.i], tot = ex.items.length;
    fresh().innerHTML = `<div class="wrap narrow"><div class="row between"><span class="eyebrow">Question ${ex.i + 1} of ${tot} · ${it.t === "m" ? "1 mark" : "3 marks"}</span><span class="timer" id="timer"></span></div><div class="bar"><i style="width:${Object.keys(ex.ans).length / tot * 100}%"></i></div>
      <div class="card stack" id="eq">${it.t === "m" ? `<b>${it.q.q}</b><div class="opts">${it.q.o.map((o, i) => `<button class="opt" data-i="${i}" ${ex.ans[ex.i] === i ? 'style="border-color:var(--accent);background:var(--soft)"' : ""}><span class="k">${"ABCD"[i]}</span><span>${o}</span></button>`).join("")}</div>`
        : `<span class="eyebrow">${it.g.title}</span><div class="given">${it.p.given.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div><b>${it.p.ask}</b><label class="fld" for="ea">Your answer<input type="text" id="ea" inputmode="decimal" value="${esc(ex.ans[ex.i] ?? "")}"></label>`}</div>
      <div class="row between"><div class="row"><button class="btn" id="prev" ${ex.i ? "" : "disabled"}>Previous</button><button class="btn" id="next" ${ex.i < tot - 1 ? "" : "disabled"}>Next</button></div><button class="btn primary" id="sub">Submit exam</button></div>
      <div class="chips">${ex.items.map((_, i) => `<button class="chip" data-j="${i}" aria-pressed="${i === ex.i}" style="${ex.ans[i] !== undefined && ex.ans[i] !== "" && i !== ex.i ? "border-color:var(--accent)" : ""}">${i + 1}</button>`).join("")}</div></div>`;
    tick();
    $("#eq").addEventListener("click", (e) => { const b = e.target.closest(".opt"); if (!b) return; ex.ans[ex.i] = +b.dataset.i; showExam(); });
    const ea = $("#ea"); if (ea) ea.addEventListener("input", () => (ex.ans[ex.i] = ea.value));
    $("#prev").addEventListener("click", () => { ex.i--; showExam(); });
    $("#next").addEventListener("click", () => { ex.i++; showExam(); });
    $$("[data-j]").forEach((b) => b.addEventListener("click", () => { ex.i = +b.dataset.j; showExam(); }));
    $("#sub").addEventListener("click", () => {
      const left = ex.items.length - Object.values(ex.ans).filter((v) => v !== "" && v !== undefined).length;
      if (left && !$("#sub").dataset.sure) { $("#sub").dataset.sure = 1; $("#sub").textContent = `${left} unanswered — submit anyway?`; return; }
      submitExam();
    });
  }
  function submitExam() {
    clearInterval(exTimer);
    let score = 0, total = 0; const byU = {}, review = [];
    ex.items.forEach((it, i) => {
      const u = it.t === "m" ? it.q.u : it.g.u; byU[u] = byU[u] || { s: 0, t: 0 };
      if (it.t === "m") { total += 1; byU[u].t += 1; const ok = ex.ans[i] === it.q.a; if (ok) { score += 1; byU[u].s += 1; } else review.push(`<div class="card stack"><b>${it.q.q}</b><p><span class="badge good">Answer</span> ${it.q.o[it.q.a]}</p><p class="muted">${it.q.e}</p></div>`); }
      else {
        total += 3; byU[u].t += 3; const p = it.p, raw = String(ex.ans[i] ?? "").replace(/[₹,%\s]/g, "").replace(/[−–]/g, "-");
        const tol = Math.max((p.tol || 0) * Math.abs(p.ans), p.absTol || 0, p.kind === "pct" ? 0.02 : 0.005), ok = raw !== "" && Math.abs(+raw - p.ans) <= tol;
        if (ok) { score += 3; byU[u].s += 3; } else review.push(`<div class="card stack"><b>${it.g.title}</b><div class="given">${p.given.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div><p>${p.ask} You answered: <b>${esc(ex.ans[i] ?? "—")}</b></p><div class="worked"><div class="steps">${p.steps.map((s, j) => `<div class="step${j === p.steps.length - 1 ? " final" : ""}"><div>${s}</div></div>`).join("")}</div></div></div>`);
      }
    });
    S().exams.push({ date: CF.today(), score, total }); CF.save(); gain(score * 3, `Exam submitted · +${score * 3} XP`);
    fresh().innerHTML = `<div class="wrap narrow">${head(`Score: ${score} / ${total} (${Math.round(score / total * 100)}%)`, score / total >= 0.75 ? "Exam-ready performance. Keep your flashcards ticking over." : "Use the breakdown to decide what to study next.")}
      <div class="card stack"><h3>By unit</h3>${Object.entries(byU).sort().map(([u, r]) => `<div class="stack" style="gap:4px"><div class="row between" style="font-size:.88rem"><span>Unit ${unitById(u).num}: ${unitById(u).title}</span><span class="num">${r.s}/${r.t}</span></div><div class="bar"><i style="width:${r.s / r.t * 100}%"></i></div></div>`).join("")}</div>
      ${review.length ? `<h2>Review</h2>${review.join("")}` : ""}<div class="row"><button class="btn primary" id="again">Try another exam</button><a class="btn" href="#progress">See progress</a></div></div>`;
    $("#again").addEventListener("click", V.exam);
  }

  /* ---------- Labs ---------- */
  V.labs = (lid) => {
    if (lid) {
      const L = CF.labs.find((x) => x.id === lid); if (!L) { location.hash = "#labs"; return; }
      fresh().innerHTML = `<div class="wrap">${head(L.title, L.desc, `<a href="#labs">Labs</a> / <span>Unit ${unitById(L.u).num}</span>`)}<div id="labEl"></div></div>`;
      L.render($("#labEl")); return;
    }
    fresh().innerHTML = `<div class="wrap">${head("Labs", "Interactive models. Change the inputs and watch the formula respond — the fastest way to build intuition for what each variable does.")}
      <div class="grid g2">${CF.labs.map((L) => `<a class="card unit-card" href="#lab-${L.id}"><span class="unit-num">UNIT ${unitById(L.u).num}</span><h3>${L.title}</h3><p class="muted" style="font-size:.9rem">${L.desc}</p></a>`).join("")}</div></div>`;
  };

  /* ---------- Formula sheet ---------- */
  V.formulas = () => {
    const items = [];
    CF.units.forEach((u) => u.lessons.forEach((l) => l.blocks.forEach((b) => { if (b.t === "f") items.push({ u: u.id, l, b }); })));
    let recall = false, unit = "", qtxt = "";
    fresh().innerHTML = `<div class="wrap narrow">${head("Formula sheet", `All ${items.length} formulas from the lessons. Turn on recall mode to hide them: say each formula from memory, then tap to check.`)}
      <div class="card stack"><div class="row"><input type="text" id="fq" placeholder="Search: WACC, IRR, Walter…" style="flex:1;min-width:180px"><button class="chip" id="rc" aria-pressed="false">Recall mode</button></div><div class="chips" id="fu">${[["", "All"], ...CF.units.map((u) => [u.id, "Unit " + u.num])].map(([v, l]) => `<button class="chip" data-v="${v}" aria-pressed="${v === ""}">${l}</button>`).join("")}</div></div>
      <div class="card" style="padding:0" id="fl"></div></div>`;
    const draw = () => {
      const f = items.filter((x) => (!unit || x.u === unit) && (!qtxt || (x.b.name + " " + x.b.m + " " + x.l.title).toLowerCase().includes(qtxt)));
      $("#fl").innerHTML = f.length ? f.map((x, i) => `<div class="fs-item"><div class="row between"><b>${x.b.name}</b><a class="muted" style="font-size:.8rem" href="#${x.l.id}">Unit ${unitById(x.u).num} · ${x.l.title}</a></div>${recall ? `<div class="cover" data-i="${i}" role="button" tabindex="0">Recall it, then tap to reveal</div><div hidden>${M(x.b.m)}</div>` : M(x.b.m)}</div>`).join("") : `<div class="empty">No formulas match “${esc(qtxt)}”.</div>`;
    };
    $("#fq").addEventListener("input", (e) => { qtxt = e.target.value.toLowerCase().trim(); draw(); });
    $("#rc").addEventListener("click", (e) => { recall = !recall; e.target.setAttribute("aria-pressed", recall); draw(); });
    $("#fu").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; unit = b.dataset.v; $$("#fu .chip").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); });
    $("#fl").addEventListener("click", (e) => { const c = e.target.closest(".cover"); if (!c) return; c.hidden = true; c.nextElementSibling.hidden = false; });
    draw();
  };

  /* ---------- PV / FV tables ---------- */
  V.tables = () => {
    let type = "pvif", band = 0;
    const T = { pvif: ["PVIF — present value of ₹1", CF.pvf], pvifa: ["PVIFA — present value of an annuity of ₹1", CF.pvifa], fvif: ["FVIF — future value of ₹1", CF.fvf], fvifa: ["FVIFA — future value of an annuity of ₹1", CF.fvifa] };
    fresh().innerHTML = `<div class="wrap">${head("PV / FV tables", "The same factors as the tables handed out in the exam, to 3 decimals. Pick a table and a rate range.")}
      <div class="card stack"><div class="chips" id="tt">${Object.keys(T).map((k) => `<button class="chip" data-v="${k}" aria-pressed="${k === type}">${k.toUpperCase()}</button>`).join("")}</div><div class="chips" id="tbnd">${["1–10%", "11–20%", "21–30%"].map((l, i) => `<button class="chip" data-v="${i}" aria-pressed="${i === 0}">${l}</button>`).join("")}</div></div>
      <div class="card stack"><h3 id="tname"></h3><div class="tbl-wrap"><table id="tbl"></table></div></div></div>`;
    const draw = () => {
      const rates = Array.from({ length: 10 }, (_, i) => band * 10 + i + 1), f = T[type][1];
      $("#tname").textContent = T[type][0];
      $("#tbl").innerHTML = `<thead><tr><th>Year</th>${rates.map((r) => `<th class="n">${r}%</th>`).join("")}</tr></thead><tbody>${Array.from({ length: 20 }, (_, i) => i + 1).map((t) => `<tr><td class="num"><b>${t}</b></td>${rates.map((r) => `<td class="n">${nf(f(r / 100, t), 3)}</td>`).join("")}</tr>`).join("")}</tbody>`;
    };
    $("#tt").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; type = b.dataset.v; $$("#tt .chip").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); });
    $("#tbnd").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; band = +b.dataset.v; $$("#tbnd .chip").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); });
    draw();
  };

  /* ---------- Progress ---------- */
  V.progress = () => {
    const days = Object.keys(S().days).length, weak = weakDrills();
    const last = Array.from({ length: 28 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); return S().days[k] || 0; });
    const mx = Math.max(10, ...last);
    fresh().innerHTML = `<div class="wrap">${head("Progress", "Mastery blends lessons completed, quiz and numerical accuracy (weighted by how much you've covered) and flashcards learned.")}
      <div class="kpis"><div class="kpi"><small>XP</small><b>${n(S().xp)}</b></div><div class="kpi"><small>Streak</small><b>${S().streak.count} days</b></div><div class="kpi"><small>Days studied</small><b>${days}</b></div><div class="kpi"><small>Lessons</small><b>${allLessons().filter((l) => S().done[l.id]).length}/${allLessons().length}</b></div><div class="kpi"><small>Cards learned</small><b>${CF.cards.filter((c) => (S().cards[c.id] || {}).ivl >= 3).length}/${CF.cards.length}</b></div></div>
      <div class="card stack"><h3>Last 4 weeks (XP per day)</h3><svg class="chart" viewBox="0 0 560 90" role="img" aria-label="XP per day, last 28 days">${last.map((v, i) => `<rect x="${i * 20 + 2}" y="${80 - v / mx * 70}" width="16" height="${Math.max(2, v / mx * 70)}" rx="3" fill="${v ? "var(--accent)" : "var(--surface-2)"}"/>`).join("")}</svg></div>
      <div class="grid g2">${CF.units.map((u) => { const m = mastery(u.id); return `<div class="card stack"><div class="row between"><div><span class="unit-num">UNIT ${u.num}</span><h3>${u.title}</h3></div>${ring(m.total)}</div>${[["Lessons", m.lf], ["Quiz", m.qscore], ["Numericals", m.dscore], ["Flashcards", m.cl]].map(([l, v]) => `<div class="row between" style="font-size:.85rem;gap:10px"><span style="width:84px">${l}</span><div class="bar" style="flex:1"><i style="width:${v * 100}%"></i></div><span class="num" style="width:38px;text-align:right">${Math.round(v * 100)}%</span></div>`).join("")}</div>`; }).join("")}</div>
      <div class="card stack"><h3>Weak spots</h3>${weak.length ? weak.map((x) => `<a class="topic-btn" href="#drill-${x.g.id}" style="text-decoration:none;color:var(--ink)"><span><b>${x.g.title}</b><small>Unit ${unitById(x.g.u).num}</small></span><span class="badge bad">${x.r.c}/${x.r.a}</span></a>`).join("") : '<p class="muted">No weak numerical topics yet. Topics appear here when your accuracy is below 70% after two or more attempts.</p>'}</div>
      <div class="card stack"><h3>Your data</h3><p class="muted" style="font-size:.9rem">Progress is saved in this browser only. To move it to another device, copy it here and paste it there.</p>
        <div class="row"><button class="btn small" id="exp">Copy progress</button><button class="btn small" id="impT">Paste progress…</button><button class="btn small" id="rst" style="color:var(--bad)">Reset all progress</button></div>
        <div id="impBox" hidden class="stack"><textarea id="impTxt" placeholder="Paste the copied progress text here"></textarea><div><button class="btn small primary" id="imp">Load progress</button></div></div>
        <textarea id="expTxt" hidden readonly></textarea>
        <hr class="hr"><span class="eyebrow">Theme</span>${themeButtons()}</div></div>`;
    $("#exp").addEventListener("click", async () => {
      const txt = JSON.stringify(S());
      try { await navigator.clipboard.writeText(txt); toast("Progress copied"); } catch (e) { const t = $("#expTxt"); t.hidden = false; t.value = txt; t.select(); toast("Select all and copy the text below"); }
    });
    $("#impT").addEventListener("click", () => ($("#impBox").hidden = false));
    $("#imp").addEventListener("click", () => { try { const o = JSON.parse($("#impTxt").value); CF.S = Object.assign(CF.S, o); CF.save(); toast("Progress loaded"); route(); } catch (e) { toast("That text isn't valid progress data"); } });
    $("#rst").addEventListener("click", (e) => { if (!e.target.dataset.sure) { e.target.dataset.sure = 1; e.target.textContent = "Tap again to erase everything"; return; } CF.resetAll(); toast("Progress reset"); route(); });
  };

  /* ---------- Hubs (mobile) ---------- */
  const hub = (title, sub, items) => { fresh().innerHTML = `<div class="wrap">${head(title, sub)}<div class="grid g2">${items.map(([h, ic, t, d]) => `<a class="card method" href="#${h}" style="text-decoration:none;color:var(--ink);grid-template-columns:40px minmax(0,1fr)"><span class="ic" style="width:40px;height:40px">${icon(ic)}</span><div><b>${t}</b><p class="muted" style="font-size:.88rem">${d}</p></div></a>`).join("")}</div></div>`; };
  V.practice = () => hub("Practice", "Test yourself in the format that fits your time.", [["quiz", "quiz", "Quiz", "5–20 MCQs with explanations"], ["drill", "calc", "Numericals", "Unlimited problems with worked solutions"], ["bank", "folder", "Question bank", "Your course question sets, fully solved"], ["exam", "clock", "Mock exam", "30-minute timed mixed test"]]);
  V.tools = () => hub("Tools", "Models, references and your progress.", [["labs", "flask", "Labs", "Interactive NPV, leverage, EBIT–EPS, capital structure, dividends, EOQ"], ["formulas", "sigma", "Formula sheet", "Every formula, with recall mode"], ["tables", "table", "PV / FV tables", "PVIF, PVIFA, FVIF, FVIFA to 3 decimals"], ["progress", "chart", "Progress", "Mastery by unit, weak spots, backup"]]);

  /* ---------- Router ---------- */
  function route() {
    const h = current();
    if (h !== "exam") clearInterval(exTimer);
    renderChrome();
    if (V[h] && !["unit", "lesson"].includes(h)) V[h]();
    else if (/^u[1-5]$/.test(h)) V.unit(h);
    else if (lessonById(h)) V.lesson(h);
    else if (h.startsWith("drill-")) V.drill(h.slice(6));
    else if (h.startsWith("lab-")) V.labs(h.slice(4));
    else V.home();
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  document.addEventListener("keydown", (e) => {
    if (current() !== "cards" || !fc || !$("#flash") || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.code === "Space") { e.preventDefault(); $("#flipBtn") && !$("#flipBtn").hidden ? $("#flipBtn").click() : null; }
    if (/^[1-4]$/.test(e.key) && !$("#rate").hidden) rate(+e.key - 1);
  });

  route();

  /* ---------- Offline (only where service workers are allowed) ---------- */
  if ("serviceWorker" in navigator && location.protocol === "https:" && !/claude|anthropic/.test(location.hostname)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
