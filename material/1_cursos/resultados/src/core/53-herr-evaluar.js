/* ===================================================================
   43-herr-evaluar.js — matriz curricular, créditos, plan de evidencias, muestreo, rúbrica,
   concordancia (kappa), tablero de logro, simulador del ciclo de mejora
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const el = EM.el;
  const H = EM.H;
  const A = EM.calc.ra;

  /* ---------- Matriz curricular: curso × resultado ---------- */
  const NEXT = { '': 'I', I: 'R', R: 'M', M: '' };
  EM.defineSim('matriz', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    let ras = H.get('ras', H.RA0);
    let cursos = H.get('cursos', H.cursosDe(H.CURSOS0));
    const fit = () => cursos.forEach((c) => { while (c.m.length < ras.length) c.m.push(''); c.m.length = ras.length; });
    const save = () => H.set('cursos', cursos);
    const bar = el('div', 'ctrl-row');
    H.btn(bar, 'Cargar el plan vigente (con marcas de ejemplo)', () => { ras = H.get('ras', H.RA0); cursos = H.cursosDe(H.CURSOS0); save(); draw(); }, 'primary');
    H.btn(bar, 'Vaciar la matriz', () => { cursos.forEach((c) => c.m.fill('')); save(); draw(); });
    const nombre = H.input(bar, { label: '', ph: 'Nombre de un curso nuevo', aria: 'Nombre del curso nuevo', value: '' });
    const sem = H.input(bar, { label: '', type: 'number', min: 1, max: 12, value: 5, aria: 'Semestre del curso nuevo' });
    H.btn(bar, 'Agregar curso', () => { if (!nombre.value.trim()) return; cursos.push({ n: nombre.value.trim(), sem: +sem.value || 1, m: Array(ras.length).fill(''), cr: 3 }); cursos.sort((a, b) => a.sem - b.sem); nombre.value = ''; save(); draw(); });
    panel.append(bar);
    panel.append(el('p', 'ctrl-note', 'Haga clic en una celda para recorrer: <b>I</b> introduce · <b>R</b> refuerza · <b>M</b> domina (con evidencia que se guarda) · vacío. Los cursos, semestres y créditos vienen de la tabla del plan de estudios del informe de autoevaluación y de la ficha del programa (suman 165 créditos). Las marcas I, R, M son <b>ilustrativas</b>: ninguno de los microcurrículos revisados declara resultados de aprendizaje, así que la relación real está por construir. Con los tres resultados vigentes, las marcas se derivan de una propuesta ampliada de nueve.'));
    const tw = el('div', 'tablewrap h-big-table'); panel.append(tw);
    const res = el('div', 'h-res'); panel.append(res);
    function draw() {
      fit();
      let h = '<table class="h-mat"><thead><tr><th class="l">Semestre · curso</th>' + ras.map((r) => `<th title="${H.esc(r.t)}">${H.esc(r.c)}</th>`).join('') + '<th>RA</th><th></th></tr></thead><tbody>';
      cursos.forEach((c, i) => {
        const n = c.m.filter(Boolean).length;
        h += `<tr><td class="l"><span class="sem" title="Semestre">${c.sem}</span> ${H.esc(c.n)} <small class="cr">${c.cr || ''}${c.cr ? ' cr' : ''}</small></td>` + c.m.map((v, j) => `<td><button type="button" class="cell m${v}" data-i="${i}" data-j="${j}" aria-label="${H.esc(c.n)}, ${H.esc(ras[j].c)}: ${v || 'vacío'}">${v}</button></td>`).join('') + `<td class="${n > 4 ? 'bad' : ''}">${n}</td><td><button type="button" class="x" data-del="${i}" aria-label="Quitar ${H.esc(c.n)}">×</button></td></tr>`;
      });
      const an = A.analizarMatriz(cursos, ras.length, cursos.map((c) => c.m));
      h += '</tbody><tfoot><tr><th class="l">I / R / M por resultado</th>' + an.porRA.map((r) => `<th class="${r.ok ? 'ok' : r.total ? 'mid' : 'bad'}">${r.cnt.I}/${r.cnt.R}/${r.cnt.M}</th>`).join('') + '<th></th><th></th></tr></tfoot></table>';
      tw.innerHTML = h;
      tw.querySelectorAll('.cell').forEach((b) => b.addEventListener('click', () => { const c = cursos[+b.dataset.i]; const j = +b.dataset.j; c.m[j] = NEXT[c.m[j]]; save(); draw(); }));
      tw.querySelectorAll('.x').forEach((b) => b.addEventListener('click', () => { cursos.splice(+b.dataset.del, 1); save(); draw(); }));
      const sobre = an.porCurso.map((c, i) => [c, i]).filter(([c]) => c.sobrecarga).map(([, i]) => cursos[i].n);
      const crT = cursos.reduce((a, c) => a + (c.cr || 0), 0);
      res.innerHTML = `<p><b>Cobertura:</b> ${H.pct(an.cobertura)} de los resultados tienen algún curso asociado. <b>Créditos en la matriz:</b> ${crT}.</p>` +
        (an.avisos.length ? '<ul class="h-chk">' + an.avisos.map(([r, p]) => `<li class="no"><span aria-hidden="true">!</span> <b>${r}</b>: ${H.esc(p)}</li>`).join('') + '</ul>' : '<p class="ctrl-note">Sin alertas de secuencia.</p>') +
        (sobre.length ? `<p class="ctrl-note">Cursos que cargan más de 4 resultados (¿realmente se evalúan todos?): ${sobre.map(H.esc).join(', ')}.</p>` : '');
    }
    H.on('ras', () => { ras = H.get('ras', H.RA0); draw(); });
    draw();
  });

  /* ---------- Calculadora de créditos y horas ---------- */
  EM.defineSim('credito', function (sim) {
    sim.group('Estructura semanal de una asignatura');
    sim.slider('hd', { label: 'Horas semanales con el profesor', min: 1, max: 12, step: 1, value: 6, fmt: (v) => String(v), unit: 'h' });
    sim.slider('hi', { label: 'Horas semanales de trabajo independiente', min: 0, max: 24, step: 1, value: 3, fmt: (v) => String(v), unit: 'h' });
    sim.slider('sm', { label: 'Semanas del periodo académico', min: 12, max: 20, step: 1, value: 16, fmt: (v) => String(v), unit: 'sem.' });
    sim.group('Plan de estudios');
    sim.slider('cr', { label: 'Créditos totales del programa', min: 100, max: 220, step: 1, value: 165, fmt: (v) => String(v) });
    sim.slider('ns', { label: 'Semestres', min: 6, max: 12, step: 1, value: 10, fmt: (v) => String(v) });
    sim.note('Decreto 1330 de 2019, art. 2.5.3.2.4.1: un crédito equivale a 48 horas por periodo académico (en la Universidad, Acuerdo Superior 014 de 2014). Según la presentación del programa, una asignatura de 3 créditos tiene 6 horas semanales con el profesor y 3 de trabajo autónomo (33 %); una de 4 créditos, 6 y 6 (50 %). Los valores iniciales de esta calculadora son los de 3 créditos.');
    sim.out('h', 'Horas totales de la asignatura'); sim.out('cx', 'Créditos (valor exacto)'); sim.out('c', 'Créditos (entero, como exige la norma)', { hl: true }); sim.out('p', 'Proporción profesor : independiente');
    sim.outSep('Plan de estudios');
    sim.out('tot', 'Horas totales del programa'); sim.out('sem', 'Créditos por semestre'); sim.out('sem2', 'Dedicación semanal total (semestre de 16 sem.)', { hl: true });
    const cv = sim.canvas({ aspect: 2.4, label: 'Barra de horas con el profesor y trabajo independiente' });
    sim.onDraw(() => {
      const { ctx, w, h } = cv, p = sim.p;
      const sm = p.sm, hd = p.hd * sm, hi = p.hi * sm, tot = hd + hi, cr = A.creditos(hd, hi);
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, h);
      const x0 = 20, bw = w - 40, y = h * 0.28, bh = h * 0.28;
      const ex = tot / A.HORAS_CREDITO;
      ctx.fillStyle = EM.col('--c1'); ctx.fillRect(x0, y, bw * (hd / tot), bh);
      ctx.fillStyle = EM.col('--c3'); ctx.fillRect(x0 + bw * (hd / tot), y, bw * (hi / tot), bh);
      ctx.fillStyle = '#fff'; ctx.font = H.fontUI(12, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (bw * (hd / tot) > 70) ctx.fillText(`${hd} h con el profesor`, x0 + (bw * (hd / tot)) / 2, y + bh / 2);
      if (bw * (hi / tot) > 70) ctx.fillText(`${hi} h independientes`, x0 + bw * (hd / tot) + (bw * (hi / tot)) / 2, y + bh / 2);
      /* marcas de crédito cada 48 h */
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1; ctx.fillStyle = EM.col('--ink-2'); ctx.font = H.fontUI(10.5, 500); ctx.textBaseline = 'alphabetic';
      for (let k = 1; k <= Math.floor(ex); k++) { const xx = x0 + (bw * k * A.HORAS_CREDITO) / tot; ctx.beginPath(); ctx.moveTo(xx, y + bh); ctx.lineTo(xx, y + bh + 10); ctx.stroke(); ctx.fillText(k, xx, y + bh + 22); }
      ctx.fillStyle = EM.col('--ink'); ctx.font = H.fontUI(13, 700); ctx.textAlign = 'left';
      ctx.fillText(`${tot} h = ${EM.fix(ex, 2)} créditos → ${cr} crédito${cr === 1 ? '' : 's'}`, x0, h * 0.82);
      sim.set('h', tot + ' h'); sim.set('cx', EM.fix(ex, 2)); sim.set('c', String(cr)); sim.set('p', `1 : ${hi && hd ? EM.fix(hi / hd, 1) : '—'}`);
      const totalP = p.cr * A.HORAS_CREDITO; const cs = p.cr / p.ns;
      sim.set('tot', totalP.toLocaleString('es-CO') + ' h'); sim.set('sem', EM.fix(cs, 1)); sim.set('sem2', EM.fix((cs * A.HORAS_CREDITO) / 16, 1) + ' h/sem');
    });
  });

  /* ---------- Plan de evidencias ---------- */
  const INSTR = [['Examen escrito', 'D'], ['Proyecto de diseño', 'D'], ['Informe de laboratorio', 'D'], ['Portafolio', 'D'], ['Presentación oral', 'D'], ['Práctica o pasantía', 'D'], ['Trabajo de grado', 'D'], ['Prueba Saber Pro (módulo)', 'D'], ['Encuesta a egresados', 'I'], ['Encuesta a empleadores', 'I'], ['Autoevaluación del estudiante', 'I'], ['Grupo focal', 'I']];
  const MOM = ['Inicial (semestres 1-3)', 'Intermedio (4-7)', 'Final (8-10)', 'Egreso o posterior'];
  const PLAN0 = [
    { ra: 'RA1', curso: 'Mecánica y Electromagnetismo', mom: 0, ins: 0, meta: 70, resp: 'Profesores de los cursos' },
    { ra: 'RA1', curso: 'Introducción a la Mecánica Cuántica', mom: 1, ins: 0, meta: 70, resp: 'Profesor del curso' },
    { ra: 'RA2', curso: 'Taller de Ingeniería Física', mom: 1, ins: 1, meta: 75, resp: 'Profesores del taller' },
    { ra: 'RA2', curso: 'Trabajo de Grado II', mom: 2, ins: 6, meta: 80, resp: 'Comité de Programa' },
    { ra: 'RA3', curso: 'Trabajo de Grado II (modalidad pasantía)', mom: 2, ins: 6, meta: 80, resp: 'Comité de Programa' },
    { ra: 'RA3', curso: '—', mom: 3, ins: 8, meta: 70, resp: 'Coordinación y egresados' }
  ];
  EM.defineSim('planificador', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    let ras = H.get('ras', H.RA0), plan = H.get('plan', PLAN0);
    const save = () => { H.set('plan', plan); resume(); };
    const bar = el('div', 'ctrl-row');
    H.btn(bar, 'Agregar evidencia', () => { plan.push({ ra: ras[0].c, curso: '', mom: 1, ins: 0, meta: 70, resp: '' }); H.set('plan', plan); draw(); }, 'primary');
    H.btn(bar, 'Cargar el ejemplo', () => { plan = JSON.parse(JSON.stringify(PLAN0)); H.set('plan', plan); draw(); });
    panel.append(bar);
    const tw = el('div', 'tablewrap'); panel.append(tw);
    const res = el('div', 'h-res'); panel.append(res);
    const exp = H.salida(panel);
    function draw() {
      ras = H.get('ras', H.RA0);
      let h = '<table class="h-mat h-plan"><thead><tr><th>RA</th><th>Asignatura o fuente</th><th>Momento</th><th>Instrumento</th><th>Tipo</th><th>Meta (% en nivel ≥ 3)</th><th>Responsable</th><th></th></tr></thead><tbody>';
      plan.forEach((p, i) => {
        h += `<tr><td><select data-i="${i}" data-k="ra">${ras.map((r) => `<option${r.c === p.ra ? ' selected' : ''}>${H.esc(r.c)}</option>`).join('')}</select></td><td><input data-i="${i}" data-k="curso" value="${H.esc(p.curso)}"></td><td><select data-i="${i}" data-k="mom">${MOM.map((m, k) => `<option value="${k}"${k === p.mom ? ' selected' : ''}>${m}</option>`).join('')}</select></td><td><select data-i="${i}" data-k="ins">${INSTR.map((m, k) => `<option value="${k}"${k === p.ins ? ' selected' : ''}>${m[0]}</option>`).join('')}</select></td><td class="tipo">${INSTR[p.ins][1] === 'D' ? 'directa' : 'indirecta'}</td><td><input class="num" type="number" min="0" max="100" data-i="${i}" data-k="meta" value="${p.meta}"></td><td><input data-i="${i}" data-k="resp" value="${H.esc(p.resp)}"></td><td><button type="button" class="x" data-del="${i}" aria-label="Quitar fila">×</button></td></tr>`;
      });
      tw.innerHTML = h + '</tbody></table>';
      tw.querySelectorAll('[data-k]').forEach((e) => e.addEventListener(e.tagName === 'SELECT' ? 'change' : 'input', () => { const p = plan[+e.dataset.i], k = e.dataset.k; p[k] = ['mom', 'ins', 'meta'].includes(k) ? +e.value : e.value; if (k === 'ins') tw.querySelectorAll('.tipo')[+e.dataset.i].textContent = INSTR[p.ins][1] === 'D' ? 'directa' : 'indirecta'; save(); }));
      tw.querySelectorAll('.x').forEach((b) => b.addEventListener('click', () => { plan.splice(+b.dataset.del, 1); H.set('plan', plan); draw(); }));
      resume();
    }
    function resume() {
      const rows = ras.map((r) => {
        const ps = plan.filter((p) => p.ra === r.c);
        const dir = ps.filter((p) => INSTR[p.ins][1] === 'D'), ind = ps.filter((p) => INSTR[p.ins][1] === 'I');
        const moms = new Set(dir.map((p) => p.mom));
        const pr = [];
        if (!dir.length) pr.push('sin evidencia directa');
        else {
          if (dir.length < 2) pr.push('una sola evidencia directa');
          if (moms.size < 2) pr.push('evidencia en un solo momento del plan');
          if (!moms.has(2) && !moms.has(3)) pr.push('nada cerca del egreso');
        }
        if (!ind.length) pr.push('sin evidencia indirecta (percepciones)');
        return { r: r.c, d: dir.length, i: ind.length, pr };
      });
      res.innerHTML = '<div class="tablewrap"><table class="h-mat"><tr><th>RA</th><th>Directas</th><th>Indirectas</th><th class="l">Observaciones</th></tr>' + rows.map((x) => `<tr><td>${x.r}</td><td>${x.d}</td><td>${x.i}</td><td class="l ${x.pr.length ? 'mid' : 'ok'}">${x.pr.length ? H.esc(x.pr.join('; ')) : 'plan consistente'}</td></tr>`).join('') + '</table></div>' +
        '<p class="ctrl-note">Regla práctica: por cada resultado, al menos dos evidencias directas en momentos distintos del plan, una de ellas cerca del egreso, y una evidencia indirecta que las contraste.</p>';
      exp.set(H.csv([['RA', 'Asignatura o fuente', 'Momento', 'Instrumento', 'Tipo', 'Meta %', 'Responsable']].concat(plan.map((p) => [p.ra, p.curso, MOM[p.mom], INSTR[p.ins][0], INSTR[p.ins][1] === 'D' ? 'directa' : 'indirecta', p.meta, p.resp]))));
    }
    H.on('ras', draw);
    draw();
  });

  /* ---------- Muestreo de evidencias ---------- */
  EM.defineSim('muestreo', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Tamaño de muestra frente al tamaño de la población' });
    sim.group('¿Cuántos trabajos hay que revisar?');
    sim.slider('N', { label: 'Estudiantes de la cohorte (población)', min: 10, max: 600, step: 1, value: 60, fmt: (v) => String(Math.round(v)) });
    sim.slider('e', { label: 'Margen de error aceptado', min: 0.03, max: 0.25, step: 0.01, value: 0.1, fmt: (v) => Math.round(v * 100) + ' %' });
    sim.select('conf', { label: 'Confianza', options: [[0.8, '80 %'], [0.9, '90 %'], [0.95, '95 %'], [0.99, '99 %']], value: 0.9 });
    sim.group('Intervalo para el logro observado');
    sim.slider('x', { label: 'Estudiantes que alcanzaron el nivel meta', min: 0, max: 100, step: 1, value: 20, fmt: (v) => String(Math.round(v)) });
    sim.note('Si revisa una muestra de n trabajos y x alcanzan la meta, el intervalo de Wilson indica el rango plausible del logro en toda la cohorte.');
    sim.out('n', 'Tamaño de muestra necesario', { hl: true }); sim.out('f', 'Fracción de la cohorte'); sim.out('x', 'Logro observado en la muestra'); sim.out('w', 'Intervalo de Wilson');
    sim.onChange = () => { sim.ctl.x.range(0, A.tamMuestra(sim.p.N, sim.p.e, +sim.p.conf), 1); if (sim.p.x > A.tamMuestra(sim.p.N, sim.p.e, +sim.p.conf)) sim.ctl.x.set(A.tamMuestra(sim.p.N, sim.p.e, +sim.p.conf), true); };
    sim.onDraw(() => {
      const { ctx, w, h } = cv, p = sim.p, conf = +p.conf;
      const n = A.tamMuestra(Math.round(p.N), p.e, conf);
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, h);
      const L = 46, R = 14, T = 16, B = 40, pw = w - L - R, ph = h - T - B;
      const X = (v) => L + ((v - 10) / 590) * pw, Y = (v) => T + ph - (v / 600) * ph;
      ctx.strokeStyle = EM.col('--grid-2'); ctx.fillStyle = EM.col('--ink-3'); ctx.font = H.fontUI(11, 500);
      for (let v = 0; v <= 600; v += 100) { ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(L + pw, Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(v, L - 6, Y(v) + 4); ctx.textAlign = 'center'; ctx.fillText(v, X(Math.max(10, v)), T + ph + 14); }
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillText('Estudiantes en la cohorte', L + pw / 2, h - 6);
      const ser = [[0.05, '--c2', 'e = 5 %'], [0.1, '--c1', 'e = 10 %'], [0.2, '--c3', 'e = 20 %']];
      ser.forEach(([e, c, lab], k) => {
        ctx.strokeStyle = EM.col(c); ctx.lineWidth = 2; ctx.beginPath();
        for (let N = 10; N <= 600; N += 5) { const y = Y(A.tamMuestra(N, e, conf)); if (N === 10) ctx.moveTo(X(N), y); else ctx.lineTo(X(N), y); }
        ctx.stroke(); ctx.fillStyle = EM.col(c); ctx.textAlign = 'right'; ctx.fillText(lab, X(600) - 4, Y(A.tamMuestra(600, e, conf)) - 6 - (k === 0 ? 0 : 0));
      });
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(X(p.N), Y(n), 6, 0, 2 * Math.PI); ctx.fill();
      ctx.textAlign = 'left'; ctx.fillText(`n = ${n}`, X(p.N) + 9, Y(n) - 6);
      const x = Math.min(Math.round(p.x), n), wi = A.wilson(x, n, conf);
      sim.set('n', `${n} de ${Math.round(p.N)}`); sim.set('f', H.pct(n / p.N)); sim.set('x', `${x} de ${n} (${H.pct(n ? x / n : 0)})`);
      sim.set('w', `${H.pct(wi[0])} a ${H.pct(wi[1])}`);
    });
  });

  /* ---------- Rúbrica analítica ---------- */
  const NIV = ['Inicial', 'En desarrollo', 'Logrado', 'Sobresaliente'];
  const RUB0 = [
    { c: 'Procedimiento de medición', w: 25, d: ['No define un procedimiento reproducible.', 'Describe el procedimiento pero omite pasos o controles.', 'Procedimiento completo y adecuado a la exactitud requerida.', 'Procedimiento completo, optimizado y justificado frente a alternativas.'] },
    { c: 'Incertidumbre', w: 35, d: ['No estima la incertidumbre.', 'Estima solo la incertidumbre del instrumento.', 'Combina las fuentes principales con un método correcto.', 'Identifica y cuantifica todas las fuentes relevantes y justifica las que descarta.'] },
    { c: 'Análisis e interpretación', w: 25, d: ['Reporta datos sin analizarlos.', 'Analiza, pero con errores de método o de interpretación.', 'Analiza correctamente y concluye con base en los datos.', 'Analiza con criterio de ingeniería, reconoce limitaciones y propone mejoras.'] },
    { c: 'Trazabilidad y documentación', w: 15, d: ['Datos incompletos o inconsistentes.', 'Registro parcial; otra persona no podría repetirlo.', 'Registro completo y ordenado.', 'Registro con metadatos y referencias a patrones trazables.'] }
  ];
  EM.defineSim('rubrica', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    let rub = H.get('rubrica', RUB0);
    const sel = rub.map(() => 3);
    const save = () => { H.set('rubrica', rub); resume(); };
    const bar = el('div', 'ctrl-row');
    H.btn(bar, 'Agregar criterio', () => { rub.push({ c: 'Nuevo criterio', w: 10, d: ['', '', '', ''] }); sel.push(3); H.set('rubrica', rub); draw(); }, 'primary');
    H.btn(bar, 'Cargar la rúbrica de ejemplo (RA3, medición)', () => { rub = JSON.parse(JSON.stringify(RUB0)); sel.length = 0; rub.forEach(() => sel.push(3)); H.set('rubrica', rub); draw(); });
    panel.append(bar);
    const tw = el('div', 'tablewrap'); panel.append(tw);
    const res = el('div', 'h-res'); panel.append(res);
    const exp = H.salida(panel);
    function draw() {
      let h = '<table class="h-mat h-rub"><thead><tr><th class="l">Criterio</th><th>Peso %</th>' + NIV.map((n, k) => `<th>${k + 1}. ${n}</th>`).join('') + '<th>Califica</th><th></th></tr></thead><tbody>';
      rub.forEach((r, i) => {
        h += `<tr><td><input data-i="${i}" data-k="c" value="${H.esc(r.c)}" aria-label="Criterio"></td><td><input class="num" type="number" min="0" max="100" data-i="${i}" data-k="w" value="${r.w}" aria-label="Peso"></td>` + r.d.map((d, k) => `<td><textarea rows="4" data-i="${i}" data-k="d${k}" aria-label="Descriptor nivel ${k + 1}">${H.esc(d)}</textarea></td>`).join('') + `<td><select data-i="${i}" data-k="s" aria-label="Nivel obtenido">${NIV.map((n, k) => `<option value="${k + 1}"${sel[i] === k + 1 ? ' selected' : ''}>${k + 1}</option>`).join('')}</select></td><td><button type="button" class="x" data-del="${i}" aria-label="Quitar criterio">×</button></td></tr>`;
      });
      tw.innerHTML = h + '</tbody></table>';
      tw.querySelectorAll('[data-k]').forEach((e) => e.addEventListener(e.tagName === 'SELECT' ? 'change' : 'input', () => {
        const i = +e.dataset.i, k = e.dataset.k;
        if (k === 's') sel[i] = +e.value; else if (k === 'c') rub[i].c = e.value; else if (k === 'w') rub[i].w = +e.value || 0; else rub[i].d[+k.slice(1)] = e.value;
        save();
      }));
      tw.querySelectorAll('.x').forEach((b) => b.addEventListener('click', () => { rub.splice(+b.dataset.del, 1); sel.splice(+b.dataset.del, 1); H.set('rubrica', rub); draw(); }));
      resume();
    }
    function resume() {
      const sw = rub.reduce((a, r) => a + r.w, 0);
      const prom = sw ? rub.reduce((a, r, i) => a + r.w * sel[i], 0) / sw : 0;
      const eq = ((prom - 1) / 3) * 5;
      const vacios = rub.filter((r) => r.d.some((d) => !d.trim())).length;
      res.innerHTML = `<p><b>Pesos: ${sw} %</b> ${sw === 100 ? '' : '(deben sumar 100)'} · <b>Nivel ponderado:</b> ${EM.fix(prom, 2)} de 4 (${NIV[Math.min(3, Math.max(0, Math.round(prom) - 1))] || '—'}) · <b>Equivalente lineal en escala 0 a 5:</b> ${EM.fix(eq, 1)}.</p>` +
        (vacios ? `<p class="ctrl-note">${vacios} criterio(s) con descriptores sin completar.</p>` : '') +
        '<p class="ctrl-note">La conversión a nota depende del reglamento de la institución. Para el análisis de logro del programa, es más útil conservar el nivel (1 a 4) por criterio que la nota.</p>';
      exp.set(rub.map((r) => `${r.c} (${r.w} %)\n` + r.d.map((d, k) => `  ${k + 1}. ${NIV[k]}: ${d}`).join('\n')).join('\n\n'));
    }
    draw();
  });

  /* ---------- Concordancia entre evaluadores ---------- */
  const KAP0 = [[20, 5, 1, 0], [4, 18, 6, 1], [1, 5, 15, 4], [0, 1, 3, 16]];
  EM.defineSim('kappa', function (sim) {
    const cv = sim.canvas({ aspect: 1.1, label: 'Matriz de concordancia entre dos evaluadores' });
    let M = H.get('kappa', KAP0);
    sim.group('Dos evaluadores califican los mismos trabajos');
    sim.note('Filas: nivel que asignó el evaluador A (1 a 4). Columnas: el que asignó B. La diagonal son los acuerdos.');
    const tw = el('div', 'h-kgrid');
    let h = '<table class="h-mat"><tr><th></th>' + [1, 2, 3, 4].map((j) => `<th>B${j}</th>`).join('') + '</tr>';
    for (let i = 0; i < 4; i++) h += `<tr><th>A${i + 1}</th>` + [0, 1, 2, 3].map((j) => `<td><input class="num" type="number" min="0" max="999" value="${M[i][j]}" data-i="${i}" data-j="${j}" aria-label="A${i + 1}, B${j + 1}"></td>`).join('') + '</tr>';
    tw.innerHTML = h + '</table>';
    sim.ctrlBox.append(tw);
    tw.addEventListener('input', (e) => { const t = e.target; if (t.dataset.i === undefined) return; M[+t.dataset.i][+t.dataset.j] = Math.max(0, Math.floor(+t.value || 0)); H.set('kappa', M); sim.redraw(); });
    const row = el('div', 'ctrl-row');
    const setM = (X) => { M = JSON.parse(JSON.stringify(X)); tw.querySelectorAll('input').forEach((i) => { i.value = M[+i.dataset.i][+i.dataset.j]; }); H.set('kappa', M); sim.redraw(); };
    sim.ctrlBox.append(row);
    H.btn(row, 'Buena concordancia', () => setM(KAP0), 'primary');
    H.btn(row, 'Evaluadores sin calibrar', () => setM([[8, 7, 6, 4], [9, 7, 6, 3], [6, 8, 7, 5], [5, 6, 8, 6]]));
    H.btn(row, 'Por azar', () => setM([[6, 6, 6, 6], [6, 6, 6, 6], [6, 6, 6, 6], [6, 6, 6, 6]]));
    sim.out('n', 'Trabajos revisados'); sim.out('po', 'Acuerdo observado'); sim.out('k', 'κ de Cohen', { hl: true }); sim.out('kw', 'κ ponderado (cuadrático)', { hl: true }); sim.out('i', 'Lectura (Landis y Koch)');
    sim.note('Con niveles ordenados (inicial a sobresaliente), un desacuerdo de un nivel pesa menos que uno de tres: use el κ ponderado. Una referencia habitual para aceptar una rúbrica es κ ≥ 0,6.');
    sim.onDraw(() => {
      const { ctx, w, h: hh } = cv;
      ctx.clearRect(0, 0, w, hh); ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, hh);
      const tot = A.total(M), mx = Math.max(1, ...M.flat());
      const s = Math.min(w, hh) - 70, x0 = 44, y0 = 24, c = s / 4;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const v = M[i][j] / mx;
        ctx.fillStyle = i === j ? EM.alpha('--c3', 0.12 + 0.8 * v) : EM.alpha('--c2', 0.06 + 0.7 * v);
        ctx.fillRect(x0 + j * c, y0 + i * c, c - 2, c - 2);
        ctx.fillStyle = EM.col('--ink'); ctx.font = H.fontUI(13, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(M[i][j], x0 + j * c + c / 2, y0 + i * c + c / 2);
      }
      ctx.fillStyle = EM.col('--ink-2'); ctx.font = H.fontUI(11.5, 600);
      for (let k = 0; k < 4; k++) { ctx.fillText('B' + (k + 1), x0 + k * c + c / 2, y0 - 10); ctx.fillText('A' + (k + 1), x0 - 20, y0 + k * c + c / 2); }
      ctx.textBaseline = 'alphabetic';
      const k = A.kappa(M), kw = A.kappaPonderado(M, 'cuadratico');
      sim.set('n', String(tot)); sim.set('po', H.pct(A.acuerdo(M), 1)); sim.set('k', EM.fix(k, 3)); sim.set('kw', EM.fix(kw, 3)); sim.set('i', 'Concordancia ' + A.interpretaKappa(kw));
    });
  });

  /* ---------- Tablero de logro ---------- */
  EM.defineSim('tablero', function (sim) {
    sim.below(); sim.side.style.gridTemplateColumns = 'minmax(0, 1fr)';
    const cv = sim.canvas({ aspect: 1.35, label: 'Distribución de niveles de desempeño por resultado de aprendizaje' });
    const ras = H.get('ras', H.RA0);
    let D = H.get('logro', null);
    const seedRand = (() => { let s = 11; return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();
    if (!D || D.length !== ras.length) {
      D = ras.map((_, i) => { const base = 0.55 + 0.3 * seedRand() - (i === 3 || i === 6 ? 0.12 : 0); const a = Math.max(0.05, 1 - base) * 0.55, b = Math.max(0.05, 1 - base) * 0.45; const hi = base * 0.3; return { l: [Math.round(a * 100), Math.round(b * 100), Math.round(base * 100 - hi * 100), Math.round(hi * 100)], p1: Math.round((base - 0.12) * 100), p2: Math.round((base - 0.06) * 100) }; });
    }
    sim.group('Meta del programa');
    sim.slider('meta', { label: 'Proporción de estudiantes que debe alcanzar la meta', min: 0.5, max: 0.95, step: 0.05, value: 0.7, fmt: (v) => Math.round(v * 100) + ' %' });
    sim.seg('niv', { label: 'Nivel mínimo aceptable', options: [[2, '2'], [3, '3'], [4, '4']], value: 3 });
    sim.slider('n', { label: 'Estudiantes evaluados (muestra)', min: 10, max: 120, step: 5, value: 40, fmt: (v) => String(Math.round(v)) });
    sim.note('Los porcentajes iniciales son <b>datos ficticios</b> de demostración. Edite cada fila con los datos reales de su rúbrica: porcentaje de estudiantes en cada nivel (1 a 4) y proporción lograda en las dos cohortes anteriores.');
    const tw = el('div', 'tablewrap h-pri');
    let h = '<table class="h-mat"><tr><th>Resultado</th><th>N1 %</th><th>N2 %</th><th>N3 %</th><th>N4 %</th><th>Cohorte −2 %</th><th>Cohorte −1 %</th></tr>';
    ras.forEach((r, i) => { h += `<tr><td class="l" title="${H.esc(r.t)}">${H.esc(r.c)}</td>` + [0, 1, 2, 3].map((k) => `<td><input class="num" type="number" min="0" max="100" value="${D[i].l[k]}" data-i="${i}" data-k="${k}" aria-label="${r.c} nivel ${k + 1}"></td>`).join('') + `<td><input class="num" type="number" min="0" max="100" value="${D[i].p1}" data-i="${i}" data-k="p1" aria-label="${r.c} cohorte −2"></td><td><input class="num" type="number" min="0" max="100" value="${D[i].p2}" data-i="${i}" data-k="p2" aria-label="${r.c} cohorte −1"></td></tr>`; });
    tw.innerHTML = h + '</table>';
    sim.ctrlBox.append(tw);
    tw.addEventListener('input', (e) => { const t = e.target; if (t.dataset.i === undefined) return; const d = D[+t.dataset.i], k = t.dataset.k, v = Math.max(0, Math.min(100, +t.value || 0)); if (k === 'p1' || k === 'p2') d[k] = v; else d.l[+k] = v; H.set('logro', D); sim.redraw(); });
    sim.out('b', 'Resultados con brecha', { hl: true }); sim.out('c', 'Resultados cerca de la meta'); sim.out('o', 'Resultados que cumplen'); sim.out('a', 'Primera acción sugerida');
    sim.onDraw(() => {
      const { ctx, w, h: hh } = cv, p = sim.p, L = 44, R = 70, T = 26, B = 44, rowH = (hh - T - B) / ras.length;
      ctx.clearRect(0, 0, w, hh); ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, hh);
      const pw = w - L - R, cols = ['--c2', '--gold', '--c1', '--c3'];
      ctx.font = H.fontUI(11, 500); ctx.textBaseline = 'middle';
      [0, 25, 50, 75, 100].forEach((v) => { const x = L + (v / 100) * pw; ctx.strokeStyle = EM.col('--grid-2'); ctx.beginPath(); ctx.moveTo(x, T - 4); ctx.lineTo(x, hh - B); ctx.stroke(); ctx.fillStyle = EM.col('--ink-3'); ctx.textAlign = 'center'; ctx.fillText(v + ' %', x, T - 12); });
      const cnt = { brecha: 0, cerca: 0, cumple: 0 }; let peor = null;
      ras.forEach((r, i) => {
        const y = T + i * rowH + rowH * 0.15, bh = rowH * 0.7, d = D[i], tot = d.l.reduce((a, b) => a + b, 0) || 1;
        let x = L;
        d.l.forEach((v, k) => { const ww = (v / tot) * pw; ctx.fillStyle = EM.alpha(cols[k], 0.85); ctx.fillRect(x, y, ww, bh); x += ww; });
        const prop = A.propDesde(d.l, p.niv), st = A.semaforo(prop, p.meta); cnt[st]++;
        if (!peor || prop - p.meta < peor[0]) peor = [prop - p.meta, i];
        ctx.fillStyle = EM.col('--ink'); ctx.textAlign = 'right'; ctx.font = H.fontUI(12, 700); ctx.fillText(r.c, L - 6, y + bh / 2);
        ctx.textAlign = 'left'; ctx.fillStyle = EM.col(H.SEM[st][1]); ctx.font = H.fontUI(12, 700); ctx.fillText(H.pct(prop), L + pw + 8, y + bh / 2 - 5);
        ctx.font = H.fontUI(10, 500); ctx.fillStyle = EM.col('--ink-3');
        const tr = [d.p1, d.p2, Math.round(prop * 100)];
        ctx.fillText(tr[2] > tr[0] ? '↑ mejora' : tr[2] < tr[0] ? '↓ baja' : '→ igual', L + pw + 8, y + bh / 2 + 9);
      });
      const xm = L + (1 - p.meta) * pw; /* a la derecha de este punto debe quedar la proporción ≥ meta, medida desde el final */
      ctx.strokeStyle = EM.col('--ink'); ctx.setLineDash([5, 3]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xm, T - 4); ctx.lineTo(xm, hh - B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = EM.col('--ink'); ctx.textAlign = 'center'; ctx.font = H.fontUI(10.5, 600); ctx.fillText('meta', xm, hh - B + 12);
      const lg = ['N1', 'N2', 'N3', 'N4']; lg.forEach((t, k) => { ctx.fillStyle = EM.alpha(cols[k], 0.85); ctx.fillRect(L + k * 56, hh - 16, 10, 10); ctx.fillStyle = EM.col('--ink-2'); ctx.textAlign = 'left'; ctx.fillText(t, L + k * 56 + 14, hh - 10); });
      sim.set('b', String(cnt.brecha)); sim.set('c', String(cnt.cerca)); sim.set('o', String(cnt.cumple));
      sim.set('a', peor && peor[0] < 0 ? `${ras[peor[1]].c}: antes de cambiar nada, revise si el instrumento mide bien (¿hay concordancia entre evaluadores?), luego busque en qué cursos se introduce y se refuerza.` : 'Todos cumplen: considere subir la exigencia o ampliar el nivel mínimo.');
    });
  });

  /* ---------- Simulador del ciclo de mejora ---------- */
  EM.defineSim('simciclo', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Logro de un resultado de aprendizaje a lo largo de los ciclos de evaluación' });
    sim.group('Un resultado de aprendizaje con brecha');
    sim.slider('a0', { label: 'Logro inicial', min: 0.3, max: 0.8, step: 0.01, value: 0.5, fmt: (v) => Math.round(v * 100) + ' %' });
    sim.slider('meta', { label: 'Meta del programa', min: 0.6, max: 0.95, step: 0.01, value: 0.8, fmt: (v) => Math.round(v * 100) + ' %' });
    sim.slider('ef', { label: 'Eficacia de las acciones de mejora', min: 0.1, max: 0.8, step: 0.05, value: 0.4, fmt: (v) => Math.round(v * 100) + ' % de la brecha por ciclo' });
    sim.slider('nc', { label: 'Ciclos de evaluación', min: 2, max: 10, step: 1, value: 6, fmt: (v) => String(v) });
    sim.slider('ru', { label: 'Variación aleatoria entre cohortes', min: 0, max: 0.12, step: 0.01, value: 0.04, fmt: (v) => '±' + Math.round(v * 50) + ' pts' });
    sim.note('Modelo didáctico: cada ciclo en que se actúa cierra una fracción de la brecha. Si el ciclo está abierto, se mide pero no se cambia nada, y el logro solo fluctúa por azar.');
    sim.out('c1', 'Con ciclo cerrado: logro final', { hl: true }); sim.out('c2', 'Con ciclo abierto: logro final'); sim.out('k', 'Ciclos para alcanzar la meta');
    sim.onDraw(() => {
      const { ctx, w, h } = cv, p = sim.p, nc = Math.round(p.nc);
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, h);
      const L = 46, R = 16, T = 16, B = 38, pw = w - L - R, ph = h - T - B;
      const X = (i) => L + (i / nc) * pw, Y = (v) => T + ph - ((v - 0.2) / 0.8) * ph;
      ctx.font = H.fontUI(11, 500); ctx.textBaseline = 'middle';
      for (let v = 0.2; v <= 1.001; v += 0.2) { ctx.strokeStyle = EM.col('--grid-2'); ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(L + pw, Y(v)); ctx.stroke(); ctx.fillStyle = EM.col('--ink-3'); ctx.textAlign = 'right'; ctx.fillText(Math.round(v * 100) + ' %', L - 6, Y(v)); }
      ctx.textAlign = 'center'; for (let i = 0; i <= nc; i++) ctx.fillText(i, X(i), T + ph + 14);
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillText('Ciclo de evaluación', L + pw / 2, h - 8);
      ctx.strokeStyle = EM.col('--ink'); ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(L, Y(p.meta)); ctx.lineTo(L + pw, Y(p.meta)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = EM.col('--ink'); ctx.textAlign = 'left'; ctx.fillText('meta', L + 6, Y(p.meta) - 9);
      const sc = A.simCiclo(p.a0, p.meta, p.ef, nc, true, p.ru, 3), so = A.simCiclo(p.a0, p.meta, p.ef, nc, false, p.ru, 3);
      [[so, '--c2', 'ciclo abierto'], [sc, '--c3', 'ciclo cerrado']].forEach(([s, c, lab]) => {
        ctx.strokeStyle = EM.col(c); ctx.lineWidth = 2.5; ctx.beginPath(); s.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
        ctx.fillStyle = EM.col(c); s.forEach((v, i) => { ctx.beginPath(); ctx.arc(X(i), Y(v), 3.5, 0, 2 * Math.PI); ctx.fill(); });
        ctx.textAlign = 'right'; ctx.fillText(lab, X(nc) - 2, Y(s[nc]) + (c === '--c3' ? -12 : 14));
      });
      const k = sc.findIndex((v) => v >= p.meta - 0.005);
      sim.set('c1', H.pct(sc[nc])); sim.set('c2', H.pct(so[nc])); sim.set('k', k >= 0 ? String(k) : 'no se alcanza en ' + nc + ' ciclos');
    });
  });
})();
