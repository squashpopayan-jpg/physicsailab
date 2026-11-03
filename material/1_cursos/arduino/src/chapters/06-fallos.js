/* Capítulo 6 — Cortocircuitos y fallos */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.parts, sp = EM.spice;
  const board = () => ({ boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [], parts: [], wires: [], env: {} });
  const find = (lab, id) => lab.scene.parts.find((p) => p.id === id);
  const repairBtn = { type: 'button', label: 'Reponer piezas dañadas', run: (lab) => { lab.bench.repairAll(); lab.alerts = []; lab.alertBox.innerHTML = ''; } };

  /* 6.1 LED sin resistencia */
  EM.defineSim('sinr', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'U1', type: 'USB', at: [-26, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 220, pins: ['h10', 'h14'] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'T-4' }];
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, speeds: [[1, '1×'], [3, '3×']], below: true, hint: 'Elija la resistencia en serie con el LED. Con 0 Ω el LED se quema.',
      controls: [{ type: 'select', id: 'r', label: 'Resistencia en serie con el LED', options: [[0.01, '0 Ω (un cable)'], [47, '47 Ω'], [100, '100 Ω'], [150, '150 Ω'], [220, '220 Ω'], [330, '330 Ω'], [1000, '1 kΩ']], value: 220, apply: (lab, v) => { find(lab, 'R1').value = +v; } }, repairBtn],
      outs: [
        { id: 'i', label: 'Corriente por el LED (máximo 30 mA)', hl: true, fn: (lab) => (find(lab, 'D1').dead ? '<span class="bad">LED quemado</span>' : EM.fix(lab.bench.partCurrent(find(lab, 'D1')) * 1000, 1) + ' mA') },
        { id: 's', label: 'Respecto de su límite', fn: (lab) => { const D = find(lab, 'D1'); return D.dead ? '—' : Math.round((D.stress || 0) * 100) + ' %'; } }
      ]
    });
  });

  /* 6.2 Condensador electrolítico */
  EM.defineSim('ecap', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'FA', type: 'LAB', v: 9, ilimit: 2, at: [-30, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 100, pins: ['h10', 'h14'] }, { id: 'C1', type: 'ECAP', value: 100e-6, vmax: 16, pins: ['g14', 'g15'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'T-4' }];
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, speeds: [[1, '1×'], [4, '4×']], below: true, hint: 'Cambie la polaridad, la tensión o el voltaje máximo del condensador.',
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de la fuente', min: 0, max: 24, step: 1, value: 9, unit: 'V', apply: (lab, v) => { find(lab, 'FA').v = v; } },
        { type: 'seg', id: 'vm', label: 'Voltaje máximo del condensador', options: [[6.3, '6.3 V'], [16, '16 V'], [25, '25 V']], value: 16, apply: (lab, v) => { find(lab, 'C1').vmax = +v; } },
        { type: 'seg', id: 'pol', label: 'Polaridad', options: [['n', 'Correcta'], ['i', 'Invertida']], value: 'n', apply: (lab, v) => { find(lab, 'C1').pins = v === 'n' ? ['g14', 'g15'] : ['g15', 'g14']; lab.rebuild(); } },
        repairBtn
      ],
      outs: [
        { id: 'v', label: 'Tensión en el condensador', hl: true, fn: (lab) => { const C = find(lab, 'C1'); if (C.dead) return '<span class="bad">dañado</span>'; return EM.fix(lab.bench.c.find('C1:main').vab, 2) + ' V'; } },
        { id: 's', label: 'Estrés (100 % = límite)', fn: (lab) => { const C = find(lab, 'C1'); return C.dead ? '—' : Math.round((C.stress || 0) * 100) + ' %'; } }
      ]
    });
  });

  /* 6.3 Cortocircuito */
  EM.defineSim('corto', function (sim) {
    const SRC = {
      pila: { id: 'S1', type: 'BAT', v: 9, rint: 1.7, at: [-26, 24], pins: ['T+2', 'T-2'] },
      usb: { id: 'S1', type: 'USB', at: [-26, 24], pins: ['T+2', 'T-2'] },
      lab: { id: 'S1', type: 'LAB', v: 5, ilimit: 1, at: [-30, 24], pins: ['T+2', 'T-2'] }
    };
    const sc = board();
    sc.parts = [JSON.parse(JSON.stringify(SRC.pila)), { id: 'R1', type: 'R', value: 330, pins: ['h10', 'h14'] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'T-4' }, { id: 'wc', a: 'T+9', b: 'T-9', cut: true, color: '#e8b50f' }];
    let cur = 'pila';
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, speeds: [[1, '1×'], [3, '3×']], below: true, hint: 'Elija la fuente y active el cable de cortocircuito.',
      controls: [
        { type: 'seg', id: 'src', label: 'Fuente de energía', options: [['pila', 'Pila 9 V'], ['usb', 'USB 5 V'], ['lab', 'Fuente de laboratorio']], value: 'pila', apply: (lab, v) => { cur = v; const old = lab.scene.parts[0]; lab.scene.parts[0] = JSON.parse(JSON.stringify(SRC[v])); lab.bench && lab.bench.repairAll(); lab.rebuild(); } },
        { type: 'slider', id: 'il', label: 'Límite de corriente de la fuente de laboratorio', min: 0.1, max: 3, step: 0.1, value: 1, unit: 'A', apply: (lab, v) => { SRC.lab.ilimit = v; if (cur === 'lab') { lab.scene.parts[0].ilimit = v; } } },
        { type: 'check', id: 'corto', label: 'Cable de cortocircuito entre + y − (¡probar!)', value: false, apply: (lab, v) => { lab.scene.wires.find((w) => w.id === 'wc').cut = !v; lab.rebuild(); } },
        repairBtn
      ],
      outs: [
        { id: 'i', label: 'Corriente que entrega la fuente', hl: true, fn: (lab) => { const e = lab.bench.c.find('S1:src'); return e ? EM.fix(-e.i, 3) + ' A' + (e.cc ? ' · modo C.C. (límite)' : '') : '—'; } },
        { id: 'v', label: 'Tensión en los rieles', fn: (lab) => EM.fix(lab.bench.v('bb:T+4') - lab.bench.v('bb:T-4'), 2) + ' V' },
        { id: 'st', label: 'Estado de la fuente', fn: (lab) => { const S = lab.scene.parts[0]; return S.dead ? '<span class="bad">dañada</span>' : S.tripped ? '<span class="bad">fusible reajustable disparado</span>' : 'normal'; } }
      ]
    });
  });

  /* 6.4 Pin del Arduino sobrecargado */
  EM.defineSim('pinfalla', function (sim) {
    const sc = board();
    sc.mcus = [{ id: 'uno', kind: 'uno', x: -78, y: 2 }];
    sc.parts = [{ id: 'R1', type: 'R', value: 220, pins: ['h10', 'h14'] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] }];
    sc.wires = [{ a: '@D8', b: 'j10' }, { a: 'j15', b: '@GND' }];
    const code = 'void setup() {\n  pinMode(8, OUTPUT);\n  digitalWrite(8, HIGH);   // enciende el LED\n}\n\nvoid loop() {\n}\n';
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, code, speeds: [[1, '1×'], [3, '3×']], hint: 'Quite la resistencia (0 Ω) y observe qué pasa con el LED y con el pin D8.',
      controls: [{ type: 'select', id: 'r', label: 'Resistencia entre el pin D8 y el LED', options: [[0.01, '0 Ω (directo)'], [100, '100 Ω'], [220, '220 Ω'], [330, '330 Ω']], value: 220, apply: (lab, v) => { find(lab, 'R1').value = +v; } }, repairBtn],
      outs: [
        { id: 'i', label: 'Corriente que sale del pin D8', hl: true, fn: (lab) => { const el = lab.bench.mcuInfo.uno.pins.D8; return el ? EM.fix(Math.abs(el.i) * 1000, 1) + ' mA' : '—'; } },
        { id: 'p', label: 'Límite del pin', fn: (lab) => '20 mA cómodos · 40 mA absoluto' },
        { id: 'e', label: 'Estado del pin D8', fn: (lab) => (lab.bench.mcuInfo.uno.deadPins && lab.bench.mcuInfo.uno.deadPins.D8 ? '<span class="bad">quemado</span>' : 'bueno') }
      ]
    });
  });

  /* 6.5 Detective de circuitos */
  EM.defineSim('diagnostico', function (sim) {
    const DIAG = [['open', 'Circuito abierto (cable suelto)'], ['rev', 'LED puesto al revés'], ['res', 'Resistencia de valor equivocado'], ['bat', 'Pila agotada']];
    const CASES = ['res', 'open', 'bat', 'rev'];
    let msg = 'Mida con el multímetro y escoja su diagnóstico.', score = 0, done = {};
    const sc = board();
    sc.parts = [{ id: 'B1', type: 'BAT', v: 9, rint: 1.7, at: [-26, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 470, pins: ['h10', 'h14'] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'T-4' }];
    sc.meters = [{ id: 'm1', mode: 'V', at: [93, 4], scale: 0.5, jack: 'VΩmA' }];
    const setCase = (lab, k) => {
      const s = lab.scene;
      s.parts[0].v = 9; s.parts[1].value = 470; s.parts[2].pins = ['g14', 'g15']; s.wires[1].cut = false;
      const f = CASES[k];
      if (f === 'res') s.parts[1].value = 47000; else if (f === 'open') s.wires[1].cut = true; else if (f === 'bat') s.parts[0].v = 1.4; else if (f === 'rev') s.parts[2].pins = ['g15', 'g14'];
      lab.bench && lab.bench.repairAll(); lab.rebuild();
    };
    EM.Lab.mount(sim, {
      aspect: 1.7, scene: sc, speeds: false, below: true, hint: 'Use el multímetro (V) entre rieles, en la resistencia y en el LED.',
      controls: [
        { type: 'select', id: 'caso', label: 'Caso', options: [[0, 'Caso 1'], [1, 'Caso 2'], [2, 'Caso 3'], [3, 'Caso 4']], value: 0, apply: (lab, v) => { setCase(lab, +v); msg = 'Mida con el multímetro y escoja su diagnóstico.'; } },
        { type: 'select', id: 'dx', label: 'Su diagnóstico', options: DIAG, value: 'open', apply: () => {} },
        { type: 'button', label: 'Comprobar diagnóstico', run: (lab) => { const k = +sim.p.caso, ok = sim.p.dx === CASES[k]; if (ok) { done[k] = true; } msg = ok ? '✔ Correcto: ' + DIAG.find((d) => d[0] === CASES[k])[1] + '.' : '✘ No. Mida otra vez: ¿hay corriente? ¿cuánta tensión hay en cada pieza?'; } }
      ],
      outs: [{ id: 'r', label: 'Resultado', hl: true, fn: () => msg }, { id: 'n', label: 'Casos resueltos', fn: () => Object.keys(done).length + ' de 4' }]
    });
  });
})();
