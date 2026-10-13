/* Capítulo 25 — Fraudes, pirámides y gurús */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, F = L.fraude;

  /* 25.1 Esquema Ponzi */
  CC.defineSim('ponzi', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Caja real y saldos prometidos de un esquema Ponzi' });
    sim.group('La promesa');
    sim.slider('r', { label: 'Rendimiento mensual prometido', min: 0.01, max: 0.2, step: 0.005, value: 0.1, fmt: (v) => CC.pct(v, 1) });
    sim.slider('q', { label: 'Parte de los rendimientos que se retira', min: 0, max: 1, step: 0.05, value: 0.5, fmt: (v) => CC.pct(v, 0) });
    sim.slider('f', { label: 'Lo que se quedan los organizadores', min: 0, max: 0.5, step: 0.05, value: 0.2, fmt: (v) => CC.pct(v, 0) });
    sim.group('El reclutamiento');
    sim.slider('E0', { label: 'Aportes nuevos el primer mes', min: 10e6, max: 2000e6, step: 10e6, value: 100e6, fmt: CC.copS });
    sim.slider('g', { label: 'Crecimiento mensual de los aportes (auge)', min: 0, max: 0.4, step: 0.01, value: 0.15, fmt: (v) => CC.pct(v, 0) });
    sim.slider('fr', { label: 'Mes en que se frena el reclutamiento', min: 3, max: 48, step: 1, value: 18, fmt: (v) => CC.nf(v) });
    sim.out('col', 'Colapsa en el mes', { hl: true });
    sim.out('in', 'Total aportado por los participantes');
    sim.out('out', 'Total pagado (rendimientos y retiros)');
    sim.out('rob', 'Apropiado por los organizadores');
    sim.out('per', 'Saldos prometidos que no existen', { hl: true });
    sim.onDraw(() => {
      const R = F.ponzi({ r: sim.p.r, E0: sim.p.E0, g: sim.p.g, frena: sim.p.fr, caida: 0.25, q: sim.p.q, f: sim.p.f, M: 120, retiroPanico: 0.05 });
      const S = R.serie, xs = S.map((s) => s.m);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(6, xs[xs.length - 1] + 4), ymin: 0, ymax: Math.max(...S.map((s) => s.papel)) * 1.1, xlabel: 'meses', yfmt: CC.copAxis, ml: 76 });
      pl.frame();
      pl.xy(xs, S.map((s) => s.papel), { color: '--c2', width: 2.4, fill: '--c2', fillAlpha: 0.08 });
      pl.xy(xs, S.map((s) => s.caja), { color: '--c3', width: 2.6, fill: '--c3', fillAlpha: 0.15 });
      pl.xy(xs, S.map((s) => s.aporte), { color: '--c1', width: 1.8, dash: [5, 4] });
      pl.vline(sim.p.fr, { color: '--ink-3', label: 'se frena el reclutamiento', labelY: 14 });
      if (R.colapso > 0) pl.vline(R.colapso, { color: '--loss', label: 'colapso', labelY: 32, dash: [] });
      pl.legend([{ label: 'saldos prometidos (en papel)', color: '--c2' }, { label: 'caja real', color: '--c3' }, { label: 'aportes nuevos del mes', color: '--c1', dash: [5, 4] }], 'tl');
      sim.set('col', R.colapso > 0 ? String(R.colapso) : 'no en 10 años (exige aportes que crezcan sin fin)');
      sim.set('in', CC.copS(R.totalIn));
      sim.set('out', CC.copS(R.totalOut));
      sim.set('rob', CC.copS(R.robado));
      sim.set('per', CC.copS(Math.max(0, R.perdida)));
    });
  });

  /* 25.2 Pirámide */
  CC.defineSim('piramide', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Personas por nivel de una pirámide, escala logarítmica' });
    sim.group('Pirámide');
    sim.slider('k', { label: 'Personas que debe reclutar cada uno', min: 2, max: 12, step: 1, value: 6, fmt: (v) => CC.nf(v) });
    sim.seg('pob', { label: 'Población disponible', options: [[53e6, 'Colombia (≈ 53 millones)'], [1.5e6, 'Cauca (≈ 1,5 millones)'], [8.2e9, 'Mundo (≈ 8.200 millones)']], value: 53e6 });
    sim.out('n', 'Niveles hasta agotar la población', { hl: true });
    sim.out('tot', 'Participantes en total');
    sim.out('ult', 'Están en el último nivel (pierden)', { hl: true });
    sim.onDraw(() => {
      const k = Math.round(sim.p.k), P = +sim.p.pob, R = F.piramide(k, P);
      const xs = R.niveles.map((_, i) => i);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.6, xmax: xs.length - 0.4, ymin: 0.8, ymax: Math.max(P, R.niveles[R.niveles.length - 1]) * 3, ylog: true, xlabel: 'nivel de la pirámide', ylabel: 'personas en el nivel', ml: 80, xticks: xs, xfmt: (v) => String(Math.round(v)), yfmt: (v) => (v >= 1e9 ? CC.nf(v / 1e9, 0) + ' mil M' : v >= 1e6 ? CC.nf(v / 1e6, 0) + ' M' : v >= 1e3 ? CC.nf(v / 1e3, 0) + ' mil' : CC.nf(v, 0)) });
      pl.frame();
      pl.bars(xs, R.niveles, { colors: xs.map((i) => (i === xs.length - 1 ? '--loss' : '--c1')), w: 0.7, base: 0.8 });
      pl.hline(P, { color: '--gold', label: 'población disponible', dash: [] });
      sim.set('n', CC.nf(R.nivelesN));
      sim.set('tot', CC.nf(R.total));
      sim.set('ult', CC.pct(R.fraccionUltimo, 0));
    });
  });

  /* 25.3 Lista de verificación */
  const SEN = [
    ['g', 'Promete una rentabilidad alta y «garantizada»', 3],
    ['m', 'Ofrece más de 2 % mensual o más de 25 % al año', 3],
    ['re', 'Se gana por traer a otras personas', 3],
    ['v', 'La entidad no aparece como vigilada por la Superintendencia Financiera', 3],
    ['u', 'Presiona para decidir rápido («quedan pocos cupos»)', 2],
    ['x', 'La explicación es vaga: algoritmo, IA, minería, arbitraje, forex', 2],
    ['t', 'Le muestran testimonios, lujos y capturas en vez de estados financieros auditados', 2],
    ['a', 'Llegó por familiares, amigos, la iglesia o el trabajo', 1],
    ['p', 'Pagan puntualmente al principio pero retirar el capital tiene trabas', 3],
    ['e', 'Piden pagos en efectivo, criptomonedas o a cuentas personales', 2],
    ['c', 'No entregan contrato o el contrato no dice quién custodia el dinero', 2]
  ];
  CC.defineSim('checklist', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 4.6, label: 'Nivel de riesgo de la oferta', minH: '120px' });
    sim.group('Marque lo que aplica a la oferta');
    SEN.forEach(([id, t]) => sim.check(id, { label: t, value: false }));
    sim.out('s', 'Puntaje de alerta', { hl: true });
    sim.out('r', 'Lectura', { wide: true });
    sim.onDraw(() => {
      const max = SEN.reduce((s, x) => s + x[2], 0);
      const sc = SEN.reduce((s, [id, , w]) => s + (sim.p[id] ? w : 0), 0);
      const graves = SEN.filter(([id, , w]) => sim.p[id] && w === 3).length;
      CC.draw.clear(cv);
      const ctx = cv.ctx, x0 = 30, x1 = cv.w - 30, y = cv.h * 0.42, h = 22;
      const zonas = [[0, 0.15, '--gain'], [0.15, 0.4, '--gold'], [0.4, 1, '--loss']];
      zonas.forEach(([a, b, c]) => { ctx.fillStyle = CC.alpha(c, 0.3); ctx.fillRect(x0 + a * (x1 - x0), y, (b - a) * (x1 - x0), h); });
      const fx = x0 + (sc / max) * (x1 - x0);
      ctx.fillStyle = CC.col('--ink'); ctx.fillRect(fx - 2, y - 10, 4, h + 20);
      CC.text(ctx, 'pocas señales', x0, y - 14, { size: 12, color: '--gain', weight: 650 });
      CC.text(ctx, 'varias señales', x0 + 0.27 * (x1 - x0), y - 14, { size: 12, color: '--law-ink', weight: 650, align: 'center' });
      CC.text(ctx, 'muy probablemente fraudulenta', x1, y - 14, { size: 12, color: '--loss', weight: 650, align: 'right' });
      CC.text(ctx, `${sc} de ${max} puntos · ${graves} señales graves`, (x0 + x1) / 2, y + h + 26, { size: 13, weight: 700, align: 'center' });
      sim.set('s', `${sc} / ${max}`);
      sim.set('r', graves >= 2 || sc / max >= 0.4 ? 'Tiene la forma de una pirámide o un esquema Ponzi. No entregue dinero; consulte a la Superintendencia Financiera y, si ya lo entregó, documente todo y denuncie.' : sc / max >= 0.15 || graves === 1 ? 'Hay señales serias. Verifique si la entidad está vigilada, pida estados financieros auditados y el contrato por escrito, y no decida bajo presión.' : sc === 0 ? 'Marque las señales que reconozca en la oferta que está evaluando.' : 'Pocas señales, pero verifique de todas formas quién custodia el dinero y si la entidad está vigilada.');
    });
  });
})();
