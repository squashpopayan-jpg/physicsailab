/* ===================================================================
   33-parts.js — Catálogo de componentes del Taller (EM.parts)
   Cada tipo define: pines (cuadrícula local), propiedades, cómo se traduce a elementos de
   simulación (build), sus límites de funcionamiento (rate) y su modo de falla.
   Sin DOM: se prueba en Node.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = root.EM, S = EM.spice, MOD = S.MOD;
  const PT = (EM.parts = {});
  const CAT = (PT.CAT = {});

  /* ---------- Valores con prefijos SI: «4,7k», «100n», «2.2u» ---------- */
  PT.parseVal = (s) => {
    if (typeof s === 'number') return s;
    s = String(s).trim().replace(/,/g, '.').replace(/[ΩVAFHΩ]|ohm|hz/gi, (m) => (/hz/i.test(m) ? '' : '')).replace(/\s+/g, '');
    const m = /^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(meg|[pnuµmkMGT])?/i.exec(s);
    if (!m) return NaN;
    let v = parseFloat(m[1]);
    const u = m[2];
    if (u) {
      if (/^meg$/i.test(u)) v *= 1e6;
      else v *= { p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, m: 1e-3, k: 1e3, M: 1e6, G: 1e9, T: 1e12 }[u] || (u === 'K' ? 1e3 : 1);
    }
    return v;
  };
  PT.fmt = (v, unit = '', d = 3) => (EM.si ? EM.si(v, unit, d) : String(v));

  /* Definición compacta de un tipo */
  const def = (type, o) => { o.type = type; CAT[type] = o; return o; };
  const two = [[-2, 0], [2, 0]];
  const vtwo = [[0, -2], [0, 2]];

  /* ======================= FUENTES Y TIERRA ======================= */
  def('GND', {
    name: 'Tierra', cat: 'Fuentes', pins: [[0, 0]], pn: ['GND'], bb: [-1, 0, 1, 1.6], ground: true, defaults: {}, props: [],
    build() {}
  });
  def('LBL', {
    name: 'Etiqueta de nodo', cat: 'Fuentes', pins: [[0, 0]], pn: ['·'], bb: [-0.5, -0.8, 3, 0.8], defaults: { name: 'A' },
    props: [{ k: 'name', label: 'Nombre', kind: 'txt' }], build() {}
  });
  def('VDC', {
    name: 'Fuente de tensión continua', cat: 'Fuentes', pins: [[0, -2], [0, 2]], pn: ['+', '−'], bb: [-1.2, -2, 1.2, 2],
    defaults: { v: 5, rs: 0.001 },
    props: [{ k: 'v', label: 'Tensión', unit: 'V', kind: 'num', min: -400, max: 400 }, { k: 'rs', label: 'Resistencia interna', unit: 'Ω', kind: 'num', min: 0 }],
    build(P, B) { B.ref.main = B.ref.src = B.add({ type: 'V', a: B.pin(0), b: B.pin(1), v: P.p.v, rs: Math.max(P.p.rs, 1e-4), acmag: 0 }); },
    rate: (P) => ({ imax: P.p.v ? Math.max(50, 5000 * Math.abs(P.p.v) / 12) : 50, rth: 0.5, label: 'fuente', iw: 'rs' }), fail: 'open', failDesc: 'La fuente se sobrecalentó'
  });
  def('BAT', {
    name: 'Batería / pila', cat: 'Fuentes', pins: [[0, -2], [0, 2]], pn: ['+', '−'], bb: [-1.2, -2, 1.2, 2],
    defaults: { kind: 'alk9', v: 9, rs: 1.7 },
    props: [{ k: 'kind', label: 'Tipo', kind: 'sel', opts: [['aa', 'Pila AA alcalina 1,5 V (0,15 Ω)'], ['alk9', 'Batería alcalina 9 V (1,7 Ω)'], ['li', 'Li-ion 3,7 V (0,08 Ω)'], ['pb', 'Plomo-ácido 12 V (0,02 Ω)'], ['car', 'Auto 12 V (0,005 Ω)']] }],
    apply(P) { const t = { aa: [1.5, 0.15], alk9: [9, 1.7], li: [3.7, 0.08], pb: [12.6, 0.02], car: [12.6, 0.005] }[P.p.kind] || [9, 1.7]; P.p.v = t[0]; P.p.rs = t[1]; },
    build(P, B) { B.ref.main = B.ref.src = B.add({ type: 'V', a: B.pin(0), b: B.pin(1), v: P.p.v, rs: P.p.rs, acmag: 0 }); },
    rate: (P) => ({ pmax: { aa: 1.2, alk9: 1.5, li: 6, pb: 80, car: 400 }[P.p.kind] || 2, rth: 4, label: 'batería', iw: 'rs' }), fail: 'open', failDesc: 'La batería se sobrecalentó y se abrió (en la realidad podría hincharse o incendiarse)'
  });
  def('PSU', {
    name: 'Fuente de laboratorio (CV/CC)', cat: 'Fuentes', pins: [[3, -1], [3, 1]], pn: ['+', '−'], bb: [-4, -3.2, 3.6, 3.2], instrument: true,
    defaults: { v: 5, ilim: 0.5 },
    props: [{ k: 'v', label: 'Tensión ajustada', unit: 'V', kind: 'num', min: 0, max: 30 }, { k: 'ilim', label: 'Límite de corriente', unit: 'A', kind: 'num', min: 0.001, max: 5 }],
    build(P, B) {
      const st = (B.rt.psu = B.rt.psu || { cc: false });
      const e = B.ref.main = B.ref.src = B.add({ id: 'v', type: 'V', a: B.pin(0), b: B.pin(1), v: P.p.v, rs: 0.02, acmag: 0, dead: st.cc });
      const ic = B.add({ id: 'i', type: 'I', a: B.pin(1), b: B.pin(0), i: P.p.ilim, dead: !st.cc });
      B.ref.psu = st;
      B.hook((c) => {
        if (!st.cc) {
          if (-e.i > P.p.ilim * 1.0005) { st.cc = true; e.dead = true; ic.dead = false; return true; }
        } else {
          const vo = c.v(c.node(B.pin(0))) - c.v(c.node(B.pin(1)));
          if (vo > P.p.v - 1e-4) { st.cc = false; e.dead = false; ic.dead = true; return true; }
        }
        return false;
      });
    },
    rate: () => ({ label: 'fuente' }), fail: 'open'
  });
  def('VAC', {
    name: 'Fuente de CA (senoidal)', cat: 'Fuentes', pins: [[0, -2], [0, 2]], pn: ['+', '−'], bb: [-1.2, -2, 1.2, 2],
    defaults: { amp: 5, f: 1000, off: 0, rs: 0.001, ph: 0 },
    props: [{ k: 'amp', label: 'Amplitud (pico)', unit: 'V', kind: 'num', min: 0, max: 600 }, { k: 'f', label: 'Frecuencia', unit: 'Hz', kind: 'num', min: 0.001, max: 1e9, log: true }, { k: 'off', label: 'Componente continua', unit: 'V', kind: 'num' }, { k: 'rs', label: 'Resistencia interna', unit: 'Ω', kind: 'num', min: 0 }],
    build(P, B) { B.ref.main = B.ref.src = B.add({ type: 'V', a: B.pin(0), b: B.pin(1), v: P.p.off, rs: Math.max(P.p.rs, 1e-4), wave: { kind: 'sin', amp: P.p.amp, offset: P.p.off, freq: P.p.f, phase: (P.p.ph || 0) * Math.PI / 180 }, acmag: 1, acph: P.p.ph || 0 }); },
    rate: () => ({ imax: 1e4, rth: 1, label: 'fuente' }), fail: 'open'
  });
  def('FG', {
    name: 'Generador de funciones', cat: 'Instrumentos', pins: [[3, -1], [3, 1]], pn: ['OUT', 'GND'], bb: [-4, -3.2, 3.6, 3.2], instrument: true,
    defaults: { wave: 'sin', amp: 1, f: 1000, off: 0, duty: 0.5, rs: 50, mi: 0.5, fm: 1000 },
    props: [{ k: 'wave', label: 'Forma de onda', kind: 'sel', opts: [['sin', 'Senoidal'], ['square', 'Cuadrada'], ['tri', 'Triangular'], ['saw', 'Diente de sierra'], ['pulse', 'Pulsos 0–Amp'], ['am', 'Modulada en amplitud (AM)']] },
      { k: 'amp', label: 'Amplitud (pico)', unit: 'V', kind: 'num', min: 0, max: 20 }, { k: 'f', label: 'Frecuencia', unit: 'Hz', kind: 'num', min: 0.001, max: 1e8, log: true },
      { k: 'off', label: 'Nivel DC (offset)', unit: 'V', kind: 'num', min: -10, max: 10 }, { k: 'duty', label: 'Ciclo de trabajo', kind: 'num', min: 0.01, max: 0.99 }, { k: 'mi', label: 'Índice de modulación (AM)', kind: 'num', min: 0, max: 1 }, { k: 'fm', label: 'Frecuencia moduladora (AM)', unit: 'Hz', kind: 'num', min: 0.1, max: 1e7, log: true }, { k: 'rs', label: 'Impedancia de salida', unit: 'Ω', kind: 'num', min: 0 }],
    build(P, B) {
      const p = P.p;
      const w = p.wave === 'am' ? { kind: 'fn', f: (t) => p.off + p.amp * (1 + p.mi * Math.sin(2 * Math.PI * p.fm * t)) * Math.sin(2 * Math.PI * p.f * t) } : p.wave === 'pulse' ? { kind: 'pulse', v0: p.off, v1: p.off + 2 * p.amp, freq: p.f, duty: p.duty } : { kind: p.wave, amp: p.amp, offset: p.off, freq: p.f, duty: p.duty };
      B.ref.main = B.ref.src = B.add({ type: 'V', a: B.pin(0), b: B.pin(1), v: p.off, rs: Math.max(p.rs, 1e-3), wave: w, acmag: 1 });
    },
    rate: () => ({ imax: 0.5, rth: 1, label: 'generador' }), fail: 'open', failDesc: 'La salida del generador se dañó por exceso de corriente'
  });
  def('MAINS', {
    name: 'Red eléctrica (120 V · 60 Hz)', cat: 'Fuentes', pins: [[0, -2], [0, 2]], pn: ['L', 'N'], bb: [-1.4, -2, 1.4, 2],
    defaults: { vrms: 120, f: 60, rs: 0.4, breaker: 15 },
    props: [{ k: 'vrms', label: 'Tensión eficaz', unit: 'V', kind: 'num', min: 0, max: 400 }, { k: 'f', label: 'Frecuencia', unit: 'Hz', kind: 'num', min: 40, max: 70 }, { k: 'breaker', label: 'Disyuntor', unit: 'A', kind: 'num', min: 0.1, max: 100 }],
    build(P, B) { B.ref.main = B.ref.src = B.add({ type: 'V', a: B.pin(0), b: B.pin(1), v: 0, rs: P.p.rs, wave: { kind: 'sin', amp: P.p.vrms * Math.SQRT2, freq: P.p.f }, acmag: 1 }); },
    rate: (P) => ({ breaker: P.p.breaker, label: 'red' }), fail: 'trip', failDesc: 'Saltó el disyuntor de la red'
  });
  def('IDC', {
    name: 'Fuente de corriente', cat: 'Fuentes', pins: [[0, -2], [0, 2]], pn: ['entra', 'sale'], bb: [-1.2, -2, 1.2, 2], defaults: { i: 0.001, mode: 'dc', f: 1000, duty: 0.5 },
    props: [{ k: 'i', label: 'Corriente', unit: 'A', kind: 'num' }, { k: 'mode', label: 'Forma', kind: 'sel', opts: [['dc', 'Continua'], ['pulse', 'Pulsos 0 – I'], ['sin', 'Senoidal 0 – I']] }, { k: 'f', label: 'Frecuencia (pulsos)', unit: 'Hz', kind: 'num', min: 0.01, max: 1e8, log: true }, { k: 'duty', label: 'Ciclo de trabajo', kind: 'num', min: 0.01, max: 0.99 }],
    build(P, B) { const m = P.p.mode; B.ref.main = B.ref.src = B.add({ type: 'I', a: B.pin(1), b: B.pin(0), i: m === 'dc' ? P.p.i : 0, wave: m === 'pulse' ? { kind: 'pulse', v0: 0, v1: P.p.i, freq: P.p.f, duty: P.p.duty } : m === 'sin' ? { kind: 'sin', offset: P.p.i / 2, amp: P.p.i / 2, freq: P.p.f } : null }); }, fail: 'open'
  });

  /* ======================= PASIVOS ======================= */
  def('R', {
    name: 'Resistor', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -0.9, 2, 0.9],
    defaults: { r: 1000, tol: 5, watt: 0.25, fam: 'carbon' },
    props: [{ k: 'r', label: 'Resistencia', unit: 'Ω', kind: 'num', min: 1e-3, max: 1e12, log: true }, { k: 'tol', label: 'Tolerancia', unit: '%', kind: 'sel', opts: [[0.1, '0,1 %'], [1, '1 %'], [5, '5 %'], [10, '10 %']] },
      { k: 'watt', label: 'Potencia nominal', unit: 'W', kind: 'sel', opts: [[0.125, '1/8 W'], [0.25, '1/4 W'], [0.5, '1/2 W'], [1, '1 W'], [2, '2 W'], [5, '5 W'], [10, '10 W'], [25, '25 W'], [50, '50 W'], [100, '100 W']] }],
    build(P, B) {
      const T = (B.rt && B.rt.T) || 25;
      const err = (B.cfg.tolErr ? P.err || 0 : 0), tc = (MOD.RES[P.p.fam] || MOD.RES.carbon).tc;
      const r = P.p.r * (1 + err) * (1 + tc * (T - 25));
      B.ref.main = B.add({ type: 'R', a: B.pin(0), b: B.pin(1), r });
      if (B.cfg.par && P.p.r > 100) B.add({ type: 'C', a: B.pin(0), b: B.pin(1), c: (MOD.RES[P.p.fam] || MOD.RES.carbon).cp, vprev: 0, iprev: 0 });
    },
    rate: (P) => ({ pmax: P.p.watt, rth: 125 / P.p.watt, label: 'resistor' }), fail: 'open', failDesc: 'El resistor se quemó (se abrió)'
  });
  def('POT', {
    name: 'Potenciómetro', cat: 'Pasivos', pins: [[-2, 0], [2, 0], [0, -2]], pn: ['A', 'B', 'cursor'], bb: [-2, -2, 2, 0.9],
    defaults: { r: 10000, pos: 0.5, taper: 'lin', watt: 0.25 },
    props: [{ k: 'r', label: 'Resistencia total', unit: 'Ω', kind: 'num', min: 1, max: 1e8, log: true }, { k: 'pos', label: 'Posición del cursor', kind: 'num', min: 0, max: 1, slider: true }, { k: 'taper', label: 'Curva', kind: 'sel', opts: [['lin', 'Lineal (B)'], ['log', 'Logarítmica (A, audio)']] }],
    build(P, B) {
      let w = P.p.taper === 'log' ? (Math.pow(10, 2 * P.p.pos) - 1) / 99 : P.p.pos;
      w = Math.min(1, Math.max(0, w));
      const ra = Math.max(P.p.r * w, 1e-3), rb = Math.max(P.p.r * (1 - w), 1e-3);
      B.ref.ra = B.add({ id: 'a', type: 'R', a: B.pin(0), b: B.pin(2), r: ra });
      B.ref.rb = B.add({ id: 'b', type: 'R', a: B.pin(2), b: B.pin(1), r: rb });
      B.ref.main = B.ref.ra;
    },
    rate: (P) => ({ pmax: P.p.watt, rth: 125 / P.p.watt, label: 'potenciómetro' }), fail: 'open'
  });
  def('C', {
    name: 'Condensador', cat: 'Pasivos', pins: two, pn: ['+', '−'], bb: [-2, -1.4, 2, 1.4],
    defaults: { c: 1e-6, kind: 'ceramic', vmax: 50 },
    props: [{ k: 'c', label: 'Capacitancia', unit: 'F', kind: 'num', min: 1e-15, max: 10, log: true }, { k: 'kind', label: 'Tipo', kind: 'sel', opts: Object.keys(MOD.CAP).map((k) => [k, MOD.CAP[k].name]) }, { k: 'vmax', label: 'Tensión máxima', unit: 'V', kind: 'num', min: 1, max: 5000 }],
    build(P, B) {
      const m = MOD.CAP[P.p.kind] || MOD.CAP.ceramic;
      let a = B.pin(0);
      const esr = m.esr(P.p.c);
      if (m.polar || B.cfg.par) { const n1 = B.node('e'); B.add({ id: 'esr', type: 'R', a, b: n1, r: esr }); a = n1; }
      if (B.cfg.par) { const n2 = B.node('l'); B.add({ id: 'esl', type: 'L', a, b: n2, l: m.esl, rl: 1e-3, vprev: 0, iprev: 0 }); a = n2; }
      B.ref.main = B.add({ id: 'c', type: 'C', a, b: B.pin(1), c: P.p.c, vprev: 0, iprev: 0 });
      if (B.cfg.par || P.p.c >= 1e-6) B.add({ id: 'leak', type: 'R', a, b: B.pin(1), r: Math.max(m.leak * 1e6 / (P.p.c * 1e6), 1e4) });
      if (P.ic !== undefined) B.ref.main.ic0 = P.ic;
    },
    rate: (P) => ({ vmax: P.p.vmax, vrev: (MOD.CAP[P.p.kind] || {}).polar ? 1.0 : null, pmax: 0.5, rth: 80, label: 'condensador' }), fail: 'burst', failDesc: 'El condensador se dañó (en la vida real puede reventar con una explosión de gas y electrolito)'
  });
  def('L', {
    name: 'Inductor', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -1, 2, 1],
    defaults: { l: 1e-3, kind: 'ferrite', imax: 1 },
    props: [{ k: 'l', label: 'Inductancia', unit: 'H', kind: 'num', min: 1e-9, max: 100, log: true }, { k: 'kind', label: 'Núcleo', kind: 'sel', opts: Object.keys(MOD.IND).map((k) => [k, MOD.IND[k].name]) }, { k: 'imax', label: 'Corriente máx. (saturación)', unit: 'A', kind: 'num', min: 0.001, max: 100 }],
    build(P, B) {
      const m = MOD.IND[P.p.kind] || MOD.IND.ferrite;
      const rdc = m.rdc(P.p.l);
      const n1 = B.node('r');
      B.add({ id: 'rdc', type: 'R', a: B.pin(0), b: n1, r: rdc });
      B.ref.main = B.add({ id: 'l', type: 'L', a: n1, b: B.pin(1), l: P.p.l, rl: 1e-3, vprev: 0, iprev: 0, lsat: m.isat ? P.p.imax : 0 });
      if (B.cfg.par) B.add({ type: 'C', a: B.pin(0), b: B.pin(1), c: m.cp, vprev: 0, iprev: 0 });
    },
    rate: (P) => ({ pmax: 1, imax: P.p.imax * 3, rth: 60, label: 'inductor' }), fail: 'open', failDesc: 'El inductor se sobrecalentó y su devanado se abrió'
  });
  def('TR', {
    name: 'Transformador', cat: 'Pasivos', pins: [[-3, -2], [-3, 2], [3, -2], [3, 2]], pn: ['P1', 'P2', 'S1', 'S2'], bb: [-3, -3, 3, 3],
    defaults: { n: 10, lp: 5, k: 0.99, rp: 8, rsx: 0.1, va: 20 },
    props: [{ k: 'n', label: 'Relación Np : Ns', kind: 'num', min: 0.01, max: 1000 }, { k: 'lp', label: 'Inductancia del primario', unit: 'H', kind: 'num', min: 1e-6, max: 1000 }, { k: 'k', label: 'Acoplamiento k', kind: 'num', min: 0.5, max: 0.9999 }, { k: 'rp', label: 'R del primario', unit: 'Ω', kind: 'num', min: 0 }, { k: 'rsx', label: 'R del secundario', unit: 'Ω', kind: 'num', min: 0 }, { k: 'va', label: 'Potencia nominal', unit: 'VA', kind: 'num', min: 0.1 }],
    build(P, B) {
      const p = P.p, ls = p.lp / (p.n * p.n);
      const a1 = B.node('p'), a2 = B.node('s');
      B.add({ id: 'rp', type: 'R', a: B.pin(0), b: a1, r: Math.max(p.rp, 1e-3) });
      B.add({ id: 'rs', type: 'R', a: B.pin(2), b: a2, r: Math.max(p.rsx, 1e-3) });
      B.ref.main = B.add({ id: 'x', type: 'X', W: [[a1, B.pin(1)], [a2, B.pin(3)]], ls: [p.lp, ls], k: p.k, rdc: [1e-3, 1e-3] });
    },
    rate: (P) => ({ pmax: P.p.va * 0.1, rth: 3, label: 'transformador' }), fail: 'open', failDesc: 'El transformador se sobrecalentó: aislamiento quemado'
  });
  def('TRCT', {
    name: 'Transformador con toma central', cat: 'Pasivos', pins: [[-3, -2], [-3, 2], [3, -3], [3, 0], [3, 3]], pn: ['P1', 'P2', 'S1', 'CT', 'S2'], bb: [-3, -4, 3, 4],
    defaults: { n: 10, lp: 5, k: 0.99, rp: 8, rsx: 0.2, va: 20 },
    props: [{ k: 'n', label: 'Relación Np : Ns (total)', kind: 'num', min: 0.01, max: 1000 }, { k: 'lp', label: 'Inductancia del primario', unit: 'H', kind: 'num', min: 1e-6, max: 1000 }, { k: 'k', label: 'Acoplamiento k', kind: 'num', min: 0.5, max: 0.9999 }, { k: 'rp', label: 'R del primario', unit: 'Ω', kind: 'num', min: 0 }, { k: 'rsx', label: 'R de cada mitad', unit: 'Ω', kind: 'num', min: 0 }, { k: 'va', label: 'Potencia nominal', unit: 'VA', kind: 'num', min: 0.1 }],
    build(P, B) {
      const p = P.p, lh = p.lp / ((p.n / 2) * (p.n / 2));
      const a1 = B.node('p'), a2 = B.node('s1'), a3 = B.node('s2');
      B.add({ id: 'rp', type: 'R', a: B.pin(0), b: a1, r: Math.max(p.rp, 1e-3) });
      B.add({ id: 'rs1', type: 'R', a: B.pin(2), b: a2, r: Math.max(p.rsx, 1e-3) });
      B.add({ id: 'rs2', type: 'R', a: B.pin(4), b: a3, r: Math.max(p.rsx, 1e-3) });
      B.ref.main = B.add({ id: 'x', type: 'X', W: [[a1, B.pin(1)], [a2, B.pin(3)], [B.pin(3), a3]], ls: [p.lp, lh, lh], k: p.k, rdc: [1e-3, 1e-3, 1e-3] });
    },
    rate: (P) => ({ pmax: P.p.va * 0.1, rth: 3, label: 'transformador' }), fail: 'open', failDesc: 'El transformador se sobrecalentó'
  });
  def('NTC', {
    name: 'Termistor NTC', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -1.2, 2, 1.2], defaults: { r25: 10000, beta: 3950, T: 25 },
    props: [{ k: 'r25', label: 'R a 25 °C', unit: 'Ω', kind: 'num', min: 10, max: 1e7, log: true }, { k: 'beta', label: 'Constante B', unit: 'K', kind: 'num', min: 1000, max: 6000 }, { k: 'T', label: 'Temperatura', unit: '°C', kind: 'num', min: -40, max: 150, slider: true }],
    build(P, B) { B.ref.main = B.add({ type: 'R', a: B.pin(0), b: B.pin(1), r: S.ntc(P.p.T, P.p.r25, P.p.beta) }); },
    rate: () => ({ pmax: 0.25, rth: 400, label: 'termistor' }), fail: 'open'
  });
  def('LDR', {
    name: 'Fotorresistencia (LDR)', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -1.6, 2, 1.2], defaults: { lux: 100, r10: 20000, gamma: 0.7 },
    props: [{ k: 'lux', label: 'Iluminación', unit: 'lx', kind: 'num', min: 0.1, max: 1e5, log: true, slider: true }, { k: 'r10', label: 'R a 10 lx', unit: 'Ω', kind: 'num', min: 100, max: 1e7, log: true }],
    build(P, B) { B.ref.main = B.add({ type: 'R', a: B.pin(0), b: B.pin(1), r: S.ldr(P.p.lux, P.p.r10, P.p.gamma) }); },
    rate: () => ({ pmax: 0.15, rth: 500, label: 'LDR' }), fail: 'open'
  });
  def('VAR', {
    name: 'Varistor (MOV)', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -1.2, 2, 1.2], defaults: { vn: 180, alpha: 25, ej: 20 },
    props: [{ k: 'vn', label: 'Tensión de varistor (1 mA)', unit: 'V', kind: 'num', min: 5, max: 1500 }, { k: 'alpha', label: 'No linealidad α', kind: 'num', min: 5, max: 60 }, { k: 'ej', label: 'Energía máxima', unit: 'J', kind: 'num', min: 0.1, max: 500 }],
    build(P, B) {
      const vs = P.p.vn / P.p.alpha, I0 = 1e-3 / Math.sinh(P.p.alpha), n = vs / S.VT;
      B.ref.main = B.add({ id: 'd1', type: 'D', a: B.pin(0), b: B.pin(1), Is: I0 / 2, n });
      B.add({ id: 'd2', type: 'D', a: B.pin(1), b: B.pin(0), Is: I0 / 2, n });
    },
    rate: (P) => ({ pmax: P.p.ej * 0.5, rth: 15, label: 'varistor' }), fail: 'short', failDesc: 'El varistor absorbió demasiada energía y quedó en cortocircuito'
  });
  def('LAMP', {
    name: 'Lámpara incandescente', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -1.6, 2, 1.6], defaults: { model: '12V' },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.LAMP).map((k) => [k, MOD.LAMP[k].name]) }],
    build(P, B) {
      const m = MOD.LAMP[P.p.model] || MOD.LAMP['12V'];
      const rhot = m.v * m.v / m.p;
      const st = (B.rt.lamp = B.rt.lamp || { th: 0.11 });
      const e = B.ref.main = B.add({ type: 'R', a: B.pin(0), b: B.pin(1), r: rhot * Math.pow(st.th, 1.2) });
      B.hook((c, dt) => {
        const pel = e.vab * e.vab / e.r;
        const tau = 0.06 * Math.sqrt(m.p / 5 + 0.2);
        const pr = m.p;
        if (dt > 0) {
          const d = (dt / tau) * (pel / pr - Math.pow(st.th, 4)) / 4 / Math.max(st.th, 0.1) * 4;
          st.th = Math.min(1.35, Math.max(0.11, st.th + Math.max(-0.05, Math.min(0.05, d))));
        }
        const rn = rhot * Math.pow(st.th, 1.2);
        if (Math.abs(rn - e.r) / e.r > 0.01) { e.r = rn; return dt === 0; }
        return false;
      });
      B.ref.lamp = st;
    },
    rate: (P) => ({ vmax: (MOD.LAMP[P.p.model] || MOD.LAMP['12V']).v * 1.6, pmax: 1e9, label: 'lámpara' }), fail: 'open', failDesc: 'El filamento se quemó'
  });
  def('FUSE', {
    name: 'Fusible', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -0.9, 2, 0.9], defaults: { ir: 1, kind: 'fast' },
    props: [{ k: 'ir', label: 'Corriente nominal', unit: 'A', kind: 'num', min: 0.01, max: 100 }, { k: 'kind', label: 'Tipo', kind: 'sel', opts: [['fast', 'Rápido (F)'], ['slow', 'Retardado (T)']] }],
    build(P, B) { B.ref.main = B.add({ type: 'R', a: B.pin(0), b: B.pin(1), r: 0.02 + 0.1 / P.p.ir }); },
    rate: (P) => ({ fuse: P.p.ir, slow: P.p.kind === 'slow', label: 'fusible' }), fail: 'open', failDesc: 'El fusible se fundió'
  });
  def('SW', {
    name: 'Interruptor', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -1.4, 2, 0.8], defaults: { on: false, momentary: false, imax: 10 },
    props: [{ k: 'on', label: 'Cerrado', kind: 'bool' }, { k: 'momentary', label: 'Pulsador (solo cerrado mientras se presiona)', kind: 'bool' }],
    build(P, B) { B.ref.main = B.add({ type: 'SW', a: B.pin(0), b: B.pin(1), closed: !!P.p.on, ron: 0.02, roff: 1e12 }); },
    rate: (P) => ({ imax: P.p.imax, label: 'contacto' }), fail: 'open', failDesc: 'Los contactos del interruptor se quemaron'
  });
  def('SPDT', {
    name: 'Conmutador (SPDT)', cat: 'Pasivos', pins: [[-2, 0], [2, -1], [2, 1]], pn: ['COM', 'A', 'B'], bb: [-2, -1.6, 2, 1.6], defaults: { pos: 0, imax: 10 },
    props: [{ k: 'pos', label: 'Posición', kind: 'sel', opts: [[0, 'COM–A'], [1, 'COM–B']] }],
    build(P, B) {
      B.ref.main = B.add({ id: 'a', type: 'SW', a: B.pin(0), b: B.pin(1), closed: +P.p.pos === 0, ron: 0.02, roff: 1e12 });
      B.add({ id: 'b', type: 'SW', a: B.pin(0), b: B.pin(2), closed: +P.p.pos === 1, ron: 0.02, roff: 1e12 });
    },
    rate: (P) => ({ imax: P.p.imax, label: 'contacto' }), fail: 'open'
  });
  def('RELAY', {
    name: 'Relé (SPDT)', cat: 'Pasivos', pins: [[-3, -1], [-3, 1], [3, 0], [3, -2], [3, 2]], pn: ['B1', 'B2', 'COM', 'NA', 'NC'], bb: [-3, -3, 3, 3],
    defaults: { vnom: 12, rc: 400, imax: 10, lc: 0.2 },
    props: [{ k: 'vnom', label: 'Tensión de la bobina', unit: 'V', kind: 'num', min: 1, max: 250 }, { k: 'rc', label: 'Resistencia de la bobina', unit: 'Ω', kind: 'num', min: 5, max: 1e5 }],
    build(P, B) {
      const st = (B.rt.relay = B.rt.relay || { on: false });
      const inom = P.p.vnom / P.p.rc;
      const n1 = B.node('c');
      B.add({ id: 'r', type: 'R', a: B.pin(0), b: n1, r: P.p.rc });
      const L = B.ref.main = B.add({ id: 'l', type: 'L', a: n1, b: B.pin(1), l: P.p.lc, rl: 1e-3, vprev: 0, iprev: 0 });
      const sNA = B.add({ id: 'na', type: 'SW', a: B.pin(2), b: B.pin(3), closed: st.on, ron: 0.05, roff: 1e12 });
      const sNC = B.add({ id: 'nc', type: 'SW', a: B.pin(2), b: B.pin(4), closed: !st.on, ron: 0.05, roff: 1e12 });
      B.hook((c) => {
        const i = Math.abs(L.i);
        let on = st.on;
        if (!on && i > 0.7 * inom) on = true; else if (on && i < 0.2 * inom) on = false;
        if (on !== st.on) { st.on = on; sNA.closed = on; sNC.closed = !on; return true; }
        return false;
      });
      B.ref.relay = st;
    },
    rate: (P) => ({ pmax: P.p.vnom * P.p.vnom / P.p.rc * 2.5, imax: P.p.imax, label: 'relé' }), fail: 'open'
  });
  def('MOT', {
    name: 'Motor de CC', cat: 'Pasivos', pins: two, pn: ['+', '−'], bb: [-1.8, -1.8, 1.8, 1.8], defaults: { vnom: 6, ra: 2, la: 1e-3, kt: 0.01, jm: 2e-6, bm: 2e-7, tl: 0 },
    props: [{ k: 'vnom', label: 'Tensión nominal', unit: 'V', kind: 'num', min: 1, max: 48 }, { k: 'ra', label: 'Resistencia del inducido', unit: 'Ω', kind: 'num', min: 0.05, max: 100 }, { k: 'tl', label: 'Par de carga', unit: 'N·m', kind: 'num', min: 0, max: 1 }],
    build(P, B) {
      const st = (B.rt.motor = B.rt.motor || { w: 0 });
      const n1 = B.node('a');
      B.add({ id: 'ra', type: 'R', a: B.pin(0), b: n1, r: P.p.ra });
      const L = B.ref.main = B.add({ id: 'la', type: 'L', a: n1, b: B.pin(1), l: P.p.la, rl: 1e-3, vprev: 0, iprev: 0, emf: P.p.kt * st.w });
      B.hook((c, dt) => {
        if (dt > 0) {
          const tl = P.p.tl * Math.sign(st.w || 1) * (Math.abs(st.w) > 0.5 ? 1 : 0);
          const acc = (P.p.kt * L.iprev - P.p.bm * st.w - tl) / P.p.jm;
          st.w += acc * dt;
          if (L.iprev < 0 && st.w < 0 && P.p.tl) st.w = 0;
        }
        L.emf = P.p.kt * st.w;
        return false;
      });
    },
    rate: (P) => ({ pmax: P.p.vnom * P.p.vnom / P.p.ra * 0.1 + 0.5, rth: 25, label: 'motor' }), fail: 'open', failDesc: 'El devanado del motor se quemó'
  });
  def('SPK', {
    name: 'Altavoz / zumbador (8 Ω)', cat: 'Pasivos', pins: two, pn: ['+', '−'], bb: [-1.4, -1.8, 2, 1.8], defaults: { r: 8, watt: 0.5 },
    props: [{ k: 'r', label: 'Impedancia', unit: 'Ω', kind: 'num', min: 1, max: 100 }, { k: 'watt', label: 'Potencia máxima', unit: 'W', kind: 'num', min: 0.1, max: 100 }],
    build(P, B) { const n1 = B.node('s'); B.add({ type: 'R', a: B.pin(0), b: n1, r: P.p.r * 0.9 }); B.ref.main = B.add({ type: 'L', a: n1, b: B.pin(1), l: 0.0005, rl: 1e-3, vprev: 0, iprev: 0 }); },
    rate: (P) => ({ pmax: P.p.watt * 1.5, rth: 30, label: 'altavoz' }), fail: 'open', failDesc: 'La bobina del altavoz se quemó'
  });

  /* ======================= DIODOS ======================= */
  const diodeBuild = (m, a, k, P, B, id) => {
    const idv = id || 'd';
    let an = a;
    if (m.rs > 0.001) { an = B.node(idv + 'r'); B.add({ id: idv + 'rs', type: 'R', a, b: an, r: m.rs }); }
    const el = B.add({ id: idv, type: 'D', a: an, b: k, Is: m.Is, n: m.n, vz: m.vz, ibv: m.ibv, nz: m.nz });
    if (m.vr && !m.vz) { el.vz = m.vr; el.ibv = 1e-3; el.nz = 2; } /* ruptura inversa */
    if (B.cfg.par && m.cj) B.add({ id: idv + 'c', type: 'C', a, b: k, c: m.cj, vprev: 0, iprev: 0 });
    return el;
  };
  def('D', {
    name: 'Diodo', cat: 'Diodos', pins: two, pn: ['A', 'K'], bb: [-2, -1.2, 2, 1.2], defaults: { model: '1N4007', hs: 0 },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.D).map((k) => [k, MOD.D[k].name + ' — ' + MOD.D[k].desc]) }],
    build(P, B) { B.ref.main = diodeBuild(MOD.D[P.p.model] || MOD.D['1N4007'], B.pin(0), B.pin(1), P, B); },
    rate: (P) => { const m = MOD.D[P.p.model] || MOD.D['1N4007']; return { pmax: m.pmax, imax: m.imax * 4, vrev: m.vr, rth: 80, label: 'diodo', tj: true }; }, fail: 'short', failDesc: 'El diodo se sobrecalentó: unión destruida (queda en cortocircuito)'
  });
  def('LED', {
    name: 'LED', cat: 'Diodos', pins: two, pn: ['A', 'K'], bb: [-2, -1.6, 2, 1.6], defaults: { color: 'rojo' },
    props: [{ k: 'color', label: 'Color', kind: 'sel', opts: Object.keys(MOD.LED).map((k) => [k, k === 'IR' ? 'Infrarrojo' : k[0].toUpperCase() + k.slice(1)]) }],
    build(P, B) { B.ref.main = diodeBuild(MOD.LED[P.p.color] || MOD.LED.rojo, B.pin(0), B.pin(1), P, B); },
    rate: (P) => { const m = MOD.LED[P.p.color] || MOD.LED.rojo; return { imax: m.imax * 3, vrev: 6, pmax: 0.15, rth: 300, label: 'LED' }; }, fail: 'open', failDesc: 'El LED se quemó (sobrecorriente)'
  });
  def('ZD', {
    name: 'Diodo Zener', cat: 'Diodos', pins: two, pn: ['A', 'K'], bb: [-2, -1.2, 2, 1.2], defaults: { vz: 5.1 },
    props: [{ k: 'vz', label: 'Tensión Zener', unit: 'V', kind: 'sel', opts: Object.keys(MOD.ZENER).map((k) => [+k, k + ' V']) }],
    build(P, B) { const m = MOD.ZENER[P.p.vz] || MOD.ZENER[5.1]; B.ref.main = diodeBuild(m, B.pin(0), B.pin(1), P, B); },
    rate: (P) => { const m = MOD.ZENER[P.p.vz] || MOD.ZENER[5.1]; return { pmax: m.pmax, rth: 200, label: 'Zener', tj: true }; }, fail: 'short', failDesc: 'El Zener excedió su potencia y se destruyó'
  });
  def('TVS', {
    name: 'Supresor TVS', cat: 'Diodos', pins: two, pn: ['A', 'K'], bb: [-2, -1.2, 2, 1.2], defaults: { vz: 6.4 },
    props: [{ k: 'vz', label: 'Tensión de ruptura', unit: 'V', kind: 'num', min: 3, max: 400 }],
    build(P, B) { const m = Object.assign({}, MOD.TVS['SMBJ5.0A'], { vz: P.p.vz }); B.ref.main = diodeBuild(m, B.pin(0), B.pin(1), P, B); },
    rate: () => ({ pmax: 1.5, rth: 80, label: 'TVS', pulse: 600 }), fail: 'short'
  });
  def('PD', {
    name: 'Fotodiodo', cat: 'Diodos', pins: two, pn: ['A', 'K'], bb: [-2, -1.8, 2, 1.2], defaults: { lux: 1000 },
    props: [{ k: 'lux', label: 'Iluminación', unit: 'lx', kind: 'num', min: 0, max: 1e5, slider: true }],
    build(P, B) {
      const m = MOD.PD.BPW34;
      B.ref.main = B.add({ id: 'd', type: 'D', a: B.pin(0), b: B.pin(1), Is: m.Is, n: m.n });
      B.add({ id: 'ph', type: 'I', a: B.pin(1), b: B.pin(0), i: P.p.lux * 1e-8 * 7.5 });
      if (B.cfg.par) B.add({ id: 'c', type: 'C', a: B.pin(0), b: B.pin(1), c: m.cj, vprev: 0, iprev: 0 });
    },
    rate: () => ({ pmax: 0.15, vrev: 32, rth: 300, label: 'fotodiodo' }), fail: 'short'
  });
  def('SOLAR', {
    name: 'Celda / panel solar', cat: 'Diodos', pins: [[0, -2], [0, 2]], pn: ['+', '−'], bb: [-1.8, -2, 1.8, 2], defaults: { kind: 'panel', irr: 1000 },
    props: [{ k: 'kind', label: 'Tipo', kind: 'sel', opts: [['cel', 'Celda de silicio (0,5 V)'], ['panel', 'Panel de 6 V']] }, { k: 'irr', label: 'Irradiancia', unit: 'W/m²', kind: 'num', min: 0, max: 1200, slider: true }],
    build(P, B) {
      const m = MOD.SOLAR[P.p.kind] || MOD.SOLAR.panel;
      const nx = B.node('x');
      B.add({ id: 'ph', type: 'I', a: B.pin(1), b: nx, i: m.isc1000 * P.p.irr / 1000 });
      B.ref.main = B.add({ id: 'd', type: 'D', a: nx, b: B.pin(1), Is: m.Is, n: m.n });
      B.add({ id: 'sh', type: 'R', a: nx, b: B.pin(1), r: m.rsh });
      B.add({ id: 'rs', type: 'R', a: nx, b: B.pin(0), r: m.rs });
    },
    rate: () => ({ pmax: 3, rth: 20, label: 'celda solar' }), fail: 'open'
  });
  def('VCAP', {
    name: 'Varicap (diodo de capacidad variable)', cat: 'Diodos', pins: two, pn: ['A', 'K'], bb: [-2, -1.4, 2, 1.4], defaults: {},
    props: [], build(P, B) { const m = MOD.VARICAP.BB910; B.add({ id: 'd', type: 'D', a: B.pin(0), b: B.pin(1), Is: m.Is, n: m.n }); B.ref.main = B.add({ id: 'c', type: 'C', a: B.pin(0), b: B.pin(1), c: m.c0, cvar: { c0: m.c0, vj: m.vj, m: m.m }, vprev: 0, iprev: 0 }); },
    rate: () => ({ vrev: 30, pmax: 0.2, rth: 250, label: 'varicap' }), fail: 'short'
  });
  def('BR', {
    name: 'Puente rectificador', cat: 'Diodos', pins: [[-3, 0], [3, 0], [0, -3], [0, 3]], pn: ['~', '~', '+', '−'], bb: [-3, -3, 3, 3], defaults: { model: '1N4007' },
    props: [{ k: 'model', label: 'Diodos', kind: 'sel', opts: ['1N4007', '1N5408', '1N5819', '1N4148'].map((k) => [k, MOD.D[k].name]) }],
    build(P, B) {
      const m = MOD.D[P.p.model] || MOD.D['1N4007'];
      B.ref.main = diodeBuild(m, B.pin(0), B.pin(2), P, B, 'd1'); /* ~1 → + */
      diodeBuild(m, B.pin(1), B.pin(2), P, B, 'd2');
      diodeBuild(m, B.pin(3), B.pin(0), P, B, 'd3'); /* − → ~1 */
      diodeBuild(m, B.pin(3), B.pin(1), P, B, 'd4');
    },
    rate: (P) => { const m = MOD.D[P.p.model] || MOD.D['1N4007']; return { pmax: m.pmax * 2, vrev: m.vr, rth: 40, label: 'puente' }; }, fail: 'short', failDesc: 'El puente rectificador falló'
  });
  def('SCR', {
    name: 'Tiristor (SCR)', cat: 'Diodos', pins: [[-2, 0], [2, 0], [1, 2]], pn: ['A', 'K', 'G'], bb: [-2, -1.4, 2, 2], defaults: { igt: 0.005, ih: 0.01, imax: 8 },
    props: [{ k: 'igt', label: 'Corriente de disparo IGT', unit: 'A', kind: 'num', min: 1e-5, max: 0.1 }, { k: 'ih', label: 'Corriente de mantenimiento IH', unit: 'A', kind: 'num', min: 1e-4, max: 0.5 }],
    build(P, B) {
      const st = (B.rt.scr = B.rt.scr || { on: false });
      const n1 = B.node('v');
      B.add({ id: 'dv', type: 'D', a: B.pin(0), b: n1, Is: S.isFor(0.9, 1, 1.8), n: 1.8, vz: 600, ibv: 1e-3, nz: 2 });
      const sw = B.ref.main = B.add({ id: 'sw', type: 'SW', a: n1, b: B.pin(1), closed: st.on, ron: 0.04, roff: 1e12 });
      const ng = B.node('g');
      B.add({ id: 'rg', type: 'R', a: B.pin(2), b: ng, r: 100 });
      B.add({ id: 'dg', type: 'D', a: ng, b: B.pin(1), Is: 1e-12, n: 1.5 });
      B.hook((c) => {
        const dvE = c.find(P.id + ':dv'), dgE = c.find(P.id + ':dg');
        if (!dvE || !dgE) return false;
        const ig = dgE.i, iA = dvE.i;
        let on = st.on;
        const swE = c.find(P.id + ':sw'), vak = swE ? c.v(dvE.na) - c.v(swE.nb) : dvE.vab;
        if (!on && ig > P.p.igt && vak > 0.5) on = true;
        else if (on && iA < P.p.ih && ig <= P.p.igt) on = false;
        if (on !== st.on) { st.on = on; sw.closed = on; return true; }
        return false;
      });
    },
    rate: (P) => ({ imax: P.p.imax * 1.6, pmax: 12, rth: 8, label: 'SCR' }), fail: 'short'
  });
  def('TRIAC', {
    name: 'Triac', cat: 'Diodos', pins: [[-2, 0], [2, 0], [1, 2]], pn: ['MT2', 'MT1', 'G'], bb: [-2, -1.4, 2, 2], defaults: { igt: 0.01, ih: 0.02, imax: 8 },
    props: [{ k: 'igt', label: 'Corriente de disparo IGT', unit: 'A', kind: 'num', min: 1e-5, max: 0.2 }, { k: 'ih', label: 'Corriente de mantenimiento IH', unit: 'A', kind: 'num', min: 1e-4, max: 0.5 }],
    build(P, B) {
      const st = (B.rt.triac = B.rt.triac || { on: false });
      const n1 = B.node('v'), n2 = B.node('w');
      B.add({ id: 'da', type: 'D', a: B.pin(0), b: n1, Is: S.isFor(0.85, 1, 1.8), n: 1.8, vz: 600, ibv: 1e-3, nz: 2 });
      B.add({ id: 'db', type: 'D', a: n2, b: B.pin(0), Is: S.isFor(0.85, 1, 1.8), n: 1.8, vz: 600, ibv: 1e-3, nz: 2 });
      const sw = B.ref.main = B.add({ id: 'sw', type: 'SW', a: n1, b: B.pin(1), closed: st.on, ron: 0.04, roff: 1e12 });
      const sw2 = B.add({ id: 'sw2', type: 'SW', a: n2, b: B.pin(1), closed: st.on, ron: 0.04, roff: 1e12 });
      B.add({ id: 'rg', type: 'R', a: B.pin(2), b: B.pin(1), r: 100 });
      B.hook((c) => {
        const g = c.find(P.id + ':rg'), a = c.find(P.id + ':da'), b = c.find(P.id + ':db');
        if (!g || !a || !b) return false;
        const ig = Math.abs(g.i), itot = Math.abs(a.i) + Math.abs(b.i);
        let on = st.on;
        if (!on && ig > P.p.igt) on = true; else if (on && itot < P.p.ih) on = false;
        if (on !== st.on) { st.on = on; sw.closed = on; sw2.closed = on; return true; }
        return false;
      });
    },
    rate: (P) => ({ imax: P.p.imax * 1.6, pmax: 12, rth: 8, label: 'triac' }), fail: 'short'
  });
  def('DIAC', {
    name: 'Diac', cat: 'Diodos', pins: two, pn: ['1', '2'], bb: [-2, -1.4, 2, 1.4], defaults: { vbo: 32, ih: 0.0003 },
    props: [{ k: 'vbo', label: 'Tensión de ruptura VBO', unit: 'V', kind: 'num', min: 10, max: 100 }],
    build(P, B) {
      const st = (B.rt.diac = B.rt.diac || { on: false });
      const sw = B.ref.main = B.add({ id: 'sw', type: 'SW', a: B.pin(0), b: B.pin(1), closed: st.on, ron: 15, roff: 1e12 });
      B.hook((c) => {
        const v = Math.abs(sw.vab), i = Math.abs(sw.i);
        let on = st.on;
        if (!on && v > P.p.vbo) on = true; else if (on && i < P.p.ih) on = false;
        if (on !== st.on) { st.on = on; sw.closed = on; return true; }
        return false;
      });
    },
    rate: () => ({ pmax: 0.5, rth: 150, label: 'diac' }), fail: 'short'
  });

  /* ======================= TRANSISTORES ======================= */
  const bjtBuild = (m, c, b, e, P, B, id) => {
    const q = B.add({ id: id || 'q', type: 'Q', a: c, b, c: e, Is: m.Is, bf: m.bf, betaR: m.br, vaf: m.vaf, pol: m.pol });
    if (B.cfg.par) { B.add({ id: (id || 'q') + 'cbe', type: 'C', a: b, b: e, c: m.cbe, vprev: 0, iprev: 0 }); B.add({ id: (id || 'q') + 'cbc', type: 'C', a: b, b: c, c: m.cbc, vprev: 0, iprev: 0 }); }
    return q;
  };
  def('NPN', {
    name: 'Transistor NPN', cat: 'Transistores', pins: [[2, -2], [-2, 0], [2, 2]], pn: ['C', 'B', 'E'], bb: [-2, -2, 2.4, 2], defaults: { model: 'BC547', hs: 0 },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.BJT).filter((k) => MOD.BJT[k].pol > 0).map((k) => [k, MOD.BJT[k].name + ' (' + MOD.BJT[k].pkg + ')']) }, { k: 'hs', label: 'Disipador de calor', kind: 'sel', opts: [[0, 'Sin disipador (aire libre)'], [20, 'Pequeño (20 K/W)'], [8, 'Mediano (8 K/W)'], [3, 'Grande (3 K/W)'], [1, 'Con ventilador (1 K/W)']] }],
    build(P, B) { B.ref.main = bjtBuild(MOD.BJT[P.p.model] || MOD.BJT.BC547, B.pin(0), B.pin(1), B.pin(2), P, B); },
    rate: (P) => { const m = MOD.BJT[P.p.model] || MOD.BJT.BC547; return { pmax: m.pmax, imax: m.ic * 2, vmax: m.vceo * 1.3, vrev: 8, rth: m.rth, label: 'transistor', tj: true }; }, fail: 'short', failDesc: 'El transistor se destruyó (queda en cortocircuito colector–emisor)'
  });
  def('PNP', {
    name: 'Transistor PNP', cat: 'Transistores', pins: [[2, -2], [-2, 0], [2, 2]], pn: ['C', 'B', 'E'], bb: [-2, -2, 2.4, 2], defaults: { model: 'BC557', hs: 0 },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.BJT).filter((k) => MOD.BJT[k].pol < 0).map((k) => [k, MOD.BJT[k].name + ' (' + MOD.BJT[k].pkg + ')']) }, { k: 'hs', label: 'Disipador de calor', kind: 'sel', opts: [[0, 'Sin disipador (aire libre)'], [20, 'Pequeño (20 K/W)'], [8, 'Mediano (8 K/W)'], [3, 'Grande (3 K/W)'], [1, 'Con ventilador (1 K/W)']] }],
    build(P, B) { B.ref.main = bjtBuild(MOD.BJT[P.p.model] || MOD.BJT.BC557, B.pin(0), B.pin(1), B.pin(2), P, B); },
    rate: (P) => { const m = MOD.BJT[P.p.model] || MOD.BJT.BC557; return { pmax: m.pmax, imax: m.ic * 2, vmax: m.vceo * 1.3, vrev: 8, rth: m.rth, label: 'transistor', tj: true }; }, fail: 'short', failDesc: 'El transistor se destruyó'
  });
  def('DARL', {
    name: 'Darlington TIP120', cat: 'Transistores', pins: [[2, -2], [-2, 0], [2, 2]], pn: ['C', 'B', 'E'], bb: [-2, -2, 2.4, 2], defaults: {}, props: [],
    build(P, B) {
      const d = MOD.DARL.TIP120, m1 = MOD.BJT[d.q1], m2 = MOD.BJT[d.q2];
      const nb2 = B.node('b2');
      B.ref.main = bjtBuild(m2, B.pin(0), nb2, B.pin(2), P, B, 'q2');
      bjtBuild(m1, B.pin(0), B.pin(1), nb2, P, B, 'q1');
      B.add({ id: 'r1', type: 'R', a: nb2, b: B.pin(2), r: d.r1 });
    },
    rate: () => ({ pmax: 65, imax: 10, vmax: 78, rth: 62, label: 'Darlington', tj: true }), fail: 'short'
  });
  const mosBuild = (m, d, g, s, P, B, id) => {
    const q = B.add({ id: id || 'm', type: 'M', a: d, b: g, c: s, vth: m.vth, k: m.k, lam: m.lam, pol: m.pol });
    if (m.body) { if (m.pol > 0) B.add({ id: 'db', type: 'D', a: s, b: d, Is: 1e-12, n: 1.2, vz: m.vds * 1.1, ibv: 1e-3, nz: 2 }); else B.add({ id: 'db', type: 'D', a: d, b: s, Is: 1e-12, n: 1.2, vz: m.vds * 1.1, ibv: 1e-3, nz: 2 }); }
    if (B.cfg.par) { B.add({ id: 'cgs', type: 'C', a: g, b: s, c: m.cgs, vprev: 0, iprev: 0 }); B.add({ id: 'cgd', type: 'C', a: g, b: d, c: m.cgd, vprev: 0, iprev: 0 }); B.add({ id: 'cds', type: 'C', a: d, b: s, c: m.cds, vprev: 0, iprev: 0 }); }
    return q;
  };
  def('NMOS', {
    name: 'MOSFET canal N', cat: 'Transistores', pins: [[2, -2], [-2, 0], [2, 2]], pn: ['D', 'G', 'S'], bb: [-2, -2, 2.4, 2], defaults: { model: '2N7000', vth: 2, k: 2e-3, hs: 0 },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.MOS).filter((k) => MOD.MOS[k].pol > 0).map((k) => [k, MOD.MOS[k].name + (MOD.MOS[k].rds ? ' — ' + MOD.MOS[k].rds : '')]) },
      { k: 'vth', label: 'Umbral Vth (modelo didáctico)', unit: 'V', kind: 'num', min: 0.2, max: 6, edu: true }, { k: 'k', label: 'k = μCox·W/L (didáctico)', unit: 'A/V²', kind: 'num', min: 1e-5, max: 50, edu: true }, { k: 'hs', label: 'Disipador de calor', kind: 'sel', opts: [[0, 'Sin disipador (aire libre)'], [20, 'Pequeño (20 K/W)'], [8, 'Mediano (8 K/W)'], [3, 'Grande (3 K/W)'], [1, 'Con ventilador (1 K/W)']] }],
    build(P, B) { let m = MOD.MOS[P.p.model] || MOD.MOS['2N7000']; if (m.edu) m = Object.assign({}, m, { vth: P.p.vth, k: P.p.k }); B.ref.main = mosBuild(m, B.pin(0), B.pin(1), B.pin(2), P, B); },
    rate: (P) => { const m = MOD.MOS[P.p.model] || MOD.MOS['2N7000']; return { pmax: m.pmax, imax: m.id * 1.5, vmax: m.vds * 1.2, vgs: m.vgsmax, rth: m.rth, label: 'MOSFET', tj: true }; }, fail: 'short', failDesc: 'El MOSFET se destruyó (drenador–fuente en cortocircuito)'
  });
  def('PMOS', {
    name: 'MOSFET canal P', cat: 'Transistores', pins: [[2, -2], [-2, 0], [2, 2]], pn: ['D', 'G', 'S'], bb: [-2, -2, 2.4, 2], defaults: { model: 'IRF9540', vth: 2, k: 1e-3, hs: 0 },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.MOS).filter((k) => MOD.MOS[k].pol < 0).map((k) => [k, MOD.MOS[k].name + (MOD.MOS[k].rds ? ' — ' + MOD.MOS[k].rds : '')]) },
      { k: 'vth', label: '|Vth| (didáctico)', unit: 'V', kind: 'num', min: 0.2, max: 6, edu: true }, { k: 'k', label: 'k (didáctico)', unit: 'A/V²', kind: 'num', min: 1e-5, max: 50, edu: true }, { k: 'hs', label: 'Disipador de calor', kind: 'sel', opts: [[0, 'Sin disipador (aire libre)'], [20, 'Pequeño (20 K/W)'], [8, 'Mediano (8 K/W)'], [3, 'Grande (3 K/W)'], [1, 'Con ventilador (1 K/W)']] }],
    build(P, B) { let m = MOD.MOS[P.p.model] || MOD.MOS.IRF9540; if (m.edu) m = Object.assign({}, m, { vth: P.p.vth, k: P.p.k }); B.ref.main = mosBuild(m, B.pin(0), B.pin(1), B.pin(2), P, B); },
    rate: (P) => { const m = MOD.MOS[P.p.model] || MOD.MOS.IRF9540; return { pmax: m.pmax, imax: m.id * 1.5, vmax: m.vds * 1.2, vgs: m.vgsmax, rth: m.rth, label: 'MOSFET', tj: true }; }, fail: 'short', failDesc: 'El MOSFET se destruyó'
  });
  const jfBuild = (m, d, g, s, P, B) => {
    const q = B.add({ id: 'j', type: 'M', a: d, b: g, c: s, vth: m.vth, k: m.k, lam: m.lam, pol: m.pol });
    if (m.pol > 0) { B.add({ id: 'gs', type: 'D', a: g, b: s, Is: 1e-14, n: 1 }); B.add({ id: 'gd', type: 'D', a: g, b: d, Is: 1e-14, n: 1 }); }
    else { B.add({ id: 'gs', type: 'D', a: s, b: g, Is: 1e-14, n: 1 }); B.add({ id: 'gd', type: 'D', a: d, b: g, Is: 1e-14, n: 1 }); }
    if (B.cfg.par) { B.add({ id: 'cgs', type: 'C', a: g, b: s, c: m.cgs, vprev: 0, iprev: 0 }); B.add({ id: 'cgd', type: 'C', a: g, b: d, c: m.cgd, vprev: 0, iprev: 0 }); }
    return q;
  };
  def('JFN', {
    name: 'JFET canal N', cat: 'Transistores', pins: [[2, -2], [-2, 0], [2, 2]], pn: ['D', 'G', 'S'], bb: [-2, -2, 2.4, 2], defaults: { model: '2N5457' },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.JFET).filter((k) => MOD.JFET[k].pol > 0).map((k) => [k, MOD.JFET[k].name + ' (Idss ' + (MOD.JFET[k].idss * 1e3) + ' mA, Vp −' + MOD.JFET[k].vp + ' V)']) }],
    build(P, B) { B.ref.main = jfBuild(MOD.JFET[P.p.model] || MOD.JFET['2N5457'], B.pin(0), B.pin(1), B.pin(2), P, B); },
    rate: (P) => { const m = MOD.JFET[P.p.model] || MOD.JFET['2N5457']; return { pmax: m.pmax, vmax: m.vds, rth: m.rth, label: 'JFET', tj: true }; }, fail: 'short'
  });
  def('JFP', {
    name: 'JFET canal P', cat: 'Transistores', pins: [[2, -2], [-2, 0], [2, 2]], pn: ['D', 'G', 'S'], bb: [-2, -2, 2.4, 2], defaults: { model: '2N5460' },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.JFET).filter((k) => MOD.JFET[k].pol < 0).map((k) => [k, MOD.JFET[k].name]) }],
    build(P, B) { B.ref.main = jfBuild(MOD.JFET[P.p.model] || MOD.JFET['2N5460'], B.pin(0), B.pin(1), B.pin(2), P, B); },
    rate: (P) => { const m = MOD.JFET[P.p.model] || MOD.JFET['2N5460']; return { pmax: m.pmax, vmax: m.vds, rth: m.rth, label: 'JFET', tj: true }; }, fail: 'short'
  });
  def('OPTO', {
    name: 'Optoacoplador (4N25)', cat: 'Transistores', pins: [[-3, -1], [-3, 1], [3, -1], [3, 1]], pn: ['A', 'K', 'C', 'E'], bb: [-3, -2, 3, 2], defaults: { ctr: 0.5 },
    props: [{ k: 'ctr', label: 'Relación de transferencia CTR', kind: 'num', min: 0.05, max: 5 }],
    build(P, B) {
      const m = MOD.LED.rojo, an = B.node('a');
      B.add({ id: 'rs', type: 'R', a: B.pin(0), b: an, r: 8 });
      B.ref.main = B.add({ id: 'd', type: 'D', a: an, b: B.pin(1), Is: m.Is * 0.7, n: 1.6 });
      /* fototransistor: fuente de corriente controlada por la corriente del LED, con saturación de VCE */
      B.add({ id: 'x', type: 'DX', a: an, b: B.pin(1), c: B.pin(2), d: B.pin(3), Is: m.Is * 0.7, n: 1.6, ctr: P.p.ctr });
      B.add({ id: 'sat', type: 'D', a: B.pin(3), b: B.pin(2), Is: 1e-12, n: 1.3 }); /* diodo contra tensión inversa C–E */
      B.add({ id: 'leak', type: 'R', a: B.pin(2), b: B.pin(3), r: 1e9 });
    },
    rate: () => ({ imax: 0.12, vmax: 60, pmax: 0.2, rth: 300, label: 'optoacoplador' }), fail: 'open'
  });

  /* ======================= CIRCUITOS INTEGRADOS ======================= */
  def('OA', {
    name: 'Amplificador operacional', cat: 'Circuitos integrados', pins: [[-3, -1], [-3, 1], [3, 0], [0, -2], [0, 2]], pn: ['+', '−', 'OUT', 'V+', 'V−'], bb: [-3, -2.5, 3.4, 2.5],
    defaults: { model: 'LM741', offs: false },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.OA).map((k) => [k, MOD.OA[k].name]) }, { k: 'offs', label: 'Incluir desplazamiento (Vos)', kind: 'bool' }],
    build(P, B) {
      const m = MOD.OA[P.p.model] || MOD.OA.LM741;
      const ext = B.connected(3) && B.connected(4);
      const e = {
        id: 'u', type: 'OA', a: B.pin(2), b: B.pin(0), c: B.pin(1), A0: m.A0, rout: m.rout, rin: m.rin, dropH: m.dropH, dropL: m.dropL, sr: m.sr, vos: P.p.offs ? m.vos : 0, iq: m.iq, oc: !!m.oc,
        tau: m.gbw > 0 ? m.A0 / (2 * Math.PI * m.gbw) : 0, y: 0
      };
      if (ext) { e.d = B.pin(3); e.e = B.pin(4); } else { e.vcc = m.rails[0]; e.vee = m.rails[1]; }
      B.ref.main = B.add(e);
      B.ref.railsInt = !ext;
    },
    rate: (P) => { const m = MOD.OA[P.p.model] || MOD.OA.LM741; return { imax: m.iomax * 3, vmax: m.vmax * 1.5, pmax: 0.8, rth: 150, label: 'A.O.' }; }, fail: 'open', failDesc: 'El amplificador operacional se dañó'
  });
  def('CMP', {
    name: 'Comparador (LM393)', cat: 'Circuitos integrados', pins: [[-3, -1], [-3, 1], [3, 0], [0, -2], [0, 2]], pn: ['+', '−', 'OUT', 'V+', 'V−'], bb: [-3, -2.5, 3.4, 2.5], defaults: {}, props: [],
    build(P, B) {
      const m = MOD.OA.LM393, ext = B.connected(3) && B.connected(4);
      const e = { id: 'u', type: 'OA', a: B.pin(2), b: B.pin(0), c: B.pin(1), A0: m.A0, rout: m.rout, rin: m.rin, dropH: 0, dropL: m.dropL, sr: 0, vos: 0, iq: m.iq, oc: true, tau: 0, y: 0 };
      if (ext) { e.d = B.pin(3); e.e = B.pin(4); } else { e.vcc = 5; e.vee = 0; }
      B.ref.main = B.add(e);
    },
    rate: () => ({ imax: 0.05, vmax: 40, pmax: 0.5, rth: 150, label: 'comparador' }), fail: 'open'
  });
  def('REG', {
    name: 'Regulador de tensión', cat: 'Circuitos integrados', pins: [[-3, 0], [3, 0], [0, 2]], pn: ['IN', 'OUT', 'COM'], bb: [-3, -1.6, 3, 2.4], defaults: { model: '7805', hs: 0 },
    props: [{ k: 'model', label: 'Modelo', kind: 'sel', opts: Object.keys(MOD.REG).map((k) => [k, MOD.REG[k].name]) }, { k: 'hs', label: 'Disipador de calor', kind: 'sel', opts: [[0, 'Sin disipador (aire libre)'], [20, 'Pequeño (20 K/W)'], [8, 'Mediano (8 K/W)'], [3, 'Grande (3 K/W)'], [1, 'Con ventilador (1 K/W)']] }],
    build(P, B) {
      const m = MOD.REG[P.p.model] || MOD.REG['7805'];
      const st = (B.rt.reg = B.rt.reg || { hot: false });
      B.ref.main = B.add({ id: 'u', type: 'REG', a: B.pin(1), b: B.pin(0), c: B.pin(2), vref: m.vref, vdo: m.vdo, ilim: st.hot ? 1e-4 : m.ilim, iq: m.iq, rout: m.rout, pol: m.pol, mode: st.hot ? 'off' : undefined });
      if (st.hot) B.ref.main.mode = 'cc';
    },
    rate: (P) => { const m = MOD.REG[P.p.model] || MOD.REG['7805']; return { pmax: m.pmax, vmax: m.vmax * 1.4, rth: m.rja || m.rth, rjc: m.rja ? m.rth : 1.5, label: 'regulador', tj: true, shutdown: 150 }; }, fail: 'open', failDesc: 'El regulador se dañó'
  });
  def('T555', {
    name: 'Temporizador 555', cat: 'Circuitos integrados', pins: [[-4, -3], [-4, -1], [-4, 1], [-4, 3], [4, -1], [4, 1], [0, -5], [0, 5]], pn: ['RESET', 'TRIG', 'THR', 'CTRL', 'OUT', 'DIS', 'VCC', 'GND'], bb: [-4, -5, 4, 5], defaults: {}, props: [],
    build(P, B) {
      const st = (B.rt.t555 = B.rt.t555 || { q: 1 });
      const vcc = B.pin(6), gnd = B.pin(7), ctrl = B.pin(3), n13 = B.node('r13');
      B.add({ id: 'r1', type: 'R', a: vcc, b: ctrl, r: 5000 });
      B.add({ id: 'r2', type: 'R', a: ctrl, b: n13, r: 5000 });
      B.add({ id: 'r3', type: 'R', a: n13, b: gnd, r: 5000 });
      B.add({ id: 'rq', type: 'R', a: vcc, b: gnd, r: 2200 });
      for (const pin of [1, 2, 0]) B.add({ id: 'rin' + pin, type: 'R', a: B.pin(pin), b: gnd, r: 1e9 });
      const out = B.ref.main = B.add({ id: 'out', type: 'V', a: B.pin(4), b: gnd, v: 0, rs: 7 });
      const dis = B.add({ id: 'dis', type: 'SW', a: B.pin(5), b: gnd, closed: !st.q, ron: 8, roff: 1e12 });
      const vh = (c) => c.v(out.nb === 0 ? 0 : 0);
      B.hook((c) => {
        const v = (n) => c.v(c.node(n));
        const gv = v(gnd), vc = v(vcc) - gv, ctl = v(ctrl) - gv, thr = v(B.pin(2)) - gv, trg = v(B.pin(1)) - gv, rst = v(B.pin(0)) - gv, lo = v(n13) - gv;
        let q = st.q;
        if (vc < 3 || rst < 0.4) q = 0;
        else if (trg < lo) q = 1;
        else if (thr > ctl) q = 0;
        const vo = q ? Math.max(vc - 1.7, 0) : 0.1;
        let ch = false;
        if (q !== st.q || Math.abs(out.v - vo) > 1e-6) { st.q = q; out.v = vo; dis.closed = !q; ch = true; }
        return ch;
      });
    },
    rate: () => ({ vmax: 20, imax: 0.3, pmax: 0.6, rth: 150, label: '555' }), fail: 'open'
  });

  /* ======================= INSTRUMENTOS ======================= */
  def('DMM', {
    name: 'Multímetro digital', cat: 'Instrumentos', pins: [[-1, 4], [1, 4]], pn: ['VΩ/A', 'COM'], bb: [-3, -4, 3, 4], instrument: true, defaults: { mode: 'V=' },
    props: [{ k: 'mode', label: 'Función', kind: 'sel', opts: [['V=', 'Tensión continua (V DC)'], ['V~', 'Tensión alterna (V AC, RMS)'], ['A=', 'Corriente continua (A DC)'], ['A~', 'Corriente alterna (A AC, RMS)'], ['Ω', 'Resistencia (Ω)'], ['→|', 'Prueba de diodo'], ['·)))', 'Continuidad']] }],
    build(P, B) {
      const mode = P.p.mode;
      if (B.rt.fuseBlown && /^A/.test(mode)) { B.add({ id: 'o', type: 'R', a: B.pin(0), b: B.pin(1), r: 1e12 }); return; }
      if (/^V/.test(mode)) B.ref.main = B.add({ id: 'r', type: 'R', a: B.pin(0), b: B.pin(1), r: 10e6 });
      else if (/^A/.test(mode)) B.ref.main = B.add({ id: 'r', type: 'R', a: B.pin(0), b: B.pin(1), r: 0.05 });
      else B.ref.main = B.add({ id: 'r', type: 'R', a: B.pin(0), b: B.pin(1), r: 1e12 }); /* Ω y diodo se miden aparte */
    },
    rate: (P) => (/^A/.test(P.p.mode) ? { imax: 10, label: 'fusible del multímetro', fuseA: 10 } : { vmax: 1000, label: 'multímetro' }), fail: 'open', failDesc: 'Se fundió el fusible del multímetro'
  });
  def('AMM', {
    name: 'Amperímetro', cat: 'Instrumentos', pins: [[-2, 0], [2, 0]], pn: ['+', '−'], bb: [-2, -1.6, 2, 1.6], instrument: true, defaults: { burden: 0.01 },
    props: [{ k: 'burden', label: 'Resistencia interna', unit: 'Ω', kind: 'num', min: 0, max: 100 }],
    build(P, B) { B.ref.main = B.add({ id: 'r', type: 'R', a: B.pin(0), b: B.pin(1), r: Math.max(P.p.burden, 1e-3) }); },
    rate: () => ({ imax: 2, label: 'amperímetro' }), fail: 'open', failDesc: 'Se fundió el fusible del amperímetro'
  });
  def('VM', {
    name: 'Voltímetro', cat: 'Instrumentos', pins: [[-2, 0], [2, 0]], pn: ['+', '−'], bb: [-2, -1.6, 2, 1.6], instrument: true, defaults: { rin: 10e6 },
    props: [{ k: 'rin', label: 'Resistencia de entrada', unit: 'Ω', kind: 'num', min: 1e3, max: 1e12, log: true }],
    build(P, B) { B.ref.main = B.add({ id: 'r', type: 'R', a: B.pin(0), b: B.pin(1), r: P.p.rin }); },
    rate: () => ({ vmax: 1000, label: 'voltímetro' }), fail: 'open'
  });
  def('PROBE', {
    name: 'Sonda de tensión', cat: 'Instrumentos', pins: [[0, 0]], pn: ['punta'], bb: [-0.6, -2, 3.2, 0.6], instrument: true, defaults: { name: 'V1' },
    props: [{ k: 'name', label: 'Nombre', kind: 'txt' }], build(P, B) { B.add({ id: 'r', type: 'R', a: B.pin(0), b: '0', r: 1e12 }); }
  });
  def('SCOPE', {
    name: 'Osciloscopio', cat: 'Instrumentos', pins: [[-3, 5], [0, 5], [3, 5]], pn: ['CH1', 'CH2', 'GND'], bb: [-5, -4.5, 5, 5.5], instrument: true, defaults: { probe: 1 },
    props: [{ k: 'probe', label: 'Punta', kind: 'sel', opts: [[1, '×1 (1 MΩ ‖ 100 pF con cable)'], [10, '×10 (10 MΩ ‖ 14 pF)']] }],
    build(P, B) {
      const x10 = +P.p.probe === 10, r = x10 ? 10e6 : 1e6, c = x10 ? 14e-12 : 110e-12;
      for (const k of [0, 1]) {
        B.add({ id: 'r' + k, type: 'R', a: B.pin(k), b: B.pin(2), r });
        if (B.cfg.par !== false) B.add({ id: 'c' + k, type: 'C', a: B.pin(k), b: B.pin(2), c, vprev: 0, iprev: 0 });
      }
      B.add({ id: 'gref', type: 'R', a: B.pin(2), b: '0', r: 1e-3 });
    },
    rate: () => ({ vmax: 400, label: 'osciloscopio' }), fail: 'open'
  });

  def('JMP', {
    name: 'Puente de falla (cortocircuito)', cat: 'Pasivos', pins: two, pn: ['1', '2'], bb: [-2, -1.2, 2, 1.2], defaults: { on: true },
    props: [{ k: 'on', label: 'Conectado (cortocircuito activo)', kind: 'bool' }],
    build(P, B) { B.ref.main = B.add({ type: 'SW', a: B.pin(0), b: B.pin(1), closed: !!P.p.on, ron: 0.005, roff: 1e12 }); },
    rate: () => ({ imax: 1e9, label: 'puente' }), fail: 'open'
  });

  /* Orden de las categorías para la paleta */
  PT.CATS = ['Fuentes', 'Pasivos', 'Diodos', 'Transistores', 'Circuitos integrados', 'Instrumentos'];

  /* Prefijo para el nombre de referencia: R1, C2, Q1… */
  PT.PREFIX = { R: 'R', POT: 'RV', C: 'C', L: 'L', TR: 'T', TRCT: 'T', NTC: 'RT', LDR: 'LDR', VAR: 'RV', LAMP: 'LP', FUSE: 'F', SW: 'S', JMP: 'X', SPDT: 'S', RELAY: 'K', MOT: 'M', SPK: 'LS', D: 'D', LED: 'D', ZD: 'DZ', TVS: 'D', PD: 'PD', SOLAR: 'PV', VCAP: 'D', BR: 'BR', SCR: 'SCR', TRIAC: 'TR', DIAC: 'DI', NPN: 'Q', PNP: 'Q', DARL: 'Q', NMOS: 'Q', PMOS: 'Q', JFN: 'Q', JFP: 'Q', OPTO: 'U', OA: 'U', CMP: 'U', REG: 'U', T555: 'U', VDC: 'V', BAT: 'B', PSU: 'PS', VAC: 'V', FG: 'FG', MAINS: 'AC', IDC: 'I', GND: 'GND', LBL: 'NET', DMM: 'DMM', AMM: 'A', VM: 'VM', PROBE: 'P', SCOPE: 'OSC' };

  /* Rotación/volteo de un punto local → rejilla global del esquema */
  PT.xf = (P, loc) => {
    let [x, y] = loc;
    if (P.flip) y = -y;
    const r = ((P.rot || 0) % 4 + 4) % 4;
    for (let i = 0; i < r; i++) { const t = x; x = -y; y = t; }
    return [P.x + x, P.y + y];
  };
  PT.pinPos = (P, i) => PT.xf(P, CAT[P.t].pins[i]);
  /* Valores de propiedad por defecto */
  PT.newPart = (type, x, y, extra) => {
    const c = CAT[type];
    const P = { t: type, x, y, rot: 0, flip: false, p: Object.assign({}, c.defaults) };
    if (c.apply) c.apply(P);
    return Object.assign(P, extra);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
