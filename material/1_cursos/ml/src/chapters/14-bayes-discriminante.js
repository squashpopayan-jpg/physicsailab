/* Capítulo 14 — Bayes ingenuo y análisis discriminante */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     14.1 Filtro de spam con Bayes multinomial
     ====================================================================== */
  const SPAM = ['gane dinero rápido sin salir de casa', 'oferta exclusiva gratis haga clic ya', 'premio gratis reclame su dinero hoy', 'crédito aprobado sin papeles llame ya',
    'gane un celular gratis responda ahora', 'dinero fácil oferta limitada clic aquí', 'últimos cupos oferta gratis inscríbase', 'su cuenta tiene un premio reclame ya',
    'descuento increíble solo por hoy compre ya', 'usted fue seleccionado para un premio en dinero', 'promoción gratis envíe sus datos ahora', 'trabaje desde casa y gane dinero extra'];
  const HAM = ['mañana es la reunión de laboratorio', 'le envío las notas del parcial de física', 'nos vemos en clase a las diez', 'adjunto el informe del proyecto',
    'la práctica de óptica se cambia al jueves', 'gracias por la revisión del artículo', 'hoy no hay clase por el festivo', 'recuerde traer la calculadora al examen',
    'el seminario de física es el viernes', 'revisé su código y funciona bien', 'la tutoría queda para el martes en la tarde', 'subí los datos del experimento a la carpeta'];
  const tok = (s) => s.toLowerCase().normalize('NFC').split(/[^a-záéíóúñü0-9]+/).filter(Boolean);
  ML.defineSim('spam-bayes', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Mensaje');
    const inp = document.createElement('input');
    inp.type = 'text'; inp.id = sim._id('msg'); inp.className = 'num-in'; inp.value = 'reclame gratis su premio de laboratorio';
    inp.style.cssText = 'width:100%;padding:6px 8px;border:1px solid var(--rule-strong);border-radius:4px;background:var(--surface);font:14px var(--font-ui)';
    inp.setAttribute('aria-label', 'Mensaje a clasificar');
    sim._group.append(inp);
    inp.addEventListener('input', () => sim.redraw());
    sim.slider('alpha', { label: 'Suavizado de Laplace α', min: 0.01, max: 5, value: 1, log: true, step: 0.01, fmt: f2 });
    sim.slider('prior', { label: 'Proporción a priori de spam', min: 0.05, max: 0.95, step: 0.01, value: 0.5, fmt: pct });
    sim.out('p', 'P(spam | mensaje)', { hl: true });
    sim.out('dec', 'Decisión');
    sim.out('unk', 'Palabras desconocidas (ignoradas)');
    const docs = [...SPAM, ...HAM].map(tok), y = [...SPAM.map(() => 1), ...HAM.map(() => 0)];
    const vocab = Array.from(new Set(docs.flat())).sort();
    const vi = new Map(vocab.map((w, i) => [w, i]));
    const counts = docs.map((d) => { const c = new Array(vocab.length).fill(0); d.forEach((w) => c[vi.get(w)]++); return c; });
    sim.onDraw(() => {
      const m = L.gen.multinomialNB(counts, y, vocab, sim.p.alpha);
      const words = tok(inp.value), known = words.filter((w) => vi.has(w)), unk = words.filter((w) => !vi.has(w));
      const contrib = known.map((w) => ({ w, v: m.logLik[1][vi.get(w)] - m.logLik[0][vi.get(w)] }));
      const prior = Math.log(sim.p.prior / (1 - sim.p.prior));
      const logit = prior + U.sum(contrib.map((c) => c.v)), p = U.sigmoid(logit);
      ML.draw.clear(cv);
      const items = [{ label: 'a priori', value: prior, color: '--c6' }, ...contrib.map((c) => ({ label: c.w, value: c.v, color: c.v > 0 ? '--k1' : '--k0' }))];
      const mx = Math.max(2, ...items.map((i) => Math.abs(i.value)));
      ML.text(cv.ctx, `log-odds de spam = ${f2(logit)}  →  P(spam) = ${f3(p)}`, 14, 18, { size: 12.5, color: '--ink', weight: 650 });
      ML.hbars(cv.ctx, { x: 6, y: 28, w: cv.w - 12, h: cv.h - 36 }, items.slice(0, 14), { labelW: 120, min: -mx, max: mx, fmt: f2, barH: 18 });
      sim.set('p', f3(p));
      sim.set('dec', p >= 0.5 ? '<b>spam</b>' : 'mensaje normal');
      sim.set('unk', unk.length ? unk.join(', ') : 'ninguna');
    });
  });

  /* ======================================================================
     14.2 Fronteras de Bayes ingenuo, LDA y QDA
     ====================================================================== */
  ML.defineSim('generativos-fronteras', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    sim.group('Clase azul');
    sim.slider('r0', { label: 'Correlación', min: -0.9, max: 0.9, step: 0.01, value: 0.7, fmt: f2 });
    sim.slider('s0', { label: 'Dispersión', min: 0.2, max: 1.2, step: 0.01, value: 0.55, fmt: f2 });
    sim.group('Clase naranja');
    sim.slider('r1', { label: 'Correlación', min: -0.9, max: 0.9, step: 0.01, value: 0.7, fmt: f2 });
    sim.slider('s1', { label: 'Dispersión', min: 0.2, max: 1.2, step: 0.01, value: 0.55, fmt: f2 });
    sim.group('Mostrar');
    sim.seg('map', { label: 'Mapa de probabilidad de', options: [['nb', 'Bayes ingenuo'], ['lda', 'LDA'], ['qda', 'QDA']], value: 'qda' });
    sim.check('ell', { label: 'Elipses estimadas (2σ) del modelo del mapa', value: true });
    sim.out('acc', 'Exactitud de prueba: ingenuo / LDA / QDA', { hl: true });
    sim.onDraw(() => {
      const spec = (n, seed) => L.data.gauss2([{ n, mean: [-0.6, -0.2], sd: [sim.p.s0, sim.p.s0], rho: sim.p.r0 }, { n, mean: [0.6, 0.3], sd: [sim.p.s1, sim.p.s1 * 0.8], rho: sim.p.r1 }], L.rng(seed));
      const tr = spec(120, 3), te = spec(800, 4);
      const M = { nb: L.gen.gaussianNB(tr.X, tr.y), lda: L.gen.lda(tr.X, tr.y), qda: L.gen.qda(tr.X, tr.y) };
      const view = ML.view2(cv, 2.6);
      ML.draw.clear(cv);
      const mm = M[sim.p.map];
      ML.probMap(view, (a, b) => mm.proba1([a, b]), { res: 5, alpha: 0.5 });
      const col = { nb: '--c5', lda: '--ink', qda: '--c3' };
      for (const k of ['nb', 'lda', 'qda']) ML.contour(view, (a, b) => { const p = M[k].proba1([a, b]); return p[1] - 0.5; }, 0, { res: 4, width: k === sim.p.map ? 2.8 : 1.6, color: col[k], dash: k === sim.p.map ? [] : [6, 4] });
      ML.points(view, tr.X, tr.y, { r: 3.4 });
      if (sim.p.ell) {
        if (sim.p.map === 'nb') mm.theta.forEach((m, c) => ML.ellipse(view, m, [[mm.sigma[c][0], 0], [0, mm.sigma[c][1]]], { color: ML.kvar(c), width: 2 }));
        else if (sim.p.map === 'lda') mm.mu.forEach((m, c) => ML.ellipse(view, m, mm.S, { color: ML.kvar(c), width: 2 }));
        else mm.mu.forEach((m, c) => ML.ellipse(view, m, mm.S[c], { color: ML.kvar(c), width: 2 }));
      }
      sim.legend([{ label: 'Bayes ingenuo', color: '--c5' }, { label: 'LDA', color: '--ink' }, { label: 'QDA', color: '--c3' }]);
      const acc = (m) => pct(L.met.accuracy(te.y, m.predict(te.X)));
      sim.set('acc', `${acc(M.nb)} / ${acc(M.lda)} / ${acc(M.qda)}`);
    });
  });
})();
