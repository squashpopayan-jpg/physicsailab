/* Construye y dibuja el boletín individual y el informe institucional.
   Los objetos que produce son autocontenidos: se publican tal cual en la base de datos y se dibujan sin el banco. */
(function (root) {
  'use strict';
  var A = root.ANALISIS || (typeof require !== 'undefined' ? require('./analisis') : null);
  var I = {};
  var NIV = {}; A.NIVELES.forEach(function (n) { NIV[n.id] = n.nombre; });
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plano(html) {   // texto sin etiquetas; las matrices quedan como [1 2; 3 4]
    return String(html || '').replace(/<table[^>]*>/g, ' [').replace(/<\/table>/g, '] ').replace(/<\/tr>\s*<tr>/g, '; ').replace(/<\/td>\s*<td>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }
  function dec(x) { return x === null || x === undefined ? '—' : String(x).replace('.', ','); }
  function minutos(ms) { return ms ? Math.round(ms / 60000) : null; }
  function enmascarar(doc) { doc = String(doc || ''); return doc.length > 4 ? '•••' + doc.slice(-4) : doc; }

  /* filas: [{code, nombre, doc, correo, resp, inicio, entregado, salidas}] de todos los inscritos. fin = hora de cierre. */
  I.calcular = function (banco, filas, fin) {
    var pres = [], aus = [];
    filas.forEach(function (f) {
      var presento = !!(f.inicio || (f.resp && Object.keys(f.resp).length));
      if (!presento) { aus.push(f); return; }
      var t = f.inicio ? ((f.entregado || fin || Date.now()) - f.inicio) : null;
      pres.push({ code: f.code, nombre: f.nombre, doc: f.doc, correo: f.correo, salidas: f.salidas || 0, tiempoMs: t && t > 0 ? t : null, entregado: !!f.entregado, cal: A.calificar(banco, f.resp) });
    });
    return { presentaron: pres, ausentes: aus, grupo: A.grupo(banco, pres) };
  };

  I.errorTema = function (banco) {
    var m = {};
    banco.publico.preguntas.forEach(function (q) { banco.clave[q.id].err.forEach(function (e) { if (e && e !== 'otro' && !m[e]) m[e] = q.tema; }); });
    return m;
  };

  I.construirInforme = function (banco, info, calc, opc) {
    opc = opc || {};
    var temas = banco.publico.temas, g = calc.grupo, eT = I.errorTema(banco);
    var porCode = {}; calc.presentaron.forEach(function (e) { porCode[e.code] = e; });
    var recG = g.prioridades.filter(function (p) { return p.pct < 70; }).map(function (p) {
      return { tema: p.tema, nombre: temas[p.tema].nombre, media: p.pct, prioridad: p.clase, bajo60: g.porTema[p.tema].bajo60,
        texto: temas[p.tema].rec, subtemas: temas[p.tema].sub,
        errores: g.errores.filter(function (e) { return eT[e.id] === p.tema; }).slice(0, 4).map(function (e) { return { texto: e.texto, pct: e.pct }; }) };
    });
    return {
      tipo: 'informe', generado: Date.now(),
      prueba: { titulo: banco.meta.titulo, version: banco.meta.version, n: banco.publico.preguntas.length },
      sesion: { nombre: info.nombre || '', institucion: info.institucion || '', grupo: info.grupo || '', fecha: info.abiertaEn || info.creada || null, duracionMin: info.duracionMin || null, responsable: info.contacto || '' },
      temas: Object.keys(temas).reduce(function (o, t) { o[t] = { nombre: temas[t].nombre, corto: temas[t].corto || '', sub: temas[t].sub || [] }; return o; }, {}),
      inscritos: calc.presentaron.length + calc.ausentes.length,
      presentaron: calc.presentaron.length,
      ausentes: calc.ausentes.map(function (a) { return a.nombre; }),
      stats: { media: g.media, mediana: g.mediana, desv: g.desv, min: g.min, max: g.max, kr20: g.kr20, histograma: g.histograma, niveles: g.niveles },
      porTema: g.porTema, prioridades: g.prioridades, recomendaciones: recG,
      errores: g.errores.slice(0, 12).map(function (e) { return { texto: e.texto, n: e.n, pct: e.pct, tema: eT[e.id] || null }; }),
      ranking: g.ranking.map(function (r) {
        var e = porCode[r.code];
        return { puesto: r.puesto, nombre: r.nombre, doc: r.doc, aciertos: r.aciertos, puntaje: r.puntaje, nivel: r.nivel, percentil: r.percentil,
          min: minutos(r.tiempoMs), salidas: e.salidas, entregado: e.entregado,
          porTema: Object.keys(e.cal.porTema).reduce(function (o, t) { o[t] = e.cal.porTema[t].pct; return o; }, {}),
          debilidades: e.cal.debilidades };
      }),
      items: g.items.map(function (it, k) {
        var q = banco.publico.preguntas[k];
        return { id: it.id, tema: it.tema, txt: opc.sinTextos ? '' : plano(q.txt), ops: opc.sinTextos ? [] : q.ops, p: it.p, disc: it.disc, frec: it.frec, blanco: it.blanco,
          correcta: it.correcta, distractor: it.distractor ? { op: it.distractor.op, n: it.distractor.n, texto: banco.errores[it.distractor.err] || '' } : null };
      })
    };
  };

  I.construirBoletin = function (banco, info, e, calc, opc) {
    opc = opc || {};
    var temas = banco.publico.temas, g = calc.grupo, rk = g.ranking.find(function (r) { return r.code === e.code; });
    var b = {
      tipo: 'boletin', generado: Date.now(),
      nombre: e.nombre, doc: enmascarar(e.doc),
      prueba: { titulo: banco.meta.titulo, n: e.cal.total },
      sesion: { institucion: info.institucion || '', grupo: info.grupo || '', nombre: info.nombre || '', fecha: info.abiertaEn || null },
      puntaje: e.cal.puntaje, aciertos: e.cal.aciertos, respondidas: e.cal.respondidas, nivel: e.cal.nivel, min: minutos(e.tiempoMs),
      temas: Object.keys(temas).reduce(function (o, t) { o[t] = { nombre: temas[t].nombre }; return o; }, {}),
      porTema: e.cal.porTema, mediaGrupo: Object.keys(g.porTema).reduce(function (o, t) { o[t] = g.porTema[t].media; return o; }, {}),
      fortalezas: e.cal.fortalezas, debilidades: e.cal.debilidades,
      recomendaciones: A.recomendaciones(banco, e.cal),
      grupo: { media: g.media, n: g.n }
    };
    if (opc.ranking && rk) { b.puesto = rk.puesto; b.percentil = rk.percentil; }
    if (opc.solucionario) {
      b.detalle = banco.publico.preguntas.map(function (q, k) {
        var d = e.cal.detalle[k];
        return { n: k + 1, txt: q.txt, fig: q.fig || null, ops: q.ops, resp: d.resp, correcta: d.correcta, ok: d.ok, exp: banco.clave[q.id].exp };
      });
    }
    return b;
  };

  /* ---------- Dibujo ---------- */
  /* Firebase borra listas vacías y valores nulos: al leer un informe publicado se restituyen antes de dibujar. */
  function lista(x) { return Array.isArray(x) ? x : x && typeof x === 'object' ? Object.keys(x).sort(function (a, b) { return a - b; }).map(function (k) { return x[k]; }) : []; }
  I.normalizarBoletin = function (b) {
    b.fortalezas = lista(b.fortalezas); b.debilidades = lista(b.debilidades);
    b.recomendaciones = lista(b.recomendaciones).map(function (r) { r.errores = lista(r.errores); r.subtemas = lista(r.subtemas); return r; });
    b.sesion = b.sesion || {}; b.mediaGrupo = b.mediaGrupo || {}; b.grupo = b.grupo || { media: 0, n: 0 };
    Object.keys(b.temas).forEach(function (t) { var x = b.porTema[t] = b.porTema[t] || {}; x.ok = x.ok || 0; x.n = x.n || 0; x.pct = x.pct || 0; x.nivel = x.nivel || 'critico'; if (!(t in b.mediaGrupo)) b.mediaGrupo[t] = 0; });
    if (b.detalle) b.detalle = lista(b.detalle).map(function (d) { d.ops = lista(d.ops); if (d.resp === undefined) d.resp = null; return d; });
    return b;
  };
  I.normalizarInforme = function (r) {
    ['ausentes', 'prioridades', 'recomendaciones', 'errores', 'ranking', 'items'].forEach(function (k) { r[k] = lista(r[k]); });
    r.sesion = r.sesion || {}; r.porTema = r.porTema || {};
    r.stats.histograma = lista(r.stats.histograma); r.stats.niveles = r.stats.niveles || {};
    if (r.stats.kr20 === undefined) r.stats.kr20 = null;
    Object.keys(r.temas).forEach(function (t) { r.temas[t].sub = lista(r.temas[t].sub); r.porTema[t] = r.porTema[t] || { media: 0, bajo60: 0 }; r.porTema[t].bajo60 = r.porTema[t].bajo60 || 0; });
    r.prioridades.forEach(function (p) { p.pct = p.pct || 0; });
    r.recomendaciones.forEach(function (x) { x.errores = lista(x.errores); x.subtemas = lista(x.subtemas); x.bajo60 = x.bajo60 || 0; });
    r.ranking.forEach(function (e) { e.porTema = e.porTema || {}; e.debilidades = lista(e.debilidades); e.salidas = e.salidas || 0; if (e.min === undefined) e.min = null; Object.keys(r.temas).forEach(function (t) { e.porTema[t] = e.porTema[t] || 0; }); });
    r.items.forEach(function (it) { it.frec = lista(it.frec).map(function (f) { return f || 0; }); while (it.frec.length < 4) it.frec.push(0); it.ops = lista(it.ops); it.blanco = it.blanco || 0; it.p = it.p || 0; if (it.disc === undefined) it.disc = null; it.txt = it.txt || ''; it.distractor = it.distractor || null; });
    return r;
  };
  function barra(pct, nivel) { return '<div class="bar n-' + nivel + '" title="' + pct + ' %"><i style="width:' + Math.max(2, pct) + '%"></i></div>'; }
  function nivelChip(n) { return '<span class="nivel n-' + n + '">' + esc(NIV[n] || n) + '</span>'; }
  I.nivelChip = nivelChip;
  function fecha(ts) { return ts ? new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; }

  I.htmlBoletin = function (b) {
    b = I.normalizarBoletin(b);
    var ts = Object.keys(b.temas);
    var h = '<div class="stack">';
    h += '<div class="card"><div class="row"><div><div class="small muted">Diagnóstico individual · ' + esc(b.prueba.titulo) + '</div><h1 style="margin:2px 0">' + esc(b.nombre) + '</h1>' +
      '<div class="small muted">' + esc([b.sesion.institucion, b.sesion.grupo].filter(Boolean).join(' · ')) + (b.sesion.fecha ? ' · ' + fecha(b.sesion.fecha) : '') + (b.doc ? ' · Id. ' + esc(b.doc) : '') + '</div></div></div></div>';
    h += '<div class="tiles">' +
      '<div class="tile"><div class="v">' + dec(b.puntaje) + '</div><div class="k">Puntaje (0–100)</div></div>' +
      '<div class="tile"><div class="v">' + b.aciertos + '/' + b.prueba.n + '</div><div class="k">Respuestas correctas</div></div>' +
      '<div class="tile"><div class="v" style="font-size:1.2rem;padding-top:8px">' + nivelChip(b.nivel) + '</div><div class="k">Nivel general</div></div>' +
      (b.puesto ? '<div class="tile"><div class="v">' + b.puesto + '.º</div><div class="k">Puesto en el grupo (' + b.grupo.n + ')</div></div>' : '') +
      '<div class="tile"><div class="v">' + dec(b.grupo.media) + '</div><div class="k">Promedio del grupo</div></div>' + '</div>';
    h += '<div class="card"><h2>Resultado por tema</h2><div class="tablewrap"><table><thead><tr><th>Tema</th><th class="num">Tú</th><th style="width:38%">Dominio</th><th class="num">Grupo</th><th>Nivel</th></tr></thead><tbody>';
    ts.forEach(function (t) {
      var x = b.porTema[t];
      h += '<tr><td>' + esc(b.temas[t].nombre) + '</td><td class="num">' + x.ok + '/' + x.n + '</td><td>' + barra(x.pct, x.nivel) + '</td><td class="num">' + dec(b.mediaGrupo[t]) + ' %</td><td>' + nivelChip(x.nivel) + '</td></tr>';
    });
    h += '</tbody></table></div></div>';
    h += '<div class="grid2"><div class="card"><h3>Fortalezas</h3>' + (b.fortalezas.length ? '<ul>' + b.fortalezas.map(function (t) { return '<li>' + esc(b.temas[t].nombre) + '</li>'; }).join('') + '</ul>' : '<p class="muted">Aún no hay temas con dominio de 80 % o más.</p>') + '</div>' +
      '<div class="card"><h3>Para reforzar</h3>' + (b.debilidades.length ? '<ul>' + b.debilidades.map(function (t) { return '<li>' + esc(b.temas[t].nombre) + '</li>'; }).join('') + '</ul>' : '<p class="muted">Ningún tema por debajo de 60 %.</p>') + '</div></div>';
    if (b.recomendaciones.length) {
      h += '<div class="card stack"><h2>Recomendaciones, en orden de prioridad</h2>';
      b.recomendaciones.forEach(function (r, k) {
        h += '<div><h3>' + (k + 1) + '. ' + esc(r.nombre) + ' <span class="chip ' + (r.prioridad === 'alta' ? 'bad' : r.prioridad === 'media' ? 'warn' : '') + '">prioridad ' + r.prioridad + '</span></h3>' +
          '<p>' + esc(r.texto) + '</p>' +
          (r.errores.length ? '<p class="small"><b>Lo que mostraron tus respuestas:</b></p><ul class="small">' + r.errores.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>' : '') +
          '<p class="small muted">Subtemas: ' + esc(r.subtemas.join(' · ')) + '</p></div>';
      });
      h += '</div>';
    }
    if (b.detalle) {
      h += '<div class="card stack pagebreak"><h2>Revisión pregunta por pregunta</h2>';
      b.detalle.forEach(function (d) {
        h += '<div style="border-top:1px solid var(--line);padding-top:10px"><div class="small muted">Pregunta ' + d.n + ' · ' + (d.ok ? '<span class="chip ok">correcta</span>' : d.resp === null ? '<span class="chip">sin responder</span>' : '<span class="chip bad">incorrecta</span>') + '</div><div>' + d.txt + '</div>' + (d.fig ? '<div class="fig">' + d.fig + '</div>' : '') +
          '<ol type="A" class="small">' + d.ops.map(function (o, k) { return '<li' + (k === d.correcta ? ' style="color:var(--ok);font-weight:700"' : k === d.resp ? ' style="color:var(--bad)"' : '') + '>' + esc(o) + (k === d.resp ? ' ← tu respuesta' : '') + '</li>'; }).join('') + '</ol>' +
          '<p class="small"><b>Explicación:</b> ' + esc(d.exp) + '</p></div>';
      });
      h += '</div>';
    }
    h += '<p class="small muted">Niveles: Fortaleza ≥ 80 % · Aceptable 60–79 % · En desarrollo 40–59 % · Crítico &lt; 40 %. Este diagnóstico orienta el estudio; no es una calificación académica.</p></div>';
    return h;
  };

  I.htmlInforme = function (r, opc) {
    opc = opc || {};
    r = I.normalizarInforme(r);
    var ts = Object.keys(r.temas), s = r.stats, h = '<div class="stack">';
    h += '<div class="card"><div class="small muted">Informe institucional · ' + esc(r.prueba.titulo) + '</div><h1 style="margin:2px 0">' + esc(r.sesion.institucion || 'Institución') + '</h1>' +
      '<div class="small muted">' + esc([r.sesion.grupo, r.sesion.nombre].filter(Boolean).join(' · ')) + (r.sesion.fecha ? ' · ' + fecha(r.sesion.fecha) : '') + '</div></div>';
    h += '<div class="tiles">' +
      tile(r.presentaron + '/' + r.inscritos, 'Presentaron') + tile(dec(s.media), 'Promedio (0–100)') + tile(dec(s.mediana), 'Mediana') + tile(dec(s.desv), 'Desviación estándar') +
      tile(s.min + '–' + s.max, 'Mínimo – máximo') + tile(dec(s.kr20), 'Confiabilidad KR-20') + '</div>';
    // Distribución
    var mx = Math.max.apply(null, s.histograma.concat([1]));
    h += '<div class="grid2"><div class="card"><h3>Distribución de puntajes</h3><div style="display:flex;align-items:flex-end;gap:4px;height:150px;margin-top:10px">' +
      s.histograma.map(function (c, k) { return '<div style="flex:1;text-align:center"><div class="small">' + (c || '') + '</div><div style="height:' + Math.round(120 * c / mx) + 'px;background:var(--acc);border-radius:4px 4px 0 0;opacity:' + (c ? 1 : .15) + '"></div></div>'; }).join('') +
      '</div><div style="display:flex;gap:4px" class="small muted">' + s.histograma.map(function (_, k) { return '<div style="flex:1;text-align:center">' + (k * 10) + '</div>'; }).join('') + '</div></div>';
    h += '<div class="card"><h3>Estudiantes por nivel</h3><table><tbody>' + A.NIVELES.map(function (n) {
      var c = s.niveles[n.id] || 0, p = r.presentaron ? Math.round(100 * c / r.presentaron) : 0;
      return '<tr><td>' + nivelChip(n.id) + '</td><td style="width:50%">' + barra(p, n.id) + '</td><td class="num">' + c + ' (' + p + ' %)</td></tr>';
    }).join('') + '</tbody></table></div></div>';
    // Temas
    h += '<div class="card"><h2>Dominio por tema y prioridad de refuerzo</h2><div class="tablewrap"><table><thead><tr><th>#</th><th>Tema</th><th style="width:34%">Promedio del grupo</th><th class="num">%</th><th class="num">Estudiantes &lt; 60 %</th><th>Prioridad</th></tr></thead><tbody>';
    r.prioridades.forEach(function (p, k) {
      var niv = A.nivel(p.pct).id;
      h += '<tr><td>' + (k + 1) + '</td><td>' + esc(r.temas[p.tema].nombre) + '</td><td>' + barra(p.pct, niv) + '</td><td class="num">' + dec(p.pct) + '</td><td class="num">' + r.porTema[p.tema].bajo60 + '</td><td><span class="chip ' + (p.clase === 'alta' ? 'bad' : p.clase === 'media' ? 'warn' : 'ok') + '">' + p.clase + '</span></td></tr>';
    });
    h += '</tbody></table></div><p class="small muted">Prioridad = (1 − dominio) × peso del tema como prerrequisito de los cursos siguientes.</p></div>';
    // Recomendaciones
    if (r.recomendaciones.length) {
      h += '<div class="card stack"><h2>Recomendaciones para la institución</h2>';
      r.recomendaciones.forEach(function (x, k) {
        h += '<div><h3>' + (k + 1) + '. ' + esc(x.nombre) + ' — promedio ' + dec(x.media) + ' % <span class="chip ' + (x.prioridad === 'alta' ? 'bad' : 'warn') + '">prioridad ' + x.prioridad + '</span></h3><p>' + esc(x.texto) + '</p>' +
          (x.errores.length ? '<p class="small"><b>Errores conceptuales detectados en el grupo:</b></p><ul class="small">' + x.errores.map(function (e) { return '<li>' + esc(e.texto) + ' <b>(' + dec(e.pct) + ' % de los estudiantes)</b></li>'; }).join('') + '</ul>' : '') +
          '<p class="small muted">' + x.bajo60 + ' estudiante(s) por debajo de 60 % · Subtemas: ' + esc(x.subtemas.join(' · ')) + '</p></div>';
      });
      h += '</div>';
    }
    if (r.errores.length) {
      h += '<div class="card"><h2>Errores conceptuales más frecuentes</h2><div class="tablewrap"><table><thead><tr><th>Error</th><th>Tema</th><th class="num">Estudiantes</th></tr></thead><tbody>' +
        r.errores.map(function (e) { return '<tr><td>' + esc(e.texto) + '</td><td class="small">' + esc(e.tema ? r.temas[e.tema].nombre : '') + '</td><td class="num">' + e.n + ' (' + dec(e.pct) + ' %)</td></tr>'; }).join('') + '</tbody></table></div></div>';
    }
    // Ranking
    h += '<div class="card pagebreak"><h2>Ranking de estudiantes</h2><div class="tablewrap"><table><thead><tr><th class="num">Puesto</th><th>Estudiante</th><th class="num">Aciertos</th><th class="num">Puntaje</th><th>Nivel</th>' +
      ts.map(function (t) { return '<th class="num" title="' + esc(r.temas[t].nombre) + '">' + esc(r.temas[t].corto || abrev(r.temas[t].nombre)) + '</th>'; }).join('') + '<th class="num">Min</th>' + (opc.integridad ? '<th class="num" title="Veces que salió de la pestaña de la prueba">Salidas</th>' : '') + (opc.acciones ? '<th></th>' : '') + '</tr></thead><tbody>';
    r.ranking.forEach(function (e, k) {
      h += '<tr><td class="num"><b>' + e.puesto + '</b></td><td>' + esc(e.nombre) + '</td><td class="num">' + e.aciertos + '</td><td class="num">' + dec(e.puntaje) + '</td><td>' + nivelChip(e.nivel) + '</td>' +
        ts.map(function (t) { var v = e.porTema[t]; return '<td class="num"><span class="nivel n-' + A.nivel(v).id + '">' + Math.round(v) + '</span></td>'; }).join('') +
        '<td class="num">' + (e.min === null ? '—' : e.min) + '</td>' + (opc.integridad ? '<td class="num">' + (e.salidas >= 3 ? '<span class="chip warn">' + e.salidas + '</span>' : e.salidas) + '</td>' : '') +
        (opc.acciones ? '<td><button class="sm" data-ver="' + k + '">Ver</button></td>' : '') + '</tr>';
    });
    h += '</tbody></table></div>' + (r.ausentes.length ? '<p class="small muted">No presentaron (' + r.ausentes.length + '): ' + esc(r.ausentes.join(', ')) + '</p>' : '') + '</div>';
    // Ítems
    if (opc.items !== false) {
      h += '<div class="card pagebreak"><h2>Análisis de preguntas</h2><p class="small muted">p = proporción de aciertos (dificultad). D = discriminación: diferencia de aciertos entre el 27 % superior y el 27 % inferior (≥ 0,3 buena; &lt; 0,1 revisar). Se resalta el distractor más elegido y lo que revela.</p><div class="tablewrap"><table><thead><tr><th>#</th><th>Pregunta</th><th class="num">p</th><th class="num">D</th><th>Respuestas (A·B·C·D)</th><th>Distractor más elegido</th></tr></thead><tbody>';
      r.items.forEach(function (it, k) {
        var niv = A.nivel(it.p * 100).id;
        h += '<tr><td>' + (k + 1) + '</td><td class="small" style="min-width:220px">' + (it.txt ? esc(it.txt.length > 140 ? it.txt.slice(0, 137) + '…' : it.txt) : esc(it.id)) + '<div class="muted">' + esc(r.temas[it.tema].nombre) + '</div></td>' +
          '<td class="num"><span class="nivel n-' + niv + '">' + String(it.p).replace('.', ',') + '</span></td><td class="num">' + (it.disc === null ? '—' : String(it.disc).replace('.', ',')) + '</td>' +
          '<td class="small" style="white-space:nowrap">' + it.frec.map(function (f, j) { return '<span style="' + (j === it.correcta ? 'color:var(--ok);font-weight:700' : '') + '">' + 'ABCD'[j] + ' ' + f + '</span>'; }).join(' · ') + (it.blanco ? ' · — ' + it.blanco : '') + '</td>' +
          '<td class="small">' + (it.distractor && it.distractor.n ? '<b>' + 'ABCD'[it.distractor.op] + '</b> (' + it.distractor.n + '): ' + esc(it.distractor.texto) : '—') + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
    }
    h += '<p class="small muted">Generado el ' + fecha(r.generado) + '. Niveles: Fortaleza ≥ 80 % · Aceptable 60–79 % · En desarrollo 40–59 % · Crítico &lt; 40 %. El ranking es de uso interno de la institución.</p></div>';
    return h;
  };
  function tile(v, k) { return '<div class="tile"><div class="v">' + esc(v) + '</div><div class="k">' + esc(k) + '</div></div>'; }
  function abrev(n) { return n.split(/[ ,]+/).filter(function (w) { return w.length > 2; }).map(function (w) { return w[0].toUpperCase(); }).join('').slice(0, 3); }

  if (typeof module !== 'undefined' && module.exports) module.exports = I; else root.INFORME = I;
})(this);
