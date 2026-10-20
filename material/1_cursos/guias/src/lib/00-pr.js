/* ===================================================================
   00-pr.js — Registro de prácticas (datos puros, sin DOM)
   Cada archivo lib/2x-…js llama EM.PR.add({...}). El esquema está
   documentado en el capítulo «Anatomía de una guía».
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  const lista = [];
  EM.PR = {
    lista,
    add(p) {
      if (lista.some((q) => q.id === p.id)) throw new Error('Práctica duplicada: ' + p.id);
      p.capitulo = p.capitulo || p.id;
      lista.push(p);
      return p;
    },
    get: (id) => lista.find((p) => p.id === id),
    /* Costo total aproximado por grupo (COP) */
    costo: (p) => (p.materiales || []).reduce((s, m) => s + (+m[3] || 0), 0)
  };
  /* Formato de pesos colombianos sin decimales: 12 500 */
  EM.cop = (v) => '$ ' + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  EM.NIVELES = [
    ['0', 'Confirmación', 'Se dan la pregunta, el procedimiento y el resultado esperado: el estudiante comprueba un principio conocido.'],
    ['1', 'Estructurada', 'Se dan la pregunta y el procedimiento; el estudiante obtiene y explica el resultado.'],
    ['2', 'Guiada', 'Se da la pregunta; el equipo diseña el procedimiento con preguntas orientadoras.'],
    ['3', 'Abierta', 'El equipo formula la pregunta, diseña, mide y comunica a partir de un contexto y unos materiales.']
  ];
})();
