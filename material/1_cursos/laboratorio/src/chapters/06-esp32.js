/* Capítulo 6 · La placa ESP32: primeros pasos */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const el = MC.el;

  /* ---------- Mapa de pines ---------- */
  const PIN = {
    EN: { cat: 'pwr', f: ['Reinicio (activo en bajo)'], n: 'Conectado al botón EN. No lo use como pin de señal.' },
    VP: { g: 36, cat: 'in', f: ['ADC1_CH0', 'Sólo entrada'], n: 'Sin resistencias internas de pull-up/pull-down.' },
    VN: { g: 39, cat: 'in', f: ['ADC1_CH3', 'Sólo entrada'], n: 'Sin resistencias internas de pull-up/pull-down.' },
    D34: { g: 34, cat: 'in', f: ['ADC1_CH6', 'Sólo entrada'], n: 'Excelente para leer voltajes, aun con Wi-Fi.' },
    D35: { g: 35, cat: 'in', f: ['ADC1_CH7', 'Sólo entrada'], n: 'Excelente para leer voltajes, aun con Wi-Fi.' },
    D32: { g: 32, cat: 'ok', f: ['ADC1_CH4', 'Táctil T9', 'PWM', 'E/S digital'], n: 'Pin todo terreno.' },
    D33: { g: 33, cat: 'ok', f: ['ADC1_CH5', 'Táctil T8', 'PWM', 'E/S digital'], n: 'Pin todo terreno.' },
    D25: { g: 25, cat: 'ok', f: ['DAC1', 'ADC2_CH8', 'PWM', 'E/S digital'], n: 'Salida analógica de 8 bits con dacWrite(25, valor). ADC2 no funciona con Wi-Fi.' },
    D26: { g: 26, cat: 'ok', f: ['DAC2', 'ADC2_CH9', 'PWM', 'E/S digital'], n: 'Salida analógica con dacWrite(26, valor). ADC2 no funciona con Wi-Fi.' },
    D27: { g: 27, cat: 'ok', f: ['ADC2_CH7', 'Táctil T7', 'PWM', 'E/S digital'], n: 'Buena opción para fotocompuertas e interrupciones.' },
    D14: { g: 14, cat: 'warn', f: ['ADC2_CH6', 'Táctil T6', 'PWM', 'E/S digital'], n: 'Emite pulsos durante el arranque: no lo use para algo que no deba moverse al encender.' },
    D12: { g: 12, cat: 'strap', f: ['ADC2_CH5', 'Táctil T5', 'E/S digital'], n: 'Pin de arranque: si está en ALTO al encender, la placa no arranca. Evítelo o asegúrese de que esté en BAJO.' },
    D13: { g: 13, cat: 'ok', f: ['ADC2_CH4', 'Táctil T4', 'PWM', 'E/S digital'], n: 'Seguro para salidas y entradas digitales.' },
    GND: { cat: 'pwr', f: ['Tierra (0 V)'], n: 'Todas las tierras del circuito deben unirse aquí.' },
    VIN: { cat: 'pwr', f: ['Entrada de 5 V (o salida de los 5 V del USB)'], n: 'Con USB conectado entrega unos 4.7 V. Como entrada, entre 5 y 9 V.' },
    D23: { g: 23, cat: 'ok', f: ['SPI MOSI', 'PWM', 'E/S digital'], n: 'Seguro.' },
    D22: { g: 22, cat: 'ok', f: ['I²C SCL', 'PWM', 'E/S digital'], n: 'Reloj del bus I²C por defecto (Wire).' },
    TX0: { g: 1, cat: 'serial', f: ['UART0 TX (USB)'], n: 'Lo usa el puerto serie del USB. No lo conecte a nada.' },
    RX0: { g: 3, cat: 'serial', f: ['UART0 RX (USB)'], n: 'Lo usa el puerto serie del USB. No lo conecte a nada.' },
    D21: { g: 21, cat: 'ok', f: ['I²C SDA', 'PWM', 'E/S digital'], n: 'Datos del bus I²C por defecto (Wire).' },
    D19: { g: 19, cat: 'ok', f: ['SPI MISO', 'PWM', 'E/S digital'], n: 'Seguro.' },
    D18: { g: 18, cat: 'ok', f: ['SPI SCK', 'PWM', 'E/S digital'], n: 'Seguro.' },
    D5: { g: 5, cat: 'warn', f: ['SPI CS', 'PWM', 'E/S digital'], n: 'Pin de arranque: emite pulsos al encender. Sirve como salida común.' },
    TX2: { g: 17, cat: 'ok', f: ['UART2 TX', 'PWM', 'E/S digital'], n: 'Segundo puerto serie, o pin común.' },
    RX2: { g: 16, cat: 'ok', f: ['UART2 RX', 'PWM', 'E/S digital'], n: 'Segundo puerto serie, o pin común.' },
    D4: { g: 4, cat: 'ok', f: ['ADC2_CH0', 'Táctil T0', 'PWM', 'E/S digital'], n: 'Seguro para entradas y salidas.' },
    D2: { g: 2, cat: 'strap', f: ['LED azul integrado', 'ADC2_CH2', 'Táctil T2', 'PWM'], n: 'Pin de arranque: debe estar libre o en BAJO al subir programas. Tiene el LED de la placa.' },
    D15: { g: 15, cat: 'strap', f: ['ADC2_CH3', 'Táctil T3', 'PWM', 'E/S digital'], n: 'Pin de arranque: en BAJO silencia los mensajes de inicio. Úselo con cuidado.' },
    '3V3': { cat: 'pwr', f: ['Salida de 3.3 V regulados'], n: 'Para alimentar sensores de 3.3 V. Unos 300–500 mA disponibles en total.' }
  };
  const CATC = { ok: '--c3', in: '--c1', strap: '--c4', warn: '--wire-y', pwr: '--c2', serial: '--c6' };
  const CATN = { ok: 'Seguro para casi todo', in: 'Sólo entrada', strap: 'Pin de arranque (cuidado)', warn: 'Pulsos al encender', pwr: 'Alimentación / control', serial: 'Reservado para el USB' };
  const FILT = {
    all: ['Todos', () => true], adc1: ['ADC1 (sirve con Wi-Fi)', (p) => p.f.some((s) => s.startsWith('ADC1'))], adc2: ['ADC2 (no con Wi-Fi)', (p) => p.f.some((s) => s.startsWith('ADC2'))],
    touch: ['Táctiles', (p) => p.f.some((s) => s.startsWith('Táctil'))], i2c: ['Bus I²C', (p) => p.f.some((s) => s.startsWith('I²C'))], dac: ['DAC', (p) => p.f.some((s) => s.startsWith('DAC'))],
    out: ['Seguros para salidas', (p) => p.cat === 'ok']
  };
  MC.defineSim('pinout', function (sim) {
    const cv = sim.canvas({ aspect: 1.15, label: 'Placa ESP32 con sus pines' });
    let sel = 'D27', geo = null;
    sim.group('Filtrar por función');
    sim.select('filt', { options: Object.keys(FILT).map((k) => [k, FILT[k][0]]), value: 'all' });
    sim.group('Pin seleccionado');
    const info = sim.note('');
    sim.outSep('Código de colores');
    for (const k of Object.keys(CATN)) sim.out('c_' + k, `<span style="color:var(${CATC[k]});font-size:16px">●</span> ${CATN[k]}`);
    MC.pointer(cv, {
      down: (x, y) => { if (!geo) return null; let best = null, bd = 18; for (const k in geo.pins) { const p = geo.pins[k]; const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = k; } } if (best) { sel = best.replace(/GND[LR]/, 'GND'); sim.redraw(); } return null; },
      hover: (x, y) => geo && Object.values(geo.pins).some((p) => Math.hypot(p[0] - x, p[1] - y) < 18) ? 'pointer' : false,
      touch: 'pan-y'
    });
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const bw = Math.min(cv.w * 0.42, cv.h * 0.47);
      const bx = (cv.w - bw) / 2, by = (cv.h - bw * 2) / 2;
      const f = FILT[sim.p.filt][1];
      const hl = Object.keys(PIN).filter((k) => f(PIN[k]) && sim.p.filt !== 'all');
      geo = D.esp32(ctx, bx, by, bw, { hl: hl.concat([sel]), led: sel === 'D2' });
      for (const k in geo.pins) {
        const key = k.replace(/GND[LR]/, 'GND');
        const P = PIN[key];
        if (!P || /GND[LR]/.test(k) === false && k === 'GND') continue;
        const p = geo.pins[k];
        const isL = MC.ESP32_PINS.L.some((n) => n.split('·')[0] === key) && p[0] < bx + bw / 2;
        const lx = isL ? bx - 10 : bx + bw + 10;
        D.circle(ctx, lx, p[1], 5, { fill: CATC[P.cat], color: key === sel ? '--ink' : 'none', width: 2 });
        const txt = P.g !== undefined ? (isL ? `GPIO ${P.g}` : `GPIO ${P.g}`) : key;
        MC.text(ctx, txt, isL ? lx - 9 : lx + 9, p[1], { size: 11, mono: true, align: isL ? 'right' : 'left', baseline: 'middle', color: key === sel ? '--accent' : '--ink-2', weight: key === sel ? 700 : 400 });
      }
      const P = PIN[sel];
      info.innerHTML = P ? `<b style="font-size:15px;color:var(--ink)">${sel}${P.g !== undefined ? ' · GPIO ' + P.g : ''}</b><br><span style="color:var(${CATC[P.cat]})">● ${CATN[P.cat]}</span><br>${P.f.join(' · ')}<br><i>${P.n}</i>` : '';
    });
  });

  /* ---------- Entorno de Arduino simulado ---------- */
  const BLINK = `// Parpadeo del LED integrado y mensajes por el puerto serie
const int LED = 2;

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(115200);
  Serial.println("Hola desde la ESP32");
}

void loop() {
  digitalWrite(LED, HIGH);
  delay(500);
  digitalWrite(LED, LOW);
  delay(500);
  Serial.println(millis());
}`;
  MC.defineSim('arduino-ide', function (sim) {
    const wrap = el('div', 'sim-html row');
    sim.stage.append(wrap);
    const ide = el('div', 'ide pane');
    ide.style.flex = '2 1 380px';
    const side = el('div', 'pane');
    wrap.append(ide, side);
    const st = { board: '', port: '', compiled: false, uploaded: false, busy: false, tab: 'con', baud: '9600', mon: false, con: [], ser: [], t0: 0, done: {}, bootNeeded: true };
    const ICO = {
      ver: '<svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      up: '<svg viewBox="0 0 16 16"><path d="M2.5 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      mon: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.2 10.2L14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    };
    ide.innerHTML = `<div class="ide-bar"><button data-a="ver" title="Verificar">${ICO.ver}</button><button data-a="up" title="Subir">${ICO.up}</button><select data-s="board"><option value="">Seleccione una placa</option><option value="uno">Arduino Uno</option><option value="esp32">ESP32 Dev Module</option><option value="s3">ESP32S3 Dev Module</option></select><select data-s="port"></select><span class="sp"></span><button data-a="mon" title="Monitor Serie">${ICO.mon}</button></div><pre class="code"></pre><div class="ide-tabs"><button data-t="con" class="on">Salida</button><button data-t="mon">Monitor Serie</button><span style="flex:1"></span><select data-s="baud" style="margin:3px 6px;font-size:12px"><option>9600</option><option>115200</option></select></div><div class="ide-console"></div>`;
    ide.querySelector('pre').innerHTML = MC.highlight(BLINK, 'cpp');
    const consoleEl = ide.querySelector('.ide-console');
    const portSel = ide.querySelector('[data-s="port"]');
    const TASKS = [['board', 'Elija la placa «ESP32 Dev Module».'], ['port', 'Elija el puerto de la ESP32 (aparece al conectarla).'], ['ver', 'Verifique (compile) el programa con ✓.'], ['up', 'Súbalo a la placa con →.'], ['mon', 'Abra el Monitor Serie a 115200 baudios y lea el saludo.']];
    sim.group('Hardware');
    sim.seg('cable', { label: 'Cable USB', options: [['datos', 'De datos'], ['carga', 'Sólo carga']], value: 'carga', onInput: () => ports() });
    sim.check('boot', { label: 'Mantener pulsado el botón BOOT al subir', value: false });
    sim.button('Reiniciar el ejercicio', () => { Object.assign(st, { board: '', port: '', compiled: false, uploaded: false, busy: false, con: [], ser: [], done: {}, mon: false }); ide.querySelector('[data-s="board"]').value = ''; ports(); renderCon(); renderSide(); });
    sim.note('El ejercicio empieza con un cable «sólo carga», el error más común en clase. Cámbielo cuando no aparezca el puerto.');
    const log = (s, cls) => { st.con.push([s, cls]); if (st.tab === 'con') renderCon(); };
    function ports() {
      const opts = [['', 'Seleccione un puerto'], ['COM1', 'COM1 (puerto del sistema)']];
      if (sim.p.cable === 'datos') opts.push(['COM5', 'COM5 (Silicon Labs CP210x)']);
      portSel.innerHTML = opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
      if (!opts.some((o) => o[0] === st.port)) st.port = '';
      portSel.value = st.port;
    }
    function renderCon() {
      const lines = st.tab === 'con' ? st.con : st.ser;
      consoleEl.innerHTML = lines.slice(-120).map(([s, c]) => `<div class="${c || ''}">${s.replace(/</g, '&lt;')}</div>`).join('');
      consoleEl.scrollTop = consoleEl.scrollHeight;
      ide.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === st.tab));
    }
    function renderSide() {
      side.innerHTML = '<div class="mini-label">Tareas</div><div style="display:flex;flex-direction:column;gap:6px">' + TASKS.map(([k, t], i) => `<div class="task${st.done[k] ? ' ok' : ''}"><b>${st.done[k] ? '✓' : i + 1}</b><span>${t}</span></div>`).join('') + '</div>';
    }
    const done = (k) => { st.done[k] = true; renderSide(); };
    const seq = (items, end) => {
      st.busy = true;
      let i = 0;
      const tick = () => {
        if (i >= items.length) { st.busy = false; if (end) end(); return; }
        const [s, c, d] = items[i++];
        log(s, c);
        setTimeout(tick, d || 160);
      };
      tick();
    };
    function compile(after) {
      if (!st.board) { log('Error: seleccione una placa en el menú de placas.', 'err'); return; }
      st.tab = 'con';
      const esp = st.board === 'esp32' || st.board === 's3';
      seq([['Compilando el sketch…', 'dim', 400], [esp ? 'El Sketch usa 289 344 bytes (22%) del espacio de almacenamiento de programa. El máximo es 1 310 720 bytes.' : 'El Sketch usa 1 864 bytes (5%) del espacio de almacenamiento de programa. El máximo es 32 256 bytes.', '', 300], [esp ? 'Las variables globales usan 20 616 bytes (6%) de la memoria dinámica.' : 'Las variables globales usan 222 bytes (10%) de la memoria dinámica.', 'ok']], () => { st.compiled = true; if (st.board === 'esp32') done('ver'); if (after) after(); });
    }
    function upload() {
      if (!st.port) { log('Error: no se ha seleccionado ningún puerto. ¿La placa está conectada con un cable de datos?', 'err'); return; }
      compile(() => {
        if (st.board === 'uno') { seq([['avrdude: stk500_recv(): programmer is not responding', 'err'], ['La placa seleccionada (Arduino Uno) no es la que está conectada.', 'err']]); return; }
        if (st.board === 's3') { seq([['A fatal error occurred: This chip is ESP32, not ESP32-S3. Wrong --chip argument?', 'err']]); return; }
        if (st.port === 'COM1') { seq([['Connecting......................................', '', 900], ['A fatal error occurred: Failed to connect to ESP32: No serial data received.', 'err'], ['COM1 es un puerto del computador, no la placa.', 'err']]); return; }
        const items = [['esptool.py v4.8 · Serial port COM5', 'dim'], ['Connecting........_____....._____', '', 1100]];
        if (st.bootNeeded && !sim.p.boot) {
          items.push(['A fatal error occurred: Failed to connect to ESP32: Wrong boot mode detected (0x13)! The chip needs to be in download mode.', 'err'], ['Consejo: mantenga pulsado BOOT mientras aparece "Connecting…".', 'dim']);
          seq(items);
          return;
        }
        items.push(['Chip is ESP32-D0WD-V3 (revision v3.1)', ''], ['Features: WiFi, BT, Dual Core, 240MHz', ''], ['Writing at 0x00010000... (25 %)', '', 300], ['Writing at 0x0002c000... (62 %)', '', 300], ['Writing at 0x00048000... (100 %)', '', 300], ['Wrote 289 344 bytes in 3.5 seconds', 'ok'], ['Hard resetting via RTS pin...', 'ok']);
        seq(items, () => { st.uploaded = true; st.t0 = performance.now(); st.ser = []; st.serN = 0; done('up'); sim.play(); });
      });
    }
    ide.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a],[data-t]');
      if (!b || st.busy) return;
      if (b.dataset.t) { st.tab = b.dataset.t; if (st.tab === 'mon') st.mon = true; renderCon(); check(); return; }
      const a = b.dataset.a;
      if (a === 'ver') compile();
      else if (a === 'up') upload();
      else if (a === 'mon') { st.tab = 'mon'; st.mon = true; renderCon(); check(); }
    });
    ide.addEventListener('change', (e) => {
      const s = e.target.dataset.s;
      if (s === 'board') { st.board = e.target.value; st.compiled = false; if (st.board === 'esp32') done('board'); }
      if (s === 'port') { st.port = e.target.value; if (st.port === 'COM5') done('port'); }
      if (s === 'baud') { st.baud = e.target.value; st.ser.push(['', '']); check(); }
    });
    const check = () => { if (st.uploaded && st.mon && st.baud === '115200' && st.tab === 'mon') done('mon'); };
    const RC = String.fromCharCode(65533), GARB = RC + 'x' + RC + '␀¿ÿ~ø' + RC + '{';
    sim.animate(() => {
      if (!st.uploaded) { sim.pause(); return; }
      const t = (performance.now() - st.t0) / 1000;
      const want = Math.floor(t) + 1;
      while ((st.serN || 0) < want) {
        const k = st.serN || 0;
        let line;
        if (st.baud === '115200') line = k === 0 ? 'Hola desde la ESP32' : String(k * 1000 + 28);
        else { line = ''; for (let j = 0; j < 6 + (k % 5); j++) line += GARB[Math.floor(Math.random() * GARB.length)]; }
        st.ser.push([line, '']);
        st.serN = k + 1;
        if (st.tab === 'mon') renderCon();
      }
    }, { button: false, autoplay: false });
    ports(); renderCon(); renderSide();
    sim.onDraw(() => {});
  });

  /* ---------- Protoboard ---------- */
  MC.defineSim('protoboard', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Protoboard con cuatro circuitos' });
    const COLS = 30;
    const ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const strip = (r, c) => (r === 'T+' || r === 'T-' || r === 'B+' || r === 'B-' ? 'R' + r : (ROWS.indexOf(r) < 5 ? 'T' : 'B') + c);
    /* cables: [desde, hasta, color]; extremos: 'r,c' de la protoboard o 'E:pin' */
    const WIRES = [
      ['E:3V3', 'T+,1', '--wire-r'], ['E:GND', 'T-,1', '--wire-k'], ['T+,30', 'B+,30', '--wire-r'], ['T-,29', 'B-,29', '--wire-k'],
      ['E:D2', 'a,3', '--wire-y'], ['a,8', 'T-,8', '--wire-k'],
      ['E:D4', 'a,11', '--wire-g'], ['a,14', 'T-,14', '--wire-k'],
      ['T+,17', 'a,17', '--wire-r'], ['a,21', 'E:D34', '--wire-b'], ['a,25', 'T-,25', '--wire-k'],
      ['f,26', 'B+,26', '--wire-r'], ['f,28', 'B-,28', '--wire-k'], ['j,27', 'E:D35', '--wire-o']
    ];
    sim.group('Circuitos');
    sim.select('focus', { label: 'Resaltar', options: [['all', 'Todo'], ['led', 'LED con resistencia (GPIO 2)'], ['btn', 'Pulsador (GPIO 4)'], ['div', 'Divisor de voltaje (GPIO 34)'], ['pot', 'Potenciómetro (GPIO 35)']], value: 'all' });
    sim.check('ledon', { label: 'GPIO 2 en ALTO (LED encendido)', value: true });
    sim.slider('rled', { label: 'Resistencia del LED', min: 100, max: 2200, step: 10, value: 220, unit: 'Ω', fmt: (v) => String(Math.round(v)) });
    sim.check('press', { label: 'Pulsador presionado', value: false });
    sim.slider('r1', { label: '<i>R</i>₁ (arriba, a 3.3 V)', min: 1, max: 100, step: 1, value: 10, unit: 'kΩ', fmt: (v) => String(Math.round(v)) });
    sim.slider('r2', { label: '<i>R</i>₂ (abajo, a GND)', min: 1, max: 100, step: 1, value: 22, unit: 'kΩ', fmt: (v) => String(Math.round(v)) });
    sim.slider('pot', { label: 'Giro del potenciómetro', min: 0, max: 1, step: 0.01, value: 0.4, fmt: (v) => MC.fix(v * 270, 0) + '°' });
    sim.out('iled', 'Corriente del LED');
    sim.out('btn', 'digitalRead(4) con INPUT_PULLUP');
    sim.out('vdiv', 'Voltaje en GPIO 34');
    sim.out('vpot', 'Voltaje en GPIO 35');
    sim.out('net', 'Nodo señalado', { hl: true });
    let hover = null, geo = null;
    const parse = (s) => { const [r, c] = s.split(','); return { r, c: +c }; };
    function nets() {
      const par = {};
      const f = (a) => { if (par[a] === undefined) par[a] = a; while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
      const u = (a, b) => { par[f(a)] = f(b); };
      const id = (s) => (s.startsWith('E:') ? s : (() => { const p = parse(s); return strip(p.r, p.c); })());
      for (const w of WIRES) u(id(w[0]), id(w[1]));
      if (sim.p.press) u('T11', 'T14');
      return { f, id };
    }
    MC.pointer(cv, {
      hover: (x, y) => { if (!geo) return false; const h = geo.pick(x, y); if ((h && h.id) !== (hover && hover.id)) { hover = h; sim.redraw(); } return h ? 'pointer' : false; },
      down: function (x, y) { this.hover(x, y); return null; },
      leave: () => { hover = null; sim.redraw(); },
      touch: 'pan-y'
    });
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const W = cv.w, H = cv.h;
      const ew = Math.min(W * 0.16, H * 0.47);
      const esp = D.esp32(ctx, 8, (H - ew * 2) / 2, ew, { labels: false, led: sim.p.ledon, hl: ['3V3', 'GND', 'D2', 'D4', 'D34', 'D35'] });
      for (const k of ['3V3', 'GNDR', 'D2', 'D4', 'D34', 'D35']) { const q = esp.pin(k); if (q) MC.text(ctx, k.replace('GNDR', 'GND'), q[0] + (q[0] < 8 + ew / 2 ? 7 : -7), q[1], { size: 9.5, mono: true, weight: 700, baseline: 'middle', align: q[0] < 8 + ew / 2 ? 'left' : 'right', color: '--screen-ink' }); }
      const bx0 = 8 + ew + W * 0.07, bx1 = W - 10;
      const p = (bx1 - bx0) / (COLS + 1);
      const by0 = H * 0.12;
      const rowY = { 'T+': by0, 'T-': by0 + p, a: by0 + p * 3, b: by0 + p * 4, c: by0 + p * 5, d: by0 + p * 6, e: by0 + p * 7, f: by0 + p * 9, g: by0 + p * 10, h: by0 + p * 11, i: by0 + p * 12, j: by0 + p * 13, 'B+': by0 + p * 15, 'B-': by0 + p * 16 };
      const hole = (r, c) => [bx0 + p * c, rowY[r]];
      const pt = (s) => (s.startsWith('E:') ? esp.pin(s.slice(2)) : (() => { const q = parse(s); return hole(q.r, q.c); })());
      /* cuerpo */
      ctx.fillStyle = MC.isDark() ? '#E9E6DC' : '#F6F3EA';
      ctx.fillRect(bx0 - p * 0.8, by0 - p * 0.9, (COLS + 0.6) * p, p * 17.8);
      ctx.strokeStyle = '#B9B3A2'; ctx.strokeRect(bx0 - p * 0.8 + 0.5, by0 - p * 0.9 + 0.5, (COLS + 0.6) * p, p * 17.8);
      ctx.fillStyle = '#D8D2C2'; ctx.fillRect(bx0 - p * 0.8, by0 + p * 7.8, (COLS + 0.6) * p, p * 0.4);
      for (const [r, col] of [['T+', '#D7263D'], ['T-', '#2E5EAA'], ['B+', '#D7263D'], ['B-', '#2E5EAA']]) { ctx.strokeStyle = col; ctx.lineWidth = 1.2; const y = rowY[r] + (r.endsWith('+') ? -p * 0.5 : p * 0.5); ctx.beginPath(); ctx.moveTo(bx0, y); ctx.lineTo(bx0 + p * COLS, y); ctx.stroke(); MC.text(ctx, r.slice(1), bx0 - p * 0.5, rowY[r], { size: 10, align: 'center', baseline: 'middle', color: col }); }
      const N = nets();
      const hNet = hover ? N.f(hover.id) : null;
      const holes = [];
      for (const r of Object.keys(rowY)) for (let c = 1; c <= COLS; c++) {
        const [x, y] = hole(r, c);
        const sid = strip(r, c);
        const on = hNet && N.f(sid) === hNet;
        ctx.fillStyle = on ? MC.col('--marker-solid') : '#4B4A45';
        const s = on ? p * 0.42 : p * 0.26;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        holes.push([x, y, sid, r, c]);
      }
      for (const r of ROWS) MC.text(ctx, r, bx0 - p * 0.45, rowY[r], { size: 9, align: 'center', baseline: 'middle', color: '#7A7466' });
      for (let c = 1; c <= COLS; c += 4) MC.text(ctx, String(c), bx0 + p * c, by0 + p * 2.1, { size: 8.5, align: 'center', baseline: 'middle', color: '#7A7466' });
      const foc = sim.p.focus;
      const dimF = (k) => (foc === 'all' || foc === k ? 1 : 0.2);
      /* componentes */
      ctx.save(); ctx.globalAlpha = dimF('led');
      D.resistor(ctx, ...hole('c', 3), ...hole('c', 7), { amp: p * 0.3, width: 2 });
      MC.text(ctx, Math.round(sim.p.rled) + ' Ω', (hole('c', 3)[0] + hole('c', 7)[0]) / 2, rowY.c - p * 0.9, { size: 10, align: 'center', color: '#3a3a3a', mono: true });
      const a7 = hole('d', 7), k8 = hole('d', 8);
      const ledC = sim.p.ledon ? '#FF3B30' : '#7d2b26';
      if (sim.p.ledon) { ctx.fillStyle = 'rgba(255,60,48,.25)'; ctx.beginPath(); ctx.arc((a7[0] + k8[0]) / 2, a7[1] - p * 0.6, p * 1.3, 0, 7); ctx.fill(); }
      ctx.fillStyle = ledC; ctx.beginPath(); ctx.arc((a7[0] + k8[0]) / 2, a7[1] - p * 0.6, p * 0.55, 0, 7); ctx.fill();
      D.line(ctx, a7[0], a7[1], (a7[0] + k8[0]) / 2 - p * 0.2, a7[1] - p * 0.3, { color: '#777', width: 1.5 });
      D.line(ctx, k8[0], k8[1], (a7[0] + k8[0]) / 2 + p * 0.2, a7[1] - p * 0.3, { color: '#777', width: 1.5 });
      ctx.restore();
      ctx.save(); ctx.globalAlpha = dimF('btn');
      const b1 = hole('c', 11), b2 = hole('c', 14);
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(b1[0] - p * 0.2, b1[1] - p * 1.1, b2[0] - b1[0] + p * 0.4, p * 2.2);
      ctx.fillStyle = sim.p.press ? '#9a9a9a' : '#c7c7c7'; ctx.beginPath(); ctx.arc((b1[0] + b2[0]) / 2, b1[1], p * 0.75, 0, 7); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.globalAlpha = dimF('div');
      D.resistor(ctx, ...hole('c', 17), ...hole('c', 21), { amp: p * 0.3, width: 2 });
      D.resistor(ctx, ...hole('d', 21), ...hole('d', 25), { amp: p * 0.3, width: 2 });
      MC.text(ctx, `R₁ ${Math.round(sim.p.r1)}k`, (hole('c', 17)[0] + hole('c', 21)[0]) / 2, rowY.c - p * 0.9, { size: 10, align: 'center', color: '#3a3a3a', mono: true });
      MC.text(ctx, `R₂ ${Math.round(sim.p.r2)}k`, (hole('d', 21)[0] + hole('d', 25)[0]) / 2, rowY.d + p * 1.3, { size: 10, align: 'center', color: '#3a3a3a', mono: true });
      ctx.restore();
      ctx.save(); ctx.globalAlpha = dimF('pot');
      const q1 = hole('h', 26), q3 = hole('h', 28);
      ctx.fillStyle = '#2F6FC0'; ctx.fillRect(q1[0] - p * 0.4, q1[1] - p * 1.6, q3[0] - q1[0] + p * 0.8, p * 1.8);
      ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.arc((q1[0] + q3[0]) / 2, q1[1] - p * 0.7, p * 0.6, 0, 7); ctx.fill();
      const ang = -Math.PI * 0.75 + sim.p.pot * Math.PI * 1.5;
      D.line(ctx, (q1[0] + q3[0]) / 2, q1[1] - p * 0.7, (q1[0] + q3[0]) / 2 + p * 0.55 * Math.sin(ang), q1[1] - p * 0.7 - p * 0.55 * Math.cos(ang), { color: '#333', width: 2 });
      for (const c of [26, 27, 28]) { const h = hole('g', c); D.line(ctx, h[0], h[1], h[0], q1[1] - p * 0.2, { color: '#999', width: 1.5 }); }
      ctx.restore();
      /* cables */
      WIRES.forEach((w) => {
        const a = pt(w[0]), b = pt(w[1]);
        if (!a || !b) return;
        const on = hNet && (N.f(N.id(w[0])) === hNet);
        D.wire(ctx, a, b, w[2], { width: on ? 4 : 2.6, sag: w[0].startsWith('E:') || w[1].startsWith('E:') ? 0.05 : 0.3 });
      });
      geo = {
        pick: (x, y) => {
          let best = null, bd = p * 0.6;
          for (const [hx, hy, sid, r, c] of holes) { const d = Math.hypot(hx - x, hy - y); if (d < bd) { bd = d; best = { id: sid, lab: `${r}${c}` }; } }
          for (const k of ['D2', 'D4', 'D34', 'D35', '3V3', 'GND']) { const q = esp.pin(k); if (q && Math.hypot(q[0] - x, q[1] - y) < 12) best = { id: 'E:' + k, lab: k }; }
          return best;
        }
      };
      /* lecturas */
      const iled = sim.p.ledon ? Math.max(0, (3.3 - 2.0) / sim.p.rled) : 0;
      sim.set('iled', MC.fix(iled * 1000, 1) + ' mA' + (iled > 0.02 ? ' (¡demasiado!)' : ''));
      sim.set('btn', sim.p.press ? '0 (LOW)' : '1 (HIGH)');
      sim.set('vdiv', MC.fix((3.3 * sim.p.r2) / (sim.p.r1 + sim.p.r2), 3) + ' V');
      sim.set('vpot', MC.fix(3.3 * sim.p.pot, 2) + ' V');
      if (hover) {
        const root = N.f(hover.id);
        const members = ['E:3V3', 'E:GND', 'E:D2', 'E:D4', 'E:D34', 'E:D35'].filter((k) => N.f(k) === root).map((k) => k.slice(2));
        sim.set('net', `${hover.lab}${members.length ? ' ↔ ' + members.join(', ') : ''}`);
      } else sim.set('net', 'pase el cursor por un agujero');
    });
  });

  /* ---------- ADC de la ESP32 ---------- */
  MC.defineSim('adc-esp32', function (sim) {
    const cv = sim.canvas({ aspect: 1.45, label: 'Curva de transferencia del ADC y error' });
    const gainChip = 1 + M.gauss(0, 0.02);
    const rawOf = (V, att) => {
      const R = { 0: [0.08, 0.95], 2: [0.09, 1.25], 6: [0.12, 1.75], 11: [0.142, 3.05] }[att];
      let x = ((V - R[0]) / (R[1] - R[0])) * 3800 * gainChip;
      if (x < 0) x = 0;
      if (x > 3500) x = 3500 + 595 * (1 - Math.exp(-(x - 3500) / 595));
      return Math.min(4095, x);
    };
    sim.group('Entrada');
    sim.slider('V', { label: 'Voltaje de entrada', min: 0, max: 3.3, step: 0.005, value: 1.65, unit: 'V', fmt: (v) => MC.fix(v, 3) });
    sim.select('att', { label: 'Atenuación', options: [['11', '11 dB (por defecto, hasta ≈ 3.1 V)'], ['6', '6 dB (hasta ≈ 1.75 V)'], ['2', '2.5 dB (hasta ≈ 1.25 V)'], ['0', '0 dB (hasta ≈ 0.95 V)']], value: '11' });
    sim.slider('N', { label: 'Lecturas promediadas', min: 1, max: 64, step: 1, value: 1, log: true, fmt: (v) => String(Math.round(v)) });
    sim.out('raw', 'analogRead()');
    sim.out('naive', 'raw × 3300/4095');
    sim.out('mv', 'analogReadMilliVolts()', { hl: true });
    sim.out('sd', 'Dispersión de la lectura');
    sim.onDraw(() => {
      const att = +sim.p.att, N = Math.round(sim.p.N);
      const fs = { 0: 0.95, 2: 1.25, 6: 1.75, 11: 3.1 }[att];
      const read = (V) => { let s = 0; for (let i = 0; i < N; i++) s += Math.round(rawOf(V, att) + M.gauss(0, 6)); return s / N; };
      const raws = []; for (let k = 0; k < 40; k++) raws.push(read(sim.p.V));
      const r = M.mean(raws), sd = M.std(raws);
      const calMv = (V) => (V < 0.142 ? 142 : V > fs ? fs * 1000 + 10 : V * 1000 + 6 * Math.sin(V * 7));
      sim.set('raw', MC.fix(raws[0], N > 1 ? 1 : 0));
      sim.set('naive', MC.fix((raws[0] * 3300) / 4095, 0) + ' mV');
      sim.set('mv', MC.fix(calMv(sim.p.V) + M.gauss(0, 8 / Math.sqrt(N)), 0) + ' mV');
      sim.set('sd', MC.fix(sd, 1) + ' cuentas ≈ ' + MC.fix((sd * fs * 1000) / 4095, 1) + ' mV');
      const ctx = cv.ctx;
      D.clear(cv);
      const h1 = cv.h * 0.6;
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: h1, xmin: 0, xmax: 3.3, ymin: 0, ymax: 4200, xlabel: '', ylabel: 'lectura (0–4095)', mt: 14, mb: 22 });
      P.frame();
      P.fn((V) => (V / 3.3) * 4095, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      P.fn((V) => rawOf(V, att), { color: '--c1', width: 2.2 });
      P.dot(sim.p.V, r, { color: '--accent', label: MC.fix(r, 0) });
      P.legend([{ label: 'ideal: V/3.3 × 4095', color: '--ink-3', dash: [5, 4] }, { label: 'ESP32 real', color: '--c1' }], 'tl');
      const Q = new MC.Plot(ctx, { x: 0, y: h1, w: cv.w, h: cv.h - h1, xmin: 0, xmax: 3.3, ymin: -400, ymax: 400, xlabel: ['V', 'V'], ylabel: ['error', 'mV'], mt: 14, title: 'Error de la conversión' });
      Q.frame();
      Q.fn((V) => (rawOf(V, att) * 3300) / 4095 - V * 1000, { color: '--c2', width: 1.8 });
      Q.fn((V) => calMv(V) - V * 1000, { color: '--c3', width: 2 });
      Q.vline(sim.p.V, { color: '--accent' });
      Q.legend([{ label: 'raw × 3300/4095', color: '--c2' }, { label: 'analogReadMilliVolts', color: '--c3' }], 'tr');
    });
  });

  /* ---------- Consulta frente a interrupción ---------- */
  MC.defineSim('interrupciones', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Señal de la fotocompuerta y detecciones' });
    let ev = null;
    sim.group('Señal');
    sim.slider('w', { label: 'Duración de cada pulso (haz cortado)', min: 0.5, max: 30, step: 0.5, value: 6, unit: 'ms', fmt: (v) => MC.fix(v, 1), onInput: () => { ev = null; } });
    sim.slider('gap', { label: 'Separación entre pulsos', min: 5, max: 60, step: 1, value: 22, unit: 'ms', fmt: (v) => String(Math.round(v)), onInput: () => { ev = null; } });
    sim.group('Programa');
    sim.slider('dly', { label: 'delay() dentro del loop()', min: 0, max: 50, step: 1, value: 20, unit: 'ms', fmt: (v) => String(Math.round(v)) });
    sim.check('send', { label: 'El loop() también envía datos por serie (+2 ms)', value: true });
    sim.button('Otro paso del objeto', () => { ev = null; sim.redraw(); });
    sim.out('np', 'Pulsos reales');
    sim.out('pol', 'Detectados por consulta');
    sim.out('epol', 'Error máximo (consulta)');
    sim.out('eint', 'Error máximo (interrupción)', { hl: true });
    sim.onDraw(() => {
      if (!ev) {
        ev = [];
        let t = 10 + Math.random() * 5;
        for (let k = 0; k < 6; k++) { const w = sim.p.w * (1 - 0.06 * k); ev.push([t, t + w]); t += w + sim.p.gap * (1 - 0.05 * k); }
      }
      const T = ev[ev.length - 1][1] + 15;
      const loopT = sim.p.dly + (sim.p.send ? 2 : 0) + 0.02;
      const blocked = (t) => ev.some(([a, b]) => t >= a && t < b);
      const polls = [];
      for (let t = Math.random() * loopT; t < T; t += loopT * (1 + M.gauss(0, 0.01))) polls.push(t);
      const detP = [];
      let prev = false;
      for (const t of polls) { const s = blocked(t); if (s && !prev) detP.push(t); prev = s; }
      const detI = ev.map(([a]) => a + 0.003 + Math.abs(M.gauss(0, 0.001)));
      let ep = 0;
      for (const [a] of ev) { const d = detP.find((t) => t >= a && t < a + sim.p.w + sim.p.gap); if (d !== undefined) ep = Math.max(ep, d - a); }
      sim.set('np', String(ev.length));
      sim.set('pol', `${detP.length}` + (detP.length < ev.length ? ` (perdió ${ev.length - detP.length})` : ''));
      sim.set('epol', MC.fix(ep, 2) + ' ms');
      sim.set('eint', MC.fix(Math.max(...detI.map((t, i) => t - ev[i][0])) * 1000, 1) + ' µs');
      const ctx = cv.ctx;
      D.clear(cv);
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: T, ymin: -1.6, ymax: 1.5, xlabel: ['t', 'ms'], ylabel: '', yticks: [], mt: 14 });
      P.frame();
      const xs = [], ys = [];
      xs.push(0); ys.push(1);
      for (const [a, b] of ev) { xs.push(a, a, b, b); ys.push(1, 0, 0, 1); }
      xs.push(T); ys.push(1);
      P.xy(xs, ys, { color: '--ink', width: 2 });
      MC.text(ctx, 'pin de la fotocompuerta (0 = haz cortado)', P.ix + 6, P.Y(1) - 6, { size: 11, color: '--ink-2' });
      P.scatter(polls, polls.map(() => -0.45), { color: '--c6', r: 2.2 });
      MC.text(ctx, 'instantes en que loop() lee el pin', P.ix + 6, P.Y(-0.45) - 8, { size: 11, color: '--ink-3' });
      for (const t of detP) P.arrow(t, -0.75, t, -0.2, { color: '--c2', width: 2 });
      for (const t of detI) P.arrow(t, -1.4, t, -0.95, { color: '--c3', width: 2 });
      MC.text(ctx, 'consulta', P.ix + P.iw - 6, P.Y(-0.62), { size: 11.5, align: 'right', color: '--c2', weight: 600 });
      MC.text(ctx, 'interrupción', P.ix + P.iw - 6, P.Y(-1.2), { size: 11.5, align: 'right', color: '--c3', weight: 600 });
    });
  });

  /* ---------- Monitor y Trazador Serie ---------- */
  MC.defineSim('serial-plotter', function (sim) {
    sim.cols2('1fr 1.4fr');
    const mon = el('div', 'ide-console');
    mon.style.height = '100%';
    mon.style.minHeight = '260px';
    const wrapM = el('div', 'sim-canvas');
    wrapM.style.aspectRatio = '0.9';
    wrapM.append(mon);
    sim.stage.append(wrapM);
    const cv = sim.canvas({ aspect: 1.3, label: 'Trazador Serie' });
    const hist = new MC.History(['a', 'b'], { max: 3000, minDt: 0 });
    let t = 0, queue = 0, lines = [], lag = 0, acc = 0;
    sim.group('Formato de cada línea');
    sim.select('fmt', { options: [['csv', 'Valores separados por comas: 0.42,0.03'], ['lab', 'Con nombres: seno:0.42,ruido:0.03'], ['txt', 'Texto libre: Voltaje = 0.42 V']], value: 'lab' });
    sim.group('Canal');
    sim.select('baud', { label: 'Velocidad', options: [['9600', '9600 baudios'], ['57600', '57 600 baudios'], ['115200', '115 200 baudios'], ['921600', '921 600 baudios']], value: '115200' });
    sim.slider('rate', { label: 'Líneas por segundo que envía el programa', min: 1, max: 3000, step: 1, value: 50, log: true, fmt: (v) => String(Math.round(v)) });
    sim.out('len', 'Bytes por línea');
    sim.out('cap', 'Capacidad del canal', { hl: true });
    sim.out('lag', 'Retraso acumulado');
    const lineOf = (a, b) => (sim.p.fmt === 'csv' ? `${MC.fix(a, 2)},${MC.fix(b, 2)}` : sim.p.fmt === 'lab' ? `seno:${MC.fix(a, 2)},ruido:${MC.fix(b, 2)}` : `Voltaje = ${MC.fix(a, 2)} V`).replace(/−/g, '-');
    sim.animate((dt) => {
      const len = lineOf(0.42, 0.03).length + 2;
      const cap = +sim.p.baud / 10 / len;
      const rate = Math.round(sim.p.rate);
      acc += dt * rate;
      while (acc >= 1) {
        acc -= 1; queue++;
      }
      let can = cap * dt;
      while (queue > 0 && can >= 1) {
        queue--; can--;
        t += 1 / Math.min(rate, 400);
        const a = Math.sin(2 * Math.PI * 0.5 * t) * 1.2, b = M.gauss(0, 0.15);
        const s = lineOf(a, b);
        lines.push(s);
        if (sim.p.fmt !== 'txt') hist.push(t, { a, b: sim.p.fmt === 'csv' || sim.p.fmt === 'lab' ? b : NaN }, true);
      }
      lag = queue / rate;
      if (lines.length > 200) lines = lines.slice(-200);
    }, { button: true });
    sim.onDraw(() => {
      const len = lineOf(0.42, 0.03).length + 2;
      const cap = +sim.p.baud / 10 / len;
      sim.set('len', String(len));
      sim.set('cap', MC.fix(cap, 0) + ' líneas/s');
      sim.set('lag', lag > 0.05 ? MC.fix(lag, 2) + ' s (¡saturado!)' : 'ninguno');
      mon.innerHTML = lines.slice(-18).map((s) => `<div>${s}</div>`).join('');
      const ctx = cv.ctx;
      D.clear(cv);
      const T = hist.d.t;
      const tN = T.length ? T[T.length - 1] : 0;
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: Math.max(0, tN - 5), xmax: Math.max(5, tN), ymin: -1.6, ymax: 1.6, xlabel: ['t', 's'], ylabel: 'valor', mt: 26, title: 'Trazador Serie' });
      P.frame();
      if (sim.p.fmt === 'txt') MC.text(ctx, 'El trazador no entiende texto libre: no grafica nada', P.ix + P.iw / 2, P.iy + P.ih / 2, { size: 13, align: 'center', color: '--warn-ink', halo: true, weight: 600 });
      else {
        P.xy(T, hist.d.a, { color: '--c1', width: 1.8 });
        P.xy(T, hist.d.b, { color: '--c4', width: 1.2 });
        P.legend(sim.p.fmt === 'lab' ? [{ label: 'seno', color: '--c1' }, { label: 'ruido', color: '--c4' }] : [{ label: 'valor 1', color: '--c1' }, { label: 'valor 2', color: '--c4' }], 'tr');
      }
    });
  });
})();
