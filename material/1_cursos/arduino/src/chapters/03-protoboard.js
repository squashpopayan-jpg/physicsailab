/* Capítulo 3 — La protoboard */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.parts, sp = EM.spice;

  const emptyBoard = () => ({ boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [], parts: [], wires: [], env: {} });

  /* 3.1 Mapa de conexiones */
  EM.defineSim('mapa', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.9, scene: emptyBoard(), bare: true, explore: true, below: true, hint: 'Mueva el cursor por la protoboard: se ilumina la tira del agujero señalado.',
      outs: [{ id: 'h', label: 'Agujero señalado', hl: true, fn: (lab) => (lab.exploreHole ? lab.describeHole(lab.exploreHole.ref) : 'Pase el cursor sobre un agujero.') }]
    });
  });

  /* 3.2 ¿Están conectados? */
  const Q = [
    ['e5', 'a5', true, 'Misma columna y misma mitad (a–e): están unidos por la tira.'],
    ['e5', 'f5', false, 'Están frente a frente, pero el canal central separa las dos mitades de la columna.'],
    ['j12', 'f12', true, 'Misma columna y misma mitad (f–j).'],
    ['T+3', 'T-3', false, 'Un riel positivo y uno negativo nunca se tocan: si lo hicieran, sería un cortocircuito.'],
    ['c10', 'c11', false, 'Columnas distintas: no hay tira que las una.'],
    ['T+2', 'T+22', true, 'Mismo riel: todos sus agujeros están unidos en horizontal (en esta protoboard).'],
    ['B-4', 'B-18', true, 'Mismo riel negativo inferior.'],
    ['g20', 'd20', false, 'Misma columna 20, pero g está arriba del canal y d abajo.']
  ];
  EM.defineSim('conectados', function (sim) {
    let msg = 'Elija una pregunta, decida «Sí» o «No» y pulse Comprobar.', idx = 0, score = 0, tries = 0, answered = {};
    const sc = emptyBoard();
    sc.meters = [{ id: 'm1', mode: 'CONT', at: [93, 4], scale: 0.5 }];
    const mark = (lab) => { const q = Q[idx]; lab.markers = [{ ref: 'bb:' + q[0], text: 'A' }, { ref: 'bb:' + q[1], text: 'B', color: '#1c7ed6' }]; };
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, bare: true, noTip: true, below: true, hint: 'Los agujeros A y B están marcados. Arrastre las puntas del multímetro (en continuidad) para verificarlo.',
      onReady: (lab) => mark(lab),
      controls: [
        { type: 'select', id: 'q', label: 'Pregunta', options: Q.map((q, i) => [i, `${i + 1}. ¿Están conectados ${q[0].replace('-', '−')} y ${q[1].replace('-', '−')}?`]), value: 0, apply: (lab, v) => { idx = +v; mark(lab); msg = 'Decida «Sí» o «No» y pulse Comprobar.'; } },
        { type: 'seg', id: 'a', label: 'Su respuesta', options: [[1, 'Sí, conectados'], [0, 'No']], value: 1, apply: () => {} },
        { type: 'button', label: 'Comprobar mi respuesta', run: (lab) => { const q = Q[idx]; tries++; const ok = (+sim.p.a === 1) === q[2]; if (ok && !answered[idx]) score++; answered[idx] = answered[idx] || ok; msg = (ok ? '✔ Correcto. ' : '✘ No. ') + q[3]; } },
        { type: 'button', label: 'Verificar con el multímetro', run: (lab) => { const q = Q[idx], m = lab.scene.meters[0]; m.mode = 'CONT'; m.red = 'bb:' + q[0]; m.black = 'bb:' + q[1]; lab.placeTips(m); lab.rebuild(); } }
      ],
      outs: [{ id: 'r', label: 'Resultado', hl: true, fn: () => msg }, { id: 's', label: 'Aciertos', fn: () => Object.values(answered).filter(Boolean).length + ' de ' + Q.length }]
    });
  });

  /* 3.3 Construir con LED */
  EM.defineSim('construye', function (sim) {
    const sc = emptyBoard();
    sc.parts = [{ id: 'B1', type: 'BAT', v: 9, rint: 1.7, at: [-26, 24], pins: ['T+2', 'T-2'], fixed: true }];
    sc.meters = [{ id: 'm1', mode: 'V', at: [93, 4], scale: 0.5 }];
    EM.Lab.mount(sim, {
      aspect: 1.7, scene: sc, below: true, speeds: false,
      edit: {
        tray: ['R', 'LED'], rvalue: 470,
        goal: (lab) => {
          const R = lab.scene.parts.find((p) => p.type === 'R'), D = lab.scene.parts.find((p) => p.type === 'LED');
          if (!D) return { ok: false, msg: 'Coloque un LED y una resistencia, y conéctelos a los rieles con cables.' };
          if (D.dead) return { ok: false, msg: 'El LED se quemó. ¿Falta la resistencia o es demasiado pequeña? Pulse «Quitar todo» para empezar de nuevo.' };
          const I = lab.bench.partCurrent(D);
          if (I > 0.003) return { ok: true, msg: `¡Funciona! Por el LED circulan ${EM.fix(I * 1000, 1)} mA` + (R ? ` con una resistencia de ${sp.fmtR(PT.val(R, 'value'))}.` : '.') };
          if (!R) return { ok: false, msg: 'Falta la resistencia en serie con el LED.' };
          return { ok: false, msg: 'Todavía no hay corriente: revise que el LED esté en el sentido correcto (pata larga hacia +) y que los cables lleguen a ambos rieles.' };
        }
      },
      controls: [{ type: 'select', id: 'rv', label: 'Valor de la resistencia que va a colocar', options: [[100, '100 Ω'], [220, '220 Ω'], [330, '330 Ω'], [470, '470 Ω'], [1000, '1 kΩ'], [4700, '4,7 kΩ']], value: 470, apply: (lab, v) => { lab.cfg.edit.rvalue = +v; const p = lab.scene.parts.find((q) => q.id === lab.sel && q.type === 'R'); if (p) p.value = +v; } }],
      outs: [{ id: 'I', label: 'Corriente por el LED', fn: (lab) => { const D = lab.scene.parts.find((p) => p.type === 'LED'); return D ? (D.dead ? '<span class="bad">LED quemado</span>' : EM.fmtI(lab.bench.partCurrent(D))) : '—'; } }]
    });
  });

  /* 3.4 Errores de montaje */
  EM.defineSim('errores', function (sim) {
    const sc = emptyBoard();
    sc.parts = [
      { id: 'B1', type: 'BAT', v: 9, rint: 1.7, at: [-26, 24], pins: ['T+2', 'T-2'] },
      { id: 'R1', type: 'R', value: 470, watt: 0.25, pins: ['h10', 'h14'] },
      { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] }
    ];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'T-4' }];
    sc.meters = [{ id: 'm1', mode: 'V', at: [93, 4], scale: 0.5 }];
    const reset = (s) => { const R = s.parts.find((p) => p.id === 'R1'), D = s.parts.find((p) => p.id === 'D1'); R.pins = ['h10', 'h14']; D.pins = ['g14', 'g15']; s.wires = s.wires.filter((w) => w.id === 'w1' || w.id === 'w2'); s.wires.find((w) => w.id === 'w1').a = 'T+4'; };
    const apply = (f) => (s, lab) => { reset(s); const R = s.parts.find((p) => p.id === 'R1'), D = s.parts.find((p) => p.id === 'D1'); f(s, R, D); };
    EM.Lab.mount(sim, {
      aspect: 1.7, scene: sc, below: true, speeds: false, faultsExclusive: true, hint: 'Active una falla y busque el error con el multímetro (modo V).',
      faults: [
        { id: 'col', label: 'Un cable de más, en paralelo con el LED', apply: (s) => { reset(s); s.wires.push({ id: 'w3', a: 'j14', b: 'j15', color: '#2a8f3d' }); }, revert: reset },
        { id: 'pue', label: 'Un cable de más, en paralelo con la resistencia', apply: (s) => { reset(s); s.wires.push({ id: 'w4', a: 'j10', b: 'j14', color: '#2a8f3d' }); }, revert: reset },
        { id: 'mit', label: 'Resistencia en la otra mitad de la protoboard', apply: (s) => { reset(s); s.parts.find((p) => p.id === 'R1').pins = ['h10', 'd14']; }, revert: reset },
        { id: 'flo', label: 'Una pata de la resistencia sin insertar a fondo', apply: (s) => { reset(s); s.parts.find((p) => p.id === 'R1').pins = ['h10', null]; }, revert: reset },
        { id: 'riel', label: 'Cable al riel equivocado (el negativo)', apply: (s) => { reset(s); s.wires.find((w) => w.id === 'w1').a = 'T-4'; }, revert: reset }
      ],
      outs: [
        { id: 'i', label: 'Corriente por el LED', hl: true, fn: (lab) => EM.fmtI(lab.bench.partCurrent(lab.scene.parts.find((p) => p.id === 'D1'))) },
        { id: 'vb', label: 'Tensión de la pila (entre rieles)', fn: (lab) => EM.fmtV(lab.bench.v('bb:T+4') - lab.bench.v('bb:T-4')) },
        { id: 'vr', label: 'Tensión en la resistencia', fn: (lab) => { const R = lab.scene.parts.find((p) => p.id === 'R1'); return R.pins[1] ? EM.fmtV(lab.bench.c.find('R1:main').vab) : '—'; } },
        { id: 'vd', label: 'Tensión en el LED', fn: (lab) => EM.fmtV(lab.bench.v('bb:g14') - lab.bench.v('bb:g15')) }
      ]
    });
  });
})();
