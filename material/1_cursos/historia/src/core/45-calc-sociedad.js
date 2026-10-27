(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const PI = Math.PI;
  /* Ecuación de Saha para el hidrógeno: n_II n_e / n_I = (2π m_e kT/h²)^{3/2} · (g_II·2/g_I) e^{−13.6 eV/kT}, con g_II = 1, g_I = 2 */
  C.sahaRatio = function (T, ne) {
    const chi = 13.605693 * K.e;
    return (Math.pow((2 * PI * K.me * K.kB * T) / (K.h * K.h), 1.5) * Math.exp(-chi / (K.kB * T))) / ne; /* n_II/n_I */
  };
  C.ionFraction = (T, ne) => { const r = C.sahaRatio(T, ne); return r / (1 + r); };
  /* Población relativa del nivel n = 2 del hidrógeno neutro: g₂/g₁ e^{−10.2 eV/kT} / Z (g₂ = 8, g₁ = 2) */
  C.balmerPop = (T) => { const x = (10.2 * K.e) / (K.kB * T); const p2 = 4 * Math.exp(-x), p3 = 9 / 2 * Math.exp(-(12.09 * K.e) / (K.kB * T)); return p2 / (1 + p2 + p3); };
  /* Intensidad relativa de las líneas de Balmer: átomos neutros × población del nivel n = 2 */
  C.balmerStrength = (T, ne) => (1 - C.ionFraction(T, ne)) * C.balmerPop(T);
  C.balmerPeakT = function (ne) { let best = 0, bt = 0; for (let T = 3000; T <= 30000; T += 10) { const s = C.balmerStrength(T, ne); if (s > best) { best = s; bt = T; } } return bt; };
  /* Teorema de Noether en un movimiento orbital: V = −k/r (+ término ε x que rompe la simetría rotacional).
     Devuelve las series de energía y momento angular con RK4. */
  C.noetherOrbit = function (eps, steps, h) {
    h = h || 0.002; let x = 1, y = 0, vx = 0, vy = 0.9; const out = { t: [], E: [], L: [] };
    const acc = (x, y) => { const r3 = Math.pow(x * x + y * y, 1.5); return [-x / r3 - eps, -y / r3]; };
    const En = () => 0.5 * (vx * vx + vy * vy) - 1 / Math.hypot(x, y) + eps * x, Lz = () => x * vy - y * vx;
    for (let i = 0; i < steps; i++) {
      if (i % 10 === 0) { out.t.push(i * h); out.E.push(En()); out.L.push(Lz()); }
      const [a1x, a1y] = acc(x, y), x2 = x + 0.5 * h * vx, y2 = y + 0.5 * h * vy, vx2 = vx + 0.5 * h * a1x, vy2 = vy + 0.5 * h * a1y;
      const [a2x, a2y] = acc(x2, y2), x3 = x + 0.5 * h * vx2, y3 = y + 0.5 * h * vy2, vx3 = vx + 0.5 * h * a2x, vy3 = vy + 0.5 * h * a2y;
      const [a3x, a3y] = acc(x3, y3), x4 = x + h * vx3, y4 = y + h * vy3, vx4 = vx + h * a3x, vy4 = vy + h * a3y;
      const [a4x, a4y] = acc(x4, y4);
      x += (h / 6) * (vx + 2 * vx2 + 2 * vx3 + vx4); y += (h / 6) * (vy + 2 * vy2 + 2 * vy3 + vy4);
      vx += (h / 6) * (a1x + 2 * a2x + 2 * a3x + a4x); vy += (h / 6) * (a1y + 2 * a2y + 2 * a3y + a4y);
    }
    return out;
  };
  /* Crecimiento de la ciencia (Price 1963): número acumulado de revistas científicas, [año, N] */
  C.JOURNALS = [[1665, 1], [1700, 3], [1750, 10], [1800, 100], [1850, 1000], [1900, 10000], [1950, 100000]];
  C.priceDoubling = () => { const f = C.linfit(C.JOURNALS.map((d) => d[0]), C.JOURNALS.map((d) => Math.log2(d[1]))); return 1 / f.m; };
  /* Premios Nobel de Física hasta 2023: laureados, de ellos mujeres */
  C.NOBEL = { total: 225, women: 5, names: ['Marie Curie (1903)', 'Maria Goeppert-Mayer (1963)', 'Donna Strickland (2018)', 'Andrea Ghez (2020)', 'Anne L’Huillier (2023)'] };
})(typeof window !== 'undefined' ? window : globalThis);
