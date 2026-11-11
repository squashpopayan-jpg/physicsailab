/* ===================================================================
   lib/71-gramaticas.js — Gramáticas de juguete del curso (español) y
   normalización de pesos a probabilidades.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const G = (L.cfg = L.cfg || {});

  G.normalizar = function (g) {
    const tot = new Map();
    for (const r of g.rules) tot.set(r.lhs, (tot.get(r.lhs) || 0) + (r.p === null ? 1 : r.p));
    return { start: g.start, nts: g.nts, rules: g.rules.map((r) => ({ lhs: r.lhs, rhs: r.rhs, p: (r.p === null ? 1 : r.p) / tot.get(r.lhs) })) };
  };

  /* Gramática de estructura sintagmática del curso (sin probabilidades) */
  G.TEXTO = `
S -> SN SV
SN -> Det N | N | Pron | SN SP | SN Adj | SN Conj SN
SV -> V | V SN | V Adj | SV SP
SP -> P SN
Det -> 'el' | 'la' | 'los' | 'las' | 'un' | 'una' | 'mi'
N -> 'niño' | 'niña' | 'gato' | 'perro' | 'casa' | 'parque' | 'telescopio' | 'hombres' | 'mujeres' | 'libro' | 'elefante' | 'pijama' | 'profesor' | 'estudiantes' | 'texto'
Pron -> 'yo'
Adj -> 'grande' | 'roja' | 'mayores' | 'viejo' | 'nuevo'
V -> 'vi' | 'vio' | 've' | 'tiene' | 'lee' | 'leen' | 'es' | 'disparé'
P -> 'con' | 'en' | 'de' | 'por'
Conj -> 'y'
`;
  /* Variante sin recursión por la izquierda (apta para el análisis descendente) */
  G.TEXTO_NLR = `
S -> SN SV
SN -> Det N | N | Pron | Det N SP | Det N Adj
SV -> V | V SN | V Adj | V SN SP
SP -> P SN
Det -> 'el' | 'la' | 'los' | 'las' | 'un' | 'una' | 'mi'
N -> 'niño' | 'niña' | 'gato' | 'perro' | 'casa' | 'parque' | 'telescopio' | 'hombres' | 'mujeres' | 'libro' | 'elefante' | 'pijama' | 'profesor' | 'estudiantes' | 'texto'
Pron -> 'yo'
Adj -> 'grande' | 'roja' | 'mayores' | 'viejo' | 'nuevo'
V -> 'vi' | 'vio' | 've' | 'tiene' | 'lee' | 'leen' | 'es' | 'disparé'
P -> 'con' | 'en' | 'de' | 'por'
Conj -> 'y'
`;
  G.toyNLR = () => G.leer(G.TEXTO_NLR);
  /* Versión probabilista (pesos que se normalizan por símbolo) */
  G.TEXTOP = `
S -> SN SV [1]
SN -> Det N [35] | N [20] | Pron [10] | SN SP [15] | SN Adj [10] | SN Conj SN [10]
SV -> V [20] | V SN [40] | V Adj [10] | SV SP [30]
SP -> P SN [1]
Det -> 'el' [25] | 'la' [20] | 'los' [10] | 'las' [5] | 'un' [20] | 'una' [10] | 'mi' [10]
N -> 'niño' [10] | 'niña' [10] | 'gato' [10] | 'perro' [10] | 'casa' [10] | 'parque' [5] | 'telescopio' [5] | 'hombres' [5] | 'mujeres' [5] | 'libro' [10] | 'elefante' [5] | 'pijama' [5] | 'profesor' [5] | 'estudiantes' [5] | 'texto' [5]
Pron -> 'yo' [1]
Adj -> 'grande' [25] | 'roja' [15] | 'mayores' [20] | 'viejo' [20] | 'nuevo' [20]
V -> 'vi' [20] | 'vio' [20] | 've' [10] | 'tiene' [10] | 'lee' [10] | 'leen' [10] | 'es' [10] | 'disparé' [10]
P -> 'con' [30] | 'en' [30] | 'de' [30] | 'por' [10]
Conj -> 'y' [1]
`;
  G.toy = () => G.leer(G.TEXTO);
  G.toyP = () => G.normalizar(G.leer(G.TEXTOP));
  G.ORACIONES = [
    'yo vi un elefante en mi pijama',
    'el niño vio un gato con un telescopio',
    'hombres y mujeres mayores leen',
    'el niño ve un gato grande con un telescopio en el parque',
    'la niña lee un libro',
    'el profesor tiene un perro viejo',
    'los estudiantes leen un texto de la casa',
    'yo disparé un elefante con mi libro en el parque por la casa'
  ];
})(typeof window !== 'undefined' ? window : globalThis);
