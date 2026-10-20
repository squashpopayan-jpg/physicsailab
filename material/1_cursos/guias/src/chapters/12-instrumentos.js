/* Capítulo 12 — Instrumentos caseros y calibración */
(function () {
  'use strict';
  const EM = window.EM, L = EM.L, D = EM.draw;

  EM.defineSim('calibracion-dinamometro', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.seg('tipo', { label: 'Elemento elástico', options: [['res', 'Resorte de acero'], ['cau', 'Banda de caucho']], value: 'res' });
    sim.slider('mmax', { label: 'Carga máxima', min: 0.1, max: 0.5, step: 0.05, value: 0.3, unit: 'kg', fmt: (v) => EM.fix(v, 2) });
    sim.check('desc', { label: 'Medir también al descargar', value: true });
    sim.out('k', 'Pendiente del ajuste (carga)', { hl: true });
    sim.out('r', 'Mayor residuo');
    sim.out('h', 'Máxima diferencia carga–descarga');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g = EM.local().g;
      D.clear(cv);
      const r = L.rng(31), F = [], xc = [], xd = [];
      const k = 22, G0 = 0.9, L0 = 0.08; /* resorte 22 N/m; caucho: neo-Hooke con G·A0 = 0,9 N y largo 8 cm */
      const xCau = (f) => { let lo = 1, hi = 6; for (let i = 0; i < 60; i++) { const lm = (lo + hi) / 2; if (G0 * (lm - 1 / (lm * lm)) < f) lo = lm; else hi = lm; } return L0 * ((lo + hi) / 2 - 1); };
      const n = Math.round(p.mmax / 0.05);
      for (let i = 0; i <= n; i++) {
        const f = i * 0.05 * g;
        F.push(f);
        const base = p.tipo === 'res' ? f / k : xCau(f);
        xc.push(L.quant(base + r.gauss(0, 0.0004), 0.001));
        const hist = p.tipo === 'res' ? 0 : 0.012 * 4 * (i / n) * (1 - i / n) + 0.002 * (1 - i / n) * (i > 0 ? 1 : 0);
        xd.push(L.quant(base + hist + r.gauss(0, 0.0004), 0.001));
      }
      const fit = L.fitLine(F, xc.map((x) => x * 100));
      const xmax = Math.max(...xc, ...xd) * 100 * 1.15;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(...F) * 1.08, ymin: 0, ymax: xmax, xlabel: 'fuerza F = mg (N)', ylabel: 'alargamiento x (cm)' });
      pl.frame();
      pl.fn(fit.f, { color: '--c2', width: 1.8 });
      L.puntos(pl, F, xc.map((x) => x * 100), { color: '--c1' });
      if (p.desc) L.puntos(pl, F, xd.map((x) => x * 100), { color: '--c4', r: 3.5 });
      pl.legend([{ label: 'carga', color: '--c1', kind: 'dot' }].concat(p.desc ? [{ label: 'descarga', color: '--c4', kind: 'dot' }] : []).concat([{ label: 'recta ajustada a la carga', color: '--c2' }]), 'tl');
      const res = F.map((f, i) => xc[i] * 100 - fit.f(f));
      sim.set('k', L.pm(fit.m, fit.sm, 'cm/N') + ' → k = ' + EM.fix(100 / fit.m, 1) + ' N/m');
      sim.set('r', EM.fix(Math.max(...res.map(Math.abs)) * 10, 1) + ' mm');
      sim.set('h', p.desc ? EM.fix(Math.max(...xd.map((x, i) => Math.abs(x - xc[i]))) * 1000, 1) + ' mm' : '—');
    });
  });

  EM.defineSim('video-fps', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.seg('fps', { label: 'Cuadros por segundo', options: [[30, '30'], [60, '60'], [120, '120'], [240, '240']], value: 30 });
    sim.slider('h', { label: 'Altura de caída', min: 0.3, max: 2, step: 0.1, value: 1, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('D', { label: 'Distancia de la cámara al plano del movimiento', min: 0.8, max: 3, step: 0.1, value: 1.5, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('dp', { label: 'Regla más cerca de la cámara que el objeto', min: 0, max: 0.2, step: 0.01, value: 0, unit: 'cm', fmt: (v) => EM.fix(v * 100, 0) });
    sim.button('Otro lanzamiento', () => { seed = L.semilla(); }, { primary: true });
    sim.out('g', 'g de este video', { hl: true });
    sim.out('s', 'Dispersión en 300 videos');
    sim.out('sis', 'Error sistemático por paralaje');
    let seed = 99;
    const gen = (rnd, p, g) => {
      const t0 = rnd() / p.fps, ts = [], ys = [];
      const campo = 1.2 * p.h + 0.2, px = campo / 1080; /* video vertical de 1080 px que cubre la caída */
      const esc = (p.D - p.dp) / p.D;
      for (let k = 0; ; k++) { const t = t0 + k / p.fps, y = 0.5 * g * t * t; if (y > p.h) break; ts.push(k / p.fps); ys.push(L.quant(y * esc + rnd.gauss(0, 1.2 * px), px)); }
      return { ts, ys };
    };
    const ajusteG = (ts, ys) => { const f = L.fitLM((t, q) => q[0] + q[1] * t + 0.5 * q[2] * t * t, [0, 0, 9], ts, ys); return f; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g = EM.local().g;
      D.clear(cv);
      const { ts, ys } = gen(L.rng(seed), p, g);
      const f = ts.length >= 4 ? ajusteG(ts, ys) : null;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(0.1, ts[ts.length - 1] || 0.5) * 1.08, ymin: 0, ymax: p.h * 1.08, xlabel: 't (s)', ylabel: 'y medida (m)' });
      pl.frame();
      if (f) pl.fn(f.f, { color: '--c2', width: 2 });
      L.puntos(pl, ts, ys, { r: 3.5 });
      const gs = [];
      const rr = L.rng(seed + 1);
      for (let k = 0; k < 300; k++) { const d = gen(rr, p, g); if (d.ts.length >= 4) { const q = ajusteG(d.ts, d.ys); if (q) gs.push(q.p[2]); } }
      sim.set('g', f ? L.pm(f.p[2], f.sp[2], 'm/s²') + ' · ' + ts.length + ' cuadros' : 'muy pocos cuadros');
      sim.set('s', gs.length ? 'σ = ' + EM.fix(L.std(gs), 3) + ' m/s² (' + EM.fix((100 * L.std(gs)) / g, 2) + ' %)' : '—');
      sim.set('sis', EM.fix((-100 * p.dp) / p.D, 1) + ' % en todas las longitudes');
    });
  });
})();
