/* Capítulo 9 — El valor del dinero en el tiempo */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm;
  const xlNum = (v) => String(Math.round(v * 100) / 100).replace('.', ',');
  const xlPct = (v) => (Math.round(v * 1e6) / 1e4).toString().replace('.', ',') + '%';

  /* 9.1 Calculadora financiera */
  CC.defineSim('anualidad', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Línea de tiempo de los flujos y saldo' });
    sim.group('Situación');
    sim.seg('esc', { options: [['credito', 'Crédito'], ['ahorro', 'Ahorro'], ['renta', 'Renta']], value: 'credito' });
    sim.select('calc', { label: 'Calcular', value: 'pv', options: [['pv', 'Valor presente (VA)'], ['pmt', 'Cuota (PAGO)'], ['nper', 'Número de periodos (NPER)'], ['rate', 'Tasa por periodo (TASA)'], ['fv', 'Valor futuro (VF), solo ahorro']] });
    sim.group('Datos');
    sim.slider('i', { label: 'Tasa por periodo (mensual)', min: 0.0005, max: 0.05, step: 0.0005, value: 0.015, fmt: (v) => CC.pct(v, 2) });
    sim.slider('n', { label: 'Número de periodos (meses)', min: 1, max: 480, step: 1, value: 60, fmt: (v) => CC.nf(v) });
    sim.slider('A', { label: 'Cuota por periodo', min: 10000, max: 10000000, step: 10000, value: 800000, fmt: CC.cop });
    sim.slider('P', { label: 'Valor presente', min: 0, max: 500000000, step: 500000, value: 30000000, fmt: CC.copS });
    sim.slider('F', { label: 'Valor futuro (meta de ahorro)', min: 0, max: 1000000000, step: 1000000, value: 50000000, fmt: CC.copS });
    sim.seg('tipo', { label: 'Pagos', options: [[0, 'al final (vencidos)'], [1, 'al inicio (anticipados)']], value: 0 });
    sim.out('res', 'Resultado', { hl: true });
    sim.out('txt', '', { wide: true });
    sim.out('xl', 'En la hoja de cálculo', { wide: true });
    const vis = () => {
      const c = sim.p.calc, e = sim.p.esc;
      if (c === 'fv' && e !== 'ahorro') sim.ctl.calc.set('pv', true);
      const cc = sim.p.calc;
      sim.ctl.i.show(cc !== 'rate'); sim.ctl.n.show(cc !== 'nper'); sim.ctl.A.show(cc !== 'pmt');
      sim.ctl.P.show(cc !== 'pv'); sim.ctl.F.show(e === 'ahorro' && cc !== 'fv');
      sim.ctl.P.label(e === 'credito' ? 'Monto del crédito (recibido hoy)' : e === 'ahorro' ? 'Ahorro inicial (aportado hoy)' : 'Capital invertido hoy');
      sim.ctl.A.label(e === 'renta' ? 'Renta que se recibe por periodo' : e === 'ahorro' ? 'Aporte por periodo' : 'Cuota por periodo');
    };
    sim.onChange = vis;
    vis();
    sim.onDraw(() => {
      const e = sim.p.esc, c = sim.p.calc, tipo = +sim.p.tipo;
      /* signos: crédito (+P, −A, 0); ahorro (−P, −A, +F); renta (−P, +A, 0) */
      const sP = e === 'credito' ? 1 : -1, sA = e === 'renta' ? 1 : -1;
      let i = sim.p.i, n = Math.round(sim.p.n), A = sim.p.A, P = sim.p.P, F = e === 'ahorro' ? sim.p.F : 0;
      let res = '', txt = '', xl = '';
      try {
        if (c === 'pv') { P = sP * T.pv(i, n, sA * A, F, tipo); res = CC.cop(P); xl = `=VA(${xlPct(i)};${n};${xlNum(sA * A)};${xlNum(F)};${tipo})`; }
        else if (c === 'pmt') { A = sA * T.pmt(i, n, sP * P, F, tipo); res = CC.cop(A); xl = `=PAGO(${xlPct(i)};${n};${xlNum(sP * P)};${xlNum(F)};${tipo})`; }
        else if (c === 'nper') { n = T.nper(i, sA * A, sP * P, F, tipo); res = isFinite(n) && n > 0 ? CC.nf(n, 1) + ' periodos' : 'imposible'; xl = `=NPER(${xlPct(i)};${xlNum(sA * A)};${xlNum(sP * P)};${xlNum(F)};${tipo})`; }
        else if (c === 'rate') { i = T.rate(n, sA * A, sP * P, F, tipo); res = isFinite(i) ? `${CC.pct(i, 3)} por periodo · ${CC.pct(T.periodicToEa(i, 12), 2)} E.A.` : 'sin solución'; xl = `=TASA(${n};${xlNum(sA * A)};${xlNum(sP * P)};${xlNum(F)};${tipo})`; }
        else if (c === 'fv') { F = T.fv(i, n, sA * A, sP * P, tipo); res = CC.cop(F); xl = `=VF(${xlPct(i)};${n};${xlNum(sA * A)};${xlNum(sP * P)};${tipo})`; }
      } catch (err) { res = '—'; }
      const nn = Math.max(1, Math.round(isFinite(n) ? n : 1));
      if (e === 'credito') txt = `Recibe ${CC.copS(P)} hoy y paga ${nn} cuotas de ${CC.cop(A)} al ${CC.pct(i, 2)} por periodo (${CC.pct(T.periodicToEa(i, 12), 2)} E.A. si son meses). Paga en total ${CC.copS(A * nn)}.`;
      else if (e === 'ahorro') txt = `Aporta ${CC.copS(P)} hoy y ${CC.cop(A)} durante ${nn} periodos al ${CC.pct(i, 2)}; al final tiene ${CC.copS(F)}, de los cuales ${CC.copS(P + A * nn)} salieron de su bolsillo.`;
      else txt = `Invierte ${CC.copS(P)} hoy y recibe ${CC.cop(A)} durante ${nn} periodos, con una rentabilidad de ${CC.pct(i, 2)} por periodo. El capital se agota al final.`;
      sim.set('res', res);
      sim.set('txt', txt);
      sim.set('xl', `<code class="f">${xl}</code>`);
      /* dibujo: saldo a lo largo del tiempo */
      CC.draw.clear(cv);
      if (!(isFinite(i) && isFinite(A) && isFinite(P) && nn > 0)) return;
      const bal = [];
      let s = e === 'credito' ? P : e === 'ahorro' ? P : P;
      bal.push(s);
      for (let k = 1; k <= nn; k++) {
        if (tipo) s += e === 'ahorro' ? A : -A;
        s *= 1 + i;
        if (!tipo) s += e === 'ahorro' ? A : -A;
        bal.push(s);
      }
      const ymax = Math.max(...bal, 1) * 1.1, ymin = Math.min(0, ...bal);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: nn, ymin, ymax, xlabel: 'periodo', yfmt: CC.copAxis, ml: 70, title: e === 'credito' ? 'saldo de la deuda' : e === 'ahorro' ? 'saldo ahorrado' : 'capital restante' });
      pl.frame();
      const xs = bal.map((_, k) => k);
      pl.xy(xs, bal, { color: e === 'credito' ? '--c2' : '--c1', width: 2.6, fill: e === 'credito' ? '--c2' : '--c1', fillAlpha: 0.1 });
      if (nn <= 72) xs.forEach((k) => { if (k > 0 || tipo) pl.dot(k, bal[k], { color: e === 'credito' ? '--c2' : '--c1', r: 2.4 }); });
    });
  });

  /* 9.2 Línea de tiempo: VPN y TIR */
  CC.defineSim('linea-tiempo', function (sim) {
    const ct = sim.canvas({ aspect: 2.4, label: 'Flujos del proyecto y su valor presente' });
    const cp = sim.canvas({ aspect: 2.4, label: 'Perfil del VPN según la tasa de descuento' });
    sim.group('Flujos (millones de pesos)');
    sim.slider('f0', { label: 'Inversión inicial (año 0)', min: 1, max: 100, step: 1, value: 30, fmt: (v) => '−' + CC.nf(v) });
    const DEF = [6, 8, 9, 10, 12];
    DEF.forEach((v, k) => sim.slider('f' + (k + 1), { label: `Flujo del año ${k + 1}`, min: -20, max: 40, step: 0.5, value: v, fmt: (x) => CC.nf(x, 1) }));
    sim.group('Descuento');
    sim.slider('r', { label: 'Tasa de descuento', min: 0, max: 0.4, step: 0.0025, value: 0.11, fmt: (v) => CC.pct(v, 2) });
    sim.out('vpn', 'VPN a la tasa elegida', { hl: true });
    sim.out('tir', 'TIR');
    sim.out('suma', 'Suma simple de los flujos');
    sim.out('dec', 'Decisión');
    sim.onDraw(() => {
      const F = [-sim.p.f0, sim.p.f1, sim.p.f2, sim.p.f3, sim.p.f4, sim.p.f5].map((v) => v * 1e6);
      const r = sim.p.r, vpn = T.npv(r, F), tir = T.irr(F);
      CC.draw.clear(ct);
      const m = Math.max(...F.map(Math.abs)) * 1.2;
      const p1 = new CC.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: -0.6, xmax: 5.6, ymin: -m, ymax: m * 0.75, xlabel: 'año', yfmt: CC.copAxis, ml: 66, xticks: [0, 1, 2, 3, 4, 5] });
      p1.frame();
      p1.bars([0, 1, 2, 3, 4, 5], F, { signed: true, w: 0.55, alpha: 0.35 });
      p1.bars([0, 1, 2, 3, 4, 5], F.map((v, t) => v / Math.pow(1 + r, t)), { signed: true, w: 0.3, alpha: 0.95 });
      p1.legend([{ label: 'flujo nominal', color: '--c3', kind: 'sq' }, { label: 'valor presente del flujo', color: '--ink', kind: 'sq' }], 'tl');
      CC.draw.clear(cp);
      const rmax = 0.5, vals = L.util.linspace(0, rmax, 200).map((x) => T.npv(x, F));
      const lo = Math.min(...vals), hi = Math.max(...vals);
      const p2 = new CC.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: rmax, ymin: Math.min(lo, -1e6) * 1.1, ymax: Math.max(hi, 1e6) * 1.1, xlabel: 'tasa de descuento', ylabel: 'VPN', xfmt: CC.pctAxis, yfmt: CC.copAxis, ml: 66 });
      p2.frame();
      p2.fn((x) => T.npv(x, F), { color: '--c1', width: 2.6 });
      if (isFinite(tir) && tir <= rmax && tir >= 0) p2.dot(tir, 0, { color: '--gold', label: 'TIR ' + CC.pct(tir, 2), r: 5 });
      p2.vline(r, { color: '--accent', dash: [] });
      p2.dot(r, vpn, { color: vpn >= 0 ? '--gain' : '--loss' });
      sim.set('vpn', `<span class="${vpn >= 0 ? 'gain' : 'loss'}">${CC.cop(vpn)}</span>`);
      sim.set('tir', isFinite(tir) ? CC.pct(tir, 2) : 'no existe');
      sim.set('suma', CC.cop(F.reduce((s, v) => s + v, 0)));
      sim.set('dec', vpn >= 0 ? 'crea valor frente a la alternativa' : 'destruye valor frente a la alternativa');
    });
  });

  /* 9.3 Contado o cuotas */
  CC.defineSim('contado-cuotas', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Tasa implícita de la compra a cuotas frente a la usura' });
    sim.group('Oferta');
    sim.seg('modo', { options: [['cuota', 'Cuota conocida'], ['desc', 'Sin interés o con descuento']], value: 'cuota' });
    sim.num('c', { label: 'Precio de contado', value: 2000000, min: 1000, money: true });
    sim.num('q', { label: 'Valor de cada cuota', value: 185000, min: 100, money: true });
    sim.slider('n', { label: 'Número de cuotas', min: 2, max: 48, step: 1, value: 12, fmt: (v) => CC.nf(v) });
    sim.num('lista', { label: 'Precio de lista (a cuotas sin interés)', value: 2000000, min: 1000, money: true });
    sim.slider('d', { label: 'Descuento por pago de contado', min: 0, max: 0.3, step: 0.005, value: 0.1, fmt: (v) => CC.pct(v, 1) });
    sim.out('tot', 'Total a cuotas / contado');
    sim.out('im', 'Tasa mensual implícita', { hl: true });
    sim.out('ea', 'Tasa efectiva anual');
    sim.out('cmp', 'Frente a la usura (octubre de 2026)');
    const vis = () => { const d = sim.p.modo === 'desc'; sim.ctl.c.show(!d); sim.ctl.q.show(!d); sim.ctl.lista.show(d); sim.ctl.d.show(d); };
    sim.onChange = vis;
    vis();
    sim.onDraw(() => {
      const n = Math.round(sim.p.n);
      let contado, cuota;
      if (sim.p.modo === 'desc') { contado = sim.p.lista * (1 - sim.p.d); cuota = sim.p.lista / n; }
      else { contado = sim.p.c; cuota = sim.p.q; }
      const im = cuota * n <= contado ? 0 : T.rate(n, -cuota, contado);
      const ea = T.periodicToEa(im, 12), u = L.tax.CO.usuraOct2026;
      CC.draw.clear(cv);
      const xmax = Math.max(0.6, ea * 1.25);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax, ymin: 0, ymax: 1, yticks: [], xlabel: 'tasa efectiva anual', xfmt: CC.pctAxis, mb: 40, ml: 20 });
      pl.frame();
      const marks = [['CDT típico', 0.09, '--c3'], ['IBC consumo', L.tax.CO.ibcOct2026, '--c6'], ['usura', u, '--loss']];
      marks.forEach(([nm, v, col], k) => pl.vline(v, { color: col, label: nm, labelY: 14 + 16 * k, dash: [4, 3] }));
      const ctx = cv.ctx, y0 = pl.Y(0.62), y1 = pl.Y(0.38);
      ctx.fillStyle = CC.col(ea > u ? '--loss' : ea > 0.15 ? '--c4' : '--c1');
      ctx.fillRect(pl.ix, y0, pl.X(Math.min(ea, xmax)) - pl.ix, y1 - y0);
      CC.text(ctx, `tasa implícita ${CC.pct(ea, 1)} E.A.`, pl.X(Math.min(ea, xmax)) + 6, (y0 + y1) / 2, { size: 13, weight: 700, baseline: 'middle', halo: true });
      sim.set('tot', `${CC.cop(cuota * n)} / ${CC.cop(contado)}`);
      sim.set('im', isFinite(im) ? CC.pct(im, 2) : '—');
      sim.set('ea', isFinite(ea) ? CC.pct(ea, 2) : '—');
      sim.set('cmp', ea > u ? '<span class="loss">por encima de la usura</span>' : `${CC.pct(u - ea, 1)} por debajo`);
    });
  });
})();
