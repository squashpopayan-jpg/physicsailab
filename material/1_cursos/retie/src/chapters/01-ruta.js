/* Capítulo 1 — La ruta del proyecto */
(function () {
  'use strict';
  const RT = window.RT;

  RT.SEMANAS = [
    { n: 1, t: 'Exposiciones y consulta de fuentes', ev: 'Ficha normativa y ejemplo aplicado', caps: ['retie', 'diseno', 'productos', 'colores', 'canalizaciones', 'tableros', 'tierra', 'conformidad', 'exposicion'], sw: 'Navegador y PDF de los cuatro libros del RETIE',
      tareas: ['Descargar los cuatro libros del RETIE vigente y registrar su versión', 'Preparar la exposición asignada (8 a 10 minutos)', 'Entregar la ficha de una página: tema, numerales, tres requisitos, un ejemplo aplicado y un error frecuente', 'Guardar las fichas de todos los equipos para la fase práctica'] },
    { n: 2, t: 'Seleccionar el caso y aprender el software', ev: 'Planos base aprobados; archivo de prueba 3D y plano 2D con un símbolo eléctrico', caps: ['caso', 'software', 't-sketchup', 't-librecad'], sw: 'SketchUp Free y LibreCAD (o la ruta que fije el docente)',
      tareas: ['Escoger la vivienda (un piso, 60 a 120 m², 4 a 6 ambientes)', 'Completar y acotar el plano arquitectónico y el estructural', 'Calibrar la escala con una cota y comprobar otra', 'Primer taller: unidades, capas, bloques, cotas y exportación a PDF; cada integrante guarda su ejercicio'] },
    { n: 3, t: 'Modelar el espacio y reconocer necesidades eléctricas', ev: 'Modelo con dimensiones y lista de puntos y cargas por ambiente', caps: ['modelo3d', 'necesidades', 'uso-final'], sw: 'SketchUp Free; hoja de cálculo',
      tareas: ['Modelar muros, vanos y estructura con sus etiquetas', 'Hacer el inventario de necesidades por ambiente', 'Aplicar las reglas de tomas cada 1,8 m y de mesones', 'Identificar cargas especiales: ducha, estufa, lavadora'] },
    { n: 4, t: 'Distribuir puntos, circuitos y canalizaciones', ev: 'Borrador de plantas eléctricas y primera matriz normativa', caps: ['iluminacion', 'tomas', 'canal'], sw: 'LibreCAD; SketchUp para insertar los puntos',
      tareas: ['Dibujar E01 con interruptores y relación de control', 'Dibujar E02 con circuitos, GFCI y salidas especiales', 'Trazar E03: recorridos, cajas y marcas de conductores', 'Empezar la matriz normativa con al menos cuatro decisiones'] },
    { n: 5, t: 'Revisar cargas, coordinación y correspondencia', ev: 'Cuadro de cargas, diagrama unifilar y correcciones justificadas', caps: ['coordinacion', 'cargas', 'calculos', 'unifilar'], sw: 'Hoja de cálculo; LibreCAD o QElectroTech para el unifilar',
      tareas: ['Cuadro de cargas y balance de fases', 'Circuito representativo calculado (conductor, protección, caída de tensión)', 'Diagrama unifilar con la puesta a tierra', 'Revisar al menos dos conflictos con la estructura y documentar la solución'] },
    { n: 6, t: 'Cerrar el proyecto y sustentar', ev: 'Archivos editables, planos en PDF, memoria y sustentación', caps: ['cierre'], sw: 'Todos: exportación a PDF',
      tareas: ['Láminas a escala 1:50 con rótulo, leyenda y convenciones', 'Memoria de 4 a 6 páginas con la matriz normativa completa (8 decisiones o más)', 'Carpeta organizada con los códigos A01 a MEM', 'Ensayar la sustentación: cada integrante explica una decisión'] }
  ];

  RT.defineSim('ruta-semanas', function (sim) {
    const stage = RT.el('div', 'stage-scroll');
    sim.stage.append(stage);
    const sel = RT.el('div', 'semana');
    const det = RT.el('div');
    stage.append(sel, det);
    sim.group('Calendario');
    const hoy = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    const inicioDef = RT.store.get('ruta:inicio', iso(hoy));
    const row = RT.el('div', 'ctrl');
    row.innerHTML = '<label for="ruta-ini">Fecha de inicio (semana 1)</label>';
    const inp = document.createElement('input'); inp.type = 'date'; inp.id = 'ruta-ini'; inp.className = 'num-in'; inp.value = inicioDef;
    row.append(inp);
    sim._parent().append(row);
    sim.out('fin', 'Sustentación (fin de la semana 6)', { hl: true });
    sim.out('av', 'Tareas marcadas');
    let actual = RT.store.get('ruta:sem', 2);
    const fecha = (k) => { const d = new Date(inp.value + 'T12:00:00'); if (isNaN(d)) return null; d.setDate(d.getDate() + 7 * (k - 1)); return d; };
    const fmtD = (d) => d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—';
    const cuenta = () => {
      let k = 0, n = 0;
      RT.SEMANAS.forEach((s) => { const st = RT.store.get('chk:sem' + s.n, {}); n += s.tareas.length; k += s.tareas.filter((t, i) => st[String(i)]).length; });
      sim.set('av', `${k} de ${n}`);
    };
    const pintar = () => {
      sel.innerHTML = '';
      RT.SEMANAS.forEach((s) => {
        const b = RT.el('button', s.n === actual ? 'on' : '', `<b>${s.n}</b>${s.t}<br><small>${fmtD(fecha(s.n))}</small>`);
        b.type = 'button';
        b.addEventListener('click', () => { actual = s.n; RT.store.set('ruta:sem', actual); pintar(); });
        sel.append(b);
      });
      const s = RT.SEMANAS[actual - 1];
      const caps = s.caps.map((id) => { const c = RT.app && RT.app.byId[id]; return c ? `<a href="#${id}">${c.num} · ${c.title}</a>` : id; }).join(' · ');
      det.innerHTML = `<h4 style="font:650 22px var(--font-display);margin:14px 0 4px">Semana ${s.n}: ${s.t}</h4>
        <p style="margin:0 0 6px"><b>Evidencia que se entrega:</b> ${s.ev}.</p>
        <p style="margin:0 0 6px;font-size:15px"><b>Capítulos de la guía:</b> ${caps}</p>
        <p style="margin:0 0 10px;font-size:15px"><b>Software:</b> ${s.sw}</p>`;
      const lista = RT.el('div');
      det.append(lista);
      RT.checklist(lista, 'sem' + s.n, s.tareas.map((t) => ({ t })), { onChange: cuenta });
      const f6 = fecha(6);
      if (f6) { const fin = new Date(f6); fin.setDate(fin.getDate() + 6); sim.set('fin', fin.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })); }
      cuenta();
    };
    inp.addEventListener('change', () => { RT.store.set('ruta:inicio', inp.value); pintar(); });
    pintar();
  });
})();
