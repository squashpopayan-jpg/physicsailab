/* Capítulo 14 — Mesetas y perfiles */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab, St = () => ML.L.stats;
  const dsOptions = [['m1', 'M1 · 3.4 meses'], ['m5', 'M5 · 17 meses']];
  const VARIANTS = { tocar: {}, ema: { modo: 'ema', maxdist: 12, rechazo: false } };
  const LIBRE = { slmin: 0, slmax: 999, tpmin: 0, tpmax: 999 };
  const SLK = [0.4, 0.6, 0.8, 1.0, 1.3, 1.6, 2.0], TPK = [0.8, 1.1, 1.4, 1.8, 2.4, 3.0, 4.0];

  /* ======================================================================
     14.1 Mapa stop × take profit
     ====================================================================== */
  ML.defineSim('mapa-parametros', function (sim) {
    const cv = sim.canvas({ aspect: 1.55, maxH: '430px' });
    sim.group('Mapa');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    sim.seg('v', { label: 'Regla', options: [['tocar', 'Manual (tocar)'], ['ema', 'EMA sin rechazo']], value: 'tocar' });
    sim.seg('mode', { label: 'Mostrar', options: [['sig', 'Señal'], ['nul', 'Azar'], ['dif', 'Señal − azar']], value: 'sig' });
    sim.check('smooth', { label: 'Mostrar el valor suavizado (vecindad 3×3)', value: false });
    sim.out('cell', 'Celda seleccionada', { hl: true, wide: true });
    sim.out('best', 'Mejor celda bruta · mejor suavizada', { wide: true });
    sim.out('avg', 'Promedio de todas las celdas · celdas positivas');
    let D = null, sel = [4, 5], hit = null;
    const cache = {};
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    function grids(key, ds, v) {
      if (cache[key]) return cache[key];
      const { S, X } = B().get(D, ds), base = Object.assign({}, VARIANTS[v], LIBRE);
      const sig = B().grid(S, X, E().params(base), 'tpk', TPK, 'slk', SLK, 10);
      cache[key] = { sig, nul: null, S, X, base };
      return cache[key];
    }
    function nullGrid(g) {
      if (g.nul) return g.nul;
      const P0 = E().params(VARIANTS[g.base.modo === 'ema' ? 'ema' : 'tocar']), sc = E().scan(g.X, P0), un = E().scanBias(g.X, P0), pr = sc.ci.length / un.ci.length;
      const reps = [];
      for (let r = 0; r < 20; r++) {
        const rng = St().rng(r * 13 + 1), ci = [], cs = [], ca = [];
        for (let q = 0; q < un.ci.length; q++) if (rng() < pr) { ci.push(un.ci[q]); cs.push(un.cs[q]); ca.push(un.ca[q]); }
        reps.push({ ci: Int32Array.from(ci), cs: Int8Array.from(cs), ca: Float64Array.from(ca) });
      }
      g.nul = SLK.map((a) => TPK.map((b) => { const Q = E().params(Object.assign({}, g.base, { slk: a, tpk: b })); const v = reps.map((c) => { const tr = E().run(g.S, g.X, Q, c); return tr.length ? tr.reduce((s, t) => s + t.R, 0) / tr.length : NaN; }).filter((x) => x === x); return { n: 0, m: St().mean(v), se: St().sd(v) }; }));
      return g.nul;
    }
    ML.pointer(cv, { down: (x, y) => { if (!hit) return null; const c = hit.cell(x, y); if (c) { sel = c; sim.redraw(); } return null; } });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, g = grids(p.ds + '|' + p.v, p.ds, p.v);
      let G = g.sig.map((row) => row.map((c) => c.m));
      let SE = g.sig.map((row) => row.map((c) => c.se));
      if (p.mode === 'nul' || p.mode === 'dif') {
        const N = nullGrid(g);
        G = p.mode === 'nul' ? N.map((r) => r.map((c) => c.m)) : G.map((r, i) => r.map((v, j) => v - N[i][j].m));
      }
      const Gm = G.map((r) => r.map((v) => ({ m: v })));
      const Sm = B().smooth(Gm);
      const show = p.smooth ? Sm : G;
      const flat = G.flat().filter((v) => v === v), vmax = Math.max(0.3, ...flat.map(Math.abs));
      const rect = { x: 60, y: 14, w: cv.w - 76, h: cv.h - 66 };
      let bi = [0, 0], bs = [0, 0], mv = -9, ms = -9;
      G.forEach((row, i) => row.forEach((v, j) => { if (v === v && v > mv) { mv = v; bi = [i, j]; } if (Sm[i][j] === Sm[i][j] && Sm[i][j] > ms) { ms = Sm[i][j]; bs = [i, j]; } }));
      hit = ML.draw.heat(cv.ctx, rect, show, { vmax, sel, mark: (r, c) => (r === bi[0] && c === bi[1]) || (r === bs[0] && c === bs[1]), text: (v) => (v >= 0 ? '+' : '') + ML.fix(v, 2), xlabels: TPK.map((b) => ML.fix(b, 1)), ylabels: SLK.map((a) => ML.fix(a, 1)), xtitle: 'Take profit (× ATR14 M15)', ytitle: 'Stop (× ATR)' });
      const c = sel, cell = g.sig[c[0]][c[1]];
      sim.set('cell', 'stop ' + SLK[c[0]] + ' ATR · TP ' + TPK[c[1]] + ' ATR → ' + (p.mode === 'sig' ? 'n = ' + cell.n + ' · R ' + ML.R(cell.m, 3) + ' ± ' + ML.fix(1.96 * cell.se, 2) : ML.R(G[c[0]][c[1]], 3)) + ' · suavizado ' + ML.R(Sm[c[0]][c[1]], 3));
      sim.set('best', 'stop ' + SLK[bi[0]] + ' / TP ' + TPK[bi[1]] + ' (' + ML.R(mv, 2) + ') · stop ' + SLK[bs[0]] + ' / TP ' + TPK[bs[1]] + ' (' + ML.R(ms, 2) + ')');
      sim.set('avg', ML.R(St().mean(flat), 3) + ' · ' + flat.filter((v) => v > 0).length + ' de ' + flat.length);
    });
  });

  /* ======================================================================
     Perfil de sensibilidad de un parámetro (reutilizable en capítulos 16–18)
     ====================================================================== */
  const PARAMS = {
    w1m: { label: 'Extremo corto (min)', vals: [10, 15, 20, 30, 45, 60, 90], ref: 30 },
    w2m: { label: 'Extremo medio (min)', vals: [60, 90, 120, 180, 240, 360], ref: 120 },
    maxdist: { label: 'Anti-persecución (pips)', vals: [2, 4, 6, 8, 12, 16, 20, 30], ref: 8 },
    banda: { label: 'Banda neutra H4 (pips)', vals: [0, 15, 50, 100, 200, 300, 400], ref: 15 },
    dema: { label: 'Distancia a la EMA20 (pips)', vals: [0, 10, 20, 40, 60, 80], ref: 0 },
    slk: { label: 'Stop = k × ATR', vals: [0.3, 0.5, 0.8, 1.2, 1.6, 2.0], ref: 0.8, extra: LIBRE },
    tpk: { label: 'Take profit = k × ATR (stop 0.5 ATR)', vals: [0.6, 1.0, 1.4, 2.0, 3.0, 4.0], ref: 1.4, extra: Object.assign({ slk: 0.5 }, LIBRE) },
    sldact: { label: 'SL defensivo: activación (pips)', vals: [10, 15, 20, 30, 40, 60], ref: 20 },
    sldpips: { label: 'SL defensivo: nuevo stop (−pips)', vals: [0, 10, 20, 30, 40], ref: 20 },
    beratio: { label: 'Break-even: fracción del TP', vals: [0.15, 0.25, 0.42, 0.6, 0.8], ref: 0.42 },
    bemargin: { label: 'Break-even: margen (pips)', vals: [0, 5, 10, 20, 30], ref: 5 },
    stagmin: { label: 'Estancamiento: minutos', vals: [15, 30, 45, 60, 90, 120], ref: 30 },
    tstop: { label: 'Cierre forzoso (min. del día)', vals: [780, 860, 960, 1080, 1200], ref: 1200, fmt: (v) => E().hhmm(v) },
    ws: { label: 'Inicio de entradas (min. del día)', vals: [420, 480, 537, 600, 660], ref: 537, fmt: (v) => E().hhmm(v) },
    we: { label: 'Fin de entradas (min. del día)', vals: [660, 720, 780, 900, 1020], ref: 780, fmt: (v) => E().hhmm(v) }
  };
  ML.SWEEP_PARAMS = PARAMS;
  ML.sweepSim = function (sim, cfg) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Perfil');
    sim.select('par', { label: 'Parámetro', options: cfg.keys.map((k) => [k, PARAMS[k].label]), value: cfg.keys[0] });
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    sim.seg('v', { label: 'Regla', options: [['tocar', 'Manual (tocar)'], ['ema', 'EMA sin rechazo']], value: cfg.variant || 'tocar' });
    sim.check('nul', { label: 'Comparar con entradas al azar (25 réplicas)', value: false });
    sim.out('note', 'Lectura', { wide: true, hl: true });
    sim.out('rng', 'Rango del R medio · n de operaciones');
    let D = null;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    const fmt = (k, v) => (PARAMS[k].fmt ? PARAMS[k].fmt(v) : ML.fix(v, v % 1 ? 2 : 0));
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, spec = PARAMS[p.par], { S, X } = B().get(D, p.ds);
      const base = E().params(Object.assign({}, VARIANTS[p.v], spec.extra || {}, cfg.base || {}));
      const rows = B().sweep(S, X, base, p.par, spec.vals, 5);
      let nul = null;
      if (p.nul) nul = spec.vals.map((v) => { const Q = Object.assign({}, base); Q[p.par] = v; const r = B().nullRuns(S, X, Q, 25, 5); return r.length ? St().mean(r) : NaN; });
      const lo = Math.min(-0.3, ...rows.map((r) => r.m - 1.96 * r.se).filter((v) => v === v)), hi = Math.max(0.3, ...rows.map((r) => r.m + 1.96 * r.se).filter((v) => v === v));
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.5, xmax: spec.vals.length - 0.5, ymin: lo - 0.05, ymax: hi + 0.05, ml: 56, mb: 52, xlabel: spec.label, ylabel: 'R medio (IC 95 %)', xticks: spec.vals.map((_, i) => i), xfmt: (i) => fmt(p.par, spec.vals[i]) });
      pl.frame();
      pl.hline(0, { color: '--ink', width: 1.3, dash: [] });
      const ri = spec.vals.indexOf(spec.ref);
      if (ri >= 0) pl.vline(ri, { color: '--c4', dash: [4, 3], label: 'manual', labelY: 14 });
      if (nul) pl.xy(spec.vals.map((_, i) => i), nul, { color: '--ink-3', width: 2, dash: [6, 4] });
      ML.draw.errbars(pl, rows.map((r, i) => ({ x: i, m: r.m, lo: r.m - 1.96 * r.se, hi: r.m + 1.96 * r.se, color: r.m >= 0 ? '--c3' : '--c2' })));
      rows.forEach((r, i) => ML.text(cv.ctx, 'n=' + r.n, pl.X(i), pl.iy + pl.ih - 6, { size: 10, mono: true, color: '--ink-3', align: 'center' }));
      const ms = rows.map((r) => r.m).filter((v) => v === v);
      const sep = ms.length ? Math.max(...rows.map((r) => r.m - 1.96 * r.se).filter((v) => v === v)) > Math.min(...rows.map((r) => r.m + 1.96 * r.se).filter((v) => v === v)) : false;
      sim.set('note', ms.length ? (sep ? 'Hay valores cuyos intervalos no se solapan: el parámetro parece importar.' : 'Todos los intervalos se solapan: con esta muestra el parámetro no se puede afinar.') : 'sin operaciones');
      sim.set('rng', ms.length ? ML.R(Math.min(...ms), 2) + ' a ' + ML.R(Math.max(...ms), 2) + ' · n entre ' + Math.min(...rows.map((r) => r.n)) + ' y ' + Math.max(...rows.map((r) => r.n)) : '—');
    });
  };
  ML.defineSim('perfil-1d', (sim) => ML.sweepSim(sim, { keys: ['slk', 'tpk', 'w1m', 'maxdist', 'banda', 'dema', 'sldact', 'beratio', 'stagmin'] }));
})();
