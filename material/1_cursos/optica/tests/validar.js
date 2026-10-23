/* Validación de la biblioteca científica (src/core/30-optics.js y 31-num.js).
   1) contra referencias independientes: SciPy/NumPy, SymPy (sympy.physics.optics), tmm (multicapas),
      miepython (Mie) y colour-science (colorimetría CIE);
   2) soluciones numéricas del curso contra soluciones exactas;
   3) contra datos de catálogo y de la literatura.
   Ejecutar: node tests/validar.js   (python tests/referencias.py antes, si cambió) */
const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '../src/core/29-cie.js'));
require(path.join(__dirname, '../src/core/29-metals.js'));
const OP = require(path.join(__dirname, '../src/core/30-optics.js'));
require(path.join(__dirname, '../src/core/31-num.js'));
const ref = require('./referencias.json');
const PI = Math.PI, deg = PI / 180, Cx = OP.C;
let ok = 0, bad = 0;
const rows = [];
function chk(group, name, got, exp, tol, rel = true) {
  const err = rel ? Math.abs(got - exp) / Math.max(1e-300, Math.abs(exp)) : Math.abs(got - exp);
  const pass = isFinite(got) && err <= tol;
  pass ? ok++ : bad++;
  rows.push({ group, name, got, exp, tol: (rel ? 'rel ' : 'abs ') + tol, pass });
  if (!pass) console.log('FALLA', group, '·', name, 'obtenido', got, 'esperado', exp, 'err', err);
}
const S = 'SciPy', Y = 'SymPy', T = 'tmm', M = 'miepython', K = 'colour', N = 'Numérico', L = 'Literatura';
const fk = (k) => k.split(',').map(Number);
const t0 = Date.now();

/* ================= SciPy / NumPy ================= */
for (const [k, v] of Object.entries(ref.J)) { const [n, x] = fk(k); chk(S, `J${'₀₁₂₃₄₅'[n]}(${x})`, OP.besselJ(n, x), v, 1e-12, false); }
for (const [k, v] of Object.entries(ref.K)) { const [n, x] = fk(k); chk(S, `K${'₀₁₂'[n]}(${x})`, OP.besselK(n, x), v, 1e-11); }
for (const [n, zs] of Object.entries(ref.jzeros)) zs.forEach((z, i) => chk(S, `cero ${i + 1} de J${'₀₁₂'[+n]}`, OP.besselJzero(+n, i + 1), z, 1e-13));
for (const [x, v] of Object.entries(ref.fresnel)) { const [c, s] = OP.fresnelCS(+x); chk(S, `integral de Fresnel C(${x})`, c, v[0], 1e-12, false); chk(S, `integral de Fresnel S(${x})`, s, v[1], 1e-12, false); }
for (const [k, v] of Object.entries(ref.hermite)) { const [n, x] = fk(k); chk(S, `Hermite H${n}(${x})`, OP.hermite(n, x), v, 1e-12); }
for (const [k, v] of Object.entries(ref.laguerre)) { const [p, l, x] = fk(k); chk(S, `Laguerre L${p}^${l}(${x})`, OP.laguerre(p, l, x), v, 1e-12); }
{
  const re = Float64Array.from(ref.fft.re), im = Float64Array.from(ref.fft.im);
  OP.fft(re, im);
  for (const [b, v] of Object.entries(ref.fft.bins)) { chk(S, `FFT de 64 puntos, componente ${b} (parte real, numpy.fft)`, re[+b], v[0], 1e-12, false); chk(S, `FFT de 64 puntos, componente ${b} (parte imaginaria)`, im[+b], v[1], 1e-12, false); }
  const r2 = Float64Array.from(ref.fft2.z), i2 = new Float64Array(256);
  OP.fft2(r2, i2, 16);
  for (const [k, v] of Object.entries(ref.fft2.bins)) { const [a, b] = fk(k); chk(S, `FFT 2D 16×16, componente (${a}, ${b}) (numpy.fft.fft2)`, Math.hypot(r2[a * 16 + b], i2[a * 16 + b]), Math.hypot(v[0], v[1]), 1e-12, false); }
}
for (const [Tk, v] of Object.entries(ref.planck_total)) {
  const Tv = +Tk;
  chk(S, `radiancia total de Planck σT⁴/π frente a quad, T = ${Tv} K`, (OP.sigmaSB * Math.pow(Tv, 4)) / PI, v, 1e-9);
}
for (const [k, v] of Object.entries(ref.bb_frac)) { const [l, Tv] = fk(k); chk(S, `fracción de cuerpo negro por debajo de ${l} nm a ${Tv} K`, OP.bbFraction(l * 1e-9, Tv), v, 1e-8); }
chk(S, 'constante de desplazamiento de Wien (brentq)', OP.wienB, ref.wien_b, 1e-13);
for (const [k, v] of Object.entries(ref.rainbow)) {
  const [n, kk] = fk(k);
  chk(S, `arcoíris de orden ${kk}, n = ${n}: ángulo de Descartes (minimize_scalar)`, OP.rainbowTh(n, kk), v[0], 2e-7);
  chk(S, `arcoíris de orden ${kk}, n = ${n}: desviación mínima`, OP.rainbowD(n, OP.rainbowTh(n, kk), kk), v[1], 1e-12);
}
for (const [k, v] of Object.entries(ref.prism_min)) { const [n, A] = fk(k); chk(S, `desviación mínima de un prisma n = ${n}, A = ${A}°`, OP.prismMin(n, A * deg), v, 1e-10); }
for (const [k, v] of Object.entries(ref.slab)) {
  const [n1, n2, d, lam] = fk(k), r = OP.slabTE(n1, n2, d, lam);
  chk(S, `guía plana n₁ = ${n1}, n₂ = ${n2}, d = ${d * 1e6} µm: número de modos TE`, r.modes.length, v.length, 0, false);
  v.forEach((ne, i) => chk(S, `guía plana n₁ = ${n1}, d = ${d * 1e6} µm: índice efectivo del modo TE${i}`, r.modes[i] ? r.modes[i].neff : NaN, ne, 1e-12));
}
for (const [k, v] of Object.entries(ref.lp)) { const [l, V, m] = fk(k); chk(S, `fibra débilmente guiante: b del modo LP${l}${m} con V = ${V}`, OP.lpB(l, V, m), v, 1e-9); }
for (const [Lk, v] of Object.entries(ref.disp)) {
  const Lv = +Lk;
  chk(S, `sílice: dispersión material D(${Lv} µm) (derivada numérica de orden 4)`, OP.matDispersion(OP.SELL.silica, Lv), v[0], 1e-6);
  chk(S, `sílice: índice de grupo en ${Lv} µm`, OP.groupIndex(OP.SELL.silica, Lv), v[1], 1e-9);
}
chk(S, 'sílice: longitud de onda de dispersión nula', OP.bisect((l) => OP.matDispersion(OP.SELL.silica, l), 1.1, 1.5), ref.zdw, 1e-8);
for (const [l, v] of Object.entries(ref.pm_bbo)) chk(S, `BBO tipo I: ángulo de ajuste de fase para ${l} nm → ${+l / 2} nm`, OP.pmTypeI('BBO', +l) / deg, v, 1e-9);

/* ================= SymPy ================= */
for (const [k, v] of Object.entries(ref.sym_fresnel)) {
  const [n1, n2, th] = fk(k), f = OP.fresnel(n1, n2, th);
  const names = ['r_p', 'r_s', 't_p', 't_s'], mine = [f.rp, f.rs, f.tp, f.ts];
  const tir = n1 > n2 && Math.sin(th) * n1 > n2;
  mine.forEach((z, i) => {
    if (tir && i > 1) return; /* sympy no da t en reflexión total */
    chk(Y, `Fresnel ${n1}→${n2}, θ = ${th} rad: ${names[i]}${tir ? ' (reflexión total, complejo)' : ''}`, Cx.abs(Cx.sub(z, v[i])), 0, 1e-12, false);
  });
}
for (const [k, v] of Object.entries(ref.sym_brewster)) { const [a, b] = fk(k); chk(Y, `ángulo de Brewster ${a}→${b}`, OP.brewster(a, b), v, 1e-14); }
for (const [k, v] of Object.entries(ref.sym_critical)) { const [a, b] = fk(k); chk(Y, `ángulo crítico ${a}→${b}`, OP.critical(a, b), v, 1e-14); }
for (const [k, v] of Object.entries(ref.sym_lensmaker)) { const [n, nm, r1, r2, d] = fk(k); chk(Y, `fabricante de lentes n = ${n}, medio ${nm}, R₁ = ${r1}, R₂ = ${r2 > 1e11 ? '∞' : r2}, d = ${d}`, OP.lensmaker(n, r1, r2, d, nm), v, 1e-11); }
for (const [k, v] of Object.entries(ref.sym_hyperfocal)) { const [f, Nn, c] = fk(k); chk(Y, `distancia hiperfocal f = ${f * 1000} mm, f/${Nn}`, OP.hyperfocal(f, Nn, c) - f, v, 1e-13); }
{
  const Mm = OP.M, sys = Mm.chain([Mm.curved(25, 1, 1.6), Mm.free(6), Mm.curved(-40, 1.6, 1), Mm.free(50), Mm.mirror(-200), Mm.free(30)]);
  ['A', 'B', 'C', 'D'].forEach((nm, i) => chk(Y, `matriz ABCD de lente gruesa + espejo: elemento ${nm}`, sys[i >> 1][i & 1], ref.sym_abcd[i >> 1][i & 1], 1e-12, false));
}
for (const [k, v] of Object.entries(ref.sym_beam)) {
  const [lam, z, w0] = fk(k), g = OP.gb;
  const lab = `haz gaussiano λ = ${Math.round(lam * 1e9)} nm, w₀ = ${w0 * 1e3} mm, z = ${z} m`;
  chk(Y, lab + ': w(z)', g.w(z, w0, lam), v[0], 1e-13); chk(Y, lab + ': R(z)', g.R(z, w0, lam), v[1], 1e-13);
  chk(Y, lab + ': fase de Gouy', g.gouy(z, w0, lam), v[2], 1e-13); chk(Y, lab + ': z_R', g.zR(w0, lam), v[3], 1e-13);
  chk(Y, lab + ': divergencia', g.divergence(w0, lam), v[4], 1e-13);
}
for (const [k, v] of Object.entries(ref.sym_conj)) {
  const [s, zr, f] = fk(k), lam = 1e-6, w0 = Math.sqrt((lam * zr) / PI);
  const q = OP.gb.abcd(OP.M.chain([OP.M.free(s), OP.M.lens(f)]), OP.gb.q(0, w0, lam)), r = OP.gb.fromQ(q, lam);
  chk(Y, `haz enfocado por una lente f = ${f}: posición de la nueva cintura (gaussian_conj)`, r.toWaist, v, 1e-12);
  chk(L, `haz enfocado por una lente f = ${f}: z_R de salida (Self 1983)`, r.zR, ref.self83[k], 1e-12);
}
for (const [k, v] of Object.entries(ref.sym_stokes)) {
  const parts = k.split(','), psi = +parts[0], chi = +parts[1], el = parts[2];
  const J = OP.J;
  let E;
  if (el === 'pol') E = J.polarizer(+parts[3]);
  else if (el === 'qwp') E = J.qwp(+parts[3]);
  else if (el === 'hwp') E = J.hwp(+parts[3]);
  else E = J.retarder(+parts[3].replace('[', ''), +parts[4].replace(']', ''));
  const Sv = J.stokes(J.apply(E, J.vec(psi, chi)));
  ['S₀', 'S₁', 'S₂', 'S₃'].forEach((nm, i) => chk(Y, `Stokes tras ${{ pol: 'polarizador', qwp: 'lámina λ/4', hwp: 'lámina λ/2', ret: 'retardador' }[el]} (ψ = ${psi}, χ = ${chi}): ${nm}`, Sv[i], v[i], 1e-13, false));
}
for (const [k, v] of Object.entries(ref.sym_mueller)) {
  const parts = k.split(','), el = parts[0];
  const E = el === 'pol' ? OP.J.polarizer(+parts[1]) : el === 'qwp' ? OP.J.qwp(+parts[1]) : OP.J.retarder(+parts[1].replace('[', ''), +parts[2].replace(']', ''));
  const Mu = OP.mueller(E);
  /* sympy define S₃ con signos opuestos en jones_2_stokes y en mueller_matrix: M_curso = D M_sympy D, D = diag(1,1,1,−1) */
  let err = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) err = Math.max(err, Math.abs(Mu[i][j] - (i === 3) * 0 - v[i][j] * (i === 3 ? -1 : 1) * (j === 3 ? -1 : 1)));
  chk(Y, `matriz de Mueller de ${{ pol: 'un polarizador', qwp: 'una lámina λ/4', ret: 'un retardador' }[el]} (máximo error de los 16 elementos)`, err, 0, 1e-13, false);
}

/* ================= tmm ================= */
for (const [k, v] of Object.entries(ref.tmm)) {
  const [name, pol, th, lam] = k.split('|');
  const ns = ref.tmm_stacks[name].map((z) => (z[1] ? z : z[0])), ds = ref.tmm_d[name].map((d) => (d === null ? Infinity : d));
  const r = OP.tmm(pol, ns, ds, +th, +lam);
  chk(T, `${name}, pol. ${pol}, θ = ${th} rad, λ = ${lam} nm: R`, r.R, v[0], 1e-11, false);
  chk(T, `${name}, pol. ${pol}, θ = ${th} rad, λ = ${lam} nm: T`, r.T, v[1], 1e-11, false);
}

/* ================= miepython ================= */
for (const [k, v] of Object.entries(ref.mie)) {
  const [n, kap, x] = fk(k), r = OP.mie([n, kap], x);
  const lab = `Mie m = ${n}${kap ? ' + ' + kap + 'i' : ''}, x = ${x}`;
  chk(M, lab + ': Q_ext', r.Qext, v[0], 1e-9); chk(M, lab + ': Q_sca', r.Qsca, v[1], 1e-9);
  chk(M, lab + ': Q_back', r.Qback, v[2], 1e-8); chk(M, lab + ': g', r.g, v[3], 1e-9);
}
for (const [k, v] of Object.entries(ref.mieS)) {
  const [n, kap, x] = fk(k), ang = [0, 30, 90, 150, 180].map((a) => a * deg), r = OP.mie([n, kap], x, ang);
  r.S.forEach((sv, i) => { chk(M, `Mie m = ${n}${kap ? ' + ' + kap + 'i' : ''}, x = ${x}: |S₁|² a ${ang[i] / deg}°`, Cx.abs2(sv[0]), v[i][0], 1e-9); chk(M, `Mie m = ${n}${kap ? ' + ' + kap + 'i' : ''}, x = ${x}: |S₂|² a ${ang[i] / deg}°`, Cx.abs2(sv[1]), v[i][1], 1e-9); });
}

/* ================= colour-science ================= */
for (const [Tk, v] of Object.entries(ref.bbxy)) {
  const xy = OP.planckXY(+Tk);
  chk(K, `cromaticidad x del cuerpo negro a ${Tk} K`, xy[0], v[0], 1e-10); chk(K, `cromaticidad y del cuerpo negro a ${Tk} K`, xy[1], v[1], 1e-10);
  chk(K, `temperatura correlacionada de McCamy para el cuerpo negro de ${Tk} K`, OP.mcCamy(xy[0], xy[1]), v[2], 1e-9);
}
{
  const xy = OP.xy(OP.specXYZ(OP.d65));
  chk(K, 'cromaticidad x del iluminante D65 ', xy[0], ref.d65xy[0], 1e-8); chk(K, 'cromaticidad y del iluminante D65 ', xy[1], ref.d65xy[1], 1e-8);
}
for (const [k, v] of Object.entries(ref.srgb)) { const X = fk(k), lin = OP.xyz2lin(...X); ['R', 'G', 'B'].forEach((c, i) => chk(K, `sRGB lineal ${c} de XYZ = (${k})`, lin[i], v[i], 6e-4, false)); }
for (const [d, v] of Object.entries(ref.film)) {
  const XYZ = OP.reflXYZ((l) => OP.tmm('s', [1, 1.33, 1], [Infinity, +d, Infinity], 0, l).R);
  ['X', 'Y', 'Z'].forEach((c, i) => chk(K, `película de jabón de ${d} nm bajo D65: ${c}`, XYZ[i], v[i], 1e-9));
}

/* ================= Numérico ================= */
{
  /* Kramers–Kronig sobre un oscilador de Lorentz */
  const ws = [], ims = [];
  for (let i = 0; i <= 40000; i++) { const w = i * 0.001; ws.push(w); ims.push(OP.lorentzEps(w, 1, 0.5, 0.1)[1]); }
  for (const w of [0.5, 0.9, 1.1, 2.0]) chk(N, `Kramers–Kronig: Re χ(${w}ω₀) a partir de Im χ (oscilador de Lorentz, γ = 0.1ω₀)`, OP.kkReal(ws, ims, w), OP.lorentzEps(w, 1, 0.5, 0.1)[0] - 1, 3e-4, false);
  /* MTF por autocorrelación */
  const sh = [16, 40, 64, 96], mt = OP.mtfNumeric(256, 64, sh);
  sh.forEach((s, i) => chk(N, `MTF de pupila circular por autocorrelación numérica, ν/ν_c = ${(s / 128).toFixed(3)}`, mt[i], OP.mtfCirc(s / 128), 3e-3, false));
  /* PSF por FFT (desenfoque nulo) */
  const md = OP.mtfDefocus(256, 32, 0);
  [8, 16, 32, 48].forEach((kk) => chk(N, `MTF por FFT (PSF → OTF), ν/ν_c = ${(kk / 64).toFixed(3)}`, md[kk], OP.mtfCirc(kk / 64), 6e-3, false));
  /* Fresnel en el eje de una abertura circular */
  for (const z of [0.3, 0.45, 0.7, 2.0]) chk(N, `abertura circular de 1 mm de radio, λ = 500 nm: intensidad en el eje a z = ${z} m (integral numérica)`, Cx.abs2(OP.circField(0, 1e-3, 500e-9, z)), OP.circOnAxis(1e-3, 500e-9, z), 1e-6, false);
  /* Mancha de Arago–Poisson: en el eje detrás de un disco la intensidad es la incidente */
  chk(N, 'mancha de Poisson: intensidad en el eje detrás de un disco opaco (Babinet)', Cx.abs2(OP.diskField(0, 1e-3, 500e-9, 1.3)), 1, 1e-8);
  /* Rayos exactos: aberración esférica de tercer orden */
  const nb = (l) => OP.nSell(OP.SELL['N-BK7'], l / 1000), R1 = 51.68, sys = OP.singlet(R1, Infinity, 2, nb, 20);
  const fz = OP.paraxialFocus(sys, 587.56), nd = nb(587.56), f = OP.lensmaker(nd, R1, Infinity, 2);
  for (const hh of [1, 2]) {
    const r = OP.traceRay(sys, [0, hh, -10], [0, 0, 1], 587.56), zc = r.p[2] - (r.p[1] * r.d[2]) / r.d[1];
    chk(N, `aberración esférica longitudinal, h = ${hh} mm: trazado exacto frente a Seidel (3.er orden)`, fz - zc, f * f * OP.seidelSA(nd, f, 1, -1, hh), 0.02);
  }
  const rp = OP.traceRay(sys, [0, 1e-4, -10], [0, 0, 1], 587.56), zp = rp.p[2] - (rp.p[1] * rp.d[2]) / rp.d[1];
  chk(N, 'foco de un rayo exacto muy cerca del eje frente al foco paraxial ABCD', zp, fz, 1e-9);
  /* Doblete acromático N-BK7 / N-F2 */
  const nF2 = (l) => OP.nSell(OP.SELL['N-F2'], l / 1000), V1 = OP.abbe('N-BK7'), V2 = OP.abbe('N-F2'), ac = OP.achromat(100, V1, V2);
  const P = (l) => (nb(l) - 1) / ((nb(OP.LINES.d) - 1) * ac.f1) + (nF2(l) - 1) / ((nF2(OP.LINES.d) - 1) * ac.f2);
  chk(N, 'doblete acromático delgado de 100 mm: misma focal en las líneas C y F', 1 / P(OP.LINES.F), 1 / P(OP.LINES.C), 1e-12);
  chk(N, 'doblete acromático delgado: focal en la línea d', 1 / P(OP.LINES.d), 100, 1e-12);
  /* Índice gradual: invariante n cos θ */
  const nf = (x, y) => 1.00029 * (1 - 2e-4 * Math.exp(-y / 0.5)), gf = (x, y) => [0, (1.00029 * 2e-4 * Math.exp(-y / 0.5)) / 0.5];
  const gr = OP.gradRay(nf, gf, [0, 1.5], [Math.cos(-0.012), Math.sin(-0.012)], 0.05, 4000);
  chk(N, 'espejismo inferior: altura mínima del rayo frente a la predicha por n·cos θ = cte', Math.min(...gr.pts.map((p) => p[1])), -0.5 * Math.log((1 - (nf(0, 1.5) * Math.cos(0.012)) / 1.00029) / 2e-4), 1e-4);
  const pe = gr.pts[gr.pts.length - 1], inv0 = nf(0, 1.5) * Math.cos(-0.012), inv1 = gr.T[0];
  chk(N, 'espejismo: invariante n·cos θ a lo largo de un rayo en índice gradual (RK4)', inv1, inv0, 1e-12);
  chk(N, 'espejismo: |T| = n al final del trazado', Math.hypot(gr.T[0], gr.T[1]), nf(pe[0], pe[1]), 1e-9);
  /* Fermat: el camino de tiempo mínimo cumple la ley de Snell */
  const n1 = 1, n2 = 1.33, xa = 0, ya = 3, xb = 4, yb = -2;
  const tt = (x) => n1 * Math.hypot(x - xa, ya) + n2 * Math.hypot(xb - x, yb);
  const xm = OP.golden(tt, 0, 4, 1e-13);
  chk(N, 'principio de Fermat: n₁ sen θ₁ = n₂ sen θ₂ en el camino óptico mínimo', n1 * ((xm - xa) / Math.hypot(xm - xa, ya)), n2 * ((xb - xm) / Math.hypot(xb - xm, yb)), 1e-6);
  /* Espectro angular frente a Fresnel: borde recto */
  const Nn = 8192, dx = 0.5e-6, lam = 0.5e-6, z = 0.02, re = new Float64Array(Nn), im = new Float64Array(Nn);
  for (let i = 0; i < Nn; i++) re[i] = i >= Nn / 2 && i < Nn - 200 ? 1 : 0;
  const [Rr, Ii] = OP.angSpec1D(re, im, dx, lam, z);
  for (const off of [-150, -40, 0, 30, 90]) {
    const i = Nn / 2 + off, x = off * dx, v = x * Math.sqrt(2 / (lam * z));
    chk(N, `borde recto por espectro angular (FFT) frente a integrales de Fresnel, x = ${(x * 1e6).toFixed(0)} µm`, Rr[i] * Rr[i] + Ii[i] * Ii[i], OP.edgeI(v), 0.02, false);
  }
  /* Efecto Talbot: autoimagen a z_T = 2d²/λ (paraxial) */
  const Nt = 4096, d = 40e-6, dxt = d / 64, lt = 0.6e-6, ret = new Float64Array(Nt), imt = new Float64Array(Nt);
  for (let i = 0; i < Nt; i++) ret[i] = i % 64 < 16 ? 1 : 0;
  const zT = (2 * d * d) / lt, [Rt, It] = OP.angSpec1D(ret, imt, dxt, lt, zT), [Rh, Ih] = OP.angSpec1D(ret, imt, dxt, lt, zT / 2);
  let c0 = 0, ch = 0, nrm = 0;
  for (let i = 0; i < Nt; i++) { const I0 = ret[i]; c0 += I0 * (Rt[i] * Rt[i] + It[i] * It[i]); ch += I0 * (Rh[(i + 32) % Nt] * Rh[(i + 32) % Nt] + Ih[(i + 32) % Nt] * Ih[(i + 32) % Nt]); nrm += I0 * I0; }
  chk(N, 'efecto Talbot: correlación de la intensidad en z_T con la rejilla (Λ = 40 µm, λ = 600 nm)', c0 / nrm, 1, 0.08);
  chk(N, 'efecto Talbot: en z_T/2 la autoimagen aparece desplazada media rejilla', ch / nrm, 1, 0.08);
  /* Fabry–Pérot: matrices de transferencia frente a la función de Airy */
  for (const l of [600, 612.3, 640]) {
    const n = 1.5, dd = 2000, Rf = Math.pow((n - 1) / (n + 1), 2), del = (4 * PI * n * dd) / l;
    chk(N, `etalón de vidrio de 2 µm, λ = ${l} nm: T por matrices frente a la función de Airy`, OP.tmm('s', [1, n, 1], [Infinity, dd, Infinity], 0, l).T, OP.fpT(Rf, del), 1e-12);
  }
  /* Pila de Bragg: reflectancia máxima */
  for (const Np of [3, 6, 10]) {
    const ns = [1], ds = [Infinity];
    for (let i = 0; i < Np; i++) { ns.push(2.35, 1.46); ds.push(550 / 4 / 2.35, 550 / 4 / 1.46); }
    ns.push(2.35, 1.52); ds.push(550 / 4 / 2.35, Infinity);
    chk(N, `espejo de Bragg (HL)^${Np}H: R(λ₀) por matrices frente a la fórmula de admitancia`, OP.tmm('s', ns, ds, 0, 550).R, OP.braggPeak(1, 2.35, 1.46, 1.52, Np), 1e-12);
  }
  /* Antirreflejante de un cuarto de onda */
  chk(N, 'antirreflejante λ/4 de MgF₂ sobre N-BK7: R(λ₀) frente a ((n₀n_s − n₁²)/(n₀n_s + n₁²))²', OP.tmm('s', [1, 1.38, 1.5168], [Infinity, 550 / 4 / 1.38, Infinity], 0, 550).R, Math.pow((1.5168 - 1.38 * 1.38) / (1.5168 + 1.38 * 1.38), 2), 1e-12);
  /* Conservación de la energía en Fresnel */
  for (const th of [0.2, 0.7, 1.3]) { const f = OP.fresnel(1, 1.52, th); chk(N, `Fresnel aire→vidrio θ = ${th}: R_s + T_s = 1`, f.Rs + f.Ts, 1, 1e-14); chk(N, `Fresnel aire→vidrio θ = ${th}: R_p + T_p = 1`, f.Rp + f.Tp, 1, 1e-14); }
  chk(N, 'Fresnel: R_p = 0 en el ángulo de Brewster', OP.fresnel(1, 1.52, OP.brewster(1, 1.52)).Rp, 0, 1e-28, false);
  chk(N, 'reflexión total: |r_s| = 1 más allá del ángulo crítico', Cx.abs(OP.fresnel(1.52, 1, 0.9).rs), 1, 1e-14);
  /* Ecuaciones de tasa del láser */
  const run = OP.rateRun(2, 0.01, 1e-7, 60, 0.0005);
  chk(N, 'láser de cuatro niveles con bombeo r = 2: inversión estacionaria = umbral (RK4)', run.y[0], OP.rateSteady(2).n, 1e-5);
  chk(N, 'láser de cuatro niveles: número de fotones estacionario s = r − 1', run.y[1], OP.rateSteady(2).s, 1e-4);
  {
    const run2 = OP.rateRun(3, 0.01, 1e-7, 40, 0.0002), o = run2.out;
    /* período de las oscilaciones de relajación: picos de s */
    const pk = [];
    for (let i = 1; i < o.length - 1; i++) if (o[i][2] > o[i - 1][2] && o[i][2] > o[i + 1][2] && o[i][0] > 1) pk.push(o[i][0]);
    const Tn = (pk[4] - pk[1]) / 3, Ta = (2 * PI) / OP.relaxation(3, 0.01).w;
    chk(N, 'oscilaciones de relajación (r = 3, τ_c/τ₂ = 0.01): período numérico frente a 2π/√((r−1)/τ − r²/4)', Tn, Ta, 0.03);
  }
  /* Modo propio de una cavidad: matriz de ida y vuelta frente a la fórmula cerrada */
  for (const [R1, R2, Lc] of [[1, 1, 0.5], [2, Infinity, 0.8], [0.5, 1.5, 0.4]]) {
    const lam2 = 633e-9, cav = OP.cavity(R1, R2, Lc, lam2), Mm = OP.M;
    const rt = Mm.chain([Mm.free(Lc), Mm.mirror(R2), Mm.free(Lc), Mm.mirror(R1)]);
    const q = OP.cavityQ(rt), r = OP.gb.fromQ(q, lam2);
    chk(N, `cavidad R₁ = ${R1} m, R₂ = ${isFinite(R2) ? R2 + ' m' : '∞'}, L = ${Lc} m: radio del modo en el espejo 1`, r.w, cav.w1, 1e-10);
    chk(N, `cavidad R₁ = ${R1} m, R₂ = ${isFinite(R2) ? R2 + ' m' : '∞'}, L = ${Lc} m: cintura del modo`, r.w0, cav.w0, 1e-10);
  }
  /* Mie en el límite de Rayleigh */
  for (const m of [1.33, 1.5]) { const a = 5e-9, lam3 = 500e-9, x = (2 * PI * a) / lam3; chk(N, `Mie con x = ${x.toFixed(4)} (m = ${m}) frente a la sección eficaz de Rayleigh`, OP.mie([m, 0], x).Qsca * PI * a * a, OP.rayleighSigma(a, lam3, m), 2e-3); }
  /* Rejilla de N rendijas: suma de fasores */
  for (const [Nn2, al] of [[5, 0.4], [12, 1.1], [30, 0.05]]) {
    let sr = 0, si = 0;
    for (let j = 0; j < Nn2; j++) { sr += Math.cos(2 * al * j); si += Math.sin(2 * al * j); }
    chk(N, `${Nn2} rendijas: suma de fasores frente a [sen Nα/(N sen α)]², α = ${al}`, (sr * sr + si * si) / (Nn2 * Nn2), OP.gratingFactor(Nn2, al), 1e-12);
  }
  /* Estadística de fotones */
  const rg = OP.rng(7);
  let s1 = 0, s2 = 0, t1 = 0, t2 = 0;
  const NS = 200000, mu = 4;
  for (let i = 0; i < NS; i++) { const a = rg.poisson(mu), b = rg.geometric(mu); s1 += a; s2 += a * a; t1 += b; t2 += b * b; }
  const va = s2 / NS - Math.pow(s1 / NS, 2), vb = t2 / NS - Math.pow(t1 / NS, 2);
  chk(N, 'luz coherente simulada (Poisson, n̄ = 4): varianza = n̄', va, 4, 0.02);
  chk(N, 'luz térmica simulada (Bose–Einstein, n̄ = 4): varianza = n̄ + n̄²', vb, 20, 0.03);
  /* Polarización: ley de Malus con Jones */
  for (const a of [0.3, 1.0]) { const e = OP.J.apply(OP.J.polarizer(a), [[1, 0], [0, 0]]); chk(N, `ley de Malus desde Jones: polarizador a ${(a / deg).toFixed(1)}°`, Cx.abs2(e[0]) + Cx.abs2(e[1]), Math.cos(a) * Math.cos(a), 1e-14); }
  /* Corte del modo LP11 */
  chk(N, 'corte del modo LP₁₁: primer cero de J₀', OP.besselJzero(0, 1), 2.404825557695773, 1e-13);
  chk(N, 'guía plana: número de modos TE = ⌈V/(π/2)⌉', OP.slabTE(1.5, 1.45, 4e-6, 1.55e-6).modes.length, Math.ceil(OP.slabTE(1.5, 1.45, 4e-6, 1.55e-6).V / (PI / 2)), 0, false);
  /* Lente gruesa: fabricante frente a matriz */
  const Mt = OP.M.chain([OP.M.curved(30, 1, 1.6), OP.M.free(8), OP.M.curved(-20, 1.6, 1)]);
  chk(N, 'lente gruesa: focal de la matriz ABCD frente a la fórmula del fabricante', OP.cardinal(Mt).fp, OP.lensmaker(1.6, 30, -20, 8), 1e-13);
}

/* ================= Literatura y catálogo ================= */
for (const [k, v] of Object.entries(ref.metals)) {
  const [m, l] = k.split(','), nk = OP.metal(m, +l), nm = { Ag: 'plata', Au: 'oro', Cu: 'cobre', Al: 'aluminio' }[m];
  chk(L, `${nm} a ${l} nm (refractiveindex.info): n`, nk[0], v[0], 0.03);
  chk(L, `${nm} a ${l} nm: κ`, nk[1], v[1], 0.01);
  chk(L, `${nm} a ${l} nm: reflectancia a incidencia normal`, OP.fresnel(1, nk, 0).R, v[2], 3e-3);
}
const CAT = [['N-BK7', 1.51680, 64.17, 'Schott'], ['N-K5', 1.52249, 59.48, 'Schott'], ['N-F2', 1.62004, 36.37, 'Schott'], ['N-SF11', 1.78472, 25.68, 'Schott'], ['silica', 1.45846, 67.82, 'Malitson 1965'], ['CaF2', 1.43385, 94.99, 'Malitson 1963']];
for (const [g, nd, vd, src] of CAT) {
  chk(L, `${OP.SELL[g].name}: n_d (${src})`, OP.n(g, OP.LINES.d), nd, 1.2e-5);
  chk(L, `${OP.SELL[g].name}: número de Abbe ν_d (${src})`, OP.abbe(g), vd, g === 'N-F2' ? 2e-3 : 1e-3);
}
chk(L, 'zafiro, rayo ordinario: nₒ = 1.768 a 589 nm (Malitson y Dodge 1972)', OP.n('zafiro', 589.3), 1.768, 1e-4);
chk(L, 'diamante: n a 589.3 nm (Peter 1923)', OP.n('diamante', 589.3), 2.4175, 2e-4);
for (const [l, v] of Object.entries(ref.iapws_water)) chk(L, `agua a 20 °C, λ = ${(+l * 1000).toFixed(1)} nm: Daimon–Masumura frente a IAPWS R9-97`, OP.n('agua', +l * 1000), v, 1.2e-4);
chk(L, 'agua a 20 °C relativa al aire, 589.3 nm (Tilton y Taylor 1938: 1.33299)', OP.n('agua', 589.3) / OP.nAir(0.5893), 1.33299, 3e-5);
for (const [l, v] of Object.entries(ref.edlen)) chk(L, `aire normal, λ = ${(+l * 1000).toFixed(1)} nm: (n − 1) de Peck–Reeder frente a Edlén 1966`, OP.nAir(+l) - 1, v, 2e-4);
chk(L, 'calcita nₒ a 589.3 nm (1.6584)', OP.UNI.calcita.f(0.5893)[0], 1.6584, 1e-4);
chk(L, 'calcita nₑ a 589.3 nm (1.4864)', OP.UNI.calcita.f(0.5893)[1], 1.4864, 3e-4);
chk(L, 'cuarzo nₒ a 589.3 nm (1.5443)', OP.UNI.cuarzo.f(0.5893)[0], 1.5443, 1e-4);
chk(L, 'cuarzo nₑ a 589.3 nm (1.5534)', OP.UNI.cuarzo.f(0.5893)[1], 1.5534, 1e-4);
chk(L, 'hielo: n a 589.3 nm (Warren y Brandt 2008: 1.3098)', OP.n('hielo', 589.3), 1.3098, 1e-4);
chk(L, 'BBO tipo I, 1064 → 532 nm: ángulo de ajuste de fase (22.8°)', OP.pmTypeI('BBO', 1064) / deg, 22.8, 3e-3);
chk(L, 'arcoíris primario para n = 1.333: 42.0° desde el punto antisolar', OP.rainbowAngle(1.333, 1) / deg, 42.0, 3e-3);
chk(L, 'arcoíris secundario para n = 1.333: 51° (50.9°)', OP.rainbowAngle(1.333, 2) / deg, 50.9, 3e-3);
chk(L, 'halo de 22°: desviación mínima del prisma de hielo de 60°', OP.prismMin(1.31, 60 * deg) / deg, 21.84, 1e-3);
chk(L, 'sílice: dispersión nula en 1.2727 µm (Malitson)', OP.bisect((l) => OP.matDispersion(OP.SELL.silica, l), 1.1, 1.5), 1.2727, 2e-4);
chk(L, 'sílice: D(1550 nm) ≈ 21.9 ps/(nm·km)', OP.matDispersion(OP.SELL.silica, 1.55), 21.9, 5e-3);
chk(L, 'criterio de Rayleigh: 1.21967 λ/D', OP.RAYLEIGH, 1.2196698912665045, 1e-14);
chk(L, 'energía encerrada dentro del primer anillo oscuro de Airy: 83.8 %', OP.airyEncircled(3.831705970207512), 0.8378, 1e-3);
chk(L, 'constante de Wien b = 2.897771955×10⁻³ m·K (CODATA 2018)', OP.wienB, 2.897771955e-3, 1e-9);
chk(L, 'constante de Stefan–Boltzmann 5.670374419×10⁻⁸ (CODATA 2018)', OP.sigmaSB, 5.670374419e-8, 1e-9);
chk(L, 'iluminante A de la CIE (2856 K): x = 0.44757', OP.planckXY(2856)[0], 0.44757, 1e-4);
chk(L, 'iluminante A de la CIE (2856 K): y = 0.40745', OP.planckXY(2856)[1], 0.40745, 1e-4);
chk(L, 'temperatura correlacionada del iluminante D65: 6504 K', OP.mcCamy(...OP.xy(OP.specXYZ(OP.d65))), 6504, 1e-3);
chk(L, 'eficacia luminosa de 555 nm: 683 lm/W (definición de la candela)', OP.KM * OP.V(555), 683, 1e-6);
chk(L, 'eficacia luminosa máxima de un cuerpo negro ≈ 95 lm/W (hacia 6600 K)', OP.efficacyBB(6600), 95, 0.01);
chk(L, 'eficacia luminosa del cuerpo negro de 5800 K ≈ 93 lm/W', OP.efficacyBB(5800), 93, 0.01);
chk(L, 'poder rotatorio del cuarzo: 21.72 °/mm a 589.3 nm', OP.quartzRotation(589.3), 21.72, 1e-3);
chk(L, 'poder rotatorio del cuarzo: 17.32 °/mm a 656.3 nm', OP.quartzRotation(656.3), 17.32, 0.01);
chk(L, 'poder rotatorio del cuarzo: 32.76 °/mm a 486.1 nm', OP.quartzRotation(486.1), 32.76, 0.01);
chk(L, 'Fizeau (1849): 720 dientes, 8633 m, 12.6 vueltas/s → c ≈ 313 000 km/s', 4 * 720 * 8633 * 12.6, 3.13e8, 1e-3);
chk(L, 'Rømer: retraso máximo de los eclipses de Ío = 2 UA/c ≈ 998 s', (2 * OP.AU) / OP.c, 998, 1e-3);
chk(L, 'fibra monomodo SMF-28 (a = 4.1 µm, NA = 0.12, 1550 nm): diámetro de campo modal de Marcuse ≈ 10.4 µm', 2 * 4.1 * OP.marcuse((2 * PI * 4.1 / 1.55) * 0.12), 10.4, 0.03);

const R = { fecha: new Date().toISOString().slice(0, 10), ok, bad, ms: Date.now() - t0, rows };
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify(R, null, 0));
const by = {};
for (const r of rows) { by[r.group] = by[r.group] || [0, 0]; by[r.group][r.pass ? 0 : 1]++; }
console.log(Object.entries(by).map(([g, [a, b]]) => `${g}: ${a}/${a + b}`).join(' · '));
console.log(`${ok} de ${ok + bad} pruebas superadas (${R.ms} ms)`);
process.exit(bad ? 1 : 0);
