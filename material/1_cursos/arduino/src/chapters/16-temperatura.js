/* Capítulo 16 — Temperatura y humedad */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const tempCtl = (min, max, val) => ({ type: 'slider', id: 'temp', label: 'Temperatura real', min, max, step: 0.5, value: val, unit: '°C', apply: (lab, v) => { lab.scene.env.temp = v; } });

  EM.defineSim('ntc', function (sim) {
    const sc = CV.uno({ parts: [{ id: 'NTC1', type: 'NTC', pins: ['h10', 'h14'] }, { id: 'R1', type: 'R', value: 10000, pins: ['g14', 'g18'] }], wires: [{ a: '@5V', b: 'T+1' }, { a: '@GND', b: 'T-1' }, { a: 'T+3', b: 'j10' }, { a: 'j18', b: 'T-3' }, { a: 'j14', b: '@A0' }] });
    const code = 'const float BETA = 3950.0;\nconst float R0 = 10000.0;      // NTC a 25 °C\nconst float RFIJA = 10000.0;   // resistencia fija a GND\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int lectura = analogRead(A0);\n  float r = RFIJA * (1023.0 / lectura - 1.0);        // resistencia del NTC\n  float kelvin = 1.0 / (1.0 / 298.15 + log(r / R0) / BETA);\n  float celsius = kelvin - 273.15;\n  Serial.print(lectura);\n  Serial.print("  R = ");\n  Serial.print(r, 0);\n  Serial.print(" ohm  T = ");\n  Serial.print(celsius, 1);\n  Serial.println(" C");\n  delay(500);\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: sc, code, speeds: [[1, '1×'], [5, '5×']], controls: [tempCtl(-10, 100, 25)],
      outs: [{ id: 'r', label: 'Resistencia real del NTC', fn: (lab) => EM.spice.fmtR(EM.spice.ntc(lab.scene.env.temp)) }] });
  });

  EM.defineSim('lm35', function (sim) {
    const sc = CV.uno({ parts: [{ id: 'T1', type: 'LM35', pins: ['j10', 'j11', 'j12'] }], wires: [{ a: 'i10', b: '@5V' }, { a: 'i12', b: '@GND' }, { a: 'i11', b: '@A0' }] });
    const code = 'void setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int lectura = analogRead(A0);\n  float voltaje = lectura * 5.0 / 1024.0;\n  float celsius = voltaje * 100.0;      // 10 mV por grado\n  Serial.print(lectura);\n  Serial.print("  ");\n  Serial.print(voltaje, 3);\n  Serial.print(" V  ");\n  Serial.print(celsius, 1);\n  Serial.println(" C");\n  delay(500);\n}\n';
    EM.Lab.mount(sim, { aspect: 1.75, scene: sc, code, speeds: [[1, '1×'], [5, '5×']], controls: [tempCtl(0, 100, 25)],
      outs: [{ id: 'v', label: 'Salida del LM35', fn: (lab) => EM.fix(lab.bench.v('uno:A0') * 1000, 1) + ' mV' }] });
  });

  const DHTC = 'DHT dht(2, DHT11);\n\nvoid setup() {\n  Serial.begin(9600);\n  dht.begin();\n}\n\nvoid loop() {\n  float h = dht.readHumidity();\n  float t = dht.readTemperature();\n  if (isnan(h) || isnan(t)) {\n    Serial.println("Error de lectura");\n  } else {\n    Serial.print("Temperatura: ");\n    Serial.print(t, 0);\n    Serial.print(" C   Humedad: ");\n    Serial.print(h, 0);\n    Serial.println(" %");\n  }\n  delay(2000);\n}\n';
  EM.defineSim('dht', function (sim) {
    const sc = CV.uno({ parts: [{ id: 'DH1', type: 'DHT11', pins: ['j10', 'j11', 'j12'], temp: 24, hum: 60 }, { id: 'R1', type: 'R', value: 10000, pins: ['h10', 'h11'] }], wires: [{ a: 'i10', b: '@5V' }, { a: 'i12', b: '@GND' }, { a: 'i11', b: '@D2' }] });
    EM.Lab.mount(sim, { aspect: 1.75, scene: sc, code: DHTC, speeds: [[1, '1×'], [5, '5×']],
      faults: [{ id: 'pu', label: 'Quitar la resistencia pull-up', apply: (s) => { s.parts[1].pins = [null, null]; }, revert: (s) => { s.parts[1].pins = ['h10', 'h11']; } }],
      controls: [{ type: 'slider', id: 'temp', label: 'Temperatura real', min: 0, max: 50, step: 0.5, value: 24, unit: '°C', apply: (lab, v) => { CV.partOf(lab, 'DH1').temp = v; } }, { type: 'slider', id: 'hum', label: 'Humedad relativa real', min: 20, max: 90, step: 1, value: 60, unit: '%', apply: (lab, v) => { CV.partOf(lab, 'DH1').hum = v; } }] });
  });
})();
