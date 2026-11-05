(function () {
  'use strict';
  const EM = window.EM;
  EM.defineSim('home-hero', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.6, edit: 'none', panels: [], tdiv: 2e-3, net: { damage: false }, hint: 'Una fuente lineal: puente rectificador, filtro de 2200 µF y regulador 7805 que alimenta 10 Ω.',
      spec: {
        parts: [['AC', 'VAC', 2, 8, 0, { amp: 17, f: 60, rs: 0.5 }], ['BR', 'BR', 10, 8, 0], ['C1', 'C', 16, 6, 1, { c: 2200e-6, kind: 'elec', vmax: 35 }], ['U1', 'REG', 24, 4, 0, { model: '7805' }], ['C2', 'C', 30, 6, 1, { c: 100e-6, kind: 'elec' }], ['RL', 'R', 34, 6, 1, { r: 10 }]],
        wires: [['AC.0', 'BR.0'], ['AC.1', 'BR.1'], ['BR.2', [16, 4], 'C1.0'], ['C1.0', 'U1.IN'], ['U1.OUT', 'C2.0'], ['C2.0', 'RL.0'], ['BR.3', 'gnd'], ['C1.1', 'gnd'], ['C2.1', 'gnd'], ['RL.1', 'gnd'], ['U1.COM', 'gnd']]
      }
    });
  });
})();
