/* Capítulo 18 — Significado y lógica de primer orden */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, F = L.fol, S = L.sem;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const nom = (d) => ({ marta: 'Marta', juan: 'Juan', ana: 'Ana', libroa: 'libro A', librob: 'libro B' }[d] || d);

  /* Tres «mundos» con los mismos individuos y distinto reparto de lecturas */
  const DOM = ['marta', 'juan', 'ana', 'libroa', 'librob'];
  const MODELOS = {
    A: { t: 'A · cada cual lee un libro (Marta y Ana el A, Juan el B)', lee: [['marta', 'libroa'], ['juan', 'librob'], ['ana', 'libroa']] },
    B: { t: 'B · todos leen el mismo libro (el A)', lee: [['marta', 'libroa'], ['juan', 'libroa'], ['ana', 'libroa']] },
    C: { t: 'C · Ana no lee nada', lee: [['marta', 'libroa'], ['juan', 'librob']] }
  };
  const modelo = (id) => F.modelo({
    dominio: DOM, cte: { marta: 'marta', juan: 'juan', ana: 'ana', libroa: 'libroa', librob: 'librob' },
    pred: { estudiante: ['marta', 'juan', 'ana'], libro: ['libroa', 'librob'], lee: MODELOS[id].lee, duerme: ['ana'], profesor: [], gato: [], ve: [] }
  });
  NL.mundos = { ids: Object.keys(MODELOS), modelo };
  const dibujaModelo = (id) => {
    const M = MODELOS[id];
    return `<table class="mx"><tbody><tr><td style="text-align:left"><b>Dominio</b></td><td style="text-align:left">${DOM.map(nom).join(', ')}</td></tr>` +
      `<tr><td style="text-align:left"><b>estudiante</b></td><td style="text-align:left">{Marta, Juan, Ana}</td></tr>` +
      `<tr><td style="text-align:left"><b>libro</b></td><td style="text-align:left">{libro A, libro B}</td></tr>` +
      `<tr><td style="text-align:left"><b>lee</b></td><td style="text-align:left">{${M.lee.map(([a, b]) => '(' + nom(a) + ', ' + nom(b) + ')').join(', ')}}</td></tr></tbody></table>`;
  };

  const FORMULAS = [
    ['all x.(estudiante(x) -> exists y.(libro(y) & lee(x,y)))', 'Todo estudiante lee algún libro'],
    ['exists y.(libro(y) & all x.(estudiante(x) -> lee(x,y)))', 'Hay un libro que todos los estudiantes leen'],
    ['exists x.(estudiante(x) & -exists y.(libro(y) & lee(x,y)))', 'Algún estudiante no lee ningún libro'],
    ['all x.(lee(marta,x) -> libro(x))', 'Marta solo lee libros'],
    ['lee(marta,libroa)', 'Marta lee el libro A'],
    ['exists x.(estudiante(x) & lee(x,librob))', 'Alguien lee el libro B'],
    ['all x.estudiante(x)', 'Todo individuo del dominio es estudiante']
  ];

  /* ---- 1. Evaluar una fórmula en un modelo ---- */
  NL.defineSim('fol-modelo', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Mundo (modelo)');
    sim.select('m', { label: 'Modelo', options: Object.keys(MODELOS).map((k) => [k, MODELOS[k].t]), value: 'A' });
    sim.group('Fórmula');
    sim.select('f', { label: 'Fórmula de la lista', options: FORMULAS.map(([f, d], i) => [String(i), d]), value: '0' });
    sim.text('o', { label: 'O escriba otra (sintaxis de NLTK: all x.(…), exists y.(…), -, &, |, ->)', value: '' });
    sim.out('v', 'Valor de verdad', { hl: true });
    sim.onDraw(() => {
      const raw = (sim.p.o || '').trim() || FORMULAS[+sim.p.f][0];
      let html = `<small style="color:var(--ink-3)">Mundo elegido</small>${dibujaModelo(sim.p.m)}`;
      try {
        const f = F.parsear(raw), m = modelo(sim.p.m);
        const libres = Array.from(F.libres(f));
        if (libres.length) throw new Error('la fórmula tiene variables libres: ' + libres.join(', '));
        const v = F.evaluar(m, f);
        sim.set('v', v ? 'verdadera' : 'falsa');
        html += `<p style="margin:8px 0 2px"><b>Fórmula</b>: <span class="mono">${esc(F.texto(f))}</span></p>`;
        if (f.t === 'all' || f.t === 'exists') {
          const filas = DOM.map((d) => [d, F.evaluar(m, f.a, { [f.v]: d })]);
          html += `<small style="color:var(--ink-3)">Cuerpo de la fórmula con ${esc(f.v)} = cada individuo (${f.t === 'all' ? '∀ pide que todos den verdadero' : '∃ pide que alguno dé verdadero'})</small><div class="tk-row">${filas.map(([d, b]) => `<span class="tk ${b ? 'ok' : 'bad'}"><span>${nom(d)}: ${b ? 'V' : 'F'}</span></span>`).join('')}</div>`;
        }
        html += `<p style="margin:6px 0 0">En este mundo la fórmula es <b>${v ? 'verdadera' : 'falsa'}</b>.</p>`;
      } catch (e) {
        sim.set('v', 'error');
        html += `<p style="color:var(--bad,#b3261e)">No se pudo evaluar: ${esc(e.message)}</p>`;
      }
      box.innerHTML = html;
    });
  });

  /* ---- 2. Dos lecturas de una oración con dos cuantificadores ---- */
  const FRASES = ['todo estudiante lee un libro', 'un estudiante lee todo libro', 'ningún estudiante lee un libro', 'marta lee un libro'];
  NL.defineSim('fol-lecturas', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('f', { label: 'Oración', options: FRASES.map((f) => [f, f]), value: FRASES[0] });
    sim.out('d', '¿Las dos lecturas son equivalentes en los tres mundos?', { hl: true });
    sim.onDraw(() => {
      const lect = ['sujeto', 'objeto'].map((l) => {
        const r = S.analizar(sim.p.f, l);
        const f = F.parsear(r.canon);
        return { l, r, f, vals: Object.keys(MODELOS).map((k) => F.evaluar(modelo(k), f)) };
      });
      const dif = lect[0].vals.some((v, i) => v !== lect[1].vals[i]);
      sim.set('d', dif ? 'No: hay un mundo que las separa' : 'Sí (en estos tres mundos)');
      const nombres = { sujeto: 'El cuantificador del sujeto abarca al del objeto', objeto: 'El cuantificador del objeto abarca al del sujeto' };
      box.innerHTML = `<table class="mx" style="text-align:left"><thead><tr><th style="text-align:left">Lectura</th><th>Mundo A</th><th>Mundo B</th><th>Mundo C</th></tr></thead><tbody>` +
        lect.map((x) => `<tr><td style="text-align:left;white-space:normal"><b>${nombres[x.l]}</b><br><span class="mono" style="font-size:11.5px">${esc(F.texto(x.f))}</span></td>${x.vals.map((v) => `<td class="${v ? 'hl' : ''}">${v ? 'V' : 'F'}</td>`).join('')}</tr>`).join('') +
        `</tbody></table><small style="color:var(--ink-3)">La fórmula sale de componer, regla a regla, el significado de las palabras con λ-cálculo (se verá en el capítulo 20). Los mundos son los de la simulación anterior.</small>` +
        Object.keys(MODELOS).map((k) => `<details style="margin-top:6px"><summary>Mundo ${k}</summary>${dibujaModelo(k)}</details>`).join('');
    });
  });

  /* ---- 3. ¿Se sigue la conclusión? Búsqueda de contramodelos ---- */
  const CONSEC = [
    { t: 'Modus ponens con cuantificador', p: ['all x.(estudiante(x) -> persona(x))', 'estudiante(marta)'], c: 'persona(marta)' },
    { t: 'De «todos leen alguno» a «alguno lo leen todos»', p: ['all x.exists y.lee(x,y)'], c: 'exists y.all x.lee(x,y)' },
    { t: 'De «alguno lo leen todos» a «todos leen alguno»', p: ['exists y.all x.lee(x,y)'], c: 'all x.exists y.lee(x,y)' },
    { t: 'Afirmar el consecuente', p: ['all x.(estudiante(x) -> persona(x))', 'persona(marta)'], c: 'estudiante(marta)' },
    { t: 'Todo estudiante es persona ⊢ existe un estudiante', p: ['all x.(estudiante(x) -> persona(x))'], c: 'exists x.estudiante(x)' },
    { t: 'Negar un cuantificador universal', p: ['-all x.estudiante(x)'], c: 'exists x.-estudiante(x)' }
  ];
  const vocabDe = (fs) => {
    const pred = {}, cte = new Set();
    const term = (x) => { if (x.t === 'cte') cte.add(x.n); else if (x.t === 'fn') x.args.forEach(term); };
    const rec = (f) => {
      if (f.t === 'pred') { pred[f.n] = f.args.length; f.args.forEach(term); } else if (f.t === 'eq') { term(f.a); term(f.b); } else if (f.a) { rec(f.a); if (f.b) rec(f.b); }
    };
    fs.forEach((s) => rec(F.parsear(s)));
    return { pred, cte: Array.from(cte) };
  };
  NL.defineSim('fol-consecuencia', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Argumento');
    sim.select('a', { label: 'Argumento', options: CONSEC.map((x, i) => [String(i), x.t]), value: '1' });
    sim.slider('n', { label: 'Tamaño máximo del dominio que se explora', min: 1, max: 3, step: 1, value: 2, fmt: (v) => String(v) });
    sim.out('r', 'Resultado', { hl: true });
    sim.onDraw(() => {
      const a = CONSEC[+sim.p.a], voc = vocabDe(a.p.concat([a.c]));
      const t0 = performance.now(), m = F.contramodelo(a.p, a.c, voc, sim.p.n), ms = Math.round(performance.now() - t0);
      const lista = a.p.map((x) => F.texto(F.parsear(x))).concat(['⊢ ' + F.texto(F.parsear(a.c))]);
      let html = `<div class="mono-box" style="font-size:12px;white-space:pre-wrap">${esc(lista.join('\n'))}</div>`;
      if (m) {
        sim.set('r', 'NO se sigue: contramodelo');
        const ext = Object.entries(m.pred).map(([p, s]) => `<tr><td style="text-align:left"><b>${esc(p)}</b></td><td style="text-align:left">{${Array.from(s).map((t) => '(' + t.split('|').join(', ') + ')').join(', ')}}</td></tr>`).join('');
        const ct = Object.entries(m.cte).map(([c, d]) => `${esc(c)} → ${d}`).join(', ');
        html += `<p style="margin:6px 0 2px">Hay un mundo con ${m.dominio.length} individuo(s) en el que las premisas son verdaderas y la conclusión falsa:</p><table class="mx"><tbody><tr><td style="text-align:left"><b>Dominio</b></td><td style="text-align:left">${m.dominio.join(', ')}${ct ? ' · ' + ct : ''}</td></tr>${ext}</tbody></table>`;
      } else {
        sim.set('r', `no se halló contramodelo (hasta ${sim.p.n})`);
        html += `<p style="margin:6px 0 2px">Ningún mundo de hasta ${sim.p.n} individuo(s) separa premisas y conclusión. <b>No es una demostración</b>: puede existir un contramodelo mayor. Si el argumento es válido (como el modus ponens) nunca aparecerá ninguno.</p>`;
      }
      box.innerHTML = html + `<small style="color:var(--ink-3)">Búsqueda exhaustiva en ${ms} ms.</small>`;
    });
  });

  /* ---- 4. Tablas de verdad ---- */
  const PROP = [
    ['p -> q', 'Implicación'], ['-p | q', 'Su equivalente con disyunción'], ['-(p & q) <-> (-p | -q)', 'Ley de De Morgan'],
    ['p -> (q -> p)', 'Una tautología'], ['p & -p', 'Una contradicción'], ['(p -> q) -> (q -> p)', 'Afirmar el consecuente (¿tautología?)'], ['(p -> q) & (q -> r) -> (p -> r)', 'Silogismo hipotético']
  ];
  NL.defineSim('tabla-verdad', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Fórmula proposicional');
    sim.select('f', { label: 'Fórmula de la lista', options: PROP.map(([f, d], i) => [String(i), d + ' — ' + f]), value: '2' });
    sim.text('o', { label: 'O escriba otra con las letras p, q, r…', value: '' });
    sim.out('c', 'Clasificación', { hl: true });
    sim.out('m', 'Filas verdaderas');
    sim.onDraw(() => {
      const raw = (sim.p.o || '').trim() || PROP[+sim.p.f][0];
      try {
        const f = F.parsear(raw), t = F.tabla(f);
        if (!t.atomos.length) throw new Error('no hay letras proposicionales');
        if (t.atomos.length > 5) throw new Error('máximo cinco letras');
        const cl = t.modelos === t.filas.length ? 'tautología (siempre verdadera)' : t.modelos === 0 ? 'contradicción (siempre falsa)' : 'contingente';
        sim.set('c', cl); sim.set('m', t.modelos + ' de ' + t.filas.length);
        box.innerHTML = `<p style="margin:0 0 4px"><span class="mono">${esc(F.texto(f))}</span></p><table class="mx"><thead><tr>${t.atomos.map((a) => `<th>${esc(a)}</th>`).join('')}<th>valor</th></tr></thead><tbody>` +
          t.filas.map((r) => `<tr>${t.atomos.map((a) => `<td>${r.v[a] ? 'V' : 'F'}</td>`).join('')}<td class="${r.valor ? 'hl' : ''}">${r.valor ? 'V' : 'F'}</td></tr>`).join('') + '</tbody></table>';
      } catch (e) { sim.set('c', 'error'); sim.set('m', '—'); box.innerHTML = `<p style="color:var(--bad,#b3261e)">${esc(e.message)}</p>`; }
    });
  });

  NL.bank.add('semantica-fol', [
    { q: 'Una representación del significado debe ser verificable. Esto quiere decir que…', opts: ['Se puede comparar con un conocimiento del mundo para decidir si la oración es verdadera', 'Tiene pocas palabras', 'Está escrita en inglés', 'Se puede traducir'], ok: 0, fb: 'Verificabilidad: poder contrastar la representación con una base de conocimiento, por ejemplo con una consulta.', lvl: 1 },
    { q: '¿Cuál de estas NO es una de las estrategias clásicas de representación del significado?', opts: ['Lógica de primer orden', 'Redes semánticas', 'Marcos (frames)', 'Etiquetado morfológico'], ok: 3, fb: 'El etiquetado morfológico es análisis de palabras; las otras tres representan significado.', lvl: 1 },
    { q: 'En «∀x (estudiante(x) → persona(x))», la flecha es…', opts: ['Una implicación material', 'Una disyunción', 'Una igualdad', 'Un cuantificador'], ok: 0, fb: 'P → Q es falsa solo cuando P es verdadera y Q falsa.', lvl: 1 },
    { q: '«Todo estudiante lee un libro» tiene dos lecturas lógicas porque…', opts: ['Tiene un verbo', 'Hay dos cuantificadores y su orden de alcance no se fija en la oración', 'La oración está mal escrita', 'Es una oración pasiva'], ok: 1, fb: '∀x∃y (cada uno el suyo) frente a ∃y∀x (el mismo para todos).', lvl: 2 },
    { q: 'Si «∃y∀x lee(x,y)» es verdadera en un modelo, entonces «∀x∃y lee(x,y)» en ese mismo modelo es…', opts: ['Siempre verdadera', 'Siempre falsa', 'Puede ser cualquiera', 'No tiene valor'], ok: 0, fb: 'Quien tiene un libro común a todos, tiene un libro para cada uno. El recíproco no vale.', lvl: 2 },
    { q: 'Un contramodelo de un argumento es un mundo en el que…', opts: ['Todas las premisas y la conclusión son verdaderas', 'Las premisas son verdaderas y la conclusión es falsa', 'Las premisas son falsas', 'No hay individuos'], ok: 1, fb: 'Si existe, el argumento no es válido; si no existe ninguno, la conclusión es consecuencia lógica.', lvl: 2 },
    { q: 'El argumento «todo estudiante es persona; Marta es persona; luego Marta es estudiante» es…', opts: ['Válido (modus ponens)', 'Inválido (afirmación del consecuente)', 'Válido por ser universal', 'Una contradicción'], ok: 1, fb: 'Un mundo donde Marta sea persona pero no estudiante lo refuta.', lvl: 2 },
    { q: 'Una fórmula proposicional con 3 letras tiene una tabla de verdad con…', num: 8, tol: 0, fb: '2³ = 8 filas.', lvl: 1 },
    { q: 'Sobre la lógica de primer orden, su demostración automática es…', opts: ['Decidible siempre', 'Semidecidible: si la conclusión se sigue, un demostrador completo acaba por hallar la prueba; si no, puede no terminar', 'Imposible', 'Siempre más rápida que la proposicional'], ok: 1, fb: 'Teorema de Church (1936): no hay algoritmo que decida la validez en lógica de primer orden.', lvl: 3 },
    { q: 'Para «Marta lee un libro en la biblioteca», la representación con eventos de Davidson usa…', opts: ['Un predicado nuevo para cada complemento', 'Una variable de evento e con predicados: ∃e (lee(e, marta, libro) ∧ lugar(e, biblioteca))', 'Dos oraciones separadas', 'Una tabla de verdad'], ok: 1, fb: 'Con el evento como individuo, los complementos opcionales se añaden como conjuntos de condiciones y se mantiene la inferencia «si lee en la biblioteca, lee».', lvl: 3 },
    { q: 'En el modelo de dominio {Marta, Juan, Ana, libro A, libro B}, ¿es verdadera «∀x estudiante(x)»?', opts: ['Sí, porque hay estudiantes', 'No, porque también están los libros', 'Depende de la asignación', 'No tiene valor'], ok: 1, fb: 'El cuantificador recorre todo el dominio, no solo los estudiantes. Por eso se escribe ∀x (estudiante(x) → …).', lvl: 2 }
  ]);
})();
