/* Interactive labs. Each lab: { id, u, title, desc, render(el) } */
(function () {
  const { n, nf, rs, $, $$ } = CF;
  const P = (x, d = 2) => nf(x * 100, d) + "%";
  const C = ["var(--accent)", "var(--gold)", "var(--bad)", "var(--muted)", "var(--good)"];

  /* ---- Tiny SVG line chart ---- */
  function chart(o) {
    const W = 640, H = 340, m = { l: 62, r: 18, t: 16, b: 44 };
    const [x0, x1] = o.x, [y0, y1] = o.y;
    const X = (v) => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r);
    const Y = (v) => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b);
    const ticks = (a, b, k) => { const s = (b - a) / k; return Array.from({ length: k + 1 }, (_, i) => a + s * i); };
    let g = "";
    ticks(y0, y1, 5).forEach((v) => { g += `<line class="gl" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${o.fy ? o.fy(v) : nf(v, 1)}</text>`; });
    ticks(x0, x1, o.xt || 5).forEach((v) => { g += `<text x="${X(v)}" y="${H - m.b + 18}" text-anchor="middle">${o.fx ? o.fx(v) : nf(v, 0)}</text>`; });
    g += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/><line class="ax" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}"/>`;
    if (y0 < 0 && y1 > 0) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--ink)" stroke-width="1" opacity=".5"/>`;
    if (o.xl) g += `<text x="${(m.l + W - m.r) / 2}" y="${H - 6}" text-anchor="middle" style="font-weight:600">${o.xl}</text>`;
    if (o.yl) g += `<text transform="translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle" style="font-weight:600">${o.yl}</text>`;
    (o.v || []).forEach((v) => { if (v.x >= x0 && v.x <= x1) g += `<line x1="${X(v.x)}" x2="${X(v.x)}" y1="${m.t}" y2="${H - m.b}" stroke="${v.c || "var(--muted)"}" stroke-dasharray="4 4"/>${v.label ? `<text x="${Math.min(X(v.x) + 6, W - m.r - 4)}" y="${m.t + 12}" text-anchor="${X(v.x) > W - 140 ? "end" : "start"}" style="fill:${v.c || "var(--muted)"};font-weight:600">${v.label}</text>` : ""}`; });
    o.s.forEach((s, i) => {
      const pts = s.pts.filter((p) => isFinite(p[1])).map((p) => [X(p[0]), Math.max(m.t - 4, Math.min(H - m.b + 4, Y(p[1])))]);
      if (pts.length) g += `<polyline fill="none" stroke="${s.c || C[i]}" stroke-width="${s.w || 2.5}" ${s.dash ? 'stroke-dasharray="6 5"' : ""} stroke-linejoin="round" points="${pts.map((p) => p.join(",")).join(" ")}"/>`;
    });
    (o.dots || []).forEach((d) => { if (d.x >= x0 && d.x <= x1 && d.y >= y0 && d.y <= y1) g += `<circle cx="${X(d.x)}" cy="${Y(d.y)}" r="5.5" fill="${d.c || "var(--ink)"}" stroke="var(--surface)" stroke-width="2"/>`; });
    const legend = o.s.filter((s) => s.label).map((s, i) => `<span><i style="background:${s.c || C[i]}"></i>${s.label}</span>`).join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria || "chart"}">${g}</svg>${legend ? `<div class="legend">${legend}</div>` : ""}`;
  }
  CF.chart = chart;
  const range = (a, b, k) => Array.from({ length: k + 1 }, (_, i) => a + (b - a) * i / k);
  const slider = (id, label, min, max, step, val, fmt) => `<label class="fld" for="${id}"><span class="lv"><span>${label}</span><span id="${id}-v"></span></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" data-fmt="${fmt || ""}"></label>`;
  const numIn = (id, label, val) => `<label class="fld" for="${id}">${label}<input type="number" id="${id}" value="${val}"></label>`;
  function bind(el, fn) {
    const upd = () => {
      $$("input[type=range]", el).forEach((r) => { const o = $("#" + r.id + "-v", el); if (o) { const v = +r.value, f = r.dataset.fmt; o.textContent = f === "pct" ? nf(v, 1) + "%" : f === "rs" ? rs(v) : f === "x" ? nf(v, 2) : n(v); } });
      fn();
    };
    el.addEventListener("input", upd); upd();
  }
  const val = (el, id) => +$("#" + id, el).value;
  const kpi = (label, v) => `<div class="kpi"><small>${label}</small><b>${v}</b></div>`;

  const labs = [
    {
      id: "npv", u: "u2", title: "NPV profile & IRR", desc: "See how NPV falls as the discount rate rises, and where it crosses zero (IRR).",
      render(el) {
        el.innerHTML = `<div class="lab"><div class="ctrl card">${numIn("o", "Initial outlay (₹)", 100000)}${[30000, 40000, 50000, 20000].map((v, i) => numIn("c" + i, "Cash flow year " + (i + 1), v)).join("")}${slider("k", "Cost of capital", 0, 30, 0.5, 10, "pct")}</div><div class="stack"><div class="kpis" id="kp"></div><div class="card" id="ch"></div><p class="muted" id="msg"></p></div></div>`;
        bind(el, () => {
          const c0 = val(el, "o"), cfs = [0, 1, 2, 3].map((i) => val(el, "c" + i)), k = val(el, "k") / 100;
          const v = CF.npv(k, c0, cfs), irr = CF.irr(c0, cfs), pvIn = v + c0;
          let cum = 0, pb = NaN; for (let i = 0; i < 4; i++) { if (cum + cfs[i] >= c0) { pb = i + (c0 - cum) / cfs[i]; break; } cum += cfs[i]; }
          $("#kp", el).innerHTML = kpi("NPV at k", rs(v)) + kpi("IRR", isFinite(irr) ? P(irr) : "—") + kpi("PI", nf(pvIn / c0, 3)) + kpi("Payback", isFinite(pb) ? nf(pb, 2) + " yrs" : "> 4 yrs");
          const pts = range(0, 0.4, 80).map((r) => [r * 100, CF.npv(r, c0, cfs)]);
          const ys = pts.map((p) => p[1]), lo = Math.min(0, ...ys), hi = Math.max(0, ...ys);
          $("#ch", el).innerHTML = chart({ x: [0, 40], y: [lo - (hi - lo) * 0.05, hi + (hi - lo) * 0.08], s: [{ pts, label: "NPV" }], xt: 8, xl: "Discount rate (%)", yl: "NPV (₹)", fy: (y) => n(y / 1000, 0) + "k", v: [{ x: k * 100, label: "k = " + P(k, 1), c: "var(--gold)" }, ...(isFinite(irr) ? [{ x: irr * 100, label: "IRR " + P(irr, 1), c: "var(--accent)" }] : [])], dots: [{ x: k * 100, y: v, c: "var(--gold)" }] });
          $("#msg", el).innerHTML = v >= 0 ? `NPV is positive because k (${P(k, 1)}) is below the IRR. Every rupee of PV above the outlay is wealth created.` : `NPV is negative: the project's IRR is below the cost of capital (${P(k, 1)}), so it destroys value.`;
        });
      },
    },
    {
      id: "lev", u: "u3", title: "Leverage simulator", desc: "Move sales, cost structure and interest; watch DOL, DFL and DCL magnify the effect on EPS.",
      render(el) {
        el.innerHTML = `<div class="lab"><div class="ctrl card">${slider("s", "Sales (₹)", 200000, 3000000, 10000, 1000000, "rs")}${slider("v", "Variable cost (% of sales)", 20, 85, 1, 60, "pct")}${slider("f", "Fixed operating cost (₹)", 0, 1000000, 10000, 250000, "rs")}${slider("i", "Interest (₹)", 0, 500000, 5000, 50000, "rs")}${slider("d", "Change in sales to test", -30, 30, 1, 10, "pct")}</div><div class="stack"><div class="kpis" id="kp"></div><div class="card"><div class="tbl-wrap"><table id="tb"></table></div></div><p class="muted" id="msg"></p></div></div>`;
        bind(el, () => {
          const s = val(el, "s"), vr = val(el, "v") / 100, fc = val(el, "f"), it = val(el, "i"), d = val(el, "d") / 100, t = 0.3, sh = 10000;
          const calc = (S) => { const c = S * (1 - vr), e = c - fc, b = e - it, eps = b * (1 - t) / sh; return { S, c, e, b, eps }; };
          const a = calc(s), b = calc(s * (1 + d));
          const dol = a.c / a.e, dfl = a.e / a.b, dcl = a.c / a.b;
          $("#kp", el).innerHTML = kpi("DOL", a.e > 0 ? nf(dol, 2) : "—") + kpi("DFL", a.b > 0 ? nf(dfl, 2) : "—") + kpi("DCL", a.b > 0 ? nf(dcl, 2) : "—");
          const ch = (x, y) => (Math.abs(x) < 1e-9 ? "—" : nf((y - x) / Math.abs(x) * 100, 1) + "%");
          $("#tb", el).innerHTML = `<thead><tr><th>Line</th><th class="n">Base</th><th class="n">After ${nf(d * 100, 0)}% sales change</th><th class="n">% change</th></tr></thead><tbody>
            <tr><td>Sales</td><td class="n">${n(a.S)}</td><td class="n">${n(b.S)}</td><td class="n">${ch(a.S, b.S)}</td></tr>
            <tr><td>Contribution</td><td class="n">${n(a.c)}</td><td class="n">${n(b.c)}</td><td class="n">${ch(a.c, b.c)}</td></tr>
            <tr><td>EBIT</td><td class="n">${n(a.e)}</td><td class="n">${n(b.e)}</td><td class="n"><b>${ch(a.e, b.e)}</b></td></tr>
            <tr><td>EBT</td><td class="n">${n(a.b)}</td><td class="n">${n(b.b)}</td><td class="n">${ch(a.b, b.b)}</td></tr>
            <tr><td>EPS (10,000 shares, 30% tax)</td><td class="n">${nf(a.eps, 2)}</td><td class="n">${nf(b.eps, 2)}</td><td class="n"><b>${ch(a.eps, b.eps)}</b></td></tr></tbody>`;
          $("#msg", el).innerHTML = a.b > 0 ? `A ${nf(d * 100, 0)}% change in sales moves EBIT by about ${nf(dol * d * 100, 1)}% (DOL × ${nf(d * 100, 0)}%) and EPS by about ${nf(dcl * d * 100, 1)}% (DCL × ${nf(d * 100, 0)}%). Raise fixed costs or interest and watch both multipliers grow.` : "EBT is zero or negative: the firm is below its break-even point, so leverage ratios aren't meaningful here.";
        });
      },
    },
    {
      id: "ebiteps", u: "u3", title: "EBIT–EPS chart", desc: "Compare an all-equity plan with a debt plan and find the indifference point.",
      render(el) {
        el.innerHTML = `<div class="lab"><div class="ctrl card">${slider("need", "Funds needed (₹ lakh)", 10, 200, 5, 100, "")}${slider("ex", "Existing shares (lakh)", 0, 10, 0.5, 0, "")}${slider("pr", "Issue price per share (₹)", 10, 100, 5, 25, "")}${slider("dp", "Debt share in Plan B (%)", 10, 100, 5, 75, "pct")}${slider("ir", "Interest rate", 6, 18, 0.5, 12, "pct")}${slider("t", "Tax rate", 0, 50, 1, 30, "pct")}${slider("eb", "Expected EBIT (₹ lakh)", 0, 100, 1, 40, "")}</div><div class="stack"><div class="kpis" id="kp"></div><div class="card" id="ch"></div><p class="muted" id="msg"></p></div></div>`;
        bind(el, () => {
          const need = val(el, "need"), ex = val(el, "ex"), pr = val(el, "pr"), dp = val(el, "dp") / 100, ir = val(el, "ir") / 100, t = val(el, "t") / 100, eb = val(el, "eb");
          const nA = ex + need / pr, nB = ex + need * (1 - dp) / pr, I = need * dp * ir;
          const epsA = (x) => x * (1 - t) / nA, epsB = (x) => (x - I) * (1 - t) / nB;
          const X = nA !== nB ? I * nA / (nA - nB) : NaN, xmax = Math.max(eb * 1.4, (isFinite(X) ? X : 0) * 1.6, 20);
          const ptsA = range(0, xmax, 60).map((x) => [x, epsA(x)]), ptsB = range(0, xmax, 60).map((x) => [x, epsB(x)]);
          const ys = ptsA.concat(ptsB).map((p) => p[1]);
          $("#kp", el).innerHTML = kpi("EPS Plan A (equity)", "₹" + nf(epsA(eb), 2)) + kpi("EPS Plan B (debt)", "₹" + nf(epsB(eb), 2)) + kpi("Indifference EBIT", isFinite(X) ? "₹" + nf(X, 2) + " L" : "—") + kpi("FBEP Plan B", "₹" + nf(I, 2) + " L");
          $("#ch", el).innerHTML = chart({ x: [0, xmax], y: [Math.min(...ys), Math.max(...ys)], s: [{ pts: ptsA, label: "Plan A: all equity" }, { pts: ptsB, label: `Plan B: ${nf(dp * 100, 0)}% debt` }], xl: "EBIT (₹ lakh)", yl: "EPS (₹)", fy: (y) => nf(y, 1), v: [{ x: eb, label: "Expected EBIT", c: "var(--muted)" }, ...(isFinite(X) ? [{ x: X, label: "Indifference", c: "var(--bad)" }] : [])], dots: isFinite(X) ? [{ x: X, y: epsA(X), c: "var(--bad)" }] : [] });
          $("#msg", el).innerHTML = isFinite(X) ? (eb > X ? `Expected EBIT (₹${eb} L) is above the indifference point (₹${nf(X, 2)} L), so the debt plan gives the higher EPS.` : `Expected EBIT (₹${eb} L) is below the indifference point (₹${nf(X, 2)} L), so the equity plan gives the higher EPS.`) + " Tip: set funds 100, price 25, debt 75%, interest 12%, tax 30% and EBIT 40 to reproduce Sun Ltd (Q5)." : "";
        });
      },
    },
    {
      id: "cs", u: "u3", title: "Capital structure theories", desc: "Watch K<sub>e</sub>, K<sub>d</sub> and K<sub>o</sub> change with leverage under NI, NOI, traditional, MM and trade-off views.",
      render(el) {
        const th = [["ni", "Net Income"], ["noi", "NOI / MM (no tax)"], ["trad", "Traditional"], ["mmt", "MM with tax"], ["to", "Trade-off"]];
        el.innerHTML = `<div class="stack"><div class="chips" id="th">${th.map((x, i) => `<button class="chip" data-t="${x[0]}" aria-pressed="${i === 0}">${x[1]}</button>`).join("")}</div><div class="lab"><div class="ctrl card">${slider("w", "Debt ratio D/V", 0, 90, 1, 40, "pct")}<p class="muted" id="desc" style="font-size:.88rem"></p></div><div class="stack"><div class="kpis" id="kp"></div><div class="card" id="ch"></div></div></div></div>`;
        let cur = "ni";
        $("#th", el).addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; cur = b.dataset.t; $$(".chip", el).forEach((c) => c.setAttribute("aria-pressed", c === b)); draw(); });
        const kdB = 0.10, keB = 0.15, ku = 0.125, T = 0.3;
        const model = (w) => {
          const de = w / (1 - w);
          switch (cur) {
            case "ni": return { kd: kdB, ke: keB, ko: keB * (1 - w) + kdB * w };
            case "noi": return { kd: kdB, ke: ku + (ku - kdB) * de, ko: ku };
            case "trad": { const kd = kdB + 0.25 * Math.pow(Math.max(0, w - 0.45), 2), ke = keB + 0.35 * Math.pow(Math.max(0, w - 0.2), 2); return { kd, ke, ko: ke * (1 - w) + kd * w }; }
            case "mmt": return { kd: kdB * (1 - T), ke: ku + (ku - kdB) * (1 - T) * de, ko: ku * (1 - T * w) };
            case "to": { const kd = (kdB + 0.3 * Math.pow(Math.max(0, w - 0.4), 2)) * (1 - T); const ko = ku * (1 - T * w) + 0.16 * Math.pow(w, 3); return { kd, ke: (ko - kd * w) / (1 - w), ko }; }
          }
        };
        const desc = { ni: "K<sub>e</sub> and K<sub>d</sub> stay constant; adding cheaper debt keeps lowering K<sub>o</sub>. Optimum: maximum debt.", noi: "K<sub>o</sub> is constant; K<sub>e</sub> rises linearly to absorb the benefit of cheap debt. Capital structure is irrelevant (MM Prop. I & II without tax).", trad: "Moderate debt lowers K<sub>o</sub>; beyond a point K<sub>e</sub> and K<sub>d</sub> rise steeply. K<sub>o</sub> is U-shaped with an optimum.", mmt: "Interest tax shield: WACC = K<sub>u</sub>(1 − T·D/V) keeps falling. K<sub>d</sub> shown after tax.", to: "Tax shield lowers WACC at first; expected distress costs push it back up. Illustrative curve with an interior optimum." };
        const draw = () => {
          const w = val(el, "w") / 100, cur3 = model(w), ws = range(0, 0.9, 90);
          const pts = (k) => ws.map((x) => [x * 100, model(x)[k] * 100]);
          let best = 0, bk = 1; ws.forEach((x) => { const k = model(x).ko; if (k < bk - 1e-9) { bk = k; best = x; } });
          $("#desc", el).textContent = desc[cur];
          $("#kp", el).innerHTML = kpi("K<sub>e</sub>", P(cur3.ke)) + kpi(cur === "mmt" || cur === "to" ? "K<sub>d</sub> after tax" : "K<sub>d</sub>", P(cur3.kd)) + kpi("K<sub>o</sub> (WACC)", P(cur3.ko)) + kpi("Lowest K<sub>o</sub> at D/V", cur === "noi" ? "any" : nf(best * 100, 0) + "%");
          $("#ch", el).innerHTML = chart({ x: [0, 90], y: [0, 30], xt: 6, s: [{ pts: pts("ke"), label: "K<sub>e</sub>", c: "var(--bad)" }, { pts: pts("ko"), label: "K<sub>o</sub> (WACC)", c: "var(--accent)", w: 3.5 }, { pts: pts("kd"), label: "K<sub>d</sub>", c: "var(--gold)" }], xl: "Debt ratio D/V (%)", yl: "Cost (%)", fy: (y) => nf(y, 0) + "%", v: [{ x: w * 100, c: "var(--muted)" }], dots: [{ x: w * 100, y: cur3.ko * 100, c: "var(--accent)" }] });
        };
        bind(el, draw);
      },
    },
    {
      id: "div", u: "u4", title: "Dividend models", desc: "Walter's and Gordon's share price as payout changes, for growth, normal and declining firms.",
      render(el) {
        el.innerHTML = `<div class="stack"><div class="chips" id="md"><button class="chip" data-m="w" aria-pressed="true">Walter</button><button class="chip" data-m="g" aria-pressed="false">Gordon</button></div><div class="lab"><div class="ctrl card">${slider("e", "EPS (₹)", 2, 30, 1, 10, "")}${slider("k", "Cost of equity k", 6, 20, 0.5, 10, "pct")}${slider("r", "Return on investment r", 2, 25, 0.5, 15, "pct")}${slider("p", "Payout ratio", 0, 100, 5, 40, "pct")}</div><div class="stack"><div class="kpis" id="kp"></div><div class="card" id="ch"></div><p class="muted" id="msg"></p></div></div></div>`;
        let m = "w";
        $("#md", el).addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; m = b.dataset.m; $$("#md .chip", el).forEach((c) => c.setAttribute("aria-pressed", c === b)); draw(); });
        const price = (E, k, r, pay) => m === "w" ? (E * pay + (r / k) * (E - E * pay)) / k : (k - (1 - pay) * r > 0.0005 ? E * pay / (k - (1 - pay) * r) : NaN);
        const draw = () => {
          const E = val(el, "e"), k = val(el, "k") / 100, r = val(el, "r") / 100, pay = val(el, "p") / 100;
          const xs = range(0, 1, 50), line = (rr) => xs.map((x) => [x * 100, price(E, k, rr, x)]);
          const s = [{ pts: line(r), label: `Your firm (r = ${P(r, 1)})`, c: "var(--accent)", w: 3.5 }, { pts: line(k), label: "r = k", c: "var(--muted)", dash: 1 }];
          const ys = s.flatMap((x) => x.pts.map((p) => p[1])).filter((y) => isFinite(y) && y < E / k * 6);
          const p0 = price(E, k, r, pay);
          $("#kp", el).innerHTML = kpi("Price at chosen payout", isFinite(p0) ? "₹" + nf(p0, 2) : "undefined") + kpi("Firm type", r > k ? "Growth (r > k)" : r < k ? "Declining (r < k)" : "Normal (r = k)") + kpi("Best payout", r > k ? (m === "g" ? "Lowest feasible" : "0%") : r < k ? "100%" : "Irrelevant");
          $("#ch", el).innerHTML = chart({ x: [0, 100], y: [0, Math.max(...ys, 1) * 1.08], s, xl: "Payout ratio (%)", yl: "Share price (₹)", fy: (y) => n(y, 0), v: [{ x: pay * 100, c: "var(--gold)" }], dots: isFinite(p0) ? [{ x: pay * 100, y: p0, c: "var(--gold)" }] : [] });
          $("#msg", el).innerHTML = (m === "g" ? "Gordon: P₀ = E(1 − b)/(k − br). If br ≥ k the formula breaks (growth ≥ required return), so very low payouts are cut off. " : "Walter: P = [D + (r/k)(E − D)]/k. ") + (r > k ? "Because r > k, every rupee retained is worth more than a rupee paid out." : r < k ? "Because r < k, shareholders can do better elsewhere, so paying out raises price." : "With r = k, payout makes no difference.");
        };
        bind(el, draw);
      },
    },
    {
      id: "eoq", u: "u5", title: "EOQ cost curves", desc: "Ordering cost falls and carrying cost rises with order size; total cost bottoms out at EOQ.",
      render(el) {
        el.innerHTML = `<div class="lab"><div class="ctrl card">${slider("a", "Annual demand (units)", 1000, 50000, 500, 12000, "")}${slider("o", "Ordering cost per order (₹)", 20, 1000, 10, 200, "rs")}${slider("c", "Carrying cost per unit p.a. (₹)", 0.5, 20, 0.1, 4.8, "x")}</div><div class="stack"><div class="kpis" id="kp"></div><div class="card" id="ch"></div></div></div>`;
        bind(el, () => {
          const A = val(el, "a"), O = val(el, "o"), Cc = val(el, "c"), q = Math.sqrt(2 * A * O / Cc), qs = range(q * 0.2, q * 3, 80);
          const oc = (x) => A / x * O, cc = (x) => x / 2 * Cc;
          $("#kp", el).innerHTML = kpi("EOQ", n(q, 0) + " units") + kpi("Orders a year", nf(A / q, 1)) + kpi("Total cost at EOQ", rs(oc(q) + cc(q)));
          $("#ch", el).innerHTML = chart({ x: [qs[0], qs[qs.length - 1]], y: [0, (oc(q) + cc(q)) * 2.2], s: [{ pts: qs.map((x) => [x, oc(x) + cc(x)]), label: "Total cost", c: "var(--accent)", w: 3.5 }, { pts: qs.map((x) => [x, oc(x)]), label: "Ordering cost", c: "var(--gold)" }, { pts: qs.map((x) => [x, cc(x)]), label: "Carrying cost", c: "var(--bad)" }], xl: "Order quantity (units)", yl: "Annual cost (₹)", fy: (y) => n(y, 0), v: [{ x: q, label: "EOQ", c: "var(--accent)" }], dots: [{ x: q, y: oc(q) + cc(q), c: "var(--accent)" }] });
        });
      },
    },
  ];
  CF.labs = labs;
})();
