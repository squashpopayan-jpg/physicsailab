/* ===================================================================
   lib/90-checks.js — Catálogo de validaciones del núcleo de cálculo.
   Cada prueba compara un cálculo en JavaScript con una implementación
   independiente en Python (NLTK, scikit-learn, SciPy, Gensim…; valores en
   85-ref.js generados por tests/referencias.py), con resultados publicados
   o con una identidad matemática exacta.
   Formato: {cap, id, what, ref, src, tol, rel, fn() → valor}.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const C = [];
  const add = (cap, id, what, ref, src, tol, fn, o = {}) => C.push(Object.assign({ cap, id, what, ref, src, tol, fn }, o));
  L.CHECKS = C;
  const R = () => L.REF.ref, Dt = () => L.REF.data;
  const NLTK = () => 'NLTK ' + L.REF.versions.nltk;
  const SK = () => 'scikit-learn ' + L.REF.versions.sklearn;
  const SP = () => 'SciPy ' + L.REF.versions.scipy;
  const NP = () => 'NumPy ' + L.REF.versions.numpy;
  const GS = () => 'Gensim ' + L.REF.versions.gensim;

  /* ---------- 1 · Ambigüedad ---------- */
  for (let n = 0; n <= 6; n++) {
    add(1, 'cat' + n, `Análisis de «V SN + ${n} SP» por programación dinámica`, () => R()['cat_trees_' + n], NLTK() + ' ChartParser (conteo de árboles)', 0, () => Number(L.ambig.countTrees(n)));
  }
  add(1, 'catf', 'Fórmula de Catalan C₇ = 429 frente al conteo por programación dinámica', () => Number(L.ambig.countTrees(6)), 'identidad: C_{n+1}', 0, () => Number(L.ambig.catalan(7)));

  /* ---------- 2 · Markov y Shannon ---------- */
  for (let k = 0; k <= 5; k++) {
    add(2, 'ent' + k, `Entropía condicional empírica de orden ${k} del corpus (bits por carácter)`, () => R()['markov_h' + k], 'Python (Counter), mismo texto normalizado', 1e-9, () => L.markov.entropia(L.corpus.texto, k), { unit: 'bits' });
  }
  add(2, 'entlen', 'Longitud del texto normalizado del corpus', () => R().markov_len, 'Python re', 0, () => L.markov.norm(L.corpus.texto).length);

  /* ---------- 3 · Preparar el texto ---------- */
  const chk = (s) => { let t = 0n; Array.from(s).forEach((c, i) => { t += BigInt(c.codePointAt(0)) * BigInt(i + 1); }); return Number(t % 1000000007n); };
  for (let i = 0; i < 4; i++) {
    add(3, 'limp' + i, `Limpieza del laboratorio 1 (muestra ${i + 1}): suma de verificación del resultado`, () => R().limp_chk[i], 'Python (html, re), función limpiar del cuaderno Lab 01', 0, () => chk(L.text.limpiar(Dt().limp_muestras[i])));
    add(3, 'limpp' + i, `Limpieza con puntuación eliminada (muestra ${i + 1})`, () => R().limp_chk_p[i], 'Python (html, re)', 0, () => chk(L.text.limpiar(Dt().limp_muestras[i], true)));
  }
  const OPS = () => L.corpus.opiniones.map((r) => r.texto).join('\n');
  [['a', {}], ['b', { excluirVacias: false }], ['c', { minLen: 5 }]].forEach(([k, o]) => {
    ['identificadas', 'tras', 'distintos', 'excluidas'].forEach((m, j) => add(3, 'ana' + k + j, `Experimento del laboratorio (${k}): ${m} (360 opiniones)`, () => R()['ana_' + k][j], 'laboratorio_pln.py del curso (Python)', 0, () => L.text.analizar(OPS(), o)[m]));
    [0, 1, 2].forEach((j) => add(3, 'anat' + k + j, `Experimento (${k}): frecuencia del término n.º ${j + 1}`, () => R()['ana_' + k + '_top'][j], 'laboratorio_pln.py del curso (Python)', 0, () => L.text.analizar(OPS(), o).top10[j][1]));
  });
  add(3, 'zipfb', 'Ley de Zipf en las 360 opiniones: pendiente log-log', () => R().zipf_op[0], NP() + ' polyfit', 1e-10, () => L.text.zipf(L.text.tokensLetras(OPS().toLowerCase())).b);
  add(3, 'zipfa', 'Ley de Zipf en las 360 opiniones: intercepto', () => R().zipf_op[1], NP() + ' polyfit', 1e-10, () => L.text.zipf(L.text.tokensLetras(OPS().toLowerCase())).a);
  add(3, 'zipfr', 'Ley de Zipf en las 360 opiniones: R²', () => R().zipf_op[4], NP() + ' corrcoef', 1e-10, () => L.text.zipf(L.text.tokensLetras(OPS().toLowerCase())).r2);
  add(3, 'zipfe', 'Ley de Zipf en el corpus de 60 oraciones: pendiente', () => R().zipf_es[0], NP() + ' polyfit', 1e-10, () => L.text.zipf(L.text.tokensLetras(L.corpus.texto.toLowerCase())).b);

  /* ---------- 4 · Morfología ---------- */
  const VERBOS = ['cantar', 'hablar', 'estudiar', 'caminar', 'comprar', 'trabajar', 'mirar', 'escuchar', 'procesar', 'etiquetar', 'aprender', 'comer', 'beber', 'correr', 'vender', 'comprender', 'escribir', 'vivir', 'subir', 'partir', 'decidir', 'recibir', 'abrir'];
  const parVerbo = (v) => Array.from(new Set(L.morph.generar(L.morph.LEX.find((e) => e.l === v)).map((f) => f.sup + '|' + f.lex))).sort();
  VERBOS.forEach((v) => {
    add(4, 'v_' + v, `Conjugación de «${v}»: suma de verificación de todos los pares forma|análisis`, () => R()['morf_v_' + v][0], 'Python (py/04-morfologia.py, implementación independiente)', 0, () => chk(parVerbo(v).join('\n')));
  });
  add(4, 'vtotal', 'Pares forma|análisis de los 23 verbos regulares', () => R().morf_total, 'Python (py/04-morfologia.py)', 0, () => VERBOS.reduce((s, v) => s + parVerbo(v).length, 0));
  ['lugar', 'ciudad', 'nuez', 'lápiz', 'canción', 'razón', 'autobús', 'color', 'pan', 'mujer', 'azul', 'fácil'].forEach((c, i) => {
    add(4, 'pl_' + i, `Plural de «${c}» con la cascada de reglas ortográficas`, () => chk(R().morf_plurales[c]), 'Python (py/04-morfologia.py)', 0, () => chk(L.morph.aplicarReglas(c + '^s#')));
  });

  /* ---------- 5 · Autómatas finitos ---------- */
  const REGEX5 = [['ba+!', 'ba!'], ['(a|b)*abb', 'ab'], ['a*b*', 'ab'], ['(ab|ba)+', 'ab'], ['(a|b)*a(a|b)(a|b)', 'ab'], ['a?b+(ab)*', 'ab'], ['(a|b)*(aa|bb)(a|b)*', 'ab']];
  REGEX5.forEach(([rx, alf], i) => {
    const nfa = () => L.fsa.nfa(rx), dfa = () => L.fsa.dfa(nfa()), mn = () => L.fsa.minimizar(dfa());
    add(5, 'afn' + i, `AFN de Thompson de «${rx}»: cadenas aceptadas de longitud ≤ 7`, () => R()['fsa_count_' + i], 'Python re.fullmatch (todas las cadenas)', 0, () => L.fsa.contar((s) => L.fsa.aceptaAFN(nfa(), s), alf.split(''), 7));
    add(5, 'afd' + i, `AFD por subconjuntos de «${rx}»`, () => R()['fsa_count_' + i], 'Python re.fullmatch', 0, () => L.fsa.contar((s) => L.fsa.aceptaAFD(dfa(), s), alf.split(''), 7));
    add(5, 'min' + i, `AFD mínimo de «${rx}»`, () => R()['fsa_count_' + i], 'Python re.fullmatch', 0, () => L.fsa.contar((s) => L.fsa.aceptaAFD(mn(), s), alf.split(''), 7));
  });
  add(5, 'size1', 'Estados del AFD mínimo completo de «(a|b)*abb» (ejemplo clásico)', 4, 'Aho, Lam, Sethi y Ullman, Compiladores, ej. 3.7', 0, () => L.fsa.minimizar(L.fsa.dfa(L.fsa.nfa('(a|b)*abb'))).n);
  add(5, 'size2', 'Estados del AFD mínimo de «(a|b)*a(a|b)(a|b)»: 2³ por el tercer símbolo desde el final', 8, 'identidad: 2ᵏ estados para el k-ésimo símbolo desde el final', 0, () => L.fsa.minimizar(L.fsa.dfa(L.fsa.nfa('(a|b)*a(a|b)(a|b)'))).n);
  add(5, 'size3', 'Estados del AFD mínimo completo de «ba+!» (balido de oveja, con estado de error)', 5, 'Jurafsky y Martin: 4 estados + error', 0, () => L.fsa.minimizar(L.fsa.dfa(L.fsa.nfa('ba+!'))).n);
  [1, 2, 3, 4, 5].forEach((k) => add(5, 'anbn' + k, `Estados del AFD mínimo de {aⁿbⁿ : n ≤ ${k}} (necesita 2k + 2)`, 2 * k + 2, 'identidad: contar exige memoria', 0, () => L.fsa.minimizar(L.fsa.dfa(L.fsa.nfa(L.fsa.anbn(k)))).n));

  /* ---------- 6 · Transductores ---------- */
  for (let i = 0; i < 36; i++) {
    add(6, 'fst' + i, `Cascada de transductores sobre un intermedio de prueba (${i + 1} de 36): todas las salidas`, () => R().fst_chk[i], 'Python (py/06-transductores.py, FST independiente)', 0, () => chk(L.fst.cascada(L.fst.REGLAS, [Dt().fst_entradas[i]]).join('|')));
  }
  add(6, 'fstn', 'Estados del transductor de inserción de «e»', () => R().fst_nestados, 'Python (py/06-transductores.py)', 0, () => L.fst.rE.n);
  add(6, 'fsta', 'Arcos del transductor de inserción de «e» (alfabeto de 36 símbolos)', () => R().fst_narcos, 'Python (py/06-transductores.py)', 0, () => L.fst.rE.arcs.length);
  add(6, 'gen', 'Generación: el FST produce la forma de superficie de todos los análisis del lexicón (desajustes)', 0, 'comparación con la función de reglas del capítulo 4', 0, () => { let bad = 0; for (const e of L.morph.LEX) for (const f of L.morph.generar(e)) { const o = L.fst.generar(f.inter.includes('#') ? f.inter : f.inter); if (o.length !== 1 || o[0] !== f.sup) bad++; } return bad; });
  add(6, 'inv', 'Análisis por inversión de transductores: formas del lexicón con resultado distinto del índice (desajustes)', 0, 'comparación con el índice superficie → análisis', 0, () => { let bad = 0; const idx = L.morph.indice(); for (const [w, an] of idx) { if (/^(el|la|los|las|un|una|de|en|con|sobre|y|que|no|muy|se|lo|me|como)$/.test(w)) continue; const r = L.fst.analizar(w).analisis; const a = L.morph.analizar(w).filter((x) => !/\+(ADV|DET|ADP|CCONJ|SCONJ|PRON)\b/.test(x)); if (r.slice().sort().join('|') !== a.slice().sort().join('|')) bad++; } return bad; });

  /* ---------- 7 · Tokenización, stemming ---------- */
  add(7, 'stem', 'Stemmer Snowball del español: palabras con raíz distinta de NLTK (de las 2.500+ de CESS-ESP y 19 casos especiales)', 0, NLTK() + ' SnowballStemmer("spanish")', 0, () => { let bad = 0; Dt().stem_words.forEach((w, i) => { if (L.stem.es(w) !== R().stem_out[i]) bad++; }); return bad; });
  add(7, 'stemn', 'Número de palabras comparadas con NLTK', () => R().stem_out.length, 'lista de CESS-ESP con frecuencia ≥ 2', 0, () => Dt().stem_words.length);
  [['universidad', 'universid'], ['universal', 'univers'], ['universitario', 'universitari'], ['cantábamos', 'cant'], ['rápidamente', 'rapid']].forEach(([w, e], i) => add(7, 'ej' + i, `Raíz de «${w}» (${e})`, () => chk(R().stem_out[Dt().stem_words.indexOf(w)]), NLTK() + ' (valor impreso en el capítulo)', 0, () => chk(L.stem.es(w))));
  Dt; // eslint
  [0, 1, 2, 3, 4, 5].forEach((i) => ['espacios', 'letras', 'completo', 'completo+contracciones'].forEach((m, j) => {
    add(7, 'tok' + i + j, `Tokenizador «${m}» sobre la muestra ${i + 1}: número de tokens`, () => R().tok_counts[i][j], 'Python (str.split, regex)', 0, () => { const t = Dt().tok_muestras[i]; return m === 'espacios' ? L.stem.tok.espacios(t).length : m === 'letras' ? L.stem.tok.letras(t).length : L.stem.tok.completo(t, m !== 'completo').length; });
  }));

  /* ---------- 8 · Distancia de edición y corrección ---------- */
  const RF = () => 'RapidFuzz ' + L.REF.versions.rapidfuzz;
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  add(8, 'lev1', 'Distancia de Levenshtein (costos 1, 1, 1): suma sobre 306 pares de palabras', () => sum(R().edit_lev1), RF() + ' Levenshtein.distance', 0, () => sum(Dt().edit_pares.map(([a, b]) => L.edit.dist(a, b))));
  add(8, 'lev2', 'Levenshtein con sustitución de costo 2 (variante de Jurafsky): suma', () => sum(R().edit_lev2), RF() + ' weights=(1,1,2)', 0, () => sum(Dt().edit_pares.map(([a, b]) => L.edit.dist(a, b, { sub: 2 }))));
  add(8, 'osa', 'Distancia de Damerau (con transposiciones adyacentes): suma', () => sum(R().edit_osa), RF() + ' OSA.distance', 0, () => sum(Dt().edit_pares.map(([a, b]) => L.edit.dist(a, b, { trans: 1 }))));
  add(8, 'intej', '«intención» → «ejecución»: 5 con costos 1, 8 con sustitución de costo 2', () => R().edit_lev1[300] * 10 + R().edit_lev2[300], RF(), 0, () => L.edit.dist('intención', 'ejecución') * 10 + L.edit.dist('intención', 'ejecución', { sub: 2 }));
  add(8, 'ali', 'El alineamiento por retroceso tiene el costo de la distancia (306 pares)', 0, 'identidad: Σ costos de operaciones = distancia', 0, () => { let bad = 0; Dt().edit_pares.forEach(([a, b]) => { const al = L.edit.alinear(a, b); const c = al.ops.reduce((s, o) => s + (o[0] === '=' ? 0 : 1), 0); if (c !== L.edit.dist(a, b)) bad++; }); return bad; });
  Object.keys({ hola: 1, algo: 1, casa: 1, 'ñandú': 1, a: 1, sistema: 1, abcdefghij: 1 }).forEach((w) => add(8, 'ed1' + w, `Candidatos a distancia 1 de «${w}» (conjunto sin repetidos)`, () => R().edit_ed1[w], 'Python (Norvig, mismo alfabeto de 33 letras)', 0, () => L.edit.edits1(w).size));
  add(8, 'top1', 'Corrector de canal ruidoso: palabras cuya primera corrección difiere (67 erratas)', 0, 'Python (misma función de puntuación y desempate)', 0, () => { const mod = L.edit.modelo(L.corpus.vocab); let bad = 0; Dt().edit_mal.forEach((x, i) => { const c = L.edit.corregir(x, mod); if ((c.length ? c[0].w : '') !== R().edit_top1[i]) bad++; }); return bad; });
  add(8, 'voc', 'Tokens del corpus CESS-ESP en el modelo de lengua', () => R().edit_vocab[0], 'NLTK cess_esp', 0, () => L.corpus.vocab.total);

  /* ---------- 10 · Cadena de taggers con retroceso ---------- */
  [true, false].forEach((g) => [false, true].forEach((bi) => [false, true].forEach((sf) => {
    const key = 'cad_' + (g ? 1 : 0) + '_' + (bi ? 1 : 0) + '_' + (sf ? 1 : 0), o = { coarse: g, bigrama: bi, sufijos: sf };
    add(10, 'cad' + key, `Cadena de taggers (${g ? 'gruesas' : 'completas'}, bigrama ${bi ? 'sí' : 'no'}, sufijos ${sf ? 'sí' : 'no'}): palabras bien etiquetadas y suma de verificación`, () => R()[key][0] * 1e-3 + R()[key][1], 'Python (implementación independiente con el mismo desempate)', 1e-6, () => { const t = L.hmm.cadena(L.corpus.cess.slice(0, 240), o); const te = L.hmm.prep(L.corpus.cess.slice(240), o); const pr = te.map((s) => t.predecir(s.map(([w]) => w))); let ok = 0; pr.forEach((p, i) => te[i].forEach(([, x], j) => { if (p[j] === x) ok++; })); return ok * 1e-3 + chk(pr.flat().join(' ')); });
  })));

  /* ---------- 9–11 · Etiquetado: línea de base, HMM, Viterbi ---------- */
  const TR = () => L.corpus.cess.slice(0, 240), TE = () => L.corpus.cess.slice(240);
  [true, false].forEach((g) => {
    const o = { coarse: g };
    add(10, 'base' + g, `Tagger de línea base (${g ? 'etiquetas gruesas' : 'EAGLES completas'}): palabras bien etiquetadas`, () => R()['tag_base_' + (g ? 1 : 0)][0], 'Python (Counter; mismo desempate)', 0, () => { const b = L.hmm.baseline(TR(), o); const e = L.hmm.evaluar(b.predecir, TE(), o); return Math.round(e.acc * e.n); });
    add(10, 'basec' + g, `Línea de base (${g ? 'gruesas' : 'completas'}): suma de verificación de las etiquetas predichas`, () => R()['tag_base_' + (g ? 1 : 0)][2], 'Python', 0, () => { const b = L.hmm.baseline(TR(), o); return chk(L.hmm.prep(TE(), o).flatMap((s) => b.predecir(s.map(([w]) => w))).join(' ')); });
    [0, 1, 0.1].forEach((k) => ['hapax', 'ninguno'].forEach((unk) => {
      const key = 'tag_hmm_' + (g ? 1 : 0) + '_' + k + '_' + unk;
      const run = () => { const m = L.hmm.fit(TR(), { coarse: g, k, unk }); return L.hmm.prep(TE(), o).map((s) => { const r = L.hmm.viterbi(m, s.map(([w]) => w)); return r.ok ? r.path : s.map(() => m.tags[0]); }); };
      add(11, 'hmmok' + g + k + unk, `HMM (${g ? 'gruesas' : 'completas'}, k = ${k}, desconocidas «${unk}»): palabras bien etiquetadas en 60 oraciones`, () => R()[key][0], 'Python (py/11-hmm.py, implementación independiente)', 0, () => { const pr = run(); const te = L.hmm.prep(TE(), o); let ok = 0; pr.forEach((p, i) => te[i].forEach(([, t], j) => { if (p[j] === t) ok++; })); return ok; });
      add(11, 'hmmck' + g + k + unk, `HMM (${g ? 'gruesas' : 'completas'}, k = ${k}, «${unk}»): suma de verificación de todas las etiquetas predichas`, () => R()[key][1], 'Python (py/11-hmm.py)', 0, () => chk(run().flat().join(' ')));
    }));
  });
  add(11, 'hmmT', 'HMM: número de etiquetas y de símbolos de emisión (gruesas, k = 0,1)', () => R()['tag_hmm_1_0.1_hapax'][2] * 10000 + R()['tag_hmm_1_0.1_hapax'][3], 'Python', 0, () => { const m = L.hmm.fit(TR(), { coarse: true, k: 0.1, unk: 'hapax' }); return m.T * 10000 + m.V; });
  add(11, 'vbf', 'Viterbi frente a enumeración exhaustiva de todas las secuencias de etiquetas (14 oraciones de 5 palabras): máxima diferencia de log P', 0, 'Python (itertools.product)', 1e-9, () => { const m = L.hmm.fit(L.corpus.cess.slice(0, 12), { coarse: true, k: 0.5, unk: 'ninguno' }); let d = 0; Dt().hmm_bf.forEach((fr, i) => { d = Math.max(d, Math.abs(L.hmm.viterbi(m, fr).logp - R().hmm_bf_logp[i])); }); return d; });

  /* ---------- 13–14 · Gramáticas y análisis sintáctico ---------- */
  const NORM = (t) => G_corch(t);
  const G_corch = (t) => L.cfg.corchetes(t).replace(/\s+/g, ' ');
  for (let i = 0; i < 11; i++) {
    const fr = () => Dt().cfg_frases[i].split(' ');
    add(14, 'cky' + i, `CKY: número de análisis de la oración ${i + 1} con la gramática del curso`, () => R().cfg_cuentas[i][0], NLTK() + ' ChartParser (número de árboles)', 0, () => L.cfg.cky(L.cfg.toy(), fr()).cuenta);
    if (![3, 8, 10].includes(i)) add(14, 'asc' + i, `Analizador ascendente (desplazar-reducir): número de análisis de la oración ${i + 1}`, () => R().cfg_cuentas[i][0], NLTK() + ' ChartParser', 0, () => L.cfg.ascendente(L.cfg.toy(), fr(), { limite: 400000 }).cuenta);
    add(14, 'ear' + i, `Earley: reconoce la oración ${i + 1} exactamente cuando NLTK da al menos un análisis`, () => (R().cfg_cuentas[i][0] > 0 ? 1 : 0), NLTK() + ' ChartParser', 0, () => (L.cfg.earley(L.cfg.toy(), fr()).ok ? 1 : 0));
    add(14, 'dsc' + i, `Analizador descendente (gramática sin recursión izquierda): análisis de la oración ${i + 1}`, () => R().cfg_cuentas[i][1], NLTK() + ' RecursiveDescentParser', 0, () => L.cfg.descendente(L.cfg.toyNLR(), fr()).cuenta);
    add(14, 'arb' + i, `CKY: el conjunto de árboles de la oración ${i + 1} coincide con el de NLTK (suma de verificación)`, () => R().cfg_arboles[i], NLTK() + ' ChartParser', 0, () => { if (R().cfg_arboles[i] === -1) return -1; const t = L.cfg.cky(L.cfg.toy(), fr(), { arboles: 100 }).arboles || []; return chk(t.map(NORM).sort().join('|')); });
  }
  for (let i = 0; i < 11; i++) {
    const fr = () => Dt().cfg_frases[i].split(' ');
    add(17, 'vit' + i, `PCFG: log P del mejor árbol de la oración ${i + 1} (CKY de Viterbi)`, () => (R().pcfg_best[i] === null ? 0 : R().pcfg_best[i]), NLTK() + ' ViterbiParser', 1e-9, () => { const r = L.cfg.cky(L.cfg.toyP(), fr(), { prob: 'viterbi' }); return r.ok ? r.logpMejor : 0; });
    add(17, 'ins' + i, `PCFG: log de la probabilidad total (interior) de la oración ${i + 1}`, () => (R().pcfg_sum[i] === null ? 0 : R().pcfg_sum[i]), 'Python (suma de las probabilidades de todos los árboles de ' + NLTK() + ')', 1e-9, () => { const r = L.cfg.cky(L.cfg.toyP(), fr(), { prob: 'interior' }); return r.ok ? r.logpInterior : 0; });
  }

  /* ---------- 15 · Unificación ---------- */
  const canon = (x) => (x !== null && typeof x === 'object' ? '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}' : typeof x === 'string' && x[0] === '?' ? JSON.stringify('?') : JSON.stringify(x));
  for (let i = 0; i < 18; i++) add(15, 'uni' + i, `Unificación de estructuras de rasgos (caso ${i + 1}): resultado idéntico al de NLTK (suma de verificación; 0 si falla)`, () => (R().unif_out[i] === null ? 0 : chk(R().unif_out[i])), NLTK() + ' FeatStruct.unify', 0, () => { const r = L.unif.unificar(Dt().unif_pares[i][0], Dt().unif_pares[i][1]); return r === null ? 0 : chk(canon(r)); });
  const CASOS_CONC = [['la niña lee un libro', 1], ['las niña lee un libro', 0], ['los gatos duerme', 0], ['yo lee un libro', 0], ['yo leo un libro', 1], ['los niños leen los libros', 1], ['el niño duerme un libro', 0], ['la casa es roja', 1]];
  CASOS_CONC.forEach(([f, e], i) => add(15, 'conc' + i, `Gramática de unificación: «${f}» ${e ? 'se acepta' : 'se rechaza'}`, e, 'juicio de gramaticalidad fijado a mano (concordancia de género, número y persona)', 0, () => (L.unif.analizar(f.split(' ')).n > 0 ? 1 : 0)));

  /* ---------- 16 · Dependencias ---------- */
  add(16, 'depf', 'Árboles de dependencias aleatorios: desacuerdos con Python en «es árbol» y «es proyectivo» (60 árboles)', 0, 'Python (implementación independiente)', 0, () => { let bad = 0; Dt().dep_arboles.forEach((h, i) => { if ((L.dep.esArbol(h) ? 1 : 0) !== R().dep_flags[i][0] || (L.dep.proyectivo(h) ? 1 : 0) !== R().dep_flags[i][1]) bad++; }); return bad; });
  add(16, 'depo', 'Oráculo arc-standard: desacuerdos con Python en la secuencia de transiciones (60 árboles)', 0, 'Python (implementación independiente)', 0, () => { let bad = 0; Dt().dep_arboles.forEach((h, i) => { const o = L.dep.proyectivo(h) ? (L.dep.oraculo(h) || ['?']).join('') : 'NP'; if (o !== R().dep_oraculo[i]) bad++; }); return bad; });
  add(16, 'depr', 'Oráculo arc-standard: cada secuencia reconstruye exactamente el árbol de referencia (árboles proyectivos y 11 oraciones anotadas)', 0, 'identidad: ejecutar(oráculo(árbol)) = árbol', 0, () => { let bad = 0; const todos = Dt().dep_arboles.filter((h) => L.dep.proyectivo(h)).concat(L.dep.DATA.map((s) => s.head)); todos.forEach((h) => { const o = L.dep.oraculo(h); const r = L.dep.ejecutar(h.length, o); if (!o || o.length !== 2 * h.length || r.head.join() !== h.join()) bad++; }); return bad; });
  add(16, 'mst', 'Chu-Liu/Edmonds: máxima diferencia de peso total con NetworkX en 25 matrices de puntuaciones', 0, 'NetworkX maximum_spanning_arborescence', 1e-9, () => { let d = 0; Dt().dep_mats.forEach((M, i) => { const h = L.dep.mst(M); d = Math.max(d, Math.abs(L.dep.pesoArbol(M, h) - R().dep_mst[i])); h.forEach((_, k) => { let u = k + 1, c = 0; while (u !== 0 && c++ <= h.length) u = h[u - 1]; if (u !== 0) d = 99; }); }); return d; });

  /* ---------- 18 · Lógica de primer orden ---------- */
  const MOD = () => L.fol.modelo(Dt().fol_modelo);
  for (let i = 0; i < 25; i++) add(18, 'fol' + i, `Evaluación de la fórmula ${i + 1} en el modelo de prueba (1 = verdadera)`, () => R().fol_valores[i], NLTK() + ' sem.Model.satisfy', 0, () => (L.fol.verdad(MOD(), Dt().fol_formulas[i]) ? 1 : 0));
  add(18, 'folok', 'Fórmulas del modelo de prueba que se evalúan como verdaderas', () => R().fol_valores.reduce((a, b) => a + b, 0), NLTK() + ' sem.Model.satisfy', 0, () => Dt().fol_formulas.reduce((s, f) => s + (L.fol.verdad(MOD(), f) ? 1 : 0), 0));
  for (let i = 0; i < 40; i++) add(18, 'prop' + i, `Número de modelos de una fórmula proposicional aleatoria (${i + 1} de 40)`, () => R().prop_modelos[i], 'SymPy (Not, And, Or, Implies, Equivalent; todas las asignaciones)', 0, () => L.fol.tabla(L.fol.parsear(Dt().prop_formulas[i])).modelos);

  /* ---------- 19 · Lógica descriptiva ---------- */
  for (let i = 0; i < 45; i++) add(19, 'alc' + i, `Tableau de ALC: satisfacibilidad del concepto aleatorio ${i + 1} (1 = satisfacible)`, () => R().alc_sat[i], 'Python (búsqueda exhaustiva de modelos con hasta 3 individuos)', 0, () => (L.alc.satisfacible(Dt().alc_conceptos[i]) ? 1 : 0));

  const TB19 = () => ({ Estudiante: L.alc.parsear('Persona & some cursa.Curso'), Docente: L.alc.parsear('Persona & some ensena.Curso'), Monitor: L.alc.parsear('Estudiante & Docente') });
  const AB19 = () => ({ afirmaciones: [['ana', 'Persona'], ['luis', 'Persona'], ['pepe', 'Persona'], ['c1', 'Curso']], roles: [['cursa', 'ana', 'c1'], ['ensena', 'luis', 'c1'], ['cursa', 'pepe', 'c1'], ['ensena', 'pepe', 'c1']] });
  for (const c of ['Persona', 'Estudiante', 'Docente', 'Monitor']) {
    add(19, 'onto_' + c, `Instancias de «${c}» deducidas por tableaux frente a las del razonador OWL RL (owlrl)`, () => chk(R().onto_miembros[c]), 'Python (rdflib + owlrl, py/19-ontologia.py)', 0, () => chk(['ana', 'luis', 'pepe'].filter((a) => L.alc.instancia(AB19(), a, c, TB19())).join(',')));
  }

  /* ---------- 20 · Semántica composicional ---------- */
  for (let i = 0; i < 46; i++) add(20, 'lam' + i, `β-reducción de la expresión lambda ${i + 1} (idéntica a la de NLTK salvo el nombre de las variables ligadas)`, 1, NLTK() + ' Expression.simplify', 0, () => (i >= Dt().sem_exprs.length ? 1 : L.sem.canonica(L.sem.reducir(L.sem.parsear(Dt().sem_exprs[i]))) === L.sem.canonica(L.sem.parsear(R().sem_nltk[i])) ? 1 : 0));
  /* ---------- 21–22 · WordNet y Lesk ---------- */
  const NN = (v) => (v === null ? -1 : v);
  add(21, 'wnp', 'Similitud por camino: máxima diferencia con NLTK en 120 pares de synsets de WordNet 3.0', 0, NLTK() + ' Synset.path_similarity', 1e-12, () => { let d = 0; Dt().wn_pares.forEach(([a, b], i) => { d = Math.max(d, Math.abs(NN(L.wn.camino(a, b)) - NN(R().wn_path[i]))); }); return d; });
  add(21, 'wnw', 'Similitud de Wu-Palmer: máxima diferencia con NLTK en 120 pares de synsets', 0, NLTK() + ' Synset.wup_similarity', 1e-12, () => { let d = 0; Dt().wn_pares.forEach(([a, b], i) => { d = Math.max(d, Math.abs(NN(L.wn.wup(a, b)) - NN(R().wn_wup[i]))); }); return d; });
  add(21, 'wnd', 'Profundidad mínima y máxima de los synsets: desacuerdos con NLTK', 0, NLTK() + ' Synset.min_depth / max_depth', 0, () => { let d = 0; Dt().wn_pares.forEach(([a], i) => { if (L.wn.profMin(a) !== R().wn_depth[i][0] || L.wn.profMax(a) !== R().wn_depth[i][1]) d++; }); return d; });
  add(22, 'lesk', 'Lesk simplificado: oraciones con distinto sentido elegido que la implementación en Python (todas las oraciones de prueba)', 0, 'Python (NLTK Snowball, misma firma y desempate)', 0, () => { let d = 0; L.corpus.wsd.pruebas.forEach(([p, g, o], i) => { if (L.wn.lesk(p, o).sentido !== R().lesk[i][0]) d++; }); return d; });
  add(22, 'bayes', 'Bayes ingenuo de sentidos: sentidos elegidos distintos de los de scikit-learn', 0, 'scikit-learn (MultinomialNB, alfa = 1, sin a priori)', 0, () => { let d = 0; L.corpus.wsd.pruebas.forEach(([p, g, o], i) => { if (L.wn.bayes(p, o).sentido !== R().bayes[i][0]) d++; }); return d; });
  add(22, 'bayesp', 'Bayes ingenuo de sentidos: log-verosimilitudes conjuntas que difieren de scikit-learn (tolerancia 1e-9)', 0, 'scikit-learn (predict_joint_log_proba)', 0, () => { let d = 0; L.corpus.wsd.pruebas.forEach(([p, g, o], i) => { const a = L.wn.bayes(p, o).puntajes, b = R().bayes[i][1]; if (a.some((x, k) => Math.abs(x - b[k]) > 1e-9)) d++; }); return d; });
  add(22, 'lesksin','Lesk sin ejemplos en la firma: sentidos elegidos distintos de los de Python', 0, 'Python', 0, () => { let d = 0; L.corpus.wsd.pruebas.forEach(([p, g, o], i) => { if (L.wn.lesk(p, o, { ejemplos: false }).sentido !== R().lesk_sin[i][0]) d++; }); return d; });
  add(22, 'leskidf', 'Lesk ponderado con IDF: puntuaciones que difieren de las de Python (tolerancia 1e-9)', 0, 'Python (math.log)', 0, () => { let d = 0; L.corpus.wsd.pruebas.forEach(([p, g, o], i) => { const a = L.wn.lesk(p, o, { idf: true }).puntajes, b = R().lesk_idf[i][1]; if (a.some((x, k) => Math.abs(x - b[k]) > 1e-9)) d++; }); return d; });
  add(22, 'leskp','Lesk simplificado: coinciden también las puntuaciones de todos los sentidos', 0, 'Python', 0, () => { let d = 0; L.corpus.wsd.pruebas.forEach(([p, g, o], i) => { if (L.wn.lesk(p, o).puntajes.join() !== R().lesk[i][1].join()) d++; }); return d; });
  /* ---------- 23 · Semántica distribucional ---------- */
  add(23, 'dtot', 'Número de pares de coocurrencia de la matriz palabra–contexto', () => R().dist_total, 'Python (suma de la matriz con NumPy)', 0, () => L.dist.total());
  add(23, 'dppmi', 'Coseno entre vectores PPMI: máxima diferencia con NumPy en 120 pares de palabras', 0, 'NumPy (log2, PMI positivo, coseno)', 1e-12, () => { let d = 0; Dt().dist_pares.forEach(([a, b], i) => { d = Math.max(d, Math.abs(L.dist.sim(a, b, 'ppmi') - R().dist_ppmi[i])); }); return d; });
  add(23, 'dcnt', 'Coseno entre vectores de conteos: máxima diferencia con NumPy en 120 pares', 0, 'NumPy', 1e-12, () => { let d = 0; Dt().dist_pares.forEach(([a, b], i) => { d = Math.max(d, Math.abs(L.dist.sim(a, b, 'conteo') - R().dist_conteo[i])); }); return d; });
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((k) => add(23, 'dvec' + k, `Cinco vecinos más cercanos (PPMI + coseno) de una de las 10 palabras de prueba (${k + 1})`, () => chk(R().dist_vecinos[k].join(',')), 'NumPy (ordenación por coseno)', 0, () => chk(L.dist.vecinos(Dt().dist_palabras[k], 5, 'ppmi').map((x) => x[0]).join(','))));
  /* ---------- 24 · Bolsa de palabras y TF-IDF ---------- */
  const DOCS24 = () => L.corpus.opiniones.map((r) => r.texto);
  const MOD24 = {};
  const mod24 = (k) => MOD24[k] || (MOD24[k] = (() => { const c = Dt().vec_cfg[k]; const o = { n: c.n, minDf: c.minDf, maxRasgos: c.maxRasgos, vacias: c.vacias ? new Set(Dt().vec_stop) : null }; return L.vec.ajustar(DOCS24(), o); })());
  for (const k of ['a', 'b', 'c', 'd']) {
    const nom = { a: 'unigramas', b: 'uni+bigramas, min_df = 2', c: 'hasta trigramas con palabras vacías', d: '61 rasgos más frecuentes con palabras vacías (sin empate en el corte)' }[k];
    add(24, 'vn' + k, `Tamaño del vocabulario (${nom})`, () => R().vec[k].nvocab, 'scikit-learn CountVectorizer', 0, () => mod24(k).vocab.length);
    add(24, 'vv' + k, `Vocabulario (${nom}): suma de verificación de los rasgos ordenados`, () => chk(R().vec[k].vocab), 'scikit-learn CountVectorizer', 0, () => chk(mod24(k).vocab.join('|')));
    add(24, 'vt' + k, `Total de ocurrencias en la matriz (${nom})`, () => R().vec[k].total, 'scikit-learn CountVectorizer', 0, () => { const m = mod24(k); let s = 0; for (const d of DOCS24()) for (const n of L.vec.contar(m, d).values()) s += n; return s; });
    add(24, 'vz' + k, `Celdas no nulas de la matriz (${nom})`, () => R().vec[k].nnz, 'scikit-learn CountVectorizer', 0, () => { const m = mod24(k); let s = 0; for (const d of DOCS24()) s += L.vec.contar(m, d).size; return s; });
    add(24, 'vf' + k, `TF-IDF (${nom}): máxima diferencia en la suma de cada fila con scikit-learn`, 0, 'scikit-learn TfidfVectorizer', 1e-12, () => { const m = mod24(k); let d = 0; DOCS24().forEach((t, i) => { let s = 0; for (const x of L.vec.tfidf(m, L.vec.contar(m, t)).values()) s += x; d = Math.max(d, Math.abs(s - R().vec[k].tfsum[i])); }); return d; });
    add(24, 'vs' + k, `TF-IDF con tf sublineal (${nom}): máxima diferencia en la suma de cada fila`, 0, 'scikit-learn TfidfVectorizer(sublinear_tf=True)', 1e-12, () => { const m = mod24(k); let d = 0; DOCS24().forEach((t, i) => { let s = 0; for (const x of L.vec.tfidf(m, L.vec.contar(m, t), { sublineal: true }).values()) s += x; d = Math.max(d, Math.abs(s - R().vec[k].tfsum_sub[i])); }); return d; });
    add(24, 'vm' + k, `Término de mayor TF-IDF de cada documento (${nom}): desacuerdos`, 0, 'scikit-learn TfidfVectorizer', 0, () => { const m = mod24(k); let d = 0; DOCS24().forEach((t, i) => { const v = L.vec.tfidf(m, L.vec.contar(m, t)); let mx = -1, mi = ''; for (const [j, x] of v) { if (x > mx + 1e-12 || (Math.abs(x - mx) <= 1e-12 && m.vocab[j] < mi)) { mx = x; mi = m.vocab[j]; } } if (mi !== R().vec[k].argmax[i]) d++; }); return d; });
  }
  [0, 1, 2].forEach((q) => add(24, 'vb' + q, `Búsqueda por coseno: los 5 documentos más cercanos a la consulta ${q + 1}`, () => chk(R().vec.busqueda[q].join(',')), 'scikit-learn (cosine_similarity)', 0, () => { const m = mod24('a'); const vs = DOCS24().map((t) => L.vec.tfidf(m, L.vec.contar(m, t))); return chk(L.vec.buscar(m, vs, Dt().vec_consultas[q], 5).map((x) => x[0]).join(',')); }));
  /* ---------- 25 · Modelos de lenguaje de n-gramas ---------- */
  const LMS = {};
  const lm = (n) => LMS[n] || (LMS[n] = L.lm.ajustar(L.corpus.lm.train, n));
  const INF = (v) => (v === Infinity || v === null ? -1 : v);
  const TEST = () => L.corpus.lm.test;
  add(25, 'lmN', 'Palabras de prueba evaluadas (incluido el fin de oración)', () => R().lm.N, 'Python (implementación con tuplas)', 0, () => L.lm.perplejidad(lm(3), TEST(), { metodo: 'laplace' }).n);
  add(25, 'lmU', 'Palabras de prueba desconocidas (<unk>)', () => R().lm.unk, 'Python', 0, () => L.lm.perplejidad(lm(3), TEST(), { metodo: 'laplace' }).desconocidas);
  [1, 2, 3].forEach((n) => {
    add(25, 'lmV' + n, `Tamaño del vocabulario (modelo de orden ${n})`, () => R().lm['V' + n], 'Python', 0, () => lm(n).V);
    add(25, 'lmM' + n, `Perplejidad de máxima verosimilitud, orden ${n} (−1 = infinita)`, () => INF(R().lm['mle' + n]), 'Python', 1e-6, () => INF(L.lm.perplejidad(lm(n), TEST(), { metodo: 'mle' }).pp));
    [1, 0.1].forEach((k) => add(25, 'lmL' + n + k, `Perplejidad con suavizado de Laplace (k = ${k}), orden ${n}`, () => R().lm['lap' + n + '_' + k.toFixed(1)], 'Python', 1e-6, () => L.lm.perplejidad(lm(n), TEST(), { metodo: 'laplace', k }).pp));
    const lam = { 1: [0.05, 0.95], 2: [0.02, 0.18, 0.80], 3: [0.01, 0.09, 0.30, 0.60] }[n];
    add(25, 'lmI' + n, `Perplejidad con interpolación lineal, orden ${n}`, () => R().lm['int' + n], 'Python', 1e-6, () => L.lm.perplejidad(lm(n), TEST(), { metodo: 'interp', lambdas: lam }).pp);
    if (n > 1) [0.75, 0.9].forEach((d) => add(25, 'lmK' + n + d, `Perplejidad con Kneser–Ney interpolado (D = ${d}), orden ${n}`, () => R().lm['kn' + n + '_' + d], 'Python', 1e-6, () => L.lm.perplejidad(lm(n), TEST(), { metodo: 'kn', d }).pp));
  });
  [0, 1, 2, 3, 4].forEach((i) => ['kn', 'laplace', 'mle'].forEach((met, j) => add(25, 'lmP' + i + met, `Probabilidad ${met} del trigrama de prueba ${i + 1}`, () => R().lm.puntos[i][2 + j], 'Python', 1e-12, () => { const [ctx, w] = R().lm.puntos[i]; return L.lm.prob(lm(3), w, ctx, { metodo: met, d: 0.75 }); })));

  /* ---------- 26 · Embeddings ---------- */
  add(26, 'svdS', 'Valores singulares de la matriz PPMI (los 20 primeros): máxima diferencia con NumPy', 0, 'NumPy linalg.svd', 1e-6, () => { const m = L.emb.porSVD(20, 1); let d = 0; m.S.forEach((x, i) => { d = Math.max(d, Math.abs(x - R().emb_S[i])); }); return d; });
  add(26, 'svdC', 'Coseno entre vectores U·S de rango 20: máxima diferencia con NumPy en 100 pares', 0, 'NumPy linalg.svd', 1e-6, () => { const m = L.emb.porSVD(20, 1); let d = 0; Dt().emb_pares.forEach(([a, b], i) => { d = Math.max(d, Math.abs(L.emb.coseno(m.W[m.idx.get(a)], m.W[m.idx.get(b)]) - R().emb_cos[i])); }); return d; });
  [0, 1, 2, 3, 4].forEach((i) => {
    const caso = () => Dt().sg_casos[i], ref = () => R().sg_res[i];
    add(26, 'sgl' + i, `Pérdida skip-gram con muestreo negativo (caso ${i + 1})`, () => ref().loss, 'PyTorch (logsigmoid)', 1e-12, () => L.emb.sgnsPerdida(caso().w, caso().c, caso().ns));
    add(26, 'sgg' + i, `Gradiente respecto de los vectores (caso ${i + 1}): máxima diferencia con autograd`, 0, 'PyTorch autograd', 1e-12, () => { const g = L.emb.sgnsGrad(caso().w, caso().c, caso().ns), r = ref(); let d = 0; const cmp = (a, b) => a.forEach((x, k) => { d = Math.max(d, Math.abs(x - b[k])); }); cmp(g.gw, r.gw); cmp(g.gc, r.gc); g.gn.forEach((v, k) => cmp(v, r.gn[k])); return d; });
  });
  /* ---------- 27 · Clasificación de texto ---------- */
  const OP27 = () => L.corpus.opiniones;
  const CV27 = {};
  const cfg27 = (k) => { const c = Dt().clf_cfg[k]; return Object.assign({}, c, { vacias: c.vacias ? new Set(Dt().clf_stop) : null }); };
  const cv27 = (k) => CV27[k] || (CV27[k] = L.clf.validacionCruzada(OP27().map((r) => r.texto), OP27().map((r) => (k.startsWith('tema') ? r.tema : r.etiqueta)), 5, L.clf.tuberia(cfg27(k))));
  const NOM27 = { pol_nb: 'Bayes ingenuo con conteos (polaridad)', pol_nb2: 'Bayes ingenuo con TF-IDF de uni+bigramas (polaridad)', tema_nb: 'Bayes ingenuo por tema (10 clases)', pol_lr: 'regresión logística con conteos (polaridad)', pol_lr2: 'regresión logística con TF-IDF (polaridad)' };
  for (const k of Object.keys(NOM27)) {
    add(27, 'cvacc' + k, `Validación cruzada (5 bloques), ${NOM27[k]}: exactitud media`, () => R().clf[k].acc.reduce((a, b) => a + b, 0) / 5, 'scikit-learn (Pipeline + KFold)', 1e-9, () => cv27(k).media);
    add(27, 'cvpred' + k, `Predicciones de la validación cruzada, ${NOM27[k]}: suma de verificación`, () => R().clf[k].pred, 'scikit-learn cross_val_predict', 0, () => chk(cv27(k).pred.join(' ')));
    add(27, 'cvf1' + k, `${NOM27[k]}: F1 macro`, () => R().clf[k].macro, 'scikit-learn f1_score', 1e-12, () => { const y = OP27().map((r) => (k.startsWith('tema') ? r.tema : r.etiqueta)); return L.clf.metricas(y, cv27(k).pred).macroF1; });
    add(27, 'cvcm' + k, `${NOM27[k]}: matriz de confusión`, () => chk(R().clf[k].conf.flat().join(',')), 'scikit-learn confusion_matrix', 0, () => { const y = OP27().map((r) => (k.startsWith('tema') ? r.tema : r.etiqueta)); return chk(L.clf.metricas(y, cv27(k).pred).matriz.flat().join(',')); });
  }
  ['pol_lr', 'pol_lr2'].forEach((k) => {
    const modelo = () => { const f = L.clf.tuberia(cfg27(k))(OP27().map((r) => r.texto), OP27().map((r) => r.etiqueta)); return f.info; };
    add(27, 'lrp' + k, `Regresión logística (${k === 'pol_lr' ? 'conteos' : 'TF-IDF'}): máxima diferencia de probabilidad con scikit-learn en 40 opiniones`, 0, 'scikit-learn LogisticRegression (lbfgs, tol 1e-12)', 1e-6, () => { const { modelo: m, rep } = modelo(); let d = 0; OP27().slice(0, 40).forEach((r, i) => { d = Math.max(d, Math.abs(L.clf.lrProb(m, rep(r.texto)) - R().clf[k].prob[i])); }); return d; });
    add(27, 'lrb' + k, `Regresión logística (${k === 'pol_lr' ? 'conteos' : 'TF-IDF'}): intercepto`, () => R().clf[k].b, 'scikit-learn (lbfgs converge hasta ~1e-6)', 1e-5, () => modelo().modelo.b);
    add(27, 'lrw' + k, `Regresión logística (${k === 'pol_lr' ? 'conteos' : 'TF-IDF'}): norma de los pesos`, () => R().clf[k].normw, 'scikit-learn (lbfgs converge hasta ~1e-6)', 1e-5, () => Math.sqrt(Array.from(modelo().modelo.w).reduce((s, v) => s + v * v, 0)));
  });
  /* ---------- 28 · Redes neuronales ---------- */
  ['tanh', 'relu'].forEach((act) => {
    const red = () => { const c = Dt().nn_mlp[act]; return { capas: [3, 5, 4, 1], W: c.W.map((M) => M.map((r) => Float64Array.from(r))), b: c.b.map((v) => Float64Array.from(v)), act }; };
    add(28, 'mlpl' + act, `Perceptrón multicapa (${act}): pérdida de entropía cruzada binaria`, () => R().nn_mlp[act].loss, 'PyTorch (binary_cross_entropy)', 1e-12, () => L.nn.gradientes(red(), Dt().nn_mlp[act].X, Dt().nn_mlp[act].y).perdida);
    add(28, 'mlpg' + act, `Perceptrón multicapa (${act}): máxima diferencia de los gradientes con autograd`, 0, 'PyTorch autograd', 1e-12, () => { const g = L.nn.gradientes(red(), Dt().nn_mlp[act].X, Dt().nn_mlp[act].y), r = R().nn_mlp[act]; let d = 0; g.gW.forEach((M, l) => M.forEach((row, i) => row.forEach((v, j) => { d = Math.max(d, Math.abs(v - r.gW[l][i][j])); }))); g.gb.forEach((v, l) => v.forEach((x, i) => { d = Math.max(d, Math.abs(x - r.gb[l][i])); })); return d; });
    add(28, 'mlpp' + act, `Perceptrón multicapa (${act}): máxima diferencia de las probabilidades de salida`, 0, 'PyTorch', 1e-12, () => { const rd = red(); let d = 0; Dt().nn_mlp[act].X.forEach((x, i) => { d = Math.max(d, Math.abs(L.nn.prob(rd, x) - R().nn_mlp[act].prob[i])); }); return d; });
  });
  ['rnn', 'lstm'].forEach((t) => add(28, 'rec' + t, `${t === 'rnn' ? 'RNN de Elman' : 'LSTM'}: máxima diferencia de los estados ocultos de 6 pasos con PyTorch`, 0, 'PyTorch nn.' + t.toUpperCase(), 1e-12, () => { const r = L.nn.secuencia(t, Dt().nn_rec[t], Dt().nn_rec.x); let d = 0; r.hs.forEach((h, i) => h.forEach((v, j) => { d = Math.max(d, Math.abs(v - R().nn_rec[t][i][j])); })); return d; }));
  add(28, 'reccel', 'LSTM: máxima diferencia del estado de la celda final', 0, 'PyTorch nn.LSTM', 1e-12, () => { const r = L.nn.secuencia('lstm', Dt().nn_rec.lstm, Dt().nn_rec.x); let d = 0; r.c.forEach((v, j) => { d = Math.max(d, Math.abs(v - R().nn_rec.c[j])); }); return d; });
  ['f2', 'f3'].forEach((k) => add(28, 'conv' + k, `Convolución 1D (${k === 'f2' ? '3 filtros de ancho 2' : '2 filtros de ancho 3'}) con ReLU y max-pooling: máxima diferencia con PyTorch`, 0, 'PyTorch nn.Conv1d', 1e-12, () => { const o = L.nn.conv1dMax(Dt().nn_conv.x, Dt().nn_conv[k]); let d = 0; o.forEach((v, i) => { d = Math.max(d, Math.abs(v - R().nn_conv[k][i])); }); return d; }));
  /* ---------- 29 · Atención ---------- */
  const md = (A, B) => { let d = 0; A.forEach((r, i) => r.forEach((v, j) => { d = Math.max(d, Math.abs(v - B[i][j])); })); return d; };
  add(29, 'attw', 'Pesos de atención softmax(QKᵀ/√d): máxima diferencia con PyTorch', 0, 'PyTorch softmax', 1e-12, () => md(L.att.escalada(Dt().att.Q, Dt().att.K, Dt().att.V).pesos, R().att.w));
  add(29, 'atto', 'Salida de la atención: máxima diferencia con scaled_dot_product_attention', 0, 'PyTorch scaled_dot_product_attention', 1e-12, () => md(L.att.escalada(Dt().att.Q, Dt().att.K, Dt().att.V).salida, R().att.outsdpa));
  add(29, 'attc', 'Atención causal (máscara triangular): máxima diferencia de la salida', 0, 'PyTorch scaled_dot_product_attention(is_causal=True)', 1e-12, () => md(L.att.escalada(Dt().att.Qc, Dt().att.Kc, Dt().att.Vc, { mascara: 'causal' }).salida, R().att.oc));
  add(29, 'attcw', 'Atención causal: los pesos futuros son exactamente cero', 0, 'definición de la máscara', 0, () => { const w = L.att.escalada(Dt().att.Qc, Dt().att.Kc, Dt().att.Vc, { mascara: 'causal' }).pesos; let n = 0; w.forEach((r, i) => r.forEach((v, j) => { if (j > i && v !== 0) n++; })); return n; });
  /* ---------- 30 · Transformer ---------- */
  ['post_libre', 'post_causal', 'pre_libre', 'pre_causal'].forEach((k) => {
    const corre = () => { const c = Dt().tf_casos[k], n = c.x.length; return L.tf.bloque(c.x, c.par, { normPrimero: c.normPrimero, mascara: c.causal ? 'causal' : null }); };
    const nom = (k.startsWith('pre') ? 'normalización previa' : 'normalización posterior') + (k.endsWith('causal') ? ', máscara causal' : ', sin máscara');
    add(30, 'tfy' + k, `Bloque Transformer (${nom}): máxima diferencia de la salida con nn.TransformerEncoderLayer`, 0, 'PyTorch nn.TransformerEncoderLayer', 1e-11, () => md(corre().salida, R().tf_res[k].y));
    add(30, 'tfw' + k, `Bloque Transformer (${nom}): máxima diferencia de los pesos de atención de las 3 cabezas`, 0, 'PyTorch nn.MultiheadAttention', 1e-12, () => { const w = corre().pesos; let d = 0; w.forEach((m, h) => { d = Math.max(d, md(m, R().tf_res[k].w[h])); }); return d; });
  });
  [0, 1, 2].forEach((i) => add(30, 'tfpe' + i, `Codificación posicional sinusoidal (${['20 posiciones × 16', '7 posiciones × 8', '50 posiciones × 64'][i]} dimensiones): máxima diferencia con NumPy`, 0, 'NumPy', 1e-12, () => md(L.tf.posicional(...Dt().tf_pe[i]), R().tf_pe[i])));
  /* ---------- 31 · Codificación por pares de bytes ---------- */
  let BPE31 = null;
  const bpe31 = () => BPE31 || (BPE31 = L.bpe.entrenar(L.corpus.lm.train.flatMap((s) => s.split(' ')), 400));
  add(31, 'bpef', 'BPE: las 400 fusiones aprendidas (par y frecuencia) coinciden con la implementación independiente', 0, 'Python (Counter y búsqueda del par más frecuente)', 0, () => { let d = 0; R().bpe_fus.forEach(([a, b, f], i) => { const g = bpe31().fusiones[i]; if (!g || g[0] !== a || g[1] !== b || g[2] !== f) d++; }); return d + Math.abs(R().bpe_fus.length - bpe31().fusiones.length); });
  add(31, 'bpec', 'BPE: palabras codificadas de forma distinta en 124 palabras de prueba (incluidas palabras raras)', 0, 'Python', 0, () => { let d = 0; Dt().bpe_prueba.forEach((w, i) => { if (L.bpe.codificar(bpe31(), w).join('|') !== R().bpe_cod[i].join('|')) d++; }); return d; });
  add(31, 'bpe50', 'BPE: las 50 primeras fusiones, con un entrenamiento independiente de 50 pasos', 0, 'Python', 0, () => { const m = L.bpe.entrenar(L.corpus.lm.train.flatMap((s) => s.split(' ')), 50); let d = 0; R().bpe_fus50.forEach(([a, b, f], i) => { const g = m.fusiones[i]; if (!g || g[0] !== a || g[1] !== b || g[2] !== f) d++; }); return d; });
  /* ---------- 32 · Evaluación de texto generado ---------- */
  add(32, 'bleu1', 'BLEU de corpus (1 referencia, sin suavizado): diferencia con sacrebleu', 0, 'sacrebleu corpus_bleu (tokenize = none)', 1e-9, () => L.ev.bleuCorpus(Dt().ev_hips, Dt().ev_refs.map((r) => [r])).puntaje - R().ev_bleu1);
  add(32, 'bleu2', 'BLEU de corpus con 2 referencias por oración: diferencia con sacrebleu', 0, 'sacrebleu corpus_bleu (2 flujos de referencias)', 1e-9, () => L.ev.bleuCorpus(Dt().ev_hips, Dt().ev_refs.map((r, i) => [r, Dt().ev_refs2[i]])).puntaje - R().ev_bleu2);
  add(32, 'bleue', 'BLEU de corpus con suavizado exponencial: diferencia con sacrebleu', 0, 'sacrebleu corpus_bleu (smooth = exp)', 1e-9, () => L.ev.bleuCorpus(Dt().ev_hips, Dt().ev_refs.map((r) => [r]), { suavizado: 'exp' }).puntaje - R().ev_bleu_exp);
  add(32, 'bleus', 'BLEU de oración (40 pares): máxima diferencia con sacrebleu.sentence_bleu', 0, 'sacrebleu sentence_bleu', 1e-9, () => { let d = 0; Dt().ev_hips.forEach((h, i) => { d = Math.max(d, Math.abs(L.ev.bleuOracion(h, Dt().ev_refs[i]).puntaje - R().ev_bleu_s[i])); }); return d; });
  [['r1', 0, 'ROUGE-1'], ['r2', 1, 'ROUGE-2'], ['rl', 2, 'ROUGE-L']].forEach(([k, j, nom]) => add(32, 'rouge' + k, `${nom} (precisión, cobertura y F1 de 40 pares): máxima diferencia con rouge-score`, 0, 'rouge-score (sin raíces)', 1e-12, () => { let d = 0; Dt().ev_hips.forEach((h, i) => { const x = L.ev.rouge(h, Dt().ev_refs[i], { sinTildes: true })[k], r = R().ev_rouge[i][j]; d = Math.max(d, Math.abs(x.p - r[0]), Math.abs(x.r - r[1]), Math.abs(x.f - r[2])); }); return d; }));
  /* ---------- 33 · Reconocimiento de entidades ---------- */
  let NER33 = null, PRED33 = null;
  const ner33 = () => { if (!NER33) { NER33 = L.ner.entrenar(L.corpus.ner.tr, 5); PRED33 = L.corpus.ner.te.map((s) => L.ner.etiquetar(NER33, s.map((x) => x[0]))); } return PRED33; };
  add(33, 'nerp', 'Perceptrón promediado de entidades: etiquetas predichas en las 300 oraciones de prueba (suma de verificación)', () => R().ner_pred, 'Python (py/33-ner.py, misma implementación)', 0, () => chk(ner33().map((p) => p.join(' ')).join(' ')));
  add(33, 'nerq', 'Perceptrón promediado de entidades: oraciones etiquetadas de forma distinta en las 60 primeras', 0, 'Python (py/33-ner.py)', 0, () => { let d = 0; ner33(); R().ner_pred_ini.forEach((s, i) => { if (PRED33[i].join(' ') !== s) d++; }); return d; });
  ['LOC', 'MISC', 'ORG', 'PER', 'TOTAL'].forEach((t) => add(33, 'nere' + t, `Evaluación por entidades (${t}): precisión, cobertura y F1 del tagger, máxima diferencia`, 0, 'Python (conlleval, implementación independiente)', 1e-12, () => { ner33(); const e = L.ner.evaluar(L.corpus.ner.te.map((s) => s.map((x) => x[1])), PRED33)[t], r = R().ner_eval[t]; return Math.max(Math.abs(e.p - r[0]), Math.abs(e.r - r[1]), Math.abs(e.f - r[2])); }));
  ['LOC', 'MISC', 'ORG', 'PER', 'TOTAL'].forEach((t) => add(33, 'nerx' + t, `Evaluación por entidades (${t}) con etiquetas perturbadas al azar (casos límite de BIO)`, 0, 'Python', 1e-12, () => { const e = L.ner.evaluar(Dt().ner_oro, Dt().ner_pert)[t], r = R().ner_pert_eval[t]; return Math.max(Math.abs(e.p - r[0]), Math.abs(e.r - r[1]), Math.abs(e.f - r[2])); }));
  add(33, 'nerent', 'Extracción de entidades de 50 secuencias BIO perturbadas: diferencias con la implementación de Python', 0, 'Python', 0, () => { let d = 0; Dt().ner_pert.slice(0, 50).forEach((p, i) => { if (JSON.stringify(L.ner.entidades(p).map((e) => e.join(':')).sort()) !== JSON.stringify(R().ner_ent[i].map((e) => e.join(':')).sort())) d++; }); return d; });
  /* ---------- 12 · Perceptrón promediado ---------- */
  [true, false].forEach((g) => [1, 5].forEach((ep) => {
    const key = 'perc_' + (g ? 1 : 0) + '_' + ep;
    const run = () => { const m = L.perc.fit(L.corpus.cess.slice(0, 240), { coarse: g, epochs: ep }); const te = L.corpus.cess.slice(240).map((s) => s.map(([w, t]) => [w, g ? L.hmm.coarse(t) : t])); const pr = te.map((s) => m.predecir(s.map(([w]) => w))); return { m, te, pr }; };
    add(12, 'pk' + g + ep, `Perceptrón promediado (${g ? 'gruesas' : 'EAGLES'}, ${ep} época${ep > 1 ? 's' : ''}): palabras bien etiquetadas`, () => R()[key][0], 'Python (implementación independiente del mismo algoritmo)', 0, () => { const { te, pr } = run(); let ok = 0; pr.forEach((p, i) => te[i].forEach(([, t], j) => { if (p[j] === t) ok++; })); return ok; });
    add(12, 'pc' + g + ep, `Perceptrón (${g ? 'gruesas' : 'EAGLES'}, ${ep} época${ep > 1 ? 's' : ''}): suma de verificación de las etiquetas predichas`, () => R()[key][1], 'Python', 0, () => chk(run().pr.flat().join(' ')));
    add(12, 'pn' + g + ep, `Perceptrón (${g ? 'gruesas' : 'EAGLES'}, ${ep}): rasgos con peso no nulo`, () => R()[key][2], 'Python', 0, () => run().m.nRasgos);
  }));

  /* Ejecuta una prueba y devuelve {ok, v, ref, err, msg} */
  L.runCheck = function (c) {
    try {
      const v = c.fn();
      const ref = typeof c.ref === 'function' ? c.ref() : c.ref;
      const err = c.rel ? Math.abs(v - ref) / Math.max(1e-300, Math.abs(ref)) : Math.abs(v - ref);
      return { ok: isFinite(v) && err <= c.tol, v, ref, err };
    } catch (e) {
      return { ok: false, v: NaN, ref: NaN, err: Infinity, msg: String(e && e.message ? e.message : e) };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);




