/* ===================================================================
   32-models.js — Biblioteca de modelos de dispositivos reales (EM.spice.MOD)
   Parámetros ajustados a las hojas de datos típicas (a 25 °C). Sin DOM.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = root.EM, S = EM.spice;
  const MOD = (S.MOD = {});

  /* ---------- Diodos de señal y rectificadores ----------
     Is, n: Shockley · rs: resistencia en serie · cj: capacitancia de unión (F) · vr: tensión inversa máxima
     if: corriente directa media máxima · pmax: potencia máxima */
  MOD.D = {
    '1N4148': { name: '1N4148', desc: 'señal, silicio, 100 V · 0,2 A', Is: 2.52e-9, n: 1.752, rs: 0.568, cj: 4e-12, vr: 100, imax: 0.2, pmax: 0.5, tt: 4e-9 },
    '1N4007': { name: '1N4007', desc: 'rectificador, 1000 V · 1 A', Is: 2.55e-9, n: 1.75, rs: 0.04, cj: 15e-12, vr: 1000, imax: 1, pmax: 3, tt: 3e-6 },
    '1N4001': { name: '1N4001', desc: 'rectificador, 50 V · 1 A', Is: 2.55e-9, n: 1.75, rs: 0.04, cj: 15e-12, vr: 50, imax: 1, pmax: 3, tt: 3e-6 },
    '1N5408': { name: '1N5408', desc: 'rectificador, 1000 V · 3 A', Is: 4e-9, n: 1.9, rs: 0.02, cj: 40e-12, vr: 1000, imax: 3, pmax: 8, tt: 3e-6 },
    '1N5819': { name: '1N5819', desc: 'Schottky, 40 V · 1 A', Is: 3e-7, n: 1.05, rs: 0.04, cj: 110e-12, vr: 40, imax: 1, pmax: 2, tt: 0 },
    'OA91': { name: 'OA91 (Ge)', desc: 'germanio, 90 V · 50 mA', Is: 5e-7, n: 1.3, rs: 4, cj: 1e-12, vr: 90, imax: 0.05, pmax: 0.2, tt: 0 }
  };
  /* LED 5 mm: color, Vf a 20 mA, factor n, longitud de onda */
  MOD.LED = {
    rojo: { vf: 1.95, n: 1.8, rs: 6, imax: 0.03, nm: 630, hex: '#ff2a1a', vr: 5 },
    amarillo: { vf: 2.05, n: 1.85, rs: 6, imax: 0.03, nm: 590, hex: '#ffc61a', vr: 5 },
    verde: { vf: 2.1, n: 1.9, rs: 6, imax: 0.03, nm: 565, hex: '#2bdc4a', vr: 5 },
    azul: { vf: 3.0, n: 2.4, rs: 8, imax: 0.03, nm: 465, hex: '#2a6bff', vr: 5 },
    blanco: { vf: 3.1, n: 2.5, rs: 8, imax: 0.03, nm: 0, hex: '#f4f6ff', vr: 5 },
    naranja: { vf: 2.0, n: 1.85, rs: 6, imax: 0.03, nm: 605, hex: '#ff8a1a', vr: 5 },
    IR: { vf: 1.3, n: 1.6, rs: 4, imax: 0.1, nm: 940, hex: '#b04a4a', vr: 5 }
  };
  for (const k in MOD.LED) { const d = MOD.LED[k]; d.Is = S.isFor(d.vf, 0.02, d.n); d.cj = 40e-12; }
  /* Zener: tensión nominal a 5 mA; la resistencia dinámica crece con Vz */
  MOD.ZENER = {};
  for (const vz of [2.7, 3.3, 3.9, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1, 10, 12, 15, 18, 24, 33, 47]) {
    MOD.ZENER[vz] = { name: 'Zener ' + vz + ' V', vz, ibv: 5e-3, nz: 2 + vz / 6, Is: 1e-14, n: 1, rs: 0.5, cj: 60e-12 * 5 / Math.max(vz, 3), pmax: 0.5, imax: 0.5 / vz };
  }
  /* Fotodiodo y celda solar */
  MOD.PD = { BPW34: { name: 'BPW34', desc: 'fotodiodo de silicio', Is: 1e-10, n: 1.1, sens: 0.6e-6 /* A por lux·cm² ~ A/(W/m²) */, area: 7.5e-6, cj: 70e-12, rsh: 1e9 } };
  MOD.SOLAR = {
    cel: { name: 'Celda de 0,5 V', Is: 1e-9, n: 1.3, isc1000: 0.12, rs: 0.04, rsh: 50 },
    panel: { name: 'Panel de 6 V (12 celdas)', Is: 1e-9, n: 1.3 * 12, isc1000: 0.2, rs: 0.5, rsh: 600 }
  };
  /* Varicap tipo BB-hiperabrupto */
  MOD.VARICAP = { BB910: { name: 'Varicap BB910', Is: 1e-13, n: 1, c0: 40e-12, vj: 0.7, m: 0.5 } };
  /* TVS / supresor unidireccional 5,1 V -> uso: Zener de potencia grande */
  MOD.TVS = { 'SMBJ5.0A': { name: 'TVS 5 V (600 W)', vz: 6.4, ibv: 1e-3, nz: 1.2, Is: 1e-14, n: 1, rs: 0.1, cj: 700e-12, pmax: 600, imax: 60 } };

  /* ---------- Transistores bipolares ----------
     bf, br: ganancias directa e inversa · vaf: tensión de Early · cbe, cbc: capacitancias · ic: corriente de colector máx. */
  MOD.BJT = {
    BC547: { name: 'BC547', pol: 1, Is: 7e-15, bf: 300, br: 4, vaf: 80, cbe: 22e-12, cbc: 4.5e-12, ic: 0.1, vceo: 45, pmax: 0.5, hfe: '110–800', pkg: 'TO-92', rth: 200 },
    '2N3904': { name: '2N3904', pol: 1, Is: 6.7e-15, bf: 416, br: 4, vaf: 74, cbe: 8e-12, cbc: 3.5e-12, ic: 0.2, vceo: 40, pmax: 0.625, hfe: '100–300', pkg: 'TO-92', rth: 200 },
    '2N2222': { name: '2N2222A', pol: 1, Is: 1.4e-14, bf: 200, br: 3, vaf: 100, cbe: 25e-12, cbc: 8e-12, ic: 0.8, vceo: 40, pmax: 0.5, hfe: '100–300', pkg: 'TO-18', rth: 250 },
    BC557: { name: 'BC557', pol: -1, Is: 3e-14, bf: 250, br: 4, vaf: 52, cbe: 22e-12, cbc: 6e-12, ic: 0.1, vceo: 45, pmax: 0.5, hfe: '125–800', pkg: 'TO-92', rth: 200 },
    '2N3906': { name: '2N3906', pol: -1, Is: 1.1e-14, bf: 180, br: 4, vaf: 18, cbe: 10e-12, cbc: 4.5e-12, ic: 0.2, vceo: 40, pmax: 0.625, hfe: '100–300', pkg: 'TO-92', rth: 200 },
    TIP31: { name: 'TIP31C', pol: 1, Is: 1e-12, bf: 70, br: 6, vaf: 100, cbe: 300e-12, cbc: 60e-12, ic: 3, vceo: 100, pmax: 40, hfe: '25–50 @ 1 A', pkg: 'TO-220', rth: 62 },
    TIP32: { name: 'TIP32C', pol: -1, Is: 1.6e-12, bf: 60, br: 6, vaf: 100, cbe: 300e-12, cbc: 80e-12, ic: 3, vceo: 100, pmax: 40, hfe: '25–50 @ 1 A', pkg: 'TO-220', rth: 62 },
    '2N3055': { name: '2N3055', pol: 1, Is: 1e-12, bf: 60, br: 5, vaf: 80, cbe: 600e-12, cbc: 150e-12, ic: 15, vceo: 60, pmax: 115, hfe: '20–70 @ 4 A', pkg: 'TO-3', rth: 1.5 }
  };
  /* Darlington TIP120 = dos BJT + dos resistencias (como en el chip) */
  MOD.DARL = { TIP120: { name: 'TIP120 (Darlington)', ic: 5, vceo: 60, pmax: 65, hfe: '1000 @ 3 A', pkg: 'TO-220', q1: 'BC547', q2: 'TIP31', r1: 8000, r2: 120, rth: 62 } };

  /* ---------- MOSFET (canal N/P) y JFET ----------
     vth: umbral (en el marco del canal «N» equivalente; positivo = enriquecimiento) · k: parámetro de transconductancia (A/V²)
     id = k/2·(vgs − vth)² en saturación · lam: modulación de longitud de canal */
  MOD.MOS = {
    '2N7000': { name: '2N7000', pol: 1, vth: 2.1, k: 0.07, lam: 0.02, cgs: 40e-12, cgd: 5e-12, cds: 10e-12, id: 0.2, vds: 60, pmax: 0.4, vgsmax: 20, rds: '1,8 Ω @ 10 V', body: false, rth: 312 },
    IRLZ44N: { name: 'IRLZ44N', pol: 1, vth: 1.7, k: 13.8, lam: 0.01, cgs: 1.5e-9, cgd: 250e-12, cds: 400e-12, id: 47, vds: 55, pmax: 110, vgsmax: 16, rds: '22 mΩ @ 5 V', body: true, rth: 1.4 },
    IRF540N: { name: 'IRF540N', pol: 1, vth: 3.5, k: 12, lam: 0.01, cgs: 1.2e-9, cgd: 200e-12, cds: 300e-12, id: 33, vds: 100, pmax: 130, vgsmax: 20, rds: '44 mΩ @ 10 V', body: true, rth: 1.15 },
    IRF9540: { name: 'IRF9540', pol: -1, vth: 3.5, k: 1.22, lam: 0.02, cgs: 1.1e-9, cgd: 200e-12, cds: 400e-12, id: 19, vds: 100, pmax: 150, vgsmax: 20, rds: '117 mΩ @ −10 V', body: true, rth: 1 },
    BS250: { name: 'BS250', pol: -1, vth: 2.0, k: 0.009, lam: 0.02, cgs: 60e-12, cgd: 10e-12, cds: 20e-12, id: 0.18, vds: 45, pmax: 0.7, vgsmax: 20, rds: '14 Ω @ −10 V', body: false, rth: 180 },
    EDU_N: { name: 'MOSFET didáctico N', pol: 1, vth: 2, k: 2e-3, lam: 0.02, cgs: 5e-12, cgd: 1e-12, cds: 1e-12, id: 0.2, vds: 40, pmax: 1, vgsmax: 20, rds: '', body: false, rth: 100, edu: true },
    EDU_P: { name: 'MOSFET didáctico P', pol: -1, vth: 2, k: 1e-3, lam: 0.02, cgs: 5e-12, cgd: 1e-12, cds: 1e-12, id: 0.2, vds: 40, pmax: 1, vgsmax: 20, rds: '', body: false, rth: 100, edu: true }
  };
  /* JFET: vth = Vp (en el marco N: negativo), k = 2·Idss/Vp² */
  const jf = (name, pol, idss, vp, extra) => Object.assign({ name, pol, vth: pol > 0 ? -Math.abs(vp) : -Math.abs(vp), k: (2 * idss) / (vp * vp), lam: 0.01, idss, vp: Math.abs(vp), cgs: 4e-12, cgd: 2e-12, cds: 1e-12, id: 0.01, vds: 25, pmax: 0.35, vgsmax: 25, rth: 300 }, extra);
  MOD.JFET = {
    '2N5457': jf('2N5457', 1, 5e-3, 2.5),
    J201: jf('J201', 1, 1e-3, 0.8),
    BF245A: jf('BF245A', 1, 4e-3, 2.0),
    '2N5460': jf('2N5460', -1, 3e-3, 3.0)
  };

  /* ---------- Amplificadores operacionales ----------
     A0: ganancia en lazo abierto · gbw: producto ganancia–ancho de banda · sr: slew rate (V/s) · rout, rin
     drop: caída a los rieles (alto/bajo) · iq: corriente de reposo · vos: desplazamiento · vmax: alimentación máxima · iomax */
  MOD.OA = {
    ideal: { name: 'A.O. ideal', A0: 1e6, gbw: 1e9, sr: 0, rin: 1e12, rout: 1, dropH: 0, dropL: 0, iq: 0, vos: 0, vmax: 100, iomax: 1, rails: [15, -15] },
    LM741: { name: 'LM741', A0: 2e5, gbw: 1e6, sr: 0.5e6, rin: 2e6, rout: 75, dropH: 2, dropL: 2, iq: 1.7e-3, vos: 1e-3, vmax: 36, iomax: 0.025, rails: [15, -15] },
    TL081: { name: 'TL081', A0: 2e5, gbw: 3e6, sr: 13e6, rin: 1e12, rout: 100, dropH: 1.5, dropL: 1.5, iq: 1.4e-3, vos: 3e-3, vmax: 36, iomax: 0.02, rails: [15, -15] },
    LM358: { name: 'LM358', A0: 1e5, gbw: 1e6, sr: 0.3e6, rin: 1e6, rout: 100, dropH: 1.5, dropL: 0.05, iq: 0.7e-3, vos: 2e-3, vmax: 32, iomax: 0.02, rails: [5, 0] },
    LM393: { name: 'LM393 (comparador)', A0: 1e5, gbw: 0, sr: 0, rin: 1e6, rout: 50, dropH: 0, dropL: 0.1, iq: 0.4e-3, vos: 2e-3, vmax: 36, iomax: 0.016, rails: [5, 0], oc: true },
    OP07: { name: 'OP-07 (precisión)', A0: 4e8, gbw: 0.6e6, sr: 0.17e6, rin: 33e6, rout: 60, dropH: 2, dropL: 2, iq: 2.5e-3, vos: 30e-6, vmax: 36, iomax: 0.02, rails: [15, -15] }
  };

  /* ---------- Reguladores lineales ---------- */
  MOD.REG = {
    '7805': { name: '7805', vref: 5, vdo: 2, ilim: 1.5, iq: 5e-3, rout: 0.05, pol: 1, vmax: 35, pmax: 15, rth: 5, rja: 65 },
    '7809': { name: '7809', vref: 9, vdo: 2, ilim: 1.5, iq: 5e-3, rout: 0.06, pol: 1, vmax: 35, pmax: 15, rth: 5, rja: 65 },
    '7812': { name: '7812', vref: 12, vdo: 2, ilim: 1.5, iq: 5.5e-3, rout: 0.08, pol: 1, vmax: 35, pmax: 15, rth: 5, rja: 65 },
    '7905': { name: '7905', vref: 5, vdo: 2, ilim: 1.5, iq: 3e-3, rout: 0.05, pol: -1, vmax: 35, pmax: 15, rth: 5, rja: 65 },
    '78L05': { name: '78L05', vref: 5, vdo: 2, ilim: 0.15, iq: 3e-3, rout: 0.2, pol: 1, vmax: 30, pmax: 0.7, rth: 160 },
    LM317: { name: 'LM317 (ajustable)', vref: 1.25, vdo: 2.5, ilim: 1.5, iq: 50e-6, rout: 0.03, pol: 1, vmax: 40, pmax: 20, rth: 5, rja: 65, adj: true },
    AMS1117: { name: 'AMS1117-3,3 (LDO)', vref: 3.3, vdo: 1.1, ilim: 0.8, iq: 5e-3, rout: 0.08, pol: 1, vmax: 15, pmax: 3, rth: 50 }
  };

  /* ---------- Resistores y reactivos reales ---------- */
  MOD.RES = {
    carbon: { name: 'carbón 5 %', tol: 5, tc: 500e-6, lead: 10e-9, cp: 0.3e-12 },
    metal: { name: 'película metálica 1 %', tol: 1, tc: 50e-6, lead: 5e-9, cp: 0.2e-12 },
    precision: { name: 'precisión 0,1 %', tol: 0.1, tc: 15e-6, lead: 5e-9, cp: 0.2e-12 },
    wirewound: { name: 'bobinado (potencia)', tol: 5, tc: 100e-6, lead: 2e-6, cp: 2e-12 }
  };
  /* Condensadores: ESR(C) y ESL; leak = resistencia de fuga por µF (MΩ·µF) */
  MOD.CAP = {
    ceramic: { name: 'cerámico X7R', esr: (c) => 0.03, esl: 1.5e-9, leak: 1e4, polar: false, vmaxDef: 50, tc: 0, label: 'X7R' },
    c0g: { name: 'cerámico C0G', esr: (c) => 0.02, esl: 1.2e-9, leak: 1e5, polar: false, vmaxDef: 50, tc: 0, label: 'C0G' },
    film: { name: 'película (poliéster)', esr: (c) => 0.05, esl: 8e-9, leak: 1e5, polar: false, vmaxDef: 100, tc: 0, label: 'MKT' },
    elec: { name: 'electrolítico (Al)', esr: (c) => Math.max(0.03, 0.35 / Math.sqrt(c * 1e6)), esl: 12e-9, leak: 100, polar: true, vmaxDef: 25, tc: 0, label: 'Al' },
    tant: { name: 'tántalo', esr: (c) => Math.max(0.3, 2.2 / Math.sqrt(c * 1e6)), esl: 3e-9, leak: 500, polar: true, vmaxDef: 16, tc: 0, label: 'Ta' },
    super: { name: 'supercondensador', esr: (c) => 0.05, esl: 50e-9, leak: 5, polar: true, vmaxDef: 2.7, tc: 0, label: 'SC' }
  };
  /* Inductores: Rdc (Ω por mH, aprox.), Isat, SRF */
  MOD.IND = {
    air: { name: 'núcleo de aire', rdc: (l) => 0.05 + 0.8 * Math.sqrt(l * 1e3) * 0.1, isat: 0, cp: 1.5e-12 },
    ferrite: { name: 'núcleo de ferrita', rdc: (l) => 0.1 + 0.9 * Math.sqrt(l * 1e3) * 0.4, isat: 1.2, cp: 5e-12 },
    power: { name: 'inductor de potencia', rdc: (l) => 0.02 + 0.1 * Math.sqrt(l * 1e3), isat: 3, cp: 8e-12 }
  };

  /* Sensores resistivos */
  MOD.NTC = { r25: 10000, beta: 3950, name: 'NTC 10 kΩ (B=3950)' };
  MOD.LDR = { r10: 20000, gamma: 0.7, name: 'LDR GL5528' };
  MOD.LAMP = { '6V': { v: 6, p: 3, name: 'lámpara 6 V · 3 W' }, '12V': { v: 12, p: 5, name: 'lámpara 12 V · 5 W' }, '120V': { v: 120, p: 40, name: 'bombilla 120 V · 40 W' }, '230V': { v: 230, p: 40, name: 'bombilla 230 V · 40 W' } };

  /* Temperatura ambiente por defecto */
  MOD.Ta = 25;
})(typeof globalThis !== 'undefined' ? globalThis : window);
