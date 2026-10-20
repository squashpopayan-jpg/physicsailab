/* ===================================================================
   02-gtc45.js — Valoración de riesgos con la metodología de la
   GTC 45:2012 (ICONTEC), «Guía para la identificación de los peligros
   y la valoración de los riesgos en seguridad y salud ocupacional».
   NP = ND × NE ;  NR = NP × NC.  Escalas de las tablas 2 a 8 de la guía.
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  const G = (EM.GTC = {});

  /* Nivel de deficiencia: 0 representa «Bajo» (la guía no le asigna valor) */
  G.ND = [[10, 'Muy alto (MA)', 'Peligros significativos y medidas preventivas inexistentes o ineficaces'],
    [6, 'Alto (A)', 'Peligros que pueden dar lugar a consecuencias significativas, o medidas preventivas de baja eficacia'],
    [2, 'Medio (M)', 'Peligros con consecuencias poco significativas o de menor importancia, o medidas preventivas de eficacia moderada'],
    [0, 'Bajo (B)', 'No se detectan consecuencias peligrosas o las medidas preventivas son muy eficaces: el riesgo está controlado y pasa directamente al nivel IV']];
  G.NE = [[4, 'Continua (EC)', 'Sin interrupción o varias veces con tiempo prolongado durante la jornada'],
    [3, 'Frecuente (EF)', 'Varias veces durante la jornada por tiempos cortos'],
    [2, 'Ocasional (EO)', 'Alguna vez durante la jornada y por un periodo corto'],
    [1, 'Esporádica (EE)', 'Eventualmente']];
  G.NC = [[100, 'Mortal o catastrófico', 'Muerte'],
    [60, 'Muy grave', 'Lesiones o enfermedades graves irreparables (incapacidad permanente)'],
    [25, 'Grave', 'Lesiones o enfermedades con incapacidad laboral temporal'],
    [10, 'Leve', 'Lesiones o enfermedades que no requieren incapacidad']];

  G.np = (nd, ne) => nd * ne;
  G.npNivel = function (np) {
    if (np >= 24) return 'Muy alto';
    if (np >= 10) return 'Alto';
    if (np >= 6) return 'Medio';
    return 'Bajo';
  };
  /* Devuelve {np, nr, nivel: 'I'…'IV', sig, acept} */
  G.valorar = function (nd, ne, nc) {
    if (!nd) return { np: null, nr: null, nivel: 'IV', sig: G.SIG.IV, acept: G.ACEPT.IV };
    const np = nd * ne, nr = np * nc;
    const nivel = nr >= 600 ? 'I' : nr >= 150 ? 'II' : nr >= 40 ? 'III' : 'IV';
    return { np, nr, nivel, sig: G.SIG[nivel], acept: G.ACEPT[nivel] };
  };
  G.SIG = {
    I: 'Situación crítica: suspender la actividad hasta controlar el riesgo; intervención urgente.',
    II: 'Corregir y adoptar medidas de control de inmediato.',
    III: 'Mejorar si es posible; conviene justificar la intervención.',
    IV: 'Mantener los controles existentes y comprobarlos periódicamente.'
  };
  G.ACEPT = { I: 'No aceptable', II: 'No aceptable o aceptable con control específico', III: 'Aceptable (mejorable)', IV: 'Aceptable' };
  /* Clasificación de peligros de la Tabla A.1 usada en el laboratorio escolar */
  G.CLASES = {
    elec: 'Condiciones de seguridad · eléctrico',
    mec: 'Condiciones de seguridad · mecánico',
    loc: 'Condiciones de seguridad · locativo',
    tec: 'Condiciones de seguridad · tecnológico (incendio)',
    term: 'Físico · temperaturas extremas (superficies y líquidos calientes)',
    rad: 'Físico · radiación no ionizante (láser, UV)',
    ruido: 'Físico · ruido',
    quim: 'Químico',
    bio: 'Biológico',
    biom: 'Biomecánico'
  };
  /* Jerarquía de controles (Decreto 1072 de 2015, art. 2.2.4.6.24, y GTC 45) */
  G.JERARQUIA = ['Eliminación', 'Sustitución', 'Controles de ingeniería', 'Controles administrativos, señalización y advertencia', 'Equipos y elementos de protección personal'];
})();
