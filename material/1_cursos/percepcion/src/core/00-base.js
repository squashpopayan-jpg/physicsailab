/* ===================================================================
   00-base.js — Utilidades base y Espacio de Nombres del Curso
   Percepción Computacional — Ing. Luis Fernando Barajas Ardila
   =================================================================== */
(function () {
  'use strict';
  const P = window.PERCEPCION = window.PERCEPCION || {};

  P.version = '1.0.0';
  P.author = 'Ing. Luis Fernando Barajas Ardila';
  P.program = 'Especialización en Inteligencia Artificial';

  /* Creación de elementos DOM rápida */
  P.el = function (tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  };

  /* Formateo de números */
  P.fmt = function (num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return Number(num).toFixed(decimals);
  };

  P.sci = function (num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return Number(num).toExponential(decimals);
  };

  /* Callbacks de tema */
  P.onTheme = [];
  P.notifyTheme = function () {
    P.onTheme.forEach(fn => {
      try { fn(); } catch (err) { console.warn('Theme listener error', err); }
    });
  };

  /* Obtener variable CSS del documento */
  P.cssVar = function (varName, fallback = '#4F46E5') {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
  };

  /* Escape de strings para HTML seguro */
  P.esc = function (str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
})();
