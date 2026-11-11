/* ===================================================================
   lib/10-ambig.js — Ambigüedad: números de Catalan y conteo de análisis
   de una oración con n sintagmas preposicionales encadenados.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const A = (L.ambig = {});

  /* Número de Catalan C_n = (2n)! / ((n+1)! n!) con BigInt (exacto) */
  A.catalan = function (n) {
    let c = 1n;
    for (let k = 0; k < n; k++) c = (c * BigInt(2 * (2 * k + 1))) / BigInt(k + 2);
    return c;
  };
  /* Cuántos análisis tiene «V SN SP₁ … SPₙ» con la gramática SN → SN SP | Det N, SV → V SN | SV SP.
     Cada sintagma preposicional puede colgar de un nombre o del verbo: resultan C_{n+1} árboles. */
  A.parsesPP = (n) => A.catalan(n + 1);

  /* Programación dinámica explícita: cuenta árboles con una gramática CNF mínima.
     Sirve de comprobación independiente de la fórmula de Catalan. */
  A.countTrees = function (n) {
    /* Símbolos: V, N (SN completo sin SP), P, S0 = SN con SP… se modela con intervalos de la cadena V N P N P N … */
    const words = ['V', 'N'];
    for (let i = 0; i < n; i++) words.push('P', 'N');
    const m = words.length;
    /* nodo SN en [i,j) : SN → N | SN SP ; SP → P SN ; SV → V SN | SV SP ; solo el símbolo S = SV en [0,m) */
    const sn = Array.from({ length: m + 1 }, () => new Array(m + 1).fill(0n));
    const sp = Array.from({ length: m + 1 }, () => new Array(m + 1).fill(0n));
    const sv = Array.from({ length: m + 1 }, () => new Array(m + 1).fill(0n));
    for (let len = 1; len <= m; len++) {
      for (let i = 0; i + len <= m; i++) {
        const j = i + len;
        if (len === 1 && words[i] === 'N') sn[i][j] = 1n;
        if (len >= 2 && words[i] === 'P') sp[i][j] = sn[i + 1][j];
        for (let k = i + 1; k < j; k++) {
          sn[i][j] += sn[i][k] * sp[k][j];
          sv[i][j] += sv[i][k] * sp[k][j];
        }
        if (words[i] === 'V' && len >= 2) sv[i][j] += sn[i + 1][j];
      }
    }
    return sv[0][m];
  };
})(typeof window !== 'undefined' ? window : globalThis);
