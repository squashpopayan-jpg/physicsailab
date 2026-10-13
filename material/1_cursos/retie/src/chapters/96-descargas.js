/* Apéndice B — Kit del proyecto y descargas */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA;

  RT.defineSim('descargas', function (sim) {
    const box = RT.el('div', 'doc-out');
    sim.stage.append(box);
    sim.group('Kit completo');
    RT.botonDescarga(sim.ctrlBox, 'Descargar el kit (ZIP)', async () => ['kit-proyecto-retie.zip', await RT.kitProyecto(), 'application/zip'], { primary: true });
    sim.group('Archivos sueltos');
    const D = () => RT.dibujoCasa(K);
    RT.botonDescarga(sim.ctrlBox, 'DXF por capas (ZIP)', () => ['casa-ejemplo-dxf.zip', RT.zip([{ name: 'LEAME.txt', data: '﻿' + RT.leameKit() }, { name: 'casa-ejemplo.dxf', data: RT.dxfBytes(D()) }]), 'application/zip']);
    RT.botonDescarga(sim.ctrlBox, 'Planta para SketchUp (PNG)', async () => ['casa-ejemplo_planta_' + RT.PNG_PXM + 'px-por-m.png', await RT.pngPlanta(D()), 'image/png']);
    RT.botonDescarga(sim.ctrlBox, 'Unifilar (SVG)', () => ['unifilar-casa-ejemplo.svg', RT.unifilarSVG(K, { ink: '#1B1F22', bg: '#FFFFFF' }), 'image/svg+xml']);
    if (RT.EMBED && RT.EMBED.xlsx) RT.botonDescarga(sim.ctrlBox, 'Cuadro de cargas (XLSX)', () => [RT.EMBED.xlsx.name, RT.b64aBytes(RT.EMBED.xlsx.b64), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    RT.botonDescarga(sim.ctrlBox, 'Borrador de la memoria (MD)', () => ['memoria-borrador.md', RT.memoriaMD(RT.store.get('mem:eq', '')), 'text/markdown']);
    sim.out('dxf', 'Entidades del DXF');
    sim.out('kb', 'Tamaño del DXF');
    /* vista previa de la planta del PNG */
    const cv = sim.canvas({ aspect: 0.86, maxH: '520px' });
    sim.onDraw(() => {
      const d = D(), e = d.casaExt;
      const s = Math.min((cv.w - 12) / (e[2] - e[0]), (cv.h - 12) / (e[3] - e[1]));
      RT.draw.clear(cv);
      cv.ctx.fillStyle = '#FFFFFF'; cv.ctx.fillRect(0, 0, cv.w, cv.h);
      RT.pintarDibujo(cv.ctx, d, { s, ox: (cv.w - (e[2] - e[0]) * s) / 2 - e[0] * s, oy: (cv.h - (e[3] - e[1]) * s) / 2 + e[3] * s, on: new Set(['A-EJES', 'A-MUROS', 'A-VANOS', 'A-MOBILIARIO', 'A-NOMBRES', 'A-COTAS', 'S-COLUMNAS', 'S-VIGAS']), tinta: '#1B1F22', fondo: '#FFFFFF', font: RT.FONT_UI });
      sim.set('dxf', String(d.ents.length) + ' en ' + d.capas.length + ' capas');
      sim.set('kb', RT.f(RT.dxfBytes(d).length / 1024, 0) + ' KB');
      box.innerHTML = '<p style="font:13px var(--font-ui);color:var(--ink-3);margin:6px 0 0">Vista previa de la planta que va en el PNG para SketchUp (capas de arquitectura y estructura).</p>';
    });
  });
})();
