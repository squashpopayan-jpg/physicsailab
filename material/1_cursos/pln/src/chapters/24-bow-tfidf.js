/* Capítulo 24 — Bolsa de palabras, n-gramas y TF-IDF */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, V = L.vec;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const VACIAS = new Set('a al algo como con de del el en es esta este la las lo los me mi muy no para pero por que se si su un una y ya fue sobre al'.split(' '));

  /* ---- 1. La matriz documento–término ---- */
  NL.defineSim('bow-matriz', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Documentos (uno por línea)');
    sim.text('t', { label: 'Texto', value: 'El gato duerme en el sofá\nEl perro duerme en el jardín\nEl gato caza al ratón\nEl ratón huye del gato', rows: 5 });
    sim.group('Representación');
    sim.seg('n', { label: 'N-gramas', options: [['1', 'Palabras'], ['2', 'Palabras y pares']], value: '1' });
    sim.check('v', { label: 'Quitar palabras vacías', value: false });
    sim.seg('w', { label: 'Valor de cada celda', options: [['conteo', 'Conteo'], ['bin', 'Binario'], ['tfidf', 'TF-IDF']], value: 'conteo' });
    sim.out('d', 'Documentos × rasgos', { hl: true });
    sim.out('z', 'Celdas distintas de cero');
    sim.onDraw(() => {
      const docs = sim.p.t.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 8);
      if (!docs.length) { box.innerHTML = 'Escriba al menos un documento.'; return; }
      const m = V.ajustar(docs, { n: [1, +sim.p.n], vacias: sim.p.v ? VACIAS : null, binario: sim.p.w === 'bin' });
      const filas = docs.map((d) => { const c = V.contar(m, d); return sim.p.w === 'tfidf' ? V.tfidf(m, c) : c; });
      const nz = filas.reduce((s, f) => s + f.size, 0);
      sim.set('d', `${docs.length} × ${m.vocab.length}`); sim.set('z', `${nz} de ${docs.length * m.vocab.length} (${NL.pct(nz / (docs.length * m.vocab.length || 1), 0)})`);
      const mx = Math.max(1e-9, ...filas.flatMap((f) => Array.from(f.values())));
      const cols = m.vocab.map((w, j) => j);
      const fmt = (x) => (x === undefined ? '' : sim.p.w === 'tfidf' ? NL.fix(x, 2) : String(x));
      box.innerHTML = `<div style="overflow-x:auto"><table class="mx"><thead><tr><th style="text-align:left">Documento</th>${m.vocab.map((w) => `<th style="font-size:11px">${esc(w)}</th>`).join('')}</tr></thead><tbody>` +
        filas.map((f, i) => `<tr><td style="text-align:left;white-space:nowrap;font-size:11.5px">${esc(docs[i].slice(0, 28))}</td>${cols.map((j) => { const x = f.get(j); return `<td style="${x !== undefined ? `background:color-mix(in srgb, var(--c1,#4c78a8) ${Math.round(18 + 60 * x / mx)}%, transparent)` : 'color:var(--ink-3)'}">${x === undefined ? '·' : fmt(x)}</td>`; }).join('')}</tr>`).join('') + '</tbody></table></div>' +
        `<small style="color:var(--ink-3)">idf (suavizado) por rasgo: ${m.vocab.map((w, j) => `${esc(w)} ${NL.fix(V.idf(m)[j], 2)}`).slice(0, 14).join(' · ')}${m.vocab.length > 14 ? ' …' : ''}</small>`;
    });
  });

  /* ---- 2. Búsqueda por coseno con TF-IDF ---- */
  NL.defineSim('tfidf-busqueda', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const docs = L.corpus.opiniones.map((r) => r.texto);
    sim.group('Consulta');
    sim.text('q', { label: 'Consulta', value: 'la guía es confusa y difícil' });
    sim.seg('w', { label: 'Ponderación', options: [['tfidf', 'TF-IDF'], ['conteo', 'Solo conteos']], value: 'tfidf' });
    sim.check('v', { label: 'Quitar palabras vacías', value: false });
    sim.out('r', 'Documentos con coseno > 0', { hl: true });
    sim.onDraw(() => {
      const opts = { vacias: sim.p.v ? VACIAS : null }, m = V.ajustar(docs, opts);
      const tf = sim.p.w === 'tfidf' ? (c) => V.tfidf(m, c) : (c) => { const v = new Map(c); let s = 0; for (const x of v.values()) s += x * x; s = Math.sqrt(s); for (const [k, x] of v) v.set(k, x / s); return v; };
      const vs = docs.map((d) => tf(V.contar(m, d))), q = tf(V.contar(m, sim.p.q));
      const rank = vs.map((v, i) => [i, V.coseno(q, v)]).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
      sim.set('r', `${rank.filter((x) => x[1] > 0).length} de ${docs.length}`);
      if (!q.size) { box.innerHTML = '<p>Ninguna palabra de la consulta está en el vocabulario.</p>'; return; }
      box.innerHTML = `<small style="color:var(--ink-3)">Términos de la consulta en el vocabulario: ${Array.from(q.keys()).map((j) => `<b>${esc(m.vocab[j])}</b> (idf ${NL.fix(V.idf(m)[j], 2)})`).join(', ')}</small>` +
        `<table class="mx"><thead><tr><th>#</th><th>Coseno</th><th style="text-align:left">Opinión</th><th style="text-align:left">Clase</th></tr></thead><tbody>${rank.slice(0, 6).map(([i, c], k) => `<tr class="${k === 0 ? 'hl' : ''}"><td>${k + 1}</td><td>${NL.fix(c, 3)}</td><td style="text-align:left;white-space:normal;font-size:12.5px">${esc(docs[i])}</td><td style="text-align:left">${esc(L.corpus.opiniones[i].etiqueta)}</td></tr>`).join('')}</tbody></table>`;
    });
  });

  NL.bank.add('bow-tfidf', [
    { q: 'En la bolsa de palabras un documento se representa como…', opts: ['Una secuencia ordenada de palabras', 'Un vector con el conteo de cada palabra del vocabulario, sin orden', 'Un árbol sintáctico', 'Una sola palabra'], ok: 1, fb: 'Se pierde el orden: «el perro muerde al niño» y «el niño muerde al perro» dan el mismo vector.', lvl: 1 },
    { q: 'Un vocabulario de 2.000 palabras y un documento de 20 tokens distintos producen un vector con…', opts: ['20 ceros', 'Como mucho 20 elementos distintos de cero entre 2.000', '2.000 unos', 'Un solo elemento'], ok: 1, fb: 'Los vectores son dispersos: casi todo ceros, por eso se guardan como matrices dispersas.', lvl: 1 },
    { q: 'Una oración de 6 palabras tiene cuántos bigramas (pares de palabras consecutivas)?', num: 5, tol: 0, fb: 'Para n palabras hay n − 1 bigramas.', lvl: 1 },
    { q: 'Los n-gramas (n > 1) se añaden a la bolsa de palabras para…', opts: ['Recuperar algo del orden local («no gusta», «muy bueno»)', 'Reducir el vocabulario', 'Acelerar el cálculo', 'Eliminar las palabras vacías'], ok: 0, fb: 'A costa de un vocabulario mucho mayor y matrices más dispersas (en las 360 opiniones, de 124 rasgos a 498 con bigramas).', lvl: 2 },
    { q: 'La frecuencia inversa de documento (IDF) de un término es mayor cuando…', opts: ['Aparece en casi todos los documentos', 'Aparece en pocos documentos', 'Es muy largo', 'Está en mayúsculas'], ok: 1, fb: 'idf = log(N/df): los términos raros discriminan más.', lvl: 1 },
    { q: 'Con N = 100 documentos, df = 10 y la fórmula clásica idf = ln(N/df), ¿cuánto vale el idf (2 decimales)?', num: 2.30, tol: 0.01, fb: 'ln(100/10) = ln 10 ≈ 2,30. (scikit-learn usa ln((1+N)/(1+df)) + 1 ≈ 3,22.)', lvl: 2 },
    { q: 'TF-IDF pondera cada término con…', opts: ['Su frecuencia en el documento multiplicada por lo raro que es en la colección', 'La longitud del documento', 'El número de letras', 'Su categoría gramatical'], ok: 0, fb: 'tf-idf(t, d) = tf(t, d) · idf(t); luego se suele normalizar el vector a longitud 1.', lvl: 1 },
    { q: 'Se normaliza cada vector a longitud 1 (norma L2) para que…', opts: ['El coseno sea simplemente el producto escalar y no dependa de la longitud del documento', 'Todos los valores sean enteros', 'Se pueda ordenar alfabéticamente', 'Desaparezca el vocabulario'], ok: 0, fb: 'Con vectores unitarios, cos(a, b) = a · b.', lvl: 2 },
    { q: 'Dos documentos sin ninguna palabra en común tienen coseno…', opts: ['0', '1', '−1', 'Indefinido siempre'], ok: 0, fb: 'Los vectores son ortogonales (los valores son no negativos, el coseno no baja de 0).', lvl: 2 },
    { q: 'Una limitación de la bolsa de palabras y TF-IDF es que…', opts: ['No capturan sinónimos: «bueno» y «excelente» son columnas sin relación', 'Son demasiado lentos', 'Solo funcionan en inglés', 'No permiten buscar'], ok: 0, fb: 'Los embeddings (capítulo 26) y los modelos contextuales resuelven en parte este problema.', lvl: 2 }
  ]);
})();
