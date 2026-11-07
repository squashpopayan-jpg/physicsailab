/* ===================================================================
   42-herr-construir.js — ficha del programa, referentes, Bloom, analizador, priorización, editor de RA
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const el = EM.el;
  const H = EM.H;
  const A = EM.calc.ra;

  /* pequeño bus de eventos para que las herramientas se enteren de los cambios */
  const bus = {};
  H.on = (n, f) => { (bus[n] = bus[n] || []).push(f); };
  H.emit = (n) => (bus[n] || []).forEach((f) => { try { f(); } catch (e) { console.error(e); } });

  /* ---------- Ficha del programa ---------- */
  const FICHA0 = {
    programa: 'Ingeniería Física', titulo: 'Ingeniero(a) Físico(a)', institucion: 'Universidad del Cauca · Facultad de Ciencias Naturales, Exactas y de la Educación',
    lugar: 'Popayán', modalidad: 'Presencial · jornada diurna', semestres: 10, creditos: 165, snies: '3636',
    rc: 'Resolución 6518 del 9 de agosto de 2011 (registro calificado inicial). La presentación del programa indica renovaciones por 7 años en 2018 y en 2025-2026 (Res. 23384, número tomado de la diapositiva; verifíquelo)',
    acred: 'Resolución MEN 8333 de 2019 (según la presentación del programa a los pares); renovación de la acreditación en trámite, autoevaluación 2026', visita: '',
    perfil: 'Profesional con formación en procesos de investigación y desarrollo, orientados a la generación y aplicación de conocimientos de la ciencia física y de la ingeniería para solucionar problemas de la industria, la investigación y la academia. Líneas de énfasis: instrumentación y control, materiales y óptica.'
  };
  EM.defineSim('ficha-programa', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    const F = H.get('ficha', FICHA0);
    const save = () => { H.set('ficha', F); show(); };
    const grid = el('div', 'h-grid2');
    [['programa', 'Programa'], ['titulo', 'Título que otorga'], ['institucion', 'Institución y unidad'], ['lugar', 'Lugar de desarrollo'], ['modalidad', 'Modalidad y jornada'], ['snies', 'Código SNIES'], ['rc', 'Registro calificado'], ['acred', 'Acreditación de alta calidad (resolución y vigencia, si la hay)'], ['visita', 'Fecha de la visita de pares']].forEach(([k, l]) => H.input(grid, { label: l, value: F[k], type: k === 'visita' ? 'date' : 'text', onInput: (v) => { F[k] = v; save(); } }));
    H.input(grid, { label: 'Semestres', type: 'number', value: F.semestres, min: 1, max: 14, onInput: (v) => { F.semestres = v; save(); } });
    H.input(grid, { label: 'Créditos', type: 'number', value: F.creditos, min: 1, max: 300, onInput: (v) => { F.creditos = v; save(); } });
    panel.append(grid);
    H.input(panel, { label: 'Perfil de egreso (copie el texto oficial del documento del programa)', rows: 4, value: F.perfil, onInput: (v) => { F.perfil = v; save(); } });
    const res = el('div', 'h-res');
    panel.append(res);
    function show() {
      const hrs = F.creditos * A.HORAS_CREDITO;
      const prom = F.semestres ? F.creditos / F.semestres : 0;
      const faltan = ['rc', 'acred', 'perfil'].filter((k) => !F[k]);
      res.innerHTML = `<p><b>Lectura rápida.</b> ${F.creditos} créditos equivalen a ${hrs.toLocaleString('es-CO')} horas de trabajo del estudiante (1 crédito = 48 h). En ${F.semestres} semestres son ${prom.toFixed(1).replace('.', ',')} créditos por semestre, o ${Math.round((prom * A.HORAS_CREDITO) / 16)} horas por semana de dedicación total en un semestre de 16 semanas.</p>` +
        (faltan.length ? `<p class="ctrl-note">Pendiente de completar: ${faltan.map((k) => ({ rc: 'registro calificado', acred: 'estado de acreditación', perfil: 'perfil de egreso' }[k])).join(', ')}.</p>` : '');
    }
    show();
  });

  /* ---------- Referentes: ABET, Washington Accord, Dublin ---------- */
  const REF = {
    abet: { t: 'ABET, criterio 3 (resultados del estudiante, ingeniería)', items: ['Identificar, formular y resolver problemas complejos de ingeniería aplicando ingeniería, ciencias y matemáticas', 'Aplicar el diseño de ingeniería para producir soluciones que respondan a necesidades, considerando salud, seguridad, bienestar y factores globales, culturales, sociales, ambientales y económicos', 'Comunicarse eficazmente con diversas audiencias', 'Reconocer responsabilidades éticas y profesionales y emitir juicios informados considerando el impacto global, económico, ambiental y social', 'Funcionar eficazmente en un equipo que lidera, crea un ambiente colaborativo e inclusivo, fija metas y cumple objetivos', 'Desarrollar y conducir experimentación apropiada, analizar e interpretar datos y usar criterio de ingeniería para concluir', 'Adquirir y aplicar nuevo conocimiento según se necesite, con estrategias de aprendizaje apropiadas'], map: { RA1: [0], RA2: [0, 5], RA3: [5], RA4: [1], RA5: [1], RA6: [5, 6], RA7: [2, 4], RA8: [3], RA9: [6] }, mapReal: { RA1: [0], RA2: [5, 2], RA3: [4, 6] } },
    wa: { t: 'Acuerdo de Washington, atributos del graduado (versión de 2013)', items: ['Conocimiento de ingeniería', 'Análisis de problemas', 'Diseño y desarrollo de soluciones', 'Investigación', 'Uso de herramientas modernas', 'El ingeniero y la sociedad', 'Medio ambiente y sostenibilidad', 'Ética', 'Trabajo individual y en equipo', 'Comunicación', 'Gestión de proyectos y finanzas', 'Aprendizaje a lo largo de la vida'], map: { RA1: [0, 1], RA2: [1, 4], RA3: [3, 4], RA4: [2, 10], RA5: [2, 4], RA6: [3, 11], RA7: [8, 9], RA8: [5, 6, 7], RA9: [11] }, mapReal: { RA1: [0, 1], RA2: [2, 3, 9], RA3: [8, 11] } },
    dub: { t: 'Descriptores de Dublín (primer ciclo)', items: ['Conocimiento y comprensión', 'Aplicación del conocimiento y la comprensión', 'Capacidad de emitir juicios', 'Habilidades de comunicación', 'Habilidades de aprendizaje'], map: { RA1: [0, 1], RA2: [1, 2], RA3: [1, 2], RA4: [1, 2], RA5: [1], RA6: [2, 4], RA7: [3], RA8: [2], RA9: [4] }, mapReal: { RA1: [0, 1], RA2: [1, 2, 3], RA3: [3, 4] } }
  };
  EM.defineSim('referentes', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    let cur = 'abet';
    const M = H.get('refmap2', {});
    const setKey = () => H.get('raset', 'real');
    const bar = el('div', 'h-bar');
    H.select(bar, { label: 'Marco de comparación', options: Object.keys(REF).map((k) => [k, REF[k].t]), value: 'abet', onInput: (v) => { cur = v; draw(); } });
    panel.append(bar);
    const out = el('div', 'tablewrap'), note = el('p', 'ctrl-note');
    panel.append(out, note);
    function getMap(k) {
      const key = k + ':' + setKey(), base = setKey() === 'prop' ? REF[k].map : REF[k].mapReal;
      if (!M[key]) { M[key] = {}; Object.keys(base).forEach((ra) => base[ra].forEach((i) => { M[key][i + '|' + ra] = 1; })); }
      return M[key];
    }
    function draw() {
      const ras = H.get('ras', H.RA0), r = REF[cur], m = getMap(cur);
      let h = '<table class="h-mat"><tr><th>Elemento del marco</th>' + ras.map((x) => `<th title="${H.esc(x.t)}">${H.esc(x.c)}</th>`).join('') + '<th>Cubierto</th></tr>';
      let sin = 0;
      r.items.forEach((it, i) => {
        const cnt = ras.filter((x) => m[i + '|' + x.c]).length;
        if (!cnt) sin++;
        h += `<tr><td class="l">${i + 1}. ${H.esc(it)}</td>` + ras.map((x) => `<td><button type="button" class="cell${m[i + '|' + x.c] ? ' on' : ''}" data-i="${i}" data-r="${x.c}" aria-label="${H.esc(it)} y ${x.c}" aria-pressed="${m[i + '|' + x.c] ? 'true' : 'false'}">${m[i + '|' + x.c] ? '✓' : ''}</button></td>`).join('') + `<td class="${cnt ? 'ok' : 'bad'}">${cnt ? cnt + ' RA' : 'brecha'}</td></tr>`;
      });
      out.innerHTML = h + '</table>';
      note.innerHTML = sin ? `<b>${sin} elemento${sin > 1 ? 's' : ''} sin ningún resultado asociado.</b> Decida si es una brecha real o si el programa lo cubre de otra forma.` : 'Todos los elementos del marco tienen al menos un resultado asociado. Compruebe que la asociación sea sustantiva y no solo de palabras.';
      out.querySelectorAll('.cell').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.i + '|' + b.dataset.r; if (m[k]) delete m[k]; else m[k] = 1; H.set('refmap2', M); draw(); }));
    }
    H.on('ras', draw);
    draw();
  });

  /* ---------- Explorador de Bloom ---------- */
  const BLOOM = [
    { d: 'Recuperar información de la memoria.', ex: 'Enumera las magnitudes base del Sistema Internacional y sus unidades.', uso: 'Útil en primeros semestres; rara vez es un resultado de egreso por sí solo.' },
    { d: 'Construir significado a partir de lo aprendido.', ex: 'Explica por qué la incertidumbre estadística de un promedio disminuye al aumentar el número de mediciones.', uso: 'Base para aplicar; frecuente en cursos de fundamentación.' },
    { d: 'Usar un procedimiento en una situación dada.', ex: 'Calcula la longitud de onda de una fuente a partir de un patrón de difracción medido.', uso: 'Núcleo de los cursos de ciencias básicas y de ingeniería.' },
    { d: 'Descomponer y relacionar las partes de un todo.', ex: 'Descompone una señal ruidosa en sus componentes de frecuencia e identifica la fuente del ruido.', uso: 'Típico de cursos intermedios y avanzados.' },
    { d: 'Emitir juicios con base en criterios y estándares.', ex: 'Valida un modelo térmico comparándolo con mediciones y concluye si es adecuado para el diseño.', uso: 'Propio del criterio de ingeniería; esencial al egresar.' },
    { d: 'Reunir elementos para formar algo nuevo y coherente.', ex: 'Diseña un sensor de temperatura para un horno con requisitos de exactitud, costo y seguridad.', uso: 'Diseño, proyectos, trabajo de grado: tiene que estar presente en el egreso.' }
  ];
  EM.defineSim('bloom', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    let n = 3;
    const bar = el('div', 'h-bar');
    const seg = el('div', 'seg');
    A.NIVELES.forEach((nm, i) => { const b = el('button', null, `${i + 1}. ${nm}`); b.type = 'button'; b.addEventListener('click', () => { n = i + 1; draw(); }); seg.append(b); });
    bar.append(seg); panel.append(bar);
    const out = el('div', 'h-res'); panel.append(out);
    function draw() {
      Array.from(seg.children).forEach((b, i) => { b.classList.toggle('on', i + 1 === n); b.setAttribute('aria-pressed', i + 1 === n ? 'true' : 'false'); });
      const b = BLOOM[n - 1];
      out.innerHTML = `<h4>${n}. ${A.NIVELES[n - 1]}</h4><p>${H.esc(b.d)}</p><p><b>Verbos que sirven:</b> ${A.VERBOS[n].map((v) => `<span class="chip">${v}</span>`).join(' ')}</p><p><b>Ejemplo en Ingeniería Física.</b> «${H.esc(b.ex)}»</p><p class="ctrl-note">${H.esc(b.uso)}</p>`;
    }
    draw();
  });

  /* ---------- Analizador de resultados de aprendizaje ---------- */
  const EJEMPLOS = [
    ['Conocer la física clásica y moderna.', 'Deficiente: verbo no verificable'],
    ['El programa pretende ofrecer formación sólida en instrumentación y control.', 'Deficiente: centrado en el programa'],
    ['Diseña y valida un sistema de medición de una magnitud física en un proceso de ingeniería, estimando su incertidumbre y justificando la selección de sensores según normas técnicas.', 'Bien formulado'],
    ['Resuelve problemas.', 'Demasiado corto y genérico'],
    ['Formula modelos matemáticos de fenómenos físicos en contextos de ingeniería y contrasta sus predicciones con datos experimentales documentando las limitaciones.', 'Bien formulado']
  ];
  EM.defineSim('analizador-ra', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    const ta = H.input(panel, { label: 'Escriba o pegue un resultado de aprendizaje', rows: 3, value: EJEMPLOS[2][0], onInput: () => run() });
    const ex = el('div', 'ctrl-row');
    EJEMPLOS.forEach(([t, l], i) => H.btn(ex, 'Ejemplo ' + (i + 1) + ': ' + l, () => { ta.value = t; run(); }));
    panel.append(ex);
    /* constructor guiado */
    const gb = el('details', 'h-det');
    gb.innerHTML = '<summary>Constructor guiado: verbo + objeto + contexto + criterio</summary>';
    const gi = el('div', 'h-grid2'); gb.append(gi);
    const verbOpts = []; for (let n = 3; n <= 6; n++) A.VERBOS[n].forEach((v) => verbOpts.push([v, `${v} (${A.NIVELES[n - 1]})`]));
    const G = { v: 'diseñar', o: 'un sistema de medición de temperatura', c: 'en un proceso industrial', k: 'con criterios de exactitud y seguridad' };
    const compose = () => { const t = `${A.formas(G.v)[1][0].toUpperCase() + A.formas(G.v)[1].slice(1)} ${G.o} ${G.c} ${G.k}.`.replace(/\s+/g, ' '); ta.value = t; run(); };
    H.select(gi, { label: 'Verbo', options: verbOpts, value: G.v, onInput: (v) => { G.v = v; compose(); } });
    H.input(gi, { label: 'Objeto (qué)', value: G.o, onInput: (v) => { G.o = v; compose(); } });
    H.input(gi, { label: 'Contexto (dónde, con qué)', value: G.c, onInput: (v) => { G.c = v; compose(); } });
    H.input(gi, { label: 'Criterio o estándar (cómo de bien)', value: G.k, onInput: (v) => { G.k = v; compose(); } });
    panel.append(gb);
    const res = el('div', 'h-res'); panel.append(res);
    function run() {
      const r = A.analizar(ta.value);
      if (!r.n) { res.innerHTML = '<p class="ctrl-note">Escriba un resultado para analizarlo.</p>'; return; }
      const cls = r.puntaje >= 75 ? 'good' : r.puntaje >= 50 ? 'mid' : 'bad';
      res.innerHTML = `<div class="h-score ${cls}"><b>${r.puntaje}</b><small>/100</small></div><div class="h-det2"><p><b>Verbo:</b> ${r.verbo ? `${r.verbo} · nivel ${r.nivel} (${r.nivelNombre})` : '<i>no reconocido</i>'} · <b>Palabras:</b> ${r.n}</p><ul class="h-chk">` +
        r.checks.map((c) => `<li class="${c.ok ? 'ok' : 'no'}"><span aria-hidden="true">${c.ok ? '✓' : '✗'}</span> ${H.esc(c.txt)}</li>`).join('') + '</ul>' +
        (r.vago ? `<p class="h-adv">Verbo o giro poco verificable: «${H.esc(r.vago)}». ¿Cómo lo demostraría el estudiante? Reemplácelo por una acción observable.</p>` : '') +
        (r.docente ? `<p class="h-adv">Está centrado en lo que hace el docente o el programa («${H.esc(r.docente)}»). Reformúlelo desde el estudiante.</p>` : '') +
        r.avisos.map((a) => `<p class="h-adv">${H.esc(a)}</p>`).join('') +
        '<p class="ctrl-note">El analizador revisa señales de forma, no de fondo. Un puntaje alto no garantiza que el resultado sea pertinente: eso lo decide el programa.</p></div>';
    }
    run();
  });

  /* ---------- Priorización con grupos de interés ---------- */
  const PRI0 = [
    ['Fundamentos de física y matemáticas aplicados', 5, 5, 4, 5, 4], ['Modelación y simulación', 4, 4, 4, 4, 3], ['Experimentación y metrología', 5, 5, 5, 4, 3], ['Diseño en ingeniería', 5, 5, 4, 4, 2], ['Selección y caracterización de sensores, materiales, óptica', 4, 4, 4, 3, 3],
    ['Investigación e innovación', 3, 4, 5, 4, 4], ['Comunicación y trabajo en equipo', 5, 5, 3, 4, 3], ['Ética, sociedad y sostenibilidad', 4, 4, 4, 5, 3], ['Aprendizaje autónomo', 4, 4, 4, 4, 4]
  ];
  EM.defineSim('priorizacion', function (sim) {
    sim.below(); sim.side.style.gridTemplateColumns = 'minmax(0, 1fr)';
    const cv = sim.canvas({ aspect: 1.5, label: 'Importancia frente a preparación percibida' });
    const rows = H.get('pri', PRI0);
    const G = ['Empleadores', 'Egresados', 'Profesores', 'Estudiantes'];
    sim.group('Datos de ejemplo');
    sim.note('Los valores iniciales son <b>ficticios</b>: reemplácelos con los de sus encuestas o talleres. Escala 1 a 5. Cada fila: importancia según cada grupo y preparación percibida de los egresados.');
    const tw = el('div', 'tablewrap h-pri');
    let h = '<table class="h-mat"><tr><th>Competencia candidata</th>' + G.map((g) => `<th>${g}</th>`).join('') + '<th>Preparación</th><th>Brecha</th></tr>';
    rows.forEach((r, i) => { h += `<tr><td class="l">${H.esc(r[0])}</td>` + [1, 2, 3, 4, 5].map((c) => `<td><input class="num" type="number" min="1" max="5" step="1" value="${r[c]}" data-i="${i}" data-c="${c}" aria-label="${H.esc(r[0])}, ${c < 5 ? G[c - 1] : 'preparación'}"></td>`).join('') + `<td class="brecha" data-b="${i}"></td></tr>`; });
    tw.innerHTML = h + '</table>';
    sim.ctrlBox.append(tw);
    const imp = (r) => (r[1] + r[2] + r[3] + r[4]) / 4;
    const upd = () => { rows.forEach((r, i) => { const b = tw.querySelector(`[data-b="${i}"]`); const g = imp(r) - r[5]; b.textContent = g.toFixed(2).replace('.', ','); b.className = 'brecha ' + (g >= 1 ? 'bad' : g >= 0.5 ? 'mid' : 'ok'); }); H.set('pri', rows); sim.redraw(); };
    tw.addEventListener('input', (e) => { const t = e.target; if (t.dataset.i === undefined) return; rows[+t.dataset.i][+t.dataset.c] = Math.max(1, Math.min(5, +t.value || 1)); upd(); });
    sim.out('top', 'Mayor brecha', { hl: true }); sim.out('gr', 'Competencias con importancia ≥ 4 y brecha ≥ 1', {});
    sim.onDraw(() => {
      const { ctx, w, h: hh } = cv;
      ctx.clearRect(0, 0, w, hh); ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, hh);
      const L = 56, R = 16, T = 18, B = 44, pw = w - L - R, ph = hh - T - B;
      const X = (v) => L + ((v - 1) / 4) * pw, Y = (v) => T + ph - ((v - 1) / 4) * ph;
      ctx.fillStyle = EM.alpha('--c2', 0.1); ctx.fillRect(X(3.5), Y(5), X(5) - X(3.5), Y(3) - Y(5)); /* importante y poco logrado */
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1; ctx.fillStyle = EM.col('--ink-3'); ctx.font = H.fontUI(11, 500); ctx.textAlign = 'center';
      for (let v = 1; v <= 5; v++) { ctx.beginPath(); ctx.moveTo(X(v), T); ctx.lineTo(X(v), T + ph); ctx.moveTo(L, Y(v)); ctx.lineTo(L + pw, Y(v)); ctx.stroke(); ctx.fillText(v, X(v), T + ph + 14); ctx.textAlign = 'right'; ctx.fillText(v, L - 6, Y(v) + 4); ctx.textAlign = 'center'; }
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillText('Importancia (promedio de los grupos)', L + pw / 2, hh - 8);
      ctx.save(); ctx.translate(14, T + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Preparación percibida de los egresados', 0, 0); ctx.restore();
      ctx.strokeStyle = EM.col('--axis'); ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X(1), Y(1)); ctx.lineTo(X(5), Y(5)); ctx.stroke(); ctx.setLineDash([]);
      rows.forEach((r, i) => {
        const x = X(imp(r)), y = Y(r[5]), gap = imp(r) - r[5];
        ctx.beginPath(); ctx.arc(x, y, 9, 0, 2 * Math.PI); ctx.fillStyle = gap >= 1 ? EM.col('--c2') : gap >= 0.5 ? EM.col('--gold') : EM.col('--c3'); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = H.fontUI(10, 700); ctx.textAlign = 'center'; ctx.fillText(i + 1, x, y + 3.5);
      });
      ctx.fillStyle = EM.col('--c2'); ctx.font = H.fontUI(11, 600); ctx.textAlign = 'right'; ctx.fillText('Zona de prioridad', X(5) - 6, Y(5) + 14);
      const gaps = rows.map((r, i) => [imp(r) - r[5], i]).sort((a, b) => b[0] - a[0]);
      sim.set('top', `${gaps[0][1] + 1}. ${H.esc(rows[gaps[0][1]][0])} (${gaps[0][0].toFixed(2).replace('.', ',')})`);
      sim.set('gr', rows.map((r, i) => [r, i]).filter(([r]) => imp(r) >= 4 && imp(r) - r[5] >= 1).map(([, i]) => i + 1).join(', ') || 'ninguna');
    });
    upd();
  });

  /* ---------- Editor de los resultados de aprendizaje del programa ---------- */
  EM.defineSim('editor-ra', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    let ras = H.get('ras', H.RA0), snap = null;
    const save = () => { H.set('ras', ras); H.emit('ras'); };
    const bar = el('div', 'ctrl-row');
    H.btn(bar, 'Agregar resultado', () => { ras.push({ c: 'RA' + (ras.length + 1), t: '', ind: [''] }); save(); draw(); }, 'primary');
    const cargar = (arr, tag) => { snap = JSON.stringify(ras); ras = JSON.parse(JSON.stringify(arr)); H.set('raset', tag); ['cursos', 'plan', 'logro'].forEach((k) => H.set(k, null)); save(); draw(); };
    H.btn(bar, 'Cargar los tres resultados vigentes del programa', () => cargar(H.RA0, 'real'));
    H.btn(bar, 'Cargar la propuesta ampliada de nueve', () => cargar(H.RA_PROP, 'prop'));
    const undo = H.btn(bar, 'Deshacer el último cambio grande', () => { if (snap) { ras = JSON.parse(snap); snap = null; save(); draw(); } });
    panel.append(bar);
    const list = el('div', 'h-ras'); panel.append(list);
    const sum = el('div', 'h-res'); panel.append(sum);
    const exp = H.salida(panel);
    function draw() {
      list.innerHTML = '';
      ras.forEach((r, i) => {
        const a = A.analizar(r.t);
        const card = el('article', 'h-ra');
        card.innerHTML = `<header><b>${H.esc(r.c)}</b><span class="h-score mini ${a.puntaje >= 75 ? 'good' : a.puntaje >= 50 ? 'mid' : 'bad'}" title="Puntaje de forma">${a.puntaje}</span><span class="chip">${a.nivelNombre ? a.nivel + '. ' + a.nivelNombre : 'verbo no reconocido'}</span></header>`;
        const t = H.input(card, { label: 'Resultado de aprendizaje del programa', rows: 3, value: r.t, onInput: (v) => { r.t = v; H.set('ras', ras); const b = A.analizar(v); const sc = card.querySelector('.h-score'); sc.textContent = b.puntaje; sc.className = 'h-score mini ' + (b.puntaje >= 75 ? 'good' : b.puntaje >= 50 ? 'mid' : 'bad'); card.querySelector('.chip').textContent = b.nivelNombre ? b.nivel + '. ' + b.nivelNombre : 'verbo no reconocido'; resume(); } });
        H.input(card, { label: 'Indicadores de desempeño (uno por línea)', rows: 3, value: r.ind.join('\n'), onInput: (v) => { r.ind = v.split('\n'); H.set('ras', ras); resume(); } });
        H.btn(card, 'Quitar', () => { snap = JSON.stringify(ras); ras.splice(i, 1); ras.forEach((x, k) => { if (/^RA\d+$/.test(x.c)) x.c = 'RA' + (k + 1); }); save(); draw(); }, 'small');
        list.append(card);
      });
      resume();
    }
    function resume() {
      const an = ras.map((r) => A.analizar(r.t));
      const niv = [0, 0, 0, 0, 0, 0, 0];
      an.forEach((a) => { niv[a.nivel || 0]++; });
      const bajos = an.map((a, i) => [a, i]).filter(([a]) => a.puntaje < 75).map(([, i]) => ras[i].c);
      const n = ras.length;
      sum.innerHTML = `<p><b>${n} resultados.</b> ${n < 6 ? 'Pocos (lo habitual son de 6 a 10). No es un defecto si son amplios, pero cada uno necesitará varios indicadores de desempeño.' : n > 10 ? 'Muchos: difíciles de evaluar de forma sistemática. Considere agruparlos.' : 'Cantidad manejable (la práctica habitual es de 6 a 10).'}</p><p>Niveles: ${A.NIVELES.map((nm, k) => `${nm} ${niv[k + 1]}`).join(' · ')}${niv[0] ? ` · sin verbo reconocido ${niv[0]}` : ''}.</p>` +
        (bajos.length ? `<p class="ctrl-note">Revisar la formulación de: ${bajos.join(', ')}.</p>` : '<p class="ctrl-note">Todos superan 75 puntos de forma.</p>');
      exp.set(ras.map((r) => `${r.c}. ${r.t}\n` + r.ind.filter(Boolean).map((x, k) => `   ${r.c}.${k + 1} ${x}`).join('\n')).join('\n\n'));
    }
    draw();
    undo.title = 'Recupera el estado anterior a quitar un resultado o cargar el ejemplo';
  });
})();
