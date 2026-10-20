/* ===================================================================
   50-extras.js — Mejoras que se aplican al construir cada capítulo:
   listas de chequeo que se recuerdan en el navegador.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  EM.enhancers = EM.enhancers || [];
  EM.enhancers.push(function (art) {
    art.querySelectorAll('ul.checklist[data-check]').forEach((ul) => {
      const key = 'chk:' + ul.dataset.check;
      const saved = EM.store.get(key, []);
      const items = Array.from(ul.children);
      const score = EM.el('p', 'check-score');
      const upd = () => {
        const on = items.filter((li) => li.querySelector('input').checked).length;
        score.textContent = on + ' de ' + items.length + ' verificados' + (on === items.length ? ' ✓' : '');
      };
      items.forEach((li, i) => {
        const id = 'chk-' + ul.dataset.check + '-' + i;
        const inp = document.createElement('input');
        inp.type = 'checkbox'; inp.id = id; inp.checked = !!saved[i];
        const lab = document.createElement('label');
        lab.htmlFor = id; lab.innerHTML = li.innerHTML;
        li.innerHTML = ''; li.append(inp, lab);
        inp.addEventListener('change', () => { const s = items.map((x) => x.querySelector('input').checked); EM.store.set(key, s); upd(); });
      });
      ul.after(score);
      upd();
    });
  });
  /* Valores del municipio elegido dentro del texto: <span data-loc="BH"></span> */
  EM.locVal = function (k) {
    const d = EM.local(), B = d.B;
    switch (k) {
      case 'nombre': return d.nombre;
      case 'g': return EM.fix(d.g, 3) + ' m/s²';
      case 'p': return EM.fix(d.p / 100, 0) + ' hPa';
      case 'tb': return EM.fix(d.tb, 1) + ' °C';
      case 'h': return EM.fix(d.h, 0) + ' m';
      case 'BH': return EM.fix(B.H / 1000, 1) + ' µT';
      case 'BF': return EM.fix(B.F / 1000, 1) + ' µT';
      case 'BZ': return EM.fix(B.Z / 1000, 1) + ' µT';
      case 'BD': return EM.fix(Math.abs(B.D), 1) + '° al ' + (B.D < 0 ? 'oeste' : 'este');
      case 'BI': return EM.fix(B.I, 1) + '°';
      default: return '—';
    }
  };
  const llenarLoc = (root) => root.querySelectorAll('[data-loc]').forEach((e) => { try { e.textContent = EM.locVal(e.dataset.loc); } catch (err) { e.textContent = '—'; } });
  EM.enhancers.push(llenarLoc);
  (EM.onLocal = EM.onLocal || []).push(() => llenarLoc(document));
})();
