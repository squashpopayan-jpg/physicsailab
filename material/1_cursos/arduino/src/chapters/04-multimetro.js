/* Capítulo 4 — El multímetro */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.parts;

  const board = () => ({ boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [], parts: [], wires: [], env: { lux: 300, temp: 25 } });
  const meter = (mode) => [{ id: 'm1', mode, at: [93, 4], scale: 0.5, jack: 'VΩmA' }];
  /* coloca las puntas del multímetro */
  const probe = (mode, red, black, jack) => (lab) => {
    const m = lab.scene.meters[0];
    m.mode = mode; m.jack = jack || 'VΩmA'; m.red = red ? 'bb:' + red : null; m.black = black ? 'bb:' + black : null;
    lab.placeTips(m); lab.rebuild();
  };
  const btn = (label, fn, newRow) => ({ type: 'button', label, run: fn, newRow });

  /* 4.1 Conozca el multímetro */
  EM.defineSim('dmm', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'B1', type: 'BAT', v: 9, rint: 1.7, at: [-26, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 1000, watt: 0.25, pins: ['h10', 'h14'] }, { id: 'R2', type: 'R', value: 2000, watt: 0.25, pins: ['g14', 'g18'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j18', b: 'T-4' }];
    sc.meters = meter('V');
    EM.Lab.mount(sim, {
      aspect: 1.7, scene: sc, speeds: false, below: true, hint: 'Gire la perilla del multímetro, cambie el cable rojo de conector o arrastre las puntas a la protoboard.',
      controls: [
        { type: 'slider', id: 'vb', label: 'Tensión de la pila (se descarga con el uso)', min: 6, max: 9.6, step: 0.1, value: 9, unit: 'V', apply: (lab, v) => { lab.scene.parts[0].v = v; } },
        btn('Puntas en R1', probe('V', 'a10', 'a14')), btn('Puntas en R2', probe('V', 'a14', 'a18')), btn('Puntas en la pila', probe('V', 'T+10', 'T-10'), true), btn('Puntas invertidas', probe('V', 'T-10', 'T+10')), btn('Quitar las puntas', probe('V', null, null))
      ],
      outs: [
        { id: 'i', label: 'Corriente del circuito', fn: (lab) => EM.fmtI(lab.bench.c.find('R1:main').i) },
        { id: 'v1', label: 'Tensión en R1 (1 kΩ)', fn: (lab) => EM.fmtV(lab.bench.c.find('R1:main').vab) },
        { id: 'v2', label: 'Tensión en R2 (2 kΩ)', fn: (lab) => EM.fmtV(lab.bench.c.find('R2:main').vab) }
      ]
    });
  });

  /* 4.2 Medir corriente */
  EM.defineSim('amper', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'B1', type: 'BAT', v: 9, rint: 1.7, at: [-26, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 470, watt: 0.25, pins: ['h10', 'h14'] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'j20' }, { id: 'w3', a: 'j22', b: 'T-4' }];
    sc.meters = meter('A');
    EM.Lab.mount(sim, {
      aspect: 1.7, scene: sc, speeds: false, below: true, hint: 'El circuito tiene un hueco entre las columnas 20 y 22: allí va el multímetro, en serie.',
      controls: [
        btn('En serie, en el hueco (correcto)', probe('A', 'i20', 'i22')), btn('En paralelo con la pila (¡error!)', probe('A', 'T+8', 'T-8'), true), btn('Medir voltaje en el LED', probe('V', 'i14', 'i15')), btn('Quitar las puntas', probe('A', null, null))
      ],
      outs: [
        { id: 'i', label: 'Corriente por el LED', hl: true, fn: (lab) => EM.fmtI(lab.bench.partCurrent(lab.scene.parts[2])) },
        { id: 'f', label: 'Fusible del multímetro', fn: (lab) => (lab.scene.meters[0].blown ? '<span class="bad">quemado</span>' : 'bueno (200 mA)') }
      ],
      onEvent: () => {}
    });
  });

  /* 4.3 Medir resistencia */
  EM.defineSim('ohmios', function (sim) {
    const sc = board();
    sc.parts = [
      { id: 'B1', type: 'BAT', v: 9, rint: 1.7, at: [-26, 24], pins: ['T+2', 'T-2'] },
      { id: 'R1', type: 'R', value: 330, watt: 0.25, pins: ['e5', 'e10'] },
      { id: 'R2', type: 'R', value: 1000, watt: 0.25, pins: [null, null] },
      { id: 'RV1', type: 'POT', value: 10000, pos: 0.3, pins: ['e20', 'e21', 'e22'] }
    ];
    sc.wires = [{ id: 'wp', a: 'T+4', b: 'a5', cut: true }, { id: 'wn', a: 'a10', b: 'T-4', cut: true }];
    sc.meters = meter('R');
    EM.Lab.mount(sim, {
      aspect: 1.7, scene: sc, speeds: false, below: true, hint: 'Elija qué circuito medir y pruebe las puntas sobre R1 o el potenciómetro.',
      controls: [
        { type: 'seg', id: 'caso', label: 'Estado del circuito', options: [['solo', 'R1 sola'], ['par', 'R1 con otra en paralelo'], ['pila', 'Con la pila conectada']], value: 'solo', apply: (lab, v) => { const s = lab.scene; s.parts[2].pins = v === 'par' ? ['d5', 'd10'] : [null, null]; s.wires.forEach((w) => { w.cut = v !== 'pila'; }); lab.rebuild(); } },
        { type: 'slider', id: 'pos', label: 'Cursor del potenciómetro', min: 0.05, max: 0.95, step: 0.05, value: 0.3, fmt: (v) => Math.round(v * 100) + ' %', apply: (lab, v) => { lab.scene.parts[3].pos = v; } },
        btn('Medir R1', probe('R', 'a5', 'a10')), btn('Potenciómetro: extremo a extremo', probe('R', 'b20', 'b22')), btn('Extremo A – cursor', probe('R', 'b20', 'b21'), true), btn('Cursor – extremo B', probe('R', 'b21', 'b22'))
      ]
    });
  });

  /* 4.4 Continuidad */
  EM.defineSim('conti', function (sim) {
    let msg = 'Pruebe cada pieza con el multímetro en continuidad.';
    const sc = board();
    sc.parts = [
      { id: 'F1', type: 'FUSE', rating: 0.2, pins: ['e3', 'e7'] },
      { id: 'F2', type: 'FUSE', rating: 0.2, blown: true, pins: ['e10', 'e14'] },
      { id: 'SW1', type: 'SW', closed: false, pins: ['e17', 'e21'] },
      { id: 'W1', type: 'JUMPER', pins: ['e24', 'e27'] },
      { id: 'W2', type: 'JUMPER', dead: 'open', pins: ['f24', 'f27'] }
    ];
    sc.meters = meter('CONT');
    const t = (id, a, b) => btn('Probar ' + id, probe('CONT', a, b));
    EM.Lab.mount(sim, {
      aspect: 1.7, scene: sc, speeds: false, below: true, labels: true, hint: 'Toque el interruptor para cambiarlo; use los botones o arrastre las puntas.',
      controls: [t('F1', 'a3', 'a7'), t('F2', 'a10', 'a14'), t('SW1', 'a17', 'a21'), t('W1', 'a24', 'a27'), t('W2', 'j24', 'j27'),
        { type: 'button', label: 'Mostrar la respuesta', newRow: true, run: () => { msg = 'F2 (fusible quemado) y W2 (cable roto por dentro) están dañados; el interruptor solo conduce cerrado.'; } }],
      outs: [{ id: 'r', label: 'Respuesta', fn: () => msg }]
    });
  });

  /* 4.5 Diodos */
  EM.defineSim('diodo', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'D1', type: 'LED', color: 'rojo', pins: ['e5', 'e6'] }, { id: 'D2', type: 'D', model: '1N4007', pins: ['e14', 'e18'] }];
    sc.meters = meter('DIODE');
    EM.Lab.mount(sim, {
      aspect: 1.7, scene: sc, speeds: false, below: true, hint: 'Rojo al ánodo y negro al cátodo: el diodo conduce y se lee su tensión.',
      controls: [
        { type: 'seg', id: 'color', label: 'Color del LED', options: [['rojo', 'Rojo'], ['amarillo', 'Amarillo'], ['verde', 'Verde'], ['azul', 'Azul'], ['blanco', 'Blanco']], value: 'rojo', apply: (lab, v) => { lab.scene.parts[0].color = v; } },
        btn('LED: rojo al ánodo', probe('DIODE', 'a5', 'a6')), btn('LED: invertido', probe('DIODE', 'a6', 'a5')), btn('1N4007: directo', probe('DIODE', 'a14', 'a18'), true), btn('1N4007: inverso', probe('DIODE', 'a18', 'a14'))
      ]
    });
  });
})();
