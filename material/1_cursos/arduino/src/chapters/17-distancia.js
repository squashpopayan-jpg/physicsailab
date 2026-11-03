/* Capítulo 17 — Distancia con ultrasonido */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const MEDIR = 'float medir() {\n  digitalWrite(TRIG, LOW);\n  delayMicroseconds(2);\n  digitalWrite(TRIG, HIGH);      // pulso de disparo de 10 us\n  delayMicroseconds(10);\n  digitalWrite(TRIG, LOW);\n  long duracion = pulseIn(ECHO, HIGH, 30000);   // espera hasta 30 ms\n  return duracion * 0.0343 / 2.0;               // centímetros\n}\n';
  const scene = (extra) => CV.uno({ env: { temp: 20 }, parts: [{ id: 'US1', type: 'HCSR04', distance: 100, pins: ['j10', 'j11', 'j12', 'j13'] }].concat(extra.parts || []), wires: [{ a: 'i10', b: '@5V' }, { a: 'i13', b: '@GND' }, { a: 'i11', b: '@D9' }, { a: 'i12', b: '@D10' }].concat(extra.wires || []) });
  const ctl = [
    { type: 'slider', id: 'd', label: 'Distancia real al obstáculo', min: 2, max: 450, step: 1, value: 100, unit: 'cm', apply: (lab, v) => { CV.partOf(lab, 'US1').distance = v; } },
    { type: 'slider', id: 'T', label: 'Temperatura del aire', min: 0, max: 40, step: 1, value: 20, unit: '°C', apply: (lab, v) => { lab.scene.env.temp = v; } }
  ];

  EM.defineSim('sonar', function (sim) {
    const code = 'const int TRIG = 9;\nconst int ECHO = 10;\n\n' + MEDIR + '\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(TRIG, OUTPUT);\n  pinMode(ECHO, INPUT);\n}\n\nvoid loop() {\n  float cm = medir();\n  Serial.print(cm, 1);\n  Serial.println(" cm");\n  delay(300);\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: scene({}), code, speeds: [[1, '1×'], [5, '5×']], controls: ctl,
      outs: [{ id: 't', label: 'Tiempo de ida y vuelta real', fn: (lab) => { const d = CV.partOf(lab, 'US1').distance / 100, v = 331.3 + 0.606 * lab.scene.env.temp; return d > 4 ? 'sin eco (fuera de alcance)' : EM.fix(2 * d / v * 1e6, 0) + ' µs'; } }] });
  });

  EM.defineSim('parqueo', function (sim) {
    const code = 'const int TRIG = 9;\nconst int ECHO = 10;\nconst int BUZ = 6;\n\n' + MEDIR + '\nvoid setup() {\n  pinMode(TRIG, OUTPUT);\n  pinMode(ECHO, INPUT);\n  pinMode(BUZ, OUTPUT);\n}\n\nvoid loop() {\n  float cm = medir();\n  if (cm > 0 && cm < 10) {            // muy cerca: tono continuo\n    digitalWrite(BUZ, HIGH);\n    delay(60);\n  } else if (cm > 0 && cm < 100) {    // pitidos más rápidos cuanto más cerca\n    digitalWrite(BUZ, HIGH);\n    delay(30);\n    digitalWrite(BUZ, LOW);\n    delay(cm * 4);\n  } else {\n    digitalWrite(BUZ, LOW);\n    delay(100);\n  }\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: scene({ parts: [{ id: 'BZ1', type: 'BUZ', pins: ['e20', 'e22'] }], wires: [{ a: 'a20', b: '@D6' }, { a: 'a22', b: '@GND' }] }), code, sound: true, speeds: [[1, '1×'], [3, '3×']], controls: ctl.slice(0, 1) });
  });
})();
