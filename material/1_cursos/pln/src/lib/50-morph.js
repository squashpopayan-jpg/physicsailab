/* ===================================================================
   lib/50-morph.js — Morfología del español: lexicón mínimo, hechos
   morfotácticos y reglas ortográficas. Genera todas las formas de cada
   entrada (nivel léxico → intermedio → superficie) y las indexa para
   analizar (superficie → lema + rasgos), como un analizador de dos niveles.
   Nivel intermedio: raíz ^ sufijo #   (^ frontera de morfemas, # de palabra)
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const M = (L.morph = {});

  /* ---------- Reglas ortográficas (sobre la cadena intermedia) ---------- */
  const V = 'aeiouáéíóúü';
  M.reglas = {
    /* Inserción de «e»: consonante + ^s# → consonante + ^es# (lugar^s# → lugar^es#) */
    insercionE: (s) => s.replace(new RegExp('([^' + V + '^#])\\^s#$'), '$1^es#'),
    /* z → c ante e: nuez^es# → nuec^es# */
    zc: (s) => s.replace(/z\^e/g, 'c^e'),
    /* Pérdida de tilde ante n/s + ^e: canción^es# → cancion^es# */
    tilde: (s) => s.replace(/([áéíóú])([ns])\^e/g, (m, v, c) => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }[v]) + c + '^e'),
    /* Eliminar fronteras */
    limpiar: (s) => s.replace(/[\^#]/g, '')
  };
  M.aplicarReglas = (inter) => M.reglas.limpiar(M.reglas.tilde(M.reglas.zc(M.reglas.insercionE(inter))));
  /* Pasos intermedios, para mostrar la cascada */
  M.cascada = function (inter) {
    const a = M.reglas.insercionE(inter), b = M.reglas.zc(a), c = M.reglas.tilde(b), d = M.reglas.limpiar(c);
    return [{ regla: 'entrada', s: inter }, { regla: 'inserción de e', s: a }, { regla: 'z → c ante e', s: b }, { regla: 'pérdida de tilde', s: c }, { regla: 'quitar fronteras', s: d }];
  };

  /* ---------- Lexicón: sustantivos, adjetivos y verbos ---------- */
  /* Entradas: {l: lema, c: 'N'|'ADJ'|'V', g: género, k: clase, r: raíz}. Clases nominales:
     o (gat-o/-a), vc (termina en vocal: padre), cons (consonante), e/ac (adjetivos de una terminación), irr (formas explícitas) */
  M.LEX = [
    /* clase o: la raíz pierde la vocal final; «alt» = alternancia de género */
    { l: 'gato', c: 'N', g: 'm', k: 'o', r: 'gat', alt: true }, { l: 'niño', c: 'N', g: 'm', k: 'o', r: 'niñ', alt: true }, { l: 'perro', c: 'N', g: 'm', k: 'o', r: 'perr', alt: true },
    { l: 'amigo', c: 'N', g: 'm', k: 'o', r: 'amig', alt: true }, { l: 'hermano', c: 'N', g: 'm', k: 'o', r: 'herman', alt: true },
    { l: 'libro', c: 'N', g: 'm', k: 'o', r: 'libr' }, { l: 'vino', c: 'N', g: 'm', k: 'o', r: 'vin' }, { l: 'canto', c: 'N', g: 'm', k: 'o', r: 'cant' }, { l: 'casa', c: 'N', g: 'f', k: 'o', r: 'cas' },
    { l: 'mesa', c: 'N', g: 'f', k: 'o', r: 'mes' }, { l: 'palabra', c: 'N', g: 'f', k: 'o', r: 'palabr' }, { l: 'texto', c: 'N', g: 'm', k: 'o', r: 'text' },
    { l: 'modelo', c: 'N', g: 'm', k: 'o', r: 'model' }, { l: 'idioma', c: 'N', g: 'm', k: 'o', r: 'idiom' },
    /* clase vocal: plural con -s */
    { l: 'padre', c: 'N', g: 'm', k: 'vc', r: 'padre' }, { l: 'parque', c: 'N', g: 'm', k: 'vc', r: 'parque' }, { l: 'noche', c: 'N', g: 'f', k: 'vc', r: 'noche' }, { l: 'tarde', c: 'N', g: 'f', k: 'vc', r: 'tarde' }, { l: 'café', c: 'N', g: 'm', k: 'vc', r: 'café' },
    /* clase consonante: plural con -es y reglas */
    { l: 'lugar', c: 'N', g: 'm', k: 'cons', r: 'lugar' }, { l: 'ciudad', c: 'N', g: 'f', k: 'cons', r: 'ciudad' }, { l: 'nuez', c: 'N', g: 'f', k: 'cons', r: 'nuez' }, { l: 'lápiz', c: 'N', g: 'm', k: 'cons', r: 'lápiz' },
    { l: 'canción', c: 'N', g: 'f', k: 'cons', r: 'canción' }, { l: 'razón', c: 'N', g: 'f', k: 'cons', r: 'razón' }, { l: 'autobús', c: 'N', g: 'm', k: 'cons', r: 'autobús' }, { l: 'color', c: 'N', g: 'm', k: 'cons', r: 'color' }, { l: 'pan', c: 'N', g: 'm', k: 'cons', r: 'pan' },
    { l: 'mujer', c: 'N', g: 'f', k: 'cons', r: 'mujer' },
    /* irregulares: formas explícitas */
    { l: 'examen', c: 'N', g: 'm', k: 'irr', f: [['examen', 'Sg'], ['exámenes', 'Pl']] }, { l: 'joven', c: 'N', g: 'mf', k: 'irr', f: [['joven', 'Sg'], ['jóvenes', 'Pl']] },
    { l: 'espray', c: 'N', g: 'm', k: 'irr', f: [['espray', 'Sg'], ['espráis', 'Pl']] }, { l: 'lunes', c: 'N', g: 'm', k: 'irr', f: [['lunes', 'Sg'], ['lunes', 'Pl']] },
    /* adjetivos */
    { l: 'blanco', c: 'ADJ', k: 'o', r: 'blanc' }, { l: 'pequeño', c: 'ADJ', k: 'o', r: 'pequeñ' }, { l: 'largo', c: 'ADJ', k: 'o', r: 'larg' }, { l: 'nuevo', c: 'ADJ', k: 'o', r: 'nuev' },
    { l: 'grande', c: 'ADJ', k: 'e', r: 'grande' }, { l: 'fuerte', c: 'ADJ', k: 'e', r: 'fuerte' }, { l: 'azul', c: 'ADJ', k: 'ac', r: 'azul' }, { l: 'fácil', c: 'ADJ', k: 'ac', r: 'fácil' },
    /* verbos regulares */
    ...['cantar', 'hablar', 'estudiar', 'caminar', 'comprar', 'trabajar', 'mirar', 'escuchar', 'procesar', 'etiquetar', 'aprender', 'comer', 'beber', 'correr', 'vender', 'comprender', 'escribir', 'vivir', 'subir', 'partir', 'decidir', 'recibir', 'abrir'].map((l) => ({ l, c: 'V', k: l.endsWith('ar') ? 'ar' : l.endsWith('er') ? 'er' : 'ir', r: l.slice(0, -2) })),
    /* verbos irregulares: formas explícitas [forma, rasgos] */
    { l: 'venir', c: 'V', k: 'irr', f: [['venir', 'Inf'], ['viniendo', 'Ger'], ['venido', 'Part'], ['vengo', 'Pres 1P Sg'], ['vienes', 'Pres 2P Sg'], ['viene', 'Pres 3P Sg'], ['venimos', 'Pres 1P Pl'], ['venís', 'Pres 2P Pl'], ['vienen', 'Pres 3P Pl'],
      ['vine', 'Perf 1P Sg'], ['viniste', 'Perf 2P Sg'], ['vino', 'Perf 3P Sg'], ['vinimos', 'Perf 1P Pl'], ['vinisteis', 'Perf 2P Pl'], ['vinieron', 'Perf 3P Pl']] },
    { l: 'ser', c: 'V', k: 'irr', f: [['ser', 'Inf'], ['siendo', 'Ger'], ['sido', 'Part'], ['soy', 'Pres 1P Sg'], ['eres', 'Pres 2P Sg'], ['es', 'Pres 3P Sg'], ['somos', 'Pres 1P Pl'], ['sois', 'Pres 2P Pl'], ['son', 'Pres 3P Pl'],
      ['fui', 'Perf 1P Sg'], ['fuiste', 'Perf 2P Sg'], ['fue', 'Perf 3P Sg'], ['fuimos', 'Perf 1P Pl'], ['fuisteis', 'Perf 2P Pl'], ['fueron', 'Perf 3P Pl']] },
    { l: 'ir', c: 'V', k: 'irr', f: [['ir', 'Inf'], ['yendo', 'Ger'], ['ido', 'Part'], ['voy', 'Pres 1P Sg'], ['vas', 'Pres 2P Sg'], ['va', 'Pres 3P Sg'], ['vamos', 'Pres 1P Pl'], ['vais', 'Pres 2P Pl'], ['van', 'Pres 3P Pl'],
      ['fui', 'Perf 1P Sg'], ['fuiste', 'Perf 2P Sg'], ['fue', 'Perf 3P Sg'], ['fuimos', 'Perf 1P Pl'], ['fuisteis', 'Perf 2P Pl'], ['fueron', 'Perf 3P Pl']] }
  ];
  /* Palabras funcionales de clase cerrada (listadas completas, sin morfología) */
  M.CERRADAS = [['el', 'DET +Masc +Sg'], ['la', 'DET +Fem +Sg'], ['los', 'DET +Masc +Pl'], ['las', 'DET +Fem +Pl'], ['un', 'DET +Masc +Sg'], ['una', 'DET +Fem +Sg'], ['de', 'ADP'], ['en', 'ADP'], ['con', 'ADP'], ['sobre', 'ADP'], ['y', 'CCONJ'], ['que', 'SCONJ'], ['no', 'ADV'], ['muy', 'ADV'], ['se', 'PRON'], ['lo', 'PRON'], ['me', 'PRON']];
  /* Homógrafos de clase cerrada o de formas fuera del lexicón mínimo: provocan ambigüedad adicional */
  M.EXTRA = [['sobre', 'sobre +N +Masc +Sg'], ['como', 'como +ADV']];

  /* ---------- Generación ---------- */
  const PERSONAS = [['1P', 'Sg'], ['2P', 'Sg'], ['3P', 'Sg'], ['1P', 'Pl'], ['2P', 'Pl'], ['3P', 'Pl']];
  M.TERMINACIONES = {
    ar: { Pres: ['o', 'as', 'a', 'amos', 'áis', 'an'], Impf: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'], Perf: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'], Fut: ['é', 'ás', 'á', 'emos', 'éis', 'án'], Cond: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'], 'Subj Pres': ['e', 'es', 'e', 'emos', 'éis', 'en'], 'Subj Impf': ['ara', 'aras', 'ara', 'áramos', 'arais', 'aran'] },
    er: { Pres: ['o', 'es', 'e', 'emos', 'éis', 'en'], Impf: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'], Perf: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'], Fut: ['é', 'ás', 'á', 'emos', 'éis', 'án'], Cond: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'], 'Subj Pres': ['a', 'as', 'a', 'amos', 'áis', 'an'], 'Subj Impf': ['iera', 'ieras', 'iera', 'iéramos', 'ierais', 'ieran'] },
    ir: { Pres: ['o', 'es', 'e', 'imos', 'ís', 'en'], Impf: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'], Perf: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'], Fut: ['é', 'ás', 'á', 'emos', 'éis', 'án'], Cond: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'], 'Subj Pres': ['a', 'as', 'a', 'amos', 'áis', 'an'], 'Subj Impf': ['iera', 'ieras', 'iera', 'iéramos', 'ierais', 'ieran'] }
  };
  /* Devuelve [{sup, lex, inter}] para una entrada. lex = «lema +CAT +rasgos» */
  M.generar = function (e) {
    const out = [];
    const add = (inter, rasgos) => out.push({ sup: M.aplicarReglas(inter), lex: e.l + ' ' + rasgos, inter });
    if (e.c === 'V') {
      if (e.k === 'irr') { e.f.forEach(([f, r]) => out.push({ sup: f, lex: e.l + ' +V ' + r.split(' ').map((x) => '+' + x).join(' '), inter: f })); return out; }
      const T = M.TERMINACIONES[e.k];
      for (const t of Object.keys(T)) {
        const base = t === 'Fut' || t === 'Cond' ? e.l : e.r;
        T[t].forEach((suf, i) => add(base + '^' + suf + '#', '+V ' + t.split(' ').map((x) => '+' + x).join(' ') + ' +' + PERSONAS[i][0] + ' +' + PERSONAS[i][1]));
      }
      add(e.l + '#', '+V +Inf');
      add(e.r + '^' + (e.k === 'ar' ? 'ando' : 'iendo') + '#', '+V +Ger');
      add(e.r + '^' + (e.k === 'ar' ? 'ado' : 'ido') + '#', '+V +Part');
      return out;
    }
    if (e.k === 'irr') { e.f.forEach(([f, n]) => out.push({ sup: f, lex: e.l + ' +N +' + (e.g === 'm' ? 'Masc' : e.g === 'f' ? 'Fem' : 'MascFem') + ' +' + n, inter: f })); return out; }
    const cat = e.c === 'N' ? '+N' : '+ADJ';
    if (e.k === 'o') {
      const gs = e.c === 'ADJ' || e.alt ? ['m', 'f'] : [e.g];
      for (const g of gs) for (const n of ['Sg', 'Pl']) add(e.r + '^' + (g === 'm' ? 'o' : 'a') + (n === 'Pl' ? 's' : '') + '#', cat + ' +' + (g === 'm' ? 'Masc' : 'Fem') + ' +' + n);
    } else {
      const gtag = e.c === 'ADJ' ? '+MascFem' : '+' + (e.g === 'm' ? 'Masc' : e.g === 'f' ? 'Fem' : 'MascFem');
      add(e.r + '#', cat + ' ' + gtag + ' +Sg');
      add(e.r + '^s#', cat + ' ' + gtag + ' +Pl');
    }
    return out;
  };
  /* Conjugador: devuelve filas [tiempo, [formas]] de un verbo regular o irregular de la tabla */
  M.conjugar = function (inf) {
    const e = M.LEX.find((x) => x.c === 'V' && x.l === inf);
    if (!e || e.k === 'irr') return null;
    const T = M.TERMINACIONES[e.k], filas = [];
    for (const t of Object.keys(T)) {
      const base = t === 'Fut' || t === 'Cond' ? e.l : e.r;
      filas.push([t, T[t].map((suf) => M.aplicarReglas(base + '^' + suf + '#'))]);
    }
    return filas;
  };
  M.formasDistintas = (e) => new Set(M.generar(e).map((x) => x.sup)).size;

  /* ---------- Índice y análisis ---------- */
  let IDX = null;
  M.indice = function () {
    if (IDX) return IDX;
    IDX = new Map();
    const put = (sup, lex) => { const k = sup.toLowerCase(); if (!IDX.has(k)) IDX.set(k, []); if (!IDX.get(k).includes(lex)) IDX.get(k).push(lex); };
    for (const e of M.LEX) for (const f of M.generar(e)) put(f.sup, f.lex);
    for (const [w, r] of M.CERRADAS) put(w, w + ' +' + r);
    for (const [w, lex] of M.EXTRA) put(w, lex);
    return IDX;
  };
  M.analizar = (w) => (M.indice().get(w.toLowerCase()) || []).slice();
  M.vocabulario = () => M.indice().size;
  M.nFormas = () => Array.from(M.indice().values()).reduce((a, b) => a + b.length, 0);
})(typeof window !== 'undefined' ? window : globalThis);
