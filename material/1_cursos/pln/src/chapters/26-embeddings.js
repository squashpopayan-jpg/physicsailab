/* Capítulo 26 — Embeddings: SVD de la matriz PPMI y skip-gram con muestreo negativo */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, E = L.emb, D = L.dist;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const PAL = () => D.palabras().slice().sort((a, b) => a.localeCompare(b, 'es'));
  let ENERGIA = null;
  const energiaTotal = () => ENERGIA || (ENERGIA = D.palabras().reduce((s, w) => { let t = 0; for (const x of D.vector(w, 'ppmi').values()) t += x * x; return s + t; }, 0));

  /* ---- 1. SVD de la matriz PPMI ---- */
  NL.defineSim('emb-svd', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, label: 'Palabras en las dimensiones 2 y 3 del embedding' });
    const box = sim.html('pad');
    sim.group('Palabra y tamaño del vector');
    sim.select('w', { label: 'Palabra', options: PAL().map((x) => [x, x]), value: 'gobierno' });
    sim.seg('k', { label: 'Dimensiones del embedding', options: [['5', '5'], ['20', '20'], ['50', '50']], value: '20' });
    sim.out('e', 'Energía de la matriz conservada', { hl: true });
    sim.out('s', 'Vecinos en común con la matriz completa (de 8)');
    sim.onDraw(() => {
      const k = +sim.p.k, m = E.porSVD(k, 1), w = sim.p.w;
      const energia = m.S.reduce((s, x) => s + x * x, 0) / energiaTotal();
      sim.set('e', NL.pct(energia, 1));
      const dens = E.vecinos(m, w, 8), disp = D.vecinos(w, 8, 'ppmi'), comun = dens.filter((x) => disp.some((y) => y[0] === x[0])).length;
      sim.set('s', String(comun));
      /* mapa: dimensiones 2 y 3 (la 1.ª refleja sobre todo la frecuencia) */
      const d1 = Math.min(1, k - 1), d2 = Math.min(2, k - 1), top = m.palabras.slice(0, 160), idw = m.idx.get(w), vec = new Set(dens.map((x) => x[0]));
      const xs = top.map((p) => m.W[m.idx.get(p)][d1]), ys = top.map((p) => m.W[m.idx.get(p)][d2]);
      const all = [idw, ...dens.map((x) => m.idx.get(x[0]))].map((i) => [m.W[i][d1], m.W[i][d2]]);
      const px = xs.concat(all.map((a) => a[0])), py = ys.concat(all.map((a) => a[1]));
      const mx = (a) => [Math.min(...a), Math.max(...a)], [x0, x1] = mx(px), [y0, y1] = mx(py), pad = (a, b) => (b - a) * 0.08 || 1;
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: x0 - pad(x0, x1), xmax: x1 + pad(x0, x1), ymin: y0 - pad(y0, y1), ymax: y1 + pad(y0, y1), xlabel: `dimensión ${d1 + 1}`, ylabel: `dimensión ${d2 + 1}`, mb: 34 });
      pl.frame();
      top.forEach((p, i) => { if (p !== w && !vec.has(p)) pl.dot(xs[i], ys[i], { color: '--ink-3', r: 2.2 }); });
      dens.forEach(([p]) => { const v = m.W[m.idx.get(p)]; pl.dot(v[d1], v[d2], { color: '--c2', r: 4.5 }); pl.label(v[d1], v[d2], p, { color: '--c2', size: 11 }); });
      pl.dot(m.W[idw][d1], m.W[idw][d2], { color: '--c1', r: 6 }); pl.label(m.W[idw][d1], m.W[idw][d2], w, { color: '--c1', size: 12.5 });
      box.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px"><div><small style="color:var(--ink-3)">Vecinos con el embedding denso de ${k} dimensiones</small><table class="mx"><tbody>${dens.map(([p, c], i) => `<tr><td style="text-align:left">${esc(p)}</td><td class="${i === 0 ? 'hl' : ''}">${NL.fix(c, 3)}</td></tr>`).join('')}</tbody></table></div>` +
        `<div><small style="color:var(--ink-3)">Vecinos con la matriz PPMI completa (800 dimensiones)</small><table class="mx"><tbody>${disp.map(([p, c], i) => `<tr><td style="text-align:left">${esc(p)}</td><td class="${i === 0 ? 'hl' : ''}">${NL.fix(c, 3)}</td></tr>`).join('')}</tbody></table></div></div>` +
        `<small style="color:var(--ink-3)">Valores singulares: ${m.S.slice(0, 6).map((x) => NL.fix(x, 1)).join(', ')} … · la matriz es 400 × 800 y se comprime a 400 × ${k}.</small>`;
    });
  });

  /* ---- 2. Skip-gram con muestreo negativo, paso a paso ---- */
  let SG = null;
  NL.defineSim('emb-sgns', function (sim) {
    const cv = sim.canvas({ aspect: 2.4, label: 'Pérdida media por par durante el entrenamiento' });
    const box = sim.html('pad');
    const nueva = () => { SG = E.sgns(L.corpus.lm.train, { dim: 24, vent: 2, neg: 5, minimo: 3, lr: 0.1, epocasTotal: 20, semilla: 3 }); };
    if (!SG) nueva();
    sim.group('Entrenamiento');
    sim.select('w', { label: 'Palabra', options: SG.palabras.slice(0, 400).sort((a, b) => a.localeCompare(b, 'es')).map((x) => [x, x]), value: 'gobierno' });
    sim.button('Entrenar 2 épocas', () => { SG.entrenar(2); }, { primary: true });
    sim.button('Entrenar 10 épocas', () => { SG.entrenar(10); });
    sim.button('Reiniciar', () => { nueva(); });
    sim.out('e', 'Épocas entrenadas', { hl: true });
    sim.out('l', 'Pérdida de la última época');
    sim.onDraw(() => {
      sim.set('e', `${SG.epocaN} (vocabulario ${SG.V}, ${SG.dim} dimensiones)`); sim.set('l', SG.hist.length ? NL.fix(SG.hist[SG.hist.length - 1], 3) : '—');
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(4, SG.hist.length), ymin: 1.5, ymax: 3.2, xlabel: 'época', ylabel: 'pérdida', mb: 34 });
      pl.frame();
      if (SG.hist.length) { pl.xy(SG.hist.map((_, i) => i + 1), SG.hist, { color: '--c1', width: 2.2 }); SG.hist.forEach((h, i) => pl.dot(i + 1, h, { color: '--c1', r: 3 })); }
      const w = sim.p.w, vec = SG.epocaN ? E.vecinos({ palabras: SG.palabras, idx: SG.idx, W: SG.W }, w, 8) : [], svd = E.vecinos(E.porSVD(20, 1), w, 8);
      box.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px"><div><small style="color:var(--ink-3)">Vecinos con skip-gram (${SG.epocaN} épocas)</small>${vec.length ? `<table class="mx"><tbody>${vec.map(([p, c], i) => `<tr><td style="text-align:left">${esc(p)}</td><td class="${i === 0 ? 'hl' : ''}">${NL.fix(c, 3)}</td></tr>`).join('')}</tbody></table>` : '<p style="font-size:12.5px;color:var(--ink-3)">Entrene al menos una época. Con 0, los vectores son ruido aleatorio.</p>'}</div>` +
        `<div><small style="color:var(--ink-3)">Vecinos con SVD de PPMI (20 dim.)</small><table class="mx"><tbody>${svd.map(([p, c], i) => `<tr><td style="text-align:left">${esc(p)}</td><td class="${i === 0 ? 'hl' : ''}">${NL.fix(c, 3)}</td></tr>`).join('')}</tbody></table></div></div>`;
    });
  });

  NL.bank.add('embeddings', [
    { q: 'Un embedding de palabra es…', opts: ['Un vector denso de pocos cientos de números que representa la palabra', 'Una palabra incrustada en una frase', 'Un número entero único', 'Un árbol sintáctico'], ok: 0, fb: 'Se aprende de modo que las palabras que se usan de forma parecida queden cerca.', lvl: 1 },
    { q: 'Frente a los vectores de coocurrencia, los embeddings son…', opts: ['Más cortos y densos, y generalizan mejor', 'Más largos y dispersos', 'Siempre binarios', 'Idénticos'], ok: 0, fb: 'Pasan de miles de dimensiones casi vacías a unas decenas o cientos con valores reales.', lvl: 1 },
    { q: 'La SVD truncada de rango k de una matriz conserva…', opts: ['La mejor aproximación de rango k en norma de Frobenius (Eckart–Young)', 'Las k primeras filas', 'Las k primeras columnas', 'Los valores menores'], ok: 0, fb: 'Se quedan los k mayores valores singulares y sus vectores.', lvl: 2 },
    { q: 'En la matriz PPMI del curso, el rango 20 conserva el 20,7 % de la energía y el 100, el 57,7 %. Esto indica que…', opts: ['La información está repartida entre muchas direcciones: hay mucho ruido y pocos datos', 'La SVD falló', 'Basta con 5 dimensiones', 'La matriz es de rango 1'], ok: 0, fb: 'Con un corpus de 190.000 palabras, la matriz tiene poca estructura de bajo rango.', lvl: 3 },
    { q: 'Skip-gram con muestreo negativo entrena un clasificador que…', opts: ['Distingue pares (palabra, contexto) reales de pares falsos tomados al azar', 'Predice la categoría gramatical', 'Cuenta bigramas', 'Reconstruye la frase entera'], ok: 0, fb: 'Los embeddings son los pesos del clasificador, que se aprenden como subproducto.', lvl: 2 },
    { q: 'Para un par real (w, c) y k pares falsos, la pérdida de skip-gram con muestreo negativo es…', opts: ['−log σ(w·c) − Σ log σ(−w·nᵢ)', '−log σ(w·c) + Σ log σ(w·nᵢ)', 'σ(w·c) · Σ σ(w·nᵢ)', '(w·c)²'], ok: 0, fb: 'Empuja w·c hacia arriba y w·nᵢ hacia abajo.', lvl: 3 },
    { q: 'Los negativos se muestrean con probabilidad proporcional a la frecuencia elevada a 0,75 para…', opts: ['Dar algo más de oportunidad a las palabras poco frecuentes que con la frecuencia pura', 'Eliminar las palabras raras', 'Acelerar el cálculo', 'Evitar los repetidos'], ok: 0, fb: 'Es un truco empírico de Mikolov y otros (2013).', lvl: 3 },
    { q: 'En el curso, con un corpus de 43.000 palabras, ¿qué funcionó mejor para encontrar vecinos?', opts: ['El SVD de la matriz PPMI', 'El skip-gram con 30 épocas', 'Ninguno funcionó', 'Los dos igual'], ok: 0, fb: 'Con poco texto los métodos de recuento son competitivos o mejores (Levy y Goldberg, 2015); word2vec brilla con corpus de millones de palabras.', lvl: 2 },
    { q: 'Las analogías como rey − hombre + mujer ≈ reina se obtienen…', opts: ['Con aritmética de vectores y buscando el más cercano', 'Con una tabla de verdad', 'Con un diccionario', 'No se obtienen nunca'], ok: 0, fb: 'Funcionan bien con embeddings entrenados con corpus grandes; con corpus pequeños, no.', lvl: 2 },
    { q: 'Un defecto de los embeddings estáticos es que…', opts: ['Dan un solo vector por palabra aunque tenga varios sentidos', 'No sirven para comparar palabras', 'Son muy largos', 'Son siempre enteros'], ok: 0, fb: 'Los embeddings contextuales (BERT, capítulo 31) dan un vector a cada ocurrencia.', lvl: 2 }
  ]);
})();
