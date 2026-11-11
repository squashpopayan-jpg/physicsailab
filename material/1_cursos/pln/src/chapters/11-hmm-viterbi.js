/* Capítulo 11 — Modelos ocultos de Markov y Viterbi */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, H = L.hmm;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const TR = () => L.corpus.cess.slice(0, 240);
  const MODELOS = {};
  const modelo = (k, unk) => { const key = k + '|' + unk; return MODELOS[key] || (MODELOS[key] = H.fit(TR(), { coarse: true, k, unk })); };
  const FRASES = ['bebo un vaso de vino tinto', 'vino de un lugar lejano', 'el gobierno anunció una nueva medida', 'la casa es grande', 'los niños comen fruta después del colegio'];

  NL.defineSim('viterbi', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('f', { label: 'Ejemplos', options: FRASES.map((f) => [f, f]), value: FRASES[0], onInput: (v) => { w.set(v, true); w.input.value = v; } });
    const w = sim.text('w', { label: 'O escriba una oración', value: FRASES[0] });
    sim.group('Modelo');
    sim.select('k', { label: 'Suavizado add-k', options: [[0, 'Ninguno (máxima verosimilitud)'], [0.1, 'k = 0,1'], [1, 'Laplace (k = 1)']], value: 0.1 });
    sim.select('unk', { label: 'Palabras desconocidas', options: [['hapax', 'Símbolo <UNK> (hápax)'], ['ninguno', 'Sin tratamiento']], value: 'hapax' });
    const sl = sim.slider('c', { label: 'Columnas calculadas', min: 1, max: 12, step: 1, value: 12, fmt: (v) => String(v) });
    sim.out('p', 'log P(mejor secuencia)', { hl: true });
    sim.out('o', 'Operaciones de Viterbi');
    sim.out('b', 'Secuencias posibles');
    sim.onDraw(() => {
      const ws = (sim.p.w || '').trim().split(/\s+/).filter(Boolean).slice(0, 12);
      if (!ws.length) { box.innerHTML = ''; return; }
      const m = modelo(+sim.p.k, sim.p.unk), r = H.viterbi(m, ws);
      sl.range(1, Math.max(2, ws.length), 1);
      const nc = Math.min(sim.p.c, ws.length);
      const T = m.T;
      sim.set('p', r.ok ? NL.fix(r.logp, 2) : 'sin camino (probabilidad 0)');
      sim.set('o', `${ws.length}·${T}² = ${NL.nf(ws.length * T * T)}`);
      sim.set('b', `${T}^${ws.length} = ${(Math.pow(T, ws.length)).toExponential(2).replace('e+', '×10^')}`);
      const ruta = r.ok ? new Set(r.idx.map((j, t) => j + ',' + t)) : new Set();
      let h = '<table class="mx"><thead><tr><th></th>' + ws.map((x, t) => `<th ${t >= nc ? 'style="opacity:.3"' : ''}>${esc(x)}${r.words[t] === '<UNK>' ? '<br><small>(UNK)</small>' : ''}</th>`).join('') + '</tr></thead><tbody>';
      for (let j = 0; j < T; j++) {
        h += `<tr><th style="text-align:left">${m.tags[j]}</th>` + ws.map((_, t) => {
          if (t >= nc) return '<td style="opacity:.25">·</td>';
          const v = r.M[j][t];
          return `<td class="${ruta.has(j + ',' + t) ? 'path hl' : ''}">${isFinite(v) ? NL.fix(v, 1) : '−∞'}${t > 0 && isFinite(v) ? `<br><small style="color:var(--ink-3)">←${m.tags[r.B[j][t]]}</small>` : ''}</td>`;
        }).join('') + '</tr>';
      }
      h += '</tbody></table>';
      if (r.ok) h += `<small style="color:var(--ink-3)">Secuencia más probable</small><div class="tk-row">${ws.map((x, t) => `<span class="tk ${t < nc ? 'ok' : ''}"><span>${esc(x)}</span><small>${r.path[t]}</small></span>`).join('')}</div>`;
      else h += '<p style="color:var(--loss);font-weight:600">Todas las secuencias tienen probabilidad 0: alguna palabra o transición no se vio en el entrenamiento. Active el suavizado o el símbolo UNK.</p>';
      box.innerHTML = h;
    });
  });

  NL.defineSim('hmm-parametros', function (sim) {
    const cv = sim.canvas({ aspect: 1.6, label: 'Mapa de calor de las probabilidades de transición entre etiquetas' });
    const box = sim.html('pad');
    sim.group('Modelo entrenado con 240 oraciones');
    const m = modelo(0, 'hapax');
    sim.select('t', { label: 'Etiqueta de origen', options: m.tags.map((t) => [t, t]), value: 'DET' });
    sim.select('w', { label: 'Palabra a consultar', options: [['vino', 'vino'], ['la', 'la'], ['que', 'que'], ['de', 'de'], ['casa', 'casa'], ['es', 'es']], value: 'vino' });
    sim.out('a', 'P(siguiente | origen) más alta', { hl: true });
    sim.out('b', 'P(palabra | etiqueta) más alta');
    sim.onDraw(() => {
      const T = m.T, i = m.id.get(sim.p.t);
      NL.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, ml = 62, mt = 16, cw = (w - ml - 6) / T, ch = (h - mt - 52) / T;
      for (let a = 0; a < T; a++) for (let b = 0; b < T; b++) {
        const p = m.trans[a][b] / Math.max(1, m.tagCount[a]);
        ctx.fillStyle = NL.rgbStr(NL.cmap.seq(Math.min(1, Math.sqrt(p) * 1.2), '--c1'));
        ctx.fillRect(ml + b * cw, mt + a * ch, cw - 1, ch - 1);
        if (a === i) { ctx.strokeStyle = NL.col('--c2'); ctx.lineWidth = 2; ctx.strokeRect(ml + b * cw, mt + a * ch, cw - 1, ch - 1); }
      }
      for (let a = 0; a < T; a++) { NL.text(ctx, m.tags[a], ml - 4, mt + a * ch + ch * 0.62, { size: 10.5, align: 'right', color: a === i ? '--c2' : '--ink-2', weight: a === i ? 700 : 400 }); NL.text(ctx, m.tags[a], ml + a * cw + cw / 2, mt + T * ch + 10, { size: 9.5, align: 'center', color: '--ink-3' }); }
      NL.text(ctx, 'etiqueta siguiente →  (filas: etiqueta anterior; color = P(siguiente | anterior))', ml, h - 6, { size: 11, color: '--ink-3' });
      const fila = m.tags.map((t, b) => [t, m.trans[i][b] / Math.max(1, m.tagCount[i])]).sort((x, y) => y[1] - x[1]);
      const fin = m.fin[i] / Math.max(1, m.tagCount[i]);
      const wd = m.simbolo(sim.p.w);
      const emi = m.tags.map((t, j) => [t, Math.exp(m.logEmis(j, wd))]).sort((x, y) => y[1] - x[1]);
      sim.set('a', `${fila[0][0]} (${NL.fix(fila[0][1], 3)})`); sim.set('b', `${emi[0][0]} (${NL.fix(emi[0][1], 4)})`);
      box.innerHTML = `<small style="color:var(--ink-3)">Tras ${sim.p.t} (${m.tagCount[i]} apariciones), la etiqueta siguiente</small><div class="tk-row">${fila.slice(0, 6).map(([t, p]) => `<span class="tk"><span>${t}</span><small>${NL.fix(p, 3)}</small></span>`).join('')}<span class="tk"><span>&lt;/s&gt;</span><small>${NL.fix(fin, 3)}</small></span></div>` +
        `<small style="color:var(--ink-3)">P(«${esc(sim.p.w)}» | etiqueta): ${wd === '<UNK>' ? 'palabra vista una sola vez → UNK' : 'palabra conocida'}</small><div class="tk-row">${emi.slice(0, 5).map(([t, p]) => `<span class="tk"><span>${t}</span><small>${p < 0.0001 ? p.toExponential(1) : NL.fix(p, 4)}</small></span>`).join('')}</div>`;
    });
  });

  /* Taller guiado de la Actividad 1: corpus reducido con etiquetas EAGLES completas */
  const OBJ = [['habla', 'vmip3s0'], ['con', 'sps00'], ['el', 'da0ms0'], ['enfermo', 'ncms000'], ['grave', 'aq0cs0'], ['de', 'sps00'], ['trasplantes', 'ncmp000'], ['.', 'Fp']];
  NL.defineSim('taller-hmm', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const mini = L.corpus.cess.filter((s) => s.length <= 14).slice(0, 20);
    sim.group('Corpus reducido (20 oraciones de CESS-ESP, etiquetas EAGLES)');
    sim.check('min', { label: 'Pasar a minúsculas', value: true });
    sim.select('k', { label: 'Suavizado', options: [[0, 'Ninguno'], [1, 'Laplace (add-1)']], value: 0 });
    sim.check('unk', { label: 'Hápax como UNK', value: false });
    sim.select('f', { label: 'Oración a etiquetar', options: [['a', 'Habla con el enfermo grave de trasplantes.'], ['b', 'El gobierno anunció una medida.'], ['c', 'La empresa tiene mucho trabajo.']], value: 'a' });
    sim.out('t', 'Etiquetas distintas', { hl: true });
    sim.out('n', 'Palabras del corpus (tokens / tipos)');
    sim.out('r', 'Resultado');
    const F = { a: 'habla con el enfermo grave de trasplantes .', b: 'el gobierno anunció una medida .', c: 'la empresa tiene mucho trabajo .' };
    sim.onDraw(() => {
      const o = { coarse: false, lower: sim.p.min, k: +sim.p.k, unk: sim.p.unk ? 'hapax' : 'ninguno' };
      const m = H.fit(mini, o);
      const ws = F[sim.p.f].split(' ');
      const r = H.viterbi(m, ws);
      const tok = mini.reduce((s, x) => s + x.length, 0);
      sim.set('t', String(m.T)); sim.set('n', `${tok} / ${new Set(mini.flat().map(([w]) => (sim.p.min ? w.toLowerCase() : w))).size}`);
      const desconocidas = ws.filter((w) => !m.known.has(sim.p.min ? w.toLowerCase() : w));
      sim.set('r', r.ok ? 'etiquetada' : 'sin camino');
      box.innerHTML = (r.ok ? `<div class="tk-row">${ws.map((w, t) => `<span class="tk ${sim.p.f === 'a' && r.path[t] === OBJ[t][1] ? 'ok' : sim.p.f === 'a' ? 'bad' : ''}"><span>${esc(w)}</span><small>${r.path[t]}</small></span>`).join('')}</div>` + (sim.p.f === 'a' ? '<small style="color:var(--ink-3)">Verde = coincide con la etiqueta de referencia de la actividad; rojo = no coincide.</small>' : '') : '<p style="color:var(--loss);font-weight:600">La probabilidad de todas las secuencias es 0: con máxima verosimilitud basta una palabra o una transición no vista para anular el camino.</p>') +
        `<p style="margin:8px 0 0">Palabras no vistas en el corpus: <b>${desconocidas.length ? desconocidas.map(esc).join(', ') : 'ninguna'}</b>. Con ${m.T} etiquetas y ${tok} palabras, la mayoría de las probabilidades de transición son 0 sin suavizado.</p>`;
    });
  });

  NL.bank.add('hmm-viterbi', [
    { q: 'En un HMM de etiquetado, ¿qué representa la probabilidad de emisión P(palabra | etiqueta)?', opts: ['La probabilidad de que una palabra tenga cierta etiqueta', 'La probabilidad de que, generada una etiqueta, esta se manifieste como esa palabra', 'La probabilidad de la oración', 'La frecuencia de la palabra'], ok: 1, fb: 'No es la etiqueta más probable de la palabra (eso sería la posterior), sino cuán probable es la palabra dada la etiqueta.', lvl: 2 },
    { q: 'Si MD aparece 13.124 veces y es seguido por VB 10.471 veces, ¿cuál es P(VB | MD) con tres decimales?', num: 0.798, tol: 0.001, fb: '10.471 / 13.124 = 0,798.', lvl: 3 },
    { q: 'Las dos suposiciones del etiquetador HMM bigrama son…', opts: ['Cada palabra depende de su etiqueta, y cada etiqueta solo de la etiqueta anterior', 'Cada palabra depende de la anterior, y cada etiqueta de la palabra', 'Las etiquetas son independientes, y las palabras también', 'Cada etiqueta depende de todas las etiquetas anteriores'], ok: 0, fb: 'Independencia de la palabra dada su etiqueta, y suposición de Markov de orden uno.', lvl: 2 },
    { q: '¿Qué complejidad tiene Viterbi para una oración de n palabras y T etiquetas?', opts: ['O(Tⁿ)', 'O(n·T²)', 'O(n + T)', 'O(2ⁿ)'], ok: 1, fb: 'Por programación dinámica: n columnas, T celdas por columna y T predecesores por celda.', lvl: 2 },
    { q: '¿Cuántas secuencias de etiquetas tendría que probar una enumeración exhaustiva con 13 etiquetas y 7 palabras?', opts: ['91', '13⁷ ≈ 62,7 millones', '7¹³', '1.183'], ok: 1, fb: '13⁷ = 62.748.517; Viterbi hace 7·13² = 1.183 operaciones.', lvl: 3 },
    { q: '¿Para qué sirve el retroceso (backpointer) en Viterbi?', opts: ['Para suavizar probabilidades', 'Para reconstruir la mejor secuencia de etiquetas una vez llena la matriz', 'Para entrenar el modelo', 'Para tokenizar'], ok: 1, fb: 'Cada celda guarda de qué etiqueta de la columna anterior proviene su valor máximo.', lvl: 2 },
    { q: 'Con máxima verosimilitud, una palabra que no se vio en el entrenamiento hace que…', opts: ['Se elija la etiqueta más frecuente', 'La probabilidad de todas las secuencias sea 0 y Viterbi no encuentre camino', 'Se ignore la palabra', 'Se duplique la columna'], ok: 1, fb: 'Se arregla con suavizado, un símbolo para desconocidas, o ambos.', lvl: 3 },
    { q: '¿Por qué se trabaja con logaritmos de las probabilidades?', opts: ['Para que sean positivas', 'Para evitar el desbordamiento por abajo al multiplicar muchas probabilidades pequeñas', 'Para acelerar el entrenamiento', 'No hay motivo'], ok: 1, fb: 'El producto se vuelve suma; con oraciones largas el producto directo se hace 0 en coma flotante.', lvl: 2 },
    { q: 'En «bebo un vaso de vino tinto» el HMM etiqueta «vino» como sustantivo y en «vino de un lugar lejano» como verbo. ¿Qué lo explica?', opts: ['Dos modelos distintos', 'Las probabilidades de transición: tras una preposición suele venir un sustantivo, y al principio de la oración un verbo', 'El azar', 'La longitud de la oración'], ok: 1, fb: 'La palabra tiene casi igual emisión como sustantivo o verbo; el contexto decide.', lvl: 2 },
    { q: '¿Cuál de estos es un modelo discriminativo de etiquetado, y no generativo como el HMM?', opts: ['Perceptrón estructurado o CRF', 'Cadena de Markov de caracteres', 'Stemmer Snowball', 'Distancia de edición'], ok: 0, fb: 'Modelan directamente P(etiquetas | palabras), con rasgos arbitrarios, en vez de P(palabras, etiquetas).', lvl: 2 }
  ]);
})();
