/* Validación de la biblioteca científica (src/core/30-fluid.js y 31-num.js).
   1) contra referencias independientes: CoolProp (agua, aire y líquidos), la biblioteca fluids
      (fricción, arrastre, atmósfera estándar, Manning) y SciPy (capa límite, Bessel, compresible…);
   2) soluciones numéricas del curso contra soluciones exactas;
   3) contra datos de la literatura (Ghia, Schlichting, Chandrasekhar, Toro, IAPWS, Gunn y Kinzer…).
   Ejecutar: node tests/validar.js   (python tests/referencias.py antes, si cambió) */
const path = require('path');
const fs = require('fs');
const FL = require(path.join(__dirname, '../src/core/31-num.js'));
const ref = require('./referencias.json');
const g = FL.g, PI = Math.PI, deg = PI / 180;
let ok = 0, bad = 0;
const rows = [];
function chk(group, name, got, exp, tol, rel = true) {
  const err = rel ? Math.abs(got - exp) / Math.max(1e-300, Math.abs(exp)) : Math.abs(got - exp);
  const pass = isFinite(got) && err <= tol;
  pass ? ok++ : bad++;
  rows.push({ group, name, got, exp, tol: (rel ? 'rel ' : 'abs ') + tol, pass });
  if (!pass) console.log('FALLA', group, '·', name, 'obtenido', got, 'esperado', exp, 'err', err);
}
const C = 'CoolProp', F = 'fluids', S = 'SciPy', N = 'Numérico', L = 'Literatura';
const W = FL.water, A = FL.air;
const c = (T) => (T - 273.15).toFixed(1).replace(/\.0$/, '') + ' °C';
const t0 = Date.now();

/* ================= 1a. CoolProp ================= */
for (const [T, v] of Object.entries(ref.agua)) {
  const t = +T, lab = `agua a 1 atm, ${c(t)}`;
  chk(C, lab + ': ρ', W.rho(t), v[0], 1e-6); chk(C, lab + ': μ', W.mu(t), v[1], 1e-5); chk(C, lab + ': c_p', W.cp(t), v[2], 1e-5);
  chk(C, lab + ': k', W.k(t), v[3], 1e-5); chk(C, lab + ': c (sonido)', W.c(t), v[4], 1e-5);
  chk(C, lab + ': p_v (ecuación auxiliar de Wagner–Pruß frente a IAPWS-95 completa)', W.psat(t), v[5], 1e-4);
}
for (const [T, v] of Object.entries(ref.agua_sat)) {
  const t = +T, lab = `agua saturada, ${c(t)}`;
  chk(C, lab + ': ρ', W.rho(t), v[0], 2e-5); chk(C, lab + ': μ', W.mu(t), v[1], 2e-4); chk(C, lab + ': p_v (Wagner–Pruß)', W.psat(t), v[2], 1e-4);
}
for (const [T, v] of Object.entries(ref.aire)) {
  const t = +T, lab = `aire a 1 atm, ${c(t)}`;
  chk(C, lab + ': ρ', A.rho(t), v[0], 1e-4); chk(C, lab + ': μ', A.mu(t), v[1], 1e-4); chk(C, lab + ': k', A.k(t), v[2], 1e-4);
  chk(C, lab + ': c_p', A.cp(t), v[3], 1e-4); chk(C, lab + ': c (sonido)', A.c(t), v[4], 1e-4);
  chk(C, lab + ': ρ de gas ideal (desviación de gas real)', A.rhoP(t), v[0], 2.5e-3);
}
for (const [k, v] of Object.entries(ref.liq)) {
  const [nm, T] = k.split(','), t = +T, Lq = FL.liq[nm], lab = `${nm} a 1 atm, ${c(t)}`;
  chk(C, lab + ': ρ', Lq.rho(t), v[0], 1e-5); chk(C, lab + ': μ', Lq.mu(t), v[1], 1e-4); chk(C, lab + ': σ', Lq.sigma(t), v[2], 1e-4);
}
for (const [T, v] of Object.entries(ref.psat)) chk(C, `presión de vapor del agua (Wagner–Pruß frente a IAPWS-95), ${c(+T)}`, W.psat(+T), v, 1e-4);
chk(C, 'temperatura de ebullición en Popayán (81.9 kPa)', FL.POP.Tb, ref.popayan.Tb, 1e-6);
chk(C, 'Sutherland frente a la viscosidad de referencia del aire, 20 °C', A.sutherland(293.15), ref.aire['288.15'][1] * Math.pow(293.15 / 288.15, 0.76), 5e-3);

/* ================= 1b. fluids ================= */
const fk = (k) => k.split(',').map(Number);
for (const [k, v] of Object.entries(ref.colebrook)) { const [Re, e] = fk(k); chk(F, `Colebrook Re = ${Re.toExponential(0)}, ε/D = ${e}`, FL.colebrook(Re, e), v, 1e-10); }
for (const [k, v] of Object.entries(ref.haaland)) { const [Re, e] = fk(k); chk(F, `Haaland Re = ${Re.toExponential(0)}, ε/D = ${e}`, FL.haaland(Re, e), v, 1e-12); }
for (const [k, v] of Object.entries(ref.swamee)) { const [Re, e] = fk(k); chk(F, `Swamee–Jain Re = ${Re.toExponential(0)}, ε/D = ${e} (fluids usa 6.97^0.9 = 5.7397 donde los textos redondean a 5.74)`, FL.swameeJain(Re, e), v, 3e-6); }
for (const [k, v] of Object.entries(ref.churchill)) { const [Re, e] = fk(k); chk(F, `Churchill (todo régimen) Re = ${Re.toExponential(0)}, ε/D = ${e}`, FL.churchill(Re, e), v, 1e-12); }
for (const [Re, v] of Object.entries(ref.cd_morrison)) chk(F, `C_D de la esfera (Morrison 2013), Re = ${Re}`, FL.cdSphere(+Re), v, 1e-12);
for (const [Re, v] of Object.entries(ref.cd_clift)) chk(F, `C_D de la esfera (Clift y Gauvin), Re = ${Re}`, FL.cdSphere(+Re, 'clift'), v, 1e-12);
for (const [k, v] of Object.entries(ref.vterm)) { const [d, rp, r, mu] = fk(k); chk(F, `velocidad terminal, esfera de ${d * 1e3} mm, ρp = ${rp} en ${r < 10 ? 'aire' : 'agua'}`, FL.vTerminal(d, rp, r, mu), v, 1e-8); }
for (const [Z, v] of Object.entries(ref.atm)) {
  const a = FL.atm(+Z), lab = `atmósfera estándar 1976, ${(+Z / 1000).toFixed(Z === '1760' ? 2 : 0)} km`;
  chk(F, lab + ': T', a.T, v[0], 1e-9); chk(F, lab + ': p', a.P, v[1], 1e-7); chk(F, lab + ': ρ', a.rho, v[2], 1e-7);
  chk(F, lab + ': c', a.a, v[3], 1e-7); chk(F, lab + ': μ', a.mu, v[4], 1e-7); chk(F, lab + ': g', a.g, v[5], 1e-9);
}
chk(F, 'presión atmosférica de Popayán (1760 m)', FL.POP.P, ref.popayan.P, 1e-8);
for (const [k, v] of Object.entries(ref.manning)) { const [y, b, z, n, Sl] = fk(k); chk(F, `Manning: V en canal b = ${b} m, talud ${z}, y = ${y} m, n = ${n}`, FL.ch.manningQ(y, b, z, n, Sl) / FL.ch.geo(y, b, z).A, v, 1e-12); }
for (const [k, v] of Object.entries(ref.kexp)) { const [d, D] = fk(k); chk(F, `ensanchamiento brusco (Borda–Carnot) d/D = ${d / D}`, FL.Kexp(d, D), v, 1e-12); }

/* ================= 1c. SciPy ================= */
const bl = FL.blasius();
chk(S, 'Blasius: f″(0) (solve_bvp)', bl.fpp0, ref.blasius.fpp0, 1e-6);
chk(S, 'Blasius: δ*√(Re_x)/x', bl.dstar, ref.blasius.dstar, 2e-4);
chk(S, 'Blasius: θ√(Re_x)/x', bl.theta, ref.blasius.theta, 2e-4);
chk(S, 'Blasius: δ₉₉√(Re_x)/x', bl.d99, ref.blasius.d99, 5e-4);
for (const [b, v] of Object.entries(ref.fs)) {
  const r = FL.fs(+b);
  chk(S, `Falkner–Skan β = ${b}: f″(0)`, r.fpp0, v.fpp0, 2e-5);
  chk(S, `Falkner–Skan β = ${b}: δ*`, r.dstar, v.dstar, 5e-4);
}
for (const [x, v] of Object.entries(ref.besselJ0)) chk(S, `J₀(${x})`, FL.besselJ(0, +x), v, 1e-9, false);
for (const [x, v] of Object.entries(ref.besselJ1)) chk(S, `J₁(${x})`, FL.besselJ(1, +x), v, 1e-9, false);
for (const [x, v] of Object.entries(ref.besselI0)) chk(S, `I₀(${x})`, FL.besselI(0, +x), v, 1e-9);
for (const [x, v] of Object.entries(ref.besselI1)) chk(S, `I₁(${x})`, FL.besselI(1, +x), v, 1e-9);
ref.j0zeros.forEach((v, i) => chk(S, `cero ${i + 1} de J₀`, FL.j0zero(i + 1), v, 1e-10));
for (const [x, v] of Object.entries(ref.erf)) chk(S, `erf(${x})`, FL.erf(+x), v, 2e-7, false);
for (const [x, v] of Object.entries(ref.erfc)) chk(S, `erfc(${x})`, FL.erfc(+x), v, 2e-6);
const i32 = [-Math.SQRT1_2, Math.SQRT1_2];
for (const [a, v] of Object.entries(ref.j0c)) { const z = FL.besselJc(0, [i32[0] * +a, i32[1] * +a]); chk(S, `J₀(i^{3/2}·${a}) parte real`, z[0], v[0], 1e-8 * Math.max(1, Math.abs(v[0])), false); chk(S, `J₀(i^{3/2}·${a}) parte imaginaria`, z[1], v[1], 1e-8 * Math.max(1, Math.abs(v[1])), false); }
for (const [k, v] of Object.entries(ref.womersley)) { const [s, t, al] = fk(k); chk(S, `Womersley u(r/R = ${s}, ωt = ${t}), α = ${al}`, FL.womersley(s, t, 1, 1, 1, al), v, 1e-8, false); }
for (const [k, v] of Object.entries(ref.szymanski)) { const [s, tau] = fk(k); chk(S, `arranque en un tubo (Szymanski) r/R = ${s}, νt/R² = ${tau}`, FL.pipeStart(s, tau), v, 1e-9, false); }
{
  let lo = 0.1, hi = 0.99;
  for (let i = 0; i < 200; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (FL.prSigma2(m1) < FL.prSigma2(m2)) lo = m1; else hi = m2; }
  chk(S, 'Plateau–Rayleigh: kR del modo más inestable', (lo + hi) / 2, ref.plateau.x, 1e-6);
  chk(S, 'Plateau–Rayleigh: σ²ρR³/γ máximo', FL.prSigma2((lo + hi) / 2), ref.plateau.s2, 1e-9);
}
for (const [k, v] of Object.entries(ref.oblique)) { const [M, th] = fk(k); chk(S, `choque oblicuo M = ${M}, θ = ${th}°: β débil`, FL.cf.beta(M, th * deg) / deg, v[0], 1e-9); chk(S, `choque oblicuo M = ${M}: θ máximo`, FL.cf.thetaMax(M).theta / deg, v[1], 1e-8); }
for (const [M, v] of Object.entries(ref.pm)) chk(S, `Prandtl–Meyer ν(${M})`, FL.cf.nu(+M) / deg, v, 1e-12);
for (const [n, v] of Object.entries(ref.pm_inv)) chk(S, `Prandtl–Meyer inversa M(ν = ${n}°)`, FL.cf.Mnu(+n * deg), v, 1e-10);
for (const [Ar, v] of Object.entries(ref.mfroma)) { chk(S, `M subsónico con A/A* = ${Ar}`, FL.cf.MfromA(+Ar, false), v[0], 1e-10); chk(S, `M supersónico con A/A* = ${Ar}`, FL.cf.MfromA(+Ar, true), v[1], 1e-10); }
for (const [k, v] of Object.entries(ref.dispersion)) { const [T, h] = fk(k); chk(S, `longitud de onda, periodo ${T} s, profundidad ${h} m`, (2 * PI) / FL.waveK((2 * PI) / T, h), v, 1e-10); }
{
  const s = 0.0728 / 998.2;
  let lo = 10, hi = 2000;
  for (let i = 0; i < 300; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (FL.waveW(m1, 100, s) / m1 > FL.waveW(m2, 100, s) / m2) lo = m1; else hi = m2; }
  const km = (lo + hi) / 2;
  chk(S, 'ondas capilares: velocidad de fase mínima del agua', FL.waveW(km, 100, s) / km, ref.cmin.c, 1e-9);
  chk(S, 'ondas capilares: longitud de onda de la velocidad mínima', (2 * PI) / km, ref.cmin.lam, 1e-6);
}
chk(S, 'Lamb–Oseen: r_max/√(4νt)', FL.LO_RMAX, ref.lo_rmax, 1e-4);
{
  let lo = 1, hi = 4;
  for (let i = 0; i < 300; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (FL.rbFree(m1) < FL.rbFree(m2)) hi = m2; else lo = m1; }
  chk(S, 'Rayleigh–Bénard libre–libre: Ra crítico', FL.rbFree((lo + hi) / 2), ref.rb_free.Ra, 1e-10);
  chk(S, 'Rayleigh–Bénard libre–libre: k crítico', (lo + hi) / 2, ref.rb_free.k, 1e-6);
}
{
  let y = [1, 1, 1]; const f = FL.lorenz(10, 28, 8 / 3), dt = 1e-4;
  for (let i = 0; i < 20000; i++) y = FL.rk4(f, i * dt, y, dt);
  ['x', 'y', 'z'].forEach((n, i) => chk(S, `Lorenz (RK4, Δt = 10⁻⁴) frente a solve_ivp: ${n}(t = 2)`, y[i], ref.lorenz[i], 1e-6));
}
for (const [k, v] of Object.entries(ref.powerQ)) { const [K, n] = fk(k); chk(S, `ley de potencia en tubo K = ${K}, n = ${n}: caudal (quad)`, FL.powerPipeQ(0.01, 2000, K, n), v, 1e-9); }
for (const [k, v] of Object.entries(ref.binghamQ)) { const [mu, ty] = fk(k); chk(S, `Bingham en tubo (Buckingham–Reiner) τ_y = ${ty} Pa: caudal (quad)`, FL.binghamQ(0.01, 2000, mu, ty), v, 1e-8); }
{
  const r = FL.riemann([1, 0, 1], [0.125, 0, 0.1]);
  chk(S, 'tubo de choque de Sod: p* (brentq)', r.p, ref.sod.p, 1e-10);
  chk(S, 'tubo de choque de Sod: u*', r.u, ref.sod.u, 1e-10);
}

/* ================= 2. Soluciones numéricas contra exactas ================= */
{
  /* cavidad 65 × 65, Re = 100, contra Ghia et al. */
  const cv = new FL.Cavity(65, 100).solve(1e-4, 100);
  let e = 0;
  FL.GHIA.y.forEach((y, i) => { e = Math.max(e, Math.abs(cv.field('u', 0.5, y) - FL.GHIA.u100[i])); });
  chk(N, 'cavidad Re = 100, malla 65 × 65: diferencia máxima con Ghia et al. en u(0.5, y)', e, 0, 0.005, false);
  chk(N, 'cavidad Re = 100, malla 65 × 65: ψ_min frente a Ghia (−0.103423)', cv.psiMin().psi, FL.GHIA.psiMin[100], 0.01);
}
{
  /* LBM: decaimiento del vórtice de Taylor–Green, u ∝ exp(−2νk²t) */
  const n = 64, nu = 0.02, U0 = 0.02, kk = (2 * PI) / n;
  const Lb = new FL.LBM(n, n, { mode: 'periodic', nu });
  Lb.init(0, 0, (i, j) => [-U0 * Math.cos(kk * i) * Math.sin(kk * j), U0 * Math.sin(kk * i) * Math.cos(kk * j)]);
  const steps = 1500;
  for (let s = 0; s < steps; s++) Lb.step();
  let num = 0, den = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const e = U0 * Math.sin(kk * i) * Math.cos(kk * j); num += Lb.uy[j * n + i] * e; den += e * e; }
  const amp = num / den, exact = Math.exp(-2 * nu * kk * kk * steps);
  chk(N, 'Lattice Boltzmann: decaimiento de Taylor–Green tras 1500 pasos (64 × 64)', amp, exact, 2e-3);
}
{
  /* LBM: Poiseuille con fuerza volumétrica (Guo) y rebote a mitad de enlace. Con τ = 1/2 + √(3/16) el
     rebote sitúa la pared exactamente a medio enlace y el perfil discreto es la parábola exacta, H = ny − 2 */
  const nx = 4, ny = 34, tau = 0.5 + Math.sqrt(3 / 16), nu = (tau - 0.5) / 3, Fx = 4e-5;
  const Lb = new FL.LBM(nx, ny, { mode: 'periodic', tau, Fx, walls: true });
  for (let s = 0; s < 12000; s++) Lb.step();
  const H = ny - 2;
  let e = 0, um = 0, ue = 0;
  for (let j = 1; j < ny - 1; j++) { const y = j - 0.5, ex = (Fx / (2 * nu)) * y * (H - y); e = Math.max(e, Math.abs(Lb.ux[j * nx + 1] - ex)); um = Math.max(um, Lb.ux[j * nx + 1]); ue = Math.max(ue, ex); }
  chk(N, 'Lattice Boltzmann: velocidad máxima de Poiseuille en los nodos, F y(H − y)/(2ν)', um, ue, 5e-4);
  chk(N, 'Lattice Boltzmann: error máximo del perfil de Poiseuille / u_max (τ = 1/2 + √(3/16))', e / um, 0, 5e-4, false);
}
{
  /* golpe de ariete: cierre instantáneo sin fricción → ΔH = aV/g (Joukowsky) */
  const r = FL.hammer({ L: 600, a: 1200, D: 0.3, f: 0, V0: 1.5, H0: 50, N: 40, tc: 0, tmax: 4 });
  chk(N, 'golpe de ariete (características): sobrepresión de Joukowsky aV/g', Math.max(...r.Hv) - 50, (1200 * 1.5) / g, 1e-9);
  /* periodo 4L/a: la carga en la válvula vuelve a bajar a H0 − aV/g */
  chk(N, 'golpe de ariete: depresión mínima H0 − aV/g', Math.min(...r.Hv), 50 - (1200 * 1.5) / g, 1e-9);
}
{
  /* Sod con volúmenes finitos (HLLC + MUSCL, 400 celdas) contra Riemann exacto */
  const E = new FL.Euler1D(400, 1);
  E.setPrim((x) => (x < 0.5 ? [1, 0, 1] : [0.125, 0, 0.1]));
  while (E.t < 0.2 - 1e-12) E.step(0.2 - E.t);
  const R = FL.riemann([1, 0, 1], [0.125, 0, 0.1]);
  let e1 = 0, ep = 0;
  for (let i = 0; i < 400; i++) { const x = (i + 0.5) / 400, w = R.sample((x - 0.5) / 0.2), q = E.prim(i); e1 += Math.abs(q[0] - w[0]) / 400; if (Math.abs(x - 0.6) < 0.05) ep = Math.max(ep, Math.abs(q[2] - R.p)); }
  chk(N, 'Sod: error medio de la densidad (400 celdas, t = 0.2)', e1, 0, 5e-3, false);
  chk(N, 'Sod: presión de la meseta entre la discontinuidad de contacto y el choque', ep, 0, 2e-3, false);
}
{
  /* rotura de presa sobre lecho seco (HLL) contra Ritter */
  const h0 = 1, Lx = 20, nx = 800, sw = new FL.SW1D(nx, Lx, { bc: 'open' });
  for (let i = 0; i < nx; i++) sw.h[i] = (i + 0.5) * (Lx / nx) < 10 ? h0 : 0;
  const T = 1.5;
  while (sw.t < T - 1e-12) sw.step(T - sw.t);
  let e = 0;
  for (let i = 0; i < nx; i++) { const x = (i + 0.5) * (Lx / nx) - 10; e += Math.abs(sw.h[i] - FL.ch.ritter(x / T, h0).h) / nx; }
  chk(N, 'rotura de presa (volúmenes finitos, 800 celdas): error medio de la profundidad frente a Ritter', e / h0, 0, 3e-3, false);
}
{
  /* primer problema de Stokes con Crank–Nicolson, con la malla y el paso de la simulación del capítulo 10 */
  const nu = 1e-6, Yd = 3.64 * Math.sqrt(nu * 10) * 1.6, D = new FL.Diffusion1D(201, Yd, nu, { bc0: () => 1 });
  for (let s = 0; s < 1000; s++) D.step(0.01);
  let e = 0;
  for (let i = 0; i < 201; i++) e = Math.max(e, Math.abs(D.u[i] - FL.stokes1(i * D.dy, D.t, 1, nu)));
  chk(N, 'primer problema de Stokes (Crank–Nicolson, t = 10 s) frente a erfc', e, 0, 5e-4, false);
}
{
  /* arranque en un tubo: difusión cilíndrica con fuente constante contra la serie de Szymanski */
  const nu = 1, R = 1, G = 4, D = new FL.Diffusion1D(201, R, nu, { cyl: true, src: () => G, bc1: () => 0 });
  const tau = 0.1;
  for (let s = 0; s < 1000; s++) D.step(tau / 1000);
  let e = 0;
  for (let i = 0; i < 201; i++) e = Math.max(e, Math.abs(D.u[i] - FL.pipeStart(i / 200, tau)));
  chk(N, 'arranque del flujo en un tubo (Crank–Nicolson cilíndrico) frente a Szymanski', e, 0, 1e-3, false);
}
{
  /* Womersley: difusión cilíndrica con gradiente oscilante, régimen periódico */
  const al = 5, nu = 1 / (al * al), D = new FL.Diffusion1D(201, 1, nu, { cyl: true, src: (t) => Math.cos(t), bc1: () => 0 });
  const steps = 4000, Tt = 10 * 2 * PI;
  for (let s = 0; s < steps; s++) D.step(Tt / steps);
  let e = 0, mx = 0;
  for (let i = 0; i < 201; i++) { const ex = FL.womersley(i / 200, D.t, 1, 1, 1, al); e = Math.max(e, Math.abs(D.u[i] - ex)); mx = Math.max(mx, Math.abs(ex)); }
  chk(N, 'flujo de Womersley α = 5 (diferencias finitas) frente a la solución con Bessel', e / mx, 0, 5e-3, false);
}
{
  /* cojinete de deslizamiento: Reynolds en diferencias finitas contra la carga analítica */
  const h1 = 2e-4, h2 = 1e-4, Lc = 0.1, U = 5, mu = 0.05, an = FL.slider(h1, h2, Lc, U, mu);
  const nm = FL.reynoldsFD((x) => h1 - ((h1 - h2) * x) / Lc, Lc, U, mu, 800);
  chk(N, 'cojinete inclinado: carga por diferencias finitas frente a la fórmula exacta', nm.W, an.W, 1e-5);
  chk(N, 'cojinete inclinado: presión máxima', Math.max(...nm.p), an.p(an.xmax), 1e-4);
}
{
  /* cuatro vórtices puntuales: el hamiltoniano y el impulso se conservan */
  const X = [0, 1, 0.3, -0.8], Y = [0, 0.2, 1.1, -0.5], G = [1, 0.7, -0.5, 1.2];
  const H0 = FL.vortexH(X, Y, G), P0 = FL.vortexImpulse(X, Y, G);
  for (let s = 0; s < 4000; s++) FL.vortexStep(X, Y, G, 0.002);
  chk(N, 'cuatro vórtices puntuales (RK4): conservación del hamiltoniano', FL.vortexH(X, Y, G), H0, 1e-8);
  const P1 = FL.vortexImpulse(X, Y, G);
  chk(N, 'cuatro vórtices puntuales: conservación del impulso Σ Γ x', P1[0], P0[0], 1e-9, false);
  chk(N, 'cuatro vórtices puntuales: conservación del impulso Σ Γ y', P1[1], P0[1], 1e-9, false);
}
{
  /* gota sésil: equilibrio de fuerzas (Δp en la base)·A − 2πR γ sen θ = ρ g V, y gota pequeña = casquete esférico */
  for (const th of [60, 120]) {
    const d = FL.sessileV(2, th * deg);
    const b = FL.bisect((x) => FL.sessile(x, th * deg).V - 2, 1e-3, 200, 1e-12);
    const dd = FL.sessile(b, th * deg, 1e-4);
    chk(N, `gota sésil V = 2ℓc³, θ = ${th}°: equilibrio vertical de fuerzas`, (2 / b + dd.H) * PI * dd.Rb * dd.Rb - 2 * PI * dd.Rb * Math.sin(th * deg), dd.V, 2e-6);
    void d;
  }
  const b = 0.01, th = 70 * deg, s = FL.sessile(b, th, 1e-6), Vcap = (PI * Math.pow(b, 3) * Math.pow(1 - Math.cos(th), 2) * (2 + Math.cos(th))) / 3;
  chk(N, 'gota sésil pequeña (Bo → 0): volumen del casquete esférico', s.V, Vcap, 1e-3);
  chk(N, 'gota sésil pequeña: altura b(1 − cos θ)', s.H, b * (1 - Math.cos(th)), 1e-3);
}
{
  /* estabilidad: pendiente inicial de GZ(φ) igual a la altura metacéntrica de una barcaza rectangular */
  const B = 6, D = 3, frac = 0.5, hull = [[-B / 2, 0], [B / 2, 0], [B / 2, D], [-B / 2, D]], T = frac * D, KG = 1.2;
  const GM = T / 2 + (B * B) / (12 * T) - KG, phi = 0.2 * deg;
  chk(N, 'barcaza 6 × 3 m: GZ(0.2°)/sen φ frente a GM = KB + BM − KG', FL.gz(hull, frac, [0, KG], phi).GZ / Math.sin(phi), GM, 1e-4);
}
{
  /* Kutta–Joukowski: integrar la presión de Bernoulli alrededor del cilindro con circulación */
  const a = 0.5, U = 3, G = 4, rho = 1.2, cy = FL.cylinder(a, U, G, rho), n = 4000;
  let Fy = 0, Fx = 0;
  for (let i = 0; i < n; i++) { const th = ((i + 0.5) * 2 * PI) / n, p = 0.5 * rho * U * U * cy.Cp(th); Fx -= p * Math.cos(th) * a * ((2 * PI) / n); Fy -= p * Math.sin(th) * a * ((2 * PI) / n); }
  chk(N, 'cilindro con circulación: sustentación por integración de la presión = −ρUΓ', Fy, cy.L, 1e-10);
  chk(N, 'cilindro con circulación: arrastre nulo (d’Alembert)', Fx, 0, 1e-10, false);
}
{
  /* Joukowski: la circulación de Kutta deja el borde de salida sin singularidad (velocidad finita) */
  const J = FL.joukowski({ m: 0.1, n: 0.05, alpha: 5 * deg }), zte = [1 + 1e-7, 0], v = J.vel(zte);
  chk(N, 'perfil de Joukowski: velocidad finita en el borde de salida con la condición de Kutta', Math.hypot(v[0], v[1]), 0.95, 0.3);
  chk(N, 'perfil de Joukowski delgado y simétrico: C_L → 2π α', FL.joukowski({ m: 1e-4, n: 0, alpha: 2 * deg }).CL, 2 * PI * 2 * deg, 2e-3);
}
{
  /* espectro de Pope: 2ν∫k²E dk = ε */
  const nu = 1e-6, eps = 1e-3, eta = Math.pow((nu * nu * nu) / eps, 0.25), Lr = 1e4 * eta;
  let I = 0; const n = 20000, a = Math.log(1e-3 / Lr), b = Math.log(20 / eta);
  for (let i = 0; i <= n; i++) { const lk = a + ((b - a) * i) / n, k = Math.exp(lk), w = i === 0 || i === n ? 0.5 : 1; I += w * k * k * FL.pope(k, eps, Lr, eta) * k; }
  I *= (b - a) / n;
  chk(N, 'espectro modelo de Pope: 2ν∫k²E(k)dk = ε (L/η = 10⁴)', 2 * nu * I, eps, 0.03);
}
{
  /* ducto cuadrado: diferencias finitas de 2.º orden + Richardson frente a la serie exacta */
  const solve = (Nc) => {
    const h = 1 / Nc, n = Nc + 1, u = new Float64Array(n * n), om = 2 / (1 + Math.sin(PI * h));
    for (let it = 0; it < 20000; it++) { let mx = 0; for (let j = 1; j < Nc; j++) for (let i = 1; i < Nc; i++) { const k = j * n + i, d = om * (0.25 * (u[k + 1] + u[k - 1] + u[k + n] + u[k - n] + h * h) - u[k]); u[k] += d; if (Math.abs(d) > mx) mx = Math.abs(d); } if (mx < 1e-14) break; }
    let Q = 0; for (let k = 0; k < n * n; k++) Q += u[k] * h * h; return Q;
  };
  const q16 = solve(16), q32 = solve(32), q64 = solve(64);
  chk(N, 'ducto cuadrado: orden de convergencia observado (16, 32, 64 celdas)', Math.log2((q32 - q16) / (q64 - q32)), 2, 0.03);
  chk(N, 'ducto cuadrado: caudal extrapolado de Richardson (32 y 64 celdas)', q64 + (q64 - q32) / 3, ref.duct, 1e-5);
  chk(N, 'ducto cuadrado: f·Re de Richardson frente a 56.908', 2 / (q64 + (q64 - q32) / 3), 56.908, 1e-4);
}
{
  /* advección (capítulo 26): contra el viento con C = 1 es exacta; minmod no crea extremos; Lax–Wendroff es de 2.º orden */
  const prof = (x) => Math.exp(-(((x - 0.5) / 0.08) ** 2)), mk = (n) => Float64Array.from({ length: n }, (_, i) => prof((i + 0.5) / n));
  let u = mk(100), u0 = u.slice();
  for (let s = 0; s < 100; s++) u = FL.advectStep(u, 1, 'upwind');
  chk(N, 'advección contra el viento con C = 1: una vuelta completa reproduce el perfil exacto', Math.max(...u.map((v, i) => Math.abs(v - u0[i]))), 0, 1e-14, false);
  const sq = Float64Array.from({ length: 200 }, (_, i) => ((i + 0.5) / 200 > 0.2 && (i + 0.5) / 200 < 0.5 ? 1 : 0));
  let m = sq;
  for (let s = 0; s < 400; s++) m = FL.advectStep(m, 0.5, 'minmod');
  chk(N, 'limitador minmod: sobrepaso del escalón por encima de 1 tras una vuelta (TVD: nulo)', Math.max(0, Math.max(...m) - 1), 0, 1e-12, false);
  chk(N, 'limitador minmod: valores negativos tras una vuelta (TVD: nulos)', Math.max(0, -Math.min(...m)), 0, 1e-12, false);
  const errLW = (n) => { let v = mk(n); for (let s = 0; s < 2 * n; s++) v = FL.advectStep(v, 0.5, 'lw'); let e = 0; v.forEach((x, i) => { e += Math.abs(x - prof((i + 0.5) / n)) / n; }); return e; };
  chk(N, 'Lax–Wendroff: orden observado con 200 y 400 celdas (gaussiana)', Math.log2(errLW(200) / errLW(400)), 2, 0.05);
  const errUp = (n) => { let v = mk(n); for (let s = 0; s < 2 * n; s++) v = FL.advectStep(v, 0.5, 'upwind'); let e = 0; v.forEach((x, i) => { e += Math.abs(x - prof((i + 0.5) / n)) / n; }); return e; };
  chk(N, 'contra el viento: orden observado con 1600 y 3200 celdas (tiende a 1)', Math.log2(errUp(1600) / errUp(3200)), 1, 0.05);
  /* FTCS: factor de amplificación |G|² = 1 + C² sen²(kΔx) > 1 */
  const amp = (v) => Math.sqrt((2 / v.length) * v.reduce((a, x) => a + x * x, 0));
  let f = Float64Array.from({ length: 64 }, (_, i) => Math.sin((2 * PI * 8 * i) / 64)), a0 = amp(f);
  for (let s = 0; s < 10; s++) f = FL.advectStep(f, 0.5, 'central');
  chk(N, 'esquema centrado FTCS: crecimiento de un modo en 10 pasos = (1 + C² sen²(kΔx))⁵', amp(f) / a0, Math.pow(1 + 0.25 * Math.pow(Math.sin((2 * PI * 8) / 64), 2), 5), 1e-6);
}
{
  /* Hardy Cross: red de dos mallas; al converger, la suma de pérdidas en cada malla es nula y se conserva la masa */
  const pipes = [{ r: 100, Q: 0.06 }, { r: 300, Q: 0.04 }, { r: 200, Q: 0.02 }, { r: 400, Q: 0.02 }, { r: 150, Q: 0.04 }];
  const loops = [[[0, 1], [2, 1], [1, -1]], [[2, -1], [3, 1], [4, -1]]];
  const Q = FL.hardyCross(pipes, loops, 2, 200);
  for (const [k, lp] of loops.entries()) { let h = 0; for (const [i, sg] of lp) h += sg * pipes[i].r * Q[i] * Math.abs(Q[i]); chk(N, `Hardy Cross: suma de pérdidas en la malla ${k + 1}`, h, 0, 1e-9, false); }
  chk(N, 'Hardy Cross: las correcciones de malla conservan el caudal total que entra', Q[0] + Q[1], 0.1, 1e-12);
}
{
  /* Rayleigh–Bénard: el disparo con bordes libres reproduce (k² + π²)³/k² */
  chk(N, 'Rayleigh–Bénard libre–libre: disparo frente a la fórmula exacta en k = 2.2214', FL.rbRa(2.2214, 'free', 'free'), FL.rbFree(2.2214), 1e-7);
}
{
  /* Kelvin–Helmholtz: la velocidad mínima analítica coincide con el umbral numérico de σ² > 0 */
  const r1 = 998.2, r2 = 1.204, gam = 0.0728, Um = FL.khUmin(r1, r2, gam);
  const unstable = (U) => { for (let lk = 0; lk < 8; lk += 0.001) if (FL.khS2(Math.exp(lk), r1, r2, 0, U, gam) > 0) return true; return false; };
  const Un = FL.bisect((U) => (unstable(U) ? 1 : -1), 1, 20, 1e-9);
  chk(N, 'Kelvin–Helmholtz aire–agua: velocidad mínima analítica frente a la búsqueda numérica', Un, Um, 1e-3);
  chk(L, 'Kelvin–Helmholtz aire–agua: U_min ≈ 6.6 m/s (Lamb, Hydrodynamics §268)', Um, 6.6, 0.01);
}
{
  /* Murray: el mínimo numérico del costo coincide con r = (16μQ²/(π²b))^{1/6} */
  const Q = 1e-6, mu = 3.5e-3, b = 1e3, rn = Math.exp(FL.bisect((lr) => { const r = Math.exp(lr), h = 1e-6; return (FL.murrayCost(r * (1 + h), Q, mu, b) - FL.murrayCost(r * (1 - h), Q, mu, b)) / (2 * h * r); }, Math.log(1e-6), Math.log(1), 1e-14));
  chk(N, 'ley de Murray: mínimo numérico del costo frente a la fórmula', rn, FL.murrayR(Q, mu, b), 1e-6);
}
{
  /* Buckingham: arrastre de una esfera F(ρ, U, D, μ) → 2 grupos; el de μ es el inverso de Reynolds */
  const dims = [[1, 1, -2, 0], [1, -3, 0, 0], [0, 1, -1, 0], [0, 1, 0, 0], [1, -1, -1, 0]]; /* F, ρ, U, D, μ */
  const r = FL.piGroups(dims, [1, 2, 3]);
  chk(N, 'Buckingham: rango de la matriz dimensional de F, ρ, U, D, μ', r.rank, 3, 0, false);
  chk(N, 'Buckingham: el grupo de μ es μ/(ρUD) = 1/Re', JSON.stringify(r.groups[1].exp) === JSON.stringify([0, -1, -1, -1, 1]) ? 1 : 0, 1, 0, false);
}

/* ================= 3. Literatura ================= */
const gh = FL.GHIA;
chk(L, 'Blasius: f″(0) = 0.33206 (Schlichting y Gersten)', bl.fpp0, 0.33206, 2e-5);
chk(L, 'Blasius: δ₉₉ = 4.91 x/√Re_x', bl.d99, 4.91, 2e-3);
chk(L, 'Blasius: c_f√Re_x = 0.664', 2 * bl.fpp0, 0.664, 1e-3);
chk(L, 'Falkner–Skan β = 1 (estancamiento de Hiemenz): f″(0) = 1.2326', FL.fs(1).fpp0, 1.2326, 1e-4);
{
  /* f″(0)² es casi lineal en β cerca de la separación: parábola por tres puntos y su raíz */
  const P = [-0.19, -0.195, -0.198].map((b) => [b, FL.fs(b).fpp0 ** 2]);
  const [[x0, y0], [x1, y1], [x2, y2]] = P, d1 = (y1 - y0) / (x1 - x0), d2 = (y2 - y1) / (x2 - x1), a2 = (d2 - d1) / (x2 - x0), a1 = d1 - a2 * (x0 + x1), a0 = y0 - a1 * x0 - a2 * x0 * x0;
  /* la raíz física es la que queda justo más allá del último β calculado */
  const r1 = (-a1 + Math.sqrt(a1 * a1 - 4 * a2 * a0)) / (2 * a2), r2 = (-a1 - Math.sqrt(a1 * a1 - 4 * a2 * a0)) / (2 * a2);
  const bs = [r1, r2].find((r) => r < -0.198 && r > -0.21);
  chk(L, 'Falkner–Skan: β de separación (f″(0) = 0) = −0.19884 (Hartree, 1937)', bs, -0.19884, 5e-4);
}
{
  const rr = FL.rbCritical('rigid', 'rigid'), rf = FL.rbCritical('rigid', 'free');
  chk(L, 'Rayleigh–Bénard rígido–rígido: Ra_c = 1707.76 (Chandrasekhar)', rr.Ra, 1707.76, 1e-5);
  chk(L, 'Rayleigh–Bénard rígido–rígido: k_c = 3.117', rr.k, 3.117, 1e-3);
  chk(L, 'Rayleigh–Bénard rígido–libre: Ra_c = 1100.65', rf.Ra, 1100.65, 1e-5);
  chk(L, 'Rayleigh–Bénard rígido–libre: k_c = 2.682', rf.k, 2.682, 1e-3);
}
chk(L, 'Rayleigh–Bénard libre–libre: Ra_c = 27π⁴/4 = 657.51', ref.rb_free.Ra, (27 * Math.pow(PI, 4)) / 4, 1e-9);
chk(L, 'estela de Kelvin: semiángulo 19.47°', FL.kelvinAngle / deg, 19.47, 2e-4);
{
  let lo = 0, hi = 0.5;
  for (let i = 0; i < 200; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (FL.betz(m1).Cp < FL.betz(m2).Cp) lo = m1; else hi = m2; }
  chk(L, 'límite de Betz: C_P máximo = 16/27', FL.betz((lo + hi) / 2).Cp, 16 / 27, 1e-12);
  chk(L, 'límite de Betz: a óptimo = 1/3', (lo + hi) / 2, 1 / 3, 1e-6);
}
chk(L, 'Plateau–Rayleigh: kR = 0.697 (Rayleigh, 1878)', ref.plateau.x, 0.697, 1e-3);
chk(L, 'ondas capilares: velocidad mínima 0.231 m/s (Lighthill)', ref.cmin.c, 0.231, 2e-3);
chk(L, 'ondas capilares: longitud de onda de la velocidad mínima 1.71 cm', ref.cmin.lam * 100, 1.71, 3e-3);
{
  const n = FL.cf.normal(2);
  chk(L, 'choque normal M₁ = 2: M₂ = 0.5774 (tablas NACA 1135)', n.M2, 0.5774, 1e-4);
  chk(L, 'choque normal M₁ = 2: p₂/p₁ = 4.5', n.p21, 4.5, 1e-12);
  chk(L, 'choque normal M₁ = 2: ρ₂/ρ₁ = 2.6667', n.r21, 8 / 3, 1e-12);
  chk(L, 'choque normal M₁ = 2: T₂/T₁ = 1.6875', n.T21, 1.6875, 1e-12);
  chk(L, 'choque normal M₁ = 2: p₀₂/p₀₁ = 0.7209', n.p0r, 0.7209, 1e-4);
}
chk(L, 'Prandtl–Meyer: ν(2) = 26.38°', FL.cf.nu(2) / deg, 26.38, 1e-4);
chk(L, 'isentrópico: A/A*(M = 2) = 1.6875', FL.cf.AAs(2), 1.6875, 1e-12);
chk(L, 'isentrópico: p*/p₀ = 0.5283', FL.cf.pStar(), 0.5283, 1e-4);
chk(L, 'choque oblicuo: θ_max(M = 2) = 22.97°', FL.cf.thetaMax(2).theta / deg, 22.97, 2e-4);
chk(L, 'Fanno: 4fL*/D (M = 0.5) = 1.0691 (Darcy: f̄L*/D)', FL.cf.fanno(0.5).fL, 1.0691, 1e-4);
chk(L, 'Rayleigh: T₀/T₀* (M = 0.5) = 0.6914', FL.cf.rayleigh(0.5).T0T0, 0.6914, 1e-4);
chk(L, 'tubo de choque de Sod: p* = 0.30313 (Toro, 2009)', ref.sod.p, 0.30313, 1e-5);
chk(L, 'tubo de choque de Sod: u* = 0.92745', ref.sod.u, 0.92745, 1e-5);
for (const [t, v] of [[0.01, 75.65], [10, 74.22], [20, 72.74], [25, 71.97], [40, 69.6], [60, 66.24], [80, 62.67], [100, 58.91], [150, 48.74], [200, 37.67], [250, 26.04], [300, 14.36], [350, 3.67]]) chk(L, `tensión superficial del agua a ${t} °C = ${v} mN/m (tabla IAPWS R1-76)`, W.sigma(t + 273.15) * 1e3, v, 0.006, false);
chk(L, 'presión de vapor del agua a 100 °C = 101.418 kPa (IAPWS)', W.psat(373.15) / 1e3, 101.418, 1e-5);
chk(L, 'densidad del agua a 4 °C = 999.97 kg/m³', W.rho(277.15), 999.97, 1e-5);
chk(L, 'Popayán: presión de 81.9 kPa a 1760 m', FL.POP.P / 1e3, 81.9, 1e-3);
chk(L, 'Popayán: el agua hierve a 94.1 °C', FL.POP.Tb - 273.15, 94.1, 1e-3);
for (const [d, v] of [[1e-3, 4.03], [2e-3, 6.49]]) chk(L, `gota de lluvia de ${d * 1e3} mm: velocidad terminal ${v} m/s (Gunn y Kinzer, 1949)`, FL.vTerminal(d, 998.2, 1.204, 1.81e-5), v, 0.03);
{
  /* explosión de Taylor: R ∝ t^{2/5} en los datos de Trinity */
  const D = FL.TAYLOR, xs = D.map((p) => Math.log(p[0])), ys = D.map((p) => Math.log(p[1]));
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) * (x - mx); });
  chk(L, 'explosión Trinity: exponente de R(t) ajustado a las 25 fotografías ≈ 2/5 (Taylor, 1950)', sxy / sxx, 0.4, 0.03);
}
chk(L, 'calle de von Kármán estable: b/a = 0.281', FL.karmanRatio, 0.281, 2e-3);
for (const [Rt, v, src] of [[180, 15.6, 'Kim, Moin y Moser'], [395, 17.4, 'Moser, Kim y Mansour'], [590, 18.6, 'Moser, Kim y Mansour']]) chk(L, `canal turbulento Re_τ = ${Rt}: U_b⁺ = ${v} (DNS de ${src}); modelo de longitud de mezcla`, FL.mixingChannel(Rt).Ub, v, 0.04);
chk(L, 'péndulo de Foucault en París (48.85° N): periodo 31.8 h', FL.foucaultPeriod(48.85) / 3600, 31.8, 2e-3);
chk(L, 'periodo inercial a 45°: 16.9 h', FL.inertialPeriod(45) / 3600, 16.9, 3e-3);
chk(L, 'ducto cuadrado laminar: f·Re = 56.91 (Shah y London)', 2 / ref.duct, 56.91, 1e-4);
chk(L, 'Ghia et al.: ψ_min(Re = 1000) de la tabla = −0.117929', gh.psiMin[1000], -0.117929, 1e-9);

const out = { fecha: new Date().toISOString().slice(0, 10), ok, bad, rows, versiones: ref.versiones };
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify(out, null, 1));
console.log(`${ok} correctas, ${bad} fallas de ${ok + bad} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
