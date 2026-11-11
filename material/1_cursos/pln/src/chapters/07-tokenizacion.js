/* Capítulo 7 — Tokenización, stemming y lematización */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, S = L.stem, M = L.morph;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const chips = (arr, cls = '') => `<div class="tk-row">${arr.map((x) => `<span class="tk ${cls}"><span>${esc(x)}</span></span>`).join('')}</div>`;

  const TEXTOS = [
    'El profesor Sr. Pérez pagó $1.234,50 al banco del barrio; escribe a ana@uni.edu.co. ¿Vamos al parque? ¡Sí!',
    'Aprendiendo #PLN con Python: visita https://ejemplo.org/pln el 08/11/2026.',
    'Dámelo ya, piénsalo bien; el teórico-práctico es del jueves.',
    'Los niños señalaron 3,5 casas en Bogotá y 2.500 árboles.'
  ];
  NL.defineSim('tokenizador', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Texto');
    sim.select('t', { label: 'Ejemplo', options: TEXTOS.map((t, i) => [i, t.length > 50 ? t.slice(0, 48) + '…' : t]), value: 0, onInput: (i) => { w.set(TEXTOS[i], true); w.input.value = TEXTOS[i]; } });
    const w = sim.text('w', { label: 'O escriba su texto', value: TEXTOS[0], rows: 3 });
    sim.check('c', { label: 'Separar contracciones (del, al)', value: true });
    sim.out('a', 'split()'); sim.out('b', '\\w+ (ASCII)'); sim.out('c2', '\\p{L}+'); sim.out('d', 'Palabras y signos', { hl: true });
    sim.onDraw(() => {
      const t = sim.p.w || '';
      const a = S.tok.espacios(t), b = S.tok.w(t), c = S.tok.letras(t), d = S.tok.completo(t, sim.p.c);
      sim.set('a', String(a.length)); sim.set('b', String(b.length)); sim.set('c2', String(c.length)); sim.set('d', String(d.length));
      box.innerHTML = [['Separar por espacios', a, ''], ['Clase \\w de JavaScript (solo ASCII)', b, 'bad'], ['Letras Unicode \\p{L}+', c, ''], ['Palabras y signos (completo)', d, 'ok']].map(([n, x, k]) => `<small style="color:var(--ink-3)">${esc(n)} · ${x.length}</small>${chips(x, k)}`).join('');
    });
  });

  NL.defineSim('stemmer', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const ej = ['cantábamos', 'rápidamente', 'estudiándolo', 'universidad', 'universal', 'universo', 'construcciones', 'continuamente', 'actividades', 'paguen', 'vino', 'gatito', 'ciudad'];
    sim.group('Palabra');
    sim.select('ej', { label: 'Ejemplos', options: ej.map((e) => [e, e]), value: 'rápidamente', onInput: (v) => { w.set(v, true); w.input.value = v; } });
    const w = sim.text('w', { label: 'O escriba una palabra', value: 'rápidamente' });
    sim.out('s', 'Raíz', { hl: true });
    sim.out('r', 'R1 · R2 · RV');
    sim.onDraw(() => {
      const p = (sim.p.w || '').trim().toLowerCase();
      if (!p) { box.innerHTML = ''; return; }
      const tr = [];
      const raiz = S.es(p, tr);
      const g = tr[0];
      const n = p.length, mk = (reg) => n - reg.length;
      const celdas = p.split('').map((c, i) => {
        const marcas = []; if (g.r1 && i >= mk(g.r1)) marcas.push('R1'); if (g.r2 && i >= mk(g.r2)) marcas.push('R2'); if (g.rv && i >= mk(g.rv)) marcas.push('RV');
        return `<span class="tk${marcas.includes('R2') ? ' on' : ''}"><span>${esc(c)}</span><small>${marcas.join('·') || '·'}</small></span>`;
      }).join('');
      sim.set('s', raiz); sim.set('r', `${g.r1 || '∅'} · ${g.r2 || '∅'} · ${g.rv || '∅'}`);
      box.innerHTML = `<small style="color:var(--ink-3)">Regiones marcadas sobre la palabra</small><div class="tk-row">${celdas}</div>` +
        `<table class="mx" style="text-align:left;margin-top:8px"><thead><tr><th style="text-align:left">Paso</th><th style="text-align:left">Sufijo quitado</th><th style="text-align:left">Resultado</th></tr></thead><tbody>${tr.slice(1).map((x) => `<tr><td style="text-align:left;font-family:var(--font-ui)">${x.paso}</td><td style="text-align:left">${esc(x.quita ? '-' + x.quita : '—')}</td><td style="text-align:left">${esc(x.resultado)}</td></tr>`).join('')}</tbody></table>` +
        (tr.length === 2 ? '<p style="color:var(--ink-3)">Ningún sufijo se pudo quitar dentro de su región.</p>' : '');
    });
  });

  const ORACIONES = [
    'El niño cantó una canción y el gato vino a casa.',
    'Mi hermano compra los libros; ellos comían pan.',
    'Fue un buen vino en la noche de la ciudad.',
    'Procesaremos las palabras que escribieron los estudiantes.'
  ];
  NL.defineSim('lematizacion', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('o', { label: 'Oración', options: ORACIONES.map((t, i) => [i, t]), value: 0 });
    sim.out('t', 'Palabras');
    sim.out('amb', 'Con más de un lema', { hl: true });
    sim.out('ui', 'Subagrupación (lexicón)');
    sim.out('oi', 'Sobreagrupación (lexicón)');
    let est = null;
    const estadisticas = () => {
      if (est) return est;
      const uniq = new Map();
      for (const e of M.LEX) if (e.c !== 'ADJ') for (const f of M.generar(e)) { const l = f.lex.split(' ')[0] + '/' + e.c; if (!uniq.has(f.sup)) uniq.set(f.sup, new Set()); uniq.get(f.sup).add(l); }
      const ws = Array.from(uniq.keys()), st = ws.map((x) => S.es(x));
      let sl = 0, sd = 0, dl = 0, ds = 0;
      for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) {
        const a = Array.from(uniq.get(ws[i])), b = Array.from(uniq.get(ws[j]));
        if (a.some((x) => b.includes(x))) { sl++; if (st[i] !== st[j]) sd++; } else { dl++; if (st[i] === st[j]) ds++; }
      }
      return (est = { n: ws.length, ui: sd / sl, oi: ds / dl });
    };
    sim.onDraw(() => {
      const toks = S.tok.completo(ORACIONES[sim.p.o], false).filter((x) => /\p{L}/u.test(x));
      let amb = 0;
      const filas = toks.map((t) => {
        const an = M.analizar(t.toLowerCase());
        const lemas = Array.from(new Set(an.map((a) => a.split(' ')[0])));
        if (lemas.length > 1) amb++;
        return `<tr><td style="text-align:left">${esc(t)}</td><td style="text-align:left">${esc(S.es(t))}</td><td style="text-align:left;${lemas.length > 1 ? 'color:var(--loss);font-weight:700' : ''}">${lemas.length ? lemas.map(esc).join(' | ') : '<span style="color:var(--ink-3)">fuera del lexicón</span>'}</td></tr>`;
      });
      box.innerHTML = `<table class="mx" style="text-align:left"><thead><tr><th style="text-align:left">Palabra</th><th style="text-align:left">Raíz (Snowball)</th><th style="text-align:left">Lemas (analizador)</th></tr></thead><tbody>${filas.join('')}</tbody></table>`;
      const e = estadisticas();
      sim.set('t', String(toks.length)); sim.set('amb', String(amb)); sim.set('ui', NL.pct(e.ui, 1)); sim.set('oi', NL.pct(e.oi, 2));
    });
  });

  NL.bank.add('tokenizacion', [
    { q: 'En «el gato y el perro», ¿cuántos tokens y cuántos tipos hay?', opts: ['5 tokens y 5 tipos', '5 tokens y 4 tipos', '4 tokens y 4 tipos', '6 tokens y 4 tipos'], ok: 1, fb: 'Son 5 tokens (el, gato, y, el, perro); «el» se repite, de modo que hay 4 tipos.', lvl: 1 },
    { q: '¿Qué ocurre con «Pérez» si se tokeniza con <code>\\w+</code> en JavaScript?', opts: ['Queda entero', 'Se parte en «P» y «rez», porque \\w solo reconoce ASCII', 'Se elimina', 'Se pasa a minúsculas'], ok: 1, fb: 'Hay que usar \\p{L}+ con la bandera u para reconocer letras con tilde.', lvl: 2 },
    { q: '¿Cómo conviene tratar «del» en un análisis sintáctico?', opts: ['Dejarlo como una palabra', 'Separarlo en «de» + «el»', 'Eliminarlo', 'Cambiarlo por «a»'], ok: 1, fb: 'La sintaxis necesita la preposición y el artículo por separado.', lvl: 2 },
    { q: '¿Por qué «$1.234,50» debe ser un solo token?', opts: ['Por estética', 'Es un único número; en español «.» separa miles y «,» los decimales', 'Porque tiene un símbolo', 'Porque es más corto'], ok: 1, fb: 'Dividirlo en «1», «234», «50» destruye el significado.', lvl: 2 },
    { q: 'La raíz que da el stemmer Snowball para «universidad» es…', opts: ['universidad', 'univers', 'universal', 'uni'], ok: 1, fb: 'Quita «-idad» (está en R2) y deja «univers», igual que «universo»: sobreagrupación.', lvl: 2 },
    { q: '«Universidad» y «universal» reciben raíces distintas. ¿Qué error es?', opts: ['Sobreagrupación', 'Subagrupación', 'Ninguno', 'Error de tokenización'], ok: 1, fb: 'Son palabras emparentadas que no se juntan: understemming.', lvl: 2 },
    { q: '¿Qué distingue a la lematización del stemming?', opts: ['Es más rápida', 'Devuelve palabras reales y suele requerir diccionario y categoría gramatical', 'No necesita reglas', 'Solo funciona en inglés'], ok: 1, fb: 'El stemming recorta sufijos y puede devolver raíces que no son palabras.', lvl: 1 },
    { q: '¿Por qué un stemmer falla con «vine» y «venimos»?', opts: ['Porque son sustantivos', 'Porque «venir» es irregular y el stemmer solo recorta sufijos', 'Porque tienen tilde', 'Porque son cortas'], ok: 1, fb: 'La raíz cambia (ven-/vin-/vien-); solo un diccionario o analizador lo resuelve.', lvl: 2 },
    { q: 'Para una búsqueda en un buscador conviene…', opts: ['Lematizar con categoría gramatical', 'Stemming: es rápido y no necesita diccionario', 'No normalizar', 'Eliminar todas las vocales'], ok: 1, fb: 'En recuperación de información se gana recuerdo con un pequeño costo de precisión.', lvl: 2 },
    { q: 'Con un modelo neuronal preentrenado, la práctica habitual es…', opts: ['Aplicar siempre stemming', 'Usar su tokenizador de subpalabras sobre el texto sin procesar', 'Quitar todas las palabras vacías', 'Pasar el texto a mayúsculas'], ok: 1, fb: 'Esos modelos aprendieron con su propio tokenizador; preprocesar de más suele empeorar los resultados.', lvl: 2 }
  ]);
})();
