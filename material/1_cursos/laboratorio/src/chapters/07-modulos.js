/* Capítulo 7 · Sensores y módulos para la ESP32 */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const W = MC.wiring;

  /* ---------- Esquemas de conexión ---------- */
  const around = (x0, yPin, off = 0.015) => [[x0, 0.975], [off, 0.975], [off, yPin]];
  const yL = (i) => 0.05 + 0.9 * 0.15 + i * ((0.9 * 0.78) / 14); /* fracción vertical del pin i del lado izquierdo */
  W.def('hcsr04', {
    mods: [{ id: 'hc', label: 'HC-SR04', fx: 0.55, fy: 0.08, fw: 0.36, fh: 0.2, pins: ['VCC', 'Trig', 'Echo', 'GND'] }],
    nodes: { e: [0.80, 0.44], m: [0.80, 0.62], g: [0.80, 0.82] }, dots: ['m'],
    parts: [{ type: 'res', a: 'n:e', b: 'n:m', label: '1 kΩ' }, { type: 'res', a: 'n:m', b: 'n:g', label: '2 kΩ' }],
    wires: [
      { a: 'hc:VCC', b: 'esp:VIN', c: '--wire-r', note: '5 V del USB para el sensor', route: around(0.595, yL(14)) },
      { a: 'hc:Trig', b: 'esp:D19', c: '--wire-g', note: 'pulso de disparo de 10 µs (3.3 V basta)' },
      { a: 'hc:Echo', b: 'n:e', c: '--wire-y', note: 'pulso de eco de 5 V: pasa por el divisor' },
      { a: 'n:m', b: 'esp:D18', c: '--wire-o', note: '5 V × 2k/(1k+2k) = 3.3 V al GPIO 18' },
      { a: 'hc:GND', b: 'esp:GNDR', c: '--wire-k', note: 'tierra común' },
      { a: 'n:g', b: 'esp:GNDR', c: '--wire-k', note: 'el divisor también va a tierra' }
    ],
    labels: [{ text: 'divisor 1k/2k', fx: 0.84, fy: 0.63, size: 11 }]
  });
  W.def('mpu6050', {
    mods: [{ id: 'mpu', label: 'MPU6050 (GY-521)', fx: 0.55, fy: 0.1, fw: 0.36, fh: 0.28, pins: ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'] }],
    wires: [
      { a: 'mpu:VCC', b: 'esp:3V3', c: '--wire-r', note: 'alimentación 3.3 V (el módulo acepta 3.3–5 V)' },
      { a: 'mpu:GND', b: 'esp:GNDR', c: '--wire-k', note: 'tierra' },
      { a: 'mpu:SCL', b: 'esp:D22', c: '--wire-y', note: 'reloj del bus I²C' },
      { a: 'mpu:SDA', b: 'esp:D21', c: '--wire-b', note: 'datos del bus I²C' }
    ],
    labels: [{ text: 'AD0 sin conectar → dirección 0x68', fx: 0.55, fy: 0.46, size: 11 }]
  });
  W.def('bmp280', {
    mods: [{ id: 'bmp', label: 'BMP280', fx: 0.6, fy: 0.12, fw: 0.28, fh: 0.24, pins: ['VCC', 'GND', 'SCL', 'SDA', 'CSB', 'SDO'] }],
    wires: [
      { a: 'bmp:VCC', b: 'esp:3V3', c: '--wire-r', note: '3.3 V (no use 5 V en módulos sin regulador)' },
      { a: 'bmp:GND', b: 'esp:GNDR', c: '--wire-k', note: 'tierra' },
      { a: 'bmp:SCL', b: 'esp:D22', c: '--wire-y', note: 'reloj I²C' },
      { a: 'bmp:SDA', b: 'esp:D21', c: '--wire-b', note: 'datos I²C' }
    ],
    labels: [{ text: 'SDO a GND → 0x76 · SDO a 3V3 → 0x77', fx: 0.55, fy: 0.44, size: 11 }]
  });
  W.def('hx711', {
    mods: [
      { id: 'cel', label: 'Celda de carga 1 kg', fx: 0.5, fy: 0.06, fw: 0.42, fh: 0.16, pins: ['E+', 'E−', 'A−', 'A+'], fill: '--metal', size: 11 },
      { id: 'hx', label: 'HX711', fx: 0.5, fy: 0.55, fw: 0.42, fh: 0.22, pins: ['GND', 'DT', 'SCK', 'VCC'] }
    ],
    nodes: { ep: [0.55, 0.55], em: [0.65, 0.55], am: [0.76, 0.55], ap: [0.87, 0.55] }, dots: ['ep', 'em', 'am', 'ap'],
    wires: [
      { a: 'cel:E+', b: 'n:ep', c: '--wire-r', note: 'excitación + (cable rojo de la celda)' },
      { a: 'cel:E−', b: 'n:em', c: '--wire-k', note: 'excitación − (cable negro)' },
      { a: 'cel:A−', b: 'n:am', c: '--wire-w', note: 'señal − (cable blanco)' },
      { a: 'cel:A+', b: 'n:ap', c: '--wire-g', note: 'señal + (cable verde)' },
      { a: 'hx:VCC', b: 'esp:3V3', c: '--wire-r', note: 'alimentación del HX711' },
      { a: 'hx:GND', b: 'esp:GNDR', c: '--wire-k', note: 'tierra' },
      { a: 'hx:DT', b: 'esp:RX2', c: '--wire-y', note: 'datos (GPIO 16)' },
      { a: 'hx:SCK', b: 'esp:D4', c: '--wire-b', note: 'reloj (GPIO 4)' }
    ],
    labels: [{ text: 'E+   E−   A−   A+', fx: 0.53, fy: 0.52, size: 10.5, mono: true }]
  });
  W.def('ss49e', {
    mods: [{ id: 'h', label: 'SS49E', fx: 0.62, fy: 0.25, fw: 0.16, fh: 0.2, pins: ['VCC', 'GND', 'OUT'], fill: '--chip' }],
    wires: [
      { a: 'h:VCC', b: 'esp:3V3', c: '--wire-r', note: '3.3 V: la salida sin campo es 1.65 V' },
      { a: 'h:GND', b: 'esp:GNDR', c: '--wire-k', note: 'tierra' },
      { a: 'h:OUT', b: 'esp:D34', c: '--wire-y', note: 'salida analógica al ADC1 (GPIO 34)', route: around(0.727, yL(3)) }
    ],
    labels: [{ text: 'cara plana con rótulo hacia el imán', fx: 0.55, fy: 0.55, size: 11 }]
  });
  W.def('foto', {
    mods: [
      { id: 'f1', label: 'Compuerta 1', fx: 0.45, fy: 0.12, fw: 0.22, fh: 0.24, pins: ['VCC', 'GND', 'DO', 'AO'] },
      { id: 'f2', label: 'Compuerta 2', fx: 0.73, fy: 0.12, fw: 0.22, fh: 0.24, pins: ['VCC', 'GND', 'DO', 'AO'] }
    ],
    wires: [
      { a: 'f1:VCC', b: 'esp:3V3', c: '--wire-r', note: 'alimentación' },
      { a: 'f2:VCC', b: 'esp:3V3', c: '--wire-r', note: 'alimentación' },
      { a: 'f1:GND', b: 'esp:GNDR', c: '--wire-k', note: 'tierra' },
      { a: 'f2:GND', b: 'esp:GNDR', c: '--wire-k', note: 'tierra' },
      { a: 'f1:DO', b: 'esp:D27', c: '--wire-y', note: 'salida digital → GPIO 27 (interrupción)', route: around(0.59, yL(9), 0.012) },
      { a: 'f2:DO', b: 'esp:D26', c: '--wire-g', note: 'salida digital → GPIO 26 (interrupción)', route: around(0.87, yL(8), 0.024) }
    ],
    labels: [{ text: 'AO (analógica) queda libre', fx: 0.55, fy: 0.45, size: 11 }]
  });
  W.def('ina219', {
    mods: [{ id: 'ina', label: 'INA219', fx: 0.48, fy: 0.12, fw: 0.3, fh: 0.24, pins: ['VCC', 'GND', 'SCL', 'SDA', 'Vin−', 'Vin+'] }],
    nodes: { bp: [0.92, 0.18], bm: [0.92, 0.72], l1: [0.78, 0.72], l2: [0.6, 0.72] },
    parts: [{ type: 'bat', a: 'n:bm', b: 'n:bp', label: '+' }, { type: 'res', a: 'n:l1', b: 'n:l2', label: 'carga' }],
    wires: [
      { a: 'ina:VCC', b: 'esp:3V3', c: '--wire-r', note: 'alimentación del INA219' },
      { a: 'ina:GND', b: 'esp:GNDR', c: '--wire-k', note: 'tierra común con el circuito medido' },
      { a: 'ina:SCL', b: 'esp:D22', c: '--wire-y', note: 'reloj I²C' },
      { a: 'ina:SDA', b: 'esp:D21', c: '--wire-b', note: 'datos I²C' },
      { a: 'n:bp', b: 'ina:Vin+', c: '--wire-o', note: 'la corriente entra por Vin+…', sag: 0.05 },
      { a: 'ina:Vin−', b: 'n:l1', c: '--wire-o', note: '…y sale por Vin− hacia la carga', sag: 0.05 },
      { a: 'n:l2', b: 'n:bm', c: '--wire-k', note: 'regreso a la fuente', route: [[0.6, 0.86], [0.92, 0.86]] },
      { a: 'n:bm', b: 'esp:GNDR', c: '--wire-k', note: 'tierra común', route: [[0.92, 0.95], [0.4, 0.95]] }
    ]
  });
  W.def('ds18b20', {
    mods: [{ id: 'ds', label: 'DS18B20', fx: 0.6, fy: 0.08, fw: 0.2, fh: 0.2, pins: ['VDD', 'DQ', 'GND'], fill: '--metal' }],
    nodes: { q: [0.62, 0.55], v: [0.80, 0.55] }, dots: ['q', 'v'],
    parts: [{ type: 'res', a: 'n:q', b: 'n:v', label: '4.7 kΩ' }],
    wires: [
      { a: 'ds:VDD', b: 'n:v', c: '--wire-r', note: 'alimentación (cable rojo)' },
      { a: 'n:v', b: 'esp:3V3', c: '--wire-r', note: '3.3 V' },
      { a: 'ds:DQ', b: 'n:q', c: '--wire-y', note: 'datos 1-Wire (cable amarillo)' },
      { a: 'n:q', b: 'esp:D4', c: '--wire-y', note: 'datos → GPIO 4' },
      { a: 'ds:GND', b: 'esp:GNDR', c: '--wire-k', note: 'tierra (cable negro)' }
    ],
    labels: [{ text: 'resistencia de pull-up entre DQ y 3.3 V', fx: 0.52, fy: 0.65, size: 11 }]
  });

  /* ---------- Bus I²C ---------- */
  MC.defineSim('i2c-bus', function (sim) {
    const cv = sim.canvas({ aspect: 1.6, label: 'Bus I²C y transacción' });
    let scan = null;
    sim.group('Módulos conectados');
    sim.check('mpu', { label: 'MPU6050', value: true });
    sim.seg('ad0', { label: 'Pin AD0 del MPU6050', options: [['0', 'BAJO (0x68)'], ['1', 'ALTO (0x69)']], value: '0' });
    sim.check('mpu2', { label: 'Un segundo MPU6050 (AD0 en bajo)', value: false });
    sim.check('bmp', { label: 'BMP280', value: true });
    sim.seg('sdo', { label: 'Pin SDO del BMP280', options: [['0', 'BAJO (0x76)'], ['1', 'ALTO (0x77)']], value: '0' });
    sim.check('ina', { label: 'INA219 (0x40)', value: false });
    sim.check('bh', { label: 'BH1750, luz (0x23)', value: false });
    sim.button('Escanear el bus', () => { scan = devices(); sim.redraw(); }, { primary: true });
    sim.select('tx', { label: 'Transacción a mostrar', options: [['mpu', 'Leer WHO_AM_I del MPU6050'], ['bmp', 'Leer el ID del BMP280']], value: 'mpu' });
    const res = sim.note('');
    const devices = () => {
      const d = [];
      if (sim.p.mpu) d.push(['MPU6050', sim.p.ad0 === '1' ? 0x69 : 0x68]);
      if (sim.p.mpu2) d.push(['MPU6050 n.º 2', 0x68]);
      if (sim.p.bmp) d.push(['BMP280', sim.p.sdo === '1' ? 0x77 : 0x76]);
      if (sim.p.ina) d.push(['INA219', 0x40]);
      if (sim.p.bh) d.push(['BH1750', 0x23]);
      return d;
    };
    sim.onChange = () => { scan = null; };
    const hex = (n) => '0x' + n.toString(16).toUpperCase().padStart(2, '0');
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const Wd = cv.w, H = cv.h;
      const devs = devices();
      /* diagrama del bus */
      const y1 = H * 0.12, y2 = H * 0.2, x0 = Wd * 0.18, x1 = Wd * 0.97;
      D.module(ctx, 10, y1 - 22, Wd * 0.13, 64, 'ESP32', { fill: '--pcb' });
      D.line(ctx, Wd * 0.13 + 10, y1, x1, y1, { color: '--wire-b', width: 2.4 });
      D.line(ctx, Wd * 0.13 + 10, y2, x1, y2, { color: '--wire-y', width: 2.4 });
      MC.text(ctx, 'SDA (21)', x0 - 4, y1 - 6, { size: 11, color: '--wire-b', weight: 700 });
      MC.text(ctx, 'SCL (22)', x0 - 4, y2 + 14, { size: 11, color: '--wire-y', weight: 700 });
      const count = {};
      devs.forEach(([, a]) => { count[a] = (count[a] || 0) + 1; });
      const n = Math.max(1, devs.length), dw = (x1 - x0 - 10) / n;
      devs.forEach(([name, a], i) => {
        const x = x0 + 20 + i * dw, bw = Math.min(dw - 14, 120);
        D.line(ctx, x + bw * 0.35, y1, x + bw * 0.35, y2 + 32, { color: '--wire-b', width: 1.8 });
        D.line(ctx, x + bw * 0.65, y2, x + bw * 0.65, y2 + 32, { color: '--wire-y', width: 1.8 });
        D.module(ctx, x, y2 + 32, bw, 46, `${name}`, { fill: count[a] > 1 ? '--c2' : '--pcb-2', size: 10 });
        MC.text(ctx, hex(a), x + bw / 2, y2 + 94, { size: 12, mono: true, align: 'center', color: count[a] > 1 ? '--c2' : '--ink', weight: 700 });
      });
      if (!devs.length) MC.text(ctx, 'Ningún módulo conectado', (x0 + x1) / 2, y2 + 60, { size: 13, align: 'center', color: '--ink-3' });
      /* resultado del escaneo */
      if (scan) {
        const found = Array.from(new Set(scan.map((d) => d[1]))).sort((a, b) => a - b);
        const dup = found.filter((a) => scan.filter((d) => d[1] === a).length > 1);
        res.innerHTML = '<b>Monitor Serie:</b><br><span style="font-family:var(--font-mono);font-size:12px">Escaneando...<br>' + (found.length ? found.map((a) => `Dispositivo I2C en ${hex(a)}`).join('<br>') : 'No se encontraron dispositivos') + `<br>Listo: ${found.length} dispositivo(s)</span>` + (dup.length ? `<br><span style="color:var(--warn-ink)">Dos módulos responden en ${dup.map(hex).join(', ')}: chocan y el escáner sólo ve uno. Las lecturas saldrán mezcladas.</span>` : '');
      } else res.innerHTML = 'Pulse «Escanear el bus».';
      /* transacción */
      const target = sim.p.tx === 'mpu' ? [sim.p.ad0 === '1' ? 0x69 : 0x68, 0x68, sim.p.mpu] : [sim.p.sdo === '1' ? 0x77 : 0x76, 0x58, sim.p.bmp];
      const [addr, val, present] = target;
      const bits = [];
      for (let i = 6; i >= 0; i--) bits.push(['A' + i, (addr >> i) & 1]);
      bits.push(['R', 1]);
      bits.push(['ACK', present ? 0 : 1]);
      for (let i = 7; i >= 0; i--) bits.push(['D' + i, present ? (val >> i) & 1 : 1]);
      bits.push(['NACK', 1]);
      const ty = H * 0.62, th = H * 0.1, tx0 = Wd * 0.08, tw = (Wd * 0.9) / (bits.length + 2);
      MC.text(ctx, `Lectura de ${hex(addr)}: inicio · dirección (7 bits) · R/W · ACK · dato · NACK · fin`, tx0, ty - th * 1.4, { size: 12, color: '--ink-2', weight: 600 });
      MC.text(ctx, 'SCL', tx0 - 8, ty + th * 0.5, { size: 11, align: 'right', color: '--wire-y', weight: 700 });
      MC.text(ctx, 'SDA', tx0 - 8, ty + th * 2.1, { size: 11, align: 'right', color: '--wire-b', weight: 700 });
      const sclY = (v) => ty + (v ? 0 : th), sdaY = (v) => ty + th * 1.6 + (v ? 0 : th);
      ctx.save(); ctx.lineWidth = 2;
      ctx.strokeStyle = MC.col('--wire-y'); ctx.beginPath(); ctx.moveTo(tx0, sclY(1)); ctx.lineTo(tx0 + tw * 0.8, sclY(1));
      bits.forEach((_, i) => { const x = tx0 + tw * (i + 1); ctx.lineTo(x, sclY(1)); ctx.lineTo(x, sclY(0)); ctx.lineTo(x + tw * 0.25, sclY(0)); ctx.lineTo(x + tw * 0.25, sclY(1)); ctx.lineTo(x + tw * 0.75, sclY(1)); ctx.lineTo(x + tw * 0.75, sclY(0)); ctx.lineTo(x + tw, sclY(0)); });
      ctx.lineTo(tx0 + tw * (bits.length + 1), sclY(0)); ctx.lineTo(tx0 + tw * (bits.length + 1.2), sclY(1)); ctx.lineTo(tx0 + tw * (bits.length + 2), sclY(1));
      ctx.stroke();
      ctx.strokeStyle = MC.col('--wire-b'); ctx.beginPath(); ctx.moveTo(tx0, sdaY(1)); ctx.lineTo(tx0 + tw * 0.5, sdaY(1)); ctx.lineTo(tx0 + tw * 0.6, sdaY(0));
      let prev = 0;
      bits.forEach(([, v], i) => { const x = tx0 + tw * (i + 1) + tw * 0.1; ctx.lineTo(x, sdaY(prev)); ctx.lineTo(x + tw * 0.05, sdaY(v)); prev = v; });
      ctx.lineTo(tx0 + tw * (bits.length + 1.1), sdaY(prev)); ctx.lineTo(tx0 + tw * (bits.length + 1.15), sdaY(0)); ctx.lineTo(tx0 + tw * (bits.length + 1.5), sdaY(0)); ctx.lineTo(tx0 + tw * (bits.length + 1.6), sdaY(1)); ctx.lineTo(tx0 + tw * (bits.length + 2), sdaY(1));
      ctx.stroke(); ctx.restore();
      bits.forEach(([lab, v], i) => {
        const x = tx0 + tw * (i + 1.5);
        const isAck = lab === 'ACK' || lab === 'NACK';
        MC.text(ctx, lab, x, sdaY(0) + 16, { size: 9.5, align: 'center', mono: true, color: isAck ? (v ? '--c2' : '--c3') : lab === 'R' ? '--c5' : '--ink-3' });
        MC.text(ctx, String(v), x, ty + th * 1.32, { size: 10, align: 'center', mono: true, color: '--ink-2' });
      });
      MC.text(ctx, 'inicio', tx0 + tw * 0.4, sdaY(0) + 30, { size: 10, align: 'center', color: '--c3' });
      MC.text(ctx, 'fin', tx0 + tw * (bits.length + 1.4), sdaY(0) + 30, { size: 10, align: 'center', color: '--c3' });
      MC.text(ctx, present ? `El módulo responde con ACK (SDA en bajo) y envía ${hex(val)}.` : 'Nadie responde: el ACK queda en alto (NACK). La librería informará que no encuentra el sensor.', tx0, H - 12, { size: 12, color: present ? '--c3' : '--warn-ink', weight: 600 });
    });
  });

  /* ---------- Ultrasonido ---------- */
  MC.defineSim('ultrasonido', function (sim) {
    const cv = sim.canvas({ aspect: 1.45, label: 'Pulso ultrasónico y diagrama de tiempos' });
    let tw = 0, tEcho = NaN;
    sim.group('Escena');
    sim.slider('d', { label: 'Distancia al objeto', min: 1, max: 450, step: 0.5, value: 50, unit: 'cm', fmt: (v) => MC.fix(v, 1) });
    sim.slider('tilt', { label: 'Inclinación del objeto', min: 0, max: 45, step: 1, value: 0, unit: '°', fmt: (v) => String(Math.round(v)) });
    sim.slider('T', { label: 'Temperatura real del aire', min: 0, max: 40, step: 0.5, value: 19, unit: '°C', fmt: (v) => MC.fix(v, 1) });
    sim.group('Programa');
    sim.slider('Tp', { label: 'Temperatura que supone el programa', min: 0, max: 40, step: 0.5, value: 20, unit: '°C', fmt: (v) => MC.fix(v, 1) });
    sim.out('v', 'Rapidez real del sonido');
    sim.out('te', 'Tiempo de eco');
    sim.out('dm', 'Distancia calculada', { hl: true });
    sim.out('err', 'Error');
    sim.animate((dt) => { tw += dt; }, { button: false });
    sim.onDraw(() => {
      const d = sim.p.d / 100, T = sim.p.T, vr = 331.3 + 0.606 * T, vp = 331.3 + 0.606 * sim.p.Tp;
      const ok = sim.p.d >= 2 && sim.p.d <= 400 && sim.p.tilt <= 18;
      tEcho = (2 * d) / vr;
      const dm = ok ? (vp * tEcho) / 2 : NaN;
      sim.set('v', MC.fix(vr, 1) + ' m/s');
      sim.set('te', ok ? MC.fix(tEcho * 1e6, 0) + ' µs' : sim.p.d > 400 ? 'sin eco (fuera de alcance)' : sim.p.d < 2 ? 'demasiado cerca' : 'sin eco (rebota hacia un lado)');
      sim.set('dm', ok ? MC.fix(dm * 100, 2) + ' cm' : '— (pulseIn devuelve 0)');
      sim.set('err', ok ? MC.fix((dm - d) * 1000, 1) + ' mm (' + MC.fix((100 * (dm - d)) / d, 2) + ' %)' : '—');
      const ctx = cv.ctx;
      D.clear(cv);
      const Wd = cv.w, H = cv.h, h1 = H * 0.5;
      /* escena */
      const sx = 40, sy = h1 * 0.5;
      const scale = (Wd - 120) / 4.6;
      const tx = sx + 30 + d * scale;
      D.module(ctx, sx - 30, sy - 26, 34, 52, '', { fill: '--pcb-2' });
      D.circle(ctx, sx - 13, sy - 12, 9, { fill: '--metal', color: '--ink-2' });
      D.circle(ctx, sx - 13, sy + 12, 9, { fill: '--metal', color: '--ink-2' });
      ctx.save();
      ctx.strokeStyle = MC.alpha('--c1', 0.3); ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4.5 * scale, sy - Math.tan(M.rad(7.5)) * 4.5 * scale); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4.5 * scale, sy + Math.tan(M.rad(7.5)) * 4.5 * scale); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(tx, sy); ctx.rotate(M.rad(sim.p.tilt)); ctx.fillStyle = MC.col('--body-a'); ctx.fillRect(-6, -h1 * 0.32, 12, h1 * 0.64); ctx.restore();
      /* frente de onda animado */
      const period = Math.max(0.6, tEcho * 600);
      const ph = (tw % period) / period;
      const path = ok ? 2 * d : 2 * Math.min(d, 4.5);
      const s = ph * path * 1.05;
      if (s < Math.min(d, 4.6)) { ctx.strokeStyle = MC.col('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, s * scale, -0.13, 0.13); ctx.stroke(); }
      else if (ok && s < 2 * d) { const back = 2 * d - s; ctx.strokeStyle = MC.col('--c4'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx, sy, (d - back) * scale, Math.PI - 0.13, Math.PI + 0.13); ctx.stroke(); }
      D.dim(ctx, sx, sy + h1 * 0.4, tx, sy + h1 * 0.4, MC.fix(sim.p.d, 1) + ' cm', { color: '--ink-3' });
      /* diagrama de tiempos */
      const tmax = Math.max(1.5e-3, (ok ? tEcho : 0.03) * 1.25);
      const P = new MC.Plot(ctx, { x: 0, y: h1, w: Wd, h: H - h1, xmin: 0, xmax: tmax * 1e6, ymin: 0, ymax: 3.4, xlabel: ['t', 'µs'], ylabel: '', yticks: [], mt: 12 });
      P.frame();
      const lane = (y0, pts, col, lab) => { P.xy(pts.map((p) => p[0]), pts.map((p) => y0 + p[1] * 0.7), { color: col, width: 2 }); MC.text(ctx, lab, P.ix + 4, P.Y(y0 + 0.85), { size: 11, color: col, weight: 700 }); };
      lane(2.4, [[0, 0], [5, 0], [5, 1], [15, 1], [15, 0], [tmax * 1e6, 0]], '--c3', 'Trig (10 µs)');
      const bx = [], by = [];
      for (let i = 0; i <= 160; i++) { const t = 20 + (i / 160) * 200; bx.push(t); by.push(1.6 + 0.25 * Math.sin(2 * Math.PI * 40000 * t * 1e-6)); }
      P.xy(bx, by, { color: '--c1', width: 1 });
      MC.text(ctx, 'ráfaga de 40 kHz (8 ciclos)', P.X(240) + 4, P.Y(1.6), { size: 10.5, color: '--c1', baseline: 'middle' });
      const e0 = 240, e1 = e0 + (ok ? tEcho * 1e6 : 30000);
      lane(0.15, [[0, 0], [e0, 0], [e0, 1], [Math.min(e1, tmax * 1e6), 1], [Math.min(e1, tmax * 1e6), ok ? 0 : 1], [tmax * 1e6, ok ? 0 : 1]], '--c4', 'Echo');
      if (ok) P.label((e0 + e1) / 2, 1.0, `t = ${MC.fix(tEcho * 1e6, 0)} µs`, { align: 'center', color: '--c4', mono: true });
    });
  });

  /* ---------- Celda de carga ---------- */
  MC.defineSim('celda-carga', function (sim) {
    sim.cols2('1fr 1.5fr');
    const cs = sim.canvas({ aspect: 0.95, label: 'Celda de carga' });
    const cg = sim.canvas({ aspect: 1.45, label: 'Lectura en el tiempo' });
    const hist = new MC.History(['y'], { minDt: 0.2, max: 4000 });
    const K = 422.4 * (1 + M.gauss(0, 0.03)), OFF0 = 84210 + Math.round(M.gauss(0, 3000));
    let tare = null, fac = null, mPrev = 0, tChange = 0;
    sim.group('Carga');
    sim.select('m', { label: 'Masa sobre la celda', options: [['0', 'Nada'], ['50', '50 g'], ['100', '100 g'], ['200', '200 g (patrón)'], ['500', '500 g'], ['1000', '1000 g'], ['1200', '1200 g (sobrecarga)']], value: '0' });
    sim.slider('T', { label: 'Temperatura ambiente', min: 15, max: 30, step: 0.5, value: 20, unit: '°C', fmt: (v) => MC.fix(v, 1) });
    sim.group('Calibración');
    sim.button('Tarar (cero)', () => { tare = raw(true); msg.innerHTML = sim.p.m === '0' ? 'Cero guardado.' : 'Ojo: taró con masa encima; esa masa será el nuevo «cero».'; });
    sim.button('Calibrar con 200 g', () => {
      if (tare === null) { msg.innerHTML = 'Primero tare sin carga.'; return; }
      if (sim.p.m !== '200') { msg.innerHTML = 'Ponga la masa patrón de 200 g antes de calibrar.'; return; }
      fac = (raw(true) - tare) / 200; msg.innerHTML = `Factor: ${MC.fix(fac, 2)} cuentas/g`;
    });
    const msg = sim.note('Sin calibrar: la lectura está en cuentas del convertidor.');
    sim.out('raw', 'Lectura cruda (cuentas)');
    sim.out('g', 'Masa indicada', { hl: true });
    sim.out('fac', 'Factor de escala');
    sim.onChange = (id) => { if (id === 'm') { mPrev = +sim.p.m; tChange = sim.t; } };
    function raw(avg) {
      const m = Math.min(+sim.p.m, 1100);
      const creep = m * 0.0004 * (1 - Math.exp(-(sim.t - tChange) / 60));
      const drift = (sim.p.T - 20) * 160;
      const noise = avg ? M.gauss(0, 3) : M.gauss(0, 12);
      return OFF0 + drift + K * (m + creep) + noise;
    }
    sim.run({
      h: 0.2, timeScale: 6, speed: 1, autoplay: true,
      reset() { hist.clear(); },
      step() {
        const r = raw(false);
        const y = tare !== null && fac ? (r - tare) / fac : tare !== null ? r - tare : r;
        hist.push(sim.t, { y });
      },
      timeFmt: (t) => 't = ' + MC.fix(t / 60, 1) + ' min'
    });
    sim.onDraw(() => {
      const r = raw(true);
      sim.set('raw', MC.fix(r, 0));
      sim.set('g', fac ? MC.fix((r - tare) / fac, 2) + ' g' : '— (falta calibrar)');
      sim.set('fac', fac ? MC.fix(fac, 2) + ' cuentas/g' : '—');
      const ctx = cs.ctx;
      D.clear(cs);
      const Wd = cs.w, H = cs.h;
      const m = +sim.p.m;
      const bend = Math.min(1.2, m / 1000) * 6;
      const y = H * 0.38;
      ctx.fillStyle = MC.col('--lego-gray'); ctx.fillRect(Wd * 0.06, y - 10, Wd * 0.14, 60);
      ctx.save(); ctx.fillStyle = MC.col('--metal');
      ctx.beginPath(); ctx.moveTo(Wd * 0.18, y); ctx.lineTo(Wd * 0.82, y + bend); ctx.lineTo(Wd * 0.82, y + 26 + bend); ctx.lineTo(Wd * 0.18, y + 26); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = MC.col('--ink-3'); ctx.stroke(); ctx.restore();
      for (const gx of [0.38, 0.62]) { ctx.fillStyle = MC.col('--c4'); ctx.fillRect(Wd * gx - 8, y - 3 + bend * (gx - 0.18) / 0.64, 16, 4); }
      if (m > 0) D.block(ctx, Wd * 0.74, y - 18 + bend, Math.min(80, 30 + m / 20), 34, { fill: '--body-a', label: m + ' g', size: 12 });
      MC.text(ctx, 'galgas', Wd * 0.5, y + 46, { size: 11, align: 'center', color: '--c4' });
      if (m > 1000) MC.text(ctx, '¡Sobrecarga! Puede deformarse para siempre', Wd / 2, H - 40, { size: 12, align: 'center', color: '--warn-ink', weight: 700 });
      MC.text(ctx, 'puente de Wheatstone → HX711 (24 bits)', Wd / 2, H - 16, { size: 11.5, align: 'center', color: '--ink-2' });
      const c2 = cg.ctx;
      D.clear(cg);
      const T = hist.d.t, ys = hist.d.y;
      const tN = T.length ? T[T.length - 1] : 0;
      const [lo, hi] = ys.length ? MC.niceRange(Math.min(...ys), Math.max(...ys), { zero: false, minSpan: fac ? 1 : 2000 }) : [0, 1];
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: Math.max(0, tN - 600), xmax: Math.max(600, tN), ymin: lo, ymax: hi, xlabel: ['t', 's'], ylabel: fac ? ['m', 'g'] : 'cuentas', mt: 26, title: fac ? 'Masa indicada' : tare !== null ? 'Cuentas sobre el cero' : 'Cuentas crudas del HX711' });
      P.frame();
      P.xy(T, ys, { color: '--c1', width: 1.4 });
    });
  });

  /* ---------- Sensor Hall frente a magnetómetro ---------- */
  const MAGS = { d10x3: ['Disco 10 × 3 mm', 0.005, 0.003], c10x10: ['Cilindro 10 × 10 mm', 0.005, 0.010], d20x5: ['Disco 20 × 5 mm', 0.010, 0.005] };
  MC.defineSim('hall', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, label: 'Campo del imán contra la distancia' });
    const Br = 1.25;
    const Bax = (z, R, Lm) => (Br / 2) * ((z + Lm) / Math.hypot(z + Lm, R) - z / Math.hypot(z, R));
    sim.group('Imán de neodimio (N35–N42)');
    sim.select('mag', { options: Object.keys(MAGS).map((k) => [k, MAGS[k][0]]), value: 'd10x3' });
    sim.slider('z', { label: 'Distancia sensor–cara del imán', min: 0.1, max: 20, step: 0.05, value: 3, unit: 'cm', log: true, fmt: (v) => MC.fix(v, 2) });
    sim.out('B', 'Campo en el eje', { hl: true });
    sim.out('Bd', 'Aproximación de dipolo');
    sim.out('vh', 'Salida del SS49E');
    sim.out('ph', 'Magnetómetro del celular');
    sim.onDraw(() => {
      const [, R, Lm] = MAGS[sim.p.mag];
      const mom = (Br / (4e-7 * Math.PI)) * Math.PI * R * R * Lm;
      const z = sim.p.z / 100;
      const B = Bax(z, R, Lm), Bd = (2e-7 * mom) / Math.pow(z + Lm / 2, 3);
      const vh = M.clamp(1.65 + 9.2 * B * 1000 / 1000, 0.15, 3.15);
      sim.set('B', MC.si(B, 'T'));
      sim.set('Bd', MC.si(Bd, 'T') + ` (m = ${MC.fix(mom, 3)} A·m²)`);
      sim.set('vh', MC.fix(vh, 3) + ' V' + (vh >= 3.15 || vh <= 0.15 ? ' (saturado)' : B < 5e-4 ? ' (casi no cambia)' : ''));
      sim.set('ph', B > 4.9e-3 ? 'saturado (> 4.9 mT)' : MC.fix(B * 1e6, 1) + ' µT');
      const ctx = cv.ctx;
      D.clear(cv);
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 20, ymin: 1e-6, ymax: 1, xlog: true, ylog: true, xlabel: ['z', 'cm'], ylabel: ['B', 'T'], mt: 14 });
      P.frame();
      P.clip((c) => {
        const band = (b0, b1, col, lab) => { const ya = P.Y(b1), yb = P.Y(b0); c.fillStyle = MC.alpha(col, 0.12); c.fillRect(P.ix, ya, P.iw, yb - ya); MC.text(c, lab, P.ix + P.iw - 6, ya + 14, { size: 11, align: 'right', color: col, weight: 700 }); };
        band(2e-3, 0.1, '--c4', 'rango útil del sensor Hall SS49E');
        band(3e-7, 4.9e-3, '--c1', 'rango del magnetómetro del celular');
      });
      P.hline(29.1e-6, { color: '--c3', label: 'campo terrestre en Popayán (29 µT)', labelRight: true });
      P.fn((zc) => Bax(zc / 100, R, Lm), { color: '--Bfield', width: 2.4 });
      P.fn((zc) => (2e-7 * mom) / Math.pow(zc / 100 + Lm / 2, 3), { color: '--ink-3', width: 1.4, dash: [5, 4] });
      P.dot(sim.p.z, B, { color: '--accent', label: MC.si(B, 'T') });
      P.legend([{ label: 'campo exacto en el eje', color: '--Bfield' }, { label: 'dipolo: μ₀m/(2πz³)', color: '--ink-3', dash: [5, 4] }], 'bl');
    });
  });

  /* ---------- Fotocompuerta ---------- */
  MC.defineSim('fotocompuerta', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, label: 'Haz, bandera y señales' });
    sim.group('Objeto');
    sim.slider('w', { label: 'Ancho de la bandera', min: 0.5, max: 24, step: 0.1, value: 8, unit: 'mm', fmt: (v) => MC.fix(v, 1) });
    sim.slider('v', { label: 'Rapidez', min: 0.05, max: 3, step: 0.01, value: 0.8, unit: 'm/s', fmt: (v) => MC.fix(v, 2) });
    sim.group('Fotocompuerta');
    sim.slider('wb', { label: 'Ancho efectivo del haz', min: 0.2, max: 4, step: 0.1, value: 1.5, unit: 'mm', fmt: (v) => MC.fix(v, 1) });
    sim.slider('thr', { label: 'Umbral del comparador', min: 5, max: 95, step: 1, value: 50, unit: '%', fmt: (v) => String(Math.round(v)) });
    sim.out('tt', 'Tiempo de bloqueo real <i>w</i>/<i>v</i>');
    sim.out('tm', 'Tiempo medido');
    sim.out('vm', 'Rapidez calculada', { hl: true });
    sim.out('err', 'Error');
    sim.onDraw(() => {
      const w = sim.p.w / 1000, v = sim.p.v, wb = sim.p.wb / 1000, thr = sim.p.thr / 100;
      /* posición del borde delantero: x(t) = v t − ...; fracción del haz tapada */
      const covered = (x) => {
        /* bandera ocupa [x − w, x]; haz gaussiano centrado en 0 con σ = wb/2.5 */
        const s = wb / 2.5;
        const Phi = (u) => 0.5 * (1 + erf(u / (s * Math.SQRT2)));
        return Phi(x) - Phi(x - w);
      };
      const tTot = (w + 4 * wb + 0.01) / v;
      const ts = [], an = [], dg = [];
      let tOn = NaN, tOff = NaN, prev = 0;
      for (let i = 0; i <= 800; i++) {
        const t = (i / 800) * tTot;
        const x = v * t - 2 * wb - 0.005 + w / 2 + 0.002;
        const tr = 1 - covered(x);
        const V = 0.2 + 2.9 * tr;
        const blocked = tr < 1 - thr ? 1 : 0;
        ts.push(t * 1000); an.push(V); dg.push(blocked ? 0.2 : 3.1);
        if (blocked && !prev && isNaN(tOn)) tOn = t;
        if (!blocked && prev && isNaN(tOff)) tOff = t;
        prev = blocked;
      }
      const tm = tOff - tOn;
      sim.set('tt', MC.fix((w / v) * 1000, 3) + ' ms');
      sim.set('tm', isFinite(tm) ? MC.fix(tm * 1000, 3) + ' ms' : 'no se detecta');
      sim.set('vm', isFinite(tm) ? MC.fix(w / tm, 3) + ' m/s' : '—');
      sim.set('err', isFinite(tm) ? MC.fix((100 * (w / tm - v)) / v, 1) + ' %' : '—');
      const ctx = cv.ctx;
      D.clear(cv);
      const Wd = cv.w, H = cv.h, h1 = H * 0.36;
      /* vista superior: ranura con haz y bandera */
      const s = (Wd * 0.6) / Math.max(0.03, w + 4 * wb + 0.01);
      const cx = Wd / 2, cy = h1 * 0.55;
      ctx.fillStyle = MC.col('--chip'); ctx.fillRect(cx - 40, 8, 80, h1 * 0.22); ctx.fillRect(cx - 40, h1 * 0.78, 80, h1 * 0.2);
      ctx.fillStyle = MC.alpha('--c2', 0.25); ctx.fillRect(cx - (wb * s) / 2, 8 + h1 * 0.22, wb * s, h1 * 0.56);
      MC.text(ctx, 'emisor IR', cx + 46, 18, { size: 10.5, color: '--ink-3' });
      MC.text(ctx, 'fototransistor', cx + 46, h1 * 0.92, { size: 10.5, color: '--ink-3' });
      const tNow = (performance.now() / 1000) % 2.2 / 2 * tTot;
      const xb = v * tNow - 2 * wb - 0.005 + w / 2 + 0.002;
      ctx.fillStyle = MC.col('--lego-red'); ctx.fillRect(cx + (xb - w) * s, cy - 10, w * s, 20);
      D.arrow(ctx, cx + xb * s + 6, cy, cx + xb * s + 30, cy, { color: '--vel', width: 2 });
      /* señales */
      const P = new MC.Plot(ctx, { x: 0, y: h1, w: Wd, h: H - h1, xmin: 0, xmax: tTot * 1000, ymin: 0, ymax: 3.5, xlabel: ['t', 'ms'], ylabel: ['V', 'V'], mt: 10 });
      P.frame();
      P.hline(0.2 + 2.9 * (1 - thr), { color: '--accent', label: 'umbral', labelRight: true });
      P.xy(ts, an, { color: '--c1', width: 2 });
      P.xy(ts, dg, { color: '--c4', width: 1.6, dash: [5, 3] });
      if (isFinite(tOn)) { P.vline(tOn * 1000, { color: '--c3' }); P.vline(tOff * 1000, { color: '--c3' }); }
      P.legend([{ label: 'salida analógica del fototransistor', color: '--c1' }, { label: 'salida digital (comparador)', color: '--c4', dash: [5, 3] }], 'br');
    });
    sim.animate(() => {}, { button: false });
    function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  });
})();
