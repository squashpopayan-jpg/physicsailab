/* Capítulo 12 — Etiquetado por aprendizaje automático y evaluación */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, H = L.hmm, P = L.perc;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const TR = () => L.corpus.cess.slice(0, 240), TE = () => L.corpus.cess.slice(240);
  const MP = {};
  const percep = (ep) => MP[ep] || (MP[ep] = P.fit(TR(), { coarse: true, epochs: ep }));
  const gold = () => TE().map((s) => s.map(([w, t]) => [w, H.coarse(t)]));

  NL.defineSim('perceptron', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Entrenamiento');
    sim.slider('ep', { label: 'Épocas', min: 1, max: 8, step: 1, value: 5, fmt: (v) => String(v) });
    sim.slider('s', { label: 'Oración de prueba', min: 1, max: 60, step: 1, value: 3, fmt: (v) => String(v) });
    sim.select('tag', { label: 'Rasgos con más peso para la etiqueta', options: ['NOUN', 'VERB', 'ADJ', 'ADV', 'ADP', 'PROPN', 'PUNCT'].map((t) => [t, t]), value: 'VERB' });
    sim.out('a', 'Exactitud perceptrón', { hl: true });
    sim.out('h', 'Exactitud HMM (mismos datos)');
    sim.out('u', 'Desconocidas: perceptrón');
    sim.out('uh', 'Desconocidas: HMM');
    const hmmRes = () => { const m = H.fit(TR(), { coarse: true, k: 0.1, unk: 'hapax' }); return H.evaluar((ws) => { const r = H.viterbi(m, ws); return r.ok ? r.path : ws.map(() => m.tags[0]); }, TE(), { coarse: true }, new Set(TR().flat().map(([w]) => w.toLowerCase()))); };
    let hm = null;
    sim.onDraw(() => {
      const m = percep(sim.p.ep);
      const known = new Set(TR().flat().map(([w]) => w.toLowerCase()));
      let ok = 0, n = 0, okU = 0, nU = 0;
      const pr = gold().map((s) => m.predecir(s.map(([w]) => w)));
      gold().forEach((s, i) => s.forEach(([w, t], j) => { n++; if (pr[i][j] === t) ok++; if (!known.has(w.toLowerCase())) { nU++; if (pr[i][j] === t) okU++; } }));
      hm = hm || hmmRes();
      sim.set('a', NL.pct(ok / n, 1)); sim.set('h', NL.pct(hm.acc, 1)); sim.set('u', NL.pct(okU / nU, 1)); sim.set('uh', NL.pct(hm.accU, 1));
      const s = gold()[sim.p.s - 1];
      const top = [];
      for (const [f, mp] of m.pesos) { const v = mp.get(sim.p.tag); if (v) top.push([f, v]); }
      top.sort((a, b) => b[1] - a[1]);
      box.innerHTML = `<small style="color:var(--ink-3)">Oración ${sim.p.s} (rojo = error; discontinuo = desconocida)</small><div class="tk-row">${s.map(([w, g], i) => `<span class="tk ${pr[sim.p.s - 1][i] === g ? 'ok' : 'bad'}" style="${known.has(w.toLowerCase()) ? '' : 'border-style:dashed'}"><span>${esc(w)}</span><small>${pr[sim.p.s - 1][i]}${pr[sim.p.s - 1][i] === g ? '' : ' ≠ ' + g}</small></span>`).join('')}</div>` +
        `<small style="color:var(--ink-3)">Los 8 rasgos de mayor peso para ${sim.p.tag} (de ${NL.nf(m.nRasgos)} rasgos)</small><div class="tk-row">${top.slice(0, 8).map(([f, v]) => `<span class="tk"><span>${esc(f)}</span><small>${NL.fix(v, 2)}</small></span>`).join('')}</div>`;
    });
  });

  NL.defineSim('metricas-tags', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Modelo a evaluar');
    sim.select('m', { label: 'Modelo', options: [['base', 'Línea de base (unigrama)'], ['hmm', 'HMM bigrama (k = 0,1)'], ['perc', 'Perceptrón promediado (5 épocas)']], value: 'perc' });
    sim.out('acc', 'Exactitud', { hl: true });
    sim.out('mac', 'F1 macro');
    sim.out('pon', 'F1 ponderado');
    const cache = {};
    const evalua = (k) => {
      if (cache[k]) return cache[k];
      const o = { coarse: true }, te = gold(), tr = TR();
      let pred;
      if (k === 'base') { const b = H.baseline(tr, o); pred = (ws) => b.predecir(ws); }
      else if (k === 'hmm') { const m = H.fit(tr, { coarse: true, k: 0.1, unk: 'hapax' }); pred = (ws) => { const r = H.viterbi(m, ws); return r.ok ? r.path : ws.map(() => m.tags[0]); }; }
      else pred = percep(5).predecir;
      const conf = new Map(); let ok = 0, n = 0;
      for (const s of te) { const p = pred(s.map(([w]) => w)); s.forEach(([, t], i) => { n++; if (p[i] === t) ok++; const kk = t + '>' + p[i]; conf.set(kk, (conf.get(kk) || 0) + 1); }); }
      const met = P.metricas(conf), tot = met.reduce((s, x) => s + x.soporte, 0);
      return (cache[k] = { conf, met, acc: ok / n, mac: met.filter((x) => x.soporte).reduce((s, x) => s + x.f, 0) / met.filter((x) => x.soporte).length, pon: met.reduce((s, x) => s + x.f * x.soporte, 0) / tot });
    };
    sim.onDraw(() => {
      const e = evalua(sim.p.m);
      sim.set('acc', NL.pct(e.acc, 1)); sim.set('mac', NL.fix(e.mac, 3)); sim.set('pon', NL.fix(e.pon, 3));
      const tags = e.met.filter((x) => x.soporte >= 20).map((x) => x.t);
      const g = (a, b) => e.conf.get(a + '>' + b) || 0;
      let h = '<table class="mx"><thead><tr><th style="text-align:left">Etiqueta</th><th>precisión</th><th>cobertura</th><th>F1</th><th>soporte</th></tr></thead><tbody>' + e.met.filter((x) => x.soporte >= 20).map((x) => `<tr><td style="text-align:left">${x.t}</td><td>${NL.fix(x.p, 3)}</td><td>${NL.fix(x.r, 3)}</td><td class="${x.f < 0.8 ? '' : 'hl'}">${NL.fix(x.f, 3)}</td><td>${x.soporte}</td></tr>`).join('') + '</tbody></table>';
      h += '<small style="color:var(--ink-3)">Matriz de confusión (filas: real; columnas: predicha; solo etiquetas con ≥ 20 apariciones)</small><table class="mx"><thead><tr><th></th>' + tags.map((t) => `<th>${t}</th>`).join('') + '</tr></thead><tbody>' + tags.map((a) => `<tr><th style="text-align:left">${a}</th>` + tags.map((b) => { const v = g(a, b); return `<td class="${a === b ? 'hl' : v >= 8 ? 'path' : ''}">${v || '·'}</td>`; }).join('') + '</tr>').join('') + '</tbody></table>';
      box.innerHTML = h;
    });
  });

  NL.bank.add('etiquetado-aprendizaje', [
    { q: '¿Qué limitación del HMM resuelven los clasificadores con rasgos?', opts: ['Su velocidad', 'Solo usa la palabra y la etiqueta anterior; no puede incorporar sufijos, mayúsculas o contexto amplio', 'Que necesita un corpus', 'Que usa logaritmos'], ok: 1, fb: 'Los modelos discriminativos admiten rasgos arbitrarios y solapados.', lvl: 2 },
    { q: 'La regla de actualización del perceptrón ante un error es…', opts: ['Restar al peso de la etiqueta real y sumar al de la predicha', 'Sumar a los pesos de la etiqueta real los rasgos y restar de la predicha', 'No actualizar', 'Normalizar los pesos'], ok: 1, fb: 'w ← w + f(x, real) − f(x, predicha): refuerza la etiqueta correcta y penaliza la equivocada.', lvl: 2 },
    { q: 'Un modelo de máxima entropía multiclase equivale a…', opts: ['Una regresión logística multinomial (softmax)', 'Un árbol de decisión', 'Una cadena de Markov', 'Un autómata finito'], ok: 0, fb: 'P(t|x) = exp(w_t·f(x)) / Σ exp(w_t′·f(x)).', lvl: 2 },
    { q: '¿Por qué un perceptrón con rasgos de sufijo etiqueta mucho mejor las palabras desconocidas que un HMM?', opts: ['Porque memoriza más palabras', 'Porque generaliza por la forma de la palabra (sufijos, mayúsculas), sin necesitar haberla visto', 'Porque usa un corpus más grande', 'Porque ignora el contexto'], ok: 1, fb: 'En CESS-ESP: 88,1 % frente a 63,6 % en las desconocidas.', lvl: 2 },
    { q: 'Precisión de una etiqueta = ', opts: ['VP / (VP + FP)', 'VP / (VP + FN)', 'VP / total', 'FP / (FP + FN)'], ok: 0, fb: 'De todas las palabras que el modelo etiquetó con esa etiqueta, cuántas lo eran.', lvl: 1 },
    { q: 'Cobertura (recall) de una etiqueta = ', opts: ['VP / (VP + FP)', 'VP / (VP + FN)', 'VP / n', 'FN / VP'], ok: 1, fb: 'De todas las palabras que tenían esa etiqueta, cuántas encontró el modelo.', lvl: 1 },
    { q: 'Si la precisión es 0,8 y la cobertura 0,6, ¿cuánto vale F1 (media armónica)? (3 decimales)', num: 0.686, tol: 0.001, fb: '2·0,8·0,6/(0,8+0,6) = 0,96/1,4 = 0,686.', lvl: 3 },
    { q: 'Una exactitud global alta puede ocultar un mal desempeño en etiquetas poco frecuentes. ¿Qué métrica lo revela?', opts: ['La exactitud ponderada', 'El F1 macro (promedio sin ponderar por soporte)', 'El número de rasgos', 'El tamaño del corpus'], ok: 1, fb: 'En CESS-ESP el F1 ponderado es 0,942 pero el macro, 0,837.', lvl: 3 },
    { q: '¿En qué se diferencia la decodificación voraz de la de Viterbi?', opts: ['La voraz elige la mejor etiqueta de cada posición sin considerar el resto; Viterbi optimiza la secuencia completa', 'Son iguales', 'Viterbi es más rápida', 'La voraz usa logaritmos'], ok: 0, fb: 'Un error temprano de la voraz se propaga; los CRF y Viterbi buscan el óptimo global.', lvl: 2 },
    { q: 'El etiquetado de nuevos tipos de texto (por ejemplo, redes sociales) suele necesitar…', opts: ['Ninguna adaptación', 'Nuevas etiquetas (URL, mención, hashtag) y normalización de palabras no estándar', 'Menos datos', 'Quitar los acentos'], ok: 1, fb: 'El dominio de los datos de entrenamiento condiciona mucho el rendimiento.', lvl: 2 }
  ]);
})();
