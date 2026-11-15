/* Capítulo 11 — Laboratorio de backtest */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab, St = () => ML.L.stats;

  const PRESETS = {
    manual: {},
    v12: { modo: 'zona', dema: 40 },
    cand: { slk: 0.5, slmin: 20, slmax: 80, tpk: 2.5, tpmin: 100, tpmax: 300, sld: false, beratio: 0.2, bemargin: 5, stag: false }
  };
  const REASON_COL = { TP: '--c3', BE: '--c1', SLD: '--c4', STAG: '--c5', SL: '--c2', TIME: '--ink-3', END: '--ink-3' };

  ML.defineSim('laboratorio', function (sim) {
    const cv1 = sim.canvas({ aspect: 2.3, maxH: '300px' });
    const cv2 = sim.canvas({ aspect: 2.8, maxH: '230px' });
    sim.group('Serie y preajustes');
    sim.seg('ds', { label: 'Serie', options: [['m1', 'M1 · 3.4 m'], ['m5', 'M5 · 17 m'], ['m15', 'M15 · 4.2 a']], value: 'm5' });
    const apply = (name) => { const pr = Object.assign(E().params({}), PRESETS[name]); for (const k of Object.keys(pr)) if (sim.ctl[k]) sim.ctl[k].set(pr[k], true); sim.redraw(); };
    sim.button('Manual v1.3', () => apply('manual'));
    sim.button('Motor v1.2', () => apply('v12'));
    sim.button('Candidata', () => apply('cand'));
    sim.button('Comparar con entradas al azar', () => { nullRes = null; wantNull = true; });
    ML.stratPanel(sim, ['horario', 'entrada', 'salida', 'gestion', 'riesgo', 'costos']);
    sim.out('n', 'Operaciones', { hl: true });
    sim.out('r', 'R medio ± IC 95 %');
    sim.out('t', 't · aciertos · factor de beneficio');
    sim.out('usd', 'Resultado total · caída máxima');
    sim.out('mot', 'Motivos de salida', { wide: true });
    sim.out('nul', 'Entradas al azar', { wide: true });
    let D = null, nullRes = null, wantNull = false;
    sim.withData(['m1', 'm5', 'm15'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv1); ML.draw.clear(cv2);
      if (!D) return;
      const p = sim.p, { S, X } = B().get(D, p.ds);
      const P = B().paramsFor(p.ds, Object.fromEntries(Object.keys(E().DEFAULTS).filter((k) => p[k] !== undefined).map((k) => [k, p[k]])));
      const tr = E().run(S, X, P), st = E().stats(tr, P), eq = B().equity(tr, P);
      /* curva */
      const pl = new ML.Plot(cv1.ctx, { x: 0, y: 0, w: cv1.w, h: cv1.h, xmin: 0, xmax: Math.max(5, tr.length), ymin: Math.min(0, ...eq.yU) - 100, ymax: Math.max(100, ...eq.yU) + 200, ml: 58, mb: 38, xlabel: 'Operaciones', ylabel: 'USD acumulados' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', width: 1, dash: [4, 3] });
      pl.xy(eq.xs, eq.yU, { color: '--accent', width: 2.4 });
      /* histograma por motivo */
      const lo = -1.4, hi = 3.4, bins = 24, bw = (hi - lo) / bins;
      const order = ['SL', 'SLD', 'STAG', 'TIME', 'END', 'BE', 'TP'];
      const H = {}; order.forEach((k) => { H[k] = new Float64Array(bins); });
      tr.forEach((t) => { const b = Math.min(bins - 1, Math.max(0, Math.floor((t.R - lo) / bw))); H[t.reason][b]++; });
      const tot = new Float64Array(bins); order.forEach((k) => H[k].forEach((v, i) => { tot[i] += v; }));
      const p2 = new ML.Plot(cv2.ctx, { x: 0, y: 0, w: cv2.w, h: cv2.h, xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(3, ...tot) * 1.1, ml: 58, mb: 38, xlabel: 'Resultado de la operación (R)', ylabel: 'Operaciones' });
      p2.frame();
      p2.vline(0, { color: '--ink', width: 1.2, dash: [] });
      const base = new Float64Array(bins);
      order.forEach((k) => {
        const xs = [], ys = [];
        H[k].forEach((v, i) => { if (v) { /* barra apilada */ const y0 = p2.Y(base[i]), y1 = p2.Y(base[i] + v); cv2.ctx.fillStyle = ML.alpha(REASON_COL[k], 0.85); cv2.ctx.fillRect(p2.X(lo + i * bw) + 1, y1, p2.X(lo + (i + 1) * bw) - p2.X(lo + i * bw) - 2, y0 - y1); base[i] += v; } });
      });
      /* lecturas */
      sim.set('n', ML.fix(st.n, 0) + ' <small>(' + (st.n ? ML.fix(st.n / Math.max(1, new Set(tr.map((t) => t.day)).size), 2) : '0') + ' por día con operación)</small>');
      sim.set('r', st.n ? ML.R(st.avgR, 3) + ' ± ' + ML.fix(1.96 * st.seR, 3) : '—');
      sim.set('t', st.n ? ML.fix(st.t, 2) + ' · ' + ML.pct(st.winPct, 0) + ' · ' + ML.fix(st.pf, 2) : '—');
      sim.set('usd', ML.usdS(st.usd) + ' · −' + ML.usd(st.ddUsd));
      sim.set('mot', Object.keys(st.reasons).map((k) => k + ' ' + st.reasons[k]).join(' · '));
      if (wantNull) {
        wantNull = false;
        nullRes = B().nullRuns(S, X, P, 100, 3);
      }
      if (nullRes && nullRes.length) {
        const m = St().mean(nullRes), sd = St().sd(nullRes), beat = nullRes.filter((v) => v < st.avgR).length / nullRes.length;
        sim.set('nul', 'azar: ' + ML.R(m, 3) + ' ± ' + ML.fix(sd, 3) + ' (100 réplicas) · su señal supera al ' + ML.pct(beat, 0));
      } else sim.set('nul', 'pulse «Comparar con entradas al azar»');
    });
    sim.onChange = () => { nullRes = null; };
  });

  /* ======================================================================
     11.2 Cargar un CSV de MetaTrader
     ====================================================================== */
  function parseCSV(text, offH, pointUsd) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
    const sep = /\t/.test(lines[0]) ? '\t' : /;/.test(lines[0]) ? ';' : ',';
    const head = lines[0].split(sep).map((s) => s.replace(/[<>"\s]/g, '').toLowerCase());
    const ix = (n) => head.indexOf(n);
    const iD = ix('date'), iT = ix('time'), iO = ix('open'), iH = ix('high'), iL = ix('low'), iC = ix('close'), iS = ix('spread');
    if (iO < 0 || iH < 0 || iL < 0 || iC < 0 || (iT < 0 && iD < 0)) throw new Error('No se encontraron las columnas DATE/TIME (o time) y OPEN, HIGH, LOW, CLOSE en la cabecera.');
    const t = [], o = [], h = [], l = [], c = [], sp = [];
    for (let k = 1; k < lines.length; k++) {
      const f = lines[k].split(sep);
      let ts;
      if (iD >= 0 && iT >= 0 && iD !== iT) { const d = f[iD].trim().split(/[.\-\/]/).map(Number), tm = f[iT].trim().split(':').map(Number); ts = Date.UTC(d[0], d[1] - 1, d[2], tm[0], tm[1] || 0) / 60000; }
      else { const s = f[iT >= 0 ? iT : iD].trim().replace(/\./g, '-').replace(' ', 'T'); ts = Date.parse(s + (s.endsWith('Z') ? '' : 'Z')) / 60000; }
      if (!isFinite(ts)) continue;
      t.push(ts - offH * 60); o.push(+f[iO]); h.push(+f[iH]); l.push(+f[iL]); c.push(+f[iC]);
      const s = iS >= 0 ? +f[iS] * pointUsd : 0;
      sp.push(s > 0 ? s : 0.27);
    }
    if (t.length < 2000) throw new Error('Se leyeron solo ' + t.length + ' filas: se necesitan al menos unas 2 000 velas.');
    const dts = []; for (let i = 1; i < Math.min(t.length, 300); i++) dts.push(t[i] - t[i - 1]);
    dts.sort((a, b) => a - b);
    const bm = dts[Math.floor(dts.length / 2)];
    return { n: t.length, t: Float64Array.from(t), o: Float64Array.from(o), h: Float64Array.from(h), l: Float64Array.from(l), c: Float64Array.from(c), sp: Float64Array.from(sp), bm, name: 'usuario' };
  }

  ML.defineSim('mis-datos', function (sim) {
    const cv = sim.canvas({ aspect: 2.4, maxH: '320px' });
    sim.group('Archivo');
    sim.slider('off', { label: 'Hora del servidor − UTC (horas)', min: 0, max: 4, step: 1, value: 2, fmt: (v) => ML.fix(v, 0) });
    sim.slider('pt', { label: 'Valor del punto (USD)', min: 0.001, max: 0.1, step: 0.001, value: 0.01, fmt: (v) => ML.fix(v, 3) });
    const wrap = ML.el('div', 'ctrl');
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv,.txt,.tsv';
    wrap.append(ML.el('label', null, 'Archivo de velas (CSV)'), inp);
    sim._parent().append(wrap);
    sim.out('st', 'Estado', { hl: true, wide: true });
    sim.out('r', 'Resultado');
    let text = null, S = null, tr = null, P = null;
    const load = () => {
      if (!text) return;
      try {
        S = parseCSV(text, sim.p.off, sim.p.pt);
        P = E().params({});
        if (S.bm > 15) throw new Error('La serie base debe ser de 15 minutos o menos (se detectó ' + S.bm + ' min).');
        const X = E().prep(S);
        tr = E().run(S, X, P);
        const st = E().stats(tr, P);
        sim.set('st', S.n + ' velas de ' + S.bm + ' min · ' + E().dateStr(S.t[0]) + ' → ' + E().dateStr(S.t[S.n - 1]));
        sim.set('r', st.n ? st.n + ' operaciones · R medio ' + ML.R(st.avgR, 3) + ' ± ' + ML.fix(1.96 * st.seR, 3) + ' · acierto ' + ML.pct(st.winPct, 0) + ' · ' + ML.usdS(st.usd) : 'sin operaciones (¿hay suficiente historia para H4? ¿el desfase horario es correcto?)');
      } catch (e) { S = null; tr = null; sim.set('st', 'Error: ' + e.message); sim.set('r', '—'); }
      sim.redraw();
    };
    inp.addEventListener('change', () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { text = String(rd.result); load(); }; rd.readAsText(f); });
    sim.onChange = () => load();
    sim.set('st', 'Elija un archivo de velas exportado de MetaTrader');
    sim.set('r', '—');
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!tr) { ML.text(cv.ctx, 'La curva de capital aparecerá aquí', cv.w / 2, cv.h / 2, { size: 13.5, color: '--ink-3', align: 'center' }); return; }
      const eq = B().equity(tr, P);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(5, tr.length), ymin: Math.min(0, ...eq.yU) - 100, ymax: Math.max(100, ...eq.yU) + 200, ml: 58, mb: 38, xlabel: 'Operaciones', ylabel: 'USD acumulados' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', width: 1, dash: [4, 3] });
      pl.xy(eq.xs, eq.yU, { color: '--accent', width: 2.4 });
    });
  });
})();
