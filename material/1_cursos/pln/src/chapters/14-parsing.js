/* Capítulo 14 — Estrategias de análisis sintáctico */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, G = L.cfg;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  NL.defineSim('cky', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('f', { label: 'Ejemplos', options: G.ORACIONES.slice(0, 5).map((f) => [f, f]), value: G.ORACIONES[0], onInput: (v) => { t.set(v, true); t.input.value = v; } });
    const t = sim.text('w', { label: 'O escriba una oración', value: G.ORACIONES[0] });
    const sl = sim.slider('L', { label: 'Longitud de span calculada', min: 1, max: 8, step: 1, value: 8, fmt: (v) => String(v) });
    sim.out('n', 'Análisis', { hl: true });
    sim.out('p', 'Combinaciones probadas');
    sim.out('c', 'Celdas llenas');
    const g = G.toy();
    sim.onDraw(() => {
      const ws = (sim.p.w || '').trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 10);
      if (!ws.length) { box.innerHTML = ''; return; }
      const r = G.cky(g, ws), n = ws.length;
      sl.range(1, Math.max(2, n), 1);
      const hasta = Math.min(sim.p.L, n);
      sim.set('n', String(r.cuenta)); sim.set('p', String(r.pasos));
      let llenas = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j <= n; j++) if (r.tabla[i][j].size) llenas++;
      sim.set('c', `${llenas} de ${(n * (n + 1)) / 2}`);
      let h = '<table class="mx" style="width:100%"><thead><tr><th></th>' + ws.map((x, j) => `<th>${j + 1}<br><small>${esc(x)}</small></th>`).join('') + '</tr></thead><tbody>';
      for (let i = 0; i < n; i++) {
        h += `<tr><th style="text-align:left">${i}</th>` + ws.map((_, j0) => {
          const j = j0 + 1;
          if (j <= i) return '<td style="background:var(--surface-2)"></td>';
          if (j - i > hasta) return '<td style="opacity:.25">·</td>';
          const e = r.tabla[i][j];
          const syms = Array.from(e.keys()).filter((s) => s[0] !== '@');
          const top = i === 0 && j === n;
          return `<td class="${top && e.has(g.start) ? 'path hl' : ''}" style="text-align:left;font-size:11px;vertical-align:top">${syms.map((s) => `${s}${e.get(s).cnt > 1 ? `<sup>${e.get(s).cnt}</sup>` : ''}`).join('<br>') || '·'}</td>`;
        }).join('') + '</tr>';
      }
      h += '</tbody></table><p style="font-size:12px;color:var(--ink-3);margin:6px 0 0">Cada celda [i, j] guarda los símbolos que abarcan las palabras i+1 … j. Un superíndice indica el número de formas de obtener ese símbolo (ambigüedad). La celda [0, n] con S contiene todos los análisis de la oración.</p>';
      box.innerHTML = h;
    });
  });

  NL.defineSim('comparar-analizadores', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Trabajo de cada analizador frente al número de sintagmas preposicionales' });
    sim.group('Oración');
    sim.slider('n', { label: 'Sintagmas preposicionales encadenados', min: 0, max: 3, step: 1, value: 3, fmt: (v) => String(v) });
    sim.out('a', 'Análisis (todos coinciden)', { hl: true });
    sim.out('d', 'Descendente (grámatica sin recursión izq.)');
    sim.out('b', 'Ascendente');
    sim.out('c', 'CKY');
    sim.out('e', 'Earley (arcos)');
    const frase = (n) => 'el niño ve un gato'.split(' ').concat(...Array.from({ length: n }, () => ['con', 'un', 'telescopio']));
    const med = (n) => {
      const w = frase(n), g = G.toy(), nr = G.toyNLR();
      const d = G.descendente(nr, w), a = G.ascendente(g, w, { limite: 1500000 }), c = G.cky(g, w), e = G.earley(g, w);
      return { w, d, a, c, e };
    };
    const cache = {};
    sim.onDraw(() => {
      const m = (k) => cache[k] || (cache[k] = med(k));
      const r = m(sim.p.n);
      sim.set('a', String(r.c.cuenta)); sim.set('d', `${NL.nf(r.d.pasos)} expansiones${r.d.cuenta !== r.c.cuenta ? ' (' + r.d.cuenta + ' análisis: gramática distinta)' : ''}`);
      sim.set('b', `${NL.nf(r.a.pasos)} pasos${r.a.truncado ? ' (truncado)' : ''}`); sim.set('c', `${NL.nf(r.c.pasos)} combinaciones`); sim.set('e', `${NL.nf(r.e.items)} elementos`);
      NL.draw.clear(cv);
      const xs = [0, 1, 2, 3], ds = xs.map((k) => m(k));
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.2, xmax: 3.2, ymin: 10, ymax: 5e6, ylog: true, xlabel: 'sintagmas preposicionales (n)', ylabel: 'pasos de trabajo', mb: 34, xticks: xs });
      pl.frame();
      pl.xy(xs, ds.map((x) => Math.max(10, x.d.pasos)), { color: '--c2', width: 2.2 });
      pl.xy(xs, ds.map((x) => Math.max(10, x.a.pasos)), { color: '--c4', width: 2.2 });
      pl.xy(xs, ds.map((x) => x.c.pasos), { color: '--c1', width: 2.6 });
      pl.xy(xs, ds.map((x) => x.e.items), { color: '--c3', width: 2.2 });
      pl.vline(sim.p.n, { color: '--ink-3', dash: [4, 3] });
      pl.legend([{ label: 'descendente', color: '--c2' }, { label: 'ascendente', color: '--c4' }, { label: 'CKY', color: '--c1' }, { label: 'Earley', color: '--c3' }], 'tl');
    });
  });

  NL.bank.add('parsing', [
    { q: 'Un analizador descendente (top-down) parte de…', opts: ['Las palabras y las agrupa hacia arriba', 'El símbolo inicial S y expande reglas hasta casar con las palabras', 'El verbo', 'El final de la oración'], ok: 1, fb: 'Dirigido por objetivos: predice estructura y la comprueba con las palabras.', lvl: 1 },
    { q: 'Un analizador ascendente (bottom-up) parte de…', opts: ['El símbolo inicial', 'Las palabras y las reduce a constituyentes hasta llegar a S', 'La regla más larga', 'Un árbol aleatorio'], ok: 1, fb: 'Dirigido por los datos: desplaza palabras y reduce con las reglas.', lvl: 1 },
    { q: 'La regla SN → SN SP es recursiva por la izquierda. ¿Qué pasa con un analizador descendente ingenuo?', opts: ['Funciona más rápido', 'Entra en un bucle infinito, expandiendo SN indefinidamente', 'Ignora la regla', 'Reduce la ambigüedad'], ok: 1, fb: 'Siempre puede predecir SN → SN SP antes de consumir una palabra. Se evita reescribiendo la gramática.', lvl: 2 },
    { q: '¿Qué forma deben tener las reglas para el algoritmo CKY?', opts: ['Forma normal de Chomsky: A → B C o A → palabra', 'Cualquier regla', 'Solo reglas léxicas', 'Reglas con tres símbolos'], ok: 0, fb: 'Una gramática libre de contexto se convierte a esa forma sin perder poder expresivo.', lvl: 1 },
    { q: '¿Cuál es la complejidad temporal de CKY para una oración de n palabras?', opts: ['O(n)', 'O(n² )', 'O(n³ · |G|)', 'O(2ⁿ)'], ok: 2, fb: 'Hay O(n²) celdas, cada una con O(n) puntos de división, y se prueban las reglas de la gramática.', lvl: 2 },
    { q: 'La tabla de CKY de «yo vi un elefante en mi pijama» tiene en la celda [0, 7] el símbolo S con superíndice 2. ¿Qué indica?', opts: ['Dos palabras', 'Dos análisis distintos (ambigüedad estructural)', 'Una regla repetida', 'Un error'], ok: 1, fb: 'La tabla comparte subárboles y registra cuántas derivaciones hay.', lvl: 2 },
    { q: '¿Por qué la tabla de CKY puede representar 429 análisis sin crecer exponencialmente?', opts: ['Comparte subárboles: cada celda guarda un símbolo una sola vez con sus punteros', 'Descarta análisis', 'Los cuenta mal', 'Usa memoria infinita'], ok: 0, fb: 'La programación dinámica reutiliza los subproblemas ya resueltos.', lvl: 3 },
    { q: 'El algoritmo de Earley tiene tres operaciones. ¿Cuáles?', opts: ['Predicción, escáner y completado', 'Shift, reduce y accept', 'Entrenar, evaluar y probar', 'Leer, escribir y borrar'], ok: 0, fb: 'Predice reglas, consume palabras y completa constituyentes; no necesita la forma normal de Chomsky.', lvl: 2 },
    { q: 'Con n sintagmas preposicionales encadenados, el número de análisis de la oración crece como…', opts: ['Una recta', 'Los números de Catalan', 'Una constante', 'El logaritmo'], ok: 1, fb: '2, 5, 14, 42, 132, 429 para n = 1 a 6, como en el capítulo 1.', lvl: 2 },
    { q: 'En el análisis de «el niño ve un gato con un telescopio en el parque» hay 5 árboles. ¿Cuántos tendría con 6 sintagmas preposicionales (n = 6)?', num: 429, tol: 0, fb: 'C₇ = 429 con la gramática del curso (NLTK da 2, 5, 14, 42, 132, 429 para n = 1 a 6).', lvl: 3 }
  ]);
})();

