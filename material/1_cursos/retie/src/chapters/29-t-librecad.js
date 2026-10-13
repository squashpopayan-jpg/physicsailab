/* Capítulo 29 — Taller de LibreCAD */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C;

  RT.LAMINAS_DXF = {
    A01: ['A-EJES', 'A-MUROS', 'A-VANOS', 'A-MOBILIARIO', 'A-NOMBRES', 'A-COTAS', 'S-COLUMNAS', 'S-VIGAS', 'X-MARCO', 'X-LEYENDA'],
    E01: ['A-EJES', 'A-MUROS', 'A-VANOS', 'A-MOBILIARIO', 'A-NOMBRES', 'S-COLUMNAS', 'E-ILUMINACION', 'E-TABLERO', 'E-ETIQUETAS', 'X-MARCO', 'X-LEYENDA'],
    E02: ['A-EJES', 'A-MUROS', 'A-VANOS', 'A-MOBILIARIO', 'A-NOMBRES', 'S-COLUMNAS', 'E-TOMAS', 'E-ESPECIALES', 'E-TABLERO', 'E-ETIQUETAS', 'X-MARCO', 'X-LEYENDA'],
    E03: ['A-EJES', 'A-MUROS', 'A-VANOS', 'S-COLUMNAS', 'S-VIGAS', 'E-ILUMINACION', 'E-TOMAS', 'E-ESPECIALES', 'E-TABLERO', 'E-CANAL-LOSA', 'E-CANAL-PISO', 'E-ETIQUETAS', 'X-MARCO', 'X-LEYENDA'],
    E04: ['A-EJES', 'A-MUROS', 'A-VANOS', 'S-COLUMNAS', 'E-TABLERO', 'E-ACOMETIDA', 'E-TIERRA', 'E-ETIQUETAS', 'X-MARCO', 'X-LEYENDA']
  };

  RT.defineSim('capas-dxf', function (sim) {
    const D = RT.dibujoCasa(K);
    const cv = sim.canvas({ aspect: 0.86, maxH: '760px' });
    const lista = RT.el('div', 'capas-lista');
    sim.stage.append(lista);
    let on = new Set(RT.LAMINAS_DXF.E02);
    sim.group('Lámina');
    sim.seg('lam', { options: [['A01', 'A01'], ['E01', 'E01'], ['E02', 'E02'], ['E03', 'E03'], ['E04', 'E04'], ['todo', 'Todo']], value: 'E02', onInput: (v) => { on = new Set(v === 'todo' ? D.capas.map((c) => c.n) : RT.LAMINAS_DXF[v]); } });
    sim.seg('vista', { label: 'Encuadre', options: [['casa', 'Casa'], ['lamina', 'Lámina A3']], value: 'casa' });
    sim.out('xy', 'Cursor (mm)', { hl: true });
    sim.out('n', 'Capas encendidas');
    sim.out('ent', 'Entidades visibles');
    RT.botonDescarga(sim.ctrlBox, 'Descargar DXF (ZIP)', () => ['casa-ejemplo-dxf.zip', RT.zip([{ name: 'LEAME.txt', data: '﻿' + RT.leameKit() }, { name: 'casa-ejemplo.dxf', data: RT.dxfBytes(D) }]), 'application/zip'], { primary: true });
    sim.note('El DXF va dentro de un ZIP porque el visor de la guía no entrega archivos .dxf sueltos. Descomprímalo antes de abrirlo.');
    let tr = null;
    const oscuro = () => { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(RT.col('--canvas')); return m ? 0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3] < 110 : false; };
    const pintarLista = () => {
      const ac = { 1: '#FF0000', 5: '#0000FF', 6: '#FF00FF', 8: '#808080', 9: '#A8A8A8', 30: '#FF7F00', 90: '#00A000', 150: '#007FFF', 210: '#FF00FF', 240: '#FF003F', 251: '#505050', 252: '#696969' };
      lista.innerHTML = D.capas.map((c) => `<button type="button" class="capa${on.has(c.n) ? ' on' : ''}" data-c="${c.n}" aria-pressed="${on.has(c.n)}"><span class="sw" style="background:${ac[c.c] || 'var(--ink)'}"></span><code>${c.n}</code><small>${c.lt === 'CONTINUOUS' ? '' : c.lt + ' · '}${c.d}</small></button>`).join('');
      lista.querySelectorAll('button[data-c]').forEach((b) => b.addEventListener('click', () => { const n = b.dataset.c; on.has(n) ? on.delete(n) : on.add(n); sim.redraw(); }));
    };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const e = sim.p.vista === 'casa' ? D.casaExt : D.ext;
      const s = Math.min((W - 16) / (e[2] - e[0]), (H - 16) / (e[3] - e[1]));
      const ox = (W - (e[2] - e[0]) * s) / 2 - e[0] * s, oy = (H - (e[3] - e[1]) * s) / 2 + e[3] * s;
      tr = { s, ox, oy };
      const osc = oscuro();
      RT.pintarDibujo(ctx, D, { s, ox, oy, on, tinta: RT.col('--ink'), fondo: RT.col('--canvas'), lw: 1, oscuro: osc, font: RT.FONT_UI });
      /* origen */
      ctx.strokeStyle = RT.col('--accent'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ox - 9, oy); ctx.lineTo(ox + 9, oy); ctx.moveTo(ox, oy - 9); ctx.lineTo(ox, oy + 9); ctx.stroke();
      RT.text(ctx, '0,0', ox + 5, oy + 13, { size: 10.5, color: '--accent', mono: true });
      pintarLista();
      sim.set('n', `${[...on].length} de ${D.capas.length}`);
      sim.set('ent', String(D.ents.filter((x) => on.has(x.l)).length));
    });
    RT.pointer(cv, {
      hover: (x, y) => { if (tr) sim.set('xy', `${C.fmt(((x - tr.ox) / tr.s) * 1000, 0)} ; ${C.fmt(((tr.oy - y) / tr.s) * 1000, 0)}`); return false; },
      leave: () => sim.set('xy', '—')
    });
  });

  RT.PASOS.librecad = [
    { t: 'Instalar y poner en español', donde: 'librecad.org ▸ Download · Opciones ▸ Preferencias de la aplicación (Options ▸ Application Preferences) ▸ Apariencia',
      html: '<ol><li>Descargue LibreCAD 2.2.1 desde la página oficial (<a href="https://librecad.org">librecad.org</a>) o desde las versiones publicadas en GitHub. Es gratuito y no pide cuenta.</li><li>En <b>Preferencias de la aplicación ▸ Apariencia</b> ponga la interfaz en <b>español</b> y deje el idioma de la <b>línea de comandos en inglés</b>: así funcionan los alias de esta guía (<code>li</code>, <code>re</code>, <code>mo</code>…).</li><li>Reinicie el programa.</li></ol>',
      verif: 'Los menús están en español y al escribir <code>li</code> en la línea de comandos se activa la herramienta de línea.',
      ojo: 'Traducir también la línea de comandos: los alias cambian y los ejemplos dejan de funcionar.' },
    { t: 'Configurar el dibujo en milímetros', donde: 'Opciones ▸ Preferencias del dibujo actual (Options ▸ Current Drawing Preferences)',
      html: '<ul><li><b>Unidades:</b> unidad principal <b>milímetro</b>; longitud decimal con 0 decimales; ángulos en grados decimales.</li><li><b>Papel:</b> A3, vertical.</li><li><b>Cotas:</b> altura de texto <code>125</code> y flecha <code>100</code>: a 1:50 equivalen a 2,5 mm y 2 mm en el papel.</li></ul><p>Se dibuja en tamaño real (1 unidad = 1 mm) y la escala se fija solo al imprimir.</p>',
      verif: 'Escriba <code>li</code>, luego <code>0,0</code> y <code>@1000,0</code>: la línea mide 1 000 mm (1 m) en la barra de estado. Bórrela.',
      ojo: 'Dibujar «a escala» dividiendo las medidas entre 50. Las cotas salen mal y nadie más puede usar el archivo.' },
    { t: 'Partir del DXF del kit o crear las capas', donde: 'Archivo ▸ Abrir · Widgets ▸ Dock Widgets ▸ Lista de capas (Layer List)',
      html: '<p><b>Con el kit:</b> abra <code>casa-ejemplo.dxf</code> y guárdelo con otro nombre (<code>CASO_A01_v1.dxf</code>). Trae todas las capas, los tipos de línea y los bloques; borre la geometría de la casa ejemplo y conserve el marco y las convenciones.</p><p><b>Desde cero:</b> en la lista de capas, el botón <b>+</b> crea una capa con nombre, color, tipo de línea y grosor. Cree las mismas de la tabla del simulador, con los mismos nombres.</p><p>Cree además <code>A-PLANO-BASE</code> para la imagen del plano y bloquéela (candado) después del paso 4.</p>',
      verif: 'La lista de capas muestra las capas A-, S-, E- y X-; la capa <code>S-CIMENTACION</code> viene apagada.' },
    { t: 'Insertar y escalar el plano del caso', donde: 'Archivo ▸ Importar ▸ Insertar imagen (File ▸ Import ▸ Insert Image) · Info ▸ Distancia · Modificar ▸ Escalar',
      html: '<ol><li>Con la capa <code>A-PLANO-BASE</code> activa, inserte la imagen del plano propio en <code>0,0</code>.</li><li>Mida con la herramienta de distancia entre dos puntos una cota conocida de la imagen, por ejemplo entre dos ejes.</li><li>Calcule el factor: <b>medida real ÷ medida en pantalla</b>. Si la cota real es 8 000 mm y la imagen mide 2 133, el factor es 3,7506.</li><li>Seleccione la imagen y aplique <b>Escalar</b> con punto base en un cruce de ejes y ese factor.</li><li>Mueva la imagen para que el cruce A-1 quede en <code>0,0</code> y bloquee la capa.</li></ol>',
      verif: 'Mida una segunda cota que no usó: debe coincidir con la del plano con menos de 1 % de diferencia. Anote ambas en el A01.',
      ojo: 'Escalar con una cota que en el plano original estaba mal escrita. Compruebe siempre con una segunda medida.' },
    { t: 'Dibujar los ejes', donde: 'Capa A-EJES · comandos li, ci, tx',
      html: '<ol><li>Eje A: <code>li</code>, <code>0,-1100</code>, <code>@0,12100</code>. Ejes B y C igual desde <code>4800,-1100</code> y <code>8000,-1100</code>.</li><li>Ejes 1, 2 y 3: <code>li</code>, <code>-1100,0</code>, <code>@10200,0</code>, y desde <code>-1100,5600</code> y <code>-1100,10000</code>.</li><li>Burbujas: <code>ci</code> con centro en el extremo del eje desplazado 250 mm y radio <code>250</code>; letra o número con <code>tx</code> de 200 mm, centrado.</li></ol><p>El tipo de línea CENTER de la capa da el trazo y punto característico de los ejes.</p>',
      verif: 'La distancia entre los ejes A y C es 8 000 mm y entre 1 y 3, 10 000 mm.' },
    { t: 'Muros como rectángulos rellenos', donde: 'Capa A-MUROS · comandos re y ha (relleno SOLID)',
      html: '<p>Cada tramo de muro entre vanos es un rectángulo de 150 mm de ancho centrado en su eje. Así el relleno es inmediato y los cambios son locales.</p><ol><li>Primer tramo de la fachada sur, de la esquina a la puerta P1: <code>re</code>, <code>-75,-75</code>, <code>@1075,150</code>.</li><li>Siga con los demás tramos; los muros que no van sobre ejes (en la casa ejemplo M2, M4, M5 y M6) se ubican con su cota desde el eje más cercano.</li><li>Rellene cada rectángulo con <code>ha</code>, patrón <b>SOLID</b>.</li></ol>',
      verif: 'Encienda solo <code>A-MUROS</code>: los vanos quedan abiertos y los espesores miden 150 mm.',
      ojo: 'Dibujar los muros con líneas sueltas: el relleno no encuentra un contorno cerrado y cada corrección rompe las intersecciones.' },
    { t: 'Puertas y ventanas', donde: 'Capa A-VANOS · comandos li, mo y arco por centro',
      html: '<ul><li><b>Ventana:</b> cuatro líneas paralelas al eje dentro del vano (en las dos caras y a un tercio del espesor) y dos líneas cortas en las jambas.</li><li><b>Puerta:</b> la hoja es una línea del ancho de la puerta perpendicular al muro, desde la bisagra; el giro es un arco de 90° con centro en la bisagra. Para P1: centro <code>1000,75</code>, radio <code>900</code>, de 0° a 90°.</li></ul><p>Dibuje el giro hacia donde abre la puerta: los interruptores van del lado de la chapa (capítulo 20).</p>',
      verif: 'La casa ejemplo tiene 6 puertas, 7 ventanas y 2 vanos sin puerta: cuéntelos con la capa encendida.' },
    { t: 'Estructura', donde: 'Capas S-COLUMNAS y S-VIGAS · comandos re, ha, mv',
      html: '<ol><li>Columna en A-1: <code>re</code>, <code>-150,-150</code>, <code>@300,300</code>, relleno SOLID.</li><li>Cópiela a los demás cruces con <code>mv</code>: punto base <code>0,0</code>, destino <code>4800,0</code>, y en el cuadro de opciones escoja <b>conservar el original</b>.</li><li>Vigas: rectángulos de 300 mm de ancho sobre cada eje, de cara a cara de columna, en la capa <code>S-VIGAS</code> (línea oculta: la viga está arriba, se proyecta).</li></ol>',
      verif: 'Nueve columnas, doce tramos de viga. La columna B-2 está en (4800, 5600).' },
    { t: 'Nombres, áreas y cotas', donde: 'Capas A-NOMBRES y A-COTAS · comandos tx, dh, dv',
      html: '<ol><li>Nombre de cada ambiente con <code>tx</code> de 175 mm de alto (3,5 mm en papel) y, debajo, el área libre con 125 mm.</li><li>Cotas entre ejes con <code>dh</code> y <code>dv</code>, a 750 mm por fuera de la fachada; cotas totales a 1 250 mm.</li></ol><p>Las áreas libres de la casa ejemplo están en la capa <code>A-NOMBRES</code> del kit; para el caso propio, mídalas con la herramienta de área o calcúlelas con las cotas interiores.</p>',
      verif: 'Las cotas entre ejes suman la cota total menos el espesor de un muro: 4 800 + 3 200 = 8 000; total 8 150.' },
    { t: 'Los símbolos como bloques', donde: 'Lista de bloques (Block List) ▸ Crear bloque · Insertar el bloque activo',
      html: '<p>Los símbolos del kit ya son bloques: <code>P-LUM</code>, <code>P-APLIQUE</code>, <code>P-INT</code>, <code>P-INT2</code>, <code>P-CONM</code>, <code>P-TOMA</code>, <code>P-DUCHA</code>, <code>P-ESTUFA</code>, <code>P-TABLERO</code>, <code>P-MEDIDOR</code> y <code>P-TIERRA</code>. Para pasarlos a su dibujo, cópielos del kit (<kbd>Ctrl</kbd>+<kbd>C</kbd> con punto de referencia) y péguelos (<kbd>Ctrl</kbd>+<kbd>V</kbd>).</p><p>Para crear uno nuevo:</p><ol><li>Dibuje el símbolo en la <b>capa 0</b>, centrado en un punto, a tamaño de papel por 50 (unos 260 mm de ancho).</li><li>Selecciónelo, <b>Crear bloque</b>, punto de referencia en el centro, nombre con el prefijo <code>P-</code>.</li><li>Borre el original.</li></ol><p>Al insertarlo en la capa <code>E-TOMAS</code>, el bloque toma el color de esa capa porque se dibujó en la capa 0.</p>',
      verif: 'Edite el bloque <code>P-TOMA</code> y cambie algo: todas las tomas del plano cambian a la vez.',
      ojo: 'Dibujar el símbolo en la capa E-TOMAS antes de convertirlo en bloque: al insertarlo en otra capa conserva el color equivocado.' },
    { t: 'E01: alumbrado', donde: 'Capas E-ILUMINACION y E-ETIQUETAS · Insertar bloque',
      html: '<ol><li>Inserte <code>P-LUM</code> en el centro de cada luminaria (según el cálculo del capítulo 20) y <code>P-APLIQUE</code> en las fachadas.</li><li>Inserte los interruptores sobre la cara del muro, del lado de la chapa, girados hacia el ambiente.</li><li>Escriba el código de cada punto en <code>E-ETIQUETAS</code> con <code>tx</code> de 90 mm.</li><li>Opcional: arcos punteados del interruptor a lo que controla.</li></ol>',
      verif: 'Cada luminaria tiene un interruptor que la controla y los dos conmutables (S5 y S6) están en los extremos del recorrido hall–sala.' },
    { t: 'E02: tomas y salidas especiales', donde: 'Capas E-TOMAS, E-ESPECIALES y E-TABLERO',
      html: '<ol><li>Inserte <code>P-TOMA</code> en cada toma, con rotación de 0°, 90°, 180° o 270° para que las patas miren al ambiente.</li><li>Marque <b>GFCI</b> encima de las tomas con interruptor de falla a tierra y el circuito (<code>C4</code>…) junto a cada una.</li><li>Inserte <code>P-DUCHA</code>, <code>P-ESTUFA</code> y el tablero <code>P-TABLERO</code>.</li></ol>',
      verif: 'Revise con el capítulo 21: ningún punto de la línea de piso de sala y alcobas queda a más de 1,8 m de una toma, y el mesón no tiene puntos a más de 600 mm.' },
    { t: 'E03: canalizaciones', donde: 'Capas E-CANAL-LOSA y E-CANAL-PISO · comando pl',
      html: '<ol><li>Siga el árbol de cada circuito (capítulo 22): del tablero a la primera caja y de caja en caja.</li><li>Por la <b>losa</b>: polilínea con segmentos en arco en <code>E-CANAL-LOSA</code> (línea continua).</li><li>Por el <b>contrapiso</b>: polilínea recta en <code>E-CANAL-PISO</code> (línea discontinua por capa).</li><li>Junto al tablero, rotule cada salida con su circuito; en los tramos, marque los conductores (fase, neutro, tierra, retorno) con la convención del capítulo 22.</li></ol>',
      verif: 'Encienda <code>S-VIGAS</code> con las canalizaciones: los cruces con vigas coinciden con los del capítulo 23.' },
    { t: 'Lámina A3 a 1:50 y PDF', donde: 'Capa X-MARCO · Archivo ▸ Vista previa de impresión (Print Preview) · Archivo ▸ Exportar ▸ PDF',
      html: '<ol><li>El marco A3 a 1:50 mide 14 850 × 21 000 mm en el modelo; el kit lo trae con el rótulo y las convenciones. Complete el rótulo: lámina, integrantes, fecha y versión.</li><li>Deje encendidas solo las capas de la lámina (tabla de la sección siguiente).</li><li>Abra la <b>vista previa de impresión</b>, escriba la escala <code>1:50</code>, pulse <kbd>Enter</kbd> y marque <b>fija</b> para que no cambie. Active blanco y negro si la lámina lo requiere.</li><li>Exporte a PDF desde el menú <b>Exportar</b> o imprima a una impresora PDF. Nombre: <code>E02_tomas_v2_aaaa-mm-dd.pdf</code>.</li></ol>',
      verif: 'Mida en el PDF impreso a escala real la distancia A–C: debe dar 160 mm (8 000 mm ÷ 50).',
      ojo: 'Usar «ajustar a la página»: la escala queda en 1:47,3 o cualquier otro valor y las medidas sobre el papel ya no sirven.' },
    { t: 'PNG para SketchUp y DXF final', donde: 'Archivo ▸ Exportar ▸ Exportar como imagen · Archivo ▸ Guardar como ▸ DXF',
      html: '<ol><li>Apague todas las capas menos las de arquitectura (<code>A-</code>) y estructura (<code>S-COLUMNAS</code>, <code>S-VIGAS</code>).</li><li>Exporte como imagen PNG con fondo blanco, de 1 000 a 1 600 px de ancho. No importa la resolución exacta: en SketchUp se escala midiendo A–C.</li><li>Guarde el dibujo como DXF 2007 (o R12 si otro programa del equipo no lo abre) con nombre y fecha.</li></ol>',
      verif: 'En SketchUp, tras escalar con A–C = 8,00 m, la distancia entre 1 y 3 da 10,00 m (taller 1, paso 3).' }
  ];
})();
