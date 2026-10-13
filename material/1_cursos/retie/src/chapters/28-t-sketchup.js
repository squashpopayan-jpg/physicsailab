/* Capítulo 28 — Taller de SketchUp Free */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C;
  const f2 = (v) => C.fmt(v, 2);

  /* Figuras esquemáticas de los pasos */
  const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;font-family:Barlow,sans-serif" role="img" aria-label="${label}">${body}</svg>`;
  const T = (x, y, t, o = '') => `<text x="${x}" y="${y}" font-size="12" fill="var(--ink-2)" ${o}>${t}</text>`;
  const flecha = '<defs><marker id="skf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="var(--accent)"/></marker></defs>';
  RT.FIG_SK = {
    escala: () => svg(520, 210, flecha +
      '<rect x="60" y="30" width="240" height="150" fill="var(--surface-2)" stroke="var(--rule-strong)"/>' +
      '<line x1="80" y1="20" x2="80" y2="190" stroke="var(--ink-3)" stroke-dasharray="8 3 2 3"/><line x1="280" y1="20" x2="280" y2="190" stroke="var(--ink-3)" stroke-dasharray="8 3 2 3"/>' +
      T(74, 16, 'A') + T(274, 16, 'C') +
      '<line x1="80" y1="105" x2="280" y2="105" stroke="var(--accent)" stroke-width="2" marker-start="url(#skf)" marker-end="url(#skf)"/>' +
      T(130, 98, 'Cinta métrica (T): clic en A, clic en C', 'fill="var(--accent)"') +
      '<rect x="330" y="60" width="170" height="74" rx="5" fill="var(--surface)" stroke="var(--rule-strong)"/>' +
      T(342, 82, 'Cuadro de medidas: 8 ⏎') + T(342, 104, '¿Cambiar el tamaño') + T(342, 120, 'del modelo?  → Sí', 'font-weight="700"'), 'Escalar la imagen con la cinta métrica'),
    muros: () => svg(520, 220, flecha +
      '<rect x="40" y="20" width="160" height="190" fill="var(--l-muro-fill)" stroke="var(--ink)"/><rect x="52" y="32" width="136" height="166" fill="var(--canvas)" stroke="var(--ink)"/>' +
      T(212, 30, '1. R desde (−0,075; −0,075):') + T(222, 46, '8,15;10,15 ⏎', 'font-family="IBM Plex Mono,monospace"') +
      T(212, 76, '2. F sobre el borde, hacia adentro:') + T(222, 92, '0,15 ⏎', 'font-family="IBM Plex Mono,monospace"') +
      T(212, 122, '3. Muros interiores: R de 0,15 m de ancho') + T(222, 138, 'sobre guías de la cinta métrica') +
      T(212, 168, '4. P sobre la cara del anillo:') + T(222, 184, '2,27 ⏎ (fondo de viga)', 'font-family="IBM Plex Mono,monospace"'), 'Muros a partir del contorno'),
    alturas: () => {
      const z = (v) => 200 - v * 70;
      let b = '<rect x="40" y="' + z(2.62) + '" width="420" height="' + (z(2.5) - z(2.62)) + '" fill="var(--l-estr-fill)" stroke="var(--ink)"/>' +
        '<rect x="40" y="' + z(2.5) + '" width="60" height="' + (z(2.27) - z(2.5)) + '" fill="var(--l-estr-fill)" stroke="var(--ink)"/>' +
        '<rect x="40" y="' + z(2.27) + '" width="60" height="' + (z(0) - z(2.27)) + '" fill="var(--l-muro-fill)" stroke="var(--ink)"/>' +
        '<rect x="300" y="' + z(2.5) + '" width="30" height="' + (z(0) - z(2.5)) + '" fill="var(--l-muro-fill)" stroke="var(--ink)"/>' +
        '<line x1="20" y1="' + z(0) + '" x2="480" y2="' + z(0) + '" stroke="var(--ink)" stroke-width="2"/>';
      b += T(110, z(2.56) + 4, 'Losa 0,12 m: de 2,50 a 2,62 m');
      b += T(110, z(2.3) + 4, 'Viga 0,30 × 0,35: su fondo queda a 2,27 m');
      b += T(110, z(1.2) + 4, 'Muro bajo viga: hasta 2,27 m');
      b += T(340, z(1.2) + 4, 'Muro fuera de ejes');
      b += T(340, z(1.2) + 20, '(M2, M4, M5, M6): hasta 2,50 m');
      return svg(500, 220, b, 'Alturas de muros, vigas y losa');
    },
    puntos: () => {
      const z = (v) => 205 - v * 72;
      const fila = [[0.3, 'Tomas generales 0,30'], [0.45, 'Tomas exteriores 0,45'], [0.6, 'Nevera 0,60'], [1.1, 'Mesón, baño, ropas 1,10'], [1.2, 'Interruptores 1,20'], [1.6, 'Centro del tablero 1,60'], [2.1, 'Ducha 2,10'], [2.5, 'Luminarias en la losa 2,50']];
      let b = '<rect x="40" y="' + z(2.5) + '" width="440" height="' + (z(0) - z(2.5)) + '" fill="var(--l-muro-fill)" opacity="0.35" stroke="var(--ink-3)"/>' +
        '<line x1="20" y1="' + z(0) + '" x2="500" y2="' + z(0) + '" stroke="var(--ink)" stroke-width="2"/>';
      fila.forEach(([h, t], i) => {
        const x = 60 + i * 54;
        b += `<line x1="${x}" y1="${z(0)}" x2="${x}" y2="${z(h)}" stroke="var(--accent)" stroke-dasharray="3 2"/><rect x="${x - 6}" y="${z(h) - 5}" width="12" height="10" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.5"/>`;
        b += `<text x="${x + 8}" y="${z(h) - 9}" font-size="10.5" fill="var(--ink-2)" transform="rotate(-28 ${x + 8} ${z(h) - 9})">${t}</text>`;
      });
      return svg(520, 220, b, 'Alturas de los puntos eléctricos');
    },
    sigueme: () => svg(520, 190, flecha +
      '<polyline points="60,170 60,60 300,60 300,40" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 3"/>' +
      '<ellipse cx="60" cy="170" rx="14" ry="5" fill="none" stroke="var(--ink)" stroke-width="2"/>' +
      T(80, 178, '1. Círculo de 0,0107 m de radio, perpendicular a la ruta') +
      T(70, 52, '2. Ruta trazada con Línea (L) sobre guías') +
      T(310, 92, '3. Seleccione la ruta,') + T(310, 108, '   Sígueme y clic en el círculo') +
      T(310, 134, '4. Grupo ▸ etiqueta E-CANAL', 'font-weight="700"'), 'Tubería con la herramienta Sígueme')
  };

  const P = K.electrico.puntos;
  const cuenta = (f) => P.filter(f).length;
  const nLum = cuenta((p) => p.tipo === 'lum'), nApl = cuenta((p) => p.tipo === 'aplique');
  const nInt = cuenta((p) => ['int', 'int2', 'conm'].includes(p.tipo));
  const nToma = cuenta((p) => p.tipo === 'toma'), nGfci = cuenta((p) => p.tipo === 'toma' && p.gfci);
  const nEsp = cuenta((p) => p.tipo === 'ducha' || p.tipo === 'estufa');
  const tg = K.punto('TG'), xd = K.punto('XD');
  const dTD = Math.hypot(xd.x - tg.x, xd.y - tg.y);

  RT.PASOS.sketchup = [
    { t: 'Crear el modelo en metros', donde: 'app.sketchup.com ▸ Crear nuevo ▸ plantilla en metros · Información del modelo ▸ Unidades',
      html: '<ol><li>Inicie sesión y cree un modelo nuevo con una plantilla en <b>metros</b> (las de arquitectura o la simple en metros).</li><li>Abra <b>Información del modelo ▸ Unidades</b>: formato <b>Decimal</b>, longitud en <b>metros</b>, precisión <b>0,00</b>; active la opción de ajustar la longitud.</li><li>Borre la figura humana de la plantilla (<kbd>E</kbd> o seleccionar y <kbd>Supr</kbd>).</li><li>Guarde de inmediato con el nombre <code>M3D_casa_v1_aaaa-mm-dd</code>.</li></ol>',
      verif: 'Dibuje una línea cualquiera, escriba <code>1</code> y <kbd>Enter</kbd>: el cuadro de medidas debe mostrar 1,00 m. Bórrela.',
      ojo: 'Empezar con una plantilla en pies y pulgadas: después todas las cotas salen en otra unidad y la escala de la imagen no cuadra.' },
    { t: 'Importar la planta base', donde: 'Menú principal (ícono de carpeta, arriba a la izquierda) ▸ Importar ▸ archivo PNG',
      html: '<ol><li>Importe el PNG de la planta (el del kit: <code>casa-ejemplo_planta_80px-por-m.png</code>, o el exportado de LibreCAD para el caso propio).</li><li>Si el programa pregunta, elija usarlo como <b>imagen</b>, no como textura.</li><li>Haga clic en el origen (cruce de los ejes rojo y verde) para fijar la primera esquina y un segundo clic en cualquier punto para darle un tamaño provisional.</li></ol><p>La imagen queda acostada sobre el plano del suelo, con su tamaño aún arbitrario: el paso siguiente la lleva a escala.</p>',
      verif: 'Orbite (<kbd>O</kbd>): la imagen está en el suelo, no en un plano vertical.',
      ojo: 'Importar un PDF escaneado de 6 000 px de lado: el navegador se vuelve lento. Recorte y reduzca la imagen a menos de 2 000 px antes de importarla.' },
    { t: 'Escalar la imagen con la cinta métrica', donde: 'Cinta métrica (T) ▸ clic, clic ▸ escribir la medida real ▸ Enter ▸ Sí',
      html: '<ol><li>Con la <b>Cinta métrica</b> haga clic sobre el eje A y luego sobre el eje C, a la misma altura de la imagen (use el zoom para acertar a la línea).</li><li>Sin mover nada, escriba la distancia real, <code>8</code>, y pulse <kbd>Enter</kbd>.</li><li>Ante la pregunta de si desea cambiar el tamaño del modelo, responda <b>Sí</b>. Como la imagen es lo único que hay en el modelo, solo ella cambia.</li></ol>',
      fig: () => RT.FIG_SK.escala(),
      verif: 'Mida otra distancia que no usó para escalar: entre los ejes 1 y 3 deben salir 10,00 m. Con la imagen de 80 px/m, cada píxel es 1,25 cm; una diferencia de hasta 2 cm es aceptable. Anote las dos medidas para el A01.',
      ojo: 'Escalar con la cota total (8,15 m) midiendo entre ejes, o escalar después de haber dibujado los muros: el redimensionado cambia todo el modelo.' },
    { t: 'Fijar el origen y bloquear la imagen', donde: 'Mover (M) · clic derecho ▸ Crear grupo · clic derecho ▸ Bloquear',
      html: '<ol><li>Seleccione la imagen y muévala (<kbd>M</kbd>) tomándola del cruce de los ejes A y 1 hasta el origen del modelo.</li><li>Con la flecha abajo del teclado fija la dirección azul: bájela <code>0,001</code> m para que no parpadee con el piso.</li><li>Clic derecho ▸ <b>Crear grupo</b>; luego clic derecho ▸ <b>Bloquear</b>.</li></ol><p>Desde ahora el punto A-1 es (0, 0, 0) en SketchUp, igual que en LibreCAD. Esa es la primera regla para que los archivos se correspondan.</p>',
      verif: 'Pase el cursor sobre el cruce de A-1: SketchUp lo reconoce como <b>origen</b>. Intente mover la imagen: no debe dejarse.' },
    { t: 'Crear las etiquetas', donde: 'Panel Etiquetas (a la derecha) ▸ botón +',
      html: '<p>Cree estas etiquetas, con los mismos nombres de las capas del CAD (capítulo 18):</p><ul><li><code>A-PLANO-BASE</code> · la imagen</li><li><code>A-MUROS</code> · muros, puertas y ventanas</li><li><code>A-MOBILIARIO</code> · mesones y aparatos</li><li><code>S-ESTRUCTURA</code> · columnas, vigas y losa</li><li><code>E-PUNTOS</code> · tablero, salidas y aparatos</li><li><code>E-CANAL</code> · tuberías</li><li><code>E-TEXTO</code> · códigos</li></ul><p>Asigne <code>A-PLANO-BASE</code> al grupo de la imagen en el panel <b>Información de entidad</b>.</p>',
      verif: 'Al apagar el ojo de <code>A-PLANO-BASE</code> la imagen desaparece y al encenderlo vuelve.',
      ojo: 'Dibujar con otra etiqueta «activa» o asignar etiquetas a caras sueltas. La práctica correcta es dibujar siempre sin etiqueta y asignarla al grupo o componente terminado.' },
    { t: 'Levantar los muros', donde: 'Rectángulo (R) · Equidistancia (F) · Empujar/Tirar (P)',
      html: '<ol><li>Con <b>Rectángulo</b>, clic en la esquina exterior suroccidental (−0,075; −0,075) y escriba <code>8,15;10,15</code>.</li><li>Con <b>Equidistancia</b>, clic sobre el borde del rectángulo, mueva hacia adentro y escriba <code>0,15</code>. Borre la cara interior: queda el anillo de los muros de fachada.</li><li>Los muros interiores son rectángulos de 0,15 m de ancho centrados en su eje; trace guías con la cinta métrica desde los ejes (clic en el eje y desplace 0,075).</li><li>Con <b>Empujar/Tirar</b> levante el anillo y los muros sobre ejes a <code>2,27</code> (fondo de viga). Un doble clic sobre otra cara repite la misma altura.</li><li>Los muros que no están bajo vigas (en la casa ejemplo M2, M4, M5 y M6, que no van sobre ejes) suben hasta <code>2,50</code>, el fondo de la losa.</li><li>Seleccione todos los muros, clic derecho ▸ <b>Crear grupo</b>, etiqueta <code>A-MUROS</code>.</li></ol>',
      fig: () => RT.FIG_SK.muros(),
      verif: 'Mida con la cinta métrica: espesor 0,15 m, altura 2,27 m en las fachadas y en los muros sobre ejes, y 2,50 m en M2, M4, M5 y M6.',
      ojo: 'Dibujar muros de 0,10 m «porque se ve mejor». El espesor real decide dónde cabe la caja y a qué distancia queda de la columna.' },
    { t: 'Abrir puertas y ventanas', donde: 'Entrar al grupo (doble clic) ▸ Rectángulo sobre la cara ▸ Empujar/Tirar a través',
      html: '<ol><li>Haga doble clic en el grupo de muros para editarlo.</li><li>Sobre la cara del muro, trace guías desde la esquina del vano: por ejemplo, la puerta principal P1 va de 1,00 a 1,90 m sobre la fachada sur.</li><li>Dibuje el rectángulo del vano: puertas de <code>0,90;2,10</code> (u 0,80 o 0,75 según el plano); ventanas desde su alféizar, por ejemplo V1 de 1,60 m de ancho entre 1,00 y 2,10 m.</li><li>Con <b>Empujar/Tirar</b> empuje el rectángulo <code>0,15</code> hasta atravesar el muro.</li></ol>',
      verif: 'Desde una vista superior se ve el suelo a través de cada puerta. Compare la lista de vanos con el plano: la casa ejemplo tiene 6 puertas, 7 ventanas y 2 vanos sin puerta.',
      ojo: 'Empujar menos que el espesor: queda una película que tapa el vano y que después confunde la revisión de interferencias.' },
    { t: 'Modelar la estructura', donde: 'Rectángulo · Empujar/Tirar · Crear componente (G) · Mover con Ctrl',
      html: '<ol><li><b>Columna:</b> rectángulo de <code>0,30;0,30</code> centrado en A-1, empuje a <code>2,50</code>. Selecciónela y pulse <kbd>G</kbd>: componente <code>COL-30x30</code>.</li><li>Copie la columna a los nueve cruces de ejes con <b>Mover</b> + <kbd>Ctrl</kbd>, escribiendo la distancia exacta (4,8; 3,2; 5,6; 4,4).</li><li><b>Vigas:</b> rectángulos de 0,30 m de ancho sobre cada eje, de cara a cara de columna, desde la altura 2,27 hasta 2,50 m. Agrúpelas.</li><li><b>Losa:</b> rectángulo de <code>8,15;10,15</code> sobre los muros a 2,50 m, empuje <code>0,12</code> hacia arriba. Grupo aparte.</li><li>Etiqueta <code>S-ESTRUCTURA</code> para columnas, vigas y losa. Pinte la losa con un material translúcido (opacidad baja en el editor de materiales) para ver los tubos a través de ella.</li></ol>',
      fig: () => RT.FIG_SK.alturas(),
      verif: 'Cinta métrica: fondo de viga a 2,27 m, fondo de losa a 2,50 m, cara superior de losa a 2,62 m.',
      ojo: 'Meter la estructura dentro del grupo de los muros: después no se puede ocultar para ver las tuberías ni mover un muro sin romper una columna.' },
    { t: 'Crear los componentes eléctricos', donde: 'Rectángulo · Empujar/Tirar · Crear componente (G) ▸ nombre',
      html: '<p>Cree un componente por tipo, con su punto de inserción en la cara del muro o en el fondo de la losa:</p><ul><li><code>TOMA</code>: caja de 0,06 × 0,10 m con 0,05 m de fondo (caja 2 × 4 in).</li><li><code>TOMA-GFCI</code>: igual, de otro color.</li><li><code>INTERRUPTOR</code>: igual que la toma, de otro color.</li><li><code>LUMINARIA</code>: círculo de 0,15 m de radio con 0,04 m de espesor, colgado del fondo de la losa.</li><li><code>APLIQUE</code>, <code>DUCHA</code> y <code>ESTUFA</code>: cajas de 0,10 × 0,10 m.</li><li><code>TABLERO</code>: 0,30 m de ancho, 0,45 m de alto y 0,10 m de fondo.</li></ul><p>Use colores planos distintos y siempre los mismos en todas las vistas.</p>',
      verif: 'En el panel <b>Componentes</b> aparecen los ocho componentes del modelo, cada uno con su nombre.',
      ojo: 'Copiar cajas sueltas en lugar de componentes: cambiar la altura de 30 tomas se vuelve 30 trabajos; con un componente se edita una sola vez.' },
    { t: 'Ubicar y rotular cada punto', donde: 'Mover (M) + Ctrl · guías de la cinta métrica · Información de entidad ▸ Nombre de instancia',
      html: `<ol><li>Ubique cada punto con <b>Mover</b> + <kbd>Ctrl</kbd> sobre guías trazadas desde los ejes. La tabla de la sección siguiente da las coordenadas x, y, z de cada uno.</li><li>Gire con <b>Rotar</b> (<kbd>Q</kbd>) las tomas e interruptores para que miren hacia el ambiente.</li><li>Con la instancia seleccionada, escriba en <b>Información de entidad ▸ Instancia</b> el código del plano: <code>TS1</code>, <code>S5</code>, <code>XD</code>…</li><li>Agregue con la herramienta <b>Texto</b> el código junto a cada punto y deje esos textos en la etiqueta <code>E-TEXTO</code>.</li></ol><p>La casa ejemplo tiene ${nLum} luminarias, ${nApl} apliques, ${nInt} interruptores, ${nToma} tomas (${nGfci} con GFCI), ${nEsp} salidas especiales y el tablero: ${P.length + 1} componentes.</p>`,
      fig: () => RT.FIG_SK.puntos(),
      verif: 'Los códigos del 3D son los mismos del plano. Si uno cae dentro de una columna o bajo una viga, anótelo: es un conflicto para el capítulo 23.',
      ojo: 'Rotular «T1» en el modelo y «TS1» en el plano. La correspondencia entre archivos se evalúa.' },
    { t: 'Modelar un recorrido de tubería', donde: 'Línea (L) para la ruta · Círculo (C) · Sígueme (Follow Me)',
      html: '<ol><li>Escoja un recorrido que cruce o bordee la estructura. En la casa ejemplo, el tramo LC–LK1 del circuito de alumbrado, que cruza la viga del eje 2 entre A y B, o la bajante del tablero.</li><li>Trace la ruta con <b>Línea</b> por el centro del tubo: en la losa a 2,56 m (mitad de su espesor), con codos en ángulo recto para las bajantes por el muro.</li><li>En el extremo de la ruta dibuje un <b>Círculo</b> de radio <code>0,0107</code> m (PVC de 1/2 in, 21,3 mm de diámetro exterior), perpendicular al primer tramo. Antes de hacer clic en el centro, escriba <code>12s</code> y <kbd>Enter</kbd> para que tenga 12 lados.</li><li>Seleccione la ruta, active <b>Sígueme</b> y haga clic en el círculo.</li><li>Grupo, etiqueta <code>E-CANAL</code>, nombre del tramo (<code>C1 LC-LK1</code>).</li></ol>',
      fig: () => RT.FIG_SK.sigueme(),
      verif: 'Con la losa translúcida se ve el tubo atravesando la viga. Mida su recubrimiento y compárelo con lo que dice el capítulo 23.',
      ojo: 'Usar rutas con curvas de muchos segmentos: el tubo sale deformado y el modelo se vuelve pesado. Basta con tramos rectos y codos simples.' },
    { t: 'Cortes para ver por dentro', donde: 'Herramienta Plano de sección · clic derecho ▸ Activar corte',
      html: '<ol><li>Con la herramienta <b>Plano de sección</b>, haga clic en el suelo para un corte horizontal y muévalo hacia arriba hasta 2,40 m: se ven los puntos en los muros y las luminarias bajo la losa.</li><li>Cree un segundo corte vertical sobre el eje 2 para mirar el cruce de la tubería con la viga.</li><li>Active uno u otro con clic derecho ▸ <b>Activar corte</b>.</li></ol>',
      verif: 'Con el corte a 2,40 m se ven todas las tomas e interruptores desde arriba, sin quitar la losa.' },
    { t: 'Guardar las tres escenas', donde: 'Panel Escenas ▸ + · Actualizar escena',
      html: '<ol><li><b>1 General:</b> vista aérea de toda la casa, todas las etiquetas visibles salvo <code>A-PLANO-BASE</code>, sin corte.</li><li><b>2 Puntos eléctricos:</b> corte horizontal a 2,40 m, etiquetas <code>E-PUNTOS</code> y <code>E-TEXTO</code> visibles.</li><li><b>3 Coordinación:</b> cámara cerca del recorrido modelado, losa translúcida o corte vertical, etiquetas <code>S-ESTRUCTURA</code> y <code>E-CANAL</code> visibles.</li></ol><p>Cada escena guarda la cámara, la visibilidad de etiquetas y el corte activo. Si cambia algo, seleccione la escena y pulse <b>Actualizar</b>.</p>',
      verif: 'Al pasar de una pestaña de escena a otra, la cámara, las etiquetas y el corte cambian solos.',
      ojo: 'Mover la cámara y no actualizar la escena: en la sustentación aparece la vista vieja.' },
    { t: 'Comprobación cruzada con el plano', donde: 'Cinta métrica (T)',
      html: `<p>Mida en el 3D y en la planta las mismas distancias y anótelas en la memoria. En la casa ejemplo:</p><ul><li>Del tablero TG a la salida de la ducha XD, en planta: ${f2(dTD)} m.</li><li>Altura de una toma general: 0,30 m; de un interruptor: 1,20 m.</li><li>Distancia de la toma TS5 a la cara de la columna B-2: 0,40 m.</li></ul>`,
      verif: 'Las diferencias entre el 3D y la planta son de menos de 2 cm. Si hay más, uno de los dos archivos está mal escalado.' },
    { t: 'Guardar y exportar el M3D', donde: 'Menú principal ▸ Guardar como · Descargar · Imprimir',
      html: '<ol><li>Guarde una versión con fecha en Trimble Connect: <code>M3D_casa_v3_2026-10-20</code>.</li><li>Descargue una copia SKP para la carpeta de entrega si su plan lo permite; si no, comparta el enlace del modelo con el docente.</li><li>Para cada escena, descargue un PNG (en el plan gratuito sale con marca de agua, lo cual es aceptable en este curso) o imprima a PDF.</li></ol>',
      verif: 'La carpeta <code>M3D_modelo/</code> tiene el SKP (o el enlace) y tres imágenes con los nombres de las escenas.' }
  ];

  RT.defineSim('lista-sketchup', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    const COMP = { lum: 'LUMINARIA', aplique: 'APLIQUE', int: 'INTERRUPTOR', int2: 'INTERRUPTOR', conm: 'INTERRUPTOR', toma: 'TOMA', ducha: 'DUCHA', estufa: 'ESTUFA', tablero: 'TABLERO' };
    const filas = () => P.concat([K.punto('TG')]).map((p) => ({ id: p.id, tipo: p.tipo, comp: p.tipo === 'toma' && p.gfci ? 'TOMA-GFCI' : COMP[p.tipo], amb: p.amb, muro: p.muro || '—', x: p.x, y: p.y, z: p.z, c: p.c || '—' }));
    sim.group('Filtro');
    sim.select('t', { label: 'Tipo', options: [['todos', 'Todos'], ['lum', 'Luminarias y apliques'], ['int', 'Interruptores'], ['toma', 'Tomas'], ['esp', 'Ducha, estufa y tablero']], value: 'todos' });
    sim.out('n', 'Puntos en la lista', { hl: true });
    RT.botonDescarga(sim.ctrlBox, 'Descargar lista (CSV)', () => ['puntos-para-el-modelo-3d.csv', '﻿' + ['Código;Componente;Ambiente;Muro;x (m);y (m);z (m);Circuito;Ubicado'].concat(filas().map((r) => [r.id, r.comp, r.amb, r.muro, f2(r.x), f2(r.y), f2(r.z), r.c, ''].join(';'))).join('\r\n'), 'text/csv']);
    sim.onDraw(() => {
      const t = sim.p.t;
      const ok = (r) => t === 'todos' || (t === 'lum' && (r.tipo === 'lum' || r.tipo === 'aplique')) || (t === 'int' && ['int', 'int2', 'conm'].includes(r.tipo)) || (t === 'toma' && r.tipo === 'toma') || (t === 'esp' && ['ducha', 'estufa', 'tablero'].includes(r.tipo));
      const f = filas().filter(ok);
      box.innerHTML = '<table class="sim-tab cuadro" style="width:100%"><thead><tr><th>Código</th><th>Componente</th><th>Ambiente</th><th>Muro</th><th class="num">x</th><th class="num">y</th><th class="num">z</th><th>Circ.</th></tr></thead><tbody>' +
        f.map((r) => `<tr><td><b>${r.id}</b></td><td>${r.comp}</td><td>${K.ambiente(r.amb) ? K.ambiente(r.amb).nombre : r.amb}</td><td>${r.muro}</td><td class="num">${f2(r.x)}</td><td class="num">${f2(r.y)}</td><td class="num">${f2(r.z)}</td><td>${r.c}</td></tr>`).join('') + '</tbody></table>';
      sim.set('n', String(f.length));
    });
  });
})();
