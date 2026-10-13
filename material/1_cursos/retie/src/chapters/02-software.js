/* Capítulo 2 — Qué programa usar para qué */
(function () {
  'use strict';
  const RT = window.RT;

  const PROG = {
    plano: { n: 'Plano base', d: 'PDF, foto o plano de papel', abre: '—', guarda: 'PDF, JPG, PNG', exp: '—', nota: 'Escanee de frente; anote dos cotas confiables para escalar.' },
    librecad: { n: 'LibreCAD 2.2', d: 'CAD 2D libre (escritorio)', abre: 'DXF; algunos DWG; imágenes como referencia (Importar ▸ Insertar imagen)', guarda: 'DXF (R12 o 2007)', exp: 'PDF; imagen PNG, JPG o SVG', nota: 'Bloques y capas se guardan en el DXF. La impresión a escala se fija en la vista previa.' },
    sketchup: { n: 'SketchUp Free', d: 'Modelado 3D en el navegador (cuenta Trimble)', abre: 'SKP, JPG, PNG', guarda: 'SKP en Trimble Connect', exp: 'STL, PDF, PNG con marca de agua (DWG y DXF solo con suscripción)', nota: 'Necesita conexión a internet. Las escenas se guardan dentro del SKP.' },
    autocad: { n: 'AutoCAD (educativo)', d: 'CAD 2D/3D de Autodesk', abre: 'DWG, DXF, PDF (PDFIMPORT), imágenes (IMAGEATTACH)', guarda: 'DWG, DXF', exp: 'PDF por PLOT; tablas por DATAEXTRACTION', nota: 'Los atributos de bloque permiten contar tomas y luminarias por circuito.' },
    revit: { n: 'Revit (educativo)', d: 'BIM: modelo, planos y tablas en un archivo', abre: 'RVT; vincula DWG, DXF, IFC', guarda: 'RVT', exp: 'PDF, DWG, IFC; cuadros de tableros', nota: 'Detecta interferencias entre tubos y vigas (Colaborar ▸ Comprobación de interferencias).' },
    calc: { n: 'Hoja de cálculo', d: 'LibreOffice Calc o Excel', abre: 'ODS, XLSX, CSV', guarda: 'ODS, XLSX', exp: 'PDF', nota: 'Cuadro de cargas, balance y caída de tensión con fórmulas visibles.' },
    qet: { n: 'QElectroTech 0.100', d: 'Esquemas eléctricos libres', abre: 'QET', guarda: 'QET', exp: 'PDF, SVG, PNG, DXF', nota: 'Para el unifilar E04 con símbolos IEC.' },
    pdf: { n: 'Carpeta de entrega', d: 'Editables + PDF', abre: '—', guarda: 'A01, M3D, E01–E04, MEM', exp: '—', nota: 'Cada lámina en PDF a escala y su editable (DXF, DWG o RVT).' }
  };
  const RUTAS = {
    inicial: { n: 'Ruta inicial', nodos: { plano: [70, 150], librecad: [250, 80], sketchup: [250, 230], calc: [450, 300], qet: [450, 30], pdf: [630, 160] },
      flechas: [['plano', 'librecad', 'Insertar imagen y calcar a escala', 1], ['librecad', 'sketchup', 'PNG a escala conocida', 1], ['librecad', 'pdf', 'PDF a 1:50 + DXF', 0], ['sketchup', 'pdf', 'PDF de las escenas + SKP', 0], ['calc', 'pdf', 'PDF + XLSX', 0], ['qet', 'pdf', 'PDF del unifilar', 0], ['librecad', 'calc', 'conteo de puntos', 0]] },
    cad: { n: 'Ruta CAD', nodos: { plano: [70, 150], autocad: [250, 80], sketchup: [250, 230], calc: [450, 300], pdf: [630, 160] },
      flechas: [['plano', 'autocad', 'PDFIMPORT o IMAGEATTACH, escalar', 1], ['autocad', 'sketchup', 'PNG a escala (DWG solo con suscripción)', 1], ['autocad', 'calc', 'DATAEXTRACTION de atributos', 0], ['autocad', 'pdf', 'PLOT a PDF + DWG', 0], ['sketchup', 'pdf', 'PDF de las escenas + SKP', 0], ['calc', 'pdf', 'PDF + XLSX', 0]] },
    bim: { n: 'Ruta BIM', nodos: { plano: [70, 150], revit: [300, 150], calc: [480, 290], pdf: [630, 150] },
      flechas: [['plano', 'revit', 'vincular DWG o imagen y modelar', 1], ['revit', 'pdf', 'láminas PDF + RVT', 0], ['revit', 'calc', 'tablas exportadas (opcional)', 0], ['calc', 'pdf', 'memoria', 0]] }
  };

  RT.defineSim('flujo-archivos', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    box.style.padding = '8px';
    sim.stage.append(box);
    sim.group('Ruta');
    sim.seg('ruta', { options: [['inicial', 'Inicial'], ['cad', 'CAD'], ['bim', 'BIM']], value: 'inicial' });
    sim.outSep('Programa seleccionado');
    sim.out('n', 'Programa', { hl: true });
    sim.out('abre', 'Abre o importa', { wide: true });
    sim.out('guarda', 'Guarda', { wide: true });
    sim.out('exp', 'Exporta', { wide: true });
    sim.out('nota', 'Nota', { wide: true });
    let selN = 'librecad';
    const dibujar = () => {
      const R = RUTAS[sim.p.ruta];
      if (!R.nodos[selN]) selN = Object.keys(R.nodos)[1];
      const W = 720, H = 360, bw = 132, bh = 54;
      const s = [`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Flujo de archivos de la ${R.n}" style="max-width:${W}px;font-family:Barlow,sans-serif"><defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="var(--ink-2)"/></marker><marker id="fr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="var(--bad)"/></marker></defs>`];
      for (const [a, b, t, riesgo] of R.flechas) {
        const p = R.nodos[a], q = R.nodos[b];
        const dx = q[0] - p[0], dy = q[1] - p[1], L0 = Math.hypot(dx, dy), ux = dx / L0, uy = dy / L0;
        const cut = (u, w, h) => Math.min(Math.abs(w / 2 / (u[0] || 1e-9)), Math.abs(h / 2 / (u[1] || 1e-9)));
        const c0 = cut([ux, uy], bw, bh) + 4, c1 = cut([ux, uy], bw, bh) + 6;
        const x0 = p[0] + ux * c0, y0 = p[1] + uy * c0, x1 = q[0] - ux * c1, y1 = q[1] - uy * c1;
        s.push(`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${riesgo ? 'var(--bad)' : 'var(--ink-2)'}" stroke-width="1.6" ${riesgo ? 'stroke-dasharray="6 4"' : ''} marker-end="url(#${riesgo ? 'fr' : 'fa'})"/>`);
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        s.push(`<text x="${mx}" y="${my - 6}" font-size="11.5" text-anchor="middle" fill="${riesgo ? 'var(--bad)' : 'var(--ink-3)'}" paint-order="stroke" stroke="var(--canvas)" stroke-width="4">${t}</text>`);
      }
      for (const k in R.nodos) {
        const [x, y] = R.nodos[k], P = PROG[k], on = k === selN;
        s.push(`<g data-n="${k}" style="cursor:pointer"><rect x="${x - bw / 2}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="6" fill="${on ? 'var(--accent-soft)' : 'var(--surface)'}" stroke="${on ? 'var(--accent)' : 'var(--rule-strong)'}" stroke-width="${on ? 2 : 1}"/><text x="${x}" y="${y - 4}" font-size="14" font-weight="700" text-anchor="middle" fill="var(--ink)">${P.n}</text><text x="${x}" y="${y + 14}" font-size="10.5" text-anchor="middle" fill="var(--ink-3)">${P.d.length > 28 ? P.d.slice(0, 27) + '…' : P.d}</text></g>`);
      }
      s.push('</svg>');
      box.innerHTML = s.join('');
      box.querySelectorAll('g[data-n]').forEach((g) => g.addEventListener('click', () => { selN = g.dataset.n; dibujar(); }));
      const P = PROG[selN];
      sim.set('n', P.n); sim.set('abre', P.abre); sim.set('guarda', P.guarda); sim.set('exp', P.exp); sim.set('nota', P.nota);
    };
    sim.onChange = dibujar;
    dibujar();
  });

  RT.defineSim('elegir-ruta', function (sim) {
    const box = RT.el('div', 'doc-out');
    sim.stage.append(box);
    sim.group('El equipo');
    sim.select('cad', { label: 'Experiencia previa con CAD', options: [['0', 'Ninguna'], ['1', 'Básica (un curso de dibujo)'], ['2', 'Buena (AutoCAD fluido)']], value: '0' });
    sim.select('bim', { label: 'Experiencia con Revit u otro BIM', options: [['0', 'Ninguna'], ['1', 'Algún taller'], ['2', 'Proyecto completo']], value: '0' });
    sim.select('pc', { label: 'Computador disponible', options: [['web', 'Solo navegador o equipo modesto'], ['medio', 'Windows con 8 GB de RAM'], ['alto', 'Windows con 16 GB o más']], value: 'medio' });
    sim.select('adsk', { label: 'Acceso educativo de Autodesk', options: [['no', 'No o no se ha verificado'], ['si', 'Sí, verificado']], value: 'no' });
    sim.check('net', { label: 'Conexión a internet estable en las sesiones', value: true });
    sim.out('ruta', 'Ruta sugerida', { hl: true });
    const pintar = () => {
      const p = sim.p, cad = +p.cad, bim = +p.bim;
      let ruta, razones = [], riesgos = [];
      if (bim >= 1 && p.adsk === 'si' && p.pc === 'alto') {
        ruta = 'BIM (Revit)'; razones.push('Hay experiencia en BIM, licencia verificada y un equipo que soporta Revit.', 'Revit reúne modelo, plantas, circuitos y cuadros de tableros; la correspondencia entre archivos es automática.');
        riesgos.push('La curva de aprendizaje del módulo eléctrico consume tiempo de la semana 2.', 'Si un integrante no tiene licencia, no puede abrir el RVT: confirme el acceso de todos.');
      } else if (cad >= 2 && p.adsk === 'si' && p.pc !== 'web') {
        ruta = 'CAD (SketchUp Free + AutoCAD)'; razones.push('El equipo domina AutoCAD: capas, bloques con atributos y presentaciones a escala.', 'Los atributos permiten contar puntos por circuito y llevarlos al cuadro de cargas.');
        riesgos.push('SketchUp Free no importa DWG: el plano pasa como imagen PNG a escala.');
      } else {
        ruta = 'Inicial (SketchUp Free + LibreCAD)'; razones.push('No exige licencias y funciona en equipos modestos.', 'Es la ruta de referencia de la guía y del docente.');
        riesgos.push('La misma geometría vive en dos archivos: compruebe la correspondencia antes de cada entrega.');
        if (cad === 0) riesgos.push('Sin experiencia en CAD, cada integrante debe hacer completo el taller de LibreCAD (capítulo 29).');
      }
      if (!p.net) riesgos.push('SketchUp Free trabaja en el navegador y necesita internet. Si la conexión falla, consulte al docente por una alternativa sin conexión, como FreeCAD con su banco BIM, para el modelo 3D.');
      if (p.pc === 'web' && ruta.startsWith('BIM')) riesgos.push('Revit no corre en un equipo modesto.');
      sim.set('ruta', ruta);
      box.innerHTML = `<h4>Ruta sugerida: ${ruta}</h4><p><b>Por qué</b></p><ul>${razones.map((r) => `<li>${r}</li>`).join('')}</ul><p><b>Riesgos que hay que manejar</b></p><ul>${riesgos.map((r) => `<li>${r}</li>`).join('')}</ul><p><b>Complementos</b>: hoja de cálculo para el cuadro de cargas; QElectroTech o el mismo CAD para el unifilar; DIALux evo solo si quieren verificar la iluminación de un ambiente.</p><p style="font-size:13px;color:var(--ink-3)">Recuerde: el docente puede fijar una sola ruta para toda la clase. Las evidencias y la rúbrica son las mismas en cualquier ruta.</p>`;
    };
    sim.onChange = pintar;
    pintar();
  });
})();
