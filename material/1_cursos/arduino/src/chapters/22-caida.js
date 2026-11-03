/* Capítulo 22 — La gravedad con fotopuertas */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const G = 9.777;   // aceleración de la gravedad en Popayán (m/s²)

  const CODE = (D) => `volatile unsigned long t1 = 0, t2 = 0;
volatile bool listo = false;
const float D = ${D.toFixed(2)};      // distancia entre las fotopuertas (m)

void inicio() {            // la bola se suelta: flanco descendente
  t1 = micros();
}

void fin() {               // la bola llega a la segunda compuerta
  t2 = micros();
  listo = true;
}

void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT);
  pinMode(3, INPUT);
  attachInterrupt(digitalPinToInterrupt(2), inicio, FALLING);
  attachInterrupt(digitalPinToInterrupt(3), fin, RISING);
}

void loop() {
  if (listo) {
    float dt = (t2 - t1) / 1000000.0;
    float g = 2 * D / (dt * dt);
    Serial.print("t = ");
    Serial.print(dt, 4);
    Serial.print(" s   g = ");
    Serial.print(g, 3);
    Serial.println(" m/s2");
    listo = false;
  }
}
`;
  EM.defineSim('caida', function (sim) {
    const sc = CV.uno({ parts: [{ id: 'G1', type: 'FOTOGATE', pins: ['j8', 'j9', 'j10'], blocked: true }, { id: 'G2', type: 'FOTOGATE', pins: ['j18', 'j19', 'j20'], blocked: false }],
      wires: [{ a: 'i8', b: '@5V' }, { a: 'i10', b: '@GND' }, { a: 'i9', b: '@D2' }, { a: 'i18', b: '@5V' }, { a: 'i20', b: '@GND' }, { a: 'i19', b: '@D3' }] });
    let D = 0.5;
    EM.Lab.mount(sim, {
      aspect: 1.6, scene: sc, code: CODE(0.5), speeds: [[1, '1×']], hint: 'Pulse «Soltar la bola» para iniciar la caída.',
      controls: [
        { type: 'seg', id: 'd', label: 'Distancia entre las fotopuertas', options: [[0.3, '30 cm'], [0.5, '50 cm'], [0.8, '80 cm']], value: 0.5, apply: (lab, v) => { D = +v; lab.phys = { mode: 'held', y: 0 }; if (lab.mcu) lab.setCode(CODE(D)); else lab.cfg.code = CODE(D); } },
        { type: 'button', label: 'Soltar la bola', run: (lab) => { lab._drop = true; } },
        { type: 'button', label: 'Volver a colocar la bola', run: (lab) => { lab.phys = { mode: 'held', y: 0 }; } }
      ],
      world: (lab) => {
        lab.phys = lab.phys || { mode: 'held', y: 0 }; let t0 = 0;
        const set = (id, v) => { const p = CV.partOf(lab, id); if (p.blocked !== v) { p.blocked = v; return true; } return false; };
        return { dt: 0.0002, update(us) {
          const ph = lab.phys; let ch = false;
          if (lab._drop && ph.mode === 'held') { ph.mode = 'falling'; t0 = us; lab._drop = false; }
          if (ph.mode === 'held') { ch = set('G1', true) | set('G2', false); ph.y = 0; }
          else if (ph.mode === 'falling') { const t = (us - t0) * 1e-6; ph.y = 0.5 * G * t * t; ph.t = t; ch = set('G1', ph.y < 0.000001) | set('G2', ph.y >= D && ph.y < D + 0.02); if (ph.y > D + 0.25) ph.mode = 'done'; }
          else ch = set('G1', false) | set('G2', false);
          return !!ch;
        } };
      },
      panel: {
        aspect: 3.6, minH: '200px', label: 'La caída',
        draw(lab, cv) {
          const ctx = cv.ctx, ph = lab.phys || { mode: 'held', y: 0 }, W = cv.w, H = cv.h, top = 24, bot = H - 20, sc = (bot - top) / 1.0, x0 = W * 0.2;
          const Y = (m) => top + m * sc;
          ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, top - 8); ctx.lineTo(x0, bot + 6); ctx.stroke();
          const gate = (m, lbl, on) => { ctx.fillStyle = on ? EM.col('--pos') : EM.col('--c3'); ctx.fillRect(x0 - 22, Y(m) - 3, 44, 6); EM.text(ctx, lbl, x0 + 32, Y(m) + 4, { size: 12, color: '--ink', align: 'left', weight: 700 }); };
          const d = lab.scene.parts.find((p) => p.id === 'G2');
          gate(0, 'Fotopuerta 1 (salida)', CV.partOf(lab, 'G1').blocked); gate(Dd(lab), 'Fotopuerta 2 (llegada)', d.blocked);
          const y = Math.min(ph.y, 1);
          ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(x0, Y(y), 8, 0, 7); ctx.fill();
          EM.text(ctx, 'd = ' + EM.fix(Dd(lab), 2) + ' m', W * 0.55, (Y(0) + Y(Dd(lab))) / 2, { size: 14, color: '--ink', align: 'left', weight: 700 });
          if (ph.t) EM.text(ctx, 't = ' + EM.fix(ph.t, 4) + ' s', W * 0.55, (Y(0) + Y(Dd(lab))) / 2 + 20, { size: 13, color: '--ink-2', align: 'left', mono: true });
        }
      },
      outs: [{ id: 't', label: 'Tiempo teórico √(2d/g)', fn: (lab) => EM.fix(Math.sqrt(2 * Dd(lab) / G), 4) + ' s con g = 9.777 m/s²' }]
    });
    function Dd() { return +sim.p.d; }
  });
})();
