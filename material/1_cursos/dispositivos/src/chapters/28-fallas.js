/* Capítulo 28 — Cortocircuitos, fallas y protección */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const L = (T) => T.net.netInfo.labelNet;

  /* ---------- 28.1 Fusible ---------- */
  EM.defineSim('c28-fusible', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['table'], net: { thermalSpeed: 10 },
      hint: 'Batería de automóvil (12.6 V, 5 mΩ) que alimenta una carga a través de un fusible. Sobrecargue la salida o provoque un cortocircuito y observe cuánto tarda en fundirse. (Los nodos con la misma etiqueta están unidos.)',
      spec: {
        parts: [['B1', 'BAT', 2, 12, 0, { kind: 'car' }], ['F1', 'FUSE', 10, 8, 0, { ir: 1, kind: 'fast' }], ['RL', 'R', 20, 12, 1, { r: 24, watt: 50 }], ['SC', 'SW', 28, 12, 1, { on: false, imax: 200 }]],
        wires: [['B1.0', '@b:u'], ['B1.1', 'gnd'], ['F1.0', '@b:l'], ['F1.1', '@c:r'], ['RL.0', '@c:u'], ['RL.1', 'gnd'], ['SC.0', '@c:u'], ['SC.1', 'gnd']]
      },
      controls: [
        { type: 'slider', id: 'ir', label: 'Corriente nominal del fusible', min: 0.25, max: 10, step: 0.05, value: 1, unit: 'A', fmt: (v) => EM.fix(v, 2), apply: (T, v) => T.set('F1', 'ir', v) },
        { type: 'seg', id: 'k', label: 'Tipo de fusible', options: [['fast', 'Rápido (F)'], ['slow', 'Retardado (T)']], value: 'fast', apply: (T, v) => T.set('F1', 'kind', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de la carga', min: 1, max: 100, value: 24, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 1), apply: (T, v) => T.set('RL', 'r', v) },
        { type: 'seg', id: 'sc', label: 'Cortocircuito en la carga', options: [['no', 'No'], ['si', 'Cortocircuito franco']], value: 'no', apply: (T, v) => T.set('SC', 'on', v === 'si') }
      ],
      outs: [
        { id: 'i', label: 'Corriente por el fusible', hl: true, fn: (T) => { const f = T.net.part('F1'); return f.dead ? '0 A' : fmt(T.net.v(L(T).b) - T.net.v(L(T).c) > 0 ? (T.net.v(L(T).b) - T.net.v(L(T).c)) / (0.02 + 0.1 / f.p.ir) : 0, 'A'); } },
        { id: 'r', label: 'Corriente / corriente nominal', fn: (T) => { const f = T.net.part('F1'); return f.dead ? '—' : EM.fix((T.net.v(L(T).b) - T.net.v(L(T).c)) / (0.02 + 0.1 / f.p.ir) / f.p.ir, 2) + '×'; } },
        { id: 'h', label: 'Calentamiento acumulado del hilo (1 = fusión)', fn: (T) => { const r = T.net.rt.F1; return r && !T.net.part('F1').dead ? EM.fix(Math.min(1, r.h || 0), 2) : T.net.part('F1').dead ? '1.00' : '0.00'; } },
        { id: 'st', label: 'Estado del fusible', hl: true, fn: (T) => (T.net.part('F1').dead ? '<b style="color:var(--warn-ink)">FUNDIDO</b>' : 'sano') },
        { id: 'v', label: 'Tensión en la carga', fn: (T) => fmt(T.net.v(L(T).c), 'V') }
      ]
    });
  });

  /* ---------- 28.2 Protección contra polaridad invertida ---------- */
  const polSpec = (kind) => {
    const parts = [['B1', 'VDC', 2, 12, 0, { v: 12 }], ['RL', 'R', 34, 12, 1, { r: 100, watt: 5 }], ['C1', 'C', 28, 12, 1, { c: 100e-6, kind: 'elec', vmax: 16 }]];
    const wires = [['B1.0', '@b:u'], ['B1.1', 'gnd'], ['C1.0', '@v:u'], ['C1.1', 'gnd'], ['RL.0', '@v:u'], ['RL.1', 'gnd']];
    if (kind === 'none') { parts.push(['W', 'JMP', 14, 8, 0, {}]); wires.push(['W.0', '@b:l'], ['W.1', '@v:r']); }
    else if (kind === 'serie') { parts.push(['D1', 'D', 14, 8, 0, { model: '1N5819' }]); wires.push(['D1.0', '@b:l'], ['D1.1', '@v:r']); }
    else if (kind === 'fusible') { parts.push(['F1', 'FUSE', 14, 8, 0, { ir: 0.5, kind: 'fast' }], ['D1', 'D', 8, 16, 1, { model: '1N5819' }]); wires.push(['F1.0', '@b:l'], ['F1.1', '@v:r'], ['D1.1', '@b:d'], ['D1.0', 'gnd']); }
    else { parts.push(['M1', 'PMOS', 14, 8, 0, { model: 'IRF9540' }]); wires.push(['M1.0', '@b:l'], ['M1.2', '@v:r'], ['M1.1', 'gnd']); }
    return { parts, wires };
  };
  EM.defineSim('c28-polaridad', function (sim) {
    const cur = () => ({ kind: sim.p.k || 'none' });
    const T = EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['table'], net: { thermalSpeed: 10 },
      hint: 'Carga (100 Ω y un electrolítico de 100 µF/16 V) alimentada por una fuente de 12 V que se puede conectar al revés. Pruebe cada protección. (Los nodos con la misma etiqueta están unidos.)',
      spec: polSpec('none'),
      controls: [
        { type: 'seg', id: 'k', label: 'Protección', options: [['none', 'Ninguna'], ['serie', 'Diodo en serie'], ['fusible', 'Fusible + diodo en paralelo'], ['pmos', 'MOSFET P («diodo ideal»)']], value: 'none', init: false, apply: (T, v) => { const p = T.net.part('B1').p.v; T.loadSpec(polSpec(v)); T.set('B1', 'v', p); } },
        { type: 'seg', id: 'p', label: 'Polaridad de la fuente', options: [['n', 'Correcta (+12 V)'], ['r', 'INVERTIDA (−12 V)']], value: 'n', apply: (T, v) => T.set('B1', 'v', v === 'n' ? 12 : -12) }
      ],
      outs: [
        { id: 'v', label: 'Tensión en la carga', hl: true, fn: (T) => fmt(T.net.v(L(T).v), 'V') },
        { id: 'pl', label: 'Potencia en la carga', fn: (T) => fmt(Math.pow(T.net.v(L(T).v), 2) / 100, 'W') },
        { id: 'ps', label: 'Pérdida en la protección (V_ent − V_carga)', fn: (T) => { const d = T.net.v(L(T).b) - T.net.v(L(T).v); return T.net.part('B1').p.v > 0 ? fmt(d, 'V') : '—'; } },
        { id: 'c', label: 'Condensador electrolítico', hl: true, fn: (T) => (T.net.part('C1').dead ? '<b style="color:var(--warn-ink)">DAÑADO por tensión inversa</b>' : 'sano') },
        { id: 'f', label: 'Fusible', fn: (T) => (T.net.part('F1') ? (T.net.part('F1').dead ? 'fundido' : 'sano') : 'no hay') }
      ]
    });
  });

  /* ---------- 28.3 Corriente de arranque (inrush) y termistor NTC ---------- */
  EM.defineSim('c28-inrush', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['scope'], tdiv: 1e-2, startZero: true, net: { damage: false },
      hint: 'Al cerrar el interruptor, el condensador de filtro descargado se comporta como un cortocircuito y absorbe una corriente de pico enorme. Un termistor NTC en serie la limita; una vez caliente, su resistencia baja y deja de perder potencia. (Los nodos con la misma etiqueta están unidos.)',
      probes: [{ label: 'tensión del condensador', at: 'c', color: '#ffd84a' }, { label: 'corriente (V en 0.1 Ω)', at: 'r0', ref: 'c', color: '#4ae3ff' }],
      spec: {
        parts: [['VS', 'VDC', 2, 12, 0, { v: 17 }], ['SW1', 'SW', 8, 8, 0, { on: true }], ['NT', 'NTC', 14, 8, 0, { r25: 10, beta: 3000, T: 25 }], ['RS', 'R', 22, 8, 0, { r: 0.1, watt: 5 }], ['C1', 'C', 30, 12, 1, { c: 2200e-6, kind: 'elec', vmax: 35 }], ['RL', 'R', 38, 12, 1, { r: 10, watt: 50 }]],
        wires: [['VS.0', '@vs:u'], ['VS.1', 'gnd'], ['SW1.0', '@vs:l'], ['SW1.1', 'NT.0'], ['NT.1', '@r0:r'], ['RS.0', '@r0:l'], ['RS.1', '@c:r'], ['C1.0', '@c:u'], ['C1.1', 'gnd'], ['RL.0', '@c:u'], ['RL.1', 'gnd']]
      },
      controls: [
        { type: 'seg', id: 'n', label: 'Limitador de arranque', options: [['no', 'Sin limitador'], ['frio', 'NTC de 10 Ω (frío, 25 °C)'], ['caliente', 'NTC caliente (110 °C)']], value: 'no', apply: (T, v) => { T.set('NT', 'T', v === 'caliente' ? 110 : 25); T.set('NT', 'r25', v === 'no' ? 0.001 : 10); } },
        { type: 'slider', id: 'c', label: 'Condensador de filtro', min: 100e-6, max: 10000e-6, value: 2200e-6, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('C1', 'c', v) }
      ],
      outs: [
        { id: 'rn', label: 'Resistencia del limitador', fn: (T) => { const p = T.net.part('NT').p; return fmt(S.ntc(p.T, p.r25, p.beta), 'Ω'); } },
        { id: 'ip', label: 'Corriente de pico teórica V/(R_NTC + 0.1 Ω)', hl: true, fn: (T) => { const p = T.net.part('NT').p; return fmt(17 / (S.ntc(p.T, p.r25, p.beta) + 0.1 + 0.02), 'A'); } },
        { id: 'ipm', label: 'Corriente de pico medida', hl: true, fn: (T) => { const s = T.stat('corriente (V en 0.1 Ω)'); return s ? fmt(s.mx / 0.1, 'A') : '—'; } },
        { id: 'e', label: 'Energía disipada en el limitador al cargar el condensador C·V²/2', fn: (T) => fmt(0.5 * T.net.part('C1').p.c * 17 * 17, 'J') }
      ]
    });
  });

  /* ---------- 28.4 Protección contra sobretensión: «crowbar» ---------- */
  EM.defineSim('c28-crowbar', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['table'], net: { thermalSpeed: 10 },
      hint: 'Un carril de 5 V alimentado por una fuente de resistencia interna 2 Ω. Si la fuente se avería y la tensión sube, el Zener de 6.2 V dispara el SCR, que pone el carril en cortocircuito y funde el fusible: la carga queda protegida. (Los nodos con la misma etiqueta están unidos.)',
      spec: {
        parts: [['VS', 'VDC', 2, 12, 0, { v: 5, rs: 2 }], ['F1', 'FUSE', 10, 8, 0, { ir: 1, kind: 'fast' }], ['RL', 'R', 24, 12, 1, { r: 50, watt: 5 }], ['ZD', 'ZD', 30, 8, 2, { vz: 6.2 }], ['Rg', 'R', 38, 8, 0, { r: 100 }], ['X1', 'SCR', 34, 16, 0, { igt: 0.005, ih: 0.05, imax: 8 }]],
        wires: [['VS.0', '@in:u'], ['VS.1', 'gnd'], ['F1.0', '@in:l'], ['F1.1', '@r:r'], ['RL.0', '@r:u'], ['RL.1', 'gnd'], ['ZD.1', '@r:u'], ['ZD.0', '@z:r'], ['Rg.0', '@z:l'], ['Rg.1', '@g:r'], ['X1.2', '@g:d'], ['X1.0', '@r:u'], ['X1.1', 'gnd']]
      },
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de la fuente (avería: sube)', min: 3, max: 15, step: 0.1, value: 5, unit: 'V', apply: (T, v) => T.set('VS', 'v', v) },
        { type: 'seg', id: 'cb', label: 'Protección crowbar', options: [['on', 'Con crowbar'], ['off', 'Sin crowbar']], value: 'on', apply: (T, v) => { T.net.part('X1').fault = v === 'on' ? null : { kind: 'open' }; } }
      ],
      outs: [
        { id: 'vr', label: 'Tensión en la carga', hl: true, fn: (T) => fmt(T.net.v(L(T).r), 'V') },
        { id: 'x', label: 'SCR del crowbar', fn: (T) => { const e = T.m('X1'); return e && e.closed ? '<b>conduce (carril en cortocircuito)</b>' : 'bloqueado'; } },
        { id: 'f', label: 'Fusible', hl: true, fn: (T) => (T.net.part('F1').dead ? '<b style="color:var(--warn-ink)">FUNDIDO: la fuente queda desconectada</b>' : 'sano') },
        { id: 'l', label: 'Carga', fn: (T) => (T.net.part('RL').dead ? '<b style="color:var(--warn-ink)">dañada</b>' : 'sana') }
      ]
    });
  });

  /* ---------- 28.5 Taller de diagnóstico: fallas de un amplificador ---------- */
  const FALLAS = [['ninguna', 'Sin falla'], ['R1', 'R₁ abierta'], ['R2', 'R₂ abierta'], ['RE', 'R_E abierta'], ['RC', 'R_C abierta'], ['CE', 'C_E (desacoplo) abierto'], ['CEc', 'C_E en cortocircuito'], ['Cin', 'C_in abierto'], ['Cout', 'C_out abierto'], ['Qce', 'Transistor: C–E en cortocircuito'], ['Qopen', 'Transistor: base abierta (daño)']];
  EM.defineSim('c28-diagnostico', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.1, edit: 'values', panels: ['scope', 'table'], tdiv: 5e-4, net: { damage: false },
      hint: 'El amplificador de emisor común del capítulo 18. Elija una falla y mida: las tensiones en continua (tabla) y la señal (osciloscopio) permiten identificarla.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: CX.amp({ mode: 'ce', amp: 0.005 }),
      controls: [
        { type: 'select', id: 'f', label: 'Falla inyectada', options: FALLAS, value: 'ninguna', apply: (T, v) => {
          for (const p of T.net.doc.parts) p.fault = null;
          const set = (id, kind) => { const P = T.net.part(id); if (P) P.fault = { kind }; };
          if (v === 'R1') set('R1', 'open'); else if (v === 'R2') set('R2', 'open'); else if (v === 'RE') set('RE', 'open'); else if (v === 'RC') set('RC', 'open');
          else if (v === 'CE') set('CE', 'open'); else if (v === 'CEc') set('CE', 'short'); else if (v === 'Cin') set('Cin', 'open'); else if (v === 'Cout') set('Cout', 'open');
          else if (v === 'Qce') set('Q1', 'short'); else if (v === 'Qopen') set('Q1', 'open');
        } }
      ],
      outs: [
        { id: 'vb', label: 'V_B (base)', fn: (T) => fmt(T.net.v(T.net.netInfo.pinNet.Q1[1]), 'V') },
        { id: 'vc', label: 'V_C (colector)', fn: (T) => fmt(T.net.v(T.net.netInfo.pinNet.Q1[0]), 'V') },
        { id: 've', label: 'V_E (emisor)', fn: (T) => fmt(T.net.v(T.net.netInfo.pinNet.Q1[2]), 'V') },
        { id: 'g', label: 'Ganancia medida de señal', hl: true, fn: (T) => { const o = T.stat('salida'), i = T.stat('entrada'); return o && i && i.pp > 1e-4 ? EM.fix(o.pp / i.pp, 1) : '—'; } },
        { id: 'n', label: 'Valores sanos: V_B = 2.75 V, V_C = 5.2 V, V_E = 2.1 V, ganancia ≈ 183', fn: () => '' }
      ]
    });
  });
})();
