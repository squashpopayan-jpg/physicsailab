/* ===================================================================
   35-labparts.js — Piezas adicionales del laboratorio de protoboard (se suman a EM.parts.CAT):
   canales de fuente, generador con salida, multímetro con tomas y fusibles, osciloscopio de dos
   canales con punta ×1/×10, pulsador de 4 patas, A.O. y comparadores dobles, baterías, zumbador,
   display de 7 segmentos. Sin DOM.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = root.EM, S = EM.spice, MOD = S.MOD, PT = EM.parts, CAT = PT.CAT;
  const def = (type, o) => { o.type = type; CAT[type] = o; return o; };
  const two = [[-2, 0], [2, 0]];

  /* bombilla pequeña de linterna */
  MOD.LAMP['3V'] = { v: 3, p: 0.6, name: 'bombillo 3 V · 0,6 W' };
  MOD.LAMP['4V'] = { v: 4.5, p: 1.35, name: 'bombillo 4,5 V · 1,35 W' };

  /* ---------- Fuente de laboratorio: un canal (0–30 V, 0–3 A) con salida apagable ---------- */
  def('PSUC', {
    name: 'Canal de fuente', cat: 'Fuentes', pins: [[3, -1], [3, 1]], pn: ['+', '−'], instrument: true, hidden: true,
    defaults: { v: 5, ilim: 0.5, on: false },
    props: [], build(P, B) {
      if (!P.p.on) { B.ref.main = B.add({ id: 'o', type: 'R', a: B.pin(0), b: B.pin(1), r: 1e9 }); const st = (B.rt.psu = B.rt.psu || { cc: false }); st.cc = false; return; }
      CAT.PSU.build(P, B);
    },
    rate: () => ({ label: 'fuente' }), fail: 'open'
  });


  /* ---------- Secundario de un transformador reductor (aislado de la red y de tierra), 60 Hz ---------- */
  def('ACT', {
    name: 'Transformador reductor (secundario)', cat: 'Fuentes', pins: [[0, -2], [0, 2]], pn: ['~1', '~2'], instrument: true, hidden: true,
    defaults: { vrms: 12, f: 60, rs: 3, on: true },
    props: [],
    build(P, B) {
      if (!P.p.on) { B.ref.main = B.add({ id: 'o', type: 'R', a: B.pin(0), b: B.pin(1), r: 1e9 }); return; }
      B.ref.main = B.ref.src = B.add({ id: 'e', type: 'V', a: B.pin(0), b: B.pin(1), v: 0, rs: P.p.rs, wave: { kind: 'sin', amp: P.p.vrms * Math.SQRT2, offset: 0, freq: P.p.f, phase: 0 }, acmag: 1 });
    },
    rate: () => ({ pmax: 3, rth: 8, label: 'transformador', iw: 'rs' }), fail: 'open', failDesc: 'El transformador se sobrecalentó y se abrió su fusible térmico'
  });

  /* ---------- Generador de funciones con interruptor de salida ---------- */
  def('FGB', {
    name: 'Generador de funciones', cat: 'Instrumentos', pins: [[3, -1], [3, 1]], pn: ['OUT', 'GND'], instrument: true, hidden: true,
    defaults: Object.assign({}, CAT.FG.defaults, { on: true }),
    props: [], build(P, B) {
      if (!P.p.on) { B.ref.main = B.add({ id: 'o', type: 'R', a: B.pin(0), b: B.pin(1), r: 1e9 }); return; }
      CAT.FG.build(P, B);
    },
    rate: () => ({ imax: 0.5, rth: 1, label: 'generador' }), fail: 'open', failDesc: 'La salida del generador se dañó por exceso de corriente'
  });

  /* ---------- Multímetro: la punta roja va a una de tres tomas (VΩ, mA, 10 A) ---------- */
  def('DMMB', {
    name: 'Multímetro digital', cat: 'Instrumentos', pins: [[-1, 4], [1, 4]], pn: ['VΩ/mA/A', 'COM'], instrument: true, hidden: true,
    defaults: { mode: 'V=', jack: 'v', blown: { ma: false, a10: false } },
    props: [], build(P, B) {
      const j = P.p.jack, bl = P.p.blown || {};
      if ((j === 'ma' && bl.ma) || (j === 'a10' && bl.a10)) { B.add({ id: 'o', type: 'R', a: B.pin(0), b: B.pin(1), r: 1e12 }); return; }
      if (j === 'ma') B.ref.main = B.add({ id: 'r', type: 'R', a: B.pin(0), b: B.pin(1), r: 1.0 });
      else if (j === 'a10') B.ref.main = B.add({ id: 'r', type: 'R', a: B.pin(0), b: B.pin(1), r: 0.04 });
      else if (/^V/.test(P.p.mode)) B.ref.main = B.add({ id: 'r', type: 'R', a: B.pin(0), b: B.pin(1), r: 10e6 });
      else B.ref.main = B.add({ id: 'r', type: 'R', a: B.pin(0), b: B.pin(1), r: 1e12 }); /* Ω, diodo y continuidad se miden aparte */
    }
    /* sin «rate»: los fusibles los gestiona el banco */
  });

  /* ---------- Osciloscopio: dos canales, punta con selector ×1 / ×10 ---------- */
  def('SCOPEB', {
    name: 'Osciloscopio', cat: 'Instrumentos', pins: [[-3, 5], [0, 5], [3, 5]], pn: ['CH1', 'CH2', 'GND'], instrument: true, hidden: true,
    defaults: { sw1: 10, sw2: 10 },
    props: [], build(P, B) {
      [P.p.sw1, P.p.sw2].forEach((sw, k) => {
        const x10 = +sw === 10, r = x10 ? 10e6 : 1e6, c = x10 ? 14e-12 : 110e-12;
        B.add({ id: 'r' + k, type: 'R', a: B.pin(k), b: B.pin(2), r });
        if (B.cfg.par !== false) B.add({ id: 'c' + k, type: 'C', a: B.pin(k), b: B.pin(2), c, vprev: 0, iprev: 0 });
      });
      B.add({ id: 'gref', type: 'R', a: B.pin(2), b: '0', r: 1e-3 });
    }
  });


  /* Capacitancia entre espiras de la bobina del relé: acota la patada inductiva y evita saltos numéricos infinitos */
  { const rb = CAT.RELAY.build; CAT.RELAY.build = function (P, B) { rb.call(this, P, B); B.add({ id: 'cw', type: 'C', a: B.pin(0), b: B.pin(1), c: 2e-9, vprev: 0, iprev: 0 }); }; }

  { const mb = CAT.MOT.build; CAT.MOT.build = function (P, B) { mb.call(this, P, B); B.add({ id: 'cw', type: 'C', a: B.pin(0), b: B.pin(1), c: 1e-9, vprev: 0, iprev: 0 }); }; }

  /* ---------- Pulsador de 4 patas: las patas de un mismo lado están unidas por dentro ---------- */
  def('BTN4', {
    name: 'Pulsador (4 patas)', cat: 'Pasivos', pins: [[-2, -1], [2, -1], [-2, 1], [2, 1]], pn: ['A1', 'A2', 'B1', 'B2'], defaults: { on: false, imax: 0.05 },
    props: [],
    build(P, B) {
      B.add({ id: 'ja', type: 'R', a: B.pin(0), b: B.pin(1), r: 0.01 });
      B.add({ id: 'jb', type: 'R', a: B.pin(2), b: B.pin(3), r: 0.01 });
      B.ref.main = B.add({ id: 'sw', type: 'SW', a: B.pin(0), b: B.pin(2), closed: !!P.p.on, ron: 0.06, roff: 1e12 });
    },
    rate: (P) => ({ imax: P.p.imax, label: 'contacto' }), fail: 'open', failDesc: 'Los contactos del pulsador se quemaron'
  });

  /* ---------- LM358 y LM393: dos amplificadores / comparadores por encapsulado ---------- */
  const pn8 = ['OUT1', 'IN1−', 'IN1+', 'V−', 'IN2+', 'IN2−', 'OUT2', 'V+'];
  const dual = (m, comp) => (P, B) => {
    const chs = [{ o: 0, n: 1, p: 2 }, { o: 6, n: 5, p: 4 }];
    chs.forEach((c, k) => {
      const e = {
        id: 'u' + k, type: 'OA', a: B.pin(c.o), b: B.pin(c.p), c: B.pin(c.n), d: B.pin(7), e: B.pin(3), A0: m.A0, rout: m.rout, rin: m.rin, dropH: comp ? 0 : m.dropH, dropL: m.dropL,
        sr: comp ? 0 : m.sr, vos: 0, iq: m.iq / 2, oc: !!m.oc, tau: !comp && m.gbw > 0 ? m.A0 / (2 * Math.PI * m.gbw) : 0, y: 0
      };
      const el = B.add(e);
      if (k === 0) B.ref.main = el;
    });
  };
  def('LM358', {
    name: 'LM358 (doble A.O.)', cat: 'Circuitos integrados', pins: pn8.map(() => [0, 0]), pn: pn8, defaults: {}, props: [], sup: [7, 3],
    build: dual(MOD.OA.LM358, false),
    rate: () => ({ imax: 0.06, vmax: 32 * 1.3, vrev: 0.7, pmax: 0.8, rth: 150, label: 'LM358' }), fail: 'open', failDesc: 'El circuito integrado se dañó'
  });
  def('LM393', {
    name: 'LM393 (doble comparador)', cat: 'Circuitos integrados', pins: pn8.map(() => [0, 0]), pn: pn8, defaults: {}, props: [], sup: [7, 3],
    build: dual(MOD.OA.LM393, true),
    rate: () => ({ imax: 0.05, vmax: 36 * 1.3, vrev: 0.7, pmax: 0.8, rth: 150, label: 'LM393' }), fail: 'open', failDesc: 'El comparador se dañó'
  });
  /* alimentación de los demás CI (para el daño por polaridad invertida) */
  CAT.OA.sup = [3, 4]; CAT.CMP.sup = [3, 4]; CAT.T555.sup = [6, 7];
  for (const t of ['OA', 'CMP', 'T555']) { const r = CAT[t].rate; CAT[t].rate = (P) => Object.assign(r(P), { vrev: 0.7 }); }
  CAT.OA.rate = ((r) => (P) => Object.assign(r(P), { vmax: (MOD.OA[P.p.model] || MOD.OA.LM741).vmax * 1.3 }))(CAT.OA.rate);
  CAT.T555.rate = () => ({ vmax: 18 * 1.3, imax: 0.3, pmax: 0.6, rth: 150, vrev: 0.7, label: '555' });

  /* ---------- Baterías y pilas con clip ---------- */
  def('BATP', {
    name: 'Batería / pilas con clip', cat: 'Fuentes', pins: [[0, -2], [0, 2]], pn: ['+', '−'], defaults: { kind: 'alk9', v: 9, rs: 1.7 },
    props: [{ k: 'kind', label: 'Tipo', kind: 'sel', opts: [['aa2', '2 pilas AA en serie (3 V)'], ['aa4', '4 pilas AA en serie (6 V)'], ['alk9', 'Batería alcalina de 9 V'], ['li', 'Li-ion 18650 (3,7 V)'], ['usb', 'Cargador USB de celular (5 V · 1 A)']] }],
    apply(P) { const t = { aa2: [3, 0.3], aa4: [6, 0.6], alk9: [9, 1.7], li: [3.7, 0.08], usb: [5.1, 0.25] }[P.p.kind] || [9, 1.7]; P.p.v = t[0]; P.p.rs = t[1]; },
    build(P, B) { B.ref.main = B.ref.src = B.add({ type: 'V', a: B.pin(0), b: B.pin(1), v: P.p.v, rs: P.p.rs, acmag: 0 }); },
    rate: (P) => ({ pmax: { aa2: 1.2, aa4: 2.4, alk9: 1.5, li: 6, usb: 12 }[P.p.kind] || 2, rth: 4, label: 'batería', iw: 'rs' }), fail: 'open',
    failDesc: 'La batería se sobrecalentó y se abrió (en la realidad podría hincharse o incendiarse)'
  });

  /* ---------- Zumbador activo de 5 V (lleva oscilador interno) ---------- */
  def('BUZA', {
    name: 'Zumbador activo 5 V', cat: 'Pasivos', pins: two, pn: ['+', '−'], defaults: { f: 2700 },
    props: [],
    build(P, B) {
      const n1 = B.node('b');
      B.add({ id: 'd', type: 'D', a: B.pin(0), b: n1, Is: 1e-12, n: 1.1 });
      B.ref.main = B.add({ id: 'r', type: 'R', a: n1, b: B.pin(1), r: 130 });
    },
    rate: () => ({ vmax: 12, vrev: 6, pmax: 0.3, rth: 100, label: 'zumbador' }), fail: 'open', failDesc: 'El zumbador se quemó'
  });

  /* ---------- Display de 7 segmentos de cátodo común (10 patas: 8 LED + 2 cátodos) ---------- */
  const segN = ['e', 'd', 'K', 'c', 'DP', 'b', 'a', 'K2', 'f', 'g'];
  def('SEG7', {
    name: 'Display de 7 segmentos (cátodo común)', cat: 'Diodos', pins: segN.map(() => [0, 0]), pn: segN, defaults: { color: 'rojo' },
    props: [{ k: 'color', label: 'Color', kind: 'sel', opts: [['rojo', 'Rojo'], ['verde', 'Verde'], ['amarillo', 'Amarillo']] }],
    build(P, B) {
      const m = MOD.LED[P.p.color] || MOD.LED.rojo;
      const k = B.node('k');
      B.add({ id: 'k1', type: 'R', a: B.pin(2), b: k, r: 0.01 });
      B.add({ id: 'k2', type: 'R', a: B.pin(7), b: k, r: 0.01 });
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'DP'].forEach((nm, i) => {
        const el = B.add({ id: 's' + nm, type: 'D', a: B.pin(segN.indexOf(nm)), b: k, Is: m.Is, n: m.n });
        if (i === 0) B.ref.main = el;
      });
    },
    rate: () => ({ imax: 0.03 * 3, vrev: 5, pmax: 0.4, rth: 120, label: 'display' }), fail: 'open', failDesc: 'Un segmento del display se quemó'
  });

  PT.PREFIX.PSUC = 'PS'; PT.PREFIX.ACT = 'TR'; PT.PREFIX.FGB = 'FG'; PT.PREFIX.DMMB = 'DMM'; PT.PREFIX.SCOPEB = 'OSC'; PT.PREFIX.BTN4 = 'SW'; PT.PREFIX.LM358 = 'U'; PT.PREFIX.LM393 = 'U';
  PT.PREFIX.BATP = 'B'; PT.PREFIX.BUZA = 'BZ'; PT.PREFIX.SEG7 = 'DS';
  /* Capacidad térmica aproximada (J/K) de cada pieza: la temperatura sube a un ritmo realista (≈ P / C al principio) */
  const small = (P) => 0.08, to220 = (P) => 1.5 + 0;
  const CTH = {
    R: (P) => Math.max(0.05, P.p.watt || 0.25), POT: () => 0.3, C: (P) => ((P.p.kind === 'elec' || P.p.kind === 'tant') ? 0.5 : 0.08), L: () => 0.5,
    LED: () => 0.15, D: (P) => ((MOD.D[P.p.model] || {}).imax >= 3 ? 1 : 0.3), ZD: () => 0.25, NPN: (P) => ((MOD.BJT[P.p.model] || {}).rth < 100 ? 1.5 : 0.08), PNP: (P) => ((MOD.BJT[P.p.model] || {}).rth < 100 ? 1.5 : 0.08),
    NMOS: (P) => ((MOD.MOS[P.p.model] || {}).rth < 100 ? 1.5 : 0.08), PMOS: () => 1.5, DARL: () => 1.5, REG: () => 1.5, OA: () => 0.3, CMP: () => 0.3, T555: () => 0.3, LM358: () => 0.3, LM393: () => 0.3,
    SPK: () => 0.5, MOT: () => 5, BATP: () => 3, NTC: () => 0.06, LDR: () => 0.1, SCR: () => 0.2, TRIAC: () => 1.5, OPTO: () => 0.2, BUZA: () => 0.3, SEG7: () => 0.3, PD: () => 0.1, JFN: () => 0.08, RELAY: () => 2, ACT: () => 60, PSUC: () => 40
  };
  for (const [t, f] of Object.entries(CTH)) {
    const c = CAT[t]; if (!c || !c.rate) continue;
    const r = c.rate;
    c.rate = (P) => { const o = r(P); if (o) o.cth = f(P); return o; };
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
