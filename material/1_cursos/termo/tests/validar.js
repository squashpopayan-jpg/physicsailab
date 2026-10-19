/* Validación de la biblioteca científica (src/core/30-thermo.js).
   1) contra referencias independientes: CoolProp (IAPWS-95, R-134a, gases reales, aire húmedo) y SciPy
   2) contra datos de la literatura (NIST-JANAF, CRC, Çengel y Boles, Kittel, Turns).
   Ejecutar: node tests/validar.js   (python tests/referencias.py antes, si cambió) */
const path = require('path');
const fs = require('fs');
const TH = require(path.join(__dirname, '../src/core/30-thermo.js'));
const ref = require('./referencias.json');
const R0 = 8.314462618;
let ok = 0, bad = 0;
const rows = [];
function chk(group, name, got, exp, tol, rel = true) {
  const err = rel ? Math.abs(got - exp) / Math.max(1e-300, Math.abs(exp)) : Math.abs(got - exp);
  const pass = isFinite(got) && err <= tol;
  pass ? ok++ : bad++;
  rows.push({ group, name, got, exp, tol: (rel ? 'rel ' : 'abs ') + tol, pass });
  if (!pass) console.log('FALLA', group, '·', name, 'obtenido', got, 'esperado', exp, 'err', err);
}
const W = TH.agua, F = TH.r134a, C = 'CoolProp', S = 'SciPy', L = 'Literatura';
const c = (T) => (T - 273.15).toFixed(0) + ' °C';
/* ---- 1a. CoolProp ---- */
for (const [T, v] of Object.entries(ref.agua_sat)) {
  const s = W.sat(+T);
  chk(C, `agua saturada ${c(+T)}: P`, s.P, v[0], 2e-4);
  chk(C, `agua saturada ${c(+T)}: h_f`, s.hf, v[1], 2e-3);
  chk(C, `agua saturada ${c(+T)}: h_g`, s.hg, v[2], 2e-4);
  chk(C, `agua saturada ${c(+T)}: s_g`, s.sg, v[4], 2e-4);
  chk(C, `agua saturada ${c(+T)}: v_g`, s.vg, v[5], 1e-3);
}
for (const [k, v] of Object.entries(ref.agua_sup)) {
  const [p, T] = k.split(',').map(Number), s = W.sup(p, T);
  const lab = `agua ${(p / 1e6).toPrecision(3)} MPa, ${c(T)}`;
  chk(C, lab + ': h', s.h, v[0], 1e-3); chk(C, lab + ': s', s.s, v[1], 1e-3); chk(C, lab + ': v', s.v, v[2], 3e-3);
}
for (const [p, v] of Object.entries(ref.agua_Tsat)) chk(C, `agua T_sat(${(+p / 1e3).toPrecision(4)} kPa)`, W.Tsat(+p), v, 1e-4);
for (const [T, v] of Object.entries(ref.r134a_sat)) {
  const s = F.sat(+T);
  chk(C, `R-134a saturado ${c(+T)}: P`, s.P, v[0], 2e-4); chk(C, `R-134a saturado ${c(+T)}: h_f`, s.hf, v[1], 5e-4);
  chk(C, `R-134a saturado ${c(+T)}: h_g`, s.hg, v[2], 2e-4); chk(C, `R-134a saturado ${c(+T)}: s_g`, s.sg, v[3], 2e-4);
}
for (const [k, v] of Object.entries(ref.r134a_sup)) {
  const [p, T] = k.split(',').map(Number), s = F.sup(p, T);
  chk(C, `R-134a ${(p / 1e6).toPrecision(3)} MPa, ${c(T)}: h`, s.h, v[0], 1e-3); chk(C, `R-134a ${(p / 1e6).toPrecision(3)} MPa, ${c(T)}: s`, s.s, v[1], 1e-3);
}
chk(C, 'Rankine ideal 3 MPa/350 °C/75 kPa: η', TH.rankine({ Ph: 3e6, Pl: 75e3, T3: 623.15 }).eta, ref.rankine['3e6,75e3,623.15'], 3e-3);
chk(C, 'Rankine ideal 10 MPa/550 °C/10 kPa: η', TH.rankine({ Ph: 10e6, Pl: 10e3, T3: 823.15 }).eta, ref.rankine['10e6,10e3,823.15'], 3e-3);
chk(C, 'Rankine regenerativo 15 MPa/600 °C/10 kPa, calentador abierto a 1.2 MPa: η', TH.rankineRegen({ Ph: 15e6, Pl: 10e3, Pb: 1.2e6, T5: 873.15 }).eta, ref.regen['15e6,10e3,1.2e6,873.15'], 3e-3);
chk(C, 'refrigerador R-134a −10/40 °C: COP', TH.refrig({ Te: 263.15, Tc: 313.15 }).cop, ref.refrig['263.15,313.15'], 3e-3);
chk(C, 'refrigerador R-134a 0/35 °C: COP', TH.refrig({ Te: 273.15, Tc: 308.15 }).cop, ref.refrig['273.15,308.15'], 3e-3);
for (const [T, v] of Object.entries(ref.psat)) chk(C, `Wagner–Pruss p_sat(${c(+T)})`, TH.psatW(+T), v, 1e-4);
for (const [k, v] of Object.entries(ref.Zreal)) {
  const [g, T, p] = k.split(','); const z = TH.eosZ('pr', g, +T, +p); chk(C, `Peng–Robinson vs ecuación de referencia: Z(${g}, ${T} K, ${+p / 1e6} MPa)`, z[z.length - 1], v, 0.04);
}
for (const [k, v] of Object.entries(ref.cp0)) { const [g, T] = k.split(','); chk(C, `c_p° estadístico RRHO de ${g} a ${T} K`, TH.cpMol(g, +T), v, 0.025); }
for (const [k, v] of Object.entries(ref.psy_w)) { const [T, r, p] = k.split(',').map(Number); chk(C, `aire húmedo ω(${T} °C, φ=${r}, ${p / 1e3} kPa)`, TH.psy.w(T, r, p), v, 6e-3); }
for (const [k, v] of Object.entries(ref.psy_wb)) { const [T, r, p] = k.split(',').map(Number); chk(C, `bulbo húmedo (${T} °C, φ=${r}, ${p / 1e3} kPa)`, TH.psy.Twb(T, TH.psy.w(T, r, p), p), v, 0.15, false); }
for (const [k, v] of Object.entries(ref.psy_dew)) { const [T, r, p] = k.split(',').map(Number); chk(C, `punto de rocío (${T} °C, φ=${r}, ${p / 1e3} kPa)`, TH.psy.Tdew(TH.psy.w(T, r, p), p), v, 0.05, false); }
for (const [k, v] of Object.entries(ref.jt)) { const [g, T, p] = k.split(','); chk(C, `Joule–Thomson con Peng–Robinson: T tras estrangular ${g} de ${+p / 1e5} bar y ${T} K a 1 bar`, TH.jtT2(g, +T, +p, 1e5), v, 5, false); }
/* ---- 1b. SciPy ---- */
for (const [k, v] of Object.entries(ref.prZ)) { const [g, T, p] = k.split(','); const z = TH.eosZ('pr', g, +T, +p); chk(S, `Peng–Robinson Z(${g}, ${T} K, ${+p / 1e6} MPa) (numpy.roots)`, z[z.length - 1], v, 1e-9); }
for (const [t, v] of Object.entries(ref.maxwell)) chk(S, `van der Waals: presión de Maxwell P_r(T_r=${t})`, TH.vdwMaxwell(+t).Pr, v, 1e-6);
for (const [k, v] of Object.entries(ref.debye)) { const [T, th] = k.split(',').map(Number); chk(S, `Debye C_v/3R (T=${T} K, Θ=${th} K)`, TH.debyeCv(T, th), v, 1e-8); }
for (const [k, v] of Object.entries(ref.fermi)) { const [j, e] = k.split(',').map(Number); chk(S, `Fermi–Dirac F_${j}(η=${e})`, TH.fermiInt(j, e), v, 1e-7); }
for (const [k, v] of Object.entries(ref.bose)) { const [j, z] = k.split(',').map(Number); chk(S, `Bose g_${j}(z=${z})`, TH.boseG(j, z), v, 1e-7); }
for (const [l, v] of Object.entries(ref.bbfrac)) chk(S, `fracción de cuerpo negro F(0→λT=${l} m·K)`, TH.bbFrac(+l, 1), v, 1e-8);
for (const [x, v] of Object.entries(ref.erf)) chk(S, `erf(${x})`, TH.erf(+x), v, 1e-12);
for (const [z, v] of Object.entries(ref.lngamma)) chk(S, `ln Γ(${z})`, TH.lnGamma(+z), v, 1e-12);
chk(S, 'cuadratura Gauss–Legendre ∫₀^π sen x dx', TH.quad(Math.sin, 0, Math.PI), 2, 1e-14);
chk(S, 'RK4: dy/dt = −y, y(1)', (() => { let y = [1]; for (let i = 0; i < 100; i++) y = TH.rk4((t, y) => [-y[0]], i * 0.01, y, 0.01); return y[0]; })(), Math.exp(-1), 1e-9);
/* ---- 2. Literatura ---- */
chk(L, 'σ de Stefan–Boltzmann (CODATA 5.670374×10⁻⁸)', TH.sigma, 5.670374419e-8, 1e-9);
chk(L, 'agua: punto de ebullición normal 99.97 °C (IAPWS)', W.Tsat(101325) - 273.15, 99.974, 0.01, false);
chk(L, 'agua: h_fg a 100 °C = 2256.4 kJ/kg (Çengel A-4)', W.sat(373.15).hfg / 1e3, 2256.4, 1e-3);
chk(L, 'agua: v_g a 100 °C = 1.6720 m³/kg (Çengel A-4)', W.sat(373.15).vg, 1.672, 1e-3);
chk(L, 'agua: h a 1 MPa, 300 °C = 3051.6 kJ/kg (Çengel A-6)', W.sup(1e6, 573.15).h / 1e3, 3051.6, 1e-3);
chk(L, 'agua: s a 1 MPa, 300 °C = 7.1246 kJ/kg·K (Çengel A-6)', W.sup(1e6, 573.15).s / 1e3, 7.1246, 1e-3);
chk(L, 'agua: ebullición en Popayán (1760 m, ISA) ≈ 94.1 °C', W.Tsat(TH.isa(1760).P) - 273.15, 94.1, 0.15, false);
chk(L, 'R-134a: P_sat a −10 °C = 200.74 kPa (Çengel A-11)', F.Psat(263.15) / 1e3, 200.74, 1e-3);
chk(L, 'ISA: presión a 1760 m ≈ 81.9 kPa', TH.isa(1760).P / 1e3, 81.9, 2e-3);
chk(L, 'NIST-JANAF: c_p(N₂, 1000 K) = 32.70 J/mol·K', TH.cpMol('N2', 1000), 32.70, 0.02);
chk(L, 'NIST-JANAF: c_p(CO₂, 1000 K) = 54.31 J/mol·K', TH.cpMol('CO2', 1000), 54.31, 0.02);
chk(L, 'NIST-JANAF: c_p(H₂O, 1000 K) = 41.27 J/mol·K', TH.cpMol('H2O', 1000), 41.27, 0.03);
chk(L, 'NIST-JANAF: h(N₂,2000 K)−h(298) = 56.14 kJ/mol', TH.dhMol('N2', 2000) / 1e3, 56.14, 0.02);
chk(L, 'NIST-JANAF: h(CO₂,2000 K)−h(298) = 91.44 kJ/mol', TH.dhMol('CO2', 2000) / 1e3, 91.44, 0.02);
chk(L, 'aire: c_p a 300 K = 1.005 kJ/kg·K (Çengel A-2)', TH.cpAire(300) / 1e3, 1.005, 4e-3);
chk(L, 'aire: c_p a 1000 K = 1.142 kJ/kg·K (Çengel A-2)', TH.cpAire(1000) / 1e3, 1.142, 0.015);
chk(L, 'PCI del metano = 50.0 MJ/kg', TH.PCI('CH4') / 1e6, 50.0, 4e-3);
chk(L, 'PCS del metano = 55.5 MJ/kg', TH.PCS('CH4') / 1e6, 55.5, 4e-3);
chk(L, 'PCI del propano = 46.35 MJ/kg', TH.PCI('C3H8') / 1e6, 46.35, 5e-3);
chk(L, 'PCI del hidrógeno = 120.0 MJ/kg', TH.PCI('H2') / 1e6, 120.0, 5e-3);
chk(L, 'relación aire–combustible estequiométrica del metano = 17.2', TH.combustion('CH4').AF, 17.2, 5e-3);
chk(L, 'relación aire–combustible estequiométrica del octano = 15.1', TH.combustion('C8H18').AF, 15.1, 5e-3);
chk(L, 'llama adiabática CH₄–aire sin disociación ≈ 2328 K (Turns)', TH.flameT('CH4'), 2328, 0.02);
chk(L, 'llama adiabática H₂–aire sin disociación ≈ 2525 K', TH.flameT('H2'), 2525, 0.03);
chk(L, 'Sackur–Tetrode: S°(Ar, 298 K, 1 bar) = 154.85 J/mol·K', TH.sackur(39.948, 298.15, 1e5), 154.85, 1e-3);
chk(L, 'Sackur–Tetrode: S°(He, 298 K, 1 bar) = 126.15 J/mol·K', TH.sackur(4.0026, 298.15, 1e5), 126.15, 1e-3);
chk(L, 'Maxwell: v_rms del N₂ a 300 K = 517 m/s', TH.maxwell(28.0134, 300).vrms, 517, 2e-3);
chk(L, 'Maxwell: v media del O₂ a 300 K = 445 m/s', TH.maxwell(31.9988, 300).vm, 445, 3e-3);
chk(L, 'recorrido libre medio del aire a 1 atm, 300 K ≈ 67 nm (d = 0.37 nm)', TH.mfp(300, 101325, 3.7e-10) * 1e9, 67, 0.03);
chk(L, 'viscosidad del N₂ (esferas duras, d = 0.37 nm) ≈ 1.79×10⁻⁵ Pa·s', TH.viscHS(28.0134, 300, 3.7e-10), 1.79e-5, 0.1);
chk(L, 'van der Waals: Z_c = 3/8', (() => { const { b } = TH.eosAB('vdw', 'CO2', 300); return (TH.CRIT.CO2.Pc * 3 * b) / (R0 * TH.CRIT.CO2.Tc); })(), 0.375, 1e-12);
chk(L, 'Wien: λ_max del Sol (5772 K) = 502 nm', (TH.wienB / 5772) * 1e9, 502, 2e-3);
chk(L, 'fracción visible (0.4–0.7 µm) del Sol a 5772 K ≈ 0.37', TH.bbFrac(0.7e-6, 5772) - TH.bbFrac(0.4e-6, 5772), 0.37, 0.03);
chk(L, 'Fermi: E_F del cobre (n = 8.47×10²⁸ m⁻³) = 7.00 eV (Kittel)', TH.fermiE(8.47e28) / TH.eV, 7.00, 5e-3);
chk(L, 'BEC: T_c ideal del ⁴He líquido (n = 2.18×10²⁸ m⁻³) = 3.13 K (London)', TH.becTc(4.0026, 2.18e28), 3.13, 5e-3);
chk(L, 'Debye: C_v(T = Θ_D) = 0.952·3R', TH.debyeCv(343, 343), 0.952, 1e-3);
chk(L, 'Landauer: kT ln 2 a 300 K = 2.87×10⁻²¹ J', TH.landauer(300), 2.871e-21, 1e-3);
chk(L, 'Carnot 600/300 K = 0.5', TH.carnot(600, 300), 0.5, 1e-15);
chk(L, 'Otto ideal r = 8, k = 1.4: η = 0.565 (Çengel ej. 9-2)', TH.otto(8), 0.5647, 1e-3);
chk(L, 'Diesel ideal r = 16, r_c = 2: η = 0.614', TH.diesel(16, 2), 0.6142, 2e-3);
chk(L, 'Brayton ideal r_p = 8: η = 0.448 (Çengel ej. 9-5)', TH.braytonIdeal(8), 0.4479, 1e-3);
chk(L, 'Brayton r_p = 8, 300/1300 K, η_c = 0.8, η_t = 0.85: η ≈ 0.266 (Çengel ej. 9-6)', TH.brayton({ rp: 8, T1: 300, T3: 1300, etac: 0.8, etat: 0.85 }).eta, 0.266, 0.04);
chk(L, 'Curzon–Ahlborn 838/298 K = 0.40', TH.curzon(838, 298), 0.4037, 1e-3);
chk(L, 'N₂O₄ ⇌ 2NO₂: α a 298 K, 1 bar ≈ 0.19', TH.n2o4(298.15, 1e5).alpha, 0.19, 0.06);
for (const [rx, T, v, src] of [['co2', 298.15, -103.762, 'JANAF'], ['co2', 1000, -23.529, 'JANAF'], ['co2', 2000, -6.635, 'JANAF'], ['co2', 3000, -1.111, 'JANAF'], ['h2o', 298.15, -92.208, 'JANAF'], ['h2o', 1000, -23.163, 'JANAF'], ['h2o', 2000, -8.145, 'JANAF'], ['no', 298.15, -34.935, 'JANAF (ΔfG° = 86.60 kJ/mol)'], ['no', 2000, -3.931, 'JANAF'], ['wgs', 1000, 0.366, 'K = 1.44']]) chk(L, `ln K_p de ${TH.RXN[rx].n} a ${T} K (${src})`, TH.lnKp(rx, T), v, 0.06, false);
chk(L, 'llama adiabática CH₄–aire con disociación (CO, H₂, O₂) ≈ 2226 K en equilibrio completo (Turns)', TH.flameTdiss('CH4'), 2226, 0.02);
for (const [n, M, v] of [['Ne', 20.1797, 146.328], ['Kr', 83.798, 164.085], ['Xe', 131.293, 169.685]]) chk(L, `Sackur–Tetrode: S°(${n}, 298 K, 1 bar) = ${v} J/mol·K (CODATA)`, TH.sackur(M, 298.15, 1e5), v, 1e-3);
const out = { fecha: new Date().toISOString().slice(0, 10), ok, bad, rows };
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify(out, null, 1));
console.log(`${ok} correctas, ${bad} fallas de ${ok + bad}`);
