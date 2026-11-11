/* Capítulo 25 — Modelos de lenguaje de n-gramas */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, M = L.lm;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const MODS = {};
  const modelo = (n) => MODS[n] || (MODS[n] = M.ajustar(L.corpus.lm.train, n));
  const METODOS = [['mle', 'Máxima verosimilitud'], ['laplace', 'Laplace (add-k)'], ['interp', 'Interpolación lineal'], ['kn', 'Kneser–Ney interpolado']];
  const LAMS = { 1: [0.05, 0.95], 2: [0.02, 0.18, 0.80], 3: [0.01, 0.09, 0.30, 0.60] };
  const opciones = (p) => ({ metodo: p.m, k: p.k, d: p.d, lambdas: LAMS[p.n] });
  const bits = (p) => (p > 0 ? NL.fix(-Math.log2(p), 2) : '∞');
  const palabras = (txt) => txt.toLowerCase().match(/[a-záéíóúüñ]+/g) || [];

  /* ---- 1. ¿Qué palabra viene después? ---- */
  NL.defineSim('lm-siguiente', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    let semilla = 11;
    sim.group('Contexto');
    sim.text('t', { label: 'Comienzo de la frase', value: 'el presidente del' });
    sim.group('Modelo');
    sim.seg('n', { label: 'Orden', options: [['1', 'Unigrama'], ['2', 'Bigrama'], ['3', 'Trigrama']], value: '3' });
    sim.select('m', { label: 'Estimación', options: METODOS, value: 'kn' });
    sim.slider('k', { label: 'Suavizado de Laplace k', min: 0.01, max: 1, step: 0.01, value: 0.1, fmt: (v) => NL.fix(v, 2) });
    sim.slider('d', { label: 'Descuento D de Kneser–Ney', min: 0.1, max: 0.99, step: 0.01, value: 0.75, fmt: (v) => NL.fix(v, 2) });
    sim.button('Generar una frase', () => { semilla += 17; });
    sim.out('c', 'Veces vista la historia', { hl: true });
    sim.out('g', 'Frase generada');
    sim.onDraw(() => {
      const n = +sim.p.n, mod = modelo(n), o = Object.assign(opciones({ m: sim.p.m, k: sim.p.k, d: sim.p.d, n }), { orden: n });
      const ws = M.mapear(mod, sim.p.t), h = Array(n - 1).fill(M.S).concat(ws), hh = h.slice(Math.max(0, h.length - (n - 1)));
      const ctx = hh.join(' ');
      sim.set('c', n === 1 ? String(mod.ctx[1].get('')) : String(mod.ctx[n].get(ctx) || 0));
      const dist = M.distribucion(mod, h, o).filter((x) => x[0] !== M.S).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
      const suma = dist.reduce((s, x) => s + x[1], 0), mx = dist.length ? dist[0][1] : 1;
      let rs = semilla; const rng = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
      sim.set('g', (ws.concat(M.generar(mod, rng, Object.assign({}, o, { inicio: ws, max: 16 })).slice(ws.length))).join(' ') || '—');
      box.innerHTML = `<small style="color:var(--ink-3)">Historia (últimas ${n - 1} palabra${n === 2 ? '' : 's'}): <b>${esc(ctx || '(ninguna)')}</b> · las probabilidades suman ${NL.fix(suma, 3)} sobre el vocabulario de ${mod.V}</small>` +
        (dist.length ? `<table class="mx"><thead><tr><th style="text-align:left">Palabra siguiente</th><th>P</th><th style="text-align:left"></th></tr></thead><tbody>${dist.slice(0, 10).map(([w, p], i) => `<tr><td style="text-align:left">${esc(w)}</td><td class="${i === 0 ? 'hl' : ''}">${NL.fix(p, 4)}</td><td style="text-align:left"><span style="display:inline-block;height:9px;width:${Math.round(150 * p / mx)}px;background:var(--c1,#4c78a8);border-radius:2px"></span></td></tr>`).join('')}</tbody></table>` : '<p>Con la máxima verosimilitud esta historia no se vio nunca: no hay ninguna palabra con probabilidad mayor que cero.</p>');
    });
  });

  /* ---- 2. Perplejidad de una oración y de la prueba ---- */
  NL.defineSim('lm-perplejidad', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Oración');
    sim.text('t', { label: 'Oración', value: 'el gobierno dijo que la situación es muy grave' });
    sim.group('Modelo');
    sim.seg('n', { label: 'Orden', options: [['1', 'Unigrama'], ['2', 'Bigrama'], ['3', 'Trigrama']], value: '2' });
    sim.select('m', { label: 'Estimación', options: METODOS, value: 'kn' });
    sim.slider('k', { label: 'Suavizado de Laplace k', min: 0.01, max: 1, step: 0.01, value: 0.1, fmt: (v) => NL.fix(v, 2) });
    sim.slider('d', { label: 'Descuento D de Kneser–Ney', min: 0.1, max: 0.99, step: 0.01, value: 0.75, fmt: (v) => NL.fix(v, 2) });
    sim.out('p', 'Perplejidad de la oración', { hl: true });
    sim.out('e', 'Perplejidad en las 300 oraciones de prueba');
    sim.onDraw(() => {
      const n = +sim.p.n, mod = modelo(n), o = Object.assign(opciones({ m: sim.p.m, k: sim.p.k, d: sim.p.d, n }), { orden: n });
      const ws = M.mapear(mod, palabras(sim.p.t).join(' ')), t = Array(n - 1).fill(M.S).concat(ws, [M.E]);
      let lp = 0, cero = false; const filas = [];
      for (let i = n - 1; i < t.length; i++) {
        const p = M.prob(mod, t[i], t.slice(0, i), o); if (p > 0) lp += Math.log(p); else cero = true;
        filas.push([t[i], p]);
      }
      const N = t.length - (n - 1), pp = cero ? Infinity : Math.exp(-lp / N);
      const ev = M.perplejidad(mod, L.corpus.lm.test, o);
      sim.set('p', isFinite(pp) ? NL.fix(pp, 1) : '∞'); sim.set('e', isFinite(ev.pp) ? NL.fix(ev.pp, 1) : '∞');
      box.innerHTML = `<table class="mx"><thead><tr><th style="text-align:left">Palabra</th><th>P(palabra | historia)</th><th>Sorpresa −log₂ P (bits)</th></tr></thead><tbody>${filas.map(([w, p]) => `<tr><td style="text-align:left">${esc(w)}${w === M.U ? ' <small>(desconocida)</small>' : ''}</td><td class="${p === 0 ? 'bad' : ''}">${p > 0 ? NL.sci(p, 2) : '0'}</td><td>${bits(p)}</td></tr>`).join('')}</tbody></table>` +
        `<p style="margin:6px 0 0">Entropía por palabra: <b>${isFinite(pp) ? NL.fix(Math.log2(pp), 2) : '∞'}</b> bits; perplejidad = 2<sup>entropía</sup> = <b>${isFinite(pp) ? NL.fix(pp, 1) : '∞'}</b>. En la prueba completa: ${ev.n} palabras, ${ev.desconocidas} desconocidas (${NL.pct(ev.desconocidas / ev.n, 1)}).</p>`;
    });
  });

  NL.bank.add('modelos-lenguaje', [
    { q: 'Un modelo de lenguaje asigna…', opts: ['Una categoría gramatical a cada palabra', 'Una probabilidad a cada secuencia de palabras', 'Un sentido a cada palabra', 'Un árbol a cada oración'], ok: 1, fb: 'P(w₁…wₙ), que por la regla de la cadena es el producto de P(wᵢ | w₁…wᵢ₋₁).', lvl: 1 },
    { q: 'La hipótesis de Markov de un modelo de bigramas dice que P(wᵢ | historia) ≈ …', opts: ['P(wᵢ | wᵢ₋₁)', 'P(wᵢ)', 'P(wᵢ | w₁)', 'P(wᵢ₋₁ | wᵢ)'], ok: 0, fb: 'Solo cuenta la palabra anterior. En un trigrama, las dos anteriores.', lvl: 1 },
    { q: 'En la estimación de máxima verosimilitud de un bigrama, P(b | a) = …', opts: ['C(a b) / C(a)', 'C(a) / C(a b)', 'C(b) / N', 'C(a b) / N'], ok: 0, fb: 'Cuántas veces a continúa con b entre las veces que aparece a.', lvl: 1 },
    { q: 'En el corpus de entrenamiento, «el niño» aparece 3 veces y «el» aparece 60. ¿Cuánto vale P(niño | el) con máxima verosimilitud?', num: 0.05, tol: 0.001, fb: '3/60 = 0,05.', lvl: 1 },
    { q: 'El problema de ceros de la máxima verosimilitud es que…', opts: ['Los n-gramas no vistos en el entrenamiento reciben probabilidad 0 y la oración entera también', 'Las probabilidades suman más de 1', 'Ocupa demasiada memoria', 'Solo afecta al inglés'], ok: 0, fb: 'Con trigramas, la perplejidad de prueba de MLE es infinita: siempre hay combinaciones nuevas.', lvl: 2 },
    { q: 'El suavizado de Laplace (add-1) con vocabulario V calcula P(b | a) = …', opts: ['(C(a b) + 1) / (C(a) + V)', '(C(a b) + 1) / C(a)', 'C(a b) / (C(a) + V)', '(C(a b) + V) / (C(a) + 1)'], ok: 0, fb: 'Suma 1 a cada posible continuación; el denominador suma V.', lvl: 2 },
    { q: 'Laplace con k = 1 funciona mal en n-gramas de orden alto porque…', opts: ['Reparte demasiada masa a los n-gramas no vistos (en el curso, el trigrama pasa de 907 con k = 0,1 a 1.614 con k = 1)', 'Es demasiado complicado', 'Solo sirve para unigramas', 'No suma 1'], ok: 0, fb: 'Casi todos los trigramas posibles son nunca vistos y se llevan casi toda la probabilidad.', lvl: 3 },
    { q: 'La perplejidad de un modelo en un texto de prueba es…', opts: ['La exponencial de la entropía cruzada por palabra: cuanto menor, mejor', 'El número de palabras', 'La probabilidad máxima', 'El número de n-gramas'], ok: 0, fb: 'PP = P(w₁…wₙ)^(−1/n). Se interpreta como el número efectivo de opciones entre las que duda el modelo en cada palabra.', lvl: 2 },
    { q: 'Un modelo que asigna probabilidad 1/100 a cada palabra tiene una perplejidad de…', num: 100, tol: 0.01, fb: 'PP = (1/100)^(−1) = 100: duda entre 100 opciones equiprobables.', lvl: 2 },
    { q: 'La idea central de Kneser–Ney es que, al retroceder a un orden inferior, la palabra se pondera por…', opts: ['El número de contextos distintos en que aparece (su versatilidad), no por su frecuencia bruta', 'Su longitud', 'Su categoría', 'Su posición'], ok: 0, fb: '«Francisco» es frecuente pero casi siempre sigue a «San»: como continuación en un contexto nuevo, es improbable.', lvl: 3 }
  ]);
})();
