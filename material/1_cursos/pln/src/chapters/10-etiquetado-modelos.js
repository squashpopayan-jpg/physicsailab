/* Capítulo 10 — Etiquetar con reglas y con estadísticas */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, H = L.hmm;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const TR = () => L.corpus.cess.slice(0, 240), TE = () => L.corpus.cess.slice(240);

  NL.defineSim('cadena-taggers', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Cadena de taggers');
    sim.check('bi', { label: 'Bigrama (etiqueta anterior + palabra)', value: true });
    sim.check('sf', { label: 'Sufijos para palabras desconocidas', value: true });
    sim.seg('g', { label: 'Etiquetas', options: [[1, 'Gruesas (13)'], [0, 'EAGLES (170)']], value: 1 });
    sim.slider('s', { label: 'Oración de prueba', min: 1, max: 60, step: 1, value: 3, fmt: (v) => String(v) });
    sim.out('t', 'Exactitud total', { hl: true });
    sim.out('k', 'Palabras conocidas');
    sim.out('u', 'Palabras desconocidas');
    sim.out('f', 'Desconocidas en la prueba');
    const cache = {};
    sim.onDraw(() => {
      const o = { coarse: !!sim.p.g, bigrama: sim.p.bi, sufijos: sim.p.sf };
      const key = JSON.stringify(o);
      if (!cache[key]) { const t = H.cadena(TR(), o); cache[key] = { t, e: H.evaluar(t.predecir, TE(), o, t.conocidas) }; }
      const { t, e } = cache[key];
      sim.set('t', NL.pct(e.acc, 1)); sim.set('k', NL.pct(e.accK, 1)); sim.set('u', NL.pct(e.accU, 1)); sim.set('f', NL.pct(e.nU / e.n, 1));
      const s = H.prep([TE()[sim.p.s - 1]], o)[0], pr = t.predecir(s.map(([w]) => w));
      box.innerHTML = `<small style="color:var(--ink-3)">Oración ${sim.p.s} de prueba: etiqueta predicha sobre la real (rojo = error; borde discontinuo = palabra desconocida)</small><div class="tk-row">${s.map(([w, g], i) => `<span class="tk ${pr[i] === g ? 'ok' : 'bad'}" style="${t.conocidas.has(w) ? '' : 'border-style:dashed'}"><span>${esc(w)}</span><small>${esc(pr[i])}${pr[i] === g ? '' : ' ≠ ' + esc(g)}</small></span>`).join('')}</div>`;
    });
  });

  NL.defineSim('curva-aprendizaje', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Exactitud frente al número de oraciones de entrenamiento' });
    sim.group('Modelo');
    sim.check('sf', { label: 'Con sufijos', value: true });
    sim.check('bi', { label: 'Con bigrama', value: true });
    sim.out('a', 'Exactitud con 240 oraciones', { hl: true });
    sim.out('b', 'Exactitud con 20 oraciones');
    const NS = [20, 40, 60, 80, 100, 120, 160, 200, 240];
    const cache = {};
    const curva = (g, bi, sf) => {
      const k = [g, bi, sf].join();
      if (cache[k]) return cache[k];
      const o = { coarse: g, bigrama: bi, sufijos: sf };
      return (cache[k] = NS.map((n) => { const t = H.cadena(L.corpus.cess.slice(0, n), o); return H.evaluar(t.predecir, TE(), o, t.conocidas); }));
    };
    sim.onDraw(() => {
      const g = curva(true, sim.p.bi, sim.p.sf), f = curva(false, sim.p.bi, sim.p.sf);
      sim.set('a', NL.pct(g[g.length - 1].acc, 1)); sim.set('b', NL.pct(g[0].acc, 1));
      NL.draw.clear(cv);
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 250, ymin: 0, ymax: 1, xlabel: 'oraciones de entrenamiento', ylabel: 'proporción', mb: 34 });
      pl.frame();
      pl.xy(NS, g.map((e) => e.acc), { color: '--c1', width: 2.4 });
      pl.xy(NS, f.map((e) => e.acc), { color: '--c2', width: 2.4 });
      pl.xy(NS, g.map((e) => e.nU / e.n), { color: '--ink-3', width: 1.8, dash: [4, 3] });
      pl.legend([{ label: 'exactitud, etiquetas gruesas', color: '--c1' }, { label: 'exactitud, etiquetas EAGLES', color: '--c2' }, { label: 'palabras desconocidas en la prueba', color: '--ink-3', kind: 'dash' }], 'br');
    });
  });

  NL.bank.add('etiquetado-modelos', [
    { q: 'Un tagger de unigramas ve «vino» 10 veces como sustantivo y 3 como verbo. En «vino de un lugar lejano», ¿qué etiqueta le asigna?', opts: ['Verbo, por el contexto', 'Sustantivo, siempre', 'Una al azar', 'Ninguna'], ok: 1, fb: 'No mira el contexto: usa la etiqueta más frecuente de la palabra.', lvl: 2 },
    { q: '¿Qué es la línea de base (baseline)?', opts: ['El modelo más complejo posible', 'Un sistema muy simple que sirve de referencia para justificar los más complejos', 'El límite inferior de un gráfico', 'La primera palabra de un corpus'], ok: 1, fb: 'Cualquier método nuevo debe superarla.', lvl: 1 },
    { q: 'En una prueba de 1.000 palabras hay 200 desconocidas. Se acierta el 95 % de las conocidas y el 50 % de las desconocidas. ¿Exactitud total en %?', num: 86, tol: 0.01, unit: '%', fb: '(800·0,95 + 200·0,5)/1000 = 0,86.', lvl: 3 },
    { q: 'En una cadena con retroceso, ¿qué hace cada tagger cuando no tiene información sobre la palabra?', opts: ['Falla', 'La pasa al siguiente, más general', 'La elimina', 'Reinicia el entrenamiento'], ok: 1, fb: 'De bigrama a unigrama, luego a sufijos y por último a la etiqueta por defecto.', lvl: 1 },
    { q: '¿Para qué sirve el tagger de sufijos?', opts: ['Para las palabras conocidas más frecuentes', 'Para las palabras desconocidas: «-mente» sugiere adverbio, «-ción» sustantivo', 'Para separar contracciones', 'Para corregir ortografía'], ok: 1, fb: 'Aprende qué etiqueta tienen las palabras raras que terminan igual.', lvl: 2 },
    { q: 'Con etiquetas EAGLES finas y sin sufijos, casi todas las palabras desconocidas fallan. ¿Por qué?', opts: ['Porque el corpus es pequeño y el valor por defecto es una sola etiqueta concreta', 'Porque Python no admite etiquetas largas', 'Porque las etiquetas finas son siempre erróneas', 'Porque se usa el bigrama'], ok: 0, fb: 'La etiqueta por defecto solo acierta cuando la palabra desconocida resulta ser exactamente esa.', lvl: 2 },
    { q: 'Al aumentar los datos de entrenamiento, la curva de exactitud…', opts: ['Sube indefinidamente en línea recta', 'Sube rápido al principio y luego se aplana', 'Baja', 'Oscila sin tendencia'], ok: 1, fb: 'Los datos nuevos aportan palabras nuevas, pero con rendimientos decrecientes.', lvl: 2 },
    { q: 'En CESS-ESP, el tagger de unigramas con 13 clases acierta aproximadamente…', opts: ['18 %', '81 %', '99 %', '50 %'], ok: 1, fb: '81,1 % con 5.427 oraciones de entrenamiento; con retroceso a reglas, 88,4 %.', lvl: 1 },
    { q: '¿Por qué el trigrama mejora tan poco sobre el bigrama?', opts: ['Porque es incorrecto', 'Porque casi ningún contexto de dos etiquetas más palabra se vio en el entrenamiento', 'Porque usa menos memoria', 'Porque ignora las palabras'], ok: 1, fb: 'La tabla es muy dispersa y casi siempre se retrocede.', lvl: 2 },
    { q: '¿Cuál es la principal ventaja y el principal inconveniente de los etiquetadores por reglas?', opts: ['Son rápidos de construir y poco precisos', 'Son interpretables y precisos, pero caros de escribir y mantener en cada lengua', 'Aprenden solos y no se pueden revisar', 'No necesitan lexicón y son lentos'], ok: 1, fb: 'Cada regla cuesta trabajo de lingüista y las excepciones se acumulan.', lvl: 2 }
  ]);
})();
