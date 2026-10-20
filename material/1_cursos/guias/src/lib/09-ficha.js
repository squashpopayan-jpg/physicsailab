/* ===================================================================
   09-ficha.js — HTML de la ficha docente de cada práctica. build.js
   reemplaza los marcadores <!--F:id:parte--> de los capítulos con
   EM.FICHA.parte(id, parte); así el texto queda estático, indexable
   por el buscador e imprimible.
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  const F = (EM.FICHA = {});
  const ol = (a) => '<ol class="pasos-lista">' + a.map((x) => `<li>${x}</li>`).join('') + '</ol>';
  const ul = (a) => '<ul>' + a.map((x) => `<li>${x}</li>`).join('') + '</ul>';
  const NIV_CLS = { I: 'bad', II: 'warn', III: 'mid', IV: 'ok' };

  F.encabezado = function (p) {
    const N = EM.NIVELES[p.nivel || 1];
    const dba = (p.dba || []).map((d) => { const D = EM.CUR.dba[d]; return D ? `<li><b>DBA ${d.split('.')[0]}.° n.° ${d.split('.')[1]}.</b> ${D.t}</li>` : ''; }).join('');
    const est = (p.est || []).map((k) => `<li><span class="est-k">${k}</span> ${EM.CUR.est[k]}</li>`).join('');
    const comp = (p.comp || []).map((c) => EM.CUR.saber.competencias[c][0]).join(' · ');
    return `<div class="ficha-meta">
<div><small>Código</small><b>${p.cod}</b></div>
<div><small>Grado</small><b>${p.grado}.°</b></div>
<div><small>Tipo</small><b>${p.tipo === 'elaborada' ? 'Montaje elaborado' : 'Elementos simples'}</b></div>
<div><small>Duración</small><b>${p.tiempo} min</b></div>
<div><small>Grupo</small><b>${p.grupo || '3 a 4 estudiantes'}</b></div>
<div><small>Costo por grupo</small><b>${EM.cop(EM.PR.costo(p))}</b></div>
<div><small>Nivel sugerido</small><b>${N[0]} · ${N[1]}</b></div>
<div><small>Saber 11.°</small><b>${(p.temas || []).join(', ') || 'Indagación (transversal)'}</b></div>
</div>
<div class="tablewrap"><table class="ficha-ref">
<tr><th>Derechos Básicos de Aprendizaje</th><td><ul>${dba || '<li>Transversal: competencias de indagación (estándares C).</li>'}</ul></td></tr>
<tr><th>Estándares (grados 10.° y 11.°)</th><td><ul class="est">${est}</ul></td></tr>
<tr><th>Competencias que más se ejercitan</th><td>${comp}</td></tr>
</table></div>`;
  };

  F.objetivos = function (p) {
    return `<div class="box def"><h4>Pregunta de la práctica</h4><p>${p.pregunta}</p></div>` +
      (p.contexto ? `<p>${p.contexto}</p>` : '') +
      `<h3>Objetivos</h3>${ul(p.objetivos)}` +
      (p.prediccion ? `<h3>Predicción que se pide antes de medir</h3><p>${p.prediccion}</p>` : '') +
      (p.claves ? `<h3>Ideas clave para el estudiante</h3>${ul(p.claves)}` : '');
  };

  F.materiales = function (p) {
    const filas = p.materiales.map((m) => `<tr><td>${m[0]}</td><td class="c">${m[1]}</td><td>${m[2] || '—'}</td><td class="num">${m[3] ? EM.cop(m[3]) : '—'}</td></tr>`).join('');
    return `<div class="tablewrap"><table class="materiales"><tr><th>Elemento</th><th class="c">Cantidad por grupo</th><th>Alternativa de bajo costo</th><th class="c">Costo aprox.</th></tr>${filas}<tr class="total"><td colspan="3"><b>Total aproximado por grupo</b> (precios de referencia en Colombia, 2026; verifique en su ciudad)</td><td class="num"><b>${EM.cop(EM.PR.costo(p))}</b></td></tr></table></div>`;
  };

  F.montaje = (p) => ol(p.montaje) + (p.cortes ? '<h3>Lista de cortes y medidas</h3><div class="tablewrap"><table><tr><th>Pieza</th><th class="c">Medidas</th><th class="c">Cantidad</th><th>Notas</th></tr>' + p.cortes.map((c) => `<tr><td>${c[0]}</td><td class="c">${c[1]}</td><td class="c">${c[2]}</td><td>${c[3] || ''}</td></tr>`).join('') + '</table></div>' : '');

  F.seguridad = function (p) {
    const filas = p.seguridad.map((s) => {
      const v = EM.GTC.valorar(s.nd, s.ne, s.nc);
      return `<tr><td>${s.p}<small>${EM.GTC.CLASES[s.c] || ''}</small></td><td>${s.ef}</td><td>${s.ctrl}</td><td class="c">${s.nd || 'B'} × ${s.ne} × ${s.nc}</td><td class="c"><span class="chip ${NIV_CLS[v.nivel]}">${v.nivel}</span>${v.nr ? '<small>NR ' + v.nr + '</small>' : ''}</td></tr>`;
    }).join('');
    return `<div class="tablewrap"><table class="riesgos"><tr><th>Peligro (clasificación GTC 45)</th><th>Efecto posible</th><th>Controles</th><th class="c">ND × NE × NC</th><th class="c">Nivel</th></tr>${filas}</table></div>` +
      (p.epp ? `<p class="ctrl-note"><b>Elementos de protección:</b> ${p.epp}</p>` : '') +
      '<p class="ctrl-note">Valoración con los controles ya aplicados. ND: nivel de deficiencia; NE: nivel de exposición; NC: nivel de consecuencia; NR = ND × NE × NC. Nivel IV: aceptable; III: mejorable; II: corregir de inmediato; I: no realizar.</p>';
  };

  F.procedimiento = (p) => ol(p.procedimiento);
  F.tabla = function (p) {
    if (!p.tabla) return '';
    const vac = '<tr>' + p.tabla.cols.map(() => '<td>&nbsp;</td>').join('') + '</tr>';
    return `<div class="tablewrap"><table class="registro"><tr>${p.tabla.cols.map((c) => `<th class="c">${c}</th>`).join('')}</tr>${vac.repeat(Math.min(p.tabla.filas || 5, 4))}</table></div>`;
  };
  F.analisis = (p) => ol(p.analisis);
  F.errores = (p) => (p.errores ? '<ul class="errores">' + p.errores.map((e) => `<li><b>${e[0]}</b> ${e[1]}</li>`).join('') + '</ul>' : '');
  F.niveles = function (p) {
    return `<div class="niveles">
<div><span class="nv">1</span><b>Estructurada</b><p>La guía da el montaje y el procedimiento anteriores; el estudiante mide, analiza y explica.</p></div>
<div><span class="nv">2</span><b>Guiada</b><p>Se entrega la pregunta y se reemplaza el procedimiento por estas preguntas orientadoras:</p>${ul(p.orientadoras || [])}</div>
<div><span class="nv">3</span><b>Abierta</b><p>${p.abierta || ''}</p></div>
</div>`;
  };
  F.evaluacion = function (p) {
    let h = '<h3>Preguntas de discusión</h3>' + ol(p.preguntas);
    if (p.saber) {
      const s = p.saber;
      h += `<div class="box ex saber"><h4>Pregunta tipo Saber 11.° · ${EM.CUR.saber.competencias[s.comp][0]}</h4><p>${s.enunciado}</p><ol class="opciones">${s.opciones.map((o) => `<li>${o}</li>`).join('')}</ol><details><summary>Clave y justificación</summary><p><b>Clave: ${s.clave}.</b> ${s.just}</p></details></div>`;
    }
    if (p.rubrica && p.rubrica.length) {
      h += '<h3>Criterio específico de esta práctica</h3><div class="tablewrap"><table class="rubrica"><tr><th>Criterio</th>' + EM.GUIA.ESCALA.map((e) => `<th>${e}</th>`).join('') + '</tr>' + p.rubrica.map((r) => '<tr>' + r.map((c, i) => (i ? `<td>${c}</td>` : `<th>${c}</th>`)).join('') + '</tr>').join('') + '</table></div><p class="ctrl-note">Se suma a los cinco criterios generales del capítulo «Evaluar e incluir».</p>';
    }
    return h;
  };
  /* Mapa curricular de todas las prácticas (capítulo 1) */
  F.mapa = function () {
    const filas = EM.PR.lista.slice().sort((a, b) => (a.cod < b.cod ? -1 : 1)).map((p) => {
      const est = (p.est || []).filter((k) => k[0] === 'F' || k[0] === 'T').join(', ');
      return `<tr><td class="c"><b>${p.cod}</b></td><td><a href="#${p.capitulo}">${p.titulo}</a></td><td class="c">${p.tipo === 'elaborada' ? 'E' : 'S'}</td><td class="c">${(p.dba || []).join(', ') || '—'}</td><td class="c">${est || '—'}</td><td>${(p.temas || []).join(', ')}</td></tr>`;
    }).join('');
    return `<div class="tablewrap"><table class="mapa"><tr><th class="c">Código</th><th>Práctica</th><th class="c">Tipo</th><th class="c">DBA</th><th class="c">Estándares F y T</th><th>Temas de Saber 11.°</th></tr>${filas}</table></div><p class="ctrl-note">S: elementos simples; E: montaje elaborado. Los estándares de indagación (C) y de compromisos (S) se trabajan en todas las prácticas y se detallan en cada ficha.</p>`;
  };

  F.parte = function (id, parte) {
    const p = EM.PR.get(id);
    if (!p) throw new Error('Práctica sin datos: ' + id);
    if (!F[parte]) throw new Error('Parte de ficha desconocida: ' + parte);
    return F[parte](p);
  };
})();
