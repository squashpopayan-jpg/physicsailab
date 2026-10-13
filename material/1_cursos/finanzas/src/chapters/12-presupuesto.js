/* Capítulo 12 — Presupuesto y gasto consciente */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm;

  /* 12.1 Presupuesto frente a 50/30/20 */
  const CATS = [
    ['nec', 'Necesidades', '--c1', [['viv', 'Vivienda (arriendo o cuota)', 1300000], ['ser', 'Servicios e internet', 280000], ['mer', 'Mercado', 900000], ['tra', 'Transporte', 300000], ['sal', 'Salud y educación', 250000], ['deu', 'Cuotas mínimas de deudas', 350000]]],
    ['des', 'Deseos', '--c4', [['res', 'Restaurantes y domicilios', 400000], ['com', 'Ropa y compras', 200000], ['sus', 'Suscripciones', 80000], ['sali', 'Salidas y otros gustos', 220000]]]
  ];
  CC.defineSim('presupuesto', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 3.6, label: 'Distribución del ingreso frente a la regla 50/30/20', minH: '170px' });
    sim.group('Ingreso');
    sim.num('ing', { label: 'Ingreso neto mensual', value: 4500000, min: 0, money: true });
    CATS.forEach(([, nm, , items]) => { sim.group(nm); items.forEach(([id, lab, v]) => sim.slider(id, { label: lab, min: 0, max: 3000000, step: 10000, value: v, fmt: CC.cop })); });
    sim.out('n', 'Necesidades');
    sim.out('d', 'Deseos');
    sim.out('a', 'Ahorro (lo que queda)', { hl: true });
    sim.out('msg', '', { wide: true });
    sim.onDraw(() => {
      const ing = sim.p.ing;
      const sums = CATS.map(([, , , items]) => items.reduce((s, [id]) => s + sim.p[id], 0));
      const ah = ing - sums[0] - sums[1];
      const real = [sums[0], sums[1], Math.max(0, ah)], ideal = [0.5 * ing, 0.3 * ing, 0.2 * ing];
      CC.draw.clear(cv);
      const ctx = cv.ctx, x0 = 110, x1 = cv.w - 20, W = x1 - x0;
      const tot = Math.max(ing, sums[0] + sums[1]);
      const fila = (y, vals, label) => {
        let x = x0;
        const cols = ['--c1', '--c4', '--c3'];
        vals.forEach((v, k) => {
          const w = (W * v) / tot;
          ctx.fillStyle = CC.col(cols[k]); ctx.globalAlpha = 0.85; ctx.fillRect(x, y, Math.max(0, w - 1), 34); ctx.globalAlpha = 1;
          if (w > 60) CC.text(ctx, CC.pct(v / ing, 0), x + w / 2, y + 22, { size: 13, align: 'center', color: CC.isDark() ? '#0B1230' : '#FFFFFF', weight: 700 });
          x += w;
        });
        CC.text(ctx, label, x0 - 10, y + 22, { size: 13, align: 'right', weight: 650 });
      };
      fila(30, real, 'Su plan');
      fila(84, ideal, 'Regla 50/30/20');
      if (ah < 0) { CC.text(ctx, `déficit de ${CC.cop(-ah)}: gasta más de lo que gana`, x0, 140, { size: 13, color: '--loss', weight: 700 }); }
      const lg = [['necesidades', '--c1'], ['deseos', '--c4'], ['ahorro', '--c3']];
      lg.forEach(([t, c], k) => { ctx.fillStyle = CC.col(c); ctx.fillRect(x0 + k * 130, cv.h - 24, 12, 12); CC.text(ctx, t, x0 + k * 130 + 18, cv.h - 14, { size: 12, color: '--ink-2' }); });
      sim.set('n', `${CC.cop(sums[0])} (${CC.pct(sums[0] / ing, 0)})`);
      sim.set('d', `${CC.cop(sums[1])} (${CC.pct(sums[1] / ing, 0)})`);
      sim.set('a', `<span class="${ah >= 0 ? 'gain' : 'loss'}">${CC.cop(ah)} (${CC.pct(ah / ing, 1)})</span>`);
      const nec = sums[0] / ing;
      sim.set('msg', ah < 0 ? 'Primero hay que cerrar el déficit: revise las categorías variables y luego las fijas.' : ah / ing < 0.1 ? `El ahorro está por debajo de 10 %. ${nec > 0.6 ? 'Las necesidades pasan de 60 %: la palanca grande está en vivienda, transporte o cuotas.' : 'Revise primero los deseos: es donde está el margen.'}` : 'Ahorro de al menos 10 %: buena base. Automatícelo el día de pago (capítulo 5).');
    });
  });

  /* 12.2 Prorrateo de gastos periódicos */
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const PER = [['mat', 'Matrícula y útiles (enero)', 0, 1500000], ['pred', 'Impuesto predial (febrero)', 1, 1200000], ['soat', 'SOAT (marzo)', 2, 450000], ['veh', 'Impuesto vehicular (mayo)', 4, 600000], ['vac', 'Vacaciones (julio)', 6, 2000000], ['man', 'Mantenimiento (septiembre)', 8, 800000], ['reg', 'Regalos y fiestas (diciembre)', 11, 1200000]];
  CC.defineSim('prorrateo', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Saldo disponible al final de cada mes' });
    sim.group('Mes típico');
    sim.slider('ing', { label: 'Ingreso neto mensual', min: 1500000, max: 15000000, step: 50000, value: 4500000, fmt: CC.copS });
    sim.slider('gas', { label: 'Gasto mensual habitual', min: 1000000, max: 15000000, step: 50000, value: 3700000, fmt: CC.copS });
    sim.slider('pri', { label: 'Prima (cada mitad, junio y diciembre)', min: 0, max: 8000000, step: 50000, value: 2000000, fmt: CC.copS });
    sim.group('Gastos periódicos del año');
    PER.forEach(([id, lab, , v]) => sim.slider(id, { label: lab, min: 0, max: 5000000, step: 50000, value: v, fmt: CC.cop }));
    sim.group('Estrategia');
    sim.check('prov', { label: 'Apartar cada mes la provisión', value: false });
    sim.check('pp', { label: 'Enviar la prima a la provisión', value: false });
    sim.out('tot', 'Gastos periódicos del año');
    sim.out('pm', 'Provisión mensual');
    sim.out('min', 'Peor mes (saldo acumulado)', { hl: true });
    sim.out('neg', 'Meses en rojo');
    sim.onDraw(() => {
      const p = sim.p, tot = PER.reduce((s, [id]) => s + p[id], 0), prov = tot / 12;
      let caja = 0, fondo = 0;
      const saldo = [];
      /* se simulan dos años y se muestra el segundo: la provisión ya viene del año anterior */
      for (let mm = 0; mm < 24; mm++) {
        const m = mm % 12;
        if (mm === 12) caja = 0;
        let ent = p.ing + (m === 5 || m === 11 ? p.pri : 0);
        let sal = p.gas;
        const per = PER.filter((x) => x[2] === m).reduce((s, [id]) => s + p[id], 0);
        if (p.prov) {
          fondo += prov; sal += prov;
          if (p.pp && (m === 5 || m === 11)) { fondo += p.pri; sal += p.pri; }
          const usa = Math.min(fondo, per); fondo -= usa; sal += per - usa;
        } else sal += per;
        caja += ent - sal;
        if (mm >= 12) saldo.push(caja);
      }
      CC.draw.clear(cv);
      const m = Math.max(1e6, ...saldo.map(Math.abs)) * 1.2;
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.6, xmax: 11.6, ymin: Math.min(-1e6, ...saldo) * 1.2, ymax: Math.max(1e6, ...saldo) * 1.2, xticks: [], ylabel: 'saldo acumulado en la cuenta', yfmt: CC.copAxis, ml: 70, mb: 28 });
      pl.frame();
      pl.bars(MESES.map((_, k) => k), saldo, { signed: true, w: 0.66 });
      MESES.forEach((t, k) => CC.text(cv.ctx, t, pl.X(k), pl.iy + pl.ih + 16, { size: 11.5, align: 'center', color: '--ink-2' }));
      const neg = saldo.filter((v) => v < 0).length;
      sim.set('tot', CC.cop(tot));
      sim.set('pm', CC.cop(prov));
      sim.set('min', `<span class="${Math.min(...saldo) >= 0 ? 'gain' : 'loss'}">${CC.cop(Math.min(...saldo))}</span>`);
      sim.set('neg', neg ? `<span class="loss">${neg}</span>` : '<span class="gain">ninguno</span>');
    });
  });

  /* 12.3 Gastos hormiga */
  CC.defineSim('hormiga', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Valor acumulado de un gasto pequeño invertido' });
    sim.group('El gasto');
    sim.slider('g', { label: 'Gasto por día', min: 1000, max: 60000, step: 500, value: 12000, fmt: CC.cop });
    sim.slider('d', { label: 'Días por semana', min: 1, max: 7, step: 1, value: 5, fmt: (v) => CC.nf(v) });
    sim.group('Si se invirtiera');
    sim.slider('r', { label: 'Rentabilidad real anual', min: 0, max: 0.1, step: 0.005, value: 0.05, fmt: (v) => CC.pct(v) });
    sim.slider('n', { label: 'Años', min: 1, max: 40, step: 1, value: 20, fmt: (v) => CC.nf(v) });
    sim.slider('h', { label: 'Su salario real por hora', min: 5000, max: 100000, step: 500, value: 10300, fmt: CC.cop });
    sim.out('an', 'Gasto al año');
    sim.out('hr', 'En horas de vida al año');
    sim.out('ac', 'Suma simple en el periodo');
    sim.out('fv', 'Invertido, al final', { hl: true });
    sim.onDraw(() => {
      const anual = sim.p.g * sim.p.d * 52, men = anual / 12, n = Math.round(sim.p.n);
      const path = T.savingsPath({ p0: 0, aporte: men, im: T.eaToPeriodic(sim.p.r, 12), meses: n * 12 });
      const xs = path.saldo.map((_, k) => k / 12);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: 0, ymax: path.saldo[n * 12] * 1.1, xlabel: 'años', yfmt: CC.copAxis, ml: 70 });
      pl.frame();
      pl.xy(xs, path.aportado, { color: '--c6', width: 2, dash: [5, 4] });
      pl.xy(xs, path.saldo, { color: '--c3', width: 2.6, fill: '--c3', fillAlpha: 0.1 });
      pl.legend([{ label: 'gastado (suma simple)', color: '--c6', dash: [5, 4] }, { label: 'si se hubiera invertido', color: '--c3' }], 'tl');
      sim.set('an', CC.cop(anual));
      sim.set('hr', CC.nf(anual / sim.p.h, 0) + ' h');
      sim.set('ac', CC.copS(path.aportado[n * 12]));
      sim.set('fv', CC.copS(path.saldo[n * 12]));
    });
  });
})();
