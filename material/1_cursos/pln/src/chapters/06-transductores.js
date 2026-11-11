/* Capítulo 6 — Transductores y morfología de dos niveles */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, T = L.fst, M = L.morph;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const REGLAS = [
    ['rE', 'Inserción de e: ε → e / C ^ _ s#', ['lugar^s#', 'padre^s#', 'color^s#', 'lugar^as#', 'café^s#']],
    ['rZC', 'z → c ante ^e', ['nuez^es#', 'nuez^s#', 'zapato#', 'lápiz^es#']],
    ['rTilde', 'Pérdida de tilde ante {n,s}^e', ['canción^es#', 'autobús^es#', 'canción^s#', 'jardín^es#']],
    ['rLimpiar', 'Quitar fronteras ^ y #', ['nuec^es#', 'gat^as#']]
  ];
  NL.defineSim('regla-fst', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Transductor');
    sim.select('r', { label: 'Regla', options: REGLAS.map((r, i) => [i, r[1]]), value: 0, onInput: (i) => { t.set(REGLAS[i][2][0], true); t.input.value = REGLAS[i][2][0]; } });
    const t = sim.text('s', { label: 'Cadena de entrada', value: REGLAS[0][2][0] });
    sim.check('inv', { label: 'Sentido inverso (leer la salida, escribir la entrada)', value: false });
    sim.out('n', 'Salidas posibles', { hl: true });
    sim.out('q', 'Estados / arcos');
    sim.onDraw(() => {
      const f0 = T[REGLAS[sim.p.r][0]], f = sim.p.inv ? T.invertir(f0) : f0;
      const s = sim.p.s || '';
      const tz = T.aplicar(f, s, { traza: true, maxLen: s.length + 4 });
      const sal = Array.from(tz.keys()).sort();
      sim.set('n', String(sal.length)); sim.set('q', `${f0.n} / ${f0.arcs.length}`);
      let h = `<small style="color:var(--ink-3)">${sim.p.inv ? 'Entradas que producen «' + esc(s) + '» (sentido inverso)' : 'Salida del transductor'}</small>`;
      h += sal.length ? sal.slice(0, 12).map((o) => { const cam = tz.get(o); return `<div style="margin:6px 0"><div class="tk-row"><span class="tk ok"><span>${esc(o) || '∅'}</span><small>${sim.p.inv ? 'entrada' : 'salida'}</small></span></div><small style="color:var(--ink-3)">estados: ${cam ? cam.map((q) => f0.nombres[q] || 'q' + q).join(' → ') : ''}</small></div>`; }).join('') : '<p style="color:var(--loss);font-weight:600">Sin salida: la cadena no es aceptada por el transductor.</p>';
      box.innerHTML = h;
    });
  });

  NL.defineSim('dos-niveles', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Dirección');
    sim.seg('modo', { label: null, options: [['an', 'Analizar (superficie → léxico)'], ['gen', 'Generar (intermedio → superficie)']], value: 'an' });
    const ejA = ['lugares', 'nueces', 'canciones', 'autobuses', 'lápices', 'cantábamos', 'vino', 'fue', 'gatas', 'exámenes'];
    const ejG = ['lugar^s#', 'nuez^s#', 'canción^s#', 'lápiz^s#', 'padre^s#', 'cant^aba#'];
    sim.select('ej', { label: 'Ejemplos', options: ejA.map((e) => [e, e]).concat(ejG.map((e) => [e, e])), value: 'lugares', onInput: (v) => { w.set(v, true); w.input.value = v; sim.ctl.modo.set(v.includes('^') ? 'gen' : 'an', true); } });
    const w = sim.text('w', { label: 'Forma', value: 'lugares' });
    sim.out('n', 'Candidatos intermedios', { hl: true });
    sim.out('v', 'Válidos en el lexicón');
    sim.onDraw(() => {
      const x = (sim.p.w || '').trim();
      if (sim.p.modo === 'gen') {
        const casc = M.cascada(x.includes('#') ? x : x + '#');
        const fst = T.generar(x.includes('#') ? x : x + '#');
        box.innerHTML = `<div class="tk-row">${casc.map((c, i) => `<span class="tk${i && c.s !== casc[i - 1].s ? ' on' : ''}"><span>${esc(c.s)}</span><small>${c.regla}</small></span>`).join('<span style="align-self:center">→</span>')}</div><p style="margin:8px 0 0">Resultado con los <b>transductores</b>: <b>${fst.map(esc).join(', ') || '—'}</b> · coincide con la cascada de funciones: <b>${fst.length === 1 && fst[0] === casc[casc.length - 1].s ? 'sí' : 'no'}</b>.</p>`;
        sim.set('n', '—'); sim.set('v', '—');
        return;
      }
      const cand = x ? T.candidatos(x.toLowerCase()) : [];
      const r = x ? T.analizar(x) : { analisis: [], intermedios: [] };
      sim.set('n', String(cand.length)); sim.set('v', String(r.intermedios.length));
      box.innerHTML = `<small style="color:var(--ink-3)">Candidatos al invertir la cascada (los válidos en el lexicón, resaltados)</small><div class="tk-row">${cand.slice(0, 60).map((c) => `<span class="tk${r.intermedios.includes(c) ? ' ok' : ''}"><span>${esc(c)}</span></span>`).join('')}${cand.length > 60 ? '<span class="tk">…</span>' : ''}</div>` +
        (r.analisis.length ? `<small style="color:var(--ink-3)">Análisis (nivel léxico)</small><table class="mx" style="text-align:left"><tbody>${r.analisis.map((a) => `<tr><td style="text-align:left">${esc(a)}</td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--loss);font-weight:600">Ningún candidato corresponde al lexicón.</p>');
    });
  });

  NL.bank.add('transductores', [
    { q: '¿Qué distingue a un transductor de estados finitos de un autómata finito?', opts: ['Tiene más estados', 'Tiene dos cintas: lee una entrada y escribe una salida', 'No tiene estado inicial', 'Solo acepta cadenas vacías'], ok: 1, fb: 'El transductor define una relación entre cadenas; el autómata solo acepta o rechaza.', lvl: 1 },
    { q: 'En «lugar^s#», ¿qué significan «^» y «#»?', opts: ['Dos letras del español', 'Frontera entre morfemas y frontera de palabra', 'Mayúsculas y minúsculas', 'Acentos'], ok: 1, fb: 'Son símbolos auxiliares del nivel intermedio que las reglas usan como contexto y que se eliminan al final.', lvl: 1 },
    { q: 'Aplique la cascada a «nuez^s#». ¿Cuál es la forma de superficie?', opts: ['nuezs', 'nueces', 'nuezes', 'nuecs'], ok: 1, fb: 'Inserción de e → nuez^es#; z → c ante e → nuec^es#; al quitar fronteras: nueces.', lvl: 2 },
    { q: '¿Por qué importa el orden de las reglas (inserción de e antes que z → c)?', opts: ['No importa', 'La regla z → c necesita que la «e» ya esté insertada tras la frontera', 'Porque el alfabeto lo exige', 'Para ahorrar memoria'], ok: 1, fb: 'El contexto «_ ^e» de la z → c se crea con la inserción de la «e».', lvl: 3 },
    { q: 'La regla de inserción de e es obligatoria. ¿Qué implica?', opts: ['Que «lugar^s#» solo produce «lugar^es#»', 'Que se aplica a toda palabra', 'Que no puede invertirse', 'Que inserta e en cualquier posición'], ok: 0, fb: 'El camino sin inserción se anula: no admite «#» tras la «s».', lvl: 2 },
    { q: 'Al invertir la cascada para analizar «lugares», se obtienen varios candidatos intermedios. ¿Quién decide cuáles son válidos?', opts: ['El tokenizador', 'El lexicón, que solo admite raíces y sufijos existentes', 'Un humano', 'La regla de quitar fronteras'], ok: 1, fb: 'Solo «lugar^s#» corresponde a una raíz real con un sufijo permitido.', lvl: 2 },
    { q: '¿Cuántos estados tiene el transductor de inserción de «e» de este curso?', num: 6, tol: 0, fb: 'q0, consonante, consonante + frontera, e insertada, s leída y s sin inserción: 6 estados.', lvl: 3 },
    { q: 'La inversa de «quitar fronteras» sin restricciones inserta ^ y # en cualquier posición. ¿Qué problema trae?', opts: ['Ninguno', 'El número de candidatos crece exponencialmente (arcos de entrada vacía)', 'Cambia el alfabeto', 'No se puede construir'], ok: 1, fb: 'Por eso se usa una inserción controlada de a lo sumo un ^ y un # final.', lvl: 3 },
    { q: 'Una ventaja de la morfología de estados finitos es…', opts: ['No necesita lexicón', 'El mismo transductor analiza y genera, y es de tiempo lineal', 'Aprende sola de los datos', 'Reconoce lenguas no concatenativas sin cambios'], ok: 1, fb: 'Se invierte cambiando las cintas y se ejecuta en tiempo lineal en la longitud de la palabra.', lvl: 2 },
    { q: '¿Cómo se llama el diseño de Koskenniemi (1983) que combina reglas ortográficas y lexicón?', opts: ['Morfología de dos niveles', 'Gramática de casos', 'Teoría de la información', 'Análisis de dependencias'], ok: 0, fb: 'Las reglas relacionan el nivel intermedio con la superficie, y el lexicón el léxico con el intermedio.', lvl: 1 }
  ]);
})();
