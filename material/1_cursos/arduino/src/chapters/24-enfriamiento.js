/* Capítulo 24 — Ley de enfriamiento de Newton */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const TA = 20, T0 = 80;
  const CODE = 'void setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  float v = analogRead(A0) * 5.0 / 1024.0;\n  float celsius = v * 100.0;           // LM35: 10 mV por grado\n  Serial.print(millis() / 1000);\n  Serial.print(" ");\n  Serial.println(celsius, 1);\n  delay(30000);                        // una medida cada 30 s\n}\n';

  EM.defineSim('enfria', function (sim) {
    const sc = CV.uno({ env: { temp: T0 }, parts: [{ id: 'T1', type: 'LM35', pins: ['j10', 'j11', 'j12'] }],
      wires: [{ a: 'i10', b: '@5V' }, { a: 'i12', b: '@GND' }, { a: 'i11', b: '@A0' }] });
    let k = 0.001;
    /* ajuste lineal de ln(T − Ta) contra t con los datos que imprimió el Arduino */
    const fit = (lab) => {
      const rows = (lab.serialText || '').trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number)).filter((r) => r.length === 2 && r.every(isFinite));
      const use = rows.filter((r) => r[1] - TA > 5);
      if (use.length < 3) return { rows, f: null };
      const n = use.length, xs = use.map((r) => r[0]), ys = use.map((r) => Math.log(r[1] - TA));
      const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
      let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
      const sl = sxy / sxx; return { rows, f: { k: -sl, b: my - sl * mx } };
    };
    EM.Lab.mount(sim, {
      aspect: 1.9, scene: sc, code: CODE, speeds: [[60, '60×'], [300, '300×'], [1200, '1200×']], speed: 300,
      hint: 'El agua parte a 80 °C. Con 300× la hora completa pasa en 12 s.',
      controls: [{ type: 'seg', id: 'k', label: 'Recipiente con el agua caliente', options: [[0.001, 'Vaso de vidrio'], [0.0006, 'Vaso con tapa'], [0.0001, 'Termo']], value: 0.001,
        apply: (lab, v) => { if (+v !== k) { k = +v; if (lab.mcu) lab.reset(); } else k = +v; } }],
      world: (lab) => ({ dt: 1, update(us) { lab.scene.env.temp = TA + (T0 - TA) * Math.exp(-k * us / 1e6); return true; } }),
      scope: { channels: [{ fn: (lab) => lab.scene.env.temp, label: 'Temperatura real del agua', color: '--c2' }], span: 3600, ymin: 15, ymax: 85, unit: '°C', aspect: 5 },
      panel: {
        aspect: 3.0, minH: '200px', label: 'Datos medidos y ajuste exponencial',
        draw(lab, cv) {
          const { rows, f } = fit(lab);
          const tmax = Math.max(3600, Math.ceil(Math.max(0, ...rows.map((r) => r[0])) / 600) * 600);
          const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax, ymin: 15, ymax: 85, xlabel: 'tiempo (s)', ylabel: '°C', ml: 48, mr: 12, mt: 10, mb: 34 });
          pl.frame(); pl.hline(TA, { label: 'ambiente 20 °C', labelRight: true });
          if (f) { const xs = [], ys = []; for (let t = 0; t <= tmax; t += 60) { xs.push(t); ys.push(TA + Math.exp(f.b - f.k * t)); } pl.xy(xs, ys, { color: '--accent', width: 2.2 }); }
          rows.forEach((r) => pl.dot(r[0], r[1], { color: '--c1', r: 3 }));
        }
      },
      outs: [
        { id: 'kt', label: 'Constante k verdadera · vida media ln 2 / k', fn: () => EM.fix(k, 4) + ' s⁻¹ · ' + EM.fix(Math.LN2 / k / 60, 1) + ' min' },
        { id: 'kf', label: 'k estimada con los datos del Arduino', hl: true, fn: (lab) => { const f = fit(lab).f; return f ? EM.fix(f.k, 5) + ' s⁻¹ · ' + EM.fix(Math.LN2 / f.k / 60, 1) + ' min' : 'faltan datos: deje correr la simulación'; } },
        { id: 'T', label: 'Temperatura real ahora', fn: (lab) => EM.fix(lab.scene.env.temp, 1) + ' °C' }
      ]
    });
  });
})();
