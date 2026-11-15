/* Capítulo 22 — Variantes */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, Y = () => ML.L.synth, B = () => ML.L.lab, St = () => ML.L.stats;
  const dsOptions = [['m1', 'M1 · 3.4 meses'], ['m5', 'M5 · 17 meses']];
  const VAR = [
    ['Tocar y rechazar (manual)', {}],
    ['Zona H120 + EMA 40 (v1.2)', { modo: 'zona', dema: 40 }],
    ['Zona H120 sin EMA', { modo: 'zona', dema: 0 }],
    ['Rechazo en la EMA20', { modo: 'ema', maxdist: 12 }],
    ['Rechazo EMA20 sin vela', { modo: 'ema', maxdist: 12, rechazo: false }],
    ['Ruptura (momento)', { modo: 'ruptura', maxdist: 15 }],
    ['Manual + contra-tendencia', { contra: true }],
    ['Tocar con extremo de 15 min', { w1m: 15 }],
    ['Tocar con extremo de 60 min', { w1m: 60 }],
    ['Tocar, solo compras', { dir: 'compra' }],
    ['Tocar, solo ventas', { dir: 'venta' }]
  ];
  const K = VAR.length, BONF = () => St().normInv(1 - 0.05 / (2 * K));

  ML.defineSim('comparar-variantes', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, maxH: '440px' });
    sim.group('Datos');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    sim.out('thr', 'Umbral de |t| con K = 11 pruebas', { hl: true });
    sim.out('best', 'Mejor variante (t) · variantes por encima del umbral');
    let D = null;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    const cache = {};
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, { S, X } = B().get(D, p.ds);
      if (!cache[p.ds]) cache[p.ds] = VAR.map(([, kw]) => { const P = E().params(kw), tr = E().run(S, X, P), st = E().stats(tr, P), nu = B().nullRuns(S, X, P, 25, 9); return { st, nu: nu.length ? St().mean(nu) : NaN }; });
      const rows = cache[p.ds], z = BONF();
      const ctx = cv.ctx, W = cv.w, H = cv.h, x0 = 210, x1 = W - 20, top = 18, rh = (H - top - 40) / K;
      const lo = -0.7, hi = 0.7, X0 = (v) => x0 + (x1 - x0) * (v - lo) / (hi - lo);
      ctx.strokeStyle = ML.col('--grid'); ctx.lineWidth = 1;
      for (let v = -0.6; v <= 0.61; v += 0.2) { ctx.beginPath(); ctx.moveTo(X0(v), top); ctx.lineTo(X0(v), H - 34); ctx.stroke(); ML.text(ctx, ML.fix(v, 1), X0(v), H - 18, { size: 10.5, mono: true, color: '--ink-3', align: 'center' }); }
      ctx.strokeStyle = ML.col('--ink'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X0(0), top); ctx.lineTo(X0(0), H - 34); ctx.stroke();
      ML.text(ctx, 'R medio por operación', (x0 + x1) / 2, H - 2, { size: 11.5, color: '--ink-2', align: 'center' });
      let nb = 0, bi = 0;
      rows.forEach((r, i) => {
        const y = top + i * rh + rh / 2, s = r.st;
        ML.text(ctx, VAR[i][0], x0 - 10, y, { size: 11.5, color: '--ink-2', align: 'right', baseline: 'middle' });
        if (!s.n) return;
        const t = s.avgR / s.seR; if (Math.abs(t) > z) nb++; if (t > rows[bi].st.avgR / rows[bi].st.seR) bi = i;
        const col = ML.col(s.avgR >= 0 ? '--c3' : '--c2');
        ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(X0(Math.max(lo, s.avgR - z * s.seR)), y); ctx.lineTo(X0(Math.min(hi, s.avgR + z * s.seR)), y); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(X0(Math.max(lo, s.avgR - 1.96 * s.seR)), y); ctx.lineTo(X0(Math.min(hi, s.avgR + 1.96 * s.seR)), y); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X0(s.avgR), y, 4.4, 0, 7); ctx.fill();
        if (r.nu === r.nu) { ctx.save(); ctx.translate(X0(r.nu), y); ctx.rotate(Math.PI / 4); ctx.fillStyle = ML.col('--ink-3'); ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore(); }
        ML.text(ctx, 'n=' + s.n + ' · t=' + ML.fix(t, 1), x1, y - rh * 0.28, { size: 9.5, mono: true, color: '--ink-3', align: 'right' });
      });
      sim.set('thr', ML.fix(z, 2) + ' (en lugar de 1.96)');
      const b = rows[bi].st;
      sim.set('best', VAR[bi][0] + ' (t = ' + ML.fix(b.avgR / b.seR, 2) + ') · ' + nb + ' de ' + K);
    });
  });

  ML.defineSim('familia-memoria', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Experimento');
    sim.slider('nw', { label: 'Mundos por barra', min: 10, max: 40, step: 5, value: 15, fmt: (v) => ML.fix(v, 0) });
    sim.button('Calcular', () => { run(); }, { primary: true });
    sim.out('st', 'Estado', { wide: true });
    const FAM = [['tocar', { modo: 'tocar' }], ['ema', { modo: 'ema', maxdist: 12 }], ['ruptura', { modo: 'ruptura', maxdist: 15 }]];
    const WORLDS = [['reversión', { rev: 1 }], ['sin memoria', {}], ['momento', { trend: 0.1 }]];
    let res = null, busy = false;
    async function run() {
      if (busy) return; busy = true; res = null;
      const nw = Math.round(sim.p.nw), R = FAM.map(() => WORLDS.map(() => []));
      for (let w = 0; w < nw; w++) {
        sim.set('st', 'Calculando mundo ' + (w + 1) + ' de ' + nw + '…');
        await new Promise((r) => setTimeout(r, 5));
        WORLDS.forEach(([, wk], wi) => {
          const S = Y().gen(Object.assign({ days: 60, seed: 4000 + w * 3 + wi }, wk)), X = E().prep(S);
          FAM.forEach(([, fk], fi) => { for (const t of E().run(S, X, E().params(fk))) R[fi][wi].push(t.R); });
        });
        if (w % 3 === 2) { res = R.map((row) => row.map((a) => ({ m: St().mean(a), se: St().sd(a) / Math.sqrt(a.length) }))); sim.redraw(); }
      }
      res = R.map((row) => row.map((a) => ({ m: St().mean(a), se: St().sd(a) / Math.sqrt(a.length) })));
      busy = false; sim.set('st', 'Listo'); sim.redraw();
    }
    sim.set('st', 'Pulse «Calcular» (unos 10 s)');
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.4, xmax: 3.6, ymin: -0.45, ymax: 0.45, ml: 54, mb: 46, ylabel: 'R medio (IC 95 %)', xticks: [1, 2, 3], xfmt: (v) => WORLDS[v - 1] ? 'mundo de ' + WORLDS[v - 1][0] : '' });
      pl.frame();
      pl.hline(0, { color: '--ink', width: 1.3, dash: [] });
      const cols = ['--accent', '--c4', '--c5'];
      if (res && res.length) FAM.forEach((f, fi) => ML.draw.errbars(pl, WORLDS.map((_, wi) => ({ x: wi + 1 + (fi - 1) * 0.22, m: res[fi][wi].m, lo: res[fi][wi].m - 1.96 * res[fi][wi].se, hi: res[fi][wi].m + 1.96 * res[fi][wi].se, color: cols[fi] }))));
      pl.legend(FAM.map((f, i) => ({ label: f[0], color: cols[i], kind: 'dot' })), 'tr');
    });
  });
})();
