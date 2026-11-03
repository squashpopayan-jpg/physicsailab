/* Capítulo 12 — Entradas analógicas */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const pot = (id, pins) => ({ id, type: 'POT', value: 10000, pos: 0.5, pins });
  const posCtl = (id) => ({ type: 'slider', id: 'pos', label: 'Posición del cursor del potenciómetro', min: 0, max: 1, step: 0.01, value: 0.5, fmt: (v) => Math.round(v * 100) + ' %', apply: (lab, v) => { CV.partOf(lab, id).pos = v; } });

  EM.defineSim('pot', function (sim) {
    const sc = CV.uno({ parts: [pot('RV1', ['e8', 'e9', 'e10'])], wires: [{ a: 'a8', b: '@5V' }, { a: 'a10', b: '@GND' }, { a: 'a9', b: '@A0' }] });
    const code = 'void setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int lectura = analogRead(A0);            // 0 a 1023\n  float voltaje = lectura * 5.0 / 1023.0;  // a voltios\n  Serial.print(lectura);\n  Serial.print("  ->  ");\n  Serial.print(voltaje);\n  Serial.println(" V");\n  delay(300);\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: sc, code, speeds: [[1, '1×'], [5, '5×']], controls: [posCtl('RV1')], meter: { mode: 'V' }, meterAt: [96, 4],
      scope: { channels: [{ fn: (lab) => lab.bench.v('uno:A0'), label: 'Tensión en A0', color: '--c1' }], span: 10, ymin: 0, ymax: 5.5, aspect: 5 },
      outs: [{ id: 'v', label: 'Tensión real en A0', hl: true, fn: (lab) => EM.fix(lab.bench.v('uno:A0'), 3) + ' V' }] });
  });

  EM.defineSim('barra', function (sim) {
    const L = CV.leds(['@D2', '@D3', '@D4', '@D5', '@D6'], ['verde', 'verde', 'amarillo', 'amarillo', 'rojo']);
    const sc = CV.uno({ parts: L.parts.concat([pot('RV1', ['e4', 'e5', 'e6'])]), wires: L.wires.concat([{ a: '@5V', b: 'B+1' }, { a: '@GND', b: 'B-1' }, { a: 'a4', b: 'B+4' }, { a: 'a6', b: 'B-4' }, { a: 'a5', b: '@A0' }]) });
    const code = 'int leds[] = {2, 3, 4, 5, 6};\n\nvoid setup() {\n  for (int i = 0; i < 5; i++) pinMode(leds[i], OUTPUT);\n}\n\nvoid loop() {\n  int lectura = analogRead(A0);\n  int n = map(lectura, 0, 1023, 0, 5);   // cuántos LED encender\n  for (int i = 0; i < 5; i++) {\n    digitalWrite(leds[i], i < n ? HIGH : LOW);\n  }\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: sc, code, speeds: [[1, '1×']], controls: [posCtl('RV1')],
      outs: [{ id: 'n', label: 'LED encendidos', hl: true, fn: (lab) => lab.scene.parts.filter((p) => p.type === 'LED' && lab.bench.partCurrent(p) > 0.002).length + ' de 5' }] });
  });

  const ESPCODE = (n) => `const int PIN = 34;      // GPIO 34 (ADC1, solo entrada)\nconst int N = ${n};          // lecturas que se promedian\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  long suma = 0;\n  for (int i = 0; i < N; i++) {\n    suma += analogRead(PIN);\n  }\n  int lectura = suma / N;\n  float voltaje = lectura * 3.3 / 4095.0;\n  Serial.print(lectura);\n  Serial.print("  ->  ");\n  Serial.print(voltaje, 2);\n  Serial.println(" V");\n  delay(300);\n}\n`;
  EM.defineSim('espadc', function (sim) {
    const sc = CV.esp({ parts: [pot('RV1', ['e20', 'e21', 'e22'])], wires: [{ a: 'a20', b: '@3V3' }, { a: 'a22', b: '@GND' }, { a: 'a21', b: '@G34' }] });
    EM.Lab.mount(sim, { aspect: 1.75, scene: sc, code: ESPCODE(1), speeds: [[1, '1×'], [5, '5×']],
      controls: [posCtl('RV1'), { type: 'seg', id: 'n', label: 'Lecturas promediadas', options: [[1, '1'], [16, '16']], value: 1, apply: (lab, v) => { lab.cfg.code = ESPCODE(+v); if (lab.mcu) lab.setCode(ESPCODE(+v)); } }],
      outs: [{ id: 'v', label: 'Tensión real en el pin', hl: true, fn: (lab) => EM.fix(lab.bench.v('esp:G34'), 3) + ' V' }] });
  });
})();
