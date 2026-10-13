/* Capítulo 9 — Diseño, esquema constructivo y responsabilidades */
(function () {
  'use strict';
  const RT = window.RT, C = RT.L.C, N = RT.L.N;

  RT.defineSim('ruta-conformidad', function (sim) {
    const box = RT.el('div', 'doc-out');
    sim.stage.append(box);
    sim.group('Instalación');
    sim.seg('uso', { label: 'Uso', options: [['residencial', 'Residencial'], ['comercial', 'Comercial'], ['industrial', 'Industrial']], value: 'residencial' });
    sim.slider('cuentas', { label: 'Cuentas de energía en el proyecto', min: 1, max: 12, step: 1, value: 1, fmt: (v) => C.fmt(v, 0) });
    sim.check('lic', { label: 'Varias cuentas con una misma licencia', value: false });
    sim.group('Acometida');
    sim.seg('awg', { label: 'Calibre de cobre', options: [['8', '8'], ['6', '6'], ['4', '4'], ['2', '2'], ['1/0', '1/0 AWG']], value: '6' });
    sim.seg('V', { label: 'Tensión entre fases', options: [[120, '120 V'], [208, '208 V'], [240, '240 V']], value: 240 });
    sim.group('Características');
    sim.check('esp', { label: 'Incluye ambientes o equipos especiales', value: false });
    sim.check('pub', { label: 'Atiende público o es institución de enseñanza', value: false });
    sim.out('I', 'Capacidad de la acometida');
    sim.out('kVA', 'Capacidad instalable', { hl: true });
    sim.out('dis', 'Documento técnico', { hl: true });
    sim.out('cert', 'Demostración de la conformidad', { wide: true });
    const pintar = () => {
      const ci = C.capacidadInstalable(sim.p.awg, +sim.p.V);
      const r = C.rutaConformidad({ uso: sim.p.uso, cuentas: sim.p.cuentas, kVA: ci.kVA, V: +sim.p.V, especiales: sim.p.esp, publico: sim.p.pub, mismaLicencia: sim.p.lic });
      sim.set('I', ci.I + ' A (columna de ' + ci.col + ' °C)');
      sim.set('kVA', C.fmt(ci.kVA, 1) + ' kVA ' + (ci.kVA <= 15 ? '<span class="chip ok">≤ 15 kVA</span>' : '<span class="chip mid">&gt; 15 kVA</span>'));
      sim.set('dis', r.diseno);
      sim.set('cert', r.certificacion);
      box.innerHTML = `<h4>${r.diseno}</h4><p><b>Por qué:</b></p><ul>${r.motivos.map((m) => `<li>${m}</li>`).join('')}</ul><p><b>Documentos que se entregan:</b></p><ul>${r.documentos.map((d) => `<li>${d}</li>`).join('')}</ul><p style="font-size:13px;color:var(--ink-3)">Resultado orientativo de los artículos 3.3.1, 3.3.2, 4.3.2 y 4.3.5. En un caso real, la persona competente verifica la clasificación completa de la instalación.</p>`;
    };
    sim.onChange = pintar;
    pintar();
  });
})();
