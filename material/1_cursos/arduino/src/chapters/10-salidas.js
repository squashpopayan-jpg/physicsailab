/* Capítulo 10 — Salidas digitales */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const ledOuts = (n) => [{ id: 'i', label: 'Corriente total de los LED', hl: true, fn: (lab) => EM.fmtI(lab.scene.parts.filter((p) => p.type === 'LED').reduce((s, p) => s + lab.bench.partCurrent(p), 0)) }];

  EM.defineSim('semaforo', function (sim) {
    const L = CV.leds(['@D10', '@D9', '@D8'], ['rojo', 'amarillo', 'verde']);
    const code = 'const int ROJO = 10;\nconst int AMARILLO = 9;\nconst int VERDE = 8;\n\nvoid setup() {\n  pinMode(ROJO, OUTPUT);\n  pinMode(AMARILLO, OUTPUT);\n  pinMode(VERDE, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(ROJO, HIGH);      // alto: 5 s\n  delay(5000);\n  digitalWrite(ROJO, LOW);\n\n  digitalWrite(VERDE, HIGH);     // adelante: 3 s\n  delay(3000);\n  digitalWrite(VERDE, LOW);\n\n  digitalWrite(AMARILLO, HIGH);  // precaución: 1 s\n  delay(1000);\n  digitalWrite(AMARILLO, LOW);\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: CV.uno({ parts: L.parts, wires: L.wires }), code, speeds: [[1, '1×'], [5, '5×'], [20, '20×']], outs: ledOuts() });
  });

  EM.defineSim('secuencia', function (sim) {
    const L = CV.leds(['@D2', '@D3', '@D4', '@D5', '@D6'], ['rojo', 'rojo', 'rojo', 'rojo', 'rojo']);
    const code = 'int leds[] = {2, 3, 4, 5, 6};\nconst int N = 5;\n\nvoid setup() {\n  for (int i = 0; i < N; i++) {\n    pinMode(leds[i], OUTPUT);\n  }\n}\n\nvoid loop() {\n  for (int i = 0; i < N; i++) {          // ida\n    digitalWrite(leds[i], HIGH);\n    delay(100);\n    digitalWrite(leds[i], LOW);\n  }\n  for (int i = N - 2; i > 0; i--) {      // vuelta\n    digitalWrite(leds[i], HIGH);\n    delay(100);\n    digitalWrite(leds[i], LOW);\n  }\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: CV.uno({ parts: L.parts, wires: L.wires }), code, speeds: [[0.25, '0,25×'], [1, '1×'], [5, '5×']], outs: ledOuts() });
  });

  EM.defineSim('sos', function (sim) {
    const L = CV.leds(['@D8'], ['rojo']);
    const code = 'const int LED = 8;\n\nvoid pulso(int ms) {\n  digitalWrite(LED, HIGH);\n  delay(ms);\n  digitalWrite(LED, LOW);\n  delay(200);\n}\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  for (int i = 0; i < 3; i++) pulso(200);   // S\n  delay(400);\n  for (int i = 0; i < 3; i++) pulso(600);   // O\n  delay(400);\n  for (int i = 0; i < 3; i++) pulso(200);   // S\n  delay(2000);\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: CV.uno({ parts: L.parts, wires: L.wires }), code, speeds: [[1, '1×'], [5, '5×'], [20, '20×']], sound: false,
      scope: { channels: [{ ref: 'uno:D8', label: 'Pin 8', color: '--c2' }], span: 12, ymin: -0.3, ymax: 5.5 } });
  });
})();
