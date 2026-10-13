/* ===================================================================
   lib/00-norma.js — Datos normativos y tablas de referencia (sin DOM)
   Fuente principal: RETIE vigente en octubre de 2026 (Res. 40117 de 2024
   modificada por las Res. 40304 de 2025 y 40284 del 23-06-2026).
   Los valores tomados de la NTC 2050 segunda actualización (basada en
   NFPA 70 de 2017) se citan por su sección; deben verificarse en la norma
   oficial antes de usarlos en un diseño real.
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});
  const N = (L.N = {});

  N.FUENTE = 'RETIE: Res. 40117 de 2024, modificada por las Res. 40304 de 2025 y 40284 de 2026 (consulta: octubre de 2026)';

  /* ---------- Calibres AWG de cobre ---------- */
  N.AWG = ['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0'];
  /* Número AWG equivalente (1/0 = 0, 2/0 = −1) */
  N.awgNum = (s) => (s === '1/0' ? 0 : s === '2/0' ? -1 : +s);
  /* Capacidad de corriente (A) de conductores de cobre aislados, no más de tres portadores
     de corriente en canalización, temperatura ambiente 30 °C: columnas 60 °C, 75 °C y 90 °C.
     Tabla 310.15(B)(16) de la NTC 2050 segunda actualización (NFPA 70-2017). */
  N.AMPACIDAD = {
    '14': [15, 20, 25], '12': [20, 25, 30], '10': [30, 35, 40], '8': [40, 50, 55], '6': [55, 65, 75],
    '4': [70, 85, 95], '3': [85, 100, 115], '2': [95, 115, 130], '1': [110, 130, 145], '1/0': [125, 150, 170], '2/0': [145, 175, 195]
  };
  N.COLS = [60, 75, 90];
  /* Protección máxima de conductores pequeños, sección 240.4(D) */
  N.MAX_OCPD = { '14': 15, '12': 20, '10': 30 };
  /* Valores nominales normalizados de interruptores automáticos, sección 240.6(A) */
  N.BREAKERS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200];
  /* Área aproximada con aislamiento THHN/THWN-2 (mm²), Capítulo 9, Tabla 5 */
  N.AREA_THHN = { '14': 6.258, '12': 8.581, '10': 13.61, '8': 23.61, '6': 32.71, '4': 53.16, '3': 62.77, '2': 74.71, '1': 100.8, '1/0': 119.7, '2/0': 143.4 };
  /* Factores de ajuste por más de tres portadores de corriente, Tabla 310.15(B)(3)(a) */
  N.AJUSTE_N = [[3, 1], [6, 0.8], [9, 0.7], [20, 0.5], [30, 0.45], [40, 0.4], [1e9, 0.35]];

  /* ---------- Tubos (conduit) ---------- */
  /* Diámetro comercial, designación métrica, área interior total (mm², Cap. 9 Tabla 4) y
     diámetro exterior aproximado (mm). PVC: artículo 352 (Schedule 40). EMT: artículo 358. */
  N.TUBOS = {
    PVC: [
      { d: '1/2', m: 16, area: 184, de: 21.3 }, { d: '3/4', m: 21, area: 327, de: 26.7 }, { d: '1', m: 27, area: 535, de: 33.4 },
      { d: '1 1/4', m: 35, area: 935, de: 42.2 }, { d: '1 1/2', m: 41, area: 1282, de: 48.3 }, { d: '2', m: 53, area: 2124, de: 60.3 }
    ],
    EMT: [
      { d: '1/2', m: 16, area: 196, de: 17.9 }, { d: '3/4', m: 21, area: 343, de: 23.4 }, { d: '1', m: 27, area: 556, de: 29.5 },
      { d: '1 1/4', m: 35, area: 968, de: 38.4 }, { d: '1 1/2', m: 41, area: 1314, de: 44.2 }, { d: '2', m: 53, area: 2165, de: 55.8 }
    ]
  };
  /* Porcentaje máximo de ocupación, Capítulo 9 Tabla 1 */
  N.llenadoMax = (n) => (n <= 0 ? 1 : n === 1 ? 0.53 : n === 2 ? 0.31 : 0.4);
  /* Máximo de curvas entre puntos de halado (artículos 352.26 y 358.26) */
  N.CURVAS_MAX = 360;
  /* Separación máxima de soportes de tubería no metálica (Libro 3, 3.17.6.6 c), m */
  N.soporteMax = (dmm) => (dmm <= 19 ? 1.2 : dmm <= 51 ? 1.5 : dmm <= 76 ? 1.8 : 2.1);

  /* ---------- Cajas ---------- */
  /* Volumen por conductor (cm³), Tabla 314.16(B) */
  N.VOL_COND = { '14': 32.8, '12': 36.9, '10': 41.0, '8': 49.2, '6': 81.9 };
  /* Cajas usuales. La rectangular usa las dimensiones internas mínimas del Libro 2, 2.3.4 b. */
  N.CAJAS = [
    { id: 'rect-met', nombre: 'Rectangular metálica 2×4 in (mín. RETIE 53,9 × 101 × 47,6 mm)', vol: 259.1, uso: 'interruptores y tomacorrientes' },
    { id: 'rect-pvc', nombre: 'Rectangular no metálica (mín. RETIE 53 × 97 × 41 mm)', vol: 210.8, uso: 'interruptores y tomacorrientes' },
    { id: 'oct-38', nombre: 'Octagonal 4 in × 1 1/2 in', vol: 254, uso: 'salidas de alumbrado' },
    { id: 'cuad-38', nombre: 'Cuadrada 4 in × 1 1/2 in', vol: 344, uso: 'empalmes, dos aparatos con suplemento' },
    { id: 'cuad-54', nombre: 'Cuadrada 4 in × 2 1/8 in', vol: 497, uso: 'empalmes con muchos conductores' }
  ];

  /* ---------- Código de colores (Libro 3, Título 5, Tabla 3.5.a) ---------- */
  N.COLORES = {
    '1F2H-120': { nombre: 'Monofásico bifilar 120 V (1 fase, 2 hilos)', fases: ['negro'], fasesTxt: 'Color de la fase o negro', neutro: 'blanco', tierra: 'desnudo o verde', aislada: 'verde o verde/amarillo' },
    '1F3H-240/120': { nombre: 'Monofásico trifilar 240/120 V (2 fases, 3 hilos)', fases: ['negro', 'rojo'], fasesTxt: 'Color de las fases o una de ellas en negro', neutro: 'blanco', tierra: 'desnudo o verde', aislada: 'verde o verde/amarillo' },
    '3F4H-208/120': { nombre: 'Trifásico tetrafilar 208/120 V (3 fases, 4 hilos)', fases: ['amarillo', 'azul', 'rojo'], fasesTxt: 'Amarillo, azul, rojo', neutro: 'blanco', tierra: 'desnudo o verde', aislada: 'verde o verde/amarillo' },
    '3F4H-480/277': { nombre: 'Trifásico tetrafilar 480/277 V', fases: ['café', 'naranja', 'amarillo'], fasesTxt: 'Café, naranja, amarillo', neutro: 'gris', tierra: 'desnudo o verde', aislada: 'No aplica' }
  };
  N.COLOR_HEX = { negro: '--cond-negro', rojo: '--cond-rojo', azul: '--cond-azul', amarillo: '--cond-amarillo', blanco: '--cond-blanco', verde: '--cond-verde', café: '#7A4A22', naranja: '#E07A1F', gris: '#9A9A9A', violeta: '#7B3FB0', desnudo: '#C07A3A' };

  /* ---------- Tensiones (Libro 3, Título 9) ---------- */
  N.TENSIONES = {
    MBT: 'Muy baja tensión: menos de 25 V c.a. o menos de 50 V c.c.',
    BT: 'Baja tensión: hasta 1 000 V c.a. y hasta 1 500 V c.c.',
    MT: 'Media tensión: más de 1 000 V y menos de 57,5 kV (11,4 · 13,2 · 34,5 · 44 kV)',
    AT: 'Alta tensión: de 57,5 kV a 230 kV (66 · 110 · 115 · 220 · 230 kV)',
    EAT: 'Extra alta tensión: más de 230 kV (345 · 500 kV)'
  };
  N.FRECUENCIA = 60;

  /* ---------- Seres humanos y corriente (Libro 1, 1.5.1.2) ---------- */
  N.UMBRALES_mA = { percepcion: 1.1, soltarse: 10, fibrilacion: 25 };
  N.TENSION_SEGURIDAD = [
    { piel: 'Piel perfectamente seca (excepcional)', V: 80 },
    { piel: 'Piel húmeda (normal) en ambiente seco', V: 50 },
    { piel: 'Piel mojada en ambientes muy húmedos', V: 24 },
    { piel: 'Piel sumergida en agua', V: 12 }
  ];
  N.DALZIEL = { corrientes: [6, 10, 20, 30], hombres: [100, 98.5, 7.5, 0], mujeres: [99.5, 60, 0, 0], ninos: [92.5, 7.5, 0, 0] };
  N.R_CUERPO = 1000;

  /* Máxima tensión de contacto admisible (Libro 3, Tabla 3.12.1.a): tiempo de despeje (s),
     público en general (IEC 60479-1, curva C1) y ocupacional (IEEE 80, 50 kg). La fila
     «mayor a 2 s» se representa en 3 s. */
  N.CONTACTO = [
    [3, 50, 82], [1, 55, 116], [0.7, 70, 138], [0.5, 80, 164], [0.4, 130, 183], [0.3, 200, 211],
    [0.2, 270, 259], [0.15, 300, 299], [0.1, 320, 366], [0.05, 345, 518]
  ];
  /* Interpolación logarítmica en el tiempo */
  N.contactoMax = function (t, col = 1) {
    const T = N.CONTACTO;
    if (t >= 2) return T[0][col];
    if (t <= T[T.length - 1][0]) return T[T.length - 1][col];
    for (let i = 0; i < T.length - 1; i++) {
      const a = T[i], b = T[i + 1];
      const ta = Math.min(a[0], 2);
      if (t <= ta && t >= b[0]) {
        const f = (Math.log(t) - Math.log(b[0])) / (Math.log(ta) - Math.log(b[0]));
        return b[col] + f * (a[col] - b[col]);
      }
    }
    return T[0][col];
  };

  /* ---------- Puesta a tierra ---------- */
  N.RPT_REF = [
    ['Estructuras y torrecillas metálicas de líneas o redes con cable de guarda', 20],
    ['Subestaciones de alta y extra alta tensión', 1],
    ['Subestaciones de media tensión', 10],
    ['Protección contra rayos', 10],
    ['Punto neutro de acometida en baja tensión', 25],
    ['Redes para equipos electrónicos o sensibles', 10]
  ];
  N.ELECTRODO = { longitudMin: 2.4, diamCobre: 12.7, diamAceroCu: 14, recubrimientoCu_um: 250, cajaInspeccion: 0.30 };

  /* ---------- Factores de riesgo (Libro 1, Tabla 1.5.1.4.1.a) ---------- */
  N.RIESGO_FREC = [
    ['E', 'No ha ocurrido en el sector'], ['D', 'Ha ocurrido en el sector'], ['C', 'Ha ocurrido en la empresa'],
    ['B', 'Sucede varias veces al año en la empresa'], ['A', 'Sucede varias veces al mes en la empresa']
  ];
  N.RIESGO_CONS = [
    [5, 'Una o más muertes', 'Daño grave en infraestructura. Interrupción regional', 'Contaminación irreparable', 'Internacional'],
    [4, 'Incapacidad parcial permanente', 'Daños mayores, salida de subestación', 'Contaminación mayor', 'Nacional'],
    [3, 'Incapacidad temporal (> 1 día)', 'Daños severos. Interrupción temporal', 'Contaminación localizada', 'Regional'],
    [2, 'Lesión menor (sin incapacidad)', 'Daños importantes. Interrupción breve', 'Efecto menor', 'Local'],
    [1, 'Molestia funcional (afecta rendimiento laboral)', 'Daños leves. No interrupción', 'Sin efecto', 'Interna']
  ];
  /* Matriz [consecuencia 5..1][frecuencia E..A] */
  N.RIESGO_MATRIZ = {
    5: ['MEDIO', 'ALTO', 'ALTO', 'ALTO', 'MUY ALTO'],
    4: ['MEDIO', 'MEDIO', 'MEDIO', 'ALTO', 'ALTO'],
    3: ['BAJO', 'MEDIO', 'MEDIO', 'MEDIO', 'ALTO'],
    2: ['BAJO', 'BAJO', 'MEDIO', 'MEDIO', 'MEDIO'],
    1: ['MUY BAJO', 'BAJO', 'BAJO', 'BAJO', 'MEDIO']
  };
  N.RIESGO_ACCION = {
    'MUY ALTO': 'Inadmisible para trabajar. Eliminar fuentes potenciales, hacer reingeniería o minimizarlo y volver a valorarlo. Requiere permiso especial de trabajo.',
    'ALTO': 'Minimizarlo. Buscar alternativas de menor riesgo, demostrar cómo se controlará, aislar con barreras o distancia, usar EPP. Requiere permiso especial de trabajo.',
    'MEDIO': 'Aceptarlo. Aplicar sistemas de control (minimizar, aislar, EPP, procedimientos, listas de verificación). Requiere permiso de trabajo.',
    'BAJO': 'Asumirlo. Control administrativo rutinario y procedimientos establecidos. Usar EPP. No requiere permiso especial.',
    'MUY BAJO': 'Vigilar posibles cambios.'
  };

  /* ---------- Umbrales para diseño y conformidad ---------- */
  N.UMBRAL = {
    kVA_basica: 15,           /* 3.3.1 q y 3.3.2: instalaciones básicas individuales */
    V_basica: 240,
    cuentas_esquema: 4,       /* 3.3.2: hasta 4 cuentas → esquema constructivo */
    cuentas_plena: 5,         /* 4.3.2.1 b */
    kVA_peq: 7, area_peq: 50, /* 3.28.1 i y l */
    msnm_ducha: 1500,         /* 3.28.1 m */
    dorm_peq: 9,              /* 3.28.1 o */
    dV_acometida: 3, dV_total: 5, /* Título 26 f */
    gfci_ducha: 1.8,          /* 3.17.15 g */
    sw_ducha: 0.8,            /* 3.28.1 j */
    palanca_max: 2.0,         /* 3.17.19 g */
    trabajo: { prof: 0.9, ancho: 0.76, alto: 2.0 } /* Título 4 e */
  };

  /* ---------- Cargas para el cálculo de demanda (NTC 2050, artículo 220) ---------- */
  N.CARGA = {
    alumbradoGeneral: 33,  /* VA/m² en unidades de vivienda, Tabla 220.12 (3 VA/pie²) */
    pequenosArtefactos: 1500, /* VA por circuito, 220.52(A) */
    lavanderia: 1500,       /* VA por circuito, 220.52(B) */
    tomaGeneral: 180,       /* VA por salida, 220.14(I); en vivienda se incluye en el alumbrado general (220.14(J)) */
    secadora: 5000          /* W mínimo, 220.54 */
  };
  /* Factores de demanda del alumbrado y tomas en vivienda, Tabla 220.42 */
  N.DEMANDA_VIV = [[3000, 1], [120000, 0.35], [Infinity, 0.25]];

  /* ---------- Iluminación de referencia (criterio de diseño) ---------- */
  /* El RETILAP 2026 (Libro 3, 3.1.4.2 y 3.1.4.3) exceptúa de diseño básico y detallado las áreas
     privadas de vivienda; estos valores son referencias orientativas de diseño, no exigencias. */
  N.LUX_REF = [
    ['Sala-comedor', 150], ['Cocina (general)', 200], ['Mesón de cocina (luz de trabajo)', 300], ['Alcoba', 100],
    ['Baño (general)', 150], ['Pasillo o hall', 100], ['Patio de ropas', 100], ['Estudio', 300]
  ];
  /* Factor de utilización típico de una luminaria LED de techo, reflectancias 0,7/0,5/0,2,
     en función del índice del local K (valores orientativos: use la ficha fotométrica real). */
  N.CU_K = [[0.6, 0.45], [0.8, 0.53], [1.0, 0.59], [1.25, 0.65], [1.5, 0.69], [2, 0.75], [2.5, 0.79], [3, 0.82], [4, 0.86], [5, 0.88]];

  /* ---------- Símbolos de la Tabla 1.3.4.a (Libro 1) ---------- */
  N.SIMBOLOS = [
    'caja-empalme', 'corriente-continua', 'conductores-fase', 'conductor-neutro', 'conductor-tierra', 'conmutador',
    'contacto-corte', 'contacto-disparo', 'dps', 'dps-varistor', 'doble-aislamiento', 'empalme', 'equipotencialidad',
    'fusible', 'generador', 'interruptor', 'interruptor-automatico', 'interruptor-bipolar', 'interruptor-piloto',
    'interruptor-diferencial', 'interruptor-dos-vias', 'interruptor-termomagnetico', 'lampara', 'masa', 'parada-emergencia',
    'tablero-general', 'tablero-distribucion', 'tierra', 'tierra-proteccion', 'tierra-aislada', 'toma', 'toma-piso',
    'toma-monofasico', 'toma-trifasico', 'transformador', 'transformador-aislamiento', 'transformador-seguridad'
  ];
})(typeof window !== 'undefined' ? window : globalThis);
