/* Capítulo 15 — Tiempo sin bloqueo */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const btn = () => ({ parts: [{ id: 'S1', type: 'BTN', pins: ['f23', 'f25', 'e23', 'e25'] }], wires: [{ id: 'wb', a: '@D2', b: 'j23' }, { id: 'wbg', a: 'a23', b: '@GND' }] });
  const scene = (pins, cols) => { const L = CV.leds(pins, cols); const b = btn(); return CV.uno({ parts: L.parts.concat(b.parts), wires: L.wires.concat(b.wires) }); };

  const CD = 'void setup() {\n  pinMode(8, OUTPUT);\n  pinMode(9, OUTPUT);\n  pinMode(4, OUTPUT);\n  pinMode(2, INPUT_PULLUP);\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  delay(500);\n  digitalWrite(8, LOW);\n  delay(500);\n  digitalWrite(4, !digitalRead(2));   // el botón solo se mira aquí\n}\n';
  const CM = 'unsigned long t8 = 0, t9 = 0;\nbool e8 = false, e9 = false;\n\nvoid setup() {\n  pinMode(8, OUTPUT);\n  pinMode(9, OUTPUT);\n  pinMode(4, OUTPUT);\n  pinMode(2, INPUT_PULLUP);\n}\n\nvoid loop() {\n  unsigned long ahora = millis();\n  if (ahora - t8 >= 500) {        // LED 1 cada 500 ms\n    t8 = ahora;\n    e8 = !e8;\n    digitalWrite(8, e8);\n  }\n  if (ahora - t9 >= 130) {        // LED 2 cada 130 ms\n    t9 = ahora;\n    e9 = !e9;\n    digitalWrite(9, e9);\n  }\n  digitalWrite(4, !digitalRead(2));   // el botón se mira siempre\n}\n';
  EM.defineSim('millis', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: scene(['@D8', '@D9', '@D4'], ['rojo', 'amarillo', 'verde']), code: CD, speeds: [[1, '1×'], [3, '3×']], hint: 'Mantenga pulsado el botón con el cursor: el LED verde debe seguirlo.',
      controls: [{ type: 'seg', id: 'p', label: 'Programa', options: [['d', 'Con delay'], ['m', 'Con millis']], value: 'd', apply: (lab, v) => { const c = v === 'd' ? CD : CM; lab.cfg.code = c; if (lab.mcu) lab.setCode(c); } }]
    });
  });

  const EST = 'const int ROJO = 10;\nconst int AMARILLO = 9;\nconst int VERDE = 8;\nconst int BOTON = 2;\n\nint estado = 0;                 // 0 verde, 1 amarillo, 2 rojo\nunsigned long inicio = 0;\nbool peticion = false;\n\nvoid luces(int r, int a, int v) {\n  digitalWrite(ROJO, r);\n  digitalWrite(AMARILLO, a);\n  digitalWrite(VERDE, v);\n}\n\nvoid setup() {\n  pinMode(ROJO, OUTPUT);\n  pinMode(AMARILLO, OUTPUT);\n  pinMode(VERDE, OUTPUT);\n  pinMode(BOTON, INPUT_PULLUP);\n  luces(LOW, LOW, HIGH);\n}\n\nvoid loop() {\n  unsigned long t = millis() - inicio;\n  if (digitalRead(BOTON) == LOW) peticion = true;\n\n  switch (estado) {\n    case 0:                       // verde\n      if (peticion && t >= 6000) { estado = 1; inicio = millis(); luces(LOW, HIGH, LOW); }\n      break;\n    case 1:                       // amarillo\n      if (t >= 2000) { estado = 2; inicio = millis(); luces(HIGH, LOW, LOW); }\n      break;\n    case 2:                       // rojo\n      if (t >= 5000) { estado = 0; inicio = millis(); peticion = false; luces(LOW, LOW, HIGH); }\n      break;\n  }\n}\n';
  EM.defineSim('estados', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: scene(['@D10', '@D9', '@D8'], ['rojo', 'amarillo', 'verde']), code: EST, speeds: [[1, '1×'], [5, '5×']], hint: 'Pulse el botón de peatones (clic sostenido).',
      outs: [{ id: 'e', label: 'Estado actual', hl: true, fn: (lab) => { const d = lab.scene.parts.filter((p) => p.type === 'LED').map((p) => lab.bench.partCurrent(p) > 0.002); return d[0] ? 'ROJO (peatones cruzan)' : d[1] ? 'AMARILLO' : d[2] ? 'VERDE (carros pasan)' : '—'; } }]
    });
  });
})();
