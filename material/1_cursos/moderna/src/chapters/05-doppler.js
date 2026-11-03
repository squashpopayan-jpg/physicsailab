/* Capítulo 5 — Doppler, aberración, Cherenkov y campos en movimiento */
(function () {
  'use strict';
  const EM = window.EM, R = EM.fm.rel, K = EM.qm.K, c = K.c, rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;

  /* 5.1 Efecto Doppler relativista */
  EM.defineSim('doppler', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('b', { label: 'Velocidad de la fuente β = v/c', min: 0, max: 0.99, step: 0.005, value: 0.3, fmt: (v) => EM.fix(v, 3) });
    sim.slider('th', { label: 'Ángulo θ entre la velocidad de la fuente y la luz que llega al observador (0° = se acerca de frente, 180° = se aleja)', min: 0, max: 180, step: 1, value: 180, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('lam', { label: 'Longitud de onda emitida λ₀', min: 100, max: 1000, step: 0.01, value: 656.28, unit: 'nm', fmt: (v) => EM.fix(v, 2) });
    sim.out('D', 'Factor de Doppler f/f₀ = 1/[γ(1 − β cos θ)]', { hl: true });
    sim.out('lam', 'Longitud de onda observada λ = λ₀/D · corrimiento z = (λ − λ₀)/λ₀');
    sim.out('cls', 'Longitudinal: acercamiento · alejamiento · transversal (θ = 90°: f₀/γ)');
    sim.out('ng', 'Doppler clásico si la fuente se mueve: 1/(1 ∓ β) · diferencia con la relativista');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, b = p.b, th = rad(p.th), D = R.doppler(b, th);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 180, ymin: 0, ymax: Math.max(2.2, R.doppler(b, 0) * 1.1), xlabel: 'ángulo θ (°)', ylabel: 'factor de Doppler f/f₀', ml: 52, mr: 8, title: 'Factor de Doppler frente al ángulo' });
      pl.frame();
      pl.hline(1, { color: '--ink-3', dash: [3, 3] });
      pl.fn((t) => R.doppler(b, rad(t)), { color: '--accent', width: 3, n: 360 });
      pl.fn((t) => 1 / (1 - b * Math.cos(rad(t))), { color: '--c2', width: 1.8, dash: [6, 4], n: 360 });
      pl.dot(p.th, D, { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'relativista', color: '--accent' }, { label: 'clásica (fuente móvil)', color: '--c2', dash: [6, 4] }], 'tr');
      /* Derecha: factor frente a β para tres direcciones */
      const pr = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: 0, xmax: 0.99, ymin: 0, ymax: 8, xlabel: 'β = v/c', ylabel: 'f/f₀', ml: 44, mr: 8, title: 'Longitudinal y transversal' });
      pr.frame();
      pr.hline(1, { color: '--ink-3', dash: [3, 3] });
      pr.fn(R.dopplerApproach, { color: '--c1', width: 2.6, n: 300 }); pr.fn(R.dopplerRecede, { color: '--c3', width: 2.6, n: 300 }); pr.fn((x) => 1 / R.gamma(x), { color: '--c4', width: 2.6, n: 300 });
      pr.dot(b, R.doppler(b, th), { color: '--accent', r: 5 });
      pr.legend([{ label: 'se acerca', color: '--c1' }, { label: 'se aleja', color: '--c3' }, { label: 'transversal 1/γ', color: '--c4' }], 'tl');
      /* Barra de espectro observado */
      const lo = p.lam / D, rgb = lo >= 380 && lo <= 780 ? EM.wavelengthRGB(lo) : null;
      EM.text(ctx, rgb ? `λ observada ${EM.fix(lo, 1)} nm` : `λ observada ${EM.fix(lo, 1)} nm (fuera del visible)`, W * 0.25, H - 10, { size: 12, align: 'center', color: rgb ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` : '--ink-2', halo: true });
      sim.set('D', EM.fix(D, 6));
      sim.set('lam', `${EM.fix(lo, 4)} nm · z = ${EM.fix(lo / p.lam - 1, 5)}`);
      sim.set('cls', `${EM.fix(R.dopplerApproach(b), 5)} · ${EM.fix(R.dopplerRecede(b), 5)} · ${EM.fix(1 / R.gamma(b), 5)}`);
      sim.set('ng', `${EM.fix(1 / (1 - b), 4)} · ${EM.fix(1 / (1 + b), 4)} (relativista ${EM.fix(R.dopplerApproach(b), 4)} · ${EM.fix(R.dopplerRecede(b), 4)})`);
    });
  });

  /* 5.2 Aberración de la luz y efecto faro */
  EM.defineSim('aberracion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('b', { label: 'Velocidad del observador (o de la fuente) β = v/c', min: 0, max: 0.99, step: 0.005, value: 0.8, fmt: (v) => EM.fix(v, 3) });
    sim.out('a', 'Estrella a 90° del movimiento: se ve a α′ · desplazamiento', { hl: true });
    sim.out('s', 'Semi-ángulo del cono que contiene la mitad de los fotones de una fuente isótropa: arccos β · 1/γ');
    sim.out('i', 'Intensidad hacia delante relativa a la isótropa D² = [γ(1 − β)]⁻² · hacia atrás');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, b = p.b;
      EM.draw.clear(cv);
      /* Cielo: estrellas distribuidas en una circunferencia; se desplazan hacia la dirección de movimiento */
      const cx = W * 0.25, cy = H * 0.52, Rr = Math.min(W * 0.21, H * 0.38);
      EM.text(ctx, 'El cielo visto por un observador que se mueve →', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.strokeStyle = EM.col('--rule'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, Rr, 0, 7); ctx.stroke(); ctx.restore();
      for (let k = 0; k < 24; k++) {
        const a0 = (k * Math.PI * 2) / 24 + 0.0001, ang = Math.abs(((a0 + Math.PI) % (2 * Math.PI)) - Math.PI), sgn = Math.sin(a0) >= 0 ? 1 : -1, a1 = sgn * R.aberrate(b, ang);
        const aa = sgn * ang;
        ctx.save(); ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 1.6; ctx.beginPath();
        for (let t = 0; t <= 1.0001; t += 0.1) { const a = aa + (a1 - aa) * t, x = cx + Rr * Math.cos(a), y = cy - Rr * Math.sin(a); t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.arc(cx + Rr * Math.cos(aa), cy - Rr * Math.sin(aa), 3, 0, 7); ctx.fill();
        ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + Rr * Math.cos(a1), cy - Rr * Math.sin(a1), 4, 0, 7); ctx.fill(); ctx.restore();
      }
      EM.draw.arrow(ctx, cx - 14, cy, cx + 30, cy, { color: '--c2', width: 2.4, head: 8 }); EM.text(ctx, 'v', cx + 34, cy - 6, { size: 12, color: '--c2' });
      EM.text(ctx, '○ sin movimiento · ● aparente', cx, H - 8, { size: 11, align: 'center', color: '--ink-3' });
      /* Efecto faro: fotones por ángulo sólido */
      const px = W * 0.76, py = H * 0.52, Rp = Math.min(W * 0.21, H * 0.38), dmax = Math.pow(R.doppler(b, 0), 2);
      EM.text(ctx, 'Emisión isótropa vista por el observador: D²(θ)', px, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.strokeStyle = EM.col('--rule'); ctx.setLineDash([3, 3]); for (const f of [0.25, 0.5, 1]) { ctx.beginPath(); ctx.arc(px, py, Rp * f, 0, 7); ctx.stroke(); } ctx.restore();
      ctx.save(); ctx.fillStyle = EM.alpha('--accent', 0.2); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.6; ctx.beginPath();
      for (let k = 0; k <= 360; k++) { const t = (k * Math.PI) / 180, r = (Rp * Math.pow(R.doppler(b, t), 2)) / dmax, x = px + r * Math.cos(t), y = py - r * Math.sin(t); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      const half = Math.acos(b); ctx.save(); ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 1.6; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Rp * 1.05 * Math.cos(half), py - Rp * 1.05 * Math.sin(half)); ctx.moveTo(px, py); ctx.lineTo(px + Rp * 1.05 * Math.cos(half), py + Rp * 1.05 * Math.sin(half)); ctx.stroke(); ctx.restore();
      EM.text(ctx, `mitad de los fotones: ±${EM.fix(deg(half), 2)}°`, px, H - 8, { size: 11.5, align: 'center', color: '--c3' });
      const a1 = R.aberrate(b, Math.PI / 2);
      sim.set('a', `${EM.fix(deg(a1), 4)}° · ${EM.fix(90 - deg(a1), 4)}°` + (b < 0.01 ? ` (${EM.fix((Math.PI / 2 - a1) * 206264.806, 2)}″)` : ''));
      sim.set('s', `${EM.fix(deg(half), 3)}° · ${EM.fix(deg(1 / R.gamma(b)), 3)}° (1/γ en rad)`);
      sim.set('i', `${EM.fix(Math.pow(R.doppler(b, 0), 2), 4)} · ${EM.sci(Math.pow(R.doppler(b, Math.PI), 2), 4)}`);
    });
  });

  /* 5.3 Radiación de Cherenkov */
  const MED = { agua: ['Agua', 1.333], hielo: ['Hielo', 1.31], vidrio: ['Vidrio crown', 1.52], aerogel: ['Aerogel de sílice', 1.03], aire: ['Aire (nivel del mar)', 1.000293] };
  const PRT = { e: ['Electrón', R.MASS.e], mu: ['Muón', R.MASS.mu], pi: ['Pión cargado', R.MASS.pi], p: ['Protón', R.MASS.p] };
  EM.defineSim('cherenkov', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('med', { label: 'Medio', options: Object.entries(MED).map(([k, v]) => [k, `${v[0]} (n = ${v[1]})`]), value: 'agua' });
    sim.select('part', { label: 'Partícula', options: Object.entries(PRT).map(([k, v]) => [k, `${v[0]} (${EM.fix(v[1], 2)} MeV/c²)`]), value: 'e' });
    sim.slider('K', { label: 'Energía cinética K', min: 0.01, max: 1e5, step: 0.01, value: 5, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 3) });
    sim.out('th', 'Ángulo del cono θ_c = arccos[1/(nβ)] · β de la partícula', { hl: true });
    sim.out('u', 'Umbral: β = 1/n · energía cinética umbral de esta partícula');
    sim.out('N', 'Fotones por centímetro entre 300 y 600 nm (Frank–Tamm) · ángulo máximo (β → 1)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = MED[p.med][1], m = PRT[p.part][1], b = R.betaFromK(p.K, m), th = R.cherenkovAngle(n, b), Kth = R.cherenkovThresholdK(n, m);
      EM.draw.clear(cv);
      /* Construcción de Huygens: la partícula avanza a v; cada punto emite un frente esférico que viaja a c/n */
      const x0 = W * 0.05, y0 = H * 0.5, L = W * 0.4;
      EM.text(ctx, 'Frentes de onda emitidos por la partícula (Huygens)', W * 0.25, 16, { size: 12, align: 'center', color: '--ink-2' });
      const T = 1, vpx = L / T * 1.0, sw = (vpx / b) / n; /* radio por unidad de tiempo del frente: (c/n) = v/(nβ) */
      ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + L, y0); ctx.stroke(); ctx.restore();
      const px = x0 + L;
      for (let k = 0; k <= 6; k++) {
        const t0 = k / 6, xe = x0 + L * t0, r = (sw * (1 - t0)) * 1.0;
        ctx.save(); ctx.strokeStyle = EM.alpha('--c1', 0.55); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(xe, y0, Math.max(0, r), 0, 7); ctx.stroke(); ctx.restore();
      }
      if (n * b > 1) { const psi = Math.asin(1 / (n * b)), ext = L * 0.9; ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px - ext * Math.cos(psi), y0 - ext * Math.sin(psi)); ctx.moveTo(px, y0); ctx.lineTo(px - ext * Math.cos(psi), y0 + ext * Math.sin(psi)); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(px, y0, 6, 0, 7); ctx.fill(); ctx.restore();
      EM.text(ctx, n * b > 1 ? `θ_c = ${EM.fix(deg(th), 2)}° (la luz sale perpendicular al cono)` : 'bajo el umbral: sin cono', W * 0.25, H - 10, { size: 12, align: 'center', color: n * b > 1 ? '--accent' : '--c2' });
      /* Derecha: ángulo frente a β para varios medios */
      const pr = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0.5, xmax: 1, ymin: 0, ymax: 60, xlabel: 'β de la partícula', ylabel: 'ángulo de Cherenkov θ_c (°)', ml: 52, mr: 8, title: 'Ángulo de Cherenkov y umbral' });
      pr.frame();
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5'];
      Object.values(MED).forEach(([nm, nn], i) => pr.fn((x) => (nn * x > 1 ? deg(R.cherenkovAngle(nn, x)) : NaN), { color: cols[i], width: 2.2, n: 400, from: 1 / nn }));
      pr.legend(Object.values(MED).map(([nm], i) => ({ label: nm, color: cols[i] })), 'tl');
      if (n * b > 1) pr.dot(b, deg(th), { color: '--accent', r: 5.5 });
      sim.set('th', n * b > 1 ? `${EM.fix(deg(th), 3)}° · β = ${EM.fix(b, b > 0.9999 ? 7 : 5)}` : `sin radiación · β = ${EM.fix(b, 5)} < 1/n = ${EM.fix(1 / n, 5)}`);
      sim.set('u', `${EM.fix(1 / n, 5)} · ${EM.fix(Kth, Kth < 10 ? 4 : 2)} MeV`);
      sim.set('N', `${EM.fix(R.cherenkovYield(n, b, 300e-9, 600e-9) / 100, 1)} · ${EM.fix(deg(Math.acos(1 / n)), 2)}°`);
    });
  });

  /* 5.4 Campo de una carga en movimiento uniforme */
  EM.defineSim('cargamovil', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('b', { label: 'Velocidad de la carga β = v/c', min: 0, max: 0.99, step: 0.005, value: 0.8, fmt: (v) => EM.fix(v, 3) });
    sim.out('f', 'Factor γ · campo transversal en el plano perpendicular (θ = 90°) frente a Coulomb: γ', { hl: true });
    sim.out('l', 'Campo a lo largo del movimiento (θ = 0°, 180°): 1/γ² veces el de Coulomb');
    sim.out('B', 'Campo magnético de la carga en el plano perpendicular: B = vE/c²  (relación con E)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, b = p.b, g = R.gamma(b);
      EM.draw.clear(cv);
      const cx = W * 0.26, cy = H * 0.52, Rr = Math.min(W * 0.23, H * 0.44);
      EM.text(ctx, 'Líneas del campo E (cada línea lleva el mismo flujo)', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      /* Flujo acumulado F(θ) = ∫0^θ f(t) sen t dt / ∫0^π f(t) sen t dt */
      const N = 600, cum = new Float64Array(N + 1); for (let i = 1; i <= N; i++) { const t = (i * Math.PI) / N, tm = ((i - 0.5) * Math.PI) / N; cum[i] = cum[i - 1] + R.movingChargeE(b, tm) * Math.sin(tm) * (Math.PI / N); void t; }
      const tot = cum[N], ang = (fr) => { let lo = 0, hi = N; while (hi - lo > 1) { const mid = (lo + hi) >> 1; (cum[mid] / tot < fr ? (lo = mid) : (hi = mid)); } return (lo * Math.PI) / N; };
      const nl = 12;
      ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.8;
      for (let k = 0; k < nl; k++) { const t = ang((k + 0.5) / nl); for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(cx + 10 * Math.cos(t), cy - s * 10 * Math.sin(t)); ctx.lineTo(cx + Rr * Math.cos(t), cy - s * Rr * Math.sin(t)); ctx.stroke(); } }
      ctx.restore();
      ctx.save(); ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill(); ctx.restore();
      EM.draw.arrow(ctx, cx + 10, cy + Rr * 0.12, cx + 46, cy + Rr * 0.12, { color: '--c2', width: 2.4, head: 8 }); EM.text(ctx, 'v', cx + 52, cy + Rr * 0.12 + 4, { size: 12, color: '--c2' });
      /* Polar: |E|/E_Coulomb en función de θ */
      const px = W * 0.74, py = H * 0.52, Rp = Math.min(W * 0.2, H * 0.4), mx = Math.max(1, g);
      EM.text(ctx, 'Intensidad del campo a distancia fija', px, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.strokeStyle = EM.col('--rule'); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(px, py, Rp / mx, 0, 7); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.6; ctx.fillStyle = EM.alpha('--accent', 0.15); ctx.beginPath();
      for (let k = 0; k <= 360; k++) { const t = (k * Math.PI) / 180, r = (Rp * R.movingChargeE(b, t)) / mx, x = px + r * Math.cos(t), y = py - r * Math.sin(t); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'círculo punteado = Coulomb', px, H - 8, { size: 11, align: 'center', color: '--ink-3' });
      sim.set('f', `${EM.fix(g, 4)} · ${EM.fix(R.movingChargeE(b, Math.PI / 2), 4)}`);
      sim.set('l', `${EM.fix(R.movingChargeE(b, 0), 5)} (1/γ² = ${EM.fix(1 / (g * g), 5)})`);
      sim.set('B', `cB/E = β sen θ: en el plano perpendicular vale ${EM.fix(b, 3)}; a lo largo del movimiento, 0`);
    });
  });
})();
