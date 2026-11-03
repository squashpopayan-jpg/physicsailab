(function () {
  'use strict';
  const EM = window.EM;
  EM.defineSim('home-hero', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.5,
      scene: { boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [{ id: 'uno', kind: 'uno', x: -78, y: 2 }],
        parts: [{ id: 'R1', type: 'R', value: 330, pins: ['e5', 'e10'] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['d10', 'd11'] }],
        wires: [{ a: '@D13', b: 'a5' }, { a: 'a11', b: '@GND' }] },
      code: 'void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(500);\n  digitalWrite(13, LOW);\n  delay(500);\n}\n',
      meter: { mode: 'V' }, meterAt: [92, 6]
    });
  });
})();
