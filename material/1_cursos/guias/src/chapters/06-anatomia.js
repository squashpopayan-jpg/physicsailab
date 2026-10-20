/* Capítulo 6 — Anatomía de una guía */
(function () {
  'use strict';
  const EM = window.EM, T = EM.TXT;
  const MUESTRA = 'Con la longitud del hilo cerca de 0,80 m, suelte la masa desde 10° sin empujarla. El cronometrista inicia en cero cuando la masa pasa por el punto más bajo y detiene en diez. Mida el tiempo de 10 oscilaciones tres veces y anote los tres valores en la tabla, porque si los valores difieren más de 0,3 s es muy probable que alguno de los integrantes del equipo haya contado mal las oscilaciones o que la masa haya empezado a girar describiendo un cono en lugar de un arco plano, lo cual cambia el periodo.';
  EM.defineSim('legibilidad', function (sim) {
    sim.below();
    const wrap = EM.el('div', 'legib');
    const ta = document.createElement('textarea');
    ta.value = MUESTRA; ta.rows = 7; ta.setAttribute('aria-label', 'Texto de la guía');
    const vista = EM.el('div', 'legib-vista');
    wrap.append(ta, vista);
    sim.stage.append(wrap);
    sim.out('n', 'Palabras · frases · sílabas');
    sim.out('fh', 'Fernández Huerta', { hl: true });
    sim.out('sp', 'Szigriszt-Pazos (INFLESZ)', { hl: true });
    sim.out('pf', 'Palabras por frase');
    ta.addEventListener('input', () => sim.redraw());
    sim.onDraw(() => {
      const r = T.analizar(ta.value);
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      vista.innerHTML = T.frases(ta.value).map((f) => (T.palabras(f).length > 25 ? `<mark title="${T.palabras(f).length} palabras">${esc(f)}</mark>` : esc(f))).join(' ');
      sim.set('n', r.palabras + ' · ' + r.frases + ' · ' + r.silabas);
      sim.set('fh', EM.fix(r.fh, 1) + ' · ' + T.huerta(r.fh));
      sim.set('sp', EM.fix(r.sp, 1) + ' · ' + T.inflesz(r.sp));
      sim.set('pf', EM.fix(r.ppf, 1) + (r.largas.length ? ' · ' + r.largas.length + ' frase' + (r.largas.length > 1 ? 's' : '') + ' de más de 25 palabras' : ''));
    });
  });
})();
