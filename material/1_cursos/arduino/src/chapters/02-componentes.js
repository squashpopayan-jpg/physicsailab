/* Capítulo 2 — Conociendo los componentes */
(function () {
  'use strict';
  const EM = window.EM, DW = EM.dw, PT = EM.parts, sp = EM.spice;

  /* Datos del catálogo: pieza, colocación y texto */
  const CAT = [
    { k: 'R', name: 'Resistencia', part: { type: 'R', id: 'R1', value: 330, pins: ['e14', 'e19'] }, term: 'Dos, sin polaridad (se pueden invertir).', que: 'Limita la corriente. Su valor se lee con franjas de colores.', datos: '1 Ω a 10 MΩ; ¼ W (0.25 W) las del kit. Tolerancia ±5 % (dorado).', uso: 'Proteger LED; pull-up y pull-down; divisores de tensión.', cuid: 'No pasar de su potencia: se calienta y se quema.' },
    { k: 'POT', name: 'Potenciómetro', part: { type: 'POT', id: 'RV1', value: 10000, pos: 0.5, pins: ['e14', 'e15', 'e16'] }, term: 'Tres: extremo A, cursor (centro) y extremo B.', que: 'Resistencia variable con perilla. El cursor toma una fracción de la tensión.', datos: '10 kΩ es lo habitual. Arrastre el círculo azul para girarlo.', uso: 'Entrada analógica (A0), volumen, brillo, velocidad.', cuid: 'No conecte el cursor directo a 5 V y a GND a la vez.' },
    { k: 'LDR', name: 'Fotorresistencia (LDR)', part: { type: 'LDR', id: 'LDR1', pins: ['e14', 'e17'] }, term: 'Dos, sin polaridad.', que: 'Su resistencia baja cuando le llega luz.', datos: 'Unos 10–20 kΩ con 10 lux; más de 1 MΩ a oscuras; de 1 a 5 kΩ con luz fuerte.', uso: 'Sensores de luz, lámparas automáticas, alarmas láser.', cuid: 'Siempre con una resistencia fija en divisor.', ctl: 'lux' },
    { k: 'NTC', name: 'Termistor NTC', part: { type: 'NTC', id: 'NTC1', pins: ['e14', 'e16'] }, term: 'Dos, sin polaridad.', que: 'Su resistencia baja al subir la temperatura.', datos: '10 kΩ a 25 °C, β ≈ 3950 K: unos 33.6 kΩ a 0 °C y 3.6 kΩ a 50 °C.', uso: 'Termómetros, termostatos, control de ventiladores.', cuid: 'La curva no es lineal: se calcula con la ecuación β.', ctl: 'temp' },
    { k: 'C', name: 'Condensador cerámico', part: { type: 'C', id: 'C1', value: 100e-9, pins: ['e14', 'e16'] }, term: 'Dos, sin polaridad.', que: 'Almacena poca carga; filtra ruido de la alimentación.', datos: '«104» = 10×10⁴ pF = 100 nF. Se pone junto a los chips.', uso: 'Desacoplo, antirrebote, filtros.', cuid: 'No pasar del voltaje impreso (50 V típico).' },
    { k: 'ECAP', name: 'Condensador electrolítico', part: { type: 'ECAP', id: 'C2', value: 100e-6, vmax: 16, pins: ['e14', 'e17'] }, term: 'Dos con polaridad: la pata larga es +, la franja marca el −.', que: 'Almacena mucha carga: filtra, estabiliza, da energía en picos.', datos: 'Valores de 1 µF a miles de µF; voltaje máximo impreso (6.3, 10, 16, 25 V).', uso: 'Filtros de fuentes, arranque de motores, temporizadores.', cuid: 'Al revés o con sobretensión se calienta y puede explotar.' },
    { k: 'D', name: 'Diodo rectificador 1N4007', part: { type: 'D', id: 'D1', model: '1N4007', pins: ['e14', 'e18'] }, term: 'Ánodo (+) y cátodo (−, marcado por la franja).', que: 'Deja pasar la corriente en un solo sentido; cae unos 0.7 V.', datos: '1N4007: 1 A y 1000 V inversos. 1N4148: 200 mA, para señales.', uso: 'Protección contra polaridad invertida; diodo de rueda libre para motores y relés.', cuid: 'La franja debe apuntar hacia el lado más negativo.' },
    { k: 'LED', name: 'LED de 5 mm', part: { type: 'LED', id: 'D1', color: 'rojo', pins: ['e14', 'e15'] }, term: 'Ánodo (+, pata larga) y cátodo (−, pata corta y lado plano).', que: 'Diodo que emite luz.', datos: 'Rojo/amarillo/verde ≈ 1.8–2.1 V; azul y blanco ≈ 3.0–3.3 V. Corriente típica 10–20 mA, máximo 30 mA.', uso: 'Indicadores, semáforos, alarmas visuales.', cuid: 'Siempre con resistencia en serie; respetar polaridad.', ctl: 'color' },
    { k: 'BTN', name: 'Pulsador de 4 patas', part: { type: 'BTN', id: 'S1', pins: ['f14', 'f16', 'e14', 'e16'] }, term: 'Cuatro; las del mismo lado están unidas por dentro.', que: 'Cierra el contacto solo mientras se presiona.', datos: 'Se coloca a horcajadas sobre el canal central. Haga clic para pulsarlo.', uso: 'Entradas digitales, reinicio, menús.', cuid: 'Girado 90° queda siempre cerrado.' },
    { k: 'SW', name: 'Interruptor deslizante', part: { type: 'SW', id: 'SW1', closed: false, pins: ['e14', 'e18'] }, term: 'Dos que se unen o se separan.', que: 'Mantiene su posición (abierto o cerrado).', datos: 'Haga clic para moverlo.', uso: 'Encendido general, selección de modos.', cuid: 'Cuidado con exceder su corriente nominal.' },
    { k: 'BUZ', name: 'Zumbador activo', part: { type: 'BUZ', id: 'BZ1', pins: ['e14', 'e17'] }, term: 'Dos con polaridad (+ marcado).', que: 'Trae un oscilador interno: suena con solo darle voltaje.', datos: '3–5 V, tono fijo cercano a 2.7 kHz, unos 30 mA.', uso: 'Alarmas, avisos, timbres.', cuid: 'No sirve para tocar melodías: eso lo hace el pasivo.' },
    { k: 'PIEZO', name: 'Zumbador pasivo (piezo)', part: { type: 'PIEZO', id: 'BZ2', pins: ['e14', 'e17'] }, term: 'Dos (polaridad indiferente).', que: 'Solo produce sonido si recibe una señal con la frecuencia deseada.', datos: 'Con tone(pin, frecuencia) se producen notas (do = 262 Hz).', uso: 'Melodías, sirenas, pitidos de distinta altura.', cuid: 'Sin señal no suena aunque tenga 5 V continuos.' },
    { k: 'BJT', name: 'Transistor BC547 (NPN)', part: { type: 'BJT', id: 'Q1', model: 'BC547', pins: ['e14', 'e15', 'e16'] }, term: 'C (colector), B (base) y E (emisor), de izquierda a derecha con la cara plana hacia usted.', que: 'Interruptor controlado: una corriente pequeña en B deja pasar una grande de C a E.', datos: 'BC547: 100 mA máx., ganancia de 100 a 800. 2N2222: hasta 600 mA, con el orden E–B–C.', uso: 'Encender motores, relés, LED potentes desde un pin.', cuid: 'El orden de patas cambia entre modelos: consulte la hoja de datos.' },
    { k: 'NMOS', name: 'MOSFET IRLZ44N (canal N)', part: { type: 'NMOS', id: 'Q2', model: 'IRLZ44N', pins: ['e14', 'e15', 'e16'] }, term: 'G (compuerta), D (drenador) y S (fuente), de izquierda a derecha de frente.', que: 'Interruptor controlado por tensión; se activa con 5 V en G (nivel lógico).', datos: 'Hasta 47 A (con disipador); baja resistencia cuando conduce.', uso: 'Controlar motores, tiras LED y cargas de alta corriente.', cuid: 'Sensible a la electricidad estática; no dejar la compuerta al aire.' },
    { k: 'MOTOR', name: 'Motor de corriente continua', part: { type: 'MOTOR', id: 'M1', at: [40, -22], pins: ['T+10', 'T-10'] }, term: 'Dos; invertirlos invierte el giro.', que: 'Convierte electricidad en giro.', datos: 'Consume cientos de mA al arrancar y más al frenarse.', uso: 'Ruedas de robots, ventiladores, bombas.', cuid: 'Nunca directo a un pin; usar transistor y diodo (capítulo 18).' },
    { k: 'SERVO', name: 'Servomotor SG90', part: { type: 'SERVO', id: 'SV1', pins: ['j14', 'j15', 'j16'], forcePower: 5, angleNow: 60 }, term: 'Tres cables: marrón (GND), rojo (5 V), naranja (señal).', que: 'Gira hasta un ángulo (0–180°) según el ancho del pulso de la señal.', datos: 'Se alimenta con 4.8–6 V; los pulsos se repiten cada 20 ms (50 Hz).', uso: 'Brazos robóticos, puertas, direcciones, radares.', cuid: 'Al moverse consume cientos de mA: mejor una fuente aparte.' },
    { k: 'HCSR04', name: 'Sensor ultrasónico HC-SR04', part: { type: 'HCSR04', id: 'US1', pins: ['j14', 'j15', 'j16', 'j17'], forcePower: 5, distance: 40 }, term: 'VCC (5 V), TRIG (disparo), ECHO (eco) y GND.', que: 'Mide distancia con ultrasonido: envía un chirrido y mide cuánto tarda el eco.', datos: 'De 2 cm a 400 cm; 5 V; necesita un pulso de 10 µs en TRIG.', uso: 'Parqueaderos, robots evasores, medir niveles.', cuid: 'ECHO entrega 5 V: con ESP32 (3.3 V) hay que bajarla con dos resistencias.' },
    { k: 'DHT11', name: 'Sensor de temperatura y humedad DHT11', part: { type: 'DHT11', id: 'DH1', pins: ['j14', 'j15', 'j16'], forcePower: 5 }, term: 'VCC, DATA y GND.', que: 'Mide temperatura y humedad relativa; envía los datos por un solo cable.', datos: '0–50 °C (±2 °C) y 20–90 % de humedad (±5 %).', uso: 'Estaciones meteorológicas, invernaderos, domótica.', cuid: 'Lectura lenta: máximo una cada segundo o dos.' },
    { k: 'PIR', name: 'Sensor de movimiento PIR HC-SR501', part: { type: 'PIR', id: 'PIR1', pins: ['j14', 'j15', 'j16'], forcePower: 5 }, term: 'VCC, OUT y GND.', que: 'Detecta cambios de calor infrarrojo como el de una persona que se mueve.', datos: 'Alimentación 5–20 V; salida de 3.3 V; tiempo y sensibilidad ajustables.', uso: 'Alarmas, luces automáticas, contadores de personas.', cuid: 'Tarda hasta 1 minuto en «calentarse» al encenderlo.' },
    { k: 'LCDI2C', name: 'Pantalla LCD 16×2 con I²C', part: { type: 'LCDI2C', id: 'LCD1', pins: ['j14', 'j15', 'j16', 'j17'], forcePower: 5, screen: ['  Hola, mundo!  ', ' Circuitos Vivos'] }, term: 'GND, VCC, SDA y SCL.', que: 'Pantalla de 2 líneas de 16 caracteres que se maneja con solo dos cables de datos.', datos: 'Dirección I²C 0x27 o 0x3F (hay que averiguarla).', uso: 'Mostrar mediciones, mensajes y menús.', cuid: 'Ajustar el contraste con el tornillito de atrás si no se ve nada.' },
    { k: 'RELAYMOD', name: 'Módulo de relé', part: { type: 'RELAYMOD', id: 'K1', pins: ['j14', 'j15', 'j16'], forcePower: 5 }, term: 'VCC, GND e IN (señal); en el otro lado COM, NA y NC.', que: 'Interruptor accionado por una señal: aísla el Arduino de la carga.', datos: 'Bobina de 5 V; la mayoría se activa con nivel BAJO en IN.', uso: 'Manejar cargas de más tensión o corriente que las del Arduino.', cuid: 'No maneje la tensión de la pared sin supervisión de un adulto capacitado.' },
    { k: 'MPU6050', name: 'Acelerómetro-giroscopio MPU-6050', part: { type: 'MPU6050', id: 'IMU1', pins: ['j14', 'j15', 'j16', 'j17'], forcePower: 3.3 }, term: 'VCC, GND, SCL y SDA.', que: 'Mide aceleración y giro en tres ejes.', datos: 'Interfaz I²C, dirección 0x68. Alimentación de 3.3 V a 5 V en la placa de módulo.', uso: 'Inclinación, vibraciones, equilibrio, física del movimiento.', cuid: 'Mantenerlo quieto al calibrar.' }
  ];
  const byK = (k) => CAT.find((c) => c.k === k);

  /* 2.1 Catálogo */
  EM.defineSim('catalogo', function (sim) {
    let cur = CAT[0];
    const scene = { boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [], parts: [], wires: [], env: { lux: 300, temp: 25 } };
    EM.Lab.mount(sim, {
      onReady: () => { ['lux', 'temp', 'color'].forEach((c) => { if (sim.ctl[c]) sim.ctl[c].show(cur.ctl === c); }); },
      aspect: 1.9, scene, bare: true, focusParts: true, below: true, hint: 'Elija una pieza en la lista. Arrastre el potenciómetro, pulse el botón o cambie la luz.',
      controls: [
        { type: 'select', id: 'item', label: 'Pieza', options: CAT.map((c) => [c.k, c.name]), value: 'R', apply: (lab, v) => { cur = byK(v); lab.scene.parts = [JSON.parse(JSON.stringify(cur.part))]; lab.sel = lab.scene.parts[0].id; lab.scene.env = { lux: 300, temp: 25 }; lab.rebuild(); ['lux', 'temp', 'color'].forEach((c) => { if (sim.ctl[c]) sim.ctl[c].show(cur.ctl === c); }); } },
        { type: 'slider', id: 'lux', label: 'Luz que recibe la LDR', min: 1, max: 1000, log: true, value: 300, unit: 'lux', step: 1, fmt: (v) => String(Math.round(v)), apply: (lab, v) => { lab.scene.env.lux = v; } },
        { type: 'slider', id: 'temp', label: 'Temperatura del termistor', min: 0, max: 100, step: 1, value: 25, unit: '°C', apply: (lab, v) => { lab.scene.env.temp = v; } },
        { type: 'seg', id: 'color', label: 'Color del LED', options: [['rojo', 'Rojo'], ['verde', 'Verde'], ['azul', 'Azul'], ['blanco', 'Blanco']], value: 'rojo', apply: (lab, v) => { const p = lab.scene.parts[0]; if (p && p.type === 'LED') p.color = v; } }
      ],
      outs: [
        { id: 'que', label: 'Qué es', hl: true, fn: () => cur.que },
        { id: 'term', label: 'Terminales', fn: () => cur.term },
        { id: 'dat', label: 'Datos clave', fn: () => cur.datos },
        { id: 'uso', label: 'Se usa para', fn: () => cur.uso },
        { id: 'cui', label: 'Cuidado', fn: () => cur.cuid },
        { id: 'val', label: 'Valor en este momento', fn: (lab) => { const p = lab.scene.parts[0]; if (!p) return '—'; if (p.type === 'LDR') return sp.fmtR(sp.ldr(lab.scene.env.lux, 20000, 0.7)); if (p.type === 'NTC') return sp.fmtR(sp.ntc(lab.scene.env.temp)); if (p.type === 'POT') return 'cursor al ' + Math.round(PT.val(p, 'pos') * 100) + ' %: ' + sp.fmtR(PT.val(p, 'value') * PT.val(p, 'pos')) + ' / ' + sp.fmtR(PT.val(p, 'value') * (1 - PT.val(p, 'pos'))); if (p.type === 'R') return sp.fmtR(PT.val(p, 'value')); return '—'; } }
      ],
      panel: {
        aspect: 4.0, minH: '150px', label: 'Símbolo y terminales',
        draw(lab, cv) {
          const ctx = cv.ctx, p = lab.scene.parts[0];
          if (!p) return;
          const def = PT[p.type];
          const cx = cv.w * 0.2, cy = cv.h * 0.55, sc = Math.min(cv.h / 40, cv.w / 120);
          if (DW.sch && !def.module) DW.sch.symbol(ctx, p, cx, cy, sc);
          else if (def.module) { EM.text(ctx, 'módulo', cx, cy, { size: 14, color: '--ink-3', align: 'center' }); }
          EM.text(ctx, 'Símbolo', cx, 22, { size: 13, color: '--ink-2', weight: 700, align: 'center' });
          EM.text(ctx, 'Terminales', cv.w * 0.45, 22, { size: 13, color: '--ink-2', weight: 700, align: 'left' });
          const names = def.pinNames || [];
          names.forEach((n, i) => {
            const y = 50 + i * 22;
            if (y > cv.h - 8) return;
            ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cv.w * 0.45 + 5, y, 5, 0, 7); ctx.fill();
            EM.text(ctx, String(i + 1), cv.w * 0.45 + 5, y, { size: 8, color: '--accent-ink', weight: 800, align: 'center', baseline: 'middle' });
            EM.text(ctx, n, cv.w * 0.45 + 18, y + 1, { size: 12.5, color: '--ink', align: 'left', weight: 600 });
          });
        }
      }
    });
  });

  /* 2.2 Tabla de símbolos */
  EM.defineSim('simbolos', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 2.6 });
    const SY = [['R', 'Resistencia'], ['POT', 'Potenciómetro'], ['LDR', 'Fotorresistencia'], ['NTC', 'Termistor NTC'], ['C', 'Condensador'], ['ECAP', 'Electrolítico'], ['D', 'Diodo'], ['LED', 'LED'], ['ZENER', 'Diodo Zener'], ['BAT', 'Pila / batería'],
      ['SW', 'Interruptor'], ['BTN', 'Pulsador'], ['BJT', 'Transistor NPN'], ['NMOS', 'MOSFET canal N'], ['MOTOR', 'Motor'], ['BUZ', 'Zumbador'], ['LAMP', 'Bombillo'], ['FUSE', 'Fusible'], ['L', 'Bobina'], ['SIGGEN', 'Generador']];
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const cols = W < 560 ? 3 : 5, rows = Math.ceil(SY.length / cols);
      const cw = W / cols, ch = H / rows;
      SY.forEach(([t, name], i) => {
        const x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * ch + ch * 0.42;
        const p = { type: t, id: t, pos: 0.5, value: 1000, closed: false, model: 'BC547' };
        ctx.save();
        ctx.strokeStyle = EM.col('--rule'); ctx.lineWidth = 1; DW.rr(ctx, (i % cols) * cw + 6, Math.floor(i / cols) * ch + 6, cw - 12, ch - 12, 8); ctx.stroke(); ctx.restore();
        DW.sch.symbol(ctx, p, x, y, Math.min(cw / 30, ch / 17));
        EM.text(ctx, name, x, y + ch * 0.38, { size: Math.min(13, cw / 9), color: '--ink', align: 'center', weight: 700 });
      });
    });
  });

  /* 2.3 Reto de identificación */
  EM.defineSim('identifica', function (sim) {
    let seed = 20261102, cur = null, tries = 0, ok = 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const scene = { boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [], parts: [], wires: [], env: { lux: 300, temp: 25 } };
    let outMsg = '';
    const pick = (lab) => {
      let k; do { cur = CAT[Math.floor(rnd() * CAT.length)]; } while (cur.k === (pick.last || ''));
      pick.last = cur.k;
      const p = JSON.parse(JSON.stringify(cur.part)); p.id = '?';
      lab.scene.parts = [p]; lab.sel = null; lab.rebuild();
      outMsg = 'Elija el nombre de la pieza y pulse Comprobar.';
    };
    EM.Lab.mount(sim, {
      aspect: 2.2, scene, bare: true, noTip: true, focusParts: true, below: true, hint: 'Observe el cuerpo, las patas y las marcas.',
      controls: [
        { type: 'select', id: 'ans', label: 'Su respuesta', options: CAT.map((c) => [c.k, c.name]), value: 'R', apply: () => {} },
        { type: 'button', label: 'Comprobar', run: (lab) => { if (!cur) return; tries++; if (sim.p.ans === cur.k) { ok++; outMsg = '✔ Correcto: ' + cur.name + '. ' + cur.que; } else outMsg = '✘ No es ' + byK(sim.p.ans).name + '. Fíjese en ' + (cur.term.split('.')[0].toLowerCase()) + '.'; } },
        { type: 'button', label: 'Otra pieza', run: (lab) => pick(lab) }
      ],
      outs: [{ id: 'res', label: 'Resultado', hl: true, fn: () => outMsg }, { id: 'sc', label: 'Aciertos', fn: () => ok + ' de ' + tries }],
      onFrame: () => {}
    });
    const lab = sim.lab; pick(lab);
  });

  /* 2.4 Lámpara automática (LDR + divisor + LED por PWM) */
  EM.defineSim('lampara', function (sim) {
    const scene = {
      boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [{ id: 'uno', kind: 'uno', x: -78, y: 2 }],
      parts: [
        { id: 'LDR1', type: 'LDR', pins: ['g10', 'g13'] },
        { id: 'R1', type: 'R', value: 10000, pins: ['f13', 'f17'] },
        { id: 'R2', type: 'R', value: 220, pins: ['d22', 'd26'] },
        { id: 'D1', type: 'LED', color: 'amarillo', pins: ['c26', 'c27'] }
      ],
      wires: [{ a: '@5V', b: 'T+5' }, { a: 'T+5', b: 'j10' }, { a: 'j17', b: 'T-5' }, { a: 'T-3', b: '@GND' }, { a: 'j13', b: '@A0' }, { a: '@D9', b: 'a22' }, { a: 'a27', b: 'B-6' }, { a: 'B-3', b: '@GND', color: '#1e1e22' }],
      env: { lux: 300 },
      sch: {
        w: 28, h: 20,
        boxes: { uno: { at: [0, 1], w: 8, h: 18, title: 'UNO', part: 'uno', pins: { 0: [8, 3], 1: [8, 6], 2: [8, 14], 3: [8, 17] }, names: { 0: '5V', 1: 'A0', 2: 'D9', 3: 'GND' }, refs: { 0: 'uno:5V', 1: 'uno:A0', 2: 'uno:D9', 3: 'uno:GND' } } },
        parts: { LDR1: { at: [14, 4], rot: 90, lab: [1.8, 0] }, R1: { at: [14, 8], rot: 90, lab: [1.8, 0] }, R2: { at: [20, 14] }, D1: { at: [24, 16], rot: 90, lab: [1.8, 0] } },
        wires: [['uno.0', [10, 3], [10, 1], [14, 1], 'LDR1.0'], ['LDR1.1', [14, 6]], ['uno.1', [11, 6], [14, 6]], ['LDR1.1', 'R1.0'], ['uno.2', [18, 14], 'R2.0'], ['R2.1', 'D1.0'], ['D1.1', [24, 19], [11, 19], [11, 17], 'uno.3']],
        gnd: [[14, 10]], texts: [{ at: [8, 0], text: '+5 V', size: 0.9 }]
      }
    };
    /* corregir: el pin del medio de la LDR y R1 es la misma red; el esquema usa sus terminales */
    scene.sch.wires = [['uno.0', [10, 3], [10, 1], [14, 1], 'LDR1.0'], ['uno.1', [11, 6], [14, 6]], ['LDR1.1', 'R1.0'], ['uno.2', [18, 14], 'R2.0'], ['R2.1', 'D1.0'], ['D1.1', [24, 19], [11, 19], [11, 17], 'uno.3']];
    const code = 'void setup() {\n  pinMode(9, OUTPUT);\n}\n\nvoid loop() {\n  int luz = analogRead(A0);              // 0 (oscuro) ... 1023 (muy claro)\n  int brillo = map(luz, 0, 1023, 255, 0);  // más oscuro = más brillo\n  analogWrite(9, brillo);\n}\n';
    EM.Lab.mount(sim, {
      aspect: 1.75, scene, code, hint: 'Cambie la luz con el deslizador. Alterne entre Protoboard y Esquema.',
      controls: [{ type: 'slider', id: 'lux', label: 'Luz del ambiente', min: 1, max: 1000, log: true, value: 300, unit: 'lux', step: 1, fmt: (v) => String(Math.round(v)), apply: (lab, v) => { lab.scene.env.lux = v; } }],
      outs: [
        { id: 'ldr', label: 'Resistencia de la LDR', fn: (lab) => sp.fmtR(sp.ldr(lab.scene.env.lux, 20000, 0.7)) },
        { id: 'a0', label: 'Tensión en A0', hl: true, fn: (lab) => EM.fix(lab.bench.v('uno:A0'), 2) + ' V' },
        { id: 'led', label: 'Corriente del LED (promedio)', fn: (lab) => EM.fmtI(lab.bench.partCurrent(lab.scene.parts.find((p) => p.id === 'D1'))) }
      ]
    });
  });
})();
