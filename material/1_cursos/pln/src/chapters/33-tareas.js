/* Capítulo 33 — Tareas de PLN: entidades, emparejamiento de textos, resumen */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, N = L.ner, V = L.vec;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const COL = { PER: '--c1', ORG: '--c2', LOC: '--c3', MISC: '--c4' };
  let MODELO = null, PRED = null;
  const modelo = () => MODELO || (MODELO = N.entrenar(L.corpus.ner.tr, 5));
  const palabras = (t) => t.match(/[\p{L}\p{N}]+(?:[.'’-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu) || [];

  /* ---- 1. Reconocimiento de entidades ---- */
  NL.defineSim('ner-etiquetar', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const TE = L.corpus.ner.te;
    sim.group('Texto');
    sim.slider('i', { label: 'Oración de prueba (con la referencia humana)', min: 1, max: 60, step: 1, value: 4, fmt: (v) => String(v), onInput: () => { sim.ctl.t.set('', true); } });
    sim.text('t', { label: 'O escriba una frase propia (anula la anterior)', value: '' });
    sim.out('f', 'F1 por entidades en las 300 oraciones de prueba', { hl: true });
    sim.onDraw(() => {
      const m = modelo();
      if (!PRED) PRED = TE.map((s) => N.etiquetar(m, s.map((x) => x[0])));
      const ev = N.evaluar(TE.map((s) => s.map((x) => x[1])), PRED).TOTAL;
      sim.set('f', `${NL.fix(ev.f, 3)} (precisión ${NL.fix(ev.p, 3)}, cobertura ${NL.fix(ev.r, 3)})`);
      const propia = (sim.p.t || '').trim(), pal = propia ? palabras(propia) : TE[sim.p.i - 1].map((x) => x[0]);
      const pred = propia ? N.etiquetar(m, pal) : PRED[sim.p.i - 1], oro = propia ? null : TE[sim.p.i - 1].map((x) => x[1]);
      const chip = (w, t, bad) => `<span class="tk ${bad ? 'bad' : ''}" style="${t !== 'O' ? 'border-color:var(' + COL[t.slice(2)] + ')' : ''}"><span>${esc(w)}</span><small style="display:block;font-size:10px;color:var(--ink-3)">${t}</small></span>`;
      const ents = N.entidades(pred).map(([t, a, b]) => `<span class="tk ok" style="border-color:var(${COL[t]})"><span>${esc(pal.slice(a, b).join(' '))} <small>${t}</small></span></span>`);
      box.innerHTML = `<small style="color:var(--ink-3)">Etiquetas predichas (B- = comienza una entidad, I- = continúa, O = ninguna)</small><div class="tk-row">${pal.map((w, i) => chip(w, pred[i], oro && oro[i] !== pred[i])).join('')}</div>` +
        (oro ? `<small style="color:var(--ink-3)">Etiquetas de la referencia (en rojo, donde difiere la predicción)</small><div class="tk-row">${pal.map((w, i) => chip(w, oro[i], oro[i] !== pred[i])).join('')}</div>` : '') +
        `<small style="color:var(--ink-3)">Entidades encontradas</small><div class="tk-row">${ents.join('') || '<span style="color:var(--ink-3)">ninguna</span>'}</div>`;
    });
  });

  /* ---- 2. Emparejar textos: cuatro maneras de medir si dos frases dicen lo mismo ---- */
  const PARES = [
    ['el gobierno anunció una nueva política económica', 'el ejecutivo presentó un plan económico nuevo', 'Paráfrasis'],
    ['el presidente viajó a la capital', 'el presidente no viajó a la capital', 'Contradicción por negación'],
    ['el equipo ganó el partido de ayer', 'la empresa anunció la compra de la compañía', 'Sin relación'],
    ['el equipo ganó el partido de ayer', 'el partido de ayer lo ganó el equipo', 'Mismo contenido, otro orden'],
    ['el banco subió los tipos de interés', 'el banco de madera está en el parque', 'Misma palabra, otro sentido']
  ];
  let IDFM = null;
  const idfModelo = () => IDFM || (IDFM = V.ajustar(L.corpus.lm.train, { n: [1, 1] }));
  const mediaEmb = (txt) => { const m = L.emb.porSVD(20, 1), ws = (txt.toLowerCase().match(/[a-záéíóúüñ]+/g) || []).filter((w) => m.idx.has(w)); if (!ws.length) return null; const v = new Array(20).fill(0); ws.forEach((w) => m.W[m.idx.get(w)].forEach((x, i) => { v[i] += x / Math.sqrt(m.W[m.idx.get(w)].reduce((a, y) => a + y * y, 0)); })); return v; };
  NL.defineSim('emparejar-textos', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Par de frases');
    sim.select('e', { label: 'Ejemplo', options: PARES.map((x, i) => [String(i), x[2]]), value: '0', onInput: () => { sim.ctl.a.set(PARES[+sim.p.e][0], true); sim.ctl.b.set(PARES[+sim.p.e][1], true); } });
    sim.text('a', { label: 'Frase A', value: PARES[0][0] });
    sim.text('b', { label: 'Frase B', value: PARES[0][1] });
    sim.out('r', 'Resumen', { hl: true });
    sim.onDraw(() => {
      const a = sim.p.a, b = sim.p.b, ta = new Set(palabras(a.toLowerCase())), tb = new Set(palabras(b.toLowerCase()));
      const inter = [...ta].filter((x) => tb.has(x)).length, jac = inter / (ta.size + tb.size - inter || 1);
      const m = idfModelo(), cos = V.coseno(V.tfidf(m, V.contar(m, a)), V.tfidf(m, V.contar(m, b)));
      const d = L.edit.dist(a.toLowerCase(), b.toLowerCase()), edit = 1 - d / Math.max(a.length, b.length, 1);
      const ea = mediaEmb(a), eb = mediaEmb(b), emb = ea && eb ? L.emb.coseno(ea, eb) : null;
      const fila = (n, v, nota) => `<tr><td style="text-align:left">${n}</td><td class="hl">${v === null ? '—' : NL.fix(v, 3)}</td><td style="text-align:left;white-space:normal;font-size:12px;color:var(--ink-3)">${nota}</td></tr>`;
      sim.set('r', `léxico ${NL.fix(cos, 2)} · semántico ${emb === null ? '—' : NL.fix(emb, 2)}`);
      box.innerHTML = `<table class="mx"><thead><tr><th style="text-align:left">Medida</th><th>Valor</th><th style="text-align:left">Qué mira</th></tr></thead><tbody>` +
        fila('Jaccard de palabras', jac, 'Palabras compartidas / palabras distintas en total') + fila('Coseno TF-IDF', cos, 'Palabras compartidas, con más peso las raras (vocabulario de noticias)') +
        fila('Similitud de edición de caracteres', edit, '1 − distancia de Levenshtein / longitud máxima: forma, no significado') +
        fila('Coseno de embeddings medios', emb, 'Promedio de los vectores de las palabras de contenido (capítulo 26); detecta cercanía temática sin palabras comunes') +
        `</tbody></table><small style="color:var(--ink-3)">Ninguna distingue «viajó» de «no viajó»: el significado composicional y la negación exigen modelos que lean la pareja entera (clasificadores de implicación textual o similitud con Transformer).</small>`;
    });
  });

  /* ---- 3. Resumen extractivo ---- */
  const TEXTO = 'El procesamiento del lenguaje natural estudia cómo hacer que las máquinas comprendan y produzcan lenguaje humano. Sus primeras aplicaciones, en los años cincuenta, fueron la traducción automática y los programas de conversación sencillos. Durante décadas dominaron los sistemas basados en reglas escritas a mano por lingüistas. En los años noventa llegaron los métodos estadísticos, que aprenden de grandes colecciones de texto. Hoy los modelos neuronales preentrenados con Transformer han cambiado casi todas las tareas. Estos modelos aprenden representaciones de las palabras a partir de cantidades enormes de texto sin etiquetar. Gracias a ellas, tareas como la traducción, el resumen o la respuesta a preguntas alcanzan una calidad impensable hace diez años. Sin embargo, quedan problemas abiertos, como la fiabilidad de los hechos, el sesgo y el coste de entrenamiento.';
  const frases = (t) => (t.match(/[^.!?]+[.!?]+/g) || [t]).map((x) => x.trim()).filter(Boolean);
  NL.defineSim('resumen-extractivo', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Texto');
    sim.text('t', { label: 'Texto a resumir', value: TEXTO, rows: 7 });
    sim.group('Método');
    sim.seg('m', { label: 'Cómo puntuar las frases', options: [['lead', 'Las primeras (lead)'], ['tfidf', 'Centro TF-IDF'], ['tr', 'TextRank']], value: 'tr' });
    sim.slider('k', { label: 'Frases del resumen', min: 1, max: 5, step: 1, value: 3, fmt: (v) => String(v) });
    sim.out('c', 'Compresión', { hl: true });
    sim.onDraw(() => {
      const fr = frases(sim.p.t); if (fr.length < 2) { box.innerHTML = '<p>Escriba al menos dos frases.</p>'; return; }
      const vac = new Set('a al algo como con de del el en es esta este la las lo los me mi muy no para pero por que se si su un una y ya fue sobre'.split(' ')), m = V.ajustar(fr, { vacias: vac }), X = fr.map((f) => V.tfidf(m, V.contar(m, f)));
      let pun;
      if (sim.p.m === 'lead') pun = fr.map((_, i) => fr.length - i);
      else if (sim.p.m === 'tfidf') { const c = new Map(); X.forEach((v) => v.forEach((x, j) => c.set(j, (c.get(j) || 0) + x))); pun = X.map((v) => V.coseno(v, c)); }
      else {
        const n = fr.length, S = X.map((a, i) => X.map((b, j) => (i === j ? 0 : V.coseno(a, b)))), suma = S.map((r) => r.reduce((a, b) => a + b, 0)); let r = new Array(n).fill(1 / n);
        for (let it = 0; it < 60; it++) r = r.map((_, i) => 0.15 / n + 0.85 * S.reduce((a, row, j) => a + (suma[j] ? row[i] / suma[j] * r[j] : 0), 0));
        pun = r;
      }
      const sel = pun.map((p, i) => [i, p]).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, sim.p.k).map((x) => x[0]), set = new Set(sel);
      const palabrasT = (t) => (t.match(/\p{L}+/gu) || []).length;
      sim.set('c', `${palabrasT(sel.sort((a, b) => a - b).map((i) => fr[i]).join(' '))} de ${palabrasT(fr.join(' '))} palabras (${NL.pct(palabrasT(sel.map((i) => fr[i]).join(' ')) / palabrasT(fr.join(' ')), 0)})`);
      const mx = Math.max(...pun);
      box.innerHTML = fr.map((f, i) => `<p style="margin:3px 0;padding:4px 6px;border-radius:6px;${set.has(i) ? 'background:color-mix(in srgb, var(--c2,#e07b39) 22%, transparent)' : ''}"><small style="color:var(--ink-3)">${i + 1} · puntuación ${NL.fix(pun[i] / mx, 2)}</small><br>${esc(f)}</p>`).join('') +
        `<small style="color:var(--ink-3)">Resumen (frases en su orden original): ${sel.map((i) => i + 1).join(', ')}. Un resumen extractivo copia frases; uno abstractivo (un modelo de lenguaje) las reescribe.</small>`;
    });
  });

  NL.bank.add('tareas', [
    { q: 'En la tarea de reconocimiento de entidades nombradas (NER), el modelo debe…', opts: ['Encontrar en el texto los fragmentos que nombran personas, organizaciones, lugares, etc., y su tipo', 'Traducir los nombres propios', 'Contar las palabras', 'Etiquetar la categoría gramatical'], ok: 0, fb: 'Es un problema de etiquetado de secuencias.', lvl: 1 },
    { q: 'En el esquema BIO, «Gabriel García Márquez» se etiqueta…', opts: ['B-PER I-PER I-PER', 'B-PER B-PER B-PER', 'I-PER I-PER I-PER', 'O O O'], ok: 0, fb: 'B comienza la entidad, I la continúa y O está fuera de las entidades.', lvl: 1 },
    { q: 'Se evalúa el NER por entidades completas porque…', opts: ['La exactitud por palabra se infla con la etiqueta O (en el corpus del capítulo, el 84 % de las palabras)', 'Es más fácil', 'No hay etiquetas', 'Las entidades son siempre de una palabra'], ok: 0, fb: 'Una entidad solo cuenta si coinciden el tipo y los límites exactos.', lvl: 2 },
    { q: 'Un sistema predice 80 entidades, 60 son correctas, y hay 100 en la referencia. ¿Cuánto vale el F1 (2 decimales)?', num: 0.67, tol: 0.01, fb: 'P = 60/80 = 0,75; R = 60/100 = 0,6; F1 = 2·0,75·0,6/1,35 = 0,667.', lvl: 2 },
    { q: 'En el capítulo, el perceptrón de entidades alcanza un F1 de 0,713 y la línea de base, 0,595. ¿Qué tipo de entidad es la más difícil?', opts: ['MISC (miscelánea), con F1 de 0,217', 'PER', 'LOC', 'ORG'], ok: 0, fb: 'La categoría «otras» no tiene un patrón claro (obras, eventos, gentilicios…).', lvl: 2 },
    { q: 'La similitud léxica (palabras compartidas) y la semántica (embeddings) difieren en que…', opts: ['La semántica puede dar alta similitud a frases sin palabras en común pero del mismo tema', 'La léxica es mejor siempre', 'No hay diferencia', 'La semántica solo cuenta letras'], ok: 0, fb: 'Pero ambas ignoran la negación y el orden: «viajó» y «no viajó» salen casi iguales.', lvl: 2 },
    { q: 'Un resumen extractivo…', opts: ['Selecciona y copia las frases más importantes del texto original', 'Escribe frases nuevas', 'Traduce el texto', 'Elimina las palabras vacías'], ok: 0, fb: 'El abstractivo genera texto nuevo con un modelo de lenguaje, con el riesgo de alucinaciones.', lvl: 1 },
    { q: 'TextRank puntúa las frases…', opts: ['Con PageRank sobre un grafo cuyos nodos son frases y cuyas aristas son su similitud', 'Contando su longitud', 'Por su posición solamente', 'Con una red recurrente'], ok: 0, fb: 'Las frases parecidas a muchas otras importantes resultan importantes.', lvl: 2 },
    { q: 'La respuesta a preguntas extractiva (como SQuAD)…', opts: ['Devuelve un fragmento (comienzo y fin) de un pasaje que contiene la respuesta', 'Genera siempre texto libre', 'Solo responde sí o no', 'No usa pasajes'], ok: 0, fb: 'El modelo predice la posición inicial y final; los generativos redactan la respuesta, a veces con RAG.', lvl: 2 },
    { q: 'La evolución de la traducción automática pasó por…', opts: ['Reglas → estadística de frases → redes con atención → Transformer → modelos grandes', 'Solo reglas', 'Solo diccionarios', 'Solo modelos de n-gramas'], ok: 0, fb: 'Cada salto mejoró la fluidez; la evaluación sigue usando BLEU, chrF y COMET, además de humanos.', lvl: 1 }
  ]);
})();
