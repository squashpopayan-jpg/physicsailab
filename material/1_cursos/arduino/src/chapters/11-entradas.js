/* Capítulo 11 — Entradas digitales */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const CHG = (mode) => `int ultimo = -1;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(2, ${mode});\n}\n\nvoid loop() {\n  int v = digitalRead(2);\n  if (v != ultimo) {          // solo escribe cuando cambia\n    Serial.println(v);\n    ultimo = v;\n  }\n  delay(3);\n}\n`;
  const sceneBtn = () => ({ parts: [{ id: 'S1', type: 'BTN', pins: ['f10', 'f12', 'e10', 'e12'] }, { id: 'R1', type: 'R', value: 10000, pins: [null, null] }], wires: [{ id: 'wd', a: '@D2', b: 'j10' }, { id: 'wv', a: 'a10', b: '@5V' }, { id: 'wg', a: 'j15', b: '@GND', cut: true }] });

  EM.defineSim('boton', function (sim) {
    const sc = CV.uno(sceneBtn());
    const MODES = {
      flota: { code: CHG('INPUT'), set: (s) => { s.parts[1].pins = [null, null]; s.wires[1].b = '@5V'; s.wires[2].cut = true; } },
      pd: { code: CHG('INPUT'), set: (s) => { s.parts[1].pins = ['h10', 'h15']; s.wires[1].b = '@5V'; s.wires[2].cut = false; } },
      pu: { code: CHG('INPUT_PULLUP'), set: (s) => { s.parts[1].pins = [null, null]; s.wires[1].b = '@GND'; s.wires[2].cut = true; } }
    };
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, code: MODES.flota.code, speeds: [[1, '1×'], [3, '3×']], hint: 'Haga clic sobre el pulsador para pulsarlo (se mantiene mientras sostiene el clic).',
      controls: [{ type: 'seg', id: 'm', label: 'Conexión del pulsador', options: [['flota', 'Sin resistencia (flotante)'], ['pd', 'Pull-down de 10 kΩ'], ['pu', 'INPUT_PULLUP']], value: 'flota', apply: (lab, v) => { MODES[v].set(lab.scene); lab.cfg.code = MODES[v].code; if (lab.mcu) { lab.rebuild(); lab.setCode(MODES[v].code); } } }],
      outs: [
        { id: 'v', label: 'Tensión en el pin D2', hl: true, fn: (lab) => EM.fix(lab.bench.v('uno:D2'), 2) + ' V' },
        { id: 'f', label: '¿Está al aire?', fn: (lab) => (lab.bench.isFloating('uno:D2') ? 'sí (flotante)' : 'no (nivel definido)') }
      ]
    });
  });

  const CUENTA = (anti) => `int cuenta = 0;\nint anterior = HIGH;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(2, INPUT_PULLUP);\n}\n\nvoid loop() {\n  int v = digitalRead(2);\n  if (anterior == HIGH && v == LOW) {   // flanco de bajada: pulsación\n    cuenta++;\n    Serial.println(cuenta);\n${anti ? '    delay(30);                         // antirrebote\n' : ''}  }\n  anterior = v;\n}\n`;
  EM.defineSim('rebote', function (sim) {
    const s0 = sceneBtn(); s0.parts[1].pins = [null, null]; s0.wires[1].b = '@GND'; s0.wires[2].cut = true;
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: CV.uno(s0), code: CUENTA(false), speeds: [[1, '1×']], hint: 'Pulse y suelte el pulsador varias veces con clics rápidos.',
      world: (lab) => {
        let last = false, until = 0, nextT = 0, c = false;
        return { dt: 0.0004, update(us) {
          const p = lab.scene.parts.find((q) => q.id === 'S1'), want = !!p.pressed;
          if (want !== last) { last = want; until = us + 2500 + Math.random() * 2500; nextT = us; }
          if (us < until) { if (us >= nextT) { c = !c; nextT = us + 200 + Math.random() * 500; p.contact = c; return true; } return false; }
          if (p.contact !== want) { p.contact = want; c = want; return true; }
          return false;
        } };
      },
      controls: [{ type: 'seg', id: 'a', label: 'Programa', options: [['no', 'Sin antirrebote'], ['si', 'Con antirrebote (30 ms)']], value: 'no', apply: (lab, v) => { lab.cfg.code = CUENTA(v === 'si'); if (lab.mcu) lab.setCode(CUENTA(v === 'si')); } }],
      outs: [{ id: 'c', label: 'Última cuenta enviada', hl: true, fn: (lab) => { const m = lab.serialText.trim().split(/\s+/).filter(Boolean); return m.length ? m[m.length - 1] : '0'; } }]
    });
  });
})();
