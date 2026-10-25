/*
 * hBN/Carbon coherent structure builder
 * Robust add-on for h-BN/h-BNC v10.x projects.
 * Generates B/N/C atoms on a honeycomb lattice, validates nearest-neighbour
 * topology and can load the result into the main Monte Carlo simulator.
 */
/**
 * [REGISTRO-DOC-SG-MODULE]
 * Módulo: Constructor coherente de heteroestructuras hBN/Carbono.
 * Responsabilidad: generar redes honeycomb B/N/C, validar topología, exportar la estructura y transferirla al simulador Monte Carlo.
 * La documentación marcada REGISTRO-DOC fue añadida sin modificar el código ejecutable original.
 */
(function (global) {
  'use strict';

  const DEFAULTS = Object.freeze({
    targetAtoms: 960,
    widthCells: 14,
    heightCells: 16,
    bondLength: 1.44,
    orientation: 'horizontal',       // horizontal = stacked from top to bottom; vertical = from left to right
    pattern: ['hBN', 'C', 'hBN'],
    bandCells: [4, 8, 4],
    repeatPattern: false,
    exact: false,
    invertBN: false,
    mirrorBN: false,
    center: true,
    vacuum: 15.0,
    z: 0.0,
    edgeMode: 'rectangular',         // rectangular keeps straight visual edges; primitive keeps oblique primitive cut
    patternDirection: 'top-down',    // top-down, bottom-up, left-right, right-left
    periodicMode: 'none',            // none, x, y, xy
    passivateEdges: false,
    startEdgePhase: 'A',             // A = default termination; B = shifted by half a cell (opposite sublattice exposed at the start edge)
    terminalBN: 'auto',              // auto | B | N. Forces visible terminal hBN atom(s) to match a reference without deleting atoms.
    xPeriodicExactMode: false,       // For PBC only in X: preserve full atom count and tune only the visible open-edge termination.
    validationTolerance: 0.12,
    simulatorOrient: 'AC'          // AC, ZZ, AUTO (mapping to simulator lattice)
  });

  const PRESETS = Object.freeze({
    'manual': {
      label: 'Manual / personalizado'
    },
    'reference-1x12-hbn-c-hbn': {
      label: 'Referencia exacta 1×12 hBN–C–hBN',
      widthCells: 1,
      heightCells: 12,
      orientation: 'horizontal',
      pattern: ['hBN', 'C', 'hBN'],
      bandCells: [4, 4, 4],
      repeatPattern: false,
      periodicMode: 'none',
      edgeMode: 'rectangular',
      patternDirection: 'top-down',
      passivateEdges: true,
      simulatorOrient: 'ZZ',
      startEdgePhase: 'A',
      mirrorBN: true,
      terminalBN: 'B'
    },
    'reference-1x12-hbn-c-hbn-pbcx': {
      label: 'Referencia exacta 1×12 hBN–C–hBN · periódica en X',
      widthCells: 1,
      heightCells: 12,
      orientation: 'horizontal',
      pattern: ['hBN', 'C', 'hBN'],
      bandCells: [4, 4, 4],
      repeatPattern: false,
      periodicMode: 'x',
      edgeMode: 'rectangular',
      patternDirection: 'top-down',
      passivateEdges: true,
      simulatorOrient: 'ZZ',
      startEdgePhase: 'B',
      mirrorBN: true,
      terminalBN: 'B',
      xPeriodicExactMode: true
    },
    'chain-hbn-c-hbn': {
      label: 'Cadena vertical hBN–C–hBN',
      widthCells: 1,
      heightCells: 18,
      orientation: 'horizontal',
      pattern: ['hBN', 'C', 'hBN'],
      bandCells: [5, 8, 5],
      repeatPattern: false,
      periodicMode: 'none',
      edgeMode: 'rectangular',
      patternDirection: 'top-down',
      passivateEdges: true
    },
    'chain-c-hbn-c': {
      label: 'Cadena vertical C–hBN–C',
      widthCells: 1,
      heightCells: 18,
      orientation: 'horizontal',
      pattern: ['C', 'hBN', 'C'],
      bandCells: [4, 10, 4],
      repeatPattern: false,
      periodicMode: 'none',
      edgeMode: 'rectangular',
      patternDirection: 'top-down',
      passivateEdges: true
    },
    'sandwich-y': {
      label: 'hBN arriba / C centro / hBN abajo',
      widthCells: 12,
      heightCells: 16,
      orientation: 'horizontal',
      pattern: ['hBN', 'C', 'hBN'],
      bandCells: [4, 8, 4],
      repeatPattern: false,
      periodicMode: 'x',
      edgeMode: 'rectangular',
      patternDirection: 'top-down',
      passivateEdges: false
    },
    'sandwich-x': {
      label: 'hBN izquierda / C centro / hBN derecha',
      widthCells: 18,
      heightCells: 12,
      orientation: 'vertical',
      pattern: ['hBN', 'C', 'hBN'],
      bandCells: [4, 10, 4],
      repeatPattern: false,
      periodicMode: 'y',
      edgeMode: 'rectangular',
      patternDirection: 'left-right',
      passivateEdges: false
    },
    'carbon-hbn-carbon-y': {
      label: 'C arriba / hBN centro / C abajo',
      widthCells: 12,
      heightCells: 16,
      orientation: 'horizontal',
      pattern: ['C', 'hBN', 'C'],
      bandCells: [4, 8, 4],
      repeatPattern: false,
      periodicMode: 'x',
      edgeMode: 'rectangular',
      patternDirection: 'top-down',
      passivateEdges: false
    },
    'carbon-hbn-carbon-x': {
      label: 'C izquierda / hBN centro / C derecha',
      widthCells: 18,
      heightCells: 12,
      orientation: 'vertical',
      pattern: ['C', 'hBN', 'C'],
      bandCells: [4, 10, 4],
      repeatPattern: false,
      periodicMode: 'y',
      edgeMode: 'rectangular',
      patternDirection: 'left-right',
      passivateEdges: false
    },
    'alternating-y': {
      label: 'Bandas alternadas horizontales hBN/C',
      widthCells: 18,
      heightCells: 20,
      orientation: 'horizontal',
      pattern: ['hBN', 'C'],
      bandCells: [3, 3],
      repeatPattern: true,
      periodicMode: 'xy',
      edgeMode: 'rectangular',
      patternDirection: 'top-down',
      passivateEdges: false
    },
    'alternating-x': {
      label: 'Bandas alternadas verticales hBN/C',
      widthCells: 20,
      heightCells: 14,
      orientation: 'vertical',
      pattern: ['hBN', 'C'],
      bandCells: [3, 3],
      repeatPattern: true,
      periodicMode: 'xy',
      edgeMode: 'rectangular',
      patternDirection: 'left-right',
      passivateEdges: false
    },
    'graphene': {
      label: 'Grafeno puro',
      widthCells: 16,
      heightCells: 14,
      orientation: 'horizontal',
      pattern: ['C'],
      bandCells: [14],
      repeatPattern: false,
      periodicMode: 'xy',
      edgeMode: 'rectangular',
      patternDirection: 'top-down',
      passivateEdges: false
    },
    'hbn': {
      label: 'hBN puro',
      widthCells: 16,
      heightCells: 14,
      orientation: 'horizontal',
      pattern: ['hBN'],
      bandCells: [14],
      repeatPattern: false,
      periodicMode: 'xy',
      edgeMode: 'rectangular',
      patternDirection: 'top-down',
      passivateEdges: false
    }
  });

  /**
   * [REGISTRO-DOC-SG001] Convierte un valor a número finito y usa un valor de respaldo cuando la conversión no es válida.
   * @param {*} value
   * @param {*} fallback
   * @returns {number}
   */
  function asNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * [REGISTRO-DOC-SG002] Normaliza valores booleanos expresados como boolean, número o texto.
   * @param {*} value
   * @param {*} fallback
   * @returns {boolean}
   */
  function asBool(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const s = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'si', 'sí', 'y'].includes(s)) return true;
      if (['false', '0', 'no', 'n'].includes(s)) return false;
    }
    return fallback;
  }

  /**
   * [REGISTRO-DOC-SG003] Convierte una lista o texto delimitado en un arreglo normalizado de cadenas.
   * @param {*} value
   * @param {*} fallback
   * @returns {Array<string>}
   */
  function parseList(value, fallback) {
    if (Array.isArray(value)) return value.slice();
    if (typeof value !== 'string') return fallback.slice();
    const out = value
      .split(/[;,\s|/]+/)
      .map(s => s.trim())
      .filter(Boolean);
    return out.length ? out : fallback.slice();
  }

  /**
   * [REGISTRO-DOC-SG004] Convierte una lista o texto delimitado en un arreglo de números válidos.
   * @param {*} value
   * @param {*} fallback
   * @returns {Array<number>}
   */
  function parseNumberList(value, fallback) {
    const raw = parseList(value, fallback.map(String));
    const nums = raw
      .map(v => Math.max(1, Math.round(asNumber(v, 1))))
      .filter(v => Number.isFinite(v) && v > 0);
    return nums.length ? nums : fallback.slice();
  }

  /**
   * [REGISTRO-DOC-SG005] Normaliza la secuencia de materiales del patrón a dominios hBN y C.
   * @param {*} pattern
   * @returns {Array<string>}
   */
  function normalizePattern(pattern) {
    const raw = parseList(pattern, DEFAULTS.pattern);
    return raw.map(v => {
      const s = String(v).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (s === 'c' || s === 'carbon' || s === 'carbono' || s === 'graphene' || s === 'grafeno') return 'C';
      if (s === 'bn' || s === 'hbn' || s === 'hb' || s === 'hbnc') return 'hBN';
      return 'hBN';
    });
  }

  /**
   * [REGISTRO-DOC-SG006] Normaliza el modo de periodicidad a none, x, y o xy.
   * @param {*} mode
   * @returns {string}
   */
  function normalizePeriodicMode(mode) {
    const m = String(mode || DEFAULTS.periodicMode).toLowerCase();
    return ['none', 'x', 'y', 'xy'].includes(m) ? m : DEFAULTS.periodicMode;
  }

  /**
   * [REGISTRO-DOC-SG007] Normaliza el control de terminación hBN a auto, B o N.
   * @param {*} value
   * @returns {string}
   */
  function normalizeTerminalBN(value) {
    const v = String(value || DEFAULTS.terminalBN).trim().toUpperCase();
    if (v === 'B' || v === 'N') return v;
    return 'auto';
  }

  /**
   * [REGISTRO-DOC-SG008] Indica si el modo periódico activo incluye periodicidad en X.
   * @param {*} mode
   * @returns {boolean}
   */
  function isPeriodicX(mode) {
    return mode === 'x' || mode === 'xy';
  }

  /**
   * [REGISTRO-DOC-SG009] Indica si el modo periódico activo incluye periodicidad en Y.
   * @param {*} mode
   * @returns {boolean}
   */
  function isPeriodicY(mode) {
    return mode === 'y' || mode === 'xy';
  }

  /**
   * [REGISTRO-DOC-SG010] Normaliza la orientación de las bandas a horizontal o vertical.
   * @param {*} value
   * @returns {string}
   */
  function normalizeOrientation(value) {
    return String(value || DEFAULTS.orientation).toLowerCase() === 'vertical' ? 'vertical' : 'horizontal';
  }

  /**
   * [REGISTRO-DOC-SG011] Normaliza el sentido de escritura del patrón según la orientación elegida.
   * @param {*} value
   * @param {*} orientation
   * @returns {string}
   */
  function normalizeDirection(value, orientation) {
    const dir = String(value || DEFAULTS.patternDirection).toLowerCase();
    const allowed = ['top-down', 'bottom-up', 'left-right', 'right-left'];
    if (!allowed.includes(dir)) return orientation === 'vertical' ? 'left-right' : 'top-down';
    if (orientation === 'horizontal' && (dir === 'left-right' || dir === 'right-left')) return 'top-down';
    if (orientation === 'vertical' && (dir === 'top-down' || dir === 'bottom-up')) return 'left-right';
    return dir;
  }

  /**
   * [REGISTRO-DOC-SG012] Crea una copia independiente de un preset, incluyendo sus arreglos de patrón y espesores.
   * @param {*} name
   * @returns {Object}
   */
  function clonePreset(name) {
    const p = PRESETS[name] || PRESETS.manual;
    const out = Object.assign({}, p);
    if (Array.isArray(out.pattern)) out.pattern = out.pattern.slice();
    if (Array.isArray(out.bandCells)) out.bandCells = out.bandCells.slice();
    return out;
  }

  /**
   * [REGISTRO-DOC-SG013] Fusiona defaults, preset y opciones del usuario, valida rangos y normaliza todos los parámetros del generador.
   * @param {*} options
   * @returns {Object}
   */
  function normalizeOptions(options = {}) {
    const presetName = options.preset && PRESETS[options.preset] ? options.preset : 'manual';
    const preset = presetName === 'manual' ? {} : clonePreset(presetName);
    const opts = Object.assign({}, DEFAULTS, preset, options);

    opts.targetAtoms = Math.max(2, Math.round(asNumber(opts.targetAtoms, DEFAULTS.targetAtoms)));
    opts.widthCells = Math.max(1, Math.round(asNumber(opts.widthCells, DEFAULTS.widthCells)));
    opts.heightCells = Math.max(0, Math.round(asNumber(opts.heightCells, DEFAULTS.heightCells)));
    opts.bondLength = Math.max(0.1, asNumber(opts.bondLength, DEFAULTS.bondLength));
    opts.orientation = normalizeOrientation(opts.orientation);
    opts.pattern = normalizePattern(opts.pattern);
    opts.bandCells = parseNumberList(opts.bandCells, DEFAULTS.bandCells);
    opts.repeatPattern = asBool(opts.repeatPattern, DEFAULTS.repeatPattern);
    opts.exact = asBool(opts.exact, DEFAULTS.exact);
    opts.invertBN = asBool(opts.invertBN, DEFAULTS.invertBN);
    opts.mirrorBN = asBool(opts.mirrorBN, DEFAULTS.mirrorBN);
    opts.center = asBool(opts.center, DEFAULTS.center);
    opts.vacuum = Math.max(0, asNumber(opts.vacuum, DEFAULTS.vacuum));
    opts.z = asNumber(opts.z, DEFAULTS.z);
    opts.edgeMode = String(opts.edgeMode || DEFAULTS.edgeMode).toLowerCase() === 'primitive' ? 'primitive' : 'rectangular';
    opts.patternDirection = normalizeDirection(opts.patternDirection, opts.orientation);
    opts.periodicMode = normalizePeriodicMode(opts.periodicMode);
    opts.passivateEdges = asBool(opts.passivateEdges, DEFAULTS.passivateEdges);
    opts.startEdgePhase = String(opts.startEdgePhase || DEFAULTS.startEdgePhase).toUpperCase() === 'B' ? 'B' : 'A';
    opts.terminalBN = normalizeTerminalBN(opts.terminalBN);
    opts.xPeriodicExactMode = asBool(opts.xPeriodicExactMode, DEFAULTS.xPeriodicExactMode);
    opts.validationTolerance = Math.max(0.03, asNumber(opts.validationTolerance, DEFAULTS.validationTolerance));
    opts.simulatorOrient = String(opts.simulatorOrient || DEFAULTS.simulatorOrient).toUpperCase();
    if (!['AC', 'ZZ', 'AUTO'].includes(opts.simulatorOrient)) opts.simulatorOrient = DEFAULTS.simulatorOrient;
    opts.preset = presetName;
    return opts;
  }

  /**
   * [REGISTRO-DOC-SG014] Determina el número de celdas en ancho y alto a partir de las opciones y el objetivo de átomos.
   * @param {*} opts
   * @returns {{widthCells,heightCells}}
   */
  function chooseCellGrid(opts) {
    if (opts.heightCells && opts.heightCells > 0) {
      return { widthCells: opts.widthCells, heightCells: opts.heightCells };
    }
    const neededCells = Math.ceil(opts.targetAtoms / 2);
    return { widthCells: opts.widthCells, heightCells: Math.max(1, Math.ceil(neededCells / opts.widthCells)) };
  }

  /**
   * [REGISTRO-DOC-SG015] Determina qué material corresponde a una celda concreta según patrón, espesores, repetición y dirección.
   * @param {*} cellI
   * @param {*} cellJ
   * @param {*} opts
   * @param {*} grid
   * @returns {string}
   */
  function materialAt(cellI, cellJ, opts, grid) {
    let axisIndex = opts.orientation === 'vertical' ? cellI : cellJ;
    if (opts.orientation === 'horizontal' && opts.patternDirection === 'top-down') {
      axisIndex = (grid.heightCells - 1) - cellJ;
    }
    if (opts.orientation === 'vertical' && opts.patternDirection === 'right-left') {
      axisIndex = (grid.widthCells - 1) - cellI;
    }

    const pattern = opts.pattern.length ? opts.pattern : DEFAULTS.pattern;
    const bandCells = opts.bandCells.length ? opts.bandCells : DEFAULTS.bandCells;
    const cycle = bandCells.reduce((a, b) => a + b, 0) || 1;
    let pos = opts.repeatPattern ? (((axisIndex % cycle) + cycle) % cycle) : Math.max(0, axisIndex);

    for (let k = 0; k < bandCells.length; k++) {
      if (pos < bandCells[k]) return pattern[k % pattern.length];
      pos -= bandCells[k];
    }
    return opts.repeatPattern ? pattern[0] : pattern[(Math.min(pattern.length, bandCells.length) || 1) - 1];
  }

  /**
   * [REGISTRO-DOC-SG016] Asigna B, N o C a una subred de la celda según material e inversión B/N.
   * @param {*} material
   * @param {*} sub
   * @param {*} invertBN
   * @returns {string}
   */
  function getSpecies(material, sub, invertBN) {
    if (material === 'C') return 'C';
    if (!invertBN) return sub === 'A' ? 'B' : 'N';
    return sub === 'A' ? 'N' : 'B';
  }

  /**
   * [REGISTRO-DOC-SG017] Intercambia B por N y N por B, dejando otras especies sin cambio.
   * @param {*} element
   * @returns {string}
   */
  function swapBNElement(element) {
    if (element === 'B') return 'N';
    if (element === 'N') return 'B';
    return element;
  }

  /**
   * [REGISTRO-DOC-SG018] Aplica simetría espejo B/N al dominio hBN opuesto para obtener configuraciones palindrómicas.
   * @param {*} atoms
   * @param {*} opts
   * @param {*} warnings
   * @returns {Array<Object>}
   */
  function applyMirrorBNSymmetry(atoms, opts, warnings) {
    if (!opts.mirrorBN || !atoms.length) return atoms;

    const stackY = opts.orientation !== 'vertical';
    /**
     * [REGISTRO-DOC-SG019] Auxiliar local que proyecta un átomo sobre el eje activo de apilamiento.
     * @param {*} a
     * @returns {number}
     */
    const coord = a => (stackY ? a.y : a.x);
    const vals = atoms.map(coord);
    const minCoord = Math.min(...vals);
    const maxCoord = Math.max(...vals);
    const midCoord = (minCoord + maxCoord) / 2;

    // Keep the phase of the first written domain and flip only the opposite
    // half. This makes hBN/C/hBN chains palindromic: the second hBN block is
    // the mirror of the first instead of a same-phase translation.
    const startAtHigh = stackY
      ? opts.patternDirection !== 'bottom-up'
      : opts.patternDirection === 'right-left';
    const eps = 1e-9;
    let flipped = 0;
    atoms.forEach(a => {
      if (a.material !== 'hBN') return;
      const onOppositeHalf = startAtHigh ? coord(a) < midCoord - eps : coord(a) > midCoord + eps;
      if (!onOppositeHalf) return;
      const next = swapBNElement(a.element);
      if (next !== a.element) {
        a.element = next;
        flipped += 1;
      }
    });

    if (flipped > 0) {
      warnings.push(`Simetría espejo B/N activa: se invirtieron ${flipped} átomos B/N en el hBN del lado opuesto para formar una estructura palindrómica.`);
    } else {
      warnings.push('Simetría espejo B/N activa, pero no hubo átomos hBN en el lado opuesto para invertir.');
    }
    return atoms;
  }


  // Force the visible hBN terminal atom(s) to a chosen element without trimming
  // the lattice. This solves the common 1×N chain case where the geometry has
  // the right number of atoms, but the B/N phase is swapped relative to a
  // reference image. It only swaps B<->N inside the terminal hBN domain(s);
  // coordinates, bonds and atom count are preserved.
  /**
   * [REGISTRO-DOC-SG020] Fuerza la especie B o N visible en las terminaciones hBN sin cambiar coordenadas ni número de átomos.
   * @param {*} atoms
   * @param {*} opts
   * @param {*} warnings
   * @returns {Array<Object>}
   */
  function applyTerminalBNControl(atoms, opts, warnings) {
    const target = normalizeTerminalBN(opts.terminalBN);
    if (target === 'auto' || !atoms || !atoms.length) return atoms;
    const hbnAtoms = atoms.filter(a => a.material === 'hBN' && (a.element === 'B' || a.element === 'N'));
    if (!hbnAtoms.length) return atoms;

    const stackY = opts.orientation !== 'vertical';
    /**
     * [REGISTRO-DOC-SG021] Auxiliar local que proyecta un átomo sobre el eje activo de apilamiento.
     * @param {*} a
     * @returns {number}
     */
    const coord = a => stackY ? a.y : a.x;
    const vals = atoms.map(coord);
    const minCoord = Math.min(...vals);
    const maxCoord = Math.max(...vals);
    const midCoord = (minCoord + maxCoord) / 2;

    /**
     * [REGISTRO-DOC-SG022] Auxiliar local que localiza el átomo hBN terminal en uno de los extremos del eje activo.
     * @param {*} wantMax
     * @returns {Object|null}
     */
    const terminalAtom = wantMax => {
      let best = null;
      let bestVal = wantMax ? -Infinity : Infinity;
      hbnAtoms.forEach(a => {
        const v = coord(a);
        if ((wantMax && v > bestVal) || (!wantMax && v < bestVal)) {
          best = a;
          bestVal = v;
        }
      });
      return best;
    };

    /**
     * [REGISTRO-DOC-SG023] Auxiliar local que invierte B↔N en el dominio hBN del extremo solicitado cuando es necesario.
     * @param {*} wantMax
     * @returns {number}
     */
    const flipDomainAtEnd = wantMax => {
      const endAtom = terminalAtom(wantMax);
      if (!endAtom || endAtom.element === target) return 0;
      const endSideHigh = coord(endAtom) >= midCoord;
      let flipped = 0;
      atoms.forEach(a => {
        if (a.material !== 'hBN' || (a.element !== 'B' && a.element !== 'N')) return;
        const sameSide = endSideHigh ? coord(a) >= midCoord : coord(a) <= midCoord;
        if (!sameSide) return;
        const next = swapBNElement(a.element);
        if (next !== a.element) {
          a.element = next;
          flipped += 1;
        }
      });
      return flipped;
    };

    const f1 = flipDomainAtEnd(true);
    const f2 = flipDomainAtEnd(false);
    const total = f1 + f2;
    if (total > 0) {
      warnings.push(`Terminación hBN forzada: extremos visibles en ${target} (${target === 'B' ? 'verde/B' : 'azul/N'}); se intercambiaron ${total} átomos B/N sin cambiar la geometría.`);
    } else {
      warnings.push(`Terminación hBN forzada: los extremos visibles ya estaban en ${target}; no se cambió la geometría.`);
    }
    return atoms;
  }

  /**
   * [REGISTRO-DOC-SG024] Centra geométricamente la nube atómica alrededor del origen en el plano XY.
   * @param {*} atoms
   * @returns {Array<Object>}
   */
  function centerAtoms(atoms) {
    if (!atoms.length) return atoms;
    const xs = atoms.map(a => a.x);
    const ys = atoms.map(a => a.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    atoms.forEach(a => {
      a.x -= cx;
      a.y -= cy;
    });
    return atoms;
  }

  /**
   * [REGISTRO-DOC-SG025] Reasigna identificadores atómicos consecutivos desde 1.
   * @param {*} atoms
   * @returns {Array<Object>}
   */
  function reindexAtoms(atoms) {
    atoms.forEach((a, idx) => { a.id = idx + 1; });
    return atoms;
  }

  /**
   * [REGISTRO-DOC-SG026] Cuenta átomos B, N, C y H presentes en la estructura.
   * @param {*} atoms
   * @returns {{B,N,C,H}}
   */
  function countElements(atoms) {
    return atoms.reduce((acc, a) => {
      acc[a.element] = (acc[a.element] || 0) + 1;
      return acc;
    }, { B: 0, N: 0, C: 0, H: 0 });
  }

  // Resolve the real lattice family used to BUILD the geometry (not just to map
  // it onto the simulator grid). AUTO falls back to ZZ for the visual build.
  /**
   * [REGISTRO-DOC-SG027] Determina la familia geométrica real AC o ZZ usada para construir la red.
   * @param {*} opts
   * @returns {AC|ZZ}
   */
  function resolveEdgeFamily(opts) {
    const f = String(opts.simulatorOrient || 'ZZ').toUpperCase();
    return f === 'AC' ? 'AC' : 'ZZ';
  }

  // Honeycomb site placement for one cell (i = width index, j = stacking index).
  // Returns the (x,y) of the two basis atoms (sublattice A and B).
  //
  //  ZZ family: intracell bond is VERTICAL. The long edges along the stacking
  //             (vertical) axis are ZIGZAG. This is the original geometry.
  //  AC family: intracell bond is HORIZONTAL and the half-cell offset is carried
  //             on the vertical axis, so the long edges along the stacking axis
  //             become ARMCHAIR. Zigzag and armchair are perpendicular in a
  //             honeycomb, so this is a genuine 30-degree change of the lattice,
  //             not a coordinate swap.
  /**
   * [REGISTRO-DOC-SG028] Calcula las coordenadas de las dos subredes A/B de una celda honeycomb AC o ZZ.
   * @param {*} i
   * @param {*} j
   * @param {*} family
   * @param {*} primitive
   * @param {*} d
   * @returns {{ax,ay,bx,by}}
   */
  function placeCell(i, j, family, primitive, d) {
    const sqrt3 = Math.sqrt(3);
    if (family === 'AC') {
      const colOffset = primitive ? (i / 2) : ((i % 2) / 2);
      const ax = 1.5 * d * i;
      const ay = sqrt3 * d * (j + colOffset);
      return { ax, ay, bx: ax + d, by: ay };
    }
    const rowOffset = primitive ? (j / 2) : ((j % 2) / 2);
    const ax = sqrt3 * d * (i + rowOffset);
    const ay = 1.5 * d * j;
    return { ax, ay, bx: ax, by: ay + d };
  }

  /**
   * [REGISTRO-DOC-SG029] Genera la heteroestructura hBN/C completa: átomos, enlaces, caja, validación, grid y metadatos.
   * @param {*} options
   * @returns {StructureObject}
   */
  function generateAlternatingBands(options = {}) {
    const opts = normalizeOptions(options);
    const warnings = [];
    const edgeFamily = resolveEdgeFamily(opts);
    // A vertically-running armchair ribbon needs at least two dimer columns to be
    // a connected ribbon (a single column would be isolated B-N/C dimers).
    if (edgeFamily === 'AC' && opts.widthCells < 2) {
      opts.widthCells = 2;
      warnings.push('Para una nanocinta armchair (AC) se requieren al menos 2 celdas de ancho; se ajustó el ancho a 2 para mantener la cinta conectada.');
    } else if (edgeFamily === 'ZZ' && opts.widthCells < 2) {
      warnings.push('Aviso: ancho=1 produce una cadena 1D degenerada; en ese caso AC/ZZ no se distinguen como familias de borde. Usa ancho ≥ 2 para una nanocinta física.');
    }

    const grid = chooseCellGrid(opts);
    const axisCells = opts.orientation === 'vertical' ? grid.widthCells : grid.heightCells;
    const bandSum = (opts.bandCells || []).reduce((a, b) => a + b, 0);
    if (!opts.repeatPattern && bandSum !== axisCells) {
      if (bandSum < axisCells) warnings.push(`La suma de espesores (${bandSum}) es menor que el tamaño del eje activo (${axisCells}); el sobrante se asignará al último dominio.`);
      else warnings.push(`La suma de espesores (${bandSum}) supera el tamaño del eje activo (${axisCells}); los dominios finales quedarán truncados.`);
    }
    if ((opts.pattern || []).length !== (opts.bandCells || []).length) {
      warnings.push(`El patrón tiene ${(opts.pattern || []).length} dominios y espesores tiene ${(opts.bandCells || []).length} valores. El generador usa correspondencia por posición y repetición modular.`);
    }
    if (opts.repeatPattern && (opts.pattern || []).length > 1 && opts.pattern[0] === opts.pattern[opts.pattern.length - 1]) {
      warnings.push('El patrón periódico empieza y termina con el mismo material; al repetirse, las bandas contiguas se fusionarán visualmente.');
    }
    if (isPeriodicY(opts.periodicMode) && opts.edgeMode === 'rectangular' && grid.heightCells % 2 !== 0) {
      grid.heightCells += 1;
      warnings.push('Se aumentó el alto a un número par de celdas para cerrar correctamente la frontera Y.');
    }
    if (opts.periodicMode !== 'none' && opts.exact) {
      opts.exact = false;
      warnings.push('La red periódica no se recorta átomo por átomo; se usan celdas completas para conservar la topología.');
    }

    const d = opts.bondLength;
    const atoms = [];

    const primitive = opts.edgeMode === 'primitive';
    for (let j = 0; j < grid.heightCells; j++) {
      for (let i = 0; i < grid.widthCells; i++) {
        const material = materialAt(i, j, opts, grid);
        const { ax, ay, bx, by } = placeCell(i, j, edgeFamily, primitive, d);
        atoms.push({
          id: atoms.length + 1,
          element: getSpecies(material, 'A', opts.invertBN),
          material,
          sublattice: 'A',
          cellI: i,
          cellJ: j,
          domainAxis: opts.orientation === 'vertical' ? i : j,
          x: ax,
          y: ay,
          z: opts.z
        });
        atoms.push({
          id: atoms.length + 1,
          element: getSpecies(material, 'B', opts.invertBN),
          material,
          sublattice: 'B',
          cellI: i,
          cellJ: j,
          domainAxis: opts.orientation === 'vertical' ? i : j,
          x: bx,
          y: by,
          z: opts.z
        });
      }
    }

    let selected = atoms;
    if (opts.exact) {
      selected = atoms.slice(0, opts.targetAtoms);
      warnings.push('El recorte exacto puede dejar átomos de borde con baja coordinación; para simulación física conviene usar celdas completas.');
    }

    // Edge-phase shift: expose the opposite sublattice at the START edge of the
    // stacking axis, so the ribbon begins with a diagonal (inter-cell) bond
    // instead of a straight intra-cell dimer bond. This is the difference
    // between the two zigzag edge terminations (e.g. N-terminated vs
    // B-terminated edge), not the zigzag/armchair distinction.
    if (opts.startEdgePhase === 'B' && selected.length > 1) {
      const preserveForPBCX = opts.periodicMode === 'x' && opts.xPeriodicExactMode;
      if (preserveForPBCX) {
        warnings.push('Modo exacto PBC-X activo: se ignoró la fase de borde B con recorte de media celda para conservar el número total de átomos; la terminación visible se ajusta sin recortar.');
      } else {
        const stackY = opts.orientation !== 'vertical';
        /**
         * [REGISTRO-DOC-SG030] Auxiliar local que proyecta un átomo sobre el eje activo de apilamiento.
         * @param {*} a
         * @returns {number}
         */
        const coord = a => (stackY ? a.y : a.x);
        // "Start" edge = where the pattern begins.
        const startAtTop = stackY ? (opts.patternDirection !== 'bottom-up') : false;
        const startAtRight = !stackY ? (opts.patternDirection === 'right-left') : false;
        const vals = selected.map(coord);
        const extreme = (startAtTop || startAtRight) ? Math.max(...vals) : Math.min(...vals);
        const tol = 0.25 * d;
        const kept = selected.filter(a => Math.abs(coord(a) - extreme) > tol);
        if (kept.length && kept.length < selected.length) {
          selected = kept;
          warnings.push('Fase de borde "B": se desplazó el borde inicial media celda (se expone la otra subred / terminación opuesta).');
        }
      }
    }

    if (opts.mirrorBN) applyMirrorBNSymmetry(selected, opts, warnings);
    applyTerminalBNControl(selected, opts, warnings);

    if (opts.center) centerAtoms(selected);
    reindexAtoms(selected);
    const box = computeBox(selected, opts.vacuum, opts.periodicMode, grid, d, edgeFamily);
    const bonds = buildBonds(selected, d, opts.periodicMode, box);
    const counts = countElements(selected);
    const validation = validateStructure(selected, bonds, d, opts.periodicMode, box, grid, opts);
    warnings.push(...validation.warnings);
    const periodicBondCount = bonds.filter(b => b.periodic).length;

    return {
      atoms: selected,
      bonds,
      counts,
      box,
      validation,
      grid: structureToSimulatorGrid(selected, d),
      metadata: {
        generator: 'hBN/Carbon coherent structure builder',
        version: '2.3.0',
        preset: opts.preset,
        presetLabel: PRESETS[opts.preset] ? PRESETS[opts.preset].label : 'Manual',
        targetAtoms: opts.targetAtoms,
        actualAtoms: selected.length,
        widthCells: grid.widthCells,
        heightCells: grid.heightCells,
        simulatorNx: structureToSimulatorGrid(selected, d).Nx,
        simulatorNy: structureToSimulatorGrid(selected, d).Ny,
        bondLength: d,
        orientation: opts.orientation,
        pattern: opts.pattern,
        bandCells: opts.bandCells,
        repeatPattern: Boolean(opts.repeatPattern),
        exact: Boolean(opts.exact),
        invertBN: Boolean(opts.invertBN),
        mirrorBN: Boolean(opts.mirrorBN),
        edgeMode: opts.edgeMode,
        patternDirection: opts.patternDirection,
        periodicMode: opts.periodicMode,
        passivateEdges: Boolean(opts.passivateEdges),
        startEdgePhase: opts.startEdgePhase,
        terminalBN: opts.terminalBN,
        simulatorOrient: opts.simulatorOrient,
        edgeFamily,
        periodicBoundaryBonds: periodicBondCount,
        warnings,
        createdAt: new Date().toISOString(),
        note: 'Coherent B/N/C honeycomb lattice. Open-edge H passivation is handled by the main simulator when passivateEdges=true.'
      }
    };
  }

  /**
   * [REGISTRO-DOC-SG031] Calcula la caja cartesiana de simulación respetando vacío y periodicidad física por familia AC/ZZ.
   * @param {*} atoms
   * @param {*} vacuum
   * @param {*} periodicMode
   * @param {*} grid
   * @param {*} bondLength
   * @param {*} edgeFamily
   * @returns {{xlo,xhi,ylo,yhi,zlo,zhi}}
   */
  function computeBox(atoms, vacuum, periodicMode = 'none', grid = null, bondLength = DEFAULTS.bondLength, edgeFamily = 'ZZ') {
    if (!atoms.length) {
      return { xlo: -vacuum, xhi: vacuum, ylo: -vacuum, yhi: vacuum, zlo: -vacuum / 2, zhi: vacuum / 2 };
    }
    const xs = atoms.map(a => a.x);
    const ys = atoms.map(a => a.y);
    const sqrt3 = Math.sqrt(3);
    const periodicX = isPeriodicX(periodicMode);
    const periodicY = isPeriodicY(periodicMode);
    // [FIX v13.9] El periodo físico por celda depende de la familia de red
    // real (ver placeCell): la familia AC avanza 1.5*d por celda en X y
    // sqrt3*d por celda en Y; la familia ZZ es exactamente al revés (sqrt3*d
    // en X, 1.5*d en Y). Antes se asumía SIEMPRE la fórmula de ZZ aquí, lo
    // que para redes AC calculaba una longitud de caja periódica incorrecta.
    // Como buildBonds() usa esa longitud de caja para la convención de
    // imagen mínima, el enlace periódico de frontera dejaba de detectarse
    // en redes AC → los átomos de ese borde parecían tener valencia
    // incompleta y se pasivaban con H aunque esa frontera fuera periódica
    // (o, con XY periódico, se pasivaba todo el perímetro como una "isla").
    const xPeriodPerCell = edgeFamily === 'AC' ? 1.5 * bondLength : sqrt3 * bondLength;
    const yPeriodPerCell = edgeFamily === 'AC' ? sqrt3 * bondLength : 1.5 * bondLength;
    const lxPeriodic = grid ? xPeriodPerCell * grid.widthCells : Math.max(...xs) - Math.min(...xs);
    const lyPeriodic = grid ? yPeriodPerCell * grid.heightCells : Math.max(...ys) - Math.min(...ys);
    return {
      xlo: periodicX ? -lxPeriodic / 2 : Math.min(...xs) - vacuum,
      xhi: periodicX ? lxPeriodic / 2 : Math.max(...xs) + vacuum,
      ylo: periodicY ? -lyPeriodic / 2 : Math.min(...ys) - vacuum,
      yhi: periodicY ? lyPeriodic / 2 : Math.max(...ys) + vacuum,
      zlo: -vacuum / 2,
      zhi: vacuum / 2
    };
  }

  /**
   * [REGISTRO-DOC-SG032] Aplica la convención de imagen mínima a una diferencia de coordenadas periódica.
   * @param {*} dx
   * @param {*} length
   * @param {*} active
   * @returns {{delta,wrap}}
   */
  function minImageDelta(dx, length, active) {
    if (!active || !length) return { delta: dx, wrap: 0 };
    const wrap = Math.round(dx / length);
    return { delta: dx - wrap * length, wrap };
  }

  /**
   * [REGISTRO-DOC-SG033] Construye los enlaces de primeros vecinos por distancia, registrando cruces de frontera periódica.
   * @param {*} atoms
   * @param {*} bondLength
   * @param {*} periodicMode
   * @param {*} box
   * @returns {Array<Bond>}
   */
  function buildBonds(atoms, bondLength, periodicMode = 'none', box = null) {
    const tol = Math.max(0.06, bondLength * 0.13);
    const maxD2 = Math.pow(bondLength + tol, 2);
    const minD2 = Math.pow(Math.max(0.01, bondLength - tol), 2);
    const bonds = [];
    const periodicX = isPeriodicX(periodicMode);
    const periodicY = isPeriodicY(periodicMode);
    const lx = box ? Math.abs(box.xhi - box.xlo) : 0;
    const ly = box ? Math.abs(box.yhi - box.ylo) : 0;

    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const mx = minImageDelta(atoms[i].x - atoms[j].x, lx, periodicX);
        const my = minImageDelta(atoms[i].y - atoms[j].y, ly, periodicY);
        const dz = atoms[i].z - atoms[j].z;
        const r2 = mx.delta * mx.delta + my.delta * my.delta + dz * dz;
        if (r2 >= minD2 && r2 <= maxD2) {
          bonds.push({
            id: bonds.length + 1,
            a: atoms[i].id,
            b: atoms[j].id,
            length: Math.sqrt(r2),
            periodic: mx.wrap !== 0 || my.wrap !== 0,
            wrapX: mx.wrap,
            wrapY: my.wrap
          });
        }
      }
    }
    return bonds;
  }

  /**
   * [REGISTRO-DOC-SG034] Evalúa coordinación, longitudes de enlace, solapamientos, composición de enlaces y advertencias de la estructura.
   * @param {*} atoms
   * @param {*} bonds
   * @param {*} bondLength
   * @param {*} periodicMode
   * @param {*} box
   * @param {*} grid
   * @param {*} opts
   * @returns {Object}
   */
  function validateStructure(atoms, bonds, bondLength, periodicMode, box, grid, opts) {
    const degree = new Array(atoms.length).fill(0);
    const bondLengths = [];
    let hbnWrong = 0;
    let cc = 0, bn = 0, cb = 0, cn = 0, bb = 0, nn = 0;

    for (const b of bonds) {
      const a = atoms[b.a - 1];
      const c = atoms[b.b - 1];
      degree[b.a - 1]++;
      degree[b.b - 1]++;
      bondLengths.push(b.length);
      const pair = [a.element, c.element].sort().join('-');
      if (pair === 'B-N') bn++;
      if (pair === 'C-C') cc++;
      if (pair === 'B-C') cb++;
      if (pair === 'C-N') cn++;
      if (pair === 'B-B') bb++;
      if (pair === 'N-N') nn++;
      if (a.material === 'hBN' && c.material === 'hBN' && a.element === c.element) hbnWrong++;
    }

    const hist = { 0: 0, 1: 0, 2: 0, 3: 0, over3: 0 };
    degree.forEach(v => {
      if (v >= 0 && v <= 3) hist[v]++;
      else hist.over3++;
    });

    const minBond = bondLengths.length ? Math.min(...bondLengths) : 0;
    const maxBond = bondLengths.length ? Math.max(...bondLengths) : 0;
    const avgBond = bondLengths.length ? bondLengths.reduce((a, b) => a + b, 0) / bondLengths.length : 0;
    const maxDevPct = bondLengths.length ? Math.max(...bondLengths.map(v => Math.abs(v - bondLength) / bondLength * 100)) : 0;
    const overlapCount = countOverlaps(atoms, bondLength, periodicMode, box);

    const warnings = [];
    if (hist.over3 > 0) warnings.push(`Hay ${hist.over3} átomos con más de 3 vecinos; revisar periodicidad o dimensiones.`);
    if (overlapCount > 0) warnings.push(`Se detectaron ${overlapCount} posibles solapamientos atómicos.`);
    if (hbnWrong > 0) warnings.push(`Se detectaron ${hbnWrong} enlaces B–B/N–N dentro de dominios hBN; revisar subred o recorte.`);
    if (maxDevPct > 5) warnings.push(`La desviación máxima de enlace es ${maxDevPct.toFixed(2)}%; revisar el modo de borde/PBC.`);
    if (opts.passivateEdges && periodicMode === 'xy') warnings.push('La pasivación H no actúa sobre bulk completamente periódico.');
    if (!opts.passivateEdges && periodicMode !== 'xy' && (hist[1] + hist[2]) > 0) warnings.push('Hay bordes abiertos sin pasivación H. Es válido para visualizar; para energía física activa la pasivación.');

    return {
      ok: warnings.length === 0 || warnings.every(w => w.includes('bordes abiertos sin pasivación')),
      degreeHistogram: hist,
      bondsByType: { BN: bn, CC: cc, CB: cb, CN: cn, BB: bb, NN: nn },
      minBond,
      maxBond,
      avgBond,
      maxBondDeviationPct: maxDevPct,
      overlaps: overlapCount,
      hbnWrongBonds: hbnWrong,
      warnings
    };
  }

  /**
   * [REGISTRO-DOC-SG035] Cuenta pares atómicos anormalmente próximos bajo la misma convención periódica de la estructura.
   * @param {*} atoms
   * @param {*} bondLength
   * @param {*} periodicMode
   * @param {*} box
   * @returns {number}
   */
  function countOverlaps(atoms, bondLength, periodicMode, box) {
    const periodicX = isPeriodicX(periodicMode);
    const periodicY = isPeriodicY(periodicMode);
    const lx = box ? Math.abs(box.xhi - box.xlo) : 0;
    const ly = box ? Math.abs(box.yhi - box.ylo) : 0;
    const minD2 = Math.pow(bondLength * 0.55, 2);
    let overlaps = 0;
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const mx = minImageDelta(atoms[i].x - atoms[j].x, lx, periodicX);
        const my = minImageDelta(atoms[i].y - atoms[j].y, ly, periodicY);
        const dz = atoms[i].z - atoms[j].z;
        const r2 = mx.delta * mx.delta + my.delta * my.delta + dz * dz;
        if (r2 < minD2) overlaps++;
      }
    }
    return overlaps;
  }

  /**
   * [REGISTRO-DOC-SG036] Convierte posiciones atómicas en una malla rectangular simple compatible con el simulador principal.
   * @param {*} atoms
   * @param {*} bondLength
   * @returns {{Nx,Ny,grid,mapped}}
   */
  function structureToSimulatorGrid(atoms, bondLength = DEFAULTS.bondLength) {
    const rows = [];
    const tol = Math.max(0.05, bondLength * 0.09);
    const sortedY = atoms.map(a => a.y).sort((a, b) => a - b);
    for (const y of sortedY) {
      const last = rows[rows.length - 1];
      if (!last || Math.abs(y - last.y) > tol) rows.push({ y, atoms: [] });
      else last.y = (last.y * last.atoms.length + y) / (last.atoms.length + 1);
    }
    for (const a of atoms) {
      let best = 0, bestD = Infinity;
      for (let r = 0; r < rows.length; r++) {
        const d = Math.abs(a.y - rows[r].y);
        if (d < bestD) { bestD = d; best = r; }
      }
      rows[best].atoms.push(a);
    }
    rows.sort((a, b) => b.y - a.y);
    rows.forEach(r => r.atoms.sort((a, b) => a.x - b.x));
    const nx = Math.max(1, ...rows.map(r => r.atoms.length));
    const ny = Math.max(1, rows.length);
    const grid = new Uint8Array(nx * ny);
    let mapped = 0;
    for (let i = 0; i < ny; i++) {
      const row = rows[i].atoms;
      for (let j = 0; j < Math.min(nx, row.length); j++) {
        const a = row[j];
        const code = a.element === 'B' ? 2 : a.element === 'N' ? 1 : 3;
        grid[i * nx + j] = code;
        mapped++;
      }
    }
    return { Nx: nx, Ny: ny, grid, mapped };
  }


  /**
   * [REGISTRO-DOC-SG037] Redondea un valor entero y lo limita a un intervalo dado.
   * @param {*} v
   * @param {*} min
   * @param {*} max
   * @returns {number}
   */
  function clampInt(v, min, max) {
    return Math.max(min, Math.min(max, Math.round(v) || min));
  }

  /**
   * [REGISTRO-DOC-SG038] Estima dimensiones Nx/Ny del simulador a partir de la extensión cartesiana de los átomos.
   * @param {*} atoms
   * @param {*} bondLength
   * @returns {{nx,ny}}
   */
  function inferSimulatorDimsFromAtoms(atoms, bondLength = DEFAULTS.bondLength) {
    if (!atoms || !atoms.length) return { nx: 2, ny: 2 };
    const xs = atoms.map(a => a.x), ys = atoms.map(a => a.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const nx = clampInt(Math.round((maxX - minX + 2 * bondLength) / (1.5 * bondLength)), 2, 192);
    const ny = clampInt(Math.round((maxY - minY + 2 * bondLength) / (Math.sqrt(3) * bondLength / 2)), 2, 192);
    return { nx, ny };
  }

  /**
   * [REGISTRO-DOC-SG039] Calcula la posición cartesiana de un sitio de la malla del simulador para orientación AC o ZZ.
   * @param {*} i
   * @param {*} j
   * @param {*} orient
   * @param {*} bondLength
   * @returns {[x,y]}
   */
  function sitePosForOrient(i, j, orient = 'AC', bondLength = DEFAULTS.bondLength) {
    const sr = i & 1, sc = j & 1, cr = i >> 1, cc = j >> 1;
    const LX = bondLength / 2, LY = bondLength * Math.sqrt(3) / 2, DX = 2 * LX + 2 * bondLength, DY = 2 * LY;
    const x = cc * DX + (sr === 0 ? (sc === 0 ? LX : LX + bondLength) : (sc === 0 ? 0 : 2 * LX + bondLength));
    const y = cr * DY + (sr === 0 ? LY : 0);
    return orient === 'ZZ' ? [y, x] : [x, y];
  }

  /**
   * [REGISTRO-DOC-SG040] Asigna átomos B/N/C a los sitios más próximos de una malla Nx×Ny y calcula el error de mapeo.
   * @param {*} atoms
   * @param {*} nx
   * @param {*} ny
   * @param {*} orient
   * @param {*} bondLength
   * @returns {Object}
   */
  function mapAtomsToSimulatorGrid(atoms, nx, ny, orient = 'AC', bondLength = DEFAULTS.bondLength) {
    const speciesToCode = { B: 2, N: 1, C: 3 };
    const workAtoms = (atoms || []).map((a, origIndex) => ({ ...a, origIndex })).filter(a => ['B', 'N', 'C'].includes(a.element || a.symbol));
    if (!workAtoms.length) return { grid: new Uint8Array(nx * ny), mapped: 0, score: Infinity, collisions: 0, orient, nx, ny };
    const xs = workAtoms.map(a => a.x), ys = workAtoms.map(a => a.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sites = [];
    let sMinX = Infinity, sMinY = Infinity, sMaxX = -Infinity, sMaxY = -Infinity;
    for (let i = 0; i < ny; i++) {
      for (let j = 0; j < nx; j++) {
        const [x, y] = sitePosForOrient(i, j, orient, bondLength);
        if (x < sMinX) sMinX = x; if (x > sMaxX) sMaxX = x; if (y < sMinY) sMinY = y; if (y > sMaxY) sMaxY = y;
        sites.push({ k: i * nx + j, x, y });
      }
    }
    const axRange = maxX - minX || 1, ayRange = maxY - minY || 1;
    const sx = (sMaxX - sMinX || 1) / axRange, sy = (sMaxY - sMinY || 1) / ayRange;
    const scale = (Math.abs(sx - 1) < 0.25 && Math.abs(sy - 1) < 0.25) ? 1 : Math.min(sx, sy);
    const grid = new Uint8Array(nx * ny);
    const used = new Set();
    const atomToGrid = {};
    let err = 0, mapped = 0, collisions = 0;
    for (const atom of workAtoms) {
      const x = (atom.x - minX) * scale + sMinX;
      const y = (atom.y - minY) * scale + sMinY;
      let best = null, bestD = Infinity;
      for (const s of sites) {
        if (used.has(s.k)) continue;
        const d = Math.hypot(x - s.x, y - s.y);
        if (d < bestD) { bestD = d; best = s; }
      }
      if (!best) { collisions++; continue; }
      used.add(best.k);
      mapped++;
      err += bestD * bestD;
      const el = atom.element || atom.symbol;
      grid[best.k] = speciesToCode[el] || 0;
      atomToGrid[atom.origIndex] = best.k;
    }
    return { grid, mapped, score: mapped ? Math.sqrt(err / mapped) : Infinity, collisions, orient, atomToGrid, nx, ny };
  }


  /**
   * [REGISTRO-DOC-SG041] Rota un vector bidimensional un ángulo dado.
   * @param {*} v
   * @param {*} angle
   * @returns {{x,y}}
   */
  function rotateVec(v, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
  }

  /**
   * [REGISTRO-DOC-SG042] Normaliza un vector bidimensional a longitud unitaria.
   * @param {*} dx
   * @param {*} dy
   * @returns {{x,y}}
   */
  function unitVec(dx, dy) {
    const n = Math.hypot(dx, dy) || 1;
    return { x: dx / n, y: dy / n };
  }

  /**
   * [REGISTRO-DOC-SG043] Determina si un H de pasivación debe omitirse porque la valencia abierta corresponde a una frontera periódica.
   * @param {*} atom
   * @param {*} dirScreen
   * @param {*} bondLength
   * @param {*} periodicMode
   * @param {*} box
   * @returns {boolean}
   */
  function skipsPeriodicEdgeHydrogen(atom, dirScreen, bondLength, periodicMode = 'none', box = null) {
    // Un H solo debe representar un borde REALMENTE abierto. Si la dirección
    // faltante pertenece a un eje periódico, no se pasiva aunque el grafo de la
    // celda mínima no tenga un vecino explícito (caso típico: nanocinta de una
    // sola celda de ancho con PBC en X). dirScreen usa y invertida para coincidir
    // con el canvas, por eso se convierte a coordenada física antes de probar caja.
    const px = isPeriodicX(periodicMode);
    const py = isPeriodicY(periodicMode);
    if (!px && !py) return false;
    const d = Math.max(0.01, Number(bondLength) || DEFAULTS.bondLength);
    const tx = atom.x + dirScreen.x * d;
    const ty = atom.y - dirScreen.y * d;
    if (box) {
      const eps = Math.max(0.04, d * 0.42);
      if (px && (tx <= box.xlo + eps || tx >= box.xhi - eps)) return true;
      if (py && (ty <= box.ylo + eps || ty >= box.yhi - eps)) return true;
    }
    // Respaldo para celdas ultrapequeñas donde el vecino periódico sería una
    // imagen de la propia celda: no queda fuera de la caja, pero su dirección es
    // claramente paralela al eje periódico. Mantiene H de los bordes abiertos.
    if (px && Math.abs(dirScreen.x) > Math.abs(dirScreen.y) * 1.35) return true;
    if (py && Math.abs(dirScreen.y) > Math.abs(dirScreen.x) * 1.35) return true;
    return false;
  }

  /**
   * [REGISTRO-DOC-SG044] Construye posiciones explícitas de H para valencias abiertas reales de una geometría del constructor.
   * @param {*} atoms
   * @param {*} adjacency
   * @param {*} bondLength
   * @param {*} periodicMode
   * @param {*} box
   * @returns {Array<Object>}
   */
  function buildExplicitHydrogenSites(atoms, adjacency, bondLength, periodicMode = 'none', box = null) {
    const frac = (typeof H_BOND_FRAC !== 'undefined' && Number.isFinite(H_BOND_FRAC)) ? H_BOND_FRAC : 0.38;
    const hsites = [];
    const periodicEdgeFallback = [];
    const targetValence = 3;
    const step = bondLength * frac;
    for (let k = 0; k < atoms.length; k++) {
      const a = atoms[k];
      const nbs = Array.from(adjacency[k] || []);
      const missing = Math.max(0, targetValence - nbs.length);
      if (!missing) continue;
      const dirs = nbs.map(nk => unitVec(atoms[nk].x - a.x, -(atoms[nk].y - a.y)));
      let outDirs = [];
      if (dirs.length >= 2) {
        let sx = 0, sy = 0;
        dirs.forEach(v => { sx += v.x; sy += v.y; });
        outDirs.push(unitVec(-sx, -sy));
      } else if (dirs.length === 1) {
        // Caso límite: cinta periódica en X con borde libre superior/inferior.
        // Para un ancho 1 o una punta ZZ, el modelo trigonal generaría dos H
        // laterales a ±120°. Visualmente eso contradice el borde libre real (Y).
        // Se prioriza un H hacia afuera del borde físico para evitar los H
        // laterales espurios; la recomendación sigue siendo ancho ≥ 2.
        const ys = atoms.map(q => q.y);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const edgeTol = Math.max(0.05, bondLength * 0.55);
        if (isPeriodicX(periodicMode) && !isPeriodicY(periodicMode) && (a.y <= minY + edgeTol || a.y >= maxY - edgeTol)) {
          outDirs.push({ x: 0, y: a.y <= minY + edgeTol ? 1 : -1 });
        } else {
          outDirs.push(rotateVec(dirs[0], 2 * Math.PI / 3));
          outDirs.push(rotateVec(dirs[0], -2 * Math.PI / 3));
        }
      } else {
        outDirs.push({ x: 1, y: 0 }, { x: -0.5, y: Math.sqrt(3) / 2 }, { x: -0.5, y: -Math.sqrt(3) / 2 });
      }
      while (outDirs.length < missing) {
        const base = outDirs[outDirs.length % Math.max(1, outDirs.length)] || { x: 1, y: 0 };
        outDirs.push(rotateVec(base, 2 * Math.PI / 3));
      }
      outDirs.slice(0, missing).forEach((v, n) => {
        const h = {
          id: `constructorH:${k}:${n}`,
          parent: k,
          type: a.element === 'N' ? 1 : a.element === 'B' ? 2 : 3,
          kind: 'edge',
          x: a.x + v.x * step,
          y: -a.y + v.y * step
        };
        if (skipsPeriodicEdgeHydrogen(a, v, bondLength, periodicMode, box)) {
          periodicEdgeFallback.push(h);
          return;
        }
        hsites.push(h);
      });
    }
    // Si la celda periódica es topológicamente mínima (por ejemplo ancho=1),
    // todos los H laterales pueden quedar filtrados. En ese caso se conserva
    // un único H en cada borde físico abierto para que la terminación superior
    // / inferior siga siendo visible, sin volver a dibujar pasivación lateral.
    if (!hsites.length && periodicEdgeFallback.length) {
      /**
       * [REGISTRO-DOC-SG045] Auxiliar local que añade un H de respaldo evitando duplicados geométricos.
       * @param {*} h
       */
      const addUnique = h => {
        if (!h) return;
        if (!hsites.some(x => x.parent === h.parent && Math.hypot(x.x - h.x, x.y - h.y) < 1e-6)) hsites.push(h);
      };
      if (isPeriodicX(periodicMode) && !isPeriodicY(periodicMode)) {
        const byY = periodicEdgeFallback.slice().sort((a, b) => a.y - b.y);
        addUnique(byY[0]);
        addUnique(byY[byY.length - 1]);
      } else if (isPeriodicY(periodicMode) && !isPeriodicX(periodicMode)) {
        const byX = periodicEdgeFallback.slice().sort((a, b) => a.x - b.x);
        addUnique(byX[0]);
        addUnique(byX[byX.length - 1]);
      }
    }
    return hsites;
  }

  /**
   * [REGISTRO-DOC-SG046] Convierte la estructura generada en grafo explícito del simulador: especies, vecinos, posiciones, valencias e H.
   * @param {*} structure
   * @returns {Object|null}
   */
  function buildExplicitSimulatorGraph(structure) {
    const atoms = ((structure && structure.atoms) || []).filter(a => ['B', 'N', 'C'].includes(a.element || a.symbol));
    if (!atoms.length) return null;
    const n = atoms.length;
    const speciesToCode = { N: 1, B: 2, C: 3 };
    const grid = new Uint8Array(n);
    for (let k = 0; k < n; k++) grid[k] = speciesToCode[atoms[k].element || atoms[k].symbol] || 0;

    const adjacency = Array.from({ length: n }, () => new Set());
    ((structure && structure.bonds) || []).forEach(b => {
      const a = (Number(b.a) || 0) - 1;
      const c = (Number(b.b) || 0) - 1;
      if (a >= 0 && a < n && c >= 0 && c < n && a !== c) {
        adjacency[a].add(c);
        adjacency[c].add(a);
      }
    });
    const pnb = adjacency.map(set => Array.from(set).sort((a, b) => a - b).map(k => [k, 0]));
    const positions = atoms.map(a => ({ x: a.x, y: -a.y }));
    const openValence = adjacency.map(set => Math.max(0, 3 - set.size));
    const bondLength = (structure && structure.metadata && Number(structure.metadata.bondLength)) || DEFAULTS.bondLength;
    const periodicMode = String((structure && structure.metadata && structure.metadata.periodicMode) || 'none').toLowerCase();
    const hSites = buildExplicitHydrogenSites(atoms, adjacency, bondLength, periodicMode, structure.box || null);
    const requested = String((structure && structure.metadata && structure.metadata.simulatorOrient) || DEFAULTS.simulatorOrient).toUpperCase();
    const orient = ['AC', 'ZZ'].includes(requested) ? requested : 'AC';
    return {
      grid,
      mapped: n,
      score: 0,
      collisions: 0,
      orient,
      nx: 1,
      ny: n,
      method: 'explicit-constructor-graph',
      customPNB: pnb,
      customPositions: positions,
      customOpenValence: openValence,
      importedHSites: hSites,
      customBox: structure.box || null
    };
  }

  /**
   * [REGISTRO-DOC-SG047] Selecciona la estrategia de mapeo al simulador, priorizando el grafo explícito y luego malla exacta o nearest AC/ZZ.
   * @param {*} structure
   * @returns {Object}
   */
  function chooseSimulatorMapping(structure) {
    const bondLength = (structure && structure.metadata && structure.metadata.bondLength) || DEFAULTS.bondLength;
    const atoms = (structure && structure.atoms) || [];
    const requested = String((structure && structure.metadata && structure.metadata.simulatorOrient) || DEFAULTS.simulatorOrient).toUpperCase();
    const explicit = buildExplicitSimulatorGraph(structure);
    if (explicit && explicit.mapped > 0) return explicit;
    let exactOrient = requested;
    if (exactOrient === 'AUTO') {
      exactOrient = String((structure && structure.metadata && (structure.metadata.edgeFamily || structure.metadata.simulatorOrient)) || 'ZZ').toUpperCase();
    }
    if (!['AC', 'ZZ'].includes(exactOrient)) exactOrient = 'ZZ';

    // Prefer the exact grid created by the constructor. This is essential for
    // ultra-thin ribbons (for example widthCells=1): bounding-box inference
    // can inflate a 1×24 chain into a sparse 2×23 simulator grid, which changes
    // the apparent topology after pressing “Cargar en simulador”.
    const builtGrid = structure && structure.grid;
    if (builtGrid && builtGrid.grid && builtGrid.Nx && builtGrid.Ny) {
      const nx = Math.max(1, Math.round(Number(builtGrid.Nx)));
      const ny = Math.max(1, Math.round(Number(builtGrid.Ny)));
      const values = Array.from(builtGrid.grid).map(v => Number(v) || 0);
      const atomCount = atoms.filter(a => ['B', 'N', 'C'].includes(a.element || a.symbol)).length;
      const occupied = values.reduce((n, v) => n + ([1, 2, 3].includes(v) ? 1 : 0), 0);
      if (values.length === nx * ny && occupied === atomCount && occupied > 0) {
        return {
          grid: new Uint8Array(values),
          mapped: occupied,
          score: 0,
          collisions: 0,
          orient: exactOrient,
          nx,
          ny,
          method: 'exact-constructor-grid'
        };
      }
    }

    const dims = inferSimulatorDimsFromAtoms(atoms, bondLength);
    if (requested === 'AC' || requested === 'ZZ') {
      const mapped = mapAtomsToSimulatorGrid(atoms, dims.nx, dims.ny, requested, bondLength);
      mapped.method = `nearest-${requested}`;
      return mapped;
    }
    const ac = mapAtomsToSimulatorGrid(atoms, dims.nx, dims.ny, 'AC', bondLength);
    ac.method = 'nearest-AC';
    const zz = mapAtomsToSimulatorGrid(atoms, dims.nx, dims.ny, 'ZZ', bondLength);
    zz.method = 'nearest-ZZ';
    return ac.score <= zz.score ? ac : zz;
  }

  /**
   * [REGISTRO-DOC-SG048] Serializa la estructura completa en formato XYZ.
   * @param {*} structure
   * @returns {string}
   */
  function makeXYZ(structure) {
    const lines = [];
    lines.push(String(structure.atoms.length));
    lines.push(`Generated coherent hBN/C structure | preset=${structure.metadata.presetLabel} | atoms=${structure.atoms.length} | cells=${structure.metadata.widthCells}x${structure.metadata.heightCells} | pattern=${structure.metadata.pattern.join('-')} | bands=${structure.metadata.bandCells.join('-')} | orientation=${structure.metadata.orientation} | periodic=${structure.metadata.periodicMode}`);
    structure.atoms.forEach(a => lines.push(`${a.element} ${a.x.toFixed(8)} ${a.y.toFixed(8)} ${a.z.toFixed(8)}`));
    return lines.join('\n') + '\n';
  }

  /**
   * [REGISTRO-DOC-SG049] Serializa la estructura en formato POSCAR/VASP con caja y especies agrupadas.
   * @param {*} structure
   * @returns {string}
   */
  function makePOSCAR(structure) {
    const speciesOrder = ['B', 'N', 'C'].filter(s => (structure.counts[s] || 0) > 0);
    const box = structure.box;
    const lx = box.xhi - box.xlo;
    const ly = box.yhi - box.ylo;
    const lz = box.zhi - box.zlo;
    const atomsBySpecies = [];
    speciesOrder.forEach(s => structure.atoms.filter(a => a.element === s).forEach(a => atomsBySpecies.push(a)));
    const lines = [];
    lines.push('Coherent hBN/C structure generated by hBN/Carbon structure builder');
    lines.push('1.0');
    lines.push(`${lx.toFixed(8)} 0.00000000 0.00000000`);
    lines.push(`0.00000000 ${ly.toFixed(8)} 0.00000000`);
    lines.push(`0.00000000 0.00000000 ${lz.toFixed(8)}`);
    lines.push(speciesOrder.join(' '));
    lines.push(speciesOrder.map(s => structure.counts[s]).join(' '));
    lines.push('Cartesian');
    atomsBySpecies.forEach(a => lines.push(`${(a.x - box.xlo).toFixed(8)} ${(a.y - box.ylo).toFixed(8)} ${(a.z - box.zlo).toFixed(8)}`));
    return lines.join('\n') + '\n';
  }

  /**
   * [REGISTRO-DOC-SG050] Serializa la estructura en formato LAMMPS DATA incluyendo caja y coordenadas atómicas.
   * @param {*} structure
   * @returns {string}
   */
  function makeLAMMPSData(structure) {
    const typeMap = { B: 1, N: 2, C: 3, H: 4 };
    const mass = { B: 10.811, N: 14.007, C: 12.011, H: 1.008 };
    const box = structure.box;
    const lines = [];
    lines.push(`LAMMPS data - coherent hBN/C structure | periodic=${structure.metadata.periodicMode}`);
    lines.push('');
    lines.push(`${structure.atoms.length} atoms`);
    lines.push('4 atom types');
    lines.push('');
    lines.push(`${box.xlo.toFixed(8)} ${box.xhi.toFixed(8)} xlo xhi`);
    lines.push(`${box.ylo.toFixed(8)} ${box.yhi.toFixed(8)} ylo yhi`);
    lines.push(`${box.zlo.toFixed(8)} ${box.zhi.toFixed(8)} zlo zhi`);
    lines.push('');
    lines.push('Masses');
    lines.push('');
    lines.push(`1 ${mass.B} # B`);
    lines.push(`2 ${mass.N} # N`);
    lines.push(`3 ${mass.C} # C`);
    lines.push(`4 ${mass.H} # H`);
    lines.push('');
    lines.push('Atoms # atomic');
    lines.push('');
    structure.atoms.forEach(a => lines.push(`${a.id} ${typeMap[a.element]} ${a.x.toFixed(8)} ${a.y.toFixed(8)} ${a.z.toFixed(8)} # ${a.element}`));
    return lines.join('\n') + '\n';
  }

  /**
   * [REGISTRO-DOC-SG051] Serializa la estructura y metadatos en JSON legible.
   * @param {*} structure
   * @returns {string}
   */
  function makeJSON(structure) {
    const copy = Object.assign({}, structure, {
      grid: structure.grid ? {
        Nx: structure.grid.Nx,
        Ny: structure.grid.Ny,
        mapped: structure.grid.mapped,
        values: Array.from(structure.grid.grid || [])
      } : null
    });
    return JSON.stringify(copy, null, 2);
  }

  /**
   * [REGISTRO-DOC-SG052] Genera una descarga de texto en el navegador mediante Blob y URL temporal.
   * @param {*} filename
   * @param {*} text
   * @param {*} mime
   */
  function downloadText(filename, text, mime = 'text/plain') {
    // saveFile() (definido en core.js) ofrece el diálogo nativo "Guardar como"
    // cuando el navegador lo soporta y el usuario lo tiene activado; si no,
    // cae automáticamente al <a download> clásico hacia la carpeta de Descargas.
    if (typeof saveFile === 'function') { saveFile(filename, text, mime + ';charset=utf-8'); return; }
    const blob = new Blob([text], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * [REGISTRO-DOC-SG053] Genera una representación SVG 2D de átomos y enlaces de la estructura.
   * @param {*} structure
   * @param {*} options
   * @returns {string}
   */
  function createSVG(structure, options = {}) {
    const width = options.width || 780;
    const height = options.height || 420;
    const pad = 24;
    const atoms = structure.atoms;
    if (!atoms.length) return '<svg></svg>';
    const xs = atoms.map(a => a.x), ys = atoms.map(a => a.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const sx = (width - 2 * pad) / Math.max(1e-9, maxX - minX);
    const sy = (height - 2 * pad) / Math.max(1e-9, maxY - minY);
    const s = Math.min(sx, sy);
    /**
     * [REGISTRO-DOC-SG054] Transforma una coordenada X física a coordenada X del SVG.
     * @param {*} x
     * @returns {number}
     */
    const tx = x => pad + (x - minX) * s + ((width - 2 * pad) - (maxX - minX) * s) / 2;
    /**
     * [REGISTRO-DOC-SG055] Transforma una coordenada Y física a coordenada Y del SVG.
     * @param {*} y
     * @returns {number}
     */
    const ty = y => height - (pad + (y - minY) * s + ((height - 2 * pad) - (maxY - minY) * s) / 2);
    const color = { B: '#18c83c', N: '#123fd0', C: '#7f929c', H: '#ffffff' };
    const r = Math.max(2.4, Math.min(5.5, s * 0.16));
    const strokeW = Math.max(0.6, Math.min(1.8, s * 0.04));
    const lx = structure.box ? Math.abs(structure.box.xhi - structure.box.xlo) : 0;
    const ly = structure.box ? Math.abs(structure.box.yhi - structure.box.ylo) : 0;
    const bondLines = structure.bonds.map(b => {
      const a = atoms[b.a - 1], c = atoms[b.b - 1];
      if (!b.periodic) {
        return `<line x1="${tx(a.x).toFixed(2)}" y1="${ty(a.y).toFixed(2)}" x2="${tx(c.x).toFixed(2)}" y2="${ty(c.y).toFixed(2)}" stroke="#54656d" stroke-width="${strokeW.toFixed(2)}" />`;
      }
      const sx = (b.wrapX || 0) * lx;
      const sy = (b.wrapY || 0) * ly;
      const line1 = `<line x1="${tx(a.x).toFixed(2)}" y1="${ty(a.y).toFixed(2)}" x2="${tx(c.x + sx).toFixed(2)}" y2="${ty(c.y + sy).toFixed(2)}" stroke="#334155" stroke-width="${strokeW.toFixed(2)}" stroke-dasharray="3 3" opacity="0.85" />`;
      const line2 = `<line x1="${tx(c.x).toFixed(2)}" y1="${ty(c.y).toFixed(2)}" x2="${tx(a.x - sx).toFixed(2)}" y2="${ty(a.y - sy).toFixed(2)}" stroke="#334155" stroke-width="${strokeW.toFixed(2)}" stroke-dasharray="3 3" opacity="0.85" />`;
      return line1 + line2;
    }).join('');
    const atomCircles = atoms.map(a => `<circle cx="${tx(a.x).toFixed(2)}" cy="${ty(a.y).toFixed(2)}" r="${r.toFixed(2)}" fill="${color[a.element] || '#999'}" stroke="#22313a" stroke-width="0.7"><title>${a.id} ${a.element} · ${a.material}</title></circle>`).join('');
    const pbc = structure.metadata.periodicMode && structure.metadata.periodicMode !== 'none'
      ? `<text x="${pad}" y="${height - 8}" fill="#111827" font-size="12" font-family="system-ui, sans-serif">PBC ${structure.metadata.periodicMode.toUpperCase()}: enlaces de frontera en línea punteada</text>`
      : '';
    const val = structure.validation && structure.validation.warnings && structure.validation.warnings.length
      ? `<text x="${width - pad}" y="${height - 8}" text-anchor="end" fill="#7f1d1d" font-size="12" font-family="system-ui, sans-serif">Validación: revisar avisos</text>`
      : `<text x="${width - pad}" y="${height - 8}" text-anchor="end" fill="#14532d" font-size="12" font-family="system-ui, sans-serif">Validación geométrica OK</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Coherent hBN and carbon honeycomb lattice"><rect width="100%" height="100%" fill="#d7d7d7"/>${bondLines}${atomCircles}${pbc}${val}</svg>`;
  }

  /**
   * [REGISTRO-DOC-SG056] Genera las opciones HTML del selector de presets.
   * @returns {string}
   */
  function presetOptionsHTML() {
    return Object.keys(PRESETS).map(k => `<option value="${k}">${PRESETS[k].label}</option>`).join('');
  }

  /**
   * [REGISTRO-DOC-SG057] Construye el panel interactivo del constructor, enlaza controles, vista previa, exportación y carga al simulador.
   * @param {*} container
   * @returns {HTMLElement}
   */
  function createPanel(container) {
    const root = typeof container === 'string' ? document.querySelector(container) : (container || document.body);
    const panel = document.createElement('section');
    panel.className = 'hbnc-band-generator-panel';
    panel.innerHTML = `
      <style>
        .hbnc-band-generator-panel{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:14px;padding:14px;margin:12px 0;box-shadow:0 10px 24px rgba(0,0,0,.18)}
        .hbnc-band-generator-panel h3{margin:0 0 8px;font-size:17px;color:#fff}.hbnc-band-generator-panel p{margin:4px 0 10px;color:#cbd5e1;font-size:13px;line-height:1.4}
        .hbnc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:10px}.hbnc-field label{display:block;font-size:12px;color:#cbd5e1;margin-bottom:4px}.hbnc-field input,.hbnc-field select{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid #4b5563;background:#0b1220;color:#f8fafc;padding:8px}
        .hbnc-buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.hbnc-buttons button{border:0;border-radius:10px;padding:9px 12px;background:#2563eb;color:white;cursor:pointer;font-weight:600}.hbnc-buttons button.secondary{background:#374151}.hbnc-buttons button.warn{background:#b45309}.hbnc-buttons button:hover{filter:brightness(1.08)}
        .hbnc-preview{background:#d7d7d7;border-radius:12px;margin-top:12px;overflow:auto}.hbnc-stats{font-size:12px;color:#d1d5db;margin-top:8px;white-space:pre-wrap;line-height:1.45}.hbnc-ok{color:#86efac}.hbnc-warn{color:#fbbf24}
      </style>
      <h3>Constructor físico de estructuras hBN/C</h3>
      <p>Genera dominios hBN y carbono sobre la misma red honeycomb. No dibuja átomos a mano: usa celdas completas, subred B/N coherente, control de periodicidad y validación de enlaces.</p>
      <div class="hbnc-grid">
        <div class="hbnc-field"><label>Preset estructural</label><select data-k="preset">${presetOptionsHTML()}</select></div>
        <div class="hbnc-field"><label>Ancho en celdas</label><input data-k="widthCells" type="number" min="1" value="${DEFAULTS.widthCells}"></div>
        <div class="hbnc-field"><label>Alto en celdas</label><input data-k="heightCells" type="number" min="1" value="${DEFAULTS.heightCells}"></div>
        <div class="hbnc-field"><label>Patrón de dominios</label><input data-k="pattern" value="${DEFAULTS.pattern.join(',')}" title="Ejemplo: hBN,C,hBN o C,hBN,C"></div>
        <div class="hbnc-field"><label>Espesores en celdas</label><input data-k="bandCells" value="${DEFAULTS.bandCells.join(',')}" title="Ejemplo: 4,8,4"></div>
        <div class="hbnc-field"><label>Repetir patrón</label><select data-k="repeatPattern"><option value="false" selected>No, estructura finita</option><option value="true">Sí, patrón periódico</option></select></div>
        <div class="hbnc-field"><label>Orientación de dominios</label><select data-k="orientation"><option value="horizontal">Horizontal: arriba/abajo</option><option value="vertical">Vertical: izquierda/derecha</option></select></div>
        <div class="hbnc-field"><label>Dirección visual</label><select data-k="patternDirection"><option value="top-down">Arriba → abajo</option><option value="bottom-up">Abajo → arriba</option><option value="left-right">Izquierda → derecha</option><option value="right-left">Derecha → izquierda</option></select></div>
        <div class="hbnc-field"><label>Tipo de borde/celda</label><select data-k="edgeMode"><option value="rectangular">Rectangular, bordes rectos</option><option value="primitive">Primitiva, corte oblicuo</option></select></div>
        <div class="hbnc-field"><label>Periodicidad física</label><select data-k="periodicMode"><option value="none">Abierta / nanocinta</option><option value="x">Periódica en X</option><option value="y">Periódica en Y</option><option value="xy">Periódica en X e Y</option></select></div>
        <div class="hbnc-field"><label>Modo exacto PBC-X</label><select data-k="xPeriodicExactMode"><option value="false">No, comportamiento estándar</option><option value="true">Sí, conservar N átomos y ajustar solo la terminación visible</option></select></div>
        <div class="hbnc-field"><label>Familia real de borde/red</label><select data-k="simulatorOrient"><option value="AC">Armchair (AC)</option><option value="ZZ">Zigzag (ZZ)</option><option value="AUTO">Auto detectar al cargar</option></select></div>
        <div class="hbnc-field"><label>Fase / terminación de borde inicial</label><select data-k="startEdgePhase"><option value="A">A — dímero completo (no recorta átomos)</option><option value="B">B — recorte media celda (puede quitar 1 átomo)</option></select></div>
        <div class="hbnc-field"><label>Terminación visible hBN</label><select data-k="terminalBN"><option value="auto">Automática / según subred</option><option value="B">Forzar extremos B — verde, referencia</option><option value="N">Forzar extremos N — azul</option></select></div>
        <div class="hbnc-field"><label>Pasivar bordes con H al cargar</label><select data-k="passivateEdges"><option value="false">No</option><option value="true">Sí</option></select></div>
        <div class="hbnc-field"><label>Enlace B–N/C–C aproximado (Å)</label><input data-k="bondLength" type="number" step="0.01" value="${DEFAULTS.bondLength}"></div>
        <div class="hbnc-field"><label>Subred hBN</label><select data-k="invertBN"><option value="false">A=B, B=N</option><option value="true">A=N, B=B</option></select></div>
        <div class="hbnc-field"><label>Simetría espejo B/N</label><select data-k="mirrorBN"><option value="false">No, fase translacional</option><option value="true">Sí, palindrómica</option></select></div>
        <div class="hbnc-field"><label>Recorte exacto por átomo</label><select data-k="exact"><option value="false" selected>No, usar celdas completas</option><option value="true">Sí, solo para vista/exportación</option></select></div>
        <div class="hbnc-field"><label>Número objetivo si recortas</label><input data-k="targetAtoms" type="number" min="2" value="${DEFAULTS.targetAtoms}"></div>
      </div>
      <div class="hbnc-buttons">
        <button data-action="generate">Generar vista previa</button>
        <button data-action="apply">Cargar en simulador</button>
        <button class="secondary" data-action="xyz">Descargar XYZ</button>
        <button class="secondary" data-action="lammps">Descargar LAMMPS DATA</button>
        <button class="secondary" data-action="poscar">Descargar POSCAR</button>
        <button class="secondary" data-action="json">Descargar JSON</button>
        <button class="secondary" data-action="svg">Descargar SVG</button>
      </div>
      <div class="hbnc-stats" data-role="stats"></div>
      <div class="hbnc-preview" data-role="preview"></div>
    `;
    root.appendChild(panel);
    let current = null;

    /**
     * [REGISTRO-DOC-SG058] Obtiene un control del panel mediante su atributo data-k.
     * @param {*} k
     * @returns {HTMLElement|null}
     */
    const getField = k => panel.querySelector(`[data-k="${k}"]`);
    /**
     * [REGISTRO-DOC-SG059] Actualiza el valor de un control del panel si existe.
     * @param {*} k
     * @param {*} v
     */
    const setField = (k, v) => {
      const el = getField(k);
      if (!el || typeof v === 'undefined') return;
      el.value = Array.isArray(v) ? v.join(',') : String(v);
    };
    /**
     * [REGISTRO-DOC-SG060] Lee y normaliza las opciones actuales introducidas en el panel.
     * @returns {Object}
     */
    const readOptions = () => ({
      preset: getField('preset').value,
      targetAtoms: Number(getField('targetAtoms').value),
      widthCells: Number(getField('widthCells').value),
      heightCells: Number(getField('heightCells').value),
      bandCells: getField('bandCells').value,
      pattern: getField('pattern').value,
      repeatPattern: getField('repeatPattern').value === 'true',
      orientation: getField('orientation').value,
      bondLength: Number(getField('bondLength').value),
      exact: getField('exact').value === 'true',
      invertBN: getField('invertBN').value === 'true',
      mirrorBN: getField('mirrorBN').value === 'true',
      edgeMode: getField('edgeMode').value,
      patternDirection: getField('patternDirection').value,
      periodicMode: getField('periodicMode').value,
      passivateEdges: getField('passivateEdges').value === 'true',
      simulatorOrient: getField('simulatorOrient').value,
      startEdgePhase: getField('startEdgePhase').value,
      terminalBN: getField('terminalBN').value,
      xPeriodicExactMode: getField('xPeriodicExactMode').value === 'true'
    });

    /**
     * [REGISTRO-DOC-SG061] Carga los valores de un preset seleccionado en los controles del panel.
     * @param {*} name
     */
    const applyPresetToFields = (name) => {
      setField('preset', name);
      const p = clonePreset(name);
      if (!p || name === 'manual') { updatePreview(); return; }
      ['widthCells', 'heightCells', 'pattern', 'bandCells', 'repeatPattern', 'orientation', 'edgeMode', 'patternDirection', 'periodicMode', 'passivateEdges', 'simulatorOrient', 'startEdgePhase', 'terminalBN', 'xPeriodicExactMode'].forEach(k => setField(k, p[k]));
      setField('mirrorBN', typeof p.mirrorBN === 'undefined' ? false : p.mirrorBN);
      setField('exact', typeof p.exact === 'undefined' ? false : p.exact);
      updatePreview();
    };

    /**
     * [REGISTRO-DOC-SG062] Regenera la estructura actual y actualiza la vista previa, validación y resumen del panel.
     */
    const updatePreview = () => {
      current = generateAlternatingBands(readOptions());
      panel.querySelector('[data-role="preview"]').innerHTML = createSVG(current, { width: 900, height: 470 });
      const v = current.validation || {};
      const h = v.degreeHistogram || {};
      const warningText = current.metadata.warnings && current.metadata.warnings.length
        ? `\nAvisos:\n- ${current.metadata.warnings.join('\n- ')}`
        : '\nValidación: sin avisos críticos.';
      panel.querySelector('[data-role="stats"]').textContent =
        `Preset: ${current.metadata.presetLabel}\n` +
        `Átomos: ${current.atoms.length} | B=${current.counts.B || 0}, N=${current.counts.N || 0}, C=${current.counts.C || 0}\n` +
        `Celdas: ${current.metadata.widthCells} × ${current.metadata.heightCells} | Malla simulador: ${current.grid.Nx} × ${current.grid.Ny}\n` +
        `Enlaces 1er vecino: ${current.bonds.length} | PBC frontera: ${current.metadata.periodicBoundaryBonds || 0} | Enlace medio: ${(v.avgBond || 0).toFixed(4)} Å | Desv. máx.: ${(v.maxBondDeviationPct || 0).toFixed(2)}%\n` +
        `Coordinación: grado0=${h[0] || 0}, grado1=${h[1] || 0}, grado2=${h[2] || 0}, grado3=${h[3] || 0}, >3=${h.over3 || 0}\n` +
        `Enlaces: B–N=${v.bondsByType ? v.bondsByType.BN : 0}, C–C=${v.bondsByType ? v.bondsByType.CC : 0}, C–B=${v.bondsByType ? v.bondsByType.CB : 0}, C–N=${v.bondsByType ? v.bondsByType.CN : 0}, B–B=${v.bondsByType ? v.bondsByType.BB : 0}, N–N=${v.bondsByType ? v.bondsByType.NN : 0}\n` +
        `Patrón: ${current.metadata.pattern.join(' / ')} | Espesores: ${current.metadata.bandCells.join(' / ')} | Orientación dominios: ${current.metadata.orientation} | Red real: ${current.metadata.edgeFamily || current.metadata.simulatorOrient}${current.metadata.simulatorOrient === 'AUTO' ? ' (AUTO→ZZ en la geometría)' : ''} | PBC: ${current.metadata.periodicMode} | Modo exacto PBC-X: ${current.metadata.xPeriodicExactMode ? 'sí' : 'no'} | Espejo B/N: ${current.metadata.mirrorBN ? 'sí' : 'no'} | Terminación hBN: ${current.metadata.terminalBN === 'auto' ? 'auto' : current.metadata.terminalBN} | Pasivación H: ${current.metadata.passivateEdges ? 'sí' : 'no'}` +
        warningText;
      global.HBNCBandGenerator.lastStructure = current;
      return current;
    };

    getField('preset').addEventListener('change', ev => applyPresetToFields(ev.target.value));
    panel.addEventListener('input', ev => {
      if (ev.target && ev.target.getAttribute('data-k') && ev.target.getAttribute('data-k') !== 'preset') {
        setField('preset', 'manual');
      }
    });
    panel.addEventListener('click', ev => {
      const action = ev.target && ev.target.getAttribute('data-action');
      if (!action) return;
      if (!current || action === 'generate') updatePreview();
      if (action === 'apply') {
        applyToSimulator(current);
        return;
      }
      const safePreset = String(current.metadata.preset || 'estructura').replace(/[^a-z0-9_-]+/gi, '_');
      const base = `hbn_carbono_${safePreset}_${current.atoms.length}_atomos`;
      if (action === 'xyz') downloadText(`${base}.xyz`, makeXYZ(current));
      if (action === 'lammps') downloadText(`${base}.data`, makeLAMMPSData(current));
      if (action === 'poscar') downloadText(`${base}.vasp`, makePOSCAR(current));
      if (action === 'json') downloadText(`${base}.json`, makeJSON(current), 'application/json');
      if (action === 'svg') downloadText(`${base}.svg`, createSVG(current), 'image/svg+xml');
    });

    applyPresetToFields('sandwich-y');
    return panel;
  }

  /**
   * [REGISTRO-DOC-SG063] Transfiere una estructura generada al estado global del simulador, reconstruye topología y actualiza la interfaz.
   * @param {*} structure
   * @returns {boolean}
   */
  function applyToSimulator(structure) {
    if (!structure || !structure.atoms || !structure.atoms.length) {
      alert('Primero genera una estructura.');
      return false;
    }
    if (typeof N_T === 'undefined' || typeof B_T === 'undefined' || typeof C_T === 'undefined') {
      alert('No se encontraron las constantes del simulador principal.');
      return false;
    }

    const sim = chooseSimulatorMapping(structure);
    const nx = sim.nx || sim.Nx;
    const ny = sim.ny || sim.Ny;
    const grid = new Uint8Array(sim.grid);
    const mapped = sim.mapped || structure.atoms.length;
    const chosenOrient = String(sim.orient || structure.metadata.simulatorOrient || 'AC').toUpperCase();

    Nx = nx;
    Ny = ny;
    latticeOrient = chosenOrient;
    IMPORTED_GRID = new Uint8Array(grid);
    IMPORTED_META = {
      filename: 'constructor_hbn_carbono',
      format: 'INTERNAL_STRUCTURE_BUILDER',
      importedAt: new Date().toISOString(),
      atoms: structure.atoms.length,
      nonH: mapped,
      H: 0,
      score: Number.isFinite(sim.score) ? sim.score : 0,
      Nx: nx,
      Ny: ny,
      orient: chosenOrient,
      method: sim.method || `coherent-builder-${chosenOrient}`,
      customGeometry: sim.method === 'explicit-constructor-graph',
      explicitBonds: structure.bonds ? structure.bonds.length : 0,
      explicitH: Array.isArray(sim.importedHSites) ? sim.importedHSites.length : 0,
      pbcLockedToConstructor: sim.method === 'explicit-constructor-graph',
      generator: structure.metadata,
      validation: structure.validation
    };
    G = new Uint8Array(grid);
    if (typeof CUSTOM_PNB !== 'undefined') CUSTOM_PNB = Array.isArray(sim.customPNB) ? sim.customPNB : null;
    if (typeof CUSTOM_POSITIONS !== 'undefined') CUSTOM_POSITIONS = Array.isArray(sim.customPositions) ? sim.customPositions : null;
    if (typeof CUSTOM_OPEN_VALENCE !== 'undefined') CUSTOM_OPEN_VALENCE = Array.isArray(sim.customOpenValence) ? sim.customOpenValence : null;
    if (typeof IMPORTED_H_SITES !== 'undefined') IMPORTED_H_SITES = Array.isArray(sim.importedHSites) ? sim.importedHSites.slice() : [];
    hPass = Boolean(structure.metadata.passivateEdges);
    ready = false;

    /**
     * [REGISTRO-DOC-SG064] Actualiza el valor de un control del simulador principal por id.
     * @param {*} id
     * @param {*} v
     */
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    /**
     * [REGISTRO-DOC-SG065] Actualiza el texto visible de un elemento del simulador principal por id.
     * @param {*} id
     * @param {*} v
     */
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    // [FIX v13.9] iNx/iNy son <input type="range" min="2" max="48">. Escribir
    // directamente nx/ny (p.ej. nx=1, ny=384 para un grafo explícito del
    // Constructor) hace que el navegador clampe el valor en silencio
    // (ny=384 → 48), lo que luego corrompe Nx*Ny cuando initParams()/init()
    // vuelven a leer el slider. Por eso: se amplían min/max para que el
    // valor real quepa sin clamping, y se deshabilitan mientras la
    // geometría personalizada esté activa (no tiene sentido arrastrarlos:
    // el tamaño lo define el Constructor hBN/C, no este panel).
    /**
     * [REGISTRO-DOC-SG066] Ajusta y bloquea un slider Nx/Ny para representar exactamente las dimensiones de la geometría personalizada.
     * @param {*} id
     * @param {*} v
     */
    const lockRangeToCustomDims = (id, v) => {
      const el = document.getElementById(id);
      if (!el) return;
      const num = Number(v) || 0;
      if (num < Number(el.min)) el.min = String(num);
      if (num > Number(el.max)) el.max = String(num);
      el.value = num;
      el.disabled = true;
      el.title = 'Fijado por el Constructor hBN/C (geometría personalizada). Genera una red nueva en PASO 1 para volver a editar Nx/Ny.';
    };
    lockRangeToCustomDims('iNx', nx); setTxt('lNx', nx);
    lockRangeToCustomDims('iNy', ny); setTxt('lNy', ny);
    setTxt('lAt', nx * ny);
    setVal('iPore', 99);
    setVal('iOrient', chosenOrient);
    setVal('iH', hPass ? '1' : '0');
    setVal('iImportedMCPolicy', 'auto');
    if (typeof importedMCPolicy !== 'undefined') importedMCPolicy = 'auto';
    setVal('iGlobal', 0);
    if (typeof globalSwapPct !== 'undefined') globalSwapPct = 0;
    const lGlobal = document.getElementById('lGlobal');
    if (lGlobal) lGlobal.textContent = '0%';
    const importedRow = document.getElementById('importedMCPolicyRow');
    if (importedRow) importedRow.style.display = '';
    const vac = document.getElementById('iVac');
    if (vac) { vac.min = '0'; vac.value = '0'; }
    setTxt('lVac', '0%');

    const pm = String(structure.metadata.periodicMode || 'none').toUpperCase();
    const pbcValue = ['XY', 'X', 'Y'].includes(pm) ? pm : 'none';
    pbcX = (pbcValue === 'XY' || pbcValue === 'X');
    pbcY = (pbcValue === 'XY' || pbcValue === 'Y');
    setVal('iPBC', pbcValue);

    if (typeof buildPhysNB === 'function') buildPhysNB();
    if (typeof buildScreenPos === 'function') buildScreenPos();
    ready = true;
    if (typeof calcFullE === 'function') E = calcFullE();
    if (typeof recalcEnergyReference === 'function') recalcEnergyReference();
    if (typeof clearLiveRunStats === 'function') clearLiveRunStats();
    if (Array.isArray(hE)) {
      hE.length = 0; hT.length = 0; hA.length = 0; hBN.length = 0;
      hE.push(E || 0);
      hT.push(T || Ti || 0);
      hA.push(0);
      hBN.push(typeof countBonds === 'function' ? countBonds().cNB : 0);
    }
    if (typeof saveInitialConfig === 'function') saveInitialConfig();
    if (typeof ui === 'function') ui();
    if (typeof draw === 'function') draw();
    if (typeof addLog === 'function') {
      const counts = typeof getSpeciesCounts === 'function' ? getSpeciesCounts() : null;
      addLog(`Constructor hBN/C cargado ✓ ${nx}×${ny} · átomos=${mapped} · enlaces=${structure.bonds ? structure.bonds.length : 0} · red=${chosenOrient} · método=${sim.method || 'mapeo'} · PBC=${pbcValue} · H=${hPass ? 'sí' : 'no'}`, 'g');
      addLog('MC importado en modo robusto: permite B↔N y migración de vacancias sin mezclar C↔B/N directamente. Usa “Conservar” para cálculo estático.', 'w');
      if (counts) addLog(`Composición: N=${counts.nN} · B=${counts.nB} · C=${counts.nC} · V=${counts.nV}`, 'i');
      if (structure.metadata.warnings && structure.metadata.warnings.length) addLog(`Avisos del constructor: ${structure.metadata.warnings.join(' | ')}`, 'w');
    }
    return true;
  }

  /**
   * [REGISTRO-DOC-SG067] Abre o crea el diálogo modal del Constructor hBN/C.
   * @returns {HTMLElement}
   */
  function openDialog() {
    let overlay = document.getElementById('hbncBandGeneratorOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      return overlay;
    }
    overlay = document.createElement('div');
    overlay.id = 'hbncBandGeneratorOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:18px;';
    const box = document.createElement('div');
    box.style.cssText = 'width:min(1220px,96vw);max-height:92vh;overflow:auto;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.35);';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '✕ Cerrar';
    close.style.cssText = 'position:sticky;top:8px;float:right;z-index:2;margin:8px;border:0;border-radius:999px;background:#ef4444;color:#fff;font-weight:800;padding:8px 12px;cursor:pointer;';
    close.onclick = () => { overlay.style.display = 'none'; };
    box.appendChild(close);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    createPanel(box);
    overlay.addEventListener('click', ev => {
      if (ev.target === overlay) overlay.style.display = 'none';
    });
    return overlay;
  }

  global.HBNCBandGenerator = {
    defaults: DEFAULTS,
    presets: PRESETS,
    generateAlternatingBands,
    buildBonds,
    computeBox,
    buildExplicitHydrogenSites,
    validateStructure,
    chooseSimulatorMapping,
    makeXYZ,
    makePOSCAR,
    makeLAMMPSData,
    makeJSON,
    createSVG,
    createPanel,
    openDialog,
    applyToSimulator,
    downloadText,
    lastStructure: null
  };

  if (global.__HBNC_ADDON_AUTO_PANEL) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => createPanel());
    } else {
      createPanel();
    }
  }
})(window);
