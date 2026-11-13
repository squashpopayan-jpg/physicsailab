/* ===================================================================
   lib/10-calc.js — Cálculos eléctricos de la guía (sin DOM, probados en Node)
   Conductores, caída de tensión, protecciones, tubos, cajas, demanda de
   vivienda, capacidad instalable y ruta de conformidad, iluminación,
   puesta a tierra, cuerpo humano.
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});
  const N = L.N;
  const C = (L.C = {});

  /* ---------- Conductores ---------- */
  /* Diámetro (mm) y área (mm²) de un calibre AWG: d = 0,127 · 92^((36 − n)/39) */
  C.awgDiam = (awg) => 0.127 * Math.pow(92, (36 - N.awgNum(awg)) / 39);
  C.awgArea = (awg) => { const d = C.awgDiam(awg); return (Math.PI * d * d) / 4; };
  /* Resistencia en c.c. del cobre (Ω/km) a la temperatura T (°C).
     ρ20 = 0,017241 Ω·mm²/m (IACS), α = 0,00393 /°C; los cables (8 AWG y mayores) tienen
     un 2 % más por el trenzado. */
  C.rCu = function (awg, T = 75) {
    const rho = 0.017241 * (1 + 0.00393 * (T - 20));
    const k = N.awgNum(awg) <= 8 ? 1.02 : 1;
    return (1000 * rho * k) / C.awgArea(awg);
  };
  /* Capacidad de corriente corregida por temperatura ambiente y número de portadores.
     Factor por temperatura: sqrt((Tc − Ta)/(Tc − 30)), sección 310.15(B)(2). */
  C.factorTemp = (Tc, Ta) => (Ta >= Tc ? 0 : Math.sqrt((Tc - Ta) / (Tc - 30)));
  C.factorN = function (n) { for (const [lim, f] of N.AJUSTE_N) if (n <= lim) return f; return 0.35; };
  C.ampacidad = function (awg, col = 60, Ta = 30, nPort = 3) {
    const base = N.AMPACIDAD[awg][N.COLS.indexOf(col)];
    return base * C.factorTemp(col, Ta) * C.factorN(nPort);
  };
  /* Interruptor normalizado inmediatamente superior o igual */
  C.breakerUp = (I) => N.BREAKERS.find((b) => b >= I - 1e-9) || null;
  C.breakerDown = (I) => { let r = null; for (const b of N.BREAKERS) if (b <= I + 1e-9) r = b; return r; };
  /* Protección máxima permitida para un conductor: la ampacidad, con el ajuste al valor
     normalizado superior de 240.4(B) (hasta 800 A) y el tope de 240.4(D) para 14, 12 y 10 AWG. */
  C.protMax = function (awg, col = 60, Ta = 30, nPort = 3) {
    const Iz = C.ampacidad(awg, col, Ta, nPort);
    let p = N.BREAKERS.includes(Math.round(Iz)) ? Math.round(Iz) : C.breakerUp(Iz);
    if (N.MAX_OCPD[awg]) p = Math.min(p, N.MAX_OCPD[awg]);
    return p;
  };
  /* Calibre mínimo para una protección In (columna col): Iz ≥ In salvo la regla 240.4(B) */
  C.calibrePara = function (In, col = 60, Ta = 30, nPort = 3) {
    for (const awg of N.AWG) if (C.protMax(awg, col, Ta, nPort) >= In) return awg;
    return null;
  };
  /* Verificación de coordinación Ib ≤ In ≤ Iz (con 240.4(B) y 240.4(D)) */
  C.coordinar = function ({ Ib, In, awg, col = 60, Ta = 30, nPort = 3, continua = false }) {
    const Iz = C.ampacidad(awg, col, Ta, nPort), pmax = C.protMax(awg, col, Ta, nPort);
    const Ireq = continua ? 1.25 * Ib : Ib;
    return {
      Iz, pmax, Ireq,
      okCarga: In >= Ireq - 1e-9,
      okConductor: In <= pmax + 1e-9,
      ok: In >= Ireq - 1e-9 && In <= pmax + 1e-9
    };
  };

  /* ---------- Caída de tensión ---------- */
  /* Circuito de dos hilos (fase-neutro o fase-fase): ΔV = 2·I·R·L. cosφ ≈ 1 en vivienda. */
  C.caida = function ({ I, L: Lm, awg, V = 120, T = 75, fp = 1 }) {
    const R = C.rCu(awg, T) / 1000; /* Ω/m */
    const dV = 2 * I * R * Lm * fp;
    return { dV, pct: (100 * dV) / V, R };
  };
  /* Longitud máxima para una caída dada (%) */
  C.longMax = ({ I, awg, V = 120, pct = 3, T = 75 }) => ((pct / 100) * V) / (2 * I * (C.rCu(awg, T) / 1000));

  /* ---------- Tubos y cajas ---------- */
  C.llenado = function (conds, tipo = 'PVC', d = null) {
    /* conds: lista de calibres (uno por conductor) */
    const area = conds.reduce((s, a) => s + N.AREA_THHN[a], 0);
    const lim = N.llenadoMax(conds.length);
    const tubos = N.TUBOS[tipo];
    const elegido = d ? tubos.find((t) => t.d === d) : null;
    const minimo = tubos.find((t) => area <= lim * t.area + 1e-9) || null;
    return {
      area, lim, n: conds.length, minimo,
      pct: elegido ? (100 * area) / elegido.area : null,
      ok: elegido ? area <= lim * elegido.area + 1e-9 : null
    };
  };
  /* Volumen de ocupación de una caja, sección 314.16(B):
     cada conductor que entra o sale = 1; cada aparato (yugo) = 2 del mayor calibre conectado;
     todos los de tierra = 1 del mayor; abrazaderas internas = 1 del mayor. */
  C.volumenCaja = function ({ conds = [], aparatos = 0, aparatosAwg = null, tierras = 0, abrazaderas = false }) {
    let v = 0;
    for (const a of conds) v += N.VOL_COND[a];
    const mayor = [...conds].sort((x, y) => N.awgNum(x) - N.awgNum(y))[0] || '14';
    const aAwg = aparatosAwg || mayor;
    v += aparatos * 2 * N.VOL_COND[aAwg];
    if (tierras > 0) v += N.VOL_COND[mayor];
    if (abrazaderas) v += N.VOL_COND[mayor];
    return v;
  };

  /* ---------- Curvas de disparo (aproximación IEC 60898-1) ---------- */
  /* Banda térmica: no dispara en 1 h a 1,13·In; dispara en menos de 1 h a 1,45·In;
     a 2,55·In dispara entre 1 s y 60 s. Modelo t = a/(m² − b) ajustado a esos puntos, con
     el máximo en 3 590 s a 1,45·In y 59,9 s a 2,55·In para quedar dentro de los límites. */
  C.TERMICA = { sup: { a: 268.03, b: 2.02784 }, inf: { a: 5.26, b: 1.27544 } };
  C.CURVA_MAG = { B: [3, 5], C: [5, 10], D: [10, 20] };
  /* Tiempos de disparo mínimo y máximo (s) para una corriente m veces In */
  C.disparo = function (m, curva = 'C') {
    const [k1, k2] = C.CURVA_MAG[curva];
    const th = (p) => (m * m > p.b ? p.a / (m * m - p.b) : Infinity);
    let tmax = Math.min(th(C.TERMICA.sup), 3600 * 10);
    let tmin = th(C.TERMICA.inf);
    if (m < 1.13) { tmin = Infinity; tmax = Infinity; }
    if (m >= k2) tmax = Math.min(tmax, 0.1);
    if (m >= k1) tmin = Math.min(tmin, 0.01);
    if (m >= k2) tmin = Math.min(tmin, 0.005);
    return { tmin, tmax };
  };
  /* Diferencial clase A (UL 943, 4–6 mA): T = (20/I)^1,43 con I en mA (máximo 5 s útil) */
  C.gfciT = (ImA) => (ImA < 4 ? Infinity : Math.pow(20 / ImA, 1.43));
  /* Diferencial IEC 61008 tipo general de 30 mA: ≤ 0,3 s a IΔn, ≤ 0,15 s a 2IΔn, ≤ 0,04 s a 5IΔn */
  C.rcdT = function (ImA, IdN = 30) {
    if (ImA < IdN / 2) return Infinity;
    if (ImA < IdN) return 0.3; /* zona de posible disparo: se toma el peor caso del ensayo */
    const m = ImA / IdN;
    if (m < 2) return 0.3 - 0.15 * (m - 1);
    if (m < 5) return 0.15 - (0.11 * (m - 2)) / 3;
    return 0.04;
  };

  /* ---------- Cuerpo humano (aproximación de la Figura 1.5.1.2.a, IEC 60479-1) ---------- */
  /* Curvas tiempo-corriente en escala log-log. Cada curva: corriente (mA) para t = 10 ms y
     para t ≥ 10 s, con transición sigmoidea centrada en tc (ms). Valores leídos de la figura. */
  C.CURVAS_IEC = {
    a: { lo: 0.5, hi: 0.5, tc: 1000, w: 1 },
    b: { lo: 10, hi: 200, tc: 500, w: 0.42 },
    c1: { lo: 40, hi: 500, tc: 330, w: 0.2 },
    c2: { lo: 50, hi: 1000, tc: 380, w: 0.2 },
    c3: { lo: 80, hi: 1600, tc: 430, w: 0.2 }
  };
  C.curvaIEC = function (name, tms) {
    const c = C.CURVAS_IEC[name];
    if (c.lo === c.hi) return c.lo;
    const x = (Math.log10(tms) - Math.log10(c.tc)) / c.w;
    const s = 1 / (1 + Math.exp(x)); /* 1 para t corto, 0 para t largo */
    if (name === 'b') {
      /* curva b: recta en log-log desde (10 ms, 200 mA) hasta (≈ 1 s, 10 mA) y vertical después */
      if (tms >= 1000) return 10;
      const f = (Math.log10(tms) - 1) / 2;
      return Math.pow(10, Math.log10(200) + f * (1 - Math.log10(200)));
    }
    return Math.pow(10, Math.log10(c.lo) + s * (Math.log10(c.hi) - Math.log10(c.lo)));
  };
  /* Zona (1 a 6 como en la figura del RETIE) de un punto (I en mA, t en ms) */
  C.zonaIEC = function (ImA, tms) {
    if (ImA < C.curvaIEC('a', tms)) return 1;
    if (ImA < C.curvaIEC('b', tms)) return 2;
    if (ImA < C.curvaIEC('c1', tms)) return 3;
    if (ImA < C.curvaIEC('c2', tms)) return 4;
    if (ImA < C.curvaIEC('c3', tms)) return 5;
    return 6;
  };
  C.ZONAS = [null, 'Habitualmente ninguna reacción', 'Habitualmente ningún efecto fisiopatológico peligroso', 'Habitualmente ningún riesgo de fibrilación',
    'Riesgo de fibrilación (hasta aproximadamente 5 %)', 'Riesgo de fibrilación (hasta aproximadamente 50 %)', 'Paro cardiaco, paro respiratorio y quemaduras severas; fibrilación por encima de 50 %'];
  /* Impedancia aproximada del cuerpo (Ω) mano–pies según la tensión de contacto y la humedad
     de la piel (orden de magnitud de IEC 60479-1, percentil 50). */
  C.zCuerpo = function (V, piel = 'seca') {
    const base = { seca: [[25, 3250], [50, 2500], [75, 2000], [100, 1725], [125, 1550], [150, 1400], [200, 1275], [300, 1150], [400, 1050], [700, 900], [1000, 850]],
      mojada: [[25, 1950], [50, 1550], [75, 1350], [100, 1225], [125, 1150], [150, 1075], [200, 1000], [300, 925], [400, 875], [700, 800], [1000, 775]],
      salina: [[25, 1100], [50, 900], [75, 825], [100, 775], [125, 725], [150, 700], [200, 675], [300, 650], [400, 625], [700, 600], [1000, 575]] }[piel];
    if (V <= base[0][0]) return base[0][1];
    for (let i = 0; i < base.length - 1; i++) {
      const [v0, z0] = base[i], [v1, z1] = base[i + 1];
      if (V <= v1) return z0 + ((V - v0) / (v1 - v0)) * (z1 - z0);
    }
    return base[base.length - 1][1];
  };

  /* ---------- Demanda de una vivienda (método estándar, NTC 2050 artículo 220, parte III) ---------- */
  C.demandaVivienda = function ({ area, nPA = 2, nLav = 1, estufas = [], secadoras = [], fijos = [] }) {
    const pasos = [];
    const alum = N.CARGA.alumbradoGeneral * area;
    pasos.push({ t: `Alumbrado y tomas generales: ${N.CARGA.alumbradoGeneral} VA/m² × ${area.toFixed(1)} m²`, va: alum, ref: 'Tabla 220.12 y 220.14(J)' });
    const pa = nPA * N.CARGA.pequenosArtefactos;
    pasos.push({ t: `Pequeños artefactos: ${nPA} × 1 500 VA`, va: pa, ref: '220.52(A)' });
    const lav = nLav * N.CARGA.lavanderia;
    pasos.push({ t: `Lavandería: ${nLav} × 1 500 VA`, va: lav, ref: '220.52(B)' });
    const sub = alum + pa + lav;
    let dem = 0, resto = sub, prev = 0;
    for (const [lim, f] of N.DEMANDA_VIV) {
      const tramo = Math.min(resto, lim - prev);
      if (tramo <= 0) break;
      dem += tramo * f; resto -= tramo; prev = lim;
    }
    pasos.push({ t: `Factores de demanda sobre ${Math.round(sub)} VA: primeros 3 000 VA al 100 %, resto al 35 %`, va: dem, ref: 'Tabla 220.42', sub: true });
    let est = 0;
    if (estufas.length === 1) {
      const kW = estufas[0];
      if (kW <= 8.75) est = 0.8 * kW * 1000; /* columna C, nota 3 */
      else if (kW <= 12) est = 8000;          /* columna A */
      else est = 8000 * (1 + 0.05 * Math.ceil(kW - 12));
      pasos.push({ t: `Estufa eléctrica de ${kW} kW`, va: est, ref: 'Tabla 220.55 (una unidad)' });
    } else if (estufas.length > 1) {
      est = estufas.reduce((s, k) => s + k, 0) * 1000 * 0.65;
      pasos.push({ t: `${estufas.length} estufas (aproximación 65 %)`, va: est, ref: 'Tabla 220.55' });
    }
    let sec = 0;
    for (const w of secadoras) sec += Math.max(w, N.CARGA.secadora);
    if (secadoras.length) pasos.push({ t: `Secadora(s)`, va: sec, ref: '220.54' });
    const fsum = fijos.reduce((s, f) => s + f.W, 0);
    const ffac = fijos.length >= 4 ? 0.75 : 1;
    if (fijos.length) pasos.push({ t: `Artefactos fijos (${fijos.map((f) => f.n).join(', ')})${ffac < 1 ? ' al 75 %' : ''}`, va: fsum * ffac, ref: '220.53' });
    const total = dem + est + sec + fsum * ffac;
    return { pasos, instalada: sub + estufas.reduce((s, k) => s + 1000 * k, 0) + sec + fsum, total, I240: total / 240 };
  };

  /* ---------- Capacidad instalable y ruta de conformidad ---------- */
  /* Libro 1: capacidad instalable = kVA que soporta la acometida a tensión nominal sin superar
     60 °C (corrientes < 100 A) o 75 °C (≥ 100 A). */
  C.capacidadInstalable = function (awg, V = 240) {
    const I60 = N.AMPACIDAD[awg][0];
    const I = I60 < 100 ? I60 : N.AMPACIDAD[awg][1];
    return { I, col: I60 < 100 ? 60 : 75, kVA: (I * V) / 1000 };
  };
  C.rutaConformidad = function ({ uso = 'residencial', cuentas = 1, kVA = 10, V = 240, especiales = false, publico = false, ensenanza = false, mismaLicencia = false }) {
    const out = { diseno: '', certificacion: '', motivos: [], documentos: [] };
    const basica = !especiales && V <= 240;
    if (especiales) {
      out.diseno = 'Diseño detallado'; out.motivos.push('Instalación especial o con equipos especiales: 3.3.1 f y g');
    } else if (publico || ensenanza) {
      out.diseno = 'Diseño detallado'; out.motivos.push(publico ? 'Instalación donde se atiende al público: 3.3.1 m' : 'Institución de enseñanza: 3.3.1 l');
    } else if (basica && cuentas <= 4 && kVA <= 15 && !(mismaLicencia && cuentas > 4)) {
      out.diseno = 'Esquema constructivo (no requiere diseño)'; out.motivos.push('Instalación básica con hasta 4 cuentas, ≤ 15 kVA y ≤ 240 V: 3.3.2');
    } else if (uso === 'residencial' && cuentas === 5 && kVA <= 15 && V <= 240) {
      out.diseno = 'Diseño básico'; out.motivos.push('Vivienda con 5 cuentas, ≤ 15 kVA y ≤ 240 V: 3.3.1.2 a');
    } else {
      out.diseno = 'Diseño detallado';
      if (kVA > 15) out.motivos.push('Instalación básica individual mayor a 15 kVA: 3.3.1 q');
      if (cuentas > 4) out.motivos.push('Más de cuatro cuentas: 3.3.1 k y p');
      if (V > 240) out.motivos.push('Tensión mayor a 240 V');
    }
    let plena = false;
    if (especiales) { plena = true; out.motivos.push('Certificación plena: 4.3.2.1 a'); }
    if (uso === 'residencial' && cuentas >= 5 && mismaLicencia) { plena = true; out.motivos.push('Proyecto residencial con 5 o más cuentas: 4.3.2.1 b'); }
    if (uso === 'residencial' && kVA > 15) { plena = true; out.motivos.push('Residencial con capacidad instalable individual > 15 kVA: 4.3.2.1 c'); }
    if (uso === 'comercial' && kVA > 15) { plena = true; out.motivos.push('Comercial u oficial con capacidad instalable > 15 kVA: 4.3.2.1 e'); }
    if (uso === 'industrial' && kVA >= 20) { plena = true; out.motivos.push('Industrial con capacidad instalable ≥ 20 kVA: 4.3.2.1 d'); }
    out.certificacion = plena ? 'Certificación plena: declaraciones del diseñador y del constructor + dictamen de inspección de un organismo acreditado por ONAC'
      : 'Declaración de cumplimiento del constructor (sin dictamen de inspección: 4.3.5 a)';
    out.plena = plena;
    out.documentos = out.diseno.startsWith('Esquema')
      ? ['Esquema constructivo firmado (3.3.2.1): puesta a tierra, medida, tableros, canalizaciones, conductores por tramo, aparatos', 'Cuadro de convenciones conforme con el RETIE', 'Cuadro de cargas por circuito', 'Espacios de montaje', 'Declaración de cumplimiento del constructor (4.3.6.2)', 'Manual de operación y mantenimiento (Título 6)', 'Certificados de los productos utilizados (3.2.2, parágrafo 3)']
      : ['Memorias de cálculo y análisis de riesgos (3.3.1.1 o 3.3.1.2)', 'Planos para construcción y diagramas unifilares', 'Declaración de cumplimiento del diseño (4.3.6.1)', 'Declaración de cumplimiento del constructor (4.3.6.2)', 'Manual de operación y mantenimiento (Título 6)', 'Certificados de los productos (3.2.2, parágrafo 3)'].concat(plena ? ['Dictamen de inspección (Anexo 5 del Libro 4)'] : []);
    return out;
  };

  /* ---------- Iluminación: método de los lúmenes ---------- */
  C.indiceLocal = (Lr, Wr, h) => (Lr * Wr) / (h * (Lr + Wr));
  C.cuDeK = function (K) {
    const T = N.CU_K;
    if (K <= T[0][0]) return T[0][1];
    for (let i = 0; i < T.length - 1; i++) if (K <= T[i + 1][0]) return T[i][1] + ((K - T[i][0]) / (T[i + 1][0] - T[i][0])) * (T[i + 1][1] - T[i][1]);
    return T[T.length - 1][1];
  };
  C.lumenes = function ({ Lr, Wr, h, E, phi, fm = 0.8, cu = null }) {
    const K = C.indiceLocal(Lr, Wr, h);
    const CU = cu || C.cuDeK(K);
    const N0 = (E * Lr * Wr) / (phi * CU * fm);
    const n = Math.max(1, Math.ceil(N0 - 1e-9));
    return { K, CU, N: N0, n, Ereal: (n * phi * CU * fm) / (Lr * Wr) };
  };
  /* Iluminancia directa en un punto del plano de trabajo por una luminaria de flujo phi con
     distribución I(θ) = I0·cos^m θ (m = 1: lambertiana). I0 = phi·(m+1)/(2π). */
  C.eDirecta = function (dx, dy, H, phi, m = 1.2) {
    const d2 = dx * dx + dy * dy + H * H, c = H / Math.sqrt(d2);
    const I0 = (phi * (m + 1)) / (2 * Math.PI);
    return (I0 * Math.pow(c, m) * c) / d2;
  };

  /* ---------- Puesta a tierra ---------- */
  /* Varilla vertical (Dwight): R = ρ/(2πL)·(ln(4L/a) − 1), a = radio */
  C.rVarilla = (rho, Lm, dmm) => (rho / (2 * Math.PI * Lm)) * (Math.log((4 * Lm) / (dmm / 2000)) - 1);
  /* n varillas iguales con corrientes iguales: R = (1/n²)·Σ Rij, Rii = R1, Rij ≈ ρ/(2π dij) */
  C.rVarillas = function (rho, Lm, dmm, pts) {
    const R1 = C.rVarilla(rho, Lm, dmm), n = pts.length;
    let s = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) s += R1;
      else s += rho / (2 * Math.PI * Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
    }
    return { R1, R: s / (n * n) };
  };
  /* Wenner en suelo de dos capas (ρ1 sobre ρ2, espesor h): resistividad aparente */
  C.wenner2 = function (a, rho1, rho2, h, nTerm = 200) {
    const K = (rho2 - rho1) / (rho2 + rho1);
    let s = 0;
    for (let n = 1; n <= nTerm; n++) {
      const Kn = Math.pow(K, n), q = (2 * n * h) / a;
      s += Kn / Math.sqrt(1 + q * q) - Kn / Math.sqrt(4 + q * q);
      if (Math.abs(Kn) < 1e-9) break;
    }
    return rho1 * (1 + 4 * s);
  };
  /* Caída de potencial (electrodo hemisférico equivalente): resistencia aparente con la sonda
     de tensión a x metros y la de corriente a D metros. */
  C.caidaPotencial = function (x, D, rho, Rtrue) {
    const req = rho / (2 * Math.PI * Rtrue);
    const xx = Math.max(req, Math.min(x, D - req));
    return (rho / (2 * Math.PI)) * (1 / req - 1 / D - 1 / xx + 1 / (D - xx));
  };

  /* ---------- Utilidades geométricas ---------- */
  C.dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  C.manhattan = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  C.areaPoly = function (p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
  C.perimetro = function (p) { let s = 0; for (let i = 0; i < p.length; i++) s += C.dist(p[i], p[(i + 1) % p.length]); return s; };
  /* Distancia de un punto a un segmento */
  C.distSeg = function (p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  /* Distancia de un punto a un rectángulo [x0,y0,x1,y1] (0 si está dentro) */
  C.distRect = (p, r) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[2]), Math.max(r[1] - p[1], 0, p[1] - r[3]));
  /* Intersección de un segmento con un rectángulo: devuelve el tramo [t0,t1] o null */
  C.segRect = function (a, b, r) {
    let t0 = 0, t1 = 1;
    const d = [b[0] - a[0], b[1] - a[1]];
    const clip = (p, q) => {
      if (Math.abs(p) < 1e-12) return q >= 0;
      const t = q / p;
      if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
      return true;
    };
    if (clip(-d[0], a[0] - r[0]) && clip(d[0], r[2] - a[0]) && clip(-d[1], a[1] - r[1]) && clip(d[1], r[3] - a[1])) return t1 >= t0 ? [t0, t1] : null;
    return null;
  };

  /* ---------- Formato ---------- */
  C.fmt = function (x, d = 1) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    const s = x.toFixed(d);
    const [ent, dec] = s.split('.');
    const e = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (dec ? e + ',' + dec : e).replace('-', '−');
  };
})(typeof window !== 'undefined' ? window : globalThis);
