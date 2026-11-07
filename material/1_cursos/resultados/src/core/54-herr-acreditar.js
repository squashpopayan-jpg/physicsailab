/* ===================================================================
   44-herr-acreditar.js — autodiagnóstico, preguntas de los pares, cronograma y portada
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const el = EM.el;
  const H = EM.H;
  const A = EM.calc.ra;

  /* ---------- Autodiagnóstico de preparación ---------- */
  const GRUPOS = ['Definición', 'Alineación', 'Evaluación', 'Análisis', 'Mejora', 'Gestión'];
  const ITEMS = [
    { g: 'Definición', t: 'Los resultados de aprendizaje del programa están formulados, aprobados por la instancia competente y son públicos.', w: 1 },
    { g: 'Definición', t: 'Hay un documento que explica cómo se definieron: referentes, perfil de egreso y participación de egresados, empleadores, profesores y estudiantes.', w: 1 },
    { g: 'Definición', t: 'Los resultados están alineados con el perfil de egreso y con los objetivos del programa.', w: 1 },
    { g: 'Definición', t: 'Estudiantes y profesores conocen los resultados (hay evidencia de divulgación, no solo de publicación).', w: 1 },
    { g: 'Alineación', t: 'Existe una matriz que relaciona cada asignatura con los resultados y el nivel de desarrollo (introduce, refuerza, domina).', w: 1 },
    { g: 'Alineación', t: 'Los sílabos declaran resultados de asignatura y a qué resultado del programa contribuyen.', w: 1 },
    { g: 'Alineación', t: 'Los créditos y las horas de cada asignatura se justifican por sus resultados.', w: 1 },
    { g: 'Alineación', t: 'Las estrategias pedagógicas y las actividades son coherentes con los resultados que se quiere lograr.', w: 1 },
    { g: 'Evaluación', t: 'Existen rúbricas o instrumentos con niveles de desempeño para los resultados clave.', w: 1 },
    { g: 'Evaluación', t: 'Hay evidencia directa del logro en varios momentos del plan de estudios, no solo al final.', w: 1 },
    { g: 'Evaluación', t: 'Hay evidencia indirecta que contrasta la anterior (encuestas a egresados y empleadores, Saber Pro).', w: 1 },
    { g: 'Evaluación', t: 'Los evaluadores se calibran y se conoce la concordancia entre ellos.', w: 1 },
    { g: 'Análisis', t: 'Hay metas de logro explícitas para cada resultado.', w: 1 },
    { g: 'Análisis', t: 'Se cuenta con datos de logro de dos o más cohortes, comparables entre sí.', w: 1.5 },
    { g: 'Análisis', t: 'Los resultados se discuten en el comité curricular y queda acta.', w: 1 },
    { g: 'Mejora', t: 'De los resultados se derivaron acciones de mejora con responsable, fecha y recursos.', w: 2 },
    { g: 'Mejora', t: 'Hay evidencia de que las acciones se implementaron (cambios en sílabos, metodologías, secuencia, recursos).', w: 2 },
    { g: 'Mejora', t: 'Se volvió a medir el efecto de esas acciones en un ciclo posterior.', w: 2 },
    { g: 'Gestión', t: 'La política institucional de resultados de aprendizaje es conocida y se aplica en el programa.', w: 1 },
    { g: 'Gestión', t: 'Están definidos los roles (comité curricular, coordinación, profesores) y los tiempos del proceso.', w: 1 },
    { g: 'Gestión', t: 'Las evidencias están archivadas de forma organizada y se pueden mostrar en una visita sin improvisar.', w: 1 }
  ];
  const NIVS = ['0 · No existe', '1 · Borrador o parcial', '2 · Existe, falta aplicarlo', '3 · Aplicado y con evidencia'];
  EM.defineSim('autodiagnostico', function (sim) {
    sim.below(); sim.side.style.gridTemplateColumns = 'minmax(0, 1fr)';
    const cv = sim.canvas({ aspect: 1.6, label: 'Radar de preparación por dimensión' });
    const DIAG0 = [2, 1, 2, 0, 0, 0, 2, 2, 0, 1, 2, 0, 0, 0, 1, 1, 1, 0, 2, 2, 1];
    const resp = H.get('diag', DIAG0);
    sim.group('Responda con honestidad: la utilidad está en ver dónde está parado');
    sim.note('Los valores iniciales son una <b>lectura del autor del curso</b> de los documentos que el programa entregó (presentación a los pares, plan de mejoramiento, microcurrículos, actas). Corríjalos con lo que usted sabe.');
    const lst = el('div', 'h-diag');
    let last = '';
    ITEMS.forEach((it, i) => {
      if (it.g !== last) { lst.append(el('h5', null, it.g)); last = it.g; }
      const row = el('div', 'h-di');
      row.append(el('span', 'h-di-t', H.esc(it.t)));
      const s = document.createElement('select'); s.setAttribute('aria-label', it.t.slice(0, 60));
      NIVS.forEach((n, k) => { const o = document.createElement('option'); o.value = k; o.textContent = n; s.append(o); });
      s.value = resp[i];
      s.addEventListener('change', () => { resp[i] = +s.value; H.set('diag', resp); sim.redraw(); });
      row.append(s); lst.append(row);
    });
    sim.ctrlBox.append(lst);
    sim.out('tot', 'Preparación global', { hl: true }); sim.out('baja', 'Dimensión más débil'); sim.out('pri', 'Primeras tareas');
    sim.onDraw(() => {
      const { ctx, w, h } = cv;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2 + 4, R = Math.min(w, h) * 0.34;
      const sc = A.puntajeGrupos(ITEMS, resp);
      const ang = (k) => -Math.PI / 2 + (k * 2 * Math.PI) / GRUPOS.length;
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1;
      [1 / 3, 2 / 3, 1].forEach((f) => { ctx.beginPath(); GRUPOS.forEach((_, k) => { const x = cx + Math.cos(ang(k)) * R * f, y = cy + Math.sin(ang(k)) * R * f; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke(); });
      GRUPOS.forEach((_, k) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang(k)) * R, cy + Math.sin(ang(k)) * R); ctx.stroke(); });
      ctx.beginPath(); GRUPOS.forEach((g, k) => { const v = sc[g]; const x = cx + Math.cos(ang(k)) * R * v, y = cy + Math.sin(ang(k)) * R * v; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
      ctx.fillStyle = EM.alpha('--accent', 0.22); ctx.fill(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.font = H.fontUI(12, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      GRUPOS.forEach((g, k) => { const x = cx + Math.cos(ang(k)) * (R + 26), y = cy + Math.sin(ang(k)) * (R + 20); ctx.fillStyle = EM.col('--ink'); ctx.fillText(g, x, y - 7); ctx.fillStyle = EM.col('--accent'); ctx.fillText(Math.round(sc[g] * 100) + ' %', x, y + 8); });
      const tot = ITEMS.reduce((a, it, i) => a + resp[i] * it.w, 0) / ITEMS.reduce((a, it) => a + 3 * it.w, 0);
      const low = GRUPOS.slice().sort((a, b) => sc[a] - sc[b])[0];
      const pend = ITEMS.map((it, i) => [it, i]).filter(([, i]) => resp[i] < 2).sort((a, b) => b[0].w - a[0].w || resp[a[1]] - resp[b[1]]).slice(0, 3);
      sim.set('tot', H.pct(tot)); sim.set('baja', `${low} (${H.pct(sc[low])})`);
      sim.set('pri', pend.length ? pend.map(([it]) => '· ' + H.esc(it.t.length > 90 ? it.t.slice(0, 88) + '…' : it.t)).join('<br>') : 'Ninguna: todo está en 2 o 3.');
    });
  });

  /* ---------- Preguntas que hacen los pares ---------- */
  const PREG = [
    { c: 'Definición', q: '¿Cuáles son los resultados de aprendizaje de su programa y cómo los definieron?', ev: 'Documento de resultados, actas de talleres con egresados, empleadores y profesores, referentes consultados.', err: 'Responder con los objetivos del programa o con una lista de contenidos.' },
    { c: 'Definición', q: '¿Por qué estos resultados y no otros? ¿Cada cuánto los revisan?', ev: 'Procedimiento de revisión, fechas de la última revisión y qué cambió.', err: 'Decir que «siempre han sido así» o que los fijó un tercero.' },
    { c: 'Definición', q: '¿Cómo participaron los empleadores y los egresados en esa definición?', ev: 'Listas de asistencia, encuestas, resultados y la decisión que se tomó con ellas.', err: 'Mostrar una encuesta de satisfacción sin relación con los resultados.' },
    { c: 'Alineación', q: '¿En qué asignaturas se desarrolla el resultado de diseño? ¿Se introduce, se refuerza y se domina?', ev: 'Matriz curricular, sílabos de tres asignaturas representativas.', err: 'Marcar todas las asignaturas con todos los resultados.' },
    { c: 'Alineación', q: '¿Cómo sabe un estudiante de primer semestre lo que se espera que logre al egresar?', ev: 'Inducción, portal, sílabos, encuesta a estudiantes sobre conocimiento de los resultados.', err: 'Asumir que está en el documento del registro calificado y basta.' },
    { c: 'Alineación', q: '¿Qué relación hay entre los créditos de una asignatura y los resultados que debe lograr?', ev: 'Distribución de horas de acompañamiento e independientes, política institucional de créditos.', err: 'Responder que los créditos los determina la tradición del plan de estudios.' },
    { c: 'Evaluación', q: 'Muéstreme cómo evalúan que un estudiante alcanzó el resultado de experimentación: instrumento y trabajos reales.', ev: 'Rúbrica, tres muestras de trabajo con niveles distintos, instrucciones al evaluador.', err: 'Mostrar solo notas finales de la asignatura.' },
    { c: 'Evaluación', q: '¿Cómo garantizan que dos profesores califiquen igual con la misma rúbrica?', ev: 'Registros de calibración, κ de Cohen entre evaluadores, ajustes hechos.', err: 'No haberlo medido nunca.' },
    { c: 'Evaluación', q: '¿Cómo evalúan resultados como ética o trabajo en equipo, que son difíciles de calificar?', ev: 'Rúbricas con conductas observables, evaluación entre pares, estudios de caso evaluados.', err: 'Dejarlos sin evaluar «porque son actitudinales».' },
    { c: 'Evaluación', q: '¿Qué papel tienen Saber Pro y las encuestas a egresados en su evaluación de resultados?', ev: 'Análisis de resultados por módulo vinculados a resultados del programa.', err: 'Mostrar los puntajes sin relacionarlos con ningún resultado.' },
    { c: 'Análisis', q: '¿Qué porcentaje de estudiantes alcanza la meta en cada resultado y cómo ha cambiado en las últimas cohortes?', ev: 'Tablero de logro por resultado y cohorte, con tamaño de muestra y método.', err: 'Tener solo datos de un periodo, o datos sin meta contra la cual compararlos.' },
    { c: 'Mejora', q: '¿Qué decisión curricular tomaron a partir de esos resultados?', ev: 'Acta del comité, plan de mejoramiento, cambios en sílabos o secuencia.', err: 'No poder citar ni un solo cambio atribuible a los datos.' },
    { c: 'Mejora', q: '¿Cómo supieron si el cambio funcionó?', ev: 'Datos del ciclo posterior comparados con los anteriores.', err: 'Considerar que implementar la acción ya es el resultado.' },
    { c: 'Mejora', q: '¿Qué pasa con los estudiantes que no alcanzan los resultados? ¿Qué apoyos reciben?', ev: 'Sistema de alertas tempranas, tutorías, cursos de nivelación y su efecto.', err: 'Tratar el tema solo como deserción, sin relación con el aprendizaje.' },
    { c: 'Gestión', q: '¿Cómo se articulan los resultados del programa con la política institucional de resultados de aprendizaje?', ev: 'Acuerdo institucional, procedimientos del Sistema Interno de Aseguramiento de la Calidad.', err: 'Desconocer la política institucional.' },
    { c: 'Gestión', q: '¿Qué cambia con el nuevo modelo de acreditación del Acuerdo CESU 01 de 2025?', ev: 'Cuadro comparativo de características y plan de transición.', err: 'Creer que el nuevo modelo reemplaza lo que ya se hizo; en realidad lo amplía.' }
  ];
  EM.defineSim('preguntas-pares', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    const est = H.get('pares', {});
    let cat = 'Todas', idx = 0;
    const cats = ['Todas'].concat(Array.from(new Set(PREG.map((p) => p.c))));
    const bar = el('div', 'h-bar');
    H.select(bar, { label: 'Tema', options: cats.map((c) => [c, c]), value: 'Todas', onInput: (v) => { cat = v; idx = 0; draw(); } });
    panel.append(bar);
    const card = el('div', 'h-quiz'); panel.append(card);
    const res = el('div', 'h-res'); panel.append(res);
    const lst = () => PREG.filter((p) => cat === 'Todas' || p.c === cat);
    function draw() {
      const l = lst(), p = l[idx % l.length], k = PREG.indexOf(p);
      card.innerHTML = `<div class="h-q-n">${H.esc(p.c)} · pregunta ${(idx % l.length) + 1} de ${l.length}</div><blockquote class="h-q">${H.esc(p.q)}</blockquote><details class="h-det"><summary>¿Qué evidencia debería poder mostrar?</summary><p><b>Evidencia:</b> ${H.esc(p.ev)}</p><p><b>Error frecuente:</b> ${H.esc(p.err)}</p></details><div class="ctrl-row"></div>`;
      const row = card.querySelector('.ctrl-row');
      [['Puedo responder y mostrarlo', 2], ['Responder sí, mostrarlo no', 1], ['No estoy preparado', 0]].forEach(([t, v]) => H.btn(row, t, () => { est[k] = v; H.set('pares', est); idx++; draw(); }, est[k] === v ? 'on' : ''));
      H.btn(row, 'Saltar', () => { idx++; draw(); });
      const n = Object.keys(est).length, ok = Object.values(est).filter((v) => v === 2).length;
      const refuerzo = PREG.map((q, i) => [q, i]).filter(([, i]) => est[i] === 0 || est[i] === 1);
      res.innerHTML = `<p><b>Avance:</b> ${n} de ${PREG.length} preguntas contestadas · ${ok} con respuesta y evidencia.</p>` + (refuerzo.length ? '<p class="ctrl-note">Para reforzar:</p><ul class="h-chk">' + refuerzo.map(([q, i]) => `<li class="${est[i] === 0 ? 'no' : 'mid'}"><span aria-hidden="true">${est[i] === 0 ? '✗' : '~'}</span> ${H.esc(q.q)}</li>`).join('') + '</ul>' : '');
    }
    draw();
  });

  /* ---------- Cronograma hacia atrás ---------- */
  const TAREAS = [
    { n: 'Constituir el equipo y repartir roles', dur: 14, dep: [] },
    { n: 'Revisar y ajustar los resultados con grupos de interés', dur: 45, dep: [0] },
    { n: 'Aprobar los resultados en las instancias competentes', dur: 21, dep: [1] },
    { n: 'Construir la matriz curricular y actualizar sílabos', dur: 60, dep: [2] },
    { n: 'Diseñar rúbricas y plan de evidencias', dur: 45, dep: [2] },
    { n: 'Calibrar a los evaluadores', dur: 14, dep: [4] },
    { n: 'Recolectar evidencia de un periodo académico', dur: 112, dep: [3, 5] },
    { n: 'Analizar los resultados y formular acciones', dur: 30, dep: [6] },
    { n: 'Implementar acciones de mejora y documentarlas', dur: 90, dep: [7] },
    { n: 'Preparar el informe y organizar los anexos', dur: 45, dep: [7] }
  ];
  EM.defineSim('cronograma', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, label: 'Diagrama de Gantt hacia atrás' });
    const hoy = new Date();
    const hoyIso = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    let limite = H.get('limite', '2027-11-30');
    sim.group('Fecha en que debe estar listo el informe de autoevaluación');
    const inp = document.createElement('input'); inp.type = 'date'; inp.value = limite; inp.setAttribute('aria-label', 'Fecha límite'); inp.className = 'datein';
    inp.addEventListener('input', () => { if (inp.value) { limite = inp.value; H.set('limite', limite); sim.redraw(); } });
    sim.ctrlBox.append(inp);
    sim.note('Las duraciones están en días calendario y son una referencia: ajústelas con la realidad de su programa. Las tareas 6 y 7 suponen un solo periodo académico de evidencia (16 semanas).');
    sim.out('crit', 'Ruta crítica (días)', { hl: true }); sim.out('disp', 'Días disponibles desde hoy'); sim.out('ini', 'Fecha límite para empezar'); sim.out('est', 'Veredicto');
    sim.onDraw(() => {
      const { ctx, w, h } = cv;
      const sch = A.programaAtras(TAREAS, limite);
      const t0 = sch.reduce((a, s) => (s.ini < a ? s.ini : a), limite);
      const span = Math.max(1, A.difDias(t0, limite));
      const crit = span, disp = A.difDias(hoyIso, limite);
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, h);
      const L = 20, R = 16, T = 26, B = 14, rowH = (h - T - B) / TAREAS.length, pw = w - L - R;
      const X = (iso) => L + (A.difDias(t0, iso) / span) * pw;
      ctx.font = H.fontUI(11, 500); ctx.textBaseline = 'middle';
      for (let m = 0; m <= 12; m++) { const d = A.sumaDias(t0, Math.round((span * m) / 12)); const x = X(d); ctx.strokeStyle = EM.col('--grid-2'); ctx.beginPath(); ctx.moveTo(x, T - 4); ctx.lineTo(x, h - B); ctx.stroke(); if (m % 2 === 0) { ctx.fillStyle = EM.col('--ink-3'); ctx.textAlign = 'center'; ctx.fillText(d.slice(0, 7), x, T - 14); } }
      sch.forEach((s, i) => {
        const y = T + i * rowH + rowH * 0.18, bh = rowH * 0.64, x1 = X(s.ini), x2 = X(s.fin);
        ctx.fillStyle = EM.alpha(i >= 6 ? '--c3' : '--c1', 0.85); H.roundRect(ctx, x1, y, Math.max(4, x2 - x1), bh, 4); ctx.fill();
        ctx.fillStyle = EM.col('--ink'); ctx.font = H.fontUI(11, 600); ctx.textAlign = x2 - x1 > 220 ? 'left' : (x1 > pw * 0.55 ? 'right' : 'left');
        const tx = x2 - x1 > 220 ? x1 + 8 : (x1 > pw * 0.55 ? x1 - 6 : x2 + 6);
        ctx.fillStyle = x2 - x1 > 220 ? '#fff' : EM.col('--ink');
        ctx.fillText(`${i + 1}. ${s.n}`, tx, y + bh / 2);
      });
      const xh = X(hoyIso);
      if (hoyIso >= t0 && hoyIso <= limite) { ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xh, T - 4); ctx.lineTo(xh, h - B); ctx.stroke(); ctx.fillStyle = EM.col('--c2'); ctx.textAlign = 'center'; ctx.fillText('hoy', xh, h - 4); }
      sim.set('crit', String(crit)); sim.set('disp', String(disp)); sim.set('ini', t0);
      sim.set('est', disp >= crit ? `Alcanza, con ${disp - crit} días de holgura.` : `No alcanza: faltan ${crit - disp} días. Comprima tareas en paralelo, reduzca la recolección a un periodo o mueva la fecha.`);
    });
  });

  /* ---------- Portada: el ciclo girando ---------- */
  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, label: 'Ciclo de mejora continua de los resultados de aprendizaje' });
    const N = ['Definir', 'Alinear', 'Evaluar', 'Evidencia', 'Analizar', 'Actuar'];
    sim.t = 0;
    sim.animate((dt) => { sim.t += dt; });
    sim.onDraw(() => {
      const { ctx, w, h } = cv, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.34, r = Math.min(w, h) * 0.085;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, h);
      const ang = (k) => -Math.PI / 2 + (k * 2 * Math.PI) / N.length;
      ctx.strokeStyle = EM.col('--rule-strong'); ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      const ph = (sim.t * 0.5) % 1, act = Math.floor(ph * N.length);
      N.forEach((n, k) => {
        const x = cx + Math.cos(ang(k)) * R, y = cy + Math.sin(ang(k)) * R, on = k === act;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = on ? EM.col('--accent') : EM.col('--surface'); ctx.fill();
        ctx.lineWidth = on ? 3 : 1.6; ctx.strokeStyle = on ? EM.col('--accent') : EM.col('--rule-strong'); ctx.stroke();
        ctx.fillStyle = on ? EM.col('--accent-ink') : EM.col('--ink'); ctx.font = H.fontUI(Math.max(10, r * 0.3), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n, x, y);
      });
      const a = -Math.PI / 2 + ph * 2 * Math.PI; ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = EM.col('--ink'); ctx.font = H.fontUI(Math.max(13, w * 0.032), 700); ctx.textAlign = 'center'; ctx.fillText('Resultados', cx, cy - 8); ctx.fillText('de aprendizaje', cx, cy + 14);
    });
  });
})();
