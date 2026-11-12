/* ===================================================================
   38-specs.js — Ayudas para escribir circuitos de los capítulos (EM.SP). Sin DOM.
   Convenciones: la fuente (canal 1) alimenta los rieles superiores; T+ es el positivo y T− la referencia.
   Las columnas 1–30 de la protoboard media; mitad superior f–j (tiras «T»), mitad inferior a–e (tiras «B»).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const SP = (EM.SP = {});
  /* canal 1 de la fuente → rieles superiores (+ en T+1, − en T−1) */
  EM.RAILS_PS1 = SP.rails = (extra) => [['@ps1+', 'T+1', 'red'], ['@ps1-', 'T-1', 'black']].concat(extra || []);
  /* une los rieles superiores con los inferiores en el extremo derecho */
  SP.cross = () => [['T+25', 'B+25', 'red'], ['T-25', 'B-25', 'black']];
  /* canal 2 → rieles inferiores */
  SP.rails2 = (extra) => [['@ps2+', 'B+1', 'red'], ['@ps2-', 'B-1', 'black']].concat(extra || []);
  /* fuente lineal de 5 V (transformador 12 V~, puente, filtro, 7805, carga y LED); ids de cables w1…w6 en el orden de la lista */
  SP.fuente5 = (rl) => ({
    parts: [['BR1', 'BR', { model: '1N4007' }, 'e6'], ['C1', 'CE', { c: 2.2e-3, vmax: 35 }, 'c7', 'B-5'],
      ['U1', 'REG', { model: '7805' }, 'e12'], ['C2', 'CE', { c: 1e-4, vmax: 16 }, 'c14', 'B-9'], ['R1', 'R', { r: rl, watt: 1 }, 'a14', 'B-11'], ['D1', 'LED', { color: 'verde' }, 'c18', 'c19'], ['R2', 'R', { r: 470 }, 'd14', 'd18']],
    wires: [['@ac1', 'a6', 'orange'], ['@ac2', 'a8', 'orange'], ['a9', 'B-3', 'black'], ['a7', 'a12', 'red'], ['a13', 'B-7', 'black'], ['a19', 'B-13', 'black']],
    probes: { s1: 'b7', s1g: 'B-4', s2: 'b14', s2g: 'B-10' },
    ac: { vrms: 12 },
    osc: { tdiv: 5e-3, ch: [{ vdiv: 2, on: true, pos: -3 }, { vdiv: 2, on: true, pos: -3 }] }
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
