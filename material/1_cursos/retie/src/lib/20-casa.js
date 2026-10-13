/* ===================================================================
   lib/20-casa.js — Modelo único de la casa ejemplo
   Vivienda de un piso en Popayán (≈ 1 760 m s. n. m.), 8,0 m × 10,0 m entre
   ejes, seis ambientes y un hall. Pórticos de concreto (columnas 0,30 × 0,30,
   vigas 0,30 × 0,35, losa maciza de 0,12 m), muros de mampostería de 0,15 m.
   Todas las coordenadas en metros: x hacia el oriente, y hacia el norte,
   origen en el eje de la esquina suroccidental; z desde el nivel de piso
   terminado (NPT 0,00). La fachada principal da al sur (y = 0).
   De este objeto salen la planta, el modelo 3D, las cantidades, el cuadro de
   cargas, el unifilar, la revisión de interferencias y los archivos DXF.
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});

  const T = 0.15;          /* espesor de muros */
  const F = T / 2;         /* desfase de la cara del muro respecto al eje */
  const H = { piso: 0, fondoLosa: 2.5, losa: 0.12, viga: 0.35, puerta: 2.1, cim: 0.3, contrapiso: 0.08 };
  H.topeLosa = H.fondoLosa + H.losa;          /* 2,62 */
  H.fondoViga = H.topeLosa - H.viga;          /* 2,27 */
  H.zLosa = H.fondoLosa + H.losa / 2;         /* nivel de tubería embebida en la losa */
  H.zPiso = -H.contrapiso / 2;                /* nivel de tubería en el contrapiso */

  const CASA = {
    nombre: 'Casa ejemplo · vivienda de un piso en Popayán',
    lugar: 'Popayán, Cauca · 1 760 m s. n. m.',
    t: T, H,
    ejes: { x: [0, 4.8, 8.0], y: [0, 5.6, 10.0], nx: ['A', 'B', 'C'], ny: ['1', '2', '3'] },
    ext: [0, 0, 8, 10],
    ambientes: [
      { id: 'sala', nombre: 'Sala-comedor', poly: [[0, 0], [4.8, 0], [4.8, 5.6], [0, 5.6]], uso: 'social' },
      { id: 'cocina', nombre: 'Cocina', poly: [[0, 5.6], [4.8, 5.6], [4.8, 8.0], [0, 8.0]], uso: 'servicio', humedo: true },
      { id: 'ropas', nombre: 'Patio de ropas', poly: [[0, 8.0], [4.8, 8.0], [4.8, 10], [0, 10]], uso: 'servicio', humedo: true },
      { id: 'alc2', nombre: 'Alcoba 2', poly: [[4.8, 0], [8, 0], [8, 3.6], [4.8, 3.6]], uso: 'privado' },
      { id: 'hall', nombre: 'Hall', poly: [[4.8, 3.6], [6.0, 3.6], [6.0, 6.4], [4.8, 6.4]], uso: 'circulación' },
      { id: 'bano', nombre: 'Baño', poly: [[6.0, 3.6], [8, 3.6], [8, 6.4], [6.0, 6.4]], uso: 'privado', humedo: true },
      { id: 'alc1', nombre: 'Alcoba principal', poly: [[4.8, 6.4], [8, 6.4], [8, 10], [4.8, 10]], uso: 'privado' }
    ],
    /* Muros por su eje. Vanos: d0–d1 medidos desde el punto a; z0–z1 alturas.
       lado: +1 abre hacia la izquierda del sentido a→b, −1 hacia la derecha (puertas). */
    muros: [
      { id: 'M-S', a: [0, 0], b: [8, 0], ext: true, vanos: [
        { id: 'P1', tipo: 'puerta', d0: 1.0, d1: 1.9, z0: 0, z1: 2.1, lado: 1, bisagra: 0 },
        { id: 'V1', tipo: 'ventana', d0: 2.5, d1: 4.1, z0: 1.0, z1: 2.1 },
        { id: 'V2', tipo: 'ventana', d0: 5.8, d1: 7.2, z0: 1.0, z1: 2.1 }] },
      { id: 'M-E', a: [8, 0], b: [8, 10], ext: true, vanos: [
        { id: 'V3', tipo: 'ventana', d0: 4.9, d1: 5.5, z0: 1.6, z1: 2.1 },
        { id: 'V4', tipo: 'ventana', d0: 7.4, d1: 8.8, z0: 1.0, z1: 2.1 }] },
      { id: 'M-N', a: [0, 10], b: [8, 10], ext: true, vanos: [
        { id: 'V5', tipo: 'ventana', d0: 1.8, d1: 3.0, z0: 1.2, z1: 2.1 }] },
      { id: 'M-O', a: [0, 0], b: [0, 10], ext: true, vanos: [
        { id: 'V6', tipo: 'ventana', d0: 2.2, d1: 3.8, z0: 1.0, z1: 2.1 },
        { id: 'V7', tipo: 'ventana', d0: 6.4, d1: 7.6, z0: 1.2, z1: 2.1 },
        { id: 'P6', tipo: 'puerta', d0: 8.2, d1: 9.0, z0: 0, z1: 2.1, lado: -1, bisagra: 1 }] },
      { id: 'M1', a: [0, 5.6], b: [4.8, 5.6], vanos: [{ id: 'VA1', tipo: 'vano', d0: 2.0, d1: 3.6, z0: 0, z1: 2.1 }] },
      { id: 'M2', a: [0, 8.0], b: [4.8, 8.0], vanos: [{ id: 'P2', tipo: 'puerta', d0: 3.6, d1: 4.4, z0: 0, z1: 2.1, lado: 1, bisagra: 1 }] },
      { id: 'M3', a: [4.8, 0], b: [4.8, 10], vanos: [{ id: 'VA2', tipo: 'vano', d0: 3.8, d1: 4.8, z0: 0, z1: 2.1 }] },
      { id: 'M4', a: [4.8, 3.6], b: [8, 3.6], vanos: [{ id: 'P3', tipo: 'puerta', d0: 0.2, d1: 1.0, z0: 0, z1: 2.1, lado: -1, bisagra: 0 }] },
      { id: 'M5', a: [6.0, 3.6], b: [6.0, 6.4], vanos: [{ id: 'P4', tipo: 'puerta', d0: 0.7, d1: 1.45, z0: 0, z1: 2.1, lado: -1, bisagra: 0 }] },
      { id: 'M6', a: [4.8, 6.4], b: [8, 6.4], vanos: [{ id: 'P5', tipo: 'puerta', d0: 0.2, d1: 1.0, z0: 0, z1: 2.1, lado: 1, bisagra: 0 }] }
    ],
    estructura: {
      col: 0.30, viga: { b: 0.30, h: 0.35 }, cim: { b: 0.30, h: 0.30 }, losa: 0.12,
      descripcion: 'Pórticos de concreto reforzado en dos direcciones, losa maciza de 0,12 m, vigas descolgadas de 0,30 × 0,35 m y vigas de cimentación de 0,30 × 0,30 m en todos los ejes.'
    },
    /* Mobiliario y aparatos sanitarios (para ubicar puntos y zonas húmedas) */
    muebles: [
      { id: 'meson-o', tipo: 'meson', rect: [F, 6.2, 0.675, 10 - 2 - F], amb: 'cocina' },
      { id: 'meson-n', tipo: 'meson', rect: [0.675, 8 - F - 0.6, 2.7, 8 - F], amb: 'cocina' },
      { id: 'estufa', tipo: 'estufa', rect: [F + 0.02, 6.5, 0.655, 7.1], amb: 'cocina' },
      { id: 'lavaplatos', tipo: 'lavaplatos', rect: [1.5, 7.45, 2.0, 7.85], amb: 'cocina' },
      { id: 'nevera', tipo: 'nevera', rect: [2.85, 7.225, 3.55, 8 - F], amb: 'cocina' },
      { id: 'lavadero', tipo: 'lavadero', rect: [F, 9.225, 0.875, 10 - F], amb: 'ropas' },
      { id: 'lavadora', tipo: 'lavadora', rect: [0.95, 9.25, 1.65, 10 - F], amb: 'ropas' },
      { id: 'ducha', tipo: 'ducha', rect: [7.0, 3.6 + F, 8 - F, 4.6], amb: 'bano' },
      { id: 'lavamanos', tipo: 'lavamanos', rect: [6.9, 5.9, 7.4, 6.4 - F], amb: 'bano' },
      { id: 'sanitario', tipo: 'sanitario', rect: [7.45, 4.95, 8 - F, 5.45], amb: 'bano' },
      { id: 'cama2', tipo: 'cama', rect: [6.2, 0.6, 7.9, 2.6], amb: 'alc2' },
      { id: 'cama1', tipo: 'cama', rect: [6.1, 7.4, 7.9, 9.4], amb: 'alc1' },
      { id: 'sofa', tipo: 'sofa', rect: [0.4, 0.7, 0.95, 2.9], amb: 'sala' },
      { id: 'comedor', tipo: 'mesa', rect: [1.7, 3.8, 3.1, 4.8], amb: 'sala' }
    ],
    /* ---------------- Instalación eléctrica ---------------- */
    electrico: {
      sistema: '1F3H-240/120',
      tension: 'Monofásico trifilar 120/240 V, 60 Hz',
      operador: 'Operador de red de la zona (en el Cauca, la Compañía Energética de Occidente)',
      acometida: { tipo: 'Aérea en cable concéntrico de cobre', calibre: '6', desde: [1.2, -7], hasta: [0.5, -F] },
      medidor: { id: 'MED', x: 0.5, y: -F, z: 1.6, muro: 'M-S' },
      tablero: { id: 'TG', x: 6.0 - F, y: 3.95, z: 1.6, muro: 'M5', espacios: 12, totalizador: { In: 60, polos: 2 }, frente: [-1, 0] },
      alimentador: { calibre: '6', tierra: '8', tubo: '1', desc: '2 × 6 AWG (fases) + 1 × 6 AWG (neutro) THHN/THWN-2, tubo PVC de 1 in por el contrapiso' },
      tierra: { id: 'SPT', x: 0.9, y: -0.9, varillas: [[0.9, -0.9], [3.3, -0.9]], L: 2.4, d: 15.9, conductor: '8', caja: 0.3 },
      puntos: [
        /* Alumbrado (C1): luminarias LED de techo y apliques */
        { id: 'LS1', tipo: 'lum', x: 1.5, y: 2.2, z: 2.5, amb: 'sala', c: 'C1', s: 'S1a', W: 24, lm: 2400 },
        { id: 'LS2', tipo: 'lum', x: 3.3, y: 2.2, z: 2.5, amb: 'sala', c: 'C1', s: 'S1a', W: 24, lm: 2400 },
        { id: 'LF', tipo: 'aplique', x: 2.15, y: -F, z: 2.2, amb: 'exterior', c: 'C1', s: 'S1b', W: 10, lm: 800, muro: 'M-S', ext: true },
        { id: 'LC', tipo: 'lum', x: 2.4, y: 4.4, z: 2.5, amb: 'sala', c: 'C1', s: 'S2', W: 24, lm: 2400 },
        { id: 'LK1', tipo: 'lum', x: 1.6, y: 6.8, z: 2.5, amb: 'cocina', c: 'C1', s: 'S3', W: 24, lm: 2400 },
        { id: 'LK2', tipo: 'lum', x: 3.4, y: 6.8, z: 2.5, amb: 'cocina', c: 'C1', s: 'S3', W: 24, lm: 2400 },
        { id: 'LR', tipo: 'lum', x: 2.4, y: 9.0, z: 2.5, amb: 'ropas', c: 'C1', s: 'S4a', W: 24, lm: 2400 },
        { id: 'LP', tipo: 'aplique', x: -F, y: 8.6, z: 2.2, amb: 'exterior', c: 'C1', s: 'S4b', W: 10, lm: 800, muro: 'M-O', ext: true },
        { id: 'LH', tipo: 'lum', x: 5.4, y: 5.0, z: 2.5, amb: 'hall', c: 'C1', s: 'S5', W: 10, lm: 900 },
        { id: 'LB', tipo: 'lum', x: 6.95, y: 5.0, z: 2.5, amb: 'bano', c: 'C1', s: 'S7', W: 20, lm: 2000 },
        { id: 'LA2', tipo: 'lum', x: 6.4, y: 1.8, z: 2.5, amb: 'alc2', c: 'C1', s: 'S8', W: 24, lm: 2400 },
        { id: 'LA1', tipo: 'lum', x: 6.4, y: 8.2, z: 2.5, amb: 'alc1', c: 'C1', s: 'S9', W: 24, lm: 2400 },
        /* Interruptores (z = 1,20 m) */
        { id: 'S1', tipo: 'int2', x: 2.1, y: F, z: 1.2, amb: 'sala', c: 'C1', ctrl: ['S1a', 'S1b'], muro: 'M-S' },
        { id: 'S2', tipo: 'int', x: 1.85, y: 5.6 - F, z: 1.2, amb: 'sala', c: 'C1', ctrl: ['S2'], muro: 'M1' },
        { id: 'S3', tipo: 'int', x: 3.75, y: 5.6 + F, z: 1.2, amb: 'cocina', c: 'C1', ctrl: ['S3'], muro: 'M1' },
        { id: 'S4', tipo: 'int2', x: 3.45, y: 8 + F, z: 1.2, amb: 'ropas', c: 'C1', ctrl: ['S4a', 'S4b'], muro: 'M2' },
        { id: 'S5', tipo: 'conm', x: 4.8 - F, y: 3.45, z: 1.2, amb: 'sala', c: 'C1', ctrl: ['S5'], par: 'S6', muro: 'M3' },
        { id: 'S6', tipo: 'conm', x: 6.0 - F, y: 6.05, z: 1.2, amb: 'hall', c: 'C1', ctrl: ['S5'], par: 'S5', muro: 'M5' },
        { id: 'S7', tipo: 'int', x: 6.0 + F, y: 5.25, z: 1.2, amb: 'bano', c: 'C1', ctrl: ['S7'], muro: 'M5' },
        { id: 'S8', tipo: 'int', x: 5.95, y: 3.6 - F, z: 1.2, amb: 'alc2', c: 'C1', ctrl: ['S8'], muro: 'M4' },
        { id: 'S9', tipo: 'int', x: 5.95, y: 6.4 + F, z: 1.2, amb: 'alc1', c: 'C1', ctrl: ['S9'], muro: 'M6' },
        /* Tomacorrientes generales (z = 0,30 m), dobles con polo a tierra, 15 A 125 V */
        { id: 'TS1', tipo: 'toma', x: F, y: 0.9, z: 0.3, amb: 'sala', c: 'C2', muro: 'M-O' },
        { id: 'TS2', tipo: 'toma', x: F, y: 3.6, z: 0.3, amb: 'sala', c: 'C2', muro: 'M-O' },
        { id: 'TS3', tipo: 'toma', x: 3.3, y: F, z: 0.3, amb: 'sala', c: 'C2', muro: 'M-S' },
        { id: 'TS4', tipo: 'toma', x: 4.8 - F, y: 2.2, z: 0.3, amb: 'sala', c: 'C2', muro: 'M3' },
        { id: 'TS5', tipo: 'toma', x: 4.8 - F, y: 5.05, z: 0.3, amb: 'sala', c: 'C2', muro: 'M3', nota: 'Desplazada 0,40 m de la cara de la columna B-2 (conflicto 2)' },
        { id: 'TS6', tipo: 'toma', x: 1.0, y: 5.6 - F, z: 0.3, amb: 'sala', c: 'C2', muro: 'M1' },
        { id: 'TS7', tipo: 'toma', x: 4.1, y: 5.6 - F, z: 0.3, amb: 'sala', c: 'C2', muro: 'M1' },
        { id: 'TE1', tipo: 'toma', x: 3.3, y: -F, z: 0.45, amb: 'exterior', c: 'C2', gfci: true, ip: true, muro: 'M-S', ext: true },
        { id: 'TA21', tipo: 'toma', x: 4.8 + F, y: 2.15, z: 0.3, amb: 'alc2', c: 'C3', muro: 'M3' },
        { id: 'TA22', tipo: 'toma', x: 5.9, y: F, z: 0.3, amb: 'alc2', c: 'C3', muro: 'M-S' },
        { id: 'TA23', tipo: 'toma', x: 8 - F, y: 1.2, z: 0.3, amb: 'alc2', c: 'C3', muro: 'M-E' },
        { id: 'TA24', tipo: 'toma', x: 7.3, y: 3.6 - F, z: 0.3, amb: 'alc2', c: 'C3', muro: 'M4' },
        { id: 'TA11', tipo: 'toma', x: 4.8 + F, y: 7.6, z: 0.3, amb: 'alc1', c: 'C3', muro: 'M3' },
        { id: 'TA12', tipo: 'toma', x: 4.8 + F, y: 9.3, z: 0.3, amb: 'alc1', c: 'C3', muro: 'M3' },
        { id: 'TA13', tipo: 'toma', x: 6.6, y: 10 - F, z: 0.3, amb: 'alc1', c: 'C3', muro: 'M-N' },
        { id: 'TA14', tipo: 'toma', x: 8 - F, y: 9.3, z: 0.3, amb: 'alc1', c: 'C3', muro: 'M-E' },
        { id: 'TA15', tipo: 'toma', x: 7.4, y: 6.4 + F, z: 0.3, amb: 'alc1', c: 'C3', muro: 'M6' },
        { id: 'TE2', tipo: 'toma', x: -F, y: 9.6, z: 0.45, amb: 'exterior', c: 'C3', gfci: true, ip: true, muro: 'M-O', ext: true },
        /* Cocina: mesón (z = 1,10 m) y nevera */
        { id: 'TMa', tipo: 'toma', x: F, y: 6.35, z: 1.1, amb: 'cocina', c: 'C4', gfci: true, meson: true, muro: 'M-O' },
        { id: 'TMb', tipo: 'toma', x: F, y: 7.7, z: 1.1, amb: 'cocina', c: 'C4', gfciCarga: 'TMa', meson: true, muro: 'M-O' },
        { id: 'TMc', tipo: 'toma', x: 0.95, y: 8 - F, z: 1.1, amb: 'cocina', c: 'C4', gfciCarga: 'TMa', meson: true, muro: 'M2' },
        { id: 'TN', tipo: 'toma', x: 3.2, y: 8 - F, z: 0.6, amb: 'cocina', c: 'C5', gfciCarga: 'TK1', muro: 'M2', uso: 'Nevera' },
        { id: 'TMd', tipo: 'toma', x: 2.4, y: 8 - F, z: 1.1, amb: 'cocina', c: 'C5', gfciCarga: 'TK1', meson: true, muro: 'M2' },
        { id: 'TK1', tipo: 'toma', x: 4.8 - F, y: 6.25, z: 0.3, amb: 'cocina', c: 'C5', gfci: true, muro: 'M3' },
        { id: 'TK3', tipo: 'toma', x: 4.8 - F, y: 7.6, z: 0.3, amb: 'cocina', c: 'C5', gfciCarga: 'TK1', muro: 'M3' },
        { id: 'TK2', tipo: 'toma', x: 1.0, y: 5.6 + F, z: 0.3, amb: 'cocina', c: 'C5', gfciCarga: 'TK1', muro: 'M1' },
        /* Patio de ropas */
        { id: 'TP', tipo: 'toma', x: 4.8 - F, y: 9.0, z: 1.1, amb: 'ropas', c: 'C6', gfci: true, muro: 'M3', uso: 'Plancha' },
        { id: 'TL', tipo: 'toma', x: 1.3, y: 10 - F, z: 1.1, amb: 'ropas', c: 'C6', gfciCarga: 'TP', muro: 'M-N', uso: 'Lavadora' },
        /* Baño */
        { id: 'TB', tipo: 'toma', x: 7.6, y: 6.4 - F, z: 1.1, amb: 'bano', c: 'C9', gfci: true, muro: 'M6' },
        /* Salidas especiales */
        { id: 'XD', tipo: 'ducha', x: 8 - F, y: 4.15, z: 2.1, amb: 'bano', c: 'C7', W: 3500, muro: 'M-E', uso: 'Ducha eléctrica 3 500 W, 120 V' },
        { id: 'XE', tipo: 'estufa', x: F, y: 6.8, z: 0.5, amb: 'cocina', c: 'C8', W: 6000, muro: 'M-O', uso: 'Estufa eléctrica 6 kW, 240 V (previsión 3.28.1 n)' }
      ],
      /* Circuitos ramales. arbol: aristas del recorrido (de la caja más cercana al tablero
         hacia afuera); nivel: 'losa' (embebido en la losa) o 'piso' (en el contrapiso). */
      circuitos: [
        { id: 'C1', nombre: 'Alumbrado general', V: 120, fase: 'A', In: 15, awg: '14', tierra: '14', tubo: '1/2', nivel: 'losa',
          arbol: [['TG', 'LH'], ['LH', 'S5'], ['LH', 'S6'], ['LH', 'LB'], ['LB', 'S7'], ['LB', 'LA1'], ['LA1', 'S9'], ['TG', 'LA2'], ['LA2', 'S8'], ['TG', 'LS2'], ['LS2', 'LS1'], ['LS1', 'S1'], ['S1', 'LF'], ['LS2', 'LC'], ['LC', 'S2'], ['LC', 'LK1'], ['LK1', 'LK2'], ['LK2', 'S3'], ['LK1', 'LR'], ['LR', 'S4'], ['LR', 'LP']] },
        { id: 'C2', nombre: 'Tomas sala-comedor y exterior frontal', V: 120, fase: 'B', In: 20, awg: '12', tierra: '12', tubo: '1/2', nivel: 'piso',
          arbol: [['TG', 'TS4'], ['TS4', 'TS3'], ['TS3', 'TE1'], ['TS3', 'TS1'], ['TS1', 'TS2'], ['TS2', 'TS6'], ['TS6', 'TS7'], ['TS7', 'TS5']] },
        { id: 'C3', nombre: 'Tomas alcobas y exterior posterior', V: 120, fase: 'A', In: 20, awg: '12', tierra: '12', tubo: '1/2', nivel: 'piso',
          arbol: [['TG', 'TA24'], ['TA24', 'TA23'], ['TA23', 'TA22'], ['TA22', 'TA21'], ['TG', 'TA11'], ['TA11', 'TA12'], ['TA12', 'TA13'], ['TA13', 'TA14'], ['TA14', 'TA15'], ['TA12', 'TE2']] },
        { id: 'C4', nombre: 'Pequeños artefactos de cocina 1', V: 120, fase: 'B', In: 20, awg: '12', tierra: '12', tubo: '1/2', nivel: 'piso', gfci: 'toma',
          arbol: [['TG', 'TMa'], ['TMa', 'TMb'], ['TMb', 'TMc']] },
        { id: 'C5', nombre: 'Pequeños artefactos de cocina 2 y nevera', V: 120, fase: 'B', In: 20, awg: '12', tierra: '12', tubo: '1/2', nivel: 'piso', gfci: 'toma',
          arbol: [['TG', 'TK1'], ['TK1', 'TK3'], ['TK3', 'TN'], ['TN', 'TMd'], ['TK1', 'TK2']] },
        { id: 'C6', nombre: 'Patio de ropas: lavadora y plancha', V: 120, fase: 'B', In: 20, awg: '12', tierra: '12', tubo: '1/2', nivel: 'piso', gfci: 'toma',
          arbol: [['TG', 'TP'], ['TP', 'TL']] },
        { id: 'C7', nombre: 'Ducha eléctrica (circuito exclusivo)', V: 120, fase: 'A', In: 30, awg: '10', tierra: '10', tubo: '1/2', nivel: 'losa', diferencial: true,
          arbol: [['TG', 'XD']] },
        { id: 'C8', nombre: 'Estufa eléctrica 240 V (previsión)', V: 240, fase: 'AB', In: 30, polos: 2, awg: '10', tierra: '10', tubo: '1/2', nivel: 'piso',
          arbol: [['TG', 'XE']] },
        { id: 'C9', nombre: 'Baño', V: 120, fase: 'A', In: 20, awg: '12', tierra: '12', tubo: '1/2', nivel: 'piso', gfci: 'toma',
          arbol: [['TG', 'TB']] }
      ]
    }
  };

  /* ---------- Derivados ---------- */
  const C = L.C;
  const byId = {};
  CASA.electrico.puntos.forEach((p) => { byId[p.id] = p; });
  const tg = CASA.electrico.tablero;
  byId.TG = Object.assign({ tipo: 'tablero', amb: 'hall' }, tg);
  CASA.punto = (id) => byId[id];
  CASA.circuito = (id) => CASA.electrico.circuitos.find((c) => c.id === id);
  CASA.ambiente = (id) => CASA.ambientes.find((a) => a.id === id);
  /* Polígono interior (cara de muros) de un ambiente rectangular */
  CASA.libre = function (a) {
    const xs = a.poly.map((p) => p[0]), ys = a.poly.map((p) => p[1]);
    return [Math.min(...xs) + F, Math.min(...ys) + F, Math.max(...xs) - F, Math.max(...ys) - F];
  };
  CASA.areaLibre = function (a) { const r = CASA.libre(a); return (r[2] - r[0]) * (r[3] - r[1]); };
  /* Área construida por caras exteriores (para el cálculo de demanda, 220.12) */
  CASA.areaConstruida = function () { const e = CASA.ext; return (e[2] - e[0] + T) * (e[3] - e[1] + T); };
  /* Columnas en todas las intersecciones de ejes */
  CASA.columnas = function () {
    const out = [], b = CASA.estructura.col;
    CASA.ejes.x.forEach((x, i) => CASA.ejes.y.forEach((y, j) => out.push({ id: CASA.ejes.nx[i] + '-' + CASA.ejes.ny[j], x, y, rect: [x - b / 2, y - b / 2, x + b / 2, y + b / 2] })));
    return out;
  };
  /* Vigas aéreas (y de cimentación) sobre todos los ejes, entre caras de columnas */
  CASA.vigas = function (cim = false) {
    const out = [], b = cim ? CASA.estructura.cim.b : CASA.estructura.viga.b, c = CASA.estructura.col / 2;
    const ex = CASA.ejes.x, ey = CASA.ejes.y;
    ey.forEach((y, j) => { for (let i = 0; i < ex.length - 1; i++) out.push({ id: (cim ? 'VC-' : 'V-') + CASA.ejes.ny[j] + '(' + CASA.ejes.nx[i] + '-' + CASA.ejes.nx[i + 1] + ')', eje: 'y', pos: y, a: ex[i] + c, b: ex[i + 1] - c, rect: [ex[i] + c, y - b / 2, ex[i + 1] - c, y + b / 2], luz: ex[i + 1] - ex[i] }); });
    ex.forEach((x, i) => { for (let j = 0; j < ey.length - 1; j++) out.push({ id: (cim ? 'VC-' : 'V-') + CASA.ejes.nx[i] + '(' + CASA.ejes.ny[j] + '-' + CASA.ejes.ny[j + 1] + ')', eje: 'x', pos: x, a: ey[j] + c, b: ey[j + 1] - c, rect: [x - b / 2, ey[j] + c, x + b / 2, ey[j + 1] - c], luz: ey[j + 1] - ey[j] }); });
    return out;
  };
  /* Segmentos sólidos de un muro (sin vanos), en coordenadas d a lo largo del eje */
  CASA.tramosMuro = function (m) {
    const len = C.dist(m.a, m.b);
    const vs = [...m.vanos].sort((p, q) => p.d0 - q.d0);
    const out = [];
    let d = 0;
    for (const v of vs) { if (v.d0 > d) out.push([d, v.d0]); d = Math.max(d, v.d1); }
    if (d < len) out.push([d, len]);
    return out;
  };
  CASA.enMuro = function (m, d) { const len = C.dist(m.a, m.b), u = [(m.b[0] - m.a[0]) / len, (m.b[1] - m.a[1]) / len]; return [m.a[0] + u[0] * d, m.a[1] + u[1] * d]; };

  L.CASA = CASA;
})(typeof window !== 'undefined' ? window : globalThis);
