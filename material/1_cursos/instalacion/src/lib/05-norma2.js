/* ===================================================================
   lib/05-norma2.js — Datos adicionales para el taller de obra
   Tablas de la NTC 2050 (NFPA 70-2017) que el taller necesita y que no
   estaban en la guía: conductor de puesta a tierra de equipos (250.122),
   conductor del electrodo (250.66), alturas de la acometida (230.24),
   suelos de los lotes, aparatos domésticos, rollos de cable del recibo
   de materiales y colores permitidos por función del conductor.
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});
  const N = L.N;

  /* Tabla 250.122: calibre mínimo del conductor de puesta a tierra de equipos (cobre) según la
     protección contra sobrecorriente del circuito */
  N.EGC = [[15, '14'], [20, '12'], [60, '10'], [100, '8'], [200, '6'], [300, '4']];
  N.egc = (In) => { for (const [lim, a] of N.EGC) if (In <= lim) return a; return '2'; };
  /* Tabla 250.66: conductor del electrodo de puesta a tierra (cobre) según el mayor conductor de la acometida */
  N.gec = (awgServicio) => { const n = N.awgNum(awgServicio); return n >= 2 ? '8' : n >= 0 ? '6' : '4'; };
  /* Comparación de calibres: true si a es igual o mayor (más grueso) que b */
  N.mayorIgual = (a, b) => N.awgNum(a) <= N.awgNum(b);

  /* Sección 230.24(B): alturas mínimas de los conductores aéreos de acometida (m) */
  N.ACOMETIDA_ALTURAS = { fachada: 3.0, antejardin: 3.7, calle: 5.5 };
  N.FLECHA = 0.4; /* descenso del cable en el centro del vano, m */
  /* Alturas habituales del medidor (norma del operador de red; no las fija el RETIE) */
  N.MEDIDOR_ALTURA = [1.4, 1.8];

  /* Suelos de los lotes: suelo de dos capas (ρ1 sobre ρ2, espesor h) y distancia a la red de baja tensión */
  N.LOTES = {
    A: { nombre: 'Lote A · arcilla húmeda', rho1: 60, rho2: 40, h: 2.2, red: 8, desc: 'Lote bajo en ladera, con humedad casi todo el año.' },
    B: { nombre: 'Lote B · relleno de escombro sobre arena', rho1: 260, rho2: 110, h: 1.0, red: 26, desc: 'Lote rellenado, seco, con la red a una cuadra de distancia.' },
    C: { nombre: 'Lote C · limo volcánico', rho1: 130, rho2: 90, h: 1.8, red: 14, desc: 'Suelo limoso de ceniza volcánica, humedad intermedia.' }
  };
  N.ESTACION_SECA = 1.35; /* la resistividad sube en verano */
  N.ELECTRODOS = [
    { id: 'cu-12', nombre: 'Varilla de cobre de 1/2 in (12,7 mm)', d: 12.7, ok: true },
    { id: 'acu-16', nombre: 'Varilla de acero-cobre de 5/8 in (15,9 mm), recubrimiento de 250 µm', d: 15.9, ok: true },
    { id: 'acu-10', nombre: 'Varilla de acero-cobre de 3/8 in (9,5 mm)', d: 9.5, ok: false, falla: 'Su diámetro (9,5 mm) está por debajo de los 14 mm exigidos al acero recubierto de cobre.' },
    { id: 'gal-16', nombre: 'Varilla de acero galvanizado de 5/8 in', d: 15.9, ok: false, falla: 'El acero galvanizado no es un electrodo aceptado por el RETIE: debe ser cobre o acero recubierto de cobre.' }
  ];
  N.CONEXIONES_TIERRA = [
    { id: 'exo', nombre: 'Soldadura exotérmica', ok: true },
    { id: 'comp', nombre: 'Conector de compresión certificado para electrodos', ok: true },
    { id: 'alambre', nombre: 'Amarre con alambre dulce', ok: false, falla: 'Un amarre con alambre se afloja y se oxida: la conexión al electrodo debe ser un conector certificado o soldadura exotérmica.' },
    { id: 'tornillo', nombre: 'Borne de tornillo sin marcación', ok: false, falla: 'Los conectores del electrodo deben ser productos certificados para enterramiento directo.' }
  ];

  /* Aparatos que se enchufan en el laboratorio (potencia en operación) */
  N.APARATOS = [
    { id: 'nevera', nombre: 'Nevera', W: 180, ico: 'N' },
    { id: 'tv', nombre: 'Televisor', W: 120, ico: 'T' },
    { id: 'licuadora', nombre: 'Licuadora', W: 450, ico: 'L' },
    { id: 'lavadora', nombre: 'Lavadora', W: 500, ico: 'W' },
    { id: 'plancha', nombre: 'Plancha', W: 1000, ico: 'P' },
    { id: 'micro', nombre: 'Microondas', W: 1200, ico: 'M' },
    { id: 'horno', nombre: 'Horno tostador', W: 1500, ico: 'H' },
    { id: 'calefactor', nombre: 'Calefactor', W: 1500, ico: 'C' }
  ];

  /* Rollos de conductor del recibo de materiales (todos rotulados 12 AWG) */
  N.ROLLOS = [
    { id: 'r1', marca: 'Cobres del Valle', aisl: 'THHN/THWN-2 · 600 V · 90 °C', cert: true, d: 2.05, ok: true },
    { id: 'r2', marca: 'ElectroMax', aisl: 'THHN/THWN-2 · 600 V · 90 °C', cert: true, d: 1.62, ok: false,
      falla: 'El cobre mide 1,62 mm y un 12 AWG mide 2,05 mm: está subdimensionado, calentaría más de lo calculado.' },
    { id: 'r3', marca: 'AlambrePlus', aisl: 'THHN/THWN-2 · 600 V · 90 °C', cert: false, d: 2.05, ok: false,
      falla: 'No presenta certificado de conformidad con el RETIE vigente: el producto no puede instalarse.' },
    { id: 'r4', marca: 'Flex Duplex', aisl: 'Cordón duplex flexible PVC · 300 V', cert: true, d: 2.05, ok: false,
      falla: 'Es un cordón para aparatos portátiles (300 V): no es para instalación fija embebida en tubería.' }
  ];

  /* Colores permitidos por función (Tabla 3.5.a para 120/240 V; retornos y viajeros: cualquiera menos los reservados) */
  N.COLORES_LISTA = [
    ['negro', 'Negro', '#1E1E1E'], ['rojo', 'Rojo', '#C8312A'], ['azul', 'Azul', '#2557B8'], ['amarillo', 'Amarillo', '#E8B800'],
    ['blanco', 'Blanco', '#F4F4F0'], ['verde', 'Verde', '#2F8F4A'], ['desnudo', 'Desnudo', '#C07A3A'], ['gris', 'Gris', '#9A9A9A'], ['naranja', 'Naranja', '#E07A1F']
  ];
  N.COLOR_FUNCION = {
    F: ['negro', 'rojo'], F1: ['negro'], F2: ['rojo'], N: ['blanco'], T: ['verde', 'desnudo'],
    R: ['negro', 'rojo', 'azul', 'amarillo', 'naranja'], V: ['negro', 'rojo', 'azul', 'amarillo', 'naranja']
  };
  N.FUNCION_NOMBRE = { F: 'fase', F1: 'fase 1', F2: 'fase 2', N: 'neutro', T: 'tierra', R: 'retorno', V: 'viajero' };
  N.colorOk = (funcion, color) => (N.COLOR_FUNCION[funcion] || []).includes(color);
})(typeof window !== 'undefined' ? window : globalThis);
