/* Capítulo 8 — Las placas (y ayudantes de escenas para toda la Parte II) */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.parts;

  /* ---------- Ayudantes de escenas compartidos ---------- */
  const CV = (EM.cv = {});
  CV.bb = () => ({ id: 'bb', kind: 'half', x: 0, y: 0 });
  CV.uno = (o = {}) => Object.assign({ boards: [CV.bb()], mcus: [{ id: 'uno', kind: 'uno', x: -78, y: 2 }], parts: [], wires: [], env: { lux: 300, temp: 25 } }, o);
  CV.esp = (o = {}) => Object.assign({ boards: [CV.bb()], mcus: [{ id: 'esp', kind: 'esp32', plug: { col: 2 } }], parts: [], wires: [], env: { lux: 300, temp: 25 } }, o);
  /* N LED con su resistencia, cada uno en un pin: devuelve {parts, wires}. pins: ['@D8', ...] */
  CV.leds = (pins, colors, rv = 220, gnd = '@GND') => {
    const parts = [], wires = [{ id: 'wg', a: gnd, b: 'T-1' }];
    pins.forEach((p, i) => {
      const c = 2 + 6 * i;
      wires.push({ id: 'wl' + i, a: p, b: 'j' + c });
      parts.push({ id: 'R' + (i + 1), type: 'R', value: rv, pins: ['h' + c, 'h' + (c + 3)] });
      parts.push({ id: 'D' + (i + 1), type: 'LED', color: (colors && colors[i]) || 'rojo', pins: ['g' + (c + 3), 'g' + (c + 4)] });
      wires.push({ id: 'wk' + i, a: 'j' + (c + 4), b: 'T-' + (3 + i * 4) });
    });
    return { parts, wires };
  };
  CV.partOf = (lab, id) => lab.scene.parts.find((p) => p.id === id);

  /* ---------- 8.1 Mapa de pines ---------- */
  const BOARDS = {
    uno: { name: 'Arduino UNO R3', mcus: [{ id: 'uno', kind: 'uno', x: -78, y: 2 }] },
    nano: { name: 'Arduino Nano', mcus: [{ id: 'nano', kind: 'nano', plug: { col: 4 } }] },
    esp32: { name: 'ESP32 DevKit (30 pines)', mcus: [{ id: 'esp', kind: 'esp32', plug: { col: 2 } }] }
  };
  const describe = (kind, q) => {
    const spec = EM.mcu.boards[kind], f = [];
    if (q.net === 'GND') return ['Tierra (GND)', 'Referencia de 0 V. Todos los pines GND están unidos.'];
    if (q.net === '5V' && kind !== 'esp32') return ['Salida de 5 V', 'Alimenta sensores y módulos de 5 V; proviene del USB (máx. 500 mA entre todo).'];
    if (q.net === '5V' || q.id === 'VIN') return [kind === 'esp32' ? 'VIN: entrada/salida de 5 V' : 'VIN', kind === 'esp32' ? 'Recibe los 5 V del USB; de ahí se obtienen los 3.3 V.' : 'Entrada de 7 a 12 V para fuente externa.'];
    if (q.net === '3V3') return ['Salida de 3.3 V', kind === 'esp32' ? 'Regulada; sirve para sensores de 3.3 V.' : 'Máximo 50 mA.'];
    if (q.id === 'RESET' || q.id === 'RESET2' || q.id === 'EN') return ['Reinicio (RESET / EN)', 'Al unirlo a GND la placa reinicia el programa.'];
    if (q.gpio === undefined && q.adc === undefined) return [q.label, 'Pin sin función programable de uso común.'];
    const lines = ['Entrada/salida digital (' + (kind === 'esp32' ? 'GPIO ' + q.gpio : 'D' + q.gpio) + ')'];
    if (q.inputOnly) lines.push('SOLO ENTRADA: no puede dar salida ni tiene pull-up interno.');
    if (q.pwm && kind !== 'esp32') lines.push('Salida PWM (~490 Hz; 980 Hz en los pines 5 y 6).');
    if (q.pwm && kind === 'esp32') lines.push('PWM por hardware (LEDC), frecuencia y resolución ajustables.');
    if (q.adc !== undefined) lines.push('Entrada analógica (ADC de ' + spec.adcBits + ' bits' + (q.adcUnit ? ', ADC' + q.adcUnit + (q.adcUnit === 2 ? ': no funciona con WiFi' : '') : '') + ').');
    if (q.int) lines.push('Admite interrupciones externas.');
    if (q.dac) lines.push('Salida analógica real (DAC de 8 bits).');
    if (q.i2c || q.net === 'A4' || q.net === 'A5') lines.push('Bus I²C (' + (q.i2c || (q.net === 'A4' ? 'SDA' : 'SCL')) + ').');
    for (const [k, v] of Object.entries(spec.spi)) if (v === q.id) lines.push('Bus SPI (' + k.toUpperCase() + ').');
    if (spec.serialPins.rx === q.id) lines.push('Puerto serie RX (recibe); lo usa el USB: evite usarlo al subir el programa.');
    if (spec.serialPins.tx === q.id) lines.push('Puerto serie TX (transmite); lo usa el USB.');
    if (q.strap) lines.push('Pin de arranque («strapping»): no lo fuerce al encender.');
    if (q.id === spec.ledPin) lines.push('Tiene un LED incorporado de la placa.');
    return [q.label, lines.join(' ')];
  };
  EM.defineSim('pines', function (sim) {
    let kind = 'uno', pinId = 'D13';
    const sc = CV.uno();
    EM.Lab.mount(sim, {
      aspect: 1.9, scene: sc, bare: true, noTip: true, speeds: false, below: true, hint: 'Elija placa y pin: se marca en la placa y se describen sus funciones.',
      controls: [
        { type: 'select', id: 'b', label: 'Placa', options: Object.entries(BOARDS).map(([k, v]) => [k, v.name]), value: 'uno', apply: (lab, v) => { kind = v; lab.scene.mcus = JSON.parse(JSON.stringify(BOARDS[v].mcus)); lab.scene._norm = false; lab.reload(); const spec = EM.mcu.boards[BOARDS[v].mcus[0].kind]; const sel = sim.ctl.p && sim.ctl.p.input; if (sel) { sel.innerHTML = ''; spec.pins.forEach((q) => { const o = document.createElement('option'); o.value = q.id; o.textContent = q.label + (q.net ? '' : ''); sel.append(o); }); pinId = spec.pins.find((q) => q.id === 'D13' || q.id === 'G2').id; sel.value = pinId; sim.p.p = pinId; } lab.markers = [{ ref: BOARDS[v].mcus[0].id + ':' + pinId, text: '' }]; } },
        { type: 'select', id: 'p', label: 'Pin', options: EM.mcu.boards.uno.pins.map((q) => [q.id, q.label]), value: 'D13', apply: (lab, v) => { pinId = v; lab.markers = [{ ref: BOARDS[kind].mcus[0].id + ':' + v, text: '' }]; } }
      ],
      onReady: (lab) => { lab.markers = [{ ref: 'uno:D13', text: '' }]; },
      outs: [
        { id: 'n', label: 'Pin', hl: true, fn: () => { const q = EM.mcu.pinById(BOARDS[kind].mcus[0].kind, pinId); return q ? describe(BOARDS[kind].mcus[0].kind, q)[0] : '—'; } },
        { id: 'f', label: 'Funciones', fn: () => { const q = EM.mcu.pinById(BOARDS[kind].mcus[0].kind, pinId); return q ? describe(BOARDS[kind].mcus[0].kind, q)[1] : '—'; } },
        { id: 'v', label: 'Lógica de la placa', fn: () => { const s = EM.mcu.boards[BOARDS[kind].mcus[0].kind]; return s.vcc + ' V (alto desde ' + EM.fix(s.vih * s.vcc, 2) + ' V; bajo hasta ' + EM.fix(s.vil * s.vcc, 2) + ' V)'; } }
      ]
    });
  });

  /* ---------- 8.2 Niveles lógicos ---------- */
  EM.defineSim('niveles', function (sim) {
    const sc = CV.esp();
    sc.parts = [{ id: 'IR1', type: 'IRSENS', pins: ['j22', 'j23', 'j24'], dir: 'up' }, { id: 'R1', type: 'R', value: 1000, pins: [null, null] }, { id: 'R2', type: 'R', value: 2000, pins: [null, null] }];
    sc.wires = [{ id: 'wv', a: '@VIN', b: 'i22' }, { id: 'wg', a: '@GND', b: 'i24' }, { id: 'wo', a: '@G4', b: 'i23' }, { id: 'wg2', a: 'j28', b: '@GND', cut: true }];
    const code = 'void setup() {\n  Serial.begin(115200);\n  pinMode(4, INPUT);\n}\n\nvoid loop() {\n  Serial.println(digitalRead(4));\n  delay(500);\n}\n';
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, code, speeds: [[1, '1×'], [3, '3×']], hint: 'Conecte la salida del módulo directo al pin 4 o por el divisor de tensión.',
      faults: [{ id: 'div', label: 'Usar el divisor de tensión (1 kΩ y 2 kΩ)', on: false, apply: (s) => { s.parts[1].pins = ['h23', 'h26']; s.parts[2].pins = ['g26', 'g27']; s.wires.find((w) => w.id === 'wo').b = 'i26'; s.wires.find((w) => w.id === 'wg2').cut = false; }, revert: (s) => { s.parts[1].pins = [null, null]; s.parts[2].pins = [null, null]; s.wires.find((w) => w.id === 'wo').b = 'i23'; s.wires.find((w) => w.id === 'wg2').cut = true; } },
        { id: 'rep', label: 'Reponer la placa', apply: () => {}, revert: () => {} }].slice(0, 1),
      controls: [{ type: 'button', label: 'Reponer la placa (nuevo pin)', run: (lab) => { lab.bench.repairAll(); lab.alerts = []; lab.alertBox.innerHTML = ''; } }],
      outs: [
        { id: 'v', label: 'Tensión en el pin 4', hl: true, fn: (lab) => EM.fix(lab.bench.v('esp:G4'), 2) + ' V (máximo 3.6 V)' },
        { id: 's', label: 'Estado del pin', fn: (lab) => (lab.bench.mcuInfo.esp.deadPins && lab.bench.mcuInfo.esp.deadPins.G4 ? '<span class="bad">dañado</span>' : 'sano') }
      ]
    });
  });
})();
