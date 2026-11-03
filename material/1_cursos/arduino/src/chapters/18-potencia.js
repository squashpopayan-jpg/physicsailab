/* Capítulo 18 — Motores, relés y cargas de potencia */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;

  EM.defineSim('motor', function (sim) {
    const sc = CV.uno({
      parts: [
        { id: 'FB', type: 'LAB', v: 6, ilimit: 1.5, at: [118, 46], pins: ['B+3', 'B-3'] },
        { id: 'M1', type: 'MOTOR', at: [112, 14], pins: ['B+12', 'a21'] },
        { id: 'Q1', type: 'NMOS', model: 'IRLZ44N', pins: ['e20', 'e21', 'e22'] },
        { id: 'R1', type: 'R', value: 10000, pins: ['d20', 'd24'] },
        { id: 'RV1', type: 'POT', value: 10000, pos: 0.8, pins: ['e27', 'e28', 'e29'] }
      ],
      wires: [{ a: 'a20', b: '@D9' }, { a: 'a22', b: 'B-8' }, { a: 'a24', b: 'B-10' }, { a: 'B-5', b: '@GND' }, { a: 'a27', b: '@5V' }, { a: 'a29', b: '@GND' }, { a: 'a28', b: '@A0' }]
    });
    const code = 'void setup() {\n  pinMode(9, OUTPUT);\n}\n\nvoid loop() {\n  int lectura = analogRead(A0);\n  int pwm = map(lectura, 0, 1023, 0, 255);\n  analogWrite(9, pwm);          // velocidad del motor\n  delay(10);\n}\n';
    EM.Lab.mount(sim, {
      aspect: 1.55, scene: sc, code, speeds: [[1, '1×'], [3, '3×']],
      controls: [
        { type: 'slider', id: 'pos', label: 'Potenciómetro (velocidad)', min: 0, max: 1, step: 0.01, value: 0.8, fmt: (v) => Math.round(v * 100) + ' %', apply: (lab, v) => { CV.partOf(lab, 'RV1').pos = v; } },
        { type: 'check', id: 'freno', label: 'Frenar el eje con el dedo', value: false, apply: (lab, v) => { CV.partOf(lab, 'M1').load = v ? 0.02 : 0; } }
      ],
      outs: [
        { id: 'rpm', label: 'Velocidad del motor', hl: true, fn: (lab) => EM.fix(Math.abs(CV.partOf(lab, 'M1').omega || 0) * 60 / (2 * Math.PI), 0) + ' rpm' },
        { id: 'i', label: 'Corriente del motor', fn: (lab) => EM.fix(Math.abs(lab.bench.c.find('M1:main').i) * 1000, 0) + ' mA' },
        { id: 'pwm', label: 'Corriente que sale del pin D9', fn: (lab) => { const e = lab.bench.mcuInfo.uno.pins.D9; return e ? EM.fmtI(e.i) : '—'; } }
      ]
    });
  });

  EM.defineSim('rele', function (sim) {
    const sc = CV.uno({ parts: [{ id: 'K1', type: 'RELAYMOD', pins: ['j10', 'j11', 'j12'] }], wires: [{ a: 'i10', b: '@5V' }, { a: 'i11', b: '@GND' }, { a: 'i12', b: '@D7' }] });
    const code = 'const int RELE = 7;\n\nvoid setup() {\n  pinMode(RELE, OUTPUT);\n  digitalWrite(RELE, HIGH);     // módulo activo en BAJO: HIGH = apagado\n}\n\nvoid loop() {\n  digitalWrite(RELE, LOW);      // enciende el relé\n  delay(2000);\n  digitalWrite(RELE, HIGH);     // lo apaga\n  delay(2000);\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: sc, code, speeds: [[1, '1×'], [5, '5×']], labels: false,
      outs: [{ id: 'e', label: 'Relé', hl: true, fn: (lab) => (CV.partOf(lab, 'K1').on ? 'ACTIVADO (contacto cerrado)' : 'en reposo') },
        { id: 'c', label: 'Corriente de la bobina (de los 5 V)', fn: (lab) => EM.fix((CV.partOf(lab, 'K1').iload || 0) * 1000, 0) + ' mA' }] });
  });
})();
