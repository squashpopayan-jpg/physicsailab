/* Capítulo 9 — El primer sketch */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;

  const BLINK = 'void setup() {\n  pinMode(LED_BUILTIN, OUTPUT);   // LED de la placa (pin 13)\n  pinMode(8, OUTPUT);             // LED externo\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  digitalWrite(8, HIGH);\n  delay(500);\n  digitalWrite(LED_BUILTIN, LOW);\n  digitalWrite(8, LOW);\n  delay(500);\n}\n';

  EM.defineSim('blink', function (sim) {
    const L = CV.leds(['@D8'], ['rojo']);
    const sc = CV.uno({ parts: L.parts, wires: L.wires });
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, code: BLINK, speeds: [[0.25, '0,25×'], [1, '1×'], [5, '5×'], [20, '20×']], hint: 'Edite el código y pulse «Compilar y subir».',
      outs: [
        { id: 'p', label: 'Estado del pin 8', hl: true, fn: (lab) => (lab.bench.v('uno:D8') > 2.5 ? 'ALTO (5 V)' : 'bajo (0 V)') },
        { id: 'i', label: 'Corriente del LED externo', fn: (lab) => EM.fmtI(lab.bench.partCurrent(lab.scene.parts[1])) }
      ]
    });
  });

  const ERR = {
    pc: 'void setup() {\n  pinMode(8, OUTPUT)\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  delay(500);\n  digitalWrite(8, LOW);\n  delay(500);\n}\n',
    typo: 'const int ledPin = 8;\n\nvoid setup() {\n  pinMode(ledpin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(ledPin, HIGH);\n  delay(500);\n  digitalWrite(ledPin, LOW);\n  delay(500);\n}\n',
    llave: 'void setup() {\n  pinMode(8, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  delay(500);\n  digitalWrite(8, LOW);\n  delay(500);\n',
    func: 'void setup() {\n  pinMode(8, OUTPUT);\n}\n\nvoid loop() {\n  digitalwrite(8, HIGH);\n  delay(500);\n  digitalWrite(8, LOW);\n  delay(500);\n}\n',
    silencio: 'void setup() {\n  // ¡falta pinMode!\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  delay(500);\n  digitalWrite(8, LOW);\n  delay(500);\n}\n',
    ok: 'void setup() {\n  pinMode(8, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  delay(500);\n  digitalWrite(8, LOW);\n  delay(500);\n}\n'
  };
  EM.defineSim('errcod', function (sim) {
    const L = CV.leds(['@D8'], ['rojo']);
    const sc = CV.uno({ parts: L.parts, wires: L.wires });
    const ld = (k) => ({ type: 'button', label: { pc: 'Falta «;»', typo: 'Variable mal escrita', llave: 'Llave sin cerrar', func: 'Función mal escrita', silencio: 'Sin pinMode (silencioso)', ok: 'Programa correcto' }[k], run: (lab) => lab.setCode(ERR[k]), newRow: k === 'silencio' });
    EM.Lab.mount(sim, {
      aspect: 1.9, scene: sc, code: ERR.pc, speeds: [[1, '1×'], [5, '5×']], hint: 'Cargue un programa con error y pulse «Compilar y subir».',
      controls: [ld('pc'), ld('typo'), ld('llave'), ld('func'), ld('silencio'), ld('ok')],
      outs: [{ id: 'i', label: 'Corriente del LED', hl: true, fn: (lab) => EM.fmtI(lab.bench.partCurrent(lab.scene.parts[1])) }]
    });
  });

  EM.defineSim('espblink', function (sim) {
    const L = CV.leds(['@G4'], ['rojo'], 100);
    L.wires[0].a = '@GND';
    const sc = CV.esp({ parts: L.parts.map((p) => { if (p.id === 'R1') p.pins = ['h20', 'h23']; if (p.id === 'D1') p.pins = ['g23', 'g24']; return p; }), wires: [{ id: 'wl', a: '@G4', b: 'j20' }, { id: 'wk', a: 'j24', b: 'T-24' }, { id: 'wg', a: '@GND', b: 'T-1' }] });
    const code = 'const int ledExterno = 4;\n\nvoid setup() {\n  pinMode(LED_BUILTIN, OUTPUT);   // LED azul de la placa (GPIO 2)\n  pinMode(ledExterno, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  digitalWrite(ledExterno, HIGH);\n  delay(500);\n  digitalWrite(LED_BUILTIN, LOW);\n  digitalWrite(ledExterno, LOW);\n  delay(500);\n}\n';
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, code, speeds: [[1, '1×'], [5, '5×']],
      outs: [{ id: 'i', label: 'Corriente del LED externo', hl: true, fn: (lab) => EM.fmtI(lab.bench.partCurrent(lab.scene.parts.find((p) => p.id === 'D1'))) }]
    });
  });
})();
