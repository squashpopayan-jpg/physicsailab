/* Capítulo 16 — Riesgo, rentabilidad y volatilidad */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, I = L.inv, S = L.stat;
  const COLS = { sp500: '--c1', smallcap: '--c5', tbond: '--c3', baa: '--c7', tbill: '--c6', realestate: '--c4', gold: '--gold' };
  const NOMBRE = { sp500: 'Acciones grandes', smallcap: 'Acciones pequeñas', tbond: 'Bonos del Tesoro 10 años', baa: 'Bonos corporativos Baa', tbill: 'Letras del Tesoro', realestate: 'Vivienda (precio)', gold: 'Oro' };

  /* 16.1 Historia de los activos */
  CC.defineSim('historia-activos', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Crecimiento de 100 dólares en cada activo, escala logarítmica' });
    const tabla = sim.html();
    const Y = L.DATA.us.years;
    sim.group('Periodo');
    sim.slider('y0', { label: 'Año inicial', min: 1928, max: 2015, step: 1, value: 1928, fmt: String });
    sim.check('real', { label: 'En términos reales (descontada la inflación)', value: false });
    sim.group('Activos');
    Object.keys(NOMBRE).forEach((k) => sim.check('a_' + k, { label: NOMBRE[k], value: ['sp500', 'tbond', 'tbill', 'gold', 'realestate'].includes(k) }));
    sim.onDraw(() => {
      const y0 = Math.round(sim.p.y0), y1 = Y[Y.length - 1], real = sim.p.real;
      const keys = Object.keys(NOMBRE).filter((k) => sim.p['a_' + k]);
      const xs = [y0 - 1].concat(Y.slice(Y.indexOf(y0)));
      const series = keys.map((k) => ({ k, g: I.growth(I.series(k, y0, y1, real), 100) }));
      CC.draw.clear(cv);
      const all = series.flatMap((s) => s.g);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: y0 - 1, xmax: y1, ymin: Math.max(1, Math.min(100, ...all) * 0.7), ymax: Math.max(200, ...all) * 1.6, ylog: true, ylabel: real ? `dólares de ${y0 - 1}` : 'dólares', xfmt: (v) => String(Math.round(v)), yfmt: (v) => (v >= 1e6 ? CC.nf(v / 1e6, 0) + ' M' : v >= 1e3 ? CC.nf(v / 1e3, 0) + ' mil' : CC.nf(v, 0)) });
      pl.frame();
      if (!real) pl.xy(xs, I.growth(I.series('inflation', y0, y1), 100), { color: '--c2', width: 1.6, dash: [5, 4] });
      series.forEach((s) => pl.xy(xs, s.g, { color: COLS[s.k], width: 2.4 }));
      pl.legend(series.map((s) => ({ label: NOMBRE[s.k], color: COLS[s.k] })).concat(real ? [] : [{ label: 'inflación (precios)', color: '--c2', dash: [5, 4] }]), 'tl');
      series.forEach((s) => pl.endLabel(y1, s.g[s.g.length - 1], CC.nf(s.g[s.g.length - 1], 0), { color: COLS[s.k] }));
      const rows = keys.map((k) => { const r = I.series(k, y0, y1, real), sm = I.summary(r); return [NOMBRE[k], CC.pct(sm.geo, 2), CC.pct(sm.sd, 1), CC.pct(sm.min, 1), CC.pct(sm.mdd, 0)]; });
      tabla.innerHTML = `<p class="ctrl-note" style="margin:0 0 6px">Estadísticas de ${y0} a ${y1}${real ? ', en términos reales' : ', nominales en dólares'} (caída máxima con datos anuales)</p>` + CC.table(['Activo', 'Media geométrica', 'Volatilidad', 'Peor año', 'Caída máxima'], rows);
    });
  });

  /* 16.2 Trayectorias con la misma media */
  CC.defineSim('caminos', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Doscientas trayectorias simuladas' });
    sim.group('Inversión');
    sim.slider('mu', { label: 'Rentabilidad esperada (media aritmética)', min: 0, max: 0.2, step: 0.005, value: 0.08, fmt: (v) => CC.pct(v, 1) });
    sim.slider('sd', { label: 'Volatilidad anual', min: 0, max: 0.6, step: 0.01, value: 0.18, fmt: (v) => CC.pct(v, 0) });
    sim.slider('n', { label: 'Años', min: 1, max: 40, step: 1, value: 20, fmt: (v) => CC.nf(v) });
    let seed = 1;
    sim.button('Otras trayectorias', () => { seed++; }, { id: 'new' });
    sim.out('me', 'Promedio final (de $1)');
    sim.out('md', 'Mediana final (trayectoria típica)', { hl: true });
    sim.out('g', 'Crecimiento típico anual (≈ μ − σ²/2)');
    sim.out('pp', 'Trayectorias que terminan perdiendo');
    sim.onDraw(() => {
      const n = Math.round(sim.p.n);
      const P = I.paths({ mu: sim.p.mu, sigma: sim.p.sd, anos: n, aporte: 0, p0: 1, n: 200, seed: seed * 17 }).paths;
      const q = I.fan(P);
      const xs = L.util.range(n + 1);
      CC.draw.clear(cv);
      const ymax = Math.max(q[4][n] * 1.2, Math.pow(1 + sim.p.mu, n) * 1.2, 2);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: Math.max(0.02, q[0][n] * 0.6), ymax, ylog: true, xlabel: 'años', ylabel: 'valor de $1 (escala logarítmica)', yfmt: (v) => CC.nf(v, v < 1 ? 2 : v < 10 ? 1 : 0) });
      pl.frame();
      P.slice(0, 70).forEach((p) => pl.xy(xs, p, { color: '--c1', width: 0.8, alpha: 0.22 }));
      pl.between(xs, q[0], q[4], { color: '--c1', alpha: 0.1 });
      pl.xy(xs, q[2], { color: '--c1', width: 2.8 });
      pl.xy(xs, xs.map((t) => Math.pow(1 + sim.p.mu, t)), { color: '--gold', width: 2.2, dash: [6, 4] });
      pl.hline(1, { color: '--loss', label: 'lo invertido', labelRight: true });
      pl.legend([{ label: 'mediana', color: '--c1' }, { label: 'promedio esperado (1+μ)ⁿ', color: '--gold', dash: [6, 4] }, { label: 'banda del 5 % al 95 %', color: '--c1', kind: 'sq' }], 'tl');
      const fin = P.map((p) => p[n]);
      sim.set('me', CC.nf(S.mean(fin), 2) + ` (esperado ${CC.nf(Math.pow(1 + sim.p.mu, n), 2)})`);
      sim.set('md', CC.nf(q[2][n], 2));
      sim.set('g', CC.pct(Math.pow(q[2][n], 1 / n) - 1, 1) + ` (≈ ${CC.pct(sim.p.mu - sim.p.sd * sim.p.sd / 2, 1)})`);
      sim.set('pp', CC.pct(fin.filter((v) => v < 1).length / fin.length, 0));
    });
  });

  /* 16.3 Ventanas de N años */
  CC.defineSim('horizonte', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Rentabilidad anualizada de cada ventana de N años' });
    const Y = L.DATA.us.years;
    sim.group('Ventanas');
    sim.select('k', { label: 'Activo', value: 'sp500', options: [['sp500', 'Acciones grandes (S&P 500)'], ['mix', 'Portafolio 60/40 (acciones / bonos)'], ['tbond', 'Bonos del Tesoro 10 años'], ['tbill', 'Letras del Tesoro'], ['gold', 'Oro'], ['smallcap', 'Acciones pequeñas']] });
    sim.slider('N', { label: 'Horizonte N (años)', min: 1, max: 40, step: 1, value: 10, fmt: (v) => CC.nf(v) });
    sim.check('real', { label: 'En términos reales', value: true });
    sim.out('min', 'Peor ventana (anual)');
    sim.out('max', 'Mejor ventana (anual)');
    sim.out('med', 'Mediana');
    sim.out('neg', 'Ventanas negativas', { hl: true });
    sim.out('cnt', 'Número de ventanas');
    sim.onDraw(() => {
      const N = Math.round(sim.p.N), y1 = Y[Y.length - 1];
      const r = sim.p.k === 'mix' ? I.mixRebal({ sp500: 0.6, tbond: 0.4 }, 1928, y1, sim.p.real) : I.series(sim.p.k, 1928, y1, sim.p.real);
      const w = I.rolling(r, N);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1927, xmax: y1 - N + 2, ymin: Math.min(-0.1, ...w) * 1.1, ymax: Math.max(0.1, ...w) * 1.1, xlabel: 'año de inicio de la ventana', ylabel: `rentabilidad anualizada en ${N} años`, xfmt: (v) => String(Math.round(v)), yfmt: CC.pctAxis });
      pl.frame();
      pl.between([1927, y1 + 1], [pl.o.ymin, pl.o.ymin], [0, 0], { color: '--loss', alpha: 0.06 });
      pl.bars(w.map((_, s) => 1928 + s), w, { signed: true, w: 0.8, alpha: 0.75 });
      const sorted = Float64Array.from(w).sort();
      sim.set('min', CC.pct(sorted[0], 1));
      sim.set('max', CC.pct(sorted[sorted.length - 1], 1));
      sim.set('med', CC.pct(S.quantile(w, 0.5), 1));
      const neg = w.filter((x) => x < 0).length / w.length;
      sim.set('neg', neg > 0 ? `<span class="loss">${CC.pct(neg, 1)}</span>` : '<span class="gain">ninguna</span>');
      sim.set('cnt', CC.nf(w.length));
    });
  });
})();
