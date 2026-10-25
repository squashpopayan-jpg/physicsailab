/* Validación de la biblioteca científica del curso (src/core/29-lin.js, 30-ss.js, 31-ss2.js).
   1) contra referencias independientes: SciPy/NumPy/mpmath, ASE y spglib, pymatgen;
   2) soluciones numéricas del curso contra soluciones exactas;
   3) contra datos experimentales y valores de la literatura.
   Ejecutar: node tests/validar.js   (python tests/referencias.py antes, si cambió) */
const path = require('path');
const fs = require('fs');
const L = require(path.join(__dirname, '../src/core/29-lin.js'));
const DATA = require(path.join(__dirname, '../src/core/29-data.js'));
require(path.join(__dirname, '../src/core/29-xrd.js'));
const SS = require(path.join(__dirname, '../src/core/30-ss.js'));
require(path.join(__dirname, '../src/core/31-ss2.js'));
const ref = require('./referencias.json');
const STR = require('./estructuras.json');
const PI = Math.PI;
let ok = 0, bad = 0;
const rows = [];
function chk(group, name, got, exp, tol, rel = true) {
  const err = rel ? Math.abs(got - exp) / Math.max(1e-300, Math.abs(exp)) : Math.abs(got - exp);
  const pass = isFinite(got) && err <= tol;
  pass ? ok++ : bad++;
  rows.push({ group, name, got, exp, tol: (rel ? 'rel ' : 'abs ') + tol, pass });
  if (!pass) console.log('FALLA', group, '·', name, 'obtenido', got, 'esperado', exp, 'err', err);
}
const S = 'SciPy', A = 'ASE', P = 'pymatgen', N = 'Numérico', Lit = 'Literatura';
const fk = (k) => k.split(',').map(Number);
const t0 = Date.now();
const sub = (s) => String(s).replace(/-/g, '−');

/* ================= SciPy / NumPy / mpmath ================= */
for (const [k, v] of Object.entries(ref.fd)) { const [j, eta] = fk(k); chk(S, `integral de Fermi–Dirac F${j === -0.5 ? '₋½' : j === 0.5 ? '½' : '₃⸝₂'}(${sub(eta)}) (polilogaritmo de mpmath)`, SS.fdInt(j, eta), v, 1e-11); }
for (const k of ['0,0', '1,1', '5,3']) { const [j2, F] = fk(k); void j2; const eta = 0.5 * F - 1; chk(S, `inversa de F½: η = ${sub(eta)}`, SS.fdInvHalf(SS.fdInt(0.5, eta)), eta, 1e-11, false); }
for (const [x, v] of Object.entries(ref.gamma)) chk(S, `función gamma Γ(${x})`, L.gamma(+x), v, 1e-13);
for (const [x, v] of Object.entries(ref.zeta)) chk(S, `zeta de Riemann ζ(${x})`, L.zeta(+x), v, 1e-12);
for (const [x, v] of Object.entries(ref.ellipk)) chk(S, `integral elíptica K(m = ${x})`, L.ellipK(+x), v, 1e-13);
for (const [x, v] of Object.entries(ref.ellipe)) chk(S, `integral elíptica E(m = ${x})`, L.ellipE(+x), v, 1e-13);
for (const [x, v] of Object.entries(ref.erfc)) chk(S, `función error complementaria erfc(${x})`, L.erfc(+x), v, 1e-12);
for (const [x, v] of Object.entries(ref.k0)) chk(S, `Bessel modificada K₀(${x}) (aproximación polinómica de Abramowitz–Stegun)`, SS.besselK0(+x), v, 2e-6);
{
  const e = L.symEig(ref.eig.A, 12).val;
  ref.eig.val.forEach((v, i) => chk(S, `autovalor ${i + 1} de una matriz simétrica 12×12 (numpy.linalg.eigvalsh)`, e[i], v, 1e-12, false));
  const h = L.hermEig(ref.eig.Hre, ref.eig.Him, 8).val;
  ref.eig.hval.forEach((v, i) => chk(S, `autovalor ${i + 1} de una matriz hermítica 8×8`, h[i], v, 1e-12, false));
}
/* Fonones */
const nbFcc = SS.cubicNeighbors('fcc', 1, 1);
for (const [k, v] of Object.entries(ref.fcc_ph)) {
  const kv = fk(k).map((x) => 2 * PI * x);
  const w = SS.dynCentral(nbFcc, 1, kv);
  v.forEach((x, i) => chk(S, `fcc con fuerzas centrales a primeros vecinos, k = (${k})·2π/a: ω${i + 1} (numpy)`, w[i], x, 1e-12, false));
}
for (const [k, v] of Object.entries(ref.chain2)) {
  const [kk, K1, K2, m1, m2] = fk(k), w = SS.chain2(kk, K1, K2, m1, m2);
  chk(S, `cadena diatómica (${k}): rama acústica`, w[0], v[0], 1e-7, false);
  chk(S, `cadena diatómica (${k}): rama óptica`, w[1], v[1], 1e-12, false);
}
for (const [x, v] of Object.entries(ref.debye)) chk(S, `integral de Debye ∫₀^x t⁴eᵗ/(eᵗ−1)² dt, x = ${x} (quad)`, SS.debyeInt(+x), v, 1e-12);
for (const [k, v] of Object.entries(ref.debyeC)) { const [T, th] = fk(k); chk(S, `calor específico de Debye C(${T} K) con θ_D = ${th} K`, SS.debyeC(T, th), v, 1e-11); }
for (const [k, v] of Object.entries(ref.debyeTh)) { const [T, Cv] = fk(k); chk(S, `θ_D que reproduce C = ${Cv} J/(mol·K) a ${T} K (brentq)`, SS.debyeThetaFrom(T, Cv), v, 1e-10); }
for (const [kT, v] of Object.entries(ref.morse)) chk(S, `potencial de Morse (D = a = 1): ⟨x⟩ térmico clásico con kT = ${kT}`, SS.meanX((x) => SS.morse(x, 1, 1), +kT, -3, 12), v, 1e-10);
for (const [k, v] of Object.entries(ref.mu)) { const [n, T] = fk(k); chk(S, `potencial químico del gas de electrones, n = ${n.toExponential(2)} m⁻³, T = ${T} K (quad + brentq)`, SS.muFree(n, T) / SS.e, v, 2e-10, false); }
/* Kronig–Penney */
for (const [k, v] of Object.entries(ref.kp)) {
  const [V0, a, b] = fk(k), bands = SS.kpEdges(V0, a, b, 2.0, 1, 6000);
  v.forEach((x, i) => chk(S, `Kronig–Penney V₀ = ${V0} eV, a = ${a} nm, b = ${b} nm: borde de banda ${i + 1} (brentq)`, bands[i], x, 1e-11));
}
for (const [k, v] of Object.entries(ref.central)) {
  const [kk, U1, U2] = fk(k), e = SS.central1d(kk, [U1, U2]);
  v.forEach((x, i) => chk(S, `ecuación central 1D, k = ${kk.toFixed(3)}, U₁ = ${U1}, U₂ = ${U2}: banda ${i + 1}`, e[i], x, 1e-12, false));
}
for (const [E, v] of Object.entries(ref.dossq)) chk(S, `densidad de estados de la red cuadrada en E = ${E}t (scipy.special.ellipk)`, SS.dosSquare(+E), v, 1e-12);
for (const [k, v] of Object.entries(ref.graphene)) { const [kx, ky] = fk(k); chk(S, `grafeno: banda π* en k = (${kx.toFixed(3)}, ${ky.toFixed(3)})/a_CC (numpy, 2×2)`, SS.grapheneF(kx, ky), v[1], 1e-12, false); }
for (const [k, v] of Object.entries(ref.ssh)) {
  const [Nc, vv, w] = fk(k), e = SS.sshOpen(Nc, vv, w).map(Math.abs).sort((a, b) => a - b);
  chk(S, `cadena SSH abierta (${Nc} celdas, v = ${vv}, w = ${w}): |E| mínimo`, e[0], v[0], 1e-6, false);
}
for (const [k, v] of Object.entries(ref.harper)) {
  const [p, q, kx, ky] = fk(k), e = SS.harper(p, q, kx, ky);
  v.forEach((x, i) => chk(S, `ecuación de Harper α = ${p}/${q}, k = (${kx}, ${ky}): nivel ${i + 1}`, e[i], x, 1e-12, false));
}
for (const [k, v] of Object.entries(ref.epm)) {
  const [m, ...kk] = k.split(','), e = SS.epm(m, kk.map(Number), 14).E;
  [0, 3, 4, 5].forEach((i) => chk(S, `pseudopotencial empírico de ${m} en k = (${kk.join(', ')})·2π/a: banda ${i + 1} (numpy)`, e[i], v[i], 1e-10, false));
}
for (const [k, v] of Object.entries(ref.neutral)) {
  const [T, Nd, Na] = fk(k), r = SS.neutral('Si', T, { Nd, Na, Ed: 45, Ea: 45 });
  chk(S, `Si a ${T} K, N_d = ${Nd.toExponential(0)}, N_a = ${Na.toExponential(0)} cm⁻³: nivel de Fermi (Fermi–Dirac, ionización incompleta)`, r.EF, v[0], 1e-10, false);
  chk(S, `Si a ${T} K, N_d = ${Nd.toExponential(0)}, N_a = ${Na.toExponential(0)} cm⁻³: concentración de electrones`, r.n, v[1], 1e-8);
}
for (const [k, v] of Object.entries(ref.pn)) {
  const [Na, Nd] = fk(k), r = SS.pnPoisson(Na, Nd, 1e10, 300, 11.7, 0, { N: 3201 });
  const i0 = r.x.findIndex((x) => x >= 0);
  chk(S, `unión p–n N_a = ${Na.toExponential(0)}, N_d = ${Nd.toExponential(0)}: campo en la unión (Poisson–Boltzmann exacto por la primera integral)`, Math.abs(r.E[i0]), v[0], 3e-4);
  chk(S, `unión p–n N_a = ${Na.toExponential(0)}, N_d = ${Nd.toExponential(0)}: potencial en la unión`, r.psi[i0], v[1], 2e-6, false);
  chk(S, `unión p–n N_a = ${Na.toExponential(0)}, N_d = ${Nd.toExponential(0)}: potencial de contacto`, r.Vbi, v[2], 1e-12);
}
for (const [Eg, v] of Object.entries(ref.sq)) {
  const r = SS.sq(+Eg);
  chk(S, `límite de Shockley–Queisser con E_g = ${Eg} eV: eficiencia (quad + minimize_scalar)`, r.eta, v[0], 1e-9);
  chk(S, `límite de Shockley–Queisser con E_g = ${Eg} eV: tensión de circuito abierto`, r.Voc, v[1], 1e-10);
}
for (const [k, v] of Object.entries(ref.well)) {
  const [V0, Lw, mr] = fk(k), e = SS.wellFinite(V0, Lw, mr).map((x) => x.E);
  chk(S, `pozo finito V₀ = ${V0} eV, L = ${Lw} nm, m* = ${mr}: número de estados ligados`, e.length, v.length, 0, false);
  v.forEach((x, i) => chk(S, `pozo finito V₀ = ${V0} eV, L = ${Lw} nm, m* = ${mr}: nivel ${i + 1} (brentq)`, e[i], x, 1e-11));
}
for (const [k, v] of Object.entries(ref.brillouin)) { const [J, x] = fk(k); chk(S, `función de Brillouin B_${J}(${x}) (suma directa sobre m_J)`, SS.brillouin(J, x), v, 1e-12); }
for (const [k, v] of Object.entries(ref.weiss)) { const [J, t] = fk(k); chk(S, `campo medio de Weiss, J = ${J}, T/T_c = ${t}: magnetización reducida (brentq)`, SS.weiss(J, t), v, 1e-12); }
for (const [t, v] of Object.entries(ref.bcs)) chk(S, `brecha BCS Δ(T)/Δ(0) en T/T_c = ${t} (quad + brentq)`, SS.bcsGap(+t), v, 1e-9);
for (const [k, v] of Object.entries(ref.bcs_cut)) {
  const [wD, lam] = fk(k);
  chk(S, `BCS con corte ħω_D = ${wD}, N₀V = ${lam}: k_BT_c`, SS.bcsTc(wD, lam), v[0], 1e-10);
  chk(S, `BCS con corte ħω_D = ${wD}, N₀V = ${lam}: Δ(0)`, SS.bcsD0cut(wD, lam), v[1], 1e-12);
}

/* ================= ASE, spglib y scipy.spatial ================= */
const EXPECT_SG = { sc: 221, bcc: 229, fcc: 225, hcp: 194, diamond: 227, zincblende: 216, NaCl: 225, CsCl: 221, fluorite: 225, perovskite: 221, wurtzite: 186, graphite: 194, Al: 225, W: 229, KCl: 225 };
for (const [k, v] of Object.entries(ref.spg)) chk(A, `spglib identifica la estructura «${k}» generada por el curso: grupo espacial ${v[1]}`, v[0], EXPECT_SG[k], 0, false);
for (const [k, v] of Object.entries(ref.shells)) {
  const st = SS.structure(k, 1, k === 'hcp' ? Math.sqrt(8 / 3) : undefined), sh = SS.neighbors(st, 0, 3);
  v.forEach(([d, n], i) => {
    chk(A, `${SS.STRUCT_NAMES[k]}: distancia a la capa ${i + 1} de vecinos (ASE)`, sh[i].d, d, 1e-12);
    chk(A, `${SS.STRUCT_NAMES[k]}: número de vecinos de la capa ${i + 1}`, sh[i].n, n, 0, false);
  });
}
for (const [k, v] of Object.entries(ref.packing)) chk(A, `${SS.STRUCT_NAMES[k]}: fracción de empaquetamiento`, SS.packing(SS.structure(k, 1, k === 'hcp' ? Math.sqrt(8 / 3) : undefined)), v, 1e-12);
for (const [k, v] of Object.entries(ref.recip)) {
  const prim = SS.primitive(k, 1, Math.sqrt(8 / 3)), B = SS.recip(prim), vol = Math.abs(L.det3(B)) / Math.pow(2 * PI, 3);
  chk(A, `red ${k}: volumen de la celda recíproca en (2π/a)³`, vol, v.vol, 1e-12);
  const sp = SS.special(k);
  for (const [lab, val] of Object.entries(v.pts)) {
    const key = lab === 'G' ? 'Γ' : lab;
    if (!sp[key]) continue;
    chk(A, `red ${k}: |k| del punto especial ${key} en unidades de 2π/a (bandpath de ASE)`, Math.hypot(...sp[key]), val, 1e-12, val === 0);
  }
}
for (const [k, v] of Object.entries(ref.bz)) {
  const B = SS.recip(SS.primitive(k, 1, Math.sqrt(8 / 3))), bz = SS.bz3d(B);
  chk(A, `zona de Brillouin ${k}: número de vértices (Voronoi de scipy.spatial)`, bz.verts.length, v.nv, 0, false);
  chk(A, `zona de Brillouin ${k}: número de caras`, bz.faces.length, v.nf, 0, false);
  chk(A, `zona de Brillouin ${k}: volumen = (2π)³/V_celda`, Math.abs(L.det3(B)), v.vol, 1e-12);
}
for (const [k, v] of Object.entries(ref.dhkl)) {
  const [t, h, kk, l] = k.split(','), cell = t === 'cub' ? SS.structure('sc', 4).cell : SS.structure('hcp', 3.209, 5.211).cell;
  chk(A, `distancia interplanar d(${h}${kk}${l}) de una red ${t === 'cub' ? 'cúbica (a = 4 Å)' : 'hexagonal del Mg'} (pymatgen)`, SS.dhkl(cell, +h, +kk, +l), v, 1e-12);
}
for (const [k, v] of Object.entries(ref.lj)) {
  const r = SS.ljSums(k, 30);
  chk(A, `suma de red de Lennard-Jones A₆ de la red ${k} (suma directa independiente)`, r.A6, v[0], 1e-8);
  chk(A, `suma de red de Lennard-Jones A₁₂ de la red ${k}`, r.A12, v[1], 1e-11);
}
{
  const lj = SS.ljCrystal('fcc', 12 / 1.09);
  chk(A, 'cristal fcc de Lennard-Jones: R₀/σ (calculadora de ASE con corte 12σ)', lj.r0, ref.ase_lj.r0, 1e-3);
  chk(A, 'cristal fcc de Lennard-Jones: energía por átomo en ε (ASE, corte 12σ)', lj.U, ref.ase_lj.U, 2e-3);
  chk(A, 'cristal fcc de Lennard-Jones: módulo de compresibilidad en ε/σ³ (ASE)', lj.B, ref.ase_lj.B, 3e-3);
}

/* ================= pymatgen ================= */
const ELS = { sc: ['Po'], bcc: ['Fe'], fcc: ['Cu'], hcp: ['Mg'], diamond: ['Si'], zincblende: ['Ga', 'As'], NaCl: ['Na', 'Cl'], CsCl: ['Cs', 'Cl'], fluorite: ['Ca', 'F'], perovskite: ['Sr', 'Ti', 'O'], wurtzite: ['Zn', 'O'], Al: ['Al'], W: ['W'], KCl: ['K', 'Cl'] };
for (const [k, v] of Object.entries(ref.xrd)) {
  const s = STR[k], st = { cell: s.cell, atoms: s.frac.map((f, i) => ({ f, s: ELS[k].indexOf(s.species[i]) })) };
  const pat = SS.powder(st, ELS[k], SS.lambdaCuKa, 90);
  v.slice(0, 6).forEach(([tt, I], i) => {
    const p = pat[i] || { tt: NaN, I: NaN };
    chk(P, `difracción de polvo de ${k} (${ELS[k].join('')}) con Cu Kα: 2θ del pico ${i + 1}`, p.tt, tt, 1e-9);
    chk(P, `difracción de polvo de ${k}: intensidad relativa del pico ${i + 1}`, p.I, I, 1e-7, false);
  });
}
for (const [k, v] of Object.entries(ref.madelung)) {
  const m = SS.madelung(k);
  chk(P, `constante de Madelung de ${SS.STRUCT_NAMES[k]} por fórmula (EwaldSummation)`, m.perFormula, v, 1e-8);
}

/* ================= Numérico ================= */
{
  const bands = SS.kpBands(0.3, 1, 0.3, 1.5);
  for (const [k, v] of Object.entries(ref.kp_pw)) {
    const kk = fk(k)[3] * PI / 1.3, e = SS.kpE(kk, 0.3, 1, 0.3, SS.kpBands(0.3, 1, 0.3, 2.1));
    chk(N, `Kronig–Penney por la ecuación trascendente contra 301 ondas planas (numpy), k = ${fk(k)[3]}π/(a+b): banda 1`, e[0], v[0], 2e-7);
    chk(N, `Kronig–Penney contra ondas planas, k = ${fk(k)[3]}π/(a+b): banda 2`, e[1], v[1], 2e-7);
  }
  /* diferencias finitas con extrapolación de Richardson */
  for (const kk of [0, 0.8, PI / 1.3]) {
    const e1 = SS.kpFD(kk, 0.3, 1, 0.3, 1, 260, 2), e2 = SS.kpFD(kk, 0.3, 1, 0.3, 1, 520, 2), ex = SS.kpE(kk, 0.3, 1, 0.3, bands);
    [0, 1].forEach((i) => chk(N, `Kronig–Penney: diferencias finitas (260 y 520 puntos, Richardson) contra la solución exacta, k = ${kk.toFixed(3)} nm⁻¹, banda ${i + 1}`, (4 * e2[i] - e1[i]) / 3, ex[i], 3e-6));
  }
  /* límite de enlace fuerte: barreras altas → banda coseno */
  const bb = SS.kpBands(5, 1, 0.6, 0.6);
  const w = bb[0][1] - bb[0][0], e0 = SS.kpE(PI / 3.2, 5, 1, 0.6, [bb[0]])[0];
  chk(N, 'Kronig–Penney con barreras altas: banda de enlace fuerte E(k) = Ē − (W/2) cos(ka) en ka = π/2', e0, (bb[0][0] + bb[0][1]) / 2 - (w / 2) * Math.cos(PI / 2), 2e-3);
  /* DOS cuadrada por histograma contra exacta */
  const nb = 80, hist = new Float64Array(nb), nk = 600;
  for (let i = 0; i < nk; i++) for (let j = 0; j < nk; j++) { const E = SS.tbSquare(-PI + (2 * PI * (i + 0.5)) / nk, -PI + (2 * PI * (j + 0.5)) / nk); hist[Math.min(nb - 1, Math.floor(((E + 4) / 8) * nb))]++; }
  for (const b of [10, 25, 60]) { const E = -4 + ((b + 0.5) * 8) / nb; chk(N, `red cuadrada: DOS por histograma (600² puntos k) contra la fórmula elíptica en E = ${E.toFixed(2)}t`, hist[b] / (nk * nk * (8 / nb)), SS.dosSquare(E), 1e-2); }
  /* Debye: ley T³ y Dulong–Petit */
  chk(N, 'Debye: C(T)/[ley T³] a T = θ_D/100', SS.debyeC(3.43, 343) / SS.debyeT3(3.43, 343), 1, 1e-12);
  chk(N, 'Debye: C(10 θ_D) se acerca a Dulong–Petit 3R', SS.debyeC(3430, 343) / (3 * SS.R), 1 - 1 / (20 * 100) * 1, 2e-6);
  chk(N, 'Einstein: C(10 θ_E)/3R = 1 − (1/12)(θ/T)² + …', SS.einsteinC(3430, 343) / (3 * SS.R), 1 - 1 / 1200, 1e-6);
  chk(N, 'energía de Debye: derivada numérica de U(T) igual a C(T) a 100 K', (SS.debyeU(100.01, 343) - SS.debyeU(99.99, 343)) / 0.02, SS.debyeC(100, 343), 1e-7);
  /* Morse: dilatación lineal en kT */
  chk(N, 'Morse: ⟨x⟩ a baja temperatura contra el resultado anarmónico 3kT/(4Da)', SS.meanX((x) => SS.morse(x, 1, 1), 1e-3, -3, 12), (3 * 1e-3) / 4, 2e-3);
  /* Sommerfeld */
  const fg = SS.fermiGas(8.47e28);
  chk(N, 'gas de Fermi del Cu: μ(1000 K) contra la expansión de Sommerfeld E_F[1 − (π²/12)(T/T_F)²]', SS.muFree(8.47e28, 1000) / SS.e, fg.EFeV * (1 - (PI * PI / 12) * Math.pow(1000 / fg.TF, 2)), 1e-7);
  chk(N, 'gas de Fermi del Cu: calor específico a 300 K contra γT de Sommerfeld', SS.cFree(8.47e28, 300), ((PI * PI) / 2) * 8.47e28 * SS.kB * (300 / fg.TF), 1e-4);
  chk(N, 'gas de electrones a T alta: C → (3/2) n k_B (límite clásico)', SS.cFree(1e24, 3000) / (1.5 * 1e24 * SS.kB), 1, 1e-3);
  /* Bloch: oscilaciones */
  {
    const n = 400, V = new Float64Array(n), F = 0.05;
    for (let i = 0; i < n; i++) V[i] = F * (i - n / 2);
    const pk = SS.packet(n, n / 2, 0, 20);
    const xs = [], dt = 0.05, TB = (2 * PI) / F;
    for (let s = 0; s <= Math.round((1.5 * TB) / dt); s++) { xs.push(SS.meanPos(pk.re, pk.im)); SS.cnStep(pk.re, pk.im, V, dt); }
    let best = 0, tmax = 0;
    for (let s = Math.round((0.5 * TB) / dt); s < xs.length; s++) { const d = -Math.abs(xs[s] - xs[0]); if (s === Math.round((0.5 * TB) / dt) || d > best) { best = d; tmax = s * dt; } }
    chk(N, 'oscilación de Bloch en la cadena de enlace fuerte (Crank–Nicolson): período del regreso = 2πħ/(Fa)', tmax, TB, 3e-3);
    const amp = Math.max(...xs) - Math.min(...xs);
    chk(N, 'oscilación de Bloch: amplitud espacial = ancho de banda/(Fa) = 4t/F', amp, 4 / F, 0.03);
  }
  /* Weiss y Curie–Weiss; Ising */
  chk(N, 'campo medio con J = ½: m = tanh(m/t) en t = 0.5', SS.weiss(0.5, 0.5), Math.tanh(SS.weiss(0.5, 0.5) / 0.5), 1e-14);
  const tc = 0.999, m = SS.weiss(0.5, tc);
  chk(N, 'campo medio cerca de T_c: m ≈ √3 (1 − t)^½', m, Math.sqrt(3 * (1 - tc)), 2e-3);
  {
    const Lz = 48, s = new Int8Array(Lz * Lz).fill(1), rng = L.rng(5);
    for (let i = 0; i < 400; i++) SS.isingSweep(s, Lz, 1 / 1.8, 0, rng);
    let M = 0;
    for (let i = 0; i < 2000; i++) { SS.isingSweep(s, Lz, 1 / 1.8, 0, rng); let t = 0; for (const x of s) t += x; M += Math.abs(t) / s.length; }
    chk(N, 'Ising 2D por Monte Carlo (48×48, T = 1.8 J/k_B): magnetización contra Onsager', M / 2000, SS.onsagerM(1.8), 5e-3);
  }
  /* Stoner–Wohlfarth */
  for (const deg of [10, 30, 45, 70]) { const psi = (deg * PI) / 180; chk(N, `Stoner–Wohlfarth: campo de inversión numérico contra la astroide a ψ = ${deg}°`, SS.swSwitchNum(psi), SS.swSwitch(psi), 2e-4); }
  /* Kramers–Kronig */
  for (const w of [0.5, 1.2, 2.5]) chk(N, `Kramers–Kronig numérico contra ε₁ exacto del oscilador de Lorentz en ω = ${w} ω_T`, SS.kkRe(w, (x) => SS.lorentzEps(x, 1, 5, 2, 0.1).im, 400, 400000, 2), SS.lorentzEps(w, 1, 5, 2, 0.1).re, 2e-3, false);
  chk(N, 'oscilador de Lorentz: ε₁ se anula en ω_L = ω_T √(ε(0)/ε(∞)) (sin amortiguamiento)', SS.lorentzEps(SS.lstWL(1, 5, 2), 1, 5, 2, 0).re, 0, 1e-12, false);
  /* Polaritón: límites */
  chk(N, 'polaritón: rama superior en k = 0 igual a ω_L', SS.polariton(1e-9, 1, 5, 2)[1], SS.lstWL(1, 5, 2), 1e-9);
  /* RSJ */
  chk(N, 'unión de Josephson sobreamortiguada (RSJ integrado con RK4): ⟨V⟩/(I_cR) a I = 1.5 I_c contra √(i² − 1)', SS.rsjAC(1.5, 0, 1, 4000, 0.01), SS.rsjV(1.5), 2e-3);
  {
    /* escalón de Shapiro n = 1: con ω = 1 (unidades 2eRI_c/ħ) la tensión queda fija en ħω/2e → ⟨φ'⟩ = 1 */
    const v = SS.rsjAC(1.2, 0.8, 1.0, 3000, 0.01);
    chk(N, 'RSJ con corriente de microondas: escalón de Shapiro ⟨V⟩ = ħω/(2e)', v, 1.0, 1e-3);
  }
  /* BCS */
  chk(N, 'BCS con corte (N₀V = 0.2): Δ(0)/k_BT_c tiende a π e^{−γ}', SS.bcsD0cut(100, 0.2) / SS.bcsTc(100, 0.2), SS.BCS_D0, 1e-3);
  chk(N, 'BCS cerca de T_c: Δ/Δ(0) ≈ 1.7367 (1 − t)^½ / 1.764 · 1.764', SS.bcsGap(0.999), 3.0633 * Math.sqrt(0.001) / SS.BCS_D0, 2e-3);
  /* Anderson */
  {
    const rng = L.rng(21);
    chk(N, 'localización de Anderson 1D (W = 1t, E = t): longitud de localización por matriz de transferencia contra Thouless 24(4 − E²)/W²', 1 / SS.andersonLyap(1, 1, 4e6, rng), SS.thoulessXi(1, 1), 0.03);
  }
  /* Poisson contra agotamiento */
  {
    const r = SS.pnPoisson(1e16, 1e16, 1e10, 300, 11.7, 0, { N: 3201 }), d = SS.pnDepletion(1e16, 1e16, 1e10, 300, 11.7, 2 * SS.Vt(300));
    const i0 = r.x.findIndex((x) => x >= 0);
    chk(N, 'unión simétrica 10¹⁶/10¹⁶: campo máximo de Poisson contra agotamiento corregido (V_bi − 2kT/q)', Math.abs(r.E[i0]), d.Emax, 3e-3);
  }
  /* Fibonacci: espectro acotado, número de estados */
  const fib = SS.fibonacci(10);
  chk(N, 'cadena de Fibonacci de 10 generaciones: número de enlaces = F₁₃', fib.length, 233, 0, false);
}

/* ================= Literatura ================= */
const LITLJ = { fcc: [14.45392, 12.13188], bcc: [12.2533, 9.11418], sc: [8.40192, 6.20215], hcp: [14.45489, 12.13229] };
for (const [k, [a6, a12]] of Object.entries(LITLJ)) { const r = SS.ljSums(k, 24); chk(Lit, `suma de red A₆ de ${k} (Kittel: ${a6})`, r.A6, a6, 5e-5); chk(Lit, `suma de red A₁₂ de ${k} (${a12})`, r.A12, a12, 5e-5); }
{
  const lj = SS.ljCrystal('fcc', 24);
  chk(Lit, 'cristal de Lennard-Jones fcc: R₀ = 1.09 σ', lj.r0, 1.09, 1e-3);
  chk(Lit, 'cristal de Lennard-Jones fcc: U = −8.6 ε por átomo', lj.U, -8.6, 2e-3);
  chk(Lit, 'cristal de Lennard-Jones fcc: B = 75 ε/σ³', lj.B, 75, 3e-3);
  for (const [g, d] of Object.entries(DATA.rareGas)) {
    chk(Lit, `${g} sólido: distancia a primeros vecinos 1.09σ contra el valor medido ${d.r0} Å`, 1.0902 * d.sigma, d.r0, g === 'Ne' ? 0.06 : 0.02);
  }
}
const LITMAD = { NaCl: 1.747565, CsCl: 1.762675, zincblende: 1.6381, fluorite: 5.03878 };
for (const [k, v] of Object.entries(LITMAD)) chk(Lit, `constante de Madelung de ${SS.STRUCT_NAMES[k]} (${v})`, SS.madelung(k).perFormula, v, 5e-5);
chk(Lit, 'constante de Madelung de la wurtzita ideal (1.641)', SS.madelung('wurtzite', Math.sqrt(8 / 3), 0.375).perFormula, 1.641, 3e-4);
for (const [k, d] of Object.entries(DATA.alkaliHalide)) chk(Lit, `${k}: energía de red de Born–Mayer con R₀ = ${d.R0} Å y ρ = ${d.rho} Å contra la experimental ${d.U} kcal/mol`, -SS.bornMayerU0(1.747565, d.R0, d.rho) * 23.0605, d.U, 0.03);
chk(Lit, 'empaquetamiento cúbica simple π/6', SS.packing(SS.structure('sc')), PI / 6, 1e-14);
chk(Lit, 'empaquetamiento bcc √3π/8', SS.packing(SS.structure('bcc')), (Math.sqrt(3) * PI) / 8, 1e-14);
chk(Lit, 'empaquetamiento fcc y hcp √2π/6 = 0.7405', SS.packing(SS.structure('fcc')), (Math.SQRT2 * PI) / 6, 1e-14);
chk(Lit, 'empaquetamiento del diamante √3π/16 = 0.34', SS.packing(SS.structure('diamond')), (Math.sqrt(3) * PI) / 16, 1e-14);
for (const [k, rho] of [['Cu', 8.96], ['Al', 2.70], ['Fe', 7.87], ['Si', 2.33], ['NaCl', 2.165], ['W', 19.3], ['Au', 19.32]]) chk(Lit, `densidad del ${k} desde la constante de red (${rho} g/cm³)`, SS.density(k), rho, 0.01);
chk(Lit, 'Debye: coeficiente de la ley T³, (12π⁴/5)R = 1944 J/(mol·K)', SS.debyeT3(1, 1), 1944, 1e-3);
chk(Lit, 'Cu: θ_D desde las velocidades del sonido (4760 y 2325 m/s) contra 343 K calorimétrico', SS.debyeFromSound(4760, 2325, SS.atomDensity('Cu')).theta, 343, 0.01);
for (const [el, v] of Object.entries(DATA.freeElectron)) {
  const fg = SS.fermiGas(v[1] * 1e28);
  chk(Lit, `${el}: E_F del electrón libre con n = ${v[1]}×10²² cm⁻³ (Ashcroft–Mermin: ${v[3]} eV)`, fg.EFeV, v[3], 0.01);
  chk(Lit, `${el}: rₛ/a₀ (${v[2]})`, fg.rsa0, v[2], 0.006);
  chk(Lit, `${el}: v_F (${v[6]}×10⁸ cm/s)`, fg.vF / 1e6, v[6], 0.01);
}
for (const [el, v] of [['Na', 1], ['K', 1], ['Cu', 1], ['Ag', 1], ['Au', 1], ['Al', 3], ['Li', 1], ['Mg', 2], ['Zn', 2], ['Pb', 4]]) {
  const n = SS.electronDensity(el, v) / 1e28;
  chk(Lit, `${el}: densidad de electrones desde la red y la valencia contra Ashcroft–Mermin (${DATA.freeElectron[el][1]}×10²² cm⁻³)`, n, DATA.freeElectron[el][1], 0.03);
}
for (const [el, tau] of Object.entries(DATA.tauDrude)) chk(Lit, `${el}: tiempo de relajación de Drude a 273 K desde ρ = ${DATA.resistivity[el]} µΩ·cm (A–M: ${tau}×10⁻¹⁴ s)`, SS.drudeTau(DATA.resistivity[el] * 1e-8, DATA.freeElectron[el][1] * 1e28) * 1e14, tau, 0.05);
for (const [el, [, gf]] of Object.entries(DATA.gamma)) {
  const fe = DATA.freeElectron[el];
  chk(Lit, `${el}: γ del electrón libre (Kittel: ${gf} mJ/mol·K²)`, SS.gammaFree(fe[0], fe[4] * 1e4) * 1000, gf, 0.02);
}
for (const [el, [, calc]] of Object.entries(DATA.plasmon)) {
  if (calc === null) continue;
  const Z = { Li: 1, Na: 1, K: 1, Mg: 2, Al: 3, Si: 4, Ge: 4 }[el];
  const n = el === 'Si' || el === 'Ge' ? SS.atomDensity(el) * 4 : SS.electronDensity(el, Z);
  chk(Lit, `${el}: energía del plasmón de volumen del electrón libre ħω_p (Kittel: ${calc} eV)`, (SS.hbar * SS.plasmaW(n)) / SS.e, calc, 0.02);
}
chk(Lit, 'constante de Lorenz L₀ = (π²/3)(k_B/e)² = 2.443×10⁻⁸ W Ω K⁻²', SS.L0, 2.443e-8, 1e-3);
chk(Lit, 'constante de Richardson A = 120.17 A cm⁻² K⁻²', SS.richardsonA / 1e4, 120.17, 1e-4);
chk(Lit, 'Cu: módulo de compresibilidad del gas de electrones (6.13/(rₛ/a₀))⁵ × 10¹⁰ dyn/cm² (Ashcroft–Mermin)', SS.fermiGas(8.47e28).B * 10, Math.pow(6.13 / 2.67, 5) * 1e10, 0.01);
chk(Lit, 'cuanto de flujo h/2e = 2.067833848×10⁻¹⁵ Wb', SS.PHI0, 2.067833848e-15, 1e-9);
chk(Lit, 'constante de von Klitzing h/e² = 25 812.807 45 Ω', SS.RK, 25812.80745, 1e-9);
chk(Lit, 'Si: n_i(300 K) con N_c, N_v de Green (1990) contra 1.0×10¹⁰ cm⁻³ (Sproul y Green 1991)', SS.ni('Si', 300), 1.0e10, 0.08);
chk(Lit, 'Si: E_g(300 K) de Varshni = 1.124 eV', SS.varshni('Si', 300), 1.1242, 1e-3);
chk(Lit, 'GaAs: E_g(300 K) de Varshni = 1.424 eV', SS.varshni('GaAs', 300), 1.424, 2e-3);
chk(Lit, 'Ge: E_g(300 K) de Varshni = 0.661 eV', SS.varshni('Ge', 300), 0.661, 5e-3);
chk(Lit, 'GaAs: n_i(300 K) ≈ 2.1×10⁶ cm⁻³ (Sze)', SS.ni('GaAs', 300), 2.1e6, 0.15);
chk(Lit, 'Ge: n_i(300 K) ≈ 2.0×10¹³ cm⁻³ (Sze)', SS.ni('Ge', 300), 2.0e13, 0.12);
{
  const v = DATA.semi.Si;
  chk(Lit, 'Si: N_c(300 K) desde la masa de densidad de estados 1.09 m₀ (2.86×10¹⁹ cm⁻³)', SS.NcFromMass(v.me, 300), 2.86e19, 0.01);
  chk(Lit, 'Si: N_v(300 K) desde 1.15 m₀ (3.10×10¹⁹ cm⁻³)', SS.NcFromMass(v.mh, 300), 3.10e19, 0.01);
}
chk(Lit, 'Si: movilidad de electrones en material puro 1417 cm²/V·s (Masetti et al. 1983)', SS.mobility(1e12, 'n'), 1417, 0.01);
for (const [t, Nn, rho] of DATA.irvin) {
  const mu = SS.mobility(Nn, t);
  chk(Lit, `Si tipo ${t} con ${Nn.toExponential(0)} cm⁻³: resistividad 1/(qNµ) contra ASTM F723 (${rho} Ω·cm)`, 1 / (SS.e * Nn * mu), rho, 0.08);
}
{
  const G = SS.epm('Si', [0, 0, 0], 21).E;
  chk(Lit, 'Si (pseudopotencial empírico): transición directa Γ₂₅′ → Γ₁₅ ≈ 3.4 eV (experimental 3.4)', G[4] - G[3], 3.40, 0.02);
  chk(Lit, 'Si (pseudopotencial empírico): ancho de la banda de valencia ≈ 12.5 eV (fotoemisión 12.5 ± 0.6)', G[3] - G[0], 12.5, 0.03);
  const Ga = SS.epm('GaAs', [0, 0, 0], 21).E, GaX = SS.epm('GaAs', [0, 1, 0], 21).E;
  chk(Lit, 'GaAs (pseudopotencial empírico): brecha directa en Γ ≈ 1.52 eV (experimental a 0 K)', Ga[4] - Ga[3], 1.52, 0.1);
  chk(Lit, 'GaAs (pseudopotencial empírico): brecha directa (mínimo de conducción en Γ, por debajo de X)', GaX[4] > Ga[4] ? 1 : 0, 1, 0, false);
  const Gp = SS.epm('GaP', [0, 0, 0], 21).E, GpX = SS.epm('GaP', [0, 1, 0], 21).E;
  chk(Lit, 'GaP (pseudopotencial empírico): brecha indirecta Γ → X ≈ 2.35 eV (experimental)', GpX[4] - Gp[3], 2.35, 0.1);
  const Zs = SS.epm('ZnSe', [0, 0, 0], 21).E;
  chk(Lit, 'ZnSe (pseudopotencial empírico): brecha directa ≈ 2.82 eV (experimental a 0 K)', Zs[4] - Zs[3], 2.82, 0.06);
}
for (const [ion, [n, p]] of Object.entries(DATA.pRare)) {
  const hh = SS.hund(n, 3), calc = { Ce: 2.54, Pr: 3.58, Nd: 3.62, Sm: 0.84, Eu: 0, Gd: 7.94, Tb: 9.72, Dy: 10.63, Ho: 10.60, Er: 9.59, Tm: 7.57, Yb: 4.54 }[ion];
  chk(Lit, `${ion}³⁺ (4f${n}, ${hh.term}): p = g√(J(J+1)) de las reglas de Hund (Kittel: ${calc}; medido ${p})`, hh.p, calc, 0.02, calc === 0);
}
for (const [ion, [n, p]] of Object.entries(DATA.pIron)) {
  const hh = SS.hund(n, 2), spin = { 1: 1.73, 2: 2.83, 3: 3.87, 4: 4.90, 5: 5.92, 6: 4.90, 7: 3.87, 8: 2.83, 9: 1.73 }[n];
  chk(Lit, `${ion} (3d${n}): momento de solo espín 2√(S(S+1)) (Kittel: ${spin}; medido ${p})`, hh.pSpin, spin, 2e-3);
}
for (const [k, [wT, wL, e0, ei]] of Object.entries(DATA.lst)) chk(Lit, `${k}: relación de Lyddane–Sachs–Teller (ω_L/ω_T)² = ε(0)/ε(∞)`, Math.pow(wL / wT, 2), e0 / ei, 0.04);
chk(Lit, 'Onsager: T_c del Ising 2D = 2J/ln(1 + √2) = 2.269185 J/k_B', SS.onsagerTc, 2.269185, 1e-6);
chk(Lit, 'Bloch T^{3/2}: coeficiente ζ(3/2)/(4π)^{3/2} = 0.0587 (Kittel)', SS.blochCoef, 0.0587, 2e-3);
chk(Lit, 'BCS: Δ(0) = 1.764 k_BT_c', SS.BCS_D0, 1.764, 1e-4);
chk(Lit, 'BCS: salto del calor específico ΔC/(γT_c) = 1.43', SS.bcsJump, 1.43, 3e-3);
chk(Lit, 'Stoner–Wohlfarth: campo de inversión mínimo h = ½ a 45°', SS.swSwitch(PI / 4), 0.5, 1e-12);
for (const [el, [Tc]] of Object.entries(DATA.super)) {
  if (!DATA.gapRatio[el]) continue;
  chk(Lit, `${el}: 2Δ/k_BT_c medido (${DATA.gapRatio[el]}) frente a BCS 3.53`, DATA.gapRatio[el], 2 * SS.BCS_D0, el === 'Pb' || el === 'Hg' ? 0.32 : 0.1);
}
{
  const g = SS.glFields(39e-9, 38e-9);
  chk(Lit, 'Nb: κ = λ/ξ ≈ 1 (tipo II, κ > 1/√2)', g.type, 2, 0, false);
}
{
  const r = SS.sq(1.34);
  chk(Lit, 'Shockley–Queisser con Sol de cuerpo negro a 5778 K: máximo ≈ 30–31 % hacia 1.3 eV', r.eta, 0.304, 0.02);
}
chk(Lit, 'Fe en Fe-α: D(500 °C) = 3.0×10⁻²¹ m²/s (Callister, ejemplo 5.?)', SS.diffD(2.8e-4, 251, 773), 3.0e-21, 0.1);
chk(Lit, 'Cu: fracción de vacancias a 1357 K con E_v = 0.9 eV ≈ 4.5×10⁻⁴ (Callister, ejemplo 4.1)', SS.vacancyFrac(0.9, 1357), 4.5e-4, 0.06);
chk(Lit, 'hidrógeno: R* = 13.6057 eV con m* = ε = 1', SS.hydrogenic(1, 1).E / 1000, 13.6057, 1e-5);

const R = { fecha: new Date().toISOString().slice(0, 10), ok, bad, ms: Date.now() - t0, rows };
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify(R, null, 0));
const by = {};
for (const r of rows) { by[r.group] = by[r.group] || [0, 0]; by[r.group][r.pass ? 0 : 1]++; }
console.log(Object.entries(by).map(([g, [a, b]]) => `${g}: ${a}/${a + b}`).join(' · '));
console.log(`${ok} de ${ok + bad} pruebas superadas (${R.ms} ms)`);
process.exit(bad ? 1 : 0);
