/* Capítulo 29 — Seq2Seq y atención */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, A = L.att;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---- 1. La atención con vectores de palabras reales ---- */
  NL.defineSim('atencion-calculo', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Frase');
    sim.text('t', { label: 'Frase (palabras del vocabulario del capítulo 26)', value: 'el presidente del gobierno anunció una decisión sobre el partido' });
    sim.slider('q', { label: 'Palabra que consulta (posición)', min: 1, max: 12, step: 1, value: 2, fmt: (v) => String(v) });
    sim.group('Cálculo');
    sim.check('e', { label: 'Dividir por √d (atención escalada)', value: true });
    sim.slider('T', { label: 'Temperatura del softmax', min: 0.2, max: 4, step: 0.1, value: 1, fmt: (v) => NL.fix(v, 1) });
    sim.out('h', 'Entropía de la atención de esa palabra (bits)', { hl: true });
    sim.onDraw(() => {
      const m = L.emb.porSVD(20, 1), toks = (sim.p.t.toLowerCase().match(/[a-záéíóúüñ]+/g) || []).filter((w) => m.idx.has(w)).slice(0, 12);
      if (toks.length < 2) { box.innerHTML = '<p>Escriba al menos dos palabras del vocabulario (por ejemplo «gobierno», «presidente», «partido»).</p>'; sim.set('h', '—'); return; }
      const X = toks.map((w) => { const v = m.W[m.idx.get(w)], n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1; return Array.from(v, (x) => 4 * x / n); }), d = X[0].length, qi = Math.min(sim.p.q, toks.length) - 1;
      const esc1 = sim.p.e ? 1 / Math.sqrt(d) : 1;
      const todo = X.map((q) => A.softmax(X.map((k) => X[0].reduce((s, _, i) => s + q[i] * k[i], 0) * esc1), sim.p.T));
      const sc = X.map((k) => X[qi].reduce((s, _, i) => s + X[qi][i] * k[i], 0) * esc1), w = todo[qi];
      sim.set('h', `${NL.fix(A.entropia(w), 2)} de un máximo de ${NL.fix(Math.log2(toks.length), 2)}`);
      const mx = Math.max(...w);
      box.innerHTML = `<small style="color:var(--ink-3)">Consulta: «${esc(toks[qi])}». Puntuaciones q·k${sim.p.e ? '/√d' : ''}, pesos tras el softmax (T = ${NL.fix(sim.p.T, 1)}) y barras</small>` +
        `<table class="mx"><thead><tr><th style="text-align:left">Palabra (clave)</th><th>Puntuación</th><th>Peso</th><th style="text-align:left"></th></tr></thead><tbody>${toks.map((t, j) => `<tr class="${j === qi ? 'hl' : ''}"><td style="text-align:left">${esc(t)}</td><td>${NL.fix(sc[j], 2)}</td><td class="${w[j] === mx ? 'hl' : ''}">${NL.fix(w[j], 3)}</td><td style="text-align:left"><span style="display:inline-block;height:9px;width:${Math.round(160 * w[j] / mx)}px;background:var(--c1,#4c78a8);border-radius:2px"></span></td></tr>`).join('')}</tbody></table>` +
        `<small style="color:var(--ink-3)">Matriz completa de autoatención (cada fila es una consulta; la fila elegida está resaltada)</small>` +
        `<div style="overflow-x:auto"><table class="mx"><thead><tr><th></th>${toks.map((t) => `<th style="font-size:11px">${esc(t)}</th>`).join('')}</tr></thead><tbody>${todo.map((r, i) => `<tr class="${i === qi ? 'hl' : ''}"><td style="text-align:left;font-size:11.5px">${esc(toks[i])}</td>${r.map((v) => `<td style="font-size:11px;background:color-mix(in srgb, var(--c1,#4c78a8) ${Math.round(5 + 75 * v / Math.max(...r))}%, transparent)">${NL.fix(v, 2)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    });
  });

  /* ---- 2. Seq2seq de fechas: con y sin atención ---- */
  NL.defineSim('s2s-fechas', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.3, label: 'Mapa de atención del decodificador' });
    const cv2 = sim.canvas({ aspect: 1.3, label: 'Fechas exactas en la prueba según los pasos de entrenamiento' });
    const D = L.corpus.s2s;
    sim.group('Ejemplo');
    sim.select('i', { label: 'Fecha', options: D.ejemplos.map((e, k) => [String(k), e.origen]), value: '1' });
    sim.out('o', 'Entrada', { hl: true });
    sim.out('c', 'Con atención');
    sim.out('s', 'Sin atención (solo el último estado)');
    sim.onDraw(() => {
      const e = D.ejemplos[+sim.p.i];
      sim.set('o', e.origen); sim.set('c', `${e.con} ${e.con === e.destino ? '✓' : '✗ (correcto ' + e.destino + ')'}`); sim.set('s', `${e.sin} ${e.sin === e.destino ? '✓' : '✗ (correcto ' + e.destino + ')'}`);
      /* mapa de atención */
      const ctx = cv.ctx; ctx.clearRect(0, 0, cv.w, cv.h);
      const nt = e.atencion.length, ns = e.origen.length, ml = 36, mt = 30, cw = (cv.w - ml - 8) / ns, ch = (cv.h - mt - 8) / (nt + 0);
      for (let i = 0; i < nt; i++) for (let j = 0; j < ns; j++) {
        const w = e.atencion[i][j]; ctx.fillStyle = NL.alpha('--c1', Math.min(1, w) * 0.95); ctx.fillRect(ml + j * cw, mt + i * ch, cw - 1, ch - 1);
        ctx.strokeStyle = NL.alpha('--ink-3', 0.25); ctx.strokeRect(ml + j * cw + 0.5, mt + i * ch + 0.5, cw - 1, ch - 1);
      }
      for (let j = 0; j < ns; j++) NL.text(ctx, e.origen[j] === ' ' ? '·' : e.origen[j], ml + j * cw + cw / 2, mt - 10, { size: 11, color: '--ink-2', align: 'center', baseline: 'middle' });
      const sal = e.con.split('');
      for (let i = 0; i < nt; i++) NL.text(ctx, sal[i] || '', ml - 10, mt + i * ch + ch / 2, { size: 12, color: '--ink', align: 'right', baseline: 'middle' });
      NL.text(ctx, 'origen →', ml + 2, 10, { size: 10.5, color: '--ink-3', align: 'left', baseline: 'middle' });
      /* curva de aprendizaje */
      const c2 = cv2.ctx; c2.clearRect(0, 0, cv2.w, cv2.h);
      const pl = new NL.Plot(c2, { x: 0, y: 0, w: cv2.w, h: cv2.h, xmin: 30, xmax: 1500, ymin: 0, ymax: 1.02, xlog: true, xlabel: 'pasos de entrenamiento', ylabel: 'fechas exactas', mb: 36, yfmt: (v) => NL.pct(v, 0) });
      pl.frame();
      const cols = ['--c2', '--c1'], nombres = Object.keys(D.curvas);
      nombres.forEach((n, k) => { const c = D.curvas[n]; pl.xy(c.map((x) => x[0]), c.map((x) => x[1]), { color: cols[k], width: 2.2 }); c.forEach((x) => pl.dot(x[0], x[1], { color: cols[k], r: 3 })); });
      pl.legend(nombres.map((n, k) => ({ label: n.replace(' (solo el último estado)', ''), color: cols[k] })), 'br');
    });
  });

  NL.bank.add('seq2seq', [
    { q: 'Un modelo secuencia a secuencia (seq2seq) transforma…', opts: ['Una secuencia de entrada en otra de salida, de longitud posiblemente distinta (traducción, resumen)', 'Un número en una palabra', 'Una imagen en un número', 'Solo texto en etiquetas'], ok: 0, fb: 'Se compone de un codificador que lee la entrada y un decodificador que genera la salida.', lvl: 1 },
    { q: 'En el seq2seq clásico con RNN, el cuello de botella es que…', opts: ['Toda la frase de entrada se comprime en un único vector de tamaño fijo', 'El decodificador no tiene memoria', 'No se puede entrenar', 'Solo traduce palabras sueltas'], ok: 0, fb: 'Para frases largas ese vector pierde información; la atención lo resuelve.', lvl: 1 },
    { q: 'En la atención, la consulta (query) se compara con…', opts: ['Las claves (keys) de las posiciones de la entrada, mediante un producto escalar', 'Los valores directamente', 'La etiqueta', 'El vocabulario completo'], ok: 0, fb: 'Las puntuaciones q·k pasan por un softmax y dan los pesos con los que se promedian los valores.', lvl: 2 },
    { q: 'La salida de la atención es…', opts: ['Un promedio de los valores ponderado por los pesos del softmax', 'La clave más parecida', 'La suma de las claves', 'El peso máximo'], ok: 0, fb: 'softmax(QKᵀ/√d)·V. Los pesos suman 1.', lvl: 1 },
    { q: 'Se divide por √d en la atención escalada porque…', opts: ['Los productos escalares crecen con la dimensión y saturarían el softmax, dando gradientes minúsculos', 'Así se ahorra memoria', 'Es una convención sin efecto', 'Para que d sea entero'], ok: 0, fb: 'Con componentes de varianza 1, q·k tiene varianza d; dividir por √d la devuelve a 1.', lvl: 3 },
    { q: 'Con una temperatura alta en el softmax, los pesos de atención se vuelven…', opts: ['Más uniformes (reparten la atención)', 'Más concentrados en un solo elemento', 'Negativos', 'Cero'], ok: 0, fb: 'Con T → ∞ el reparto es uniforme (entropía máxima); con T → 0 se concentra en el máximo.', lvl: 2 },
    { q: 'En el experimento de las fechas, sin atención el modelo acierta el 24,9 % de las fechas completas tras 1.500 pasos, y con atención…', opts: ['El 100 %', 'El 30 %', 'El 50 %', 'El 24,9 %, igual'], ok: 0, fb: 'La atención deja al decodificador consultar directamente el día, el mes y el año en la entrada.', lvl: 1 },
    { q: 'En el mapa de atención de una fecha, el año de la salida ISO (al principio) atiende a…', opts: ['Los dígitos del año al final de la entrada: la alineación no es monótona', 'El primer carácter siempre', 'Todos por igual', 'Los espacios'], ok: 0, fb: 'La atención aprende una alineación cruzada: orden distinto en origen y destino.', lvl: 2 },
    { q: 'El enmascaramiento causal en la atención del decodificador sirve para…', opts: ['Impedir que una posición vea las posiciones futuras al entrenar con toda la frase a la vez', 'Eliminar palabras vacías', 'Reducir el vocabulario', 'Normalizar los pesos'], ok: 0, fb: 'Asigna −∞ a las puntuaciones de las posiciones futuras; sus pesos tras el softmax son 0.', lvl: 3 },
    { q: 'La autoatención (self-attention) es la atención donde…', opts: ['Consultas, claves y valores proceden de la misma secuencia', 'Solo hay una palabra', 'No hay softmax', 'La consulta es constante'], ok: 0, fb: 'Cada posición mira a todas las demás de su propia secuencia; es la base del Transformer.', lvl: 2 }
  ]);
})();
