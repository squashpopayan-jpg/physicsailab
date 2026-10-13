/* Capítulo 32 — Hoja de cálculo, DIALux evo, QElectroTech y FreeCAD */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C;

  /* Fórmula con nombres y separadores de la interfaz en español */
  const ES = { VLOOKUP: 'BUSCARV', IF: 'SI', AND: 'Y', SUM: 'SUMA', ROUNDUP: 'REDONDEAR.MAS', FALSE: 'FALSO', MAX: 'MAX', MIN: 'MIN', ABS: 'ABS' };
  RT.formulaES = (f) => f.replace(/,/g, ';').replace(/(\d)\.(\d)/g, '$1,$2').replace(/\b(VLOOKUP|IF|AND|SUM|ROUNDUP|FALSE|MAX|MIN|ABS)\b/g, (m) => ES[m]);
  const fmtCalc = (c) => {
    const v = c.calc;
    if (typeof v !== 'number') return v === undefined ? '' : String(v);
    const n = c.n || '0', pct = n.endsWith('%'), cuerpo = pct ? n.slice(0, -1) : n;
    const d = (cuerpo.split('.')[1] || '').length;
    return pct ? C.fmt(100 * v, d) + ' %' : C.fmt(v, d);
  };
  const fmtVal = (c) => (typeof c.v === 'number' ? C.fmt(c.v, c.n ? (c.n.split('.')[1] || '').length : Number.isInteger(c.v) ? 0 : 2) : c.v === undefined ? '' : String(c.v));

  RT.defineSim('hoja-formulas', function (sim) {
    const H = L.HOJA(K);
    const wrap = RT.el('div', 'hoja');
    const barra = RT.el('div', 'hoja-barra');
    const grid = RT.el('div', 'hoja-grid');
    const tabs = RT.el('div', 'hoja-tabs');
    wrap.append(barra, grid, tabs);
    sim.stage.append(wrap);
    let hoja = 'Cuadro', sel = 'X6', centrar = true;
    sim.group('Vista');
    sim.check('fx', { label: 'Ver fórmulas en las celdas', value: false });
    sim.check('es', { label: 'En español (Excel o LibreOffice en español)', value: false });
    sim.out('ref', 'Celda', { hl: true });
    sim.out('tipo', 'Tipo');
    sim.out('val', 'Valor');
    if (RT.EMBED && RT.EMBED.xlsx) RT.botonDescarga(sim.ctrlBox, 'Descargar la plantilla (XLSX)', () => [RT.EMBED.xlsx.name, RT.b64aBytes(RT.EMBED.xlsx.b64), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], { primary: true });
    const colN = (s) => s.split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0);
    const colS = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
    const pintar = () => {
      const h = H.hojas.find((x) => x.nombre === hoja);
      const refs = Object.keys(h.celdas);
      let maxC = 1, maxR = 1;
      refs.forEach((r) => { const m = /^([A-Z]+)(\d+)$/.exec(r); maxC = Math.max(maxC, colN(m[1])); maxR = Math.max(maxR, +m[2]); });
      const fx = sim.p.fx, es = sim.p.es;
      const F = (f) => (es ? RT.formulaES(f) : f);
      let t = '<table><thead><tr><th class="rh"></th>';
      for (let c = 1; c <= maxC; c++) t += `<th style="min-width:${Math.max(3.2, (h.anchos[colS(c)] || 9) * 0.55)}em">${colS(c)}</th>`;
      t += '</tr></thead><tbody>';
      for (let r = 1; r <= maxR; r++) {
        t += `<tr><th class="rh">${r}</th>`;
        for (let c = 1; c <= maxC; c++) {
          const ref = colS(c) + r, cel = h.celdas[ref];
          if (!cel) { t += `<td data-r="${ref}"${ref === sel ? ' class="sel"' : ''}></td>`; continue; }
          const cls = [cel.s || '', cel.f ? 'f' : '', ref === sel ? 'sel' : '', typeof (cel.f ? cel.calc : cel.v) === 'number' ? 'num' : ''].join(' ').trim();
          const txt = cel.f ? (fx ? F(cel.f) : fmtCalc(cel)) : fmtVal(cel);
          t += `<td data-r="${ref}" class="${cls}" title="${ref}">${String(txt).replace(/</g, '&lt;')}</td>`;
        }
        t += '</tr>';
      }
      grid.innerHTML = t + '</tbody></table>';
      grid.querySelectorAll('td[data-r]').forEach((td) => td.addEventListener('click', () => { const x = grid.scrollLeft, y = grid.scrollTop; sel = td.dataset.r; pintar(); grid.scrollLeft = x; grid.scrollTop = y; }));
      const tdSel = grid.querySelector('td.sel');
      if (tdSel && centrar) { grid.scrollLeft = Math.max(0, tdSel.offsetLeft - grid.clientWidth / 2); centrar = false; }
      tabs.innerHTML = H.hojas.map((x) => `<button type="button" class="${x.nombre === hoja ? 'on' : ''}" data-h="${x.nombre}">${x.nombre}</button>`).join('');
      tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { hoja = b.dataset.h; centrar = true; sel = hoja === 'Cuadro' ? 'X6' : hoja === 'Demanda' ? 'B19' : hoja === 'Acometida' ? 'B10' : 'A1'; pintar(); }));
      const cel = h.celdas[sel];
      barra.innerHTML = `<span class="nm">${sel}</span><span class="fxi">fx</span><code>${cel ? String(cel.f ? F(cel.f) : cel.v).replace(/</g, '&lt;') : ''}</code>`;
      sim.set('ref', `${hoja}!${sel}`);
      sim.set('tipo', !cel ? 'vacía' : cel.f ? 'fórmula' : cel.s === 'dato' ? 'dato del caso (azul)' : 'texto');
      sim.set('val', cel ? (cel.f ? fmtCalc(cel) : fmtVal(cel)) : '—');
    };
    sim.onChange = pintar;
    pintar();
  });

  RT.PASOS.hoja = [
    { t: 'Abrir la plantilla', donde: 'Kit ▸ E04_unifilar_cuadro/cuadro-de-cargas.xlsx · LibreOffice Calc o Excel',
      html: '<p>Abra la plantilla en LibreOffice Calc (libre) o en Excel. Guarde de inmediato una copia con el nombre del caso: <code>E04_cuadro_v1_aaaa-mm-dd.xlsx</code> (u <code>.ods</code> en LibreOffice).</p><p>La hoja <b>Léame</b> explica el código de colores. No cambie los nombres de las hojas: las fórmulas los usan.</p>',
      verif: 'En la hoja Demanda, la celda B19 muestra 12 780 VA con los datos de la casa ejemplo.' },
    { t: 'Cambiar los datos de los circuitos', donde: 'Hoja Cuadro ▸ celdas azules (columnas A a H, K a N y U)',
      html: '<ol><li>Por cada circuito del caso: número de tomas generales, potencia de luminarias y salidas especiales, mínimo por norma (1 500 VA en pequeños artefactos y lavandería), protección, calibres, tubo y longitud al punto más lejano.</li><li>Los calibres se escogen de la lista desplegable (14, 12, 10…).</li></ol>',
      verif: 'La columna R dice «Cumple» en todos los circuitos; si dice «Revisar», la protección es menor que la corriente o mayor que la permitida para el calibre.' },
    { t: 'Agregar o quitar circuitos', donde: 'Seleccionar la fila completa ▸ copiar ▸ insertar filas copiadas',
      html: '<ol><li>Para agregar un circuito, copie una fila completa de circuito y péguela insertándola dentro del bloque de circuitos (no debajo de los totales): así se copian también las fórmulas.</li><li>Para quitar uno, elimine la fila completa.</li><li>Revise que las sumas de la fila de totales (columnas I, S y T) abarquen todas las filas.</li></ol>',
      ojo: 'Escribir el valor de una fórmula a mano «para que cuadre». Se pierde la trazabilidad y en la sustentación no se puede explicar el número.' },
    { t: 'Demanda y acometida', donde: 'Hojas Demanda y Acometida ▸ celdas azules',
      html: '<ol><li>Demanda: área construida por caras exteriores, número de circuitos de pequeños artefactos y lavandería, potencia de la estufa y de los artefactos fijos.</li><li>Acometida: calibre y longitud del medidor al tablero con bajantes.</li></ol>',
      verif: 'La caída de la acometida (Acometida!B10) es menor que 3 % y la caída total de cada circuito (Cuadro, columna X) menor que 5 %.' },
    { t: 'Balance de fases', donde: 'Hoja Cuadro ▸ columna D (fase) · totales de S y T',
      html: '<p>Cambie la fase de los circuitos hasta que el desbalance (debajo de los totales) quede por debajo de 10 %. La disposición debe coincidir con la del tablero (capítulos 24 y 31).</p>',
      verif: 'Con la casa ejemplo: fase A 8 722 VA, fase B 8 940 VA, desbalance 1,2 %.' },
    { t: 'Imprimir y llevar a la memoria', donde: 'Archivo ▸ Exportar como PDF · copiar la tabla',
      html: '<ol><li>La hoja Cuadro ya está configurada en A3 horizontal, ajustada al ancho: expórtela a PDF para la lámina E04.</li><li>En la memoria, pegue la tabla y escriba una de las fórmulas con palabras, por ejemplo la caída de tensión: «2 × corriente × resistencia por metro × longitud ÷ tensión».</li></ol>' }
  ];

  RT.PASOS.dialux = [
    { t: 'Instalar y crear el proyecto', donde: 'dialux.com ▸ descarga de DIALux evo · cuenta DIAL',
      html: '<ol><li>Descargue DIALux evo desde la página oficial e instálelo (Windows). Pide una cuenta gratuita.</li><li>Cree un proyecto nuevo de iluminación interior.</li></ol>' },
    { t: 'Dibujar el ambiente o importar la planta', donde: 'Construcción ▸ dibujar el local · o importar el DXF o DWG de la planta',
      html: '<ol><li>Dibuje el local con sus medidas libres: para la sala-comedor, 4,65 × 5,45 m y altura 2,50 m.</li><li>Si prefiere, importe el DXF del kit con solo las capas de arquitectura encendidas y dibuje el local sobre él.</li></ol>',
      verif: 'El área del local coincide con la del plano: 25,34 m² en la sala-comedor de la casa ejemplo.' },
    { t: 'Materiales y reflectancias', donde: 'Propiedades del local ▸ techo, paredes, piso',
      html: '<p>Asigne reflectancias típicas y anótelas en la memoria: techo 70 %, paredes 50 %, piso 20 %. Fije el plano útil a 0,75 m.</p>' },
    { t: 'Escoger las luminarias', donde: 'Luminarias ▸ catálogos de fabricantes o luminaria genérica',
      html: '<ol><li>Use la luminaria de un fabricante (archivo fotométrico LDT o IES) parecida a la del proyecto, o una genérica.</li><li>Para la casa ejemplo: panel o plafón LED de 24 W y 2 400 lm.</li></ol>',
      ojo: 'Escoger una luminaria por su foto: lo que importa es su flujo (lm), su potencia (W) y su curva de distribución.' },
    { t: 'Ubicar las luminarias', donde: 'Luminarias ▸ disposición en campo o una a una',
      html: '<p>Ubique las luminarias en las mismas posiciones del plano E01: en la casa ejemplo, LS1 en (1,50; 2,20), LS2 en (3,30; 2,20) y LC en (2,40; 4,40), medidas desde el eje A-1, a 2,50 m de altura.</p>' },
    { t: 'Calcular y leer resultados', donde: 'Cálculo ▸ iniciar · superficies de cálculo',
      html: '<p>Inicie el cálculo y lea en la superficie del plano útil la iluminancia media (Em), la mínima y la uniformidad U0 = Emín/Em. Compárelas con el método de los lúmenes del capítulo 20.</p>',
      verif: 'La iluminancia media queda cerca del criterio de diseño (150 lx en la sala-comedor). Si la diferencia con el método de los lúmenes es grande, revise reflectancias, factor de mantenimiento y altura.' },
    { t: 'Documentar', donde: 'Documentación ▸ generar PDF',
      html: '<p>Genere el informe en PDF con la planta de isolíneas o colores falsos y la tabla de resultados, y anéxelo a la memoria con una frase que diga qué decisión de E01 respalda.</p>' }
  ];

  RT.PASOS.qet = [
    { t: 'Instalar y crear el proyecto', donde: 'qelectrotech.org ▸ descarga · Archivo ▸ Nuevo',
      html: '<ol><li>Descargue QElectroTech desde su página oficial; es libre y gratuito.</li><li>Cree un proyecto nuevo: trae un folio (página) en blanco.</li></ol>' },
    { t: 'Rótulo del folio', donde: 'Propiedades del folio ▸ cartucho',
      html: '<p>Llene el cartucho o rótulo con el proyecto, la lámina (E04), la fecha, la versión y los integrantes, igual que las demás láminas.</p>' },
    { t: 'Buscar los símbolos', donde: 'Panel de colecciones ▸ colección QET ▸ carpeta eléctrica',
      html: '<p>En la colección de elementos busque los que usa el unifilar: interruptor automático, interruptor diferencial, contador o medidor, barras, toma de tierra y transformador. Use el buscador del panel para encontrarlos por nombre.</p>',
      verif: 'Los símbolos coinciden con los de la Tabla 1.3.4.a (capítulo 26); si usa uno distinto, declárelo en las convenciones.' },
    { t: 'Dibujar el unifilar', donde: 'Arrastrar elementos al folio · conectar bornes',
      html: '<ol><li>Arrastre al folio: transformador o red, medidor, totalizador, barras y un interruptor por circuito.</li><li>Una los bornes arrastrando desde un borne hasta otro: QElectroTech crea el conductor.</li><li>Agregue el diferencial del circuito de la ducha y las barras de neutro y tierra con el puente.</li></ol>' },
    { t: 'Rotular protecciones y conductores', donde: 'Doble clic en el elemento ▸ textos e informaciones',
      html: '<p>En cada interruptor escriba circuito, polos y corriente (<code>C7 · 1P 30 A</code>); en cada rama, los conductores (<code>2 × 10 AWG + T 10 AWG</code>) y el tubo. Los datos salen del cuadro de cargas.</p>',
      verif: 'Cada rama del unifilar tiene el mismo calibre y protección que la fila del cuadro de cargas.' },
    { t: 'Exportar', donde: 'Archivo ▸ Exportar (PNG, SVG, DXF) · Imprimir a PDF',
      html: '<p>Exporte el folio a PDF para la lámina E04, y a SVG o DXF si lo va a ensamblar en LibreCAD o AutoCAD con el cuadro de cargas.</p>' }
  ];
})();
