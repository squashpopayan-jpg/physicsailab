/* ===================================================================
   40-herr.js — ayudantes comunes de las herramientas y datos de trabajo del programa
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const el = EM.el;
  const A = EM.calc.ra;
  const H = (EM.H = {});

  H.esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  H.pct = (x, d = 0) => (x * 100).toFixed(d).replace('.', ',') + ' %';

  /* ---------- Entradas de formulario ---------- */
  H.input = function (parent, o) {
    const row = el('label', 'hf' + (o.cls ? ' ' + o.cls : ''));
    if (o.label) row.append(el('span', 'hf-l', o.label));
    const inp = o.rows ? document.createElement('textarea') : document.createElement('input');
    if (o.rows) inp.rows = o.rows; else inp.type = o.type || 'text';
    if (o.min !== undefined) inp.min = o.min;
    if (o.max !== undefined) inp.max = o.max;
    if (o.step !== undefined) inp.step = o.step;
    if (o.ph) inp.placeholder = o.ph;
    inp.value = o.value === undefined ? '' : o.value;
    if (o.aria) inp.setAttribute('aria-label', o.aria);
    inp.addEventListener('input', () => o.onInput && o.onInput(o.type === 'number' ? +inp.value : inp.value, inp));
    row.append(inp);
    parent.append(row);
    return inp;
  };
  H.select = function (parent, o) {
    const row = el('label', 'hf' + (o.cls ? ' ' + o.cls : ''));
    if (o.label) row.append(el('span', 'hf-l', o.label));
    const s = document.createElement('select');
    o.options.forEach(([v, t]) => { const op = document.createElement('option'); op.value = v; op.textContent = t; s.append(op); });
    s.value = o.value;
    if (o.aria) s.setAttribute('aria-label', o.aria);
    s.addEventListener('change', () => o.onInput && o.onInput(s.value));
    row.append(s);
    parent.append(row);
    return s;
  };
  H.btn = function (parent, label, fn, cls) {
    const b = el('button', 'btn' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', fn);
    parent.append(b);
    return b;
  };

  /* ---------- Exportar: copiar al portapapeles con respaldo en un cuadro de texto ---------- */
  H.salida = function (parent) {
    const box = el('div', 'h-out');
    const ta = document.createElement('textarea');
    ta.readOnly = true; ta.rows = 8; ta.setAttribute('aria-label', 'Texto exportado');
    const bar = el('div', 'ctrl-row');
    const msg = el('span', 'h-msg', '');
    H.btn(bar, 'Copiar', () => {
      ta.select();
      let ok = false;
      try { ok = document.execCommand && document.execCommand('copy'); } catch (e) { ok = false; }
      if (!ok && navigator.clipboard) { navigator.clipboard.writeText(ta.value).then(() => { msg.textContent = 'Copiado.'; }, () => { msg.textContent = 'Seleccione el texto y copie con Ctrl+C.'; }); return; }
      msg.textContent = ok ? 'Copiado.' : 'Seleccione el texto y copie con Ctrl+C.';
    });
    bar.append(msg);
    box.append(ta, bar);
    parent.append(box);
    return { set: (t) => { ta.value = t; }, box };
  };
  H.csv = (rows) => rows.map((r) => r.map((c) => { const s = String(c === undefined || c === null ? '' : c); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\n');

  /* ---------- Almacenamiento del espacio de trabajo del programa ---------- */
  H.get = (k, d) => { const v = EM.store.get('ws:' + k, null); return v === null || v === undefined ? JSON.parse(JSON.stringify(d)) : v; };
  H.set = (k, v) => EM.store.set('ws:' + k, v);

  /* ---------- Datos de trabajo (propuesta ilustrativa; el usuario la edita) ---------- */
  /* Resultados de aprendizaje VIGENTES del programa, transcritos del PEP (versión 2023-2024, sección «Resultados de Aprendizaje»); la presentación a los pares los repite con pequeñas diferencias de redacción. */
  H.RA0 = [
    { c: 'RA1', t: 'Aplicar el pensamiento científico y los principios de las ciencias naturales y exactas para analizar y resolver problemas científicos y tecnológicos del entorno, demostrando un dominio sólido en la aplicación de métodos y herramientas científicas propias de la física y la ingeniería.', ind: ['Desempeño académico de los estudiantes.'] },
    { c: 'RA2', t: 'Diseñar, ejecutar y evaluar proyectos de investigación y desarrollo tecnológico en las áreas disciplinares de formación que aporten al bienestar de la sociedad, demostrando habilidades avanzadas en la formulación de hipótesis, la selección y aplicación de metodologías apropiadas, la recopilación y análisis de datos, así como la comunicación efectiva de los resultados obtenidos.', ind: ['Número de participaciones en eventos científicos (congresos, simposios, workshops, etc.) y de trabajos de grado en la modalidad proyectos de investigación.', 'Número de estudiantes y proyectos disciplinares e interdisciplinares realizados desde los semilleros de investigación y grupos de investigación.'] },
    { c: 'RA3', t: 'Liderar procesos de desarrollo disciplinar e interdisciplinar a través de la participación en actividades de investigación y pasantías en el contexto académico o empresarial, contribuyendo al avance científico-tecnológico en sus áreas de especialización y promoviendo el crecimiento profesional tanto a nivel individual como en los diferentes grupos de trabajo.', ind: ['Número de trabajos de grado en la modalidad práctica profesional o pasantía.'] }
  ];
  /* Propuesta ampliada de trabajo (ILUSTRATIVA, elaborada para este curso; no es del programa). */
  H.RA_PROP = [
    { c: 'RA1', t: 'Aplica principios de la física clásica y moderna y herramientas matemáticas para formular y resolver problemas de ingeniería, justificando las hipótesis y aproximaciones y verificando el orden de magnitud de los resultados.', ind: ['Plantea el modelo físico de un problema abierto e identifica las hipótesis que lo sustentan.', 'Resuelve el problema por vía analítica o numérica y verifica el resultado con un caso límite o una estimación.'] },
    { c: 'RA2', t: 'Construye modelos matemáticos y computacionales de sistemas físicos y contrasta sus predicciones con datos experimentales, estableciendo el alcance y las limitaciones del modelo.', ind: ['Implementa el modelo en código documentado y reproducible.', 'Compara predicción y medición con una métrica cuantitativa y discute las discrepancias.'] },
    { c: 'RA3', t: 'Diseña, ejecuta y analiza experimentos y mediciones, estimando incertidumbres con criterios metrológicos y documentando los resultados con trazabilidad.', ind: ['Propone un procedimiento de medición adecuado a la magnitud y a la exactitud requeridas.', 'Calcula e informa la incertidumbre combinada de la medición.', 'Registra datos y metadatos de modo que otra persona pueda repetir la medición.'] },
    { c: 'RA4', t: 'Diseña sistemas, componentes o procesos que satisfacen requisitos técnicos, de seguridad, ambientales y económicos, y valida su desempeño mediante prototipos o pruebas.', ind: ['Traduce una necesidad en requisitos verificables.', 'Compara alternativas de diseño con criterios explícitos y selecciona una con justificación.', 'Valida el prototipo frente a los requisitos y documenta los resultados.'] },
    { c: 'RA5', t: 'Selecciona, integra y caracteriza sensores, actuadores, materiales y componentes ópticos para resolver una necesidad de medición, control o caracterización, justificando la elección con criterios técnicos.', ind: ['Elige el sensor o material según especificaciones y condiciones de operación.', 'Caracteriza el elemento elegido con técnicas experimentales apropiadas.'] },
    { c: 'RA6', t: 'Formula y desarrolla proyectos de investigación, desarrollo e innovación a partir del estado del arte, y comunica sus hallazgos con rigor científico y ética de la investigación.', ind: ['Delimita un problema y una pregunta a partir de una revisión de literatura sistemática.', 'Planifica y ejecuta la metodología y analiza los datos con técnicas estadísticas adecuadas.', 'Redacta un informe o artículo que cumple las convenciones de la comunidad.'] },
    { c: 'RA7', t: 'Comunica resultados técnicos de forma oral y escrita, en español y en una segunda lengua, y participa o lidera equipos disciplinares e interdisciplinares con responsabilidad.', ind: ['Presenta resultados con estructura, evidencia y lenguaje adecuados a la audiencia.', 'Asume un rol en el equipo, cumple compromisos y gestiona los desacuerdos.'] },
    { c: 'RA8', t: 'Evalúa el impacto ético, social y ambiental de soluciones tecnológicas y actúa con integridad profesional, observando la normativa, la seguridad y la propiedad intelectual.', ind: ['Identifica riesgos y partes afectadas por una solución tecnológica y propone mitigaciones.', 'Aplica la normativa técnica, de seguridad y de propiedad intelectual pertinente a su proyecto.'] },
    { c: 'RA9', t: 'Identifica sus necesidades de aprendizaje, incorpora conocimiento nuevo de fuentes especializadas y lo aplica a problemas de su campo de forma autónoma.', ind: ['Planifica y documenta un proceso de aprendizaje autónomo sobre un tema nuevo.', 'Aplica el conocimiento adquirido a un problema real y evalúa el resultado.'] }
  ];
  /* Plan de estudios vigente (reforma aplicada desde 2017): cursos, semestre y créditos de la «Tabla 5» del informe de autoevaluación y de la ficha
     del programa; suman 165 créditos. Los laboratorios se suman a su curso teórico. Las marcas I, R, M son ILUSTRATIVAS (del autor del curso). */
  H.CURSOS0 = [
    ['Física Fundamental', 1, 'RA1:I', 3], ['Introducción a la Ingeniería Física', 1, 'RA4:I,RA7:I,RA8:I,RA9:I', 3], ['Tratamiento de Datos', 1, 'RA2:I,RA3:I', 2], ['Cálculo I', 1, 'RA1:I', 4], ['La lectura y la escritura', 1, 'RA7:I', 3], ['Química General (con laboratorio)', 1, 'RA1:I,RA3:I', 5],
    ['Mecánica (con laboratorio)', 2, 'RA1:R,RA3:I', 4], ['Química Orgánica General (con laboratorio)', 2, 'RA1:I', 5], ['Cálculo II', 2, 'RA1:R', 4], ['Álgebra Lineal', 2, 'RA1:R', 4],
    ['Electromagnetismo (con laboratorio)', 3, 'RA1:R,RA3:R,RA7:I', 4], ['Cálculo III', 3, 'RA1:R', 4], ['Termodinámica', 3, 'RA1:R', 3], ['Dispositivos Pasivos (con laboratorio)', 3, 'RA3:R,RA4:I,RA5:I', 4], ['Programación Estructurada', 3, 'RA2:I', 4],
    ['Vibraciones y Ondas (con laboratorio)', 4, 'RA1:R,RA3:R', 4], ['Fisicoquímica', 4, 'RA1:R', 3], ['Sistemas Analógicos', 4, 'RA4:R,RA5:R', 3], ['Dispositivos Activos (con laboratorio)', 4, 'RA4:R,RA5:R', 4], ['Ecuaciones Diferenciales', 4, 'RA1:R,RA2:I', 4],
    ['Óptica General (con laboratorio)', 5, 'RA1:R,RA3:R,RA5:R', 4], ['Transductores (con laboratorio)', 5, 'RA3:R,RA5:R', 4], ['Programación Orientada a Objetos', 5, 'RA2:R', 3], ['Modelos Físico-Matemáticos para Ingeniería', 5, 'RA1:R,RA2:R', 3], ['Sistemas digitales', 5, 'RA4:R,RA5:R', 3],
    ['Física Moderna (con laboratorio)', 6, 'RA1:R,RA3:R', 4], ['Interfaces', 6, 'RA4:R,RA5:R', 3], ['Procesamiento de Señales', 6, 'RA2:R,RA5:R', 3], ['Formación Ciudadana', 6, 'RA8:R', 3], ['Sistemas de Control', 6, 'RA2:R,RA4:R,RA5:R', 3],
    ['Introducción a la Mecánica Cuántica', 7, 'RA1:M', 3], ['Ciencia de los Materiales', 7, 'RA5:R', 3], ['Métodos de Análisis (con laboratorio)', 7, 'RA3:R,RA5:R', 4], ['Taller de Ingeniería Física', 7, 'RA3:R,RA4:R,RA7:R', 4], ['Diseño de Experimentos en Ingeniería', 7, 'RA3:M,RA6:I', 3],
    ['Estado Sólido', 8, 'RA1:M,RA5:R', 3], ['Teoría electromagnética', 8, 'RA1:M', 3], ['Electiva I', 8, 'RA9:R', 3], ['Electiva II', 8, 'RA9:R', 3], ['Formulación de Proyectos', 8, 'RA4:R,RA6:R,RA7:R,RA8:R', 3], ['Planes de Negocio', 8, 'RA4:R,RA7:R,RA8:R', 3],
    ['Trabajo de Grado I', 9, 'RA2:R,RA3:R,RA6:R', 4], ['Electiva en Cultura y Estética', 9, 'RA8:R', 3], ['Electiva III', 9, 'RA9:M', 3], ['Electiva IV', 9, 'RA9:R', 3], ['Gestión Tecnológica', 9, 'RA4:M,RA6:R,RA8:M', 3],
    ['Trabajo de Grado II', 10, 'RA2:M,RA3:M,RA4:M,RA5:M,RA6:M,RA7:M,RA8:R,RA9:M', 4], ['Ciencia, tecnología y sociedad', 10, 'RA8:M', 3]
  ];
  /* Con los tres resultados vigentes, las marcas de ejemplo se derivan de la propuesta ampliada: RA1 ← RA1; RA2 ← el mayor nivel de RA2 a RA6; RA3 ← el mayor de RA7 a RA9 */
  const LV = { '': 0, I: 1, R: 2, M: 3 }, LN = ['', 'I', 'R', 'M'];
  const mx = (a) => LN[Math.max(0, ...a.map((v) => LV[v || '']))];
  H.cursosDe = function (arr, conMarcas) {
    const n = H.get('ras', H.RA0).length;
    return arr.map(([nm, sem, m, cr]) => {
      const r9 = Array(9).fill('');
      m.split(',').filter(Boolean).forEach((p) => { const [r, v] = p.split(':'); r9[+r.replace('RA', '') - 1] = v; });
      let row = Array(n).fill('');
      if (conMarcas !== false) row = n === 3 ? [r9[0], mx(r9.slice(1, 6)), mx(r9.slice(6, 9))] : Array.from({ length: n }, (_, j) => r9[j] || '');
      return { n: nm, sem, m: row, cr: cr || 0 };
    });
  };

  /* ---------- Gráficos pequeños ---------- */
  H.fontUI = (px, w = 500) => `${w} ${px}px ${EM.FONT_UI}`;
  H.roundRect = function (ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  H.wrap = function (ctx, txt, x, y, maxW, lh) {
    const ws = String(txt).split(' ');
    let line = '', yy = y;
    ws.forEach((w) => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t; });
    if (line) ctx.fillText(line, x, yy);
    return yy + lh;
  };
  /* Barra horizontal de «semáforo»: cumple / cerca / brecha */
  H.SEM = { cumple: ['Cumple la meta', '--c3'], cerca: ['Cerca de la meta', '--gold'], brecha: ['Brecha por cerrar', '--c2'] };
  H.panel = function (sim) {
    /* panel DOM en el escenario, para herramientas basadas en formularios */
    const p = el('div', 'h-panel');
    sim.stage.append(p);
    return p;
  };
})();
