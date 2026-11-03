/* Capítulo 28 — Proyecto final: lámpara nocturna y taller de depuración */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;

  const CODE = (pin) => `const int LDR = A0;           // divisor de tensión con la fotorresistencia
const int LED = ${pin};

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int luz = analogRead(LDR);                 // 0 (oscuro) a 1023 (mucha luz)
  int brillo = map(luz, 0, 1023, 255, 0);    // más oscuro, más brillo
  analogWrite(LED, brillo);
  Serial.print("luz = ");
  Serial.print(luz);
  Serial.print("   brillo = ");
  Serial.println(brillo);
  delay(200);
}
`;

  EM.defineSim('final', function (sim) {
    const L = CV.leds(['@D9'], ['amarillo']);
    const sc = CV.uno({
      parts: L.parts.concat([
        { id: 'LDR1', type: 'LDR', pins: ['e20', 'e21'] },
        { id: 'R2', type: 'R', value: 10000, pins: ['d21', 'd22'] }
      ]),
      wires: L.wires.concat([{ id: 'wv', a: 'a20', b: '@5V' }, { id: 'wa', a: 'a21', b: '@A0' }, { id: 'wt', a: 'a22', b: '@GND' }])
    });
    const part = (s, id) => s.parts.find((p) => p.id === id);
    EM.Lab.mount(sim, {
      aspect: 1.55, scene: sc, code: CODE(9), speeds: [[1, '1×'], [3, '3×']], meter: { mode: 'V' }, meterAt: [96, 4], faultsExclusive: false,
      hint: 'Active las fallas de una en una, observe el síntoma y localícela con el multímetro.',
      controls: [
        { type: 'slider', id: 'lux', label: 'Luz en la habitación', min: 1, max: 1000, log: true, value: 300, unit: 'lux', step: 1, fmt: (v) => String(Math.round(v)), apply: (lab, v) => { lab.scene.env.lux = +v; } }
      ],
      faults: [
        { id: 'rev', label: 'LED montado al revés', apply: (s) => { part(s, 'D1').pins = ['g6', 'g5']; }, revert: (s) => { part(s, 'D1').pins = ['g5', 'g6']; } },
        { id: 'gnd', label: 'Cable de tierra del LED suelto', apply: (s) => { s.wires.find((w) => w.id === 'wk0').cut = true; }, revert: (s) => { s.wires.find((w) => w.id === 'wk0').cut = false; } },
        { id: 'r22', label: 'Resistencia de 22 Ω en vez de 220 Ω', apply: (s) => { part(s, 'R1').value = 22; }, revert: (s) => { part(s, 'R1').value = 220; } },
        { id: 'div', label: 'Falta la resistencia de 10 kΩ del divisor', apply: (s) => { part(s, 'R2').pins = [null, null]; }, revert: (s) => { part(s, 'R2').pins = ['d21', 'd22']; } },
        { id: 'pin', label: 'Programa con el pin equivocado (10 en vez de 9)', apply: (s, lab) => { lab.setCode(CODE(10)); }, revert: (s, lab) => { lab.setCode(CODE(9)); } }
      ],
      outs: [
        { id: 'a0', label: 'Tensión en A0', hl: true, fn: (lab) => EM.fix(lab.bench.v('uno:A0'), 2) + ' V' },
        { id: 'il', label: 'Corriente del LED', fn: (lab) => EM.fmtI(lab.bench.partCurrent(CV.partOf(lab, 'D1'))) }
      ]
    });
  });
})();
