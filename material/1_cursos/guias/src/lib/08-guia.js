/* ===================================================================
   08-guia.js — De la ficha de una práctica a la guía del estudiante.
   EM.GUIA.bloques(práctica, opciones) produce los bloques que se
   convierten en Word (EM.docx) o en HTML para la vista previa
   (EM.GUIA.html). Las opciones cambian según el nivel de indagación.
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  const G = (EM.GUIA = {});

  G.CREDITO = 'Guías y Montajes de Física · Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca';

  /* Rúbrica general: criterios × niveles de la escala nacional (Decreto 1290 de 2009) */
  G.RUBRICA = [
    ['Planeación y montaje', 'No identifica las variables; el montaje queda incompleto o inseguro.', 'Identifica con ayuda las variables independiente y dependiente; arma el montaje siguiendo instrucciones.', 'Identifica las variables y controla las que deben permanecer constantes; el montaje es correcto y seguro.', 'Justifica el diseño, anticipa fuentes de error y propone mejoras al montaje.'],
    ['Medición y registro', 'Datos incompletos o sin unidades.', 'Tabla con unidades pero sin resolución ni incertidumbre.', 'Tabla completa con unidades y resolución; repite las medidas que lo requieren.', 'Estima incertidumbres tipo A y B y registra todo sin alterar los datos, incluidas las anomalías.'],
    ['Análisis de datos', 'No grafica, o la gráfica no corresponde a los datos.', 'Gráfica con ejes rotulados y unidades; cálculo del resultado sin incertidumbre.', 'Linealiza cuando hace falta, ajusta la recta y obtiene el parámetro con su incertidumbre.', 'Evalúa el ajuste (residuos), compara con la referencia mediante la compatibilidad y explica la discrepancia.'],
    ['Explicación y conclusión', 'Conclusión ausente o copiada.', 'Describe lo observado sin relacionarlo con el modelo.', 'Explica los resultados con el modelo físico y responde la pregunta de la práctica.', 'Argumenta con evidencia, reconoce los límites del modelo y formula nuevas preguntas.'],
    ['Trabajo en equipo y seguridad', 'Incumple normas de seguridad o no participa.', 'Cumple las normas cuando se le recuerdan.', 'Cumple su rol y las normas sin recordatorios.', 'Cuida activamente al equipo, el espacio, los materiales y los residuos.']
  ];
  G.ESCALA = ['Bajo', 'Básico', 'Alto', 'Superior'];

  const lineas = (n) => ({ t: 'lineas', n });

  /* opciones: {nivel 0–3, institucion, docente, sede, grado, fecha, curriculo, rubrica, saber, local} */
  G.bloques = function (pr, o = {}) {
    const nivel = o.nivel === undefined ? pr.nivel || 1 : +o.nivel;
    const N = EM.NIVELES[nivel];
    const B = [];
    B.push({ t: 'campos', cols: 2, pares: [
      ['Institución', o.institucion || ''], ['Sede', o.sede || ''],
      ['Área', 'Ciencias Naturales · Física'], ['Grado', o.grado || (pr.grado + '.°')],
      ['Docente', o.docente || ''], ['Fecha', o.fecha || ''],
      ['Código', pr.cod], ['Duración', pr.tiempo + ' min']
    ] });
    B.push({ t: 'campos', cols: 1, pares: [['Integrantes y roles', '']] });
    B.push({ t: 'titulo', text: 'Guía de laboratorio · ' + pr.titulo, sub: 'Nivel de indagación ' + N[0] + ' · ' + N[1] + (pr.tipo === 'elaborada' ? ' · montaje elaborado' : ' · montaje con elementos simples') });

    if (o.curriculo !== false) {
      B.push({ t: 'h1', text: 'Referentes curriculares' });
      const it = [];
      for (const d of pr.dba || []) { const D = EM.CUR.dba[d]; if (D) it.push('<b>DBA ' + d.replace('.', ' · ').replace(/^(\d+) · /, 'grado $1, n.° ') + ':</b> ' + D.t); }
      for (const e of (pr.est || []).filter((k) => k[0] === 'F' || k[0] === 'T')) it.push('<b>Estándar:</b> ' + EM.CUR.est[e]);
      if (pr.comp) it.push('<b>Competencias Saber 11.°:</b> ' + pr.comp.map((c) => EM.CUR.saber.competencias[c][0]).join(', ') + '.');
      B.push({ t: 'ul', items: it });
    }

    if (nivel < 3) {
      B.push({ t: 'h1', text: 'Pregunta de la práctica' });
      if (pr.contexto) B.push({ t: 'p', text: pr.contexto });
      B.push({ t: 'caja', text: '<b>' + pr.pregunta + '</b>' });
      B.push({ t: 'h2', text: 'Objetivos' });
      B.push({ t: 'ul', items: pr.objetivos });
    } else {
      B.push({ t: 'h1', text: 'Situación' });
      B.push({ t: 'p', text: pr.abierta || pr.contexto || '' });
      B.push({ t: 'h2', text: 'Formulen su pregunta de investigación y su objetivo' });
      B.push(lineas(3));
    }

    B.push({ t: 'h1', text: 'Antes de medir: predicción' });
    B.push({ t: 'p', text: pr.prediccion || 'Escriban qué esperan observar y por qué.' });
    B.push(lineas(3));

    if (pr.claves && pr.claves.length) {
      B.push({ t: 'h1', text: 'Ideas clave' });
      B.push({ t: 'ul', items: pr.claves });
    }

    B.push({ t: 'h1', text: 'Materiales (por grupo)' });
    B.push({ t: 'tabla', head: ['Elemento', 'Cantidad', 'Alternativa'], rows: pr.materiales.map((m) => [m[0], m[1], m[2] || '—']), widths: [3, 1.2, 2.6], small: true });

    B.push({ t: 'h1', text: 'Seguridad: lea antes de empezar' });
    B.push({ t: 'tabla', head: ['Peligro', 'Cómo se previene'], rows: pr.seguridad.map((s) => [s.p, s.ctrl]), widths: [2, 4], small: true });

    if (nivel <= 1) {
      B.push({ t: 'h1', text: 'Montaje' });
      B.push({ t: 'ol', items: pr.montaje });
      if (o.png) B.push({ t: 'img', png: o.png.data, w: o.png.w, h: o.png.h, ancho: 14, pie: 'Esquema del montaje.' });
      B.push({ t: 'h1', text: 'Procedimiento' });
      B.push({ t: 'ol', items: pr.procedimiento });
    } else if (nivel === 2) {
      B.push({ t: 'h1', text: 'Diseño del procedimiento' });
      B.push({ t: 'p', text: 'Discutan en el equipo estas preguntas y escriban su procedimiento. Muéstrenlo al docente antes de medir.' });
      B.push({ t: 'ul', items: pr.orientadoras || [] });
      if (o.png) B.push({ t: 'img', png: o.png.data, w: o.png.w, h: o.png.h, ancho: 12, pie: 'Un montaje posible (pueden modificarlo).' });
      B.push(lineas(8));
    } else {
      B.push({ t: 'h1', text: 'Diseño de la investigación' });
      B.push({ t: 'ul', items: ['¿Qué variable van a cambiar, cuál van a medir y cuáles van a mantener constantes?', '¿Con qué instrumento medirán cada magnitud y cuál es su resolución?', '¿Cuántas medidas harán y cómo sabrán si son suficientes?', '¿Qué riesgos tiene su montaje y cómo los controlarán? (el docente debe aprobarlo)'] });
      B.push(lineas(8));
    }

    B.push({ t: 'h1', text: 'Registro de datos' });
    if (nivel <= 2 && pr.tabla) B.push({ t: 'tabla', head: pr.tabla.cols, rows: [], vacias: pr.tabla.filas || 6, small: true });
    else B.push({ t: 'p', text: 'Diseñen su tabla: cada columna con la magnitud, su símbolo y su unidad; anoten la resolución de cada instrumento.' }, lineas(6));
    B.push({ t: 'p', text: 'Resolución de los instrumentos usados: ______________________________' });

    B.push({ t: 'h1', text: 'Análisis' });
    if (nivel <= 1) B.push({ t: 'ol', items: pr.analisis });
    else B.push({ t: 'ul', items: ['Representen los datos en una gráfica con ejes rotulados y unidades.', 'Si la relación no es lineal, propongan una linealización justificada por el modelo.', 'Obtengan el parámetro de interés con su incertidumbre y compárenlo con el valor de referencia.', 'Identifiquen las fuentes de error más importantes y cómo reducirlas.'] });
    B.push(lineas(6));

    if (nivel === 0 && pr.esperado) {
      B.push({ t: 'h2', text: 'Resultado esperado' });
      B.push({ t: 'p', text: pr.esperado });
    }

    B.push({ t: 'h1', text: 'Discusión' });
    B.push({ t: 'ol', items: pr.preguntas });
    B.push(lineas(5));
    B.push({ t: 'h1', text: 'Conclusiones' });
    B.push({ t: 'p', text: 'Respondan la pregunta de la práctica con base en sus datos. Incluyan el resultado con su incertidumbre.' });
    B.push(lineas(5));

    if (o.saber !== false && pr.saber) {
      B.push({ t: 'h1', text: 'Pregunta tipo Saber 11.°' });
      B.push({ t: 'p', text: pr.saber.enunciado });
      B.push({ t: 'ul', items: pr.saber.opciones.map((op, i) => '<b>' + 'ABCD'[i] + '.</b> ' + op) });
    }
    if (o.rubrica !== false) {
      B.push({ t: 'h1', text: 'Criterios de evaluación' });
      const rub = G.RUBRICA.concat(pr.rubrica || []);
      B.push({ t: 'tabla', head: ['Criterio'].concat(G.ESCALA), rows: rub, widths: [1.3, 1.6, 1.6, 1.6, 1.6], small: true, primeraNegrita: true });
    }
    if (pr.referencias && pr.referencias.length) {
      B.push({ t: 'h2', text: 'Referencias' });
      B.push({ t: 'ul', items: pr.referencias });
    }
    return B;
  };

  G.meta = (pr, o = {}) => ({
    titulo: 'Guía de laboratorio · ' + pr.titulo,
    autor: o.docente || 'Mg. Manuel Alejandro Obando',
    encabezado: (o.institucion ? o.institucion + ' · ' : '') + 'Ciencias Naturales · Física · ' + pr.cod,
    pie: (o.docente ? 'Docente: ' + o.docente + ' · ' : '') + 'Adaptada de ' + G.CREDITO
  });

  /* Vista previa en HTML de los mismos bloques */
  G.html = function (B) {
    const esc = (s) => String(s === undefined || s === null ? '' : s);
    let h = '';
    let olN = 0;
    for (const b of B) {
      switch (b.t) {
        case 'titulo': h += `<h1 class="g-tit">${esc(b.text)}</h1>` + (b.sub ? `<p class="g-sub">${esc(b.sub)}</p>` : ''); break;
        case 'h1': h += `<h2 class="g-h1">${esc(b.text)}</h2>`; break;
        case 'h2': h += `<h3 class="g-h2">${esc(b.text)}</h3>`; break;
        case 'h3': h += `<h4>${esc(b.text)}</h4>`; break;
        case 'p': h += `<p>${esc(b.text)}</p>`; break;
        case 'ul': h += '<ul>' + b.items.map((i) => `<li>${esc(i)}</li>`).join('') + '</ul>'; break;
        case 'ol': olN++; h += '<ol>' + b.items.map((i) => `<li>${esc(i)}</li>`).join('') + '</ol>'; break;
        case 'tabla':
          h += '<div class="tablewrap"><table class="g-tabla">' + (b.head ? '<tr>' + b.head.map((x) => `<th>${esc(x)}</th>`).join('') + '</tr>' : '') +
            (b.rows || []).map((r) => '<tr>' + r.map((c, i) => `<td${b.primeraNegrita && i === 0 ? ' class="b"' : ''}>${esc(c)}</td>`).join('') + '</tr>').join('') +
            new Array(b.vacias || 0).fill('<tr>' + (b.head || []).map(() => '<td>&nbsp;</td>').join('') + '</tr>').join('') + '</table></div>';
          break;
        case 'campos': {
          const c = b.cols || 2;
          h += '<div class="tablewrap"><table class="g-campos">';
          for (let i = 0; i < b.pares.length; i += c) {
            h += '<tr>';
            for (let j = 0; j < c; j++) { const p = b.pares[i + j]; h += p ? `<th>${esc(p[0])}</th><td>${esc(p[1]) || '&nbsp;'}</td>` : '<th></th><td></td>'; }
            h += '</tr>';
          }
          h += '</table></div>';
          break;
        }
        case 'caja': h += '<div class="g-caja">' + (b.titulo ? `<b>${esc(b.titulo)}</b><br>` : '') + (b.items || [b.text]).map(esc).join('<br>') + '</div>'; break;
        case 'lineas': h += '<div class="g-lineas">' + '<span></span>'.repeat(b.n || 3) + '</div>'; break;
        case 'img': h += '<p class="g-img">[Esquema del montaje]</p>'; break;
        default: break;
      }
    }
    return h;
  };
})();
