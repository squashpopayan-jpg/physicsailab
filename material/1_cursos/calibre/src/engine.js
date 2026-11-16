/* Motor de metrología dimensional: calibrador vernier (pie de rey) y micrómetro.
   Todo el cálculo se hace en milímetros; cada instrumento lee en su unidad (mm o in).
   Sin dependencias del navegador: se prueba con Node (test/engine.test.js). */
var METRO = (function () {
  'use strict';

  /* ---------- unidades de longitud (mm por unidad) ---------- */
  const UNIDADES = {
    km: { mm: 1e6, nombre: 'kilómetro', sim: 'km' },
    m: { mm: 1000, nombre: 'metro', sim: 'm' },
    cm: { mm: 10, nombre: 'centímetro', sim: 'cm' },
    mm: { mm: 1, nombre: 'milímetro', sim: 'mm' },
    um: { mm: 0.001, nombre: 'micrómetro (micra)', sim: 'µm' },
    nm: { mm: 1e-6, nombre: 'nanómetro', sim: 'nm' },
    in: { mm: 25.4, nombre: 'pulgada', sim: 'in' },
    ft: { mm: 304.8, nombre: 'pie', sim: 'ft' },
    yd: { mm: 914.4, nombre: 'yarda', sim: 'yd' },
    mil: { mm: 0.0254, nombre: 'milésima de pulgada (mil)', sim: 'mil' },
  };
  const aMM = (v, u) => v * UNIDADES[u].mm;
  const deMM = (mm, u) => mm / UNIDADES[u].mm;
  const convertir = (v, de, a) => v * UNIDADES[de].mm / UNIDADES[a].mm;

  /* ---------- formato (coma decimal) ---------- */
  function fmt(x, d) {
    if (!Number.isFinite(x)) return '—';
    let s = x.toFixed(d);
    if (/^-0(\.0*)?$/.test(s)) s = s.slice(1);
    return s.replace('.', ',');
  }
  const decimales = (lc) => Math.max(0, Math.ceil(-Math.log10(lc) - 1e-9));
  /* número con n cifras significativas, en notación decimal o científica según el tamaño */
  function cifras(x, n) {
    if (!Number.isFinite(x) || x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= 6 || e <= -5) {
      const m = x / Math.pow(10, e);
      return fmt(m, n - 1) + '×10<sup>' + e + '</sup>';
    }
    const d = Math.max(0, n - 1 - e);
    return fmt(x, d);
  }

  /* ---------- números pseudoaleatorios reproducibles ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hstr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h;
  }

  /* ---------- instrumentos ---------- */
  const INSTRUMENTOS = [
    { id: 'v010', tipo: 'vernier', nombre: 'Calibrador vernier · 0,1 mm', corto: 'Vernier 0,1 mm', unidad: 'mm', div: 1, N: 10, rango: 150 },
    { id: 'v005', tipo: 'vernier', nombre: 'Calibrador vernier · 0,05 mm', corto: 'Vernier 0,05 mm', unidad: 'mm', div: 1, N: 20, rango: 150 },
    { id: 'v002', tipo: 'vernier', nombre: 'Calibrador vernier · 0,02 mm', corto: 'Vernier 0,02 mm', unidad: 'mm', div: 1, N: 50, rango: 150 },
    { id: 'vin', tipo: 'vernier', nombre: 'Calibrador vernier · 0,001 in', corto: 'Vernier 0,001 in', unidad: 'in', div: 0.025, N: 25, rango: 6 },
    { id: 'm010', tipo: 'micro', nombre: 'Micrómetro de exteriores 0–25 mm · 0,01 mm', corto: 'Micrómetro 0,01 mm', unidad: 'mm', paso: 0.5, nT: 50, nonio: 0, rango: 25 },
    { id: 'm001', tipo: 'micro', nombre: 'Micrómetro de exteriores 0–25 mm · 0,001 mm (con nonio)', corto: 'Micrómetro 0,001 mm', unidad: 'mm', paso: 0.5, nT: 50, nonio: 10, rango: 25 },
    { id: 'min', tipo: 'micro', nombre: 'Micrómetro de exteriores 0–1 in · 0,001 in', corto: 'Micrómetro 0,001 in', unidad: 'in', paso: 0.025, nT: 25, nonio: 0, rango: 1 },
  ];
  INSTRUMENTOS.forEach((I) => {
    I.f = UNIDADES[I.unidad].mm;                         // mm por unidad del instrumento
    I.lc = I.tipo === 'vernier' ? I.div / I.N : I.paso / (I.nT * (I.nonio || 1));
    I.dec = decimales(I.lc);
    I.rangoMM = I.rango * I.f;
    I.lcMM = I.lc * I.f;
  });
  const instr = (id) => INSTRUMENTOS.find((i) => i.id === id);

  /* ---------- lectura del instrumento ---------- */
  /* p: posición del instrumento en mm (apertura real + error de cero). Devuelve las partes de la lectura. */
  function lectura(I, pMM) {
    const pu = pMM / I.f;
    const c = Math.round(pu / I.lc + 1e-9);
    const valor = parseFloat((c * I.lc).toFixed(I.dec + 2));
    if (I.tipo === 'vernier') {
      const M = Math.floor(c / I.N), k = c - M * I.N;
      return { c, valor, M, k, principal: parseFloat((M * I.div).toFixed(6)), fino: parseFloat((k * I.lc).toFixed(6)) };
    }
    const cpp = I.nT * (I.nonio || 1);                    // cuentas por vuelta
    const s = Math.floor(c / cpp), rem = c - s * cpp;
    const nn = I.nonio || 1;
    const t = Math.floor(rem / nn), v = nn > 1 ? rem % nn : 0;
    const mmUnidad = I.unidad === 'mm' ? 1 : null;
    return { c, valor, s, t, v, vueltas: s, manguito: parseFloat((s * I.paso).toFixed(6)), tambor: parseFloat((t * I.paso / I.nT).toFixed(6)), nonioV: parseFloat((v * I.lc).toFixed(6)), mmUnidad };
  }

  /* explicación paso a paso (HTML) de una lectura */
  function pasos(I, pMM) {
    const L = lectura(I, pMM), u = I.unidad === 'mm' ? 'mm' : 'in', d = I.dec, r = [];
    const F = (x, dd) => fmt(x, dd === undefined ? d : dd);
    if (I.tipo === 'vernier') {
      const divtxt = I.unidad === 'mm' ? '1 mm' : '0,025 in';
      r.push(`<b>Escala principal.</b> Mire dónde cae el <b>cero del nonio</b>: la última marca de la regla que queda a su izquierda es la de <b>${F(L.principal)} ${u}</b> (cada división de la regla vale ${divtxt}).`);
      r.push(`<b>Nonio.</b> Busque la línea del nonio que <b>coincide</b> con una línea de la regla. Es la línea número <b>${L.k}</b>. Cada línea del nonio añade la resolución, ${F(I.lc, I.dec)} ${u}: ${L.k} × ${F(I.lc)} = <b>${F(L.fino)} ${u}</b>.`);
      r.push(`<b>Suma.</b> ${F(L.principal)} + ${F(L.fino)} = <b>${F(L.valor)} ${u}</b>.`);
    } else {
      const nn = I.nonio || 1;
      const sleeve = I.unidad === 'mm'
        ? `En el manguito se ven <b>${Math.floor(L.s / 2)} mm</b>${L.s % 2 ? ' y además la marca inferior de <b>medio milímetro</b> (+0,5 mm)' : ' y la marca de medio milímetro todavía NO se ve'}: <b>${F(L.manguito, 1)} mm</b>.`
        : `En el manguito se ven ${L.s} divisiones de 0,025 in (cada una es un cuarto de 0,1 in): <b>${F(L.manguito, 3)} in</b>.`;
      r.push(`<b>Manguito (escala fija).</b> ${sleeve}`);
      r.push(`<b>Tambor.</b> La línea <b>${L.t}</b> del tambor es la que queda frente a la línea de referencia del manguito. Cada división vale ${F(I.paso / I.nT, I.unidad === 'mm' ? 2 : 3)} ${u}: ${L.t} × ${F(I.paso / I.nT, I.unidad === 'mm' ? 2 : 3)} = <b>${F(L.tambor, I.unidad === 'mm' ? 2 : 3)} ${u}</b>.`);
      if (nn > 1) r.push(`<b>Nonio del manguito.</b> La línea <b>${L.v}</b> del manguito coincide con una línea del tambor: ${L.v} × ${F(I.lc)} = <b>${F(L.nonioV)} ${u}</b>.`);
      r.push(`<b>Suma.</b> ${F(L.manguito, I.unidad === 'mm' ? 1 : 3)} + ${F(L.tambor, I.unidad === 'mm' ? 2 : 3)}${nn > 1 ? ' + ' + F(L.nonioV) : ''} = <b>${F(L.valor)} ${u}</b>.`);
    }
    return r;
  }

  /* ---------- materiales ---------- */
  const MATERIALES = [
    { n: 'Aluminio', rho: 2.70 }, { n: 'Titanio', rho: 4.51 }, { n: 'Hierro fundido', rho: 7.20 }, { n: 'Acero', rho: 7.85 },
    { n: 'Latón', rho: 8.50 }, { n: 'Bronce', rho: 8.80 }, { n: 'Cobre', rho: 8.96 }, { n: 'Plomo', rho: 11.34 },
    { n: 'Vidrio', rho: 2.50 }, { n: 'Nailon', rho: 1.14 }, { n: 'PVC', rho: 1.40 }, { n: 'Cuproníquel', rho: 8.90 },
  ];

  /* ---------- piezas ---------- */
  /* attr.kind: ext (mordazas exteriores), int (mordazas de interiores), prof (varilla de profundidad)
     nom: valor nominal (mm); dev: desviación típica de la pieza concreta respecto al nominal;
     conic: variación a lo largo de la pieza; oval: ovalidad; rug: rugosidad/irregularidad local.
     dib: forma que se dibuja; h: altura visual (mm). */
  const OBJETOS = [
    { id: 'p5', nombre: 'Bloque patrón 5 mm', mat: 'Acero', rho: 7.85, k: 4e5, patron: true, forma: 'bloque',
      nota: 'Bloque patrón de acero con certificado. Sirve para comprobar el instrumento.',
      attrs: [{ id: 'L', nombre: 'Espesor del bloque', kind: 'ext', nom: 5.000, dev: 0.0001, conic: 0.00005, oval: 0, rug: 0.00005, dib: 'rect', h: 30 }] },
    { id: 'p25', nombre: 'Bloque patrón 25 mm', mat: 'Acero', rho: 7.85, k: 4e5, patron: true, forma: 'bloque',
      nota: 'Bloque patrón de acero con certificado. Con el micrómetro de 0–25 mm se usa para comprobar el final del recorrido.',
      attrs: [{ id: 'L', nombre: 'Espesor del bloque', kind: 'ext', nom: 25.000, dev: 0.0001, conic: 0.00005, oval: 0, rug: 0.00005, dib: 'rect', h: 30 }] },
    { id: 'p50', nombre: 'Bloque patrón 50 mm', mat: 'Acero', rho: 7.85, k: 4e5, patron: true, forma: 'bloque',
      nota: 'Bloque patrón de acero con certificado (solo cabe en el calibrador).',
      attrs: [{ id: 'L', nombre: 'Espesor del bloque', kind: 'ext', nom: 50.000, dev: 0.0001, conic: 0.00005, oval: 0, rug: 0.00005, dib: 'rect', h: 30 }] },
    { id: 'esfera', nombre: 'Esfera de acero (rodamiento)', mat: 'Acero', rho: 7.85, k: 1e5, masa: true, vol: ['esfera', 'D'], forma: 'esfera',
      nota: 'Bola de rodamiento de media pulgada. Una esfera da el mismo diámetro en cualquier dirección.',
      attrs: [{ id: 'D', nombre: 'Diámetro', kind: 'ext', nom: 12.700, dev: 0.004, conic: 0, oval: 0.0008, rug: 0.0003, dib: 'esfera' }] },
    { id: 'cil', nombre: 'Cilindro de aluminio', mat: 'Aluminio', rho: 2.70, k: 5e4, masa: true, vol: ['cilindro', 'D', 'L'], forma: 'cilindro',
      nota: 'Torneado, con ligera conicidad y ovalidad. Mida en varios puntos y giros.',
      attrs: [
        { id: 'D', nombre: 'Diámetro', kind: 'ext', nom: 20.00, dev: 0.03, conic: 0.022, oval: 0.012, rug: 0.003, dib: 'cilV', h: 40 },
        { id: 'L', nombre: 'Longitud', kind: 'ext', nom: 60.00, dev: 0.08, conic: 0, oval: 0.012, rug: 0.004, dib: 'cilH', h: 20 }] },
    { id: 'varilla', nombre: 'Varilla de acero pulida', mat: 'Acero', rho: 7.85, k: 5e4, masa: true, vol: ['cilindro', 'D', 'L'], forma: 'cilindro',
      nota: 'Varilla rectificada: casi perfecta, pero ningún proceso lo es del todo.',
      attrs: [
        { id: 'D', nombre: 'Diámetro', kind: 'ext', nom: 8.00, dev: 0.006, conic: 0.004, oval: 0.003, rug: 0.0015, dib: 'cilV', h: 40 },
        { id: 'L', nombre: 'Longitud', kind: 'ext', nom: 120.00, dev: 0.15, conic: 0, oval: 0.02, rug: 0.005, dib: 'cilH', h: 8 }] },
    { id: 'laton', nombre: 'Bloque de latón', mat: 'Latón', rho: 8.50, k: 8e4, masa: true, vol: ['bloque', 'a', 'b', 'c'], forma: 'bloque',
      nota: 'Paralelepípedo fresado. Tres medidas: con ellas se calcula el volumen y la densidad.',
      attrs: [
        { id: 'a', nombre: 'Largo (a)', kind: 'ext', nom: 40.00, dev: 0.04, conic: 0.012, oval: 0.008, rug: 0.003, dib: 'rect', h: 30 },
        { id: 'b', nombre: 'Ancho (b)', kind: 'ext', nom: 30.00, dev: 0.04, conic: 0.010, oval: 0.008, rug: 0.003, dib: 'rect', h: 40 },
        { id: 'c', nombre: 'Alto (c)', kind: 'ext', nom: 20.00, dev: 0.03, conic: 0.008, oval: 0.008, rug: 0.003, dib: 'rect', h: 40 }] },
    { id: 'arandela', nombre: 'Arandela de acero M8', mat: 'Acero', rho: 7.85, k: 6e3, masa: true, vol: ['arandela', 'De', 'Di', 'e'], forma: 'arandela',
      nota: 'Tres medidas distintas: diámetro exterior, diámetro del agujero (mordazas de interiores) y espesor.',
      attrs: [
        { id: 'De', nombre: 'Diámetro exterior', kind: 'ext', nom: 16.00, dev: 0.05, conic: 0.01, oval: 0.025, rug: 0.004, dib: 'disco' },
        { id: 'Di', nombre: 'Diámetro interior (agujero)', kind: 'int', nom: 8.40, dev: 0.05, conic: 0.01, oval: 0.02, rug: 0.004, dib: 'agujero', pared: 'Acero' },
        { id: 'e', nombre: 'Espesor', kind: 'ext', nom: 1.60, dev: 0.03, conic: 0.012, oval: 0.008, rug: 0.005, dib: 'laminaV', h: 30 }] },
    { id: 'tubo', nombre: 'Tubo de cobre', mat: 'Cobre', rho: 8.96, k: 1500, masa: true, vol: ['tubo', 'De', 'Di', 'L'], forma: 'tubo',
      nota: 'De pared delgada: se deforma con facilidad, así que el apriete cuenta. Espesor de pared = (De − Di)/2.',
      attrs: [
        { id: 'De', nombre: 'Diámetro exterior', kind: 'ext', nom: 22.00, dev: 0.06, conic: 0.02, oval: 0.05, rug: 0.006, dib: 'disco' },
        { id: 'Di', nombre: 'Diámetro interior', kind: 'int', nom: 19.60, dev: 0.08, conic: 0.02, oval: 0.06, rug: 0.006, dib: 'agujero', pared: 'Cobre' },
        { id: 'L', nombre: 'Longitud', kind: 'ext', nom: 80.00, dev: 0.12, conic: 0, oval: 0.03, rug: 0.01, dib: 'cilH', h: 22 }] },
    { id: 'bloque_ag', nombre: 'Bloque de aluminio con agujero ciego', mat: 'Aluminio', rho: 2.70, k: 4e4, forma: 'bloqueAg',
      nota: 'El agujero tiene dos medidas: su diámetro (interiores) y su profundidad (varilla de profundidad).',
      attrs: [
        { id: 'a', nombre: 'Ancho del bloque', kind: 'ext', nom: 40.00, dev: 0.04, conic: 0.01, oval: 0.008, rug: 0.003, dib: 'rect', h: 30 },
        { id: 'Dh', nombre: 'Diámetro del agujero', kind: 'int', nom: 12.00, dev: 0.03, conic: 0.015, oval: 0.012, rug: 0.003, dib: 'agujero', pared: 'Aluminio' },
        { id: 'P', nombre: 'Profundidad del agujero', kind: 'prof', nom: 18.40, dev: 0.06, conic: 0, oval: 0.015, rug: 0.01, dib: 'ciego', pared: 'Aluminio' }] },
    { id: 'tornillo', nombre: 'Tornillo hexagonal M10', mat: 'Acero', rho: 7.85, k: 6e4, forma: 'tornillo',
      nota: 'Tornillo de rosca métrica gruesa. En una rosca el micrómetro mide sobre las crestas.',
      attrs: [
        { id: 'Dr', nombre: 'Diámetro mayor de la rosca', kind: 'ext', nom: 9.90, dev: 0.03, conic: 0.01, oval: 0.008, rug: 0.006, dib: 'rosca', h: 40 },
        { id: 'C', nombre: 'Cabeza (entre caras)', kind: 'ext', nom: 16.90, dev: 0.04, conic: 0.008, oval: 0.01, rug: 0.004, dib: 'rect', h: 22 },
        { id: 'L', nombre: 'Longitud del vástago', kind: 'ext', nom: 60.00, dev: 0.1, conic: 0, oval: 0.02, rug: 0.01, dib: 'cilH', h: 10 }] },
    { id: 'moneda', nombre: 'Moneda de cuproníquel', mat: 'Cuproníquel', rho: 8.90, k: 3e4, masa: true, vol: ['cilindro', 'D', 'e'], forma: 'moneda',
      nota: 'Un disco: diámetro y espesor. El canto ligeramente irregular hace variar el espesor.',
      attrs: [
        { id: 'D', nombre: 'Diámetro', kind: 'ext', nom: 23.00, dev: 0.04, conic: 0, oval: 0.025, rug: 0.006, dib: 'disco' },
        { id: 'e', nombre: 'Espesor', kind: 'ext', nom: 1.85, dev: 0.03, conic: 0, oval: 0.02, rug: 0.012, dib: 'laminaV', h: 30 }] },
    { id: 'portaobj', nombre: 'Portaobjetos de vidrio', mat: 'Vidrio', rho: 2.50, k: 4e4, masa: true, vol: ['bloque', 'a', 'b', 'e'], forma: 'bloque',
      nota: '1 in × 3 in según el catálogo. Medidas en pulgadas y milímetros: buena práctica de conversión.',
      attrs: [
        { id: 'a', nombre: 'Largo', kind: 'ext', nom: 76.20, dev: 0.1, conic: 0, oval: 0.03, rug: 0.01, dib: 'rect', h: 25 },
        { id: 'b', nombre: 'Ancho', kind: 'ext', nom: 25.40, dev: 0.05, conic: 0, oval: 0.02, rug: 0.008, dib: 'rect', h: 40 },
        { id: 'e', nombre: 'Espesor', kind: 'ext', nom: 1.05, dev: 0.02, conic: 0, oval: 0.01, rug: 0.006, dib: 'laminaV', h: 40 }] },
    { id: 'galga', nombre: 'Galga de espesores 0,50 mm', mat: 'Acero', rho: 7.85, k: 2e4, forma: 'lamina',
      nota: 'Lámina calibrada para separaciones. Su espesor es muy constante.',
      attrs: [{ id: 'e', nombre: 'Espesor', kind: 'ext', nom: 0.500, dev: 0.0006, conic: 0.0003, oval: 0, rug: 0.0004, dib: 'laminaV', h: 60 }] },
    { id: 'papel', nombre: 'Hoja de papel bond', mat: 'Papel', rho: 0.8, k: 3300, forma: 'lamina',
      nota: 'Una sola hoja: el calibrador apenas la distingue. Un micrómetro sí.',
      attrs: [{ id: 'e', nombre: 'Espesor de 1 hoja', kind: 'ext', nom: 0.098, dev: 0.004, conic: 0.002, oval: 0, rug: 0.003, dib: 'laminaV', h: 60 }] },
    { id: 'pila20', nombre: 'Pila de 20 hojas de papel', mat: 'Papel', rho: 0.8, k: 700, forma: 'lamina',
      nota: 'Medir una pila y dividir entre el número de hojas reduce la incertidumbre de cada hoja.',
      attrs: [{ id: 'e', nombre: 'Espesor de las 20 hojas', kind: 'ext', nom: 1.96, dev: 0.06, conic: 0.02, oval: 0, rug: 0.012, dib: 'laminaV', h: 60 }] },
    { id: 'alambre', nombre: 'Alambre de cobre esmaltado', mat: 'Cobre', rho: 8.96, k: 2e4, forma: 'hilo',
      nota: 'Alambre de bobinado: diámetro de fracciones de milímetro.',
      attrs: [{ id: 'D', nombre: 'Diámetro', kind: 'ext', nom: 0.80, dev: 0.02, conic: 0.006, oval: 0.004, rug: 0.002, dib: 'hilo' }] },
    { id: 'cabello', nombre: 'Cabello humano', mat: 'Queratina', rho: 1.3, k: 600, forma: 'hilo',
      nota: 'Alrededor de 0,07 mm. Muy variable de un cabello a otro y a lo largo del mismo.',
      attrs: [{ id: 'D', nombre: 'Diámetro', kind: 'ext', nom: 0.072, dev: 0.012, conic: 0.006, oval: 0.004, rug: 0.003, dib: 'hilo' }] },
    { id: 'oring', nombre: 'Anillo de caucho (O-ring)', mat: 'Caucho', rho: 1.2, k: 55, forma: 'oring',
      nota: 'Material blando: si aprieta de más, el caucho se aplasta y la lectura baja. Use el trinquete.',
      attrs: [{ id: 'd', nombre: 'Diámetro de la sección', kind: 'ext', nom: 3.53, dev: 0.06, conic: 0.02, oval: 0.03, rug: 0.01, dib: 'seccion' }] },
    { id: 'goma', nombre: 'Taco de goma de borrar', mat: 'Goma', rho: 1.1, k: 18, forma: 'goma',
      nota: 'Muy blando: ejemplo extremo de cómo el apriete modifica el resultado.',
      attrs: [{ id: 'a', nombre: 'Espesor', kind: 'ext', nom: 10.00, dev: 0.08, conic: 0.02, oval: 0.02, rug: 0.015, dib: 'rect', h: 30 }] },
  ];
  const objeto = (id) => OBJETOS.find((o) => o.id === id);

  /* ---------- banco: cada banco (1–24) trae sus propios instrumentos y piezas ---------- */
  function banco(n) {
    const R = rng(0x51ed270b ^ Math.imul(n + 7, 2654435761));
    const out = { n, instr: {} };
    INSTRUMENTOS.forEach((I) => {
      const r = rng(hstr('I' + I.id) ^ Math.imul(n + 3, 2246822519));
      const zs = I.tipo === 'vernier' ? [-3, -2, -1, 0, 0, 1, 1, 2, 3, 4] : (I.nonio ? [-6, -4, -3, -2, -1, 0, 1, 2, 3, 5] : [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
      const z = zs[Math.floor(r() * zs.length)];
      const sub = (r() - 0.5) * 0.5;
      out.instr[I.id] = {
        z, e0: (z + sub * (z === 0 ? 0 : 1)) * I.lcMM,          // error de cero (mm)
        kframe: I.tipo === 'vernier' ? 350 + r() * 300 : 4500 + r() * 4000,   // rigidez del marco (N/mm)
        Fr: 5 + r() * 3.5,                                       // fuerza del trinquete (N)
        sesgo: (r() - 0.5) * 2 * I.lcMM * (I.tipo === 'vernier' ? 0.15 : 0.25), // pequeño error de escala dentro de la clase
      };
    });
    out.temp = 20 + Math.round(R() * 30) / 10;
    return out;
  }

  /* pieza concreta de un banco */
  function pieza(n, objId) {
    const o = objeto(objId), res = { obj: o, attrs: {} };
    o.attrs.forEach((a) => {
      const r = rng(hstr(objId + a.id) ^ Math.imul(n + 11, 3266489917));
      const dev = (r() + r() + r() - 1.5) * 2 * a.dev;        // aprox. normal truncada
      res.attrs[a.id] = { nomReal: a.nom + dev, phi: r() * Math.PI, sg: r() < 0.5 ? -1 : 1, a1: r() * 6.28, a2: r() * 6.28, f1: 17 + r() * 14, f2: 4 + r() * 5 };
    });
    return res;
  }
  /* tamaño local (mm) en la posición pos∈[0,1] a lo largo de la pieza y giro ang (rad) */
  function tamLocal(n, objId, attrId, pos, ang) {
    const o = objeto(objId), a = o.attrs.find((x) => x.id === attrId), P = pieza(n, objId).attrs[attrId];
    return P.nomReal + P.sg * a.conic * (pos - 0.5) + a.oval * Math.cos(2 * (ang - P.phi)) + a.rug * (0.6 * Math.sin(P.f1 * pos + P.a1) + 0.4 * Math.sin(P.f2 * ang + P.a2));
  }
  const valorVerdadero = (n, objId, attrId) => pieza(n, objId).attrs[attrId].nomReal;

  /* cálculo del volumen y masa con valores reales de la pieza */
  function volumen(f, d) {
    switch (f) {
      case 'esfera': return Math.PI * Math.pow(d.D, 3) / 6;
      case 'cilindro': return Math.PI * d.D * d.D * (d.L !== undefined ? d.L : d.e) / 4;
      case 'bloque': return d.a * d.b * (d.c !== undefined ? d.c : d.e);
      case 'arandela': return Math.PI * (d.De * d.De - d.Di * d.Di) * d.e / 4;
      case 'tubo': return Math.PI * (d.De * d.De - d.Di * d.Di) * d.L / 4;
    }
    return NaN;
  }
  function masaPieza(n, objId) {
    const o = objeto(objId); if (!o.masa) return null;
    const P = pieza(n, objId), d = {};
    o.attrs.forEach((a) => { d[a.id] = P.attrs[a.id].nomReal; });
    const m = o.rho * volumen(o.vol[0], d) / 1000;           // g
    const r = rng(hstr('m' + objId) ^ n);
    return Math.round((m + (r() - 0.5) * 0.01) * 100) / 100; // balanza de 0,01 g
  }

  /* ---------- contacto con la pieza: fuerza, deformación y lectura ---------- */
  function contacto(I, bco, kind, S, u, metodo, kobj) {
    if (kind === 'libre') return { g: u, F: 0, slip: false, o: 0, d: 0, contacto: false };
    const B = bco.instr[I.id], ext = kind === 'ext' || kind === 'cero';
    const o = ext ? S - u : u - S;
    if (o <= 0) return { g: u, F: 0, slip: false, o: 0, d: 0, contacto: false };
    const kh = I.tipo === 'vernier' ? 22 : 350;               // rigidez de "mano + mecanismo" (N/mm)
    const kt = 1 / (1 / B.kframe + 1 / kobj);
    let F = o / (1 / kh + 1 / kt), slip = false;
    if (I.tipo === 'micro' && metodo === 'trinquete' && F > B.Fr) { F = B.Fr * (1 + 0.03 * Math.sin(o * 53)); slip = true; }
    F = Math.min(F, 250);
    const d = F / kt;
    return { g: (ext || kind === 'prof') ? S - d : S + d, F, slip, o, d, contacto: true };
  }

  /* ¿puede este instrumento medir esa magnitud? */
  function compatible(I, attr, S) {
    if (I.tipo === 'micro' && attr.kind !== 'ext') return { ok: false, razon: 'El micrómetro de exteriores solo mide dimensiones exteriores (entre el yunque y el husillo).' };
    if (S > I.rangoMM + 0.2) return { ok: false, razon: `La pieza (${fmt(S, 1)} mm) excede el recorrido del instrumento (${I.rango} ${I.unidad}).` };
    return { ok: true };
  }

  /* posición del instrumento (mm) a partir de la apertura real */
  const posicion = (I, bco, g) => g + bco.instr[I.id].e0 + bco.instr[I.id].sesgo * (g / Math.max(1, I.rangoMM));

  /* ---------- evaluación de una lectura escrita por el estudiante ---------- */
  function evaluar(I, pMM, texto, unidad, opts) {
    opts = opts || {};
    const L = lectura(I, pMM), v = parseFloat(String(texto).replace(',', '.'));
    if (!Number.isFinite(v)) return { ok: false, tipo: 'vacio', msg: 'Escriba un número (puede usar coma o punto decimal).' };
    const verdad = L.valor, f = I.f;
    const mm = aMM(v, unidad), userInstr = mm / f;                  // en unidad del instrumento
    const tolFin = opts.tolerancia !== undefined ? opts.tolerancia : 0.51 * I.lc;
    const dif = userInstr - verdad;
    if (Math.abs(dif) <= tolFin) return { ok: true, tipo: 'ok', msg: 'La lectura coincide con la del instrumento.', mm, L };
    const u = I.unidad;
    // errores típicos
    const ratio = verdad !== 0 ? userInstr / verdad : NaN;
    const cand = [[10, 'milímetros y centímetros (×10)'], [100, '×100'], [1000, 'milímetros y metros o micras (×1000)'], [25.4, 'pulgadas y milímetros (×25,4)']];
    for (const [k, t] of cand) {
      if (Math.abs(ratio - k) < 0.02 * k || Math.abs(ratio - 1 / k) < 0.02 / k) {
        return { ok: false, tipo: 'unidad', msg: `El número que escribió, en ${UNIDADES[unidad].sim}, equivale a ${fmt(userInstr, I.dec + 2)} ${u} y el instrumento marca otro valor: parece una confusión de unidades (${t}). Revise la unidad seleccionada y la conversión.`, L };
      }
    }
    if (opts.cero !== undefined && Math.abs(userInstr - (verdad - opts.cero)) <= tolFin)
      return { ok: false, tipo: 'cero', msg: 'Parece que ya le restó el error de cero. En esta casilla escriba la lectura tal como la marca el instrumento (lectura bruta); la corrección se hace después, en el cuaderno.', L };
    const paso = I.tipo === 'micro' ? I.paso : I.div;
    if (Math.abs(Math.abs(dif) - paso) <= tolFin) {
      return { ok: false, tipo: 'paso', msg: I.tipo === 'micro'
        ? `La diferencia es de ${fmt(paso, I.unidad === 'mm' ? 1 : 3)} ${u}, justo una vuelta del tambor: revise si la marca de medio milímetro del manguito está visible (o no) y cuéntela bien.`
        : `La diferencia es de ${fmt(paso, I.unidad === 'mm' ? 0 : 3)} ${u}, una división de la escala principal: revise qué marca queda justo a la izquierda del cero del nonio.`, L };
    }
    if (I.tipo === 'micro' && I.unidad === 'mm' && Math.abs(Math.abs(dif) - 2 * paso) <= tolFin) return { ok: false, tipo: 'paso', msg: 'La diferencia es de 1 mm: recuente las marcas del manguito.', L };
    if (Math.abs(dif) <= 3.01 * I.lc) return { ok: false, tipo: 'cerca', msg: I.tipo === 'vernier' ? 'Está cerca: revise cuál es la línea del nonio que coincide <i>mejor</i> con una línea de la regla (las vecinas se ven casi alineadas).' : 'Está cerca: revise qué línea del tambor queda frente a la línea de referencia del manguito.', L };
    if (Math.abs(dif) <= 10 * (I.tipo === 'vernier' ? I.div : I.paso)) return { ok: false, tipo: 'otra', msg: 'No coincide con el instrumento. Repase con calma: primero la escala principal (o el manguito), después el nonio (o el tambor), y al final sume.', L };
    return { ok: false, tipo: 'lejos', msg: 'La lectura difiere mucho de la del instrumento. Revise la unidad y el orden de magnitud.', L };
  }

  /* ---------- estadística ---------- */
  function estadistica(x) {
    const n = x.length;
    if (!n) return { n: 0, media: NaN, s: NaN, sm: NaN };
    const media = x.reduce((a, b) => a + b, 0) / n;
    const s = n > 1 ? Math.sqrt(x.reduce((a, b) => a + (b - media) * (b - media), 0) / (n - 1)) : 0;
    return { n, media, s, sm: n > 1 ? s / Math.sqrt(n) : 0, min: Math.min(...x), max: Math.max(...x) };
  }
  /* incertidumbre combinada: instrumento (lc/2, rectangular) + repetibilidad (s/√n) + corrección del cero (lc/2) */
  function incertidumbre(lcMM, st, conCero) {
    const ui = lcMM / 2;
    const uc = conCero ? lcMM / 2 : 0;
    return Math.sqrt(ui * ui + (st.sm || 0) * (st.sm || 0) + uc * uc);
  }
  /* redondea u a 1 o 2 cifras significativas; el resultado se redondea a la misma posición decimal */
  function redondeoInc(valor, u) {
    if (!(u > 0) || !Number.isFinite(u)) return { v: valor, u, dec: 3 };
    const e = Math.floor(Math.log10(u));
    const lead = u / Math.pow(10, e);
    const cs = lead < 2 ? 2 : 1;                              // convención: 2 cifras si empieza por 1
    const dec = Math.max(0, cs - 1 - e);
    const q = Math.pow(10, -dec);
    return { v: Math.round(valor / q) * q, u: Math.round(u / q) * q, dec };
  }

  /* ---------- entrenador ---------- */
  function lecturaAleatoria(I, r) {
    const max = I.tipo === 'vernier' ? Math.min(I.rango, I.unidad === 'mm' ? 135 : 5.4) : I.rango;
    const cmax = Math.floor(max / I.lc);
    const c = Math.floor(r() * (cmax + 1));
    return { pMM: c * I.lc * I.f, c };
  }

  return { UNIDADES, aMM, deMM, convertir, fmt, cifras, decimales, rng, hstr, INSTRUMENTOS, instr, lectura, pasos, MATERIALES, OBJETOS, objeto,
    banco, pieza, tamLocal, valorVerdadero, volumen, masaPieza, contacto, compatible, posicion, evaluar, estadistica, incertidumbre, redondeoInc, lecturaAleatoria };
})();
if (typeof module !== 'undefined') module.exports = METRO;
