/* Capítulo 15 — Conformidad: declaraciones, dictamen y mantenimiento */
(function () {
  'use strict';
  const RT = window.RT;

  /* Ítems del formato de dictamen de uso final (Anexo 5 del Libro 4) */
  RT.DICTAMEN = [
    ['1', 'Diseño', 'Planos, diagramas y esquemas', 1, 'E01, E02, E03, E04'],
    ['2', 'Diseño', 'Análisis de riesgos de origen eléctrico', 1, 'MEM: matriz de riesgos del Libro 1'],
    ['3', 'Diseño', 'Especificaciones técnicas', 1, 'MEM: lista de materiales y especificaciones'],
    ['4', 'Diseño', 'Memorias de cálculo', 1, 'MEM: cuadro de cargas, circuito representativo, acometida'],
    ['5', 'Campos', 'Campo eléctrico', 0, 'No aplica: corrientes muy inferiores a 1 000 A (3.3.3.2)'],
    ['6', 'Campos', 'Densidad de flujo magnético', 0, 'No aplica (3.3.3.2)'],
    ['7', 'Distancias de seguridad', 'Distancias de seguridad', 1, 'MEM: acometida aérea y red frente a la fachada'],
    ['8', 'Protecciones', 'Accesibilidad a todos los dispositivos de control y protección', 1, 'E02 y M3D: tablero del hall, espacio de trabajo'],
    ['9', 'Protecciones', 'Funcionamiento del corte automático de alimentación', 1, 'E04: coordinación; prueba de GFCI y diferencial'],
    ['10', 'Protecciones', 'Selección de conductores', 1, 'E04 y MEM: calibres por circuito'],
    ['11', 'Protecciones', 'Selección de dispositivos de protección contra sobrecorrientes', 1, 'E04: cuadro y unifilar'],
    ['12', 'Protecciones', 'Selección de dispositivos de protección contra sobretensiones', 1, 'MEM: evaluación de la necesidad de DPS (3.3.3.1)'],
    ['13', 'Protección contra rayos', 'Evaluación del nivel de riesgo', 1, 'MEM: evaluación sencilla o supuesto declarado'],
    ['14', 'Protección contra rayos', 'Verificación de la protección', 0, 'Solo si la evaluación exige SIPRA'],
    ['15', 'Puesta a tierra', 'Continuidad de los conductores de tierra y conexiones equipotenciales', 1, 'E03 (tierra en cada tramo) y E04'],
    ['16', 'Puesta a tierra', 'Resistencia de puesta a tierra', 1, 'MEM: cálculo de las dos varillas; medición prevista'],
    ['17', 'Puesta a tierra', 'Verificación de tensiones de paso', 0, 'No se exige en uso final básico sin subestación'],
    ['18', 'Puesta a tierra', 'Verificación de tensiones de contacto y transferidas', 1, 'MEM: despeje por diferencial y magnético'],
    ['20', 'Señalización', 'Identificación de canalizaciones', 1, 'E03; franjas naranja si quedan a la vista'],
    ['21', 'Señalización', 'Identificación de tableros, circuitos y conductores', 1, 'E04: directorio del tablero; colores del Título 5'],
    ['22', 'Señalización', 'Diagramas, esquemas, avisos y señales de seguridad', 1, 'Unifilar adherido y aviso de riesgo eléctrico'],
    ['23', 'Documentación', 'Memoria del proyecto', 1, 'MEM'],
    ['24', 'Documentación', 'Planos, diagramas y esquemas de lo construido', 1, 'Láminas finales (en el proyecto, las de diseño)'],
    ['25', 'Documentación', 'Certificaciones de productos', 1, 'Lista de materiales con referencias del Libro 2'],
    ['26', 'Documentación', 'Declaración de cumplimiento del diseñador', 0, 'No aplica en esquema constructivo; se menciona'],
    ['27', 'Documentación', 'Declaración de cumplimiento del constructor', 1, 'Se menciona en la memoria (4.3.6.2)'],
    ['28', 'Documentación', 'Declaración de cumplimiento de operación y mantenimiento', 0, 'Solo en revisiones de instalaciones existentes'],
    ['29', 'Otros', 'Apoyos y estructuras', 0, 'No hay postes propios'],
    ['30', 'Otros', 'Cámaras y canalizaciones', 1, 'E03 y revisión de coordinación'],
    ['31', 'Otros', 'Dispositivos de seccionamiento y mando', 1, 'E01 y E04'],
    ['32', 'Otros', 'Ejecución de las conexiones', 1, 'MEM: empalmes solo en cajas; conector de la ducha'],
    ['—', 'Otros', 'Ensayos funcionales', 1, 'MEM: pruebas previstas antes de energizar'],
    ['—', 'Otros', 'Protección contra arcos internos', 0, 'No aplica en tablero residencial'],
    ['—', 'Otros', 'Protección contra electrocución por contacto directo', 1, 'Tapas, aislamiento, cajas cerradas'],
    ['—', 'Otros', 'Protección contra electrocución por contacto indirecto', 1, 'Puesta a tierra y diferenciales'],
    ['33', 'Otros', 'Herrajes', 0, 'Solo la percha de la acometida (operador de red)'],
    ['34', 'Otros', 'Productos adecuados para las condiciones ambientales', 1, 'Tomas IP en exteriores; cajas a prueba de agua en baño'],
    ['35', 'Otros', 'Protección contra corrosión', 1, 'Electrodos y conexiones enterradas'],
    ['36', 'Otros', 'Resistencia de aislamiento', 1, 'Medición con megóhmetro de 500 V (3.17.8 n)'],
    ['37', 'Otros', 'Sujeción mecánica de elementos de la instalación', 1, 'Soportes de tubería (3.17.6.6 c)'],
    ['38', 'Otros', 'Ventilación de equipos', 0, 'No aplica']
  ];

  RT.defineSim('pre-dictamen', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    sim.group('Avance');
    sim.out('ap', 'Ítems que aplican');
    sim.out('ok', 'Con evidencia lista', { hl: true });
    sim.check('solo', { label: 'Mostrar solo los que aplican', value: false });
    const st = RT.store.get('dictamen', {});
    const pintar = () => {
      let h = '<table class="sim-tab" style="width:100%"><thead><tr><th>Ítem</th><th>Aspecto a evaluar</th><th>Aplica</th><th>Evidencia en el proyecto</th><th>Lista</th></tr></thead><tbody>', g = null, nap = 0, nok = 0;
      RT.DICTAMEN.forEach(([n, grp, asp, ap, ev], i) => {
        if (ap) nap++;
        if (ap && st[i]) nok++;
        if (sim.p.solo && !ap) return;
        if (grp !== g) { g = grp; h += `<tr><td colspan="5" style="font-weight:700;color:var(--accent);padding-top:8px">${g}</td></tr>`; }
        h += `<tr><td>${n}</td><td style="white-space:normal">${asp}</td><td>${ap ? 'Sí' : 'No'}</td><td style="white-space:normal;font-family:var(--font-ui)">${ev}</td><td>${ap ? `<input type="checkbox" data-i="${i}" ${st[i] ? 'checked' : ''} aria-label="Evidencia lista: ${asp}">` : ''}</td></tr>`;
      });
      box.innerHTML = h + '</tbody></table><p style="font:12.5px var(--font-ui);color:var(--ink-3)">Ítems y agrupación tomados del Anexo 5 del Libro 4 (formato para dictamen de inspección de uso final). La columna «Aplica» es una sugerencia para una vivienda básica.</p>';
      box.querySelectorAll('input[data-i]').forEach((c) => c.addEventListener('change', () => { st[c.dataset.i] = c.checked; RT.store.set('dictamen', st); pintar(); }));
      sim.set('ap', nap + ' de ' + RT.DICTAMEN.length);
      sim.set('ok', nok + ' de ' + nap);
    };
    sim.onChange = pintar;
    pintar();
  });
})();
