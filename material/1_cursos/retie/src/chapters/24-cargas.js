/* Capítulo 24 — Cuadro de cargas y demanda */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, N = L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);

  RT.CSV = RT.CSV || {};
  RT.CSV.cuadro = function () {
    const f = L.Q.cuadro(K);
    return '﻿' + ['Circuito;Descripción;Ambientes;Luminarias;Tomas;Especiales;Carga (VA);Tensión (V);Corriente (A);Protección;Conductor (AWG);Tierra (AWG);Tubo PVC (in);Fase;Carga/protección (%)'].concat(f.map((r) => [r.id, r.nombre, r.amb, r.cuenta.lum, r.cuenta.toma, r.cuenta.esp, Math.round(r.va), r.V, C.fmt(r.I, 1), r.prot, r.awg, r.tierra, r.tubo, r.fase, Math.round(100 * r.carga)].join(';'))).join('\r\n');
  };
  RT.defineSim('cuadro-cargas', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    sim.group('Totales');
    sim.out('inst', 'Carga conectada', { hl: true });
    sim.out('A', 'Fase A');
    sim.out('B', 'Fase B');
    sim.out('dem', 'Demanda (método estándar)', { hl: true });
    RT.botonDescarga(sim.ctrlBox, 'Descargar cuadro (CSV)', () => ['cuadro-de-cargas-casa-ejemplo.csv', RT.CSV.cuadro(), 'text/csv']);
    if (RT.EMBED && RT.EMBED.xlsx) RT.botonDescarga(sim.ctrlBox, 'Plantilla con fórmulas (XLSX)', () => [RT.EMBED.xlsx.name, RT.b64aBytes(RT.EMBED.xlsx.b64), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    sim.onDraw(() => {
      const f = L.Q.cuadro(K), bal = L.Q.balance(K), d = L.Q.demanda(K);
      let h = '<table class="sim-tab cuadro" style="width:100%"><thead><tr><th>Circ.</th><th>Descripción</th><th class="num">Lum.</th><th class="num">Tomas</th><th class="num">Esp.</th><th class="num">VA</th><th class="num">V</th><th class="num">A</th><th>Protección</th><th class="num">AWG</th><th>Fase</th><th class="num">% In</th></tr></thead><tbody>';
      let tot = 0;
      for (const r of f) {
        tot += r.va;
        h += `<tr><td><b>${r.id}</b></td><td style="white-space:normal">${r.nombre}<br><small style="color:var(--ink-3)">${r.amb}</small></td><td class="num">${r.cuenta.lum || ''}</td><td class="num">${r.cuenta.toma || ''}</td><td class="num">${r.cuenta.esp || ''}</td><td class="num">${f0(r.va)}</td><td class="num">${r.V}</td><td class="num">${f1(r.I)}</td><td>${r.prot}</td><td class="num">${r.awg}</td><td>${r.fase}</td><td class="num" style="color:var(${r.carga > 0.8 ? '--mid' : '--ink'})">${f0(100 * r.carga)}</td></tr>`;
      }
      h += `<tr class="tot"><td></td><td>Total conectado</td><td></td><td></td><td></td><td class="num">${f0(tot)}</td><td></td><td></td><td>Totalizador 2P 60 A</td><td class="num">6</td><td></td><td></td></tr></tbody></table>`;
      box.innerHTML = h;
      sim.set('inst', f0(tot) + ' VA');
      sim.set('A', f0(bal.A) + ' VA · ' + f1(bal.IA) + ' A');
      sim.set('B', f0(bal.B) + ' VA · ' + f1(bal.IB) + ' A');
      sim.set('dem', f0(d.total) + ' VA · ' + f1(d.I240) + ' A');
    });
  });

  RT.defineSim('demanda', function (sim) {
    const box = RT.el('div', 'doc-out');
    sim.stage.append(box);
    sim.group('Vivienda');
    sim.slider('area', { label: 'Área por caras exteriores', min: 30, max: 200, step: 0.1, value: +K.areaConstruida().toFixed(1), unit: 'm²', fmt: f1 });
    sim.slider('npa', { label: 'Circuitos de pequeños artefactos', min: 1, max: 3, step: 1, value: 2, fmt: f0 });
    sim.slider('nlav', { label: 'Circuitos de lavandería', min: 0, max: 2, step: 1, value: 1, fmt: f0 });
    sim.group('Cargas especiales');
    sim.slider('est', { label: 'Estufa eléctrica (0 = sin estufa)', min: 0, max: 12, step: 0.5, value: 6, unit: 'kW', fmt: f1 });
    sim.slider('duc', { label: 'Ducha eléctrica (0 = sin ducha)', min: 0, max: 6000, step: 100, value: 3500, unit: 'W', fmt: f0 });
    sim.slider('cal', { label: 'Calentador de agua (0 = no)', min: 0, max: 6000, step: 100, value: 0, unit: 'W', fmt: f0 });
    sim.slider('sec', { label: 'Secadora eléctrica (0 = no)', min: 0, max: 6000, step: 100, value: 0, unit: 'W', fmt: f0 });
    sim.out('inst', 'Carga instalada');
    sim.out('dem', 'Demanda', { hl: true });
    sim.out('I', 'Corriente a 240 V', { hl: true });
    sim.out('aco', 'Acometida de cobre (60 °C)');
    sim.out('ci', 'Capacidad instalable');
    sim.out('ruta', 'Trámite', { wide: true });
    const pintar = () => {
      const fijos = [];
      if (sim.p.duc) fijos.push({ n: 'ducha ' + f0(sim.p.duc) + ' W', W: sim.p.duc });
      if (sim.p.cal) fijos.push({ n: 'calentador ' + f0(sim.p.cal) + ' W', W: sim.p.cal });
      const d = C.demandaVivienda({ area: sim.p.area, nPA: sim.p.npa, nLav: sim.p.nlav, estufas: sim.p.est ? [sim.p.est] : [], secadoras: sim.p.sec ? [sim.p.sec] : [], fijos });
      const awg = N.AWG.find((a) => N.AMPACIDAD[a][0] >= d.I240);
      const ci = C.capacidadInstalable(awg, 240), In = C.protMax(awg, 60);
      const r = C.rutaConformidad({ uso: 'residencial', cuentas: 1, kVA: ci.kVA, V: 240 });
      sim.set('inst', f0(d.instalada) + ' VA');
      sim.set('dem', f0(d.total) + ' VA');
      sim.set('I', f1(d.I240) + ' A');
      sim.set('aco', `${awg} AWG (${N.AMPACIDAD[awg][0]} A) con totalizador de ${In} A`);
      sim.set('ci', C.fmt(ci.kVA, 1) + ' kVA');
      sim.set('ruta', r.diseno + '. ' + (r.plena ? 'Certificación plena.' : 'Sin dictamen de inspección.'));
      box.innerHTML = '<h4>Cálculo paso a paso</h4><table><tr><th>Paso</th><th>VA</th><th>Fuente (NTC 2050)</th></tr>' + d.pasos.map((p) => `<tr${p.sub ? ' style="font-weight:700"' : ''}><td>${p.t}</td><td style="text-align:right;font-family:var(--font-mono)">${f0(p.va)}</td><td>${p.ref}</td></tr>`).join('') + `<tr style="font-weight:700"><td>Demanda total</td><td style="text-align:right;font-family:var(--font-mono)">${f0(d.total)}</td><td></td></tr></table><p style="font-size:13px;color:var(--ink-3);margin-top:8px">El renglón de factores reemplaza a los tres anteriores (alumbrado, pequeños artefactos y lavandería). Verifique las tablas en la NTC 2050 oficial.</p>`;
    };
    sim.onChange = pintar;
    pintar();
  });
})();
