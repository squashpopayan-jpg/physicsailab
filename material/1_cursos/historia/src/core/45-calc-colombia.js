(function (root) {
  'use strict';
  const C = root.EM.calc;
  const PI = Math.PI, RAD = PI / 180;
  /* Atmósfera estándar: presión (Pa) a la altura h (m) */
  C.pStd = (h) => 101325 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
  C.hFromP = (p) => (1 - Math.pow(p / 101325, 1 / 5.25588)) / 2.25577e-5;
  /* Temperatura de ebullición del agua (°C) a la presión p (Pa): ecuación de Antoine (dominio 1–100 °C) */
  C.tBoil = (p) => 1730.63 / (8.07131 - Math.log10(p / 133.322368)) - 233.426;
  C.pVapor = (T) => 133.322368 * Math.pow(10, 8.07131 - 1730.63 / (233.426 + T));
  /* Hipsómetro de Caldas: altura a partir de la temperatura de ebullición */
  C.hypsoHeight = (Tb) => C.hFromP(C.pVapor(Tb));
  /* Declinación solar (Spencer, 1971) y alturas del Sol al mediodía */
  C.solarDecl = (day) => { const g = (2 * PI * (day - 1)) / 365; return (0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)) / RAD; };
  C.noonAlt = (latDeg, day) => 90 - Math.abs(latDeg - C.solarDecl(day));
  /* Días del año en que el Sol pasa por el cenit a la latitud lat (|lat| < 23.44) */
  C.zenithDays = function (lat) { const out = []; for (let d = 1; d <= 365; d++) { const a = C.noonAlt(lat, d), b = C.noonAlt(lat, d + 1); if (Math.abs(C.solarDecl(d) - lat) < 0.2 && C.solarDecl(d) !== lat) out.push(d); } return out; };
  /* Latitud a partir de la altura meridiana del Sol y su declinación */
  C.latFromSun = (altDeg, declDeg) => 90 - altDeg + declDeg;
  /* Lugares: [nombre, latitud, longitud (oeste positivo), altura (m)] */
  C.PLACES = [['Popayán', 2.4419, 76.6061, 1738], ['Bogotá', 4.711, 74.0721, 2640], ['Quito', -0.1807, 78.4678, 2850], ['Cumbal (volcán)', 0.9547, 77.8805, 4764], ['Chimborazo', -1.4692, 78.8175, 6263], ['Mocoa', 1.1478, 76.6472, 600]];
})(typeof window !== 'undefined' ? window : globalThis);
