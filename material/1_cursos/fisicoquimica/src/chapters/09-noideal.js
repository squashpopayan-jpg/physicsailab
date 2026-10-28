/* Capítulo 9 — Disoluciones no ideales: actividad, exceso, azeótropos y separación de fases */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, R = FQ.R;

  /* 9.1 Modelos de energía de Gibbs de exceso */
  const MOD = {
    margules: ['Margules (tres sufijos)', 'A₁₂ = ln γ₁∞', 'A₂₁ = ln γ₂∞', null],
    vanlaar: ['Van Laar', 'A₁₂ = ln γ₁∞', 'A₂₁ = ln γ₂∞', null],
    wilson: ['Wilson', 'Λ₁₂', 'Λ₂₁', null],
    nrtl: ['NRTL', 'τ₁₂', 'τ₂₁', 'α']
  };
  EM.defineSim('modelos-exceso', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('m', { label: 'Modelo de G^E', options: Object.entries(MOD).map(([k, v]) => [k, v[0]]), value: 'margules' });
    sim.slider('a', { label: 'A₁₂', min: -2, max: 4, step: 0.01, value: 1.2, fmt: (v) => v.toFixed(2) });
    sim.slider('b', { label: 'A₂₁', min: -2, max: 4, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2) });
    sim.slider('c', { label: 'α', min: 0.1, max: 0.6, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.slider('x', { label: 'Composición de lectura x₁', min: 0.01, max: 0.99, step: 0.01, value: 0.4, fmt: (v) => v.toFixed(2) });
    sim.out('g', 'γ₁ · γ₂ en <i>x</i>₁', { hl: true });
    sim.out('inf', 'Dilución infinita: γ₁∞ · γ₂∞');
    sim.out('GE', '<i>G</i><sup>E</sup>/<i>RT</i> · <i>G</i><sup>E</sup> a 300 K');
    sim.out('gd', 'Residuo de Gibbs–Duhem <i>x</i>₁ d ln γ₁/d<i>x</i>₁ + <i>x</i>₂ d ln γ₂/d<i>x</i>₁');
    sim.out('az', 'Tipo de desviación (signo de <i>G</i><sup>E</sup>)');
    const fn = (p) => (x) => {
      switch (p.m) {
        case 'margules': return FQ.act.margules(p.a, p.b, x);
        case 'vanlaar': return FQ.act.vanlaar(p.a, p.b, x);
        case 'wilson': return FQ.act.wilson(Math.max(0.02, p.a + 1), Math.max(0.02, p.b + 1), x);
        default: return FQ.act.nrtl(p.a, p.b, p.c, x);
      }
    };
    sim.onChange = (id) => {
      if (id === 'm') {
        const m = sim.p.m, d = MOD[m];
        sim.ctl.a.label(m === 'wilson' ? 'Λ₁₂ − 1' : d[1]); sim.ctl.b.label(m === 'wilson' ? 'Λ₂₁ − 1' : d[2]); sim.ctl.c.show(m === 'nrtl');
        if (m === 'wilson') { sim.ctl.a.set(-0.4, true); sim.ctl.b.set(-0.2, true); } else if (m === 'nrtl') { sim.ctl.a.set(0.3, true); sim.ctl.b.set(0.9, true); } else { sim.ctl.a.set(1.2, true); sim.ctl.b.set(0.8, true); }
      }
    };
    sim.ctl.c.show(false);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, f = fn(p);
      EM.draw.clear(cv);
      const xs = [], l1 = [], l2 = [], ge = [];
      for (let i = 1; i < 100; i++) { const x = i / 100, l = f(x); xs.push(x); l1.push(l[0]); l2.push(l[1]); ge.push(FQ.gEoverRT(l, x)); }
      const all = l1.concat(l2, ge); const lo = Math.min(...all, 0), hi = Math.max(...all, 0.1);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: lo - 0.1, ymax: hi + 0.15, xlabel: 'x₁', ylabel: 'ln γ y G^E/RT', ml: 52 });
      pl.frame();
      pl.xy(xs, l1, { color: '--c1', width: 2.4 }); pl.xy(xs, l2, { color: '--c2', width: 2.4 }); pl.xy(xs, ge, { color: '--c3', width: 2, dash: [6, 4] });
      pl.vline(p.x, { color: '--accent' });
      const l = f(p.x); pl.dot(p.x, l[0], { color: '--c1' }); pl.dot(p.x, l[1], { color: '--c2' });
      pl.legend([{ label: 'ln γ₁', color: '--c1' }, { label: 'ln γ₂', color: '--c2' }, { label: 'G^E/RT', color: '--c3', dash: [6, 4] }], 'tr');
      const i1 = f(1e-6), i2 = f(1 - 1e-6), h = 1e-5, a = f(p.x + h), b = f(p.x - h);
      sim.set('g', EM.fix(Math.exp(l[0]), 3) + ' · ' + EM.fix(Math.exp(l[1]), 3));
      sim.set('inf', EM.fix(Math.exp(i1[0]), 3) + ' · ' + EM.fix(Math.exp(i2[1]), 3));
      const g = FQ.gEoverRT(l, p.x); sim.set('GE', EM.fix(g, 4) + ' · ' + EM.fix((g * R * 300) / 1e3 * 1000, 0) + ' J/mol');
      sim.set('gd', EM.sci(p.x * (a[0] - b[0]) / (2 * h) + (1 - p.x) * (a[1] - b[1]) / (2 * h), 1) + ' (cero: los modelos satisfacen Gibbs–Duhem)');
      sim.set('az', (g > 0.001 ? 'positiva (G^E > 0): presión de vapor mayor que la ideal' : g < -0.001 ? 'negativa (G^E < 0): presión menor que la ideal' : 'casi ideal'));
    });
  });

  /* 9.2 ELV con desviaciones */
  const NP = { 'etanol|agua': 'Etanol – agua', 'acetona|cloroformo': 'Acetona – cloroformo', 'hexano|etanol': 'Hexano – etanol', 'metanol|acetona': 'Metanol – acetona', 'acetato de etilo|etanol': 'Acetato de etilo – etanol', 'etanol|benceno': 'Etanol – benceno', 'ciclohexano|etanol': 'Ciclohexano – etanol' };
  EM.defineSim('vle-noideal', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.select('pair', { label: 'Mezcla binaria', options: Object.entries(NP), value: 'etanol|agua' });
    sim.seg('mode', { label: 'Diagrama', options: [['T', 'T – x – y (1 atm)'], ['P', 'P – x – y (T fija)'], ['xy', 'x – y']], value: 'T' });
    sim.seg('model', { label: 'Modelo', options: [['nrtl', 'NRTL (real)'], ['ideal', 'Raoult (ideal)']], value: 'nrtl' });
    sim.slider('Tf', { label: 'Temperatura (diagrama P–x–y)', min: 300, max: 360, step: 1, value: 333, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('az', 'Azeótropo a 1 atm: composición de <i>x</i>₁ · temperatura', { hl: true });
    sim.out('ginf', 'Coeficientes de actividad a dilución infinita (a 340 K): γ₁∞ · γ₂∞');
    sim.out('tipo', 'Tipo de desviación');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [a, b] = p.pair.split('|'), mod = p.model, P0 = 101325;
      EM.draw.clear(cv);
      const xs = [], yb = [], ys = [];
      for (let i = 0; i <= 200; i++) {
        const x = Math.min(0.9999, Math.max(0.0001, i / 200)); xs.push(x);
        const r = p.mode === 'P' ? FQ.bubbleP(a, b, x, p.Tf, mod) : FQ.bubbleT(a, b, x, P0, mod);
        yb.push(p.mode === 'P' ? r.P / 1e3 : r.T); ys.push(r.y1);
      }
      const lo = Math.min(...yb), hi = Math.max(...yb), pad = (hi - lo) * 0.1;
      let pl;
      if (p.mode === 'xy') {
        pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlabel: 'x₁ (' + a + ')', ylabel: 'y₁', ml: 46 });
        pl.frame(); pl.path([[0, 0], [1, 1]], { color: '--ink-3', width: 1.2 }); pl.xy(xs, ys, { color: '--c1', width: 2.6 });
      } else {
        pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: lo - pad, ymax: hi + pad, xlabel: 'fracción molar de ' + a + ' (x en el líquido, y en el vapor)', ylabel: p.mode === 'P' ? 'P (kPa)' : 'T (K)', ml: 56 });
        pl.frame(); pl.xy(xs, yb, { color: '--c2', width: 2.6 }); pl.xy(ys, yb, { color: '--c1', width: 2.6 });
        pl.legend([{ label: 'burbuja (líquido)', color: '--c2' }, { label: 'rocío (vapor)', color: '--c1' }], p.mode === 'P' ? 'br' : 'tr');
      }
      const az = FQ.azeotropeP(a, b, P0, mod);
      if (az) {
        if (p.mode === 'xy') pl.dot(az.x, az.x, { color: '--accent', label: 'azeótropo', dx: 8, dy: 14 });
        else if (p.mode === 'T') pl.dot(az.x, az.T, { color: '--accent', label: 'azeótropo', dx: 8, dy: az.T > (lo + hi) / 2 ? 14 : -10 });
      }
      sim.set('az', az ? 'x₁ = ' + EM.fix(az.x, 3) + ' · ' + EM.fix(az.T - 273.15, 1) + ' °C (' + (mod === 'nrtl' ? 'NRTL' : 'Raoult') + ')' : 'no hay azeótropo');
      const g1 = FQ.nrtl(a, b, 1e-6, 340), g2 = FQ.nrtl(a, b, 1 - 1e-6, 340);
      sim.set('ginf', EM.fix(g1[0], 2) + ' · ' + EM.fix(g2[1], 2));
      sim.set('tipo', g1[0] > 1 && g2[1] > 1 ? 'positiva: G^E > 0 (atracción menor entre moléculas distintas); azeótropo de máxima presión y mínima temperatura de ebullición' : g1[0] < 1 && g2[1] < 1 ? 'negativa: G^E < 0 (atracción mayor entre moléculas distintas); azeótropo de mínima presión y máxima temperatura de ebullición' : 'mixta');
    });
  });

  /* 9.3 Equilibrio líquido–líquido */
  const A12 = 3.9216, A21 = 1.1003;
  EM.defineSim('lle', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('s', { label: 'Sistema', options: [['but', '1-Butanol – agua (van Laar ajustado a 20 °C, escala 1/T)'], ['reg', 'Disolución regular simétrica']], value: 'but' });
    sim.slider('T', { label: 'Temperatura', min: 270, max: 420, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('chi', { label: 'Para la regular: χ a 298 K (ω/RT)', min: 1.5, max: 4, step: 0.01, value: 2.4, fmt: (v) => v.toFixed(2) });
    sim.slider('z', { label: 'Composición global z (fracción del componente 1)', min: 0.02, max: 0.98, step: 0.01, value: 0.2, fmt: (v) => v.toFixed(2) });
    sim.out('ph', 'Fases a esta <i>T</i> y <i>z</i>', { hl: true });
    sim.out('co', 'Composiciones de las dos fases líquidas');
    sim.out('Tc', 'Temperatura crítica superior de solución');
    const model = (p, T) => (p.s === 'but' ? (x) => FQ.act.vanlaar(A12 * (293.15 / T), A21 * (293.15 / T), x) : (x) => FQ.act.regular((p.chi * 298) / T, x));
    const spin = (lng) => { const out = []; const h = 1e-4, d2 = (x) => { const g = (y) => y * Math.log(y) + (1 - y) * Math.log(1 - y) + FQ.gEoverRT(lng(y), y); return (g(x + h) - 2 * g(x) + g(x - h)) / (h * h); }; let prev = d2(0.01), xp = 0.01; for (let x = 0.02; x < 0.99; x += 0.01) { const v = d2(x); if (prev * v < 0) out.push(FQ.bisect(d2, xp, x, 1e-8)); prev = v; xp = x; } return out; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 270, ymax: 420, xlabel: 'fracción molar del componente 1', ylabel: 'T (K)', ml: 52 });
      pl.frame();
      const bi = [], si = [];
      let Tc = null;
      for (let T = 270; T <= 420; T += 2) {
        const r = FQ.lle(model(p, T));
        if (!r) { if (bi.length && Tc === null) Tc = T; continue; }
        bi.push([T, r.xa, r.xb]);
        const s = spin(model(p, T)); if (s.length === 2) si.push([T, s[0], s[1]]);
      }
      pl.xy(bi.map((q) => q[1]).concat(bi.slice().reverse().map((q) => q[2])), bi.map((q) => q[0]).concat(bi.slice().reverse().map((q) => q[0])), { color: '--c1', width: 2.6 });
      if (si.length) pl.xy(si.map((q) => q[1]).concat(si.slice().reverse().map((q) => q[2])), si.map((q) => q[0]).concat(si.slice().reverse().map((q) => q[0])), { color: '--c4', width: 1.6, dash: [6, 4] });
      pl.hline(p.T, { color: '--accent' }); pl.vline(p.z, { color: '--accent', alpha: 0.4, width: 1 });
      pl.dot(p.z, p.T, { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'binodal (curva de coexistencia)', color: '--c1' }, { label: 'espinodal', color: '--c4', dash: [6, 4] }], 'br');
      const r = FQ.lle(model(p, p.T));
      if (!r) { sim.set('ph', 'una fase líquida homogénea (por encima de la temperatura crítica)'); sim.set('co', '—'); }
      else {
        pl.dot(r.xa, p.T, { color: '--c2' }); pl.dot(r.xb, p.T, { color: '--c3' });
        if (p.z <= r.xa || p.z >= r.xb) { sim.set('ph', 'una fase líquida (fuera de la región de dos fases)'); sim.set('co', 'x₁ = ' + EM.fix(p.z, 3)); }
        else { const f = (p.z - r.xa) / (r.xb - r.xa); sim.set('ph', 'dos fases líquidas: la fase rica en 2 (' + EM.fix(100 * (1 - f), 1) + ' %) y la rica en 1 (' + EM.fix(100 * f, 1) + ' %)'); sim.set('co', 'x₁ = ' + EM.fix(r.xa, 4) + ' · x₁ = ' + EM.fix(r.xb, 4)); }
      }
      sim.set('Tc', Tc ? 'entre ' + EM.fix(Tc - 2, 0) + ' y ' + EM.fix(Tc, 0) + ' K' + (p.s === 'reg' ? ' (teoría: T_c = χ·298/2 = ' + EM.fix((p.chi * 298) / 2, 1) + ' K)' : ' (experimento: 398 K)') : '—');
    });
  });
})();
