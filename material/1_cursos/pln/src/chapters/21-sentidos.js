/* Capítulo 21 — Sentidos de las palabras y WordNet */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, W = L.wn;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const PALABRAS = () => Object.keys(L.corpus.wordnet.semillas).sort((a, b) => a.localeCompare(b, 'es'));
  const hipo = (id) => W.todos().filter((s) => s.h.includes(id));
  const nom = (id) => { const s = W.synset(id); return (s.es[0] || s.en[0]).replace(/_/g, ' '); };

  /* ---- 1. Los sentidos de una palabra y su lugar en la jerarquía ---- */
  NL.defineSim('wn-sentidos', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Palabra');
    sim.select('w', { label: 'Palabra (español)', options: PALABRAS().map((w) => [w, w]), value: 'banco', onInput: () => sim.ctl.k.set(1, true) });
    sim.slider('k', { label: 'Sentido que se inspecciona', min: 1, max: 11, step: 1, value: 1, fmt: (v) => String(v) });
    sim.out('n', 'Sentidos de la palabra', { hl: true });
    sim.out('p', 'Profundidad en la jerarquía (mínima – máxima)');
    sim.onDraw(() => {
      const ss = W.sentidos(sim.p.w), k = Math.min(sim.p.k, ss.length) - 1;
      sim.set('n', String(ss.length));
      if (!ss.length) { box.innerHTML = 'Sin sentidos en el subconjunto.'; return; }
      const s = W.synset(ss[k]), cad = W.cadena(ss[k]).reverse(), hs = hipo(ss[k]);
      sim.set('p', W.profMin(ss[k]) + ' – ' + W.profMax(ss[k]));
      const fila = (id, i) => `<tr class="${i === k ? 'hl' : ''}"><td>${i + 1}</td><td style="text-align:left"><b>${esc(id.split('.')[0].replace(/_/g, ' '))}</b></td><td style="text-align:left;white-space:normal;font-size:12px">${esc(W.synset(id).gl)}</td><td style="text-align:left;white-space:normal;font-size:12px">${esc(W.synset(id).es.slice(0, 4).join(', ').replace(/_/g, ' '))}</td></tr>`;
      box.innerHTML = `<table class="mx"><thead><tr><th>#</th><th style="text-align:left">Synset</th><th style="text-align:left">Definición (WordNet inglés)</th><th style="text-align:left">Sinónimos en español</th></tr></thead><tbody>${ss.map(fila).join('')}</tbody></table>` +
        `<small style="color:var(--ink-3)">Cadena de hiperónimos del sentido ${k + 1} (de la raíz hasta él)</small><div class="tk-row">${cad.map((id, i) => `<span class="tk ${i === cad.length - 1 ? 'ok' : ''}"><span>${esc(nom(id))}</span></span>`).join('<span style="padding:0 2px">›</span>')}</div>` +
        `<small style="color:var(--ink-3)">Hipónimos directos presentes en el subconjunto (${hs.length})</small><div class="tk-row">${hs.slice(0, 14).map((x) => `<span class="tk"><span>${esc(nom(x.id))}</span></span>`).join('') || '<span style="color:var(--ink-3)">ninguno en el subconjunto</span>'}</div>`;
    });
  });

  /* ---- 2. Cuánta polisemia hay en las palabras de uso común ---- */
  NL.defineSim('wn-polisemia', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Ordenación');
    sim.seg('o', { label: null, options: [['n', 'Más sentidos primero'], ['a', 'Alfabético']], value: 'n' });
    sim.out('m', 'Media de sentidos por palabra', { hl: true });
    sim.out('u', 'Palabras con un solo sentido');
    sim.onDraw(() => {
      const f = PALABRAS().map((w) => [w, W.sentidos(w).length]);
      const media = f.reduce((s, x) => s + x[1], 0) / f.length;
      sim.set('m', NL.fix(media, 2)); sim.set('u', f.filter((x) => x[1] === 1).length + ' de ' + f.length);
      if (sim.p.o === 'n') f.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
      const mx = Math.max(...f.map((x) => x[1]));
      box.innerHTML = `<div style="columns:2;font-size:12.5px">${f.map(([w, n]) => `<div style="display:flex;align-items:center;gap:6px;break-inside:avoid"><span style="width:84px">${esc(w)}</span><span style="display:inline-block;height:9px;width:${Math.round(100 * n / mx)}px;background:var(--c1,#4c78a8);border-radius:2px"></span><span>${n}</span></div>`).join('')}</div><small style="color:var(--ink-3)">Cada barra es el número de synsets de WordNet para esa palabra (62 palabras comunes del español, según el WordNet multilingüe).</small>`;
    });
  });

  NL.bank.add('sentidos', [
    { q: 'Los sentidos de «banco» (asiento) y «banco» (entidad financiera) no están relacionados. Esta relación se llama…', opts: ['Polisemia', 'Homonimia', 'Sinonimia', 'Hiperonimia'], ok: 1, fb: 'Homonimia: sentidos sin relación entre sí (aquí, además, con orígenes distintos). Es una causa principal de errores en PLN.', lvl: 1 },
    { q: '«Hoja» de árbol y «hoja» de papel comparten la idea de «lámina plana». Esta relación es…', opts: ['Homonimia', 'Polisemia', 'Antonimia', 'Meronimia'], ok: 1, fb: 'Sentidos relacionados: polisemia.', lvl: 2 },
    { q: '«Escuchar a Mozart» o «leer a Cervantes» usan el nombre del autor para la obra. Es un caso de…', opts: ['Metonimia', 'Antonimia', 'Homografía', 'Hiponimia'], ok: 0, fb: 'La metonimia es un tipo de polisemia donde un nombre designa algo relacionado (autor ↔ obra, sede ↔ institución).', lvl: 2 },
    { q: '«Vehículo» es un … de «coche».', opts: ['Hipónimo', 'Hiperónimo', 'Sinónimo', 'Antónimo'], ok: 1, fb: 'Coche es hipónimo de vehículo; vehículo, hiperónimo de coche. Es la relación «es un».', lvl: 1 },
    { q: '«Rueda» y «coche» están en relación de…', opts: ['Hiponimia', 'Meronimia (parte–todo)', 'Antonimia', 'Homonimia'], ok: 1, fb: 'La rueda es una parte (merónimo) del coche (holónimo).', lvl: 1 },
    { q: 'Un synset de WordNet agrupa…', opts: ['Palabras con la misma ortografía', 'Palabras que pueden expresar el mismo sentido (sinónimos) y una definición', 'Todas las palabras de un texto', 'Un par de antónimos'], ok: 1, fb: 'Un synset es un conjunto de sinónimos con su glosa; las relaciones (hiperonimia, etc.) unen synsets.', lvl: 2 },
    { q: 'En el WordNet inglés los sustantivos tienen en media unos 1,24 sentidos y el 86,5 % solo uno. Entonces, ¿por qué la ambigüedad es un problema serio en la práctica?', opts: ['Porque ese promedio es erróneo', 'Porque las palabras de uso frecuente son justo las más polisémicas', 'Porque WordNet inventa sentidos', 'No lo es'], ok: 1, fb: 'Las palabras raras tienen un solo sentido; las que más aparecen en los textos tienen muchos (en el subconjunto del curso, la media es mucho mayor).', lvl: 3 },
    { q: 'Los antónimos «bueno / malo» son un caso de relación entre…', opts: ['Synsets', 'Lemas (palabras concretas)', 'Textos', 'Corpus'], ok: 1, fb: 'En WordNet la antonimia se define entre lemas, no entre synsets enteros.', lvl: 3 },
    { q: 'Si dos sentidos son hipónimos de un mismo concepto, entre sí son…', opts: ['Hermanos (cohipónimos)', 'Sinónimos', 'Homónimos', 'Antónimos'], ok: 0, fb: 'Perro y gato son cohipónimos de animal (más estrictamente, de carnívoro).', lvl: 2 },
    { q: 'La jerarquía de hiperónimos de WordNet termina, para los sustantivos, en…', opts: ['Verbo', 'Una raíz común llamada «entity»', 'Cada palabra tiene su raíz', 'No termina'], ok: 1, fb: 'Todos los sustantivos acaban bajo «entity.n.01» (la cadena de perro lo muestra).', lvl: 1 }
  ]);
})();
