/* Capítulo 7 — Generador de guías */
(function () {
  'use strict';
  const EM = window.EM, L = EM.L, el = EM.el, G = EM.GUIA;
  const CAMPOS = [['institucion', 'Institución educativa'], ['sede', 'Sede'], ['docente', 'Docente'], ['grado', 'Grado y grupo (ej. 10.° A)'], ['fecha', 'Fecha']];
  const nombreArchivo = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  EM.datosInstitucion = () => EM.store.get('institucion', {});

  /* Esquema del montaje: captura el lienzo del banco virtual de la práctica en tema claro */
  async function capturarMontaje(pr) {
    const app = EM.app, ch = app && app.byId[pr.capitulo];
    if (!ch || !app.build) return null;
    const art = app.build(ch);
    const banco = art.querySelector('.sim[data-kind="Banco virtual"] canvas');
    if (!banco) return null;
    const oculto = art.hidden, estilo = art.getAttribute('style') || '';
    const tema = document.documentElement.getAttribute('data-theme');
    if (oculto) { art.hidden = false; art.setAttribute('style', 'position:absolute;left:-12000px;top:0;width:1100px'); }
    document.documentElement.setAttribute('data-theme', 'light');
    await new Promise((r) => setTimeout(r, 450));
    let out = null;
    try {
      const blob = await new Promise((r) => banco.toBlob(r, 'image/png'));
      if (blob) out = { data: new Uint8Array(await blob.arrayBuffer()), w: banco.width, h: banco.height };
    } catch (e) { out = null; }
    if (tema) document.documentElement.setAttribute('data-theme', tema); else document.documentElement.removeAttribute('data-theme');
    if (oculto) { art.hidden = true; if (estilo) art.setAttribute('style', estilo); else art.removeAttribute('style'); }
    return out && out.w > 10 ? out : null;
  }

  /* Práctica propia a partir de textos */
  const lineas = (s) => String(s || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
  function propia(f) {
    return {
      id: 'propia', cod: f.cod || 'P-01', titulo: f.titulo || 'Práctica propia', grado: f.gradoNum || 10, tipo: 'simple', tiempo: +f.tiempo || 110, nivel: 1,
      dba: [], est: [], comp: ['ind'], pregunta: f.pregunta || '', contexto: f.contexto || '', objetivos: lineas(f.objetivos),
      prediccion: f.prediccion || '', claves: lineas(f.claves),
      materiales: lineas(f.materiales).map((x) => { const [a, b, c] = x.split(';').map((s) => s.trim()); return [a, b || '', c || '', 0]; }),
      seguridad: lineas(f.seguridad).map((x) => { const [a, b] = x.split(';').map((s) => s.trim()); return { p: a, ctrl: b || '', c: 'mec', ef: '', nd: 2, ne: 2, nc: 10 }; }),
      montaje: lineas(f.montaje), procedimiento: lineas(f.procedimiento), tabla: { cols: String(f.cols || '').split(';').map((s) => s.trim()).filter(Boolean), filas: 6 },
      analisis: lineas(f.analisis), preguntas: lineas(f.preguntas), orientadoras: lineas(f.orientadoras), abierta: f.abierta || ''
    };
  }

  EM.defineSim('generador', function (sim) {
    sim.below();
    const inst = EM.datosInstitucion();
    const form = el('div', 'gen-form');
    const inputs = {};
    for (const [k, t] of CAMPOS) {
      const lab = el('label', null, t);
      const inp = document.createElement('input');
      inp.type = 'text'; inp.value = inst[k] || ''; inp.autocomplete = 'off';
      inp.addEventListener('input', () => { const d = EM.datosInstitucion(); d[k] = inp.value; EM.store.set('institucion', d); sim.redraw(); });
      lab.append(inp); form.append(lab); inputs[k] = inp;
    }
    const PROPIA_CAMPOS = [['titulo', 'Título', 1], ['cod', 'Código', 1], ['tiempo', 'Duración (min)', 1], ['pregunta', 'Pregunta de la práctica', 2], ['contexto', 'Contexto', 3], ['objetivos', 'Objetivos (uno por renglón)', 3], ['prediccion', 'Predicción que se pide', 2], ['claves', 'Ideas clave (una por renglón)', 3], ['materiales', 'Materiales: elemento; cantidad; alternativa (uno por renglón)', 4], ['seguridad', 'Seguridad: peligro; cómo se previene (uno por renglón)', 3], ['montaje', 'Montaje (un paso por renglón)', 4], ['procedimiento', 'Procedimiento (un paso por renglón)', 4], ['cols', 'Columnas de la tabla, separadas por punto y coma', 1], ['analisis', 'Análisis (un paso por renglón)', 3], ['preguntas', 'Preguntas de discusión (una por renglón)', 3], ['orientadoras', 'Preguntas orientadoras para el nivel guiado', 3], ['abierta', 'Situación para el nivel abierto', 2]];
    const propiaBox = el('div', 'gen-propia');
    const pf = EM.store.get('propia', {});
    const pIn = {};
    for (const [k, t, rows] of PROPIA_CAMPOS) {
      const lab = el('label', null, t);
      const inp = rows > 1 ? document.createElement('textarea') : document.createElement('input');
      if (rows > 1) inp.rows = rows; else inp.type = 'text';
      inp.value = pf[k] || '';
      inp.addEventListener('input', () => { const d = EM.store.get('propia', {}); d[k] = inp.value; EM.store.set('propia', d); sim.redraw(); });
      lab.append(inp); propiaBox.append(lab); pIn[k] = inp;
    }
    const acciones = el('div', 'dl-row');
    const prev = el('div', 'guia-prev');
    sim.stage.append(form, propiaBox, acciones, prev);
    const lista = EM.PR.lista.slice().sort((a, b) => (a.cod < b.cod ? -1 : 1));
    sim.select('pr', { label: 'Práctica', options: lista.map((p) => [p.id, p.cod + ' · ' + p.titulo]).concat([['propia', 'Práctica propia (escriba los textos)']]), value: EM.PR.get('pendulo') ? 'pendulo' : lista[0].id, onInput: (v) => { const q = EM.PR.get(v); if (q) sim.ctl.nv.set(q.nivel || 1, true); } });
    sim.seg('nv', { label: 'Nivel de indagación', options: EM.NIVELES.map((n) => [+n[0], n[0] + ' · ' + n[1]]), value: 1 });
    sim.check('cur', { label: 'Incluir referentes curriculares', value: true });
    sim.check('img', { label: 'Incluir esquema del montaje', value: true });
    sim.check('sab', { label: 'Incluir pregunta tipo Saber 11.°', value: true });
    sim.check('rub', { label: 'Incluir rúbrica de evaluación', value: true });
    sim.out('info', 'Guía');
    const practica = () => (sim.p.pr === 'propia' ? propia(Object.fromEntries(Object.entries(pIn).map(([k, v]) => [k, v.value]))) : EM.PR.get(sim.p.pr));
    const opciones = () => Object.assign({ nivel: sim.p.nv, curriculo: sim.p.cur, saber: sim.p.sab, rubrica: sim.p.rub }, Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.value])));
    L.botonDescarga(acciones, 'Descargar Word (.docx)', async () => {
      const p = practica(), o = opciones();
      if (sim.p.img && sim.p.pr !== 'propia') o.png = await capturarMontaje(p);
      const datos = EM.docx(G.bloques(p, o), G.meta(p, o));
      return [nombreArchivo('Guia-' + p.cod + '-' + p.titulo + '-nivel-' + o.nivel) + '.docx', datos, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    }, { primary: true });
    const bp = el('button', 'btn', 'Imprimir vista previa'); bp.type = 'button';
    bp.addEventListener('click', () => EM.imprimir(prev.innerHTML));
    acciones.append(bp);
    sim.onDraw(() => {
      const p = practica(), o = opciones();
      propiaBox.hidden = sim.p.pr !== 'propia';
      prev.innerHTML = G.html(G.bloques(p, o));
      sim.set('info', p.cod + ' · ' + EM.NIVELES[o.nivel][1] + ' · ' + (p.tiempo || '') + ' min');
    });
  });

  /* Impresión de un fragmento HTML */
  EM.imprimir = function (html) {
    let area = document.getElementById('print-area');
    if (!area) { area = el('div', 'guia-prev'); area.id = 'print-area'; document.body.append(area); }
    area.innerHTML = html;
    document.documentElement.classList.add('imprimiendo');
    const fin = () => { document.documentElement.classList.remove('imprimiendo'); window.removeEventListener('afterprint', fin); };
    window.addEventListener('afterprint', fin);
    window.print();
    setTimeout(fin, 60000);
  };

  /* Plantillas en blanco */
  const INSTR = (t) => ({ t: 'p', text: '<i>' + t + '</i>', color: '777777' });
  EM.plantillaGuia = function () {
    return [
      { t: 'campos', cols: 2, pares: [['Institución', ''], ['Sede', ''], ['Área', 'Ciencias Naturales · Física'], ['Grado', ''], ['Docente', ''], ['Fecha', ''], ['Código', ''], ['Duración', '']] },
      { t: 'campos', cols: 1, pares: [['Integrantes y roles', '']] },
      { t: 'titulo', text: 'Guía de laboratorio · [título]', sub: 'Nivel de indagación [0–3] · [elementos simples / montaje elaborado]' },
      { t: 'h1', text: 'Referentes curriculares' }, INSTR('Copie el enunciado textual del DBA y de los estándares (capítulo 1). Indique las competencias de Saber 11.° que se ejercitan.'),
      { t: 'h1', text: 'Pregunta de la práctica' }, INSTR('Una pregunta que se responda con los datos de la práctica, ligada a algo cercano al estudiante.'),
      { t: 'h2', text: 'Objetivos' }, INSTR('Verbos observables: medir, determinar, comparar, explicar.'),
      { t: 'h1', text: 'Antes de medir: predicción' }, INSTR('Pida una predicción con su razón.'), { t: 'lineas', n: 3 },
      { t: 'h1', text: 'Ideas clave' }, INSTR('El modelo físico mínimo, en tres a cinco viñetas.'),
      { t: 'h1', text: 'Materiales (por grupo)' }, { t: 'tabla', head: ['Elemento', 'Cantidad', 'Alternativa'], rows: [], vacias: 6, small: true },
      { t: 'h1', text: 'Seguridad: lea antes de empezar' }, { t: 'tabla', head: ['Peligro', 'Cómo se previene'], rows: [], vacias: 3, small: true }, INSTR('Valore cada peligro con la GTC 45 en su ficha docente (capítulo 3).'),
      { t: 'h1', text: 'Montaje' }, INSTR('Pasos numerados con medidas y un esquema rotulado.'),
      { t: 'h1', text: 'Procedimiento' }, INSTR('Una acción por paso; cuántas repeticiones y qué valores de la variable independiente.'),
      { t: 'h1', text: 'Registro de datos' }, { t: 'tabla', head: ['Magnitud (unidad)', 'Magnitud (unidad)', 'Magnitud (unidad)', 'Magnitud (unidad)'], rows: [], vacias: 7, small: true }, { t: 'p', text: 'Resolución de los instrumentos usados: ______________________________' },
      { t: 'h1', text: 'Análisis' }, INSTR('Gráfica, linealización si hace falta, resultado con incertidumbre y comparación con la referencia (capítulos 8 y 9).'), { t: 'lineas', n: 6 },
      { t: 'h1', text: 'Discusión' }, INSTR('Preguntas que no se respondan copiando la teoría.'), { t: 'lineas', n: 4 },
      { t: 'h1', text: 'Conclusiones' }, { t: 'lineas', n: 4 },
      { t: 'h1', text: 'Criterios de evaluación' }, { t: 'tabla', head: ['Criterio'].concat(G.ESCALA), rows: G.RUBRICA, widths: [1.3, 1.6, 1.6, 1.6, 1.6], small: true, primeraNegrita: true }
    ];
  };
  EM.plantillaInforme = function () {
    return [
      { t: 'campos', cols: 2, pares: [['Institución', ''], ['Grado', ''], ['Integrantes', ''], ['Fecha', ''], ['Práctica', ''], ['Docente', '']] },
      { t: 'titulo', text: 'Informe de laboratorio · [título]', sub: 'Física · [código de la práctica]' },
      { t: 'h1', text: 'Resumen' }, INSTR('En cinco renglones: qué se midió, cómo, el resultado principal con su incertidumbre y la conclusión.'), { t: 'lineas', n: 4 },
      { t: 'h1', text: '1. Introducción' }, INSTR('La pregunta, por qué importa y el modelo físico con sus ecuaciones. Cite las fuentes.'),
      { t: 'h1', text: '2. Montaje y procedimiento' }, INSTR('Esquema rotulado, instrumentos con su resolución, qué se varió y qué se mantuvo constante.'),
      { t: 'h1', text: '3. Resultados' }, INSTR('Tabla de datos (o anexo), gráfica con ejes rotulados, ajuste y resultado con incertidumbre.'),
      { t: 'h1', text: '4. Análisis y discusión' }, INSTR('Compatibilidad con la referencia (valor z), fuentes de error sistemático y aleatorio, límites del modelo.'),
      { t: 'h1', text: '5. Conclusiones' }, INSTR('Respuesta a la pregunta con el resultado numérico. Nuevas preguntas.'),
      { t: 'h1', text: 'Referencias' }, INSTR('Formato de la institución (NTC 1486 y NTC 5613, o APA).'),
      { t: 'h1', text: 'Anexo: datos originales' }, INSTR('Copia de la tabla tal como se registró en el laboratorio, sin correcciones.')
    ];
  };

  EM.defineSim('plantillas-word', function (sim) {
    sim.below();
    const box = el('div', 'plantillas');
    sim.stage.append(box);
    const meta = (t) => ({ titulo: t, autor: 'Mg. Manuel Alejandro Obando', encabezado: 'Ciencias Naturales · Física', pie: G.CREDITO });
    const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    L.botonDescarga(box, 'Plantilla de guía en blanco (.docx)', async () => ['Plantilla-guia-de-laboratorio.docx', EM.docx(EM.plantillaGuia(), meta('Plantilla de guía de laboratorio')), DOCX]);
    L.botonDescarga(box, 'Plantilla de informe (.docx)', async () => ['Plantilla-informe-de-laboratorio.docx', EM.docx(EM.plantillaInforme(), meta('Plantilla de informe de laboratorio')), DOCX]);
    L.botonDescarga(box, 'Paquete con todas las guías (.zip)', async () => {
      const inst = EM.datosInstitucion();
      const archivos = EM.PR.lista.slice().sort((a, b) => (a.cod < b.cod ? -1 : 1)).map((p) => {
        const o = Object.assign({ nivel: p.nivel || 1 }, inst);
        return { name: nombreArchivo(p.cod + '-' + p.titulo) + '.docx', data: EM.docx(G.bloques(p, o), G.meta(p, o)) };
      });
      archivos.push({ name: 'LEAME.txt', data: 'Guías de laboratorio de física para 10.° y 11.°, generadas con «Guías y Montajes de Física».\r\nCada guía está en su nivel de indagación sugerido; para otro nivel o con el esquema del montaje use el generador del capítulo 7.\r\n' + G.CREDITO + '\r\n' });
      return ['Guias-de-laboratorio-fisica.zip', EM.zip(archivos), 'application/zip'];
    }, { primary: true });
    sim.out('n', 'Guías en el paquete');
    sim.onDraw(() => sim.set('n', String(EM.PR.lista.length)));
  });
})();
