/* ===================================================================
   lib/90-pruebas.js — Pruebas de la biblioteca de cálculo y de los archivos
   Cada prueba: qué se calcula, el valor obtenido, la referencia, la fuente y
   la tolerancia. La referencia es un valor publicado (NTC 2050, NEC, IEEE,
   UL) o un cálculo hecho a mano, independiente del código que se prueba.
   Se ejecutan en el navegador (apéndice D) y en Node (tests/validar.js).
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});

  L.PRUEBAS = function () {
    const N = L.N, C = L.C, K = L.CASA, Q = L.Q, R = L.R, G = L.G;
    const P = [];
    const add = (cap, que, calc, ref, tol, fuente, o = {}) => P.push(Object.assign({ id: 'p' + (P.length + 1), cap, que, calc, ref, tol, fuente }, o));
    const kft = (x) => x / 0.3048; /* Ω/kpie → Ω/km */

    /* Conductores */
    add(5, 'Área del 14 AWG (mm²)', () => C.awgArea('14'), 2.08, 0.01, 'NTC 2050, Cap. 9, Tabla 8');
    add(5, 'Área del 12 AWG (mm²)', () => C.awgArea('12'), 3.31, 0.01, 'NTC 2050, Cap. 9, Tabla 8');
    add(5, 'Área del 10 AWG (mm²)', () => C.awgArea('10'), 5.26, 0.01, 'NTC 2050, Cap. 9, Tabla 8');
    add(5, 'Área del 6 AWG (mm²)', () => C.awgArea('6'), 13.3, 0.05, 'NTC 2050, Cap. 9, Tabla 8');
    add(5, 'Resistencia del 14 AWG sólido a 75 °C (Ω/km)', () => C.rCu('14', 75), kft(3.07), 0.05, 'Cap. 9, Tabla 8: 3,07 Ω/kpie');
    add(5, 'Resistencia del 12 AWG sólido a 75 °C (Ω/km)', () => C.rCu('12', 75), kft(1.93), 0.05, 'Cap. 9, Tabla 8: 1,93 Ω/kpie');
    add(5, 'Resistencia del 10 AWG sólido a 75 °C (Ω/km)', () => C.rCu('10', 75), kft(1.21), 0.05, 'Cap. 9, Tabla 8: 1,21 Ω/kpie');
    add(5, 'Resistencia del 8 AWG cableado a 75 °C (Ω/km)', () => C.rCu('8', 75), kft(0.778), 0.03, 'Cap. 9, Tabla 8: 0,778 Ω/kpie');
    add(5, 'Resistencia del 6 AWG cableado a 75 °C (Ω/km)', () => C.rCu('6', 75), kft(0.491), 0.03, 'Cap. 9, Tabla 8: 0,491 Ω/kpie');
    add(5, 'Factor por temperatura, aislamiento de 60 °C a 35 °C', () => C.factorTemp(60, 35), 0.91, 0.005, 'Tabla 310.15(B)(2)(a)');
    add(5, 'Factor por temperatura, aislamiento de 60 °C a 40 °C', () => C.factorTemp(60, 40), 0.82, 0.005, 'Tabla 310.15(B)(2)(a)');
    add(5, 'Factor por temperatura, aislamiento de 75 °C a 40 °C', () => C.factorTemp(75, 40), 0.88, 0.005, 'Tabla 310.15(B)(2)(a)');

    /* Demanda */
    add(24, 'Demanda del Ejemplo D1(a) de la NEC (VA)', () => C.demandaVivienda({ area: 4500 / N.CARGA.alumbradoGeneral, estufas: [12], secadoras: [5500] }).total, 18600, 0.5, 'NEC, Anexo D, Ejemplo D1(a)');
    add(24, 'Corriente del Ejemplo D1(a) a 240 V (A)', () => C.demandaVivienda({ area: 4500 / N.CARGA.alumbradoGeneral, estufas: [12], secadoras: [5500] }).I240, 77.5, 0.05, 'NEC, Anexo D, Ejemplo D1(a)');
    add(24, 'Demanda de la casa ejemplo (VA)', () => Q.demanda(K).total, () => { const s = 33 * 8.15 * 10.15 + 2 * 1500 + 1500; return 3000 + 0.35 * (s - 3000) + 0.8 * 6000 + 3500; }, 0.5, 'Cálculo a mano: 220.42, 220.55 y 220.53');
    add(24, 'Desbalance entre fases de la casa ejemplo', () => Q.balance(K).desb, () => { let A = 0, B = 0; for (const r of Q.cuadro(K)) { if (r.fase === 'A') A += r.va; else if (r.fase === 'B') B += r.va; else { A += r.va / 2; B += r.va / 2; } } return Math.abs(A - B) / (A + B); }, 1e-9, 'Suma a mano de las cargas por fase');

    /* Caída de tensión */
    const c7 = Q.caidas(K).find((c) => c.id === 'C7');
    add(25, 'Caída de tensión del circuito de la ducha C7 (%)', () => c7.pct, () => (200 * (3500 / 120) * (kft(1.21) / 1000) * c7.Lmax) / 120, 0.02, '2·I·R·L/V con R de la Tabla 8');
    add(25, 'Caída de tensión de la acometida (%)', () => Q.acometida(K).dv.pct, () => { const a = Q.acometida(K); return (200 * a.I * (kft(0.491) / 1000) * a.Lal) / 240; }, 0.02, '2·I·R·L/V con R de la Tabla 8');

    /* Tubos y cajas */
    add(12, 'Llenado de tres 12 AWG THHN en PVC de 1/2 in (%)', () => C.llenado(['12', '12', '12'], 'PVC', '1/2').pct, (100 * 3 * 8.581) / 184, 0.1, 'Cap. 9, Tablas 4 y 5');
    add(12, 'Volumen ocupado: 4 × 12 AWG, un aparato y tierras (cm³)', () => C.volumenCaja({ conds: ['12', '12', '12', '12'], aparatos: 1, tierras: 2 }), 7 * 2.25 * 16.387, 0.5, '314.16(B): 7 × 2,25 in³');

    /* Protecciones */
    add(6, 'Tiempo de disparo del GFCI a 20 mA (s)', () => C.gfciT(20), 1, 1e-9, 'UL 943: T = (20/I)^1,43');
    add(6, 'Tiempo de disparo del GFCI a 6 mA (s)', () => C.gfciT(6), Math.exp(1.43 * Math.log(20 / 6)), 1e-9, 'UL 943: T = (20/I)^1,43');
    add(6, 'Curva C a 1,13·In: tiempo mínimo de disparo ≥ 1 h', () => (C.disparo(1.13, 'C').tmin >= 3600 ? 1 : 0), 1, 0, 'IEC 60898-1, corriente convencional de no disparo');
    add(6, 'Curva C a 1,45·In: dispara antes de 1 h', () => (C.disparo(1.45, 'C').tmax < 3600 ? 1 : 0), 1, 0, 'IEC 60898-1, corriente convencional de disparo');
    add(6, 'Curva C a 10·In: disparo instantáneo (≤ 0,1 s)', () => (C.disparo(10, 'C').tmax <= 0.1 ? 1 : 0), 1, 0, 'IEC 60898-1, curva C (5 a 10 In)');
    add(6, 'Curva C a 4·In: aún no es instantáneo', () => (C.disparo(4, 'C').tmin > 0.1 ? 1 : 0), 1, 0, 'IEC 60898-1, curva C (5 a 10 In)');

    /* Puesta a tierra */
    add(7, 'Varilla de 5/8 in × 3,05 m en 100 Ω·m (Ω)', () => C.rVarilla(100, 3.05, 15.9), 33, 1, 'IEEE Std 142, fórmula de Dwight (≈ 33 Ω)');
    add(7, 'Dos varillas de la casa ejemplo (Ω)', () => C.rVarillas(100, 2.4, 15.9, K.electrico.tierra.varillas).R, () => { const a = 0.0159 / 2, R1 = (100 / (2 * Math.PI * 2.4)) * (Math.log((4 * 2.4) / a) - 1); return (R1 + 100 / (2 * Math.PI * 2.4)) / 2; }, 0.01, 'Cálculo a mano: (R1 + ρ/2πs)/2');
    add(7, 'Wenner en suelo homogéneo: ρa = ρ (Ω·m)', () => C.wenner2(2, 150, 150, 1), 150, 1e-9, 'Identidad');
    add(7, 'Wenner con capa superior gruesa: ρa → ρ1', () => C.wenner2(0.5, 100, 300, 50), 100, 1, 'Límite h ≫ a');
    add(7, 'Wenner con capa superior delgada: ρa → ρ2', () => C.wenner2(200, 100, 300, 0.2), 300, 3, 'Límite h ≪ a');
    add(7, 'Caída de potencial con la sonda al 61,8 % (Ω)', () => C.caidaPotencial(0.618 * 50, 50, 100, 20), 20, 0.2, 'Regla del 61,8 % (Tagg)');

    /* Iluminación */
    add(20, 'Índice del local de la sala-comedor', () => C.indiceLocal(4.65, 5.45, 1.75), (4.65 * 5.45) / (1.75 * (4.65 + 5.45)), 1e-12, 'K = L·W/(h·(L + W))');
    add(20, 'Flujo que llega a un plano infinito desde una luminaria (lm)', () => { let s = 0; const H = 1.75, n = 40000, rmax = 400 * H; for (let i = 0; i < n; i++) { const r = ((i + 0.5) / n) * rmax; s += C.eDirecta(r, 0, H, 2400) * 2 * Math.PI * r * (rmax / n); } return s; }, 2400, 0.01, 'Conservación del flujo: ∫E dA = Φ', { rel: true });

    /* Reglas del diseño */
    add(21, 'Hallazgos «no cumple» en la casa ejemplo', () => G.verificar(K).filter((h) => h.estado === 'falla').length, 0, 0, 'Reglas 210.52, 210.8, 3.17.8 (capítulo 21)');
    add(22, 'Tramos con llenado de tubo excedido', () => R.tramos(K).filter((t) => !t.llenado.ok).length, 0, 0, 'Cap. 9, Tabla 1');
    add(23, 'Interferencias críticas (en zona de confinamiento)', () => R.interferencias(K).filter((i) => i.critico).length, 0, 0, 'Criterio de coordinación (capítulo 23)');

    /* Hoja de cálculo */
    add(32, 'Hoja: diferencia máxima de cargas con el cuadro (VA)', () => { const h = L.HOJA(K).hojas.find((x) => x.nombre === 'Cuadro').celdas; return Math.max(...Q.cuadro(K).map((r, i) => Math.abs(h['I' + (5 + i)].calc - r.va))); }, 0, 1e-9, 'lib/60-hoja.js contra lib/50-cargas.js');
    add(32, 'Hoja: demanda total igual a la del capítulo 24 (VA)', () => L.HOJA(K).hojas.find((x) => x.nombre === 'Demanda').celdas.B19.calc, () => Q.demanda(K).total, 1e-9, 'lib/60-hoja.js contra lib/50-cargas.js');

    /* Archivos del kit (solo si están cargados los módulos de dibujo) */
    if (RT.dibujoCasa && RT.dxf && RT.zip) {
      const D = RT.dibujoCasa(K), txt = RT.dxf(D);
      add(29, 'DXF: secciones abiertas menos cerradas', () => (txt.match(/\r\nSECTION\r\n/g) || []).length - (txt.match(/\r\nENDSEC\r\n/g) || []).length, 0, 0, 'Estructura DXF R12');
      add(29, 'DXF: capas usadas sin declarar', () => { const dec = new Set(['0'].concat(D.capas.map((c) => c.n))); return new Set(D.ents.map((e) => e.l).filter((l) => !dec.has(l))).size; }, 0, 0, 'Tabla LAYER del DXF');
      add(29, 'DXF: caracteres que no caben en ANSI_1252', () => { const b = RT.dxfBytes(D); let q = 0, qt = 0; for (const x of b) if (x === 0x3F) q++; for (const ch of txt) if (ch === '?') qt++; return q - qt; }, 0, 0, 'Página de códigos declarada');
      add(29, 'ZIP: CRC-32 de «123456789»', () => { const z = RT.zip([{ name: 'a', data: '123456789' }]); return (z[14] | (z[15] << 8) | (z[16] << 16) | (z[17] << 24)) >>> 0; }, 0xCBF43926, 0, 'Valor de comprobación del CRC-32 (ISO 3309)');
    }
    return P;
  };

  /* Ejecuta una prueba y devuelve {v, ref, err, ok} */
  L.ejecutarPrueba = function (p) {
    try {
      const v = p.calc(), ref = typeof p.ref === 'function' ? p.ref() : p.ref;
      const err = p.rel ? Math.abs(v - ref) / Math.abs(ref) : Math.abs(v - ref);
      return { v, ref, err, ok: isFinite(err) && err <= p.tol + 1e-12 };
    } catch (e) { return { v: NaN, ref: NaN, err: NaN, ok: false, msg: e.message }; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
