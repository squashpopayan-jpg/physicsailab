/* Capítulo 4 — Pozos, barreras y efecto túnel */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M;
  const f3 = (v) => CQ.fix(v, 3), f4 = (v) => CQ.fix(v, 4);
  const HB2M = 3.80998; /* ħ²/2mₑ en eV·Å² */
  const HBAR = 0.6582119569; /* eV·fs */

  /* ======================================================================
     4.1 Pozo infinito
     ====================================================================== */
  CQ.defineSim('pozo-infinito', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.group('Caja (electrón)');
    sim.slider('L', { label: 'Ancho <i>L</i>', min: 0.3, max: 3, value: 1, step: 0.01, unit: 'nm', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('n', { label: 'Estado resaltado <i>n</i>', min: 1, max: 6, value: 2, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.group('Vista');
    sim.seg('mode', { label: 'Mostrar', options: [['psi', 'ψ'], ['prob', '|ψ|²'], ['sup', 'Superposición']], value: 'psi' });
    sim.slider('c2', { label: 'Peso de ψ₂ en la superposición', min: 0, max: 1, value: 0.5, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.out('E1', '<i>E</i><sub>1</sub> (punto cero)');
    sim.out('En', '<i>E</i><sub>n</sub> resaltado', { hl: true });
    sim.out('lam', 'Longitud de onda 2<i>L</i>/<i>n</i>');
    sim.out('xm', '⟨<i>x</i>⟩/<i>L</i> (superposición)');
    sim.out('T', 'Periodo <i>h</i>/(<i>E</i><sub>2</sub> − <i>E</i><sub>1</sub>)');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onChange = () => { sim.ctl.c2.show(sim.p.mode === 'sup'); };
    sim.ctl.c2.show(false);
    sim.onDraw(() => {
      const Lnm = sim.p.L, LA = Lnm * 10;
      const E = (n) => (HB2M * n * n * Math.PI * Math.PI) / (LA * LA);
      const nmax = 6, Emax = E(nmax) * 1.12;
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.25, xmax: 1.25, ymin: -0.04 * Emax, ymax: Emax, xlabel: 'x / L', ylabel: 'energía (eV)', ml: 60 });
      pl.frame();
      pl.band(-0.25, 0, { color: '--ink-3', alpha: 0.18 }); pl.band(1, 1.25, { color: '--ink-3', alpha: 0.18 });
      pl.vline(0, { color: '--ink-2', dash: [] }); pl.vline(1, { color: '--ink-2', dash: [] });
      const amp = E(1) * 1.3;
      if (sim.p.mode !== 'sup') {
        for (let n = 1; n <= nmax; n++) {
          const on = n === sim.p.n;
          CQ.drawLevels(pl, [{ E: E(n), color: on ? '--accent' : '--ink-3', width: on ? 1.8 : 1, dash: [4, 3], x0: 0, x1: 1 }]);
          const f = sim.p.mode === 'psi' ? (x) => Math.SQRT2 * Math.sin(n * Math.PI * x) : (x) => 2 * Math.sin(n * Math.PI * x) ** 2 * 0.7;
          pl.fn((x) => (x >= 0 && x <= 1 ? E(n) + amp * 0.5 * f(x) : NaN), { color: on ? '--accent' : '--c1', width: on ? 2.4 : 1.4, from: 0, to: 1, n: 300, fill: sim.p.mode === 'prob' ? (on ? '--accent' : '--c1') : null, base: E(n), fillAlpha: 0.15 });
          pl.label(1.03, E(n), `n = ${n}`, { color: on ? '--accent' : '--ink-3', size: 11.5, baseline: 'middle' });
        }
      } else {
        const a2 = sim.p.c2, a1 = Math.sqrt(1 - a2);
        const b2 = Math.sqrt(a2);
        /* la fase relativa (E₂ − E₁)t/ħ avanza 1.2 ciclos por segundo de animación */
        const phase = t * 1.2 * 2 * Math.PI;
        const dens = (x) => { const p1 = a1 * Math.SQRT2 * Math.sin(Math.PI * x), p2 = b2 * Math.SQRT2 * Math.sin(2 * Math.PI * x); return p1 * p1 + p2 * p2 + 2 * p1 * p2 * Math.cos(phase); };
        const Em = a1 * a1 * E(1) + b2 * b2 * E(2);
        CQ.drawLevels(pl, [{ E: E(1), color: '--ink-3', dash: [4, 3], x0: 0, x1: 1, label: 'E₁' }, { E: E(2), color: '--ink-3', dash: [4, 3], x0: 0, x1: 1, label: 'E₂' }]);
        pl.fn((x) => (x >= 0 && x <= 1 ? Em + amp * 0.35 * dens(x) : NaN), { color: '--prob', width: 2.4, from: 0, to: 1, n: 300, fill: '--prob', base: Em, fillAlpha: 0.2 });
        const xm = 0.5 - (16 / (9 * Math.PI * Math.PI)) * 2 * a1 * b2 * Math.cos(phase);
        pl.vline(xm, { color: '--accent', label: '⟨x⟩' });
        sim.set('xm', f3(xm));
      }
      if (sim.p.mode !== 'sup') sim.set('xm', '—');
      sim.set('E1', f3(E(1)) + ' eV');
      sim.set('En', f3(E(sim.p.n)) + ' eV');
      sim.set('lam', CQ.fix((2 * Lnm) / sim.p.n, 3) + ' nm');
      sim.set('T', CQ.fix((2 * Math.PI * HBAR) / (E(2) - E(1)), 3) + ' fs');
    });
  });

  /* ======================================================================
     4.2 Pozo finito
     ====================================================================== */
  CQ.defineSim('pozo-finito', function (sim) {
    sim.cols2();
    const cg = sim.canvas({ aspect: 1 });
    const cw = sim.canvas({ aspect: 1 });
    sim.group('Pozo (electrón)');
    sim.slider('V0', { label: 'Profundidad <i>V</i><sub>0</sub>', min: 0.2, max: 20, value: 5, step: 0.1, unit: 'eV', fmt: (v) => CQ.fix(v, 1) });
    sim.slider('L', { label: 'Ancho <i>L</i>', min: 1, max: 15, value: 6, step: 0.1, unit: 'Å', fmt: (v) => CQ.fix(v, 1) });
    sim.check('num', { label: 'Comparar con diferencias finitas', value: true });
    sim.out('z0', '<i>z</i><sub>0</sub> = (<i>L</i>/2)√(2<i>mV</i><sub>0</sub>)/ħ');
    sim.out('nb', 'Estados ligados ⌈2<i>z</i><sub>0</sub>/π⌉', { hl: true });
    sim.outSep();
    for (let k = 0; k < 5; k++) sim.out('e' + k, `<i>E</i><sub>${k + 1}</sub> (gráfica / numérica)`);
    sim.out('pen', 'Penetración 1/κ del fundamental');
    sim.onDraw(() => {
      const V0 = sim.p.V0, L = sim.p.L;
      /* en unidades de Å y eV: m/ħ² = 1/(2·HB2M) */
      const m = 1 / (2 * HB2M);
      const r = P.q1d.exact.finiteWell(V0, L, m, 1);
      const z0 = r.z0;
      /* gráfica */
      CQ.draw.clear(cg);
      const zmax = Math.max(z0 * 1.15, 2);
      const pg = new CQ.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: zmax, ymin: 0, ymax: Math.max(z0 * 1.4, 4), xlabel: 'z = ka', ylabel: '' });
      pg.frame();
      pg.fn((z) => Math.sqrt(Math.max(0, z0 * z0 - z * z)) / z, { color: '--ink', width: 2.2, from: 0.02, to: z0, n: 400 });
      pg.fn((z) => Math.tan(z), { color: '--c1', width: 1.8, breakJumps: true, n: 900, from: 0.001 });
      pg.fn((z) => -1 / Math.tan(z), { color: '--c2', width: 1.8, breakJumps: true, n: 900, from: 0.001 });
      r.states.forEach((s) => pg.dot(s.z, Math.sqrt(Math.max(0, z0 * z0 - s.z * s.z)) / s.z, { color: s.parity === 'par' ? '--c1' : '--c2', r: 5 }));
      pg.legend([{ label: '√(z₀² − z²)/z', color: '--ink' }, { label: 'tan z (pares)', color: '--c1' }, { label: '−cot z (impares)', color: '--c2' }]);
      /* funciones de onda */
      CQ.draw.clear(cw);
      const X = L * 1.8;
      const pw = new CQ.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: -X, xmax: X, ymin: -V0 * 1.08, ymax: V0 * 0.25, xlabel: 'x (Å)', ylabel: 'E (eV)' });
      pw.frame();
      pw.fn((x) => (Math.abs(x) < L / 2 ? -V0 : 0), { color: '--ink-2', width: 2, n: 800 });
      const amp = V0 / Math.max(3, r.states.length + 1) * 0.8;
      let num = null;
      if (sim.p.num && r.states.length) {
        /* el dominio numérico se extiende ~9 longitudes de penetración del estado menos ligado */
        const kl = r.states[Math.min(4, r.states.length - 1)].kappa;
        const b = Math.min(250, L / 2 + 9 / Math.max(kl, 1e-3)), N = 3000;
        num = P.q1d.fdEigen((x) => (Math.abs(x) < L / 2 ? -V0 : Math.abs(Math.abs(x) - L / 2) < 1e-12 ? -V0 / 2 : 0), -b, b, N, Math.min(5, r.states.length), { mass: m, hbar: 1 });
      }
      r.states.forEach((s, k) => {
        const col = s.parity === 'par' ? '--c1' : '--c2';
        CQ.drawLevels(pw, [{ E: s.E, color: col, dash: [4, 3], width: 1 }]);
        const nrm = Math.abs(P.q1d.exact.finiteWellPsi(s, V0, L, 0)) || Math.abs(P.q1d.exact.finiteWellPsi(s, V0, L, L / 4));
        pw.fn((x) => s.E + (amp * P.q1d.exact.finiteWellPsi(s, V0, L, x)) / Math.max(nrm, 1e-9) * 0.5, { color: col, width: 2, n: 500 });
      });
      pw.band(-X, -L / 2, { color: '--warn-ink', alpha: 0.05 }); pw.band(L / 2, X, { color: '--warn-ink', alpha: 0.05 });
      sim.set('z0', f3(z0));
      sim.set('nb', String(r.nBound));
      for (let k = 0; k < 5; k++) {
        const s = r.states[k];
        sim._outs['e' + k].show(!!s);
        if (s) sim.set('e' + k, `${f3(s.E)} / ${num && num.E[k] !== undefined ? f3(num.E[k]) : '—'} eV`);
      }
      sim.set('pen', r.states.length ? CQ.fix(1 / r.states[0].kappa, 3) + ' Å' : '—');
    });
  });

  /* ======================================================================
     4.3 Barrera: T(E) y función de onda estacionaria
     ====================================================================== */
  /* Resuelve la dispersión en potenciales constantes a trozos (electrón; x en Å, E en eV).
     Devuelve {T, R, psi(x) → [re, im]} normalizada a onda incidente de amplitud 1. */
  function scatter(E, regs) {
    const c = (re, im) => ({ re, im });
    const add = (a, b) => c(a.re + b.re, a.im + b.im), sub = (a, b) => c(a.re - b.re, a.im - b.im);
    const mul = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
    const div = (a, b) => { const q = b.re * b.re + b.im * b.im; return c((a.re * b.re + a.im * b.im) / q, (a.im * b.re - a.re * b.im) / q); };
    const cexp = (a) => { const r = Math.exp(a.re); return c(r * Math.cos(a.im), r * Math.sin(a.im)); };
    const kOf = (V) => { const v = (E - V) / HB2M; return v >= 0 ? c(Math.sqrt(v), 0) : c(0, Math.sqrt(-v)); };
    const layers = [{ V: 0 }].concat(regs).concat([{ V: 0 }]);
    const xs = regs.map((r) => r.x0).concat([regs[regs.length - 1].x1]);
    const ks = layers.map((l) => kOf(l.V));
    /* coeficientes (A,B) por capa, empezando por la derecha con (1, 0) */
    const coef = new Array(layers.length);
    coef[layers.length - 1] = [c(1, 0), c(0, 0)];
    for (let s = xs.length - 1; s >= 0; s--) {
      const x = xs[s], k1 = ks[s], k2 = ks[s + 1];
      const [A2, B2] = coef[s + 1];
      const e2p = cexp(mul(c(0, x), k2)), e2m = cexp(mul(c(0, -x), k2));
      const psi = add(mul(A2, e2p), mul(B2, e2m));
      const dpsi = mul(mul(c(0, 1), k2), sub(mul(A2, e2p), mul(B2, e2m)));
      /* A1 e^{ik1x} + B1 e^{−ik1x} = psi; ik1(A1 e − B1 e⁻) = dpsi */
      const e1p = cexp(mul(c(0, x), k1)), e1m = cexp(mul(c(0, -x), k1));
      const q = div(dpsi, mul(c(0, 1), k1));
      const A1 = div(mul(c(0.5, 0), add(psi, q)), e1p);
      const B1 = div(mul(c(0.5, 0), sub(psi, q)), e1m);
      coef[s] = [A1, B1];
    }
    const A0 = coef[0][0];
    for (const cc of coef) { cc[0] = div(cc[0], A0); cc[1] = div(cc[1], A0); }
    const tamp = coef[layers.length - 1][0], ramp = coef[0][1];
    const T = tamp.re ** 2 + tamp.im ** 2, R = ramp.re ** 2 + ramp.im ** 2;
    const psi = (x) => {
      let s = 0;
      while (s < xs.length && x >= xs[s]) s++;
      const [A, B] = coef[s], k = ks[s];
      const v = add(mul(A, cexp(mul(c(0, x), k))), mul(B, cexp(mul(c(0, -x), k))));
      return [v.re, v.im];
    };
    return { T, R, psi };
  }
  CQ.defineSim('barrera-tunel', function (sim) {
    const cw = sim.canvas({ aspect: 2.5 });
    const ct = sim.canvas({ aspect: 2.5 });
    sim.group('Electrón y barrera');
    sim.slider('E', { label: 'Energía del electrón <i>E</i>', min: 0.05, max: 10, value: 2, step: 0.01, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('V0', { label: 'Altura <i>V</i><sub>0</sub>', min: 0.5, max: 8, value: 4, step: 0.05, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('a', { label: 'Ancho <i>a</i>', min: 0.5, max: 12, value: 3, step: 0.1, unit: 'Å', fmt: (v) => CQ.fix(v, 1) });
    sim.seg('nb', { label: 'Barreras', options: [[1, 'Una'], [2, 'Dos (pozo de 6 Å)']], value: 1 });
    sim.check('log', { label: 'Escala logarítmica en T(E)', value: true });
    sim.out('T', 'Transmisión <i>T</i>', { hl: true });
    sim.out('R', 'Reflexión <i>R</i> y <i>R</i> + <i>T</i>');
    sim.out('Tf', 'Fórmula cerrada (una barrera)');
    sim.out('Ta', 'Aproximación 16(<i>E</i>/<i>V</i><sub>0</sub>)(1 − <i>E</i>/<i>V</i><sub>0</sub>)e<sup>−2κa</sup>');
    sim.out('k', 'κ y longitud 1/κ');
    const regsOf = () => {
      const a = sim.p.a, V0 = sim.p.V0;
      return +sim.p.nb === 2 ? [{ x0: 0, x1: a, V: V0 }, { x0: a, x1: a + 6, V: 0 }, { x0: a + 6, x1: 2 * a + 6, V: V0 }] : [{ x0: 0, x1: a, V: V0 }];
    };
    sim.onDraw(() => {
      const E = sim.p.E, V0 = sim.p.V0, a = sim.p.a;
      const regs = regsOf();
      const sc = scatter(E, regs);
      const xr = regs[regs.length - 1].x1;
      /* función de onda */
      CQ.draw.clear(cw);
      const X0 = -12, X1 = xr + 12;
      const pw = new CQ.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: X0, xmax: X1, ymin: -0.2 * V0, ymax: Math.max(V0, E) * 1.6, xlabel: 'x (Å)', ylabel: 'E (eV)', mb: 36 });
      pw.frame();
      pw.fn((x) => { for (const r of regs) if (x >= r.x0 && x < r.x1) return r.V; return 0; }, { color: '--ink-2', width: 2, n: 1200, fill: '--ink-3', fillAlpha: 0.12 });
      pw.hline(E, { color: '--accent', label: `E = ${CQ.fix(E, 2)} eV` });
      const scale = Math.max(V0, E) * 0.22;
      let pmax = 0;
      for (let q = 0; q <= 600; q++) { const x = X0 + ((X1 - X0) * q) / 600; const p = sc.psi(x); pmax = Math.max(pmax, p[0] * p[0] + p[1] * p[1]); }
      pw.fn((x) => E + (scale * sc.psi(x)[0]) / Math.sqrt(Math.max(pmax, 1)), { color: '--c1', width: 1.5, n: 1200 });
      pw.fn((x) => { const p = sc.psi(x); return E + (scale * (p[0] * p[0] + p[1] * p[1])) / Math.max(pmax, 1); }, { color: '--prob', width: 2.2, n: 1200 });
      pw.legend([{ label: 'Re ψ', color: '--c1' }, { label: '|ψ|²', color: '--prob' }], 'tl');
      /* T(E) */
      CQ.draw.clear(ct);
      const Emax = 10;
      const lg = sim.p.log;
      const pt = new CQ.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: 0.02, xmax: Emax, ymin: lg ? 1e-8 : 0, ymax: lg ? 2 : 1.05, ylog: lg, xlabel: 'E (eV)', ylabel: 'T(E)' });
      pt.frame();
      pt.fn((e) => scatter(e, regs).T, { color: '--c3', width: 2.2, n: +sim.p.nb === 2 ? 1400 : 500 });
      pt.vline(V0, { color: '--ink-3', label: 'V₀' });
      pt.dot(E, Math.max(sc.T, lg ? 1e-8 : 0), { color: '--accent' });
      const kap = E < V0 ? Math.sqrt((V0 - E) / HB2M) : NaN;
      const Tf = P.q1d.exact.barrierT(E, V0, a, 1 / (2 * HB2M), 1);
      sim.set('T', CQ.sci(sc.T, 4));
      sim.set('R', `${CQ.sci(sc.R, 4)} · ${CQ.fix(sc.R + sc.T, 10)}`);
      sim.set('Tf', +sim.p.nb === 1 ? CQ.sci(Tf, 4) : '—');
      sim.set('Ta', E < V0 && +sim.p.nb === 1 ? CQ.sci(16 * (E / V0) * (1 - E / V0) * Math.exp(-2 * kap * a), 3) : '—');
      sim.set('k', E < V0 ? `${f3(kap)} Å⁻¹ · ${f3(1 / kap)} Å` : 'E > V₀: oscila');
    });
  });

  /* ======================================================================
     4.4 Paquete contra una barrera (ħ = m = 1)
     ====================================================================== */
  CQ.defineSim('paquete-barrera', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.group('Paquete (ħ = m = 1)');
    sim.slider('k0', { label: 'Número de onda <i>k</i><sub>0</sub> (energía <i>k</i><sub>0</sub>²/2)', min: 0.8, max: 3, value: 1.8, step: 0.02, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('s0', { label: 'Anchura σ<sub>0</sub>', min: 1.5, max: 6, value: 3, step: 0.1, fmt: (v) => CQ.fix(v, 1) });
    sim.group('Barrera');
    sim.slider('V0', { label: 'Altura <i>V</i><sub>0</sub>', min: 0.5, max: 4, value: 2, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('a', { label: 'Ancho <i>a</i>', min: 0.2, max: 3, value: 1, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.out('t', 'Tiempo');
    sim.out('Tn', 'Probabilidad transmitida (numérica)', { hl: true });
    sim.out('Tav', '⟨<i>T</i>(<i>k</i>)⟩ sobre el paquete', { hl: true });
    sim.out('Tk0', '<i>T</i>(<i>k</i><sub>0</sub>)');
    const NX = 2401, x = P.util.linspace(-60, 60, NX), dt = 0.01;
    let cn, re, im, t = 0;
    const reset = () => {
      const V0 = sim.p.V0, a = sim.p.a;
      cn = new P.q1d.CrankNicolson(x, (xx) => (xx >= 0 && xx <= a ? V0 : 0), dt);
      [re, im] = P.q1d.gaussPacket(x, -25, sim.p.s0, sim.p.k0);
      t = 0;
    };
    reset();
    sim.resetButton(reset);
    sim.onChange = () => reset();
    sim.animate((ft) => {
      const steps = Math.min(8, Math.max(1, Math.round(ft / 0.006)));
      for (let s = 0; s < steps; s++) { [re, im] = cn.step(re, im); t += dt; }
      if (t > 40 / sim.p.k0 + 8) reset();
    });
    const Tavg = () => {
      /* |φ(k)|² gaussiana de anchura σ_k = 1/(2σ0) */
      const sk = 1 / (2 * sim.p.s0), k0 = sim.p.k0;
      let s = 0, w = 0;
      for (let q = -400; q <= 400; q++) { const k = k0 + (q / 400) * 6 * sk; if (k <= 0) continue; const g = Math.exp(-((k - k0) ** 2) / (2 * sk * sk)); s += g * P.q1d.exact.barrierT(k * k / 2, sim.p.V0, sim.p.a); w += g; }
      return s / w;
    };
    sim.onDraw(() => {
      CQ.draw.clear(cv);
      const peak = 1 / Math.sqrt(2 * Math.PI * sim.p.s0 * sim.p.s0);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -45, xmax: 45, ymin: 0, ymax: 1.4 * peak, xlabel: 'x', ylabel: '|ψ|² (color = fase)' });
      pl.frame();
      pl.fn((xx) => (xx >= 0 && xx <= sim.p.a ? 1.25 * peak * Math.min(1, sim.p.V0 / 4) : 0), { color: '--ink-3', width: 1.5, n: 1500, fill: '--ink-3', fillAlpha: 0.15 });
      pl.hline(1.25 * peak * (sim.p.k0 * sim.p.k0 / 2) / 4, { color: '--accent', label: 'E = k₀²/2 (misma escala que V₀)' });
      CQ.drawPhaseCurve(pl, x, re, im, { scale: 1 });
      let tr = 0;
      for (let i = 0; i < NX; i++) if (x[i] > sim.p.a) tr += re[i] * re[i] + im[i] * im[i];
      tr *= x[1] - x[0];
      sim.set('t', CQ.fix(t, 2));
      sim.set('Tn', f4(tr));
      sim.set('Tav', f4(Tavg()));
      sim.set('Tk0', f4(P.q1d.exact.barrierT(sim.p.k0 ** 2 / 2, sim.p.V0, sim.p.a)));
    });
  });
})();
