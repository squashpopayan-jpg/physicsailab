/* Capítulo 15 — Ingresos, capital humano e impuestos */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm, X = L.tax;

  /* 15.1 Capital humano y financiero */
  CC.defineSim('capital-humano', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Capital humano y capital financiero por edad' });
    sim.group('Trabajo');
    sim.slider('e0', { label: 'Edad actual', min: 20, max: 60, step: 1, value: 25, fmt: (v) => CC.nf(v) + ' años' });
    sim.slider('Y', { label: 'Ingreso laboral mensual', min: 1000000, max: 30000000, step: 100000, value: 3000000, fmt: CC.copS });
    sim.slider('g', { label: 'Crecimiento real del ingreso', min: -0.01, max: 0.05, step: 0.0025, value: 0.02, fmt: (v) => CC.pct(v, 2) });
    sim.slider('R', { label: 'Edad de retiro', min: 50, max: 70, step: 1, value: 62, fmt: (v) => CC.nf(v) + ' años' });
    sim.slider('d', { label: 'Tasa de descuento real', min: 0.01, max: 0.08, step: 0.0025, value: 0.04, fmt: (v) => CC.pct(v, 2) });
    sim.group('Ahorro');
    sim.slider('s', { label: 'Tasa de ahorro', min: 0, max: 0.4, step: 0.01, value: 0.1, fmt: (v) => CC.pct(v, 0) });
    sim.slider('r', { label: 'Rentabilidad real del ahorro', min: 0, max: 0.08, step: 0.0025, value: 0.04, fmt: (v) => CC.pct(v, 2) });
    sim.out('h0', 'Capital humano hoy', { hl: true });
    sim.out('fR', 'Capital financiero al retirarse');
    sim.out('cruce', 'El financiero supera al humano a los');
    sim.onDraw(() => {
      const { e0, Y, g, R, d, s, r } = sim.p;
      const anual = 12 * Y, ages = [], H = [], F = [];
      let W = 0;
      for (let a = e0; a <= R; a++) {
        let h = 0;
        for (let k = a; k < R; k++) h += (anual * Math.pow(1 + g, k - e0)) / Math.pow(1 + d, k - a + 1);
        ages.push(a); H.push(h); F.push(W);
        if (a < R) W = W * (1 + r) + s * anual * Math.pow(1 + g, a - e0);
      }
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: e0, xmax: R, ymin: 0, ymax: Math.max(...H, ...F) * 1.08, xlabel: 'edad', ylabel: 'en pesos de hoy', yfmt: CC.copAxis, ml: 80 });
      pl.frame();
      pl.xy(ages, H, { color: '--c1', width: 2.6, fill: '--c1', fillAlpha: 0.08 });
      pl.xy(ages, F, { color: '--c3', width: 2.6, fill: '--c3', fillAlpha: 0.1 });
      pl.xy(ages, H.map((h, k) => h + F[k]), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pl.legend([{ label: 'capital humano', color: '--c1' }, { label: 'capital financiero', color: '--c3' }, { label: 'riqueza total', color: '--ink-3', dash: [5, 4] }], 'tr');
      const k = F.findIndex((f, j) => f > H[j]);
      sim.set('h0', CC.copS(H[0]));
      sim.set('fR', CC.copS(F[F.length - 1]));
      sim.set('cruce', k >= 0 ? `${ages[k]} años` : 'nunca antes del retiro');
    });
  });

  /* 15.2 VPN de un posgrado */
  CC.defineSim('vpn-posgrado', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'VPN acumulado de la inversión en formación' });
    sim.group('Formación');
    sim.slider('c', { label: 'Costo total (matrícula y materiales)', min: 0, max: 150000000, step: 1000000, value: 30000000, fmt: CC.copS });
    sim.slider('dur', { label: 'Duración (años)', min: 1, max: 5, step: 1, value: 2, fmt: (v) => CC.nf(v) });
    sim.seg('ded', { label: 'Dedicación', options: [['parcial', 'Estudia y trabaja'], ['completa', 'Tiempo completo']], value: 'parcial' });
    sim.group('Carrera');
    sim.slider('S', { label: 'Salario mensual actual', min: 1500000, max: 30000000, step: 100000, value: 4000000, fmt: CC.copS });
    sim.slider('inc', { label: 'Aumento esperado del salario', min: 0, max: 0.6, step: 0.01, value: 0.15, fmt: (v) => CC.pct(v, 0) });
    sim.slider('n', { label: 'Años de carrera después', min: 3, max: 40, step: 1, value: 30, fmt: (v) => CC.nf(v) });
    sim.slider('i', { label: 'Tasa de descuento real', min: 0.01, max: 0.12, step: 0.0025, value: 0.05, fmt: (v) => CC.pct(v, 2) });
    sim.out('vpn', 'VPN', { hl: true });
    sim.out('tir', 'TIR');
    sim.out('rec', 'Se recupera (en valor presente) en el año');
    sim.onDraw(() => {
      const { c, dur, S, inc, n, i } = sim.p;
      const flujos = [];
      for (let y = 0; y < dur; y++) flujos.push(-(c / dur) - (sim.p.ded === 'completa' ? 12 * S : 0));
      for (let y = 0; y < n; y++) flujos.push(12 * S * inc);
      const F = [0, ...flujos];
      const vpn = T.npv(i, F), tir = T.irr(F);
      let acc = 0;
      const cum = F.map((f, t) => (acc += f / Math.pow(1 + i, t)));
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: F.length - 1, ymin: Math.min(...cum) * 1.15, ymax: Math.max(0, ...cum) * 1.15 + 1, xlabel: 'años desde hoy', ylabel: 'VPN acumulado', yfmt: CC.copAxis, ml: 70 });
      pl.frame();
      pl.band(0, dur, { color: '--c4', alpha: 0.08 });
      pl.xy(cum.map((_, t) => t), cum, { color: vpn >= 0 ? '--c3' : '--c2', width: 2.6 });
      const k = cum.findIndex((v, t) => t > dur && v >= 0);
      if (k > 0) pl.dot(k, cum[k], { color: '--gold', label: `recuperado en el año ${k}` });
      sim.set('vpn', `<span class="${vpn >= 0 ? 'gain' : 'loss'}">${CC.copS(vpn)}</span>`);
      sim.set('tir', isFinite(tir) ? CC.pct(tir, 1) : 'no existe');
      sim.set('rec', k > 0 ? String(k) : 'no se recupera');
    });
  });

  /* 15.3 Renta: tarifa marginal y media */
  CC.defineSim('renta-marginal', function (sim) {
    sim.cols2();
    const ct = sim.canvas({ aspect: 1.1, label: 'Tarifas marginal y media según la base gravable' }), cs = sim.canvas({ aspect: 1.1, label: 'Destino de un aumento de sueldo' });
    sim.group('Salario');
    sim.slider('s', { label: 'Salario mensual', min: 1750905, max: 60000000, step: 50000, value: 8000000, fmt: CC.copS });
    sim.check('dep', { label: 'Tiene dependiente económico', value: false });
    sim.slider('vol', { label: 'Aportes voluntarios al año (pensión o AFC)', min: 0, max: 100000000, step: 500000, value: 0, fmt: CC.copS });
    sim.slider('au', { label: 'Aumento mensual a evaluar', min: 0, max: 5000000, step: 50000, value: 500000, fmt: CC.cop });
    sim.out('base', 'Base gravable estimada');
    sim.out('imp', 'Impuesto anual estimado', { hl: true });
    sim.out('tm', 'Tarifa media / marginal');
    sim.out('ex', 'Con el aumento: más bruto / más impuesto / más neto', { wide: true });
    sim.note('Estimación simplificada para aprender (12 salarios, aportes de 8 % a 9 %, renta exenta de 25 % y topes generales). No sirve para presentar la declaración.');
    sim.onDraw(() => {
      const e = X.estimar({ salarioMensual: sim.p.s, dependiente: sim.p.dep, voluntarios: sim.p.vol });
      const e2 = X.estimar({ salarioMensual: sim.p.s + sim.p.au, dependiente: sim.p.dep, voluntarios: sim.p.vol });
      CC.draw.clear(ct);
      const bmax = Math.max(6000, e.baseUVT * 1.4);
      const p1 = new CC.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: 0, xmax: bmax, ymin: 0, ymax: 0.42, xlabel: 'base gravable (UVT al año)', title: 'tarifa marginal y media sobre la base', yfmt: CC.pctAxis });
      p1.frame();
      p1.fn((b) => X.marginal(b), { color: '--c2', width: 2.2, n: 800 });
      p1.fn((b) => (b > 0 ? X.renta(b) / b : 0), { color: '--c1', width: 2.6, n: 400 });
      p1.vline(e.baseUVT, { color: '--accent', dash: [] });
      p1.legend([{ label: 'marginal', color: '--c2' }, { label: 'media (sobre la base)', color: '--c1' }], 'tl');
      CC.draw.clear(cs);
      const db = 12 * sim.p.au, dap = (e2.bruto - e2.neto) - (e.bruto - e.neto), dimp = e2.impuesto - e.impuesto, dnet = db - dap - dimp;
      const p2 = new CC.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: -0.6, xmax: 0.6, ymin: 0, ymax: Math.max(1, db) * 1.12, xticks: [], title: 'destino del aumento en un año', yfmt: CC.copAxis, ml: 66 });
      p2.frame();
      p2.stack([0], [{ ys: [dnet], color: '--c3' }, { ys: [dap], color: '--c6' }, { ys: [dimp], color: '--c2' }], { w: 0.5 });
      p2.legend([{ label: 'queda en su bolsillo', color: '--c3', kind: 'sq' }, { label: 'aportes de salud y pensión', color: '--c6', kind: 'sq' }, { label: 'impuesto de renta', color: '--c2', kind: 'sq' }], 'tr');
      sim.set('base', `${CC.nf(e.baseUVT, 0)} UVT (${CC.copS(e.base)})`);
      sim.set('imp', CC.cop(e.impuesto));
      sim.set('tm', `${CC.pct(e.media, 1)} / ${CC.pct(e.marginal, 0)}`);
      sim.set('ex', `${CC.cop(db)} / ${CC.cop(dimp)} / <span class="gain">${CC.cop(dnet)}</span>`);
    });
  });
})();
