(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const DEG = Math.PI / 180;
  /* Constantes de la atmósfera y de los líquidos (kg/m³) */
  C.ATM = 101325;
  C.RHO = { mercurio: 13595, agua: 998, aceite: 920, vino: 990 };
  /* Altura de una columna de líquido sostenida por una presión P (Pa) */
  C.columnHeight = (P, rho) => P / (rho * K.g);
  /* Atmósfera isoterma: altura de escala H = RT/(Mg) y presión a una altura h (m) */
  C.scaleHeight = (T) => (8.314462618 * (T || 288.15)) / (0.0289647 * K.g);
  C.pressureAt = (h, P0, T) => (P0 || C.ATM) * Math.exp(-h / C.scaleHeight(T));
  C.altitudeDiff = (p1, p2, T) => C.scaleHeight(T) * Math.log(p1 / p2);
  /* Pascal: prensa hidráulica */
  C.hydraulic = (F1, A1, A2) => (F1 * A2) / A1;
  /* Hemisferios de Magdeburgo: fuerza para separarlos (radio R en m; presión exterior y residual en Pa) */
  C.hemisphereForce = (R, Pout, Pin) => (Pout - Pin) * Math.PI * R * R;
  /* Gilbert: inclinación magnética de un dipolo, tan I = 2 tan(latitud magnética) */
  C.dipAngle = (latDeg) => (Math.atan(2 * Math.tan(latDeg * DEG)) / DEG);
  /* Datos de Boyle (1662): longitud de la columna de aire (pulgadas) y mercurio añadido (pulgadas), con la presión atmosférica de 29 2/16 pulgadas */
  C.BOYLE = {
    A: [48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12],
    B: [0, 1.5, 2 + 13 / 16, 4 + 6 / 16, 6 + 3 / 16, 7 + 14 / 16, 10 + 2 / 16, 12 + 8 / 16, 15 + 1 / 16, 17 + 9 / 16, 21 + 3 / 16, 25 + 3 / 16, 29 + 11 / 16, 32 + 3 / 16, 35 + 3 / 16, 37 + 14 / 16, 41 + 2 / 16, 44 + 3 / 16, 48 + 12 / 16, 53 + 11 / 16, 58 + 2 / 16, 63 + 15 / 16, 71 + 5 / 16, 78 + 11 / 16, 88 + 7 / 16],
    P0: 29 + 2 / 16
  };
  C.boyleFit = function () {
    const n = C.BOYLE.A.length, x = C.BOYLE.A.map((a) => 1 / a), y = C.BOYLE.B.map((b) => b + C.BOYLE.P0);
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    x.forEach((v, i) => { sx += v; sy += y[i]; sxx += v * v; sxy += v * y[i]; });
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - m * sx) / n;
    return { m, b, PV: C.BOYLE.A.map((a, i) => a * y[i]) };
  };
})(typeof window !== 'undefined' ? window : global);
