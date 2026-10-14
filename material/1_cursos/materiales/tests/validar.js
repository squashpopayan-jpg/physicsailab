/* Validación de la biblioteca científica (src/core/30-mat.js).
   1) contra referencias independientes calculadas con SciPy (tests/referencias.json)
   2) contra datos tabulados de la literatura (Callister, ICDD, CRC, Sze).
   Ejecutar: node tests/validar.js   (python tests/referencias.py antes, si cambió) */
const path = require('path');
const fs = require('fs');
const MAT = require(path.join(__dirname, '../src/core/30-mat.js'));
const ref = require('./referencias.json');
let ok = 0, bad = 0;
const rows = [];
function chk(group, name, got, exp, tol, rel = true) {
  const err = rel ? Math.abs(got - exp) / Math.max(1e-300, Math.abs(exp)) : Math.abs(got - exp);
  const pass = isFinite(got) && err <= tol;
  pass ? ok++ : bad++;
  rows.push({ group, name, got, exp, tol: (rel ? 'rel ' : 'abs ') + tol, pass });
  if (!pass) console.log('FALLA', group, '·', name, 'obtenido', got, 'esperado', exp);
}
/* ---- 1. SciPy ---- */
const S = 'SciPy';
for (const [x, v] of Object.entries(ref.erf)) chk(S, `erf(${x})`, MAT.erf(+x), v, 1e-12);
for (const [x, v] of Object.entries(ref.erfc)) chk(S, `erfc(${x})`, MAT.erfc(+x), v, 1e-10);
for (const [x, v] of Object.entries(ref.erfinv)) chk(S, `erf⁻¹(${x})`, MAT.erfinv(+x), v, 1e-10);
for (const [x, v] of Object.entries(ref.gamma)) chk(S, `Γ(${x})`, MAT.gamma(+x), v, 1e-12);
for (const [k, v] of Object.entries(ref.debye)) { const [T, th] = k.split(',').map(Number); chk(S, `Debye C/3Nk, T=${T} K, Θ=${th} K`, MAT.debyeCv(T, th), v, 1e-6); }
for (const [T, v] of Object.entries(ref.meanField)) chk(S, `campo medio m(T=${T} K, Tc=1043 K)`, MAT.meanFieldM(+T, 1043), v, 1e-8);
for (const [k, v] of Object.entries(ref.brillouin)) { const [J, x] = k.split(',').map(Number); chk(S, `Brillouin J=${J}, x=${x}`, MAT.brillouin(J, x), v, 1e-12); }
for (const [x, v] of Object.entries(ref.langevin)) chk(S, `Langevin(${x})`, MAT.langevin(+x), v, 1e-8);
for (const [k, v] of Object.entries(ref.binodal)) { const [Om, T] = k.split(',').map(Number); chk(S, `binodal Ω=${Om} J/mol, T=${T} K`, MAT.binodal(Om, T)[0], v, 1e-8); }
for (const [T, v] of Object.entries(ref.ni_Si)) chk(S, `n_i(Si, ${T} K)`, MAT.ni(MAT.semi.Si, +T), v, 1e-10);
for (const [k, v] of Object.entries(ref.ntype)) { const [T, Nd] = k.split(',').map(Number); chk(S, `Si tipo n: n(T=${T} K, Nd=${Nd} m⁻³)`, MAT.nType(MAT.semi.Si, T, Nd).n, v, 1e-6); }
for (const [T, v] of Object.entries(ref.bloch)) chk(S, `Bloch–Grüneisen ρ(${T} K)/ρ(Θ)`, MAT.blochGruneisen(+T, 343), v, 1e-5);
chk(S, 'Fresnel incidencia normal 1→1.5', MAT.fresnelR(1, 1.5), ref.fresnel['1,1.5,0'], 1e-12);
const fr = MAT.fresnel(1, 1.5, 45);
chk(S, 'Fresnel R_s a 45°', fr.Rs, ref.fresnel45[0], 1e-12);
chk(S, 'Fresnel R_p a 45°', fr.Rp, ref.fresnel45[1], 1e-12);
chk(S, 'tiempo de carburización (Fick con erf⁻¹)', MAT.fickTime(5e-4, 1.6e-11, 0.25, 1.2, 0.8), ref.fickTime, 1e-8);
chk(S, 't½ de Avrami', MAT.jmakT50(0.02, 2.5), ref.jmakT50, 1e-12);
chk(S, 'ciclos de Paris: fórmula cerrada vs cuadratura', MAT.parisN(1e-12, 3, 1.12, 100, 1e-3, 2e-2), ref.paris, 1e-7);
for (const [p, v] of Object.entries(ref.stoner)) chk(S, `Stoner–Wohlfarth h_sw(${p}°)`, MAT.stonerSwitch(+p), v, 1e-12);

/* ---- 2. Literatura ---- */
const L = 'Literatura';
chk(L, 'APF cúbica simple = π/6', MAT.apf('sc'), 0.5236, 1e-4);
chk(L, 'APF BCC = √3π/8', MAT.apf('bcc'), 0.6802, 1e-4);
chk(L, 'APF FCC = π/(3√2)', MAT.apf('fcc'), 0.7405, 1e-4);
chk(L, 'APF diamante = √3π/16', MAT.apf('diamond'), 0.3401, 1e-4);
chk(L, 'APF HCP ideal = 0.74', MAT.apfHCP(), 0.7405, 1e-4);
const aCu = MAT.cells.fcc.aR(0.128e-9);
chk(L, 'densidad del Cu (Callister, ej. 3.3: 8.89 g/cm³)', MAT.density(4, 63.5, aCu ** 3) / 1000, 8.89, 0.005);
chk(L, 'densidad del Fe-α con a = 0.2866 nm (7.87 g/cm³)', MAT.density(2, 55.845, 0.2866e-9 ** 3) / 1000, 7.87, 0.005);
const lam = MAT.lambda.CuKa;
const Al = MAT.reflections('fcc', 0.40495e-9, lam, [1]);
[[38.47, '111'], [44.72, '200'], [65.10, '220'], [78.23, '311']].forEach(([t, hk], i) => chk(L, `Al (${hk}): 2θ con Cu Kα (PDF 04-0787)`, Al[i].tth, t, 0.02, false));
const Fe = MAT.reflections('bcc', 0.28665e-9, lam, [1]);
[[44.67, '110'], [65.02, '200'], [82.33, '211']].forEach(([t, hk], i) => chk(L, `Fe-α (${hk}): 2θ (PDF 06-0696)`, Fe[i].tth, t, 0.02, false));
const Si = MAT.reflections('diamond', 0.543088e-9, lam, [1]);
[[28.44, '111'], [47.30, '220'], [56.12, '311'], [69.13, '400']].forEach(([t, hk], i) => chk(L, `Si (${hk}): 2θ (PDF 27-1402)`, Si[i].tth, t, 0.02, false));
chk(L, 'Si: (200) y (222) prohibidas en la red de diamante', Si.some((r) => r.hkl.join('') === '200' || r.hkl.join('') === '222') ? 1 : 0, 0, 0, false);
const NaCl = MAT.reflections('nacl', 0.56402e-9, lam, [11, 17]);
chk(L, 'NaCl (200): 2θ = 31.70° (PDF 05-0628)', NaCl.find((r) => r.hkl.join('') === '200').tth, 31.70, 0.02, false);
const pdf = [
  ['Al', 'fcc', 0.40495e-9, ['Al'], { 200: 47, 220: 22, 311: 24, 222: 7 }, '04-0787'],
  ['Cu', 'fcc', 0.36150e-9, ['Cu'], { 200: 46, 220: 20, 311: 17 }, '04-0836'],
  ['Fe-α', 'bcc', 0.28665e-9, ['Fe'], { 200: 20, 211: 30 }, '06-0696'],
  ['Si', 'diamond', 0.543088e-9, ['Si'], { 220: 55, 311: 30 }, '27-1402'],
  ['NaCl', 'nacl', 0.56402e-9, ['Na', 'Cl'], { 111: 13, 220: 55, 311: 2, 222: 15, 400: 6, 420: 11 }, '05-0628']
];
for (const [nm, t, a, e, exp, card] of pdf) {
  const pat = MAT.powderPattern(t, a, lam, e, 100);
  for (const [h, I] of Object.entries(exp)) { const r = pat.find((q) => q.hkl.join('') === h); chk(L, `${nm}: intensidad relativa (${h}) ≈ ${I} (PDF ${card}, ±12)`, r ? r.I : NaN, I, 12, false); }
}
for (const el of Object.keys(MAT.cromerMann)) chk(L, `Cromer–Mann: f(0) del ${el} = Z`, MAT.fAtom(el, 0), { Al: 13, Cu: 29, Fe: 26, Si: 14, Na: 11, Cl: 17 }[el], 0.002);
chk(L, 'multiplicidad de {111} = 8', Al[0].mult, 8, 0, false);
chk(L, 'multiplicidad de {311} = 24', Al[3].mult, 24, 0, false);
chk(L, 'Miller de intersecciones (½, 1, ∞) → (210)', +MAT.miller(0.5, 1, Infinity).join(''), 210, 0, false);
chk(L, 'Miller de intersecciones (½, ⅓, ∞) → (230)', +MAT.miller(0.5, 1 / 3, Infinity).join(''), 230, 0, false);
chk(L, 'ángulo entre [100] y [111] = 54.74°', (MAT.angleDir([1, 0, 0], [1, 1, 1]) * 180) / Math.PI, 54.7356, 1e-5);
chk(L, 'FCC: 12 sistemas de deslizamiento {111}⟨110⟩', MAT.fccSlip.length, 12, 0, false);
chk(L, 'Schmid máximo con eje [001] = 1/√6', MAT.maxSchmidFCC([0, 0, 1]).m, 1 / Math.sqrt(6), 1e-12);
chk(L, 'Schmid máximo con eje [111] = 0.272', MAT.maxSchmidFCC([1, 1, 1]).m, 0.2722, 1e-3);
chk(L, 'Schmid máximo con eje [123] = 0.467', MAT.maxSchmidFCC([1, 2, 3]).m, 0.4666, 2e-3);
chk(L, 'Lennard-Jones: r₀ = 2^(1/6) σ', MAT.lj.r0(1), 1.122462, 1e-6);
chk(L, 'Lennard-Jones: F(r₀) = 0', MAT.lj.F(MAT.lj.r0(1), 1, 1), 0, 1e-12, false);
chk(L, 'Lennard-Jones: rigidez U″(r₀) = 57.15 ε/σ²', MAT.lj.k(1, 1), 57.146, 1e-4);
chk(L, 'carácter iónico de NaCl (Pauling 0.93 y 3.16) ≈ 71 %', MAT.ionicPct(0.93, 3.16), 71.1, 0.005);
chk(L, 'vacancias en Cu a 1357 K, Qv = 0.9 eV → 4.6×10⁻⁴ (Callister, ej. 4.1)', MAT.vacancyFraction(0.9, 1357), 4.6e-4, 0.02);
chk(L, 'D del C en Fe-γ a 900 °C = 5.9×10⁻¹² m²/s (Callister, tabla 5.2)', MAT.arrhenius(2.3e-5, 148e3, 1173), 5.9e-12, 0.03);
chk(L, 'D del C en Fe-α a 500 °C = 1.4×10⁻¹² m²/s', MAT.arrhenius(1.1e-6, 87.4e3, 773), 1.4e-12, 0.05);
chk(L, 'ASTM G = 6 → 32 granos/in² a 100×', MAT.astmN(6), 32, 0, false);
chk(L, 'Fe–C 0.40 %C: fracción de perlita (palanca)', MAT.feMicro(0.40).Wpearlite, (0.40 - 0.022) / (0.76 - 0.022), 1e-12);
chk(L, 'Fe–C eutectoide 0.76 %C: ferrita total 0.89 (Callister)', MAT.feMicro(0.76).Walpha, 0.89, 0.01);
chk(L, 'Fe–C 1.20 %C: cementita proeutectoide 0.074', MAT.feMicro(1.2).Wpro, (1.2 - 0.76) / (6.70 - 0.76), 1e-12);
const ps = MAT.pbsnState(40, 150);
chk(L, 'Pb–Sn 40 %Sn a 150 °C: Wα = 0.67 (Callister, ej. 9.2)', ps.phases[0].W, 0.67, 0.02);
chk(L, 'Pb–Sn 40 %Sn bajo la eutéctica: α primaria 0.50 (Callister, ej. 9.3)', MAT.pbsnMicro(40).Wp, 0.50, 0.01);
chk(L, 'Pb–Sn 61.9 %Sn: totalmente eutéctica', MAT.pbsnMicro(61.9).We, 1, 1e-12);
const cn = MAT.idealLens(1523, MAT.CuNi.TA, MAT.CuNi.TB, MAT.CuNi.HA, MAT.CuNi.HB);
const toW = (x) => (100 * x * 58.69) / (x * 58.69 + (1 - x) * 63.55);
const cu = MAT.cuniState(35, 1250);
chk(L, 'Cu–Ni 35 %Ni a 1250 °C: C_L = 31.5 %Ni (Callister, ej. 9.2)', cu.phases[0].C, 31.5, 1.0, false);
chk(L, 'Cu–Ni 35 %Ni a 1250 °C: C_α = 42.5 %Ni (Callister, ej. 9.2)', cu.phases[1].C, 42.5, 1.0, false);
chk(L, 'Cu–Ni 35 %Ni a 1250 °C: W_L = 0.68 (Callister, ej. 9.2)', cu.phases[0].W, 0.68, 0.05);
chk(L, 'Cu–Ni con solución ideal: desviación del líquido < 7 %peso (no idealidad real)', toW(cn[1]), 32, 7, false);
chk(L, 'Cu–Ni con solución ideal: desviación del sólido < 7 %peso', toW(cn[0]), 43, 7, false);
chk(L, 'Cu–Ni ideal: coherencia x_L = k_B x_S', cn[1] / cn[0], Math.exp((MAT.CuNi.HB / 8.314462618) * (1 / 1728 - 1 / 1523)), 1e-12);
chk(L, 'regla de fases: binario bifásico a P fija → F = 1', MAT.gibbsF(2, 2), 1, 0, false);
chk(L, 'solución regular: T crítica = Ω/2R', MAT.Tcrit(20000), 20000 / (2 * 8.314462618), 1e-12);
const nuc = MAT.nucleation(0.132, 1.16e9, 1064 + 273, 230);
chk(L, 'oro, nucleación homogénea: r* = 1.32 nm (Callister, ej. 10.1)', nuc.rStar * 1e9, 1.32, 0.01);
chk(L, 'oro, nucleación homogénea: ΔG* = 9.64×10⁻¹⁹ J (Callister, ej. 10.1)', nuc.Gstar, 9.64e-19, 0.01);
chk(L, 'factor heterogéneo S(θ = 90°) = ½', MAT.hetFactor(90), 0.5, 1e-12);
chk(L, 'Ms de Andrews, 0.4 C – 0.7 Mn = 348.5 °C', MAT.MsAndrews(0.4, 0.7), 348.5, 1e-3);
chk(L, 'Brinell: 3000 kg, D = 10 mm, d = 4 mm → 229 HB', MAT.brinell(3000, 10, 4), 229, 0.005);
chk(L, 'Griffith, vidrio E=69 GPa, γ=0.3 J/m², a=2 µm → 81 MPa', MAT.griffith(69e9, 0.3, 2e-6) / 1e6, 81.1, 0.005);
chk(L, 'grieta crítica: KIc = 50 MPa√m, σ = 500 MPa, Y = 1 → 3.18 mm', MAT.critCrack(50, 1, 500) * 1e3, 3.18, 0.005);
chk(L, 'Inglis con a/ρ = 100 → K_t = 21', MAT.inglis(100, 1), 21, 1e-12);
chk(L, 'Larson–Miller: 1000 K y 1000 h (C = 20) → 23 000', MAT.lmp(1000, 1000), 23000, 1e-12);
chk(L, 'Pilling–Bedworth Al₂O₃/Al = 1.28', MAT.pillingBedworth(101.96, 3950, 26.98, 2700, 2), 1.29, 0.01);
chk(L, 'Pilling–Bedworth MgO/Mg = 0.81', MAT.pillingBedworth(40.30, 3580, 24.305, 1740, 1), 0.81, 0.01);
chk(L, 'pila Zn–Cu estándar = 1.103 V', MAT.E0['Cu²⁺/Cu'] - MAT.E0['Zn²⁺/Zn'], 1.103, 1e-9);
chk(L, 'Nernst: Fe²⁺ 10⁻³ M → −0.529 V', MAT.nernst(-0.44, 2, 1 / 0.001), -0.5287, 1e-3);
chk(L, 'Fe: 1 µA/cm² ≈ 0.0116 mm/año (ASTM G102)', MAT.corrRate(0.01, 55.845, 2, 7870), 0.0116, 0.01);
chk(L, 'Debye: T = Θ_D → C_v = 0.952·3R (tabla de la función de Debye)', MAT.debyeCv(343, 343), 0.952, 0.002);
chk(L, 'Einstein a T = Θ_E → 0.9207', MAT.einsteinCv(1, 1), 0.92067, 1e-4);
chk(L, 'Wiedemann–Franz Cu: σ = 5.96×10⁷ S/m, 293 K → 426 W/m·K', MAT.wfK(5.96e7, 293), 426, 0.01);
chk(L, 'n_i del Si a 300 K ≈ 1.0×10¹⁶ m⁻³ (Green 1990; Altermatt 2003: 9.65×10⁹ cm⁻³)', MAT.ni(MAT.semi.Si, 300), 1.0e16, 0.15);
chk(L, 'E_g del Si a 300 K = 1.124 eV (Varshni)', MAT.Eg(MAT.semi.Si, 300), 1.124, 0.003);
chk(L, 'E_g del GaAs a 300 K = 1.422 eV', MAT.Eg(MAT.semi.GaAs, 300), 1.422, 0.003);
chk(L, 'Si tipo n, Nd = 10²¹ m⁻³ a 300 K: n ≈ Nd (saturación)', MAT.nType(MAT.semi.Si, 300, 1e21).n, 1e21, 0.01);
chk(L, 'movilidad de electrones en Si poco dopado ≈ 0.141 m²/V·s', MAT.mobilitySi(1e19, 'n'), 0.141, 0.01);
chk(L, 'longitud de onda de corte del Si (1.12 eV) = 1107 nm', MAT.gapToNm(1.12), 1107, 0.002);
chk(L, 'BK7: n_d (587.6 nm) = 1.5168 (Schott)', MAT.sellmeierBK7(0.5876), 1.5168, 1e-4);
chk(L, 'sílice fundida: n (589.3 nm) = 1.4584 (Malitson)', MAT.sellmeierSiO2(0.5893), 1.4584, 1e-4);
chk(L, 'Fresnel, vidrio n = 1.5 → R = 4 %', MAT.fresnelR(1, 1.5), 0.04, 1e-12);
chk(L, 'ángulo de Brewster 1→1.5 (56.31°): R_p = 0', MAT.fresnel(1, 1.5, 56.30993247).Rp, 0, 1e-9, false);
chk(L, 'Fe²⁺ espín solo (4 e⁻ desapareados): 4.90 μ_B', MAT.spinOnly(4), 4.899, 1e-3);
chk(L, 'Clausius–Mossotti: Nα/3ε₀ = 0.25 → ε_r = 2', MAT.clausiusMossotti(0.25 * 3 * 8.8541878128e-12, 1), 2, 1e-12);
chk(L, 'Voigt: Ef = 230, Em = 3.4 GPa, Vf = 0.6 → 139.4 GPa', MAT.voigt(230, 3.4, 0.6), 139.36, 1e-4);
chk(L, 'Reuss con las mismas fases → 8.32 GPa', MAT.reuss(230, 3.4, 0.6), 8.316, 0.001);
chk(L, 'Halpin–Tsai: ξ → 0 reproduce Reuss', MAT.halpinTsai(230, 3.4, 0.6, 1e-12), MAT.reuss(230, 3.4, 0.6), 1e-6);
chk(L, 'Halpin–Tsai: ξ → ∞ reproduce Voigt', MAT.halpinTsai(230, 3.4, 0.6, 1e9), MAT.voigt(230, 3.4, 0.6), 1e-6);
chk(L, 'longitud crítica: σf = 3.5 GPa, d = 7 µm, τc = 40 MPa → 0.306 mm', MAT.critLength(3.5e9, 7e-6, 40e6) * 1e3, 0.30625, 1e-9);
chk(L, 'Flory: Mw/Mn → 2 cuando p → 1', MAT.floryMw(0.9999) / MAT.floryMn(0.9999), 2, 1e-3);
chk(L, 'WLF: a_T(Tg) = 1', MAT.wlf(373, 373), 1, 1e-12);
chk(L, 'WLF: log a_T a Tg + 10 K = −2.83', Math.log10(MAT.wlf(383, 373)), (-17.44 * 10) / 61.6, 1e-9);
chk(L, 'cristalinidad PE: ρs=0.925, ρc=1.000, ρa=0.870 → 45.7 %', MAT.crystallinity(0.925, 1.0, 0.87), 0.4573, 0.002);
const tn = MAT.tensile({ E: 200e9, sy: 300e6, n: 0.2, efrac: 0.45 });
chk(L, 'Considère con elasticidad: ε_verd,u = n + (1 − n) σ_u/E', Math.log(1 + tn.eu), 0.2 + 0.8 * (tn.K * Math.pow(0.2, 0.2)) / 200e9, 0.002);
chk(L, 'Weibull: σ = σ₀ → P_f = 1 − 1/e', MAT.weibull(1, 1, 10), 1 - Math.exp(-1), 1e-12);
chk(L, 'Scherrer: β = 0.2°, 2θ = 38.47°, Cu Kα → 41.9 nm', MAT.scherrer(lam, (0.2 * Math.PI) / 180, 38.47) * 1e9, 41.9, 0.005);
chk(L, 'G isótropo del acero (E = 207 GPa, ν = 0.30) = 79.6 GPa', MAT.G(207, 0.3), 79.6, 0.001);
chk(L, 'Koistinen–Marburger: 100 °C bajo Ms → 66.7 %', MAT.koistinen(300, 200), 1 - Math.exp(-1.1), 1e-12);
for (const sym of Object.keys(MAT.elements)) chk(L, `densidad teórica de ${sym} vs medida (Callister, tabla 3.1)`, MAT.elementDensity(sym), MAT.elements[sym][3], 0.025);
chk(L, 'cociente de radios límite NC 3 = 0.155', MAT.ratioLimits[3], 0.155, 0.003);
chk(L, 'cociente de radios límite NC 4 = 0.225', MAT.ratioLimits[4], 0.225, 0.003);
chk(L, 'cociente de radios límite NC 6 = 0.414', MAT.ratioLimits[6], 0.414, 0.001);
chk(L, 'cociente de radios límite NC 8 = 0.732', MAT.ratioLimits[8], 0.732, 0.001);
const aNaCl = 2 * (0.102 + 0.181) * 1e-9;
chk(L, 'densidad del NaCl con radios iónicos (Callister, ej. 12.3: 2.14 g/cm³)', MAT.density(4, 22.99 + 35.45, aNaCl ** 3) / 1000, 2.14, 0.01);
chk(L, 'ASTM E112: N = 2^(G−1) a 100× equivale a la fórmula por mm² a 1× (G = 6)', MAT.astmFromNA(32 * 10000 / 645.16), 6, 0.002, false);
chk(L, 'ASTM E112: G = 6 ↔ intercepto medio 0.0400 mm (tabla 4 de E112)', MAT.astmFromL(0.0400), 6, 0.05, false);
chk(L, 'hueco octaédrico FCC = 0.414 R', MAT.holes.fcc.oct, 0.414, 0.001);
chk(L, 'hueco tetraédrico BCC = 0.291 R', MAT.holes.bcc.tet, 0.291, 0.002);
chk(L, 'hueco octaédrico BCC = 0.155 R', MAT.holes.bcc.oct, 0.155, 0.003);
const utsTab = { 'Acero de bajo carbono recocido': 395, 'Acero 4340 revenido a 315 °C': 1720, 'Acero inoxidable 304 recocido': 515, 'Cobre recocido': 220, 'Aluminio 2024-T3': 485 };
for (const [k, u] of Object.entries(utsTab)) { const [K, n] = MAT.hollomonData[k]; chk(L, `Considère con K y n de Callister (tabla 6.4) predice la resistencia de ${k} ≈ ${u} MPa (±22 %)`, MAT.utsHollomon(K, n), u, 0.22); }
const t2 = MAT.tensile({ E: 207e9, sy: 250e6, K: 600e6, n: 0.21, efrac: 0.36 });
chk(L, 'modelo de tracción con meseta: la estricción sigue en ε_verd ≈ n', Math.log(1 + t2.eu), 0.21 + 0.79 * (600e6 * Math.pow(0.21, 0.21)) / 207e9, 0.002);
chk(L, 'modelo de tracción: σ_u numérico = K nⁿ e⁻ⁿ', t2.uts, MAT.utsHollomon(600e6, 0.21), 0.01);
{
  const s1 = MAT.feState(0.35, 726);
  chk(L, 'Fe–C 0.35 %C a 726 °C: α total 0.95 (Callister, ej. 9.5)', s1.phases[0].W, 0.95, 0.01);
  chk(L, 'Fe–C 0.35 %C a 726 °C: Fe₃C 0.05 (Callister, ej. 9.5)', s1.phases[1].W, 0.05, 0.1);
  chk(L, 'Fe–C 0.35 %C: ferrita proeutectoide 0.56 (Callister, ej. 9.5)', 1 - MAT.feMicro(0.35).Wpearlite, 0.56, 0.01);
  chk(L, 'Fe–C 0.35 %C a 1000 °C: austenita sola', MAT.feState(0.35, 1000).region === 'γ' ? 1 : 0, 1, 0, false);
  chk(L, 'Fe–C 1.0 %C a 750 °C: γ + Fe₃C', MAT.feState(1.0, 750).region === 'γ + Fe₃C' ? 1 : 0, 1, 0, false);
  chk(L, 'Fe–C 0.4 %C a 780 °C: α + γ', MAT.feState(0.4, 780).region === 'α + γ' ? 1 : 0, 1, 0, false);
  chk(L, 'Fe–C 3.0 %C a 1200 °C: γ + L', MAT.feState(3.0, 1200).region === 'γ + L' ? 1 : 0, 1, 0, false);
  chk(L, 'Fe–C 0.1 %C a 1500 °C: δ + L', MAT.feState(0.1, 1500).region === 'δ + L' ? 1 : 0, 1, 0, false);
}
chk(L, 'CCT por aditividad sobre el TTT: velocidad crítica de temple del acero eutectoide ≈ 140 °C/s (Callister, fig. 10.27; ±25 %)', MAT.criticalRate(), 140, 0.25);
chk(L, 'TTT eutectoide: nariz de la perlita ≈ 0.7 s cerca de 540 °C', MAT.tStartTTT(540), 0.7, 0.05);
for (const g of Object.values(MAT.glasses)) { const f = MAT.vftFit([[g[1], 3], [g[2], Math.log10(4e6)], [g[3], 12]]); chk(L, `VFT ajustada a 3 puntos predice el punto de deformación de ${g[0]} ≈ ${g[4]} °C (±3 %)`, MAT.vftT(f, Math.log10(3e13)), g[4], 0.03); }
chk(L, 'porosidad: E de alúmina con P = 0.05 → 357 GPa (Callister)', 393 * (1 - 1.9 * 0.05 + 0.9 * 0.05 * 0.05), 357, 0.002);
for (const th of [0, 10, 30, 45, 60, 90]) chk(L, `laminados: una sola lámina rotada ${th}° reproduce la fórmula fuera de eje`, MAT.laminateEx(140, 10, 5, 0.3, [th]), MAT.offAxisE(140, 10, 5, 0.3, th), 1e-9);
chk(L, 'laminado [0/±45/90] cuasiisótropo: E_x igual a 0° y a 30°', MAT.laminateEx(140, 10, 5, 0.3, [0, 45, -45, 90], 30), MAT.laminateEx(140, 10, 5, 0.3, [0, 45, -45, 90], 0), 1e-9);
chk(L, 'compuesto vidrio–poliéster V_f = 0.4: E longitudinal 29.6 GPa (Callister, ej. 16.1)', MAT.voigt(69, 3.4, 0.4), 29.6, 0.002);
chk(L, 'compuesto vidrio–poliéster V_f = 0.4: E transversal 5.5 GPa (Callister, ej. 16.2)', MAT.reuss(69, 3.4, 0.4), 5.5, 0.005);
chk(L, 'Bloch–Grüneisen (Θ = 343 K): ρ(80 K)/ρ(293 K) del Cu ≈ 0.128 (Matula 1979; ±10 %)', MAT.blochGruneisen(80, 343) / MAT.blochGruneisen(293, 343), 0.128, 0.1);
chk(L, 'Drude: tiempo de relajación del Cu a 293 K ≈ 2.5×10⁻¹⁴ s', 9.1093837015e-31 * 5.96e7 / (8.47e28 * MAT.eV ** 2), 2.5e-14, 0.01);
chk(L, 'Debye a baja T: ley T³ de Debye, C_v = (12π⁴/5) R (T/Θ)³', 3 * MAT.debyeCv(10, 343), ((12 * Math.PI ** 4) / 5) * (10 / 343) ** 3, 1e-4);
chk(L, 'Debye: c del Cu a 300 K ≈ 0.385 J/g·K medido (C_v armónico, ±6 %)', (3 * MAT.R * MAT.debyeCv(300, 343)) / 63.55, 0.385, 0.06);
chk(L, 'Debye: c del Al a 300 K ≈ 0.900 J/g·K medido (C_v armónico, ±8 %)', (3 * MAT.R * MAT.debyeCv(300, 428)) / 26.98, 0.9, 0.08);
chk(L, 'choque térmico del vidrio sílice-sosa-cal ≈ 86 K', MAT.thermalShock(69e6, 69e9, 9e-6, 0.23), 85.6, 0.01);
{ const n = MAT.sellmeierBK7, s = MAT.sellmeierSiO2; chk(L, 'número de Abbe del BK7 = 64.17 (Schott)', (n(0.5876) - 1) / (n(0.4861) - n(0.6563)), 64.17, 0.002); chk(L, 'número de Abbe de la sílice fundida = 67.8', (s(0.5876) - 1) / (s(0.4861) - s(0.6563)), 67.8, 0.003); }
chk(L, 'placa sin absorción, R = 4 % por cara: T = (1 − R)/(1 + R) = 92.3 %', MAT.slabT(0.04, 0, 0.01), 0.96 / 1.04, 1e-12);
{ const r = MAT.mixedPotential(-0.763, 1e-3, 0.09, 0, 1e-6, 0.08); chk(L, 'Zn en ácido: E_corr = −0.486 V (Callister, ej. 17.4)', r.Ecorr, -0.486, 0.002); chk(L, 'Zn en ácido: i_corr = 1.19×10⁻⁴ A/cm² (Callister, ej. 17.4)', r.icorr / 1e4, 1.19e-4, 0.01); }
chk(L, 'pila Ni/Cd con [Cd²⁺] = 0.5 M y [Ni²⁺] = 10⁻³ M: 0.073 V (Callister, ej. 17.2)', MAT.E0['Ni²⁺/Ni'] - MAT.E0['Cd²⁺/Cd'] - ((MAT.R * 298.15) / (2 * MAT.F)) * Math.log(0.5 / 1e-3), 0.073, 0.01);
{ const me = 9.1093837015e-31, V = 2e5; chk(L, 'longitud de onda relativista de electrones a 200 kV = 2.508 pm', 6.62607015e-34 / Math.sqrt(2 * me * MAT.eV * V * (1 + (MAT.eV * V) / (2 * me * 299792458 ** 2))) * 1e12, 2.508, 0.001); }
chk(L, 'base de datos: 38 materiales', MAT.db.length, 38, 0, false);

fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), ok, bad, rows }, null, 1));
console.log(`\n${ok}/${ok + bad} pruebas superadas`);
process.exit(bad ? 1 : 0);
