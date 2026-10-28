/* Capítulo 35 — Polímeros y biomacromoléculas */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, P = FQ.pol, R = 8.314462618;

  /* 35.1 Cadenas ideales: tamaño y distribución */
  EM.defineSim('cadena', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Número de enlaces N', min: 10, max: 400, step: 1, value: 100, log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('c', { label: 'Rigidez: cos θ entre enlaces consecutivos (0 = libremente articulada)', min: 0, max: 0.95, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.button('Generar 2000 cadenas', () => run(), { primary: true });
    sim.out('r', 'Distancia extremo a extremo cuadrática media ⟨<i>R</i>²⟩ (simulación · teoría de rotación libre)', { hl: true });
    sim.out('g', 'Radio de giro ⟨<i>R</i><sub>g</sub>²⟩ (simulación) · <i>N</i><i>b</i>²/6 de la cadena gaussiana · exponente de escala');
    let res = null, N0 = 0, c0 = 0;
    const run = () => { const p = sim.p, N = Math.round(p.N), c = p.c === 0 ? null : p.c; res = P.mc(N, c, 2000, 77); N0 = N; c0 = p.c; sim.redraw(); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx; EM.draw.clear(cv);
      const N = Math.round(p.N), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.6, h: cv.h, xmin: 0, xmax: 4 * Math.sqrt(P.R2frc(N, p.c === 0 ? null : p.c)), ymin: 0, ymax: 0.12 / Math.sqrt(N / 100) * 1.6, xlabel: 'R extremo a extremo (en unidades de la longitud de enlace)', ylabel: 'P(R)', ml: 46, title: 'Distribución de extremos' });
      pl.frame(); const Rm = Math.sqrt(P.R2frc(N, p.c === 0 ? null : p.c)); pl.fn((R_) => P.pR(R_, 1, 1) * 0 + (4 * Math.PI * R_ * R_ * Math.pow(3 / (2 * Math.PI * Rm * Rm), 1.5) * Math.exp((-3 * R_ * R_) / (2 * Rm * Rm))), { color: '--c2', width: 2, dash: [5, 4], n: 200 });
      if (res && N0 === N && c0 === p.c) { const nb = 40, mx = pl.xmax || 4 * Rm, h = new Array(nb).fill(0), dr = (4 * Rm) / nb; res.Rs.forEach((x) => { const b = Math.floor(x / dr); if (b < nb) h[b]++; }); pl.xy(h.map((_, i) => (i + 0.5) * dr), h.map((v) => v / res.Rs.length / dr), { color: '--c1', width: 2.4 }); sim.set('r', EM.fix(res.R2, 1) + ' · ' + EM.fix(P.R2frc(N, p.c === 0 ? null : p.c), 1)); sim.set('g', EM.fix(res.Rg2, 2) + ' · ' + EM.fix(N / 6, 2) + ' (cadena gaussiana) · ⟨R²⟩ ∝ N^1 para cadenas ideales (ν = ½)'); }
      else { EM.text(ctx, 'Pulse «Generar 2000 cadenas»', pl.ix + pl.iw / 2, pl.iy + pl.ih / 2, { size: 13, align: 'center', color: '--ink-3' }); sim.set('r', '— · ' + EM.fix(P.R2frc(N, p.c === 0 ? null : p.c), 1)); sim.set('g', '—'); }
      pl.legend([{ label: 'simulación', color: '--c1' }, { label: 'gaussiana de igual ⟨R²⟩', color: '--c2', dash: [5, 4] }], 'tr');
      /* ejemplo de una cadena */
      const cx = cv.w * 0.8, cy = cv.h * 0.5; ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 1.4; let x = cx, y = cy, th = 0; const rr = (() => { let s = 5; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); })(); ctx.beginPath(); ctx.moveTo(x, y); const sc = Math.min(1.6, 120 / Math.sqrt(N)); for (let i = 0; i < Math.min(N, 400); i++) { th += p.c === 0 ? 2 * Math.PI * rr() : Math.acos(p.c) * (rr() < 0.5 ? -1 : 1) * (0.5 + rr()); x += sc * Math.cos(th); y += sc * Math.sin(th); ctx.lineTo(x, y); } ctx.stroke(); EM.text(ctx, 'proyección 2D de una cadena', cv.w * 0.8, cv.h - 14, { size: 11, align: 'center', color: '--ink-3' });
    });
  });

  /* 35.2 Elasticidad entrópica de una molécula */
  EM.defineSim('fuerza-ext', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Pp', { label: 'Longitud de persistencia P', min: 0.5, max: 100, step: 0.5, value: 50, log: true, unit: 'nm', fmt: (v) => v.toFixed(1) });
    sim.slider('L', { label: 'Longitud de contorno L', min: 100, max: 20000, step: 10, value: 16500, log: true, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura', min: 270, max: 350, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('k', 'Fuerza a la mitad de la extensión: gusano (Marko–Siggia) · cadena libremente articulada con segmentos de Kuhn 2P', { hl: true });
    sim.out('h', 'Constante elástica a extensión pequeña 3<i>k</i><sub>B</sub><i>T</i>/(2<i>PL</i>)  ·  fuerza para llegar al 95 % de la extensión');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, kT = 1.380649e-23 * p.T, Pn = p.Pp, Ln = p.L, kTpN = kT * 1e21 /* pN·nm */, xs = Array.from({ length: 300 }, (_, i) => 0.001 + (0.98 * i) / 299);
      EM.draw.clear(cv);
      const wlc = (x) => P.wlcForce(x, Pn, kTpN), fjc = (x) => P.fjcForce(x, kTpN / (2 * Pn)), Fmax = 30;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: Fmax, xlabel: 'extensión relativa x/L', ylabel: 'fuerza (pN)', ml: 46 });
      pl.frame(); pl.xy(xs, xs.map((x) => Math.min(Fmax, wlc(x))), { color: '--c1', width: 2.8 }); pl.xy(xs, xs.map((x) => Math.min(Fmax, fjc(x))), { color: '--c2', width: 2.2, dash: [5, 4] }); pl.xy(xs, xs.map((x) => Math.min(Fmax, (3 * kTpN * x * Ln) / (2 * Pn * Ln * 1))), { color: '--ink-3', width: 1.2, dash: [2, 3] });
      pl.legend([{ label: 'gusano (Marko–Siggia)', color: '--c1' }, { label: 'cadena libremente articulada (Langevin)', color: '--c2', dash: [5, 4] }, { label: 'ley de Hooke entrópica', color: '--ink-3', dash: [2, 3] }], 'tl');
      let lo = 0.5, hi = 0.999; for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (wlc(m) < 10) lo = m; else hi = m; }
      sim.set('k', EM.fix(wlc(0.5), 3) + ' pN · ' + EM.fix(fjc(0.5), 3) + ' pN');
      sim.set('h', EM.fix((3 * kTpN) / (2 * Pn * Ln) * 1e3, 3) + ' fN/nm · ' + EM.fix(wlc(0.95), 2) + ' pN (x/L = 0.95)' + ' · x/L = ' + EM.fix(lo, 3) + ' a 10 pN');
    });
  });

  /* 35.3 Flory–Huggins: mezcla de polímero y disolvente */
  EM.defineSim('flory-huggins', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Grado de polimerización N', min: 1, max: 5000, step: 1, value: 100, log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('chi', { label: 'Parámetro de interacción χ', min: 0, max: 3, step: 0.005, value: 0.7, fmt: (v) => v.toFixed(3) });
    sim.out('c', 'Punto crítico: φ<sub>c</sub> = 1/(1 + √N) · χ<sub>c</sub> = ½(1 + 1/√N)²', { hl: true });
    sim.out('b', 'Fases en equilibrio a este χ (binodal): fracciones de volumen de polímero');
    sim.out('o', 'Presión osmótica Π<i>V</i><sub>1</sub>/<i>RT</i> a φ = 0.05 (Flory–Huggins) · ideal · desarrollo del virial');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, N = Math.round(p.N), cr = P.critical(N), bin = P.binodal(N, p.chi), W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const phis = Array.from({ length: 300 }, (_, i) => 0.0005 + (0.999 * i) / 299);
      const f = (x) => P.fFH(x, N, p.chi), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.45, h: H, xmin: 0, xmax: 1, ymin: Math.min(...phis.map(f)) * 1.1 - 0.01, ymax: Math.max(...phis.map(f)) * 1.1 + 0.02, xlabel: 'fracción de volumen de polímero φ', ylabel: 'ΔG_mezcla/(RT) por sitio', ml: 52, title: 'Energía de mezcla' });
      pl.frame(); pl.xy(phis, phis.map(f), { color: '--c1', width: 2.8 }); if (bin) pl.path([[bin[0], f(bin[0])], [bin[1], f(bin[1])]], { color: '--accent', width: 2 });
      const cs = Array.from({ length: 80 }, (_, i) => cr.chi * (1.0 + (2.2 * i) / 79) ), pb = new EM.Plot(ctx, { x: W * 0.48, y: 0, w: W * 0.52, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(1.2, 3.0), xlabel: 'φ', ylabel: 'χ', ml: 40, mr: 8, title: 'Diagrama de fases (χ ∝ 1/T: temperatura crítica superior)' });
      pb.frame(); const bb = [], bb2 = [], sp = [], sp2 = []; for (let i = 0; i < 70; i++) { const chi = cr.chi * (1.0001 + (i / 70) * 1.6); const b = P.binodal(N, chi); if (b) { bb.push([b[0], chi]); bb2.push([b[1], chi]); } } pb.path(bb.concat(bb2.reverse()), { color: '--c1', width: 2.6 });
      const ps = Array.from({ length: 200 }, (_, i) => 0.002 + (0.996 * i) / 199).map((x) => [x, P.chiSpin(x, N)]).filter((q) => q[1] < 3); pb.path(ps, { color: '--c2', width: 1.8, dash: [5, 4] }); pb.dot(cr.phi, cr.chi, { color: '--accent', r: 5 }); pb.hline(p.chi, { color: '--ink-3', dash: [3, 3] });
      pb.legend([{ label: 'binodal', color: '--c1' }, { label: 'espinodal', color: '--c2', dash: [5, 4] }], 'tr');
      sim.set('c', EM.fix(cr.phi, 4) + ' · ' + EM.fix(cr.chi, 4) + (p.chi > cr.chi ? ' (χ > χc: separa en dos fases)' : ' (χ < χc: miscible en todo el intervalo)'));
      sim.set('b', bin ? EM.fix(bin[0], 4) + ' (fase diluida) y ' + EM.fix(bin[1], 3) + ' (fase concentrada)' : 'una sola fase');
      const phi = 0.05, Pi = P.osmotic(phi, N, p.chi), cdil = 0.001, pid = P.osmotic(cdil, N, p.chi); sim.set('o', EM.fix(Pi, 5) + ' · ideal de van’t Hoff φ/N = ' + EM.fix(phi / N, 5) + ' · virial: Π V₁/RT = φ/N + (½ − χ)φ² = ' + EM.fix(phi / N + (0.5 - p.chi) * phi * phi, 5));
    });
  });

  /* 35.4 Transición hélice–ovillo (Zimm–Bragg) */
  EM.defineSim('zimm-bragg', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Número de residuos N', min: 5, max: 400, step: 1, value: 40, log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('sig', { label: 'Parámetro de nucleación σ', min: 1e-5, max: 1, step: 1e-5, value: 1e-3, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('dH', { label: 'Entalpía de propagación hélice → ovillo (ΔH por residuo)', min: 1, max: 20, step: 0.1, value: 4.2, unit: 'kJ/mol', fmt: (v) => v.toFixed(1) });
    sim.out('t', 'Temperatura en que <i>s</i> = 1 (punto medio de una cadena larga) · fracción de hélice en ese punto · anchura de la transición (intervalo de <i>T</i> entre θ = 0.8 y θ = 0.2)', { hl: true });
    sim.out('co', 'Longitud cooperativa de cada tramo de hélice que se funde de una vez ≈ 1/√σ');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, N = Math.round(p.N), Tm = 300, s = (T) => Math.exp((p.dH * 1e3 / R) * (1 / T - 1 / Tm)), Ts = Array.from({ length: 200 }, (_, i) => 240 + (120 * i) / 199);
      EM.draw.clear(cv);
      const th = (T) => P.zbTheta(N, p.sig, s(T)), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 240, xmax: 360, ymin: 0, ymax: 1.02, xlabel: 'temperatura (K)', ylabel: 'fracción de residuos en hélice θ_H', ml: 46 });
      pl.frame(); pl.xy(Ts, Ts.map(th), { color: '--c1', width: 2.8 }); pl.xy(Ts, Ts.map((T) => { const x = s(T); return x / (1 + x); }), { color: '--c2', width: 1.8, dash: [5, 4] }); pl.vline(Tm, { color: '--ink-3', dash: [3, 3] }); pl.hline(0.5, { color: '--ink-3', dash: [2, 3] });
      pl.legend([{ label: 'Zimm–Bragg (cooperativo)', color: '--c1' }, { label: 'sin cooperatividad (σ = 1)', color: '--c2', dash: [5, 4] }], 'tr');
      const lo = Ts.find((T) => th(T) < 0.8), hi = Ts.find((T) => th(T) < 0.2);
      sim.set('t', EM.fix(Tm, 0) + ' K · ' + EM.fix(th(Tm), 3) + ' · ' + (lo && hi ? EM.fix(hi - lo, 1) + ' K' : '—'));
      sim.set('co', EM.fix(1 / Math.sqrt(p.sig), 0) + ' residuos');
    });
  });
})();
