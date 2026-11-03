/* Capítulo 25 — La velocidad del sonido */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const CODE = 'const int TRIG = 9;\nconst int ECHO = 10;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(TRIG, OUTPUT);\n  pinMode(ECHO, INPUT);\n}\n\nvoid loop() {\n  digitalWrite(TRIG, LOW);\n  delayMicroseconds(2);\n  digitalWrite(TRIG, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(TRIG, LOW);\n  long duracion = pulseIn(ECHO, HIGH, 30000);    // microsegundos de ida y vuelta\n  Serial.println(duracion);\n  delay(300);\n}\n';

  EM.defineSim('sonido', function (sim) {
    const sc = CV.uno({ env: { temp: 20 }, parts: [{ id: 'US1', type: 'HCSR04', distance: 100, pins: ['j10', 'j11', 'j12', 'j13'] }],
      wires: [{ a: 'i10', b: '@5V' }, { a: 'i13', b: '@GND' }, { a: 'i11', b: '@D9' }, { a: 'i12', b: '@D10' }] });
    let data = [];
    /* regresión lineal t = b + s·d; la pendiente es 2/v (µs por cm → v = 2·10⁴ / s en m/s) */
    const fit = () => {
      if (data.length < 2) return null;
      const n = data.length, mx = data.reduce((a, r) => a + r[0], 0) / n, my = data.reduce((a, r) => a + r[1], 0) / n;
      let sxy = 0, sxx = 0; data.forEach((r) => { sxy += (r[0] - mx) * (r[1] - my); sxx += (r[0] - mx) ** 2; });
      if (!(sxx > 0)) return null;
      const s = sxy / sxx; return { s, v: 2e4 / s, b: my - s * mx };
    };
    EM.Lab.mount(sim, {
      aspect: 1.8, scene: sc, code: CODE, speeds: [[1, '1×'], [5, '5×']], hint: 'Cambie la distancia, espere una medida nueva y pulse «Anotar».',
      controls: [
        { type: 'slider', id: 'd', label: 'Distancia a la pared (medida con la regla)', min: 20, max: 350, step: 10, value: 100, unit: 'cm', apply: (lab, v) => { CV.partOf(lab, 'US1').distance = +v; } },
        { type: 'slider', id: 'T', label: 'Temperatura del aire', min: 0, max: 40, step: 1, value: 20, unit: '°C', apply: (lab, v) => { if (lab.scene.env.temp !== +v) data = []; lab.scene.env.temp = +v; } },
        { type: 'button', label: 'Anotar (distancia, tiempo)', run: (lab) => { const m = (lab.serialText || '').trim().split('\n').filter(Boolean); const t = +m[m.length - 1]; if (t > 0) data.push([CV.partOf(lab, 'US1').distance, t]); } },
        { type: 'button', label: 'Borrar los datos', run: () => { data = []; } }
      ],
      panel: {
        aspect: 3.0, minH: '200px', label: 'Tiempo de ida y vuelta contra distancia',
        draw(lab, cv) {
          const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 400, ymin: 0, ymax: 24000, xlabel: 'distancia d (cm)', ylabel: 'tiempo t (µs)', ml: 70, mr: 12, mt: 10, mb: 34 });
          pl.frame(); const f = fit();
          if (f) pl.xy([0, 400], [f.b, f.b + f.s * 400], { color: '--accent', width: 2.2 });
          data.forEach((r) => pl.dot(r[0], r[1], { color: '--c1', r: 4 }));
        }
      },
      outs: [
        { id: 'n', label: 'Medidas anotadas', fn: () => String(data.length) },
        { id: 'vel', label: 'Velocidad del sonido medida (v = 2/pendiente)', hl: true, fn: () => { const f = fit(); return f ? EM.fix(f.v, 1) + ' m/s' : 'anote al menos 2 distancias distintas'; } },
        { id: 'te', label: 'Valor teórico 331.3 + 0.606·T', fn: (lab) => EM.fix(331.3 + 0.606 * lab.scene.env.temp, 1) + ' m/s' }
      ]
    });
  });
})();
