/* ===================================================================
   05-modelos.js — Modelos físicos de las prácticas (funciones puras).
   Los usan los bancos virtuales y las pruebas de tests/validar.js, que
   los contrastan con SciPy, CoolProp y valores de la literatura.
   Unidades SI salvo que se indique.
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  const MO = (EM.MOD = {});
  const PI = Math.PI, mu0 = 1.25663706212e-6;

  /* Integral elíptica completa de primera especie K(m), m = k² (media aritmético-geométrica) */
  MO.K = function (m) {
    let a = 1, b = Math.sqrt(1 - m);
    for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; }
    return PI / (2 * a);
  };

  /* ---------- P1 Densidad ---------- */
  MO.DENSIDADES = { aluminio: 2700, laton: 8500, acero: 7850, cobre: 8960, pvc: 1380, vidrio: 2500, pino: 500, agua: 998.2, alcohol: 789, aceite: 920, glicerina: 1261 };
  MO.volCil = (d, h) => (PI * d * d * h) / 4;
  /* Incertidumbre relativa de ρ = 4m/(π d² h) */
  MO.urRhoCil = (m, um, d, ud, h, uh) => Math.sqrt((um / m) ** 2 + (2 * ud / d) ** 2 + (uh / h) ** 2);

  /* ---------- P2 y P8 Rodadura ---------- */
  /* Esfera de radio r que rueda sobre dos rieles separados w: radio de rodadura efectivo y β = I/(m re²) */
  MO.betaEsfera = function (r, w) {
    const re2 = r * r - (w / 2) * (w / 2);
    return re2 > 0 ? (0.4 * r * r) / re2 : Infinity;
  };
  MO.aRodando = (g, th, beta) => (g * Math.sin(th)) / (1 + beta);
  /* Alcance de una esfera que baja una rampa de altura h y sale horizontal desde una mesa de altura H */
  MO.alcanceRampa = (h, H, beta) => 2 * Math.sqrt((h * H) / (1 + beta));

  /* ---------- P3 Péndulo simple (exacto en amplitud, con bola de radio r) ---------- */
  MO.Tpendulo = function (L, th0, g, r = 0) {
    const Leq = (L * L + 0.4 * r * r) / L;
    return 4 * Math.sqrt(Leq / g) * MO.K(Math.sin(th0 / 2) ** 2);
  };
  MO.Tpequeno = (L, g) => 2 * PI * Math.sqrt(L / g);

  /* ---------- P4 Masa–resorte ---------- */
  MO.Tresorte = (m, ms, k) => 2 * PI * Math.sqrt((m + ms / 3) / k);

  /* ---------- P5 Fricción en plano inclinado ---------- */
  MO.aDeslizando = (g, th, muk) => g * (Math.sin(th) - muk * Math.cos(th));

  /* ---------- P6 y E1 Segunda ley: carro M, masa colgante m, polea de inercia Ip y radio rp ---------- */
  MO.aCarro = (M, m, g, Ip = 0, rp = 0.02, mur = 0) => (m * g - mur * M * g) / (M + m + (rp > 0 ? Ip / (rp * rp) : 0));

  /* ---------- P7 Equilibrio de una regla ---------- */
  /* Masa desconocida con regla de masa mr cuyo centro está a xc del pivote, referencia mref a dref, incógnita a dx (lados opuestos) */
  MO.masaPalanca = (mref, dref, dx, mr = 0, xc = 0) => (mref * dref + mr * xc) / dx;
  /* Centro de masa de una placa en L: rectángulos [x0,y0,ancho,alto] uniformes */
  MO.cmRect = function (rects) {
    let A = 0, sx = 0, sy = 0;
    for (const [x0, y0, w, h] of rects) { const a = w * h; A += a; sx += a * (x0 + w / 2); sy += a * (y0 + h / 2); }
    return [sx / A, sy / A];
  };

  /* ---------- P9 Choques y rebotes ---------- */
  /* Intervalo entre el rebote n y n+1 de una pelota que cae desde h0 con coeficiente e */
  MO.dtRebote = (n, h0, e, g) => 2 * Math.pow(e, n) * Math.sqrt((2 * h0) / g);
  MO.choque1D = function (m1, v1, m2, v2, e) {
    const vcm = (m1 * v1 + m2 * v2) / (m1 + m2);
    return [vcm - (e * m2 * (v1 - v2)) / (m1 + m2), vcm + (e * m1 * (v1 - v2)) / (m1 + m2)];
  };

  /* ---------- P10 Movimiento circular (tapón y tubo): Mg = m ω² L ---------- */
  MO.periodoTapon = (m, M, L, g) => 2 * PI * Math.sqrt((m * L) / (M * g));
  MO.anguloTapon = (m, M) => Math.asin(Math.min(1, m / M)); /* inclinación del hilo bajo la horizontal */

  /* ---------- P11 Hidrostática ---------- */
  MO.empuje = (rhof, V, g) => rhof * V * g;
  MO.rhoArquimedes = (W, Wap, rhof) => (rhof * W) / (W - Wap);

  /* ---------- P12 Torricelli ---------- */
  MO.alcanceChorro = (h, y, Cv = 1) => 2 * Cv * Math.sqrt(h * y);
  MO.hVaciado = (t, h0, Cd, a, A, g) => { const s = Math.sqrt(h0) - (Cd * a / A) * Math.sqrt(g / 2) * t; return s > 0 ? s * s : 0; };
  MO.tVaciado = (h0, Cd, a, A, g) => (A / (Cd * a)) * Math.sqrt((2 * h0) / g);

  /* ---------- P13 Calorimetría y enfriamiento ---------- */
  MO.CALOR_ESP = { agua: 4182, aluminio: 897, cobre: 385, hierro: 449, laton: 380, plomo: 129, vidrio: 840, acero: 466 };
  /* Temperatura de equilibrio: cuerpo (m1,c1,T1) en agua (m2,c2,T2) con calorímetro de capacidad Ccal a T2 */
  MO.tEquilibrio = (m1, c1, T1, m2, c2, T2, Ccal = 0) => (m1 * c1 * T1 + (m2 * c2 + Ccal) * T2) / (m1 * c1 + m2 * c2 + Ccal);
  MO.cDesconocido = (m1, T1, m2, c2, T2, Te, Ccal = 0) => ((m2 * c2 + Ccal) * (Te - T2)) / (m1 * (T1 - Te));
  MO.enfriamiento = (t, T0, Ta, tau) => Ta + (T0 - Ta) * Math.exp(-t / tau);

  /* ---------- P14 Tubo de perdigones (Joule) ---------- */
  MO.dTperdigones = (N, L, c, g, eta = 1) => (eta * N * g * L) / c;

  /* ---------- P15 Resorte largo (slinky): v = L √(k/M) ---------- */
  MO.vSlinky = (L, k, M) => L * Math.sqrt(k / M);
  MO.tSlinky = (k, M) => Math.sqrt(M / k);

  /* ---------- P16 Tubo de resonancia ---------- */
  MO.correccionExtremo = (r) => 0.6133 * r; /* tubo sin pestaña (Levine y Schwinger, 1948) */
  MO.Lresonancia = (n, f, v, r) => ((2 * n - 1) * v) / (4 * f) - MO.correccionExtremo(r);

  /* ---------- P17 Refracción ---------- */
  MO.N_AGUA = 1.333; MO.N_ACRILICO = 1.49; MO.N_VIDRIO = 1.52;
  MO.snell = (n1, th1, n2) => { const s = (n1 * Math.sin(th1)) / n2; return Math.abs(s) <= 1 ? Math.asin(s) : NaN; };
  MO.critico = (n1, n2) => Math.asin(n2 / n1);
  /* Transmitancia de Fresnel (luz no polarizada) */
  MO.fresnelR = function (n1, th1, n2) {
    const th2 = MO.snell(n1, th1, n2);
    if (isNaN(th2)) return 1;
    const c1 = Math.cos(th1), c2 = Math.cos(th2);
    const rs = (n1 * c1 - n2 * c2) / (n1 * c1 + n2 * c2), rp = (n1 * c2 - n2 * c1) / (n1 * c2 + n2 * c1);
    return (rs * rs + rp * rp) / 2;
  };

  /* ---------- P18 Lentes delgadas ---------- */
  MO.imagen = (f, so) => (f * so) / (so - f);
  MO.fBessel = (D, d) => (D * D - d * d) / (4 * D);

  /* ---------- P19 Difracción ---------- */
  MO.PASO = { cd: 1.6e-6, dvd: 0.74e-6, bluray: 0.32e-6 };
  MO.anguloRed = (m, lam, d, thi = 0) => { const s = (m * lam) / d + Math.sin(thi); return Math.abs(s) <= 1 ? Math.asin(s) : NaN; };
  /* Distancia entre mínimos de la figura de un cabello de diámetro a en una pantalla a D */
  MO.franjaCabello = (lam, D, a) => (lam * D) / a;

  /* ---------- P20 Polarización ---------- */
  MO.malus = (I0, th, fondo = 0) => I0 * Math.cos(th) ** 2 + fondo;

  /* ---------- P21 Electrostática: péndulos de carga ---------- */
  /* Dos esferas iguales de masa m colgadas de hilos L que se separan un ángulo θ cada una: carga q de cada esfera */
  MO.cargaPendulos = function (m, L, th, g) {
    const d = 2 * L * Math.sin(th), F = m * g * Math.tan(th);
    return Math.sqrt((F * d * d) / 8.9875517923e9);
  };

  /* ---------- P22 Circuitos ---------- */
  MO.serie = (...R) => R.reduce((a, b) => a + b, 0);
  MO.paralelo = (...R) => 1 / R.reduce((a, b) => a + 1 / b, 0);
  /* Bombillo incandescente empírico: I = In (V/Vn)^0.55 → R(V) = Vn/In (V/Vn)^0.45 */
  MO.bombillo = { Vn: 2.5, In: 0.3, exp: 0.55 };
  MO.iBombillo = (V, b = MO.bombillo) => (V <= 0 ? 0 : b.In * Math.pow(V / b.Vn, b.exp));
  /* Circuito A en serie con (B ∥ C), pila E con resistencia interna r. Opciones: sinB, sinC.
     Devuelve tensiones y potencias de cada bombillo resolviendo por bisección. */
  MO.circuitoABC = function (E, r, o = {}) {
    const b = MO.bombillo;
    /* Dada la tensión en el paralelo Vp, la corriente del paralelo es iB+iC; A tiene la misma corriente */
    const iPar = (Vp) => (o.sinB ? 0 : MO.iBombillo(Vp, b)) + (o.sinC ? 0 : MO.iBombillo(Vp, b));
    const vA = (I) => { let lo = 0, hi = 100; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (MO.iBombillo(m, b) < I) lo = m; else hi = m; } return (lo + hi) / 2; };
    if (o.sinB && o.sinC) return { I: 0, VA: 0, VB: 0, VC: 0, PA: 0, PB: 0, PC: 0 };
    let lo = 0, hi = E;
    for (let k = 0; k < 80; k++) {
      const Vp = (lo + hi) / 2, I = iPar(Vp);
      const resto = E - I * r - vA(I) - Vp;
      if (resto > 0) lo = Vp; else hi = Vp;
    }
    const Vp = (lo + hi) / 2, I = iPar(Vp), VA = vA(I);
    const iB = o.sinB ? 0 : MO.iBombillo(Vp, b), iC = o.sinC ? 0 : MO.iBombillo(Vp, b);
    return { I, VA, VB: o.sinB ? 0 : Vp, VC: o.sinC ? 0 : Vp, PA: VA * I, PB: Vp * iB, PC: Vp * iC };
  };

  /* ---------- P23 Oersted y electroimán ---------- */
  MO.bHilo = (I, d) => (mu0 * I) / (2 * PI * d);
  MO.anguloOersted = (I, d, BH) => Math.atan(MO.bHilo(I, d) / BH);
  /* Campo en el eje de un solenoide finito de N vueltas, longitud ℓ y radio a, en z medido desde el centro */
  MO.bSolenoide = function (N, I, l, a, z) {
    const n = N / l, z1 = z + l / 2, z2 = z - l / 2;
    return ((mu0 * n * I) / 2) * (z1 / Math.hypot(z1, a) - z2 / Math.hypot(z2, a));
  };

  /* ---------- P24 Inducción: imán (dipolo m) que cae por una bobina de N vueltas y radio a ---------- */
  MO.flujoDipolo = (mdip, a, z) => (mu0 * mdip * a * a) / (2 * Math.pow(a * a + z * z, 1.5));
  /* fem cuando el imán pasa por z con velocidad v (hacia −z): ε = −N dΦ/dt = −N (dΦ/dz)(dz/dt) */
  MO.femDipolo = function (N, mdip, a, z, vz) {
    const dPhidz = (-3 * mu0 * mdip * a * a * z) / (2 * Math.pow(a * a + z * z, 2.5));
    return -N * dPhidz * vz;
  };
  /* Momento dipolar de un imán de remanencia Br (T) y volumen V */
  MO.momentoIman = (Br, V) => (Br * V) / mu0;

  /* ---------- E2 Valla en caída libre ---------- */
  MO.tiemposValla = function (n, s, v0, g) {
    const t = [];
    for (let i = 0; i < n; i++) { const x = i * s; t.push((-v0 + Math.sqrt(v0 * v0 + 2 * g * x)) / g); }
    return t;
  };

  /* ---------- E3 Péndulo físico: regla de longitud L suspendida a d del centro ---------- */
  MO.Tregla = (L, d, g) => 2 * PI * Math.sqrt((L * L / 12 + d * d) / (g * d));
  MO.dMinRegla = (L) => L / Math.sqrt(12);

  /* ---------- E4 Melde ---------- */
  MO.fMelde = (n, L, T, mu) => (n / (2 * L)) * Math.sqrt(T / mu);

  /* ---------- E5 Ondas en el agua ---------- */
  MO.omegaAgua = (k, h, g = 9.81, sigma = 0.0728, rho = 998) => Math.sqrt((g * k + (sigma * k ** 3) / rho) * Math.tanh(k * h));
  /* Longitud de onda para frecuencia f y profundidad h (Newton sobre la relación de dispersión) */
  MO.lambdaAgua = function (f, h, g = 9.81, sigma = 0.0728, rho = 998) {
    const w = 2 * PI * f;
    let k = (w * w) / g;
    for (let i = 0; i < 100; i++) {
      const F = MO.omegaAgua(k, h, g, sigma, rho) - w;
      const dk = Math.max(k * 1e-6, 1e-9);
      const dF = (MO.omegaAgua(k + dk, h, g, sigma, rho) - MO.omegaAgua(k - dk, h, g, sigma, rho)) / (2 * dk);
      const kn = k - F / dF;
      if (!(kn > 0)) { k /= 2; continue; }
      if (Math.abs(kn - k) < 1e-12 * k) { k = kn; break; }
      k = kn;
    }
    return (2 * PI) / k;
  };

  /* ---------- E6 Circuito RC con voltímetro de resistencia Rm en paralelo con C ---------- */
  MO.rcCarga = function (t, V0, R, C, Rm = Infinity) {
    const Rp = isFinite(Rm) ? (R * Rm) / (R + Rm) : R, Vf = isFinite(Rm) ? (V0 * Rm) / (R + Rm) : V0;
    return Vf * (1 - Math.exp(-t / (Rp * C)));
  };
  MO.rcDescarga = (t, V0, R, C, Rm = Infinity) => V0 * Math.exp(-t / ((isFinite(Rm) ? (R * Rm) / (R + Rm) : R) * C));

  /* ---------- E7 LED ---------- */
  MO.h = 6.62607015e-34; MO.e = 1.602176634e-19; MO.c = 299792458; MO.kB = 1.380649e-23;
  MO.vFoton = (lam) => (MO.h * MO.c) / (MO.e * lam);
  /* Curva I–V de un LED: Shockley con idealidad η, resistencia serie Rs y tensión característica V0;
     I = Is (exp((V − I Rs − V0)/(η VT)) ), con Is fijado para que I = 1 µA en V0 */
  MO.iLED = function (V, V0, eta = 2, Rs = 10, T = 298.15) {
    const VT = (MO.kB * T) / MO.e;
    let lo = 0, hi = 1;
    const f = (I) => 1e-6 * Math.exp((V - I * Rs - V0) / (eta * VT)) - I;
    if (f(0) <= 0) return 0;
    for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };

  /* ---------- E8 Brújula de tangentes ---------- */
  MO.bEspira = (N, I, R) => (mu0 * N * I) / (2 * R);
  MO.bHelmholtz = (N, I, R) => Math.pow(0.8, 1.5) * (mu0 * N * I) / R;

  /* ---------- E9 Motor de corriente continua que levanta una masa ---------- */
  /* V = I R + kω ; k I = τ ; τ = m g rd + τf. Devuelve corriente, velocidad, potencia y rendimiento */
  MO.motor = function (V, R, k, m, rd, g, tauF = 0) {
    const tau = m * g * rd + tauF, I = tau / k, w = (V - I * R) / k;
    if (w <= 0) return { I: V / R, w: 0, v: 0, Pin: (V * V) / R, Pout: 0, eta: 0 };
    const Pin = V * I, Pout = m * g * rd * w;
    return { I, w, v: w * rd, Pin, Pout, eta: Pout / Pin };
  };

  /* ---------- E10 Espectros ---------- */
  MO.LINEAS_HG = [404.66, 435.83, 546.07, 576.96, 579.07];
  MO.LINEAS_FLUOR = [435.83, 487.7, 546.07, 611.6]; /* Hg + fósforos Tb (487.7, 543) y Eu (611.6) */

  /* ---------- E11 Gases en una jeringa ---------- */
  MO.boyleV = (p, nRT, V0) => nRT / p - V0; /* volumen leído si hay V0 de volumen muerto */
  MO.pEmbolo = (patm, M, A, g) => patm + (M * g) / A;

  /* ---------- E12 Viscosidad (Stokes con corrección de pared de Faxén) ---------- */
  /* Glicerina pura: ajuste de Vogel por la tabla de la Glycerine Producers' Association (1963), basada en
     Segur y Oberstar (1951): 1.410 Pa·s a 20 °C, 0.612 a 30 °C y 0.284 a 40 °C (el valor de 10 °C, 3.90, sirve de prueba) */
  MO.etaGlicerina = (function () {
    const T = [293.15, 303.15, 313.15], y = [Math.log(1.410), Math.log(0.612), Math.log(0.284)];
    /* ln η = A + B/(T − C): resolver C por bisección para pasar por los tres puntos */
    const r = (C) => (y[0] - y[1]) / (1 / (T[0] - C) - 1 / (T[1] - C)) - (y[1] - y[2]) / (1 / (T[1] - C) - 1 / (T[2] - C));
    let lo = 0, hi = 280;
    for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (r(lo) * r(m) <= 0) hi = m; else lo = m; }
    const C = (lo + hi) / 2, B = (y[0] - y[1]) / (1 / (T[0] - C) - 1 / (T[1] - C)), A = y[0] - B / (T[0] - C);
    const f = (th) => Math.exp(A + B / (th + 273.15 - C));
    f.coef = { A, B, C };
    return f;
  })();
  MO.faxen = (x) => 1 - 2.104 * x + 2.09 * x ** 3 - 0.95 * x ** 5;
  MO.vStokes = (r, rhos, rhof, eta, g, Rtubo = Infinity) => ((2 * r * r * g * (rhos - rhof)) / (9 * eta)) * (isFinite(Rtubo) ? MO.faxen(r / Rtubo) : 1);
  MO.reynolds = (rho, v, D, eta) => (rho * v * D) / eta;

  /* ---------- Capítulo 2: método de los lúmenes ---------- */
  MO.luminarias = (E, A, phi, CU, MF) => Math.ceil((E * A) / (phi * CU * MF));
  MO.indiceLocal = (L, W, hm) => (L * W) / (hm * (L + W));

  /* ---------- Capítulo 3: corriente por el cuerpo y cortocircuito de una pila ---------- */
  /* Impedancia total del cuerpo (mano a mano, piel seca, 50 Hz) interpolada de IEC 60479-1 (percentil 50) */
  MO.ZCUERPO = [[25, 3250], [50, 2500], [75, 2000], [100, 1725], [125, 1550], [150, 1400], [175, 1325], [200, 1275], [225, 1225], [400, 950], [500, 850], [700, 775], [1000, 775]];
  MO.zCuerpo = function (U) {
    const T = MO.ZCUERPO;
    if (U <= T[0][0]) return T[0][1];
    for (let i = 1; i < T.length; i++) if (U <= T[i][0]) { const [u0, z0] = T[i - 1], [u1, z1] = T[i]; return z0 + ((z1 - z0) * (U - u0)) / (u1 - u0); }
    return T[T.length - 1][1];
  };
  MO.cortoPila = (E, r, Rw) => { const I = E / (r + Rw); return { I, Pw: I * I * Rw, Pr: I * I * r }; };

  /* ---------- Capítulo 11: deflexión de una viga en voladizo ---------- */
  MO.flechaVoladizo = (F, L, E, b, h) => (4 * F * L ** 3) / (E * b * h ** 3); /* δ = F L³/(3 E I), I = b h³/12 */
  MO.MODULO_E = { pino: 10e9, mdf: 3.5e9, aluminio: 69e9, acero: 200e9, pvc: 3.0e9, acrilico: 3.2e9 };
})();
