/* Capítulo 31 — Subpalabras y preentrenamiento */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, B = L.bpe;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let MOD = null;
  const modelo = () => MOD || (MOD = B.entrenar(L.corpus.lm.train.flatMap((s) => s.split(' ')), 600));
  let TIP = null; const TIPOS = () => TIP || (TIP = Array.from(new Set(L.corpus.lm.train.flatMap((s) => s.split(' ')))));
  const PIEZAS = ['--c1', '--c2', '--c3', '--c4'];
  const pieza = (t, i) => `<span class="tk" style="border-color:var(${PIEZAS[i % 4]})"><span>${esc(B.limpia(t))}</span></span>`;

  /* ---- 1. BPE ---- */
  NL.defineSim('bpe-entrenar', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Fusiones');
    sim.slider('k', { label: 'Número de fusiones aplicadas', min: 0, max: 600, step: 10, value: 100, fmt: (v) => String(v) });
    sim.group('Texto');
    sim.text('t', { label: 'Texto a tokenizar', value: 'el gobierno anunció la descentralización administrativa' });
    sim.out('v', 'Vocabulario de símbolos', { hl: true });
    sim.out('r', 'Tokens por palabra (300 oraciones de prueba)');
    sim.out('u', 'Palabras que caben en un solo token');
    sim.onDraw(() => {
      const m = modelo(), k = sim.p.k, simb = new Set();
      TIPOS().forEach((w) => B.codificar(m, w, k).forEach((x) => simb.add(x)));
      const test = L.corpus.lm.test.flatMap((s) => s.split(' ')), cod = test.map((w) => B.codificar(m, w, k));
      sim.set('v', `${simb.size} símbolos (tras ${k} fusiones)`);
      sim.set('r', NL.fix(cod.reduce((s, c) => s + c.length, 0) / cod.length, 2)); sim.set('u', NL.pct(cod.filter((c) => c.length === 1).length / cod.length, 1));
      const frase = (sim.p.t.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).slice(0, 12);
      const filas = frase.map((w) => `<tr><td style="text-align:left"><b>${esc(w)}</b></td><td style="text-align:left"><div class="tk-row">${B.codificar(m, w, k).map(pieza).join('')}</div></td><td>${B.codificar(m, w, k).length}</td></tr>`).join('');
      const ult = m.fusiones.slice(Math.max(0, k - 8), k);
      box.innerHTML = `<table class="mx"><thead><tr><th style="text-align:left">Palabra</th><th style="text-align:left">Tokens</th><th>n</th></tr></thead><tbody>${filas}</tbody></table>` +
        (ult.length ? `<small style="color:var(--ink-3)">Últimas fusiones aplicadas (par y frecuencia en el corpus de entrenamiento): ${ult.map(([a, b, f], i) => `${k - ult.length + i + 1}. ${esc(B.limpia(a))} + ${esc(B.limpia(b))} (${f})`).join(' · ')}</small>` : '<small style="color:var(--ink-3)">Sin fusiones: cada símbolo es un carácter.</small>') +
        `<small style="display:block;color:var(--ink-3)">«·» marca el final de la palabra. Con 600 fusiones aprendidas sobre 43.000 palabras, las palabras frecuentes son un token y las raras se parten en piezas conocidas: nunca hay palabras desconocidas.</small>`;
    });
  });

  /* ---- 2. Objetivos de preentrenamiento ---- */
  NL.defineSim('objetivos-preentrenamiento', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    let semilla = 5;
    sim.group('Oración');
    sim.slider('i', { label: 'Oración del corpus de prueba', min: 1, max: 40, step: 1, value: 3, fmt: (v) => String(v) });
    sim.slider('p', { label: 'Porcentaje de palabras elegidas para enmascarar', min: 5, max: 40, step: 5, value: 15, fmt: (v) => v + ' %' });
    sim.button('Otra máscara', () => { semilla += 7; });
    sim.out('m', 'Palabras elegidas', { hl: true });
    sim.onDraw(() => {
      const ws = L.corpus.lm.test[sim.p.i - 1].split(' ').slice(0, 14), rng = L.rng(semilla + sim.p.i);
      const sel = ws.map(() => rng() < sim.p.p / 100);
      if (!sel.some(Boolean)) sel[Math.floor(rng() * ws.length)] = true;
      const tipo = ws.map((w, i) => { if (!sel[i]) return null; const r = rng(); return r < 0.8 ? 'mask' : r < 0.9 ? 'azar' : 'igual'; });
      const azar = L.corpus.lm.train[Math.floor(rng() * 500)].split(' ');
      const entrada = ws.map((w, i) => (tipo[i] === 'mask' ? '[MASK]' : tipo[i] === 'azar' ? azar[Math.floor(rng() * azar.length)] : w));
      sim.set('m', `${sel.filter(Boolean).length} de ${ws.length}`);
      const chip = (t, cls) => `<span class="tk ${cls || ''}"><span>${esc(t)}</span></span>`;
      box.innerHTML = `<p style="margin:0 0 4px"><b>Modelo enmascarado (tipo BERT)</b>: entrada con el 80 % de las elegidas cambiadas por [MASK], el 10 % por una palabra al azar y el 10 % sin cambiar. El modelo debe recuperar la palabra original en las posiciones elegidas, mirando <i>ambos lados</i>.</p>` +
        `<div class="tk-row">${entrada.map((t, i) => chip(t, tipo[i] === 'mask' ? 'bad' : tipo[i] ? 'ok' : '')).join('')}</div>` +
        `<div class="tk-row">${ws.map((w, i) => (sel[i] ? chip('→ ' + w, 'ok') : chip('·'))).join('')}</div>` +
        `<p style="margin:10px 0 4px"><b>Modelo causal (tipo GPT)</b>: en <i>cada</i> posición debe predecir la palabra siguiente viendo solo las anteriores (todas las posiciones aportan error, en una sola pasada).</p>` +
        `<table class="mx"><thead><tr><th style="text-align:left">Entrada (lo ya visto)</th><th style="text-align:left">Objetivo</th></tr></thead><tbody>${ws.slice(0, 7).map((w, i) => `<tr><td style="text-align:left;font-size:12px">&lt;s&gt; ${esc(ws.slice(0, i).join(' '))}</td><td style="text-align:left"><b>${esc(w)}</b></td></tr>`).join('')}</tbody></table>` +
        `<small style="color:var(--ink-3)">Un modelo causal obtiene una señal de aprendizaje por cada palabra; uno enmascarado, solo por el ${sim.p.p} % de ellas, pero cada predicción usa contexto bidireccional.</small>`;
    });
  });

  NL.bank.add('preentrenamiento', [
    { q: 'La tokenización por subpalabras (BPE) resuelve el problema de las palabras desconocidas porque…', opts: ['Cualquier palabra puede escribirse como una secuencia de piezas conocidas, en el peor caso, caracteres', 'Elimina las palabras raras', 'Añade todas las palabras al vocabulario', 'Usa un diccionario externo'], ok: 0, fb: 'Las palabras frecuentes son un token y las raras se parten en subpalabras.', lvl: 1 },
    { q: 'En cada paso, el algoritmo BPE de entrenamiento…', opts: ['Fusiona el par de símbolos adyacentes más frecuente en un nuevo símbolo', 'Elimina el símbolo más raro', 'Duplica el vocabulario', 'Separa la palabra más larga'], ok: 0, fb: 'Se repite hasta alcanzar el tamaño de vocabulario deseado.', lvl: 1 },
    { q: 'Con un vocabulario de BPE más grande, el texto se tokeniza en…', opts: ['Menos tokens por palabra, pero con una tabla de embeddings mayor', 'Más tokens por palabra', 'Siempre un token por palabra', 'Los mismos tokens'], ok: 0, fb: 'Es un compromiso entre longitud de secuencia y tamaño de la tabla de embeddings.', lvl: 2 },
    { q: 'Los tokenizadores de los modelos más usados, entrenados sobre todo con inglés, producen para el español…', opts: ['Más tokens por palabra que para el inglés, lo que encarece el coste y reduce el contexto útil', 'Menos tokens', 'Los mismos tokens', 'Ningún token'], ok: 0, fb: 'En el programa: cl100k_base da 1,70 tokens por palabra en español frente a 1,17 en inglés (tres frases paralelas); o200k_base, más multilingüe, lo reduce a 1,24 frente a 1,11.', lvl: 2 },
    { q: 'El objetivo de preentrenamiento de BERT es…', opts: ['Predecir palabras enmascaradas usando el contexto a ambos lados', 'Predecir la palabra siguiente', 'Clasificar la polaridad', 'Traducir'], ok: 0, fb: 'Además de las máscaras, el BERT original usaba la predicción de la siguiente frase.', lvl: 1 },
    { q: 'El objetivo de GPT es…', opts: ['Predecir la palabra siguiente dado el pasado (modelo causal)', 'Rellenar huecos', 'Ordenar frases', 'Comprimir texto'], ok: 0, fb: 'Con máscara causal; se entrena con toda la frase a la vez.', lvl: 1 },
    { q: 'En la receta de BERT, de las palabras elegidas para el objetivo, el 80 % se sustituye por [MASK]. ¿Por qué se dejan un 10 % cambiadas por otra palabra al azar y un 10 % intactas?', opts: ['Para que el modelo no dependa de ver siempre [MASK], que no existe al usarlo después', 'Por puro azar', 'Para reducir el vocabulario', 'Para acelerar el entrenamiento'], ok: 0, fb: 'Reduce el desajuste entre el preentrenamiento y el ajuste fino.', lvl: 3 },
    { q: 'El ajuste fino (fine-tuning) consiste en…', opts: ['Continuar el entrenamiento de un modelo preentrenado con pocos datos de la tarea concreta', 'Entrenar desde cero con todos los datos', 'Reducir el tamaño del modelo', 'Cambiar el tokenizador'], ok: 0, fb: 'Aprovecha lo aprendido en el preentrenamiento; suele bastar con cientos o miles de ejemplos.', lvl: 1 },
    { q: 'En el experimento del capítulo, al completar palabras enmascaradas, el modelo que ve ambos lados acertó la palabra exacta (top-1) más que el causal. ¿Con qué cifras?', opts: ['25,8 % frente a 21,1 %', '90 % frente a 50 %', '10 % frente a 40 %', 'Los dos acertaron igual'], ok: 0, fb: 'En el top-5 quedan casi igualados (41,4 % frente a 43,5 %): con modelos tan pequeños y tan pocos datos la ventaja es modesta.', lvl: 2 },
    { q: 'Los modelos grandes de lenguaje actuales (GPT, Llama, Claude…) son principalmente…', opts: ['Transformers de solo decodificador con objetivo causal, preentrenados con billones de tokens y luego ajustados', 'Redes convolucionales', 'Sistemas de reglas', 'Modelos de n-gramas'], ok: 0, fb: 'La escala de datos, parámetros y cómputo es lo que cambia cualitativamente su comportamiento.', lvl: 2 }
  ]);
})();
