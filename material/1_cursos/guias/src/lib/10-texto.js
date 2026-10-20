/* ===================================================================
   10-texto.js — Legibilidad de textos en español
   · conteo de sílabas por núcleos vocálicos con diptongos e hiatos
   · índice de Fernández Huerta (1959) y de Szigriszt-Pazos (1993)
     con la escala INFLESZ (Barrio-Cantalejo et al., 2008)
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  const T = (EM.TXT = {});
  const FUERTES = 'aeoáéóíúàèòìù', VOC = 'aeiouáéíóúüàèìòù';

  T.silabas = function (palabra) {
    let w = palabra.toLowerCase().replace(/[^a-záéíóúüñàèìòù]/g, '');
    if (!w) return 0;
    w = w.replace(/qu(?=[eiéí])/g, 'q').replace(/gu(?=[eiéí])/g, 'g');
    if (w.endsWith('y') && w.length > 1 && VOC.includes(w[w.length - 2])) w = w.slice(0, -1);
    let n = 0, i = 0;
    while (i < w.length) {
      if (!VOC.includes(w[i])) { i++; continue; }
      let j = i;
      while (j < w.length && VOC.includes(w[j])) j++;
      const g = w.slice(i, j);
      const fuertes = g.split('').filter((c) => FUERTES.includes(c)).length;
      n += Math.max(1, fuertes);
      i = j;
    }
    return Math.max(1, n);
  };
  T.frases = (texto) => texto.split(/(?<=[.!?¿¡;:])\s+|\n+/).map((s) => s.trim()).filter((s) => /[a-záéíóúñ]/i.test(s));
  T.palabras = (texto) => (texto.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g) || []);
  T.analizar = function (texto) {
    const W = T.palabras(texto), F = T.frases(texto);
    const S = W.reduce((s, w) => s + T.silabas(w), 0);
    const nW = W.length || 1, nF = F.length || 1;
    const fh = 206.84 - 0.6 * ((100 * S) / nW) - 1.02 * ((100 * nF) / nW);
    const sp = 206.835 - (62.3 * S) / nW - nW / nF;
    return { palabras: W.length, frases: F.length, silabas: S, spp: S / nW, ppf: nW / nF, fh, sp, largas: F.filter((f) => T.palabras(f).length > 25) };
  };
  T.inflesz = (p) => (p < 40 ? 'Muy difícil' : p < 55 ? 'Algo difícil' : p < 65 ? 'Normal' : p < 80 ? 'Bastante fácil' : 'Muy fácil');
  T.huerta = (l) => (l < 30 ? 'Muy difícil' : l < 50 ? 'Difícil' : l < 60 ? 'Algo difícil' : l < 70 ? 'Normal' : l < 80 ? 'Algo fácil' : l < 90 ? 'Fácil' : 'Muy fácil');
})();
