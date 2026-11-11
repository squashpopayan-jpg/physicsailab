/* Capítulo 23 — Similitud entre palabras */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, W = L.wn, D = L.dist;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const PAL = () => Object.keys(L.corpus.wordnet.semillas).sort((a, b) => a.localeCompare(b, 'es'));

  /* ---- 1. Con un tesauro ---- */
  NL.defineSim('sim-tesauro', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Dos palabras');
    sim.select('a', { label: 'Palabra A', options: PAL().map((x) => [x, x]), value: 'perro' });
    sim.select('b', { label: 'Palabra B', options: PAL().map((x) => [x, x]), value: 'gato' });
    sim.out('w', 'Mejor Wu-Palmer entre sus sentidos', { hl: true });
    sim.out('c', 'Mejor camino entre sus sentidos');
    sim.onDraw(() => {
      const A = W.sentidos(sim.p.a), B = W.sentidos(sim.p.b), filas = [];
      for (const x of A) for (const y of B) { const w = W.wup(x, y), c = W.camino(x, y); if (w !== null) filas.push({ x, y, w, c, s: W.subsumidor(x, y), d: W.distancia(x, y) }); }
      if (!filas.length) { sim.set('w', '—'); sim.set('c', '—'); box.innerHTML = 'Sin relación en el subconjunto.'; return; }
      filas.sort((p, q) => q.w - p.w);
      sim.set('w', NL.fix(filas[0].w, 3)); sim.set('c', NL.fix(Math.max(...filas.map((f) => f.c)), 3));
      const n = (id) => W.etiqueta(id);
      box.innerHTML = `<small style="color:var(--ink-3)">${A.length} × ${B.length} = ${A.length * B.length} pares de sentidos; se muestran los 8 más parecidos (Wu-Palmer)</small><table class="mx"><thead><tr><th style="text-align:left">Sentido de A</th><th style="text-align:left">Sentido de B</th><th>Distancia</th><th>Camino</th><th>Wu-Palmer</th><th style="text-align:left">Subsumidor</th></tr></thead><tbody>` +
        filas.slice(0, 8).map((f, i) => `<tr class="${i === 0 ? 'hl' : ''}"><td style="text-align:left">${esc(n(f.x))}</td><td style="text-align:left">${esc(n(f.y))}</td><td>${f.d}</td><td>${NL.fix(f.c, 3)}</td><td>${NL.fix(f.w, 3)}</td><td style="text-align:left">${esc(n(f.s))}</td></tr>`).join('') + '</tbody></table>' +
        `<small style="color:var(--ink-3)">Camino = 1/(1 + arcos del camino más corto). Wu-Palmer = 2·prof(subsumidor)/(prof(A) + prof(B)), contando las profundidades desde la raíz con el subsumidor de menor profundidad mínima, como NLTK.</small>`;
    });
  });

  /* ---- 2. Distribucional ---- */
  NL.defineSim('sim-distribucional', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Palabra y representación');
    const pals = D.palabras().slice().sort((a, b) => a.localeCompare(b, 'es'));
    sim.select('w', { label: 'Palabra', options: pals.map((x) => [x, x]), value: 'gobierno' });
    sim.seg('r', { label: 'Valores del vector', options: [['conteo', 'Conteos'], ['ppmi', 'PMI positivo']], value: 'ppmi' });
    sim.select('v', { label: 'Comparar con', options: pals.map((x) => [x, x]), value: 'presidente' });
    sim.out('c', 'Coseno con la palabra elegida', { hl: true });
    sim.out('n', 'Contextos con valor distinto de cero');
    sim.onDraw(() => {
      const w = sim.p.w, v = sim.p.v, rep = sim.p.r;
      sim.set('c', NL.fix(D.sim(w, v, rep), 3)); sim.set('n', String(D.vector(w, rep).size));
      const vec = D.vecinos(w, 8, rep), top = D.topContextos(w, 8), comp = D.compartidos(w, v, 6);
      box.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px">` +
        `<div><small style="color:var(--ink-3)">Vecinos más cercanos de «${esc(w)}»</small><table class="mx"><tbody>${vec.map(([x, c], i) => `<tr><td style="text-align:left">${esc(x)}</td><td class="${i === 0 ? 'hl' : ''}">${NL.fix(c, 3)}</td></tr>`).join('')}</tbody></table></div>` +
        `<div><small style="color:var(--ink-3)">Contextos más asociados a «${esc(w)}»</small><table class="mx"><thead><tr><th style="text-align:left">Contexto</th><th>Conteo</th><th>PMI</th></tr></thead><tbody>${top.map(([c, n, p]) => `<tr><td style="text-align:left">${esc(c)}</td><td>${n}</td><td>${NL.fix(p, 2)}</td></tr>`).join('')}</tbody></table></div>` +
        `<div><small style="color:var(--ink-3)">Contextos que más aportan al parecido «${esc(w)}» – «${esc(v)}» (PMI)</small>${comp.length ? `<table class="mx"><tbody>${comp.map(([c, x, y]) => `<tr><td style="text-align:left">${esc(c)}</td><td>${NL.fix(x, 1)}</td><td>${NL.fix(y, 1)}</td></tr>`).join('')}</tbody></table>` : '<p style="font-size:12.5px;color:var(--ink-3)">No comparten contextos con PMI positivo.</p>'}</div></div>`;
    });
  });

  NL.bank.add('similitud', [
    { q: 'Con un tesauro, la similitud por camino entre dos sentidos es mayor cuando…', opts: ['Hay muchos arcos entre ellos', 'Están a pocos arcos en la jerarquía de hiperónimos', 'Tienen la misma letra inicial', 'Son del mismo idioma'], ok: 1, fb: 'sim = 1/(1 + longitud del camino más corto). Con distancia 0 vale 1.', lvl: 1 },
    { q: 'La similitud de Wu-Palmer mejora la del camino porque…', opts: ['Tiene en cuenta la profundidad del hiperónimo común: dos conceptos que se unen cerca de la raíz se parecen menos', 'Usa un corpus', 'Es más rápida', 'No usa WordNet'], ok: 0, fb: 'sim = 2·prof(LCS)/(prof(a) + prof(b)).', lvl: 2 },
    { q: 'En las medidas de Resnik y Lin, el «contenido de información» de un synset se estima…', opts: ['A partir de la frecuencia de sus palabras en un corpus: los conceptos raros informan más', 'Con el número de letras', 'Con la profundidad', 'A mano'], ok: 0, fb: 'IC(c) = −log P(c). Resnik usa el IC del subsumidor más bajo; Lin lo normaliza con el de los dos conceptos.', lvl: 3 },
    { q: 'La hipótesis distribucional (Harris, Firth) dice que…', opts: ['Las palabras con significados parecidos aparecen en contextos parecidos', 'Las palabras parecidas se escriben igual', 'Cada palabra tiene un solo contexto', 'El contexto no importa'], ok: 0, fb: '«Conocerás una palabra por la compañía que mantiene» (Firth, 1957).', lvl: 1 },
    { q: 'En una matriz palabra–contexto con ventana ±2, la celda (w, c) cuenta…', opts: ['Las veces que c aparece a distancia máxima 2 de w', 'Las veces que w aparece en el texto', 'La longitud de c', 'El número de sentidos'], ok: 0, fb: 'Es una matriz de coocurrencias; cada fila es el vector de una palabra.', lvl: 2 },
    { q: 'El PMI de dos palabras es log2 de…', opts: ['P(w,c) / (P(w)·P(c))', 'P(w,c) · P(w)', 'P(w)/P(c)', 'C(w,c)'], ok: 0, fb: 'Mide cuánto más coocurren de lo que se esperaría si fueran independientes.', lvl: 2 },
    { q: 'Se usa el PMI positivo (PPMI) porque…', opts: ['Los valores negativos se estiman mal con corpus pequeños y se sustituyen por 0', 'Es más bonito', 'Los negativos no existen', 'Es obligatorio'], ok: 0, fb: 'Una coocurrencia observada 0 veces tiene PMI = −∞; el truncado evita ese problema.', lvl: 3 },
    { q: 'El coseno entre dos vectores de coocurrencia depende de…', opts: ['El ángulo (no de la longitud) de los vectores', 'Solo de la longitud', 'El idioma', 'El orden alfabético'], ok: 0, fb: 'cos = a·b / (|a||b|). Normaliza el efecto de la frecuencia global de las palabras.', lvl: 2 },
    { q: 'Con conteos brutos, el coseno medio entre palabras tomadas al azar sale alto (0,53 en la matriz del curso; con PPMI, 0,06) porque…', opts: ['Los contextos muy frecuentes («de», «la», «que») dominan todos los vectores; el PMI los descuenta', 'Hay un error de cálculo', 'El coseno no sirve para palabras', 'Las palabras son sinónimas'], ok: 0, fb: 'Por eso las ponderaciones tipo PMI o TF-IDF son fundamentales.', lvl: 3 },
    { q: 'Dos palabras con PMI positivo y alto en los mismos contextos, ¿qué coseno tendrán?', opts: ['Alto', 'Cero', 'Negativo', 'Indefinido'], ok: 0, fb: 'Los vectores apuntan en direcciones parecidas.', lvl: 1 }
  ]);
})();
