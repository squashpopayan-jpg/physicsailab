/* Capítulo 9 — Categorías gramaticales y juegos de etiquetas */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, H = L.hmm;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* Decodificador de etiquetas EAGLES (según el manual PAROLE para el español) */
  const G = { m: 'masculino', f: 'femenino', c: 'común (m. o f.)', n: 'neutro', 0: '—' }, N = { s: 'singular', p: 'plural', n: 'invariable', 0: '—' };
  function decodificar(t) {
    const c = t[0], r = [];
    const f = (pos, nombre, tabla) => { const v = t[pos]; if (v === undefined) return; r.push([pos + 1, nombre, v, tabla ? (tabla[v] || '(ver manual)') : v]); };
    const cat = { n: 'sustantivo', v: 'verbo', a: 'adjetivo', d: 'determinante', p: 'pronombre', r: 'adverbio', s: 'adposición (preposición)', c: 'conjunción', Z: 'cifra', W: 'fecha', i: 'interjección', F: 'puntuación', I: 'interjección' }[c] || 'otro';
    r.push([1, 'categoría', c, cat]);
    if (c === 'n') { f(1, 'tipo', { c: 'común', p: 'propio' }); f(2, 'género', G); f(3, 'número', N); if (t.startsWith('np')) f(6, 'clase semántica', { p: 'persona', l: 'lugar', o: 'organización', a: 'otros' }); }
    else if (c === 'v') { f(1, 'tipo', { m: 'principal', a: 'auxiliar (haber)', s: 'semiauxiliar (ser, estar)' }); f(2, 'modo', { i: 'indicativo', s: 'subjuntivo', m: 'imperativo', n: 'infinitivo', g: 'gerundio', p: 'participio' }); f(3, 'tiempo', { p: 'presente', i: 'imperfecto', f: 'futuro', s: 'pretérito perfecto simple', c: 'condicional' }); f(4, 'persona', { 1: 'primera', 2: 'segunda', 3: 'tercera', 0: '—' }); f(5, 'número', N); f(6, 'género', G); }
    else if (c === 'a') { f(1, 'tipo', { q: 'calificativo', o: 'ordinal' }); f(3, 'género', G); f(4, 'número', N); f(5, 'función', { p: 'participio', 0: '—' }); }
    else if (c === 'd') { f(1, 'tipo', { a: 'artículo', d: 'demostrativo', i: 'indefinido', p: 'posesivo', t: 'interrogativo', e: 'exclamativo', n: 'numeral' }); f(2, 'persona', { 1: 'primera', 2: 'segunda', 3: 'tercera', 0: '—' }); f(3, 'género', G); f(4, 'número', N); }
    else if (c === 'p') { f(1, 'tipo', { p: 'personal', d: 'demostrativo', x: 'posesivo', i: 'indefinido', t: 'interrogativo', r: 'relativo', e: 'exclamativo', 0: 'clítico u otro' }); f(2, 'persona', { 1: 'primera', 2: 'segunda', 3: 'tercera', 0: '—' }); f(3, 'género', G); f(4, 'número', N); }
    else if (c === 'r') f(1, 'tipo', { g: 'general', n: 'negación' });
    else if (c === 's') { f(1, 'tipo', { p: 'preposición', c: 'preposición contraída (del, al)' }); }
    else if (c === 'c') r.push([2, 'tipo', t[1], { c: 'coordinante', s: 'subordinante' }[t[1]] || '']);
    else if (c === 'F') r.push([2, 'signo', t.slice(1), { c: 'coma', p: 'punto', e: 'comillas', g: 'guion', d: 'dos puntos', pa: 'paréntesis que abre', pt: 'paréntesis que cierra', x: 'punto y coma', i: 'interrogación', ia: 'interrogación inicial', t: 'exclamación', at: 'exclamación inicial' }[t.slice(1)] || '(otro signo)']);
    return r;
  }
  NL.defineSim('etiquetas', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const fin = L.corpus.cessMeta.finas;
    sim.group('Etiqueta');
    sim.select('e', { label: '60 más frecuentes', options: fin.map(([t, n]) => [t, `${t}  (${n.toLocaleString('es')})`]), value: 'ncms000', onInput: (v) => { w.set(v, true); w.input.value = v; } });
    const w = sim.text('w', { label: 'O escriba una etiqueta', value: 'ncms000' });
    sim.out('g', 'Etiqueta gruesa', { hl: true });
    sim.out('p', 'Frecuencia en CESS-ESP');
    sim.onDraw(() => {
      const t = (sim.p.w || '').trim();
      if (!t) { box.innerHTML = ''; return; }
      const r = decodificar(t), n = (fin.find((x) => x[0] === t) || [0, 0])[1];
      sim.set('g', H.coarse(t)); sim.set('p', n ? NL.nf(n) + ' de ' + NL.nf(L.corpus.cessMeta.tokens) : 'no está entre las 60 más frecuentes');
      box.innerHTML = `<div class="tk-row">${t.split('').map((ch, i) => `<span class="tk c${i % 6}"><span style="font-size:17px">${esc(ch)}</span><small>pos. ${i + 1}</small></span>`).join('')}</div>` +
        `<table class="mx" style="text-align:left"><thead><tr><th>pos.</th><th style="text-align:left">Campo</th><th>valor</th><th style="text-align:left">Significado</th></tr></thead><tbody>${r.map(([p, c, v, s]) => `<tr><td>${p}</td><td style="text-align:left;font-family:var(--font-ui)">${c}</td><td>${esc(v)}</td><td style="text-align:left;font-family:var(--font-ui)">${esc(s)}</td></tr>`).join('')}</tbody></table>`;
    });
  });

  const COL = { NOUN: '--c2', VERB: '--c1', ADJ: '--c3', DET: '--c6', PRON: '--c5', ADP: '--c4', ADV: '--c7', CONJ: '--ink-3', PROPN: '--k5', PUNCT: '--rule-strong', NUM: '--k2', AUX: '--k0', DATE: '--k3', INTJ: '--k4', X: '--ink-3' };
  NL.defineSim('ambiguas-cess', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const A = L.corpus.cessMeta.ambiguas;
    sim.group('Palabras');
    sim.slider('n', { label: 'Cuántas palabras mostrar', min: 5, max: 40, step: 1, value: 12, fmt: (v) => String(v) });
    sim.out('t', 'Ambigüedad por tipos', { hl: true });
    sim.out('k', 'Ambigüedad por tokens', { hl: true });
    sim.onDraw(() => {
      const M = L.corpus.cessMeta;
      sim.set('t', NL.pct(M.ambTipos, 1)); sim.set('k', NL.pct(M.ambTokens, 1));
      box.innerHTML = A.slice(0, sim.p.n).map(([w, n, c]) => {
        const partes = Object.entries(c).sort((a, b) => b[1] - a[1]);
        return `<div style="display:grid;grid-template-columns:7em 1fr 4.5em;gap:8px;align-items:center;margin:4px 0;font-size:13px"><b>${esc(w)}</b><span style="display:flex;height:16px;border-radius:4px;overflow:hidden;background:var(--surface-3)">${partes.map(([t, k]) => `<i title="${t}: ${k}" style="width:${(100 * k) / n}%;background:var(${COL[t] || '--ink-3'})"></i>`).join('')}</span><span style="text-align:right;color:var(--ink-3)">${NL.nf(n)}</span></div><div style="margin:0 0 6px 7.8em;font-size:11.5px;color:var(--ink-3)">${partes.map(([t, k]) => `${t} ${NL.nf(k)}`).join(' · ')}</div>`;
      }).join('');
    });
  });

  NL.bank.add('categorias', [
    { q: '¿Cuántas categorías gramaticales distingue la clasificación clásica de la RAE?', num: 9, tol: 0, fb: 'Sustantivo, determinante, adjetivo, pronombre, verbo, adverbio, preposición, conjunción e interjección.', lvl: 1 },
    { q: '¿Cuáles de estas son clases cerradas?', opts: ['Sustantivos y verbos', 'Determinantes, preposiciones y conjunciones', 'Adjetivos y adverbios', 'Ninguna'], ok: 1, fb: 'Las clases cerradas tienen pocas palabras, muy frecuentes, y casi no admiten nuevas.', lvl: 1 },
    { q: 'Al etiquetar «bebo un vaso de vino» y «vino de un lugar lejano», «vino» recibe etiquetas distintas. Esa tarea se llama…', opts: ['Tokenización', 'Desambiguación', 'Lematización', 'Segmentación'], ok: 1, fb: 'El etiquetador elige entre las categorías posibles de la palabra según el contexto.', lvl: 1 },
    { q: 'En <code>vmip3s0</code>, ¿qué significa la «p» de la cuarta posición?', opts: ['Plural', 'Presente', 'Participio', 'Pronombre'], ok: 1, fb: 'v-m-i-p-3-s-0: verbo, principal, indicativo, presente, 3.ª persona, singular.', lvl: 2 },
    { q: 'El conjunto Universal POS (UPOS) tiene…', num: 17, tol: 0, fb: '17 categorías comunes a todas las lenguas; los rasgos morfológicos van aparte.', lvl: 1 },
    { q: 'En CESS-ESP el 5,3 % de los tipos son ambiguos, pero esos tipos cubren el 36,9 % de los tokens. ¿Por qué?', opts: ['Porque el corpus es de prensa', 'Porque las palabras más frecuentes son funcionales y ambiguas (Zipf)', 'Por errores de anotación', 'Porque hay muchos nombres propios'], ok: 1, fb: 'Pocas palabras muy repetidas (de, la, que…) concentran buena parte del texto.', lvl: 2 },
    { q: '«Que» aparece 3.014 veces como pronombre y 2.556 como conjunción. Un etiquetador que siempre elija «pronombre» acierta con «que» aproximadamente…', opts: ['100 %', '54 %', '30 %', '0 %'], ok: 1, fb: '3.014/5.570 = 54,1 %.', lvl: 3 },
    { q: 'Las etiquetas EAGLES son…', opts: ['Palabras sueltas', 'Códigos posicionales: cada posición tiene un significado según la categoría', 'Números enteros', 'Colores'], ok: 1, fb: 'Por ejemplo ncms000: sustantivo, común, masculino, singular.', lvl: 1 },
    { q: 'Elegir para cada palabra su categoría más frecuente (con oráculo) acierta el 96,3 % en CESS-ESP. ¿Qué indica?', opts: ['Que el problema está resuelto', 'El techo de un etiquetador que solo mira la palabra: el resto necesita contexto', 'Que el corpus es perfecto', 'Que no hay ambigüedad'], ok: 1, fb: 'Es un límite superior para taggers sin contexto, calculado sobre los mismos datos.', lvl: 2 },
    { q: '¿Por qué un juego de etiquetas muy fino (282 etiquetas) hace más difícil el etiquetado automático?', opts: ['Porque exige más memoria RAM', 'Porque cada etiqueta tiene menos ejemplos y se estiman mal sus probabilidades', 'Porque las etiquetas son más largas', 'Porque Python no las admite'], ok: 1, fb: 'La dispersión de datos: muchas etiquetas raras con pocos ejemplos.', lvl: 2 }
  ]);
})();
