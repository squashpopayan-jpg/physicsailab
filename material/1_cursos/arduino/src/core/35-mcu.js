/* ===================================================================
   35-mcu.js — Placas (EM.mcu): Arduino UNO, Nano y ESP32 DevKit con su mapa de pines,
   modelo eléctrico de los pines, ADC, PWM, tiempo virtual y bibliotecas (Serial, Servo, LCD I²C, DHT…).
   Ejecuta los sketches traducidos por EM.ino. Sin DOM: se prueba en Node.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const M = (EM.mcu = {});
  const P = 2.54;

  /* ---------------- definición de placas ---------------- */
  const pin = (id, o) => Object.assign({ id, label: id }, o);
  function unoPins() {
    const out = [];
    /* encabezado superior (de izquierda a derecha, USB a la izquierda): SCL SDA AREF GND 13 12 11 10 9 8 | 7 6 5 4 3 2 1 0 */
    const top = ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8'];
    top.forEach((id, k) => out.push(pin(id, { x: 17.78 + k * P, y: 2.8, top: true })));
    ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'].forEach((id, k) => out.push(pin(id, { x: 47.24 + k * P, y: 2.8, top: true })));
    ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND2', 'GND3', 'VIN'].forEach((id, k) => out.push(pin(id, { x: 26.67 + k * P, y: 50.6 })));
    ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].forEach((id, k) => out.push(pin(id, { x: 49.53 + k * P, y: 50.6 })));
    for (const q of out) {
      const g = /^D(\d+)$/.exec(q.id), a = /^A(\d)$/.exec(q.id);
      if (g) { q.gpio = +g[1]; q.label = g[1]; if ([3, 5, 6, 9, 10, 11].includes(q.gpio)) q.pwm = true; if ([2, 3].includes(q.gpio)) q.int = true; }
      if (a) { q.gpio = 14 + +a[1]; q.adc = +a[1]; q.label = q.id; }
      if (q.id === 'GND' || q.id === 'GND2' || q.id === 'GND3') { q.net = 'GND'; q.label = 'GND'; }
      if (q.id === '5V') q.net = '5V';
      if (q.id === '3V3') { q.net = '3V3'; q.label = '3V3'; }
      if (q.id === 'VIN') q.net = 'VIN';
      if (q.id === 'SDA') { q.net = 'A4'; q.label = 'SDA'; }
      if (q.id === 'SCL') { q.net = 'A5'; q.label = 'SCL'; }
      if (q.id === 'A4') q.net = 'A4';
      if (q.id === 'A5') q.net = 'A5';
      if (q.id === 'D0') q.label = 'RX0'; if (q.id === 'D1') q.label = 'TX1';
    }
    return out;
  }
  M.boards = {
    uno: {
      name: 'Arduino UNO R3', mcu: 'ATmega328P', vcc: 5, bits: 16, w: 68.6, h: 53.3, rout: 40, rpu: 35000, rpd: null, imax: 0.04, irec: 0.02, vih: 0.6, vil: 0.3, vabs: 5.5,
      adcBits: 10, adcVref: 5, pwmBits: 8, pwmFreq: 490, ledPin: 'D13', hz: 16e6, cost: 0.4, fcpu: 16000000, clockCost: 3,
      pins: unoPins(), serialPins: { rx: 'D0', tx: 'D1' }, i2c: { sda: 'A4', scl: 'A5' }, spi: { mosi: 'D11', miso: 'D12', sck: 'D13', ss: 'D10' }, ram: 2048, flash: 32256, v5: 5.0
    },
    nano: {
      name: 'Arduino Nano', mcu: 'ATmega328P', vcc: 5, bits: 16, w: 43.2, h: 18.5, rout: 40, rpu: 35000, imax: 0.04, irec: 0.02, vih: 0.6, vil: 0.3, vabs: 5.5,
      adcBits: 10, adcVref: 5, pwmBits: 8, pwmFreq: 490, ledPin: 'D13', clockCost: 3, v5: 4.95,
      pins: [], serialPins: { rx: 'D0', tx: 'D1' }, i2c: { sda: 'A4', scl: 'A5' }, spi: { mosi: 'D11', miso: 'D12', sck: 'D13', ss: 'D10' }, ram: 2048, flash: 30720
    },
    esp32: {
      name: 'ESP32 DevKit (30 pines)', mcu: 'ESP32-WROOM-32', vcc: 3.3, bits: 32, w: 51.5, h: 28.3, rout: 30, rpu: 45000, rpd: 45000, imax: 0.04, irec: 0.012, vih: 0.75, vil: 0.25, vabs: 3.6,
      adcBits: 12, adcVref: 3.1, adcOffset: 0.04, pwmBits: 8, pwmFreq: 1000, ledPin: 'G2', clockCost: 1, v5: 4.7, r3: 0.6,
      pins: [], serialPins: { rx: 'G3', tx: 'G1' }, i2c: { sda: 'G21', scl: 'G22' }, spi: { mosi: 'G23', miso: 'G19', sck: 'G18', ss: 'G5' }, ram: 520000, flash: 4000000
    }
  };
  /* Nano: dos filas de 15 pines, USB a la izquierda; se enchufa en las filas i y e de la protoboard */
  (function () {
    const nano = M.boards.nano;
    const topRow = ['D1', 'D0', 'RESET', 'GND', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12'];
    const botRow = ['D13', '3V3', 'AREF', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '5V', 'RESET2', 'GND2', 'VIN'];
    const mk = (id, row, idx) => {
      const q = pin(id, { x: 8 + idx * P, y: row === 0 ? 1.8 : 17.04, row, idx });
      const g = /^D(\d+)$/.exec(id), a = /^A(\d)$/.exec(id);
      if (g) { q.gpio = +g[1]; q.label = g[1]; if ([3, 5, 6, 9, 10, 11].includes(q.gpio)) q.pwm = true; if ([2, 3].includes(q.gpio)) q.int = true; }
      if (a) { q.gpio = 14 + +a[1]; q.adc = +a[1]; if (+a[1] >= 6) { delete q.gpio; q.adcOnly = true; } }
      if (id === 'A6' || id === 'A7') { q.adc = +id[1]; q.adcOnly = true; }
      if (id === 'GND' || id === 'GND2') { q.net = 'GND'; q.label = 'GND'; }
      if (id === '5V') q.net = '5V'; if (id === '3V3') q.net = '3V3'; if (id === 'VIN') q.net = 'VIN';
      if (id === 'RESET2') q.label = 'RST'; if (id === 'RESET') q.label = 'RST';
      if (id === 'A4') q.net = 'A4'; if (id === 'A5') q.net = 'A5';
      if (id === 'D0') q.label = 'RX0'; if (id === 'D1') q.label = 'TX1';
      return q;
    };
    topRow.forEach((id, k) => nano.pins.push(mk(id, 0, k)));
    botRow.forEach((id, k) => nano.pins.push(mk(id, 1, k)));
    nano.plugRows = [0, 1]; nano.plugSpan = 15; nano.plugDefault = ['i', 'e'];
  })();
  /* ESP32 DevKit de 30 pines (DOIT), USB a la izquierda; se enchufa en las filas i y b */
  (function () {
    const e = M.boards.esp32;
    const topRow = ['VIN', 'GND', 'G13', 'G12', 'G14', 'G27', 'G26', 'G25', 'G33', 'G32', 'G35', 'G34', 'VN', 'VP', 'EN'];
    const botRow = ['3V3', 'GND2', 'G15', 'G2', 'G4', 'G16', 'G17', 'G5', 'G18', 'G19', 'G21', 'G3', 'G1', 'G22', 'G23'];
    const ADC1 = { G36: 0, G37: 1, G38: 2, G39: 3, G32: 4, G33: 5, G34: 6, G35: 7 }, ADC2 = { G4: 0, G0: 1, G2: 2, G15: 3, G13: 4, G12: 5, G14: 6, G27: 7, G25: 8, G26: 9 };
    const mk = (id, row, idx) => {
      const q = pin(id, { x: 8.2 + idx * P, y: row === 0 ? 2.7 : 25.56, row, idx });
      if (id === 'VP') { q.gpio = 36; q.label = 'VP'; q.alias = 'G36'; q.inputOnly = true; q.adc = 1; q.adcUnit = 1; }
      else if (id === 'VN') { q.gpio = 39; q.label = 'VN'; q.alias = 'G39'; q.inputOnly = true; q.adc = 1; q.adcUnit = 1; }
      else if (id === 'EN') { q.label = 'EN'; }
      else if (/^G\d+$/.test(id)) {
        q.gpio = +id.slice(1); q.label = id.slice(1);
        if ([34, 35].includes(q.gpio)) q.inputOnly = true;
        if (ADC1[id] !== undefined) { q.adc = ADC1[id]; q.adcUnit = 1; }
        if (ADC2[id] !== undefined) { q.adc = ADC2[id]; q.adcUnit = 2; }
        if ([25, 26].includes(q.gpio)) q.dac = true;
        if (!q.inputOnly) q.pwm = true;
        q.int = true;
        if ([0, 2, 12, 15, 5].includes(q.gpio)) q.strap = true;
      }
      if (id === 'GND' || id === 'GND2') { q.net = 'GND'; q.label = 'GND'; }
      if (id === 'VIN') { q.net = 'VIN'; q.label = 'VIN'; }
      if (id === '3V3') { q.net = '3V3'; q.label = '3V3'; }
      if (id === 'G1') q.label = 'TX0'; if (id === 'G3') q.label = 'RX0'; if (id === 'G17') q.label = 'TX2'; if (id === 'G16') q.label = 'RX2';
      if (id === 'G21') q.i2c = 'SDA'; if (id === 'G22') q.i2c = 'SCL';
      return q;
    };
    topRow.forEach((id, k) => e.pins.push(mk(id, 0, k)));
    botRow.forEach((id, k) => e.pins.push(mk(id, 1, k)));
    e.plugRows = [0, 1]; e.plugSpan = 15; e.plugDefault = ['i', 'b'];
    /* en el ESP32 el 5V de USB llega al pin VIN: la red «5V» también se llama VIN */
    for (const q of e.pins) if (q.id === 'VIN') q.net = 'VIN';
    e.railPin = 'VIN';
  })();
  /* El pin VIN del ESP32 recibe los 5 V de USB. Para el UNO, el pin 5V entrega 5 V. */
  M.boards.esp32.pins.forEach((q) => { if (q.net === 'VIN') q.net = '5V'; });

  /* Posición mundial (mm) de un pin de una placa colocada en la escena (m.x, m.y, m.rot grados múltiplos de 90) */
  M.pinWorld = function (m, pinSpec) {
    const spec = M.boards[m.kind];
    let x = pinSpec.x, y = pinSpec.y;
    const r = ((m.rot || 0) % 360 + 360) % 360;
    const w = spec.w, h = spec.h;
    if (r === 90) { [x, y] = [h - y, x]; } else if (r === 180) { x = w - x; y = h - y; } else if (r === 270) { [x, y] = [y, w - x]; }
    return [m.x + x, m.y + y];
  };
  M.pinById = (kind, id) => M.boards[kind].pins.find((q) => q.id === id);
  /* Convierte «D13», «13» o «A0» a la referencia de pin de la placa */
  M.refOf = function (kind, label) {
    const spec = M.boards[kind];
    if (typeof label === 'number') {
      if (kind === 'esp32') { const q = spec.pins.find((p) => p.gpio === label); return q && q.id; }
      const q = spec.pins.find((p) => p.gpio === label); return q && q.id;
    }
    return label;
  };

  /* ---------------- constantes y entorno de compilación ---------------- */
  M.consts = function (kind) {
    const c = { HIGH: 1, LOW: 0, INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, INPUT_PULLDOWN: 3, PI: Math.PI, HALF_PI: Math.PI / 2, TWO_PI: 2 * Math.PI, DEG_TO_RAD: Math.PI / 180, RAD_TO_DEG: 180 / Math.PI, E: Math.E,
      HEX: 16, DEC: 10, BIN: 2, OCT: 8, LSBFIRST: 0, MSBFIRST: 1, CHANGE: 1, FALLING: 2, RISING: 3, NAN: NaN, INFINITY: Infinity, DHT11: 11, DHT22: 22, DHT21: 21,
      SERIAL_8N1: 0, WL_CONNECTED: 3, WL_DISCONNECTED: 6, WIFI_STA: 1, WIFI_AP: 2, HTTP_GET: 1, HTTP_POST: 3, U_FLASH: 0, TOUCH_PAD: 0, MQTT_CONNECTED: 0 };
    const spec = M.boards[kind];
    if (kind === 'esp32') {
      c.LED_BUILTIN = 2; c.DAC1 = 25; c.DAC2 = 26; c.SDA = 21; c.SCL = 22; c.MOSI = 23; c.MISO = 19; c.SCK = 18; c.SS = 5; c.RX = 3; c.TX = 1;
      c.A0 = 36; c.A3 = 39; c.A4 = 32; c.A5 = 33; c.A6 = 34; c.A7 = 35; c.A10 = 4; c.A11 = 0; c.A12 = 2; c.A13 = 15; c.A14 = 13; c.A15 = 12; c.A16 = 14; c.A17 = 27; c.A18 = 25; c.A19 = 26;
      c.T0 = 4; c.T2 = 2; c.T3 = 15; c.T4 = 13; c.T5 = 12; c.T6 = 14; c.T7 = 27; c.T8 = 33; c.T9 = 32;
    } else {
      c.LED_BUILTIN = 13; c.A0 = 14; c.A1 = 15; c.A2 = 16; c.A3 = 17; c.A4 = 18; c.A5 = 19; c.A6 = 20; c.A7 = 21; c.SDA = 18; c.SCL = 19; c.MOSI = 11; c.MISO = 12; c.SCK = 13; c.SS = 10;
      c.INPUT_PULLDOWN = 3;
    }
    return c;
  };
  M.FUNCS = ['pinMode', 'digitalWrite', 'digitalRead', 'analogRead', 'analogWrite', 'analogReference', 'analogReadResolution', 'analogWriteResolution', 'delay', 'delayMicroseconds', 'millis', 'micros', 'random', 'randomSeed',
    'tone', 'noTone', 'pulseIn', 'attachInterrupt', 'detachInterrupt', 'digitalPinToInterrupt', 'interrupts', 'noInterrupts', 'yield', 'ledcSetup', 'ledcAttachPin', 'ledcAttach', 'ledcWrite', 'ledcWriteTone', 'dacWrite', 'touchRead',
    'shiftOut', 'shiftIn', 'esp_random', 'digitalToggle', 'bitSet', 'bitClear', 'bitWrite', 'delayMs', 'isDigit', 'isAlpha', 'isSpace', 'isUpperCase', 'isLowerCase', 'toupper', 'tolower', 'millisDelay', 'sei', 'cli', 'hallRead', 'temperatureRead',
    'ArduinoOTA', 'pinMatrixOutAttach', 'randomSeedUsing', 'wdt', 'esp_restart', 'abort'];
  M.OBJECTS = ['Serial', 'Serial1', 'Serial2', 'Wire', 'SPI', 'WiFi', 'ESP', 'SerialBT', 'Mirf'];
  M.CLASSES = ['Servo', 'LiquidCrystal_I2C', 'DHT', 'NewPing', 'Adafruit_SSD1306', 'MPU6050', 'HX711', 'WiFiClient', 'WebServer', 'PubSubClient', 'BluetoothSerial', 'SoftwareSerial', 'Stepper', 'RTC_DS3231', 'Adafruit_MPU6050', 'MFRC522', 'IRrecv', 'LiquidCrystal'];
  M.BLOCKING = ['delay', 'delayMicroseconds', 'pulseIn', 'Serial.readString', 'Serial.readStringUntil', 'Serial.parseInt', 'Serial.parseFloat', 'delayMs', 'shiftIn', 'Serial.flush'];

  /* ---------------- generador pseudoaleatorio ---------------- */
  function mulberry(seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  M.mulberry = mulberry;

  /* ===================================================================
     Máquina virtual de una placa
     =================================================================== */
  class Mcu {
    constructor(bench, id, opts = {}) {
      this.bench = bench; this.id = id;
      this.m = (bench.scene.mcus || []).find((q) => q.id === id);
      this.kind = this.m.kind;
      this.spec = M.boards[this.kind];
      this.opts = opts;
      this.onSerial = opts.onSerial || (() => {});
      this.noise = opts.noise !== false;
      this.rng = mulberry(opts.seed || 12345);
      this.reset();
    }
    get vcc() { return this.spec.vcc; }
    reset() {
      this.us = 0; this.clock = 0;
      this.pins = {}; /* id → {mode, level, pwm:{freq,duty}, lastRead} */
      this.pending = []; /* eventos futuros */
      this.log = [];
      this.serialIn = ''; this.btIn = ''; this.serialBuf = 0;
      this.baud = 0;
      this.lcds = []; this.servos = []; this.tones = {};
      this.isr = {};
      this.running = false; this.halted = false;
      this.gen = null; this.prog = null;
      this.ledc = { ch: {}, pin: {} };
      this.adcRes = this.spec.adcBits;
      this.randSeed = 1; this.rand = mulberry(1);
      this.i2cLog = [];
      this.version = 0;
      this.memo = new Map();
      this.ops = 0;
      this.errorMsg = null;
      this.txBytes = 0;
      this.httpQueue = []; this.httpResp = null; this.httpOn = false;
    }
    env() {
      return { bits: this.spec.bits, consts: M.consts(this.kind), funcs: new Set(M.FUNCS), objects: new Set(M.OBJECTS), classes: new Set(M.CLASSES), blocking: new Set(M.BLOCKING) };
    }
    /* Compila y reinicia la ejecución. Devuelve {ok, errors} */
    load(src) {
      const r = EM.ino.compile(src, this.env());
      this.compileResult = r;
      if (!r.ok) return r;
      this.src = src;
      this.boot();
      return r;
    }
    boot() {
      const keep = this.compileResult;
      const bench = this.bench;
      this.reset();
      this.compileResult = keep;
      const host = this.makeHost();
      this.host = host;
      try {
        this.prog = EM.ino.instantiate(keep.js, host);
      } catch (e) { this.errorMsg = String(e.message || e); this.halted = true; return; }
      const self = this;
      this.gen = (function* () {
        yield* self.prog.setup();
        for (;;) { yield* self.prog.loop(); if (host.tk()) yield; }
      })();
      this.halted = false;
      this.log.push({ us: 0, snap: this.snapshot() });
    }

    /* ---------- estados de pines ---------- */
    pinRef(p) { /* número de pin (D13, 13, A0 = 14…) → id de pin de la placa */
      if (typeof p === 'string') return p;
      const q = this.spec.pins.find((x) => x.gpio === p);
      return q ? q.id : null;
    }
    pinOf(p) { const id = this.pinRef(p); return id ? (this.pins[id] = this.pins[id] || { mode: 'in', level: 0 }) : null; }
    snapshot() {
      const s = {};
      for (const id in this.pins) {
        const p = this.pins[id];
        if (p.mode === 'out') s[this.id + ':' + id] = p.pwm ? { mode: 'out', level: p.level, pwm: p.pwm } : { mode: 'out', level: p.level };
        else if (p.mode === 'pullup') s[this.id + ':' + id] = { mode: 'pullup' };
        else if (p.mode === 'pulldown') s[this.id + ':' + id] = { mode: 'pulldown' };
        else if (p.mode === 'dac') s[this.id + ':' + id] = { mode: 'dac', volts: p.volts };
      }
      return s;
    }
    changed() { this.log.push({ us: this.us, snap: this.snapshot() }); this.version++; }

    /* ---------- lectura eléctrica ---------- */
    stateKey(states) { return JSON.stringify(states); }
    solveCurrent() {
      /* estado de pines en este instante del programa */
      const snap = this.snapshot();
      const states = {};
      for (const k in snap) { const s = snap[k]; states[k] = s.pwm ? Object.assign({}, s, { level: s.level }) : s; }
      const key = this.version + '|' + this.bench.version + '|' + this.stateKey(states);
      if (this.memoKey === key) return;
      this.bench.lastPins = this.effective(states);
      this.bench.solve(this.bench.lastPins);
      this.memoKey = key;
    }
    effective(states) { /* los pines con PWM se leen como nivel «alto» mientras se miden */
      return states;
    }
    voltOf(p) { this.solveCurrent(); return this.bench.v(this.id + ':' + this.pinRef(p)); }

    /* ---------- anfitrión de funciones ---------- */
    makeHost() {
      const self = this, spec = this.spec, bench = this.bench, K = M.consts(this.kind);
      const $ = Object.assign({}, K);
      $.us = 0;
      $.cost = spec.clockCost;
      $.tk = function () { self.us += $.cost; return self.us >= self.until || ++self.ops > self.opsLimit; };
      const needPin = (p, fn) => { const q = self.pinOf(p); if (!q) throw new Error(`${fn}: el pin ${p} no existe en ${spec.name}`); return q; };
      $.pinMode = (p, mode) => {
        const q = needPin(p, 'pinMode');
        const m = mode === 1 ? 'out' : mode === 2 ? 'pullup' : mode === 3 ? 'pulldown' : 'in';
        q.mode = m; if (m === 'out') q.level = q.level || 0; q.pwm = null; delete q.vread;
        self.us += 3; self.changed();
      };
      $.digitalWrite = (p, v) => {
        const q = needPin(p, 'digitalWrite');
        const lv = v ? 1 : 0;
        self.us += self.kind === 'esp32' ? 1 : 4;
        if (q.mode === 'out') { q.level = lv; q.pwm = null; self.changed(); }
        else if (q.mode === 'in' || q.mode === 'pullup') { q.mode = lv ? 'pullup' : 'in'; q.wasWrite = true; self.changed(); } /* en AVR, digitalWrite(HIGH) en una entrada activa el pull-up */
        if (!(self.kind === 'esp32')) { /* nada */ }
      };
      $.digitalToggle = (p) => $.digitalWrite(p, $.digitalRead(p) ? 0 : 1);
      $.digitalRead = (p) => {
        const q = needPin(p, 'digitalRead');
        self.us += self.kind === 'esp32' ? 1 : 4;
        if (q.mode === 'out' && !q.pwm) return q.level;
        const ref = self.id + ':' + self.pinRef(p);
        self.solveCurrent();
        if (bench.isFloating(ref) && q.mode === 'in') { /* entrada «al aire»: ruido */
          const t = Math.floor(self.us / 3000);
          return (Math.sin(t * 12.9898) * 43758.5453 % 1 + 1) % 1 > 0.5 ? 1 : 0;
        }
        const v = bench.v(ref), hi = spec.vih * self.vcc, lo = spec.vil * self.vcc;
        if (v >= hi) q.vread = 1; else if (v <= lo) q.vread = 0; else if (q.vread === undefined) q.vread = v > self.vcc / 2 ? 1 : 0;
        return q.vread;
      };
      $.analogRead = (p) => {
        let pid = p;
        if (self.kind !== 'esp32' && typeof p === 'number' && p < 8) pid = 14 + p;
        const q = self.pinRef(pid) && self.spec.pins.find((x) => x.id === self.pinRef(pid));
        if (!q || q.adc === undefined) throw new Error(`analogRead: el pin ${p} no tiene convertidor analógico (ADC) en ${spec.name}`);
        self.us += self.kind === 'esp32' ? 15 : 112;
        const ref = self.id + ':' + q.id;
        const cur = self.pins[q.id];
        if (cur && cur.mode === 'out') return cur.level ? (1 << self.adcRes) - 1 : 0;
        self.solveCurrent();
        let v = bench.v(ref);
        const maxc = (1 << self.adcRes) - 1;
        let cnt;
        if (self.kind === 'esp32') {
          if (q.adcUnit === 2 && self.wifiOn) return 0; /* ADC2 no funciona con WiFi */
          cnt = (v - spec.adcOffset) / (spec.adcVref - spec.adcOffset) * 4095;
          if (self.adcRes !== 12) cnt = cnt / 4095 * maxc;
          if (self.noise) cnt += (self.rng() - 0.5) * 6;
        } else {
          cnt = v / spec.adcVref * 1024;
          if (self.noise) cnt += (self.rng() - 0.5) * 0.9;
        }
        return Math.max(0, Math.min(maxc, Math.floor(cnt)));
      };
      $.analogReadResolution = (b) => { self.adcRes = Math.max(9, Math.min(12, b)); };
      $.analogReference = () => {};
      $.analogWriteResolution = () => {};
      $.analogWrite = (p, v) => {
        const q = needPin(p, 'analogWrite');
        const spin = self.spec.pins.find((x) => x.id === self.pinRef(p));
        self.us += 4;
        v = Math.max(0, Math.min(255, v | 0));
        if (self.kind !== 'esp32' && !spin.pwm) { q.mode = 'out'; q.level = v >= 128 ? 1 : 0; q.pwm = null; self.changed(); return; }
        q.mode = 'out';
        if (v === 0) { q.level = 0; q.pwm = null; } else if (v === 255) { q.level = 1; q.pwm = null; } else { q.pwm = { duty: v / 255, freq: self.kind === 'esp32' ? 1000 : ([5, 6].includes(spin.gpio) ? 980 : 490) }; q.level = 1; }
        self.changed();
      };
      $.ledcSetup = (ch, freq, res) => { self.ledc.ch[ch] = { freq, res }; return freq; };
      $.ledcAttachPin = (p, ch) => { self.ledc.pin[ch] = p; needPin(p, 'ledcAttachPin').mode = 'out'; self.changed(); };
      $.ledcAttach = (p, freq, res) => { self.ledc.ch[p] = { freq, res }; self.ledc.pin[p] = p; needPin(p, 'ledcAttach').mode = 'out'; self.changed(); return 1; };
      $.ledcWrite = (chOrPin, duty) => {
        const pinn = self.ledc.pin[chOrPin] !== undefined ? self.ledc.pin[chOrPin] : chOrPin;
        const c = self.ledc.ch[chOrPin] || { freq: 1000, res: 8 };
        const q = needPin(pinn, 'ledcWrite'), max = (1 << c.res) - 1;
        q.mode = 'out';
        const d = Math.max(0, Math.min(1, duty / max));
        if (d <= 0) { q.level = 0; q.pwm = null; } else if (d >= 1) { q.level = 1; q.pwm = null; } else { q.pwm = { duty: d, freq: c.freq }; q.level = 1; }
        self.changed();
      };
      $.ledcWriteTone = (chOrPin, freq) => { const pinn = self.ledc.pin[chOrPin] !== undefined ? self.ledc.pin[chOrPin] : chOrPin; const q = needPin(pinn, 'ledcWriteTone'); q.mode = 'out'; if (freq > 0) { q.pwm = { duty: 0.5, freq }; q.level = 1; self.tones[self.pinRef(pinn)] = freq; } else { q.pwm = null; q.level = 0; delete self.tones[self.pinRef(pinn)]; } self.changed(); return freq; };
      $.dacWrite = (p, v) => { const q = needPin(p, 'dacWrite'); q.mode = 'dac'; q.volts = Math.max(0, Math.min(255, v)) / 255 * 3.3; self.changed(); };
      $.touchRead = () => 70;
      $.hallRead = () => 20;
      $.temperatureRead = () => 45;
      $.tone = (p, f, dur) => {
        const q = needPin(p, 'tone');
        q.mode = 'out'; q.pwm = { duty: 0.5, freq: f }; q.level = 1; self.tones[self.pinRef(p)] = f; self.changed();
        if (dur) self.pending.push({ us: self.us + dur * 1000, fn: () => { if (q.pwm && q.pwm.freq === f) { q.pwm = null; q.level = 0; delete self.tones[self.pinRef(p)]; self.changed(); } } });
      };
      $.noTone = (p) => { const q = needPin(p, 'noTone'); q.pwm = null; q.level = 0; delete self.tones[self.pinRef(p)]; self.changed(); };
      $.delay = function* (ms) {
        ms = ms >>> 0;
        self.us += ms * 1000;
        if (self.us >= self.until) yield;
      };
      $.delayMs = $.delay;
      $.delayMicroseconds = function* (us) { self.us += us >>> 0; if (self.us >= self.until) yield; };
      $.yield = () => {};
      $.millis = () => Math.floor(self.us / 1000) >>> 0;
      $.micros = () => (self.kind === 'esp32' ? Math.floor(self.us) : Math.floor(self.us / 4) * 4) >>> 0;
      $.map = (x, a, b, c, d) => { const den = (b - a) | 0; return den === 0 ? 0 : ((((x - a) | 0) * ((d - c) | 0) | 0) / den | 0) + c | 0; };
      $.random = (a, b) => { const lo = b === undefined ? 0 : a, hi = b === undefined ? a : b; return hi <= lo ? lo : Math.floor(self.rand() * (hi - lo)) + lo; };
      $.randomSeed = (s) => { self.rand = mulberry(s >>> 0); };
      $.esp_random = () => Math.floor(self.rand() * 4294967296);
      $.digitalPinToInterrupt = (p) => p;
      $.attachInterrupt = (p, fn, mode) => { const id = self.pinRef(p); self.isr[id] = { fn, mode, last: null }; };
      $.detachInterrupt = (p) => { delete self.isr[self.pinRef(p)]; };
      $.interrupts = () => {}; $.noInterrupts = () => {}; $.sei = () => {}; $.cli = () => {};
      $.isDigit = (c) => (c >= 48 && c <= 57 ? 1 : 0); $.isAlpha = (c) => ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) ? 1 : 0); $.isSpace = (c) => (c === 32 || (c >= 9 && c <= 13) ? 1 : 0);
      $.isUpperCase = (c) => (c >= 65 && c <= 90 ? 1 : 0); $.isLowerCase = (c) => (c >= 97 && c <= 122 ? 1 : 0); $.toupper = (c) => (c >= 97 && c <= 122 ? c - 32 : c); $.tolower = (c) => (c >= 65 && c <= 90 ? c + 32 : c);
      $.bitSet = (x, n) => x | (1 << n); $.bitClear = (x, n) => x & ~(1 << n); $.bitWrite = (x, n, b) => (b ? x | (1 << n) : x & ~(1 << n));
      $.shiftOut = (dp, cp, order, val) => { for (let i = 0; i < 8; i++) { const bit = order === 0 ? (val >> i) & 1 : (val >> (7 - i)) & 1; $.digitalWrite(dp, bit); $.digitalWrite(cp, 1); $.digitalWrite(cp, 0); } };
      $.pulseIn = function* (p, level, timeout) {
        timeout = timeout === undefined ? 1000000 : timeout >>> 0;
        const ref = self.id + ':' + self.pinRef(p);
        const mod = self.moduleDriving(ref);
        if (mod && mod.M.pulse) {
          const r = mod.M.pulse(mod.p, bench, self, level, timeout);
          if (r && r.wait !== undefined) { self.us += Math.min(r.wait, timeout); }
          if (r && r.dur !== undefined) { self.us += r.dur; if (self.us >= self.until) yield; return Math.round(r.dur); }
        }
        self.us += timeout; if (self.us >= self.until) yield;
        return 0;
      };
      $.Serial = this.makeSerial('Serial'); $.Serial1 = this.makeSerial('Serial1'); $.Serial2 = this.makeSerial('Serial2');
      $.SerialBT = this.makeSerial('SerialBT');
      $.ESP = { restart() { self.rebootRequested = true; }, getFreeHeap() { return 280000; }, getChipRevision() { return 1; }, getCpuFreqMHz() { return 240; } };
      $.Wire = this.makeWire();
      $.WiFi = this.makeWiFi();
      $.SPI = { begin() {}, transfer(v) { return v; }, beginTransaction() {}, endTransaction() {}, setClockDivider() {}, setBitOrder() {}, setDataMode() {} };
      for (const cls of M.CLASSES) $[cls] = M.makeClass(cls, this);
      return $;
    }
    moduleDriving(ref) {
      for (const p of this.bench.scene.parts) {
        const Mo = M.modules[p.type];
        if (!Mo || !Mo.outputs) continue;
        for (const o of Mo.outputs) {
          const idx = EM.parts[p.type].pinNames.indexOf(o);
          if (idx >= 0 && p.pins[idx] && this.bench.nets.same(p.pins[idx], ref)) return { p, M: Mo, pin: o };
        }
      }
      return null;
    }
    makeSerial(name) {
      const self = this;
      const inK = name === 'SerialBT' ? 'btIn' : 'serialIn';
      const out = (txt) => {
        self.txBytes += txt.length;
        self.onSerial(txt, name);
        if (self.baud) { /* el búfer de 64 bytes se vacía a baud/10 bytes por segundo */
          const per = name === 'SerialBT' ? 0 : 10e6 / self.baud * txt.length;
          self.us += Math.min(per, 2000);
        }
      };
      const fmt = (v, f, tag) => {
        if (typeof v === 'string') return v;
        if (tag === 'float' || tag === 'double') return EM.ino.fmtNum(v, tag, f === undefined ? 2 : f);
        if (tag === 'char') return String.fromCharCode(v);
        if (f === 16) return (v >>> 0).toString(16).toUpperCase();
        if (f === 2) return (v >>> 0).toString(2);
        if (f === 8) return (v >>> 0).toString(8);
        return String(v);
      };
      return {
        begin(b) { if (name !== 'SerialBT') self.baud = typeof b === 'number' ? b : 9600; },
        end() {},
        print(v, f, tag) { out(fmt(v, f, tag)); return 1; },
        println(v, f, tag) { out((v === undefined ? '' : fmt(v, f, tag)) + '\r\n'); return 1; },
        write(v) { out(typeof v === 'string' ? v : String.fromCharCode(v)); return 1; },
        printf(f, ...a) { let i = 0; out(String(f).replace(/%(\d*)(\.\d+)?([dfsxcul]+)/g, (m, w, pr, t) => { const x = a[i++]; if (t.includes('f')) return Number(x).toFixed(pr ? +pr.slice(1) : 6); if (t === 'x') return (x >>> 0).toString(16); if (t === 'c') return String.fromCharCode(x); return String(x); })); return 1; },
        available() { return self[inK].length; },
        availableForWrite() { return 63; },
        read() { if (!self[inK].length) return -1; const c = self[inK].charCodeAt(0); self[inK] = self[inK].slice(1); return c; },
        peek() { return self[inK].length ? self[inK].charCodeAt(0) : -1; },
        *readString() { const s = self[inK]; self[inK] = ''; return s; },
        *readStringUntil(c) { const t = String.fromCharCode(c), i = self[inK].indexOf(t); let s; if (i < 0) { s = self[inK]; self[inK] = ''; } else { s = self[inK].slice(0, i); self[inK] = self[inK].slice(i + 1); } return s; },
        *parseInt() { const m = /^\D*(-?\d+)/.exec(self[inK]); if (!m) { return 0; } self[inK] = self[inK].slice(m[0].length); return parseInt(m[1], 10); },
        *parseFloat() { const m = /^[^\d-]*(-?\d+\.?\d*)/.exec(self[inK]); if (!m) { return 0; } self[inK] = self[inK].slice(m[0].length); return parseFloat(m[1]); },
        flush() {}, setTimeout() {}, setRxBufferSize() {}, *flushG() {}
      };
    }
    makeWire() {
      const self = this;
      const find = (addr) => self.bench.scene.parts.find((p) => EM.parts[p.type].module && PT_has(p) && (EM.parts[p.type].props.addr !== undefined) && addrOf(p) === addr);
      const PT_has = () => true;
      const addrOf = (p) => (p.addr !== undefined ? p.addr : EM.parts[p.type].props.addr);
      let target = null, tx = [];
      return {
        begin() { self.i2cOn = true; }, setClock() {}, setPins() {}, end() {},
        beginTransmission(a) { target = a; tx = []; },
        write(v) { tx.push(v); return 1; },
        endTransmission() { const d = self.i2cDevice(target); return d ? 0 : 2; },
        requestFrom(a, n) { self.i2cReq = { addr: a, n, buf: [], i: 0 }; const d = self.i2cDevice(a); if (d && d.M.i2cRead) self.i2cReq.buf = d.M.i2cRead(d.p, self, tx) || []; return self.i2cReq.buf.length; },
        available() { return self.i2cReq ? self.i2cReq.buf.length - self.i2cReq.i : 0; },
        read() { return self.i2cReq && self.i2cReq.i < self.i2cReq.buf.length ? self.i2cReq.buf[self.i2cReq.i++] : -1; }
      };
    }
    /* ¿hay un módulo I²C con esa dirección bien cableado y alimentado? */
    i2cDevice(addr) {
      const b = this.bench, spec = this.spec;
      const sda = this.id + ':' + spec.i2c.sda, scl = this.id + ':' + spec.i2c.scl;
      for (const p of b.scene.parts) {
        const d = EM.parts[p.type];
        if (!d.module || d.props.addr === undefined) continue;
        const a = p.addr !== undefined ? p.addr : d.props.addr;
        if (a !== addr) continue;
        const iS = d.pinNames.indexOf('SDA'), iC = d.pinNames.indexOf('SCL');
        if (iS < 0 || iC < 0 || !p.pins[iS] || !p.pins[iC]) continue;
        if (!b.nets.same(p.pins[iS], sda) || !b.nets.same(p.pins[iC], scl)) continue;
        this.solveCurrent();
        if (!b.modPower(p).ok) continue;
        return { p, M: M.modules[p.type] || {} };
      }
      return null;
    }
    makeWiFi() {
      const self = this;
      return {
        mode() {}, begin(ssid, pass) { self.wifi = { ssid, pass, t0: self.us, connecting: true }; self.wifiOn = true; return 3; },
        status() { const w = self.wifi; if (!w) return 6; return (self.us - w.t0 > 2.5e6 && self.wifiOk(w)) ? 3 : (self.us - w.t0 > 6e6 ? 1 : 6); },
        localIP() { return self.wifi ? '192.168.1.57' : '0.0.0.0'; }, macAddress() { return '24:6F:28:AB:CD:EF'; }, RSSI() { return -58; }, disconnect() { self.wifi = null; }, softAP() { return 1; }, setAutoReconnect() {}
      };
    }
    wifiOk(w) { return this.opts.wifi ? (this.opts.wifi.ssid === w.ssid && this.opts.wifi.pass === w.pass) : true; }

    /* ---------- ejecución ---------- */
    /* Avanza el programa hasta el instante virtual `target` (µs). Devuelve true si sigue vivo */
    run(target) {
      this.until = target;
      this.ops = 0; this.opsLimit = this.opts.opsLimit || 60000;
      if (this.halted || !this.gen) return false;
      try {
        while (this.us < target && this.ops <= this.opsLimit) {
          this.firePending(this.us);
          const r = this.gen.next();
          if (r.done) { this.halted = true; break; }
        }
      } catch (e) {
        this.errorMsg = (e && e.message) || String(e);
        this.halted = true;
        return false;
      }
      return !this.halted;
    }
    firePending(t) {
      if (!this.pending.length) return;
      this.pending.sort((a, b) => a.us - b.us);
      while (this.pending.length && this.pending[0].us <= t) this.pending.shift().fn();
    }
    /* Avanza dt segundos de tiempo virtual y devuelve los segmentos de estado de pines [{w, pins}] */
    advance(dt, world) {
      const t0 = this.clock, t1 = t0 + dt * 1e6;
      const chunk = world && world.dt ? world.dt * 1e6 : (t1 - t0);
      const segs = [];
      let cur = this.snapshotAt(t0);
      let t = t0;
      while (t < t1 - 1e-6) {
        const tn = Math.min(t1, t + chunk);
        if (world && world.update) { if (world.update(tn, this)) { this.version++; this.bench.version = (this.bench.version || 0) + 1; this.memoKey = null; } }
        const alive = this.run(tn);
        this.pollInterrupts();
        /* recorrer los cambios de pin ocurridos en (t, tn] */
        let tc = t;
        const evs = this.log.filter((e) => e.us <= tn).sort((a, b) => a.us - b.us);
        this.log = this.log.filter((e) => e.us > tn);
        for (const e of evs) {
          const tt = Math.max(tc, Math.min(e.us, tn));
          if (tt > tc) { this.addSeg(segs, tt - tc, cur); tc = tt; }
          cur = e.snap;
        }
        if (tn > tc) this.addSeg(segs, tn - tc, cur);
        this.curSnap = cur;
        t = tn;
        if (!alive && this.us < tn) { /* programa detenido: el resto del tiempo mantiene su estado */ }
      }
      this.clock = t1;
      if (this.us < t1 && this.halted) this.us = t1;
      return this.compactSegs(segs);
    }
    snapshotAt(t) { return this.curSnap || this.snapshot(); }
    addSeg(segs, dur, snap) { if (dur > 0) segs.push({ w: dur * 1e-6, snap }); }
    /* Expande los PWM en segmentos de nivel alto/bajo y agrupa estados iguales */
    compactSegs(segs) {
      const out = new Map();
      const transient = this.bench.c.hasReact;
      const list = [];
      for (const sg of segs) {
        const pw = [];
        const base = {};
        for (const k in sg.snap) { const s = sg.snap[k]; if (s.pwm) pw.push([k, s.pwm]); base[k] = s.pwm ? { mode: 'out', level: 0 } : s; }
        if (!pw.length) { list.push({ w: sg.w, pins: base }); continue; }
        if (transient) { /* periodos reales, limitados */
          const f = pw[0][1].freq, T = 1 / f, n = Math.max(1, Math.min(Math.round(sg.w / T), 200)), wT = sg.w / n;
          for (let i = 0; i < n; i++) {
            const dsort = [...new Set(pw.map((q) => q[1].duty))].sort((a, b) => a - b);
            let prev = 0;
            for (const d of [...dsort, 1]) {
              if (d > prev) {
                const pins = Object.assign({}, base);
                for (const [k, p] of pw) pins[k] = { mode: 'out', level: p.duty > prev + 1e-12 ? 1 : 0 };
                list.push({ w: wT * (d - prev), pins }); prev = d;
              }
            }
          }
          continue;
        }
        const dsort = [...new Set(pw.map((q) => q[1].duty))].sort((a, b) => a - b);
        let prev = 0;
        for (const d of [...dsort, 1]) {
          if (d > prev + 1e-12) {
            const pins = Object.assign({}, base);
            for (const [k, p] of pw) pins[k] = { mode: 'out', level: p.duty > prev + 1e-12 ? 1 : 0 };
            list.push({ w: sg.w * (d - prev), pins }); prev = d;
          }
        }
      }
      if (transient) return list;
      for (const s of list) {
        const key = JSON.stringify(s.pins);
        const o = out.get(key);
        if (o) o.w += s.w; else out.set(key, { w: s.w, pins: s.pins });
      }
      return [...out.values()];
    }
    /* Interrupciones: flancos de las entradas con attachInterrupt */
    pollInterrupts() {
      for (const id in this.isr) {
        const q = this.pins[id];
        if (q && q.mode === 'out') continue;
        this.solveCurrent();
        const v = this.bench.v(this.id + ':' + id), hi = this.spec.vih * this.vcc, lo = this.spec.vil * this.vcc;
        const lvl = v >= hi ? 1 : v <= lo ? 0 : (this.isr[id].last === null ? 0 : this.isr[id].last);
        const it = this.isr[id];
        if (it.last !== null && lvl !== it.last) {
          const rising = lvl === 1;
          if (it.mode === 1 || (it.mode === 3 && rising) || (it.mode === 2 && !rising)) {
            const g = it.fn();
            for (let k = 0; k < 1000; k++) { const r = g.next(); if (r.done) break; }
            this.us += 12;
          }
        }
        it.last = lvl;
      }
    }
    sendSerial(txt) { this.serialIn += txt; }
    uptime() { return this.us / 1e6; }
  }
  M.Mcu = Mcu;

  /* ---------------- clases de biblioteca ---------------- */
  M.makeClass = function (name, mcu) {
    const self = mcu;
    switch (name) {
      case 'Servo': return function Servo() {
        const s = this; s.pin = null; s.angle = 90; s.us = 1500;
        s.attach = (p, mn, mx) => { s.pin = p; s.min = mn || 544; s.max = mx || 2400; const q = self.pinOf(p); q.mode = 'out'; s.write(s.angle); self.servos.push(s); return 1; };
        s.write = (a) => { a = Math.max(0, Math.min(180, a | 0)); s.angle = a; s.writeMicroseconds(s.min + (s.max - s.min) * a / 180); };
        s.writeMicroseconds = (us) => { s.us = us; if (s.pin !== null) { const q = self.pinOf(s.pin); q.mode = 'out'; q.pwm = { duty: us / 20000, freq: 50, servo: true }; q.level = 1; self.changed(); } };
        s.read = () => s.angle; s.detach = () => { if (s.pin !== null) { const q = self.pinOf(s.pin); q.pwm = null; q.level = 0; self.changed(); s.pin = null; } }; s.attached = () => (s.pin !== null ? 1 : 0);
      };
      case 'LiquidCrystal_I2C': return function LiquidCrystal_I2C(addr, cols, rows) {
        const l = this; l.addr = addr; l.cols = cols || 16; l.rows = rows || 2; l.cx = 0; l.cy = 0; l.text = Array.from({ length: l.rows }, () => ' '.repeat(l.cols)); l.light = true;
        const dev = () => { const d = self.i2cDevice(addr); return d ? d.p : null; };
        const sync = () => { const p = dev(); l.ok = !!p; if (p) { p.screen = l.text.slice(); p.light = l.light; p.cursor = [l.cx, l.cy]; } };
        l.init = () => { l.clear(); }; l.begin = l.init; l.backlight = () => { l.light = true; sync(); }; l.noBacklight = () => { l.light = false; sync(); };
        l.clear = () => { l.text = l.text.map(() => ' '.repeat(l.cols)); l.cx = 0; l.cy = 0; sync(); }; l.home = () => { l.cx = 0; l.cy = 0; };
        l.setCursor = (c, r) => { l.cx = c; l.cy = r; };
        const put = (s) => { for (const ch of s) { if (l.cy < l.rows && l.cx < l.cols) { const row = l.text[l.cy]; l.text[l.cy] = row.slice(0, l.cx) + ch + row.slice(l.cx + 1); } l.cx++; } sync(); self.us += 40 * s.length; };
        l.print = (v, f, tag) => put(typeof v === 'string' ? v : EM.ino.fmtNum(v, tag, f)); l.println = l.print; l.write = (v) => put(String.fromCharCode(v));
        l.createChar = () => {}; l.cursor = () => {}; l.noCursor = () => {}; l.blink = () => {}; l.noBlink = () => {}; l.display = () => {}; l.noDisplay = () => {}; l.scrollDisplayLeft = () => {};
        self.lcds.push(l); sync();
      };
      case 'DHT': return function DHT(pin, type) {
        const d = this; d.pin = pin; d.type = type;
        const dev = () => { const ref = self.id + ':' + self.pinRef(d.pin); return self.bench.scene.parts.find((p) => (p.type === 'DHT11' || p.type === 'DHT22') && p.pins[1] && self.bench.nets.same(p.pins[1], ref)); };
        d.begin = () => {};
        const ok = () => { const p = dev(); if (!p) return null; const pw = self.bench.modPower(p); if (!pw.ok) return null; self.solveCurrent(); const rpu = self.bench.v(p.pins[1]) > 0.8 * self.bench.v(p.pins[0]); if (!rpu && !p.hasPullup) return null; return p; };
        d.readTemperature = () => { const p = ok(); self.us += 5000; if (!p) return NaN; const T = p.temp !== undefined ? p.temp : (self.bench.scene.env.temp || 25); return Math.fround(p.type === 'DHT11' ? Math.round(T) : Math.round(T * 10) / 10); };
        d.readHumidity = () => { const p = ok(); self.us += 5000; return p ? Math.fround(p.hum !== undefined ? p.hum : (self.bench.scene.env.hum || 50)) : NaN; };
        d.computeHeatIndex = (t, h) => t + 0.05 * (h - 50) * 0.1;
      };
      case 'HX711': return function HX711() { const h = this; h.begin = () => {}; h.set_scale = (s) => { h.scale = s; }; h.tare = () => { h.off = h.raw(); }; h.raw = () => { const p = self.bench.scene.parts.find((q) => q.type === 'HX711'); return p ? Math.round((p.mass || 0) * 420 + 8400 + (self.rng() - 0.5) * 20) : 0; }; h.is_ready = () => 1; h.get_units = () => (h.raw() - (h.off || 0)) / (h.scale || 1); h.read = h.raw; h.read_average = h.raw; h.get_value = () => h.raw() - (h.off || 0); h.set_offset = (o) => { h.off = o; }; };
      case 'WebServer': return function WebServer(port) {
        const s = this; s.routes = {}; s.nf = null; s.cur = null; s.port = port || 80;
        s.on = (path, fn) => { s.routes[path] = fn; };
        s.onNotFound = (fn) => { s.nf = fn; };
        s.begin = () => { self.httpOn = true; };
        s.handleClient = () => {
          const rq = self.httpQueue && self.httpQueue.shift();
          if (!rq) return;
          s.cur = rq; self.us += 800;
          const h = s.routes[rq.path] || s.nf;
          if (!h) { self.httpResp = { code: 404, type: 'text/plain', body: 'No encontrado: ' + rq.path, path: rq.path }; return; }
          const g = h();
          for (let k = 0; k < 100000; k++) { const r = g.next(); if (r.done) break; }
        };
        s.send = (code, type, body) => { self.httpResp = { code, type, body: String(body), path: s.cur ? s.cur.path : '/' }; };
        s.sendHeader = () => {};
        s.arg = (n) => (s.cur && s.cur.args && s.cur.args[n] !== undefined ? String(s.cur.args[n]) : '');
        s.hasArg = (n) => (s.cur && s.cur.args && n in s.cur.args ? 1 : 0);
        s.uri = () => (s.cur ? s.cur.path : '');
      };
      case 'NewPing': return function NewPing(t, e, max) { this.ping_cm = () => { const p = self.bench.scene.parts.find((q) => q.type === 'HCSR04'); return p ? Math.round(p.distance !== undefined ? p.distance : 100) : 0; }; };
      case 'SoftwareSerial': return function SoftwareSerial() { const s = self.makeSerial('Soft'); Object.assign(this, s); };
      case 'BluetoothSerial': return function BluetoothSerial() { const s = self.makeSerial('SerialBT'); Object.assign(this, s); this.begin = () => 1; this.hasClient = () => 1; };
      case 'MPU6050': return function MPU6050() { const m = this; const dev = () => self.bench.scene.parts.find((p) => p.type === 'MPU6050'); m.begin = () => (self.i2cDevice(0x68) ? 1 : 0); m.initialize = () => {}; m.testConnection = () => (self.i2cDevice(0x68) ? 1 : 0); m.getAcceleration = () => 0; };
      default: return function () {};
    }
  };

  /* ---------------- módulos activos (salidas hacia el microcontrolador) ---------------- */
  M.modules = {
    HCSR04: {
      outputs: ['ECHO'], timeDep: true,
      /* disparo: flanco descendente de TRIG tras ≥ 10 µs en alto. Eco: 2d/c tras ~ 450 µs de ráfaga */
      drive(p, b) { return {}; },
      pulse(p, b, mcu, level, timeout) {
        const pw = b.modPower(p);
        if (!pw.ok) return { wait: timeout };
        const d = (p.distance !== undefined ? p.distance : 100) / 100; /* m */
        const c = 331.3 + 0.606 * (b.scene.env.temp !== undefined ? b.scene.env.temp : 20); /* velocidad del sonido (m/s) */
        const t = 2 * d / c * 1e6;
        if (d > 4 || d < 0.02) return { wait: timeout };
        return { wait: 450, dur: t * (1 + (mcu.rng() - 0.5) * 0.004) };
      }
    },
    DHT11: { outputs: [], drive() { return {}; } },
    DHT22: { outputs: [], drive() { return {}; } },
    PIR: {
      outputs: ['OUT'],
      drive(p, b) { const pw = b.modPower(p); if (!pw.ok) return {}; return { OUT: { v: p.motion ? Math.min(3.3, pw.v * 0.66) : 0, rs: 100 } }; }
    },
    LM35: {
      outputs: ['OUT'],
      drive(p, b) { const pw = b.modPower(p); if (!pw.ok) return {}; const T = p.temp !== undefined ? p.temp : (b.scene.env.temp || 25); return { OUT: { v: Math.max(0, 0.01 * T), rs: 2 } }; }
    },
    SOIL: {
      outputs: ['AO'],
      drive(p, b) { const pw = b.modPower(p); if (!pw.ok) return {}; const w = p.wet !== undefined ? p.wet : 0.4; return { AO: { v: pw.v * (0.95 - 0.7 * w), rs: 2000 } }; }
    },
    IRSENS: {
      outputs: ['OUT'],
      drive(p, b) { const pw = b.modPower(p); if (!pw.ok) return {}; return { OUT: { v: p.obstacle ? 0 : pw.v, rs: 200 } }; }
    },
    FOTOGATE: {
      outputs: ['OUT'],
      drive(p, b) { const pw = b.modPower(p); if (!pw.ok) return {}; return { OUT: { v: p.blocked ? pw.v : 0, rs: 200 } }; }
    },
    LCDI2C: {}, OLED: {}, MPU6050: {}, SERVO: {}, HX711: {}, RC522: {}, HC05: {}, RELAYMOD: {}, L298N: {}, NRF24: {}, LORA: {}, SEG7: {}
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
