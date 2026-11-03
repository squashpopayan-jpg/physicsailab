/* Capítulo 23 — El péndulo con fotopuerta */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const G = 9.777;   // aceleración de la gravedad en Popayán (m/s²)
  const HALF = 0.006; // la lenteja bloquea la fotopuerta a menos de 6 mm del punto más bajo

  const CODE = (L) => `volatile unsigned long ultimo = 0;
volatile unsigned long medio = 0;     // tiempo entre dos pasos consecutivos
volatile bool nuevo = false;
const float L = ${L.toFixed(2)};            // longitud del péndulo (m)

void paso() {                          // la lenteja cruza la fotopuerta
  unsigned long t = micros();
  if (ultimo != 0) {
    medio = t - ultimo;
    nuevo = true;
  }
  ultimo = t;
}

void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT);
  attachInterrupt(digitalPinToInterrupt(2), paso, RISING);
}

void loop() {
  if (nuevo) {
    float T = 2.0 * medio / 1000000.0;      // dos pasos = medio periodo
    float g = 4.0 * PI * PI * L / (T * T);   // T = 2*pi*raiz(L/g)
    Serial.print("T = ");
    Serial.print(T, 4);
    Serial.print(" s   g = ");
    Serial.println(g, 3);
    nuevo = false;
  }
}
`;
  /* periodo exacto con la media aritmético-geométrica: T = 2π√(L/g) / AGM(1, cos(θ0/2)) */
  const periodo = (L, deg) => {
    let a = 1, b = Math.cos(deg * Math.PI / 360);
    for (let i = 0; i < 25; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; }
    return 2 * Math.PI * Math.sqrt(L / G) / a;
  };

  EM.defineSim('pendulo', function (sim) {
    const sc = CV.uno({ parts: [{ id: 'G1', type: 'FOTOGATE', pins: ['j10', 'j11', 'j12'], blocked: false }],
      wires: [{ a: 'i10', b: '@5V' }, { a: 'i12', b: '@GND' }, { a: 'i11', b: '@D2' }] });
    let L = 0.5, amp = 20;
    const held = () => ({ mode: 'held', th: amp * Math.PI / 180, w: 0 });
    EM.Lab.mount(sim, {
      aspect: 1.6, scene: sc, code: CODE(0.5), speeds: [[1, '1×'], [3, '3×']], hint: 'Elija la amplitud y pulse «Soltar el péndulo».',
      controls: [
        { type: 'seg', id: 'L', label: 'Longitud del hilo', options: [[0.3, '30 cm'], [0.5, '50 cm'], [1, '1 m']], value: 0.5, apply: (lab, v) => { L = +v; lab.phys = held(); if (lab.mcu) lab.setCode(CODE(L)); else lab.cfg.code = CODE(L); } },
        { type: 'slider', id: 'a', label: 'Amplitud inicial', min: 3, max: 80, step: 1, value: 20, unit: '°', apply: (lab, v) => { amp = +v; lab.phys = held(); if (lab.mcu) lab.setCode(CODE(L)); } },
        { type: 'button', label: 'Soltar el péndulo', run: (lab) => { lab._drop = true; } },
        { type: 'button', label: 'Volver a levantarlo', run: (lab) => { lab.phys = held(); if (lab.mcu) lab.setCode(CODE(L)); } }
      ],
      world: (lab) => {
        lab.phys = held(); let last = null;
        const f = (th) => -(G / L) * Math.sin(th);
        return { dt: 0.0002, update(us) {
          const s = lab.phys; if (!s) return false;
          if (last === null) last = us;
          let h = (us - last) * 1e-6; last = us;
          if (lab._drop && s.mode === 'held') { s.mode = 'swing'; lab._drop = false; }
          if (s.mode === 'swing' && h > 0) {
            h = Math.min(h, 0.002);
            const k1a = s.w, k1b = f(s.th), k2a = s.w + h / 2 * k1b, k2b = f(s.th + h / 2 * k1a), k3a = s.w + h / 2 * k2b, k3b = f(s.th + h / 2 * k2a), k4a = s.w + h * k3b, k4b = f(s.th + h * k3a);
            s.th += h / 6 * (k1a + 2 * k2a + 2 * k3a + k4a); s.w += h / 6 * (k1b + 2 * k2b + 2 * k3b + k4b);
          }
          const p = CV.partOf(lab, 'G1'), bl = Math.abs(L * Math.sin(s.th)) < HALF;
          if (p.blocked !== bl) { p.blocked = bl; return true; }
          return false;
        } };
      },
      scope: { channels: [{ fn: (lab) => (lab.phys ? lab.phys.th * 180 / Math.PI : 0), label: 'Ángulo del péndulo', color: '--c1' }], span: 6, ymin: -90, ymax: 90, unit: '°', aspect: 5 },
      panel: {
        aspect: 3.2, minH: '190px', label: 'El péndulo',
        draw(lab, cv) {
          const ctx = cv.ctx, W = cv.w, H = cv.h, th = lab.phys ? lab.phys.th : 0, px = W * 0.5, py = 14, len = H - 56;
          const bx = px + len * Math.sin(th), by = py + len * Math.cos(th);
          ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 36, py - 3); ctx.lineTo(px + 36, py - 3); ctx.stroke();
          ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + len + 10); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
          ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(bx, by, 10, 0, 7); ctx.fill();
          const on = CV.partOf(lab, 'G1').blocked;
          ctx.fillStyle = on ? EM.col('--pos') : EM.col('--c3'); ctx.fillRect(px - 14, py + len + 12, 28, 6);
          EM.text(ctx, 'fotopuerta', px + 22, py + len + 18, { size: 12, color: '--ink-2', align: 'left' });
          EM.text(ctx, 'L = ' + EM.fix(L, 2) + ' m', 12, 22, { size: 13, color: '--ink', align: 'left', weight: 700 });
          EM.text(ctx, 'θ = ' + EM.fix(th * 180 / Math.PI, 1) + '°', 12, 40, { size: 13, color: '--ink-2', align: 'left', mono: true });
        }
      },
      outs: [
        { id: 't0', label: 'Periodo con amplitud pequeña 2π√(L/g)', fn: () => EM.fix(2 * Math.PI * Math.sqrt(L / G), 4) + ' s' },
        { id: 'ta', label: 'Periodo teórico exacto con esta amplitud', hl: true, fn: () => EM.fix(periodo(L, amp), 4) + ' s' }
      ]
    });
  });
})();
