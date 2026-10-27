(function (root) {
  'use strict';
  const C = root.EM.calc;
  /* Descubrimientos múltiples: [nombre, primera comunicación independiente, segunda] (años según la literatura; aproximados) */
  C.MULTIPLES = [
    ['Cálculo infinitesimal', 1666, 1675], ['Conservación de la energía (Mayer–Joule)', 1842, 1843], ['Oxígeno (Scheele–Priestley)', 1772, 1774],
    ['Neptuno (Adams–Le Verrier)', 1845, 1846], ['Selección natural (Darwin–Wallace)', 1858, 1858], ['Teléfono (Bell–Gray)', 1876, 1876],
    ['Manchas solares (Galileo–Scheiner)', 1610, 1611], ['Ley de los gases (Boyle–Mariotte)', 1662, 1676], ['Geometría no euclidiana (Lobachevsky–Bolyai)', 1829, 1832],
    ['Tabla periódica (Mendeléyev–Meyer)', 1869, 1869], ['Relatividad (Einstein–Poincaré)', 1905, 1905], ['Fotografía (Daguerre–Talbot)', 1839, 1839],
    ['Inducción (Faraday–Henry)', 1831, 1832], ['Mecanismo de Higgs (tres grupos)', 1964, 1964], ['Quarks (Gell-Mann–Zweig)', 1964, 1964],
    ['J/ψ (Ting–Richter)', 1974, 1974], ['Radio (Marconi–Popov)', 1895, 1895], ['Energía y entropía (Clausius–Thomson)', 1850, 1851]
  ];
  C.gaps = () => C.MULTIPLES.map((m) => m[2] - m[1]);
  C.median = (a) => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : 0.5 * (s[n / 2 - 1] + s[n / 2]); };
  /* n equipos independientes con tasa r por año tras la madurez de la idea: P(las dos primeras llegadas distan menos de w años) = 1 − e^{−(n−1) r w} */
  C.pSimultaneous = (n, r, w) => 1 - Math.exp(-(n - 1) * r * w);
  /* Simulación Monte Carlo con generador sembrado */
  C.simSimultaneous = function (n, r, w, trials, seed) {
    let s = seed >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    let hit = 0;
    for (let k = 0; k < trials; k++) { const t = []; for (let i = 0; i < n; i++) t.push(-Math.log(1 - rnd()) / r); t.sort((a, b) => a - b); if (t[1] - t[0] < w) hit++; }
    return hit / trials;
  };
  /* Ley de Stigler: [ley, nombre usual, primer autor documentado, año] */
  C.STIGLER = [['Teorema de Pitágoras', 'Pitágoras (c. 530 a. C.)', 'Babilonia (c. 1800 a. C.)'], ['Ley de Snell', 'Snell (1621)', 'Ibn Sahl (984)'], ['Ley de Hubble', 'Hubble (1929)', 'Lemaître (1927)'], ['Ecuaciones de Maxwell (4)', 'Maxwell (1865)', 'Heaviside (1884-88)'], ['Transformaciones de Lorentz', 'Lorentz (1904)', 'Voigt (1887), Larmor (1897)'], ['Ley de Boyle', 'Boyle (1662)', 'Towneley y Power (1661)']];
})(typeof window !== 'undefined' ? window : globalThis);
