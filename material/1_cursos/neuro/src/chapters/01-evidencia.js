/* Capítulo 1 — Cómo saber qué funciona */
(function () {
  'use strict';
  const RC = window.RC, L = RC.L, E = L.ev;

  /* ======================================================================
     1.1 Regresión a la media: una terapia inútil que parece funcionar
     ====================================================================== */
  RC.defineSim('regresion', function (sim) {
    sim.cols2();
    const ct = sim.canvas({ aspect: 1.05, label: 'Síntoma semanal de tres personas: consultan en su peor semana' });
    const cs = sim.canvas({ aspect: 1.05, label: 'Síntoma al consultar frente a síntoma semanas después' });
    sim.group('Cómo fluctúa el síntoma');
    sim.slider('phi', { label: 'Autocorrelación entre semanas', min: 0, max: 0.95, step: 0.05, value: 0.6, fmt: (v) => RC.nf(v, 2) });
    sim.slider('um', { label: 'Umbral para pedir cita (0–10)', min: 5.5, max: 8.5, step: 0.1, value: 7, fmt: (v) => RC.nf(v, 1) });
    sim.slider('sem', { label: 'Semanas hasta el seguimiento', min: 1, max: 12, step: 1, value: 4, fmt: (v) => RC.nf(v) });
    sim.group('El tratamiento');
    sim.slider('ef', { label: 'Efecto real del tratamiento (puntos)', min: 0, max: 2, step: 0.1, value: 0, fmt: (v) => RC.nf(v, 1) });
    let seed = 1;
    sim.button('Otras personas', () => { seed++; }, { id: 'otra' });
    sim.out('mej', 'Mejora media de los tratados', { hl: true });
    sim.out('frac', 'Mejoraron 2 puntos o más');
    sim.out('real', 'Parte debida al tratamiento');
    sim.onDraw(() => {
      const o = { n: 150, mu: 5, sdBetween: 1, sdWithin: 1.5, phi: sim.p.phi, umbral: sim.p.um, semanas: sim.p.sem, efecto: sim.p.ef, seed };
      const r = E.trial(o);
      /* series de tres personas */
      const rng = L.rng(seed * 7 + 1);
      RC.draw.clear(ct);
      const W = 20;
      const pt = new RC.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: 0, xmax: W, ymin: 0, ymax: 10, xlabel: 'semana', ylabel: 'síntoma (0–10)', title: 'tres personas (• = semana en que consultan)' });
      pt.frame();
      pt.hline(sim.p.um, { color: '--c2', label: 'umbral', labelRight: true });
      const cols = ['--c1', '--c4', '--c5'];
      for (let k = 0; k < 3; k++) {
        const base = 5 + rng.gauss() * 0.8;
        let e = 1.5 * rng.gauss(), consult = -1;
        const xs = [], ys = [];
        for (let w = 0; w <= W; w++) {
          let y = base + e;
          if (consult >= 0 && w >= consult + sim.p.sem) y -= sim.p.ef;
          xs.push(w); ys.push(Math.max(0, Math.min(10, y)));
          if (consult < 0 && w > 2 && y >= sim.p.um) consult = w;
          e = sim.p.phi * e + 1.5 * Math.sqrt(1 - sim.p.phi * sim.p.phi) * rng.gauss();
        }
        pt.xy(xs, ys, { color: cols[k], width: 2 });
        if (consult >= 0) {
          pt.dot(consult, ys[consult], { color: cols[k], r: 5 });
          if (consult + sim.p.sem <= W) pt.dot(consult + sim.p.sem, ys[consult + sim.p.sem], { color: cols[k], r: 4 });
        }
      }
      /* dispersión pre/post */
      RC.draw.clear(cs);
      const ps = new RC.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 4, xmax: 10, ymin: 0, ymax: 10, xlabel: 'síntoma al consultar', ylabel: 'síntoma en el seguimiento', title: '150 personas tratadas' });
      ps.frame();
      ps.fn((x) => x, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      ps.fn((x) => x - 2, { color: '--gain', width: 1, dash: [2, 4] });
      const a = r.arms.trat;
      a.pre.forEach((p, i) => ps.dot(p, a.post[i], { color: a.post[i] <= p - 2 ? '--gain' : '--c1', r: 3 }));
      ps.label(9.4, 9.6, 'sin cambio', { align: 'right' });
      ps.label(9.4, 6.6, 'mejoró 2 o más', { align: 'right', color: '--gain' });
      sim.set('mej', `${RC.nf(r.mejoraTrat, 2)} puntos`);
      sim.set('frac', RC.pct(r.frac('trat'), 0));
      sim.set('real', sim.p.ef > 0 ? `${RC.nf(sim.p.ef, 1)} de ${RC.nf(r.mejoraTrat, 2)} puntos` : '<span class="loss">ninguna: el tratamiento no hace nada</span>');
    });
  });

  /* ======================================================================
     1.2 Tres diseños de estudio
     ====================================================================== */
  RC.defineSim('ensayo', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Efecto estimado por tres diseños frente al efecto real' });
    sim.group('Lo que pasa en la realidad');
    sim.slider('ef', { label: 'Efecto real del tratamiento (d)', min: 0, max: 0.8, step: 0.05, value: 0, fmt: (v) => RC.nf(v, 2) });
    sim.slider('nat', { label: 'Mejora natural (regresión, historia natural)', min: 0, max: 0.8, step: 0.05, value: 0.4, fmt: (v) => RC.nf(v, 2) });
    sim.slider('pl', { label: 'Efecto placebo (expectativa)', min: 0, max: 0.6, step: 0.05, value: 0.3, fmt: (v) => RC.nf(v, 2) });
    sim.slider('sg', { label: 'Sesgo del evaluador que sabe quién fue tratado', min: 0, max: 0.6, step: 0.05, value: 0.2, fmt: (v) => RC.nf(v, 2) });
    sim.group('El estudio');
    sim.slider('n', { label: 'Pacientes por grupo', min: 10, max: 300, step: 10, value: 60, fmt: (v) => RC.nf(v) });
    let seed = 1;
    sim.button('Repetir el estudio', () => { seed++; }, { id: 'rep' });
    sim.out('pp', 'Antes y después');
    sim.out('le', 'Lista de espera');
    sim.out('sh', 'Simulado y ciego', { hl: true });
    sim.onDraw(() => {
      const n = sim.p.n, base = { n, natural: sim.p.nat, placebo: sim.p.pl, efecto: sim.p.ef, sesgo: sim.p.sg, seed: seed * 13 };
      /* antes y después: mejora media del grupo tratado en unidades de desviación estándar */
      const t1 = L.ter.blindTrial(Object.assign({}, base, { ciego: false, simulado: false }));
      const m = L.stat.mean(t1.tr), s = L.stat.sd(t1.tr), dPP = m / s, sePP = Math.sqrt(1 / n + (dPP * dPP) / (2 * n));
      const t2 = t1;
      const t3 = L.ter.blindTrial(Object.assign({}, base, { ciego: true, simulado: true, seed: seed * 13 + 1 }));
      const est = [
        { name: 'antes y después (sin control)', d: dPP, lo: dPP - 1.96 * sePP, hi: dPP + 1.96 * sePP },
        { name: 'control en lista de espera', d: t2.d, lo: t2.lo, hi: t2.hi },
        { name: 'control simulado y evaluación ciega', d: t3.d, lo: t3.lo, hi: t3.hi }
      ];
      RC.draw.clear(cv);
      const xmax = Math.max(1.6, ...est.map((e) => e.hi + 0.1));
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.5, xmax, ymin: 0, ymax: 3.4, yticks: [], xlabel: 'efecto estimado (d) con su intervalo del 95 %', ml: 16 });
      pl.frame();
      pl.vline(sim.p.ef, { color: '--gain', dash: [], width: 2, label: 'efecto real', labelY: 14 });
      pl.vline(0, { color: '--ink-3' });
      est.forEach((e, i) => {
        const y = 2.75 - i * 1.0;
        pl.path([[e.lo, y], [e.hi, y]], { color: i === 2 ? '--c1' : '--c2', width: 3 });
        pl.dot(e.d, y, { color: i === 2 ? '--c1' : '--c2', r: 6 });
        pl.label(-0.45, y + 0.24, e.name, { color: '--ink', size: 12.5 });
      });
      const f = (e) => `${RC.nf(e.d, 2)} [${RC.nf(e.lo, 2)}; ${RC.nf(e.hi, 2)}]`;
      sim.set('pp', f(est[0])); sim.set('le', f(est[1])); sim.set('sh', f(est[2]));
    });
  });

  /* ======================================================================
     1.3 Potencia y maldición del ganador
     ====================================================================== */
  RC.defineSim('potencia', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Efecto observado en doscientos estudios simulados' });
    sim.group('El efecto y el estudio');
    sim.slider('d', { label: 'Efecto real (d)', min: 0, max: 1, step: 0.05, value: 0.3, fmt: (v) => RC.nf(v, 2) });
    sim.slider('n', { label: 'Personas por grupo', min: 10, max: 300, step: 5, value: 20, fmt: (v) => RC.nf(v) });
    let seed = 1;
    sim.button('Otros 200 estudios', () => { seed++; }, { id: 'otros' });
    sim.out('pw', 'Fracción significativa (potencia simulada)', { hl: true });
    sim.out('pwt', 'Potencia teórica');
    sim.out('ms', 'd promedio de los significativos');
    sim.out('nn', 'n por grupo para 80 % de potencia');
    sim.onDraw(() => {
      const rng = L.rng(seed * 31), d = sim.p.d, n = sim.p.n, K = 200;
      const obs = [];
      for (let k = 0; k < K; k++) {
        const a = [], b = [];
        for (let i = 0; i < n; i++) { a.push(d + rng.gauss()); b.push(rng.gauss()); }
        const r = E.welch(a, b);
        obs.push({ d: r.d, sig: r.p < 0.05 && r.t > 0 });
      }
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -1, xmax: 2, ymin: 0, ymax: 1, yticks: [], xlabel: 'efecto observado en cada estudio (d)', ml: 16 });
      pl.frame();
      const rj = L.rng(seed);
      obs.forEach((o) => {
        const y = 0.08 + 0.84 * rj();
        const px = pl.X(Math.max(-1, Math.min(2, o.d))), py = pl.Y(y);
        cv.ctx.beginPath(); cv.ctx.arc(px, py, 3.6, 0, 7);
        if (o.sig) { cv.ctx.fillStyle = RC.col('--c2'); cv.ctx.fill(); }
        else { cv.ctx.strokeStyle = RC.col('--c6'); cv.ctx.lineWidth = 1.2; cv.ctx.stroke(); }
      });
      const sig = obs.filter((o) => o.sig);
      const msig = sig.length ? L.stat.mean(sig.map((o) => o.d)) : NaN;
      pl.vline(d, { color: '--gain', dash: [], width: 2, label: 'efecto real', labelY: 14 });
      if (sig.length) pl.vline(msig, { color: '--c2', label: 'promedio de los significativos', labelY: 30 });
      pl.vline(0, { color: '--ink-3' });
      sim.set('pw', RC.pct(sig.length / K, 0));
      sim.set('pwt', RC.pct(E.power(d, n), 0));
      sim.set('ms', sig.length ? `${RC.nf(msig, 2)}` + (d > 0 ? ` (${RC.nf(msig / d, 1)} veces el real)` : ' (falsos positivos)') : '—');
      sim.set('nn', d > 0 ? RC.nf(E.nForPower(d), 0) : '—');
    });
  });

  /* ======================================================================
     1.4 Metaanálisis real: BCG
     ====================================================================== */
  const BCG = [['Aronson 1948', 4, 119, 11, 128], ['Ferguson y Simes 1949', 6, 300, 29, 274], ['Rosenthal 1960', 3, 228, 11, 209], ['Hart y Sutherland 1977', 62, 13536, 248, 12619], ['Frimodt-Moller 1973', 33, 5036, 47, 5761], ['Stein y Aronson 1953', 180, 1361, 372, 1079], ['Vandiviere 1973', 8, 2537, 10, 619], ['TPT Madrás 1980', 505, 87886, 499, 87892], ['Coetzee y Berjak 1968', 29, 7470, 45, 7232], ['Rosenthal 1961', 17, 1699, 65, 1600], ['Comstock 1974', 186, 50448, 141, 27197], ['Comstock y Webster 1969', 5, 2493, 3, 2338], ['Comstock 1976', 27, 16886, 29, 17825]];
  RC.defineSim('bcg', function (sim) {
    const cv = sim.canvas({ aspect: 1.35, label: 'Gráfico de bosque de los 13 ensayos de la vacuna BCG' });
    sim.group('Modelo');
    sim.seg('mod', { options: [['ale', 'Efectos aleatorios'], ['fij', 'Efecto fijo']], value: 'ale' });
    sim.out('rr', 'Riesgo relativo combinado', { hl: true });
    sim.out('ci', 'IC 95 %');
    sim.out('tau', 'τ² (heterogeneidad)');
    sim.out('i2', 'I² y Q de Cochran');
    sim.note('Datos de los 13 ensayos (Colditz y otros, 1994; conjunto dat.bcg de metafor). Escala logarítmica.');
    sim.onDraw(() => {
      const y = BCG.map(([, a, b, c, d]) => Math.log((a / (a + b)) / (c / (c + d))));
      const v = BCG.map(([, a, b, c, d]) => 1 / a - 1 / (a + b) + 1 / c - 1 / (c + d));
      const m = E.metaDL(y, v), fij = sim.p.mod === 'fij';
      const mu = fij ? m.fixed : m.mu, se = fij ? m.seFixed : m.se;
      RC.draw.clear(cv);
      const K = BCG.length;
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.04, xmax: 4, xlog: true, ymin: -1.8, ymax: K + 0.4, yticks: [], xlabel: 'riesgo relativo de tuberculosis (vacunados / no vacunados)', ml: Math.min(170, cv.w * 0.32) });
      pl.frame();
      pl.vline(1, { color: '--ink-3', dash: [] });
      const wts = v.map((vi) => 1 / (vi + (fij ? 0 : m.tau2))), wmax = Math.max(...wts);
      BCG.forEach((row, i) => {
        const yy = K - i - 0.3, lo = Math.exp(y[i] - 1.96 * Math.sqrt(v[i])), hi = Math.exp(y[i] + 1.96 * Math.sqrt(v[i]));
        pl.path([[Math.max(0.04, lo), yy], [Math.min(4, hi), yy]], { color: '--c6', width: 1.5 });
        const px = pl.X(Math.exp(y[i])), py = pl.Y(yy), sz = 3 + 7 * Math.sqrt(wts[i] / wmax);
        cv.ctx.fillStyle = RC.col('--c1'); cv.ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
        RC.text(cv.ctx, row[0], pl.ix - 8, py, { size: 11.5, align: 'right', baseline: 'middle', color: '--ink-2' });
      });
      const yd = -1, lo = Math.exp(mu - 1.96 * se), hi = Math.exp(mu + 1.96 * se), c = Math.exp(mu);
      const ctx = cv.ctx;
      ctx.beginPath(); ctx.moveTo(pl.X(lo), pl.Y(yd)); ctx.lineTo(pl.X(c), pl.Y(yd) - 8); ctx.lineTo(pl.X(hi), pl.Y(yd)); ctx.lineTo(pl.X(c), pl.Y(yd) + 8); ctx.closePath();
      ctx.fillStyle = RC.col('--c2'); ctx.fill();
      RC.text(ctx, fij ? 'Efecto fijo' : 'Efectos aleatorios', pl.ix - 8, pl.Y(yd), { size: 12, weight: 700, align: 'right', baseline: 'middle' });
      sim.set('rr', RC.nf(c, 3));
      sim.set('ci', `${RC.nf(lo, 3)} a ${RC.nf(hi, 3)}`);
      sim.set('tau', fij ? '0 (supuesto)' : RC.nf(m.tau2, 4));
      sim.set('i2', `${RC.pct(m.I2, 1)} · Q = ${RC.nf(m.Q, 2)}`);
    });
  });

  /* ======================================================================
     1.5 Gráfico de embudo y sesgo de publicación
     ====================================================================== */
  RC.defineSim('embudo', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Gráfico de embudo de una literatura simulada' });
    sim.group('La literatura');
    sim.slider('d', { label: 'Efecto real (d)', min: 0, max: 0.8, step: 0.05, value: 0.2, fmt: (v) => RC.nf(v, 2) });
    sim.slider('pn', { label: 'Se publican los resultados no significativos', min: 0.05, max: 1, step: 0.05, value: 1, fmt: (v) => RC.pct(v, 0) });
    let seed = 1;
    sim.button('Otra literatura', () => { seed++; }, { id: 'otra' });
    sim.out('all', 'Metaanálisis con todos los estudios');
    sim.out('pub', 'Metaanálisis de lo publicado', { hl: true });
    sim.out('np', 'Estudios publicados');
    sim.out('eg', 'Prueba de Egger (p)');
    sim.onDraw(() => {
      const lit = E.literature({ k: 80, nMin: 10, nMax: 300, skew: 2.6, d: sim.p.d, pubNull: sim.p.pn, seed: seed * 17 });
      const pub = lit.filter((s) => s.pub);
      const mAll = E.metaDL(lit.map((s) => s.y), lit.map((s) => s.v));
      const mPub = pub.length > 2 ? E.metaDL(pub.map((s) => s.y), pub.map((s) => s.v)) : null;
      const eg = pub.length > 3 ? E.egger(pub.map((s) => s.y), pub.map((s) => s.v)) : null;
      RC.draw.clear(cv);
      const pl = new RC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -1, xmax: 1.6, ymin: 0.65, ymax: 0, yticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], xlabel: 'efecto observado (d)', ylabel: 'error estándar (más preciso arriba)' });
      pl.frame();
      const sePts = L.util.linspace(0.001, 0.65, 40);
      pl.xy(sePts.map((s) => sim.p.d - 1.96 * s), sePts, { color: '--ink-3', width: 1, dash: [4, 4] });
      pl.xy(sePts.map((s) => sim.p.d + 1.96 * s), sePts, { color: '--ink-3', width: 1, dash: [4, 4] });
      pl.xy(sePts.map((s) => 1.96 * s), sePts, { color: '--c2', width: 1, alpha: 0.5 });
      pl.label(0.03, 0.62, 'p = 0,05', { color: '--c2' });
      lit.forEach((s) => {
        const px = pl.X(s.y), py = pl.Y(Math.sqrt(s.v));
        cv.ctx.beginPath(); cv.ctx.arc(px, py, 3.8, 0, 7);
        if (s.pub) { cv.ctx.fillStyle = RC.col('--c1'); cv.ctx.fill(); }
        else { cv.ctx.strokeStyle = RC.col('--c6'); cv.ctx.lineWidth = 1; cv.ctx.stroke(); }
      });
      pl.vline(sim.p.d, { color: '--gain', dash: [], width: 2, label: 'real', labelY: 14 });
      if (mPub) pl.vline(mPub.mu, { color: '--c1', width: 2, label: 'publicado', labelY: 30 });
      pl.legend([{ label: 'publicado', color: '--c1', kind: 'dot' }, { label: 'en el cajón', color: '--c6', kind: 'dot' }], 'br');
      sim.set('all', `${RC.nf(mAll.mu, 2)} [${RC.nf(mAll.lo, 2)}; ${RC.nf(mAll.hi, 2)}]`);
      sim.set('pub', mPub ? `${RC.nf(mPub.mu, 2)} [${RC.nf(mPub.lo, 2)}; ${RC.nf(mPub.hi, 2)}]` : '—');
      sim.set('np', `${pub.length} de ${lit.length}`);
      sim.set('eg', eg ? (eg.p < 0.05 ? `<span class="loss">${RC.nf(eg.p, 4)}: embudo asimétrico</span>` : RC.nf(eg.p, 3)) : '—');
    });
  });

  /* ======================================================================
     Autoevaluación
     ====================================================================== */
  RC.defineSim('quiz-evidencia', function (sim) {
    RC.quiz(sim, [
      { q: 'Una persona con migraña prueba una terapia en su peor semana y a las tres semanas está mucho mejor. ¿Qué se puede concluir?', opts: ['Que la terapia funciona para ella', 'Nada sobre la terapia: la mejoría es esperable por regresión a la media e historia natural', 'Que la terapia es un placebo'], ok: 1, fb: 'Sin un grupo de comparación no se puede separar el efecto de la terapia de lo que habría pasado de todos modos. Tampoco se puede concluir que sea un placebo.' },
      { q: '¿Qué controla el grupo con tratamiento simulado que no controla la lista de espera?', opts: ['La regresión a la media', 'La expectativa (placebo) del paciente', 'La historia natural'], ok: 1, fb: 'La lista de espera ya controla la regresión y la historia natural; solo el simulado iguala las expectativas entre grupos.' },
      { q: 'Un estudio con 12 personas por grupo encuentra un efecto enorme y significativo. Lo más probable es que…', opts: ['El efecto real sea aún mayor', 'El efecto real exista pero sea bastante menor', 'El resultado sea definitivo'], ok: 1, fb: 'Con poca potencia, solo «salen significativos» los estudios en que el azar infló el efecto: la maldición del ganador.' },
      { q: 'En un gráfico de embudo faltan los estudios pequeños con efectos negativos. Eso sugiere…', opts: ['Que el tratamiento es muy eficaz', 'Sesgo de publicación: el metaanálisis probablemente sobreestima el efecto', 'Que los estudios grandes están equivocados'], ok: 1, fb: 'La asimetría del embudo es la huella típica de que los resultados nulos se quedaron sin publicar.' },
      { q: 'Un tratamiento tiene d = 0,5. ¿Cuál es aproximadamente su NNT?', opts: ['2', '3,6', '10'], ok: 1, fb: 'NNT = 1/(2Φ(0,5/√2) − 1) ≈ 3,6: hay que tratar a unas 3 o 4 personas para que una más mejore gracias al tratamiento.' }
    ], { id: 'evidencia', shuffle: true });
  });
})();
