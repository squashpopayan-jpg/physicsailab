/* Capítulo 27 — Clasificación de texto */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, K = L.clf, V = L.vec;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const VACIAS = new Set('a al algo como con de del el en es esta este la las lo los me mi muy no para pero por que se si su un una y ya fue sobre'.split(' '));
  const OP = () => L.corpus.opiniones;
  const docs = () => OP().map((r) => r.texto);
  const etiquetas = (obj) => OP().map((r) => (obj === 'tema' ? r.tema : r.etiqueta));

  const tabla = (m) => `<table class="mx"><thead><tr><th style="text-align:left">real \\ predicho</th>${m.clases.map((c) => `<th style="font-size:11px">${esc(c.slice(0, 14))}</th>`).join('')}<th>P</th><th>R</th><th>F1</th></tr></thead><tbody>${m.matriz.map((f, i) => `<tr><td style="text-align:left;font-size:12px">${esc(m.clases[i])}</td>${f.map((v, j) => `<td class="${i === j ? 'hl' : v ? 'bad' : ''}">${v}</td>`).join('')}<td>${NL.fix(m.por[i].p, 2)}</td><td>${NL.fix(m.por[i].r, 2)}</td><td>${NL.fix(m.por[i].f1, 2)}</td></tr>`).join('')}</tbody></table>`;

  /* ---- 1. Laboratorio de clasificación ---- */
  NL.defineSim('clf-laboratorio', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Tarea y datos');
    sim.seg('o', { label: 'Qué se clasifica', options: [['pol', 'Polaridad (2 clases)'], ['tema', 'Tema (10 clases)']], value: 'pol' });
    sim.slider('p', { label: 'Opiniones para entrenar (%)', min: 5, max: 90, step: 5, value: 60, fmt: (v) => v + ' %' });
    sim.group('Representación');
    sim.seg('r', { label: 'Valor de cada rasgo', options: [['conteo', 'Conteo'], ['bin', 'Binario'], ['tfidf', 'TF-IDF']], value: 'conteo' });
    sim.seg('n', { label: 'N-gramas', options: [['1', 'Palabras'], ['2', 'Palabras y pares']], value: '1' });
    sim.check('v', { label: 'Quitar palabras vacías', value: false });
    sim.group('Clasificador');
    sim.seg('m', { label: 'Modelo', options: [['nb', 'Bayes ingenuo'], ['lr', 'Regresión logística']], value: 'nb' });
    sim.slider('a', { label: 'Bayes ingenuo: suavizado α', min: 0.01, max: 2, step: 0.01, value: 1, fmt: (v) => NL.fix(v, 2) });
    sim.select('c', { label: 'Regresión logística: C (menor = más regularización)', options: [['0.1', '0,1'], ['1', '1'], ['10', '10'], ['100', '100']], value: '1' });
    sim.out('a', 'Exactitud en prueba', { hl: true });
    sim.out('f', 'F1 macro');
    sim.out('n', 'Rasgos');
    sim.onDraw(() => {
      const d = docs(), y = etiquetas(sim.p.o), ntr = Math.max(4, Math.round(d.length * sim.p.p / 100));
      if (sim.p.o === 'tema' && sim.p.m === 'lr') { box.innerHTML = '<p>La regresión logística de este curso es binaria. Elija «Polaridad» o cambie a Bayes ingenuo.</p>'; sim.set('a', '—'); sim.set('f', '—'); sim.set('n', '—'); return; }
      const f = K.tuberia({ modelo: sim.p.m, n: [1, +sim.p.n], vacias: sim.p.v ? VACIAS : null, tfidf: sim.p.r === 'tfidf', binario: sim.p.r === 'bin', alpha: sim.p.a, C: +sim.p.c })(d.slice(0, ntr), y.slice(0, ntr));
      const pred = d.slice(ntr).map((t) => f(t)), real = y.slice(ntr), m = K.metricas(real, pred, Array.from(new Set(y)).sort());
      sim.set('a', `${NL.pct(m.acc, 1)} (${real.filter((r, i) => r === pred[i]).length} de ${real.length})`); sim.set('f', NL.fix(m.macroF1, 3)); sim.set('n', String(f.info.vz.vocab.length));
      /* palabras más influyentes */
      let top = '';
      const voc = f.info.vz.vocab, md = f.info.modelo;
      if (sim.p.m === 'lr') {
        const o = Array.from(md.w.keys()).sort((a, b) => md.w[b] - md.w[a]);
        top = `<small style="color:var(--ink-3)">Pesos de la regresión logística (positivo > 0)</small><div class="tk-row">${o.slice(0, 7).map((j) => `<span class="tk ok"><span>${esc(voc[j])} ${NL.fix(md.w[j], 1)}</span></span>`).join('')}</div><div class="tk-row">${o.slice(-7).reverse().map((j) => `<span class="tk bad"><span>${esc(voc[j])} ${NL.fix(md.w[j], 1)}</span></span>`).join('')}</div>`;
      } else {
        top = md.clases.map((c, ci) => {
          const sc = voc.map((w, j) => [j, md.logProb[ci][j] - Math.max(...md.clases.map((_, cj) => (cj === ci ? -Infinity : md.logProb[cj][j])))]).sort((a, b) => b[1] - a[1]).slice(0, md.clases.length > 3 ? 4 : 7);
          return `<div><small style="color:var(--ink-3)">Palabras más propias de «${esc(c)}» (log P(palabra | clase) − la mejor de las otras)</small><div class="tk-row">${sc.map(([j, v]) => `<span class="tk"><span>${esc(voc[j])} ${NL.fix(v, 1)}</span></span>`).join('')}</div></div>`;
        }).slice(0, 3).join('');
      }
      const fallos = d.slice(ntr).map((t, i) => [t, real[i], pred[i]]).filter((x) => x[1] !== x[2]).slice(0, 4);
      box.innerHTML = tabla(m) + top + (fallos.length ? `<small style="color:var(--ink-3)">Algunos errores</small><ul style="margin:2px 0 0;padding-left:1.2em;font-size:12.5px">${fallos.map(([t, r, p]) => `<li>«${esc(t)}» → real <b>${esc(r)}</b>, predicho <b>${esc(p)}</b></li>`).join('')}</ul>` : '<p style="margin:6px 0 0">Sin errores en la prueba.</p>');
    });
  });

  /* ---- 2. Clasificar una opinión propia ---- */
  const MOD = {};
  const entrenado = (clave, cfg) => MOD[clave] || (MOD[clave] = K.tuberia(cfg)(docs(), etiquetas('pol')));
  NL.defineSim('clf-probar', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Opinión');
    sim.text('t', { label: 'Escriba una opinión sobre una práctica o clase', value: 'No me gustó la práctica de tokenización porque aprendí poco' });
    sim.out('nb', 'Bayes ingenuo (TF-IDF, 1-2 gramas): P(positivo)', { hl: true });
    sim.out('lr', 'Regresión logística (TF-IDF): P(positivo)');
    sim.onDraw(() => {
      const t = sim.p.t, nb = entrenado('nb', { modelo: 'nb', tfidf: true, n: [1, 2], alpha: 0.5 }), lr = entrenado('lr', { modelo: 'lr', tfidf: true, C: 10 });
      const xn = nb.info.rep(t), xl = lr.info.rep(t), pn = K.nbProb(nb.info.modelo, xn)[1], pl = K.lrProb(lr.info.modelo, xl);
      sim.set('nb', NL.fix(pn, 3)); sim.set('lr', NL.fix(pl, 3));
      const contrib = Array.from(xl).map(([j, v]) => [lr.info.vz.vocab[j], lr.info.modelo.w[j] * v]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8);
      const conocidas = new Set(lr.info.vz.vocab), desconocidas = (t.toLowerCase().match(/[\p{L}\p{N}_]{2,}/gu) || []).filter((w) => !conocidas.has(w));
      box.innerHTML = `<small style="color:var(--ink-3)">Contribución de cada palabra a la decisión de la regresión logística (peso × valor TF-IDF; positivo empuja hacia «positivo»)</small>` +
        (contrib.length ? `<table class="mx"><tbody>${contrib.map(([w, c]) => `<tr><td style="text-align:left">${esc(w)}</td><td class="${c > 0 ? 'hl' : 'bad'}">${c > 0 ? '+' : ''}${NL.fix(c, 3)}</td></tr>`).join('')}</tbody></table>` : '<p>Ninguna palabra conocida.</p>') +
        `<p style="margin:6px 0 0;font-size:12.5px">Intercepto: ${NL.fix(lr.info.modelo.b, 3)}. Veredicto: <b>${pl >= 0.5 ? 'positiva' : 'negativa'}</b> (regresión) y <b>${pn >= 0.5 ? 'positiva' : 'negativa'}</b> (Bayes). Palabras que el modelo no conoce: ${desconocidas.length ? desconocidas.map(esc).join(', ') : 'ninguna'}.</p>` +
        `<small style="color:var(--ink-3)">Los modelos se entrenaron con las 360 opiniones, que son frases de plantilla; con opiniones libres su fiabilidad es mucho menor.</small>`;
    });
  });

  /* ---- 3. Curva de aprendizaje ---- */
  NL.defineSim('clf-curva', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Exactitud en las 72 últimas opiniones según el tamaño del entrenamiento' });
    sim.group('Modelos');
    sim.check('nb', { label: 'Bayes ingenuo (conteos)', value: true });
    sim.check('nb2', { label: 'Bayes ingenuo (TF-IDF, 1-2 gramas)', value: false });
    sim.check('lr', { label: 'Regresión logística (conteos)', value: true });
    sim.out('f', 'Con 288 ejemplos', { hl: true });
    const NS = [5, 10, 20, 40, 80, 160, 288];
    sim.onDraw(() => {
      const d = docs(), y = etiquetas('pol'), prueba = d.slice(288), real = y.slice(288);
      const defs = [['nb', 'Bayes (conteos)', { modelo: 'nb' }, '--c1'], ['nb2', 'Bayes (TF-IDF 1-2)', { modelo: 'nb', tfidf: true, n: [1, 2], alpha: 0.5 }, '--c3'], ['lr', 'Logística (conteos)', { modelo: 'lr', C: 1 }, '--c2']].filter((x) => sim.p[x[0]]);
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 300, ymin: 0.4, ymax: 1.02, xlabel: 'opiniones de entrenamiento', ylabel: 'exactitud', mb: 36 });
      pl.frame(); pl.hline(0.5, { color: '--ink-3', dash: [4, 4] });
      const fin = [];
      defs.forEach(([, nombre, cfg, col]) => {
        const acc = NS.map((n) => { const f = K.tuberia(cfg)(d.slice(0, n), y.slice(0, n)); return prueba.filter((t, i) => f(t) === real[i]).length / prueba.length; });
        pl.xy(NS, acc, { color: col, width: 2.2 }); NS.forEach((n, i) => pl.dot(n, acc[i], { color: col, r: 3 }));
        fin.push(`${nombre} ${NL.pct(acc[acc.length - 1], 1)}`);
      });
      pl.legend(defs.map(([, nombre, , col]) => ({ label: nombre, color: col })), 'br');
      sim.set('f', fin.join(' · ') || '—');
    });
  });

  NL.bank.add('clasificacion', [
    { q: 'La clasificación de textos es un problema de aprendizaje…', opts: ['Supervisado: se entrena con textos ya etiquetados', 'No supervisado siempre', 'Por refuerzo', 'Sin datos'], ok: 0, fb: 'Se conoce la clase de los ejemplos de entrenamiento (positivo/negativo, tema…).', lvl: 1 },
    { q: 'Bayes ingenuo elige la clase que maximiza…', opts: ['P(clase) · ∏ P(palabra | clase)', 'P(palabra) / P(clase)', 'El número de palabras', 'La longitud del documento'], ok: 0, fb: 'Aplica la regla de Bayes y supone que las palabras son independientes dadas la clase (de ahí «ingenuo»).', lvl: 1 },
    { q: 'Con suavizado de Laplace (α = 1) y vocabulario de 1.000 palabras, una palabra con 0 apariciones en una clase de 5.000 palabras totales tiene probabilidad…', opts: ['1/6.000', '0', '1/5.000', '1/1.000'], ok: 0, fb: '(0 + 1) / (5.000 + 1.000). Sin suavizado sería 0 y anularía toda la clase.', lvl: 2 },
    { q: 'Para evitar el desbordamiento al multiplicar muchas probabilidades pequeñas, Bayes ingenuo suma…', opts: ['Logaritmos de probabilidades', 'Probabilidades', 'Conteos', 'Raíces cuadradas'], ok: 0, fb: 'El logaritmo convierte el producto en suma y no cambia el arg max.', lvl: 2 },
    { q: 'La regresión logística binaria calcula P(y = 1 | x) como…', opts: ['σ(w · x + b), con σ la función logística', 'w · x', 'El máximo de x', 'El coseno de x'], ok: 0, fb: 'σ(z) = 1/(1 + e^(−z)) lleva cualquier número a (0, 1).', lvl: 1 },
    { q: 'En la regresión logística regularizada, un valor pequeño de C implica…', opts: ['Más regularización: pesos más pequeños', 'Menos regularización', 'Más rasgos', 'Más clases'], ok: 0, fb: 'C es la inversa de la fuerza de regularización (en scikit-learn).', lvl: 2 },
    { q: 'La precisión de una clase es…', opts: ['Los verdaderos positivos entre todo lo que el modelo predijo como esa clase', 'Los verdaderos positivos entre todos los ejemplos reales de la clase', 'El total de aciertos', 'El número de clases'], ok: 0, fb: 'La cobertura (recall) es la segunda: verdaderos positivos entre los reales de la clase.', lvl: 1 },
    { q: 'Un clasificador tiene precisión 0,9 y cobertura 0,6. ¿Cuál es su F1 (2 decimales)?', num: 0.72, tol: 0.01, fb: 'F1 = 2·0,9·0,6/(0,9 + 0,6) = 1,08/1,5 = 0,72 (media armónica).', lvl: 2 },
    { q: 'La validación cruzada de 5 bloques sirve para…', opts: ['Estimar el rendimiento sobre datos no vistos usando todos los datos para probar por turnos', 'Entrenar con todos los datos y probar con los mismos', 'Eliminar el sobreajuste automáticamente', 'Ordenar el corpus'], ok: 0, fb: 'Cada bloque se usa una vez de prueba mientras los otros cuatro entrenan.', lvl: 2 },
    { q: 'Un clasificador de polaridad entrenado con opiniones sobre cursos se usa con opiniones de películas y empeora mucho. Es un problema de…', opts: ['Cambio de dominio', 'Falta de memoria', 'Palabras vacías', 'Suavizado'], ok: 0, fb: 'El vocabulario y lo que significa «positivo» cambian con el dominio.', lvl: 3 }
  ]);
})();
