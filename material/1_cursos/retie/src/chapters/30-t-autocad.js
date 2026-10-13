/* Capítulo 30 — Taller de AutoCAD */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA;

  const BLOQ = { lum: 'P-LUM', aplique: 'P-APLIQUE', int: 'P-INT', int2: 'P-INT2', conm: 'P-CONM', toma: 'P-TOMA', ducha: 'P-DUCHA', estufa: 'P-ESTUFA' };
  const CAPA = (p) => (['lum', 'aplique', 'int', 'int2', 'conm'].includes(p.tipo) ? 'E-ILUMINACION' : p.tipo === 'toma' ? 'E-TOMAS' : 'E-ESPECIALES');
  RT.extraccion = function (modo) {
    const P = K.electrico.puntos.filter((p) => BLOQ[p.tipo]);
    const grupo = (keyf) => { const m = new Map(); for (const p of P) { const k = keyf(p); m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()]; };
    if (modo === 'bc') return { cab: ['Conteo', 'Nombre', 'CIRCUITO', 'Capa'], filas: grupo((p) => BLOQ[p.tipo] + '|' + p.c + '|' + CAPA(p)).map(([k, n]) => [n, ...k.split('|')]).sort((a, b) => (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : a[1] < b[1] ? -1 : 1)) };
    if (modo === 'b') return { cab: ['Conteo', 'Nombre', 'Capa'], filas: grupo((p) => BLOQ[p.tipo] + '|' + CAPA(p)).map(([k, n]) => [n, ...k.split('|')]).sort((a, b) => (a[1] < b[1] ? -1 : 1)) };
    if (modo === 'amb') {
      const ambs = [...new Set(P.map((p) => p.amb))];
      return { cab: ['Ambiente', 'Luminarias y apliques', 'Interruptores', 'Tomas', 'Especiales', 'Total'], filas: ambs.map((a) => { const q = P.filter((p) => p.amb === a); const n = (f) => q.filter(f).length; return [K.ambiente(a) ? K.ambiente(a).nombre : 'Exterior', n((p) => p.tipo === 'lum' || p.tipo === 'aplique'), n((p) => ['int', 'int2', 'conm'].includes(p.tipo)), n((p) => p.tipo === 'toma'), n((p) => p.tipo === 'ducha' || p.tipo === 'estufa'), q.length]; }) };
    }
    const cs = K.electrico.circuitos.map((c) => c.id);
    return { cab: ['CIRCUITO', 'Luminarias y apliques', 'Interruptores', 'Tomas', 'Especiales', 'Total'], filas: cs.map((c) => { const q = P.filter((p) => p.c === c); const n = (f) => q.filter(f).length; return [c, n((p) => p.tipo === 'lum' || p.tipo === 'aplique'), n((p) => ['int', 'int2', 'conm'].includes(p.tipo)), n((p) => p.tipo === 'toma'), n((p) => p.tipo === 'ducha' || p.tipo === 'estufa'), q.length]; }) };
  };

  RT.defineSim('extraccion-atributos', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    sim.group('Agrupar');
    sim.seg('m', { options: [['bc', 'Bloque y circuito'], ['c', 'Circuito'], ['amb', 'Ambiente'], ['b', 'Bloque']], value: 'bc' });
    sim.out('n', 'Bloques extraídos', { hl: true });
    sim.out('f', 'Filas');
    RT.botonDescarga(sim.ctrlBox, 'Descargar tabla (CSV)', () => { const t = RT.extraccion(sim.p.m); return ['extraccion-esperada.csv', '﻿' + [t.cab.join(';')].concat(t.filas.map((r) => r.join(';'))).join('\r\n'), 'text/csv']; });
    sim.onDraw(() => {
      const t = RT.extraccion(sim.p.m);
      const num = (i) => typeof t.filas[0][i] === 'number';
      box.innerHTML = '<table class="sim-tab cuadro" style="width:100%"><thead><tr>' + t.cab.map((c, i) => `<th${num(i) ? ' class="num"' : ''}>${c}</th>`).join('') + '</tr></thead><tbody>' + t.filas.map((r) => '<tr>' + r.map((v, i) => `<td${num(i) ? ' class="num"' : ''}>${v}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
      sim.set('n', String(K.electrico.puntos.filter((p) => BLOQ[p.tipo]).length));
      sim.set('f', String(t.filas.length));
    });
  });

  RT.PASOS.autocad = [
    { t: 'Abrir el DXF del kit y guardarlo como DWG', donde: 'OPEN ▸ tipo de archivo DXF · SAVEAS · UNITS',
      html: '<ol><li>Con <code>OPEN</code> escoja el tipo <b>DXF</b> y abra <code>casa-ejemplo.dxf</code>.</li><li><code>UNITS</code>: longitud decimal, precisión 0; unidades de inserción <b>milímetros</b>.</li><li><code>SAVEAS</code> en DWG con nombre y versión: <code>CASO_A01_v1.dwg</code>.</li><li><code>ZOOM</code> ▸ <code>E</code> (extensión) para ver todo.</li></ol>',
      verif: '<code>DIST</code> entre los ejes A y C da 8000 y el punto A-1 está en 0,0 (<code>ID</code> sobre el cruce).' },
    { t: 'Revisar capas y tipos de línea', donde: 'LAYER (LA) · PSLTSCALE · REGENALL',
      html: '<ol><li>Abra el administrador de capas con <code>LA</code>: aparecen las capas A-, S-, E- y X- con sus colores; <code>S-CIMENTACION</code> está apagada.</li><li>Los tipos de línea del kit ya están dimensionados para verse bien a 1:50 en el modelo (12 mm de trazo en papel). Escriba <code>PSLTSCALE</code> ▸ <code>0</code> y luego <code>REGENALL</code>, para que en las presentaciones no se vuelvan a escalar.</li></ol>',
      verif: 'Los ejes se ven con trazo y punto, las vigas con trazos cortos y las tuberías por el piso discontinuas, también dentro de una ventana a 1:50.',
      ojo: 'Dejar <code>PSLTSCALE</code> en 1 con tipos de línea en escala de modelo: en la presentación las líneas discontinuas se ven continuas.' },
    { t: 'Traer el plano del caso propio', donde: 'PDFIMPORT · IMAGEATTACH · SCALE ▸ Referencia · ALIGN',
      html: '<ol><li>Si el plano del caso es un PDF vectorial, <code>PDFIMPORT</code> lo convierte en líneas; si es un escaneo, insértelo con <code>IMAGEATTACH</code> en la capa <code>A-PLANO-BASE</code>.</li><li>Escálelo con <code>SCALE</code> (<code>SC</code>): seleccione, punto base en un cruce de ejes, opción <b>Referencia</b> (<code>R</code>), designe los dos extremos de una cota conocida y escriba su valor real en milímetros.</li><li>Si además está girado, <code>ALIGN</code> lo mueve, gira y escala en una sola operación.</li><li>Mueva el cruce A-1 a <code>0,0</code> y bloquee la capa.</li></ol>',
      verif: 'Una segunda cota medida con <code>DIST</code> coincide con el plano a menos de 1 %.' },
    { t: 'Ejes y muros', donde: 'LINE · OFFSET (O) · FILLET (F) radio 0 · TRIM (TR) · HATCH (H)',
      html: '<ol><li>Ejes con <code>LINE</code> en <code>A-EJES</code>; ejes B y C con <code>OFFSET</code> 4800 y 3200.</li><li>Caras de muro: <code>OFFSET</code> 75 a cada lado del eje y cambio a la capa <code>A-MUROS</code>.</li><li>Esquinas: <code>FILLET</code> con radio <code>0</code> une dos líneas en una esquina limpia; <code>TRIM</code> abre las uniones en T y los vanos.</li><li>Relleno: <code>HATCH</code> con patrón <b>SOLID</b> eligiendo un punto dentro de cada tramo cerrado.</li></ol>',
      verif: 'Con solo <code>A-MUROS</code> encendida, los muros quedan cerrados y rellenos, con los vanos abiertos.' },
    { t: 'Bloques con atributos', donde: 'BEDIT · ATTDEF (ATT) · ATTSYNC',
      html: '<p>Los bloques del kit (<code>P-TOMA</code>, <code>P-INT</code>…) traen solo el dibujo. Agrégueles atributos:</p><ol><li><code>BEDIT</code> ▸ <code>P-TOMA</code>.</li><li><code>ATTDEF</code>: etiqueta <code>CODIGO</code>, solicitud «Código del punto», valor por defecto <code>TS1</code>, altura de texto 90, ubicado al lado del símbolo.</li><li>Repita con <code>CIRCUITO</code> (valor por defecto <code>C2</code>) y <code>ALTURA</code> (marque <b>Invisible</b>, valor <code>0,30</code>).</li><li>Cierre el editor guardando y ejecute <code>ATTSYNC</code> ▸ <code>P-TOMA</code>: las tomas ya insertadas reciben los atributos.</li><li>Haga lo mismo con los bloques de interruptores, luminarias y salidas especiales.</li></ol>',
      verif: 'Doble clic sobre una toma abre el editor de atributos con CODIGO, CIRCUITO y ALTURA.',
      ojo: 'Escribir el código como texto suelto además del atributo: después hay dos versiones del mismo dato y una queda desactualizada.' },
    { t: 'Llenar los atributos de cada punto', donde: 'EATTEDIT (doble clic) · INSERT (I) · paleta de bloques',
      html: '<ol><li>Para cada punto, doble clic y escriba su código y circuito según el inventario (capítulo 19) y el cuadro de cargas (capítulo 24).</li><li>Para puntos nuevos, inserte el bloque desde la paleta de bloques en la capa que corresponda: AutoCAD pide los atributos al insertarlo.</li><li>Gire las tomas hacia el ambiente con la rotación de inserción o con <code>ROTATE</code>.</li></ol>',
      verif: 'No hay dos puntos con el mismo código y todos tienen circuito. La extracción del paso 12 lo comprueba.' },
    { t: 'Canalizaciones con polilíneas', donde: 'PLINE (PL) ▸ Arco (A) · capas E-CANAL-LOSA y E-CANAL-PISO',
      html: '<ol><li>Recorridos por la losa: <code>PLINE</code> y la opción <b>Arco</b> entre caja y caja, en <code>E-CANAL-LOSA</code>.</li><li>Recorridos por el contrapiso: <code>PLINE</code> recta en <code>E-CANAL-PISO</code> (discontinua por capa).</li><li>Rótulo del circuito en cada salida del tablero y marcas de conductores en cada tramo.</li><li>Longitud de un recorrido: seleccione la polilínea y mire la longitud en <code>PROPERTIES</code>, o use <code>LIST</code>.</li></ol>',
      verif: 'La longitud de las polilíneas de un circuito, sumada a las bajantes, coincide con la del capítulo 22 dentro de unos centímetros.' },
    { t: 'Textos y cotas anotativos', donde: 'STYLE · DIMSTYLE ▸ Anotativo · escala de anotación 1:50',
      html: '<ol><li>Cree un estilo de texto <b>anotativo</b> con altura de papel 2,5 mm y un estilo de cota anotativo con texto de 2,5 mm y flechas de 2 mm.</li><li>En la barra de estado fije la escala de anotación del modelo en <b>1:50</b>.</li><li>Con esos estilos, el texto mide 125 mm en el modelo y 2,5 mm en el papel, sin cálculos.</li></ol><p>Los textos del kit tienen altura fija (125 mm, 175 mm), ya pensada para 1:50; si cambia de escala, cámbielos a anotativos.</p>',
      verif: 'Una cota acotada en el modelo se ve con texto de 2,5 mm en la ventana a 1:50.' },
    { t: 'Una presentación por lámina', donde: 'Pestaña de presentación ▸ PAGESETUP · MVIEW · escala de la ventana',
      html: '<ol><li>Cree las presentaciones <code>A01</code>, <code>E01</code>, <code>E02</code>, <code>E03</code> y <code>E04</code>.</li><li>En <code>PAGESETUP</code>: trazador <b>DWG To PDF.pc3</b>, papel ISO A3 (297 × 420 mm), escala 1:1, estilo de trazado <b>monochrome.ctb</b> si se imprime en negro.</li><li>Inserte el rótulo en el espacio papel a tamaño real y abra una ventana con <code>MVIEW</code>.</li><li>Dentro de la ventana fije la escala <b>1:50</b> desde la barra de estado y bloquee la ventana: selecciónela, clic derecho ▸ <b>Display Locked ▸ Yes</b> (visualización bloqueada).</li></ol><p>Opción rápida: imprimir desde el modelo con una ventana de trazado en el marco <code>X-MARCO</code> del kit a escala 1:50.</p>',
      verif: 'En la presentación, <code>DIST</code> entre A y C, medido en el papel, da 160 mm.' },
    { t: 'Capas congeladas por ventana', donde: 'LAYER ▸ columna VP Freeze (congelar en la ventana actual) · LAYERSTATE',
      html: '<ol><li>Entre a la ventana de la presentación <code>E01</code> (doble clic dentro).</li><li>En el administrador de capas, congele <b>solo en esa ventana</b> las capas que no van: <code>E-TOMAS</code>, <code>E-CANAL-*</code>, <code>A-COTAS</code>…</li><li>Repita en cada presentación según la tabla del capítulo 29.</li><li>Opcional: guarde la combinación con <code>LAYERSTATE</code> para reutilizarla en otro proyecto.</li></ol><p>Así hay un solo modelo y cinco láminas: un cambio en el modelo aparece en todas.</p>',
      verif: 'Las cinco presentaciones muestran contenidos distintos sin haber copiado el dibujo.',
      ojo: 'Copiar el dibujo cinco veces, una por lámina. Al corregir una toma hay que corregirla cinco veces y alguna queda distinta.' },
    { t: 'Diagrama unifilar (E04)', donde: 'Presentación E04 · INSERT del SVG convertido o dibujo con bloques',
      html: '<ol><li>El unifilar no está a escala: dibújelo en el espacio papel de la presentación <code>E04</code> o en un área aparte del modelo.</li><li>Use los símbolos de la Tabla 1.3.4.a como bloques: totalizador, interruptores, diferencial, barras de neutro y tierra, electrodo.</li><li>Como referencia, el kit trae el unifilar de la casa ejemplo en SVG (apéndice B); para pasarlo a AutoCAD, conviértalo a DXF o PDF y use <code>PDFIMPORT</code>.</li></ol>',
      verif: 'Cada rama tiene circuito, protección, calibres de fase, neutro y tierra, tubo y carga, igual que el cuadro de cargas.' },
    { t: 'Extracción de datos para el cuadro de cargas', donde: 'DATAEXTRACTION ▸ nueva extracción ▸ bloques ▸ atributos ▸ tabla o archivo',
      html: '<ol><li><code>DATAEXTRACTION</code> ▸ crear una extracción nueva ▸ objetos del dibujo actual.</li><li>En la lista de objetos deje solo los bloques <code>P-…</code>.</li><li>En las propiedades marque <b>Nombre</b>, <b>Capa</b> y los atributos <b>CODIGO</b> y <b>CIRCUITO</b>.</li><li>Agrupe por nombre y circuito (combinar filas idénticas, mostrar conteo) y desmarque CODIGO para que cuente.</li><li>Salida: tabla en el dibujo y archivo XLSX o CSV para la hoja de cálculo del cuadro de cargas.</li></ol>',
      verif: 'La tabla coincide con la «extracción esperada» de la sección siguiente.' },
    { t: 'Publicar el PDF y preparar la entrega', donde: 'PUBLISH · AUDIT · PURGE · ETRANSMIT',
      html: '<ol><li><code>AUDIT</code> y <code>PURGE</code> para limpiar el dibujo.</li><li><code>PUBLISH</code> con las cinco presentaciones: un solo PDF de varias páginas o un PDF por lámina.</li><li><code>SAVEAS</code> en un formato DWG común y, si el docente lo pide, también en DXF.</li><li><code>ETRANSMIT</code> empaqueta el DWG con las imágenes y referencias que use.</li></ol>',
      verif: 'El PDF tiene cinco páginas A3, cada una con su rótulo, y el DWG abre en otro computador sin referencias perdidas.' },
    { t: 'PNG para SketchUp Free', donde: 'Congelar capas E- · PLOT a PNG o PNGOUT',
      html: '<ol><li>Deje visibles solo las capas de arquitectura y estructura.</li><li>Imprima la vista a PNG con el trazador <b>PublishToWeb PNG.pc3</b> (con un tamaño de 1 600 px de ancho, por ejemplo) o use <code>PNGOUT</code> sobre la vista.</li><li>En SketchUp, escale la imagen midiendo A–C = 8,00 m (taller 1, paso 3).</li></ol>',
      verif: 'La comprobación con la segunda cota en SketchUp da menos de 2 cm de diferencia.' }
  ];
})();
