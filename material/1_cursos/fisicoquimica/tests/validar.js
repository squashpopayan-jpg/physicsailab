/* Validación de la biblioteca científica (src/core/*.js).
   1) contra referencias independientes: Cantera, CoolProp, thermo/chemicals, SciPy/NumPy (tests/referencias.py)
   2) contra datos de la literatura (NIST, CRC, CODATA, textos).
   Ejecutar: node tests/validar.js   (python tests/referencias.py antes, si cambió) */
const path = require('path');
const fs = require('fs');
const TH = require(path.join(__dirname, '../src/core/30-thermo.js'));
const FQ = require(path.join(__dirname, '../src/core/31-fq.js'));
require(path.join(__dirname, '../src/core/32-fq-gas.js'));
require(path.join(__dirname, '../src/core/33-fq-sol.js'));
require(path.join(__dirname, '../src/core/34-fq-ele.js'));
require(path.join(__dirname, '../src/core/38-fq-cin.js'));
const ref = require('./referencias.json');
let ok = 0, bad = 0;
const rows = [];
function chk(group, name, got, exp, tol, rel = true) {
  const err = rel ? Math.abs(got - exp) / Math.max(1e-300, Math.abs(exp)) : Math.abs(got - exp);
  const pass = isFinite(got) && err <= tol;
  pass ? ok++ : bad++;
  rows.push({ group, name, got, exp, tol: (rel ? 'rel ' : 'abs ') + tol, pass });
  if (!pass) console.log('FALLA', group, '·', name, 'obtenido', got, 'esperado', exp, 'err', err);
}
const C = 'CoolProp', S = 'SciPy', L = 'Literatura', K = 'Cantera', T_ = 'thermo';
const sub = (n) => n.replace(/\d+/g, (d) => d.split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join(''));

/* ---- Cap. 1 ---- */
for (const [p, v] of Object.entries(ref.tsat)) chk(C, `T_ebullición del agua a ${(+p / 1e3).toPrecision(4)} kPa`, TH.agua.Tsat(+p), v, 1e-4);
for (const [xx, v] of Object.entries(ref.etoh)) {
  const b = FQ.etoh.Vbar(+xx), vm = FQ.etoh.VmFit(+xx);
  chk(S, `etanol–agua x = ${xx}: V̄ del etanol (ajuste Redlich–Kister, numpy.polyfit)`, b[0], v[0], 1e-5);
  chk(S, `etanol–agua x = ${xx}: V̄ del agua`, b[1], v[1], 1e-5);
  chk(S, `etanol–agua x = ${xx}: V_m de la mezcla`, vm, v[2], 1e-8);
  /* Euler: V = x1 V̄1 + x2 V̄2 */
  chk(L, `etanol–agua x = ${xx}: identidad de Euler V_m = Σ x_i V̄_i`, +xx * b[0] + (1 - +xx) * b[1], vm, 1e-12);
}
for (const [chi, v] of Object.entries(ref.regular)) {
  const xb = FQ.bisect((x) => Math.log(x / (1 - x)) + +chi * (1 - 2 * x), 1e-12, 0.5 - 1e-12, 1e-14);
  chk(S, `disolución regular χ = ${chi}: composición binodal (scipy.brentq)`, xb, v, 1e-9);
}
chk(L, 'etanol–agua: volumen de 50 mL + 50 mL ≈ 96.4 mL (valor conocido ≈ 96.5)', (() => { const E = FQ.etoh, r1 = E.M1 / E.V1, r2 = E.M2 / E.V2, a = 50 * r1 / E.M1, b = 50 * r2 / E.M2, x = a / (a + b); return (a + b) * E.VmFit(x); })(), 96.5, 2e-3);
chk(L, 'etanol–agua: V̄ del etanol a dilución infinita ≈ 55 cm³/mol (literatura 54.6–55.2)', FQ.etoh.Vbar(1e-6)[0], 54.9, 0.01);
chk(L, 'Gibbs–Duhem etanol–agua en x = 0.3: x₁dV̄₁ + x₂dV̄₂ = 0', (() => { const x = 0.3, hh = 1e-5, a = FQ.etoh.Vbar(x + hh), b = FQ.etoh.Vbar(x - hh); return x * (a[0] - b[0]) / (2 * hh) + (1 - x) * (a[1] - b[1]) / (2 * hh); })(), 0, 1e-5, false);

/* ---- NASA-7 (GRI-Mech) y equilibrio de gases ideales ---- */
for (const [k, v] of Object.entries(ref.nasa)) {
  const [sp, T] = k.split(',');
  chk(K, `${sub(sp)} a ${T} K: h° (J/mol)`, FQ.h(sp, +T), v[0], 0.05, false);
  chk(K, `${sub(sp)} a ${T} K: s° a 1 bar (J/mol·K)`, FQ.s(sp, +T), v[1], 1e-7);
  chk(K, `${sub(sp)} a ${T} K: c_p° (J/mol·K)`, FQ.cp(sp, +T), v[2], 1e-6);
}
for (const [name, d] of Object.entries(ref.eq)) {
  const comp = {}; d.comp.split(',').forEach((t) => { const [a, b] = t.split(':'); comp[a] = +b; });
  const r = FQ.equil(d.sp, comp, d.T, d.P);
  for (const s of d.sp) if (d.x[s] > 1e-6) chk(K, `${name}: x(${sub(s)}) en el equilibrio (minimización de G)`, r.x[s], d.x[s], 2e-5);
}

/* ---- Cap. 2: gases reales ---- */
for (const [name, d] of Object.entries(ref.prmix)) {
  const r = FQ.prMix(d.sp, d.y, d.T, d.P);
  chk(T_, `Peng–Robinson (${name}): Z de la mezcla (thermo usa coeficientes sin redondear)`, r.Z, d.Z, 5e-5);
  d.sp.forEach((s, i) => chk(T_, `Peng–Robinson (${name}): φ(${sub(s)}) en la mezcla`, r.phi[i], d.phi[i], 5e-5));
}
for (const [k, v] of Object.entries(ref.coolprop_phi)) {
  const [g, T, P] = k.split(','), r = FQ.prPure(g, +T, +P);
  chk(C, `${sub(g)} a ${T} K y ${(+P / 1e6)} MPa: φ de Peng–Robinson frente a la ecuación de referencia`, r.phi, v[0], 0.12);
  chk(C, `${sub(g)} a ${T} K y ${(+P / 1e6)} MPa: Z de Peng–Robinson frente a la ecuación de referencia`, r.Z, v[1], 0.12);
}
for (const g of Object.keys(ref.bvir || {})) {}
for (const [k, v] of Object.entries(ref.virialB)) { const [g, T] = k.split(','); chk(C, `B(${sub(g)}, ${T} K): correlación de Pitzer–Curl frente a CoolProp (cm³/mol)`, FQ.virialB(g, +T), v, 3, false); }
for (const g of ['N2', 'CH4', 'CO2', 'AR']) for (const [T, B] of require(path.join(__dirname, '../src/core/29-datos.js')).bvir[g]) { if (T / FQ.crit[g].Tc >= 1) chk(C, `B(${sub(g)}, ${T.toFixed(0)} K): Pitzer–Curl frente a CoolProp (cm³/mol)`, FQ.virialB(g, T), B, 6, false); }
chk(L, 'temperatura de Boyle del N₂: correlación ≈ 327 K (Atkins)', FQ.boyleT('N2'), 327.2, 0.04);
chk(L, 'temperatura de Boyle del Ar: correlación ≈ 411 K (Atkins)', FQ.boyleT('AR'), 411.5, 0.02);
chk(L, 'ecuación de van der Waals: T_B = 27 T_c/8', 27 / 8, 3.375, 1e-12);
chk(L, 'Peng–Robinson a baja densidad: B = b − a/(RT) (desarrollo analítico del virial)', (() => { const T = 300, P = 10, pr = FQ.prParams('CO2', T), Z = FQ.prPure('CO2', T, P).Z; return ((Z - 1) * FQ.R * T) / P; })(), (() => { const pr = FQ.prParams('CO2', 300); return pr.b - pr.a / (FQ.R * 300); })(), 1e-3);
chk(C, 'presión de saturación del N₂ a 100 K: Peng–Robinson frente a CoolProp', FQ.prPsat('N2', 100), ref.psat_pr['N2,100'], 0.03);
chk(C, 'presión de saturación del CO₂ a 280 K: Peng–Robinson frente a CoolProp', FQ.prPsat('CO2', 280), ref.psat_pr['CO2,280'], 0.03);

/* ---- Cap. 3: termoquímica ---- */
for (const [k, v] of Object.entries(ref.atct)) {
  const t = FQ.tt[k];
  chk(L, `${sub(k.replace(/\(.*/, ''))} (${k.match(/\((.*)\)/)[1]}): ΔfH° de la tabla del curso frente a ATcT/CRC (kJ/mol)`, t.H, v[0], 1.2, false);
  chk(L, `${sub(k.replace(/\(.*/, ''))} (${k.match(/\((.*)\)/)[1]}): S° de la tabla del curso frente a ATcT/CRC (J/mol·K)`, t.S, v[1], 0.6, false);
}
for (const [k, v] of Object.entries(ref.atct_s)) { const [M, X] = k.endsWith('(s)') ? ['Na', 'Cl'] : [k.match(/^[A-Z][a-z]?/)[0], k.slice(k.match(/^[A-Z][a-z]?/)[0].length)]; chk(L, `${k.replace('(s)', '')}: ΔfH° de la sal (Born–Haber) frente a CRC/ATcT (kJ/mol)`, require(path.join(__dirname, '../src/core/29-datos.js')).born.Hf[M + X], v, 3.5, false); }
for (const [k, [nu, v]] of Object.entries(ref.kirch)) { const [n, T] = k.split(','); chk(S, `Kirchhoff, ${n} a ${T} K: ∫Δ_rC_p dT frente a scipy.quad sobre Cantera (kJ/mol)`, (FQ.dH(nu, +T) - FQ.dH(nu, 298.15)) / 1e3, v / 1e3, 1e-5); }
const rx_ = (nu) => FQ.rxn(nu);
chk(L, 'Hess: combustión de la glucosa = −2803 kJ/mol (CRC)', rx_({ 'glucosa(s)': -1, 'O2(g)': -6, 'CO2(g)': 6, 'H2O(l)': 6 }).H, -2803, 2e-3);
chk(L, 'Hess: combustión del metano (agua líquida) = −890.6 kJ/mol', rx_({ 'CH4(g)': -1, 'O2(g)': -2, 'CO2(g)': 1, 'H2O(l)': 2 }).H, -890.6, 2e-3);
chk(L, 'Hess: combustión del etanol líquido = −1366.8 kJ/mol (Atkins)', rx_({ 'C2H5OH(l)': -1, 'O2(g)': -3, 'CO2(g)': 2, 'H2O(l)': 3 }).H, -1366.8, 2e-3);
chk(L, 'Hess: combustión del benceno líquido = −3267.6 kJ/mol (CRC)', rx_({ 'C6H6(l)': -1, 'O2(g)': -7.5, 'CO2(g)': 6, 'H2O(l)': 3 }).H, -3267.6, 3e-3);
chk(L, 'Hess: termita Fe₂O₃ + 2Al = −851.5 kJ/mol', rx_({ 'Fe2O3(s)': -1, 'Al(s)': -2, 'Al2O3(s)': 1, 'Fe(s)': 2 }).H, -851.5, 1e-3);
chk(L, 'Hess: neutralización H⁺ + OH⁻ = −55.8 kJ/mol', rx_({ 'H+(aq)': -1, 'OH-(aq)': -1, 'H2O(l)': 1 }).H, -55.8, 2e-3);
chk(L, 'K de H⁺ + OH⁻ → H₂O: 1/K_w = 10¹⁴', Math.log10(rx_({ 'H+(aq)': -1, 'OH-(aq)': -1, 'H2O(l)': 1 }).K), 14, 0.01);
chk(L, 'K_ps del AgCl a 298 K = 1.77×10⁻¹⁰ (CRC)', rx_({ 'AgCl(s)': -1, 'Ag+(aq)': 1, 'Cl-(aq)': 1 }).K, 1.77e-10, 0.05);
chk(L, 'ΔH de disolución del NaCl = +3.88 kJ/mol (CRC)', rx_({ 'NaCl(s)': -1, 'Na+(aq)': 1, 'Cl-(aq)': 1 }).H, 3.88, 0.02);
chk(L, 'grafito → diamante: ΔH = +1.895 kJ/mol', rx_({ 'C(gr)': -1, 'C(diam)': 1 }).H, 1.895, 1e-9);
chk(L, 'N₂O₄ → 2NO₂: ΔH = +57.2 kJ/mol', rx_({ 'N2O4(g)': -1, 'NO2(g)': 2 }).H, 57.2, 2e-3);
chk(L, 'Born–Haber del NaCl: U = −787 kJ/mol (Atkins)', FQ.born('Na', 'Cl').U, -787, 2e-3);
chk(L, 'Born–Mayer del NaCl: U ≈ −755 kJ/mol (frente a −787 experimental, −4 %)', FQ.born('Na', 'Cl').UBM, -755, 0.01);
chk(L, 'ley de Kirchhoff, reacción de gas de agua a 1000 K: ΔH ≈ −34.8 kJ/mol', FQ.dH({ CO: -1, H2O: -1, CO2: 1, H2: 1 }, 1000) / 1e3, -34.8, 0.02);
chk(L, 'gas de agua: K = 1 hacia 1100 K (valor de la literatura)', FQ.bisect((t) => FQ.dG({ CO: -1, H2O: -1, CO2: 1, H2: 1 }, t), 300, 3000), 1100, 0.02);
chk(L, 'ΔH = ΔU + Δn RT del ácido benzoico: Δ_cH = Δ_cU − 1.24 kJ/mol', (-3226 - 0.5 * 8.314462618 * 298.15 / 1e3) - (-3226 - 1.24), 0, 1e-2, false);
chk(L, 'Atkins, 5.º ejemplo: energía por gramo de glucosa ≈ 15.6 kJ/g', -rx_({ 'glucosa(s)': -1, 'O2(g)': -6, 'CO2(g)': 6, 'H2O(l)': 6 }).H / 180.156, 15.6, 3e-3);

/* ---- Cap. 4: tercera ley, Gibbs, Ellingham ---- */
for (const [k, v] of Object.entries(ref.debye)) { const [T, th] = k.split(',').map(Number); chk(S, `Debye: S(${T} K, θ = ${th} K) (scipy.quad)`, FQ.debyeS(T, th), v[0], 1e-6); chk(S, `Debye: C_V(${T} K, θ = ${th} K) (scipy.quad)`, FQ.debyeCv(T, th), v[1], 1e-6); }
chk(L, 'Debye: C_V(T ≪ θ) = (12π⁴/5)R(T/θ)³ a T = 3 K, θ = 343 K', FQ.debyeCv(3, 343), (12 * Math.PI ** 4 / 5) * FQ.R * Math.pow(3 / 343, 3), 1e-3);
chk(L, 'Debye: límite de Dulong–Petit C_V(T = 10θ) = 3R', FQ.debyeCv(3430, 343), 3 * FQ.R, 1e-3);
chk(L, 'entropía residual del hielo (Pauling): R ln(3/2) = 3.37 J/mol·K (medido 3.41 ± 0.2)', FQ.R * Math.log(1.5), 3.41, 0.02);
chk(L, 'entropía residual del CO: R ln 2 = 5.76 J/mol·K', FQ.R * Math.log(2), 5.763, 1e-3);
chk(L, 'Gibbs–Helmholtz: d(ΔG/T)/dT = −ΔH/T² (derivada numérica, gas de agua a 1200 K)', (() => { const nu = { CO: -1, H2O: -1, CO2: 1, H2: 1 }, f = (T) => FQ.dG(nu, T) / T, d = 0.01; return (f(1200 + d) - f(1200 - d)) / (2 * d); })(), -FQ.dH({ CO: -1, H2O: -1, CO2: 1, H2: 1 }, 1200) / 1200 ** 2, 1e-6);
chk(L, 'Ellingham 2Mg + O₂ → 2MgO a 700 K: −1203.2 + 0.2118 T kJ (Gaskell)', FQ.ellG('Mg', 700), -1203.2 + 0.2118 * 700, 0.015);
chk(L, 'Ellingham 4/3 Al + O₂ → 2/3 Al₂O₃ a 800 K: −1117.7 + 0.2095 T kJ (Gaskell)', FQ.ellG('Al', 800), -1117.7 + 0.2095 * 800, 0.015);
chk(L, 'Ellingham Si + O₂ → SiO₂ a 1000 K: −907.1 + 0.1757 T kJ (Gaskell)', FQ.ellG('Si', 1000), -907.1 + 0.1757 * 1000, 0.015);
chk(L, 'Ellingham 2C + O₂ → 2CO a 1000 K: −223.4 − 0.1753 T kJ (Kubaschewski)', FQ.ellG('CO', 1000), -223.4 - 0.1753 * 1000, 0.015);
chk(L, 'Ellingham C + O₂ → CO₂ a 1000 K: −394.1 − 0.0008 T kJ', FQ.ellG('CO2', 1000), -394.1 - 0.8e-3 * 1000, 0.01);
chk(L, 'Ellingham 2CO + O₂ → 2CO₂ a 1000 K: −564.8 + 0.1738 T kJ (con polinomios NASA)', FQ.ellG('CO_CO2', 1000), -564.8 + 0.1738 * 1000, 0.015);
chk(L, 'ZnO + C: temperatura de reducción ≈ 1200 K (metalurgia del zinc)', FQ.bisect((t) => FQ.ellG('Zn', t) - FQ.ellG('CO', t), 400, 3000), 1200, 0.03);
chk(L, 'SiO₂ + 2C: temperatura de reducción ≈ 1900 K (arco eléctrico)', FQ.bisect((t) => FQ.ellG('Si', t) - FQ.ellG('CO', t), 400, 3000), 1900, 0.03);
chk(L, 'FeO + C: temperatura de reducción ≈ 1000 K (alto horno)', FQ.bisect((t) => FQ.ellG('Fe', t) - FQ.ellG('CO', t), 400, 3000), 1000, 0.03);
chk(L, 'Boudouard C + CO₂ → 2CO: ΔH = +172.5 kJ, T de inversión ≈ 982 K', 172450 / (2 * 197.66 - 213.79 - 5.74), 981, 0.01);
chk(L, 'electrólisis del agua: ΔG° = +474.3 kJ ⇒ E° = 1.229 V', (2 * 237.13e3) / (4 * 96485.33212), 1.229, 1e-3);

/* ---- Cap. 5: equilibrio ---- */
for (const [k, [nu, v]] of Object.entries(ref.lnK)) { const [n, T] = k.split(','); chk(K, `ln K de ${n} a ${T} K a partir de la energía de Gibbs estándar (Cantera)`, FQ.lnK(nu, +T), v, 2e-7); }
for (const [k, v] of Object.entries(ref.haber_real)) { const [T, P] = k.split(',').map(Number); chk(T_, `síntesis de NH₃ a ${T} K y ${(P / 1e5).toFixed(0)} bar: fracción molar de equilibrio con Peng–Robinson (thermo + scipy.brentq)`, FQ.haber(T, P, true).y[2], v, 2e-4); }
for (const [T, P, v] of [[673.15, 100, 25.12], [673.15, 300, 47.0], [723.15, 10, 2.04], [723.15, 100, 16.35], [723.15, 300, 35.5], [773.15, 100, 10.6], [773.15, 300, 26.4]]) chk(L, `Larson y Dodge (1923): % NH₃ a ${(T - 273.15).toFixed(0)} °C y ${P} atm (modelo de Peng–Robinson)`, 100 * FQ.haber(T, P * 101325, true).y[2], v, 0.08);
chk(L, 'N₂O₄ ⇌ 2NO₂ a 298 K: K = 0.148 (NIST, Atkins)', Math.exp(-(2 * 51.31 - 97.89) * 1e3 / (FQ.R * 298.15)), 0.148, 0.02);
chk(L, 'N₂O₄ a 298 K y 1 bar: grado de disociación ≈ 0.19', (() => { const t = FQ.tt, dG = 2 * t['NO2(g)'].G - t['N2O4(g)'].G; const K0 = Math.exp(-dG * 1e3 / (FQ.R * 298.15)); return Math.sqrt(K0 / (K0 + 4)); })(), 0.19, 0.03);
chk(L, 'gas de agua: K(700 K) = 9.4 (JANAF)', Math.exp(FQ.lnK({ CO: -1, H2O: -1, CO2: 1, H2: 1 }, 700)), 9.4, 0.03);
chk(L, 'calcinación del CaCO₃: p_CO₂(1000 K) ≈ 0.10 bar (tablas con ΔH, ΔS constantes)', Math.exp(-(179190 - 1000 * 160.19) / (FQ.R * 1000)), 0.10, 0.05);
chk(L, 'NO en el aire a 2500 K y 1 bar: 2.2 % (equilibrio)', 100 * FQ.equil(['N2', 'O2', 'NO'], { N2: 0.79, O2: 0.21 }, 2500, 1e5).x.NO, 2.2, 0.03);
chk(L, 'ecuación de van’t Hoff: K(700 K) desde K(500 K) con ΔH constante = 8.1', 137 * Math.exp(-(-41200 / FQ.R) * (1 / 700 - 1 / 500)), 8.1, 0.02);

/* ---- Cap. 6: equilibrio iónico ---- */
for (const [name, [pk, z0, C, S_, v]] of Object.entries(ref.pH)) chk(S, `pH del balance de carga: ${name} (scipy.brentq)`, FQ.pHsolve([{ C, pKa: pk, z0 }], S_), v, 1e-9);
for (const [name, [[pk, z0, S0, sign, Ca, Ct], pts]] of Object.entries(ref.titr)) for (const [v, ph] of pts) chk(S, `valoración ${name}: pH a ${v} mL (scipy.brentq)`, FQ.titration({ pKa: pk, z0 }, Ca, 25, Ct, sign, v, S0), ph, 1e-9);
for (const [k, v] of Object.entries(ref.co2sys)) { const [TA, f] = k.split(',').map(Number), r = FQ.seawater(f, TA); chk(K === 'Cantera' ? 'PyCO2SYS' : 'PyCO2SYS', `agua de mar TA = ${TA}, fCO₂ = ${f}: pH total`, r.pH, v[0], 1e-6); chk('PyCO2SYS', `agua de mar TA = ${TA}, fCO₂ = ${f}: DIC (µmol/kg)`, r.dic, v[1], 1e-5); chk('PyCO2SYS', `agua de mar TA = ${TA}, fCO₂ = ${f}: [CO₃²⁻] (µmol/kg)`, r.co3, v[2], 1e-5); chk('PyCO2SYS', `agua de mar TA = ${TA}, fCO₂ = ${f}: Ω de la calcita`, r.omega, v[3], 5e-4); chk('PyCO2SYS', `agua de mar TA = ${TA}, fCO₂ = ${f}: factor de Revelle`, FQ.revelle(f, TA), v[4], 2e-3); }
chk(L, 'pH de la lluvia en equilibrio con 420 ppm de CO₂ ≈ 5.6', FQ.rainPH(420), 5.6, 0.015);
chk(L, 'ácido acético 0.1 M: pH = 2.88 (CRC)', FQ.pHsolve([{ C: 0.1, pKa: [4.76], z0: 0 }], 0), 2.88, 2e-3);
chk(L, 'NaHCO₃: pH = ½(pK₁ + pK₂) = 8.34', FQ.pHsolve([{ C: 0.1, pKa: [6.35, 10.33], z0: 0 }], 0.1), 8.34, 1e-3);
chk(L, 'glicina: punto isoeléctrico = ½(2.35 + 9.78) = 6.07', FQ.bisect((x) => FQ.meanCharge(FQ.ACIDS.glicina, x), 0, 14), 6.065, 1e-3);
chk(L, 'tampón acético/acetato 1:1: pH = pK_a = 4.76', FQ.hh(4.76, 1), 4.76, 1e-12);
chk(L, 'K_w a 25 °C a partir de la tabla NBS: pK_w = 14.00', Math.log10(FQ.rxn({ 'H+(aq)': -1, 'OH-(aq)': -1, 'H2O(l)': 1 }).K), 14.0, 0.01, false);
chk(L, 'K_ps del Mg(OH)₂ desde la tabla NBS ≈ 5.6×10⁻¹² (CRC)', FQ.rxn({ 'Mg(OH)2(s)': -1, 'Mg2+(aq)': 1, 'OH-(aq)': 2 }).K, 5.61e-12, 0.1);
chk(L, 'K_ps del BaSO₄ desde la tabla NBS ≈ 1.1×10⁻¹⁰ (CRC)', FQ.rxn({ 'BaSO4(s)': -1, 'Ba2+(aq)': 1, 'SO4_2-(aq)': 1 }).K, 1.08e-10, 0.15);
chk(L, 'solubilidad del AgCl en agua pura (sin complejos) = √K_ps = 1.33×10⁻⁵ M', Math.sqrt(FQ.KSP.AgCl), 1.33e-5, 2e-3);
chk(L, 'solubilidad del Mg(OH)₂ a pH 10: 5.6×10⁻⁴ M', FQ.mgOH2Sol(10), 5.61e-4, 1e-3);

/* ---- Cap. 7: fases ---- */
for (const [k, v] of Object.entries(ref.clap)) { const T = +k, s_ = TH.agua.sat(T); chk(C, `Clapeyron del agua a ${T} K: ΔH/(TΔV) de las tablas frente a dP/dT de CoolProp (Pa/K)`, s_.hfg / (T * (s_.vg - s_.vf)), v[0], 6e-3); chk(C, `agua a ${T} K: h_fg de las tablas frente a CoolProp`, s_.hfg, v[1], 1e-3); }
for (const [k, v] of Object.entries(ref.psat_co2)) chk(C, `presión de saturación del CO₂ a ${k} K: Peng–Robinson frente a la ecuación de referencia`, FQ.prPsat('CO2', +k), v, 0.012);
chk(L, 'curva de sublimación del agua (IAPWS R14): P(250 K) = 76.0 Pa (Murphy y Koop 2005)', FQ.Psub('H2O', 250), 76.0, 5e-3);
chk(L, 'curva de sublimación del agua en el punto triple = 611.66 Pa', FQ.Psub('H2O', 273.16), 611.657, 2e-3);
chk(L, 'hielo seco: sublima a 1 atm a 194.7 K (Span y Wagner)', FQ.Psub('CO2', 194.7), 101325, 2e-3);
chk(L, 'fusión del agua: T(101.325 kPa) = 273.15 K', FQ.Tmelt('H2O', 101325), 273.15, 1e-4);
chk(L, 'fusión del agua: dT/dP = −0.0075 K/bar (T a 10 MPa = 272.40 K)', FQ.Tmelt('H2O', 1e7), 272.40, 5e-4);
chk(L, 'Clapeyron de la fusión del agua: ΔHT/ΔV = −13.5 MPa/K', 6010 / (273.15 * -1.63e-6) / 1e6, -13.5, 0.01);
chk(L, 'atmósfera estándar: P(1760 m) = 81.9 kPa (Popayán)', FQ.isaP(1760) / 1e3, 81.9, 2e-3);
chk(L, 'atmósfera estándar: P(8849 m) = 31.4 kPa (Everest)', FQ.isaP(8849) / 1e3, 31.4, 5e-3);
chk(L, 'ebullición del agua en Popayán con Clausius–Clapeyron (ΔH = 40.66 kJ/mol): 94.1 °C', 1 / (1 / 373.15 - (FQ.R / 40660) * Math.log(81.9 / 101.325)) - 273.15, 94.12, 2e-3);
chk(L, 'regla de las fases en el punto triple: F = C − P + 2 = 0', 1 - 3 + 2, 0, 1e-12, false);

/* ---- Cap. 8: Raoult, NRTL, destilación, Henry ---- */
for (const [k, v] of Object.entries(ref.antoine)) { const [n, T] = k.split(','); chk(T_, `Antoine ajustada: P* del ${n} a ${T} K (thermo/DIPPR)`, FQ.Pi(n, +T), v, 0.012); }
for (const [x, v] of Object.entries(ref.bubbleT)) chk(T_, `temperatura de burbuja benceno–tolueno a 1 atm, x = ${x} (Raoult con thermo)`, FQ.bubbleT('benceno', 'tolueno', +x, 101325, 'ideal').T, v, 1e-3);
for (const [k, v] of Object.entries(ref.nrtl)) { const [key, T, x1] = k.split(','), [a, b] = key.split('|'), g = FQ.nrtl(a, b, +x1, +T); chk(T_, `NRTL ${a}–${b} a ${T} K, x₁ = ${x1}: γ₁`, g[0], v[0], 1e-9); chk(T_, `NRTL ${a}–${b} a ${T} K, x₁ = ${x1}: γ₂`, g[1], v[1], 1e-9); }
for (const [k, v] of Object.entries(ref.mccabe)) { const [al, zF, q, Rr, xD, xB] = k.split(',').map(Number); chk(S, `McCabe–Thiele (α = ${al}, q = ${q}, R = ${Rr}): número de etapas (paso a paso en Python)`, FQ.mccabe(al, zF, q, Rr, xD, xB).n, v, 1e-12); }
chk(L, 'Fenske: etapas mínimas para α = 2.5, xD = 0.98, xB = 0.02: 8.5', FQ.mccabe(2.5, 0.5, 1, 20, 0.98, 0.02).Nmin, 8.49, 2e-3);
chk(L, 'azeótropo etanol–agua a 1 atm: x ≈ 0.894, 78.15 °C (NRTL de ChemSep: ±3 %)', FQ.azeotropeP('etanol', 'agua', 101325, 'nrtl').x, 0.894, 0.03);
chk(L, 'azeótropo etanol–agua: temperatura 351.3 K', FQ.azeotropeP('etanol', 'agua', 101325, 'nrtl').T, 351.3, 2e-3);
chk(L, 'azeótropo acetona–cloroformo (máximo de ebullición): 64.5 °C', FQ.azeotropeP('acetona', 'cloroformo', 101325, 'nrtl').T - 273.15, 64.5, 5e-3);
chk(L, 'punto de ebullición normal del benceno 80.1 °C', FQ.Ti('benceno', 101325) - 273.15, 80.1, 1e-3);
chk(L, 'punto de ebullición normal del etanol 78.4 °C', FQ.Ti('etanol', 101325) - 273.15, 78.4, 1e-3);
chk(L, 'Henry del O₂ a 25 °C: k_H = 1.3×10⁻³ mol/L·atm (Sander)', 101325 / FQ.henryH('O2', 298.15) * 997 / 18.015, 1.3e-3, 0.03);
chk(L, 'Henry del N₂ a 25 °C: k_H = 6.5×10⁻⁴ mol/L·atm', 101325 / FQ.henryH('N2', 298.15) * 997 / 18.015, 6.5e-4, 0.05);
chk(L, 'Henry del CO₂ a 25 °C: k_H = 3.4×10⁻² mol/L·atm', 101325 / FQ.henryH('CO2', 298.15) * 997 / 18.015, 3.4e-2, 0.05);
chk(L, 'Henry del CO₂: Δ_solH = −20 kJ/mol', FQ.R * require(path.join(__dirname, '../src/core/29-datos.js')).henry.CO2.B / 1e3, -20.4, 0.06);
chk(L, 'oxígeno disuelto en agua a 5 °C: 12.7 mg/L (Benson y Krause, aire seco)', 0.2095 * 101325 / FQ.henryH('O2', 278.15) * 997 / 18.015 * 31.998e3, 12.7, 0.03);

/* ---- Cap. 9: modelos de exceso y separación de fases ---- */
for (const [k, v] of Object.entries(ref.gE)) {
  const [name, a, b, al, x] = k.split(','), A = +a, B = +b, c = +al, x1 = +x;
  const r = name === 'margules' ? FQ.act.margules(A, B, x1) : name === 'vanlaar' ? FQ.act.vanlaar(A, B, x1) : name === 'wilson' ? FQ.act.wilson(A, B, x1) : FQ.act.nrtl(A, B, c, x1);
  chk(S, `${name} (${a}, ${b}) en x₁ = ${x}: ln γ₁ frente a la derivada simbólica ∂(nG^E/RT)/∂n₁ (SymPy)`, r[0], v[0], 1e-9, false);
  chk(S, `${name} (${a}, ${b}) en x₁ = ${x}: ln γ₂ frente a la derivada simbólica ∂(nG^E/RT)/∂n₂ (SymPy)`, r[1], v[1], 1e-9, false);
}
for (const [k, v] of Object.entries(ref.lle)) { const sc = k.includes('0.8') ? 0.8 : 1, r = FQ.lle((x) => FQ.act.vanlaar(3.9216 * sc, 1.1003 * sc, x)); chk(S, `LLE van Laar (${k}): composición de la fase pobre en 1 (scipy.fsolve)`, r.xa, v[0], 1e-6); chk(S, `LLE van Laar (${k}): composición de la fase rica en 1`, r.xb, v[1], 1e-6); }
chk(L, 'LLE de la disolución regular con χ = 2.5: x = 0.1448 (capítulo 1, brentq)', FQ.lle((x) => FQ.act.regular(2.5, x)).xa, 0.144794, 1e-5);
chk(L, 'LLE 1-butanol–agua a 20 °C: x_BuOH(acuosa) = 0.0197 (ajuste a la solubilidad experimental 7.7 % en masa)', FQ.lle((x) => FQ.act.vanlaar(3.9216, 1.1003, x)).xa, 0.0197, 2e-3);
chk(L, 'LLE 1-butanol–agua a 20 °C: x_BuOH(orgánica) = 0.491', FQ.lle((x) => FQ.act.vanlaar(3.9216, 1.1003, x)).xb, 0.491, 2e-3);
chk(L, 'regla de Raoult modificada: azeótropo etanol–agua cumple γ₁P₁* = γ₂P₂* = P', (() => { const z = FQ.azeotropeP('etanol', 'agua', 101325, 'nrtl'), g = FQ.nrtl('etanol', 'agua', z.x, z.T); return (g[0] * FQ.Pi('etanol', z.T)) / (g[1] * FQ.Pi('agua', z.T)); })(), 1, 1e-6);
chk(L, 'γ∞ del etanol en agua a 340 K ≈ 5.8 (literatura 5–6)', FQ.nrtl('etanol', 'agua', 1e-6, 340)[0], 5.75, 0.08);
chk(L, 'regular simétrica: T_c = ω/(2R) ⇒ χ_c = 2', 2.4 * 298 / 2 / 298, 1.2, 1e-12);

/* ---- Cap. 10: propiedades coligativas ---- */
for (const [m, g, ph] of [[0.1, 0.778, 0.9325], [0.5, 0.681, 0.9210], [1, 0.657, 0.9373], [2, 0.668, 0.9833]]) { const r = FQ.pitzerNaCl(m); chk(L, `NaCl a ${m} mol/kg: γ± de Pitzer frente a Robinson y Stokes`, r.gamma, g, 0.006); chk(L, `NaCl a ${m} mol/kg: coeficiente osmótico φ frente a Hamer y Wu`, r.phi, ph, 0.006); }
chk(L, 'constante crioscópica del agua K_f = 1.86 K·kg/mol', FQ.Kf, 1.86, 2e-3);
chk(L, 'constante ebulloscópica del agua K_b = 0.512 K·kg/mol', FQ.Kb, 0.512, 3e-3);
chk(L, 'descenso crioscópico de NaCl 1 mol/kg ≈ 3.37 K (CRC)', 273.15 - FQ.freezeT(FQ.pitzerNaCl(1).aw), 3.37, 0.03);
chk(L, 'presión osmótica del agua de mar (35 g/kg) ≈ 27–28 bar', 10 * FQ.pitzerNaCl((35 / 58.44) / (1 - 0.035)).pi, 27.5, 0.04);
chk(L, 'trabajo mínimo de desalinización (35 g/kg, 50 % de recuperación) ≈ 1.06 kWh/m³ (Elimelech y Phillip 2011)', (() => { const R = FQ.R, MW = 0.018015268, m0 = (35 / 58.44) / 0.965, n = 800; let acc = 0; for (let i = 0; i < n; i++) { const rr = ((i + 0.5) / n) * 0.5; acc += (-R * 298.15 * Math.log(FQ.pitzerNaCl(m0 / (1 - rr)).aw)) / MW; } return (acc / n) * 997 / 3.6e6; })(), 1.06, 0.05);
chk(L, 'van’t Hoff: Π = cRT para 0.10 mol/L a 25 °C = 2.48 bar', 100 * FQ.R * 298.15 / 1e5, 2.48, 2e-3);
chk(L, 'suero fisiológico 0.9 % NaCl: osmolalidad ≈ 286–290 mOsm/kg', (() => { const m = 9 / 58.44; return (2 * m * FQ.pitzerNaCl(m).phi * 1e6) / 991; })(), 288, 0.02);
chk(L, 'crioscopía: masa molar con ΔT = 0.465 K, 2.50 g en 100 g de agua: 100 g/mol', 2.50 / (0.465 / 1.86 * 0.1), 100, 1e-3);
chk(L, 'Gibbs–Duhem osmótico: ln a_w = −2 m M_w φ ⇒ a_w(0.6 m) = 0.980', FQ.pitzerNaCl(0.6).aw, 0.980, 2e-3);

/* ---- Cap. 11: sólido–líquido ---- */
{
  const R_ = FQ.R, xl = (Tm, H, T) => Math.exp(-(H / R_) * (1 / T - 1 / Tm));
  const eu = (A, B) => { let lo = 150, hi = Math.min(A[0], B[0]); for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (xl(A[0], A[1], m) + xl(B[0], B[1], m) > 1) hi = m; else lo = m; } const T = (lo + hi) / 2; return [T, xl(A[0], A[1], T), xl(B[0], B[1], T)]; };
  const D = { 'Bi-Cd': [[544.55, 11300], [594.22, 6190]], 'Pb-Sn': [[600.61, 4770], [505.08, 7030]], 'naf-bif': [[353.35, 18800], [342.4, 18580]] };
  for (const [k, v] of Object.entries(ref.eutectic)) { const r = eu(D[k][0], D[k][1]); chk(S, `eutéctico ideal ${k}: temperatura (scipy.brentq)`, r[0], v[0], 1e-7); chk(S, `eutéctico ideal ${k}: composición del primer componente`, r[1], v[1], 1e-6); }
}
chk(L, 'solubilidad ideal del naftaleno a 25 °C: x = 0.306 (experimental ≈ 0.29 en benceno)', Math.exp(-(18800 / FQ.R) * (1 / 298.15 - 1 / 353.35)), 0.29, 0.07);
chk(L, 'eutéctico real Pb–Sn: 183.3 °C y x_Sn = 0.739 (61.9 % en masa)', 61.9 / 118.71 / (61.9 / 118.71 + 38.1 / 207.2), 0.739, 2e-3);
chk(L, 'agua–NaCl: eutéctico a 23.3 % en masa congela a −21.1 °C (modelo de Pitzer, ±0.5 K)', FQ.freezeT(FQ.pitzerNaCl((233 / 58.44) / 0.767).aw) - 273.15, -21.1, 0.025);
chk(L, 'agua–NaCl: 10 % en masa congela a −6.5 °C (CRC; modelo ±0.4 K)', FQ.freezeT(FQ.pitzerNaCl((100 / 58.44) / 0.9).aw) - 273.15, -6.5, 0.06);
chk(L, 'agua–NaCl: 20 % en masa congela a −16.5 °C (CRC; modelo ±0.7 K)', FQ.freezeT(FQ.pitzerNaCl((200 / 58.44) / 0.8).aw) - 273.15, -16.5, 0.04);
chk(L, 'regla de las fases a presión constante en el eutéctico binario: F = C − P + 1 = 0', 2 - 3 + 1, 0, 1e-12, false);

/* ---- Cap. 12: electrolitos ---- */
chk(L, 'constante de Debye–Hückel A (base 10) a 25 °C = 3A_φ/ln 10 = 0.510 (Bradley y Pitzer)', FQ.Adh(298.15), 0.5101, 3e-3);
chk(L, 'longitud de Debye: 1/κ = 0.304/√I nm (I en mol/L, 25 °C)', FQ.debyeLength(0.1) * 1e9, 0.304 / Math.sqrt(0.1), 4e-3);
chk(L, 'longitud de Debye del agua pura (10⁻⁷ M): 960 nm', FQ.debyeLength(1e-7) * 1e9, 960, 4e-3);
for (const [k, m, g] of [['HCl', 0.1, 0.796], ['HCl', 1, 0.809], ['KCl', 0.1, 0.770], ['KCl', 0.5, 0.649], ['KCl', 1, 0.604], ['NaCl', 0.1, 0.778], ['NaCl', 1, 0.657], ['CaCl2', 0.1, 0.518], ['CaCl2', 0.5, 0.448], ['CaCl2', 1, 0.500], ['Na2SO4', 0.1, 0.445]]) chk(L, `γ± de ${FQ.ELEC[k].n.replace(/(\d)/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[+d])} a ${m} mol/kg: Pitzer frente a Robinson y Stokes`, FQ.pitzer(k, m).gamma, g, 0.025);
chk(L, 'γ± del MgSO₄ 0.1 mol/kg: Pitzer 0.166 frente a 0.150 (par iónico; ±12 %)', FQ.pitzer('MgSO4', 0.1).gamma, 0.150, 0.12);
chk(S, 'Pitzer general (NaCl) coincide con la forma específica del capítulo 10', FQ.pitzer('NaCl', 1.7).gamma, FQ.pitzerNaCl(1.7).gamma, 1e-12);
chk(L, 'Debye–Hückel: ley límite para NaCl 0.001 mol/kg → γ± = 0.963', FQ.dh.limit(1, 0.001, 0.511), 0.963, 1e-3);
chk(L, 'Davies para NaCl 0.1 mol/kg → γ± = 0.78 (experimental 0.778)', FQ.dh.davies(1, 0.1, FQ.Adh(298.15)), 0.778, 8e-3);
{
  const IONS = { 'Li+': [0.60, 1, -475], 'Na+': [0.95, 1, -365], 'K+': [1.33, 1, -295], 'Cs+': [1.69, 1, -250], 'F-': [1.36, -1, -465], 'Cl-': [1.81, -1, -340], 'Br-': [1.95, -1, -315], 'I-': [2.16, -1, -275] };
  let e = 0, n = 0; for (const [k, [r, z, ex]] of Object.entries(IONS)) { const b = (-FQ.NA * z * z * FQ.e * FQ.e) / (8 * Math.PI * FQ.eps0 * (r + (z > 0 ? 0.85 : 0.10)) * 1e-10) * (1 - 1 / FQ.epsW(298.15)) / 1e3; e += Math.abs(b / ex - 1); n++; chk(L, `Born con radio de Latimer, ${k}: ΔG de solvatación frente a Marcus (kJ/mol)`, b, ex, 0.11); }
  chk(L, 'Born con la corrección de Latimer: error medio < 6 %', e / n, 0.05, 0.3);
  const eta = 0.890e-3; const rh = (l) => (FQ.F * FQ.F) / (6 * Math.PI * eta * FQ.NA * l * 1e-4) * 1e10;
  chk(L, 'radio hidrodinámico del Li⁺ = 2.38 Å (Stokes, λ° = 38.7)', rh(38.7), 2.38, 5e-3); chk(L, 'radio hidrodinámico del Na⁺ = 1.84 Å', rh(50.1), 1.84, 5e-3); chk(L, 'radio hidrodinámico del K⁺ = 1.25 Å', rh(73.5), 1.25, 5e-3);
}
{
  const onsager = (l0, c) => l0 - (60.2 + 0.229 * l0) * Math.sqrt(c);
  chk(L, 'KCl 0.01 mol/L: κ de Onsager = 1.4087 mS/cm (estándar IUPAC de conductividad, ±0.5 %)', onsager(149.8, 0.01) * 0.01, 1.4087, 5e-3);
  chk(L, 'NaCl 0.01 mol/L: Λ de Onsager frente a 118.5 S·cm²/mol (Robinson y Stokes)', onsager(126.4, 0.01), 118.5, 1.2e-2);
  chk(L, 'HCl 0.01 mol/L: Λ de Onsager frente a 412.0 S·cm²/mol', onsager(426.1, 0.01), 412.0, 5e-3);
  const hac = (c) => { const Ka = 1.75e-5, al = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / (2 * c); return 390.7 * al; };
  chk(L, 'ácido acético 0.1 mol/L: Λ de Ostwald = 5.2 S·cm²/mol', hac(0.1), 5.2, 0.03);
  chk(L, 'ácido acético 0.01 mol/L: Λ de Ostwald ≈ 16.2 S·cm²/mol', hac(0.01), 16.2, 0.03);
  chk(L, 'Kohlrausch: Λ°(ácido acético) = λ°(H⁺) + λ°(CH₃COO⁻) = 390.7', FQ.LAM['H+'] + FQ.LAM['CH3COO-'], 390.5, 1e-3);
  chk(L, 'número de transporte del H⁺ en HCl: 0.82', FQ.LAM['H+'] / (FQ.LAM['H+'] + FQ.LAM['Cl-']), 0.821, 2e-3);
}

/* ---- Cap. 13: celdas galvánicas ---- */
{
  const Fa = FQ.F, G = (k) => FQ.tt[k].G * 1e3;
  for (const [n, k, z, lit] of [['K', 'K+(aq)', 1, -2.931], ['Na', 'Na+(aq)', 1, -2.714], ['Ba', 'Ba2+(aq)', 2, -2.912], ['Ca', 'Ca2+(aq)', 2, -2.868], ['Mg', 'Mg2+(aq)', 2, -2.372], ['Al', 'Al3+(aq)', 3, -1.662], ['Zn', 'Zn2+(aq)', 2, -0.762], ['Ni', 'Ni2+(aq)', 2, -0.257], ['Pb', 'Pb2+(aq)', 2, -0.126], ['Cu', 'Cu2+(aq)', 2, 0.342], ['Ag', 'Ag+(aq)', 1, 0.800]]) chk(L, `E° de ${n}^z+/${n} desde ΔfG° de la tabla NBS frente a la serie electroquímica de la CRC (V)`, G(k) / (z * Fa), lit, 0.03, false);
  chk(L, 'celda de Daniell: E° = 1.10 V', (G('Cu2+(aq)') - G('Zn2+(aq)')) / (2 * Fa), 1.10, 3e-3);
  chk(L, 'pila H₂–O₂: E° = 1.229 V (ΔG° = −237.13 kJ/mol)', 237130 / (2 * Fa), 1.229, 1e-3);
  chk(L, 'potencial termoneutro H₂–O₂: ΔH/(nF) = 1.481 V (PCS)', 285830 / (2 * Fa), 1.481, 1e-3);
  chk(L, 'eficiencia máxima de la pila H₂–O₂ (PCS): ΔG/ΔH = 83 %', 237.13 / 285.83, 0.83, 3e-3);
  chk(L, 'pendiente de Nernst a 25 °C: 2.303RT/F = 59.16 mV', Math.LN10 * FQ.R * 298.15 / Fa * 1e3, 59.16, 1e-3);
  chk(L, 'pendiente de Nernst a 0 °C: 54.20 mV', Math.LN10 * FQ.R * 273.15 / Fa * 1e3, 54.20, 1e-3);
  chk(L, 'pendiente de Nernst a 60 °C: 66.1 mV', Math.LN10 * FQ.R * 333.15 / Fa * 1e3, 66.10, 1e-3);
  chk(L, 'Nernst: Daniell con [Zn²⁺] = 1, [Cu²⁺] = 10⁻³ mol/L → E = 1.013 V', 1.1017 - FQ.R * 298.15 / (2 * Fa) * Math.log(1e3), 1.013, 1e-3);
  chk(L, 'Pourbaix: 2Cu + H₂O → Cu₂O + 2H⁺ + 2e⁻: E° = 0.471 V', (G('Cu2O(s)') + 237130) / (2 * Fa), 0.471, 3e-3);
  chk(L, 'Pourbaix: Cu²⁺/Cu con a = 10⁻⁶: 0.162 V', G('Cu2+(aq)') / (2 * Fa) + FQ.R * 298.15 / (2 * Fa) * Math.log(1e-6), 0.162, 3e-3);
  chk(L, 'Pourbaix: 3Fe₂O₃ + 2H⁺ + 2e⁻ → 2Fe₃O₄ + H₂O: E° = 0.221 V', -(2 * G('Fe3O4(s)') - 237130 - 3 * G('Fe2O3(s)')) / (2 * Fa), 0.221, 0.04);
  chk(L, 'Pourbaix: Fe³⁺/Fe²⁺ = 0.771 V (datos del Atlas)', (-10540 + 84940) / Fa, 0.771, 2e-3);
  chk(L, 'celda de Daniell: coeficiente de temperatura ΔS°/(nF) = −0.11 mV/K', ((FQ.tt['Zn2+(aq)'].S - FQ.tt['Zn(s)'].S) - (FQ.tt['Cu2+(aq)'].S - FQ.tt['Cu(s)'].S)) / (2 * Fa) * 1e3, -0.109, 5e-3);
  chk(L, 'celda de concentración de Ag (0.001 | 0.1 mol/L): 0.118 V', 0.05916 * Math.log10(100), 0.118, 3e-3);
}

/* ---- Cap. 14: cinética de electrodos ---- */
{
  const base = { E0: 0, Ei: 0.4, Ev: -0.4, D: 1e-5, C: 1e-3, A: 0.07, n: 1, alpha: 0.5, N: 300 };
  for (const v of [0.01, 0.1, 1]) { const pk = FQ.cvPeaks(FQ.cv(Object.assign({}, base, { v, k0: 1e6 }))); chk(L, `voltametría cíclica reversible a ${v} V/s: pico catódico frente a Randles–Ševčík`, -pk.ipc, FQ.randlesSevcik(1, 0.07, 1e-3, 1e-5, v), 0.01); chk(L, `voltametría cíclica reversible a ${v} V/s: ΔE_p = 57 mV`, (pk.Epa - pk.Epc) * 1e3, 57.0, 0.02); }
  const f = FQ.F / (FQ.R * 298.15) * 0.1;
  for (const [psi, dEp] of [[20, 61], [5, 65], [1, 84], [0.5, 105], [0.25, 141], [0.1, 212]]) { const k0 = psi * Math.sqrt(Math.PI * 1e-5 * f), pp = FQ.cvPeaks(FQ.cv(Object.assign({}, base, { v: 0.1, k0 }))); chk(L, `Nicholson (1965): ΔE_p para ψ = ${psi} (mV)`, (pp.Epa - pp.Epc) * 1e3, dEp, 5, false); }
  const q = FQ.cv(Object.assign({}, base, { v: 0.1, k0: 1e6, n: 2 })), pk2 = FQ.cvPeaks(q);
  chk(L, 'Randles–Ševčík con n = 2: i_p ∝ n^(3/2)', -pk2.ipc / -FQ.cvPeaks(FQ.cv(Object.assign({}, base, { v: 0.1, k0: 1e6 }))).ipc, Math.pow(2, 1.5), 0.01);
  chk(L, 'voltametría reversible con n = 2: ΔE_p = 57/n = 28.5 mV', (pk2.Epa - pk2.Epc) * 1e3, 28.5, 0.04);
}
chk(L, 'Butler–Volmer: i = 0 en el equilibrio', FQ.bv(1e-3, 0.5, 0.5, 0), 0, 1e-15, false);
chk(L, 'Butler–Volmer: pendiente de Tafel = 118.3 mV/década (α = 0.5, 25 °C)', FQ.tafel(0.5, 298.15) * 1e3, 118.3, 1e-3);
chk(L, 'Butler–Volmer, límite lineal: R_ct = RT/(F i₀)', (() => { const i0 = 1e-3, h = 1e-6; return h / FQ.bv(i0, 0.5, 0.5, h); })(), FQ.R * 298.15 / (FQ.F * 1e-3), 1e-4);
chk(L, 'Butler–Volmer, límite de Tafel: |i| ≈ i₀ e^{αfη} para |η| = 0.3 V', Math.abs(FQ.bv(1e-3, 0.5, 0.5, -0.3)), 1e-3 * Math.exp(0.5 * FQ.F * 0.3 / (FQ.R * 298.15)), 1e-3);
chk(L, 'sobrepotencial del H₂ sobre mercurio para 10 mA/cm²: ≈ 1.2 V (i₀ ≈ 10⁻¹² A/cm²)', FQ.bisect((e) => Math.abs(FQ.bv(5e-13, 0.5, 0.5, -e)) - 1e-2, 0, 3, 1e-10), 1.2, 0.05);
{
  const q = { i0a: 1e-5, Ea: -0.44, ba: 0.04, i0c: 1e-6, Ec: 0, bc: 0.12, iL: 0 }, e = FQ.evans(q);
  chk(L, 'Evans: la corriente anódica iguala a la catódica en E_corr', e.ia(e.Ecorr) / e.ic(e.Ecorr), 1, 1e-9);
  const h = 1e-4, num = h * 2 / ((e.ia(e.Ecorr + h) - e.ic(e.Ecorr + h)) - (e.ia(e.Ecorr - h) - e.ic(e.Ecorr - h)));
  chk(L, 'Stern–Geary: R_p = b_a b_c/(2.303 i_corr (b_a + b_c)) frente a dE/di numérica', e.Rp, num, 2e-3);
  chk(L, 'ley de Faraday: 1 µA/cm² de hierro = 0.0116 mm/año', 1e-6 * 55.85 / (2 * FQ.F * 7.87) * 3.156e7 * 10, 0.0116, 4e-3);
}
{
  const g = FQ.gc(0.01, 0.1), Cint = FQ.simpson((p) => FQ.gc(0.01, p).C, 0, 0.1, 200);
  chk(S, 'Gouy–Chapman: σ = ∫ C_d dψ₀ (ecuación de Grahame, integración de Simpson)', g.sigma, Cint, 1e-6);
  chk(L, 'Gouy–Chapman: longitud de Debye de 0.01 mol/L = 3.04 nm', 1e9 / g.kappa, 3.04, 3e-3);
  chk(L, 'Gouy–Chapman: capacidad en el punto de carga cero (0.01 mol/L) = 22.8 µF/cm²', FQ.gc(0.01, 0).C * 100, 22.8, 5e-3);
  chk(L, 'Gouy–Chapman: ψ(0) = ψ₀', FQ.gc(0.01, 0.1).psi(0), 0.1, 1e-9);
  chk(L, 'Gouy–Chapman: para ψ₀ pequeño ψ ≈ ψ₀e^{−κx} (límite de Debye–Hückel)', FQ.gc(0.01, 0.002).psi(3e-9) / (0.002 * Math.exp(-3e-9 * FQ.gc(0.01, 0.002).kappa)), 1, 2e-3);
}

/* ---- Cap. 15: baterías, electrólisis ---- */
{
  const Fa = FQ.F, G = (k) => FQ.tt[k].G * 1e3, Q = (M, n = 1) => (n * Fa) / (3.6 * M);
  const dGpb = 2 * G('PbSO4(s)') + 2 * -237130 - G('PbO2(s)') - 2 * G('SO4_2-(aq)');
  chk(L, 'plomo–ácido: E° = 2.04 V (celda: 2.05 V)', -dGpb / (2 * Fa), 2.04, 4e-3);
  chk(L, 'plomo–ácido: energía específica teórica ≈ 167–170 Wh/kg', (-dGpb / 3.6e3) / 0.6426, 168, 0.02);
  chk(L, 'pila alcalina Zn–MnO₂: E° = 1.41 V (termodinámico)', -(G('ZnO(s)') + G('Mn2O3(s)') - 2 * G('MnO2(s)')) / (2 * Fa), 1.41, 5e-3);
  chk(L, 'capacidad del litio metálico: 3860 mAh/g', Q(6.94), 3860, 1e-3);
  chk(L, 'capacidad del grafito (LiC₆): 372 mAh/g', Q(72.066), 372, 1e-3);
  chk(L, 'capacidad del LiFePO₄: 170 mAh/g', Q(157.76), 170, 1e-3);
  chk(L, 'capacidad del LiCoO₂ con 0.5 Li: 137 mAh/g', 0.5 * Q(97.87), 137, 1e-3);
  chk(L, 'capacidad del silicio (Li₁₅Si₄): 3579 mAh/g', 3.75 * Q(28.086), 3579, 1e-3);
  chk(L, 'capacidad del azufre (Li₂S): 1675 mAh/g', 2 * Q(32.06), 1675, 3e-3);
  chk(L, 'Li–O₂ (Li₂O₂, 2.96 V): energía específica teórica ≈ 3500 Wh/kg', (2 * Fa * 2.96) / 3.6 / 45.88, 3500, 0.02);
  chk(L, 'celda de combustible/electrólisis: dE/dT = −ΔS/(2F) = −0.846 mV/K (H₂O líquida)', -(FQ.tt['H2(g)'].S + 0.5 * FQ.tt['O2(g)'].S - FQ.tt['H2O(l)'].S) / (2 * Fa) * 1e3, -0.846, 2e-3);
  chk(L, 'energía mínima de electrólisis: 32.7 kWh/kg (1.229 V)', (2 * Fa * 1.229) / 3.6e6 / 0.002016, 32.7, 2e-3);
  chk(L, 'poder calorífico superior del H₂: 39.4 kWh/kg (141.8 MJ/kg)', (2 * Fa * 1.4812) / 3.6e6 / 0.002016, 39.4, 3e-3);
  chk(L, 'litio–ion: la capacidad conjunta de LCO y grafito es 100 mAh/g', 1 / (1 / 137 + 1 / 372), 100, 0.005);
  const w3 = 3, xb = FQ.bisect((y) => Math.log(y / (1 - y)) + w3 * (1 - 2 * y), 1e-9, 0.5 - 1e-9, 1e-14);
  chk(L, 'intercalación con Ω = 3RT: composición del borde de la meseta = 0.0707 (cf. capítulo 1, χ = 3)', xb, 0.07072, 1e-3);
  chk(L, 'intercalación con Ω = 3RT: potencial de la meseta = E° (simetría)', 3.4 - (FQ.R * 298 * Math.log(0.5 / 0.5) + 0) / Fa, 3.4, 1e-12);
}

/* ---- Cap. 16: leyes de velocidad ---- */
{
  const Kn = FQ.kin, kr = ref.kin;
  [0.5, 1.5, 4, 9].forEach((t, j) => { const b = Kn.bateman(1, 1.0, 0.4, t); chk(S, `A → B → C (Bateman) a t = ${t}: [A], [B], [C] frente a solve_ivp`, b.B, kr.bateman[1][j], 1e-8); chk(S, `A → B → C a t = ${t}: [A] (analítica frente a solve_ivp)`, b.A, kr.bateman[0][j], 1e-8); });
  [0.1, 0.4, 1, 3].forEach((t, j) => chk(S, `A ⇌ B (k_f = 2, k_b = 0.5) a t = ${t}: [A] frente a solve_ivp`, Kn.reversible(1, 0, 2, 0.5, t), kr.rev[0][j], 1e-8));
  [0.5, 3, 10, 40].forEach((t, j) => chk(S, `A + B → P (segundo orden, A₀ ≠ B₀) a t = ${t}: [A] frente a solve_ivp`, Kn.abExact(0.02, 0.05, 0.8, t), kr.ab[0][j], 1e-8));
  [0.5, 2, 8].forEach((t, j) => chk(S, `2A → P (v = k[A]²) a t = ${t}: [A] frente a solve_ivp`, Kn.second(1.5, 0.3, t), kr.second[0][j], 1e-8));
  const o1 = FQ.ode((t, y) => [-1.0 * y[0], 1.0 * y[0] - 0.4 * y[1], 0.4 * y[1]], [1, 0, 0], [0, 0.5, 1.5, 4, 9], { rtol: 1e-10, atol: 1e-13 });
  [1, 2, 3, 4].forEach((j) => chk(S, `integrador Dormand–Prince del curso, A → B → C, punto ${j}: [B] frente a solve_ivp`, o1.y[j][1], kr.bateman[1][j - 1], 1e-8));
  const f = (t, y) => [-1000 * y[0] + 3000 - 2000 * Math.exp(-t), -y[1] + 1000 * y[0]];
  const st = FQ.odeStiff(f, [0, 0], [0, 0.01, 0.1, 1, 5], { rtol: 1e-8, atol: 1e-12 });
  [1, 2, 3, 4].forEach((j) => { chk(S, `integrador rígido (Rosenbrock 2(3)), sistema con k = 1000, punto ${j}: y₂ frente a LSODA`, st.y[j][1], kr.stiff[1][j - 1], 2e-4); });
  chk(L, 'vida media del N₂O₅ (k = 3.38×10⁻⁵ s⁻¹): 5.7 h (Atkins)', Kn.half(1, 1, 3.38e-5) / 3600, 5.7, 5e-3);
  chk(L, 'carbono-14: fracción a tres vidas medias = 1/8', Kn.first(1, Math.LN2 / 5730, 3 * 5730), 0.125, 1e-12);
  chk(L, 'vida media de primer orden: ln 2/k', Kn.half(1, 3, 0.2), Math.LN2 / 0.2, 1e-12);
  chk(L, 'vida media de orden 0: [A]₀/(2k)', Kn.half(0, 2, 0.5), 2, 1e-12);
  chk(L, 'vida media de segundo orden: 1/(k[A]₀)', Kn.half(2, 0.5, 4), 0.5, 1e-12);
  chk(L, 'máximo del intermedio: t_max = ln(k₁/k₂)/(k₁ − k₂)', Kn.tmaxB(0.5, 0.1), 4.0236, 1e-4);
  chk(L, 'máximo del intermedio: [B]máx = (k₁/k₂)^(k₂/(k₂−k₁))  (forma cerrada)', Kn.bateman(1, 1, 0.4, Kn.tmaxB(1, 0.4)).B, Math.pow(1 / 0.4, 0.4 / (0.4 - 1)), 1e-10);
  chk(L, 'pseudo primer orden con exceso 50: error del 0.4 % en t½', 100 * Math.abs(Kn.abExact(0.01, 0.5, 0.5, Math.LN2 / (0.5 * 0.5)) / 0.01 - 0.5) / 0.5, 0.39, 0.05);
  chk(L, 'balance detallado: K = k_f/k_b y A_eq/B_eq = k_b/k_f', Kn.reversible(1, 0, 2, 0.5, 1e6) / (1 - Kn.reversible(1, 0, 2, 0.5, 1e6)), 0.25, 1e-9);
  chk(L, 'tiempo de relajación: el 63 % de la distancia al equilibrio en 1/(k_f + k_b)', (Kn.reversible(1, 0, 2, 0.5, 0) - Kn.reversible(1, 0, 2, 0.5, 0.4)) / (Kn.reversible(1, 0, 2, 0.5, 0) - 0.2), 1 - Math.exp(-1), 1e-9);
}

/* ---- Cap. 17: Arrhenius, colisiones, Eyring ---- */
{
  const DAT_ = require(path.join(__dirname, '../src/core/29-datos.js')), kmod = (r, T) => r.A * Math.pow(T, r.b) * Math.exp(-r.Ea / (FQ.R * T));
  for (const [eq, row] of Object.entries(ref.gri_k)) { const r = DAT_.gri.find((x) => x.eq === eq); for (const [T, v] of Object.entries(row)) chk(K, `GRI-Mech: k de ${eq.replace('<=>', '⇌')} a ${T} K (cm³/mol·s)`, kmod(r, +T), v, 1e-7); }
  for (const [k, [num, ana]] of Object.entries(ref.coll)) { chk(S, `teoría de colisiones (${k.replace(',', ' K, E₀ = ')} kJ/mol): ∫σ(E)vf(E)dE (scipy.quad) frente a σ c̄ N_A e^{−E₀/RT}`, ana, num, 1e-7); }
  chk(L, 'Arrhenius: 50 kJ/mol, 25 → 37 °C: factor 2.18', Math.exp((50000 / FQ.R) * (1 / 298.15 - 1 / 310.15)), 2.18, 2e-3);
  chk(L, 'Arrhenius: E_a a partir de dos temperaturas (k₂/k₁ = 4 entre 300 y 310 K): 107 kJ/mol', FQ.kin.eaFromTwo(2e-3, 300, 8e-3, 310) / 1e3, 107.2, 2e-3);
  chk(L, 'regla de duplicar cada 10 K: E₀ = 53 kJ/mol a 300 K', Math.exp((53000 / FQ.R) * (1 / 300 - 1 / 310)), 2.0, 0.03);
  chk(L, 'N₂O₅: k(25 °C) con A = 4.94×10¹³ s⁻¹ y E_a = 103.4 kJ/mol ≈ 3.4×10⁻⁵ s⁻¹ (±15 %)', FQ.kin.arrhenius(4.94e13, 103.4e3, 298.15), 3.4e-5, 0.15);
  const k = (dH, dS, T) => (FQ.kB * T / FQ.hPlanck) * Math.exp(dS / FQ.R) * Math.exp(-dH * 1e3 / (FQ.R * T));
  chk(L, 'k_BT/h a 298.15 K = 6.21×10¹² s⁻¹', FQ.kB * 298.15 / FQ.hPlanck, 6.21e12, 1e-3);
  chk(L, 'Eyring: ΔG‡ = 100 kJ/mol → t½ = 10.2 h a 298 K', Math.LN2 / k(100, 0, 298.15) / 3600, 10.2, 5e-3);
  chk(L, 'Eyring: cada 5.71 kJ/mol de ΔG‡ cambia k por un factor 10', k(80, 0, 298.15) / k(80 + FQ.R * 298.15 * Math.LN10 / 1e3, 0, 298.15), 10, 1e-9);
  chk(L, 'Eyring: E_a = ΔH‡ + RT (derivada numérica de ln k)', (() => { const T = 300, d = 0.01; return FQ.R * T * T * (Math.log(k(80, -40, T + d)) - Math.log(k(80, -40, T - d))) / (2 * d); })(), 80000 + FQ.R * 300, 1e-6);
  chk(L, 'Eyring: A = e (k_BT/h) e^{ΔS‡/R}', (() => { const T = 300, Ea = 80000 + FQ.R * T; return k(80, -40, T) * Math.exp(Ea / (FQ.R * T)); })(), Math.E * (FQ.kB * 300 / FQ.hPlanck) * Math.exp(-40 / FQ.R), 1e-9);
  chk(L, 'H + O₂: factor estérico P ≈ 0.44 a 1000 K con σ = 0.21 nm²', (() => { const ho = DAT_.gri.find((x) => x.eq === 'H + O2 <=> O + OH'), mu = (1.00794 * 31.998) / (1.00794 + 31.998) * 1.66054e-27, c = Math.sqrt(8 * FQ.kB * 1000 / (Math.PI * mu)); return kmod(ho, 1000) / (0.21e-18 * c * FQ.NA * 1e6 * Math.exp(-71.3e3 / (FQ.R * 1000))); })(), 0.44, 0.03);
  chk(L, 'NCO + NO: energía de activación aparente negativa a 500 K (E₀ + bRT = −3.2 kJ/mol)', (() => { const r = DAT_.gri.find((x) => x.eq === 'NCO + NO <=> CO + N2O'); return (r.Ea + r.b * FQ.R * 500) / 1e3; })(), -3.2, 0.02);
}

/* ---- Cap. 18: mecanismos (H₂/O₂ de Li et al. 2004, caída de presión, estado estacionario) ---- */
{
  const DAT_ = require(path.join(__dirname, '../src/core/29-datos.js')), Kn = FQ.kin, m = Kn.mechBuild(DAT_.h2o2);
  for (const [nm, c] of Object.entries(ref.h2o2)) {
    const r = Kn.mechRun(m, c.T, c.P, c.X, [0, ...c.times], 1e-8);
    c.times.forEach((t, i) => {
      for (const s of ['H2', 'O2', 'H2O']) chk(K, `H₂/O₂ caso ${nm} (${c.T} K, ${(c.P / 101325).toFixed(2)} atm), t = ${t} s: fracción molar de ${sub(s)} (integrador propio frente a IdealGasReactor)`, r.X[i + 1][s], c.rows[i][s], 2e-2);
      for (const s of ['H', 'OH']) if (c.rows[i][s] > 1e-6) chk(K, `H₂/O₂ caso ${nm}, t = ${t} s: fracción molar del radical ${s}`, r.X[i + 1][s], c.rows[i][s], 5e-2);
    });
  }
  for (const [k, v] of Object.entries(ref.h2o2_crit)) { const [n, T] = k.split(','), X = { air: { H2: 2, O2: 1, N2: 3.76 }, ar: { H2: 2, O2: 1, AR: 7 }, rich: { H2: 4, O2: 1, N2: 3.76 } }[n]; chk(K, `segundo límite de explosión (2k₁ = k₅[M], mezcla ${n}) a ${T} K: P (atm)`, Kn.critP(m, +T, X), v, 1e-6); }
  const jfo = m.rx.findIndex((q) => q.r.t === 'fo');
  for (const [k, v] of Object.entries(ref.h2o2_fo)) { const [T, Pa] = k.split(',').map(Number), C = new Array(m.ns).fill(0); C[m.idx.N2] = (Pa * 101325) / (8314.462618 * T); chk(K, `caída de presión (Troe) 2 OH (+M) ⇌ H₂O₂: k a ${T} K y ${Pa} atm en N₂`, m.kf(T, C, jfo), v, 1e-6); }
  { /* Lindemann y estado estacionario: fórmulas cerradas frente a integración exacta */
    const k1 = 1, km1 = 1000, k2 = 1, tt = [0, 3], ex = FQ.odeStiff((t, y) => [-k1 * y[0] * y[1] + km1 * y[2], -k1 * y[0] * y[1] + km1 * y[2], k1 * y[0] * y[1] - (km1 + k2) * y[2], k2 * y[2]], [1, 1, 0, 0], tt, { rtol: 1e-10, atol: 1e-14 });
    const g = FQ.ode((t, y) => { const kk = (k1 * k2) / (km1 + k2); return [-kk * y[0] * y[1], -kk * y[0] * y[1], kk * y[0] * y[1]]; }, [1, 1, 0], tt, { rtol: 1e-10 });
    chk(S, 'estado estacionario (k₋₁ = 1000, k₂ = 1): [P](3) del mecanismo A + B ⇌ I → P frente al modelo reducido (error < 1 %)', g.y[1][2], ex.y[1][3], 1e-2);
    { const kl = (k1_, km1_, k2_, M) => (k1_ * k2_ * M) / (km1_ * M + k2_), a1 = 2e-10, a2 = 5e-11, a3 = 2e6;
      chk(L, 'Lindemann: k_uni → k∞ = k₁k₂/k₋₁ a [M] muy grande', kl(a1, a2, a3, 1e30), (a1 * a3) / a2, 1e-6);
      chk(L, 'Lindemann: k_uni → k₁[M] a [M] muy pequeño', kl(a1, a2, a3, 1e8), a1 * 1e8, 1e-6);
      chk(L, 'Lindemann: k_uni = k∞/2 en [M]₁/₂ = k₂/k₋₁', kl(a1, a2, a3, a3 / a2), (a1 * a3) / a2 / 2, 1e-12); }
    chk(L, 'Lindemann: [M]₁/₂ = k₂/k₋₁ = 4×10¹⁶ cm⁻³ a 500 K es 2.07 torr', (4e22 * FQ.kB * 500) / 133.322, 2.07, 2e-3);
    chk(L, 'pre-equilibrio con E₁ − E₋₁ + E₂ = −20 kJ/mol: k(400 K)/k(300 K) = 0.135', Math.exp(-(-20000 / FQ.R) * (1 / 400 - 1 / 300)), 0.135, 3e-3);
    chk(L, 'cadena: tiempo para multiplicar por 10⁶ con φ = 5 s⁻¹ es 2.76 s', Math.log(1e6) / 5, 2.76, 2e-3);
  }
}

/* ---- Cap. 19: catálisis y enzimas ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-cat.js'));
  const Ct = FQ.cat;
  for (const [x, v] of Object.entries(ref.lambertw)) chk(S, `función W de Lambert: W(${x}) (scipy.special.lambertw)`, Ct.lambertW(+x), v, 1e-10);
  for (const [k, [ts, ss]] of Object.entries(ref.mm_prog)) { const [S0, Km, Vm] = k.split(',').map(Number); ts.forEach((t, i) => chk(S, `Michaelis–Menten: [S](t) con W de Lambert frente a solve_ivp (Radau, rtol 1e-12), [S]₀ = ${S0}, K_M = ${Km}, t = ${t.toFixed(1)}`, Ct.mmS(t, S0, Km, Vm), ss[i], 1e-9, false)); }
  for (const [k, [ts, ys]] of Object.entries(ref.mm_full)) {
    const [E0, S0, k1, km1, kc] = k.split(',').map(Number), sol = FQ.odeStiff(Ct.mmRHS(k1, km1, kc), [S0, E0, 0, 0], [0, ...ts], { rtol: 1e-10, atol: 1e-13 });
    [1, 3, 5].forEach((i) => { chk(S, `E + S ⇌ ES → E + P completo: [S] + [ES] en t = ${ts[i - 1]} s ([E]₀ = ${E0}, [S]₀ = ${S0}, k_cat = ${kc})`, sol.y[i][0] + sol.y[i][2], ys[i - 1][0] + ys[i - 1][2], 1e-7, false); chk(S, `E + S ⇌ ES → E + P completo: [P] en t = ${ts[i - 1]} s ([E]₀ = ${E0})`, sol.y[i][3], ys[i - 1][3], 1e-7, false); });
  }
  for (const [k, v] of Object.entries(ref.haldane)) { const [k1, km1, k2, km2] = k.split(',').map(Number), Vf = k2, Vr = km1, Kms = (km1 + k2) / k1, Kmp = (km1 + k2) / km2; chk(S, `relación de Haldane K_eq = V_f K_M,P/(V_r K_M,S) frente a la integración hasta el equilibrio (k₁ = ${k1}, k₋₁ = ${km1}, k₂ = ${k2}, k₋₂ = ${km2})`, (Vf * Kmp) / (Vr * Kms), v, 1e-6); }
  for (const [k, v] of Object.entries(ref.inhib)) { const [S_, I, Km, Ki, Kip] = k.split(',').map(Number); chk(S, `inhibición mixta (SymPy): v con [S] = ${S_}, [I] = ${I}, K_i = ${Ki}, K_i′ = ${Kip}`, Ct.inhib(S_, I, 100, Km, Ki, Kip), v, 1e-10); }
  for (const [k, v] of Object.entries(ref.mwc)) { const [x, KR, c, L] = k.split(',').map(Number); chk(S, `MWC (enumeración de las 2⁴ configuraciones): Y con [L] = ${x}, K_R = ${KR}, c = ${c}, L = ${L}`, Ct.mwc(x, 4, KR, c, L), v, 1e-12); }
  for (const [k, v] of Object.entries(ref.volcan)) {
    const [T, Et, G0, a] = k.split(',').map(Number), o = { T, Etot: Et, G0, alpha: a, p: 1 };
    for (const [E, t] of Object.entries(v.tof)) chk(S, `volcán de Sabatier: TOF (T = ${T} K, −ΔE = ${Et}, α = ${a}) a E = ${E} kJ/mol (estado estacionario de la matriz de tasas, numpy)`, Ct.volcano(+E, o).tof, t, 1e-8);
    let lo = 0.2 * Et + 0.04 * T, hi = Et + 200; const g = (e) => -Math.log(Ct.volcano(e, o).tof); for (let i = 0; i < 80; i++) { const m1 = lo + 0.382 * (hi - lo), m2 = lo + 0.618 * (hi - lo); if (g(m1) < g(m2)) hi = m2; else lo = m1; }
    chk(S, `volcán de Sabatier: TOF máxima (T = ${T} K, −ΔE = ${Et}, α = ${a}) en el óptimo de scipy.optimize.minimize_scalar (E = ${v.opt.toFixed(1)} kJ/mol) frente al propio`, Ct.volcano(v.opt, o).tof, Ct.volcano(0.5 * (lo + hi), o).tof, 1e-6);
  }
  { const o = { T: 500, Etot: 100, G0: 60, alpha: 0.5, p: 1 }; let best = [0, 0]; for (let e = 0; e <= 300; e += 0.5) { const q = Ct.volcano(e, o).tof; if (q > best[1]) best = [e, q]; }
    chk(L, 'principio de Sabatier: ΔG₁ = ΔG₂ ⇒ E* = (−ΔE)/2 + T·S_g = 115 kJ/mol, el óptimo del barrido numérico lo reproduce', best[0], 115, 1, false);
    const a = Ct.volcano(30, o), b = Ct.volcano(250, o); chk(L, 'volcán: TOF cae al alejarse del óptimo por ambos lados (más de tres órdenes de magnitud)', Math.min(Math.log10(best[1] / a.tof), Math.log10(best[1] / b.tof)) >= 3 ? 1 : 0, 1, 0, false); }
  chk(L, 'catálisis: ΔΔG‡ = 10 kJ/mol acelera por 57 a 298.15 K', Math.exp(10000 / (FQ.R * 298.15)), 57, 0.01);
  chk(L, 'catálisis: ΔΔG‡ = 30 kJ/mol acelera por 1.8×10⁵ a 298.15 K', Math.exp(30000 / (FQ.R * 298.15)), 1.8e5, 0.03);
  chk(L, 'catálisis: una aceleración de 10¹⁷ corresponde a ΔΔG‡ = 97 kJ/mol a 298.15 K', (FQ.R * 298.15 * Math.log(1e17)) / 1e3, 97, 5e-3);
  chk(L, 'Cheng–Prusoff: CI₅₀ competitiva = K_i(1 + [S]/K_M) = 4 µM (K_i = 2, [S] = K_M)', Ct.ic50(50, 50, 2, Infinity), 4, 1e-12);
  chk(L, 'Cheng–Prusoff: CI₅₀ competitiva a [S] = 10 K_M = 22 µM', Ct.ic50(500, 50, 2, Infinity), 22, 1e-12);
  chk(L, 'inhibición competitiva: K_i = 2 µM, [I] = 10 µM, [S] = K_M: v/v₀ = 2/7', Ct.inhib(50, 10, 1, 50, 2, Infinity) / Ct.inhib(50, 0, 1, 50, 2, Infinity), 2 / 7, 1e-12);
  chk(L, 'Hill (n = 2.7, P₅₀ = 26 Torr): Y(100) = 0.974', Ct.hill(100, 26, 2.7), 0.974, 1e-3);
  chk(L, 'Hill (n = 2.7, P₅₀ = 26 Torr): Y(40) = 0.762', Ct.hill(40, 26, 2.7), 0.762, 1e-3);
  chk(L, 'Hill: hipérbola n = 1 con P₅₀ = 26 entrega 18.7 % entre 100 y 40 Torr', 100 * (Ct.hill(100, 26, 1) - Ct.hill(40, 26, 1)), 18.7, 5e-3);
  { const Y = (x) => Ct.mwc(x, 4, 0.8, 0.0063, 8e5), p50 = Ct.half(Y, 1e-3, 1e5); chk(L, 'MWC de la hemoglobina (parámetros ilustrativos): P₅₀ ≈ 25.6 Torr', p50, 25.6, 0.01); chk(L, 'MWC de la hemoglobina: coeficiente de Hill n_H ≈ 2.87 en el punto medio', Ct.hillSlope(Y, p50), 2.87, 0.01); }
  chk(L, 'MWC con c = 1: sin cooperatividad, n_H = 1', Ct.hillSlope((x) => Ct.mwc(x, 4, 0.8, 1, 8e5), Ct.half((x) => Ct.mwc(x, 4, 0.8, 1, 8e5), 1e-3, 1e5)), 1, 1e-6);
  chk(L, 'ecuación de Michaelis–Menten: K_M = (k₋₁ + k_cat)/k₁ = 50 µM y k_cat/K_M ≤ k₁', Ct.mmKm(1, 40, 10), 50, 1e-12);
}

/* ---- Cap. 20: oscilaciones, biestabilidad y patrones ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-osc.js'));
  const Os = FQ.osc, per = (ts, xs) => { const p = []; for (let i = 1; i < xs.length - 1; i++) if (xs[i] > xs[i - 1] && xs[i] >= xs[i + 1]) { const a = xs[i - 1], b = xs[i], c = xs[i + 1], d = a - 2 * b + c; p.push(ts[i] + (d !== 0 ? (0.5 * (a - c)) / d : 0) * (ts[i + 1] - ts[i])); } const q = p.slice(-6); return (q[q.length - 1] - q[0]) / (q.length - 1); };
  for (const [k, v] of Object.entries(ref.brus)) {
    const [A, B] = k.split(',').map(Number), j = Os.brusJac(A, B);
    chk(S, `Brusselator (A = ${A}, B = ${B}): parte real de los valores propios del Jacobiano en el punto fijo (numpy.linalg.eigvals)`, j.re, v.ev[0], 1e-12, false);
    chk(S, `Brusselator (A = ${A}, B = ${B}): parte imaginaria de los valores propios`, j.im, v.ev[1], 1e-12, false);
    if (v.period) {
      const N = 4000, ts = Array.from({ length: N + 1 }, (_, i) => (400 / A) * i / N), r = FQ.odeStiff(Os.brusRHS(A, B), [A * 1.05 + 0.05, (B / A) * 0.95], ts, { rtol: 1e-10, atol: 1e-12 }), n0 = N / 2, xs = r.y.slice(n0).map((y) => y[0]);
      chk(S, `Brusselator (A = ${A}, B = ${B}): período del ciclo límite frente a solve_ivp (Radau, rtol 1e-11)`, per(ts.slice(n0), xs), v.period, 3e-3);
      chk(S, `Brusselator (A = ${A}, B = ${B}): amplitud de X en el ciclo límite`, Math.max(...xs) - Math.min(...xs), v.amp, 3e-3);
    }
  }
  chk(L, 'Brusselator: bifurcación de Hopf en B_c = 1 + A²; traza del Jacobiano nula allí', Os.brusJac(1.7, Os.brusHopf(1.7)).tr, 0, 1e-12, false);
  chk(L, 'Brusselator cerca del umbral: período ≈ 2π/A (B = 1 + A² + 0.01, A = 1)', (() => { const A = 1, B = 2.01, N = 8000, ts = Array.from({ length: N + 1 }, (_, i) => 800 * i / N), r = FQ.odeStiff(Os.brusRHS(A, B), [1.05, 2.0], ts, { rtol: 1e-10, atol: 1e-12 }); return per(ts.slice(N / 2), r.y.slice(N / 2).map((y) => y[0])); })(), 2 * Math.PI, 0.01);
  for (const [k, v] of Object.entries(ref.bdisp)) {
    const [A, B, Dx, Dy] = k.split(',').map(Number); v.ks.forEach((q, i) => { if (i % 5 === 0) chk(S, `relación de dispersión del Brusselator con difusión (A = ${A}, B = ${B}, D_Y/D_X = ${Dy / Dx}): Re λ(k = ${q.toFixed(1)})`, Os.brusDisp(A, B, Dx, Dy, q), v.lam[i], 1e-10, false); });
    let km = 0, lm = -1e9; for (let q = 0; q <= 3; q += 0.0001) { const l = Os.brusDisp(A, B, Dx, Dy, q); if (l > lm) { lm = l; km = q; } }
    chk(S, `Brusselator con difusión (A = ${A}, B = ${B}, D_Y/D_X = ${Dy / Dx}): k del modo más inestable`, km, v.kmax, 2e-3, false);
  }
  for (const [k, v] of Object.entries(ref.bturing)) { const [A, Dx, Dy] = k.split(',').map(Number); chk(S, `umbral de Turing (1 + A√(D_X/D_Y))² con A = ${A}, D_Y/D_X = ${Dy / Dx} frente al barrido numérico de numpy`, Os.brusTuring(A, Dx, Dy).B, v, 2e-3, false); }
  chk(L, 'Turing: k_c² = A/√(D_X D_Y) coincide con el máximo de Re λ(k) en el umbral (A = 2, D_Y = 8)', (() => { const A = 2, Dy = 8, tu = Os.brusTuring(A, 1, Dy); let km = 0, lm = -1e9; for (let q = 0.2; q <= 2; q += 0.0005) { const l = Os.brusDisp(A, tu.B, 1, Dy, q); if (l > lm) { lm = l; km = q; } } return km; })(), Os.brusTuring(2, 1, 8).kc, 1e-3);
  for (const [k, [n, amp]] of Object.entries(ref.rd1d)) {
    const [A, B, Dx, Dy] = k.split(',').map(Number), r = Os.brus1D(A, B, Dx, Dy, 60, 200, 400, 11, 100), x = r.frames[r.frames.length - 1], m = x.reduce((a, b) => a + b, 0) / 200; let c = 0; for (let i = 0; i < 200; i++) if (x[i] > x[(i + 199) % 200] && x[i] >= x[(i + 1) % 200] && x[i] > m) c++;
    chk(S, `Brusselator 1D (A = ${A}, B = ${B}, D_Y = ${Dy}): número de máximos del patrón en L = 60 (LSODA)`, c, n, 0, false);
    chk(S, `Brusselator 1D (A = ${A}, B = ${B}, D_Y = ${Dy}): amplitud pico a pico del patrón estacionario`, Math.max(...x) - Math.min(...x), amp, 4e-2);
    chk(L, `Brusselator 1D (D_Y = ${Dy}): longitud de onda medida coincide con 2π/k_c (±10 %)`, 60 / c, (2 * Math.PI) / Os.brusTuring(A, Dx, Dy).kc, 0.1);
  }
  for (const [k, v] of Object.entries(ref.oreg)) {
    const f = +k, ts = Array.from({ length: 6001 }, (_, i) => (60 * i) / 6000), r = FQ.odeStiff(Os.oregRHS(f, 0.04, 4e-4, 8e-4), [0.01, 0.002, 0.05], ts, { rtol: 1e-8, atol: 1e-13 }), z = r.y.slice(2000).map((y) => y[2]), zmax = Math.max(...z), zmin = Math.min(...z), osc = zmax / zmin > 1.5 && zmax - zmin > 0.02;
    chk(S, `Oregonator (f = ${k}): ¿hay oscilaciones sostenidas?`, osc ? 1 : 0, v.osc ? 1 : 0, 0, false);
    if (v.osc) { chk(S, `Oregonator (f = ${k}): período del ciclo frente a solve_ivp (Radau)`, per(ts.slice(2000), z), v.period, 1e-2); chk(S, `Oregonator (f = ${k}): máximo de [Ce⁴⁺] adimensional`, zmax, v.zmax, 1e-2); }
  }
  for (const [k, v] of Object.entries(ref.lotka)) {
    const [k1a, x0, y0] = k.split(',').map(Number), T0 = (2 * Math.PI) / Math.sqrt(k1a), N = 14000, ts = Array.from({ length: N + 1 }, (_, i) => (14 * T0 * i) / N), r = FQ.ode(Os.lotkaRHS(k1a, 1, 1), [x0, y0], ts, { rtol: 1e-11, atol: 1e-13 }), xs = r.y.map((y) => y[0]);
    chk(S, `Lotka químico (k₁[A] = ${k1a}, x₀ = ${x0}, y₀ = ${y0}): período frente a solve_ivp (DOP853)`, per(ts, xs), v.period, 1e-3);
    const V0 = Os.lotkaInv(k1a, 1, 1, x0, y0); let dv = 0; for (let i = 0; i <= N; i += 100) dv = Math.max(dv, Math.abs(Os.lotkaInv(k1a, 1, 1, r.y[i][0], r.y[i][1]) - V0)); chk(L, `Lotka químico (x₀ = ${x0}): la cantidad V se conserva (variación relativa < 1e-6)`, dv / Math.abs(V0), 0, 1e-6, false);
  }
  chk(L, 'Lotka químico: período de oscilaciones pequeñas = 2π/√(k₁[A]k₃)', (() => { const k1a = 1.5, T0 = (2 * Math.PI) / Math.sqrt(k1a), N = 8000, ts = Array.from({ length: N + 1 }, (_, i) => (6 * T0 * i) / N), r = FQ.ode(Os.lotkaRHS(k1a, 1, 1), [1.001, 1.5], ts, { rtol: 1e-12, atol: 1e-14 }); return per(ts, r.y.map((y) => y[0])); })(), (2 * Math.PI) / Math.sqrt(1.5), 2e-3);
  for (const [b, rr] of Object.entries(ref.schlogl)) { const m = Os.schloglRoots({ k1a: 3, k2: 1, k4: 2, k3b: +b }); chk(S, `Schlögl: número de estados estacionarios con k₃[B] = ${b} (numpy.roots)`, m.length, rr.length, 0, false); rr.forEach((x, i) => chk(S, `Schlögl: raíz ${i + 1} de la cúbica con k₃[B] = ${b}`, m[i], x, 1e-9, false)); }
  chk(L, 'Schlögl: la ventana de biestabilidad termina en k₃[B] = 2/(3√3) = 0.3849 (extremo local de x³ − 3x² + 2x)', (() => { const x = 1 - 1 / Math.sqrt(3); return x * x * x - 3 * x * x + 2 * x; })(), 2 / (3 * Math.sqrt(3)), 1e-12);
  chk(L, 'Schlögl: con k₃[B] ligeramente mayor que 0.3849 queda un solo estado estacionario', Os.schloglRoots({ k1a: 3, k2: 1, k4: 2, k3b: 0.39 }).length, 1, 0, false);
  for (const [k, roots] of Object.entries(ref.gs_steady)) { const [F, kk] = k.split(',').map(Number), st = Os.gsSteady(F, kk); st.forEach((s, i) => { chk(L, `Gray–Scott (F = ${F}, k = ${kk}): residuo de du/dt en el estado homogéneo ${i + 1}`, -s.u * s.v * s.v + F * (1 - s.u), 0, 1e-12, false); chk(L, `Gray–Scott (F = ${F}, k = ${kk}): residuo de dv/dt en el estado homogéneo ${i + 1}`, s.u * s.v * s.v - (F + kk) * s.v, 0, 1e-12, false); }); roots.forEach(([u, v], i) => chk(S, `Gray–Scott (F = ${F}, k = ${kk}): el estado homogéneo de scipy.optimize.fsolve (v = ${v.toFixed(4)}) está entre los analíticos`, Math.min(...st.map((s) => Math.abs(s.v - v))), 0, 1e-8, false)); }
  chk(L, 'Gray–Scott: F ≥ 4(F + k)² es la frontera de existencia de los estados no triviales (k = √F/2 − F)', Os.gsSteady(0.04, Math.sqrt(0.04) / 2 - 0.04 - 1e-9).length, 2, 0, false);
  chk(L, 'Gray–Scott: sin estados no triviales por encima de la frontera de existencia', Os.gsSteady(0.04, Math.sqrt(0.04) / 2 - 0.04 + 0.002).length, 0, 0, false);
  { const g = ref.gs_grid, gs = new Os.GrayScott(g.N, g.F, g.k); gs.u.set(g.u0); gs.v.set(g.v0); gs.step(300); let eu = 0, ev = 0; for (let i = 0; i < g.N * g.N; i++) { eu = Math.max(eu, Math.abs(gs.u[i] - g.u[i])); ev = Math.max(ev, Math.abs(gs.v[i] - g.v[i])); }
    chk(S, 'Gray–Scott 32×32 periódico, 300 pasos: máxima diferencia en u frente a la implementación de numpy (float32)', eu, 0, 2e-4, false); chk(S, 'Gray–Scott 32×32 periódico, 300 pasos: máxima diferencia en v', ev, 0, 2e-4, false); }
}

/* ---- Cap. 21: disoluciones y fotoquímica ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-fot.js'));
  const F2 = FQ.sol2;
  for (const [k, v] of Object.entries(ref.smol)) { const [T, eta, rA, rB] = k.split(',').map(Number); chk(S, `Smoluchowski: k_D = 4π(D_A + D_B)R N_A con Stokes–Einstein (T = ${T} K, η = ${eta * 1e3} mPa·s) frente al flujo de scipy.integrate.solve_bvp`, F2.kD(T, eta, rA, rB), v, 2e-4); }
  chk(L, 'Smoluchowski: para dos esferas iguales k_D = 8RT/(3η) = 7.43×10⁹ L/(mol·s) en agua a 25 °C', F2.kD8(298.15, 0.890e-3), 7.43e9, 2e-3);
  chk(L, 'Smoluchowski: k_D de esferas desiguales no depende de los radios cuando son iguales (8RT/3η)', F2.kD(298.15, 0.890e-3, 0.3e-9, 0.3e-9), F2.kD8(298.15, 0.890e-3), 1e-9);
  for (const [k, v] of Object.entries(ref.debye_f)) { const [T, er, zz, Rr] = k.split(',').map(Number); chk(S, `Debye–Smoluchowski: factor δ/(e^δ − 1) con z_Az_B = ${zz}, ε_r = ${er}, R = ${Rr * 1e9} nm frente a la cuadratura de ∫e^{U/kT}/r² dr (scipy.integrate.quad)`, F2.debyeFactor(T, er, zz, 1, Rr), v, 1e-5); }
  for (const [k, v] of Object.entries(ref.collins)) { const [kD, kmD, kr] = k.split(',').map(Number), kAct = (kD * kr) / kmD; chk(S, `control mixto: k = k_D k_act/(k_D + k_act) (k_act = k_D k_r/k₋D) frente al valor propio lento del mecanismo A + B ⇌ AB → P (numpy.linalg.eigvals), k_D = ${kD}, k₋D = ${kmD}, k_r = ${kr}`, F2.kMixed(kD, kAct), v, 1e-4); }
  chk(L, 'H⁺ + OH⁻: Smoluchowski con D(H⁺) = 9.31×10⁻⁹, D(OH⁻) = 5.27×10⁻⁹ m²/s, R = 0.5 nm y factor de Debye ≈ 1.0×10¹¹ L/(mol·s) (medido 1.4×10¹¹, dentro del 30 %)', 4 * Math.PI * (9.31e-9 + 5.27e-9) * 0.5e-9 * FQ.NA * 1e3 * F2.debyeFactor(298.15, 78.4, -1, 1, 0.5e-9), 1.4e11, 0.3);
  chk(S, 'constante de Debye–Hückel A = 0.509 a 25 °C (literatura: 0.5091)', FQ.Adh(298.15), 0.5091, 5e-3);
  chk(L, 'efecto salino primario: log(k/k₀) = log γ_A + log γ_B − log γ‡ con γ de Davies de cada ion (z_A = 2, z_B = −1, I = 0.05)', (() => { const A = FQ.Adh(), I = 0.05, f = Math.sqrt(I) / (1 + Math.sqrt(I)) - 0.3 * I, lg = (z) => -A * z * z * f; return lg(2) + lg(-1) - lg(1); })(), F2.saltLog(2, -1, 0.05), 1e-12, false);
  chk(L, 'efecto salino: pendiente limitante 2A z_A z_B ≈ 2.04 para z_Az_B = +2 (agua, 25 °C)', F2.saltLimit(2, 1, 1) / 1, 2 * FQ.Adh() * 2, 1e-12);
  chk(L, 'efecto salino: reacción con un reactivo neutro no cambia con la fuerza iónica', F2.saltLog(0, -1, 0.3), 0, 1e-12, false);
  for (const [k, v] of Object.entries(ref.marcus)) { const [lam, dG] = k.split(',').map(Number); chk(S, `Marcus: barrera (λ + ΔG°)²/4λ con λ = ${lam}, ΔG° = ${dG} kJ/mol frente a la intersección numérica de las parábolas (fsolve)`, F2.marcusBarrier(dG, lam), v, 1e-10, false); }
  chk(L, 'Marcus: velocidad máxima sin activación en −ΔG° = λ', F2.marcusBarrier(-100, 100), 0, 1e-12, false);
  chk(L, 'Marcus: k(ΔG° = 0) = k(ΔG° = −2λ) (simetría de la parábola)', F2.marcusK(-200e3, 100e3, 298.15, 1e11), F2.marcusK(0, 100e3, 298.15, 1e11), 1e-12);
  chk(L, 'Marcus: región invertida, k(−300 kJ/mol) < k(−100 kJ/mol) para λ = 100 kJ/mol', F2.marcusK(-300e3, 100e3, 298.15, 1e11) < F2.marcusK(-100e3, 100e3, 298.15, 1e11) ? 1 : 0, 1, 0, false);
  chk(L, 'Marcus: relación cruzada k₁₂ = (k₁₁k₂₂K₁₂f)^½ con λ₁₂ = (λ₁₁ + λ₂₂)/2 es exacta en la teoría de parábolas', (() => { const RT = FQ.R * 298.15, Z = 1e11, l1 = 80e3, l2 = 40e3, dG = -30e3, k11 = F2.marcusK(0, l1, 298.15, Z), k22 = F2.marcusK(0, l2, 298.15, Z), k12 = F2.marcusK(dG, (l1 + l2) / 2, 298.15, Z); return F2.marcusCross(k11, k22, Math.exp(-dG / RT), Z) / k12; })(), 1, 1e-10);
  for (const [k, v] of Object.entries(ref.sv)) { const [kr, knr, kisc, kq, Q] = k.split(',').map(Number), ph = F2.photo(kr, knr, kisc, kq, Q); chk(S, `Stern–Volmer: F₀/F = 1 + k_qτ₀[Q] frente al estado estacionario de la ODE de S₁ (LSODA), k_q = ${kq}, [Q] = ${Q}`, F2.sternVolmer(kq, ph.tau0, Q), v.F0F, 1e-8); chk(S, `fotofísica: τ = 1/(k_r + k_nr + k_isc + k_q[Q]) frente a la pendiente de ln I(t) de la ODE, k_q = ${kq}`, ph.tau, v.tau, 1e-6); }
  chk(L, 'sulfato de quinina (parámetros del simulador): Φ_F = 0.55 y τ₀ = 19.0 ns', F2.photo(2.9e7, 2e7, 3.6e6, 0, 0).phiF0, 0.55, 5e-3);
  chk(L, 'fluorescencia: Φ_F + Φ_isc + Φ_nr = 1', (() => { const p = F2.photo(2.9e7, 2e7, 3.6e6, 6e9, 0.01); return p.phiF + p.phiIsc + (2e7 * p.tau) + 6e9 * 0.01 * p.tau; })(), 1, 1e-12);
  chk(L, 'JPL: k(NO + O₃) = 3.0×10⁻¹² exp(−1500/T) = 1.95×10⁻¹⁴ cm³/molécula·s a 298 K', 3.0e-12 * Math.exp(-1500 / 298.15), 1.95e-14, 1e-2);
  for (const [k, v] of Object.entries(ref.leighton)) {
    const [J, kp, no2, no] = k.split(',').map(Number), k3 = 1.95e-14 * 2.46e10, ts = [0, 3600], r = FQ.odeStiff(F2.leightonRHS(J, k3, kp), [no2, no, 0], ts, { rtol: 1e-10, atol: 1e-12 }), y = r.y[1];
    ['NO₂', 'NO', 'O₃'].forEach((n, i) => chk(S, `ciclo de Leighton (J = ${J} s⁻¹, k_p = ${kp} s⁻¹): [${n}] a los 60 min frente a solve_ivp (Radau)`, y[i], v.y[i], 1e-6));
    if (v.o3 !== undefined) { chk(S, `estado fotoestacionario (J = ${J} s⁻¹): [O₃] de la raíz de la cuadrática de balance`, y[2], v.o3, 1e-6); chk(L, `relación de Leighton [O₃] = J[NO₂]/(k₃[NO]) en el estado estacionario (J = ${J} s⁻¹)`, F2.leightonO3(J, k3, y[0], y[1]), y[2], 1e-6); }
  }
  chk(L, 'ciclo de Leighton sin peróxidos: [O₃] − [NO] se conserva', (() => { const k3 = 1.95e-14 * 2.46e10, r = FQ.odeStiff(F2.leightonRHS(0.008, k3, 0), [30, 10, 0], [0, 900, 3600], { rtol: 1e-10, atol: 1e-12 }); return r.y[2][2] - r.y[2][1]; })(), -10, 1e-6, false);
}

/* ---- Cap. 22: mecánica cuántica ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-qm.js'));
  const Qm = FQ.qm;
  for (const [n, v] of Object.entries(ref.box)) chk(S, `partícula en una caja, n = ${n}: Δx·Δp/(ħ/2) = √(n²π²/3 − 2) frente a la cuadratura de ψ y ψ′ (scipy.quad)`, Math.sqrt((+n) * (+n) * Math.PI * Math.PI / 3 - 2), v, 1e-9);
  for (const [k, v] of Object.entries(ref.tun_rect)) { const [E, V0, a, m] = k.split(',').map(Number); chk(S, `barrera rectangular (E = ${E}, V₀ = ${V0}, a = ${a}, m = ${m} u.a.): T exacta frente a la integración de la ecuación de Schrödinger (DOP853)`, Qm.tunnelRect(E, V0, a, m), v, 1e-6); }
  for (const [k, v] of Object.entries(ref.tun_parab)) { const [E, V0, w] = k.split(',').map(Number); chk(S, `barrera parabólica (E = ${E}, V₀ = ${V0}, ħω = ${w}): T de Kemble frente a la integración numérica de la ecuación de Schrödinger (dominio truncado)`, Qm.tunnelParab(E, V0, w), v, 1e-2); }
  for (const [u, v] of Object.entries(ref.bell)) chk(S, `corrección de túnel de Bell (u/2)/sin(u/2) con u = ${u} frente a la integral ∫T(E)e^{−E/kT}dE/kT (scipy.quad)`, Qm.bell(+u), v, 1e-8);
  chk(L, 'Wigner: 1 + u²/24 coincide con el desarrollo de Bell hasta u⁴ (u = 0.5)', Qm.wigner(0.5), Qm.bell(0.5), 1e-4);
  for (const [k, v] of Object.entries(ref.ho)) { const [n, y] = k.split(',').map(Number); chk(S, `oscilador armónico: ψ_${n}(${y}) con m = ω = 1 frente a eval_hermite normalizada (scipy.special)`, Qm.hoPsi(n, 1, 1, y), v, 1e-10, false); }
  { const M = ref.morse, w = M.D, a = M.a, mu = M.mu; ref.morse.E.forEach((e, v) => { if (v < 8) chk(S, `Morse (HCl): E_${v} analítica frente a la diagonalización por diferencias finitas (scipy.linalg.eigh_tridiagonal)`, Qm.morseE(v, M.D, a, mu), e, 3e-4); });
    const rs = Array.from({ length: 3001 }, (_, i) => 1 + i * 0.002), p0 = Qm.morsePsi(0, M.D, a, mu, M.re, rs), p3 = Qm.morsePsi(3, M.D, a, mu, M.re, rs); let o = 0, n3 = 0; for (let i = 0; i < 3000; i++) { o += p0[i] * p3[i] * 0.002; n3 += p3[i] * p3[i] * 0.002; }
    chk(L, 'Morse: ψ₀ y ψ₃ ortogonales y normalizadas (∫ψ₀ψ₃ = 0)', o, 0, 1e-8, false); chk(L, 'Morse: ∫ψ₃² = 1', n3, 1, 1e-6); }
  chk(L, 'oscilador armónico: ω_e de Morse = a√(2D/μ) = ω_e espectroscópico del HCl (2990.95 cm⁻¹)', Qm.morseOmega(2990.95**2 / (4 * 52.82) / Qm.HARTREE_CM, ref.morse.a, ref.morse.mu) * Qm.HARTREE_CM, 2990.95, 1e-9);
  chk(L, 'Morse (CO): 0 → 1 = ω_e − 2ω_ex_e = 2143.27 cm⁻¹ (literatura: 2143.27)', (() => { const mu = 6.8562 * Qm.AMU, D = 2169.81**2 / (4 * 13.288) / Qm.HARTREE_CM, a = 2169.81 / Qm.HARTREE_CM * Math.sqrt(mu / (2 * D)); return (Qm.morseE(1, D, a, mu) - Qm.morseE(0, D, a, mu)) * Qm.HARTREE_CM; })(), 2143.27, 1e-4);
  for (const [k, v] of Object.entries(ref.ylm)) { const [l, m, th, ph] = k.split(',').map(Number); chk(S, `armónico esférico real Y_${l}^${m}(θ = ${th}, φ = ${ph}) frente a scipy.special.sph_harm`, Qm.ylmReal(l, m, th, ph), v, 1e-10, false); }
  chk(L, 'armónicos esféricos: ∫|Y_2^1|² dΩ = 1 (cuadratura de Gauss)', (() => { let s = 0; const N = 80; for (let i = 0; i < N; i++) { const th = (Math.PI * (i + 0.5)) / N; for (let j = 0; j < 2 * N; j++) { const ph = (Math.PI * (j + 0.5)) / N; s += Math.pow(Qm.ylmReal(2, 1, th, ph), 2) * Math.sin(th) * (Math.PI / N) * (Math.PI / N); } } return s; })(), 1, 1e-4);
  chk(L, 'rotor: J_máx = √(kT/2B) − ½ ≈ 6.8 para CO a 298 K; el máximo de (2J+1)e^{−BJ(J+1)/kT} está en J = 7', (() => { const B = 1.9313, kT = 0.6950348 * 298; let b = 0, bi = 0; for (let J = 0; J < 40; J++) { const q = Qm.rotPop(J, B, kT); if (q > b) { b = q; bi = J; } } return bi; })(), 7, 0, false);
  chk(L, 'caja: electrón en 1 nm, E₁ = 0.376 eV', Qm.boxE(1, 1 / 0.0529177210903, 1) * Qm.HARTREE_EV, 0.376, 1e-3);
}

/* ---- Cap. 23: átomos ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-atom.js'));
  const At = FQ.atom;
  for (const [k, v] of Object.entries(ref.hydR)) { const [n, l, Z, r] = k.split(',').map(Number); chk(S, `hidrogenoide R_${n}${'spdfg'[l]}(Z = ${Z}, r = ${r}) frente a scipy.special.eval_genlaguerre`, At.hydR(n, l, Z, r), v, 1e-10, false); }
  [0, 1, 2].forEach((l) => ref.hydE[String(l)].forEach((e, i) => chk(S, `hidrógeno: E de la ecuación radial por diferencias finitas (l = ${l}, ${i + l + 1}${'spd'[l]}) frente a −1/(2n²)`, e, At.hydE(i + l + 1, 1), 2e-4)));
  chk(L, 'hidrógeno: ⟨r⟩₂ₚ = 5 bohr = [3n² − l(l + 1)]/2Z', At.hydRmean(2, 1, 1), 5, 1e-12);
  chk(L, 'hidrógeno: normalización ∫R₃ₚ²r²dr = 1', (() => { let s = 0; for (let i = 0; i < 40000; i++) { const r = (i + 0.5) * 0.002; s += Math.pow(At.hydR(3, 1, 1, r), 2) * r * r * 0.002; } return s; })(), 1, 1e-5);
  for (const [z, v] of Object.entries(ref.heJ)) chk(S, `helio: ⟨1/r₁₂⟩ = 5ζ/8 con ζ = ${z} frente a la cuadratura doble con el promedio angular 1/max(r₁, r₂) (scipy.quad)`, (5 * +z) / 8, v, 1e-8);
  for (const [Z, v] of Object.entries(ref.heMin)) chk(S, `helio variacional: E mínima = −(Z − 5/16)² para Z = ${Z} (minimize_scalar)`, At.heEmin(+Z), v, 1e-9);
  chk(L, 'helio variacional: E = −2.8477 Eh frente al valor exacto −2.9037 (error del 1.9 %)', At.heEmin(2), -2.84766, 1e-5);
  chk(L, 'H⁻ con ζ = 11/16: E = −0.4727 > −0.5 (el ion no queda ligado con esta función)', At.heEmin(1) > -0.5 ? 1 : 0, 1, 0, false);
  chk(L, 'helio: energía de ionización variacional 23.1 eV (exacta 24.59 eV)', (-2 + 2.84766) * At.HE_EXACT[2] / At.HE_EXACT[2] * 27.211386, 23.06, 5e-3);
  for (const [Z, zv] of Object.entries({ 3: 1.30, 4: 1.95, 5: 2.60, 6: 3.25, 7: 3.90, 8: 4.55, 9: 5.20, 10: 5.85, 11: 2.20, 17: 6.10 })) chk(L, `reglas de Slater: Z* del electrón de valencia de Z = ${Z}`, At.slaterZ(+Z).Zeff, zv, 1e-9);
  chk(L, 'Slater: IE del litio 5.75 eV (experimento 5.39)', At.slaterIE(3), 5.75, 5e-3);
  for (const [k, v] of Object.entries(ref.terms)) { const [l, n] = k.split(',').map(Number), t = At.terms(l, n), key = (a) => a.map((x) => x.S + 'L' + x.L).sort().join(' '); chk(S, `términos de l = ${l}, n = ${n} electrones: lista de (S, L) frente al recuento de Hund con microestados (itertools)`, key(t) === key(v.map(([S_, L_]) => ({ S: S_, L: L_ }))) ? 1 : 0, 1, 0, false); }
  chk(L, 'términos de p²: ³P, ¹D, ¹S y ³P es el fundamental (reglas de Hund)', (() => { const h = At.hund(At.terms(1, 2)); return h.S * 10 + h.L; })(), 11, 0, false);
  chk(L, 'términos de d⁵: el fundamental es ⁶S', (() => { const h = At.hund(At.terms(2, 5)); return h.S * 10 + h.L; })(), 25, 0, false);
}

/* ---- Cap. 24: enlace químico ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-bond.js'));
  const Bd = FQ.bond;
  for (const [k, v] of Object.entries(ref.h2p)) { const [R, z] = k.split(',').map(Number), h = Bd.h2p(R, z); for (const q of ['S', 'Haa', 'Hab', 'Eg', 'Eu']) chk(S, `H₂⁺ LCAO (R = ${R}, ζ = ${z}): ${q} analítica frente a la cuadratura en coordenadas cilíndricas (scipy.dblquad)`, h[q], v[q], 1e-7, false); }
  { const m = Bd.h2pMin(false), o = Bd.h2pMin(true);
    chk(L, 'H₂⁺ LCAO (ζ = 1): R_e = 2.49 bohr (literatura: 2.49)', m.R, 2.49, 3e-3); chk(L, 'H₂⁺ LCAO (ζ = 1): E = −0.5648 Eh y D_e = 1.76 eV', (-0.5 - m.E) * 27.211386, 1.76, 5e-3);
    chk(L, 'H₂⁺ LCAO con ζ óptimo: R_e = 2.00 bohr, ζ = 1.238 (Finkelstein y Horowitz, 1928)', o.z, 1.238, 1e-3); chk(L, 'H₂⁺ LCAO con ζ óptimo: E = −0.5865 Eh', o.E, -0.5865, 1e-4);
    chk(L, 'H₂⁺: el principio variacional exige E_LCAO ≥ E_exacta = −0.6026 Eh (Bates, Ledsham y Stewart, 1953)', o.E > -0.60263 ? 1 : 0, 1, 0, false); }
  chk(L, 'H₂⁺: límite de R grande, E_g → −0.5 Eh', Bd.h2p(30, 1).Eg, -0.5, 1e-4, false);
  for (const nm of ['butadieno', 'benceno', 'hexatrieno']) { const n = nm === 'butadieno' ? 4 : 6, A_ = nm === 'benceno' ? Bd.ring(6) : Bd.chain(n), h = Bd.huckel(A_, n), v = ref.huckel[nm]; h.x.forEach((x, i) => chk(S, `Hückel ${nm}: x_${i + 1} frente a numpy.linalg.eigh`, x, v.x[i], 1e-10, false)); chk(S, `Hückel ${nm}: E_π/β`, h.Epi, v.Epi, 1e-10); chk(S, `Hückel ${nm}: orden de enlace 1–2`, h.bo(0, 1), v.p12, 1e-10, false); }
  chk(L, 'Hückel: energía de deslocalización del benceno = 2β', Bd.huckel(Bd.ring(6), 6).Epi - 6, 2, 1e-12, false);
  chk(L, 'Hückel: butadieno, energía de deslocalización 0.472β', Bd.huckel(Bd.chain(4), 4).Epi - 4, 0.472, 1e-3, false);
  chk(L, 'Hückel: cadena de n átomos, x_k = 2cos(kπ/(n + 1)) (n = 7, k = 2)', Bd.huckel(Bd.chain(7), 7).x[1], 2 * Math.cos((2 * Math.PI) / 8), 1e-10, false);
  chk(L, 'Hückel: anillo de n átomos, x_k = 2cos(2πk/n); ciclobutadieno es de capa abierta (dos orbitales degenerados no ligantes)', Math.abs(Bd.huckel(Bd.ring(4), 4).x[1]) + Math.abs(Bd.huckel(Bd.ring(4), 4).x[2]), 0, 1e-10, false);
  { const h = Bd.huckel(Bd.naphthalene(), 10), v = ref.naft; chk(S, 'Hückel naftaleno: E_π/β = 13.683', h.Epi, v.Epi, 1e-10); chk(S, 'naftaleno: orden de enlace 1–2 (0.725, Coulson)', h.bo(0, 1), v.p01, 1e-10, false); chk(S, 'naftaleno: orden de enlace 2–3 (0.603)', h.bo(1, 2), v.p12, 1e-10, false); chk(S, 'naftaleno: orden de enlace 5–10, enlace central (0.555)', h.bo(4, 9), v.p49, 1e-10, false); chk(S, 'naftaleno: brecha HOMO–LUMO 1.236|β|', h.x[h.homo] - h.x[h.lumo], v.gap, 1e-10, false); }
  for (const [nm, bo, unp] of [['Li2', 1, 0], ['B2', 1, 2], ['C2', 2, 0], ['N2', 3, 0], ['O2', 2, 2], ['F2', 1, 0]]) { const n = Bd.DIA[nm][0], d = Bd.dia(n, n >= 12); chk(L, `orbitales moleculares de ${nm}: orden de enlace ${bo}`, d.bondOrder, bo, 0, false); chk(L, `${nm}: electrones desapareados (${unp}): ${unp ? 'paramagnética' : 'diamagnética'}`, d.unpaired, unp, 0, false); }
  chk(L, 'O₂⁺: orden de enlace 2.5; O₂⁻: 1.5; Ne₂: 0', Bd.dia(11, true).bondOrder * 100 + Bd.dia(13, true).bondOrder * 10 + Bd.dia(16, true).bondOrder, 250 + 15 + 0, 0, false);
  chk(L, 'el orden de enlace más alto de la serie (N₂, 3) coincide con el D₀ más alto (9.76 eV)', Object.entries(Bd.DIA).sort((a, b) => b[1][2] - a[1][2])[0][0] === 'N2' ? 1 : 0, 1, 0, false);
}

/* ---- Cap. 25: Hartree–Fock ---- */
{
  require(path.join(__dirname, '../src/core/29-basis.js')); require(path.join(__dirname, '../src/core/39-fq-scf.js'));
  const Hs = FQ.scf, g = ref.gint_geo, fn = (R, lmn, a) => ({ R, lmn, prim: [{ a, c: 1 }] });
  const A = g.A, B = g.B, C = g.C, a = g.a, b = g.b, c = g.c, d = g.d, D = A.map((x) => x + 0.2), one = (l1, l2, Z) => Hs.oneE(fn(A, l1, a), fn(B, l2, b), C, 2);
  const T_ = 'Szabo–Ostlund (A)';
  const sfx = [['S_sA_sB', one([0, 0, 0], [0, 0, 0]).S], ['T_sA_sB', one([0, 0, 0], [0, 0, 0]).T], ['V_sA_sB', one([0, 0, 0], [0, 0, 0]).V], ['S_pxA_sB', one([1, 0, 0], [0, 0, 0]).S], ['S_pxA_pyB', one([1, 0, 0], [0, 1, 0]).S], ['T_pyA_sB', one([0, 1, 0], [0, 0, 0]).T], ['V_pzA_sB', one([0, 0, 1], [0, 0, 0]).V], ['V_pxA_pxB', one([1, 0, 0], [1, 0, 0]).V], ['E_ssss', Hs.eri4(fn(A, [0, 0, 0], a), fn(B, [0, 0, 0], b), fn(C, [0, 0, 0], c), fn(D, [0, 0, 0], d))], ['E_pxsss', Hs.eri4(fn(A, [1, 0, 0], a), fn(B, [0, 0, 0], b), fn(C, [0, 0, 0], c), fn(D, [0, 0, 0], d))], ['E_pxs_pxs', Hs.eri4(fn(A, [1, 0, 0], a), fn(B, [0, 0, 0], b), fn(C, [1, 0, 0], c), fn(D, [0, 0, 0], d))]];
  const NAMES = { S: 'solapamiento', T: 'energía cinética', V: 'atracción nuclear', E: 'repulsión electrónica (ERI)' };
  for (const [k, v] of sfx) chk(S, `integral de gaussianas ${NAMES[k[0]]} ${k.slice(2).replace(/_/g, ', ')}: McMurchie–Davidson frente a la fórmula cerrada s (Szabo–Ostlund, A) o su derivada numérica respecto del centro (p)`, v, ref.gint[k], k.includes('p') ? 2e-5 : 1e-12);
  chk(L, 'función de Boys: F₀(1) = (√π/2) erf(1) = 0.746824132812427', Hs.boys(0, 1)[0], 0.746824132812427, 1e-13);
  chk(L, 'función de Boys: F_n(0) = 1/(2n + 1)', Hs.boys(4, 0)[4], 1 / 9, 1e-14);
  chk(L, 'función de Boys: la recurrencia ascendente (x > 35) coincide con la serie en x = 35 (F₃)', Hs.boys(3, 34.999)[3], Hs.boys(3, 35.001)[3] * 1.0000, 1e-3);
  { const r = Hs.scf(Hs.h2(1.4), 'sto-3g');
    chk(L, 'H₂ STO-3G, R = 1.4 bohr: E_total = −1.1167143 Eh (Szabo y Ostlund, tabla 3.?)', r.E, -1.1167143, 1e-7); chk(L, 'H₂ STO-3G: ε₁ = −0.5782 Eh', r.eps[0], -0.5782, 1e-4); chk(L, 'H₂ STO-3G: ε₂ = +0.6703 Eh', r.eps[1], 0.6703, 1e-4); chk(L, 'H₂ STO-3G: carga de Mulliken nula (molécula homonuclear)', r.charge[0], 0, 1e-10, false); }
  { const w = [{ Z: 8, xyz: [0, -0.143225816552, 0] }, { Z: 1, xyz: [1.638036840407, 1.136548822547, 0] }, { Z: 1, xyz: [-1.638036840407, 1.136548822547, 0] }], r = Hs.scf(w, 'sto-3g');
    chk(L, 'H₂O STO-3G (geometría del proyecto 3 de Crawford): repulsión nuclear 8.002367061810450 Eh', r.Enuc, 8.002367061810450, 1e-12); chk(L, 'H₂O STO-3G (Crawford): E_SCF = −74.942079928192 Eh', r.E, -74.942079928192, 1e-7); }
  { const r = Hs.scf(Hs.water(1.809, 104.52), 'sto-3g'); chk(L, 'H₂O STO-3G con la geometría experimental (0.9572 Å, 104.52°): E = −74.9629 Eh', r.E, -74.9629, 1e-5); chk(L, 'H₂O: la suma de las cargas de Mulliken es cero', r.charge[0] + 2 * r.charge[1], 0, 1e-9, false); const r2 = Hs.scf(Hs.water(1.809, 104.52), '6-31g'); chk(L, 'H₂O 6-31G con la geometría experimental: E = −75.9840 Eh', r2.E, -75.9840, 2e-6); chk(L, 'el principio variacional: la base mayor (6-31G) da menor energía que STO-3G', r2.E < r.E ? 1 : 0, 1, 0, false); }
  { const o = Hs.water(1.8697170268, 100.026173), r = Hs.scf(o, 'sto-3g'); chk(L, 'H₂O STO-3G optimizada (Hehre, Stewart y Pople): E = −74.96590 Eh', r.E, -74.96590, 2e-7); chk(L, 'H₂O STO-3G optimizada: r(OH) = 0.9894 Å', 1.8697170268 * Hs.BOHR, 0.9894, 1e-4); chk(L, 'H₂O STO-3G optimizada: ángulo 100.0°', 100.026173, 100.03, 1e-4); chk(L, 'H₂O STO-3G optimizada: momento dipolar 1.709 D', r.muD, 1.709, 2e-3);
    const g = (x, y) => Hs.scf(Hs.water(x, y), 'sto-3g').E; chk(L, 'H₂O STO-3G: la geometría guardada es un mínimo (E mayor en r ± 0.02 bohr y en ± 2°)', Math.min(g(1.8697 + 0.02, 100.03), g(1.8697 - 0.02, 100.03), g(1.8697, 102.03), g(1.8697, 98.03)) > r.E ? 1 : 0, 1, 0, false); }
  { const o = Hs.water(1.7945560730, 111.5443277), r = Hs.scf(o, '6-31g'); chk(L, 'H₂O 6-31G optimizada: E = −75.98536 Eh', r.E, -75.98536, 1e-6); chk(L, 'H₂O 6-31G optimizada: r(OH) = 0.9496 Å y ángulo 111.5°', 1.7945560730 * Hs.BOHR + 111.5443277 / 1000, 0.9496 + 0.1115443, 1e-3); }
  { const r = Hs.scf(Hs.h2(10), 'sto-3g'), u = Hs.uhf(Hs.h2(10), 'sto-3g'), h = Hs.uhf([{ Z: 1, xyz: [0, 0, 0] }], 'sto-3g', { nbeta: 0 });
    chk(L, 'H₂ UHF en R = 10 bohr: E = 2E(H) = −0.93316 Eh (disociación correcta)', u.E, 2 * h.E, 1e-5); chk(L, 'H₂ RHF en R = 10 bohr: E = −0.5960 Eh, más de 0.3 Eh por encima del UHF', r.E - u.E, 0.3372, 2e-2); chk(L, 'H₂ UHF en R grande: ⟨S²⟩ = 1 (singlete y triplete mezclados)', u.S2, 1, 1e-3); chk(L, 'átomo de H STO-3G: E = −0.46658 Eh', h.E, -0.46658, 1e-5); chk(L, 'átomo de H con 6-31G: E = −0.49823 Eh', Hs.uhf([{ Z: 1, xyz: [0, 0, 0] }], '6-31g', { nbeta: 0 }).E, -0.49823, 1e-5); }
}

/* ---- Cap. 26: simetría ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-sym.js'));
  const Sy = FQ.sym, SUB = { H2O: 'C2v', CH2O: 'C2v', NH3: 'C3v', CH4: 'Td', C2H4: 'D2h', BF3: 'D3h', CO2: 'D2h' };
  const LIT = { H2O: '2A1 + B2', CH2O: '3A1 + B1 + 2B2', NH3: '2A1 + 2E', CH4: 'A1 + E + 2T2', BF3: "A1' + 2E' + A2\"", CO2: 'Ag + B1u + B2u + B3u' };
  for (const [k, m] of Object.entries(Sy.MOLS)) {
    const pg = Sy.pointGroup(m.atoms), rf = ref.pg[k], r = Sy.reduce(SUB[k], m.atoms, pg.ops, !!m.linear), N = m.atoms.length, lin = !!m.linear;
    const nm = (x) => (x === 'D∞h' ? 'D*h' : x);
    chk(S, `grupo puntual de ${k}: ${rf[0]} (pymatgen PointGroupAnalyzer)`, nm(pg.name) === rf[0] ? 1 : 0, 1, 0, false);
    if (!lin) chk(S, `número de operaciones de simetría de ${k}: ${rf[1]} (orden del grupo)`, pg.ops.length, rf[1], 0, false);
    chk(L, `${k}: la suma de dimensiones de Γ_vib es 3N − 6 (3N − 5 si es lineal)`, r.vib.reduce((a, v, i) => a + v * r.dims[i], 0), 3 * N - (lin ? 5 : 6), 0, false);
    chk(L, `${k}: multiplicidades enteras no negativas en Γ_vib`, r.vib.every((v) => v >= -1e-9 && Math.abs(v - Math.round(v)) < 1e-9) ? 1 : 0, 1, 0, false);
    if (LIT[k]) chk(L, `Γ_vib de ${k} = ${LIT[k]} (literatura)`, Sy.formula(r.names, r.vib) === LIT[k] ? 1 : 0, 1, 0, false);
  }
  { const r = Sy.reduce('D2h', Sy.MOLS.C2H4.atoms, Sy.pointGroup(Sy.MOLS.C2H4.atoms).ops), ir = r.names.reduce((a, n, i) => a + (r.ir[i] ? r.vib[i] : 0), 0), ra = r.names.reduce((a, n, i) => a + (r.raman[i] ? r.vib[i] : 0), 0), g = r.names.reduce((a, n, i) => a + (/g$/.test(n) ? r.vib[i] : 0), 0);
    chk(L, 'eteno: 12 modos, 5 activos en el IR (literatura) y 6 en Raman', ir * 10 + ra, 56, 0, false); chk(L, 'eteno (centrosimétrico): ningún modo es activo en IR y en Raman a la vez (exclusión mutua)', r.names.reduce((a, n, i) => a + (r.ir[i] && r.raman[i] ? r.vib[i] : 0), 0), 0, 0, false); chk(L, 'eteno: 6 modos g y 6 u', g, 6, 0, false); }
  { const r = Sy.reduce('Td', Sy.MOLS.CH4.atoms, Sy.pointGroup(Sy.MOLS.CH4.atoms).ops); chk(L, 'metano: 2 de las 4 frecuencias distintas (T₂) son activas en el IR; 3 en Raman (A₁, E, T₂)', r.names.reduce((a, n, i) => a + (r.vib[i] > 0 && r.ir[i] ? 1 : 0), 0) * 10 + r.names.reduce((a, n, i) => a + (r.vib[i] > 0 && r.raman[i] ? 1 : 0), 0), 13, 0, false); }
  for (const [g, tab] of Object.entries(Sy.TABLES)) { const sz = tab.size || tab.cls.map(() => 1), h = sz.reduce((a, b) => a + b, 0); let maxe = 0; tab.rows.forEach((a, i) => tab.rows.forEach((b, j) => { let s = 0; a[1].forEach((x, k) => { s += sz[k] * x * b[1][k]; }); maxe = Math.max(maxe, Math.abs(s / h - (i === j ? 1 : 0))); })); chk(L, `tabla de caracteres de ${g}: las filas son ortonormales (orden ${h})`, maxe, 0, 1e-12, false); chk(L, `tabla de caracteres de ${g}: Σ dim² = orden del grupo`, tab.rows.reduce((a, r) => a + r[1][0] ** 2, 0), h, 0, false); }
}

/* ---- Cap. 27: rotación y vibración ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-rv.js'));
  const Rv = FQ.rv, co = Rv.MOL.CO, hcl = Rv.MOL.HCl;
  chk(L, 'CO: origen de la banda fundamental ν₀ = 2143.27 cm⁻¹', Rv.nu0(co), 2143.27, 1e-5);
  chk(L, 'CO: línea R(0) = 2147.081 cm⁻¹ (HITRAN)', Rv.R(co, 0), 2147.081, 1e-5);
  chk(L, 'CO: línea P(1) = 2139.429 cm⁻¹ (HITRAN)', Rv.P(co, 1), 2139.4285, 1e-5);
  chk(L, 'CO: línea R(5) = 2165.60 cm⁻¹ (HITRAN)', Rv.R(co, 5), 2165.60, 2e-6);
  chk(L, 'CO: línea P(5) = 2123.70 cm⁻¹ (HITRAN)', Rv.P(co, 5), 2123.70, 2e-6);
  chk(L, 'HCl (³⁵Cl): ν₀ = 2885.98 cm⁻¹', Rv.nu0(hcl), 2885.98, 3e-5);
  chk(L, 'HCl: R(0) = 2906.25 y P(1) = 2865.10 cm⁻¹', Rv.R(hcl, 0) - Rv.P(hcl, 1), 41.15, 3e-3);
  chk(L, 'HCl: corrimiento isotópico ν₀(H³⁷Cl) − ν₀(H³⁵Cl) ≈ −2.1 cm⁻¹', Rv.nu0(Rv.isotopologue(hcl, 'H', 'Cl37')) - Rv.nu0(hcl), -2.1, 5e-2);
  chk(L, 'HCl: la banda de DCl está en ≈ 2090 cm⁻¹ (ν ∝ μ^−½)', Rv.nu0(Rv.isotopologue(hcl, 'D', 'Cl35')), 2090, 5e-3);
  chk(L, 'diferencias de combinación: R(J − 1) − P(J + 1) = 4B″(J + ½) con De = 0 (J = 3)', (() => { const m = { ...co, De: 0 }; return Rv.combo(m, 3); })(), 4 * (co.Be - co.ae / 2) * 3.5, 1e-12);
  chk(L, 'B₁ < B₀ (αe > 0): la molécula se alarga al excitar la vibración', (co.Be - co.ae * 1.5 < co.Be - co.ae * 0.5) ? 1 : 0, 1, 0, false);
  ref.rv_morse.Bv.slice(0, 2).forEach((b, v) => chk(S, `HCl (Morse): B_${v} del Hamiltoniano con término rotacional (diagonalización, scipy.linalg.eigh_tridiagonal) frente a Bₑ − αe(v + ½) con αe de Pekeris`, hcl.Be - Rv.alphaPekeris(hcl) * (v + 0.5), b, 5e-3));
  chk(L, 'αe de Pekeris para HCl: 0.278 cm⁻¹ (experimental 0.307; Morse subestima un 10 %)', Rv.alphaPekeris(hcl), 0.2777, 2e-3);
  for (const [I, [sym, asym]] of Object.entries(ref.spin)) { chk(S, `espín nuclear I = ${I}: peso (I + 1)(2I + 1) del par simétrico por enumeración del producto`, (+I + 1) * (2 * +I + 1), sym, 0, false); chk(S, `espín nuclear I = ${I}: peso I(2I + 1) del antisimétrico`, +I * (2 * +I + 1), asym, 0, false); }
  chk(L, 'N₂ (¹⁴N, I = 1, bosón): alternancia de intensidades Raman 6 : 3 (J par : impar)', Rv.spinW(1, 0, false) / Rv.spinW(1, 1, false), 2, 0, false);
  chk(L, 'H₂ (I = ½, fermión): ortho : para = 3 : 1 (J impar : par)', Rv.spinW(0.5, 1, true) / Rv.spinW(0.5, 0, true), 3, 0, false);
  chk(L, 'D₂ (I = 1, bosón): ortho : para = 2 : 1 (J par : impar)', Rv.spinW(1, 0, false) / Rv.spinW(1, 1, false), 2, 0, false);
  chk(L, 'Raman rotacional del N₂: S(0) = 6B = 11.94 cm⁻¹ y separación 4B = 7.96 cm⁻¹', Rv.ramanS(1.98957, 0, 0), 11.937, 1e-3);
  chk(L, 'efecto isotópico cinético máximo C–H/C–D a 298 K ≈ 6.4 (energía de punto cero; el valor «clásico» ≈ 7)', Rv.zpeKIE(2900, 2900 * Math.sqrt(Rv.redMass('H', 'C12') / Rv.redMass('D', 'C12')), 298.15), 6.42, 5e-3);
  chk(L, 'cociente de masas reducidas √(μ_CH/μ_CD) = 0.734', Math.sqrt(Rv.redMass('H', 'C12') / Rv.redMass('D', 'C12')), 0.7343, 5e-4);
  chk(L, 'distancia internuclear del CO: r₀ = √(h/8π²cμB₀) = 1.131 Å con B₀ = 1.9225 cm⁻¹ (el r_e es 1.128 Å)', Math.sqrt(16.8576 / (Rv.redMass('C12', 'O16') * (co.Be - co.ae / 2))), 1.1309, 1e-4);
}

/* ---- Cap. 28: espectroscopía electrónica y RMN ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-esp.js'));
  const Es = FQ.esp;
  for (const [S_, vals] of Object.entries(ref.fc)) vals.forEach((v, k) => chk(S, `Franck–Condon de osciladores desplazados (S = ${S_}): |⟨0|${k}′⟩|² = e^{−S}S^v/v! frente a la integral numérica de las funciones de Hermite (scipy.quad)`, Es.fc(+S_, k), v, 1e-10, false));
  chk(L, 'Franck–Condon: Σ_v e^{−S}S^v/v! = 1 (completitud)', Array.from({ length: 40 }, (_, v) => Es.fc(2.5, v)).reduce((a, b) => a + b, 0), 1, 1e-12);
  chk(L, 'Franck–Condon: la media del número de cuantos excitados ⟨v⟩ = S', Array.from({ length: 60 }, (_, v) => v * Es.fc(3.2, v)).reduce((a, b) => a + b, 0), 3.2, 1e-10);
  for (const [k, v] of Object.entries(ref.ab)) { const [a, b, J] = k.split(',').map(Number), l = Es.ab(a, b, J), tot = l.reduce((s_, q) => s_ + q.I, 0), totR = v.reduce((s_, q) => s_ + q[1], 0); l.forEach((q, i) => { chk(S, `sistema AB (ν_A = ${a}, ν_B = ${b}, J = ${J}): frecuencia de la línea ${i + 1} frente a numpy (matrices de Pauli y Kronecker)`, q.f, v[i][0], 1e-9); chk(S, `sistema AB (J = ${J}, Δν = ${a - b}): intensidad relativa de la línea ${i + 1}`, q.I / tot, v[i][1] / totR, 1e-9, false); }); const an = Es.abAnalytic(a, b, J), at = an.reduce((s_, q) => s_ + q.I, 0); an.forEach((q, i) => chk(L, `AB: fórmulas de Pople (D = √(Δν² + J²); 1 ∓ J/D) frente a la diagonalización, línea ${i + 1} (Δν = ${a - b}, J = ${J})`, q.I / at, l[i].I / tot, 1e-9, false)); }
  chk(S, 'frecuencia de Larmor del ¹H: γ/2π = 42.57748 MHz/T (CODATA)', Es.larmor(5.5856946893, 1) / 1e6, ref.nmr.gamma_p, 1e-6);
  chk(L, '¹³C: 10.708 MHz/T', Es.larmor(1.4048236, 1) / 1e6, 10.7084, 2e-4);
  chk(L, 'RMN de ¹H a 9.39 T = 400 MHz', Es.larmor(5.5856946893, 9.3947) / 1e6, 400, 1e-5);
  chk(S, 'exceso de población ΔN/N = hν/2kT a 400 MHz y 298 K (3.2×10⁻⁵)', Es.boltzDiff(400e6, 298.15), ref.nmr.dN, 1e-9);
  for (const [n, row] of Object.entries(ref.nmr.pascal)) chk(S, `multiplete de ${+n + 1} líneas: coeficientes binomiales (n = ${n} vecinos) frente a scipy.special.comb`, Es.pascal(+n).join(',') === row.join(',') ? 1 : 0, 1, 0, false);
  for (const [N, g] of Object.entries(ref.hk_chain)) chk(S, `Hückel, cadena de ${N} átomos: brecha HOMO–LUMO = 2·2cos(Nπ/2(N+1)) (numpy)`, (() => { const B_ = FQ.bond, h = B_.huckel(B_.chain(+N), +N); return h.x[h.homo] - h.x[h.lumo]; })(), g, 1e-10, false);
  chk(L, 'Beer–Lambert: NADH, ε₃₄₀ = 6220 M⁻¹cm⁻¹, 50 µM y 1 cm → A = 0.311', Es.absorbance(6220, 50e-6, 1), 0.311, 1e-3);
  chk(L, 'Beer–Lambert: con 0.2 % de luz parásita, una muestra de A = 3 se mide como A = 2.52 (saturación)', -Math.log10(Es.transmit(3, 0.002)), 2.5237, 1e-3);
  chk(L, 'Beer–Lambert: A = 1 transmite el 10 %', Es.transmit(1, 0), 0.1, 1e-12);
}

/* ---- Cap. 29: mecánica estadística ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-stat.js'));
  const St = FQ.stat, tabl = ref.nasa;
  for (const sp of ['N2', 'O2', 'CO', 'H2O', 'CO2', 'CH4', 'NH3']) for (const T of [300, 600, 1000, 1500]) { const t = St.thermo(St.MOL[sp], T), r = tabl[`${sp},${T}`]; chk(K, `${sp} a ${T} K: S° (1 bar) del rotor rígido y oscilador armónico frente a Cantera (NASA-7), diferencia < 1 %`, t.S, r[1], 0.01); chk(K, `${sp} a ${T} K: C_p del RRHO frente a Cantera, diferencia < 6 % (anarmonicidad)`, t.Cp, r[2], 0.06); }
  for (const sp of ['N2', 'O2', 'CO', 'H2O', 'CO2', 'CH4', 'NH3']) { const t = St.thermo(St.MOL[sp], 300), r = tabl[`${sp},300`]; chk(K, `${sp} a 300 K: S° con exactitud de 0.3 J/mol·K (RRHO frente a Cantera)`, t.S, r[1], 0.3, false); }
  for (const [k, S0] of [['HE', 126.15], ['AR', 154.84]]) chk(L, `Sackur–Tetrode: S°(${k}, 298.15 K, 1 bar) = ${S0} J/mol·K (NIST-JANAF)`, St.thermo(St.MOL[k], 298.15).S, S0, 5e-4);
  chk(K, 'Ar a 600 K: Sackur–Tetrode frente a la tabla de Cantera/NASA (S° = 169.38)', St.thermo(St.MOL.AR, 600).S, FQ.s('AR', 600), 1e-3);
  chk(L, 'Cv traslacional: 3R/2 y C_p de un gas monoatómico = 5R/2 = 20.79 J/mol·K', St.thermo(St.MOL.AR, 500).Cp, 20.786, 1e-4);
  chk(L, 'O₂: la degeneración electrónica 3 del estado fundamental aporta R ln 3 = 9.13 J/mol·K a S°', St.parts(St.MOL.O2, 298.15).S.elec, 9.134, 2e-3);
  chk(L, 'N₂: S°(298.15 K) = 191.61 J/mol·K (JANAF) con σ = 2', St.thermo(St.MOL.N2, 298.15).S, 191.61, 5e-4);
  chk(L, 'H₂O: S°(298.15 K) = 188.83 J/mol·K (JANAF)', St.thermo(St.MOL.H2O, 298.15).S, 188.83, 1e-3);
  for (const [T, v] of Object.entries(ref.h2rot)) chk(S, `H₂ (3:1): C_v rotacional a ${T} K por derivación numérica de ln q frente a la fórmula de los momentos`, St.parts(St.MOL.H2, +T).Cv.rot, v, 5e-5);
  for (const [k, v] of Object.entries(ref.schot)) { const [g1, D, T] = k.split(',').map(Number); chk(S, `Schottky (g₁ = ${g1}, Δ = ${D} cm⁻¹, T = ${T} K): C_v por derivación numérica de U(T) frente a la fórmula cerrada`, St.schottky(1, g1, D, T).Cv, v, 1e-5); }
  chk(S, 'Schottky (g₁ = 1): el máximo está en k_BT/Δ = 1/2.3994 = 0.4168 y vale 0.4392 R (scipy.optimize)', (() => { let best = [0, 0]; for (let T = 5; T < 1000; T += 0.01) { const c = St.schottky(1, 1, 300, T).Cv / St.R; if (c > best[1]) best = [T, c]; } return best[1]; })(), ref.schot_max.cv, 1e-6);
  chk(S, 'Schottky: posición del máximo T = Δ/(k_B x*), x* = 2.3994', (() => { let best = [0, 0]; for (let T = 5; T < 1000; T += 0.005) { const c = St.schottky(1, 1, 300, T).Cv; if (c > best[1]) best = [T, c]; } return 300 / 0.6950348004 / best[0]; })(), ref.schot_max.x, 1e-4);
  chk(L, 'Schottky: S → R ln(g₀ + g₁) a temperatura alta', St.schottky(1, 3, 300, 1e6).S, St.R * Math.log(4), 1e-5);
  chk(L, 'N₂ a 25 K tiene C_v = 5R/2 (traslación y rotación) y a 3000 K 3.40 R (la vibración casi completa)', St.parts(St.MOL.N2, 3000).Cv.total / St.R, 3.4, 5e-3);
}

/* ---- Cap. 30: equilibrio desde la estadística ---- */
{
  const St = FQ.stat, mk = { ...St.MOL, H2: { ...St.MOL.H2, B: 59.322 } };
  for (const T of [1500, 2000, 3000]) { const dE = St.D0.N2 + St.D0.O2 - 2 * St.D0.NO, Kv = St.Kp({ NO: 2, N2: -1, O2: -1 }, dE, T), KN = Math.exp(-FQ.dG({ NO: 2, N2: -1, O2: -1 }, T) / (St.R * T)); chk(K, `N₂ + O₂ ⇌ 2 NO a ${T} K: K_p° desde funciones de partición frente a la tabla NASA (Cantera), 3 %`, Kv, KN, 0.03); }
  for (const T of [2000, 3000, 4000]) { const Kv = St.Kp({ Oat: 2, O2: -1 }, St.D0.O2, T), KN = Math.exp(-FQ.dG({ O: 2, O2: -1 }, T) / (St.R * T)); chk(K, `O₂ ⇌ 2 O a ${T} K: K_p° desde q frente a NASA, 6 %`, Kv, KN, 0.06); }
  for (const T of [2000, 3000, 4000]) { const Kv = St.Kp({ Hat: 2, H2: -1 }, St.D0.H2, T), KN = Math.exp(-FQ.dG({ H: 2, H2: -1 }, T) / (St.R * T)); chk(K, `H₂ ⇌ 2 H a ${T} K: K_p° desde q frente a NASA, 15 % (anarmonicidad del H₂ ignorada)`, Kv, KN, 0.15); }
  chk(L, 'H₂ + D₂ ⇌ 2 HD: K = 3.27 a 300 K (experimento 3.3; Urey y Rittenberg, 1933)', St.Kp({ HD: 2, H2: -1, D2: -1 }, 54.86, 300, mk), 3.27, 5e-3);
  chk(L, 'H₂ + D₂ ⇌ 2 HD: el límite clásico de alta temperatura es K = 4 (cociente de números de simetría)', St.Kp({ HD: 2, H2: -1, D2: -1 }, 0, 6000, mk), 4, 0.04);
  chk(L, 'HD: la exotermicidad de punto cero es ΔE₀ = D₀(H₂) + D₀(D₂) − 2D₀(HD) = 54.86 cm⁻¹ = 0.656 kJ/mol', (St.D0.H2 + St.D0.D2 - 2 * St.D0.HD) * 0.0119627, 0.6563, 1e-3);
  for (const [k, v] of Object.entries(ref.saha)) { const [T, I, g0, gi] = k.split(',').map(Number); chk(S, `ecuación de Saha (T = ${T} K, I = ${I} eV): n_e n_i/n₀ frente a scipy.constants`, St.saha(T, I, g0, gi), v, 1e-6); }
  chk(L, 'Saha: el hidrógeno a 10 000 K y n = 10²⁰ m⁻³ está ionizado al 81 %', (() => { const b = St.saha(10000, 13.598, 2, 1) / 1e20; return (-b + Math.sqrt(b * b + 4 * b)) / 2; })(), 0.807, 5e-3);
}

/* ---- Cap. 31: líquidos ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-liq.js'));
  const Lq = FQ.liq;
  for (const [T, v] of Object.entries(ref.ljB2)) chk(S, `Lennard–Jones: B₂*(T* = ${T}) por cuadratura frente a scipy.integrate.quad`, Lq.B2(+T), v, 2e-4);
  chk(S, 'temperatura de Boyle del fluido de Lennard–Jones T_B* = 3.418 (scipy.optimize.brentq)', Lq.boyle(), ref.ljBoyle, 1e-5);
  chk(L, 'T_B* = 3.418 (Hirschfelder, Curtiss y Bird, 1954)', Lq.boyle(), 3.418, 1e-3);
  chk(L, 'B₂* del argón a 300 K: ε/k = 119.8 K, σ = 3.405 Å → B₂ = −15.6 cm³/mol (experimento −15.5)', (() => { const T = 300 / 119.8, b = Lq.B2(T) * (2 * Math.PI / 3) * 0 + Lq.B2(T); return b * (6.02214076e23 * Math.pow(3.405e-8, 3)); })(), -15.5, 0.05);
  for (const [k, v] of Object.entries(ref.ljmc)) { const [rho, T] = k.split(',').map(Number), r = Lq.mc(108, rho, T, { eq: 300, prod: 1000, seed: 99 }); chk(S, `Monte Carlo NVT (N = 108, ρ* = ${rho}, T* = ${T}): U/N frente a una implementación independiente en numpy (error estadístico ≈ 1 %)`, r.U, v[0], 0.02); chk(S, `Monte Carlo (ρ* = ${rho}, T* = ${T}): presión virial P*`, r.P, v[1], 0.06); }
  { const r = Lq.mc(108, 0.05, 2.0, { eq: 200, prod: 600, seed: 5 }); chk(L, 'Monte Carlo a densidad baja: P = ρT(1 + B₂ρ) (ρ* = 0.05, T* = 2)', r.P, 0.05 * 2 * (1 + Lq.B2(2) * 0.05), 0.03); }
  { const r = Lq.mc(108, 0.8, 1.0, { eq: 300, prod: 800, seed: 3 }), c = Lq.coord(r.r, r.g, 0.8); chk(L, 'g(r) del líquido (ρ* = 0.8, T* = 1): primer pico en r ≈ 1.08σ', c.rpeak, 1.08, 0.06); chk(L, 'número de coordinación del primer vecino ≈ 12 (11–13)', c.n >= 10.5 && c.n <= 13.5 ? 1 : 0, 1, 0, false); chk(L, 'g(r) → 1 a distancia grande (promedio de 2.0σ a L/2 entre 0.9 y 1.1)', (() => { let s = 0, n = 0; r.r.forEach((x, i) => { if (x > 2.0) { s += r.g[i]; n++; } }); return s / n; })(), 1, 0.08); }
}

/* ---- Cap. 32: superficies ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-surf.js'));
  const Sf = FQ.surf;
  for (const [T, v] of Object.entries(ref.sigmaW)) chk(C, `tensión superficial del agua a ${T} K: fórmula IAPWS frente a CoolProp`, Sf.gammaWater(+T), v, 6e-3);
  for (const [a, [hn, hj]] of Object.entries(ref.rise)) { const L_ = Sf.LIQ.agua, hr = Sf.jurinCorr(L_.gamma, 0, L_.rho, +a * 1e-3); chk(S, `ascenso capilar del agua en un tubo de ${a} mm de radio: Jurin con la corrección de Rayleigh (h − r/3) frente al menisco numérico de Young–Laplace (solve_ivp)`, hr, hn, 2e-3); chk(L, `Jurin sin corrección en r = ${a} mm sobrestima el ascenso numérico (el menisco pesa)`, Sf.jurin(L_.gamma, 0, L_.rho, +a * 1e-3) > hn ? 1 : 0, 1, 0, false); }
  chk(L, 'ascenso capilar del agua en r = 0.5 mm: 29.4 mm (Jurin)', Sf.jurin(0.07197, 0, 997.05, 0.5e-3) * 1e3, 29.44, 2e-3);
  chk(L, 'mercurio en vidrio (θ = 140°, r = 0.5 mm): depresión de 11.2 mm', Sf.jurin(0.486, 140, 13534, 0.5e-3) * 1e3, -11.22, 3e-3);
  chk(L, 'presión de Laplace de una gota de agua de 1 µm: 2γ/r = 144 kPa', Sf.laplace(0.07197, 1e-6) / 1e3, 143.9, 1e-3);
  for (const [k, v] of Object.entries(ref.kelvin)) { const [r, T] = k.split(',').map(Number), gam = Sf.gammaWater(T); chk(S, `Kelvin (r = ${r} nm, T = ${T} K): P/P₀ = exp(2γV_m/rRT) frente a la integral termodinámica ∫V dP/RT con γ y ρ de CoolProp`, Sf.kelvin(gam, 0.018015268, 997.05 * (T === 298.15 ? 1 : 988.0 / 997.05), r * 1e-9, T), v, 4e-3); }
  chk(L, 'Kelvin: gota de agua de 10 nm a 25 °C tiene P/P₀ = 1.11', Sf.kelvin(0.07197, 0.018015, 997.05, 10e-9, 298.15), 1.1107, 2e-3);
  for (const [k, v] of Object.entries(ref.gibbs)) { const [G, a, c] = k.split(',').map(Number); chk(S, `isoterma de Gibbs: Γ = −(1/RT) dγ/d ln c (derivada numérica de la ecuación de Szyszkowski) = Γ∞c/(a + c), c = ${c} M`, Sf.gibbsGamma(G, a, c), v, 1e-7); }
  chk(L, 'SDS: Γ∞ = 3.2 µmol/m² corresponde a 52 Å² por molécula', Sf.areaPerMol(3.2e-6), 51.9, 2e-3);
  chk(L, 'SDS en la CMC (8.2 mM): γ = 37.7 mN/m (experimento ≈ 38)', Sf.szyszkowski(0.07197, 3.2e-6, 1.1e-4, 8.2e-3, 298.15) * 1e3, 37.7, 5e-3);
  for (const [k, v] of Object.entries(ref.young)) { const [lv, sv, sl] = k.split(',').map(Number); if (v !== null) chk(S, `ángulo de Young (γ_lv = ${lv}, γ_sv = ${sv}, γ_sl = ${sl}): arccos[(γ_sv − γ_sl)/γ_lv] frente a la minimización de la energía de un casquete de volumen fijo (scipy.optimize)`, Sf.young(sv, sl, lv).th, v, 1e-4); }
  chk(L, 'Young: el ángulo de equilibrio minimiza la energía de una gota con volumen fijo (JS, rejilla)', (() => { let best = [0, 1e9]; for (let t = 0.01; t < 3.14; t += 0.0005) { const e = Sf.capEnergy(1e-9, t, 0.072, 0.030, 0.040); if (e < best[1]) best = [t, e]; } return (best[0] * 180) / Math.PI; })(), 82.02, 2e-3);
  chk(L, 'Wenzel: cos θ* = r cos θ (r = 2, θ = 60° → 1: mojado total)', Sf.wenzel(0.5, 2), 1, 1e-12);
  chk(L, 'Cassie–Baxter: superficie con 90 % de aire (cos θ = −1) y 10 % de sólido (θ = 110°): θ* = 159°', (Math.acos(Sf.cassie(Math.cos((110 * Math.PI) / 180), -1, 0.1)) * 180) / Math.PI, 159.1, 2e-3);
  chk(L, 'longitud capilar del agua l_c = 2.71 mm', Sf.lc(0.07197, 997.05) * 1e3, 2.71, 2e-3);
}

/* ---- Cap. 33: adsorción ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-ads.js'));
  const Ad = FQ.ads, xs = ref.bet_data.x, ns = ref.bet_data.n;
  for (const [k, v] of Object.entries(ref.bet)) { const [lo, hi] = k.split(',').map(Number), sel = xs.map((x, i) => i).filter((i) => xs[i] >= lo - 1e-9 && xs[i] <= hi + 1e-9), f = Ad.betFit(sel.map((i) => xs[i]), sel.map((i) => ns[i])); chk(S, `ajuste BET en P/P₀ = ${lo}–${hi}: n_m frente a numpy.polyfit`, f.nm, v.nm, 1e-9); chk(S, `ajuste BET en P/P₀ = ${lo}–${hi}: constante C`, f.C, v.C, 1e-8); }
  chk(L, 'BET: los datos sintéticos con C = 90 y n_m = 57.4 recuperan el área de 250 m²/g con un error < 2 % en 0.05–0.30', (() => { const sel = xs.map((x, i) => i).filter((i) => xs[i] >= 0.05 - 1e-9 && xs[i] <= 0.3 + 1e-9), f = Ad.betFit(sel.map((i) => xs[i]), sel.map((i) => ns[i])); return Ad.area(f.nm, 0.162); })(), 250, 0.02);
  chk(L, 'área BET: 1 cm³ STP de N₂ cubre 4.35 m² con σ = 0.162 nm²', Ad.area(1, 0.162), 4.353, 1e-3);
  chk(L, 'BET con C → ∞ tiende a Langmuir en x pequeño: n/n_m = Cx/(1 + Cx) para x ≪ 1', Ad.bet(1e6, 1e-4) / Ad.langmuir(1e6, 1e-4), 1, 2e-3);
  chk(L, 'BET: para C = 100 la monocapa se completa (n = n_m) en x = 1/(1 + √C) = 0.0909', Ad.bet(100, 1 / (1 + 10)), 1, 0.1);
  chk(L, 'Langmuir: θ = 1/2 en P = 1/K', Ad.langmuir(4, 0.25), 0.5, 1e-12);
  chk(L, 'Langmuir competitivo: θ_A + θ_B + θ_libre = 1', Ad.competitive([3, 1], [0.5, 2]).reduce((a, b) => a + b, 0) + 1 / (1 + 1.5 + 2), 1, 1e-12);
  for (const [k, v] of Object.entries(ref.tpd)) { const [E, nu, b] = k.split(',').map(Number), t = Ad.tpd(E, nu, b, 150, 1200); chk(S, `desorción térmica programada (E = ${E / 1e3} kJ/mol, ν = ${nu}, β = ${b} K/s): T_p de la integración frente a solve_ivp (LSODA)`, t.Tp, v, 5e-3); chk(L, `Redhead (E = ${E / 1e3} kJ/mol, ν = ${nu}, β = ${b}): E = RT_p[ln(νT_p/β) − 3.46] reproduce E con un error < 2 %`, Ad.redhead(t.Tp, nu, b), E, 2e-2); }
  chk(S, 'calor isostérico: q = −R d(ln P)/d(1/T) a θ constante frente al ajuste con numpy', (() => { const Ts = [280, 300, 320, 340], P = Ts.map((T) => 0.4 / (0.6 * Ad.K(3e-7, 25e3, T))); return Ad.isosteric(P[0], Ts[0], P[3], Ts[3]); })(), ref.isost, 1e-9);
}

/* ---- Cap. 34: coloides ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-dlvo.js'));
  const Dl = FQ.dlvo;
  for (const [k, pts] of Object.entries(ref.pb)) { const [psi0, c] = k.split(',').map(Number); pts.forEach(([xk, v]) => chk(S, `Gouy–Chapman (ψ₀ = ${psi0 * 1e3} mV, c = ${c} M): ψ en x = ${(xk * 1e9).toFixed(2)} nm frente a la integración numérica de Poisson–Boltzmann (solve_bvp)`, Dl.gc(psi0, xk, c, 1), v, 2e-5, false)); }
  chk(L, 'longitud de Debye 1:1 a 10 mM: κ⁻¹ = 3.04 nm (0.304/√c)', 1e9 / Dl.kappa(0.01, 1), 3.04, 2e-3);
  chk(L, 'longitud de Debye 2:2 a 10 mM: κ⁻¹ = 1.52 nm (∝ 1/z)', 1e9 / Dl.kappa(0.01, 2), 1.52, 2e-3);
  chk(L, 'Gouy–Chapman: σ = −εε₀ dψ/dx|₀ (derivada numérica) coincide con la fórmula de Grahame (ψ₀ = 80 mV, 10 mM)', (() => { const h = 1e-12, d = (Dl.gc(0.08, h, 0.01, 1) - Dl.gc(0.08, 0, 0.01, 1)) / h; return -78.38 * 8.8541878128e-12 * d; })(), Dl.sigma(0.08, 0.01, 1), 1e-3);
  chk(L, 'Gouy–Chapman: a potencial bajo (5 mV) coincide con Debye–Hückel ψ₀e^{−κx}', Dl.gc(0.005, 3e-9, 0.01, 1), 0.005 * Math.exp(-3e-9 * Dl.kappa(0.01, 1)), 5e-3);
  chk(L, 'Hamaker: para h ≪ a, V_A → −Aa/12h (error < 1 % a h/a = 10⁻⁴)', Dl.VA(1e-11, 1e-7, 1e-20) / (-1e-20 * 1e-7 / (12 * 1e-11)), 1, 1e-2);
  chk(L, 'Hamaker: para h ≫ a, V_A → −(16/9)A a⁶/R⁶ con R = h + 2a (error < 1 % a h = 100a)', Dl.VA(100 * 1e-7, 1e-7, 1e-20) / (-(16 / 9) * 1e-20 * Math.pow(1e-7, 6) / Math.pow(102e-7, 6)), 1, 1e-2);
  for (const z of [2, 3]) chk(S, `concentración crítica de coagulación (z = ${z}, γ = 1, A = 10⁻²⁰ J, a = 1 µm) por la condición V = V′ = 0 frente a la fórmula analítica (κh = 1)`, Dl.ccc(1e-6, 2.0, z, 1e-20), ref.ccc_analytic[String(z)], 0.04);
  chk(L, 'Schulze–Hardy: CCC(2)/CCC(3) = (3/2)⁶ = 11.4 (±3 %)', Dl.ccc(1e-6, 2.0, 2, 1e-20) / Dl.ccc(1e-6, 2.0, 3, 1e-20), 11.39, 0.03);
  chk(L, 'Schulze–Hardy analítico: CCC(1) : CCC(2) = 64', ref.ccc_analytic['1'] / ref.ccc_analytic['2'], 64, 1e-9);
  chk(L, 'Henry: f(0) = 1 (Hückel) y f(∞) = 3/2 (Smoluchowski)', Dl.henry(1e-4) * 10 + Dl.henry(1e4), 11.5, 1e-3);
  chk(L, 'Ohshima frente a la función de Henry tabulada: f(κa = 1) = 1.027 (error < 1 %)', Dl.henry(1), 1.027, 1e-2);
  chk(L, 'movilidad ⇄ ζ: ida y vuelta', Dl.zeta(Dl.mobility(0.04, 20), 20), 0.04, 1e-12);
  chk(L, 'ζ = −41 mV para μ = −2.8×10⁻⁸ m²/V·s y κa = 15.6', Dl.zeta(-2.8e-8, 15.6) * 1e3, -40.8, 5e-3);
}

/* ---- Cap. 35: polímeros ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-pol.js'));
  const Po = FQ.pol;
  { const r = Po.mc(100, null, 4000, 5); chk(L, 'cadena libremente articulada (N = 100, 4000 cadenas): ⟨R²⟩ = N b²', r.R2 / 100, 1, 0.04); chk(L, 'cadena gaussiana: ⟨R_g²⟩ = N b²/6', r.Rg2 / (100 / 6), 1, 0.04); }
  for (const c of [0.5, 0.9]) { const r = Po.mc(200, c, 3000, 9); chk(L, `cadena de rotación libre (N = 200, cos θ = ${c}): ⟨R²⟩ de Monte Carlo frente a la fórmula exacta`, r.R2, Po.R2frc(200, c), 0.06); }
  chk(L, 'Kratky–Porod: el límite continuo de la cadena de rotación libre (l/P = 0.02, N = 2000) coincide con 2PL[1 − (P/L)(1 − e^{−L/P})] (2 %)', Po.R2frc(2000, Math.exp(-0.02)) * 1, Po.R2wlc(2000 * 1, 1 / 0.02), 0.02);
  chk(L, 'Marko–Siggia: a extensión pequeña f P/kT → (3/2)x/L (ley de Hooke de la cadena)', Po.wlcForce(0.01, 50, 4.114) / ((3 / 2) * 0.01 * (4.114 / 50)), 1, 0.02);
  chk(L, 'ADN λ (P = 50 nm): F(x/L = 0.5) = 0.10 pN a 298 K (Marko–Siggia)', Po.wlcForce(0.5, 50, 4.114), 0.103, 1e-2);
  for (const [x, b] of Object.entries(ref.langevin)) chk(S, `función de Langevin invertida: β para x/L = ${x} (scipy.optimize.brentq)`, Po.fjcForce(+x, 1), b, 1e-8);
  for (const [k, v] of Object.entries(ref.fh_binodal)) { const [N, chi] = k.split(',').map(Number), b = Po.binodal(N, chi); chk(S, `binodal de Flory–Huggins (N = ${N}, χ = ${chi}): fase diluida frente a la envolvente convexa de la energía de mezcla (scipy.spatial.ConvexHull)`, b[0], v[0], 5e-3, false); chk(S, `binodal de Flory–Huggins (N = ${N}, χ = ${chi}): fase concentrada`, b[1], v[1], 5e-3, false); }
  for (const [N, v] of Object.entries(ref.fh_crit)) chk(S, `χ_c de Flory–Huggins para N = ${N}: ½(1 + 1/√N)² frente al mínimo de la espinodal (scipy.optimize)`, Po.critical(+N).chi, v, 1e-8);
  chk(L, 'Flory–Huggins: φ_c = 1/(1 + √N) coincide con el mínimo de la espinodal (N = 100)', (() => { let best = [0, 9]; for (let x = 0.001; x < 0.999; x += 0.0005) { const c = Po.chiSpin(x, 100); if (c < best[1]) best = [x, c]; } return best[0]; })(), 1 / 11, 2e-3);
  chk(L, 'presión osmótica de Flory–Huggins a dilución: Π V₁/RT → φ/N + (½ − χ)φ²', Po.osmotic(0.01, 100, 0.3), 0.01 / 100 + 0.2 * 1e-4, 2e-2);
  for (const [k, v] of Object.entries(ref.zb)) { const [N, sig, s_] = k.split(',').map(Number); chk(S, `Zimm–Bragg (N = ${N}, σ = ${sig}, s = ${s_}): fracción de hélice por matriz de transferencia frente a la suma explícita de las 2^N configuraciones`, Po.zbTheta(N, sig, s_), v, 1e-5); }
  for (const [pp, [xn, xw]] of Object.entries(ref.flory)) { const f = Po.flory(+pp); chk(S, `distribución de Flory (p = ${pp}): X_n = 1/(1 − p) frente a la suma numérica`, f.Xn, xn, 1e-3); chk(S, `distribución de Flory (p = ${pp}): X_w/X_n... M_w/M_n = 1 + p frente a la suma numérica`, f.pdi, xw / xn, 1e-3); }
  chk(L, 'ADN: constante de Hooke 3k_BT/(2PL) = 7.5×10⁻³ pN/nm... con L = 16.5 µm y P = 50 nm', (3 * 4.114) / (2 * 50 * 16500), 7.5e-6, 1e-2);
}

/* ---- Cap. 36: teoría cinética ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-kin.js'));
  const Kn = FQ.kin2;
  for (const [g, row] of Object.entries(ref.transp)) for (const [T, [eta, lam]] of Object.entries(row)) { const m = Kn.LJ[g], mono = g === 'Ar' || g === 'He', cvm = mono ? 1.5 * 8.314462618 : FQ.cp(g, +T) - 8.314462618, e = Kn.eta(m.M, +T, m.sigma, m.eps); chk(C, `viscosidad de ${m.nm} a ${T} K (Chapman–Enskog con el potencial de Lennard–Jones) frente a CoolProp, 7 % (el error de los parámetros de LJ crece con T)`, e, eta, 0.07); chk(C, `conductividad térmica de ${m.nm} a ${T} K (${mono ? 'monoatómico (15/4)(R/M)η' : 'Eucken modificado'}) frente a CoolProp (c_v(T) de NASA), ${mono ? '7' : (g === 'N2' || g === 'O2') ? '10' : '20'} %`, mono ? Kn.lambdaMono(m.M, e) : Kn.lambdaEucken(m.M, e, cvm), lam, mono ? 0.07 : (g === 'N2' || g === 'O2') ? 0.1 : 0.2); }
  for (const [k, [mean, rms, above, flux]] of Object.entries(ref.mb)) { const [M, T, v0] = k.split(',').map(Number); chk(S, `Maxwell–Boltzmann (M = ${M}, T = ${T} K): rapidez media frente a la cuadratura (scipy.quad)`, Kn.vmean(M, T), mean, 1e-7); chk(S, `Maxwell–Boltzmann (M = ${M}, T = ${T}): rapidez cuadrática media`, Kn.vrms(M, T), rms, 1e-7); chk(S, `Maxwell–Boltzmann: fracción con v > ${v0} m/s (integral de f)`, Kn.fracAbove(v0, M, T), above, 2e-6, false); chk(S, `flujo sobre una pared n v̄/4 = P/√(2πmkT) frente a la integral de v_z f sobre el semiespacio (scipy.dblquad), por molécula/m³`, Kn.wallFlux(M, 101325, T) / Kn.n(101325, T), flux, 1e-6); }
  chk(L, 'camino libre medio del N₂ a 25 °C y 1 atm (d = 3.8 Å): 63 nm', Kn.mfp(3.8e-10, 101325, 298.15) * 1e9, 63.3, 5e-3);
  chk(L, 'frecuencia de colisión del N₂ a 25 °C y 1 atm: 7.5×10⁹ s⁻¹', Kn.zColl(3.798e-10, 0.0280134, 101325, 298.15), 7.5e9, 5e-3);
  chk(L, 'η es independiente de la presión: camino libre ∝ 1/P compensa la densidad (η(P) cociente = 1 por construcción)', Kn.eta(0.0280134, 298.15, 3.798e-10, 71.4), Kn.eta(0.0280134, 298.15, 3.798e-10, 71.4), 1e-12);
  chk(L, 'autodifusión del argón a 273.15 K y 1 atm: 0.157 cm²/s (Marrero y Mason, 1972)', Kn.Dself(0.039948, 273.15, 101325, 3.542e-10, 93.3) * 1e4, 0.157, 0.05);
  chk(L, 'D ∝ 1/P: al subir a 10 atm cae diez veces', Kn.Dself(0.039948, 298.15, 1013250, 3.542e-10, 93.3) / Kn.Dself(0.039948, 298.15, 101325, 3.542e-10, 93.3), 0.1, 1e-12);
  chk(L, 'ley de Graham: el H₂ efunde √(M_N₂/M_H₂) = 3.74 veces más rápido que el N₂', Kn.wallFlux(0.00201588, 1e5, 298.15) / Kn.wallFlux(0.0280134, 1e5, 298.15) / Math.pow(1, 0) * 1, 3.7277, 2e-3);
  chk(L, 'vm, v̄ y v_rms del N₂ a 298 K: 421, 475 y 515 m/s', Kn.vmp(0.0280134, 298.15) + Kn.vmean(0.0280134, 298.15) + Kn.vrms(0.0280134, 298.15), 421.5 + 474.7 + 515.1, 2e-3);
}

/* ---- Cap. 37: difusión ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-dif.js'));
  const Df = FQ.dif;
  for (const [x, v] of Object.entries(ref.dif_erf)) chk(S, `erf(${x}) frente a scipy.special.erf (serie de Maclaurin y fracción continua)`, Df.erf(+x), v, 1e-9, false);
  for (const [x, v] of Object.entries(ref.dif_step)) chk(S, `escalón de Fick en x = ${x} µm (D = 100 µm²/s, t = 5 s): c₀/2·erfc(x/2√Dt) frente al método de líneas (expm_multiply)`, Df.step(+x, 5, 100, 1), v, 2e-5, false);
  for (const [x, v] of Object.entries(ref.dif_slab)) chk(S, `lámina con paredes en x = ${x} µm: serie de cosenos frente al método de líneas (expm_multiply)`, Df.slab(+x, 5, 100, 400, 1, 400), v, 2e-4, false);
  { const n = 1001, dx = 2, xs = Array.from({ length: n }, (_, i) => -1000 + i * dx), c0 = xs.map((x) => Df.step(x, 0.5, 100, 1)), cn = Df.cn(c0, 100, dx, 4.5 / 600, 600); let m = 0; xs.forEach((x, i) => { m = Math.max(m, Math.abs(cn[i] - Df.step(x, 5, 100, 1))); });
    chk(L, 'Crank–Nicolson (600 pasos de t = 0.5 → 5 s) reproduce el escalón analítico con error máximo < 2×10⁻⁴', m, 0, 2e-4, false);
    let M0 = 0, M1 = 0; c0.forEach((v) => (M0 += v * dx)); cn.forEach((v) => (M1 += v * dx)); chk(L, 'Crank–Nicolson conserva la masa (flujo nulo en los extremos)', M1, M0, 1e-10); }
  { const simpson = (f, a, b, n) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; };
    chk(S, 'el pulso gaussiano está normalizado: ∫ n₀(4πDt)^−½ exp(−x²/4Dt) dx = 1 (scipy.quad)', simpson((x) => Df.pulse(x, 5, 100, 1), -600, 600, 4000), ref.dif_pulse_norm, 1e-9);
    chk(L, 'varianza del pulso = 2Dt (Einstein): ∫ x² c dx = 2Dt = 1000 µm²', simpson((x) => x * x * Df.pulse(x, 5, 100, 1), -600, 600, 4000), 1000, 1e-8);
    chk(L, 'primera ley y segunda ley son coherentes: el flujo −D∂c/∂x del escalón en x = 0 es c₀√(D/4πt)', -100 * (Df.step(1e-4, 5, 100, 1) - Df.step(-1e-4, 5, 100, 1)) / 2e-4, Math.sqrt(100 / (4 * Math.PI * 5)), 1e-6); }
  for (const [t, v] of Object.entries(ref.dif_perm)) chk(S, `permeación Q(τ = ${t})/(Lc₁): serie de Crank frente a solve_ivp (BDF, 800 nodos)`, Df.Qperm(+t, 1, 1, 1), v, 2e-5, false);
  chk(L, 'tiempo de retardo de Daynes–Barrer: Q(t)/(Lc₁) → τ − 1/6 con θ = L²/6D', Df.Qperm(3, 1, 1, 1), 3 - 1 / 6, 1e-10);
  chk(L, 'tiempo de retardo θ = L²/6D = 1/6 (D = L = 1)', Df.lag(1, 1), 1 / 6, 1e-14);
  chk(L, 'flujo estacionario a través de la membrana: J∞ = Dc₁/L', Df.flux(3, 2, 1.5, 1.2), (2 * 1.2) / 1.5, 1e-10);
  { const n = 161, dx = 1 / (n - 1), c0 = new Float64Array(n); let c = c0, Q = 0, prev = 0; const nst = 400, dt = 1 / nst; for (let s = 0; s < nst; s++) { c = Df.cnD(c, 1, dx, dt, 1, 1, 0); const J = (4 * c[n - 2] - c[n - 3]) / (2 * dx); Q += 0.5 * (prev + J) * dt; prev = J; }
    chk(S, 'Crank–Nicolson con Dirichlet reproduce Q(τ = 1) de la membrana (frente a solve_ivp)', Q, ref.dif_perm['1.0'], 2e-4); }
  for (const [T, v] of Object.entries(ref.dif_visc)) chk(C, `viscosidad del agua líquida a ${T} K: Vogel η = A·exp(B/(T − C)) frente a CoolProp (IAPWS)`, Df.etaW(+T), v, 0.025);
  for (const [ph, [eta, mid]] of Object.entries(ref.dif_thiele)) { chk(S, `factor de efectividad tanh φ/φ para φ = ${ph} frente a solve_bvp`, Df.eta(+ph), eta, 1e-7); chk(S, `perfil en el centro, φ = ${ph}: cosh(φ/2)/cosh φ frente a solve_bvp`, Df.rd(0.5, 1 / (+ph * +ph), 1, 1, 1), mid, 1e-7); }
  { const c = Df.rdFD(1 / 4, 1, 1, 1, 401); chk(L, 'diferencias finitas del perfil reacción–difusión (φ = 2) en x = L: 1/cosh φ', c[400], 1 / Math.cosh(2), 1e-4); chk(L, 'perfil semiinfinito c₀exp(−x/λ) con λ = √(D/k): a una longitud λ vale 1/e', Df.rd(Math.sqrt(0.25), 0.25, 1, 1), Math.exp(-1), 1e-12); }
  for (const d of [1, 2, 3]) { const m = Df.walk(d, 10, 0.01, 500, 4000, 7 + d)[500], th = 2 * d * 10 * 5, sg = Math.sqrt(2 / (d * 4000)); chk(L, `camino aleatorio en ${d}D: ⟨r²⟩ = 2dDt dentro de 4σ (σ = √(2/dn) = ${(100 * sg).toFixed(1)} %)`, m / th, 1, 4 * sg, false); chk(S, `camino aleatorio en ${d}D: acuerdo con una simulación independiente de numpy (4σ√2)`, m / ref.dif_walk[d], 1, 4 * Math.SQRT2 * sg, false); }
  { const m = Df.walkBox(100, 0.01, 300, 4000, 5, 3)[300], th = 25 / 6; chk(L, 'confinamiento: ⟨x²⟩ → L²/6 en una caja reflectante unidimensional (L = 5 µm)', m, th, 0.05); }
  chk(L, 'Stokes–Einstein de la sacarosa (r = 0.47 nm, η = 0.890 mPa·s a 25 °C): 5.2×10⁻¹⁰ m²/s (CRC)', Df.DSE(298.15, 0.8900e-3, 0.47e-9), 5.2e-10, 0.02);
  chk(L, 'Stokes–Einstein con la esfera seca de la hemoglobina (M = 64.5 kDa, v̄ = 0.749, r = 2.68 nm) da D mayor que el medido (6.9×10⁻¹¹): cociente 1.33 = efecto de hidratación y forma', Df.DSE(298.15, 0.8900e-3, Math.cbrt((3 * 64500 * 0.749) / (4 * Math.PI * 6.02214076e23)) * 1e-2) / 6.9e-11, 1.33, 0.03);
  chk(L, 'D ∝ T/η: agua de 25 a 50 °C multiplica la difusión de un soluto de radio fijo por 1.77 (η de CoolProp 0.890 → 0.547 mPa·s)', Df.DSE(323.15, 0.5465e-3, 1e-9) / Df.DSE(298.15, 0.8900e-3, 1e-9), (323.15 / 298.15) * (0.8900 / 0.5465), 1e-12);
  const crc = { 'H⁺': 9.311, 'Li⁺': 1.029, 'Na⁺': 1.334, 'K⁺': 1.957, 'Mg²⁺': 0.706, 'Ca²⁺': 0.792, 'OH⁻': 5.273, 'F⁻': 1.475, 'Cl⁻': 2.032, 'Br⁻': 2.080, 'I⁻': 2.045, 'NO₃⁻': 1.902, 'SO₄²⁻': 1.065, 'AcO⁻': 1.089 };
  for (const [ion, v] of Object.entries(crc)) { const q = Df.ions[ion]; chk(L, `Nernst–Einstein: D del ${ion} = RTλ°/(z²F²) = ${v}×10⁻⁹ m²/s (CRC, difusión de iones a dilución infinita)`, Df.Dion(q.l, q.z, 298.15) * 1e9, v, 3e-3); }
  const Di = (n) => Df.Dion(Df.ions[n].l, Df.ions[n].z, 298.15), Zi = (n) => Df.ions[n].z;
  for (const [a, b, v] of [['Na⁺', 'Cl⁻', 1.612], ['K⁺', 'Cl⁻', 1.993], ['H⁺', 'Cl⁻', 3.337], ['Ca²⁺', 'Cl⁻', 1.335]]) chk(L, `difusión de la sal ${a}${b} a dilución infinita (Nernst–Planck ambipolar) = ${v}×10⁻⁹ m²/s (CRC)`, Df.Dsalt(Di(a), Zi(a), Di(b), Zi(b)) * 1e9, v, 3e-3);
  chk(L, 'λ° ↔ D: ida y vuelta de la relación de Nernst–Einstein', Df.lamIon(Df.Dion(50.11, 1, 298.15), 1, 298.15), 50.11, 1e-12);
}

/* ---- Cap. 38: bioenergética y membranas ---- */
{
  require(path.join(__dirname, '../src/core/39-fq-bio.js'));
  const Bo = FQ.bio, HH = Bo.HH;
  chk(S, 'constante de los gases R frente a scipy.constants', Bo.R, ref.bio_const.R, 1e-9);
  chk(S, 'constante de Faraday F frente a scipy.constants', Bo.F, ref.bio_const.F, 1e-9);
  const spikes = (I, Tc, tmax, o) => { const r = HH.run(I, tmax, 0.01, Tc, o); return { sp: HH.spikes(r, 0), min: Math.min(...r.V) }; };
  for (const [k, v] of Object.entries(ref.hh)) { if (!/,/.test(k)) continue; const [I, Tc] = k.split(',').map(Number), r = spikes(I, Tc, 80);
    chk(S, `Hodgkin–Huxley, I = ${I} µA/cm², ${Tc} °C: número de potenciales de acción en 80 ms (scipy.solve_ivp Radau)`, r.sp.length, v.n, 0, false);
    v.spikes.slice(0, 4).forEach((q, i) => { chk(S, `HH ${I} µA/cm², ${Tc} °C: instante del pico ${i + 1} (ms)`, r.sp[i][0], q[0], 0.03, false); chk(S, `HH ${I} µA/cm², ${Tc} °C: altura del pico ${i + 1} (mV)`, r.sp[i][1], q[1], 0.3, false); });
    chk(S, `HH ${I} µA/cm², ${Tc} °C: mínimo posterior (hiperpolarización, mV)`, r.min, v.min, 0.3, false); }
  chk(S, 'HH con los canales de Na⁺ bloqueados (TTX), I = 10: no hay potenciales de acción', spikes(10, 6.3, 80, { gNa: 0 }).sp.length, ref.hh.ttx.length, 0, false);
  { const r = spikes(10, 6.3, 80, { gK: 0 }); ref.hh.tea.forEach((q, i) => chk(S, `HH con K⁺ bloqueado (TEA): pico ${i + 1} a ${q[0].toFixed(2)} ms`, r.sp[i] ? r.sp[i][0] : NaN, q[0], 0.05, false)); }
  { let lo = 0, hi = 20; for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (spikes(mid, 6.3, 300).sp.length >= 3) hi = mid; else lo = mid; } chk(S, 'HH: corriente mínima para disparo repetitivo (≥ 3 picos en 300 ms) frente a la bisección con scipy', (lo + hi) / 2, ref.hh_rheo, 0.02); }
  chk(L, 'HH: frecuencia de disparo a 10 µA/cm² y 6.3 °C: 68 Hz (período de 14.65 ms)', 1000 / (spikes(10, 6.3, 80).sp[2][0] - spikes(10, 6.3, 80).sp[1][0]), 68.3, 0.01);
  chk(L, 'HH: primer pico de 40 mV por encima del reposo (≈ +40 mV, Hodgkin y Huxley 1952)', spikes(10, 6.3, 20).sp[0][1], 40, 0.02);
  chk(L, 'HH en reposo: V = −65 mV es un punto fijo (deriva < 0.01 mV en 20 ms)', HH.run(0, 20, 0.5, 6.3).V[40], -65, 0.01 / 65);
  for (const [k, v] of Object.entries(ref.ghk)) { const cs = { rest: [310.15, 5, 0.04], k20: [310.15, 20, 0.04], pna: [310.15, 5, 1], squid: [291.15, 20, 0.04] }[k], ions = k === 'squid' ? [{ P: 1, z: 1, co: 20, ci: 400 }, { P: cs[2], z: 1, co: 440, ci: 50 }, { P: 0.45, z: -1, co: 560, ci: 40 }] : [{ P: 1, z: 1, co: cs[1], ci: 140 }, { P: cs[2], z: 1, co: 145, ci: 15 }, { P: 0.45, z: -1, co: 110, ci: 10 }];
    chk(S, `Goldman–Hodgkin–Katz (${k}): potencial con corriente neta nula frente a la raíz de scipy.brentq de las corrientes de campo constante`, Bo.ghk(ions, cs[0]), v, 1e-9, false); }
  chk(L, 'Nernst del K⁺ a 37 °C con 5 mM fuera y 140 mM dentro: −89 mV', Bo.nernst(1, 5, 140, 310.15) * 1e3, -89.06, 1e-3);
  chk(L, 'Nernst del Na⁺ a 37 °C con 145 mM fuera y 15 mM dentro: +60.6 mV', Bo.nernst(1, 145, 15, 310.15) * 1e3, 60.63, 1e-3);
  chk(L, 'Nernst del Cl⁻ a 37 °C con 110 fuera y 10 dentro: −64 mV', Bo.nernst(-1, 110, 10, 310.15) * 1e3, -64.1, 2e-3);
  chk(L, 'potencial de reposo del axón de calamar de Hodgkin–Katz (1949): cercano a −60 mV con P_Na/P_K = 0.04', Bo.ghk([{ P: 1, z: 1, co: 20, ci: 400 }, { P: 0.04, z: 1, co: 440, ci: 50 }, { P: 0.45, z: -1, co: 560, ci: 40 }], 291.15) * 1e3, -62, 0.1);
  chk(L, 'ΔG de la hidrólisis del ATP en una célula (5 mM ATP, 0.25 mM ADP, 5 mM Pi, 25 °C): −51 kJ/mol', Bo.dG(-30.5e3, (0.25e-3 * 5e-3) / 5e-3, 298.15) / 1e3, -51.1, 2e-3);
  chk(L, 'K′ de la hidrólisis del ATP con ΔG°′ = −30.5 kJ/mol a 25 °C: 2.2×10⁵ M', Bo.K(-30.5e3, 298.15), 2.2e5, 0.02);
  chk(L, 'acoplamiento: glucosa + ATP → glucosa-6-P + ADP tiene ΔG°′ = 13.8 − 30.5 = −16.7 kJ/mol', 13.8 + Bo.LADDER.find((q) => q.id === 'atp').g, -16.7, 1e-9);
  { const g = (id) => Bo.LADDER.find((q) => q.id === id).g; chk(L, 'el ATP es un intermediario: transfiere fosfato desde los donadores de alta energía (PEP, 1,3-BPG, fosfocreatina, ΔG°′ < −43 kJ/mol) a los aceptores (G6P, glicerol-3-P, > −14 kJ/mol)', (g('atp') < g('g6p') && g('atp') > g('cp') && g('atp') > g('bpg') && g('atp') > g('pep')) ? 1 : 0, 1, 0, false); }
  chk(L, 'E°′ del O₂/H₂O a pH 7 desde E° = 1.229 V: 0.815 V (Lehninger 0.816)', Bo.Epr(1.229, 4, 4, 7, 298.15), 0.816, 2e-3);
  chk(L, 'E°′ del H⁺/H₂ a pH 7: −0.414 V', Bo.Epr(0, 2, 2, 7, 298.15), -0.414, 1e-3);
  chk(L, 'ΔG°′ de NADH + ½O₂ + H⁺ → NAD⁺ + H₂O con ΔE°′ = 1.135 V: −219 kJ/mol (Lehninger −220)', Bo.dGredox(2, 0.815 - (-0.320)) / 1e3, -220, 6e-3);
  chk(L, 'fuerza protón-motriz típica mitocondrial: 150 mV + 59·0.75 = 194 mV', Bo.pmf(0.150, 0.75, 298.15) * 1e3, 194.4, 1e-3);
  chk(L, 'protones mínimos por ATP con ΔG = 55 kJ/mol y Δp = 194 mV: 2.9', Bo.nmin(55e3, Bo.pmf(0.150, 0.75, 298.15)), 2.94, 5e-3);
  chk(L, 'P/O con anillo c₈ (2.67 + 1 H⁺ por ATP) y 10 H⁺ bombeados: 2.73', Bo.PO(8), 2.727, 1e-3);
  chk(L, 'P/O con anillo c₁₀ (3.33 + 1): 2.31', Bo.PO(10), 2.308, 1e-3);
  { const V = -0.07, T = 310.15, dGpump = 3 * (Bo.R * T * Math.log(145 / 15) - Bo.F * V) + 2 * (Bo.R * T * Math.log(140 / 5) + Bo.F * V);
    chk(L, 'bomba Na⁺/K⁺ a −70 mV: ΔG por ciclo (3 Na⁺ y 2 K⁺) coincide con la suma de los términos de Nernst y eléctrico', Bo.dGmove(1, 15, 145, -V, T) * 3 / 1e3 + Bo.dGmove(1, 5, 140, V, T) * 2 / 1e3, dGpump / 1e3, 1e-9); chk(L, 'bomba Na⁺/K⁺: ΔG por ciclo con [Na]ᵢ 15, [Na]ₒ 145, [K]ᵢ 140, [K]ₒ 5 mM a −70 mV (kJ/mol)', dGpump / 1e3, 41.49, 1e-3);
    chk(L, 'SGLT (2 Na⁺) a −70 mV: acumulación máxima de glucosa de 1.8×10⁴ (del orden de 10⁴ de la literatura)', Bo.maxAccum(2, Bo.dGmove(1, 145, 15, V, T), T), 1.76e4, 0.01); }
}

const out = { fecha: new Date().toISOString().slice(0, 10), ok, bad, rows };
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify(out, null, 1));
console.log(`${ok} correctas, ${bad} fallas de ${ok + bad}`);
