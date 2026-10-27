module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  for (const a of [5, 30, 60, 90, 120, 170]) T.rel(S, 'péndulo: T/T₀ con amplitud ' + a + '° (scipy.special.ellipk)', C.pendulumRatio(a), R.pend[String(a)], 1e-12);
  T.rel(N, 'péndulo a 60°: media aritmético-geométrica frente a la cuadratura (quad)', C.pendulumRatio(60), R.pend_quad60, 1e-9);
  T.abs(H, 'péndulo: 7.3 % a 60° y 18 % a 90°', 100 * (C.pendulumRatio(60) - 1), 7.3, 0.05);
  T.abs(H, 'péndulo: 18 % a 90°', 100 * (C.pendulumRatio(90) - 1), 18.0, 0.05);
  T.abs(H, 'péndulo: Galileo no detectaba 0.05 % a 5°', 100 * (C.pendulumRatio(5) - 1), 0.048, 0.002);
  C.galileoPunti.forEach((d, i) => T.rel(S, 'folio 116v, intervalo ' + (i + 1) + ': razón con la primera distancia', d / C.galileoPunti[0], R.folio.ratios[i], 1e-12));
  T.ok(H, 'folio 116v: desviación media respecto de n² menor que 0.7 %', R.folio.mean_abs_dev < 0.007);
  T.abs(H, 'folio 116v: exponente del ajuste d ∝ n^p es 2.00', R.folio_exponent, 2.0, 0.02);
  T.rel(S, 'plano inclinado (esfera maciza, 4°): a = g sen θ/(1 + 2/5)', C.inclineAccel(4, true), R.incline_a, 1e-12);
  T.abs(H, 'rodando, g aparente = 5/7 g = 7.0 m/s²', C.inclineAccel(4, true) / Math.sin((4 * Math.PI) / 180), 7.0, 0.01);
  T.abs(H, 'montaña lunar a 1/20 del diámetro: ≈ 8.7 km', C.moonMountain(0.05 * 2 * 1737.4, 1737.4), R.moon_h, 1e-9);
  T.abs(H, 'montaña lunar: más de cuatro millas (6.4 km)', R.moon_h > 6.4 ? 1 : 0, 1, 0);
  C.GALILEAN.forEach((m, i) => T.rel(S, 'tercera ley en las lunas galileanas: ' + m.n, (m.T * m.T) / Math.pow(m.a, 3), R.galilean_k[i], 1e-12));
  T.ok(H, 'T²/a³ constante en las cuatro lunas (dispersión < 0.5 %)', Math.max(...R.galilean_k) / Math.min(...R.galilean_k) < 1.005);
  let kmin = 2, kmax = -1, dmin = 9, dmax = 0, pmin = 2, pmax = -1;
  for (let t = 0; t < 1200; t += 0.5) { const q = C.venusPhase(t, 'cop'), r = C.venusPhase(t, 'pto'); kmin = Math.min(kmin, q.k); kmax = Math.max(kmax, q.k); dmin = Math.min(dmin, q.dist); dmax = Math.max(dmax, q.dist); pmin = Math.min(pmin, r.k); pmax = Math.max(pmax, r.k); }
  T.abs(S, 'Venus (copernicano): fase mínima', kmin, R.venus_cop.kmin, 1e-9);
  T.abs(S, 'Venus (copernicano): fase máxima', kmax, R.venus_cop.kmax, 1e-9);
  T.abs(S, 'Venus (copernicano): distancia mínima', dmin, R.venus_cop.dmin, 1e-9);
  T.abs(S, 'Venus (copernicano): distancia máxima', dmax, R.venus_cop.dmax, 1e-9);
  T.abs(S, 'Venus (copernicano): fase en el día 300', C.venusPhase(300, 'cop').k, R.venus_cop.k300, 1e-12);
  T.ok(H, 'Venus en Ptolomeo: nunca más de la mitad iluminada', pmax < 0.5);
  T.ok(H, 'Venus en Copérnico: fase llena y casi nueva (k > 0.99 y k < 0.01)', kmax > 0.99 && kmin < 0.01);
  T.ok(H, 'Venus: cociente de tamaños aparentes máximo/mínimo ≈ 6 en ambos modelos', Math.abs(dmax / dmin - 6.2) < 0.2);
  T.abs(H, 'Venus en Ptolomeo: elongación máxima 46°', Math.max(...[...Array(2400).keys()].map((i) => C.venusPhase(i * 0.5, 'pto').elong)), 46, 0.1);
};
