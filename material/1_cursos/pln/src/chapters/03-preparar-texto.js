/* Capítulo 3 — Preparar el texto */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, el = NL.el, T = L.text;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- Unicode ---------- */
  NL.defineSim('unicode', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Texto');
    sim.text('t', { label: 'Palabra o frase', value: 'canción' });
    sim.seg('quitar', { label: 'Quitar tildes', options: [[0, 'No'], [1, 'Sí']], value: 0 });
    sim.out('a', 'Puntos de código en NFC', { hl: true });
    sim.out('b', 'Puntos de código en NFD');
    sim.out('c', '¿Son iguales las cadenas?');
    sim.onDraw(() => {
      const t = sim.p.t || '';
      const c = T.nfc(t), d = T.nfd(t);
      const fila = (s) => Array.from(s).map((ch, i) => `<span class="tk"><span>${esc(ch.replace(/[\u0300-\u036f]/, (m) => '◌' + m))}</span><small>${T.puntos(ch)[0]}</small></span>`).join('');
      box.innerHTML = `<small style="color:var(--ink-3)">NFC (compuesta)</small><div class="tk-row">${fila(c)}</div><small style="color:var(--ink-3)">NFD (descompuesta)</small><div class="tk-row">${fila(d)}</div>` + (sim.p.quitar ? `<small style="color:var(--ink-3)">Sin tildes (NFD y sin marcas combinantes)</small><div class="mono-box">${esc(T.sinTildes(t))}</div>` : '');
      sim.set('a', String(Array.from(c).length));
      sim.set('b', String(Array.from(d).length));
      sim.set('c', c === d ? 'sí' : 'no: se ven igual pero difieren');
    });
  });

  /* ---------- Probador de expresiones regulares ---------- */
  const RECETAS = {
    letras: ['\\p{L}+', 'Los niños señalaron 3 casas, 12 árboles y un río.'],
    numeros: ['\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?', 'El precio es 1.234,50 pesos y la matrícula, 12.500; en total 13.734,5.'],
    correo: ['[^\\s@]+@[^\\s@]+\\.\\w+', 'Escriba a ana@uni.edu.co o a soporte@curso.org antes del viernes.'],
    fecha: ['\\b\\d{2}/\\d{2}/\\d{4}\\b', 'El examen es el 08/11/2026 y la entrega, el 15/11/2026; no el 99/99/9999.'],
    hashtag: ['#\\p{L}\\w*', 'Aprendiendo #PLN con #Python y #IA en Popayán.'],
    palabra: ['\\bla\\b|\\blas\\b', 'La casa y las flores de la vecina; la lámpara y las sillas.']
  };
  NL.defineSim('regex', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Patrón');
    sim.select('rec', { label: 'Receta', options: [['letras', 'Palabras (letras Unicode)'], ['numeros', 'Números a la colombiana'], ['correo', 'Correos'], ['fecha', 'Fechas dd/mm/aaaa'], ['hashtag', 'Hashtags'], ['palabra', 'Artículos «la» o «las»'], ['libre', 'Escribir mi propio patrón']], value: 'letras', onInput: (v) => { if (RECETAS[v]) { pat.set(RECETAS[v][0], true); pat.input.value = RECETAS[v][0]; txt.set(RECETAS[v][1], true); txt.input.value = RECETAS[v][1]; } } });
    const pat = sim.text('pat', { label: 'Expresión regular (bandera u activa)', value: RECETAS.letras[0] });
    const txt = sim.text('txt', { label: 'Texto', value: RECETAS.letras[1], rows: 4 });
    sim.check('i', { label: 'Ignorar mayúsculas (bandera i)', value: false });
    sim.out('n', 'Coincidencias', { hl: true });
    sim.out('e', 'Estado');
    sim.onDraw(() => {
      let re;
      try { re = new RegExp(sim.p.pat, 'gu' + (sim.p.i ? 'i' : '')); } catch (e) { box.innerHTML = `<div class="mono-box" style="color:var(--loss)">Patrón no válido: ${esc(e.message)}</div>`; sim.set('n', '—'); sim.set('e', 'error de sintaxis'); return; }
      const t = (sim.p.txt || '').slice(0, 3000), ms = [];
      let m, guard = 0;
      while ((m = re.exec(t)) !== null && guard++ < 300) { ms.push(m); if (m[0] === '') re.lastIndex++; }
      let html = '', pos = 0;
      for (const x of ms) { html += esc(t.slice(pos, x.index)) + '<mark>' + esc(x[0]) + '</mark>'; pos = x.index + x[0].length; }
      html += esc(t.slice(pos));
      const filas = ms.slice(0, 25).map((x, i) => `<tr><td>${i + 1}</td><td>${x.index}</td><td>${esc(x[0])}</td><td>${x.slice(1).map((g) => (g === undefined ? '—' : esc(g))).join(' · ')}</td></tr>`).join('');
      box.innerHTML = `<div class="mono-box" style="white-space:pre-wrap">${html}</div>` + (ms.length ? `<table class="mx"><thead><tr><th>#</th><th>posición</th><th>coincidencia</th><th>grupos</th></tr></thead><tbody>${filas}</tbody></table>` : '<p style="color:var(--ink-3)">Sin coincidencias.</p>');
      sim.set('n', String(ms.length)); sim.set('e', 'patrón válido');
    });
  });

  /* ---------- Limpieza configurable ---------- */
  const MUESTRAS = ['<p>¡NO me gustó la clase!</p>', 'No encontré problemas importantes al estudiar tokenización.', 'Visita https://ejemplo.org ahora y escribe a ana@uni.edu.co', '¡Está BIEN! 😊', 'Mi papá compró papa; él vio el río.', 'Todavía no entiendo clasificación de textos ni puedo aplicar lo aprendido.'];
  function pipeline(texto, o) {
    let t = String(texto);
    if (o.html) t = t.replace(/&(amp|lt|gt|quot|nbsp);/g, ' ').replace(/<[^>]+>/g, ' ').replace(/https?:\/\/\S+|www\.\S+|[^\s@]+@[^\s@]+\.\w+/g, ' URL ');
    if (o.min) t = t.toLowerCase();
    if (o.punt) t = t.replace(/[^\p{L}\p{N}_\s]/gu, ' ');
    if (o.tild) t = T.sinTildes(t);
    let toks = t.match(/\p{L}+|\p{N}+/gu) || [];
    if (o.vac === 'lista') toks = toks.filter((w) => !T.STOP.has(T.sinTildes(w)));
    if (o.vac === 'sinneg') toks = toks.filter((w) => !T.STOP.has(T.sinTildes(w)) || T.NEG.has(w));
    toks = toks.filter((w) => w.length >= o.len);
    return toks;
  }
  NL.defineSim('limpieza', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Muestra');
    sim.select('m', { label: 'Texto de ejemplo', options: MUESTRAS.map((m, i) => [i, m.length > 48 ? m.slice(0, 46) + '…' : m]), value: 1 });
    sim.group('Decisiones de limpieza');
    sim.check('html', { label: 'Quitar HTML, enlaces y correos', value: true });
    sim.check('min', { label: 'Minúsculas', value: true });
    sim.check('punt', { label: 'Quitar puntuación y emoticonos', value: false });
    sim.check('tild', { label: 'Quitar tildes', value: false });
    sim.select('vac', { label: 'Palabras vacías', options: [['no', 'No quitar'], ['lista', 'Lista del curso (incluye «no», «sin»)'], ['sinneg', 'Lista sin negaciones']], value: 'no' });
    sim.slider('len', { label: 'Longitud mínima de palabra', min: 1, max: 5, step: 1, value: 1, fmt: (v) => String(v) });
    sim.out('t', 'Tokens de la muestra', { hl: true });
    sim.out('c', 'Tokens en las 360 opiniones');
    sim.out('v', 'Tipos distintos');
    sim.out('top', 'Más frecuentes', { wide: true });
    sim.onDraw(() => {
      const o = sim.p;
      const toks = pipeline(MUESTRAS[o.m], o);
      const todos = [];
      for (const r of L.corpus.opiniones) todos.push(...pipeline(r.texto, o));
      const f = new Map();
      for (const w of todos) f.set(w, (f.get(w) || 0) + 1);
      const rk = Array.from(f.entries()).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 6);
      box.innerHTML = `<small style="color:var(--ink-3)">Original</small><div class="mono-box" style="white-space:pre-wrap">${esc(MUESTRAS[o.m])}</div><small style="color:var(--ink-3)">Tokens resultantes</small><div class="tk-row">${toks.length ? toks.map((w) => `<span class="tk${T.NEG.has(w) ? ' ok' : ''}">${esc(w)}</span>`).join('') : '<span style="color:var(--loss)">(vacío)</span>'}</div>` + (/\b(no|sin|ni|nunca)\b/i.test(MUESTRAS[o.m]) && !toks.some((w) => T.NEG.has(w)) ? '<p style="color:var(--loss);font-weight:600">La negación se perdió: el significado se invirtió.</p>' : '');
      sim.set('t', String(toks.length)); sim.set('c', NL.nf(todos.length)); sim.set('v', String(f.size));
      sim.set('top', rk.map(([w, n]) => `${w} (${n})`).join(', '));
    });
  });

  /* ---------- Zipf ---------- */
  NL.defineSim('zipf', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Frecuencia frente a rango de cada palabra en escala doble logarítmica' });
    sim.group('Corpus');
    sim.seg('c', { label: null, options: [['op', '360 opiniones'], ['es', '60 oraciones']], value: 'op' });
    sim.check('v', { label: 'Sin palabras vacías', value: false });
    sim.out('tok', 'Tokens');
    sim.out('tip', 'Tipos');
    sim.out('b', 'Pendiente b', { hl: true });
    sim.out('r2', 'R²');
    sim.out('h', 'Hápax (frecuencia 1)');
    sim.onDraw(() => {
      const txt = sim.p.c === 'op' ? L.corpus.opiniones.map((r) => r.texto).join('\n') : L.corpus.texto;
      let tk = T.tokensLetras(txt.toLowerCase());
      if (sim.p.v) tk = tk.filter((w) => !T.STOP.has(T.sinTildes(w)));
      const z = L.text.zipf(tk);
      sim.set('tok', NL.nf(z.total)); sim.set('tip', String(z.tipos)); sim.set('b', NL.fix(z.b, 3)); sim.set('r2', NL.fix(z.r2, 3));
      sim.set('h', NL.pct(z.freqs.filter((v) => v === 1).length / z.tipos, 0));
      NL.draw.clear(cv);
      const mx = Math.max(10, Math.pow(10, Math.ceil(Math.log10(z.freqs[0]))));
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: Math.max(100, z.tipos * 1.2), ymin: 1, ymax: mx, xlog: true, ylog: true, xlabel: 'rango r', ylabel: 'frecuencia f', mb: 34 });
      pl.frame();
      z.freqs.forEach((f, i) => pl.dot(i + 1, f, { color: '--c1', r: 2.8 }));
      const xs = [1, z.tipos], fy = (x) => Math.pow(10, z.a + z.b * Math.log10(x));
      pl.xy(xs, xs.map(fy), { color: '--c2', width: 2 });
      pl.label(Math.max(3, z.tipos / 6), fy(z.tipos / 6) * 2.2, `recta: pendiente ${NL.fix(z.b, 2)}`, { color: '--c2', size: 12 });
    });
  });

  NL.bank.add('preparar-texto', [
    { q: '¿Cuál es el criterio principal para decidir un paso de limpieza?', opts: ['Aplicar siempre todos los pasos estándar', 'Qué información necesita la tarea y qué se pierde con el paso', 'Hacerlo lo más rápido posible', 'Copiar lo que hizo otro proyecto'], ok: 1, fb: 'Cada paso destruye información; lo que sobra para una tarea es justo lo que otra necesita.', lvl: 2 },
    { q: '«é» (U+00E9) y «e» + U+0301 se ven iguales. ¿Qué ocurre al compararlas como cadenas sin normalizar?', opts: ['Son iguales', 'Son distintas, y la longitud de la cadena cambia', 'Da error de sintaxis', 'Solo cambia el color'], ok: 1, fb: 'Son dos representaciones (NFC y NFD) del mismo carácter; se normaliza antes de comparar.', lvl: 2 },
    { q: '¿Cuántos puntos de código tiene «canción» en NFD?', num: 8, tol: 0, fb: 'En NFC son 7; en NFD, la «ó» se descompone en «o» más un acento combinado: 8.', lvl: 3 },
    { q: '¿Por qué quitar las tildes en español puede ser peligroso?', opts: ['Porque ralentiza el programa', 'Porque confunde palabras distintas como «papá» y «papa» o «sí» y «si»', 'Porque Unicode lo prohíbe', 'Porque elimina la puntuación'], ok: 1, fb: 'Las tildes distinguen palabras; solo se quitan para búsquedas tolerantes a errores.', lvl: 2 },
    { q: 'Una lista de palabras vacías incluye «no». ¿Qué pasa con «No me gustó la clase»?', opts: ['Nada importante', 'Pierde la negación y se lee como una opinión positiva', 'Se convierte en una pregunta', 'Se traduce'], ok: 1, fb: 'Al quitar «no» queda «gustó clase»: la polaridad se invierte.', lvl: 2 },
    { q: '¿Qué expresión regular reconoce una o más letras Unicode, incluidas las tildes y la ñ?', opts: ['\\p{L}+', '[a-z]+', '\\d+', '\\s+'], ok: 0, fb: '\\p{L} es la propiedad Unicode «letra»; [a-z] deja fuera las vocales con tilde y la ñ.', lvl: 2 },
    { q: 'La ley de Zipf, con exponente 1, dice que si la palabra más frecuente aparece 1.000 veces, la décima aparece aproximadamente…', num: 100, tol: 0, unit: 'veces', fb: '\\(f(r)=C/r\\): \\(1000/10=100\\).', lvl: 3 },
    { q: 'En escala doble logarítmica, la ley de Zipf se ve como…', opts: ['Una parábola', 'Una recta de pendiente negativa', 'Una campana', 'Un escalón'], ok: 1, fb: '\\(\\log f=\\log C-\\alpha\\log r\\) es una recta de pendiente \\(-\\alpha\\).', lvl: 2 },
    { q: '¿Por qué la limpieza debe decidirse antes de separar entrenamiento y prueba, y los vocabularios ajustarse solo con el entrenamiento?', opts: ['Por estética', 'Para evitar la fuga de datos de evaluación hacia el modelo', 'Porque así el código es más corto', 'Porque lo exige Unicode'], ok: 1, fb: 'Si el vocabulario o las reglas se ajustan con los datos de prueba, la evaluación queda inflada.', lvl: 2 },
    { q: '¿Qué reconoce la expresión \\b\\d{2}/\\d{2}/\\d{4}\\b?', opts: ['Solo fechas válidas', 'Cualquier secuencia dd/dd/dddd, incluso «99/99/9999»', 'Direcciones de correo', 'Números decimales'], ok: 1, fb: 'Las expresiones regulares reconocen formas, no significados: no validan el rango del mes o del día.', lvl: 2 }
  ]);
})();
