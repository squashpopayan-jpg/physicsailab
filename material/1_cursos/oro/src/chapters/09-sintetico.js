/* Capítulo 9 — Mundos sintéticos */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, Y = () => ML.L.synth, St = () => ML.L.stats, B = () => ML.L.lab;

  /* razón de varianza dentro de la ventana de entradas */
  function vr(S, X, q) {
    const r1 = [], rq = [];
    for (let i = 1; i < S.n; i++) {
      if (X.wd[i] >= 5) continue;
      const a = X.mm[i], b = X.mm[i - 1];
      if (a >= 537 && a < 780 && b >= 537 && b < 780 && X.day[i] === X.day[i - 1]) r1.push(S.c[i] - S.c[i - 1]);
      if (i >= q) { const c0 = X.mm[i - q]; if (a >= 537 && a < 780 && c0 >= 537 && c0 < 780 && X.day[i] === X.day[i - q]) rq.push(S.c[i] - S.c[i - q]); }
    }
    return (St().sd(rq) ** 2) / (q * St().sd(r1) ** 2);
  }
  function hourProfile(S) {
    const s = new Float64Array(24), c = new Float64Array(24);
    for (let i = 0; i < S.n; i++) { const h = Math.floor(((S.t[i] % 1440) + 1440) % 1440 / 60); s[h] += S.h[i] - S.l[i]; c[h]++; }
    return Array.from(s, (v, h) => (c[h] ? v / c[h] : 0));
  }
  function kurt(S) {
    const r = []; for (let i = 1; i < S.n; i++) r.push(S.c[i] - S.c[i - 1]);
    const m = St().mean(r); let m2 = 0, m4 = 0; r.forEach((v) => { const d = v - m; m2 += d * d; m4 += d * d * d * d; });
    m2 /= r.length; m4 /= r.length; return m4 / (m2 * m2);
  }

  /* ======================================================================
     9.1 Mundo sintético frente al real
     ====================================================================== */
  ML.defineSim('mundo-real', function (sim) {
    const cv = sim.canvas({ aspect: 2.3, maxH: '420px' });
    sim.group('Mundo sintético');
    sim.slider('sigma', { label: 'Volatilidad base (USD por M5)', min: 1.5, max: 6, step: 0.1, value: 3.1, fmt: (v) => ML.fix(v, 1) });
    sim.slider('volVol', { label: 'Agrupamiento de volatilidad', min: 0, max: 0.8, step: 0.05, value: 0.35, fmt: (v) => ML.fix(v, 2) });
    sim.slider('jumpP', { label: 'Probabilidad de salto (‰ por vela)', min: 0, max: 10, step: 0.5, value: 2, fmt: (v) => ML.fix(v, 1) });
    sim.slider('trend', { label: 'Momento (tendencia)', min: 0, max: 0.4, step: 0.02, value: 0, fmt: (v) => ML.fix(v, 2) });
    sim.slider('rev', { label: 'Reversión', min: 0, max: 5, step: 0.1, value: 0, fmt: (v) => ML.fix(v, 1) });
    sim.button('Otra semilla', () => { seed++; }, { primary: true });
    sim.out('rng', 'Rango medio de una vela M5', { hl: true });
    sim.out('vr', 'VR(6) · VR(12) · VR(24)');
    sim.out('vrr', 'Oro real');
    sim.out('ku', 'Curtosis de los cambios M5 (sintético · real)');
    let real = null, seed = 1;
    sim.withData(['m5'], (D) => {
      const S = D.m5, X = E().prep(S);
      real = { S, X, prof: hourProfile(S), vr: [6, 12, 24].map((q) => vr(S, X, q)), ku: kurt(S) };
      sim.redraw();
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!real) return;
      const p = sim.p;
      const S = Y().gen({ seed: seed * 17 + 3, days: 80, sigma: p.sigma, volVol: p.volVol, jumpP: p.jumpP / 1000, trend: p.trend, rev: p.rev }), X = E().prep(S);
      const prof = hourProfile(S), v = [6, 12, 24].map((q) => vr(S, X, q));
      const ymax = Math.max(...real.prof, ...prof) * 1.15;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w * 0.6, h: cv.h, xmin: -0.5, xmax: 23.5, ymin: 0, ymax, ml: 48, mb: 44, xlabel: 'Hora UTC', ylabel: 'Rango medio M5 (USD)', xticks: [0, 4, 8, 12, 16, 20] });
      pl.frame();
      ML.draw.bars(pl, prof.map((_, h) => h), prof, 0.7, { color: '--c1', alpha: 0.5 });
      pl.xy(real.prof.map((_, h) => h), real.prof, { color: '--c4', width: 2.4 });
      pl.legend([{ label: 'sintético', color: '--c1', kind: 'sq' }, { label: 'oro real', color: '--c4' }], 'tl');
      const p2 = new ML.Plot(cv.ctx, { x: cv.w * 0.6, y: 0, w: cv.w * 0.4, h: cv.h, xmin: 0.4, xmax: 3.6, ymin: 0, ymax: 1.5, ml: 40, mb: 44, xlabel: 'Horizonte', ylabel: 'VR', xticks: [1, 2, 3], xfmt: (x) => ['30 min', '1 h', '2 h'][x - 1] || '' });
      p2.frame();
      p2.hline(1, { color: '--ink-3', dash: [5, 4] });
      ML.draw.bars(p2, [1, 2, 3], v, 0.5, { color: '--c1', alpha: 0.6 });
      real.vr.forEach((val, i) => { const ctx = cv.ctx, x = p2.X(i + 1), y = p2.Y(val); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = ML.col('--c4'); ctx.strokeStyle = ML.col('--canvas'); ctx.lineWidth = 1.5; ctx.fillRect(-6, -6, 12, 12); ctx.strokeRect(-6, -6, 12, 12); ctx.restore(); });
      const rg = (() => { let s = 0; for (let i = 0; i < S.n; i++) s += S.h[i] - S.l[i]; return s / S.n; })();
      sim.set('rng', ML.usd(rg, 2) + ' <small>(real ' + ML.usd((() => { let s = 0; for (let i = 0; i < real.S.n; i++) s += real.S.h[i] - real.S.l[i]; return s / real.S.n; })(), 2) + ')</small>');
      sim.set('vr', v.map((x) => ML.fix(x, 2)).join(' · '));
      sim.set('vrr', real.vr.map((x) => ML.fix(x, 2)).join(' · '));
      sim.set('ku', ML.fix(kurt(S), 0) + ' · ' + ML.fix(real.ku, 0));
    });
  });

  /* ======================================================================
     9.2 El manual en mundos con distinta memoria
     ====================================================================== */
  ML.defineSim('mundo-estrategia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Experimento');
    sim.slider('nw', { label: 'Mundos por punto', min: 10, max: 60, step: 5, value: 20, fmt: (v) => ML.fix(v, 0) });
    sim.check('costo', { label: 'Incluir spread (0.27)', value: true });
    sim.button('Calcular', () => { run(); }, { primary: true });
    sim.out('st', 'Estado', { wide: true });
    sim.out('real', 'Oro real');
    let res = null, busy = false;
    const MEM = [-3, -1.5, -1, 0, 0.1, 0.2, 0.35];   /* <0: reversión κ = −m·(1); >0: momento */
    const world = (m, seed, sp) => (m < 0 ? { rev: -m, seed, spread: sp } : { trend: m, seed, spread: sp });
    async function run() {
      if (busy) return;
      busy = true;
      const nw = Math.round(sim.p.nw), sp = sim.p.costo ? 0.27 : 0;
      res = [];
      for (let mi = 0; mi < MEM.length; mi++) {
        sim.set('st', 'Calculando… ' + (mi + 1) + ' de ' + MEM.length);
        await new Promise((r) => setTimeout(r, 15));
        const Ra = [], Rn = [];
        for (let w = 0; w < nw; w++) {
          const S = Y().gen(Object.assign({ days: 60 }, world(MEM[mi], 1000 + w, sp))), X = E().prep(S), P = E().params({});
          for (const t of E().run(S, X, P)) Ra.push(t.R);
          const un = E().scanBias(X, P), sc = E().scan(X, P), pr = un.ci.length ? sc.ci.length / un.ci.length : 0, rng = St().rng(w * 7 + mi);
          const ci = [], cs = [], ca = [];
          for (let q = 0; q < un.ci.length; q++) if (rng() < pr) { ci.push(un.ci[q]); cs.push(un.cs[q]); ca.push(un.ca[q]); }
          for (const t of E().run(S, X, P, { ci: Int32Array.from(ci), cs: Int8Array.from(cs), ca: Float64Array.from(ca) })) Rn.push(t.R);
        }
        const f = (a) => ({ m: St().mean(a), se: St().sd(a) / Math.sqrt(a.length), n: a.length });
        res.push({ mem: MEM[mi], a: f(Ra), n: f(Rn) });
        sim.redraw();
      }
      busy = false;
      sim.set('st', 'Listo: ' + res.reduce((a, r) => a + r.a.n, 0) + ' operaciones de la estrategia en ' + nw * MEM.length + ' mundos');
      sim.redraw();
    }
    sim.set('st', 'Pulse «Calcular» (tarda unos segundos)');
    sim.set('real', 'reversión ≈ 1 (VR 0.93 · 0.87 · 0.74)');
    sim.onDraw(() => {
      ML.draw.clear(cv);
      /* eje x lineal en el índice de la lista para repartir bien los puntos */
      const idx = (m) => MEM.indexOf(m);
      const pl2 = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.5, xmax: MEM.length - 0.5, ymin: -0.4, ymax: 0.4, ml: 54, mb: 52, xlabel: 'Memoria del mercado:  ← reversión fuerte  ·  sin memoria  ·  momento fuerte →', ylabel: 'R medio por operación', xticks: MEM.map((_, i) => i), xfmt: (i) => (MEM[i] < 0 ? 'rev ' + ML.fix(-MEM[i], 1) : MEM[i] > 0 ? 'mom ' + ML.fix(MEM[i], 2) : '0') });
      pl2.frame();
      pl2.hline(0, { color: '--ink', width: 1.4, dash: [] });
      pl2.vline(idx(-1), { color: '--c4', dash: [4, 3], label: 'oro real ≈ rev 1', labelY: 14 });
      if (!res) { ML.text(cv.ctx, 'Pulse «Calcular»', cv.w / 2, cv.h / 2, { size: 14, color: '--ink-3', align: 'center' }); return; }
      ML.draw.errbars(pl2, res.map((r, i) => ({ x: i - 0.08, m: r.a.m, lo: r.a.m - 1.96 * r.a.se, hi: r.a.m + 1.96 * r.a.se, color: '--accent' })));
      ML.draw.errbars(pl2, res.map((r, i) => ({ x: i + 0.08, m: r.n.m, lo: r.n.m - 1.96 * r.n.se, hi: r.n.m + 1.96 * r.n.se, color: '--ink-3' })));
      pl2.legend([{ label: 'estrategia del manual', color: '--accent', kind: 'dot' }, { label: 'entradas al azar', color: '--ink-3', kind: 'dot' }], 'tr');
    });
  });
})();
