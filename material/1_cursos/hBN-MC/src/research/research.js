/**
 * research.js — Herramientas de investigación de hBN-MC (pestaña INV).
 *
 * Contenido:
 *   1. Álgebra lineal mínima (eliminación gaussiana con pivoteo).
 *   2. Conjunto de datos DFT de la tesis (20 estructuras de Mazzoni, §5.2).
 *   3. Reajuste por mínimos cuadrados con covarianza, errores estándar y
 *      validación cruzada leave-one-out (PRESS).
 *   4. Energética de poros por forma y tamaño frente al potencial químico.
 *   5. Calibración de ε_CH (ε_XC) a partir de nanocintas SIESTA.
 *   6. Diagnóstico de la escala energética de los movimientos MC.
 *   7. Análisis de la estructura actual (poros, orden de corto alcance).
 *   8. Barrido de temperatura con réplicas independientes o intercambio de
 *      réplicas (parallel tempering) y capacidad calorífica por fluctuaciones.
 *   9. Interfaz de la pestaña INV.
 *
 * Las funciones de cálculo (secciones 1–8) no tocan el DOM y se validan en
 * tests/validacion_investigacion.js. Dependen del estado global de core.js.
 */
'use strict';

// ============================================================================
// 1. ÁLGEBRA LINEAL
// ============================================================================

/**
 * Invierte una matriz cuadrada por Gauss-Jordan con pivoteo parcial.
 *
 * @param {number[][]} A Matriz n×n.
 * @returns {number[][]|null} Inversa, o null si la matriz es singular.
 */
function researchMatInverse(A) {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-12) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    const d = M[c][c];
    for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((row) => row.slice(n));
}

// ============================================================================
// 2. DATOS DFT DE LA TESIS
// ============================================================================
// Matriz del §5.2 de la tesis (20 estructuras BxCyNz de Mazzoni et al., celdas
// de 8 átomos, SIESTA). Se usa la MATRIZ y no la Tabla 5.2 impresa: esta
// última tiene erratas en las filas (o)–(r) (sus enlaces no suman 12).
// Todas las filas cumplen Σ enlaces = 12 y dan números enteros de átomos.
const MAZZONI_DATASET = Object.freeze([
  { id: 'a', n: { CC: 1, CN: 4, CB: 0, NN: 1, NB: 6, BB: 0 }, E: -1649.24 },
  { id: 'b', n: { CC: 2, CN: 2, CB: 0, NN: 2, NB: 6, BB: 0 }, E: -1647.83 },
  { id: 'c', n: { CC: 1, CN: 0, CB: 4, NN: 0, NB: 6, BB: 1 }, E: -1295.23 },
  { id: 'd', n: { CC: 2, CN: 0, CB: 2, NN: 0, NB: 6, BB: 2 }, E: -1296.01 },
  { id: 'e', n: { CC: 2, CN: 4, CB: 4, NN: 0, NB: 2, BB: 0 }, E: -1411.99 },
  { id: 'f', n: { CC: 4, CN: 2, CB: 2, NN: 0, NB: 4, BB: 0 }, E: -1411.99 },
  { id: 'g', n: { CC: 2, CN: 4, CB: 4, NN: 0, NB: 2, BB: 0 }, E: -1411.15 },
  { id: 'h', n: { CC: 5, CN: 1, CB: 1, NN: 0, NB: 5, BB: 0 }, E: -1412.55 },
  { id: 'i', n: { CC: 1, CN: 2, CB: 2, NN: 0, NB: 7, BB: 0 }, E: -1475.71 },
  { id: 'j', n: { CC: 2, CN: 1, CB: 1, NN: 0, NB: 8, BB: 0 }, E: -1475.67 },
  { id: 'k', n: { CC: 2, CN: 2, CB: 0, NN: 2, NB: 6, BB: 0 }, E: -1649.08 },
  { id: 'l', n: { CC: 2, CN: 0, CB: 2, NN: 0, NB: 6, BB: 2 }, E: -1295.96 },
  { id: 'm', n: { CC: 4, CN: 2, CB: 2, NN: 0, NB: 4, BB: 0 }, E: -1411.17 },
  { id: 'n', n: { CC: 4, CN: 2, CB: 2, NN: 0, NB: 4, BB: 0 }, E: -1412.53 },
  { id: 'o', n: { CC: 5, CN: 0, CB: 2, NN: 1, NB: 4, BB: 0 }, E: -1410.33 },
  { id: 'p', n: { CC: 5, CN: 2, CB: 0, NN: 0, NB: 4, BB: 1 }, E: -1410.67 },
  { id: 'q', n: { CC: 2, CN: 0, CB: 2, NN: 1, NB: 7, BB: 0 }, E: -1472.85 },
  { id: 'r', n: { CC: 2, CN: 2, CB: 0, NN: 0, NB: 7, BB: 1 }, E: -1473.22 },
  { id: 's', n: { CC: 0, CN: 3, CB: 3, NN: 0, NB: 6, BB: 0 }, E: -1473.14 },
  { id: 't', n: { CC: 0, CN: 3, CB: 3, NN: 0, NB: 6, BB: 0 }, E: -1473.81 },
].map((r) => Object.freeze({ ...r, nAtoms: 8, source: 'Tesis 2019 §5.2 (Mazzoni)' })));

// Claves de parámetros que puede estimar el ajuste, en el orden de la tabla.
const FIT_PARAM_KEYS = Object.freeze(['NN', 'NB', 'BB', 'CC', 'CN', 'CB', 'XN', 'XB', 'XC']);

/**
 * Número de átomos de cada especie implicado por los conteos de enlaces
 * (cada átomo tiene coordinación 3; un enlace X–α es un H de pasivación).
 *
 * @param {object} n Conteos {NN, NB, BB, CC, CN, CB, XN, XB, XC}.
 * @returns {{N:number,B:number,C:number,H:number,integer:boolean}}
 */
function atomsFromBondCounts(n) {
  const g = (k) => +n[k] || 0;
  const N = (2 * g('NN') + g('NB') + g('CN') + g('XN')) / 3;
  const B = (2 * g('BB') + g('NB') + g('CB') + g('XB')) / 3;
  const C = (2 * g('CC') + g('CN') + g('CB') + g('XC')) / 3;
  const H = g('XN') + g('XB') + g('XC');
  const isInt = (v) => Math.abs(v - Math.round(v)) < 1e-9;
  return { N, B, C, H, integer: isInt(N) && isInt(B) && isInt(C) };
}

// ============================================================================
// 3. REAJUSTE POR MÍNIMOS CUADRADOS
// ============================================================================

/**
 * Ajusta E_i = Σ_k n_ik ε_k por mínimos cuadrados ordinarios.
 *
 * Los parámetros no libres se fijan (valor de opts.fixed o, si falta, el valor
 * activo del modelo) y su contribución se resta de E antes del ajuste.
 *
 * @param {Array<{id:string,n:object,E:number,nAtoms?:number}>} rows Estructuras.
 * @param {{free?:string[], fixed?:object}} opts Parámetros libres y fijos.
 * @returns {object} Parámetros, errores estándar, covarianza, correlación,
 *   residuos, RSS, RMS, RMS por átomo, R², RMS de validación cruzada LOO.
 */
function fitBondModel(rows, opts = {}) {
  const current = typeof getModelParameters === 'function' ? getModelParameters() : {};
  const used = FIT_PARAM_KEYS.filter((k) => rows.some((r) => (+r.n[k] || 0) !== 0));
  const free = (opts.free && opts.free.length ? opts.free : used).filter((k) => used.includes(k));
  const fixed = {};
  for (const k of used) {
    if (!free.includes(k)) fixed[k] = Number.isFinite(+(opts.fixed || {})[k]) ? +opts.fixed[k] : current[k];
  }

  const nObs = rows.length;
  const p = free.length;
  if (p === 0) return { ok: false, msg: 'no hay parámetros libres' };
  if (nObs <= p) return { ok: false, msg: `se necesitan más estructuras (${nObs}) que parámetros libres (${p})` };

  const X = rows.map((r) => free.map((k) => +r.n[k] || 0));
  const y = rows.map((r) => r.E - Object.entries(fixed).reduce((s, [k, v]) => s + (+r.n[k] || 0) * v, 0));

  const XtX = free.map((_, a) => free.map((__, b) => X.reduce((s, row) => s + row[a] * row[b], 0)));
  const Xty = free.map((_, a) => X.reduce((s, row, i) => s + row[a] * y[i], 0));
  const inv = researchMatInverse(XtX);
  if (!inv) return { ok: false, msg: 'matriz XᵀX singular: los parámetros libres no son identificables con estas estructuras' };

  const beta = inv.map((row) => row.reduce((s, v, j) => s + v * Xty[j], 0));
  const fitted = X.map((row) => row.reduce((s, v, j) => s + v * beta[j], 0));
  const resid = y.map((v, i) => v - fitted[i]);
  const rss = resid.reduce((s, e) => s + e * e, 0);
  const dof = nObs - p;
  const s2 = rss / dof;
  const cov = inv.map((row) => row.map((v) => v * s2));
  const sigma = cov.map((row, i) => Math.sqrt(Math.max(0, row[i])));
  const corr = cov.map((row, i) => row.map((v, j) => v / ((sigma[i] * sigma[j]) || 1)));

  const Eall = rows.map((r) => r.E);
  const Emean = Eall.reduce((a, b) => a + b, 0) / nObs;
  const sst = Eall.reduce((s, e) => s + (e - Emean) ** 2, 0);

  // Validación cruzada leave-one-out exacta mediante la diagonal de la matriz
  // sombrero: e_(i) = e_i / (1 − h_ii).
  const loo = X.map((row, i) => {
    const h = row.reduce((s, v, a) => s + v * row.reduce((t, w, b) => t + inv[a][b] * w, 0), 0);
    return resid[i] / (1 - h);
  });
  const press = loo.reduce((s, e) => s + e * e, 0);

  const perAtom = rows.map((r, i) => resid[i] / (r.nAtoms || 1));
  const params = {};
  const stderr = {};
  free.forEach((k, i) => {
    params[k] = beta[i];
    stderr[k] = sigma[i];
  });

  return {
    ok: true,
    free,
    fixed,
    params,
    stderr,
    cov,
    corr,
    n: nObs,
    p,
    dof,
    residuals: rows.map((r, i) => ({
      id: r.id,
      E: r.E,
      Emodel: r.E - resid[i],
      resid: resid[i],
      residPerAtom: perAtom[i],
      loo: loo[i],
    })),
    rss,
    rms: Math.sqrt(rss / nObs),
    rmsPerAtom: Math.sqrt(perAtom.reduce((s, e) => s + e * e, 0) / nObs),
    maxAbs: Math.max(...resid.map(Math.abs)),
    R2: sst > 0 ? 1 - rss / sst : NaN,
    looRms: Math.sqrt(press / nObs),
  };
}

/**
 * Lee estructuras adicionales en CSV. Cabecera flexible con columnas de
 * conteo (NN, NB|BN, BB, CC, CN, CB, XN|NH, XB|BH, XC|CH), energía (E, E_eV)
 * y opcionalmente id y nAtoms. Las líneas que empiezan por # se ignoran.
 *
 * @param {string} text Contenido CSV.
 * @returns {{rows:Array<object>, errors:string[]}}
 */
function parseFitRowsCSV(text) {
  const alias = { BN: 'NB', NH: 'XN', BH: 'XB', CH: 'XC', E_EV: 'E', ENERGY: 'E', NATOMS: 'nAtoms', ID: 'id' };
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const errors = [];
  if (!lines.length) return { rows: [], errors };
  const head = lines[0].split(/[,;\t]/).map((h) => {
    let u = h.trim();
    if (/^n[A-Za-z]{2}$/.test(u)) u = u.slice(1); // nNN → NN
    u = u.toUpperCase();
    return alias[u] || (FIT_PARAM_KEYS.includes(u) ? u : h.trim());
  });
  const rows = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = lines[li].split(/[,;\t]/).map((c) => c.trim());
    const n = {};
    let E = NaN;
    let id = `u${li}`;
    let nAtoms = null;
    head.forEach((h, j) => {
      const v = Number(String(cells[j] ?? '').replace(',', '.'));
      if (FIT_PARAM_KEYS.includes(h)) n[h] = Number.isFinite(v) ? v : 0;
      else if (h === 'E') E = v;
      else if (h === 'id' && cells[j]) id = cells[j];
      else if (h === 'nAtoms' && Number.isFinite(v)) nAtoms = v;
    });
    if (!Number.isFinite(E)) {
      errors.push(`línea ${li + 1}: energía no numérica`);
      continue;
    }
    const at = atomsFromBondCounts(n);
    if (!at.integer) errors.push(`línea ${li + 1} (${id}): los conteos implican átomos no enteros (N=${at.N.toFixed(2)}, B=${at.B.toFixed(2)}, C=${at.C.toFixed(2)})`);
    rows.push({ id, n, E, nAtoms: nAtoms || (at.N + at.B + at.C + at.H) || 1, source: 'usuario' });
  }
  return { rows, errors };
}

// ============================================================================
// 4. ENERGÉTICA DE POROS POR FORMA
// ============================================================================

/**
 * Ejecuta fn con una copia aislada del estado de red y la restaura después,
 * de modo que los análisis no alteran la simulación del usuario.
 *
 * @param {Function} fn Función a ejecutar.
 * @returns {*} Valor devuelto por fn.
 */
function withLatticeSnapshot(fn) {
  const snap = {
    G, Nx, Ny, PNB, ready, E, T, latticeOrient, latticeStart, pbcX, pbcY, hPass,
    GX, GY, SCALE, accepted, rejected, step,
    IMPORTED_GRID, IMPORTED_META, IMPORTED_H_SITES, CUSTOM_PNB, CUSTOM_POSITIONS, CUSTOM_OPEN_VALENCE,
  };
  try {
    return fn();
  } finally {
    G = snap.G; Nx = snap.Nx; Ny = snap.Ny; PNB = snap.PNB; ready = snap.ready; E = snap.E; T = snap.T;
    latticeOrient = snap.latticeOrient; latticeStart = snap.latticeStart; pbcX = snap.pbcX; pbcY = snap.pbcY;
    hPass = snap.hPass; GX = snap.GX; GY = snap.GY; SCALE = snap.SCALE;
    accepted = snap.accepted; rejected = snap.rejected; step = snap.step;
    IMPORTED_GRID = snap.IMPORTED_GRID; IMPORTED_META = snap.IMPORTED_META; IMPORTED_H_SITES = snap.IMPORTED_H_SITES;
    CUSTOM_PNB = snap.CUSTOM_PNB; CUSTOM_POSITIONS = snap.CUSTOM_POSITIONS; CUSTOM_OPEN_VALENCE = snap.CUSTOM_OPEN_VALENCE;
  }
}

const PORE_SHAPES = Object.freeze([
  { opc: 10, key: 'triN', label: 'Triángulo borde N' },
  { opc: 11, key: 'triB', label: 'Triángulo borde B' },
  { opc: 12, key: 'parA', label: 'Paralelogramo A' },
  { opc: 13, key: 'parB', label: 'Paralelogramo B' },
  { opc: 14, key: 'hex', label: 'Hexágono NH=BH' },
]);

/**
 * Construye cada poro geométrico (opc 10–14) para varios tamaños sobre una
 * red periódica aislada y calcula su energía de formación en los extremos y
 * el punto medio de la ventana química.
 *
 * E_form depende linealmente de μ_N: E_form(μ_N) = E_form(μ_N,0) + (n_B − n_N)·(μ_N − μ_N,0),
 * donde n_B, n_N son los átomos que quedan en la celda.
 *
 * @param {{N?:number, orient?:string, sizes?:number[]}} opts Opciones.
 * @returns {{rows:Array<object>, window:object}}
 */
function poreShapeEnergetics(opts = {}) {
  const N = Math.max(18, Math.min(60, (opts.N || 40) & ~1));
  const orient = opts.orient === 'ZZ' ? 'ZZ' : 'AC';
  const sizes = (opts.sizes && opts.sizes.length ? opts.sizes : [1, 2, 3, 4, 5]).filter((s) => s >= 1 && s <= Math.floor(N / 3));
  const w = chemicalWindow(FORM_DMU_H);
  const saveMu = { b: FORM_MU_B, n: FORM_MU_N, h: FORM_MU_H };
  const rows = [];

  withLatticeSnapshot(() => {
    BUILDGRID_HEADLESS = true;
    Nx = N; Ny = N; latticeOrient = orient; latticeStart = 'B'; pbcX = true; pbcY = true; hPass = true;
    IMPORTED_GRID = null; IMPORTED_META = null; IMPORTED_H_SITES = []; CUSTOM_PNB = null; CUSTOM_POSITIONS = null; CUSTOM_OPEN_VALENCE = null;
    buildGrid(1, 0, 1);
    buildPhysNB();
    try {
      for (const shape of PORE_SHAPES) {
        for (const sz of sizes) {
          buildGrid(shape.opc, 0, sz);
          const cl = getPoreClusters();
          const cls = cl.length ? classifyPoreCluster(cl[0]) : null;
          const counts = getSpeciesCounts();
          const at = (muN) => {
            FORM_MU_H = w.muH;
            FORM_MU_N = muN;
            FORM_MU_B = w.muBN - muN;
            return calcFormationEnergyDFTLike();
          };
          const fN = at(w.muNmax);
          const fB = at(w.muNmin);
          const fM = at((w.muNmax + w.muNmin) / 2);
          rows.push({
            shape: shape.key,
            label: shape.label,
            size: sz,
            nVac: counts.nV,
            nClusters: cl.length,
            nH: fN.nH,
            edgeN: cls ? cls.nBorderN : 0,
            edgeB: cls ? cls.nBorderB : 0,
            compactness: cls ? cls.compactness : null,
            removedN: N * N / 2 - counts.nN,
            removedB: N * N / 2 - counts.nB,
            slope: counts.nB - counts.nN,
            EformNrich: fN.Eform,
            EformBrich: fB.Eform,
            EformMid: fM.Eform,
            EHH: fN.EHH,
          });
        }
      }
    } finally {
      FORM_MU_B = saveMu.b; FORM_MU_N = saveMu.n; FORM_MU_H = saveMu.h;
      BUILDGRID_HEADLESS = false;
    }
  });

  return { rows, window: w, N, orient };
}

// ============================================================================
// 5. CALIBRACIÓN DE ε_CH CON NANOCINTAS SIESTA
// ============================================================================

/**
 * Calcula ε_XC (ε_CH) a partir de la energía DFT de una nanocinta de grafeno
 * pasivada con H (enlaces C–C y C–H únicamente).
 *
 * Ruta directa (dentro del modelo):   ε_XC = [E(cinta+H) − n_CC·ε_CC] / n_CH
 * Se informa con ε_CC del ajuste (Tabla 5.8) y con E(C2)/3 (misma convención
 * con que se derivaron ε_XN y ε_XB), porque la diferencia es la incertidumbre
 * de escala D3.
 * Ruta indirecta (si se da la cinta desnuda con la misma red de C):
 *   ΔE_hidrog = [E(cinta+H) − E(cinta) − n_H·E(H2)/2] / n_H
 *   ε_XC      = ΔE_hidrog + E(H2)/2 + ε_CC/2
 * ADVERTENCIA: ΔE_hidrog (≈ −1 a −2.5 eV) NO es ε_XC; insertarlo directamente
 * en el modelo rompe la escala por un factor ~40.
 *
 * @param {{E_H:number,nC:number,nH:number,nCC?:number,E_bare?:number,EH2?:number}} d Datos.
 * @returns {object} Resultado con ambas rutas y controles de sanidad.
 */
function calibrateEpsXCFromRibbon(d) {
  const E_H = +d.E_H;
  const nC = +d.nC;
  const nH = +d.nH;
  const EH2 = Number.isFinite(+d.EH2) && +d.EH2 !== 0 ? +d.EH2 : E_MOL.H2;
  if (!Number.isFinite(E_H) || !(nC > 0) || !(nH > 0)) return { ok: false, msg: 'faltan E(cinta+H), n_C o n_H' };
  const nCCauto = (3 * nC - nH) / 2;
  const nCC = Number.isFinite(+d.nCC) && +d.nCC > 0 ? +d.nCC : nCCauto;
  const warnings = [];
  if (Math.abs(nCCauto - Math.round(nCCauto)) > 1e-9) warnings.push('3·n_C − n_H es impar: hay valencias sin H (enlaces colgantes) que el modelo no describe.');
  if (Math.abs(nCC - nCCauto) > 1e-9) warnings.push(`n_CC=${nCC} difiere de (3n_C − n_H)/2 = ${nCCauto}: la cinta tiene enlaces colgantes.`);

  const epsCCfit = PARAMS_TESIS_2019.CC;
  const epsCCdiat = E_MOL.CC / 3;
  const direct = {
    lsq: (E_H - nCC * epsCCfit) / nH,
    diat: (E_H - nCC * epsCCdiat) / nH,
  };
  let indirect = null;
  if (Number.isFinite(+d.E_bare) && +d.E_bare !== 0) {
    const dEh = (E_H - +d.E_bare - nH * EH2 / 2) / nH;
    indirect = {
      dEhydro: dEh,
      eps: dEh + EH2 / 2 + EPS_CC / 2,
      sane: dEh >= -2.5 && dEh <= -1.0,
    };
    if (!indirect.sane) warnings.push(`ΔE_hidrog = ${dEh.toFixed(3)} eV fuera de [−2.5, −1.0]: revisa conteos o convergencia.`);
  }
  for (const [lab, v] of [['directo (ε_CC ajuste)', direct.lsq], ['directo (E(C2)/3)', direct.diat]]) {
    const dh = hydrogenationEnergyFromEps(v, 'C');
    if (dh < -2.6 || dh > -0.9) warnings.push(`${lab}: ε_XC = ${v.toFixed(3)} eV implica ΔE_hidrog = ${dh.toFixed(3)} eV, fuera del rango físico.`);
  }
  return { ok: true, nCC, nCCauto, direct, indirect, warnings, epsCCfit, epsCCdiat };
}

// ============================================================================
// 6. ESCALA ENERGÉTICA DE LOS MOVIMIENTOS MC
// ============================================================================

/**
 * Enumera todos los intercambios locales permitidos en la configuración
 * actual y resume la distribución de ΔE. Permite saber si a una temperatura
 * dada el sistema está congelado (ningún movimiento accesible) o activo.
 *
 * @param {number[]} temps Temperaturas en K para estimar la tasa de aceptación.
 * @returns {object|null} Estadísticas de ΔE y aceptación esperada.
 */
function energyScaleDiagnostics(temps = [1000, 3000, 5000, 10000, 20000]) {
  if (!ready || !PNB || !PNB.length) return null;
  const dEs = [];
  const byType = {};
  for (let k = 0; k < Nx * Ny; k++) {
    for (const [ni, nj] of PNB[k] || []) {
      const nk = idx(ni, nj);
      if (nk <= k || !mcPairAllowed(k, nk)) continue;
      const i1 = (k / Nx) | 0;
      const j1 = k % Nx;
      const dE = calcDeltaE(i1, j1, ni, nj);
      dEs.push(dE);
      const key = typePairKey(G[k], G[nk]);
      (byType[key] = byType[key] || []).push(dE);
    }
  }
  if (!dEs.length) return { n: 0, byType: {}, acceptance: [] };
  const sorted = dEs.slice().sort((a, b) => a - b);
  const q = (f) => sorted[Math.min(sorted.length - 1, Math.floor(f * (sorted.length - 1)))];
  const positive = sorted.filter((v) => v > 1e-9);
  const acceptance = temps.map((Tk) => ({
    T: Tk,
    meanAcc: dEs.reduce((s, v) => s + (v <= 0 ? 1 : Math.exp(-v / (KB * Tk))), 0) / dEs.length,
  }));
  const summarize = (arr) => {
    const s = arr.slice().sort((a, b) => a - b);
    return { n: s.length, min: s[0], median: s[Math.floor((s.length - 1) / 2)], max: s[s.length - 1] };
  };
  const types = {};
  for (const [k, arr] of Object.entries(byType)) types[k] = summarize(arr);
  return {
    n: dEs.length,
    nNeg: dEs.filter((v) => v < -1e-9).length,
    min: sorted[0],
    p10: q(0.1),
    median: q(0.5),
    max: sorted[sorted.length - 1],
    minPositive: positive.length ? positive[0] : null,
    // Temperatura a la que el movimiento positivo más barato se acepta con p = 10⁻³.
    T_minPos_1e3: positive.length ? positive[0] / (KB * Math.log(1000)) : null,
    T_median_1e3: sorted[Math.floor((sorted.length - 1) / 2)] > 0 ? q(0.5) / (KB * Math.log(1000)) : null,
    acceptance,
    byType: types,
    edge: edgeEnergyPerHydrogen(),
  };
}

// ============================================================================
// 7. ANÁLISIS DE LA ESTRUCTURA ACTUAL
// ============================================================================

/**
 * Parámetros de orden de la configuración actual.
 *
 * α_C (Warren–Cowley para C) = 1 − P(vecino no-C | C) / (1 − x_C):
 *   0 → distribución aleatoria; > 0 → segregación; < 0 → alternancia.
 * f_BN = fracción de enlaces heteronucleares entre los enlaces B/N.
 *
 * @returns {{alphaC:number|null, fBN:number|null, xC:number}}
 */
function shortRangeOrder() {
  const bc = countBonds();
  const c = getSpeciesCounts();
  const xC = c.nAtoms ? c.nC / c.nAtoms : 0;
  const cNeighbors = 2 * bc.cCC + bc.cCN + bc.cCB;
  const alphaC = (c.nC > 0 && xC < 1 && cNeighbors > 0)
    ? 1 - ((bc.cCN + bc.cCB) / cNeighbors) / (1 - xC)
    : null;
  const bnBonds = bc.cNB + bc.cNN + bc.cBB;
  return { alphaC, fBN: bnBonds ? bc.cNB / bnBonds : null, xC };
}

/**
 * Describe todos los poros de la configuración actual.
 *
 * @returns {{pores:Array<object>, sro:object, counts:object}}
 */
function analyzeCurrentStructure() {
  if (!ready) return null;
  const pores = getPoreClusters().map((cl, i) => {
    const c = classifyPoreCluster(cl) || {};
    return {
      id: i + 1,
      nVac: cl.length,
      shape: c.key || 'irregular',
      term: c.termLabel || '—',
      edgeN: c.nBorderN || 0,
      edgeB: c.nBorderB || 0,
      compactness: c.compactness ?? null,
      aspect: c.ratio ?? null,
    };
  });
  return { pores, sro: shortRangeOrder(), counts: getSpeciesCounts() };
}

// ============================================================================
// 8. BARRIDO DE TEMPERATURA E INTERCAMBIO DE RÉPLICAS
// ============================================================================
let SWEEP_ACTIVE = false;
let SWEEP_ABORT = false;
let SWEEP_RESULT = null;

/**
 * Observables de muestreo de la configuración cargada en G.
 * @returns {object}
 */
function sweepSampleObservables() {
  const bc = countBonds();
  const cl = getPoreClusters();
  let largest = null;
  if (cl.length) largest = classifyPoreCluster(cl[0]);
  const sro = shortRangeOrder();
  const edgeTot = largest ? (largest.nBorderN + largest.nBorderB) : 0;
  return {
    cNB: bc.cNB,
    nPores: cl.length,
    largest: cl.length ? cl[0].length : 0,
    shape: largest ? largest.key : 'sin-poro',
    edgeNfrac: edgeTot ? largest.nBorderN / edgeTot : null,
    alphaC: sro.alphaC,
    fBN: sro.fBN,
  };
}

/**
 * Barrido de temperatura sobre la estructura actual. Cada temperatura tiene
 * una réplica que parte de la misma configuración. En modo 'pt' cada
 * `swapEvery` pasos se intentan intercambios entre temperaturas vecinas con
 * probabilidad min(1, exp[(β_i − β_j)(E_i − E_j)]) (Swendsen–Wang 1986,
 * Hukushima–Nemoto 1996), lo que ayuda a escapar de mínimos locales.
 *
 * Tras descartar la fracción `eqFrac` de pasos se toman `nSamples` muestras
 * por réplica: ⟨E⟩, σ_E, C_v/k_B = Var(E)/(k_B T)², tasa de aceptación,
 * enlaces N–B, número y tamaño de poros, forma del poro mayor, fracción de
 * borde N y α_C.
 *
 * El estado del usuario (G, E, T, contadores) se restaura al terminar.
 *
 * @param {object} o Opciones {temps, steps, mode:'indep'|'pt', swapEvery, eqFrac, nSamples, seed}.
 * @param {Function} [onProgress] Callback (fracción, texto).
 * @returns {Promise<object|null>} Resultado o null si se canceló.
 */
async function runTemperatureSweep(o, onProgress) {
  if (!ready) throw new Error('red no inicializada');
  if (SWEEP_ACTIVE) throw new Error('ya hay un barrido en curso');
  if (typeof run !== 'undefined' && run) throw new Error('detén la simulación interactiva primero');
  if (typeof batchActive !== 'undefined' && batchActive) throw new Error('hay un lote en ejecución');

  const temps = (o.temps || []).map(Number).filter((t) => t > 0).sort((a, b) => a - b);
  if (temps.length < 1) throw new Error('lista de temperaturas vacía');
  const steps = Math.max(100, Math.floor(o.steps || 20000));
  const mode = o.mode === 'pt' && temps.length > 1 ? 'pt' : 'indep';
  const swapEvery = Math.max(10, Math.floor(o.swapEvery || 200));
  const eqFrac = Math.min(0.9, Math.max(0, +o.eqFrac || 0.3));
  const nSamples = Math.max(5, Math.floor(o.nSamples || 60));
  const eqSteps = Math.floor(steps * eqFrac);
  const sampleEvery = Math.max(1, Math.floor((steps - eqSteps) / nSamples));
  const carbon = typeof isCarbon !== 'undefined' && isCarbon;
  const globalFrac = usingCustomConstructorGeometry()
    ? ((importedMCPolicy === 'fixed') ? 0 : (globalSwapPct / 100))
    : (carbon ? 0.30 : (globalSwapPct / 100));

  const saved = { G: new Uint8Array(G), E, T, accepted, rejected, step };
  const prevSeed = getRandomSeed();
  const seed = Number.isFinite(+o.seed) && o.seed !== '' && o.seed !== null ? (+o.seed >>> 0) : ((Date.now() % 2147483647) >>> 0);
  setRandomSeed(seed);

  const E0 = calcFullE();
  const reps = temps.map((Tk) => ({
    T: Tk, G: new Uint8Array(saved.G), E: E0, acc: 0, rej: 0,
    sE: [], sE2: 0, obs: [],
  }));
  const swaps = temps.slice(0, -1).map(() => ({ tried: 0, ok: 0 }));

  SWEEP_ACTIVE = true;
  SWEEP_ABORT = false;
  const load = (r) => { G = r.G; E = r.E; T = r.T; accepted = r.acc; rejected = r.rej; };
  const store = (r) => { r.E = E; r.acc = accepted; r.rej = rejected; };

  try {
    let s = 0;
    let lastYield = Date.now();
    let parity = 0;
    while (s < steps) {
      if (SWEEP_ABORT) return null;
      const block = Math.min(mode === 'pt' ? swapEvery : 2000, steps - s);
      for (const r of reps) {
        load(r);
        for (let b = 0; b < block; b++) {
          const cur = s + b;
          if (globalFrac > 0 && rand() < globalFrac) metro_global(); else metro();
          if (cur >= eqSteps && (cur - eqSteps) % sampleEvery === 0 && r.obs.length < nSamples) {
            r.sE.push(E);
            r.obs.push(sweepSampleObservables());
          }
        }
        store(r);
      }
      s += block;
      if (mode === 'pt') {
        for (let i = parity; i < reps.length - 1; i += 2) {
          const a = reps[i];
          const b = reps[i + 1];
          const arg = (1 / (KB * a.T) - 1 / (KB * b.T)) * (a.E - b.E);
          swaps[i].tried++;
          if (arg >= 0 || rand() < Math.exp(arg)) {
            // Se intercambian configuraciones; cada réplica conserva su T.
            [a.G, b.G] = [b.G, a.G];
            [a.E, b.E] = [b.E, a.E];
            swaps[i].ok++;
          }
        }
        parity ^= 1;
      }
      if (Date.now() - lastYield > 40) {
        if (onProgress) onProgress(s / steps, `paso ${s.toLocaleString()} / ${steps.toLocaleString()}`);
        await new Promise((res) => setTimeout(res, 0));
        lastYield = Date.now();
      }
    }

    const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const results = reps.map((r) => {
      const eMean = mean(r.sE);
      const varE = r.sE.length > 1 ? r.sE.reduce((acc, e) => acc + (e - eMean) ** 2, 0) / (r.sE.length - 1) : 0;
      const shapes = {};
      for (const ob of r.obs) shapes[ob.shape] = (shapes[ob.shape] || 0) + 1;
      const num = (k) => mean(r.obs.map((ob) => ob[k]).filter((v) => v !== null && Number.isFinite(v)));
      return {
        T: r.T,
        nSamples: r.sE.length,
        Emean: eMean,
        Estd: Math.sqrt(varE),
        CvkB: varE / (KB * r.T) ** 2,
        accPct: r.acc / Math.max(1, r.acc + r.rej) * 100,
        cNB: num('cNB'),
        nPores: num('nPores'),
        largest: num('largest'),
        edgeNfrac: num('edgeNfrac'),
        alphaC: num('alphaC'),
        fBN: num('fBN'),
        shapes,
        Efinal: r.E,
        Gfinal: new Uint8Array(r.G),
      };
    });
    SWEEP_RESULT = {
      date: new Date().toISOString(), seed, mode, steps, eqSteps, sampleEvery, swapEvery, globalFrac,
      Nx, Ny, orient: latticeOrient, pbc: (pbcX && pbcY) ? 'XY' : pbcX ? 'X' : pbcY ? 'Y' : 'none',
      results,
      swaps: swaps.map((w, i) => ({ Ta: temps[i], Tb: temps[i + 1], tried: w.tried, accPct: w.tried ? w.ok / w.tried * 100 : null })),
    };
    return SWEEP_RESULT;
  } finally {
    G = saved.G; E = saved.E; T = saved.T; accepted = saved.accepted; rejected = saved.rejected; step = saved.step;
    setRandomSeed(prevSeed);
    SWEEP_ACTIVE = false;
  }
}

/**
 * CSV autosuficiente del último barrido.
 * @returns {string}
 */
function temperatureSweepCSV(res = SWEEP_RESULT) {
  if (!res) return '';
  const shapeKeys = ['triangle', 'parallelogram', 'hexagon', 'irregular', 'sin-poro'];
  const head = [
    `# ${HBN_APP_NAME} v${HBN_VERSION} — barrido de temperatura (${res.mode === 'pt' ? 'intercambio de réplicas' : 'réplicas independientes'})`,
    `# Fecha: ${res.date}  semilla=${res.seed}  pasos_por_replica=${res.steps}  equilibrado=${res.eqSteps}  muestreo_cada=${res.sampleEvery}  intercambio_cada=${res.swapEvery}`,
    `# Red=${res.Nx}x${res.Ny}  orient=${res.orient}  PBC=${res.pbc}  global_frac=${res.globalFrac}`,
    ...(typeof batchParameterBlock === 'function' ? batchParameterBlock() : []),
    '#',
    `T_K,n_muestras,E_media_eV,E_sigma_eV,Cv_kB,aceptacion_pct,cNB_medio,n_poros_medio,poro_mayor_medio,frac_borde_N,alpha_C,f_BN,${shapeKeys.map((k) => 'frac_' + k).join(',')},E_final_eV`,
  ];
  const f = (v, d) => (v !== null && v !== undefined && Number.isFinite(v) ? v.toFixed(d) : '');
  const rows = res.results.map((r) => [
    r.T, r.nSamples, f(r.Emean, 6), f(r.Estd, 6), f(r.CvkB, 4), f(r.accPct, 4), f(r.cNB, 2), f(r.nPores, 3), f(r.largest, 2),
    f(r.edgeNfrac, 4), f(r.alphaC, 4), f(r.fBN, 4),
    ...shapeKeys.map((k) => f((r.shapes[k] || 0) / Math.max(1, r.nSamples), 4)),
    f(r.Efinal, 6),
  ].join(','));
  const sw = res.swaps.length && res.mode === 'pt'
    ? ['#', '# --- Aceptación de intercambios entre temperaturas vecinas ---', 'T_a_K,T_b_K,intentos,aceptacion_pct',
      ...res.swaps.map((s) => [s.Ta, s.Tb, s.tried, f(s.accPct, 3)].join(','))]
    : [];
  return [...head, ...rows, ...sw].join('\n');
}

// ============================================================================
// 9. INTERFAZ (pestaña INV)
// ============================================================================
let RESEARCH_LAST_FIT = null;
let RESEARCH_LAST_PORES = null;

/** Escapa texto para insertarlo en HTML. */
function rEsc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** Formatea números con signo menos tipográfico. */
function rNum(v, d = 3) {
  return v === null || v === undefined || !Number.isFinite(v) ? '—' : v.toFixed(d).replace('-', '−');
}

/**
 * Dibuja series (x, y) en un canvas con ejes simples.
 *
 * @param {HTMLCanvasElement} c Canvas.
 * @param {Array<{name:string,color:string,xs:number[],ys:number[]}>} series Series.
 * @param {string} xl Etiqueta del eje x.
 * @param {string} yl Etiqueta del eje y.
 */
function researchDrawChart(c, series, xl, yl) {
  if (!c || !c.getContext) return;
  const W = c.parentElement ? (c.parentElement.clientWidth || 300) : 300;
  const H = +c.getAttribute('height') || 170;
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  const pts = series.flatMap((s) => s.xs.map((v, i) => [v, s.ys[i]])).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (!pts.length) return;
  let [xmn, xmx] = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))];
  let [ymn, ymx] = [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
  if (xmx === xmn) { xmx += 1; xmn -= 1; }
  if (ymx === ymn) { ymx += 1; ymn -= 1; }
  // Leyenda en varias líneas si no cabe en una.
  x.font = '10px sans-serif';
  const legend = [];
  let lx0 = 56;
  let row = 0;
  for (const s of series) {
    const w = x.measureText('■ ' + s.name).width + 10;
    if (lx0 + w > W - 6 && lx0 > 56) { row++; lx0 = 56; }
    legend.push({ s, x: lx0, y: 12 + row * 12 });
    lx0 += w;
  }
  const pl = 52, pr = 10, pt = 18 + row * 12, pb = 30;
  const px = (v) => pl + (W - pl - pr) * (v - xmn) / (xmx - xmn);
  const py = (v) => pt + (H - pt - pb) * (1 - (v - ymn) / (ymx - ymn));
  x.strokeStyle = '#e2e8f0'; x.lineWidth = 1;
  for (let g = 0; g <= 4; g++) { const yy = pt + (H - pt - pb) * g / 4; x.beginPath(); x.moveTo(pl, yy); x.lineTo(W - pr, yy); x.stroke(); }
  x.fillStyle = '#64748b'; x.font = '10px sans-serif';
  x.textAlign = 'right';
  for (let g = 0; g <= 4; g++) { const v = ymx - (ymx - ymn) * g / 4; x.fillText(rNum(v, Math.abs(ymx - ymn) < 10 ? 2 : 0), pl - 4, pt + (H - pt - pb) * g / 4 + 3); }
  // Extremos del eje x alineados hacia dentro para que no se recorten.
  x.textAlign = 'left'; x.fillText(rNum(xmn, 0), pl, H - 16);
  x.textAlign = 'right'; x.fillText(rNum(xmx, 0), W - pr, H - 16);
  x.textAlign = 'center';
  x.fillText(xl, (pl + W - pr) / 2, H - 4);
  x.save(); x.translate(10, (pt + H - pb) / 2); x.rotate(-Math.PI / 2); x.fillText(yl, 0, 0); x.restore();
  for (const s of series) {
    x.strokeStyle = s.color; x.fillStyle = s.color; x.lineWidth = 1.8;
    x.beginPath();
    let first = true;
    s.xs.forEach((v, i) => {
      if (!Number.isFinite(v) || !Number.isFinite(s.ys[i])) return;
      if (first) { x.moveTo(px(v), py(s.ys[i])); first = false; } else x.lineTo(px(v), py(s.ys[i]));
    });
    x.stroke();
    s.xs.forEach((v, i) => { if (Number.isFinite(v) && Number.isFinite(s.ys[i])) { x.beginPath(); x.arc(px(v), py(s.ys[i]), 2.5, 0, Math.PI * 2); x.fill(); } });
  }
  x.textAlign = 'left'; x.font = '10px sans-serif';
  for (const l of legend) { x.fillStyle = l.s.color; x.fillText('■ ' + l.s.name, l.x, l.y); }
}

/** Guarda texto como archivo mediante saveFile() de core.js. */
function researchSave(name, text, mime = 'text/csv') {
  if (typeof saveFile === 'function') saveFile(name, text, mime);
}

/** Crea una tarjeta plegable de la pestaña INV. */
function researchCard(id, title, badge, desc, body, open = false) {
  return `<div class="pcard rcard${open ? '' : ' compact-collapsed'}" id="${id}">
    <div class="pcard-head" onclick="this.parentElement.classList.toggle('compact-collapsed')">
      <div><div class="pcard-title">${title}</div></div><div class="pcard-badge">${badge}</div>
    </div>
    <div class="pcard-desc">${desc}</div>
    ${body}
  </div>`;
}

/** Construye la pestaña INV. */
function initResearchPanel() {
  const root = document.getElementById('researchRoot');
  if (!root) return;
  const paramRows = FIT_PARAM_KEYS.concat(['XX']).map((k) => {
    const info = PARAM_INFO[k];
    return `<tr><td><b>${info.pair}</b></td>
      <td><input type="number" step="0.0001" class="rin" id="rp_${k}"></td>
      <td class="rmuted">${rNum(PARAMS_TESIS_2019[k], 4)}</td>
      <td class="rmuted" title="${rEsc(info.source)}">${rEsc(info.status)}</td></tr>`;
  }).join('');

  root.innerHTML = [
    researchCard('rcParams', 'Parámetros del modelo', 'ε',
      'Valores por defecto reportados en la tesis Obando–Batista (FIMAT-UFOP, 2019). Editarlos permite análisis de sensibilidad; el conjunto activo queda registrado en todos los CSV y sesiones. Pase el cursor sobre el estado para ver la fuente.',
      `<div class="rscroll"><table class="rtable"><thead><tr><th>Par</th><th>Activo (eV)</th><th>Tesis</th><th>Estado</th></tr></thead><tbody>${paramRows}</tbody></table></div>
       <div class="micro-note" id="rParamSet">—</div>
       <div class="ctrl-mini-actions">
         <button class="btn" onclick="researchApplyParams()">Aplicar</button>
         <button class="btn" onclick="researchResetParams()">Restaurar tesis 2019</button>
         <button class="btn" onclick="researchExportParams()">Exportar CSV</button>
       </div>`, true),
    researchCard('rcFit', 'Reajuste por mínimos cuadrados', 'LSQ',
      'Reproduce el ajuste de la Tabla 5.8 sobre las 20 estructuras de Mazzoni con errores estándar, matriz de correlación y validación cruzada leave-one-out. Se pueden añadir estructuras propias (p. ej. poros o nanocintas SIESTA) para un ajuste global único que resuelva la inconsistencia de escala de ε_NB (D3).',
      `<div class="fi"><label>Estructuras adicionales (CSV: id,NN,NB,BB,CC,CN,CB,XN,XB,XC,E[,nAtoms])</label>
         <textarea id="rFitExtra" rows="3" class="rta" placeholder="id,NB,XN,XB,E&#10;poro_NH_II,342,9,0,-45074.84"></textarea></div>
       <div class="fi"><label>Parámetros libres</label><div id="rFitFree" class="rchecks">${FIT_PARAM_KEYS.map((k) => `<label><input type="checkbox" value="${k}" ${['NN', 'NB', 'BB', 'CC', 'CN', 'CB'].includes(k) ? 'checked' : ''}> ${PARAM_INFO[k].pair}</label>`).join('')}</div></div>
       <div class="ctrl-mini-actions">
         <button class="btn" onclick="researchRunFit()">Ejecutar ajuste</button>
         <button class="btn" onclick="researchApplyFit()">Aplicar resultado al modelo</button>
         <button class="btn" onclick="researchExportFit()">Exportar CSV</button>
       </div>
       <div id="rFitOut" class="rout"></div>`),
    researchCard('rcScale', 'Escala energética y régimen del MC', 'ΔE',
      'Enumera todos los intercambios locales posibles de la configuración actual y calcula su ΔE. Indica si a la temperatura elegida el sistema está congelado y cuánto vale la energía de borde por H con el reservorio activo.',
      `<div class="ctrl-mini-actions"><button class="btn" onclick="researchRunScale()">Analizar configuración actual</button></div>
       <div id="rScaleOut" class="rout"></div>`),
    researchCard('rcPores', 'Energética de poros por forma y tamaño', 'E_form',
      'Construye los poros geométricos 10–14 en una red periódica aislada y calcula E_form en los límites rico en N, rico en B y punto medio (Δμ_H y referencia μ_BN del Paso 4). Es un cálculo T = 0 del propio modelo: identifica la forma de menor energía para cada tamaño y ambiente, sin muestreo MC.',
      `<div class="grid2">
         <div class="fi"><label>Red N×N</label><input type="number" id="rPoreN" value="40" min="18" max="60" step="2"></div>
         <div class="fi"><label>Orientación</label><select id="rPoreOr"><option value="AC">AC</option><option value="ZZ">ZZ</option></select></div>
       </div>
       <div class="fi"><label>Tamaños (anillos)</label><input type="text" id="rPoreSizes" value="1,2,3,4,5"></div>
       <div class="fi"><label>Gráfica para</label><select id="rPoreEnv"><option value="EformNrich">Rico en N</option><option value="EformMid">Punto medio</option><option value="EformBrich">Rico en B</option></select></div>
       <div class="ctrl-mini-actions">
         <button class="btn" onclick="researchRunPores()">Calcular</button>
         <button class="btn" onclick="researchExportPores()">Exportar CSV</button>
       </div>
       <div class="mc" style="height:180px"><canvas id="rPoreChart" height="180"></canvas></div>
       <div id="rPoreOut" class="rout"></div>`),
    researchCard('rcSweep', 'Barrido de temperatura / intercambio de réplicas', 'PT',
      'Una réplica por temperatura, todas desde la estructura actual. En modo intercambio de réplicas (parallel tempering) las configuraciones se intercambian entre temperaturas vecinas para escapar de mínimos locales. Se obtienen ⟨E⟩, C_v por fluctuaciones, aceptación, poros, forma del poro mayor, fracción de borde N y α_C. La estructura del usuario no se modifica.',
      `<div class="fi"><label>Temperaturas (K)</label><input type="text" id="rSwT" value="2000,4000,6000,8000,10000,12000,15000,20000"></div>
       <div class="grid2">
         <div class="fi"><label>Pasos por réplica</label><input type="number" id="rSwSteps" value="40000" min="1000" step="1000"></div>
         <div class="fi"><label>Modo</label><select id="rSwMode"><option value="pt">Intercambio de réplicas</option><option value="indep">Réplicas independientes</option></select></div>
         <div class="fi"><label>Intercambio cada (pasos)</label><input type="number" id="rSwEvery" value="200" min="10" step="10"></div>
         <div class="fi"><label>Fracción de equilibrado</label><input type="number" id="rSwEq" value="0.3" min="0" max="0.9" step="0.05"></div>
         <div class="fi"><label>Muestras por réplica</label><input type="number" id="rSwN" value="60" min="5" step="5"></div>
         <div class="fi"><label>Semilla</label><input type="number" id="rSwSeed" placeholder="aleatoria"></div>
       </div>
       <div class="ctrl-mini-actions">
         <button class="btn" id="rSwRun" onclick="researchRunSweep()">▶ Ejecutar</button>
         <button class="btn" onclick="SWEEP_ABORT=true">⏹ Detener</button>
         <button class="btn" onclick="researchExportSweep()">Exportar CSV</button>
       </div>
       <div class="micro-note" id="rSwProg">—</div>
       <div class="mc" style="height:170px"><canvas id="rSwChartE" height="170"></canvas></div>
       <div class="mc" style="height:170px"><canvas id="rSwChartCv" height="170"></canvas></div>
       <div id="rSwOut" class="rout"></div>`),
    researchCard('rcRibbon', 'Calibración de ε_CH con nanocintas SIESTA', 'C–H',
      'Introduzca las energías SIESTA de las nanocintas pasivadas (y opcionalmente desnudas con la misma red de C). Atención: [E(cinta+H) − E(cinta) − n_H·E(H₂)/2]/n_H es la energía de hidrogenación (≈ −1.7 eV), NO ε_XC; insertarla directamente rompe la escala del modelo.',
      `<div class="grid2">
         <div class="fi"><label>E(AC+H) (eV)</label><input type="number" id="rRbACH" step="0.0001"></div>
         <div class="fi"><label>E(AC desnuda) (eV, opc.)</label><input type="number" id="rRbAC" step="0.0001"></div>
         <div class="fi"><label>n_C AC</label><input type="number" id="rRbACnC" value="24"></div>
         <div class="fi"><label>n_H AC</label><input type="number" id="rRbACnH" value="8"></div>
         <div class="fi"><label>E(ZZ+H) (eV)</label><input type="number" id="rRbZZH" step="0.0001"></div>
         <div class="fi"><label>E(ZZ desnuda) (eV, opc.)</label><input type="number" id="rRbZZ" step="0.0001"></div>
         <div class="fi"><label>n_C ZZ</label><input type="number" id="rRbZZnC" value="24"></div>
         <div class="fi"><label>n_H ZZ</label><input type="number" id="rRbZZnH" value="8"></div>
         <div class="fi"><label>E(H₂) (eV)</label><input type="number" id="rRbH2" value="${E_MOL.H2}" step="0.0001"></div>
       </div>
       <div class="ctrl-mini-actions">
         <button class="btn" onclick="researchRunRibbon()">Calcular</button>
         <button class="btn" onclick="researchApplyRibbon()">Aplicar promedio AC/ZZ (ruta directa)</button>
       </div>
       <div id="rRbOut" class="rout"></div>`),
    researchCard('rcStruct', 'Análisis de la estructura actual', 'SRO',
      'Lista cada poro (tamaño, forma, compacidad, átomos de borde N/B) y los parámetros de orden: α_C de Warren–Cowley para el carbono y fracción de enlaces B–N heteronucleares.',
      `<div class="ctrl-mini-actions"><button class="btn" onclick="researchRunStruct()">Analizar</button><button class="btn" onclick="researchExportStruct()">Exportar CSV</button></div>
       <div id="rStOut" class="rout"></div>`),
  ].join('');
  refreshResearchPanel();
}

/** Sincroniza la tabla de parámetros con el estado del modelo. */
function refreshResearchPanel() {
  const p = getModelParameters();
  p.XX = EPS_XX;
  for (const k of Object.keys(p)) {
    const el = document.getElementById('rp_' + k);
    if (el && document.activeElement !== el) el.value = p[k];
  }
  const lab = document.getElementById('rParamSet');
  if (lab) {
    lab.textContent = MODEL_PARAM_SET === 'tesis2019'
      ? 'Conjunto activo: tesis Obando–Batista 2019 (valores de referencia).'
      : 'Conjunto activo: PERSONALIZADO. Los resultados no corresponden a la parametrización publicada.';
    lab.style.color = MODEL_PARAM_SET === 'tesis2019' ? '#0f766e' : '#b45309';
  }
}

/** Recalcula energía e interfaz tras cambiar parámetros. */
function researchAfterParamChange(msg) {
  const ac = document.getElementById('iEpsCHAC');
  const zz = document.getElementById('iEpsCHZZ');
  const xc = document.getElementById('iEpsXC');
  if (ac) ac.value = EPS_CH_AC.toFixed(2);
  if (zz) zz.value = EPS_CH_ZZ.toFixed(2);
  if (xc) xc.value = EPS_XC.toFixed(2);
  if (typeof readCHCalibrationInputs === 'function') readCHCalibrationInputs(false);
  if (typeof applyChemicalEnvironment === 'function') applyChemicalEnvironment(document.getElementById('iChemEnv')?.value || FORM_CHEM_ENV);
  if (typeof readHydrogenReservoirInputs === 'function') readHydrogenReservoirInputs();
  if (ready) { E = calcFullE(); if (typeof ui === 'function') ui(); if (typeof draw === 'function') draw(); }
  refreshResearchPanel();
  if (typeof addLog === 'function') addLog(msg, MODEL_PARAM_SET === 'tesis2019' ? 'g' : 'w');
  if (typeof reportParameterConsistency === 'function') reportParameterConsistency(true);
}

function researchApplyParams() {
  const vals = {};
  for (const k of FIT_PARAM_KEYS.concat(['XX'])) {
    const el = document.getElementById('rp_' + k);
    if (el && el.value !== '') vals[k] = Number(String(el.value).replace(',', '.'));
  }
  const r = setModelParameters(vals);
  researchAfterParamChange(`Parámetros aplicados (${r.set})${r.rejected.length ? ' · rechazados: ' + r.rejected.join(',') : ''}`);
}

function researchResetParams() {
  resetModelParameters();
  researchAfterParamChange('Parámetros restaurados: tesis Obando–Batista 2019');
}

function researchExportParams() {
  const lines = [`# ${HBN_APP_NAME} v${HBN_VERSION} — parámetros del modelo (conjunto=${MODEL_PARAM_SET})`, 'par,clave,activo_eV,tesis_eV,estado,fuente'];
  const p = getModelParameters();
  p.XX = EPS_XX;
  for (const k of FIT_PARAM_KEYS.concat(['XX'])) {
    const i = PARAM_INFO[k];
    lines.push([i.pair, k, p[k], PARAMS_TESIS_2019[k], i.status, `"${i.source}"`].join(','));
  }
  researchSave(`hBN_parametros_${Date.now()}.csv`, lines.join('\n'));
}

function researchRunFit() {
  const out = document.getElementById('rFitOut');
  const extra = parseFitRowsCSV(document.getElementById('rFitExtra')?.value || '');
  const free = Array.from(document.querySelectorAll('#rFitFree input:checked')).map((c) => c.value);
  const rows = [...MAZZONI_DATASET, ...extra.rows];
  const fit = fitBondModel(rows, { free });
  RESEARCH_LAST_FIT = fit;
  if (!out) return;
  if (!fit.ok) { out.innerHTML = `<div class="rwarn">${rEsc(fit.msg)}</div>`; return; }
  const trows = fit.free.map((k) => `<tr><td>${PARAM_INFO[k].pair}</td><td>${rNum(fit.params[k], 4)} ± ${rNum(fit.stderr[k], 4)}</td><td>${rNum(PARAMS_TESIS_2019[k], 4)}</td><td>${rNum(fit.params[k] - PARAMS_TESIS_2019[k], 4)}</td></tr>`).join('');
  const fixed = Object.entries(fit.fixed).map(([k, v]) => `${PARAM_INFO[k].pair}=${rNum(v, 4)}`).join(', ');
  const maxCorr = fit.corr.flatMap((r, i) => r.map((v, j) => (i < j ? { v, a: fit.free[i], b: fit.free[j] } : null))).filter(Boolean).sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0];
  const res = fit.residuals.map((r) => `<tr><td>${rEsc(r.id)}</td><td>${rNum(r.E, 2)}</td><td>${rNum(r.Emodel, 2)}</td><td>${rNum(r.resid, 3)}</td><td>${rNum(r.loo, 3)}</td></tr>`).join('');
  out.innerHTML = `
    ${extra.errors.length ? `<div class="rwarn">${extra.errors.map(rEsc).join('<br>')}</div>` : ''}
    <table class="rtable"><thead><tr><th>Par</th><th>Ajuste ± σ</th><th>Tesis</th><th>Δ</th></tr></thead><tbody>${trows}</tbody></table>
    <div class="micro-note">n = ${fit.n} estructuras · p = ${fit.p} · RMS = ${rNum(fit.rms, 4)} eV (${rNum(fit.rmsPerAtom, 4)} eV/átomo) · máx |res| = ${rNum(fit.maxAbs, 3)} eV · R² = ${fit.R2.toFixed(6)} · RMS LOO = ${rNum(fit.looRms, 4)} eV${fixed ? ' · fijos: ' + fixed : ''}${maxCorr ? ` · correlación máxima ${PARAM_INFO[maxCorr.a].pair}/${PARAM_INFO[maxCorr.b].pair} = ${maxCorr.v.toFixed(3)}` : ''}</div>
    <details><summary>Residuos por estructura</summary><table class="rtable"><thead><tr><th>id</th><th>E DFT</th><th>E modelo</th><th>res.</th><th>res. LOO</th></tr></thead><tbody>${res}</tbody></table></details>`;
}

function researchApplyFit() {
  if (!RESEARCH_LAST_FIT || !RESEARCH_LAST_FIT.ok) { if (typeof addLog === 'function') addLog('Ejecuta primero el ajuste', 'w'); return; }
  setModelParameters(RESEARCH_LAST_FIT.params);
  researchAfterParamChange('Parámetros del ajuste aplicados al modelo (conjunto personalizado)');
}

function researchExportFit() {
  const fit = RESEARCH_LAST_FIT;
  if (!fit || !fit.ok) return;
  const L = [
    `# ${HBN_APP_NAME} v${HBN_VERSION} — reajuste por mínimos cuadrados`,
    `# n=${fit.n} p=${fit.p} dof=${fit.dof} RMS=${fit.rms} RMS_por_atomo=${fit.rmsPerAtom} max_abs=${fit.maxAbs} R2=${fit.R2} RMS_LOO=${fit.looRms}`,
    `# fijos: ${JSON.stringify(fit.fixed)}`,
    'parametro,ajuste_eV,sigma_eV,tesis_eV',
    ...fit.free.map((k) => [k, fit.params[k], fit.stderr[k], PARAMS_TESIS_2019[k]].join(',')),
    '#', '# --- matriz de correlación ---', ['', ...fit.free].join(','),
    ...fit.corr.map((r, i) => [fit.free[i], ...r.map((v) => v.toFixed(6))].join(',')),
    '#', '# --- residuos ---', 'id,E_DFT,E_modelo,residuo,residuo_por_atomo,residuo_LOO',
    ...fit.residuals.map((r) => [r.id, r.E, r.Emodel, r.resid, r.residPerAtom, r.loo].join(',')),
  ];
  researchSave(`hBN_ajuste_LSQ_${Date.now()}.csv`, L.join('\n'));
}

function researchRunScale() {
  const out = document.getElementById('rScaleOut');
  const d = energyScaleDiagnostics();
  if (!out) return;
  if (!d || !d.n) { out.innerHTML = '<div class="rwarn">No hay movimientos locales permitidos en la configuración actual.</div>'; return; }
  const types = Object.entries(d.byType).map(([k, v]) => `<tr><td>${k}</td><td>${v.n}</td><td>${rNum(v.min, 2)}</td><td>${rNum(v.median, 2)}</td></tr>`).join('');
  const acc = d.acceptance.map((a) => `<tr><td>${a.T} K</td><td>${(a.meanAcc * 100).toExponential(2)} %</td></tr>`).join('');
  const regime = d.nNeg > 0
    ? `Hay ${d.nNeg} movimientos con ΔE &lt; 0: la configuración no es un mínimo local.`
    : (d.T_minPos_1e3 !== null ? `Mínimo local: el movimiento más barato (ΔE = ${rNum(d.minPositive, 2)} eV) alcanza p = 10⁻³ a T ≈ ${Math.round(d.T_minPos_1e3).toLocaleString()} K.` : '');
  out.innerHTML = `
    <div class="micro-note">${d.n} intercambios locales · ΔE mín = ${rNum(d.min, 2)} eV · mediana = ${rNum(d.median, 2)} eV · máx = ${rNum(d.max, 2)} eV. ${regime}</div>
    <div class="micro-note" style="color:${d.edge.perH < 0 ? '#b45309' : '#0f766e'}">Energía de borde por H (reservorio ${H_RESERVOIR}): ${rNum(d.edge.perH, 3)} eV → ${d.edge.perH < 0 ? 'fragmentar poros reduce la energía; solo la penalización H–H lo impide.' : 'los poros compactos son favorables.'}</div>
    <table class="rtable"><thead><tr><th>Tipo</th><th>n</th><th>ΔE mín</th><th>ΔE mediana</th></tr></thead><tbody>${types}</tbody></table>
    <table class="rtable"><thead><tr><th>T</th><th>Aceptación media esperada</th></tr></thead><tbody>${acc}</tbody></table>`;
}

function researchRunPores() {
  const sizes = String(document.getElementById('rPoreSizes')?.value || '1,2,3,4,5').split(/[,; ]+/).map(Number).filter((v) => v >= 1);
  const res = poreShapeEnergetics({
    N: +document.getElementById('rPoreN')?.value || 40,
    orient: document.getElementById('rPoreOr')?.value || 'AC',
    sizes,
  });
  RESEARCH_LAST_PORES = res;
  researchRenderPores();
}

function researchRenderPores() {
  const res = RESEARCH_LAST_PORES;
  const out = document.getElementById('rPoreOut');
  if (!res || !out) return;
  const key = document.getElementById('rPoreEnv')?.value || 'EformNrich';
  const colors = { triN: '#2563eb', triB: '#16a34a', parA: '#06b6d4', parB: '#0e7490', hex: '#7c3aed' };
  const series = PORE_SHAPES.map((s) => {
    const r = res.rows.filter((x) => x.shape === s.key);
    return { name: s.label, color: colors[s.key], xs: r.map((x) => x.nVac), ys: r.map((x) => x[key]) };
  });
  researchDrawChart(document.getElementById('rPoreChart'), series, 'vacancias', 'E_form (eV)');
  const w = res.window;
  const rows = res.rows.map((r) => `<tr><td>${rEsc(r.label)}</td><td>${r.size}</td><td>${r.nVac}${r.nClusters !== 1 ? '*' : ''}</td><td>${r.nH}</td><td>${r.edgeN}/${r.edgeB}</td><td>${rNum(r.EformNrich, 2)}</td><td>${rNum(r.EformMid, 2)}</td><td>${rNum(r.EformBrich, 2)}</td><td>${r.slope}</td></tr>`).join('');
  out.innerHTML = `
    <div class="micro-note">Red ${res.N}×${res.N} ${res.orient} · μ_H = ${rNum(w.muH, 3)} eV · μ_N(rico en N, NH₃) = ${rNum(w.muNmax, 3)} eV · μ_N(rico en B, BH₃) = ${rNum(w.muNmin, 3)} eV · pendiente dE/dμ_N = n_B − n_N · penalización H–H excluida.</div>
    ${w.open ? '' : `<div class="rwarn">Ventana química vacía para Δμ_H = ${rNum(FORM_DMU_H, 2)} eV: el límite "rico en N" tiene μ_N menor que el "rico en B", de modo que los rótulos no describen ambientes físicos. Use Δμ_H ≤ ${rNum(w.dmuHOpen, 3)} eV (Paso 4) para una ventana válida.</div>`}
    <div class="rscroll"><table class="rtable"><thead><tr><th>Forma</th><th>tam.</th><th>vac</th><th>H</th><th>borde N/B</th><th>E rico N</th><th>E medio</th><th>E rico B</th><th>dE/dμ_N</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function researchExportPores() {
  const res = RESEARCH_LAST_PORES;
  if (!res) return;
  const w = res.window;
  const L = [
    `# ${HBN_APP_NAME} v${HBN_VERSION} — energía de formación de poros geométricos (T=0, modelo de enlaces)`,
    `# Red=${res.N}x${res.N} ${res.orient} PBC=XY  mu_H=${w.muH}  mu_BN=${w.muBN}  mu_N_min(rico_B)=${w.muNmin}  mu_N_max(rico_N)=${w.muNmax}  ventana=${w.open ? 'abierta' : 'VACIA'}`,
    ...(typeof batchParameterBlock === 'function' ? batchParameterBlock() : []),
    'forma,tam,n_vac,n_clusters,n_H,borde_N,borde_B,compacidad,N_quitados,B_quitados,dEform_dmuN,Eform_ricoN_eV,Eform_medio_eV,Eform_ricoB_eV,E_HH_aparte_eV',
    ...res.rows.map((r) => [r.shape, r.size, r.nVac, r.nClusters, r.nH, r.edgeN, r.edgeB, r.compactness !== null ? r.compactness.toFixed(4) : '', r.removedN, r.removedB, r.slope, r.EformNrich, r.EformMid, r.EformBrich, r.EHH].join(',')),
  ];
  researchSave(`hBN_energetica_poros_${Date.now()}.csv`, L.join('\n'));
}

async function researchRunSweep() {
  const btn = document.getElementById('rSwRun');
  const prog = document.getElementById('rSwProg');
  const temps = String(document.getElementById('rSwT')?.value || '').split(/[,; ]+/).map(Number).filter((v) => v > 0);
  if (typeof readLiveRuntimeParams === 'function') readLiveRuntimeParams();
  try {
    if (btn) btn.disabled = true;
    const res = await runTemperatureSweep({
      temps,
      steps: +document.getElementById('rSwSteps')?.value,
      mode: document.getElementById('rSwMode')?.value,
      swapEvery: +document.getElementById('rSwEvery')?.value,
      eqFrac: +document.getElementById('rSwEq')?.value,
      nSamples: +document.getElementById('rSwN')?.value,
      seed: document.getElementById('rSwSeed')?.value,
    }, (f, txt) => { if (prog) prog.textContent = `${(f * 100).toFixed(0)} % · ${txt}`; });
    if (!res) { if (prog) prog.textContent = 'Barrido cancelado'; return; }
    if (prog) prog.textContent = `Completado · semilla ${res.seed}`;
    researchRenderSweep();
    if (typeof addLog === 'function') addLog(`Barrido de temperatura completado (${res.results.length} réplicas, ${res.mode}, semilla ${res.seed})`, 'g');
  } catch (e) {
    if (prog) prog.textContent = 'Error: ' + (e && e.message ? e.message : e);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function researchRenderSweep() {
  const res = SWEEP_RESULT;
  const out = document.getElementById('rSwOut');
  if (!res || !out) return;
  const R = res.results;
  researchDrawChart(document.getElementById('rSwChartE'), [{ name: '⟨E⟩', color: '#7c3aed', xs: R.map((r) => r.T), ys: R.map((r) => r.Emean) }], 'T (K)', '⟨E⟩ (eV)');
  researchDrawChart(document.getElementById('rSwChartCv'), [{ name: 'C_v / k_B', color: '#dc2626', xs: R.map((r) => r.T), ys: R.map((r) => r.CvkB) }], 'T (K)', 'C_v / k_B');
  const main = (sh) => Object.entries(sh).sort((a, b) => b[1] - a[1])[0];
  const rows = R.map((r, i) => {
    const m = main(r.shapes);
    return `<tr><td>${r.T}</td><td>${rNum(r.Emean, 1)}</td><td>${rNum(r.Estd, 2)}</td><td>${rNum(r.CvkB, 1)}</td><td>${rNum(r.accPct, 3)}</td><td>${rNum(r.nPores, 1)}</td><td>${m ? `${m[0]} ${(m[1] / Math.max(1, r.nSamples) * 100).toFixed(0)} %` : '—'}</td><td>${rNum(r.edgeNfrac, 2)}</td><td>${rNum(r.alphaC, 3)}</td><td><button class="btn rsmall" onclick="researchLoadReplica(${i})">ver</button></td></tr>`;
  }).join('');
  const sw = res.mode === 'pt' ? `<div class="micro-note">Aceptación de intercambios: ${res.swaps.map((s) => `${s.Ta}↔${s.Tb}: ${rNum(s.accPct, 1)} %`).join(' · ')}</div>` : '';
  out.innerHTML = `${sw}<div class="rscroll"><table class="rtable"><thead><tr><th>T (K)</th><th>⟨E⟩</th><th>σ_E</th><th>C_v/k_B</th><th>acc %</th><th>poros</th><th>forma mayoritaria</th><th>borde N</th><th>α_C</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** Carga en la vista la configuración final de una réplica del barrido. */
function researchLoadReplica(i) {
  const r = SWEEP_RESULT && SWEEP_RESULT.results[i];
  if (!r || !ready || r.Gfinal.length !== G.length) return;
  if (typeof run !== 'undefined' && run) { if (typeof addLog === 'function') addLog('Detén la simulación antes de cargar una réplica', 'w'); return; }
  G.set(r.Gfinal);
  E = calcFullE();
  T = r.T;
  if (typeof refreshCurrentEnergySnapshot === 'function') refreshCurrentEnergySnapshot();
  if (typeof ui === 'function') ui();
  if (typeof draw === 'function') draw();
  if (typeof addLog === 'function') addLog(`Réplica T=${r.T} K cargada en la vista (E=${E.toFixed(1)} eV)`, 'i');
}

function researchExportSweep() {
  const csv = temperatureSweepCSV();
  if (csv) researchSave(`hBN_barrido_T_${Date.now()}.csv`, csv);
}

let RESEARCH_LAST_RIBBON = null;
function researchRunRibbon() {
  const v = (id) => { const el = document.getElementById(id); const x = el ? Number(String(el.value).replace(',', '.')) : NaN; return el && el.value !== '' ? x : NaN; };
  const EH2 = v('rRbH2');
  const ac = calibrateEpsXCFromRibbon({ E_H: v('rRbACH'), E_bare: v('rRbAC'), nC: v('rRbACnC'), nH: v('rRbACnH'), EH2 });
  const zz = calibrateEpsXCFromRibbon({ E_H: v('rRbZZH'), E_bare: v('rRbZZ'), nC: v('rRbZZnC'), nH: v('rRbZZnH'), EH2 });
  RESEARCH_LAST_RIBBON = { ac, zz };
  const out = document.getElementById('rRbOut');
  if (!out) return;
  const row = (lab, r) => (r.ok
    ? `<tr><td>${lab}</td><td>${r.nCC}</td><td>${rNum(r.direct.lsq, 3)}</td><td>${rNum(r.direct.diat, 3)}</td><td>${r.indirect ? rNum(r.indirect.dEhydro, 3) : '—'}</td><td>${r.indirect ? rNum(r.indirect.eps, 3) : '—'}</td></tr>`
    : `<tr><td>${lab}</td><td colspan="5">${rEsc(r.msg)}</td></tr>`);
  const warns = [...(ac.warnings || []).map((w) => 'AC: ' + w), ...(zz.warnings || []).map((w) => 'ZZ: ' + w)];
  let summary = '';
  if (ac.ok && zz.ok) {
    const m = (ac.direct.lsq + zz.direct.lsq) / 2;
    const d = Math.abs(ac.direct.lsq - zz.direct.lsq) / 2;
    summary = `<div class="micro-note">Ruta directa (ε_CC ajuste): ε_CH = ${rNum(m, 3)} ± ${rNum(d, 3)} eV (promedio AC/ZZ ± semidiferencia).</div>`;
  }
  out.innerHTML = `<table class="rtable"><thead><tr><th>Cinta</th><th>n_CC</th><th>ε_XC directo (ε_CC ajuste)</th><th>ε_XC directo (E(C₂)/3)</th><th>ΔE_hidrog</th><th>ε_XC indirecto</th></tr></thead><tbody>${row('AC', ac)}${row('ZZ', zz)}</tbody></table>${summary}${warns.length ? `<div class="rwarn">${warns.map(rEsc).join('<br>')}</div>` : ''}`;
}

function researchApplyRibbon() {
  const r = RESEARCH_LAST_RIBBON;
  if (!r || !r.ac.ok || !r.zz.ok) { if (typeof addLog === 'function') addLog('Calcula primero ambas cintas (AC y ZZ)', 'w'); return; }
  updateCHCalibrationFromEdges(r.ac.direct.lsq, r.zz.direct.lsq);
  MODEL_PARAM_SET = 'personalizado';
  researchAfterParamChange(`ε_CH calibrado con nanocintas: AC=${r.ac.direct.lsq.toFixed(3)} ZZ=${r.zz.direct.lsq.toFixed(3)} → ${EPS_XC.toFixed(3)} eV`);
}

let RESEARCH_LAST_STRUCT = null;
function researchRunStruct() {
  const a = analyzeCurrentStructure();
  RESEARCH_LAST_STRUCT = a;
  const out = document.getElementById('rStOut');
  if (!a || !out) return;
  const rows = a.pores.slice(0, 60).map((p) => `<tr><td>${p.id}</td><td>${p.nVac}</td><td>${p.shape}</td><td>${rEsc(p.term)}</td><td>${p.edgeN}/${p.edgeB}</td><td>${rNum(p.compactness, 3)}</td><td>${rNum(p.aspect, 2)}</td></tr>`).join('');
  out.innerHTML = `<div class="micro-note">N=${a.counts.nN} · B=${a.counts.nB} · C=${a.counts.nC} · Vac=${a.counts.nV} · poros=${a.pores.length} · α_C=${rNum(a.sro.alphaC, 4)} · f_BN=${rNum(a.sro.fBN, 4)}</div>
    ${a.pores.length ? `<div class="rscroll"><table class="rtable"><thead><tr><th>#</th><th>vac</th><th>forma</th><th>terminación</th><th>borde N/B</th><th>compacidad</th><th>aspecto</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}`;
}

function researchExportStruct() {
  const a = RESEARCH_LAST_STRUCT || analyzeCurrentStructure();
  if (!a) return;
  const L = [
    `# ${HBN_APP_NAME} v${HBN_VERSION} — análisis de estructura  Red=${Nx}x${Ny}  E=${E}`,
    `# N=${a.counts.nN} B=${a.counts.nB} C=${a.counts.nC} Vac=${a.counts.nV}  alpha_C=${a.sro.alphaC}  f_BN=${a.sro.fBN}`,
    'poro,n_vac,forma,terminacion,borde_N,borde_B,compacidad,aspecto',
    ...a.pores.map((p) => [p.id, p.nVac, p.shape, p.term, p.edgeN, p.edgeB, p.compactness ?? '', p.aspect ?? ''].join(',')),
  ];
  researchSave(`hBN_estructura_${Date.now()}.csv`, L.join('\n'));
}

if (typeof window !== 'undefined') {
  window.HBNResearch = {
    fitBondModel, parseFitRowsCSV, poreShapeEnergetics, calibrateEpsXCFromRibbon,
    energyScaleDiagnostics, shortRangeOrder, analyzeCurrentStructure, runTemperatureSweep,
    temperatureSweepCSV, MAZZONI_DATASET, atomsFromBondCounts,
  };
}
