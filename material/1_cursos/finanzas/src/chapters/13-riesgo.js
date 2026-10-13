/* Capítulo 13 — Fondo de emergencia, riesgo y seguros */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm, H = L.hogar;

  /* 13.1 Fondo de emergencia (Monte Carlo) */
  CC.defineSim('emergencia', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 1.1, label: 'Probabilidad de endeudarse según el tamaño del colchón' }), ci = sim.canvas({ aspect: 1.1, label: 'Intereses pagados en diez años' });
    sim.group('Hogar');
    sim.slider('g', { label: 'Gasto esencial mensual', min: 1000000, max: 15000000, step: 100000, value: 3500000, fmt: CC.copS });
    sim.slider('f', { label: 'Colchón (meses de gasto)', min: 0, max: 12, step: 0.5, value: 3, fmt: (v) => CC.nf(v, 1) + ' meses' });
    sim.slider('rec', { label: 'Ahorro mensual para reponer (% del gasto)', min: 0.03, max: 0.4, step: 0.01, value: 0.15, fmt: (v) => CC.pct(v, 0) });
    sim.group('Riesgos');
    sim.slider('pd', { label: 'Probabilidad de perder el ingreso en un año', min: 0.02, max: 0.5, step: 0.01, value: 0.14, fmt: (v) => CC.pct(v, 0) });
    sim.slider('dur', { label: 'Duración media sin ingreso', min: 1, max: 12, step: 0.5, value: 4, fmt: (v) => CC.nf(v, 1) + ' meses' });
    sim.slider('pi', { label: 'Gastos inesperados por año (frecuencia)', min: 0, max: 2, step: 0.1, value: 0.5, fmt: (v) => CC.nf(v, 1) });
    sim.slider('ti', { label: 'Tamaño de cada gasto inesperado', min: 0.25, max: 4, step: 0.25, value: 1, fmt: (v) => CC.nf(v, 2) + ' meses' });
    sim.slider('td', { label: 'Tasa mensual de la deuda de emergencia', min: 0.005, max: 0.03, step: 0.001, value: 0.022, fmt: (v) => CC.pct(v, 1) });
    sim.out('p', 'Vidas que necesitaron deuda', { hl: true });
    sim.out('i', 'Intereses promedio en 10 años');
    sim.out('d', 'Deuda máxima típica (de quienes se endeudaron)');
    let curva = [];
    const o = (f) => ({ gasto: sim.p.g, fondo: f, pDesempleo: 1 - Math.pow(1 - sim.p.pd, 1 / 12), durMedia: sim.p.dur, pImprevisto: sim.p.pi / 12, imprevisto: sim.p.ti, recarga: sim.p.rec, tasaDeuda: sim.p.td, anos: 10, N: 700, seed: 3 });
    const compute = () => { curva = L.util.range(13).map((f) => { const r = H.emergencia(o(f)); return [f, r.pDeuda, r.interesMedio]; }); };
    compute();
    sim.onChange = (id) => { if (id !== 'f') compute(); };
    sim.onDraw(() => {
      const r = H.emergencia(Object.assign(o(sim.p.f), { N: 1500 }));
      CC.draw.clear(cp);
      const p1 = new CC.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 12, ymin: 0, ymax: 1, xlabel: 'colchón (meses de gasto)', title: 'probabilidad de endeudarse en 10 años', yfmt: CC.pctAxis });
      p1.frame();
      p1.path(curva.map((c) => [c[0], c[1]]), { color: '--c2', width: 2.6 });
      p1.vline(sim.p.f, { color: '--accent', dash: [] });
      p1.dot(sim.p.f, r.pDeuda, { color: '--accent', label: CC.pct(r.pDeuda, 0) });
      CC.draw.clear(ci);
      const imax = Math.max(...curva.map((c) => c[2]), 1) * 1.1;
      const p2 = new CC.Plot(ci.ctx, { x: 0, y: 0, w: ci.w, h: ci.h, xmin: 0, xmax: 12, ymin: 0, ymax: imax, xlabel: 'colchón (meses de gasto)', title: 'intereses promedio pagados', yfmt: CC.copAxis, ml: 66 });
      p2.frame();
      p2.path(curva.map((c) => [c[0], c[2]]), { color: '--c4', width: 2.6, fill: '--c4', fillAlpha: 0.1 });
      p2.vline(sim.p.f, { color: '--accent', dash: [] });
      sim.set('p', CC.pct(r.pDeuda, 0));
      sim.set('i', CC.copS(r.interesMedio));
      sim.set('d', r.deudaMediana > 0 ? CC.copS(r.deudaMediana) : '—');
    });
  });

  /* 13.2 Seguro y utilidad logarítmica */
  CC.defineSim('seguro', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Utilidad logarítmica, utilidad esperada y equivalente cierto' });
    sim.group('Situación');
    sim.slider('W', { label: 'Patrimonio', min: 2000000, max: 200000000, step: 1000000, value: 20000000, fmt: CC.copS });
    sim.slider('X', { label: 'Pérdida posible', min: 100000, max: 190000000, step: 100000, value: 15000000, fmt: CC.copS });
    sim.slider('p', { label: 'Probabilidad de la pérdida (al año)', min: 0.001, max: 0.3, step: 0.001, value: 0.02, fmt: (v) => CC.pct(v, 1) });
    sim.group('Seguro ofrecido');
    sim.slider('pr', { label: 'Prima anual', min: 0, max: 10000000, step: 10000, value: 350000, fmt: CC.cop });
    sim.slider('ded', { label: 'Deducible', min: 0, max: 10000000, step: 50000, value: 0, fmt: CC.cop });
    sim.out('pe', 'Pérdida esperada (prima justa)');
    sim.out('pm', 'Prima máxima razonable', { hl: true });
    sim.out('ec', 'Equivalente cierto sin seguro');
    sim.out('dec', 'Decisión');
    sim.onDraw(() => {
      const W = sim.p.W, X = Math.min(sim.p.X, W * 0.98), p = sim.p.p, ded = Math.min(sim.p.ded, X);
      const s = H.seguro(W, X, p, sim.p.pr, ded);
      CC.draw.clear(cv);
      const lo = Math.max(1, W - X) * 0.6, pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: lo, xmax: W * 1.05, ymin: Math.log(lo), ymax: Math.log(W * 1.05) + 0.05, xlabel: 'riqueza final', ylabel: 'utilidad ln(W)', xfmt: CC.copAxis, yfmt: () => '' });
      pl.frame();
      pl.fn((w) => Math.log(w), { color: '--accent', width: 2.6, from: lo });
      const a = [W - X, Math.log(W - X)], b = [W, Math.log(W)];
      pl.path([a, b], { color: '--ink-3', width: 1.5, dash: [5, 4] });
      pl.dot(a[0], a[1], { color: '--loss', label: 'con pérdida', dy: 16 });
      pl.dot(b[0], b[1], { color: '--gain', label: 'sin pérdida', align: 'right', dx: -8 });
      const Ew = W - p * X;
      pl.dot(Ew, s.sin.U, { color: '--ink-3', r: 4 });
      pl.dot(s.sin.EC, s.sin.U, { color: '--c2', label: 'equivalente cierto', align: 'right', dx: -8, dy: 16 });
      pl.vline(W - sim.p.pr, { color: '--c1', label: 'con seguro: W − prima', labelY: pl.ih - 14, dash: [], align: 'right' });
      sim.set('pe', CC.cop(p * (X - ded)));
      sim.set('pm', CC.cop(s.primaMax));
      sim.set('ec', CC.cop(s.sin.EC));
      sim.set('dec', s.con.U > s.sin.U ? '<span class="gain">conviene asegurarse</span>' : '<span class="loss">mejor retener el riesgo</span>');
    });
  });

  /* 13.3 Seguro de vida por necesidades */
  CC.defineSim('seguro-vida', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Necesidades de la familia frente a recursos existentes' });
    sim.group('Necesidades');
    sim.num('ap', { label: 'Aporte mensual al hogar a reemplazar', value: 2500000, min: 0, money: true });
    sim.slider('an', { label: 'Años que la familia dependería de ese aporte', min: 1, max: 30, step: 1, value: 16, fmt: (v) => CC.nf(v) });
    sim.slider('r', { label: 'Rentabilidad real del capital', min: 0, max: 0.06, step: 0.0025, value: 0.04, fmt: (v) => CC.pct(v, 2) });
    sim.num('deu', { label: 'Deudas que habría que pagar', value: 60000000, min: 0, money: true });
    sim.num('edu', { label: 'Educación de los hijos y otras metas', value: 80000000, min: 0, money: true });
    sim.num('fin', { label: 'Gastos finales', value: 10000000, min: 0, money: true });
    sim.group('Recursos existentes');
    sim.num('act', { label: 'Ahorros e inversiones disponibles', value: 25000000, min: 0, money: true });
    sim.num('seg', { label: 'Seguros de vida que ya tiene', value: 40000000, min: 0, money: true });
    sim.out('vp', 'Valor presente del aporte');
    sim.out('nec', 'Necesidad total');
    sim.out('rec', 'Recursos existentes');
    sim.out('sa', 'Suma asegurada sugerida', { hl: true });
    sim.onDraw(() => {
      const im = T.eaToPeriodic(sim.p.r, 12);
      const VP = Math.abs(T.pv(im, Math.round(sim.p.an * 12), -sim.p.ap));
      const nec = [['aporte al hogar', VP, '--c1'], ['deudas', sim.p.deu, '--c2'], ['metas', sim.p.edu, '--c5'], ['gastos finales', sim.p.fin, '--c6']];
      const rec = [['ahorros', sim.p.act, '--c3'], ['seguros actuales', sim.p.seg, '--c7']];
      const N = nec.reduce((s, x) => s + x[1], 0), R = rec.reduce((s, x) => s + x[1], 0), gap = Math.max(0, N - R);
      CC.draw.clear(cv);
      const ctx = cv.ctx, x0 = 130, x1 = cv.w - 20, M = Math.max(N, R) || 1;
      const fila = (y, parts, label) => {
        let x = x0;
        parts.forEach(([nm, v, col]) => {
          const w = ((x1 - x0) * v) / M;
          ctx.fillStyle = CC.col(col); ctx.globalAlpha = 0.85; ctx.fillRect(x, y, Math.max(0, w - 1), 36); ctx.globalAlpha = 1;
          if (w > 70) CC.text(ctx, nm, x + 6, y + 15, { size: 11.5, color: CC.isDark() ? '#0B1230' : '#FFFFFF', weight: 700 });
          if (w > 70) CC.text(ctx, CC.copS(v), x + 6, y + 30, { size: 11, color: CC.isDark() ? '#0B1230' : '#FFFFFF', mono: true });
          x += w;
        });
        CC.text(ctx, label, x0 - 10, y + 23, { size: 13, align: 'right', weight: 650 });
        return x;
      };
      fila(24, nec, 'Necesidades');
      const xr = fila(84, rec, 'Recursos');
      if (gap > 0) {
        const w = ((x1 - x0) * gap) / M;
        ctx.setLineDash([5, 4]); ctx.strokeStyle = CC.col('--gold'); ctx.lineWidth = 2; ctx.strokeRect(xr, 84, w, 36); ctx.setLineDash([]);
        CC.text(ctx, 'faltante: ' + CC.copS(gap), xr + w / 2, 140, { size: 13, align: 'center', color: '--law-ink', weight: 700 });
      }
      sim.set('vp', CC.copS(VP));
      sim.set('nec', CC.copS(N));
      sim.set('rec', CC.copS(R));
      sim.set('sa', gap > 0 ? CC.copS(gap) : 'no necesita seguro adicional');
    });
  });
})();
