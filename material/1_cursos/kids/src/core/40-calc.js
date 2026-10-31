/* ===================================================================
   40-calc.js — cálculos de física puros (se prueban en tests/run.js)
   Cada capítulo añade aquí las funciones que sus simulaciones usan.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const FK = (root.FK = root.FK || {});
  const C = (FK.calc = FK.calc || {});

  /* gravedad en la superficie (m/s²) */
  C.GRAV = { tierra: 9.8, luna: 1.62, marte: 3.71, jupiter: 24.79, venus: 8.87, mercurio: 3.7, saturno: 10.44, urano: 8.87, neptuno: 11.15, pluton: 0.62, sol: 274 };

  /* ---- Caída con resistencia del aire: a = g (1 − (v/vt)²). vt = velocidad terminal (Infinity = sin aire) ---- */
  C.stepFall = function (s, dt, g, vt) {
    const a = g * (1 - (isFinite(vt) ? (s.v * s.v) / (vt * vt) : 0));
    const v2 = s.v + a * dt;
    s.y += 0.5 * (s.v + v2) * dt; s.v = v2;
    return s;
  };
  /* Tiempo para caer h metros, integrando paso a paso */
  C.dropRun = function (h, g, vt, dt = 1 / 480) {
    const s = { y: 0, v: 0 };
    let t = 0;
    while (s.y < h && t < 600) {
      const y0 = s.y, v0 = s.v;
      C.stepFall(s, dt, g, vt);
      if (s.y >= h) { const f = (h - y0) / (s.y - y0); t += dt * f; s.v = v0 + (s.v - v0) * f; s.y = h; break; }
      t += dt;
    }
    return { t, v: s.v };
  };
  /* Solución exacta: t = (vt/g) acosh(exp(g h / vt²)) */
  C.fallTimeExact = function (h, g, vt) {
    if (!isFinite(vt)) return Math.sqrt((2 * h) / g);
    return (vt / g) * Math.acosh(Math.exp((g * h) / (vt * vt)));
  };

  /* ---- Tiro parabólico sin aire ---- */
  C.range = (v, th, g) => (v * v * Math.sin(2 * th)) / g;
  C.apex = (v, th, g) => Math.pow(v * Math.sin(th), 2) / (2 * g);
  C.flightTime = (v, th, g) => (2 * v * Math.sin(th)) / g;

  /* ---- Fuerzas ---- */
  /* Retroceso al lanzar una bola de masa m con rapidez relativa w desde un cuerpo de masa M (conserva el momento) */
  C.recoil = (M, m, w) => (m * w) / (M + m);
  /* Aceleración de un bloque en una rampa de ángulo th con rozamiento mu (0 si se queda quieto) */
  C.rampAcc = (th, mu, g = 9.8) => Math.max(0, g * (Math.sin(th) - mu * Math.cos(th)));
  C.critAngle = (mu) => Math.atan(mu);
  /* Distancia de frenado y de reacción */
  C.brakeDist = (v, mu, g = 9.8) => (v * v) / (2 * mu * g);

  /* ---- Energía ---- */
  /* Altura máxima sobre el punto de salida de una bola lanzada por un resorte comprimido x (se parte de -x) */
  C.springHeight = (k, x, m, g = 9.8) => (k * x * x) / (2 * m * g) - x;
  /* Rapidez en un punto de la montaña rusa sin fricción */
  C.coasterSpeed = (h0, h, g = 9.8) => Math.sqrt(Math.max(0, 2 * g * (h0 - h)));

  /* ---- Rotación: se conserva L = I w; I = I0 + k r² ---- */
  C.skaterOmega = (L, I0, k, r) => L / (I0 + k * r * r);

  /* ---- Choques en una dimensión (b en reposo o con velocidad vb) ---- */
  C.collide1D = (ma, va, mb, vb) => [((ma - mb) * va + 2 * mb * vb) / (ma + mb), ((mb - ma) * vb + 2 * ma * va) / (ma + mb)];
  C.stick1D = (ma, va, mb, vb) => { const v = (ma * va + mb * vb) / (ma + mb); return [v, v]; };

  /* ---- Fluidos ---- */
  C.floats = (rhoObj, rhoLiq) => rhoObj < rhoLiq;
  C.submerged = (rhoObj, rhoLiq) => Math.min(1, rhoObj / rhoLiq);
  /* Calado de un casco de área A (m²) con masa total m (kg) en agua de densidad rho (kg/m³) */
  C.draft = (m, rho, A) => m / (rho * A);
  /* Gotas que aguanta una moneda: proporcional a la tensión superficial (72 mN/m agua, ~30 con jabón) */
  C.dropCapacity = (jabon) => (jabon ? 12 : 28);

  /* Alcance horizontal de un chorro (Torricelli) que sale a profundidad y de un tanque en una mesa de altura tab, con agua a lvl */
  C.jetSpeed = (y, g = 9.8) => Math.sqrt(2 * g * y);
  C.jetRange = (y, tab, lvl, g = 9.8) => C.jetSpeed(y, g) * Math.sqrt((2 * (tab + lvl - y)) / g);
  /* Presión (atm) a profundidad d (m) en agua dulce */
  C.waterPressure = (d) => 1 + (1000 * 9.8 * d) / 101325;
  /* Presión del aire (kPa) a altura h (m): atmósfera estándar */
  C.airPressure = (h) => 101.325 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
  /* Punto de ebullición del agua (°C) a presión p (kPa): ecuación de Antoine (1–100 °C) */
  C.boilingPoint = (p) => 1730.63 / (8.07131 - Math.log10(p * 7.50062)) - 233.426;

  /* ---- Vuelo ---- */
  /* Coeficiente de sustentación de un ala curva: sube con el ángulo (°) hasta 15° y luego entra en pérdida */
  C.wingCL = (a) => (a <= 15 ? 0.3 + 0.1 * a : Math.max(0.5, 1.8 - 0.25 * (a - 15)));
  C.wingLift = (v, a, S, rho = 1.2) => 0.5 * rho * v * v * S * C.wingCL(a);
  /* Rapidez terminal: peso = resistencia del aire */
  C.terminalSpeed = (m, A, Cd, rho = 1.2) => Math.sqrt((2 * m * 9.8) / (rho * Cd * A));
  /* Empuje neto de un globo de aire caliente (N): volumen V, masa total m, aire de afuera Tout, adentro Tin (°C) */
  C.balloonNet = (V, m, Tout, Tin, rhoOut = 1.2) => { const rin = (rhoOut * (Tout + 273.15)) / (Tin + 273.15); return (rhoOut - rin) * V * 9.8 - m * 9.8; };

  /* ---- Calor ---- */
  C.c2f = (c) => (c * 9) / 5 + 32;
  C.c2k = (c) => c + 273.15;
  C.f2c = (f) => ((f - 32) * 5) / 9;
  /* Temperatura final al mezclar dos masas de agua (m1 a T1, m2 a T2) */
  C.mixTemp = (m1, T1, m2, T2) => (m1 * T1 + m2 * T2) / (m1 + m2);
  /* Camiseta al sol: absorbe una fracción a de la radiación; se calienta hacia Teq con constante de 4 min */
  C.shirtTemp = (a, min, T0 = 28) => { const Teq = T0 + 38 * a; return Teq - (Teq - T0) * Math.exp(-min / 4); };

  /* Curva de calentamiento de m gramos de agua que empieza como hielo a −20 °C (J). c_hielo 2,1; fusión 334 J/g; c_agua 4,18; vaporización 2260 J/g; c_vapor 2,0 */
  C.heatCurve = (Q, m = 100) => {
    const Q1 = m * 2.1 * 20, Q2 = m * 334, Q3 = m * 4.18 * 100, Q4 = m * 2260, Q5 = m * 2.0 * 20, tot = Q1 + Q2 + Q3 + Q4 + Q5;
    if (Q <= Q1) return { T: -20 + Q / (m * 2.1), phase: 'hielo', frac: 0, Qtotal: tot };
    if (Q <= Q1 + Q2) return { T: 0, phase: 'derrite', frac: (Q - Q1) / Q2, Qtotal: tot };
    if (Q <= Q1 + Q2 + Q3) return { T: (Q - Q1 - Q2) / (m * 4.18), phase: 'agua', frac: 0, Qtotal: tot };
    if (Q <= Q1 + Q2 + Q3 + Q4) return { T: 100, phase: 'hierve', frac: (Q - Q1 - Q2 - Q3) / Q4, Qtotal: tot };
    return { T: 100 + Math.min(Q - Q1 - Q2 - Q3 - Q4, Q5) / (m * 2.0), phase: 'vapor', frac: 1, Qtotal: tot };
  };
  /* Máquinas de calor: límite de Carnot (temperaturas en kelvin) */
  C.carnot = (Th, Tc) => 1 - Tc / Th;

  /* ---- Vaivenes ---- */
  C.pendulumPeriod = (L, g = 9.8) => 2 * Math.PI * Math.sqrt(L / g);
  C.springPeriod = (m, k) => 2 * Math.PI * Math.sqrt(m / k);
  C.hookeExt = (m, k, g = 9.8) => (m * g) / k;

  /* ---- Ondas ---- */
  C.waveSpeed = (f, lam) => f * lam;
  /* Líneas nodales entre dos fuentes en fase separadas d, longitud de onda lam */
  C.nodalLines = (d, lam) => 2 * Math.floor(d / lam + 0.5);
  /* Frecuencias de una cuerda fija en ambos extremos */
  C.stringMode = (n, v, L) => (n * v) / (2 * L);

  /* ---- Sonido ---- */
  C.VSOUND = 343;
  C.logFreq = (s) => 20 * Math.pow(1000, s / 100); /* 0..100 → 20 Hz..20 kHz */
  C.echoTime = (d) => (2 * d) / C.VSOUND;
  C.echoDist = (t) => (C.VSOUND * t) / 2;
  /* Fuente que se mueve: vr = componente de su velocidad hacia el oyente (m/s, negativo si se aleja) */
  C.dopplerSource = (f0, vr) => (f0 * C.VSOUND) / (C.VSOUND - vr);
  C.thunderKm = (s) => s / 3;

  /* ---- Música ---- */
  /* Frecuencia fundamental de una cuerda: largo L (m), tensión T (N), masa por metro mu (kg/m) */
  C.stringFreq = (L, T, mu) => Math.sqrt(T / mu) / (2 * L);
  /* Botella soplada: columna de aire Lair (m), tubo cerrado en un extremo con corrección de borde */
  C.bottleFreq = (Lair) => C.VSOUND / (4 * (Lair + 0.009));
  C.noteName = (f) => {
    const midi = Math.round(69 + 12 * Math.log2(f / 440)), N = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
    return N[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
  };

  /* ---- Luz ---- */
  C.VLIGHT = 299792458;
  /* Altura de la sombra en una pared a distancia wall de la linterna, con un objeto de altura h a distancia d (triángulos semejantes) */
  C.shadowHeight = (h, d, wall) => (h * wall) / d;
  /* Cámara oscura: objeto de alto H a distancia O (cm), pantalla a s (cm), agujero de a (cm). Imagen invertida de alto H s/O; mancha a (1 + s/O) */
  C.pinhole = (H, O, s, a) => ({ h: (H * s) / O, blur: a * (1 + s / O), bright: Math.pow(a / 1.2, 2) });

  /* Reflexión de un rayo con dirección d sobre una superficie de normal unitaria n */
  C.reflect = (d, n) => { const k = 2 * (d[0] * n[0] + d[1] * n[1]); return [d[0] - k * n[0], d[1] - k * n[1]]; };
  /* Distancia t a la que un rayo (p, d) cruza un segmento [x1,y1,x2,y2]; null si no lo cruza */
  C.raySegment = (p, d, s) => {
    const sx = s[2] - s[0], sy = s[3] - s[1], den = d[0] * sy - d[1] * sx;
    if (Math.abs(den) < 1e-12) return null;
    const t = ((s[0] - p[0]) * sy - (s[1] - p[1]) * sx) / den, u = ((s[0] - p[0]) * d[1] - (s[1] - p[1]) * d[0]) / den;
    return t > 0 && u >= 0 && u <= 1 ? t : null;
  };
  C.rayCircle = (p, d, c, r) => {
    const fx = p[0] - c[0], fy = p[1] - c[1], b = fx * d[0] + fy * d[1], cc = fx * fx + fy * fy - r * r, disc = b * b - cc;
    if (disc < 0) return null; const t = -b - Math.sqrt(disc); return t > 0 ? t : null;
  };
  /* Espejo esférico: distancia a la imagen (+ real, − virtual) con foco f (+ cóncavo, − convexo) y objeto a o */
  C.mirrorImage = (f, o) => (Math.abs(o - f) < 1e-9 ? 1e9 : 1 / (1 / f - 1 / o));

  /* Ley de Snell: ángulo de refracción (rad) o NaN si hay reflexión total */
  C.snell = (n1, th1, n2) => { const x = (n1 * Math.sin(th1)) / n2; return Math.abs(x) > 1 ? NaN : Math.asin(x); };
  C.criticalAngle = (n1, n2) => Math.asin(n2 / n1);
  /* Ángulo (desde la vertical, en el aire) con que un láser a altura he llega a un pez a distancia horizontal dx y profundidad df */
  C.aimAtFish = (he, dx, df, n = 1.33) => {
    let lo = 0.001, hi = Math.PI / 2 - 0.001;
    const x = (t) => he * Math.tan(t) + df * Math.tan(Math.asin(Math.sin(t) / n));
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (x(m) < dx) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  /* Lente delgada: distancia a la imagen (+ real, − virtual); f > 0 convergente */
  C.lensImage = (f, o) => (Math.abs(o - f) < 1e-9 ? 1e9 : 1 / (1 / f - 1 / o));
  /* Ojo: distancia focal (mm) para un objeto lejano con potencia total P (dioptrías) */
  C.eyeFocusMm = (P) => 1000 / P;

  /* ---- Color ---- */
  /* Índice de refracción del vidrio crown (Cauchy) para longitud de onda nm */
  C.cauchy = (nm) => 1.5046 + 0.0042 / Math.pow(nm / 1000, 2);
  /* Refracción vectorial 2D: d unitario incidente, nOut normal de la superficie (cualquier sentido), de n1 a n2; null si reflexión total */
  C.refractVec = (d, nOut, n1, n2) => {
    let n = nOut, cosi = -(n[0] * d[0] + n[1] * d[1]);
    if (cosi < 0) { n = [-n[0], -n[1]]; cosi = -cosi; }
    const r = n1 / n2, k = 1 - r * r * (1 - cosi * cosi);
    if (k < 0) return null;
    const a = r * cosi - Math.sqrt(k);
    return [r * d[0] + a * n[0], r * d[1] + a * n[1]];
  };
  /* Masa de aire atravesada por la luz del Sol a altura e (grados): Kasten–Young */
  C.airmass = (e) => 1 / (Math.sin((e * Math.PI) / 180) + 0.50572 * Math.pow(e + 6.07995, -1.6364));
  /* Transmitancia del aire (rojo, verde, azul) para el Sol a altura e: dispersión de Rayleigh ∝ 1/λ⁴ */
  C.sunTransmit = (e, k = 0.1) => [610, 550, 465].map((l) => Math.exp(-k * Math.pow(550 / l, 4) * C.airmass(e)));

  /* ---- Electricidad ---- */
  C.K_COULOMB = 8.9875e9;
  C.coulomb = (q1, q2, r) => (C.K_COULOMB * q1 * q2) / (r * r);
  C.thunderSeconds = (km) => (km * 1000) / C.VSOUND;

  C.ohmI = (V, R) => V / R;
  C.powerW = (V, I) => V * I;
  /* Brillo relativo de un bombillo de tensión nominal nom (V) alimentado con V voltios: P/Pnom = (V/nom)² */
  C.bulbBrightness = (V, nom) => Math.pow(V / nom, 2);
  C.seriesV = (n, v = 1.5) => n * v;

  /* ---- Magnetismo ---- */
  C.magnetForce = (d) => 1 / (d * d); /* relativa; d en unidades de longitud del imán */
  /* Inclinación magnética de un dipolo (modelo de imán simple): tan I = 2 tan φ; φ en grados → I en grados */
  C.dipAngle = (latDeg) => { const p = (latDeg * Math.PI) / 180; return (Math.atan2(2 * Math.sin(p), Math.cos(p)) * 180) / Math.PI; };

  /* ---- Electromagnetismo ---- */
  C.coilCurrent = (V, R) => V / R;
  /* clips levantados por un electroimán: crece con los amperios-vuelta */
  C.clipsLifted = (N, I) => Math.min(12, Math.floor((N * I) / 9));
  C.dynamoEMF = (N, f, ang) => 0.025 * N * f * Math.sin(ang);
  C.dynamoRMS = (N, f) => (0.025 * N * f) / Math.SQRT2;
  /* Voltaje de una línea (V) con escala logarítmica de 1 kV a 500 kV */
  C.lineVoltage = (s) => 1000 * Math.pow(500, s / 100);
  /* Pérdidas en una línea: potencia P (W), voltaje V, resistencia R */
  C.lineLoss = (P, V, R) => Math.pow(P / V, 2) * R;
  C.transformerV2 = (V1, N1, N2) => (V1 * N2) / N1;

  /* ---- Astronomía: día, estaciones, Luna ---- */
  /* Declinación del Sol (°) el día d del año (0 = 1 de enero) */
  C.sunDeclination = (d) => 23.44 * Math.sin((2 * Math.PI * (d - 80)) / 365);
  /* Duración del día (horas) a latitud lat (°) con declinación dec (°) */
  C.dayLength = (lat, dec) => {
    const x = -Math.tan((lat * Math.PI) / 180) * Math.tan((dec * Math.PI) / 180);
    if (x >= 1) return 0; if (x <= -1) return 24;
    return (24 / Math.PI) * Math.acos(x);
  };
  C.dateName = (d) => { const M = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], L = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let k = Math.round(d); for (let i = 0; i < 12; i++) { if (k < L[i]) return (k + 1) + ' ' + M[i]; k -= L[i]; } return '31 dic'; };
  /* Fase de la Luna: a = ángulo de elongación (0° nueva, 180° llena) */
  C.moonIllum = (a) => (1 - Math.cos((a * Math.PI) / 180)) / 2;
  C.phaseName = (a) => { a = ((a % 360) + 360) % 360; return a < 20 || a >= 340 ? 'Luna nueva' : a < 70 ? 'Creciente' : a < 110 ? 'Cuarto creciente' : a < 160 ? 'Gibosa creciente' : a < 200 ? 'Luna llena' : a < 250 ? 'Gibosa menguante' : a < 290 ? 'Cuarto menguante' : 'Menguante'; };
  C.SYNODIC = 29.53;

  /* ---- Sistema solar ---- */
  C.GM_EARTH = 398600.4418; /* km³/s² */
  C.circularV = (r) => Math.sqrt(C.GM_EARTH / r); /* km/s, r en km desde el centro de la Tierra */
  C.escapeV = (r) => Math.sqrt((2 * C.GM_EARTH) / r);
  C.orbitPeriod = (r) => 2 * Math.PI * Math.sqrt((r * r * r) / C.GM_EARTH); /* s */
  C.keplerYears = (a) => Math.pow(a, 1.5);

  /* ---- Estrellas ---- */
  C.starMass = (s) => 0.1 * Math.pow(600, s / 100); /* 0..100 → 0,1..60 masas solares */
  C.starTemp = (m) => Math.min(45000, Math.max(2500, 5772 * Math.pow(m, 0.475)));
  C.starRadius = (m) => Math.pow(m, 0.8);
  C.starLife = (m) => 1e10 * Math.pow(m, -2.5);
  C.starFate = (m) => {
    if (m < 0.5) return { id: 'wd0', name: 'Enana blanca (¡dentro de billones de años!)', msg: '', stages: ['Nebulosa de gas', 'Enana roja: billones de años', 'Se apaga muy despacio', 'Enana blanca de helio'] };
    if (m < 8) return { id: 'wd', name: 'Enana blanca', msg: 'Una estrella como el Sol se hincha como gigante roja, suelta sus capas formando una nebulosa y deja una enana blanca.', stages: ['Nebulosa de gas', 'Secuencia principal (hidrógeno)', 'Gigante roja', 'Nebulosa planetaria', 'Enana blanca'] };
    if (m < 20) return { id: 'ns', name: 'Estrella de neutrones', msg: '¡Una estrella grande explota como supernova! Su centro se aplasta en una estrella de neutrones: una cucharadita pesaría miles de millones de toneladas.', stages: ['Nebulosa de gas', 'Secuencia principal', 'Supergigante roja', '¡Supernova!', 'Estrella de neutrones'] };
    return { id: 'bh', name: 'Agujero negro', msg: '¡Una estrella gigantesca explota y su centro se hunde en un agujero negro! Ni la luz puede escapar de su gravedad.', stages: ['Nebulosa de gas', 'Secuencia principal (muy corta)', 'Supergigante', '¡Supernova!', 'Agujero negro'] };
  };
  /* Color aproximado de un cuerpo negro (Tanner Helland) para T en kelvin */
  C.starColor = (T) => {
    const t = Math.min(40000, Math.max(1000, T)) / 100, cl = (x) => Math.max(0, Math.min(255, Math.round(x)));
    const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return '#' + [r, g, b].map((v) => cl(v).toString(16).padStart(2, '0')).join('');
  };

  /* Ley de Hubble: H0 = 70 km/s por megaparsec = 21,5 km/s por millón de años luz */
  C.hubble = (dMly) => (70 / 3.2616) * dMly;
  C.lightYearKm = 9.4607e12;
  C.lookback = (ly) => ly; /* años que tarda la luz = distancia en años luz */

  /* ---- Cohetes ---- */
  /* Ecuación de Tsiolkovski */
  C.rocketDV = (ve, m0, mf) => ve * Math.log(m0 / mf);
  /* Δv total de n etapas iguales: fracción de estructura eps (de cada etapa), carga útil pl (fracción de la masa inicial), gases a ve */
  C.stagingDV = (n, eps, pl, ve) => { const lam = Math.pow(pl, 1 / n), R = 1 / (lam + eps * (1 - lam)); return n * ve * Math.log(R); };

  /* ---- Átomos ---- */
  /* [símbolo, nombre, tipo, cómo es, color] para Z = 1..20 */
  C.ELEMENTS = [null,
    ['H', 'Hidrógeno', 'gas', 'El más simple y abundante del universo. Con oxígeno forma el agua; el Sol lo funde para brillar.', '#BFE9FF'],
    ['He', 'Helio', 'gas noble', 'Más liviano que el aire: llena los globos. Se descubrió en el Sol antes que en la Tierra.', '#FFD6E3'],
    ['Li', 'Litio', 'metal', 'El metal más ligero. Está en las baterías de celulares y carros eléctricos.', '#FFE0B3'],
    ['Be', 'Berilio', 'metal', 'Un metal rígido y liviano; se usa en los espejos del telescopio James Webb.', '#FFE0B3'],
    ['B', 'Boro', 'metaloide', 'Se usa en el vidrio resistente al calor (como el de los recipientes de laboratorio).', '#D9F6F2'],
    ['C', 'Carbono', 'no metal', 'La base de la vida. Forma el diamante, el grafito del lápiz y todas las moléculas de los seres vivos.', '#D6F5E6'],
    ['N', 'Nitrógeno', 'gas', 'Es el 78 % del aire que respiras. También está en tu ADN y en las proteínas.', '#D6F5E6'],
    ['O', 'Oxígeno', 'gas', 'El 21 % del aire. Lo respiras y hace posible el fuego. Está en el agua y en casi todas las rocas.', '#D6F5E6'],
    ['F', 'Flúor', 'gas', 'Está en la crema dental y protege los dientes. Es el elemento más reactivo.', '#FFF3CC'],
    ['Ne', 'Neón', 'gas noble', 'Hace brillar de rojo-naranja los letreros luminosos.', '#FFD6E3'],
    ['Na', 'Sodio', 'metal', 'Con el cloro forma la sal de cocina. Es un metal tan blando que se corta con un cuchillo.', '#FFE0B3'],
    ['Mg', 'Magnesio', 'metal', 'Arde con una luz blanca muy brillante. Está en la clorofila de las plantas.', '#FFE0B3'],
    ['Al', 'Aluminio', 'metal', 'Liviano y brillante: latas, cables, ollas y aviones.', '#FFE0B3'],
    ['Si', 'Silicio', 'metaloide', 'Está en la arena y en el vidrio. Con él se fabrican los chips de los computadores y celulares.', '#D9F6F2'],
    ['P', 'Fósforo', 'no metal', 'Está en tus huesos, en el ADN y en los fósforos. Es esencial para la vida.', '#D6F5E6'],
    ['S', 'Azufre', 'no metal', 'Amarillo y de olor fuerte. Sale de los volcanes y está en el huevo podrido.', '#D6F5E6'],
    ['Cl', 'Cloro', 'gas', 'Desinfecta el agua de las piscinas. Con el sodio forma la sal de mesa.', '#FFF3CC'],
    ['Ar', 'Argón', 'gas noble', 'Es el tercer gas más abundante del aire. Se usa dentro de algunas bombillas.', '#FFD6E3'],
    ['K', 'Potasio', 'metal', 'Está en el banano y es importante para el corazón y los nervios.', '#FFE0B3'],
    ['Ca', 'Calcio', 'metal', 'El que forma tus huesos y dientes, y la leche te lo da.', '#FFE0B3']
  ];
  /* Neutrones de los isótopos estables más comunes [mín, máx] */
  C.STABLE_N = [null, [0, 1], [1, 2], [3, 4], [5, 5], [5, 6], [6, 7], [7, 8], [8, 10], [10, 10], [10, 12], [12, 12], [12, 14], [14, 14], [14, 16], [16, 16], [16, 20], [18, 20], [18, 22], [20, 22], [20, 28]];
  C.isStable = (Z, N) => !!C.STABLE_N[Z] && N >= C.STABLE_N[Z][0] && N <= C.STABLE_N[Z][1];
  /* Electrones en capas: 2, 8, 8, 2 … */
  C.shellConfig = (e) => { const cap = [2, 8, 8, 18], out = []; let left = e; for (const c of cap) { if (left <= 0) break; out.push(Math.min(c, left)); left -= c; } return out; };

  /* ---- Radiactividad ---- */
  C.decayLeft = (N0, t, halfLife) => N0 * Math.pow(0.5, t / halfLife);
  C.C14_HALF = 5730;
  C.c14Fraction = (ageYears) => Math.pow(0.5, ageYears / C.C14_HALF);
  C.c14Age = (f) => -C.C14_HALF * Math.log2(f);
  /* Fracción de radiación que atraviesa cada blindaje (modelo simplificado) */
  C.SHIELD = { a: { ninguno: 1, papel: 0, aluminio: 0, plomo: 0 }, b: { ninguno: 1, papel: 0.7, aluminio: 0.02, plomo: 0 }, g: { ninguno: 1, papel: 1, aluminio: 0.85, plomo: 0.03 } };
  C.shieldPass = (src, sh) => C.SHIELD[src][sh];
  C.GEIGER_BASE = { a: 200, b: 300, g: 400 }; /* clics por segundo a 1 m sin blindaje */
  C.geigerRate = (src, sh, d) => (C.GEIGER_BASE[src] * C.SHIELD[src][sh]) / (d * d) + 0.5;
  /* Probabilidad de fusión al chocar dos protones a T millones de grados (modelo ilustrativo) */
  C.fusionProb = (T) => 0.9 / (1 + Math.exp(-(T - 11) / 1.6));

  /* ---- Cuántica ---- */
  C.photonEnergy = (nm) => 1239.84198 / nm; /* eV */
  C.hydrogenLevel = (n) => -13.6057 / (n * n);
  C.RYD = 1.0967758e7; /* 1/m */
  C.hydrogenLambda = (ni, nf) => 1e9 / (C.RYD * (1 / (nf * nf) - 1 / (ni * ni))); /* nm */
  C.photoThresholdNm = (workFn) => 1239.84198 / workFn;
  /* Doble rendija: intensidad relativa en la posición x (unidades arbitrarias), longitud de onda lam, separación d y ancho a */
  C.doubleSlit = (x, lam, d, a) => { const f = (u) => (Math.abs(u) < 1e-9 ? 1 : Math.sin(u) / u), k = 1.4 * lam, i = Math.cos((Math.PI * d * x) / k), e = f((Math.PI * a * x) / k); return i * i * e * e; };

  /* ---- Relatividad ---- */
  C.gamma = (beta) => 1 / Math.sqrt(1 - beta * beta);
  C.twinAge = (years, beta) => years / C.gamma(beta);
  /* GPS: satélite a 20 200 km de altura (r = 26 571 km), v = 3,874 km/s. Efectos en µs por día */
  C.GM = 3.986004418e14; C.R_EARTH = 6.371e6; C.R_GPS = 2.6571e7;
  C.gpsSR = () => { const v = Math.sqrt(C.GM / C.R_GPS); return (-(v * v) / (2 * C.VLIGHT * C.VLIGHT)) * 86400 * 1e6; };
  C.gpsGR = () => ((C.GM * (1 / C.R_EARTH - 1 / C.R_GPS)) / (C.VLIGHT * C.VLIGHT)) * 86400 * 1e6;
  C.gpsErrorKmPerDay = () => (C.gpsSR() + C.gpsGR()) * 1e-6 * (C.VLIGHT / 1000);
  /* Desvío exagerado de la luz (rad) para la demostración; la fórmula real es 4GM/(c²b) */
  C.lightBend = (M, b) => Math.atan((0.05 * M * 100) / b);
  C.lightBendReal = (GM, b) => (4 * GM) / (C.VLIGHT * C.VLIGHT * b);

  /* ---- Partículas ---- */
  C.quarkCharge = (code) => [...code].reduce((s, k) => s + (k === 'u' ? 2 / 3 : -1 / 3), 0);
  C.fracStr = (q) => { const t = Math.round(q * 3); if (t % 3 === 0) return (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t / 3); return (t > 0 ? '+' : '−') + Math.abs(t) + '/3'; };
  C.hadron = (code) => {
    const k = [...code].sort().join('');
    if (k === 'duu') return { id: 'p', name: 'Protón (uud)', msg: 'Carga +1. Está en el núcleo de todos los átomos.' };
    if (k === 'ddu') return { id: 'n', name: 'Neutrón (udd)', msg: 'Carga 0. Pega el núcleo y le da estabilidad.' };
    if (k === 'uuu') return { id: 'd++', name: 'Delta ++ (uuu)', msg: 'Carga +2; vive unos 10⁻²⁴ segundos, ¡un instante!' };
    if (k === 'ddd') return { id: 'd-', name: 'Delta − (ddd)', msg: 'Carga −1; también dura un instante.' };
    return { id: null, name: 'sin nombre', msg: '' };
  };
  /* Radio de giro de un protón (m): r = p/(qB) → r[m] = E[GeV] / (0,2998 · B[T]) */
  C.beamRadius = (E_GeV, B) => E_GeV / (0.299792458 * B);

  /* ---- Cuerpo y equilibrio ---- */
  /* Fuerza del bíceps (N) al sostener m kg a d cm del codo con el tendón a i cm del codo (equilibrio de torques) */
  C.bicepsForce = (m, d, i) => (m * 9.8 * d) / i;
  /* Pila de ladrillos de largo L (bordes izquierdos xs, de abajo a arriba) sobre una mesa que termina en tableEdge */
  C.stackStable = (xs, L = 1, tableEdge = 0) => {
    for (let k = 0; k < xs.length; k++) {
      let com = 0; for (let i = k; i < xs.length; i++) com += xs[i] + L / 2; com /= xs.length - k;
      const lo = k === 0 ? -Infinity : xs[k - 1], hi = k === 0 ? tableEdge : xs[k - 1] + L;
      if (com > hi + 1e-9 || com < lo - 1e-9) return false;
    }
    return true;
  };
  C.harmonicOverhang = (n) => { let s = 0; for (let i = 1; i <= n; i++) s += 1 / (2 * i); return s; };

  /* ---- Tierra ---- */
  C.earthLayer = (z) => z < 35 ? { id: 'cor', name: 'Corteza', msg: 'La delgada cáscara sólida donde vivimos: de 5 a 70 km de grosor.' } : z < 2890 ? { id: 'man', name: 'Manto', msg: 'Roca muy caliente que fluye lentísimo, unos centímetros por año.' } : z < 5150 ? { id: 'ne', name: 'Núcleo externo (líquido)', msg: 'Hierro líquido que se mueve y crea el campo magnético de la Tierra.' } : { id: 'ni', name: 'Núcleo interno (sólido)', msg: 'Una bola sólida de hierro y níquel tan caliente como la superficie del Sol, pero sólida por la presión.' };
  const interp = (tab, x) => { for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) return tab[i - 1][1] + ((tab[i][1] - tab[i - 1][1]) * (x - tab[i - 1][0])) / (tab[i][0] - tab[i - 1][0]); return tab[tab.length - 1][1]; };
  C.earthTemp = (z) => interp([[0, 15], [35, 500], [100, 1300], [410, 1600], [660, 1900], [2890, 3700], [5150, 5000], [6371, 5400]], z);
  C.earthPressure = (z) => interp([[0, 0], [35, 1], [100, 3.3], [410, 14], [660, 24], [2890, 136], [5150, 329], [6371, 364]], z); /* GPa */
  C.VP = 6; C.VS = 3.5; /* km/s */
  C.spDelay = (d) => d / C.VP * 0 + d * (1 / C.VS - 1 / C.VP);
  C.spDistance = (dt) => dt / (1 / C.VS - 1 / C.VP);
  C.landTemp = (h) => 24 + 6 * Math.sin((2 * Math.PI * (h - 9)) / 24);
  C.seaTemp = (h) => 25.5 + 1.2 * Math.sin((2 * Math.PI * (h - 12)) / 24);

  /* ---- Materiales ---- */
  /* Qué pasa al estirar un material con una fracción 'load' (0–1) de su fuerza máxima: elástico, plástico o rotura. ext = alargamiento relativo; perm = alargamiento que queda al soltar */
  C.materialOutcome = (mat, load) => {
    const P = { goma: { y: 0.85, b: 0.98, k: 3.5, p: 2.2 }, acero: { y: 0.4, b: 0.9, k: 0.15, p: 0.9 }, vidrio: { y: 0.3, b: 0.3, k: 0.1, p: 0 }, plastilina: { y: 0.05, b: 0.97, k: 2.5, p: 0.95 } }[mat];
    if (load >= P.b) return { kind: 'break', ext: P.k * Math.min(load, P.b), perm: 0 };
    if (load <= P.y) return { kind: 'elastic', ext: P.k * load, perm: 0 };
    const perm = mat === 'plastilina' ? P.k * load * P.p : P.p * (load - P.y);
    return { kind: perm > 0.04 ? 'plastic' : 'elastic', ext: P.k * load + perm * 0.6, perm };
  };
  /* Resistencia relativa de un superconductor: 0 por debajo de Tc; metálica (crece con T) por encima */
  C.superResistance = (T, Tc) => (T < Tc ? 0 : 0.3 + (0.7 * (T - Tc)) / (300 - Tc));
  C.LOGIC = { and: (a, b) => a && b, or: (a, b) => a || b, xor: (a, b) => a !== b, nand: (a, b) => !(a && b) };

  /* ---- Azar y caos ---- */
  C.binomPMF = (n, k, p) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c * Math.pow(p, k) * Math.pow(1 - p, n - k); };
  /* Péndulo doble (masas y largos iguales a 1, g = 9,8). Estado [θ1, θ2, ω1, ω2]; un paso de Runge–Kutta 4 de tamaño h */
  const dbl = (s) => {
    const [t1, t2, w1, w2] = s, g = 9.8, d = t1 - t2, den = 3 - Math.cos(2 * d);
    const a1 = (-g * 3 * Math.sin(t1) - g * Math.sin(t1 - 2 * t2) - 2 * Math.sin(d) * (w2 * w2 + w1 * w1 * Math.cos(d))) / den;
    const a2 = (2 * Math.sin(d) * (w1 * w1 * 2 + g * 2 * Math.cos(t1) + w2 * w2 * Math.cos(d))) / den;
    return [w1, w2, a1, a2];
  };
  C.dblPend = (s, h) => {
    const add = (a, b, k) => a.map((x, i) => x + b[i] * k);
    const k1 = dbl(s), k2 = dbl(add(s, k1, h / 2)), k3 = dbl(add(s, k2, h / 2)), k4 = dbl(add(s, k3, h));
    return s.map((x, i) => x + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  C.dblPendEnergy = (s) => { const [t1, t2, w1, w2] = s, g = 9.8; return 0.5 * (2 * w1 * w1 + w2 * w2 + 2 * w1 * w2 * Math.cos(t1 - t2)) - g * (2 * Math.cos(t1) + Math.cos(t2)); };

  if (typeof module !== 'undefined' && module.exports) module.exports = C;
})();
