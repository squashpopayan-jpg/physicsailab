/* ===================================================================
   32-parts.js — Catálogo de componentes (EM.parts). Sin DOM.
   Cada tipo define: etiqueta, pines, propiedades por defecto, cómo se traduce
   a elementos del simulador (expand) y cómo se desgasta o se daña (stress).
   Los daños siguen una ley sencilla: dmg' = k·max(0, estrés − 1), con estrés = carga / límite.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const sp = EM.spice;
  const PT = (EM.parts = {});
  const KDMG = 0.5; /* 1/s por unidad de sobrecarga */
  PT.KDMG = KDMG;

  const def = (type, o) => { PT[type] = Object.assign({ type, pins: 2, props: {}, stress: null }, o); };
  const val = (p, k, d) => (p[k] !== undefined ? p[k] : (PT[p.type].props[k] !== undefined ? PT[p.type].props[k] : d));
  PT.val = val;

  /* ---------- Pasivos ---------- */
  def('R', {
    label: 'Resistencia', short: 'R', pinNames: ['1', '2'], props: { value: 330, tol: 5, watt: 0.25 },
    expand(p, c) {
      const r = val(p, 'value') * (p.drift !== undefined ? p.drift : 1);
      c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r, role: 'main' });
    },
    stress(p, c) { const e = c.el(p, 'main'); return Math.abs(e.p) / val(p, 'watt'); },
    deadKind: 'open'
  });
  def('POT', {
    label: 'Potenciómetro', short: 'P', pins: 3, pinNames: ['A', 'W', 'B'], props: { value: 10000, pos: 0.5, watt: 0.1 },
    expand(p, c) {
      const R = val(p, 'value'), x = Math.min(0.9999, Math.max(0.0001, val(p, 'pos')));
      c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: Math.max(R * x, 0.5), role: 'up' });
      c.add({ type: 'R', a: c.node(p, 1), b: c.node(p, 2), r: Math.max(R * (1 - x), 0.5), role: 'down' });
    },
    stress(p, c) { return (Math.abs(c.el(p, 'up').p) + Math.abs(c.el(p, 'down').p)) / val(p, 'watt'); },
    deadKind: 'open'
  });
  def('LDR', {
    label: 'Fotorresistencia (LDR)', short: 'LDR', pinNames: ['1', '2'], props: { lux: 300, r10: 20000, gamma: 0.7, watt: 0.1 },
    expand(p, c) {
      const lux = p.lux !== undefined ? p.lux : (c.env.lux !== undefined ? c.env.lux : val(p, 'lux'));
      c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: sp.ldr(lux, val(p, 'r10'), val(p, 'gamma')), role: 'main' });
    },
    stress(p, c) { return Math.abs(c.el(p, 'main').p) / val(p, 'watt'); },
    deadKind: 'open'
  });
  def('NTC', {
    label: 'Termistor NTC', short: 'NTC', pinNames: ['1', '2'], props: { r25: 10000, beta: 3950, temp: 25, watt: 0.1 },
    expand(p, c) {
      const T = p.temp !== undefined ? p.temp : (c.env.temp !== undefined ? c.env.temp : val(p, 'temp'));
      c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: sp.ntc(T, val(p, 'r25'), val(p, 'beta')), role: 'main' });
    },
    stress(p, c) { return Math.abs(c.el(p, 'main').p) / val(p, 'watt'); },
    deadKind: 'open'
  });
  def('C', {
    label: 'Condensador cerámico', short: 'C', pinNames: ['1', '2'], props: { value: 100e-9, vmax: 50, q0: 0 },
    expand(p, c) { c.add({ type: 'C', a: c.node(p, 0), b: c.node(p, 1), c: val(p, 'value'), role: 'main', vprev: p.v0 || 0 }); },
    stress(p, c) { return Math.abs(c.el(p, 'main').vab) / val(p, 'vmax'); },
    deadKind: 'short'
  });
  def('ECAP', {
    label: 'Condensador electrolítico', short: 'C', pinNames: ['+', '−'], props: { value: 100e-6, vmax: 16, v0: 0 },
    expand(p, c) {
      c.add({ type: 'C', a: c.node(p, 0), b: c.node(p, 1), c: val(p, 'value'), role: 'main', vprev: p.v0 || 0 });
      c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: 2e6 / (val(p, 'value') * 1e6 + 1) * 10, role: 'leak' }); /* fuga de unos µA */
    },
    stress(p, c) { const v = c.el(p, 'main').vab; return v < -1 ? 1 + Math.abs(v) / 1.5 : Math.max(0, v) / val(p, 'vmax'); },
    deadKind: 'vent'
  });
  def('L', {
    label: 'Bobina (inductor)', short: 'L', pinNames: ['1', '2'], props: { value: 10e-3, rdc: 5, imax: 0.5 },
    expand(p, c) { c.add({ type: 'L', a: c.node(p, 0), b: c.node(p, 'm'), l: val(p, 'value'), rl: 1e-3, role: 'main' }); c.add({ type: 'R', a: c.node(p, 'm'), b: c.node(p, 1), r: val(p, 'rdc'), role: 'rdc' }); },
    stress(p, c) { return Math.abs(c.el(p, 'rdc').i) / val(p, 'imax'); },
    deadKind: 'open'
  });

  /* ---------- Diodos y LED ---------- */
  def('LED', {
    label: 'LED', short: 'LED', pinNames: ['ánodo (+)', 'cátodo (−)'], props: { color: 'rojo' },
    expand(p, c) {
      const m = sp.LEDS[val(p, 'color')] || sp.LEDS.rojo;
      c.add({ type: 'D', a: c.node(p, 0), b: c.node(p, 'm'), Is: m.Is, n: m.n, role: 'diode' });
      c.add({ type: 'R', a: c.node(p, 'm'), b: c.node(p, 1), r: m.rs, role: 'rs' });
    },
    stress(p, c) {
      const m = sp.LEDS[val(p, 'color')] || sp.LEDS.rojo, e = c.el(p, 'diode');
      const rev = -e.vab > 5 ? 1 + (-e.vab - 5) : 0;
      return Math.max(e.i / m.imax, rev);
    },
    deadKind: 'open',
    current(p, c) { return c.el(p, 'diode').i; }
  });
  def('D', {
    label: 'Diodo rectificador', short: 'D', pinNames: ['ánodo', 'cátodo'], props: { model: '1N4007' },
    expand(p, c) {
      const m = sp.DIODES[val(p, 'model')] || sp.DIODES['1N4007'];
      c.add({ type: 'D', a: c.node(p, 0), b: c.node(p, 'm'), Is: m.Is, n: m.n, role: 'diode' });
      c.add({ type: 'R', a: c.node(p, 'm'), b: c.node(p, 1), r: m.rs, role: 'rs' });
    },
    stress(p, c) { const m = sp.DIODES[val(p, 'model')] || sp.DIODES['1N4007'], e = c.el(p, 'diode'); return Math.max(e.i / m.imax, -e.vab / m.vr); },
    deadKind: 'short'
  });
  def('ZENER', {
    label: 'Diodo Zener', short: 'Z', pinNames: ['ánodo', 'cátodo'], props: { vz: 5.1, watt: 0.5 },
    expand(p, c) { const z = sp.zener('z', c.node(p, 0), c.node(p, 1), val(p, 'vz')); z.role = 'diode'; c.add(z); },
    stress(p, c) { return Math.abs(c.el(p, 'diode').p) / val(p, 'watt'); },
    deadKind: 'short'
  });

  /* ---------- Interruptores ---------- */
  def('BTN', {
    label: 'Pulsador', short: 'SW', pins: 4, pinNames: ['1', '2', '3', '4'], props: { rcontact: 0.1 },
    /* los pines 1–2 están unidos internamente, igual que 3–4; al pulsar se unen los dos lados */
    expand(p, c) {
      c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: 0.01, role: 'sideA' });
      c.add({ type: 'R', a: c.node(p, 2), b: c.node(p, 3), r: 0.01, role: 'sideB' });
      c.add({ type: 'SW', a: c.node(p, 0), b: c.node(p, 2), closed: !!p.pressed, ron: val(p, 'rcontact'), role: 'contact' });
    },
    stress(p, c) { return Math.abs(c.el(p, 'contact').i) / 0.05; }, /* 50 mA nominales */
    deadKind: 'open'
  });
  def('SW', {
    label: 'Interruptor', short: 'SW', pinNames: ['1', '2'], props: { closed: false },
    expand(p, c) { c.add({ type: 'SW', a: c.node(p, 0), b: c.node(p, 1), closed: !!p.closed, ron: 0.02, role: 'contact' }); },
    stress(p, c) { return Math.abs(c.el(p, 'contact').i) / 1; },
    deadKind: 'open'
  });
  def('FUSE', {
    label: 'Fusible', short: 'F', pinNames: ['1', '2'], props: { rating: 0.2 },
    expand(p, c) { c.add({ type: 'F', a: c.node(p, 0), b: c.node(p, 1), rating: val(p, 'rating'), r: 0.1, blown: !!p.blown, role: 'main' }); },
    stress: null /* tiene su propia lógica en Bench.damage */
  });
  def('JUMPER', {
    label: 'Puente (cable corto)', short: 'J', pinNames: ['1', '2'],
    expand(p, c) { c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: 0.02, role: 'main' }); },
    deadKind: 'open'
  });

  /* ---------- Semiconductores ---------- */
  def('BJT', {
    label: 'Transistor bipolar', short: 'Q', pins: 3, pinNames: ['C', 'B', 'E'], props: { model: 'BC547' },
    expand(p, c) { const m = sp.BJTS[val(p, 'model')] || sp.BJTS.BC547; c.add({ type: 'Q', a: c.node(p, 0), b: c.node(p, 1), c: c.node(p, 2), Is: m.Is, bf: m.bf, betaR: m.br, pol: m.pol, role: 'main' }); },
    stress(p, c) { const m = sp.BJTS[val(p, 'model')] || sp.BJTS.BC547, e = c.el(p, 'main'); return Math.max(Math.abs(e.ic) / m.ic, e.p / m.pmax); },
    deadKind: 'short'
  });
  def('NMOS', {
    label: 'MOSFET de canal N', short: 'Q', pins: 3, pinNames: ['G', 'D', 'S'], props: { model: 'IRLZ44N' },
    expand(p, c) { const m = sp.MOSFETS[val(p, 'model')] || sp.MOSFETS.IRLZ44N; c.add({ type: 'M', a: c.node(p, 1), b: c.node(p, 0), c: c.node(p, 2), vth: m.vth, k: m.k, lam: m.lam, role: 'main' }); },
    stress(p, c) { const m = sp.MOSFETS[val(p, 'model')] || sp.MOSFETS.IRLZ44N, e = c.el(p, 'main'); return Math.max(Math.abs(e.i) / m.id, (e.p || 0) / 1.2); },
    deadKind: 'short'
  });

  /* ---------- Cargas ---------- */
  def('BUZ', {
    label: 'Zumbador activo', short: 'BZ', pinNames: ['+', '−'], props: { vnom: 5, rcoil: 100 },
    expand(p, c) { c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: val(p, 'rcoil'), role: 'main' }); },
    stress(p, c) { return Math.abs(c.el(p, 'main').vab) / 12; },
    deadKind: 'open'
  });
  def('PIEZO', {
    label: 'Zumbador pasivo (piezo)', short: 'BZ', pinNames: ['+', '−'], props: {},
    expand(p, c) { c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: 1e6, role: 'main' }); },
    stress: null
  });
  def('SPEAKER', {
    label: 'Altavoz 8 Ω', short: 'SP', pinNames: ['+', '−'], props: { ohm: 8 },
    expand(p, c) { c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: val(p, 'ohm'), role: 'main' }); },
    stress(p, c) { return Math.abs(c.el(p, 'main').p) / 0.5; },
    deadKind: 'open'
  });
  def('LAMP', {
    label: 'Bombillo pequeño', short: 'H', pinNames: ['1', '2'], props: { vnom: 6, inom: 0.15 },
    expand(p, c) {
      /* el filamento calienta: su resistencia crece con la temperatura (R_frío ≈ R_nom/10) */
      const Rn = val(p, 'vnom') / val(p, 'inom'), th = p.heat || 0;
      c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: Rn * (0.1 + 0.9 * th), role: 'main' });
    },
    stress(p, c) { return Math.abs(c.el(p, 'main').vab) / (val(p, 'vnom') * 1.5); },
    deadKind: 'open'
  });
  def('MOTOR', {
    label: 'Motor DC', short: 'M', pinNames: ['+', '−'], props: { ra: 8, ke: 0.0045, kt: 0.0045, b: 2e-7, jm: 1.5e-7, vnom: 6, istall: 0.5 },
    /* v = Ra i + Ke ω ; τ = Kt i ; J dω/dt = τ − b ω − τ_carga */
    expand(p, c) {
      const w = p.omega || 0;
      c.add({ type: 'V', a: c.node(p, 0), b: c.node(p, 'm'), v: val(p, 'ke') * w, rs: val(p, 'ra'), role: 'main' });
      c.add({ type: 'R', a: c.node(p, 'm'), b: c.node(p, 1), r: 1e-3, role: 'wire' });
    },
    stress(p, c) { return Math.abs(c.el(p, 'main').i) / (val(p, 'vnom') / val(p, 'ra') * 1.0 + 0.1) / 1.5; },
    deadKind: 'open',
    step(p, c, dt) { /* mecánica del rotor */
      const e = c.el(p, 'main'), i = e.i; /* corriente que entra por + hacia el rotor (positiva al funcionar como motor) */
      const ke = val(p, 'ke'), kt = val(p, 'kt'), b = val(p, 'b'), J = val(p, 'jm');
      const load = p.load || 0;
      let w = p.omega || 0;
      const n = Math.max(1, Math.ceil(dt / 2e-3));
      for (let k = 0; k < n; k++) { const h = dt / n; w += h * (kt * i - b * w - load * Math.sign(w || 1) * (w !== 0 ? 1 : 0)) / J; if (w * (kt * i) < 0 && Math.abs(kt * i) < load) w = 0; }
      p.omega = w;
    }
  });
  def('RELAY', {
    label: 'Relé (bobina)', short: 'K', pins: 5, pinNames: ['bobina +', 'bobina −', 'COM', 'NA', 'NC'], props: { rcoil: 70, von: 3.5 },
    expand(p, c) {
      c.add({ type: 'R', a: c.node(p, 0), b: c.node(p, 1), r: val(p, 'rcoil'), role: 'coil' });
      const on = !!p.on;
      c.add({ type: 'SW', a: c.node(p, 2), b: c.node(p, 3), closed: on, ron: 0.05, role: 'na' });
      c.add({ type: 'SW', a: c.node(p, 2), b: c.node(p, 4), closed: !on, ron: 0.05, role: 'nc' });
    },
    stress(p, c) { return Math.abs(c.el(p, 'coil').vab) / 14; },
    deadKind: 'open',
    step(p, c) { const v = Math.abs(c.el(p, 'coil').vab); if (v > val(p, 'von')) p.on = true; else if (v < 0.4 * val(p, 'von')) p.on = false; }
  });

  /* ---------- Fuentes de energía ---------- */
  def('BAT', {
    label: 'Batería / pila', short: 'BAT', pinNames: ['+', '−'], power: true, deadKind: 'open', props: { v: 9, rint: 1.7, cap: 0.5, name: '9 V' },
    expand(p, c) { c.add({ type: 'V', a: c.node(p, 0), b: c.node(p, 1), v: (val(p, 'v') * (p.charge === undefined ? 1 : Math.max(0.6, 0.78 + 0.22 * p.charge))), rs: val(p, 'rint'), role: 'src' }); },
    stress: null
  });
  def('USB', {
    label: 'Fuente USB 5 V', short: 'USB', pinNames: ['+', '−'], power: true, props: { v: 5.0, rint: 0.15, ilimit: 0.5 },
    expand(p, c) { c.add({ type: 'V', a: c.node(p, 0), b: c.node(p, 1), v: p.tripped ? 0 : val(p, 'v'), rs: p.tripped ? 1e6 : val(p, 'rint'), role: 'src', ilim: val(p, 'ilimit') }); },
    stress: null
  });
  def('LAB', {
    label: 'Fuente de laboratorio', short: 'FA', pinNames: ['+', '−'], power: true, props: { v: 5, rint: 0.05, ilimit: 1.0 },
    expand(p, c) { c.add({ type: 'V', a: c.node(p, 0), b: c.node(p, 1), v: val(p, 'v'), rs: val(p, 'rint'), role: 'src', ilim: val(p, 'ilimit') }); },
    stress: null
  });
  def('SIGGEN', {
    label: 'Generador de funciones', short: 'GF', pinNames: ['salida', 'tierra'], power: true, props: { amp: 2.5, freq: 100, kind: 'square', offset: 2.5, duty: 0.5, rint: 50 },
    expand(p, c) { c.add({ type: 'V', a: c.node(p, 0), b: c.node(p, 1), v: 0, rs: val(p, 'rint'), wave: { kind: val(p, 'kind'), amp: val(p, 'amp'), offset: val(p, 'offset') - (val(p, 'kind') === 'square' ? 0 : 0), freq: val(p, 'freq'), duty: val(p, 'duty') }, role: 'src' }); },
    stress: null
  });

  /* ---------- Módulos (alimentación y señal las gestiona EM.mcu) ---------- */
  const mod = (type, label, pinNames, props) => def(type, {
    label, short: label, pins: pinNames.length, pinNames, props: Object.assign({ icc: 0.005, vmin: 3.0, vmax: 5.5 }, props || {}), module: true,
    expand(p, c) {
      /* consumo de reposo entre VCC y GND (resistencia equivalente a la tensión nominal) */
      const iv = pinNames.indexOf('VCC'), ig = pinNames.indexOf('GND');
      if (iv >= 0 && ig >= 0) {
        c.add({ type: 'R', a: c.node(p, iv), b: c.node(p, ig), r: 5 / Math.max(val(p, 'icc'), 1e-6), role: 'vcc' });
      }
    },
    stress(p, c) {
      const e = c.el(p, 'vcc'); if (!e) return 0;
      return Math.abs(e.vab) / val(p, 'vmax');
    },
    deadKind: 'open'
  });
  mod('HCSR04', 'Sensor ultrasónico HC-SR04', ['VCC', 'TRIG', 'ECHO', 'GND'], { icc: 0.015, vmin: 4.5, vmax: 5.5 });
  mod('DHT11', 'Sensor DHT11', ['VCC', 'DATA', 'GND'], { icc: 0.0003, vmin: 3.0, vmax: 5.5 });
  mod('DHT22', 'Sensor DHT22', ['VCC', 'DATA', 'GND'], { icc: 0.0015, vmin: 3.3, vmax: 6 });
  mod('PIR', 'Sensor PIR HC-SR501', ['VCC', 'OUT', 'GND'], { icc: 0.05, vmin: 4.5, vmax: 20 });
  mod('SERVO', 'Servo SG90', ['GND', 'VCC', 'SIG'], { icc: 0.01, vmin: 4.0, vmax: 6.5 });
  mod('LCDI2C', 'Pantalla LCD 16×2 con I²C', ['GND', 'VCC', 'SDA', 'SCL'], { icc: 0.025, vmin: 4.5, vmax: 5.5, addr: 0x27 });
  mod('OLED', 'Pantalla OLED 0,96" I²C', ['GND', 'VCC', 'SCL', 'SDA'], { icc: 0.012, vmin: 3.0, vmax: 5.5, addr: 0x3C });
  mod('MPU6050', 'Acelerómetro-giroscopio MPU-6050', ['VCC', 'GND', 'SCL', 'SDA'], { icc: 0.004, vmin: 3.0, vmax: 5.5, addr: 0x68 });
  mod('LM35', 'Sensor de temperatura LM35', ['VCC', 'OUT', 'GND'], { icc: 0.00006, vmin: 4.0, vmax: 30 });
  mod('HX711', 'Amplificador HX711 y celda de carga', ['VCC', 'DT', 'SCK', 'GND'], { icc: 0.0015, vmin: 2.6, vmax: 5.5 });
  mod('IRSENS', 'Sensor infrarrojo de obstáculos', ['VCC', 'OUT', 'GND'], { icc: 0.02, vmin: 3.3, vmax: 5.5 });
  mod('SOIL', 'Sensor de humedad del suelo', ['VCC', 'AO', 'GND'], { icc: 0.01, vmin: 3.3, vmax: 5.5 });
  mod('RC522', 'Lector RFID RC522', ['3V3', 'RST', 'GND', 'IRQ', 'MISO', 'MOSI', 'SCK', 'SDA'], { icc: 0.026, vmin: 2.5, vmax: 3.6 });
  mod('HC05', 'Bluetooth HC-05', ['STATE', 'RXD', 'TXD', 'GND', 'VCC', 'EN'], { icc: 0.03, vmin: 3.6, vmax: 6 });
  mod('RELAYMOD', 'Módulo de relé de 1 canal', ['VCC', 'GND', 'IN'], { icc: 0.07, vmin: 4.5, vmax: 5.5 });
  mod('L298N', 'Puente H L298N', ['IN1', 'IN2', 'IN3', 'IN4', 'ENA', 'ENB', 'GND'], { icc: 0.04, vmin: 4.5, vmax: 5.5 });
  mod('FOTOGATE', 'Fotointerruptor (ranura)', ['VCC', 'OUT', 'GND'], { icc: 0.02, vmin: 3.3, vmax: 5.5 });
  mod('NRF24', 'Radio nRF24L01', ['GND', 'VCC', 'CE', 'CSN', 'SCK', 'MOSI', 'MISO', 'IRQ'], { icc: 0.012, vmin: 1.9, vmax: 3.6 });
  mod('LORA', 'Radio LoRa SX1278', ['3V3', 'GND', 'SCK', 'MISO', 'MOSI', 'NSS', 'RST', 'DIO0'], { icc: 0.012, vmin: 1.8, vmax: 3.7 });
  mod('SEG7', 'Display de 7 segmentos (cátodo común)', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp', 'COM'], { icc: 0 });
  PT.SEG7.expand = function (p, c) {
    const m = sp.LEDS.rojo;
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'].forEach((s, i) => {
      c.add({ type: 'D', a: c.node(p, i), b: c.node(p, 's' + i), Is: m.Is, n: m.n, role: 'seg' + i });
      c.add({ type: 'R', a: c.node(p, 's' + i), b: c.node(p, 8), r: m.rs, role: 'segr' + i });
    });
  };
  PT.SEG7.stress = function (p, c) { let mx = 0; for (let i = 0; i < 8; i++) mx = Math.max(mx, c.el(p, 'seg' + i).i / 0.03); return mx; };

  /* Lista de tipos que pueden tocarse desde la bandeja de piezas de un banco libre */
  PT.TRAY = ['R', 'POT', 'LDR', 'NTC', 'C', 'ECAP', 'LED', 'D', 'BTN', 'SW', 'BJT', 'NMOS', 'BUZ', 'MOTOR'];
})(typeof globalThis !== 'undefined' ? globalThis : window);
