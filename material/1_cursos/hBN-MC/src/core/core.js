// core.js — estado, geometría, red, energía y Monte Carlo [v15.0.1]
'use strict';

// Identidad única de la versión. Todos los módulos, exportaciones y sesiones
// leen estas constantes; no se escriben números de versión en otros archivos.
const HBN_VERSION = '15.0.1';
const HBN_APP_NAME = 'hBN-MC';
const HBN_SESSION_SCHEMA = 2;

// ============================================================================
// 1. REPRODUCIBILIDAD DEL GENERADOR PSEUDOALEATORIO
// ============================================================================
// Mulberry32 permite repetir exactamente una simulación a partir de una semilla.
// setRandomSeed(null) restaura el comportamiento no determinista de Math.random().

let RNG_SEED = null;
let _mb32 = null;

/**
 * Configura la semilla del generador pseudoaleatorio reproducible.
 *
 * @param {number|string|null|undefined} seed Semilla convertible a entero sin signo.
 * @returns {number|null} Semilla activa o null si se usa Math.random().
 */
function setRandomSeed(seed) {
  if (seed === null || seed === undefined || seed === '' || !Number.isFinite(+seed)) {
    RNG_SEED = null;
    _mb32 = null;
    return null;
  }

  RNG_SEED = (+seed) >>> 0;
  let a = RNG_SEED;

  _mb32 = function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return RNG_SEED;
}

/** @returns {number} Número pseudoaleatorio en el intervalo [0, 1). */
function rand() {
  return _mb32 ? _mb32() : Math.random();
}

/** @returns {number|null} Semilla pseudoaleatoria actualmente configurada. */
function getRandomSeed() {
  return RNG_SEED;
}

// ============================================================================
// 2. CONSTANTES FÍSICAS Y PARÁMETROS ENERGÉTICOS
// ============================================================================

const D = 1.44;
const KB = 8.6173324e-5;

// ----------------------------------------------------------------------------
// 2.1 Parámetros del modelo de enlaces (eV por enlace)
// ----------------------------------------------------------------------------
// Valores reportados en la tesis de M. A. Obando (FIMAT-UFOP, 2019), dirigida
// por el Prof. Ronaldo J. C. Batista, y usados como parametrización por defecto:
//   · εNN, εNB, εBB, εCC, εCN, εCB: Tabla 5.8, ajuste por mínimos cuadrados
//     sobre las 20 estructuras BxCyNz de Mazzoni et al. (PRB 73, 073108, 2006).
//     εNB y εBB conservan los decimales del código Fortran de la tesis.
//   · εXN (N–H) y εXB (B–H): Tabla 5.7, promedio sobre poros triangulares.
//   · εXX = E(H2)/2 (Tabla 5.1): enlace vacancia–vacancia del código Fortran.
//   · εXC (C–H): NO procede de la tesis. Es una estimación provisional
//     (descomposición aditiva a_C + a_H, −70.41 ± 0.40 eV) pendiente del
//     cálculo SIESTA de nanocintas AC-H / ZZ-H.
// Los parámetros son variables para permitir análisis de sensibilidad; la
// parametrización de referencia está congelada en PARAMS_TESIS_2019.
const PARAMS_TESIS_2019 = Object.freeze({
  NN: -185.29,
  NB: -128.1626,
  BB: -67.9148,
  XN: -109.7987,
  XB: -50.3121,
  XX: -15.031,
  CC: -107.32,
  CN: -147.02,
  CB: -88.01,
  XC: -70.41,
});

const PARAM_INFO = Object.freeze({
  NN: { pair: 'N–N', source: 'Tesis 2019, Tabla 5.8 (mínimos cuadrados, Mazzoni)', status: 'DFT' },
  NB: { pair: 'N–B', source: 'Tesis 2019, Tabla 5.8 (mínimos cuadrados, Mazzoni)', status: 'DFT' },
  BB: { pair: 'B–B', source: 'Tesis 2019, Tabla 5.8 (mínimos cuadrados, Mazzoni)', status: 'DFT' },
  CC: { pair: 'C–C', source: 'Tesis 2019, Tabla 5.8 (mínimos cuadrados, Mazzoni)', status: 'DFT' },
  CN: { pair: 'C–N', source: 'Tesis 2019, Tabla 5.8 (mínimos cuadrados, Mazzoni)', status: 'DFT' },
  CB: { pair: 'C–B', source: 'Tesis 2019, Tabla 5.8 (mínimos cuadrados, Mazzoni)', status: 'DFT' },
  XN: { pair: 'N–H (X–N)', source: 'Tesis 2019, Tabla 5.7 (poros triangulares NH)', status: 'DFT' },
  XB: { pair: 'B–H (X–B)', source: 'Tesis 2019, Tabla 5.7 (poros triangulares BH)', status: 'DFT' },
  XX: { pair: 'Vac–Vac (X–X)', source: 'E(H₂)/2, Tabla 5.1; término del código Fortran', status: 'convención' },
  XC: { pair: 'C–H (X–C)', source: 'Estimación aditiva a_C + a_H (no DFT)', status: 'provisional' },
});

let EPS_NN = PARAMS_TESIS_2019.NN;
let EPS_NB = PARAMS_TESIS_2019.NB;
let EPS_BB = PARAMS_TESIS_2019.BB;
let EPS_XB = PARAMS_TESIS_2019.XB;
let EPS_XN = PARAMS_TESIS_2019.XN;
let EPS_XX = PARAMS_TESIS_2019.XX;
let EPS_CC = PARAMS_TESIS_2019.CC;
let EPS_CN = PARAMS_TESIS_2019.CN;
let EPS_CB = PARAMS_TESIS_2019.CB;

// Energías DFT de referencia (Tabla 5.1 de la tesis, SIESTA GGA).
// εXX = E(H2)/2: los ε pertenecen a una escala de energía total, no son
// energías de enlace físicas (ver identidad de hidrogenación en §4).
const E_MOL = Object.freeze({
  BN: -386.72,
  NH3: -328.37,
  BH3: -149.88,
  H2: -30.062,
  CC: -324.68,
});

const MU_H_H2 = E_MOL.H2 / 2;

// Calibración C–H. EPS_XC es el valor efectivo usado por el Hamiltoniano;
// EPS_CH_AC / EPS_CH_ZZ guardan la trazabilidad de bordes armchair y zigzag.
let EPS_XC = PARAMS_TESIS_2019.XC;
let EPS_CH_AC = PARAMS_TESIS_2019.XC;
let EPS_CH_ZZ = PARAMS_TESIS_2019.XC;
let EPS_CH_DISP = 0.40;

// Etiqueta del conjunto de parámetros activo ('tesis2019' o 'personalizado').
let MODEL_PARAM_SET = 'tesis2019';

/**
 * Devuelve una copia de los parámetros ε activos.
 *
 * @returns {{NN:number,NB:number,BB:number,XN:number,XB:number,XX:number,CC:number,CN:number,CB:number,XC:number}}
 */
function getModelParameters() {
  return {
    NN: EPS_NN, NB: EPS_NB, BB: EPS_BB,
    XN: EPS_XN, XB: EPS_XB, XX: EPS_XX,
    CC: EPS_CC, CN: EPS_CN, CB: EPS_CB,
    XC: EPS_XC,
  };
}

/**
 * Asigna uno o varios parámetros ε. Solo acepta claves conocidas y valores
 * finitos; cualquier otro valor se ignora y se informa en el resultado.
 *
 * @param {object} values Mapa parcial {NN, NB, ..., XC}.
 * @returns {{changed:string[], rejected:string[], set:string}}
 */
function setModelParameters(values = {}) {
  const changed = [];
  const rejected = [];

  for (const [key, raw] of Object.entries(values || {})) {
    const v = Number(raw);
    if (!(key in PARAMS_TESIS_2019) || !Number.isFinite(v)) {
      rejected.push(key);
      continue;
    }
    switch (key) {
      case 'NN': EPS_NN = v; break;
      case 'NB': EPS_NB = v; break;
      case 'BB': EPS_BB = v; break;
      case 'XN': EPS_XN = v; break;
      case 'XB': EPS_XB = v; break;
      case 'XX': EPS_XX = v; break;
      case 'CC': EPS_CC = v; break;
      case 'CN': EPS_CN = v; break;
      case 'CB': EPS_CB = v; break;
      case 'XC':
        // Un valor único de ε_CH sustituye la calibración AC/ZZ; si no
        // cambia, se conserva la trazabilidad AC/ZZ existente.
        if (v !== EPS_XC) {
          EPS_XC = v;
          EPS_CH_AC = v;
          EPS_CH_ZZ = v;
          EPS_CH_DISP = 0;
        }
        break;
      default: break;
    }
    changed.push(key);
  }

  const cur = getModelParameters();
  MODEL_PARAM_SET = Object.keys(PARAMS_TESIS_2019)
    .every((k) => k === 'XC' || cur[k] === PARAMS_TESIS_2019[k])
    ? 'tesis2019'
    : 'personalizado';

  return { changed, rejected, set: MODEL_PARAM_SET };
}

/**
 * Restaura la parametrización de la tesis 2019 (valores del Prof. Batista).
 *
 * @returns {object} Parámetros restaurados.
 */
function resetModelParameters() {
  setModelParameters(PARAMS_TESIS_2019);
  EPS_CH_DISP = 0.40;
  MODEL_PARAM_SET = 'tesis2019';
  return getModelParameters();
}

// ============================================================================
// 3. RESERVORIO DE HIDRÓGENO, REFERENCIAS QUÍMICAS Y ENERGÍA DE FORMACIÓN
// ============================================================================
// Reservorio de H en el Monte Carlo:
//   · 'tesis' (por defecto): Hamiltoniano del código Fortran. Cada enlace
//     vacancia–vacancia vale εXX = E(H2)/2 y cada enlace X–α vale εXα − Δμ_H.
//     Con PBC y n_vac fijo, N_H = 3·n_vac − 2·n_XX, de modo que el término εXX
//     equivale a un potencial químico implícito μ_H = εXX/2 = E(H2)/4.
//   · 'H2': gran canónico en H respecto de H2. Se elimina el término
//     vacancia–vacancia (sin átomos no hay energía) y cada H de pasivación
//     aporta −μ_H con μ_H = E(H2)/2 + Δμ_H.
// La variable global muH almacena Δμ_H en eV (0 = referencia del modo).
let H_RESERVOIR = 'tesis';

/**
 * Desplazamiento energético aplicado a cada H de pasivación en el Monte Carlo.
 *
 * @returns {number} eV restados a cada enlace X–α.
 */
function hydrogenShift() {
  return H_RESERVOIR === 'H2' ? (MU_H_H2 + muH) : muH;
}

/**
 * Energía efectiva de un enlace vacancia–vacancia según el reservorio activo.
 *
 * @returns {number} eV.
 */
function epsVacVac() {
  return H_RESERVOIR === 'H2' ? 0 : EPS_XX;
}

/**
 * Selecciona el modo del reservorio de H del Monte Carlo.
 *
 * @param {'tesis'|'H2'} mode Modo solicitado.
 * @returns {string} Modo activo.
 */
function setHydrogenReservoir(mode) {
  H_RESERVOIR = mode === 'H2' ? 'H2' : 'tesis';
  return H_RESERVOIR;
}

// Referencias de la energía de formación.
//   μ_BN: por defecto la energía de la lámina en la escala del propio modelo,
//         3·εNB, que garantiza E_form(h-BN perfecto) = 0. La opción 'dft' usa
//         E(BN) de la Tabla 5.1 y deja un desfase de 3·εNB − E(BN) por par.
//   μ_N máximo: equilibrio con NH3 → μ_N ≤ E(NH3) − 3μ_H.
//   μ_B máximo: equilibrio con BH3 → μ_B ≤ E(BH3) − 3μ_H.
//   Estabilidad de la lámina: μ_B + μ_N = μ_BN.
// La ventana de μ_N es [μ_BN − μ_B,max , μ_N,max]; puede estar vacía.
let FORM_MU_BN_REF = 'model';
let FORM_DMU_H = 0;
let FORM_CHEM_ENV = 'Nrich';

/** @returns {number} μ_BN en eV por par B–N. */
function formationMuBN() {
  return FORM_MU_BN_REF === 'dft' ? E_MOL.BN : 3 * EPS_NB;
}

/** @returns {number} μ_C en eV por átomo (grafeno en la escala del modelo). */
function formationMuCDefault() {
  return FORM_MU_BN_REF === 'dft' ? E_MOL.CC / 2 : 1.5 * EPS_CC;
}

/**
 * Calcula la ventana de potencial químico del nitrógeno para un Δμ_H dado.
 *
 * @param {number} dmuH Δμ_H respecto de E(H2)/2, en eV.
 * @returns {{muH:number,muBN:number,muNmax:number,muNmin:number,muBmax:number,
 *   width:number,open:boolean,dmuHOpen:number}}
 */
function chemicalWindow(dmuH = FORM_DMU_H) {
  const muH = MU_H_H2 + dmuH;
  const muBN = formationMuBN();
  const muNmax = E_MOL.NH3 - 3 * muH;
  const muBmax = E_MOL.BH3 - 3 * muH;
  const muNmin = muBN - muBmax;
  // Δμ_H máximo para el que h-BN es estable frente a NH3 + BH3.
  const dmuHOpen = (E_MOL.NH3 + E_MOL.BH3 - muBN) / 6 - MU_H_H2;

  return {
    muH,
    muBN,
    muNmax,
    muNmin,
    muBmax,
    width: muNmax - muNmin,
    open: muNmax >= muNmin,
    dmuHOpen,
  };
}

/**
 * Potenciales químicos de un ambiente con nombre.
 *
 * 'Nrich' fija μ_N en su máximo (NH3); 'Brich' fija μ_B en su máximo (BH3);
 * 'mid' toma el punto medio. Si la ventana está vacía los extremos se
 * devuelven igualmente y open=false lo indica.
 *
 * @param {'Nrich'|'Brich'|'mid'} which Ambiente.
 * @param {number} dmuH Δμ_H en eV.
 * @returns {{muB:number,muN:number,muC:number,muH:number,env:string,open:boolean}}
 */
function chemicalEnvironmentPotentials(which = FORM_CHEM_ENV, dmuH = FORM_DMU_H) {
  const w = chemicalWindow(dmuH);
  let muN = w.muNmax;
  if (which === 'Brich') muN = w.muNmin;
  else if (which === 'mid') muN = (w.muNmax + w.muNmin) / 2;

  return {
    muB: w.muBN - muN,
    muN,
    muC: formationMuCDefault(),
    muH: w.muH,
    env: ['Nrich', 'Brich', 'mid'].includes(which) ? which : 'Nrich',
    open: w.open,
  };
}

let FORM_MU_B = 0;
let FORM_MU_N = 0;
let FORM_MU_C = 0;
let FORM_MU_H = MU_H_H2;
let FORM_DFT_TOTAL = null;

/**
 * Obtiene los potenciales químicos de referencia del ambiente activo.
 *
 * @returns {{muB:number,muN:number,muC:number,muH:number}}
 */
function formationReferenceDefaults() {
  const p = chemicalEnvironmentPotentials(FORM_CHEM_ENV, FORM_DMU_H);
  return { muB: p.muB, muN: p.muN, muC: p.muC, muH: p.muH };
}

/**
 * Selecciona el ambiente químico y actualiza sus potenciales de referencia.
 *
 * @param {string} which Ambiente: 'Nrich', 'Brich' o 'mid'.
 * @param {number} dmuH Δμ_H opcional en eV.
 * @returns {{muB:number,muN:number,muH:number,muC:number,env:string,open:boolean}}
 */
function setChemicalEnvironment(which, dmuH = FORM_DMU_H) {
  FORM_DMU_H = Number.isFinite(+dmuH) ? +dmuH : 0;
  const p = chemicalEnvironmentPotentials(which, FORM_DMU_H);
  FORM_CHEM_ENV = p.env;
  FORM_MU_B = p.muB;
  FORM_MU_N = p.muN;
  FORM_MU_H = p.muH;
  FORM_MU_C = p.muC;
  return { ...p };
}

setChemicalEnvironment('Nrich', 0);

/**
 * Calcula E_form frente a μN sobre la ventana química (o sobre el intervalo
 * entre sus extremos cuando la ventana está vacía).
 *
 * @param {number} nPts Número de puntos del barrido.
 * @param {Array|TypedArray} state Estado de especies de la red.
 * @returns {Array<{muN:number,muB:number,Eform:number|null,perH:number|null,open:boolean}>}
 */
function formationEnergyVsMuN(nPts = 21, state = G) {
  const w = chemicalWindow(FORM_DMU_H);
  const lo = Math.min(w.muNmin, w.muNmax);
  const hi = Math.max(w.muNmin, w.muNmax);
  const save = { b: FORM_MU_B, n: FORM_MU_N, h: FORM_MU_H };
  const out = [];

  try {
    FORM_MU_H = w.muH;
    for (let k = 0; k < nPts; k++) {
      const muN = lo + (hi - lo) * k / Math.max(1, nPts - 1);
      FORM_MU_N = muN;
      FORM_MU_B = w.muBN - muN;

      const f = calcFormationEnergyDFTLike(state);
      out.push({
        muN,
        muB: FORM_MU_B,
        Eform: f ? f.Eform : null,
        perH: f ? f.perH : null,
        open: w.open,
      });
    }
  } finally {
    FORM_MU_B = save.b;
    FORM_MU_N = save.n;
    FORM_MU_H = save.h;
  }
  return out;
}

// ============================================================================
// 4. CONVERSIÓN ENTRE ESCALA ε Y ENERGÍAS DE HIDROGENACIÓN
// ============================================================================
// Identidad: εXY = ΔE_hidrog(Y–H) + E(H) + aY, con aY = εYY/2.

/**
 * Convierte εX–Y a energía física de hidrogenación para N, B o C.
 *
 * @param {number} epsVal Energía ε del enlace X–Y.
 * @param {'N'|'B'|'C'} species Especie química.
 * @returns {number} Energía de hidrogenación en eV o NaN si la especie no existe.
 */
function hydrogenationEnergyFromEps(epsVal, species) {
  const a = { N: EPS_NN / 2, B: EPS_BB / 2, C: EPS_CC / 2 }[species];
  if (a === undefined) return NaN;
  return epsVal - MU_H_H2 - a;
}

/**
 * Convierte una energía de hidrogenación a la escala ε del modelo.
 *
 * @param {number} dEhydro Energía de hidrogenación en eV.
 * @param {'N'|'B'|'C'} species Especie química.
 * @returns {{eps:number,dEhydro?:number,aY?:number,sane:boolean,msg:string}}
 */
function epsFromHydrogenationEnergy(dEhydro, species) {
  const a = { N: EPS_NN / 2, B: EPS_BB / 2, C: EPS_CC / 2 }[species];
  if (a === undefined) {
    return { eps: NaN, sane: false, msg: 'especie desconocida' };
  }

  const epsVal = dEhydro + MU_H_H2 + a;
  const sane = dEhydro >= -2.5 && dEhydro <= -1.0;

  return {
    eps: epsVal,
    dEhydro,
    aY: a,
    sane,
    msg: sane
      ? 'OK'
      : 'FUERA DE RANGO FÍSICO: revisa el conteo de enlaces o el cálculo DFT',
  };
}

/**
 * Calcula εXC desde una nanocinta pasivada con enlaces C–C y C–H.
 *
 * @param {number} E_ribbonH Energía DFT total de la nanocinta hidrogenada.
 * @param {number} nCC Número de enlaces C–C.
 * @param {number} nCH Número de enlaces C–H.
 * @param {number} epsCC Valor εCC de referencia.
 * @returns {number} εXC en eV/enlace o NaN si nCH es cero.
 */
function epsXCFromRibbon(E_ribbonH, nCC, nCH, epsCC = EPS_CC) {
  if (!nCH) return NaN;
  return (E_ribbonH - nCC * epsCC) / nCH;
}

/**
 * Audita inconsistencias de escala y parametrización (D1, D3 y D8).
 *
 * @returns {Array<{lvl:string,txt:string}>} Mensajes de error o advertencia.
 */
function checkParameterConsistency() {
  const msgs = [];
  const muBN = formationMuBN();
  const sum = FORM_MU_B + FORM_MU_N;

  if (Math.abs(sum - muBN) > 1e-3) {
    msgs.push({
      lvl: 'error',
      txt: `μ_B+μ_N = ${sum.toFixed(3)} ≠ μ_BN = ${muBN.toFixed(3)}. La energía de formación no es física.`,
    });
  }

  if (Math.abs(FORM_MU_B - FORM_MU_N) < 1e-6) {
    msgs.push({
      lvl: 'warn',
      txt: 'μ_B = μ_N: reparto 50/50 arbitrario. En poros no estequiométricos domina la diferencia de energía atómica N vs B (~59 eV/átomo) y E_form pierde sentido. Elige ambiente rico en N o en B.',
    });
  }

  if (FORM_MU_BN_REF === 'dft') {
    msgs.push({
      lvl: 'warn',
      txt: `μ_BN = E(BN) de la Tabla 5.1 difiere de 3·ε_NB en ${(E_MOL.BN - 3 * EPS_NB).toFixed(3)} eV/par: la lámina perfecta no tendrá E_form = 0.`,
    });
  }

  const w = chemicalWindow(FORM_DMU_H);
  if (!w.open) {
    msgs.push({
      lvl: 'warn',
      txt: `Ventana química vacía para Δμ_H = ${FORM_DMU_H.toFixed(3)} eV: con estas referencias h-BN es inestable frente a NH₃ + BH₃ (μ_N,max = ${w.muNmax.toFixed(3)} < μ_N,min = ${w.muNmin.toFixed(3)}). Se abre para Δμ_H ≤ ${w.dmuHOpen.toFixed(3)} eV.`,
    });
  }

  const epsBNdiat = E_MOL.BN / 3;
  if (Math.abs(EPS_NB - epsBNdiat) > 0.01) {
    msgs.push({
      lvl: 'warn',
      txt: `ε_NB = ${EPS_NB} pero ε_XN/ε_XB se derivaron con E(BN)/3 = ${epsBNdiat.toFixed(4)}. Desfase de ${(epsBNdiat - EPS_NB).toFixed(3)} eV/enlace en la energética de bordes (D3).`,
    });
  }

  const edge = edgeEnergyPerHydrogen();
  if (edge.perH < 0) {
    msgs.push({
      lvl: 'warn',
      txt: `Energía de borde por H en el Monte Carlo = ${edge.perH.toFixed(3)} eV (<0): con este reservorio los poros tienden a fragmentarse en monovacancias. En modo 'tesis' solo lo impide la penalización topológica H–H.`,
    });
  }

  for (const [sp, e] of [['N', EPS_XN], ['B', EPS_XB], ['C', EPS_XC]]) {
    const dh = hydrogenationEnergyFromEps(e, sp);
    if (dh < -2.6 || dh > -0.9) {
      msgs.push({
        lvl: 'error',
        txt: `ε_X${sp} = ${e} implica ΔE_hidrog = ${dh.toFixed(3)} eV, fuera del rango físico [−2.5,−1.0]. Probable error de escala.`,
      });
    }
  }

  const dhN = hydrogenationEnergyFromEps(EPS_XN, 'N');
  const dhB = hydrogenationEnergyFromEps(EPS_XB, 'B');
  const dhC = hydrogenationEnergyFromEps(EPS_XC, 'C');

  if (!(dhC <= dhB && dhC >= dhN)) {
    msgs.push({
      lvl: 'warn',
      txt: `ΔE_hidrog: B=${dhB.toFixed(2)} C=${dhC.toFixed(2)} N=${dhN.toFixed(2)}. El C debería quedar entre B y N por electronegatividad. Valor consistente: ε_XC ≈ −70.4 eV.`,
    });
  }

  return msgs;
}

/**
 * Coeficiente de N_H en la energía del Monte Carlo para h-BN ordenado.
 *
 * En una lámina h-BN sin enlaces homonucleares, con composición y número de
 * vacancias fijos (PBC), la energía depende del perímetro del poro solo a
 * través de N_H:  E = const + N_H · e_H, con
 *   e_H = −(εNB − ε'XN − ε'XB)/2 − ε'XX/2,   ε'Xα = εXα − s,
 * donde s es el desplazamiento por H del reservorio activo y ε'XX la energía
 * vacancia–vacancia efectiva. e_H < 0 implica que aumentar el perímetro
 * (fragmentar poros) reduce la energía.
 *
 * @returns {{perH:number, perBrokenBond:number, shift:number, epsVV:number}}
 */
function edgeEnergyPerHydrogen() {
  const s = hydrogenShift();
  const vv = epsVacVac();
  const perH = -(EPS_NB - (EPS_XN - s) - (EPS_XB - s)) / 2 - vv / 2;
  return { perH, perBrokenBond: 2 * perH, shift: s, epsVV: vv };
}

/**
 * Actualiza las calibraciones C–H de bordes armchair y zigzag.
 *
 * @param {number} ac Calibración armchair en eV/enlace.
 * @param {number} zz Calibración zigzag en eV/enlace.
 * @returns {{epsCH:number,epsAC:number,epsZZ:number,disp:number}}
 */
function updateCHCalibrationFromEdges(ac = EPS_CH_AC, zz = EPS_CH_ZZ) {
  const a = Number(ac);
  const z = Number(zz);

  if (Number.isFinite(a)) EPS_CH_AC = a;
  if (Number.isFinite(z)) EPS_CH_ZZ = z;

  if (Number.isFinite(EPS_CH_AC) && Number.isFinite(EPS_CH_ZZ)) {
    EPS_XC = (EPS_CH_AC + EPS_CH_ZZ) / 2;
    EPS_CH_DISP = Math.abs(EPS_CH_AC - EPS_CH_ZZ) / 2;
  }

  return {
    epsCH: EPS_XC,
    epsAC: EPS_CH_AC,
    epsZZ: EPS_CH_ZZ,
    disp: EPS_CH_DISP,
  };
}

// ============================================================================
// 5. PASIVACIÓN CON HIDRÓGENO Y ENERGÍAS AUXILIARES
// ============================================================================
// Penalización estérica: E_HH = K·(1-d/d_min)^2 para d < d_min.
// Esta corrección evita configuraciones con H de pasivación solapados en
// poros o bordes abiertos. Los valores físicos se conservan sin cambios.
let H_OVERLAP_K = 35.0;      // eV por superposición H–H calibrada.
let H_OVERLAP_DMIN = 0.72;   // Å.
let H_OVERLAP_MODE = 'max';  // geom | topo | max | sum.

// Geometría importada desde LAMMPS/XYZ/POSCAR/XV.
let IMPORTED_GRID = null;
let IMPORTED_META = null;

// H explícitos importados, ligados a un átomo padre para representación y
// conteo aunque no formen parte de la malla discreta B/N/C.
let IMPORTED_H_SITES = [];

// Fracción de la distancia átomo–vecino usada para posicionar un H hacia
// una valencia/enlace roto.
const H_BOND_FRAC = 0.38;

/**
 * Devuelve la energía base ε para un par de especies.
 *
 * Códigos: vacancia/H=0, N=1, B=2 y C=3.
 * La función conserva la tabla energética original del Hamiltoniano.
 *
 * @param {number} a Código de la primera especie.
 * @param {number} b Código de la segunda especie.
 * @returns {number} Energía ε del par en eV.
 */
function eps(a, b) {
  if (a === 0 && b === 0) return EPS_XX;

  if (a === 0 || b === 0) {
    const x = a || b;
    return x === 1 ? EPS_XN : x === 2 ? EPS_XB : EPS_XC;
  }

  if (a === 3 || b === 3) {
    const other = a === 3 ? b : a;
    return other === 3 ? EPS_CC : other === 1 ? EPS_CN : EPS_CB;
  }

  if (a === 1 && b === 1) return EPS_NN;
  if (a === 2 && b === 2) return EPS_BB;
  return EPS_NB;
}

/**
 * Devuelve la energía efectiva de un par para el Monte Carlo, incluyendo el
 * reservorio de H: cada enlace X–α (un H de pasivación) aporta εXα − s y el
 * enlace vacancia–vacancia aporta epsVacVac().
 *
 * [FIX v15.0] v14.x sumaba +μH con pesos empíricos 1 / 0.5 / 0.7 para
 * N / B / C. Ese signo favorecía los bordes pasivados en ambientes pobres en H
 * y los pesos no tienen justificación termodinámica: el potencial químico de
 * un H es el mismo sea cual sea el átomo al que se une. En modo 'tesis' con
 * Δμ_H = 0, epsEff() coincide exactamente con eps().
 *
 * @param {number} a Código de la primera especie.
 * @param {number} b Código de la segunda especie.
 * @returns {number} Energía efectiva del par en eV.
 */
function epsEff(a, b) {
  if (a === 0 && b === 0) return epsVacVac();
  const base = eps(a, b);
  if (a === 0 || b === 0) return base - hydrogenShift();
  return base;
}

const N_T = 1;
const B_T = 2;
const V_T = 0;
const C_T = 3;

// ============================================================================
// 6. GEOMETRÍA HEXAGONAL, PERIODICIDAD Y PRIMEROS VECINOS
// ============================================================================
// La malla lógica se transforma a coordenadas físicas mediante atomPos().
// En orientación ZZ se intercambian los ejes físicos X/Y respecto de los
// índices internos; por eso la periodicidad debe resolverse por eje físico.

const LX = D / 2;
const LY = D * Math.sqrt(3) / 2;
const DX = 2 * LX + 2 * D;
const DY = 2 * LY;

let latticeOrient = 'AC';
let latticeStart = 'B';

/**
 * Determina la especie B/N que corresponde a un sitio de la red h-BN ideal.
 *
 * @param {number} i Índice de fila de la malla.
 * @param {number} j Índice de columna de la malla.
 * @returns {number} Código de especie N_T o B_T.
 */
function baseHBNType(i, j) {
  const odd = ((i + j) & 1) === 1;
  return latticeStart === 'N' ? (odd ? N_T : B_T) : (odd ? B_T : N_T);
}

/**
 * Calcula el desplazamiento de subred requerido para obtener una terminación
 * N o B en estructuras que dependen de la subred inicial.
 *
 * @param {string} term Terminación deseada: 'N' o 'B'.
 * @returns {number} Desplazamiento binario 0 o 1.
 */
function edgeOffsetForTerm(term) {
  const wantN = term === 'N';
  if (latticeStart === 'N') return wantN ? 1 : 0;
  return wantN ? 0 : 1;
}

/**
 * Convierte un índice discreto de malla a coordenadas físicas del panal.
 *
 * La expresión geométrica original se conserva sin modificación algebraica.
 * En orientación ZZ el resultado intercambia X e Y respecto de AC.
 *
 * @param {number} i0 Índice de fila.
 * @param {number} j0 Índice de columna.
 * @returns {[number, number]} Coordenadas físicas [x, y] en Å.
 */
function atomPos(i0, j0) {
  const sr = i0 & 1;
  const sc = j0 & 1;
  const cr = i0 >> 1;
  const cc = j0 >> 1;

  const x = cc * DX + (sr === 0
    ? (sc === 0 ? LX : LX + D)
    : (sc === 0 ? 0 : 2 * LX + D));
  const y = cr * DY + (sr === 0 ? LY : 0);

  return latticeOrient === 'ZZ' ? [y, x] : [x, y];
}

// Periodicidad configurable por eje físico.
// pbcX/pbcY siempre significan ejes físicos de pantalla/celda:
// X horizontal y Y vertical. En orientación ZZ atomPos() intercambia los
// ejes de la malla (fila→X físico, columna→Y físico), por lo que no puede
// asociarse pbcX siempre con columnas ni pbcY siempre con filas.
let pbcX = true;
let pbcY = true;

/**
 * Indica si el eje de filas internas es periódico en la orientación activa.
 *
 * @returns {boolean} true cuando las filas deben cerrarse periódicamente.
 */
function pbcForGridRow() {
  return latticeOrient === 'ZZ' ? pbcX : pbcY;
}

/**
 * Indica si el eje de columnas internas es periódico en la orientación activa.
 *
 * @returns {boolean} true cuando las columnas deben cerrarse periódicamente.
 */
function pbcForGridCol() {
  return latticeOrient === 'ZZ' ? pbcY : pbcX;
}


/**
 * Devuelve dimensiones compatibles con la paridad bipartita de la red cuando
 * una dirección interna está sometida a condiciones periódicas.
 *
 * Una traslación periódica sobre un número impar de celdas cambia la paridad
 * de la subred y puede romper la reciprocidad de los primeros vecinos. Para
 * evitarlo, solo la dimensión interna periódica se eleva al siguiente entero
 * par. Los ejes abiertos conservan su tamaño original.
 *
 * @param {number} nx Número de columnas internas.
 * @param {number} ny Número de filas internas.
 * @param {'AC'|'ZZ'} orient Orientación física de la red.
 * @param {boolean} periodicX Periodicidad física en X.
 * @param {boolean} periodicY Periodicidad física en Y.
 * @returns {{nx:number,ny:number,changed:boolean,rowPeriodic:boolean,colPeriodic:boolean}}
 */
function normalizePeriodicGridDimensions(nx, ny, orient=latticeOrient, periodicX=pbcX, periodicY=pbcY) {
  const rowPeriodic = orient === 'ZZ' ? periodicX : periodicY;
  const colPeriodic = orient === 'ZZ' ? periodicY : periodicX;
  let nxOut = Math.max(1, Math.trunc(nx));
  let nyOut = Math.max(1, Math.trunc(ny));

  if (colPeriodic && (nxOut & 1)) nxOut += 1;
  if (rowPeriodic && (nyOut & 1)) nyOut += 1;

  return {
    nx: nxOut,
    ny: nyOut,
    changed: nxOut !== nx || nyOut !== ny,
    rowPeriodic,
    colPeriodic
  };
}

/**
 * Obtiene los tres primeros vecinos físicos de un sitio de la red.
 *
 * Los candidatos dependen de la subred determinada por la paridad de fila y
 * columna. Los vecinos que salen por un borde abierto se descartan; los que
 * cruzan un eje periódico se reinyectan mediante módulo positivo.
 *
 * @param {number} i0 Fila del sitio central.
 * @param {number} j0 Columna del sitio central.
 * @param {number} ny Número de filas de la red.
 * @param {number} nx Número de columnas de la red.
 * @returns {Array<[number, number]>} Índices [fila, columna] de vecinos válidos.
 */
function physNB(i0, j0, ny, nx) {
  const sr = i0 & 1;
  const sc = j0 & 1;

  // Candidatos crudos según subred. Se mantienen exactamente los deltas
  // validados contra atomPos().
  let raw;
  if (sr === 0 && sc === 0) raw = [[i0, j0 + 1], [i0 + 1, j0], [i0 + 3, j0]];
  else if (sr === 0 && sc === 1) raw = [[i0, j0 - 1], [i0 + 1, j0], [i0 + 3, j0]];
  else if (sr === 1 && sc === 0) raw = [[i0 - 3, j0], [i0 - 1, j0], [i0, j0 - 1]];
  else raw = [[i0 - 3, j0], [i0 - 1, j0], [i0, j0 + 1]];

  const result = [];
  const rowPeriodic = pbcForGridRow();
  const colPeriodic = pbcForGridCol();

  for (const [ri, rj] of raw) {
    let fi = ri;
    let fj = rj;

    // Fila interna: AC→Y físico, ZZ→X físico.
    if (rowPeriodic) {
      fi = ((ri % ny) + ny) % ny;
    } else if (ri < 0 || ri >= ny) {
      continue;
    }

    // Columna interna: AC→X físico, ZZ→Y físico.
    if (colPeriodic) {
      fj = ((rj % nx) + nx) % nx;
    } else if (rj < 0 || rj >= nx) {
      continue;
    }

    result.push([fi, fj]);
  }

  return result;
}

/**
 * Devuelve los tres vecinos topológicos crudos sin recorte ni periodicidad.
 * Se usa para detectar valencias abiertas y colocar H de pasivación.
 *
 * @param {number} i0 Fila del sitio central.
 * @param {number} j0 Columna del sitio central.
 * @returns {Array<[number, number]>} Tres vecinos crudos [fila, columna].
 */
function rawNB(i0, j0) {
  const sr = i0 & 1;
  const sc = j0 & 1;

  if (sr === 0 && sc === 0) return [[i0, j0 + 1], [i0 + 1, j0], [i0 + 3, j0]];
  if (sr === 0 && sc === 1) return [[i0, j0 - 1], [i0 + 1, j0], [i0 + 3, j0]];
  if (sr === 1 && sc === 0) return [[i0 - 3, j0], [i0 - 1, j0], [i0, j0 - 1]];
  return [[i0 - 3, j0], [i0 - 1, j0], [i0, j0 + 1]];
}

/**
 * Mapea un vecino crudo a un índice lineal válido de la red global.
 *
 * Si el vecino sale por un eje abierto devuelve null. En ejes periódicos
 * aplica el mismo módulo positivo utilizado por physNB().
 *
 * @param {number} ri Fila cruda del vecino.
 * @param {number} rj Columna cruda del vecino.
 * @returns {number|null} Índice lineal o null si el vecino queda fuera.
 */
function mapRawNeighborIndex(ri, rj) {
  let fi = ri;
  let fj = rj;
  const rowPeriodic = pbcForGridRow();
  const colPeriodic = pbcForGridCol();

  if (rowPeriodic) fi = ((ri % Ny) + Ny) % Ny;
  else if (ri < 0 || ri >= Ny) return null;

  if (colPeriodic) fj = ((rj % Nx) + Nx) % Nx;
  else if (rj < 0 || rj >= Nx) return null;

  return idx(fi, fj);
}
/**
 * Devuelve la energía de un enlace de pasivación H para una especie dada.
 *
 * @param {number} type Código de especie N/B/C.
 * @returns {number} Energía de pasivación en eV; cero para otros códigos.
 */
function hBondEnergyForType(type) {
  if (type === N_T || type === B_T || type === C_T) return epsEff(V_T, type);
  return 0;
}

/**
 * Construye la colección geométrica de H de pasivación del estado indicado.
 * Incluye H explícitos importados, H asociados a poros y H de bordes abiertos.
 *
 * @param {Array|TypedArray} state Estado de especies de la red.
 * @param {Set<number>|Array<number>|null} parentSet Subconjunto opcional de
 *   sitios padres a evaluar.
 * @returns {Array<object>} Sitios de H con posición, padre, especie y tipo.
 */
function collectPassivationHydrogens(state = G, parentSet = null) {
  const hs = [];
  if (!ready || !hPass) return hs;

  const allowed = parentSet ? new Set(parentSet) : null;

  // 1) Hidrógenos explícitos procedentes de una geometría importada.
  if (Array.isArray(IMPORTED_H_SITES) && IMPORTED_H_SITES.length) {
    for (const h of IMPORTED_H_SITES) {
      if (!h || !Number.isFinite(h.x) || !Number.isFinite(h.y)) continue;

      const parent = h.parent ?? -1;
      if (allowed && !allowed.has(parent)) continue;

      const type = (parent >= 0 && parent < state.length)
        ? state[parent]
        : (h.type ?? C_T);
      if (type === V_T) continue;

      hs.push({
        id: h.id || `impH:${hs.length}`,
        parent,
        type,
        kind: h.kind || 'imported',
        x: h.x,
        y: h.y,
      });
    }
  }

  const seen = new Set();
  const parents = parentSet
    ? Array.from(parentSet)
    : Array.from({ length: Nx * Ny }, (_, k) => k);

  // 2) Geometría explícita del constructor hBN/C.
  if (
    usingCustomConstructorGeometry()
    && Array.isArray(CUSTOM_POSITIONS)
    && Array.isArray(PNB)
    && PNB.length === Nx * Ny
  ) {
    for (const k of parents) {
      if (k < 0 || k >= Nx * Ny || state[k] === V_T) continue;

      const atom = CUSTOM_POSITIONS[k];
      if (!atom || !Number.isFinite(atom.x) || !Number.isFinite(atom.y)) continue;

      const neighbors = Array.isArray(PNB[k]) ? PNB[k] : [];
      for (const [ni, nj] of neighbors) {
        const nk = idx(ni, nj);
        if (nk < 0 || nk >= Nx * Ny || state[nk] !== V_T) continue;

        const key = `pore:${k}:${nk}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const vacancy = CUSTOM_POSITIONS[nk];
        if (!vacancy || !Number.isFinite(vacancy.x) || !Number.isFinite(vacancy.y)) continue;

        hs.push({
          id: key,
          parent: k,
          type: state[k],
          kind: 'pore',
          x: atom.x + (vacancy.x - atom.x) * H_BOND_FRAC,
          y: atom.y + (vacancy.y - atom.y) * H_BOND_FRAC,
        });
      }
    }
    return hs;
  }

  // 3) Red hexagonal regular: H hacia vacancias o hacia vecinos fuera de
  //    un borde abierto.
  for (const k of parents) {
    if (k < 0 || k >= Nx * Ny) continue;

    const type = state[k];
    if (type === V_T) continue;

    const i = Math.floor(k / Nx);
    const j = k % Nx;
    const [ax, ay] = atomPos(i, j);

    for (const [ri, rj] of rawNB(i, j)) {
      const nk = mapRawNeighborIndex(ri, rj);
      const isOpenEdge = nk === null;
      const isVacNeighbor = nk !== null && state[nk] === V_T;
      if (!isOpenEdge && !isVacNeighbor) continue;

      const id = `${k}:${ri},${rj}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const [tx, ty] = atomPos(ri, rj);
      hs.push({
        id,
        parent: k,
        type,
        kind: isOpenEdge ? 'edge' : 'pore',
        x: ax + (tx - ax) * H_BOND_FRAC,
        y: ay + (ty - ay) * H_BOND_FRAC,
      });
    }
  }

  return hs;
}

/**
 * Calcula la penalización estérica de un par H–H a una distancia dada.
 *
 * @param {number} d Distancia H–H en Å.
 * @returns {number} Penalización en eV.
 */
function hOverlapPairEnergyByDist(d) {
  const dmin = Math.max(0.1, +H_OVERLAP_DMIN || 0.72);
  const k = Math.max(0, +H_OVERLAP_K || 0);
  if (k <= 0 || d >= dmin) return 0;

  const q = 1 - d / dmin;
  return k * q * q;
}

/**
 * Suma la penalización H–H obtenida de distancias geométricas explícitas.
 *
 * @param {Array|TypedArray} state Estado de especies de la red.
 * @returns {{energy:number,nOverlap:number,minDist:number,nH:number}}
 */
function calcGeometricHOverlapPenalty(state = G) {
  const hs = collectPassivationHydrogens(state);
  let energy = 0;
  let nOverlap = 0;
  let minDist = Infinity;

  for (let a = 0; a < hs.length; a++) {
    for (let b = a + 1; b < hs.length; b++) {
      const d = Math.hypot(hs[a].x - hs[b].x, hs[a].y - hs[b].y);
      if (d < minDist) minDist = d;

      const e = hOverlapPairEnergyByDist(d);
      if (e > 0) {
        energy += e;
        nOverlap++;
      }
    }
  }

  return {
    energy,
    nOverlap,
    minDist: minDist === Infinity ? 0 : minDist,
    nH: hs.length,
  };
}

/**
 * Detecta componentes conexos de vacancias para un estado arbitrario.
 *
 * @param {Array|TypedArray} state Estado de especies de la red.
 * @returns {Array<Array<number>>} Clústeres ordenados de mayor a menor.
 */
function poreClustersForState(state = G) {
  if (!ready) return [];

  const visited = new Uint8Array(Nx * Ny);
  const clusters = [];

  for (let i = 0; i < Ny; i++) {
    for (let j = 0; j < Nx; j++) {
      const k = idx(i, j);
      if (state[k] !== V_T || visited[k]) continue;

      const cluster = [];
      const queue = [k];
      visited[k] = 1;

      while (queue.length) {
        const current = queue.shift();
        cluster.push(current);

        const ci = Math.floor(current / Nx);
        const cj = current % Nx;
        for (const [ni, nj] of PNB[idx(ci, cj)]) {
          const nk = idx(ni, nj);
          if (state[nk] === V_T && !visited[nk]) {
            visited[nk] = 1;
            queue.push(nk);
          }
        }
      }

      if (cluster.length) clusters.push(cluster);
    }
  }

  return clusters.sort((a, b) => b.length - a.length);
}

/**
 * Clasifica un clúster usando temporalmente un estado distinto de G.
 *
 * @param {Array<number>} cluster Índices del clúster de vacancias.
 * @param {Array|TypedArray} state Estado de especies a analizar.
 * @returns {object|null} Clasificación del poro.
 */
function classifyPoreClusterForState(cluster, state = G) {
  if (state === G) return classifyPoreCluster(cluster);

  const oldG = G;
  try {
    G = state;
    return classifyPoreCluster(cluster);
  } finally {
    G = oldG;
  }
}

/**
 * Calcula la corrección topológica H–H para poros pequeños/triangulares.
 *
 * @param {Array|TypedArray} state Estado de especies de la red.
 * @returns {{energy:number,nOverlap:number,details:Array<object>}}
 */
function calcTopologicalHOverlapPenalty(state = G) {
  if (!ready || !hPass) return { energy: 0, nOverlap: 0, details: [] };

  const details = [];
  let pairs = 0;

  for (const cluster of poreClustersForState(state)) {
    if (!cluster.length) continue;

    const cls = classifyPoreClusterForState(cluster, state);
    let p = 0;
    let kind = '';

    if (cluster.length === 1) {
      p = 3;
      kind = 'monovacancia';
    } else if (cluster.length === 2) {
      p = 2;
      kind = 'divacancia';
    } else if (cls && cls.key === 'triangle') {
      p = 3;
      kind = 'poro triangular';
    }

    if (p > 0) {
      pairs += p;
      details.push({
        kind,
        pairs: p,
        size: cluster.length,
        label: cls ? cls.label : kind,
      });
    }
  }

  return {
    energy: pairs * Math.max(0, +H_OVERLAP_K || 0),
    nOverlap: pairs,
    details,
  };
}

/**
 * Combina las correcciones geométrica y topológica según H_OVERLAP_MODE.
 *
 * @param {Array|TypedArray} state Estado de especies de la red.
 * @returns {object} Desglose completo de la penalización H–H.
 */
function calcHOverlapPenalty(state = G) {
  const geom = calcGeometricHOverlapPenalty(state);
  const topo = calcTopologicalHOverlapPenalty(state);
  let energy = geom.energy;
  let nOverlap = geom.nOverlap;
  const mode = (H_OVERLAP_MODE || 'max').toLowerCase();

  if (mode === 'topo') {
    energy = topo.energy;
    nOverlap = topo.nOverlap;
  } else if (mode === 'sum') {
    energy = geom.energy + topo.energy;
    nOverlap = geom.nOverlap + topo.nOverlap;
  } else if (mode === 'max' && topo.energy > geom.energy) {
    energy = topo.energy;
    nOverlap = topo.nOverlap;
  }

  return {
    energy,
    nOverlap,
    minDist: geom.minDist,
    nH: geom.nH,
    geomEnergy: geom.energy,
    geomPairs: geom.nOverlap,
    topoEnergy: topo.energy,
    topoPairs: topo.nOverlap,
    topoDetails: topo.details,
    mode,
  };
}

/**
 * Devuelve únicamente la energía total de solapamiento H–H.
 *
 * @param {Array|TypedArray} state Estado de especies de la red.
 * @returns {number} Energía en eV.
 */
function calcHydrogenOverlapEnergy(state = G) {
  return calcHOverlapPenalty(state).energy;
}

/**
 * Calcula la energía de pasivación asociada a valencias que terminan en
 * bordes abiertos físicos. En geometría custom usa CUSTOM_OPEN_VALENCE.
 *
 * @param {Array|TypedArray} state Estado de especies de la red.
 * @param {Set<number>|Array<number>|null} parentSet Subconjunto opcional.
 * @returns {number} Energía de pasivación en eV.
 */
function calcOpenEdgePassivationEnergy(state = G, parentSet = null) {
  if (!ready || !hPass) return 0;

  let energy = 0;
  const parents = parentSet
    ? Array.from(parentSet)
    : Array.from({ length: Nx * Ny }, (_, k) => k);

  if (
    usingCustomConstructorGeometry()
    && Array.isArray(CUSTOM_OPEN_VALENCE)
    && CUSTOM_OPEN_VALENCE.length === Nx * Ny
  ) {
    for (const k of parents) {
      if (k < 0 || k >= Nx * Ny) continue;

      const type = state[k];
      if (type === V_T) continue;

      const missing = Math.max(0, Number(CUSTOM_OPEN_VALENCE[k]) || 0);
      if (missing > 0) energy += missing * hBondEnergyForType(type);
    }
    return energy;
  }

  for (const k of parents) {
    if (k < 0 || k >= Nx * Ny) continue;

    const type = state[k];
    if (type === V_T) continue;

    const i = Math.floor(k / Nx);
    const j = k % Nx;
    for (const [ri, rj] of rawNB(i, j)) {
      if (mapRawNeighborIndex(ri, rj) === null) {
        energy += hBondEnergyForType(type);
      }
    }
  }

  return energy;
}

/**
 * Identifica los sitios padres cuyos H pueden cambiar tras un intercambio.
 *
 * @param {number} k1 Índice lineal del sitio 1.
 * @param {number} k2 Índice lineal del sitio 2.
 * @returns {Set<number>} Sitios potencialmente afectados.
 */
function affectedHParentsForSwap(k1, k2) {
  const set = new Set([k1, k2]);

  if (
    usingCustomConstructorGeometry()
    && Array.isArray(CUSTOM_OPEN_VALENCE)
    && CUSTOM_OPEN_VALENCE.length === Nx * Ny
  ) {
    return set;
  }

  for (const k of [k1, k2]) {
    const i = Math.floor(k / Nx);
    const j = k % Nx;
    for (const [ri, rj] of rawNB(i, j)) {
      const nk = mapRawNeighborIndex(ri, rj);
      if (nk !== null) set.add(nk);
    }
  }

  return set;
}

/**
 * Calcula la contribución de solapamiento H–H que involucra al menos un H
 * del subconjunto local, evitando doble conteo de pares.
 *
 * @param {Array<object>} localHs Hidrógenos del subconjunto local.
 * @param {Array<object>} allHs Todos los hidrógenos considerados.
 * @returns {number} Energía parcial en eV.
 */
function overlapSubsetEnergy(localHs, allHs) {
  if (!localHs.length || !allHs.length) return 0;

  const localIds = new Set(localHs.map((h) => h.id));
  const seen = new Set();
  let energy = 0;

  for (const h of localHs) {
    for (const other of allHs) {
      if (h.id === other.id) continue;

      const a = h.id < other.id ? h.id : other.id;
      const b = h.id < other.id ? other.id : h.id;
      const key = a + '|' + b;
      if (seen.has(key)) continue;
      if (!localIds.has(a) && !localIds.has(b)) continue;

      seen.add(key);
      energy += hOverlapPairEnergyByDist(
        Math.hypot(h.x - other.x, h.y - other.y),
      );
    }
  }

  return energy;
}

/**
 * Calcula ΔE del corrector H–H causado por intercambiar dos sitios.
 *
 * @param {number} k1 Índice lineal del sitio 1.
 * @param {number} k2 Índice lineal del sitio 2.
 * @returns {number} Cambio de energía en eV.
 */
function calcHydrogenOverlapDeltaBySwap(k1, k2) {
  if (!ready || !hPass || (+H_OVERLAP_K || 0) <= 0) return 0;

  const t1 = G[k1];
  const t2 = G[k2];

  // Si no se mueve una vacancia, las posiciones H–H no cambian.
  if (t1 !== V_T && t2 !== V_T) return 0;

  // Se usa la misma definición global que calcFullE() para evitar deriva
  // con el corrector topológico (mono=3, di=2, triángulo=3 pares).
  const before = calcHydrogenOverlapEnergy(G);
  G[k1] = t2;
  G[k2] = t1;
  const after = calcHydrogenOverlapEnergy(G);
  G[k1] = t1;
  G[k2] = t2;

  return after - before;
}

/**
 * Calcula ΔE de pasivación de bordes abiertos para un intercambio.
 *
 * @param {number} k1 Índice lineal del sitio 1.
 * @param {number} k2 Índice lineal del sitio 2.
 * @returns {number} Cambio de energía en eV.
 */
function calcOpenEdgeDeltaBySwap(k1, k2) {
  if (!ready || !hPass) return 0;

  const keys = new Set([k1, k2]);
  const t1 = G[k1];
  const t2 = G[k2];
  const before = calcOpenEdgePassivationEnergy(G, keys);

  G[k1] = t2;
  G[k2] = t1;
  const after = calcOpenEdgePassivationEnergy(G, keys);
  G[k1] = t1;
  G[k2] = t2;

  return after - before;
}

// ============================================================================
// 8. ESTADO GLOBAL, GEOMETRÍAS EXPLÍCITAS Y UTILIDADES DE ARCHIVO
// ============================================================================
// Este bloque reúne el estado principal compartido entre los módulos y la
// compatibilidad con geometrías importadas o generadas explícitamente. Durante
// esta limpieza se conservan nombres, valores iniciales y relaciones globales.

let G = new Uint8Array(1);
let Nx = 16;
let Ny = 16;

// Δμ_H del Monte Carlo en eV (ver §3, reservorio de hidrógeno).
let muH = 0;

let tMode = 'anneal';
let nRuns = 1;
let curPhase = 0;

// Alias histórico: window.N expone y actualiza Nx desde otros módulos/UI.
Object.defineProperty(window, 'N', {
  get: () => Nx,
  set: v => { Nx = v; },
});

let PNB = [];
let GX = new Float32Array(1);
let GY = new Float32Array(1);
let SCALE = 1;

// Geometría explícita opcional, usada por el constructor hBN/C para que la
// estructura cargada conserve exactamente posiciones y enlaces de la vista
// previa, sin remapearse a la plantilla regular del simulador.
let CUSTOM_PNB = null;
let CUSTOM_POSITIONS = null;
let CUSTOM_OPEN_VALENCE = null;

/**
 * Verifica si existe una geometría explícita completa del constructor hBN/C.
 *
 * La geometría se considera utilizable únicamente cuando los metadatos la
 * marcan como custom y tanto posiciones como grafo tienen Nx*Ny entradas.
 *
 * @returns {boolean} true si la geometría explícita es consistente.
 */
function hasExplicitConstructorGeometry() {
  return !!(
    IMPORTED_META
    && IMPORTED_META.customGeometry
    && Array.isArray(CUSTOM_POSITIONS)
    && CUSTOM_POSITIONS.length === Nx * Ny
    && Array.isArray(CUSTOM_PNB)
    && CUSTOM_PNB.length === Nx * Ny
  );
}

/**
 * Alias semántico usado por el resto del simulador para detectar geometría
 * explícita generada por el constructor.
 *
 * @returns {boolean} Resultado de hasExplicitConstructorGeometry().
 */
function usingCustomConstructorGeometry() {
  return hasExplicitConstructorGeometry();
}

/**
 * Comprueba si la opción de estructura importada (opc=99) dispone de una
 * geometría compatible con las dimensiones globales Nx y Ny.
 *
 * Cubre tanto el grafo explícito del Constructor hBN/C como geometrías
 * importadas por archivo (LAMMPS/XYZ/POSCAR/XV). Esta comprobación evita el
 * clamping silencioso de los controles #iNx/#iNy durante la inicialización.
 *
 * @returns {boolean} true si existe una geometría importada/custom consistente.
 */
function hasConsistentImportedGeometry() {
  const opcEl = document.getElementById('iPore');
  const opc = opcEl ? +opcEl.value : NaN;

  if (opc !== 99) return false;
  if (usingCustomConstructorGeometry()) return true;

  return !!(IMPORTED_GRID && IMPORTED_GRID.length === Nx * Ny);
}

let POS_MNX = 0;
let POS_MNY = 0;
let POS_OX = 0;
let POS_OY = 0;

/**
 * Reconstruye la periodicidad real de una geometría explícita del constructor.
 *
 * Recalcula enlaces mediante la convención de imagen mínima y regenera
 * CUSTOM_PNB, CUSTOM_OPEN_VALENCE e IMPORTED_H_SITES. Las posiciones físicas
 * almacenadas no se alteran. Devuelve false si faltan capacidades o metadatos
 * requeridos del generador.
 *
 * @param {string} mode Periodicidad solicitada: 'XY', 'X', 'Y' o ninguna.
 * @returns {boolean} true cuando la reconstrucción se completa correctamente.
 */
function recomputeCustomGeometryPBC(mode) {
  if (!usingCustomConstructorGeometry() || !Array.isArray(CUSTOM_POSITIONS)) return false;

  const HBNC = (typeof window !== 'undefined') ? window.HBNCBandGenerator : null;
  if (
    !HBNC
    || typeof HBNC.computeBox !== 'function'
    || typeof HBNC.buildBonds !== 'function'
    || typeof HBNC.buildExplicitHydrogenSites !== 'function'
  ) return false;

  const meta = IMPORTED_META && IMPORTED_META.generator;
  if (!meta || !meta.widthCells || !meta.heightCells) return false;

  const bondLength = Number(meta.bondLength) || 1.44;
  const edgeFamily = meta.edgeFamily === 'AC' ? 'AC' : 'ZZ';
  const grid = {
    widthCells: Number(meta.widthCells) || 1,
    heightCells: Number(meta.heightCells) || 1,
  };
  const periodicMode = mode === 'XY'
    ? 'xy'
    : mode === 'X'
      ? 'x'
      : mode === 'Y'
        ? 'y'
        : 'none';
  const n = CUSTOM_POSITIONS.length;
  const ELEM = {};
  ELEM[N_T] = 'N';
  ELEM[B_T] = 'B';
  ELEM[C_T] = 'C';

  // Reconstruir átomos reales (no vacantes) en la convención original del
  // Constructor: CUSTOM_POSITIONS guarda y invertida (y=-a.y) para el canvas,
  // por lo que se revierte aquí antes de computeBox()/buildBonds().
  const validIdx = [];
  const validAtoms = [];

  for (let k = 0; k < n; k++) {
    if (G[k] === V_T) continue;

    const p = CUSTOM_POSITIONS[k];
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;

    validIdx.push(k);
    validAtoms.push({
      id: validAtoms.length + 1,
      x: p.x,
      y: -p.y,
      z: 0,
      element: ELEM[G[k]] || 'C',
    });
  }

  if (!validAtoms.length) return false;

  const box = HBNC.computeBox(validAtoms, 20, periodicMode, grid, bondLength, edgeFamily);
  const bonds = HBNC.buildBonds(validAtoms, bondLength, periodicMode, box);
  const adjacency = validAtoms.map(() => new Set());

  bonds.forEach(b => {
    const a = (Number(b.a) || 0) - 1;
    const c = (Number(b.b) || 0) - 1;

    if (a >= 0 && a < validAtoms.length && c >= 0 && c < validAtoms.length && a !== c) {
      adjacency[a].add(c);
      adjacency[c].add(a);
    }
  });

  const hSitesLocal = HBNC.buildExplicitHydrogenSites(
    validAtoms,
    adjacency,
    bondLength,
    periodicMode,
    box,
  );

  const newPNB = new Array(n).fill(null).map(() => []);
  const newOpenValence = new Array(n).fill(0);

  adjacency.forEach((set, li) => {
    const k = validIdx[li];
    newPNB[k] = Array.from(set)
      .sort((a, b) => a - b)
      .map(nl => [validIdx[nl], 0]);
    newOpenValence[k] = Math.max(0, 3 - set.size);
  });

  const newHSites = hSitesLocal.map(h => ({
    id: h.id,
    parent: validIdx[h.parent],
    type: h.type,
    kind: h.kind,
    x: h.x,
    y: h.y,
  }));

  CUSTOM_PNB = newPNB;
  CUSTOM_OPEN_VALENCE = newOpenValence;
  IMPORTED_H_SITES = newHSites;

  if (IMPORTED_META) {
    IMPORTED_META.runtimePBC = mode;
    IMPORTED_META.periodicBoundaryBonds = bonds.filter(b => b.periodic).length;
  }

  return true;
}

let ready = false;

// ---------------------------------------------------------------------------
// Guardado de archivos con selección de carpeta
// ---------------------------------------------------------------------------
// <a download> entrega el archivo a la carpeta configurada por el navegador.
// Cuando File System Access API está disponible, saveFile() permite al usuario
// elegir ubicación/nombre explícitamente; en caso contrario usa la descarga
// estándar del navegador.
let ASK_SAVE_LOCATION = true;
let SAVE_LAST_HANDLE = null;
const SAVE_FILE_PICKER_SUPPORTED = (
  typeof window !== 'undefined'
  && !!window.showSaveFilePicker
);

/**
 * Infiere el tipo MIME básico de un archivo a partir de su extensión.
 *
 * @param {string} filename Nombre de archivo, con o sin extensión reconocida.
 * @returns {string} MIME conocido o application/octet-stream como respaldo.
 */
function guessMimeFromExt(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map = {
    png: 'image/png',
    svg: 'image/svg+xml',
    json: 'application/json',
    csv: 'text/csv',
    xyz: 'text/plain',
    vasp: 'text/plain',
    data: 'text/plain',
    lammps: 'text/plain',
    xv: 'text/plain',
    webm: 'video/webm',
    zip: 'application/zip',
    txt: 'text/plain',
  };

  return map[ext] || 'application/octet-stream';
}

/**
 * Guarda datos como archivo usando File System Access API cuando el usuario
 * lo permite y el navegador la soporta; en otro caso crea una descarga
 * estándar mediante un enlace temporal.
 *
 * @param {string} filename Nombre sugerido del archivo.
 * @param {Blob|string|ArrayBuffer|any} data Contenido que se guardará.
 * @param {string} mime Tipo MIME opcional; se infiere si se omite.
 * @returns {Promise<boolean>} true si se completó/inició el guardado; false si
 *   el usuario canceló explícitamente el selector de archivo.
 */
async function saveFile(filename, data, mime) {
  const type = mime || guessMimeFromExt(filename);
  const blob = (data instanceof Blob) ? data : new Blob([data], { type });

  if (ASK_SAVE_LOCATION && SAVE_FILE_PICKER_SUPPORTED) {
    try {
      const ext = `.${(filename.split('.').pop() || 'dat').toLowerCase()}`;
      const opts = {
        suggestedName: filename,
        types: [{ description: 'Archivo', accept: { [type]: [ext] } }],
      };
      if (SAVE_LAST_HANDLE) opts.startIn = SAVE_LAST_HANDLE;

      const handle = await window.showSaveFilePicker(opts);
      SAVE_LAST_HANDLE = handle;

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      if (typeof addLog === 'function') addLog(`Guardado ✓ ${filename}`, 'g');
      return true;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        if (typeof addLog === 'function') addLog('Guardado cancelado por el usuario', 'i');
        return false;
      }

      console.warn('showSaveFilePicker falló, uso descarga estándar:', err);
      // Continúa con el método clásico de abajo.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  if (typeof addLog === 'function') {
    addLog(
      SAVE_FILE_PICKER_SUPPORTED
        ? `Descargado ✓ ${filename} (carpeta de Descargas del navegador)`
        : `Descargado ✓ ${filename} (carpeta de Descargas · elegir carpeta no está disponible en este navegador)`,
      'g',
    );
  }

  return true;
}

// Estado de ejecución y visualización compartido con render.js/controls.js.
let run = false;
let paused = false;
let raf = null;

// Límite superior de temperatura de la interfaz. Los ε del modelo absorben
// energías atómicas totales, de modo que los movimientos elementales cuestan
// decenas de eV; los protocolos de la tesis y del artículo usan hasta 20 000 K
// (ciclo de histéresis). Es una temperatura de simulación, no física.
const TEMP_MAX_K = 20000;
const TEMP_MIN_K = 1;

let step = 0;
let total = 50000;
let Ti = 5000;
let Tf = 500;
let T = 5000;
let E = 0;

/**
 * Temperatura de un paso según el protocolo térmico activo. La usan el bucle
 * interactivo, el modo lote y los barridos de investigación, de modo que los
 * tres reproducen exactamente la misma rampa.
 *
 *   anneal : rampa lineal Ti → Tf.
 *   iso    : T = Ti.
 *   3phase : Ti (30 %) → rampa (40 %) → Tf (30 %).
 *   cycle  : Ti → Tf durante la primera mitad y Tf → Ti durante la segunda
 *            (ciclo de calentamiento-enfriamiento para estudiar histéresis).
 *
 * @param {number} s Paso actual (0 ≤ s < n).
 * @param {number} n Número total de pasos.
 * @param {string} mode Modo térmico.
 * @param {number} t0 Temperatura inicial.
 * @param {number} t1 Temperatura final (o de retorno en 'cycle').
 * @returns {number} Temperatura en K.
 */
function temperatureAtStep(s, n, mode = tMode, t0 = Ti, t1 = Tf) {
  const N = Math.max(1, n);
  if (mode === 'iso') return t0;
  if (mode === '3phase') {
    const p1 = Math.floor(N * 0.3);
    const p2 = Math.floor(N * 0.7);
    if (s < p1) return t0;
    if (s < p2) return t0 + (t1 - t0) * (s - p1) / Math.max(1, p2 - p1);
    return t1;
  }
  if (mode === 'cycle') {
    const half = N / 2;
    return s < half
      ? t0 + (t1 - t0) * s / half
      : t1 + (t0 - t1) * (s - half) / half;
  }
  return t0 + (t1 - t0) * s / N;
}

/**
 * Fase del protocolo térmico (0, 1, 2) para indicadores de interfaz.
 *
 * @param {number} s Paso actual.
 * @param {number} n Número total de pasos.
 * @param {string} mode Modo térmico.
 * @returns {number}
 */
function temperaturePhaseAtStep(s, n, mode = tMode) {
  const N = Math.max(1, n);
  if (mode === '3phase') return s < Math.floor(N * 0.3) ? 0 : s < Math.floor(N * 0.7) ? 1 : 2;
  if (mode === 'cycle') return s < N / 2 ? 0 : 1;
  return s < N / 3 ? 0 : s < 2 * N / 3 ? 1 : 2;
}

const VIEW_FLAGS = { hideVolatile2D: false };

let accepted = 0;
let rejected = 0;
let hPass = true;

const HMAX = 300;
let hE = [];
let hS = [];
let hT = [];
let hA = [];
let hBN = [];

let SA = null;
let doAnim = false;
const AS = {
  p: 1,
  i1: 0,
  j1: 0,
  i2: 0,
  j2: 0,
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
  t1: 0,
  t2: 0,
  ts: 0,
};

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const idx = (i, j) => i * Nx + j;

// Porcentaje de intercambio global para h-BN puro (0..100)
// 0 = solo vecinos; >0 = mezcla local+global como en C
let globalSwapPct=0;

// Política MC para geometrías explícitas creadas/importadas desde el Constructor hBN/C.
// El simulador usa MC de intercambio sobre una red fija. Para una vacancia, un
// "movimiento" equivale a intercambiar Vacancia↔átomo vecino; para ordenamiento
// químico, equivale a B↔N. Estas políticas mantienen separados ambos mecanismos
// para evitar mezclas C/B/N no físicas por accidente.
let importedMCPolicy = 'auto'; // fixed | auto | bn | vacbn | vac | all

/**
 * Normaliza el identificador de política Monte Carlo para geometrías importadas.
 *
 * @param {string} v Política solicitada.
 * @returns {string} Política válida; usa "auto" como respaldo.
 */
function normalizeImportedMCPolicy(v) {
  v = String(v || 'auto').toLowerCase();
  return ['fixed', 'auto', 'bn', 'vacbn', 'vac', 'all'].includes(v) ? v : 'auto';
}

/**
 * Lee desde la interfaz la política MC para geometrías importadas/custom y
 * actualiza el estado global importedMCPolicy.
 *
 * @returns {string} Política normalizada actualmente activa.
 */
function readImportedMCPolicy() {
  const el = (typeof document !== 'undefined')
    ? document.getElementById('iImportedMCPolicy')
    : null;

  importedMCPolicy = normalizeImportedMCPolicy(
    el ? el.value : importedMCPolicy,
  );
  return importedMCPolicy;
}

/**
 * Convierte el código numérico de especie a una etiqueta corta legible.
 *
 * @param {number} t Código de especie.
 * @returns {string} N, B, C, Vac o ?.
 */
function speciesShort(t) {
  return t === N_T
    ? 'N'
    : t === B_T
      ? 'B'
      : t === C_T
        ? 'C'
        : t === V_T
          ? 'Vac'
          : '?';
}

/**
 * Genera una clave canónica para un par de especies independientemente del orden.
 *
 * @param {number} t1 Primera especie.
 * @param {number} t2 Segunda especie.
 * @returns {string} Clave del tipo "B↔N".
 */
function typePairKey(t1, t2) {
  const a = speciesShort(t1);
  const b = speciesShort(t2);
  return [a, b].sort().join('↔');
}

/**
 * Indica si una especie pertenece al par químico B/N.
 *
 * @param {number} t Código de especie.
 * @returns {boolean}
 */
function isBNType(t) {
  return t === N_T || t === B_T;
}

/**
 * Indica si un código representa una especie atómica explícita N/B/C.
 *
 * @param {number} t Código de especie.
 * @returns {boolean}
 */
function isAtomType(t) {
  return t === N_T || t === B_T || t === C_T;
}

/**
 * Evalúa si una política permite intercambiar dos tipos de especie.
 *
 * La migración de vacancias se restringe a movimientos locales excepto en el
 * modo destructivo explícito "all". El slider de movimientos globales acelera
 * principalmente reordenamientos B↔N y no teletransporta vacancias por defecto.
 *
 * @param {number} t1 Primera especie.
 * @param {number} t2 Segunda especie.
 * @param {string|null} policyOverride Política opcional que sustituye la global.
 * @param {'local'|'global'} scope Alcance del movimiento.
 * @returns {boolean} true si el intercambio está permitido.
 */
function policyAllowsTypes(t1, t2, policyOverride = null, scope = 'local') {
  if (t1 === t2) return false;

  const policy = normalizeImportedMCPolicy(
    policyOverride || importedMCPolicy,
  );
  if (policy === 'fixed') return false;

  const hasVac = t1 === V_T || t2 === V_T;
  const otherVac = t1 === V_T ? t2 : (t2 === V_T ? t1 : null);
  const bnPair = isBNType(t1) && isBNType(t2);

  if (scope === 'global' && hasVac && policy !== 'all') return false;

  if (policy === 'bn') return bnPair;

  if (policy === 'vacbn') {
    // hBN activo y carbono fijo: B↔N, B↔Vac, N↔Vac. No C.
    return (t1 === V_T || isBNType(t1)) && (t2 === V_T || isBNType(t2));
  }

  if (policy === 'auto' || policy === 'vac') {
    // Recomendado: B↔N + migración de vacancias con B/N/C.
    // No permite mezcla directa C↔B/N.
    if (bnPair) return true;
    if (hasVac && isAtomType(otherVac)) return true;
    return false;
  }

  if (policy === 'all') return true;
  return false;
}

/**
 * Comprueba si dos sitios concretos son un movimiento Monte Carlo elegible.
 *
 * En una geometría regular conserva la regla histórica: cualquier par de tipos
 * distintos es elegible. En geometrías explícitas aplica importedMCPolicy.
 *
 * @param {number} k1 Índice lineal del sitio 1.
 * @param {number} k2 Índice lineal del sitio 2.
 * @param {'local'|'global'} scope Alcance del movimiento.
 * @returns {boolean}
 */
function mcPairAllowed(k1, k2, scope = 'local') {
  if (k1 === k2) return false;

  const t1 = G[k1];
  const t2 = G[k2];
  if (t1 === t2) return false;

  if (usingCustomConstructorGeometry()) {
    return policyAllowsTypes(t1, t2, null, scope);
  }

  return true;
}

/**
 * Cuenta cuántos sitios de cada especie existen en la configuración actual.
 *
 * @returns {Object<number,number>} Conteo indexado por código de especie.
 */
function countSpeciesTypes() {
  const counts = {};
  for (let k = 0; k < Nx * Ny; k++) {
    counts[G[k]] = (counts[G[k]] || 0) + 1;
  }
  return counts;
}

/**
 * Cuenta combinatoriamente los pares globales permitidos por tipos de especie.
 *
 * @param {string|null} policyOverride Política opcional.
 * @returns {{total:number,byType:object,counts:object}}
 */
function countAllowedGlobalPairsByTypes(policyOverride = null) {
  const counts = countSpeciesTypes();
  const types = [V_T, N_T, B_T, C_T].filter((t) => (counts[t] || 0) > 0);
  let total = 0;
  const byType = {};

  for (let a = 0; a < types.length; a++) {
    for (let b = a + 1; b < types.length; b++) {
      const t1 = types[a];
      const t2 = types[b];
      if (!policyAllowsTypes(t1, t2, policyOverride, 'global')) continue;

      const c = (counts[t1] || 0) * (counts[t2] || 0);
      if (c <= 0) continue;

      const key = typePairKey(t1, t2);
      byType[key] = (byType[key] || 0) + c;
      total += c;
    }
  }

  return { total, byType, counts };
}

/**
 * Cuenta los pares de primeros vecinos que son movimientos MC locales válidos.
 *
 * @param {string|null} policyOverride Política opcional.
 * @returns {{total:number,byType:object,vacancyTouching:number}}
 */
function countAllowedLocalPairs(policyOverride = null) {
  const out = { total: 0, byType: {}, vacancyTouching: 0 };
  if (!ready || !G || !PNB || !PNB.length) return out;

  for (let k = 0; k < Nx * Ny; k++) {
    const list = Array.isArray(PNB[k]) ? PNB[k] : [];

    for (const [ni, nj] of list) {
      const nk = idx(ni, nj);
      if (nk <= k) continue;

      const t1 = G[k];
      const t2 = G[nk];
      const allowed = policyOverride !== null
        ? policyAllowsTypes(t1, t2, policyOverride, 'local')
        : mcPairAllowed(k, nk);

      if (!allowed) continue;

      out.total++;
      const key = typePairKey(t1, t2);
      out.byType[key] = (out.byType[key] || 0) + 1;
      if (t1 === V_T || t2 === V_T) out.vacancyTouching++;
    }
  }

  return out;
}

/**
 * Resume el número de movimientos locales/globales disponibles y diagnostica
 * por qué una configuración puede no tener movimientos activos.
 *
 * @returns {object} Resumen de elegibilidad MC.
 */
function countAllowedMCMoves() {
  const policy = usingCustomConstructorGeometry()
    ? normalizeImportedMCPolicy(importedMCPolicy)
    : 'regular';

  const out = {
    local: 0,
    global: 0,
    active: 0,
    policy,
    globalPct: globalSwapPct || 0,
    localByType: {},
    globalByType: {},
    reason: '',
  };

  if (!ready || !G || !PNB || !PNB.length) {
    out.reason = 'red no inicializada';
    return out;
  }

  const local = countAllowedLocalPairs();
  out.local = local.total;
  out.localByType = local.byType;
  out.vacancyLocal = local.vacancyTouching;

  let global = { total: 0, byType: {} };
  if (usingCustomConstructorGeometry()) {
    if (policy !== 'fixed' && (globalSwapPct || 0) > 0) {
      global = countAllowedGlobalPairsByTypes();
    }
  } else if ((isCarbon ? 30 : (globalSwapPct || 0)) > 0) {
    // Conteo aproximado por tipos; suficiente para diagnóstico.
    // El motor regular conserva su lógica histórica de selección.
    global = countAllowedGlobalPairsByTypes('all');
  }

  out.global = global.total;
  out.globalByType = global.byType;

  const globalFrac = usingCustomConstructorGeometry()
    ? (policy === 'fixed' ? 0 : (globalSwapPct / 100))
    : (isCarbon ? 0.30 : (globalSwapPct / 100));

  out.active = out.local + (globalFrac > 0 ? out.global : 0);

  if (out.active <= 0) {
    if (usingCustomConstructorGeometry()) {
      if (policy === 'fixed') {
        out.reason = 'modo conservar: estructura estática';
      } else if (policy === 'bn') {
        out.reason = 'no hay pares B↔N elegibles; este modo no mueve vacancias';
      } else if (policy === 'vacbn') {
        out.reason = 'no hay pares B/N/V elegibles; si la vacancia está en C, usa modo robusto/auto o vacancia móvil total';
      } else {
        out.reason = 'no hay pares elegibles para la política seleccionada';
      }
    } else {
      out.reason = 'no hay pares intercambiables';
    }
  }

  return out;
}

/**
 * Describe en lenguaje legible la política MC activa para geometrías explícitas.
 *
 * @returns {string}
 */
function describeImportedMCPolicy() {
  const p = normalizeImportedMCPolicy(importedMCPolicy);
  if (p === 'fixed') return 'estructura bloqueada: sin MC configuracional';
  if (p === 'auto') return 'robusto: B↔N + migración de vacancias con B/N/C; sin C↔B/N directo';
  if (p === 'bn') return 'solo B↔N; C y vacancias fijas';
  if (p === 'vacbn') return 'B/N y vacancias móviles en hBN; C fijo';
  if (p === 'vac') return 'vacancias móviles con B/N/C + B↔N; sin mezcla directa C↔B/N';
  return 'todos los intercambios permitidos';
}

/**
 * Formatea un conteo de movimientos agrupado por tipo de par.
 *
 * @param {object} obj Conteos por clave de especie.
 * @returns {string}
 */
function formatMoveByType(obj) {
  const entries = Object.entries(obj || {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return entries.length
    ? entries.map(([k, v]) => `${k}:${v}`).join(', ')
    : 'ninguno';
}

/**
 * Construye un diagnóstico legible de composición, política y movimientos MC.
 *
 * @returns {object} Diagnóstico completo de movimientos elegibles.
 */
function diagnoseImportedMCMoves() {
  const m = countAllowedMCMoves();
  const c = countSpeciesTypes();
  const counts = `N=${c[N_T] || 0} · B=${c[B_T] || 0} · C=${c[C_T] || 0} · Vac=${c[V_T] || 0}`;

  return {
    ...m,
    counts,
    nN: c[N_T] || 0,
    nB: c[B_T] || 0,
    nC: c[C_T] || 0,
    nVac: c[V_T] || 0,
    summary: `política=${describeImportedMCPolicy()} · ${counts} · locales=${m.local} (${formatMoveByType(m.localByType)}) · globales=${m.global} (${formatMoveByType(m.globalByType)})`,
    reason: m.reason,
  };
}

/**
 * Selecciona aleatoriamente un par vecino permitido por la política MC.
 *
 * Si los intentos aleatorios no encuentran un candidato, enumera exactamente
 * todos los pares vecinos válidos y elige uno de ellos al azar.
 *
 * @param {number} maxTries Número máximo de intentos aleatorios iniciales.
 * @returns {[number,number]|null} Índices lineales del par elegido.
 */
function pickLocalPair(maxTries = 128) {
  if (!ready || !PNB || !PNB.length) return null;

  const n = Nx * Ny;
  for (let a = 0; a < maxTries; a++) {
    const k1 = Math.floor(rand() * n);
    const nb = PNB[k1];
    if (!nb || !nb.length) continue;

    const [i2, j2] = nb[Math.floor(rand() * nb.length)];
    const k2 = idx(i2, j2);
    if (mcPairAllowed(k1, k2)) return [k1, k2];
  }

  // Fallback exacto para estructuras pequeñas o candidatos escasos.
  const pairs = [];
  for (let k = 0; k < n; k++) {
    const nb = PNB[k] || [];
    for (const [ni, nj] of nb) {
      const nk = idx(ni, nj);
      if (nk > k && mcPairAllowed(k, nk)) pairs.push([k, nk]);
    }
  }

  return pairs.length
    ? pairs[Math.floor(rand() * pairs.length)]
    : null;
}

/**
 * Selecciona al azar un sitio que contenga una especie determinada.
 *
 * @param {number} t Código de especie buscado.
 * @returns {number} Índice lineal o -1 cuando la especie no existe.
 */
function pickIndexOfType(t) {
  const hits = [];
  for (let k = 0; k < Nx * Ny; k++) {
    if (G[k] === t) hits.push(k);
  }

  return hits.length
    ? hits[Math.floor(rand() * hits.length)]
    : -1;
}

/**
 * Selecciona un par global permitido por la política MC activa.
 *
 * En geometrías explícitas pondera los pares de tipos por el producto de sus
 * abundancias. En la red regular conserva la selección aleatoria histórica.
 *
 * @returns {[number,number]|null} Índices lineales del par global.
 */
function pickGlobalPair() {
  if (!ready) return null;

  if (usingCustomConstructorGeometry()) {
    const counts = countSpeciesTypes();
    const types = [V_T, N_T, B_T, C_T].filter((t) => (counts[t] || 0) > 0);
    const weighted = [];
    let sum = 0;

    for (let a = 0; a < types.length; a++) {
      for (let b = a + 1; b < types.length; b++) {
        const t1 = types[a];
        const t2 = types[b];
        if (!policyAllowsTypes(t1, t2, null, 'global')) continue;

        const w = (counts[t1] || 0) * (counts[t2] || 0);
        if (w <= 0) continue;

        weighted.push([t1, t2, w]);
        sum += w;
      }
    }

    if (sum <= 0) return null;

    let r = rand() * sum;
    let chosen = weighted[0];
    for (const item of weighted) {
      r -= item[2];
      if (r <= 0) {
        chosen = item;
        break;
      }
    }

    const k1 = pickIndexOfType(chosen[0]);
    const k2 = pickIndexOfType(chosen[1]);
    if (k1 < 0 || k2 < 0 || k1 === k2) return null;
    return [k1, k2];
  }

  const n = Nx * Ny;
  for (let a = 0; a < 128; a++) {
    const k1 = Math.floor(rand() * n);
    let k2 = Math.floor(rand() * (n - 1));
    if (k2 >= k1) k2++;

    if (mcPairAllowed(k1, k2, 'global')) return [k1, k2];
  }

  return null;
}

/**
 * Evalúa y, si corresponde, aplica un intercambio Monte Carlo entre dos sitios.
 *
 * Esta función enlaza la selección de movimientos con el cálculo energético.
 * No modifica las fórmulas de ΔE: para vecinos usa calcDeltaE(); para movimientos
 * globales no vecinos usa calcDeltaE_global(). La aceptación conserva exactamente
 * el criterio de Metropolis original.
 *
 * @param {number} k1 Índice lineal del sitio 1.
 * @param {number} k2 Índice lineal del sitio 2.
 * @param {boolean} globalMove Indica si el intento fue seleccionado como global.
 * @returns {object|null} Resultado del intento o null para un par inválido.
 */
function attemptSwapPair(k1, k2, globalMove = false) {
  if (k1 == null || k2 == null || k1 === k2) {
    rejected++;
    return null;
  }

  const i1 = Math.floor(k1 / Nx);
  const j1 = k1 % Nx;
  const i2 = Math.floor(k2 / Nx);
  const j2 = k2 % Nx;
  const t1 = G[k1];
  const t2 = G[k2];

  if (!mcPairAllowed(k1, k2, globalMove ? 'global' : 'local')) {
    rejected++;
    return null;
  }

  const isNeighbor = PNB[k1]
    && PNB[k1].some(([ni, nj]) => ni === i2 && nj === j2);
  const dE = (!globalMove || isNeighbor)
    ? calcDeltaE(i1, j1, i2, j2)
    : calcDeltaE_global(i1, j1, i2, j2);

  if (dE < 0 || Math.exp(-dE / (KB * T)) > rand()) {
    G[k1] = t2;
    G[k2] = t1;
    E += dE;
    accepted++;

    return {
      i1,
      j1,
      i2,
      j2,
      t1,
      t2,
      ok: true,
      global: !!globalMove,
      dE,
    };
  }

  rejected++;
  return {
    i1,
    j1,
    i2,
    j2,
    t1,
    t2,
    ok: false,
    global: !!globalMove,
    dE,
  };
}

/**
 * Devuelve el código de especie almacenado en un índice lineal de la red.
 * @param {number} k Índice lineal del sitio.
 * @returns {number} Código de especie presente en G[k].
 */
function viewType(k) {
  return G[k];
}

// ── Vista 2D: zoom/pan ────────────────────────────────────────────────
const VIEW2D = {
  zoom: 1,
  panX: 0,
  panY: 0,
  minZoom: 0.45,
  maxZoom: 12,
  drag: false,
  lastX: 0,
  lastY: 0,
};
/** Actualiza la etiqueta porcentual del zoom 2D en la interfaz. */
function update2DZoomLabel() {
  const el = document.getElementById('zoom2DLbl');
  if (el) el.textContent = Math.round(VIEW2D.zoom * 100) + '%';
}
/**
 * Aplica al contexto Canvas la transformación de pan y zoom de la vista 2D.
 * @param {CanvasRenderingContext2D} ctxRef Contexto 2D a transformar.
 * @param {number} w Ancho del lienzo.
 * @param {number} h Alto del lienzo.
 */
function apply2DViewport(ctxRef, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  ctxRef.translate(cx + VIEW2D.panX, cy + VIEW2D.panY);
  ctxRef.scale(VIEW2D.zoom, VIEW2D.zoom);
  ctxRef.translate(-cx, -cy);
}
/** Convierte coordenadas del lienzo base a coordenadas transformadas por pan/zoom. */
function worldToView2D(x, y) {
  const cx = cv.width / 2;
  const cy = cv.height / 2;
  return {
    x: (x - cx) * VIEW2D.zoom + cx + VIEW2D.panX,
    y: (y - cy) * VIEW2D.zoom + cy + VIEW2D.panY,
  };
}
/** Convierte coordenadas de vista 2D a coordenadas del lienzo base. */
function viewToWorld2D(x, y) {
  const cx = cv.width / 2;
  const cy = cv.height / 2;
  return {
    x: (x - cx - VIEW2D.panX) / VIEW2D.zoom + cx,
    y: (y - cy - VIEW2D.panY) / VIEW2D.zoom + cy,
  };
}
/** Restablece pan y zoom de la vista 2D a sus valores iniciales. */
function reset2DView(silent = false) {
  VIEW2D.zoom = 1;
  VIEW2D.panX = 0;
  VIEW2D.panY = 0;
  update2DZoomLabel();
  if (!silent && ready) draw();
}
/**
 * Modifica el zoom alrededor de un punto ancla preservando su posición visual.
 */
function zoom2D(factor, anchorX = null, anchorY = null) {
  if (!cv.width || !cv.height) return;

  const ax = anchorX ?? cv.width / 2;
  const ay = anchorY ?? cv.height / 2;
  const before = viewToWorld2D(ax, ay);

  VIEW2D.zoom = Math.max(
    VIEW2D.minZoom,
    Math.min(VIEW2D.maxZoom, VIEW2D.zoom * factor),
  );

  const after = worldToView2D(before.x, before.y);
  VIEW2D.panX += ax - after.x;
  VIEW2D.panY += ay - after.y;

  update2DZoomLabel();
  if (ready) draw();
}

// ── Colores de átomos ─────────────────────────────────────────────────
const COL_N='#2563eb', COL_N_L='#93c5fd', COL_N_D='#1d4ed8';
const COL_B='#16a34a', COL_B_L='#86efac', COL_B_D='#15803d';
const COL_C='#475569', COL_C_L='#94a3b8', COL_C_D='#334155';
const COL_H='#f8fafc', COL_H_B='#94a3b8';
const COL_VAC='#e2e8f0', COL_VAC_B='#94a3b8';
const COL_BN_BOND='rgba(22,163,74,0.55)';
const COL_NN_BOND='rgba(37,99,235,0.22)';
const COL_BB_BOND='rgba(21,128,61,0.22)';
const COL_CC_BOND='rgba(71,85,105,0.35)';
const COL_VAC_BOND='rgba(148,163,184,0.4)';

// ── Generación de matrices ─────────────────────────────────────────────
// ── [NUEVO v14.7 · D2] Generadores de poro en ESPACIO REAL ────────────
// Los generadores de v14.6 (opc 6,7,10-14) dibujaban las formas en espacio de
// ÍNDICES, que es anisótropo por √3 (Δj=1 → 2.16 Å en x; Δi=1 → 1.247 Å en y) y
// donde la contigüidad NO implica vecindad física (los vecinos están en
// Δi = ±1, ±3). Medición del "triángulo" opc=10 antes del fix: 12.96 × 3.74 Å y
// FRAGMENTADO en 3 clusters. Ninguno de los 5 generadores geométricos producía
// un poro conexo.
//
// TERMINACIÓN DE SUBRED. La red es bipartita: todo vecino de un B es un N. Por
// tanto un poro con borde-N es aquel cuya capa más externa de vacancias era toda
// B. Eso NO se consigue purificando el borde a posteriori (deforma la figura:
// medido, el triángulo pasaba de compacidad 0.6046 a 0.77 y crecía de 91 a 106
// vacancias). Se consigue eligiendo la SUBRED DEL CENTRO y la ORIENTACIÓN del
// polígono respecto de las direcciones zigzag. Escaneo sistemático (28×28, AC):
//
//   forma        centro   rot    nvac  clusters  compacidad  bordes
//   triángulo    N        60°     25      1        0.6046     N=15 B=0   ← PURA-N
//   triángulo    B         0°     25      1        0.6046     N=0  B=15  ← PURA-B
//   hexágono     N         0°     19      1        0.8733     N=15 B=0   ← PURA-N
//   hexágono     B         0°     19      1        0.8733     N=0  B=15  ← PURA-B
//   hexágono     anillo   30°     42      1        0.9069     N=9  B=9   ← NH = BH
//   rombo        anillo    0°     32      1        0.8031     N=8  B=8   ← mixto
//
// Las tres formas salen idénticas en AC y en ZZ tras aplicar la regla de
// reflexión de rotaciones (ver buildPoreRealSpace).
//
// (compacidad analítica de referencia: triángulo 0.6046 · rombo 0.7854 ·
//  hexágono 0.9069 — el triángulo sale EXACTO)

// Devuelve el origen del polígono: átomo N central, átomo B central, o centro
// de anillo. [FIX v14.7.1] El centro de anillo se calculaba con un
// desplazamiento fijo de +D en x, válido sólo en orientación AC. En ZZ (donde
// atomPos intercambia los ejes) ese desplazamiento apuntaba a un sitio que no
// es centro de hexágono y los rombos salían deformados. Ahora se usa la
// geometría del panal: en un hexágono el radio circunscrito vale exactamente D,
// y desde un átomo p el centro del anillo opuesto a un enlace p→n está en
//     centro = p − D · versor(n − p)
// lo cual es válido en cualquier orientación.
/**
 * Calcula el centro geométrico usado para construir un poro.
 *
 * El origen puede fijarse sobre la subred N, la subred B o en el centro de un
 * anillo hexagonal. El cálculo del centro de anillo usa la geometría real del
 * panal y, por tanto, es válido tanto para orientación AC como ZZ.
 *
 * @param {'N'|'B'|'ring'} centerType Tipo de centro solicitado.
 * @returns {[number, number]} Coordenadas físicas [x, y] en Å.
 */
function poreCenterFor(centerType) {
  let sx = 0;
  let sy = 0;
  const n = Nx * Ny;

  for (let i = 0; i < Ny; i++) {
    for (let j = 0; j < Nx; j++) {
      const [x, y] = atomPos(i, j);
      sx += x;
      sy += y;
    }
  }
  sx /= n;
  sy /= n;

  const nearest = (want) => {
    let bd = Infinity;
    let bi = 0;
    let bj = 0;
    let bx = sx;
    let by = sy;

    for (let i = 0; i < Ny; i++) {
      for (let j = 0; j < Nx; j++) {
        if (baseHBNType(i, j) !== want) continue;
        const [x, y] = atomPos(i, j);
        const d = Math.hypot(x - sx, y - sy);
        if (d < bd) {
          bd = d;
          bx = x;
          by = y;
          bi = i;
          bj = j;
        }
      }
    }
    return { p: [bx, by], i: bi, j: bj };
  };

  if (centerType === 'N') return nearest(N_T).p;
  if (centerType === 'B') return nearest(B_T).p;

  // Centro del hexágono adyacente al átomo N más próximo al centro de la celda.
  const a = nearest(N_T);
  const nb = (PNB[idx(a.i, a.j)] || [])[0];
  if (!nb) return a.p;

  const [nx, ny] = atomPos(nb[0], nb[1]);
  let ux = nx - a.p[0];
  let uy = ny - a.p[1];
  const L = Math.hypot(ux, uy) || 1;
  ux /= L;
  uy /= L;

  return [a.p[0] - D * ux, a.p[1] - D * uy];
}

/**
 * Marca como vacancia todo sitio cuya posición REAL cae dentro de un polígono.
 * @param {'triangle'|'rhombus'|'hexagon'} shape
 * @param {number} R_ang   apotema del polígono en Å (controla el tamaño)
 * @param {number} rotDeg  rotación respecto de las direcciones de red
 * @param {'N'|'B'|'ring'} centerType  subred del origen → fija la terminación
 */
/**
 * Marca como vacancia cada sitio cuya posición física cae dentro del polígono
 * solicitado. La construcción se realiza en espacio real para evitar la
 * anisotropía propia de los índices de la malla.
 *
 * @param {'triangle'|'rhombus'|'hexagon'} shape Forma geométrica del poro.
 * @param {number} R_ang Apotema/tamaño del polígono en Å.
 * @param {number} rotDeg Rotación en grados respecto de la red.
 * @param {'N'|'B'|'ring'} centerType Subred/origen que fija la terminación.
 * @returns {number} Número de sitios convertidos en vacancia.
 */
function buildPoreRealSpace(shape, R_ang, rotDeg = 0, centerType = 'ring') {
  // En ZZ la red AC está reflejada (x↔y); la transformación angular conserva
  // las terminaciones y formas físicas obtenidas en AC.
  let rotEff = rotDeg;
  if (latticeOrient === 'ZZ') {
    rotEff = shape === 'rhombus' ? 30 - rotDeg : 90 - rotDeg;
  }

  const rot = rotEff * Math.PI / 180;
  const [ox, oy] = poreCenterFor(centerType);
  const nv = shape === 'triangle' ? 3 : shape === 'hexagon' ? 6 : 4;
  let cnt = 0;

  for (let i = 0; i < Ny; i++) {
    for (let j = 0; j < Nx; j++) {
      const [x, y] = atomPos(i, j);
      const dx = x - ox;
      const dy = y - oy;
      let dentro;

      if (shape === 'rhombus') {
        const a1 = [Math.cos(rot), Math.sin(rot)];
        const a2 = [Math.cos(rot + Math.PI / 3), Math.sin(rot + Math.PI / 3)];
        const det = a1[0] * a2[1] - a1[1] * a2[0];
        const u = (dx * a2[1] - dy * a2[0]) / det;
        const v = (-dx * a1[1] + dy * a1[0]) / det;
        dentro = Math.abs(u) <= R_ang && Math.abs(v) <= R_ang;
      } else {
        let m = -Infinity;
        for (let side = 0; side < nv; side++) {
          const th = rot + 2 * Math.PI * side / nv;
          const projection = dx * Math.cos(th) + dy * Math.sin(th);
          if (projection > m) m = projection;
        }
        dentro = m <= R_ang;
      }

      if (dentro) {
        G[idx(i, j)] = V_T;
        cnt++;
      }
    }
  }

  return cnt;
}

/**
 * Comprueba, con vecinos calculados al vuelo (physNB), que las vacancias de G
 * formen un único clúster no vacío y, si se pide, que todos los átomos de
 * borde sean de la especie indicada.
 *
 * @param {'N'|'B'|null} wantTerm Terminación requerida o null.
 * @returns {{ok:boolean,nVac:number,nClusters:number,edgeN:number,edgeB:number}}
 */
function validateSinglePore(wantTerm = null) {
  const n = Nx * Ny;
  const nbOf = (k) => physNB((k / Nx) | 0, k % Nx, Ny, Nx).map(([a, b]) => idx(a, b));
  const seen = new Uint8Array(n);
  let nVac = 0;
  let nClusters = 0;
  let edgeN = 0;
  let edgeB = 0;
  for (let k = 0; k < n; k++) {
    if (G[k] !== V_T) continue;
    nVac++;
    for (const nk of nbOf(k)) {
      if (G[nk] === N_T) edgeN++;
      else if (G[nk] === B_T) edgeB++;
    }
    if (seen[k]) continue;
    nClusters++;
    const q = [k];
    seen[k] = 1;
    while (q.length) {
      const c = q.pop();
      for (const nk of nbOf(c)) {
        if (G[nk] === V_T && !seen[nk]) { seen[nk] = 1; q.push(nk); }
      }
    }
  }
  let ok = nVac > 0 && nClusters === 1;
  if (ok && wantTerm === 'N') ok = edgeB === 0;
  if (ok && wantTerm === 'B') ok = edgeN === 0;
  return { ok, nVac, nClusters, edgeN, edgeB };
}

/**
 * Construye un poro geométrico válido: un único clúster y, en triángulos,
 * terminación pura. Si el tamaño nominal R no produce un poro válido (ocurre
 * en tamaños pequeños por la discretización de la red), se prueba el radio
 * válido más cercano en pasos de 0.02 Å. Los tamaños que ya eran válidos en
 * v14.7 no cambian.
 *
 * [FIX v15.0] En v14.7, opc 10/11 con tamaño 2 daban 4 fragmentos con la
 * terminación opuesta a la etiqueta y opc 12/13 con tamaño 1 no quitaban
 * ningún átomo.
 *
 * @returns {number} Número de vacancias creadas.
 */
function buildValidPore(shape, R_ang, rotDeg, centerType, wantTerm = null) {
  const reset = () => {
    for (let i = 0; i < Ny; i++) for (let j = 0; j < Nx; j++) G[idx(i, j)] = baseHBNType(i, j);
  };
  // Un triángulo zigzag mono-terminado de lado n tiene n² vacancias y su
  // centro cae, según n mod 3, sobre un átomo N, un átomo B o un anillo; con
  // un único tipo de centro solo existe uno de cada tres tamaños. Para los
  // triángulos se prueban los tres centros y las dos orientaciones; el
  // validador garantiza la terminación pedida.
  const combos = [[centerType, rotDeg]];
  if (shape === 'triangle') {
    for (const c of ['N', 'B', 'ring']) {
      for (const r of [rotDeg, rotDeg + 60]) {
        if (!(c === centerType && r === rotDeg)) combos.push([c, r]);
      }
    }
  }
  const tryR = (R, c, r) => {
    reset();
    buildPoreRealSpace(shape, R, r, c);
    return validateSinglePore(wantTerm);
  };
  if (tryR(R_ang, centerType, rotDeg).ok) return validateSinglePore(wantTerm).nVac;
  for (let s = 1; s <= 200; s++) {
    for (const R of [R_ang + 0.02 * s, R_ang - 0.02 * s]) {
      if (R <= 0.3) continue;
      for (const [c, r] of combos) {
        const v = tryR(R, c, r);
        if (v.ok) return v.nVac;
      }
    }
  }
  // Sin radio válido (red demasiado pequeña): se conserva la construcción nominal.
  tryR(R_ang, centerType, rotDeg);
  return validateSinglePore(wantTerm).nVac;
}

// Herramienta de DIAGNÓSTICO, no de construcción. Fuerza el borde a una sola
// subred quitando átomos, pero DEFORMA la figura (mide la compacidad antes y
// después para comprobarlo). Para poros mono-terminados usa buildPoreRealSpace
// con centerType='N' o 'B', que lo consigue sin deformar nada.
/**
 * Herramienta diagnóstica que fuerza el borde del poro hacia una sola subred.
 * Puede deformar la geometría, por lo que no se usa como constructor principal.
 */
function purifyPoreEdge(wantType) {
  if (!Array.isArray(PNB) || PNB.length !== Nx * Ny) return 0;

  let changed = true;
  let iter = 0;

  while (changed && iter < 50) {
    changed = false;
    iter++;

    for (let i = 0; i < Ny; i++) {
      for (let j = 0; j < Nx; j++) {
        const k = idx(i, j);
        const t = G[k];
        if (t !== N_T && t !== B_T) continue;
        if (t === wantType) continue;

        for (const [a, b] of (PNB[k] || [])) {
          if (G[idx(a, b)] === V_T) {
            G[k] = V_T;
            changed = true;
            break;
          }
        }
      }
    }
  }

  return iter;
}

// Comprobación de sanidad: ¿el poro es una sola pieza conexa?
/** Verifica que todas las vacancias formen un único componente conexo. */
function assertPoreConnected() {
  const clusters = getPoreClusters();
  let nVac = 0;
  for (let k = 0; k < Nx * Ny; k++) {
    if (G[k] === V_T) nVac++;
  }

  return {
    ok: clusters.length === 1 && clusters[0].length === nVac,
    nClusters: clusters.length,
    biggest: clusters.length ? clusters[0].length : 0,
    nVac,
  };
}

// [NUEVO v14.7 · D6] Relleno con ESTEQUIOMETRÍA EXACTA.
// Los generadores opc 3 y 4 sorteaban el TIPO en cada sitio de forma
// independiente: medido sobre 40 semillas en red 16×16, |N−B| llegaba a 28 y 38.
// Eso mete fluctuación de COMPOSICIÓN en la varianza del ensemble, que debería
// ser puramente CONFIGURACIONAL. Ahora se sortean SITIOS (Fisher-Yates).
/**
 * Rellena la red con cantidades exactas de vacancias, C, N y B.
 * Los sitios se barajan con Fisher–Yates para separar fluctuación configuracional
 * de fluctuación de composición.
 */
function fillStoichiometric(nVac, nCarb) {
  const total = Nx * Ny;
  const order = new Int32Array(total);
  for (let k = 0; k < total; k++) order[k] = k;

  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = order[i];
    order[i] = order[j];
    order[j] = t;
  }

  const nV = Math.min(Math.max(0, nVac | 0), total);
  const nC = Math.min(Math.max(0, nCarb | 0), total - nV);
  const rest = total - nV - nC;
  const nN = Math.floor(rest / 2);
  const nB = rest - nN;

  let p = 0;
  for (let i = 0; i < nV; i++) G[order[p++]] = V_T;
  for (let i = 0; i < nC; i++) G[order[p++]] = C_T;
  for (let i = 0; i < nN; i++) G[order[p++]] = N_T;
  for (let i = 0; i < nB; i++) G[order[p++]] = B_T;

  return { nN, nB, nC, nV };
}

// true mientras un análisis construye redes auxiliares: buildGrid() no toca
// entonces los controles de la interfaz ni los metadatos importados.
let BUILDGRID_HEADLESS = false;

/**
 * Construye la configuración inicial de la red según el código estructural.
 *
 * Responsabilidades del dispatcher:
 *   - restaurar/limpiar estado de geometrías importadas cuando opc !== 99;
 *   - inicializar la red h-BN base;
 *   - aplicar poros, aleaciones, interfaces, grafeno y nanocintas según opc;
 *   - conservar compatibilidad con códigos históricos y controles de interfaz.
 *
 * La lógica interna se mantiene deliberadamente sin dividir en esta fase para
 * preservar el comportamiento validado de cada opción estructural.
 *
 * @param {number} opc Código de estructura.
 * @param {number} nVac Número solicitado de vacancias (o conteo reutilizado por algunas opciones).
 * @param {number} psz Tamaño nominal del poro.
 */
function buildGrid(opc, nVac, psz) {
  if(opc!==99 && !BUILDGRID_HEADLESS){
    IMPORTED_GRID=null; IMPORTED_META=null; IMPORTED_H_SITES=[];
    CUSTOM_PNB=null; CUSTOM_POSITIONS=null; CUSTOM_OPEN_VALENCE=null;
    // [FIX v13.9] Si veníamos de una geometría del Constructor hBN/C, los
    // sliders #iNx/#iNy quedaron bloqueados (deshabilitados y con min/max
    // ampliados a la medida de esa geometría). Al generar una estructura
    // normal (opc≠99) se restauran a su rango de fábrica.
    const unlock=(id)=>{
      const el=document.getElementById(id);
      if(!el || !el.disabled) return;
      el.disabled=false; el.min='2'; el.max='48'; el.removeAttribute('title');
    };
    unlock('iNx'); unlock('iNy');
  }
  G=new Uint8Array(Nx*Ny);
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++)
    G[idx(i,j)]=baseHBNType(i,j);

  const cx=Math.floor(Ny/2), cy=Math.floor(Nx/2);
  const sz=Math.max(1,Math.min(psz,Math.floor(Math.min(Ny,Nx)/3)));

  if(opc===99 && IMPORTED_GRID && IMPORTED_GRID.length===Nx*Ny){
    G.set(IMPORTED_GRID);
    return;
  }
  if(opc===1) return;
  if(opc===2||opc===5){
    let p=0; while(p<nVac){const k=Math.floor(rand()*Nx*Ny);if(G[k]!==V_T){G[k]=V_T;p++;}} return;
  }
  if(opc===3){
    // [FIX v14.7 · D6] estequiometría exacta: se sortean SITIOS, no TIPOS.
    // Antes: |N−B| llegaba a 28 sobre 40 semillas en red 16×16.
    fillStoichiometric(nVac>0?nVac:Math.round(Nx*Ny*0.20),0);
    return;
  }
  if(opc===4){
    // ── Red aleatoria h-BN + vacancias + carbono (los tres simultáneos) ──
    // Razonamiento físico:
    //  1) Fondo: aleación B/N desordenada (50/50). El desorden inicial es intencional;
    //     el recocido MC rechaza enlaces homonucleares B–B / N–N (ε_BB=-67.9, ε_NN=-185.3
    //     menos favorables que ε_BN=-128.2) y ordena la red hexagonal.
    //  2) Carbono sustitucional (nC sitios). Tras el recocido, el C segrega en dominios
    //     porque (ε_CC + ε_BN) en dominios puros < (ε_CB + ε_CN) mezclados.
    //  3) Vacancias (nVac sitios). Sus bordes se pasivan con H usando ε_CH=-69.8 (nuevo
    //     DFT), ε_NH=-109.8, ε_BH=-50.3, de modo que las vacancias junto a C/N/B tienen
    //     el costo energético correcto y el sistema regulariza los bordes del poro.
    // nVac llega calculado desde iVac (% vacancias); el % de C se lee de iCarb.
    // [FIX v14.7 · D6] Antes el fondo B/N se sorteaba tipo a tipo y |N−B|
    // llegaba a 38 sobre 40 semillas. Ahora el reparto B/N es exacto.
    const carbPct=Math.max(0,Math.min(100,+(document.getElementById('iCarb')?.value||0)));
    const nCarb=Math.floor(Nx*Ny*carbPct/100);
    fillStoichiometric(nVac,nCarb);
    return;
  }
  // [v14.7] opc 6 y 7 se conservan como referencia histórica de la tesis
  // (implementación Fortran original en espacio de índices). NO usar para
  // figuras de morfología: producen poros anisótropos y fragmentados.
  // Para poros geométricos correctos usar opc 10-14.
  if(opc===6){
    const j0=Math.floor(Nx/4);
    for(let j=j0;j<=j0+3;j++){let k=j;for(let l=0;l<6&&k<Ny;l++){G[idx(k,j)]=V_T;k++;}} return;
  }
  if(opc===7){
    let nn=Math.min(11,Ny-1); const j0=Math.floor(Nx/4);
    for(let j=j0;j<=j0+6&&j<Nx;j++){let k=j;for(let l=0;l<nn&&k<Ny;l++){G[idx(k,j)]=V_T;k++;}nn=Math.max(0,nn-2);} return;
  }
  if(opc===8){
    let p=0; const lo=Math.floor(Ny/3),hi=Math.floor(2*Ny/3);
    while(p<nVac){G[idx(lo+Math.floor(rand()*(hi-lo+1)),lo+Math.floor(rand()*(hi-lo+1)))]=V_T;p++;}
    return;
  }
  // ── [FIX v14.7 · D2] Poros geométricos construidos en ESPACIO REAL ──
  // La terminación se fija por la subred del centro + la orientación, sin
  // purificar el borde (ver comentario extenso arriba). Resultado verificado:
  // 1 solo cluster y compacidad igual a la del polígono regular ideal.
  // El factor 1.35·sz reproduce aproximadamente los tamaños de poro de v14.6.
  if(opc===10){ buildValidPore('triangle',1.35*sz, 60,'N','N'); return; }  // borde N puro
  if(opc===11){ buildValidPore('triangle',1.35*sz,  0,'B','B'); return; }  // borde B puro
  // Paralelogramo: en h-BN tiene los DOS tipos de borde zigzag por construcción
  // (dos lados N y dos lados B), igual que en los HRTEM de Pham et al. 2016.
  // Por eso opc 12 y 13 son dos ORIENTACIONES, no dos terminaciones.
  if(opc===12){ buildValidPore('rhombus', 1.10*sz,  0,'ring'); return; }
  if(opc===13){ buildValidPore('rhombus', 1.10*sz, 60,'ring'); return; }
  // Hexágono con NH = BH en igual número (Tabla 5.5 de la tesis).
  if(opc===14){ buildValidPore('hexagon', 1.35*sz, 30,'ring'); return; }

  if(opc===20 || opc===21){
    // hBN con sustitución aleatoria de carbono. nVac se reusa como nC,
    // calculado desde el slider Vacantes / C%. Permite 0–100% de C.
    const nC=Math.max(0,Math.min(Nx*Ny,nVac));
    if(nC>=Nx*Ny){ for(let k=0;k<Nx*Ny;k++) G[k]=C_T; return; }
    let placed=0;
    while(placed<nC){
      const k=Math.floor(rand()*Nx*Ny);
      if(G[k]!==C_T){G[k]=C_T;placed++;}
    }
    return;
  }

  const fw=Math.max(1,Math.min(+document.getElementById('iFw').value,8));
  const fp=+document.getElementById('iFp').value/100;
  const ft=document.getElementById('iFt').value;

  // [NUEVO v14.1] Sembrar vacancias aleatorias también en estructuras de bandas.
  // Antes, opc 30/31/34/42 ignoraban el slider Vacantes%. Ahora, tras construir
  // la banda, se convierten nVac sitios aleatorios (reproducibles con semilla)
  // en vacancias — habilita estudios de heteroestructura hBN|C|hBN + poros.
  const seedBandVacancies=()=>{
    let p=0, guard=0;
    while(p<nVac && guard<Nx*Ny*50){
      const k=Math.floor(rand()*Nx*Ny); guard++;
      if(G[k]!==V_T){G[k]=V_T;p++;}
    }
  };

  if(opc===30){
    const i0=Math.max(0,Math.round(Ny*fp)-Math.floor(fw/2));
    const off=(ft==='zN')?edgeOffsetForTerm('N'):(ft==='zB')?edgeOffsetForTerm('B'):0;
    for(let i=i0+off;i<Math.min(Ny,i0+off+fw);i++)
      for(let j=0;j<Nx;j++) G[idx(i,j)]=C_T;
    seedBandVacancies();
    return;
  }
  if(opc===31){
    const j0=Math.max(0,Math.round(Nx*fp)-Math.floor(fw/2));
    const off=(ft==='zN')?edgeOffsetForTerm('N'):(ft==='zB')?edgeOffsetForTerm('B'):0;
    for(let j=j0+off;j<Math.min(Nx,j0+off+fw);j++)
      for(let i=0;i<Ny;i++) G[idx(i,j)]=C_T;
    seedBandVacancies();
    return;
  }
  if(opc===32){
    const jcut=Math.round(Nx*fp);
    for(let i=0;i<Ny;i++) for(let j=0;j<jcut;j++) G[idx(i,j)]=C_T;
    return;
  }
  if(opc===33){
    const i0=Math.max(0,Math.round(Ny*fp)-Math.floor(fw/2));
    const off=(ft==='zN')?edgeOffsetForTerm('N'):(ft==='zB')?edgeOffsetForTerm('B'):0;
    for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++) G[idx(i,j)]=C_T;
    for(let i=i0+off;i<Math.min(Ny,i0+off+fw);i++)
      for(let j=0;j<Nx;j++) G[idx(i,j)]=baseHBNType(i,j);
    return;
  }
  if(opc===34){
    const jcut1=Math.round(Nx*0.33), jcut2=Math.round(Nx*0.67);
    for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
      if(j<jcut1||j>=jcut2) G[idx(i,j)]=C_T;
    }
    seedBandVacancies();
    return;
  }

  const Wx=Math.max(2,Math.min(+document.getElementById('iWx')?.value||8,Nx-2));
  const Wy=Math.max(2,Math.min(+document.getElementById('iWy')?.value||8,Ny-2));
  const Wpos=+(document.getElementById('iWpos')?.value||0)/100;
  const wi0=Math.max(0,Math.round(Ny*0.1));
  const wj0=Math.max(0,Math.round(Nx*Wpos));

  if(opc===40){
    for(let k=0;k<Nx*Ny;k++) G[k]=V_T;
    for(let i=wi0;i<Math.min(Ny,wi0+Wy);i++)
      for(let j=wj0;j<Math.min(Nx,wj0+Wx);j++) G[idx(i,j)]=C_T;
    return;
  }
  if(opc===41){
    for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++) G[idx(i,j)]=C_T;
    for(let i=wi0;i<Math.min(Ny,wi0+Wy);i++)
      for(let j=wj0;j<Math.min(Nx,wj0+Wx);j++)
        G[idx(i,j)]=baseHBNType(i,j);
    return;
  }
  if(opc===43){
    for(let k=0;k<Nx*Ny;k++) G[k]=C_T;
    return;
  }
  if(opc===44){
    for(let k=0;k<Nx*Ny;k++) G[k]=V_T;
    for(let i=wi0;i<Math.min(Ny,wi0+Wy);i++)
      for(let j=wj0;j<Math.min(Nx,wj0+Wx);j++)
        G[idx(i,j)]=baseHBNType(i,j);
    return;
  }
  if(opc===45){
    for(let k=0;k<Nx*Ny;k++) G[k]=V_T;
    const tot2=Wy*2;
    for(let i=wi0;i<Math.min(Ny,wi0+tot2);i++)
      for(let j=wj0;j<Math.min(Nx,wj0+Wx);j++) G[idx(i,j)]=C_T;
    return;
  }
  if(opc===46){
    for(let k=0;k<Nx*Ny;k++) G[k]=V_T;
    const tot3=Wy*3;
    for(let i=wi0;i<Math.min(Ny,wi0+tot3);i++)
      for(let j=wj0;j<Math.min(Nx,wj0+Wx);j++) G[idx(i,j)]=C_T;
    return;
  }
  if(opc===42){
    const z1=Math.floor(Nx/3), z2=Math.floor(2*Nx/3);
    for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
      if(j<z1||j>=z2) G[idx(i,j)]=C_T;
    }
    seedBandVacancies();
    return;
  }
  if(opc===47){
    const m=2;
    for(let i=0;i<m;i++) for(let j=0;j<Nx;j++) G[idx(i,j)]=V_T;
    for(let i=Ny-m;i<Ny;i++) for(let j=0;j<Nx;j++) G[idx(i,j)]=V_T;
    if(((m&1)===1) !== (latticeStart==='N')) for(let j=0;j<Nx;j++) G[idx(m,j)]=V_T;
    return;
  }
  if(opc===48){
    const m=2;
    for(let i=0;i<m;i++) for(let j=0;j<Nx;j++) G[idx(i,j)]=V_T;
    for(let i=Ny-m;i<Ny;i++) for(let j=0;j<Nx;j++) G[idx(i,j)]=V_T;
    if(((m&1)===0) !== (latticeStart==='N')) for(let j=0;j<Nx;j++) G[idx(m,j)]=V_T;
    return;
  }
  if(opc===49){
    for(let j=0;j<Nx;j++) G[idx(0,j)]=V_T;
    for(let j=0;j<Nx;j++) G[idx(Ny-1,j)]=V_T;
    return;
  }
}

/**
 * Detecta los componentes conexos de vacancias usando la topología PNB actual.
 * @returns {Array<Array<number>>} Clústeres ordenados de mayor a menor tamaño.
 */
function getPoreClusters() {
  if (!ready) return [];

  const visited = new Uint8Array(Nx * Ny);
  const clusters = [];

  for (let i = 0; i < Ny; i++) {
    for (let j = 0; j < Nx; j++) {
      const k = idx(i, j);
      if (viewType(k) !== V_T || visited[k]) continue;

      const cluster = [];
      const queue = [k];
      visited[k] = 1;

      while (queue.length) {
        const cur = queue.shift();
        cluster.push(cur);
        const ci = Math.floor(cur / Nx);
        const cj = cur % Nx;

        for (const [ni, nj] of PNB[idx(ci, cj)]) {
          const nk = idx(ni, nj);
          if (viewType(nk) === V_T && !visited[nk]) {
            visited[nk] = 1;
            queue.push(nk);
          }
        }
      }

      if (cluster.length) clusters.push(cluster);
    }
  }

  return clusters.sort((a, b) => b.length - a.length);
}

/** Calcula área y perímetro de un polígono ordenado. */
function polygonMetrics(poly) {
  if (!poly || poly.length < 3) return { area: 0, perimeter: 0 };

  let area2 = 0;
  let perimeter = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    area2 += x1 * y2 - x2 * y1;
    perimeter += Math.hypot(x2 - x1, y2 - y1);
  }

  return { area: Math.abs(area2) / 2, perimeter };
}
/** Normaliza una etiqueta de forma de poro a su clave interna. */
function poreShapeToKey(shapeOrKey = '') {
  const s = (shapeOrKey || '').toLowerCase();
  if (s.includes('triangle') || s.includes('triáng')) return 'triangle';
  if (s.includes('parallelogram') || s.includes('paralel')) return 'parallelogram';
  if (s.includes('hexagon') || s.includes('hexág')) return 'hexagon';
  return 'irregular';
}
/** Devuelve la paleta de representación asociada a la forma del poro. */
function getPoreVisualPalette(shapeOrKey = 'irregular') {
  const key = poreShapeToKey(shapeOrKey);
  const map = {
    triangle: {
      key: 'triangle',
      hex: 0xf97316,
      fill: 'rgba(249,115,22,0.26)',
      stroke: 'rgba(249,115,22,0.95)',
    },
    parallelogram: {
      key: 'parallelogram',
      hex: 0x06b6d4,
      fill: 'rgba(6,182,212,0.24)',
      stroke: 'rgba(6,182,212,0.95)',
    },
    hexagon: {
      key: 'hexagon',
      hex: 0x7c3aed,
      fill: 'rgba(124,58,237,0.24)',
      stroke: 'rgba(124,58,237,0.96)',
    },
    irregular: {
      key: 'irregular',
      hex: 0xef4444,
      fill: 'rgba(239,68,68,0.22)',
      stroke: 'rgba(239,68,68,0.94)',
    },
  };
  return map[key] || map.irregular;
}
// ── [NUEVO v14.7 · D4] Despliegue de un clúster por imagen mínima ─────
// Sin esto, un poro que cruza la frontera periódica se detecta completo pero
// su casco convexo se calcula con coordenadas sin desplegar. Medido: el mismo
// poro de 19 vacancias daba 'parallelogram' en el centro y 'hexagon' en la
// esquina. Ese observable es el histograma de formas del modo LOTE, así que
// el defecto contaminaba la figura principal del artículo.
/**
 * Despliega un clúster que cruza fronteras periódicas mediante imagen mínima.
 * Esto permite medir su geometría en un espacio continuo antes de calcular el
 * casco convexo y clasificar la forma.
 */
function unwrapClusterPositions(cluster) {
  const LXp=D/2, LYp=D*Math.sqrt(3)/2, DXp=2*LXp+2*D, DYp=2*LYp;
  const W=(latticeOrient==='ZZ')?(Ny>>1)*DYp:(Nx>>1)*DXp;
  const H=(latticeOrient==='ZZ')?(Nx>>1)*DXp:(Ny>>1)*DYp;
  const pos=cluster.map(k=>atomPos((k/Nx)|0,k%Nx));
  const kIndex=new Map(cluster.map((k,n)=>[k,n]));
  const done=new Array(cluster.length).fill(false);
  const out=new Array(cluster.length).fill(null);
  out[0]=pos[0].slice(); done[0]=true;
  const queue=[0];
  while(queue.length){
    const n=queue.shift();
    const k=cluster[n], ci=(k/Nx)|0, cj=k%Nx;
    for(const [a,b] of (PNB[idx(ci,cj)]||[])){
      const m=kIndex.get(idx(a,b));
      if(m===undefined||done[m]) continue;
      let dx=pos[m][0]-out[n][0], dy=pos[m][1]-out[n][1];
      if(pbcX&&W>0) dx-=W*Math.round(dx/W);
      if(pbcY&&H>0) dy-=H*Math.round(dy/H);
      out[m]=[out[n][0]+dx,out[n][1]+dy];
      done[m]=true; queue.push(m);
    }
  }
  for(let n=0;n<out.length;n++) if(!out[n]) out[n]=pos[n].slice();
  return out;
}

// [REESCRITO v14.7 · D4+D5] Clasificador de poros.
// Cambios respecto de v14.6:
//   · posiciones desplegadas por PBC antes del casco convexo (D4);
//   · razón de aspecto medida en ESPACIO REAL mediante momentos de inercia
//     (invariante bajo rotación) en lugar de spanI/spanJ en espacio de índices,
//     que es anisótropo por √3 (D5);
//   · clasificación por proximidad a la compacidad analítica del polígono
//     regular, en lugar de umbrales numerológicos que mezclaban dos sistemas
//     de unidades:  triángulo 0.6046 · rombo 0.7854 · hexágono 0.9069.
/**
 * Clasifica un clúster de vacancias por forma, compacidad, relación de aspecto
 * y terminación B/N, usando posiciones físicas desplegadas bajo PBC.
 */
function classifyPoreCluster(cluster) {
  if(!ready||!cluster||cluster.length<1) return null;

  // Terminación de subred (sin cambios: ya era correcta)
  let nBorderN=0,nBorderB=0;
  for(const ck of cluster){
    const ci=Math.floor(ck/Nx),cj=ck%Nx;
    for(const[ni,nj]of (PNB[idx(ci,cj)]||[])){
      const t=G[idx(ni,nj)];
      if(t===N_T)nBorderN++; else if(t===B_T)nBorderB++;
    }
  }
  const term=nBorderN>=nBorderB?'N':'B';
  const termRatio=Math.max(nBorderN,nBorderB)/(nBorderN+nBorderB||1);

  const n=cluster.length;
  const pts=unwrapClusterPositions(cluster);
  const hull=convexHull(pts);
  const metrics=polygonMetrics(hull);

  // Razón de aspecto por momentos de inercia (1 = isótropo)
  const cx=pts.reduce((s,p)=>s+p[0],0)/n, cy=pts.reduce((s,p)=>s+p[1],0)/n;
  let sxx=0,syy=0,sxy=0;
  for(const [x,y] of pts){const a=x-cx,b=y-cy;sxx+=a*a;syy+=b*b;sxy+=a*b;}
  sxx/=n; syy/=n; sxy/=n;
  const tr=sxx+syy, dt=sxx*syy-sxy*sxy;
  const disc=Math.sqrt(Math.max(0,tr*tr/4-dt));
  const l1=tr/2+disc, l2=tr/2-disc;
  const ratio=l2>1e-9?Math.sqrt(l1/l2):99;

  const compactness=(metrics.area>0&&metrics.perimeter>0)
    ?(4*Math.PI*metrics.area/(metrics.perimeter*metrics.perimeter)):0;

  let key='irregular', shape='◯ Irregular';
  if(n>=3&&compactness>0){
    const cand=[
      {k:'triangle',      s:'△ Triángulo',     c:0.6046},
      {k:'parallelogram', s:'▱ Paralelogramo', c:0.7854},
      {k:'hexagon',       s:'⬡ Hexágono',      c:0.9069}
    ];
    let bestD=Infinity,bestC=null;
    for(const cc of cand){const d=Math.abs(compactness-cc.c); if(d<bestD){bestD=d;bestC=cc;}}
    if(bestD<0.10){ key=bestC.k; shape=bestC.s; }
    if(ratio>1.8&&key!=='triangle'){ key='parallelogram'; shape='▱ Paralelogramo'; }
  }

  const termLabel=termRatio>0.65?`borde-${term}`:'mixto';
  const label=`${shape} ${termLabel} (${n} vac.)`;
  const cxPx=cluster.reduce((s,k)=>s+(GX[k]||0),0)/n;
  const cyPx=cluster.reduce((s,k)=>s+(GY[k]||0),0)/n;
  return {key,shape,term,termLabel,label,n,size:n,cxPx,cyPx,
          hullVertices:hull.length,ratio,compactness,
          area:metrics.area,perimeter:metrics.perimeter,
          nBorderN,nBorderB,termRatio};
}
/** Clasifica el clúster de vacancias de mayor tamaño. */
function classifyPore() {
  return classifyPoreCluster(getPoreClusters()[0] || []);
}

/** Identifica sitios atómicos aislados, sin vecinos atómicos. */
function getVolatileSpeciesMask() {
  const mask = new Uint8Array(Nx * Ny);
  if (!ready) return mask;

  for (let i = 0; i < Ny; i++) {
    for (let j = 0; j < Nx; j++) {
      const k = idx(i, j);
      if (G[k] === V_T) continue;

      let atomNbs = 0;
      for (const [ni, nj] of PNB[k]) {
        if (G[idx(ni, nj)] !== V_T) atomNbs++;
      }
      if (atomNbs === 0) mask[k] = 1;
    }
  }

  return mask;
}
/** Devuelve la etiqueta química aproximada de una especie volátil. */
function getVolatileSpeciesLabel(type) {
  if (type === N_T) return 'NH₃';
  if (type === B_T) return 'BH₃';
  if (type === C_T) return 'CH₃';
  return 'XH₃';
}
/** Devuelve el estilo visual usado para marcar una especie volátil. */
function getVolatileSpeciesMarkerStyle(type) {
  if (type === N_T) {
    return {
      label: 'NH₃',
      stroke: 'rgba(147,51,234,0.96)',
      fill: 'rgba(196,181,253,0.18)',
      accent: '#6d28d9',
      hex: 0x7c3aed,
    };
  }
  if (type === B_T) {
    return {
      label: 'BH₃',
      stroke: 'rgba(249,115,22,0.96)',
      fill: 'rgba(254,215,170,0.18)',
      accent: '#c2410c',
      hex: 0xea580c,
    };
  }
  return {
    label: getVolatileSpeciesLabel(type),
    stroke: 'rgba(71,85,105,0.96)',
    fill: 'rgba(226,232,240,0.18)',
    accent: '#334155',
    hex: 0x475569,
  };
}
/**
 * Cuenta especies aisladas (XH₃) y monocoordinadas (XH₂) potencialmente
 * volátiles. Nota: por compatibilidad histórica, el nombre conserva
 * "Remove", pero esta función NO modifica la configuración G.
 */
function detectAndRemoveFloating() {
  if (!ready) return { bh3: 0, nh3: 0, bh2: 0, nh2: 0 };

  const volatileMask = getVolatileSpeciesMask();
  let bh3 = 0;
  let nh3 = 0;
  let bh2 = 0;
  let nh2 = 0;

  for (let k = 0; k < volatileMask.length; k++) {
    if (!volatileMask[k]) continue;
    const t = G[k];
    if (t === N_T) nh3++;
    else if (t === B_T) bh3++;
  }

  for (let i = 0; i < Ny; i++) {
    for (let j = 0; j < Nx; j++) {
      const k = idx(i, j);
      if (G[k] === V_T || volatileMask[k]) continue;

      let atomNbs = 0;
      for (const [ni, nj] of PNB[k]) {
        if (G[idx(ni, nj)] !== V_T) atomNbs++;
      }

      if (atomNbs === 1) {
        const t = G[k];
        if (t === N_T) nh2++;
        else if (t === B_T) bh2++;
      }
    }
  }

  return { bh3, nh3, bh2, nh2 };
}

/**
 * Construye la lista de primeros vecinos PNB para toda la red.
 * En geometrías custom reutiliza el grafo explícito; en la red regular llama
 * a physNB() para cada sitio.
 */
function buildPhysNB() {
  ready = false;

  if (
    usingCustomConstructorGeometry() &&
    Array.isArray(CUSTOM_PNB) &&
    CUSTOM_PNB.length === Nx * Ny
  ) {
    PNB = new Array(Nx * Ny);
    for (let k = 0; k < Nx * Ny; k++) {
      const list = Array.isArray(CUSTOM_PNB[k]) ? CUSTOM_PNB[k] : [];
      PNB[k] = list
        .map((p) => Array.isArray(p) ? [Math.round(p[0]), Math.round(p[1])] : null)
        .filter((p) => p && p[0] >= 0 && p[0] < Ny && p[1] >= 0 && p[1] < Nx);
    }
    ready = true;
    return;
  }

  PNB = new Array(Nx * Ny);
  for (let i = 0; i < Ny; i++) {
    for (let j = 0; j < Nx; j++) {
      PNB[idx(i, j)] = physNB(i, j, Ny, Nx);
    }
  }
  ready = true;
}

/** Calcula la escala y las coordenadas de pantalla de todos los sitios. */
function buildScreenPos() {
  reset2DView(true);
  const W = cv.width;
  const H = cv.height;
  if (W < 20 || H < 20) return;

  const hasCustom =
    usingCustomConstructorGeometry() &&
    Array.isArray(CUSTOM_POSITIONS) &&
    CUSTOM_POSITIONS.length === Nx * Ny &&
    CUSTOM_POSITIONS.some((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));

  let mnX = 1e9;
  let mxX = -1e9;
  let mnY = 1e9;
  let mxY = -1e9;

  const getPos = (i, j) => {
    const k = idx(i, j);
    const p = hasCustom ? CUSTOM_POSITIONS[k] : null;
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return [p.x, p.y];
    return atomPos(i, j);
  };

  for (let i = 0; i < Ny; i++) {
    for (let j = 0; j < Nx; j++) {
      const [x, y] = getPos(i, j);
      if (x < mnX) mnX = x;
      if (x > mxX) mxX = x;
      if (y < mnY) mnY = y;
      if (y > mxY) mxY = y;
    }
  }

  const pad = 24;
  SCALE = Math.min(
    (W - 2 * pad) / (mxX - mnX || 1),
    (H - 2 * pad) / (mxY - mnY || 1),
  );
  const ox = (W - (mxX - mnX) * SCALE) / 2;
  const oy = (H - (mxY - mnY) * SCALE) / 2;

  POS_MNX = mnX;
  POS_MNY = mnY;
  POS_OX = ox;
  POS_OY = oy;

  GX = new Float32Array(Nx * Ny);
  GY = new Float32Array(Nx * Ny);
  for (let i = 0; i < Ny; i++) {
    for (let j = 0; j < Nx; j++) {
      const k = idx(i, j);
      const [x, y] = getPos(i, j);
      GX[k] = ox + (x - mnX) * SCALE;
      GY[k] = oy + (y - mnY) * SCALE;
    }
  }
}
/** Convierte un sitio de red a coordenadas de pantalla. */
function latticeToScreenXY(i, j) {
  if (usingCustomConstructorGeometry() && i >= 0 && i < Ny && j >= 0 && j < Nx) {
    const k = idx(i, j);
    if (
      GX &&
      GY &&
      k < GX.length &&
      Number.isFinite(GX[k]) &&
      Number.isFinite(GY[k])
    ) {
      return [GX[k], GY[k]];
    }
  }

  const [x, y] = atomPos(i, j);
  return [POS_OX + (x - POS_MNX) * SCALE, POS_OY + (y - POS_MNY) * SCALE];
}
/**
 * Construye las posiciones de los H de pasivación en coordenadas de pantalla.
 * Atiende H importados, geometrías custom explícitas y red regular.
 */
function collectPassivationHydrogensScreen(parentSet=null) {
  const hs=[];
  if(!ready||!hPass) return hs;
  const allowed=parentSet?new Set(parentSet):null;
  if(Array.isArray(IMPORTED_H_SITES) && IMPORTED_H_SITES.length){
    for(const h of IMPORTED_H_SITES){
      if(!h || h.parent<0 || h.parent>=Nx*Ny) continue;
      const p=h.parent;
      if(allowed && !allowed.has(p)) continue;
      if(G[p]===V_T) continue;
      const i=(p/Nx)|0, j=p%Nx;
      const ax = Number.isFinite(GX[p]) ? GX[p] : latticeToScreenXY(i,j)[0];
      const ay = Number.isFinite(GY[p]) ? GY[p] : latticeToScreenXY(i,j)[1];
      const hx = Number.isFinite(h.x) ? POS_OX+(h.x-POS_MNX)*SCALE : ax;
      const hy = Number.isFinite(h.y) ? POS_OY+(h.y-POS_MNY)*SCALE : ay;
      hs.push({parent:p,type:G[p],x:hx,y:hy,kind:h.kind||'imported'});
    }
  }
  const parents=parentSet?Array.from(parentSet):Array.from({length:Nx*Ny},(_,k)=>k);
  if(usingCustomConstructorGeometry() && Array.isArray(CUSTOM_POSITIONS) && Array.isArray(PNB) && PNB.length===Nx*Ny){
    const seen=new Set();
    for(const k of parents){
      if(k<0||k>=Nx*Ny||G[k]===V_T) continue;
      const ax=GX[k], ay=GY[k];
      if(!Number.isFinite(ax)||!Number.isFinite(ay)) continue;
      const list=Array.isArray(PNB[k])?PNB[k]:[];
      for(const [ni,nj] of list){
        const nk=idx(ni,nj);
        if(nk<0||nk>=Nx*Ny||G[nk]!==V_T) continue;
        const key=`pore:${k}:${nk}`;
        if(seen.has(key)) continue;
        seen.add(key);
        const vx=GX[nk], vy=GY[nk];
        if(!Number.isFinite(vx)||!Number.isFinite(vy)) continue;
        hs.push({parent:k,type:G[k],x:ax+(vx-ax)*H_BOND_FRAC,y:ay+(vy-ay)*H_BOND_FRAC,kind:'pore'});
      }
    }
    return hs;
  }
  for(const k of parents){
    if(k<0||k>=Nx*Ny||G[k]===V_T) continue;
    const i=Math.floor(k/Nx), j=k%Nx;
    const [ax,ay]=latticeToScreenXY(i,j);
    for(const [ri,rj] of rawNB(i,j)){
      const nk=mapRawNeighborIndex(ri,rj);
      if(nk!==null&&G[nk]!==V_T) continue;
      const [tx,ty]=latticeToScreenXY(ri,rj);
      hs.push({parent:k,type:G[k],x:ax+(tx-ax)*H_BOND_FRAC,y:ay+(ty-ay)*H_BOND_FRAC,kind:nk===null?'edge':'pore'});
    }
  }
  return hs;
}

// ============================================================================
// ENERGÍA, CONTEOS Y ENERGÍA DE FORMACIÓN
// ============================================================================
// Este bloque concentra las magnitudes energéticas observables del estado G.
// Las fórmulas y el orden de evaluación se conservan respecto de v14.7.1.

/**
 * Calcula la energía total de la configuración actual.
 *
 * Recorre cada enlace dirigido de PNB, contabiliza el Hamiltoniano por pares y
 * divide entre dos para corregir el doble conteo. Después suma la pasivación de
 * bordes abiertos y la penalización por solapamiento H–H.
 *
 * @returns {number} Energía total de la configuración, en eV.
 */
function calcFullE() {
  if(!ready) return 0;
  let cNN=0,cNB=0,cBB=0,cXN=0,cXB=0,cXX=0,cCC=0,cCN=0,cCB=0,cXC=0;
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const a=G[idx(i,j)];
    for(const[ni,nj]of PNB[idx(i,j)]){
      const b=G[idx(ni,nj)];
      if(a===N_T&&b===N_T) cNN++;
      else if(a===B_T&&b===B_T) cBB++;
      else if((a===N_T&&b===B_T)||(a===B_T&&b===N_T)) cNB++;
      else if((a===V_T&&b===N_T)||(a===N_T&&b===V_T)) cXN++;
      else if((a===V_T&&b===B_T)||(a===B_T&&b===V_T)) cXB++;
      else if(a===V_T&&b===V_T) cXX++;
      else if(a===C_T&&b===C_T) cCC++;
      else if((a===C_T&&b===N_T)||(a===N_T&&b===C_T)) cCN++;
      else if((a===C_T&&b===B_T)||(a===B_T&&b===C_T)) cCB++;
      else if((a===V_T&&b===C_T)||(a===C_T&&b===V_T)) cXC++;
    }
  }
  const s=hydrogenShift();
  const bondE=(EPS_NN*cNN+EPS_NB*cNB+EPS_BB*cBB
        +(EPS_XN-s)*cXN+(EPS_XB-s)*cXB+epsVacVac()*cXX
        +EPS_CC*cCC+EPS_CN*cCN+EPS_CB*cCB+(EPS_XC-s)*cXC)/2;
  // Bordes abiertos: al no estar en PNB, se suman como enlaces rotos pasivados con H.
  // Además se agrega la penalización H–H para evitar poros con hidrógenos solapados.
  return bondE + calcOpenEdgePassivationEnergy(G) + calcHydrogenOverlapEnergy(G);
}

/**
 * Cuenta una sola vez los enlaces presentes en la configuración actual.
 *
 * Cuando la pasivación con H está activa, incorpora también las valencias
 * abiertas como enlaces X–H implícitos para N, B y C.
 *
 * @returns {{cNN:number,cNB:number,cBB:number,cXN:number,cXB:number,cXX:number,cCC:number,cCN:number,cCB:number,cXC:number}}
 *   Conteo de enlaces por tipo de par.
 */
function countBonds() {
  if(!ready) return{cNN:0,cNB:0,cBB:0,cXN:0,cXB:0,cXX:0,cCC:0,cCN:0,cCB:0,cXC:0};
  let cNN=0,cNB=0,cBB=0,cXN=0,cXB=0,cXX=0,cCC=0,cCN=0,cCB=0,cXC=0;
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j), a=G[k];
    for(const[bi,bj] of PNB[k]){
      const bk=idx(bi,bj);
      if(bk<=k) continue;
      const b=G[bk];
      if(a===N_T&&b===N_T) cNN++;
      else if(a===B_T&&b===B_T) cBB++;
      else if((a===N_T&&b===B_T)||(a===B_T&&b===N_T)) cNB++;
      else if((a===V_T&&b===N_T)||(a===N_T&&b===V_T)) cXN++;
      else if((a===V_T&&b===B_T)||(a===B_T&&b===V_T)) cXB++;
      else if(a===V_T&&b===V_T) cXX++;
      else if(a===C_T&&b===C_T) cCC++;
      else if((a===C_T&&b===N_T)||(a===N_T&&b===C_T)) cCN++;
      else if((a===C_T&&b===B_T)||(a===B_T&&b===C_T)) cCB++;
      else if((a===V_T&&b===C_T)||(a===C_T&&b===V_T)) cXC++;
    }
  }
  if(hPass){
    if(usingCustomConstructorGeometry() && Array.isArray(CUSTOM_OPEN_VALENCE) && CUSTOM_OPEN_VALENCE.length===Nx*Ny){
      for(let k=0;k<Nx*Ny;k++){
        const a=G[k];
        if(a===V_T) continue;
        const missing=Math.max(0, Number(CUSTOM_OPEN_VALENCE[k])||0);
        for(let n=0;n<missing;n++){
          if(a===N_T) cXN++;
          else if(a===B_T) cXB++;
          else if(a===C_T) cXC++;
        }
      }
    }else{
      for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
        const k=idx(i,j), a=G[k];
        if(a===V_T) continue;
        for(const [ri,rj] of rawNB(i,j)){
          if(mapRawNeighborIndex(ri,rj)!==null) continue;
          if(a===N_T) cXN++;
          else if(a===B_T) cXB++;
          else if(a===C_T) cXC++;
        }
      }
    }
  }
  return{cNN,cNB,cBB,cXN,cXB,cXX,cCC,cCN,cCB,cXC};
}

/**
 * Cuenta las especies químicas de un estado de red.
 *
 * @param {ArrayLike<number>} state Estado de especies; por defecto usa G.
 * @returns {{nN:number,nB:number,nC:number,nV:number,nAtoms:number,nSites:number}}
 *   Conteos de N, B, C, vacancias, átomos y sitios totales.
 */
function getSpeciesCountsForState(state = G) {
  let nN=0,nB=0,nC=0,nV=0;
  const nSites=Nx*Ny;
  for(let k=0;k<nSites;k++){
    const t=state[k];
    if(t===N_T) nN++;
    else if(t===B_T) nB++;
    else if(t===C_T) nC++;
    else nV++;
  }
  return {nN,nB,nC,nV,nAtoms:nN+nB+nC,nSites};
}

/**
 * Devuelve los conteos de especies de la configuración global G.
 *
 * @returns {{nN:number,nB:number,nC:number,nV:number,nAtoms:number,nSites:number}}
 *   Conteos de especies de la configuración actual.
 */
function getSpeciesCounts() {
  return getSpeciesCountsForState(G);
}

/**
 * Cuenta los hidrógenos de pasivación asociados a un estado.
 *
 * @param {ArrayLike<number>} state Estado de especies; por defecto usa G.
 * @returns {number} Número de H de pasivación explícitos/implícitos recopilados.
 */
function getPassivationHCount(state = G) {
  if(!ready||!hPass||typeof collectPassivationHydrogens!=='function') return 0;
  return collectPassivationHydrogens(state).length;
}

/**
 * Energía física de la configuración para la energía de formación.
 *
 * Suma los enlaces con los ε sin desplazamiento de reservorio y SIN el término
 * vacancia–vacancia (un par de sitios vacíos no contiene átomos y no aporta
 * energía en la ecuación 3.37 de la tesis), más la pasivación de bordes
 * abiertos. La penalización estérica H–H es empírica (K = 35 eV por par, no
 * procede del DFT) y solo se suma si includeHH es verdadero.
 *
 * @param {ArrayLike<number>} state Estado de especies; por defecto usa G.
 * @param {boolean} includeHH Añadir la penalización H–H.
 * @returns {number} Energía en eV.
 */
function calcPhysicalEnergy(state = G, includeHH = false) {
  if(!ready) return 0;
  const bc=bondCountsForState(state);
  // countBonds() ya incluye los H de bordes abiertos en cXN/cXB/cXC.
  return EPS_NN*bc.cNN+EPS_NB*bc.cNB+EPS_BB*bc.cBB
    +EPS_CC*bc.cCC+EPS_CN*bc.cCN+EPS_CB*bc.cCB
    +EPS_XN*bc.cXN+EPS_XB*bc.cXB+EPS_XC*bc.cXC
    +(includeHH?calcHydrogenOverlapEnergy(state):0);
}

/**
 * Conteo de enlaces únicos de un estado arbitrario (incluye los H de bordes
 * abiertos cuando la pasivación está activa).
 *
 * @param {ArrayLike<number>} state Estado de especies.
 * @returns {object} Conteos como countBonds().
 */
function bondCountsForState(state = G) {
  if(state===G) return countBonds();
  const saveG=G;
  try{ G=state; return countBonds(); }
  finally{ G=saveG; }
}

/**
 * Calcula la energía de formación con referencia a potenciales químicos.
 *
 *   E_form = E_fís − n_B μ_B − n_N μ_N − n_C μ_C − n_H μ_H
 *
 * con μ_B + μ_N = μ_BN. Con la referencia por defecto (μ_BN = 3εNB,
 * μ_C = 1.5εCC) la lámina h-BN perfecta y el grafeno perfecto tienen
 * E_form = 0 exactamente, de modo que E_form es la energía del defecto.
 * La penalización empírica H–H no se incluye en E_form; se informa aparte
 * (EHH) junto con EformWithHH = E_form + EHH.
 * [FIX v15.0] v14.x usaba la energía del Monte Carlo (con el término
 * vacancia–vacancia, la penalización H–H y el desplazamiento de reservorio)
 * y μ_BN = E(BN), lo que daba E_form ≠ 0 para la lámina perfecta.
 *
 * @param {ArrayLike<number>} state Estado de especies; por defecto usa G.
 * @returns {object|null} Desglose de la energía de formación o null.
 */
function calcFormationEnergyDFTLike(state = G) {
  if(!ready) return null;
  const counts=getSpeciesCountsForState(state);
  // n_H = enlaces X–α contados en E_fís (poros + bordes abiertos pasivados),
  // de modo que numerador y referencia usan el mismo conteo.
  const bc=bondCountsForState(state);
  const nH=bc.cXN+bc.cXB+bc.cXC;
  const Ephys=calcPhysicalEnergy(state,false);
  const EHH=calcHydrogenOverlapEnergy(state);
  const Eref=counts.nB*FORM_MU_B+counts.nN*FORM_MU_N+counts.nC*FORM_MU_C+nH*FORM_MU_H;
  const Eform=Ephys-Eref;
  const dft=Number.isFinite(FORM_DFT_TOTAL)?FORM_DFT_TOTAL:null;
  return {
    Eform,Eref,Ephys,EHH,EformWithHH:Eform+EHH,
    perAtom:counts.nAtoms?Eform/counts.nAtoms:0,
    perSite:counts.nSites?Eform/counts.nSites:0,
    perH:nH?Eform/nH:null,
    perVac:counts.nV?Eform/counts.nV:null,
    deltaDFT:dft!==null?Eform-dft:null,
    nB:counts.nB,nN:counts.nN,nC:counts.nC,nV:counts.nV,nH,
    muB:FORM_MU_B,muN:FORM_MU_N,muC:FORM_MU_C,muH:FORM_MU_H,
    muBNref:FORM_MU_BN_REF,env:FORM_CHEM_ENV
  };
}


// ============================================================================
// CAMBIO LOCAL/GLOBAL DE ENERGÍA (ΔE)
// ============================================================================
/**
 * Calcula el cambio exacto de energía para intercambiar dos primeros vecinos.
 *
 * Solo evalúa los enlaces afectados por el intercambio y añade los cambios de
 * pasivación en bordes abiertos y de penalización por solapamiento H–H.
 *
 * @param {number} i1 Fila del primer sitio.
 * @param {number} j1 Columna del primer sitio.
 * @param {number} i2 Fila del segundo sitio.
 * @param {number} j2 Columna del segundo sitio.
 * @returns {number} ΔE = E_después - E_antes, en eV.
 */
function calcDeltaE(i1, j1, i2, j2) {
  if(!ready) return 0;
  const t1=G[idx(i1,j1)],t2=G[idx(i2,j2)];
  if(t1===t2) return 0;
  let dE=0;
  for(const[ni,nj]of PNB[idx(i1,j1)]){
    if(ni===i2&&nj===j2) dE+=epsEff(t2,t1)-epsEff(t1,t2);
    else{const c=G[idx(ni,nj)];dE+=epsEff(t2,c)-epsEff(t1,c);}
  }
  for(const[ni,nj]of PNB[idx(i2,j2)]){
    if(ni===i1&&nj===j1) continue;
    const c=G[idx(ni,nj)];dE+=epsEff(t1,c)-epsEff(t2,c);
  }
  const k1=idx(i1,j1), k2=idx(i2,j2);
  dE+=calcOpenEdgeDeltaBySwap(k1,k2);
  dE+=calcHydrogenOverlapDeltaBySwap(k1,k2);
  return dE;
}

// ── ΔE para intercambio global (sitios no vecinos) ─────────────────────
// CORRECCIÓN v10: vecinos comunes entre sitio1 y sitio2 se detectan
// con un Set para evitar doble cuenta, que sobrestimaba ΔE en ~2ε.
// Un vecino en común se cuenta una sola vez en el delta total.
/**
 * Calcula ΔE para un intercambio de largo alcance entre dos sitios.
 *
 * Evita el doble conteo de vecinos compartidos y delega en calcDeltaE() cuando
 * los sitios resultan ser primeros vecinos. Incluye las mismas correcciones de
 * borde y solapamiento H que el cálculo local.
 *
 * @param {number} i1 Fila del primer sitio.
 * @param {number} j1 Columna del primer sitio.
 * @param {number} i2 Fila del segundo sitio.
 * @param {number} j2 Columna del segundo sitio.
 * @returns {number} ΔE = E_después - E_antes, en eV.
 */
function calcDeltaE_global(i1, j1, i2, j2) {
  if(!ready) return 0;
  const t1=G[idx(i1,j1)],t2=G[idx(i2,j2)];
  if(t1===t2) return 0;
  const k1=idx(i1,j1), k2=idx(i2,j2);
  // [FIX v14.7 · D7] Si los dos sitios resultan ser vecinos, esta rutina omite
  // el enlace directo entre ellos y el ΔE queda mal por hasta 19 eV (medido
  // sobre 40 de 2794 pares sorteados). Hasta ahora era código muerto porque
  // attemptSwapPair desviaba esos casos, pero era una mina para el futuro.
  if(PNB[k1]&&PNB[k1].some(([ni,nj])=>ni===i2&&nj===j2)) return calcDeltaE(i1,j1,i2,j2);

  // Construir set de vecinos de sitio 2 (como claves de índice)
  const nb2set=new Set();
  for(const[ni,nj]of PNB[k2]) nb2set.add(idx(ni,nj));

  let dE=0;
  // Vecinos de sitio 1
  for(const[ni,nj]of PNB[k1]){
    const nk=idx(ni,nj);
    // Si también es vecino de sitio 2: es vecino compartido.
    // Su contribución se calcula con ambos cambios simultáneos.
    if(nb2set.has(nk)){
      // El vecino c ve a sitio1 cambiar t1→t2 Y a sitio2 cambiar t2→t1
      // Contribución neta: [epsEff(t2,c)-epsEff(t1,c)] + [epsEff(t1,c)-epsEff(t2,c)] = 0
      // Solo se suma una vez aquí; se omite en el loop de vecinos de sitio2.
      continue;
    }
    const c=G[nk];
    dE+=epsEff(t2,c)-epsEff(t1,c);
  }
  // Vecinos de sitio 2 — excluir los compartidos con sitio 1
  const nb1set=new Set();
  for(const[ni,nj]of PNB[k1]) nb1set.add(idx(ni,nj));
  for(const[ni,nj]of PNB[k2]){
    const nk=idx(ni,nj);
    if(nb1set.has(nk)) continue; // ya procesado arriba
    const c=G[nk];
    dE+=epsEff(t1,c)-epsEff(t2,c);
  }
  // Contribución del enlace directo entre los dos sitios (si son vecinos)
  // — en modo global esto no debería ocurrir, pero se guarda por robustez.
  // Si son vecinos directos, usar calcDeltaE que lo maneja correctamente.
  dE+=calcOpenEdgeDeltaBySwap(k1,k2);
  dE+=calcHydrogenOverlapDeltaBySwap(k1,k2);
  return dE;
}


// ============================================================================
// ORQUESTACIÓN DE INTENTOS MONTE CARLO
// ============================================================================
/**
 * Ejecuta un intento Monte Carlo local entre primeros vecinos.
 *
 * En geometrías custom delega la selección en pickLocalPair(); en redes
 * regulares selecciona un sitio y uno de sus vecinos mediante rand(). La
 * aceptación/rechazo se resuelve exclusivamente en attemptSwapPair().
 *
 * @returns {object|null} Resultado del intento o null si no existe movimiento.
 */
function metro() {
  if(!ready) return null;
  if(usingCustomConstructorGeometry()){
    const pair=pickLocalPair();
    if(!pair){rejected++;return null;}
    return attemptSwapPair(pair[0],pair[1],false);
  }
  const i1=Math.floor(rand()*Ny),j1=Math.floor(rand()*Nx);
  const nb=PNB[idx(i1,j1)];
  if(!nb||nb.length===0){rejected++;return null;}
  const[i2,j2]=nb[Math.floor(rand()*nb.length)];
  const k1=idx(i1,j1), k2=idx(i2,j2);
  return attemptSwapPair(k1,k2,false);
}

// Movimiento global de largo alcance.
// Implementa intercambio entre dos sitios cualesquiera de la red.
// En geometrías importadas usa selección ponderada por especies para evitar
// miles de intentos nulos cuando solo hay una vacancia o pocos pares válidos.
/**
 * Ejecuta un intento Monte Carlo global de largo alcance.
 *
 * Selecciona un par mediante pickGlobalPair() y delega la evaluación energética
 * y el criterio de Metropolis en attemptSwapPair().
 *
 * @returns {object|null} Resultado del intento o null si no existe movimiento.
 */
function metro_global() {
  if(!ready) return null;
  const pair=pickGlobalPair();
  if(!pair){rejected++;return null;}
  return attemptSwapPair(pair[0],pair[1],true);
}

// ── Pore overlay ──────────────────────────────────────────────────────
/**
 * Calcula el casco convexo de un conjunto de puntos 2D mediante cadena monótona.
 *
 * Se conserva como utilidad geométrica para clasificación/análisis de poros.
 * La implementación no modifica el arreglo original porque ordena una copia.
 *
 * @param {Array<[number, number]>} pts Puntos cartesianos [x, y].
 * @returns {Array<[number, number]>} Vértices del casco convexo en orden perimetral.
 */
function convexHull(pts) {
  if(pts.length<3) return pts;
  pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lower=[],upper=[];
  for(const p of pts){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);}
  for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);}
  lower.pop();upper.pop();
  return lower.concat(upper);
}

// ── [REESCRITO v14.7.1] Overlay de poros: sombreado por unión de discos ──
// PROBLEMA de v14.7: el contorno se dibujaba como el casco convexo de los átomos
// de borde usando coordenadas de PANTALLA sin desplegar. Cuando un poro cruza la
// frontera periódica sus átomos de borde quedan a ambos lados de la celda, así que
// el casco abarcaba toda la imagen y aparecían líneas discontinuas cruzando el
// sistema entero. Con varios poros a la vez, el resultado era ilegible.
//
// SOLUCIÓN: no se usa casco convexo. El poro se sombrea como la UNIÓN de discos
// centrados en cada vacancia, con radio algo mayor que medio enlace para que los
// discos vecinos se fusionen. Ventajas:
//   · nunca se conectan puntos lejanos → desaparecen las líneas que cruzan;
//   · un poro que cruza la frontera se ve partido en los dos bordes de la celda,
//     que es la representación honesta bajo condiciones periódicas;
//   · el contorno sigue la forma real del poro y no su envolvente convexa, así
//     que un poro cóncavo o ramificado se ve tal cual es.
//
// El borde se obtiene con el truco estándar de dos pasadas sobre un lienzo
// auxiliar: primero se trazan TODOS los discos con línea gruesa del color de
// borde, después se RELLENAN todos encima. Los trazos interiores quedan tapados
// por los rellenos vecinos y solo sobrevive el contorno exterior de la unión.
// El lienzo auxiliar se compone al final con alfa global, de modo que los
// solapamientos entre discos no oscurecen el sombreado.
let PORE_LAYER = null;

/**
 * Obtiene el lienzo auxiliar reutilizable empleado para componer el overlay de poros.
 *
 * El canvas se crea bajo demanda y se redimensiona cuando cambia el tamaño del
 * lienzo principal, evitando crear un elemento nuevo en cada fotograma.
 *
 * @param {number} w Ancho requerido del canvas, en píxeles.
 * @param {number} h Alto requerido del canvas, en píxeles.
 * @returns {HTMLCanvasElement} Canvas auxiliar listo para dibujar.
 */
function getPoreLayerCanvas(w, h) {
  if(!PORE_LAYER) PORE_LAYER=document.createElement('canvas');
  if(PORE_LAYER.width!==w||PORE_LAYER.height!==h){PORE_LAYER.width=w;PORE_LAYER.height=h;}
  return PORE_LAYER;
}

/**
 * Dibuja la capa visual de poros sobre el canvas principal.
 *
 * Los poros se detectan como clústeres de vacancias usando PNB. Para evitar
 * artefactos en fronteras periódicas, el sombreado se construye como unión de
 * discos centrados en las vacancias, en lugar de usar un casco convexo global.
 *
 * @param {'off'|'edge'|'hull'} ovl Modo de overlay solicitado.
 * @param {number} r Radio visual base de los átomos, en píxeles del canvas.
 * @param {Uint8Array|null} volatileMask Máscara opcional de especies volátiles.
 * @returns {void}
 */
function drawPoreOverlay(ovl, r, volatileMask = null) {
  if(!ready||ovl==='off') return;
  const MAX_B=SCALE*D*1.35;
  const vt=(k)=>volatileMask&&volatileMask[k]?V_T:G[k];

  // Clusters de vacancias sobre la topología FÍSICA (incluye los saltos
  // periódicos: el poro se detecta completo aunque se dibuje partido).
  const visited=new Uint8Array(Nx*Ny);
  const clusters=[];
  for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
    const k=idx(i,j);
    if(vt(k)!==V_T||visited[k]) continue;
    const cluster=[],queue=[k];visited[k]=1;
    while(queue.length){
      const cur=queue.shift();cluster.push(cur);
      const ci=Math.floor(cur/Nx),cj=cur%Nx;
      for(const[ni,nj]of PNB[idx(ci,cj)]){
        const nk=idx(ni,nj);
        if(vt(nk)===V_T&&!visited[nk]){visited[nk]=1;queue.push(nk);}
      }
    }
    if(cluster.length>0) clusters.push(cluster);
  }

  // Anillos naranjas sobre los átomos que bordean el poro. El filtro por MAX_B
  // ya excluía los vecinos que cruzan la frontera, así que se mantiene igual.
  if(ovl==='edge'){
    for(let i=0;i<Ny;i++) for(let j=0;j<Nx;j++){
      const k=idx(i,j);
      if(vt(k)===V_T) continue;
      let isEdge=false;
      for(const[ni,nj]of PNB[k]){
        if(vt(idx(ni,nj))===V_T&&Math.hypot(GX[k]-GX[idx(ni,nj)],GY[k]-GY[idx(ni,nj)])<MAX_B){
          isEdge=true;break;
        }
      }
      if(isEdge){
        ctx.beginPath();ctx.arc(GX[k],GY[k],r*1.5,0,Math.PI*2);
        ctx.strokeStyle='rgba(234,88,12,0.75)';
        ctx.lineWidth=Math.max(1.0,r*0.25);ctx.stroke();
      }
    }
  }

  if(ovl!=='hull'&&ovl!=='edge') return;
  if(!clusters.length) return;

  const W=cv.width,H=cv.height;
  if(W<10||H<10) return;
  const oc=getPoreLayerCanvas(W,H);
  const octx=oc.getContext('2d');
  octx.setTransform(1,0,0,1,0,0);
  octx.clearRect(0,0,W,H);
  octx.save();
  apply2DViewport(octx,W,H);   // mismo encuadre que el lienzo principal

  // Radio del disco: algo más de medio enlace para que las vacancias vecinas
  // se fusionen en una mancha continua sin inflar el poro.
  const rb=Math.max(2,SCALE*D*0.60);
  const bw=Math.max(1.4,SCALE*D*0.13);

  for(const cluster of clusters){
    // Atajo de rendimiento: clasificar cuesta un BFS de despliegue más un casco
    // convexo, y se hace en cada fotograma. Los clústeres de 1-2 vacancias no
    // tienen forma que clasificar, así que van directos a la paleta 'irregular'.
    const poreClass=cluster.length>=3?(classifyPoreCluster(cluster)||{key:'irregular'}):{key:'irregular'};
    const palette=getPoreVisualPalette(poreClass.key);
    const trazar=()=>{
      octx.beginPath();
      for(const ck of cluster){
        octx.moveTo(GX[ck]+rb,GY[ck]);
        octx.arc(GX[ck],GY[ck],rb,0,Math.PI*2);
      }
    };
    // 1) contorno grueso
    trazar();
    octx.strokeStyle=palette.stroke;
    octx.lineWidth=bw*2;
    octx.lineJoin='round';octx.lineCap='round';
    octx.stroke();
    // 2) relleno opaco encima: tapa los trazos interiores y deja solo el borde.
    // El relleno se aclara hacia el blanco para que, al componer la capa entera
    // con un alfa alto, el sombreado quede suave y el borde siga siendo nítido.
    trazar();
    octx.fillStyle=lightenRGBA(palette.fill,0.62);
    octx.fill();
  }
  octx.restore();

  // Composición: la capa es opaca, así que los solapamientos entre discos no
  // oscurecen el sombreado por muchos discos que se superpongan.
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=0.72;
  ctx.drawImage(oc,0,0);
  ctx.restore();
}

/**
 * Mezcla un color RGB/RGBA hacia blanco y devuelve un color RGB opaco.
 *
 * @param {string} rgba Color de entrada en formato rgb(...) o rgba(...).
 * @param {number} t Fracción de mezcla hacia blanco (0 conserva; 1 produce blanco).
 * @returns {string} Color resultante en formato rgb(...), o la entrada si no puede interpretarse.
 */
function lightenRGBA(rgba, t) {
  const m=/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(rgba);
  if(!m) return rgba;
  const mix=(c)=>Math.round(+c+(255-+c)*t);
  return `rgb(${mix(m[1])},${mix(m[2])},${mix(m[3])})`;
}
