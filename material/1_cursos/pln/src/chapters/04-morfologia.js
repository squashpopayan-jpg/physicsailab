/* Capítulo 4 — Morfología */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, M = L.morph;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* Descomposiciones manuales: [pieza, tipo, significado] */
  const MORF = {
    mujeres: [['mujer', 'raíz', 'persona adulta de sexo femenino'], ['-es', 'flexivo', 'número plural']],
    mujer: [['mujer', 'raíz', 'persona adulta de sexo femenino'], ['∅', 'cero', 'número singular (morfema cero)']],
    cantábamos: [['cant-', 'raíz', 'producir sonidos melodiosos con la voz'], ['-aba-', 'flexivo', 'indicativo, pretérito imperfecto'], ['-mos', 'flexivo', 'primera persona del plural']],
    gatitas: [['gat-', 'raíz', 'felino doméstico'], ['-it-', 'derivativo', 'diminutivo'], ['-a-', 'flexivo', 'género femenino'], ['-s', 'flexivo', 'número plural']],
    desconfiadamente: [['des-', 'derivativo', 'negación o inversión'], ['confi-', 'raíz', 'tener fe en algo o alguien'], ['-ad-', 'derivativo', 'participio (adjetivo)'], ['-a-', 'flexivo', 'género femenino'], ['-mente', 'derivativo', 'adverbio de modo']],
    sacacorchos: [['sac-', 'raíz', 'extraer (verbo sacar)'], ['-a-', 'derivativo', 'vocal de enlace del compuesto'], ['corcho', 'raíz', 'tapón de botella'], ['-s', 'flexivo', 'número plural']],
    inconstitucionalmente: [['in-', 'derivativo', 'negación'], ['constitu-', 'raíz', 'constituir, establecer'], ['-ción', 'derivativo', 'sustantivo de acción'], ['-al', 'derivativo', 'adjetivo relacional'], ['-mente', 'derivativo', 'adverbio de modo']],
    comeremos: [['com-', 'raíz', 'ingerir alimento'], ['-er-', 'flexivo', 'infinitivo + futuro'], ['-emos', 'flexivo', 'primera persona del plural, futuro']]
  };
  const COL = { 'raíz': 'c1', flexivo: 'c3', derivativo: 'c4', cero: 'c5' };
  NL.defineSim('morfemas', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Palabra');
    sim.select('w', { label: 'Palabra', options: Object.keys(MORF).map((k) => [k, k]), value: 'cantábamos' });
    sim.out('n', 'Morfemas', { hl: true });
    sim.out('l', 'Lexemas');
    sim.onDraw(() => {
      const p = MORF[sim.p.w];
      box.innerHTML = `<div class="tk-row" style="margin-bottom:10px">${p.map(([m, t]) => `<span class="tk" style="border:2px solid var(--${COL[t]});font-size:16px;padding:6px 12px"><span>${esc(m)}</span><small>${t}</small></span>`).join('')}</div>` +
        `<table class="mx" style="text-align:left"><thead><tr><th style="text-align:left">Pieza</th><th style="text-align:left">Tipo</th><th style="text-align:left">Significado</th></tr></thead><tbody>${p.map(([m, t, s]) => `<tr><td style="text-align:left">${esc(m)}</td><td style="text-align:left;color:var(--${COL[t]});font-weight:700">${t}</td><td style="text-align:left;font-family:var(--font-ui)">${esc(s)}</td></tr>`).join('')}</tbody></table>`;
      sim.set('n', String(p.length)); sim.set('l', String(p.filter(([, t]) => t === 'raíz').length));
    });
  });

  NL.defineSim('analizador', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Palabra');
    const ejemplos = ['vino', 'canto', 'fue', 'sobre', 'cantábamos', 'mujeres', 'nueces', 'canciones', 'lápices', 'autobuses', 'espráis', 'procesaremos', 'azules', 'exámenes', 'trabajadora'];
    sim.select('ej', { label: 'Ejemplos', options: ejemplos.map((e) => [e, e]), value: 'vino', onInput: (v) => { t.set(v, true); t.input.value = v; } });
    const t = sim.text('w', { label: 'O escriba una palabra', value: 'vino' });
    sim.out('n', 'Análisis', { hl: true });
    sim.out('v', 'Formas en el lexicón');
    sim.onDraw(() => {
      const w = (sim.p.w || '').trim();
      const an = w ? M.analizar(w) : [];
      let h = an.length ? `<table class="mx" style="text-align:left"><thead><tr><th style="text-align:left">Nivel léxico (lema + rasgos)</th></tr></thead><tbody>${an.map((a) => `<tr><td style="text-align:left">${esc(a)}</td></tr>`).join('')}</tbody></table>` : `<p style="color:var(--loss);font-weight:600">«${esc(w)}» no está en el lexicón mínimo. Un analizador real lo intentaría con reglas de sufijos.</p>`;
      /* Cascada para formas con alguna regla: buscar la forma intermedia que la origina */
      const casc = [];
      for (const e of M.LEX) {
        for (const f of M.generar(e)) if (f.sup === w.toLowerCase() && f.inter !== f.sup && /[\^#]/.test(f.inter)) { const c = M.cascada(f.inter); if (c.some((x, i) => i && x.s !== c[i - 1].s && i < 4)) casc.push(c); }
      }
      if (casc.length) h += '<small style="color:var(--ink-3)">Cascada de reglas ortográficas (nivel intermedio → superficie)</small>' + casc.slice(0, 2).map((c) => `<div class="tk-row">${c.map((x, i) => `<span class="tk${i && x.s !== c[i - 1].s ? ' on' : ''}"><span>${esc(x.s)}</span><small>${x.regla}</small></span>`).join('<span style="align-self:center">→</span>')}</div>`).join('');
      box.innerHTML = h;
      sim.set('n', String(an.length)); sim.set('v', NL.nf(M.vocabulario()));
    });
  });

  NL.defineSim('conjugador', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const verbos = M.LEX.filter((e) => e.c === 'V' && e.k !== 'irr').map((e) => e.l);
    sim.group('Verbo regular');
    sim.select('v', { label: 'Verbo', options: verbos.map((v) => [v, v]), value: 'cantar' });
    sim.out('a', 'Análisis generados', { hl: true });
    sim.out('d', 'Formas distintas');
    sim.out('en', 'Verbo inglés regular (sing)');
    sim.onDraw(() => {
      const e = M.LEX.find((x) => x.l === sim.p.v);
      const filas = M.conjugar(sim.p.v);
      box.innerHTML = `<table class="mx" style="text-align:left"><thead><tr><th style="text-align:left">Tiempo</th>${['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos'].map((p) => `<th>${p}</th>`).join('')}</tr></thead><tbody>${filas.map(([t, f]) => `<tr><td style="text-align:left;font-family:var(--font-ui)">${t}</td>${f.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>` +
        `<div class="tk-row"><span class="tk"><span>${esc(M.generar(e).find((f) => /\+Inf$/.test(f.lex)).sup)}</span><small>infinitivo</small></span><span class="tk"><span>${esc(M.generar(e).find((f) => /\+Ger$/.test(f.lex)).sup)}</span><small>gerundio</small></span><span class="tk"><span>${esc(M.generar(e).find((f) => /\+Part$/.test(f.lex)).sup)}</span><small>participio</small></span></div>`;
      sim.set('a', String(M.generar(e).length)); sim.set('d', String(M.formasDistintas(e))); sim.set('en', '5 formas');
    });
  });

  NL.bank.add('morfologia', [
    { q: '¿Cuántos morfemas tiene «cantábamos»?', num: 3, tol: 0, fb: 'cant- (lexema), -aba- (indicativo, pretérito imperfecto) y -mos (primera persona del plural).', lvl: 2 },
    { q: 'El lexema de «mujeres» es…', opts: ['-es', 'mujer', 'mujeres', 'mu'], ok: 1, fb: 'El lexema es la raíz con significado léxico; «-es» es el morfema gramatical de plural.', lvl: 1 },
    { q: '¿Qué es un morfema cero?', opts: ['Un morfema sin significado', 'Un morfema gramatical sin realización escrita ni sonora, como el singular de «mujer»', 'Una palabra vacía', 'Un error de ortografía'], ok: 1, fb: 'Tiene significado gramatical (aquí, singular) aunque no se vea.', lvl: 2 },
    { q: '«Gatas» frente a «gato» es un caso de…', opts: ['Derivación', 'Flexión', 'Composición', 'Préstamo'], ok: 1, fb: 'Cambia género y número sin crear una palabra nueva con otro significado léxico.', lvl: 2 },
    { q: '«Sacacorchos» se forma por…', opts: ['Flexión', 'Derivación con prefijo', 'Composición', 'Siglas'], ok: 2, fb: 'Une dos raíces (sacar + corcho).', lvl: 2 },
    { q: 'Las tres piezas necesarias para un analizador morfológico son…', opts: ['Corpus, red neuronal y evaluación', 'Lexicón, hechos morfotácticos y reglas ortográficas', 'Tokenizador, etiquetador y analizador', 'Fonética, fonología y pragmática'], ok: 1, fb: 'El lexicón lista morfemas, la morfotáctica ordena su combinación y las reglas ortográficas modelan los cambios de escritura.', lvl: 1 },
    { q: '«Vino» devuelve dos análisis: verbo «venir» y sustantivo «vino». ¿Cómo se llama este fenómeno?', opts: ['Ambigüedad morfológica', 'Flexión cero', 'Derivación', 'Composición'], ok: 0, fb: 'Se resuelve después con el contexto, mediante el etiquetado morfosintáctico.', lvl: 1 },
    { q: 'Un verbo regular del mini-lexicón genera 45 análisis y 40 formas distintas. ¿Cuántos pares de análisis comparten forma?', num: 5, tol: 0, fb: '45 − 40 = 5 sincretismos, por ejemplo «cantamos» (presente y pretérito).', lvl: 3 },
    { q: '¿Qué hace la regla ortográfica «z → c ante e»?', opts: ['Convierte «nuez^s» en «nueces»', 'Elimina las tildes', 'Inserta una «e» tras consonante', 'Cambia el género'], ok: 0, fb: 'Con la inserción de «e» (nuez^es) la «z» queda ante «e» y se escribe «c».', lvl: 2 },
    { q: '¿Por qué en español hay más variedad morfológica que en inglés?', opts: ['Porque no tiene verbos regulares', 'Porque la flexión funde varios rasgos y hay muchas formas por verbo', 'Porque no tiene sustantivos', 'Porque se escribe con tildes'], ok: 1, fb: 'Un verbo español tiene decenas de formas; uno inglés regular, cinco.', lvl: 2 }
  ]);
})();
