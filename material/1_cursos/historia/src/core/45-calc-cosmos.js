(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const PI = Math.PI;
  C.MPC = 3.0856775814913673e22; /* m */
  C.GYR = 3.15576e16; /* s */
  /* Datos de Hubble (1929): [galaxia, distancia en Mpc, velocidad en km/s] */
  C.HUBBLE1929 = [['S. Mag.', 0.032, 170], ['L. Mag.', 0.034, 290], ['N6822', 0.214, -130], ['N598', 0.263, -70], ['N221', 0.275, -185], ['N224', 0.275, -220], ['N5457', 0.45, 200], ['N4736', 0.5, 290], ['N5194', 0.5, 270], ['N4449', 0.63, 200], ['N4214', 0.8, 300], ['N3031', 0.9, -30], ['N3627', 0.9, 650], ['N4826', 0.9, 150], ['N5236', 0.9, 500], ['N1068', 1.0, 920], ['N5055', 1.1, 450], ['N7331', 1.1, 500], ['N4258', 1.4, 500], ['N4151', 1.7, 960], ['N4382', 2.0, 500], ['N4472', 2.0, 850], ['N4486', 2.0, 800], ['N4649', 2.0, 1090]];
  C.hubbleAgeGyr = (H0) => (C.MPC / 1000 / H0) / C.GYR; /* H0 en km/s/Mpc */
  /* Cosmología FLRW: E(z) = H/H0 */
  C.Ez = (z, Om, OL, Orad) => { const Ok = 1 - Om - OL - (Orad || 0); return Math.sqrt((Orad || 0) * Math.pow(1 + z, 4) + Om * Math.pow(1 + z, 3) + Ok * Math.pow(1 + z, 2) + OL); };
  C.simpson = (f, a, b, n) => { n = n || 2000; if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; };
  /* Edad del universo en Gyr: (1/H0)∫₀¹ da/(a E(1/a−1)) */
  C.ageGyr = (H0, Om, OL) => C.hubbleAgeGyr(H0) * C.simpson((a) => 1 / (a * C.Ez(1 / a - 1, Om, OL)), 1e-8, 1, 4000);
  /* Distancia de luminosidad (Mpc) */
  C.lumDistMpc = function (z, H0, Om, OL) {
    const dc = ((K.c / 1000) / H0) * C.simpson((x) => 1 / C.Ez(x, Om, OL), 0, z, 800), Ok = 1 - Om - OL;
    let dm = dc;
    if (Ok > 1e-9) { const s = Math.sqrt(Ok), dh = (K.c / 1000) / H0; dm = (dh / s) * Math.sinh((s * dc) / dh); } else if (Ok < -1e-9) { const s = Math.sqrt(-Ok), dh = (K.c / 1000) / H0; dm = (dh / s) * Math.sin((s * dc) / dh); }
    return (1 + z) * dm;
  };
  C.distMod = (dL) => 5 * Math.log10(dL * 1e6 / 10);
  /* Parámetro de deceleración hoy y corrimiento de la transición */
  C.q0 = (Om, OL) => Om / 2 - OL;
  C.zTransition = (Om, OL) => Math.pow((2 * OL) / Om, 1 / 3) - 1;
  /* Fondo cósmico de microondas */
  C.ZETA3 = 1.2020569031595942;
  C.cmbPhotonDensity = (T) => ((2 * C.ZETA3) / (PI * PI)) * Math.pow((K.kB * T) / (K.h / (2 * PI) * K.c), 3); /* m⁻³ */
  C.cmbPeakGHz = (T) => (2.821439372 * K.kB * T) / K.h / 1e9;
  C.cmbEnergyDensity = (T) => ((PI * PI) / 15) * Math.pow(K.kB * T, 4) / Math.pow(K.h / (2 * PI) * K.c, 3); /* J/m³ */
  /* Curvas de rotación: bariones tipo Plummer y halo isotermo */
  C.G = 6.6743e-11; C.MSUN = 1.98847e30; C.KPC = 3.0856775814913673e19;
  C.vPlummer = (rKpc, MMsun, aKpc) => { const r = rKpc * C.KPC, a = aKpc * C.KPC; return Math.sqrt((C.G * MMsun * C.MSUN * r * r) / Math.pow(r * r + a * a, 1.5)) / 1000; };
  C.vHalo = (rKpc, vinf, rcKpc) => vinf * Math.sqrt(Math.max(0, 1 - (rcKpc / rKpc) * Math.atan(rKpc / rcKpc)));
  C.haloMass = (rKpc, vinf, rcKpc) => ((vinf * 1000) * (vinf * 1000) / C.G) * (rKpc - rcKpc * Math.atan(rKpc / rcKpc)) * C.KPC / C.MSUN;
  C.vTotal = (r, M, a, vinf, rc) => Math.sqrt(Math.pow(C.vPlummer(r, M, a), 2) + Math.pow(C.vHalo(r, vinf, rc), 2));
})(typeof window !== 'undefined' ? window : globalThis);
