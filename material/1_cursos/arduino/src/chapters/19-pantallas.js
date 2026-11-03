/* Capítulo 19 — Pantallas LCD con I²C */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const SCAN = '#include <Wire.h>\n\nvoid setup() {\n  Serial.begin(9600);\n  Wire.begin();\n  int n = 0;\n  for (byte a = 1; a < 127; a++) {\n    Wire.beginTransmission(a);\n    if (Wire.endTransmission() == 0) {     // alguien contestó\n      Serial.print("Dispositivo I2C en 0x");\n      Serial.println(a, HEX);\n      n++;\n    }\n  }\n  if (n == 0) Serial.println("No se encontro nada");\n}\n\nvoid loop() {\n}\n';
  const LCD = '#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);   // dirección, columnas, filas\n\nvoid setup() {\n  lcd.init();\n  lcd.backlight();\n  lcd.setCursor(0, 0);\n  lcd.print("Hola, mundo!");\n}\n\nvoid loop() {\n  lcd.setCursor(0, 1);\n  lcd.print("t = ");\n  lcd.print(millis() / 1000);\n  lcd.print(" s   ");\n  delay(200);\n}\n';
  EM.defineSim('lcd', function (sim) {
    const sc = CV.uno({ parts: [{ id: 'LCD1', type: 'LCDI2C', pins: ['j10', 'j11', 'j12', 'j13'] }], wires: [{ id: 'wg', a: 'i10', b: '@GND' }, { id: 'wv', a: 'i11', b: '@5V' }, { id: 'wsda', a: 'i12', b: '@A4' }, { id: 'wscl', a: 'i13', b: '@A5' }] });
    const reset = (s) => { s.parts[0].addr = 0x27; s.wires[0].cut = false; s.wires[1].cut = false; s.wires[2].b = '@A4'; s.wires[3].b = '@A5'; };
    EM.Lab.mount(sim, {
      aspect: 1.5, scene: sc, code: LCD, speeds: [[1, '1×'], [5, '5×']], faultsExclusive: true, hint: 'Pruebe el escáner y luego el programa de la pantalla; active una falla y compare.',
      controls: [{ type: 'button', label: 'Cargar el escáner I²C', run: (lab) => lab.setCode(SCAN) }, { type: 'button', label: 'Cargar el programa de la pantalla', run: (lab) => lab.setCode(LCD) }],
      faults: [
        { id: 'addr', label: 'La pantalla responde en 0x3F (no en 0x27)', apply: (s) => { reset(s); s.parts[0].addr = 0x3f; }, revert: reset },
        { id: 'cross', label: 'SDA y SCL cruzados', apply: (s) => { reset(s); s.wires[2].b = '@A5'; s.wires[3].b = '@A4'; }, revert: reset },
        { id: 'novcc', label: 'Cable de alimentación (VCC) desconectado', apply: (s) => { reset(s); s.wires[1].cut = true; }, revert: reset }
      ]
    });
  });
})();
