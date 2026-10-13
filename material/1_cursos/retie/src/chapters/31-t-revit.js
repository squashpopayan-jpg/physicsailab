/* Capítulo 31 — Taller de Revit */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1);

  /* Posiciones del tablero TG: [circuito, posición inicial]. En monofásico trifilar,
     las filas alternan fase A (posiciones 1-2, 5-6, 9-10) y fase B (3-4, 7-8, 11-12). */
  RT.DISPOSICIONES_TG = {
    proyecto: { n: 'La del proyecto (balanceada)', pos: { C1: 1, C3: 2, C2: 3, C4: 4, C7: 5, C9: 6, C5: 7, C6: 8, C8: 9 } },
    orden: { n: 'En orden de numeración', pos: { C1: 1, C2: 2, C3: 3, C4: 4, C5: 5, C6: 6, C7: 7, C9: 8, C8: 9 } }
  };
  const faseDe = (pos) => (Math.floor((pos - 1) / 2) % 2 === 0 ? 'A' : 'B');
  RT.cuadroTablero = function (clave) {
    const D = RT.DISPOSICIONES_TG[clave], filas = L.Q.cuadro(K);
    const slots = {};
    for (const r of filas) {
      const p = D.pos[r.id], c = r.c;
      if (c.polos === 2) { slots[p] = { r, fase: faseDe(p), va: r.va / 2, ini: true }; slots[p + 2] = { r, fase: faseDe(p + 2), va: r.va / 2, ini: false }; }
      else slots[p] = { r, fase: faseDe(p), va: r.va, ini: true };
    }
    let A = 0, B = 0;
    Object.values(slots).forEach((s) => { if (s.fase === 'A') A += s.va; else B += s.va; });
    return { slots, A, B };
  };

  const CORTO = { C1: 'Alumbrado', C2: 'Tomas sala-comedor', C3: 'Tomas alcobas', C4: 'Cocina 1', C5: 'Cocina 2 y nevera', C6: 'Ropas', C7: 'Ducha', C8: 'Estufa 240 V', C9: 'Baño' };
  RT.defineSim('cuadro-tablero', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    sim.group('Disposición de los circuitos');
    sim.select('d', { options: Object.keys(RT.DISPOSICIONES_TG).map((k) => [k, RT.DISPOSICIONES_TG[k].n]), value: 'proyecto' });
    sim.out('A', 'Fase A');
    sim.out('B', 'Fase B');
    sim.out('N', 'Corriente de neutro');
    sim.out('des', 'Desbalance', { hl: true });
    sim.out('dem', 'Demanda (capítulo 24)');
    sim.onDraw(() => {
      const t = RT.cuadroTablero(sim.p.d), ac = L.Q.acometida(K);
      const celda = (pos) => {
        const s = t.slots[pos];
        if (!s) return { ckt: pos, desc: '<i style="color:var(--ink-3)">Espacio de reserva</i>', trip: '', pol: '', A: '', B: '' };
        const c = s.r.c;
        return { ckt: pos, desc: s.ini ? `${c.id} · ${CORTO[c.id] || c.nombre}` : `${c.id} (2.º polo)`, trip: s.ini ? c.In + ' A' : '', pol: s.ini ? (c.polos === 2 ? 2 : 1) : '', A: s.fase === 'A' ? f0(s.va) : '', B: s.fase === 'B' ? f0(s.va) : '' };
      };
      let h = `<table class="sim-tab tablero-revit" style="width:100%;font-size:12.5px"><thead><tr><th colspan="12" style="text-align:left">Tablero TG · hall, muro M5 · 120/240 V, 1 fase, 3 hilos · totalizador 2P ${ac.In} A · 12 espacios</th></tr><tr><th class="num">CKT</th><th>Descripción</th><th>Disparo</th><th class="num">Polos</th><th class="num">A (VA)</th><th class="num">B (VA)</th><th class="num">A (VA)</th><th class="num">B (VA)</th><th class="num">Polos</th><th>Disparo</th><th>Descripción</th><th class="num">CKT</th></tr></thead><tbody>`;
      for (let r = 0; r < 6; r++) {
        const iz = celda(2 * r + 1), de = celda(2 * r + 2), f = faseDe(2 * r + 1);
        h += `<tr class="fase-${f}"><td class="num">${iz.ckt}</td><td>${iz.desc}</td><td>${iz.trip}</td><td class="num">${iz.pol}</td><td class="num">${iz.A}</td><td class="num">${iz.B}</td><td class="num">${de.A}</td><td class="num">${de.B}</td><td class="num">${de.pol}</td><td>${de.trip}</td><td>${de.desc}</td><td class="num">${de.ckt}</td></tr>`;
      }
      h += `<tr style="font-weight:700"><td colspan="4">Carga conectada por fase</td><td colspan="4" class="num">A: ${f0(t.A)} VA · B: ${f0(t.B)} VA</td><td colspan="4">Total ${f0(t.A + t.B)} VA</td></tr></tbody></table>`;
      box.innerHTML = h;
      const des = Math.abs(t.A - t.B) / (t.A + t.B);
      sim.set('A', `${f0(t.A)} VA · ${f1(t.A / 120)} A`);
      sim.set('B', `${f0(t.B)} VA · ${f1(t.B / 120)} A`);
      sim.set('N', f1(Math.abs(t.A - t.B) / 120) + ' A');
      sim.set('des', C.fmt(100 * des, 1) + ' % ' + (des <= 0.1 ? '<span class="chip ok">bien</span>' : '<span class="chip bad">reorganizar</span>'));
      sim.set('dem', `${f0(ac.dem.total)} VA · ${f1(ac.I)} A a 240 V`);
    });
  });

  RT.defineSim('informe-interferencias', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    const CAT = { cruce: 'Armazón estructural (viga)', bajante: 'Armazón estructural (viga)', cim: 'Cimentación estructural', caja: 'Pilares estructurales', columna: 'Pilares estructurales' };
    sim.group('Mostrar');
    sim.seg('f', { options: [['todas', 'Todas'], ['cruce', 'Cruces en losa'], ['bajante', 'Bajantes'], ['cim', 'Cimentación'], ['caja', 'Cajas']], value: 'todas' });
    sim.out('n', 'Interferencias', { hl: true });
    sim.out('cr', 'Críticas');
    sim.onDraw(() => {
      const all = L.R.interferencias(K);
      const lst = all.filter((i) => sim.p.f === 'todas' || i.tipo === sim.p.f);
      box.innerHTML = '<table class="sim-tab texto" style="width:100%"><thead><tr><th>#</th><th>A: Tubos o cajas</th><th>B: categoría y elemento</th><th class="num">A la columna</th><th>Criterio</th></tr></thead><tbody>' +
        lst.map((i, k) => `<tr${i.critico ? ' style="background:color-mix(in srgb, var(--bad) 9%, transparent)"' : ''}><td>${k + 1}</td><td>${i.tramo ? `${i.c} · tramo ${i.tramo}` : i.punto ? `${i.c ? i.c + ' · ' : ''}${i.tipo === 'caja' ? 'caja' : 'bajante a'} ${i.punto}` : '—'}</td><td>${CAT[i.tipo] || '—'}<br><b>${i.viga || i.col || '—'}</b></td><td class="num">${C.fmt(i.dCol !== undefined ? i.dCol : i.d, 2)} m</td><td style="font-size:12.5px">${i.texto}</td></tr>`).join('') + '</tbody></table>';
      sim.set('n', `${lst.length} de ${all.length}`);
      sim.set('cr', String(all.filter((i) => i.critico).length));
    });
  });

  RT.PASOS.revit = [
    { t: 'Proyecto nuevo con plantilla eléctrica', donde: 'File ▸ New ▸ Project ▸ plantilla eléctrica métrica · Manage ▸ Project Units',
      html: '<ol><li>Cree el proyecto con la plantilla eléctrica (o de sistemas) en <b>métrico</b>.</li><li>En <b>Manage ▸ Project Units</b> verifique longitud en milímetros (o metros con dos decimales).</li><li>Guarde como <code>M3D_casa_v1.rvt</code>.</li></ol>',
      verif: 'El navegador de proyecto muestra vistas de planta eléctrica (Electrical) además de las de arquitectura.' },
    { t: 'Configuración eléctrica: 120/240 V', donde: 'Manage ▸ MEP Settings ▸ Electrical Settings ▸ Voltage Definitions · Distribution Systems',
      html: '<ol><li>En <b>Voltage Definitions</b> deje o cree las tensiones de 120 V y 240 V.</li><li>En <b>Distribution Systems</b> cree uno monofásico (<i>Single</i>) de 3 hilos, con 240 V entre líneas y 120 V entre línea y tierra: el sistema monofásico trifilar de la casa.</li><li>Revise los tipos de cable y el material (cobre) en <b>Wiring</b>.</li></ol>',
      verif: 'Al crear el tablero en el paso 7, el sistema 120/240 V aparece en la lista de distribución.',
      ojo: 'Dejar el sistema predeterminado de 120/208 V trifásico: las cargas por fase y las corrientes del cuadro salen distintas a las del proyecto.' },
    { t: 'Ejes y niveles', donde: 'Architecture ▸ Grid (GR) · Level (LL)',
      html: '<ol><li>Niveles: <code>NPT 0,00</code>, <code>Fondo losa 2,50</code> y <code>Cubierta 2,62</code>.</li><li>Ejes A, B, C a 0, 4 800 y 8 000 mm; ejes 1, 2, 3 a 0, 5 600 y 10 000 mm. Renómbrelos con doble clic en la burbuja.</li></ol>',
      verif: 'Una cota alineada entre A y C da 8 000 mm.' },
    { t: 'Vincular el DXF del kit', donde: 'Insert ▸ Link CAD · posición: origen con origen · unidades: milímetros',
      html: '<ol><li>En la vista de planta del nivel 0, <b>Insert ▸ Link CAD</b> y escoja <code>casa-ejemplo.dxf</code> (o el DXF del caso).</li><li>Unidades de importación: <b>milímetros</b>; posición: <b>origen con origen</b> (auto, origen interno); capas: todas o solo las visibles.</li><li>Fije el vínculo (<i>Pin</i>) para que no se mueva.</li></ol><p>Vincular, y no importar, mantiene el archivo liviano y permite recargar el DXF si cambia.</p>',
      verif: 'Los ejes del DXF caen exactamente sobre los ejes de Revit.' },
    { t: 'Muros, puertas y ventanas', donde: 'Architecture ▸ Wall (WA) ▸ Pick Lines · Door (DR) · Window (WN)',
      html: '<ol><li>Duplique un tipo de muro básico y llámelo <code>Mampostería 150</code> con 150 mm de espesor.</li><li>Con <b>Wall</b> y la opción <b>Pick Lines</b> (o dibujando por el eje con línea de ubicación <i>Wall Centerline</i>), trace los muros sobre el DXF.</li><li>Restricción superior: hasta el nivel <code>Fondo losa 2,50</code> con desfase de −230 mm para los muros bajo viga (quedan en 2,27 m).</li><li>Inserte puertas y ventanas con sus anchos y alféizares.</li></ol>',
      verif: 'En 3D, los muros de fachada y sobre ejes terminan en 2,27 m; M2, M4, M5 y M6, en 2,50 m.' },
    { t: 'Estructura', donde: 'Structure ▸ Column · Beam · Floor ▸ Floor: Structural',
      html: '<ol><li>Columnas de concreto de 300 × 300 mm en los nueve cruces de ejes, del NPT al nivel de cubierta.</li><li>Vigas de 300 × 350 mm sobre los ejes, con la cara superior en 2,62 m.</li><li>Losa estructural de 120 mm con la cara superior en 2,62 m.</li><li>Opcional: vigas de cimentación de 300 × 300 mm.</li></ol>',
      verif: 'Un corte por el eje 2 muestra el fondo de viga a 2,27 m y el fondo de losa a 2,50 m.' },
    { t: 'El tablero general', donde: 'Systems ▸ Electrical Equipment · Properties ▸ Panel Name · Distribution System',
      html: '<ol><li>Cargue una familia de tablero (panelboard) de la biblioteca y colóquela en el muro M5 del hall, con su centro a 1 600 mm.</li><li>En propiedades: nombre <code>TG</code>, sistema de distribución 120/240 V del paso 2, número de espacios 12 y totalizador.</li></ol>',
      verif: 'El tablero aparece en la planta eléctrica y en el navegador de proyecto, bajo los cuadros de tableros (al crearlo en el paso 11).' },
    { t: 'Dispositivos con su código', donde: 'Systems ▸ Device ▸ Electrical Fixture · Lighting · Systems ▸ Lighting Fixture',
      html: '<ol><li>Tomas: familias de tomacorriente doble alojadas en la cara del muro, con desfase de altura 300 mm (1 100 mm en mesones y baño).</li><li>Interruptores: dispositivos de iluminación a 1 200 mm.</li><li>Luminarias: luminarias alojadas en el fondo de la losa.</li><li>Ducha y estufa: conexiones de equipo o tomas especiales con la potencia de placa.</li><li>En el parámetro <b>Mark</b> de cada uno escriba el código del plano (<code>TS1</code>, <code>S5</code>, <code>XD</code>…).</li></ol>',
      verif: 'Una tabla de planificación de dispositivos (View ▸ Schedules) lista todos los puntos con su Mark, sin repetidos.' },
    { t: 'Circuitos de potencia', donde: 'Seleccionar tomas ▸ Modify | Electrical Fixtures ▸ Create Systems ▸ Power · Select Panel',
      html: '<ol><li>Seleccione las tomas de un circuito, por ejemplo las ocho del C2.</li><li><b>Modify | Electrical Fixtures ▸ Create Systems ▸ Power</b>: si se piden, tensión 120 V y 1 polo.</li><li>En la pestaña del circuito, <b>Select Panel</b> y haga clic en el tablero TG.</li><li>En propiedades del circuito, nombre de carga (<code>Tomas sala-comedor</code>), disparo 20 A y tipo de cable.</li><li>La estufa: circuito de 240 V y 2 polos.</li></ol>',
      verif: 'Al seleccionar una toma, las líneas discontinuas del circuito la unen con las demás y con el tablero.' },
    { t: 'Circuito de alumbrado y conmutación', donde: 'Seleccionar luminarias ▸ Create Systems ▸ Power · Create Systems ▸ Switch ▸ Select Switch',
      html: '<ol><li>Seleccione todas las luminarias y apliques y cree el circuito de potencia C1 al TG, 15 A.</li><li>Para cada grupo de luminarias que se enciende junto, cree un sistema de conmutación: <b>Create Systems ▸ Switch</b> y luego <b>Select Switch</b> sobre el interruptor.</li></ol>',
      verif: 'Cada luminaria pertenece al circuito C1 y a un sistema de interruptor.' },
    { t: 'Cuadro del tablero', donde: 'Analyze ▸ Panel Schedules · plantilla del cuadro',
      html: '<ol><li><b>Analyze ▸ Panel Schedules</b> y escoja el tablero TG.</li><li>Revise la posición de cada circuito: los de mayor carga se reparten entre las fases A y B.</li><li>Para mover un circuito de posición, use <b>Move Across</b> o <b>Move Up/Down</b> en el editor del cuadro.</li></ol>',
      verif: 'Las cargas por fase coinciden con el cuadro de cargas del capítulo 24 (fase A ≈ 8,7 kVA, fase B ≈ 8,9 kVA en la casa ejemplo).',
      ojo: 'Tomar como demanda la carga conectada que muestra Revit. La demanda para la acometida se calcula con el método de la NTC 2050 (capítulo 24).' },
    { t: 'Cables y un tubo modelado', donde: 'Systems ▸ Wire · Systems ▸ Conduit',
      html: '<ol><li>Opcional: con un circuito seleccionado, <b>Arc Wire</b> genera la representación en planta con las marcas de conductores.</li><li>Modele con <b>Conduit</b> un recorrido real, por ejemplo LC–LK1 por la losa: diámetro 1/2 in (16 mm nominal), con su bajante.</li></ol>',
      verif: 'En la vista 3D el tubo atraviesa la viga V-2(A-B) dentro de la losa.' },
    { t: 'Comprobación de interferencias', donde: 'Collaborate ▸ Interference Check ▸ Run Interference Check',
      html: '<ol><li>En la columna izquierda marque <b>Conduits</b>; en la derecha, <b>Structural Framing</b> y <b>Structural Columns</b>.</li><li>Ejecute y revise cada par: <b>Show</b> lleva la vista al cruce.</li><li>Exporte el informe (HTML) para los anexos de la memoria.</li></ol>',
      verif: 'El informe incluye el cruce del tramo modelado con la viga; compárelo con la lista de la sección siguiente.' },
    { t: 'Láminas y exportación', donde: 'View ▸ Sheet · arrastrar vistas · File ▸ Export ▸ PDF / CAD Formats / IFC',
      html: '<ol><li>Cree las láminas A01, E01, E02, E03 y E04 con un cajetín A3.</li><li>Arrastre a cada una su vista a 1:50; use plantillas de vista o filtros por circuito para mostrar solo lo que corresponde.</li><li>En E04 coloque el cuadro del tablero y un diagrama unifilar dibujado como vista de dibujo (<i>Drafting View</i>).</li><li>Exporte a PDF; si el docente lo pide, a DWG o IFC.</li></ol>',
      verif: 'Las cinco láminas salen en PDF a escala 1:50 con el rótulo completo, y el RVT abre en otro equipo.' }
  ];
})();
