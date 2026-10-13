/* Capítulo 5 — Hábitos, sistemas y entorno */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, B = L.beh;

  /* ======================================================================
     5.1 Ahorro manual frente a automático
     ====================================================================== */
  CC.defineSim('automatico', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Saldo final de cien personas que ahorran a mano y del ahorro automático' });
    sim.group('El plan de ahorro');
    sim.slider('ap', { label: 'Cuota mensual', min: 50000, max: 2000000, step: 10000, value: 300000, fmt: CC.cop });
    sim.slider('Y', { label: 'Años', min: 1, max: 30, step: 1, value: 10, fmt: (v) => CC.nf(v) });
    sim.slider('r', { label: 'Rentabilidad anual', min: 0, max: 0.1, step: 0.005, value: 0.05, fmt: (v) => CC.pct(v) });
    sim.group('Ahorro «a mano»');
    sim.slider('q', { label: 'Probabilidad de saltarse un mes', min: 0, max: 0.5, step: 0.01, value: 0.15, fmt: (v) => CC.pct(v, 0) });
    sim.slider('in', { label: 'Inercia: probabilidad extra tras saltarse uno', min: 0, max: 0.5, step: 0.01, value: 0.2, fmt: (v) => CC.pct(v, 0) });
    sim.out('auto', 'Ahorro automático', { hl: true });
    sim.out('med', 'Ahorro manual: mediana');
    sim.out('rng', 'Manual: 10 % peor y 10 % mejor');
    sim.out('frac', 'Mediana manual frente a automático');
    sim.onDraw(() => {
      const o = { N: 100, anos: sim.p.Y, r: sim.p.r, q: sim.p.q, inercia: sim.p.in, aporte: sim.p.ap, seed: 9 };
      const fin = B.manualVsAuto(o).sort((a, b) => a - b);
      const auto = L.tvm.savingsPath({ p0: 0, aporte: sim.p.ap, im: L.tvm.eaToPeriodic(sim.p.r, 12), meses: sim.p.Y * 12 }).saldo[sim.p.Y * 12];
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: auto * 1.08, ymin: 0, ymax: 1, yticks: [], xlabel: 'saldo final', xfmt: CC.copAxis, mb: 40, ml: 20 });
      pl.frame();
      const rng = L.rng(4);
      fin.forEach((v) => pl.dot(v, 0.15 + 0.5 * rng(), { color: '--c4', r: 4 }));
      const med = L.stat.quantile(fin, 0.5);
      pl.vline(med, { color: '--c4', label: 'mediana manual', labelY: 34, dash: [5, 4], align: 'right' });
      pl.vline(auto, { color: '--c1', label: 'automático', labelY: 14, dash: [], align: 'right' });
      CC.text(cv.ctx, 'cada punto es una persona que ahorra «cuando se puede»', pl.ix + 8, pl.iy + pl.ih - 10, { size: 11.5, color: '--ink-3', halo: true });
      sim.set('auto', CC.copS(auto));
      sim.set('med', CC.copS(med));
      sim.set('rng', `${CC.copS(L.stat.quantile(fin, 0.1))} · ${CC.copS(L.stat.quantile(fin, 0.9))}`);
      sim.set('frac', CC.pct(med / auto, 0));
    });
  });

  /* ======================================================================
     5.2 Ahorre más mañana
     ====================================================================== */
  CC.defineSim('smarter', function (sim) {
    sim.cols2();
    const cb = sim.canvas({ aspect: 1.1, label: 'Salario dividido en ahorro y disponible cada año' }), cw = sim.canvas({ aspect: 1.1, label: 'Ahorro acumulado' });
    sim.group('Salario');
    sim.slider('sal', { label: 'Salario mensual inicial', min: 1500000, max: 15000000, step: 100000, value: 4000000, fmt: CC.copS });
    sim.slider('au', { label: 'Aumento anual', min: 0.02, max: 0.15, step: 0.005, value: 0.06, fmt: (v) => CC.pct(v) });
    sim.group('Compromiso');
    sim.slider('t0', { label: 'Tasa de ahorro inicial', min: 0, max: 0.15, step: 0.005, value: 0.03, fmt: (v) => CC.pct(v) });
    sim.slider('inc', { label: 'Puntos extra con cada aumento', min: 0.005, max: 0.05, step: 0.005, value: 0.02, fmt: (v) => CC.pct(v) });
    sim.slider('tope', { label: 'Tope', min: 0.05, max: 0.3, step: 0.01, value: 0.15, fmt: (v) => CC.pct(v, 0) });
    sim.slider('r', { label: 'Rentabilidad real del ahorro', min: 0, max: 0.08, step: 0.005, value: 0.04, fmt: (v) => CC.pct(v) });
    sim.out('t5', 'Tasa de ahorro en el año 5');
    sim.out('disp', 'Disponible mes 1 → mes 13');
    sim.out('baja', '¿Baja alguna vez el disponible?', { hl: true });
    sim.out('w', 'Ahorro a 10 años: inicial fijo / Ahorre más mañana / tope desde el día 1', { wide: true });
    sim.onDraw(() => {
      const Y = 10;
      const rows = B.smart({ salario: sim.p.sal, aumento: sim.p.au, tasa0: sim.p.t0, inc: sim.p.inc, tope: sim.p.tope, anos: Y });
      CC.draw.clear(cb);
      const pb = new CC.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: -0.6, xmax: Y + 0.6, ymin: 0, ymax: rows[Y].salario * 1.1, xlabel: 'año', title: 'salario mensual: ahorro y disponible', yfmt: CC.copAxis, ml: 66 });
      pb.frame();
      const xs = rows.map((r) => r.y);
      pb.stack(xs, [{ ys: rows.map((r) => r.disponible), color: '--c3', alpha: 0.7 }, { ys: rows.map((r) => r.ahorro), color: '--c1' }], { w: 0.7 });
      pb.path(rows.map((r) => [r.y, r.disponible]), { color: '--ink', width: 1.8 });
      pb.legend([{ label: 'ahorro', color: '--c1', kind: 'sq' }, { label: 'disponible', color: '--c3', kind: 'sq' }], 'tl');
      const acc = (tasaFn) => { let W = 0; const out = [0]; const im = L.tvm.eaToPeriodic(sim.p.r, 12); let s = sim.p.sal; for (let y = 0; y < Y; y++) { for (let m = 0; m < 12; m++) W = W * (1 + im) + s * tasaFn(y); out.push(W); s *= 1 + sim.p.au; } return out; };
      const wSm = acc((y) => rows[y].tasa), wFix = acc(() => sim.p.t0), wTop = acc(() => sim.p.tope);
      CC.draw.clear(cw);
      const pw = new CC.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: 0, xmax: Y, ymin: 0, ymax: wTop[Y] * 1.08, xlabel: 'año', title: 'ahorro acumulado', yfmt: CC.copAxis, ml: 66 });
      pw.frame();
      pw.xy(xs, wTop, { color: '--c6', width: 2, dash: [5, 4] });
      pw.xy(xs, wSm, { color: '--c1', width: 2.6 });
      pw.xy(xs, wFix, { color: '--c2', width: 2 });
      pw.legend([{ label: 'tope desde el día 1', color: '--c6', dash: [5, 4] }, { label: 'Ahorre más mañana', color: '--c1' }, { label: 'tasa inicial fija', color: '--c2' }], 'tl');
      const baja = rows.some((r, i) => i > 0 && r.disponible < rows[i - 1].disponible - 1e-6);
      sim.set('t5', CC.pct(rows[5].tasa));
      sim.set('disp', `${CC.copS(rows[0].disponible, 2)} → ${CC.copS(rows[1].disponible, 2)}`);
      sim.set('baja', baja ? '<span class="loss">sí: el aumento no cubre los puntos extra</span>' : '<span class="gain">nunca</span>');
      sim.set('w', `${CC.copS(wFix[Y])} / ${CC.copS(wSm[Y])} / ${CC.copS(wTop[Y])}`);
    });
  });

  /* ======================================================================
     5.3 Curva de automaticidad de un hábito
     ====================================================================== */
  CC.defineSim('habito', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Automaticidad de un hábito día a día' });
    sim.group('El hábito');
    sim.slider('tau', { label: 'Constante τ (días)', min: 5, max: 85, step: 1, value: 22, fmt: (v) => CC.nf(v) + ' días' });
    sim.slider('pm', { label: 'Probabilidad de fallar un día', min: 0, max: 0.5, step: 0.01, value: 0.1, fmt: (v) => CC.pct(v, 0) });
    sim.slider('dec', { label: 'Pérdida de automaticidad por día fallado', min: 0, max: 0.1, step: 0.005, value: 0.02, fmt: (v) => CC.pct(v, 1) });
    let seed = 3;
    sim.button('Otro mes al azar', () => { seed++; }, { id: 'new' });
    sim.out('t95', 'Días hasta el 95 % (sin fallar)', { hl: true });
    sim.out('t95f', 'Días hasta el 95 % con fallas');
    sim.out('dos', 'Veces que falló dos días seguidos');
    sim.onDraw(() => {
      const tau = sim.p.tau, T = 260, k = 1 - Math.exp(-1 / tau), rng = L.rng(seed * 101);
      const ideal = [], real = [], miss = [];
      let A = 0, prev = false, dos = 0, t95f = NaN;
      for (let t = 0; t <= T; t++) {
        ideal.push(B.habit(t, tau));
        real.push(A);
        if (!(t95f >= 0) && A >= 0.95) t95f = t;
        const falla = rng() < sim.p.pm;
        if (falla) { A *= 1 - sim.p.dec; miss.push(t); if (prev) dos++; } else A += (1 - A) * k;
        prev = falla;
      }
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: T, ymin: 0, ymax: 1.05, xlabel: 'días de práctica', ylabel: 'automaticidad', yfmt: CC.pctAxis });
      pl.frame();
      pl.hline(0.95, { color: '--ink-3', label: '95 %', labelRight: true });
      for (const t of miss) pl.vline(t, { color: '--loss', width: 1, dash: [], alpha: 0.18 });
      pl.xy(ideal.map((_, t) => t), ideal, { color: '--c1', width: 2.2, dash: [6, 4] });
      pl.xy(real.map((_, t) => t), real, { color: '--c3', width: 2.6 });
      const t95 = tau * Math.log(20);
      pl.vline(t95, { color: '--c1', label: `${CC.nf(t95, 0)} días`, labelY: pl.ih - 12, dash: [] });
      pl.legend([{ label: 'sin fallar nunca', color: '--c1', dash: [6, 4] }, { label: 'con días fallados (rojo)', color: '--c3' }], 'br');
      sim.set('t95', CC.nf(t95, 0));
      sim.set('t95f', isFinite(t95f) ? CC.nf(t95f, 0) : `más de ${T}`);
      sim.set('dos', CC.nf(dos));
    });
  });
})();
