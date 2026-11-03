/* Capítulo 13 — PWM */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;

  /* panel: señal del pin tal como la genera la placa */
  const pwmPanel = (pinId, period, label) => ({
    aspect: 4.2, label,
    draw(lab, cv) {
      const ctx = cv.ctx, q = lab.mcu && lab.mcu.pins[pinId];
      const pw = q && q.pwm, lvl = q ? (q.level ? 1 : 0) : 0;
      const T = pw ? 1 / pw.freq : period || 0.002, D = pw ? pw.duty : lvl;
      const cycles = 4, pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: cycles * T * 1000, ymin: -0.4, ymax: 5.8, xlabel: 'tiempo (ms)', ylabel: 'V', ml: 44, mr: 12, mt: 10, mb: 34 });
      pl.frame();
      const xs = [], ys = [];
      for (let k = 0; k < cycles; k++) { const t0 = k * T * 1000; xs.push(t0, t0, t0 + D * T * 1000, t0 + D * T * 1000, t0 + T * 1000); ys.push(0, D > 0 ? 5 : 0, D > 0 ? 5 : 0, 0, 0); }
      pl.xy(xs, ys, { color: '--c1', width: 2.4 });
      pl.hline(5 * D, { color: '--c2', dash: [5, 3] });
      pl.label(cycles * T * 1000 * 0.02, 5 * D + 0.35, 'media ' + EM.fix(5 * D, 2) + ' V · ciclo de trabajo ' + EM.fix(D * 100, 1) + ' %', { color: '--c2' });
    }
  });

  const FADE = 'int brillo = 0;\nint paso = 5;\n\nvoid setup() {\n  pinMode(9, OUTPUT);\n}\n\nvoid loop() {\n  analogWrite(9, brillo);\n  brillo = brillo + paso;\n  if (brillo <= 0 || brillo >= 255) {\n    paso = -paso;          // invierte el sentido\n  }\n  delay(30);\n}\n';
  const FIJO = (v) => `void setup() {\n  pinMode(9, OUTPUT);\n}\n\nvoid loop() {\n  analogWrite(9, ${v});   // ${Math.round(v / 255 * 1000) / 10} % de ciclo de trabajo\n}\n`;
  EM.defineSim('fade', function (sim) {
    const L = CV.leds(['@D9'], ['rojo']);
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: CV.uno({ parts: L.parts, wires: L.wires }), code: FADE, speeds: [[1, '1×'], [5, '5×']],
      controls: [{ type: 'seg', id: 'p', label: 'Programa', options: [['fade', 'Fundido'], [64, '64'], [128, '128'], [230, '230']], value: 'fade', apply: (lab, v) => { const c = v === 'fade' ? FADE : FIJO(+v); lab.cfg.code = c; if (lab.mcu) lab.setCode(c); } }],
      panel: pwmPanel('D9', 0.002, 'Señal del pin 9'),
      outs: [{ id: 'i', label: 'Corriente media del LED', hl: true, fn: (lab) => EM.fix(lab.bench.partCurrent(lab.scene.parts[1]) * 1000, 2) + ' mA' }]
    });
  });

  EM.defineSim('servo', function (sim) {
    const sc = CV.uno({
      parts: [{ id: 'SV1', type: 'SERVO', pins: ['j10', 'j11', 'j12'] }, { id: 'RV1', type: 'POT', value: 10000, pos: 0.5, pins: ['e20', 'e21', 'e22'] }],
      wires: [{ a: 'i10', b: '@GND' }, { a: 'i11', b: '@5V' }, { a: 'i12', b: '@D9' }, { a: 'a20', b: '@5V' }, { a: 'a22', b: '@GND' }, { a: 'a21', b: '@A0' }]
    });
    const code = '#include <Servo.h>\n\nServo miServo;\n\nvoid setup() {\n  miServo.attach(9);\n}\n\nvoid loop() {\n  int lectura = analogRead(A0);\n  int angulo = map(lectura, 0, 1023, 0, 180);\n  miServo.write(angulo);\n  delay(15);\n}\n';
    EM.Lab.mount(sim, {
      aspect: 1.6, scene: sc, code, speeds: [[1, '1×'], [5, '5×']],
      controls: [{ type: 'slider', id: 'pos', label: 'Posición del potenciómetro', min: 0, max: 1, step: 0.01, value: 0.5, fmt: (v) => Math.round(v * 100) + ' %', apply: (lab, v) => { CV.partOf(lab, 'RV1').pos = v; } }],
      panel: {
        aspect: 4.2, label: 'Pulso de control del servo (20 ms)',
        draw(lab, cv) {
          const q = lab.mcu && lab.mcu.pins.D9, d = q && q.pwm ? q.pwm.duty : 0;
          const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 20, ymin: -0.4, ymax: 5.8, xlabel: 'tiempo (ms)', ylabel: 'V', ml: 44, mr: 12, mt: 10, mb: 34 });
          pl.frame(); const w = d * 20;
          pl.xy([0, 0, w, w, 20], [0, 5, 5, 0, 0], { color: '--c1', width: 2.4 }); pl.label(w + 0.4, 4.2, 'pulso: ' + EM.fix(w * 1000, 0) + ' µs', { color: '--ink' });
        }
      },
      outs: [{ id: 'a', label: 'Ángulo del brazo', hl: true, fn: (lab) => EM.fix(CV.partOf(lab, 'SV1').angleNow === undefined ? 90 : CV.partOf(lab, 'SV1').angleNow, 0) + '°' },
        { id: 'c', label: 'Corriente que toma el servo', fn: (lab) => EM.fix((CV.partOf(lab, 'SV1').iload || 0) * 1000, 0) + ' mA' }]
    });
  });

  EM.defineSim('melodia', function (sim) {
    const sc = CV.uno({ parts: [{ id: 'BZ1', type: 'PIEZO', pins: ['e10', 'e12'] }], wires: [{ a: 'a10', b: '@D8' }, { a: 'a12', b: '@GND' }] });
    const code = 'int notas[] = {262, 262, 392, 392, 440, 440, 392,\n                349, 349, 330, 330, 294, 294, 262};\nint tiempo[] = {400, 400, 400, 400, 400, 400, 800,\n                400, 400, 400, 400, 400, 400, 800};\n\nvoid setup() {\n}\n\nvoid loop() {\n  for (int i = 0; i < 14; i++) {\n    tone(8, notas[i], tiempo[i] * 9 / 10);   // suena el 90 % del tiempo\n    delay(tiempo[i]);\n    noTone(8);\n  }\n  delay(1500);\n}\n';
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, code, sound: true, speeds: [[1, '1×'], [3, '3×']],
      outs: [{ id: 'f', label: 'Frecuencia que suena', hl: true, fn: (lab) => { const t = Object.values(lab.mcu.tones); return t.length ? t[0] + ' Hz' : 'silencio'; } }]
    });
  });
})();
