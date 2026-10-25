/* Calificación y estadísticas de las pruebas diagnósticas (sin dependencias; corre en el navegador y en Node).
   banco = { publico: {temas, preguntas:[{id, tema, ops}]}, clave: {id: {r, err:[...], exp, dif}}, errores: {id: texto} } */
(function (root) {
  'use strict';
  var A = {};

  A.NIVELES = [
    { min: 80, id: 'fortaleza', nombre: 'Fortaleza' },
    { min: 60, id: 'aceptable', nombre: 'Aceptable' },
    { min: 40, id: 'desarrollo', nombre: 'En desarrollo' },
    { min: 0, id: 'critico', nombre: 'Crítico' }
  ];
  A.nivel = function (pct) {
    for (var i = 0; i < A.NIVELES.length; i++) if (pct >= A.NIVELES[i].min) return A.NIVELES[i];
    return A.NIVELES[A.NIVELES.length - 1];
  };
  function pct(a, n) { return n ? Math.round(1000 * a / n) / 10 : 0; }

  /* Califica a un estudiante. resp = {idPregunta: índiceOpción}. */
  A.calificar = function (banco, resp) {
    resp = resp || {};
    var P = banco.publico.preguntas, temas = banco.publico.temas, out = {
      aciertos: 0, respondidas: 0, total: P.length, porTema: {}, errores: {}, detalle: []
    };
    Object.keys(temas).forEach(function (t) { out.porTema[t] = { ok: 0, n: 0, pct: 0 }; });
    P.forEach(function (q) {
      var k = banco.clave[q.id], r = resp[q.id], has = typeof r === 'number' && r >= 0 && r < q.ops.length;
      var ok = has && r === k.r, err = has && !ok ? (k.err[r] || 'otro') : null;
      out.porTema[q.tema].n++;
      if (has) out.respondidas++;
      if (ok) { out.aciertos++; out.porTema[q.tema].ok++; }
      if (err) out.errores[err] = (out.errores[err] || 0) + 1;
      out.detalle.push({ id: q.id, tema: q.tema, resp: has ? r : null, correcta: k.r, ok: ok, err: err });
    });
    Object.keys(out.porTema).forEach(function (t) { var x = out.porTema[t]; x.pct = pct(x.ok, x.n); x.nivel = A.nivel(x.pct).id; });
    out.puntaje = pct(out.aciertos, out.total);
    out.nivel = A.nivel(out.puntaje).id;
    out.prioridades = A.prioridades(banco, out.porTema);
    out.fortalezas = Object.keys(out.porTema).filter(function (t) { return out.porTema[t].pct >= 80; });
    out.debilidades = Object.keys(out.porTema).filter(function (t) { return out.porTema[t].pct < 60; });
    return out;
  };

  /* Prioridad de refuerzo de cada tema = (1 − dominio) × peso del tema (peso = cuánto lo necesitan los cursos siguientes). */
  A.prioridades = function (banco, porTema) {
    var temas = banco.publico.temas;
    return Object.keys(porTema).map(function (t) {
      var p = (1 - porTema[t].pct / 100) * (temas[t].peso || 1);
      return { tema: t, valor: Math.round(p * 100) / 100, pct: porTema[t].pct,
        clase: porTema[t].pct >= 80 ? 'baja' : (p >= 0.6 ? 'alta' : (p >= 0.3 ? 'media' : 'baja')) };
    }).sort(function (a, b) { return b.valor - a.valor || a.pct - b.pct; });
  };

  /* Recomendaciones personalizadas: temas débiles con los errores concretos que el estudiante mostró. */
  A.recomendaciones = function (banco, cal) {
    var temas = banco.publico.temas, errTema = {};
    cal.detalle.forEach(function (d) {
      if (!d.err || d.err === 'otro') return;
      (errTema[d.tema] = errTema[d.tema] || {})[d.err] = 1;
    });
    return cal.prioridades.filter(function (p) { return p.pct < 80; }).map(function (p) {
      return {
        tema: p.tema, nombre: temas[p.tema].nombre, pct: p.pct, prioridad: p.clase,
        texto: temas[p.tema].rec, subtemas: temas[p.tema].sub || [],
        errores: Object.keys(errTema[p.tema] || {}).map(function (e) { return banco.errores[e] || e; })
      };
    });
  };

  /* ---------- Estadística de grupo ---------- */
  function media(xs) { return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : 0; }
  function desv(xs) { var m = media(xs); return xs.length > 1 ? Math.sqrt(xs.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (xs.length - 1)) : 0; }
  function mediana(xs) { var s = xs.slice().sort(function (a, b) { return a - b; }), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; }
  A._ = { media: media, desv: desv, mediana: mediana };

  /* est = [{code, nombre, doc, cal, tiempoMs}] (solo los que presentaron). Devuelve el consolidado. */
  A.grupo = function (banco, est) {
    var P = banco.publico.preguntas, temas = banco.publico.temas, n = est.length;
    var notas = est.map(function (e) { return e.cal.puntaje; });
    var g = {
      n: n, media: r1(media(notas)), mediana: r1(mediana(notas)), desv: r1(desv(notas)),
      min: n ? Math.min.apply(null, notas) : 0, max: n ? Math.max.apply(null, notas) : 0,
      histograma: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], niveles: {}, porTema: {}, items: [], errores: [], ranking: []
    };
    notas.forEach(function (x) { g.histograma[Math.min(9, Math.floor(x / 10))]++; });
    A.NIVELES.forEach(function (l) { g.niveles[l.id] = 0; });
    est.forEach(function (e) { g.niveles[e.cal.nivel]++; });
    Object.keys(temas).forEach(function (t) {
      var xs = est.map(function (e) { return e.cal.porTema[t].pct; });
      g.porTema[t] = { media: r1(media(xs)), bajo60: xs.filter(function (x) { return x < 60; }).length };
    });
    g.prioridades = A.prioridades(banco, Object.keys(g.porTema).reduce(function (o, t) { o[t] = { pct: g.porTema[t].media }; return o; }, {}));

    /* Ranking: más aciertos primero; a igualdad, menos tiempo. Empates exactos comparten puesto. */
    var orden = est.slice().sort(function (a, b) { return b.cal.aciertos - a.cal.aciertos || (a.tiempoMs || 9e15) - (b.tiempoMs || 9e15) || String(a.nombre).localeCompare(String(b.nombre)); });
    orden.forEach(function (e, i) {
      var prev = g.ranking[i - 1], mismo = prev && prev.aciertos === e.cal.aciertos && prev.tiempoMs === (e.tiempoMs || null);
      var debajo = est.filter(function (o) { return o.cal.aciertos < e.cal.aciertos; }).length;
      g.ranking.push({ puesto: mismo ? prev.puesto : i + 1, code: e.code, nombre: e.nombre, doc: e.doc, aciertos: e.cal.aciertos,
        puntaje: e.cal.puntaje, nivel: e.cal.nivel, tiempoMs: e.tiempoMs || null,
        percentil: n > 1 ? Math.round(100 * debajo / (n - 1)) : 100 });
    });

    /* Análisis de ítems: dificultad p, discriminación (27 % superior − 27 % inferior), frecuencia de cada opción. */
    var k = Math.max(1, Math.round(n * 0.27)), sup = orden.slice(0, k), inf = orden.slice(n - k);
    P.forEach(function (q) {
      var cl = banco.clave[q.id], frec = q.ops.map(function () { return 0; }), blanco = 0, ok = 0;
      est.forEach(function (e) { var d = e.cal.detalle.find(function (x) { return x.id === q.id; }); if (d.resp === null) blanco++; else frec[d.resp]++; if (d.ok) ok++; });
      function prop(gr) { return gr.length ? gr.filter(function (e) { return e.cal.detalle.find(function (x) { return x.id === q.id; }).ok; }).length / gr.length : 0; }
      var dis = n >= 4 ? Math.round((prop(sup) - prop(inf)) * 100) / 100 : null;
      var peor = -1, peorN = 0;
      frec.forEach(function (f, i) { if (i !== cl.r && f > peorN) { peor = i; peorN = f; } });
      g.items.push({ id: q.id, tema: q.tema, p: n ? Math.round(100 * ok / n) / 100 : 0, disc: dis, frec: frec, blanco: blanco, correcta: cl.r,
        distractor: peor >= 0 ? { op: peor, n: peorN, err: cl.err[peor] || 'otro' } : null });
    });

    /* Errores conceptuales más frecuentes: % de estudiantes que mostraron cada uno al menos una vez. */
    /* Se ordenan por tasa = veces elegido / (estudiantes × preguntas donde ese error es una opción),
       para no favorecer a los errores que aparecen en más preguntas. */
    var cuenta = {}, veces = {}, oport = {};
    P.forEach(function (q) { var vistos = {}; banco.clave[q.id].err.forEach(function (er) { if (er && er !== 'otro' && !vistos[er]) { vistos[er] = 1; oport[er] = (oport[er] || 0) + 1; } }); });
    est.forEach(function (e) { Object.keys(e.cal.errores).forEach(function (er) { if (er !== 'otro') { cuenta[er] = (cuenta[er] || 0) + 1; veces[er] = (veces[er] || 0) + e.cal.errores[er]; } }); });
    g.errores = Object.keys(cuenta).map(function (er) {
      return { id: er, texto: banco.errores[er] || er, n: cuenta[er], pct: pct(cuenta[er], n), tasa: Math.round(1000 * veces[er] / (n * (oport[er] || 1))) / 1000 };
    }).sort(function (a, b) { return b.tasa - a.tasa || b.n - a.n; });

    g.kr20 = A.kr20(banco, est);
    return g;
  };

  /* Confiabilidad KR-20 de la prueba con este grupo. */
  A.kr20 = function (banco, est) {
    var n = est.length, K = banco.publico.preguntas.length;
    if (n < 5) return null;
    var tot = est.map(function (e) { return e.cal.aciertos; }), m = media(tot);
    var v = tot.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / n;
    if (!v) return null;
    var spq = 0;
    banco.publico.preguntas.forEach(function (q, i) {
      var p = est.filter(function (e) { return e.cal.detalle[i].ok; }).length / n; spq += p * (1 - p);
    });
    return Math.round(1000 * (K / (K - 1)) * (1 - spq / v)) / 1000;
  };
  function r1(x) { return Math.round(x * 10) / 10; }

  /* ---------- Utilidades compartidas ---------- */
  /* Generador pseudoaleatorio con semilla (mulberry32) para barajar de forma reproducible. */
  A.rng = function (seedStr) {
    var h = 1779033703 ^ seedStr.length;
    for (var i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    var a = h >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };
  A.barajar = function (arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  /* Valor numérico de una opción ("20 000 Pa" → 20000; "5√3 N ≈ 8,7 N" → 8.7) para ordenarlas. */
  A.valorOpcion = function (s) {
    s = String(s).replace(/−/g, '-');
    var part = s.indexOf('≈') >= 0 ? s.slice(s.indexOf('≈') + 1) : s;
    var m = part.match(/-?\d{1,3}(?: \d{3})+(?:,\d+)?|-?\d+(?:,\d+)?/);
    return m ? parseFloat(m[0].replace(/ /g, '').replace(',', '.')) : NaN;
  };

  /* Exporta a CSV con separador ";" (Excel en español lo abre directamente). */
  A.csv = function (filas) {
    return '﻿' + filas.map(function (f) {
      return f.map(function (c) { c = c === null || c === undefined ? '' : String(c); return /[;"\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';');
    }).join('\r\n');
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = A; else root.ANALISIS = A;
})(this);
