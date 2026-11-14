/* Randomised numerical problem generators.
   make() returns { given:[[label, text]], ask, ans, kind:'pct'|'rs'|'yrs'|'num'|'days'|'units', dp, tol, steps:[html], hint } */
(function () {
  const { n, nf, rs, pct, ri, rstep, pick, r3, pvf, pvifa, M } = CF;
  const P = (x, d = 2) => nf(x * 100, d) + "%";
  const tblPV = (r, t) => r3(pvf(r, t));
  const G = [];
  const add = (g) => G.push(g);

  /* ---------------- Unit I ---------------- */
  add({ id: "fv", u: "u1", title: "Future value of a lump sum", desc: "Compounding", make() {
    const pv = rstep(10000, 200000, 5000), r = ri(5, 15) / 100, t = ri(2, 10), fv = pv * Math.pow(1 + r, t);
    return { given: [["Amount today", rs(pv)], ["Rate", P(r, 0)], ["Years", t]], ask: "Find the future value.", ans: fv, kind: "rs", tol: 0.005,
      hint: "FV = PV × (1 + r)ⁿ",
      steps: [M(`FV = ${n(pv)} × (1 + ${r})^${t}`), `(1 + ${r})<sup>${t}</sup> = ${nf(Math.pow(1 + r, t), 4)}`, `FV = <b>${rs(fv, 0)}</b>`] };
  } });
  add({ id: "pva", u: "u1", title: "Present value of an annuity", desc: "PVIFA", make() {
    const a = rstep(5000, 100000, 2500), r = ri(6, 16) / 100, t = ri(3, 8), f = pvifa(r, t), pv = a * f;
    return { given: [["Annual amount", rs(a)], ["Rate", P(r, 0)], ["Years", t]], ask: "Find the present value of the annuity.", ans: pv, kind: "rs", tol: 0.006,
      hint: "PV = A × PVIFA(r, n), where PVIFA = [1 − (1+r)⁻ⁿ] / r",
      steps: [M(`PVIFA = {1 − (1 + ${r})^{−${t}}}/{${r}} = ${nf(f, 4)}`), `PV = ${n(a)} × ${nf(f, 4)} = <b>${rs(pv, 0)}</b>`] };
  } });

  /* ---------------- Unit II ---------------- */
  add({ id: "pb-even", u: "u2", title: "Payback period (even cash flows)", desc: "Payback", make() {
    const c = rstep(100000, 900000, 20000), a = rstep(Math.round(c / 7 / 1000) * 1000 || 20000, Math.round(c / 2.5 / 1000) * 1000, 1000), pb = c / a;
    return { given: [["Initial investment", rs(c)], ["Annual cash inflow", rs(a)]], ask: "Find the payback period (years).", ans: pb, kind: "yrs", tol: 0.01,
      hint: "Investment ÷ annual inflow", steps: [`PBP = ${n(c)} ÷ ${n(a)} = <b>${nf(pb, 2)} years</b>`] };
  } });
  add({ id: "pb-uneven", u: "u2", title: "Payback period (uneven cash flows)", desc: "Payback", make() {
    const cfs = [0, 0, 0, 0, 0].map(() => rstep(10000, 40000, 1000));
    const total3 = cfs[0] + cfs[1] + cfs[2];
    const c = rstep(Math.round(cfs[0] + cfs[1] + 2000), total3 + Math.round(cfs[3] * 0.8), 1000);
    let cum = 0, yrs = 0, steps = [], pb = 0;
    for (let i = 0; i < cfs.length; i++) {
      if (cum + cfs[i] >= c) { pb = i + (c - cum) / cfs[i]; steps.push(`Recovery falls in year ${i + 1}. Unrecovered at start of year ${i + 1} = ${n(c)} − ${n(cum)} = ${n(c - cum)}.`); steps.push(`Fraction = ${n(c - cum)} ÷ ${n(cfs[i])} = ${nf((c - cum) / cfs[i], 2)}`); break; }
      cum += cfs[i]; yrs = i + 1;
    }
    let c2 = 0; const cumStr = cfs.map((x) => (c2 += x, n(c2))).join(" → ");
    steps.unshift(`Cumulative inflows: ${cumStr}`);
    steps.push(`PBP = ${Math.floor(pb)} + ${nf(pb - Math.floor(pb), 2)} = <b>${nf(pb, 2)} years</b>`);
    return { given: [["Initial investment", rs(c)], ...cfs.map((x, i) => ["Year " + (i + 1), rs(x)])], ask: "Find the payback period (years).", ans: pb, kind: "yrs", tol: 0.01, hint: "Add inflows until the cumulative total crosses the investment; take a fraction of that year.", steps };
  } });
  add({ id: "arr", u: "u2", title: "Accounting rate of return", desc: "ARR", make() {
    const c = rstep(100000, 600000, 20000), s = pick([0, 0, rstep(10000, 50000, 5000)]), life = ri(4, 6);
    const pat = Array.from({ length: life }, () => rstep(10000, Math.round(c * 0.25 / 1000) * 1000, 1000));
    const avgPat = pat.reduce((a, b) => a + b, 0) / life, avgInv = (c - s) / 2 + s, arr = avgPat / avgInv;
    return { given: [["Cost", rs(c)], ["Salvage", rs(s)], ["Life", life + " years"], ["PAT by year", pat.map((x) => n(x)).join(", ")]], ask: "Find ARR on average investment (%).", ans: arr * 100, kind: "pct", tol: 0.05,
      hint: "Average investment = (Cost − Salvage)/2 + Salvage",
      steps: [`Average PAT = ${n(pat.reduce((a, b) => a + b, 0))} ÷ ${life} = ${n(avgPat, 2)}`, `Average investment = (${n(c)} − ${n(s)})/2 + ${n(s)} = ${n(avgInv)}`, `ARR = ${n(avgPat, 2)} ÷ ${n(avgInv)} × 100 = <b>${P(arr)}</b>`] };
  } });
  add({ id: "cfat", u: "u2", title: "Annual CFAT", desc: "Cash flow estimation", make() {
    const cost = rstep(200000, 1000000, 50000), life = pick([4, 5, 8, 10]), dep = cost / life, rev = rstep(200000, 900000, 10000), cc = Math.round(rev * ri(35, 60) / 100 / 1000) * 1000, t = pick([0.25, 0.3, 0.35, 0.4]);
    const ebt = rev - cc - dep, cf = ebt * (1 - t) + dep;
    return { given: [["Machine cost", rs(cost)], ["Life (SLM, no salvage)", life + " years"], ["Annual revenue", rs(rev)], ["Cash operating cost", rs(cc)], ["Tax", P(t, 0)]], ask: "Find annual cash flow after tax.", ans: cf, kind: "rs", tol: 0.003,
      hint: "CFAT = (R − C − D)(1 − T) + D",
      steps: [`Depreciation = ${n(cost)} ÷ ${life} = ${n(dep)}`, `EBT = ${n(rev)} − ${n(cc)} − ${n(dep)} = ${n(ebt)}`, `PAT = ${n(ebt)} × ${1 - t} = ${n(ebt * (1 - t))}`, `CFAT = PAT + Dep = <b>${rs(cf)}</b>`, `Check: (R − C)(1 − T) + D·T = ${n((rev - cc) * (1 - t))} + ${n(dep * t)} ✓`] };
  } });
  function npvProblem() {
    const life = ri(3, 5), r = pick([0.08, 0.1, 0.12, 0.14, 0.15]), cfs = Array.from({ length: life }, () => rstep(20000, 90000, 5000));
    const pvs = cfs.map((x, i) => x * tblPV(r, i + 1)), tot = pvs.reduce((a, b) => a + b, 0);
    const c = rstep(Math.round(tot * 0.8 / 5000) * 5000, Math.round(tot * 1.15 / 5000) * 5000, 5000);
    return { life, r, cfs, pvs, tot, c };
  }
  add({ id: "npv", u: "u2", title: "Net present value", desc: "NPV (exam tables)", make() {
    const { r, cfs, pvs, tot, c } = npvProblem(), v = tot - c;
    return { given: [["Initial outlay", rs(c)], ["Discount rate", P(r, 0)], ...cfs.map((x, i) => ["CFAT year " + (i + 1), rs(x)])], ask: "Find NPV (use 3-decimal PV factors).", ans: v, kind: "rs", tol: 0.004, absTol: c * 0.004,
      hint: "Multiply each cash flow by its PV factor, add, subtract the outlay.",
      steps: [`PV factors at ${P(r, 0)}: ${cfs.map((_, i) => nf(tblPV(r, i + 1), 3)).join(", ")}`, `PVs: ${pvs.map((x) => n(x)).join(" + ")} = ${n(tot)}`, `NPV = ${n(tot)} − ${n(c)} = <b>${rs(v)}</b> → ${v >= 0 ? "accept" : "reject"}`] };
  } });
  add({ id: "pi", u: "u2", title: "Profitability index", desc: "PI", make() {
    const { r, cfs, pvs, tot, c } = npvProblem(), pi = tot / c;
    return { given: [["Initial outlay", rs(c)], ["Discount rate", P(r, 0)], ...cfs.map((x, i) => ["CFAT year " + (i + 1), rs(x)])], ask: "Find the profitability index (3 decimals).", ans: pi, kind: "num", dp: 3, tol: 0.006,
      hint: "PI = PV of inflows ÷ PV of outflows",
      steps: [`PV of inflows = ${pvs.map((x) => n(x)).join(" + ")} = ${n(tot)}`, `PI = ${n(tot)} ÷ ${n(c)} = <b>${nf(pi, 3)}</b> → ${pi >= 1 ? "accept" : "reject"}`] };
  } });
  add({ id: "dpb", u: "u2", title: "Discounted payback period", desc: "DPB", make() {
    let p; do { p = npvProblem(); } while (p.tot <= p.c);
    const { r, cfs, pvs, c } = p; let cum = 0, ans = 0, st = [];
    for (let i = 0; i < pvs.length; i++) { if (cum + pvs[i] >= c) { ans = i + (c - cum) / pvs[i]; st.push(`Unrecovered after year ${i} = ${n(c - cum)}; fraction of year ${i + 1} = ${n(c - cum)} ÷ ${n(pvs[i])} = ${nf((c - cum) / pvs[i], 2)}`); break; } cum += pvs[i]; }
    let c2 = 0;
    return { given: [["Initial outlay", rs(c)], ["Discount rate", P(r, 0)], ...cfs.map((x, i) => ["CFAT year " + (i + 1), rs(x)])], ask: "Find the discounted payback period (years).", ans, kind: "yrs", tol: 0.01, absTol: 0.03,
      hint: "Discount each cash flow first, then do payback on the PVs.",
      steps: [`PVs: ${pvs.map((x) => n(x)).join(", ")}`, `Cumulative PV: ${pvs.map((x) => n(c2 += x)).join(" → ")}`, ...st, `DPB = <b>${nf(ans, 2)} years</b>`] };
  } });
  add({ id: "irr", u: "u2", title: "IRR (even cash flows)", desc: "IRR via PVIFA", make() {
    const life = ri(3, 8), irr = ri(8, 24) / 100 + ri(0, 9) / 1000, a = rstep(10000, 80000, 1000), c = Math.round(a * pvifa(irr, life) / 100) * 100;
    const ex = CF.irr(c, Array(life).fill(a)), f = c / a, lo = Math.floor(ex * 100) / 100, hi = lo + 0.01;
    const fl = pvifa(lo, life), fh = pvifa(hi, life), interp = lo + (fl - f) / (fl - fh) * 0.01;
    return { given: [["Initial outlay", rs(c)], ["Annual inflow", rs(a)], ["Life", life + " years"]], ask: "Find IRR (%) to two decimals.", ans: interp * 100, kind: "pct", tol: 0, absTol: 0.08,
      hint: "Factor = Outlay ÷ Annual inflow. Find the two rates in the PVIFA row whose factors bracket it, then interpolate.",
      steps: [`PVIFA factor = ${n(c)} ÷ ${n(a)} = ${nf(f, 4)}`, `In the ${life}-year row: PVIFA(${P(lo, 0)}) = ${nf(fl, 4)}, PVIFA(${P(hi, 0)}) = ${nf(fh, 4)}`, M(`IRR = ${nf(lo * 100, 0)}% + {${nf(fl, 4)} − ${nf(f, 4)}}/{${nf(fl, 4)} − ${nf(fh, 4)}} × 1%`), `IRR ≈ <b>${P(interp)}</b> (exact: ${P(ex)})`] };
  } });
  add({ id: "radr", u: "u2", title: "NPV at a risk-adjusted discount rate", desc: "RADR", make() {
    const rf = ri(5, 8) / 100, rp = ri(3, 8) / 100, r = rf + rp, life = ri(3, 5), cfs = Array.from({ length: life }, () => rstep(20, 90, 5));
    const pvs = cfs.map((x, i) => x * pvf(r, i + 1)), tot = pvs.reduce((a, b) => a + b, 0), c = rstep(Math.round(tot * 0.75), Math.round(tot * 1.1), 5);
    return { given: [["Investment (₹ lakh)", n(c)], ["Risk-free rate", P(rf, 0)], ["Risk premium", P(rp, 0)], ...cfs.map((x, i) => ["CF year " + (i + 1) + " (₹ lakh)", n(x)])], ask: "Find NPV at the RADR (₹ lakh).", ans: tot - c, kind: "num", dp: 2, tol: 0.01, absTol: c * 0.004,
      hint: "RADR = Rf + risk premium. Discount every cash flow at it.",
      steps: [`RADR = ${P(rf, 0)} + ${P(rp, 0)} = ${P(r, 0)}`, `PVs: ${pvs.map((x) => nf(x, 2)).join(" + ")} = ${nf(tot, 2)}`, `NPV = ${nf(tot, 2)} − ${n(c)} = <b>₹${nf(tot - c, 2)} lakh</b>`] };
  } });
  add({ id: "enpv", u: "u2", title: "Expected NPV (probabilities)", desc: "Scenario / decision tree", make() {
    const ps = pick([[0.2, 0.5, 0.3], [0.25, 0.5, 0.25], [0.3, 0.4, 0.3], [0.2, 0.3, 0.5]]);
    const npvs = [rstep(-200000, -20000, 10000), rstep(20000, 200000, 10000), rstep(150000, 450000, 10000)];
    const e = ps.reduce((s, p, i) => s + p * npvs[i], 0), names = ["Pessimistic", "Most likely", "Optimistic"];
    return { given: names.map((nm, i) => [nm + " (p = " + ps[i] + ")", rs(npvs[i])]), ask: "Find the expected NPV.", ans: e, kind: "rs", tol: 0.001, absTol: 1,
      hint: "Expected NPV = Σ probability × NPV",
      steps: [names.map((nm, i) => `${ps[i]} × ${n(npvs[i])}`).join(" + "), `= <b>${rs(e)}</b> → ${e > 0 ? "accept on expected value" : "reject on expected value"}`] };
  } });

  /* ---------------- Unit III ---------------- */
  add({ id: "ke-ddm", u: "u3", title: "Cost of equity — Gordon / DDM", desc: "K<sub>e</sub>", make() {
    const d0 = rstep(1, 12, 0.5), g = ri(3, 10) / 100, p = rstep(Math.round(d0 * 8), Math.round(d0 * 25), 1), d1 = d0 * (1 + g), ke = d1 / p + g;
    return { given: [["Dividend just paid (D₀)", "₹" + nf(d0, 2)], ["Growth (g)", P(g, 0)], ["Market price", "₹" + n(p)]], ask: "Find Kₑ (%).", ans: ke * 100, kind: "pct", tol: 0, absTol: 0.03,
      hint: "Grow D₀ to D₁ first: D₁ = D₀(1 + g). Then Kₑ = D₁/P₀ + g.",
      steps: [`D₁ = ${nf(d0, 2)} × ${1 + g} = ${nf(d1, 3)}`, M(`K_e = {${nf(d1, 3)}}/{${p}} + ${g} = ${nf(d1 / p, 4)} + ${g}`), `Kₑ = <b>${P(ke)}</b>`] };
  } });
  add({ id: "ke-capm", u: "u3", title: "Cost of equity — CAPM", desc: "K<sub>e</sub>", make() {
    const rf = ri(30, 75) / 1000, rm = rf + ri(40, 90) / 1000, b = ri(50, 190) / 100, ke = rf + b * (rm - rf);
    return { given: [["Risk-free rate", P(rf, 1)], ["Market return", P(rm, 1)], ["Beta", nf(b, 2)]], ask: "Find Kₑ (%).", ans: ke * 100, kind: "pct", tol: 0, absTol: 0.02,
      hint: "Kₑ = Rf + β(Rm − Rf)", steps: [`Premium = ${P(rm, 1)} − ${P(rf, 1)} = ${P(rm - rf, 1)}`, `Kₑ = ${P(rf, 1)} + ${nf(b, 2)} × ${P(rm - rf, 1)} = <b>${P(ke)}</b>`] };
  } });
  add({ id: "kd-perp", u: "u3", title: "Cost of perpetual debt", desc: "K<sub>d</sub>", make() {
    const cp = ri(8, 14) / 100, t = pick([0.25, 0.3, 0.35, 0.4]), issue = pick([["par", 100], ["5% discount", 95], ["10% discount", 90], ["5% premium", 105], ["10% premium", 110]]), fl = pick([0, 0, 2, 3]);
    const np = issue[1] - fl, kd = cp * 100 * (1 - t) / np;
    return { given: [["Coupon", P(cp, 0) + " on ₹100"], ["Issued at", issue[0]], ["Flotation cost", "₹" + fl + " per debenture"], ["Tax", P(t, 0)]], ask: "Find after-tax Kd (%).", ans: kd * 100, kind: "pct", tol: 0, absTol: 0.02,
      hint: "Kd = I(1 − T)/NP", steps: [`I(1 − T) = ${nf(cp * 100, 0)} × ${1 - t} = ${nf(cp * 100 * (1 - t), 2)}`, `NP = ${issue[1]} − ${fl} = ${np}`, `Kd = ${nf(cp * 100 * (1 - t), 2)} ÷ ${np} = <b>${P(kd)}</b>`] };
  } });
  add({ id: "kd-red", u: "u3", title: "Cost of redeemable debt", desc: "K<sub>d</sub> (approx. YTM)", make() {
    const cp = ri(8, 14) / 100, t = pick([0.3, 0.35, 0.4]), rv = pick([100, 100, 105, 110]), np = rstep(90, 104, 0.5), yrs = pick([5, 7, 8, 10, 15]);
    const i1 = cp * 100 * (1 - t), kd = (i1 + (rv - np) / yrs) / ((rv + np) / 2);
    return { given: [["Face value / coupon", "₹100 / " + P(cp, 0)], ["Net proceeds", "₹" + nf(np, 2)], ["Redemption value", "₹" + rv], ["Years", yrs], ["Tax", P(t, 0)]], ask: "Find after-tax Kd (%).", ans: kd * 100, kind: "pct", tol: 0, absTol: 0.03,
      hint: "Kd = [I(1 − T) + (RV − NP)/n] ÷ [(RV + NP)/2]",
      steps: [M(`K_d = {${nf(i1, 2)} + (${rv} − ${nf(np, 2)})/${yrs}}/{(${rv} + ${nf(np, 2)})/2}`), `= ${nf(i1 + (rv - np) / yrs, 3)} ÷ ${nf((rv + np) / 2, 3)} = <b>${P(kd)}</b>`] };
  } });
  add({ id: "kp-red", u: "u3", title: "Cost of redeemable preference shares", desc: "K<sub>p</sub>", make() {
    const dp = ri(8, 14), rv = pick([100, 105, 110]), np = rstep(90, 102, 0.5), yrs = pick([5, 8, 10, 12, 15]), kp = (dp + (rv - np) / yrs) / ((rv + np) / 2);
    return { given: [["Dividend", dp + "% on ₹100"], ["Net proceeds", "₹" + nf(np, 2)], ["Redemption value", "₹" + rv], ["Years", yrs]], ask: "Find Kp (%).", ans: kp * 100, kind: "pct", tol: 0, absTol: 0.03,
      hint: "Same as redeemable debt, but no tax adjustment.", steps: [M(`K_p = {${dp} + (${rv} − ${nf(np, 2)})/${yrs}}/{(${rv} + ${nf(np, 2)})/2}`), `= <b>${P(kp)}</b>`] };
  } });
  add({ id: "wacc", u: "u3", title: "Weighted average cost of capital", desc: "WACC", make() {
    const E = rstep(200, 800, 50), D = rstep(100, 500, 50), Pp = pick([0, rstep(50, 200, 25)]), ke = ri(13, 20) / 100, kd = ri(8, 13) / 100, kp = ri(10, 14) / 100, t = pick([0.25, 0.3, 0.35]);
    const V = E + D + Pp, w = (E * ke + D * kd * (1 - t) + Pp * kp) / V;
    const given = [["Equity (₹ lakh) @ Kₑ", n(E) + " @ " + P(ke, 0)], ["Debt (₹ lakh) @ pre-tax Kd", n(D) + " @ " + P(kd, 0)], ["Tax", P(t, 0)]];
    if (Pp) given.splice(2, 0, ["Preference (₹ lakh) @ Kp", n(Pp) + " @ " + P(kp, 0)]);
    return { given, ask: "Find WACC (%).", ans: w * 100, kind: "pct", tol: 0, absTol: 0.03,
      hint: "Use after-tax cost of debt: Kd(1 − T). Weights = each source ÷ total.",
      steps: [`After-tax Kd = ${P(kd, 0)} × ${1 - t} = ${P(kd * (1 - t))}`, `Total V = ${n(V)}`, `WACC = (${n(E)}×${P(ke, 0)} + ${n(D)}×${P(kd * (1 - t))}${Pp ? ` + ${n(Pp)}×${P(kp, 0)}` : ""}) ÷ ${n(V)}`, `= <b>${P(w)}</b>`] };
  } });
  add({ id: "lev", u: "u3", title: "DOL, DFL and DCL", desc: "Leverage", make() {
    const s = rstep(500000, 3000000, 50000), vr = ri(40, 70) / 100, c = s * (1 - vr), fc = Math.round(c * ri(30, 65) / 100 / 1000) * 1000, ebit = c - fc, i = Math.round(ebit * ri(10, 55) / 100 / 1000) * 1000, ebt = ebit - i;
    const which = pick(["DOL", "DFL", "DCL"]), vals = { DOL: c / ebit, DFL: ebit / ebt, DCL: c / ebt };
    return { given: [["Sales", rs(s)], ["Variable cost", P(vr, 0) + " of sales"], ["Fixed operating cost", rs(fc)], ["Interest", rs(i)]], ask: `Find ${which}.`, ans: vals[which], kind: "num", dp: 2, tol: 0.006,
      hint: "DOL = C/EBIT, DFL = EBIT/EBT, DCL = C/EBT",
      steps: [`Contribution = ${n(s)} × ${nf(1 - vr, 2)} = ${n(c)}`, `EBIT = ${n(c)} − ${n(fc)} = ${n(ebit)}; EBT = ${n(ebit)} − ${n(i)} = ${n(ebt)}`, `DOL = ${nf(vals.DOL, 3)}, DFL = ${nf(vals.DFL, 3)}, DCL = ${nf(vals.DCL, 3)}`, `<b>${which} = ${nf(vals[which], 2)}</b>`] };
  } });
  add({ id: "eps", u: "u3", title: "Earnings per share", desc: "EPS", make() {
    const ebit = rstep(300000, 2000000, 10000), debt = rstep(0, 1000000, 100000), ir = ri(8, 14) / 100, pref = pick([0, rstep(100000, 500000, 50000)]), pr = ri(9, 13) / 100, t = pick([0.3, 0.35, 0.4, 0.5]), sh = rstep(20000, 200000, 5000);
    const I = debt * ir, pd = pref * pr, e = ((ebit - I) * (1 - t) - pd) / sh;
    return { given: [["EBIT", rs(ebit)], ["Debt @ rate", rs(debt) + " @ " + P(ir, 0)], ["Preference @ rate", rs(pref) + " @ " + P(pr, 0)], ["Tax", P(t, 0)], ["Equity shares", n(sh)]], ask: "Find EPS (₹).", ans: e, kind: "num", dp: 2, tol: 0.004, absTol: 0.01,
      hint: "EPS = [(EBIT − I)(1 − T) − PD] ÷ N",
      steps: [`Interest = ${n(I)}; EBT = ${n(ebit - I)}`, `PAT = ${n((ebit - I) * (1 - t))}; less pref. dividend ${n(pd)} = ${n((ebit - I) * (1 - t) - pd)}`, `EPS = ÷ ${n(sh)} = <b>₹${nf(e, 2)}</b>`] };
  } });
  add({ id: "indiff", u: "u3", title: "EBIT–EPS indifference point", desc: "Debt vs equity", make() {
    const need = rstep(2000000, 10000000, 500000), price = pick([10, 20, 25, 40, 50]), exist = rstep(100000, 800000, 50000), ir = ri(9, 14) / 100, t = pick([0.3, 0.4, 0.5]);
    const n1 = exist + need / price, n2 = exist, I2 = need * ir, x = (I2 * n1) / (n1 - n2);
    return { given: [["Funds needed", rs(need)], ["Existing shares", n(exist)], ["Plan A", "Equity at ₹" + price + " per share"], ["Plan B", "Debt at " + P(ir, 0)], ["Tax", P(t, 0)]], ask: "Find the indifference EBIT.", ans: x, kind: "rs", tol: 0.003,
      hint: "Set EPS(A) = EPS(B): X(1−T)/N₁ = (X − I)(1−T)/N₂. Tax cancels.",
      steps: [`Plan A shares = ${n(exist)} + ${n(need)}/${price} = ${n(n1)}; Plan B shares = ${n(n2)}; interest = ${n(I2)}`, M(`{X}/{${n(n1)}} = {X − ${n(I2)}}/{${n(n2)}}`), `X × ${n(n2)} = (X − ${n(I2)}) × ${n(n1)} → X = ${n(I2)} × ${n(n1)} ÷ ${n(n1 - n2)}`, `<b>X = ${rs(x)}</b>`] };
  } });
  add({ id: "fbep", u: "u3", title: "Financial break-even point", desc: "FBEP", make() {
    const I = rstep(50000, 500000, 10000), pd = pick([0, rstep(20000, 200000, 10000)]), t = pick([0.3, 0.4, 0.5]), f = I + pd / (1 - t);
    return { given: [["Interest", rs(I)], ["Preference dividend", rs(pd)], ["Tax", P(t, 0)]], ask: "Find the financial break-even EBIT.", ans: f, kind: "rs", tol: 0.002,
      hint: "FBEP = I + PD/(1 − T)", steps: [`PD grossed up = ${n(pd)} ÷ ${1 - t} = ${n(pd / (1 - t))}`, `FBEP = ${n(I)} + ${n(pd / (1 - t))} = <b>${rs(f)}</b>`] };
  } });
  add({ id: "mmtax", u: "u3", title: "MM with tax: value of levered firm", desc: "V_L = V_U + TD", make() {
    const ebit = rstep(200000, 2000000, 50000), ku = ri(10, 18) / 100, t = pick([0.25, 0.3, 0.35, 0.4]), d = rstep(500000, 5000000, 100000), vu = ebit * (1 - t) / ku, vl = vu + t * d;
    return { given: [["EBIT", rs(ebit)], ["Kᵤ (unlevered)", P(ku, 0)], ["Tax", P(t, 0)], ["Debt of levered firm", rs(d)]], ask: "Find the value of the levered firm.", ans: vl, kind: "rs", tol: 0.003,
      hint: "Vᵤ = EBIT(1 − T)/Kᵤ, then add T × D.", steps: [`Vᵤ = ${n(ebit)} × ${1 - t} ÷ ${ku} = ${n(vu)}`, `Tax shield = ${t} × ${n(d)} = ${n(t * d)}`, `V<sub>L</sub> = <b>${rs(vl)}</b>`] };
  } });
  add({ id: "noi", u: "u3", title: "NOI approach: cost of equity", desc: "Capital structure theory", make() {
    const ebit = rstep(100000, 1000000, 10000), ko = ri(10, 16) / 100, V = ebit / ko, d = Math.round(V * ri(20, 60) / 100 / 10000) * 10000, kd = ri(7, Math.round(ko * 100) - 2) / 100, E = V - d, ke = (ebit - kd * d) / E;
    return { given: [["EBIT", rs(ebit)], ["Overall capitalisation rate Kₒ", P(ko, 0)], ["Debt", rs(d) + " @ " + P(kd, 0)]], ask: "Find Kₑ under the NOI approach (%).", ans: ke * 100, kind: "pct", tol: 0, absTol: 0.03,
      hint: "V = EBIT/Kₒ; E = V − D; Kₑ = (EBIT − I)/E", steps: [`V = ${n(ebit)} ÷ ${ko} = ${n(V)}`, `E = ${n(V)} − ${n(d)} = ${n(E)}`, `Kₑ = (${n(ebit)} − ${n(kd * d)}) ÷ ${n(E)} = <b>${P(ke)}</b>`] };
  } });

  /* ---------------- Unit IV ---------------- */
  add({ id: "walter", u: "u4", title: "Walter's model: share price", desc: "Walter", make() {
    const e = rstep(4, 20, 1), k = ri(8, 15) / 100, r = pick([k + ri(2, 8) / 100, k, k - ri(2, 4) / 100]), pay = pick([0, 0.25, 0.4, 0.5, 0.6, 0.75, 1]), d = e * pay, p = (d + (r / k) * (e - d)) / k;
    return { given: [["EPS", "₹" + e], ["DPS", "₹" + nf(d, 2)], ["r", P(r, 0)], ["k", P(k, 0)]], ask: "Find the market price per share (₹).", ans: p, kind: "num", dp: 2, tol: 0.003,
      hint: "P = [D + (r/k)(E − D)] / k",
      steps: [M(`P = {${nf(d, 2)} + (${r.toFixed(2)}/${k.toFixed(2)})(${e} − ${nf(d, 2)})}/{${k.toFixed(2)}}`), `= <b>₹${nf(p, 2)}</b>`, r > k ? "r > k: price would be maximised at 0% payout." : r < k ? "r < k: price would be maximised at 100% payout." : "r = k: price is the same at any payout."] };
  } });
  add({ id: "gordon", u: "u4", title: "Gordon's model: share price", desc: "Gordon", make() {
    const e = rstep(5, 20, 1), k = ri(11, 16) / 100, b = pick([0.2, 0.3, 0.4, 0.5, 0.6]), rmax = Math.floor((k - 0.01) / b * 100);
    const r = ri(6, Math.min(rmax, 20)) / 100, g = b * r, p = e * (1 - b) / (k - g);
    return { given: [["EPS (E₁)", "₹" + e], ["Retention ratio b", b], ["Return r", P(r, 0)], ["k", P(k, 0)]], ask: "Find the share price (₹).", ans: p, kind: "num", dp: 2, tol: 0.003,
      hint: "g = b × r; P₀ = E₁(1 − b)/(k − g)",
      steps: [`g = ${b} × ${P(r, 0)} = ${P(g)}`, `D₁ = ${e} × ${nf(1 - b, 1)} = ${nf(e * (1 - b), 2)}`, `P₀ = ${nf(e * (1 - b), 2)} ÷ (${nf(k, 2)} − ${nf(g, 4)}) = <b>₹${nf(p, 2)}</b>`] };
  } });
  add({ id: "mm-div", u: "u4", title: "MM: price and new shares", desc: "Dividend irrelevance", make() {
    const p0 = rstep(50, 200, 10), ke = ri(8, 15) / 100, d = rstep(2, 12, 1), nsh = rstep(50000, 500000, 50000), E = Math.round(nsh * p0 * ri(5, 12) / 100 / 10000) * 10000, I = Math.round(E * ri(12, 25) / 10 / 10000) * 10000;
    const p1 = p0 * (1 + ke) - d, dn = (I - (E - nsh * d)) / p1;
    return { given: [["Shares", n(nsh)], ["P₀", "₹" + p0], ["Kₑ", P(ke, 0)], ["Dividend D₁", "₹" + d], ["Net income", rs(E)], ["Investment", rs(I)]], ask: "How many new shares must be issued if the dividend is paid?", ans: dn, kind: "units", dp: 0, tol: 0.003, absTol: 2,
      hint: "P₁ = P₀(1 + Kₑ) − D₁; Δn = [I − (E − nD₁)] / P₁",
      steps: [`P₁ = ${p0} × ${1 + ke} − ${d} = ${nf(p1, 2)}`, `Retained = ${n(E)} − ${n(nsh * d)} = ${n(E - nsh * d)}`, `Funds needed = ${n(I)} − ${n(E - nsh * d)} = ${n(I - (E - nsh * d))}`, `Δn = ÷ ${nf(p1, 2)} = <b>${n(dn, 0)} shares</b>`] };
  } });
  add({ id: "bonus", u: "u4", title: "Ex-bonus / ex-split price", desc: "Bonus & split", make() {
    if (Math.random() < 0.5) {
      const p = rstep(200, 2000, 50), [a, b] = pick([[1, 1], [1, 2], [2, 1], [1, 3], [3, 2], [1, 4]]), x = p * b / (a + b);
      return { given: [["Cum-bonus price", "₹" + n(p)], ["Bonus ratio", a + ":" + b + " (" + a + " new for every " + b + " held)"]], ask: "Find the theoretical ex-bonus price (₹).", ans: x, kind: "num", dp: 2, tol: 0.002,
        hint: "Value of old holding ÷ new number of shares", steps: [`${b} shares × ₹${n(p)} = ₹${n(p * b)} now spread over ${a + b} shares`, `Ex-bonus price = <b>₹${nf(x, 2)}</b>`] };
    }
    const p = rstep(300, 5000, 50), [fv, nfv] = pick([[10, 2], [10, 5], [10, 1], [5, 1], [2, 1]]), x = p * nfv / fv;
    return { given: [["Price", "₹" + n(p)], ["Split", "₹" + fv + " face value → ₹" + nfv]], ask: "Find the theoretical price after the split (₹).", ans: x, kind: "num", dp: 2, tol: 0.002,
      hint: "Each old share becomes FV_old/FV_new shares.", steps: [`1 share → ${fv / nfv} shares`, `Price = ${n(p)} ÷ ${fv / nfv} = <b>₹${nf(x, 2)}</b>`] };
  } });
  add({ id: "payout", u: "u4", title: "Ke from dividend data & payout", desc: "DPR, retention, g", make() {
    const eps = rstep(4, 30, 1), pay = pick([0.3, 0.4, 0.5, 0.6]), r = ri(10, 20) / 100, p = rstep(eps * 6, eps * 15, 1), b = 1 - pay, g = b * r, d1 = eps * pay * (1 + g), ke = d1 / p + g;
    return { given: [["EPS (just reported)", "₹" + eps], ["Payout ratio", P(pay, 0)], ["Return on reinvestment r", P(r, 0)], ["Market price", "₹" + p]], ask: "Find Kₑ (%) using g = b × r.", ans: ke * 100, kind: "pct", tol: 0, absTol: 0.04,
      hint: "D₀ = EPS × payout; g = (1 − payout) × r; D₁ = D₀(1 + g)",
      steps: [`D₀ = ${eps} × ${pay} = ${nf(eps * pay, 2)}; b = ${nf(b, 2)}; g = ${nf(b, 2)} × ${P(r, 0)} = ${P(g)}`, `D₁ = ${nf(d1, 3)}`, `Kₑ = ${nf(d1, 3)}/${p} + ${P(g)} = <b>${P(ke)}</b>`] };
  } });

  /* ---------------- Unit V ---------------- */
  add({ id: "cycle", u: "u5", title: "Net operating cycle", desc: "Operating cycle", make() {
    const rm = ri(15, 60), wip = ri(5, 30), fg = ri(10, 45), dc = ri(20, 90), cp = ri(15, 60), noc = rm + wip + fg + dc - cp;
    return { given: [["RMCP", rm + " days"], ["WIPCP", wip + " days"], ["FGCP", fg + " days"], ["Debtors period", dc + " days"], ["Creditors period", cp + " days"]], ask: "Find the net operating cycle (days).", ans: noc, kind: "days", dp: 0, tol: 0, absTol: 0.01,
      hint: "NOC = RMCP + WIPCP + FGCP + DCP − CPDP", steps: [`GOC = ${rm} + ${wip} + ${fg} + ${dc} = ${noc + cp}`, `NOC = ${noc + cp} − ${cp} = <b>${noc} days</b>`] };
  } });
  add({ id: "rmcp", u: "u5", title: "Conversion period from balances", desc: "Operating cycle", make() {
    const kind = pick(["RMCP", "DCP"]), annual = rstep(1200000, 12000000, 100000), avg = Math.round(annual * ri(5, 25) / 100 / 1000) * 1000, d = avg / (annual / 365);
    const lab = kind === "RMCP" ? ["Average raw material stock", "Annual raw material consumed"] : ["Average debtors", "Annual credit sales"];
    return { given: [[lab[0], rs(avg)], [lab[1], rs(annual)], ["Days in year", 365]], ask: `Find ${kind} (days).`, ans: d, kind: "days", dp: 1, tol: 0.005,
      hint: "Average balance ÷ (annual flow ÷ 365)", steps: [`Per day = ${n(annual)} ÷ 365 = ${n(annual / 365, 2)}`, `${kind} = ${n(avg)} ÷ ${n(annual / 365, 2)} = <b>${nf(d, 1)} days</b>`] };
  } });
  add({ id: "eoq", u: "u5", title: "Economic order quantity", desc: "Inventory", make() {
    let A, O, C, q; do { A = rstep(2000, 60000, 1000); O = rstep(50, 600, 10); C = rstep(1, 20, 0.5); q = Math.sqrt(2 * A * O / C); } while (q < 50);
    return { given: [["Annual demand", n(A) + " units"], ["Ordering cost", "₹" + n(O) + " per order"], ["Carrying cost", "₹" + nf(C, 2) + " per unit p.a."]], ask: "Find EOQ (units).", ans: q, kind: "units", dp: 0, tol: 0.005,
      hint: "EOQ = √(2AO/C)", steps: [M(`EOQ = √{2 × ${n(A)} × ${n(O)} / ${nf(C, 2)}}`), `= √${n(2 * A * O / C, 0)} = <b>${n(q, 0)} units</b>`, `Orders per year ≈ ${nf(A / q, 1)}; total cost ≈ ₹${n(A / q * O + q / 2 * C, 0)}`] };
  } });
  add({ id: "rol", u: "u5", title: "Reorder level", desc: "Inventory", make() {
    const u = ri(20, 300), lt = ri(4, 20), ss = rstep(0, 1000, 50), rol = u * lt + ss;
    return { given: [["Average daily usage", n(u) + " units"], ["Lead time", lt + " days"], ["Safety stock", n(ss) + " units"]], ask: "Find the reorder level (units).", ans: rol, kind: "units", dp: 0, tol: 0, absTol: 0.5,
      hint: "ROL = usage × lead time + safety stock", steps: [`${u} × ${lt} + ${ss} = <b>${n(rol)} units</b>`] };
  } });
  add({ id: "discount", u: "u5", title: "Cost of forgoing a cash discount", desc: "Trade credit", make() {
    const d = pick([1, 1.5, 2, 2.5, 3]) / 100, dd = pick([7, 10, 15]), cd = pick([30, 45, 60]), c = d / (1 - d) * 365 / (cd - dd);
    return { given: [["Terms", `${d * 100}/${dd}, net ${cd}`]], ask: "Find the annualised cost of not taking the discount (%).", ans: c * 100, kind: "pct", tol: 0, absTol: 0.1,
      hint: "d/(1 − d) × 365/(credit days − discount days)", steps: [M(`{${d}}/{${nf(1 - d, 3)}} × {365}/{${cd} − ${dd}}`), `= <b>${P(c)}</b> — compare with the cost of a bank loan.`] };
  } });
  add({ id: "baumol", u: "u5", title: "Baumol optimal cash balance", desc: "Cash management", make() {
    const T = rstep(500000, 10000000, 100000), b = rstep(50, 500, 10), i = ri(5, 12) / 100, c = Math.sqrt(2 * T * b / i);
    return { given: [["Annual cash requirement", rs(T)], ["Cost per conversion", "₹" + b], ["Interest on securities", P(i, 0)]], ask: "Find the optimal cash conversion size (₹).", ans: c, kind: "rs", tol: 0.005,
      hint: "C* = √(2Tb/i)", steps: [M(`C^* = √{2 × ${n(T)} × ${b} / ${i}}`), `= <b>${rs(c)}</b>`] };
  } });
  add({ id: "credit", u: "u5", title: "Should the firm relax credit?", desc: "Receivables", make() {
    const s = rstep(1000000, 10000000, 100000), inc = Math.round(s * ri(10, 30) / 100 / 10000) * 10000, vc = ri(60, 80) / 100, d0 = pick([30, 45]), d1 = d0 + pick([15, 30]), bd = ri(2, 8) / 100, k = ri(10, 20) / 100;
    const contrib = inc * (1 - vc), bad = inc * bd, inv0 = s * vc * d0 / 360, inv1 = (s + inc) * vc * d1 / 360, cost = (inv1 - inv0) * k, net = contrib - bad - cost;
    return { given: [["Current sales", rs(s)], ["Extra sales", rs(inc)], ["Variable cost", P(vc, 0)], ["Collection period", d0 + " → " + d1 + " days"], ["Bad debts on extra sales", P(bd, 0)], ["Cost of funds", P(k, 0)], ["Year", "360 days"]], ask: "Find the net benefit of relaxing credit (₹; negative if a loss).", ans: net, kind: "rs", tol: 0.005, absTol: 50,
      hint: "Extra contribution − extra bad debts − k × extra investment in debtors (at cost)",
      steps: [`Extra contribution = ${n(inc)} × ${nf(1 - vc, 2)} = ${n(contrib)}`, `Extra bad debts = ${n(bad)}`, `Debtors at cost: ${n(inv0)} → ${n(inv1)}; extra ${n(inv1 - inv0)} × ${P(k, 0)} = ${n(cost)}`, `Net benefit = <b>${rs(net)}</b> → ${net > 0 ? "relax credit" : "don't relax"}`] };
  } });

  CF.gens = G;
  CF.genById = (id) => G.find((g) => g.id === id);
})();
