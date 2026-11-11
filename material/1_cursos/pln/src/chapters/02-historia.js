/* Capítulo 2 — Historia y paradigmas */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, el = NL.el;

  /* ---------- Aproximaciones de Shannon ---------- */
  NL.defineSim('shannon', function (sim) {
    const cv = sim.canvas({ aspect: 2.3, label: 'Entropía condicional por carácter frente al orden del modelo' });
    const box = sim.html('pad');
    sim.group('Modelo de caracteres');
    sim.slider('k', { label: 'Orden k (caracteres de contexto)', min: 0, max: 5, step: 1, value: 2, fmt: (v) => String(v) });
    sim.slider('len', { label: 'Longitud del texto generado', min: 40, max: 400, step: 20, value: 160, fmt: (v) => String(v) });
    let seed = 11;
    sim.button('Regenerar', () => { seed += 7; });
    sim.out('h', 'Entropía condicional H', { hl: true });
    sim.out('ctx', 'Contextos distintos');
    sim.out('n', 'Caracteres del corpus');
    const H = [0, 1, 2, 3, 4, 5].map((k) => L.markov.entropia(L.corpus.texto, k));
    const mods = {};
    sim.onDraw(() => {
      const k = sim.p.k;
      const mod = mods[k] || (mods[k] = L.markov.fit(L.corpus.texto, k));
      sim.set('h', NL.fix(H[k], 3) + ' bits/car.');
      sim.set('ctx', String(mod.m.size));
      sim.set('n', String(mod.s.length));
      box.innerHTML = '<small style="color:var(--ink-3)">Texto generado con orden ' + k + ':</small><div class="mono-box" style="white-space:pre-wrap;margin-top:4px">' + L.markov.generar(mod, sim.p.len, L.rng(seed + k)).replace(/</g, '&lt;') + '</div>';
      NL.draw.clear(cv);
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.3, xmax: 5.3, ymin: 0, ymax: 4.5, xlabel: 'orden k', ylabel: 'H (bits por carácter)', mb: 34, xticks: [0, 1, 2, 3, 4, 5] });
      pl.frame();
      pl.hline(Math.log2(27), { color: '--ink-3', label: 'máximo log₂27', labelRight: true });
      pl.xy([0, 1, 2, 3, 4, 5], H, { color: '--c1', width: 2.2 });
      [0, 1, 2, 3, 4, 5].forEach((x) => pl.dot(x, H[x], { color: x === k ? '--c2' : '--c1', r: x === k ? 6 : 3.5 }));
    });
  });

  /* ---------- ELIZA ---------- */
  NL.defineSim('eliza', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const log = el('div', 'mono-box');
    log.style.whiteSpace = 'pre-wrap'; log.style.minHeight = '8em';
    box.append(log);
    sim.group('Conversación');
    const inp = sim.text('msg', { label: 'Su frase', value: '', placeholder: 'Escriba y pulse Enviar' });
    let n = 0;
    const add = (who, t, extra) => { log.insertAdjacentHTML('beforeend', `<b>${who}</b> ${t.replace(/</g, '&lt;')}${extra ? ` <small style="color:var(--ink-3)">[${extra}]</small>` : ''}\n`); log.scrollTop = log.scrollHeight; };
    const send = () => {
      const t = (sim.p.msg || '').trim();
      if (!t) return;
      const r = L.markov.eliza(t, n++);
      add('Usted:', t);
      add('ELIZA:', r.respuesta, r.regla >= 0 ? 'regla ' + (r.regla + 1) + ': ' + L.markov.REGLAS[r.regla].k.source.slice(0, 40) : 'sin regla: respuesta de relleno');
      inp.set('', true); inp.input.value = '';
    };
    inp.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    sim.button('Enviar', send, { primary: true });
    sim.button('Vaciar', () => { log.innerHTML = ''; n = 0; });
    sim.note('Las reglas son las 10 del código; ELIZA solo reconoce palabras clave y no entiende el resto.');
    add('ELIZA:', 'Hola. ¿Qué le preocupa hoy?');
  });

  /* ---------- Línea de tiempo ---------- */
  const EV = [
    [1936, 'Turing: números computables', 0], [1943, 'McCulloch y Pitts: neurona lógica', 2], [1948, 'Shannon: teoría de la información', 1], [1951, 'Kleene: expresiones regulares', 0],
    [1956, 'Chomsky: gramáticas; Dartmouth: «IA»', 0], [1963, 'Brown Corpus (1 millón de palabras)', 1], [1966, 'ELIZA', 0], [1972, 'SHRDLU', 0], [1980, 'DCG en Prolog', 0],
    [1990, 'Modelos de n-gramas y HMM dominan', 1], [1993, 'Penn Treebank', 1], [2001, 'CRF y SVM para etiquetar', 1], [2006, 'Deep learning (Hinton)', 2], [2013, 'Word2Vec', 2],
    [2014, 'Seq2seq y atención', 2], [2017, 'Transformer', 2], [2018, 'BERT y GPT', 2], [2022, 'Asistentes basados en LLM', 2]
  ];
  /* Intensidad de cada corriente por año [año, simbólica, estadística, neuronal] */
  const INT = [[1940, 0.8, 0.5, 0.3], [1957, 0.9, 0.4, 0.2], [1970, 1.0, 0.25, 0.1], [1983, 0.7, 0.6, 0.1], [1993, 0.4, 1.0, 0.1], [2006, 0.25, 1.0, 0.3], [2013, 0.15, 0.7, 0.8], [2018, 0.1, 0.4, 1.0], [2025, 0.15, 0.3, 1.0]];
  const intens = (y, c) => { for (let i = 0; i + 1 < INT.length; i++) if (y >= INT[i][0] && y <= INT[i + 1][0]) { const t = (y - INT[i][0]) / (INT[i + 1][0] - INT[i][0]); return INT[i][c] + t * (INT[i + 1][c] - INT[i][c]); } return INT[INT.length - 1][c]; };
  NL.defineSim('linea-tiempo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Intensidad relativa de las corrientes simbólica, estadística y neuronal entre 1940 y 2025' });
    sim.group('Año');
    sim.slider('y', { label: 'Año', min: 1940, max: 2025, step: 1, value: 1966, fmt: (v) => String(v) });
    sim.out('s', 'Simbólica');
    sim.out('e', 'Estadística');
    sim.out('r', 'Neuronal');
    sim.out('ev', 'Hitos cercanos', { wide: true });
    const NAME = ['Simbólica (reglas, lógica, gramáticas)', 'Estadística (probabilidad, corpus)', 'Neuronal (redes, preentrenamiento)'];
    const COL = ['--c1', '--c2', '--c3'];
    sim.onDraw(() => {
      const y = sim.p.y;
      NL.draw.clear(cv);
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1940, xmax: 2025, ymin: 0, ymax: 1.15, xlabel: 'año', ylabel: 'dominio relativo (cualitativo)', mb: 34, yticks: [] });
      pl.frame();
      const xs = []; for (let a = 1940; a <= 2025; a++) xs.push(a);
      for (let c = 0; c < 3; c++) { pl.xy(xs, xs.map((a) => intens(a, c + 1)), { color: COL[c], width: 2.3 }); }
      pl.vline(y, { color: '--ink-2', dash: [4, 3] });
      EV.forEach(([a, , c]) => pl.dot(a, intens(a, c + 1), { color: COL[c], r: Math.abs(a - y) <= 6 ? 6 : 3 }));
      pl.legend(NAME.map((n, i) => ({ label: n, color: COL[i] })), 'tl');
      sim.set('s', NL.fix(intens(y, 1), 2)); sim.set('e', NL.fix(intens(y, 2), 2)); sim.set('r', NL.fix(intens(y, 3), 2));
      const near = EV.filter(([a]) => Math.abs(a - y) <= 6).map(([a, n]) => `${a}: ${n}`);
      sim.set('ev', near.length ? near.join('<br>') : 'ninguno en ±6 años');
    });
  });

  NL.bank.add('historia', [
    { q: '¿Cuál de estos es un paradigma fundacional del PLN en las décadas de 1940 y 1950?', opts: ['Los transformadores', 'Los autómatas finitos y la teoría de la información', 'Los grandes modelos de lenguaje', 'La web semántica'], ok: 1, fb: 'Turing, Kleene y Chomsky dan los autómatas y lenguajes formales; Shannon, la teoría de la información y los modelos probabilísticos.', lvl: 1 },
    { q: '¿Qué aportó Shannon al estudio del lenguaje?', opts: ['El análisis sintáctico descendente', 'La entropía como medida de información y los modelos de Markov del lenguaje', 'El primer corpus anotado', 'Las gramáticas de dependencias'], ok: 1, fb: 'Shannon (1948) usó cadenas de Markov y la entropía para estudiar la información de un idioma.', lvl: 1 },
    { q: 'El Brown Corpus (1963) es notable porque…', opts: ['Fue el primer modelo neuronal', 'Reunía un millón de palabras de 500 textos de géneros distintos, uno de los primeros corpus electrónicos', 'Contenía solo diálogos de un robot', 'Anotaba el significado de cada palabra'], ok: 1, fb: 'Era un corpus del inglés americano balanceado por géneros, base de investigación empírica.', lvl: 1 },
    { q: 'SHRDLU (Winograd, 1972) pertenece al paradigma de…', opts: ['Estocástico', 'Comprensión del lenguaje natural', 'Modelado del discurso', 'Aprendizaje no supervisado'], ok: 1, fb: 'Simulaba un robot que movía bloques obedeciendo órdenes en lenguaje natural.', lvl: 2 },
    { q: '¿Por qué ELIZA se considera un sistema que «no entiende»?', opts: ['Porque solo funcionaba en inglés', 'Porque aplica plantillas a palabras clave sin representar el significado', 'Porque usaba redes neuronales', 'Porque no tenía pantalla'], ok: 1, fb: 'ELIZA refleja pronombres y rellena plantillas; el efecto de comprensión lo pone el usuario.', lvl: 2 },
    { q: 'En el modelo de caracteres de la simulación, la entropía condicional baja de 4,03 a 0,30 bits al pasar de orden 0 a orden 5. ¿Qué explica sobre todo esa caída?', opts: ['El español tiene muy poca información por letra', 'El corpus es pequeño y el modelo memoriza: sobreajuste', 'El modelo aprende gramática', 'Se eliminan las vocales'], ok: 1, fb: 'Con 2.820 caracteres y contextos largos casi cada contexto aparece una vez, de modo que la siguiente letra es casi determinista en el corpus.', lvl: 3 },
    { q: '¿Cuál es la entropía máxima por carácter de un alfabeto de 32 símbolos equiprobables (en bits)?', num: 5, tol: 0, unit: 'bits', fb: '\\(\\log_2 32 = 5\\).', lvl: 3 },
    { q: 'A partir de 2000, la disponibilidad de corpus anotados (Penn Treebank, PropBank) llevó a…', opts: ['Abandonar los modelos estadísticos', 'Plantear el análisis sintáctico y semántico como aprendizaje supervisado', 'Eliminar la evaluación', 'Usar solo reglas manuales'], ok: 1, fb: 'Con ejemplos anotados se pueden entrenar y comparar modelos supervisados.', lvl: 2 },
    { q: '¿Qué innovación de 2017 sustituye la recurrencia por atención y es la base de los LLM?', opts: ['Word2Vec', 'El Transformer', 'El HMM', 'La gramática de casos'], ok: 1, fb: 'Vaswani y otros (2017): «Attention is all you need».', lvl: 1 },
    { q: 'El «péndulo» de la historia del PLN se refiere a…', opts: ['La velocidad de los procesadores', 'La alternancia entre enfoques basados en reglas y enfoques basados en datos', 'El orden de los capítulos', 'La disminución de los corpus'], ok: 1, fb: 'Racionalismo (reglas, conocimiento) y empirismo (datos) se alternan según los recursos disponibles.', lvl: 2 }
  ]);
})();
