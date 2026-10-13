/* Capítulo 10 — Productos eléctricos y su certificado */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C;

  /* Lista de materiales de la casa: { item, unidad, cantidad, libro2, evidencia } */
  RT.CSV = RT.CSV || {};
  RT.CSV.materiales = function (desp = 0.1) {
    const f = RT.listaMateriales(desp);
    const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    return '﻿' + ['Grupo;Producto;Unidad;Cantidad;Medida calculada;Libro 2 del RETIE;Evidencia'].concat(f.map((r) => [r.g, r.item, r.u, r.n, r.med, r.l2, r.ev].map(esc).join(';'))).join('\r\n');
  };
  RT.listaMateriales = function (desp = 0.1) {
    const q = L.R.cantidades(K);
    const filas = [];
    const up = (x) => Math.ceil(x * (1 + desp));
    for (const [k, v] of Object.entries(q.tubos)) filas.push({ g: 'Canalización', item: 'Tubo ' + k + ' (tramos de 3 m)', u: 'tramo', n: Math.ceil((v * (1 + desp)) / 3), med: C.fmt(v, 1) + ' m', l2: '2.3.29.4', ev: 'Certificado del tubo; foto antes del vaciado' });
    filas.push({ g: 'Canalización', item: 'Tubo PVC 1 in para el alimentador', u: 'tramo', n: Math.ceil((L.Q.acometida(K).Lal * (1 + desp)) / 3), med: C.fmt(L.Q.acometida(K).Lal, 1) + ' m', l2: '2.3.29.4', ev: 'Certificado; foto en el contrapiso' });
    const cab = Object.entries(q.cables).sort();
    for (const [k, v] of cab) filas.push({ g: 'Conductores', item: 'Conductor Cu THHN/THWN-2 ' + k, u: 'm', n: up(v), med: C.fmt(v, 1) + ' m', l2: '2.3.10', ev: 'Certificado y rotulado del carrete' });
    const ac = L.Q.acometida(K);
    filas.push({ g: 'Conductores', item: 'Alimentador Cu THHN/THWN-2 6 AWG (2 fases + neutro)', u: 'm', n: up(3 * (ac.Lal + 1)), med: '3 × ' + C.fmt(ac.Lal + 1, 1) + ' m', l2: '2.3.10', ev: 'Certificado; color de cada conductor' });
    filas.push({ g: 'Puesta a tierra', item: 'Conductor Cu desnudo 8 AWG (electrodo)', u: 'm', n: up(8), med: '≈ 8 m', l2: '2.3.10', ev: 'Certificado' });
    filas.push({ g: 'Puesta a tierra', item: 'Varilla Cu 5/8 in × 2,4 m', u: 'und', n: 2, med: '', l2: '2.3.15', ev: 'Certificado; foto de la marcación en los primeros 30 cm' });
    filas.push({ g: 'Puesta a tierra', item: 'Conector certificado para enterramiento o carga de soldadura exotérmica', u: 'und', n: 3, med: '', l2: '2.3.16', ev: 'Certificado (3.12.1 c)' });
    filas.push({ g: 'Puesta a tierra', item: 'Caja de inspección de 30 × 30 cm con tapa', u: 'und', n: 2, med: '', l2: '—', ev: 'Foto (3.12.1 d)' });
    for (const [k, v] of Object.entries(q.cajas)) filas.push({ g: 'Cajas', item: 'Caja ' + k, u: 'und', n: v, med: '', l2: '2.3.4', ev: 'Certificado; dimensiones internas' });
    const a = q.aparatos;
    const ap = [['Tomacorriente doble 15 A 125 V con polo a tierra', a.toma, '2.3.8'], ['Tomacorriente GFCI 15 A 125 V', a.gfci, '2.3.8 (2.3.8.1 r)'], ['Tapa o caja para intemperie (IP)', a.ip, '2.3.8'], ['Interruptor sencillo', a.int, '2.3.17.3'], ['Interruptor doble', a.int2, '2.3.17.3'], ['Interruptor conmutable', a.conm, '2.3.17.3'], ['Roseta o portalámpara y luminaria LED', a.lum + a.aplique, '—'], ['Salida para ducha con conector a prueba de agua', a.ducha, '2.3.16'], ['Salida para estufa 240 V 30 A', a.estufa, '2.3.8']];
    for (const [n, k, l2] of ap) if (k) filas.push({ g: 'Aparatos', item: n, u: 'und', n: k, med: '', l2, ev: l2 === '—' ? 'Ficha técnica' : 'Certificado; foto de la referencia' });
    const tab = [['Tablero monofásico trifilar de 12 circuitos con barras de neutro y tierra', 1, '2.3.31.2'], ['Interruptor automático 2P 60 A (totalizador)', 1, '2.3.17.2'], ['Interruptor automático 1P 15 A', 1, '2.3.17.2'], ['Interruptor automático 1P 20 A', K.electrico.circuitos.filter((c) => c.In === 20).length, '2.3.17.2'], ['Interruptor automático 1P 30 A con protección diferencial 30 mA', 1, '2.3.17.2'], ['Interruptor automático 2P 30 A', 1, '2.3.17.2']];
    for (const [n, k, l2] of tab) filas.push({ g: 'Tablero', item: n, u: 'und', n: k, med: '', l2, ev: 'Certificado; curvas del productor' });
    return filas;
  };

  RT.defineSim('lista-materiales', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    sim.group('Compra');
    sim.slider('d', { label: 'Desperdicio y holgura de compra', min: 0, max: 0.3, step: 0.01, value: 0.1, fmt: (v) => C.fmt(100 * v, 0) + ' %' });
    sim.out('n', 'Renglones');
    sim.out('r', 'Objeto del RETIE', { hl: true });
    sim.out('cab', 'Conductor de circuitos (m)');
    RT.botonDescarga(sim.ctrlBox, 'Descargar lista (CSV)', () => ['lista-materiales-casa-ejemplo.csv', RT.CSV.materiales(sim.p.d), 'text/csv']);
    sim.onDraw(() => {
      const f = RT.listaMateriales(sim.p.d);
      let g = null, h = '<table class="sim-tab" style="width:100%"><thead><tr><th>Producto</th><th>Cant.</th><th>Medida</th><th>Libro 2</th><th>Evidencia</th></tr></thead><tbody>';
      for (const r of f) {
        if (r.g !== g) { g = r.g; h += `<tr><td colspan="5" style="font-weight:700;color:var(--accent);padding-top:8px">${g}</td></tr>`; }
        h += `<tr><td>${r.item}</td><td>${r.n} ${r.u}</td><td>${r.med}</td><td>${r.l2}</td><td style="text-align:left;white-space:normal;font-family:var(--font-ui)">${r.ev}</td></tr>`;
      }
      box.innerHTML = h + '</tbody></table>';
      sim.set('n', f.length);
      sim.set('r', f.filter((r) => r.l2 !== '—').length + ' de ' + f.length);
      const tot = Object.values(L.R.cantidades(K).cables).reduce((s, v) => s + v, 0);
      sim.set('cab', C.fmt(tot, 0) + ' m');
    });
  });
})();
