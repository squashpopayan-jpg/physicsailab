(function (root) {
  'use strict';
  const C = root.EM.calc;
  const PI = Math.PI;
  /* Young: longitudes de onda de 1801-1807, en pulgadas (1 in = 25.4 mm) */
  C.YOUNG_RED_IN = 1 / 36000; C.YOUNG_VIOLET_IN = 1 / 60000; C.INCH = 0.0254;
  /* Intensidad relativa de dos rendijas de ancho a y separación d (Fraunhofer) en el punto y de una pantalla a distancia L */
  C.sinc = (x) => (Math.abs(x) < 1e-12 ? 1 : Math.sin(x) / x);
  C.youngI = function (y, lam, L, d, a) {
    const s = y / L; /* ángulo pequeño */
    const beta = (PI * d * s) / lam, alpha = (PI * a * s) / lam, e = C.sinc(alpha);
    return Math.cos(beta) * Math.cos(beta) * e * e;
  };
  /* Predicción corpuscular: suma de intensidades de cada rendija, sin interferencia */
  C.youngCorpuscular = function (y, lam, L, d, a) {
    const s = y / L, e1 = C.sinc((PI * a * (s - d / (2 * L))) / lam), e2 = C.sinc((PI * a * (s + d / (2 * L))) / lam);
    return 0.5 * (e1 * e1 + e2 * e2);
  };
  C.fringeSpacing = (lam, L, d) => (lam * L) / d;
  /* Integrales de Fresnel C(v), S(v) con la regla de Simpson */
  C.fresnelCS = function (v) {
    const n = Math.max(200, 2 * Math.ceil(Math.abs(v) * 400)), h = v / n;
    let c = 0, s = 0;
    for (let i = 0; i <= n; i++) {
      const t = i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2, ph = (PI * t * t) / 2;
      c += w * Math.cos(ph); s += w * Math.sin(ph);
    }
    return { C: (c * h) / 3, S: (s * h) / 3 };
  };
  /* Borde recto: I/I0 con v = y·sqrt(2/(λz)) (y > 0 en la zona iluminada) */
  C.edgeI = function (v) {
    const f = C.fresnelCS(v);
    return 0.5 * ((f.C + 0.5) * (f.C + 0.5) + (f.S + 0.5) * (f.S + 0.5));
  };
  /* J0 (Abramowitz–Stegun, tipo Numerical Recipes) */
  C.bessJ0 = function (x) {
    const ax = Math.abs(x);
    if (ax < 8) {
      const y = x * x;
      const a1 = 57568490411.0 + y * (-13362590354.0 + y * (651619640.7 + y * (-11214424.18 + y * (77392.33017 + y * -184.9052456))));
      const a2 = 57568490411.0 + y * (1029532985.0 + y * (9494680.718 + y * (59272.64853 + y * (267.8532712 + y))));
      return a1 / a2;
    }
    const z = 8 / ax, y = z * z, xx = ax - 0.785398164;
    const a1 = 1 + y * (-0.1098628627e-2 + y * (0.2734510407e-4 + y * (-0.2073370639e-5 + y * 0.2093887211e-6)));
    const a2 = -0.1562499995e-1 + y * (0.1430488765e-3 + y * (-0.6911147651e-5 + y * (0.7621095161e-6 - y * 0.934935152e-7)));
    return Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * a1 - z * Math.sin(xx) * a2);
  };
  /* Disco opaco de radio a (unidad de longitud) iluminado con haz gaussiano de cintura w = wr·a.
     F = a²/(λz) es el número de Fresnel; q = ρ/a. Devuelve I/I0 en el eje del haz incidente. */
  C.poissonI = function (q, F, wr, du) {
    du = du || 0.004;
    const umax = 3.2 * wr, n = 2 * Math.ceil((umax - 1) / du / 2), h = (umax - 1) / n;
    let re = 0, im = 0;
    for (let i = 0; i <= n; i++) {
      const u = 1 + i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2, E = Math.exp(-(u * u) / (wr * wr)), ph = PI * F * u * u, j = C.bessJ0(2 * PI * F * q * u);
      re += w * E * j * u * Math.cos(ph); im += w * E * j * u * Math.sin(ph);
    }
    re *= h / 3; im *= h / 3;
    /* U = (2πF/i)·(re + i·im) = 2πF·(im − i·re) */
    const Ur = 2 * PI * F * im, Ui = -2 * PI * F * re;
    return Ur * Ur + Ui * Ui;
  };
  /* Cerrado en el eje: ρ = 0 con iluminación gaussiana */
  C.poissonAxisExact = function (F, wr) {
    const sr = 1 / (wr * wr), si = -PI * F; /* s = sr + i·si, con e^{-s u²} */
    const mod2 = sr * sr + si * si, ex = Math.exp(-2 * sr);
    return ((2 * PI * F) * (2 * PI * F) * ex) / (4 * mod2);
  };
  /* Foucault: desviación de la imagen en el espejo giratorio */
  C.foucaultShift = (rps, D, Rs, c) => (4 * 2 * PI * rps * D * Rs) / (c || C.CLIGHT);
  C.cFromFoucault = (rps, D, Rs, shift) => (4 * 2 * PI * rps * D * Rs) / shift;
  /* Rejilla de difracción: d sen θ = m λ */
  C.gratingAngle = (m, lam, d) => (Math.abs((m * lam) / d) <= 1 ? Math.asin((m * lam) / d) : NaN);
  C.resolvingPower = (N, m) => N * m;
  C.dMinResolved = (lam, N, m) => lam / (N * m);
  /* Líneas espectrales (nm en el aire): [elemento, nombre, λ] */
  C.LINES = [
    ['H', 'Hα (C)', 656.279], ['H', 'Hβ (F)', 486.135], ['H', 'Hγ', 434.047], ['H', 'Hδ', 410.174],
    ['Na', 'D₂', 588.995], ['Na', 'D₁', 589.592],
    ['He', 'He', 587.562], ['He', 'He', 501.568], ['He', 'He', 667.815],
    ['Hg', 'Hg', 404.656], ['Hg', 'Hg', 435.833], ['Hg', 'Hg', 546.074], ['Hg', 'Hg', 576.960], ['Hg', 'Hg', 579.066]
  ];
  /* Longitud de onda de Young desde sus pulgadas, en nm */
  C.youngNm = (inch) => inch * C.INCH * 1e9;
  /* Hα desde la fórmula de Rydberg con masa reducida del protón, en nm (vacío) */
  C.halphaVacuum = (Rinf, meOverMp) => 1e9 / ((Rinf / (1 + meOverMp)) * (1 / 4 - 1 / 9));
})(typeof window !== 'undefined' ? window : globalThis);
