# -*- coding: utf-8 -*-
src = open(r'C:\Users\User\Documents\Claude\ConCode\mcuantica\src\chapters\01-crisis.js', encoding='utf-8').read()
i0 = src.index("  /* 1.2 Efecto fotoeléctrico")
i1 = src.index("  /* 1.4 Átomo de Bohr")
blk = src[i0:i1]
head = """/* Capítulo 8 — Fotoeléctrico, Compton, rayos X y pares */
(function () {
  'use strict';
  const EM = window.EM, O = EM.qm.orig, P = EM.fm.ph, K = EM.qm.K, c = K.c, HC = K.hc_eVnm;

"""
new = r"""
  /* 8.3 Dispersión Compton: sección de Klein–Nishina */
  EM.defineSim('klein', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('E', { label: 'Energía del fotón E', min: 1, max: 1e4, step: 0.01, value: 661.657, log: true, unit: 'keV', fmt: (v) => EM.sci(v, 4) });
    sim.out('s', 'Sección total por electrón σ_KN · cociente con Thomson σ_T = 0.6652 b', { hl: true });
    sim.out('mu', 'Coeficiente másico de atenuación Compton: agua (Z/A = 0.5551) · carbono (Z/A = 0.4995)');
    sim.out('f', 'Fracción media de la energía que se lleva el electrón · hacia delante (θ < 90°)');
    sim.out('ed', 'Borde Compton (energía cinética máxima del electrón) · fotón retrodispersado');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, eps = p.E / P.mc2keV, re2 = P.re * P.re;
      EM.draw.clear(cv);
      /* Polar: dσ/dΩ en unidades de r_e² */
      const cx = W * 0.26, cy = H * 0.5, Rr = Math.min(W * 0.22, H * 0.42);
      EM.text(ctx, 'Distribución angular dσ/dΩ (en unidades de r_e²)', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.strokeStyle = EM.col('--rule'); ctx.setLineDash([3, 3]); for (const f of [0.25, 0.5, 0.75, 1]) { ctx.beginPath(); ctx.arc(cx, cy, Rr * f, 0, 7); ctx.stroke(); } ctx.restore();
      const m = 1; /* máximo de la sección de Thomson: r_e² (hacia delante y atrás) */
      const curve = (fn, col, w, dash) => { ctx.save(); ctx.strokeStyle = EM.col(col); ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath(); for (let k = 0; k <= 360; k++) { const t = (k * Math.PI) / 180, r = (Rr * fn(t)) / m, x = cx + r * Math.cos(t), y = cy - r * Math.sin(t); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore(); };
      curve((t) => (1 + Math.cos(t) ** 2) / 2, '--c2', 1.8, [6, 4]);
      curve((t) => P.kn(eps, t) / re2, '--accent', 3);
      EM.draw.arrow(ctx, cx - Rr * 1.05, cy + Rr * 1.0, cx - Rr * 0.55, cy + Rr * 1.0, { color: '--c1', width: 2, head: 7 }); EM.text(ctx, 'fotón incidente', cx - Rr * 1.05, cy + Rr * 1.0 - 8, { size: 11, color: '--c1' });
      /* Total frente a la energía */
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 1, xmax: 1e5, xlog: true, ymin: 1e-3, ymax: 1.5, ylog: true, xlabel: 'energía del fotón (keV)', ylabel: 'σ_KN / σ_T', ml: 50, mr: 8, title: 'Sección eficaz de Klein–Nishina' });
      pr.frame(); pr.hline(1, { color: '--c2', label: 'Thomson', dash: [5, 3] });
      pr.fn((E) => P.knTotal(E / P.mc2keV) / P.thomson(), { color: '--accent', width: 3, n: 300 });
      pr.vline(P.mc2keV, { color: '--ink-3', label: 'mc²', dash: [3, 3] });
      pr.dot(p.E, P.knTotal(eps) / P.thomson(), { color: '--accent', r: 5.5 });
      /* fracción media de energía transferida: ∫ dσ (1 − k′/k) / σ */
      const N = 2000; let num = 0, den = 0, fw = 0;
      for (let i = 0; i < N; i++) { const t = ((i + 0.5) * Math.PI) / N, w = P.kn(eps, t) * 2 * Math.PI * Math.sin(t) * (Math.PI / N); num += w * (1 - P.ratio(eps, t)); den += w; if (t < Math.PI / 2) fw += w; }
      const sk = P.knTotal(eps);
      sim.set('s', `${EM.sci(sk * 1e28, 4)} b = ${EM.sci(sk * 1e4, 4)} cm² · ${EM.fix(sk / P.thomson(), 4)}`);
      sim.set('mu', `${EM.sci(P.massAtt(eps, 0.5551), 4)} cm²/g · ${EM.sci(P.massAtt(eps, 0.4995), 4)} cm²/g`);
      sim.set('f', `${EM.fix((100 * num) / den, 2)} % · ${EM.fix((100 * fw) / den, 2)} % de los fotones`);
      sim.set('ed', `${EM.fix(P.comptonEdge(p.E), 3)} keV · ${EM.fix(P.backscatter(p.E), 3)} keV`);
    });
  });

  /* 8.4 Tubo de rayos X: espectro continuo y líneas características */
  EM.defineSim('rayosx', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('tg', { label: 'Material del blanco', options: [['Cu', 'Cobre (Z = 29)'], ['Mo', 'Molibdeno (Z = 42)'], ['Ag', 'Plata (Z = 47)'], ['W', 'Wolframio (Z = 74)']], value: 'Mo' });
    sim.slider('V', { label: 'Voltaje acelerador V', min: 10, max: 150, step: 0.5, value: 35, unit: 'kV', fmt: (v) => EM.fix(v, 1) });
    sim.out('lm', 'Longitud de onda mínima (Duane–Hunt) λ_min = hc/eV · energía máxima del fotón', { hl: true });
    sim.out('pk', 'Máximo del espectro continuo (Kramers): 2λ_min');
    sim.out('ex', 'Borde K del blanco · ¿se excitan las líneas K?');
    sim.out('ka', 'Líneas Kα1 y Kβ1 del blanco · predicción de Moseley ¾Ry(Z − 1)²');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, V = p.V * 1e3, lmin = P.lambdaMin(V), [Z, ka, kb, ed] = P.KLINES[p.tg];
      EM.draw.clear(cv);
      const lmax = 0.12, xmax = 0.12e-9 * 1e9; /* nm */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 0.12, ymin: 0, ymax: 1.1, xlabel: 'longitud de onda λ (nm)', ylabel: 'intensidad (u. arb.)', ml: 50, mr: 8, title: 'Espectro del tubo (esquemático: intensidades relativas)' });
      pl.frame(); void lmax; void xmax;
      const lmn = lmin * 1e9, peak = P.kramers(2 * lmn, lmn), I = (l) => P.kramers(l, lmn) / peak;
      pl.fn(I, { color: '--accent', width: 2.8, n: 600, from: lmn, fill: '--accent', fillAlpha: 0.14 });
      pl.vline(lmn, { color: '--c3', label: 'λ_min', dash: [4, 3] });
      const lines = [[ka, 'Kα1', 0.9], [kb, 'Kβ1', 0.28]], on = V * 1 >= ed; /* eV: e·V ≥ E_K */
      if (on) for (const [E, nm, hgt] of lines) { const l = HC / (E / 1e3 * 1.0) / 1e3 * 1e3; void l; const lam = 1239.84198 / (E / 1000) / 1000; pl.path([[lam, 0], [lam, Math.max(I(lam) + hgt, hgt)]], { color: '--c2', width: 2.6 }); pl.label(lam, Math.max(I(lam) + hgt, hgt), nm, { color: '--c2', dy: -6, align: 'center' }); }
      /* Derecha: Moseley */
      const pr = new EM.Plot(ctx, { x: W * 0.65, y: 0, w: W * 0.35, h: H, xmin: 20, xmax: 80, ymin: 0, ymax: 8, xlabel: 'número atómico Z', ylabel: '√(Kα1/Ry) (10⁻¹ )', ml: 44, mr: 8, title: 'Ley de Moseley' });
      pr.frame();
      pr.fn((z) => Math.sqrt(P.moseleyKa(z) / K.Ry_eV) , { color: '--c2', width: 1.8, dash: [5, 3], n: 100 });
      for (const [s, d] of Object.entries(P.KLINES)) pr.dot(d[0], Math.sqrt(d[1] / K.Ry_eV), { color: s === p.tg ? '--accent' : '--ink-3', r: s === p.tg ? 5.5 : 3.5, label: s, dx: 5, dy: 12 });
      sim.set('lm', `${EM.fix(lmin * 1e9, 5)} nm (${EM.fix(lmin * 1e12, 2)} pm) · ${EM.fix(V / 1e3, 2)} keV`);
      sim.set('pk', `${EM.fix(2 * lmin * 1e9, 5)} nm`);
      sim.set('ex', `${EM.fix(ed / 1e3, 3)} keV · ${V >= ed ? 'sí (eV ≥ E_K)' : 'no (V < ' + EM.fix(ed / 1e3, 2) + ' kV)'}`);
      sim.set('ka', `${EM.fix(ka / 1e3, 3)} keV · ${EM.fix(kb / 1e3, 3)} keV · ${EM.fix(P.moseleyKa(Z) / 1e3, 3)} keV`);
    });
  });
})();
"""
open(r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\08-fotones.js', 'w', encoding='utf-8').write(head + blk + new)
print('ok')
