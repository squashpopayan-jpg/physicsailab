/* ===================================================================
   lib/55-stem.js — Stemmer Snowball del español (Porter, Boetticher y
   Rojas), portado a JavaScript desde la descripción oficial
   (snowballstem.org/algorithms/spanish/stemmer.html) y validado contra
   la implementación de NLTK. Con traza paso a paso.
   Además: tokenizadores y segmentador de oraciones.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const S = (L.stem = {});

  const VOW = 'aeiouáéíóúü';
  const esV = (c) => VOW.includes(c);
  const quitar = (s, n) => s.slice(0, Math.max(0, s.length - n));
  const sinTilde = (w) => w.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');

  const STEP0 = ['selas', 'selos', 'sela', 'selo', 'las', 'les', 'los', 'nos', 'me', 'se', 'la', 'le', 'lo'];
  const STEP1 = ['amientos', 'imientos', 'amiento', 'imiento', 'acion', 'aciones', 'uciones', 'ucion', 'adoras', 'adores', 'ancias', 'logías', 'encias', 'amente', 'idades', 'anzas', 'ismos', 'ables', 'ibles', 'istas', 'adora', 'ación', 'antes', 'ancia', 'logía', 'ución', 'encia', 'mente', 'anza', 'icos', 'icas', 'ismo', 'able', 'ible', 'ista', 'osos', 'osas', 'ador', 'ante', 'idad', 'ivas', 'ivos', 'ico', 'ica', 'oso', 'osa', 'iva', 'ivo'];
  const STEP2A = ['yeron', 'yendo', 'yamos', 'yais', 'yan', 'yen', 'yas', 'yes', 'ya', 'ye', 'yo', 'yó'];
  const STEP2B = ['aríamos', 'eríamos', 'iríamos', 'iéramos', 'iésemos', 'aríais', 'aremos', 'eríais', 'eremos', 'iríais', 'iremos', 'ierais', 'ieseis', 'asteis', 'isteis', 'ábamos', 'áramos', 'ásemos', 'arían', 'arías', 'aréis', 'erían', 'erías', 'eréis', 'irían', 'irías', 'iréis', 'ieran', 'iesen', 'ieron', 'iendo', 'ieras', 'ieses', 'abais', 'arais', 'aseis', 'éamos', 'arán', 'arás', 'aría', 'erán', 'erás', 'ería', 'irán', 'irás', 'iría', 'iera', 'iese', 'aste', 'iste', 'aban', 'aran', 'asen', 'aron', 'ando', 'abas', 'adas', 'idas', 'aras', 'ases', 'íais', 'ados', 'idos', 'amos', 'imos', 'emos', 'ará', 'aré', 'erá', 'eré', 'irá', 'iré', 'aba', 'ada', 'ida', 'ara', 'ase', 'ían', 'ado', 'ido', 'ías', 'áis', 'éis', 'ía', 'ad', 'ed', 'id', 'an', 'ió', 'ar', 'er', 'ir', 'as', 'ís', 'en', 'es'];
  const STEP3 = ['os', 'a', 'e', 'o', 'á', 'é', 'í', 'ó'];

  S.regiones = function (word) {
    let r1 = '', r2 = '';
    for (let i = 1; i < word.length; i++) if (!esV(word[i]) && esV(word[i - 1])) { r1 = word.slice(i + 1); break; }
    for (let i = 1; i < r1.length; i++) if (!esV(r1[i]) && esV(r1[i - 1])) { r2 = r1.slice(i + 1); break; }
    let rv = '';
    if (word.length >= 2) {
      if (!esV(word[1])) { for (let i = 2; i < word.length; i++) if (esV(word[i])) { rv = word.slice(i + 1); break; } }
      else if (esV(word[0]) && esV(word[1])) { for (let i = 2; i < word.length; i++) if (!esV(word[i])) { rv = word.slice(i + 1); break; } }
      else rv = word.slice(3);
    }
    return { r1, r2, rv };
  };

  /* stem(palabra, traza?) → raíz; con traza = [] se llena con {paso, quita, resultado} */
  S.es = function (palabra, traza) {
    let word = palabra.toLowerCase();
    let step1ok = false;
    let { r1, r2, rv } = S.regiones(word);
    const reg = (paso, quita) => { if (traza) traza.push({ paso, quita, resultado: word }); };
    if (traza) traza.push({ paso: 'regiones', quita: '', resultado: word, r1, r2, rv });

    /* Paso 0: pronombres enclíticos */
    for (const suf of STEP0) {
      if (!(word.endsWith(suf) && rv.endsWith(suf))) continue;
      const pre = quitar(rv, suf.length);
      if (['ando', 'ándo', 'ar', 'ár', 'er', 'ér', 'iendo', 'iéndo', 'ir', 'ír'].some((x) => pre.endsWith(x)) || (pre.endsWith('yendo') && quitar(word, suf.length).endsWith('uyendo'))) {
        word = sinTilde(quitar(word, suf.length)); r1 = sinTilde(quitar(r1, suf.length)); r2 = sinTilde(quitar(r2, suf.length)); rv = sinTilde(quitar(rv, suf.length));
        reg('0 · pronombre enclítico', suf);
      }
      break;
    }

    /* Paso 1: sufijos estándar */
    for (const suf of STEP1) {
      if (!word.endsWith(suf)) continue;
      if (suf === 'amente' && r1.endsWith(suf)) {
        step1ok = true;
        word = quitar(word, 6); r2 = quitar(r2, 6); rv = quitar(rv, 6);
        if (r2.endsWith('iv')) { word = quitar(word, 2); r2 = quitar(r2, 2); rv = quitar(rv, 2); if (r2.endsWith('at')) { word = quitar(word, 2); rv = quitar(rv, 2); } }
        else if (['os', 'ic', 'ad'].some((x) => r2.endsWith(x))) { word = quitar(word, 2); rv = quitar(rv, 2); }
        reg('1 · sufijo estándar', suf);
      } else if (r2.endsWith(suf)) {
        step1ok = true;
        if (['adora', 'ador', 'ación', 'adoras', 'adores', 'acion', 'aciones', 'ante', 'antes', 'ancia', 'ancias'].includes(suf)) {
          word = quitar(word, suf.length); r2 = quitar(r2, suf.length); rv = quitar(rv, suf.length);
          if (r2.endsWith('ic')) { word = quitar(word, 2); rv = quitar(rv, 2); }
        } else if (suf === 'logía' || suf === 'logías') { word = quitar(word, suf.length) + 'log'; rv = quitar(rv, suf.length) + 'log'; }
        else if (suf === 'ución' || suf === 'uciones' || suf === 'ucion') { word = quitar(word, suf.length) + 'u'; rv = quitar(rv, suf.length) + 'u'; }
        else if (suf === 'encia' || suf === 'encias') { word = quitar(word, suf.length) + 'ente'; rv = quitar(rv, suf.length) + 'ente'; }
        else if (suf === 'mente') {
          word = quitar(word, suf.length); r2 = quitar(r2, suf.length); rv = quitar(rv, suf.length);
          if (['ante', 'able', 'ible'].some((x) => r2.endsWith(x))) { word = quitar(word, 4); rv = quitar(rv, 4); }
        } else if (suf === 'idad' || suf === 'idades') {
          word = quitar(word, suf.length); r2 = quitar(r2, suf.length); rv = quitar(rv, suf.length);
          for (const p of ['abil', 'ic', 'iv']) if (r2.endsWith(p)) { word = quitar(word, p.length); rv = quitar(rv, p.length); }
        } else if (['ivo', 'iva', 'ivos', 'ivas'].includes(suf)) {
          word = quitar(word, suf.length); r2 = quitar(r2, suf.length); rv = quitar(rv, suf.length);
          if (r2.endsWith('at')) { word = quitar(word, 2); rv = quitar(rv, 2); }
        } else { word = quitar(word, suf.length); rv = quitar(rv, suf.length); }
        reg('1 · sufijo estándar', suf);
      }
      break;
    }

    if (!step1ok) {
      /* Paso 2a: sufijos verbales que empiezan por y */
      for (const suf of STEP2A) {
        if (rv.endsWith(suf) && word.slice(Math.max(0, word.length - suf.length - 1), word.length - suf.length) === 'u') { word = quitar(word, suf.length); rv = quitar(rv, suf.length); reg('2a · verbal con y', suf); break; }
      }
      /* Paso 2b: otros sufijos verbales */
      for (const suf of STEP2B) {
        if (rv.endsWith(suf)) {
          word = quitar(word, suf.length); rv = quitar(rv, suf.length);
          if (['en', 'es', 'éis', 'emos'].includes(suf)) { if (word.endsWith('gu')) word = quitar(word, 1); if (rv.endsWith('gu')) rv = quitar(rv, 1); }
          reg('2b · sufijo verbal', suf);
          break;
        }
      }
    }

    /* Paso 3: sufijo residual */
    for (const suf of STEP3) {
      if (rv.endsWith(suf)) {
        word = quitar(word, suf.length);
        if (suf === 'e' || suf === 'é') { rv = quitar(rv, suf.length); if (word.slice(-2) === 'gu' && rv.endsWith('u')) word = quitar(word, 1); }
        reg('3 · sufijo residual', suf);
        break;
      }
    }
    word = sinTilde(word);
    if (traza) traza.push({ paso: 'sin tildes', quita: '', resultado: word });
    return word;
  };

  /* ---------- Tokenizadores ---------- */
  const T = (S.tok = {});
  T.espacios = (t) => t.split(/\s+/).filter(Boolean);
  T.w = (t) => t.match(/\w+/g) || [];
  T.letras = (t) => t.match(/\p{L}+/gu) || [];
  /* Tokenizador de palabras y signos: URL y correos, números con separadores, hashtags, palabras con guion o apóstrofo, signos sueltos */
  T.RE = /https?:\/\/\S+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|#\p{L}[\p{L}\p{N}_]*|\d+(?:[.,]\d+)*|\p{L}+(?:[-']\p{L}+)*|[^\s\p{L}\p{N}]/gu;
  T.completo = function (t, contracciones) {
    const out = [];
    for (const x of t.match(T.RE) || []) {
      if (contracciones && /^del$/i.test(x)) out.push(x[0] + 'e', 'el');
      else if (contracciones && /^al$/i.test(x)) out.push(x[0], 'el');
      else out.push(x);
    }
    return out;
  };
  const ABREV = new Set(['sr', 'sra', 'srta', 'dr', 'dra', 'prof', 'ud', 'uds', 'etc', 'pág', 'págs', 'p', 'ej', 'vs', 'núm', 'av', 'cía', 'ee', 'uu']);
  /* Oraciones: corta tras . ! ? (y cierre) cuando sigue espacio y mayúscula o ¿ ¡, salvo abreviaturas conocidas */
  T.oraciones = function (t) {
    const res = []; let ini = 0;
    const re = /[.!?…]+["»”)]*\s+(?=[A-ZÁÉÍÓÚÑ¿¡"«])/g;
    let m;
    while ((m = re.exec(t)) !== null) {
      const antes = t.slice(ini, m.index);
      const ult = (antes.match(/([\p{L}]+)$/u) || [, ''])[1].toLowerCase();
      if (m[0][0] === '.' && ABREV.has(ult)) continue;
      res.push(t.slice(ini, m.index + m[0].trimEnd().length).trim());
      ini = m.index + m[0].length;
    }
    if (t.slice(ini).trim()) res.push(t.slice(ini).trim());
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
