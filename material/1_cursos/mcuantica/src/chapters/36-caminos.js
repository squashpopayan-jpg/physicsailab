/* Capítulo 36 — Integrales de camino de Feynman */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.qm.pth, PI = Math.PI;
  const POT = { ho: { f: (x) => 0.5 * x * x, n: 'Oscilador armónico V = x²/2' }, dw: { f: (x) => (x * x - 1) ** 2, n: 'Doble pozo V = (x² − 1)²' } };

  /* 36.1 Fase estacionaria: la espiral de Cornu */
  EM.defineSim('cornu', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('a', { label: 'Fase cuadrática a (S/ħ = a y²: mayor a = más «clásico»)', min: 0.2, max: 60, step: 0.1, value: 6, log: true, fmt: (v) => EM.fix(v, 1) });
    sim.slider('Y', { label: 'Semiancho Y de los caminos incluidos (|y| ≤ Y)', min: 0.05, max: 4, step: 0.01, value: 0.8, fmt: (v) => EM.fix(v, 2) });
    sim.out('l', 'Suma total ∫e<sup>iay²</sup>dy = √(π/a) e<sup>iπ/4</sup>: módulo · fase · semiancho de la primera zona de Fresnel y<sub>F</sub> = √(π/a)', { hl: true });
    sim.out('p', 'Suma parcial con |y| ≤ Y: módulo, fase y fracción del módulo total');
    sim.out('o', 'Los caminos con |y| ≲ y<sub>F</sub>/2 ya aportan ≈ 97 % del módulo total; los lejanos solo hacen girar la suma alrededor del punto límite (se cancelan por la fase rápida)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, a = sim.p.a, Y = sim.p.Y, k = Math.sqrt((2 * a) / PI), q = 2 * Math.sqrt(PI / (2 * a));
      EM.draw.clear(cv);
      const Ymax = 4, n = 400, pts = Array.from({ length: n + 1 }, (_, i) => { const y = (Ymax * i) / n, f = PT.fresnel(y * k); return [q * f.C, q * f.S]; }), lim = Math.sqrt(PI / a);
      const R = Math.max(lim * 1.5, 0.3), sz = Math.min(W * 0.46, H - 20), x0 = 20, y0 = (H - sz) / 2;
      const px = (re) => x0 + sz / 2 + (re / (2 * R)) * sz, py = (im) => y0 + sz / 2 - (im / (2 * R)) * sz;
      ctx.save(); ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1; ctx.strokeRect(x0, y0, sz, sz); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, y0 + sz / 2); ctx.lineTo(x0 + sz, y0 + sz / 2); ctx.moveTo(x0 + sz / 2, y0); ctx.lineTo(x0 + sz / 2, y0 + sz); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = EM.alpha('--ink-3', 0.5); ctx.lineWidth = 1.2; ctx.beginPath(); pts.forEach(([re, im], i) => (i ? ctx.lineTo(px(re), py(im)) : ctx.moveTo(px(re), py(im)))); ctx.stroke();
      const m = Math.max(1, Math.round((Y / Ymax) * n)); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.6; ctx.beginPath(); pts.slice(0, m + 1).forEach(([re, im], i) => (i ? ctx.lineTo(px(re), py(im)) : ctx.moveTo(px(re), py(im)))); ctx.stroke();
      const cur = (() => { const f = PT.fresnel(Y * k); return [q * f.C, q * f.S]; })();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(px(cur[0]), py(cur[1]), 5, 0, 2 * PI); ctx.fill(); ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(px(lim * Math.SQRT1_2), py(lim * Math.SQRT1_2), 5, 0, 2 * PI); ctx.fill(); ctx.restore();
      EM.text(ctx, 'Re', x0 + sz - 4, y0 + sz / 2 - 6, { size: 11, color: '--ink-2', align: 'right' }); EM.text(ctx, 'Im', x0 + sz / 2 + 6, y0 + 12, { size: 11, color: '--ink-2' }); EM.text(ctx, 'suma de caminos (espiral de Cornu)', x0 + sz / 2, y0 - 6, { size: 11.5, align: 'center', color: '--ink-2' });
      const ys = Array.from({ length: 1201 }, (_, i) => -4 + (8 * i) / 1200), pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -4, xmax: 4, ymin: -1.2, ymax: 1.2, xlabel: 'y (desvío del camino respecto del clásico)', ylabel: 'Re exp(i a y²)', ml: 46, mr: 8, title: 'Integrando: el desvío y de los caminos' });
      pl.frame(); pl.xy(ys, ys.map((y) => Math.cos(a * y * y)), { color: '--accent', width: 1.4 }); pl.band(-Y, Y, { color: '--accent', alpha: 0.12 }); pl.vline(Math.sqrt(PI / a), { color: '--c3', dash: [4, 3] }); pl.vline(-Math.sqrt(PI / a), { color: '--c3', dash: [4, 3] });
      const modp = Math.hypot(cur[0], cur[1]), php = Math.atan2(cur[1], cur[0]);
      sim.set('l', `|S| = ${EM.fix(lim, 4)} · fase 45° · y_F = ${EM.fix(Math.sqrt(PI / a), 4)}`);
      sim.set('p', `|S_Y| = ${EM.fix(modp, 4)} · fase ${EM.fix((php * 180) / PI, 1)}° · ${EM.fix((modp / lim) * 100, 1)} % del total`);
    });
  });

  /* 36.2 El producto de Trotter en tiempo imaginario */
  EM.defineSim('euclideano', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('v', { label: 'Potencial', options: [['ho', POT.ho.n], ['dw', POT.dw.n]], value: 'ho' });
    sim.slider('b', { label: 'Temperatura inversa β = tiempo imaginario total', min: 0.3, max: 6, step: 0.1, value: 3, fmt: (v) => EM.fix(v, 1) });
    sim.slider('k', { label: 'Cortes N = 2^k del camino', min: 1, max: 8, step: 1, value: 4, fmt: (v) => '2^' + v.toFixed(0) + ' = ' + 2 ** Math.round(v) });
    sim.out('z', 'Función de partición Z = Tr e<sup>−βH</sup> y ⟨x²⟩ con N cortes · valor exacto (oscilador: ½ coth(β/2); doble pozo: referencia con N = 512)', { hl: true });
    sim.out('e', 'Error relativo de ⟨x²⟩ · cociente con el error a N/2 (≈ 4 si el error es de segundo orden en ε = β/N)');
    sim.out('t', 'Paso ε = β/N (tiempo imaginario de cada tramo) y número de «caminos» por tramo: el núcleo libre e<sup>−(Δx)²/2ε</sup> se multiplica por e<sup>−εV</sup>');
    const MM = 121, Lg = 6;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, v = sim.p.v, V = POT[v].f, b = sim.p.b, k = Math.round(sim.p.k);
      EM.draw.clear(cv);
      const calc = (kk) => { const T = PT.trotter(V, -Lg, Lg, MM, b, 2 ** kk); return { T, r: PT.trotterX2(T) }; };
      const cur = calc(k), ref = calc(9), x2ex = v === 'ho' ? PT.x2HO(b) : ref.r.x2, errs = [];
      for (let kk = 1; kk <= 8; kk++) errs.push(Math.abs(kk === k ? cur.r.x2 - x2ex : calc(kk).r.x2 - x2ex) / x2ex);
      const T = cur.T, xs = Array.from(T.xs), d = xs.map((_, i) => T.rho[i * T.M + i] / cur.r.Z), dr = xs.map((_, i) => ref.T.rho[i * ref.T.M + i] / ref.r.Z);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: -3.5, xmax: 3.5, ymin: 0, ymax: Math.max(...dr) * 1.2, xlabel: 'x', ylabel: 'densidad térmica ρ(x, x; β)/Z', ml: 52, mr: 8, title: 'Producto de Trotter vs referencia' });
      pl.frame(); pl.xy(xs, dr, { color: '--ink-3', width: 3, alpha: 0.5 }); pl.xy(xs, d, { color: '--accent', width: 2.2 }); pl.legend([{ label: 'referencia (N = 512)', color: '--ink-3' }, { label: `N = ${2 ** k}`, color: '--accent' }], 'tr');
      const ks = Array.from({ length: 8 }, (_, i) => b / 2 ** (i + 1)), q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: b / 300, xmax: b, ymin: 1e-7, ymax: 1, xlog: true, ylog: true, xlabel: 'paso ε = β/N', ylabel: 'error relativo de ⟨x²⟩', ml: 56, mr: 10, title: 'Convergencia: error ∝ ε²' });
      q.frame(); q.xy(ks, errs.map((e) => Math.max(e, 1e-9)), { color: '--c2', width: 2.2, marker: true }); q.xy([b / 256, b / 2], [errs[7] * 1 || 1e-9, errs[7] * Math.pow(128, 2)], { color: '--ink-3', width: 1, dash: [4, 3] }); q.dot(b / 2 ** k, Math.max(errs[k - 1], 1e-9), { color: '--accent', r: 6 });
      sim.set('z', `Z = ${EM.fix(cur.r.Z, 5)}${v === 'ho' ? ` (exacto ${EM.fix(PT.zHO(b), 5)})` : ''} · ⟨x²⟩ = ${EM.fix(cur.r.x2, 5)} · exacto ${EM.fix(x2ex, 5)}`);
      sim.set('e', `${EM.sci(errs[k - 1], 3)} · cociente ${k > 1 ? EM.fix(errs[k - 2] / errs[k - 1], 2) : '—'}`);
      sim.set('t', `ε = ${EM.fix(b / 2 ** k, 4)} · anchura del núcleo libre √ε = ${EM.fix(Math.sqrt(b / 2 ** k), 3)}`);
    });
  });

  /* 36.3 Monte Carlo de integrales de camino */
  EM.defineSim('pimc', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('v', { label: 'Potencial', options: [['ho', POT.ho.n], ['dw', POT.dw.n]], value: 'ho' });
    sim.slider('b', { label: 'Temperatura inversa β', min: 0.5, max: 8, step: 0.5, value: 4, fmt: (v) => EM.fix(v, 1) });
    sim.slider('P', { label: 'Cuentas P del camino (ε = β/P)', min: 4, max: 64, step: 4, value: 16, fmt: (v) => v.toFixed(0) });
    sim.slider('s', { label: 'Barridos de Monte Carlo', min: 2000, max: 60000, step: 2000, value: 20000, fmt: (v) => v.toFixed(0) });
    let seed = 3; sim.button('Otra semilla', () => { seed += 1; sim.redraw && sim.redraw(); });
    sim.out('m', '⟨x²⟩ por Monte Carlo (± error de bloques) · valor del continuo (oscilador: ½ coth(β/2); doble pozo: Trotter N = 512)', { hl: true });
    sim.out('d', 'Con la acción discreta de P cuentas el valor exacto es ⟨x²⟩<sub>P</sub> (oscilador: fórmula cerrada) · aceptación de los movimientos');
    sim.out('i', 'Cada camino cerrado x(τ), 0 ≤ τ ≤ β, es una configuración; el histograma de las posiciones reproduce la densidad térmica ρ(x, x)/Z');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, v = sim.p.v, V = POT[v].f, b = sim.p.b, Pn = Math.round(sim.p.P);
      EM.draw.clear(cv);
      const hist = { min: -3.5, max: 3.5, n: 70, c: new Float64Array(70) }, r = PT.pimc(V, b, Pn, { seed, sweeps: Math.round(sim.p.s), L: 8, hist, keep: Math.max(1, Math.floor(sim.p.s / 6)), x0: v === 'dw' ? 1 : 0 });
      const T = PT.trotter(V, -6, 6, 121, b, 512), tz = PT.trotterX2(T), x2c = v === 'ho' ? PT.x2HO(b) : tz.x2;
      const total = hist.c.reduce((s, x) => s + x, 0), dxh = (hist.max - hist.min) / hist.n, hx = Array.from({ length: hist.n }, (_, i) => hist.min + (i + 0.5) * dxh), hy = Array.from(hist.c, (c) => c / total / dxh);
      const px = Array.from(T.xs), py = px.map((_, i) => T.rho[i * T.M + i] / tz.Z);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: b, ymin: -3.2, ymax: 3.2, xlabel: 'tiempo imaginario τ', ylabel: 'x(τ)', ml: 48, mr: 8, title: 'Caminos cerrados muestreados' });
      pl.frame(); const cols = ['--c1', '--c2', '--c3', '--c4', '--accent', '--ink-3'];
      r.paths.slice(0, 6).forEach((p, j) => pl.path(Array.from(p).concat([p[0]]).map((x, i) => [(b * i) / Pn, x]), { color: cols[j % cols.length], width: 1.6 }));
      const q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -3.5, xmax: 3.5, ymin: 0, ymax: Math.max(...hy, ...py) * 1.2, xlabel: 'x', ylabel: 'densidad de probabilidad', ml: 52, mr: 8, title: 'Histograma de las cuentas frente a ρ(x, x)/Z' });
      q.frame(); q.xy(hx, hy, { color: '--accent', width: 2, fill: '--accent', fillAlpha: 0.18 }); q.xy(px, py, { color: '--c3', width: 2.2, dash: [5, 3] });
      sim.set('m', `${EM.fix(r.x2, 4)} ± ${EM.fix(r.err, 4)} · continuo ${EM.fix(x2c, 4)}`);
      sim.set('d', `${v === 'ho' ? 'exacto con P = ' + Pn + ': ' + EM.fix(PT.hoDiscrete(b, Pn), 4) : 'doble pozo: sin fórmula cerrada'} · aceptación ${EM.fix(r.accept * 100, 1)} %`);
    });
  });
})();
