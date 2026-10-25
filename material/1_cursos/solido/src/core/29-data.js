/* ===================================================================
   29-data.js — Datos experimentales de referencia (EM.data)
   Fuentes: C. Kittel, Introduction to Solid State Physics, 8.ª ed. (2005);
   N. W. Ashcroft y N. D. Mermin, Solid State Physics (1976); S. M. Sze,
   Physics of Semiconductor Devices, 3.ª ed. (2007); M. A. Green,
   J. Appl. Phys. 67, 2944 (1990); M. L. Cohen y T. K. Bergstresser,
   Phys. Rev. 141, 789 (1966); W. D. Callister, Materials Science and
   Engineering (2018). Cada tabla indica su origen.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const D = (EM.data = {});

  /* Cristales: estructura, constantes de red (Å, temperatura ambiente salvo gases nobles a 4 K),
     masas molares (g/mol por fórmula) — Kittel cap. 1 y Ashcroft–Mermin tablas 4.3–4.7 */
  D.crystals = {
    Cu: { s: 'fcc', a: 3.615, M: 63.546, Z: 29 }, Ag: { s: 'fcc', a: 4.086, M: 107.868, Z: 47 }, Au: { s: 'fcc', a: 4.078, M: 196.967, Z: 79 },
    Al: { s: 'fcc', a: 4.049, M: 26.982, Z: 13 }, Ni: { s: 'fcc', a: 3.524, M: 58.693, Z: 28 }, Pb: { s: 'fcc', a: 4.950, M: 207.2, Z: 82 },
    Pt: { s: 'fcc', a: 3.924, M: 195.084, Z: 78 }, Ca: { s: 'fcc', a: 5.588, M: 40.078, Z: 20 },
    Ne: { s: 'fcc', a: 4.46, M: 20.180, Z: 10 }, Ar: { s: 'fcc', a: 5.31, M: 39.948, Z: 18 }, Kr: { s: 'fcc', a: 5.64, M: 83.798, Z: 36 }, Xe: { s: 'fcc', a: 6.13, M: 131.293, Z: 54 },
    Fe: { s: 'bcc', a: 2.867, M: 55.845, Z: 26 }, Na: { s: 'bcc', a: 4.225, M: 22.990, Z: 11 }, K: { s: 'bcc', a: 5.225, M: 39.098, Z: 19 },
    Li: { s: 'bcc', a: 3.491, M: 6.941, Z: 3 }, Cr: { s: 'bcc', a: 2.884, M: 51.996, Z: 24 }, W: { s: 'bcc', a: 3.165, M: 183.84, Z: 74 },
    Mo: { s: 'bcc', a: 3.147, M: 95.95, Z: 42 }, Nb: { s: 'bcc', a: 3.300, M: 92.906, Z: 41 }, Cs: { s: 'bcc', a: 6.045, M: 132.905, Z: 55 },
    Mg: { s: 'hcp', a: 3.209, c: 5.211, M: 24.305, Z: 12 }, Zn: { s: 'hcp', a: 2.665, c: 4.947, M: 65.38, Z: 30 },
    Ti: { s: 'hcp', a: 2.951, c: 4.686, M: 47.867, Z: 22 }, Co: { s: 'hcp', a: 2.507, c: 4.069, M: 58.933, Z: 27 }, Be: { s: 'hcp', a: 2.286, c: 3.584, M: 9.012, Z: 4 },
    C: { s: 'diamond', a: 3.567, M: 12.011, Z: 6 }, Si: { s: 'diamond', a: 5.431, M: 28.086, Z: 14 }, Ge: { s: 'diamond', a: 5.658, M: 72.630, Z: 32 }, 'α-Sn': { s: 'diamond', a: 6.489, M: 118.71, Z: 50 },
    GaAs: { s: 'zincblende', a: 5.653, M: 144.645, A: 'Ga', B: 'As' }, InSb: { s: 'zincblende', a: 6.479, M: 236.578, A: 'In', B: 'Sb' },
    ZnS: { s: 'zincblende', a: 5.409, M: 97.47, A: 'Zn', B: 'S' }, GaP: { s: 'zincblende', a: 5.451, M: 100.697, A: 'Ga', B: 'P' },
    InP: { s: 'zincblende', a: 5.869, M: 145.792, A: 'In', B: 'P' }, SiC: { s: 'zincblende', a: 4.360, M: 40.096, A: 'Si', B: 'C' },
    NaCl: { s: 'NaCl', a: 5.640, M: 58.443, A: 'Na', B: 'Cl' }, KCl: { s: 'NaCl', a: 6.293, M: 74.551, A: 'K', B: 'Cl' },
    LiF: { s: 'NaCl', a: 4.027, M: 25.939, A: 'Li', B: 'F' }, MgO: { s: 'NaCl', a: 4.212, M: 40.304, A: 'Mg', B: 'O' },
    KBr: { s: 'NaCl', a: 6.600, M: 119.002, A: 'K', B: 'Br' }, PbS: { s: 'NaCl', a: 5.936, M: 239.27, A: 'Pb', B: 'S' },
    CsCl: { s: 'CsCl', a: 4.123, M: 168.358, A: 'Cs', B: 'Cl' }, CsBr: { s: 'CsCl', a: 4.286, M: 212.809, A: 'Cs', B: 'Br' }, CsI: { s: 'CsCl', a: 4.567, M: 259.810, A: 'Cs', B: 'I' },
    CaF2: { s: 'fluorite', a: 5.463, M: 78.075, A: 'Ca', B: 'F' },
    SrTiO3: { s: 'perovskite', a: 3.905, M: 183.49, A: 'Sr', B: 'Ti', X: 'O' },
    ZnO: { s: 'wurtzite', a: 3.250, c: 5.207, M: 81.38, A: 'Zn', B: 'O' }, GaN: { s: 'wurtzite', a: 3.189, c: 5.185, M: 83.73, A: 'Ga', B: 'N' }
  };

  /* Energías de cohesión (eV/átomo) — Kittel tabla 3.1 */
  D.cohesive = { Li: 1.63, Na: 1.113, K: 0.934, Rb: 0.852, Cs: 0.804, Be: 3.32, Mg: 1.51, Ca: 1.84, Al: 3.39, C: 7.37, Si: 4.63, Ge: 3.85, Ti: 4.85, Cr: 4.10, Fe: 4.28, Co: 4.39, Ni: 4.44, Cu: 3.49, Zn: 1.35, Mo: 6.82, Ag: 2.95, W: 8.90, Pt: 5.84, Au: 3.81, Pb: 2.03, Nb: 7.57, Ne: 0.020, Ar: 0.080, Kr: 0.116, Xe: 0.16 };

  /* Gases nobles: parámetros de Lennard-Jones (Bernardes 1958, en Kittel tabla 3.4),
     distancia a primeros vecinos y energía de cohesión experimentales (Kittel tabla 3.3) */
  D.rareGas = {
    Ne: { eps: 0.0031, sigma: 2.74, r0: 3.13, U: 0.020 },
    Ar: { eps: 0.0104, sigma: 3.40, r0: 3.76, U: 0.080 },
    Kr: { eps: 0.0140, sigma: 3.65, r0: 4.01, U: 0.116 },
    Xe: { eps: 0.0200, sigma: 3.98, r0: 4.35, U: 0.170 }
  };

  /* Cristales iónicos tipo NaCl: R0 (Å), ρ (Å) y energía de red experimental (kcal/mol) — Kittel tabla 3.6 */
  D.alkaliHalide = {
    LiF: { R0: 2.014, rho: 0.291, U: 242.3 }, LiCl: { R0: 2.570, rho: 0.330, U: 198.9 },
    NaCl: { R0: 2.820, rho: 0.321, U: 182.6 }, NaBr: { R0: 2.989, rho: 0.328, U: 173.3 },
    KCl: { R0: 3.147, rho: 0.326, U: 165.8 }, KBr: { R0: 3.298, rho: 0.336, U: 158.5 },
    RbCl: { R0: 3.291, rho: 0.323, U: 159.3 }
  };

  /* Temperaturas de Debye (K, de calor específico a baja temperatura) — Kittel tabla 5.1 */
  D.debye = { Li: 344, Na: 158, K: 91, Rb: 56, Cs: 38, Be: 1440, Mg: 400, Ca: 230, Al: 428, Cu: 343, Ag: 225, Au: 165, Zn: 327, Cd: 209, Hg: 71.9, Pb: 105, Sn: 200, Fe: 470, Ni: 450, Co: 445, Pt: 240, W: 400, Mo: 450, Ti: 420, Cr: 630, Nb: 275, Ta: 240, C: 2230, Si: 645, Ge: 374, Ne: 75, Ar: 92, Kr: 72, Xe: 64, Ga: 320, In: 108, Bi: 119 };

  /* Conductividad térmica a 300 K (W m⁻¹ K⁻¹) — Kittel tabla 5.2 y CRC */
  D.kappa = { Cu: 401, Ag: 429, Au: 317, Al: 237, Fe: 80.2, Pb: 35.3, Si: 148, Ge: 60, C: 2000, NaCl: 6.5, 'SiO₂ (cuarzo)': 10.4, 'vidrio': 1.0 };

  /* Velocidades del sonido promediadas en policristales (m/s): longitudinal y transversal */
  D.sound = { Cu: [4760, 2325], Al: [6420, 3040], Ag: [3650, 1610], Au: [3240, 1200], Fe: [5960, 3240], Pb: [2160, 700] };

  /* Electrones libres (Ashcroft–Mermin tablas 1.1 y 2.1): valencia, n (10²² cm⁻³), rₛ/a₀,
     E_F (eV), T_F (10⁴ K), k_F (10⁸ cm⁻¹), v_F (10⁸ cm/s) */
  D.freeElectron = {
    Li: [1, 4.70, 3.25, 4.74, 5.51, 1.12, 1.29], Na: [1, 2.65, 3.93, 3.24, 3.77, 0.92, 1.07], K: [1, 1.40, 4.86, 2.12, 2.46, 0.75, 0.86],
    Rb: [1, 1.15, 5.20, 1.85, 2.15, 0.70, 0.81], Cs: [1, 0.91, 5.62, 1.59, 1.84, 0.65, 0.75], Cu: [1, 8.47, 2.67, 7.00, 8.16, 1.36, 1.57],
    Ag: [1, 5.86, 3.02, 5.49, 6.38, 1.20, 1.39], Au: [1, 5.90, 3.01, 5.53, 6.42, 1.21, 1.40], Be: [2, 24.7, 1.87, 14.3, 16.6, 1.94, 2.25],
    Mg: [2, 8.61, 2.66, 7.08, 8.23, 1.36, 1.58], Ca: [2, 4.61, 3.27, 4.69, 5.44, 1.11, 1.28], Zn: [2, 13.2, 2.30, 9.47, 11.0, 1.58, 1.83],
    Al: [3, 18.1, 2.07, 11.7, 13.6, 1.75, 2.03], Ga: [3, 15.4, 2.19, 10.4, 12.1, 1.66, 1.92], In: [3, 11.5, 2.41, 8.63, 10.0, 1.51, 1.74],
    Pb: [4, 13.2, 2.30, 9.47, 11.0, 1.58, 1.83], Sn: [4, 14.8, 2.22, 10.2, 11.8, 1.64, 1.90], Fe: [2, 17.0, 2.12, 11.1, 13.0, 1.71, 1.98]
  };
  /* Resistividad a 273 K (µΩ·cm) — Ashcroft–Mermin tabla 1.2 */
  D.resistivity = { Li: 8.55, Na: 4.2, K: 6.1, Rb: 11.0, Cs: 18.8, Cu: 1.56, Ag: 1.51, Au: 2.04, Be: 2.8, Mg: 3.9, Ca: 3.43, Zn: 5.5, Al: 2.45, Ga: 13.6, In: 8.0, Pb: 19.0, Fe: 8.9, Sn: 10.6 };
  /* Tiempos de relajación de Drude a 273 K (10⁻¹⁴ s) — Ashcroft–Mermin tabla 1.3 */
  D.tauDrude = { Li: 0.88, Na: 3.2, K: 4.1, Cu: 2.7, Ag: 4.0, Au: 3.0, Al: 0.80, Pb: 0.14 };
  /* −1/(R_H n e) en campos altos — Ashcroft–Mermin tabla 1.4 */
  D.hall = { Li: 0.8, Na: 1.2, K: 1.1, Rb: 1.0, Cs: 0.9, Cu: 1.5, Ag: 1.3, Au: 1.5, Be: -0.2, Mg: -0.4, In: -0.3, Al: -0.3 };
  /* Coeficiente electrónico del calor específico γ (mJ mol⁻¹ K⁻²): medido y del electrón libre — Kittel tabla 6.3 */
  D.gamma = { Li: [1.63, 0.749], Na: [1.38, 1.094], K: [2.08, 1.668], Rb: [2.41, 1.911], Cs: [3.20, 2.238], Cu: [0.695, 0.505], Ag: [0.646, 0.645], Au: [0.729, 0.642], Al: [1.35, 0.912], Pb: [2.98, 1.509], Mg: [1.3, 0.992], Zn: [0.64, 0.753] };
  /* Funciones de trabajo (eV) */
  D.work = { Cs: 2.14, K: 2.30, Na: 2.75, Li: 2.9, Al: 4.28, Cu: 4.65, Ag: 4.26, Au: 5.1, W: 4.55, Ni: 5.15, Pt: 5.65, Fe: 4.5 };
  /* Plasmones de volumen (eV): medidos por pérdida de energía de electrones y del electrón libre — Kittel tabla 14.2 */
  D.plasmon = { Li: [7.12, 8.02], Na: [5.71, 5.95], K: [3.72, null], Mg: [10.6, 10.9], Al: [15.3, 15.8], Si: [16.7, null], Ge: [16.0, 15.6] };

  /* Semiconductores a 300 K (Sze 2007; Si: Green 1990). Eg (eV), Varshni (Eg0 eV, α eV/K, β K),
     Nc y Nv (cm⁻³), ε_r, movilidades (cm²/V s), masas efectivas */
  D.semi = {
    Si: { Eg: 1.1242, ind: true, v: [1.1700, 4.730e-4, 636], Nc: 2.86e19, Nv: 3.10e19, eps: 11.7, mun: 1417, mup: 471, me: 1.09, mh: 1.15, ml: 0.9163, mt: 0.1905, mcond: 0.26, chi: 4.05, a: 5.431, ni: 1.0e10 },
    Ge: { Eg: 0.661, ind: true, v: [0.7437, 4.774e-4, 235], Nc: 1.04e19, Nv: 6.0e18, eps: 16.2, mun: 3900, mup: 1900, me: 0.55, mh: 0.37, ml: 1.59, mt: 0.0815, mcond: 0.12, chi: 4.0, a: 5.658, ni: 2.0e13 },
    GaAs: { Eg: 1.424, ind: false, v: [1.519, 5.405e-4, 204], Nc: 4.7e17, Nv: 9.0e18, eps: 12.9, mun: 8500, mup: 400, me: 0.067, mh: 0.53, chi: 4.07, a: 5.653, ni: 2.1e6 },
    InP: { Eg: 1.344, ind: false, v: [1.4236, 3.63e-4, 162], Nc: 5.7e17, Nv: 1.1e19, eps: 12.5, mun: 5400, mup: 200, me: 0.08, mh: 0.6, chi: 4.38, a: 5.869 },
    GaN: { Eg: 3.39, ind: false, v: [3.47, 7.7e-4, 600], Nc: 2.3e18, Nv: 4.6e19, eps: 8.9, mun: 1000, mup: 30, me: 0.20, mh: 1.0, chi: 4.1 },
    InSb: { Eg: 0.17, ind: false, v: [0.235, 3.2e-4, 170], Nc: 4.2e16, Nv: 7.3e18, eps: 16.8, mun: 77000, mup: 850, me: 0.014, mh: 0.43, chi: 4.59 },
    InAs: { Eg: 0.354, ind: false, v: [0.415, 2.76e-4, 83], Nc: 8.7e16, Nv: 6.6e18, eps: 15.15, mun: 40000, mup: 500, me: 0.023, mh: 0.41, chi: 4.9 },
    SiC: { Eg: 3.26, ind: true, v: [3.33, 3.3e-4, 0], Nc: 1.7e19, Nv: 2.5e19, eps: 9.7, mun: 900, mup: 120, me: 0.37, mh: 1.0, chi: 3.7 }
  };
  /* Brechas de energía a 300 K (eV) y tipo, para el catálogo de colores y de LED */
  D.gaps = { 'Diamante': [5.47, 'i'], 'GaN': [3.39, 'd'], 'ZnO': [3.37, 'd'], 'SiC (4H)': [3.26, 'i'], 'ZnSe': [2.70, 'd'], 'CdS': [2.42, 'd'], 'GaP': [2.26, 'i'], 'AlAs': [2.16, 'i'], 'CdSe': [1.74, 'd'], 'CdTe': [1.50, 'd'], 'GaAs': [1.424, 'd'], 'InP': [1.344, 'd'], 'Si': [1.124, 'i'], 'Ge': [0.661, 'i'], 'PbS': [0.41, 'd'], 'InAs': [0.354, 'd'], 'InSb': [0.17, 'd'] };
  /* Energías de ionización de impurezas (meV) — Sze tabla y Kittel tabla 8.3 */
  D.dopants = {
    Si: { donors: { P: 45, As: 54, Sb: 43 }, acceptors: { B: 45, Al: 57, Ga: 65, In: 157 } },
    Ge: { donors: { P: 12.0, As: 12.7, Sb: 9.6 }, acceptors: { B: 10.4, Al: 10.2, Ga: 10.8, In: 11.2 } }
  };
  /* Movilidad en Si (Arora, Hauser y Roulston 1982, a 300 K): µmin, µmax, N_ref, α */
  D.arora = { n: [88, 1252, 1.26e17, 0.88], p: [54.3, 407, 2.35e17, 0.88] };
  /* Movilidad en Si a 300 K, forma de Caughey y Thomas con los parámetros de Masetti, Severi y Solmi (1983):
     µmin, µmax, N_ref, α */
  D.caughey = { n: [52.2, 1417, 9.68e16, 0.68], p: [44.9, 470.5, 2.23e17, 0.719] };
  /* Resistividad del Si a 300 K (Ω·cm) según ASTM F723 (curvas de Irvin): [tipo, N (cm⁻³), ρ] */
  D.irvin = [['n', 1e15, 4.4], ['n', 1e17, 0.087], ['p', 1e16, 1.4], ['p', 1e18, 0.042]];

  /* Pseudopotenciales empíricos (Ry) de Cohen y Bergstresser 1966: a (Å), V_S(|G|² = 3, 8, 11), V_A(|G|² = 3, 4, 11) */
  D.epm = {
    Si: { a: 5.43, S: [-0.21, 0.04, 0.08], A: [0, 0, 0] },
    Ge: { a: 5.66, S: [-0.23, 0.01, 0.06], A: [0, 0, 0] },
    'α-Sn': { a: 6.49, S: [-0.20, 0.00, 0.04], A: [0, 0, 0] },
    GaP: { a: 5.44, S: [-0.22, 0.03, 0.07], A: [0.12, 0.07, 0.02] },
    GaAs: { a: 5.64, S: [-0.23, 0.01, 0.06], A: [0.07, 0.05, 0.01] },
    InSb: { a: 6.48, S: [-0.20, 0.00, 0.04], A: [0.06, 0.05, 0.01] },
    ZnSe: { a: 5.65, S: [-0.23, 0.01, 0.06], A: [0.18, 0.12, 0.03] }
  };

  /* Excitones de Wannier: energía de enlace medida (meV) */
  D.exciton = { GaAs: 4.2, InP: 5.1, CdSe: 15, GaN: 25, CdS: 28, ZnSe: 20, ZnO: 60, Cu2O: 92, Si: 14.7, Ge: 4.15 };
  /* Fonones ópticos en el centro de zona (cm⁻¹) y constantes dieléctricas: ω_TO, ω_LO, ε(0), ε(∞) */
  D.lst = { NaCl: [164, 264, 5.90, 2.25], KBr: [113, 165, 4.88, 2.33], LiF: [306, 659, 8.9, 1.96], GaAs: [268.6, 292.0, 12.9, 10.9], GaP: [367, 403, 11.1, 9.11], MgO: [401, 725, 9.8, 2.95] };
  /* Ferroeléctricos: temperatura de transición (K) y polarización espontánea (µC/cm²) */
  D.ferroelectric = { BaTiO3: [393, 26], PbTiO3: [763, 75], KNbO3: [708, 30], LiNbO3: [1480, 71], KDP: [123, 4.75] };

  /* Ferromagnetos: Ms(0 K) (G = emu/cm³), magnetones por fórmula n_B (0 K), T_C (K) — Kittel tabla 11.? */
  D.ferro = { Fe: [1752, 2.22, 1043], Co: [1446, 1.72, 1388], Ni: [510, 0.606, 627], Gd: [2060, 7.63, 292], Dy: [2920, 10.2, 88], CrO2: [515, 2.03, 386], MnBi: [675, 3.52, 630], EuO: [1910, 6.8, 69], Fe3O4: [510, 4.1, 858] };
  /* Antiferromagnetos: T_N (K), θ_CW (K) */
  D.antiferro = { MnO: [116, 610], FeO: [198, 570], CoO: [291, 330], NiO: [525, 2000], MnF2: [67, 82], FeF2: [79, 117], Cr: [308, null] };
  /* Momentos efectivos p medidos de iones de tierras raras trivalentes y del grupo del hierro — Kittel tablas 11.2 y 11.3 */
  D.pRare = { Ce: [1, 2.4], Pr: [2, 3.5], Nd: [3, 3.5], Sm: [5, 1.5], Eu: [6, 3.4], Gd: [7, 8.0], Tb: [8, 9.5], Dy: [9, 10.6], Ho: [10, 10.4], Er: [11, 9.5], Tm: [12, 7.3], Yb: [13, 4.5] };
  D.pIron = { 'Ti³⁺': [1, 1.8], 'V³⁺': [2, 2.8], 'Cr³⁺': [3, 3.8], 'Mn³⁺': [4, 4.9], 'Fe³⁺': [5, 5.9], 'Fe²⁺': [6, 5.4], 'Co²⁺': [7, 4.8], 'Ni²⁺': [8, 3.2], 'Cu²⁺': [9, 1.9] };

  /* Superconductores: T_c (K) y campo crítico termodinámico B_c(0) (mT) — Kittel tabla 10.1 */
  D.super = { Al: [1.175, 10.5], Sn: [3.722, 30.5], Pb: [7.193, 80.3], Hg: [4.153, 41.2], In: [3.408, 28.2], Nb: [9.25, 206], Ta: [4.47, 82.9], V: [5.40, 140.8], Zn: [0.85, 5.4], Ti: [0.40, 5.6], Cd: [0.517, 2.8], Ga: [1.083, 5.8] };
  /* 2Δ(0)/k_B T_c — Kittel tabla 10.3 */
  D.gapRatio = { Sn: 3.5, Al: 3.4, Pb: 4.3, Hg: 4.6, In: 3.6, Nb: 3.8, Ta: 3.6 };
  /* Longitud de coherencia ξ₀ y penetración de London λ_L (nm) — Kittel tabla 10.5 */
  D.lengths = { Sn: [230, 34], Al: [1600, 16], Pb: [83, 37], Cd: [760, 110], Nb: [38, 39] };
  D.superHigh = { 'Nb–Ti': 9.5, 'Nb₃Sn': 18.1, 'MgB₂': 39, 'La₂₋ₓSrₓCuO₄': 38, 'YBa₂Cu₃O₇': 92, 'Bi-2223': 110, 'Tl-2223': 125, 'HgBa₂Ca₂Cu₃O₈': 133, 'H₃S (155 GPa)': 203, 'LaH₁₀ (170 GPa)': 250 };

  /* Difusión (Callister tabla 5.2): D₀ (m²/s), Q (kJ/mol) */
  D.diffusion = { 'Fe en Fe-α': [2.8e-4, 251], 'Fe en Fe-γ': [5.0e-5, 284], 'C en Fe-α': [6.2e-7, 80], 'C en Fe-γ': [2.3e-5, 148], 'Cu en Cu': [7.8e-5, 211], 'Zn en Cu': [2.4e-5, 189], 'Al en Al': [2.3e-4, 144], 'Cu en Al': [6.5e-5, 136] };
  /* Energía de formación de vacancias (eV) */
  D.vacancy = { Cu: 1.28, Ag: 1.11, Au: 0.93, Al: 0.67, Ni: 1.79, Pt: 1.35, Pb: 0.58, Mo: 3.0, W: 3.6 };
  /* Centros F: energía de absorción (eV) — Kittel tabla 18.1 */
  D.fCenter = { LiCl: 3.1, NaCl: 2.7, KCl: 2.2, RbCl: 2.0, LiBr: 2.7, NaBr: 2.3, KBr: 2.0, RbBr: 1.8, LiF: 5.0, NaF: 3.6, KF: 2.7 };

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})();
