/* Capítulo 14 — Instalaciones básicas: el artículo 3.28.1 */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, N = L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);

  RT.defineSim('gfci-zonas', function (sim) {
    const cv = sim.canvas({ aspect: 0.95, maxH: '760px' });
    let pto = { id: 'TX', tipo: 'toma', x: 3.2, y: 7.9, z: 0.6 };
    const plano = new RT.Plano(sim, cv, { capas: { gfci: true, tomas: true, esp: true, etiquetas: false } });
    plano.resaltar = () => '--ink-3';
    plano.editable = true;
    plano.pick = (px, py) => (Math.hypot(plano.X(pto.x) - px, plano.Y(pto.y) - py) < 18 ? { id: 'TX', p: pto, tip: 'Arrastre el tomacorriente' } : null);
    plano.onDrag = (p, wx, wy) => { pto.x = Math.max(-0.4, Math.min(8.4, wx)); pto.y = Math.max(-0.4, Math.min(10.4, wy)); };
    plano.extra = (ctx, pl) => {
      RT.simbolo(ctx, 'p-toma', pl.X(pto.x), pl.Y(pto.y), Math.max(9, 0.16 * pl.s), { color: '--bad', bg: '--canvas' });
      ctx.beginPath(); ctx.arc(pl.X(pto.x), pl.Y(pto.y), Math.max(12, 0.24 * pl.s), 0, 7); ctx.strokeStyle = RT.col('--bad'); ctx.lineWidth = 2; ctx.stroke();
    };
    sim.group('Toma de prueba');
    sim.check('meson', { label: 'Sirve el mesón (montada a 1,10 m sobre el mesón)', value: false });
    sim.out('amb', 'Recinto');
    sim.out('gf', '¿Requiere GFCI?', { hl: true });
    sim.out('raz', 'Razones', { wide: true });
    sim.onDraw(() => {
      const amb = K.ambientes.find((a) => { const r = K.libre(a); return pto.x >= r[0] && pto.x <= r[2] && pto.y >= r[1] && pto.y <= r[3]; });
      const ext = !amb;
      const p = Object.assign({}, pto, { amb: amb ? amb.id : 'exterior', ext, meson: sim.p.meson && amb && amb.id === 'cocina' });
      plano.draw();
      const raz = L.G.razonesGFCI(K, p).filter((r) => !r.ref.startsWith('RETIE 3.27.2'));
      sim.set('amb', amb ? amb.nombre : 'Exterior');
      sim.set('gf', raz.length ? '<span class="chip bad">Sí</span>' : '<span class="chip ok">No es obligatorio</span>');
      sim.set('raz', raz.length ? '<ul class="hallazgos">' + raz.map((r) => `<li><span class="ref">${r.ref}</span><span>${r.t}</span></li>`).join('') + '</ul>' : 'Ninguna de las ubicaciones de 210.8(A) aplica. En un lugar húmedo conviene igual una protección diferencial (3.27.2 e).');
    });
  });

  RT.defineSim('circuitos-minimos', function (sim) {
    const box = RT.el('div', 'doc-out');
    sim.stage.append(box);
    sim.group('Vivienda');
    sim.slider('area', { label: 'Área construida', min: 25, max: 150, step: 0.5, value: 82.7, unit: 'm²', fmt: f1 });
    sim.seg('aco', { label: 'Acometida (cobre)', options: [['8-120', '8 AWG · 120 V'], ['8-240', '8 AWG · 240 V'], ['6-240', '6 AWG · 240 V'], ['4-240', '4 AWG · 240 V']], value: '6-240' });
    sim.slider('msnm', { label: 'Altitud del municipio', min: 0, max: 3200, step: 10, value: 1760, unit: 'm', fmt: f0 });
    sim.check('agua', { label: 'Hay otro medio de calentamiento de agua (gas, solar)', value: false });
    sim.check('estufa', { label: 'Se usará estufa eléctrica', value: true });
    sim.out('kva', 'Capacidad instalable');
    sim.out('n', 'Circuitos mínimos', { hl: true });
    const pintar = () => {
      const [awg, V] = sim.p.aco.split('-');
      const ci = C.capacidadInstalable(awg, +V);
      const peq = sim.p.area < 50 && ci.kVA <= 7;
      const lista = [];
      if (peq) {
        lista.push(['Pequeños artefactos de cocina, despensa y comedor (puede incluir el baño)', '≥ 20 A', '3.28.1 l.1']);
        lista.push(['Plancha y lavadora', '≥ 20 A', '3.28.1 l.2']);
        lista.push(['Iluminación y tomas generales del resto', '≥ 20 A', '3.28.1 l.3']);
      } else {
        const va = 33 * sim.p.area, nGen = Math.max(1, Math.ceil(va / (120 * 15 * 0.8)));
        lista.push([`Alumbrado y tomas generales: ${f0(va)} VA a 33 VA/m² → ${nGen} circuito(s) de 15 A como mínimo, o su equivalente en 20 A`, '15 o 20 A', 'NTC 2050, 220.12 y 210.11(A)']);
        lista.push(['Pequeños artefactos de cocina (uno basta según el parágrafo 2)', '20 A', '210.11(C)(1) y RETIE 3.28.1 parágrafo 2']);
        lista.push(['Lavandería', '20 A', '210.11(C)(2)']);
        lista.push(['Baño: circuito exclusivo no obligatorio; sus tomas con GFCI', '—', 'RETIE 3.28.1 parágrafo 3']);
      }
      if (sim.p.msnm > N.UMBRAL.msnm_ducha && !sim.p.agua) lista.push(['Ducha eléctrica, circuito exclusivo (30 A si no se conoce el equipo)', '30 A + diferencial', '3.28.1 m y 3.17.15 b, c']);
      if (sim.p.estufa) lista.push(['Estufa eléctrica 240 V (capacidad para al menos una)', 'según la estufa', '3.28.1 n']);
      else lista.push(['Dejar capacidad en los circuitos de cocina para al menos una estufa eléctrica', '—', '3.28.1 n']);
      sim.set('kva', C.fmt(ci.kVA, 1) + ' kVA');
      sim.set('n', lista.filter((l) => l[1] !== '—').length + ' circuitos');
      box.innerHTML = `<h4>${peq ? 'Vivienda pequeña: literal l del artículo 3.28.1' : 'Regla general: NTC 2050 con los parágrafos del RETIE'}</h4><table><tr><th>Circuito</th><th>Protección</th><th>Fuente</th></tr>${lista.map((l) => `<tr><td>${l[0]}</td><td>${l[1]}</td><td>${l[2]}</td></tr>`).join('')}</table>
        ${peq ? '<p style="margin-top:10px">Con ≤ 7 kVA y menos de 50 m², un tomacorriente GFCI puede proteger en cascada los de pequeños artefactos y los del baño, si en el mesón hay máximo tres salidas y en el baño una (3.28.1 i).</p>' : '<p style="margin-top:10px">La casa ejemplo tiene nueve circuitos: alumbrado, dos de tomas generales, dos de cocina, ropas, ducha, estufa y baño. Supera el mínimo por criterio de diseño, para limitar la carga de cada circuito y separar las zonas húmedas.</p>'}`;
    };
    sim.onChange = pintar;
    pintar();
  });
})();
