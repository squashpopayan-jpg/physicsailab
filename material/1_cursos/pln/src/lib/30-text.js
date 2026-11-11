/* ===================================================================
   lib/30-text.js — Preparación de texto: Unicode, limpieza, tokenización
   por letras, palabras vacías, frecuencias y ley de Zipf.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const T = (L.text = {});

  /* Lista didáctica de palabras vacías del laboratorio del curso (incluye «no», «sin»: ver el capítulo) */
  T.STOP = new Set(('a al algo algunas algunos ante antes como con contra cual cuando de del desde ' +
    'donde durante e el ella ellas ellos en entre era eran es esa esas ese esos ' +
    'esta estas este esto estos fue fueron ha hay hasta la las le les lo los ' +
    'mas me mi mis muy no nos o para pero por porque que quien quienes se ser ' +
    'si sin sobre su sus te tiene todo todos tu tus un una unas uno unos y ya yo').split(' '));
  /* Palabras de negación que conviene conservar en análisis de opiniones */
  T.NEG = new Set(['no', 'nunca', 'jamás', 'ni', 'sin', 'nada', 'nadie', 'tampoco', 'ningún', 'ninguna', 'ninguno']);

  T.sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  T.nfc = (s) => s.normalize('NFC');
  T.nfd = (s) => s.normalize('NFD');
  T.puntos = (s) => Array.from(s).map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));

  /* Limpieza del laboratorio 1 (HTML, URL, minúsculas, puntuación opcional, espacios) */
  const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
  T.limpiar = function (texto, quitarPuntuacion = false) {
    let t = String(texto).replace(/&(amp|lt|gt|quot|nbsp|#39);/g, (m) => ENT[m]);
    t = t.replace(/<[^>]+>/g, ' ');
    t = t.replace(/https?:\/\/\S+|www\.\S+/g, ' URL ');
    t = t.toLowerCase();
    if (quitarPuntuacion) t = t.replace(/[^\p{L}\p{N}_\sáéíóúüñ]/gu, ' ');
    return t.replace(/\s+/g, ' ').trim();
  };
  /* Secuencias de letras Unicode (equivale a /[\p{L}]+/gu) */
  T.tokensLetras = (t) => t.match(/\p{L}+/gu) || [];

  /* Experimentos A/B del laboratorio: devuelve las métricas y el ranking */
  T.analizar = function (texto, o = {}) {
    const minLen = o.minLen === undefined ? 3 : o.minLen;
    const excluirVacias = o.excluirVacias === undefined ? true : o.excluirVacias;
    let t = texto;
    if (o.minusculas !== false) t = t.toLowerCase();
    if (o.unificarTildes !== false) t = T.sinTildes(t);
    const todos = T.tokensLetras(t);
    const filtrados = todos.filter((p) => p.length >= minLen && (!excluirVacias || !T.STOP.has(p.toLowerCase())));
    const f = new Map();
    for (const p of filtrados) f.set(p, (f.get(p) || 0) + 1);
    const ranking = Array.from(f.entries()).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return { identificadas: todos.length, tras: filtrados.length, distintos: f.size, excluidas: todos.length - filtrados.length, top10: ranking.slice(0, 10), ranking };
  };

  /* Ley de Zipf: ajuste por mínimos cuadrados de log10(frecuencia) = a + b·log10(rango). */
  T.zipf = function (tokens) {
    const f = new Map();
    for (const p of tokens) f.set(p, (f.get(p) || 0) + 1);
    const fr = Array.from(f.values()).sort((a, b) => b - a);
    const x = fr.map((_, i) => Math.log10(i + 1)), y = fr.map((v) => Math.log10(v));
    const n = x.length;
    let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; sxx += x[i] * x[i]; sxy += x[i] * y[i]; syy += y[i] * y[i]; }
    const b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
    const r = (n * sxy - sx * sy) / Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
    return { freqs: fr, tipos: n, total: tokens.length, a, b, r2: r * r };
  };
})(typeof window !== 'undefined' ? window : globalThis);
