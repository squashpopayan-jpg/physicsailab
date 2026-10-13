/* Capítulo 8 — Qué es el RETIE y cómo se lee */
(function () {
  'use strict';
  const RT = window.RT;

  /* Artículos que usa el proyecto (resúmenes propios para ubicarse; lea el texto oficial) */
  RT.MAPA = [
    { l: 1, a: '1.2.1', n: 'Definiciones generales', r: 'Define acometida, capacidad instalable, esquema constructivo, persona competente, lugar húmedo y mojado, dictamen de inspección y certificación plena, entre otros.', c: 'Vocabulario de la memoria y del glosario.', cap: 'glosario' },
    { l: 1, a: '1.3.3', n: 'Señalización de seguridad', r: 'Señales de riesgo eléctrico adaptadas de ISO 7010.', c: 'Aviso de riesgo eléctrico en la tapa del tablero.', cap: 'tableros' },
    { l: 1, a: '1.3.4', n: 'Símbolos eléctricos', r: 'Los símbolos de la Tabla 1.3.4.a (IEC 60617, ANSI Y32, CSA Z99, IEEE 315) son de aplicación obligatoria; si no se pueden usar, se justifica por escrito.', c: 'Cuadro de convenciones de E01 a E04.', cap: 'unifilar' },
    { l: 1, a: '1.5.1', n: 'Análisis de riesgos de origen eléctrico', r: 'Electropatología, umbrales de corriente, zonas tiempo-corriente, factores de riesgo comunes y matriz de valoración con decisiones.', c: 'Análisis de riesgos de la memoria.', cap: 'riesgos' },
    { l: 2, a: '2.1.2.1', n: 'Productos objeto del reglamento', r: 'Tabla 2.1.2.1.a con los productos que deben demostrar conformidad: cables, cajas, tomacorrientes, interruptores, tubos, tableros, electrodos, duchas, DPS, entre otros.', c: 'Lista de materiales con certificado.', cap: 'productos' },
    { l: 2, a: '2.3.4', n: 'Cajas y conduletas', r: 'Requisitos de producto; dimensiones internas mínimas de las cajas rectangulares para aparatos (2.3.4.1 b).', c: 'Cajas rectangulares de interruptores y tomas.', cap: 'canalizaciones' },
    { l: 2, a: '2.3.8', n: 'Clavijas y tomacorrientes', r: 'Requisitos de producto, incluidos los tomacorrientes con protección diferencial GFCI (2.3.8.1 r).', c: 'Tomas generales, GFCI y de intemperie.', cap: 'productos' },
    { l: 2, a: '2.3.15', n: 'Electrodos de puesta a tierra', r: 'Dimensiones mínimas por material (Tabla 2.3.15.1.1.a); varilla o tubo de mínimo 2,4 m; sin aluminio; marcación.', c: 'Dos varillas Cu de 5/8 in × 2,4 m.', cap: 'tierra' },
    { l: 2, a: '2.3.17.2', n: 'Interruptores automáticos de baja tensión', r: 'Diferenciales para personas de 30 mA o menos; para equipos, 300 mA o menos; protección térmica y magnética; curvas del productor.', c: 'Totalizador, ramales y diferencial de la ducha.', cap: 'protecciones' },
    { l: 2, a: '2.3.29.4', n: 'Sistemas de tubos', r: 'Requisitos de producto de tubos y accesorios para canalizaciones eléctricas.', c: 'Tubo PVC de 1/2 in, 3/4 in y 1 in.', cap: 'canalizaciones' },
    { l: 2, a: '2.3.31', n: 'Tableros eléctricos y celdas', r: 'Requisitos de envolventes y tableros de baja tensión.', c: 'Tablero general de 12 circuitos.', cap: 'tableros' },
    { l: 3, a: '3.1.1', n: 'Instalaciones objeto del RETIE', r: 'Aplica a instalaciones de más de 25 V c.a. o 50 V c.c., nuevas, ampliadas o remodeladas; excepciones y exclusiones.', c: 'La casa es una instalación de uso final básica.', cap: 'retie' },
    { l: 3, a: '3.1.2', n: 'Prohibiciones', r: 'Pararrayos radiactivos, materiales reutilizados en uso final, tierra como único retorno.', c: 'Ningún interruptor o diferencial reutilizado.', cap: 'retie' },
    { l: 3, a: '3.2.1', n: 'Competencia de personas naturales', r: 'Diseño, construcción e inspección solo por personas técnica y legalmente competentes según su matrícula.', c: 'El proyecto es académico; la obra real exige un profesional competente.', cap: 'diseno' },
    { l: 3, a: '3.2.2', n: 'Responsabilidad de los constructores', r: 'Contratar personas competentes, usar productos certificados, revisar los diseños, firmar planos finales y manual, dejar evidencia de los productos usados.', c: 'Rol del ingeniero civil como constructor.', cap: 'diseno' },
    { l: 3, a: '3.3.1', n: 'Instalaciones que requieren diseño', r: 'Lista de instalaciones que deben tener diseño; diseño detallado (3.3.1.1) y básico (3.3.1.2) con sus ítems.', c: 'La casa, con ≤ 15 kVA, no lo exige; el proyecto toma los ítems del diseño básico como guía.', cap: 'diseno' },
    { l: 3, a: '3.3.2', n: 'Instalaciones que requieren esquema constructivo', r: 'Instalaciones básicas de hasta 4 cuentas, ≤ 15 kVA y ≤ 240 V; contenido mínimo del esquema (3.3.2.1).', c: 'Ruta de conformidad de la casa ejemplo.', cap: 'diseno' },
    { l: 3, a: '3.3.3.1', n: 'Uso de DPS', r: 'En uso final, la necesidad de DPS depende de una evaluación técnica del riesgo por sobretensiones hecha por el diseñador.', c: 'Decisión documentada en la matriz normativa.', cap: 'protecciones' },
    { l: 3, a: 'Título 4', n: 'Espacios para montaje y de trabajo', r: 'Espacio de trabajo de 2 m de alto, 0,76 m de ancho y 0,9 m de profundidad frente a equipos con partes expuestas de hasta 150 V a tierra (literal e).', c: 'Espacio libre frente al tablero del hall.', cap: 'tableros' },
    { l: 3, a: 'Título 5', n: 'Código de colores', r: 'Tablas 3.5.a y 3.5.b: fases, neutro blanco, tierra desnuda o verde; nunca blanco ni verde para las fases.', c: 'Colores de los conductores en el tablero y en los tramos.', cap: 'colores' },
    { l: 3, a: 'Título 6', n: 'Operación y mantenimiento', r: 'El constructor entrega al usuario un manual de operación y mantenimiento con contenido mínimo.', c: 'Anexo de la memoria.', cap: 'conformidad' },
    { l: 3, a: '3.8.1', n: 'Requisitos generales de las protecciones', r: 'Coordinación de protecciones en cascada; corriente de falla suministrada por el operador de red para el interruptor principal.', c: 'Supuesto de capacidad de interrupción del totalizador.', cap: 'protecciones' },
    { l: 3, a: 'Título 9', n: 'Niveles de tensión', r: 'Tensiones normalizadas: 120 V fase-tierra y 240 V entre fases en sistemas monofásicos trifilares; 60 Hz.', c: 'Sistema 120/240 V de la casa.', cap: 'circuitos' },
    { l: 3, a: '3.12.1', n: 'Requisitos generales de puesta a tierra', r: 'Refuerzo estructural conectado a tierra, conexiones enterradas exotérmicas o certificadas, cajas de inspección de 30 × 30 cm, puestas a tierra interconectadas, tensiones de contacto de la Tabla 3.12.1.a.', c: 'SPT del antejardín y su caja de inspección.', cap: 'tierra' },
    { l: 3, a: '3.12.2', n: 'Componentes del sistema de puesta a tierra', r: 'Electrodos e instalación; conductor del electrodo (Tabla 250-66); conductor de protección (Tabla 250-122), continuo y por la misma canalización.', c: 'Conductor del electrodo de 8 AWG; tierras de 14, 12 y 10 AWG.', cap: 'tierra' },
    { l: 3, a: '3.12.3', n: 'Valores de referencia de resistencia', r: 'Tabla 3.12.3.a: 25 Ω para el punto neutro de acometida en baja tensión, entre otros.', c: 'Verificación con dos varillas.', cap: 'tierra' },
    { l: 3, a: '3.12.4', n: 'Mediciones', r: 'Resistividad por Wenner (ρ = 2πaR) y resistencia por caída de potencial al 61,8 %.', c: 'Procedimiento de medición previsto.', cap: 'tierra' },
    { l: 3, a: '3.14.1', n: 'Redes de sistemas de iluminación', r: 'Prever puntos y controles para cumplir el RETILAP; si no hay diseño de iluminación exigido, ubicar salidas e interruptores adecuados.', c: 'Planta E01.', cap: 'iluminacion' },
    { l: 3, a: '3.14.2', n: 'Portalámparas y encendido', r: 'Fase al terminal central del portalámparas; sectorizar el encendido con interruptores manuales.', c: 'Relación de control de E01.', cap: 'iluminacion' },
    { l: 3, a: '3.17.5', n: 'Cajas y conduletas', r: 'Volumen según 314.16; cajas para alumbrado no rectangulares; cajas metálicas a tierra; a prueba de agua en lugares húmedos; proteger su interior al vaciar concreto.', c: 'Octagonales en el techo, rectangulares en muros.', cap: 'canalizaciones' },
    { l: 3, a: '3.17.6', n: 'Canalizaciones y bandejas portacables', r: 'Marcas naranja en canalizaciones a la vista, flexible en juntas de dilatación, soportes, tubería liviana solo embebida, tapones antes del vaciado; sin bandejas en vivienda.', c: 'Tubería PVC embebida en losa y contrapiso.', cap: 'canalizaciones' },
    { l: 3, a: '3.17.8', n: 'Celdas y tableros', r: 'Accesible, con rótulos y unifilar adheridos, circuitos identificados, partes metálicas a tierra, no adyacente a peldaños de escaleras, en lugar seco, un neutro por borne.', c: 'Tablero general del hall.', cap: 'tableros' },
    { l: 3, a: '3.17.10', n: 'Clavijas y tomacorrientes', r: 'Grado IP o NEMA en lugares húmedos o a la intemperie, protección para niños menores de siete años, neutro arriba en instalación horizontal.', c: 'Tomas exteriores TE1 y TE2.', cap: 'tomas' },
    { l: 3, a: '3.17.13', n: 'Conductores aislados', r: 'Retardantes a la llama, empalmes en cajas, llenado del Cap. 9, cables desde 8 AWG, coordinación con bornes, sin aluminio en ramales residenciales.', c: 'THHN/THWN-2 de 14, 12 y 10 AWG.', cap: 'conductores' },
    { l: 3, a: '3.17.14', n: 'DPS', r: 'Coordinación por IEC 61643-12, modo común en el tablero principal, conexiones cortas (≤ 50 cm), 14 AWG mínimo.', c: 'Espacio previsto en el tablero.', cap: 'protecciones' },
    { l: 3, a: '3.17.15', n: 'Duchas eléctricas y calentadores de paso', r: 'Circuito exclusivo (30 A si no se conoce el equipo), diferencial si no es de resistencia blindada, sin derivaciones, protección fuera del área mojada, conexión a prueba de agua, tomas a menos de 1,8 m con GFCI, conductor de tierra.', c: 'Circuito C7 de la casa.', cap: 'uso-final' },
    { l: 3, a: '3.17.19', n: 'Interruptores automáticos de baja tensión', r: 'Protección contra sobrecarga y cortocircuito, no reutilizar, no abrir el neutro, en tableros con tapa, no en bañeras o duchas, palanca a 2,0 m máximo.', c: 'Tablero y sus interruptores.', cap: 'protecciones' },
    { l: 3, a: '3.17.20', n: 'Interruptores manuales', r: 'En serie con la fase, nunca en el neutro; caja metálica a tierra; con tapa.', c: 'Interruptores de E01.', cap: 'iluminacion' },
    { l: 3, a: 'Título 24', n: 'Aplicación de normas técnicas', r: 'Adopta requisitos de la NTC 2050 segunda actualización (NFPA 70-2017); prima el reglamento si hay contradicción.', c: 'Remisiones a las secciones 210, 220, 240 y 250.', cap: 'retie' },
    { l: 3, a: 'Título 25', n: 'Régimen de conexión a tierra', r: 'TN-C-S o TN-S en servicio domiciliario; prohibido el TN-C; TN-S aguas abajo del primer medio de desconexión.', c: 'Puente neutro-tierra en el tablero general.', cap: 'tierra' },
    { l: 3, a: 'Título 26', n: 'Acometidas', r: 'Caída de tensión ≤ 3 % en la acometida y ≤ 5 % en alimentadores y ramales (f); cada inmueble con su acometida (j); cobre de 8 AWG mínimo en acometida aérea (d).', c: 'Acometida y alimentador de 6 AWG.', cap: 'cargas' },
    { l: 3, a: 'Título 27', n: 'Protección de las instalaciones de uso final', r: 'Neutro y tierra independientes con puente solo en el tablero general; protección básica, contra falla de aislamiento y contra sobrecorrientes (3.27.1 a 3.27.3).', c: 'Diferenciales y puesta a tierra de la casa.', cap: 'tierra' },
    { l: 3, a: '3.28.1', n: 'Instalaciones básicas', r: 'Remite a la NTC 2050 (110, 210, 220, 240, 250, 300); GFCI según 210.8 (g, h, i); interruptores fuera de duchas (j); circuitos mínimos de viviendas pequeñas (l); ducha sobre 1 500 m s. n. m. (m); capacidad para estufa (n); tomas en dormitorios (o).', c: 'Base de E02 y de la matriz normativa.', cap: 'uso-final' },
    { l: 3, a: '3.28.2', n: 'Instalaciones provisionales', r: 'Para obras en construcción, hasta seis meses; tablero con protección de sobrecorriente y falla a tierra; esquema y procedimiento firmados por persona competente; GFCI en tomas para herramientas.', c: 'La instalación de obra que monta el constructor.', cap: 'conformidad' },
    { l: 4, a: '4.3.1', n: 'Inspección con fines de certificación', r: 'La instalación se declara conforme con declaraciones de cumplimiento y, cuando aplica, dictamen de inspección; requisitos del proceso de inspección.', c: 'Qué revisaría un inspector.', cap: 'conformidad' },
    { l: 4, a: '4.3.2', n: 'Instalaciones que requieren certificación plena', r: 'Entre otras: residenciales de más de 15 kVA instalables, proyectos de 5 o más cuentas, instalaciones especiales.', c: 'La casa (13,2 kVA) no la requiere.', cap: 'conformidad' },
    { l: 4, a: '4.3.5', n: 'Excepciones del dictamen', r: 'Las no incluidas en 4.3.2 se certifican con la declaración de cumplimiento de la persona competente.', c: 'Ruta de la casa ejemplo.', cap: 'conformidad' },
    { l: 4, a: '4.3.6', n: 'Formatos de la declaración de cumplimiento', r: 'Formatos de declaración del diseño, de la construcción y de operación y mantenimiento.', c: 'Anexo de referencia en la memoria.', cap: 'conformidad' },
    { l: 4, a: 'Anexo 5', n: 'Formato de dictamen de uso final', r: 'Ítems que evalúa el inspector: diseño, distancias, protecciones, puesta a tierra, señalización, documentación, conexiones, resistencia de aislamiento.', c: 'Lista de autoverificación del proyecto.', cap: 'conformidad' }
  ];

  RT.defineSim('mapa-retie', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    sim.group('Filtrar');
    const row = RT.el('div', 'ctrl');
    row.innerHTML = '<label for="mapa-q">Buscar palabra</label>';
    const q = document.createElement('input'); q.type = 'search'; q.id = 'mapa-q'; q.className = 'num-in'; q.placeholder = 'ducha, tierra, caja…';
    row.append(q); sim._parent().append(row);
    sim.seg('l', { label: 'Libro', options: [[0, 'Todos'], [1, '1'], [2, '2'], [3, '3'], [4, '4']], value: 0 });
    sim.out('n', 'Artículos mostrados', { hl: true });
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const pintar = () => {
      const t = norm(q.value.trim()), l = +sim.p.l;
      const items = RT.MAPA.filter((m) => (!l || m.l === l) && (!t || norm(m.a + ' ' + m.n + ' ' + m.r + ' ' + m.c).includes(t)));
      box.innerHTML = items.map((m) => {
        const ch = RT.app && RT.app.byId[m.cap];
        return `<div style="border:1px solid var(--rule);border-radius:5px;background:var(--surface);padding:9px 12px;margin:0 0 8px">
          <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><span class="ref">Libro ${m.l} · ${m.a}</span><b style="font:650 16px var(--font-display)">${m.n}</b></div>
          <div style="font:14.5px/1.5 var(--font-text);margin:4px 0">${m.r}</div>
          <div style="font:13px var(--font-ui);color:var(--ink-3)"><b>En la casa:</b> ${m.c}${ch ? ` · <a href="#${m.cap}">Cap. ${ch.num}</a>` : ''}</div></div>`;
      }).join('') || '<p>No hay artículos con esa palabra.</p>';
      sim.set('n', items.length + ' de ' + RT.MAPA.length);
    };
    q.addEventListener('input', pintar);
    sim.onChange = pintar;
    pintar();
  });

  RT.defineSim('cita-numeral', function (sim) {
    const PREG = [
      ['La ducha eléctrica debe alimentarse por un circuito exclusivo con su protección termomagnética.', 'Libro 3, 3.17.15 b', ['Libro 3, 3.17.13 l', 'Libro 3, Título 26 f', 'Libro 2, 2.3.15']],
      ['El neutro y el conductor de puesta a tierra se unen con un puente equipotencial solo en el tablero general.', 'Libro 3, Título 27 (párrafo inicial)', ['Libro 3, Título 5', 'Libro 3, 3.17.10 f', 'Libro 4, 4.3.2']],
      ['El electrodo tipo varilla debe tener mínimo 2,4 m de longitud.', 'Libro 2, 2.3.15.1.1 f', ['Libro 3, 3.12.3', 'Libro 3, 3.12.4.2', 'Libro 1, 1.3.4']],
      ['La caída de tensión en la acometida no debe superar el 3 %.', 'Libro 3, Título 26, literal f', ['Libro 3, 3.17.13 h', 'Libro 3, 3.8.1 e', 'Libro 3, 3.28.1 b']],
      ['Las cajas de inspección de la puesta a tierra miden mínimo 30 cm × 30 cm.', 'Libro 3, 3.12.1 d', ['Libro 3, 3.17.5 a', 'Libro 2, 2.3.4.1 b', 'Libro 3, Título 4 e']],
      ['Se prohíbe instalar tableros en paredes adyacentes a los peldaños de las escaleras.', 'Libro 3, 3.17.8 v', ['Libro 3, 3.17.19 g', 'Libro 3, Título 4 c', 'Libro 3, 3.28.1 j']],
      ['Las partes de canalizaciones expuestas se marcan con franjas naranja de al menos 10 cm.', 'Libro 3, 3.17.6.1 a', ['Libro 3, Título 5', 'Libro 1, 1.3.3', 'Libro 3, 3.17.5 f']],
      ['Los tomacorrientes ubicados donde lo exige la sección 210.8 (A), (B) y (D) de la NTC 2050 deben tener protección por falla a tierra.', 'Libro 3, 3.28.1 g', ['Libro 3, 3.27.3 e', 'Libro 2, 2.3.8.1 r', 'Libro 3, 3.17.10 b']],
      ['Una instalación residencial individual de más de 15 kVA de capacidad instalable requiere certificación plena.', 'Libro 4, 4.3.2.1 c', ['Libro 3, 3.3.2', 'Libro 4, 4.3.5 a', 'Libro 3, 3.3.1.2 a']],
      ['No se aceptan conductores de aluminio en los circuitos ramales de unidades residenciales.', 'Libro 3, 3.17.13 l', ['Libro 3, Título 26 d', 'Libro 2, 2.3.10', 'Libro 3, 3.17.16 c']]
    ];
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    sim.group('Avance');
    sim.out('p', 'Puntaje', { hl: true });
    sim.button('Volver a empezar', () => { resp = {}; pintar(); });
    let resp = {};
    const orden = PREG.map((p, i) => { const ops = [p[1], ...p[2]]; const seed = (i * 7 + 3) % 4; return ops.slice(seed).concat(ops.slice(0, seed)); });
    const pintar = () => {
      let ok = 0;
      box.innerHTML = '';
      PREG.forEach(([txt, bien], i) => {
        const d = RT.el('div');
        d.style.cssText = 'border-bottom:1px dashed var(--rule);padding:8px 0';
        d.innerHTML = `<div style="font:15px/1.45 var(--font-text);margin-bottom:6px"><b>${i + 1}.</b> ${txt}</div>`;
        const ops = RT.el('div', 'ctrl-row');
        orden[i].forEach((o) => {
          const b = RT.el('button', 'btn', o);
          b.type = 'button';
          if (resp[i]) {
            if (o === bien) b.classList.add('on');
            if (o === resp[i] && o !== bien) b.style.borderColor = 'var(--bad)';
          }
          b.addEventListener('click', () => { if (!resp[i]) { resp[i] = o; pintar(); } });
          ops.append(b);
        });
        d.append(ops);
        if (resp[i]) { if (resp[i] === bien) ok++; d.append(RT.el('div', null, `<span class="chip ${resp[i] === bien ? 'ok' : 'bad'}">${resp[i] === bien ? 'Correcto' : 'La cita correcta es ' + bien}</span>`)); }
        box.append(d);
      });
      sim.set('p', `${ok} de ${Object.keys(resp).length} respondidas · ${PREG.length} en total`);
    };
    pintar();
  });
})();
