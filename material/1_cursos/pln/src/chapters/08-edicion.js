/* Capítulo 8 — Distancia de edición y corrección ortográfica */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, E = L.edit;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const OPN = { '=': 'copiar', s: 'sustituir', i: 'insertar', d: 'borrar', t: 'transponer' };

  NL.defineSim('edicion', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Cadenas');
    sim.select('ej', { label: 'Ejemplos', options: [['intención|ejecución', 'intención → ejecución'], ['hola|hoal', 'hola → hoal (transposición)'], ['gato|pato', 'gato → pato'], ['perro|pero', 'perro → pero'], ['casa|caza', 'casa → caza'], ['sábado|sabado', 'sábado → sabado (tilde)']], value: 'intención|ejecución', onInput: (v) => { const [x, y] = v.split('|'); A.set(x, true); A.input.value = x; B.set(y, true); B.input.value = y; } });
    const A = sim.text('a', { label: 'Cadena origen', value: 'intención' });
    const B = sim.text('b', { label: 'Cadena destino', value: 'ejecución' });
    sim.select('m', { label: 'Costos', options: [['1', 'Levenshtein (1, 1, 1)'], ['2', 'Sustitución de costo 2'], ['t', 'Damerau (con transposición)']], value: '1' });
    sim.out('d', 'Distancia', { hl: true });
    sim.out('ops', 'Operaciones (sin copias)');
    sim.onDraw(() => {
      const a = (sim.p.a || '').slice(0, 14), b = (sim.p.b || '').slice(0, 14);
      const o = sim.p.m === '2' ? { sub: 2 } : sim.p.m === 't' ? { trans: 1 } : {};
      const al = E.alinear(a, b, o), D = al.D, A1 = Array.from(a), B1 = Array.from(b);
      const ruta = new Set(al.camino.map(([i, j]) => i + ',' + j));
      sim.set('d', String(D[A1.length][B1.length]));
      sim.set('ops', String(al.ops.filter((x) => x[0] !== '=').length));
      let h = '<table class="mx"><thead><tr><th></th><th>∅</th>' + B1.map((c) => `<th>${esc(c)}</th>`).join('') + '</tr></thead><tbody>';
      for (let i = 0; i <= A1.length; i++) {
        h += `<tr><th>${i ? esc(A1[i - 1]) : '∅'}</th>` + D[i].map((v, j) => `<td class="${ruta.has(i + ',' + j) ? 'path hl' : ''}">${v}</td>`).join('') + '</tr>';
      }
      h += '</tbody></table>';
      h += '<small style="color:var(--ink-3)">Alineamiento</small><div class="tk-row">' + al.ops.map(([t, x, y]) => `<span class="tk ${t === '=' ? '' : t === 's' || t === 't' ? 'bad' : 'on'}"><span>${esc(x || '∅')} → ${esc(y || '∅')}</span><small>${OPN[t]}</small></span>`).join('') + '</div>';
      box.innerHTML = h;
    });
  });

  const MAL = ['cassa', 'pais', 'ejemlpo', 'nesesario', 'sistma', 'rapidamenet', 'abla', 'ladrilo', 'deben', 'menor', 'firma'];
  NL.defineSim('corrector', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const mod = E.modelo(L.corpus.vocab);
    sim.group('Palabra');
    sim.select('ej', { label: 'Ejemplos', options: MAL.map((e) => [e, e]), value: 'cassa', onInput: (v) => { w.set(v, true); w.input.value = v; } });
    const w = sim.text('w', { label: 'O escriba una palabra', value: 'cassa' });
    sim.group('Modelo');
    sim.slider('lam', { label: 'λ: probabilidad de error por edición', min: 1e-6, max: 0.5, log: true, value: 0.01, fmt: (v) => (v < 0.001 ? v.toExponential(0).replace('e-', '×10⁻').replace('+', '') : NL.fix(v, 3)) });
    sim.seg('mod', { label: 'Criterio', options: [['ruidoso', 'Canal ruidoso'], ['norvig', 'Norvig']], value: 'ruidoso' });
    sim.out('n', 'Candidatos', { hl: true });
    sim.out('t', 'Palabra en el vocabulario');
    sim.onDraw(() => {
      const x = (sim.p.w || '').trim();
      if (!x) { box.innerHTML = ''; return; }
      const c = E.corregir(x, mod, { lambda: sim.p.lam, prioridad: sim.p.mod });
      sim.set('n', String(c.length)); sim.set('t', mod.f.has(x.toLowerCase()) ? `sí (${mod.f.get(x.toLowerCase())} veces)` : 'no');
      const top = c.slice(0, 8);
      box.innerHTML = top.length ? `<table class="mx"><thead><tr><th style="text-align:left">Candidato</th><th>d</th><th>veces</th><th>log P(w)</th><th>log P(w) + d·log λ</th></tr></thead><tbody>${top.map((k, i) => `<tr><td style="text-align:left${i === 0 ? ';font-weight:700;color:var(--accent)' : ''}">${esc(k.w)}${k.d === 0 ? ' (la misma)' : ''}</td><td>${k.d}</td><td>${k.n}</td><td>${NL.fix(mod.logP(k.w), 2)}</td><td>${NL.fix(k.score, 2)}</td></tr>`).join('')}</tbody></table>` +
        `<p style="margin:8px 0 0">Corrección elegida: <b>${esc(top[0].w)}</b>${top[0].w === x.toLowerCase() ? ' (el corrector deja la palabra como está)' : ''}.</p>` : '<p style="color:var(--loss);font-weight:600">Ningún candidato a una o dos ediciones está en el vocabulario.</p>';
    });
  });

  NL.bank.add('edicion', [
    { q: '¿Cuál es la distancia de Levenshtein (costos 1, 1, 1) entre «gato» y «pato»?', num: 1, tol: 0, fb: 'Una sustitución (g → p).', lvl: 2 },
    { q: '¿Cuál es la distancia entre «perro» y «pero» con cualquier costo de sustitución?', num: 1, tol: 0, fb: 'Es un borrado: se elimina una «r».', lvl: 2 },
    { q: '«Hola» → «hoal» cuesta 2 en Levenshtein. ¿Cuánto en Damerau?', num: 1, tol: 0, fb: 'La transposición de dos letras adyacentes cuenta como una sola operación.', lvl: 2 },
    { q: '¿Cuál es el costo de calcular la tabla de programación dinámica para cadenas de longitudes n y m?', opts: ['O(n + m)', 'O(nm)', 'O(2ⁿ)', 'O(log n)'], ok: 1, fb: 'Hay (n+1)(m+1) celdas y cada una depende de tres vecinas.', lvl: 2 },
    { q: 'El alineamiento entre las cadenas se obtiene…', opts: ['Con la tabla, retrocediendo desde la última celda', 'Ordenando las letras', 'Con un diccionario', 'Con una red neuronal'], ok: 0, fb: 'En cada paso se elige la vecina que explica el valor de la celda.', lvl: 1 },
    { q: 'Una referencia de 5 palabras y un sistema con un borrado. ¿Cuál es la WER?', num: 0.2, tol: 0.001, fb: '\\((S+D+I)/N=1/5=0{,}2\\).', lvl: 3 },
    { q: 'En el corrector de canal ruidoso, ¿qué representa P(w)?', opts: ['La probabilidad del error', 'La probabilidad previa de la palabra en el idioma (modelo de lengua)', 'La longitud de la palabra', 'El número de ediciones'], ok: 1, fb: 'P(x|w) es el modelo del error y P(w) el del idioma.', lvl: 2 },
    { q: 'Con λ = 0,5 el corrector «corrige» palabras que ya son correctas. ¿Por qué?', opts: ['Porque el vocabulario es muy pequeño', 'Porque la probabilidad de error por edición es tan alta que gana una vecina más frecuente', 'Porque ignora las tildes', 'Porque usa dos ediciones'], ok: 1, fb: 'Si cada edición es casi tan probable como no editar, domina el modelo del idioma.', lvl: 3 },
    { q: '¿Cuántos candidatos (con repeticiones) a una edición tiene una palabra de 5 letras con un alfabeto de 33?', num: 372, tol: 0, fb: '5 borrados + 4 transposiciones + 33·5 sustituciones + 33·6 inserciones = 372.', lvl: 3 },
    { q: '¿Qué tipo de error no detecta un corrector basado en un diccionario?', opts: ['Palabras inexistentes', 'Errores de palabra real, como «cuanto» por «cuando»', 'Tildes omitidas', 'Letras repetidas'], ok: 1, fb: 'El resultado es una palabra válida; solo el contexto delata el error.', lvl: 2 }
  ]);
})();
