/* Capítulo 14 — Comunicación serie */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;

  EM.defineSim('serial', function (sim) {
    const code = 'void setup() {\n  Serial.begin(9600);\n  Serial.println("Escriba un numero y pulse Enviar:");\n}\n\nvoid loop() {\n  if (Serial.available() > 0) {\n    String linea = Serial.readStringUntil(\'\\n\');\n    int n = linea.toInt();\n    Serial.print("Recibi ");\n    Serial.print(n);\n    Serial.print(" -> doble: ");\n    Serial.print(n * 2);\n    Serial.print(" -> HEX: ");\n    Serial.println(n, HEX);\n  }\n}\n';
    EM.Lab.mount(sim, { aspect: 2.4, scene: CV.uno({}), code, speeds: [[1, '1×']], hint: 'Escriba un número en el cuadro del monitor serie y pulse Enviar.' });
  });

  EM.defineSim('graficador', function (sim) {
    const sc = CV.esp({ parts: [{ id: 'RV1', type: 'POT', value: 10000, pos: 0.5, pins: ['e20', 'e21', 'e22'] }], wires: [{ a: 'a20', b: '@3V3' }, { a: 'a22', b: '@GND' }, { a: 'a21', b: '@G34' }] });
    const code = 'float filtro = 0;\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  int v = analogRead(34);\n  filtro = 0.9 * filtro + 0.1 * v;   // promedio móvil exponencial\n  Serial.print(v);\n  Serial.print(" ");\n  Serial.println(filtro);\n  delay(50);\n}\n';
    EM.Lab.mount(sim, {
      aspect: 2.0, scene: sc, code, speeds: [[1, '1×'], [3, '3×']],
      controls: [{ type: 'slider', id: 'pos', label: 'Potenciómetro', min: 0, max: 1, step: 0.01, value: 0.5, fmt: (v) => Math.round(v * 100) + ' %', apply: (lab, v) => { CV.partOf(lab, 'RV1').pos = v; } }],
      panel: {
        aspect: 3.6, minH: '190px', label: 'Graficador serie',
        draw(lab, cv) {
          const rows = lab.serialText.split('\n').map((l) => l.trim().split(/\s+/).map(Number)).filter((r) => r.length >= 2 && r.every((x) => isFinite(x))).slice(-120);
          const lo = rows.length ? Math.min(...rows.map((r) => Math.min(r[0], r[1]))) : 0, hi = rows.length ? Math.max(...rows.map((r) => Math.max(r[0], r[1]))) : 4095;
          const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 120, ymin: Math.floor(lo - 20), ymax: Math.ceil(hi + 20), xlabel: 'últimas lecturas', ylabel: 'valor', ml: 56, mr: 12, mt: 10, mb: 34 });
          pl.frame();
          if (rows.length > 1) { const xs = rows.map((_, i) => i); pl.xy(xs, rows.map((r) => r[0]), { color: '--c1', width: 1.6 }); pl.xy(xs, rows.map((r) => r[1]), { color: '--c4', width: 2.6 }); }
          pl.legend([{ label: 'cruda', color: '--c1' }, { label: 'filtrada', color: '--c4' }], 'tr');
        }
      }
    });
  });
})();
