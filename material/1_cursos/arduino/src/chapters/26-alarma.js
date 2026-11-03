/* Capítulo 26 — Alarma con sensor PIR y máquina de estados */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;

  const CODE = `const int PIR = 2;
const int BOTON = 3;
const int LED_ROJO = 13;
const int LED_VERDE = 12;
const int BUZ = 6;

const int DESARMADA = 0;     // los cuatro estados de la alarma
const int ARMANDO = 1;
const int ARMADA = 2;
const int DISPARADA = 3;

int estado = DESARMADA;
unsigned long desde = 0;     // instante en que se entró al estado actual
int anterior = HIGH;

void cambiar(int nuevo) {
  estado = nuevo;
  desde = millis();
  digitalWrite(BUZ, LOW);
  if (nuevo == DESARMADA) Serial.println("Estado: DESARMADA");
  if (nuevo == ARMANDO) Serial.println("Estado: ARMANDO (5 s para salir)");
  if (nuevo == ARMADA) Serial.println("Estado: ARMADA");
  if (nuevo == DISPARADA) Serial.println("Estado: DISPARADA");
}

void setup() {
  Serial.begin(9600);
  pinMode(PIR, INPUT);
  pinMode(BOTON, INPUT_PULLUP);
  pinMode(LED_ROJO, OUTPUT);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(BUZ, OUTPUT);
  cambiar(DESARMADA);
}

void loop() {
  unsigned long ahora = millis();
  int b = digitalRead(BOTON);
  bool pulsado = (anterior == HIGH && b == LOW);   // flanco de bajada
  anterior = b;

  if (estado == DESARMADA) {
    digitalWrite(LED_VERDE, HIGH);
    digitalWrite(LED_ROJO, LOW);
    if (pulsado) cambiar(ARMANDO);
  } else if (estado == ARMANDO) {
    digitalWrite(LED_VERDE, LOW);
    digitalWrite(LED_ROJO, (ahora / 250) % 2);     // parpadea
    if (ahora - desde > 5000) cambiar(ARMADA);
    if (pulsado) cambiar(DESARMADA);
  } else if (estado == ARMADA) {
    digitalWrite(LED_ROJO, HIGH);
    if (digitalRead(PIR) == HIGH) cambiar(DISPARADA);
    if (pulsado) cambiar(DESARMADA);
  } else {                                          // DISPARADA
    digitalWrite(LED_ROJO, (ahora / 100) % 2);
    digitalWrite(BUZ, (ahora / 150) % 2);           // sirena intermitente
    if (ahora - desde > 10000) cambiar(ARMADA);     // se rearma sola a los 10 s
    if (pulsado) cambiar(DESARMADA);
  }
}
`;
  const NAMES = ['DESARMADA', 'ARMANDO', 'ARMADA', 'DISPARADA'];
  const stateOf = (lab) => {
    const m = (lab.serialText || '').match(/Estado: ([A-ZÁ]+)/g);
    if (!m) return -1;
    return NAMES.indexOf(m[m.length - 1].replace('Estado: ', ''));
  };

  EM.defineSim('alarma', function (sim) {
    const L = CV.leds(['@D13', '@D12'], ['rojo', 'verde']);
    const sc = CV.uno({
      parts: L.parts.concat([
        { id: 'PIR1', type: 'PIR', pins: ['j16', 'j17', 'j18'] },
        { id: 'S1', type: 'BTN', pins: ['f23', 'f25', 'e23', 'e25'] },
        { id: 'BZ1', type: 'BUZ', pins: ['e28', 'e30'] }
      ]),
      wires: L.wires.concat([
        { id: 'wpv', a: 'i16', b: '@5V' }, { id: 'wpo', a: 'i17', b: '@D2' }, { id: 'wpg', a: 'i18', b: '@GND' },
        { id: 'wb1', a: 'j23', b: '@D3' }, { id: 'wb2', a: 'a23', b: '@GND' },
        { id: 'wz1', a: 'a28', b: '@D6' }, { id: 'wz2', a: 'a30', b: '@GND' }
      ])
    });
    EM.Lab.mount(sim, {
      aspect: 1.55, scene: sc, code: CODE, sound: true, speeds: [[1, '1×'], [3, '3×'], [10, '10×']],
      hint: 'Pulse el pulsador (clic sobre él) para armar; después «Pasa una persona».',
      controls: [
        { type: 'button', label: 'Pulsar el botón', run: (lab) => { lab._pressUntil = lab.t * 1e6 + 0.15e6; } },
        { type: 'button', label: 'Pasa una persona (3 s)', run: (lab) => { lab._motUntil = lab.t * 1e6 + 3e6; } }
      ],
      faults: [
        { id: 'pg', label: 'Sensor PIR sin cable de tierra', apply: (s) => { s.wires.find((w) => w.id === 'wpg').cut = true; }, revert: (s) => { s.wires.find((w) => w.id === 'wpg').cut = false; } },
        { id: 'bz', label: 'Zumbador conectado al revés', apply: (s) => { s.parts.find((p) => p.id === 'BZ1').pins = ['e30', 'e28']; }, revert: (s) => { s.parts.find((p) => p.id === 'BZ1').pins = ['e28', 'e30']; } }
      ],
      world: (lab) => {
        lab._motUntil = 0; lab._pressUntil = 0; lab._pw = false;
        return { dt: 0.02, update(us) {
          let ch = false;
          const pir = CV.partOf(lab, 'PIR1'), bt = CV.partOf(lab, 'S1');
          const mv = us < lab._motUntil;
          if (pir && pir.motion !== mv) { pir.motion = mv; ch = true; }
          const pr = us < lab._pressUntil;
          if (bt && pr !== lab._pw) { lab._pw = pr; bt.pressed = pr; ch = true; }
          return ch;
        } };
      },
      panel: {
        aspect: 5, minH: '120px', label: 'Máquina de estados',
        draw(lab, cv) {
          const ctx = cv.ctx, W = cv.w, H = cv.h, cur = stateOf(lab), bw = (W - 50) / 4, bh = 46, y = H * 0.32;
          const cols = ['--pos', '--c3', '--accent', '--neg'];
          NAMES.forEach((n, i) => {
            const x = 10 + i * (bw + 10);
            ctx.fillStyle = i === cur ? EM.col(cols[i]) : EM.col('--canvas');
            ctx.strokeStyle = EM.col(cols[i]); ctx.lineWidth = i === cur ? 3 : 1.5;
            ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 10); ctx.fill(); ctx.stroke();
            EM.text(ctx, n, x + bw / 2, y + bh / 2 + 4, { size: 12.5, color: i === cur ? '--canvas' : '--ink', align: 'center', weight: 700 });
            if (i < 3) { const ax = x + bw + 1; ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ax, y + bh / 2); ctx.lineTo(ax + 8, y + bh / 2); ctx.stroke(); }
          });
          const lab2 = ['botón', '5 s', 'movimiento', 'botón o 10 s'];
          lab2.forEach((t, i) => { if (i < 3) EM.text(ctx, t, 10 + (i + 1) * (bw + 10) - 5, y - 6, { size: 11.5, color: '--ink-2', align: 'center' }); });
          EM.text(ctx, 'Desde DISPARADA: botón → DESARMADA; a los 10 s sin pulsar → ARMADA. En cualquier estado activo, el botón vuelve a DESARMADA.', 10, y + bh + 26, { size: 11.5, color: '--ink-2', align: 'left' });
        }
      },
      outs: [{ id: 'st', label: 'Estado de la alarma', hl: true, fn: (lab) => { const s = stateOf(lab); return s < 0 ? '—' : NAMES[s]; } }]
    });
  });
})();
