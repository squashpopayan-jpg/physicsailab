/* Capítulo 15 — Rasgos y unificación */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, U = L.unif;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  /* Lee una estructura de rasgos escrita como [a=1, b=[c=x], d=?v] */
  function leer(s) {
    let i = 0; s = s.trim();
    const ws = () => { while (s[i] === ' ') i++; };
    const val = () => {
      ws();
      if (s[i] === '[') return fs();
      let j = i; while (j < s.length && !',]'.includes(s[j])) j++;
      const x = s.slice(i, j).trim().replace(/^'|'$/g, ''); i = j;
      return /^-?\d+$/.test(x) ? +x : x;
    };
    const fs = () => {
      i++; const o = {};
      ws(); if (s[i] === ']') { i++; return o; }
      for (;;) { ws(); let j = i; while (s[j] !== '=') { if (j >= s.length) throw new Error('falta =' ); j++; } const k = s.slice(i, j).trim(); i = j + 1; o[k] = val(); ws(); if (s[i] === ',') { i++; continue; } if (s[i] === ']') { i++; break; } throw new Error('se esperaba , o ]'); }
      return o;
    };
    const r = fs(); return r;
  }
  const CASOS = [
    ['[gen=f, num=s]', '[gen=f, num=s]'], ['[gen=f, num=s]', '[gen=m, num=s]'], ['[gen=f]', '[num=p]'],
    ['[cat=N, agr=[num=?n, gen=f]]', '[agr=[num=s]]'], ['[a=?x, b=?x]', '[a=1]'], ['[a=?x, b=?x]', '[a=1, b=2]'], ['[agr=[num=?n], subj=[agr=[num=?n]]]', '[agr=[num=p], subj=[agr=[num=p]]]'], ['[agr=[num=?n], subj=[agr=[num=?n]]]', '[agr=[num=s], subj=[agr=[num=p]]]']
  ];
  NL.defineSim('unificar', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Estructuras de rasgos');
    sim.select('c', { label: 'Casos', options: CASOS.map((c, i) => [i, c[0] + '  ⊔  ' + c[1]]), value: 3, onInput: (i) => { a.set(CASOS[i][0], true); a.input.value = CASOS[i][0]; b.set(CASOS[i][1], true); b.input.value = CASOS[i][1]; } });
    const a = sim.text('a', { label: 'Primera estructura', value: CASOS[3][0] });
    const b = sim.text('b', { label: 'Segunda estructura', value: CASOS[3][1] });
    sim.out('r', 'Resultado', { hl: true, wide: true });
    sim.onDraw(() => {
      try {
        const x = leer(sim.p.a), y = leer(sim.p.b), r = U.unificar(x, y);
        sim.set('r', r === null ? 'la unificación falla' : U.texto(r));
        box.innerHTML = `<table class="mx" style="text-align:left"><tbody><tr><td style="text-align:left">${esc(U.texto(x))}</td></tr><tr><td style="text-align:left">⊔ ${esc(U.texto(y))}</td></tr><tr><td class="${r === null ? '' : 'hl'}" style="text-align:left">${r === null ? '<span style="color:var(--loss);font-weight:700">⊥ (valores incompatibles en algún rasgo)</span>' : '= ' + esc(U.texto(r))}</td></tr></tbody></table><p style="font-size:12.5px;color:var(--ink-3);margin:6px 0 0">Reglas: las estructuras se combinan rasgo a rasgo; un rasgo que solo está en una se conserva; si está en las dos con valores atómicos distintos, falla; una variable (?x) se liga al valor con el que se encuentra, en todas sus apariciones.</p>`;
      } catch (e) { sim.set('r', 'estructura mal escrita'); box.innerHTML = `<p style="color:var(--loss)">Formato: [rasgo=valor, rasgo=[sub=valor], rasgo=?variable]. ${esc(e.message)}</p>`; }
    });
  });

  const FRASES = ['la niña lee un libro', 'las niña lee un libro', 'los gatos duermen', 'los gatos duerme', 'yo leo un libro', 'yo lee un libro', 'el niño duerme un libro', 'la casa es roja', 'los niños leen los libros'];
  NL.defineSim('concordancia', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('f', { label: 'Ejemplos', options: FRASES.map((f) => [f, f]), value: FRASES[1], onInput: (v) => { t.set(v, true); t.input.value = v; } });
    const t = sim.text('w', { label: 'O escriba una oración', value: FRASES[1] });
    sim.out('a', 'Con concordancia', { hl: true });
    sim.out('b', 'Sin concordancia (solo estructura)');
    sim.onDraw(() => {
      const ws = (sim.p.w || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
      const con = U.analizar(ws), sin = U.analizar(ws, { concordancia: false });
      sim.set('a', con.n ? 'se acepta' : 'se rechaza'); sim.set('b', sin.n ? 'se acepta' : 'se rechaza');
      const info = ws.map((w) => `<span class="tk"><span>${esc(w)}</span><small>${(U.LEX[w] || []).map((e) => e.cat + ' ' + U.texto(e.agr)).join(' | ') || 'desconocida'}</small></span>`).join('');
      box.innerHTML = `<small style="color:var(--ink-3)">Rasgos de cada palabra en el léxico</small><div class="tk-row">${info}</div>` +
        (sin.n && !con.n ? '<p style="color:var(--loss);font-weight:600">Estructuralmente correcta, pero la unificación de los rasgos de género, número o persona falla: la gramática con rasgos la rechaza.</p>' : con.n ? `<p>Rasgos del sujeto-verbo unificados: <b>${esc(U.texto(con.arboles[0].agr))}</b></p>` : '<p style="color:var(--loss)">La estructura misma no es válida para la gramática (por ejemplo, un verbo transitivo sin objeto o un intransitivo con él).</p>');
    });
  });

  NL.bank.add('unificacion', [
    { q: '¿Para qué sirven las categorías complejas (gramáticas de unificación)?', opts: ['Para acelerar el análisis', 'Para expresar la concordancia y otras restricciones sin multiplicar las reglas', 'Para eliminar la ambigüedad', 'Para traducir'], ok: 1, fb: 'Cada categoría lleva rasgos (género, número, persona) que deben unificarse.', lvl: 1 },
    { q: '¿Qué resulta de unificar [gen=f, num=?n] con [num=s]?', opts: ['[gen=f, num=s]', 'Falla', '[num=s]', '[gen=f]'], ok: 0, fb: 'La variable ?n se liga a s; el rasgo gen, presente solo en una, se conserva.', lvl: 2 },
    { q: '¿Qué resulta de unificar [num=s] con [num=p]?', opts: ['[num=s]', '[num=p]', 'Falla: valores atómicos distintos', '[num=sp]'], ok: 2, fb: 'Dos valores atómicos distintos para el mismo rasgo son incompatibles.', lvl: 2 },
    { q: 'En «las niña lee un libro», ¿por qué una gramática de unificación la rechaza?', opts: ['Porque «niña» no existe', 'Porque los rasgos de número de «las» (plural) y «niña» (singular) no unifican', 'Porque falta el verbo', 'Porque «lee» es plural'], ok: 1, fb: 'La regla SN → Det N exige que ambos compartan género y número.', lvl: 2 },
    { q: 'En la regla S → SN[num=?n] SV[num=?n], la variable ?n sirve para…', opts: ['Contar palabras', 'Forzar que sujeto y verbo concuerden en número', 'Marcar el sujeto', 'Escoger el verbo transitivo'], ok: 1, fb: 'La misma variable en dos lugares obliga a que los valores unifiquen.', lvl: 2 },
    { q: 'La subcategorización de un verbo describe…', opts: ['Su tiempo verbal', 'Qué complementos exige (objeto directo, preposicional…)', 'Su frecuencia', 'Su origen'], ok: 1, fb: 'Los verbos transitivos exigen objeto directo; «el niño duerme un libro» se rechaza.', lvl: 1 },
    { q: 'Unificar [a=?x, b=?x] con [a=1, b=2] resulta…', opts: ['[a=1, b=2]', 'Falla: ?x no puede valer 1 y 2 a la vez', '[a=2, b=1]', '[a=?x]'], ok: 1, fb: 'La variable compartida liga ambos rasgos al mismo valor.', lvl: 3 },
    { q: 'Mover información del gramática al léxico en una gramática de unificación…', opts: ['Aumenta el número de reglas', 'Reduce las reglas y concentra el conocimiento en las palabras (léxico rico, gramática pequeña)', 'Impide analizar', 'Elimina las palabras'], ok: 1, fb: 'Es la idea de las gramáticas léxicas (HPSG, LFG).', lvl: 2 },
    { q: '¿Qué operación es la unificación respecto de la información?', opts: ['Resta de información', 'Combina la información de dos estructuras compatibles en una sola, más informativa', 'Copia una estructura', 'Cuenta rasgos'], ok: 1, fb: 'El resultado contiene todo lo que decían ambas; si se contradicen, falla.', lvl: 2 },
    { q: 'Sin rasgos, una gramática que quiera expresar la concordancia de género (2) y número (2) en el sintagma nominal necesita, solo para esa regla, ¿cuántas copias de la regla SN → Det N?', num: 4, tol: 0, fb: '2 × 2 = 4 combinaciones: fem-sg, fem-pl, masc-sg, masc-pl.', lvl: 3 }
  ]);
})();
