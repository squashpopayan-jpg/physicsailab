/* Capítulo 1 — Qué es el PLN */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, el = NL.el;

  /* ---------- Qué conocimiento necesita cada aplicación ---------- */
  const NIV = ['Fonética y fonología', 'Morfología', 'Sintaxis', 'Semántica', 'Pragmática', 'Discurso'];
  const APPS = {
    agente: { t: 'Agente conversacional con voz', lv: [2, 2, 2, 2, 2, 2], why: ['Reconoce palabras en el audio y produce voz', 'Reconoce y genera variantes de palabras («puertas»)', 'Ordena y agrupa palabras para entender y responder', 'Necesita el sentido de palabras y de sus combinaciones', 'Decide si es pregunta, orden o enunciado y el tono de la respuesta', 'Resuelve pronombres que remiten a turnos anteriores'] },
    chat: { t: 'Chatbot de texto', lv: [0, 2, 2, 2, 2, 2], why: ['No procesa sonido', 'Variantes de palabras y errores de escritura', 'Estructura de la pregunta del usuario', 'Sentido de lo que se pregunta', 'Intención del usuario y registro de la respuesta', 'Mantiene el estado y las referencias de la conversación'] },
    traduccion: { t: 'Traducción automática de texto', lv: [0, 2, 2, 2, 1, 1], why: ['No procesa sonido', 'Flexión distinta en cada lengua', 'El orden de palabras cambia entre idiomas', 'Desambiguar el sentido para elegir la palabra correcta', 'Registro y modismos', 'Concordancia y pronombres entre oraciones'] },
    qa: { t: 'Búsqueda de respuestas', lv: [0, 1, 2, 2, 1, 2], why: ['No procesa sonido', 'Normalizar formas de palabras', 'Detectar qué se pide y dónde está en el texto', 'Comparar el significado de pregunta y pasaje', 'Entender lo que se quiere saber realmente', 'Combinar información de varias oraciones'] },
    ortografia: { t: 'Corrector ortográfico', lv: [0, 2, 1, 0, 0, 0], why: ['No procesa sonido', 'Forma de las palabras y su grafía', 'Detectar errores que dependen de la gramática («aya» frente a «haya»)', '—', '—', '—'] },
    resumen: { t: 'Resumen automático', lv: [0, 1, 1, 2, 1, 2], why: ['No procesa sonido', 'Normalizar términos', 'Delimitar oraciones y frases importantes', 'Identificar lo central del contenido', 'Qué es relevante para el lector', 'Coherencia entre oraciones y referencias'] },
    voz: { t: 'Reconocimiento de voz', lv: [2, 2, 1, 1, 0, 0], why: ['Convertir la señal acústica en sonidos y palabras', 'Vocabulario y variantes de palabras', 'Un modelo de lenguaje descarta secuencias imposibles', 'Elegir entre palabras que suenan igual («tubo»/«tuvo»)', '—', '—'] },
    opiniones: { t: 'Análisis de opiniones', lv: [0, 1, 1, 2, 2, 1], why: ['No procesa sonido', 'Variantes y emoticonos', 'Alcance de la negación («no es malo»)', 'Polaridad de las palabras', 'Ironía y sarcasmo', 'Opiniones que cambian a lo largo del texto'] }
  };
  NL.defineSim('conocimientos', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Aplicación');
    sim.select('app', { label: 'Aplicación', options: Object.keys(APPS).map((k) => [k, APPS[k].t]), value: 'agente' });
    sim.out('n', 'Niveles necesarios', { hl: true });
    sim.onDraw(() => {
      const a = APPS[sim.p.app];
      box.innerHTML = `<b>${a.t}</b><div class="tc-bars" style="margin-top:10px">` + a.lv.map((v, i) => `<div class="tc-bar" style="grid-template-columns:minmax(9em,13em) 1fr"><span>${NIV[i]}</span><span style="display:flex;gap:8px;align-items:center"><i style="flex:0 0 90px"><s class="${v === 2 ? 'hi' : v === 1 ? 'mid' : 'low'}" style="width:${v * 50}%;${v === 0 ? 'width:4%;background:var(--surface-3)' : ''}"></s></i><small style="color:var(--ink-3)">${a.why[i]}</small></span></div>`).join('') + '</div>';
      sim.set('n', `${a.lv.filter((v) => v > 0).length} de 6`);
    });
  });

  /* ---------- Ambigüedad ---------- */
  const AMB = {
    lexica: { t: 'Léxica', s: 'El banco no abre los domingos.', r: [['banco = entidad financiera', 'Contexto: se habla de horarios de atención de una sucursal.'], ['banco = asiento de un parque', 'Contexto: se habla de un parque; «abrir» sería raro para un asiento, de modo que esta lectura es poco probable.'], ['banco = conjunto de peces', 'Muy poco probable con «abre».']] },
    estructural: { t: 'Estructural', s: 'Vi al hombre con el telescopio.', r: [['«con el telescopio» modifica a «vi»: usé el telescopio para ver', 'Árbol: [vi [al hombre] [con el telescopio]]'], ['«con el telescopio» modifica a «el hombre»: el hombre tenía el telescopio', 'Árbol: [vi [al hombre [con el telescopio]]]']] },
    referencial: { t: 'Referencial', s: 'María le dijo a Ana que ella había ganado.', r: [['ella = María', 'María contó su propio triunfo.'], ['ella = Ana', 'María avisó a Ana de que Ana ganó.'], ['ella = una tercera persona', 'Posible si el discurso anterior la presentó.']] },
    pragmatica: { t: 'Pragmática', s: '¿Puede pasarme la sal?', r: [['pregunta por la capacidad de pasar la sal', 'Lectura literal: respuesta «sí».'], ['petición cortés: «pásame la sal»', 'Lectura intencional: es un acto de habla indirecto; la respuesta esperada es la acción.']] },
    morfo: { t: 'Morfosintáctica', s: 'Vino el vino.', r: [['«Vino» (1.ª palabra) = verbo venir; «vino» (2.ª) = sustantivo', 'Es la lectura natural: llegó la bebida.'], ['ambas = sustantivo', 'Agramatical: falta un verbo.'], ['ambas = verbo', 'Agramatical: falta un sujeto y un artículo no admite verbo.']] }
  };
  NL.defineSim('ambiguedad', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Tipo de ambigüedad');
    sim.seg('tipo', { label: null, options: Object.keys(AMB).map((k) => [k, AMB[k].t]), value: 'lexica' });
    sim.out('n', 'Lecturas', { hl: true });
    sim.onDraw(() => {
      const a = AMB[sim.p.tipo];
      box.innerHTML = `<div class="mono-box" style="font-size:15px;margin-bottom:8px">${a.s}</div>` + a.r.map(([r, c], i) => `<div style="margin:6px 0;padding:6px 10px;border-left:3px solid var(--k${i % 5});background:var(--surface-2);border-radius:0 5px 5px 0"><b>Lectura ${i + 1}.</b> ${r}<br><small style="color:var(--ink-3)">${c}</small></div>`).join('');
      sim.set('n', String(a.r.length));
    });
  });

  /* ---------- Catalan ---------- */
  NL.defineSim('catalan', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Número de análisis de una oración frente al número de sintagmas preposicionales' });
    sim.group('Oración');
    sim.slider('n', { label: 'Sintagmas preposicionales (n)', min: 0, max: 14, step: 1, value: 3, fmt: (v) => String(v) });
    sim.out('c', 'Análisis posibles', { hl: true });
    sim.out('f', 'Por fórmula de Catalan');
    sim.out('f2', 'Cociente con n − 1');
    sim.onDraw(() => {
      const n = sim.p.n;
      const dp = L.ambig.countTrees(n), cat = L.ambig.parsesPP(n);
      sim.set('c', dp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
      sim.set('f', cat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (dp === cat ? ' ✓' : ' ✗'));
      sim.set('f2', n ? NL.fix(Number(dp) / Number(L.ambig.countTrees(n - 1)), 2) : '—');
      NL.draw.clear(cv);
      const xs = [], ys = [];
      for (let k = 0; k <= 14; k++) { xs.push(k); ys.push(Number(L.ambig.parsesPP(k))); }
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 14, ymin: 1, ymax: 1e8, ylog: true, xlabel: 'sintagmas preposicionales (n)', ylabel: 'análisis', mb: 32 });
      pl.frame();
      pl.xy(xs, ys, { color: '--c1', width: 2.2 });
      pl.dot(n, Number(dp), { color: '--c2', r: 6 });
      pl.label(n, Number(dp) * 3, NL.nf(Number(dp)), { color: '--c2', size: 12 });
    });
  });

  /* ---------- Banco de preguntas ---------- */
  NL.bank.add('que-es-pln', [
    { q: 'Un programa cuenta bytes, palabras separadas por espacios y líneas de un archivo. ¿Es PLN?', opts: ['Sí, porque procesa texto', 'No: es procesamiento de datos; no usa conocimiento del lenguaje', 'Sí, porque cuenta palabras', 'Solo si el archivo está en español'], ok: 1, fb: 'Para ser PLN debe usar conocimiento del lenguaje. Contar pronombres, en cambio, exige saber qué es una palabra y un pronombre.', lvl: 1 },
    { q: '¿Cuántos conocimientos del lenguaje distingue el curso?', opts: ['Tres: sonido, forma y significado', 'Seis: fonética y fonología, morfología, sintaxis, semántica, pragmática y discurso', 'Cuatro: léxico, sintaxis, semántica y pragmática', 'Dos: gramática y vocabulario'], ok: 1, fb: 'Son seis, de lo más cercano al sonido a lo más cercano al uso.', lvl: 1 },
    { q: '¿Qué conocimiento permite decidir que «¿Puede pasarme la sal?» es una petición y no una pregunta sobre capacidad?', opts: ['Morfología', 'Sintaxis', 'Pragmática', 'Fonología'], ok: 2, fb: 'La pragmática relaciona el significado con las intenciones y el contexto.', lvl: 2 },
    { q: 'En «María le dijo a Ana que ella había ganado», ¿qué ambigüedad hay?', opts: ['Léxica', 'Estructural', 'Referencial', 'Morfosintáctica'], ok: 2, fb: '«Ella» puede referirse a María, a Ana o a otra persona: es un problema de referencia en el discurso.', lvl: 2 },
    { q: '«Vi al hombre con el telescopio» tiene dos lecturas porque…', opts: ['«Telescopio» tiene dos sentidos', '«Con el telescopio» puede colgar del verbo o del sustantivo', '«Vi» puede ser verbo o sustantivo', 'Falta un pronombre'], ok: 1, fb: 'Es ambigüedad estructural: el mismo sintagma preposicional puede unirse a distintos núcleos.', lvl: 2 },
    { q: '¿Cuántos análisis tiene «V + SN + 3 sintagmas preposicionales» con la gramática del capítulo?', num: 14, tol: 0, fb: 'Con n sintagmas hay \\(C_{n+1}\\); para n = 3 es \\(C_4=14\\).', lvl: 3 },
    { q: '¿Cuántos análisis tiene «V + SN + 1 sintagma preposicional»?', num: 2, tol: 0, fb: '\\(C_2=2\\): el sintagma cuelga del verbo o del sustantivo.', lvl: 3 },
    { q: 'El módulo de etiquetado confunde «vino» (verbo) con «vino» (sustantivo). ¿Qué ocurre en una cadena clásica de módulos?', opts: ['Nada: cada módulo corrige al anterior', 'El analizador sintáctico recibe una entrada errónea y el error se propaga', 'Solo se afecta la tokenización', 'El sistema se detiene sin dar resultado'], ok: 1, fb: 'Los errores se heredan a lo largo de la cadena; por eso los modelos modernos aprenden varias capas a la vez.', lvl: 2 },
    { q: 'Para un corrector ortográfico, ¿qué nivel pesa más?', opts: ['Discurso', 'Morfología y léxico (forma de las palabras)', 'Pragmática', 'Fonética acústica'], ok: 1, fb: 'El corrector trabaja sobre la forma de las palabras y su grafía; los errores que dependen de la gramática exigen además algo de sintaxis.', lvl: 2 }
  ]);
})();
