/* Capítulo 17 — Ambigüedad y análisis probabilista (PCFG) */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, G = L.cfg;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const COLS = { S: '--c1', SN: '--c2', SV: '--c3', SP: '--c4' };
  const FR = ['yo vi un elefante en mi pijama', 'el niño vio un gato con un telescopio', 'hombres y mujeres mayores leen', 'el niño ve un gato grande con un telescopio en el parque'];

  NL.defineSim('pcfg', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Árbol sintáctico más probable' });
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('f', { label: 'Oración', options: FR.map((f) => [f, f]), value: FR[0], onInput: () => { sim.ctl.sv.set(30, true); sim.ctl.sn.set(15, true); } });
    sim.group('Pesos de las reglas de adjunción (relativos a las demás del símbolo)');
    sim.slider('sv', { label: 'SV → SV SP (el sintagma cuelga del verbo)', min: 1, max: 80, step: 1, value: 30, fmt: (v) => String(v) });
    sim.slider('sn', { label: 'SN → SN SP (el sintagma cuelga del nombre)', min: 1, max: 80, step: 1, value: 15, fmt: (v) => String(v) });
    sim.out('b', 'Probabilidad del mejor árbol', { hl: true });
    sim.out('t', 'Probabilidad total de la oración');
    sim.out('n', 'Árboles posibles');
    sim.out('q', 'Cuota del mejor árbol');
    sim.onDraw(() => {
      const base = G.TEXTOP.replace('SV -> V [20] | V SN [40] | V Adj [10] | SV SP [30]', `SV -> V [20] | V SN [40] | V Adj [10] | SV SP [${sim.p.sv}]`).replace('SN -> Det N [35] | N [20] | Pron [10] | SN SP [15]', `SN -> Det N [35] | N [20] | Pron [10] | SN SP [${sim.p.sn}]`);
      const g = G.normalizar(G.leer(base)), ws = sim.p.f.split(' ');
      const r = G.cky(g, ws, { prob: 'viterbi', arboles: 20 });
      if (!r.ok) { box.innerHTML = 'Sin análisis'; return; }
      const arb = (r.arboles || []).map((t) => ({ t, lp: G.logpArbol(g, t) })).sort((a, b) => b.lp - a.lp);
      sim.set('b', NL.sci(Math.exp(r.logpMejor), 3)); sim.set('t', NL.sci(Math.exp(r.logpInterior), 3)); sim.set('n', String(r.cuenta)); sim.set('q', NL.pct(Math.exp(r.logpMejor - r.logpInterior), 0));
      NL.drawTree(cv, r.mejor, { color: (s) => COLS[s] || '--ink-2' });
      box.innerHTML = `<small style="color:var(--ink-3)">Árboles y su probabilidad (producto de las probabilidades de sus reglas)</small><table class="mx" style="text-align:left"><tbody>${arb.slice(0, 6).map((x, i) => `<tr><td class="${i === 0 ? 'hl' : ''}" style="text-align:left;white-space:normal;font-size:11.5px">${esc(G.corchetes(x.t))}</td><td>${NL.sci(Math.exp(x.lp), 3)}</td></tr>`).join('')}</tbody></table>${r.cuenta > 6 ? '<p style="font-size:12px;color:var(--ink-3)">… y ' + (r.cuenta - 6) + ' más.</p>' : ''}`;
    });
  });

  /* Estimación por conteo a partir de un treebank */
  const TB = [
    '(S (SN (Det el) (N niño)) (SV (V ve) (SN (Det un) (N gato))))',
    '(S (SN (Pron yo)) (SV (V vi) (SN (Det un) (N elefante))))',
    '(S (SN (Pron yo)) (SV (SV (V vi) (SN (Det un) (N elefante))) (SP (P en) (SN (Det mi) (N pijama)))))',
    '(S (SN (Det la) (N niña)) (SV (V lee) (SN (Det un) (N libro))))',
    '(S (SN (Pron yo)) (SV (V vi) (SN (SN (Det un) (N elefante)) (SP (P en) (SN (Det mi) (N pijama))))))',
    '(S (SN (Det el) (N niño)) (SV (SV (V ve) (SN (Det un) (N gato))) (SP (P con) (SN (Det un) (N telescopio)))))',
    '(S (SN (Det el) (N gato)) (SV (V duerme)))',
    '(S (SN (Det el) (N niño)) (SV (V lee) (SN (SN (Det un) (N libro)) (SP (P de) (SN (Det la) (N niña))))))'
  ];
  const parseTree = (s) => { let i = 0; const rec = () => { i++; let j = i; while (s[j] !== ' ') j++; const sym = s.slice(i, j); i = j + 1; const kids = [sym]; while (s[i] !== ')') { if (s[i] === '(') kids.push(rec()); else { let k = i; while (s[k] !== ' ' && s[k] !== ')') k++; kids.push(s.slice(i, k)); i = k; } if (s[i] === ' ') i++; } i++; return kids; }; return rec(); };
  NL.defineSim('estimar-pcfg', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Treebank');
    sim.slider('n', { label: 'Árboles usados para contar', min: 2, max: TB.length, step: 1, value: TB.length, fmt: (v) => String(v) });
    sim.select('s', { label: 'Símbolo a inspeccionar', options: ['S', 'SN', 'SV', 'SP', 'Det', 'N'].map((x) => [x, x]), value: 'SV' });
    sim.out('r', 'Reglas distintas', { hl: true });
    sim.out('e', 'Entropía de las expansiones del símbolo');
    sim.onDraw(() => {
      const arb = TB.slice(0, sim.p.n).map(parseTree), g = G.estimar(arb, { start: 'S' });
      const mias = g.rules.filter((r) => r.lhs === sim.p.s).sort((a, b) => b.p - a.p);
      sim.set('r', String(g.rules.length)); sim.set('e', NL.fix(-mias.reduce((s, r) => s + r.p * Math.log2(r.p), 0), 3) + ' bits');
      const tot = mias.reduce((s, r) => s + r.c, 0);
      box.innerHTML = `<small style="color:var(--ink-3)">Árboles del treebank (${sim.p.n}); la regla se cuenta cada vez que aparece en un árbol</small><div class="mono-box" style="font-size:11.5px;white-space:pre-wrap">${esc(TB.slice(0, sim.p.n).join('\n'))}</div>` +
        `<table class="mx"><thead><tr><th style="text-align:left">Regla</th><th>C(regla)</th><th>C(${sim.p.s})</th><th>P = C(regla)/C(${sim.p.s})</th></tr></thead><tbody>${mias.map((r) => `<tr><td style="text-align:left">${esc(G.regla({ lhs: r.lhs, rhs: r.rhs, p: null }))}</td><td>${r.c}</td><td>${tot}</td><td class="hl">${NL.fix(r.p, 3)}</td></tr>`).join('')}</tbody></table>`;
    });
  });

  NL.defineSim('parseval', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const REF = '(S (SN (Pron yo)) (SV (SV (V vi) (SN (Det un) (N elefante))) (SP (P en) (SN (Det mi) (N pijama)))))';
    const A = '(S (SN (Pron yo)) (SV (V vi) (SN (SN (Det un) (N elefante)) (SP (P en) (SN (Det mi) (N pijama))))))';
    sim.group('Análisis propuesto por el sistema');
    sim.seg('p', { label: null, options: [['ref', 'Igual a la referencia'], ['alt', 'Con otro colgado del SP']], value: 'alt' });
    sim.out('p', 'Precisión', { hl: true });
    sim.out('r', 'Cobertura');
    sim.out('f', 'F1');
    sim.onDraw(() => {
      const gold = parseTree(REF), pred = parseTree(sim.p.p === 'ref' ? REF : A), m = G.parseval(pred, gold);
      sim.set('p', NL.fix(m.p, 3)); sim.set('r', NL.fix(m.r, 3)); sim.set('f', NL.fix(m.f, 3));
      const fmt = (t) => G.constituyentes(t, 0, []).map(([s, i, j]) => `${s}[${i},${j}]`);
      const cg = fmt(gold), cp = fmt(pred);
      box.innerHTML = `<small style="color:var(--ink-3)">Constituyentes de la referencia</small><div class="tk-row">${cg.map((c) => `<span class="tk ${cp.includes(c) ? 'ok' : 'bad'}"><span>${c}</span></span>`).join('')}</div><small style="color:var(--ink-3)">Constituyentes del sistema</small><div class="tk-row">${cp.map((c) => `<span class="tk ${cg.includes(c) ? 'ok' : 'bad'}"><span>${c}</span></span>`).join('')}</div><p style="margin:6px 0 0">Aciertos: <b>${m.tp}</b> · propuestos: ${m.np} · de referencia: ${m.nr}</p>`;
    });
  });

  NL.bank.add('pcfg', [
    { q: 'En una PCFG, la probabilidad de un árbol es…', opts: ['La suma de las probabilidades de sus reglas', 'El producto de las probabilidades de las reglas usadas', 'La probabilidad de la raíz', 'El número de nodos'], ok: 1, fb: 'Se supone que cada regla se aplica de forma independiente del contexto.', lvl: 2 },
    { q: 'Las probabilidades de las reglas con el mismo símbolo a la izquierda deben…', opts: ['Ser todas iguales', 'Sumar 1', 'Ser menores que 0,5', 'Sumar 100'], ok: 1, fb: 'Son las probabilidades de las posibles expansiones de ese símbolo.', lvl: 1 },
    { q: 'Con un treebank, P(A → β) se estima como…', opts: ['C(A → β) / C(A)', 'C(β) / C(A)', 'C(A) / C(β)', 'C(A → β) / N'], ok: 0, fb: 'Máxima verosimilitud: cuántas veces se usa la regla entre las veces que se expande A.', lvl: 2 },
    { q: 'El algoritmo CKY probabilístico (Viterbi) devuelve…', opts: ['Todos los árboles', 'El árbol de mayor probabilidad', 'El árbol más corto', 'El primero que encuentra'], ok: 1, fb: 'En cada celda guarda la mejor derivación de cada símbolo; el máximo de la celda de S es el mejor árbol.', lvl: 2 },
    { q: 'La probabilidad total de la oración (suma de la de todos los árboles) se calcula con…', opts: ['El algoritmo interior (inside)', 'El perceptrón', 'La distancia de edición', 'El stemmer'], ok: 0, fb: 'Es como CKY con sumas en lugar de máximos.', lvl: 2 },
    { q: 'Sin treebank pero con un analizador no probabilista, las probabilidades se pueden estimar con…', opts: ['El algoritmo inside-outside (un caso de EM)', 'La ley de Zipf', 'Viterbi', 'Autómatas finitos'], ok: 0, fb: 'Se parte de probabilidades iguales y se reestiman hasta que convergen (Baker, 1979).', lvl: 3 },
    { q: 'Una limitación de las PCFG básicas es…', opts: ['Que ignoran las palabras concretas: «ve un gato con» y «ve un gato en» se tratan igual', 'Que no permiten recursión', 'Que no se pueden entrenar', 'Que solo funcionan en inglés'], ok: 0, fb: 'Las PCFG lexicalizadas y las neuronales corrigen la falta de sensibilidad al léxico y al contexto.', lvl: 3 },
    { q: 'PARSEVAL compara el árbol del sistema con el de referencia midiendo…', opts: ['Solo la raíz', 'Precisión, cobertura y F1 de los constituyentes (símbolo y rango de palabras)', 'La longitud del árbol', 'La proyectividad'], ok: 1, fb: 'Un constituyente cuenta si coinciden el símbolo y los límites.', lvl: 2 },
    { q: 'Un árbol propuesto tiene 7 constituyentes, 5 coinciden con los 7 de la referencia. ¿Cuánto vale F1 (3 decimales)?', num: 0.714, tol: 0.001, fb: 'P = R = 5/7 = 0,714, luego F1 = 0,714.', lvl: 3 },
    { q: 'Sobre la ambigüedad de colgado del sintagma preposicional, un modelo probabilista prefiere…', opts: ['Siempre el verbo', 'El análisis cuyo producto de probabilidades de reglas es mayor, que depende de los pesos aprendidos', 'Siempre el nombre', 'El primero'], ok: 1, fb: 'En la simulación, cambiar los pesos de SV → SV SP y SN → SN SP invierte la preferencia.', lvl: 2 }
  ]);
})();
