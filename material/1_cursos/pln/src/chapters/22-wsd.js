/* Capítulo 22 — Desambiguación del sentido de las palabras */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, W = L.wn;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const P = () => L.corpus.wsd.pruebas;
  const etiqueta = (p, i) => `${p}: ${P()[i][2]}`;

  /* ---- 1. Lesk sobre una oración ---- */
  NL.defineSim('lesk-oracion', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('i', { label: 'Oración de prueba', options: P().map((t, i) => [String(i), etiqueta(t[0], i)]), value: '0', onInput: () => { sim.ctl.o.set('', true); } });
    sim.text('o', { label: 'O escriba otra con la misma palabra ambigua', value: '' });
    sim.group('Variante');
    sim.check('ej', { label: 'La firma incluye las oraciones de ejemplo', value: true });
    sim.check('idf', { label: 'Ponderar cada coincidencia con su IDF', value: false });
    sim.out('r', 'Sentido elegido', { hl: true });
    sim.onDraw(() => {
      const [p, gold, orig] = P()[+sim.p.i], oracion = (sim.p.o || '').trim() || orig, ss = L.corpus.wsd.palabras[p];
      const r = W.lesk(p, oracion, { ejemplos: sim.p.ej, idf: sim.p.idf });
      const esGold = !(sim.p.o || '').trim();
      sim.set('r', `${r.sentido + 1}` + (esGold ? (r.sentido === gold ? ' (correcto)' : ' (error: el correcto es el ' + (gold + 1) + ')') : ''));
      const filas = ss.map((s, i) => `<tr class="${i === r.sentido ? 'hl' : ''}"><td>${i + 1}</td><td style="text-align:left;white-space:normal;font-size:12px">${esc(s.d)}</td><td style="text-align:left;white-space:normal;font-size:12px">${r.solapes[i].length ? r.solapes[i].map((x) => `<span class="tk ok"><span>${esc(x)}</span></span>`).join('') : '<span style="color:var(--ink-3)">ninguna</span>'}</td><td>${NL.fix(r.puntajes[i], sim.p.idf ? 2 : 0)}</td></tr>`);
      box.innerHTML = `<p style="margin:0 0 6px"><b>${esc(p)}</b> en «${esc(oracion)}»</p><small style="color:var(--ink-3)">Raíces del contexto (sin vacías ni la propia palabra)</small><div class="tk-row">${r.contexto.map((x) => `<span class="tk"><span>${esc(x)}</span></span>`).join('')}</div>` +
        `<table class="mx"><thead><tr><th>#</th><th style="text-align:left">Sentido (definición)</th><th style="text-align:left">Raíces compartidas con el contexto</th><th>Puntos</th></tr></thead><tbody>${filas.join('')}</tbody></table>` +
        (Math.max(...r.puntajes) === 0 ? '<p style="margin:6px 0 0;color:var(--ink-3)">Ninguna raíz coincide: el algoritmo no tiene en qué apoyarse y devuelve el primer sentido por defecto.</p>' : '');
    });
  });

  /* ---- 2. Comparar métodos en las 43 oraciones ---- */
  NL.defineSim('wsd-evaluacion', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Método');
    sim.select('m', { label: 'Método', options: [['mfs', 'Sentido más frecuente (el primero)'], ['lesk', 'Lesk simplificado'], ['lesk0', 'Lesk solo con la definición'], ['idf', 'Lesk con IDF'], ['nb', 'Bayes ingenuo (supervisado con las definiciones y ejemplos)']], value: 'lesk' });
    sim.out('a', 'Exactitud', { hl: true });
    sim.out('b', 'Línea de base (siempre el primer sentido)');
    sim.onDraw(() => {
      const f = {
        mfs: (p) => ({ sentido: 0, puntajes: [] }), lesk: (p, o) => W.lesk(p, o), lesk0: (p, o) => W.lesk(p, o, { ejemplos: false }), idf: (p, o) => W.lesk(p, o, { idf: true }), nb: (p, o) => W.bayes(p, o)
      }[sim.p.m];
      const filas = P().map(([p, g, o]) => { const r = f(p, o); return { p, g, o, s: r.sentido, ok: r.sentido === g }; });
      const ok = filas.filter((x) => x.ok).length, mfs = filas.filter((x) => x.g === 0).length;
      sim.set('a', `${ok} de ${filas.length} (${NL.pct(ok / filas.length, 1)})`); sim.set('b', NL.pct(mfs / filas.length, 1));
      const por = {}; filas.forEach((x) => { por[x.p] = por[x.p] || [0, 0]; por[x.p][1]++; if (x.ok) por[x.p][0]++; });
      box.innerHTML = `<table class="mx"><thead><tr><th style="text-align:left">Palabra</th><th>Aciertos</th></tr></thead><tbody>${Object.entries(por).map(([p, [a, n]]) => `<tr><td style="text-align:left"><b>${p}</b></td><td class="${a === n ? 'hl' : ''}">${a} de ${n}</td></tr>`).join('')}</tbody></table>` +
        (filas.filter((x) => !x.ok).length ? `<small style="color:var(--ink-3)">Errores</small><ul style="margin:2px 0 0;padding-left:1.2em;font-size:12.5px">${filas.filter((x) => !x.ok).map((x) => `<li><b>${x.p}</b>: «${esc(x.o)}» → eligió el ${x.s + 1}, correcto el ${x.g + 1}</li>`).join('')}</ul>` : '<p>Sin errores.</p>');
    });
  });

  NL.bank.add('wsd', [
    { q: 'La desambiguación del sentido de las palabras (WSD) consiste en…', opts: ['Corregir la ortografía', 'Elegir, para una palabra en contexto, cuál de sus sentidos se usa', 'Traducir', 'Contar palabras'], ok: 1, fb: 'Es una tarea de clasificación: las clases son los sentidos del inventario (por ejemplo, los synsets de WordNet).', lvl: 1 },
    { q: 'En «lexical sample» se desambigua…', opts: ['Todas las palabras de un texto', 'Un conjunto pequeño y fijo de palabras ambiguas, con muchos ejemplos de cada una', 'Solo verbos', 'Solo nombres propios'], ok: 1, fb: 'En «all-words» se desambiguan todas las palabras de contenido del texto.', lvl: 2 },
    { q: 'El algoritmo de Lesk simplificado elige el sentido cuya definición…', opts: ['Es más larga', 'Comparte más palabras con el contexto de la palabra ambigua', 'Aparece primero en el diccionario', 'Tiene más sinónimos'], ok: 1, fb: 'Cuenta el solapamiento entre la firma del sentido y las palabras vecinas.', lvl: 1 },
    { q: 'Una debilidad de Lesk es que…', opts: ['Es muy lento', 'Las definiciones son cortas y puede no haber ninguna palabra en común con el contexto', 'No usa diccionario', 'Solo sirve para inglés'], ok: 1, fb: 'Con solapamiento cero devuelve el primer sentido. Se mejora con ejemplos, IDF o representaciones vectoriales.', lvl: 2 },
    { q: 'El IDF se usa en Lesk con corpus para…', opts: ['Dar menos peso a las palabras que aparecen en todas las definiciones (poco informativas)', 'Eliminar sentidos', 'Etiquetar la categoría gramatical', 'Medir la longitud'], ok: 0, fb: 'idf(w) = log(N / nw): una palabra presente en muchos documentos aporta poco.', lvl: 2 },
    { q: 'La línea de base más usada en WSD es…', opts: ['Elegir al azar', 'Elegir siempre el sentido más frecuente (MFS)', 'Elegir el último', 'No contestar'], ok: 1, fb: 'En los bancos de pruebas en inglés es difícil de batir sin ejemplos etiquetados.', lvl: 1 },
    { q: 'Según la heurística «un sentido por discurso», si «banco» aparece tres veces en un mismo texto…', opts: ['Tiene tres sentidos', 'Probablemente tiene el mismo sentido en las tres', 'No se puede desambiguar', 'Es un nombre propio'], ok: 1, fb: 'Funciona mejor con homonimia que con polisemia (Gale y otros, 1992).', lvl: 2 },
    { q: 'En el Bayes ingenuo para WSD, la decisión es ŝ = arg max P(s) ∏ P(rasgo | s). ¿Qué hipótesis se asume?', opts: ['Los rasgos son independientes dado el sentido', 'Los sentidos son independientes', 'El orden de las palabras importa', 'Cada palabra tiene un solo sentido'], ok: 0, fb: 'Es la hipótesis «ingenua»: simplifica mucho el cálculo y funciona sorprendentemente bien.', lvl: 3 },
    { q: 'Un rasgo colocacional para desambiguar «banco» es…', opts: ['La palabra situada justo a su derecha o a su izquierda, con su posición', 'El número de páginas', 'El autor', 'La letra inicial'], ok: 0, fb: 'Los rasgos colocacionales dependen de la posición; los de bolsa de palabras, no.', lvl: 3 },
    { q: 'Los sistemas actuales de WSD con modelos contextuales (tipo BERT) superan a Lesk porque…', opts: ['Usan un diccionario mayor', 'Representan la palabra con un vector que depende de todo su contexto, no solo de coincidencias de palabras', 'Son más rápidos', 'Eliminan la ambigüedad del inventario'], ok: 1, fb: 'No necesitan solapamiento literal: comparan representaciones.', lvl: 2 }
  ]);
})();
