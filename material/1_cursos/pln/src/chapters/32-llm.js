/* Capítulo 32 — Grandes modelos de lenguaje: uso, recuperación y evaluación */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, M = L.lm, V = L.vec, E = L.ev;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let KN = null;
  const kn = () => KN || (KN = M.ajustar(L.corpus.lm.train, 3));
  const MEMO = new Map();
  const distDe = (hist) => {
    const clave = hist.slice(-2).join(' ');
    if (!MEMO.has(clave)) {
      const d = M.distribucion(kn(), hist, { metodo: 'kn', orden: 3, d: 0.75 }).filter((x) => x[0] !== M.U && x[0] !== M.S).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
      const tot = d.reduce((a, x) => a + x[1], 0); MEMO.set(clave, d.map(([w, q]) => [w, q / tot]));
    }
    return MEMO.get(clave);
  };

  /* ---- 1. Decodificación: cómo se elige la siguiente palabra ---- */
  const filtra = (dist, met, p) => {
    /* dist: [[palabra, prob]] ordenado de mayor a menor. Devuelve las que quedan, renormalizadas, con la temperatura ya aplicada */
    let d = dist.map(([w, q]) => [w, Math.pow(q, 1 / p.T)]);
    const s0 = d.reduce((a, x) => a + x[1], 0); d = d.map(([w, q]) => [w, q / s0]);
    if (met === 'topk') d = d.slice(0, p.k);
    else if (met === 'topp') { let c = 0; const out = []; for (const x of d) { out.push(x); c += x[1]; if (c >= p.p) break; } d = out; }
    else if (met === 'voraz') d = d.slice(0, 1);
    const s = d.reduce((a, x) => a + x[1], 0); return d.map(([w, q]) => [w, q / s]);
  };
  NL.defineSim('decodificacion', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    let semilla = 3;
    sim.group('Contexto');
    sim.text('t', { label: 'Comienzo de la frase', value: 'el presidente del' });
    sim.group('Estrategia');
    sim.select('m', { label: 'Decodificación', options: [['voraz', 'Voraz (siempre la más probable)'], ['muestreo', 'Muestreo con temperatura'], ['topk', 'Top-k'], ['topp', 'Top-p (núcleo)']], value: 'topp' });
    sim.slider('T', { label: 'Temperatura T', min: 0.2, max: 2.5, step: 0.1, value: 1, fmt: (v) => NL.fix(v, 1) });
    sim.slider('k', { label: 'k (top-k)', min: 1, max: 50, step: 1, value: 10, fmt: (v) => String(v) });
    sim.slider('p', { label: 'p (top-p)', min: 0.1, max: 1, step: 0.05, value: 0.9, fmt: (v) => NL.fix(v, 2) });
    sim.button('Generar 5 frases', () => { semilla += 11; }, { primary: true });
    sim.out('n', 'Palabras candidatas que quedan', { hl: true });
    sim.out('e', 'Entropía de la distribución original (bits)');
    sim.onDraw(() => {
      const mod = kn(), ws = M.mapear(mod, (sim.p.t.toLowerCase().match(/[a-záéíóúüñ]+/g) || []).join(' ')), h = [M.S, M.S].concat(ws);
      const norm = distDe(h);
      const ent = -norm.reduce((a, [, q]) => a + (q > 0 ? q * Math.log2(q) : 0), 0);
      const par = { T: sim.p.T, k: sim.p.k, p: sim.p.p }, f = filtra(norm, sim.p.m, par);
      sim.set('n', `${f.length} de ${norm.length}`); sim.set('e', NL.fix(ent, 2));
      const mx = Math.max(f[0][1], norm[0][1]);
      const barras = f.slice(0, 12).map(([w, q]) => `<tr><td style="text-align:left">${esc(w)}</td><td>${NL.fix(q, 3)}</td><td style="text-align:left"><span style="display:inline-block;height:9px;width:${Math.round(160 * q / mx)}px;background:var(--c2,#e07b39);border-radius:2px"></span></td></tr>`).join('');
      /* generar frases con la estrategia */
      let rs = semilla; const rng = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
      const frases = [];
      for (let i = 0; i < 5; i++) {
        const hist = [M.S, M.S].concat(ws), sal = ws.slice();
        for (let t = 0; t < 14; t++) {
          const d = filtra(distDe(hist), sim.p.m, par);
          let u = rng(), w = d[d.length - 1][0]; for (const [x, q] of d) { u -= q; if (u <= 0) { w = x; break; } }
          if (w === M.E) break; sal.push(w); hist.push(w);
        }
        frases.push(sal.join(' '));
      }
      box.innerHTML = `<small style="color:var(--ink-3)">Distribución de la siguiente palabra tras «${esc(ws.join(' ') || '…')}» después de aplicar la estrategia (renormalizada); se muestran las 12 primeras</small>` +
        `<table class="mx"><tbody>${barras}</tbody></table>` +
        `<small style="color:var(--ink-3)">Cinco frases generadas con esta estrategia (trigrama de Kneser–Ney del capítulo 25)</small><ol style="margin:2px 0 0;padding-left:1.4em;font-size:13px">${frases.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
    });
  });

  /* ---- 2. Recuperación para generación aumentada (RAG) ---- */
  let IDX = null;
  const indice = () => IDX || (IDX = (() => { const docs = L.corpus.lm.train; const m = V.ajustar(docs, { n: [1, 1], vacias: new Set('a al algo como con de del el en es esta este la las lo los me mi muy no para pero por que se si su un una y ya fue sobre'.split(' ')) }); return { docs, m, vs: docs.map((d) => V.tfidf(m, V.contar(m, d))) }; })());
  NL.defineSim('rag-mini', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Pregunta');
    sim.text('q', { label: 'Pregunta o consulta', value: 'qué dijo el presidente del gobierno sobre la economía' });
    sim.slider('k', { label: 'Pasajes que se recuperan (k)', min: 1, max: 6, step: 1, value: 3, fmt: (v) => String(v) });
    sim.out('s', 'Mejor coseno', { hl: true });
    sim.onDraw(() => {
      const { docs, m, vs } = indice(), q = V.tfidf(m, V.contar(m, sim.p.q));
      const rank = vs.map((v, i) => [i, V.coseno(q, v)]).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, sim.p.k);
      sim.set('s', NL.fix(rank[0][1], 3));
      const pas = rank.filter((x) => x[1] > 0).map(([i]) => docs[i]);
      const prompt = `Responde a la pregunta usando solo el contexto.\n\nContexto:\n${pas.map((x, i) => `[${i + 1}] ${x}`).join('\n') || '(sin pasajes relevantes)'}\n\nPregunta: ${sim.p.q}\nRespuesta:`;
      box.innerHTML = `<table class="mx"><thead><tr><th>#</th><th>Coseno</th><th style="text-align:left">Pasaje recuperado (corpus de 2.400 oraciones de noticias)</th></tr></thead><tbody>${rank.map(([i, c], k) => `<tr class="${k === 0 ? 'hl' : ''}"><td>${k + 1}</td><td>${NL.fix(c, 3)}</td><td style="text-align:left;white-space:normal;font-size:12.5px">${esc(docs[i])}</td></tr>`).join('')}</tbody></table>` +
        `<small style="color:var(--ink-3)">Mensaje que se enviaría al modelo de lenguaje: los pasajes más cercanos se pegan en el contexto, delante de la pregunta</small><div class="mono-box" style="font-size:12px;white-space:pre-wrap">${esc(prompt)}</div>` +
        `<small style="color:var(--ink-3)">Esta recuperación usa TF-IDF y coseno (capítulo 24). En un sistema real se usan embeddings densos o BM25, y el modelo redacta la respuesta citando los pasajes.</small>`;
    });
  });

  /* ---- 3. BLEU y ROUGE ---- */
  const EJ = [
    ['el gobierno anunció una nueva política económica para el país', 'el gobierno anunció una nueva política económica para el país', 'Idéntica'],
    ['el gobierno anunció una nueva política económica para el país', 'una nueva política económica para el país fue anunciada por el gobierno', 'Reordenada (voz pasiva)'],
    ['el gobierno anunció una nueva política económica para el país', 'el ejecutivo presentó un nuevo plan económico para la nación', 'Sinónimos'],
    ['el gobierno anunció una nueva política económica para el país', 'el gobierno anunció una política', 'Demasiado corta'],
    ['el gobierno anunció una nueva política económica para el país', 'país país país país país país', 'Repetición de una palabra']
  ];
  NL.defineSim('bleu-rouge', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Textos');
    sim.select('e', { label: 'Ejemplo', options: EJ.map((x, i) => [String(i), x[2]]), value: '1', onInput: () => { sim.ctl.r.set(EJ[+sim.p.e][0], true); sim.ctl.h.set(EJ[+sim.p.e][1], true); } });
    sim.text('r', { label: 'Referencia (la traducción o el resumen correctos)', value: EJ[1][0] });
    sim.text('h', { label: 'Candidata (la salida del sistema)', value: EJ[1][1] });
    sim.out('b', 'BLEU de oración (0–100)', { hl: true });
    sim.onDraw(() => {
      const r = sim.p.r, h = sim.p.h, b = E.bleuOracion(h, r), g = E.rouge(h, r, { sinTildes: true });
      sim.set('b', NL.fix(b.puntaje, 1));
      const fila = (n, x) => `<tr><td style="text-align:left">${n}</td><td>${NL.fix(x.p, 3)}</td><td>${NL.fix(x.r, 3)}</td><td class="hl">${NL.fix(x.f, 3)}</td></tr>`;
      box.innerHTML = `<table class="mx"><thead><tr><th style="text-align:left">BLEU: n-gramas de la candidata</th><th>Aciertos</th><th>Totales</th><th>Precisión</th></tr></thead><tbody>${[0, 1, 2, 3].map((n) => `<tr><td style="text-align:left">${n + 1}-gramas</td><td>${b.aciertos[n]}</td><td>${b.totales[n]}</td><td>${NL.fix(b.precisiones[n] / 100, 3)}</td></tr>`).join('')}</tbody></table>` +
        `<p style="margin:4px 0 8px;font-size:12.5px">Longitud de la candidata ${b.c}, de la referencia ${b.r}: penalización por brevedad BP = <b>${NL.fix(b.bp, 3)}</b>. BLEU = BP · exp(media de log precisiones) con suavizado exponencial.</p>` +
        `<table class="mx"><thead><tr><th style="text-align:left">ROUGE</th><th>Precisión</th><th>Cobertura</th><th>F1</th></tr></thead><tbody>${fila('ROUGE-1 (palabras)', g.r1)}${fila('ROUGE-2 (pares)', g.r2)}${fila('ROUGE-L (subsecuencia común más larga)', g.rl)}</tbody></table>` +
        `<small style="color:var(--ink-3)">BLEU se centra en la precisión de la candidata (lo que dice está en la referencia); ROUGE, en la cobertura (lo de la referencia está en lo que dice). Ninguno entiende el significado: «sinónimos» recibe cero en ambos.</small>`;
    });
  });

  NL.bank.add('llm', [
    { q: 'El proceso habitual para obtener un asistente conversacional es…', opts: ['Preentrenamiento sobre texto masivo → ajuste fino con instrucciones → alineamiento con preferencias humanas', 'Solo reglas escritas a mano', 'Entrenar con un único ejemplo', 'Usar solo un diccionario'], ok: 0, fb: 'Cada fase usa un objetivo y unos datos distintos: predecir la palabra siguiente, seguir instrucciones, preferir respuestas que la gente valora.', lvl: 1 },
    { q: 'El ajuste fino con instrucciones (instruction tuning) entrena el modelo con…', opts: ['Pares de instrucción y respuesta deseada', 'Solo texto sin etiquetar', 'Imágenes', 'Árboles sintácticos'], ok: 0, fb: 'Convierte un modelo que continúa texto en uno que sigue órdenes.', lvl: 1 },
    { q: 'En el aprendizaje por refuerzo con retroalimentación humana (RLHF), un modelo de recompensa se entrena a partir de…', opts: ['Comparaciones de personas entre pares de respuestas', 'Un diccionario', 'La perplejidad', 'La longitud de la respuesta'], ok: 0, fb: 'Después se optimiza el modelo de lenguaje para maximizar esa recompensa, sin alejarse demasiado del modelo original.', lvl: 2 },
    { q: 'Con una temperatura T → 0 en el muestreo…', opts: ['La decodificación se acerca a la voraz (siempre la palabra más probable)', 'La salida es más aleatoria', 'Se eliminan los tokens', 'No cambia nada'], ok: 0, fb: 'Las probabilidades se elevan a 1/T: con T pequeño se concentran en el máximo; con T grande se uniforman.', lvl: 2 },
    { q: 'El muestreo top-p (núcleo) con p = 0,9…', opts: ['Elige entre el conjunto más pequeño de palabras cuya probabilidad acumulada llega al 90 %', 'Elige siempre entre 9 palabras', 'Descarta el 90 % del vocabulario', 'Es igual que top-k'], ok: 0, fb: 'Se adapta al contexto: pocas candidatas si el modelo está seguro, muchas si duda.', lvl: 2 },
    { q: 'Un modelo de lenguaje «alucina» cuando…', opts: ['Genera texto fluido pero falso o sin respaldo en sus datos', 'No genera nada', 'Repite la pregunta', 'Usa un vocabulario pequeño'], ok: 0, fb: 'Optimiza la plausibilidad del texto, no su verdad; la recuperación de fuentes (RAG) y la verificación reducen el problema.', lvl: 1 },
    { q: 'En la generación aumentada con recuperación (RAG), antes de generar se…', opts: ['Buscan pasajes relevantes en una colección y se incluyen en el mensaje que recibe el modelo', 'Entrena de nuevo el modelo', 'Traduce la pregunta', 'Borra el contexto'], ok: 0, fb: 'Permite respuestas actualizadas y con fuentes sin reentrenar el modelo.', lvl: 1 },
    { q: 'Una candidata tiene 6 de 10 unigramas en la referencia, y la referencia tiene 12 palabras. ¿Cuánto vale la precisión de unigramas de BLEU?', num: 0.6, tol: 0.001, fb: 'Precisión = 6/10 = 0,6 (aciertos entre palabras de la candidata). La cobertura de ROUGE-1 sería 6/12 = 0,5.', lvl: 2 },
    { q: 'La penalización por brevedad de BLEU evita que…', opts: ['Una candidata muy corta obtenga precisión alta por decir muy poco', 'Las frases sean largas', 'Se repitan palabras', 'Se usen sinónimos'], ok: 0, fb: 'BP = exp(1 − r/c) si la candidata (c) es más corta que la referencia (r).', lvl: 2 },
    { q: 'Una limitación común de BLEU y ROUGE es que…', opts: ['Comparan formas de superficie: una paráfrasis correcta puede puntuar casi cero', 'Solo sirven con español', 'Dependen del tamaño del modelo', 'No se pueden calcular'], ok: 0, fb: 'Por eso se complementan con métricas basadas en embeddings (BERTScore, COMET) y con evaluación humana o por modelos.', lvl: 2 }
  ]);
})();
