/* Validación del núcleo de «Dispositivos activos y pasivos» (src/core, sin DOM).
   1) contra referencias independientes: NumPy, SciPy y SymPy (python tests/referencias.py → referencias.json)
   2) contra resultados analíticos exactos y datos de las hojas de datos (esta archivo)
   3) cifras de problemas resueltos de los capítulos
   Ejecutar: python tests/referencias.py ; node tests/validar.js */
global.window = global;
global.document = { createElement: () => ({ style: {}, classList: { add() {}, toggle() {} }, append() {}, addEventListener() {}, setAttribute() {} }), documentElement: {}, addEventListener() {}, hidden: false };
global.EM = { si: String, fix: (x, n = 2) => (+x).toFixed(n), sci: String, sims: {}, defineSim() {}, el: () => ({}), col: () => '#000', onTheme: [], isDark: () => false, supHTML: (x) => x };
const path = require('path'), fs = require('fs');
const core = path.join(__dirname, '../src/core');
for (const f of ['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net', '38-cx']) require(path.join(core, f + '.js'));
const REF = JSON.parse(fs.readFileSync(path.join(__dirname, 'referencias.json'), 'utf8'));
const S = EM.spice, MOD = S.MOD;
let ok = 0, bad = 0;
const rows = [];
function chk(group, name, got, exp, tol, rel = true) {
  const err = rel ? Math.abs(got - exp) / Math.max(1e-300, Math.abs(exp)) : Math.abs(got - exp);
  const pass = isFinite(got) && err <= tol;
  pass ? ok++ : bad++;
  rows.push({ group, name, got, exp, tol: (rel ? 'rel ' : 'abs ') + tol, pass });
  if (!pass) console.log('FALLA', group, '·', name, 'obtenido', got, 'esperado', exp, 'err', err);
}
const G1 = 'SciPy y NumPy', G2 = 'SymPy', G3 = 'Literatura', G4 = 'Problemas';

/* ---------- utilidades ---------- */
const mk = (spec, sets = [], cfg = {}) => { const n = new EM.Net(Object.assign({ damage: false }, cfg)); n.load(EM.Net.fromSpec(spec)); for (const [id, k, v] of sets) n.part(id).p[k] = v; n.rebuild(); n.cir.solveDC(); return n; };
const Vn = (n, lab) => n.v(n.netInfo.labelNet[lab]);
const acAt = (n, f, lab) => { const r = n.cir.ac(f); const z = r.at(n.netInfo.labelNet[lab]); return z; };
const mag = (z) => Math.hypot(z[0], z[1]);
const db = (x) => 20 * Math.log10(x);
const zeroState = (n) => { for (const e of n.cir.els) if (e.type === 'C' || e.type === 'L') { e.vprev = 0; e.iprev = 0; } n.cir.x.fill(0); n.cir.restart = true; };
const IDEAL = { model: 'ideal' };

/* ===================== 1. SciPy y NumPy ===================== */
{ /* puente de Wheatstone desequilibrado */
  const n = mk({ parts: [['V1', 'VDC', 2, 12, 0, { v: 9 }], ['R1', 'R', 10, 6, 1, { r: 1e3 }], ['R2', 'R', 10, 16, 1, { r: 2e3 }], ['R3', 'R', 20, 6, 1, { r: 1.5e3 }], ['R4', 'R', 20, 16, 1, { r: 3.3e3 }], ['Rp', 'R', 15, 11, 0, { r: 4.7e3 }]],
    wires: [['V1.0', '@vs:u'], ['V1.1', 'gnd'], ['R1.0', '@vs:u'], ['R3.0', '@vs:u'], ['R1.1', '@A:r'], ['R2.0', '@A:r'], ['R2.1', 'gnd'], ['R3.1', '@B:r'], ['R4.0', '@B:r'], ['R4.1', 'gnd'], ['Rp.0', '@A:l'], ['Rp.1', '@B:r']] });
  chk(G1, 'Puente de Wheatstone desequilibrado: tensión del nodo A frente a numpy.linalg.solve', Vn(n, 'A'), REF.puente[0], 2e-6);
  chk(G1, 'Puente de Wheatstone desequilibrado: tensión del nodo B frente a numpy.linalg.solve', Vn(n, 'B'), REF.puente[1], 2e-6);
}
{ /* escalón en un RC frente a scipy.integrate.solve_ivp */
  const n = mk({ parts: [['V1', 'VDC', 2, 12, 0, { v: 5 }], ['R1', 'R', 10, 8, 0, { r: 1e3 }], ['C1', 'C', 20, 12, 1, { c: 1e-6, kind: 'c0g' }]], wires: [['V1.0', 'R1.0'], ['R1.1', '@c:r'], ['C1.0', '@c:u'], ['C1.1', 'gnd'], ['V1.1', 'gnd']] });
  zeroState(n);
  const dt = 2e-6; let t = 0, k = 0; const T = REF.rc_escalon.t;
  for (let i = 1; i <= 2500; i++) { n.step(dt); t = i * dt; for (let j = 0; j < T.length; j++) if (Math.abs(t - T[j]) < dt / 2) chk(G1, `Carga de un RC (1 kΩ, 1 µF) a ${(T[j] * 1e3).toFixed(1)} ms frente a solve_ivp`, Vn(n, 'c'), REF.rc_escalon.v[j], 1e-3); }
}
{ /* Sallen–Key frente a scipy.signal.freqs */
  const Rr = 10e3, Cc = 16e-9, Kk = 1.586;
  const spec = { parts: [['FG1', 'FG', -4, 12, 0, { wave: 'sin', amp: 1, f: 1000, rs: 1e-4 }], ['Z1', 'R', 5, 11, 0, { r: Rr }], ['Z2', 'R', 11, 11, 0, { r: Rr }], ['Z3', 'C', 15, 14, 1, { c: Cc, kind: 'c0g' }], ['Z4', 'C', 13, 6, 0, { c: Cc, kind: 'c0g' }], ['U1', 'OA', 22, 12, 0, IDEAL], ['Ra', 'R', 17, 17, 1, { r: 10000 }], ['Rb', 'R', 23, 18, 0, { r: (Kk - 1) * 10000 }]],
    wires: [['FG1.OUT', 'Z1.0'], [[-1, 13], [-1, 14]], ['gndat', -1, 14], ['Z1.1', 'Z2.0'], ['Z2.1', 'U1.0'], [[15, 11], [15, 12]], ['Z3.1', [15, 17]], ['gndat', 15, 17], [[8, 11], [8, 6], 'Z4.0'], ['Z4.1', [28, 6], [28, 12]], ['U1.2', [28, 12]], [[28, 12], [30, 12]], [[19, 13], [19, 18], 'Rb.0'], ['Rb.1', [27, 18], [27, 12]], [[19, 15], 'Ra.0'], ['Ra.1', [17, 20]], ['gndat', 17, 20], ['U1.2', '@out:r']] };
  const n = mk(spec);
  REF.sallen.f.forEach((f, i) => { const z = acAt(n, f, 'out'); chk(G1, `Filtro Sallen–Key pasabajos (f₀ = 995 Hz, Q = 0.707) a ${f} Hz: módulo (dB) frente a scipy.signal.freqs`, db(mag(z)), REF.sallen.mag_db[i], 0.02, false); });
  REF.sallen.f.slice(0, 4).forEach((f, i) => { const z = acAt(n, f, 'out'); chk(G1, `Filtro Sallen–Key a ${f} Hz: fase (°) frente a scipy.signal.freqs`, Math.atan2(z[1], z[0]) * 180 / Math.PI, REF.sallen.fase[i], 0.5, false); });
}
{ /* diodo 1N4148 en serie con 1 kΩ */
  const n = mk({ parts: [['V1', 'VDC', 2, 12, 0, { v: 5 }], ['R1', 'R', 10, 8, 0, { r: 1e3 }], ['D1', 'D', 20, 12, 1, { model: '1N4148' }]], wires: [['V1.0', 'R1.0'], ['R1.1', 'D1.0'], ['D1.1', 'gnd'], ['V1.1', 'gnd']] });
  chk(G1, 'Diodo 1N4148 con 5 V y 1 kΩ: corriente frente a scipy.optimize.brentq (Shockley con r_s)', Math.abs(n.iPart(n.part('D1'))), REF.diodo_i, 2e-3);
}
{ /* BJT con polarización por divisor */
  const n = mk({ parts: [['VCC', 'VDC', 2, 10, 0, { v: 12 }], ['R1', 'R', 12, 6, 1, { r: 33e3 }], ['R2', 'R', 12, 14, 1, { r: 10e3 }], ['RC', 'R', 22, 6, 1, { r: 3.3e3 }], ['RE', 'R', 22, 16, 1, { r: 1e3 }], ['Q1', 'NPN', 20, 11, 0, { model: '2N3904' }]],
    wires: [['VCC.0', '@vcc:u'], ['VCC.1', 'gnd'], ['R1.0', '@vcc:u'], ['RC.0', '@vcc:u'], ['R1.1', '@b:l'], ['R2.0', '@b:u'], ['R2.1', 'gnd'], ['Q1.1', '@b:r'], ['RC.1', '@c:r'], ['Q1.0', '@c:l'], ['Q1.2', '@e:r'], ['RE.0', '@e:u'], ['RE.1', 'gnd']] });
  chk(G1, 'BJT 2N3904 con divisor de tensión: V_B frente a scipy.optimize.fsolve (Ebers–Moll con efecto Early)', Vn(n, 'b'), REF.bjt.vb, 5e-3);
  chk(G1, 'BJT 2N3904 con divisor de tensión: V_E frente a fsolve', Vn(n, 'e'), REF.bjt.ve, 5e-3);
  chk(G1, 'BJT 2N3904 con divisor de tensión: V_C frente a fsolve', Vn(n, 'c'), REF.bjt.vc, 5e-3);
}
{ /* FFT */
  const X = S.fft(REF.fft.x);
  chk(G1, 'Transformada de Fourier: amplitud del armónico de orden 8 frente a numpy.fft.rfft', X[8], REF.fft.bin8, 1e-9);
  chk(G1, 'Transformada de Fourier: amplitud del armónico de orden 24 frente a numpy.fft.rfft', X[24], REF.fft.bin24, 1e-9);
}

/* ===================== 2. SymPy ===================== */
{ /* red de Wien: β = 1/3 a f₀ */
  const n = mk({ parts: [['FG1', 'FG', 0, 12, 0, { wave: 'sin', amp: 1, f: 1000, rs: 1e-4 }], ['Rs1', 'R', 8, 8, 0, { r: 16e3 }], ['Cs1', 'C', 16, 8, 0, { c: 10e-9, kind: 'c0g' }], ['Rp', 'R', 22, 14, 1, { r: 16e3 }], ['Cp', 'C', 28, 14, 1, { c: 10e-9, kind: 'c0g' }]],
    wires: [['FG1.OUT', '@a:r'], ['FG1.GND', 'gnd'], ['Rs1.0', '@a:l'], ['Rs1.1', 'Cs1.0'], ['Cs1.1', '@p:r'], ['Rp.0', '@p:u'], ['Rp.1', 'gnd'], ['Cp.0', '@p:u'], ['Cp.1', 'gnd']] });
  const f0 = REF.wien.f0; chk(G2, 'Red RC serie–paralelo de Wien: |β| a f₀ = 995.2 Hz frente a SymPy', mag(acAt(n, f0, 'p')), REF.wien.beta0, 1e-6);
  const z = acAt(n, f0, 'p'); chk(G2, 'Red RC de Wien: fase a f₀ frente a SymPy (0°)', Math.atan2(z[1], z[0]) * 180 / Math.PI, 0, 1e-4, false);
}

/* ===================== 3. Literatura y resultados exactos ===================== */
{ /* filtro RC en fc */
  const R = 1e3, C = 1 / (2 * Math.PI * R * 1000);
  const n = mk({ parts: [['V1', 'VAC', 2, 12, 0, { amp: 1, f: 1000, rs: 1e-4 }], ['R1', 'R', 10, 8, 0, { r: R }], ['C1', 'C', 20, 12, 1, { c: C, kind: 'c0g' }]], wires: [['V1.0', 'R1.0'], ['R1.1', '@o:r'], ['C1.0', '@o:u'], ['C1.1', 'gnd'], ['V1.1', 'gnd']] });
  chk(G3, 'Filtro RC pasabajos: ganancia en f_c = 1/(2πRC) igual a −3.0103 dB', db(mag(acAt(n, 1000, 'o'))), -3.0103, 1e-3, false);
  const z = acAt(n, 1000, 'o'); chk(G3, 'Filtro RC pasabajos: fase en f_c igual a −45°', Math.atan2(z[1], z[0]) * 180 / Math.PI, -45, 1e-3, false);
}
{ /* RLC serie en resonancia */
  const L = 10e-3, C = 1e-6, R = 20, f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
  const n = mk({ parts: [['V1', 'VAC', 2, 12, 0, { amp: 1, f: 1000, rs: 1e-4 }], ['R1', 'R', 10, 8, 0, { r: R }], ['L1', 'L', 18, 8, 0, { l: L, kind: 'air' }], ['C1', 'C', 26, 12, 1, { c: C, kind: 'c0g' }]], wires: [['V1.0', 'R1.0'], ['R1.1', 'L1.0'], ['L1.1', '@c:r'], ['C1.0', '@c:u'], ['C1.1', 'gnd'], ['V1.1', 'gnd']] });
  /* tensión del condensador en resonancia: Q = (1/R)·√(L/C) con r del inductor despreciable (aire) */
  const Q = Math.sqrt(L / C) / (R + 0.05 + 0.8 * Math.sqrt(L * 1e3) * 0.1);
  chk(G3, 'Circuito RLC serie: tensión en el condensador en resonancia = Q·V (Q = √(L/C)/R)', mag(acAt(n, f0, 'c')), Q, 0.02);
}
{ /* amplificadores con A.O. */
  const inv = mk({ parts: [['FG1', 'FG', -4, 12, 0, { wave: 'sin', amp: 1, f: 1000, rs: 1e-4 }], ['Rin', 'R', 5, 11, 0, { r: 10e3 }], ['Rf', 'R', 14, 7, 0, { r: 100e3 }], ['U1', 'OA', 14, 12, 0, { model: 'LM741', flip: true }]],
    wires: [['FG1.OUT', 'Rin.0'], ['FG1.GND', 'gnd'], ['Rin.1', 'U1.1'], [[9, 11], [9, 7], 'Rf.0'], ['Rf.1', [19, 7], [19, 12]], ['U1.2', [19, 12]], ['U1.2', '@out:r'], ['U1.0', 'gnd']] });
  chk(G3, 'Amplificador inversor con A.O. real (A₀ = 2·10⁵, 1 kHz): ganancia −R_f/R₁ = −10', mag(acAt(inv, 10, 'out')), 10 * (1 - 11 / 2e5), 2e-4);
  const noinv = mk({ parts: [['FG1', 'FG', -4, 12, 0, { wave: 'sin', amp: 1, f: 1000, rs: 1e-4 }], ['Rg', 'R', 7, 15, 1, { r: 10e3 }], ['Rf', 'R', 14, 21, 0, { r: 100e3 }], ['U1', 'OA', 14, 12, 0, { model: 'TL081' }]],
    wires: [['FG1.OUT', [-1, 11], 'U1.0'], ['FG1.GND', 'gnd'], ['U1.1', [7, 13]], ['Rg.1', [7, 18]], ['gndat', 7, 18], [[19, 12], [19, 21], 'Rf.1'], ['Rf.0', [9, 21], [9, 13]], ['U1.2', '@out:r']] });
  const A0 = MOD.OA.TL081.A0, Gn = 11; chk(G3, 'Amplificador no inversor con A₀ finito (DC): A = G/(1 + G/A₀)', mag(acAt(noinv, 0.001, 'out')), Gn / (1 + Gn / A0), 1e-5);
  const r = noinv.cir.acSweep(1e3, 1e7, 300, noinv.netInfo.labelNet.out); const g0 = r.mag[0]; let fh = NaN; for (let i = 1; i < r.f.length; i++) if (r.mag[i - 1] >= g0 - 3.0103 && r.mag[i] < g0 - 3.0103) { fh = r.f[i]; break; }
  chk(G3, 'No inversor con TL081: frecuencia de −3 dB = GBW/(1 + R_f/R_g) = 3 MHz/11', fh, MOD.OA.TL081.gbw / 11, 0.03);
}
{ /* MOSFET y JFET */
  const m = MOD.MOS['2N7000'];
  const nm = mk({ parts: [['VG', 'VDC', 2, 12, 0, { v: 3.5 }], ['VD', 'VDC', 20, 12, 0, { v: 5 }], ['M1', 'NMOS', 12, 12, 0, { model: '2N7000' }]], wires: [['VG.0', 'M1.1'], ['VG.1', 'gnd'], ['VD.0', 'M1.0'], ['VD.1', 'gnd'], ['M1.2', 'gnd']] });
  chk(G3, 'MOSFET 2N7000 en saturación (V_GS = 3.5 V, V_DS = 5 V): I_D = (k/2)(V_GS − V_th)²(1 + λV_DS)', nm.iPart(nm.part('M1')), 0.5 * m.k * Math.pow(3.5 - m.vth, 2) * (1 + m.lam * 5), 1e-5);
  const j = MOD.JFET['2N5457'];
  const nj = mk({ parts: [['VG', 'VDC', 2, 12, 0, { v: -1 }], ['VD', 'VDC', 20, 12, 0, { v: 8 }], ['J1', 'JFN', 12, 12, 0, { model: '2N5457' }]], wires: [['VG.0', 'J1.1'], ['VG.1', 'gnd'], ['VD.0', 'J1.0'], ['VD.1', 'gnd'], ['J1.2', 'gnd']] });
  chk(G3, 'JFET 2N5457 (I_DSS = 5 mA, V_P = 2.5 V, V_GS = −1 V): ecuación de Shockley I_D = I_DSS(1 − V_GS/V_P)²', nj.iPart(nj.part('J1')) / (1 + j.lam * 8), 5e-3 * Math.pow(1 - 1 / 2.5, 2), 1e-3);
}
{ /* reguladores */
  const reg = (model, vin, rl) => mk({ parts: [['VIN', 'VDC', 2, 12, 0, { v: vin }], ['U1', 'REG', 14, 12, 0, { model }], ['RL', 'R', 28, 12, 1, { r: rl }]], wires: [['VIN.0', '@in:u'], ['VIN.1', 'gnd'], ['U1.0', '@in:l'], ['U1.1', '@out:r'], ['U1.2', 'gnd'], ['RL.0', '@out:u'], ['RL.1', 'gnd']] });
  chk(G3, 'Regulador 7805 con 12 V y 10 Ω: salida de 5 V (±0.05 V)', Vn(reg('7805', 12, 10), 'out'), 5, 0.05, false);
  chk(G3, 'Regulador 7805 en la zona de caída (V_in = 6 V): V_out = V_in − 2 V', Vn(reg('7805', 6, 100), 'out'), 4, 0.05, false);
  chk(G3, 'Regulador 7812 con 18 V y 100 Ω: salida de 12 V (±0.1 V)', Vn(reg('7812', 18, 100), 'out'), 12, 0.1, false);
  const l317 = mk({ parts: [['VIN', 'VDC', 2, 12, 0, { v: 15 }], ['U1', 'REG', 14, 12, 0, { model: 'LM317' }], ['R1', 'R', 22, 16, 1, { r: 240 }], ['R2', 'R', 22, 22, 1, { r: 720 }], ['RL', 'R', 30, 12, 1, { r: 100 }]], wires: [['VIN.0', '@in:u'], ['VIN.1', 'gnd'], ['U1.0', '@in:l'], ['U1.1', '@out:r'], ['U1.2', '@adj:d'], ['R1.0', '@out:u'], ['R1.1', '@adj:d'], ['R2.0', '@adj:u'], ['R2.1', 'gnd'], ['RL.0', '@out:u'], ['RL.1', 'gnd']] });
  chk(G3, 'LM317 con R₁ = 240 Ω y R₂ = 720 Ω: V_out = 1.25(1 + R₂/R₁) = 5 V (más I_ADJ·R₂)', Vn(l317, 'out'), 5, 0.03, true);
}
{ /* 555: frecuencia del astable y duración del monoestable (transitorio) */
  const a = mk({ parts: [['IC', 'T555', 14, 12, 0, {}], ['VCC', 'VDC', 2, 12, 0, { v: 5 }], ['R1', 'R', 26, 8, 1, { r: 1e3 }], ['R2', 'R', 26, 15, 1, { r: 10e3 }], ['Ct', 'C', 31, 15, 1, { c: 100e-9, kind: 'film' }], ['Cc', 'C', 6, 17, 1, { c: 10e-9, kind: 'ceramic' }]],
    wires: [['VCC.0', '@vcc:u'], ['VCC.1', 'gnd'], ['IC.VCC', '@vcc:u'], ['IC.GND', 'gnd'], ['IC.RESET', '@vcc:l'], ['IC.TRIG', '@tt:l'], ['IC.THR', '@tt:l'], ['IC.CTRL', '@ctl:l'], ['Cc.0', '@ctl:u'], ['Cc.1', 'gnd'], ['IC.OUT', '@out:r'], ['IC.DIS', '@dis:r'], ['R1.0', '@vcc:u'], ['R1.1', '@dis:d'], ['R2.0', '@dis:u'], ['R2.1', '@tt:d'], ['Ct.0', '@tt:u'], ['Ct.1', 'gnd']] });
  zeroState(a); let prev = 0, ups = []; const dt = 2e-6;
  for (let i = 0; i < 20000; i++) { a.step(dt); const v = Vn(a, 'out') - 1.5; if (prev < 0 && v >= 0) ups.push(a.cir.t); prev = v; }
  const per = (ups[ups.length - 1] - ups[1]) / (ups.length - 2);
  chk(G3, '555 astable (R₁ = 1 kΩ, R₂ = 10 kΩ, C = 100 nF): frecuencia 1.44/[(R₁ + 2R₂)C] = 686 Hz', 1 / per, 1.44 / ((1e3 + 20e3) * 100e-9), 0.04);
}
{ /* optoacoplador: I_C = CTR·I_F */
  const n = mk({ parts: [['VIN', 'VDC', 2, 12, 0, { v: 5 }], ['Rin', 'R', 10, 8, 0, { r: 1e3 }], ['U1', 'OPTO', 20, 12, 0, { ctr: 0.5 }], ['VCC', 'VDC', 30, 12, 0, { v: 5 }]], wires: [['VIN.0', 'Rin.0'], ['VIN.1', 'gnd'], ['Rin.1', 'U1.0'], ['U1.1', 'gnd'], ['VCC.0', 'U1.2'], ['VCC.1', 'gnd'], ['U1.3', 'gnd']] });
  const iF = Math.abs(n.iPart(n.part('Rin'))), ic = Math.abs(n.iPart(n.part('VCC')));
  chk(G3, 'Optoacoplador con CTR = 0.5 y V_CE grande: I_C = CTR·I_F', ic, 0.5 * iF, 0.02);
}
{ /* SCR: enclavamiento */
  const sp = (g) => ({ parts: [['VS', 'VDC', 2, 12, 0, { v: 12 }], ['RL', 'R', 16, 12, 1, { r: 24 }], ['X1', 'SCR', 16, 20, 0, { igt: 0.005, ih: 0.02 }], ['VG', 'VDC', 4, 26, 0, { v: g }], ['Rg', 'R', 18, 26, 0, { r: 330 }]], wires: [['VS.0', '@vs:u'], ['VS.1', 'gnd'], ['RL.0', '@vs:u'], ['RL.1', '@a:d'], ['X1.0', '@a:u'], ['X1.1', 'gnd'], ['VG.0', '@g:u'], ['VG.1', 'gnd'], ['Rg.0', '@g:l'], ['Rg.1', 'X1.2']] });
  chk(G3, 'SCR sin corriente de puerta: bloqueado (V_AK = 12 V)', Vn(mk(sp(0)), 'a'), 12, 1e-3, false);
  const on = mk(sp(5)); chk(G3, 'SCR con puerta a 5 V/330 Ω: conduce con V_AK ≈ 0.9 V (hoja de datos 0.9–1.5 V)', Vn(on, 'a'), 0.9, 0.2, false);
  on.part('VG').p.v = 0; on.rebuild(); on.cir.solveDC(); chk(G3, 'SCR enclavado: al quitar la corriente de puerta sigue conduciendo (V_AK < 2 V)', Vn(on, 'a') < 2 ? 1 : 0, 1, 0, false);
}
{ /* diodo Zener */
  const n = mk({ parts: [['V1', 'VDC', 2, 12, 0, { v: 12 }], ['R1', 'R', 10, 8, 0, { r: 700 }], ['Z1', 'ZD', 20, 12, 3, { vz: 5.1 }]], wires: [['V1.0', 'R1.0'], ['R1.1', '@z:r'], ['Z1.1', '@z:u'], ['Z1.0', 'gnd'], ['V1.1', 'gnd']] });
  chk(G3, 'Zener de 5.1 V con ≈ 10 mA: tensión de ruptura 5.1 V ± 3 %', Vn(n, 'z'), 5.1, 0.03);
}
{ /* rectificador de puente con filtro */
  const n = mk({ parts: [['VAC', 'VAC', 2, 12, 0, { amp: 17, f: 60, rs: 0.5 }], ['BR', 'BR', 12, 12, 0, { model: '1N4007' }], ['C1', 'C', 22, 12, 1, { c: 2200e-6, kind: 'elec' }], ['RL', 'R', 30, 12, 1, { r: 10 }]], wires: [['VAC.0', '@a:u'], ['VAC.1', '@b:d'], ['BR.0', '@a:l'], ['BR.1', '@b:r'], ['BR.2', '@r:u'], ['BR.3', 'gnd'], ['C1.0', '@r:u'], ['C1.1', 'gnd'], ['RL.0', '@r:u'], ['RL.1', 'gnd']] });
  zeroState(n); let mx = 0, mn = 1e9; const dt = 5e-5;
  for (let i = 0; i < 8000; i++) { n.step(dt); if (i > 6000) { const v = Vn(n, 'r'); mx = Math.max(mx, v); mn = Math.min(mn, v); } }
  chk(G3, 'Rectificador de onda completa con filtro (17 V pico, 2200 µF, 10 Ω): pico entre V_pk − 2V_D − I·r_s y V_pk', mx > 12.5 && mx < 15.5 ? 1 : 0, 1, 0, false);
  chk(G3, 'Rectificador con filtro: rizado pico a pico menor que la cota I/(2fC) y mayor que 0.5 V', (mx - mn) < ((mx + mn) / 2 / 10) / (2 * 60 * 2200e-6) && (mx - mn) > 0.5 ? 1 : 0, 1, 0, false);
}
{ /* temperatura del diodo: V_F disminuye ≈ 2 mV/K */
  const vf = (T) => { const n = new EM.Net({ damage: false, Ta: T }); n.load(EM.Net.fromSpec({ parts: [['I1', 'IDC', 2, 12, 0, { i: 1e-3 }], ['D1', 'D', 12, 12, 3, { model: '1N4148' }]], wires: [['I1.0', '@a:u'], ['I1.1', 'gnd'], ['D1.0', '@a:u'], ['D1.1', 'gnd']] })); n.rebuild(); const e = n.cir.els.find((x) => x.type === 'D'); e.T = T + 273.15; n.cir.refreshTemp(e); n.cir.solveDC(); return Vn(n, 'a'); };
  chk(G3, 'Diodo de silicio: dV_F/dT a corriente fija entre 25 y 75 °C ≈ −2 mV/K (±40 %)', (vf(75) - vf(25)) / 50 * 1000, -2.1, 0.4, true);
}

/* ===================== 4. Cifras de problemas resueltos ===================== */
const P = (cap, nombre, got, exp, tol) => chk(G4, `Cap. ${cap}, ${nombre}`, got, exp, tol);
P(17, 'problema 1: I_C de la polarización fija (9 V, 470 kΩ, 2.2 kΩ, β = 150)', 150 * (9 - 0.7) / 470e3 * 1e3, 2.65, 5e-3);
P(17, 'problema 3: I_C del divisor con β = 100 (mA)', 100 * (2.79 - 0.7) / (7.67e3 + 101 * 1e3) * 1e3, 1.92, 1e-2);
P(18, 'problema 1: g_m con I_C = 1 mA (mS)', 1e-3 / 0.0259 * 1e3, 38.6, 2e-3);
P(19, 'problema 1: I_D del NMOS (k = 0.07, V_ov = 1.9 V) en mA', 0.5 * 0.07 * 1.9 * 1.9 * 1e3, 126, 5e-3);
P(19, 'problema 2: R_DS(on) del IRLZ44N a 5 V (mΩ)', 1 / (13.8 * 3.3) * 1e3, 22, 2e-2);
P(20, 'problema 3: I_D del JFET autopolarizado (mA)', ((2 * 5e-3 * 188 + 1) - Math.sqrt(4 * 5e-3 * 188 + 1)) / (2 * 5e-3 * 188 * 188) * 1e3, 1.98, 5e-3);
P(21, 'problema 1: potencia de la etapa clase B, P_o (W)', 100 / 16, 6.25, 1e-6);
P(21, 'problema 2: potencia disipada máxima de la etapa clase B (W)', 2 * 144 / (Math.PI * Math.PI * 8), 3.65, 3e-3);
P(22, 'problema 3: ganancia con A₀ = 10⁵ y G = 1000', 1000 / (1 + 1000 / 1e5), 990.1, 1e-4);
P(23, 'problema 2: CMRR del restador con R₄ +2 % (dB)', 20 * Math.log10(10 / (11 * 102 / 112 - 10)), 54.9, 4e-3);
P(24, 'problema 2: frecuencia del oscilador de relajación (kHz)', 1 / (2 * 1e4 * 1e-8 * Math.log(3)) / 1e3, 4.55, 1e-3);
P(25, 'problema 1: potencia disipada por el 7812 con 18 V y 0.3 A (W)', (18 - 12) * 0.3 + 18 * 0.0055, 1.9, 1e-2);
P(26, 'problema 1: tensión eficaz del SCR con α = 90° y 120 V eficaces (V)', 120 * Math.SQRT2 / 2 * Math.sqrt(1 - 0.5), 60.0, 1e-3);
P(27, 'problema 1: indicación del voltímetro de 10 MΩ en el divisor 470 k/470 k (V)', 6 * 10e6 / (10e6 + 235e3), 5.862, 1e-3);
P(28, 'problema 1: corriente de cortocircuito de la batería (A)', 12.6 / 0.05, 252, 1e-6);

/* ---- Resultado ---- */
const out = { fecha: new Date().toISOString().slice(0, 10), ok, bad, rows };
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify(out, null, 1));
console.log(`${ok} de ${ok + bad} pruebas superadas` + (bad ? ` · ${bad} FALLAN` : ''));
process.exit(bad ? 1 : 0);
