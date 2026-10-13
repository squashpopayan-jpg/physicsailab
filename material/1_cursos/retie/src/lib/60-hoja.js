/* ===================================================================
   lib/60-hoja.js — Plantilla de hoja de cálculo del cuadro de cargas
   Una sola definición para el archivo XLSX (tools/xlsx.py) y para el
   simulador de fórmulas: cada celda trae su dato (v) o su fórmula (f) y,
   en las fórmulas, el valor que debe dar (calc) según la biblioteca.
   Las fórmulas usan nombres en inglés y separador «,» (formato del archivo);
   Excel y LibreOffice las muestran traducidas al abrirlo.
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});

  L.HOJA = function (casa) {
    const N = L.N, C = L.C, Q = L.Q, K = casa;
    const hojas = [];
    const nueva = (nombre, anchos) => { const h = { nombre, anchos, celdas: {} }; hojas.push(h); return h; };
    const put = (h, ref, o) => { h.celdas[ref] = typeof o === 'object' && o !== null ? o : { v: o }; };

    /* ---------- Tablas ---------- */
    const T = nueva('Tablas', { A: 10, B: 12, C: 12, D: 12, E: 16, F: 16, G: 46 });
    put(T, 'A1', { v: 'Tablas de conductores de cobre THHN/THWN-2', s: 'titulo' });
    ['AWG', 'Área (mm²)', 'Iz 60 °C (A)', 'Iz 75 °C (A)', 'Protección máx. (A)', 'R Cu 75 °C (Ω/km)'].forEach((t, i) => put(T, 'ABCDEF'[i] + '3', { v: t, s: 'cab' }));
    const awgs = N.AWG.slice(0, 9);
    const fT = 4, lT = fT + awgs.length - 1, RANGO = `Tablas!$A$${fT}:$F$${lT}`;
    awgs.forEach((a, i) => {
      const r = fT + i;
      put(T, 'A' + r, { v: a, s: 'dato', t: 'txt' });
      put(T, 'B' + r, { v: +C.awgArea(a).toFixed(3), s: 'dato', n: '0.000' });
      put(T, 'C' + r, { v: N.AMPACIDAD[a][0], s: 'dato' });
      put(T, 'D' + r, { v: N.AMPACIDAD[a][1], s: 'dato' });
      put(T, 'E' + r, { v: C.protMax(a, 60), s: 'dato' });
      put(T, 'F' + r, { v: +C.rCu(a, 75).toFixed(3), s: 'dato', n: '0.000' });
    });
    put(T, 'G3', { v: 'Fuente', s: 'cab' });
    put(T, 'G4', { v: 'Capacidad: NTC 2050, Tabla 310.15(B)(16), columnas de 60 °C y 75 °C.' });
    put(T, 'G5', { v: 'Protección máxima: 240.4(D) para 14, 12 y 10 AWG; 240.4(B) para los demás.' });
    put(T, 'G6', { v: 'Resistencia: calculada a 75 °C con ρ(20 °C) = 0,017241 Ω·mm²/m.' });
    put(T, 'G7', { v: 'Verifique los valores en la NTC 2050 oficial antes de usarlos en un diseño.' });

    /* ---------- Demanda ---------- */
    const est = K.electrico.puntos.filter((p) => p.tipo === 'estufa').map((p) => p.W / 1000);
    const fij = K.electrico.puntos.filter((p) => p.tipo === 'ducha');
    const dem = Q.demanda(K);
    const D = nueva('Demanda', { A: 46, B: 14, C: 30 });
    put(D, 'A1', { v: 'Demanda de la vivienda por el método estándar (NTC 2050, artículo 220)', s: 'titulo' });
    put(D, 'A2', { v: 'Celdas azules: datos del caso. Celdas negras: fórmulas.', s: 'nota' });
    const area = K.areaConstruida();
    const sub = area * N.CARGA.alumbradoGeneral + 2 * N.CARGA.pequenosArtefactos + N.CARGA.lavanderia;
    const filasD = [
      [3, 'Área construida por caras exteriores (m²)', { v: +area.toFixed(4), s: 'dato', n: '0.00' }, '220.12'],
      [4, 'Carga unitaria de alumbrado (VA/m²)', { v: N.CARGA.alumbradoGeneral, s: 'dato' }, 'Tabla 220.12'],
      [5, 'Alumbrado y tomas generales (VA)', { f: '=B3*B4', calc: area * N.CARGA.alumbradoGeneral, n: '0' }, '220.14(J)'],
      [6, 'Circuitos de pequeños artefactos (n)', { v: 2, s: 'dato' }, '210.11(C)(1)'],
      [7, 'VA por circuito de pequeños artefactos', { v: N.CARGA.pequenosArtefactos, s: 'dato' }, '220.52(A)'],
      [8, 'Circuitos de lavandería (n)', { v: 1, s: 'dato' }, '210.11(C)(2)'],
      [9, 'VA por circuito de lavandería', { v: N.CARGA.lavanderia, s: 'dato' }, '220.52(B)'],
      [10, 'Subtotal sujeto a factores (VA)', { f: '=B5+B6*B7+B8*B9', calc: sub, n: '0' }, ''],
      [11, 'Primeros 3 000 VA al 100 %', { f: '=MIN(B10,3000)', calc: Math.min(sub, 3000), n: '0' }, 'Tabla 220.42'],
      [12, 'De 3 001 a 120 000 VA al 35 %', { f: '=MAX(MIN(B10,120000)-3000,0)*0.35', calc: Math.max(Math.min(sub, 120000) - 3000, 0) * 0.35, n: '0' }, 'Tabla 220.42'],
      [13, 'Más de 120 000 VA al 25 %', { f: '=MAX(B10-120000,0)*0.25', calc: Math.max(sub - 120000, 0) * 0.25, n: '0' }, 'Tabla 220.42'],
      [14, 'Estufa eléctrica: potencia de placa (kW)', { v: est.length ? est[0] : 0, s: 'dato', n: '0.0' }, ''],
      [15, 'Demanda de la estufa (VA)', { f: '=IF(B14=0,0,IF(B14<=8.75,0.8*B14*1000,IF(B14<=12,8000,8000*(1+0.05*ROUNDUP(B14-12,0)))))', calc: dem.pasos.filter((p) => /Estufa/.test(p.t)).reduce((s, p) => s + p.va, 0), n: '0' }, 'Tabla 220.55, nota 3'],
      [16, 'Artefactos fijos: potencia total (W)', { v: fij.reduce((s, p) => s + p.W, 0), s: 'dato' }, ''],
      [17, 'Número de artefactos fijos', { v: fij.length, s: 'dato' }, ''],
      [18, 'Demanda de artefactos fijos (VA)', { f: '=B16*IF(B17>=4,0.75,1)', calc: fij.reduce((s, p) => s + p.W, 0) * (fij.length >= 4 ? 0.75 : 1), n: '0' }, '220.53'],
      [19, 'Demanda total (VA)', { f: '=B11+B12+B13+B15+B18', calc: dem.total, n: '0', s: 'total' }, ''],
      [20, 'Corriente de demanda a 240 V (A)', { f: '=B19/240', calc: dem.I240, n: '0.0', s: 'total' }, '']
    ];
    for (const [r, t, cel, ref] of filasD) { put(D, 'A' + r, t); put(D, 'B' + r, cel); if (ref) put(D, 'C' + r, { v: ref, s: 'ref' }); }

    /* ---------- Acometida ---------- */
    const ac = Q.acometida(K);
    const A = nueva('Acometida', { A: 46, B: 14, C: 30 });
    put(A, 'A1', { v: 'Acometida y alimentador del tablero general', s: 'titulo' });
    const R6 = C.rCu(ac.awg, 75);
    const filasA = [
      [3, 'Corriente de demanda (A)', { f: '=Demanda!B20', calc: ac.I, n: '0.0' }, ''],
      [4, 'Calibre de cobre (AWG)', { v: ac.awg, s: 'dato', t: 'txt' }, 'RETIE Título 26 d'],
      [5, 'Capacidad a 60 °C (A)', { f: `=VLOOKUP(B4&"",${RANGO},3,FALSE)`, calc: N.AMPACIDAD[ac.awg][0], n: '0' }, 'Tabla 310.15(B)(16)'],
      [6, '¿Capacidad ≥ corriente de demanda?', { f: '=IF(B5>=B3,"Cumple","Revisar")', calc: N.AMPACIDAD[ac.awg][0] >= ac.I ? 'Cumple' : 'Revisar' }, ''],
      [7, 'Totalizador (A)', { f: `=VLOOKUP(B4&"",${RANGO},5,FALSE)`, calc: ac.In, n: '0' }, '240.4(B)'],
      [8, 'Longitud medidor–tablero con bajantes (m)', { v: +ac.Lal.toFixed(2), s: 'dato', n: '0.00' }, 'Medida en el modelo'],
      [9, 'Resistencia del conductor a 75 °C (Ω/km)', { f: `=VLOOKUP(B4&"",${RANGO},6,FALSE)`, calc: +R6.toFixed(3), n: '0.000' }, ''],
      [10, 'Caída de tensión (%)', { f: '=200*B3*B9/1000*B8/240', calc: (200 * ac.I * +R6.toFixed(3) / 1000 * +ac.Lal.toFixed(2)) / 240, n: '0.00' }, ''],
      [11, '¿Caída ≤ 3 %?', { f: '=IF(B10<=3,"Cumple","Revisar")', calc: 'Cumple' }, 'Criterio de la guía'],
      [12, 'Capacidad instalable (kVA)', { f: '=B5*240/1000', calc: ac.ci.kVA, n: '0.0' }, 'RETIE Libro 1']
    ];
    for (const [r, t, cel, ref] of filasA) { put(A, 'A' + r, t); put(A, 'B' + r, cel); if (ref) put(A, 'C' + r, { v: ref, s: 'ref' }); }

    /* ---------- Cuadro ---------- */
    const Cu = nueva('Cuadro', { A: 9, B: 38, C: 9, D: 7, E: 9, F: 9, G: 12, H: 12, I: 11, J: 11, K: 11, L: 10, M: 9, N: 9, O: 10, P: 11, Q: 11, R: 12, S: 11, T: 11, U: 11, V: 11, W: 10, X: 11, Y: 10 });
    put(Cu, 'A1', { v: 'Cuadro de cargas · ' + K.nombre, s: 'titulo' });
    put(Cu, 'A2', { v: 'Monofásico trifilar 120/240 V · tablero TG · celdas azules: datos del caso; negras: fórmulas. Propuesta académica; no apta para construcción.', s: 'nota' });
    const cab = ['Circuito', 'Descripción', 'Tensión (V)', 'Fase', 'Tomas generales (n)', 'VA por toma', 'Alumbrado y especiales (W)', 'Mínimo por norma (VA)', 'Carga (VA)', 'Corriente (A)', 'Protección (A)', 'Conductor (AWG)', 'Tierra (AWG)', 'Tubo PVC (in)', 'Iz 60 °C (A)', 'Protección máx. (A)', 'Carga / protección', 'Protección', 'VA fase A', 'VA fase B', 'Longitud al más lejano (m)', 'R 75 °C (Ω/km)', 'Caída del ramal (%)', 'Caída total (%)', 'Caída ≤ 5 %'];
    const COL = 'ABCDEFGHIJKLMNOPQRSTUVWXY';
    cab.forEach((t, i) => put(Cu, COL[i] + '4', { v: t, s: 'cab' }));
    const filas = Q.cuadro(K), caidas = Q.caidas(K);
    const f0 = 5;
    const acPct = (200 * ac.I * +R6.toFixed(3) / 1000 * +ac.Lal.toFixed(2)) / 240;
    filas.forEach((r, i) => {
      const n = f0 + i, c = r.c;
      const P = K.electrico.puntos.filter((p) => p.c === c.id);
      const tomas = P.filter((p) => p.tipo === 'toma').length;
      const W = P.filter((p) => ['lum', 'aplique', 'ducha', 'estufa'].includes(p.tipo)).reduce((s, p) => s + (p.W || 0), 0);
      const min = L.Q.circuitosEspeciales && L.Q.circuitosEspeciales[c.id] ? L.Q.circuitosEspeciales[c.id] : 0;
      const va = Math.max(tomas * N.CARGA.tomaGeneral + W, min);
      const I = va / c.V, pmax = C.protMax(c.awg, 60), Lm = +caidas[i].Lmax.toFixed(2), Rr = +C.rCu(c.awg, 75).toFixed(3);
      const caida = (200 * I * Rr / 1000 * Lm) / c.V;
      r._hoja = { va, tomas, W, min };
      put(Cu, 'A' + n, { v: c.id, s: 'dato' });
      put(Cu, 'B' + n, { v: c.nombre, s: 'dato' });
      put(Cu, 'C' + n, { v: c.V, s: 'dato' });
      put(Cu, 'D' + n, { v: c.fase, s: 'dato' });
      put(Cu, 'E' + n, { v: tomas, s: 'dato' });
      put(Cu, 'F' + n, { v: N.CARGA.tomaGeneral, s: 'dato' });
      put(Cu, 'G' + n, { v: W, s: 'dato' });
      put(Cu, 'H' + n, { v: min, s: 'dato' });
      put(Cu, 'I' + n, { f: `=MAX(E${n}*F${n}+G${n},H${n})`, calc: va, n: '0' });
      put(Cu, 'J' + n, { f: `=I${n}/C${n}`, calc: I, n: '0.0' });
      put(Cu, 'K' + n, { v: c.In, s: 'dato' });
      put(Cu, 'L' + n, { v: c.awg, s: 'dato', t: 'txt' });
      put(Cu, 'M' + n, { v: c.tierra, s: 'dato', t: 'txt' });
      put(Cu, 'N' + n, { v: c.tubo, s: 'dato', t: 'txt' });
      put(Cu, 'O' + n, { f: `=VLOOKUP(L${n}&"",${RANGO},3,FALSE)`, calc: N.AMPACIDAD[c.awg][0], n: '0' });
      put(Cu, 'P' + n, { f: `=VLOOKUP(L${n}&"",${RANGO},5,FALSE)`, calc: pmax, n: '0' });
      put(Cu, 'Q' + n, { f: `=J${n}/K${n}`, calc: I / c.In, n: '0%' });
      put(Cu, 'R' + n, { f: `=IF(AND(K${n}>=J${n},K${n}<=P${n}),"Cumple","Revisar")`, calc: c.In >= I && c.In <= pmax ? 'Cumple' : 'Revisar' });
      put(Cu, 'S' + n, { f: `=IF(D${n}="A",I${n},IF(D${n}="AB",I${n}/2,0))`, calc: c.fase === 'A' ? va : c.fase === 'AB' ? va / 2 : 0, n: '0' });
      put(Cu, 'T' + n, { f: `=IF(D${n}="B",I${n},IF(D${n}="AB",I${n}/2,0))`, calc: c.fase === 'B' ? va : c.fase === 'AB' ? va / 2 : 0, n: '0' });
      put(Cu, 'U' + n, { v: Lm, s: 'dato', n: '0.00' });
      put(Cu, 'V' + n, { f: `=VLOOKUP(L${n}&"",${RANGO},6,FALSE)`, calc: Rr, n: '0.000' });
      put(Cu, 'W' + n, { f: `=200*J${n}*V${n}/1000*U${n}/C${n}`, calc: caida, n: '0.00' });
      put(Cu, 'X' + n, { f: `=W${n}+Acometida!$B$10`, calc: caida + acPct, n: '0.00' });
      put(Cu, 'Y' + n, { f: `=IF(X${n}<=5,"Cumple","Revisar")`, calc: caida + acPct <= 5 ? 'Cumple' : 'Revisar' });
    });
    const fl = f0 + filas.length - 1, ft = fl + 1;
    const bal = Q.balance(K);
    put(Cu, 'A' + ft, { v: 'Totales', s: 'total' });
    put(Cu, 'I' + ft, { f: `=SUM(I${f0}:I${fl})`, calc: filas.reduce((s, r) => s + r._hoja.va, 0), n: '0', s: 'total' });
    put(Cu, 'S' + ft, { f: `=SUM(S${f0}:S${fl})`, calc: bal.A, n: '0', s: 'total' });
    put(Cu, 'T' + ft, { f: `=SUM(T${f0}:T${fl})`, calc: bal.B, n: '0', s: 'total' });
    put(Cu, 'R' + (ft + 1), { v: 'Desbalance', s: 'total' });
    put(Cu, 'S' + (ft + 1), { f: `=ABS(S${ft}-T${ft})/(S${ft}+T${ft})`, calc: bal.desb, n: '0.0%', s: 'total' });
    put(Cu, 'R' + (ft + 2), { v: 'Neutro (A)', s: 'total' });
    put(Cu, 'S' + (ft + 2), { f: `=ABS(S${ft}-T${ft})/120`, calc: bal.IN, n: '0.0', s: 'total' });
    put(Cu, 'A' + (ft + 2), { v: 'Las cargas de los circuitos de cocina y ropas usan el mínimo de 1 500 VA (220.52); la caída del ramal supone toda la carga en el punto más lejano.', s: 'nota' });

    /* ---------- Léame ---------- */
    const Le = nueva('Léame', { A: 110 });
    [
      ['Plantilla del cuadro de cargas · guía «Cableado con criterio»', 'titulo'],
      ['Elaborado por Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca', 'nota'],
      [''],
      ['Hojas: Cuadro (circuitos ramales), Demanda (método estándar de la NTC 2050), Acometida (calibre, totalizador y caída) y Tablas (conductores).'],
      ['Celdas azules: datos que cambia el equipo para su caso. Celdas negras: fórmulas; no las sobrescriba.'],
      ['Los calibres se escriben como texto (14, 12, 10, 1/0); las fórmulas buscan en la hoja Tablas.'],
      ['Los valores de la casa ejemplo coinciden con los capítulos 24 y 25 de la guía.'],
      [''],
      ['Propuesta académica de coordinación; no apta para construcción. RETIE: Res. 40117 de 2024, modificada por las Res. 40304 de 2025 y 40284 de 2026.', 'nota']
    ].forEach(([t, s], i) => put(Le, 'A' + (i + 1), s ? { v: t, s } : t));
    hojas.unshift(hojas.pop());
    /* orden final: Léame, Cuadro, Demanda, Acometida, Tablas */
    const orden = ['Léame', 'Cuadro', 'Demanda', 'Acometida', 'Tablas'];
    hojas.sort((a, b) => orden.indexOf(a.nombre) - orden.indexOf(b.nombre));
    return { hojas, fila0: f0, filaTot: ft };
  };
})(typeof window !== 'undefined' ? window : globalThis);
