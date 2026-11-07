/* Cálculo puro (sin DOM) para resultados de aprendizaje: lo usan las herramientas y tests/validar.js */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  EM.calc = EM.calc || {};
  const C = (EM.calc.ra = {});

  /* ---------- Texto ---------- */
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  C.norm = norm;
  const words = (s) => String(s).trim().split(/\s+/).filter(Boolean);
  C.nPalabras = (s) => words(s).length;

  /* ---------- Taxonomía de Bloom revisada (Anderson y Krathwohl, 2001) ---------- */
  C.NIVELES = ['Recordar', 'Comprender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear'];
  /* verbos regulares en infinitivo por nivel [nivel 1..6]; dom: c cognitivo, p psicomotor, a afectivo/actitudinal */
  C.VERBOS = {
    1: ['definir', 'enumerar', 'nombrar', 'identificar', 'reconocer', 'listar', 'citar', 'recordar', 'etiquetar', 'señalar'],
    2: ['explicar', 'describir', 'interpretar', 'clasificar', 'resumir', 'ejemplificar', 'comparar', 'traducir', 'inferir', 'parafrasear', 'relacionar', 'estimar'],
    3: ['aplicar', 'calcular', 'utilizar', 'emplear', 'ejecutar', 'implementar', 'resolver', 'operar', 'liderar', 'dirigir', 'coordinar', 'gestionar', 'administrar', 'comunicar', 'presentar', 'redactar', 'colaborar', 'calibrar', 'montar', 'medir', 'programar', 'manipular', 'simular', 'modelar', 'registrar', 'determinar', 'demostrar'],
    4: ['analizar', 'diferenciar', 'contrastar', 'examinar', 'diagnosticar', 'descomponer', 'organizar', 'atribuir', 'caracterizar', 'deducir', 'distinguir', 'cuestionar', 'investigar'],
    5: ['evaluar', 'valorar', 'justificar', 'argumentar', 'criticar', 'verificar', 'validar', 'juzgar', 'seleccionar', 'priorizar', 'defender', 'comprobar', 'decidir'],
    6: ['diseñar', 'formular', 'proponer', 'construir', 'desarrollar', 'planificar', 'generar', 'elaborar', 'crear', 'componer', 'optimizar', 'integrar', 'innovar', 'sintetizar', 'predecir', 'prototipar']
  };
  /* verbos con cambio vocálico u otra irregularidad: formas finitas explícitas */
  const IRREG = {
    resolver: ['resuelve', 'resolverá', 'resuelven', 'resolverán'], demostrar: ['demuestra', 'demostrará', 'demuestran', 'demostrarán'],
    comprobar: ['comprueba', 'comprobará', 'comprueban', 'comprobarán'], recordar: ['recuerda', 'recordará', 'recuerdan', 'recordarán'],
    medir: ['mide', 'medirá', 'miden', 'medirán'], defender: ['defiende', 'defenderá', 'defienden', 'defenderán'], construir: ['construye', 'construirá', 'construyen', 'construirán'],
    proponer: ['propone', 'propondrá', 'proponen', 'propondrán'], componer: ['compone', 'compondrá', 'componen', 'compondrán'], predecir: ['predice', 'predecirá', 'predicen', 'predecirán'],
    deducir: ['deduce', 'deducirá', 'deducen', 'deducirán'], descomponer: ['descompone', 'descompondrá', 'descomponen', 'descompondrán'], decidir: ['decide', 'decidirá', 'deciden', 'decidirán'],
    elegir: ['elige', 'elegirá', 'eligen', 'elegirán'], seleccionar: ['selecciona', 'seleccionará', 'seleccionan', 'seleccionarán'], contrastar: ['contrasta', 'contrastará', 'contrastan', 'contrastarán'],
    atribuir: ['atribuye', 'atribuirá', 'atribuyen', 'atribuirán'], concluir: ['concluye', 'concluirá', 'concluyen', 'concluirán'], sintetizar: ['sintetiza', 'sintetizará', 'sintetizan', 'sintetizarán'],
    comparar: ['compara', 'comparará', 'comparan', 'compararán']
  };
  C.formas = function (inf) {
    if (IRREG[inf]) return [inf].concat(IRREG[inf]);
    const stem = inf.slice(0, -2), t = inf.slice(-2);
    if (t === 'ar') return [inf, stem + 'a', stem + 'ará', stem + 'an', stem + 'arán'];
    if (t === 'er') return [inf, stem + 'e', stem + 'erá', stem + 'en', stem + 'erán'];
    return [inf, stem + 'e', stem + 'irá', stem + 'en', stem + 'irán'];
  };
  const verboIdx = {}; /* forma normalizada → {inf, nivel} */
  Object.keys(C.VERBOS).forEach((n) => C.VERBOS[n].forEach((v) => C.formas(v).forEach((f) => { if (!verboIdx[norm(f)]) verboIdx[norm(f)] = { inf: v, nivel: +n }; })));
  C.buscarVerbo = (w) => verboIdx[norm(w)] || null;

  /* verbos o giros poco observables */
  C.VAGOS = ['conocer', 'saber', 'entender', 'apreciar', 'familiarizar', 'ser consciente', 'dominar', 'interesar', 'aprender', 'tener conocimiento', 'adquirir conocimiento', 'estar al tanto', 'tener idea', 'asimilar', 'captar', 'vivenciar', 'comprender'];
  const vagoRe = /\b(conoc\w+|sab\w+|entend\w+|entiend\w+|aprecia\w*|familiariz\w+|consciente|domina\w*|interes\w+|aprend\w+|asimila\w*|capta\w*|vivencia\w*|comprend\w+|comprenden)\b/;
  C.esVago = (txt) => {
    const t = norm(txt);
    const m = t.match(vagoRe);
    if (m) return m[0];
    if (/tener conocimiento|adquirir conocimiento|estar al tanto|tener (una )?idea/.test(t)) return 'tener conocimiento';
    return null;
  };
  /* giros centrados en el docente o el programa, no en el estudiante */
  const docenteRe = /\b(ensenar|ensena|ofrecer|ofrece|brindar|brinda|proporcionar|proporciona|capacitar|capacita|se pretende|se busca|pretende|el docente|el profesor|el programa (busca|pretende|ofrece|brinda)|formar al|dar a conocer|exponer al)\b/;
  C.centradoDocente = (txt) => { const m = norm(txt).match(docenteRe); return m ? m[0] : null; };

  /* ---------- Análisis de un resultado de aprendizaje ---------- */
  const PRE = /^(?:\s*(?:al\s+(?:finalizar|terminar|completar|concluir)[^,]*,\s*)?(?:el|la)\s+(?:estudiante|egresad[oa]|ingenier[oa]\s+f[ií]sic[oa]|graduad[oa])\s+(?:ser[aá]\s+capaz\s+de|podr[aá]|es\s+capaz\s+de|ser[aá]\s+competente\s+para|sabr[aá]|estar[aá]\s+en\s+capacidad\s+de)?\s*|\s*ser\s+capaz\s+de\s+|\s*(?:capacidad|habilidad)\s+(?:de|para)\s+)/i;
  C.analizar = function (texto) {
    const raw = String(texto || '').trim();
    const out = { texto: raw, n: C.nPalabras(raw), verbo: null, nivel: null, nivelNombre: null, vago: null, docente: null, contexto: false, estandar: false, valores: false, verbosExtra: 0, checks: [], puntaje: 0, avisos: [] };
    if (!raw) return out;
    const sinPre = raw.replace(PRE, '');
    const toks = words(sinPre.replace(/[,;:.()]/g, ' '));
    /* primer verbo conocido en las primeras 6 palabras */
    let found = null;
    for (let i = 0; i < Math.min(6, toks.length) && !found; i++) { const v = C.buscarVerbo(toks[i]); if (v) found = v; }
    if (found) { out.verbo = found.inf; out.nivel = found.nivel; out.nivelNombre = C.NIVELES[found.nivel - 1]; }
    /* verbos adicionales (coordinados con «y» o comas): pistas de resultado compuesto */
    let extra = 0;
    for (let i = 0; i < toks.length; i++) { const v = C.buscarVerbo(toks[i]); if (v) extra++; }
    out.verbosExtra = Math.max(0, extra - 1);
    out.vago = C.esVago(sinPre.split(/\s+/).slice(0, 4).join(' ')) || (found ? null : C.esVago(raw));
    out.docente = C.centradoDocente(raw);
    const t = norm(raw);
    out.contexto = /\b(en|para|mediante|a partir de|con base en|usando|utilizando|aplicando|durante|en el marco de|en contextos?|en situaciones|en problemas|en proyectos|en sistemas|en laboratorio)\b/.test(t) && out.n >= 10;
    out.estandar = /\b(con criterios?|segun|conforme|de acuerdo con|cumpliendo|normas?|norma|incertidumbre|justificando|argumentando|con rigor|con precision|con error|verificando|validando|contrastando|y documentando|documentando|fundamentad[oa]|con evidencia|ntc|iso|iec|ieee|astm)\b/.test(t);
    out.valores = /(etic|responsab|sostenib|seguridad|ambient|social|equidad|inclusi|colabor|equipo|liderazgo|integridad|normativ|legal)/.test(t);
    const ch = out.checks;
    ch.push({ id: 'verbo', ok: !!found && !out.vago, txt: 'Empieza con un verbo observable (qué hará el estudiante)' });
    ch.push({ id: 'vago', ok: !out.vago, txt: 'Evita verbos no verificables (conocer, saber, entender, dominar…)' });
    ch.push({ id: 'estudiante', ok: !out.docente, txt: 'Está centrado en el estudiante, no en lo que hace el programa o el docente' });
    ch.push({ id: 'longitud', ok: out.n >= 10 && out.n <= 45, txt: 'Longitud razonable: entre 10 y 45 palabras' });
    ch.push({ id: 'unico', ok: out.verbosExtra <= 2, txt: 'No amontona demasiadas acciones en un solo resultado (máximo 3 verbos)' });
    ch.push({ id: 'contexto', ok: out.contexto, txt: 'Indica en qué contexto o con qué objeto se demuestra' });
    ch.push({ id: 'estandar', ok: out.estandar, txt: 'Da una pista del criterio o estándar de calidad (norma, incertidumbre, justificación…)' });
    ch.push({ id: 'nivel', ok: !!found && found.nivel >= 3, txt: 'Nivel cognitivo adecuado a un resultado de egreso (aplicar o superior)' });
    out.puntaje = Math.round((100 * ch.filter((c) => c.ok).length) / ch.length);
    if (!found && !out.vago) out.avisos.push('No reconocí un verbo de la lista. Si usa uno válido, compruebe que sea observable.');
    return out;
  };

  /* ---------- Crédito académico (Decreto 1330 de 2019, art. 2.5.3.2.4.1): 48 horas ---------- */
  C.HORAS_CREDITO = 48;
  C.creditos = (hDirectas, hIndep) => Math.round((hDirectas + hIndep) / C.HORAS_CREDITO);
  C.horasPorCredito = (cr) => cr * C.HORAS_CREDITO;
  C.proporcion = (hDirectas, hIndep) => (hDirectas + hIndep > 0 ? hDirectas / (hDirectas + hIndep) : 0);

  /* ---------- Concordancia entre evaluadores ---------- */
  /* M: matriz k×k de conteos (filas = evaluador A, columnas = evaluador B) */
  C.total = (M) => M.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);
  C.acuerdo = (M) => { const n = C.total(M); let d = 0; for (let i = 0; i < M.length; i++) d += M[i][i]; return n ? d / n : 0; };
  C.kappa = function (M) {
    const n = C.total(M), k = M.length;
    if (!n) return 0;
    const po = C.acuerdo(M);
    let pe = 0;
    for (let i = 0; i < k; i++) { const fi = M[i].reduce((a, b) => a + b, 0) / n; let cj = 0; for (let j = 0; j < k; j++) cj += M[j][i]; pe += fi * (cj / n); }
    return pe >= 1 ? 1 : (po - pe) / (1 - pe);
  };
  /* kappa ponderado: tipo 'lineal' o 'cuadratico' */
  C.kappaPonderado = function (M, tipo = 'cuadratico') {
    const n = C.total(M), k = M.length;
    if (!n || k < 2) return 0;
    const w = (i, j) => { const d = Math.abs(i - j) / (k - 1); return tipo === 'lineal' ? d : d * d; };
    const fi = M.map((r) => r.reduce((a, b) => a + b, 0) / n);
    const cj = M[0].map((_, j) => M.reduce((a, r) => a + r[j], 0) / n);
    let o = 0, e = 0;
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { o += w(i, j) * (M[i][j] / n); e += w(i, j) * fi[i] * cj[j]; }
    return e === 0 ? 1 : 1 - o / e;
  };
  C.interpretaKappa = (k) => (k < 0 ? 'peor que el azar' : k < 0.2 ? 'leve' : k < 0.4 ? 'aceptable' : k < 0.6 ? 'moderada' : k < 0.8 ? 'sustancial' : 'casi perfecta');
  /* alfa de Cronbach: X = filas (estudiantes) × columnas (criterios) */
  C.alfaCronbach = function (X) {
    const n = X.length, k = X[0].length;
    if (n < 2 || k < 2) return NaN;
    const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
    const vari = (a) => { const m = mean(a); return a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1); };
    const sumVar = X[0].map((_, j) => vari(X.map((r) => r[j]))).reduce((a, b) => a + b, 0);
    const tot = vari(X.map((r) => r.reduce((a, b) => a + b, 0)));
    return (k / (k - 1)) * (1 - sumVar / tot);
  };

  /* ---------- Muestreo de evidencias ---------- */
  /* tamaño de muestra para estimar una proporción p con margen e, confianza z, población finita N */
  C.Z = { 0.80: 1.2815515655446004, 0.85: 1.4395314709384563, 0.90: 1.6448536269514722, 0.95: 1.959963984540054, 0.99: 2.5758293035489004 };
  C.tamMuestra = function (N, e, conf = 0.95, p = 0.5) {
    const z = C.Z[conf];
    const n0 = (z * z * p * (1 - p)) / (e * e);
    return Math.min(N, Math.ceil(n0 / (1 + (n0 - 1) / N)));
  };
  /* intervalo de Wilson para una proporción observada x/n */
  C.wilson = function (x, n, conf = 0.95) {
    if (!n) return [0, 1];
    const z = C.Z[conf], p = x / n, z2 = z * z;
    const c = (p + z2 / (2 * n)) / (1 + z2 / n);
    const h = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
    return [Math.max(0, c - h), Math.min(1, c + h)];
  };

  /* ---------- Logro por niveles de desempeño ---------- */
  /* dist: porcentajes (o conteos) por nivel de menor a mayor; devuelve proporción en nivel ≥ L (L desde 1) */
  C.propDesde = function (dist, L) {
    const tot = dist.reduce((a, b) => a + b, 0);
    if (!tot) return 0;
    let s = 0;
    for (let i = L - 1; i < dist.length; i++) s += dist[i];
    return s / tot;
  };
  C.semaforo = (prop, meta) => (prop >= meta ? 'cumple' : prop >= meta - 0.1 ? 'cerca' : 'brecha');
  C.puntajeMedio = function (dist) {
    const tot = dist.reduce((a, b) => a + b, 0);
    return tot ? dist.reduce((s, v, i) => s + v * (i + 1), 0) / tot : 0;
  };
  /* Modelo simple del ciclo de mejora: el logro sube una fracción de la brecha cuando se cierra el ciclo */
  C.simCiclo = function (a0, meta, eficacia, ciclos, cierra, ruido = 0, seed = 1) {
    let a = a0, s = seed;
    const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 - 0.5; };
    const out = [a];
    for (let i = 0; i < ciclos; i++) {
      const gap = Math.max(0, meta - a);
      a = cierra ? a + eficacia * gap : a;
      a = Math.min(1, Math.max(0, a + ruido * rnd()));
      out.push(a);
    }
    return out;
  };

  /* ---------- Matriz curricular (I = introduce, R = refuerza, M = domina) ---------- */
  /* cursos: [{n, sem}], ras: [id], M[i][j] ∈ '', 'I','R','M' */
  C.analizarMatriz = function (cursos, nras, M) {
    const res = { porRA: [], porCurso: [], avisos: [] };
    for (let j = 0; j < nras; j++) {
      const cnt = { I: 0, R: 0, M: 0 }, sems = { I: [], R: [], M: [] };
      cursos.forEach((c, i) => { const v = (M[i] && M[i][j]) || ''; if (v) { cnt[v]++; sems[v].push(c.sem); } });
      const total = cnt.I + cnt.R + cnt.M;
      const prob = [];
      if (total === 0) prob.push('sin cobertura');
      else {
        if (!cnt.M) prob.push('nunca se llega a dominio (M)');
        if (!cnt.I) prob.push('nunca se introduce (I)');
        if (cnt.M && cnt.I && Math.min(...sems.M) < Math.min(...sems.I)) prob.push('se domina antes de introducirse');
        if (cnt.M && !cnt.R && cnt.I) prob.push('salta de I a M sin refuerzo');
        if (cnt.M && Math.max(...sems.M) < 8 && false) prob.push('');
        if (total < 3) prob.push('cobertura débil (menos de 3 cursos)');
      }
      res.porRA.push({ cnt, total, prob, ok: prob.length === 0 });
    }
    cursos.forEach((c, i) => {
      const row = M[i] || [];
      const n = row.filter(Boolean).length;
      res.porCurso.push({ n, sobrecarga: n > 4 });
    });
    res.avisos = res.porRA.map((r, j) => r.prob.map((p) => ['RA' + (j + 1), p])).flat();
    res.cobertura = res.porRA.filter((r) => r.total > 0).length / Math.max(1, nras);
    return res;
  };

  /* ---------- Autodiagnóstico: puntaje ponderado por factor ---------- */
  C.puntajeGrupos = function (items, resp) {
    /* items: [{g, w}] ; resp: [0..3] ; devuelve {g: fracción 0..1} */
    const acc = {};
    items.forEach((it, i) => { const a = (acc[it.g] = acc[it.g] || { s: 0, m: 0 }); a.s += (resp[i] || 0) * (it.w || 1); a.m += 3 * (it.w || 1); });
    const out = {};
    Object.keys(acc).forEach((g) => (out[g] = acc[g].m ? acc[g].s / acc[g].m : 0));
    return out;
  };

  /* Fechas y estados de cada norma (se usan en la línea normativa y se prueban en tests/t-02-normas.js) */
  C.FECHAS = {
    'Ley 30 de 1992': [['1992-12-28', 'vigente']],
    'Ley 1188 de 2008': [['2008-04-25', 'vigente']],
    'Decreto 1075 de 2015': [['2015-05-26', 'vigente']],
    'Decreto 1330 de 2019': [['2019-07-25', 'vigente']],
    'Acuerdo CESU 02 de 2020': [['2020-07-01', 'vigente'], ['2025-05-28', 'transicion', 'Derogado por el Acuerdo 01 de 2025 (art. 73), pero el art. 68 dispone aplicación gradual: la lectura prudente es que rige para informes de autoevaluación radicados antes del 1-ene-2027. Confírmelo con el CNA.'], ['2027-01-01', 'derogada']],
    'Resolución 21795 de 2020 (MEN)': [['2020-11-19', 'vigente'], ['2023-03-31', 'derogada', 'Derogada por la Resolución 2265 de 2023 (art. 12).']],
    'Decreto 1649 de 2021': [['2021-12-06', 'vigente']],
    'Resolución 2265 de 2023 (MEN)': [['2023-03-31', 'vigente'], ['2024-04-29', 'derogada', 'Derogada por el Decreto 529 de 2024 (art. 9).']],
    'Decreto 529 de 2024': [['2024-04-29', 'vigente']],
    'Acuerdo CESU 01 de 2025': [['2025-05-28', 'transicion', 'Expedido el 26-may-2025; aplicación gradual (art. 68): condiciones iniciales desde 1-ene-2026; autoevaluación de programas desde 1-ene-2027; renovaciones desde 1-jun-2027.'], ['2027-06-01', 'vigente']]
  };
  C.estadoEn = function (hit, fecha) {
    let cur = ['previa', ''];
    for (const [d, st, nota] of hit) if (d <= fecha) cur = [st, nota || '']; else break;
    return cur;
  };

  /* ---------- Fechas para el cronograma ---------- */
  C.sumaDias = (iso, d) => { const t = new Date(iso + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };
  C.difDias = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
  /* Programación hacia atrás: tareas [{n, dur, dep:[índices]}] terminan antes de la fecha límite */
  C.programaAtras = function (tareas, limite) {
    const fin = tareas.map(() => null), ini = tareas.map(() => null);
    const sucesores = tareas.map(() => []);
    tareas.forEach((t, i) => (t.dep || []).forEach((d) => sucesores[d].push(i)));
    const calc = (i) => {
      if (fin[i] !== null) return;
      let f = limite;
      sucesores[i].forEach((s) => { calc(s); f = f < ini[s] ? f : ini[s]; });
      fin[i] = f; ini[i] = C.sumaDias(f, -tareas[i].dur);
    };
    tareas.forEach((_, i) => calc(i));
    return tareas.map((t, i) => ({ n: t.n, ini: ini[i], fin: fin[i], dur: t.dur }));
  };
})(typeof window !== 'undefined' ? window : global);
