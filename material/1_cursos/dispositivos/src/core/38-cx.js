/* ===================================================================
   38-cx.js — Ayudas para escribir circuitos de los capítulos (EM.cx)
   ladder({ src, items, gnd }) → especificación para EM.Net.fromSpec con la fuente a la izquierda,
   elementos en serie por el riel superior (y = 6) y en derivación hacia el riel de tierra (y = 10).
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, CX = (EM.cx = {});

  /* items: [{id, t, p, mode:'series'|'shunt', tap:'nombre', rot}] — «tap» pone una etiqueta de nodo después del elemento */
  CX.ladder = function (o) {
    const parts = [], wires = [];
    const src = o.src;
    const x0 = 4, yT = 6, yB = 10, sp = o.spacing || 6;
    let srcTop = [x0, yT], srcBot = [x0, yB];
    if (src.t === 'FG' || src.t === 'PSU') {
      parts.push([src.id, src.t, 1, 8, 0, src.p || {}]);
      wires.push([[x0, 7], [x0, yT]]); wires.push([[x0, 9], [x0, yB]]);
      /* los pines de FG/PSU son (+3,−1) y (+3,+1) respecto del centro */
    } else parts.push([src.id, src.t, x0, 8, 0, src.p || {}]);
    let cursor = [x0, yT];
    let x = x0 + sp;
    let lastShuntX = null;
    let nTap = 0;
    for (const it of o.items) {
      if (it.mode === 'buf') { /* seguidor con A.O.: entrada + al riel, salida a la entrada − */
        const cx = x + 1;
        parts.push([it.id, 'OA', cx, yT, 0, it.p || { model: 'ideal' }]);
        wires.push([cursor, [cx - 3, yT], [cx - 3, yT - 1]]);
        wires.push([[cx + 3, yT], [cx + 3, yT + 2], [cx - 3, yT + 2], [cx - 3, yT + 1]]);
        cursor = [cx + 3, yT];
        if (it.tap) { parts.push(['N' + (++nTap), 'LBL', cx + 3, yT - 2, 0, { name: it.tap }]); wires.push([[cx + 3, yT], [cx + 3, yT - 2]]); }
        x += 8;
        continue;
      }
      if (it.mode === 'shunt') {
        parts.push([it.id, it.t, x, 8, it.rot === undefined ? 1 : it.rot, it.p || {}]);
        wires.push([cursor, [x, yT]]);
        cursor = [x, yT];
        lastShuntX = x;
        if (it.tap) { parts.push(['N' + (++nTap), 'LBL', x, yT - 2, 0, { name: it.tap }]); wires.push([[x, yT], [x, yT - 2]]); }
        x += sp;
      } else {
        parts.push([it.id, it.t, x, yT, it.rot || 0, it.p || {}]);
        wires.push([cursor, [x - 2, yT]]);
        cursor = [x + 2, yT];
        if (it.tap) { parts.push(['N' + (++nTap), 'LBL', x + 2, yT - 2, 0, { name: it.tap }]); wires.push([[x + 2, yT], [x + 2, yT - 2]]); }
        x += sp;
      }
    }
    /* riel inferior */
    if (lastShuntX !== null) wires.push([[x0, yB], [lastShuntX, yB]]);
    if (src.t === 'FG' || src.t === 'PSU') { /* tierra en el borne negativo */ wires.push(['gndat', x0, yB]); }
    else wires.push([src.id + '.1', 'gnd']);
    /* tierra única: el símbolo se coloca en el pin negativo de la fuente */
    if (src.t !== 'FG' && src.t !== 'PSU') { /* ya agregado */ }
    /* extra: cualquier pieza o cable adicional */
    if (o.extra) { for (const p of o.extra.parts || []) parts.push(p); for (const w of o.extra.wires || []) wires.push(w); }
    return { parts, wires };
  };

  /* Etapa de emisor común con polarización por fuente de base: VB → RB → base; VCC → RC → colector; RE (1 mΩ por omisión) */
  CX.ce = function (o) {
    const q = o.q || (o.fet ? '2N7000' : '2N3904');
    const parts = [['VCC', 'VDC', 4, 8, 0, { v: o.vcc === undefined ? 12 : o.vcc }], ['RC', 'R', 14, 8, 1, { r: o.rc || 1000, watt: o.rcw || 1 }], ['Q1', o.fet ? 'NMOS' : (o.pnp ? 'PNP' : 'NPN'), 14, 14, 0, { model: q, hs: o.hs || 0 }],
      ['RB', 'R', 8, 14, 0, { r: o.rb || 10000 }], ['VB', 'VDC', 2, 16, 0, { v: o.vb === undefined ? 2 : o.vb }], ['RE', 'R', 16, 19, 1, { r: o.re || 0.001, watt: o.rew || 5 }], ['Nc', 'LBL', 18, 12, 0, { name: 'col' }], ['Nb', 'LBL', 11, 12, 2, { name: 'bas' }]];
    const wires = [['VCC.0', [14, 6]], ['RC.1', [14, 12], 'Q1.0'], ['VB.0', 'RB.0'], ['RB.1', 'Q1.1'], [[16, 12], [18, 12]], [[11, 14], [11, 12]],
      ['VCC.1', [0, 10], [0, 22], [16, 22]], ['VB.1', [2, 22]], ['Q1.2', 'RE.0'], ['RE.1', [16, 22]], [[0, 22], [0, 23]], ['gndat', 0, 23]];
    return { parts, wires };
  };

  /* Polarización: 'fija' (R_B desde V_CC) o 'divisor' (R1, R2, R_E) para un NPN, con RC al colector */
  CX.bias = function (type, o) {
    o = o || {};
    const q = o.q || '2N3904', vcc = o.vcc === undefined ? 12 : o.vcc;
    const parts = [['VCC', 'VDC', 4, 8, 0, { v: vcc }], ['RC', 'R', 14, 8, 1, { r: o.rc || 3300, watt: 1 }], ['Q1', 'NPN', 14, 14, 0, { model: q, hs: o.hs || 0 }], ['Nc', 'LBL', 18, 12, 0, { name: 'col' }], ['Nb', 'LBL', 11, 12, 2, { name: 'bas' }]];
    const wires = [['VCC.0', [14, 6]], ['RC.1', [14, 12], 'Q1.C'], [[16, 12], [18, 12]], [[11, 14], [11, 12]]];
    if (type === 'fija') {
      parts.push(['RB', 'R', 8, 10, 1, { r: o.rb || 2.2e6 }]);
      wires.push([[8, 6], 'RB.0'], ['RB.1', [8, 14], 'Q1.B'], ['VCC.1', [4, 20], [16, 20]], ['Q1.E', [16, 20]], [[4, 20], [4, 21]], ['gndat', 4, 21]);
    } else {
      parts.push(['R1', 'R', 8, 9, 1, { r: o.r1 || 33000 }], ['R2', 'R', 8, 17, 1, { r: o.r2 || 10000 }], ['RE', 'R', 16, 19, 1, { r: o.re || 1000 }]);
      wires.push([[8, 6], [8, 7]], ['R1.1', [8, 14], 'Q1.B'], [[8, 14], 'R2.0'], ['VCC.1', [4, 22], [16, 22]], ['R2.1', [8, 22]], ['Q1.E', 'RE.0'], ['RE.1', [16, 22]], [[4, 22], [4, 23]], ['gndat', 4, 23]);
    }
    return { parts, wires };
  };

  /* Interruptor con transistor excitado por el generador de funciones: FG → RB → base; VCC → carga → colector */
  CX.swb = function (o) {
    o = o || {};
    const darl = !!o.darl;
    const parts = [['VCC', 'VDC', 4, 8, 0, { v: o.vcc === undefined ? 5 : o.vcc }], ['Q1', darl ? 'DARL' : 'NPN', 14, 14, 0, darl ? {} : { model: o.q || '2N3904' }],
      ['RB', 'R', 8, 14, 0, { r: o.rb || 1000 }], ['FG1', 'FG', -1, 16, 0, { wave: 'square', amp: 2.5, off: 2.5, f: o.f || 1000, rs: 1 }], ['Nc', 'LBL', 18, 12, 0, { name: 'col' }], ['Nb', 'LBL', 11, 12, 2, { name: 'bas' }]];
    const wires = [['VCC.0', [14, 6]], [[16, 12], [18, 12]], [[11, 14], [11, 12]], [[2, 15], [2, 14], [6, 14]], ['RB.1', 'Q1.B'], ['VCC.1', [4, 20]], [[2, 20], [16, 20]], [[2, 17], [2, 20]], ['Q1.E', [16, 20]], [[4, 20], [4, 21]], ['gndat', 4, 21]];
    if (o.load === 'MOT') {
      parts.push(['M1', 'MOT', 14, 8, 1, { vnom: 6 }], ['D1', 'D', 18, 8, 3, { model: '1N4007' }]);
      wires.push([[14, 6], [18, 6]], ['M1.1', [14, 12], 'Q1.C'], [[18, 10], [18, 12]]);
    } else {
      parts.push(['RC', 'R', 14, 8, 1, { r: o.rc || 1000, watt: o.rcw || 1 }]);
      wires.push(['RC.1', [14, 12], 'Q1.C']);
    }
    return { parts, wires };
  };

  /* Amplificador de pequeña señal acoplado en CA. mode 'ce': emisor común (salida en el colector, CE de desacoplo en R_E);
     mode 'cc': seguidor de emisor (salida en el emisor). Divisor R1/R2, Cin, Cout, RL, generador FG (etiquetas in, bas, out). */
  CX.amp = function (o) {
    o = o || {};
    const cc = o.mode === 'cc', fet = !!o.fet || !!o.jfet, q = o.q || (o.jfet ? '2N5457' : fet ? '2N7000' : '2N3904');
    const parts = [['VCC', 'VDC', -6, 8, 0, { v: o.vcc === undefined ? 12 : o.vcc }], ['Q1', o.jfet ? 'JFN' : fet ? 'NMOS' : 'NPN', 14, 14, 0, { model: q }],
      ['R1', 'R', 8, 9, 1, { r: o.r1 || (fet ? 680000 : 33000) }], ['R2', 'R', 8, 17, 1, { r: o.r2 || (fet ? 390000 : 10000) }],
      ['FG1', 'FG', -1, 16, 0, { wave: 'sin', amp: o.amp === undefined ? 0.01 : o.amp, f: o.f || 1000, rs: o.rs || 50 }],
      ['Cin', 'C', 6, 14, 2, { c: o.cin || 10e-6, kind: 'elec' }], ['Ni', 'LBL', 2, 12, 2, { name: 'in' }], ['Nb', 'LBL', 11, 12, 2, { name: 'bas' }]];
    const wires = [['VCC.0', [14, 6]], [[-6, 10], [-6, 11]], ['gndat', -6, 11], [[8, 6], [8, 7]], ['R1.1', [8, 14], 'Q1.1'], [[8, 14], 'R2.0'], ['R2.1', [8, 22]],
      [[2, 15], [2, 14], 'Cin.1'], ['Cin.0', [8, 14]], [[2, 14], [2, 12]], [[11, 14], [11, 12]], [[2, 17], [2, 18]], ['gndat', 2, 18], [[8, 22], [8, 23]], ['gndat', 8, 23], [[8, 22], [24, 22]]];
    if (cc) {
      parts.push(['RE', 'R', 16, 19, 1, { r: o.re || 1000, watt: 1 }], ['Cout', 'C', 20, 17, 0, { c: o.cout || 10e-6, kind: 'elec' }], ['RL', 'R', 24, 19, 1, { r: o.rl || 1000, watt: 1 }], ['No', 'LBL', 23, 15, 0, { name: 'out' }]);
      wires.push([[14, 6], [14, 12], [16, 12]], ['Q1.2', 'RE.0'], ['RE.1', [16, 22]], [[16, 17], 'Cout.0'], ['Cout.1', 'RL.0'], ['RL.1', [24, 22]], [[23, 17], [23, 15]]);
    } else {
      parts.push(['RC', 'R', 14, 8, 1, { r: o.rc || 3300, watt: 1 }], ['RE', 'R', 16, 19, 1, { r: o.re || 1000, watt: 1 }], ['CE', 'C', 19, 19, 1, { c: o.ce === undefined ? 100e-6 : o.ce, kind: 'elec' }],
        ['Cout', 'C', 20, 12, 0, { c: o.cout || 10e-6, kind: 'elec' }], ['RL', 'R', 24, 16, 1, { r: o.rl || 10000, watt: 1 }], ['Nc', 'LBL', 17, 10, 0, { name: 'col' }], ['No', 'LBL', 23, 10, 0, { name: 'out' }]);
      wires.push(['RC.1', [14, 12], 'Q1.0'], [[16, 12], [18, 12]], [[17, 12], [17, 10]], ['Q1.2', 'RE.0'], ['RE.1', [16, 22]], [[16, 17], [19, 17]], ['CE.1', [19, 22]], [[18, 12], 'Cout.0'], ['Cout.1', [24, 12], 'RL.0'], ['RL.1', [24, 22]], [[23, 12], [23, 10]]);
    }
    return { parts, wires };
  };

  /* Atajo: monta un Taller con una escalera */
  CX.mountLadder = (sim, o) => EM.Taller.mount(sim, Object.assign({}, o, { spec: CX.ladder(o.ladder) }));
})();
