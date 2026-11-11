/* Capítulo 30 — El Transformer */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, T = L.tf, A = L.att;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---- 1. Codificación posicional ---- */
  NL.defineSim('pos-enc', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.1, label: 'Mapa de la codificación posicional' });
    const cv2 = sim.canvas({ aspect: 1.1, label: 'Producto escalar entre posiciones según su distancia' });
    sim.group('Dimensiones');
    sim.select('d', { label: 'Dimensión del modelo', options: [['8', '8'], ['16', '16'], ['32', '32'], ['64', '64'], ['128', '128']], value: '32' });
    sim.slider('n', { label: 'Posiciones mostradas', min: 8, max: 80, step: 4, value: 40, fmt: (v) => String(v) });
    sim.slider('k', { label: 'Distancia entre las posiciones comparadas (k)', min: 1, max: 20, step: 1, value: 3, fmt: (v) => String(v) });
    sim.out('a', 'PE(0) · PE(k)', { hl: true });
    sim.out('b', 'PE(10) · PE(10 + k)');
    sim.out('c', 'PE(p) · PE(p)');
    sim.onDraw(() => {
      const d = +sim.p.d, n = sim.p.n, k = sim.p.k, P = T.posicional(n + 25, d), dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
      sim.set('a', NL.fix(dot(P[0], P[k]), 4)); sim.set('b', NL.fix(dot(P[10], P[10 + k]), 4)); sim.set('c', NL.fix(dot(P[5], P[5]), 3) + ' (= d/2)');
      const ctx = cv.ctx; ctx.clearRect(0, 0, cv.w, cv.h);
      const ml = 38, mt = 26, mb = 8, cw = (cv.w - ml - 8) / d, ch = (cv.h - mt - mb) / n;
      for (let p = 0; p < n; p++) for (let i = 0; i < d; i++) { const v = P[p][i]; ctx.fillStyle = v >= 0 ? NL.alpha('--c2', Math.min(1, v) * 0.9) : NL.alpha('--c1', Math.min(1, -v) * 0.9); ctx.fillRect(ml + i * cw, mt + p * ch, cw + 0.5, ch + 0.5); }
      NL.text(ctx, 'dimensión i →', ml, 10, { size: 10.5, color: '--ink-3', align: 'left', baseline: 'middle' });
      [0, Math.floor(n / 2), n - 1].forEach((p) => NL.text(ctx, String(p), ml - 6, mt + p * ch + ch / 2, { size: 10.5, color: '--ink-2', align: 'right', baseline: 'middle' }));
      NL.text(ctx, 'posición', 4, mt + (n * ch) / 2, { size: 10.5, color: '--ink-3', align: 'left', baseline: 'middle' });
      const c2 = cv2.ctx; c2.clearRect(0, 0, cv2.w, cv2.h);
      const ks = Array.from({ length: 41 }, (_, j) => j), ys = ks.map((j) => dot(P[0], P[Math.min(j, P.length - 1)]) / (d / 2));
      const pl = new NL.Plot(c2, { x: 0, y: 0, w: cv2.w, h: cv2.h, xmin: 0, xmax: 40, ymin: -1, ymax: 1.05, xlabel: 'distancia k', ylabel: 'PE(0)·PE(k) / (d/2)', mb: 36 });
      const P2 = T.posicional(80, d); const ys2 = ks.map((j) => dot(P2[0], P2[j]) / (d / 2));
      pl.frame(); pl.xy(ks, ys2, { color: '--c3', width: 2.2 }); pl.dot(k, dot(P2[0], P2[k]) / (d / 2), { color: '--c1', r: 5 });
    });
  });

  /* ---- 2. Un bloque de Transformer paso a paso ---- */
  NL.defineSim('transformer-bloque', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const PAR = {};
    sim.group('Entrada');
    sim.text('t', { label: 'Frase (palabras del vocabulario del capítulo 26)', value: 'el presidente del gobierno anunció una decisión sobre el partido' });
    sim.slider('w', { label: 'Palabra cuya salida se examina', min: 1, max: 8, step: 1, value: 2, fmt: (v) => String(v) });
    sim.group('Bloque');
    sim.seg('h', { label: 'Cabezas de atención', options: [['1', '1'], ['2', '2'], ['4', '4']], value: '2' });
    sim.check('pe', { label: 'Sumar la codificación posicional', value: true });
    sim.check('m', { label: 'Máscara causal (como en un modelo de lenguaje)', value: false });
    sim.check('inv', { label: 'Comparar con la frase en orden inverso', value: true });
    sim.out('d', 'Cambio en la salida de la palabra elegida al invertir el orden', { hl: true });
    sim.out('n', 'Parámetros del bloque (d = 16, d_ff = 32)');
    sim.onDraw(() => {
      const m = L.emb.porSVD(16, 1), toks = (sim.p.t.toLowerCase().match(/[a-záéíóúüñ]+/g) || []).filter((x) => m.idx.has(x)).slice(0, 8);
      if (toks.length < 2) { box.innerHTML = '<p>Escriba al menos dos palabras del vocabulario (por ejemplo «gobierno», «presidente», «partido»).</p>'; return; }
      const d = 16, h = +sim.p.h, par = PAR[h] || (PAR[h] = T.parametros(d, h, 32, 7));
      const emb = (ws) => { const P = T.posicional(ws.length, d); return ws.map((w, i) => { const v = m.W[m.idx.get(w)], n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1; return Array.from(v, (x, j) => 4 * x / n + (sim.p.pe ? P[i][j] : 0)); }); };
      const corre = (ws) => T.bloque(emb(ws), par, { mascara: sim.p.m ? 'causal' : null });
      const r = corre(toks), qi = Math.min(sim.p.w, toks.length) - 1;
      let dif = '—';
      if (sim.p.inv) {
        const ri = corre(toks.slice().reverse()), j = toks.length - 1 - qi, a = r.salida[qi], b = ri.salida[j];
        dif = NL.sci(Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) * (x - b[i]), 0)), 2) + (Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) * (x - b[i]), 0)) < 1e-9 ? ' (= 0: la red no distingue el orden)' : '');
      }
      sim.set('d', dif); sim.set('n', String(T.nParametros(d, 32)));
      const heat = (W) => `<table class="mx"><thead><tr><th></th>${toks.map((t) => `<th style="font-size:10.5px">${esc(t.slice(0, 8))}</th>`).join('')}</tr></thead><tbody>${W.map((row, i) => `<tr class="${i === qi ? 'hl' : ''}"><td style="text-align:left;font-size:11px">${esc(toks[i].slice(0, 8))}</td>${row.map((v) => `<td style="font-size:10.5px;background:color-mix(in srgb, var(--c1,#4c78a8) ${Math.round(4 + 80 * v)}%, transparent)">${NL.fix(v, 2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      box.innerHTML = `<small style="color:var(--ink-3)">Cada fila es una consulta; cada columna, una palabra mirada. ${sim.p.m ? 'Con máscara causal, lo que está por encima de la diagonal es 0.' : 'Sin máscara, cada palabra puede mirar a todas.'} Los pesos son aleatorios (red sin entrenar): lo que se ve es la mecánica, no el significado.</small>` +
        `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px">${r.pesos.map((W, c) => `<div><small><b>Cabeza ${c + 1}</b> (entropía media ${NL.fix(W.reduce((s, row) => s + A.entropia(row), 0) / W.length, 2)} bits)</small>${heat(W)}</div>`).join('')}</div>`;
    });
  });

  NL.bank.add('transformer', [
    { q: 'La idea central del Transformer (Vaswani y otros, 2017) es…', opts: ['Sustituir la recurrencia por atención: todas las posiciones se relacionan directamente y se procesan en paralelo', 'Usar más capas de LSTM', 'Eliminar los embeddings', 'Procesar solo caracteres'], ok: 0, fb: '«Attention is all you need»: sin recurrencia ni convoluciones.', lvl: 1 },
    { q: 'Las tres proyecciones de cada posición en la autoatención son…', opts: ['Consulta (Q), clave (K) y valor (V), obtenidas con matrices de pesos aprendidas', 'Entrada, salida y estado', 'Pesos, sesgos y activación', 'Solo Q y K'], ok: 0, fb: 'Q = XW_Q, K = XW_K, V = XW_V; la atención usa softmax(QKᵀ/√d)V.', lvl: 1 },
    { q: 'La atención multicabeza sirve para…', opts: ['Que cada cabeza se especialice en un tipo de relación (por ejemplo, la palabra anterior o el sujeto del verbo)', 'Acelerar la ejecución', 'Eliminar el softmax', 'Reducir el vocabulario'], ok: 0, fb: 'Se parte la dimensión del modelo en h cabezas, se calcula la atención en cada una y se concatenan.', lvl: 2 },
    { q: 'Sin codificación posicional, la autoatención es…', opts: ['Equivariante a permutaciones: no distingue el orden de las palabras', 'Más precisa', 'Imposible de entrenar', 'Idéntica a una RNN'], ok: 0, fb: 'Baraje la entrada y las salidas se barajan igual. Por eso se suma al embedding una señal de posición.', lvl: 2 },
    { q: 'En la codificación sinusoidal, PE(p, 2i) = …', opts: ['sin(p / 10000^(2i/d))', 'p · i', 'cos(p) + i', 'p / d'], ok: 0, fb: 'Las dimensiones pares usan seno y las impares coseno, con longitudes de onda de 2π a 10000·2π.', lvl: 3 },
    { q: 'Una propiedad útil de la codificación sinusoidal es que el producto PE(p)·PE(p + k)…', opts: ['Solo depende de la distancia k, no de la posición p', 'Es siempre cero', 'Crece con p', 'Es aleatorio'], ok: 0, fb: 'Es Σ cos(ω_i k): la similitud entre posiciones codifica la distancia relativa.', lvl: 3 },
    { q: 'El enmascaramiento causal en un Transformer de solo decodificador (como GPT) impide que…', opts: ['Cada posición vea las posteriores', 'Se usen las palabras raras', 'Haya más de una cabeza', 'Se normalice'], ok: 0, fb: 'Así todas las posiciones se entrenan a la vez, cada una prediciendo la siguiente sin ver el futuro.', lvl: 2 },
    { q: 'Cada bloque del Transformer incluye además de la atención…', opts: ['Una red prealimentada por posición, conexiones residuales y normalización de capa', 'Una LSTM', 'Una convolución', 'Un clasificador'], ok: 0, fb: 'x = LN(x + Atención(x)); x = LN(x + FFN(x)) en la versión original (post-norm).', lvl: 2 },
    { q: 'El coste de la autoatención respecto de la longitud n de la secuencia es…', opts: ['Cuadrático, O(n²), por la matriz de pesos n × n', 'Lineal', 'Constante', 'Logarítmico'], ok: 0, fb: 'Es el origen del límite de contexto de los modelos y de las muchas variantes eficientes.', lvl: 2 },
    { q: 'En el experimento del capítulo, el Transformer pequeño alcanzó su mejor perplejidad en la época 8 y después empeoró. Esto indica…', opts: ['Sobreajuste: con 43.000 palabras el modelo memoriza el entrenamiento', 'Que el Transformer no sirve', 'Que el vocabulario cambió', 'Que la prueba era distinta'], ok: 0, fb: 'Con pocos datos hay que parar pronto (parada temprana) o regularizar más. Los Transformer brillan con corpus enormes.', lvl: 2 }
  ]);
})();
