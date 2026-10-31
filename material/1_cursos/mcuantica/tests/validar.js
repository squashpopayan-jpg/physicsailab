/* Validación de la biblioteca científica (src/core/*.js).
   1) contra referencias independientes: SciPy, NumPy, SymPy, mpmath (tests/referencias.py → referencias.json)
   2) contra resultados exactos y datos de la literatura.
   3) cifras de las soluciones de los problemas (tests/problemas.py → problemas.json).
   Ejecutar: python tests/referencias.py ; python tests/problemas.py ; node tests/validar.js */
const path = require('path');
const fs = require('fs');
const core = (f) => require(path.join(__dirname, '../src/core', f));
core('30-linalg.js'); core('31-numerics.js'); core('32-schrod1d.js');
const ORIG = core('33-qm-orig.js');
const WV = core('34-qm-wave.js');
const POT = core('37-qm-pot.js');
const SC = core('38-qm-scat.js');
const HOL = core('39-qm-ho.js');
const BD = core('40-qm-band.js');
const ANG = core('41-qm-ang.js');
const CEN = core('42-qm-central.js');
const HY = core('43-qm-hyd.js');
const SPN = core('44-qm-spin.js');
const CPL = core('45-qm-couple.js');
const MAG = core('46-qm-mag.js');
const SYM = core('47-qm-sym.js');
const PRT = core('48-qm-pert.js');
const FIN = core('49-qm-fina.js');
const VAR = core('50-qm-var.js');
const WKB = core('51-qm-wkb.js');
const TDP = core('52-qm-tdep.js');
const S3 = core('53-qm-scat3d.js');
const IDN = core('54-qm-ident.js');
const HFA = core('55-qm-hf.js');
const SQN = core('56-qm-secq.js');
const QI = core('57-qm-qinfo.js');
const QC = core('58-qm-qcomp.js');
const FLD = core('59-qm-field.js');
const PTH = core('60-qm-path.js');
const DIR = core('61-qm-dirac.js');
const ref = require('./referencias.json');
const EM = globalThis.EM, P = EM.P, K = EM.qm.K;
let ok = 0, bad = 0;
const rows = [];
function chk(group, name, got, exp, tol, rel = true) {
  const err = rel ? Math.abs(got - exp) / Math.max(1e-300, Math.abs(exp)) : Math.abs(got - exp);
  const pass = isFinite(got) && err <= tol;
  pass ? ok++ : bad++;
  rows.push({ group, name, got, exp, tol: (rel ? 'rel ' : 'abs ') + tol, pass });
  if (!pass) console.log('FALLA', group, '·', name, 'obtenido', got, 'esperado', exp, 'err', err);
}
const S = 'SciPy y NumPy', M_ = 'mpmath', Y = 'SymPy', L = 'Literatura';

/* ---- Cap. 1 ---- */
for (const [k, v] of Object.entries(ref.planck)) { const [l, T] = k.split('_'); chk(S, `Radiancia de Planck B_λ a λ = ${l} m, T = ${T} K`, ORIG.planckLambda(+l, +T), v, 1e-9); }
chk(S, 'Constante de Wien b', K.b_wien, ref.wien_b, 1e-9);
chk(S, 'Constante de Stefan–Boltzmann σ', K.sigma, ref.sigma, 1e-9);
chk(S, 'σ = 2π⁵k⁴/(15h³c²) a partir de h, c, k_B', ORIG.sigmaFromConstants(), ref.sigma_from_const, 1e-12);
for (const [T, v] of Object.entries(ref.band)) chk(S, `Fracción de la emitancia en 380–780 nm a ${T} K (scipy.integrate.quad)`, ORIG.bandFraction(380e-9, 780e-9, +T), v, 1e-7);
{ let x = 5; for (let i = 0; i < 80; i++) x = 5 * (1 - Math.exp(-x)); chk(S, 'Raíz de Wien x = 5(1 − e⁻ˣ) (brentq)', x, ref.wien_x, 1e-12); chk(L, 'λ_máx T = hc/(x k_B)', (K.h * K.c) / (x * K.kB), K.b_wien, 1e-8); }
chk(M_, '∫ x³/(eˣ − 1) dx = π⁴/15 (mpmath.quad)', ORIG.bose3(), ref.bose3, 1e-9);
chk(L, '∫ x³/(eˣ − 1) dx = π⁴/15 (valor exacto)', ORIG.bose3(), Math.PI ** 4 / 15, 1e-9);
chk(S, 'Longitud de onda Compton h/(m_e c)', ORIG.comptonWavelength(), ref.compton_lambda, 1e-9);
for (const [k, v] of Object.entries(ref.compton_KE)) { const [l, t] = k.split('_'); chk(S, `Energía cinética Compton: λ = ${(+l * 1e12).toPrecision(5)} pm, θ = ${t}°`, ORIG.comptonKE(+l, +t * Math.PI / 180), v, 1e-8); }
for (const [k, v] of Object.entries(ref.compton_recoil)) { const [l, t] = k.split('_'); chk(S, `Ángulo de retroceso Compton: λ = ${(+l * 1e12).toPrecision(5)} pm, θ = ${t}° (desde las componentes del momento)`, ORIG.comptonRecoil(+l, +t * Math.PI / 180) * 180 / Math.PI, v, 1e-8); }
const MS = { p: K.mp, d: K.md, a: 6.6446573357e-27 };
for (const [k, v] of Object.entries(ref.bohr)) { const [ni, nf, Z, n] = k.split('_'); chk(S, `Bohr: λ(${ni}→${nf}) con Z = ${Z} y núcleo ${n === 'p' ? 'p' : n === 'd' ? 'd' : 'α'} (masa reducida)`, ORIG.bohrLambdaNm(+ni, +nf, +Z, MS[n]), v, 1e-7); }
chk(S, 'Energía del estado fundamental de Bohr (núcleo infinito)', ORIG.bohrE(1), ref.bohr_E1.inf, 1e-9);
chk(S, 'Energía del estado fundamental de Bohr (protón, masa reducida)', ORIG.bohrE(1, 1, K.mp), ref.bohr_E1.p, 1e-9);
chk(S, 'Radio de Bohr a₀', ORIG.bohrRadius(1), ref.bohr_r1, 1e-9);
for (const [V, v] of Object.entries(ref.debroglie)) chk(S, `λ de de Broglie relativista del electrón a ${V} V`, ORIG.electronLambda(+V), v, 1e-9);
chk(S, 'λ de de Broglie de un neutrón térmico (300 K)', ORIG.deBroglie(1.5 * K.kB * 300, K.mn), ref.debroglie_n, 1e-9);
chk(L, 'Davisson–Germer: λ(54 V) = 0.1669 nm', ORIG.electronLambda(54) * 1e9, 0.1669, 2e-3);
chk(L, 'Davisson–Germer: primer máximo de Bragg para d = 0.215 nm ≈ 50.9°', ORIG.braggAngle(ORIG.electronLambda(54), 0.215e-9) * 180 / Math.PI, 50.9, 2e-3);
chk(L, 'Hα del hidrógeno con masa reducida: 656.470 nm (vacío)', ORIG.bohrLambdaNm(3, 2, 1, K.mp), 656.470, 1e-5);
chk(L, 'Desplazamiento isotópico de Hα (H − D) ≈ 0.179 nm (Urey 1932)', ORIG.bohrLambdaNm(3, 2, 1, K.mp) - ORIG.bohrLambdaNm(3, 2, 1, K.md), 0.1786, 1e-2);
chk(L, 'Límite de Balmer 364.7 nm', ORIG.bohrLambdaNm(1e9, 2, 1, K.mp), 364.705, 1e-5);

/* ---- Cap. 3 ---- */
{
  const f = ref.fft, re = Float64Array.from(f.inr), im = Float64Array.from(f.ini);
  WV.fft(re, im, false);
  let e1 = 0; for (let i = 0; i < re.length; i++) e1 = Math.max(e1, Math.abs(re[i] - f.re[i]), Math.abs(im[i] - f.im[i]));
  chk(S, 'FFT radix-2 (64 puntos): error máximo frente a numpy.fft.fft', e1, 0, 1e-12, false);
  WV.fft(re, im, true); let e2 = 0; for (let i = 0; i < re.length; i++) e2 = Math.max(e2, Math.abs(re[i] - f.inr[i]), Math.abs(im[i] - f.ini[i]));
  chk(S, 'FFT inversa recupera la señal original', e2, 0, 1e-13, false);
  const g = ref.gauss_free, [gr, gi] = WV.gaussFree(Float64Array.from(g.x), g.t, g.x0, g.s0, g.k0);
  let e3 = 0; for (let i = 0; i < gr.length; i++) e3 = Math.max(e3, Math.abs(gr[i] - g.re[i]), Math.abs(gi[i] - g.im[i]));
  chk(S, 'Paquete gaussiano libre exacto ψ(x,t) (16 puntos): error máximo frente a la evolución espectral de numpy', e3, 0, 1e-9, false);
  for (const [t, v] of Object.entries(ref.gauss_width)) chk(S, `Anchura σ(t) del paquete libre a t = ${t} (σ₀ = 1.3)`, WV.freeWidth(1.3, +t), v, 1e-12);
  /* Operador dividido y Crank–Nicolson contra la solución exacta */
  const N = 1024, LL = 80, x = Float64Array.from({ length: N }, (_, i) => -LL / 2 + (LL * i) / N), g0 = WV.gaussFree(x, 0, g.x0, g.s0, g.k0), ex = WV.gaussFree(x, g.t, g.x0, g.s0, g.k0);
  const op = new WV.SplitOp(x, () => 0, 0.005); const a = Float64Array.from(g0[0]), b = Float64Array.from(g0[1]);
  for (let i = 0; i < 500; i++) op.step(a, b);
  let e4 = 0, n4 = 0; for (let i = 0; i < N; i++) { e4 = Math.max(e4, Math.abs(a[i] - ex[0][i]), Math.abs(b[i] - ex[1][i])); n4 += a[i] * a[i] + b[i] * b[i]; }
  chk(Y, 'Operador dividido (V = 0, 500 pasos): ψ(x, 2.5) frente a la solución exacta', e4, 0, 1e-9, false);
  chk(L, 'Operador dividido conserva la norma (error)', n4 * (LL / N) - 1, 0, 1e-10, false);
  const xc = Float64Array.from({ length: 4000 }, (_, i) => -40 + (80 * (i + 1)) / 4001), cn = new P.q1d.CrankNicolson(xc, () => 0, 0.005);
  let [cr, ci] = WV.gaussFree(xc, 0, g.x0, g.s0, g.k0); for (let i = 0; i < 500; i++) [cr, ci] = cn.step(cr, ci);
  const exc = WV.gaussFree(xc, g.t, g.x0, g.s0, g.k0); let e5 = 0, n5 = 0; for (let i = 0; i < xc.length; i++) { e5 = Math.max(e5, Math.abs(cr[i] - exc[0][i]), Math.abs(ci[i] - exc[1][i])); n5 += cr[i] * cr[i] + ci[i] * ci[i]; }
  chk(Y, 'Crank–Nicolson (V = 0, 500 pasos, h = 0.02): ψ(x, 2.5) frente a la solución exacta (error de orden h²)', e5, 0, 1e-3, false);
  chk(L, 'Crank–Nicolson conserva la norma (unitario)', n5 * (xc[1] - xc[0]) - 1, 0, 1e-10, false);
  const st = WV.stats(x, ex[0], ex[1]);
  chk(L, 'Paquete libre: Δp constante e igual a ħ/(2σ₀)', st.dp, 1 / (2 * g.s0), 1e-8);
  chk(L, 'Paquete libre: ⟨p⟩ = ħk₀', st.p, g.k0, 1e-8);
  chk(L, 'Paquete libre: Δx(t) = σ₀√(1 + (ħt/2mσ₀²)²)', st.dx, WV.freeWidth(g.s0, g.t), 1e-8);
  /* Autovalores por diferencias finitas */
  const q = P.q1d;
  const ho = q.fdEigen((xx) => 0.5 * xx * xx, -8, 8, 1000, 6, { vectors: false }).E; ho.forEach((v, i) => chk(S, `Oscilador armónico, diferencias finitas, E${i}: frente a scipy.linalg.eigh_tridiagonal`, v, ref.fd_ho[i], 1e-9));
  chk(L, 'Oscilador armónico: E₀ ≈ ½ (error de discretización h² ≈ 3×10⁻⁴)', ho[0], 0.5, 5e-4);
  const bx = q.fdEigen(() => 0, -1, 1, 800, 5, { vectors: false }).E; bx.forEach((v, i) => chk(S, `Caja de ancho 2, E${i + 1}: frente a scipy`, v, ref.fd_box[i], 1e-9));
  bx.forEach((v, i) => chk(L, `Caja de ancho 2: E${i + 1} frente a la exacta n²π²/8`, v, ((i + 1) ** 2 * Math.PI ** 2) / 8, 1e-4));
  const dw = q.fdEigen((xx) => ((xx * xx - 4) ** 2) / 8, -5, 5, 1200, 6, { vectors: false }).E; dw.forEach((v, i) => chk(S, `Doble pozo (x²−4)²/8, E${i}: frente a scipy`, v, ref.fd_dw[i], 1e-9));
}

/* ---- Cap. 7 ---- */
{
  const X = P.q1d.exact;
  for (const [z0, roots] of Object.entries(ref.finite)) {
    const r = X.finiteWell((+z0 * +z0) / 2, 2, 1, 1); /* a = 1, ħ = m = 1: z0 = √(2V0) */
    chk(S, `Pozo finito z₀ = ${z0}: número de estados ligados`, r.states.length, roots.length, 0);
    r.states.forEach((s, i) => { chk(S, `Pozo finito z₀ = ${z0}, estado ${i + 1}: z frente a scipy.optimize.brentq`, s.z, roots[i], 1e-9); chk(L, `Pozo finito z₀ = ${z0}, estado ${i + 1}: E + V₀ = z²/2 (a = 1)`, s.E + (+z0 * +z0) / 2, (roots[i] * roots[i]) / 2, 1e-9); });
  }
  for (const [k, [ke, ko]] of Object.entries(ref.dd)) {
    const [k0, a] = k.split('_').map(Number), r = POT.doubleDelta(k0, a);
    chk(S, `Doble delta κ₀ = ${k0}, a = ${a}: κ par frente a brentq`, r.even, ke, 1e-10);
    if (ko === null) chk(L, `Doble delta κ₀ = ${k0}, a = ${a}: no hay estado impar (2κ₀a ≤ 1)`, r.odd === null ? 1 : 0, 1, 0); else chk(S, `Doble delta κ₀ = ${k0}, a = ${a}: κ impar frente a brentq`, r.odd, ko, 1e-10);
  }
  chk(L, 'Delta: κ = mα/ħ² y E₀ = −mα²/2ħ² (α = 2, m = 3, ħ = 1.5)', POT.deltaE(2, 3, 1.5), -(3 * 4) / (2 * 2.25), 1e-14);
  /* Delta frente a diferencias finitas con un nodo en x = 0 */
  { const N = 1999, h = 20 / (N + 1), V = new Float64Array(N); V[999] = -1 / h; const E0 = P.q1d.fdEigen(V, -10, 10, N, 1, { vectors: false }).E[0]; chk(L, 'Delta atractiva α = 1 por diferencias finitas (h = 0.01): E₀ ≈ −½', E0, POT.deltaE(1), 3e-4); }
  { const N = 1999, h = 20 / (N + 1), V = new Float64Array(N); V[899] = -1 / h; V[1099] = -1 / h; const E = P.q1d.fdEigen(V, -10, 10, N, 2, { vectors: false }).E, r = POT.doubleDelta(1, 1); chk(L, 'Doble delta (a = 1) por diferencias finitas: E par', E[0], r.Eeven, 5e-4); chk(L, 'Doble delta (a = 1) por diferencias finitas: E impar', E[1], r.Eodd, 5e-4); }
  /* Transmisión de la delta frente a la matriz de transferencia con una barrera estrecha */
  for (const E of [0.3, 1, 3]) { const w = 1e-4, T = P.q1d.transfer(E, [{ x0: -w / 2, x1: w / 2, V: 1 / w }]).T; chk(L, `Transmisión de la delta (α = 1) en E = ${E}: fórmula frente a matriz de transferencia (barrera de ancho 10⁻⁴)`, POT.deltaT(E, 1), T, 2e-3); }
  /* Doble pozo por diferencias finitas */
  for (const [k, w] of Object.entries(ref.dw)) {
    const [V0, a] = k.split('_').map(Number), N = 3000, xa = -3 * a - 3, xb = 3 * a + 3, E = P.q1d.fdEigen((x) => V0 * ((x / a) ** 2 - 1) ** 2, xa, xb, N, 2, { vectors: false }).E;
    chk(S, `Doble pozo V₀ = ${V0}, a = ${a}: E₀ frente a scipy.linalg.eigh_tridiagonal`, E[0], w[0], 1e-9); chk(S, `Doble pozo V₀ = ${V0}, a = ${a}: E₁`, E[1], w[1], 1e-9); chk(S, `Doble pozo V₀ = ${V0}, a = ${a}: desdoblamiento ΔE`, E[1] - E[0], w[1] - w[0], 1e-4);
  }
}

/* ---- Cap. 8 ---- */
{
  for (const [nm, c] of Object.entries(ref.scat)) for (const [E, [T, R]] of Object.entries(c.E)) {
    if (+E <= c.Vs[0]) continue; /* sin onda incidente propagante */
    const r = SC.solve(+E, c.bounds, c.Vs);
    chk(S, `Dispersión «${nm}», E = ${E}: T frente al sistema lineal de amplitudes (numpy.linalg.solve)`, r.T, T, 1e-9, T > 1e-8 ? true : false);
    chk(L, `Dispersión «${nm}», E = ${E}: R + T = 1`, r.R + r.T, 1, 1e-10);
  }
  { const r = SC.solve(ref.scat_psi.E, [0, 1, 3, 4], [0, 1, 0, 1, 0]); ref.scat_psi.xs.forEach((x, i) => { const q = r.psi(x); chk(S, `Función de onda de la doble barrera en x = ${x}: |ψ|² frente a numpy`, q[0] * q[0] + q[1] * q[1], ref.scat_psi.dens[i], 1e-9); }); }
  /* fórmulas cerradas */
  for (const E of [0.2, 0.5, 0.9, 1.5, 4]) { const V0 = 1, a = 0.8, T = SC.T(E, [0, a], [0, V0, 0]); let ex; if (E < V0) { const k = Math.sqrt(2 * (V0 - E)); ex = 1 / (1 + V0 * V0 * Math.sinh(k * a) ** 2 / (4 * E * (V0 - E))); } else { const k = Math.sqrt(2 * (E - V0)); ex = 1 / (1 + V0 * V0 * Math.sin(k * a) ** 2 / (4 * E * (E - V0))); } chk(Y, `Barrera rectangular, E = ${E}: T de la fórmula cerrada`, T, ex, 1e-12); }
  for (const E of [1.2, 2, 5]) { const k1 = Math.sqrt(2 * E), k2 = Math.sqrt(2 * (E - 1)); chk(Y, `Escalón, E = ${E}: T = 4k₁k₂/(k₁ + k₂)²`, SC.T(E, [0], [0, 1]), (4 * k1 * k2) / (k1 + k2) ** 2, 1e-12); }
  chk(L, 'Barrera: resonancias T = 1 en E = V₀ + n²π²/2a² (n = 1, a = 0.8)', SC.T(1 + (Math.PI * Math.PI) / (2 * 0.64), [0, 0.8], [0, 1, 0]), 1, 1e-10);
  chk(L, 'Escalón con E < V₀: T = 0 y R = 1', SC.solve(0.4, [0], [0, 1]).R, 1, 1e-12);
  /* Paquete contra una barrera: operador dividido (malla alineada) frente a numpy y frente al promedio ⟨T⟩ */
  for (const [k, [tn, ta]] of Object.entries(ref.packet)) {
    const [E0, a, sg] = k.split('_').map(Number), N = 2048, LL = 256, dt = 0.05, xs = Float64Array.from({ length: N }, (_, i) => -LL / 2 + (LL * i) / N), k0 = Math.sqrt(2 * E0);
    const op = new WV.SplitOp(xs, (x) => (x >= -1e-9 && x < a - 1e-9 ? 1 : 0), dt), g = WV.gaussFree(xs, 0, -60, sg, k0), re = Float64Array.from(g[0]), im = Float64Array.from(g[1]);
    const nst = Math.round(150 / k0 / dt); for (let i = 0; i < nst; i++) op.step(re, im);
    let pt = 0; for (let i = 0; i < N; i++) if (xs[i] >= a - 1e-9) pt += (re[i] * re[i] + im[i] * im[i]) * (LL / N);
    chk(S, `Paquete (E₀ = ${E0}, a = ${a}, σ = ${sg}) contra la barrera: fracción transmitida frente al operador dividido de numpy`, pt, tn, 1e-8);
    chk(L, `Paquete (E₀ = ${E0}, a = ${a}, σ = ${sg}): fracción transmitida ≈ ⟨T⟩ de la onda plana (discretización ≈ 1 %)`, pt, ta, 1.2e-2);
  }
}

/* ---- Cap. 9 ---- */
{
  for (const [n, vals] of Object.entries(ref.ho_psi)) vals.forEach((v, i) => chk(S, `Oscilador ψ_${n}(ξ = ${ref.ho_xs[i]}) frente a scipy.special.eval_hermite`, HOL.psi(+n, ref.ho_xs[i]), v, 1e-9, Math.abs(v) > 1e-12));
  for (const [n, v] of Object.entries(ref.ho_forb)) chk(S, `Probabilidad fuera de los puntos de retorno, n = ${n} (scipy.integrate.quad)`, HOL.forbidden(+n), v, 1e-9);
  chk(L, 'n = 0: P_prohibida = erfc(1) = 0.157299', HOL.forbidden(0), 0.15729920705028516, 1e-9);
  for (const [k, v] of Object.entries(ref.ho_x)) { const [n, m] = k.split('_').map(Number); chk(S, `Elemento ⟨${n}|x|${m}⟩ frente a la integral numérica`, HOL.xmat(n, m), v, 1e-9, Math.abs(v) > 1e-12); }
  for (const [n, v] of Object.entries(ref.ho_x2)) { let s = 0; /* ⟨n|x²|n⟩ por la escalera: Σ_m |x_nm|² */ for (let m = 0; m < 80; m++) s += HOL.xmat(+n, m) ** 2; chk(S, `⟨x²⟩ en n = ${n} por completitud Σ|x_nm|² frente a la integral`, s, v, 1e-9); chk(L, `⟨x²⟩ = (n + ½) en n = ${n}`, s, +n + 0.5, 1e-12); }
  /* Ortonormalidad por Simpson */
  { let e = 0; for (let n = 0; n < 8; n++) for (let m = 0; m <= n; m++) { const N = 4000, a = -14, b = 14, h = (b - a) / N; let s = 0; for (let i = 0; i <= N; i++) { const x = a + i * h; s += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * HOL.psi(n, x) * HOL.psi(m, x); } s *= h / 3; e = Math.max(e, Math.abs(s - (n === m ? 1 : 0))); } chk(L, 'Ortonormalidad de ψ₀…ψ₇ (Simpson): error máximo', e, 0, 1e-12, false); }
  /* Diferencias finitas: E_n = n + ½ */
  { const r = P.q1d.fdEigen((x) => 0.5 * x * x, -10, 10, 2000, 12, { vectors: false }).E; r.forEach((v, n) => chk(L, `Diferencias finitas, N = 2000: E_${n} = n + ½`, v, n + 0.5, 3e-5 * (n + 1))); }
}

/* ---- Cap. 10 ---- */
{
  for (const c of ref.coh) chk(S, `Estado coherente α = ${c.re} + ${c.im}i, t = ${c.t}, ξ = ${c.x}: densidad frente al desarrollo en estados de Fock (numpy)`, HOL.cohDensity(c.x, c.re, c.im, c.t), c.d, 1e-9, c.d > 1e-12);
  for (const [k, v] of Object.entries(ref.poisson)) { const [n, m] = k.split('_').map(Number); chk(S, `Poisson P(${n}; ⟨n⟩ = ${m}) frente a scipy.stats.poisson`, HOL.poisson(n, m), v, 1e-12); }
  for (const [k, v] of Object.entries(ref.wigner_fock)) { const [n, x, p] = k.split('_').map(Number); chk(S, `Wigner de Fock n = ${n} en (${x}, ${p}): fórmula con Laguerre frente a la integral de la definición`, HOL.wignerFock(n, x, p), v, 1e-8, Math.abs(v) > 1e-10); }
  for (const [k, v] of Object.entries(ref.wigner_cat)) { const [al, par, x, p] = k.split('_').map(Number); chk(S, `Wigner del gato (α = ${al}, paridad ${par}) en (${x}, ${p}): fórmula frente a la integral de la definición`, HOL.wignerCat(al, par, x, p), v, 1e-7, Math.abs(v) > 1e-10); }
  for (const [k, v] of Object.entries(ref.sq)) { const [r, th, t] = k.split('_').map(Number), c = HOL.squeezeCov(r, th, t); chk(S, `Covarianza comprimida (r = ${r}, θ = ${th}, t = ${t}): Δx²`, c[0], v[0], 1e-6); chk(S, `Covarianza comprimida (r = ${r}, θ = ${th}, t = ${t}): cov(x,p)`, c[1], v[1], 1e-6, Math.abs(v[1]) > 1e-12); chk(S, `Covarianza comprimida (r = ${r}, θ = ${th}, t = ${t}): Δp²`, c[2], v[2], 1e-6); chk(L, `Covarianza comprimida (r = ${r}): estado puro, det σ = 1/4`, c[0] * c[2] - c[1] * c[1], 0.25, 1e-12); }
  /* normalización de W por cuadratura 2D */
  for (const [nm, f] of [['Fock n = 3', (x, p) => HOL.wignerFock(3, x, p)], ['gato par α = 1.5', (x, p) => HOL.wignerCat(1.5, 1, x, p)], ['gato impar α = 1.5', (x, p) => HOL.wignerCat(1.5, -1, x, p)], ['gaussiana comprimida', (x, p) => HOL.wignerGauss(HOL.squeezeCov(0.8, 0.4, 0.3), 0.5, -0.2, x, p)]]) { let s = 0; const N = 400, L2 = 9, h = (2 * L2) / N; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) s += f(-L2 + (i + 0.5) * h, -L2 + (j + 0.5) * h) * h * h; chk(L, `Normalización ∬ W = 1: ${nm}`, s, 1, 1e-6); }
}

/* ---- Cap. 11 ---- */
{
  for (const [P, d] of Object.entries(ref.kp)) {
    const bands = BD.kpBands(+P, 60, +P < 0 ? -25 : 0.0001);
    d.bands.slice(0, 3).forEach((b, nb) => { chk(S, `Peine de deltas P = ${P}, banda ${nb + 1}: borde inferior frente a scipy.optimize.brentq`, bands[nb][0], b[0], 1e-9, Math.abs(b[0]) > 1e-6); chk(S, `Peine de deltas P = ${P}, banda ${nb + 1}: borde superior`, bands[nb][1], b[1], 1e-9); });
    d.Ek.forEach((row, nb) => row.forEach((e, i) => chk(S, `Peine de deltas P = ${P}, banda ${nb + 1}, k = ${d.ks[i]}: E(k) frente a brentq`, BD.kpE(d.ks[i], +P, nb), e, 1e-9)));
  }
  for (const [k, w] of Object.entries(ref.nfe)) { const [V1, kk] = k.split('_').map(Number), r = BD.nfe(kk, V1).values; for (let i = 0; i < 3; i++) chk(S, `Casi libres V₁ = ${V1}, k = ${kk.toFixed(3)}: banda ${i + 1} frente a scipy.linalg.eigvalsh`, r[i], w[i], 1e-9); }
  /* brecha ≈ 2V₁ y enlace fuerte */
  for (const V1 of [0.05, 0.1, 0.5]) { const r = BD.nfe(Math.PI, V1).values; chk(L, `Brecha de electrones casi libres ≈ 2V₁ (V₁ = ${V1}, error de orden V₁²)`, r[1] - r[0], 2 * V1, V1 * V1 * 0.8 + 1e-6); }
  { const b = BD.kpBands(-6, 10, -25)[0], t = 2 * 18 * Math.exp(-6); chk(L, 'Enlace fuerte: ancho de banda 4t = 8|E₀|e^{−κ₀a} frente al peine exacto (P = −6)', 4 * t, b[1] - b[0], 2e-3); chk(L, 'La banda atractiva está centrada cerca de E₀ = −P²/2 = −18', 0.5 * (b[0] + b[1]), -18, 1e-3); }
  { const t = 0.37, N = 16, A = P.la.zeros(N); for (let i = 0; i < N; i++) { A[i][(i + 1) % N] += -t; A[(i + 1) % N][i] += -t; } const ev = Array.from(P.la.eigh(A, { vectors: false }).values), ex = Array.from({ length: N }, (_, j) => -2 * t * Math.cos((2 * Math.PI * j) / N)).sort((a, b) => a - b); chk(Y, 'Anillo de enlace fuerte (N = 16): niveles de la matriz frente a −2t cos(2πj/N)', Math.max(...ev.map((e, i) => Math.abs(e - ex[i]))), 0, 1e-12, false); }
}

/* ---- Cap. 12 ---- */
{
  for (const [k, vals] of Object.entries(ref.ylm.y)) { const [l, m] = k.split('_').map(Number); vals.forEach((v, i) => { const [th, ph] = ref.ylm.pts[i], y = ANG.Y(l, m, th, ph); chk(S, `Y_${l}^${m}(θ = ${th}, φ = ${ph}): parte real frente a scipy.special.sph_harm`, y[0], v[0], 1e-10, Math.abs(v[0]) > 1e-12); chk(S, `Y_${l}^${m}(θ = ${th}, φ = ${ph}): parte imaginaria`, y[1], v[1], 1e-10, Math.abs(v[1]) > 1e-12); }); }
  /* ortonormalidad sobre la esfera: φ con la regla del punto medio periódica (exacta) y θ con 2000 puntos */
  { let e = 0; const NT = 2000, NP = 16; for (const [l1, m1] of [[1, 0], [1, 1], [2, 1], [2, -1], [3, 2]]) for (const [l2, m2] of [[1, 0], [1, 1], [2, 1], [2, -1], [3, 2], [3, 0]]) { let re = 0, im = 0; for (let i = 0; i < NT; i++) { const th = (Math.PI * (i + 0.5)) / NT; for (let j = 0; j < NP; j++) { const ph = (2 * Math.PI * (j + 0.5)) / NP, a = ANG.Y(l1, m1, th, ph), b = ANG.Y(l2, m2, th, ph); const w = Math.sin(th) * (Math.PI / NT) * (2 * Math.PI / NP); re += (a[0] * b[0] + a[1] * b[1]) * w; im += (a[0] * b[1] - a[1] * b[0]) * w; } } e = Math.max(e, Math.abs(re - (l1 === l2 && m1 === m2 ? 1 : 0)), Math.abs(im)); } chk(L, 'Ortonormalidad de los Y_l^m sobre la esfera: error máximo', e, 0, 1e-6, false); }
  /* teorema de adición Σ_m |Y_lm|² = (2l+1)/4π */
  for (const l of [1, 2, 4]) { let s = 0; for (let m = -l; m <= l; m++) s += ANG.Y2(l, m, 1.234); chk(L, `Σ_m |Y_${l}^m|² = (2l+1)/4π`, s, (2 * l + 1) / (4 * Math.PI), 1e-12); }
  for (const j of [0.5, 1, 1.5, 2, 3]) {
    const J = ANG.jmat(j), cm = (X, Y) => ANG.cmul(X, Y); const XY = cm(J.Jx, J.Jy), YX = cm(J.Jy, J.Jx); let e = 0; const n = J.n; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) e = Math.max(e, Math.abs(XY.re[a][b] - YX.re[a][b] - (0 - 0)), Math.abs(XY.im[a][b] - YX.im[a][b] - J.Jz.re[a][b]));
    chk(S, `Matrices de j = ${j}: [Jx, Jy] − iJz (norma máxima)`, e, ref.jmat[Number(j).toFixed(1)].comm_xy_err, 1e-13, false);
    const J2 = cm(J.Jx, J.Jx), JY = cm(J.Jy, J.Jy), JZ = cm(J.Jz, J.Jz); let tr = 0; for (let a = 0; a < n; a++) tr += J2.re[a][a] + JY.re[a][a] + JZ.re[a][a]; chk(Y, `Matrices de j = ${j}: J² = j(j+1) (traza/(2j+1))`, tr / n, j * (j + 1), 1e-13);
  }
  for (const [t, v] of Object.entries(ref.cos2.vals)) { const c = ref.cos2.c.map((x) => [x, 0]); chk(S, `Rotor, ⟨cos²θ⟩(t = ${(+t).toFixed(3)}): matriz tridiagonal frente a la integral con polinomios de Legendre (numpy)`, ANG.cos2(c, 1, +t), v, 1e-7); }
  { const c = ref.cos2.c.map((x) => [x, 0]); chk(L, 'Rotor: renacimiento ⟨cos²θ⟩(t = π/B) = ⟨cos²θ⟩(0)', ANG.cos2(c, 1, Math.PI), ANG.cos2(c, 1, 0), 1e-9); }
}

/* ---- Cap. 13 ---- */
{
  ref.jl_x.forEach((x, i) => { for (const [l, vals] of Object.entries(ref.jl_vals)) chk(S, `Bessel esférica j_${l}(${x}) frente a scipy.special.spherical_jn`, CEN.jl(+l, x), vals[i], 1e-9, Math.abs(vals[i]) > 1e-14); });
  for (const [l, zs] of Object.entries(ref.jl_zeros)) zs.slice(0, 4).forEach((z, n) => chk(S, `Cero ${n + 1} de j_${l}: frente a scipy (brentq sobre spherical_jn)`, CEN.zero(+l, n + 1), z, 1e-9));
  for (const [k, es] of Object.entries(ref.well0)) { const [V0, a] = k.split('_').map(Number), r = CEN.well0(V0, a); chk(S, `Pozo esférico finito (V₀ = ${V0}, a = ${a}), l = 0: nº de estados`, r.states.length, es.length, 0); r.states.forEach((s, i) => chk(S, `Pozo esférico finito (V₀ = ${V0}, a = ${a}), l = 0, estado ${i + 1}: E frente a brentq`, s.E, es[i], 1e-9)); }
  chk(L, 'Umbral del pozo esférico: sin estado ligado si z₀ < π/2 (V₀ = 1.5, a = 1 → z₀ = 1.732 > π/2: sí; V₀ = 1.2 → z₀ = 1.549 < π/2: no)', CEN.well0(1.2, 1).states.length * 10 + CEN.well0(1.5, 1).states.length, 1, 0);
  for (const l of [0, 1, 2, 3]) { const E = CEN.radial((r) => 0.5 * r * r, l, 9, 1500, 4).E; E.forEach((e, n) => { chk(S, `Oscilador 3D radial (diferencias finitas), l = ${l}, n_r = ${n}: frente a scipy.linalg.eigh_tridiagonal`, e, ref.radial_ho[String(l)][n], 1e-9); chk(L, `Oscilador 3D l = ${l}, n_r = ${n}: E ≈ 2n_r + l + 3/2`, e, CEN.hoE(n, l), 2e-5 * (n + 3)); }); }
  for (const l of [0, 1, 2]) { const E = CEN.radial((r) => -1 / r, l, 50, 2500, 3).E; E.forEach((e, n) => { chk(S, `Coulomb radial (diferencias finitas), l = ${l}, n_r = ${n}: frente a scipy`, e, ref.radial_cou[String(l)][n], 1e-9); if (n + l + 1 <= 4) chk(L, `Coulomb l = ${l}, n_r = ${n}: E ≈ −1/2(n_r + l + 1)² (caja de radio 50)`, e, -0.5 / (n + l + 1) ** 2, 2e-3 * (n + l + 1)); }); }
  for (const [k, [v]] of Object.entries(ref.rayleigh)) { const [kr, Lm] = k.split('_').map(Number); let sr = 0, si = 0; const ip = [[1, 0], [0, 1], [-1, 0], [0, -1]]; for (let l = 0; l <= Lm; l++) { const tt = (2 * l + 1) * CEN.jl(l, kr), q = ip[l % 4]; sr += tt * q[0]; si += tt * q[1]; } chk(S, `Desarrollo de Rayleigh de e^{ikz} (kr = ${kr}, L = ${Lm}): error frente a numpy`, Math.hypot(sr - Math.cos(kr), si - Math.sin(kr)), v, 1e-8, false); }
  chk(L, 'Degeneración del oscilador 3D: (N+1)(N+2)/2 para N = 0…5', [0, 1, 2, 3, 4, 5].reduce((s, N) => s + CEN.hoDeg(N), 0), 1 + 3 + 6 + 10 + 15 + 21, 0);
}

/* ---- Cap. 14 ---- */
{
  for (const [k, d] of Object.entries(ref.hyd_R)) { const [n, l] = k.split('_').map(Number); d.r.forEach((r, i) => { chk(S, `R_${n}${l} del hidrógeno en r = ${r}: frente a scipy.special.eval_genlaguerre`, HY.R(n, l, r), d.scipy[i], 1e-10, Math.abs(d.scipy[i]) > 1e-14); chk(S, `R_${n}${l} del hidrógeno en r = ${r}: frente a sympy.physics.hydrogen.R_nl`, HY.R(n, l, r), d.sympy[i], 1e-10, Math.abs(d.sympy[i]) > 1e-14); }); }
  for (const [k, d] of Object.entries(ref.hyd_Zmu)) { const [Z, mu, n, l] = k.split('_').map(Number); d.r.forEach((r, i) => chk(S, `R_${n}${l} con Z = ${Z}, μ = ${mu} en r = ${r}: frente a scipy`, HY.R(n, l, r, Z, mu), d.v[i], 1e-10, Math.abs(d.v[i]) > 1e-14)); }
  for (const [k, v] of Object.entries(ref.hyd_rk)) { const [n, l, p] = k.split('_').map(Number); const ex = p === 1 ? HY.rMean(n, l) : p === 2 ? HY.r2Mean(n, l) : p === -1 ? HY.rInv(n) : HY.rInv2(n, l); chk(S, `⟨r^${p}⟩ de n = ${n}, l = ${l}: fórmula exacta frente a scipy.integrate.quad`, ex, v, 1e-9); }
  for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 2], [4, 1]]) chk(L, `Normalización numérica de R_${n}${l} (⟨r⁰⟩ = 1)`, HY.rk(n, l, 0), 1, 1e-6);
  for (const [n, l] of [[1, 0], [2, 1], [3, 0], [4, 2]]) { chk(L, `Virial ⟨V⟩ = 2E: n = ${n}, l = ${l}`, -HY.rInv(n), 2 * HY.E(n), 1e-12); chk(L, `⟨r⟩ por cuadratura = (3n² − l(l+1))/2: n = ${n}, l = ${l}`, HY.rk(n, l, 1), HY.rMean(n, l), 1e-6); }
  chk(L, 'Energía de Bohr de H con la masa reducida: −13.5983 eV (Ry·μ/mₑ)', HY.E(1, 1, 1 / (1 + 1 / 1836.15267)) * 27.211386, -13.5983, 2e-6, true);
}

/* ---- Cap. 15 ---- */
{
  ref.spin_evolve.forEach((c, i) => {
    const o = SPN.evolve(c.psi, c.w, c.t);
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) chk(S, `Espinor evolucionado (caso ${i + 1}), componente ${a ? '↓' : '↑'} ${b ? 'imaginaria' : 'real'}: frente a scipy.linalg.expm`, o[a][b], c.out[a][b], 1e-12, Math.abs(c.out[a][b]) > 1e-12);
    const bl = SPN.bloch(o); for (let k = 0; k < 3; k++) chk(S, `Vector de Bloch (caso ${i + 1}), componente ${'xyz'[k]}: frente a numpy ⟨ψ|σ|ψ⟩`, bl[k], c.bloch[k], 1e-12, Math.abs(c.bloch[k]) > 1e-12);
    chk(S, `Probabilidad de espín + según (θ, φ) (caso ${i + 1}): frente a numpy.linalg.eigh`, SPN.prob(o, c.th, c.ph), c.pn, 1e-11);
    chk(L, `Norma del espinor evolucionado (caso ${i + 1}): unitariedad`, SPN.norm2(o), 1, 1e-13);
  });
  ref.spin_chain.forEach((c, i) => chk(S, `Cadena de analizadores (${c.angles.length - 2} intermedio(s)): frente a numpy`, SPN.chain(c.angles), c.P, 1e-12, c.P > 1e-12));
  ref.spin_nstate.forEach((c) => { const q = SPN.nstate(c.th, c.ph), nx = Math.sin(c.th) * Math.cos(c.ph), ny = Math.sin(c.th) * Math.sin(c.ph), nz = Math.cos(c.th); const ur = nz * q[0][0] + nx * q[1][0] + ny * q[1][1], ui = nz * q[0][1] + nx * q[1][1] - ny * q[1][0], vr = nx * q[0][0] - ny * q[0][1] - nz * q[1][0], vi = nx * q[0][1] + ny * q[0][0] - nz * q[1][1]; chk(S, `Estado propio de n·σ (θ = ${c.th}, φ = ${c.ph}): ‖(n·σ − 1)|n+⟩‖ frente a numpy`, Math.hypot(ur - q[0][0], ui - q[0][1], vr - q[1][0], vi - q[1][1]), c.ok, 1e-13, false); });
  chk(L, 'Rotación de 2π: U = −1 (el espinor cambia de signo)', SPN.evolve([[0.6, 0], [0, 0.8]], [0.3, -0.5, 0.8], (2 * Math.PI) / Math.hypot(0.3, 0.5, 0.8))[0][0], -0.6, 1e-13);
  chk(L, 'Rotación de 4π: U = +1', SPN.evolve([[0.6, 0], [0, 0.8]], [0.3, -0.5, 0.8], (4 * Math.PI) / Math.hypot(0.3, 0.5, 0.8))[0][0], 0.6, 1e-13);
  chk(L, 'Frecuencia de Larmor del electrón en 1 T: 28.0249 GHz', SPN.larmor(2.00231930436, 1) / (2 * Math.PI) / 1e9, 28.0249514, 1e-7);
}

/* ---- Cap. 16 ---- */
{
  let nz = 0, emax = 0; for (const [j1, m1, j2, m2, J, M, v] of ref.cg) { const x = CPL.cg(j1, m1, j2, m2, J, M); emax = Math.max(emax, Math.abs(x - v)); if (Math.abs(v) > 0) nz++; }
  chk(S, `Coeficientes de Clebsch–Gordan: ${ref.cg.length} valores (${nz} no nulos) frente a sympy.physics.wigner: error máximo`, emax, 0, 1e-12, false);
  for (const [j1, m1, j2, m2, J, M, v] of ref.cg.filter((r, i) => i % 17 === 0 && Math.abs(r[6]) > 1e-9)) chk(S, `⟨${j1} ${m1}; ${j2} ${m2} | ${J} ${M}⟩ frente a sympy`, CPL.cg(j1, m1, j2, m2, J, M), v, 1e-12);
  /* ortonormalidad y completitud */
  for (const [j1, j2] of [[0.5, 0.5], [1, 0.5], [1, 1], [2, 1.5], [2, 2], [3, 1]]) {
    let e = 0; const Js = CPL.Js(j1, j2);
    for (const Ja of Js) for (const Jb of Js) for (let M = -Math.min(Ja, Jb); M <= Math.min(Ja, Jb) + 1e-9; M += 1) { let s = 0; for (let m1 = -j1; m1 <= j1 + 1e-9; m1 += 1) { const m2 = M - m1; s += CPL.cg(j1, m1, j2, m2, Ja, M) * CPL.cg(j1, m1, j2, m2, Jb, M); } e = Math.max(e, Math.abs(s - (Ja === Jb ? 1 : 0))); }
    chk(L, `Ortonormalidad de los CG (j₁ = ${j1}, j₂ = ${j2}): error máximo`, e, 0, 1e-12, false);
    chk(L, `Dimensión Σ(2J + 1) = (2j₁ + 1)(2j₂ + 1) (j₁ = ${j1}, j₂ = ${j2})`, Js.reduce((s, J) => s + 2 * J + 1, 0), (2 * j1 + 1) * (2 * j2 + 1), 0);
  }
  chk(L, 'CG del singlete: ⟨½ ½; ½ −½ | 0 0⟩ = 1/√2', CPL.cg(0.5, 0.5, 0.5, -0.5, 0, 0), Math.SQRT1_2, 1e-14);
  for (const [k, ev] of Object.entries(ref.zeemanP)) { const [A, b] = k.split('_').map(Number), z = CPL.zeemanP(A, b), all = [].concat(z['1.5'], z['0.5'], z['-0.5'], z['-1.5']).sort((x, y) => x - y); ev.forEach((e, i) => chk(S, `Término ²P (A = ${A}, μ_B B = ${b}): nivel ${i + 1} del bloque de M frente a numpy.linalg.eigvalsh (6×6)`, all[i], e, 1e-12, Math.abs(e) > 1e-12)); }
  for (const [J, v] of [[0.5, 2 / 3], [1.5, 4 / 3]]) chk(L, `Factor de Landé de ²P_${J}`, CPL.lande(1, 0.5, J), v, 1e-14);
  chk(L, 'Factor de Landé de ²S_{1/2} = 2', CPL.lande(0, 0.5, 0.5), 2, 1e-14);
  chk(L, 'Regla del intervalo: E(3/2) − E(1/2) = 3A/2 (A = 1)', CPL.LS(1, 0.5, 1.5) - CPL.LS(1, 0.5, 0.5), 1.5, 1e-14);
  chk(L, 'Campo débil: M = 1/2 de ²P_{3/2}, E = A/2 + g μ_B B M (b = 0.001)', CPL.zeemanP(1, 0.001)['0.5'][1], CPL.zeemanWeak(1, 0.001, 0.5, 1.5), 1e-5);
}

/* ---- Cap. 17 ---- */
{
  for (const [x0, es] of Object.entries(ref.landau_fd)) es.forEach((e, n) => { chk(S, `Oscilador de Landau desplazado (x₀ = ${x0}), nivel ${n}: diferencias finitas frente a scipy.linalg.eigh_tridiagonal`, e, n + 0.5, 1e-4); });
  for (const [n, vals] of Object.entries(ref.landau_psi)) ref.landau_x.forEach((x, i) => chk(S, `Función de Landau φ_${n}(${x}) frente a scipy.special.eval_hermite`, MAG.psi(+n, x, 0, 1), vals[i], 1e-11, Math.abs(vals[i]) > 1e-12));
  { const n = 3, x0 = 0.9, ell = 2.3; let s2 = 0; const N = 4000, a = -30, b = 30, h = (b - a) / N; for (let i = 0; i <= N; i++) { const x = a + i * h, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s2 += w * MAG.psi(n, x, x0, ell) ** 2; } chk(L, 'Normalización de φ_n con longitud magnética ℓ = 2.3 (∫|φ|² dx = 1)', (s2 * h) / 3, 1, 1e-10); }
  const Bt = 5, mt = 0.067 * MAG.K.me; for (const n of [0, 1, 2, 5]) chk(L, `Energía de Landau (GaAs, 5 T), n = ${n}: ħω_c(n + ½) frente a la escala de ℓ (ħ²/mℓ² = ħω_c)`, MAG.landauE(n, Bt, mt) / (MAG.K.hbar ** 2 / (mt * MAG.ell(Bt) ** 2)), n + 0.5, 1e-12);
  chk(S, 'Cuanto de flujo h/e frente a scipy.constants', MAG.phi0(), ref.mag_const.phi0, 1e-12); chk(S, 'h/e² frente a scipy.constants (25812.807 Ω)', MAG.K.h / (MAG.K.e * MAG.K.e), ref.mag_const.rk, 1e-12);
  for (const [r, v] of Object.entries(ref.ab_loop)) chk(S, `Flujo del solenoide como integral de línea de A sobre un círculo de radio ${r} m: fase q∮A·dl/ħ`, MAG.abPhase(v / MAG.phi0()), (MAG.K.e * ref.ab_loop_phi) / MAG.K.hbar, 2e-9);
  for (const c of ref.ab_pattern) chk(S, `Intensidad de dos rendijas con flujo (y = ${c.y}, Φ = ${c.nq} Φ₀) frente a numpy (suma de dos amplitudes)`, MAG.abPattern(c.y, 1, 1, 1, c.nq), c.I, 1e-12, c.I > 1e-12);
  chk(L, 'Aharonov–Bohm: la figura se repite con Φ → Φ + Φ₀', MAG.abPattern(0.37, 1, 1, 1, 0.3), MAG.abPattern(0.37, 1, 1, 1, 1.3), 1e-12);
  for (const nu of [0.0, 1.0, 2.0, 3.0, 5.0]) { const h = MAG.hallModel(nu, 0.03); chk(L, `Modelo Hall: ν_T = ν en el llenado entero ν = ${nu}`, h.nuT, nu, 1e-6, false); if (nu > 0) chk(L, `Modelo Hall: ρ_xy = 1/ν en ν = ${nu} (h/e²)`, h.rxy, 1 / nu, 1e-6); }
  chk(L, 'Modelo Hall: salida de ν_T en el centro del nivel (ν = 1.5 → 1.5)', MAG.hallModel(1.5, 0.05).nuT, 1.5, 1e-9);
  chk(L, 'Densidad por nivel eB/h = 1/(2πℓ²)', MAG.degArea(7.3), 1 / (2 * Math.PI * MAG.ell(7.3) ** 2), 2e-9);
}

/* ---- Cap. 18 ---- */
{
  let emax = 0; for (const [j, mp, m, b, v] of ref.wigner_d) emax = Math.max(emax, Math.abs(SYM.wd(j, mp, m, b) - v));
  chk(S, `Matrices d de Wigner (${ref.wigner_d.length} elementos, j hasta 3) frente a sympy.physics.quantum.spin.Rotation: error máximo`, emax, 0, 1e-12, false);
  for (const [j, mp, m, b, v] of ref.wigner_d.filter((r, i) => i % 23 === 0 && Math.abs(r[4]) > 1e-3)) chk(S, `d^${j}_{${mp},${m}}(${b}) frente a sympy`, SYM.wd(j, mp, m, b), v, 1e-11);
  for (const j of [0.5, 1, 2.5]) { let e = 0; for (const b of [0.3, 1.1, 2.6]) for (let m = -j; m <= j + 1e-9; m += 1) { let s = 0; for (let mp = -j; mp <= j + 1e-9; mp += 1) s += SYM.wd(j, mp, m, b) ** 2; e = Math.max(e, Math.abs(s - 1)); } chk(L, `Unitariedad de d^${j}: Σ|d|² = 1 (error máximo)`, e, 0, 1e-12, false); }
  chk(L, 'Rotación de 2π en espín ½: d_{mm}(2π) = −1', SYM.wd(0.5, 0.5, 0.5, 2 * Math.PI), -1, 1e-13); chk(L, 'Rotación de 4π en espín ½: d_{mm}(4π) = +1', SYM.wd(0.5, 0.5, 0.5, 4 * Math.PI), 1, 1e-13); chk(L, 'Rotación de 2π en j = 1: d_{mm}(2π) = +1', SYM.wd(1, 1, 1, 2 * Math.PI), 1, 1e-13);
  chk(L, 'Valor medio de J_z tras la rotación: m cos β (j = 3, m = 2, β = 0.9)', (() => { let s = 0; for (let mp = -3; mp <= 3; mp++) s += mp * SYM.wd(3, mp, 2, 0.9) ** 2; return s; })(), 2 * Math.cos(0.9), 1e-12);
  for (const [k, v] of Object.entries(ref.hyd_radial)) { const [a, b, c, d] = k.split('_').map(Number); chk(S, `Integral radial ⟨${a}${'spdfg'[b]}|r|${c}${'spdfg'[d]}⟩ frente a sympy.physics.hydrogen + scipy.quad`, SYM.radial(a, b, c, d), v, 1e-8); }
  for (const [k, v] of Object.entries(ref.hyd_A)) { const [a, b, c, d] = k.split('_').map(Number); chk(S, `Coeficiente A de Einstein ${a}${'spdfg'[b]} → ${c}${'spdfg'[d]} frente a sympy + scipy`, SYM.einsteinA(a, b, c, d), v, 1e-8); }
  chk(L, 'Integral radial exacta ⟨1s|r|2p⟩ = 128√6/243 a₀', SYM.radial(2, 1, 1, 0), (128 * Math.sqrt(6)) / 243, 1e-8);
  /* datos de la literatura (NIST ASD, sin estructura fina): A en s⁻¹ */
  for (const [a, b, c, d, v] of [[2, 1, 1, 0, 6.2649e8], [3, 1, 1, 0, 1.6725e8], [3, 1, 2, 0, 2.2449e7], [3, 0, 2, 1, 6.3148e6], [3, 2, 2, 1, 6.4651e7], [4, 1, 1, 0, 6.8186e7]]) chk(L, `A de ${a}${'spdfg'[b]} → ${c}${'spdfg'[d]} frente a NIST (diferencia de ~10⁻³ por estructura fina y masa reducida)`, SYM.einsteinA(a, b, c, d), v, 2e-3);
  chk(L, 'Vida media del 2p frente a la medida (1.596 ns)', SYM.lifetime(2, 1) * 1e9, 1.596, 1e-3); chk(L, 'Vida media del 3p frente a NIST (5.27 ns)', SYM.lifetime(3, 1) * 1e9, 5.27, 2e-3);
  chk(L, 'Regla de selección: A = 0 si Δl ≠ ±1 (2s → 1s)', SYM.einsteinA(2, 0, 1, 0), 0, 0, false); chk(L, 'Regla de selección: A = 0 para 3d → 2s', SYM.einsteinA(3, 2, 2, 0), 0, 0, false);
  { const r = EM.P.q1d.fdEigen((x) => 10 * ((x / 2) ** 2 - 1) ** 2, -7, 7, 700, 6), X = SYM.xmat(r.x, r.psi, r.h), pr = r.psi.map((p) => SYM.parity(p)); let mx = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (Math.sign(pr[i]) === Math.sign(pr[j])) mx = Math.max(mx, Math.abs(X[i][j])); chk(L, 'Doble pozo simétrico: |⟨m|x|n⟩| entre estados de la misma paridad = 0', mx, 0, 1e-9, false); }
}

/* ---- Cap. 19 ---- */
{
  const MB = 100, E0 = Array.from({ length: MB }, (_, i) => i + 0.5), V4 = PRT.hoX4(MB);
  for (const [n0, ser] of Object.entries(ref.anharm_series)) { const c = PRT.rs(E0, V4, +n0, 8); ser.forEach((v, k) => chk(S, `Serie de Rayleigh–Schrödinger de λx⁴ (n = ${n0}), coeficiente de orden ${k}: frente a mpmath (50 dígitos)`, c[k], v, 1e-10, Math.abs(v) > 1e-12)); }
  { const c = PRT.rs(E0, V4, 0, 4); [[0.5, 1 / 2], [1, 3 / 4], [2, -21 / 8], [3, 333 / 16], [4, -30885 / 128]].forEach(([k, v], i) => chk(L, `Bender–Wu: coeficiente exacto de orden ${i} del estado fundamental (literatura)`, c[i], v, 1e-11)); }
  chk(L, 'Primer orden: E₁ = (3/4)(2n² + 2n + 1) para n = 0…4', [0, 1, 2, 3, 4].reduce((s, n) => s + PRT.rs(E0, V4, n, 1)[1] - 0.75 * (2 * n * n + 2 * n + 1), 0), 0, 1e-10, false);
  chk(L, 'Segundo orden: E₂ = −(1/8)(34n³ + 51n² + 59n + 21) para n = 0…4', [0, 1, 2, 3, 4].reduce((s, n) => s + Math.abs(PRT.rs(E0, V4, n, 2)[2] + (34 * n ** 3 + 51 * n * n + 59 * n + 21) / 8), 0), 0, 1e-9, false);
  for (const [g, ev] of Object.entries(ref.anharm_exact)) PRT.anharmExact(+g, 200, 4).forEach((e, i) => chk(S, `Oscilador λx⁴ (g = ${g}), nivel ${i}: diagonalización en 200 estados frente a numpy.linalg.eigvalsh`, e, ev[i], 1e-9));
  chk(L, 'Estado fundamental de λx⁴ con g = 0.1: valor de referencia 0.559146327 (Bender–Wu, 1969)', PRT.anharmExact(0.1, 200, 1)[0], 0.559146327, 1e-8);
  ref.two_series.slice(1, 7).forEach((cf, k) => { if (k < 6) chk(S, `Dos niveles: coeficiente de V^{${2 * (k + 1)}} (Δ = 1): SymPy.series`, PRT.twoSeries(1, 1, k + 1) - (k ? PRT.twoSeries(1, 1, k) : 0), cf * 0 + [-1, 1, -2, 5, -14, 42][k], 1e-14); });
  for (const [V, e] of [[0.1, 0], [0.4, 0]]) chk(L, `Dos niveles: la serie de orden 6 converge a la solución exacta con V = ${V}`, PRT.twoSeries(1, V, 6), PRT.twoExact(1, V), V < 0.3 ? 1e-9 : 2e-2);
  chk(L, 'Dos niveles: con V = 0.6 los términos de la serie crecen (|término 6| > |término 4|, mínimo en k = 4)', Math.abs(PRT.twoSeries(1, 0.6, 6) - PRT.twoSeries(1, 0.6, 5)) > Math.abs(PRT.twoSeries(1, 0.6, 4) - PRT.twoSeries(1, 0.6, 3)) ? 1 : 0, 1, 0);
  chk(L, 'Stark: n = 2 → −1/8 ± 3F; fundamental → −1/2 − (9/4)F²', PRT.starkN2(0.01)[1] - PRT.starkN2(0.01)[0] + PRT.starkGround(0.01), 0.06 - 0.5 - 2.25e-4, 1e-14);
}

/* ---- Cap. 20 ---- */
{
  for (const [k, v] of Object.entries(ref.dirac_E)) { const [n, j, Z] = k.split('_').map(Number); chk(S, `Energía de Dirac (n = ${n}, j = ${j}, Z = ${Z}): frente a mpmath (50 dígitos)`, FIN.dirac(n, j, Z), v, 1e-10); }
  for (const c of ref.dirac_series) { chk(S, `Dirac: orden α⁰ del desarrollo (n = ${c.n}, j = ${c.j}) frente a SymPy.series = −1/(2n²)`, FIN.bohr(c.n), c.e0, 1e-14); chk(S, `Dirac: orden α² del desarrollo (n = ${c.n}, j = ${c.j}) frente a SymPy.series = fórmula de estructura fina`, FIN.fineJ(c.n, c.j) / FIN.alpha ** 2, c.e2, 1e-13); }
  for (const [n, l, j] of [[1, 0, 0.5], [2, 0, 0.5], [2, 1, 0.5], [2, 1, 1.5], [3, 1, 1.5], [3, 2, 2.5], [4, 3, 3.5], [4, 2, 1.5]]) chk(L, `Suma cinética + espín–órbita + Darwin = fórmula de estructura fina (n = ${n}, l = ${l}, j = ${j})`, FIN.fine(n, l, j), FIN.fineJ(n, j), 1e-14);
  chk(L, 'Degeneración de Dirac: 2s½ y 2p½ tienen la misma energía', FIN.fine(2, 0, 0.5), FIN.fine(2, 1, 0.5), 1e-14);
  chk(L, 'Estructura fina 2p₃/₂ − 2p₁/₂ = α²/32 hartree = 10.9493 GHz', (FIN.fineJ(2, 1.5) - FIN.fineJ(2, 0.5)) * FIN.hartreeGHz, 10.94928, 1e-6);
  chk(L, 'Estructura fina 2p₃/₂ − 2p₁/₂ frente a la medida (10.969 GHz): la diferencia (0.2 %) viene de la QED', (FIN.fineJ(2, 1.5) - FIN.fineJ(2, 0.5)) * FIN.hartreeGHz, 10.969, 3e-3);
  chk(L, 'Escala Z⁴: el desdoblamiento fino del n = 2 con Z = 10 es 10⁴ veces el de Z = 1', (FIN.fineJ(2, 1.5, 10) - FIN.fineJ(2, 0.5, 10)) / (FIN.fineJ(2, 1.5) - FIN.fineJ(2, 0.5)), 1e4, 1e-12);
  chk(L, 'Energía fina del 1s: −α²/8 hartree = −181.13 µeV', FIN.fineJ(1, 0.5) * 27.211386246e6, -181.1304, 1e-6);
  chk(L, 'Hiperfino del 1s: fórmula de Fermi (4/3)g_p(mₑ/m_p)α⁴mₑc² frente a la medida (5.8743 µeV): 0.05 %', FIN.hfFermi() * 1e6, 5.874326, 1e-3);
  chk(L, 'Línea de 21 cm: λ = c/ν = 21.106 cm', 29979245800 / 1420405751.768, 21.1061, 1e-5);
  for (const [B, ev] of Object.entries(ref.breit_rabi)) { const r = FIN.breitRabi(1420.405751768, 28024.9514 * +B, 42.5774785 * +B), all = [r.up, r.dn, r.m0hi, r.m0lo].sort((x, y) => x - y); ev.forEach((e, i) => chk(S, `Breit–Rabi (B = ${B} T), nivel ${i + 1}: frente a numpy.linalg.eigvalsh del hamiltoniano 4×4 con kron`, all[i], e, 1e-10, Math.abs(e) > 1e-9)); }
  { const r = FIN.breitRabi(1420.405751768, 0, 0); chk(L, 'Breit–Rabi con B = 0: triplete en +A/4 y singlete en −3A/4', r.up + r.dn + r.m0hi - 3 * (1420.405751768 / 4) + (r.m0lo + 3 * 1420.405751768 / 4), 0, 1e-9, false); }
}

/* ---- Cap. 21 ---- */
{
  for (const [k, ev] of Object.entries(ref.gto)) { const ex = k.split(',').map(Number), r = VAR.hydrogenGTO(ex); r.vals.forEach((e, i) => { if (i < 3) chk(S, `Hidrógeno con ${ex.length} gaussianas (${k}): valor propio ${i + 1} frente a scipy.linalg.eigh(H, S) con integrales por cuadratura`, e, ev[i], 1e-8); }); chk(L, `Cota variacional: E₁ ≥ −0.5 con ${ex.length} gaussianas`, r.E >= -0.5 ? 1 : 0, 1, 0); }
  chk(L, 'Una gaussiana óptima: a = 8/9π, E = −4/3π', VAR.hydrogenGTO([8 / (9 * Math.PI)]).E, -4 / (3 * Math.PI), 1e-12);
  { let prev = 0; for (let n = 1; n <= 8; n++) { const ex = Array.from({ length: n }, (_, i) => 0.1 * Math.pow(4, i)), e = VAR.hydrogenGTO(ex).E; if (n > 1) chk(L, `Hylleraas–Undheim: E₁ baja al pasar de ${n - 1} a ${n} gaussianas`, e < prev ? 1 : 0, 1, 0); prev = e; } }
  for (const [g, [a, e]] of Object.entries(ref.anh_var)) { chk(S, `Gaussiana de prueba (g = ${g}): α óptimo frente a scipy.optimize`, VAR.gaussOpt(+g), a, 1e-6); chk(S, `Gaussiana de prueba (g = ${g}): energía mínima frente a scipy.optimize`, VAR.gaussE(+g, VAR.gaussOpt(+g)), e, 1e-9); }
  for (const g of [0.05, 0.3, 1, 5]) chk(L, `Cota variacional del oscilador λx⁴ (g = ${g}): E_var ≥ E_exacta`, VAR.gaussE(g, VAR.gaussOpt(g)) - EM.qm.pert.anharmExact(g, 200, 1)[0] > 0 ? 1 : 0, 1, 0);
  chk(L, 'Con g = 1, α* = 2 exacto (α³ − α − 6 = 0)', VAR.gaussOpt(1), 2, 1e-12);
  chk(L, 'Helio: ζ* = 27/16 y E = −(27/16)² = −2.84765625', VAR.heliumE(VAR.heliumOpt(2), 2), -((27 / 16) ** 2), 1e-14);
  chk(L, 'Helio: mínimo variacional por búsqueda numérica', (() => { let best = 0, eb = 1e9; for (let z = 1; z < 3; z += 1e-4) { const e = VAR.heliumE(z); if (e < eb) { eb = e; best = z; } } return best; })(), 27 / 16, 2e-4);
  for (const [Z, ex] of [[2, -2.903724377], [3, -7.279913413], [4, -13.655566239], [5, -22.030971580], [6, -32.406246602]]) chk(L, `Cota variacional del ion de dos electrones Z = ${Z}: E_var ≥ E exacta (Pekeris, Drake)`, VAR.heliumE(VAR.heliumOpt(Z), Z) > ex ? 1 : 0, 1, 0);
  chk(L, 'Helio, potencial de ionización variacional 23.07 eV (exp. 24.59 eV)', (-2 - VAR.heliumE(27 / 16)) * 27.211386246, 23.0659, 1e-5);
  for (const [R, [Sx, jx, kx]] of Object.entries(ref.h2p_int)) { const h = VAR.h2plus(+R); chk(S, `H₂⁺ (R = ${R}): solapamiento S analítico frente a dblquad`, h.S, Sx, 1e-8); chk(S, `H₂⁺ (R = ${R}): integral de Coulomb j frente a dblquad`, h.j, jx, 1e-7); chk(S, `H₂⁺ (R = ${R}): integral de intercambio k frente a dblquad`, h.k, kx, 1e-7); }
  { const m = VAR.h2plusMin(); chk(L, 'H₂⁺ LCAO: R_e = 2.49 a₀ (Pauling 1928; Slater)', m.R, 2.49, 2e-3); chk(L, 'H₂⁺ LCAO: D_e = 1.76 eV', (-0.5 - m.E) * 27.211386246, 1.76, 3e-3); chk(L, 'H₂⁺ LCAO: la curva σ_u es repulsiva (E_u > −0.5 para todo R)', [1, 2, 3, 5, 8].every((R) => VAR.h2plus(R).u > -0.5) ? 1 : 0, 1, 0); }
}

/* ---- Cap. 22 ---- */
{
  const pots = { lin: [(x) => Math.abs(x), 60, ref.wkb_lin], quar: [(x) => x ** 4, 20, ref.wkb_quar], mor: [(x) => 12 * (1 - Math.exp(-x)) ** 2, 30, ref.wkb_mor] };
  for (const [k, [V, L, ev]] of Object.entries(pots)) ev.forEach((e, n) => chk(S, `Bohr–Sommerfeld (${k}), n = ${n}: frente a scipy.integrate.quad + brentq`, WKB.level(V, n, 0, L), e, 1e-7));
  ref.wkb_lin.forEach((e, n) => chk(L, `WKB lineal n = ${n}: fórmula cerrada [3π(n + ½)/(4√2)]^{2/3}`, e, Math.pow((3 * Math.PI * (n + 0.5)) / (4 * Math.SQRT2), 2 / 3), 1e-9));
  ref.airy_lin.forEach((e, n) => chk(S, `Potencial |x|: nivel exacto n = ${n} por los ceros de Ai y Ai′ (scipy.special.ai_zeros) frente a WKB`, WKB.level((x) => Math.abs(x), n, 0, 60), e, n === 0 ? 0.1 : 0.01));
  ref.fd_quar.slice(0, 5).forEach((e, n) => chk(S, `Potencial x⁴: nivel exacto n = ${n} (scipy.linalg.eigh_tridiagonal) frente a WKB`, WKB.level((x) => x ** 4, n, 0, 20), e, n === 0 ? 0.2 : 0.02));
  for (let n = 0; n < 5; n++) { const w = Math.sqrt(24); chk(L, `Morse (D = 12), n = ${n}: la cuantización de Bohr–Sommerfeld es exacta: ω(n + ½) − [ω(n + ½)]²/4D`, WKB.level((x) => 12 * (1 - Math.exp(-x)) ** 2, n, 0, 30), w * (n + 0.5) - (w * (n + 0.5)) ** 2 / 48, 1e-8); }
  for (const n of [0, 1, 4, 9]) chk(L, `Oscilador armónico n = ${n}: WKB exacto, E = n + ½`, WKB.level((x) => 0.5 * x * x, n, 0, 40), n + 0.5, 1e-9);
  for (const [k, [Te, Tw]] of Object.entries(ref.T_par)) { const [V0, e] = k.split('_').map(Number), Vf = (x) => (Math.abs(x) < 1 ? V0 * (1 - x * x) : 0), NS = 600, bd = Array.from({ length: NS + 1 }, (_, i) => -3 + (6 * i) / NS), Vs = [0].concat(Array.from({ length: NS }, (_, i) => Vf(0.5 * (bd[i] + bd[i + 1])))).concat([0]), T = EM.qm.scat.solve(e * V0, bd, Vs).T, xt = Math.sqrt(1 - e); chk(S, `Barrera parabólica (V₀ = ${V0}, E/V₀ = ${e}): T exacta por capas frente a scipy.solve_ivp (DOP853)`, T, Te, 3e-3); chk(S, `Barrera parabólica (V₀ = ${V0}, E/V₀ = ${e}): T_WKB frente a scipy.quad`, WKB.tunnel((x) => V0 * (1 - x * x), e * V0, -xt, xt), Tw, 1e-7); }
  for (const [k, [Te, Tw]] of Object.entries(ref.T_tri)) { const [V0, e] = k.split('_').map(Number), Vf = (x) => (x > 0 && x < 1 ? V0 * (1 - x) : 0), NS = 600, bd = Array.from({ length: NS + 1 }, (_, i) => -1 + (3 * i) / NS), Vs = [0].concat(Array.from({ length: NS }, (_, i) => Vf(0.5 * (bd[i] + bd[i + 1])))).concat([0]); chk(S, `Barrera triangular (V₀ = ${V0}, E/V₀ = ${e}): T exacta por capas frente a solve_ivp`, EM.qm.scat.solve(e * V0, bd, Vs).T, Te, 3e-3); chk(S, `Barrera triangular (V₀ = ${V0}, E/V₀ = ${e}): T_WKB frente a quad`, WKB.tunnel((x) => V0 * (1 - x), e * V0, 0, 1 - e), Tw, 1e-7); }
  for (const [k, mu, E, R, g2] of ref.gamow) chk(S, `Exponente de Gamow (k = ${k}, E = ${E}, R = ${R}): fórmula cerrada frente a scipy.quad de 2∫κ dr`, WKB.gamow(k, mu, E, R), g2, 1e-8);
  chk(L, 'Gamow: límite x → 0 de 2G es 2πη (R ≪ b)', WKB.gamow(1, 1, 0.5, 1e-9), (2 * Math.PI * 1) / Math.sqrt(1), 1e-3);
  chk(L, 'Rectangular exacta frente a WKB: cociente 16E(V₀ − E)/V₀² para κa grande', (() => { const E = 1, V0 = 5, k = Math.sqrt(2 * (V0 - E)), a = 3, Te = 1 / (1 + (V0 * V0 * Math.sinh(k * a) ** 2) / (4 * E * (V0 - E))); return Te / Math.exp(-2 * k * a); })(), 16 * 1 * 4 / 25, 1e-5);
  chk(L, 'Kemble en la cima de la parábola: T = 1/2 (S = 0)', 1 / (1 + Math.exp(0)), 0.5, 1e-15);
}

/* ---- Cap. 23 ---- */
{
  const G = { sq: (T) => () => 1, ga: (T) => (t) => Math.exp(-((t - T / 2) ** 2) / (2 * (T / 4) ** 2)), sin: (T) => (t) => Math.sin((Math.PI * t) / T) ** 2 };
  for (const c of ref.pulse) {
    const g = G[c.kind](c.T); chk(S, `Pulso ${c.kind} (T = ${c.T}, Ω = ${c.V}, Δ = ${c.D}): probabilidad de primer orden frente a scipy.quad`, TDP.firstOrderPulse(g, c.T, c.D, c.V, 4000), c.p1, 1e-8, c.p1 > 1e-14);
    const r = TDP.evolve((t) => { const a = (c.V / 2) * g(t), cs = Math.cos(c.D * t), sn = Math.sin(c.D * t); return { re: [Float64Array.of(0, a * cs), Float64Array.of(a * cs, 0)], im: [Float64Array.of(0, a * sn), Float64Array.of(-a * sn, 0)] }; }, { re: Float64Array.of(1, 0), im: new Float64Array(2) }, 0, c.T, 1200);
    chk(S, `Pulso ${c.kind} (T = ${c.T}, Ω = ${c.V}, Δ = ${c.D}): evolución exacta RK4 frente a scipy.solve_ivp (DOP853)`, r.re[1] ** 2 + r.im[1] ** 2, c.ex, 1e-6, c.ex > 1e-12);
    chk(L, `Pulso ${c.kind}: la teoría de perturbaciones no baja de la exacta con Ω pequeño (cociente cerca de 1 si P ≪ 1)`, c.p1 < 0.05 ? (TDP.firstOrderPulse(g, c.T, c.D, c.V, 2000) / c.ex > 0.9 && TDP.firstOrderPulse(g, c.T, c.D, c.V, 2000) / c.ex < 1.1 ? 1 : 0) : 1, 1, 0);
  }
  chk(L, 'Pulso cuadrado resonante: P = (ΩT/2)² (Ω = 0.1, T = 12) = 0.36', TDP.squareP(0.1, 0, 12), 0.36, 1e-12); chk(L, 'Pulso cuadrado: P(Δ) fórmula cerrada frente a la integral numérica', TDP.squareP(0.1, 0.2, 12), TDP.firstOrderPulse(() => 1, 12, 0.2, 0.1, 4000), 1e-9);
  chk(L, 'Rabi exacto: P = sin²(0.6) con Ω = 0.1, T = 12, Δ = 0', TDP.rabiP(0.1, 0, 12), Math.sin(0.6) ** 2, 1e-14);
  for (const [k, ps] of Object.entries(ref.band23)) { const [N, eps, V] = k.split('_').map(Number), b = TDP.bandDecay(N, eps, V); ref.band_t.forEach((t, i) => chk(S, `Estado discreto + banda (N = ${N}, ε = ${eps}, V = ${V}), t = ${t.toFixed(1)}: |c₀|² frente a numpy.linalg.eigh`, b.P0(t), ps[i], 1e-9)); }
  { const b = TDP.bandDecay(100, 0.1, 0.01); chk(L, 'Regla de oro: |c₀(t)|² ≈ e^{−Γt} a t = 20 (Γ = 2πV²/ε = 6.283×10⁻³)', b.P0(20), Math.exp(-TDP.golden(0.01, 0.1) * 20), 1e-2); chk(L, 'Sumatoria de pesos Σ|⟨k|0⟩|² = 1', b.w.reduce((s, x) => s + x, 0), 1, 1e-12); }
  { const b = TDP.bandDecay(200, 0.1, 0.01), Tr = (2 * Math.PI) / 0.1; chk(L, 'Reaparición de Poincaré: |c₀(2π/ε)|² ≈ e^{−ΓT_ret} = 0.674 (V = 0.01, ε = 0.1)', b.P0(Tr), Math.exp(-TDP.golden(0.01, 0.1) * Tr), 5e-3); }
  for (const [k, p] of Object.entries(ref.lz)) { const [g, v] = k.split('_').map(Number); chk(S, `Landau–Zener (g = ${g}, v = ${v}) con T = 40: RK4 frente a scipy.solve_ivp`, TDP.lzNumeric(g, v, 40, 160000), p, 1e-6); }
  chk(L, 'Landau–Zener: la integración con T grande tiende a exp(−2πg²/v) (g = 0.5, v = 2; T = 100)', TDP.lzNumeric(0.5, 2, 100, 200000), TDP.lzP(0.5, 2), 1e-2);
  chk(L, 'Landau–Zener: exp(−2πg²/v) con g = 0.5, v = 2 vale 0.4559', TDP.lzP(0.5, 2), 0.45594, 1e-4);
}

/* ---- Cap. 24 ---- */
{
  for (const c of ref.berry_stay) chk(S, `Espín en un campo que gira (θ = ${c.th}, ω = ${c.om}, t = ${c.t}): P(alineado) frente a scipy.linalg.expm`, TDP.berryStay(c.th, c.om, c.t), c.P, 1e-9, c.P > 1e-12);
  for (const c of ref.berry_phase) { const pred = ((-(Math.PI / c.om) - Math.PI * (1 - Math.cos(c.th)) + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; let d = Math.abs(c.phi - pred); d = Math.min(d, 2 * Math.PI - d); chk(L, `Fase de Berry (θ = ${c.th}, ω = ${c.om}): la fase exacta tras un ciclo (expm) menos la dinámica coincide con −Ω/2 a O(ω)`, d, 0, 4 * c.om * Math.PI, false); }
  chk(L, 'Fase de Berry del espín ½ a 60°: −π/2', TDP.berryPhase(Math.PI / 3, 0.5), -Math.PI / 2, 1e-14); chk(L, 'Fase de Berry de m = −½ a 60°: +π/2', TDP.berryPhase(Math.PI / 3, -0.5), Math.PI / 2, 1e-14); chk(L, 'Fase de Berry a 90°: −π', TDP.berryPhase(Math.PI / 2, 0.5), -Math.PI, 1e-14);
  for (const [r, P] of ref.ho_sudden) chk(S, `Oscilador, salto brusco ω₁/ω₀ = ${r}: P(fundamental) = 2√(ω₀ω₁)/(ω₀ + ω₁) frente a scipy.quad del solapamiento`, (2 * Math.sqrt(r)) / (1 + r), P, 1e-9);
  chk(L, 'P_alin ≥ 1 − ω² sin²θ/W² en el campo que gira', (() => { let m = 1; for (let t = 0; t < 200; t += 0.37) m = Math.min(m, TDP.berryStay(1.0472, 0.1, t)); return m; })(), 1 - (0.01 * 0.75) / (0.75 + (0.5 - 0.1) ** 2), 1e-3);
}

/* ---- Cap. 25 ---- */
{
  for (const c of ref.hard_delta) chk(S, `Esfera dura: δ_${c.l}(ka = ${c.x}) frente a scipy.special.spherical_jn / spherical_yn`, S3.hardDelta(c.l, c.x, 1), c.d, 1e-9, Math.abs(c.d) > 1e-12);
  for (const c of ref.delta3d) { const V = c.pot === 'yuk' ? (r) => -c.V0 * Math.exp(-r) / r : (r) => -c.V0 * Math.exp(-r * r); chk(S, `Desplazamiento de fase δ_${c.l} (${c.pot}, V₀ = ${c.V0}, k = ${c.k}): Numerov frente a scipy.solve_ivp (DOP853)`, S3.delta(c.l, c.k, V, c.pot === 'yuk' ? 25 : 8, 0.002), c.d, c.pot === 'yuk' ? 3e-3 : 2e-4, Math.abs(c.d) > 1e-8); }
  for (const c of ref.well_delta) chk(S, `Pozo esférico (V₀ = ${c.V0}, a = 1), δ_${c.l}(k = ${c.k}): fórmula analítica frente a solve_ivp`, S3.wellDelta(c.l, c.k, c.V0, 1), c.d, 1e-8, Math.abs(c.d) > 1e-8);
  for (const c of ref.born) { const V = c.pot === 'yuk' ? (r) => -c.V0 * Math.exp(-r) / r : (r) => -c.V0 * Math.exp(-r * r); const closed = c.pot === 'yuk' ? (16 * Math.PI * c.V0 ** 2) / (1 + 4 * c.k * c.k) : (Math.PI ** 2 * c.V0 ** 2 * (1 - Math.exp(-2 * c.k * c.k))) / (2 * c.k * c.k); chk(S, `Born (${c.pot}, V₀ = ${c.V0}, k = ${c.k}): σ cerrada frente a scipy.quad de |f_B|²`, closed, c.s, 2e-6); }
  { const V = (r) => -0.5 * Math.exp(-r) / r; chk(L, 'Born numérico del módulo (Simpson) frente a la fórmula cerrada de Yukawa (V₀ = 0.5, k = 1)', S3.bornSigma(1, V, 30, 200), (16 * Math.PI * 0.25) / 5, 2e-3); }
  for (const x of [0.1, 1, 8]) { const L2 = Math.ceil(x + 14), d = Array.from({ length: L2 }, (_, l) => S3.hardDelta(l, x, 1)), f0 = S3.amp(x, d, 0); chk(L, `Teorema óptico (esfera dura, ka = ${x}): σ = (4π/k) Im f(0)`, (4 * Math.PI / x) * f0[1], S3.sigma(x, d), 1e-12); }
  chk(L, 'Esfera dura a baja energía: σ → 4πa² (ka = 0.01)', S3.sigma(0.01, [S3.hardDelta(0, 0.01, 1), S3.hardDelta(1, 0.01, 1)]) / Math.PI, 4, 1e-3);
  chk(L, 'Esfera dura a alta energía: σ ≈ 2πa²[1 + 0.995 (ka)^{−2/3}] (ka = 60; Landau–Lifshitz)', S3.sigma(60, Array.from({ length: 90 }, (_, l) => S3.hardDelta(l, 60, 1))) / Math.PI, 2 * (1 + 0.995 * Math.pow(60, -2 / 3)), 1e-2);
  chk(L, 'δ₀ de la esfera dura = −ka exactamente (ka = 0.7)', S3.hardDelta(0, 0.7, 1), -0.7, 1e-14);
  chk(L, 'Unitariedad: σ_l ≤ 4π(2l + 1)/k² para el pozo (l = 1, k = 0.8, V₀ = 6)', (4 * Math.PI / 0.64) * 3 * Math.sin(S3.wellDelta(1, 0.8, 6, 1)) ** 2 <= (4 * Math.PI / 0.64) * 3 ? 1 : 0, 1, 0);
}

/* ---- Cap. 26 ---- */
{
  for (const [k, p] of Object.entries(ref.ws_res)) {
    const [l, V0] = k.split('_').map(Number), Vf = (r) => -V0 / (1 + Math.exp((r - 1) / 0.05)), k0 = p.Er > 0 ? Math.sqrt(2 * p.Er) : 1, ks = []; for (let kk = k0 - 0.15; kk < k0 + 0.15; kk += 0.0025) ks.push(kk);
    const ds = ks.map((kk) => S3.delta(l, kk, Vf, 6, 0.004)); for (let i = 1; i < ds.length; i++) ds[i] += Math.PI * Math.round((ds[i - 1] - ds[i]) / Math.PI);
    const Es = ks.map((kk) => (kk * kk) / 2); let imax = 1, smax = -1e9; for (let i = 1; i < ds.length - 1; i++) { const s = (ds[i + 1] - ds[i - 1]) / (Es[i + 1] - Es[i - 1]); if (s > smax) { smax = s; imax = i; } }
    chk(S, `Resonancia de forma (l = ${l}, V₀ = ${V0}): E_r (Numerov) frente a scipy.solve_ivp`, Es[imax], p.Er, 3e-3); chk(S, `Resonancia de forma (l = ${l}, V₀ = ${V0}): Γ = 2/(dδ/dE) (Numerov) frente a scipy.solve_ivp`, 2 / smax, p.Gam, 3e-2);
    chk(L, `Retardo de Wigner en el pico = 4ħ/Γ (l = ${l}, V₀ = ${V0})`, 2 * smax, 4 / (2 / smax), 1e-12);
  }
  for (const [K0, xs] of Object.entries(ref.well_bound)) chk(S, `Pozo esférico (K₀a = ${K0}): número de estados ligados s (scipy.optimize.brentq) frente a ⌊K₀a/π + ½⌋`, xs.length, Math.floor(+K0 / Math.PI + 0.5), 0);
  for (const K0 of [2.2, 5, 7, 10]) { const ks = Array.from({ length: 5000 }, (_, i) => 1000 * Math.pow(0.001 / 1000, i / 4999)), ds = S3.unwrap(ks.map((k) => S3.wellDelta(0, k, (K0 * K0) / 2, 1))), d0 = ds[ds.length - 1], as = S3.wellScatLength((K0 * K0) / 2, 1); chk(L, `Teorema de Levinson (K₀a = ${K0}): δ₀(k → 0) = Nπ − k a_s con N = ⌊K₀a/π + ½⌋`, d0, Math.floor(K0 / Math.PI + 0.5) * Math.PI - ks[ks.length - 1] * as, 2e-3); }
  chk(L, 'Longitud de dispersión del pozo: nula en tan K₀a = K₀a (K₀a = 4.493409458)', S3.wellScatLength(4.493409458 ** 2 / 2, 1), 0, 1e-8, false);
  for (const [K0, as] of [[1.2, -1.14346], [2.2, 1.62447], [4.0, 0.710545]]) chk(L, `Longitud de dispersión del pozo (K₀a = ${K0}) frente a lim −δ₀/k`, S3.wellScatLength((K0 * K0) / 2, 1), as, 1e-5);
  chk(L, 'a_s = −lim δ₀/k: pozo con K₀a = 2.2 y k = 10⁻⁴', -S3.wellDelta(0, 1e-4, (2.2 * 2.2) / 2, 1) / 1e-4 + (S3.wellDelta(0, 1e-4, 2.4 * 2.4 / 2 * 0 + (2.2 * 2.2) / 2, 1) < 0 ? 0 : 0), S3.wellScatLength((2.2 * 2.2) / 2, 1), 1e-3);
  chk(L, 'Desarrollo de rango efectivo: k cot δ₀ → −1/a_s (pozo K₀a = 4, k = 10⁻³)', 1e-3 / Math.tan(S3.wellDelta(0, 1e-3, 8, 1)), -1 / S3.wellScatLength(8, 1), 1e-3);
}

/* ---- Cap. 27 ---- */
{
  for (const [k, [J, K]] of Object.entries(ref.JK)) { const [z1, z2] = k.split('_').map(Number), r = IDN.JK(z1, z2); chk(S, `Integral de Coulomb J de 1s(${z1}) 2s(${z2}) frente a scipy.integrate.quad anidado`, r.J, J, 1e-5); chk(S, `Integral de intercambio K de 1s(${z1}) 2s(${z2}) frente a scipy.integrate.quad anidado`, r.K, K, 1e-5); }
  for (const Z of [1, 2, 3, 4.5]) { const r = IDN.JK(Z, Z); chk(L, `J = 17Z/81 (Z = ${Z})`, r.J, (17 * Z) / 81, 1e-5); chk(L, `K = 16Z/729 (Z = ${Z})`, r.K, (16 * Z) / 729, 5e-5); }
  for (const [k, v] of Object.entries(ref.sep2)) { const [a, b, s] = k.split('_').map(Number); chk(S, `Separación cuadrática ⟨(x₁ − x₂)²⟩ (n = ${a}, ${b}; ${s === 0 ? 'distinguibles' : s === 1 ? 'simétrica' : 'antisimétrica'}): fórmula con intercambio frente a scipy.dblquad`, IDN.sep2(a, b, s), v, 1e-9); }
  for (const [k, v] of Object.entries(ref.contact)) { const [a, b, s] = k.split('_').map(Number); if (a === b && s !== 0) continue; chk(S, `Interacción de contacto de primer orden (n = ${a}, ${b}; ${s === 0 ? 'distinguibles' : s === 1 ? 'simétrica' : 'antisimétrica'}) frente a scipy.quad`, IDN.contact(a, b, s, 1, 1, 4000), v, 1e-8, Math.abs(v) > 1e-14); }
  for (const [k, c] of Object.entries(ref.counts)) { const [N, M] = k.split('_').map(Number); chk(S, `Microestados de ${N} partículas en ${M} niveles: distinguibles, bosones, fermiones frente a itertools`, IDN.count(N, M, 'dist') * 1e6 + IDN.count(N, M, 'bos') * 1e3 + IDN.count(N, M, 'fer'), c[0] * 1e6 + c[1] * 1e3 + c[2], 0); }
  chk(L, 'Principio de Pauli: la función antisimétrica se anula en x₁ = x₂', IDN.psi2(1, 2, 0.37, 0.37, -1), 0, 1e-15, false);
  chk(L, 'Normalización de la función simétrica y antisimétrica (n = 1, 2)', (() => { let a = 0, b = 0; const N = 400; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x1 = (i + 0.5) / N, x2 = (j + 0.5) / N; a += IDN.psi2(1, 2, x1, x2, 1) ** 2; b += IDN.psi2(1, 2, x1, x2, -1) ** 2; } return (a + b) / (2 * N * N); })(), 1, 1e-4);
  chk(L, 'Distribución de Fermi–Dirac ≤ 1 y Bose–Einstein ≥ Boltzmann ≥ Fermi–Dirac en x = 1', IDN.be(1) > IDN.mb(1) && IDN.mb(1) > IDN.fd(1) && IDN.fd(-5) < 1 ? 1 : 0, 1, 0);
  chk(L, 'FD y BE tienden a Boltzmann para x grande (x = 12)', Math.abs(IDN.fd(12) - IDN.mb(12)) / IDN.mb(12) + Math.abs(IDN.be(12) - IDN.mb(12)) / IDN.mb(12), 0, 1e-4, false);
}

/* ---- Cap. 28 ---- */
{
  for (const [k, [E, eps]] of Object.entries(ref.rhf)) { const [Z, n, a1, b] = k.split('_').map(Number), r = HFA.rhf(HFA.eventemp(n, a1, b), Z); chk(S, `Hartree–Fock restringido (Z = ${Z}, N = ${n} gaussianas, a₁ = ${a1}, β = ${b}): energía frente a una implementación independiente en numpy/scipy`, r.E, E, 1e-8); chk(S, `Hartree–Fock restringido (Z = ${Z}, N = ${n}, a₁ = ${a1}): energía orbital ε frente a numpy`, r.eps, eps, 2e-6); chk(L, `Cota variacional HF: E_HF ≥ límite −2.86168 (Z = ${Z}, N = ${n}) cuando Z = 2`, Z === 2 ? (r.E >= -2.86168 - 1e-6 ? 1 : 0) : 1, 1, 0); }
  chk(L, 'Una gaussiana (He): a* = 0.76700 y E = −2.30099', HFA.rhf([0.7669956644], 2).E, -2.3009869931, 1e-8);
  chk(L, 'Límite de Hartree–Fock del helio (14 gaussianas optimizadas): −2.86168', HFA.rhf(HFA.eventemp(14, 0.0345, 2.78), 2).E, -2.86168, 3e-5);
  chk(L, 'Koopmans del helio: ε = −0.91795 (literatura: −0.91796)', HFA.rhf(HFA.eventemp(14, 0.0345, 2.78), 2).eps, -0.91796, 5e-4);
  chk(L, 'Energía de correlación del He: −2.903724 + 2.861680 = −0.042044 (literatura: −0.0420)', -2.903724377 + 2.86168, -0.0420, 2e-3);
  for (const [Z, s] of [[7, '1s2 2s2 2p3'], [16, '1s2 2s2 2p6 3s2 3p4'], [26, '1s2 2s2 2p6 3s2 3p6 4s2 3d6'], [36, '1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6']]) chk(L, `Configuración de Madelung de Z = ${Z}: ${s}`, HFA.confString(HFA.madelung(Z)) === s ? 1 : 0, 1, 0);
  chk(L, 'Capacidades: Σ 2(2l + 1) hasta 4p = 36', HFA.madelung(36).reduce((s, c) => s + c[2], 0), 36, 0);
  for (const [Z, n, l, ze] of [[3, 2, 0, 1.3], [11, 3, 0, 2.2], [19, 4, 0, 2.2], [26, 4, 0, 3.75], [26, 3, 2, 6.25], [10, 2, 1, 5.85], [2, 1, 0, 1.7], [6, 2, 1, 3.25], [7, 2, 1, 3.9], [29, 4, 0, 4.2]]) chk(L, `Reglas de Slater: Z_ef de ${n}${'spd'[l]} en Z = ${Z}`, HFA.slaterZeff(Z, HFA.madelung(Z), n, l), ze, 1e-12);
}

/* ---- Cap. 29 ---- */
{
  { const c = SQN.fermi(4); let e = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const A = SQN.anticomm(c[i], EM.P.la.transpose(c[j])), B = SQN.anticomm(c[i], c[j]); A.forEach((r, a) => r.forEach((v, b) => { e = Math.max(e, Math.abs(v - (i === j && a === b ? 1 : 0))); })); B.forEach((r) => r.forEach((v) => { e = Math.max(e, Math.abs(v)); })); } chk(L, 'Operadores fermiónicos de Jordan–Wigner (4 modos): {c_i, c_j†} = δ_ij y {c_i, c_j} = 0 (error máximo)', e, 0, 1e-14, false); }
  for (const [k, ev] of Object.entries(ref.hubbard2)) { const [t, U] = k.split('_').map(Number), H = SQN.hubbard2(t, U).H, e = Array.from(EM.P.la.eigh(H, { vectors: false }).values).sort((a, b) => a - b); ev.forEach((x, i) => chk(S, `Hubbard de 2 sitios (t = ${t}, U = ${U}): nivel ${i + 1} de los 16 frente a numpy.linalg.eigvalsh con Jordan–Wigner independiente`, e[i], x, 1e-10, Math.abs(x) > 1e-9)); const lv = SQN.hubbard2Levels(t, U); chk(L, `Hubbard (t = ${t}, U = ${U}): el singlete analítico está en el espectro completo`, Math.min(...e.map((x) => Math.abs(x - lv.singlet))), 0, 1e-10, false); chk(L, `Hubbard (t = ${t}, U = ${U}): el nivel superior U/2 + √(U²/4 + 4t²) está en el espectro`, Math.min(...e.map((x) => Math.abs(x - lv.upper))), 0, 1e-10, false); }
  for (const U of [4, 20, 60]) chk(L, `Hubbard: para U ≫ t el desdoblamiento tiende a 4t²/U (U = ${U})`, -SQN.hubbard2Levels(1, U).singlet / (4 / U), 1, U === 4 ? 0.2 : U === 20 ? 0.02 : 0.005);
  chk(L, 'Hubbard sin interacción: E_S = −2t y ⟨D⟩ = 1/2', SQN.hubbard2Levels(1.3, 0).singlet + 2 * 1.3 + SQN.hubbard2Double(1.3, 0) - 0.5, 0, 1e-13, false);
  { const t = 1, U = 4, { H, n } = SQN.hubbard2(t, U), r = EM.P.la.eigh(H); const k0 = 0; /* doble ocupación del singlete de N = 2: valor esperado con el vector propio de energía E_S */ let best = 0, bd = 1e9; Array.from(r.values).forEach((x, i) => { if (Math.abs(x - SQN.hubbard2Levels(t, U).singlet) < bd) { bd = Math.abs(x - SQN.hubbard2Levels(t, U).singlet); best = i; } }); const v = Array.from({ length: 16 }, (_, i) => r.vectors[i][best]); let D = 0; for (const pair of [[0, 1], [2, 3]]) { const Dm = EM.P.la.matmul(n[pair[0]], n[pair[1]]); for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) D += v[i] * Dm[i][j] * v[j]; } chk(S, 'Doble ocupación del singlete (U = 4t) por diagonalización completa frente a la fórmula analítica ⟨D⟩ = ½[1 − (U/2)/√(U²/4 + 4t²)]', D, SQN.hubbard2Double(t, U), 1e-10); }
  for (const [n, m, nm] of [[8.47e28, SQN.K.me, 'Cu'], [2.65e28, SQN.K.me, 'Na'], [1.64e28, 3.01603 * SQN.K.u, '³He']]) { const EF = SQN.fermiE(n, m); chk(L, `E_F del gas de Fermi (${nm}): n = (1/3π²)(2mE_F/ħ²)^{3/2}`, (1 / (3 * Math.PI ** 2)) * Math.pow((2 * m * EF) / SQN.K.hbar ** 2, 1.5), n, 1e-12); }
  chk(L, 'Cobre: E_F = 7.00 eV (Kittel: 7.00 eV; con la masa libre y n = 8.47×10²⁸ m⁻³)', SQN.fermiE(8.47e28, SQN.K.me) / SQN.K.e, 7.0, 6e-3);
  chk(L, 'Cobre: T_F = 8.16×10⁴ K (Ashcroft–Mermin)', SQN.fermiE(8.47e28, SQN.K.me) / SQN.K.kB, 8.16e4, 1e-3);
  for (const [T, mu] of Object.entries(ref.fermi_mu)) { const t = +T; if (t <= 0.1) chk(S, `Potencial químico del gas de Fermi (T/T_F = ${T}): Sommerfeld frente a scipy.quad + brentq`, 1 - (Math.PI ** 2 / 12) * t * t, mu, t <= 0.05 ? 3e-5 : 2e-3); }
  chk(L, 'ζ(3/2) = 2.612375… y ζ(3) = 1.202057… (SymPy)', Math.abs(SQN.zeta32 - ref.zeta[0]) + Math.abs(SQN.zeta3 - ref.zeta[1]), 0, 1e-14, false);
  chk(L, '⁸⁷Rb, n = 10²⁰ m⁻³: T_c = 398 nK', SQN.bec(1e20, 86.909 * SQN.K.u) * 1e9, 398.3, 1e-3); chk(L, '⁴He, n = 2.18×10²⁸ m⁻³: T_c = 3.13 K (observado: T_λ = 2.17 K)', SQN.bec(2.18e28, 4.0026 * SQN.K.u), 3.13, 2e-3);
  chk(L, 'T_c cumple n λ_T³ = ζ(3/2)', 1e20 * SQN.lambdaT(86.909 * SQN.K.u, SQN.bec(1e20, 86.909 * SQN.K.u)) ** 3, SQN.zeta32, 1e-12);
  chk(L, 'Fracción condensada a 0.7 T_c: 0.4143', SQN.becFraction(0.7, 1), 0.41434, 1e-4);
  chk(L, 'Trampa armónica (N = 10⁶, ω̄/2π = 100 Hz): T_c = 0.94 ħω̄ N^{1/3}/k_B (Dalfovo et al., Rev. Mod. Phys. 1999)', SQN.becTrap(1e6, 2 * Math.PI * 100), 0.94 * (SQN.K.hbar * 2 * Math.PI * 100 / SQN.K.kB) * 100, 2e-3);
}

/* ---- Cap. 30 ---- */
{
  ref.rho4.forEach((c, i) => {
    const r = QI.from(c.re, c.im);
    chk(S, `Matriz densidad aleatoria ${i + 1}: entropía de von Neumann frente a numpy.linalg.eigvalsh`, QI.entropy(r), c.S, 1e-9, c.S > 1e-9); chk(S, `Matriz densidad ${i + 1}: pureza Tr ρ² frente a numpy`, QI.purity(r), c.pur, 1e-12);
    chk(S, `Matriz densidad ${i + 1}: entropía del subsistema A (traza parcial) frente a numpy.einsum`, QI.entropy(QI.ptrace(r, 2, 2, 'B')), c.SA, 1e-9, c.SA > 1e-9); chk(S, `Matriz densidad ${i + 1}: entropía del subsistema B frente a numpy.einsum`, QI.entropy(QI.ptrace(r, 2, 2, 'A')), c.SB, 1e-9, c.SB > 1e-9);
    const rA = QI.ptrace(r, 2, 2, 'B'); let e = 0; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) e = Math.max(e, Math.abs(rA.re[a][b] - c.rA[0][a][b]), Math.abs(rA.im[a][b] - c.rA[1][a][b])); chk(S, `Matriz densidad ${i + 1}: ρ_A = Tr_B ρ elemento a elemento frente a numpy.einsum (error máximo)`, e, 0, 1e-13, false);
    chk(S, `Matriz densidad ${i + 1}: concurrencia de Wootters frente a scipy.linalg.sqrtm`, QI.concurrence(r), c.C, 5e-6, c.C > 1e-6); chk(S, `Matriz densidad ${i + 1}: CHSH máximo de Horodecki frente a numpy`, QI.chshMax(r), c.chsh, 1e-10);
  });
  for (const [p, c] of Object.entries(ref.werner)) { const r = QI.werner(+p); chk(S, `Estado de Werner (p = ${p}): concurrencia frente a scipy.linalg.sqrtm`, QI.concurrence(r), c.C, 5e-6, c.C > 1e-6); chk(L, `Werner (p = ${p}): C = máx(0, (3p − 1)/2)`, QI.concurrence(r), Math.max(0, (3 * +p - 1) / 2), 5e-6, Math.max(0, (3 * +p - 1) / 2) > 1e-6); chk(L, `Werner (p = ${p}): CHSH máximo 2√2 p`, QI.chshMax(r), 2 * Math.SQRT2 * +p, 1e-10, +p > 1e-9); }
  chk(L, 'Estado singlete: pureza 1, entropía 0, ρ_A = ½·1 con S = 1 bit', QI.purity(QI.proj(QI.psiMinus)) + QI.entropy(QI.ptrace(QI.proj(QI.psiMinus), 2, 2, 'B')), 2, 1e-10);
  chk(L, 'Información mutua del singlete = 2 bits', QI.mutual(QI.proj(QI.psiMinus)), 2, 1e-9);
  chk(L, 'Entropía conjunta de un estado puro es nula (singlete, |0⟩|0⟩ ⊗)', QI.entropy(QI.proj(QI.phiPlus)), 0, 1e-9, false);
  { const a = 20 * Math.PI / 180, v = QI.vec([Math.cos(a), 0, 0, Math.sin(a)]), r = QI.proj(v); chk(L, 'cos α|00⟩ + sen α|11⟩ (α = 20°): S = H(cos²α) = 0.52061 bits', QI.entropy(QI.ptrace(r, 2, 2, 'B')), 0.5206107318548253, 1e-9); chk(L, 'cos α|00⟩ + sen α|11⟩: concurrencia = sen 2α', QI.concurrence(r), Math.sin(2 * a), 5e-6); }
  for (const t of [0.5, 1, 2]) { const w = [1, Math.exp(-1 / t)], z = w[0] + w[1], rho = QI.from([[w[0] / z, 0], [0, w[1] / z]]); chk(L, `Qubit térmico (kT/ħω = ${t}): longitud de Bloch = tanh(1/2t)`, Math.hypot(...QI.bloch(rho)), Math.tanh(1 / (2 * t)), 1e-12); }
  chk(L, 'Bloch: r = 1 ⇒ pureza 1; r = 0 ⇒ pureza ½ y entropía 1 bit', (() => { const r1 = QI.from([[0.5, 0.5], [0.5, 0.5]]), r0 = QI.scale(QI.eye(2), 0.5); return QI.purity(r1) + QI.purity(r0) + QI.entropy(r0) + QI.entropy(r1); })(), 2.5, 1e-10);
}

/* ---- Cap. 31 ---- */
{
  const g = QI.proj(QI.ghz), w = QI.proj(QI.w3);
  chk(L, 'Mermin del GHZ puro = 4', QI.mermin(g), 4, 1e-12); chk(L, 'Mermin del W = 0', QI.mermin(w), 0, 1e-12, false);
  for (const p of [0.1, 0.3, 0.5, 0.8]) chk(L, `Mermin del GHZ con ruido blanco (p = ${p}) = 4(1 − p)`, QI.mermin(QI.add(QI.scale(g, 1 - p), QI.scale(QI.eye(8), p / 8))), 4 * (1 - p), 1e-12);
  const gab = QI.ptrace(g, 4, 2, 'B'), wab = QI.ptrace(w, 4, 2, 'B');
  chk(L, 'GHZ tras perder un qubit: separable (C = 0 y negatividad 0)', QI.concurrence(gab) + QI.negativity(gab, 2, 2), 0, 1e-7, false); chk(L, 'W tras perder un qubit: C = 2/3', QI.concurrence(wab), 2 / 3, 1e-6); chk(L, 'W tras perder un qubit: negatividad (√17 − 3... )/... = 0.20601', QI.negativity(wab, 2, 2), 0.2060113295832983, 1e-9);
  chk(L, 'Entropía de un qubit del W = H(1/3) = 0.9183 bits', QI.entropy(QI.ptrace(wab, 2, 2, 'B')), 0.9182958340544896, 1e-9);
  for (const p of [0.2, 0.5, 0.85, 1]) { const r = QI.werner(p); chk(L, `Negatividad de Werner (p = ${p}) = máx(0, (3p − 1)/4)`, QI.negativity(r, 2, 2), Math.max(0, (3 * p - 1) / 4), 1e-9, Math.max(0, (3 * p - 1) / 4) > 1e-9); chk(L, `CHSH del singlete de Werner con los ángulos óptimos (0, π/2; π/4, 3π/4), p = ${p}: 2√2 p`, QI.chsh(r, 0, Math.PI / 2, Math.PI / 4, 3 * Math.PI / 4), 2 * Math.SQRT2 * p, 1e-12); }
  chk(L, 'Correlación del singlete E(a, b) = −cos(a − b) (a = 0.3, b = 1.4)', QI.corr(QI.proj(QI.psiMinus), 0.3, 1.4), -Math.cos(1.1), 1e-12);
  chk(L, 'Tsirelson: el CHSH máximo del singlete es 2√2', QI.chshMax(QI.proj(QI.psiMinus)), 2 * Math.SQRT2, 1e-10);
  chk(L, 'Los estados de Bell son ortonormales: los cuatro proyectores suman la identidad', (() => { const s = [QI.psiMinus, QI.psiPlus, QI.phiPlus, QI.phiMinus].reduce((a, v) => QI.add(a, QI.proj(v)), QI.zeros(4)); let e = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) e = Math.max(e, Math.abs(s.re[i][j] - (i === j ? 1 : 0)), Math.abs(s.im[i][j])); return e; })(), 0, 1e-12, false);
  /* cota local por enumeración de las 16 asignaciones deterministas */
  chk(L, 'Cota local de CHSH por enumeración: máx |A(B − B′) + A′(B + B′)| con A, A′, B, B′ = ±1 es 2', (() => { let m = 0; for (const A of [-1, 1]) for (const A2 of [-1, 1]) for (const B of [-1, 1]) for (const B2 of [-1, 1]) m = Math.max(m, Math.abs(A * (B - B2) + A2 * (B + B2))); return m; })(), 2, 0);
}

/* ---- Cap. 32 ---- */
{
  const c = ref.central; c.t.forEach((tt, i) => chk(S, `Qubit + 5 espines (t = ${tt}): coherencia ½Π cos(g_k t) frente a la diagonalización exacta de 64 estados (numpy)`, 0.5 * c.g.reduce((p, g) => p * Math.cos(g * tt), 1) < 0 ? -0.5 * c.g.reduce((p, g) => p * Math.cos(g * tt), 1) : 0.5 * c.g.reduce((p, g) => p * Math.cos(g * tt), 1), c.c[i], 1e-10, c.c[i] > 1e-10));
  c.t.forEach((tt, i) => chk(S, `Qubit + 3 espines iguales (t = ${tt}): ½|cos t|³ frente a la diagonalización exacta de 16 estados`, 0.5 * Math.abs(Math.cos(tt)) ** 3, c.c2[i], 1e-10, c.c2[i] > 1e-10));
  for (const [k, [err, tr]] of Object.entries(ref.cat)) chk(S, `Gato de Schrödinger (α, γt) = (${k.replace('_', ', ')}): la solución analítica exp[−½|α₁ − α₂|²(1 − e^{−γt})] coincide con la ecuación maestra (scipy.solve_ivp en base de Fock de 44 estados): error máximo`, err, 0, 1e-9, false);
  chk(L, 'Medida de von Neumann: V = e^{−d²/2σ²} para d = 1.5σ es 0.32465', Math.exp(-1.125), 0.32465246735834974, 1e-14);
  chk(L, 'Solapamiento de dos gaussianas desplazadas ∫φ_{−d}φ_{+d}dx = e^{−d²/2σ²} (cuadratura de Simpson, σ = 1, d = 1.5)', (() => { let s = 0; const N = 4000, a = -12, b = 12, h = (b - a) / N; for (let i = 0; i <= N; i++) { const x = a + i * h, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * Math.exp(-((x + 1.5) ** 2) / 4) * Math.exp(-((x - 1.5) ** 2) / 4) / Math.sqrt(2 * Math.PI); } return (s * h) / 3; })(), Math.exp(-1.125), 1e-9);
  chk(L, 'Englert: V² + D² = 1', Math.exp(-2.25) + (1 - Math.exp(-2.25)), 1, 1e-15);
  chk(L, 'Decoherencia de Zurek: λ_dB = ħ/√(2mk_BT) = 3.66×10⁻²³ m para 1 g a 300 K', 1.054571817e-34 / Math.sqrt(2 * 1e-3 * 1.380649e-23 * 300), 3.664e-23, 1e-3);
  chk(L, 'τ_D/τ_R = (λ_dB/Δx)² = 1.34×10⁻⁴¹ (1 g, 300 K, 1 cm)', (3.664e-23 / 0.01) ** 2, 1.3425e-41, 5e-3);
}

/* ---- Cap. 33 ---- */
{
  const rhoB = (th) => { const c = Math.cos(th * Math.PI / 180), s = Math.sin(th * Math.PI / 180); return QI.from([[(1 + c) / 2, s / 2], [s / 2, (1 - c) / 2]]); };
  for (const r of ref.lind_relax) {
    const ev = QI.lindblad(rhoB(r.th), QI.scale(QI.Zp, r.w / 2), [{ L: QI.sm, g: 1 / r.T1 }, { L: QI.Zp, g: 1 / (2 * r.Tp) }], r.t, 4000 * Math.ceil(r.t), 4000 * Math.ceil(r.t)), e = ev[ev.length - 1].rho, b = QI.bloch(e), tag = `(T₁, T_φ, ω, θ, t) = (${r.T1}, ${r.Tp}, ${r.w}, ${r.th}°, ${r.t})`;
    ['x', 'y', 'z'].forEach((n, i) => chk(S, `Lindblad de un qubit con T₁ y T_φ ${tag}: componente ${n} del vector de Bloch frente a exp(𝓛t) (numpy/scipy)`, b[i], r.bloch[i], 2e-6, Math.abs(r.bloch[i]) > 1e-3 ? true : false));
    chk(S, `Lindblad de un qubit ${tag}: pureza Tr ρ² frente a exp(𝓛t)`, QI.purity(e), r.pur, 2e-6);
    chk(S, `Lindblad de un qubit ${tag}: entropía de von Neumann (bits) frente a exp(𝓛t)`, QI.entropy(e), r.S, 1e-5, r.S > 1e-3);
  }
  for (const r of ref.lind_opt) {
    const ev = QI.lindblad(QI.proj(QI.vec([1, 0])), QI.add(QI.scale(QI.X, r.Om / 2), QI.scale(QI.Zp, r.De / 2)), [{ L: QI.sm, g: 1 }], r.t, 3000 * Math.ceil(r.t), 3000 * Math.ceil(r.t)), e = ev[ev.length - 1].rho;
    chk(S, `Ecuaciones ópticas de Bloch (Ω, Δ, γt) = (${r.Om}, ${r.De}, ${r.t}): ρ_ee(t) frente a exp(𝓛t) (numpy/scipy)`, e.re[1][1], r.ree, 2e-6);
    chk(S, `Ecuaciones ópticas de Bloch (Ω, Δ, γt) = (${r.Om}, ${r.De}, ${r.t}): |ρ_eg(t)| frente a exp(𝓛t)`, Math.hypot(e.re[0][1], e.im[0][1]), r.coh, 2e-6);
  }
  for (const r of ref.lind_ss) {
    const ev = QI.lindblad(QI.proj(QI.vec([1, 0])), QI.add(QI.scale(QI.X, r.Om / 2), QI.scale(QI.Zp, r.De / 2)), [{ L: QI.sm, g: 1 }], 40, 8000, 8000);
    chk(S, `Estado estacionario de Lindblad (Ω, Δ) = (${r.Om}, ${r.De}): ρ_ee integrado hasta γt = 40 frente al autovector nulo del superoperador`, ev[ev.length - 1].rho.re[1][1], r.ree, 1e-6);
    chk(S, `Estado estacionario (Ω, Δ) = (${r.Om}, ${r.De}): fórmula (Ω²/4)/(Δ² + γ²/4 + Ω²/2) frente al autovector nulo del superoperador`, (r.Om ** 2 / 4) / (r.De ** 2 + 0.25 + r.Om ** 2 / 2), r.ree, 1e-12);
  }
  for (const r of ref.kraus_amp) {
    const Ks = QI.ampDamp(r.p), ch = QI.eigh(QI.choi(Ks)).values.slice().sort((a, b) => a - b), plus = QI.proj(QI.vec([Math.SQRT1_2, Math.SQRT1_2])), o = QI.kraus(plus, Ks), b = QI.bloch(o);
    r.choi.forEach((v, i) => chk(S, `Canal de amortiguamiento de amplitud (p = ${r.p}): autovalor ${i + 1} de la matriz de Choi frente a numpy`, ch[i], v, 1e-9, Math.abs(v) > 1e-9 ? true : false));
    ['x', 'y', 'z'].forEach((n, i) => chk(S, `Canal de amortiguamiento de amplitud (p = ${r.p}): vector de Bloch de |+⟩ (${n}) frente a numpy`, b[i], r.out[i], 1e-10, Math.abs(r.out[i]) > 1e-9 ? true : false));
    chk(S, `Canal de amortiguamiento de amplitud (p = ${r.p}): entropía de |+⟩ tras el canal frente a numpy`, QI.entropy(o), r.S, 1e-9);
  }
  /* equivalencia entre la ecuación de Lindblad y los canales de Kraus */
  for (const gt of [0.3, 1.2, 2.5]) {
    const rho0 = QI.from([[0.35, 0.2], [0.2, 0.65]], [[0, -0.15], [0.15, 0]]), ev = QI.lindblad(rho0, QI.zeros(2), [{ L: QI.sm, g: 1 }], gt, 4000, 4000), a = ev[ev.length - 1].rho, k = QI.kraus(rho0, QI.ampDamp(1 - Math.exp(-gt)));
    let d = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) d = Math.max(d, Math.abs(a.re[i][j] - k.re[i][j]), Math.abs(a.im[i][j] - k.im[i][j]));
    chk(L, `Lindblad con σ₋ durante γt = ${gt} ≡ canal de amortiguamiento de amplitud con p = 1 − e^{−γt} (diferencia máxima entre matrices)`, d, 0, 1e-8, false);
  }
  for (const tt of [0.4, 1.5, 3.0]) {
    const rho0 = QI.from([[0.35, 0.2], [0.2, 0.65]], [[0, -0.15], [0.15, 0]]), gphi = 1, ev = QI.lindblad(rho0, QI.zeros(2), [{ L: QI.Zp, g: gphi / 2 }], tt, 4000, 4000), a = ev[ev.length - 1].rho, k = QI.kraus(rho0, QI.phaseDamp(0.5 * (1 - Math.exp(-gphi * tt))));
    let d = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) d = Math.max(d, Math.abs(a.re[i][j] - k.re[i][j]), Math.abs(a.im[i][j] - k.im[i][j]));
    chk(L, `Lindblad con σ_z (tasa γ_φ/2) durante γ_φt = ${tt} ≡ amortiguamiento de fase con p = ½(1 − e^{−γ_φt}) (diferencia máxima)`, d, 0, 1e-8, false);
  }
  for (const lam of [0.6, 0.2, -1 / 3, -0.8]) {
    const Ks = [QI.scale(QI.eye(2), Math.sqrt(Math.max(0, 1 - 3 * (1 - lam) / 4))), QI.scale(QI.X, Math.sqrt(Math.max(0, (1 - lam) / 4))), QI.scale(QI.Y, Math.sqrt(Math.max(0, (1 - lam) / 4))), QI.scale(QI.Zp, Math.sqrt(Math.max(0, (1 - lam) / 4)))], v = QI.eigh(QI.choi(Ks)).values.slice().sort((a, b) => a - b);
    if (lam >= -1 / 3 - 1e-12) { chk(L, `Matriz de Choi del mapa r → λr (λ = ${lam.toFixed(4)}): autovalor mínimo (1 + 3λ)/2 ó (1 − λ)/2`, v[0], Math.min((1 + 3 * lam) / 2, (1 - lam) / 2), 1e-9, false); chk(L, `Matriz de Choi del mapa r → λr (λ = ${lam.toFixed(4)}): autovalor máximo (1 + 3λ)/2`, v[3], Math.max((1 + 3 * lam) / 2, (1 - lam) / 2), 1e-9); }
  }
  chk(L, 'Matriz de Choi de la inversión universal λ = −1 (formada directamente: |Φ⁺⟩ da (1 + 3λ)/2 = −1 < 0)', (() => { const J = QI.zeros(4); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { J.re[2 * i + i][2 * j + j] += -1; if (i === j) { J.re[2 * i][2 * i] += 1; J.re[2 * i + 1][2 * i + 1] += 1; } } return Math.min(...QI.eigh(J).values); })(), -1, 1e-9);
}

/* ---- Cap. 34 ---- */
{
  const qc = QC, N4 = 16;
  const st = qc.run(qc.zero(4), ref.qc_circ.ops);
  let dmax = 0; for (let i = 0; i < N4; i++) dmax = Math.max(dmax, Math.abs(st.re[i] - ref.qc_circ.re[i]), Math.abs(st.im[i] - ref.qc_circ.im[i]));
  chk(S, 'Circuito de 14 puertas (H, T, S, CNOT, CP, RY, RZ, SWAP, X, Y) sobre 4 qubits: máxima diferencia de amplitud frente a matrices de Kronecker (numpy)', dmax, 0, 1e-12, false);
  chk(L, 'Norma del estado tras el circuito de 14 puertas (unitariedad)', st.re.reduce((a, x, i) => a + x * x + st.im[i] * st.im[i], 0), 1, 1e-13);
  for (const [k, [pm, nrm]] of Object.entries(ref.grover)) {
    const [n, m, it] = k.split('_').map(Number), s = qc.grover(n, m, it), pr = qc.prob(s)[m];
    chk(S, `Grover (n = ${n}, ${it} iteraciones): P(marcada) del simulador frente a H^{⊗n}(2|0⟩⟨0| − 1)H^{⊗n} con matrices explícitas (numpy)`, pr, pm, 1e-12);
    chk(L, `Grover (n = ${n}, ${it} iteraciones): sin²((2k + 1)θ), θ = arcsen(2^{−n/2}), igual al simulador`, qc.groverP(n, it), pr, 1e-12);
  }
  chk(L, 'Grover con N = 4 (n = 2): una iteración da probabilidad exactamente 1 (θ = 30°)', qc.groverP(2, 1), 1, 1e-14);
  chk(L, 'Grover con N = 1024: k* = ⌊π/(4θ)⌋ = 25', qc.groverK(10), 25, 0, false);
  chk(L, 'Grover con N = 1024: P(k*) = sin²(51θ) ≈ 0.9995', qc.groverP(10, 25), 0.9995, 5e-4);
  { const q = ref.qft, s = qc.fromAmps(q.re, q.im); qc.qft(s); let d = 0; for (let i = 0; i < 32; i++) d = Math.max(d, Math.abs(s.re[i] - q.ore[i]), Math.abs(s.im[i] - q.oim[i]));
    chk(S, 'QFT de 5 qubits (circuito de H, fases controladas y SWAP) frente a √N·ifft (numpy): máxima diferencia de amplitud', d, 0, 1e-13, false); }
  for (const [k, r] of Object.entries(ref.tele)) {
    const [a, b, c] = k.split('_').map(Number), t = qc.teleport(a, b, c);
    chk(S, `Teletransporte (θ, φ, p) = (${a}, ${b}, ${c}): fidelidad media tras la corrección frente a la simulación de matrices densas (numpy)`, t.F, r.F, 1e-10);
    t.outcomes.forEach((o, i) => { chk(S, `Teletransporte (θ, φ, p) = (${a}, ${b}, ${c}), resultado ${i}: probabilidad del resultado de Alice frente a numpy`, o.prob, r.out[i].prob, 1e-10); chk(S, `Teletransporte (θ, φ, p) = (${a}, ${b}, ${c}), resultado ${i}: fidelidad de Bob antes de corregir frente a numpy`, o.Fpre, r.out[i].Fpre, 1e-9, r.out[i].Fpre > 1e-9); });
    chk(L, `Teletransporte con recurso de Werner p = ${c}: F = (1 + p)/2`, t.F, (1 + c) / 2, 1e-10);
  }
  chk(L, 'Teletransporte con recurso perfecto: F = 1 para cualquier estado', qc.teleport(1.1, 2.3, 1).F, 1, 1e-12);
  chk(L, 'Teletransporte: fidelidad media sin corregir de cualquier estado = ½ (no hay señalización)', qc.teleport(0.9, 0.3, 1).Fpre, 0.5, 1e-12);
  for (const [k, r] of Object.entries(ref.shor)) {
    const [N, a, m] = k.split('_').map(Number), P = qc.periodDist(N, a, m); let d = 0, tot = 0;
    r.P.forEach((v, i) => { d = Math.max(d, Math.abs(P[i * r.step] - v)); }); for (const x of P) tot += x;
    chk(S, `Shor (N, a, m) = (${N}, ${a}, ${m}): periodo r = ${r.r} y distribución P(y) del registro de entrada frente a la FFT de los pulsos periódicos (máxima diferencia, numpy)`, d, 0, 1e-12, false);
    chk(S, `Shor (N, a, m) = (${N}, ${a}, ${m}): periodo de la exponenciación modular`, qc.order(a, N), r.r, 0, false);
    chk(L, `Shor (N, a, m) = (${N}, ${a}, ${m}): normalización ΣP(y) = 1`, tot, 1, 1e-12);
  }
  chk(L, 'Shor N = 15, a = 7, m = 8: picos exactos P(64) = P(192) = 1/4', qc.periodDist(15, 7, 8)[64], 0.25, 1e-12);
  chk(L, 'Shor N = 15, a = 7, m = 8: probabilidad de éxito (y = 64 ó 192) = ½', qc.shorSuccess(15, 7, 8), 0.5, 1e-12);
  chk(L, 'Shor N = 15, a = 7: y = 192 → fracción 3/4 → r = 4', qc.shorFromY(15, 7, 192, 8).r, 4, 0, false);
  chk(L, 'Shor N = 15, a = 7: factores 3 y 5', qc.shorFromY(15, 7, 64, 8).f1 * qc.shorFromY(15, 7, 64, 8).f2, 15, 0, false);
  chk(L, 'Shor N = 15, a = 11: orden 2, éxito inmediato', qc.shorFromY(15, 11, 128, 8).ok ? 1 : 0, 1, 0, false);
  for (const [k, r] of Object.entries(ref.bitflip)) {
    const [p, al] = k.split('_').map(Number), b = qc.bitflip(p, al);
    chk(S, `Código de repetición de 3 qubits (p, α) = (${p}, ${al.toFixed(4)}): fidelidad media exacta tras corregir frente a numpy`, b.F, r[0], 1e-12);
    chk(L, `Código de repetición (p = ${p}): p_L = 3p² − 2p³`, b.pL, 3 * p * p - 2 * p ** 3, 1e-12);
  }
  chk(L, 'BB84 con intercepta-y-reenvía total (q = 1): tasa de error del 25 % en la clave filtrada', qc.bb84error(1), 0.25, 1e-14);
  chk(L, 'BB84 con q = 0.4: tasa de error q/4 = 10 %', qc.bb84error(0.4), 0.1, 1e-14);
  chk(L, 'Fracciones continuas: convergentes de 192/256 = 3/4', qc.convergents(192, 256).slice(-1)[0][0] * 1000 + qc.convergents(192, 256).slice(-1)[0][1], 3004, 0, false);
}

/* ---- Cap. 35 ---- */
{
  const fl = FLD;
  for (const r of ref.jc) {
    const NN = r.nb >= 20 ? 110 : 60, c = r.fk < 0 ? fl.cohAmps(r.nb, NN) : fl.fockAmps(r.fk, NN), tag = `(${r.fk < 0 ? 'coherente n̄ = ' + r.nb : 'Fock n = ' + r.fk}, Δ = ${r.De}, g = ${r.g}, t = ${r.t})`, at = fl.atom(c, r.De, r.g, r.t);
    chk(S, `Jaynes–Cummings ${tag}: P_e(t) frente a exp(−iHt) en el espacio de Fock truncado (scipy)`, fl.pe(c, r.De, r.g, r.t), r.Pe, 1e-9);
    chk(S, `Jaynes–Cummings ${tag}: ρ_ee del átomo reducido frente a scipy`, at.ee, r.Pe, 1e-9);
    chk(S, `Jaynes–Cummings ${tag}: entropía de entrelazamiento átomo–campo (bits) frente a scipy`, at.S, r.S, 1e-8);
    chk(S, `Jaynes–Cummings ${tag}: pureza del átomo reducido frente a scipy`, at.purity, r.pur, 1e-9);
    const Lw = Math.max(7, Math.SQRT2 * (Math.sqrt(r.nb + r.fk + 1) + 4)), Mw = Math.ceil((2 * Lw) / 0.12), W = fl.fieldWigner(c, r.De, r.g, r.t, Lw, Mw), d = (2 * Lw) / Mw; let norm = 0; for (const w of W) norm += w * d * d;
    chk(L, `Jaynes–Cummings ${tag}: la función de Wigner del campo está normalizada (∬W dξ dπ = 1)`, norm, 1, 1e-5);
    chk(L, `Jaynes–Cummings ${tag}: pureza del campo = pureza del átomo (descomposición de Schmidt), por 2π∬W²`, (2 * Math.PI) * W.reduce((s, w) => s + w * w * d * d, 0), r.purF, 2e-3);
    if (r.pts.length) {
      const M = 100, Lg = 7, dd = (2 * Lg) / M, Wf = fl.fieldWigner(c, r.De, r.g, r.t, Lg, M);
      r.pts.forEach(([xi, pi_], i) => {
        /* se interpola bilinealmente la malla en el punto pedido */
        const fx = xi / dd + (M - 1) / 2, fp = pi_ / dd + (M - 1) / 2, ix = Math.floor(fx), jp = Math.floor(fp), ax = fx - ix, ap = fp - jp, G = (a, b) => Wf[b * M + a];
        const v = (1 - ax) * (1 - ap) * G(ix, jp) + ax * (1 - ap) * G(ix + 1, jp) + (1 - ax) * ap * G(ix, jp + 1) + ax * ap * G(ix + 1, jp + 1);
        chk(S, `Jaynes–Cummings ${tag}: Wigner del campo en (ξ, π) = (${xi}, ${pi_}) frente a la paridad desplazada Tr[D†ρDΠ]/π (scipy)`, v, r.W[i], 1e-2, false);
      });
    }
  }
  chk(S, 'Estado coherente de amplitud n̄ = 9: Σ c_n² = 1', fl.cohAmps(9, 60).reduce((s, x) => s + x * x, 0), 1, 1e-14);
  chk(L, 'Resonancia, Fock |3⟩: P_e(t) = cos²(g√(n+1) t) en t = π/4 (g = 1): P_e = 0', fl.pe(fl.fockAmps(3, 10), 0, 1, Math.PI / 4), 0, 1e-12, false);
  chk(L, 'Resonancia, vacío (n = 0): P_e(t) = cos²(g t) en t = 0.7 (oscilación de Rabi del vacío)', fl.pe(fl.fockAmps(0, 10), 0, 1, 0.7), Math.cos(0.7) ** 2, 1e-13);
  chk(L, 'Espectro vestido: Ω₀ = 2g en resonancia (desdoblamiento del vacío de Rabi)', fl.Omega(0, 0, 0.5), 1, 1e-14);
  chk(L, 'Espectro vestido: Ω_n = √(Δ² + 4g²(n+1)) con Δ = 3g, n = 0 → 3.6056 g', fl.Omega(0, 3, 1), Math.sqrt(13), 1e-14);
  chk(L, 'Transferencia máxima con desintonía Δ = 3g (n = 0): 4g²/Ω² = 4/13', 4 / (fl.Omega(0, 3, 1) ** 2), 4 / 13, 1e-14);
  chk(S, 'Wigner de |2⟩ por la fórmula de la función de onda frente al término de Laguerre analítico (−1)ⁿe^{−ρ}Lₙ(2ρ)/π en (ξ, π) = (0.35, 0.35)', (() => { const M = 200, Lg = 6, dd = 12 / M, W = fl.wigner(fl.fockAmps(2, 6), new Float64Array(6), Lg, M), i = Math.round(0.35 / dd + (M - 1) / 2), x = (i - (M - 1) / 2) * dd, rho = 2 * x * x; return W[i * M + i] - Math.exp(-rho) * (1 - 2 * (2 * rho) + (2 * rho) ** 2 / 2) / Math.PI; })(), 0, 1e-4, false);
  chk(S, 'Casimir: término finito de la energía regularizada (corte e^{−εω}, sumas exactas, SymPy) = −π²ħc/(720 d³)', ref.casimir.coef, ref.casimir.exact, 1e-12);
  chk(L, 'Casimir: presión −π²ħc/(240 d⁴) a d = 1 μm = −1.30 mPa', -(Math.PI ** 2) * 1.054571817e-34 * 2.99792458e8 / (240 * 1e-6 ** 4) * 1000, -1.3, 5e-3);
}

/* ---- Cap. 36 ---- */
{
  const pt = PTH, ho = (x) => 0.5 * x * x;
  /* núcleo euclídeo de Mehler y producto de Trotter frente a la suma sobre autofunciones (scipy) */
  const e = ref.euc;
  e.x.forEach((x, i) => { chk(S, `Núcleo euclídeo de Mehler ⟨x|e^{−βH}|x⟩ (β = 3, x = ${x.toFixed(1)}) frente a Σ e^{−βE_n}ψ_n(x)² (scipy, 80 términos)`, pt.kEuHO(x, x, 3), e.d3[i], 1e-9, e.d3[i] > 1e-9); chk(S, `Núcleo euclídeo de Mehler ⟨x|e^{−βH}|−x⟩ (β = 3, x = ${x.toFixed(1)}) frente a la suma de autofunciones`, pt.kEuHO(x, -x, 3), e.off3[i], 1e-9, e.off3[i] > 1e-9); });
  { let s = 0; const n = 4000, a = -10, b = 10, h = (b - a) / n; for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * pt.kEuHO(a + i * h, a + i * h, 3); s *= h / 3; chk(S, 'Función de partición Z = ∫K_E(x, x; β)dx a β = 3 frente a Σ e^{−β(n+½)} (1/[2 senh(β/2)])', s, e.Z3, 1e-12); chk(L, 'Z(β) = 1/[2 senh(β/2)] a β = 3 (Σ exacta)', pt.zHO(3), e.Z3, 1e-12); }
  const errs = [];
  for (const N of [16, 32, 64, 128, 256]) {
    const T = pt.trotter(ho, -6, 6, 241, 3, N); let me = 0; e.x.forEach((x, i) => { const j = Math.round((x + 6) / T.dx); me = Math.max(me, Math.abs(T.rho[j * T.M + j] - e.d3[i]) / Math.max(e.d3[i], 1e-3)); });
    errs.push(me); if (N >= 64) chk(S, `Producto de Trotter con N = ${N} cortes (β = 3, malla de 241 puntos): máxima diferencia relativa de la diagonal de ρ frente a la suma de autofunciones`, me, 0, N === 64 ? 6e-3 : N === 128 ? 2e-3 : 5e-4, false);
  }
  chk(L, 'Trotter: el error decae como 1/N² (cociente de errores N = 64 → 128 vale ≈ 4)', errs[2] / errs[3], 4, 0.15);
  chk(L, 'Trotter: el error decae como 1/N² (cociente N = 128 → 256 vale ≈ 4)', errs[3] / errs[4], 4, 0.15);
  { const T = pt.trotter(ho, -6, 6, 241, 3, 256), r = pt.trotterX2(T); chk(S, 'Trotter (N = 256): Z = Tr ρ frente a 1/[2 senh(β/2)]', r.Z, e.Z3, 3e-4); chk(L, 'Trotter (N = 256): ⟨x²⟩ = ½ coth(β/2) a β = 3', r.x2, pt.x2HO(3), 3e-4); }
  /* propagación en tiempo real con los núcleos de camino */
  const simp = (f, a, b, n) => { let sr = 0, si = 0; const h = (b - a) / n; for (let i = 0; i <= n; i++) { const [fr, fi] = f(a + i * h), w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; sr += w * fr; si += w * fi; } return [(sr * h) / 3, (si * h) / 3]; };
  const psi0 = (x) => Math.pow(Math.PI, -0.25) * Math.exp(-((x - Math.SQRT2 * 1.5) ** 2) / 2);
  for (const [ts, vals] of Object.entries(ref.coh36)) {
    const t = +ts; [-1, 0.4, 2.2].forEach((x, i) => { const v = simp((xp) => { const k = pt.kHO(xp, x, t), p = psi0(xp); return [k[0] * p, k[1] * p]; }, -4, 12, 6400); chk(S, `Estado coherente (α = 1.5) propagado con el núcleo de Mehler del oscilador (t = ${t}, x = ${x}): Re ψ frente a la solución analítica (numpy)`, v[0], vals[i][0], 2e-5, false); chk(S, `Estado coherente propagado con el núcleo de Mehler (t = ${t}, x = ${x}): Im ψ frente a la solución analítica`, v[1], vals[i][1], 2e-5, false); });
  }
  for (const [ts, vals] of Object.entries(ref.free)) {
    const t = +ts, g0 = (x) => [Math.pow(Math.PI, -0.25) * Math.exp(-x * x / 2), 0]; [-1, 0.4, 2.2].forEach((x, i) => { const v = simp((xp) => { const k = pt.kFree(x - xp, t), p = g0(xp)[0]; return [k[0] * p, k[1] * p]; }, -10, 10, 40000); chk(S, `Paquete gaussiano libre propagado con K = √(m/2πiħt)e^{im(x−x′)²/2ħt} (t = ${t}, x = ${x}): Re ψ frente a la solución analítica (numpy)`, v[0], vals[i][0], 5e-5, false); chk(S, `Paquete gaussiano libre propagado con el núcleo de camino (t = ${t}, x = ${x}): Im ψ frente a la solución analítica`, v[1], vals[i][1], 5e-5, false); });
  }
  /* acción clásica del oscilador */
  for (const [xa, xb, T] of [[0.7, -1.2, 1.3], [1.5, 0.4, 2.6]]) {
    const n = 20000, h = T / n; let sI = 0; const xc = (t) => (xa * Math.sin(T - t) + xb * Math.sin(t)) / Math.sin(T), vc = (t) => (-xa * Math.cos(T - t) + xb * Math.cos(t)) / Math.sin(T);
    for (let i = 0; i <= n; i++) { const t = i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; sI += (w * (0.5 * vc(t) ** 2 - 0.5 * xc(t) ** 2) * h) / 3; }
    chk(L, `Acción clásica del oscilador (x_a, x_b, T) = (${xa}, ${xb}, ${T}): ∫(½ẋ² − ½x²)dt frente a [(x_a² + x_b²)cos T − 2x_a x_b]/(2 sen T)`, sI, ((xa * xa + xb * xb) * Math.cos(T) - 2 * xa * xb) / (2 * Math.sin(T)), 1e-9);
  }
  /* oscilador con acción primitiva discreta */
  for (const [k, v] of Object.entries(ref.hodisc)) { const [b, p] = k.split('_').map(Number); chk(S, `⟨x²⟩ del oscilador con acción primitiva discreta (β = ${b}, P = ${p}) frente a la inversa de la forma cuadrática (numpy)`, pt.hoDiscrete(b, p), v, 1e-12); }
  chk(L, 'Límite del continuo: ⟨x²⟩_P → ½coth(β/2) con P = 2048 (β = 4)', pt.hoDiscrete(4, 2048), pt.x2HO(4), 1e-6);
  /* Monte Carlo de integrales de camino */
  const pimcCase = { ho: [ho, 4, 16], ho2: [ho, 2, 8], dw: [(x) => (x * x - 1) ** 2, 3, 16], dw2: [(x) => (x * x - 1) ** 2, 1, 8] };
  for (const [nm, [V, b, p]] of Object.entries(pimcCase)) {
    const r = pt.pimc(V, b, p, { seed: 11, sweeps: 40000, L: 8, x0: nm.startsWith('dw') ? 1 : 0 }), x2 = ref.pimc[nm].x2;
    chk(S, `Monte Carlo de caminos (${nm}, β = ${b}, P = ${p}, 40000 barridos): ⟨x²⟩ frente al producto matricial de la misma acción primitiva (numpy, error ±${r.err.toFixed(4)}): diferencia en desviaciones típicas`, Math.abs(r.x2 - x2) / r.err, 0, 3.5, false);
    chk(L, `Monte Carlo de caminos (${nm}): error estadístico < 2 % de ⟨x²⟩`, r.err / r.x2, 0, 0.02, false);
  }
  { const r = pt.pimc(ho, 4, 16, { seed: 5, sweeps: 40000 }); chk(S, 'Monte Carlo del oscilador (β = 4, P = 16) frente a ⟨x²⟩_P exacto de la acción discreta: diferencia en desviaciones típicas', Math.abs(r.x2 - pt.hoDiscrete(4, 16)) / r.err, 0, 3.5, false); }
  /* regresión: las cifras que muestra la simulación (semilla 3, 20000 barridos) */
  { const hist = { min: -3.5, max: 3.5, n: 70, c: new Float64Array(70) }, r = pt.pimc(ho, 4, 16, { seed: 3, sweeps: 20000, L: 8, hist, keep: 3333, x0: 0 }); chk(L, 'Monte Carlo (regresión de la simulación, oscilador β = 4, P = 16, semilla 3, 20000 barridos): ⟨x²⟩ = 0.5159 ± 0.0047', r.x2, 0.5159, 3e-4, false); chk(L, 'Monte Carlo (regresión de la simulación): error de bloques 0.0047', r.err, 0.0047, 3e-4, false); chk(L, 'Monte Carlo (regresión): aceptación 78.7 %', r.accept * 100, 78.7, 0.05, false); }
  { const hist = { min: -3.5, max: 3.5, n: 70, c: new Float64Array(70) }, r = pt.pimc((x) => (x * x - 1) ** 2, 3, 16, { seed: 3, sweeps: 20000, L: 8, hist, keep: 3333, x0: 1 }); chk(L, 'Monte Carlo (regresión de la simulación, doble pozo β = 3, P = 16, semilla 3): ⟨x²⟩ = 0.6258 ± 0.0034', r.x2, 0.6258, 3e-4, false); chk(L, 'Monte Carlo (regresión): error de bloques 0.0034', r.err, 0.0034, 3e-4, false); }
  /* doble pozo: continuo (DVR de Fourier) */
  chk(S, 'Doble pozo (x² − 1)²: energía fundamental (DVR de Fourier fino, numpy) es 0.86958', ref.dw_exact['1.0'][1], 0.8695809189358992, 1e-12);
  { const T = pt.trotter((x) => (x * x - 1) ** 2, -5, 5, 201, 3, 128), r = pt.trotterX2(T); chk(S, 'Doble pozo: ⟨x²⟩ térmico a β = 3 con el producto de Trotter (N = 128) frente a la diagonalización exacta (numpy)', r.x2, ref.dw_exact['3.0'][0], 2e-3); }
  /* Fresnel y espiral de Cornu */
  for (const f of ref.fresnel) { const r = pt.fresnel(f.x); chk(S, `Integral de Fresnel C(${f.x}) frente a scipy.special.fresnel`, r.C, f.C, 1e-12, false); chk(S, `Integral de Fresnel S(${f.x}) frente a scipy.special.fresnel`, r.S, f.S, 1e-12, false); }
  chk(L, 'Fresnel: C(∞) = S(∞) = ½ (x = 40)', pt.fresnel(40).C + pt.fresnel(40).S, 1, 2e-2);
  { const a = 1.7, Y = 2.3, u = Y * Math.sqrt((2 * a) / Math.PI), r = pt.fresnel(u), q = 2 * Math.sqrt(Math.PI / (2 * a)), v = simp((y) => [Math.cos(a * y * y), Math.sin(a * y * y)], -Y, Y, 20000);
    chk(L, 'Camino cerca de la clásica: ∫_{−Y}^{Y} e^{iay²}dy = 2√(π/2a)[C(u) + iS(u)] (parte real, cuadratura de Simpson)', q * r.C, v[0], 1e-9, false); chk(L, 'Camino cerca de la clásica: la misma integral (parte imaginaria)', q * r.S, v[1], 1e-9, false); }
}

/* ---- Cap. 37 ---- */
{
  const D = DIR, Qm = QI;
  /* álgebra de Clifford y espinores de onda plana */
  { let dev = 0; const a = [0, 1, 2].map((i) => D.alpha(i)), b = D.beta();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const s = Qm.add(Qm.mul(a[i], a[j]), Qm.mul(a[j], a[i])); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) dev = Math.max(dev, Math.abs(s.re[r][c] - (i === j && r === c ? 2 : 0)), Math.abs(s.im[r][c])); }
    chk(L, 'Álgebra de Dirac: {α_i, α_j} = 2δ_ij (diferencia máxima de las 9 combinaciones)', dev, 0, 1e-14, false);
    dev = 0; for (let i = 0; i < 3; i++) { const s = Qm.add(Qm.mul(a[i], b), Qm.mul(b, a[i])); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) dev = Math.max(dev, Math.abs(s.re[r][c]), Math.abs(s.im[r][c])); }
    chk(L, 'Álgebra de Dirac: {α_i, β} = 0', dev, 0, 1e-14, false);
    const b2 = Qm.mul(b, b); dev = 0; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) dev = Math.max(dev, Math.abs(b2.re[r][c] - (r === c ? 1 : 0)));
    chk(L, 'Álgebra de Dirac: β² = 1', dev, 0, 1e-14, false);
    /* gammas: {γ^μ, γ^ν} = 2g^{μν} con g = diag(+, −, −, −) */
    dev = 0; for (let mu = 0; mu < 4; mu++) for (let nu = 0; nu < 4; nu++) { const s = Qm.add(Qm.mul(D.gamma(mu), D.gamma(nu)), Qm.mul(D.gamma(nu), D.gamma(mu))), gmn = mu === nu ? (mu === 0 ? 2 : -2) : 0; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) dev = Math.max(dev, Math.abs(s.re[r][c] - (r === c ? gmn : 0)), Math.abs(s.im[r][c])); }
    chk(L, 'Matrices γ^μ de Dirac: {γ^μ, γ^ν} = 2g^{μν} para las 16 combinaciones', dev, 0, 1e-14, false); }
  for (const [p, m, chi] of [[[0.3, -0.4, 1.1], 1, [0.6, 0, 0.8, 0]], [[2.0, 0.5, -1.0], 0.7, [0.5, 0.5, 0.5, 0.5]], [[0, 0, 5], 1, [1, 0, 0, 0]]]) {
    const E = D.energy(p, m), H = D.H(p, m), tag = `p = (${p.join(', ')}), m = ${m}`;
    for (const s of [1, -1]) {
      const u = D.spinor(p, m, s, chi), nn = u.reduce((x, y) => x + y * y, 0); let dev = 0;
      for (let r = 0; r < 4; r++) { let hr = 0, hi = 0; for (let c = 0; c < 4; c++) { hr += H.re[r][c] * u[2 * c] - H.im[r][c] * u[2 * c + 1]; hi += H.re[r][c] * u[2 * c + 1] + H.im[r][c] * u[2 * c]; } dev = Math.max(dev, Math.abs(hr - s * E * u[2 * r]), Math.abs(hi - s * E * u[2 * r + 1])); }
      chk(L, `Espinor de Dirac ${s > 0 ? 'de energía positiva' : 'de energía negativa'} (${tag}): H u = ±E u (diferencia máxima)`, dev, 0, 1e-13, false);
      chk(L, `Espinor de Dirac ${s > 0 ? '+' : '−'} (${tag}): norma u†u = |χ|²`, nn, chi.reduce((x, y) => x + y * y, 0), 1e-12);
    }
    const ev = Qm.eigh(H).values.slice().sort((x, y) => x - y); chk(L, `Autovalores de H(p) (${tag}): ±√(p² + m²) doblemente degenerados`, Math.abs(ev[0] + E) + Math.abs(ev[1] + E) + Math.abs(ev[2] - E) + Math.abs(ev[3] - E), 0, 1e-12, false);
  }
  /* evolución 1D frente a la exponencial de matriz de cada modo k (scipy) */
  for (const r of ref.dirac1d) {
    const ps = D.gauss1D(r.N, r.L, r.sigma, r.p0, r.chi);
    for (const e of r.ev) {
      const s = D.evolve1D(ps.ar, ps.ai, ps.br, ps.bi, r.L, r.m, e.t), st = D.stats1D(s, r.L, r.m), tag = `(σ, p₀, χ, m) = (${r.sigma}, ${r.p0}, ${r.chi.toFixed(2)}, ${r.m}), t = ${e.t}`;
      chk(S, `Paquete de Dirac 1D ${tag}: ⟨x⟩ frente a expm(−iH_k t) por modo (scipy)`, st.x, e.x, 1e-9, Math.abs(e.x) > 1e-6);
      chk(S, `Paquete de Dirac 1D ${tag}: ⟨σ_x⟩ (velocidad) frente a scipy`, st.sigmax, e.sx, 1e-9);
      chk(L, `Paquete de Dirac 1D ${tag}: la norma se conserva`, st.norm, 1, 1e-12);
    }
  }
  /* Ehrenfest: d⟨x⟩/dt = ⟨σ_x⟩ */
  { const N = 256, Ll = 60, ps = D.gauss1D(N, Ll, 0.8, 0.5, 0.9), t0 = 1.7, h = 1e-4, xp = D.stats1D(D.evolve1D(ps.ar, ps.ai, ps.br, ps.bi, Ll, 1, t0 + h), Ll, 1).x, xm = D.stats1D(D.evolve1D(ps.ar, ps.ai, ps.br, ps.bi, Ll, 1, t0 - h), Ll, 1).x, v = D.stats1D(D.evolve1D(ps.ar, ps.ai, ps.br, ps.bi, Ll, 1, t0), Ll, 1).sigmax;
    chk(L, 'Teorema de Ehrenfest relativista: d⟨x⟩/dt (derivada centrada de la evolución exacta) = ⟨σ_x⟩ = ⟨c α_x⟩', (xp - xm) / (2 * h), v, 1e-7); }
  /* peso de energía negativa de un paquete gaussiano: ∫|g(k)|²(E − m)/2E dk para χ = 0 */
  for (const sg of [0.3, 1, 3]) { const ps = D.gauss1D(512, 60, sg, 0, 0), w = D.stats1D(ps, 60, 1).wneg; let I = 0; const sk = 1 / (2 * sg), n = 20000, kmax = 12 * sk, dk = (2 * kmax) / n; for (let i = 0; i < n; i++) { const k = -kmax + (i + 0.5) * dk, E = Math.sqrt(k * k + 1); I += Math.exp(-(k * k) / (2 * sk * sk)) / (sk * Math.sqrt(2 * Math.PI)) * ((E - 1) / (2 * E)) * dk; }
    chk(L, `Peso de la componente de energía negativa de un paquete (χ = 0, σ = ${sg}): ∫|g(k)|²(E − m)/(2E)dk por cuadratura (en el punto medio)`, w, I, 2e-3); }
  { const ps = D.gauss1D(1024, 240, 10, 0, Math.PI / 4), s = D.evolve1D(ps.ar, ps.ai, ps.br, ps.bi, 240, 1, Math.PI / 2);
    chk(L, 'Zitterbewegung: un espinor (1, 1)/√2 sin momento (σ muy ancha) tiene ⟨σ_x⟩(t) = cos(2mt): en t = π/2 vale −1', D.stats1D(s, 240, 1).sigmax, -1, 8e-3); }
  /* escalón de Klein */
  for (const k of ref.klein) { const r = D.klein(k.E, k.V0);
    chk(S, `Escalón de Dirac (E, V₀) = (${k.E}, ${k.V0}): reflectancia R frente al ajuste directo de los espinores (numpy)`, r.R, k.R, 1e-12); chk(S, `Escalón de Dirac (E, V₀) = (${k.E}, ${k.V0}): transmitancia T (flujo) frente al ajuste directo`, r.T, k.T, 1e-12, k.T > 1e-12); chk(L, `Escalón de Dirac (E, V₀) = (${k.E}, ${k.V0}): R + T = 1 (conservación de la corriente)`, r.R + r.T, 1, 1e-13); }
  chk(L, 'Paradoja de Klein: con V₀ → ∞ la transmisión tiende a 4p(E + m)/(p + E + m)² (E = 2m)', D.klein(2, 1e9).T, D.kleinInfinite(2), 1e-6);
  chk(L, 'Paradoja de Klein: el límite 4p(E + m)/(p + E + m)² a E = 2m vale 0.92820', D.kleinInfinite(2), 0.9282032302755092, 1e-12);
  /* hidrogenoide de Dirac frente a mpmath */
  for (const h of ref.dirac_hyd) chk(S, `Energía exacta de Dirac del hidrogenoide (n, j, Z) = (${h.n}, ${h.j}, ${h.Z}) en unidades de mc² frente a mpmath (30 dígitos)`, D.hydrogenic(h.n, h.j, h.Z), h.E, 1e-13);
  chk(L, 'Dirac hidrogenoide: la energía del nivel 1s½ con Z = 92 es mc²√(1 − (Zα)²) = 0.74113 mc²', D.groundCritical(92), D.hydrogenic(1, 0.5, 92), 1e-14);
  chk(L, 'Dirac hidrogenoide: el límite no relativista Z → 0: E − mc² ≈ −Z²α²mc²/2n² (Z = 1, n = 1) con error O(α⁴)', (D.hydrogenic(1, 0.5, 1) - 1) / (-(D.fineStructure ** 2) / 2), 1, 2e-4);
  /* niveles de Landau relativistas */
  for (const [m, eB] of [[1, 0.3], [0.5, 0.8]]) { const lv = D.landau(m, eB, 14), vals = lv.vals, pos = vals.filter((x) => x > 0), nm = [];
    for (let n = 1; n <= 8; n++) nm.push(Math.sqrt(m * m + 2 * n * eB));
    const phys = pos.filter((x) => x > m + 1e-9 && x < Math.sqrt(m * m + 2 * 9 * eB)); let dev = 0; for (let i = 0; i < nm.length; i++) dev = Math.max(dev, Math.abs(phys[2 * i] - nm[i]), Math.abs(phys[2 * i + 1] - nm[i]));
    chk(L, `Niveles de Landau de Dirac (m = ${m}, eB = ${eB}): los 16 primeros niveles positivos son √(m² + 2neB) con degeneración doble (n ≥ 1)`, dev, 0, 1e-11, false);
    chk(L, `Niveles de Landau de Dirac (m = ${m}, eB = ${eB}): el nivel n = 0 está exactamente en E = m (g = 2: cancela el punto cero)`, pos[0], m, 1e-12); }
}

/* ---- Resultado ---- */
let pr = [];
try { pr = JSON.parse(fs.readFileSync(path.join(__dirname, 'problemas.json'), 'utf8')).rows; } catch (e) { console.log('Sin problemas.json (python tests/problemas.py)'); }
for (const r of pr) { rows.push(r); r.pass ? ok++ : bad++; if (!r.pass) console.log('FALLA problema', r.name, r.got, r.exp); }
const out = { fecha: new Date().toISOString().slice(0, 10), ok, bad, rows };
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify(out, null, 1));
console.log(`${ok} de ${ok + bad} pruebas superadas` + (bad ? ` · ${bad} FALLAN` : ''));
process.exit(bad ? 1 : 0);
