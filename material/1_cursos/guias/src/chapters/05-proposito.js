/* Capítulo 5 — Para qué sirve el laboratorio */
(function () {
  'use strict';
  const EM = window.EM;
  EM.defineSim('abrir-guia', function (sim) {
    sim.below();
    const prev = EM.el('div', 'guia-prev');
    sim.stage.append(prev);
    const lista = EM.PR.lista.slice().sort((a, b) => (a.cod < b.cod ? -1 : 1));
    sim.select('pr', { label: 'Práctica', options: lista.map((p) => [p.id, p.cod + ' · ' + p.titulo]), value: EM.PR.get('pendulo') ? 'pendulo' : lista[0].id });
    sim.seg('nv', { label: 'Nivel de indagación', options: EM.NIVELES.map((n) => [+n[0], n[0] + ' · ' + n[1]]), value: 1 });
    sim.out('d', 'Qué cambia');
    sim.onDraw(() => {
      const p = EM.PR.get(sim.p.pr);
      prev.innerHTML = EM.GUIA.html(EM.GUIA.bloques(p, { nivel: sim.p.nv, curriculo: false, rubrica: false, saber: false }));
      sim.set('d', EM.NIVELES[sim.p.nv][2]);
    });
  });
})();
