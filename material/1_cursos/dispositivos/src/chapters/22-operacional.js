/* Capítulo 22 — El amplificador operacional */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const ops = ['LM741', 'TL081', 'LM358', 'OP07'];

  /* Configuraciones básicas con un solo A.O.: 'inv' inversor, 'noinv' no inversor, 'seg' seguidor */
  const oaSpec = (o) => {
    const inv = o.mode === 'inv';
    const parts = [['FG1', 'FG', -4, 12, 0, { wave: 'sin', amp: o.amp, f: o.f, rs: 1 }], ['U1', 'OA', 14, 12, 0, { model: o.q, flip: inv }], ['No', 'LBL', 21, 12, 0, { name: 'out' }], ['Ni', 'LBL', 2, 9, 2, { name: 'in' }]];
    const wires = [[[-1, 13], [-1, 14]], ['gndat', -1, 14], [[19, 12], [21, 12]], ['U1.2', [19, 12]]];
    if (inv) {
      parts.push(['Rin', 'R', 5, 11, 0, { r: o.rin }], ['Rf', 'R', 14, 7, 0, { r: o.rf }], ['Nv', 'LBL', 9, 13, 2, { name: 'vn' }]);
      wires.push(['FG1.OUT', 'Rin.0'], ['Rin.1', 'U1.1'], [[9, 11], [9, 7], 'Rf.0'], ['Rf.1', [19, 7], [19, 12]], [[2, 11], [2, 9]], [[9, 11], [9, 13]], [[11, 13], [11, 14]], ['gndat', 11, 14]);
    } else {
      const seg = o.mode === 'seg';
      parts.push(['Rg', 'R', 7, 15, 1, { r: seg ? 1e9 : o.rin }], ['Rf', 'R', 14, 21, 0, { r: seg ? 0.001 : o.rf }], ['Nv', 'LBL', 10, 15, 0, { name: 'vn' }]);
      wires.push(['FG1.OUT', [-1, 11], 'U1.0'], [[2, 11], [2, 9]], ['U1.1', [7, 13]], ['Rg.1', [7, 18]], ['gndat', 7, 18], [[19, 12], [19, 21], 'Rf.1'], ['Rf.0', [9, 21], [9, 13]], [[9, 15], [10, 15]]);
    }
    return { parts, wires };
  };
  const THEO = (T) => { const m = T.net.part('U1').p.model, mod = MOD.OA[m], inv = T.net.part('Rin') ? true : false; const rf = T.net.part('Rf').p.r, rg = inv ? T.net.part('Rin').p.r : T.net.part('Rg').p.r; const g = inv ? -rf / rg : 1 + rf / rg; return { g, inv, mod, fc: mod.gbw / Math.abs(inv ? 1 + rf / rg : g) }; };

  /* 22.1 Lazo abierto, ganancia, saturación y desplazamiento */
  EM.defineSim('c22-lazo', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.6, edit: 'values', panels: ['sweep'], autoSweep: true, net: { damage: false },
      hint: 'A.O. sin realimentación: la tensión de salida es A₀·(V₊ − V₋) hasta que se satura contra los rieles de alimentación (±15 V).',
      spec: { parts: [['VIN', 'VDC', 4, 12, 0, { v: 0 }], ['U1', 'OA', 14, 12, 0, { model: 'LM741' }], ['No', 'LBL', 21, 12, 0, { name: 'out' }]], wires: [[[4, 10], [4, 11], 'U1.0'], ['VIN.1', [4, 16]], ['gndat', 4, 16], [[11, 13], [11, 14]], ['gndat', 11, 14], [[17, 12], [21, 12]]] },
      controls: [
        { type: 'select', id: 'q', label: 'Amplificador operacional', options: ops.map((k) => [k, MOD.OA[k].name + ' · A₀ = ' + EM.si(MOD.OA[k].A0, '') + ', V_os = ' + EM.si(MOD.OA[k].vos, 'V')]), value: 'LM741', apply: (T, v) => T.set('U1', 'model', v) },
        { type: 'check', id: 'vos', label: 'Incluir la tensión de desplazamiento V_os', value: false, apply: (T, v) => T.set('U1', 'offs', !!v) },
        { type: 'slider', id: 'vin', label: 'Tensión de entrada diferencial V₊ − V₋', min: -300e-6, max: 300e-6, step: 1e-6, value: 0, unit: 'V', fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('VIN', 'v', v) }
      ],
      outs: [
        { id: 'vo', label: 'Tensión de salida', hl: true, fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.out), 'V') },
        { id: 'a0', label: 'Ganancia de lazo abierto A₀', fn: (T) => EM.si(MOD.OA[T.net.part('U1').p.model].A0, '') + ' (' + EM.fix(20 * Math.log10(MOD.OA[T.net.part('U1').p.model].A0), 0) + ' dB)' },
        { id: 'lin', label: 'Margen de entrada lineal ±V_cc/A₀', fn: (T) => { const m = MOD.OA[T.net.part('U1').p.model]; return '± ' + fmt((m.rails[0] - m.dropH) / m.A0, 'V'); } },
        { id: 'vos', label: 'Desplazamiento V_os del modelo', fn: (T) => fmt(MOD.OA[T.net.part('U1').p.model].vos, 'V') }
      ]
    });
    T.setSweep({ src: 'VIN', a: -300e-6, b: 300e-6, n: 200, measLabel: 'out' });
  });

  /* 22.2 Inversor, no inversor y seguidor */
  EM.defineSim('c22-amp', function (sim) {
    const cur = () => ({ mode: sim.p.m || 'inv', q: sim.p.q || 'TL081', rin: sim.p.rin || 10000, rf: sim.p.rf || 100000, amp: sim.p.a || 0.1, f: 1000 });
    const T = EM.Taller.mount(sim, {
      aspect: 1.1, edit: 'values', panels: ['scope', 'bode'], tdiv: 5e-4, net: { damage: false },
      hint: 'A.O. con realimentación negativa. En el inversor, el nodo «vn» (entrada inversora) queda a una tensión mínima: es el «cortocircuito virtual».',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }, { label: 'V₋', at: 'vn', color: '#ff8f5a' }],
      spec: oaSpec(cur()),
      controls: [
        { type: 'seg', id: 'm', label: 'Configuración', options: [['inv', 'Inversor'], ['noinv', 'No inversor'], ['seg', 'Seguidor']], value: 'inv', init: false, apply: (T, v) => { T.loadSpec(oaSpec(cur())); } },
        { type: 'select', id: 'q', label: 'Amplificador operacional', options: ops.map((k) => [k, MOD.OA[k].name + ' · GBW = ' + EM.si(MOD.OA[k].gbw, 'Hz')]), value: 'TL081', init: false, apply: (T, v) => T.set('U1', 'model', v) },
        { type: 'slider', id: 'rin', label: 'Resistor de entrada R₁ (a masa en el no inversor)', min: 1000, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => T.set(T.net.part('Rin') ? 'Rin' : 'Rg', 'r', v) },
        { type: 'slider', id: 'rf', label: 'Resistor de realimentación R_f', min: 1000, max: 1000000, value: 100000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => { if (sim.p.m !== 'seg') T.set('Rf', 'r', v); } },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal de entrada', min: 0.01, max: 3, value: 0.1, unit: 'V', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => T.set('FG1', 'amp', v) }
      ],
      outs: [
        { id: 'av', label: 'Ganancia medida V_sal / V_ent', hl: true, fn: (T) => { const o = T.stat('salida'), i = T.stat('entrada'); if (!o || !i || i.pp < 1e-4) return '—'; const g = o.pp / i.pp; return EM.fix(g, 2) + (THEO(T).g < 0 ? ' (invierte)' : ''); } },
        { id: 'avt', label: 'Ganancia ideal (−R_f/R₁ ó 1 + R_f/R₁)', fn: (T) => EM.fix(THEO(T).g, 2) + ' (' + EM.fix(20 * Math.log10(Math.abs(THEO(T).g)), 1) + ' dB)' },
        { id: 'fc', label: 'Ancho de banda ≈ GBW / (1 + R_f/R₁)', fn: (T) => fmt(THEO(T).fc, 'Hz') },
        { id: 'vn', label: 'Tensión pico a pico en la entrada inversora', fn: (T) => { const s = T.stat('V₋'); return s ? fmt(s.pp, 'V') : '—'; } },
        { id: 'sat', label: 'Estado de la salida', fn: (T) => { const o = T.stat('salida'); if (!o) return '—'; const m = MOD.OA[T.net.part('U1').p.model]; return Math.max(Math.abs(o.mx), Math.abs(o.mn)) > (m.rails[0] - m.dropH) * 0.98 ? '<b style="color:var(--warn-ink)">saturada</b>' : 'lineal'; } }
      ]
    });
    T.setBode(10, 1e7);
  });

  /* 22.3 Velocidad de respuesta (slew rate) */
  EM.defineSim('c22-sr', function (sim) {
    const TD = [1e-6, 2e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3];
    const T = EM.Taller.mount(sim, {
      aspect: 1.4, edit: 'values', panels: ['scope'], tdiv: 1e-5, net: { damage: false },
      hint: 'Seguidor de tensión con una señal senoidal grande: cuando la pendiente exigida supera la velocidad de respuesta del A.O., la salida se vuelve triangular.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: oaSpec({ mode: 'seg', q: 'LM741', amp: 5, f: 50000 }),
      controls: [
        { type: 'select', id: 'q', label: 'Amplificador operacional', options: ['LM741', 'TL081', 'LM358', 'OP07'].map((k) => [k, MOD.OA[k].name + ' · SR = ' + EM.fix(MOD.OA[k].sr / 1e6, 2) + ' V/µs']), value: 'LM741', apply: (T, v) => T.set('U1', 'model', v) },
        { type: 'slider', id: 'a', label: 'Amplitud de pico', min: 0.1, max: 10, value: 5, unit: 'V', log: true, fmt: (v) => EM.fix(v, 2), apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'slider', id: 'f', label: 'Frecuencia', min: 1000, max: 500000, value: 50000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('FG1', 'f', v); const want = 4 / v / 10; T.setTdiv(TD.reduce((m, x) => (Math.abs(Math.log(x / want)) < Math.abs(Math.log(m / want)) ? x : m), TD[0])); } }
      ],
      outs: [
        { id: 'req', label: 'Pendiente máxima exigida 2π·f·V_pk', hl: true, fn: (T) => { const p = T.net.part('FG1').p; return fmt(2 * Math.PI * p.f * p.amp / 1e6, 'V/µs'); } },
        { id: 'sr', label: 'Velocidad de respuesta del A.O. (SR)', fn: (T) => fmt(MOD.OA[T.net.part('U1').p.model].sr / 1e6, 'V/µs') },
        { id: 'fp', label: 'Ancho de banda de plena potencia SR/(2π·V_pk)', hl: true, fn: (T) => fmt(MOD.OA[T.net.part('U1').p.model].sr / (2 * Math.PI * T.net.part('FG1').p.amp), 'Hz') },
        { id: 'est', label: 'Estado', fn: (T) => { const p = T.net.part('FG1').p, sr = MOD.OA[T.net.part('U1').p.model].sr; return 2 * Math.PI * p.f * p.amp > sr ? '<b style="color:var(--warn-ink)">limitado por SR (distorsión)</b>' : 'sin limitación'; } },
        { id: 'vo', label: 'Salida pico a pico', fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.pp, 'V') : '—'; } }
      ]
    });
  });
})();
