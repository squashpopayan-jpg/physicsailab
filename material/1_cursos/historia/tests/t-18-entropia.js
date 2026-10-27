module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  /* Colisiones: conservación */
  const rng = C.rng(4); let V = []; for (let i = 0; i < 800; i++) { const v = i % 2 ? 0.4 : 1.6, th = rng() * 2 * Math.PI; V.push([v * Math.cos(th), v * Math.sin(th)]); }
  const E0 = V.reduce((s, q) => s + q[0] * q[0] + q[1] * q[1], 0), p0 = V.reduce((s, q) => [s[0] + q[0], s[1] + q[1]], [0, 0]);
  for (let k = 0; k < 200000; k++) { const a = Math.floor(rng() * 800); let b = Math.floor(rng() * 800); if (a === b) b = (b + 1) % 800; const r = C.collide2D(V[a], V[b], rng() * 2 * Math.PI); V[a] = r[0]; V[b] = r[1]; }
  const E1 = V.reduce((s, q) => s + q[0] * q[0] + q[1] * q[1], 0), p1 = V.reduce((s, q) => [s[0] + q[0], s[1] + q[1]], [0, 0]);
  T.rel(N, 'colisiones elásticas: la energía total se conserva (200 000 colisiones)', E1, E0, 1e-12);
  T.abs(N, 'colisiones elásticas: el momento total se conserva', Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 0, 1e-9);
  const s2 = E1 / (2 * 800);
  const sorted = V.map((q) => Math.hypot(q[0], q[1])).sort((a, b) => a - b); let ks = 0; sorted.forEach((v, i) => { const F = C.maxwell2Dcdf(v, s2); ks = Math.max(ks, Math.abs((i + 1) / 800 - F), Math.abs(i / 800 - F)); });
  T.ok(N, 'relajación: la rapidez de 800 partículas se acerca a la distribución de Maxwell 2D (KS < 0.05)', ks < 0.05);
  T.abs(S, 'Maxwell 2D (Rayleigh de scipy): f(1) con kT/m = 0.5', C.maxwell2D(1.0, 0.5), R.rayleigh.pdf1, 1e-12);
  T.abs(S, 'Maxwell 2D: función de distribución F(1)', C.maxwell2Dcdf(1.0, 0.5), R.rayleigh.cdf1, 1e-12);
  for (const n of [0, 5, 20, 33]) T.abs(S, 'ln C(40, ' + n + ') (gammaln)', C.lnBinom(40, n), R.lnbinom[String(n)], 1e-9);
  T.abs(H, 'entropía de 20 bolas: S/k de «10 y 10» = 12.12 (184 756 microestados)', C.lnBinom(20, 10), R.lnbinom_20_10, 1e-9);
  T.abs(H, 'C(20,10) = 184 756', Math.exp(C.lnBinom(20, 10)), 184756, 0.5);
  const er = C.rng(8); let n = 40, sum = 0, sum2 = 0, cnt = 0; for (let i = 0; i < 400000; i++) { n = C.ehrenfestStep(n, 40, er); if (i > 1000) { sum += n; sum2 += n * n; cnt++; } }
  T.abs(S, 'urna de Ehrenfest: media estacionaria (numpy)', sum / cnt, R.ehr.mean, 0.15);
  T.abs(H, 'urna de Ehrenfest: media N/2 y varianza N/4 (binomial)', sum2 / cnt - (sum / cnt) ** 2, 10, 0.6);
  T.abs(S, 'Perrin: altura de escala (m)', C.perrinScale(0.212, 206, 293), R.perrin.hs, 1e-9);
  T.rel(S, 'Perrin: N_A deducido con la altura exacta', C.perrinNA(0.212, 206, 293, R.perrin.hs), R.perrin.NA_exact, 1e-7);
  T.abs(H, 'Perrin: la concentración cae a la mitad cada ≈ 35 µm', C.perrinScale(0.212, 206, 293) * Math.LN2 * 1e6, 34.8, 0.3);
  T.abs(S, 'Kelvin 1862: edad (millones de años)', C.kelvinAge(3900, 0.0365, 1.18e-6) / C.YEAR / 1e6, R.kelvin, 1e-9);
  T.abs(H, 'Kelvin 1862: 98 millones de años', R.kelvin, 98, 1);
  T.abs(H, 'Kelvin: la edad real es ≈ 46 veces mayor', 4550 / R.kelvin, 46.4, 0.5);
  T.rel(S, 'límite de Landauer a 300 K (J)', C.landauer(300), R.landauer, 1e-12);
  T.abs(H, 'Landauer: 2.87×10⁻²¹ J por bit a 300 K', R.landauer * 1e21, 2.87, 0.01);
};
